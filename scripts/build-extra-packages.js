// scripts/build-extra-packages.js
// Builds assets/data/decklists/packages.generated.json: Extra Deck packages for
// test decks whose "fill" is "auto" (see assemble() in assets/js/decklist.js).
//
//   node scripts/build-extra-packages.js                  fetch card data from YGOProDeck
//   node scripts/build-extra-packages.js --data <file>    use a saved cardinfo.php?misc=yes dump
//
// Every TCG-legal Synchro, Xyz and Link Monster whose materials are generic is
// sorted into a package by its material line ("2 Level 4 monsters" -> Rank 4,
// "2 monsters, including an EARTH monster" -> EARTH Links, "1 Tuner + 1+
// non-Tuner monsters" -> Synchros of its Level). Each package records what a
// deck needs to reach it, so assemble() only picks packages a list can use.
// Skipped: Fusions (they need a Polymerization), Link-1s, Forbidden cards,
// cards whose effect names another card or archetype in quotes, and cards that
// lock or restrict Special Summons.
//
// Each package is ordered by YGOProDeck's views this week, averaged over the
// last weeks in scripts/data/extra-package-views.json so lists don't flip
// every week. The "generated" section of packages.json has the final say:
// "pin" puts cards first in a package, "exclude" keeps a card out, and "notes"
// gives a card its hover text (notes in the hand-written packages count too).
// The weekly workflow runs this before scripts/check-decklists.js.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DECK_DIR = path.join(ROOT, 'assets', 'data', 'decklists');
const OUT = path.join(DECK_DIR, 'packages.generated.json');
const HISTORY = path.join(__dirname, 'data', 'extra-package-views.json');
const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes';

const PER_PACKAGE = 8;      // cards kept per package
const WEEKS = 8;            // weeks of views averaged for the order
const ATTRIBUTES = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
// How many Main Deck monsters a list needs before a package counts as reachable.
const NEEDS = { xyzPerMaterial: 2, linkIncluding: 4, linkAll: 6 };

const args = process.argv.slice(2);
const dataFile = args.includes('--data') ? args[args.indexOf('--data') + 1] : null;
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
const TODAY = new Date().toISOString().slice(0, 10);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function loadCards() {
    if (dataFile) return readJson(dataFile).data;
    const res = await fetch(API, { headers: { 'User-Agent': 'ArcheTypeNexus-extra-packages' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${API}`);
    return (await res.json()).data;
}

// "Warrior-Type" in older text is "Warrior" now.
function trait(word, types) {
    const w = word.replace(/-Type$/, '');
    if (ATTRIBUTES.includes(w)) return w;
    return types.has(w) ? w : null;
}

// Material line -> { id, label, kind, needs } or null when it isn't generic.
function classify(card, materials, types) {
    const T = '([A-Z][A-Za-z-]*(?: [A-Z][a-z]+)?)';
    let m;
    if (/XYZ/.test(card.type)) {
        if ((m = materials.match(/^(\d)\+? Level (\d+) monsters$/))) {
            const level = Number(m[2]);
            return { id: `auto-xyz-${level}`, label: `Rank ${level}`, kind: 'xyz', needs: { level, min: Number(m[1]) * NEEDS.xyzPerMaterial } };
        }
        if ((m = materials.match(new RegExp(`^(\\d)\\+? Level (\\d+) ${T} monsters$`)))) {
            const level = Number(m[2]);
            const has = trait(m[3], types);
            if (!has) return null;
            return { id: `auto-xyz-${level}-${slug(has)}`, label: `Rank ${level} (${has})`, kind: 'xyz', needs: { level, with: has, min: Number(m[1]) * NEEDS.xyzPerMaterial } };
        }
        return null;
    }
    if (/Synchro/.test(card.type)) {
        if ((m = materials.match(new RegExp(`^1 (?:${T} )?Tuners? \\+ [12](?:\\+| or more) non-Tuner (?:${T} )?monsters?$`)))) {
            const tuner = m[1] ? trait(m[1], types) : null;
            const nonTuner = m[2] ? trait(m[2], types) : null;
            if ((m[1] && !tuner) || (m[2] && !nonTuner)) return null;
            const level = card.level;
            const parts = [tuner && `${tuner} Tuner`, nonTuner && `${nonTuner} non-Tuners`].filter(Boolean);
            return {
                id: ['auto-synchro', level, tuner && `tuner-${slug(tuner)}`, nonTuner && slug(nonTuner)].filter(Boolean).join('-'),
                label: `Level ${level} Synchros${parts.length ? ` (${parts.join(', ')})` : ''}`,
                kind: 'synchro',
                needs: Object.assign({ synchro: level }, tuner && { tuner }, nonTuner && { nonTuner })
            };
        }
        return null;
    }
    if (/Link/.test(card.type)) {
        const rating = card.linkval;
        if (!rating || rating < 2) return null;
        if ((m = materials.match(new RegExp(`^\\d\\+? monsters, including an? ${T} monster$`)))) {
            const has = trait(m[1], types);
            if (!has) return null;
            return { id: `auto-link-${slug(has)}`, label: `${has} Links`, kind: 'link', needs: { has, min: NEEDS.linkIncluding } };
        }
        if (/^\d\+? (?:non-Token |non-Link |Effect )?[Mm]onsters?(?:,? (?:except Tokens|with different (?:names|Types|Attributes)))?$/.test(materials)) {
            return { id: `auto-link${Math.min(rating, 4)}`, label: rating >= 4 ? 'Generic Link-4+' : `Generic Link-${rating}s`, kind: 'link', needs: { link: Math.min(rating, 4) } };
        }
        if ((m = materials.match(new RegExp(`^\\d\\+? ${T} monsters$`)))) {
            const has = trait(m[1], types);
            if (!has) return null;
            return { id: `auto-link-${slug(has)}-only`, label: `${has}-only Links`, kind: 'link', needs: { has, min: NEEDS.linkAll } };
        }
    }
    return null;
}

// Effects that name another card or archetype only work in that deck; locks
// and summon conditions don't belong in a generic top-up.
function unsuitable(card, effect) {
    const own = card.name.toLowerCase();
    // "(This card is always treated as a "Familiar-Possessed" card.)" adds a name; it doesn't need one.
    const text = effect.replace(/\(This card is (?:always )?treated as an? "[^"]+" card\.\)/g, '');
    const quoted = [...text.matchAll(/"([^"]+)"/g)].map(q => q[1].replace(/\(s\)$/, '').toLowerCase());
    if (quoted.some(q => q !== own)) return 'names another card';
    if (/cannot Special Summon|Cannot be Special Summoned|Must (?:first )?be (?:Special )?Summoned/i.test(text)) return 'summon lock or condition';
    return null;
}

async function main() {
    const { packages: hand = {}, generated: overlay = {} } = readJson(path.join(DECK_DIR, 'packages.json'));
    const pins = overlay.pin || {};
    const excluded = new Map(Object.entries(overlay.exclude || {}).map(([n, why]) => [n.toLowerCase(), why]));
    const notes = new Map();
    Object.values(hand).forEach(pkg => (pkg.cards || []).forEach(([name, , note]) => { if (note) notes.set(name.toLowerCase(), note); }));
    Object.entries(overlay.notes || {}).forEach(([name, note]) => notes.set(name.toLowerCase(), note));

    let cards;
    try {
        cards = await loadCards();
    } catch (error) {
        // Keep last week's packages rather than failing the whole workflow.
        console.warn(`Card data unavailable (${error.message}); packages.generated.json left as it was.`);
        return;
    }
    const types = new Set(cards.filter(c => /Monster/.test(c.type) && c.race).map(c => c.race));
    const byName = new Map(cards.map(c => [c.name.toLowerCase(), c]));

    // Views history: name -> { date: viewsweek }, trimmed to the last WEEKS runs.
    const history = fs.existsSync(HISTORY) ? readJson(HISTORY) : {};
    const views = name => {
        const weeks = Object.values(history[name] || {});
        return weeks.length ? weeks.reduce((s, v) => s + v, 0) / weeks.length : 0;
    };

    const buckets = new Map();
    const skipped = { 'names another card': 0, 'summon lock or condition': 0, excluded: 0 };
    for (const card of cards) {
        if (!/Synchro|XYZ|Link/.test(card.type) || /Fusion/.test(card.type)) continue;
        const misc = (card.misc_info && card.misc_info[0]) || {};
        if (!misc.tcg_date || misc.tcg_date > TODAY) continue;
        if (card.banlist_info && /Forbidden|Banned/.test(card.banlist_info.ban_tcg || '')) continue;
        const [materials, ...rest] = card.desc.split('\n');
        const pkg = classify(card, materials.trim(), types);
        if (!pkg) continue;
        if (excluded.has(card.name.toLowerCase())) { skipped.excluded++; continue; }
        const why = unsuitable(card, rest.join(' '));
        if (why) { skipped[why]++; continue; }

        const record = history[card.name] = history[card.name] || {};
        record[TODAY] = misc.viewsweek || 0;
        Object.keys(record).sort().slice(0, -WEEKS).forEach(date => delete record[date]);

        if (!buckets.has(pkg.id)) buckets.set(pkg.id, Object.assign(pkg, { cards: [] }));
        buckets.get(pkg.id).cards.push(card);
    }

    const row = (card, label) => ({
        name: card.name,
        count: 1,
        note: notes.get(card.name.toLowerCase()) || `Auto-picked ${label}: ${card.desc.split('\n')[0].trim()}.`,
        attribute: card.attribute,
        race: card.race,
        kind: /XYZ/.test(card.type) ? 'xyz' : /Synchro/.test(card.type) ? 'synchro' : 'link'
    });

    const previous = fs.existsSync(OUT) ? readJson(OUT).packages || {} : {};
    const packages = {};
    const changes = {};
    [...buckets.values()].sort((a, b) => a.id.localeCompare(b.id)).forEach(pkg => {
        const pinned = (pins[pkg.id] || []).map(n => byName.get(n.toLowerCase())).filter(Boolean);
        const pinnedNames = new Set(pinned.map(c => c.name));
        const ranked = pkg.cards
            .filter(c => !pinnedNames.has(c.name))
            .sort((a, b) => views(b.name) - views(a.name) || a.name.localeCompare(b.name));
        const chosen = [...pinned, ...ranked].slice(0, Math.max(PER_PACKAGE, pinned.length));
        packages[pkg.id] = { zone: 'extra', label: pkg.label, auto: { kind: pkg.kind, needs: pkg.needs }, cards: chosen.map(c => row(c, pkg.label)) };

        const before = new Set(((previous[pkg.id] || {}).cards || []).map(r => r.name));
        const after = new Set(chosen.map(c => c.name));
        const added = [...after].filter(n => !before.has(n));
        const removed = [...before].filter(n => !after.has(n));
        if (Object.keys(previous).length && (added.length || removed.length)) changes[pkg.label] = { added, removed };
    });
    Object.entries(pins).forEach(([id, names]) => {
        if (!packages[id]) console.warn(`packages.json pins cards to "${id}", but no package has that id.`);
        else names.filter(n => !byName.has(n.toLowerCase())).forEach(n => console.warn(`Pinned card "${n}" isn't a card name.`));
    });

    const out = {
        _readme: [
            'Generated by scripts/build-extra-packages.js; edit the "generated" section of packages.json instead.',
            'Extra Deck packages for test decks whose fill is "auto": each records what a deck needs ("auto.needs")',
            'and its cards are ordered by YGOProDeck views this week. "changes" lists what entered or left each package last run.'
        ],
        updated: TODAY,
        changes,
        packages
    };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
    fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
    const sortedHistory = Object.fromEntries(Object.entries(history).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(HISTORY, JSON.stringify(sortedHistory) + '\n');

    const total = Object.values(packages).reduce((s, p) => s + p.cards.length, 0);
    console.log(`packages.generated.json: ${Object.keys(packages).length} packages, ${total} cards.`);
    console.log(`Skipped: ${skipped['names another card']} that name another card, ${skipped['summon lock or condition']} with a summon lock, ${skipped.excluded} excluded in packages.json.`);
    Object.entries(changes).forEach(([label, { added, removed }]) => {
        console.log(`  ${label}: ${[...added.map(n => `+ ${n}`), ...removed.map(n => `- ${n}`)].join(', ')}`);
    });
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
