import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

const app = readFileSync('App.tsx', 'utf8');
const service = readFileSync('services/geminiService.ts', 'utf8');
const marketplace = readFileSync('contracts/estimateMarketplace.ts', 'utf8');
const marketplaceUi = readFileSync('components/EstimateMarketplaceMode.tsx', 'utf8');
const siteInput = readFileSync('components/SiteContextInput.tsx', 'utf8');
const connectedDetails = readFileSync('components/ConnectedEstimateDetails.tsx', 'utf8');
const apiBridge = readFileSync('api/interior-backdata.ts', 'utf8');
const deterministic = readFileSync('services/deterministicEstimate.ts', 'utf8');
const bridge = readFileSync('services/interiorBackdataBridge.ts', 'utf8');
const runtime = readFileSync('apps-script/InteriorMarketplaceRuntime_20260825.gs', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

function loadBridgeRuntime() {
  const compiled = ts.transpileModule(bridge, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === './siteContext') return { siteContextForBridge: (site) => site };
    throw new Error(`Unexpected runtime dependency in bridge QA: ${specifier}`);
  };
  new Function('exports', 'module', 'require', compiled)(module.exports, module, localRequire);
  return module.exports;
}

test('unified requirements are version-controlled', () => {
  assert.equal(existsSync('docs/INTERIOR_UNIFIED_REQUIREMENTS_20260827.md'), true);
});

test('marketplace roles, tiers and project domains remain in the unified candidate', () => {
  for (const token of ['CONSUMER','SUPPLIER','FREE','PRO','SIMPLE','COMPARE','TENDER','RESIDENTIAL_INTERIOR','COMMERCIAL_INTERIOR','ARCHITECTURE_BUILD','RENOVATION_REMODEL']) assert.match(marketplace, new RegExp(token));
});

test('consumer and supplier workflow modes are exposed in the front UI', () => {
  for (const token of ['SIMPLE','COMPARE','TENDER','REGISTER_BID','AUTOMATION','PLATFORM']) assert.match(marketplaceUi, new RegExp(token));
});

test('site evidence input is wired from App into bridge-bound project details', () => {
  for (const token of ['lotBoundaryVerified','buildingPlacementVerified','roadRelationVerified','roadElevationVerified','vehicleAccessVerified','parkingSpaces','PARKING_TO_ENTRANCE','PLAN','ROAD_PHOTO','PARKING_PHOTO']) assert.match(siteInput, new RegExp(token));
  assert.match(app, /<SiteContextInput value=\{siteContext\} onChange=\{setSiteContext\}/);
  assert.match(app, /const detailsWithSite = siteContext \? \{ \.\.\.details, siteContext \} : details/);
  assert.match(bridge, /siteContextForBridge/);
  assert.match(bridge, /\.\.\.evidencePayload\(details\)/);
});

test('client/internal estimate separation contract remains explicit', () => {
  for (const token of ['executionCost','margin','marginRate','subcontractorCost']) assert.match(marketplace, new RegExp(token));
});

test('consumer result UI hides execution cost detail while supplier can inspect it', () => {
  assert.match(connectedDetails, /const isSupplier = context\.userRole === 'SUPPLIER'/);
  assert.match(connectedDetails, /isSupplier && <td[^>]*>.*materialCost/s);
  assert.match(connectedDetails, /isSupplier && <td[^>]*>.*laborCost/s);
  assert.match(connectedDetails, /고객 견적 합계/);
});

test('consumer API response recursively strips internal cost and margin fields', () => {
  assert.match(apiBridge, /CONSUMER_PRIVATE_FIELDS/);
  for (const token of ['executionCost','executionUnitPrice','margin','marginRate','internalNote','subcontractorCost','materialCost','laborCost']) assert.match(apiBridge, new RegExp(token));
  assert.match(apiBridge, /sanitizeConsumerValue/);
  assert.match(apiBridge, /role !== 'SUPPLIER'/);
  assert.match(apiBridge, /INTERIOR_BACKDATA_BRIDGE_V3_CONSUMER_SANITIZED_20260827/);
});

test('fallback does not fabricate a priced estimate from the 32-pyeong sample', () => {
  assert.match(deterministic, /costEstimate = \[\]/);
  assert.match(deterministic, /VERIFIED_PROJECT_BOM_NOT_AVAILABLE_ON_FALLBACK/);
});

test('Queens to Seed T1 T2 runtime promotion exists', () => {
  assert.match(runtime, /interiorPromoteReadyQueens_/);
  assert.match(runtime, /TEMPLATE_STAGE_1/);
  assert.match(runtime, /TEMPLATE_STAGE_2/);
});

test('legacy DryWriter runtime guard files are absorbed', () => {
  assert.equal(existsSync('apps-script/InteriorFactoryRuntimeGuard.gs'), true);
  assert.equal(existsSync('apps-script/InteriorFactoryRuntimeRepair.gs'), true);
  assert.equal(existsSync('apps-script/InteriorFactoryTemplateUpgrade.gs'), true);
});

test('local language/Bots bridge is absorbed', () => {
  assert.equal(existsSync('FrontLanguageBotBridge.tsx'), true);
  assert.match(readFileSync('index.tsx','utf8'), /FrontLanguageBotBridge/);
});

test('browser AI secrets and SDK are forbidden in the unified candidate', () => {
  assert.equal(pkg.dependencies['@google/genai'], undefined, 'remove browser @google/genai dependency');
  assert.doesNotMatch(service, /process\.env\.(GEMINI_API_KEY|API_KEY)/);
  assert.doesNotMatch(service, /@google\/genai|GoogleGenAI/);
});

test('silent mock image fallback is forbidden outside explicit demo mode', () => {
  assert.doesNotMatch(service, /catch[\s\S]{0,500}MOCK_IMAGE_BASE64/);
});

test('core front still uses the Interior backdata bridge', () => {
  for (const token of ['fetchInteriorEstimateBundle','fetchInteriorMaterials','fetchInteriorSchedule','fetchInteriorRender']) assert.match(app, new RegExp(token));
});

test('quantity lineage 32 to 40 keeps trade-specific quantities at runtime', () => {
  const { validateBridgeQuantityLineage } = loadBridgeRuntime();
  const result = validateBridgeQuantityLineage([
    { category: '도배', item: '벽지', unit: '평', quantity: 100, baseQuantity: 80, baseAreaPy: 32, targetAreaPy: 40 },
    { category: '바닥', item: '마루', unit: '평', quantity: 35, baseQuantity: 28, baseAreaPy: 32, targetAreaPy: 40 },
    { category: '청소', item: '입주청소', unit: '평', quantity: 40, baseQuantity: 32, baseAreaPy: 32, targetAreaPy: 40 },
  ], 40);
  assert.deepEqual(result, { ok: true, checkedItems: 3 });
});

test('quantity lineage runtime rejects target-py overwrite collapse', () => {
  const { validateBridgeQuantityLineage } = loadBridgeRuntime();
  const result = validateBridgeQuantityLineage([
    { category: '도배', item: '벽지', unit: '평', quantity: 40 },
    { category: '바닥', item: '마루', unit: '평', quantity: 40 },
    { category: '청소', item: '입주청소', unit: '평', quantity: 40 },
  ], 40);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'SUSPICIOUS_TARGET_PY_OVERWRITE');
});
