// Checks v2 replay combo JSONs against docs/replay-combo-format.md and runs them
// through assets/js/replay-v2.js the way the site's viewers do.
//
//   node scripts/check-replay-v2.mjs [dir-or-file ...] [--strict] [--verbose]
//
// With no paths it reads yrp-private's local sync
// (../yrp-private/replays/synced_by_archetype/*/json/*.json). Only the newest
// file per replay counts: an export is "<timestamp>_<raw replay name>.json".
// --strict exits 1 when any combo breaks a rule the viewers rely on.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ReplayV2 from '../assets/js/replay-v2.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = path.resolve(__dirname, '../../yrp-private/replays/synced_by_archetype');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const verbose = args.includes('--verbose');
const inputs = args.filter(a => !a.startsWith('--'));

function listJson(p) {
    const stat = fs.statSync(p);
    if (stat.isFile()) return [p];
    const out = [];
    for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
        const full = path.join(p, entry.name);
        if (entry.isDirectory()) out.push(...listJson(full));
        else if (entry.name.endsWith('.json')) out.push(full);
    }
    return out;
}

// Newest export per replay: the timestamp prefix sorts lexically.
function newestPerReplay(files) {
    const byReplay = new Map();
    for (const f of files) {
        const base = path.basename(f);
        const m = /^(\d{4}-\d{2}-\d{2}T[\d-]+Z)_(.+)$/.exec(base);
        const key = m ? path.join(path.dirname(f), m[2]) : f;
        const prev = byReplay.get(key);
        if (!prev || path.basename(prev) < base) byReplay.set(key, f);
    }
    return [...byReplay.values()];
}

const files = newestPerReplay((inputs.length ? inputs : [DEFAULT_DIR]).flatMap(listJson));

// Rule breaks the viewers rely on ("errors") vs. data quirks worth knowing ("notes").
const errors = {};
const notes = {};
const examples = {};
const bump = (bag, rule, where) => {
    bag[rule] = (bag[rule] || 0) + 1;
    if (!examples[rule]) examples[rule] = [];
    if (examples[rule].length < 3) examples[rule].push(where);
};

const stats = { files: files.length, v1: 0, v2: 0, steps: 0, windowSteps: 0, goingSecond: 0, multiTurn: 0 };
const PILES = new Set(['zone-hand', 'zone-deck', 'zone-extra', 'zone-gy', 'zone-banish']);

for (const file of files) {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        continue;   // not JSON, or an upload-time analysis that failed to write
    }
    if (!data || !data.combos) continue;   // analysis JSONs (replaySteps, moveLog) share the folder

    for (const [key, combo] of Object.entries(data.combos)) {
        if (!ReplayV2.isV2(combo)) { stats.v1++; continue; }
        stats.v2++;
        const where = `${path.relative(process.cwd(), file)}#${key}`;
        const steps = combo.steps || [];
        const cards = combo.cards || [];
        const byId = Object.fromEntries(cards.map(c => [c.id, c]));
        stats.steps += steps.length;

        // cards: the owner in `player` agrees with the id prefix
        for (const c of cards) {
            if (c.player !== ReplayV2.owner(c.id)) bump(errors, 'card player disagrees with its id prefix', `${where} ${c.id}`);
        }

        // decks: present unless the board is preset; the opening hand is the top of the Deck
        const preset = cards.some(c => c.preset);
        if (!combo.decks && !preset) bump(notes, 'decks missing on a replay without preset cards', where);
        if (Array.isArray(combo.decks)) {
            combo.decks.forEach((deck, p) => {
                if (!deck) { bump(notes, 'decks[p] is null', `${where} p${p}`); return; }
                const hand = cards.filter(c => c.player === p && c.zone === 'zone-hand').map(c => c.code).sort();
                const top = deck.main.slice(deck.main.length - hand.length).sort();
                if (hand.join() !== top.join()) bump(errors, 'opening hand is not the top of decks[p].main', `${where} p${p}`);
            });
        }

        // The doc says the first step is a turn marker; skill cards (alias codes)
        // leave the Deck before turn 1. The viewers cope: they window from the
        // first marker and replay what came before.
        const firstTurn = steps.findIndex(s => s.type === 'turn');
        if (!steps.length) bump(notes, 'combo has no steps', where);
        else if (firstTurn === -1) bump(errors, 'no turn marker at all', where);
        else if (firstTurn > 0) bump(notes, 'steps before the first turn marker', `${where}: ${steps[0].text}`);
        const turnPlayers = steps.filter(s => s.type === 'turn');
        if (turnPlayers[0] && turnPlayers[0].player === 1) stats.goingSecond++;
        if (turnPlayers.length > 1) stats.multiTurn++;

        // steps: every `from` matches where the card is; controller only when it isn't the owner
        const board = ReplayV2.startingBoard(combo);
        steps.forEach((step, i) => {
            if (step.desc !== undefined && step.desc < 2 ** 20) bump(notes, 'desc below 2^20 (system string, not a card effect)', `${where} step ${i} desc ${step.desc}`);
            if (step.type === 'draw' && (step.actions || []).length > 1) bump(notes, 'multi-card draw text names only the first card', `${where} step ${i}`);
            for (const a of ReplayV2.stepActions(step)) {
                if (!byId[a.card]) { bump(errors, 'action names a card missing from cards', `${where} step ${i} ${a.card}`); continue; }
                const at = board.get(a.card);
                if (at && at.zone !== a.from) bump(notes, '`from` differs from where the card was', `${where} step ${i} ${a.card} at ${at.zone}, from ${a.from}`);
                if (a.controller !== undefined && a.controller === ReplayV2.owner(a.card)) bump(errors, '`controller` set to the owner', `${where} step ${i} ${a.card}`);
                if (a.controller !== undefined && PILES.has(a.to)) bump(errors, '`controller` on a move to a pile', `${where} step ${i} ${a.card}`);
                if (a.to && a.to.startsWith('material:') && !byId[a.to.slice(9)]) bump(errors, 'material host missing from cards', `${where} step ${i}`);
            }
            ReplayV2.applyToBoard(board, step);
        });

        // The viewers' own preparation must not throw or point at unknown cards.
        try {
            const prepared = ReplayV2.prepareForSimulator(combo);
            stats.windowSteps += prepared.steps.length;
            const shown = new Set(prepared.cards.map(c => c.id));
            prepared.steps.forEach((s, i) => s.actions.forEach(a => {
                if (!shown.has(a.card)) bump(errors, 'simulator step moves a card it has no token for', `${where} window step ${i} ${a.card}`);
                const host = a.to.startsWith('material:') ? a.to.slice(9) : null;
                if (host && !shown.has(host)) bump(errors, 'simulator attaches to a host it has no token for', `${where} window step ${i} ${host}`);
            }));
            const all = ReplayV2.prepareForSimulator(combo, { range: 'all' });
            if (all.steps.length !== steps.length) bump(errors, "range 'all' drops steps", where);

            const log = ReplayV2.toMoveLog(combo);
            const opening = log[0] && log[0].label === 'Opening hands' ? 1 : 0;
            if (log.length !== steps.length + opening) bump(errors, 'moveLog length differs from steps', where);
            log.forEach((entry, i) => entry.actions.forEach(a => {
                if (a.to === 'vanish' && !byId[a.id]?.isToken) bump(notes, 'non-Token card leaves the game (zone-vanish)', `${where} log ${i} ${a.id}`);
            }));
        } catch (e) {
            bump(errors, 'replay-v2.js threw', `${where}: ${e.message}`);
        }
    }
}

const print = (title, bag) => {
    const rules = Object.entries(bag).sort((a, b) => b[1] - a[1]);
    console.log(`\n${title}${rules.length ? '' : ': none'}`);
    for (const [rule, n] of rules) {
        console.log(`  ${String(n).padStart(5)}  ${rule}`);
        for (const ex of examples[rule].slice(0, verbose ? 3 : 1)) console.log(`         e.g. ${ex}`);
    }
};

console.log(`${stats.files} replay exports: ${stats.v2} v2 combos, ${stats.v1} v1 (skipped)`);
console.log(`${stats.steps} steps; player 0's first turn averages ${stats.v2 ? Math.round(stats.windowSteps / stats.v2) : 0} steps`);
console.log(`${stats.multiTurn} combos run past turn 1; ${stats.goingSecond} have player 0 going second`);
print('Errors (rules the viewers rely on)', errors);
print('Notes (data quirks)', notes);

if (strict && Object.keys(errors).length) process.exit(1);
