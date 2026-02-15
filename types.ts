
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
  type: 'overlay' | 'demolition'; // 덧방 vs 철거후방수
  tileGrade: 'standard' | 'high_end'; // 300x600 vs 600각 포세린
  ceilingType: 'smc' | 'barrisol' | 'paint'; // 존슨 지침: 천장 마감
  isJollyCut: boolean; // 존슨 지침: 졸리컷 유무
  // UPDATED: Wet Zone Configuration
  wetZoneMethod: 'bathtub' | 'partition' | 'booth' | 'tile_wall' | 'none'; 
  vanityCount: number; // 존슨 지침: 세면대 개수 계수 (PART 2 반영)
  cabinetType?: 'sliding' | 'standard' | 'flap'; // 상부장 타입
  hasGendai: boolean;
  replaceDoor?: boolean;
  removeRadiator?: boolean;
  width?: number; // 가로 (m)
  depth?: number; // 세로 (m)
  height?: number; // 높이 (m)
  useDimensionsOnly?: boolean; // 도면 없이 치수로만 진행 여부
}

// Detailed Scope Flags
export interface DetailedScope {
    tile: {
        kitchen: boolean;
        entrance: boolean;
        balcony: boolean;
    };
    wallpaper: 'all_silk' | 'all_paper' | 'combo'; 
    
    // UPDATED: Flooring Details
    flooring: {
        layout: 'all_maru' | 'all_jangpan' | 'all_tile' | 'mix_tile_maru' | 'mix_maru_jangpan';
        specs: {
            maru: 'gang' | 'texture'; // 강마루, 광폭텍스쳐
            jangpan: '1.8' | '2.2' | '5.0'; // 두께
            tile: '600' | '800'; // 타일 크기
        }
    };

    sash: 'all' | 'partial';
    sashCondition?: string;
    
    door: {
        mode: 'replace_all' | 'replace_door_film_frame' | 'film_both' | 'paint_both';
    };

    // NEW: Carpentry Details
    molding?: {
        type: 'minus' | 'flat' | 'crown'; // 마이너스/평몰딩/갈매기
    };

    // NEW: Entry Door Details
    entryDoor?: {
        type: '3yeondong' | 'swing' | 'onesliding';
    };

    // NEW: Insulation Details
    insulation?: {
        area: string; // 단열 위치 직접 입력
    };

    paint: {
        balconyType: 'ceramic' | 'water';
        livingWall: boolean;
        ceiling: boolean;
        whole: boolean;
    };

    film: {
        doors: boolean; // 기본 문틀/샷시
        doorsCount?: number; // 문틀/샷시 개수
        builtIn: boolean; // 붙박이장
        builtInCount?: number; // 붙박이장 개수
        sink: boolean; // 싱크대
        sinkSize?: number; // 싱크대 길이 (m)
        entrance: boolean; // 현관문
        walls?: string; // 벽체/특이사항
    };

    // NEW: Administrative & Prep Work
    admin: {
        permit: boolean; // 행위허가 (확장시 필수)
        consent: boolean; // 입주민 동의서
        protection: boolean; // 엘리베이터 보양
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
  area: number; // Always converted to Pyung internally
  address?: string; // Construction Address
  requests: string;
  targetDate?: string;
  moveInDate?: string; // Expected Move-in Date
  budget?: number; // User defined budget (Unit: 10,000 KRW)
  image: {
    data: string; // base64
    mimeType: string;
  };
  roomCount?: number;
  bathroomCount?: number;
  
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

// NEW: Budget Analysis Interface
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
  
  // NEW: Budget Analysis Result
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

// NEW: Price Update Suggestion for Admin
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
