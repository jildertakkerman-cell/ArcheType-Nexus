/**
 * Word hints for new players on deck pages.
 *
 * Finds glossary words in the page's reading text (paragraphs, list items, table cells)
 * and turns them into links to the Beginner's Guide glossary, with a dotted underline.
 * Hovering, focusing or tapping one opens a small card with the word's one-line
 * definition. Readers switch hints on and off with the "Hints" button this adds to the
 * deck page's dock (or "Hide word hints" on the card, or the guide's glossary toolbar);
 * the choice is kept in this browser ("nexus-word-hints").
 *
 * Loaded by card-loader.js on deck pages. The word list is assets/data/glossary-hints.json,
 * generated from the guide by scripts/beginners-guide/build-glossary-hints.js.
 *
 * Density: each word gets a hint the first time it appears in a section, at most twice
 * per page (once for very common words); a section gets at most MAX_PER_SECTION hints
 * and a page at most MAX_PER_PAGE, so they spread down the page.
 * Headings, links, buttons, card names, combo simulators, lore reels and edit boxes are
 * never touched. Suggested edits (page-sections.js) read plain text, so hints never end
 * up in them.
 */
(function () {
    'use strict';

    var STORE = 'nexus-word-hints';
    var MAX_PER_PAGE = 24;
    var MAX_PER_TERM = 2;
    var MAX_PER_SECTION = 4;
    // On for every deck page since 2026-10-06. Set ALL_PAGES to false to limit hints to the
    // PILOT pages again (?hints=on still previews them on any deck page).
    var ALL_PAGES = true;
    var PILOT = ['Floowandereeze', 'Swordsoul', 'Dark Magician', 'Blue-Eyes', 'Snake-Eyes'];

    if (window.__nexusWordHints) return;
    window.__nexusWordHints = true;

    var page = decodeURIComponent(location.pathname.split('/').pop() || '');
    var deckName = (page.match(/^(.+) Deck Analysis\.html$/) || [])[1];
    if (!deckName) return;
    var forced = /[?&]hints=on\b/.test(location.search);
    if (!ALL_PAGES && !forced && PILOT.indexOf(deckName) === -1) return;
    function hintsOff() {
        try { return localStorage.getItem(STORE) === 'off'; } catch (e) { return false; }
    }
    if (document.body && document.body.hasAttribute('data-glossary-hints-off')) return;
    // Off still adds the dock switch, so hints can be turned back on from any deck page.
    var startOn = forced || !hintsOff();

    var SCRIPT_BASE = (document.currentScript && document.currentScript.src) || '';
    var DATA_URL = SCRIPT_BASE ? new URL('../data/glossary-hints.json', SCRIPT_BASE).href : '../assets/data/glossary-hints.json';

    // Never hint inside these.
    var SKIP = [
        'a', 'button', '[role="button"]', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'th', 'summary', 'label',
        'code', 'pre', 'script', 'style', 'noscript', 'textarea', 'input', 'select', 'svg', 'nav', 'header', 'footer',
        '[contenteditable]', '[data-cardname]', '.card-ref', '.text-accent', '.card-placeholder', '.card-image-container',
        '[id$="-img-container"]', '[data-combo-system]', '.combo-container', '#community-combos-wrapper',
        '[data-lore-reel]', '.lore-reel', '.pcs-toolbar', '.pcs-hist-item', '.pcs-editor', '.ai-combo-warning',
        '#banlist-status', '.cc-banner', '.cc-preferences', '.nx-hint-pop', '[data-glossary-skip]'
    ].join(', ');
    // Only text whose block is one of these is reading text.
    var BLOCKS = 'p, li, td, dd, blockquote, figcaption';

    var terms = [];
    var forms = {};      // exact text -> { term, sentenceOnly }
    var matcher = null;
    var used = {};       // term id -> hints placed
    var sectionsUsed = {};  // term id -> sections it already has a hint in
    var placed = 0;
    var perSection = {};    // section key -> hints placed in it
    var busy = false;

    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function buildMatcher() {
        var all = [];
        terms.forEach(function (t) {
            t.forms.forEach(function (f) {
                forms[f] = { term: t, sentenceOnly: false };
                all.push(f);
                // A lowercase form may open a sentence with a capital letter.
                if (/^[a-z]/.test(f)) {
                    var cap = f.charAt(0).toUpperCase() + f.slice(1);
                    if (!forms[cap]) {
                        forms[cap] = { term: t, sentenceOnly: true };
                        all.push(cap);
                    }
                }
            });
        });
        all.sort(function (a, b) { return b.length - a.length; });
        matcher = new RegExp(all.map(escapeRe).join('|'), 'g');
    }

    function isWordChar(ch) { return !!ch && /[A-Za-z0-9\-'’]/.test(ch); }

    // Start of the text, or after a full stop, colon, bullet and the like.
    function sentenceBoundary(text, index) {
        var before = text.slice(0, index);
        return /^\s*$/.test(before) || /[.!?:;·•|]\s+$/.test(before);
    }

    // Where a lowercase word may be written with a capital: a sentence start, or just
    // inside an opening bracket or quote ("“Brick” hands").
    function atSentenceStart(text, index) {
        return sentenceBoundary(text, index) || /[(“"‘]\s*$/.test(text.slice(0, index));
    }

    // Title Case runs are usually card or product names: "Swordsoul Token", "Adventurer
    // Token" (even inside quotes), "Resolve Bastion", "Starter Deck: Yugi". A capitalised
    // word followed by another one only counts as a word on its own when that pair is a
    // label ending in a colon ("Floodgate Vulnerability: ...").
    var NAME_STARTS = ['Starter Deck'];
    function looksLikeCardName(text, index, match) {
        if (NAME_STARTS.some(function (n) { return text.substr(index, n.length) === n; })) return true;
        if (!/^[A-Z][a-z]/.test(match)) return false;
        var m = text.slice(0, index).match(/([A-Z][a-z][\w'’-]*)\s+$/);
        if (m && !sentenceBoundary(text, index - m[0].length)) return true;
        var after = text.slice(index + match.length).match(/^\s+[A-Z][a-z][\w'’-]*(\s*:)?/);
        return !!after && !after[1] && forms[match] && forms[match].sentenceOnly;
    }

    // Story text uses words like "burn" and "spin" in their everyday sense.
    var loreCache = new WeakMap();
    function inLoreSection(el) {
        var section = el.closest('section');
        if (!section) return false;
        if (!loreCache.has(section)) {
            var heading = section.querySelector('h1, h2, h3');
            loreCache.set(section, !!heading && /^\s*lore\b/i.test(heading.textContent));
        }
        return loreCache.get(section);
    }

    function sectionOf(node) {
        var el = node.parentElement;
        return (el && el.closest('section, article, [role="tabpanel"], .tab-content')) || document.body;
    }

    function sectionKey(section) {
        if (!section.__nxHintKey) section.__nxHintKey = 's' + Math.random().toString(36).slice(2);
        return section.__nxHintKey;
    }

    function allowed(term, key) {
        if ((perSection[key] || 0) >= MAX_PER_SECTION) return false;
        var max = term.max || MAX_PER_TERM;
        if ((used[term.id] || 0) >= max) return false;
        var seen = sectionsUsed[term.id] || [];
        return seen.indexOf(key) === -1;
    }

    function hintLink(term, text) {
        var a = document.createElement('a');
        a.className = 'nx-hint';
        a.href = 'Beginners-Guide.html#term-' + term.id;
        a.dataset.term = term.id;
        a.textContent = text;
        return a;
    }

    function linkTextNode(node) {
        var text = node.nodeValue;
        if (!text || text.length < 2) return;
        var key = sectionKey(sectionOf(node));
        matcher.lastIndex = 0;
        var m, pieces = [], last = 0;
        while ((m = matcher.exec(text)) && placed < MAX_PER_PAGE) {
            var word = m[0], i = m.index;
            var info = forms[word];
            if (!info) continue;
            if (isWordChar(text.charAt(i - 1)) || isWordChar(text.charAt(i + word.length))) continue;
            if (info.sentenceOnly && !atSentenceStart(text, i)) continue;
            if (looksLikeCardName(text, i, word)) continue;
            if (!allowed(info.term, key)) continue;
            used[info.term.id] = (used[info.term.id] || 0) + 1;
            (sectionsUsed[info.term.id] = sectionsUsed[info.term.id] || []).push(key);
            perSection[key] = (perSection[key] || 0) + 1;
            placed++;
            pieces.push([i, word, info.term]);
        }
        if (!pieces.length) return;
        var frag = document.createDocumentFragment();
        pieces.forEach(function (p) {
            if (p[0] > last) frag.appendChild(document.createTextNode(text.slice(last, p[0])));
            frag.appendChild(hintLink(p[2], p[1]));
            last = p[0] + p[1].length;
        });
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
    }

    function scan(root) {
        if (!matcher || placed >= MAX_PER_PAGE) return;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (n) {
                var el = n.parentElement;
                if (!el || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                if (!el.closest(BLOCKS) || el.closest(SKIP) || inLoreSection(el)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        busy = true;
        nodes.forEach(function (n) { if (placed < MAX_PER_PAGE && n.parentNode) linkTextNode(n); });
        busy = false;
    }

    // ---------- Definition card ----------
    var pop = null, current = null, hideTimer = null, opened = {};
    var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function injectStyle() {
        if (document.getElementById('nx-hint-style')) return;
        var css = document.createElement('style');
        css.id = 'nx-hint-style';
        css.textContent = [
            'a.nx-hint.nx-hint { color: inherit !important; background: none !important; font-weight: inherit !important;',
            '  text-decoration: underline dotted rgba(245, 158, 11, 0.55) !important; text-decoration-thickness: 1px !important;',
            '  text-underline-offset: 0.2em; cursor: help; }',
            'a.nx-hint.nx-hint:hover, a.nx-hint.nx-hint[aria-expanded="true"] { text-decoration-color: #f59e0b !important; }',
            'a.nx-hint.nx-hint:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; border-radius: 2px; }',
            '.nx-hint-pop { position: absolute; z-index: 99990; width: min(20rem, calc(100vw - 24px)); padding: 0.85rem 0.95rem 0.8rem;',
            '  color: #e5e7eb; background: #12141b; border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 0.75rem;',
            '  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55); font: 400 0.9rem/1.45 Inter, system-ui, sans-serif; text-align: left; }',
            '.nx-hint-pop[hidden] { display: none; }',
            '.nx-hint-pop.is-sheet { position: fixed; left: 12px !important; right: 12px; bottom: 12px; top: auto !important; width: auto; }',
            '.nx-hint-pop__cat { margin: 0 0 0.15rem; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #fbbf24; }',
            '.nx-hint-pop__name { margin: 0 0 0.3rem; font-size: 1rem; font-weight: 800; color: #fff; }',
            '.nx-hint-pop__short { margin: 0 0 0.6rem; color: #d1d5db; }',
            '.nx-hint-pop__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.4rem 1rem; }',
            '.nx-hint-pop__more { font-size: 0.85rem; font-weight: 700; color: #fbbf24 !important; text-decoration: underline; }',
            '.nx-hint-pop__off { padding: 0; font: inherit; font-size: 0.78rem; color: #9ca3af; background: none; border: 0; text-decoration: underline; cursor: pointer; }',
            '.nx-hint-pop__off:hover { color: #e5e7eb; }',
            '.nx-hint-pop__close { position: absolute; top: 0.35rem; right: 0.45rem; width: 1.8rem; height: 1.8rem; padding: 0; font-size: 1.1rem; line-height: 1;',
            '  color: #9ca3af; background: none; border: 0; cursor: pointer; }',
            '.nx-hint-toast { position: fixed; z-index: 99990; left: 50%; bottom: 20px; transform: translateX(-50%); max-width: calc(100vw - 24px);',
            '  padding: 0.65rem 0.9rem; color: #e5e7eb; background: #12141b; border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 0.6rem;',
            '  font: 400 0.88rem/1.4 Inter, system-ui, sans-serif; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.5); }',
            '.nx-hint-toast a { color: #fbbf24; }',
            // The dock switch: a round chip like its neighbours on phones, a pill with a label on desktop.
            '#word-hints-dock .nx-dock-btn { padding: 0; font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }',
            '#word-hints-dock .nx-dock-chip { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2.5rem; height: 2.5rem;',
            '  border-radius: 9999px; color: #fbbf24; background: #1e293b; border: 1px solid rgba(99, 102, 241, 0.3);',
            '  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); font: 800 0.95rem/1 Inter, system-ui, sans-serif;',
            '  text-decoration: underline dotted; text-underline-offset: 3px; transition: background 0.3s, color 0.3s; }',
            '#word-hints-dock .nx-dock-btn.is-off .nx-dock-chip { color: #94a3b8; text-decoration: line-through; }',
            // Hover colours only where there's a real hover, so a tap doesn't leave the chip lit.
            '@media (hover: hover) {',
            '  #word-hints-dock .nx-dock-btn:hover .nx-dock-chip { color: #111827; background: #f59e0b; }',
            '  #word-hints-dock .nx-dock-btn:hover .nx-dock-label { color: #fff; }',
            '}',
            '#word-hints-dock .nx-dock-btn:focus-visible .nx-dock-chip { color: #111827; background: #f59e0b; }',
            '#word-hints-dock .nx-dock-btn:focus-visible { outline: 2px solid #f59e0b; outline-offset: 2px; }',
            '#word-hints-dock .nx-dock-label { display: none; font-weight: 600; color: #d1d5db; white-space: nowrap; }',
            // Phones and tablets pin the dock to the bottom: keep the message above it.
            '@media (max-width: 1023.98px) { body:has(#deck-resources-compact) .nx-hint-toast { bottom: 76px; } }',
            '@media (min-width: 1024px) {',
            '  #word-hints-dock { width: auto; margin-top: 0; }',
            '  #word-hints-dock .nx-dock-btn { width: auto; padding: 0.3rem 0.85rem 0.3rem 0.4rem; gap: 0.5rem; border-radius: 9999px; }',
            '  #word-hints-dock .nx-dock-chip { width: 2rem; height: 2rem; border: none; box-shadow: none; font-size: 0.85rem; }',
            '  #word-hints-dock .nx-dock-label { display: inline-block; font-size: 0.875rem; }',
            '}'
        ].join('\n');
        document.head.appendChild(css);
    }

    function track(name, params) {
        try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) { }
    }

    function buildPop() {
        pop = document.createElement('div');
        pop.className = 'nx-hint-pop';
        pop.hidden = true;
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', 'Word definition');
        pop.innerHTML =
            '<button type="button" class="nx-hint-pop__close" aria-label="Close">&times;</button>' +
            '<p class="nx-hint-pop__cat"></p><p class="nx-hint-pop__name"></p><p class="nx-hint-pop__short" id="nx-hint-short"></p>' +
            '<div class="nx-hint-pop__foot"><a class="nx-hint-pop__more" href="Beginners-Guide.html">Full entry in the Beginner\'s Guide</a>' +
            '<button type="button" class="nx-hint-pop__off">Hide word hints</button></div>';
        document.body.appendChild(pop);
        pop.querySelector('.nx-hint-pop__close').addEventListener('click', function () { hide(true); });
        pop.querySelector('.nx-hint-pop__off').addEventListener('click', function () { turnOff('card'); });
        pop.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
        pop.addEventListener('mouseleave', function () { scheduleHide(); });
    }

    function place(link) {
        var sheet = window.innerWidth <= 640;
        pop.classList.toggle('is-sheet', sheet);
        if (sheet) { pop.style.left = ''; pop.style.top = ''; return; }
        var r = link.getBoundingClientRect();
        var w = pop.offsetWidth, h = pop.offsetHeight;
        var left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
        var below = r.bottom + 8;
        var top = (below + h > window.innerHeight - 8 && r.top - h - 8 > 8) ? r.top - h - 8 : below;
        pop.style.left = (left + window.scrollX) + 'px';
        pop.style.top = (top + window.scrollY) + 'px';
    }

    function show(link) {
        var term = terms.filter(function (t) { return t.id === link.dataset.term; })[0];
        if (!term) return;
        if (!pop) buildPop();
        clearTimeout(hideTimer);
        if (current && current !== link) current.setAttribute('aria-expanded', 'false');
        current = link;
        pop.querySelector('.nx-hint-pop__cat').textContent = categories[term.cat] || '';
        pop.querySelector('.nx-hint-pop__name').textContent = term.name;
        pop.querySelector('.nx-hint-pop__short').textContent = term.short;
        pop.querySelector('.nx-hint-pop__more').href = link.getAttribute('href');
        pop.hidden = false;
        link.setAttribute('aria-expanded', 'true');
        link.setAttribute('aria-describedby', 'nx-hint-short');
        place(link);
        if (!opened[term.id]) {
            opened[term.id] = true;
            track('word_hint_open', { term: term.id, deck: deckName });
        }
    }

    function hide(returnFocus) {
        if (!pop || pop.hidden) return;
        pop.hidden = true;
        if (current) {
            current.setAttribute('aria-expanded', 'false');
            current.removeAttribute('aria-describedby');
            if (returnFocus) current.focus();
        }
        current = null;
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { hide(false); }, 220);
    }

    function unwrapAll() {
        Array.prototype.forEach.call(document.querySelectorAll('a.nx-hint'), function (a) {
            a.replaceWith(document.createTextNode(a.textContent));
        });
        document.body.normalize();
    }

    var toastEl = null, toastTimer = null;
    function toast(html, ms) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'nx-hint-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.innerHTML = html;
        toastEl.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.hidden = true; }, ms || 3000);
    }

    // ---------- On and off ----------
    var active = false, eventsBound = false, dataPromise = null;

    function loadData() {
        if (!dataPromise) {
            dataPromise = fetch(DATA_URL).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); }).then(function (data) {
                terms = data.terms || [];
                categories = data.categories || {};
                if (terms.length) buildMatcher();
            });
        }
        return dataPromise;
    }

    // from: what the reader used ('dock'), or null when the page starts with hints on.
    function turnOn(from) {
        active = true;
        renderDock();
        if (from) {
            try { localStorage.removeItem(STORE); } catch (e) { }
            track('word_hints_on', { from: from, deck: deckName });
            toast('Word hints on: jargon is underlined, tap or hover a word for its meaning.');
        }
        loadData().then(function () {
            if (!active || !matcher) return;
            used = {}; sectionsUsed = {}; perSection = {}; placed = 0;
            scan(document.body);
            if (!eventsBound) { bindEvents(); eventsBound = true; }
            watch();
            document.documentElement.setAttribute('data-word-hints', String(placed));
        }).catch(function () { });
    }

    function turnOff(from) {
        active = false;
        try { localStorage.setItem(STORE, 'off'); } catch (e) { }
        track('word_hints_off', { from: from, deck: deckName });
        hide(false);
        unwrapAll();
        if (observer) observer.disconnect();
        document.documentElement.setAttribute('data-word-hints', 'off');
        renderDock();
        toast(dockBtn
            ? 'Word hints off. Turn them back on with the <strong>Aa</strong> Hints button.'
            : 'Word hints off. Turn them back on in the <a href="Beginners-Guide.html#glossary">Beginner\'s Guide glossary</a>.', 5000);
    }

    // The switch in the deck page's dock (Meta Decks, Cards, Synergies...). It matches the
    // neighbouring items: their Tailwind layout classes plus the styles in injectStyle().
    var dockBtn = null;
    function addDockSwitch() {
        var resources = document.getElementById('deck-resources-compact');
        var nav = resources && resources.parentElement;
        if (!nav || document.getElementById('word-hints-dock')) return;
        var wrap = document.createElement('div');
        wrap.id = 'word-hints-dock';
        wrap.className = 'flex flex-row lg:flex-col justify-center lg:items-stretch w-full lg:w-auto mt-0 lg:mt-2';
        wrap.innerHTML = '<button type="button" class="nx-dock-btn group flex items-center justify-center lg:justify-start gap-3 w-full transition-colors">' +
            '<span class="nx-dock-chip" aria-hidden="true">Aa</span><span class="nx-dock-label"></span></button>';
        nav.appendChild(wrap);
        dockBtn = wrap.querySelector('button');
        dockBtn.addEventListener('click', function () {
            if (active) turnOff('dock'); else turnOn('dock');
        });
        renderDock();
    }

    function renderDock() {
        if (!dockBtn) return;
        dockBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
        dockBtn.setAttribute('aria-label', 'Word hints');
        dockBtn.title = active
            ? 'Word hints are on: jargon is underlined with its meaning. Click to turn them off.'
            : 'Word hints are off. Click to underline jargon with its meaning.';
        dockBtn.classList.toggle('is-off', !active);
        dockBtn.querySelector('.nx-dock-label').textContent = active ? 'Hints on' : 'Hints off';
    }

    function bindEvents() {
        document.addEventListener('mouseover', function (e) {
            if (!canHover) return;
            var link = e.target.closest && e.target.closest('a.nx-hint');
            if (link) { clearTimeout(hideTimer); hideTimer = setTimeout(function () { show(link); }, 120); }
        });
        document.addEventListener('mouseout', function (e) {
            if (!canHover) return;
            var link = e.target.closest && e.target.closest('a.nx-hint');
            if (link && !(e.relatedTarget && pop && pop.contains(e.relatedTarget))) scheduleHide();
        });
        document.addEventListener('focusin', function (e) {
            var link = e.target.closest && e.target.closest('a.nx-hint');
            if (link) show(link);
            else if (pop && !pop.contains(e.target)) hide(false);
        });
        // Touch: the first tap shows the definition; the card's link goes to the full entry.
        document.addEventListener('click', function (e) {
            var link = e.target.closest && e.target.closest('a.nx-hint');
            if (link) {
                if (canHover && !e.detail) return; // keyboard Enter follows the link
                if (!canHover || current !== link || pop.hidden) {
                    e.preventDefault();
                    show(link);
                }
                return;
            }
            if (pop && !pop.hidden && !pop.contains(e.target)) hide(false);
        }, true);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && pop && !pop.hidden) hide(true);
        });
        window.addEventListener('resize', function () { if (current && pop && !pop.hidden) place(current); });
    }

    // Sections that page-sections.js re-renders later (approved edits) get hints too.
    var observer = null, pending = [], pendingTimer = null;
    function watch() {
        if (!('MutationObserver' in window)) return;
        if (!observer) observer = new MutationObserver(function (records) {
            if (busy || !active || placed >= MAX_PER_PAGE) return;
            records.forEach(function (r) {
                Array.prototype.forEach.call(r.addedNodes, function (n) {
                    if (n.nodeType === 1 && !n.closest('.nx-hint-pop') && !n.classList.contains('nx-hint')) pending.push(n);
                });
            });
            if (!pending.length) return;
            clearTimeout(pendingTimer);
            pendingTimer = setTimeout(function () {
                var nodes = pending.splice(0);
                nodes.forEach(function (n) { if (n.isConnected) scan(n); });
            }, 400);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    var categories = {};
    function start() {
        injectStyle();
        addDockSwitch();
        if (startOn) turnOn(null);
        else {
            renderDock();
            document.documentElement.setAttribute('data-word-hints', 'off');
        }
    }

    // After the page and its own scripts have settled.
    function later() {
        if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 });
        else setTimeout(start, 800);
    }
    if (document.readyState === 'complete') later();
    else window.addEventListener('load', later);
})();
