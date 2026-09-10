import React from 'react';
import { EstimateMarketplaceContext } from '../contracts/estimateMarketplace';

interface EstimateTemplateSummaryProps {
  context: EstimateMarketplaceContext;
}

const templateLabels: Record<string, string> = {
  HOMEDESIGN_SIMPLE: '홈디자인 간략 견적',
  GENOVY_DETAIL: '제노비 상세 견적',
  HOMEDESIGN_COST_MARGIN: '홈디자인 원가·마진 내부견적',
  USER_CUSTOM: '사용자 커스텀 견적',
  LEGACY_DETAIL: '기존 상세 견적',
};

export const EstimateTemplateSummary: React.FC<EstimateTemplateSummaryProps> = ({ context }) => {
  const templateMode = context.templateMode || 'HOMEDESIGN_SIMPLE';
  const isInternalTemplate = templateMode === 'HOMEDESIGN_COST_MARGIN';

  return (
    <section className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">견적 템플릿 계보</p>
          <h3 className="mt-1 font-bold text-gray-900">{templateLabels[templateMode] || templateMode}</h3>
        </div>
        <div className="text-right text-xs text-gray-600">
          <div>{context.userRole === 'CONSUMER' ? '소비자' : '공급자'} · {context.tier === 'FREE' ? '무료' : '유료'}</div>
          <div className="mt-1 font-mono">{context.templateVersion || 'VERSION_PENDING'}</div>
        </div>
      </div>

      {isInternalTemplate ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          내부 원가·마진용 템플릿입니다. 소비자 전달용 출력에는 실행원가·마진·내부메모를 포함하면 안 됩니다.
        </div>
      ) : (
        <div className="mt-3 text-xs text-gray-600">
          현재 화면 계산은 결정형 견적 엔진 결과이며, Queens→Seed→T1→T2 자동 런타임 연결은 별도 검증 게이트를 통과해야 합니다.
        </div>
      )}
    </section>
  );
};
