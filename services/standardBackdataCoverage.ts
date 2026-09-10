export type CoverageStatus = 'PASS' | 'QUEENS_GAP';

export interface CoverageRow {
  trade: string;
  hasPrimaryMaterial: boolean;
  hasSubMaterial: boolean;
  hasInstallConsumable: boolean;
  hasLabor: boolean;
  hasLogisticsOrLifting: boolean;
  hasWasteOrDisposal: boolean;
  hasPriceAsOf: boolean;
  hasPriceSource: boolean;
  hasProductOrReferenceLink: boolean;
}

export interface CoverageAuditResult {
  status: CoverageStatus;
  missing: string[];
  trade: string;
  enqueue?: 'QUEENS_STANDARD_BACKDATA_GAP';
}

const checks: Array<[keyof CoverageRow, string]> = [
  ['hasPrimaryMaterial', 'PRIMARY_MATERIAL'],
  ['hasSubMaterial', 'SUB_MATERIAL'],
  ['hasInstallConsumable', 'INSTALL_CONSUMABLE'],
  ['hasLabor', 'LABOR'],
  ['hasLogisticsOrLifting', 'LOGISTICS_OR_LIFTING'],
  ['hasWasteOrDisposal', 'WASTE_OR_DISPOSAL'],
  ['hasPriceAsOf', 'PRICE_AS_OF'],
  ['hasPriceSource', 'PRICE_SOURCE'],
  ['hasProductOrReferenceLink', 'PRODUCT_OR_REFERENCE_LINK'],
];

export function auditStandardBackdataCoverage(row: CoverageRow): CoverageAuditResult {
  const missing = checks.filter(([key]) => !row[key]).map(([, label]) => label);
  if (missing.length) {
    return {
      status: 'QUEENS_GAP',
      trade: row.trade,
      missing,
      enqueue: 'QUEENS_STANDARD_BACKDATA_GAP',
    };
  }
  return { status: 'PASS', trade: row.trade, missing: [] };
}

export function canGenerateFreeStandardEstimate(rows: CoverageRow[]): boolean {
  return rows.length > 0 && rows.every((row) => auditStandardBackdataCoverage(row).status === 'PASS');
}
