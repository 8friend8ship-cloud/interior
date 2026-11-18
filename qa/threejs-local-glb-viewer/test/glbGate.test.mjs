import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectGlb,inspectManifest} from '../src/glbGate.mjs';
function glb(doc){
 const json=JSON.stringify(doc),data=new TextEncoder().encode(json);
 const n=Math.ceil(data.byteLength/4)*4;
 const a=new ArrayBuffer(20+n),v=new DataView(a),b=new Uint8Array(a);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,a.byteLength,true);
 v.setUint32(12,n,true);v.setUint32(16,0x4e4f534a,true);
 b.set(data,20);b.fill(32,20+data.length);
 return a;
}
const valid={asset:{version:'2.0'},meshes:[{primitives:[{attributes:{POSITION:0}}]}],nodes:[{mesh:0}]};
test('valid GLB v2 local structure',()=>assert.deepEqual(inspectGlb(glb(valid)),{meshCount:1,nodeCount:1,assetVersion:'2.0'}));
test('reject external URL in GLB',()=>assert.throws(()=>inspectGlb(glb({...valid,images:[{uri:'https://evil.example/track'}]})),/외부 URI/));
test('reject external relative file reference',()=>assert.throws(()=>inspectGlb(glb({...valid,buffers:[{uri:'private.bin'}]})),/외부 URI/));
test('reject wrong length',()=>{const a=glb(valid);new DataView(a).setUint32(8,999,true);assert.throws(()=>inspectGlb(a),/길이/);});
test('reject unsupported v1 header',()=>{const a=glb(valid);new DataView(a).setUint32(4,1,true);assert.throws(()=>inspectGlb(a),/v2/);});
test('no manifest always hold',()=>assert.equal(inspectManifest(null,'f'.repeat(64)).status,'HOLD_SOURCE_PROVENANCE'));
test('manifest hash mismatch rejected',()=>assert.throws(()=>inspectManifest(JSON.stringify({glb_sha256:'a'.repeat(64)}),'b'.repeat(64)),/SHA256/));
test('rights pending holds even if sha matches',()=>assert.equal(inspectManifest(JSON.stringify({glb_sha256:'a'.repeat(64),rights_status:'HOLD',source_verified:false}),'a'.repeat(64)).status,'HOLD_RIGHTS_OR_SOURCE'));
test('matching rights metadata remains local only',()=>assert.equal(inspectManifest(JSON.stringify({glb_sha256:'a'.repeat(64),rights_status:'APPROVED',source_verified:true}),'a'.repeat(64)).status,'SOURCE_METADATA_MATCH_LOCAL_ONLY'));
