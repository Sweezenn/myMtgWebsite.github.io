# generate-card-list.ps1
# Script de regeneration des manifestes d'images MCC (cartes + tokens)
# Usage : powershell -ExecutionPolicy Bypass -File .\generate-card-list.ps1
# Ce script scanne les dossiers d'images et genere les JSON correspondants

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $scriptDir "mcc-magic-custom-cube"

# --- Fonction de tri numerique sur le prefixe N_ du nom de fichier ---
function Get-SortedImages($dir) {
    Get-ChildItem -Path $dir -Filter "*.png" -File |
        Sort-Object { 
            if ($_.Name -match '^\d+') { [int]$matches[0] } else { [int]::MaxValue }
        } |
        ForEach-Object { $_.Name }
}

# --- Cartes ---
$cardDir = Join-Path $scriptDir "mcc-magic-custom-cube_image"
$cardOut = Join-Path $outDir "card-list.json"

if (-not (Test-Path $cardDir)) {
    Write-Error "Dossier d'images introuvable : $cardDir"
    exit 1
}

$cards = Get-SortedImages $cardDir
$cardJson = $cards | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($cardOut, $cardJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "card-list.json : $($cards.Count) images -> $cardOut"

# --- Tokens ---
$tokenDir = Join-Path $scriptDir "mcc-magic-custom-cube_image_token"
$tokenOut = Join-Path $outDir "token-list.json"

if (Test-Path $tokenDir) {
    $tokens = Get-SortedImages $tokenDir
    $tokenJson = $tokens | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText($tokenOut, $tokenJson, [System.Text.UTF8Encoding]::new($false))
    Write-Host "token-list.json : $($tokens.Count) images -> $tokenOut"
} else {
    Write-Host "Dossier tokens non trouve ($tokenDir), token-list.json non genere."
}
