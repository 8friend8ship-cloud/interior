import React from 'react';
import {
  EstimateBuildingUse,
  EstimateMarketplaceContext,
  EstimatePlanTier,
  EstimateProjectDomain,
  EstimateTemplateMode,
  EstimateUserRole,
  ConsumerQuoteMode,
  SupplierMode,
} from '../contracts/estimateMarketplace';
import { normalizeRoleTier } from '../services/estimateMarketplace';

interface EstimateMarketplaceModeProps {
  value: EstimateMarketplaceContext;
  onChange: (context: EstimateMarketplaceContext) => void;
}

const roleCopy: Record<EstimateUserRole, { title: string; description: string }> = {
  CONSUMER: { title: '견적이 필요해요', description: '예산 확인·업체 비교·입찰에 필요한 견적을 확인합니다.' },
  SUPPLIER: { title: '견적을 제공하는 업체예요', description: '입찰 등록·자동견적·업체 전용 플랫폼을 사용합니다.' },
};

const domainOptions: Array<{ value: EstimateProjectDomain; title: string; description: string; defaultUse: EstimateBuildingUse }> = [
  { value: 'RESIDENTIAL_INTERIOR', title: '주거 인테리어', description: '아파트 · 주택 · 빌라 · 오피스텔', defaultUse: 'RESIDENTIAL' },
  { value: 'COMMERCIAL_INTERIOR', title: '상업 인테리어', description: '사무실 · 매장 · F&B · 의료 · 교육 · 숙박', defaultUse: 'RETAIL' },
  { value: 'ARCHITECTURE_BUILD', title: '건축 · 신축', description: '가설 · 토공 · 구조 · 외장 · 설비 · 소방 · 외부공사', defaultUse: 'RESIDENTIAL' },
  { value: 'RENOVATION_REMODEL', title: '리모델링 · 대수선', description: '선택철거 · 구조보강 · 외피 · 설비이설 · 적합성 개선', defaultUse: 'RESIDENTIAL' },
];

const buildingUseOptions: Array<{ value: EstimateBuildingUse; label: string }> = [
  { value: 'RESIDENTIAL', label: '주거' }, { value: 'OFFICE', label: '사무실' }, { value: 'RETAIL', label: '매장' },
  { value: 'FNB', label: 'F&B / 음식점' }, { value: 'MEDICAL', label: '의료' }, { value: 'EDUCATION', label: '교육' },
  { value: 'HOSPITALITY', label: '숙박' }, { value: 'WAREHOUSE', label: '창고 · 물류' }, { value: 'OTHER', label: '기타' },
];

const consumerModes: Array<{ value: ConsumerQuoteMode; title: string; description: string }> = [
  { value: 'SIMPLE', title: '간단 견적', description: '예산과 주요 공종을 빠르게 확인' },
  { value: 'COMPARE', title: '비교 견적', description: '같은 기준으로 여러 업체 견적을 비교' },
  { value: 'TENDER', title: '입찰용 견적', description: 'BOQ·공정표·도면·투시도 등 입찰 패키지 기준' },
];

const supplierModes: Array<{ value: SupplierMode; title: string; description: string }> = [
  { value: 'REGISTER_BID', title: '입찰 등록', description: '표준 양식으로 고객 요청에 견적 제출' },
  { value: 'AUTOMATION', title: '견적 자동화', description: '업체 단가·인건비·경비·양식으로 자동 산출' },
  { value: 'PLATFORM', title: '업체 전용 플랫폼', description: '견적·공정·자재·렌더·발행을 통합 관리' },
];

const templateOptions: Array<{ mode: EstimateTemplateMode; title: string; description: string; supplierOnly?: boolean }> = [
  { mode: 'GENOVY_DETAIL', title: '상세 견적', description: '세부공종·사양·산출근거·옵션·공정까지 표시' },
  { mode: 'HOMEDESIGN_COST_MARGIN', title: '업체 원가·마진', description: '공급자 내부 실행원가·마진 관리용', supplierOnly: true },
  { mode: 'USER_CUSTOM', title: '내 견적서', description: '내 단가·인건비·경비·양식을 적용한 전용 견적' },
];

const templateVersionFor = (mode: EstimateTemplateMode) => {
  switch (mode) {
    case 'GENOVY_DETAIL': return 'T2-INTERIOR-GENOVY-v0.3';
    case 'HOMEDESIGN_COST_MARGIN': return 'T1-INTERIOR-GENOVY-v0.3';
    case 'USER_CUSTOM': return 'USER_CUSTOM_PENDING_PROFILE';
    default: return 'INTERIOR_MARKETPLACE_V1_20260825';
  }
};

export const EstimateMarketplaceMode: React.FC<EstimateMarketplaceModeProps> = ({ value, onChange }) => {
  const setRole = (role: EstimateUserRole) => {
    const next = normalizeRoleTier(role, value.tier, value);
    const safe = role === 'CONSUMER' && next.templateMode === 'HOMEDESIGN_COST_MARGIN'
      ? { ...next, templateMode: next.tier === 'PRO' ? 'GENOVY_DETAIL' as const : 'HOMEDESIGN_SIMPLE' as const }
      : next;
    onChange({
      ...safe,
      consumerMode: role === 'CONSUMER' ? (safe.consumerMode || 'SIMPLE') : undefined,
      supplierMode: role === 'SUPPLIER' ? (safe.supplierMode || 'REGISTER_BID') : undefined,
      templateVersion: templateVersionFor(safe.templateMode || 'HOMEDESIGN_SIMPLE'),
    });
  };

  const setTier = (tier: EstimatePlanTier) => {
    const next = normalizeRoleTier(value.userRole, tier, value);
    if (tier === 'FREE') {
      onChange({ ...next, templateMode: 'HOMEDESIGN_SIMPLE', templateId: 'HOMEDESIGN_SIMPLE', templateVersion: templateVersionFor('HOMEDESIGN_SIMPLE'), templateScope: 'GENERAL' });
      return;
    }
    const safeMode = value.userRole === 'CONSUMER' && value.templateMode === 'HOMEDESIGN_COST_MARGIN'
      ? 'GENOVY_DETAIL'
      : (value.templateMode === 'HOMEDESIGN_SIMPLE' ? 'GENOVY_DETAIL' : value.templateMode);
    onChange({ ...next, templateMode: safeMode, templateId: safeMode, templateVersion: templateVersionFor(safeMode || 'GENOVY_DETAIL'), templateScope: 'PROJECT' });
  };

  const setTemplate = (mode: EstimateTemplateMode) => {
    if (value.tier !== 'PRO') return;
    if (mode === 'HOMEDESIGN_COST_MARGIN' && value.userRole === 'CONSUMER') return;
    if (mode === 'USER_CUSTOM' && !value.userProfileId) return;
    onChange({ ...value, templateMode: mode, templateId: mode, templateVersion: templateVersionFor(mode), templateScope: mode === 'USER_CUSTOM' || mode === 'HOMEDESIGN_COST_MARGIN' ? 'USER' : 'PROJECT' });
  };

  return (
    <section className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">견적 설정</p>
      <h2 className="mt-1 text-xl font-bold text-gray-900">내 상황에 맞는 견적을 선택하세요</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(['CONSUMER', 'SUPPLIER'] as EstimateUserRole[]).map((role) => <button key={role} type="button" onClick={() => setRole(role)} className={`rounded-xl border p-4 text-left ${value.userRole === role ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}><div className="font-semibold">{roleCopy[role].title}</div><div className="mt-1 text-sm text-gray-500">{roleCopy[role].description}</div></button>)}
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">사용 목적</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {value.userRole === 'CONSUMER' ? consumerModes.map((m) => <button key={m.value} type="button" onClick={() => onChange({ ...value, consumerMode: m.value })} className={`rounded-xl border p-4 text-left ${value.consumerMode === m.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}><div className="font-semibold">{m.title}</div><div className="mt-1 text-xs text-gray-500">{m.description}</div></button>) : supplierModes.map((m) => <button key={m.value} type="button" onClick={() => onChange({ ...value, supplierMode: m.value })} className={`rounded-xl border p-4 text-left ${value.supplierMode === m.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}><div className="font-semibold">{m.title}</div><div className="mt-1 text-xs text-gray-500">{m.description}</div></button>)}
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">프로젝트 종류</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {domainOptions.map((option) => <button key={option.value} type="button" onClick={() => onChange({ ...value, projectDomain: option.value, buildingUse: option.defaultUse })} className={`rounded-xl border p-4 text-left ${value.projectDomain === option.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}><div className="font-semibold">{option.title}</div><div className="mt-1 text-sm text-gray-500">{option.description}</div></button>)}
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="estimate-building-use">건물 · 영업 용도</label>
        <select id="estimate-building-use" value={value.buildingUse || 'RESIDENTIAL'} onChange={(e) => onChange({ ...value, buildingUse: e.target.value as EstimateBuildingUse })} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm">{buildingUseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between"><h3 className="font-bold">{value.tier === 'FREE' ? '무료 Standard 견적' : 'PRO 개인화 견적'}</h3><div className="flex gap-2">{(['FREE','PRO'] as EstimatePlanTier[]).map((tier) => <button key={tier} type="button" onClick={() => setTier(tier)} className={`rounded-full px-4 py-2 text-sm font-semibold ${value.tier === tier ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{tier === 'FREE' ? '무료' : 'PRO'}</button>)}</div></div>
        {value.tier === 'PRO' && <div className="mt-4 grid gap-3 md:grid-cols-2">{templateOptions.map((option) => { const disabled = Boolean((option.supplierOnly && value.userRole !== 'SUPPLIER') || (option.mode === 'USER_CUSTOM' && !value.userProfileId)); return <button key={option.mode} type="button" disabled={disabled} onClick={() => setTemplate(option.mode)} className={`rounded-xl border p-4 text-left ${value.templateMode === option.mode ? 'border-indigo-500 bg-indigo-50' : disabled ? 'cursor-not-allowed bg-gray-50 opacity-55' : 'border-gray-200'}`}><div className="font-semibold">{option.title}</div><div className="mt-1 text-sm text-gray-500">{option.description}</div>{option.supplierOnly && value.userRole !== 'SUPPLIER' && <div className="mt-2 text-xs text-amber-700">업체 내부용</div>}</button>; })}</div>}
      </div>
    </section>
  );
};
