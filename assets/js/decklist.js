/**
 * decklist.js — "Test Deck": one pure build per archetype, shared by every page.
 *
 * Data (assets/data/decklists/):
 *   <archetype>.json  the archetype's own cards, plus named exceptions (allow)
 *   packages.json     generic staples shared by every list, in priority order
 *   index.json        archetype -> file; written by scripts/check-decklists.js
 *   profiles.json     file -> its Main Deck monsters by Level/Attribute/Type; same script
 *   packages.generated.json  Extra Deck packages for "auto" fill, rebuilt weekly
 *                     by scripts/build-extra-packages.js
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
 *   aliases    other page names that open this same list, when two pages cover one deck
 *   title, summary
 *              summary is a string, or an array of lead strings and
 *              { title, text | steps | points } sections (see sphinx.json)
 *   status     "draft" until someone has played it, then "reviewed"
 *   reviewed   ISO date; the checker reports archetype cards released after it
 *   match      name fragments that make a card the archetype's own (default: archetype)
 *   allow      { card: reason } for outside cards a pure build still runs
 *   exclude    { card: reason } for staples this deck should never be topped up with
 *   combos     combo JSON files (relative to assets/data/) whose cards the list must run
 *   main/extra [name, count, role] rows; the role is the hover text
 *   fill       { main: [...], extra: [...] } packages to top up from, in order;
 *              { package, max } caps how many cards one package may add;
 *              "auto" picks from packages.generated.json what the list's
 *              profile (profiles.json) can reach: see autoSpecs()
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

    // ------------------------------------------------------------------
    // "auto" Extra Deck fill: packages.generated.json + profiles.json
    // ------------------------------------------------------------------

    const ATTRIBUTE = /^(DARK|LIGHT|EARTH|WATER|FIRE|WIND|DIVINE)$/;
    const SUMMON_KIND = /^(xyz|synchro|fusion|link)$/;
    const TYPES = new Set(['Aqua', 'Beast', 'Beast-Warrior', 'Creator God', 'Cyberse', 'Dinosaur', 'Divine-Beast', 'Dragon', 'Fairy', 'Fiend', 'Fish',
        'Illusion', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior',
        'Winged Beast', 'Wyrm', 'Zombie']);

    // The Extra Deck lock in a card's text, as "WIND", "Dragon", "xyz",
    // "WIND+synchro", or "own" for an archetype-only lock; null if none.
    function extraLock(desc) {
        const m = desc.match(/cannot Special Summon (?:any )?monsters? from the Extra Deck[^.]*?, except ([^.;]+?) monsters?\b/i)
            || desc.match(/cannot Special Summon (?:any )?monsters?(?: for the rest of this turn)?, except ([^.;]+?) monsters?\b/i);
        if (!m) return null;
        const clause = m[1];
        if (clause.includes('"')) return 'own';
        const parts = [];
        const attribute = clause.match(/\b(DARK|LIGHT|EARTH|WATER|FIRE|WIND)\b/);
        if (attribute) parts.push(attribute[1]);
        const kind = clause.match(/\b(Xyz|Synchro|Fusion|Link)\b/);
        if (kind) parts.push(kind[1].toLowerCase());
        const type = [...TYPES].find(t => new RegExp(`\\b${t}(?:-Type)?\\b`).test(clause) && !(t === 'Beast' && /Beast-|Winged Beast|Divine-Beast/.test(clause)));
        if (type) parts.push(type);
        return parts.length ? parts.join('+') : null;
    }

    /**
     * What a list's Main Deck monsters add up to: counts by Level, Attribute and
     * Type, its Tuners, and the Extra Deck locks that 3+ copies carry.
     * scripts/check-decklists.js writes one per list to profiles.json.
     * @param info name -> { type, level, attribute, race, desc } or null
     */
    function deckProfile(rows, info) {
        const p = {
            monsters: 0, levels: {}, attributes: {}, types: {}, levelWith: {},
            tuners: { count: 0, levels: {}, with: {} }, nonTunerLevels: {}, locks: [],
            hasField: false, rituals: 0, normalLow: 0, psychicLow: 0, spells: 0, traps: 0
        };
        const bump = (obj, key, n) => { obj[key] = (obj[key] || 0) + n; };
        const lockCopies = {};
        rows.forEach(raw => {
            const { name, count } = readRow(raw);
            const card = info(name);
            if (!card) return;
            const lock = extraLock(card.desc || '');
            if (lock) bump(lockCopies, lock, count);
            if (/Spell/.test(card.type)) {
                p.spells += count;
                if (card.race === 'Field') p.hasField = true;
                if (card.race === 'Ritual') p.rituals += count;
                return;
            }
            if (/Trap/.test(card.type)) {
                p.traps += count;
                return;
            }
            if (!/Monster/.test(card.type) || /Fusion|Synchro|XYZ|Link/.test(card.type)) return;
            if (/Ritual/.test(card.type)) p.rituals += count;
            if (/Normal Monster|Normal Tuner/i.test(card.type) && card.level && card.level <= 4) {
                p.normalLow += count;
            }
            if (card.race === 'Psychic' && card.level && card.level <= 3) {
                p.psychicLow += count;
            }
            const traits = [card.attribute, card.race].filter(Boolean);
            p.monsters += count;
            if (card.attribute) bump(p.attributes, card.attribute, count);
            if (card.race) bump(p.types, card.race, count);
            if (!card.level) return;
            bump(p.levels, card.level, count);
            p.levelWith[card.level] = p.levelWith[card.level] || {};
            traits.forEach(t => bump(p.levelWith[card.level], t, count));
            if (/Tuner/.test(card.type)) {
                p.tuners.count += count;
                bump(p.tuners.levels, card.level, count);
                traits.forEach(t => bump(p.tuners.with, t, count));
            } else {
                bump(p.nonTunerLevels, card.level, count);
            }
        });
        p.locks = Object.entries(lockCopies).filter(([, n]) => n >= 3).map(([lock]) => lock).sort();
        return p;
    }

    // Synchro Level -> how readily a Tuner plus one or two non-Tuners reach it.
    function synchroWeights(profile) {
        const weights = {};
        const tuners = Object.entries(profile.tuners.levels).map(([l, n]) => [Number(l), n]);
        const others = Object.entries(profile.nonTunerLevels).map(([l, n]) => [Number(l), n]);
        tuners.forEach(([t, tn]) => others.forEach(([a, an], i) => {
            weights[t + a] = (weights[t + a] || 0) + tn * an;
            others.slice(i).forEach(([b, bn]) => {
                if (a === b && an < 2) return;
                weights[t + a + b] = (weights[t + a + b] || 0) + tn * Math.min(an, bn) / 4;
            });
        }));
        return weights;
    }

    // Generated rows carry attribute, race and kind, so a lock can filter them.
    function lockFilter(locks) {
        if (!locks || !locks.length) return null;
        return raw => locks.every(lock => lock.split('+').every(part =>
            part === 'own' ? false
                : ATTRIBUTE.test(part) ? raw.attribute === part
                    : SUMMON_KIND.test(part) ? raw.kind === part
                        : raw.race === part));
    }

    /**
     * "auto" -> the generated packages a list's profile can reach, most specific
     * first: Links for its main Attribute or Type, Xyz for its Levels, Synchros
     * when it runs Tuners, then generic Links, then the hand-picked "links"
     * package so the Extra Deck always reaches 15.
     */
    function autoSpecs(packages, profile) {
        const fallback = [{ package: 'links', last: true }];
        if (!profile) return fallback;
        const accept = lockFilter(profile.locks);
        const has = key => (profile.attributes[key] || 0) + (profile.types[key] || 0);
        const synchro = synchroWeights(profile);
        const easiest = new Set(Object.entries(synchro).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([level]) => Number(level)));
        const specs = [];
        Object.entries(packages || {}).forEach(([id, pkg]) => {
            const needs = pkg.auto && pkg.zone === 'extra' ? pkg.auto.needs || {} : null;
            if (!needs) return;
            if (needs.has) {
                if (has(needs.has) < needs.min) return;
                specs.push({ package: id, max: 1, tier: 0, score: has(needs.has) });
            } else if (needs.level) {
                const count = needs.with ? ((profile.levelWith[needs.level] || {})[needs.with] || 0) : (profile.levels[needs.level] || 0);
                if (count < needs.min) return;
                specs.push({ package: id, max: needs.with || count < 8 ? 2 : 3, tier: needs.with ? 1 : 2, score: count });
            } else if (needs.synchro) {
                if (profile.tuners.count < 2 || !easiest.has(needs.synchro)) return;
                if (needs.tuner && !profile.tuners.with[needs.tuner]) return;
                if (needs.nonTuner && has(needs.nonTuner) - (profile.tuners.with[needs.nonTuner] || 0) < 2) return;
                specs.push({ package: id, max: 2, tier: needs.tuner || needs.nonTuner ? 3 : 4, score: synchro[needs.synchro] });
            } else if (needs.link) {
                specs.push({ package: id, max: { 2: 4, 3: 2 }[needs.link] || 2, tier: 4 + needs.link, score: 0 });
            }
        });
        return specs
            .sort((a, b) => a.tier - b.tier || b.score - a.score || a.package.localeCompare(b.package))
            .map(({ package: id, max }) => ({ package: id, max, accept }))
            .concat(fallback);
    }

    /**
     * "auto" or "staple-spells" in Main Deck -> tailored spell packages
     * that a list's profile qualifies for (such as typal searchers, Field Spell
     * searchers, Level-specific draw spells, and specialized Pots), followed by
     * the generic staple-spells.
     */
    function autoSpellSpecs(packages, profile, deck) {
        const arch = ((deck && deck.archetype) || '').toLowerCase();
        const extraCount = ((deck && deck.extra) || []).reduce((s, r) => s + readRow(r).count, 0);

        // Pot determination:
        // 1. Pot of Duality: Tribute/Normal summon archetypes, or decks with 0 Extra Deck and 0 Rituals
        const isDualityArch = ['floowandereeze', 'true draco', 'yosenju', 'monarch', 'barrier statue', 'morganite'].some(a => arch.includes(a));
        const isNoExtraDeck = extraCount === 0 && (!profile || (profile.rituals || 0) === 0) && !arch.includes('kaiju');
        const wantsDuality = isDualityArch || isNoExtraDeck;

        // 2. Pot of Extravagance: Trap-heavy control decks (win via backrow, Extra Deck is pure fodder)
        const isTrapControl = profile && (profile.traps || 0) >= 8 && (profile.monsters || 0) <= 16 && !arch.includes('phantom knights');
        const wantsExtravagance = !wantsDuality && isTrapControl;

        // 3. Pot of Desires: High 3-of redundancy / banish synergy
        const isDesiresArch = ['swordsoul', 'tenyi', 'virtual world', 'gren maju'].some(a => arch.includes(a));
        const wantsDesires = !wantsDuality && !wantsExtravagance && isDesiresArch;

        let potPackage = null;
        if (wantsDuality) potPackage = 'pot-duality';
        else if (wantsExtravagance) potPackage = 'pot-extravagance';
        else if (wantsDesires) potPackage = 'pot-desires';

        // If a specialized pot was selected, exclude Pot of Prosperity from the fallback
        const fallback = potPackage
            ? [{ package: 'staple-spells', accept: raw => readRow(raw).name !== 'Pot of Prosperity' }]
            : [{ package: 'staple-spells' }];

        if (!profile) return fallback;
        const specs = [];
        Object.entries(packages || {}).forEach(([id, pkg]) => {
            const needs = pkg.auto && pkg.zone === 'main' ? pkg.auto.needs || {} : null;
            if (!needs) return;
            if (needs.type) {
                let count = 0;
                if (needs.maxLevel) {
                    for (let lvl = 1; lvl <= needs.maxLevel; lvl++) {
                        const lvlData = (profile.levelWith && (profile.levelWith[String(lvl)] || profile.levelWith[lvl])) || null;
                        if (lvlData && lvlData[needs.type]) count += lvlData[needs.type];
                    }
                } else {
                    count = (profile.types && profile.types[needs.type]) || 0;
                }
                if (count < (needs.min || 3)) return;
                specs.push({ package: id, max: needs.max || 1, tier: 0, score: count });
            } else if (needs.psychicLow) {
                const count = profile.psychicLow || 0;
                if (count < (needs.min || 3)) return;
                specs.push({ package: id, max: needs.max || 2, tier: 1, score: count });
            } else if (needs.normalLow) {
                const count = profile.normalLow || 0;
                if (count < (needs.min || 3)) return;
                specs.push({ package: id, max: needs.max || 2, tier: 1, score: count });
            } else if (needs.hasField) {
                if (!profile.hasField) return;
                specs.push({ package: id, max: needs.max || 1, tier: 2, score: 10 });
            } else if (needs.ritual) {
                const count = profile.rituals || 0;
                if (count < (needs.min || 3)) return;
                specs.push({ package: id, max: needs.max || 2, tier: 3, score: count });
            } else if (needs.attribute) {
                const count = (profile.attributes && profile.attributes[needs.attribute]) || 0;
                if (count < (needs.min || 10)) return;
                specs.push({ package: id, max: needs.max || 2, tier: 4, score: count });
            } else if (needs.level) {
                const count = (profile.levels && profile.levels[needs.level]) || 0;
                if (count < (needs.min || 5)) return;
                const tier = needs.level === 1 ? 1 : 4;
                specs.push({ package: id, max: needs.max || 1, tier, score: count });
            }
        });

        if (potPackage && packages && packages[potPackage]) {
            specs.push({ package: potPackage, max: 2, tier: 5, score: 50 });
        }

        return specs
            .sort((a, b) => a.tier - b.tier || b.score - a.score || a.package.localeCompare(b.package))
            .map(({ package: id, max }) => ({ package: id, max }))
            .concat(fallback);
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
    function assemble(deck, packages, banMap, profile) {
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
        // without caps, so a list stays at 40 without anyone touching it. A
        // "last" package (auto's fallback) only fills what both passes left.
        for (const zone of ['main', 'extra']) {
            const specs = ((deck.fill && deck.fill[zone]) || [])
                .map(spec => (typeof spec === 'string' ? { package: spec } : spec))
                .flatMap(spec => {
                    if (zone === 'extra' && spec.package === 'auto') return autoSpecs(packages, profile);
                    if (zone === 'main' && (spec.package === 'auto' || (spec.package === 'staple-spells' && spec.max === undefined))) {
                        return autoSpellSpecs(packages, profile, deck);
                    }
                    return [spec];
                });
            const regular = specs.filter(s => !s.last);
            const ordered = [...regular.map(s => [1, s]), ...regular.map(s => [2, s]), ...specs.filter(s => s.last).map(s => [2, s])];
            for (const [pass, spec] of ordered) {
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
                    if (excluded.has(key) || (spec.accept && !spec.accept(raw))) continue;
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
        // Every test deck runs a full Extra Deck, so a short one is an error too.
        if (extra < SIZE.extra) issues.push({ level: 'error', message: `The Extra Deck has ${extra} cards and needs exactly 15. Add cards or another staples package.` });
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

    const core = { SIZE, banMapFromJson, banStatus, copyLimit, ownMatcher, readRow, extraLock, deckProfile, autoSpecs, autoSpellSpecs, assemble, expand, toYdk, toYdke, toText };
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
        const [deck, staples, generated, profiles, banlist] = await Promise.all([
            fetchJson(DATA_URL + file),
            fetchJson(DATA_URL + 'packages.json'),
            // Without these, "auto" falls back to the hand-picked Links.
            fetchJson(DATA_URL + 'packages.generated.json').catch(() => ({ packages: {} })),
            fetchJson(DATA_URL + 'profiles.json').catch(() => ({})),
            fetchJson(BANLIST_URL).catch(() => null)
        ]);
        const packages = Object.assign({}, generated.packages, staples.packages);
        const list = assemble(deck, packages, banlist ? banMapFromJson(banlist) : {}, profiles[file]);
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

    // A summary is one paragraph, or an array of blocks: a string is a lead
    // paragraph, { title, text | steps | points } a section with a paragraph,
    // numbered list or bullet list. Sections flow into columns on wide screens.
    function summaryHtml(summary) {
        if (!summary) return '';
        if (!Array.isArray(summary)) return `<p class="dl-summary">${escapeHtml(summary)}</p>`;
        const list = (tag, rows) => `<${tag}>${rows.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</${tag}>`;
        const leads = summary.filter(b => typeof b === 'string');
        const parts = summary.filter(b => b && typeof b === 'object');
        return `<div class="dl-summary">
            ${leads.map(text => `<p class="dl-summary-lead">${escapeHtml(text)}</p>`).join('')}
            ${parts.length ? `<div class="dl-summary-parts">${parts.map(b => `
                <section class="dl-summary-part">
                    ${b.title ? `<p class="dl-summary-title">${escapeHtml(b.title)}</p>` : ''}
                    ${b.steps ? list('ol', b.steps) : b.points ? list('ul', b.points) : `<p>${escapeHtml(b.text || '')}</p>`}
                </section>`).join('')}</div>` : ''}
        </div>`;
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
                ${summaryHtml(deck.summary)}
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
