import React, { useEffect, useMemo, useState } from 'react';
import { GeneratedPlan, ProjectDetails, VerifiedContractor } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { getStoredContractors } from '../utils/adminStorage';
import { loadMarketplaceContext } from '../services/estimateMarketplace';

interface ResultsDisplayProps {
  plan: GeneratedPlan;
  details: ProjectDetails;
  onReset: () => void;
  onLoadMasterTemplate: () => void;
  onLoadMaterials: () => void;
  onLoadPackage: () => void;
  onLoadSchedule: () => void;
  loadingSection: 'materials' | 'package' | 'report' | 'schedule' | null;
}

type TabType = 'estimate' | 'schedule' | 'materials' | 'report';

const money = (amount: number | undefined | null) => {
  const value = Number(amount || 0);
  return value > 0 ? new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value) : '-';
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  plan,
  details,
  onReset,
  onLoadMasterTemplate,
  onLoadMaterials,
  onLoadPackage,
  onLoadSchedule,
  loadingSection,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('estimate');
  const [matchedContractors, setMatchedContractors] = useState<VerifiedContractor[]>([]);
  const marketplace = useMemo(() => loadMarketplaceContext(), []);
  const isSupplier = marketplace.userRole === 'SUPPLIER';

  useEffect(() => {
    if (!details.address) return;
    const regionKey = details.address.split(' ')[0] || '';
    setMatchedContractors(
      getStoredContractors().filter(c => c.region.includes(regionKey) || c.region === '전국' || regionKey.includes(c.region)),
    );
  }, [details.address]);

  const total = (plan.costEstimate || []).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const renderEstimate = () => (
    <div className="animate-fade-in pt-4">
      <div className="mb-4 flex items-center gap-3 px-1"><span className="text-2xl">📊</span><h2 className="text-xl font-bold text-gray-900">상세 견적서</h2></div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500"><tr>
              <th className="px-4 py-3 text-left">공종</th><th className="px-4 py-3 text-left">항목</th><th className="px-4 py-3 text-right">수량</th>
              {isSupplier && <th className="px-4 py-3 text-right">내부 단가</th>}<th className="px-4 py-3 text-right">판매금액</th><th className="px-4 py-3 text-left">근거/비고</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {(plan.costEstimate || []).length === 0 ? <tr><td colSpan={isSupplier ? 6 : 5} className="px-4 py-8 text-center text-gray-500">검증된 상세 견적 항목을 준비 중입니다.</td></tr> : (plan.costEstimate || []).map((item, idx) => <tr key={idx}>
                <td className="px-4 py-3 font-bold text-gray-900">{item.category}</td><td className="px-4 py-3 text-gray-700">{item.item}</td><td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                {isSupplier && <td className="px-4 py-3 text-right">{money(item.unitPrice)}</td>}<td className="px-4 py-3 text-right font-bold text-indigo-700">{money(item.totalPrice)}</td><td className="px-4 py-3 text-xs text-gray-500">{item.remarks}</td>
              </tr>)}
            </tbody>
            <tfoot className="bg-gray-900 text-white"><tr><td colSpan={isSupplier ? 4 : 3} className="px-4 py-4 text-right text-gray-300">총 고객 견적 합계 (VAT 별도)</td><td colSpan={2} className="px-4 py-4 text-right text-xl font-bold text-yellow-400">{money(total)}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMaterials = () => {
    if (!plan.materialDetailSheet || plan.materialDetailSheet.length === 0) return <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">{loadingSection === 'materials' ? <LoadingSpinner /> : <><span className="mb-4 text-5xl">🧱</span><h3 className="mb-2 text-xl font-bold">검증 자재 상세</h3><p className="mb-6 text-center text-sm text-gray-500">Queens/Seed에 확인된 자재·사양·구매 포인터만 불러옵니다. 임의 품목이나 가격은 만들지 않습니다.</p><button onClick={onLoadMaterials} className="rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white">검증 자재 불러오기</button></>}</div>;
    return <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">{plan.materialDetailSheet.map((mat, idx) => {
      const query = encodeURIComponent(`${mat.item} ${mat.model || ''} ${mat.spec || ''}`.trim());
      return <div key={idx} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="text-xs font-bold text-indigo-600">{mat.category}</div><div className="mt-1 font-bold">{mat.item}</div><div className="text-sm text-gray-500">{mat.model} · {mat.spec} · {mat.color}</div><div className="mt-2 text-xs text-gray-500">수량 {mat.quantity}{isSupplier ? ` · 내부예산 ${money(mat.total)}` : ''}</div><div className="mt-4 flex gap-2"><a className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700" href={`https://search.shopping.naver.com/search/all?query=${query}`} target="_blank" rel="noreferrer">네이버 검색</a><a className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" href={`https://www.coupang.com/np/search?q=${query}`} target="_blank" rel="noreferrer">쿠팡 검색</a></div></div>;
    })}</div>;
  };

  const renderSchedule = () => !plan.projectSchedule || plan.projectSchedule.length === 0
    ? <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">{loadingSection === 'schedule' ? <LoadingSpinner /> : <button onClick={onLoadSchedule} className="rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white">검증 공정표 불러오기</button>}</div>
    : <div className="space-y-3 pt-4">{plan.projectSchedule.map((phase, idx) => <div key={idx} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div className="font-bold">{phase.task}</div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{phase.duration}</span></div><div className="mt-2 text-sm text-gray-500">{phase.startDate} ~ {phase.endDate}</div></div>)}</div>;

  const renderReport = () => !plan.masterTemplate
    ? <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">{loadingSection === 'report' ? <LoadingSpinner /> : <><p className="mb-4 text-center text-sm text-gray-500">보고서는 견적 Core가 아니라 검증 결과의 선택형 Report/NotebookLM adapter 출력입니다.</p><button onClick={onLoadMasterTemplate} className="rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white">검증 결과 리포트 요청</button></>}</div>
    : <div className="space-y-4 pt-4"><div className="rounded-xl border-2 border-indigo-600 bg-white p-6"><h3 className="mb-4 text-lg font-bold text-indigo-900">종합 진단 리포트</h3><ul className="space-y-2">{plan.masterTemplate.inputSummary.risks.map((risk, i) => <li key={i} className="rounded-lg bg-red-50 p-3 text-sm text-red-800">⚠️ {risk}</li>)}</ul></div></div>;

  const content = activeTab === 'estimate' ? renderEstimate() : activeTab === 'materials' ? renderMaterials() : activeTab === 'schedule' ? renderSchedule() : renderReport();

  return <div className="mx-auto max-w-7xl pb-20">
    <div className="sticky top-0 z-40 -mx-4 border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur-sm">
      <div className="mx-auto max-w-7xl"><div className="flex items-center justify-between gap-4 py-3"><div><h1 className="font-extrabold text-gray-900">{plan.designConcept?.title || '검증 견적 결과'}</h1><p className="hidden text-xs text-gray-500 md:block">검증된 견적·공정·자재 근거를 확인하세요.</p></div><button onClick={onReset} className="text-sm font-bold text-gray-500">↺ 처음으로</button></div><div className="flex gap-6 overflow-x-auto">{(['estimate','materials','schedule','report'] as TabType[]).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`border-b-2 pb-3 text-sm font-bold ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>{tab === 'estimate' ? '📊 상세 견적서' : tab === 'materials' ? '🧱 자재' : tab === 'schedule' ? '📅 공정표' : '📋 리포트'}</button>)}</div></div>
    </div>
    <div className="min-h-[500px]">{content}</div>
    {marketplace.consumerMode === 'TENDER' && <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900"><div className="font-bold">입찰 패키지</div><div className="mt-1">검증된 T2·BOM·공정·현장 근거가 준비된 뒤 패키지를 생성합니다.</div><button onClick={onLoadPackage} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white">입찰 패키지 상태 확인</button></div>}
    {details.address && <section className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6"><h4 className="text-lg font-bold text-indigo-900">검증된 지역 시공자</h4>{matchedContractors.length > 0 ? <div className="mt-4 grid gap-3 md:grid-cols-2">{matchedContractors.map(c => <div key={c.id} className="rounded-xl bg-white p-4"><div className="font-bold">{c.name}</div><div className="text-sm text-gray-600">{c.description}</div>{c.snsLink && <a href={c.snsLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-indigo-600">채널 확인 →</a>}</div>)}</div> : <p className="mt-3 text-sm text-gray-500">현재 검증 등록된 지역 시공자가 없습니다.</p>}</section>}
  </div>;
};
