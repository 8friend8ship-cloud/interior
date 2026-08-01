import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const vite = readFileSync('vite.config.ts', 'utf8');
const service = readFileSync('services/geminiService.ts', 'utf8');
const app = readFileSync('App.tsx', 'utf8');
const types = readFileSync('types.ts', 'utf8');
const results = readFileSync('components/ResultsDisplay.tsx', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('browser bundle does not receive Gemini secrets', () => {
  assert.doesNotMatch(vite, /GEMINI_API_KEY|process\.env\.API_KEY|loadEnv/);
});
test('browser AI SDK dependency is removed', () => {
  assert.equal(pkg.dependencies['@google/genai'], undefined);
  assert.doesNotMatch(service, /GoogleGenAI|@google\/genai/);
});
test('all AI requests use the central audited endpoint', () => {
  assert.match(service, /VITE_AGENT_CORE_URL/);
  assert.match(service, /\/api\/interior\/generate/);
});
test('core response requires both execution evidence ids', () => {
  assert.match(service, /resultId/);
  assert.match(service, /auditId/);
  assert.match(service, /RESULT_ID\/AUDIT_ID/);
});
test('floorplan failure does not silently create an area square', () => {
  assert.doesNotMatch(app, /falling back to area-based|Math\.sqrt\(areaM2\)/);
  assert.match(service, /도면 분석에 실패했습니다/);
});
test('image generation fails closed instead of returning mock images', () => {
  assert.match(service, /대체 이미지는 표시하지 않습니다/);
  assert.doesNotMatch(service, /Image gen failed"[\s\S]{0,300}MOCK_IMAGE_BASE64/);
});
test('explicit demo data is labelled', () => {
  assert.match(service, /sourceType: 'DEMO_SAMPLE'/);
  assert.match(service, /사용자가 명시적으로 데모 모드를 선택/);
});
test('customer dimensions are labelled separately', () => {
  assert.match(app, /sourceType: 'CUSTOMER_DIMENSIONS'/);
  assert.match(app, /fallbackReason: null/);
});
test('provenance contract is typed', () => {
  assert.match(types, /ResultSourceMetadata/);
  assert.match(types, /sourceType: ResultSourceType/);
  assert.match(types, /confidence: 'HIGH' \| 'MEDIUM' \| 'LOW'/);
});
test('result provenance is visible in the front display', () => {
  assert.match(results, /결과 출처:/);
  assert.match(results, /신뢰도:/);
});
