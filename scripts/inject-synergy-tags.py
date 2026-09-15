import os
import re

pages_dir = os.path.join(os.path.dirname(__file__), '..', 'pages')

widget_html = """            <!-- Community Synergy Tags: inside the resources dock -->
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
            </div>"""

modified_count = 0
skipped_count = 0

for filename in os.listdir(pages_dir):
    if not filename.endswith('.html'):
        continue
    filepath = os.path.join(pages_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Skip files that shouldn't be touched or already have it
    if 'synergy-dock-wrap' in content:
        skipped_count += 1
        continue
        
    # Extract Archetype Name
    archetype_name = None
    m = re.search(r"renderDeckResourcesCompact\('deck-resources-compact',\s*'([^']+)'", content)
    if m:
        archetype_name = m.group(1)
        
    if not archetype_name:
        skipped_count += 1
        continue

    # 2. Inject into the dock
    # Find: <div id="archetype-cards-browser" class="flex justify-center"></div>
    # Then append vertical divider + widget
    target = '<div id="archetype-cards-browser" class="flex justify-center"></div>'
    replacement = f"""{target}
                <!-- Vertical Divider (Desktop) -->
                <div class="hidden md:block w-px h-6 bg-indigo-500/30 mx-1"></div>
{widget_html}"""
    
    if target in content:
        content = content.replace(target, replacement, 1)
    else:
        # If we can't find it, skip
        skipped_count += 1
        continue

    # 3. Inject CSS into <head>
    if 'assets/css/synergy-tags.css' not in content:
        # Put before </head> or cookie-consent.css
        if '<link rel="stylesheet" href="../assets/css/cookie-consent.css">' in content:
            content = content.replace('<link rel="stylesheet" href="../assets/css/cookie-consent.css">', 
                                      '<link rel="stylesheet" href="../assets/css/synergy-tags.css">\n    <link rel="stylesheet" href="../assets/css/cookie-consent.css">', 1)
        else:
            content = content.replace('</head>', '    <link rel="stylesheet" href="../assets/css/synergy-tags.css">\n</head>', 1)
            
    # 4. Inject JS into <head>
    if 'assets/js/synergy-tags.js' not in content:
        js_inject = '<script src="../assets/js/text-utils.js"></script>\n    <script src="../assets/js/synergy-tags.js"></script>'
        if '<script src="../assets/js/combo-system.js"></script>' in content:
            content = content.replace('<script src="../assets/js/combo-system.js"></script>', 
                                      f'{js_inject}\n    <script src="../assets/js/combo-system.js"></script>', 1)
        else:
            content = content.replace('</head>', f'    {js_inject}\n</head>', 1)
            
    # 5. Inject init script
    init_script = f"initSynergyTags('{archetype_name}');"
    if init_script not in content:
        # Try to find initCommunityCombos
        m_combo = re.search(r"(initCommunityCombos\([^)]+\);)", content)
        if m_combo:
            content = content.replace(m_combo.group(1), f"{m_combo.group(1)}\n                {init_script}", 1)
        else:
            content = content.replace('</body>', f"    <script>document.addEventListener('DOMContentLoaded', function () {{ {init_script} }});</script>\n</body>", 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    modified_count += 1
    print(f"Modified: {filename}")

print("\n--- Summary ---")
print(f"Modified: {modified_count}")
print(f"Skipped: {skipped_count}")
