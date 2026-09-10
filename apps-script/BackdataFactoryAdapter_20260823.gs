const INTERIOR_FACTORY_ADAPTER_VERSION='INTERIOR_FACTORY_ADAPTER_V1_20260823';
const INTERIOR_FACTORY_MASTER_ID='1C_CznU1Uo7dk-gKay3-oH8wFxutsGMlz27RSrbdVQwI';
const INTERIOR_FACTORY_APP_ID='APP_INTERIOR';
const INTERIOR_FACTORY_TARGET_ID='FPC_INTERIOR_20260823';

function runInteriorBackdataFactoryControl10m(){return runInteriorFactoryAdapter_(false);}
function checkInteriorBackdataFactoryAdapter(){return runInteriorFactoryAdapter_(true);}
function runInteriorApiAbQaControl(){return interiorFactoryApiWindow_();}

function runInteriorFactoryAdapter_(healthOnly){
  const now=new Date(),props=PropertiesService.getScriptProperties(),bucket=Utilities.formatDate(now,'Asia/Seoul','yyyyMMddHHmm').slice(0,11),key='INTERIOR_FACTORY_BUCKET';
  if(!healthOnly&&props.getProperty(key)===bucket)return{ok:true,skipped:true,reason:'SAME_10M_BUCKET',bucket:bucket,version:INTERIOR_FACTORY_ADAPTER_VERSION};
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return{ok:false,reason:'LOCK_BUSY'};
  try{
    const central=SpreadsheetApp.openById(INTERIOR_FACTORY_MASTER_ID),target=interiorFactoryTarget_(central),triggers=ScriptApp.getProjectTriggers().map(function(t){return t.getHandlerFunction();});
    const known=['processTaskQueue','estimateSeedGet','estimateT1Build','estimateT2Adapt','materialSeedGet','processBridgeResolve','estimateRunPythonPointer','estimateResultRegister'];
    const handlers=known.map(function(n){return{handler:n,present:typeof globalThis[n]==='function'};});
    const out={ok:true,appId:INTERIOR_FACTORY_APP_ID,target:target,handlers:handlers,existingTriggers:triggers,bucket:bucket,checkedAt:now.toISOString(),version:INTERIOR_FACTORY_ADAPTER_VERSION};
    interiorFactoryMark_(central,out);if(!healthOnly)props.setProperty(key,bucket);props.setProperty('INTERIOR_FACTORY_LAST_RESULT',JSON.stringify(out).slice(0,8000));return out;
  }finally{lock.releaseLock();}
}
function interiorFactoryApiWindow_(){const now=new Date(),hour=Number(Utilities.formatDate(now,'Asia/Seoul','H'));if([9,13,17,21].indexOf(hour)<0)return{ok:true,skipped:true,reason:'OUTSIDE_API_AB_WINDOW'};const props=PropertiesService.getScriptProperties(),key='INTERIOR_API_AB_'+Utilities.formatDate(now,'Asia/Seoul','yyyyMMdd')+'_'+hour;if(props.getProperty(key)==='Y')return{ok:true,skipped:true,reason:'WINDOW_ALREADY_RUN'};const out={ok:false,degraded:true,appId:INTERIOR_FACTORY_APP_ID,error:'API_EXECUTOR_NOT_MAPPED',decision:'MAP_APPROVED_PRICE_PRODUCT_RENDER_SOURCE_AFTER_DETERMINISTIC_BOM_FIXTURE',version:INTERIOR_FACTORY_ADAPTER_VERSION};interiorFactoryQa_(out,now);props.setProperty(key,'Y');return out;}
function interiorFactoryTarget_(central){const sh=central.getSheetByName('66_FACTORY_PRODUCTION_CONTROL');if(!sh||sh.getLastRow()<2)return{found:false};const rows=sh.getRange(2,1,sh.getLastRow()-1,26).getDisplayValues();for(let i=rows.length-1;i>=0;i--)if(String(rows[i][0])===INTERIOR_FACTORY_TARGET_ID)return{found:true,queens:Number(rows[i][5]||0),seed:Number(rows[i][6]||0),t1:Number(rows[i][7]||0),t2:Number(rows[i][8]||0),assets:Number(rows[i][9]||0),qualityGate:String(rows[i][18]||'')};return{found:false};}
function interiorFactoryMark_(central,out){const sh=central.getSheetByName('66_FACTORY_PRODUCTION_CONTROL');if(!sh||sh.getLastRow()<2)return;const rows=sh.getRange(2,1,sh.getLastRow()-1,26).getDisplayValues();for(let i=rows.length-1;i>=0;i--)if(String(rows[i][0])===INTERIOR_FACTORY_TARGET_ID){const present=out.handlers.filter(function(h){return h.present;}).map(function(h){return h.handler;});sh.getRange(i+2,25).setValue(present.length?'INTERIOR_ADAPTER_SOURCE_READY_RUNTIME_X2_REQUIRED':'INTERIOR_BOUND_HANDLER_MAPPING_REQUIRED');sh.getRange(i+2,26).setValue('LAST_ADAPTER='+out.checkedAt+';PRESENT='+present.join('|'));return;}}
function interiorFactoryQa_(out,now){const sh=SpreadsheetApp.openById(INTERIOR_FACTORY_MASTER_ID).getSheetByName('67_FACTORY_QA_AB_LOG');if(!sh)return;sh.appendRow(['QA_INTERIOR_'+Utilities.formatDate(now,'Asia/Seoul','yyyyMMdd_HH00'),Utilities.formatDate(now,'Asia/Seoul','yyyy-MM-dd HH:mm:ss')+' KST',INTERIOR_FACTORY_APP_ID,'ESTIMATE_FIXTURE_PENDING','OWN_BOM_QUEENS_SEED_T1_T2','APPROVED_API_ON','','','','','','','','','','','','','',out.error,'','API_EXECUTOR_MAPPING_REQUIRED','INTERIOR_FACTORY_ADAPTER_V1','PENDING']);}
