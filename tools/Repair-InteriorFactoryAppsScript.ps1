param(
  [string]$TargetTitle = 'WEBAPP_TEMPLATE_06',
  [string]$ExpectedDeploymentId = 'AKfycbx5Sm8FtA7D6iQVNmdoYFON-Y5xHNdNT5a-zZWoxeORL6_nFfqOBoPwA1IYEFKHcKKjoQ',
  [string]$RepairBranch = 'fix/interior-factory-runtime-config-20260821',
  [string]$RepairRepo = 'https://github.com/8friend8ship-cloud/interior.git'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Get-Layout([string]$Dir) {
  $root = $Dir
  $configPath = Join-Path $Dir '.clasp.json'
  if (Test-Path $configPath) {
    $config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
    if ($config.rootDir) { $root = [IO.Path]::GetFullPath((Join-Path $Dir ([string]$config.rootDir))) }
  }
  $gs = @(Get-ChildItem $root -Recurse -File -Filter '*.gs').Count
  $js = @(Get-ChildItem $root -Recurse -File -Filter '*.js').Count
  [pscustomobject]@{ Root = $root; Extension = $(if ($gs -gt $js) { '.gs' } else { '.js' }) }
}

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) { throw 'CLASP_COMMAND_NOT_FOUND' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'GIT_COMMAND_NOT_FOUND' }

& clasp show-authorized-user --json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'EXISTING_CLASP_AUTH_NOT_AVAILABLE' }
$list = (& clasp list-scripts 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) { throw 'CLASP_LIST_SCRIPTS_FAILED' }
$matches = @($list -split "`r?`n" | Where-Object { $_ -match [regex]::Escape($TargetTitle) })
if ($matches.Count -ne 1) { throw "SCRIPT_TITLE_MATCH_COUNT:$($matches.Count)" }
$idMatch = [regex]::Match($matches[0], '[A-Za-z0-9_-]{30,}')
if (-not $idMatch.Success) { throw 'SCRIPT_ID_PARSE_FAILED' }
$scriptId = $idMatch.Value

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$root = Join-Path $env:TEMP "interior-appscript-repair-$stamp"
$live = Join-Path $root 'live-before'
$repo = Join-Path $root 'repair-repo'
$verify = Join-Path $root 'verify-after'
New-Item -ItemType Directory -Force -Path $live,$verify | Out-Null

Push-Location $live
try { & clasp clone-script $scriptId; if ($LASTEXITCODE -ne 0) { throw 'CLASP_CLONE_EXISTING_SOURCE_FAILED' } } finally { Pop-Location }
$deployments = (& clasp list-deployments $scriptId 2>&1 | Out-String)
if ($LASTEXITCODE -eq 0 -and $deployments -notmatch [regex]::Escape($ExpectedDeploymentId)) { throw 'EXPECTED_DEPLOYMENT_ID_NOT_FOUND' }
git clone --quiet --depth 1 --branch $RepairBranch $RepairRepo $repo
if ($LASTEXITCODE -ne 0) { throw 'REPAIR_BRANCH_CLONE_FAILED' }

$layout = Get-Layout $live
$files = @(Get-ChildItem $layout.Root -Recurse -File | Where-Object { $_.Extension -in @('.gs','.js') })
$targets = @($files | Where-Object { (Get-Content -Raw -LiteralPath $_.FullName) -match 'function\s+processTaskQueue\s*\(\s*\)\s*\{' })
if ($targets.Count -ne 1) { throw "PROCESS_TASK_QUEUE_DEFINITION_COUNT:$($targets.Count)" }
$source = Get-Content -Raw -LiteralPath $targets[0].FullName
if ($source -notmatch 'interiorFactoryEnsureRuntimeConfig_\s*\(') {
  $source = [regex]::Replace($source, '(function\s+processTaskQueue\s*\(\s*\)\s*\{)', '${1}' + "`r`n  // APP_INTERIOR existing-slot runtime and template guard.`r`n  interiorFactoryEnsureRuntimeConfig_();", 1)
  Set-Content -LiteralPath $targets[0].FullName -Value $source -Encoding UTF8
}

foreach ($name in @('InteriorFactoryRuntimeGuard','InteriorFactoryRuntimeRepair','InteriorFactoryTemplateUpgrade')) {
  $src = Join-Path $repo "apps-script/$name.gs"
  if (-not (Test-Path $src)) { throw "PATCH_MODULE_MISSING:$name" }
  Copy-Item -Force $src (Join-Path $layout.Root ($name + $layout.Extension))
}

$checkFiles = @(Get-ChildItem $layout.Root -Recurse -File | Where-Object { $_.Extension -in @('.gs','.js') })
$all = ($checkFiles | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName }) -join "`n"
if ([regex]::Matches($all, 'interiorFactoryEnsureRuntimeConfig_\s*\(').Count -lt 2) { throw 'LOCAL_GUARD_REFERENCE_VERIFY_FAILED' }

Push-Location $live
try { & clasp push --force; if ($LASTEXITCODE -ne 0) { throw 'CLASP_PUSH_FAILED' } } finally { Pop-Location }
Push-Location $verify
try { & clasp clone-script $scriptId; if ($LASTEXITCODE -ne 0) { throw 'CLASP_READBACK_CLONE_FAILED' } } finally { Pop-Location }

$readback = (Get-ChildItem $verify -Recurse -File | Where-Object { $_.Extension -in @('.gs','.js') } | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName }) -join "`n"
foreach ($needle in @('interiorFactoryEnsureRuntimeConfig_','repairInteriorFactoryRuntimeConfig','interiorFactoryUpgradeTemplates_')) {
  if ($readback -notmatch [regex]::Escape($needle)) { throw "READBACK_MISSING:$needle" }
}

Write-Host '[VERIFIED] Existing Script ID source patch readback passed.'
Write-Host "SCRIPT_ID=$scriptId"
Write-Host "EXISTING_DEPLOYMENT_ID=$ExpectedDeploymentId"
Write-Host "BACKUP_PATH=$live"
Write-Host 'NEXT=existing 5-minute processTaskQueue trigger performs runtime readback and DryWriter retry; verify twice.'

