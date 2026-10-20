// scripts/check-decklists.js
// Checks every test deck in assets/data/decklists/ and rewrites index.json
// (the archetype -> file map card-loader.js reads to show the Test Deck button)
// and profiles.json (each list's Main Deck monsters, which "auto" Extra Deck
// fill reads; run scripts/build-extra-packages.js first for fresh packages).
//
//   node scripts/check-decklists.js                      report, exit 1 on errors
//   node scripts/check-decklists.js --report <file>      also write the report as JSON
//   node scripts/check-decklists.js --no-fail            always exit 0 (weekly workflow)
//
// The list is assembled with the same assemble() the page uses
// (assets/js/decklist.js), against assets/data/banlist.json. Card data comes
// from the YGOProDeck API. Checks:
//   errors   not a real card name, not out in the TCG, Main/Extra Deck mix-up,
//            deck size, another archetype's card that isn't in "allow"
//   review   a card the banlist now cuts, a combo card the list doesn't run,
//            a card of the archetype released in the TCG after "reviewed"
//   warnings an "allow"/"exclude" entry the list doesn't use

const fs = require('fs');
const path = require('path');
const DeckList = require('../assets/js/decklist.js');

const DATA_DIR = path.join(__dirname, '..', 'assets', 'data');
const DECK_DIR = path.join(DATA_DIR, 'decklists');
const GENESYS_FILE = path.join(DATA_DIR, 'genesys_points.json');
const RESERVED = new Set(['index.json', 'packages.json', 'packages.generated.json', 'profiles.json', 'report.json']);
const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const EXTRA_TYPES = /fusion|synchro|xyz|link/i;

const args = process.argv.slice(2);
const reportPath = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;
const noFail = args.includes('--no-fail');

// Some data files start with a UTF-8 byte-order mark, which JSON.parse rejects.
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
// YGOProDeck lists announced cards with their future TCG date.
const TODAY = new Date().toISOString().slice(0, 10);
const released = info => !!info.tcgDate && info.tcgDate <= TODAY;
const notOut = (name, info) => (info.tcgDate ? `${name} isn't out in the TCG until ${info.tcgDate}.` : `${name} isn't out in the TCG.`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'ArcheTypeNexus-decklist-check' } });
    if (res.status === 400) return { data: [] };   // the API's "no card matched"
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return res.json();
}

// name (lowercased) -> { name, type, archetype, tcgDate, level, attribute, race, desc }
const cardInfo = new Map();
const store = card => {
    const misc = (card.misc_info && card.misc_info[0]) || {};
    cardInfo.set(card.name.toLowerCase(), {
        name: card.name, type: card.type, archetype: card.archetype || null, tcgDate: misc.tcg_date || null,
        level: card.level || null, attribute: card.attribute || null, race: card.race || null, desc: card.desc || ''
    });
};

async function lookupNames(names) {
    const todo = [...new Set(names)].filter(n => !cardInfo.has(n.toLowerCase()));
    if (todo.length > 0) {
        console.log(`[Deck Check] Looking up card info for ${todo.length} cards in batches of 40...`);
    }
    for (let i = 0; i < todo.length; i += 40) {
        const batch = todo.slice(i, i + 40);
        const { data = [] } = await fetchJson(`${API}?misc=yes&name=${encodeURIComponent(batch.join('|'))}`);
        data.forEach(store);
        await sleep(120);
    }
}

async function lookupArchetype(pattern) {
    const { data = [] } = await fetchJson(`${API}?misc=yes&fname=${encodeURIComponent(pattern)}`);
    data.forEach(store);
    await sleep(120);
    return data.map(card => card.name);
}

// Opponent cards (p2-…), tokens and placeholders aren't deck cards.
function comboCardNames(file) {
    const json = readJson(path.join(DATA_DIR, file));
    const names = new Set();
    Object.values(json.combos || {}).forEach(combo => {
        (Array.isArray(combo.cards) ? combo.cards : Object.values(combo.cards || {})).forEach(card => {
            const name = typeof card === 'string' ? card : card && card.name;
            const id = String((card && card.id) || '');
            if (!name || card.isToken || card.isDummy || id.startsWith('p2-')) return;
            if (/^(token|any |dummy-)/i.test(name) || /token$/i.test(name)) return;
            names.add(name);
        });
    });
    return [...names];
}

function main() {
    return run().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

async function run() {
    const banlist = readJson(path.join(DATA_DIR, 'banlist.json'));
    const banMap = DeckList.banMapFromJson(banlist);
    let genesys = null;
    try { genesys = readJson(GENESYS_FILE); } catch (e) {}
    const { packages } = readJson(path.join(DECK_DIR, 'packages.json'));
    const generatedFile = path.join(DECK_DIR, 'packages.generated.json');
    const generated = fs.existsSync(generatedFile) ? readJson(generatedFile) : { packages: {} };
    const allPackages = Object.assign({}, generated.packages, packages);
    const profilesFile = path.join(DECK_DIR, 'profiles.json');
    const oldProfiles = fs.existsSync(profilesFile) ? readJson(profilesFile) : {};
    const files = fs.readdirSync(DECK_DIR).filter(f => f.endsWith('.json') && !RESERVED.has(f)).sort();

    const packageNames = new Map();   // lowercased card -> package
    Object.entries(allPackages).forEach(([pkg, def]) => def.cards.forEach(row => packageNames.set(DeckList.readRow(row).name.toLowerCase(), pkg)));

    const decks = files.map(file => ({ file, deck: readJson(path.join(DECK_DIR, file)) }));

    let apiOk = true;
    try {
        const allNames = Object.values(packages).flatMap(p => p.cards.map(([name]) => name));
        decks.forEach(({ deck }) => ['main', 'extra'].forEach(z => (deck[z] || []).forEach(r => allNames.push(DeckList.readRow(r).name))));
        await lookupNames(allNames);
    } catch (error) {
        apiOk = false;
        console.warn(`Card data unavailable (${error.message}); skipping the name, TCG, zone, purity and new-card checks.\n`);
    }

    const report = {
        banlist: (banlist.tcg && banlist.tcg.effectiveDate) || null,
        packages: [],
        generated: { updated: generated.updated || null, changes: generated.changes || {} },
        decks: {}
    };
    const index = {};
    const profiles = {};

    // Packages: every name real, out in the TCG and in the right zone.
    if (apiOk) {
        Object.entries(packages).forEach(([pkg, def]) => def.cards.forEach(([name]) => {
            const info = cardInfo.get(name.toLowerCase());
            if (!info) report.packages.push(`${pkg}: "${name}" isn't a card name.`);
            else if (!released(info)) report.packages.push(`${pkg}: ${notOut(name, info)}`);
            else if (EXTRA_TYPES.test(info.type) !== (def.zone === 'extra')) report.packages.push(`${pkg}: ${name} is a ${info.type}, but the package is for the ${def.zone === 'extra' ? 'Extra' : 'Main'} Deck.`);
            const status = DeckList.banStatus(name, banMap);
            if (status === 'Forbidden') report.packages.push(`${pkg}: ${name} is Forbidden, so every list skips it.`);
        }));
    }

    console.log(`[Deck Check] Verifying ${decks.length} test decks against the banlist...`);
    let checkedCount = 0;
    for (const { file, deck } of decks) {
        checkedCount++;
        if (checkedCount % 25 === 0 || checkedCount === decks.length) {
            console.log(`[Deck Check] Progress: ${checkedCount}/${decks.length} decks checked...`);
        }
        const errors = [];
        const review = [];
        const warnings = [];
        const archetype = deck.archetype;
        if (!archetype) { errors.push('Missing "archetype".'); }
        if (!['draft', 'reviewed'].includes(deck.status)) errors.push('"status" must be "draft" or "reviewed".');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(deck.reviewed || '')) errors.push('"reviewed" must be a date like 2026-10-12.');
        // "aliases" are other pages that open this same list (Resonator -> Red Dragon Archfiend).
        [archetype, ...(deck.aliases || [])].filter(Boolean).forEach(name => {
            if (index[name]) errors.push(`${index[name]} is already the list for ${name}.`);
            else index[name] = file;
        });

        // Build or preserve a profile for each test deck so that both Extra Deck auto
        // picks and Main Deck tailored spell packages have profile data.
        const profile = apiOk
            ? DeckList.deckProfile(deck.main || [], name => cardInfo.get(name.toLowerCase()) || null)
            : oldProfiles[file] || null;
        if (profile) profiles[file] = profile;
        if (profile && profile.locks.length) {
            warnings.push(`Main Deck cards lock the Extra Deck (${profile.locks.join(', ')}): the auto picks follow it, the generic Links at the end don't.`);
        }

        const list = DeckList.assemble(deck, allPackages, banMap, profile);
        list.issues.forEach(issue => (issue.level === 'review' ? review : issue.level === 'error' ? errors : warnings).push(issue.message));

        const isOwn = DeckList.ownMatcher(deck);
        const allow = deck.allow || {};
        const allowed = new Set(Object.keys(allow).map(n => n.toLowerCase()));
        const listed = new Set([...list.main, ...list.extra].map(e => e.name.toLowerCase()));

        if (apiOk) {
            ['main', 'extra'].forEach(zone => (deck[zone] || []).forEach(raw => {
                const { name } = DeckList.readRow(raw);
                const info = cardInfo.get(name.toLowerCase());
                if (!info) { errors.push(`"${name}" isn't a card name (check the spelling).`); return; }
                if (info.name !== name) errors.push(`"${name}" should be written "${info.name}".`);
                if (!released(info)) errors.push(notOut(name, info));
                if (EXTRA_TYPES.test(info.type) !== (zone === 'extra')) errors.push(`${name} is a ${info.type}; move it to the ${zone === 'extra' ? 'Main' : 'Extra'} Deck.`);
                // The API's tag can't be trusted to list every card of an archetype, but a card
                // it tags as this deck's own archetype ("always treated as" cards) does belong.
                const taggedOwn = info.archetype && archetype && info.archetype.toLowerCase() === archetype.toLowerCase();
                if (!isOwn(name) && !taggedOwn && !packageNames.has(name.toLowerCase()) && !allowed.has(name.toLowerCase()) && info.archetype) {
                    errors.push(`${name} belongs to "${info.archetype}": add it to "allow" with a reason, or take it out.`);
                }
            }));

            // New support since the last review.
            for (const pattern of deck.match && deck.match.length ? deck.match : [archetype]) {
                try {
                    const names = await lookupArchetype(pattern);
                    names.forEach(name => {
                        const info = cardInfo.get(name.toLowerCase());
                        if (info && released(info) && info.tcgDate > deck.reviewed && !listed.has(name.toLowerCase())) {
                            review.push(`New since the last review: ${name} (TCG ${info.tcgDate}) isn't in the list.`);
                        }
                    });
                } catch (error) {
                    warnings.push(`Couldn't look up "${pattern}" cards: ${error.message}`);
                }
            }
        }

        Object.keys(allow).forEach(name => {
            if (!listed.has(name.toLowerCase())) warnings.push(`"allow" names ${name}, but the list doesn't run it.`);
        });

        // Every card the page's combos use should be in the list.
        (deck.combos || []).forEach(comboFile => {
            let names;
            try { names = comboCardNames(comboFile); } catch (error) { warnings.push(`Couldn't read ${comboFile}: ${error.message}`); return; }
            const missing = names.filter(n => !listed.has(n.toLowerCase()));
            if (missing.length) review.push(`Combos in ${comboFile} use cards the list doesn't run: ${missing.join(', ')}.`);
        });

        const count = zone => list[zone].reduce((s, e) => s + e.count, 0);
        const genesysRes = DeckList.verifyGenesys(list, name => cardInfo.get(name.toLowerCase()), genesys, 'tcg');
        report.decks[archetype || file] = {
            file, status: deck.status, reviewed: deck.reviewed,
            main: count('main'), extra: count('extra'),
            genesys: {
                totalPoints: genesysRes.totalPoints,
                isLegal: genesysRes.isLegal,
                violations: genesysRes.violations.map(v => v.message)
            },
            errors, review, warnings
        };
    }

    const sortedIndex = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(path.join(DECK_DIR, 'index.json'), JSON.stringify(sortedIndex, null, 4) + '\n');
    fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2) + '\n');
    if (reportPath) fs.writeFileSync(path.resolve(reportPath), JSON.stringify(report, null, 4) + '\n');

    // ---- Console summary ----
    let errorCount = report.packages.length;
    console.log(`Test decks: ${files.length} · banlist of ${report.banlist}${apiOk ? '' : ' · card data unavailable'}\n`);
    if (report.packages.length) {
        console.log('packages.json');
        report.packages.forEach(m => console.log(`  ✗ ${m}`));
        console.log();
    }
    Object.entries(report.decks).forEach(([name, d]) => {
        errorCount += d.errors.length;
        const state = d.errors.length ? 'needs fixing' : d.review.length ? 'needs review' : 'ok';
        const genesysStr = d.genesys ? ` · Genesys: ${d.genesys.totalPoints} pts (${d.genesys.isLegal ? 'Legal' : 'Not Legal'})` : '';
        console.log(`${name} (${d.file}) — ${d.status}, reviewed ${d.reviewed} · ${d.main} + ${d.extra}${genesysStr} · ${state}`);
        d.errors.forEach(m => console.log(`  ✗ ${m}`));
        d.review.forEach(m => console.log(`  ! ${m}`));
        d.warnings.forEach(m => console.log(`  · ${m}`));
    });
    const listCount = new Set(Object.values(sortedIndex)).size;
    const pageCount = Object.keys(sortedIndex).length;
    console.log(`\nindex.json: ${listCount} list(s)${pageCount > listCount ? ` for ${pageCount} pages` : ''}.`);
    if (errorCount && !noFail) process.exit(1);
}

main();
