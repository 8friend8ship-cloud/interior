
import React, { useState, useEffect, useRef } from 'react';
import { 
    getStoredPriceTable, savePriceTable, 
    getStoredLaborData, saveLaborData, 
    getStoredReferenceGuidelines, saveReferenceGuidelines,
    getStoredContractors, saveContractors,
    getStoredMaterials, saveMaterials
} from '../utils/adminStorage';
import { analyzeMarketPrices, analyzeLaborCosts, discoverAndRefreshMaterials } from '../services/geminiService';
import { PriceSuggestion, VerifiedContractor, UnitPrice, LaborSuggestion, MaterialDatabaseItem } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  initialAddress?: string;
}

// Map English keys to Korean labels for Labor
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

// UI Tabs (Display Name) - Added 5 new tabs: 천장, 타일, 페인트, 필름, 샤시
const CATEGORY_TABS = [
    '전체', '공통', '철거', '목공', '천장', 
    '전기', '설비', '욕실', '타일', 
    '바닥', '벽', '페인트', '필름', 
    '샤시', '도어', '주방/가구', '기타'
];

// Mapping Logic: Tab Name -> Actual DB Category/SubCategory Keywords
const CATEGORY_MAPPING: Record<string, string[]> = {
    '전체': [],
    '공통': ['공통', '가설', '양중', '보양'],
    '철거': ['철거'],
    '목공': ['목공', '단열', '가벽', '목자재'],
    '천장': ['천장', '몰딩', '덴조'], // NEW
    '전기': ['전기', '조명', '배선'],
    '설비': ['설비', '방수', '배관', '환기'],
    '욕실': ['욕실', '도기', '수전', '악세사리'],
    '타일': ['타일'], // NEW
    '바닥': ['바닥', '마루', '장판', '데코타일'],
    '벽': ['벽', '도배'], 
    '페인트': ['페인트', '도장', '탄성'], // NEW
    '필름': ['필름', '시트', '인테리어 필름'], // NEW
    '샤시': ['샤시', '샷시', '창호', '유리'], // NEW
    '도어': ['도어', '문', '중문', '방문'],
    '주방/가구': ['주방', '가구', '싱크대', '붙박이', '신발장'],
    '기타': ['기타', '부자재', '잡자재']
};

interface MergeStats {
    newMaterialsCount: number;
    newPricesCount: number;
    newContractorsCount: number;
    totalNew: number;
    details: string[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, initialAddress }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'prices' | 'labor' | 'guidelines' | 'contractors'>('materials'); // Materials default
  
  // Price Data
  const [priceTable, setPriceTable] = useState<UnitPrice[]>([]);
  const [isAnalyzingPrices, setIsAnalyzingPrices] = useState(false);
  const [priceSuggestions, setPriceSuggestions] = useState<PriceSuggestion[]>([]);

  // Labor Data
  const [laborData, setLaborData] = useState<any>(null);
  const [isAnalyzingLabor, setIsAnalyzingLabor] = useState(false);
  const [laborSuggestions, setLaborSuggestions] = useState<LaborSuggestion[]>([]);

  // Guidelines
  const [guidelines, setGuidelines] = useState('');

  // Contractors (New Expert Management)
  const [contractors, setContractors] = useState<VerifiedContractor[]>([]);
  const [editingContractor, setEditingContractor] = useState<VerifiedContractor | null>(null); // null means list mode, object means edit mode
  
  // Materials (NEW)
  const [materials, setMaterials] = useState<MaterialDatabaseItem[]>([]);
  const [isUpdatingMaterials, setIsUpdatingMaterials] = useState(false);
  const [activeMaterialCategory, setActiveMaterialCategory] = useState<string>('전체'); // NEW: Filter State
  
  // Scan Config State
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedScanCategories, setSelectedScanCategories] = useState<Set<string>>(new Set());
  const [scanMode, setScanMode] = useState<'scan_and_update' | 'verify_only'>('scan_and_update');

  // Staging Area for AI Material Updates
  const [pendingMaterialUpdates, setPendingMaterialUpdates] = useState<{ updates: MaterialDatabaseItem[], newItems: MaterialDatabaseItem[] } | null>(null);
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [selectedNewItems, setSelectedNewItems] = useState<Set<string>>(new Set());

  // Save Feedback States
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Backup & Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreModalData, setRestoreModalData] = useState<any | null>(null);
  const [mergeStats, setMergeStats] = useState<MergeStats | null>(null); // NEW: For Preview

  useEffect(() => {
    setPriceTable(getStoredPriceTable());
    setLaborData(getStoredLaborData());
    setGuidelines(getStoredReferenceGuidelines());
    setContractors(getStoredContractors());
    setMaterials(getStoredMaterials());
    
    if (initialAddress) {
        setActiveTab('contractors');
    }

    // Prevent body scrolling when Admin Panel is open
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [initialAddress]);

  // --- Backup (Export) Logic with "Save As" Fallback ---
  const handleExportData = async () => {
      const backupData = {
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: {
              materials,
              priceTable,
              laborData,
              guidelines,
              contractors
          }
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0,4);
      const fileName = `johnson_backup_${dateStr}_${timeStr}.json`;

      // Helper for legacy download
      const triggerLegacyDownload = () => {
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      };

      // Check if File System Access API is supported
      // @ts-ignore
      const supportsFileSystemAccess = 'showSaveFilePicker' in window;

      if (supportsFileSystemAccess) {
          try {
              // @ts-ignore
              const handle = await window.showSaveFilePicker({
                  suggestedName: fileName,
                  types: [{
                      description: 'JSON Files',
                      accept: { 'application/json': ['.json'] },
                  }],
              });
              const writable = await handle.createWritable();
              await writable.write(dataStr);
              await writable.close();
              alert("✅ 선택하신 위치에 백업 파일이 저장되었습니다.");
              return; // Success
          } catch (pickerError: any) {
              // User cancelled the picker
              if (pickerError.name === 'AbortError') return;
              
              console.warn("File System API failed, falling back:", pickerError);
              // Fallthrough to legacy download if API fails unexpectedly
          }
      }

      // Fallback Execution
      triggerLegacyDownload();
      
      // Notify user why "Save As" window didn't appear
      if (!supportsFileSystemAccess) {
          alert(`✅ 백업 파일이 '다운로드' 폴더에 자동 저장되었습니다.\n\n(현재 브라우저 보안 정책상 '저장 위치 선택' 창을 띄울 수 없어 자동 저장됩니다.)`);
      } else {
          alert("✅ 백업 파일이 저장되었습니다.");
      }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileRead = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              if (!json.timestamp || !json.data) {
                  throw new Error("Invalid format");
              }
              setRestoreModalData(json);
              setMergeStats(null); // Reset stats
          } catch (error) {
              console.error(error);
              alert("❌ 파일 형식이 올바르지 않습니다. 존슨 백업 파일이 맞는지 확인해주세요.");
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  // --- Restore Logic: Calculate Diff ---
  const calculateMergeStats = (incoming: any): MergeStats => {
      let newMaterialsCount = 0;
      let newPricesCount = 0;
      let newContractorsCount = 0;
      const details: string[] = [];

      // Materials Diff
      if (incoming.materials) {
          const currentIds = new Set(materials.map(m => m.id));
          const newItems = incoming.materials.filter((m: MaterialDatabaseItem) => !currentIds.has(m.id));
          newMaterialsCount = newItems.length;
          if (newMaterialsCount > 0) details.push(`자재 리스트: ${newMaterialsCount}개 추가`);
      }

      // Price Table Diff
      if (incoming.priceTable) {
          const currentKeys = new Set(priceTable.map(p => `${p.category}_${p.item}`));
          const newItems = incoming.priceTable.filter((p: UnitPrice) => !currentKeys.has(`${p.category}_${p.item}`));
          newPricesCount = newItems.length;
          if (newPricesCount > 0) details.push(`단가표 항목: ${newPricesCount}개 추가`);
      }

      // Contractors Diff
      if (incoming.contractors) {
          const currentIds = new Set(contractors.map(c => c.id));
          const newItems = incoming.contractors.filter((c: VerifiedContractor) => !currentIds.has(c.id));
          newContractorsCount = newItems.length;
          if (newContractorsCount > 0) details.push(`시공자 DB: ${newContractorsCount}명 추가`);
      }

      return {
          newMaterialsCount,
          newPricesCount,
          newContractorsCount,
          totalNew: newMaterialsCount + newPricesCount + newContractorsCount,
          details
      };
  };

  const handleRestoreOption = (mode: 'overwrite' | 'merge') => {
      if (!restoreModalData || !restoreModalData.data) return;
      const incoming = restoreModalData.data;

      if (mode === 'overwrite') {
          if(confirm("⚠️ 경고: 현재 데이터를 모두 삭제하고 백업 파일 내용으로 덮어씁니다. 계속하시겠습니까?")) {
              performOverwrite(incoming);
          }
      } else {
          // Merge: Show Preview first
          const stats = calculateMergeStats(incoming);
          setMergeStats(stats);
      }
  };

  const performOverwrite = (incoming: any) => {
      try {
          if (incoming.materials) { setMaterials(incoming.materials); saveMaterials(incoming.materials); }
          if (incoming.priceTable) { setPriceTable(incoming.priceTable); savePriceTable(incoming.priceTable); }
          if (incoming.laborData) { setLaborData(incoming.laborData); saveLaborData(incoming.laborData); }
          if (incoming.guidelines) { setGuidelines(incoming.guidelines); saveReferenceGuidelines(incoming.guidelines); }
          if (incoming.contractors) { setContractors(incoming.contractors); saveContractors(incoming.contractors); }
          alert("✅ 모든 데이터가 백업 파일 내용으로 덮어씌워졌습니다.");
          setRestoreModalData(null);
      } catch (e) {
          alert("복원 중 오류 발생");
      }
  };

  const performMerge = () => {
      if (!restoreModalData || !restoreModalData.data) return;
      const incoming = restoreModalData.data;

      try {
          let addedCount = 0;

          // Materials Merge
          if (incoming.materials) {
              const currentIds = new Set(materials.map(m => m.id));
              const newItems = incoming.materials.filter((m: MaterialDatabaseItem) => !currentIds.has(m.id));
              if (newItems.length > 0) {
                  const merged = [...materials, ...newItems];
                  setMaterials(merged);
                  saveMaterials(merged);
                  addedCount += newItems.length;
              }
          }

          // Price Table Merge
          if (incoming.priceTable) {
              const currentKeys = new Set(priceTable.map(p => `${p.category}_${p.item}`));
              const newItems = incoming.priceTable.filter((p: UnitPrice) => !currentKeys.has(`${p.category}_${p.item}`));
              if (newItems.length > 0) {
                  const merged = [...priceTable, ...newItems];
                  setPriceTable(merged);
                  savePriceTable(merged);
                  addedCount += newItems.length;
              }
          }

          // Contractors Merge
          if (incoming.contractors) {
              const currentIds = new Set(contractors.map(c => c.id));
              const newItems = incoming.contractors.filter((c: VerifiedContractor) => !currentIds.has(c.id));
              if (newItems.length > 0) {
                  const merged = [...contractors, ...newItems];
                  setContractors(merged);
                  saveContractors(merged);
                  addedCount += newItems.length;
              }
          }
          
          alert(`✅ 병합 완료! 총 ${addedCount}개의 항목이 성공적으로 추가되었습니다.`);
          setRestoreModalData(null);
          setMergeStats(null);
      } catch (e) {
          alert("병합 중 오류 발생");
      }
  };

  const handleSaveWithFeedback = async (action: () => void) => {
      setSaveStatus('saving');
      await new Promise(r => setTimeout(r, 600)); // Fake delay for UX
      action();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSavePrices = () => handleSaveWithFeedback(() => savePriceTable(priceTable));
  const handleSaveLabor = () => handleSaveWithFeedback(() => saveLaborData(laborData));
  const handleSaveGuidelines = () => handleSaveWithFeedback(() => saveReferenceGuidelines(guidelines));
  const handleSaveContractors = () => handleSaveWithFeedback(() => saveContractors(contractors));
  const handleSaveMaterials = () => handleSaveWithFeedback(() => saveMaterials(materials));

  // --- AI Analysis Logic ---
  const handleAnalyzePrices = async () => {
    setIsAnalyzingPrices(true);
    try {
        const result = await analyzeMarketPrices(priceTable);
        setPriceSuggestions(result);
    } catch (e) {
        alert('시장 분석 중 오류가 발생했습니다.');
    } finally {
        setIsAnalyzingPrices(false);
    }
  };

  const handleAnalyzeLabor = async () => {
    if (!laborData) return;
    setIsAnalyzingLabor(true);
    try {
        const result = await analyzeLaborCosts(laborData.dailyWages);
        setLaborSuggestions(result);
    } catch (e) {
        alert('인건비 분석 중 오류가 발생했습니다.');
    } finally {
        setIsAnalyzingLabor(false);
    }
  };

  // Open the Scan Configuration Modal
  const openScanModal = (mode: 'scan_and_update' | 'verify_only') => {
      setScanMode(mode);
      setSelectedScanCategories(new Set()); // Reset selections
      setShowScanModal(true);
  };

  const executeMaterialScan = async () => {
      if (selectedScanCategories.size === 0) {
          alert("스캔할 공정을 최소 1개 이상 선택해주세요.");
          return;
      }
      
      setShowScanModal(false); // Close modal
      setIsUpdatingMaterials(true);
      setPendingMaterialUpdates(null);
      
      // Explicitly cast to string[] to satisfy TypeScript
      const targetCategories = Array.from(selectedScanCategories) as string[];

      try {
          const result = await discoverAndRefreshMaterials(materials, targetCategories, scanMode);
          setPendingMaterialUpdates(result);
          // Auto-select all by default
          setSelectedUpdates(new Set(result.updates.map(i => i.id)));
          setSelectedNewItems(new Set(result.newItems.map(i => i.id)));
      } catch (e) {
          console.error(e);
          alert("자재 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
          setIsUpdatingMaterials(false);
      }
  };

  const handleApplyMaterialChanges = () => {
      if (!pendingMaterialUpdates) return;

      try {
          let newMaterials = [...materials];

          // 1. Apply Updates with Safe Merging
          pendingMaterialUpdates.updates.forEach(update => {
              if (selectedUpdates.has(update.id)) {
                  const idx = newMaterials.findIndex(m => m.id === update.id);
                  if (idx !== -1) {
                      newMaterials[idx] = { 
                          ...newMaterials[idx], 
                          ...update, 
                          lastUpdated: new Date().toISOString().split('T')[0] 
                      };
                  }
              }
          });

          // 2. Add New Items with Default Values (SANITIZATION to prevent Blackout)
          pendingMaterialUpdates.newItems.forEach(newItem => {
              if (selectedNewItems.has(newItem.id)) {
                  const safeItem: MaterialDatabaseItem = {
                      id: `m${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                      category: newItem.category || '기타',
                      subCategory: newItem.subCategory || '일반',
                      grade: newItem.grade || 'standard',
                      brand: newItem.brand || '',
                      name: newItem.name || '이름 없음',
                      spec: newItem.spec || '-',
                      unit: newItem.unit || 'ea',
                      price: typeof newItem.price === 'number' ? newItem.price : 0,
                      link: newItem.link || '',
                      laborRef: newItem.laborRef || '',
                      workLink: newItem.workLink || { laborType: 'none' }, // Ensure workLink exists
                      lastUpdated: new Date().toISOString().split('T')[0]
                  };
                  newMaterials.push(safeItem);
              }
          });

          setMaterials(newMaterials);
          saveMaterials(newMaterials); // Auto-save to persistence
          setPendingMaterialUpdates(null);
          alert("선택한 정보가 라이브러리에 반영 및 저장되었습니다!");
      } catch (e) {
          console.error(e);
          alert("데이터 반영 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
  };

  // ... (apply functions remain same) ...
  const applyPriceSuggestion = (suggestion: PriceSuggestion) => {
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
      setPriceSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const applyLaborSuggestion = (s: LaborSuggestion) => {
      if (!laborData) return;
      setLaborData({
          ...laborData,
          dailyWages: {
              ...laborData.dailyWages,
              [s.key]: s.suggestedPrice
          }
      });
      setLaborSuggestions(prev => prev.filter(x => x.key !== s.key));
  };

  // --- Contractor CRUD ---
  const handleAddContractor = () => {
      setEditingContractor({
          id: Date.now().toString(),
          name: '',
          type: '종합 인테리어',
          region: '서울',
          contact: '',
          platform: 'offline', // Default to offline based on user feedback
          description: '',
          isVerified: true,
          tags: [],
          career: '10년',
          verificationNote: ''
      });
  };

  const handleSaveContractorForm = () => {
      if (!editingContractor || !editingContractor.name) return;
      
      setContractors(prev => {
          const exists = prev.find(c => c.id === editingContractor.id);
          if (exists) {
              return prev.map(c => c.id === editingContractor.id ? editingContractor : c);
          } else {
              return [...prev, editingContractor];
          }
      });
      handleSaveContractors(); // Auto save to storage
      setEditingContractor(null);
  };

  const handleDeleteContractor = (id: string) => {
      if(confirm("정말 삭제하시겠습니까?")) {
          setContractors(prev => prev.filter(c => c.id !== id));
          handleSaveContractors(); // Auto save
      }
  };

  const handleMaterialChange = (idx: number, field: keyof MaterialDatabaseItem, value: any) => {
      const newMaterials = [...materials];
      newMaterials[idx] = { ...newMaterials[idx], [field]: value };
      setMaterials(newMaterials);
  };

  const handleDeleteMaterial = (idx: number) => {
      if (confirm("삭제하시겠습니까?")) {
          const newMaterials = materials.filter((_, i) => i !== idx);
          setMaterials(newMaterials);
      }
  };

  const handleAddMaterial = () => {
      // Logic: If '전체' is selected, standard '기타' category.
      // If a specific tab like '바닥' is selected, use the PRIMARY keyword for that tab (e.g. '바닥마감')
      let defaultCategory = '기타';
      if (activeMaterialCategory !== '전체') {
          // Use the first keyword in the mapping as the default category name
          const mapping = CATEGORY_MAPPING[activeMaterialCategory];
          if (mapping && mapping.length > 0) {
              defaultCategory = mapping[activeMaterialCategory === '바닥' ? 1 : 0] || activeMaterialCategory; // '바닥' -> '바닥마감' prefer
          } else {
              defaultCategory = activeMaterialCategory;
          }
      }

      const newItem: MaterialDatabaseItem = {
          id: `m${Date.now()}`,
          category: defaultCategory,
          subCategory: '',
          grade: 'standard', 
          brand: '',
          name: '신규 자재',
          spec: '',
          unit: 'ea',
          price: 0,
          link: '',
          laborRef: '',
          workLink: { laborType: 'none' }, // Initialize workLink
          lastUpdated: new Date().toISOString().split('T')[0]
      };
      setMaterials([...materials, newItem]);
  };

  const toggleUpdateSelection = (id: string, type: 'new' | 'update') => {
      const setFunc = type === 'new' ? setSelectedNewItems : setSelectedUpdates;
      setFunc(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const toggleScanCategory = (cat: string) => {
      setSelectedScanCategories(prev => {
          const next = new Set(prev);
          if (next.has(cat)) next.delete(cat);
          else next.add(cat);
          return next;
      });
  };

  // Filter Materials based on Active Tab using CATEGORY_MAPPING
  const filteredMaterials = activeMaterialCategory === '전체' 
      ? materials 
      : materials.filter(m => {
          const keywords = CATEGORY_MAPPING[activeMaterialCategory];
          if (!keywords) return m.category === activeMaterialCategory;
          // Check if item's category OR subCategory CONTAINS any of the keywords or Matches exactly
          return keywords.some(k => 
              m.category.includes(k) || 
              m.category === k ||
              (m.subCategory && m.subCategory.includes(k))
          );
      });

  // Calculate scan categories based on Tabs
  const scanOptions = CATEGORY_TABS.filter(c => c !== '전체');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end animate-fade-in">
      <style>{`
        /* Strong Scrollbar Hiding for Chrome/Safari/Webkit */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        /* Fallback for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
        }
      `}</style>
      
      {/* Outer Container: Overflow Hidden to prevent double scrollbars */}
      <div className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-900 text-white flex justify-between items-center sticky top-0 z-20 shadow-md flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            ⚙️ 관리자 설정 패널
          </h2>
          <div className="flex items-center gap-3">
              {/* Backup Controls */}
              <button 
                  onClick={handleImportClick} 
                  className="px-3 py-1.5 bg-gray-700 text-gray-200 text-xs font-bold rounded hover:bg-gray-600 flex items-center gap-1 border border-gray-600"
                  title="저장된 파일을 불러와서 현재 데이터를 덮어씁니다"
              >
                  📥 데이터 복원
              </button>
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileRead} 
                  accept=".json" 
                  className="hidden" 
              />
              <button 
                  onClick={handleExportData} 
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 flex items-center gap-1 shadow-md"
                  title="현재 설정(자재, 단가, 인건비)을 파일로 저장합니다"
              >
                  💾 전체 백업 (저장하기)
              </button>
              
              <div className="h-6 w-px bg-gray-700 mx-1"></div>

              <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-gray-200 bg-white sticky top-[76px] z-10 flex-shrink-0 overflow-x-auto hide-scrollbar">
           {['materials', 'prices', 'labor', 'guidelines', 'contractors'].map(tab => (
               <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`flex-1 min-w-[120px] py-4 text-sm font-bold capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
               >
                   {tab === 'materials' ? '🧱 자재 리스트 관리' : tab === 'prices' ? '💰 기본 단가 관리' : tab === 'labor' ? '👷 인건비 관리' : tab === 'guidelines' ? '📝 가이드라인' : '🕵️ 시공자 관리'}
               </button>
           ))}
        </div>

        {/* Main Content Area: Scrollable but Hidden Scrollbar */}
        <div 
            className="p-8 bg-gray-50 flex-grow overflow-y-auto hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {/* 0. Material Database Management (NEW CORE FEATURE) */}
            {activeTab === 'materials' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">🧱 자재 라이브러리 (Master DB)</h3>
                            <p className="text-xs text-gray-500 mt-1">AI가 사용할 자재 품목을 미리 정의합니다. 로딩 속도가 빨라지고 견적이 정확해집니다.</p>
                        </div>
                        <div className="flex gap-2">
                            {/* NEW: Verify Only Button */}
                            <button 
                                onClick={() => openScanModal('verify_only')} 
                                disabled={isUpdatingMaterials} 
                                className="px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                            >
                                <span>⚖️ 기존 값 현 시세 검증</span>
                            </button>
                            {/* Existing Scan Button (Updated) */}
                            <button 
                                onClick={() => openScanModal('scan_and_update')} 
                                disabled={isUpdatingMaterials} 
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                            >
                                {isUpdatingMaterials ? '스캔 및 분석 중...' : '🌐 AI 신규 자재 발굴 & 단가 스캔'}
                            </button>
                            
                            <button onClick={handleSaveMaterials} className={`px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-900'}`}>
                                {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '✅ 저장 완료!' : '저장하기'}
                            </button>
                        </div>
                    </div>

                    {/* --- CATEGORY FILTER TABS (NEW) --- */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar items-center">
                        <span className="text-xs font-bold text-gray-500 mr-2 flex-shrink-0">공정별 필터:</span>
                        {CATEGORY_TABS.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveMaterialCategory(cat)} 
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeMaterialCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {cat}
                                {activeMaterialCategory === cat && ` (${filteredMaterials.length})`}
                            </button>
                        ))}
                    </div>

                    {/* --- RESTORE OPTIONS MODAL (NEW) --- */}
                    {restoreModalData && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in">
                            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
                                <div className="text-center mb-6">
                                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <span className="text-2xl">📥</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">데이터 복원 옵션 선택</h3>
                                    <p className="text-sm text-gray-500 mt-1">백업 파일 날짜: {restoreModalData.timestamp.split('T')[0]}</p>
                                </div>
                                
                                {/* 1. Initial Option Selection */}
                                {!mergeStats && (
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => handleRestoreOption('merge')}
                                            className="w-full p-4 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-3 transition-colors group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">A</div>
                                            <div>
                                                <h4 className="font-bold text-blue-900 text-sm">없는 항목만 추가 (병합)</h4>
                                                <p className="text-xs text-blue-700 mt-0.5">현재 데이터를 유지하고, 백업 파일의 새로운 항목만 추가합니다.</p>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => handleRestoreOption('overwrite')}
                                            className="w-full p-4 border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 rounded-xl flex items-center gap-3 transition-colors group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500 font-bold group-hover:bg-red-500 group-hover:text-white transition-colors">B</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm group-hover:text-red-700">전체 덮어쓰기 (초기화)</h4>
                                                <p className="text-xs text-gray-500 mt-0.5 group-hover:text-red-500">현재 데이터를 모두 삭제하고 백업 내용으로 교체합니다.</p>
                                            </div>
                                        </button>
                                        
                                        <button 
                                            onClick={() => setRestoreModalData(null)}
                                            className="w-full mt-6 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg"
                                        >
                                            취소
                                        </button>
                                    </div>
                                )}

                                {/* 2. Merge Preview Screen */}
                                {mergeStats && (
                                    <div className="animate-fade-in">
                                        <h4 className="font-bold text-indigo-900 mb-3 border-b pb-2">🔍 병합 상세 분석 결과</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 mb-4">
                                            {mergeStats.details.length > 0 ? (
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {mergeStats.details.map((detail, idx) => (
                                                        <li key={idx} className="font-medium">{detail}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-500 text-center py-2">추가될 새로운 항목이 없습니다.<br/>(이미 모든 데이터가 존재함)</p>
                                            )}
                                            <div className="mt-3 pt-3 border-t border-gray-200 font-bold text-right text-indigo-700">
                                                총 {mergeStats.totalNew}건 추가 예정
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setMergeStats(null)}
                                                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                                            >
                                                뒤로
                                            </button>
                                            <button 
                                                onClick={performMerge}
                                                disabled={mergeStats.totalNew === 0}
                                                className={`flex-1 py-3 font-bold rounded-lg text-white shadow-md ${mergeStats.totalNew === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                            >
                                                확인 및 병합 실행
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- SCAN CONFIGURATION MODAL --- */}
                    {showScanModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in-up border border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {scanMode === 'scan_and_update' ? '🌐 자재 발굴 및 스캔 옵션' : '⚖️ 기존 단가 시세 검증'}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    {scanMode === 'scan_and_update' 
                                      ? '분석할 공정을 선택해주세요. 선택한 공정의 인기 품목을 발굴하고 기존 단가를 점검합니다.'
                                      : '검증할 공정을 선택해주세요. 신규 추가 없이, 기존 항목의 가격 변동만 체크합니다.'}
                                </p>
                                
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-gray-700">공정 선택 (다중 선택 가능)</label>
                                        <div className="space-x-2">
                                            <button onClick={() => setSelectedScanCategories(new Set(scanOptions))} className="text-xs text-blue-600 underline">전체 선택</button>
                                            <button onClick={() => setSelectedScanCategories(new Set())} className="text-xs text-gray-400 underline">해제</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {scanOptions.map(cat => (
                                            <label key={cat} className={`flex items-center justify-center p-2 rounded border cursor-pointer text-sm font-medium transition-colors ${selectedScanCategories.has(cat) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                                                <input type="checkbox" className="hidden" checked={selectedScanCategories.has(cat)} onChange={() => toggleScanCategory(cat)} />
                                                {cat}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setShowScanModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">취소</button>
                                    <button onClick={executeMaterialScan} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">
                                        {scanMode === 'scan_and_update' ? '🚀 선택 공정 스캔 시작' : '🔍 시세 검증 시작'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Scan Results (Conditional Render) */}
                    {pendingMaterialUpdates && (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6 animate-fade-in-up shadow-inner">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-blue-900 text-lg">🔍 AI 분석 결과 (검토 후 반영)</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setPendingMaterialUpdates(null)} className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-bold hover:bg-gray-400">취소</button>
                                    <button onClick={handleApplyMaterialChanges} className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 shadow">선택 항목 반영 및 저장</button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* New Items List */}
                                <div className="bg-white p-4 rounded-lg border border-blue-100 relative">
                                    <h5 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                                        <span className="bg-green-100 px-2 rounded text-xs">NEW</span> 신규 발굴 자재 ({pendingMaterialUpdates.newItems.length}건)
                                    </h5>
                                    {pendingMaterialUpdates.newItems.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-8">신규 발굴된 항목이 없습니다.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {pendingMaterialUpdates.newItems.map(item => (
                                                <label key={item.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded border border-gray-100 cursor-pointer">
                                                    <input type="checkbox" checked={selectedNewItems.has(item.id)} onChange={() => toggleUpdateSelection(item.id, 'new')} className="mt-1" />
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-900">{item.brand} {item.name}</div>
                                                        <div className="text-[10px] text-gray-600">{item.spec} / {item.price.toLocaleString()}원</div>
                                                        {item.reason && <div className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded inline-block mt-1">💡 {item.reason}</div>}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Updates List */}
                                <div className="bg-white p-4 rounded-lg border border-blue-100 relative">
                                    <h5 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                                        <span className="bg-orange-100 px-2 rounded text-xs">UPDATE</span> 단가 변동 ({pendingMaterialUpdates.updates.length}건)
                                    </h5>
                                    {pendingMaterialUpdates.updates.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-8">가격 변동이 감지된 항목이 없습니다.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {pendingMaterialUpdates.updates.map(item => {
                                                const oldItem = materials.find(m => m.id === item.id);
                                                const isIncrease = item.price > (oldItem?.price || 0);
                                                return (
                                                    <label key={item.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded border border-gray-100 cursor-pointer">
                                                        <input type="checkbox" checked={selectedUpdates.has(item.id)} onChange={() => toggleUpdateSelection(item.id, 'update')} className="mt-1" />
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-900">{item.name}</div>
                                                            <div className="text-[10px] text-gray-600 flex items-center gap-1">
                                                                기존가 → <span className={`font-bold ${isIncrease ? 'text-red-500' : 'text-blue-500'}`}>{item.price.toLocaleString()}원</span>
                                                                <span className="text-[9px] text-gray-400">({isIncrease ? '▲' : '▼'}변동)</span>
                                                            </div>
                                                            {item.reason && <div className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded mt-1">{item.reason}</div>}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">공정</th>
                                        <th className="px-4 py-3">브랜드/품명</th>
                                        <th className="px-4 py-3">규격/단위</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">단가(원)</th>
                                        <th className="px-4 py-3 whitespace-nowrap">연관 인건비</th>
                                        <th className="px-4 py-3 whitespace-nowrap">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMaterials.map((m) => {
                                        // Find original index in the main 'materials' array to allow updating
                                        const originalIndex = materials.findIndex(item => item.id === m.id);
                                        return (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 align-top">
                                                    <input type="text" value={m.category} onChange={e => handleMaterialChange(originalIndex, 'category', e.target.value)} className="w-24 border border-gray-300 rounded p-1 text-xs font-bold bg-white text-gray-900" placeholder="카테고리" />
                                                    <input type="text" value={m.subCategory || ''} onChange={e => handleMaterialChange(originalIndex, 'subCategory', e.target.value)} className="w-24 border border-gray-300 rounded p-1 text-xs mt-1 block bg-white text-gray-900" placeholder="상세분류" />
                                                </td>
                                                <td className="px-4 py-2 align-top">
                                                    <input type="text" value={m.brand} onChange={e => handleMaterialChange(originalIndex, 'brand', e.target.value)} className="w-full border border-gray-300 rounded p-1 text-xs font-bold text-indigo-900 bg-white mb-1" placeholder="브랜드" />
                                                    <input type="text" value={m.name} onChange={e => handleMaterialChange(originalIndex, 'name', e.target.value)} className="w-full border border-gray-300 rounded p-1 text-xs bg-white text-gray-900" placeholder="상품명" />
                                                </td>
                                                <td className="px-4 py-2 align-top">
                                                    <div className="flex gap-1">
                                                        <input type="text" value={m.spec} onChange={e => handleMaterialChange(originalIndex, 'spec', e.target.value)} className="w-20 border border-gray-300 rounded p-1 text-xs bg-white text-gray-900" placeholder="규격" />
                                                        <input type="text" value={m.unit} onChange={e => handleMaterialChange(originalIndex, 'unit', e.target.value)} className="w-12 border border-gray-300 rounded p-1 text-xs text-center bg-white text-gray-900" placeholder="단위" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 align-top text-right">
                                                    <input type="number" value={m.price} onChange={e => handleMaterialChange(originalIndex, 'price', parseInt(e.target.value))} className="w-24 border border-gray-300 rounded p-1 text-xs text-right font-bold bg-white text-gray-900" />
                                                </td>
                                                <td className="px-4 py-2 align-top">
                                                    <select 
                                                        value={m.laborRef || ''} 
                                                        onChange={e => handleMaterialChange(originalIndex, 'laborRef', e.target.value)}
                                                        className="w-full border border-gray-300 rounded p-1 text-xs bg-white text-gray-900"
                                                    >
                                                        <option value="">(선택)</option>
                                                        {laborData && Object.keys(laborData.dailyWages).map(k => (
                                                            <option key={k} value={k}>{LABOR_LABEL_MAP[k] || k}</option>
                                                        ))}
                                                    </select>
                                                    {m.link && <a href={m.link} target="_blank" className="text-[10px] text-blue-500 block mt-1 truncate max-w-[100px] hover:underline">🔗 구매링크</a>}
                                                </td>
                                                <td className="px-4 py-2 align-top text-center">
                                                    <button onClick={() => handleDeleteMaterial(originalIndex)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">🗑️</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredMaterials.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                                                {activeMaterialCategory === '전체' 
                                                    ? "등록된 자재가 없습니다." 
                                                    : `'${activeMaterialCategory}' 관련 자재가 없습니다. '스캔 및 발굴' 버튼을 눌러 추가해보세요.`}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={handleAddMaterial} className="w-full py-3 bg-gray-50 text-gray-500 font-bold text-sm hover:bg-gray-100 border-t border-gray-200">
                            + {activeMaterialCategory !== '전체' ? `'${activeMaterialCategory}' 관련 항목으로` : ''} 수동 추가하기
                        </button>
                    </div>
                </div>
            )}

            {/* ... (Rest of tabs remain unchanged) ... */}
            {/* ... (Existing code for prices, labor, guidelines, contractors) ... */}
            {activeTab === 'prices' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                    {/* ... Same content as before ... */}
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">표준 단가표 관리</h3>
                            <p className="text-xs text-gray-500 mt-1">AI 견적 산출 시 기준이 되는 자재 및 시공 단가를 관리합니다.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAnalyzePrices} disabled={isAnalyzingPrices} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                                {isAnalyzingPrices ? '분석 중...' : '🤖 AI 누락 항목 진단 & 시장가 분석'}
                            </button>
                            <button onClick={handleSavePrices} className={`px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-900'}`}>
                                {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '✅ 저장 완료!' : '저장하기'}
                            </button>
                        </div>
                    </div>
                    {/* ... (Rest of Price Tab UI) ... */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {priceTable.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-center p-4 border-b border-gray-100 last:border-0">
                                    <div className="col-span-2">
                                        <input type="text" value={item.category} onChange={(e) => { const n = [...priceTable]; n[idx].category = e.target.value; setPriceTable(n); }} className="w-full text-xs font-bold bg-white text-gray-900 border border-gray-300 rounded p-1 text-center" />
                                    </div>
                                    <div className="col-span-5">
                                         <input type="text" value={item.item} onChange={(e) => { const n = [...priceTable]; n[idx].item = e.target.value; setPriceTable(n); }} className="w-full text-sm font-bold bg-white text-gray-900 border border-gray-300 rounded p-2" />
                                         <input type="text" value={item.description} onChange={(e) => { const n = [...priceTable]; n[idx].description = e.target.value; setPriceTable(n); }} className="w-full text-xs text-gray-500 bg-white mt-1 border-none p-0 focus:ring-0" placeholder="설명" />
                                    </div>
                                    <div className="col-span-4 relative">
                                        <input type="number" value={item.priceStandard} onChange={(e) => { const n = [...priceTable]; n[idx].priceStandard = parseInt(e.target.value); setPriceTable(n); }} className="w-full text-base font-bold text-right bg-white text-gray-900 border border-indigo-200 rounded p-2 pr-8" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">원</span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                         <button onClick={() => setPriceTable(priceTable.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 font-bold p-2">×</button>
                                    </div>
                                </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'labor' && laborData && (
                <div className="space-y-6 max-w-4xl mx-auto">
                    {/* ... Same content as before ... */}
                    <div className="flex justify-between items-center">
                         <div>
                            <h3 className="text-lg font-bold text-gray-900">인건비 및 생산성 관리</h3>
                            <p className="text-xs text-gray-500 mt-1">2024-2025 기준 일일 노무비(품)를 설정합니다.</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={handleAnalyzeLabor} disabled={isAnalyzingLabor} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                                {isAnalyzingLabor ? '분석 중...' : '🤖 AI 적정 노임 분석'}
                            </button>
                            <button onClick={handleSaveLabor} className={`px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '✅ 저장 완료!' : '저장하기'}
                            </button>
                         </div>
                    </div>
                    {/* ... (Rest of Labor Tab UI) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">👷 일일 노무비 (Daily Wages)</h4>
                            <div className="space-y-4">
                                {Object.entries(laborData.dailyWages).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-gray-700">{LABOR_LABEL_MAP[key] || key}</label>
                                        <div className="relative w-40">
                                            <input type="number" value={value as number} onChange={(e) => setLaborData({...laborData, dailyWages: {...laborData.dailyWages, [key]: parseInt(e.target.value)}})} className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-8 text-right font-extrabold text-gray-900 bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">원</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">⚡️ 생산성 계수 (할증률)</h4>
                             <div className="space-y-4">
                                {Object.entries(laborData.productivity).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-600 capitalize">{key.replace('_', ' ')}</label>
                                        <input type="number" step="0.01" value={value as number} onChange={(e) => setLaborData({...laborData, productivity: {...laborData.productivity, [key]: parseFloat(e.target.value)}})} className="w-24 border border-gray-300 rounded-md py-2 text-center font-bold text-indigo-600 bg-white focus:ring-indigo-500 shadow-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'guidelines' && (
                <div className="space-y-4 max-w-5xl mx-auto h-full flex flex-col">
                    <div className="flex justify-between items-center flex-shrink-0">
                         <div>
                            <h3 className="text-lg font-bold text-gray-900">AI 참조 가이드라인 (System Prompt)</h3>
                            <p className="text-xs text-gray-500 mt-1">AI가 견적/공정표 생성 시 준수해야 할 필수 시공 지침입니다.</p>
                         </div>
                         <button onClick={handleSaveGuidelines} className={`px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                            {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '✅ 저장 완료!' : '저장하기'}
                         </button>
                    </div>
                    <div className="flex-grow border border-gray-300 rounded-xl overflow-hidden shadow-inner">
                        <textarea value={guidelines} onChange={(e) => setGuidelines(e.target.value)} className="w-full h-full p-6 font-mono text-sm bg-gray-50 text-gray-900 focus:bg-white focus:ring-0 focus:outline-none leading-relaxed resize-none" placeholder="존슨 지침 내용을 불러오는 중입니다..." />
                    </div>
                </div>
            )}

            {activeTab === 'contractors' && (
                <div className="space-y-6 max-w-5xl mx-auto h-full">
                    {editingContractor ? (
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 animate-fade-in-up">
                             <h3 className="text-xl font-bold mb-6 border-b pb-2">{editingContractor.name ? '시공자 정보 수정' : '신규 시공자 등록'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">업체명</label><input type="text" value={editingContractor.name} onChange={e => setEditingContractor({...editingContractor, name: e.target.value})} className="w-full border p-2 rounded bg-white text-gray-900 border-gray-300" placeholder="예: 김목수 TV" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">전문 분야</label><select value={editingContractor.type} onChange={e => setEditingContractor({...editingContractor, type: e.target.value})} className="w-full border p-2 rounded bg-white text-gray-900 border-gray-300"><option value="종합 인테리어">종합 인테리어</option><option value="목공">목공</option><option value="타일 시공">타일</option><option value="전기 조명">전기/조명</option><option value="철거">철거</option><option value="도배">도배</option><option value="설비">설비</option></select></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">활동 지역</label><input type="text" value={editingContractor.region} onChange={e => setEditingContractor({...editingContractor, region: e.target.value})} className="w-full border p-2 rounded bg-white text-gray-900 border-gray-300" placeholder="예: 서울 강남/송파, 경기 남부" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">연락처</label><input type="text" value={editingContractor.contact} onChange={e => setEditingContractor({...editingContractor, contact: e.target.value})} className="w-full border p-2 rounded bg-white text-gray-900 border-gray-300" placeholder="010-0000-0000" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">경력</label><input type="text" value={editingContractor.career || ''} onChange={e => setEditingContractor({...editingContractor, career: e.target.value})} className="w-full border p-2 rounded bg-white text-gray-900 border-gray-300" placeholder="예: 25년" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">홍보 채널</label><div className="flex gap-2"><select value={editingContractor.platform || 'offline'} onChange={e => setEditingContractor({...editingContractor, platform: e.target.value as any})} className="border p-2 rounded w-36 bg-white text-gray-900 border-gray-300"><option value="offline">현장팀 (오프라인)</option><option value="youtube">유튜브</option><option value="instagram">인스타그램</option><option value="blog">블로그</option><option value="website">홈페이지</option></select><input type="text" value={editingContractor.snsLink || ''} onChange={e => setEditingContractor({...editingContractor, snsLink: e.target.value})} className="flex-1 border p-2 rounded bg-white text-gray-900 border-gray-300" placeholder="https://..." disabled={editingContractor.platform === 'offline'}/></div></div>
                                <div className="col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">한줄 소개</label><input type="text" value={editingContractor.description} onChange={e => setEditingContractor({...editingContractor, description: e.target.value})} className="w-full border p-2 rounded bg-white text-gray-900 border-gray-300" placeholder="예: 30년 경력, 9mm 문선 전문, 졸리컷 가능" /></div>
                                <div className="col-span-2"><label className="block text-sm font-bold text-indigo-700 mb-1">🛡️ 관리자 인증 코멘트</label><textarea value={editingContractor.verificationNote || ''} onChange={e => setEditingContractor({...editingContractor, verificationNote: e.target.value})} className="w-full border p-3 rounded bg-indigo-50 text-gray-900 border-indigo-200 focus:ring-indigo-500 min-h-[80px]" placeholder="관리자가 직접 확인한 내용을 적어주세요." /></div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3"><button onClick={() => setEditingContractor(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">취소</button><button onClick={handleSaveContractorForm} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 shadow-md">저장 및 등록</button></div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div><h3 className="text-lg font-bold text-gray-900">검증된 시공자 목록</h3><p className="text-xs text-gray-500 mt-1">관리자가 직접 검증한 은둔 고수(Hidden Gems) DB입니다.</p></div>
                                <button onClick={handleAddContractor} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm shadow-md flex items-center gap-2"><span>+</span> 신규 시공자 등록</button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {contractors.map(c => (
                                    <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-300 transition-colors">
                                        <div className="flex items-start gap-4 flex-grow">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${c.platform === 'youtube' ? 'bg-red-100 text-red-600' : c.platform === 'instagram' ? 'bg-pink-100 text-pink-600' : 'bg-gray-200 text-gray-600'}`}>{c.platform === 'youtube' ? '▶️' : c.platform === 'instagram' ? '📸' : '👷'}</div>
                                            <div className="flex-grow"><div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold text-gray-900">{c.name}</h4><span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">{c.type}</span>{c.career && <span className="text-xs bg-yellow-100 px-2 py-0.5 rounded text-yellow-800 border border-yellow-200 font-bold">{c.career}</span>}</div><p className="text-sm text-gray-600 mt-1">{c.description}</p>{c.verificationNote && (<div className="mt-2 bg-indigo-50 p-2 rounded text-xs text-indigo-800 border-l-2 border-indigo-400"><span className="font-bold">🛡️ 검증 노트:</span> {c.verificationNote}</div>)}<div className="flex items-center gap-3 mt-2 text-xs text-gray-400"><span>📍 {c.region}</span><span>📞 {c.contact}</span>{c.platform !== 'offline' && c.snsLink && (<a href={c.snsLink} target="_blank" className="text-indigo-500 hover:underline">🔗 채널 링크</a>)}</div></div>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto self-start md:self-center"><button onClick={() => setEditingContractor(c)} className="flex-1 md:flex-none px-3 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200">수정</button><button onClick={() => handleDeleteContractor(c.id)} className="flex-1 md:flex-none px-3 py-2 bg-red-50 text-red-600 text-sm font-bold rounded hover:bg-red-100">삭제</button></div>
                                    </div>
                                ))}
                                {contractors.length === 0 && (<div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">등록된 전문가가 없습니다.</div>)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
