/**
 * Small World bridge finder: a shared widget for deck pages whose monsters link through Small World.
 *
 * Small World reveals a monster in your hand, picks a monster in your Deck (the bridge) that shares
 * exactly 1 of Type, Attribute, Level, ATK and DEF with it, and adds a monster from the Deck that
 * shares exactly 1 with the bridge. The revealed card and the bridge are banished face-down.
 *
 * Markup (one element per finder; the widget fills it):
 *
 *   <div data-small-world-finder
 *        data-deck="Trirealm Rift"                       the page's test deck (decklists/index.json key):
 *                                                        its Main Deck monsters become the pool
 *        data-cards='["Card A", ["Card B", 3]]'          optional: more monsters, such as the hand traps
 *                                                        the test deck tops up with (a [name, copies]
 *                                                        pair sets the count, default 1), or the whole
 *                                                        pool when there is no test deck ("A|B" works too)
 *        data-short-prefix="Trirealm Rift "              optional: dropped from labels ("Hollows")
 *        data-reveal="Trirealm Rift Darkness"            optional: preselected card in hand
 *        data-add="Trirealm Rift Blizzards"              optional: preselected card to add ("" = any)
 *        data-title="Small World bridge finder"          optional heading
 *        data-note="Text shown under the rule"></div>    optional, plain text
 *
 * Needs card-loader.js (CardLoader.preloadCards / getCachedCard / showPopupByName) for card data and
 * art, and assets/css/small-world-finder.css. Colours come from --swf-* custom properties, which a
 * page can set on the element. A finder starts the first time it nears the viewport, so one inside a
 * hidden tab costs nothing until the tab opens. SmallWorldFinder.mount(element) starts one by hand.
 */
(function () {
    'use strict';

    const SCRIPT = document.currentScript;
    const DECKLISTS = SCRIPT && SCRIPT.src ? new URL('../data/decklists/', SCRIPT.src).href : '../assets/data/decklists/';
    const SMALL_IMAGE = id => `https://images.ygoprodeck.com/images/cards_small/${encodeURIComponent(id)}.jpg`;
    const EXTRA_DECK = /fusion|synchro|xyz|link|token/i;
    // The five properties Small World compares, in the order its text lists them
    const PROPS = [
        { key: 'race', label: v => v },
        { key: 'attribute', label: v => v },
        { key: 'level', label: v => `Level ${v}` },
        { key: 'atk', label: v => `${v} ATK` },
        { key: 'def', label: v => `${v} DEF` }
    ];

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // '["A", ["B", 3]]' or "A|B" -> [{ name, count }]
    function parseList(value) {
        if (!value) return [];
        const text = value.trim();
        let items;
        if (text.startsWith('[')) {
            try { items = JSON.parse(text); } catch (err) { return []; }
            if (!Array.isArray(items)) return [];
        } else {
            items = text.split('|');
        }
        return items.map(item => Array.isArray(item)
            ? { name: String(item[0] || '').trim(), count: Number(item[1]) || 1 }
            : { name: String(item || '').trim(), count: 1 }).filter(row => row.name);
    }

    // "?" ATK/DEF (Eater of Millions) comes through as null, -1 or -2, and never matches a number
    function stat(value) {
        if (value === null || value === undefined || value === '') return null;
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? n : null;
    }

    async function fetchJson(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} for ${url}`);
        return res.json();
    }

    // [{ name, count }] from the archetype's test deck: its own Main Deck rows (not the shared staples)
    async function deckRows(archetype) {
        if (!archetype) return [];
        try {
            const index = await fetchJson(DECKLISTS + 'index.json');
            const file = index[archetype];
            if (!file) return [];
            const list = await fetchJson(DECKLISTS + file);
            return (list.main || []).map(row => Array.isArray(row)
                ? { name: row[0], count: Number(row[1]) || 1 }
                : { name: row.name, count: Number(row.count) || 1 });
        } catch (err) {
            console.warn('[SmallWorldFinder] Could not read the test deck for', archetype, err);
            return [];
        }
    }

    async function loadPool(el) {
        const counts = new Map();
        const add = (name, count) => { if (name) counts.set(name, (counts.get(name) || 0) + count); };
        (await deckRows(el.dataset.deck)).forEach(r => add(r.name, r.count));
        parseList(el.dataset.cards).forEach(row => { if (!counts.has(row.name)) add(row.name, row.count); });
        const names = [...counts.keys()];
        if (!names.length || !window.CardLoader) return [];
        await CardLoader.preloadCards(names);
        const prefix = el.dataset.shortPrefix || '';
        return names.map(name => {
            const r = CardLoader.getCachedCard(name);
            if (!r || !/monster/i.test(r.type || '') || EXTRA_DECK.test(r.type || '')) return null;
            return {
                name,
                label: prefix && name.startsWith(prefix) ? name.slice(prefix.length) : name,
                count: counts.get(name),
                id: r.id,
                img: r.hosted_image_url || null,
                race: r.race || null,
                attribute: r.attribute || null,
                level: stat(r.level),
                atk: stat(r.atk),
                def: stat(r.def)
            };
        }).filter(Boolean);
    }

    // The properties two monsters share: Small World wants exactly one
    function shared(a, b) {
        return PROPS.filter(p => a[p.key] !== null && a[p.key] !== undefined && a[p.key] === b[p.key]).map(p => p.label(a[p.key]));
    }

    // Bridges from a (revealed) to c (added); null when c is another copy of a and the Deck holds none
    function bridges(pool, a, c) {
        if (a.name === c.name && a.count < 2) return null;
        return pool.filter(b => b.name !== a.name && b.name !== c.name && shared(a, b).length === 1 && shared(b, c).length === 1);
    }

    function cardImage(m, cls) {
        const src = m.img || SMALL_IMAGE(m.id);
        return `<img class="${cls}" src="${esc(src)}" data-fallback="${esc(SMALL_IMAGE(m.id))}" alt="" loading="lazy" decoding="async">`;
    }

    // ----- One finder -----
    function mount(el) {
        if (el.dataset.swfMounted) return;
        el.dataset.swfMounted = 'true';
        el.classList.add('swf');
        const uid = 'swf-' + Math.random().toString(36).slice(2, 8);
        const title = el.dataset.title || 'Small World bridge finder';
        el.innerHTML = `
            <h3 class="swf-title">${esc(title)}</h3>
            <p class="swf-rule">Small World reveals a monster in your hand, picks a bridge in your Deck that shares <strong>exactly one</strong> of Type, Attribute, Level, ATK and DEF with it, and adds a monster that shares exactly one with the bridge. The revealed card and the bridge are banished face-down.</p>
            ${el.dataset.note ? `<p class="swf-note">${esc(el.dataset.note)}</p>` : ''}
            <p class="swf-loading">Loading the deck's monsters&hellip;</p>`;

        loadPool(el).then(pool => {
            if (pool.length < 2) {
                el.querySelector('.swf-loading').textContent = 'The bridge finder could not load this deck\'s monsters.';
                return;
            }
            const byName = new Map(pool.map((m, i) => [m.name, i]));
            const state = {
                reveal: byName.has(el.dataset.reveal) ? byName.get(el.dataset.reveal) : 0,
                add: el.dataset.add && byName.has(el.dataset.add) ? byName.get(el.dataset.add) : -1
            };
            el.querySelector('.swf-loading').remove();
            el.insertAdjacentHTML('beforeend', `
                <div class="swf-pick">
                    <p class="swf-step" id="${uid}-r"><span class="swf-step-n" aria-hidden="true">1</span>Reveal from your hand</p>
                    <div class="swf-cards" role="radiogroup" aria-labelledby="${uid}-r" data-side="reveal"></div>
                </div>
                <div class="swf-pick">
                    <p class="swf-step" id="${uid}-a"><span class="swf-step-n" aria-hidden="true">3</span>Add from your Deck</p>
                    <div class="swf-cards" role="radiogroup" aria-labelledby="${uid}-a" data-side="add"></div>
                </div>
                <div class="swf-result" aria-live="polite"></div>`);
            const groups = { reveal: el.querySelector('[data-side="reveal"]'), add: el.querySelector('[data-side="add"]') };
            const result = el.querySelector('.swf-result');

            function pickerHtml(side) {
                const any = `<button type="button" class="swf-card swf-card--any" role="radio" data-i="-1"><span class="swf-any" aria-hidden="true">?</span><span class="swf-name">Any</span></button>`;
                return pool.map((m, i) => `<button type="button" class="swf-card" role="radio" data-i="${i}" title="${esc(m.name)}">${cardImage(m, 'swf-img')}<span class="swf-name">${esc(m.label)}</span>${m.count > 1 ? `<span class="swf-count" aria-label="${m.count} copies">&times;${m.count}</span>` : ''}</button>`).join('') + any;
            }
            groups.reveal.innerHTML = pickerHtml('reveal');
            groups.add.innerHTML = pickerHtml('add');

            function syncPickers() {
                for (const side of ['reveal', 'add']) {
                    groups[side].querySelectorAll('.swf-card').forEach(btn => {
                        const on = Number(btn.dataset.i) === state[side];
                        btn.setAttribute('aria-checked', String(on));
                        btn.tabIndex = on ? 0 : -1;
                    });
                }
            }

            const chip = (side, text) => `<span class="swf-chip"><span class="swf-chip-side">${side}</span> ${esc(text)}</span>`;
            const tile = (m, extra, attrs) => `<button type="button" class="swf-tile" ${attrs}>${cardImage(m, 'swf-img')}<span class="swf-name">${esc(m.label)}</span>${extra || ''}</button>`;
            const pathCard = m => `<div class="swf-path-card">${cardImage(m, 'swf-img')}<span class="swf-name">${esc(m.label)}</span></div>`;

            function render() {
                syncPickers();
                const a = state.reveal >= 0 ? pool[state.reveal] : null;
                const c = state.add >= 0 ? pool[state.add] : null;
                if (!a && !c) {
                    result.innerHTML = '<p class="swf-msg">Pick the card you reveal, the card you want, or both.</p>';
                    return;
                }
                if (a && c) {
                    const found = bridges(pool, a, c);
                    if (found === null) {
                        result.innerHTML = `<p class="swf-msg swf-msg--no"><strong>Not with one copy.</strong> Adding ${esc(a.label)} while revealing ${esc(a.label)} needs a second copy in your Deck, and this list runs one.</p>`;
                        return;
                    }
                    const head = `<div class="swf-path" aria-label="Reveal ${esc(a.label)}, then a bridge, then add ${esc(c.label)}">${pathCard(a)}<span class="swf-arrow" aria-hidden="true">&rarr;</span><div class="swf-path-mid${found.length ? '' : ' swf-path-mid--none'}"><b>${found.length}</b><span>bridge${found.length === 1 ? '' : 's'}</span></div><span class="swf-arrow" aria-hidden="true">&rarr;</span>${pathCard(c)}</div>`;
                    if (!found.length) {
                        const firstStep = pool.filter(b => b.name !== a.name && shared(a, b).length === 1);
                        result.innerHTML = head + `<p class="swf-msg swf-msg--no"><strong>No bridge.</strong> ${firstStep.length ? `${esc(a.label)} can bridge to ${firstStep.map(b => esc(b.label)).join(', ')}, but none of them shares exactly one property with ${esc(c.label)}.` : `Nothing in this deck shares exactly one property with ${esc(a.label)}.`}</p>`;
                        return;
                    }
                    result.innerHTML = head +
                        (a.name === c.name ? `<p class="swf-msg">You add another copy of ${esc(a.label)}, so one has to be left in your Deck.</p>` : '') +
                        `<p class="swf-sub">Choose one of these in your Deck. Select a card for its full text.</p>
                         <div class="swf-grid">${found.map(b => tile(b, `<span class="swf-chips">${chip('hand', shared(a, b)[0])}${chip('add', shared(b, c)[0])}</span>`, `data-popup="${esc(b.name)}" aria-label="${esc(b.name)}: shares ${esc(shared(a, b)[0])} with ${esc(a.label)} and ${esc(shared(b, c)[0])} with ${esc(c.label)}"`)).join('')}</div>`;
                    return;
                }
                // One side picked: everything the other side can be
                const pairs = pool.map((m, i) => {
                    const found = a ? bridges(pool, a, m) : bridges(pool, m, c);
                    return found && found.length ? { m, i, found } : null;
                }).filter(Boolean);
                const picked = a || c;
                if (!pairs.length) {
                    result.innerHTML = `<p class="swf-msg swf-msg--no"><strong>Nothing.</strong> ${a ? `Revealing ${esc(a.label)} reaches no monster in this deck.` : `No card in this deck can reach ${esc(c.label)}.`}</p>`;
                    return;
                }
                const via = p => `<span class="swf-via">via ${p.found.slice(0, 3).map(b => esc(b.label)).join(', ')}${p.found.length > 3 ? ` +${p.found.length - 3}` : ''}</span>`;
                result.innerHTML = `<p class="swf-sub">${a
                    ? `Revealing <strong>${esc(picked.label)}</strong> can add ${pairs.length} of the deck's monsters.`
                    : `${pairs.length} of the deck's monsters can be revealed to add <strong>${esc(picked.label)}</strong>.`} Select one to see its bridges.</p>
                    <div class="swf-grid">${pairs.map(p => tile(p.m, via(p), `data-set="${a ? 'add' : 'reveal'}" data-i="${p.i}" aria-label="${esc(p.m.name)}, ${p.found.length} bridge${p.found.length === 1 ? '' : 's'}"`)).join('')}</div>`;
            }

            el.addEventListener('click', e => {
                const pick = e.target.closest('.swf-cards .swf-card');
                if (pick) {
                    state[pick.parentElement.dataset.side] = Number(pick.dataset.i);
                    render();
                    return;
                }
                const set = e.target.closest('[data-set]');
                if (set) {
                    state[set.dataset.set] = Number(set.dataset.i);
                    render();
                    groups[set.dataset.set].querySelector('[aria-checked="true"]').focus({ preventScroll: true });
                    result.scrollIntoView({ block: 'nearest' });
                    return;
                }
                const pop = e.target.closest('[data-popup]');
                if (pop && window.CardLoader && CardLoader.showPopupByName) {
                    e.stopPropagation();
                    CardLoader.showPopupByName(pop.dataset.popup, e);
                }
            });
            // Arrow keys move the choice within a picker (radio group pattern)
            el.addEventListener('keydown', e => {
                const btn = e.target.closest('.swf-cards .swf-card');
                if (!btn) return;
                const all = [...btn.parentElement.querySelectorAll('.swf-card')];
                const i = all.indexOf(btn);
                const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 }[e.key];
                if (next === undefined) return;
                e.preventDefault();
                const target = all[(next + all.length) % all.length];
                state[btn.parentElement.dataset.side] = Number(target.dataset.i);
                render();
                target.focus();
            });
            // Images the bucket doesn't have fall back to YGOProDeck's small art
            el.addEventListener('error', e => {
                const img = e.target;
                if (img.tagName === 'IMG' && img.dataset.fallback && img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
            }, true);
            render();
        }).catch(err => {
            console.error('[SmallWorldFinder]', err);
            const loading = el.querySelector('.swf-loading');
            if (loading) loading.textContent = 'The bridge finder could not load.';
        });
    }

    function mountAll(root) {
        const els = [...(root || document).querySelectorAll('[data-small-world-finder]')].filter(el => !el.dataset.swfMounted);
        if (!('IntersectionObserver' in window)) { els.forEach(mount); return; }
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);
                mount(entry.target);
            });
        }, { rootMargin: '300px 0px' });
        els.forEach(el => io.observe(el));
    }

    window.SmallWorldFinder = { mount, mountAll, shared, bridges };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountAll());
    else mountAll();
})();
