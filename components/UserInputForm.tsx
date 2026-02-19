
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

// CheckboxItem moved outside for stability
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
                  className="w-full text-xs p-2 border border-indigo-200 rounded bg-white text-gray-900 focus:outline-none focus:border-indigo-500"
                  onClick={(e) => e.stopPropagation()} // Prevent bubbling
                />
            </div>
        )}
    </div>
);

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
  const [buildingType, setBuildingType] = useState<'apartment' | 'villa' | 'house'>('apartment');
  const [budget, setBudget] = useState<number | ''>(''); 
  const [floor, setFloor] = useState<number>(5);

  // Date Picker Refs
  const targetDateRef = useRef<HTMLInputElement>(null);
  const moveInDateRef = useRef<HTMLInputElement>(null);

  // Counts
  const [roomCount, setRoomCount] = useState<number | undefined>(3);
  const [userBathCount, setUserBathCount] = useState<number | undefined>(2);
  
  // ==================================================================================
  // [FULL INTERIOR MODE STATES] - RESTORED
  // ==================================================================================
  
  // 1. Basic Scope Checklist (Main Toggles)
  const [scopes, setScopes] = useState<ProjectScopeFlags>({
      sash: true, door: true, bath1: true, bath2: true, 
      molding: true, flatCeiling: true, kitchenSink: true, 
      balconyPaint: true, film: true, builtIn: true,
      electrical: true, entryDoor: false, insulation: false, systemAC: false,
      expansion: false, tile: true, wallpaper: true, flooring: true,
  });

  // 2. Detailed Scopes
  const [alreadyExpandedAreas, setAlreadyExpandedAreas] = useState<string[]>([]);
  const [needsExpansionAreas, setNeedsExpansionAreas] = useState<string[]>([]);
  
  const [tileScopes, setTileScopes] = useState({ kitchen: true, entrance: true, balcony: true });
  const [wallpaperMode, setWallpaperMode] = useState<'all_silk' | 'all_paper' | 'combo'>('all_silk');
  
  // Flooring States
  const [flooringLayout, setFlooringLayout] = useState<'all_maru' | 'all_jangpan' | 'all_tile' | 'mix_tile_maru' | 'mix_maru_jangpan'>('all_maru');
  const [maruSpec, setMaruSpec] = useState<'gang' | 'texture'>('gang');
  const [jangpanSpec, setJangpanSpec] = useState<'1.8' | '2.2' | '5.0'>('2.2');
  const [tileSpec, setTileSpec] = useState<'600' | '800' | '600_1200'>('600');
  
  // Sash States
  const [sashScope, setSashScope] = useState<'all' | 'partial'>('all');
  const [sashPartialText, setSashPartialText] = useState<string>('');
  const [sashBrand, setSashBrand] = useState<'kcc' | 'lx' | 'hyundai'>('kcc');
  const [sashGlass, setSashGlass] = useState<'general_22' | 'low_e_24' | 'triple_system'>('low_e_24');
  const [sashType, setSashType] = useState<'double' | 'system'>('double');

  // Door Mode
  const [doorMode, setDoorMode] = useState<'replace_all' | 'replace_door_film_frame' | 'film_both' | 'paint_both'>('replace_all');

  // Ceiling & Molding & Wall States
  const [ceilingMethod, setCeilingMethod] = useState<'replace_all' | 'overlay' | 'paint_only'>('replace_all');
  const [ceilingIndirect, setCeilingIndirect] = useState<boolean>(true);
  const [ceilingPly, setCeilingPly] = useState<boolean>(false);
  const [moldingType, setMoldingType] = useState<'minus' | 'flat' | 'crown'>('flat');
  const [wallStructure, setWallStructure] = useState<'existing' | 'new_stud' | 'bad_condition'>('existing');
  const [wallLayers, setWallLayers] = useState<'1ply' | '2ply'>('1ply');
  const [wallFinishType, setWallFinishType] = useState<'wallpaper' | 'paint' | 'film'>('wallpaper');
  const [baseboardType, setBaseboardType] = useState<'standard' | 'minus_hidden' | 'paint_skirting' | 'none'>('standard');
  const [wallSoundProofing, setWallSoundProofing] = useState<boolean>(false);
  const [wallAllPutty, setWallAllPutty] = useState<boolean>(false);

  // Expansion & Insulation
  const [entryDoorType, setEntryDoorType] = useState<'3yeondong' | 'swing' | 'onesliding'>('3yeondong');
  const [expansionHeating, setExpansionHeating] = useState<boolean>(true);
  const [expansionInsulation, setExpansionInsulation] = useState<'standard' | 'high_end'>('high_end');
  const [expansionTurning, setExpansionTurning] = useState<boolean>(true);
  const [insulationArea, setInsulationArea] = useState<string>('');

  // Paint & Film
  const [paintScopes, setPaintScopes] = useState({ balconyType: 'ceramic' as 'ceramic' | 'water', livingWall: false, ceiling: false, whole: false });
  const [filmScopes, setFilmScopes] = useState<{ doors: boolean; doorsCount?: number; builtIn: boolean; builtInCount?: number; sink: boolean; sinkSize?: number; entrance: boolean; walls?: string; }>({ doors: true, doorsCount: 5, builtIn: false, builtInCount: 1, sink: false, sinkSize: 3, entrance: false, walls: '' });

  // Admin
  const [adminMode, setAdminMode] = useState<'include' | 'self'>('include');
  const [adminScopes, setAdminScopes] = useState({ permit: false, consent: true, protection: true });

  const [isScopeConfirmed, setIsScopeConfirmed] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  // Quantities
  const [kitchenSinkSize, setKitchenSinkSize] = useState<number>(4); 
  const [kitchenSinkGrade, setKitchenSinkGrade] = useState<'pet' | 'painted'>('pet');
  const [systemAcCount, setSystemAcCount] = useState<number>(3);
  const [windowCount, setWindowCount] = useState<number>(5); 
  const [doorCount, setDoorCount] = useState<number>(5);

  // ==================================================================================
  // [BATHROOM ONLY MODE STATES]
  // ==================================================================================
  const [bathOnlyCount, setBathOnlyCount] = useState<number>(1);
  const [bathWidth, setBathWidth] = useState<string>('2.2');
  const [bathDepth, setBathDepth] = useState<string>('1.6');
  const [bathHeight, setBathHeight] = useState<string>('2.3');
  const [useDimensionsOnly, setUseDimensionsOnly] = useState(false);

  const [bathDemolition, setBathDemolition] = useState<'full_waterproof' | 'partial_overlay' | 'basic_removal'>('full_waterproof');
  const [bathTileSelect, setBathTileSelect] = useState<'300_600' | '600_600' | '800_800' | '600_1200' | 'mosaic' | '300_300_floor'>('300_600');
  const [bathWetZone, setBathWetZone] = useState<'bathtub' | 'partition_glass' | 'partition_tile' | 'booth' | 'none'>('partition_glass');
  const [bathGendai, setBathGendai] = useState<'jolly_cut' | 'art_marble' | 'nat_marble' | 'tile_finish' | 'none'>('jolly_cut');
  const [bathCabinet, setBathCabinet] = useState<'sliding_mirror' | 'flap_jang' | 'mirror_standard' | 'custom_wood'>('sliding_mirror');
  const [bathCeiling, setBathCeiling] = useState<'smc_flat' | 'smc_dome' | 'paint_special' | 'barrisol'>('smc_flat');
  const [bathToilet, setBathToilet] = useState<'two_piece' | 'one_piece' | 'wall_hung' | 'smart_bidet'>('two_piece');
  const [bathBasin, setBathBasin] = useState<'half_pedestal' | 'full_pedestal' | 'top_counter' | 'under_counter'>('half_pedestal');
  const [bathFaucet, setBathFaucet] = useState<'standard_chrome' | 'matte_sus' | 'color_coated' | 'luxury_brand'>('standard_chrome');
  
  const [bathVent, setBathVent] = useState<'basic_fan' | 'high_end_damper'>('basic_fan');
  const [bathDrain, setBathDrain] = useState<'standard_yuga' | 'tile_yuga' | 'line_trench'>('standard_yuga');
  const [bathHeatExt, setBathHeatExt] = useState<boolean>(false);
  
  const [bathElecMove, setBathElecMove] = useState(false);
  const [bathElecIndirect, setBathElecIndirect] = useState(false);
  const [bathElecFan, setBathElecFan] = useState(true);

  // Validation State
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
      checkFormValidity();
  }, [area, targetDate, moveInDate, image, useDimensionsOnly, activeTab, bathWidth, bathDepth, bathHeight, isScopeConfirmed]);

  // Sync 'permit' state when expansion is selected
  useEffect(() => {
    if (activeTab === 'full' && scopes.expansion) {
        setAdminScopes(prev => prev.permit ? prev : { ...prev, permit: true });
    }
  }, [scopes.expansion, activeTab]);

  const checkFormValidity = () => {
      let valid = false;
      if (activeTab === 'full') {
          valid = !!area && !!targetDate && !!moveInDate && !!image && isScopeConfirmed;
      } else {
          if (useDimensionsOnly) {
              valid = !!targetDate && !!bathWidth && !!bathDepth && !!bathHeight;
          } else {
              valid = !!targetDate && !!image;
          }
      }
      setIsFormValid(valid);
  };

  const handleConfirmationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      if (!isChecked) {
          setIsScopeConfirmed(false);
          return;
      }
      setIsCheckingConflicts(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      setIsScopeConfirmed(true);
      setIsCheckingConflicts(false);
  };

  const handleStandardPreset = () => {
      setActiveTab('full');
      setScopes({
          sash: true, door: true, bath1: true, bath2: true,
          molding: true, flatCeiling: true, kitchenSink: true,
          balconyPaint: true, film: true, builtIn: true,
          electrical: true, entryDoor: true, insulation: true,
          systemAC: false, expansion: false,
          tile: true, wallpaper: true, flooring: true
      });
      setIsScopeConfirmed(false);
      
      let displayArea = area || '32';
      if (areaUnit === 'm2' && area) {
         displayArea = `${Math.round(parseFloat(area) / 3.3058)}평 (${area}㎡)`;
      } else {
         displayArea = `${displayArea}평`;
      }
      alert(`✅ 입력하신 [${displayArea}] 기준으로 표준 공사 내용이 자동 설정되었습니다.\n\n하단의 상세 체크리스트를 반드시 확인해주세요.`);
  };

  const getButtonText = () => {
      if (!area) return '32평';
      if (areaUnit === 'm2') {
          const py = Math.round(parseFloat(area) / 3.3058);
          return `${py}평 (${area}㎡)`;
      }
      return `${area}평`;
  };

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
      setIsScopeConfirmed(false);
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
            demolitionType: bathDemolition,
            waterproofing: bathDemolition === 'full_waterproof' ? 'standard_2coat' : 'none', 
            tileSelection: bathTileSelect,
            gendaiFinish: bathGendai,
            wetZoneMethod: bathWetZone,
            cabinetType: bathCabinet,
            ceilingType: bathCeiling,
            toiletType: bathToilet,
            washbasinType: bathBasin,
            faucetGrade: bathFaucet,
            ventilation: bathVent,
            drainType: bathDrain,
            floorHeating: bathHeatExt,
            width: bathWidth ? parseFloat(bathWidth) : undefined,
            depth: bathDepth ? parseFloat(bathDepth) : undefined,
            height: bathHeight ? parseFloat(bathHeight) : undefined,
            useDimensionsOnly: useDimensionsOnly,
            needsElectricalWork: bathElecMove || bathElecIndirect,
            electricalOptions: {
                moveOutlet: bathElecMove,
                indirectLight: bathElecIndirect,
                fanConnection: bathElecFan
            }
        };
    }

    const areaValue = parseFloat(area);
    const finalAreaPy = areaUnit === 'm2' ? Math.round(areaValue / 3.3058) : areaValue;
    const calculatedBathCount = activeTab === 'full' ? (userBathCount || 1) : bathOnlyCount;
    const finalAdminScopes = adminMode === 'self' 
        ? { permit: false, consent: false, protection: false } 
        : adminScopes;

    const detailedScope: DetailedScope = {
        tile: tileScopes,
        wallpaper: wallpaperMode,
        flooring: {
            layout: flooringLayout,
            specs: { maru: maruSpec, jangpan: jangpanSpec, tile: tileSpec }
        },
        sash: sashScope,
        sashCondition: sashScope === 'partial' ? sashPartialText : undefined,
        sashConfig: scopes.sash ? { brand: sashBrand, glass: sashGlass, windowType: sashType } : undefined,
        door: { mode: doorMode },
        paint: paintScopes,
        film: filmScopes,
        molding: scopes.molding ? { type: moldingType } : undefined,
        entryDoor: scopes.entryDoor ? { type: entryDoorType } : undefined,
        insulation: scopes.insulation ? { area: insulationArea } : undefined,
        ceiling: scopes.flatCeiling ? {
            type: moldingType === 'minus' ? 'exposed' : 'flat',
            method: ceilingMethod,
            indirectLight: ceilingIndirect,
            isTwoPly: ceilingPly
        } : undefined,
        wallConfig: {
            structural: wallStructure,
            layers: wallLayers,
            finishType: wallFinishType,
            baseboard: baseboardType,
            soundProofing: wallSoundProofing,
            isAllPutty: wallAllPutty
        },
        expansionConfig: scopes.expansion ? {
            floorHeating: expansionHeating,
            insulationGrade: expansionInsulation,
            turningDoor: expansionTurning
        } : undefined,
        admin: finalAdminScopes
    };

    onSubmit({
      area: finalAreaPy, 
      address: address, 
      buildingType: buildingType,
      requests: requests || (activeTab === 'bathroom' ? '욕실 견적 요청' : '전체 인테리어 견적 요청'),
      targetDate: targetDate,
      moveInDate: moveInDate,
      budget: typeof budget === 'number' ? budget : undefined, 
      image: { data: imageData, mimeType: mimeType },
      roomCount: activeTab === 'full' ? roomCount : 0,
      bathroomCount: calculatedBathCount,
      floor: floor,
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
        address: "서울시 강남구 삼성동 123",
        requests: "데모 모드 (전체 인테리어 예시)",
        targetDate: "2024-04-01",
        moveInDate: "2024-04-30",
        budget: 4000, 
        image: { data: MOCK_IMAGE_BASE64, mimeType: "image/gif" },
        roomCount: 3,
        bathroomCount: 2,
        floor: 12,
        scopeFlags: demoScopes,
        detailedScope: {
            tile: { kitchen: true, entrance: true, balcony: true },
            wallpaper: 'all_silk', 
            flooring: { layout: 'all_maru', specs: { maru: 'gang', jangpan: '2.2', tile: '600' } },
            sash: 'all',
            sashConfig: { brand: 'kcc', glass: 'low_e_24', windowType: 'double' },
            door: { mode: 'replace_all' },
            paint: { balconyType: 'ceramic', livingWall: false, ceiling: false, whole: false },
            film: { doors: true, doorsCount: 5, builtIn: false, builtInCount: 1, sink: false, sinkSize: 3, entrance: true, walls: '' },
            admin: { permit: true, consent: true, protection: true },
            molding: { type: 'flat' },
            entryDoor: { type: '3yeondong' },
            ceiling: { type: 'flat', method: 'overlay', indirectLight: true, isTwoPly: false },
            wallConfig: { structural: 'existing', layers: '1ply', finishType: 'wallpaper', baseboard: 'standard', soundProofing: false, isAllPutty: false },
            expansionConfig: { floorHeating: true, insulationGrade: 'high_end', turningDoor: true }
        },
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
      if (ref.current && ref.current.showPicker) ref.current.showPicker();
      else ref.current?.focus();
  };

  const hasSelectedScopes = Object.values(scopes).some(v => v === true);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-white border-b p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">AI 건축 견적 의뢰서</h2>
        <p className="text-gray-500 text-sm">정확한 분석을 위해 도면과 상세 정보를 입력해주세요.</p>
      </div>

      <div className="flex border-b bg-gray-50">
        <button className={`flex-1 py-4 font-bold text-center transition-colors text-sm ${activeTab === 'full' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('full')}>
          🏠 전체 인테리어 (All-in-One)
        </button>
        <button className={`flex-1 py-4 font-bold text-center transition-colors text-sm ${activeTab === 'bathroom' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('bathroom')}>
          🛁 욕실 집중 (Bathroom Only)
        </button>
      </div>
      
      <div className="p-8">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    기본 정보 및 일정
                </h3>
                {/* ... (Existing Date/Address inputs for both tabs) ... */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">공사 희망일 (시작) <span className="text-red-500">*</span></label>
                            <div className="relative cursor-pointer group" onClick={() => showDatePicker(targetDateRef)}><input type="date" ref={targetDateRef} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm" required /></div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">건물 유형 (필수)</label>
                            <select value={buildingType} onChange={(e) => setBuildingType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm"><option value="apartment">아파트 (엘리베이터 보양)</option><option value="villa">빌라 (사다리차 사용)</option><option value="house">단독주택</option></select>
                        </div>
                        {activeTab === 'full' && (
                            <>
                                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">면적</label><div className="flex rounded-md shadow-sm"><input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-white text-gray-900 sm:text-sm" /><select value={areaUnit} onChange={(e) => setAreaUnit(e.target.value as UnitType)} className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-white text-gray-900 text-sm rounded-r-md"><option value="py">평</option><option value="m2">㎡</option></select></div></div>
                                <div className="col-span-2 sm:col-span-1"><label className="block text-xs font-semibold text-gray-600 mb-1">입주 예상일</label><div className="relative cursor-pointer" onClick={() => showDatePicker(moveInDateRef)}><input type="date" ref={moveInDateRef} value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} min={targetDate} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm" /></div></div>
                            </>
                        )}
                        <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">현장 주소 (선택)</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" placeholder="예: 서울 강남구 삼성동" /></div>
                    </div>
                </div>

                {/* --- BATHROOM SPECIAL INPUTS --- */}
                {activeTab === 'bathroom' && (
                    <div className="mt-6 space-y-6 border-t pt-6">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-sm text-indigo-700 cursor-pointer">
                                <input type="checkbox" checked={useDimensionsOnly} onChange={(e) => setUseDimensionsOnly(e.target.checked)} className="rounded text-indigo-600 bg-white focus:ring-indigo-500" />
                                <span className="font-bold">도면 없음 (실측 치수만 입력)</span>
                            </label>
                        </div>
                        {useDimensionsOnly && (
                            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                                <div><label className="block text-xs text-gray-500 mb-1">가로(m)</label><input type="number" step="0.1" value={bathWidth} onChange={(e) => setBathWidth(e.target.value)} className="w-full px-2 py-1.5 border rounded bg-white text-gray-900 text-sm" /></div>
                                <div><label className="block text-xs text-gray-500 mb-1">세로(m)</label><input type="number" step="0.1" value={bathDepth} onChange={(e) => setBathDepth(e.target.value)} className="w-full px-2 py-1.5 border rounded bg-white text-gray-900 text-sm" /></div>
                                <div><label className="block text-xs text-gray-500 mb-1">높이(m)</label><input type="number" step="0.1" value={bathHeight} onChange={(e) => setBathHeight(e.target.value)} className="w-full px-2 py-1.5 border rounded bg-white text-gray-900 text-sm" /></div>
                            </div>
                        )}
                        {!useDimensionsOnly && (
                            <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-indigo-600' : 'border-gray-300'} border-dashed rounded-md bg-gray-50 transition-colors`}>{image ? (<div className="text-center"><img src={image.preview} alt="미리보기" className="mx-auto h-32 w-auto rounded-lg mb-2 shadow-sm" /><button type="button" onClick={() => setImage(null)} className="text-xs text-red-600 underline hover:text-red-800">이미지 삭제</button></div>) : (<div className="text-center"><label htmlFor="file-upload" className="cursor-pointer text-indigo-600 hover:text-indigo-500 text-sm font-medium"><span>도면/사진 업로드</span><input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={e => handleFileChange(e.target.files)} /></label><p className="text-xs text-gray-500 mt-1">JPG, PNG, PDF</p></div>)}</div>
                        )}
                    </div>
                )}

                {/* --- FULL MODE IMAGE UPLOAD --- */}
                {activeTab === 'full' && (
                    <div className="mt-4"><label className="block text-xs font-semibold text-gray-600 mb-1">도면 이미지 <span className="text-red-500">*</span></label><div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-indigo-600' : 'border-gray-300'} border-dashed rounded-md bg-gray-50 transition-colors`}>{image ? (<div className="text-center"><img src={image.preview} alt="미리보기" className="mx-auto h-32 w-auto rounded-lg mb-2 shadow-sm" /><button type="button" onClick={() => setImage(null)} className="text-xs text-red-600 underline hover:text-red-800">이미지 삭제</button></div>) : (<div className="text-center"><label htmlFor="file-upload" className="cursor-pointer text-indigo-600 hover:text-indigo-500 text-sm font-medium"><span>파일 업로드</span><input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={e => handleFileChange(e.target.files)} /></label><p className="text-xs text-gray-500 mt-1">또는 드래그 앤 드롭</p></div>)}</div></div>
                )}
            </div>

            {/* --- FULL MODE PRESET BUTTON (RESTORED) --- */}
            {activeTab === 'full' && (
                <div className="mb-8">
                    <button type="button" onClick={handleStandardPreset} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        🚀 {getButtonText()} 올수리 표준 견적 (간편설정)
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">* 1번에 입력하신 평수를 기준으로, 가장 많이 선택하는 '표준 공사' 항목이 자동 체크됩니다.<br/>(버튼 클릭 후 아래 공사 내용 리스트를 반드시 확인해주세요)</p>
                </div>
            )}

            {/* ================================================================================== */}
            {/* [RESTORED] STEP 2: CONSTRUCTION SCOPE CHECKLIST (FULL MODE) */}
            {/* ================================================================================== */}
            {activeTab === 'full' && (
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm animate-fade-in-up">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2 flex items-center"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">2</span>공사 범위 선택 (Checklist)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                         <CheckboxItem id="sash" label="샷시 (창호 교체)" checked={scopes.sash} onChange={() => handleScopeChange('sash')} notePlaceholder="예: 거실 발코니창만 이중창으로 변경" />
                         <CheckboxItem id="door" label="도어/문틀 공사" checked={scopes.door} onChange={() => handleScopeChange('door')} />
                         <CheckboxItem id="bath1" label="안방 욕실 리모델링 (간단)" checked={scopes.bath1} onChange={() => handleScopeChange('bath1')} subLabel="※ 상세 견적은 '욕실 집중' 탭 이용 권장" />
                         <CheckboxItem id="bath2" label="거실 욕실 리모델링 (간단)" checked={scopes.bath2} onChange={() => handleScopeChange('bath2')} subLabel="※ 상세 견적은 '욕실 집중' 탭 이용 권장" />
                         <CheckboxItem id="kitchen" label="주방 싱크대 교체" checked={scopes.kitchenSink} onChange={() => handleScopeChange('kitchenSink')} />
                         <CheckboxItem id="systemAC" label="시스템 에어컨" checked={scopes.systemAC} onChange={() => handleScopeChange('systemAC')} />
                         <CheckboxItem id="expansion" label="확장 공사 (신규 진행)" checked={scopes.expansion} onChange={() => handleScopeChange('expansion')} notePlaceholder="예: 작은방 1개소 확장, 보일러 배관 연결 포함" />
                         <CheckboxItem id="tile" label="타일 시공" checked={scopes.tile} onChange={() => handleScopeChange('tile')} />
                         <CheckboxItem id="wallpaper" label="도배/도장 (벽면 마감)" checked={scopes.wallpaper} onChange={() => handleScopeChange('wallpaper')} />
                         <CheckboxItem id="flooring" label="바닥 시공 (마루/장판/타일)" checked={scopes.flooring} onChange={() => handleScopeChange('flooring')} />
                         <CheckboxItem id="molding" label="목공 천장 몰딩/등박스" checked={scopes.molding} onChange={() => handleScopeChange('molding')} notePlaceholder="예: 거실 마이너스 몰딩, 방 평몰딩" />
                         <CheckboxItem id="flat" label="목공 천장 공사 (전체/덧방)" checked={scopes.flatCeiling} onChange={() => handleScopeChange('flatCeiling')} />
                         <CheckboxItem id="paint" label="도장 공사 (발코니 전용)" checked={scopes.balconyPaint} onChange={() => handleScopeChange('balconyPaint')} />
                         <CheckboxItem id="film" label="필름 시공 (샷시/가구)" checked={scopes.film} onChange={() => handleScopeChange('film')} />
                         <CheckboxItem id="builtIn" label="붙박이장/신발장" checked={scopes.builtIn} onChange={() => handleScopeChange('builtIn')} />
                         <CheckboxItem id="elec" label="전기 (스위치/콘센트)" checked={scopes.electrical} onChange={() => handleScopeChange('electrical')} />
                         <CheckboxItem id="entry" label="중문 설치 (기본:3연동)" checked={scopes.entryDoor} onChange={() => handleScopeChange('entryDoor')} notePlaceholder="기본: 3연동 슬라이딩 (변경 시 기입)" />
                         <CheckboxItem id="insul" label="추가 단열 (벽체)" checked={scopes.insulation} onChange={() => handleScopeChange('insulation')} notePlaceholder="추가할 위치 (예: 북쪽방 외벽, 안방)" />
                    </div>
                </div>
            )}

            {/* ================================================================================== */}
            {/* [RESTORED] STEP 3: DETAILED SPECS (FULL MODE) */}
            {/* ================================================================================== */}
            {activeTab === 'full' && hasSelectedScopes && (
                <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 shadow-sm animate-fade-in-up">
                    <h3 className="text-sm font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2 flex items-center">
                        <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                        상세 스펙 설정 (선택 항목)
                    </h3>
                    <div className="space-y-6">
                        
                        {/* Advanced Carpentry & Finishes */}
                        {(scopes.wallpaper || scopes.molding || scopes.flatCeiling) && (
                            <div className="bg-white p-4 rounded-lg border-2 border-indigo-200">
                                <h5 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                                    <span className="text-lg">✨</span> 고급 시공 디테일 (High-End Details)
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Wall Finish Selection */}
                                    <div className="bg-indigo-50/50 p-3 rounded">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">벽면 마감재 종류</label>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center text-sm cursor-pointer"><input type="radio" checked={wallFinishType === 'wallpaper'} onChange={() => { setWallFinishType('wallpaper'); setWallLayers('1ply'); setWallAllPutty(false); }} className="mr-2 text-indigo-600" />실크 도배 (표준)</label>
                                            <label className="flex items-center text-sm cursor-pointer"><input type="radio" checked={wallFinishType === 'paint'} onChange={() => { setWallFinishType('paint'); setWallLayers('2ply'); setWallAllPutty(true); }} className="mr-2 text-indigo-600" />건축 도장 (벤자민무어 등) <span className="text-[10px] text-red-500 ml-1 font-bold">+고가</span></label>
                                            <label className="flex items-center text-sm cursor-pointer"><input type="radio" checked={wallFinishType === 'film'} onChange={() => { setWallFinishType('film'); }} className="mr-2 text-indigo-600" />인테리어 필름 (부분/전체) <span className="text-[10px] text-orange-500 ml-1 font-bold">+중고가</span></label>
                                        </div>
                                    </div>

                                    {/* Structural & Layer Options */}
                                    <div className="bg-indigo-50/50 p-3 rounded space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">벽체 바탕면 시공 (목공)</label>
                                            <select value={wallLayers} onChange={(e) => setWallLayers(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900" disabled={wallFinishType === 'paint'}>
                                                <option value="1ply">석고 1겹 (1-Ply) - 일반 도배용</option>
                                                <option value="2ply">석고 2겹 (2-Ply) - 고급/도장 필수</option>
                                            </select>
                                            {wallFinishType === 'paint' && <p className="text-[10px] text-blue-600 mt-1">* 도장 마감 시 2겹 석고 필수 적용됨</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">벽체 상태 / 신설 여부</label>
                                            <select value={wallStructure} onChange={(e) => setWallStructure(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900">
                                                <option value="existing">기존 벽체 활용 (양호)</option>
                                                <option value="bad_condition">면 상태 불량 (샌딩/퍼티 필요)</option>
                                                <option value="new_stud">가벽/벽체 신설 필요 (구조변경)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Baseboard & Molding Detail */}
                                    <div className="md:col-span-2 bg-indigo-50/50 p-3 rounded grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">천장 몰딩 디테일</label>
                                            <select value={moldingType} onChange={(e) => setMoldingType(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900">
                                                <option value="flat">평몰딩 (가장 일반적/심플)</option>
                                                <option value="minus">마이너스 몰딩 (고급/히든)</option>
                                                <option value="crown">갈매기 몰딩 (클래식)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">걸레받이 디테일</label>
                                            <select value={baseboardType} onChange={(e) => setBaseboardType(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900">
                                                <option value="standard">일반 걸레받이 (MDF/PS)</option>
                                                <option value="paint_skirting">걸레받이 없이 도장 마감</option>
                                                <option value="minus_hidden">히든/마이너스 걸레받이 (최고급)</option>
                                                <option value="none">없음 (노출콘크리트 등)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expansion Details */}
                        {scopes.expansion && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-lg">🧱</span> 확장 공사 상세 설정 (건축 공정 포함)
                                </h5>
                                <div className="mb-4">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">바닥 난방 (보일러 엑셀) 연장</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center text-sm cursor-pointer"><input type="radio" checked={expansionHeating} onChange={() => setExpansionHeating(true)} className="mr-2 text-indigo-600" />연장 함 (권장)</label>
                                            <label className="flex items-center text-sm cursor-pointer"><input type="radio" checked={!expansionHeating} onChange={() => setExpansionHeating(false)} className="mr-2 text-indigo-600" />안 함 (전기필름 등)</label>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">벽체 단열재 등급</label>
                                        <select value={expansionInsulation} onChange={(e) => setExpansionInsulation(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900">
                                            <option value="standard">일반 (열반사+스티로폼)</option>
                                            <option value="high_end">고단열 (아이소핑크 특호+E보드)</option>
                                        </select>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded md:col-span-2">
                                        <label className="flex items-center text-sm font-bold text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={expansionTurning} onChange={(e) => setExpansionTurning(e.target.checked)} className="mr-2 w-4 h-4 text-indigo-600" />
                                            터닝도어 (단열 전문 도어) 설치 포함
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {scopes.sash && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><span className="text-lg">🪟</span> 샷시(창호) 상세 설정</h5>
                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded"><input type="radio" name="sashScope" checked={sashScope === 'all'} onChange={() => setSashScope('all')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />전체 교체 (Whole House)</label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded"><input type="radio" name="sashScope" checked={sashScope === 'partial'} onChange={() => setSashScope('partial')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />부분 교체 (Partial)</label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1">브랜드</label><select value={sashBrand} onChange={(e) => setSashBrand(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900"><option value="kcc">KCC (가성비 우수)</option><option value="lx">LX Z:IN (프리미엄)</option><option value="hyundai">현대 L&C</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1">유리 사양</label><select value={sashGlass} onChange={(e) => setSashGlass(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900"><option value="general_22">일반 22mm 복층</option><option value="low_e_24">24mm 로이유리 (추천)</option><option value="triple_system">3중 시스템 유리 (고가)</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1">창호 타입</label><select value={sashType} onChange={(e) => setSashType(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900"><option value="double">이중창 (내창/발코니)</option><option value="system">시스템 창호 (오피스텔형)</option></select></div>
                                </div>
                                {sashScope === 'all' && (<div className="mt-2"><label className="text-xs text-gray-600 block mb-1">교체할 창호 개수 (대략)</label><input type="number" value={windowCount} onChange={e => setWindowCount(parseInt(e.target.value))} className="w-full text-sm border p-2 rounded bg-white text-gray-900" placeholder="예: 5" /></div>)}
                                {sashScope === 'partial' && (<div className="mt-2"><label className="text-xs text-gray-600 block mb-1 font-bold">어디를 교체하시겠습니까?</label><input type="text" value={sashPartialText} onChange={e => setSashPartialText(e.target.value)} className="w-full text-sm border p-2 rounded bg-white text-gray-900" placeholder="예: 안방, 거실 분합창" /></div>)}
                            </div>
                        )}

                        {/* Door */}
                        {scopes.door && (
                             <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><span className="text-lg">🚪</span> 도어/문틀 공사 설정</h5>
                                <div className="space-y-2">
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded"><input type="radio" name="doorMode" checked={doorMode === 'replace_all'} onChange={() => setDoorMode('replace_all')} className="mr-2 text-indigo-600" />문틀+도어 전체 교체 (ABS)</label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded"><input type="radio" name="doorMode" checked={doorMode === 'replace_door_film_frame'} onChange={() => setDoorMode('replace_door_film_frame')} className="mr-2 text-indigo-600" />문짝 교체 + 문틀 필름 리폼</label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded"><input type="radio" name="doorMode" checked={doorMode === 'film_both'} onChange={() => setDoorMode('film_both')} className="mr-2 text-indigo-600" />전체 필름 리폼 (교체 없음)</label>
                                    <label className="flex items-center text-sm cursor-pointer p-2 hover:bg-gray-50 rounded"><input type="radio" name="doorMode" checked={doorMode === 'paint_both'} onChange={() => setDoorMode('paint_both')} className="mr-2 text-indigo-600" />전체 도장 리폼</label>
                                </div>
                                <div className="mt-2"><label className="text-xs text-gray-600 block mb-1">도어 개수</label><input type="number" value={doorCount} onChange={e => setDoorCount(parseInt(e.target.value))} className="w-full text-sm border p-2 rounded bg-white text-gray-900" placeholder="5" /></div>
                            </div>
                        )}

                        {/* Flooring */}
                        {scopes.flooring && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><span className="text-lg">🪵</span> 바닥재 설정</h5>
                                <select value={flooringLayout} onChange={e => setFlooringLayout(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900 mb-3">
                                    <option value="all_maru">전체 강마루 시공</option>
                                    <option value="all_jangpan">전체 장판 시공</option>
                                    <option value="all_tile">전체 타일 시공 (고급)</option>
                                    <option value="mix_tile_maru">거실 타일 + 방 마루</option>
                                    <option value="mix_maru_jangpan">거실 마루 + 방 장판</option>
                                </select>
                                {flooringLayout.includes('maru') && (
                                    <div className="mb-2"><label className="text-xs font-bold text-gray-700 block mb-1">마루 종류</label><select value={maruSpec} onChange={e => setMaruSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900"><option value="gang">일반 강마루</option><option value="texture">텍스쳐/광폭 강마루 (+비용)</option></select></div>
                                )}
                                {flooringLayout.includes('jangpan') && (
                                    <div className="mb-2"><label className="text-xs font-bold text-gray-700 block mb-1">장판 두께</label><select value={jangpanSpec} onChange={e => setJangpanSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900"><option value="1.8">1.8T (알뜰)</option><option value="2.2">2.2T (표준)</option><option value="5.0">5.0T (고급 엑스컴포트)</option></select></div>
                                )}
                                {flooringLayout.includes('tile') && (
                                    <div className="mb-2"><label className="text-xs font-bold text-gray-700 block mb-1">타일 규격</label><select value={tileSpec} onChange={e => setTileSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900"><option value="600">600각 포세린</option><option value="800">800각 포세린 (+비용)</option><option value="600_1200">600*1200 대형타일 (+비용)</option></select></div>
                                )}
                            </div>
                        )}

                        {/* Tile Areas */}
                        {scopes.tile && (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-2">타일 시공 부위 (욕실 외)</h5>
                                <div className="flex flex-wrap gap-3">
                                    <label className="flex items-center text-sm"><input type="checkbox" checked={tileScopes.entrance} onChange={() => setTileScopes(p => ({...p, entrance: !p.entrance}))} className="mr-2" />현관</label>
                                    <label className="flex items-center text-sm"><input type="checkbox" checked={tileScopes.kitchen} onChange={() => setTileScopes(p => ({...p, kitchen: !p.kitchen}))} className="mr-2" />주방 벽</label>
                                    <label className="flex items-center text-sm"><input type="checkbox" checked={tileScopes.balcony} onChange={() => setTileScopes(p => ({...p, balcony: !p.balcony}))} className="mr-2" />발코니 바닥</label>
                                </div>
                            </div>
                        )}
                        
                        {/* Film Areas */}
                        {scopes.film && (
                             <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-2">필름 시공 부위</h5>
                                <div className="space-y-2">
                                    <label className="flex items-center text-sm"><input type="checkbox" checked={filmScopes.doors} onChange={() => setFilmScopes(p => ({...p, doors: !p.doors}))} className="mr-2" />문/문틀 ({filmScopes.doorsCount}개)</label>
                                    <label className="flex items-center text-sm"><input type="checkbox" checked={filmScopes.entrance} onChange={() => setFilmScopes(p => ({...p, entrance: !p.entrance}))} className="mr-2" />현관문 내측</label>
                                    <label className="flex items-center text-sm"><input type="checkbox" checked={filmScopes.sink} onChange={() => setFilmScopes(p => ({...p, sink: !p.sink}))} className="mr-2" />싱크대 리폼</label>
                                </div>
                            </div>
                        )}

                        {/* Admin / Prep */}
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h5 className="text-sm font-bold text-gray-800 mb-2">행정 및 보양 (Administrative)</h5>
                            <div className="flex gap-4 mb-2">
                                <label className="flex items-center text-sm"><input type="radio" name="adminMode" checked={adminMode === 'include'} onChange={() => setAdminMode('include')} className="mr-2" />견적 포함</label>
                                <label className="flex items-center text-sm"><input type="radio" name="adminMode" checked={adminMode === 'self'} onChange={() => setAdminMode('self')} className="mr-2" />셀프 진행 (제외)</label>
                            </div>
                            {adminMode === 'include' && (
                                <div className="pl-4 border-l-2 border-gray-300 space-y-1">
                                    <label className="flex items-center text-xs text-gray-600"><input type="checkbox" checked={adminScopes.consent} onChange={() => setAdminScopes(p => ({...p, consent: !p.consent}))} className="mr-2" />입주민 동의서 대행</label>
                                    <label className="flex items-center text-xs text-gray-600"><input type="checkbox" checked={adminScopes.protection} onChange={() => setAdminScopes(p => ({...p, protection: !p.protection}))} className="mr-2" />엘리베이터 보양</label>
                                    {scopes.expansion && <label className="flex items-center text-xs text-gray-600"><input type="checkbox" checked={adminScopes.permit} readOnly className="mr-2" disabled />행위허가 (확장 시 필수)</label>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4. Confirmation (Full Mode Only) */}
            {activeTab === 'full' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <label className="flex items-start cursor-pointer">
                        <div className="flex items-center h-5">
                            <input 
                                type="checkbox" 
                                checked={isScopeConfirmed} 
                                onChange={handleConfirmationChange} 
                                disabled={isCheckingConflicts}
                                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" 
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <span className="font-bold text-red-800">위 공사 내용으로 진행함을 확인합니다.</span>
                            <p className="text-xs text-red-600 mt-1">
                                {isCheckingConflicts ? 'AI가 설정 충돌을 검사하고 있습니다...' : '체크 시 AI가 설정 간 충돌(예: 도장 마감에 1겹 석고) 여부를 검사합니다.'}
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* ================================================================================== */}
            {/* [NEW] BATHROOM DETAILED CHECKLIST (BATHROOM MODE) */}
            {/* ================================================================================== */}
            {activeTab === 'bathroom' && (
                <div className="space-y-4 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center">
                        <span className="text-2xl mr-2">🛁</span> 욕실 상세 스펙 선택
                    </h3>
                    
                    {/* 1. Demolition & Waterproofing */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><span className="text-indigo-600">01.</span> 철거 및 방수 (Demolition)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {([
                                {v: 'basic_removal', l: '기본 철거 (덧방)', d: '기존 타일 위에 시공 (저렴)'},
                                {v: 'partial_overlay', l: '부분 철거 (욕조제거)', d: '욕조 자리만 방수 후 덧방'},
                                {v: 'full_waterproof', l: '올철거 + 전체방수', d: '벽/바닥 전체 철거 (안전)'}
                            ] as const).map(opt => (
                                <label key={opt.v} className={`border p-3 rounded-lg cursor-pointer transition-all ${bathDemolition === opt.v ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <input type="radio" name="bathDemo" checked={bathDemolition === opt.v} onChange={() => setBathDemolition(opt.v)} className="text-indigo-600 focus:ring-indigo-500" />
                                        <span className="font-bold text-sm text-gray-900">{opt.l}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">{opt.d}</p>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 2. Tile & Gendai */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><span className="text-indigo-600">02.</span> 타일 및 젠다이 (Tile & Finish)</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">벽/바닥 타일 규격 선택</label>
                                <select value={bathTileSelect} onChange={(e) => setBathTileSelect(e.target.value as any)} className="w-full border p-2 rounded text-sm bg-white text-gray-900">
                                    <option value="300_600">일반 300*600각 (가성비)</option>
                                    <option value="600_600">600각 포세린 (호텔식 표준)</option>
                                    <option value="800_800">800각 대형 포세린 (+고급)</option>
                                    <option value="600_1200">600*1200 빅슬랩 (최고급)</option>
                                    <option value="mosaic">모자이크/쪽타일 포인트 (+시공비)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">젠다이(선반) 마감 방식</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input type="radio" name="gendai" checked={bathGendai === 'jolly_cut'} onChange={() => setBathGendai('jolly_cut')} className="mr-2 text-indigo-600" />
                                        <span className="text-xs font-bold">졸리컷 (타일마감)</span>
                                    </label>
                                    <label className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input type="radio" name="gendai" checked={bathGendai === 'art_marble'} onChange={() => setBathGendai('art_marble')} className="mr-2 text-indigo-600" />
                                        <span className="text-xs">인조대리석 상판</span>
                                    </label>
                                    <label className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input type="radio" name="gendai" checked={bathGendai === 'nat_marble'} onChange={() => setBathGendai('nat_marble')} className="mr-2 text-indigo-600" />
                                        <span className="text-xs">천연대리석/엔지니어드</span>
                                    </label>
                                    <label className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input type="radio" name="gendai" checked={bathGendai === 'none'} onChange={() => setBathGendai('none')} className="mr-2 text-indigo-600" />
                                        <span className="text-xs">젠다이 없음 (일반선반)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Layout & Ceiling */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><span className="text-indigo-600">03.</span> 구조 및 천장 (Layout)</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">샤워 공간 구성</label>
                                <select value={bathWetZone} onChange={(e) => setBathWetZone(e.target.value as any)} className="w-full border p-2 rounded text-sm bg-white text-gray-900">
                                    <option value="partition_glass">유리 파티션 (기본)</option>
                                    <option value="bathtub">욕조 시공 (SMC/아크릴)</option>
                                    <option value="partition_tile">조적(타일) 파티션 (+고급)</option>
                                    <option value="booth">샤워 부스 (도어형)</option>
                                    <option value="none">구분 없음 (겸용)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">천장재 종류</label>
                                <select value={bathCeiling} onChange={(e) => setBathCeiling(e.target.value as any)} className="w-full border p-2 rounded text-sm bg-white text-gray-900">
                                    <option value="smc_flat">SMC 평천장 (깔끔/추천)</option>
                                    <option value="smc_dome">SMC 돔천장 (기본)</option>
                                    <option value="barrisol">바리솔 (조명천장/고가)</option>
                                    <option value="paint_special">이노솔/도장 마감</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 4. Fixtures & Furniture */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><span className="text-indigo-600">04.</span> 도기 및 수납장 (Fixtures)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-2 rounded">
                                <label className="text-xs font-bold text-gray-600 block mb-1">양변기 종류</label>
                                <select value={bathToilet} onChange={(e) => setBathToilet(e.target.value as any)} className="w-full border p-1.5 rounded text-xs bg-white text-gray-900">
                                    <option value="two_piece">투피스 (가성비/수압강함)</option>
                                    <option value="one_piece">원피스 (디자인/소음적음)</option>
                                    <option value="wall_hung">벽걸이/비데일체형 (+고가)</option>
                                </select>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <label className="text-xs font-bold text-gray-600 block mb-1">세면대 종류</label>
                                <select value={bathBasin} onChange={(e) => setBathBasin(e.target.value as any)} className="w-full border p-1.5 rounded text-xs bg-white text-gray-900">
                                    <option value="half_pedestal">반다리 세면대 (벽배수)</option>
                                    <option value="full_pedestal">긴다리 세면대 (바닥배수)</option>
                                    <option value="top_counter">탑볼/카운터형 (+하부장)</option>
                                </select>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <label className="text-xs font-bold text-gray-600 block mb-1">수전 컬러/마감</label>
                                <select value={bathFaucet} onChange={(e) => setBathFaucet(e.target.value as any)} className="w-full border p-1.5 rounded text-xs bg-white text-gray-900">
                                    <option value="standard_chrome">기본 크롬 (유광)</option>
                                    <option value="matte_sus">무광 니켈 (SUS304)</option>
                                    <option value="color_coated">화이트/블랙/골드</option>
                                </select>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <label className="text-xs font-bold text-gray-600 block mb-1">상부장/거울</label>
                                <select value={bathCabinet} onChange={(e) => setBathCabinet(e.target.value as any)} className="w-full border p-1.5 rounded text-xs bg-white text-gray-900">
                                    <option value="sliding_mirror">슬라이딩 거울장 (수납최대)</option>
                                    <option value="flap_jang">플랩장 (상단오픈)</option>
                                    <option value="mirror_standard">일반거울 + 오픈장</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 5. Add-ons */}
                    <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 shadow-sm">
                        <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2 text-sm"><span className="text-lg">⚡️</span> 추가 옵션 (Add-ons)</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <label className="flex items-center cursor-pointer hover:bg-yellow-100 p-1 rounded">
                                <input type="checkbox" checked={bathVent === 'high_end_damper'} onChange={(e) => setBathVent(e.target.checked ? 'high_end_damper' : 'basic_fan')} className="mr-2 text-yellow-600 rounded" />
                                <span>힘펠 환풍기 (전동댐퍼)</span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-yellow-100 p-1 rounded">
                                <input type="checkbox" checked={bathHeatExt} onChange={(e) => setBathHeatExt(e.target.checked)} className="mr-2 text-yellow-600 rounded" />
                                <span>바닥 난방 배관 연장</span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-yellow-100 p-1 rounded">
                                <input type="checkbox" checked={bathElecMove} onChange={(e) => setBathElecMove(e.target.checked)} className="mr-2 text-yellow-600 rounded" />
                                <span>콘센트 신설 (비데용)</span>
                            </label>
                            <label className="flex items-center cursor-pointer hover:bg-yellow-100 p-1 rounded">
                                <input type="checkbox" checked={bathElecIndirect} onChange={(e) => setBathElecIndirect(e.target.checked)} className="mr-2 text-yellow-600 rounded" />
                                <span>간접 조명 (장하부 T5)</span>
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 ml-1">* 체크된 항목은 전기/설비 공정에 자동으로 추가되어 견적에 반영됩니다.</p>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!isFormValid || (activeTab === 'full' && !isScopeConfirmed) || isCheckingConflicts}
                  className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white transition-all duration-300
                    ${(!isFormValid || (activeTab === 'full' && !isScopeConfirmed) || isCheckingConflicts)
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                >
                  {activeTab === 'bathroom' ? '🛁 전문가급 욕실 상세 견적 산출하기' : '✨ AI 인테리어 디자인 & 견적 받아보기'}
                </button>
                {activeTab === 'full' && (
                     <button onClick={handleDemoSubmit} className="text-xs text-gray-400 underline hover:text-gray-600 text-center">
                        입력 없이 데모 데이터로 체험하기 (Test Mode)
                     </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};
