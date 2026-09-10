/** Existing APP_INTERIOR factory guard. No deployment or trigger creation. */
var INTERIOR_FACTORY_RUNTIME_GUARD_VERSION = 'INTERIOR_FACTORY_RUNTIME_GUARD_V1_20260821';
var INTERIOR_FACTORY_RUNTIME_GUARD_KEY = 'INTERIOR_DRYWRITER_RUNTIME_CONFIG_GUARD_V1';

function interiorFactoryEnsureRuntimeConfig_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var appId = String(interiorFactoryConfigValue_('APP_ID') || '').trim();
  if (appId !== 'APP_INTERIOR') return { ok: true, skipped: true, reason: 'NOT_APP_INTERIOR' };

  var url = String(interiorFactoryConfigValue_('DRYWRITER_WEBAPP_URL') || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(url)) {
    return { ok: false, skipped: true, reason: 'CONFIG_DRYWRITER_URL_INVALID_OR_MISSING' };
  }

  var props = PropertiesService.getScriptProperties();
  var before = String(props.getProperty('DRYWRITER_WEBAPP_URL') || '').trim();
  var changed = before !== url;
  if (changed) props.setProperty('DRYWRITER_WEBAPP_URL', url);
  if (String(props.getProperty('DRYWRITER_WEBAPP_URL') || '').trim() !== url) {
    throw new Error('INTERIOR_DRYWRITER_SCRIPT_PROPERTY_READBACK_FAILED');
  }

  var upgraded = interiorFactoryUpgradeTemplates_();
  var resetCount = changed ? interiorFactoryResetMissingUrlFailures_() : 0;
  var queuedTaskId = changed ? interiorFactoryQueueGuardCycle_() : '';
  return {
    ok: true,
    version: INTERIOR_FACTORY_RUNTIME_GUARD_VERSION,
    scriptId: ScriptApp.getScriptId(),
    changed: changed,
    upgraded: upgraded,
    resetDryWriterRows: resetCount,
    queuedTaskId: queuedTaskId,
    propertyConfigured: true,
    at: new Date().toISOString()
  };
}

function interiorFactoryQueueGuardCycle_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TASK_QUEUE');
  if (!sh) throw new Error('SHEET_MISSING:TASK_QUEUE');
  if (sh.getLastRow() > 1) {
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 13).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][12] || '') === INTERIOR_FACTORY_RUNTIME_GUARD_KEY) return '';
    }
  }
  var taskId = 'TASK_' + Utilities.getUuid();
  sh.appendRow([taskId, 'APP_INTERIOR', 'FACTORY_CYCLE', JSON.stringify({
    source: 'runtime_guard',
    run_date: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd'),
    repair_version: INTERIOR_FACTORY_RUNTIME_GUARD_VERSION,
    drywriter_nonblocking: true
  }), 'QUEUED', 5, new Date().toISOString(), '', '', 0, '', '', INTERIOR_FACTORY_RUNTIME_GUARD_KEY]);
  return taskId;
}
