// Replays a format-version-2 combo (docs/replay-combo-format.md) in ocgcore, for both players.
//
// A v2 combo is the replay as played: typed steps for player 0 and player 1, turn/phase markers, one id per
// physical copy, the activated effect's `desc`, and (when the replay had them) both decklists in their real order.
// Nothing here parses step text. Two kinds of steps:
//  - decisions (activations, summons, Sets, phase changes): answered at the engine's prompts;
//  - consequences (costs, effect results, rule moves, draws): never answered, only checked off against the
//    engine's own messages (MOVE, CHAINING, NEW_TURN, NEW_PHASE, DRAW, ...).
// The line is legal when the engine accepts every decision and produces every recorded consequence.
//
// What a v2 export doesn't record yet (targets, chosen options, announced names) is picked from the steps that follow.
import {
    createDuelInstance,
    getCardByCode,
    getCardByName,
    getCardText,
    getEffectDescription,
    getScript,
    OcgDuelMode,
    OcgLocation,
    OcgPosition,
    OcgResponseType,
    OcgMessageType,
    SelectIdleCMDAction,
    SelectBattleCMDAction,
    ocgMessageTypeStrings
} from './card-engine.mjs';

const DUMMY_CODE = 32452818; // Beaver Warrior, a vanilla Level 4: Deck padding
const OVERLAY = 128;
const PILES = {
    'zone-deck': OcgLocation.DECK, 'zone-hand': OcgLocation.HAND, 'zone-gy': OcgLocation.GRAVE,
    'zone-banish': OcgLocation.REMOVED, 'zone-extra': OcgLocation.EXTRA
};
const PHASES = { 1: 'draw', 2: 'standby', 4: 'main1', 8: 'battle', 16: 'battle', 32: 'battle', 64: 'battle', 128: 'battle', 256: 'main2', 512: 'end' };
const DECISIONS = new Set(['activate', 'normal-summon', 'tribute-summon', 'flip-summon', 'set', 'set-monster', 'position-change', 'attack']);
const SUMMONS = new Set(['special-summon', 'fusion-summon', 'synchro-summon', 'xyz-summon', 'link-summon', 'ritual-summon', 'pendulum-summon']);
const POS = { atk: OcgPosition.FACEUP_ATTACK, def: OcgPosition.FACEUP_DEFENSE, set: OcgPosition.FACEDOWN_DEFENSE };
// Words an option's text uses for what a step type does (SELECT_OPTION has no recorded answer)
const OPTION_WORDS = {
    'normal-summon': /normal summon/, 'tribute-summon': /normal summon|tribute/, 'special-summon': /special summon/,
    'fusion-summon': /fusion summon/, 'synchro-summon': /synchro summon/, 'xyz-summon': /xyz summon/, 'link-summon': /link summon/,
    'ritual-summon': /ritual summon/, 'send-to-gy': /\bsend|\bgy\b|graveyard/, banish: /banish/, 'add-to-hand': /\badd\b|to (?:your|the) hand/,
    'return-to-hand': /return/, 'return-to-extra': /return|shuffle/, set: /\bset\b/, 'set-monster': /\bset\b/, draw: /\bdraw/,
    move: /\bplace\b/, 'attach-material': /attach/
};
const PRIMARY_OPTION_TYPES = new Set(['normal-summon', 'tribute-summon', 'special-summon', 'fusion-summon', 'synchro-summon',
    'xyz-summon', 'link-summon', 'ritual-summon', 'add-to-hand', 'draw', 'set', 'set-monster', 'move']);

// "zone-m3" -> MZONE 2, "zone-field" -> SZONE 5, "material:<id>" -> OVERLAY, piles -> their location
function zoneLoc(zone) {
    if (!zone) return null;
    if (PILES[zone]) return { location: PILES[zone], sequence: null };
    let m = /^zone-m([1-5])$/.exec(zone);
    if (m) return { location: OcgLocation.MZONE, sequence: Number(m[1]) - 1 };
    if (zone === 'zone-em-left') return { location: OcgLocation.MZONE, sequence: 5 };
    if (zone === 'zone-em-right') return { location: OcgLocation.MZONE, sequence: 6 };
    m = /^zone-s([1-5])$/.exec(zone);
    if (m) return { location: OcgLocation.SZONE, sequence: Number(m[1]) - 1 };
    if (zone === 'zone-field') return { location: OcgLocation.SZONE, sequence: 5 };
    if (zone.startsWith('material:')) return { location: OVERLAY, sequence: null };
    if (zone === 'zone-vanish') return { location: 0, sequence: null };
    return null;
}
// The engine reports the Field Zone as SZONE 5 (FZONE is a query flag); Xyz Material carries OVERLAY with its host's zone
const engineLoc = (loc) => (loc & OVERLAY) ? OVERLAY : (loc === OcgLocation.FZONE ? OcgLocation.SZONE : loc);
function sameLoc(want, loc, seq, loose = false) {
    if (!want) return true;
    if (want.location !== engineLoc(loc)) return false;
    return loose || want.sequence == null || want.location === OVERLAY || want.sequence === seq;
}
const owner = (id) => (String(id).startsWith('p2-') ? 1 : 0);

// Places still open in a SELECT_PLACE / SELECT_DISFIELD mask, from the selecting player's side (0 = them)
function openPlaces(fieldMask) {
    const mask = Number(BigInt.asUintN(32, BigInt(fieldMask)));
    const out = [];
    for (const side of [0, 1]) {
        const base = side * 16;
        for (let seq = 0; seq < 7; seq++) if ((mask & (1 << (base + seq))) === 0) out.push({ side, location: OcgLocation.MZONE, sequence: seq });
        for (let seq = 0; seq < 5; seq++) if ((mask & (1 << (base + 8 + seq))) === 0) out.push({ side, location: OcgLocation.SZONE, sequence: seq });
        if ((mask & (1 << (base + 13))) === 0) out.push({ side, location: OcgLocation.SZONE, sequence: 5 });
    }
    return out;
}

/**
 * @param {object} combo a v2 combo (formatVersion >= 2)
 * @param {{debug?: boolean}} options
 */
export async function runComboReplayV2(combo, options = {}) {
    const steps = combo.steps || [];
    // Pre-release passcodes (EDOPro's 100xxxxxx / 101xxxxxx) aren't in cards.cdb once a card is out: use the card of
    // the same name. A code still unknown after that is reported, since the engine can't load the card.
    const codeFix = new Map();
    const unknownCards = [];
    for (const c of combo.cards || []) {
        if (getCardByCode(c.code)) continue;
        const named = c.name ? getCardByName(c.name) : null;
        if (named) codeFix.set(c.code, named.code);
        else if (!c.isToken && !unknownCards.includes(c.name)) unknownCards.push(c.name || `#${c.code}`);
    }
    const fixCode = (code) => codeFix.get(code) ?? code;
    const cards = (combo.cards || []).map(c => (codeFix.has(c.code) ? { ...c, code: codeFix.get(c.code) } : c));
    // Without decklists (test-hand replays) a card that was only revealed never shows up in `cards`: Darkness Resonator
    // reveals "Red Dragon Archfiend" in the Extra Deck. Add one copy of each such named card where its text puts it.
    if (!combo.decks) {
        const zoneOf = { 'extra deck': 'zone-extra', hand: 'zone-hand', deck: 'zone-deck' };
        for (const c of [...cards]) {
            const text = getCardText(c.code) || '';
            for (const m of text.matchAll(/reveal (?:1|a|an|up to \d+) "([^"]+)"[^.]*?\b(?:in|from) your (extra deck|hand|deck)\b/gi)) {
                const named = getCardByName(m[1]);
                const zone = zoneOf[m[2].toLowerCase()];
                if (!named || !zone || cards.some(x => x.code === named.code && owner(x.id) === owner(c.id))) continue;
                cards.push({ id: `${owner(c.id) ? 'p2' : 'p1'}-revealed-${named.code}`, name: named.name, code: named.code, zone, player: owner(c.id) });
            }
        }
    }
    combo = { ...combo, decks: (combo.decks || null) && combo.decks.map(d => d && { main: d.main.map(fixCode), extra: d.extra.map(fixCode) }) };
    const byId = new Map(cards.map(c => [c.id, c]));
    const codeOf = (id) => byId.get(id)?.code;
    const nameOf = (code) => getCardByCode(code)?.name || `#${code}`;
    const log = [];
    // Choices the export doesn't record (options, yes/no, declared numbers): each is a choice point the search in
    // runComboReplayV2Search can answer differently (options.choices[k] = the answer for choice point k)
    const choicePoints = [];
    const choose = (kind, n, fallback) => {
        const k = choicePoints.length;
        const forced = options.choices?.[k];
        const pick = forced != null && forced < n ? forced : fallback;
        choicePoints.push({ kind, n, pick, step: si });
        return pick;
    };
    const guesses = [];
    const dbg = (...a) => { if (options.debug) console.log('[v2]', ...a); };

    // Every card the duel can touch needs its script cached first (the engine's script reader is synchronous)
    const codes = new Set([...cards.map(c => c.code), DUMMY_CODE]);
    for (const d of combo.decks || []) for (const c of [...(d?.main || []), ...(d?.extra || [])]) codes.add(c);
    for (const code of codes) {
        const card = getCardByCode(code);
        if (!card) continue;
        await getScript(`c${code}.lua`);
        if (card.alias) await getScript(`c${card.alias}.lua`);
    }

    // ---- Starting position -------------------------------------------------------------------------------------
    // A card's side at each step: its owner, unless a step carried `controller`
    const side = new Map(cards.map(c => [c.id, owner(c.id)]));
    // Deck order: cards are put in so the first one to leave the Deck is on top. The duel never shuffles
    // (PSEUDO_SHUFFLE), so a draw or a "top of the Deck" effect finds the card the replay says it found, even
    // where the real duel had shuffled the Deck in between.
    const leavesDeck = [];
    const seen = new Set();
    for (const st of steps) {
        for (const a of st.actions || [st]) {
            if (a.card && a.from === 'zone-deck' && !seen.has(a.card)) { seen.add(a.card); leavesDeck.push(a.card); }
        }
    }
    const firstLeave = new Map(leavesDeck.map((id, i) => [id, i]));

    const { lib, duel } = await createDuelInstance({
        ...options,
        // The replay's own duel flags when the export has them (`duel.flags`, a decimal string), always with
        // PSEUDO_SHUFFLE on top (the Deck order above only holds if the duel never shuffles). Without them:
        // test-hand replays (no decklists) allow a turn-1 Battle Phase (Mementotlan Akihiron's summon trigger checks
        // Duel.IsAbleToEnterBP() and was activated on turn 1 in those)
        flags: combo.duel?.flags != null ? BigInt(combo.duel.flags) | OcgDuelMode.PSEUDO_SHUFFLE
            : OcgDuelMode.MODE_MR5 | OcgDuelMode.TEST_MODE | OcgDuelMode.PSEUDO_SHUFFLE | (combo.decks ? 0n : OcgDuelMode.ATTACK_FIRST_TURN) |
              // a draw right after the turn-1 marker: that duel drew on the first turn
              (steps.findIndex(st => st.type === 'turn') !== -1 && steps[steps.findIndex(st => st.type === 'turn') + 1]?.type === 'draw' ? OcgDuelMode.FIRST_TURN_DRAW : 0n),
        team1: { startingLP: 8000, startingDrawCount: 0, drawCountPerTurn: 1 },
        team2: { startingLP: 8000, startingDrawCount: 0, drawCountPerTurn: 1 }
    });
    const put = (player, code, location, sequence = 0, position = OcgPosition.FACEDOWN) =>
        lib.duelNewCard(duel, { team: player, duelist: 0, code, controller: player, location, sequence, position });

    for (const p of [0, 1]) {
        const mine = cards.filter(c => owner(c.id) === p);
        // Deck: the known copies (by first departure), under them the rest of the real list (or padding)
        const deckIds = mine.filter(c => c.zone === 'zone-deck' && !c.isToken);
        const known = deckIds.filter(c => firstLeave.has(c.id)).sort((a, b) => firstLeave.get(b.id) - firstLeave.get(a.id));
        const unknown = deckIds.filter(c => !firstLeave.has(c.id));
        let rest = [];
        const list = combo.decks?.[p]?.main;
        if (Array.isArray(list)) {
            // The real list includes the opening hand and every tracked copy: take those codes out once each
            rest = [...list];
            for (const c of [...mine.filter(c => c.zone === 'zone-hand'), ...deckIds]) {
                const i = rest.lastIndexOf(c.code);
                if (i !== -1) rest.splice(i, 1);
            }
        } else {
            rest = Array(Math.max(0, 20 - deckIds.length)).fill(DUMMY_CODE);
        }
        // bottom first: each new Deck card goes on top
        for (const code of rest) put(p, code, OcgLocation.DECK);
        for (const c of unknown) put(p, c.code, OcgLocation.DECK);
        for (const c of known) put(p, c.code, OcgLocation.DECK);
        for (const c of mine.filter(c => c.zone === 'zone-hand')) put(p, c.code, OcgLocation.HAND);
        const extraIds = mine.filter(c => c.zone === 'zone-extra');
        let extraRest = [];
        if (Array.isArray(combo.decks?.[p]?.extra)) {
            extraRest = [...combo.decks[p].extra];
            for (const c of extraIds) { const i = extraRest.indexOf(c.code); if (i !== -1) extraRest.splice(i, 1); }
        }
        for (const code of extraRest) put(p, code, OcgLocation.EXTRA);
        for (const c of extraIds) put(p, c.code, OcgLocation.EXTRA);
        // Preset boards (puzzles, test hand)
        for (const c of mine.filter(c => c.preset)) {
            const z = zoneLoc(c.zone);
            if (z) put(p, c.code, z.location, z.sequence ?? 0, z.location === OcgLocation.MZONE || z.location === OcgLocation.GRAVE || z.location === OcgLocation.REMOVED ? OcgPosition.FACEUP_ATTACK : OcgPosition.FACEDOWN);
        }
    }
    lib.startDuel(duel);

    // ---- Step bookkeeping ----------------------------------------------------------------------------------------
    const done = new Array(steps.length).fill(false);
    let si = 0; // first step not checked off
    const advance = () => { while (si < steps.length && done[si]) si++; };
    const stepName = (i) => `Step ${i + 1} ("${steps[i]?.text}")`;
    // What a step expects to see move: { code, from, to } per card
    const movesOf = (st) => (st.actions || [st]).filter(a => a.card).map(a => ({
        id: a.card, code: codeOf(a.card), from: zoneLoc(a.from), to: zoneLoc(a.to)
    }));
    // A Set from the Deck or GY is an effect's result (Ether Beryl Sets Primite Fusion), not the player's Set
    const isDecision = (st) => (DECISIONS.has(st.type) && !((st.type === 'set' || st.type === 'set-monster') && st.from !== 'zone-hand')) ||
        st.type === 'turn' || st.type === 'phase';
    // Consequence steps may be checked off a little out of order (the export and the engine can list
    // simultaneous moves differently), within this many steps
    const WINDOW = 12;
    function checkOff(pred, loosePred = null) {
        for (const p of loosePred ? [pred, loosePred] : [pred]) {
            let seenDecision = 0;
            for (let i = si; i < steps.length && i < si + WINDOW; i++) {
                if (done[i]) continue;
                if (p(steps[i], i)) { done[i] = true; advance(); return i; }
                if (isDecision(steps[i]) && ++seenDecision > 1) break;
            }
        }
        return -1;
    }
    // The next step that is somebody's decision, skipping consequences still to come (a Tribute Summon's
    // tributes and a Link Summon's materials are listed before the summon itself)
    function nextDecision() {
        for (let i = si; i < steps.length; i++) {
            if (done[i]) continue;
            const st = steps[i];
            if (isDecision(st)) return i;
            // a summon from the hand or Extra Deck outside a chain is a summon procedure (a decision)
            if (SUMMONS.has(st.type) && chainDepth === 0) return i;
        }
        return -1;
    }

    // ---- Engine loop -------------------------------------------------------------------------------------------
    let chainDepth = 0;
    let lastActivated = null;
    let lastHintCode = null;
    let failure = null;
    let finished = false;
    const fail = (i, why) => { if (!failure) failure = { stepIdx: i, message: `${i >= 0 ? stepName(i) : 'The line'}: ${why}` }; };
    const respond = (r) => { dbg('respond', JSON.stringify(r, (k, v) => typeof v === 'bigint' ? v.toString() : v)); lib.duelSetResponse(duel, r); };

    // Score a selectable card against the consequence steps still open: the earliest step moving that card
    function stepFor(cand, used = new Set()) {
        // the exact zone first, then the same kind of place (a monster can sit in another zone than in the replay)
        for (const loose of [false, true]) {
            for (let i = si; i < steps.length && i < si + WINDOW * 2; i++) {
                if (done[i] || used.has(i)) continue;
                const st = steps[i];
                if (i > si && DECISIONS.has(st.type) && st.type !== 'activate') break;
                for (const mv of movesOf(st)) {
                    if (mv.code === cand.code && sameLoc(mv.from, cand.location, cand.sequence, loose) &&
                        (side.get(mv.id) ?? owner(mv.id)) === cand.controller) return i;
                }
            }
        }
        return -1;
    }
    // Pick `min..max` cards from `selects`, the ones the following steps move first
    function pickCards(selects, min, max, why) {
        const used = new Set();
        const picked = [];
        const nd = nextDecision();
        const ranked = selects.map((c, idx) => ({ idx, at: stepFor(c, used) }))
            .filter(x => x.at !== -1 && (picked.length < min || nd === -1 || nd <= si || x.at <= nd)).sort((a, b) => a.at - b.at);
        for (const r of ranked) {
            if (picked.length >= max) break;
            const at = stepFor(selects[r.idx], used);
            if (at === -1) continue;
            used.add(at);
            picked.push(r.idx);
        }
        for (let idx = 0; picked.length < min && idx < selects.length; idx++) {
            if (!picked.includes(idx)) {
                picked.push(idx);
                guesses.push(`${why}: picked ${nameOf(selects[idx].code)} without a step naming it (step ${si + 1})`);
            }
        }
        return picked;
    }

    const maxLoops = 4000 + steps.length * 50;
    for (let loop = 0; loop < maxLoops && !failure && !finished; loop++) {
        const status = lib.duelProcess(duel);
        const msgs = lib.duelGetMessage(duel);
        for (const m of msgs) {
            if (failure || finished) break;
            dbg('msg', ocgMessageTypeStrings?.get?.(m.type) || m.type);
            switch (m.type) {
                case OcgMessageType.RETRY:
                    fail(si, 'the engine refused the answer given here (RETRY)');
                    break;
                case OcgMessageType.HINT:
                    if (m.hint_type === 3 || m.hint_type === 10) lastHintCode = Number(m.hint); // HINT_SELECTMSG / HINT_CODE
                    break;
                case OcgMessageType.NEW_TURN:
                    checkOff(st => st.type === 'turn' && st.player === m.player);
                    break;
                case OcgMessageType.NEW_PHASE: {
                    const name = PHASES[m.phase];
                    if (name && name !== 'draw') checkOff(st => st.type === 'phase' && st.phase === name);
                    break;
                }
                case OcgMessageType.DRAW:
                    for (const d of m.drawn || []) {
                        checkOff(st => st.type === 'draw' && movesOf(st).some(mv => mv.code === d.code));
                    }
                    break;
                case OcgMessageType.CHAINING: {
                    chainDepth = m.chain_size;
                    const i = checkOff(st => st.type === 'activate' && codeOf(st.card) === m.code && st.player === m.controller);
                    lastActivated = m.code;
                    dbg(`chaining ${nameOf(m.code)} p${m.controller} CL${m.chain_size}${i !== -1 ? ' = step ' + (i + 1) : ' (no step)'}`);
                    if (i !== -1) log.push(`${stepName(i)}: ${m.controller ? 'opponent activates' : 'activates'} ${nameOf(m.code)} (chain link ${m.chain_size})`);
                    else log.push(`(unrecorded) ${nameOf(m.code)} activates (chain link ${m.chain_size})`);
                    break;
                }
                case OcgMessageType.CHAIN_END:
                    chainDepth = 0;
                    break;
                case OcgMessageType.MOVE: {
                    const code = m.card;
                    const from = m.from, to = m.to;
                    if (!code) break;
                    const moveStep = (loose) => (st) => st.type !== 'activate' && st.type !== 'turn' && st.type !== 'phase' && movesOf(st).some(mv =>
                        mv.code === code && sameLoc(mv.from, from.location, from.sequence, loose) && sameLoc(mv.to, to.location, to.sequence, loose));
                    const i = checkOff(moveStep(false), moveStep(true));
                    dbg(`move ${nameOf(code)} ${from.location}:${from.sequence} -> ${to.location}:${to.sequence}${i !== -1 ? ' = step ' + (i + 1) : ' (no step)'}`);
                    if (i !== -1) {
                        for (const mv of movesOf(steps[i])) {
                            const a = (steps[i].actions || [steps[i]]).find(x => x.card === mv.id);
                            side.set(mv.id, a?.controller ?? owner(mv.id));
                        }
                    }
                    break;
                }
                case OcgMessageType.POS_CHANGE:
                    checkOff(st => st.type === 'position-change' && codeOf(st.card) === m.code);
                    break;
                case OcgMessageType.ATTACK:
                    checkOff(st => st.type === 'attack');
                    break;
                case OcgMessageType.SWAP:
                    checkOff(st => st.type === 'swap-control');
                    break;

                // ---- prompts ----
                case OcgMessageType.SELECT_IDLECMD: {
                    const i = nextDecision();
                    if (i === -1) {
                        // every decision made: the line is over once its consequences are in
                        if (si >= steps.length) finished = true;
                        else fail(si, 'the engine never produced this (the line is back at an idle state without it)');
                        break;
                    }
                    const st = steps[i];
                    if (st.player !== m.player) { fail(i, `it's ${m.player ? 'the opponent' : 'your'} turn to act with nothing recorded for them`); break; }
                    const want = zoneLoc(st.from);
                    const code = codeOf(st.card);
                    const at = (list) => (list || []).findIndex(c => c.code === code && sameLoc(want, c.location, c.sequence));
                    let r = null;
                    if (st.type === 'activate') {
                        const list = m.activates || [];
                        let idx = st.desc != null ? list.findIndex(c => c.code === code && BigInt(c.description) === BigInt(st.desc) && sameLoc(want, c.location, c.sequence)) : -1;
                        if (idx === -1) idx = at(list);
                        if (idx !== -1) r = { action: SelectIdleCMDAction.SELECT_ACTIVATE, index: idx };
                    } else if (st.type === 'normal-summon' || st.type === 'tribute-summon') {
                        const idx = at(m.summons);
                        if (idx !== -1) r = { action: SelectIdleCMDAction.SELECT_SUMMON, index: idx };
                    } else if (st.type === 'set-monster') {
                        const idx = at(m.monster_sets);
                        if (idx !== -1) r = { action: SelectIdleCMDAction.SELECT_MONSTER_SET, index: idx };
                    } else if (st.type === 'set') {
                        const idx = at(m.spell_sets);
                        if (idx !== -1) r = { action: SelectIdleCMDAction.SELECT_SPELL_SET, index: idx };
                    } else if (st.type === 'position-change') {
                        const idx = at(m.pos_changes);
                        if (idx !== -1) r = { action: SelectIdleCMDAction.SELECT_POS_CHANGE, index: idx };
                    } else if (SUMMONS.has(st.type)) {
                        // a summon procedure: the monster itself (Link/Xyz/Synchro/Contact Fusion, hand procedures), or for a
                        // Pendulum Summon the Pendulum Zone card that offers it
                        let idx = at(m.special_summons);
                        if (idx === -1 && st.type === 'pendulum-summon') idx = (m.special_summons || []).findIndex(c => c.location === OcgLocation.SZONE);
                        if (idx !== -1) r = { action: SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, index: idx };
                    } else if (st.type === 'phase' && st.phase === 'battle' && m.to_bp) {
                        r = { action: SelectIdleCMDAction.TO_BP, index: null };
                    } else if ((st.type === 'phase' && st.phase === 'end') || st.type === 'turn') {
                        if (m.to_ep) r = { action: SelectIdleCMDAction.TO_EP, index: null };
                    }
                    if (!r && options.debug) {
                        const L = (xs) => (xs || []).map(c => nameOf(c.code) + '@' + c.location + ':' + c.sequence).join(', ');
                        dbg(`idle offers: summons=[${L(m.summons)}] sp=[${L(m.special_summons)}] act=[${L(m.activates)}] sets=[${L(m.spell_sets)}]`);
                        for (const [nm, loc] of [['MZONE', OcgLocation.MZONE], ['SZONE', OcgLocation.SZONE], ['HAND', OcgLocation.HAND], ['GY', OcgLocation.GRAVE]]) {
                            const q = lib.duelQueryLocation(duel, { flags: 1, controller: 0, location: loc }) || [];
                            dbg(`field ${nm}: ${q.map(c => (c && c.code) ? nameOf(c.code) : '-').join(', ')}`);
                        }
                    }
                    if (!r) { fail(i, `not offered by the engine here (${code ? nameOf(code) : st.type})`); break; }
                    log.push(`${stepName(i)}: ${st.type}`);
                    respond({ type: OcgResponseType.SELECT_IDLECMD, ...r });
                    break;
                }
                case OcgMessageType.SELECT_BATTLECMD: {
                    const i = nextDecision();
                    const st = i === -1 ? null : steps[i];
                    if (st && st.type === 'activate' && st.player === m.player) {
                        const idx = (m.chains || []).findIndex(c => c.code === codeOf(st.card));
                        if (idx !== -1) { respond({ type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.SELECT_CHAIN, index: idx }); break; }
                    }
                    if (st && st.type === 'attack' && st.player === m.player) {
                        const idx = (m.attacks || []).findIndex(c => c.code === codeOf(st.card));
                        if (idx !== -1) { respond({ type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.SELECT_BATTLE, index: idx }); break; }
                    }
                    if (st && st.type === 'phase' && st.phase === 'main2' && m.to_m2) respond({ type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.TO_M2, index: null });
                    else if (m.to_ep) respond({ type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.TO_EP, index: null });
                    else fail(i, 'no way out of the Battle Phase');
                    break;
                }
                case OcgMessageType.SELECT_CHAIN: {
                    // Chain the recorded activation if it is this player's next decision, else pass
                    const i = nextDecision();
                    const st = i === -1 ? null : steps[i];
                    let idx = -1;
                    if (st && st.type === 'activate' && st.player === m.player) {
                        const code = codeOf(st.card);
                        const want = zoneLoc(st.from);
                        const sel = m.selects || [];
                        if (st.desc != null) idx = sel.findIndex(c => c.code === code && BigInt(c.description) === BigInt(st.desc) && sameLoc(want, c.location, c.sequence));
                        if (idx === -1) idx = sel.findIndex(c => c.code === code && sameLoc(want, c.location, c.sequence));
                        if (idx === -1 && st.desc != null) idx = sel.findIndex(c => c.code === code && BigInt(c.description) === BigInt(st.desc));
                    }
                    if (idx === -1 && m.forced) idx = 0;
                    dbg(`chain prompt p${m.player} offers [${(m.selects || []).map(c => nameOf(c.code) + '@' + c.location + ':' + c.sequence + ' d' + c.description).join(', ')}] next=${st ? (i + 1) + ' ' + st.type + ' p' + st.player : 'none'} -> ${idx}`);
                    respond({ type: OcgResponseType.SELECT_CHAIN, index: idx === -1 ? null : idx });
                    break;
                }
                case OcgMessageType.SELECT_EFFECTYN: {
                    const i = nextDecision();
                    const st = i === -1 ? null : steps[i];
                    // yes for this card's recorded activation, or when this card was just activated and the steps that
                    // follow are what its effect does (Mind Shuffle: activate the card and use its effect)
                    const own = Boolean(st && st.type === 'activate' && st.player === m.player && codeOf(st.card) === m.code);
                    const results = lastActivated === m.code && steps.slice(si, i === -1 ? si + WINDOW : i).some((x, k) => !done[si + k]);
                    const yes = choose('effectyn', 2, own || results ? 0 : 1) === 0;
                    respond({ type: OcgResponseType.SELECT_EFFECTYN, yes });
                    break;
                }
                case OcgMessageType.SELECT_YESNO: {
                    // Optional follow-ups ("then you can ..."): yes when a step still to come could be its result
                    const open = steps.slice(si, si + WINDOW).some((st, k) => !done[si + k] && !isDecision(st));
                    const yes = choose('yesno', 2, open ? 0 : 1) === 0;
                    respond({ type: OcgResponseType.SELECT_YESNO, yes });
                    break;
                }
                case OcgMessageType.SELECT_OPTION: {
                    const i = nextDecision();
                    const st = i === -1 ? null : steps[i];
                    const opts = m.options || [];
                    let idx = st?.desc != null ? opts.findIndex(o => BigInt(o) === BigInt(st.desc)) : -1;
                    const fromDesc = idx !== -1;
                    if (idx === -1) {
                        // The export has no chosen option: take the one whose text fits what the next steps do
                        // (Simoon: "send this card to the GY" vs Normal Summon it, and the next step is the Normal Summon).
                        // Summons, searches and draws decide first: a GY or banish move right after is often a material
                        // or cost of that summon ("Fusion Summon ..." vs "Send the Special Summoned monster to the GY")
                        const texts = opts.map(o => getEffectDescription(o).toLowerCase());
                        dbg('options', texts.map((t, k) => `${k}:${t}`).join(' | '));
                        const open = [];
                        for (let k = si; k < steps.length && open.length < 6; k++) if (!done[k]) open.push(steps[k]);
                        // per option: the step's kind, then the card's name and where it comes from ("add 1 Lunalight
                        // monster from your GY" vs "add 1 Polymerization from your Deck" for an add-to-hand from the Deck)
                        const fit = (t, s2) => {
                            const kw = OPTION_WORDS[s2.type];
                            if (!kw || !kw.test(t)) return 0;
                            let sc = 1;
                            const name = (nameOf(codeOf(s2.card)) || '').toLowerCase();
                            if (name && t.includes(name)) sc += 3;
                            else for (const q of t.match(/"[^"]+"/g) || []) if (name.includes(q.slice(1, -1))) { sc += 2; break; }
                            const fromWords = { 'zone-deck': /\bdeck\b/, 'zone-gy': /\bgy\b|graveyard/, 'zone-banish': /banish/, 'zone-extra': /extra deck/, 'zone-hand': /\bhand\b/ };
                            if (fromWords[s2.from]?.test(t)) sc += 2;
                            return sc;
                        };
                        for (const tier of [PRIMARY_OPTION_TYPES, null]) {
                            for (const s2 of open) {
                                if (tier && !tier.has(s2.type)) continue;
                                const sc = texts.map(t => fit(t, s2));
                                const best = Math.max(...sc);
                                if (best > 0) { idx = sc.indexOf(best); break; }
                            }
                            if (idx !== -1) break;
                        }
                        if (idx === -1) idx = 0;
                    }
                    if (!fromDesc) idx = choose('option', opts.length, idx);
                    respond({ type: OcgResponseType.SELECT_OPTION, index: idx });
                    break;
                }
                case OcgMessageType.SELECT_CARD: {
                    let picked = pickCards(m.selects || [], m.min || 1, m.max || 1, 'card selection');
                    // A single pick no step before the next decision explains (a target: Bone Archfiend's Level change)
                    // is a choice point too
                    if ((m.min || 1) === 1 && (m.max || 1) === 1 && (m.selects || []).length > 1) {
                        const nd = nextDecision();
                        const at = stepFor(m.selects[picked[0]]);
                        if (at === -1 || (nd !== -1 && nd > si && at > nd)) picked = [choose('card', m.selects.length, picked[0])];
                    }
                    dbg(`select ${m.min}-${m.max} of [${(m.selects || []).map(c => nameOf(c.code) + '@' + c.location).join(', ')}] -> ${picked.map(k => nameOf(m.selects[k].code)).join(', ')}`);
                    respond({ type: OcgResponseType.SELECT_CARD, indicies: picked });
                    break;
                }
                case OcgMessageType.SELECT_TRIBUTE: {
                    const picked = pickCards(m.selects || [], m.min || 1, m.max || 1, 'tribute');
                    respond({ type: OcgResponseType.SELECT_TRIBUTE, indicies: picked });
                    break;
                }
                case OcgMessageType.SELECT_UNSELECT_CARD: {
                    // One card per prompt (Link materials come 1-1 each time): keep taking the cards the steps up to the
                    // next decision move; a card only a later action moves isn't part of this selection
                    const sel = m.select_cards || [];
                    const nd = nextDecision();
                    const ranked = sel.map((c, idx) => ({ idx, at: stepFor(c) })).filter(x => x.at !== -1 && (nd === -1 || nd <= si || x.at <= nd))
                        .sort((a, b) => a.at - b.at);
                    dbg(`unselect ${m.min}-${m.max} sel=[${sel.map(c => nameOf(c.code) + '@' + c.location + ':' + c.sequence).join(', ')}] chosen=[${(m.unselect_cards || []).map(c => nameOf(c.code)).join(', ')}] ranked=${ranked.map(r => nameOf(sel[r.idx].code) + '@' + (r.at + 1)).join(',')}`);
                    if (ranked.length > 0) respond({ type: OcgResponseType.SELECT_UNSELECT_CARD, index: ranked[0].idx });
                    else if (m.can_finish) respond({ type: OcgResponseType.SELECT_UNSELECT_CARD, index: null });
                    else { guesses.push(`material/target picked without a step naming it (step ${si + 1})`); respond({ type: OcgResponseType.SELECT_UNSELECT_CARD, index: 0 }); }
                    break;
                }
                case OcgMessageType.SELECT_SUM: {
                    const all = [...(m.selects_must || []), ...(m.selects || [])];
                    const must = (m.selects_must || []).length;
                    const ranked = (m.selects || []).map((c, idx) => ({ idx, at: stepFor(c) })).filter(x => x.at !== -1).sort((a, b) => a.at - b.at);
                    // keep adding the cards the steps move until the amount is reached
                    const chosen = [];
                    let total = (m.selects_must || []).reduce((s, c) => s + (c.amount & 0xffff), 0);
                    for (const r of ranked) { if (total >= m.amount) break; chosen.push(r.idx); total += m.selects[r.idx].amount & 0xffff; }
                    if (total < m.amount) {
                        for (let idx = 0; idx < (m.selects || []).length && total < m.amount; idx++) if (!chosen.includes(idx)) { chosen.push(idx); total += m.selects[idx].amount & 0xffff; }
                        guesses.push(`sum selection filled without steps naming the cards (step ${si + 1})`);
                    }
                    void all; void must;
                    respond({ type: OcgResponseType.SELECT_SUM, indicies: chosen });
                    break;
                }
                case OcgMessageType.SELECT_PLACE:
                case OcgMessageType.SELECT_DISFIELD: {
                    const open = openPlaces(m.field_mask);
                    // the card being placed: the next open step putting the hinted card (or any card) on the field
                    let place = null;
                    const hinted = lastHintCode && steps.slice(si, si + WINDOW).some(st => (st.actions || [st]).some(a => codeOf(a.card) === lastHintCode));
                    for (let k = si; k < steps.length && k < si + WINDOW && !place; k++) {
                        if (done[k]) continue;
                        for (const a of steps[k].actions || [steps[k]]) {
                            if (!a.card) continue;
                            if (hinted && codeOf(a.card) !== lastHintCode) continue;
                            const z = zoneLoc(a.to);
                            if (!z || (z.location !== OcgLocation.MZONE && z.location !== OcgLocation.SZONE)) continue;
                            const abs = a.controller ?? owner(a.card);
                            const rel = abs === m.player ? 0 : 1;
                            place = open.find(o => o.side === rel && o.location === z.location && o.sequence === z.sequence) || null;
                            if (place) break;
                        }
                    }
                    if (!place) { place = open[0]; guesses.push(`zone guessed at step ${si + 1}`); }
                    if (!place) { fail(si, 'no open zone to place a card'); break; }
                    const answer = { player: place.side === 0 ? m.player : 1 - m.player, location: place.location === OcgLocation.SZONE && place.sequence === 5 ? OcgLocation.FZONE : place.location, sequence: place.sequence };
                    respond({ type: m.type === OcgMessageType.SELECT_PLACE ? OcgResponseType.SELECT_PLACE : OcgResponseType.SELECT_DISFIELD, places: [answer].slice(0, m.count || 1) });
                    break;
                }
                case OcgMessageType.SELECT_POSITION: {
                    let pos = null;
                    for (let k = si; k < steps.length && k < si + WINDOW && pos == null; k++) {
                        if (!done[k] && codeOf(steps[k].card) === m.code && steps[k].position) pos = POS[steps[k].position];
                    }
                    if (pos == null || !(m.positions & pos)) pos = [1, 4, 8, 2].find(p => m.positions & p);
                    respond({ type: OcgResponseType.SELECT_POSITION, position: pos });
                    break;
                }
                case OcgMessageType.SORT_CARD:
                case OcgMessageType.SORT_CHAIN:
                    respond({ type: OcgResponseType.SORT_CARD, order: null });
                    break;
                case OcgMessageType.ANNOUNCE_CARD: {
                    // "Declare 1 card name" (Crossout Designator): the card the next steps move
                    let code = null;
                    for (let k = si; k < steps.length && k < si + WINDOW && !code; k++) if (!done[k] && steps[k].card) code = codeOf(steps[k].card);
                    respond({ type: OcgResponseType.ANNOUNCE_CARD, card: code || DUMMY_CODE });
                    guesses.push(`declared ${nameOf(code)} at step ${si + 1}`);
                    break;
                }
                case OcgMessageType.ANNOUNCE_NUMBER:
                    respond({ type: OcgResponseType.ANNOUNCE_NUMBER, value: choose('number', (m.options || [0]).length, 0) });
                    break;
                case OcgMessageType.ANNOUNCE_ATTRIB:
                    respond({ type: OcgResponseType.ANNOUNCE_ATTRIB, attributes: [1] });
                    guesses.push(`Attribute declared at step ${si + 1}`);
                    break;
                case OcgMessageType.ANNOUNCE_RACE:
                    respond({ type: OcgResponseType.ANNOUNCE_RACE, races: [1n] });
                    guesses.push(`Type declared at step ${si + 1}`);
                    break;
                case OcgMessageType.SELECT_COUNTER: {
                    const counters = (m.cards || []).map(() => 0);
                    let left = m.count;
                    (m.cards || []).forEach((c, k) => { const take = Math.min(left, c.count || 0); counters[k] = take; left -= take; });
                    respond({ type: OcgResponseType.SELECT_COUNTER, counters });
                    break;
                }
                case OcgMessageType.ROCK_PAPER_SCISSORS:
                    respond({ type: OcgResponseType.ROCK_PAPER_SCISSORS, value: 1 });
                    break;
                default:
                    break;
            }
        }
        if (status === 0) break; // duel over
    }

    advance();
    const legal = !failure && si >= steps.length;
    if (!failure && !legal) fail(si, finished ? 'never happened in the engine' : 'the replay stopped here (loop limit)');
    if (failure && unknownCards.length) failure.message += ` (cards.cdb doesn't have: ${unknownCards.join(', ')})`;
    return {
        status: legal ? 'VERIFIED_LEGAL' : 'ILLEGAL_OR_INCOMPLETE',
        legal,
        stepsCompleted: legal ? steps.length : (failure?.stepIdx ?? si),
        totalSteps: steps.length,
        error: failure?.message || null,
        errors: failure ? [failure.message] : [],
        failedStepIdx: failure?.stepIdx ?? null,
        log,
        guesses,
        // cards the engine can't load (not in cards.cdb under any code): update cards.cdb
        unknownCards,
        choicePoints,
        formatVersion: 2
    };
}

/**
 * Replays a v2 combo, and when the plain replay fails, answers the unrecorded choices (options, yes/no, declared
 * numbers) before the failure differently: one choice point at a time, latest first, keeping a change when it gets
 * further. The engine is deterministic, so each run is the same duel with only those answers changed.
 */
export async function runComboReplayV2Search(combo, options = {}) {
    const maxRuns = options.maxRuns ?? 40;
    let best = await runComboReplayV2(combo, options);
    let runs = 1;
    let choices = {};
    let improved = true;
    while (!best.legal && improved && runs < maxRuns) {
        improved = false;
        const points = best.choicePoints.map((p, k) => ({ ...p, k })).filter(p => p.step <= best.stepsCompleted).reverse();
        for (const p of points) {
            for (let alt = 0; alt < p.n && runs < maxRuns; alt++) {
                if (alt === p.pick) continue;
                const trial = { ...choices, [p.k]: alt };
                const r = await runComboReplayV2(combo, { ...options, choices: trial });
                runs++;
                if (r.legal || r.stepsCompleted > best.stepsCompleted) {
                    best = r; choices = trial; improved = true;
                    break;
                }
            }
            if (improved || runs >= maxRuns) break;
        }
    }
    return { ...best, searchRuns: runs, choices };
}
