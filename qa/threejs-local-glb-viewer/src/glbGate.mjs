export const MAX_GLB_BYTES = 120 * 1024 * 1024;
const decoder = new TextDecoder('utf-8', {fatal:true});
export function inspectGlb(bytes){
  if (!(bytes instanceof ArrayBuffer)) throw new Error('GLB ArrayBuffer가 필요합니다');
  if (bytes.byteLength < 20 || bytes.byteLength > MAX_GLB_BYTES) throw new Error('GLB 파일 크기가 허용 범위 밖입니다');
  const v = new DataView(bytes);
  if (v.getUint32(0,true) !== 0x46546c67 || v.getUint32(4,true) !== 2) throw new Error('GLB v2 형식이 아닙니다');
  if (v.getUint32(8,true) !== bytes.byteLength) throw new Error('GLB 바이트 길이 불일치');
  const jsonLength=v.getUint32(12,true);
  if (v.getUint32(16,true)!==0x4e4f534a || jsonLength===0 || jsonLength > 16*1024*1024 || jsonLength+20>bytes.byteLength) throw new Error('GLB JSON 청크가 잘못됐습니다');
  let doc;
  try {doc=JSON.parse(decoder.decode(new Uint8Array(bytes,20,jsonLength)).trim())}
  catch {throw new Error('GLB JSON 파싱 실패')}
  if (doc.asset?.version !== '2.0' || !Array.isArray(doc.meshes) || doc.meshes.length===0) throw new Error('GLB 2.0 메시가 없습니다');
  const refs=[...(doc.buffers??[]),...(doc.images??[])];
  // External resources may leak private project paths or cause network requests.
  for (const x of refs) if (typeof x?.uri === 'string' && !x.uri.startsWith('data:'))
    throw new Error('외부 URI가 있는 GLB는 로컬 격리 검수에서 거부됩니다');
  if ((doc.extensionsRequired??[]).some(x=>['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'].includes(x)))
    throw new Error('외부 디코더가 필요한 GLB는 현재 지원하지 않습니다');
  return {meshCount:doc.meshes.length,nodeCount:(doc.nodes??[]).length,assetVersion:doc.asset.version};
}
export async function digestSha256(bytes){
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function inspectManifest(raw,sha){
  if (raw===null) return {status:'HOLD_SOURCE_PROVENANCE',source:'미제공',rights:'미검증'};
  let m;
  try {m=JSON.parse(raw)} catch {throw new Error('검수 JSON 파싱 실패')}
  if (!/^[0-9a-f]{64}$/i.test(m.glb_sha256??'') || m.glb_sha256.toLowerCase()!==sha) throw new Error('검수 JSON과 GLB SHA256이 일치하지 않습니다');
  const source=String(m.asset_id??'').slice(0,96)||'미지정';
  const approved=m.rights_status==='APPROVED' && m.source_verified===true;
  return {status: approved?'SOURCE_METADATA_MATCH_LOCAL_ONLY':'HOLD_RIGHTS_OR_SOURCE',source,rights:String(m.rights_status??'미검증')};
}
