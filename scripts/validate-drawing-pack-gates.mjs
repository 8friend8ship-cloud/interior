#!/usr/bin/env node
// HOME DESIGN drawing gate. No background agent calls and no new scheduled jobs.
// Usage: node scripts/validate-drawing-pack-gates.mjs --receipt <file.json> --mode draft|customer|order
// A review receipt describes executions that already happened; this tool never invents them.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(here,'../config/drawing-crosscheck-pack-gates.v1.json'),'utf8'));
const ids=config.workflow.map(s=>s.id);
const passes=(o)=>Boolean(o && o.status==='EXECUTED_PASS' && o.evidence_url && o.finished_at && o.agent_or_tool_version);
const isUrl=(v)=>typeof v==='string' && /^https:\/\//.test(v);

export function verifyDrawingReceipt(r,mode='draft'){
  if(!['draft','customer','order'].includes(mode))throw Error('invalid mode');
  const issues=[],warnings=[];
  const need=(ok,msg)=>{if(!ok)issues.push(msg)};
  need(r && typeof r.project_id==='string'&&r.project_id.length>2,'project_id missing');
  need(Array.isArray(r?.stages),'stages array missing');
  const stageMap=new Map((r?.stages||[]).map(x=>[x.id,x]));
  ids.forEach(id=>{const e=stageMap.get(id);need(passes(e),'stage '+id+' lacks an actual execution receipt');});
  const source=r?.source_comparison||{};
  need(isUrl(source.kb_url),'KB source URL missing');
  need(isUrl(source.npay_url),'Npay/Naver source URL missing');
  need(source.same_complex_and_unit_type===true,'exact complex/type match unverified');
  need(source.rotated_and_mirror_checked===true,'rotation/mirror compare not evidenced');
  for(const stage of ['pre','post']){
    for(const pack of ['gemini_eye','gemini_pack','codex_pack','aside_rea']){
      need(passes(r?.reviews?.[stage]?.[pack]),stage+' '+pack+' has no independent executed review receipt');
    }
  }
  need(r?.original_skps_unmodified===true,'source SKP original preservation unverified');
  need(isUrl(r?.artifacts?.skp_or_model_url),'model URL missing');
  need(isUrl(r?.artifacts?.top_view_url),'top view evidence missing');
  need(isUrl(r?.artifacts?.iso_view_url),'isometric view evidence missing');
  need(r?.geometry_checks?.native_reopen_x1_x2===true,'native reopen X1/X2 missing');
  need(r?.geometry_checks?.all_rooms_reachable===true,'room graph connectivity missing');
  need(r?.geometry_checks?.door_window_collisions_checked===true,'door/window collision checks missing');
  need(r?.estimate_checks?.unique_physical_opening_ids===true,'unique opening IDs or duplicate-billing audit missing');
  need(r?.estimate_checks?.sash_inner_outer_double_separated===true,'single/double/inner/outer sash classification missing');
  need(r?.estimate_checks?.sliding_balcony_counted_as_sash===true,'balcony sliding and ABS door duplicate check missing');
  if(mode!=='draft'){
    need(r?.unit_verified_on_site===true,'exact customer unit not verified on site');
    need(r?.field_measurements?.all_required_door_and_sash_clear_w_h===true,'measured W x H for all doors/sashes absent');
    need(r?.field_measurements?.photo_and_measurement_provenance===true,'field photo and measurement evidence absent');
    need(r?.estimate_checks?.current_product_prices_verified===true,'current product price evidence absent');
  }
  if(mode==='order'){
    need(r?.field_measurements?.structural_and_kitchen_turning_approval===true,'structural and turning-door approval absent');
    need(r?.field_measurements?.door_leaf_swing_and_clear_path_verified===true,'actual hinge swing/access path not verified');
  }
  if(issues.length && mode==='draft')warnings.push('DRAFT_ONLY: final customer quote/order NOT APPROVED');
  const approved=issues.length===0;
  return {decision:approved?'EXECUTED_PASS':mode==='draft'?'DRAFT_HOLD':'REJECT_FINAL',mode,config_schema:config.schema,checks:ids.length,issues,warnings};
}

const args=process.argv.slice(2);
if(args.includes('--self-test')){
  const blank=verifyDrawingReceipt({},'order');
  if(blank.decision!=='REJECT_FINAL'||blank.issues.length<10)throw Error('gate failed negative test');
  console.log('SELF_TEST_PASS: incomplete receipt blocked for order; no artificial pass emitted');
  process.exit(0);
}
const idx=args.indexOf('--receipt');
const modeIx=args.indexOf('--mode');
if(idx<0||!args[idx+1]){
  console.error('Usage: node scripts/validate-drawing-pack-gates.mjs --receipt <receipt.json> --mode draft|customer|order');
  process.exit(64);
}
const receipt=JSON.parse(readFileSync(resolve(args[idx+1]),'utf8'));
const mode=modeIx>=0?args[modeIx+1]:'draft';
const result=verifyDrawingReceipt(receipt,mode);
console.log(JSON.stringify(result,null,2));
process.exitCode=result.decision==='EXECUTED_PASS'||mode==='draft'?0:2;
