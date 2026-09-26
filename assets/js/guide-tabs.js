/**
 * Guide tabs for deck pages (WAI-ARIA tabs pattern, automatic activation).
 *
 * Markup: one [data-guide-tabs] tablist whose [role="tab"] buttons name
 * their panel through aria-controls, plus the [role="tabpanel"] panels.
 * The first tab is the default and keeps the URL clean; the others write
 * #<panel-id> so a tab can be linked to directly. A link to any element
 * inside a hidden panel opens that panel before scrolling to it.
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
 */
(function () {
    'use strict';

    function init(options) {
        const tablist = document.querySelector('[data-guide-tabs]');
        if (!tablist) return;
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const panelOf = tab => document.getElementById(tab.getAttribute('aria-controls'));
        const panelArt = Object.assign({}, options && options.panelArt);
        const panelInit = Object.assign({}, options && options.panelInit);

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

        function activate(tab, { focus = false, updateHash = true } = {}) {
            tabs.forEach(t => {
                const selected = t === tab;
                t.setAttribute('aria-selected', String(selected));
                t.tabIndex = selected ? 0 : -1;
                panelOf(t).hidden = !selected;
            });
            if (focus) tab.focus();
            if (updateHash) {
                const hash = tab === tabs[0] ? '' : '#' + tab.getAttribute('aria-controls');
                history.replaceState(history.state, '', location.pathname + location.search + hash);
            }
            loadPanelArt(tab.getAttribute('aria-controls'));
            runPanelInit(tab.getAttribute('aria-controls'));
        }

        tablist.addEventListener('click', e => {
            const tab = e.target.closest('[role="tab"]');
            if (tab) activate(tab);
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
            activate(next, { focus: true });
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
        }
        window.addEventListener('hashchange', openFromHash);
        openFromHash();
    }

    window.GuideTabs = { init: init };
})();
