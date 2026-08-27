import React from 'react';

export const InteriorEntryShell: React.FC = () => (
  <section aria-label="Interior landing" className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 py-8 text-white">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">HOME DESIGN · INTERIOR ESTIMATE</p>
      <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">도면·현장조건·공종 근거를 연결해 견적, 자재, 공정, 시안까지 같은 프로젝트 계보로 관리합니다.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">소비자·공급자 모드를 분리하고, 검증되지 않은 수량·단가·현장조건은 임의로 만들지 않습니다. 입력한 자료와 저장 백데이터를 먼저 사용합니다.</p>
        </div>
        <a href="#interior-workspace" className="w-fit rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">견적 시작</a>
      </div>
    </div>
  </section>
);
