import { runPhase5FixtureLineageReadback } from './services/phase5FixtureRuntime';

const first = runPhase5FixtureLineageReadback();
const second = runPhase5FixtureLineageReadback();

if (!first.ok || !second.ok) {
  throw new Error(`Phase5 fixture lineage mismatch: ${JSON.stringify({ first, second })}`);
}

if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error('Phase5 fixture X2 readback mismatch');
}

console.log(JSON.stringify({ x2: 'PASS', first, second }));
