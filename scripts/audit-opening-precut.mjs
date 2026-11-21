#!/usr/bin/env node
/**
 * HomeDesign read-only opening pre-cut verification.
 * Never edits SketchUp or makes openings. "READY" is an evidence gate only;
 * physical cuts still require an approved native SketchUp operation.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const reviewerKeys=['GEMINI_EYE','GEMINI','CODEX'];
const REQUIRED_IDS=[...Array.from({length:7},(_,i)=>'D0'+(i+1)),...Array.from({length:9},(_,i)=>'W0'+(i+1))];
const goodReview = x => x?.status==='EXECUTED_PASS'
  && typeof x.evidence_url==='string' && x.evidence_url.startsWith('https://')
  && typeof x.executed_at==='string' && x.executed_at.length>5;
const pos=n=>Number.isFinite(n)&&n>0;
const hasProof=x=>typeof x==='string' && x.trim().length>=8;
const pathType=t=>t==='EXISTENCE_UNCONFIRMED';

export function inspectOpening(o, context) {
 const issues=[];
 const needs=(ok,code)=>{if(!ok) issues.push(code)};
 const su=o.source_dimensions_mm||{},a=o.asset_candidate||{};
 const rough=o.rough_opening_dimensions_mm||{},frame=a.actual_dimensions_mm||{},gap=o.installation_clearance_mm||{};
 const protectedNewCut=o.id==='D07'||o.new_cut_proposed===true||o.plan_evidence==='NO_KB_EXISTING_OPENING';
 const src=context?.source_inspection||{};
 needs(o.target_room_unit_verified===true,'UNIT_SUBTYPE_UNVERIFIED');
 needs(src.site_photos_of_customer_unit_verified===true,'CLIENT_UNIT_PHOTOS_MISSING');
 needs(src.kb_to_npay_same_subtype_confirmed===true,'KB_NPAY_EXACT_UNIT_TYPE_UNVERIFIED');
 needs(o.plan_evidence!=='NO_CLEAR_DIAGRAM'&&!pathType(o.type),'OPENING_EXISTENCE_UNVERIFIED');
 needs(pos(su.w)&&pos(su.h),'OPENING_CLEAR_W_H_UNMEASURED');
 needs(pos(su.wall_thickness),'WALL_THICKNESS_UNMEASURED');
 if(o.id.startsWith('W')){
   needs(Number.isFinite(su.sill_z),'WINDOW_SILL_ELEVATION_UNMEASURED');
   needs(Number.isFinite(su.head_z),'WINDOW_HEAD_ELEVATION_UNMEASURED');
 }
 needs(hasProof(o.source_dimension_evidence),'MEASUREMENT_EVIDENCE_MISSING');
 needs(hasProof(o.measured_by) && hasProof(o.measured_at),'MEASUREMENT_PROVENANCE_MISSING');
 needs(Array.isArray(o.field_photo_refs) && o.field_photo_refs.length>0,'FIELD_PHOTO_UNVERIFIED');
 needs(o.wall_structure_verified===true,'WALL_CONSTRUCTION_UNVERIFIED');
 needs(o.wall_permission_confirmed===true,'WALL_CUT_PERMISSION_UNVERIFIED');
 needs(a.asset_dimensions_accepted_for_target===true,'TARGET_ASSET_W_H_NOT_APPROVED');
 needs(pos(frame.w) && pos(frame.h),'REAL_COMPONENT_FRAME_W_H_UNVERIFIED');
 needs(hasProof(a.source_sha256),'REAL_ASSET_SOURCE_SHA_UNVERIFIED');
 needs(pos(rough.w) && pos(rough.h),'ROUGH_OPENING_W_H_UNMEASURED');
 needs(Number.isFinite(gap.w) && gap.w>=0 && Number.isFinite(gap.h) && gap.h>=0,'FRAME_INSTALL_CLEARANCE_UNMEASURED');
 if(pos(rough.w)&&pos(rough.h)&&pos(frame.w)&&pos(frame.h)&&Number.isFinite(gap.w)&&Number.isFinite(gap.h)){
   needs(rough.w-frame.w>=gap.w && rough.h-frame.h>=gap.h,'FRAME_DOES_NOT_FIT_MEASURED_ROUGH_OPENING');
 }
 if(o.id.startsWith('W')&&Number.isFinite(su.sill_z)&&Number.isFinite(su.head_z)&&pos(su.h)){
   needs(su.head_z>su.sill_z&&Math.abs((su.head_z-su.sill_z)-su.h)<10,'WINDOW_HEIGHT_SILL_HEAD_INCONSISTENT');
 }
 needs(a.rights_verified_for_use===true,'ASSET_RIGHTS_UNVERIFIED');
 needs(o.jamb_and_frame_clearance_verified===true,'ROUGH_OPENING_FRAME_GAP_UNVERIFIED');
 needs(o.leaf_swing_and_collision_verified===true,'OPENING_CLEARANCE_COLLISION_UNVERIFIED');
 needs(o.interference_to_other_services_checked===true,'MEP_AND_WATERPROOFING_UNVERIFIED');
 if(protectedNewCut){
   needs(o.proposed_new_cut_design_permitted===true,'NEW_CUT_APPROVAL_MISSING');
   needs(o.structural_engineer_approval===true,'STRUCTURAL_APPROVAL_MISSING');
   needs(o.actual_existing_opening_verified===true || o.approved_new_opening_detail===true,'NO_VERIFIED_OR_APPROVED_OPENING');
 }
 for(const key of reviewerKeys)
   needs(goodReview(o.reviews?.[key]),'INDEPENDENT_'+key+'_REVIEW_MISSING');
 return {id:o.id,zone:o.zone,type:o.type,
   result:issues.length?'HOLD_PRE_CUT':'EVIDENCE_READY_FOR_NATIVE_REVIEW',
   issues,cut_performed:false};
}

export function audit(manifest) {
 if(manifest?.schema!=='homedesign.apartment.opening.precut.v1')throw Error('Unknown manifest schema');
 const rows=manifest.openings.map(o=>inspectOpening(o,manifest));
 const seen=new Set();
 const duplicates=[];
 for(const r of rows){if(seen.has(r.id))duplicates.push(r.id);seen.add(r.id)}
 const missing_ids=REQUIRED_IDS.filter(id=>!seen.has(id));
 const unexpected_ids=rows.map(r=>r.id).filter(id=>!REQUIRED_IDS.includes(id));
 const ready=rows.filter(r=>r.result==='EVIDENCE_READY_FOR_NATIVE_REVIEW').length;
 return {
  project_id:manifest.project_id,
  last_good:manifest.latest_good,
  total_openings:rows.length,ready_for_native_review:ready,
  held:rows.length-ready,duplicate_ids:duplicates,missing_ids,unexpected_ids,
  model_cut_performed:false,
  status:ready===REQUIRED_IDS.length && rows.length===REQUIRED_IDS.length
    && !duplicates.length && !missing_ids.length && !unexpected_ids.length?'EVIDENCE_READY':'HOLD_NO_CUT',
  items:rows
 };
}

const args=process.argv.slice(2);
if(args.includes('--self-test')){
 const fixture={
  schema:'homedesign.apartment.opening.precut.v1',project_id:'SYNTHETIC_UNIT_TEST_ONLY',
  source_inspection:{site_photos_of_customer_unit_verified:false,kb_to_npay_same_subtype_confirmed:false},
  openings:[{id:'D07',zone:'KITCHEN_TO_BALCONY_B',type:'TURNING_DOOR_PROPOSED',
    new_cut_proposed:true,plan_evidence:'NO_KB_EXISTING_OPENING',source_dimensions_mm:{w:null,h:null,wall_thickness:null}}]
 };
 const a=audit(fixture);
 if(a.status!=='HOLD_NO_CUT'||!a.items[0].issues.includes('STRUCTURAL_APPROVAL_MISSING'))throw Error('unsafe D07 allowed');
 const second=JSON.parse(JSON.stringify(fixture));
 second.openings[0].source_dimensions_mm={w:800,h:2300,wall_thickness:160};
 second.openings[0].target_room_unit_verified=true;
 second.source_inspection={site_photos_of_customer_unit_verified:true,kb_to_npay_same_subtype_confirmed:true};
 second.openings[0].source_dimension_evidence='SYNTHETIC_TEST_PHOTO_NOT_REAL';
 second.openings[0].measured_by='synthetic-tester';second.openings[0].measured_at='synthetic-date';
 second.openings[0].field_photo_refs=['SYNTHETIC_IMAGE_TEST'];
 second.openings[0].wall_structure_verified=true;second.openings[0].wall_permission_confirmed=true;
 second.openings[0].asset_candidate={asset_dimensions_accepted_for_target:true,rights_verified_for_use:true};
 second.openings[0].jamb_and_frame_clearance_verified=true;second.openings[0].leaf_swing_and_collision_verified=true;
 second.openings[0].interference_to_other_services_checked=true;
 second.openings[0].reviews=Object.fromEntries(reviewerKeys.map(x=>[x,{status:'EXECUTED_PASS',evidence_url:'https://example.invalid/SYNTHETIC',executed_at:'SYNTHETIC'}]));
 const b=audit(second);
 if(b.items[0].result!=='HOLD_PRE_CUT'||!b.items[0].issues.includes('STRUCTURAL_APPROVAL_MISSING'))throw Error('fabricated dimensions bypassed structural check');
 second.openings[0].new_cut_proposed=false;
 second.openings[0].plan_evidence='KB_DIAGRAM_DOOR';
 const c=audit(second);
 if(!c.items[0].issues.includes('STRUCTURAL_APPROVAL_MISSING'))throw Error('D07 bypass via editable flags');
 const missing={...second,openings:[]};
 if(audit(missing).status!=='HOLD_NO_CUT'||audit(missing).missing_ids.length!==16)throw Error('missing opening IDs allowed');
 console.log('SELFTEST_PASS | D07 no-door-symbol or tampered flags blocked | missing 16 IDs blocked | dimensions without structural approval blocked');
 process.exit(0);
}
const idx=args.indexOf('--manifest');
if(idx<0||!args[idx+1]){
 console.error('Usage: node scripts/audit-opening-precut.mjs --manifest project-manifest.json [--enforce] or --self-test');
 process.exit(64);
}
const data=JSON.parse(readFileSync(args[idx+1],'utf8'));
const result=audit(data);
console.log(JSON.stringify(result,null,2));
if(args.includes('--enforce')&&result.status!=='EVIDENCE_READY')process.exitCode=2;
