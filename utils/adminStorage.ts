
import { PRICE_TABLE, LABOR_DATA } from '../constants/prices';
import { MOCK_GENERATED_PLAN, MOCK_BATHROOM_PLAN } from '../constants/mockData';
import { GeneratedPlan, Persona, UnitPrice, VerifiedContractor, MaterialDatabaseItem } from '../types';

const PRICES_KEY = 'johnson_admin_prices_v1';
const LABOR_KEY = 'johnson_admin_labor_v1';
const REFERENCES_KEY = 'johnson_admin_references_v1';
const PERSONA_KEY = 'johnson_admin_personas_v1';
const CONTRACTORS_KEY = 'johnson_admin_contractors_v1';
const MATERIALS_KEY = 'johnson_admin_materials_v1'; 

// --- Prices ---
export const getStoredPriceTable = (): UnitPrice[] => {
  try {
    const stored = localStorage.getItem(PRICES_KEY);
    return stored ? JSON.parse(stored) : PRICE_TABLE;
  } catch (e) {
    console.error("Failed to load prices", e);
    return PRICE_TABLE;
  }
};

export const savePriceTable = (prices: UnitPrice[]) => {
  localStorage.setItem(PRICES_KEY, JSON.stringify(prices));
};

// --- Labor ---
export const getStoredLaborData = () => {
  try {
    const stored = localStorage.getItem(LABOR_KEY);
    return stored ? JSON.parse(stored) : LABOR_DATA;
  } catch (e) {
    console.error("Failed to load labor data", e);
    return LABOR_DATA;
  }
};

export const saveLaborData = (laborData: typeof LABOR_DATA) => {
  localStorage.setItem(LABOR_KEY, JSON.stringify(laborData));
};

// --- References ---
const DEFAULT_REFERENCES = `[존슨 지침: 인테리어 표준 시공 가이드라인 (Ver 2.0)]

1. 철거 및 설비 공사
- 욕실 철거: 덧방 시공을 지양하고, 바닥 방수층까지 완전히 걷어내는 '완전 철거'를 원칙으로 한다. (누수 하자 방지)
- 방수: 철거 후 1차 액체 방수(모르타르+방수액) + 2차 도막 방수(고뫄스/아쿠아디펜스)를 필수 시행한다.
- 확장부: 날개벽 철거 시 관리실 도면 확인 및 비내력벽 여부를 필히 확인한다. 확장부는 바닥 엑셀 연장 및 미장 작업을 포함한다.

2. 목공사 및 단열 (고급 시공 포함)
- 문선: 투박한 몰딩을 제거하고 '9mm 문선' 또는 '무문선' 시공을 표준으로 견적한다.
- 천장: 시스템 에어컨 설치 시 단내림 및 간접조명 박스 시공을 포함한다.
- 고급시공(도장): 벽체 도장 마감 시 '석고 2ply' 취부 및 '올퍼티' 작업을 원칙으로 한다.
- 몰딩: 마이너스 몰딩 시공 시 수평 레벨링 및 금속 프로파일 삽입을 견적에 포함한다.
- 단열: 외벽 면은 '아이소핑크 1호' + '우레탄폼 충진' + '이음새 기밀 테이프' 시공을 준수한다. (단순 스티로폼 금지)

3. 타일 공사
- 욕실: 600각 포세린 타일 시공 시 '졸리컷(면치기)' 마감을 기본으로 하며, 타일 평탄 클립(Leveling System)을 반드시 사용한다.
- 주방: 상부장 없는 주방의 경우 타일 마감 높이를 천장까지 올린다.

4. 전기 및 조명
- 배선: 인덕션 단독 배선(4sq) 및 식기세척기 전용 콘센트 증설을 견적에 포함한다.
- 조명: 주조명(방등) 외에 3인치/4인치 매립등(다운라이트) 타공 및 배선 작업을 기본으로 한다. 색온도는 주백색(4000K)을 권장한다.

5. 도배 및 바닥
- 도배: 실크 벽지 시공 시 기존 벽지 제거 후 '부직포 초배' 작업을 필수로 한다. (퍼티 작업 별도 표기)
- 바닥: 강마루 시공 시 친환경 황토 본드 사용을 원칙으로 한다.

6. 기타 마감
- 탄성코트: 발코니는 곰팡이에 강한 바이오 세라믹 탄성코트를 적용한다.
- 필름: 샷시 및 문틀 리폼 시 프라이머 도포 후 시공한다.
`;

export const getStoredReferenceGuidelines = (): string => {
    try {
        const stored = localStorage.getItem(REFERENCES_KEY);
        return stored || DEFAULT_REFERENCES;
    } catch (e) {
        return DEFAULT_REFERENCES;
    }
};

export const saveReferenceGuidelines = (text: string) => {
    localStorage.setItem(REFERENCES_KEY, text);
};

// --- MERGED MATERIAL DATABASE (Basic + Finishes + Hidden Items) ---
// 구조: 0.공통/가설 -> 1.철거 -> 2.목공(기초) -> 3.전기 -> 4.설비 -> 5.욕실/타일(마감) -> 6.바닥/벽(마감) -> 7.가구/기타
const INITIAL_MATERIALS: MaterialDatabaseItem[] = [
    // [0] 공통/가설 (Foundation)
    { id: 'COMMON_01', category: '공통', subCategory: '보양', grade: 'standard', name: '플라베니아(PP보양지)', spec: '900*1800*3T', unit: '장', price: 2500, lastUpdated: '2024-02-01', workLink: { laborType: 'general' } },
    { id: 'COMMON_02', category: '공통', subCategory: '보양', grade: 'standard', name: '텐텐지(바닥보양)', spec: '롤', unit: '롤', price: 15000, lastUpdated: '2024-02-01', workLink: { laborType: 'general' } },
    { id: 'COMMON_03', category: '공통', subCategory: '폐기물', grade: 'standard', name: '폐기물 마대(PP)', spec: '80kg용', unit: '장', price: 500, lastUpdated: '2024-02-01', workLink: { laborType: 'general' } },
    { id: 'COMMON_04', category: '공통', subCategory: '폐기물', grade: 'standard', name: '1톤 트럭 폐기물 처리비', spec: '혼합폐기물', unit: '대', price: 450000, lastUpdated: '2024-02-01', workLink: { laborType: 'general' } },
    { id: 'COMMON_05', category: '공통', subCategory: '양중', grade: 'standard', name: '사다리차 사용료 (1시간)', spec: '10층 이하', unit: '시간', price: 150000, lastUpdated: '2024-02-01', workLink: { laborType: 'general' } },

    // [1] 철거 (Demolition)
    { id: 'DEMO_01', category: '철거', subCategory: '소모품', grade: 'standard', name: '브레이커/컷팅기 소모품', spec: '날/노미', unit: '식', price: 50000, lastUpdated: '2024-02-01', workLink: { laborType: 'demolition' } },

    // [2] 목공/단열 (Carpentry & Insulation - CRITICAL FOR LOGIC)
    { id: 'WOOD_01', category: '목공', subCategory: '자재', grade: 'standard', brand: 'KCC', name: '석고보드(일반)', spec: '9.5T 3x6', unit: '장', price: 3500, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_02', category: '목공', subCategory: '자재', grade: 'standard', brand: 'KCC', name: '석고보드(방수)', spec: '9.5T 3x6', unit: '장', price: 5500, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_03', category: '목공', subCategory: '자재', grade: 'standard', name: '소송 각재(다루끼)', spec: '30*30*3600', unit: '단', price: 30000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_04', category: '목공', subCategory: '자재', grade: 'standard', brand: '영림', name: 'MDF 합판', spec: '9mm 4x8', unit: '장', price: 18000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_05', category: '목공', subCategory: '단열', grade: 'standard', brand: '벽산', name: '아이소핑크 1호', spec: '30T', unit: '장', price: 8000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_06', category: '목공', subCategory: '단열', grade: 'high_end', brand: '벽산', name: '아이소핑크 특호', spec: '50T', unit: '장', price: 12000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_07', category: '목공', subCategory: '부자재', grade: 'standard', name: '우레탄폼 (일회용)', spec: '캔', unit: '통', price: 5000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_08', category: '목공', subCategory: '벽체신설', grade: 'standard', name: '경량철골 스터드(Stud)', spec: '65형', unit: '본', price: 6000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_09', category: '목공', subCategory: '벽체신설', grade: 'standard', name: '경량철골 러너(Runner)', spec: '65형', unit: '본', price: 5000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_member' } },
    { id: 'WOOD_10', category: '목공', subCategory: '몰딩', grade: 'high_end', name: '마이너스 몰딩 프로파일', spec: '알루미늄 3m', unit: '본', price: 15000, lastUpdated: '2024-02-01', workLink: { laborType: 'carpenter_foreman' } },

    // [3] 전기/조명 (Electrical)
    { id: 'ELEC_01', category: '전기', subCategory: '배선기구', grade: 'standard', brand: '르그랑', name: '아펠라 스위치 1구', spec: '화이트', unit: '개', price: 5500, lastUpdated: '2024-02-01', workLink: { laborType: 'electrician' } },
    { id: 'ELEC_02', category: '전기', subCategory: '배선기구', grade: 'standard', brand: '르그랑', name: '아펠라 2구 콘센트', spec: '가로형', unit: '개', price: 6000, lastUpdated: '2024-02-01', workLink: { laborType: 'electrician' } },
    { id: 'ELEC_03', category: '전기', subCategory: '조명', grade: 'standard', brand: '필립스', name: '3인치 COB 다운라이트', spec: '7W 4000K', unit: '개', price: 8500, lastUpdated: '2024-02-01', workLink: { laborType: 'electrician' } },
    { id: 'ELEC_04', category: '전기', subCategory: '조명', grade: 'standard', name: 'T5 간접조명', spec: '1200mm 4000K', unit: '개', price: 7000, lastUpdated: '2024-02-01', workLink: { laborType: 'electrician' } },
    { id: 'ELEC_05', category: '전기', subCategory: '조명', grade: 'high_end', brand: '솔라루체', name: '초슬림 엣지 면조명', spec: '1280*320', unit: '개', price: 45000, lastUpdated: '2024-02-01', workLink: { laborType: 'electrician' } },

    // [4] 설비/방수 (Plumbing)
    { id: 'PLUMB_01', category: '설비', subCategory: '배관', grade: 'standard', name: 'PB 파이프(에이콘)', spec: '15A 롤', unit: '롤', price: 45000, lastUpdated: '2024-02-01', workLink: { laborType: 'plumber' } },
    { id: 'PLUMB_02', category: '설비', subCategory: '환기', grade: 'high_end', brand: '힘펠', name: '제로크 (전동댐퍼 일체형)', spec: 'HV3-80X', unit: '대', price: 45000, lastUpdated: '2024-02-01', workLink: { laborType: 'plumber' } },
    { id: 'PLUMB_03', category: '설비', subCategory: '방수', grade: 'high_end', brand: '마페이', name: '아쿠아디펜스 (도막방수)', spec: '15kg', unit: '통', price: 120000, lastUpdated: '2024-02-01', workLink: { laborType: 'plumber' } },
    { id: 'PLUMB_04', category: '설비', subCategory: '방수', grade: 'standard', brand: '고뫄스', name: '고뫄스 방수재', spec: '18L', unit: '통', price: 45000, lastUpdated: '2024-02-01', workLink: { laborType: 'plumber' } },

    // [5] 욕실 도기 (WC) - Representative SKUs
    { id: 'WC_01', category: '욕실', subCategory: '양변기', grade: 'budget', brand: '대림바스', name: '투피스 양변기 (일반형)', spec: '730*400*700', finish: '화이트', installType: '바닥배수', unit: '대', price: 180000, workLink: { laborType: 'plumber', autoAddMaterials: ['SUB_01', 'SUB_02'] }, searchKeywords: ['저렴한 변기', '일반 변기'], lastUpdated: '2024-02-01' },
    { id: 'WC_02', category: '욕실', subCategory: '양변기', grade: 'standard', brand: '아메리칸스탠다드', name: '웨이브 투피스 (치마형)', spec: '720*390*710', finish: '화이트', installType: '바닥배수', unit: '대', price: 280000, workLink: { laborType: 'plumber', autoAddMaterials: ['SUB_01', 'SUB_02'] }, searchKeywords: ['치마형 변기', '아메스'], lastUpdated: '2024-02-01' },
    { id: 'WC_03', category: '욕실', subCategory: '양변기', grade: 'high_end', brand: '아메리칸스탠다드', name: '아카시아 수퍼플랫 (원피스)', spec: '700*380*600', finish: '화이트', installType: '바닥배수', unit: '대', price: 550000, workLink: { laborType: 'plumber', autoAddMaterials: ['SUB_01', 'SUB_02'] }, searchKeywords: ['고급 변기', '원피스'], lastUpdated: '2024-02-01' },
    { id: 'WC_04', category: '욕실', subCategory: '양변기', grade: 'high_end', brand: 'TOTO', name: '벽걸이 양변기 (시스템)', spec: '매립형', finish: '화이트', installType: '벽배수', unit: '대', price: 1200000, workLink: { laborType: 'plumber', autoAddMaterials: ['매립탱크', '조적젠다이'] }, searchKeywords: ['벽걸이 변기', '호텔식'], lastUpdated: '2024-02-01' },

    // [6] 욕실 세면기 (Basin)
    { id: 'WB_01', category: '욕실', subCategory: '세면기', grade: 'budget', brand: '대림바스', name: '긴다리 세면기', spec: '500*400', finish: '화이트', installType: '바닥배수', unit: '대', price: 80000, workLink: { laborType: 'plumber', autoAddMaterials: ['SUB_02'] }, lastUpdated: '2024-02-01' },
    { id: 'WB_02', category: '욕실', subCategory: '세면기', grade: 'standard', brand: '아메리칸스탠다드', name: '플랫 라운드 (반다리)', spec: '550*460', finish: '화이트', installType: '벽배수', unit: '대', price: 180000, workLink: { laborType: 'plumber', autoAddMaterials: ['SUB_02'] }, lastUpdated: '2024-02-01' },
    { id: 'WB_03', category: '욕실', subCategory: '세면기', grade: 'high_end', brand: '아메리칸스탠다드', name: '아카시아 베셀 (탑볼)', spec: '원형/사각', finish: '화이트', installType: '탑카운터', unit: '대', price: 250000, workLink: { laborType: 'plumber', autoAddMaterials: ['SUB_02', '대리석상판'] }, lastUpdated: '2024-02-01' },

    // [7] 수전 (Faucet)
    { id: 'FC_01', category: '욕실', subCategory: '수전', grade: 'budget', brand: '국산', name: '기본 크롬 세면수전', spec: '원홀', finish: '크롬', unit: '개', price: 45000, workLink: { laborType: 'plumber' }, lastUpdated: '2024-02-01' },
    { id: 'FC_02', category: '욕실', subCategory: '수전', grade: 'standard', brand: '아메리칸스탠다드', name: '큐브 세면수전', spec: '원홀', finish: '크롬', unit: '개', price: 95000, workLink: { laborType: 'plumber' }, lastUpdated: '2024-02-01' },
    { id: 'FC_03', category: '욕실', subCategory: '수전', grade: 'high_end', brand: '더존테크', name: '하프단101 (무광니켈)', spec: '원홀', finish: '무광니켈', unit: '개', price: 140000, workLink: { laborType: 'plumber' }, lastUpdated: '2024-02-01' },
    { id: 'FC_04', category: '욕실', subCategory: '샤워기', grade: 'standard', brand: '아메리칸스탠다드', name: '큐브 선반형 해바라기', spec: '레인샤워', finish: '화이트/크롬', unit: '개', price: 280000, workLink: { laborType: 'plumber' }, lastUpdated: '2024-02-01' },

    // [8] 바닥재 (Flooring)
    { id: 'FL_01', category: '바닥마감', subCategory: '장판', grade: 'budget', brand: 'LX하우시스', name: '뉴청맥 1.8T', spec: '1.8mm', unit: '평', price: 35000, workLink: { laborType: 'flooring' }, lastUpdated: '2024-02-01' },
    { id: 'FL_02', category: '바닥마감', subCategory: '장판', grade: 'standard', brand: 'LX하우시스', name: '지아자연애 2.2T', spec: '2.2mm', unit: '평', price: 55000, workLink: { laborType: 'flooring' }, lastUpdated: '2024-02-01' },
    { id: 'FL_03', category: '바닥마감', subCategory: '마루', grade: 'standard', brand: '구정마루', name: '강마루 (아이보리)', spec: '94*800*7.5', unit: '평', price: 110000, workLink: { laborType: 'flooring', autoAddMaterials: ['마루본드'] }, lastUpdated: '2024-02-01' },
    { id: 'FL_04', category: '바닥마감', subCategory: '마루', grade: 'high_end', brand: '동화자연마루', name: '나투스진 그란데 (광폭)', spec: '325*810*7', unit: '평', price: 135000, workLink: { laborType: 'flooring', autoAddMaterials: ['황토풀'] }, lastUpdated: '2024-02-01' },
    { id: 'FL_05', category: '바닥마감', subCategory: '마루', grade: 'high_end', brand: '구정마루', name: '원목마루 노블레스', spec: '광폭 원목', unit: '평', price: 250000, workLink: { laborType: 'flooring', autoAddMaterials: ['친환경본드'] }, lastUpdated: '2024-02-01' },

    // [9] 벽마감 (Wall)
    { id: 'WP_01', category: '벽마감', subCategory: '도배', grade: 'budget', brand: '신한벽지', name: '광폭 합지', spec: '종이', unit: '롤', price: 20000, workLink: { laborType: 'wallpaper', autoAddMaterials: ['도배풀'] }, lastUpdated: '2024-02-01' },
    { id: 'WP_02', category: '벽마감', subCategory: '도배', grade: 'standard', brand: 'LX하우시스', name: '베스띠 실크벽지', spec: 'PVC코팅', unit: '롤', price: 45000, workLink: { laborType: 'wallpaper', autoAddMaterials: ['부직포', '운용지'] }, lastUpdated: '2024-02-01' },
    { id: 'WP_03', category: '벽마감', subCategory: '도배', grade: 'high_end', brand: 'LX하우시스', name: '디아망 (프리미엄)', spec: '고두께 실크', unit: '롤', price: 75000, workLink: { laborType: 'wallpaper', autoAddMaterials: ['삼중지'] }, lastUpdated: '2024-02-01' },
    { id: 'PT_01', category: '벽마감', subCategory: '도장', grade: 'high_end', brand: '벤자민무어', name: '스커프엑스 (무광)', spec: 'Gallon', unit: '통', price: 140000, workLink: { laborType: 'painter', autoAddMaterials: ['퍼티', '조인트테이프'] }, lastUpdated: '2024-02-01' },

    // [10] 도어/중문 (Door)
    { id: 'DR_01', category: '도어', subCategory: '방문', grade: 'standard', brand: '영림', name: 'ABS 도어 (민무늬)', spec: 'YA-001', unit: '짝', price: 180000, workLink: { laborType: 'carpenter_member', autoAddMaterials: ['손잡이', '경첩'] }, lastUpdated: '2024-02-01' },
    { id: 'DR_02', category: '도어', subCategory: '중문', grade: 'standard', brand: '예림', name: '3연동 슬림 중문', spec: '초슬림', unit: '식', price: 900000, workLink: { laborType: 'carpenter_member' }, lastUpdated: '2024-02-01' },
    { id: 'DR_03', category: '도어', subCategory: '터닝', grade: 'standard', brand: 'LX하우시스', name: '파워세이브 터닝도어', spec: '단열도어', unit: '틀', price: 650000, workLink: { laborType: 'carpenter_member' }, lastUpdated: '2024-02-01' },

    // [11] 주방/가구 (Kitchen)
    { id: 'KIT_01', category: '가구', subCategory: '싱크대', grade: 'budget', brand: '사제', name: 'LPM 하이그로시 싱크대', spec: '기본형', unit: 'm', price: 350000, workLink: { laborType: 'carpenter_member' }, lastUpdated: '2024-02-01' },
    { id: 'KIT_02', category: '가구', subCategory: '싱크대', grade: 'standard', brand: '사제', name: 'PET 무광 싱크대 (E0)', spec: '사각볼포함', unit: 'm', price: 550000, workLink: { laborType: 'carpenter_member' }, lastUpdated: '2024-02-01' },
    { id: 'KIT_03', category: '가구', subCategory: '후드', grade: 'standard', brand: '하츠', name: '슬림루나 후드', spec: '900', unit: '대', price: 280000, workLink: { laborType: 'none' }, lastUpdated: '2024-02-01' },
    { id: 'KIT_04', category: '가구', subCategory: '수전', grade: 'standard', brand: '백조', name: '거위목 수전', spec: '무광', unit: '개', price: 120000, workLink: { laborType: 'none' }, lastUpdated: '2024-02-01' },

    // [12] 히든 아이템 (Hidden - Auto Add)
    { id: 'SUB_01', category: '부자재', subCategory: '설비', grade: 'standard', name: '양변기 정심/편심', spec: '표준', unit: '개', price: 5000, lastUpdated: '2024-02-01', workLink: { laborType: 'none' } },
    { id: 'SUB_02', category: '부자재', subCategory: '설비', grade: 'standard', name: '고압호스/앵글밸브', spec: '세트', unit: '조', price: 8000, lastUpdated: '2024-02-01', workLink: { laborType: 'none' } },
    { id: 'SUB_03', category: '부자재', subCategory: '타일', grade: 'high_end', name: '아덱스 X18 (고성능 접착제)', spec: '15kg', unit: '포', price: 28000, lastUpdated: '2024-02-01', workLink: { laborType: 'none' } },
    { id: 'SUB_04', category: '부자재', subCategory: '타일', grade: 'high_end', name: '케라폭시 (에폭시 줄눈)', spec: '3kg', unit: '통', price: 90000, lastUpdated: '2024-02-01', workLink: { laborType: 'none' } },
    { id: 'SUB_05', category: '부자재', subCategory: '목공', grade: 'standard', name: 'USG 종이 코너비드', spec: '2.4m', unit: '개', price: 4000, lastUpdated: '2024-02-01', workLink: { laborType: 'none' } },
];

export const getStoredMaterials = (): MaterialDatabaseItem[] => {
    try {
        const stored = localStorage.getItem(MATERIALS_KEY);
        return stored ? JSON.parse(stored) : INITIAL_MATERIALS;
    } catch (e) {
        return INITIAL_MATERIALS;
    }
};

export const saveMaterials = (materials: MaterialDatabaseItem[]) => {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
};

// ... (Rest of the file remains same: Personas, Contractors)
export const getStoredPersonas = (): Persona[] => {
    try {
        const stored = localStorage.getItem(PERSONA_KEY);
        if (stored) return JSON.parse(stored);
        
        const defaultPersona: Persona = {
            id: 'default_full_32py',
            name: '기본 데모: 32평형 전체 인테리어',
            description: '존슨 가이드라인의 기본 데모 데이터입니다.',
            tags: ['32py', 'Standard', 'Demo'],
            data: MOCK_GENERATED_PLAN,
            createdAt: new Date().toISOString()
        };
        return [defaultPersona];
    } catch (e) {
        console.error("Failed to load personas", e);
        return [];
    }
};

export const savePersonas = (personas: Persona[]) => {
    localStorage.setItem(PERSONA_KEY, JSON.stringify(personas));
};

export const addPersona = (persona: Persona) => {
    const current = getStoredPersonas();
    const existingIndex = current.findIndex(p => p.id === persona.id || p.name === persona.name);
    
    if (existingIndex >= 0) {
        current[existingIndex] = persona;
    } else {
        current.push(persona);
    }
    savePersonas(current);
};

export const deletePersona = (id: string) => {
    const current = getStoredPersonas();
    const filtered = current.filter(p => p.id !== id);
    savePersonas(filtered);
};

// --- Verified Contractor Management ---
const INITIAL_CONTRACTORS: VerifiedContractor[] = [
    {
        id: 'c1',
        name: '김목수 TV',
        type: '목공',
        region: '서울/경기',
        contact: '010-1234-5678',
        snsLink: 'https://youtube.com/@carpenter_kim',
        platform: 'youtube',
        description: '30년 경력 내장목공 전문, 9mm 문선 장인',
        isVerified: true,
        tags: ['목공', '단열', '가벽'],
        career: '30년',
        verificationNote: '유튜브 채널 운영중, 시공 디테일 우수'
    },
    {
        id: 'c2',
        name: '박반장 타일팀',
        type: '타일 시공',
        region: '서울 강남/서초',
        contact: '010-9876-5432',
        platform: 'offline', // No SNS
        description: 'SNS는 안하지만 강남권 인테리어 실장님들이 줄서서 기다리는 타일팀',
        isVerified: true,
        tags: ['졸리컷', '대형타일', '오프라인고수'],
        career: '25년',
        verificationNote: '2024년 1월 반포 래미안 현장 실사 완료. 졸리컷 마감 품질 최상급 확인.'
    }
];

export const getStoredContractors = (): VerifiedContractor[] => {
    try {
        const stored = localStorage.getItem(CONTRACTORS_KEY);
        return stored ? JSON.parse(stored) : INITIAL_CONTRACTORS;
    } catch (e) {
        return INITIAL_CONTRACTORS;
    }
};

export const saveContractors = (contractors: VerifiedContractor[]) => {
    localStorage.setItem(CONTRACTORS_KEY, JSON.stringify(contractors));
};

export const getStoredDemoTemplate = (type: 'full' | 'bathroom'): GeneratedPlan => {
    const personas = getStoredPersonas();
    if (type === 'bathroom') return MOCK_BATHROOM_PLAN; 
    return personas[0]?.data || MOCK_GENERATED_PLAN;
};

export const saveDemoTemplate = (type: 'full' | 'bathroom', plan: GeneratedPlan) => {
    console.warn("saveDemoTemplate is deprecated. Use addPersona instead.");
};

export const resetAdminSettings = () => {
  localStorage.removeItem(PRICES_KEY);
  localStorage.removeItem(LABOR_KEY);
  localStorage.removeItem(REFERENCES_KEY);
  localStorage.removeItem(PERSONA_KEY);
  localStorage.removeItem(CONTRACTORS_KEY);
  localStorage.removeItem(MATERIALS_KEY);
};
