/** Readback and explicit repair entrypoints for the existing APP_INTERIOR project. */
var INTERIOR_FACTORY_RUNTIME_REPAIR_VERSION = 'INTERIOR_FACTORY_RUNTIME_REPAIR_V1_20260821';

function inspectInteriorFactoryRuntimeRepair() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configUrl = String(interiorFactoryConfigValue_('DRYWRITER_WEBAPP_URL') || '').trim();
  var propertyUrl = String(PropertiesService.getScriptProperties().getProperty('DRYWRITER_WEBAPP_URL') || '').trim();
  var triggers = ScriptApp.getProjectTriggers().map(function(t) {
    return { handler: String(t.getHandlerFunction ? t.getHandlerFunction() : ''), uid: String(t.getUniqueId ? t.getUniqueId() : '') };
  });
  return {
    ok: true,
    version: INTERIOR_FACTORY_RUNTIME_REPAIR_VERSION,
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    appId: String(interiorFactoryConfigValue_('APP_ID') || '').trim(),
    scriptId: ScriptApp.getScriptId(),
    configDryWriterUrlPresent: !!configUrl,
    scriptPropertyDryWriterUrlPresent: !!propertyUrl,
    dryWriterUrlMatches: !!configUrl && configUrl === propertyUrl,
    processTaskQueueTriggerCount: triggers.filter(function(t) { return t.handler === 'processTaskQueue'; }).length,
    drywriter: interiorFactoryDrywriterStats_(),
    at: new Date().toISOString()
  };
}

function repairInteriorFactoryRuntimeConfig() {
  if (String(interiorFactoryConfigValue_('APP_ID') || '').trim() !== 'APP_INTERIOR') throw new Error('APP_ID_MISMATCH_EXPECTED_APP_INTERIOR');
  var url = String(interiorFactoryConfigValue_('DRYWRITER_WEBAPP_URL') || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(url)) throw new Error('INVALID_OR_MISSING_CONFIG_DRYWRITER_WEBAPP_URL');
  PropertiesService.getScriptProperties().setProperty('DRYWRITER_WEBAPP_URL', url);
  var upgraded = interiorFactoryUpgradeTemplates_();
  var reset = interiorFactoryResetMissingUrlFailures_();
  var queued = interiorFactoryQueueGuardCycle_();
  var inspect = inspectInteriorFactoryRuntimeRepair();
  if (!inspect.dryWriterUrlMatches) throw new Error('DRYWRITER_RUNTIME_CONFIG_VERIFY_FAILED');
  return { ok: true, version: INTERIOR_FACTORY_RUNTIME_REPAIR_VERSION, upgraded: upgraded, resetDryWriterRows: reset, queuedTaskId: queued, inspect: inspect };
}

function interiorFactoryConfigValue_(key) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG');
  if (!sh) throw new Error('SHEET_MISSING:CONFIG');
  if (sh.getLastRow() < 2) return '';
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) if (String(rows[i][0] || '').trim() === key) return rows[i][1];
  return '';
}

function interiorFactoryDrywriterStats_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DRYWRITER_QUEUE');
  if (!sh || sh.getLastRow() < 2) return { total: 0, waitingMissingUrl: 0, pending: 0 };
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, Math.min(sh.getLastColumn(), 9)).getValues();
  var out = { total: rows.length, waitingMissingUrl: 0, pending: 0 };
  rows.forEach(function(r) {
    if (String(r[4] || '') === 'WAITING_BRIDGE' && String(r[8] || '') === 'DRYWRITER_WEBAPP_URL_NOT_CONFIGURED') out.waitingMissingUrl++;
    if (String(r[4] || '') === 'PENDING') out.pending++;
  });
  return out;
}

function interiorFactoryResetMissingUrlFailures_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DRYWRITER_QUEUE');
  if (!sh || sh.getLastRow() < 2) return 0;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, Math.min(sh.getLastColumn(), 9)).getValues();
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][4] || '') === 'WAITING_BRIDGE' && String(rows[i][8] || '') === 'DRYWRITER_WEBAPP_URL_NOT_CONFIGURED') {
      sh.getRange(i + 2, 5).setValue('PENDING');
      sh.getRange(i + 2, 9).clearContent();
      count++;
    }
  }
  return count;
}
