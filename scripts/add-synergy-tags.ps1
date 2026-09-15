# Add the "Pairs Well With" Community Synergy Tags widget to every archetype
# page. Idempotent — safe to re-run; pages that already have the widget
# (id="synergy-dock-wrap") are skipped.
#
# Layout: the widget is inserted side-by-side with the "Deck Resources & Card
# Browser" dock (the dock's wrapper is rewrapped into a flex row, matching the
# hand-built of-the-Swamp layout). Pages whose dock markup doesn't match the
# expected shape fall back to a centered row below the dock; both cases are
# logged separately.
#
# ENCODING: files are read and written as strict UTF-8 (no BOM). An earlier
# revision used Get-Content/Set-Content, which transcodes UTF-8 pages to
# Windows-1252 in PowerShell 5.1 and corrupts every non-ASCII character —
# never reintroduce that. All inserted snippets are pure ASCII.

$pagesDir = Join-Path $PSScriptRoot "..\pages"

$utf8Strict = New-Object System.Text.UTF8Encoding($false, $true)  # no BOM, throw on invalid
$utf8Out    = New-Object System.Text.UTF8Encoding($false)          # no BOM

$cssLink = '    <link rel="stylesheet" href="../assets/css/synergy-tags.css">'
$textUtilsScript = '    <script src="../assets/js/text-utils.js"></script>'
$synergyScript = '    <script src="../assets/js/synergy-tags.js"></script>'

$widgetHtml = @'
            <!-- Community Synergy Tags: its own pill, beside the resources dock -->
            <div class="relative inline-block" id="synergy-dock-wrap">
                <button class="synergy-dock-btn" onclick="synTogglePopover(event)" type="button">
                    <span class="synergy-badge" style="display:none;"></span>
                    <span>&#128279; Pairs Well With</span>
                    <span class="mini-icons" id="synergy-mini-icons"></span>
                </button>
                <div class="synergy-popover" id="synergy-popover">
                    <div class="synergy-popover-header">
                        <span class="synergy-popover-title">Pairs Well With</span>
                        <span class="synergy-popover-close" onclick="synTogglePopover(event, false)">&#10005;</span>
                    </div>
                    <div class="tier-list" id="synergy-tier-list"></div>
                    <div class="search-wrap">
                        <div class="search-box">
                            <span class="icon">&#128269;</span>
                            <input id="synergy-search-input" type="text" placeholder="Search other archetypes&#8230;" oninput="onSynergySearch()" />
                        </div>
                        <div class="search-results" id="synergy-search-results"></div>
                        <div class="search-hint" id="synergy-search-hint">Top 3 shown &#8212; search for anything else.</div>
                    </div>
                </div>
            </div>
'@

# Fallback variant: centered row below the dock (own wrapper)
$fallbackHtml = @'

        <div class="flex justify-center -mt-8 mb-12">
'@ + $widgetHtml + @'
        </div>
'@

# --- Anchors for the side-by-side rewrap -------------------------------------
# Open anchor tolerates mb-4/8/10/12 variants; glow anchor tolerates the
# class attribute being wrapped onto its own line (prettified pages).
$dockOpenRe = [regex]'<div class="relative z-10 -mt-8 mb-\d+ mx-auto max-w-fit">'
$dockOpenReplacement = @'
<div class="relative z-10 -mt-8 mb-12 flex flex-wrap items-center justify-center gap-4">
            <div class="relative max-w-fit">
'@

$glowCloseRe = [regex]'(?s)<!--\s*Glow effect behind\s*-->\s*<div\s+class="absolute inset-0 bg-indigo-500/20[^"]*">\s*</div>\s*</div>'

# Old-style anchor for the fallback path (widget below the dock)
$oldAnchorRe = [regex]'(?s)(id="archetype-cards-browser"[^>]*></div>\s*</div>\s*<!-- Glow effect behind -->.*?</div>\s*</div>)'

$modified = 0
$modifiedFallback = 0
$skippedAlready = 0
$skippedNoName = 0
$skippedNoAnchor = 0
$skippedBadEncoding = 0
$noNameFiles = New-Object System.Collections.Generic.List[string]
$noAnchorFiles = New-Object System.Collections.Generic.List[string]
$fallbackFiles = New-Object System.Collections.Generic.List[string]
$badEncodingFiles = New-Object System.Collections.Generic.List[string]

$excludeNames = @(
    'Admin.html', 'Banlist.html', 'Card-Browser.html', 'Privacy-Policy.html',
    'Replay-Analyzer.html', 'Replay-Converter.html', 'Updates.html',
    'suggestion-form.html', 'My-Replays.html'
)

Get-ChildItem -Path $pagesDir -Filter "*.html" | Where-Object { $excludeNames -notcontains $_.Name } | ForEach-Object {
    $filePath = $_.FullName

    try {
        $content = [System.IO.File]::ReadAllText($filePath, $utf8Strict)
    } catch {
        $skippedBadEncoding++
        $badEncodingFiles.Add($_.Name)
        return
    }

    if ($content -match 'id="synergy-dock-wrap"') {
        $skippedAlready++
        return
    }

    if ($content -notmatch "CardLoader\.renderDeckResourcesCompact\('deck-resources-compact',\s*'([^']+)'") {
        $skippedNoName++
        $noNameFiles.Add($_.Name)
        return
    }
    $archetypeName = $matches[1]

    $glowMatches = $glowCloseRe.Matches($content)
    $openMatches = $dockOpenRe.Matches($content)
    $usedFallback = $false

    if ($openMatches.Count -eq 1 -and $glowMatches.Count -eq 1) {
        # Side-by-side rewrap (Swamp layout)
        $content = $dockOpenRe.Replace($content, $dockOpenReplacement.Replace('$', '$$'), 1)
        $gm = $glowCloseRe.Match($content)
        $content = $content.Substring(0, $gm.Index) + $gm.Value + "`r`n" + $widgetHtml +
                   "        </div>" + $content.Substring($gm.Index + $gm.Length)
        # Note: gm.Value ends with the dock wrapper's own </div>, which now
        # closes the new inner "relative max-w-fit" div; the appended </div>
        # closes the outer flex row.
    } elseif ($oldAnchorRe.IsMatch($content)) {
        # Fallback: centered row below the dock
        $m = $oldAnchorRe.Match($content)
        $content = $content.Substring(0, $m.Index) + $m.Value + "`r`n" + $fallbackHtml + $content.Substring($m.Index + $m.Length)
        $usedFallback = $true
    } else {
        $skippedNoAnchor++
        $noAnchorFiles.Add($_.Name)
        return
    }

    if ($content -notmatch [regex]::Escape('assets/css/synergy-tags.css')) {
        $content = $content -replace '(\s*)(<link rel="stylesheet" href="\.\./assets/css/cookie-consent\.css">)', "`$1$cssLink`r`n`$1`$2"
        if ($content -notmatch [regex]::Escape('assets/css/synergy-tags.css')) {
            $content = $content -replace '</head>', "$cssLink`r`n</head>"
        }
    }
    if ($content -notmatch 'assets/js/text-utils\.js') {
        $content = $content -replace '(<script src="\.\./assets/js/community-combos\.js"></script>)', "`$1`r`n$textUtilsScript`r`n$synergyScript"
        if ($content -notmatch 'assets/js/text-utils\.js') {
            $content = $content -replace '</head>', "$textUtilsScript`r`n$synergyScript`r`n</head>"
        }
    }

    $escapedName = [regex]::Escape($archetypeName)
    if ($content -match "initCommunityCombos\('community-combos-wrapper',\s*'$escapedName'\);") {
        $content = $content -replace "(initCommunityCombos\('community-combos-wrapper',\s*'$escapedName'\);)", "`$1`r`n                initSynergyTags('$archetypeName');"
    } else {
        $initBlock = "    <script>document.addEventListener('DOMContentLoaded', function () { initSynergyTags('$archetypeName'); });</script>`r`n</body>"
        $content = $content -replace '</body>', $initBlock
    }

    [System.IO.File]::WriteAllText($filePath, $content, $utf8Out)
    if ($usedFallback) { $modifiedFallback++; $fallbackFiles.Add($_.Name) } else { $modified++ }
    Write-Host "Modified$(if ($usedFallback) { ' (fallback layout)' }): $($_.Name)"
}

Write-Host "`n--- Summary ---"
Write-Host "Modified (side-by-side): $modified"
Write-Host "Modified (fallback below-dock): $modifiedFallback"
if ($fallbackFiles.Count -gt 0) { $fallbackFiles | ForEach-Object { Write-Host "  - $_" } }
Write-Host "Skipped (already patched): $skippedAlready"
Write-Host "Skipped (no archetype name found): $skippedNoName"
if ($noNameFiles.Count -gt 0) { $noNameFiles | ForEach-Object { Write-Host "  - $_" } }
Write-Host "Skipped (no dock anchor found): $skippedNoAnchor"
if ($noAnchorFiles.Count -gt 0) { $noAnchorFiles | ForEach-Object { Write-Host "  - $_" } }
Write-Host "Skipped (not valid UTF-8, untouched): $skippedBadEncoding"
if ($badEncodingFiles.Count -gt 0) { $badEncodingFiles | ForEach-Object { Write-Host "  - $_" } }
