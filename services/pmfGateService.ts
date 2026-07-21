export interface PmfContext {
  ok:boolean;
  appId:string;
  stage:number;
  gateResult:string;
  gate?:Record<string,unknown>|null;
  customerSegments?:Array<Record<string,unknown>>;
  painEvidence?:Array<Record<string,unknown>>;
  pendingMarketBriefs?:Array<Record<string,unknown>>;
  frontRule?:string;
  wtpRule?:string;
  error?:string;
}

export async function getHomeEstimatePmfContext():Promise<PmfContext>{
  const response=await fetch('/api/pmf-context?appId=APP_HOME_ESTIMATE',{headers:{Accept:'application/json'},cache:'no-store'});
  const payload=await response.json() as PmfContext;
  if(!response.ok||!payload.ok)throw new Error(payload.error||'PMF 고객 증거를 불러오지 못했습니다.');
  return payload;
}

export function readHomeEstimatePmfContext():PmfContext|null{
  if(typeof window==='undefined')return null;
  return ((window as any).__PMF_CONTEXT__ as PmfContext)||null;
}

export function buildHomeEstimatePmfPrompt():string{
  const context=readHomeEstimatePmfContext();
  if(!context)return 'PMF_CONTEXT_NOT_LOADED: 고객 세그먼트와 시장 검증을 확정적으로 주장하지 말 것.';
  return [
    '*** CUSTOMER AND PMF EVIDENCE CONTEXT ***',
    `Stage: ${context.stage||1}`,
    `GateResult: ${context.gateResult||'RESEARCH_REQUIRED'}`,
    `Gate: ${JSON.stringify(context.gate||{})}`,
    `CustomerSegments: ${JSON.stringify((context.customerSegments||[]).slice(0,5))}`,
    `PainEvidence: ${JSON.stringify((context.painEvidence||[]).slice(0,10))}`,
    `FrontRule: ${context.frontRule||''}`,
    'When GateResult is RESEARCH_REQUIRED, do not describe customer demand, willingness to pay, market fit, or unit prices as verified facts.',
    'Prioritize the customer job: understand and compare a real estimate before contract, identify omitted items and extra-cost risks, and prepare questions for the contractor.',
    'Distinguish verified inputs, reference estimates, assumptions, and items requiring site inspection.'
  ].join('\n');
}

export async function recordHomeCustomerVoice(rawText:string,extra:Record<string,unknown>={}){
  const response=await fetch('/api/pmf-context',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pmf_record_voc',appId:'APP_HOME_ESTIMATE',rawText,sourceType:'FRONT_APP',...extra})});
  const payload=await response.json();
  if(!response.ok||!payload.ok)throw new Error(payload.error||'고객 의견 저장 실패');
  return payload;
}
