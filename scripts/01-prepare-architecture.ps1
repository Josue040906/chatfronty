$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Préparation de l'architecture frontend" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$directories = @(
    "src\app",
    "src\app\router",
    "src\app\providers",

    "src\api",

    "src\components\dashboard",
    "src\components\agents",
    "src\components\organisation",
    "src\components\carrieres",
    "src\components\documents",

    "src\components\assistant",

    "src\pages\Dashboard",
    "src\pages\Organisation",
    "src\pages\Agents",
    "src\pages\Carrieres",
    "src\pages\Documents",
    "src\pages\Assistant",
    "src\pages\Administration",

    "src\hooks",
    "src\context",
    "src\utils",

    "src\theme",
    "src\styles",

    "src\assets\images",
    "src\assets\icons"
)

Write-Host "Création des dossiers..." -ForegroundColor Yellow

foreach ($directory in $directories) {
    New-Item -ItemType Directory -Force $directory | Out-Null
    Write-Host "  [OK] $directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "Déplacement de Login.jsx..." -ForegroundColor Yellow

$loginSource = "src\components\pages\Login.jsx"
$loginDestination = "src\pages\LoginPage.jsx"

if (Test-Path $loginSource) {
    Move-Item $loginSource $loginDestination -Force
    Write-Host "  [OK] $loginSource -> $loginDestination" -ForegroundColor Green
}
else {
    Write-Host "  [INFO] Login.jsx déjà déplacé ou absent." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Vérification..." -ForegroundColor Yellow

$requiredDirectories = @(
    "src\app",
    "src\api",
    "src\components\layout",
    "src\components\ui",
    "src\components\dashboard",
    "src\components\agents",
    "src\components\organisation",
    "src\components\carrieres",
    "src\components\documents",
    "src\components\assistant",
    "src\pages",
    "src\pages\Dashboard",
    "src\pages\Organisation",
    "src\pages\Agents",
    "src\pages\Carrieres",
    "src\pages\Documents",
    "src\pages\Assistant",
    "src\pages\Administration",
    "src\hooks",
    "src\context",
    "src\utils",
    "src\theme",
    "src\styles"
)

$allOk = $true

foreach ($directory in $requiredDirectories) {
    if (Test-Path $directory) {
        Write-Host "  [OK] $directory" -ForegroundColor Green
    }
    else {
        Write-Host "  [ERREUR] $directory" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""

if ($allOk) {
    Write-Host "Architecture de base créée avec succès." -ForegroundColor Green
}
else {
    Write-Host "Certaines vérifications ont échoué." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "IMPORTANT : aucun fichier métier n'a été supprimé." -ForegroundColor Cyan
Write-Host ""