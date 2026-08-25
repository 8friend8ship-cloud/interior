import React from 'react';
import type { GeneratedPlan } from '../types';
import type { InteriorBridgeResult } from '../services/interiorBackdataBridge';

interface Props {
  plan: GeneratedPlan;
  bridgeStatus?: InteriorBridgeResult | null;
}

const money = (value: number | undefined | null) => {
  const amount = Number(value || 0);
  return amount > 0 ? new Intl.NumberFormat('ko-KR').format(amount) + '원' : '검증 전';
};

export const ConnectedEstimateDetails: React.FC<Props> = ({ plan, bridgeStatus }) => {
  const items = plan.costEstimate || [];
  const materialTotal = items.reduce((sum, item) => sum + Number(item.materialCost || 0), 0);
  const laborTotal = items.reduce((sum, item) => sum + Number(item.laborCost || 0), 0);
  const grandTotal = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const hasVerifiedPrice = bridgeStatus?.ok && items.length > 0 && grandTotal > 0;

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">견적 근거 확인</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">자재 · 인건비 · 구매 참고</h3>
          <p className="mt-1 text-sm text-slate-500">검증된 백데이터가 있는 항목만 금액으로 표시합니다.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${hasVerifiedPrice ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {hasVerifiedPrice ? '검증 백데이터 적용' : '일부 항목 확인 필요'}
        </span>
      </div>

      {!hasVerifiedPrice && (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
          현재 검증된 전체 BOM·단가가 충분하지 않습니다. 부족한 항목은 임의 가격으로 채우지 않으며, 백데이터가 확인되면 자동 반영됩니다.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">자재비 합계</div><div className="mt-1 font-bold">{money(materialTotal)}</div></div>
        <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">인건비 합계</div><div className="mt-1 font-bold">{money(laborTotal)}</div></div>
        <div className="rounded-xl bg-slate-900 p-4 text-white"><div className="text-xs text-slate-300">견적 합계</div><div className="mt-1 font-bold">{money(grandTotal)}</div></div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-3 text-left">공종/품목</th><th className="px-3 py-3 text-right">수량</th><th className="px-3 py-3 text-right">자재비</th><th className="px-3 py-3 text-right">인건비</th><th className="px-3 py-3 text-center">구매 참고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">검증된 상세 견적 항목을 준비 중입니다.</td></tr> : items.map((item, index) => {
              const query = encodeURIComponent(`${item.category} ${item.item} ${item.remarks || ''}`.trim());
              const naver = `https://search.shopping.naver.com/search/all?query=${query}`;
              const coupang = `https://www.coupang.com/np/search?q=${query}`;
              return (
                <tr key={`${item.category}-${item.item}-${index}`}>
                  <td className="px-3 py-3"><div className="font-semibold text-slate-900">{item.category}</div><div className="text-slate-600">{item.item}</div><div className="mt-1 text-xs text-slate-400">{item.remarks}</div></td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{item.quantity} {item.unit}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{money(item.materialCost)}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{money(item.laborCost)}</td>
                  <td className="px-3 py-3"><div className="flex justify-center gap-2"><a className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700" href={naver} target="_blank" rel="noreferrer">네이버 검색</a><a className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700" href={coupang} target="_blank" rel="noreferrer">쿠팡 검색</a></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {plan.materialDetailSheet && plan.materialDetailSheet.length > 0 && (
        <div className="mt-5">
          <h4 className="font-bold text-slate-900">제품·부자재 상세</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {plan.materialDetailSheet.map((mat, index) => {
              const query = encodeURIComponent(`${mat.item} ${mat.model || ''} ${mat.spec || ''}`.trim());
              const fallback = `https://search.shopping.naver.com/search/all?query=${query}`;
              const verifiedLink = Boolean(mat.link && /^https?:\/\//.test(mat.link));
              const href = verifiedLink ? mat.link! : fallback;
              return <a key={`${mat.item}-${index}`} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
                <div className="flex items-center justify-between gap-2"><div className="text-xs font-bold text-indigo-600">{mat.category}</div><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${verifiedLink ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{verifiedLink ? '확인된 링크' : '검색 링크'}</span></div>
                <div className="mt-1 font-bold text-slate-900">{mat.item}</div><div className="text-sm text-slate-600">{mat.model} · {mat.spec} · {mat.color}</div><div className="mt-2 text-xs text-slate-500">수량 {mat.quantity} · {money(mat.total)}</div>
              </a>;
            })}
          </div>
        </div>
      )}
    </section>
  );
};
