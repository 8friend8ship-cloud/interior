
import React, { useState, useEffect, useRef } from 'react';
import { ProjectDetails, BathroomSpecifics, ProjectScopeFlags, DetailedScope } from '../types';
import { MOCK_IMAGE_BASE64 } from '../constants/mockData';

interface UserInputFormProps {
  onSubmit: (details: ProjectDetails) => void;
  error: string | null;
}

const expansionAreas = [
    { id: 'livingRoom', label: '거실' },
    { id: 'room1', label: '입구방' },
    { id: 'room2', label: '중간방' },
    { id: 'room3', label: '안방' },
];

type TabType = 'full' | 'bathroom';
type UnitType = 'py' | 'm2';

export const UserInputForm: React.FC<UserInputFormProps> = ({ onSubmit, error }) => {
  const [activeTab, setActiveTab] = useState<TabType>('full');

  // Common Fields
  const [image, setImage] = useState<{ file: File; preview: string; } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [requests, setRequests] = useState('');
  
  // Date & Area & Address & Budget
  const [targetDate, setTargetDate] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [area, setArea] = useState('32');
  const [areaUnit, setAreaUnit] = useState<UnitType>('py');
  const [address, setAddress] = useState(''); 
  const [budget, setBudget] = useState<number | ''>(''); 

  // Date Picker Refs
  const targetDateRef = useRef<HTMLInputElement>(null);
  const moveInDateRef = useRef<HTMLInputElement>(null);

  // Counts
  const [roomCount, setRoomCount] = useState<number | undefined>(3);
  const [userBathCount, setUserBathCount] = useState<number | undefined>(2);
  
  // Basic Scope Checklist (Main Toggles)
  const [scopes, setScopes] = useState<ProjectScopeFlags>({
      sash: true, door: true, bath1: true, bath2: true, 
      molding: true, flatCeiling: true, kitchenSink: true, 
      balconyPaint: true, film: true, builtIn: true,
      electrical: true, entryDoor: false, insulation: false, systemAC: false,
      
      // Master Toggles
      expansion: false,
      tile: true,
      wallpaper: true,
      flooring: true,
  });

  // Detailed Scopes
  const [alreadyExpandedAreas, setAlreadyExpandedAreas] = useState<string[]>([]);
  const [needsExpansionAreas, setNeedsExpansionAreas] = useState<string[]>([]);
  
  const [tileScopes, setTileScopes] = useState({ kitchen: true, entrance: true, balcony: true });
  const [wallpaperMode, setWallpaperMode] = useState<'all_silk' | 'all_paper' | 'combo'>('all_silk');
  
  // Flooring States
  const [flooringLayout, setFlooringLayout] = useState<'all_maru' | 'all_jangpan' | 'all_tile' | 'mix_tile_maru' | 'mix_maru_jangpan'>('all_maru');
  const [maruSpec, setMaruSpec] = useState<'gang' | 'texture'>('gang');
  const [jangpanSpec, setJangpanSpec] = useState<'1.8' | '2.2' | '5.0'>('2.2');
  const [tileSpec, setTileSpec] = useState<'600' | '800'>('600');
  
  const [sashScope, setSashScope] = useState<'all' | 'partial'>('all');
  const [sashPartialText, setSashPartialText] = useState<string>('');

  // Door Mode
  const [doorMode, setDoorMode] = useState<'replace_all' | 'replace_door_film_frame' | 'film_both' | 'paint_both'>('replace_all');

  // NEW: Carpentry & Entry Door States
  const [moldingType, setMoldingType] = useState<'minus' | 'flat' | 'crown'>('flat');
  const [entryDoorType, setEntryDoorType] = useState<'3yeondong' | 'swing' | 'onesliding'>('3yeondong');
  const [insulationArea, setInsulationArea] = useState<string>('');

  // Paint Scopes
  const [paintScopes, setPaintScopes] = useState({
      balconyType: 'ceramic' as 'ceramic' | 'water',
      livingWall: false,
      ceiling: false,
      whole: false
  });

  // Film Scopes
  const [filmScopes, setFilmScopes] = useState<{
      doors: boolean;
      doorsCount?: number;
      builtIn: boolean;
      builtInCount?: number;
      sink: boolean;
      sinkSize?: number;
      entrance: boolean;
      walls?: string;
  }>({
      doors: true,
      doorsCount: 5,
      builtIn: false,
      builtInCount: 1,
      sink: false,
      sinkSize: 3,
      entrance: false,
      walls: ''
  });

  // NEW: Administrative & Prep Scope
  const [adminMode, setAdminMode] = useState<'include' | 'self'>('include');
  const [adminScopes, setAdminScopes] = useState({
      permit: false,
      consent: true, 
      protection: true 
  });

  // Scope Confirmation State (Lock)
  const [isScopeConfirmed, setIsScopeConfirmed] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false); // Loading state for validation

  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  // Detailed Quantity Inputs
  const [kitchenSinkSize, setKitchenSinkSize] = useState<number>(4); 
  const [kitchenSinkGrade, setKitchenSinkGrade] = useState<'pet' | 'painted'>('pet');
  const [systemAcCount, setSystemAcCount] = useState<number>(3);
  const [windowCount, setWindowCount] = useState<number>(5); 
  const [doorCount, setDoorCount] = useState<number>(5);

  // Bathroom Specific Fields
  const [bathOnlyCount, setBathOnlyCount] = useState<number>(1);
  const [bathType, setBathType] = useState<'overlay' | 'demolition'>('demolition');
  const [tileGrade, setTileGrade] = useState<'standard' | 'high_end'>('standard');
  const [ceilingType, setCeilingType] = useState<'smc' | 'barrisol' | 'paint'>('smc'); 
  const [isJollyCut, setIsJollyCut] = useState(false);
  
  // UPDATED: Wet Zone Method instead of BathtubType
  const [wetZoneMethod, setWetZoneMethod] = useState<'bathtub' | 'partition' | 'booth' | 'tile_wall' | 'none'>('partition');
  
  const [vanityCount, setVanityCount] = useState<number>(1);
  const [cabinetType, setCabinetType] = useState<'sliding' | 'standard' | 'flap'>('sliding'); 
  const [hasGendai, setHasGendai] = useState(true);
  const [replaceDoor, setReplaceDoor] = useState(true);
  const [removeRadiator, setRemoveRadiator] = useState(false);
  
  // Dimensions for Bathroom
  const [bathWidth, setBathWidth] = useState<string>('2.2');
  const [bathDepth, setBathDepth] = useState<string>('1.6');
  const [bathHeight, setBathHeight] = useState<string>('2.3');
  const [useDimensionsOnly, setUseDimensionsOnly] = useState(false);

  // Validation State
  const [isFormValid, setIsFormValid] = useState(false);

  // EFFECT: Automatically enable/disable Admin Scopes based on Expansion
  useEffect(() => {
      if (adminMode === 'include') {
          if (scopes.expansion) {
              setAdminScopes({
                  permit: true,
                  consent: true,
                  protection: true
              });
          } else {
              setAdminScopes(prev => ({ ...prev, permit: false }));
          }
      }
  }, [scopes.expansion, adminMode]);

  useEffect(() => {
      checkFormValidity();
  }, [area, targetDate, moveInDate, image, useDimensionsOnly, activeTab, bathWidth, bathDepth, bathHeight, isScopeConfirmed]);

  const checkFormValidity = () => {
      let valid = false;
      if (activeTab === 'full') {
          // 공사희망일(시작) 필수, 입주예상일(종료) 필수, 그리고 **공사 내용 확인(isScopeConfirmed)** 필수
          valid = !!area && !!targetDate && !!moveInDate && !!image && isScopeConfirmed;
      } else {
          // Bathroom
          if (useDimensionsOnly) {
              valid = !!targetDate && !!bathWidth && !!bathDepth && !!bathHeight;
          } else {
              valid = !!targetDate && !!image;
          }
      }
      setIsFormValid(valid);
  };

  // Conflict Detection Function
  const checkConflicts = (): string[] => {
      const conflicts: string[] = [];

      if (activeTab === 'full') {
          // 1. Wallpaper vs Paint Conflict
          if (scopes.wallpaper) {
              if (paintScopes.whole) {
                  conflicts.push("❌ [벽면 마감 중복] '전체 도배'와 '실내 전체 페인트 도장'이 동시에 선택되었습니다.");
              }
              if (wallpaperMode !== 'combo' && paintScopes.livingWall) {
                  conflicts.push("❌ [거실 마감 중복] '전체 도배' 상태에서는 '거실 벽체 페인트'를 추가할 수 없습니다.");
              }
          }

          // 2. Flooring Logic Check
          if (scopes.flooring) {
              // Future checks can be added here
          }
      }
      return conflicts;
  };

  // --- Confirmation Checkbox Handler (Logic Update) ---
  const handleConfirmationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;

      // If unchecking, just set to false
      if (!isChecked) {
          setIsScopeConfirmed(false);
          return;
      }

      // If checking, run validation first
      setIsCheckingConflicts(true);

      // Artificial Delay reduced from 800ms to 400ms for better responsiveness
      await new Promise(resolve => setTimeout(resolve, 400));

      // 1. Check Missing Info (Strict Block)
      if (!area || !targetDate || !moveInDate || (!image && !useDimensionsOnly)) {
           alert("⚠️ [필수 정보 누락]\n기본 정보(평수, 일정, 도면)가 입력되지 않았습니다.\n맨 위로 이동하여 빨간색(*) 필수 항목을 채워주세요.");
           setIsCheckingConflicts(false);
           setIsScopeConfirmed(false);
           return;
      }

      // 2. Check Conflicts (Soft Block - User Choice)
      const conflicts = checkConflicts();
      if (conflicts.length > 0) {
          const message = `🚨 [중복 항목 감지]\nAI가 설정 내역에서 다음 충돌을 발견했습니다.\n\n${conflicts.join('\n')}\n\n👉 [취소]: 돌아가서 수정하기\n👉 [확인]: 무시하고 그대로 진행하기`;
          const proceedAnyway = window.confirm(message);
          
          if (!proceedAnyway) {
              // User wants to fix it
              setIsCheckingConflicts(false);
              setIsScopeConfirmed(false);
              return;
          }
          // If User clicks OK, we proceed to set it TRUE below
      }

      // 3. All Clear (or User overrode conflicts)
      setIsScopeConfirmed(true);
      setIsCheckingConflicts(false);
  };

  // --- 간편 견적 (올수리) 프리셋 핸들러 ---
  const handleStandardPreset = () => {
      setActiveTab('full');
      setScopes({
          sash: true, // 샷시 기본 포함
          door: true,
          bath1: true,
          bath2: true,
          molding: true,
          flatCeiling: true,
          kitchenSink: true,
          balconyPaint: true,
          film: true,
          builtIn: true,
          electrical: true,
          entryDoor: true,
          insulation: true, 
          systemAC: false, // 옵션
          expansion: false, // **확장 여부는 사용자가 체크하도록 False**
          tile: true,
          wallpaper: true,
          flooring: true
      });
      // 세부 스펙도 표준으로 리셋
      setWallpaperMode('all_silk');
      setFlooringLayout('all_maru');
      setMaruSpec('gang');
      setDoorMode('replace_all');
      setMoldingType('flat'); // NEW
      setEntryDoorType('3yeondong'); // NEW
      
      // Admin Defaults
      setAdminMode('include'); // Default to included
      setAdminScopes({ permit: false, consent: true, protection: true });

      // Reset confirmation to force review
      setIsScopeConfirmed(false); 
      
      // Calculate Display Area for Alert
      let displayArea = area || '32';
      if (areaUnit === 'm2' && area) {
         displayArea = `${Math.round(parseFloat(area) / 3.3058)}평 (${area}㎡)`;
      } else {
         displayArea = `${displayArea}평`;
      }

      alert(`✅ 입력하신 [${displayArea}] 기준으로 표준 공사 내용이 자동 설정되었습니다.\n\n[필독: 다음 단계를 진행해주세요]\n1. 아래 '2. 공사 내용' 리스트가 자동으로 체크되었습니다.\n2. 변경할 부분이 있는지 스크롤하여 확인해주세요.\n3. 확인 후 최하단의 '위 내용으로 진행 확인' 박스를 체크해야 견적이 생성됩니다.`);
  };

  // Helper for button text
  const getButtonText = () => {
      if (!area) return '32평';
      if (areaUnit === 'm2') {
          const py = Math.round(parseFloat(area) / 3.3058);
          return `${py}평 (${area}㎡)`;
      }
      return `${area}평`;
  };

  // ... (File handlers preserved) ...
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = err => reject(err);
  });

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0] && files[0].type.startsWith('image/')) {
      setImage({
        file: files[0],
        preview: URL.createObjectURL(files[0])
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };
  
  const handleScopeChange = (key: keyof ProjectScopeFlags) => {
      setScopes(prev => ({ ...prev, [key]: !prev[key] }));
      setIsScopeConfirmed(false); // Reset confirmation on any change
  };

  const handleExpansionChange = (areaId: string, type: 'already' | 'needs') => {
    const [targetList, setTargetList] = type === 'already' 
        ? [alreadyExpandedAreas, setAlreadyExpandedAreas] 
        : [needsExpansionAreas, setNeedsExpansionAreas];
    
    if (targetList.includes(areaId)) {
        setTargetList(targetList.filter(id => id !== areaId));
    } else {
        setTargetList([...targetList, areaId]);
    }
  };

  const handleItemNoteChange = (key: string, value: string) => {
      setItemNotes(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double check confirmation (UI disables button, but safe to check logic)
    if (activeTab === 'full' && !isScopeConfirmed) {
        alert("하단의 '공사 내용 확인' 체크박스를 선택해주세요.");
        return;
    }

    let effectiveUseDimensionsOnly = useDimensionsOnly;
    if (activeTab === 'bathroom' && !image && !useDimensionsOnly) {
        if (bathWidth && bathDepth && bathHeight) {
            const confirmSwitch = window.confirm("이미지 없이 치수(가로/세로/높이)로 진행하시겠습니까?");
            if (confirmSwitch) {
                effectiveUseDimensionsOnly = true;
                setUseDimensionsOnly(true);
            } else {
                return;
            }
        }
    }

    if (!image && !(activeTab === 'bathroom' && effectiveUseDimensionsOnly)) {
        alert("필수: 도면 이미지를 업로드하거나, 정확한 치수를 입력해주세요.");
        return;
    }
    
    if (activeTab === 'full' && !area) {
        alert("필수: 면적을 입력해주세요.");
        return;
    }
    
    if (!targetDate) {
        alert("필수: 공사 희망일을 선택해주세요.");
        return;
    }

    let imageData: string;
    let mimeType: string;

    if (image) {
        imageData = await toBase64(image.file);
        mimeType = image.file.type;
    } else {
        imageData = MOCK_IMAGE_BASE64; 
        mimeType = "image/gif";
    }
    
    let bathroomSpecifics: BathroomSpecifics | undefined;
    if (activeTab === 'bathroom') {
        bathroomSpecifics = {
            type: bathType,
            tileGrade: tileGrade,
            ceilingType,
            isJollyCut,
            wetZoneMethod, // New Field
            vanityCount,
            cabinetType,
            hasGendai,
            replaceDoor,
            removeRadiator,
            width: bathWidth ? parseFloat(bathWidth) : undefined,
            depth: bathDepth ? parseFloat(bathDepth) : undefined,
            height: bathHeight ? parseFloat(bathHeight) : undefined,
            useDimensionsOnly: effectiveUseDimensionsOnly
        };
    }

    const areaValue = parseFloat(area);
    const finalAreaPy = areaUnit === 'm2' ? Math.round(areaValue / 3.3058) : areaValue;
    const calculatedBathCount = activeTab === 'full' ? (userBathCount || 1) : bathOnlyCount;

    // Logic: If adminMode is 'self', force admin scopes to false for the estimate generation
    const finalAdminScopes = adminMode === 'self' 
        ? { permit: false, consent: false, protection: false } 
        : adminScopes;

    const detailedScope: DetailedScope = {
        tile: tileScopes,
        wallpaper: wallpaperMode,
        flooring: {
            layout: flooringLayout,
            specs: {
                maru: maruSpec,
                jangpan: jangpanSpec,
                tile: tileSpec
            }
        },
        sash: sashScope,
        sashCondition: sashScope === 'partial' ? sashPartialText : undefined,
        door: { mode: doorMode },
        paint: paintScopes,
        film: filmScopes,
        // NEW MAPS
        molding: scopes.molding ? { type: moldingType } : undefined,
        entryDoor: scopes.entryDoor ? { type: entryDoorType } : undefined,
        insulation: scopes.insulation ? { area: insulationArea } : undefined,
        admin: finalAdminScopes // Use the computed admin scopes
    };

    onSubmit({
      area: finalAreaPy, 
      address: address, // Pass address
      requests: requests || (activeTab === 'bathroom' ? '욕실 견적 요청' : '전체 인테리어 견적 요청'),
      targetDate: targetDate,
      moveInDate: moveInDate,
      budget: typeof budget === 'number' ? budget : undefined, 
      image: { data: imageData, mimeType: mimeType },
      roomCount: activeTab === 'full' ? roomCount : 0,
      bathroomCount: calculatedBathCount,
      scopeFlags: activeTab === 'full' ? scopes : undefined,
      detailedScope: activeTab === 'full' ? detailedScope : undefined,
      itemNotes: activeTab === 'full' ? itemNotes : undefined,
      alreadyExpandedAreas: activeTab === 'full' ? alreadyExpandedAreas : [],
      needsExpansionAreas: activeTab === 'full' ? needsExpansionAreas : [],
      kitchenSinkSize: activeTab === 'full' ? kitchenSinkSize : undefined,
      kitchenSinkGrade: activeTab === 'full' ? kitchenSinkGrade : undefined,
      systemAcCount: activeTab === 'full' ? systemAcCount : undefined,
      windowCount: activeTab === 'full' ? windowCount : undefined,
      doorCount: activeTab === 'full' ? doorCount : undefined,
      modelType: 'pro',
      isDemo: false,
      projectScope: activeTab,
      bathroomSpecifics,
      wants3DGeneration: false
    });
  };

  const handleDemoSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    const demoScopes: ProjectScopeFlags = {
      sash: true, door: true, bath1: true, bath2: true, 
      tile: true, wallpaper: true, flooring: true,
      molding: true, flatCeiling: true, kitchenSink: true, balconyPaint: true, film: true, builtIn: true,
      electrical: true, entryDoor: true, insulation: false, systemAC: true,
      expansion: true
    };

    onSubmit({
        area: 32,
        address: "서울시 강남구 삼성동 123", // Demo address
        requests: "데모 모드 (전체 인테리어 예시)",
        targetDate: "2024-04-01",
        moveInDate: "2024-04-30",
        budget: 4000, 
        image: { data: MOCK_IMAGE_BASE64, mimeType: "image/gif" },
        roomCount: 3,
        bathroomCount: 2,
        scopeFlags: demoScopes,
        detailedScope: {
            tile: { kitchen: true, entrance: true, balcony: true },
            wallpaper: 'all_silk', 
            flooring: { 
                layout: 'all_maru',
                specs: { maru: 'gang', jangpan: '2.2', tile: '600' }
            },
            sash: 'all',
            door: { mode: 'replace_all' },
            paint: { balconyType: 'ceramic', livingWall: false, ceiling: false, whole: false },
            film: { doors: true, doorsCount: 5, builtIn: false, builtInCount: 1, sink: false, sinkSize: 3, entrance: true, walls: '' },
            admin: { permit: true, consent: true, protection: true },
            // Mocks for new fields
            molding: { type: 'flat' },
            entryDoor: { type: '3yeondong' },
        },
        itemNotes: { sash: "거실 발코니창은 이중창으로 변경 희망" },
        alreadyExpandedAreas: [],
        needsExpansionAreas: ['livingRoom'],
        kitchenSinkSize: 4,
        kitchenSinkGrade: 'pet',
        systemAcCount: 4,
        windowCount: 6,
        doorCount: 5,
        modelType: 'pro',
        isDemo: true,
        projectScope: activeTab,
        wants3DGeneration: false
    });
  };

  const showDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
      if (ref.current && ref.current.showPicker) {
          ref.current.showPicker();
      } else {
          // Fallback for older browsers: try focusing
          ref.current?.focus();
      }
  };

  const CheckboxItem = ({ id, label, checked, onChange, notePlaceholder, subLabel }: { id: string; label: string; checked: boolean; onChange: () => void, notePlaceholder?: string, subLabel?: string }) => (
      <div className={`p-3 rounded-lg border transition-all ${checked ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mr-3" />
            <div className="flex flex-col">
                <span className={`font-medium text-sm ${checked ? 'text-indigo-800' : 'text-gray-600'}`}>{label}</span>
                {subLabel && <span className="text-[10px] text-gray-400 mt-0.5">{subLabel}</span>}
            </div>
          </label>
          {checked && notePlaceholder && (
              <div className="mt-2 ml-8">
                  <input 
                    type="text" 
                    placeholder={notePlaceholder}
                    value={itemNotes[id] || ''}
                    onChange={(e) => handleItemNoteChange(id, e.target.value)}
                    className="w-full text-xs p-2 border border-indigo-200 rounded bg-white focus:outline-none focus:border-indigo-500"
                  />
              </div>
          )}
      </div>
  );

  const hasSelectedScopes = Object.values(scopes).some(v => v === true);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-white border-b p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">AI 건축 견적 의뢰서</h2>
        <p className="text-gray-500 text-sm">정확한 분석을 위해 도면과 상세 정보를 입력해주세요.</p>
      </div>

      <div className="flex border-b bg-gray-50">
        <button
          className={`flex-1 py-4 font-bold text-center transition-colors text-sm ${activeTab === 'full' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('full')}
        >
          🏠 전체 인테리어 (All-in-One)
        </button>
        <button
          className={`flex-1 py-4 font-bold text-center transition-colors text-sm ${activeTab === 'bathroom' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('bathroom')}
        >
          🛁 욕실 집중 (Bathroom Only)
        </button>
      </div>
      
      <div className="p-8">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Basic Info */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                {/* ... (Previous Basic Info content preserved) ... */}
                <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    기본 정보 및 일정
                </h3>
                {activeTab === 'full' ? (
                     <div className="space-y-4">
                        {/* Area */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    면적 (공급/분양) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex rounded-md shadow-sm">
                                    <input 
                                        type="number" 
                                        value={area} 
                                        onChange={(e) => setArea(e.target.value)} 
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white" 
                                        placeholder="예: 32" 
                                        required 
                                    />
                                    <select
                                        value={areaUnit}
                                        onChange={(e) => setAreaUnit(e.target.value as UnitType)}
                                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-white text-gray-700 text-sm rounded-r-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="py">평</option>
                                        <option value="m2">㎡</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Date Inputs */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    공사 희망일 (시작) <span className="text-red-500">*</span>
                                </label>
                                <div 
                                    className="relative cursor-pointer group" 
                                    onClick={() => showDatePicker(targetDateRef)}
                                >
                                    <input 
                                        type="date" 
                                        ref={targetDateRef}
                                        value={targetDate} 
                                        onChange={(e) => setTargetDate(e.target.value)}
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer shadow-sm text-sm" 
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    입주 예상일 (종료) <span className="text-red-500">*</span>
                                </label>
                                <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => showDatePicker(moveInDateRef)}
                                >
                                    <input 
                                        type="date" 
                                        ref={moveInDateRef}
                                        value={moveInDate} 
                                        onChange={(e) => setMoveInDate(e.target.value)} 
                                        min={targetDate}
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer shadow-sm text-sm" 
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* Address Input & Mgmt Office Search */}
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    공사 예정 주소 (동/아파트 명까지)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={address} 
                                        onChange={(e) => setAddress(e.target.value)} 
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white" 
                                        placeholder="예: 서울시 강남구 삼성동 아이파크" 
                                    />
                                    {address && (
                                        <a 
                                            href={`https://search.naver.com/search.naver?query=${encodeURIComponent(address + ' 관리사무소 전화번호')}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 bg-green-500 text-white rounded-md text-xs font-bold hover:bg-green-600 flex items-center justify-center whitespace-nowrap shadow-sm"
                                        >
                                            📞 관리실 찾기
                                        </a>
                                    )}
                                </div>
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    <p className="font-bold mb-1">⚠️ 관리사무소 확인 필수 사항</p>
                                    <ul className="list-disc pl-4 space-y-0.5">
                                        <li><strong>엘리베이터 사용료</strong> 및 <strong>공사 예치금</strong> 규정 (아파트마다 상이)</li>
                                        <li>승강기 보양 규격 및 공사 가능 시간</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Budget Input */}
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">가용 예산 (선택사항)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={budget} 
                                        onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value) : '')} 
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white" 
                                        placeholder="예: 4000" 
                                    />
                                    <span className="absolute right-3 top-2.5 text-sm text-gray-500">만원</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">예산을 입력하시면 AI가 예산 범위에 맞춘 경제적 대안을 제안해드립니다.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">방 개수</label>
                                <input type="number" value={roomCount || ''} onChange={(e) => setRoomCount(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white" placeholder="예: 3" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">욕실 개수</label>
                                <input type="number" value={userBathCount || ''} onChange={(e) => setUserBathCount(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white" placeholder="예: 2" />
                            </div>
                        </div>

                        {/* Existing Expansion Status */}
                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <label className="block text-xs font-bold text-gray-700 mb-2">기존 확장 여부 (현재 상태)</label>
                            <p className="text-[10px] text-gray-500 mb-2">이미 확장이 되어 있는 공간을 체크해주세요. (마루/도배 물량 산출에 반영됩니다)</p>
                            <div className="flex flex-wrap gap-2 text-sm">
                                {expansionAreas.map(area => (
                                    <label key={`already-${area.id}`} className={`flex items-center px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${alreadyExpandedAreas.includes(area.label) ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                        <input type="checkbox" className="hidden" checked={alreadyExpandedAreas.includes(area.label)} onChange={() => handleExpansionChange(area.label, 'already')} />
                                        <span className="mr-1 text-xs">{alreadyExpandedAreas.includes(area.label) ? '✓' : ''}</span>
                                        {area.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Bathroom Mode Inputs
                    <div className="grid grid-cols-3 gap-3">
                         <div className="col-span-3">
                            <label className="flex items-center space-x-2 text-sm text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100 mb-3 cursor-pointer">
                                <input type="checkbox" checked={useDimensionsOnly} onChange={(e) => setUseDimensionsOnly(e.target.checked)} className="rounded text-indigo-600 bg-white" />
                                <span className="font-semibold">도면 없이 실측 치수로만 진행</span>
                            </label>
                        </div>
                        <div className="col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                공사 희망일 <span className="text-red-500">*</span>
                            </label>
                            <div 
                                className="relative cursor-pointer group"
                                onClick={() => showDatePicker(targetDateRef)}
                            >
                                <input 
                                    type="date" 
                                    ref={targetDateRef}
                                    value={targetDate} 
                                    onChange={(e) => setTargetDate(e.target.value)} 
                                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer shadow-sm text-sm" 
                                    required
                                />
                            </div>
                        </div>
                        <div className="col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                공사 예정 주소 (선택)
                            </label>
                            <input 
                                type="text" 
                                value={address} 
                                onChange={(e) => setAddress(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white" 
                                placeholder="예: 서울시 강남구 삼성동" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">가로(m) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.1" value={bathWidth} onChange={(e) => setBathWidth(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">세로(m) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.1" value={bathDepth} onChange={(e) => setBathDepth(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">높이(m) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.1" value={bathHeight} onChange={(e) => setBathHeight(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white" />
                        </div>
                    </div>
                )}
                
                {/* Image Upload */}
                 {(!useDimensionsOnly || activeTab === 'full') && (
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            도면 이미지 <span className="text-red-500">*</span>
                        </label>
                        <div 
                            onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                            className={`flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-indigo-600' : 'border-gray-300'} border-dashed rounded-md bg-gray-50 transition-colors`}
                        >
                            {image ? (
                            <div className="text-center">
                                <img src={image.preview} alt="미리보기" className="mx-auto h-32 w-auto rounded-lg mb-2 shadow-sm" />
                                <button type="button" onClick={() => setImage(null)} className="text-xs text-red-600 underline hover:text-red-800">이미지 삭제</button>
                            </div>
                            ) : (
                            <div className="text-center">
                                <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                                    <span>파일 업로드</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={e => handleFileChange(e.target.files)} />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">또는 드래그 앤 드롭 (JPG, PNG)</p>
                            </div>
                            )}
                        </div>
                    </div>
                 )}
            </div>

            {/* --- 간편 견적 (올수리) 프리셋 버튼 (Updated Logic) --- */}
            {activeTab === 'full' && (
                <div className="mb-8">
                    <button 
                        onClick={handleStandardPreset}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        🚀 {getButtonText()} 올수리 표준 견적 (간편설정)
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        * 1번에 입력하신 평수를 기준으로, 가장 많이 선택하는 '표준 공사' 항목이 자동 체크됩니다.<br/>
                        (버튼 클릭 후 아래 공사 내용 리스트를 반드시 확인해주세요)
                    </p>
                </div>
            )}

            {/* 2. Construction Scope (Checklist) - SEPARATED */}
            {activeTab === 'full' && (
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    {/* ... (Scope Checklist content preserved) ... */}
                    <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
                        <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                        공사 범위 선택 (Checklist)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                         <CheckboxItem id="sash" label="샷시 (창호 교체)" checked={scopes.sash} onChange={() => handleScopeChange('sash')} notePlaceholder="예: 거실 발코니창만 이중창으로 변경" />
                         <CheckboxItem id="door" label="도어/문틀 공사" checked={scopes.door} onChange={() => handleScopeChange('door')} />
                         <CheckboxItem id="bath1" label="안방 욕실 리모델링 (간단)" checked={scopes.bath1} onChange={() => handleScopeChange('bath1')} subLabel="※ 상세 견적은 '욕실 집중' 탭 이용 권장" />
                         <CheckboxItem id="bath2" label="거실 욕실 리모델링 (간단)" checked={scopes.bath2} onChange={() => handleScopeChange('bath2')} subLabel="※ 상세 견적은 '욕실 집중' 탭 이용 권장" />
                         <CheckboxItem id="kitchen" label="주방 싱크대 교체" checked={scopes.kitchenSink} onChange={() => handleScopeChange('kitchenSink')} />
                         <CheckboxItem id="systemAC" label="시스템 에어컨" checked={scopes.systemAC} onChange={() => handleScopeChange('systemAC')} />
                         <CheckboxItem id="expansion" label="확장 공사 (신규 진행)" checked={scopes.expansion} onChange={() => handleScopeChange('expansion')} notePlaceholder="예: 작은방 1개소 확장, 보일러 배관 연결 포함" />
                         <CheckboxItem id="tile" label="타일 시공" checked={scopes.tile} onChange={() => handleScopeChange('tile')} />
                         <CheckboxItem id="wallpaper" label="도배 시공" checked={scopes.wallpaper} onChange={() => handleScopeChange('wallpaper')} />
                         <CheckboxItem id="flooring" label="바닥 시공 (마루/장판/타일)" checked={scopes.flooring} onChange={() => handleScopeChange('flooring')} />
                         <CheckboxItem id="molding" label="목공 천장 몰딩" checked={scopes.molding} onChange={() => handleScopeChange('molding')} notePlaceholder="예: 거실 마이너스 몰딩, 방 평몰딩" />
                         <CheckboxItem id="flat" label="목공 천장 평탄화" checked={scopes.flatCeiling} onChange={() => handleScopeChange('flatCeiling')} />
                         <CheckboxItem id="paint" label="도장 공사 (발코니/내부)" checked={scopes.balconyPaint} onChange={() => handleScopeChange('balconyPaint')} />
                         <CheckboxItem id="film" label="필름 시공 (샷시/가구)" checked={scopes.film} onChange={() => handleScopeChange('film')} />
                         <CheckboxItem id="builtIn" label="붙박이장/신발장" checked={scopes.builtIn} onChange={() => handleScopeChange('builtIn')} />
                         <CheckboxItem id="elec" label="전기 (스위치/콘센트)" checked={scopes.electrical} onChange={() => handleScopeChange('electrical')} />
                         <CheckboxItem id="entry" label="중문 설치 (기본:3연동)" checked={scopes.entryDoor} onChange={() => handleScopeChange('entryDoor')} notePlaceholder="기본: 3연동 슬라이딩 (변경 시 기입)" />
                         <CheckboxItem id="insul" label="추가 단열 (벽체)" checked={scopes.insulation} onChange={() => handleScopeChange('insulation')} notePlaceholder="추가할 위치 (예: 북쪽방 외벽, 안방)" />
                    </div>
                </div>
            )}

            {/* NEW STEP 3: Detailed Specs - SEPARATED & CONDITIONAL */}
            {activeTab === 'full' && hasSelectedScopes && (
                <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 shadow-sm animate-fade-in-up">
                    <h3 className="text-sm font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2 flex items-center">
                        <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                        상세 스펙 설정 (선택 항목)
                    </h3>
                    <div className="space-y-6">
                        {/* ... (Detailed Inputs based on selection) ... */}
                        {/* Flooring Details */}
                        {scopes.flooring && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3">바닥재 상세 (레이아웃 & 자재)</h5>
                                {/* ... Flooring content ... */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="flooringLayout" checked={flooringLayout === 'all_maru'} onChange={() => setFlooringLayout('all_maru')} className="mr-2 text-indigo-600" />
                                        전체 강마루 시공 (기본)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="flooringLayout" checked={flooringLayout === 'all_jangpan'} onChange={() => setFlooringLayout('all_jangpan')} className="mr-2 text-indigo-600" />
                                        전체 장판 시공
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="flooringLayout" checked={flooringLayout === 'all_tile'} onChange={() => setFlooringLayout('all_tile')} className="mr-2 text-indigo-600" />
                                        전체 포세린 타일 (호텔식)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="flooringLayout" checked={flooringLayout === 'mix_tile_maru'} onChange={() => setFlooringLayout('mix_tile_maru')} className="mr-2 text-indigo-600" />
                                        거실: 타일 + 방: 마루
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="flooringLayout" checked={flooringLayout === 'mix_maru_jangpan'} onChange={() => setFlooringLayout('mix_maru_jangpan')} className="mr-2 text-indigo-600" />
                                        거실: 마루 + 방: 장판 (가성비)
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                                    {(flooringLayout.includes('maru') || flooringLayout === 'mix_maru_jangpan') && (
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold block mb-1">마루 종류</label>
                                            <select value={maruSpec} onChange={(e) => setMaruSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-gray-50">
                                                <option value="gang">강마루 (기본)</option>
                                                <option value="texture">광폭 텍스쳐 마루 (+고급)</option>
                                            </select>
                                        </div>
                                    )}
                                    {(flooringLayout.includes('jangpan') || flooringLayout === 'mix_maru_jangpan') && (
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold block mb-1">장판 두께</label>
                                            <select value={jangpanSpec} onChange={(e) => setJangpanSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-gray-50">
                                                <option value="1.8">1.8T (경제형)</option>
                                                <option value="2.2">2.2T (표준)</option>
                                                <option value="5.0">LX 5.0T 엑스컴포트 (프리미엄)</option>
                                            </select>
                                        </div>
                                    )}
                                    {(flooringLayout.includes('tile') || flooringLayout === 'all_tile') && (
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold block mb-1">타일 크기</label>
                                            <select value={tileSpec} onChange={(e) => setTileSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-gray-50">
                                                <option value="600">600각 포세린 (표준)</option>
                                                <option value="800">800각 포세린 (대형/고급)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sash Details */}
                        {scopes.sash && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3">창호(샷시) 교체 범위</h5>
                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded">
                                        <input type="radio" name="sashScope" checked={sashScope === 'all'} onChange={() => setSashScope('all')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        전체 교체 (Whole House)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded">
                                        <input type="radio" name="sashScope" checked={sashScope === 'partial'} onChange={() => setSashScope('partial')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        부분 교체 (Partial)
                                    </label>
                                </div>
                                {sashScope === 'all' && (
                                    <div className="mt-2"><label className="text-xs text-gray-600 block mb-1">교체할 창호 개수 (대략)</label><input type="number" value={windowCount} onChange={e => setWindowCount(parseInt(e.target.value))} className="w-full text-sm border p-2 rounded bg-white" placeholder="예: 5" /></div>
                                )}
                                {sashScope === 'partial' && (
                                    <div className="mt-2"><label className="text-xs text-gray-600 block mb-1 font-bold">어디를 교체하시겠습니까?</label><input type="text" value={sashPartialText} onChange={e => setSashPartialText(e.target.value)} className="w-full text-sm border p-2 rounded bg-white border-indigo-200 focus:border-indigo-500 outline-none" placeholder="예: 거실 발코니와 안방 이중창만 교체" /></div>
                                )}
                            </div>
                        )}

                        {/* Door Details */}
                        {scopes.door && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3">도어/문틀 시공 방식</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="doorMode" checked={doorMode === 'replace_all'} onChange={() => setDoorMode('replace_all')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        전체 교체 (문짝 + 문틀) - 추천
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="doorMode" checked={doorMode === 'replace_door_film_frame'} onChange={() => setDoorMode('replace_door_film_frame')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        문짝 교체 + 문틀 필름
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="doorMode" checked={doorMode === 'film_both'} onChange={() => setDoorMode('film_both')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        전체 필름 리폼 (문짝 + 문틀)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="doorMode" checked={doorMode === 'paint_both'} onChange={() => setDoorMode('paint_both')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        전체 도장 리폼 (경제형)
                                    </label>
                                </div>
                                <div className="mt-3">
                                    <label className="text-xs text-gray-600 block mb-1">대상 도어 개수</label>
                                    <input type="number" value={doorCount} onChange={e => setDoorCount(parseInt(e.target.value))} className="w-full text-sm border p-2 rounded bg-white" placeholder="예: 5" />
                                </div>
                            </div>
                        )}

                         {/* NEW: Molding Details */}
                        {scopes.molding && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3">천장 몰딩 타입</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="moldingType" checked={moldingType === 'flat'} onChange={() => setMoldingType('flat')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        평몰딩 (일반/심플)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="moldingType" checked={moldingType === 'minus'} onChange={() => setMoldingType('minus')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        마이너스 몰딩 (고급/히든)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="moldingType" checked={moldingType === 'crown'} onChange={() => setMoldingType('crown')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        갈매기/크라운 몰딩 (클래식)
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* NEW: Entry Door Details */}
                        {scopes.entryDoor && (
                             <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3">중문 종류 선택</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="entryDoorType" checked={entryDoorType === '3yeondong'} onChange={() => setEntryDoorType('3yeondong')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        3연동 슬라이딩 (표준)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="entryDoorType" checked={entryDoorType === 'swing'} onChange={() => setEntryDoorType('swing')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        스윙/여닫이 (개방감)
                                    </label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-100">
                                        <input type="radio" name="entryDoorType" checked={entryDoorType === 'onesliding'} onChange={() => setEntryDoorType('onesliding')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                                        원슬라이딩 (철제/고급)
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* NEW: Insulation Details */}
                        {scopes.insulation && (
                             <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3">단열 공사 부위 지정</h5>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-600 block mb-1">단열이 필요한 벽면 위치를 구체적으로 적어주세요 (확장부 제외)</label>
                                    <input 
                                        type="text" 
                                        value={insulationArea} 
                                        onChange={e => setInsulationArea(e.target.value)} 
                                        className="w-full text-sm border p-2 rounded bg-white focus:ring-indigo-500" 
                                        placeholder="예: 안방 외벽면, 입구방 확장부, 북쪽 베란다 곰팡이 부위" 
                                    />
                                    <p className="text-[10px] text-gray-400">※ 확장 공사에 포함된 단열은 자동 계산되므로, 그 외 추가 단열 부위만 적어주세요.</p>
                                </div>
                            </div>
                        )}

                        {/* Expansion Details */}
                        {scopes.expansion && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3">신규 확장 공사 범위</h5>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-2 font-semibold">새로 확장할 곳 선택 (철거/단열/난방 포함)</label>
                                    <div className="flex flex-wrap gap-2 text-sm">
                                        {expansionAreas.map(area => (
                                            <label key={`needs-${area.id}`} className={`flex items-center px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${needsExpansionAreas.includes(area.label) ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                                <input type="checkbox" className="hidden" checked={needsExpansionAreas.includes(area.label)} onChange={() => handleExpansionChange(area.label, 'needs')} />
                                                <span className="mr-1 text-xs">{needsExpansionAreas.includes(area.label) ? '✓' : ''}</span>
                                                {area.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Paint Details */}
                        {scopes.balconyPaint && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100 space-y-4">
                                <h5 className="text-sm font-bold text-gray-800 mb-1">도장(페인트) 상세</h5>
                                <div className="flex items-start gap-4 border-b border-dashed pb-2">
                                    <span className="text-xs font-bold text-indigo-600 w-16 pt-1">발코니</span>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="balconyType" checked={paintScopes.balconyType === 'ceramic'} onChange={() => setPaintScopes({...paintScopes, balconyType: 'ceramic'})} className="mr-2 text-indigo-600 focus:ring-indigo-500" />탄성코트 (세라믹) - 기본 추천</label>
                                        <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="balconyType" checked={paintScopes.balconyType === 'water'} onChange={() => setPaintScopes({...paintScopes, balconyType: 'water'})} className="mr-2 text-indigo-600 focus:ring-indigo-500" />수성 페인트 (일반)</label>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 pt-2">
                                    <span className="text-xs font-bold text-indigo-600 w-16 pt-1">내부 도장</span>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        <label className={`flex items-center text-sm cursor-pointer ${scopes.wallpaper && wallpaperMode !== 'combo' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                            <input type="checkbox" checked={paintScopes.livingWall} onChange={e => setPaintScopes({...paintScopes, livingWall: e.target.checked})} className="mr-2 bg-white" />거실 벽체 도장
                                        </label>
                                        <label className="flex items-center text-sm text-gray-700"><input type="checkbox" checked={paintScopes.ceiling} onChange={e => setPaintScopes({...paintScopes, ceiling: e.target.checked})} className="mr-2 bg-white" />천장 도장</label>
                                        <label className={`flex items-center text-sm cursor-pointer ${scopes.wallpaper ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                            <input type="checkbox" checked={paintScopes.whole} onChange={e => setPaintScopes({...paintScopes, whole: e.target.checked})} className="mr-2 bg-white" />전체 수성 도장
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Film Details */}
                        {scopes.film && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-2">인테리어 필름 시공 범위</h5>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="flex items-center text-sm text-gray-700 min-w-[120px]">
                                            <input type="checkbox" checked={filmScopes.doors} onChange={e => setFilmScopes({...filmScopes, doors: e.target.checked})} className="mr-2 bg-white" />
                                            문틀/샷시
                                        </label>
                                        {filmScopes.doors && (
                                            <div className="flex items-center gap-2">
                                                <input type="number" placeholder="개수" className="w-20 text-sm border p-1 rounded bg-gray-50" value={filmScopes.doorsCount || ''} onChange={(e) => setFilmScopes({...filmScopes, doorsCount: parseInt(e.target.value)})} />
                                                <span className="text-xs text-gray-500">개소</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="flex items-center text-sm text-gray-700 min-w-[120px]">
                                            <input type="checkbox" checked={filmScopes.builtIn} onChange={e => setFilmScopes({...filmScopes, builtIn: e.target.checked})} className="mr-2 bg-white" />
                                            붙박이장
                                        </label>
                                        {filmScopes.builtIn && (
                                            <div className="flex items-center gap-2">
                                                <input type="number" placeholder="개수" className="w-20 text-sm border p-1 rounded bg-gray-50" value={filmScopes.builtInCount || ''} onChange={(e) => setFilmScopes({...filmScopes, builtInCount: parseInt(e.target.value)})} />
                                                <span className="text-xs text-gray-500">개/통</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="flex items-center text-sm text-gray-700 min-w-[120px]">
                                            <input type="checkbox" checked={filmScopes.sink} onChange={e => setFilmScopes({...filmScopes, sink: e.target.checked})} className="mr-2 bg-white" />
                                            싱크대 리폼
                                        </label>
                                        {filmScopes.sink && (
                                            <div className="flex items-center gap-2">
                                                <input type="number" placeholder="길이" className="w-20 text-sm border p-1 rounded bg-gray-50" value={filmScopes.sinkSize || ''} onChange={(e) => setFilmScopes({...filmScopes, sinkSize: parseFloat(e.target.value)})} />
                                                <span className="text-xs text-gray-500">m (미터)</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="flex items-center text-sm text-gray-700 min-w-[120px]">
                                            <input type="checkbox" checked={filmScopes.entrance} onChange={e => setFilmScopes({...filmScopes, entrance: e.target.checked})} className="mr-2 bg-white" />
                                            현관문
                                        </label>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">벽체 및 기타 특이사항</label>
                                        <input type="text" placeholder="예: 거실 아트월 필름, 안방 화장대 리폼 등" className="w-full text-sm border p-2 rounded bg-white" value={filmScopes.walls || ''} onChange={(e) => setFilmScopes({...filmScopes, walls: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Finishing Scopes */}
                        {(scopes.tile || scopes.wallpaper) && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100 space-y-4">
                                <h5 className="text-sm font-bold text-gray-800 mb-1">기타 마감 범위</h5>
                                {scopes.tile && (
                                    <div className="flex items-center gap-4 border-b border-dashed pb-2 last:border-0">
                                        <span className="text-xs font-bold text-indigo-600 w-16">부분 타일</span>
                                        <div className="flex gap-4">
                                            <label className="flex items-center text-sm text-gray-700"><input type="checkbox" checked={tileScopes.kitchen} onChange={e => setTileScopes({...tileScopes, kitchen: e.target.checked})} className="mr-2 bg-white" />주방</label>
                                            <label className="flex items-center text-sm text-gray-700"><input type="checkbox" checked={tileScopes.entrance} onChange={e => setTileScopes({...tileScopes, entrance: e.target.checked})} className="mr-2 bg-white" />현관</label>
                                            <label className="flex items-center text-sm text-gray-700"><input type="checkbox" checked={tileScopes.balcony} onChange={e => setTileScopes({...tileScopes, balcony: e.target.checked})} className="mr-2 bg-white" />발코니</label>
                                        </div>
                                    </div>
                                )}
                                {scopes.wallpaper && (
                                    <div className="flex items-start gap-4 pt-1">
                                        <span className="text-xs font-bold text-indigo-600 w-16 pt-1">도배</span>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="wallpaperMode" value="all_silk" checked={wallpaperMode === 'all_silk'} onChange={() => setWallpaperMode('all_silk')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />전체 실크 (권장)</label>
                                            <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="wallpaperMode" value="all_paper" checked={wallpaperMode === 'all_paper'} onChange={() => setWallpaperMode('all_paper')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />전체 합지 (경제적)</label>
                                            <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="wallpaperMode" value="combo" checked={wallpaperMode === 'combo'} onChange={() => setWallpaperMode('combo')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />거실 실크 + 방 합지 (가성비)</label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Specs */}
                        <div className="space-y-4">
                            {scopes.kitchenSink && (
                                    <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-gray-600 block mb-1">싱크대 길이(m)</label><input type="number" value={kitchenSinkSize} onChange={e => setKitchenSinkSize(parseFloat(e.target.value))} className="w-full text-sm border p-2 rounded bg-white" placeholder="예: 4" /></div>
                                    <div><label className="text-xs text-gray-600 block mb-1">싱크대 등급</label><select value={kitchenSinkGrade} onChange={e => setKitchenSinkGrade(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white"><option value="pet">PET (무광)</option><option value="painted">도장 (고급)</option></select></div>
                                    </div>
                            )}
                            {scopes.systemAC && (
                                <div><label className="text-xs text-gray-600 block mb-1">에어컨 대수</label><input type="number" value={systemAcCount} onChange={e => setSystemAcCount(parseInt(e.target.value))} className="w-full text-sm border p-2 rounded bg-white" placeholder="실내기 기준" /></div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Confirmation & Submit (RESTORED SECTION) */}
            <div className="pt-6 border-t border-gray-100">
                <div className="flex items-start mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center h-5">
                        <input
                            id="confirmation"
                            name="confirmation"
                            type="checkbox"
                            checked={isScopeConfirmed}
                            onChange={handleConfirmationChange}
                            className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="confirmation" className="font-bold text-gray-700 cursor-pointer">
                            위 공사 내용으로 견적 생성을 진행합니다.
                        </label>
                        <p className="text-gray-500">입력하신 정보를 바탕으로 AI가 수량을 산출하고 견적서를 작성합니다. (약 10~15초 소요)</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        type="submit"
                        className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white transition-all duration-200 ${
                            isScopeConfirmed
                            ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                        disabled={!isScopeConfirmed || isCheckingConflicts}
                    >
                        {isCheckingConflicts ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                공사 내용 검토 중...
                            </span>
                        ) : (
                            activeTab === 'full' ? '🤖 AI 전체 인테리어 견적 뽑기' : '🛁 욕실 상세 분석 및 견적 시작'
                        )}
                    </button>
                    
                     <button
                        onClick={handleDemoSubmit}
                        className="w-full bg-white text-indigo-600 font-bold py-3 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                    >
                        ⚡️ 입력 없이 데모 데이터로 체험하기
                    </button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};
