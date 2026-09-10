export type SiteAssetKind = 'PLAN' | 'SITE_PHOTO' | 'ROAD_PHOTO' | 'PARKING_PHOTO' | 'BOUNDARY_REFERENCE';

export interface SiteAssetRef {
  id: string;
  kind: SiteAssetKind;
  url?: string;
  fileName?: string;
  verified: boolean;
}

export interface InteriorSiteContext {
  lotBoundaryVerified: boolean;
  buildingPlacementVerified: boolean;
  roadRelationVerified: boolean;
  roadElevationVerified: boolean;
  vehicleAccessVerified: boolean;
  parkingSpaces?: number;
  separateDriveway?: boolean;
  pedestrianRoute?: 'PARKING_TO_ENTRANCE' | 'SEPARATE' | 'UNKNOWN';
  entranceVerified: boolean;
  assets: SiteAssetRef[];
  notes?: string[];
}

export interface SiteContextQa {
  ok: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  missing: string[];
  blockers: string[];
}
