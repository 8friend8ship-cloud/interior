@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Sync-InteriorMarketplaceAppsScript.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
if "%EXITCODE%"=="0" (
  echo [PASS] Interior Apps Script source sync and trigger readback completed.
) else if "%EXITCODE%"=="2" (
  echo [ACTION REQUIRED] Source sync completed, but one-time Apps Script Execution API/authorization is blocking trigger installation.
  echo Run function: installInteriorMarketplaceTriggers
) else (
  echo [HOLD] Runner ended with code %EXITCODE%. Check the newest INTERIOR_APPS_SCRIPT_SYNC_*.log in Downloads.
)
exit /b %EXITCODE%
