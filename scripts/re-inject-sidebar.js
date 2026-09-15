const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const startMarker = '<!-- Deck Resources & Card Browser (Responsive Dock) -->';
const endMarker = '<!-- Lore / Thematic Intro Section -->';

const newSidebarHtml = `        <!-- Left Sidebar Navigation -->
        <nav class="fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-around p-2 bg-[#0d121c]/95 backdrop-blur-md border-t border-indigo-500/20 shadow-[0_-8px_30px_rgb(0,0,0,0.5)] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-4 lg:right-auto lg:flex-col lg:p-4 lg:gap-4 lg:rounded-2xl lg:border lg:border-indigo-500/30 lg:bg-[#0f172a]/90 lg:w-48 lg:items-stretch lg:justify-start">
            <div id="deck-resources-compact" class="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 lg:gap-3 w-full lg:w-auto justify-around lg:justify-start"></div>
            
            <div id="archetype-cards-browser" class="flex flex-row lg:flex-col justify-center lg:items-stretch w-full lg:w-auto mt-0 lg:mt-2"></div>
            
            <!-- Community Synergy Tags -->
            <div class="relative inline-block w-full lg:w-auto mt-0 lg:mt-2" id="synergy-dock-wrap">
                <button class="synergy-sidebar-btn group flex items-center justify-center lg:justify-start gap-3 w-full lg:px-4 lg:py-2 lg:rounded-full hover:bg-slate-800 transition-colors" onclick="synTogglePopover(event)" type="button">
                    <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#1e293b] text-[#2dd4bf] group-hover:bg-[#2dd4bf] group-hover:text-[#0f172a] transition-all duration-300 shadow-md border border-indigo-500/30 lg:border-none shrink-0">
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
            </div>
        </nav>

        <!-- Lore / Thematic Intro Section -->`;

let modifiedCount = 0;

for (const file of files) {
    const fp = path.join(pagesDir, file);
    let content = fs.readFileSync(fp, 'utf8');
    
    const idx1 = content.indexOf(startMarker);
    const idx2 = content.indexOf(endMarker);
    
    if (idx1 !== -1 && idx2 !== -1) {
        let before = content.substring(0, idx1);
        let after = content.substring(idx2 + endMarker.length);
        
        content = before + newSidebarHtml + after;
        fs.writeFileSync(fp, content, 'utf8');
        modifiedCount++;
    }
}

console.log(`Modified ${modifiedCount} files.`);
