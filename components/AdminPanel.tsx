
import React, { useState, useEffect } from 'react';
import { getStoredPriceTable, savePriceTable, getStoredLaborData, saveLaborData, getStoredReferenceGuidelines, saveReferenceGuidelines } from '../utils/adminStorage';
import { analyzeMarketPrices } from '../services/geminiService';
import { PriceSuggestion, Persona, UnitPrice } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  initialAddress?: string; // NEW Prop
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, initialAddress }) => {
  const [activeTab, setActiveTab] = useState<'prices' | 'labor' | 'guidelines' | 'experts'>('prices');
  
  // Price Data
  const [priceTable, setPriceTable] = useState<UnitPrice[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<PriceSuggestion[]>([]);

  // Labor Data
  const [laborData, setLaborData] = useState<any>(null);

  // Guidelines
  const [guidelines, setGuidelines] = useState('');

  // Expert Scout
  // Initialize with passed address OR default to the demo address
  const [searchRegion, setSearchRegion] = useState(initialAddress || '서울시 강남구 삼성동 123');
  const [expertType, setExpertType] = useState('인테리어');

  useEffect(() => {
    setPriceTable(getStoredPriceTable());
    setLaborData(getStoredLaborData());
    setGuidelines(getStoredReferenceGuidelines());
    
    // Switch to Experts tab automatically if an address is provided (optional UX enhancement)
    if (initialAddress) {
        setActiveTab('experts');
    }
  }, [initialAddress]);

  const handleSavePrices = () => {
    savePriceTable(priceTable);
    alert('단가표가 저장되었습니다.');
  };

  const handleSaveLabor = () => {
    saveLaborData(laborData);
    alert('인건비 데이터가 저장되었습니다.');
  };

  const handleSaveGuidelines = () => {
    saveReferenceGuidelines(guidelines);
    alert('가이드라인이 저장되었습니다.');
  };

  const handleAnalyzePrices = async () => {
    setIsAnalyzing(true);
    try {
        const result = await analyzeMarketPrices(priceTable);
        setSuggestions(result);
    } catch (e) {
        alert('시장 분석 중 오류가 발생했습니다.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestion: PriceSuggestion) => {
      if (suggestion.type === 'UPDATE') {
          setPriceTable(prev => prev.map(item => 
              (item.category === suggestion.category && item.item === suggestion.item)
              ? { ...item, priceStandard: suggestion.suggestedPrice }
              : item
          ));
      } else {
          // NEW item
          const newItem: UnitPrice = {
              category: suggestion.category,
              item: suggestion.item,
              unit: suggestion.unit,
              priceLow: Math.round(suggestion.suggestedPrice * 0.9),
              priceStandard: suggestion.suggestedPrice,
              priceHigh: Math.round(suggestion.suggestedPrice * 1.1),
              description: suggestion.description || ''
          };
          setPriceTable(prev => [...prev, newItem]);
      }
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const openMapSearch = (platform: 'google' | 'naver') => {
      const term = `${searchRegion} ${expertType}`;
      let url = '';
      if (platform === 'google') {
          url = `https://www.google.com/maps/search/${encodeURIComponent(term)}`;
      } else {
          url = `https://map.naver.com/v5/search/${encodeURIComponent(term)}`;
      }
      window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end animate-fade-in">
      <div className="w-full max-w-5xl bg-white h-full shadow-2xl overflow-y-auto">
        <div className="p-6 bg-gray-900 text-white flex justify-between items-center sticky top-0 z-20 shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2">
            ⚙️ 관리자 설정 패널
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-white sticky top-[76px] z-10">
           {['prices', 'labor', 'guidelines', 'experts'].map(tab => (
               <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`flex-1 py-4 text-sm font-bold capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
               >
                   {tab === 'prices' ? '💰 단가 관리' : tab === 'labor' ? '👷 인건비 관리' : tab === 'guidelines' ? '📝 가이드라인' : '🕵️ 전문가 찾기'}
               </button>
           ))}
        </div>

        <div className="p-8 bg-gray-50 min-h-[calc(100%-140px)]">
            {activeTab === 'prices' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">표준 단가표 관리</h3>
                            <p className="text-xs text-gray-500 mt-1">AI 견적 산출 시 기준이 되는 자재 및 시공 단가를 관리합니다.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAnalyzePrices} disabled={isAnalyzing} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                                {isAnalyzing ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>분석 중...</> : '🤖 AI 시장가 분석'}
                            </button>
                            <button onClick={handleSavePrices} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5">저장하기</button>
                        </div>
                    </div>
                    
                    {suggestions.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border-l-4 border-purple-500 shadow-sm mb-6 animate-fade-in-up">
                            <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <span className="text-xl">✨</span> AI 제안 사항 ({suggestions.length}건)
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {suggestions.map(s => (
                                    <div key={s.id} className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.type === 'UPDATE' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>{s.type}</span>
                                                <span className="font-bold text-gray-800 text-sm">{s.category} - {s.item}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">{s.reason}</p>
                                            <p className="text-sm font-bold text-indigo-700">
                                                {s.type === 'UPDATE' ? `${s.currentPrice.toLocaleString()}원 → ${s.suggestedPrice.toLocaleString()}원` : `신규 제안: ${s.suggestedPrice.toLocaleString()}원`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => applySuggestion(s)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 shadow-sm">적용</button>
                                            <button onClick={() => setSuggestions(prev => prev.filter(x => x.id !== s.id))} className="px-3 py-1.5 bg-white text-gray-500 border border-gray-300 text-xs font-bold rounded hover:bg-gray-50">무시</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="grid grid-cols-1 divide-y divide-gray-100">
                            {priceTable.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-center p-4 hover:bg-gray-50 transition-colors group">
                                    {/* 1. Category & Unit (Clean White Style) */}
                                    <div className="col-span-2 flex flex-col gap-2">
                                        <div className="relative">
                                            <label className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">카테고리</label>
                                            <input 
                                                type="text" 
                                                value={item.category} 
                                                onChange={(e) => {
                                                    const newTable = [...priceTable]; newTable[idx].category = e.target.value; setPriceTable(newTable);
                                                }} 
                                                className="w-full text-xs font-bold text-gray-900 bg-white rounded-md border border-gray-300 py-1.5 px-2 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                            />
                                        </div>
                                         <div className="relative">
                                            <label className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">단위</label>
                                            <input 
                                                type="text" 
                                                value={item.unit} 
                                                onChange={(e) => {
                                                    const newTable = [...priceTable]; newTable[idx].unit = e.target.value; setPriceTable(newTable);
                                                }} 
                                                className="w-full text-xs font-bold text-gray-700 bg-white rounded-md border border-gray-300 py-1.5 px-2 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* 2. Item Info */}
                                    <div className="col-span-5 flex flex-col gap-2">
                                         <input 
                                            type="text" 
                                            value={item.item} 
                                            onChange={(e) => {
                                                const newTable = [...priceTable]; newTable[idx].item = e.target.value; setPriceTable(newTable);
                                            }} 
                                            className="w-full text-sm font-bold text-gray-900 border border-gray-300 rounded-md py-1.5 px-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                                            placeholder="항목명"
                                        />
                                        <input 
                                            type="text" 
                                            value={item.description} 
                                            onChange={(e) => {
                                                const newTable = [...priceTable]; newTable[idx].description = e.target.value; setPriceTable(newTable);
                                            }} 
                                            className="w-full text-xs text-gray-500 border border-gray-200 rounded-md py-1 px-2 bg-white focus:ring-indigo-500 focus:border-indigo-500" 
                                            placeholder="상세 설명 (규격, 시공범위 등)"
                                        />
                                    </div>

                                    {/* 3. Price (Clean White with Indigo Border) */}
                                    <div className="col-span-4 relative">
                                        <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-indigo-600 z-10">표준단가 (₩)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={item.priceStandard} 
                                                onChange={(e) => {
                                                    const newTable = [...priceTable]; newTable[idx].priceStandard = parseInt(e.target.value); setPriceTable(newTable);
                                                }} 
                                                className="w-full text-base font-bold text-right text-gray-900 bg-white border border-indigo-200 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">원</span>
                                        </div>
                                    </div>
                                    
                                    {/* 4. Actions */}
                                    <div className="col-span-1 flex justify-center">
                                        <button 
                                            onClick={() => {
                                                const newTable = priceTable.filter((_, i) => i !== idx); setPriceTable(newTable);
                                            }} 
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="항목 삭제"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                             <button onClick={() => setPriceTable([...priceTable, { category: '기타', item: '신규항목', unit: '식', priceLow: 0, priceStandard: 0, priceHigh: 0, description: '' }])} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 font-bold transition-all flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                새 항목 추가하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'labor' && laborData && (
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="flex justify-between items-center">
                         <div>
                            <h3 className="text-lg font-bold text-gray-900">인건비 및 생산성 관리</h3>
                            <p className="text-xs text-gray-500 mt-1">일일 노무비 및 작업 효율성 계수를 설정합니다.</p>
                         </div>
                         <button onClick={handleSaveLabor} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md">저장하기</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">
                                👷 일일 노무비 (Daily Wages)
                            </h4>
                            <div className="space-y-4">
                                {Object.entries(laborData.dailyWages).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-600 capitalize">{key.replace('_', ' ')}</label>
                                        <div className="relative w-40">
                                            <input 
                                                type="number" 
                                                value={value as number} 
                                                onChange={(e) => setLaborData({...laborData, dailyWages: {...laborData.dailyWages, [key]: parseInt(e.target.value)}})}
                                                className="w-full border border-gray-300 rounded-md py-1.5 pl-2 pr-8 text-right font-bold text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <span className="absolute right-3 top-1.5 text-xs text-gray-400">원</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">
                                ⚡️ 생산성 계수 (Productivity Factors)
                            </h4>
                             <div className="space-y-4">
                                {Object.entries(laborData.productivity).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-600 capitalize">{key.replace('_', ' ')}</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={value as number} 
                                            onChange={(e) => setLaborData({...laborData, productivity: {...laborData.productivity, [key]: parseFloat(e.target.value)}})}
                                            className="w-24 border border-gray-300 rounded-md py-1.5 text-center font-bold text-indigo-600 focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-xs text-yellow-800 border border-yellow-200">
                                <strong className="block mb-1">💡 생산성 계수란?</strong>
                                <p>표준 시공 물량 대비 할증률입니다. 예: '1.05'는 5%의 여유율을 의미합니다. 타일이나 자재 로스율 계산에 중요합니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'guidelines' && (
                <div className="space-y-6 max-w-4xl mx-auto h-full">
                    <div className="flex justify-between items-center">
                         <div>
                            <h3 className="text-lg font-bold text-gray-900">AI 참조 가이드라인 (System Prompt)</h3>
                            <p className="text-xs text-gray-500 mt-1">견적 생성 시 AI가 우선적으로 참조할 회사 표준 시공법 및 주의사항입니다.</p>
                         </div>
                         <button onClick={handleSaveGuidelines} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md">저장하기</button>
                    </div>
                    <div className="relative h-[calc(100vh-300px)]">
                        <textarea 
                            value={guidelines}
                            onChange={(e) => setGuidelines(e.target.value)}
                            className="w-full h-full p-6 border border-gray-300 rounded-xl font-mono text-sm bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none shadow-inner"
                            placeholder="예: [철거] 욕실 철거 시 방수층까지 전체 철거를 원칙으로 한다..."
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white px-2 py-1 rounded border">
                            {guidelines.length}자 작성됨
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'experts' && (
                <div className="space-y-8 py-4 max-w-2xl mx-auto text-center">
                    <div className="bg-white p-10 rounded-2xl shadow-lg border border-indigo-50">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-6 text-5xl shadow-inner">
                            🕵️
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">전문가 스카우트</h3>
                        <p className="text-gray-500 mb-8">
                            {initialAddress 
                                ? <><span className="font-bold text-indigo-600 underline">{initialAddress}</span> 주변의 전문 시공업체를 찾습니다.</>
                                : "지역별 기술자 및 경쟁 업체를 지도에서 빠르게 조회합니다."}
                        </p>
                        
                        <div className="space-y-5 text-left bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">조회 지역</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={searchRegion} 
                                        onChange={(e) => setSearchRegion(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                        placeholder="예: 서울시 강남구 삼성동"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">전문가 유형 (공정)</label>
                                <select 
                                    value={expertType} 
                                    onChange={(e) => setExpertType(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer"
                                >
                                    <option value="인테리어">🏠 종합 인테리어</option>
                                    <option value="목공">🔨 목수 / 목공팀</option>
                                    <option value="전기 조명">💡 전기 / 조명</option>
                                    <option value="타일 시공">🧱 타일 / 욕실</option>
                                    <option value="철거">🏗️ 철거 / 폐기물</option>
                                    <option value="설비">🔧 수도 설비</option>
                                    <option value="도배">📜 도배 / 장판</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button onClick={() => openMapSearch('naver')} className="py-4 bg-[#03C75A] text-white rounded-xl font-bold text-sm hover:bg-[#02b351] flex items-center justify-center gap-2 shadow-md transition-transform hover:-translate-y-1">
                                    <span className="font-black text-lg">N</span> 네이버 지도 검색
                                </button>
                                <button onClick={() => openMapSearch('google')} className="py-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md transition-transform hover:-translate-y-1">
                                    <span className="font-black text-lg">G</span> 구글 지도 검색
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
