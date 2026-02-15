
export enum AppState {
  INPUT,
  ANALYZING_PLAN,
  GENERATING_VIEWS,
  DESIGN_STUDIO,
  FINALIZING,
  RESULTS,
}

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  type: 'INTERNAL' | 'EXTERNAL';
  start: Point;
  end: Point;
  thickness: number;
}

export interface Door {
  id: string;
  wallId: string;
  position: Point;
  width: number;
  type: 'REGULAR' | 'BATHROOM' | 'ENTRANCE';
}

export interface Window {
  id: string;
  wallId: string;
  start: Point;
  end: Point;
  type: 'FULL' | 'HALF' | 'SMALL';
}

export interface Room {
  id:string;
  type: 'LIVING_ROOM' | 'BEDROOM' | 'KITCHEN' | 'BATHROOM' | 'DRESS_ROOM' | 'ENTRANCE' | 'BALCONY' | 'UNKNOWN';
  boundary: Point[];
  walls: string[];
  area: number;
}

export interface VirtualPlan {
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  units: 'meters';
  totalFloorArea: number;
  totalWallLength: number;
}

export interface BathroomSpecifics {
  type: 'overlay' | 'demolition'; 
  tileGrade: 'standard' | 'high_end'; 
  ceilingType: 'smc' | 'barrisol' | 'paint'; 
  isJollyCut: boolean; 
  wetZoneMethod: 'bathtub' | 'partition' | 'booth' | 'tile_wall' | 'none'; 
  vanityCount: number; 
  cabinetType?: 'sliding' | 'standard' | 'flap'; 
  hasGendai: boolean;
  replaceDoor?: boolean;
  removeRadiator?: boolean;
  width?: number; 
  depth?: number; 
  height?: number; 
  useDimensionsOnly?: boolean; 
}

// Detailed Scope Flags
export interface DetailedScope {
    tile: {
        kitchen: boolean;
        entrance: boolean;
        balcony: boolean;
    };
    wallpaper: 'all_silk' | 'all_paper' | 'combo'; 
    
    flooring: {
        layout: 'all_maru' | 'all_jangpan' | 'all_tile' | 'mix_tile_maru' | 'mix_maru_jangpan';
        specs: {
            maru: 'gang' | 'texture'; 
            jangpan: '1.8' | '2.2' | '5.0'; 
            tile: '600' | '800' | '600_1200'; 
        }
    };

    sash: 'all' | 'partial';
    sashCondition?: string;
    sashConfig?: {
        brand: 'kcc' | 'lx' | 'hyundai';
        glass: 'general_22' | 'low_e_24' | 'triple_system'; 
        windowType: 'double' | 'system'; 
    };

    door: {
        mode: 'replace_all' | 'replace_door_film_frame' | 'film_both' | 'paint_both';
    };

    ceiling?: {
        type: 'flat' | 'mold' | 'exposed'; 
        method: 'replace_all' | 'overlay' | 'paint_only'; 
        indirectLight: boolean; 
        isTwoPly: boolean; 
    };

    wallConfig?: {
        structural: 'existing' | 'new_stud' | 'bad_condition'; 
        layers: '1ply' | '2ply'; 
        finishType: 'wallpaper' | 'paint' | 'film'; 
        baseboard: 'standard' | 'minus_hidden' | 'paint_skirting' | 'none'; 
        soundProofing: boolean; 
        isAllPutty: boolean; 
    };

    molding?: {
        type: 'minus' | 'flat' | 'crown'; 
    };

    entryDoor?: {
        type: '3yeondong' | 'swing' | 'onesliding';
    };

    expansionConfig?: {
        floorHeating: boolean; 
        insulationGrade: 'standard' | 'high_end'; 
        turningDoor: boolean; 
    };

    insulation?: {
        area: string; 
    };

    paint: {
        balconyType: 'ceramic' | 'water';
        livingWall: boolean;
        ceiling: boolean;
        whole: boolean;
    };

    film: {
        doors: boolean; 
        doorsCount?: number; 
        builtIn: boolean; 
        builtInCount?: number; 
        sink: boolean; 
        sinkSize?: number; 
        entrance: boolean; 
        walls?: string; 
    };

    admin: {
        permit: boolean; 
        consent: boolean; 
        protection: boolean; 
    };
}

export interface ProjectScopeFlags {
    sash: boolean;
    door: boolean;
    bath1: boolean;
    bath2: boolean;
    tile: boolean;
    wallpaper: boolean;
    flooring: boolean;
    molding: boolean;
    flatCeiling: boolean;
    kitchenSink: boolean;
    balconyPaint: boolean;
    film: boolean;
    builtIn: boolean;
    electrical: boolean;
    entryDoor: boolean;
    insulation: boolean;
    systemAC: boolean;
    expansion: boolean;
}

export interface ProjectDetails {
  area: number; 
  address?: string; 
  requests: string;
  targetDate?: string;
  moveInDate?: string; 
  budget?: number; 
  image: {
    data: string; 
    mimeType: string;
  };
  roomCount?: number;
  bathroomCount?: number;
  floor?: number; 
  
  alreadyExpandedAreas?: string[];
  needsExpansionAreas?: string[];
  
  scopeFlags?: ProjectScopeFlags;
  detailedScope?: DetailedScope;
  itemNotes?: Record<string, string>;

  kitchenSinkSize?: number;
  kitchenSinkGrade?: 'pet' | 'painted';
  systemAcCount?: number;
  windowCount?: number;
  windowGrade?: 'standard' | 'high_end';
  doorCount?: number;

  virtualPlan?: VirtualPlan;
  isometricView?: {
    data: string;
    mimeType: string;
  };
  perspectiveView?: {
    data: string;
    mimeType: string;
  };
  modelType: 'standard' | 'pro';
  isDemo?: boolean;
  projectScope: 'full' | 'bathroom';
  bathroomSpecifics?: BathroomSpecifics;
  wants3DGeneration?: boolean;
}

export interface EstimateItem {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  unitPrice: number;
  totalPrice: number;
  remarks: string;
}

export interface MaterialDetailItem {
  category: string;
  item: string;
  image: string;
  model: string;
  spec: string;
  color: string;
  quantity: string;
  price: number;
  total: number;
  link: string;
  alternatives: string;
  remarks: string;
  qr: string;
}

// NEW: Advanced Material DB Schema
export interface MaterialDatabaseItem {
    id: string;
    category: string; 
    subCategory: string; // e.g. '도기/양변기', '수전/세면'
    grade: 'budget' | 'standard' | 'high_end'; // 등급
    brand?: string; 
    name: string; 
    modelCode?: string; // 모델명
    spec: string; // 규격
    finish?: string; // 마감/컬러 (e.g. 무광니켈)
    installType?: string; // 설치방식 (e.g. 벽걸이, 원홀)
    unit: string; 
    price: number; 
    link?: string; 
    image?: string; 
    laborRef?: string; // 연결된 기본 인건비 (deprecated in favor of workLink)
    
    // NEW: Smart Logic Links
    workLink?: {
        laborType: string; // e.g. '설비공', '타일러'
        autoAddMaterials?: string[]; // 함께 추가되어야 할 부자재 ID 목록
        complexityFactor?: number; // 시공 난이도 할증 (1.0 = standard)
    };
    
    searchKeywords?: string[]; // 검색 키워드
    description?: string;
    lastUpdated: string;
}

export interface PromptSet {
  base: string;
  subTiles: string;
  subFixtures: string;
  views: {
    top: string;
    elevation: string;
    iso: string;
    perspective: string;
  };
  video: string;
}

export interface VerificationChecklist {
  dimensions: {
    confidence: number;
    ceilingHeightChecked: boolean;
    dimensionsInputChecked: boolean;
    specialElementsChecked: boolean;
  };
  rules: {
    barrisolAdded: boolean;
    jollyCutChecked: boolean;
    ventilationHeatingMatched: boolean;
    vanityCoeffApplied: boolean;
    bathtubOptionReflected: boolean;
  };
  quality: {
    warrantyIncluded: boolean;
    inflationApplied: boolean;
    priceRiskWarned: boolean;
  };
  deliverables: {
    estimateExists: boolean;
    materialSheetExists: boolean;
    boardExists: boolean;
    promptsExist: boolean;
    summaryExists: boolean;
  };
}

export interface ProjectPackage {
  folderStructure: string[];
  checklist: VerificationChecklist;
  readme: string;
  sendingRules: string[];
}

export interface MasterTemplate {
  inputSummary: {
    projectName: string;
    clientName: string;
    location: string;
    bathroomType: string;
    styleGrade: string;
    dimensions: string;
    selectedOptions: string;
    confidence: string;
    autoCorrections: {
      inflation: string;
      tileOverage: string;
      exclusions: string;
      waterproofing: string;
    };
    risks: string[];
  };
  areaCalculations: {
    type: string;
    realArea: string;
    overage: string;
    orderArea: string;
    basis: string;
    remarks: string;
  }[];
  materialCosts: {
    category: string;
    item: string;
    spec: string;
    quantity: string;
    price: number;
    total: number;
    remarks: string;
  }[];
  laborCosts: {
    type: string;
    task: string;
    basis: string;
    quantity: number;
    price: number;
    total: number;
    remarks: string;
  }[];
  overheadCosts: {
    item: string;
    basis: string;
    quantity: number;
    price: number;
    total: number;
    remarks: string;
  }[];
  totalSummary: {
    materialTotal: number;
    laborTotal: number;
    overheadTotal: number;
    subTotal: number;
    inflationFactor: number;
    finalTotal: number;
    vatNote: string;
    checklist: string[];
  };
}

export interface SchedulePhase {
  phase: string;
  task: string;
  duration: string;
  startDate: string;
  endDate: string;
}

export interface BudgetAnalysis {
    isOverBudget: boolean;
    statusMessage: string;
    costSavingTips: string[];
}

export interface GeneratedPlan {
  designConcept: {
    title: string;
    description: string;
    keywords: string[];
  };
  costEstimate: EstimateItem[];
  budgetAnalysis?: BudgetAnalysis;
  materialDetailSheet?: MaterialDetailItem[];
  materialBoardPrompts?: PromptSet;
  projectPackage?: ProjectPackage;
  masterTemplate?: MasterTemplate;
  projectSchedule: SchedulePhase[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  correctionNeeded: string;
}

export interface Material {
  id: number;
  category: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
}

export interface Persona {
    id: string;
    name: string;
    description: string;
    tags: string[];
    data: GeneratedPlan;
    createdAt: string;
}

export interface PersonaScenario {
    id: string;
    title: string;
    area: number;
    description: string;
    probability: string;
    keyFeatures: string[];
}

export interface PriceSuggestion {
    id: string;
    type: 'UPDATE' | 'NEW';
    category: string;
    item: string;
    unit: string;
    currentPrice: number;
    suggestedPrice: number;
    reason: string;
    description?: string;
}

export interface UnitPrice {
  category: string;
  item: string;
  unit: string;
  priceLow: number;
  priceStandard: number;
  priceHigh: number;
  description: string;
}

export interface VerifiedContractor {
    id: string;
    name: string; 
    type: string; 
    region: string; 
    contact: string; 
    snsLink?: string; 
    platform?: 'youtube' | 'instagram' | 'blog' | 'website' | 'other' | 'offline';
    description: string; 
    isVerified: boolean; 
    tags: string[];
    career?: string; 
    verificationNote?: string; 
}

export interface LaborSuggestion {
    key: string;
    currentPrice: number;
    suggestedPrice: number;
    reason: string;
}
