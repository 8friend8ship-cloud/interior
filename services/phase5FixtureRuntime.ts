export type Phase5FixtureLineageReadback = {
  ok: boolean;
  fixtureId: string;
  source: string;
  material: number;
  labor: number;
  expense: number;
  total: number;
  marginRate: number;
  quoteTotal: number;
  lineage: string;
  completeRule: string;
};

export function runPhase5FixtureLineageReadback(): Phase5FixtureLineageReadback {
  const material = 45_404_500;
  const labor = 43_210_500;
  const expense = 8_510_000;
  const total = material + labor + expense;
  const marginRate = 0;
  const quoteTotal = Math.round(total * (1 + marginRate));

  return {
    ok: total === 97_125_000 && quoteTotal === 97_125_000,
    fixtureId: 'PILOT-INTERIOR-ESTIMATE-CORE',
    source: 'COMM-001~005_TEST_ONLY',
    material,
    labor,
    expense,
    total,
    marginRate,
    quoteTotal,
    lineage: 'PHASE5_DRIVE_FIXTURE→NONPROD_FRONT_READBACK',
    completeRule: 'NONPROD_X2_AND_CUSTOMER_BON_READBACK_REQUIRED',
  };
}
