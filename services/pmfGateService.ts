export interface PmfContext { ok:boolean; appId:string; stage:number; gateResult:string; gate?:Record<string,unknown>|null; customerSegments?:Array<Record<string,unknown>>; painEvidence?:Array<Record<string,unknown>>; pendingMarketBriefs?:Array<Record<string,unknown>>; frontRule?:string; wtpRule?:string; error?:string; }

export async function getHomeEstimatePmfContext():Promise<PmfContext>{
  const response=await fetch('/api/pmf-context?appId=APP_HOME_ESTIMATE',{headers:{Accept:'application/json'},cache:'no-store'});
  const payload=await response.json() as PmfContext;
  if(!response.ok||!payload.ok)throw new Error(payload.error||'PMF 고객 증거를 불러오지 못했습니다.');
  return payload;
}

export async function recordHomeCustomerVoice(rawText:string,extra:Record<string,unknown>={}){
  const response=await fetch('/api/pmf-context',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pmf_record_voc',appId:'APP_HOME_ESTIMATE',rawText,sourceType:'FRONT_APP',...extra})});
  const payload=await response.json();
  if(!response.ok||!payload.ok)throw new Error(payload.error||'고객 의견 저장 실패');
  return payload;
}
