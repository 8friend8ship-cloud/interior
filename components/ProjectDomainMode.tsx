import React from 'react';
import type { EstimateBuildingUse, EstimateMarketplaceContext, EstimateProjectDomain } from '../contracts/estimateMarketplace';

interface Props {
  value: EstimateMarketplaceContext;
  onChange: (context: EstimateMarketplaceContext) => void;
}

const domains: Array<{ id: EstimateProjectDomain; title: string; description: string; defaultUse: EstimateBuildingUse }> = [
  { id: 'RESIDENTIAL_INTERIOR', title: '주거 인테리어', description: '아파트·빌라·주택 내부 인테리어 / 욕실 / 창호', defaultUse: 'RESIDENTIAL' },
  { id: 'COMMERCIAL_INTERIOR', title: '상업 인테리어', description: '사무실·매장·식음·병원·교육·숙박 등 상업시설', defaultUse: 'OFFICE' },
  { id: 'ARCHITECTURE_BUILD', title: '건축 · 신축', description: '가설·토공·기초·골조·외장·MEP·소방·외부공사까지', defaultUse: 'RESIDENTIAL' },
  { id: 'RENOVATION_REMODEL', title: '리모델링 · 대수선', description: '기존건물 조사·선택철거·구조보강·설비갱신·마감', defaultUse: 'RESIDENTIAL' },
];

const uses: Array<{ id: EstimateBuildingUse; label: string }> = [
  { id: 'RESIDENTIAL', label: '주거' },
  { id: 'OFFICE', label: '사무실' },
  { id: 'RETAIL', label: '매장' },
  { id: 'FNB', label: '식음/F&B' },
  { id: 'MEDICAL', label: '병원/의료' },
  { id: 'EDUCATION', label: '교육' },
  { id: 'HOSPITALITY', label: '숙박' },
  { id: 'WAREHOUSE', label: '창고/물류' },
  { id: 'OTHER', label: '기타' },
];

export const ProjectDomainMode: React.FC<Props> = ({ value, onChange }) => {
  const current = value.projectDomain || 'RESIDENTIAL_INTERIOR';
  return (
    <section className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">프로젝트 유형</p>
      <h2 className="mt-1 text-xl font-bold text-gray-900">견적 범위를 선택하세요</h2>
      <p className="mt-1 text-sm text-gray-500">유형별 공종·자재·노무·경비 백데이터를 분리해 사용합니다.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {domains.map((item) => {
          const active = current === item.id;
          return (
            <button key={item.id} type="button" onClick={() => onChange({ ...value, projectDomain: item.id, buildingUse: item.defaultUse })}
              className={`rounded-xl border p-4 text-left transition ${active ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'}`}>
              <div className="font-semibold text-gray-900">{item.title}</div>
              <div className="mt-1 text-sm text-gray-500">{item.description}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-700">건물/영업 용도</label>
        <select value={value.buildingUse || 'RESIDENTIAL'} onChange={(e) => onChange({ ...value, buildingUse: e.target.value as EstimateBuildingUse })}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
          {uses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>
      {current !== 'RESIDENTIAL_INTERIOR' && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
          상업·건축·대수선은 주거 인테리어 단가를 면적배율로 재사용하지 않습니다. 해당 도메인의 검증된 BOM·노무·경비·가격시점이 없으면 견적 금액을 보류하고 Queens 보충 대상으로 전환합니다.
        </div>
      )}
    </section>
  );
};
