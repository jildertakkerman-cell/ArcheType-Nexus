const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');

const widgetHtml = `            <!-- Community Synergy Tags -->
                <div class="relative inline-block w-full lg:w-auto" id="synergy-dock-wrap">
                    <button class="synergy-sidebar-btn group flex items-center justify-center gap-3 w-full lg:w-auto lg:pr-4 lg:py-1 lg:rounded-full hover:bg-slate-800 transition-colors" onclick="synTogglePopover(event)" type="button">
                        <div class="relative flex items-center justify-center w-10 h-10 lg:w-10 lg:h-10 rounded-full bg-[#1e293b] text-[#2dd4bf] group-hover:bg-[#2dd4bf] group-hover:text-[#0f172a] transition-all duration-300 shadow-md border border-indigo-500/30 lg:border-none">
                            <i class="fas fa-link text-lg"></i>
                            <span class="synergy-badge absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style="display:none;"></span>
                        </div>
                        <span class="hidden lg:inline-block font-semibold text-gray-300 group-hover:text-white transition-colors">Synergies</span>
                    </button>
                    <div class="synergy-popover" id="synergy-popover">
                        <div class="synergy-popover-header">
                            <span class="synergy-popover-title">Synergies</span>
                            <span class="synergy-popover-close" onclick="synTogglePopover(event, false)">&#10005;</span>
                        </div>
                        <div class="tier-list" id="synergy-tier-list"></div>
                        <div class="search-wrap">
                            <div class="search-box">
                                <span class="icon">&#128269;</span>
                                <input id="synergy-search-input" type="text" placeholder="Search other archetypes&#8230;" oninput="onSynergySearch()" />
                            </div>
                            <div class="search-results" id="synergy-search-results"></div>
                            <div class="search-hint" id="synergy-search-hint">Top 3 shown &mdash; search for anything else.</div>
                        </div>
                    </div>
                </div>`;

let modifiedCount = 0;
let skippedCount = 0;

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

for (const filename of files) {
    const filepath = path.join(pagesDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    if (content.includes('synergy-dock-wrap')) {
        skippedCount++;
        continue;
    }

    const archetypeMatch = content.match(/renderDeckResourcesCompact\('deck-resources-compact',\s*'([^']+)'/);
    if (!archetypeMatch) {
        skippedCount++;
        continue;
    }
    const archetypeName = archetypeMatch[1];

    const target = '<div id="archetype-cards-browser" class="flex justify-center"></div>';
    const replacement = `${target}\n                <!-- Vertical Divider (Desktop) -->\n                <div class="hidden md:block w-px h-6 bg-indigo-500/30 mx-1"></div>\n${widgetHtml}`;

    if (content.includes(target)) {
        content = content.replace(target, replacement);
    } else {
        skippedCount++;
        continue;
    }

    if (!content.includes('assets/css/synergy-tags.css')) {
        const cssTarget = '<link rel="stylesheet" href="../assets/css/cookie-consent.css">';
        if (content.includes(cssTarget)) {
            content = content.replace(cssTarget, `<link rel="stylesheet" href="../assets/css/synergy-tags.css">\n    ${cssTarget}`);
        } else {
            content = content.replace('</head>', `    <link rel="stylesheet" href="../assets/css/synergy-tags.css">\n</head>`);
        }
    }

    if (!content.includes('assets/js/synergy-tags.js')) {
        const jsInject = '<script src="../assets/js/text-utils.js"></script>\n    <script src="../assets/js/synergy-tags.js"></script>';
        const jsTarget = '<script src="../assets/js/combo-system.js"></script>';
        if (content.includes(jsTarget)) {
            content = content.replace(jsTarget, `${jsInject}\n    ${jsTarget}`);
        } else {
            content = content.replace('</head>', `    ${jsInject}\n</head>`);
        }
    }

    const initScript = `initSynergyTags('${archetypeName}');`;
    if (!content.includes(initScript)) {
        const comboMatch = content.match(/(initCommunityCombos\([^)]+\);)/);
        if (comboMatch) {
            content = content.replace(comboMatch[1], `${comboMatch[1]}\n                ${initScript}`);
        } else {
            content = content.replace('</body>', `    <script>document.addEventListener('DOMContentLoaded', function () { ${initScript} });</script>\n</body>`);
        }
    }

    fs.writeFileSync(filepath, content, 'utf8');
    modifiedCount++;
    console.log(`Modified: ${filename}`);
}

console.log(`\n--- Summary ---`);
console.log(`Modified: ${modifiedCount}`);
console.log(`Skipped: ${skippedCount}`);
