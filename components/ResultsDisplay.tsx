
import React from 'react';
import { GeneratedPlan, ProjectDetails } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ResultsDisplayProps {
  plan: GeneratedPlan;
  details: ProjectDetails;
  onReset: () => void;
  onLoadMasterTemplate: () => void;
  onLoadMaterials: () => void;
  onLoadPackage: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  plan, 
  details, 
  onReset
}) => {
  
  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in-up pb-20">
      
      {/* 1. Project Header & Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 sticky top-4 z-40">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{plan.designConcept.title}</h1>
                <p className="text-gray-600 font-medium">{plan.designConcept.description}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                    {plan.designConcept.keywords.map(k => (
                        <span key={k} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wide">#{k}</span>
                    ))}
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1">
                        ✅ 종합 리포트 생성 완료
                    </span>
                </div>
            </div>
            <button onClick={onReset} className="text-sm text-gray-500 hover:text-red-600 font-bold underline decoration-2 decoration-red-200 underline-offset-4">
                ↺ 처음으로
            </button>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex overflow-x-auto py-3 px-6 gap-4 bg-gray-50 rounded-b-xl">
            {[
                { id: 'section-estimate', icon: '📊', label: '상세 견적서' },
                { id: 'section-materials', icon: '🧱', label: '자재 리스트 & 쇼핑' },
                { id: 'section-schedule', icon: '📅', label: '공정표' },
                { id: 'section-report', icon: '📋', label: '종합 분석 & 패키지' },
            ].map((nav) => (
                <button
                    key={nav.id}
                    onClick={() => scrollToSection(nav.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm whitespace-nowrap"
                >
                    <span>{nav.icon}</span>
                    {nav.label}
                </button>
            ))}
        </div>
      </div>

      {/* 2. 상세 견적서 (Estimate Section) */}
      <section id="section-estimate" className="scroll-mt-24">
         <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📊</span>
            <h2 className="text-2xl font-bold text-gray-900">상세 견적서 (Estimate)</h2>
         </div>
         
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">공종 (Category)</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">항목 (Item)</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">수량</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">단가</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">합계</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">비고</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {plan.costEstimate.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.category}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{item.item}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.quantity} {item.unit}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-6 py-4 text-sm font-bold text-indigo-700 text-right">{formatCurrency(item.totalPrice)}</td>
                                <td className="px-6 py-4 text-xs text-gray-400">{item.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-900 text-white">
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-right font-medium text-gray-300">총 견적 합계 (VAT 별도)</td>
                            <td className="px-6 py-4 text-right text-xl font-bold text-yellow-400">
                                {formatCurrency(plan.costEstimate.reduce((sum, item) => sum + item.totalPrice, 0))}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
         </div>
         
         {/* Budget Analysis Alert */}
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
      </section>

      {/* 3. 자재 상세 및 쇼핑 링크 (Materials Section) */}
      <section id="section-materials" className="scroll-mt-24 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <span className="text-2xl">🧱</span>
                <h2 className="text-2xl font-bold text-gray-900">자재 상세 스펙 & AI 쇼핑</h2>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                AI 추천 최저가 링크 포함
            </span>
        </div>

        {!plan.materialDetailSheet ? (
            <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <LoadingSpinner />
                <p className="text-gray-500 mt-4 font-medium">자재 데이터를 불러오는 중입니다...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plan.materialDetailSheet.map((mat, idx) => (
                    <div key={idx} className="group border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                            <span className="text-4xl">🛒</span>
                        </div>
                        
                        <div className="flex-grow">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-extrabold bg-gray-900 text-white px-2 py-1 rounded uppercase tracking-wider">{mat.category}</span>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">필요: {mat.quantity}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-xl mb-1">{mat.item}</h4>
                            <p className="text-sm font-semibold text-gray-600 mb-4">{mat.model}</p>
                            
                            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg mb-4 space-y-2 border border-gray-100">
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-xs text-gray-400">규격</span>
                                    <span className="font-bold">{mat.spec}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-xs text-gray-400">색상</span>
                                    <span className="font-bold">{mat.color}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-xs text-gray-400">예산</span>
                                    <span className="font-bold text-indigo-700">{formatCurrency(mat.price)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-100">
                            {mat.link ? (
                                <a 
                                    href={mat.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center justify-center w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md transition-transform hover:-translate-y-1"
                                >
                                    <span>👉 최저가 구매 링크 열기</span>
                                </a>
                            ) : (
                                <button disabled className="w-full py-3 bg-gray-100 text-gray-400 rounded-lg font-bold text-sm cursor-not-allowed">
                                    오프라인 구매 권장
                                </button>
                            )}
                            {mat.alternatives && (
                                <p className="text-[11px] text-gray-400 mt-2 text-center">
                                    <span className="font-bold">대안:</span> {mat.alternatives}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      {/* 4. 공정표 (Schedule Section) */}
      <section id="section-schedule" className="scroll-mt-24 pt-8 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📅</span>
            <h2 className="text-2xl font-bold text-gray-900">상세 공정표 (Schedule)</h2>
        </div>
        
        <div className="relative border-l-4 border-indigo-100 ml-4 space-y-0 py-2">
            {plan.projectSchedule.map((phase, idx) => (
                <div key={idx} className="relative pl-8 pb-10 last:pb-0 group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-4 border-indigo-400 group-hover:border-indigo-600 group-hover:scale-125 transition-all shadow-sm"></div>
                    
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <span className="text-indigo-600">{phase.phase}</span>
                                <span className="w-1 h-4 bg-gray-300 rounded-full mx-1"></span>
                                {phase.task}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                                    ⏱ {phase.duration}
                                </span>
                                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {phase.startDate} ~ {phase.endDate}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                            <span className="font-bold mr-1">📌 주요 작업:</span>
                            {phase.task} 상세 진행 및 현장 점검
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 5. 종합 리포트 및 납품 (Package Section) */}
      <section id="section-report" className="scroll-mt-24 pt-8 border-t border-gray-200">
         <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📋</span>
            <h2 className="text-2xl font-bold text-gray-900">종합 분석 리포트 (Master Report)</h2>
         </div>

         {!plan.masterTemplate ? (
             <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <LoadingSpinner />
                <p className="text-gray-500 mt-4 font-medium">종합 분석 데이터를 생성 중입니다...</p>
             </div>
         ) : (
            <div className="space-y-6">
                <div className="bg-white border-2 border-indigo-600 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            AI 건축가 종합 진단
                        </h3>
                        <div className="text-right">
                            <span className="text-xs text-indigo-200 block">데이터 신뢰도</span>
                            <span className="font-bold text-xl">{plan.masterTemplate.inputSummary.confidence}</span>
                        </div>
                    </div>
                    
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Risk & Correction */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                <span>🚨</span> 리스크 관리 및 보정
                            </h4>
                            <ul className="space-y-3 mb-6">
                                {plan.masterTemplate.inputSummary.risks.map((risk, i) => (
                                    <li key={i} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg text-sm text-red-800 font-medium">
                                        <span className="text-red-500 mt-0.5">⚠️</span> {risk}
                                    </li>
                                ))}
                                {plan.masterTemplate.inputSummary.risks.length === 0 && (
                                    <li className="text-gray-400 italic">감지된 주요 리스크 없음</li>
                                )}
                            </ul>
                            
                            <h4 className="font-bold text-gray-900 mb-3 text-sm">자동 보정 내역</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded text-xs">
                                    <span className="block text-gray-500 mb-1">물가 상승률</span>
                                    <span className="font-bold text-gray-900">{plan.masterTemplate.inputSummary.autoCorrections.inflation}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded text-xs">
                                    <span className="block text-gray-500 mb-1">타일 로스율</span>
                                    <span className="font-bold text-gray-900">{plan.masterTemplate.inputSummary.autoCorrections.tileOverage}</span>
                                </div>
                            </div>
                        </div>

                        {/* Area Basis */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                <span>📐</span> 면적 산출 근거
                            </h4>
                            <div className="space-y-3">
                                {plan.masterTemplate.areaCalculations.map((area, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div>
                                            <span className="font-bold text-gray-800 text-sm block">{area.type}</span>
                                            <span className="text-xs text-gray-400">기준: {area.basis}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-indigo-700 font-bold">{area.orderArea} (발주)</span>
                                            <span className="text-xs text-gray-500">실면적 {area.realArea}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Package Files */}
                {plan.projectPackage && (
                    <div className="bg-gray-800 text-gray-300 rounded-xl p-6 shadow-md">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span>📦</span> 납품 패키지 (자동 생성됨)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">폴더 구조</p>
                                <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto border border-gray-700">
                                    {plan.projectPackage.folderStructure.join('\n')}
                                </pre>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">품질 검증 체크</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-gray-700 p-2 rounded px-3">
                                        <span className="text-sm">치수 신뢰도</span>
                                        <span className={`font-bold ${plan.projectPackage.checklist.dimensions.confidence > 80 ? "text-green-400" : "text-red-400"}`}>
                                            {plan.projectPackage.checklist.dimensions.confidence}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-700 p-2 rounded px-3">
                                        <span className="text-sm">설비 매칭</span>
                                        <span className="text-green-400 font-bold">PASS</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-700 p-2 rounded px-3">
                                        <span className="text-sm">리스크 경고</span>
                                        <span className="text-green-400 font-bold">DONE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
         )}
      </section>

      {/* Find Experts Section */}
      {details.address && (
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 shadow-sm mt-8">
            <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 text-xl">
                <span>🕵️</span> 우리 동네 전문가 찾기
            </h4>
            <p className="text-sm text-indigo-700 mb-6 font-medium">
                작성된 견적서를 바탕으로 <span className="font-bold underline text-indigo-800">'{details.address}'</span> 주변의 시공 가능한 업체를 바로 연결합니다.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <a 
                    href={`https://www.google.com/maps/search/${encodeURIComponent(details.address + ' 인테리어 디자인')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all"
                >
                    <img src="https://www.google.com/images/branding/product/ico/maps15_bnuw3a_32dp.png" alt="Google" className="w-5 h-5"/>
                    Google 지도 검색
                </a>
                <a 
                    href={`https://search.naver.com/search.naver?query=${encodeURIComponent(details.address + ' 인테리어 잘하는 곳')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 bg-[#03C75A] text-white rounded-xl text-sm font-bold hover:bg-[#02b351] shadow-sm hover:shadow-md transition-all"
                >
                    <span className="font-black">N</span>
                    네이버 플레이스 업체 검색
                </a>
            </div>

            <div className="border-t border-indigo-200 pt-6">
                <p className="text-xs font-bold text-indigo-800 mb-3 uppercase tracking-wide">직영/반셀프용 개별 기술자 찾기</p>
                <div className="flex flex-wrap gap-2">
                    {['목공/목수', '전기 조명', '타일 시공', '도배 장판', '철거 폐기물', '입주 청소'].map((trade) => (
                        <a 
                            key={trade}
                            href={`https://www.google.com/maps/search/${encodeURIComponent(details.address + ' ' + trade)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-white text-indigo-600 border border-indigo-200 py-2 px-3 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors font-medium shadow-sm"
                        >
                            {trade}
                        </a>
                    ))}
                </div>
            </div>
        </section>
      )}
    </div>
  );
};
