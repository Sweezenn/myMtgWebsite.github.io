# generate-card-list.ps1
# Script de regeneration des manifestes d'images MCC (cartes + tokens)
# Usage : powershell -ExecutionPolicy Bypass -File .\generate-card-list.ps1
# Ce script scanne les dossiers d'images et genere les JSON correspondants
# Les images en paysage (largeur > hauteur) sont automatiquement marquees rotate:true

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $scriptDir "mcc-magic-custom-cube"

Add-Type -AssemblyName System.Drawing

# --- Fonction de tri numerique sur le prefixe N_ du nom de fichier ---
function Get-SortedImages($dir) {
    Get-ChildItem -Path $dir -Filter "*.png" -File |
        Sort-Object { 
            if ($_.Name -match '^\d+') { [int]$matches[0] } else { [int]::MaxValue }
        }
}

# --- Fonction de generation du manifeste JSON avec detection de rotation ---
function Export-Manifest($dir, $outputFile, $label) {
    $files = Get-SortedImages $dir
    $entries = $files | ForEach-Object {
        $img = [System.Drawing.Image]::FromFile($_.FullName)
        $w = $img.Width; $h = $img.Height
        $img.Dispose()
        $rotate = ($w -gt $h)
        [PSCustomObject]@{ name = $_.Name; rotate = $rotate; w = $w; h = $h }
    }
    $json = $entries | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText($outputFile, $json, [System.Text.UTF8Encoding]::new($false))
    $rotatedCount = ($entries | Where-Object { $_.rotate }).Count
    Write-Host "$label : $($entries.Count) images ($rotatedCount a rotation) -> $outputFile"
}

# --- Cartes ---
$cardDir = Join-Path $scriptDir "mcc-magic-custom-cube_image"
$cardOut = Join-Path $outDir "card-list.json"
if (-not (Test-Path $cardDir)) { Write-Error "Dossier introuvable : $cardDir"; exit 1 }
Export-Manifest $cardDir $cardOut "card-list.json"

# --- Tokens ---
$tokenDir = Join-Path $scriptDir "mcc-magic-custom-cube_image_token"
$tokenOut = Join-Path $outDir "token-list.json"
if (Test-Path $tokenDir) {
    Export-Manifest $tokenDir $tokenOut "token-list.json"
} else {
    Write-Host "Dossier tokens non trouve, token-list.json non genere."
}
