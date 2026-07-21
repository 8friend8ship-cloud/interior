import React, { useEffect, useState } from 'react';
import App from './App';
import { getHomeEstimatePmfContext, PmfContext } from './services/pmfGateService';

const PmfAwareApp: React.FC = () => {
  const [pmf, setPmf] = useState<PmfContext | null>(null);
  const [pmfError, setPmfError] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    getHomeEstimatePmfContext()
      .then(context => {
        if (!mounted) return;
        setPmf(context);
        (window as any).__PMF_CONTEXT__ = context;
      })
      .catch(error => {
        if (!mounted) return;
        setPmfError(error instanceof Error ? error.message : 'PMF context error');
      });
    return () => { mounted = false; };
  }, []);

  return (
    <>
      {pmf?.gateResult === 'RESEARCH_REQUIRED' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900">
          고객 검증 단계 {pmf.stage}차: 답변은 현재 확인된 자료를 우선 사용하며, 부족한 내용은 추가 질문과 고객 조사로 연결합니다.
        </div>
      )}
      {pmfError && import.meta.env.DEV && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-800">{pmfError}</div>
      )}
      <App />
    </>
  );
};

export default PmfAwareApp;
