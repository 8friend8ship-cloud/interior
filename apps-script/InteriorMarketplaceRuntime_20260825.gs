var INTERIOR_MARKETPLACE_RUNTIME_VERSION_ = 'INTERIOR_MARKETPLACE_RUNTIME_V1_20260825';
var INTERIOR_MARKETPLACE_TRIGGER_SPEC_ = [
  {handler:'runInteriorBackdataFactoryControl10m', minutes:10},
  {handler:'runInteriorEstimateTemplateTick', minutes:5}
];

function interiorMarketplaceHealth(){
  var handlers = [
    'estimateSeedGet','estimateT1Build','estimateT2Adapt','estimateTemplateSave','estimateTemplateFetch',
    'estimateHistoryWrite','estimateHealth','materialSeedGet','processBridgeResolve','countryPackGet',
    'estimateRunPythonPointer','estimateResultRegister','kitchenDetailBuild','runInteriorBackdataFactoryControl10m'
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
      previousAt:last || null,
      runAt:now.toISOString()
    };
    props.setProperty('INTERIOR_TEMPLATE_TICK_LAST_AT', out.runAt);
    props.setProperty('INTERIOR_TEMPLATE_TICK_LAST_RESULT', JSON.stringify(out));
    return out;
  }finally{
    lock.releaseLock();
  }
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
