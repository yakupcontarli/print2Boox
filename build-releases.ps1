$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$outDir = Join-Path $root 'releases'
$stageChrome = Join-Path $env:TEMP 'print2Boox-stage-chrome'
$stageFirefox = Join-Path $env:TEMP 'print2Boox-stage-firefox'

# Temizle
foreach ($dir in @($stageChrome, $stageFirefox)) {
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  New-Item -ItemType Directory -Path $dir | Out-Null
}
if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$includeItems = @(
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'aliyun-oss-sdk-6.0.0.min.js',
  'LICENSE',
  'images',
  '_locales'
)

foreach ($item in $includeItems) {
  $src = Join-Path $root $item
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination $stageChrome -Recurse -Force
    Copy-Item -Path $src -Destination $stageFirefox -Recurse -Force
  }
}

# Firefox manifest.json uyarlaması (MV3 Event Page + Gecko ID)
$ffManifestPath = Join-Path $stageFirefox 'manifest.json'
$ffManifest = Get-Content $ffManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$ffManifest.background = [PSCustomObject]@{
  scripts = @('aliyun-oss-sdk-6.0.0.min.js', 'background.js')
}
$ffManifest.permissions = @($ffManifest.permissions | Where-Object { $_ -ne 'printerProvider' })
$ffManifest | Add-Member -MemberType NoteProperty -Name 'browser_specific_settings' -Value ([PSCustomObject]@{
  gecko = [PSCustomObject]@{
    id = 'print2boox@yakupcontarli.dev'
    strict_min_version = '109.0'
  }
}) -Force

$ffJson = $ffManifest | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($ffManifestPath, $ffJson, (New-Object System.Text.UTF8Encoding($false)))

# POSIX '/' yollarıyla temiz ZIP / XPI üret
$chromeZip = Join-Path $outDir 'print2Boox-Chrome.zip'
$firefoxZip = Join-Path $outDir 'print2Boox-Firefox.zip'
$firefoxXpi = Join-Path $outDir 'print2Boox-Firefox.xpi'

$pyScript = @"
import os, sys, zipfile

def make_zip(src_dir, out_path):
    if os.path.exists(out_path):
        os.remove(out_path)
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for base, _, files in os.walk(src_dir):
            for name in sorted(files):
                full = os.path.join(base, name)
                rel = os.path.relpath(full, src_dir).replace(os.sep, '/')
                zf.write(full, rel)

make_zip(sys.argv[1], sys.argv[2])
make_zip(sys.argv[3], sys.argv[4])
"@

python -c $pyScript $stageChrome $chromeZip $stageFirefox $firefoxZip
Copy-Item -Path $firefoxZip -Destination $firefoxXpi -Force

# Chrome .crx paketleme (varsa Chrome veya Edge ile)
$chromeCrx = Join-Path $outDir 'print2Boox-Chrome.crx'
if (Test-Path $chromeCrx) { Remove-Item $chromeCrx -Force }

$browserExe = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browserExe) {
  $generatedCrx = "$stageChrome.crx"
  $generatedPem = "$stageChrome.pem"
  if (Test-Path $generatedCrx) { Remove-Item $generatedCrx -Force }
  if (Test-Path $generatedPem) { Remove-Item $generatedPem -Force }

  $proc = Start-Process -FilePath $browserExe -ArgumentList "--pack-extension=`"$stageChrome`"" -Wait -PassThru
  if (Test-Path $generatedCrx) {
    Move-Item -Path $generatedCrx -Destination $chromeCrx -Force
  }
  if (Test-Path $generatedPem) {
    Remove-Item $generatedPem -Force
  }
}

# Geçici klasörleri temizle
Remove-Item $stageChrome, $stageFirefox -Recurse -Force

Get-ChildItem $outDir | Select-Object Name, Length
