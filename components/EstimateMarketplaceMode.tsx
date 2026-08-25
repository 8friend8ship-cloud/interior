import React from 'react';
import {
  EstimateMarketplaceContext,
  EstimatePlanTier,
  EstimateTemplateMode,
  EstimateUserRole,
} from '../contracts/estimateMarketplace';
import { normalizeRoleTier } from '../services/estimateMarketplace';

interface EstimateMarketplaceModeProps {
  value: EstimateMarketplaceContext;
  onChange: (context: EstimateMarketplaceContext) => void;
}

const roleCopy: Record<EstimateUserRole, { title: string; description: string }> = {
  CONSUMER: {
    title: '견적이 필요해요',
    description: '간단 견적부터 실제 업체 비교·입찰용 심화 견적까지',
  },
  SUPPLIER: {
    title: '견적을 제공하는 업체예요',
    description: '업체 등록·입찰 참가부터 자동견적·전용 앱까지',
  },
};

const templateOptions: Array<{
  mode: EstimateTemplateMode;
  title: string;
  description: string;
  proOnly?: boolean;
  supplierOnly?: boolean;
}> = [
  {
    mode: 'HOMEDESIGN_SIMPLE',
    title: '홈디자인 간략',
    description: '소비자용 기본 견적 · 공종/수량/단가 중심',
  },
  {
    mode: 'GENOVY_DETAIL',
    title: '제노비 상세',
    description: '세부공종·사양·산출근거·옵션·공정까지 상세 표시',
    proOnly: true,
  },
  {
    mode: 'HOMEDESIGN_COST_MARGIN',
    title: '홈디자인 원가·마진',
    description: '공급자 내부 실행원가·마진 관리용',
    proOnly: true,
    supplierOnly: true,
  },
  {
    mode: 'USER_CUSTOM',
    title: '사용자 커스텀',
    description: '등록된 사용자 전용 견적 양식/버전 사용',
    proOnly: true,
  },
];

const featureCopy = (context: EstimateMarketplaceContext) => {
  if (context.userRole === 'CONSUMER' && context.tier === 'FREE') {
    return '무료 · 단순 예상견적 · 공종 기본계산 · 제품/자재 링크 · 표준 견적양식';
  }
  if (context.userRole === 'CONSUMER') {
    return '유료 · 업체 비교견적 · 심화견적 · 물량산출 · 마감표 · 공정표 · 도면/투시도/영상 · 입찰팩';
  }
  if (context.tier === 'FREE') {
    return '무료 · 공급자 등록 · 입찰 참가 · 표준 템플릿 · 고객 견적의뢰 양식 배포/수신';
  }
  return '유료 · 고객요청 자동접수 · 자동견적 · 물량산출 · 마감표 · 공정표 · 투시도/영상 · 전용앱/발행';
};

const templateVersionFor = (mode: EstimateTemplateMode) => {
  switch (mode) {
    case 'GENOVY_DETAIL':
      return 'T2-INTERIOR-GENOVY-v0.3';
    case 'HOMEDESIGN_COST_MARGIN':
      return 'T1-INTERIOR-GENOVY-v0.3';
    case 'USER_CUSTOM':
      return 'USER_CUSTOM_PENDING_PROFILE';
    default:
      return 'INTERIOR_MARKETPLACE_V1_20260825';
  }
};

export const EstimateMarketplaceMode: React.FC<EstimateMarketplaceModeProps> = ({ value, onChange }) => {
  const setRole = (role: EstimateUserRole) => {
    const next = normalizeRoleTier(role, value.tier, value);
    const unsafeInternal = next.userRole === 'CONSUMER' && next.templateMode === 'HOMEDESIGN_COST_MARGIN';
    onChange(
      unsafeInternal
        ? {
            ...next,
            templateMode: next.tier === 'PRO' ? 'GENOVY_DETAIL' : 'HOMEDESIGN_SIMPLE',
            templateVersion: next.tier === 'PRO' ? templateVersionFor('GENOVY_DETAIL') : templateVersionFor('HOMEDESIGN_SIMPLE'),
            templateScope: next.tier === 'PRO' ? 'PROJECT' : 'GENERAL',
          }
        : next,
    );
  };

  const setTier = (tier: EstimatePlanTier) => {
    const next = normalizeRoleTier(value.userRole, tier, value);
    if (tier === 'FREE') {
      onChange({
        ...next,
        templateMode: 'HOMEDESIGN_SIMPLE',
        templateVersion: templateVersionFor('HOMEDESIGN_SIMPLE'),
        templateScope: 'GENERAL',
      });
      return;
    }
    onChange(next);
  };

  const setTemplate = (mode: EstimateTemplateMode) => {
    if (mode === 'HOMEDESIGN_COST_MARGIN' && value.userRole === 'CONSUMER') return;
    if (mode !== 'HOMEDESIGN_SIMPLE' && value.tier === 'FREE') return;
    if (mode === 'USER_CUSTOM' && !value.userProfileId) return;

    onChange({
      ...value,
      templateMode: mode,
      templateId: mode,
      templateVersion: templateVersionFor(mode),
      templateScope:
        mode === 'HOMEDESIGN_SIMPLE'
          ? 'GENERAL'
          : mode === 'USER_CUSTOM' || mode === 'HOMEDESIGN_COST_MARGIN'
            ? 'USER'
            : 'PROJECT',
    });
  };

  return (
    <section className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">견적 이용 방식</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">먼저 이용 목적을 선택하세요</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(['CONSUMER', 'SUPPLIER'] as EstimateUserRole[]).map((role) => {
          const active = value.userRole === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setRole(role)}
              className={`rounded-xl border p-4 text-left transition ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}
            >
              <div className="font-semibold text-gray-900">{roleCopy[role].title}</div>
              <div className="mt-1 text-sm text-gray-500">{roleCopy[role].description}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        {(['FREE', 'PRO'] as EstimatePlanTier[]).map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setTier(tier)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${value.tier === tier ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {tier === 'FREE' ? '무료' : '유료'}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">{featureCopy(value)}</div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">견적서 양식</p>
            <h3 className="mt-1 font-bold text-gray-900">사용할 템플릿을 선택하세요</h3>
          </div>
          <span className="text-xs text-gray-400">{value.templateVersion || 'VERSION_PENDING'}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {templateOptions.map((option) => {
            const blockedByTier = Boolean(option.proOnly && value.tier !== 'PRO');
            const blockedByRole = Boolean(option.supplierOnly && value.userRole !== 'SUPPLIER');
            const blockedByProfile = option.mode === 'USER_CUSTOM' && !value.userProfileId;
            const disabled = blockedByTier || blockedByRole || blockedByProfile;
            const active = value.templateMode === option.mode;

            return (
              <button
                key={option.mode}
                type="button"
                disabled={disabled}
                onClick={() => setTemplate(option.mode)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-indigo-500 bg-indigo-50'
                    : disabled
                      ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-55'
                      : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-gray-900">{option.title}</div>
                  {option.proOnly && <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white">PRO</span>}
                </div>
                <div className="mt-1 text-sm text-gray-500">{option.description}</div>
                {blockedByProfile && <div className="mt-2 text-xs text-amber-700">사용자 템플릿 프로필 등록 후 선택 가능</div>}
                {blockedByRole && <div className="mt-2 text-xs text-amber-700">공급자 내부용 · 소비자 선택 불가</div>}
              </button>
            );
          })}
        </div>
      </div>

      {value.tier === 'PRO' && (
        <div className="mt-4 text-xs text-indigo-700">
          유료 개인화는 전용 템플릿 버전과 사용자 프로필을 분리 저장하고, 일반 학습 규칙으로 역전파하지 않습니다.
        </div>
      )}
    </section>
  );
};
