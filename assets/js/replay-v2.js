/* ==========================================================================
   ReplayV2 — helpers for replay combo JSONs in format version 2
   The format is described in docs/replay-combo-format.md.

   One copy of the format rules for every consumer:
     - combo-system.js (DuelSimulator, ComboGuide) loads this on demand when it
       meets a v2 combo and plays it through prepareForSimulator();
     - replay-browser.js plays a whole duel through toMoveLog();
     - Node scripts require() it (scripts/check-replay-v2.mjs).

   Nothing here touches the DOM.
   ========================================================================== */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.ReplayV2 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Not a DuelSimulator zone: the card is on the opponent's half of the board,
    // which the one-sided simulator doesn't draw.
    const OFFSIDE = 'zone-offside';

    const isV2 = combo => !!combo && Number(combo.formatVersion) >= 2;

    // Ids carry their owner: p1- is player 0, p2- is player 1.
    const owner = id => (String(id).startsWith('p2-') ? 1 : 0);

    // Whose half of the board a card is on after an action. `controller` is only
    // present when that isn't the owner.
    const sideAfter = action => (action.controller ?? owner(action.card));

    const isMarker = step => step.type === 'turn' || step.type === 'phase';

    // Every card movement on a step as a list, single-card steps included.
    function stepActions(step) {
        if (Array.isArray(step.actions) && step.actions.length) return step.actions;
        if (step.card && step.to) {
            return [{ card: step.card, from: step.from, to: step.to, position: step.position, controller: step.controller }];
        }
        return [];
    }

    // The card a step is about: the activated card, the summoned monster (it is
    // actions[0] of an xyz-summon), the attacker.
    function primaryCard(step) {
        return step.card || (step.actions && step.actions[0] && step.actions[0].card) || null;
    }

    // `desc` is aux.Stringid(code, n) = code * 2^20 + n, wider than 32 bits, so
    // arithmetic only. Values below 2^20 are EDOPro system strings (1160, 1068, …),
    // not a card's own effect.
    function decodeDesc(desc) {
        if (typeof desc !== 'number' || !isFinite(desc)) return null;
        if (desc < 2 ** 20) return { system: desc };
        return { code: Math.floor(desc / 2 ** 20), index: desc % 2 ** 20 };
    }

    function cardIndex(combo) {
        const byId = {};
        (combo.cards || []).forEach(c => { byId[c.id] = c; });
        return byId;
    }

    // Turn, phase and chain for every step, carried forward from the markers.
    // `chain` numbers each chain; `chainSize` is its longest link.
    function annotate(combo) {
        const out = [];
        const sizes = [];
        let turn = 0, phase = null, turnPlayer = null, chain = 0;

        (combo.steps || []).forEach(step => {
            if (step.type === 'turn') {
                turn = step.turn;
                turnPlayer = step.player;
                phase = 'draw';   // a turn marker implies the Draw Phase
            } else if (step.type === 'phase') {
                phase = step.phase;
            }
            let link = null;
            if (step.type === 'activate' && step.chainLink) {
                if (step.chainLink === 1) chain++;
                link = step.chainLink;
                sizes[chain] = Math.max(sizes[chain] || 0, link);
            }
            out.push({ turn, phase, turnPlayer, chain: link ? chain : null, chainLink: link });
        });

        out.forEach(m => { m.chainSize = m.chain ? sizes[m.chain] : null; });
        return out;
    }

    /* ------------------------------------------------------------------
       Board tracking — where each copy is, and on whose half
       ------------------------------------------------------------------ */

    function startingBoard(combo) {
        const board = new Map();
        (combo.cards || []).forEach(c => board.set(c.id, { zone: c.zone, side: owner(c.id), position: null }));
        return board;
    }

    function applyToBoard(board, step) {
        stepActions(step).forEach(a => {
            const prev = board.get(a.card);
            board.set(a.card, {
                zone: a.to,
                side: sideAfter(a),
                position: a.position || (prev && prev.position) || null,
            });
        });
    }

    function boardAt(combo, stepIndex) {
        const board = startingBoard(combo);
        (combo.steps || []).slice(0, stepIndex).forEach(step => applyToBoard(board, step));
        return board;
    }

    // Player 0's first turn: their first `turn` marker up to the next one. That
    // is turn 1, or turn 2 when they went second. Falls back to the whole duel.
    function firstOwnTurn(combo) {
        const steps = combo.steps || [];
        const start = steps.findIndex(s => s.type === 'turn' && s.player === 0);
        if (start === -1) return { start: 0, end: steps.length };
        const next = steps.findIndex((s, i) => i > start && s.type === 'turn');
        return { start, end: next === -1 ? steps.length : next };
    }

    function resolveRange(combo, range) {
        const total = (combo.steps || []).length;
        if (range === 'all') return { start: 0, end: total };
        if (range && typeof range === 'object') {
            const start = Math.max(0, Math.min(range.start ?? 0, total));
            return { start, end: Math.max(start, Math.min(range.end ?? total, total)) };
        }
        return firstOwnTurn(combo);
    }

    /* ------------------------------------------------------------------
       Display helpers
       ------------------------------------------------------------------ */

    // `text` is generated and fine to show, except that a multi-card draw only
    // names its first card. Negation isn't in the text at all.
    function stepLabel(step) {
        let text = step.text || step.type;
        const acts = stepActions(step);
        if (step.type === 'draw' && acts.length > 1) {
            text = `${step.player === 1 ? 'Opponent: ' : ''}Draw ${acts.length} cards`;
        }
        if (step.negated) text += ' (negated)';
        else if (step.disabled) text += ' (effect negated)';
        return text;
    }

    const SUMMON_ANIMATION = {
        'fusion-summon': 'fusion',
        'synchro-summon': 'synchro',
        'xyz-summon': 'xyz',
        'link-summon': 'link',
        'ritual-summon': 'ritual',
        'pendulum-summon': 'pendulum',
        'tribute-summon': 'tribute',
    };

    // The summon kind comes from the monster's card type, not from how it was
    // summoned: a Link Monster revived from the GY is still a link-summon step.
    // Only a summon out of the Extra Deck gets the Extra Deck animation.
    function summonAnimation(step) {
        const anim = SUMMON_ANIMATION[step.type];
        if (!anim) return null;
        const first = stepActions(step)[0];
        if (['fusion', 'synchro', 'xyz', 'link'].includes(anim) && (!first || first.from !== 'zone-extra')) return null;
        return anim;
    }

    // ComboSounds event names (see combo-sounds.js).
    const SOUNDS = {
        'draw': 'draw',
        'activate': 'effect',
        'normal-summon': 'normal-summon',
        'flip-summon': 'normal-summon',
        'tribute-summon': 'tribute',
        'special-summon': 'special-summon',
        'fusion-summon': 'fusion',
        'synchro-summon': 'synchro',
        'xyz-summon': 'xyz',
        'link-summon': 'link',
        'ritual-summon': 'ritual',
        'pendulum-summon': 'pendulum',
        'tribute': 'tribute',
        'send-to-gy': 'to-gy',
        'banish': 'to-banish',
        'cease-to-exist': 'to-banish',
        'add-to-hand': 'to-hand',
        'return-to-hand': 'to-hand',
        'attack': 'attack',
    };

    function soundFor(step) {
        if (step.type === 'activate' && (step.negated || step.disabled)) return 'negate';
        if (SUMMON_ANIMATION[step.type] && !summonAnimation(step)) return 'special-summon';
        return SOUNDS[step.type] || 'step';
    }

    /* ------------------------------------------------------------------
       DuelSimulator: one combo window, player 0's half of the board
       ------------------------------------------------------------------ */

    const FIELD_ZONE = /^zone-(?:m[1-5]|em-(?:left|right)|s[1-5]|field)$/;

    // Returns a combo the DuelSimulator plays like a hand-written one:
    //   - `steps` is the window only (player 0's first turn unless `range` says
    //     otherwise: 'all' or { start, end } in step indices);
    //   - each step's `actions` are just the moves on player 0's half, `to` set to
    //     `zone-offside` when a card crosses to the opponent's half, and there's no
    //     top-level `to`, so the generic step code never moves the wrong card;
    //   - `cards` are the copies that are on player 0's half during the window,
    //     starting where they are when the window opens.
    // Step metadata (marker/own/opponent, turn, phase, chain, animation, sound)
    // goes in `step._v2`; combo-wide facts in `combo._v2`.
    function prepareForSimulator(combo, { range } = {}) {
        if (!isV2(combo) || combo._v2) return combo;

        const steps = combo.steps || [];
        const { start, end } = resolveRange(combo, range);
        const marks = annotate(combo);
        const board = boardAt(combo, start);

        const names = {};
        (combo.cards || []).forEach(c => { names[c.id] = c.name; });

        // Which copies need a token: on player 0's half when the window opens (a
        // card still in the Deck or Extra Deck only if it moves), or on it after
        // any action in the window, or leaving it.
        const shown = new Set();
        board.forEach((b, id) => {
            if (b.side === 0 && b.zone !== 'zone-deck' && b.zone !== 'zone-extra') shown.add(id);
        });
        const live = new Map(board);
        for (let i = start; i < end; i++) {
            stepActions(steps[i]).forEach(a => {
                const before = live.get(a.card);
                if (sideAfter(a) === 0 || (before && before.side === 0)) shown.add(a.card);
            });
            applyToBoard(live, steps[i]);
        }

        // Xyz Materials already attached when the window opens are attached after
        // the tokens exist; until then each sits in its host's zone.
        const startMaterials = [];
        const cards = (combo.cards || []).filter(c => shown.has(c.id)).map(c => {
            const b = board.get(c.id);
            let zone = b.side === 0 ? b.zone : OFFSIDE;
            if (zone.startsWith('material:')) {
                const host = zone.slice('material:'.length);
                const hb = board.get(host);
                zone = hb && hb.side === 0 ? hb.zone : OFFSIDE;
                if (zone !== OFFSIDE) startMaterials.push({ card: c.id, host });
            }
            return Object.assign({}, c, { zone });
        });

        // Going second, the window opens on the opponent's board; the simulator
        // can only list it.
        const opponentField = [];
        board.forEach((b, id) => {
            if (b.side === 1 && FIELD_ZONE.test(b.zone)) {
                opponentField.push({ id, name: names[id] || id, faceDown: b.position === 'set' });
            }
        });

        const replayed = new Map(board);
        const out = steps.slice(start, end).map((step, k) => {
            const m = marks[start + k];
            const moves = [];
            stepActions(step).forEach(a => {
                const before = replayed.get(a.card) || { side: owner(a.card) };
                const side = sideAfter(a);
                if (!shown.has(a.card)) return;
                if (before.side !== 0 && side !== 0) return;   // all on the opponent's half
                moves.push({ card: a.card, to: side === 0 ? a.to : OFFSIDE });
            });
            applyToBoard(replayed, step);

            const prepared = {
                text: stepLabel(step),
                type: step.type,
                player: step.player,
                actions: moves,
                _v2: {
                    kind: isMarker(step) ? 'marker' : (step.player === 1 ? 'opponent' : 'own'),
                    turn: m.turn,
                    phase: m.phase,
                    turnPlayer: m.turnPlayer,
                    chainLink: m.chainLink,
                    chainSize: m.chainSize,
                    negated: !!step.negated,
                    disabled: !!step.disabled,
                    anim: summonAnimation(step),
                    sound: soundFor(step),
                    empty: false,
                    index: start + k,
                },
            };
            const card = primaryCard(step);
            if (card) prepared.card = card;
            if (step.position) prepared.position = step.position;
            return prepared;
        });

        // A phase nothing happens in is noise in a step list; let readers skip it.
        out.forEach((s, i) => {
            if (s.type !== 'phase') return;
            const next = out[i + 1];
            s._v2.empty = !next || next._v2.kind === 'marker';
        });

        const prepared = Object.assign({}, combo, { cards, steps: out });
        prepared._v2 = {
            names,
            start,
            end,
            totalSteps: steps.length,
            startMaterials,
            opponentField,
            hasDecks: Array.isArray(combo.decks),
        };
        return prepared;
    }

    /* ------------------------------------------------------------------
       ReplayBrowser: the whole duel as an analysis moveLog
       ------------------------------------------------------------------ */

    // DuelSimulator zone id → ReplayBrowser canonical zone name (its ZONE_MAP keys).
    const RB_ZONES = {
        'zone-hand': 'hand',
        'zone-deck': 'deck',
        'zone-extra': 'extra',
        'zone-gy': 'graveyard',
        'zone-banish': 'banished',
        'zone-field': 'field-spell',
        'zone-em-left': 'extra-monster-zone-left',
        'zone-em-right': 'extra-monster-zone-right',
    };
    for (let n = 1; n <= 5; n++) {
        RB_ZONES[`zone-m${n}`] = `monster-zone-${n}`;
        RB_ZONES[`zone-s${n}`] = `spell-zone-${n}`;
    }

    // 'vanish' isn't a browser zone, so the browser hides the card: a Token that
    // ceased to exist, or a card removed from the game.
    function rbZone(zone) {
        if (!zone) return null;
        if (zone.startsWith('material:')) return 'overlay';
        return RB_ZONES[zone] || 'vanish';
    }

    const RB_TYPES = {
        'turn': 'turn-change',
        'phase': 'phase-change',
        'activate': 'effect-activate',
    };

    const escapeHtml = s => String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // The browser's moveLog shape is documented at the top of replay-browser.js.
    // Labels are escaped here because the browser renders them as HTML. Play it
    // with `stableIds: true`: v2 ids never change, so the browser's id re-pairing
    // for older logs must stay off.
    function toMoveLog(combo) {
        const byId = cardIndex(combo);
        const marks = annotate(combo);
        const board = startingBoard(combo);

        // EDOPro-only alias codes are named "Card #<code>"; no card database knows
        // them, so give the browser no name to look up and it shows a card back.
        // `origin` is the pile the copy starts in, for the Deck counts: a card
        // whose arrival the tracker missed starts in zone-deck but first shows up
        // moving out of somewhere else. The opening hand counts as Deck, since
        // decks[p].main includes it.
        const describe = id => {
            const c = byId[id] || {};
            const name = /^Card #\d+$/.test(c.name || '') ? '' : (c.name || '');
            const origin = c.zone === 'zone-hand' ? 'deck' : rbZone(c.zone);
            return { id, code: c.code || 0, name, isToken: !!c.isToken, owner: owner(id), origin };
        };

        const log = [];

        // The browser only draws a card once it moves, and the opening hand never
        // moves until it's used. Deal it (and any preset board) as the first entry.
        // Drawing from 'deck' also takes those copies off the Deck counts, since
        // decks[p].main includes the opening hand.
        const opening = [];
        (combo.cards || []).forEach(c => {
            if (c.zone === 'zone-hand') {
                opening.push(Object.assign(describe(c.id), { player: owner(c.id), from: 'deck', to: 'hand' }));
            } else if (c.preset && RB_ZONES[c.zone]) {
                const z = rbZone(c.zone);
                opening.push(Object.assign(describe(c.id), { player: owner(c.id), from: z, to: z }));
            }
        });
        if (opening.length) {
            log.push({ type: 'draw', turn: 0, player: 0, label: 'Opening hands', actions: opening });
        }

        (combo.steps || []).forEach((step, i) => {
            const m = marks[i];
            let actions;

            if (step.type === 'attack') {
                // Not a move: the attacker (and its target) stay put. The browser
                // only animates an attack's actions.
                actions = [step.card, step.target].filter(Boolean).map(id => {
                    const b = board.get(id) || { zone: step.from, side: owner(id) };
                    const z = rbZone(b.zone);
                    return Object.assign(describe(id), { player: b.side, from: z, to: z });
                });
            } else {
                actions = stepActions(step).map(a => {
                    const before = board.get(a.card) || { zone: a.from, side: owner(a.card) };
                    const to = rbZone(a.to);
                    const action = Object.assign(describe(a.card), {
                        player: sideAfter(a),
                        fromPlayer: before.side,
                        // A Token comes out of zone-vanish; let it appear where it lands.
                        from: a.from === 'zone-vanish' ? to : rbZone(a.from),
                        to,
                    });
                    if (a.position) action.position = a.position;
                    if (a.to.startsWith('material:')) action.overlayHost = a.to.slice('material:'.length);
                    return action;
                });
                applyToBoard(board, step);
            }

            const entry = {
                type: RB_TYPES[step.type] || step.type,
                turn: m.turn,
                phase: m.phase,
                player: step.player,
                label: escapeHtml(stepLabel(step)),
                actions,
            };
            if (m.chainLink) entry.chainLink = m.chainLink;
            // The browser strikes these through; `disabled` (effect negated at
            // resolution) reads the same to a viewer.
            if (step.negated || step.disabled) entry._isNegated = true;
            log.push(entry);
        });

        return log;
    }

    return {
        OFFSIDE,
        isV2,
        owner,
        sideAfter,
        isMarker,
        stepActions,
        primaryCard,
        decodeDesc,
        annotate,
        startingBoard,
        applyToBoard,
        boardAt,
        firstOwnTurn,
        stepLabel,
        summonAnimation,
        soundFor,
        prepareForSimulator,
        toMoveLog,
    };
});
