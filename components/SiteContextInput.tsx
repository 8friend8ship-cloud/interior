import React, { useMemo, useState } from 'react';
import type { InteriorSiteContext, SiteAssetKind } from '../contracts/siteContext';
import { validateInteriorSiteContext } from '../services/siteContext';

interface Props {
  value: InteriorSiteContext | null;
  onChange: (value: InteriorSiteContext | null) => void;
}

const emptySite = (): InteriorSiteContext => ({
  lotBoundaryVerified: false,
  buildingPlacementVerified: false,
  roadRelationVerified: false,
  roadElevationVerified: false,
  vehicleAccessVerified: false,
  parkingSpaces: 0,
  separateDriveway: undefined,
  pedestrianRoute: 'UNKNOWN',
  entranceVerified: false,
  assets: [],
  notes: [],
});

const assetKinds: Array<{ kind: SiteAssetKind; label: string }> = [
  { kind: 'PLAN', label: '배치도·평면도 URL' },
  { kind: 'SITE_PHOTO', label: '건물·대지 현장사진 URL' },
  { kind: 'ROAD_PHOTO', label: '도로·차량진입 사진 URL' },
  { kind: 'PARKING_PHOTO', label: '주차공간 사진 URL' },
  { kind: 'BOUNDARY_REFERENCE', label: '대지경계 참고 URL' },
];

export const SiteContextInput: React.FC<Props> = ({ value, onChange }) => {
  const site = value || emptySite();
  const [urls, setUrls] = useState<Record<string, string>>(() => Object.fromEntries((site.assets || []).map(a => [a.kind, a.url || ''])));
  const qa = useMemo(() => validateInteriorSiteContext(value), [value]);

  const patch = (next: Partial<InteriorSiteContext>) => onChange({ ...site, ...next });

  const updateUrl = (kind: SiteAssetKind, url: string) => {
    const nextUrls = { ...urls, [kind]: url };
    setUrls(nextUrls);
    const existing = site.assets.find(a => a.kind === kind);
    const other = site.assets.filter(a => a.kind !== kind);
    const trimmed = url.trim();
    patch({
      assets: trimmed
        ? [...other, { id: existing?.id || `${kind}-${Date.now()}`, kind, url: trimmed, verified: existing?.verified === true }]
        : other,
    });
  };

  const setAssetVerified = (kind: SiteAssetKind, verified: boolean) => {
    const existing = site.assets.find(a => a.kind === kind);
    if (!existing?.url) return;
    patch({
      assets: site.assets.map(a => a.kind === kind ? { ...a, verified } : a),
    });
  };

  return (
    <section className="mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sky-600">현장 · 도로 · 주차 근거</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">도면과 현장관계를 같이 확인합니다</h2>
          <p className="mt-1 text-sm text-gray-500">URL/ID 포인터만으로 검증 완료 처리하지 않습니다. 자료를 실제 확인한 뒤에만 확인 완료를 체크합니다.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${qa.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {qa.ok ? '현장근거 확인' : '현장근거 보완 필요'}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['lotBoundaryVerified', '대지경계 확인'],
          ['buildingPlacementVerified', '건물배치 확인'],
          ['roadRelationVerified', '도로관계 확인'],
          ['roadElevationVerified', '도로 높낮이 확인'],
          ['vehicleAccessVerified', '차량진입 확인'],
          ['entranceVerified', '현관 위치 확인'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm">
            <input type="checkbox" checked={Boolean((site as any)[key])} onChange={e => patch({ [key]: e.target.checked } as any)} />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold text-gray-800">주차 가능 대수
          <input type="number" min="0" value={site.parkingSpaces ?? 0} onChange={e => patch({ parkingSpaces: Number(e.target.value || 0) })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-gray-800">별도 차량 진입로
          <select value={site.separateDriveway === undefined ? 'UNKNOWN' : site.separateDriveway ? 'YES' : 'NO'} onChange={e => patch({ separateDriveway: e.target.value === 'UNKNOWN' ? undefined : e.target.value === 'YES' })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2">
            <option value="UNKNOWN">확인 필요</option><option value="NO">없음</option><option value="YES">있음</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-gray-800">보행 동선
          <select value={site.pedestrianRoute || 'UNKNOWN'} onChange={e => patch({ pedestrianRoute: e.target.value as InteriorSiteContext['pedestrianRoute'] })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2">
            <option value="UNKNOWN">확인 필요</option><option value="PARKING_TO_ENTRANCE">주차장 → 현관</option><option value="SEPARATE">별도 보행동선</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {assetKinds.map(({ kind, label }) => {
          const asset = site.assets.find(a => a.kind === kind);
          return (
            <div key={kind} className="rounded-xl border border-gray-200 p-3">
              <label className="text-sm font-semibold text-gray-800">{label}
                <input type="url" value={urls[kind] || ''} onChange={e => updateUrl(kind, e.target.value)} placeholder="https://..." className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal" />
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" disabled={!asset?.url} checked={asset?.verified === true} onChange={e => setAssetVerified(kind, e.target.checked)} />
                <span>이 자료를 실제 확인했고 현장 사실과 일치함</span>
              </label>
            </div>
          );
        })}
      </div>

      {!qa.ok && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
        확인 필요: {[...qa.missing, ...qa.blockers].join(' · ') || '현장근거 입력'}
      </div>}
      <button type="button" onClick={() => onChange(value ? null : emptySite())} className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
        {value ? '현장근거 입력 사용 안 함' : '현장근거 입력 시작'}
      </button>
    </section>
  );
};
