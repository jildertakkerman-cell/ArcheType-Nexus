/* "Claims checked against the cards" tables on deck pages (Magnificent Maestros tabs and later).
   Markup contract: <table data-claims-table> with one row per claim, cells in the order
   claim | verdict | what the cards say, the verdict in a badge whose class ends in a tone modifier
   (--no / -v-no, --part / --mid / -v-part, --ok / --yes / -v-yes, --unk / --ocg / --na).
   This script gives every verdict the same tone icon (some pages had text only) and adds a bar above
   the table that counts the verdicts and filters the rows. Layout lives in assets/css/claims-check.css;
   without this script the table still reads top to bottom. */
(function () {
    'use strict';

    var TONES = [
        { key: 'wrong', label: 'Wrong', icon: 'fa-times', glyph: '✕' },
        { key: 'partly', label: 'Partly right', icon: 'fa-adjust', glyph: '◐' },
        { key: 'right', label: 'Right', icon: 'fa-check', glyph: '✓' },
        { key: 'unproven', label: 'Unproven', icon: 'fa-question', glyph: '?' }
    ];
    // Verdicts that mean "nobody has shown this either way", whatever colour the page gave them.
    var UNPROVEN_TEXT = /\b(no source|not sourced|no evidence|unproven|unconfirmed|no tcg data|anime only|speculation)\b/i;

    function toneOf(badge) {
        var text = (badge.textContent || '').trim();
        if (UNPROVEN_TEXT.test(text)) return 'unproven';
        var cls = ' ' + (typeof badge.className === 'string' ? badge.className : '') + ' ';
        if (/(--|-v-)no\b/.test(cls)) return 'wrong';
        if (/(--|-v-)(part|mid)\b/.test(cls)) return 'partly';
        if (/(--|-v-)(ok|yes)\b/.test(cls)) return 'right';
        if (/(--|-v-)(unk|ocg|na)\b/.test(cls)) return 'unproven';
        if (/^(wrong|false|no\b|missed|backwards|forbidden|not\b|outdated|out of date|too harsh)/i.test(text)) return 'wrong';
        if (/^(right|true|yes|holds)/i.test(text)) return 'right';
        return 'partly';
    }

    function hasFontAwesome() {
        return !!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], script[src*="fontawesome"]');
    }

    function addIcon(badge, tone, useFa) {
        if (badge.querySelector('i, svg, [data-cc-icon]')) return;
        var def = TONES.filter(function (t) { return t.key === tone; })[0];
        var icon;
        if (useFa) {
            icon = document.createElement('i');
            icon.className = 'fas ' + def.icon;
        } else {
            icon = document.createElement('span');
            icon.textContent = def.glyph;
        }
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('data-cc-icon', '');
        // Spacing comes from CSS, not a text node, so the section's text (which page-sections.js
        // reads for suggested edits) stays exactly as written.
        badge.insertBefore(icon, badge.firstChild);
    }

    // Short answer first: the first sentence of each explanation stays in view (it is nearly always
    // the correction itself), the rest folds behind a "More" toggle. The split only wraps existing
    // nodes in a span and the toggle's label comes from CSS, so the cell's text is unchanged; that
    // text is what page-sections.js turns into the suggest-edit draft.
    // "." and "?" only: "!" sits inside names here ("Yu-Gi-Oh! ZEXAL", "Bingo Machine, Go!!!").
    var SENTENCE_END = /[.?]["”’')\]]?\s+(?=["“‘(]?[A-Z0-9])/g;
    var MIN_SHORT = 10;   // "It's Level 4." is a complete answer...
    var MIN_WORDS = 3;    // ...but "Konami's FAQ." isn't, so it takes the next sentence along
    var MIN_REST = 25;    // fold only when there is a real second thought behind the toggle

    function splitDetails(cell) {
        if (cell.querySelector('p, ul, ol, div, table, br, .cc-rest')) return null;
        var text = cell.textContent;
        var seen = 0;
        for (var i = 0; i < cell.childNodes.length; i++) {
            var node = cell.childNodes[i];
            // Only cut inside a text node directly in the cell, so no link or card name is split.
            if (node.nodeType === 3) {
                SENTENCE_END.lastIndex = 0;
                var m;
                while ((m = SENTENCE_END.exec(node.data))) {
                    var cut = m.index + m[0].length;
                    var lead = text.slice(0, seen + cut).trim();
                    if (lead.length < MIN_SHORT || lead.split(/\s+/).length < MIN_WORDS) continue;
                    if (text.slice(seen + cut).trim().length < MIN_REST) return null;
                    var range = document.createRange();
                    range.setStart(node, cut);
                    range.setEnd(cell, cell.childNodes.length);
                    var rest = document.createElement('span');
                    rest.className = 'cc-rest';
                    rest.appendChild(range.extractContents());
                    cell.appendChild(rest);
                    return rest;
                }
            }
            seen += node.textContent.length;
        }
        return null;
    }

    function setOpen(row, open) {
        if (!row._ccRest) return;
        row._ccRest.hidden = !open;
        row._ccToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        row._ccToggle.setAttribute('aria-label', (open ? 'Hide' : 'Show') + ' the rest of this explanation');
        if (open) row.setAttribute('data-cc-open', '');
        else row.removeAttribute('data-cc-open');
    }

    function build(table, index, useFa) {
        var body = table.tBodies[0];
        if (!body) return;
        var rows = Array.prototype.slice.call(body.rows).filter(function (r) { return r.cells.length >= 3; });
        if (!rows.length) return;

        var counts = {};
        var colours = {};
        var folded = [];
        rows.forEach(function (row) {
            var cell = row.cells[1];
            var badge = cell.querySelector('span, strong, b, em') || cell;
            var tone = toneOf(badge);
            row.setAttribute('data-cc-tone', tone);
            counts[tone] = (counts[tone] || 0) + 1;
            if (!colours[tone] && badge !== cell) colours[tone] = getComputedStyle(badge).color;
            if (badge !== cell) addIcon(badge, tone, useFa);

            var rest = splitDetails(row.cells[2]);
            if (!rest) return;
            var toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'cc-more-btn';
            row.cells[2].appendChild(toggle);
            row._ccRest = rest;
            row._ccToggle = toggle;
            toggle.addEventListener('click', function () {
                setOpen(row, toggle.getAttribute('aria-expanded') !== 'true');
            });
            setOpen(row, false);
            folded.push(row);
        });
        if (folded.length) table.setAttribute('data-cc-folded', '');

        var present = TONES.filter(function (t) { return counts[t.key]; });
        if (rows.length < 4 || present.length < 2) return;

        var bar = document.createElement('div');
        bar.className = 'cc-claims-bar';
        bar.setAttribute('role', 'group');
        bar.setAttribute('aria-label', 'Show claims by verdict');
        // A control, not text: page-sections.js leaves it out of its suggest-edit sections.
        bar.setAttribute('data-pcs-skip', '');

        var lead = document.createElement('span');
        lead.className = 'cc-claims-lead';
        lead.textContent = rows.length + ' claims checked';
        bar.appendChild(lead);

        var live = document.createElement('p');
        live.className = 'cc-claims-live';
        live.setAttribute('aria-live', 'polite');
        live.id = 'cc-claims-live-' + index;

        var buttons = [];
        function chip(key, label, n) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'cc-chip';
            b.setAttribute('data-cc-filter', key);
            b.setAttribute('aria-pressed', key === 'all' ? 'true' : 'false');
            if (table.id) b.setAttribute('aria-controls', table.id);
            if (key !== 'all') {
                var dot = document.createElement('span');
                dot.className = 'cc-chip-dot';
                dot.setAttribute('aria-hidden', 'true');
                if (colours[key]) dot.style.setProperty('--cc-dot', colours[key]);
                b.appendChild(dot);
            }
            b.appendChild(document.createTextNode(label + ' '));
            var num = document.createElement('span');
            num.className = 'cc-chip-n';
            num.textContent = n;
            b.appendChild(num);
            buttons.push(b);
            bar.appendChild(b);
        }
        chip('all', 'All', rows.length);
        present.forEach(function (t) { chip(t.key, t.label, counts[t.key]); });

        // One switch for every folded explanation.
        if (folded.length) {
            var all = document.createElement('button');
            all.type = 'button';
            all.className = 'cc-chip cc-chip--details';
            all.setAttribute('aria-pressed', 'false');
            all.textContent = 'Show all details';
            all.addEventListener('click', function () {
                var open = all.getAttribute('aria-pressed') !== 'true';
                folded.forEach(function (row) { setOpen(row, open); });
                all.setAttribute('aria-pressed', open ? 'true' : 'false');
                all.textContent = open ? 'Hide details' : 'Show all details';
            });
            bar.appendChild(all);
        }

        function apply(key) {
            var shown = 0;
            rows.forEach(function (row) {
                var on = key === 'all' || row.getAttribute('data-cc-tone') === key;
                row.hidden = !on;
                if (on) shown++;
            });
            if (key === 'all') table.removeAttribute('data-cc-filtered');
            else table.setAttribute('data-cc-filtered', key);
            buttons.forEach(function (b) {
                b.setAttribute('aria-pressed', b.getAttribute('data-cc-filter') === key ? 'true' : 'false');
            });
            var def = TONES.filter(function (t) { return t.key === key; })[0];
            live.textContent = key === 'all'
                ? 'Showing all ' + rows.length + ' claims.'
                : 'Showing ' + shown + ' of ' + rows.length + ' claims: ' + def.label.toLowerCase() + '.';
        }
        bar.addEventListener('click', function (e) {
            var b = e.target.closest('[data-cc-filter]');
            if (b) apply(b.getAttribute('data-cc-filter'));
        });

        // A link to something inside a filtered-out row shows every row again.
        function revealTarget() {
            var id = decodeURIComponent((location.hash || '').slice(1));
            var target = id && document.getElementById(id);
            if (!target || !table.contains(target)) return;
            if (target.closest('tr[hidden]')) apply('all');
            var row = target.closest('tr');
            if (row && target.closest('.cc-rest')) setOpen(row, true);
        }
        window.addEventListener('hashchange', revealTarget);

        // Where the bar goes. page-sections.js turns the table and the text around it into a
        // suggest-edit section keyed by its position, and saved edits are stored under that key, so the
        // bar must never land inside or between those blocks:
        //  - the table is already in a section (page-sections ran first): the bar goes just above it;
        //  - otherwise: above the table's wrapper and any intro paragraphs right before it, which is the
        //    run page-sections would group.
        var section = table.closest('.cms-section');
        var start;
        if (section) {
            start = section;
        } else {
            start = table;
            var parent = table.parentElement;
            if (parent && parent.tagName === 'DIV' && parent.children.length === 1) start = parent;
            while (isProseBlock(start.previousElementSibling)) start = start.previousElementSibling;
        }
        var align = getComputedStyle(section ? (section.querySelector('p') || section) : start).textAlign;
        if (align === 'center') bar.classList.add('cc-claims-bar--center');
        bar.appendChild(live);
        start.parentNode.insertBefore(bar, start);

        // page-sections.js moves the table out of the page while it shows an approved community edit,
        // the editor or the history; the bar has nothing to filter then.
        if (section && window.MutationObserver) {
            new MutationObserver(function () {
                bar.hidden = !table.isConnected;
            }).observe(section, { childList: true, subtree: true });
        }
    }

    // Same test page-sections.js uses for "reading text" blocks.
    function isProseBlock(el) {
        if (!el || el.hidden) return false;
        var tableWrap = el.tagName === 'DIV' && el.children.length === 1 && el.firstElementChild.tagName === 'TABLE';
        if (!/^(P|UL|OL|DL|BLOCKQUOTE|TABLE)$/.test(el.tagName) && !tableWrap) return false;
        if (el.matches('[data-pcs-skip], [aria-live], [role="status"]')) return false;
        return !el.querySelector('button, select, input, textarea, [hidden], [aria-live], [role="status"]');
    }

    function init() {
        var useFa = hasFontAwesome();
        var tables = document.querySelectorAll('table[data-claims-table]');
        Array.prototype.forEach.call(tables, function (t, i) { build(t, i, useFa); });
    }

    // Run after the page's own DOMContentLoaded handlers: those call initPageSections(), which groups
    // the page into suggest-edit sections, and the bar is placed around those sections, not inside.
    // The page registers its handler while parsing, before this deferred script, so it fires first.
    var started = false;
    function start() {
        if (started) return;
        started = true;
        init();
    }
    if (document.readyState === 'complete') start();
    else {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
        window.addEventListener('load', start);
    }
})();
