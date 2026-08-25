import React from 'react';
import type { GeneratedPlan } from '../types';
import type { InteriorBridgeResult } from '../services/interiorBackdataBridge';

interface Props {
  plan: GeneratedPlan;
  bridgeStatus?: InteriorBridgeResult | null;
}

const money = (value: number | undefined | null) => new Intl.NumberFormat('ko-KR').format(Number(value || 0)) + '원';

export const ConnectedEstimateDetails: React.FC<Props> = ({ plan, bridgeStatus }) => {
  const materialTotal = (plan.costEstimate || []).reduce((sum, item) => sum + Number(item.materialCost || 0), 0);
  const laborTotal = (plan.costEstimate || []).reduce((sum, item) => sum + Number(item.laborCost || 0), 0);
  const grandTotal = (plan.costEstimate || []).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Backdata connected estimate</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">자재비 · 인건비 · 구매링크 상세</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${bridgeStatus?.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {bridgeStatus?.ok ? '백데이터 브릿지 응답' : '결정형 fallback / 브릿지 확인 필요'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">자재비 합계</div><div className="mt-1 font-bold">{money(materialTotal)}</div></div>
        <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">인건비 합계</div><div className="mt-1 font-bold">{money(laborTotal)}</div></div>
        <div className="rounded-xl bg-slate-900 p-4 text-white"><div className="text-xs text-slate-300">견적 합계</div><div className="mt-1 font-bold">{money(grandTotal)}</div></div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-3 text-left">공종/품목</th>
              <th className="px-3 py-3 text-right">수량</th>
              <th className="px-3 py-3 text-right">자재비</th>
              <th className="px-3 py-3 text-right">인건비</th>
              <th className="px-3 py-3 text-center">자재 찾기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(plan.costEstimate || []).map((item, index) => {
              const query = encodeURIComponent(`${item.category} ${item.item} ${item.remarks || ''}`.trim());
              const naver = `https://search.shopping.naver.com/search/all?query=${query}`;
              const coupang = `https://www.coupang.com/np/search?q=${query}`;
              return (
                <tr key={`${item.category}-${item.item}-${index}`}>
                  <td className="px-3 py-3"><div className="font-semibold text-slate-900">{item.category}</div><div className="text-slate-600">{item.item}</div><div className="mt-1 text-xs text-slate-400">{item.remarks}</div></td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{item.quantity} {item.unit}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{money(item.materialCost)}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{money(item.laborCost)}</td>
                  <td className="px-3 py-3"><div className="flex justify-center gap-2"><a className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700" href={naver} target="_blank" rel="noreferrer">네이버</a><a className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700" href={coupang} target="_blank" rel="noreferrer">쿠팡</a></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {plan.materialDetailSheet && plan.materialDetailSheet.length > 0 && (
        <div className="mt-5">
          <h4 className="font-bold text-slate-900">부자재/제품 상세 링크</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {plan.materialDetailSheet.map((mat, index) => {
              const query = encodeURIComponent(`${mat.item} ${mat.model || ''} ${mat.spec || ''}`.trim());
              const fallback = `https://search.shopping.naver.com/search/all?query=${query}`;
              const href = mat.link && /^https?:\/\//.test(mat.link) ? mat.link : fallback;
              return <a key={`${mat.item}-${index}`} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300"><div className="text-xs font-bold text-indigo-600">{mat.category}</div><div className="mt-1 font-bold text-slate-900">{mat.item}</div><div className="text-sm text-slate-600">{mat.model} · {mat.spec} · {mat.color}</div><div className="mt-2 text-xs text-slate-500">수량 {mat.quantity} · 예상 {money(mat.total)}</div><div className="mt-2 text-xs font-bold text-indigo-700">제품/검색 링크 열기 →</div></a>;
            })}
          </div>
        </div>
      )}
    </section>
  );
};
