$backup = ".\src\styles\layout.css.backup"
$target = ".\src\styles\layout.css"

if (-not (Test-Path $backup)) {
    Write-Host "ERREUR : layout.css.backup introuvable." -ForegroundColor Red
    exit 1
}

$css = Get-Content $backup -Raw

# =========================================================
# 1. Supprimer le Header principal
# =========================================================

$headerStart = $css.IndexOf("HEADER SYGPERS")

if ($headerStart -lt 0) {
    Write-Host "ERREUR : HEADER SYGPERS introuvable." -ForegroundColor Red
    exit 1
}

# Remonter au début du commentaire de section
$headerStart = $css.LastIndexOf("/*", $headerStart)

$contentStart = $css.IndexOf("/* =========================================================", $headerStart + 10)

# Chercher spécifiquement la section CONTENT
$contentMarker = $css.IndexOf("CONTENT", $headerStart)

if ($contentMarker -lt 0) {
    Write-Host "ERREUR : section CONTENT introuvable." -ForegroundColor Red
    exit 1
}

$contentStart = $css.LastIndexOf("/*", $contentMarker)

if ($contentStart -lt 0) {
    Write-Host "ERREUR : début de la section CONTENT introuvable." -ForegroundColor Red
    exit 1
}

$css = $css.Substring(0, $headerStart) + $css.Substring($contentStart)

# =========================================================
# 2. Remplacer le responsive 1100px
# =========================================================

$media1100Start = $css.IndexOf("@media (max-width: 1100px)")

if ($media1100Start -ge 0) {
    $media1100End = $css.IndexOf("@media", $media1100Start + 10)

    if ($media1100End -lt 0) {
        $media1100End = $css.Length
    }

    $replacement = @"
@media (max-width: 1100px) {
  .app-content {
    padding: 28px 22px;
  }
}

"@

    $css = $css.Substring(0, $media1100Start) +
           $replacement +
           $css.Substring($media1100End)
}

# =========================================================
# 3. Remplacer le responsive 900px
# =========================================================

$media900Start = $css.IndexOf("@media (max-width: 900px)")

if ($media900Start -ge 0) {
    $media900End = $css.IndexOf("@media", $media900Start + 10)

    if ($media900End -lt 0) {
        $media900End = $css.Length
    }

    $replacement = @"
@media (max-width: 900px) {
  .app-main {
    width: 100%;
    margin-left: 0;
  }

  .app-content {
    min-height: calc(100vh - 72px);
    padding: 24px 18px;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;

    z-index: 90;

    display: block;

    background: rgba(32, 24, 19, 0.38);

    opacity: 0;
    visibility: hidden;

    transition:
      opacity 0.25s ease,
      visibility 0.25s ease;
  }

  .sidebar-overlay-visible {
    opacity: 1;
    visibility: visible;
  }
}

"@

    $css = $css.Substring(0, $media900Start) +
           $replacement +
           $css.Substring($media900End)
}

# =========================================================
# 4. Remplacer le premier responsive 520px
# =========================================================

$media520Start = $css.IndexOf("@media (max-width: 520px)")

if ($media520Start -ge 0) {
    $media520End = $css.IndexOf("@media", $media520Start + 10)

    if ($media520End -lt 0) {
        $media520End = $css.Length
    }

    $replacement = @"
@media (max-width: 520px) {
  .app-content {
    min-height: calc(100vh - 64px);
    padding: 20px 14px;
  }
}

"@

    $css = $css.Substring(0, $media520Start) +
           $replacement +
           $css.Substring($media520End)
}

# =========================================================
# 5. Supprimer le second @media 520px (notifications)
# =========================================================

$second520Start = $css.IndexOf("@media (max-width: 520px)")

if ($second520Start -ge 0) {
    $second520End = $css.IndexOf("@media", $second520Start + 10)

    if ($second520End -lt 0) {
        $second520End = $css.Length
    }

    $css = $css.Substring(0, $second520Start) +
           $css.Substring($second520End)
}

# =========================================================
# 6. Écrire layout.css
# =========================================================

Set-Content $target -Value $css -Encoding UTF8

Write-Host ""
Write-Host "Migration layout.css terminée." -ForegroundColor Green
Write-Host "Source : layout.css.backup" -ForegroundColor DarkGray
Write-Host "Cible  : layout.css" -ForegroundColor DarkGray