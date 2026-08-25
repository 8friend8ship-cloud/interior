import React from 'react';
import {
  EstimateMarketplaceContext,
  EstimatePlanTier,
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

export const EstimateMarketplaceMode: React.FC<EstimateMarketplaceModeProps> = ({ value, onChange }) => {
  const setRole = (role: EstimateUserRole) => onChange(normalizeRoleTier(role, value.tier, value));
  const setTier = (tier: EstimatePlanTier) => onChange(normalizeRoleTier(value.userRole, tier, value));

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

      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
        {featureCopy(value)}
      </div>

      {value.tier === 'PRO' && (
        <div className="mt-3 text-xs text-indigo-700">
          유료 개인화는 전용 템플릿 버전과 사용자 프로필을 분리 저장하고, 일반 학습 규칙으로 역전파하지 않습니다.
        </div>
      )}
    </section>
  );
};
