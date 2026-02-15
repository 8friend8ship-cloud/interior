
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
  const [floor, setFloor] = useState<number>(5); // Default 5th floor

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
  const [tileSpec, setTileSpec] = useState<'600' | '800' | '600_1200'>('600');
  
  // UPDATED: Sash States (Window)
  const [sashScope, setSashScope] = useState<'all' | 'partial'>('all');
  const [sashPartialText, setSashPartialText] = useState<string>('');
  const [sashBrand, setSashBrand] = useState<'kcc' | 'lx' | 'hyundai'>('kcc');
  const [sashGlass, setSashGlass] = useState<'general_22' | 'low_e_24' | 'triple_system'>('low_e_24');
  const [sashType, setSashType] = useState<'double' | 'system'>('double');

  // Door Mode
  const [doorMode, setDoorMode] = useState<'replace_all' | 'replace_door_film_frame' | 'film_both' | 'paint_both'>('replace_all');

  // UPDATED: Ceiling & Molding States
  const [ceilingMethod, setCeilingMethod] = useState<'replace_all' | 'overlay' | 'paint_only'>('replace_all'); // flatCeiling maps to this
  const [ceilingIndirect, setCeilingIndirect] = useState<boolean>(true);
  const [ceilingPly, setCeilingPly] = useState<boolean>(false); // 2Ply Option
  const [moldingType, setMoldingType] = useState<'minus' | 'flat' | 'crown'>('flat');
  
  // NEW: Advanced Wall Configurations (High-End)
  const [wallStructure, setWallStructure] = useState<'existing' | 'new_stud' | 'bad_condition'>('existing');
  const [wallLayers, setWallLayers] = useState<'1ply' | '2ply'>('1ply');
  const [wallFinishType, setWallFinishType] = useState<'wallpaper' | 'paint' | 'film'>('wallpaper');
  const [baseboardType, setBaseboardType] = useState<'standard' | 'minus_hidden' | 'paint_skirting' | 'none'>('standard');
  const [wallSoundProofing, setWallSoundProofing] = useState<boolean>(false);
  const [wallAllPutty, setWallAllPutty] = useState<boolean>(false);

  // NEW: Entry Door States
  const [entryDoorType, setEntryDoorType] = useState<'3yeondong' | 'swing' | 'onesliding'>('3yeondong');
  
  // NEW: Expansion Config
  const [expansionHeating, setExpansionHeating] = useState<boolean>(true);
  const [expansionInsulation, setExpansionInsulation] = useState<'standard' | 'high_end'>('high_end');
  const [expansionTurning, setExpansionTurning] = useState<boolean>(true);

  // NEW: Insulation Area (Extra)
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
          if (wallFinishType === 'paint' && wallLayers === '1ply') {
              conflicts.push("⚠️ [도장 마감 주의] '페인트' 마감 시 '석고 2겹(2ply)' 시공을 강력 권장합니다. (1겹 시 크랙 위험)");
          }
          if (moldingType === 'minus' && wallLayers === '1ply') {
              conflicts.push("⚠️ [마이너스 몰딩 주의] 마이너스 몰딩 시공은 벽체 정밀도가 요구되어 '석고 2겹' 시공이 권장됩니다.");
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

      // 1. Check Missing Info depending on Active Tab
      if (activeTab === 'full') {
           // Full Scope Mode Validation
           if (!area || !targetDate || !moveInDate || !image) {
               alert("⚠️ [필수 정보 누락]\n전체 인테리어 견적을 위해서는 면적, 일정(시작/종료), 도면이 필수입니다.\n맨 위로 이동하여 필수 항목을 확인해주세요.");
               setIsCheckingConflicts(false);
               setIsScopeConfirmed(false);
               return;
           }

           // 2. Check Conflicts (Full Mode Only)
           const conflicts = checkConflicts();
           if (conflicts.length > 0) {
               const message = `🚨 [중복/주의 항목 감지]\nAI가 설정 내역에서 다음 사항을 발견했습니다.\n\n${conflicts.join('\n')}\n\n👉 [취소]: 돌아가서 수정하기\n👉 [확인]: 무시하고 그대로 진행하기`;
               const proceedAnyway = window.confirm(message);
               
               if (!proceedAnyway) {
                   setIsCheckingConflicts(false);
                   setIsScopeConfirmed(false);
                   return;
               }
           }
      } else {
           // Bathroom Mode Validation (Should typically not be reached if checkbox is hidden, but kept for safety)
           if (!targetDate) {
               alert("⚠️ [필수 정보 누락]\n공사 희망일은 필수입니다.");
               setIsCheckingConflicts(false);
               setIsScopeConfirmed(false);
               return;
           }

           if (useDimensionsOnly) {
               if (!bathWidth || !bathDepth || !bathHeight) {
                   alert("⚠️ [필수 정보 누락]\n도면 없이 진행할 경우, 욕실의 가로/세로/높이 치수를 모두 입력해야 합니다.");
                   setIsCheckingConflicts(false);
                   setIsScopeConfirmed(false);
                   return;
               }
           } else {
               if (!image) {
                   alert("⚠️ [필수 정보 누락]\n도면 이미지를 업로드하거나, '도면 없이 실측 치수' 옵션을 체크해주세요.");
                   setIsCheckingConflicts(false);
                   setIsScopeConfirmed(false);
                   return;
               }
           }
      }

      // 3. All Clear
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
      
      // Standard Finishes
      setWallFinishType('wallpaper');
      setWallLayers('1ply');
      setWallStructure('existing');
      setBaseboardType('standard');
      setWallSoundProofing(false);
      setWallAllPutty(false);
      
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
    
    // Check confirmation again (Button should be disabled, but for safety)
    if (activeTab === 'full' && !isScopeConfirmed) {
        alert("하단의 '공사 내용 확인' 체크박스를 선택해주세요.");
        return;
    }

    // Explicit validation for Bathroom Mode Dimensions
    if (activeTab === 'bathroom' && useDimensionsOnly) {
         if (!bathWidth || !bathDepth || !bathHeight) {
             alert("필수: 욕실의 가로, 세로, 높이 치수를 모두 입력해주세요.");
             return;
         }
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
        sashConfig: scopes.sash ? {
            brand: sashBrand,
            glass: sashGlass,
            windowType: sashType
        } : undefined,
        door: { mode: doorMode },
        paint: paintScopes,
        film: filmScopes,
        // NEW MAPS
        molding: scopes.molding ? { type: moldingType } : undefined,
        entryDoor: scopes.entryDoor ? { type: entryDoorType } : undefined,
        insulation: scopes.insulation ? { area: insulationArea } : undefined,
        ceiling: scopes.flatCeiling ? {
            type: moldingType === 'minus' ? 'exposed' : 'flat', // Simple mapping
            method: ceilingMethod,
            indirectLight: ceilingIndirect,
            isTwoPly: ceilingPly
        } : undefined,
        // NEW: Advanced Wall Config
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
      floor: floor, // Added Floor for Ladder calculation
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
    // Demo submit logic (kept simple)
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
        floor: 12,
        scopeFlags: demoScopes,
        detailedScope: {
            tile: { kitchen: true, entrance: true, balcony: true },
            wallpaper: 'all_silk', 
            flooring: { 
                layout: 'all_maru',
                specs: { maru: 'gang', jangpan: '2.2', tile: '600' }
            },
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

  // ... (showDatePicker, CheckboxItem, hasSelectedScopes remain the same) ...
  const showDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
      if (ref.current && ref.current.showPicker) {
          ref.current.showPicker();
      } else {
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
                    className="w-full text-xs p-2 border border-indigo-200 rounded bg-white text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
              </div>
          )}
      </div>
  );

  const hasSelectedScopes = Object.values(scopes).some(v => v === true);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      {/* ... (Header and Tabs code preserved) ... */}
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
            {/* 1. Basic Info ... (Preserved) ... */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
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
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900" 
                                        placeholder="예: 32" 
                                        required 
                                    />
                                    <select
                                        value={areaUnit}
                                        onChange={(e) => setAreaUnit(e.target.value as UnitType)}
                                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-white text-gray-900 text-sm rounded-r-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="py">평</option>
                                        <option value="m2">㎡</option>
                                    </select>
                                </div>
                            </div>
                            {/* ... Date, Address, Budget ... */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    공사 희망일 (시작) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative cursor-pointer group" onClick={() => showDatePicker(targetDateRef)}>
                                    <input type="date" ref={targetDateRef} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 cursor-pointer shadow-sm text-sm" required />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    입주 예상일 (종료) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative cursor-pointer group" onClick={() => showDatePicker(moveInDateRef)}>
                                    <input type="date" ref={moveInDateRef} value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} min={targetDate} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 cursor-pointer shadow-sm text-sm" required />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">공사 예정 주소</label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white text-gray-900" placeholder="예: 서울시 강남구 삼성동 아이파크" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">해당 층수</label>
                                <div className="relative"><input type="number" value={floor} onChange={(e) => setFloor(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white text-gray-900" placeholder="5" /><span className="absolute right-3 top-2.5 text-xs text-gray-500">층</span></div>
                            </div>
                            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">가용 예산 (선택사항)</label><div className="relative"><input type="number" value={budget} onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value) : '')} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white text-gray-900" placeholder="예: 4000" /><span className="absolute right-3 top-2.5 text-sm text-gray-500">만원</span></div></div>
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1">방 개수</label><input type="number" value={roomCount || ''} onChange={(e) => setRoomCount(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white text-gray-900" placeholder="예: 3" /></div>
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1">욕실 개수</label><input type="number" value={userBathCount || ''} onChange={(e) => setUserBathCount(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 bg-white text-gray-900" placeholder="예: 2" /></div>
                        </div>
                        {/* Expansion Status */}
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
                         <div className="col-span-3"><label className="flex items-center space-x-2 text-sm text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100 mb-3 cursor-pointer"><input type="checkbox" checked={useDimensionsOnly} onChange={(e) => setUseDimensionsOnly(e.target.checked)} className="rounded text-indigo-600 bg-white" /><span className="font-semibold">도면 없이 실측 치수로만 진행</span></label></div>
                         <div className="col-span-3"><label className="block text-xs font-semibold text-gray-600 mb-1">공사 희망일 <span className="text-red-500">*</span></label><div className="relative cursor-pointer group" onClick={() => showDatePicker(targetDateRef)}><input type="date" ref={targetDateRef} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 cursor-pointer shadow-sm text-sm" required /></div></div>
                         <div><label className="block text-xs text-gray-500 mb-1">가로(m) <span className="text-red-500">*</span></label><input type="number" step="0.1" value={bathWidth} onChange={(e) => setBathWidth(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" /></div>
                         <div><label className="block text-xs text-gray-500 mb-1">세로(m) <span className="text-red-500">*</span></label><input type="number" step="0.1" value={bathDepth} onChange={(e) => setBathDepth(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" /></div>
                         <div><label className="block text-xs text-gray-500 mb-1">높이(m) <span className="text-red-500">*</span></label><input type="number" step="0.1" value={bathHeight} onChange={(e) => setBathHeight(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" /></div>
                    </div>
                )}
                {/* Image Upload ... */}
                 {(!useDimensionsOnly || activeTab === 'full') && (
                    <div className="mt-4"><label className="block text-xs font-semibold text-gray-600 mb-1">도면 이미지 <span className="text-red-500">*</span></label><div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-indigo-600' : 'border-gray-300'} border-dashed rounded-md bg-gray-50 transition-colors`}>{image ? (<div className="text-center"><img src={image.preview} alt="미리보기" className="mx-auto h-32 w-auto rounded-lg mb-2 shadow-sm" /><button type="button" onClick={() => setImage(null)} className="text-xs text-red-600 underline hover:text-red-800">이미지 삭제</button></div>) : (<div className="text-center"><label htmlFor="file-upload" className="cursor-pointer text-indigo-600 hover:text-indigo-500 text-sm font-medium"><span>파일 업로드</span><input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={e => handleFileChange(e.target.files)} /></label><p className="text-xs text-gray-500 mt-1">또는 드래그 앤 드롭 (JPG, PNG)</p></div>)}</div></div>
                 )}
            </div>

            {/* --- 간편 견적 (올수리) 프리셋 버튼 --- */}
            {activeTab === 'full' && (
                <div className="mb-8">
                    <button onClick={handleStandardPreset} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        🚀 {getButtonText()} 올수리 표준 견적 (간편설정)
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">* 1번에 입력하신 평수를 기준으로, 가장 많이 선택하는 '표준 공사' 항목이 자동 체크됩니다.<br/>(버튼 클릭 후 아래 공사 내용 리스트를 반드시 확인해주세요)</p>
                </div>
            )}

            {/* 2. Construction Scope (Checklist) */}
            {activeTab === 'full' && (
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
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

            {/* NEW STEP 3: Detailed Specs */}
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

                                    {/* Advanced Toggles */}
                                    <div className="md:col-span-2 bg-gray-50 p-3 rounded flex flex-wrap gap-4">
                                        <label className="flex items-center text-sm cursor-pointer">
                                            <input type="checkbox" checked={wallSoundProofing} onChange={e => setWallSoundProofing(e.target.checked)} className="mr-2" />
                                            🔊 벽체 방음 시공 (글라스울/차음재)
                                        </label>
                                        <label className="flex items-center text-sm cursor-pointer">
                                            <input type="checkbox" checked={ceilingPly} onChange={e => setCeilingPly(e.target.checked)} className="mr-2" />
                                            🛡️ 천장 석고 2겹 (크랙방지/고급)
                                        </label>
                                        {wallFinishType === 'paint' && (
                                            <label className="flex items-center text-sm cursor-pointer">
                                                <input type="checkbox" checked={wallAllPutty} onChange={e => setWallAllPutty(e.target.checked)} className="mr-2" disabled />
                                                🎨 올퍼티 (All Putty) - 도장 필수
                                            </label>
                                        )}
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
                                        <p className="text-[10px] text-gray-500 mt-1 ml-6">베란다로 나가는 문을 밀폐력이 우수한 터닝도어로 설치합니다. (LG/KCC)</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ... Sash, Flooring, Door, Entry, Insulation, Film, Tile, Specs sections preserved ... */}
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
                                {sashScope === 'partial' && (<div className="mt-2"><label className="text-xs text-gray-600 block mb-1 font-bold">어디를 교체하시겠습니까?</label><input type="text" value={sashPartialText} onChange={e => setSashPartialText(e.target.value)} className="w-full text-sm border p-2 rounded bg-white text-gray-900 border-indigo-200 focus:border-indigo-500 outline-none" placeholder="예: 거실 발코니와 안방 이중창만 교체" /></div>)}
                            </div>
                        )}
                        
                        {/* Flooring & Tile Selection (Updated for 800/1200 options) */}
                        {scopes.flooring && (
                             <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><span className="text-lg">🪵</span> 바닥재 및 타일 규격 선택</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div className="bg-gray-50 p-3 rounded">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">바닥재 종류 (거실/방)</label>
                                        <select value={flooringLayout} onChange={(e) => setFlooringLayout(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900 mb-2">
                                            <option value="all_maru">전체 강마루</option>
                                            <option value="all_jangpan">전체 장판</option>
                                            <option value="all_tile">전체 포세린 타일</option>
                                            <option value="mix_tile_maru">거실 타일 + 방 마루</option>
                                        </select>
                                        {flooringLayout.includes('maru') && (
                                            <select value={maruSpec} onChange={(e) => setMaruSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900">
                                                <option value="gang">일반 강마루 (95mm)</option>
                                                <option value="texture">광폭 텍스쳐 마루 (125mm~) +프리미엄</option>
                                            </select>
                                        )}
                                     </div>
                                     <div className="bg-gray-50 p-3 rounded">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">타일 규격 (욕실/바닥 공통)</label>
                                        <select value={tileSpec} onChange={(e) => setTileSpec(e.target.value as any)} className="w-full text-sm border p-2 rounded bg-white text-gray-900">
                                            <option value="600">600각 (600x600) - 표준 고급형</option>
                                            <option value="800">800각 (800x800) - 호텔식 광폭</option>
                                            <option value="600_1200">600x1200 - 초광폭 프리미엄</option>
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            * 800각 이상 선택 시 자재비 및 시공비(양중)가 상승하며, 아덱스 등 고성능 접착제가 적용됩니다.
                                        </p>
                                     </div>
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. Confirmation & Submit ... (Preserved) ... */}
            <div className="pt-6 border-t border-gray-100">
                {activeTab === 'full' && (
                    <div className="flex items-start mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center h-5"><input id="confirmation" name="confirmation" type="checkbox" checked={isScopeConfirmed} onChange={handleConfirmationChange} className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer" /></div>
                        <div className="ml-3 text-sm"><label htmlFor="confirmation" className="font-bold text-gray-700 cursor-pointer">위 공사 내용으로 견적 생성을 진행합니다.</label><p className="text-gray-500">입력하신 정보를 바탕으로 AI가 수량을 산출하고 견적서를 작성합니다. (약 10~15초 소요)</p></div>
                    </div>
                )}
                <div className="flex flex-col gap-3">
                    <button type="submit" className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white transition-all duration-200 ${(activeTab === 'full' ? isScopeConfirmed : true) ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5' : 'bg-gray-300 cursor-not-allowed'}`} disabled={activeTab === 'full' ? (!isScopeConfirmed || isCheckingConflicts) : false}>{isCheckingConflicts ? (<span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>공사 내용 검토 중...</span>) : (activeTab === 'full' ? '🤖 AI 전체 인테리어 견적 뽑기' : '🛁 욕실 상세 분석 및 견적 시작')}</button>
                    <button onClick={handleDemoSubmit} className="w-full bg-white text-indigo-600 font-bold py-3 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-sm">⚡️ 입력 없이 데모 데이터로 체험하기</button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};
