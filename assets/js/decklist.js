/**
 * decklist.js — "Test Deck": one pure build per archetype, shared by every page.
 *
 * Data (assets/data/decklists/):
 *   <archetype>.json  the archetype's own cards, plus named exceptions (allow)
 *   packages.json     generic staples shared by every list, in priority order
 *   index.json        archetype -> file; written by scripts/check-decklists.js
 *
 * A list is its own cards topped up to 40 (and 15) from the staples packages it
 * names. assemble() applies the current banlist as it goes: a Forbidden or
 * Limited staple is skipped and the next one moves up, so a banlist day needs
 * no edits; an archetype card over its new limit is cut and the list says it
 * needs a review. scripts/check-decklists.js runs this same assemble() in Node,
 * so the page and the checker always agree on what the list is.
 *
 * A deck file (see lunalight.json):
 *   archetype  the name the page passes to CardLoader.renderDeckResourcesCompact
 *   title, summary
 *   status     "draft" until someone has played it, then "reviewed"
 *   reviewed   ISO date; the checker reports archetype cards released after it
 *   match      name fragments that make a card the archetype's own (default: archetype)
 *   allow      { card: reason } for outside cards a pure build still runs
 *   exclude    { card: reason } for staples this deck should never be topped up with
 *   combos     combo JSON files (relative to assets/data/) whose cards the list must run
 *   main/extra [name, count, role] rows; the role is the hover text
 *   fill       { main: [...], extra: [...] } packages to top up from, in order;
 *              { package, max } caps how many cards one package may add
 * After adding or editing one, run: node scripts/check-decklists.js
 *
 * card-loader.js loads this file on demand: for archetypes in index.json the
 * Decks menu in the Deck Resources bar gets a "Test deck" entry, and the first
 * click loads this file and opens the list in a dialog. While it's open the URL
 * ends in #test-deck, so the link can be shared; card-loader opens the dialog
 * when a page loads with that hash.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.DeckList = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
    'use strict';

    const SIZE = { main: 40, extra: 15 };
    const MAIN_MAX = 60;
    const LIMITS = { Forbidden: 0, Limited: 1, 'Semi-Limited': 2 };

    // ------------------------------------------------------------------
    // List assembly and export (shared with scripts/check-decklists.js)
    // ------------------------------------------------------------------

    // banlist.json -> { lowercased name: 'Forbidden' | 'Limited' | 'Semi-Limited' }.
    // Mirrors card-loader's loadBanlistData, including a scheduled nextBanlist.
    function banMapFromJson(json, format = 'tcg', now = new Date()) {
        let list = json && json[format];
        const next = json && json.nextBanlist;
        if (next && next.effectiveDate && next[format] && now >= new Date(next.effectiveDate)) list = next[format];
        const map = {};
        if (!list) return map;
        [['forbidden', 'Forbidden'], ['limited', 'Limited'], ['semiLimited', 'Semi-Limited']].forEach(([key, status]) => {
            (list[key] || []).forEach(name => { map[name.toLowerCase()] = status; });
        });
        return map;
    }

    function banStatus(name, banMap) {
        return (banMap && banMap[name.toLowerCase()]) || null;
    }

    // A card is the archetype's own when its name has one of the deck's "match"
    // strings in it (default: the archetype name). Names, not the API's archetype
    // field, decide this: that field misses cards the archetype counts as its own.
    function ownMatcher(deck) {
        const patterns = (deck.match && deck.match.length ? deck.match : [deck.archetype]).filter(Boolean).map(p => p.toLowerCase());
        return name => patterns.some(p => name.toLowerCase().includes(p));
    }

    function copyLimit(name, banMap) {
        const status = banStatus(name, banMap);
        return status in LIMITS ? LIMITS[status] : 3;
    }

    // Deck and package rows are written as [name, count, note].
    function readRow(entry) {
        return Array.isArray(entry)
            ? { name: entry[0], count: entry[1], note: entry[2] || '' }
            : { name: entry.name, count: entry.count, note: entry.note || '' };
    }

    /**
     * The playable list: the deck's own cards (capped by the banlist), then each
     * fill package in order until the Main Deck reaches 40 and the Extra Deck 15.
     * A staple the deck already runs counts toward that staple's copies.
     * @returns {{ main: Entry[], extra: Entry[], issues: Issue[] }}
     *   Entry: { name, count, note, source: 'core' | 'staple', pkg? }
     *   Issue: { level: 'review' | 'error' | 'warn', card?, message }
     */
    function assemble(deck, packages, banMap) {
        const zones = { main: [], extra: [] };
        const copies = new Map();
        const issues = [];
        const excluded = new Set(Object.keys(deck.exclude || {}).map(n => n.toLowerCase()));
        const size = zone => zones[zone].reduce((sum, e) => sum + e.count, 0);

        function add(zone, entry) {
            const key = entry.name.toLowerCase();
            copies.set(key, (copies.get(key) || 0) + entry.count);
            const existing = zones[zone].find(e => e.name.toLowerCase() === key);
            if (existing) existing.count += entry.count;
            else zones[zone].push(entry);
        }

        for (const zone of ['main', 'extra']) {
            for (const raw of deck[zone] || []) {
                const { name, count: wanted, note } = readRow(raw);
                const status = banStatus(name, banMap);
                const keep = Math.max(0, Math.min(wanted, copyLimit(name, banMap) - (copies.get(name.toLowerCase()) || 0)));
                if (keep < wanted && status) {
                    issues.push({
                        level: 'review', card: name,
                        message: keep === 0
                            ? `${name} is now ${status}, so it was taken out.`
                            : `${name} is now ${status}, so it was cut from ${wanted} to ${keep}.`
                    });
                } else if (keep < wanted) {
                    issues.push({ level: 'error', card: name, message: `${name} is listed more than 3 times.` });
                }
                if (keep > 0) add(zone, { name, count: keep, note, source: 'core' });
            }
        }

        // Two passes: the deck's own caps first ({ package, max }), then, if the
        // banlist has cut so much that the deck is still short, the same packages
        // without caps, so a list stays at 40 without anyone touching it.
        for (const zone of ['main', 'extra']) {
            const specs = ((deck.fill && deck.fill[zone]) || []).map(spec => (typeof spec === 'string' ? { package: spec } : spec));
            for (const [pass, spec] of [...specs.map(s => [1, s]), ...specs.map(s => [2, s])]) {
                const pkgName = spec.package;
                const pkg = packages && packages[pkgName];
                if (!pkg) {
                    if (pass === 1) issues.push({ level: 'error', message: `There's no staples package called "${pkgName}".` });
                    continue;
                }
                if (pkg.zone && pkg.zone !== zone) {
                    if (pass === 1) issues.push({ level: 'error', message: `The "${pkgName}" package is for the ${pkg.zone === 'main' ? 'Main' : 'Extra'} Deck.` });
                    continue;
                }
                let budget = pass === 1 && spec.max !== undefined ? spec.max : Infinity;
                for (const raw of pkg.cards || []) {
                    const room = Math.min(SIZE[zone] - size(zone), budget);
                    if (room <= 0) break;
                    const { name, count: wanted, note } = readRow(raw);
                    const key = name.toLowerCase();
                    if (excluded.has(key)) continue;
                    const take = Math.min(Math.min(wanted, copyLimit(name, banMap)) - (copies.get(key) || 0), room);
                    if (take > 0) {
                        add(zone, { name, count: take, note, source: 'staple', pkg: pkgName });
                        budget -= take;
                    }
                }
            }
        }

        const main = size('main');
        const extra = size('extra');
        if (main < SIZE.main) issues.push({ level: 'error', message: `The Main Deck has ${main} cards and needs at least 40. Add cards or another staples package.` });
        if (main > MAIN_MAX) issues.push({ level: 'error', message: `The Main Deck has ${main} cards; 60 is the most allowed.` });
        if (extra > SIZE.extra) issues.push({ level: 'error', message: `The Extra Deck has ${extra} cards; 15 is the most allowed.` });
        return { main: zones.main, extra: zones.extra, issues };
    }

    function expand(entries) {
        return entries.flatMap(e => Array(e.count).fill(e.name));
    }

    function toYdk(list, idOf, title) {
        const ids = zone => expand(list[zone]).map(idOf);
        return [`#created by ArcheType Nexus: ${title}`, '#main', ...ids('main'), '#extra', ...ids('extra'), '!side', ''].join('\n');
    }

    function base64(bytes) {
        if (typeof btoa === 'function') {
            let binary = '';
            bytes.forEach(b => { binary += String.fromCharCode(b); });
            return btoa(binary);
        }
        return Buffer.from(bytes).toString('base64');
    }

    // ydke:// is each section's passcodes as little-endian uint32s, base64'd.
    function passcodesBase64(ids) {
        const bytes = new Uint8Array(ids.length * 4);
        const view = new DataView(bytes.buffer);
        ids.forEach((id, i) => view.setUint32(i * 4, Number(id), true));
        return base64(bytes);
    }

    function toYdke(list, idOf) {
        const ids = zone => expand(list[zone]).map(idOf);
        return `ydke://${passcodesBase64(ids('main'))}!${passcodesBase64(ids('extra'))}!!`;
    }

    // groups: [{ label, entries }] for the Main Deck; the Extra Deck is one block.
    function toText(list, title, groups) {
        const block = entries => entries.map(e => `${e.count} ${e.name}`);
        const total = entries => entries.reduce((s, e) => s + e.count, 0);
        const lines = [title, ''];
        (groups || [{ label: 'Main Deck', entries: list.main }]).forEach(g => {
            if (!g.entries.length) return;
            lines.push(`${g.label} (${total(g.entries)})`, ...block(g.entries), '');
        });
        lines.push(`Extra Deck (${total(list.extra)})`, ...block(list.extra));
        return lines.join('\n');
    }

    const core = { SIZE, banMapFromJson, banStatus, copyLimit, ownMatcher, readRow, assemble, expand, toYdk, toYdke, toText };
    if (typeof document === 'undefined') return core;

    // ------------------------------------------------------------------
    // Browser
    // ------------------------------------------------------------------

    const SCRIPT_URL = (document.currentScript && document.currentScript.src) || '';
    function assetUrl(relative, fallback) {
        try { return SCRIPT_URL ? new URL(relative, SCRIPT_URL).href : fallback; } catch (e) { return fallback; }
    }
    const DATA_URL = assetUrl('../data/decklists/', '../assets/data/decklists/');
    const BANLIST_URL = assetUrl('../data/banlist.json', '../assets/data/banlist.json');
    const CSS_URL = assetUrl('../css/decklist.css', '../assets/css/decklist.css');

    if (!document.querySelector('link[data-decklist-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_URL;
        link.dataset.decklistCss = '';
        document.head.appendChild(link);
    }

    const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const jsonCache = {};
    function fetchJson(url) {
        if (!jsonCache[url]) {
            jsonCache[url] = fetch(url)
                .then(r => { if (!r.ok) throw new Error(`${url} returned ${r.status}`); return r.json(); })
                .catch(error => { delete jsonCache[url]; throw error; });
        }
        return jsonCache[url];
    }

    async function loadList(archetype) {
        const index = await fetchJson(DATA_URL + 'index.json');
        const file = index[archetype];
        if (!file) throw new Error(`There's no test deck for ${archetype} yet.`);
        const [deck, staples, banlist] = await Promise.all([
            fetchJson(DATA_URL + file),
            fetchJson(DATA_URL + 'packages.json'),
            fetchJson(BANLIST_URL).catch(() => null)
        ]);
        const list = assemble(deck, staples.packages, banlist ? banMapFromJson(banlist) : {});
        if (!banlist) list.issues.push({ level: 'warn', message: "The banlist didn't load, so the staples below ignore it." });
        return { deck, list, banlistDate: banlist && banlist.tcg && banlist.tcg.effectiveDate };
    }

    // "2026-10-12" and banlist.json's "18/05/2026" -> "12 Oct 2026"
    function formatDate(value) {
        if (!value) return '';
        const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
        const parts = iso ? [iso[1], iso[2], iso[3]] : dmy ? [dmy[3], dmy[2], dmy[1]] : null;
        if (!parts) return value;
        const date = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    }

    function kindOf(record) {
        const type = String((record && record.type) || '').toLowerCase();
        if (type.includes('spell')) return 'spell';
        if (type.includes('trap')) return 'trap';
        return 'monster';
    }

    function slug(text) {
        return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    let uid = 0;

    // One thumbnail per copy, like a real deck. The title lives on the slot and
    // decklist.css turns off pointer events on the card image inside it, so a
    // hover shows the card's role rather than card-loader's image tooltip.
    function slotsHtml(entries, deck, idMap, prefix) {
        const allow = deck.allow || {};
        const own = ownMatcher(deck);
        return entries.map(e => {
            const exception = Object.prototype.hasOwnProperty.call(allow, e.name);
            const generic = !exception && !own(e.name);
            const tag = exception ? ` (pure-build exception: ${allow[e.name]})`
                : e.source === 'staple' ? ' (generic staple, topped up from the shared list)'
                    : generic ? ' (generic)' : '';
            const cls = exception ? ' dl-card--outside' : generic ? ' dl-card--generic' : '';
            const title = `${e.name}${tag}${e.note ? ' — ' + e.note : ''}`;
            let html = '';
            for (let i = 0; i < e.count; i++) {
                const id = `${prefix}-${idMap.n++}`;
                idMap.cards[id] = e.name;
                html += `<div class="card-placeholder dl-card${cls}" id="${id}" title="${escapeHtml(title)}">${escapeHtml(e.name)}</div>`;
            }
            return html;
        }).join('');
    }

    function issuesHtml(issues) {
        const review = issues.filter(i => i.level === 'review');
        const other = issues.filter(i => i.level !== 'review');
        let html = '';
        if (review.length) {
            html += `<div class="dl-issue dl-issue--review"><i class="fas fa-balance-scale" aria-hidden="true"></i><div>
                <strong>The banlist changed since this list was reviewed.</strong>
                <ul>${review.map(i => `<li>${escapeHtml(i.message)}</li>`).join('')}</ul>
                Staples moved up to keep the deck legal; the list is due a review.</div></div>`;
        }
        other.forEach(i => {
            html += `<div class="dl-issue dl-issue--${i.level}"><i class="fas fa-exclamation-triangle" aria-hidden="true"></i><div>${escapeHtml(i.message)}</div></div>`;
        });
        return html;
    }

    async function render(container, archetype, { headingLevel = 3 } = {}) {
        container.classList.add('dl-root');
        container.innerHTML = '<p class="dl-loading"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Loading the test deck…</p>';

        let data;
        try {
            data = await loadList(archetype);
        } catch (error) {
            console.error('[DeckList]', error);
            container.innerHTML = `<p class="dl-issue dl-issue--error">The test deck couldn't be loaded. ${escapeHtml(error.message || '')}</p>`;
            return;
        }
        const { deck, list, banlistDate } = data;
        const loader = root.CardLoader;
        const names = [...new Set([...list.main, ...list.extra].map(e => e.name))];
        if (loader && loader.preloadCards) await loader.preloadCards(names);
        const record = name => (loader && loader.getCachedCard && loader.getCachedCard(name)) || null;

        const groups = [
            { kind: 'monster', label: 'Monsters' },
            { kind: 'spell', label: 'Spells' },
            { kind: 'trap', label: 'Traps' }
        ].map(g => ({ ...g, entries: list.main.filter(e => kindOf(record(e.name)) === g.kind) }));
        const total = entries => entries.reduce((s, e) => s + e.count, 0);
        const title = deck.title || `Pure ${archetype}`;
        const n = ++uid;
        const idMap = { n: 0, cards: {} };
        const h = `h${headingLevel}`;
        const reviewed = deck.status === 'reviewed';

        container.innerHTML = `
            <div class="dl-panel">
                <div class="dl-head">
                    <div class="dl-heading">
                        <p class="dl-kicker">Pure test deck · TCG</p>
                        <${h} class="dl-title" id="dl-title-${n}" tabindex="-1">${escapeHtml(title)}</${h}>
                        <p class="dl-meta">
                            <span class="dl-chip ${reviewed ? 'dl-chip--reviewed' : 'dl-chip--draft'}"
                                title="${reviewed ? 'Checked by hand' : 'Assembled from official card text and the page’s combo lines; not yet play-tested'}">${reviewed ? 'Reviewed' : 'Draft'}</span>
                            <span>${reviewed ? 'Reviewed' : 'Drafted'} ${escapeHtml(formatDate(deck.reviewed))}</span>
                            ${banlistDate ? `<span aria-hidden="true">·</span><span>Banlist of ${escapeHtml(formatDate(banlistDate))}</span>` : ''}
                        </p>
                    </div>
                    <div class="dl-actions">
                        <button type="button" class="dl-btn dl-btn--primary" data-dl-act="hand"><i class="fas fa-hand-sparkles" aria-hidden="true"></i><span>Draw a hand</span></button>
                        <button type="button" class="dl-btn" data-dl-act="ydk" title="For EDOPro, YGO Omega or YGOProDeck’s deck builder"><i class="fas fa-download" aria-hidden="true"></i><span>Download .ydk</span></button>
                        <button type="button" class="dl-btn" data-dl-act="ydke" title="Paste into EDOPro’s or YGO Omega’s deck editor"><i class="fas fa-link" aria-hidden="true"></i><span>Copy ydke link</span></button>
                        <button type="button" class="dl-btn" data-dl-act="text"><i class="far fa-copy" aria-hidden="true"></i><span>Copy as text</span></button>
                    </div>
                </div>
                <p class="dl-status" role="status" aria-live="polite"></p>
                ${deck.summary ? `<p class="dl-summary">${escapeHtml(deck.summary)}</p>` : ''}
                ${issuesHtml(list.issues)}
                <div class="dl-hand" hidden>
                    <div class="dl-hand-head">
                        <p class="dl-label">Opening hand</p>
                        <div class="dl-seg" role="group" aria-label="Hand size">
                            <button type="button" data-dl-size="5" aria-pressed="true">Going first · 5</button>
                            <button type="button" data-dl-size="6" aria-pressed="false">Going second · 6</button>
                        </div>
                        <button type="button" class="dl-btn" data-dl-act="redraw"><i class="fas fa-redo-alt" aria-hidden="true"></i><span>Draw again</span></button>
                    </div>
                    <div class="dl-cards dl-hand-cards"></div>
                </div>
                <div class="dl-zone">
                    <p class="dl-label">Main Deck <span class="dl-count">${total(list.main)}</span></p>
                    ${groups.filter(g => g.entries.length).map(g => `
                        <p class="dl-sublabel">${g.label} · ${total(g.entries)}</p>
                        <div class="dl-cards">${slotsHtml(g.entries, deck, idMap, `dl${n}`)}</div>`).join('')}
                </div>
                <div class="dl-zone">
                    <p class="dl-label">Extra Deck <span class="dl-count">${total(list.extra)}</span></p>
                    <div class="dl-cards">${slotsHtml(list.extra, deck, idMap, `dl${n}`)}</div>
                </div>
                <div class="dl-foot" data-suggest-anchor>
                    <p class="dl-legend">
                        <span><span class="dl-swatch dl-swatch--generic" aria-hidden="true"></span>Generic cards any deck can run</span>
                        <span><span class="dl-swatch dl-swatch--outside" aria-hidden="true"></span>Outside cards this build makes an exception for</span>
                    </p>
                    <p class="dl-hint">Staples are topped up from the site’s shared list, so the deck stays legal when the banlist changes. Hover a card for its role; click it for the full text.</p>
                    <button type="button" class="dl-link" data-suggest="${escapeHtml(title)} test deck">Suggest a change to this list</button>
                </div>
            </div>`;

        if (loader && loader.loadCards) loader.loadCards(idMap.cards);
        wire(container, { archetype, title, list, groups, record, n });
    }

    function wire(container, ctx) {
        const status = container.querySelector('.dl-status');
        const say = message => { status.textContent = message; };
        const missing = [...new Set([...ctx.list.main, ...ctx.list.extra].map(e => e.name))].filter(name => !(ctx.record(name) && ctx.record(name).id));
        const idOf = name => ctx.record(name).id;
        const exportable = () => {
            if (!missing.length) return true;
            say(`Card data didn't load for ${missing.join(', ')}, so the list can't be exported. Reload the page to try again.`);
            return false;
        };
        const textGroups = ctx.groups.map(g => ({ label: g.label, entries: g.entries }));

        let handSize = 5;
        let draws = 0;
        const hand = container.querySelector('.dl-hand');
        const handCards = container.querySelector('.dl-hand-cards');
        function drawHand() {
            const pool = expand(ctx.list.main);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            const prefix = `dl${ctx.n}-hand${++draws}`;
            const cards = {};
            handCards.innerHTML = pool.slice(0, handSize).map((name, i) => {
                cards[`${prefix}-${i}`] = name;
                return `<div class="card-placeholder dl-card dl-card--hand" id="${prefix}-${i}" title="${escapeHtml(name)}">${escapeHtml(name)}</div>`;
            }).join('');
            if (root.CardLoader && root.CardLoader.loadCards) root.CardLoader.loadCards(cards);
        }

        container.addEventListener('click', async event => {
            const sizeBtn = event.target.closest('[data-dl-size]');
            if (sizeBtn) {
                handSize = Number(sizeBtn.dataset.dlSize);
                container.querySelectorAll('[data-dl-size]').forEach(b => b.setAttribute('aria-pressed', String(b === sizeBtn)));
                drawHand();
                return;
            }
            const button = event.target.closest('[data-dl-act]');
            if (!button) return;
            const act = button.dataset.dlAct;
            if (act === 'hand') {
                hand.hidden = false;
                drawHand();
                hand.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else if (act === 'redraw') {
                drawHand();
            } else if (act === 'ydk') {
                if (!exportable()) return;
                const blob = new Blob([toYdk(ctx.list, idOf, ctx.title)], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${slug(ctx.title)}.ydk`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                say('Downloaded. Open it from your simulator’s deck folder or its deck import.');
            } else if (act === 'ydke') {
                if (!exportable()) return;
                say(await copy(toYdke(ctx.list, idOf))
                    ? 'Copied the ydke link. Paste it into EDOPro’s or YGO Omega’s deck editor.'
                    : 'Copying was blocked by the browser. Use Download .ydk instead.');
            } else if (act === 'text') {
                say(await copy(toText(ctx.list, `${ctx.title} (TCG test deck, ArcheType Nexus)`, textGroups))
                    ? 'Copied the list as text.'
                    : 'Copying was blocked by the browser.');
            }
        });
    }

    async function copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            area.remove();
            return ok;
        }
    }

    // ---- Dialog ----

    let dialog = null;
    let dialogArchetype = null;
    let opener = null;
    let hashBefore = '';

    const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function closeDialog() {
        if (!dialog || dialog.hidden) return;
        dialog.hidden = true;
        document.documentElement.classList.remove('dl-dialog-open');
        if (location.hash === '#test-deck') history.replaceState(null, '', hashBefore || location.pathname + location.search);
        if (opener && opener.focus) opener.focus();
    }

    function ensureDialog() {
        if (dialog) return dialog;
        dialog = document.createElement('div');
        dialog.className = 'dl-overlay';
        dialog.hidden = true;
        dialog.innerHTML = `
            <div class="dl-dialog" role="dialog" aria-modal="true">
                <button type="button" class="dl-close" aria-label="Close the test deck"><i class="fas fa-times" aria-hidden="true"></i></button>
                <div class="dl-dialog-body"></div>
            </div>`;
        document.body.appendChild(dialog);
        dialog.addEventListener('click', event => {
            if (event.target === dialog || event.target.closest('.dl-close')) closeDialog();
        });
        document.addEventListener('keydown', event => {
            if (dialog.hidden) return;
            if (event.key === 'Escape') {
                closeDialog();
            } else if (event.key === 'Tab') {
                // Keep Tab inside the dialog while it's open.
                const items = [...dialog.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
                if (!items.length) return;
                const first = items[0];
                const last = items[items.length - 1];
                if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
        return dialog;
    }

    function open(archetype, trigger) {
        opener = trigger || document.activeElement;
        const overlay = ensureDialog();
        const body = overlay.querySelector('.dl-dialog-body');
        if (dialogArchetype !== archetype) {
            dialogArchetype = archetype;
            render(body, archetype, { headingLevel: 2 }).then(() => {
                const heading = body.querySelector('.dl-title');
                if (heading) overlay.querySelector('.dl-dialog').setAttribute('aria-labelledby', heading.id);
            });
        }
        if (location.hash !== '#test-deck') {
            hashBefore = location.hash;
            history.replaceState(null, '', '#test-deck');
        }
        overlay.hidden = false;
        document.documentElement.classList.add('dl-dialog-open');
        overlay.querySelector('.dl-close').focus();
    }

    return Object.assign(core, { render, open, close: closeDialog });
});
