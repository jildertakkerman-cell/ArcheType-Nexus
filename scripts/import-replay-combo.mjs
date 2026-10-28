// Turns v2 replay exports (docs/replay-combo-format.md) into curated combo JSON
// drafts, for comparing with the hand-written combos before anything is replaced.
//
//   node scripts/import-replay-combo.mjs [--src=<dir>] [--archetype=<folder>] [--turns=first|all]
//
// --src        yrp-private replay folder with <archetype>/json/*.json exports
//              (default: ../yrp-private/replays/separated_by_style/combo_guides)
// --archetype  only this replay folder (e.g. doomz)
// --turns      first (default): player 0's first turn; all: the whole replay
//
// Writes assets/data/combos/v2-drafts/<slug>-combos.json per archetype, plus
// index.json (for dev/v2-draft-preview.html) and REPORT.md. Each draft file is
// the whole page: a draft takes the key of the curated combo it matches (shared
// cards, starter card, date, player), so combo3 in a draft file is the replay
// of combo3 on the page; combos with no replay are carried over unchanged, and
// replays with no match get new keys at the end.
//
// Drafts follow the house rules for curated combos: one card per step (Xyz
// materials, multi-card draws and swaps are split; `replayStep` keeps the index
// of the replay step each came from, so split steps can be regrouped), credits
// "✨ Replay by <name> ✨", date = upload date. They stay in the v2 shape and name
// the full replay in `source`, so the page can link to the whole duel.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ReplayV2 from '../assets/js/replay-v2.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_DIR = path.join(ROOT, 'assets/data/combos');
const OUT_DIR = path.join(SITE_DIR, 'v2-drafts');
const BANLIST_FILE = path.join(ROOT, 'assets/data/banlist.json');

const opts = Object.fromEntries(process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const SRC = path.resolve(ROOT, opts.src || '../yrp-private/replays/separated_by_style/combo_guides');
const TURNS = opts.turns === 'all' ? 'all' : 'first';

// Replay folders are named by the yrp service; site combo files by page slug.
const FOLDER_SLUGS = { abc: 'a-to-z', doomz: 'doom-z', predap: 'predaplant' };
const slugFor = folder => FOLDER_SLUGS[folder] || folder.replace(/_/g, '-');

// Pairing: share of card names a replay's own steps have in common with a
// curated combo's steps. Below this it's a different line.
const MATCH_THRESHOLD = 0.6;

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));

const FIELD = /^zone-(?:m[1-5]|em-(?:left|right)|s[1-5]|field)$/;
const PILES_AT_START = new Set(['zone-deck', 'zone-extra', 'zone-vanish']);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ------------------------------------------------------------------
   Source files
   ------------------------------------------------------------------ */

// An export is "<export timestamp>_<raw replay name>.json" and the raw name
// starts with its upload timestamp. Only the newest export of a replay counts.
const TS = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/;

function newestExports(dir) {
    const byReplay = new Map();
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
        const m = new RegExp(`^(${TS.source})_(.+)\\.json$`).exec(file);
        if (!m) continue;
        const prev = byReplay.get(m[2]);
        if (!prev || prev.file < file) byReplay.set(m[2], { file, rawName: m[2] });
    }
    return [...byReplay.values()];
}

function uploadDate(rawName) {
    const m = /(\d{4})-(\d{2})-(\d{2})T/.exec(rawName);
    if (!m) return '';
    return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/* ------------------------------------------------------------------
   Replay → curated draft
   ------------------------------------------------------------------ */

// Verb per step type for a step split out of a multi-card one. The generator's
// own text only names the first card.
const SPLIT_VERBS = {
    'draw': 'Draw',
    'special-summon': 'Special Summon',
    'pendulum-summon': 'Pendulum Summon',
    'send-to-gy': 'Send to GY',
    'banish': 'Banish',
    'add-to-hand': 'Add to Hand',
    'return-to-hand': 'Return to Hand',
    'tribute': 'Tribute',
    'cease-to-exist': 'Vanish',
    'swap-control': 'Switch control of',
    'set': 'Set',
    'set-monster': 'Set',
    'move': 'Move',
    'position-change': 'Change the battle position of',
};

function singleCard(action) {
    const out = { card: action.card, from: action.from, to: action.to };
    if (action.position) out.position = action.position;
    if (action.controller !== undefined) out.controller = action.controller;
    return out;
}

function curate(combo, turns) {
    const steps = combo.steps || [];
    const { start, end } = turns === 'all' ? { start: 0, end: steps.length } : ReplayV2.firstOwnTurn(combo);
    const names = Object.fromEntries((combo.cards || []).map(c => [c.id, c.name]));
    const nameOf = id => names[id] || id;

    // Cards: everything the window touches, plus whatever isn't in a Deck when
    // it opens (both opening hands; a board when the window starts later).
    const board = ReplayV2.boardAt(combo, start);
    const keep = new Set();
    for (let i = start; i < end; i++) {
        const s = steps[i];
        ReplayV2.stepActions(s).forEach(a => {
            keep.add(a.card);
            if (a.to.startsWith('material:')) keep.add(a.to.slice(9));
        });
        if (s.card) keep.add(s.card);
        if (s.target) keep.add(s.target);
    }
    board.forEach((b, id) => { if (!PILES_AT_START.has(b.zone)) keep.add(id); });

    const cards = (combo.cards || []).filter(c => keep.has(c.id)).map(c => {
        const b = board.get(c.id);
        const card = Object.assign({}, c, { zone: b.zone });
        delete card.preset;
        // A window that opens mid-duel opens on a board: the verifier keeps a
        // `preset` card where it is instead of shuffling it into the Deck.
        if (c.preset || (start > 0 && b.zone !== 'zone-hand' && !PILES_AT_START.has(b.zone))) card.preset = true;
        return card;
    });

    // Steps: one card each.
    const out = [];
    let split = 0;
    const live = new Map(board);
    for (let i = start; i < end; i++) {
        const step = steps[i];
        const acts = Array.isArray(step.actions) ? step.actions : null;
        const { actions, ...rest } = step;

        if (!acts || acts.length === 0) {
            out.push(Object.assign({}, step, { replayStep: i }));
        } else if (acts.length === 1) {
            out.push(Object.assign({}, rest, singleCard(acts[0]), { replayStep: i }));
        } else if (step.type === 'xyz-summon') {
            // The Xyz Monster lands in its zone, then each material attaches to it.
            const [host, ...materials] = acts;
            out.push(Object.assign({}, rest, singleCard(host), { replayStep: i }));
            materials.forEach(m => {
                const side = (live.get(m.card) || { side: ReplayV2.owner(m.card) }).side;
                out.push(Object.assign({
                    text: `${side === 1 ? 'Opponent: ' : ''}${nameOf(m.card)} becomes material for ${nameOf(host.card)}`,
                    type: 'attach-material',
                    player: side,
                }, singleCard(m), { replayStep: i }));
            });
            split++;
        } else {
            acts.forEach(a => {
                let verb = SPLIT_VERBS[step.type];
                if (step.type === 'return-to-extra') verb = a.to === 'zone-deck' ? 'Return to Deck' : 'Return to Extra Deck';
                const text = verb
                    ? `${step.player === 1 ? 'Opponent: ' : ''}${verb} ${nameOf(a.card)}`
                    : step.text.replace(nameOf(acts[0].card), nameOf(a.card));
                out.push(Object.assign({}, rest, { text }, singleCard(a), { replayStep: i }));
            });
            split++;
        }
        ReplayV2.applyToBoard(live, step);
    }

    return { start, end, cards, steps: out, split };
}

/* ------------------------------------------------------------------
   Comparing with the hand-written combos
   ------------------------------------------------------------------ */

function primaryName(combo, step) {
    const id = step.card || (step.actions && step.actions[0] && step.actions[0].card);
    const card = (combo.cards || []).find(c => c.id === id);
    return card ? card.name : null;
}

function ownStepNames(combo) {
    return (combo.steps || [])
        .filter(s => !ReplayV2.isV2(combo) || (s.type !== 'turn' && s.type !== 'phase' && s.player !== 1))
        .map(s => primaryName(combo, s))
        .filter(Boolean);
}

// The first card a line plays. Lines of one deck share most of their cards,
// but rarely their starter. Hand-written combos often open by drawing the
// hand, so leading draws don't count.
function starterName(combo) {
    for (const s of combo.steps || []) {
        if (s.type === 'turn' || s.type === 'phase' || s.player === 1) continue;
        if (s.type === 'draw' || (!s.type && s.to === 'zone-hand' && /^draw\b/i.test(s.text || ''))) continue;
        return primaryName(combo, s);
    }
    return null;
}

function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    let both = 0;
    A.forEach(x => { if (B.has(x)) both++; });
    return both / ((A.size + B.size - both) || 1);
}

// Player 0's field at the end, by name. Hand-written combos are replayed the
// way the simulator does: every `to` in order.
function endField(combo) {
    const zones = new Map((combo.cards || []).map(c => [c.id, { zone: c.zone, side: ReplayV2.owner(c.id) }]));
    (combo.steps || []).forEach(s => {
        const acts = s.actions && s.actions.length ? s.actions : (s.card && s.to ? [s] : []);
        acts.forEach(a => zones.set(a.card, { zone: a.to, side: a.controller ?? ReplayV2.owner(a.card) }));
    });
    const out = [];
    zones.forEach((z, id) => {
        const card = (combo.cards || []).find(c => c.id === id);
        if (!card || /^any /i.test(card.name)) return;
        if (z.side === 0 && FIELD.test(z.zone)) out.push(card.name);
    });
    return out.sort();
}

function diffNames(a, b) {
    const rest = [...b];
    const onlyA = [];
    a.forEach(n => {
        const i = rest.indexOf(n);
        if (i === -1) onlyA.push(n); else rest.splice(i, 1);
    });
    return { onlyA, onlyB: rest };
}

/* ------------------------------------------------------------------
   Banlist
   ------------------------------------------------------------------ */

const banlist = (() => {
    const tcg = readJson(BANLIST_FILE).tcg || {};
    const norm = n => String(n).replace(/^"|"$/g, '').toLowerCase();
    const limit = new Map();
    (tcg.forbidden || []).forEach(n => limit.set(norm(n), 0));
    (tcg.limited || []).forEach(n => limit.set(norm(n), 1));
    (tcg.semiLimited || []).forEach(n => limit.set(norm(n), 2));
    return { limit, norm, date: tcg.effectiveDate };
})();

// Hand-written combos have no `player`; their opponent stand-ins are "Any …".
function banlistIssues(combo) {
    const copies = new Map();
    (combo.cards || [])
        .filter(c => (c.player ?? ReplayV2.owner(c.id)) === 0 && !c.isToken && !/^any /i.test(c.name))
        .forEach(c => copies.set(c.name, (copies.get(c.name) || 0) + 1));
    const issues = [];
    copies.forEach((n, name) => {
        const max = banlist.limit.get(banlist.norm(name));
        if (max === 0) issues.push(`${name} is Forbidden`);
        else if (max !== undefined && n > max) issues.push(`${n} copies of ${name} (limit ${max})`);
    });
    return issues;
}

/* ------------------------------------------------------------------
   Run
   ------------------------------------------------------------------ */

const folders = fs.readdirSync(SRC, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(SRC, d.name, 'json')))
    .map(d => d.name)
    .filter(f => !opts.archetype || f === opts.archetype)
    .sort();

fs.mkdirSync(OUT_DIR, { recursive: true });
const index = [];
const report = [];
const totals = { replays: 0, paired: 0, newLines: 0, skippedV1: 0, problems: 0, banlist: 0 };

// Several replay folders can feed one site file (predap + predaplant).
const bySlug = new Map();
for (const folder of folders) {
    const slug = slugFor(folder);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(folder);
}

for (const [slug, slugFolders] of bySlug) {
    const siteFile = path.join(SITE_DIR, `${slug}-combos.json`);
    const current = fs.existsSync(siteFile) ? readJson(siteFile) : null;
    const curCombos = current ? current.combos : {};

    // Every v2 replay for this slug.
    const replays = [];
    for (const folder of slugFolders) {
        for (const { file, rawName } of newestExports(path.join(SRC, folder, 'json'))) {
            let data;
            try { data = readJson(path.join(SRC, folder, 'json', file)); } catch { continue; }
            if (!data || !data.combos) continue;   // upload-time analysis JSON
            const [key, combo] = Object.entries(data.combos)[0] || [];
            if (!ReplayV2.isV2(combo)) { totals.skippedV1++; continue; }
            if (!(combo.steps || []).length) continue;
            const curated = curate(combo, TURNS);
            replays.push({ folder, file, rawName, key, data, combo, curated });
        }
    }
    if (!replays.length) continue;
    totals.replays += replays.length;

    // Pair replays with curated combos: best score first, one to one. The score
    // is the share of cards in common, plus the same starter card (a strong
    // sign: A-to-Z combo1 and combo5 share 79% and 89% of their cards with one
    // replay, but only combo1 starts with its Union Hangar), the same date and
    // the same player name.
    const pairs = [];
    replays.forEach((r, ri) => {
        const draftLike = { cards: r.curated.cards, steps: r.curated.steps, formatVersion: 2 };
        const names = ownStepNames(draftLike);
        const starter = starterName(draftLike);
        Object.entries(curCombos).forEach(([key, c]) => {
            const overlap = jaccard(names, ownStepNames(c));
            let score = overlap;
            if (starter && starter === starterName(c)) score += 0.15;
            if (c.date && c.date === uploadDate(r.rawName)) score += 0.05;
            const player = r.data.playerName || '';
            if (player && !/^player\d*$/i.test(player) && String(c.credits || '').includes(player)) score += 0.05;
            pairs.push({ ri, key, overlap, score });
        });
    });
    pairs.sort((a, b) => b.score - a.score);
    const takenKey = new Set();
    const pairOf = new Map();
    for (const p of pairs) {
        if (p.overlap < MATCH_THRESHOLD || pairOf.has(p.ri) || takenKey.has(p.key)) continue;
        pairOf.set(p.ri, p);
        takenKey.add(p.key);
    }

    // Draft every replay.
    const usedNumbers = Object.keys(curCombos).map(k => Number(k.replace('combo', ''))).filter(n => !isNaN(n));
    let nextNumber = Math.max(0, ...usedNumbers) + 1;
    const drafted = {};
    const section = [`## ${slug}`, ''];
    section.push(current
        ? `Current file: \`assets/data/combos/${slug}-combos.json\` (${Object.keys(curCombos).length} combos)`
        : `No combo file on the site yet: every draft here is a new line.`);
    section.push('');

    replays.forEach((r, ri) => {
        const p = pairOf.get(ri);
        const key = p ? p.key : `combo${nextNumber++}`;
        const cur = p ? curCombos[p.key] : null;
        const player = r.data.playerName || 'Player';
        const total = r.combo.steps.length;
        const turnsInReplay = r.combo.steps.filter(s => s.type === 'turn').length;

        const draft = {
            title: cur ? cur.title : `Untitled replay line (${r.rawName.replace(TS, '').replace(/^_+/, '') || r.rawName})`,
            description: cur ? (cur.description || '') : '',
            date: cur && cur.date ? cur.date : uploadDate(r.rawName),
            credits: cur && cur.credits ? cur.credits : `✨ Replay by ${player} ✨`,
            formatVersion: 2,
            source: `replays_json/${r.file}`,
            sourceKey: r.key,
            cards: r.curated.cards,
        };
        if (r.combo.decks) draft.decks = r.combo.decks;
        draft.steps = r.curated.steps;
        if (!cur) draft.todo = ['title', 'description'];

        // Checks the viewers rely on.
        const problems = [];
        const ids = new Set(draft.cards.map(c => c.id));
        draft.steps.forEach((s, i) => {
            if (s.actions) problems.push(`step ${i} still moves several cards`);
            if (s.card && !ids.has(s.card)) problems.push(`step ${i} names ${s.card}, which isn't in cards`);
        });
        try {
            const prepared = ReplayV2.prepareForSimulator(draft);
            const want = ReplayV2.boardAt(r.combo, r.curated.end);
            const got = ReplayV2.boardAt(draft, draft.steps.length);
            draft.cards.forEach(c => {
                const a = got.get(c.id), b = want.get(c.id);
                if (a.zone !== b.zone || a.side !== b.side) problems.push(`${c.name} ends in ${a.zone}, the replay has ${b.zone}`);
            });
            if (!prepared.steps.length) problems.push('nothing to play');
        } catch (e) {
            problems.push(`replay-v2.js threw: ${e.message}`);
        }
        totals.problems += problems.length;

        drafted[key] = draft;
        if (cur) totals.paired++; else totals.newLines++;

        // Report entry.
        const ownSteps = draft.steps.filter(s => s.type !== 'turn' && s.type !== 'phase' && s.player !== 1).length;
        const oppSteps = draft.steps.filter(s => s.type !== 'turn' && s.type !== 'phase' && s.player === 1).length;
        const lines = [];
        lines.push(`### ${key}: ${draft.title}`);
        lines.push('');
        lines.push(`- Replay: \`${r.folder}/json/${r.file}\` (player "${player}", uploaded ${uploadDate(r.rawName) || '?'})`);
        if (cur) {
            const runnerUp = pairs.filter(x => x.ri === ri && x.key !== p.key).sort((a, b) => b.score - a.score)[0];
            const close = runnerUp && runnerUp.overlap >= MATCH_THRESHOLD && runnerUp.score >= p.score - 0.1;
            lines.push(`- Matches the current ${key}, "${cur.title}": ${Math.round(p.overlap * 100)}% shared cards`
                + (close ? `. **Check the pairing:** ${runnerUp.key} shares ${Math.round(runnerUp.overlap * 100)}%` : ''));
            lines.push(`- Steps: current ${cur.steps.length}; draft ${ownSteps} of yours`
                + (oppSteps ? ` + ${oppSteps} opponent` : '') + `, ${draft.steps.length - ownSteps - oppSteps} turn/phase markers`);
            const fieldNow = endField(cur);
            const fieldDraft = endField(draft);
            const d = diffNames(fieldDraft, fieldNow);
            if (!d.onlyA.length && !d.onlyB.length) lines.push(`- End board: the same (${fieldDraft.length} cards)`);
            else {
                lines.push(`- End board differs:`);
                if (d.onlyA.length) lines.push(`  - only in the draft: ${d.onlyA.join(', ')}`);
                if (d.onlyB.length) lines.push(`  - only in the current combo: ${d.onlyB.join(', ')}`);
            }
            const credit = `✨ Replay by ${player} ✨`;
            if (cur.credits !== credit) lines.push(`- Credits kept from the current combo ("${cur.credits || ''}"); the replay's own player name gives "${credit}"`);
        } else {
            const best = pairs.filter(x => x.ri === ri).sort((a, b) => b.overlap - a.overlap)[0];
            if (best && best.overlap >= MATCH_THRESHOLD) {
                // Its match went to another replay that fits that combo better.
                lines.push(`- **Probably a second upload** of the line in ${best.key} (${Math.round(best.overlap * 100)}% shared cards), `
                    + 'which another replay here is already paired with. Compare the two before keeping this one.');
            } else {
                lines.push(`- **New line**: no current combo shares ${Math.round(MATCH_THRESHOLD * 100)}% of its cards`
                    + (best ? ` (closest: ${best.key}, ${Math.round(best.overlap * 100)}%)` : '') + '. Needs a title and description.');
            }
            lines.push(`- Steps: ${ownSteps} of yours` + (oppSteps ? ` + ${oppSteps} opponent` : ''));
            lines.push(`- End board: ${endField(draft).join(', ') || '(empty)'}`);
        }
        if (turnsInReplay > 1 && TURNS === 'first') lines.push(`- The replay goes on for ${turnsInReplay} turns (${total} steps); the draft keeps player 0's first turn, and the page links the rest as the full duel`);
        if (r.curated.split) lines.push(`- ${r.curated.split} grouped replay steps split into single-card steps`);
        if (!r.combo.decks) lines.push(`- No decklists in the replay (test hand or preset board)`);
        const aliases = [...new Set(draft.cards.filter(c => /^Card #\d+$/.test(c.name)).map(c => c.name))];
        if (aliases.length) lines.push(`- EDOPro-only cards (no art or text on the site): ${aliases.join(', ')}`);
        // Many current combos were rebuilt to be legal, so say which banlist
        // problems the draft would bring back.
        const bans = banlistIssues(draft);
        if (bans.length) {
            const curBans = new Set(cur ? banlistIssues(cur) : []);
            const back = bans.filter(b => !curBans.has(b));
            const also = bans.filter(b => curBans.has(b));
            if (back.length) {
                lines.push(`- **TCG banlist (${banlist.date}):** ${back.join('; ')}`
                    + (cur ? ' (not in the current combo)' : ''));
                totals.banlist++;
            }
            if (also.length) lines.push(`- TCG banlist, already in the current combo too: ${also.join('; ')}`);
        }
        problems.forEach(pr => lines.push(`- **Problem:** ${pr}`));
        lines.push('');
        section.push(...lines);
    });

    const unmatched = Object.keys(curCombos).filter(k => !takenKey.has(k));
    if (unmatched.length) {
        section.push(`Carried over unchanged (no v2 replay for them here yet): `
            + unmatched.map(k => `${k} "${curCombos[k].title}"`).join(', '));
        section.push('');
    }

    // The draft file is the whole page: combos with a replay swapped for their
    // draft, every other combo carried over as it is, new lines last.
    const combos = {};
    const status = {};
    Object.keys(curCombos).forEach(k => {
        combos[k] = drafted[k] || curCombos[k];
        status[k] = drafted[k] ? 'v2' : 'unchanged';
    });
    Object.keys(drafted).forEach(k => {
        if (!combos[k]) { combos[k] = drafted[k]; status[k] = 'new'; }
    });

    const out = { archetype: current ? current.archetype : slug, combos };
    fs.writeFileSync(path.join(OUT_DIR, `${slug}-combos.json`), JSON.stringify(out, null, 2) + '\n');
    index.push({
        slug,
        hasCurrent: !!current,
        combos: Object.entries(combos).map(([key, c]) => ({ key, title: c.title, status: status[key] })),
    });
    report.push(...section);
}

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ generated: new Date().toISOString(), turns: TURNS, archetypes: index }, null, 2) + '\n');

const head = [
    '# v2 replay drafts',
    '',
    `Generated by \`node scripts/import-replay-combo.mjs\` on ${new Date().toISOString().slice(0, 10)} from \`${path.relative(ROOT, SRC).replace(/\\/g, '/')}\`.`,
    'Nothing on the site uses these files. Each one is the whole page as it would be: combos that have a',
    'v2 replay are swapped for their draft, every other combo is carried over unchanged, and new lines come',
    'last. Compare them with the live page in `dev/v2-draft-preview.html`, then copy over the combos you want',
    '(keep the key).',
    '',
    `${totals.replays} replays: ${totals.paired} match a current combo, ${totals.newLines} are new lines. `
        + `${totals.skippedV1} replays only have a v1 export yet and were skipped. `
        + (totals.problems ? `**${totals.problems} problems** (see below).` : 'No problems found.'),
    '',
    `**${totals.banlist} drafts use cards the current TCG list (${banlist.date}) forbids or limits, where the`
        + ' current combo does not.** Those current combos were most likely rebuilt to be legal on purpose; keep them.',
    '',
    'Drafts are the replay as played: plain generated step text, the opponent\'s moves included, and the',
    'title, description and credits copied from the current combo they match. The hand-written step text',
    'and any corrections in the current combos are not carried over.',
    '',
];
fs.writeFileSync(path.join(OUT_DIR, 'REPORT.md'), head.concat(report).join('\n') + '\n');

console.log(`${index.length} draft files, ${totals.replays} replays (${totals.paired} paired, ${totals.newLines} new), ${totals.skippedV1} v1-only skipped, ${totals.problems} problems`);
console.log(`Wrote ${path.relative(ROOT, OUT_DIR)}/ (REPORT.md, index.json)`);
