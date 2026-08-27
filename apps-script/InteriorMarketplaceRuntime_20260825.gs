var INTERIOR_MARKETPLACE_RUNTIME_VERSION_ = 'INTERIOR_MARKETPLACE_RUNTIME_V2_20260827';
var INTERIOR_MARKETPLACE_TRIGGER_SPEC_ = [
  {handler:'runInteriorBackdataFactoryControl10m', minutes:10},
  {handler:'runInteriorEstimateTemplateTick', minutes:5}
];

function interiorMarketplaceHealth(){
  var handlers = [
    'estimateSeedGet','estimateT1Build','estimateT2Adapt','estimateTemplateSave','estimateTemplateFetch',
    'estimateHistoryWrite','estimateHealth','materialSeedGet','processBridgeResolve','countryPackGet',
    'estimateRunPythonPointer','estimateResultRegister','kitchenDetailBuild','runInteriorBackdataFactoryControl10m',
    'runInteriorEstimateTemplateTick'
  ];
  var present = handlers.map(function(name){return {name:name,present:typeof globalThis[name] === 'function'};});
  return {
    ok:true,
    version:INTERIOR_MARKETPLACE_RUNTIME_VERSION_,
    handlers:present,
    triggers:inspectInteriorMarketplaceTriggers(),
    templatePolicy:interiorTemplatePolicy_(),
    checkedAt:new Date().toISOString()
  };
}

function inspectInteriorMarketplaceTriggers(){
  return ScriptApp.getProjectTriggers().map(function(trigger){
    return {
      handler:trigger.getHandlerFunction(),
      eventType:String(trigger.getEventType()),
      source:String(trigger.getTriggerSource()),
      uid:trigger.getUniqueId()
    };
  });
}

function installInteriorMarketplaceTriggers(){
  var before = inspectInteriorMarketplaceTriggers();
  var existing = ScriptApp.getProjectTriggers();
  INTERIOR_MARKETPLACE_TRIGGER_SPEC_.forEach(function(spec){
    var available = typeof globalThis[spec.handler] === 'function';
    if(!available) return;
    existing.filter(function(t){return t.getHandlerFunction() === spec.handler;}).slice(1).forEach(function(t){ScriptApp.deleteTrigger(t);});
    var hasOne = ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction() === spec.handler;});
    if(!hasOne) ScriptApp.newTrigger(spec.handler).timeBased().everyMinutes(spec.minutes).create();
  });
  var after = inspectInteriorMarketplaceTriggers();
  PropertiesService.getScriptProperties().setProperty('INTERIOR_MARKETPLACE_TRIGGER_READBACK', JSON.stringify(after));
  return {ok:true,version:INTERIOR_MARKETPLACE_RUNTIME_VERSION_,before:before,after:after};
}

function runInteriorEstimateTemplateTick(){
  var lock = LockService.getScriptLock();
  if(!lock.tryLock(5000)) return {ok:false,reason:'LOCK_BUSY'};
  try{
    var props = PropertiesService.getScriptProperties();
    var now = new Date();
    var last = props.getProperty('INTERIOR_TEMPLATE_TICK_LAST_AT');
    var promoted = interiorPromoteReadyQueens_();
    var out = {
      ok:true,
      version:INTERIOR_MARKETPLACE_RUNTIME_VERSION_,
      stages:['QUEENS','SEED','T1','T2','DEDICATED_TEMPLATE','CUSTOM_TEMPLATE','PERSONALIZED_VERSION'],
      handlers:{
        seed:typeof globalThis.estimateSeedGet === 'function',
        t1:typeof globalThis.estimateT1Build === 'function',
        t2:typeof globalThis.estimateT2Adapt === 'function',
        templateSave:typeof globalThis.estimateTemplateSave === 'function',
        templateFetch:typeof globalThis.estimateTemplateFetch === 'function'
      },
      promoted:promoted,
      previousAt:last || null,
      runAt:now.toISOString()
    };
    props.setProperty('INTERIOR_TEMPLATE_TICK_LAST_AT', out.runAt);
    props.setProperty('INTERIOR_TEMPLATE_TICK_LAST_RESULT', JSON.stringify(out).slice(0,9000));
    return out;
  }finally{
    lock.releaseLock();
  }
}

function interiorPromoteReadyQueens_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) return {ok:false,reason:'NO_ACTIVE_SPREADSHEET',processed:0};
  var q = ss.getSheetByName('QUEENS_SOURCE');
  var s = ss.getSheetByName('SEED_QUEUE');
  var t1 = ss.getSheetByName('TEMPLATE_STAGE_1');
  var t2 = ss.getSheetByName('TEMPLATE_STAGE_2');
  if(!q || !s || !t1 || !t2) return {ok:false,reason:'PIPELINE_SHEET_MISSING',processed:0};

  var qRows = q.getLastRow() > 1 ? q.getRange(2,1,q.getLastRow()-1,Math.max(14,q.getLastColumn())).getDisplayValues() : [];
  var seedRows = s.getLastRow() > 1 ? s.getRange(2,1,s.getLastRow()-1,Math.max(10,s.getLastColumn())).getDisplayValues() : [];
  var existingSource = {};
  seedRows.forEach(function(r){ if(String(r[2]||'')) existingSource[String(r[2])] = true; });
  var processed = [];

  qRows.forEach(function(r){
    var sourceId = String(r[0]||'').trim();
    var appId = String(r[1]||'').trim();
    var title = String(r[5]||'').trim();
    var summary = String(r[6]||'').trim();
    var keywords = String(r[7]||'').trim();
    var sourceUrl = String(r[8]||'').trim();
    var status = String(r[13]||'').trim().toUpperCase();
    if(appId !== 'APP_INTERIOR' || !sourceId || status !== 'READY' || existingSource[sourceId]) return;

    var stamp = Utilities.formatDate(new Date(),'Asia/Seoul','yyyyMMdd_HHmmss_SSS');
    var suffix = Utilities.getUuid().slice(0,8);
    var seedId = 'SEED_INTERIOR_'+stamp+'_'+suffix;
    var contentId = 'CONTENT_INTERIOR_'+stamp+'_'+suffix;
    var created = new Date().toISOString();
    var evidence = sourceUrl ? [sourceUrl] : [];
    var outline = {
      hook: summary || title,
      problem: title,
      evidence: sourceUrl,
      solution: 'verified estimate structure and project-specific delta',
      close: 'measurement and unit-rate gates before binding estimate'
    };
    var pack = {
      schema:'T2_INTERIOR_ESTIMATE_RENDER_V2',
      project_id:contentId,
      source_id:sourceId,
      area:null,
      room_scope:[],
      measurements:{status:'REQUIRED_FROM_USER_OR_VERIFIED_PLAN',items:[]},
      material_specs:[],
      unit_rates:{status:'CURRENT_MARKET_OR_CONTRACT_RATE_REQUIRED',items:[]},
      bom:{status:'PENDING_MEASUREMENTS',items:[]},
      labor:{status:'PENDING_SCOPE_AND_QUANTITY',items:[]},
      schedule:{status:'PENDING_SCOPE_SITE_CONDITIONS',items:[]},
      exclusions:['NOT_A_BINDING_QUOTE','NO_INVENTED_AREA_OR_QUANTITY','NO_INVENTED_UNIT_RATE','SITE_CONDITION_AND_ACCESS_NOT_VERIFIED'],
      evidence:evidence,
      uncertainty:{level:'HIGH_UNTIL_PROJECT_INPUT',reason:'Queens source is evidence/input, not a measured project estimate'},
      writer_template_id:'PTPL-PAUL-EXPERT-V1',
      output_gate:['MEASUREMENT_REQUIRED','UNIT_RATE_SOURCE_REQUIRED','FORMULA_LINEAGE_REQUIRED','ESTIMATE_READBACK_X2']
    };

    s.appendRow([seedId,'APP_INTERIOR',sourceId,title,'app audience',summary||title,keywords,sourceUrl,created,'TEMPLATE1_DONE']);
    t1.appendRow([contentId,'APP_INTERIOR',seedId,title,JSON.stringify(outline),JSON.stringify(evidence),created,'TEMPLATE2_DONE']);
    t2.appendRow([contentId,'APP_INTERIOR','APP_FRONT',title,'제목: '+title+'\n\nINTERIOR_ESTIMATE_PACKAGE: '+JSON.stringify(pack)+'\n\n출처: '+JSON.stringify(evidence),'면적·평면·현장사진·자재등급을 받으면 물량·단가·노무·공정·제외조건을 근거와 함께 확정합니다.','ko',created,'DRYWRITER_QUEUED']);
    existingSource[sourceId] = true;
    processed.push({sourceId:sourceId,seedId:seedId,contentId:contentId});
  });

  interiorCompletePendingFactoryTasks_(ss, processed);
  return {ok:true,processed:processed.length,items:processed};
}

function interiorCompletePendingFactoryTasks_(ss, promoted){
  if(!promoted || !promoted.length) return 0;
  var sh = ss.getSheetByName('TASK_QUEUE');
  if(!sh || sh.getLastRow()<2) return 0;
  var sourceMap = {};
  promoted.forEach(function(x){sourceMap[x.sourceId]=x;});
  var rows = sh.getRange(2,1,sh.getLastRow()-1,Math.min(13,sh.getLastColumn())).getValues();
  var completed = 0;
  rows.forEach(function(r,i){
    if(String(r[1]||'') !== 'APP_INTERIOR' || String(r[2]||'') !== 'FACTORY_CYCLE' || String(r[5]||'').toUpperCase() !== 'PENDING') return;
    var payload = {};
    try{ payload = JSON.parse(String(r[3]||'{}')); }catch(_e){}
    var sourceId = String(payload.input || payload.sourceId || '').trim();
    if(!sourceId || !sourceMap[sourceId]) return;
    var row = i+2;
    var now = new Date().toISOString();
    sh.getRange(row,6).setValue('COMPLETED');
    sh.getRange(row,9).setValue(now);
    sh.getRange(row,10).setValue(now);
    sh.getRange(row,12).clearContent();
    sh.getRange(row,13).setValue('RES_INTERIOR_PROMOTE_'+sourceMap[sourceId].contentId);
    completed++;
  });
  return completed;
}

function estimateTemplateVersionResolve(payload){
  payload = payload || {};
  var role = String(payload.userRole || 'CONSUMER').toUpperCase();
  var tier = String(payload.tier || 'FREE').toUpperCase();
  var requested = String(payload.templateMode || '');
  var userProfileId = String(payload.userProfileId || '');
  var base = requested || (role === 'CONSUMER' ? 'HOMEDESIGN_SIMPLE' : 'HOMEDESIGN_COST_MARGIN');
  if(tier === 'FREE'){
    return {ok:true,scope:'GENERAL',templateId:base,version:'GENERAL_'+base+'_V1_20260825',personalized:false};
  }
  if(userProfileId){
    return {ok:true,scope:'USER',templateId:'USER_CUSTOM_'+userProfileId,baseTemplateId:base,version:interiorUserTemplateVersion_(userProfileId),personalized:true};
  }
  return {ok:true,scope:'PROJECT',templateId:base,version:'PRO_'+base+'_V1_20260825',personalized:false};
}

function estimatePersonalizedTemplateBuild(payload){
  payload = payload || {};
  var resolved = estimateTemplateVersionResolve(payload);
  if(!resolved.ok) return resolved;
  var profile = {
    userProfileId:String(payload.userProfileId || ''),
    templateId:resolved.templateId,
    baseTemplateId:resolved.baseTemplateId || resolved.templateId,
    version:resolved.version,
    scope:resolved.scope,
    tradeOrder:Array.isArray(payload.tradeOrder) ? payload.tradeOrder : [],
    hiddenInternalFields:['executionCost','executionUnitPrice','margin','marginRate','internalNote','subcontractorCost'],
    clientVisibleFields:['category','description','spec','unit','quantity','salesUnitPrice','salesAmount','subtotal','adjustment','vat','finalTotal','clientNote'],
    clauses:Array.isArray(payload.clauses) ? payload.clauses : [],
    branding:payload.branding || {}
  };
  PropertiesService.getScriptProperties().setProperty('INTERIOR_USER_TEMPLATE_'+profile.userProfileId, JSON.stringify(profile).slice(0,9000));
  return {ok:true,profile:profile,lineage:{source:'USER_CUSTOM',previousVersion:payload.previousVersion || null,createdAt:new Date().toISOString()}};
}

function estimateTemplateLearningScope(payload){
  payload = payload || {};
  if(payload.userProfileId || payload.customerId || payload.projectId) return {scope:payload.userProfileId ? 'USER' : 'PROJECT',promoteToGeneral:false};
  if(Number(payload.validatedProjectCount || 0) >= 3 && payload.qaStatus === 'PASS') return {scope:'GENERAL',promoteToGeneral:true};
  return {scope:'PROJECT',promoteToGeneral:false};
}

function interiorUserTemplateVersion_(userProfileId){
  return 'USER_CUSTOM_'+userProfileId+'_'+Utilities.formatDate(new Date(),'Asia/Seoul','yyyyMMdd_HHmmss');
}

function interiorTemplatePolicy_(){
  return {
    free:['HOMEDESIGN_SIMPLE','STANDARD_REQUEST_FORM','PRODUCT_LINK','SIMPLE_CALC'],
    consumerPro:['COMPARE','TENDER','BOQ','FINISH_SCHEDULE','CONSTRUCTION_SCHEDULE','DRAWING','RENDER','VIDEO'],
    supplierFree:['REGISTER','BID','STANDARD_TEMPLATE','REQUEST_FORM_DISTRIBUTION'],
    supplierPro:['AUTO_QUOTE','BOQ','FINISH_SCHEDULE','CONSTRUCTION_SCHEDULE','RENDER','VIDEO','DEDICATED_APP','PUBLISH'],
    stages:['QUEENS','SEED','T1','T2','DEDICATED_TEMPLATE','CUSTOM_TEMPLATE','PERSONALIZED_VERSION'],
    isolation:'USER_AND_PROJECT_CUSTOM_DATA_MUST_NOT_BACKPROPAGATE_TO_GENERAL_WITHOUT_MULTI_PROJECT_QA'
  };
}
