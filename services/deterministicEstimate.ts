import type { GeneratedPlan, ProjectDetails } from '../types';
import { MOCK_BATHROOM_PLAN, MOCK_GENERATED_PLAN } from '../constants/mockData';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Safe fallback only.
 *
 * This function MUST NOT create a priced estimate from the small local
 * PRICE_TABLE / MATERIALS / LABOR samples or by scaling a 32-pyeong mock.
 * A priced detailed estimate is valid only after the live backdata path has
 * produced a verified project BOM/takeoff (Queens→Seed→Python/plan QA→T1→T2).
 */
export function generateDeterministicProjectPlan(details: ProjectDetails): GeneratedPlan {
  const base = clone(details.projectScope === 'bathroom' ? MOCK_BATHROOM_PLAN : MOCK_GENERATED_PLAN);
  const targetPy = Math.max(1, Number(details.area || 1));

  base.designConcept.title = `${targetPy}평 ${details.projectScope === 'bathroom' ? '욕실' : '인테리어'} 견적 준비 · VERIFIED BOM REQUIRED`;
  base.designConcept.description = [
    '현재 화면은 안전 fallback입니다.',
    '실제 상세견적은 도면/실측→공간·면적·길이→공종→주자재·부자재·소모품→로스·운반·폐기→노무·생산성까지 전체 BOM을 산출하고',
    'Queens/Seed의 검증된 단가·제품·링크·가격시점과 대조한 뒤 T1/T2로 생성해야 합니다.',
    '일부 로컬 샘플 단가나 32평 기준 견적의 면적배율로 가격을 생성하지 않습니다.'
  ].join(' ');
  base.designConcept.keywords = ['VERIFIED-BOM', 'PLAN-TAKEOFF', 'QUEENS-SEED', 'FAIL-CLOSED'];

  // Critical safety gate: do not expose mock/sample prices as a real estimate.
  base.costEstimate = [];
  base.materialDetailSheet = [];
  base.projectSchedule = [];
  base.budgetAnalysis = {
    isOverBudget: false,
    statusMessage: '검증된 전체 BOM/단가 백데이터가 아직 연결되지 않아 금액 산출을 보류했습니다.',
    costSavingTips: [
      '도면/실측 기준 물량산출 완료',
      '주자재+부자재+소모품 전체 BOM 생성',
      '현재 단가·제품링크·노무 생산성 검증 후 견적 생성'
    ],
  };
  base.confidence = 'LOW';
  base.confidenceReason = 'VERIFIED_PROJECT_BOM_NOT_AVAILABLE_ON_FALLBACK';
  base.correctionNeeded = [
    'Queens MATERIAL_MASTER 및 BOM_RELATION 조회',
    'Python/도면 대조 TAKEOFF 검증',
    'Seed 정규화된 MATERIAL/LABOR/RATE 적용',
    'T1 내부견적→CLIENT_SAFE T2 생성',
    '사용자/프로젝트 전용 설정과 USER_CUSTOM 템플릿 반영'
  ].join(' → ');
  return base;
}
