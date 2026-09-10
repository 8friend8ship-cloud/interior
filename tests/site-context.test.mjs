import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync('services/siteContext.ts', 'utf8');
const fixture = JSON.parse(readFileSync('tests/fixtures/interior-site-parking-entry-2cars.json', 'utf8'));

function loadSiteRuntime() {
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', compiled)(module.exports, module);
  return module.exports;
}

test('two-car parking to entrance fixture passes verified site context', () => {
  const { validateInteriorSiteContext } = loadSiteRuntime();
  const result = validateInteriorSiteContext(fixture);
  assert.deepEqual(result, { ok: true, confidence: 'HIGH', missing: [], blockers: [] });
  assert.equal(fixture.parkingSpaces, 2);
  assert.equal(fixture.separateDriveway, false);
  assert.equal(fixture.pedestrianRoute, 'PARKING_TO_ENTRANCE');
});

test('site context fails closed when road elevation evidence is missing', () => {
  const { validateInteriorSiteContext } = loadSiteRuntime();
  const broken = { ...fixture, roadElevationVerified: false };
  const result = validateInteriorSiteContext(broken);
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('roadElevation'));
});

test('site context fails closed when parking or entrance route is unverified', () => {
  const { validateInteriorSiteContext } = loadSiteRuntime();
  const broken = { ...fixture, parkingSpaces: 0, pedestrianRoute: 'UNKNOWN' };
  const result = validateInteriorSiteContext(broken);
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes('PARKING_CAPACITY_UNVERIFIED'));
  assert.ok(result.blockers.includes('PEDESTRIAN_ROUTE_UNVERIFIED'));
});
