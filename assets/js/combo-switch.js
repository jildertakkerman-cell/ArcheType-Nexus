/*
 * Combo switch: shows one combo line at a time behind a row of buttons, instead of every line stacked.
 *
 * Markup: a container [data-combo-switch] whose direct children [data-combo-switch-panel] are the lines.
 *   data-combo-switch-label  on the container: the button group's accessible name ("Rokket combo lines")
 *   data-combo-switch-tag    on a line: the small label ("Line 1", "Going second")
 *   data-combo-switch-title  on a line: its short name ("Rokket Barrage Alone")
 *   --cs-accent              on the container (inline style): the page's accent colour
 *
 * Without JS every line stays visible, so the page still reads top to bottom (and the HTML combo audit,
 * which reads the static file, sees exactly what it saw before). The buttons are a group of toggle
 * buttons (aria-pressed), not an ARIA tablist, so page scripts that look up their own tab panel with
 * closest('[role="tabpanel"]') still find it.
 *
 * Links: a #hash that points inside a hidden line (on load, on hashchange, or an in-page link click)
 * switches to that line first.
 */
(function () {
    'use strict';
    if (window.ComboSwitch) return;

    var CSS = [
        '.cs-ready { display: block !important; }',
        '.cs-ready > [data-combo-switch-panel][hidden] { display: none !important; }',
        '.cs-bar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 1.25rem; padding: 0; }',
        '.cs-tab {',
        '  display: inline-flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 0.15rem;',
        '  min-height: 48px; max-width: 100%; margin: 0; padding: 0.5rem 0.95rem;',
        '  border: 1px solid color-mix(in srgb, currentColor 28%, transparent); border-radius: 0.75rem;',
        '  background: color-mix(in srgb, currentColor 6%, transparent); color: inherit;',
        '  font: inherit; text-align: left; cursor: pointer; transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;',
        '}',
        '.cs-tab:hover { border-color: color-mix(in srgb, var(--cs-accent, currentColor) 75%, transparent); }',
        '.cs-tab[aria-pressed="true"] {',
        '  border-color: var(--cs-accent, currentColor);',
        '  background: color-mix(in srgb, var(--cs-accent, currentColor) 18%, transparent);',
        '  box-shadow: inset 0 -3px 0 var(--cs-accent, currentColor);',
        '}',
        '.cs-tab:focus-visible { outline: 2px solid var(--cs-accent, currentColor); outline-offset: 2px; }',
        '.cs-tag { color: var(--cs-accent, currentColor); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; line-height: 1.3; text-transform: uppercase; }',
        '.cs-title { font-size: 0.88rem; font-weight: 700; line-height: 1.3; }',
        '.cs-tab[aria-pressed="false"] .cs-title { opacity: 0.85; }',
        '@media (max-width: 639px) {',
        '  .cs-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr)); }',
        '  .cs-tab { width: 100%; padding: 0.5rem 0.75rem; }',
        '  .cs-title { font-size: 0.8rem; }',
        '}',
        '@media print {',
        '  .cs-bar { display: none !important; }',
        '  .cs-ready > [data-combo-switch-panel][hidden] { display: block !important; }',
        '}'
    ].join('\n');

    function injectCss() {
        if (document.getElementById('combo-switch-css')) return;
        var style = document.createElement('style');
        style.id = 'combo-switch-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    var count = 0;
    var switches = [];

    function init(root) {
        if (!root || root.__comboSwitch) return root && root.__comboSwitch;
        var panels = Array.prototype.filter.call(root.children, function (el) {
            return el.hasAttribute('data-combo-switch-panel');
        });
        if (panels.length < 2) return null;
        injectCss();
        var uid = 'cs' + (++count);
        var bar = document.createElement('div');
        bar.className = 'cs-bar';
        bar.setAttribute('role', 'group');
        bar.setAttribute('aria-label', root.getAttribute('data-combo-switch-label') || 'Combo lines');

        var buttons = panels.map(function (panel, i) {
            if (!panel.id) panel.id = uid + '-line-' + (i + 1);
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cs-tab';
            btn.id = uid + '-btn-' + (i + 1);
            btn.setAttribute('aria-controls', panel.id);
            var tag = document.createElement('span');
            tag.className = 'cs-tag';
            tag.textContent = panel.getAttribute('data-combo-switch-tag') || ('Line ' + (i + 1));
            btn.appendChild(tag);
            var titleText = panel.getAttribute('data-combo-switch-title');
            if (titleText) {
                var title = document.createElement('span');
                title.className = 'cs-title';
                title.textContent = titleText;
                btn.appendChild(title);
            }
            btn.addEventListener('click', function () { api.select(i); });
            bar.appendChild(btn);
            return btn;
        });

        var current = -1;
        var api = {
            root: root,
            panels: panels,
            select: function (i) {
                if (i < 0 || i >= panels.length || i === current) return false;
                current = i;
                panels.forEach(function (panel, j) {
                    panel.hidden = j !== i;
                    buttons[j].setAttribute('aria-pressed', j === i ? 'true' : 'false');
                });
                root.dispatchEvent(new CustomEvent('comboswitch:change', { detail: { index: i, panel: panels[i] } }));
                return true;
            },
            indexOf: function (el) {
                for (var j = 0; j < panels.length; j++) if (panels[j] === el || panels[j].contains(el)) return j;
                return -1;
            }
        };
        root.__comboSwitch = api;
        root.insertBefore(bar, panels[0]);
        root.classList.add('cs-ready');
        var start = api.indexOf(hashTarget());
        api.select(start >= 0 ? start : 0);
        switches.push(api);
        return api;
    }

    function hashTarget() {
        if (!location.hash || location.hash.length < 2) return null;
        try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (err) { return null; }
    }

    // Shows every switch line that holds el (switches can sit inside other hidden panels). True if anything changed.
    function reveal(el) {
        var changed = false;
        var node = el;
        while (node) {
            var panel = node.closest ? node.closest('[data-combo-switch-panel]') : null;
            if (!panel) break;
            var root = panel.parentElement;
            var api = root && root.__comboSwitch;
            if (api && panel.hidden) changed = api.select(api.indexOf(panel)) || changed;
            node = root;
        }
        return changed;
    }

    function scrollToSoon(el) {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (!el || !el.getClientRects().length) return;
                el.scrollIntoView({ block: 'start' });
                // Keep it clear of a pinned guide-tabs bar (pages that set scroll-margin-top already are)
                var bar = document.querySelector('.gt-sticky');
                var cover = bar ? bar.getBoundingClientRect().bottom : 0;
                var top = el.getBoundingClientRect().top;
                if (cover > 0 && top < cover + 8) window.scrollBy(0, top - cover - 8);
            });
        });
    }

    function initAll() {
        var target = hashTarget();
        Array.prototype.forEach.call(document.querySelectorAll('[data-combo-switch]'), init);
        // Hiding the other lines moves the page under a hash target: put it back in view
        if (target && target.closest && target.closest('[data-combo-switch-panel]')) scrollToSoon(target);
    }

    // In-page links: switch lines before the page's own handlers and the browser scroll to the target
    document.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('a[href^="#"]');
        if (!link || link.hash.length < 2) return;
        var target = null;
        try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch (err) { return; }
        if (target) reveal(target);
    }, true);

    window.addEventListener('hashchange', function () {
        var target = hashTarget();
        if (target && reveal(target)) scrollToSoon(target);
    });

    window.ComboSwitch = { init: init, reveal: reveal, all: switches };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
    else initAll();
})();
