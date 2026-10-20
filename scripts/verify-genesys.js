// scripts/verify-genesys.js
// Verifies Genesys format legality and point totals across test decklists.
//
// Usage:
//   node scripts/verify-genesys.js              # Full summary and audit across all 501 test decks
//   node scripts/verify-genesys.js <archetype>  # Detailed breakdown for a specific archetype

const fs = require('fs');
const path = require('path');
const DeckList = require('../assets/js/decklist.js');

const DATA_DIR = path.join(__dirname, '..', 'assets', 'data');
const DECK_DIR = path.join(DATA_DIR, 'decklists');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));

const index = readJson(path.join(DECK_DIR, 'index.json'));
const staples = readJson(path.join(DECK_DIR, 'packages.json'));
let generated = { packages: {} };
try { generated = readJson(path.join(DECK_DIR, 'packages.generated.json')); } catch (e) {}
let profiles = {};
try { profiles = readJson(path.join(DECK_DIR, 'profiles.json')); } catch (e) {}
let banlist = null;
try { banlist = readJson(path.join(DATA_DIR, 'banlist.json')); } catch (e) {}
const genesys = readJson(path.join(DATA_DIR, 'genesys_points.json'));

const packages = Object.assign({}, generated.packages, staples.packages);
const banMap = banlist ? DeckList.banMapFromJson(banlist) : {};

// Build quick card cache from packages and existing caches if available
const cardCache = new Map();

// Helper to extract known links and pendulums from package definitions
Object.values(packages).forEach(pkg => {
    (pkg.cards || []).forEach(row => {
        const { name } = DeckList.readRow(row);
        const lower = name.toLowerCase();
        if (pkg.zone === 'extra' && (pkg.auto?.needs?.link || pkg.description?.toLowerCase().includes('link') || ['links', 'link-2', 'link-3', 'auto-link2', 'auto-link3', 'auto-link4'].includes(pkg.id))) {
            cardCache.set(lower, { name, type: 'Link Monster' });
        }
    });
});

const arg = process.argv[2];

if (arg && arg !== 'all' && arg !== '--all') {
    // Single archetype lookup
    const file = index[arg] || (arg.endsWith('.json') ? arg : `${arg}.json`);
    const fullPath = path.join(DECK_DIR, file);
    if (!fs.existsSync(fullPath)) {
        console.error(`Deck file not found: ${file}`);
        process.exit(1);
    }
    const deck = readJson(fullPath);
    const list = DeckList.assemble(deck, packages, banMap, profiles[file]);
    const res = DeckList.verifyGenesys(list, name => cardCache.get(name.toLowerCase()), genesys, 'tcg');

    console.log('======================================================================');
    console.log(`Genesys Verification: ${deck.title || arg} (${file})`);
    console.log('======================================================================');
    console.log(`Status:       ${res.isLegal ? '✓ GENESYS LEGAL' : '✗ NOT GENESYS LEGAL'}`);
    const overLimit = res.totalPoints - res.budget;
    console.log(`Total Points: ${res.totalPoints} / ${res.budget} pts (${res.totalPoints <= res.budget ? `${res.remainingPoints} pts remaining` : `${overLimit} pt${overLimit === 1 ? '' : 's'} over limit`})`);
    console.log(`Deck Size:    Main: ${list.main.reduce((s, e) => s + e.count, 0)} cards | Extra: ${list.extra.reduce((s, e) => s + e.count, 0)} cards`);

    if (res.violations.length > 0) {
        console.log('\nViolations:');
        res.violations.forEach(v => console.log(`  ✗ ${v.message}`));
    }

    if (res.pointedCards.length > 0) {
        console.log(`\nPointed Cards (${res.pointedCards.length} cards, ${res.totalPoints} pts):`);
        res.pointedCards.forEach(c => {
            const costStr = c.count > 1 ? `${c.pointsEach} × ${c.count} = ${c.pointsTotal} pts` : `${c.pointsTotal} pts`;
            console.log(`  · [${c.zone.toUpperCase()}] ${c.name} (${costStr})`);
        });
    } else {
        console.log('\nAll cards in this deck cost 0 points (free).');
    }
    console.log('======================================================================');
    process.exit(0);
}

// Full audit across all test decklists
const files = Object.keys(index);
console.log('======================================================================');
console.log('ArcheType Nexus — Genesys Legality & Points Verification Audit');
console.log('======================================================================\n');

let legalCount = 0;
let overBudgetCount = 0;
let linkCount = 0;
let pendulumCount = 0;
let totalPointsSum = 0;
const legalDecks = [];
const pointRankings = [];

files.forEach(arch => {
    const file = index[arch];
    const fullPath = path.join(DECK_DIR, file);
    if (!fs.existsSync(fullPath)) return;
    const deck = readJson(fullPath);
    const list = DeckList.assemble(deck, packages, banMap, profiles[file]);
    const res = DeckList.verifyGenesys(list, name => cardCache.get(name.toLowerCase()), genesys, 'tcg');

    totalPointsSum += res.totalPoints;
    pointRankings.push({ arch, file, points: res.totalPoints, isLegal: res.isLegal });

    if (res.isLegal) {
        legalCount++;
        legalDecks.push({ arch, file, points: res.totalPoints });
    } else {
        if (res.totalPoints > res.budget) overBudgetCount++;
        if (res.linkMonsters.length > 0) linkCount++;
        if (res.pendulumMonsters.length > 0) pendulumCount++;
    }
});

pointRankings.sort((a, b) => a.points - b.points);

console.log(`Total Test Decks Audited: ${files.length}`);
console.log(`✓ Genesys Legal Decks:    ${legalCount} / ${files.length} (${((legalCount / files.length) * 100).toFixed(1)}%)`);
console.log(`✗ Decks Over Budget:      ${overBudgetCount}`);
console.log(`✗ Decks With Link Cards:  ${linkCount}`);
console.log(`✗ Decks With Pendulums:   ${pendulumCount}`);
console.log(`Average Points / Deck:    ${(totalPointsSum / files.length).toFixed(1)} pts`);
console.log(`Points Range:             ${pointRankings[0].points} pts (Lowest: ${pointRankings[0].arch}) to ${pointRankings[pointRankings.length - 1].points} pts (Highest: ${pointRankings[pointRankings.length - 1].arch})`);

if (legalDecks.length > 0) {
    console.log('\n--- Genesys Legal Test Decks ---');
    legalDecks.forEach(d => {
        console.log(`  ✓ ${d.arch} (${d.file}) — ${d.points} / 100 pts`);
    });
}

console.log('\n======================================================================');
console.log('Genesys verification check complete.');
console.log('======================================================================');
