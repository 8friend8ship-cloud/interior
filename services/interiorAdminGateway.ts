import type { PriceSuggestion, LaborSuggestion, MaterialDatabaseItem, UnitPrice } from '../types';

type AuditedEnvelope<T> = { resultId:string; auditId:string; payload:T };

const coreUrl = () => String((import.meta as any).env?.VITE_AGENT_CORE_URL || '').replace(/\/$/, '');

async function auditedPost<T>(action:string, input:unknown):Promise<T>{
  const base=coreUrl();
  if(!base) throw new Error('CENTRAL_INTERIOR_CORE_NOT_CONFIGURED');
  const response=await fetch(`${base}/api/interior/generate`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,input})
  });
  if(!response.ok) throw new Error(`CENTRAL_INTERIOR_CORE_HTTP_${response.status}`);
  const envelope=await response.json() as Partial<AuditedEnvelope<T>>;
  if(!envelope.resultId||!envelope.auditId||envelope.payload===undefined) throw new Error('CENTRAL_INTERIOR_CORE_RESULT_AUDIT_REQUIRED');
  return envelope.payload;
}

export const analyzeMarketPrices=(priceTable:UnitPrice[])=>auditedPost<PriceSuggestion[]>('INTERIOR_ADMIN_ANALYZE_MARKET_PRICES',{priceTable});
export const analyzeBasePrices=(priceTable:UnitPrice[],laborData:unknown)=>auditedPost<PriceSuggestion[]>('INTERIOR_ADMIN_ANALYZE_BASE_PRICES',{priceTable,laborData});
export const analyzeLaborCosts=(dailyWages:unknown)=>auditedPost<LaborSuggestion[]>('INTERIOR_ADMIN_ANALYZE_LABOR',{dailyWages});
export const discoverAndRefreshMaterials=(materials:MaterialDatabaseItem[],targetCategories:string[],mode:'scan_and_update'|'verify_only')=>auditedPost<{updates:MaterialDatabaseItem[];newItems:MaterialDatabaseItem[]}>('INTERIOR_ADMIN_REFRESH_MATERIALS',{materials,targetCategories,mode});
