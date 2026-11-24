// scripts/build-small-world-scores.js
// Small World scores for the card browser: for every test deck (assets/data/decklists/) how much three
// copies of Small World add to the chance of opening a starter, and how well its monsters connect.
// The card browser (assets/js/card-browser.js) shows the deck it finds for the archetype it lists.
//
//   node scripts/build-small-world-scores.js                       every test deck
//   node scripts/build-small-world-scores.js --only=Madolche,Firewall   these decks (index key or file)
//   node scripts/build-small-world-scores.js --hands=40000         opening hands per deck and version
//
// Output, assets/data/small-world-scores/:
//   index.json      { decks: { "<list file>": summary }, names: { "<archetype or alias>": "<list file>" } }
//   <list file>     one deck: summary ("monsters" is the count), the starters counted, and "pool", its
//                   Main Deck monsters with the stats Small World compares (the card browser works out
//                   per-card numbers from these)
// No timestamps, so a weekly run only changes the files when a result changes.
//
// Starters and hand traps come from the Supabase card tags (docs/supabase-tags.md), read through
// get_card_tags_by_passcodes:
//   - "Starter": one of the card's effects takes a card from the Deck on your first turn with nothing
//     else needed (yugioh-archetype-db sql/create_cardtags_starters.sql works it out per effect);
//   - "Hand Trap": hand traps are never starters here, and they are what a Small World save can cost.
// Two things need the deck around the card, so they stay here:
//   - Terraforming counts only when a Field Spell in the list is a starter;
//   - a test deck can correct its starters, for decks that open some other way (Lswarm: two Level 4s,
//     with Evilswarm Castor's extra Normal Summon):
//     "smallWorld": { "starters": { "add": ["Card"], "remove": ["Card"], "addMatching": ["name fragment"] }, "note": "why" }
//     "addMatching" counts every card in the list whose name holds the fragment, in any case. A correction
//     that changes nothing (the tag already agrees) is reported and its note isn't shown.
//
// The opening odds: HANDS five-card hands from a seeded shuffle, once with the list as it is (any
// Small World taken out) and once with three Small World in place of three Spells or Traps that aren't
// starters. A hand counts when it holds a starter, or Small World plus a monster that reaches a monster
// starter through a bridge still in the Deck. "uplift" is the difference in percentage points.
// "cost" comes from the same hands: of those holding Small World, the share it rescues, the share that
// had a starter anyway and the share where it has nothing to do; of its rescues, the share where every
// monster you could reveal has the Hand Trap tag, so you give one up to start.
// Small World and the revealed monster leave the hand for one card, so it's always -1 in hand.
//
// Needs the network (Supabase). When Supabase can't be reached, or returns no Starter tags at all, the
// files stay as they are (exit 0).

'use strict';

const fs = require('fs');
const path = require('path');
const DeckList = require('../assets/js/decklist.js');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const DECK_DIR = path.join(DATA_DIR, 'decklists');
const OUT_DIR = path.join(DATA_DIR, 'small-world-scores');
const PAGES_DIR = path.join(ROOT, 'pages');

const args = process.argv.slice(2);
const arg = (name, def) => {
    const a = args.find(x => x.startsWith(`--${name}=`));
    return a ? a.slice(name.length + 3) : def;
};
const HANDS = parseInt(arg('hands', '40000'), 10) || 40000;
const ONLY = arg('only', '') ? arg('only', '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : null;

const METHOD = '2026-11-24.2'; // Starter and Hand Trap tags from the database
const SMALL_WORLD = 'Small World';
const SW_COPIES = 3;
const HAND_SIZE = 5;
const EXTRA_DECK = /fusion|synchro|xyz|link/i;
const STARTER_TAG = 'Starter';
const HAND_TRAP_TAG = 'Hand Trap';
// Searches a Field Spell: a starter only when one of the deck's Field Spells is
const FIELD_SEARCHERS = new Set(['Terraforming']);
// Uplift in percentage points -> label
const BANDS = [
    { min: 12, label: 'Core' },
    { min: 7, label: 'Strong' },
    { min: 3, label: 'Useful' },
    { min: -Infinity, label: 'Minor' }
];

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

// ---------- Supabase ----------

function supabaseConfig() {
    const text = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'supabase-config.js'), 'utf8');
    const url = /url:\s*'([^']+)'/.exec(text);
    const key = /anonKey:\s*'([^']+)'/.exec(text);
    if (!url || !key) throw new Error('No Supabase url/anonKey in assets/js/supabase-config.js');
    return { url: url[1], key: key[1] };
}

let SB = null;
async function rest(query, init = {}) {
    const res = await fetch(`${SB.url}/rest/v1/${query}`, {
        ...init,
        headers: { apikey: SB.key, Authorization: `Bearer ${SB.key}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
}

// Supabase returns at most this many rows per request and cuts the rest silently (with no order,
// a different part each time), so a batch that comes back full is split in two and asked again.
const MAX_ROWS = 1000;
async function allRows(batch, fetchRows) {
    const rows = await fetchRows(batch);
    if (rows.length < MAX_ROWS || batch.length === 1) return rows;
    const mid = Math.ceil(batch.length / 2);
    return [...await allRows(batch.slice(0, mid), fetchRows), ...await allRows(batch.slice(mid), fetchRows)];
}

// Runs fn over chunks with a few requests in flight
async function inChunks(items, size, fn, parallel = 4) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    let next = 0;
    const worker = async () => {
        while (next < chunks.length) await fn(chunks[next++]);
    };
    await Promise.all(Array.from({ length: Math.min(parallel, chunks.length) }, worker));
}

const CARD_COLUMNS = 'cardid,cardname,passcode,cardtype,attribute,types,level,atk,def,description,format';
const quoted = name => '"' + name.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const usable = row => row && row.passcode && !/anime/i.test(row.format || '');

// name -> Supabase card rows (a name can have several: alternate arts), by exact name, then the
// pre-release passcode in tcg-card-names.json, then a case-insensitive name. Rows are sorted by passcode
// so every run picks the same one first.
async function cardRows(names) {
    const rows = new Map();
    const keep = (name, list) => {
        const good = list.filter(usable).sort((a, b) => Number(a.passcode) - Number(b.passcode));
        if (good.length) rows.set(name, good);
    };
    await inChunks(names, 60, async batch => {
        const found = await allRows(batch, b => rest(`cards?select=${CARD_COLUMNS}&cardname=in.(${encodeURIComponent(b.map(quoted).join(','))})&order=cardid.asc`));
        const byName = new Map();
        found.forEach(r => { if (!byName.has(r.cardname)) byName.set(r.cardname, []); byName.get(r.cardname).push(r); });
        byName.forEach((list, name) => keep(name, list));
    });
    const tcgFile = readJson(path.join(DATA_DIR, 'tcg-card-names.json'));
    const tcg = new Map((tcgFile.cards || []).map(c => [c.name, c]));
    for (const name of names.filter(n => !rows.has(n))) {
        const entry = tcg.get(name);
        const code = entry && (entry.passcode || entry.prerelease);
        let found = code ? await rest(`cards?select=${CARD_COLUMNS}&passcode=eq.${Number(code)}`) : [];
        if (!found.some(usable)) {
            found = await rest(`cards?select=${CARD_COLUMNS}&cardname=ilike.${encodeURIComponent(name.replace(/[%_\\]/g, c => '\\' + c))}&limit=3`);
        }
        keep(name, found);
    }
    return rows;
}

// passcode -> tag names (get_card_tags_by_passcodes, which includes the card-level Starter and Hand Trap tags)
async function cardTags(passcodes) {
    const out = new Map();
    await inChunks(passcodes, 60, async batch => {
        const rows = await allRows(batch, b => rest('rpc/get_card_tags_by_passcodes', { method: 'POST', body: JSON.stringify({ passcodes: b }) }));
        rows.forEach(r => {
            const code = Number(r.passcode);
            if (!out.has(code)) out.set(code, new Set());
            out.get(code).add(r.tagname);
        });
    });
    return out;
}

// ---------- Card data ----------

const stat = v => (v === null || v === undefined || v === '' || Number(v) < 0 || !Number.isFinite(Number(v))) ? null : Number(v);

function kindOf(type) {
    const t = String(type || '');
    if (/spell/i.test(t)) return 'spell';
    if (/trap/i.test(t)) return 'trap';
    if (/monster|tuner|normal|effect|ritual|pendulum|fusion|synchro|xyz|link/i.test(t)) return 'monster';
    return 'unknown';
}

// One record per card name: stats from the site's card cache (TCG names), Supabase as the fallback
function cardRecord(name, cache, row, tags) {
    const c = cache[name.toLowerCase()];
    const type = (c && c.type) || (row && row.cardtype) || '';
    const kind = kindOf(type);
    return {
        name,
        // The card browser matches by passcode: Supabase files a new set's cards under their OCG names
        passcode: row && row.passcode ? Number(row.passcode) : null,
        kind: kind === 'monster' && EXTRA_DECK.test(type) ? 'extra' : kind,
        field: kind === 'spell' && ((c && c.race === 'Field') || /field/i.test((row && row.types) || '')),
        race: (c && c.race) || (row && row.types) || null,
        attribute: (c && c.attribute) || (row && row.attribute) || null,
        level: stat(c ? c.level : row && row.level),
        atk: stat(c ? c.atk : row && row.atk),
        def: stat(c ? c.def : row && row.def),
        tags: tags || new Set(),
        known: !!(c || row)
    };
}

// The database's Starter tag; Small World itself and hand traps never count
const isStarter = r => r.name !== SMALL_WORLD && r.tags.has(STARTER_TAG) && !r.tags.has(HAND_TRAP_TAG);

// ---------- Small World ----------

const PROPS = ['race', 'attribute', 'level', 'atk', 'def'];
const sharedCount = (a, b) => PROPS.filter(p => a[p] !== null && a[p] !== undefined && a[p] === b[p]).length;

function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
const hashString = s => [...s].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;

const BLANK = -1;
const SW_SLOT = -2;

// Share of hands that hold a starter, or Small World plus a monster that reaches a monster starter.
// With `stats`, also sorts every hand that holds Small World: it rescues the hand (no starter without
// it), the hand had a starter already, or it has nothing to do (dead); and counts the rescues where
// every monster you could reveal is a hand trap, so starting costs you one.
function openingOdds(slots, cards, reach, rng, stats) {
    const deck = slots.slice();
    const n = deck.length;
    const remaining = new Int32Array(cards.length);
    let ok = 0;
    for (let h = 0; h < HANDS; h++) {
        for (let i = 0; i < HAND_SIZE; i++) {
            const j = i + Math.floor(rng() * (n - i));
            const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
        }
        let starter = false;
        let sw = false;
        for (let i = 0; i < HAND_SIZE; i++) {
            const x = deck[i];
            if (x === SW_SLOT) sw = true;
            else if (x >= 0 && cards[x].starter) starter = true;
        }
        if (sw && stats) stats.drawn++;
        if (starter) {
            ok++;
            if (sw && stats) stats.started++;
            continue;
        }
        if (!sw) continue;
        remaining.fill(0);
        for (let i = HAND_SIZE; i < n; i++) if (deck[i] >= 0) remaining[deck[i]]++;
        let hit = false;
        let free = false; // a monster that isn't a hand trap can be the one revealed
        for (let i = 0; i < HAND_SIZE && !free; i++) {
            const m = deck[i];
            if (m < 0 || !reach[m]) continue;
            for (const [t, bridges] of reach[m]) {
                if (remaining[t] > 0 && bridges.some(b => remaining[b] > 0)) {
                    hit = true;
                    if (!cards[m].handTrap) free = true;
                    break;
                }
            }
        }
        if (hit) ok++;
        if (stats) {
            if (!hit) stats.dead++;
            else {
                stats.rescued++;
                if (!free) stats.handTrap++;
            }
        }
    }
    return ok / HANDS;
}

function scoreDeck(file, deck, list, records) {
    const override = (deck.smallWorld && deck.smallWorld.starters) || {};
    const add = new Set(override.add || []);
    const remove = new Set(override.remove || []);
    // Name fragments, any case: every card in the list whose name holds one counts ("lswarm" -> Evilswarm)
    const addMatching = (override.addMatching || []).map(s => String(s).toLowerCase()).filter(Boolean);
    const matches = name => addMatching.some(p => name.toLowerCase().includes(p));
    const entries = list.main.filter(e => e.name !== SMALL_WORLD);
    const cards = entries.map(e => {
        const r = records.get(e.name);
        return Object.assign({}, r, {
            count: e.count, starter: r ? isStarter(r) : false, source: 'tag',
            handTrap: !!(r && r.tags.has(HAND_TRAP_TAG))
        });
    });
    // Terraforming: only as good as the Field Spell it finds
    const fieldStarter = cards.some(c => c.field && c.starter && !FIELD_SEARCHERS.has(c.name));
    cards.forEach(c => { if (FIELD_SEARCHERS.has(c.name) && !fieldStarter) c.starter = false; });
    // The test deck's corrections; one the tag already agrees with changes nothing and is reported
    const redundant = [];
    cards.forEach(c => {
        if (remove.has(c.name)) {
            if (c.starter) { c.starter = false; c.source = 'removed'; } else redundant.push(`remove "${c.name}"`);
        }
        if (add.has(c.name) || matches(c.name)) {
            if (!c.starter) { c.starter = true; c.source = 'added'; } else if (add.has(c.name)) redundant.push(`add "${c.name}"`);
        }
    });
    const corrected = cards.some(c => c.source === 'added' || c.source === 'removed');
    const unused = [...add, ...remove].filter(n => !cards.some(c => c.name === n))
        .concat(addMatching.filter(p => !cards.some(c => c.name.toLowerCase().includes(p))).map(p => `addMatching "${p}"`));

    const pool = cards.map((c, i) => (c.kind === 'monster' && c.known ? i : -1)).filter(i => i >= 0);
    const starterMonsters = pool.filter(i => cards[i].starter);
    const bridgesFor = (m, t) => pool.filter(b => b !== m && b !== t
        && sharedCount(cards[m], cards[b]) === 1 && sharedCount(cards[b], cards[t]) === 1);
    const allowed = (m, t) => m !== t || cards[m].count > 1;

    // Connectivity over every ordered pair of the deck's monsters (one card each, as the finder shows them)
    let pairs = 0, connected = 0, robust = 0;
    for (const m of pool) for (const t of pool) {
        if (!allowed(m, t)) continue;
        pairs++;
        const n = bridgesFor(m, t).length;
        if (n) connected++;
        if (n > 1) robust++;
    }
    // Reach into the monster starters, weighted by copies
    const reach = cards.map(() => null);
    let starterPairs = 0, starterReached = 0;
    for (const m of pool) {
        reach[m] = [];
        for (const t of starterMonsters) {
            if (!allowed(m, t)) continue;
            const w = cards[m].count * cards[t].count;
            starterPairs += w;
            const bs = bridgesFor(m, t);
            if (bs.length) { reach[m].push([t, bs]); starterReached += w; }
        }
    }

    // Slots: the list as it is, then three Small World in place of Spells/Traps that aren't starters
    const slots = [];
    cards.forEach((c, i) => { for (let k = 0; k < c.count; k++) slots.push(c.known ? i : BLANK); });
    while (slots.length < DeckList.SIZE.main) slots.push(BLANK);
    const withSw = slots.slice();
    const order = [
        ...withSw.map((x, i) => (x === BLANK ? i : -1)),
        ...withSw.map((x, i) => (x >= 0 && cards[x].kind === 'trap' && !cards[x].starter ? i : -1)),
        ...withSw.map((x, i) => (x >= 0 && cards[x].kind === 'spell' && !cards[x].starter ? i : -1))
    ].filter(i => i >= 0);
    const swaps = order.slice(0, SW_COPIES);
    swaps.forEach(i => { withSw[i] = SW_SLOT; });
    for (let k = swaps.length; k < SW_COPIES; k++) withSw.push(SW_SLOT);

    const seed = hashString(file);
    const without = openingOdds(slots, cards, reach, mulberry32(seed));
    const stats = { drawn: 0, rescued: 0, started: 0, dead: 0, handTrap: 0 };
    const withOdds = openingOdds(withSw, cards, reach, mulberry32(seed), stats);
    const uplift = round(100 * (withOdds - without), 1);
    // What it costs: of the hands that hold Small World, the share it rescues, the share that had a
    // starter anyway (it took the slot of another card), the share where it has nothing to do; and of
    // its rescues, the share where the only monsters you could reveal are hand traps
    const share = (a, b) => (b ? round(a / b, 3) : null);
    const cost = {
        rescued: share(stats.rescued, stats.drawn),
        started: share(stats.started, stats.drawn),
        dead: share(stats.dead, stats.drawn),
        handTrap: share(stats.handTrap, stats.rescued)
    };
    const label = starterMonsters.length ? BANDS.find(b => uplift >= b.min).label : 'None';

    return {
        summary: {
            archetype: deck.archetype,
            label,
            uplift,
            open: { without: round(without, 3), with: round(withOdds, 3) },
            connectivity: { pairs: pairs ? round(connected / pairs, 3) : 0, robust: pairs ? round(robust / pairs, 3) : 0 },
            starterReach: starterPairs ? round(starterReached / starterPairs, 3) : 0,
            cost,
            monsters: pool.reduce((s, i) => s + cards[i].count, 0),
            monsterStarters: starterMonsters.length
        },
        starters: cards.filter(c => c.starter).map(c => ({ name: c.name, passcode: c.passcode, kind: c.kind, count: c.count, source: c.source })),
        removed: cards.filter(c => c.source === 'removed').map(c => c.name),
        // Shown as "Corrected by hand" only when the correction changed a starter
        note: corrected ? (deck.smallWorld && deck.smallWorld.note) || null : null,
        pool: pool.map(i => {
            const c = cards[i];
            return { name: c.name, passcode: c.passcode, count: c.count, starter: c.starter, race: c.race, attribute: c.attribute, level: c.level, atk: c.atk, def: c.def };
        }),
        replaced: swaps.length,
        missing: cards.filter(c => !c.known).map(c => c.name),
        unusedOverrides: unused,
        redundantOverrides: redundant
    };
}

// Pages that embed the bridge finder (assets/js/small-world-finder.js): deck name -> { page, anchor }
function finderPages() {
    const out = new Map();
    for (const file of fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'))) {
        const html = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
        for (const tag of html.match(/<div\b[^>]*\bdata-small-world-finder\b[^>]*>/g) || []) {
            const deck = /\bdata-deck="([^"]+)"/.exec(tag);
            const id = /\bid="([^"]+)"/.exec(tag);
            if (deck && !out.has(deck[1])) out.set(deck[1], { page: file, anchor: id ? id[1] : null });
        }
    }
    return out;
}

// ---------- Main ----------

async function main() {
    SB = supabaseConfig();
    const index = readJson(path.join(DECK_DIR, 'index.json'));
    const packagesFile = readJson(path.join(DECK_DIR, 'packages.json'));
    const generated = fs.existsSync(path.join(DECK_DIR, 'packages.generated.json')) ? readJson(path.join(DECK_DIR, 'packages.generated.json')) : { packages: {} };
    const profiles = fs.existsSync(path.join(DECK_DIR, 'profiles.json')) ? readJson(path.join(DECK_DIR, 'profiles.json')) : {};
    const banMap = DeckList.banMapFromJson(readJson(path.join(DATA_DIR, 'banlist.json')));
    const packages = Object.assign({}, generated.packages, packagesFile.packages);
    const cache = readJson(path.join(DATA_DIR, 'cards-cache.json'));

    const names = {};
    Object.entries(index).forEach(([key, file]) => { names[key] = file; });
    let files = [...new Set(Object.values(index))];
    if (ONLY) files = files.filter(f => ONLY.includes(f.toLowerCase()) || Object.keys(index).some(k => index[k] === f && ONLY.includes(k.toLowerCase())));
    if (!files.length) {
        console.log('No test deck matches --only.');
        return;
    }

    const lists = new Map();
    for (const file of files) {
        try {
            const deck = readJson(path.join(DECK_DIR, file));
            lists.set(file, { deck, list: DeckList.assemble(deck, packages, banMap, profiles[file]) });
        } catch (err) {
            console.warn(`  ${file}: could not assemble (${err.message})`);
        }
    }
    const allNames = [...new Set([...lists.values()].flatMap(({ list }) => list.main.map(e => e.name)))];
    console.log(`${lists.size} test decks, ${allNames.length} Main Deck cards. Reading Supabase...`);

    let rows, tags;
    try {
        rows = await cardRows(allNames);
        const all = [...rows.values()].flat();
        tags = await cardTags([...new Set(all.map(r => Number(r.passcode)))]);
    } catch (err) {
        console.warn(`Supabase could not be read, so the scores stay as they are: ${err.message}`);
        return;
    }
    // A database without Starter tags would turn every deck into "no starters": keep last week's files
    if (![...tags.values()].some(set => set.has(STARTER_TAG))) {
        console.warn(`Supabase returned no "${STARTER_TAG}" tags, so the scores stay as they are.`);
        return;
    }
    // Tags from every row of the name, so an alternate art without them doesn't hide them
    const union = (list, map, key) => new Set(list.flatMap(r => [...(map.get(key(r)) || [])]));
    const records = new Map(allNames.map(name => {
        const list = rows.get(name) || [];
        return [name, cardRecord(name, cache, list[0], union(list, tags, r => Number(r.passcode)))];
    }));
    const noData = allNames.filter(n => !rows.has(n));
    if (noData.length) console.log(`  No Supabase row for ${noData.length} card(s): ${noData.slice(0, 12).join(', ')}${noData.length > 12 ? ', ...' : ''}`);

    const finders = finderPages();
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const indexFile = path.join(OUT_DIR, 'index.json');
    const out = fs.existsSync(indexFile) && ONLY ? readJson(indexFile) : { decks: {} };
    out.method = METHOD;
    out.hands = HANDS;
    out.bands = BANDS.filter(b => Number.isFinite(b.min)).map(b => ({ label: b.label, min: b.min }));
    out.names = names;

    for (const [file, { deck, list }] of lists) {
        const result = scoreDeck(file, deck, list, records);
        const finderKey = [...finders.keys()].find(k => index[k] === file);
        const finder = finderKey ? finders.get(finderKey) : null;
        const body = Object.assign({ method: METHOD, file, hands: HANDS }, result.summary, {
            finder,
            starters: result.starters,
            removed: result.removed,
            note: result.note,
            replaced: result.replaced,
            missing: result.missing,
            pool: result.pool
        });
        fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(body, null, 1) + '\n');
        out.decks[file] = Object.assign({}, result.summary, finder ? { finder } : {});
        if (result.unusedOverrides.length) console.warn(`  ${file}: smallWorld override names not in the list: ${result.unusedOverrides.join(', ')}`);
        if (result.redundantOverrides.length) console.log(`  ${file}: smallWorld corrections the Starter tag already agrees with: ${result.redundantOverrides.join(', ')}`);
    }
    // Drop decks whose list file is gone
    Object.keys(out.decks).forEach(file => { if (!Object.values(index).includes(file)) delete out.decks[file]; });
    out.decks = Object.fromEntries(Object.entries(out.decks).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(indexFile, JSON.stringify(out, null, 1) + '\n');

    const rowsOut = [...lists.keys()].map(f => [f, out.decks[f]]).filter(([, s]) => s);
    const counts = {};
    rowsOut.forEach(([, s]) => { counts[s.label] = (counts[s.label] || 0) + 1; });
    console.log(`Wrote ${rowsOut.length} deck file(s) and index.json to ${path.relative(ROOT, OUT_DIR)}. Labels: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
