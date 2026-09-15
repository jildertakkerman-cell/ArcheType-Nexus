/**
 * deck-dock.js — the archetype page sidebar (desktop) / bottom bar (mobile):
 * Deck Resources, the card browser, and the Community Synergies popover.
 *
 * This is the single source for that markup. Pages used to paste ~35 lines of
 * it by hand, which drifted into several variants and, on some pages, several
 * stacked copies. Now a page only needs a placeholder where the bar belongs:
 *
 *   <script src="../assets/js/deck-dock.js" defer></script>   (in <head>)
 *   ...
 *   <div id="deck-dock"></div>
 *
 * The placeholder is replaced with the <nav> below before DOMContentLoaded
 * (deferred scripts run first), so the page's own startup code —
 * CardLoader.renderDeckResourcesCompact('deck-resources-compact', ...),
 * CardLoader.renderArchetypeCardsBrowser('archetype-cards-browser', ...) and
 * initSynergyTags(...) — finds the same ids it always did.
 *
 * Optional colour theme (see DOCK_THEMES below), e.g. Speedroid's green bar:
 *
 *   <div id="deck-dock" data-dock-theme="emerald"></div>
 *
 * Pages that still carry the pasted markup are left alone: if
 * #synergy-dock-wrap already exists, placeholders are just removed, so the
 * bar is never rendered twice.
 *
 * Keep the <nav> structure in sync with assets/css/synergy-tags.css, which
 * styles it via `nav:has(> #deck-resources-compact)`. Tailwind picks up the
 * classes here because tailwind.config.js scans assets/js/*.js.
 */
(function () {
    const DOCK_HTML = `
        <nav class="fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-around p-2 bg-[#0d121c]/95 backdrop-blur-md border-t border-indigo-500/20 shadow-[0_-8px_30px_rgb(0,0,0,0.5)] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-4 lg:right-auto lg:flex-col lg:p-4 lg:gap-4 lg:rounded-2xl lg:border lg:border-indigo-500/30 lg:bg-[#0f172a]/90 lg:w-48 lg:items-stretch lg:justify-start">
            <div id="deck-resources-compact" class="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 lg:gap-3 w-full lg:w-auto justify-around lg:justify-start"></div>

            <div id="archetype-cards-browser" class="flex flex-row lg:flex-col justify-center lg:items-stretch w-full lg:w-auto mt-0 lg:mt-2"></div>

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
        </nav>`;

    // Per-theme Tailwind class swaps (default class -> themed class). Full class
    // names only, so Tailwind's content scan of this file generates them. On
    // desktop synergy-tags.css restyles the bar itself, so the bar colours
    // mostly show on the mobile dock; the Synergies chip is themed on both.
    const DOCK_THEMES = {
        emerald: {
            'bg-[#0d121c]/95': 'bg-[#0d1712]/95',
            'border-indigo-500/20': 'border-emerald-500/20',
            'lg:border-indigo-500/30': 'lg:border-emerald-500/30',
            'lg:bg-[#0f172a]/90': 'lg:bg-[#0f1f17]/90',
            'bg-[#1e293b]': 'bg-[#12261c]',
            'border-indigo-500/30': 'border-emerald-500/30'
        }
    };

    function themed(html, themeName) {
        const swaps = DOCK_THEMES[themeName];
        if (!swaps) {
            if (themeName) console.warn(`[DeckDock] unknown data-dock-theme "${themeName}" — using the default bar.`);
            return html;
        }
        return html.replace(/class="([^"]*)"/g, (_, classes) =>
            `class="${classes.split(' ').map(c => swaps[c] || c).join(' ')}"`);
    }

    function mount() {
        const placeholders = document.querySelectorAll('#deck-dock');
        if (!placeholders.length) return;

        // Pasted markup already on the page (or a second placeholder after the
        // first was mounted) — drop the placeholders rather than duplicate ids.
        if (document.getElementById('synergy-dock-wrap')) {
            placeholders.forEach(p => p.remove());
            return;
        }

        const tpl = document.createElement('template');
        tpl.innerHTML = themed(DOCK_HTML.trim(), placeholders[0].dataset.dockTheme);
        placeholders[0].replaceWith(tpl.content);
        for (let i = 1; i < placeholders.length; i++) placeholders[i].remove();
    }

    // Read by scripts/convert-to-deck-dock.js to recognise pasted copies of this markup.
    window.DeckDock = {
        markup: themeName => themed(DOCK_HTML.trim(), themeName),
        themes: Object.keys(DOCK_THEMES)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
