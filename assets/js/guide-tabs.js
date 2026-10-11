/**
 * Guide tabs for deck pages (WAI-ARIA tabs pattern, automatic activation).
 *
 * Markup: one [data-guide-tabs] tablist whose [role="tab"] buttons name
 * their panel through aria-controls, plus the [role="tabpanel"] panels.
 * The first tab is the default and keeps the URL clean; the others write
 * #<panel-id> so a tab can be linked to directly. A link to any element
 * inside a hidden panel opens that panel before scrolling to it.
 *
 * On long pages the tab bar sticks to the top of the screen while its panels
 * are on screen, so readers (on phones above all) can switch without
 * scrolling back up. Switching from further down jumps to the top of the new
 * panel. Where the bar would run into the floating home button, the button
 * shrinks to fit inside the bar.
 *
 * Usage:
 *   GuideTabs.init({
 *       // Optional. Card art fetched the first time its panel opens, as
 *       // batches of CardLoader.loadCards() maps. Later batches reuse the
 *       // card data cached by earlier ones.
 *       panelArt: { 'tab-betb': [{ 'img-container-id': 'Card Name' }] },
 *       // Optional. Called once, the first time its panel opens, for widgets
 *       // that are expensive to build or need the panel to be visible.
 *       panelInit: { 'tab-betb': () => { ... } }
 *   });
 *
 * Pages with their own onclick tab switchers (onclick="switchTab('betb')",
 * about 55 deck pages, each written differently) get the same pinned bar and
 * phone layout from GuideTabs.enhanceOnclickTabs(), which leaves the
 * switching itself to the page. card-loader.js loads this file on those
 * pages, and it runs that by itself (see the end of this file).
 */
(function () {
    'use strict';

    // Shared by every page with tabs; each page keeps its own tab colours.
    const STICKY_CSS = `
        .gt-sticky {
            position: sticky;
            top: 0;
            z-index: 900;
            background: var(--gt-bg, rgba(12, 12, 18, 0.94));
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
            /* Full-bleed background behind the bar, without widening the page. */
            box-shadow: 0 0 0 100vmax var(--gt-bg, rgba(12, 12, 18, 0.94));
            clip-path: inset(0 -100vmax);
            padding-left: var(--gt-home-gap, 0px);
        }
        .gt-sticky [role="tab"],
        .gt-sticky [data-gt-tab] {
            padding-top: 0.4rem;
            padding-bottom: 0.4rem;
        }
        /* A pinned bar that wraps onto several rows on a phone (Endymion's three
           tabs) becomes one row of equal columns with smaller labels. */
        .gt-sticky.gt-compact[role="tablist"],
        .gt-sticky.gt-compact [role="tablist"],
        .gt-sticky.gt-compact[data-gt-row],
        .gt-sticky.gt-compact [data-gt-row] {
            display: grid;
            grid-template-columns: repeat(var(--gt-count), minmax(0, 1fr));
            gap: 4px;
        }
        .gt-sticky.gt-compact [role="tab"],
        .gt-sticky.gt-compact [data-gt-tab] {
            flex-direction: column;
            gap: 2px;
            width: auto;
            min-width: 0;
            margin: 0;
            padding: 0.3rem 0.25rem;
            font-size: 0.75rem;
            line-height: 1.2;
            letter-spacing: normal;
            white-space: normal;
            overflow-wrap: break-word;
        }
        .gt-sticky.gt-compact [role="tab"] > i,
        .gt-sticky.gt-compact [role="tab"] > svg,
        .gt-sticky.gt-compact [data-gt-tab] > i,
        .gt-sticky.gt-compact [data-gt-tab] > svg {
            display: none;
        }
        /* Phones: a tab row that wraps unevenly (two buttons, then one left alone)
           or runs off the side of the screen becomes even columns. Rows stacked
           one per line on purpose, or already even, keep their own layout. */
        @media (max-width: 639px) {
            [data-gt-row].gt-even {
                display: grid !important;
                grid-template-columns: repeat(var(--gt-cols), minmax(0, 1fr)) !important;
                gap: 0.4rem !important;
                justify-content: stretch !important;
                overflow: visible !important;
                width: auto !important;
                max-width: 100% !important;
            }
            [data-gt-row].gt-even > [data-gt-tab] {
                width: auto !important;
                min-width: 0 !important;
                max-width: none !important;
                margin: 0 !important;
                white-space: normal !important;
                overflow-wrap: break-word;
                text-align: center;
                justify-content: center;
            }
            [data-gt-row].gt-even > :not([data-gt-tab]) {
                grid-column: 1 / -1;
            }
        }
        /* No size animations while the bar pins or lets go, so it can be measured. */
        .gt-instant,
        .gt-instant * {
            transition: none !important;
        }
        body.gt-home-in-bar .ygo-home-button {
            top: 4px !important;
            width: 44px !important;
            height: 44px !important;
        }
    `;

    function addStyles() {
        if (document.querySelector('style[data-guide-tabs-style]')) return;
        const style = document.createElement('style');
        style.dataset.guideTabsStyle = '';
        style.textContent = STICKY_CSS;
        document.head.appendChild(style);
    }

    /** The page's own background colour, so a pinned bar matches light and dark pages. */
    function pageBackground() {
        for (const el of [document.body, document.documentElement]) {
            const bg = getComputedStyle(el).backgroundColor;
            const m = bg.match(/rgba?\(([^)]+)\)/);
            if (!m) continue;
            const [r, g, b, a = 1] = m[1].split(',').map(Number);
            if (a > 0) return `rgba(${r}, ${g}, ${b}, 0.94)`;
        }
        return '';
    }

    const NOT_STICKY = { stuck: false, update() {}, barHeight: () => 0, jumpToPanelTop() {} };

    /** Columns for an even layout of n tabs: 2 or 3 in one row, 4 as 2 × 2, 5–6 as rows of 3. */
    const columnsFor = n => (n <= 3 ? n : n === 4 ? 2 : 3);

    /**
     * Pin the tab bar to the top of the screen while the open panel is on
     * screen. Returns { stuck, update, barHeight, jumpToPanelTop }.
     * @param {Element} tablist - The element holding the tab buttons
     * @param {() => Element|null} activePanel - The panel that is open now
     * @param {number} count - How many tabs there are
     */
    function makeSticky(tablist, activePanel, count) {
        addStyles();
        // A bar inside its own narrow wrapper (Endymion's pill) can only stick
        // within that wrapper, so pin the outermost wrapper that sits beside
        // the panels instead.
        let bar = tablist;
        const panel0 = activePanel();
        while (panel0 && bar.parentElement && !bar.parentElement.contains(panel0)) bar = bar.parentElement;
        // ...but not a whole card of intro text around the buttons.
        if (bar !== tablist && bar.offsetHeight > tablist.offsetHeight + 60) return NOT_STICKY;

        const bg = pageBackground();
        if (bg) bar.style.setProperty('--gt-bg', bg);
        bar.style.setProperty('--gt-count', String(columnsFor(count)));
        const home = document.querySelector('.ygo-home-button');

        // Where the bar sits in the page, measured from the element above it (an
        // inserted marker would add an extra gap in flex and grid layouts).
        function reference() {
            let prev = bar.previousElementSibling;
            while (prev && (!prev.getClientRects().length || /absolute|fixed/.test(getComputedStyle(prev).position))) {
                prev = prev.previousElementSibling;
            }
            return prev ? { el: prev, edge: 'bottom' } : { el: bar.parentElement, edge: 'top' };
        }
        const refEdge = () => { const r = reference(); return r.el.getBoundingClientRect()[r.edge]; };
        let refOffset = bar.getBoundingClientRect().top - refEdge();
        const naturalTop = () => refEdge() + refOffset; // in viewport coordinates
        // Distance from there to whatever follows the bar, measured unpinned.
        // Margins can collapse into the next element's, so measure it rather
        // than adding up margins.
        const span = () => bar.nextElementSibling
            ? bar.nextElementSibling.getBoundingClientRect().top - naturalTop()
            : bar.offsetHeight;
        let naturalSpan = span();
        let stuck = false;
        let resized = false;
        let frame = 0;

        function update() {
            frame = 0;
            if (!stuck) refOffset = bar.getBoundingClientRect().top - refEdge();
            const panel = activePanel();
            const passed = naturalTop() < 0;
            const panelOnScreen = panel && panel.getBoundingClientRect().bottom > bar.offsetHeight + 48;
            const next = passed && !!panelOnScreen;
            if (next !== stuck || resized) {
                if (!stuck) naturalSpan = span();
                bar.classList.add('gt-instant');
                requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.remove('gt-instant')));
                stuck = next;
                bar.classList.toggle('gt-sticky', stuck);
                bar.classList.remove('gt-compact');
                if (stuck && window.innerWidth < 768 && bar.offsetHeight > 100) bar.classList.add('gt-compact');
                resized = false;
            }
            // Make room for the home button where the pinned bar would run into it.
            let gap = 0;
            if (stuck && home) {
                const box = bar.getBoundingClientRect();
                const left = parseFloat(getComputedStyle(home).left) || 0;
                if (left < box.left + 60 && left + 44 > box.left - 4) gap = Math.ceil(left + 44 + 8 - box.left);
            }
            bar.style.setProperty('--gt-home-gap', `${gap}px`);
            if (gap > 0) document.body.classList.add('gt-home-in-bar');
            else if (!document.querySelector('.gt-sticky')) document.body.classList.remove('gt-home-in-bar');
            // The pinned bar is shorter (tighter padding) or taller (room for the
            // home button) than in the page; the margin makes up the difference
            // so the text below doesn't jump when it pins.
            bar.style.marginBottom = stuck ? `${Math.max(0, naturalSpan - bar.offsetHeight)}px` : '';
        }

        const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', () => { resized = true; schedule(); });
        // A page's own hover/selected transitions can still change the bar's size.
        bar.addEventListener('transitionend', schedule);
        update();

        return {
            get stuck() { return stuck; },
            update,
            barHeight: () => bar.offsetHeight,
            // Back to where the bar sits in the page, so the new panel starts right below it.
            jumpToPanelTop() {
                window.scrollTo(0, naturalTop() + window.scrollY);
                update();
            }
        };
    }

    function init(options) {
        const tablist = document.querySelector('[data-guide-tabs]');
        if (!tablist) return;
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const panelOf = tab => document.getElementById(tab.getAttribute('aria-controls'));
        const panelArt = Object.assign({}, options && options.panelArt);
        const panelInit = Object.assign({}, options && options.panelInit);
        let activeTab = tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0];
        const sticky = makeSticky(tablist, () => panelOf(activeTab), tabs.length);

        async function loadPanelArt(panelId) {
            const batches = panelArt[panelId];
            if (!batches || !window.CardLoader) return;
            delete panelArt[panelId];
            for (const batch of batches) {
                await CardLoader.loadCards(batch);
            }
        }

        function runPanelInit(panelId) {
            const initPanel = panelInit[panelId];
            if (typeof initPanel !== 'function') return;
            delete panelInit[panelId];
            try {
                initPanel();
            } catch (err) {
                console.error('[GuideTabs] Panel init failed for #' + panelId, err);
            }
        }

        function activate(tab, { focus = false, updateHash = true, fromBar = false } = {}) {
            // Switching from further down the page starts the new panel at its top.
            const jump = fromBar && sticky.stuck && tab !== activeTab;
            activeTab = tab;
            tabs.forEach(t => {
                const selected = t === tab;
                t.setAttribute('aria-selected', String(selected));
                t.tabIndex = selected ? 0 : -1;
                panelOf(t).hidden = !selected;
            });
            if (jump) sticky.jumpToPanelTop();
            else sticky.update();
            if (focus) tab.focus({ preventScroll: true });
            if (updateHash) {
                const hash = tab === tabs[0] ? '' : '#' + tab.getAttribute('aria-controls');
                history.replaceState(history.state, '', location.pathname + location.search + hash);
            }
            loadPanelArt(tab.getAttribute('aria-controls'));
            runPanelInit(tab.getAttribute('aria-controls'));
        }

        tablist.addEventListener('click', e => {
            const tab = e.target.closest('[role="tab"]');
            if (tab) activate(tab, { fromBar: true });
        });

        tablist.addEventListener('keydown', e => {
            const i = tabs.indexOf(document.activeElement);
            if (i < 0) return;
            const next = {
                ArrowRight: tabs[(i + 1) % tabs.length],
                ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length],
                Home: tabs[0],
                End: tabs[tabs.length - 1]
            }[e.key];
            if (!next) return;
            e.preventDefault();
            activate(next, { focus: true, fromBar: true });
        });

        function openFromHash() {
            let target = null;
            try {
                target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            } catch (err) { /* malformed hash: ignore */ }
            // Step out of any nested tab widget (e.g. a card picker inside a guide
            // panel) to the panel that one of these tabs controls.
            let panel = target && target.closest('[role="tabpanel"]');
            while (panel && !tabs.some(t => t.getAttribute('aria-controls') === panel.id)) {
                panel = panel.parentElement && panel.parentElement.closest('[role="tabpanel"]');
            }
            const tab = panel && tabs.find(t => t.getAttribute('aria-controls') === panel.id);
            if (!tab) return;
            activate(tab, { updateHash: false });
            (target === panel ? tablist : target).scrollIntoView({ block: 'start' });
            if (target !== panel) {
                sticky.update();
                if (sticky.stuck) window.scrollBy(0, -(sticky.barHeight() + 8));
            }
        }
        window.addEventListener('hashchange', openFromHash);
        openFromHash();
    }

    // ---------- Pages with their own onclick tab switchers ----------

    // onclick="switchTab('betb')", "switchTab('tactics', 'tab-betb', this)",
    // "openComboTab(event, 'combo-seamare')", "showTab('new-combo', 'combo')"…
    const TAB_CALL = /\b(?!\w*Table)\w*Tab\w*\s*\(/;
    const quotedArgs = onclick => [...onclick.matchAll(/(['"])([^'"]+)\1/g)].map(m => m[2]);
    const PANEL_IDS = a => [a, `tab-${a}`, `${a}-tab`, `view-${a}`, `tab-content-${a}`, `${a}-content`,
        `content-${a}`, `panel-${a}`, `${a}-panel`, `${a}-section`];
    const isVisible = el => !!el && el.getClientRects().length > 0;

    /** Groups of 2+ tab buttons that make up most of one parent: the tab rows. */
    function findOnclickRows() {
        const buttons = [...document.querySelectorAll('[onclick]')]
            .filter(el => TAB_CALL.test(el.getAttribute('onclick')) && !el.closest('[data-guide-tabs]'));
        const byParent = new Map();
        buttons.forEach(b => {
            if (!byParent.has(b.parentElement)) byParent.set(b.parentElement, []);
            byParent.get(b.parentElement).push(b);
        });
        return [...byParent]
            .filter(([parent, list]) => list.length >= 2 && list.length >= parent.children.length * 2 / 3)
            .map(([row, list]) => ({ row, buttons: list }));
    }

    /**
     * Which panel each button opens, from the ids in its onclick: the first
     * argument position whose ids name a different element for every button.
     * Tries the usual id shapes ("betb", "tab-betb", "view-betb"…) first, then
     * any prefix shared by all of them ("combo-classic", "tab-gag-pp26",
     * "co-panel-meta", "anatomy-modern" for switchTab('anatomy', 'modern')).
     */
    function mapPanels(row, buttons) {
        const usable = el => el && !el.hasAttribute('data-gt-tab') && !el.contains(row) && !row.contains(el);
        const args = buttons.map(b => quotedArgs(b.getAttribute('onclick')).map(a => a.replace(/^#/, '')));
        const positions = Math.max(0, ...args.map(a => a.length));
        const distinct = panels => panels.every(Boolean) && new Set(panels).size === panels.length;
        for (let i = 0; i < positions; i++) {
            const names = args.map(list => list[i]);
            if (names.some(a => !a)) continue;
            const exact = names.map(a => PANEL_IDS(a).map(id => document.getElementById(id)).find(usable) || null);
            if (distinct(exact)) return exact;
            // Prefixes seen in front of the first button's name, tried on all of them.
            const prefixes = new Set([...document.querySelectorAll(`[id$="${CSS.escape(names[0])}"]`)]
                .filter(usable).map(el => el.id.slice(0, -names[0].length)));
            for (const prefix of prefixes) {
                const panels = names.map(a => document.getElementById(prefix + a)).map(el => (usable(el) ? el : null));
                if (distinct(panels)) return panels;
            }
        }
        return null;
    }

    /** Phones: even columns for a row that wraps unevenly or runs off the screen. */
    function layoutRow(row, buttons) {
        row.classList.remove('gt-even');
        if (window.innerWidth >= 640 || buttons.length > 6 || !isVisible(row)) return;
        const perLine = new Map();
        buttons.filter(isVisible).forEach(b => {
            const top = Math.round(b.getBoundingClientRect().top);
            perLine.set(top, (perLine.get(top) || 0) + 1);
        });
        const counts = [...perLine.values()];
        const ragged = counts.length > 1 && new Set(counts).size > 1;
        const overflows = row.scrollWidth > row.clientWidth + 2;
        if (!ragged && !overflows) return;
        row.style.setProperty('--gt-cols', String(columnsFor(buttons.length)));
        row.classList.add('gt-even');
    }

    function enhanceOnclickTabs() {
        if (document.documentElement.dataset.gtOnclickTabs) return;
        const rows = findOnclickRows();
        if (!rows.length) return;
        document.documentElement.dataset.gtOnclickTabs = '';
        addStyles();
        rows.forEach(r => {
            r.row.dataset.gtRow = '';
            r.buttons.forEach(b => { b.dataset.gtTab = ''; });
        });
        rows.forEach(r => { r.panels = mapPanels(r.row, r.buttons); });
        const allPanels = rows.flatMap(r => r.panels || []);

        rows.forEach(r => {
            // Only rows that aren't themselves inside another row's panel get pinned.
            // data-gt-pin records why (handy when checking a page).
            const nested = allPanels.some(p => p.contains(r.row));
            if (!r.panels || nested) {
                r.row.dataset.gtPin = nested ? 'nested' : 'no-panels';
                return;
            }
            const active = () => r.panels.find(isVisible) || null;
            // A row the page already pins itself (Wake CUP's "sticky top-4") keeps
            // that; it only gets the jump to the start of the new panel.
            if (/sticky|fixed/.test(getComputedStyle(r.row).position)) {
                r.row.dataset.gtPin = 'own-sticky';
                r.row.addEventListener('click', e => {
                    if (!e.target.closest('[data-gt-tab]')) return;
                    requestAnimationFrame(() => {
                        const panel = active();
                        if (!panel) return;
                        const hiddenBy = panel.getBoundingClientRect().top - r.row.getBoundingClientRect().bottom - 12;
                        if (hiddenBy < 0) window.scrollBy(0, hiddenBy);
                    });
                });
                return;
            }
            const sticky = makeSticky(r.row, active, r.buttons.length);
            r.row.dataset.gtPin = sticky === NOT_STICKY ? 'wrapper-too-tall' : 'yes';
            if (sticky === NOT_STICKY) return;
            let pinnedAtClick = false;
            // Capture runs before the page's own onclick, bubbling after it.
            r.row.addEventListener('click', () => { pinnedAtClick = sticky.stuck; }, true);
            r.row.addEventListener('click', e => {
                if (!e.target.closest('[data-gt-tab]')) return;
                // Switching from further down the page starts the new panel at its top.
                requestAnimationFrame(() => (pinnedAtClick ? sticky.jumpToPanelTop() : sticky.update()));
            });
        });

        const relayout = () => rows.forEach(r => layoutRow(r.row, r.buttons));
        relayout();
        let timer = 0;
        const later = () => { clearTimeout(timer); timer = setTimeout(relayout, 120); };
        window.addEventListener('resize', later);
        // Rows inside a panel that was hidden at load can only be measured once shown.
        document.addEventListener('click', e => { if (e.target.closest('[data-gt-tab]')) later(); });
        window.addEventListener('load', later);
    }

    window.GuideTabs = { init: init, enhanceOnclickTabs: enhanceOnclickTabs };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceOnclickTabs);
    else enhanceOnclickTabs();
})();
