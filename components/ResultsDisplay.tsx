
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
          // Simple region matching logic (contains)
          const regionKey = details.address.split(' ')[0] || ''; // e.g., "서울시" -> "서울"
          const matches = allContractors.filter(c => c.region.includes(regionKey) || c.region === '전국' || regionKey.includes(c.region));
          setMatchedContractors(matches);
      }
  }, [details.address]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
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
                                        {plan.costEstimate.map((item, idx) => (
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
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-900 text-white">
                                        <tr>
                                            <td colSpan={2} className="px-6 py-4 text-right font-medium text-gray-300">총 견적 합계 (VAT 별도)</td>
                                            <td colSpan={4} className="px-6 py-4 text-right text-xl font-bold text-yellow-400">
                                                {formatCurrency(plan.costEstimate.reduce((sum, item) => sum + item.totalPrice, 0))}
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
                                        {plan.budgetAnalysis.costSavingTips.length > 0 && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plan.materialDetailSheet.map((mat, idx) => (
                            <div key={idx} className="group border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-xl transition-all flex flex-col h-full relative overflow-hidden">
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-extrabold bg-gray-900 text-white px-2 py-1 rounded uppercase">{mat.category}</span>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{mat.quantity}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-xl mb-1">{mat.item}</h4>
                                    <p className="text-sm font-semibold text-gray-600 mb-4">{mat.model}</p>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg mb-4 space-y-2 border border-gray-100">
                                        <div className="flex justify-between border-b pb-2"><span className="text-xs text-gray-400">규격</span><span className="font-bold">{mat.spec}</span></div>
                                        <div className="flex justify-between pt-1"><span className="text-xs text-gray-400">예산</span><span className="font-bold text-indigo-700">{formatCurrency(mat.price)}</span></div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    {mat.link && <a href={mat.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md"><span>👉 최저가 구매 링크</span></a>}
                                </div>
                            </div>
                        ))}
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
                    <h1 className="text-lg md:text-xl font-extrabold text-gray-900 truncate">{plan.designConcept.title}</h1>
                    <p className="text-xs text-gray-500 truncate hidden md:block">{plan.designConcept.description}</p>
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

      {/* 2. Scrollable Content Area */}
      <div className="min-h-[600px] mt-2">
          {renderTabContent()}
      </div>

      {/* 3. Verified Expert Finder (Updated) */}
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
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h5 className="font-bold text-gray-900">{contractor.name}</h5>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">✅ 검증됨</span>
                                    {contractor.career && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">{contractor.career}</span>}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{contractor.description}</p>
                                
                                {contractor.verificationNote && (
                                    <div className="text-xs bg-indigo-50 text-indigo-800 p-2 rounded mb-2 border-l-2 border-indigo-400">
                                        <span className="font-bold">🛡️ 검증 노트:</span> {contractor.verificationNote}
                                    </div>
                                )}

                                <div className="flex gap-2 text-xs items-center justify-between mt-3">
                                    <div className="flex flex-col text-gray-500">
                                        <span>📍 {contractor.region}</span>
                                        <span className="font-bold text-gray-700">📞 {contractor.contact}</span>
                                    </div>
                                    {contractor.platform !== 'offline' && contractor.snsLink ? (
                                        <a href={contractor.snsLink} target="_blank" className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-bold shadow-sm">
                                            포트폴리오 보기
                                        </a>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded font-bold border border-gray-200">
                                            현장 문의 권장
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/50 p-6 rounded-xl border border-dashed border-indigo-200 text-center mb-8">
                    <p className="text-sm text-indigo-400">
                        현재 이 지역에 등록된 '검증 시공자'가 없습니다.<br/>
                        아래 지도 검색을 통해 직접 찾아보세요.
                    </p>
                </div>
            )}
            
            {/* B. Fallback Map Search & SNS Links (RESTORED) */}
            <div className="border-t border-indigo-200 pt-6">
                <div className="mb-4">
                     <p className="text-xs font-bold text-indigo-800 mb-3 uppercase tracking-wide">SNS 시공 사례 검색 (직접 찾기)</p>
                     <div className="grid grid-cols-3 gap-2">
                        <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(details.address + ' 인테리어')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                        >
                            <span className="text-lg">▶️</span> YouTube
                        </a>
                        <a 
                            href={`https://www.instagram.com/explore/tags/${encodeURIComponent(details.address.split(' ')[1] || '인테리어')}/`} // Gu-level tag
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                        >
                            <span className="text-lg">📸</span> Instagram
                        </a>
                         <a 
                            href={`https://www.tiktok.com/search?q=${encodeURIComponent(details.address + ' 인테리어')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all shadow-sm"
                        >
                            <span className="text-lg">🎵</span> TikTok
                        </a>
                     </div>
                </div>

                <p className="text-xs font-bold text-indigo-800 mb-3 uppercase tracking-wide mt-6">일반 지도 검색 (보조 수단)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                        href={`https://www.google.com/maps/search/${encodeURIComponent(details.address + ' 인테리어 디자인')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all"
                    >
                        <img src="https://www.google.com/images/branding/product/ico/maps15_bnuw3a_32dp.png" alt="Google" className="w-5 h-5"/>
                        Google 지도 검색
                    </a>
                    <a 
                        href={`https://search.naver.com/search.naver?query=${encodeURIComponent(details.address + ' 인테리어 잘하는 곳')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-[#03C75A] text-white rounded-xl text-sm font-bold hover:bg-[#02b351] transition-all"
                    >
                        <span className="font-black">N</span>
                        네이버 플레이스 업체 검색
                    </a>
                </div>
            </div>
        </section>
      )}
    </div>
  );
};
