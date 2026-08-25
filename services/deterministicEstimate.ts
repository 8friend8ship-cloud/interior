import type { GeneratedPlan, ProjectDetails } from '../types';
import { MOCK_BATHROOM_PLAN, MOCK_GENERATED_PLAN } from '../constants/mockData';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const round1000 = (value: number) => Math.round(value / 1000) * 1000;
const round1 = (value: number) => Math.round(value * 10) / 10;

export function generateDeterministicProjectPlan(details: ProjectDetails): GeneratedPlan {
  const base = clone(details.projectScope === 'bathroom' ? MOCK_BATHROOM_PLAN : MOCK_GENERATED_PLAN);
  const targetPy = Math.max(1, Number(details.area || 1));
  const basePy = details.projectScope === 'bathroom' ? Math.max(1, targetPy) : 32;
  const areaRatio = details.projectScope === 'bathroom' ? 1 : Math.max(0.35, Math.min(3.5, targetPy / basePy));

  base.designConcept.title = `${targetPy}평 ${details.projectScope === 'bathroom' ? '욕실' : '인테리어'} 실행견적 · API-free T2`;
  base.designConcept.description = `PTPL-PAUL-EXPERT-V1 기준 저장 템플릿과 면적·선택 공종을 사용한 결정형 실행견적입니다. 외부 생성형 API 없이 산출되며 현장 실측과 제품 확정 전에는 수량·단가 재검증이 필요합니다.`;
  base.designConcept.keywords = Array.from(new Set([...(base.designConcept.keywords || []), 'API-free', 'BOM', '실행견적']));

  base.costEstimate = base.costEstimate
    .filter((item) => {
      const flags = details.scopeFlags as any;
      const text = `${item.category} ${item.item}`;
      if (flags?.sash === false && /창호|샷시/.test(text)) return false;
      if (flags?.electrical === false && /전기|조명|콘센트/.test(text)) return false;
      if (flags?.wallpaper === false && /도배|벽지/.test(text)) return false;
      if (flags?.flooring === false && /마루|바닥|장판/.test(text)) return false;
      return true;
    })
    .map((item) => {
      const scalable = item.unit === '평' || item.unit === '㎡' || item.unit === 'm2' || item.unit === '식';
      const factor = scalable ? areaRatio : 1;

      // 원본 템플릿의 공종별 기준 물량을 유지한 채 면적비로 스케일한다.
      // 이전 로직처럼 모든 '평' 항목을 targetPy로 덮어쓰면 도배/마루/청소처럼
      // 서로 다른 기준 물량이 동일 수량이 되어 금액과 물량의 역산 근거가 깨진다.
      const quantity = (item.unit === '평' || item.unit === '㎡' || item.unit === 'm2')
        ? Math.max(0.1, round1(Number(item.quantity || 0) * factor))
        : item.quantity;

      const materialCost = round1000(Number(item.materialCost || 0) * factor);
      const laborCost = round1000(Number(item.laborCost || 0) * factor);
      const totalPrice = round1000(Number(item.totalPrice || materialCost + laborCost) * factor);
      return {
        ...item,
        quantity,
        materialCost,
        laborCost,
        totalPrice,
        remarks: `${item.remarks || ''}${item.remarks ? ' · ' : ''}결정형 T2: 기준 32평 템플릿 대비 면적계수 ${areaRatio.toFixed(3)}`,
      };
    });

  const total = base.costEstimate.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const budget = Number((details as any).budget || 0);
  base.budgetAnalysis = {
    isOverBudget: budget > 0 ? total > budget : false,
    statusMessage: budget > 0
      ? (total > budget ? `예상 총액 ${total.toLocaleString()}원으로 입력예산을 초과합니다.` : `예상 총액 ${total.toLocaleString()}원으로 입력예산 범위입니다.`)
      : `예상 총액 ${total.toLocaleString()}원. 현장 실측 후 확정하세요.`,
    costSavingTips: ['동일 규격 자재 묶음 발주', '공종별 실측 후 과다 물량 제거', '선택 공종만 유지하고 제외 공종은 견적에서 분리'],
  };

  base.projectSchedule = base.projectSchedule?.length ? base.projectSchedule : [
    { phase: '1', task: '현장실측·보양·철거', duration: '2~4일', startDate: '', endDate: '' },
    { phase: '2', task: '설비·전기·목공·방수', duration: '5~10일', startDate: '', endDate: '' },
    { phase: '3', task: '타일·도장·도배·바닥', duration: '5~10일', startDate: '', endDate: '' },
    { phase: '4', task: '가구·기구·마감·검수', duration: '3~7일', startDate: '', endDate: '' },
  ];
  base.confidence = 'MEDIUM';
  base.confidenceReason = '저장 템플릿·면적·선택 공종 기반 결정형 산출. API 의존 없음.';
  base.correctionNeeded = '실측 치수, 실제 제품 모델, 현장 난이도, 운반/양중, 폐기물 조건을 최종 견적 전에 확인.';
  return base;
}
