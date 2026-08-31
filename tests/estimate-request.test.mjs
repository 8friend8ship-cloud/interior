import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync('services/estimateRequest.ts', 'utf8');

function loadRuntime() {
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', 'require', compiled)(module.exports, module, () => ({}));
  return module.exports;
}

const baseDraft = {
  formSchemaId: '', version: 'ESTIMATE_REQUEST_V2_20260831', region: '서울', materialGrade: 'standard',
  answers: { region: '서울', materialGrade: 'standard', contactMethod: 'APP' }, attachmentKinds: [], completedRequiredFields: false,
};

test('base request requires canonical region and material grade', () => {
  const { buildEstimateRequestSchema, validateEstimateRequest, resolveEstimateRequestRoute } = loadRuntime();
  const context = { userRole:'CONSUMER', tier:'FREE', consumerMode:'SIMPLE', projectDomain:'RESIDENTIAL_INTERIOR', buildingUse:'RESIDENTIAL', templateMode:'HOMEDESIGN_SIMPLE' };
  const schema = buildEstimateRequestSchema(context);
  const grade = schema.baseQuestions.find(q => q.questionId === 'materialGrade');
  assert.deepEqual(grade?.options, ['budget','standard','high_end']);
  assert.equal(validateEstimateRequest(schema, { ...baseDraft, answers: { region:'서울', contactMethod:'APP' } }).ok, false);
  const route = resolveEstimateRequestRoute(context, baseDraft);
  assert.equal(route.region, '서울');
  assert.equal(route.materialGrade, 'standard');
  assert.match(route.routeId, /^서울:standard:/);
});

test('consumer compare mode adds compare-count and validates it', () => {
  const { buildEstimateRequestSchema, validateEstimateRequest, resolveEstimateRequestRoute } = loadRuntime();
  const context = { userRole:'CONSUMER', tier:'PRO', consumerMode:'COMPARE', projectDomain:'RESIDENTIAL_INTERIOR', buildingUse:'RESIDENTIAL', templateMode:'GENOVY_DETAIL' };
  const schema = buildEstimateRequestSchema(context);
  assert.ok(schema.conditionalQuestions.some(q => q.questionId === 'compareCount'));
  assert.equal(validateEstimateRequest(schema, baseDraft).ok, false);
  const complete = { ...baseDraft, answers: { ...baseDraft.answers, compareCount:'3' } };
  assert.equal(validateEstimateRequest(schema, complete).ok, true);
  const route = resolveEstimateRequestRoute(context, complete);
  assert.equal(route.mode, 'STANDARD');
  assert.equal(route.region, '서울');
  assert.equal(route.materialGrade, 'standard');
});

test('consumer tender mode requires deadline, bid package, plan and site photo', () => {
  const { buildEstimateRequestSchema, validateEstimateRequest } = loadRuntime();
  const context = { userRole:'CONSUMER', tier:'PRO', consumerMode:'TENDER', projectDomain:'ARCHITECTURE_BUILD', buildingUse:'RESIDENTIAL', templateMode:'GENOVY_DETAIL' };
  const schema = buildEstimateRequestSchema(context);
  const incomplete = validateEstimateRequest(schema, baseDraft);
  for (const expected of ['tenderDeadline','bidPackage','attachment:PLAN','attachment:SITE_PHOTO']) assert.ok(incomplete.missingQuestionIds.includes(expected));
  const complete = { ...baseDraft, answers: { ...baseDraft.answers, tenderDeadline:'2026-09-30', bidPackage:['BOQ','SCHEDULE'] }, attachmentKinds:['PLAN','SITE_PHOTO'] };
  assert.equal(validateEstimateRequest(schema, complete).ok, true);
});

test('supplier automation requires pricing profile and provider routing stays explicit', () => {
  const { buildEstimateRequestSchema, validateEstimateRequest, resolveEstimateRequestRoute } = loadRuntime();
  const context = { userRole:'SUPPLIER', tier:'PRO', supplierMode:'AUTOMATION', providerId:'PROVIDER_001', projectDomain:'COMMERCIAL_INTERIOR', buildingUse:'OFFICE', templateMode:'USER_CUSTOM' };
  const schema = buildEstimateRequestSchema(context);
  assert.ok(schema.conditionalQuestions.some(q => q.questionId === 'pricingProfile'));
  const complete = { ...baseDraft, providerId:'PROVIDER_001', materialGrade:'high_end', answers: { ...baseDraft.answers, materialGrade:'high_end', pricingProfile:'OFFICE_STD_V3' } };
  assert.equal(validateEstimateRequest(schema, complete).ok, true);
  const route = resolveEstimateRequestRoute(context, complete);
  assert.equal(route.mode, 'PROVIDER');
  assert.equal(route.providerId, 'PROVIDER_001');
  assert.equal(route.materialGrade, 'high_end');
});
