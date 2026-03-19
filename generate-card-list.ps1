# generate-card-list.ps1
# Script de régénération du manifeste d'images MCC
# Usage : .\generate-card-list.ps1
# Ce script scanne le dossier mcc-magic-custom-cube_image/ et génère card-list.json

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$imageDir = Join-Path $scriptDir "mcc-magic-custom-cube_image"
$outputFile = Join-Path (Join-Path $scriptDir "mcc-magic-custom-cube") "card-list.json"

if (-not (Test-Path $imageDir)) {
    Write-Error "❌ Dossier d'images introuvable : $imageDir"
    exit 1
}

$images = Get-ChildItem -Path $imageDir -Filter "*.png" -File |
    Sort-Object Name |
    ForEach-Object { $_.Name }

$json = $images | ConvertTo-Json -Compress

# Écriture en UTF-8 sans BOM pour compatibilité web
[System.IO.File]::WriteAllText($outputFile, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host "✅ card-list.json généré avec $($images.Count) images -> $outputFile"
