const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const startMarker1 = '<!-- Deck Resources & Card Browser (Sidebar / Bottom Bar Design) -->';
const startMarker2 = '<!-- Deck Resources & Card Browser (Dock Design) -->';
const endMarker = '<!-- Lore / Thematic Intro Section -->';

const newHtml = `        <!-- Deck Resources & Card Browser (Responsive Dock) -->
        <div class="fixed bottom-0 left-0 right-0 z-50 w-full lg:static lg:w-auto lg:relative lg:z-10 lg:-mt-8 lg:mb-12 lg:mx-auto lg:max-w-fit">
            <div class="flex flex-row items-center justify-around p-2 bg-[#0d121c]/95 backdrop-blur-md border-t border-indigo-500/20 lg:flex-wrap lg:justify-center lg:gap-4 lg:p-3 lg:rounded-2xl lg:bg-[#0f172a]/80 lg:border lg:border-indigo-500/30 lg:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <div id="deck-resources-compact" class="flex flex-row items-center gap-2 lg:gap-4 w-full lg:w-auto justify-around lg:justify-center"></div>
                
                <!-- Vertical Divider (Desktop) -->
                <div class="hidden lg:block w-px h-6 bg-indigo-500/30 mx-1"></div>
                
                <div id="archetype-cards-browser" class="flex flex-row justify-center lg:w-auto w-full"></div>
                
                <!-- Vertical Divider (Desktop) -->
                <div class="hidden lg:block w-px h-6 bg-indigo-500/30 mx-1"></div>
                
                <!-- Community Synergy Tags -->
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
                </div>
            </div>
            <!-- Glow effect behind (Desktop only) -->
            <div class="hidden lg:block absolute inset-0 bg-indigo-500/20 blur-xl -z-10 rounded-full opacity-50 pointer-events-none"></div>
        </div>

        <!-- Lore / Thematic Intro Section -->`;

let modifiedCount = 0;

for (const file of files) {
    const fp = path.join(pagesDir, file);
    let content = fs.readFileSync(fp, 'utf8');
    
    let idx1 = content.indexOf(startMarker1);
    if (idx1 === -1) idx1 = content.indexOf(startMarker2);
    
    const idx2 = content.indexOf(endMarker);
    
    if (idx1 !== -1 && idx2 !== -1) {
        let before = content.substring(0, idx1);
        let after = content.substring(idx2 + endMarker.length);
        
        content = before + newHtml + after;
        fs.writeFileSync(fp, content, 'utf8');
        modifiedCount++;
    }
}

console.log(`Modified ${modifiedCount} files.`);
