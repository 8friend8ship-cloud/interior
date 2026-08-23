const INTERIOR_T2_ESTIMATE_REPAIR_VERSION='INTERIOR_T2_ESTIMATE_REPAIR_V1_20260823';

/**
 * Converts generic APP_INTERIOR T2 rows into the canonical estimate contract.
 * It is deliberately fail-closed: no area, measurement, material quantity,
 * labor, rate, or price is invented when the source does not provide it.
 */
function repairInteriorGenericT2ToEstimatePackage(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss&&ss.getSheetByName('TEMPLATE_STAGE_2');
  if(!sh||sh.getLastRow()<2)return{ok:false,reason:'TEMPLATE_STAGE_2_MISSING_OR_EMPTY',fixed:0,version:INTERIOR_T2_ESTIMATE_REPAIR_VERSION};
  const last=sh.getLastRow(),start=Math.max(2,last-30),rows=sh.getRange(start,1,last-start+1,9).getValues();
  let fixed=0;
  rows.forEach(function(r,idx){
    if(String(r[1])!=='APP_INTERIOR')return;
    const body=String(r[4]||'');if(!interiorT2NeedsRepair_(body))return;
    const title=String(r[3]||'').trim(),urls=interiorT2EvidenceUrls_(body);
    const pack=interiorT2BuildFailClosedPack_(String(r[0]||''),title,urls,interiorT2Hook_(body));
    sh.getRange(start+idx,5).setValue('제목: '+title+'\n\nINTERIOR_ESTIMATE_PACKAGE: '+JSON.stringify(pack)+'\n\n출처: '+JSON.stringify(urls));
    sh.getRange(start+idx,6).setValue('면적·평면·현장사진·자재등급을 받으면 물량·단가·노무·공정·제외조건을 근거와 함께 확정합니다.');
    fixed++;
  });
  return{ok:true,fixed:fixed,readback:auditInteriorEstimateT2(),version:INTERIOR_T2_ESTIMATE_REPAIR_VERSION};
}
function interiorT2BuildFailClosedPack_(contentId,title,urls,summary){
  return{
    schema:'T2_INTERIOR_ESTIMATE_RENDER_V2',
    project_id:contentId||('PREBUILD_'+new Date().getTime()),
    area:null,
    room_scope:[],
    measurements:{status:'REQUIRED_FROM_USER_OR_VERIFIED_PLAN',items:[]},
    material_specs:[],
    unit_rates:{status:'CURRENT_MARKET_OR_CONTRACT_RATE_REQUIRED',items:[]},
    bom:{status:'PENDING_MEASUREMENTS',items:[]},
    labor:{status:'PENDING_SCOPE_AND_QUANTITY',items:[]},
    schedule:{status:'PENDING_SCOPE_SITE_CONDITIONS',items:[]},
    exclusions:['NOT_A_BINDING_QUOTE','NO_INVENTED_AREA_OR_QUANTITY','NO_INVENTED_UNIT_RATE','SITE_CONDITION_AND_ACCESS_NOT_VERIFIED','VAT_AND_DISPOSAL_ONLY_WHEN_SOURCE_OR_REQUEST_SPECIFIES'],
    evidence:urls||[],
    uncertainty:{level:'HIGH_UNTIL_PROJECT_INPUT',reason:'market/contract evidence is not a measured project estimate'},
    writer_template_id:'PTPL-PAUL-EXPERT-V1',
    render_scene:null,
    material_alternatives:[],
    defect_risk:[],
    consultation_notes:summary||'',
    report_summary:title,
    output_gate:['MEASUREMENT_REQUIRED','UNIT_RATE_SOURCE_REQUIRED','FORMULA_LINEAGE_REQUIRED','ESTIMATE_READBACK_X2']
  };
}
function auditInteriorEstimateT2(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss&&ss.getSheetByName('TEMPLATE_STAGE_2');
  if(!sh||sh.getLastRow()<2)return{ok:false,reason:'NO_T2'};
  const last=sh.getLastRow(),start=Math.max(2,last-30),rows=sh.getRange(start,1,last-start+1,9).getDisplayValues();
  const app=rows.filter(function(r){return String(r[1])==='APP_INTERIOR';});
  const shaped=app.filter(function(r){return String(r[4]).indexOf('INTERIOR_ESTIMATE_PACKAGE')>=0;});
  const generic=app.filter(function(r){return interiorT2NeedsRepair_(r[4]);});
  return{ok:generic.length===0&&shaped.length>0,appRows:app.length,estimateRows:shaped.length,genericRows:generic.length,version:INTERIOR_T2_ESTIMATE_REPAIR_VERSION};
}
function interiorT2NeedsRepair_(body){const s=String(body||'');return s.indexOf('INTERIOR_ESTIMATE_PACKAGE')<0&&(s.indexOf('"solution":"practical steps"')>=0||s.indexOf('solution":"practical steps')>=0);}
function interiorT2EvidenceUrls_(body){const out=[];String(body||'').replace(/https?:\/\/[^\s"\\\]]+/g,function(u){u=u.replace(/[),.]+$/,'');if(out.indexOf(u)<0)out.push(u);return u;});return out.slice(0,10);}
function interiorT2Hook_(body){const m=String(body||'').match(/"hook":"([^"]{1,1500})"/);return m?m[1]:'';}
