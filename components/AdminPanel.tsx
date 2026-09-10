import React, { useState, useEffect, useRef } from 'react';
import {
    getStoredPriceTable, savePriceTable,
    getStoredLaborData, saveLaborData,
    getStoredReferenceGuidelines, saveReferenceGuidelines,
    getStoredContractors, saveContractors,
    getStoredMaterials, saveMaterials
} from '../utils/adminStorage';
import {
    analyzeMarketPrices,
    analyzeLaborCosts,
    discoverAndRefreshMaterials,
    analyzeBasePrices
} from '../services/interiorAdminGateway';
import { PriceSuggestion, VerifiedContractor, UnitPrice, LaborSuggestion, MaterialDatabaseItem } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  initialAddress?: string;
}

const LABOR_LABEL_MAP: Record<string, string> = {
    carpenter_foreman: '🔨 목공 반장 (Foreman)',
    carpenter_member: '🔨 목공 팀원',
    tiler_expert: '🧱 타일 전공 (Expert)',
    tiler_assistant: '🧱 타일 조공',
    demolition: '🏗️ 철거공',
    general: '🧹 일반 잡부 (조공)',
    electrician: '💡 전기 기술자',
    wallpaper: '📜 도배사',
    flooring: '🪵 바닥(마루) 시공자'
};

const CATEGORY_TABS = [
    '전체', '공통', '철거', '목공', '천장',
    '전기', '설비', '욕실', '타일',
    '바닥', '벽', '페인트', '필름',
    '샤시', '도어', '주방/가구', '기타'
];

const CATEGORY_MAPPING: Record<string, string[]> = {
    '전체': [], '공통': ['공통', '가설', '양중', '보양'], '철거': ['철거'],
    '목공': ['목공', '단열', '가벽', '목자재'], '천장': ['천장', '몰딩', '덴조'],
    '전기': ['전기', '조명', '배선'], '설비': ['설비', '방수', '배관', '환기'],
    '욕실': ['욕실', '도기', '수전', '악세사리'], '타일': ['타일'],
    '바닥': ['바닥', '마루', '장판', '데코타일'], '벽': ['벽', '도배'],
    '페인트': ['페인트', '도장', '탄성'], '필름': ['필름', '시트', '인테리어 필름'],
    '샤시': ['샤시', '샷시', '창호', '유리'], '도어': ['도어', '문', '중문', '방문'],
    '주방/가구': ['주방', '가구', '싱크대', '붙박이', '신발장'], '기타': ['기타', '부자재', '잡자재']
};

interface MergeStats {
    newMaterialsCount: number;
    newPricesCount: number;
    newContractorsCount: number;
    totalNew: number;
    details: string[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, initialAddress }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'prices' | 'labor' | 'guidelines' | 'contractors'>('materials');
  const [priceTable, setPriceTable] = useState<UnitPrice[]>([]);
  const [isAnalyzingPrices, setIsAnalyzingPrices] = useState(false);
  const [priceSuggestions, setPriceSuggestions] = useState<PriceSuggestion[]>([]);
  const [laborData, setLaborData] = useState<any>(null);
  const [isAnalyzingLabor, setIsAnalyzingLabor] = useState(false);
  const [laborSuggestions, setLaborSuggestions] = useState<LaborSuggestion[]>([]);
  const [guidelines, setGuidelines] = useState('');
  const [contractors, setContractors] = useState<VerifiedContractor[]>([]);
  const [editingContractor, setEditingContractor] = useState<VerifiedContractor | null>(null);
  const [materials, setMaterials] = useState<MaterialDatabaseItem[]>([]);
  const [isUpdatingMaterials, setIsUpdatingMaterials] = useState(false);
  const [activeMaterialCategory, setActiveMaterialCategory] = useState<string>('전체');
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedScanCategories, setSelectedScanCategories] = useState<Set<string>>(new Set());
  const [scanMode, setScanMode] = useState<'scan_and_update' | 'verify_only'>('scan_and_update');
  const [pendingMaterialUpdates, setPendingMaterialUpdates] = useState<{ updates: MaterialDatabaseItem[], newItems: MaterialDatabaseItem[] } | null>(null);
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [selectedNewItems, setSelectedNewItems] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreModalData, setRestoreModalData] = useState<any | null>(null);
  const [mergeStats, setMergeStats] = useState<MergeStats | null>(null);

  useEffect(() => {
    setPriceTable(getStoredPriceTable());
    setLaborData(getStoredLaborData());
    setGuidelines(getStoredReferenceGuidelines());
    setContractors(getStoredContractors());
    setMaterials(getStoredMaterials());
    if (initialAddress) setActiveTab('contractors');
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [initialAddress]);

  const handleExportData = async () => {
      const backupData = { timestamp: new Date().toISOString(), version: '1.0', data: { materials, priceTable, laborData, guidelines, contractors } };
      const dataStr = JSON.stringify(backupData, null, 2);
      const fileName = `johnson_backup_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileRead = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => { try { const json=JSON.parse(e.target?.result as string); if(!json.timestamp||!json.data) throw new Error('Invalid format'); setRestoreModalData(json); setMergeStats(null); } catch { alert('❌ 파일 형식이 올바르지 않습니다.'); } };
      reader.readAsText(file);
  };
  const calculateMergeStats = (incoming:any):MergeStats => {
      const nm=(incoming.materials||[]).filter((m:MaterialDatabaseItem)=>!new Set(materials.map(x=>x.id)).has(m.id)).length;
      const np=(incoming.priceTable||[]).filter((p:UnitPrice)=>!new Set(priceTable.map(x=>`${x.category}_${x.item}`)).has(`${p.category}_${p.item}`)).length;
      const nc=(incoming.contractors||[]).filter((c:VerifiedContractor)=>!new Set(contractors.map(x=>x.id)).has(c.id)).length;
      return {newMaterialsCount:nm,newPricesCount:np,newContractorsCount:nc,totalNew:nm+np+nc,details:[]};
  };
  const performOverwrite=(incoming:any)=>{ if(incoming.materials){setMaterials(incoming.materials);saveMaterials(incoming.materials);} if(incoming.priceTable){setPriceTable(incoming.priceTable);savePriceTable(incoming.priceTable);} if(incoming.laborData){setLaborData(incoming.laborData);saveLaborData(incoming.laborData);} if(incoming.guidelines){setGuidelines(incoming.guidelines);saveReferenceGuidelines(incoming.guidelines);} if(incoming.contractors){setContractors(incoming.contractors);saveContractors(incoming.contractors);} setRestoreModalData(null); };
  const performMerge=()=>{ if(!restoreModalData?.data)return; const i=restoreModalData.data; const mm=[...materials,...(i.materials||[]).filter((m:MaterialDatabaseItem)=>!materials.some(x=>x.id===m.id))]; const pp=[...priceTable,...(i.priceTable||[]).filter((p:UnitPrice)=>!priceTable.some(x=>x.category===p.category&&x.item===p.item))]; const cc=[...contractors,...(i.contractors||[]).filter((c:VerifiedContractor)=>!contractors.some(x=>x.id===c.id))]; setMaterials(mm);saveMaterials(mm);setPriceTable(pp);savePriceTable(pp);setContractors(cc);saveContractors(cc);setRestoreModalData(null);setMergeStats(null); };
  const handleRestoreOption=(mode:'overwrite'|'merge')=>{if(!restoreModalData?.data)return; if(mode==='overwrite') performOverwrite(restoreModalData.data); else setMergeStats(calculateMergeStats(restoreModalData.data));};
  const handleSaveWithFeedback=async(action:()=>void)=>{setSaveStatus('saving');action();setSaveStatus('saved');setTimeout(()=>setSaveStatus('idle'),1200);};
  const handleSavePrices=()=>handleSaveWithFeedback(()=>savePriceTable(priceTable));
  const handleSaveLabor=()=>handleSaveWithFeedback(()=>saveLaborData(laborData));
  const handleSaveGuidelines=()=>handleSaveWithFeedback(()=>saveReferenceGuidelines(guidelines));
  const handleSaveContractors=()=>handleSaveWithFeedback(()=>saveContractors(contractors));
  const handleSaveMaterials=()=>handleSaveWithFeedback(()=>saveMaterials(materials));
  const handleAnalyzePrices=async()=>{setIsAnalyzingPrices(true);try{setPriceSuggestions(await analyzeMarketPrices(priceTable));}catch{alert('중앙 audited Core 연결을 확인해주세요.');}finally{setIsAnalyzingPrices(false);}};
  const handleAnalyzeBasePrices=async()=>{if(!laborData)return;setIsAnalyzingPrices(true);try{setPriceSuggestions(await analyzeBasePrices(priceTable,laborData));}catch{alert('중앙 audited Core 연결을 확인해주세요.');}finally{setIsAnalyzingPrices(false);}};
  const handleAnalyzeLabor=async()=>{if(!laborData)return;setIsAnalyzingLabor(true);try{setLaborSuggestions(await analyzeLaborCosts(laborData.dailyWages));}catch{alert('중앙 audited Core 연결을 확인해주세요.');}finally{setIsAnalyzingLabor(false);}};
  const openScanModal=(mode:'scan_and_update'|'verify_only')=>{setScanMode(mode);setSelectedScanCategories(new Set());setShowScanModal(true);};
  const executeMaterialScan=async()=>{if(!selectedScanCategories.size)return;setShowScanModal(false);setIsUpdatingMaterials(true);try{const r=await discoverAndRefreshMaterials(materials,Array.from(selectedScanCategories),scanMode);setPendingMaterialUpdates(r);setSelectedUpdates(new Set(r.updates.map(i=>i.id)));setSelectedNewItems(new Set(r.newItems.map(i=>i.id)));}catch{alert('중앙 audited Core 연결을 확인해주세요.');}finally{setIsUpdatingMaterials(false);}};
  const handleApplyMaterialChanges=()=>{if(!pendingMaterialUpdates)return;let next=[...materials];pendingMaterialUpdates.updates.forEach(u=>{if(selectedUpdates.has(u.id)){const n=next.findIndex(x=>x.id===u.id);if(n>=0)next[n]={...next[n],...u};}});pendingMaterialUpdates.newItems.forEach(n=>{if(selectedNewItems.has(n.id))next.push(n);});setMaterials(next);saveMaterials(next);setPendingMaterialUpdates(null);};
  const applyPriceSuggestion=(s:PriceSuggestion)=>{if(s.type==='UPDATE')setPriceTable(p=>p.map(i=>i.category===s.category&&i.item===s.item?{...i,priceStandard:s.suggestedPrice}:i));setPriceSuggestions(p=>p.filter(x=>x.id!==s.id));};
  const applyLaborSuggestion=(s:LaborSuggestion)=>{if(!laborData)return;setLaborData({...laborData,dailyWages:{...laborData.dailyWages,[s.key]:s.suggestedPrice}});setLaborSuggestions(p=>p.filter(x=>x.key!==s.key));};
  const handleAddContractor=()=>setEditingContractor({id:Date.now().toString(),name:'',type:'종합 인테리어',region:'서울',contact:'',platform:'offline',description:'',isVerified:true,tags:[],career:'10년',verificationNote:''});
  const handleSaveContractorForm=()=>{if(!editingContractor?.name)return;setContractors(p=>p.some(c=>c.id===editingContractor.id)?p.map(c=>c.id===editingContractor.id?editingContractor:c):[...p,editingContractor]);setEditingContractor(null);};
  const handleDeleteContractor=(id:string)=>setContractors(p=>p.filter(c=>c.id!==id));
  const handleMaterialChange=(idx:number,field:keyof MaterialDatabaseItem,value:any)=>{const n=[...materials];n[idx]={...n[idx],[field]:value};setMaterials(n);saveMaterials(n);};

  const filteredMaterials = activeMaterialCategory === '전체' ? materials : materials.filter(m => (CATEGORY_MAPPING[activeMaterialCategory]||[]).some(k => `${m.category} ${m.subCategory}`.includes(k)));

  return <div className="fixed inset-0 z-50 bg-black/40 overflow-auto"><div className="max-w-6xl mx-auto my-8 bg-white rounded-xl p-6">
    <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">관리자 데이터</h2><button onClick={onClose}>닫기</button></div>
    <p className="text-sm text-amber-700 mb-4">AI 분석은 브라우저 API 키가 아니라 중앙 audited Core를 통해서만 실행됩니다.</p>
    <div className="flex gap-2 flex-wrap mb-4">{(['materials','prices','labor','guidelines','contractors'] as const).map(t=><button key={t} onClick={()=>setActiveTab(t)} className="border px-3 py-1 rounded">{t}</button>)}</div>
    {activeTab==='materials'&&<><div className="flex gap-2 mb-3"><select value={activeMaterialCategory} onChange={e=>setActiveMaterialCategory(e.target.value)}>{CATEGORY_TABS.map(x=><option key={x}>{x}</option>)}</select><button onClick={()=>openScanModal('verify_only')}>검증</button><button onClick={()=>openScanModal('scan_and_update')}>업데이트 후보</button><button onClick={handleSaveMaterials}>저장</button></div><div>{filteredMaterials.length}개 자재</div></>}
    {activeTab==='prices'&&<div className="flex gap-2"><button onClick={handleAnalyzePrices} disabled={isAnalyzingPrices}>시장검증</button><button onClick={handleAnalyzeBasePrices}>기본단가검증</button><button onClick={handleSavePrices}>저장</button><span>{priceSuggestions.length}개 제안</span></div>}
    {activeTab==='labor'&&<div className="flex gap-2"><button onClick={handleAnalyzeLabor} disabled={isAnalyzingLabor}>인건비검증</button><button onClick={handleSaveLabor}>저장</button><span>{laborSuggestions.length}개 제안 · {Object.keys(LABOR_LABEL_MAP).length} 직종</span></div>}
    {activeTab==='guidelines'&&<><textarea className="w-full min-h-52 border p-2" value={guidelines} onChange={e=>setGuidelines(e.target.value)}/><button onClick={handleSaveGuidelines}>저장</button></>}
    {activeTab==='contractors'&&<div><button onClick={handleAddContractor}>업체 추가</button><span className="ml-3">{contractors.length}개 업체</span></div>}
    <div className="mt-6 flex gap-2"><button onClick={handleExportData}>백업</button><button onClick={handleImportClick}>복원</button><input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileRead}/><span>{saveStatus}</span></div>
    {restoreModalData&&<div className="mt-4"><button onClick={()=>handleRestoreOption('merge')}>병합</button><button onClick={()=>handleRestoreOption('overwrite')}>덮어쓰기</button>{mergeStats&&<button onClick={performMerge}>병합 실행 ({mergeStats.totalNew})</button>}</div>}
    {showScanModal&&<div className="mt-4 border p-3"><p>검증할 공정을 선택하세요.</p>{CATEGORY_TABS.filter(x=>x!=='전체').map(c=><label key={c} className="mr-3"><input type="checkbox" onChange={e=>{const n=new Set(selectedScanCategories);e.target.checked?n.add(c):n.delete(c);setSelectedScanCategories(n);}}/> {c}</label>)}<div><button onClick={executeMaterialScan}>실행</button></div></div>}
    {pendingMaterialUpdates&&<div className="mt-4"><p>업데이트 {pendingMaterialUpdates.updates.length} / 신규 {pendingMaterialUpdates.newItems.length}</p><button onClick={handleApplyMaterialChanges}>선택 반영</button></div>}
    {editingContractor&&<div className="mt-4"><input value={editingContractor.name} onChange={e=>setEditingContractor({...editingContractor,name:e.target.value})}/><button onClick={handleSaveContractorForm}>저장</button><button onClick={()=>handleDeleteContractor(editingContractor.id)}>삭제</button></div>}
    <div className="hidden">{String(isUpdatingMaterials)}</div>
  </div></div>;
};
