
import React, { useState, useEffect } from 'react';
import { GeneratedPlan, ProjectDetails, VerifiedContractor } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { getStoredContractors } from '../utils/adminStorage';

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

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  plan, 
  details, 
  onReset,
  onLoadMasterTemplate,
  onLoadMaterials,
  onLoadPackage,
  onLoadSchedule,
  loadingSection
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('estimate');
  const [matchedContractors, setMatchedContractors] = useState<VerifiedContractor[]>([]);

  // Load verified contractors matching the region
  useEffect(() => {
      if (details.address) {
          const allContractors = getStoredContractors();
          const regionKey = details.address.split(' ')[0] || ''; 
          const matches = allContractors.filter(c => c.region.includes(regionKey) || c.region === '전국' || regionKey.includes(c.region));
          setMatchedContractors(matches);
      }
  }, [details.address]);

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return '-';
    }
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  // Safe formatting for Material Prices specifically
  const formatMaterialPrice = (price: number | undefined | null) => {
      if (!price || isNaN(price) || price === 0) return "가격 변동 (시세)";
      return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price);
  };

  const renderTabContent = () => {
      switch (activeTab) {
          case 'estimate':
              return (
                  <div className="animate-fade-in pt-4">
                       <div className="flex items-center gap-3 mb-4 px-1">
                            <span className="text-2xl">📊</span>
                            <h2 className="text-xl font-bold text-gray-900">상세 견적서 (Estimate)</h2>
                       </div>
                       
                       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">공종</th>
                                            <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">항목</th>
                                            <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">수량</th>
                                            <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">단가</th>
                                            <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">합계</th>
                                            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">비고</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {plan.costEstimate?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 md:px-6 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">{item.category}</td>
                                                <td className="px-4 md:px-6 py-3 text-sm text-gray-700">
                                                    {item.item}
                                                    <div className="md:hidden text-xs text-gray-400 mt-1">{item.remarks}</div>
                                                </td>
                                                <td className="px-4 md:px-6 py-3 text-sm text-gray-600 text-right whitespace-nowrap">{item.quantity} {item.unit}</td>
                                                <td className="hidden md:table-cell px-6 py-3 text-sm text-gray-600 text-right whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                                                <td className="px-4 md:px-6 py-3 text-sm font-bold text-indigo-700 text-right whitespace-nowrap">{formatCurrency(item.totalPrice)}</td>
                                                <td className="hidden md:table-cell px-6 py-3 text-xs text-gray-400">{item.remarks}</td>
                                            </tr>
                                        )) || (
                                            <tr><td colSpan={6} className="text-center py-4 text-gray-500">견적 내역이 없습니다.</td></tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-gray-900 text-white">
                                        <tr>
                                            <td colSpan={2} className="px-6 py-4 text-right font-medium text-gray-300">총 견적 합계 (VAT 별도)</td>
                                            <td colSpan={4} className="px-6 py-4 text-right text-xl font-bold text-yellow-400">
                                                {formatCurrency(plan.costEstimate?.reduce((sum, item) => sum + item.totalPrice, 0) || 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                       </div>
                       
                       {plan.budgetAnalysis && (
                            <div className={`mt-6 p-6 rounded-xl border-l-4 shadow-sm ${plan.budgetAnalysis.isOverBudget ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                                <div className="flex items-start gap-4">
                                    <div className="text-2xl">{plan.budgetAnalysis.isOverBudget ? '🚨' : '✅'}</div>
                                    <div>
                                        <h4 className={`text-lg font-bold mb-1 ${plan.budgetAnalysis.isOverBudget ? 'text-red-800' : 'text-green-800'}`}>
                                            {plan.budgetAnalysis.isOverBudget ? '예산 초과 주의' : '예산 내 진행 가능'}
                                        </h4>
                                        <p className="text-gray-700 mb-3 font-medium">{plan.budgetAnalysis.statusMessage}</p>
                                        {plan.budgetAnalysis.costSavingTips && plan.budgetAnalysis.costSavingTips.length > 0 && (
                                            <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                                                <strong className="text-sm font-bold text-gray-800 block mb-2">💡 전문가의 비용 절감 제안:</strong>
                                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                                    {plan.budgetAnalysis.costSavingTips.map((tip, i) => (
                                                        <li key={i}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                  </div>
              );
          case 'materials':
              if (!plan.materialDetailSheet || plan.materialDetailSheet.length === 0) {
                  return (
                      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 animate-fade-in mt-4">
                          {loadingSection === 'materials' ? (
                              <LoadingSpinner />
                          ) : (
                            <>
                                <span className="text-5xl mb-4">🧱</span>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">자재 상세 심층 분석 (Deep Dive)</h3>
                                <p className="text-gray-500 mb-6 text-center max-w-md">
                                    AI가 20개 이상의 부자재, 하드웨어, 조명, 마감재를<br/>
                                    하나하나 정밀하게 선정하고 최저가 링크를 찾습니다.
                                </p>
                                <button onClick={onLoadMaterials} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
                                    <span>🔍 AI 자재 딥-다이브 시작</span>
                                </button>
                            </>
                          )}
                      </div>
                  );
              }
              return (
                <div className="animate-fade-in pt-4">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-xl font-bold text-gray-900">🧱 자재 & 쇼핑 리스트</h2>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">※ 예산은 시장 상황에 따라 변동될 수 있습니다.</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plan.materialDetailSheet.map((mat, idx) => {
                            // 1. Dynamic Search Query Construction (The Fix)
                            // AI's direct link is often broken. We construct a search query instead.
                            const searchQuery = encodeURIComponent(`${mat.item} ${mat.model || ''} ${mat.spec || ''}`.trim());
                            const coupangUrl = `https://www.coupang.com/np/search?component=&q=${searchQuery}`;
                            const naverUrl = `https://search.shopping.naver.com/search/all?query=${searchQuery}`;

                            return (
                                <div key={idx} className="group border border-gray-200 rounded-xl p-0 bg-white shadow-sm hover:shadow-xl transition-all flex flex-col h-full overflow-hidden">
                                    {/* Header: Category & Qty */}
                                    <div className="p-5 pb-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-extrabold bg-gray-800 text-white px-2 py-1 rounded uppercase tracking-wide">{mat.category}</span>
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">수량: {mat.quantity}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{mat.item}</h4>
                                        <p className="text-xs font-medium text-gray-500 truncate">{mat.model}</p>
                                    </div>

                                    {/* Body: Specs & Budget */}
                                    <div className="px-5 pb-4 flex-grow">
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400 font-medium">규격/컬러</span>
                                                <span className="text-gray-700 font-bold text-right truncate max-w-[120px]">{mat.spec} {mat.color ? `/ ${mat.color}` : ''}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                                                <span className="text-gray-400 font-medium text-xs">예상 예산</span>
                                                <span className={`font-bold ${!mat.total ? 'text-gray-400 text-xs' : 'text-indigo-700 text-sm'}`}>
                                                    {formatMaterialPrice(mat.total)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Robust Shopping Buttons (Replaces AI Link) */}
                                    <div className="p-3 bg-gray-50 border-t border-gray-100 mt-auto grid grid-cols-2 gap-2">
                                        <a href={coupangUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-xs shadow-sm transition-all hover:-translate-y-0.5">
                                            <span className="mr-1">🚀</span> 쿠팡 검색
                                        </a>
                                        <a href={naverUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-xs shadow-sm transition-all hover:-translate-y-0.5">
                                            <span className="mr-1">N</span> 최저가 비교
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
              );
          case 'schedule':
               if (!plan.projectSchedule || plan.projectSchedule.length === 0) {
                   return (
                      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 mt-4">
                          {loadingSection === 'schedule' ? <LoadingSpinner /> : <button onClick={onLoadSchedule} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md">📅 AI 상세 공정표 생성 시작</button>}
                      </div>
                   );
               }
               return (
                  <div className="animate-fade-in pt-4">
                        <div className="relative border-l-4 border-indigo-100 ml-4 space-y-0 py-2">
                            {plan.projectSchedule.map((phase, idx) => (
                                <div key={idx} className="relative pl-8 pb-10 last:pb-0 group">
                                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-4 border-indigo-400 group-hover:border-indigo-600 transition-all shadow-sm"></div>
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between gap-2 mb-2"><h4 className="font-bold text-gray-900 text-lg">{phase.task}</h4><span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{phase.duration}</span></div>
                                        <p className="text-sm text-gray-600">{phase.startDate} ~ {phase.endDate}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                  </div>
               );
          case 'report':
              if (!plan.masterTemplate) {
                  return (
                      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 mt-4">
                          {loadingSection === 'report' ? <LoadingSpinner /> : <button onClick={onLoadMasterTemplate} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md">📄 AI 종합 분석 리포트 생성</button>}
                      </div>
                  );
              }
              return (
                  <div className="space-y-6 animate-fade-in pt-4">
                        <div className="bg-white border-2 border-indigo-600 rounded-xl overflow-hidden shadow-lg p-6">
                            <h3 className="font-bold text-lg mb-4 text-indigo-900">종합 진단 리포트</h3>
                            <ul className="space-y-3 mb-6">
                                {plan.masterTemplate.inputSummary.risks.map((risk, i) => (
                                    <li key={i} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg text-sm text-red-800 font-medium">⚠️ {risk}</li>
                                ))}
                            </ul>
                            <div className="grid grid-cols-2 gap-4">
                                {plan.masterTemplate.areaCalculations.map((area, i) => (
                                    <div key={i} className="bg-gray-50 p-3 rounded border">
                                        <span className="block font-bold text-sm">{area.type}</span>
                                        <span className="text-xs text-gray-500">{area.orderArea} (실면적: {area.realArea})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                  </div>
              );
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      {/* 1. Sticky Header Bar */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50 -mx-4 md:-mx-8 px-4 md:px-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
            <div className="py-3 flex flex-row justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-extrabold text-gray-900 truncate">
                        {plan.designConcept?.title || "AI 견적 분석 결과"}
                    </h1>
                    <p className="text-xs text-gray-500 truncate hidden md:block">
                        {plan.designConcept?.description || "분석된 견적 및 공정 데이터를 확인하세요."}
                    </p>
                </div>
                <button onClick={onReset} className="text-xs md:text-sm text-gray-500 hover:text-red-600 font-bold underline decoration-2 decoration-red-200 underline-offset-4 whitespace-nowrap flex-shrink-0">
                    ↺ 처음으로
                </button>
            </div>
            <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
                {['estimate', 'materials', 'schedule', 'report'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab === 'estimate' ? '📊 상세 견적서' : tab === 'materials' ? '🧱 자재 & 쇼핑' : tab === 'schedule' ? '📅 상세 공정표' : '📋 종합 리포트'}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {plan.sourceMetadata && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>결과 출처: {plan.sourceMetadata.sourceType}</strong>
          <span className="ml-3">신뢰도: {plan.sourceMetadata.confidence}</span>
          {plan.sourceMetadata.fallbackReason && (
            <p className="mt-1 text-xs">{plan.sourceMetadata.fallbackReason}</p>
          )}
        </div>
      )}

      {/* 2. Scrollable Content Area */}
      <div className="min-h-[600px] mt-2">
          {renderTabContent()}
      </div>

      {/* 3. Verified Expert Finder */}
      {details.address && (
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 shadow-sm mt-8 mx-1">
            <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 text-xl">
                <span>🕵️</span> 우리 동네 검증된 시공자 찾기
            </h4>
            <p className="text-sm text-indigo-700 mb-6 font-medium">
                <span className="font-bold underline text-indigo-800">'{details.address}'</span> 주변에서 활동 중인, 관리자가 검증한 은둔 고수(Hidden Gems)입니다.
            </p>

            {/* A. Verified Experts Grid */}
            {matchedContractors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {matchedContractors.map(contractor => (
                        <div key={contractor.id} className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all flex gap-4">
                             <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${contractor.platform === 'youtube' ? 'bg-red-50 text-red-500' : contractor.platform === 'instagram' ? 'bg-pink-50 text-pink-500' : 'bg-gray-100 text-gray-500'}`}>
                                {contractor.platform === 'youtube' ? '▶️' : contractor.platform === 'instagram' ? '📸' : '👷'}
                             </div>
                             <div>
                                 <div className="flex items-center gap-2 flex-wrap">
                                     <h5 className="font-bold text-gray-900 text-lg">{contractor.name}</h5>
                                     <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{contractor.type}</span>
                                 </div>
                                 <p className="text-sm text-gray-600 mt-1 line-clamp-2">{contractor.description}</p>
                                 <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                     {contractor.career && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">경력 {contractor.career}</span>}
                                     {contractor.platform !== 'offline' && contractor.snsLink ? (
                                         <a href={contractor.snsLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                             채널 방문 &rarr;
                                         </a>
                                     ) : (
                                         <span className="text-gray-400">오프라인 현장팀</span>
                                     )}
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl border border-dashed border-indigo-200 text-center text-gray-500 mb-8">
                    <p className="mb-2">아직 해당 지역에 등록된 검증된 전문가가 없습니다.</p>
                    <p className="text-xs">관리자가 지속적으로 숨은 고수를 발굴하고 있습니다.</p>
                </div>
            )}
        </section>
      )}
    </div>
  );
};
