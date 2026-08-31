import type { InteriorSiteContext, SiteContextQa } from '../contracts/siteContext';

export function validateInteriorSiteContext(site?: InteriorSiteContext | null): SiteContextQa {
  if (!site) return { ok: false, confidence: 'LOW', missing: ['siteContext'], blockers: ['SITE_CONTEXT_REQUIRED'] };
  const missing: string[] = [];
  const blockers: string[] = [];

  if (!site.lotBoundaryVerified) missing.push('lotBoundary');
  if (!site.buildingPlacementVerified) missing.push('buildingPlacement');
  if (!site.roadRelationVerified) missing.push('roadRelation');
  if (!site.roadElevationVerified) missing.push('roadElevation');
  if (!site.vehicleAccessVerified) missing.push('vehicleAccess');
  if (!site.entranceVerified) missing.push('entrance');
  if (!Array.isArray(site.assets) || !site.assets.some(a => a.kind === 'PLAN' && a.verified)) missing.push('verifiedPlan');
  if (!Array.isArray(site.assets) || !site.assets.some(a => a.kind === 'ROAD_PHOTO' && a.verified)) missing.push('verifiedRoadPhoto');

  if (!Number.isFinite(Number(site.parkingSpaces)) || Number(site.parkingSpaces) < 1) blockers.push('PARKING_CAPACITY_UNVERIFIED');
  if (site.pedestrianRoute === 'UNKNOWN' || !site.pedestrianRoute) blockers.push('PEDESTRIAN_ROUTE_UNVERIFIED');
  if (site.separateDriveway === undefined) blockers.push('DRIVEWAY_RELATION_UNVERIFIED');

  const ok = missing.length === 0 && blockers.length === 0;
  return { ok, confidence: ok ? 'HIGH' : missing.length <= 2 && blockers.length === 0 ? 'MEDIUM' : 'LOW', missing, blockers };
}

export function siteContextForBridge(site?: InteriorSiteContext | null) {
  const qa = validateInteriorSiteContext(site);
  return {
    siteContext: site || null,
    siteQa: qa,
    failClosed: !qa.ok,
    rule: 'DO_NOT_INVENT_BOUNDARY_ROAD_ELEVATION_PARKING_OR_ENTRANCE',
  };
}
