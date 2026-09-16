import { runPhase5FixtureLineageReadback } from './services/phase5FixtureRuntime';

const payload = runPhase5FixtureLineageReadback();

if (!payload.ok) {
  throw new Error(`Phase5 fixture lineage mismatch: ${JSON.stringify(payload)}`);
}

console.log(JSON.stringify(payload));
