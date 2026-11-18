#!/usr/bin/env python3
"""SEED_SKP_01 local-only partial QA GLB, derived from already-verified SketchUp Native X1/X2 JSON.
NO sketchup launch, NO source write, NO upload, NO business/QTO approval.
Outputs MUST stay inside protected local_reports. Does not export private geometry to GitHub.
"""
import argparse
import hashlib
import json
import math
import struct
from pathlib import Path

EXPECTED_SOURCE_SHA="2360937a7b3c0cf738c64721d6748282711bd7ea186f48d123d59d265d324a97"
INPUTS={
    "root":"SEED_SKP_01_ROOT_DIRECT_FACES_{run}_20261118.json",
    "cuts":"SEED_SKP_01_CUT_MESH_TRIANGLES_{run}_20261118.json",
    "groups":"SEED_SKP_01_FACE_TOPOLOGY_{run}_20261118.json",
    "holes":"SEED_SKP_01_FOUR_INNER_LOOP_NATIVE_MESH_V3_{run}_20261118.json",
}

def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda:f.read(1048576),b""):h.update(b)
    return h.hexdigest()

def cross(a,b,c):
    return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])

def polytri(points):
    """2D projection ear clipping, fail closed on untriangulable loops."""
    pp=[]
    for xyz in points:
        t=[float(x) for x in xyz]
        if len(t)!=3 or not all(map(math.isfinite,t)):return []
        if pp and sum((t[i]-pp[-1][i])**2 for i in range(3))<1e-8:continue
        pp.append(t)
    if len(pp)>2 and sum((pp[-1][i]-pp[0][i])**2 for i in range(3))<1e-8:pp.pop()
    if len(pp)<3 or len(pp)>4096:return []
    # Newell's normal
    n=[0.,0.,0.]
    for a,b in zip(pp,pp[1:]+pp[:1]):
        n[0]+=(a[1]-b[1])*(a[2]+b[2])
        n[1]+=(a[2]-b[2])*(a[0]+b[0])
        n[2]+=(a[0]-b[0])*(a[1]+b[1])
    drop=max(range(3),key=lambda i:abs(n[i]))
    if abs(n[drop])<1e-6:return []
    keep=[i for i in range(3) if i!=drop]
    q=[(p[keep[0]],p[keep[1]]) for p in pp]
    signed=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(q,q[1:]+q[:1]))
    if abs(signed)<1e-6:return []
    direction=1 if signed>0 else -1
    ids=list(range(len(pp)));out=[]
    for _ in range(len(pp)*len(pp)):
        if len(ids)==3:
            out.append([pp[i] for i in ids]);return out
        found=False
        for j in range(len(ids)):
            ip=ids[j-1];ic=ids[j];inx=ids[(j+1)%len(ids)]
            a,b,c=q[ip],q[ic],q[inx]
            if cross(a,b,c)*direction<=1e-8:continue
            # Inclusive point-in-triangle: holes and concavities guarded by rejecting stray point.
            obstructed=False
            for k in ids:
                if k in (ip,ic,inx):continue
                p=q[k]
                if cross(a,b,p)*direction>=-1e-7 and cross(b,c,p)*direction>=-1e-7 and cross(c,a,p)*direction>=-1e-7:
                    obstructed=True;break
            if obstructed:continue
            out.append([pp[ip],pp[ic],pp[inx]]);ids.pop(j);found=True;break
        if not found:break
    return []

def area3(tri):
    a,b,c=tri
    u=[b[i]-a[i] for i in range(3)];v=[c[i]-a[i] for i in range(3)]
    w=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
    return 0.5*math.sqrt(sum(x*x for x in w))

def triangles_from_face(face,area_key,outer_key):
    loops=face.get("loops",[])
    if len(loops)!=1 or not loops[0].get(outer_key):return [],"NON_SIMPLE_LOOP"
    t=polytri(loops[0]["vertices_mm"])
    if not t:return [],"UNTRIANGULABLE"
    nominal=float(face[area_key]);actual=sum(area3(z) for z in t)
    if nominal<=0 or abs(nominal-actual)>max(500,nominal*0.005):
        return [],"AREA_NOT_NATIVE"
    return t,None

def make_glb(groups,origin,out_path):
    data=bytearray();views=[];accessors=[];meshes=[];nodes=[];materials=[]
    colors=[[0.53,0.72,0.83,1],[0.76,0.76,0.68,1],[0.91,0.57,0.35,1]]
    for mi,(name,tris) in enumerate(groups):
        if not tris:continue
        offset=len(data)
        vertices=[]
        for tri in tris:
            for p in tri:
                # SketchUp Z-up (mm) to glTF Y-up (m), translate only XY for QA camera.
                x=(p[0]-origin[0])/1000;y=p[2]/1000;z=-(p[1]-origin[1])/1000
                vertices.extend((x,y,z))
        data.extend(struct.pack("<"+"f"*len(vertices),*vertices))
        n=len(vertices)//3
        views.append({"buffer":0,"byteOffset":offset,"byteLength":len(vertices)*4,"target":34962})
        cols=[vertices[i::3] for i in range(3)]
        mins=[min(a) for a in cols];maxs=[max(a) for a in cols]
        accessors.append({"bufferView":len(views)-1,"componentType":5126,"count":n,"type":"VEC3","min":mins,"max":maxs})
        mats={"pbrMetallicRoughness":{"baseColorFactor":colors[mi],"metallicFactor":0,"roughnessFactor":1},"doubleSided":True}
        materials.append(mats)
        meshes.append({"name":name,"primitives":[{"attributes":{"POSITION":len(accessors)-1},"material":len(materials)-1,"mode":4}]})
        nodes.append({"name":name,"mesh":len(meshes)-1})
    while len(data)%4:data.append(0)
    doc={"asset":{"version":"2.0","generator":"SEED01_VERIFIED_GEOMETRY_LOCAL_QA_PARTIAL_ONLY"},
      "scene":0,"scenes":[{"nodes":list(range(len(nodes)))}],"nodes":nodes,"meshes":meshes,
      "materials":materials,"buffers":[{"byteLength":len(data)}],"bufferViews":views,"accessors":accessors}
    j=json.dumps(doc,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode("utf-8")
    j+=b" "*((-len(j))%4)
    head=struct.pack("<III",0x46546c67,2,12+8+len(j)+8+len(data))
    output=head+struct.pack("<II",len(j),0x4e4f534a)+j+struct.pack("<II",len(data),0x004e4942)+data
    out_path.write_bytes(output)
    return {"bytes":len(output),"mesh_count":len(meshes),"glb_sha256":sha(out_path),
            "mesh_triangle_counts":{name:len(tris) for name,tris in groups}}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--root",type=Path,required=True)
    ap.add_argument("--run",choices=["X1","X2"],required=True)
    args=ap.parse_args()
    root=args.root.resolve();qacopy=root/"SEED_SKP_01_QA_COPY_READONLY.skp"
    assert qacopy.is_file() and sha(qacopy)==EXPECTED_SOURCE_SHA,"HOLD_SOURCE_SHA_MISMATCH"
    inputs={}
    for k,fmt in INPUTS.items():
        p=root/fmt.format(run=args.run)
        assert p.is_file(),f"HOLD_INPUT_MISSING_{k}"
        inputs[k]=(json.loads(p.read_text(encoding="utf-8-sig")),sha(p))
    f,c,g,h=(inputs[x][0] for x in ("root","cuts","groups","holes"))
    assert f["units"]=="MM" and f["root_direct_face_count"]==257 and len(f["root_faces"])==257
    assert c["root_faces_count"]==257 and c["cut_faces_count"]==4
    assert len(g["groups"])==2 and sum(len(x["faces"]) for x in g["groups"])==43
    assert h["status"].startswith("PASS_NATIVE_INNER_LOOP_FOUR_FACES") and h["model_guid"]==f["model_guid"]
    assert [v["face_pid"] for v in sorted(h["faces"],key=lambda x:x["face_pid"])]==[65826,66107,66247,325603]
    assert all(not z.get("rights_approved",False) and not z.get("qto_approved",False) for z in (f,c,g,h))
    cuts={int(v["face_pid"]):v for v in c["cut_faces"]}
    holes={int(v["face_pid"]):v for v in h["faces"]}
    assert not set(cuts).intersection(holes), "HOLD_HOLE_CUT_PID_COLLISION"
    hole_tri_count=sum(len(v["polygons_world_mm"]) for v in holes.values())
    roottris=[];cuttris=[];skipped=[];source_counter=0
    for face in f["root_faces"]:
        pid=int(face["persistent_id"])
        if pid in holes:
            n=holes[pid]
            out=n["polygons_world_mm"]
            native_area=float(face["face_area_mm2"])
            assert abs(native_area-float(n["face_area_mm2"]))<max(2,native_area*0.0001), "HOLD_HOLE_SOURCE_AREA"
            tri_area=sum(area3(t) for t in out)
            assert len(out)==n["triangle_count"] and all(len(t)==3 and area3(t)>0.01 for t in out), "HOLD_HOLE_MESH"
            assert abs(tri_area-native_area)<max(250,native_area*0.001), "HOLD_HOLE_AREA_CONSERVATION"
            roottris.extend(out);source_counter+=1
        elif pid in cuts:
            out=cuts[pid]["polygons_world_mm"]
            if not out or not all(len(t)==3 and area3(t)>0 for t in out):
                skipped.append(["CUT_TRIANGLE_INVALID",pid]);continue
            cuttris.extend(out);source_counter+=1
        else:
            ts,reason=triangles_from_face(face,"face_area_mm2","is_outer")
            if reason:skipped.append([reason,pid]);continue
            roottris.extend(ts);source_counter+=1
    # Use lower of two architectural shell candidates only; no environmental/background geometry.
    lower=min(g["groups"],key=lambda z:z["bounds_mm"]["max"][2])
    floortris=[];floors_used=0
    for face in lower["faces"]:
        if face.get("hidden") or not face.get("visible_context",False):continue
        ts,reason=triangles_from_face(face,"area_mm2","outer")
        if reason:skipped.append(["FLOOR_"+reason,int(face["persistent_id"])]);continue
        floortris.extend(ts);floors_used+=1
    if source_counter!=257 or len(cuttris)!=44 or floors_used<5 or skipped:
        raise RuntimeError(f"HOLD_INCOMPLETE_FACE_COVERAGE_ROOT_{source_counter}_CUT_{len(cuttris)}_FLOOR_{floors_used}_SKIPPED_{len(skipped)}")
    if source_counter<245 or len(cuttris)<40 or floors_used<5:
        raise RuntimeError(f"HOLD_TOO_MANY_SKIPPED_ROOT_{source_counter}_CUT_{len(cuttris)}_FLOOR_{floors_used}")
    allpts=[p for tri in roottris+cuttris+floortris for p in tri]
    origin=[(min(p[i] for p in allpts)+max(p[i] for p in allpts))/2 for i in (0,1)]
    outdir=root/"SEED01_LOCAL_GLB_QA_20261118"
    outdir.mkdir(exist_ok=True)
    outpath=outdir/f"SEED_SKP_01_PARTIAL_NATIVE_HOLEFIX_{args.run}.glb"
    assert not outpath.exists(), "HOLD_REFUSE_OVERWRITE_GLB"
    record=make_glb([("ROOT_WALL_PARTIAL_NO_QTO",roottris),("LOWER_SHELL_REFERENCE_ONLY",floortris),
                    ("NATIVE_CUT_MESH_INTACT",cuttris)],origin,outpath)
    record.update({"status":"PASS_LOCAL_PARTIAL_NATIVE_GEOMETRY_EXPORT__HOLD_RIGHTS_ROOM_QTO",
      "run":args.run,"scope":"PRIVATE_QA_ONLY","source_copy_sha256":EXPECTED_SOURCE_SHA,
      "input_sha256":{k:v[1] for k,v in inputs.items()},"root_faces_used":source_counter,
      "floor_faces_used":floors_used,"cut_face_count":len(cuts),"inner_hole_face_count":len(holes),"inner_hole_triangles":hole_tri_count,"degenerate_removed_by_native":sum(v["degenerate_triangles_excluded"] for v in holes.values()),"skipped_face_count":len(skipped),
      "skipped_reasons":{reason:sum(x[0]==reason for x in skipped) for reason,pid in skipped},
      "rights_approved":False,"room_qto_approved":False,"production_publish_approved":False,
      "full_scene_converted":False,"raw_geometry_uploaded":False})
    (outdir/f"SEED_SKP_01_PARTIAL_NATIVE_HOLEFIX_{args.run}_RECEIPT.json").write_text(
        json.dumps(record,indent=2,ensure_ascii=False,sort_keys=True)+"\n",encoding="utf-8")
    (outdir/f"SEED_SKP_01_PARTIAL_NATIVE_HOLEFIX_{args.run}_MANIFEST.json").write_text(
        json.dumps({"asset_id":"SEED_SKP_01_PARTIAL_PRIVATE_QA","glb_sha256":record["glb_sha256"],
                    "rights_status":"HOLD","source_verified":False},indent=2)+"\n",encoding="utf-8")
    assert sha(qacopy)==EXPECTED_SOURCE_SHA,"HOLD_SOURCE_CHANGED_AFTER_CONVERSION"
    print(json.dumps({k:v for k,v in record.items() if k not in ("input_sha256",)},ensure_ascii=False))

if __name__=="__main__":main()
