$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptId = '1nj9yVonD6rVBdpPMqI2Qzsi7LYGruZMi8XYt6_07xHMI9HH4NEMXHIZQ'
$SourceFile = Join-Path (Split-Path $PSScriptRoot -Parent) 'apps-script\InteriorMarketplaceRuntime_20260825.gs'
$Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$WorkRoot = Join-Path $env:TEMP "INTERIOR_APPS_SCRIPT_SYNC_$Stamp"
$BackupZip = Join-Path $env:USERPROFILE "Downloads\INTERIOR_APPS_SCRIPT_BACKUP_$Stamp.zip"
$LogFile = Join-Path $env:USERPROFILE "Downloads\INTERIOR_APPS_SCRIPT_SYNC_$Stamp.log"

function Write-Log([string]$Message) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
  Write-Host $line
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Invoke-Clasp([string[]]$Args, [switch]$AllowFail) {
  Write-Log ("clasp " + ($Args -join ' '))
  & npx --yes '@google/clasp@latest' @Args 2>&1 | Tee-Object -FilePath $LogFile -Append
  $code = $LASTEXITCODE
  if ($code -ne 0 -and -not $AllowFail) { throw "clasp failed ($code): $($Args -join ' ')" }
  return $code
}

if (!(Test-Path $SourceFile)) { throw "Missing source file: $SourceFile" }
if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required.' }
if (!(Get-Command npx -ErrorAction SilentlyContinue)) { throw 'npx is required.' }

New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
Set-Content -Path (Join-Path $WorkRoot '.clasp.json') -Value ('{"scriptId":"' + $ScriptId + '","rootDir":"."}') -Encoding UTF8
Write-Log "SAFE SYNC START: $ScriptId"
Write-Log "Working directory: $WorkRoot"

Push-Location $WorkRoot
try {
  Invoke-Clasp @('pull')
  $pulled = Get-ChildItem -Path $WorkRoot -File -Recurse | Where-Object { $_.Name -ne '.clasp.json' }
  if ($pulled.Count -lt 1) { throw 'Remote pull returned no project files. Aborting before push.' }

  Compress-Archive -Path (Join-Path $WorkRoot '*') -DestinationPath $BackupZip -Force
  Write-Log "Remote backup saved: $BackupZip"

  Copy-Item -Path $SourceFile -Destination (Join-Path $WorkRoot 'InteriorMarketplaceRuntime_20260825.gs') -Force
  Write-Log 'Overlay complete: InteriorMarketplaceRuntime_20260825.gs'

  Invoke-Clasp @('push','--force')
  Write-Log 'SOURCE_PUSH_PASS'

  $inspect1 = Invoke-Clasp @('run','inspectInteriorMarketplaceTriggers') -AllowFail
  if ($inspect1 -ne 0) {
    Write-Log 'CLASP_RUN_BLOCKED: Apps Script Execution API/executable permission may need one-time authorization. Source push is complete; trigger install was not claimed.'
    Write-Log 'NEXT_REQUIRED_FUNCTION: installInteriorMarketplaceTriggers'
    exit 2
  }

  $install = Invoke-Clasp @('run','installInteriorMarketplaceTriggers') -AllowFail
  if ($install -ne 0) {
    Write-Log 'TRIGGER_INSTALL_RUN_FAILED: source remains synced; do not claim trigger PASS.'
    exit 3
  }

  Start-Sleep -Seconds 3
  $inspect2 = Invoke-Clasp @('run','inspectInteriorMarketplaceTriggers') -AllowFail
  if ($inspect2 -ne 0) {
    Write-Log 'TRIGGER_READBACK_FAILED: install was attempted but readback is not verified.'
    exit 4
  }

  Write-Log 'TRIGGER_INSTALL_AND_READBACK_PASS'
  Write-Log 'Expected handlers: runInteriorEstimateTemplateTick (5m), runInteriorBackdataFactoryControl10m (10m)'
  Write-Log 'SAFE SYNC COMPLETE'
}
finally {
  Pop-Location
}
