import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {inspectGlb,digestSha256,inspectManifest,MAX_GLB_BYTES} from './glbGate.mjs';
const $=id=>document.getElementById(id);
const status=$('status'),receipt=$('receipt'),selected=$('selection'),stage=$('canvas');
const scene=new THREE.Scene();scene.background=new THREE.Color('#101820');
scene.add(new THREE.HemisphereLight(0xffffff,0x435066,2.2));
const sun=new THREE.DirectionalLight(0xffffff,2.0);sun.position.set(5,10,9);scene.add(sun);
const camera=new THREE.PerspectiveCamera(52,1,0.01,100000);camera.position.set(4,3,5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
const helper=new THREE.GridHelper(10,10,0x5d748b,0x31465b);scene.add(helper);
let model=null;
function disposeModel(){
 if(!model)return;
 model.traverse(o=>{
  if(o.geometry)o.geometry.dispose();
  const mats=o.material?Array.isArray(o.material)?o.material:[o.material]:[];
  mats.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose()});
 });scene.remove(model);model=null;selected.textContent='미선택';
}
function resize(){
 const w=stage.clientWidth,h=stage.clientHeight;
 if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
const observer=new ResizeObserver(resize);observer.observe(stage);resize();
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.addEventListener('pointerup',e=>{
 if(!model)return;
 const r=renderer.domElement.getBoundingClientRect();
 pointer.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObject(model,true);
 selected.textContent=hits.length?JSON.stringify({meshName:hits[0].object.name||'(unnamed)',objectType:hits[0].object.type},null,2):'미선택';
});
$('load').addEventListener('click',async()=>{
 const file=$('glb').files?.[0];if(!file){status.textContent='GLB 파일을 선택하세요';return}
 if(!file.name.toLowerCase().endsWith('.glb')||file.size>MAX_GLB_BYTES){status.textContent='120MB 이하의 .glb만 지원';return}
 status.textContent='파일 형식·SHA 검수 중…';receipt.textContent='검수 중';
 try{
  const bytes=await file.arrayBuffer(),struct=inspectGlb(bytes),sha=await digestSha256(bytes);
  const manifest=$('manifest').files?.[0];
  if(manifest && manifest.size>128*1024)throw new Error('검수 JSON 파일은 128KB 이하로 제한');
  const proof=inspectManifest(manifest?await manifest.text():null,sha);
  // File never leaves the browser; a failed resource must not replace current model.
  const gltf=await new GLTFLoader().parseAsync(bytes,'');
  const next=gltf.scene;
  const box=new THREE.Box3().setFromObject(next),sphere=new THREE.Sphere();box.getBoundingSphere(sphere);
  if(!Number.isFinite(sphere.radius)||sphere.radius<=0)throw new Error('표시 가능한 기하 바운드가 없습니다');
  disposeModel();model=next;scene.add(model);
  const dist=Math.max(sphere.radius*2.8,0.2);const offset=new THREE.Vector3(1,0.7,1).normalize().multiplyScalar(dist);
  camera.position.copy(sphere.center).add(offset);
  camera.near=Math.max(dist/1000,0.001);camera.far=Math.max(dist*100,100);
  camera.updateProjectionMatrix();controls.target.copy(sphere.center);controls.update();
  helper.position.set(sphere.center.x,box.min.y,sphere.center.z);helper.scale.setScalar(Math.max(0.1,sphere.radius/5));
  status.textContent=proof.status+'\n화면 조작 QA 후보: 렌더 성공 여부는 Chrome 실검수 필요\nROOM/QTO/견적/배포: HOLD';
  receipt.textContent=JSON.stringify({file:file.name,bytes:file.size,sha256:sha,...struct,source:proof.source,rights:proof.rights,scope:'BROWSER_LOCAL_ONLY',qto_approved:false,publish_approved:false},null,2);
 }catch(err){status.textContent='HOLD: '+(err instanceof Error?err.message:String(err));receipt.textContent='검수 실패 (파일을 서버로 전송하지 않았음)'}
});
