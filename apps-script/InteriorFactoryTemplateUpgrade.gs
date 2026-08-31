/** APP_INTERIOR-only T1/T2 specialization. Never invents price or market evidence. */
var INTERIOR_TEMPLATE_CONTRACT_VERSION = 'INTERIOR_TEMPLATE_CONTRACT_V1_20260821';

function interiorFactoryUpgradeTemplates_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var t1 = interiorUpgradeSheet_(ss.getSheetByName('TEMPLATE_STAGE_1'), 'T1');
  var t2 = interiorUpgradeSheet_(ss.getSheetByName('TEMPLATE_STAGE_2'), 'T2');
  var dry = interiorUpgradeDrywriter_(ss.getSheetByName('DRYWRITER_QUEUE'), t2.contentIds);
  return { version: INTERIOR_TEMPLATE_CONTRACT_VERSION, t1: t1.count, t2: t2.count, drywriter: dry, contentIds: t2.contentIds };
}

function interiorUpgradeSheet_(sh, stage) {
  if (!sh || sh.getLastRow() < 2) return { count: 0, contentIds: [] };
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(v) { return String(v || '').trim().toUpperCase(); });
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var appCol = interiorFindHeader_(headers, ['APP_ID']);
  var jsonCol = interiorFindHeader_(headers, stage === 'T1' ? ['OUTLINE_JSON', 'TEMPLATE_JSON', 'CONTENT_JSON'] : ['BODY', 'BODY_TEXT', 'CONTENT', 'CONTENT_BODY']);
  var contentCol = interiorFindHeader_(headers, ['CONTENT_ID', 'TEMPLATE_ID']);
  if (appCol < 0 || jsonCol < 0) return { count: 0, contentIds: [] };
  var changed = 0;
  var ids = [];
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][appCol] || '').trim() !== 'APP_INTERIOR') continue;
    var current = String(rows[i][jsonCol] || '');
    if (current.indexOf(INTERIOR_TEMPLATE_CONTRACT_VERSION) >= 0) {
      if (contentCol >= 0) ids.push(String(rows[i][contentCol] || ''));
      continue;
    }
    var upgraded = stage === 'T1' ? JSON.stringify(interiorT1Contract_(current)) : interiorT2Contract_(current);
    sh.getRange(i + 2, jsonCol + 1).setValue(upgraded);
    changed++;
    if (contentCol >= 0) ids.push(String(rows[i][contentCol] || ''));
  }
  return { count: changed, contentIds: ids.filter(function(v) { return !!v; }) };
}

function interiorT1Contract_(original) {
  return {
    contractVersion: INTERIOR_TEMPLATE_CONTRACT_VERSION,
    originalFactoryDraft: original,
    purpose: '인테리어 견적·디자인·공정·상담 입력 구조화',
    requiredInput: ['area', 'buildingType', 'projectScope', 'scopeFlags', 'detailedScope'],
    estimateFields: ['category', 'item', 'quantity', 'unit', 'materialCost', 'laborCost', 'unitPrice', 'totalPrice', 'remarks', 'evidenceUrl'],
    scheduleFields: ['phase', 'task', 'duration', 'startDate', 'endDate'],
    outputFields: ['designConcept', 'costEstimate', 'materialDetailSheet', 'projectSchedule', 'confidence', 'confidenceReason', 'correctionNeeded'],
    safeguards: ['퀸즈 근거 없는 현재 시장 단가 생성 금지', '수량·단가·근거를 분리', '구조 검증과 실견적을 명시적으로 구분', '대표 이미지와 렌더 검증 2회 필요'],
    handoff: ['3D render', 'consultation brief']
  };
}

function interiorT2Contract_(original) {
  return [
    '[contractVersion] ' + INTERIOR_TEMPLATE_CONTRACT_VERSION,
    '[용도] 인테리어 앱 2차 템플릿 구조 검증용. 실제 단가와 시장 사실은 퀸즈 근거 승인 전 미확정.',
    '[프로젝트 입력] 면적 / 건물 유형 / 공사 범위 / 세부 요구사항',
    '[디자인 콘셉트] 스타일, 색상, 재료, 동선, 대표 이미지 요구',
    '[견적 표] 분류 | 항목 | 수량 | 단위 | 자재비 | 노무비 | 단가 | 합계 | 근거 URL | 비고',
    '[자재 상세] 자재명 | 규격 | 수량 | 대체안 | 근거',
    '[공정] 단계 | 작업 | 기간 | 시작 | 종료 | 선행조건',
    '[검증] confidence | confidenceReason | correctionNeeded | 수량·단가·근거·렌더 2회',
    '[전달] 3D 렌더 입력과 상담 브리프',
    '[기존 팩토리 초안] ' + original
  ].join('\n');
}

function interiorUpgradeDrywriter_(sh, contentIds) {
  if (!sh || sh.getLastRow() < 2 || !contentIds.length) return 0;
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(v) { return String(v || '').trim().toUpperCase(); });
  var requestCol = interiorFindHeader_(headers, ['REQUEST_JSON', 'PAYLOAD_JSON', 'REQUEST']);
  if (requestCol < 0) return 0;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    var raw = String(rows[i][requestCol] || '');
    var matched = contentIds.some(function(id) { return id && raw.indexOf(id) >= 0; });
    if (!matched || raw.indexOf(INTERIOR_TEMPLATE_CONTRACT_VERSION) >= 0) continue;
    var payload;
    try { payload = JSON.parse(raw); } catch (e) { payload = { originalRequest: raw }; }
    payload.interiorContractVersion = INTERIOR_TEMPLATE_CONTRACT_VERSION;
    payload.instructions = 'APP_INTERIOR 전용: 수량·단가·근거·공정·신뢰도·수정필요·3D/상담 구조를 유지하고, 근거 없는 시장 단가를 생성하지 않는다.';
    sh.getRange(i + 2, requestCol + 1).setValue(JSON.stringify(payload));
    count++;
  }
  return count;
}

function interiorFindHeader_(headers, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var index = headers.indexOf(candidates[i]);
    if (index >= 0) return index;
  }
  return -1;
}

