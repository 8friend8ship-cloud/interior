import React from 'react';
import {
  EstimateBuildingUse,
  EstimateMarketplaceContext,
  EstimatePlanTier,
  EstimateProjectDomain,
  EstimateTemplateMode,
  EstimateUserRole,
} from '../contracts/estimateMarketplace';
import { normalizeRoleTier } from '../services/estimateMarketplace';

interface EstimateMarketplaceModeProps {
  value: EstimateMarketplaceContext;
  onChange: (context: EstimateMarketplaceContext) => void;
}

const roleCopy: Record<EstimateUserRole, { title: string; description: string }> = {
  CONSUMER: { title: '견적이 필요해요', description: '예산 확인·업체 비교·자재 선택에 필요한 견적을 확인합니다.' },
  SUPPLIER: { title: '견적을 제공하는 업체예요', description: '표준 견적부터 업체 전용 단가·양식까지 관리합니다.' },
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
    const unsafeInternal = role === 'CONSUMER' && next.templateMode === 'HOMEDESIGN_COST_MARGIN';
    onChange(unsafeInternal ? {
      ...next,
      templateMode: next.tier === 'PRO' ? 'GENOVY_DETAIL' : 'HOMEDESIGN_SIMPLE',
      templateVersion: templateVersionFor(next.tier === 'PRO' ? 'GENOVY_DETAIL' : 'HOMEDESIGN_SIMPLE'),
      templateScope: next.tier === 'PRO' ? 'PROJECT' : 'GENERAL',
    } : next);
  };

  const setDomain = (projectDomain: EstimateProjectDomain) => {
    const option = domainOptions.find((item) => item.value === projectDomain);
    onChange({ ...value, projectDomain, buildingUse: option?.defaultUse || value.buildingUse || 'OTHER' });
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
    onChange({ ...next, templateMode: safeMode, templateId: safeMode, templateVersion: templateVersionFor(safeMode), templateScope: 'PROJECT' });
  };

  const setTemplate = (mode: EstimateTemplateMode) => {
    if (value.tier !== 'PRO') return;
    if (mode === 'HOMEDESIGN_COST_MARGIN' && value.userRole === 'CONSUMER') return;
    if (mode === 'USER_CUSTOM' && !value.userProfileId) return;
    onChange({ ...value, templateMode: mode, templateId: mode, templateVersion: templateVersionFor(mode), templateScope: mode === 'USER_CUSTOM' || mode === 'HOMEDESIGN_COST_MARGIN' ? 'USER' : 'PROJECT' });
  };

  return (
    <section className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">견적 설정</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">내 상황에 맞는 견적을 선택하세요</h2>
        <p className="mt-1 text-sm text-gray-500">무료는 공용 Standard가 자동 적용됩니다. 필요한 경우에만 PRO 개인화를 선택하세요.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(['CONSUMER', 'SUPPLIER'] as EstimateUserRole[]).map((role) => {
          const active = value.userRole === role;
          return <button key={role} type="button" onClick={() => setRole(role)} className={`rounded-xl border p-4 text-left transition ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
            <div className="font-semibold text-gray-900">{roleCopy[role].title}</div><div className="mt-1 text-sm text-gray-500">{roleCopy[role].description}</div>
          </button>;
        })}
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">프로젝트 종류</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {domainOptions.map((option) => {
            const active = (value.projectDomain || 'RESIDENTIAL_INTERIOR') === option.value;
            return <button key={option.value} type="button" onClick={() => setDomain(option.value)} className={`rounded-xl border p-4 text-left transition ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
              <div className="font-semibold text-gray-900">{option.title}</div><div className="mt-1 text-sm text-gray-500">{option.description}</div>
            </button>;
          })}
        </div>

        <label className="mt-4 block text-sm font-semibold text-gray-800" htmlFor="estimate-building-use">건물 · 영업 용도</label>
        <select id="estimate-building-use" value={value.buildingUse || 'RESIDENTIAL'} onChange={(event) => onChange({ ...value, buildingUse: event.target.value as EstimateBuildingUse })} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-indigo-400">
          {buildingUseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        {value.projectDomain && value.projectDomain !== 'RESIDENTIAL_INTERIOR' && <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
          이 유형은 주거 단가를 그대로 적용하지 않습니다. 검증된 해당 유형의 자재·노무·경비만 반영하고, 근거가 부족한 항목은 확인 필요로 표시합니다.
        </div>}
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">견적 방식</p><h3 className="mt-1 font-bold text-gray-900">{value.tier === 'FREE' ? '무료 Standard 견적' : 'PRO 개인화 견적'}</h3></div>
          <div className="flex gap-2">{(['FREE', 'PRO'] as EstimatePlanTier[]).map((tier) => <button key={tier} type="button" onClick={() => setTier(tier)} className={`rounded-full px-4 py-2 text-sm font-semibold ${value.tier === tier ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{tier === 'FREE' ? '무료' : 'PRO'}</button>)}</div>
        </div>

        {value.tier === 'FREE' ? <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="font-semibold text-emerald-900">Standard 자동 적용</div>
          <div className="mt-1 text-sm text-emerald-800">검증된 공용 자재·인건비·경비만 사용합니다. 미검증 항목은 임의 가격을 만들지 않습니다.</div>
        </div> : <div className="mt-4 grid gap-3 md:grid-cols-2">
          {templateOptions.map((option) => {
            const blockedByRole = Boolean(option.supplierOnly && value.userRole !== 'SUPPLIER');
            const blockedByProfile = option.mode === 'USER_CUSTOM' && !value.userProfileId;
            const disabled = blockedByRole || blockedByProfile;
            const active = value.templateMode === option.mode;
            return <button key={option.mode} type="button" disabled={disabled} onClick={() => setTemplate(option.mode)} className={`rounded-xl border p-4 text-left transition ${active ? 'border-indigo-500 bg-indigo-50' : disabled ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-55' : 'border-gray-200 hover:border-indigo-200'}`}>
              <div className="font-semibold text-gray-900">{option.title}</div><div className="mt-1 text-sm text-gray-500">{option.description}</div>
              {blockedByProfile && <div className="mt-2 text-xs text-amber-700">내 견적 프로필 등록 후 사용 가능</div>}{blockedByRole && <div className="mt-2 text-xs text-amber-700">업체 내부용</div>}
            </button>;
          })}
        </div>}
      </div>
    </section>
  );
};
