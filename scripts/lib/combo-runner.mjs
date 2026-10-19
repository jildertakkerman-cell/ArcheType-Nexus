import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
    createDuelInstance,
    getCardByCode,
    getCardByName,
    getCardText,
    getEffectDescription,
    getScript,
    resolveCardAsync,
    OcgDuelMode,
    OcgLocation,
    OcgPosition,
    OcgProcessResult,
    OcgResponseType,
    OcgMessageType,
    SelectIdleCMDAction,
    cardMatchesOpcode,
    ocgMessageTypeStrings
} from './card-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CDB_PATH = path.resolve(__dirname, '../../assets/data/cards.cdb');

const db = new DatabaseSync(CDB_PATH);
const SELECT_CARD_SQL = 'SELECT datas.id, datas.ot, datas.alias, CAST(datas.setcode AS TEXT) AS setcode, datas.type, datas.atk, datas.def, datas.level, CAST(datas.race AS TEXT) AS race, datas.attribute, CAST(datas.category AS TEXT) AS category, texts.name FROM datas JOIN texts ON datas.id = texts.id';
const stmtByCode = db.prepare(`${SELECT_CARD_SQL} WHERE datas.id = ?`);
const stmtByName = db.prepare(`${SELECT_CARD_SQL} WHERE LOWER(texts.name) = LOWER(?) LIMIT 1`);

// Generic legal discard/token dummy card (Normal Monster with no effects)
const DUMMY_DISCARD_CODE = 32452818; // "Beaver Warrior", a vanilla Level 4 Normal Monster (12607053 is the Trap Waboku)

export function cleanCardName(name) {
    if (!name) return '';
    return String(name)
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&#x27;|&apos;/gi, "'")
        .replace(/&amp;/gi, '&')
        .replace(/&mdash;|&ndash;/gi, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .trim();
}

/**
 * Resolves all cards in a combo to cards.cdb entries.
 */
export async function resolveComboCards(combo) {
    const resolved = [];
    const idMap = new Map();
    const nameMap = new Map();
    const missing = [];

    for (const rawCard of (combo.cards || [])) {
        const rawName = (rawCard.name || '').trim();
        const cleanedName = cleanCardName(rawName);
        let cardData = null;

        // 0. Check explicit numeric code on card object if present
        if (rawCard.code && typeof rawCard.code === 'number') {
            const row = stmtByCode.get(rawCard.code);
            if (row) cardData = getCardByCode(row.id);
        }

        // 1. Check numeric code in ID if present (e.g. "card_89997728_1" or "89997728")
        if (!cardData) {
            const idCodeMatch = String(rawCard.id || '').match(/\b(\d{5,8})\b/);
            if (idCodeMatch) {
                const row = stmtByCode.get(Number(idCodeMatch[1]));
                if (row) cardData = getCardByCode(row.id);
            }
        }

        // 2. Check numeric code in name (e.g. "Unknown Card 55273561")
        if (!cardData) {
            const nameCodeMatch = rawName.match(/\b(\d{7,8})\b/);
            if (nameCodeMatch) {
                const row = stmtByCode.get(Number(nameCodeMatch[1]));
                if (row) cardData = getCardByCode(row.id);
            }
        }

        // 3. Check exact / cleaned name in cdb
        if (!cardData) {
            const row = stmtByName.get(cleanedName) || stmtByName.get(rawName);
            if (row) cardData = getCardByCode(row.id);
        }

        // 4. Handle generic discard/token placeholders
        if (!cardData && /^(any card|any card you draw|discard|random discard)$/i.test(cleanedName)) {
            cardData = getCardByCode(DUMMY_DISCARD_CODE);
        }

        // 5. Query Supabase database for modern / recently released cards
        if (!cardData) {
            cardData = await resolveCardAsync(cleanedName) || await resolveCardAsync(rawName);
        }

        if (cardData) {
            rawCard.code = cardData.code;
            rawCard.data = cardData;
            const entry = {
                ...rawCard,
                code: cardData.code,
                officialName: cardData.name,
                data: cardData
            };
            resolved.push(entry);
            idMap.set(rawCard.id, entry);
            if (!nameMap.has(cleanedName.toLowerCase())) {
                nameMap.set(cleanedName.toLowerCase(), entry);
            }
            if (cardData.name && !nameMap.has(cardData.name.toLowerCase())) {
                nameMap.set(cardData.name.toLowerCase(), entry);
            }
        } else {
            missing.push({ id: rawCard.id, name: rawName });
        }
    }

    return { resolved, idMap, nameMap, missing };
}

/**
 * Pre-caches Lua scripts for all resolved cards in a combo.
 * Returns the codes of non-vanilla cards with no script: the engine gives those cards no effects at all.
 */
export async function preloadComboScripts(resolvedCards) {
    const unscripted = new Set();
    for (const card of resolvedCards) {
        if (card.code) {
            let script = await getScript(`c${card.code}.lua`);
            if (card.data?.alias && card.data.alias !== card.code) {
                script = (await getScript(`c${card.data.alias}.lua`)) || script;
            }
            const t = card.data?.type || 0;
            const isVanilla = (t & 0x1) && (t & 0x10) && !(t & 0x1000000);
            if (!script && !isVanilla) unscripted.add(card.code);
        }
    }
    return unscripted;
}

/**
 * Maps a combo zone string to OcgLocation and sequence.
 */
export function parseZone(zoneStr) {
    if (!zoneStr) return null;
    const z = zoneStr.toLowerCase().trim();
    if (z === 'zone-hand') return { location: OcgLocation.HAND, sequence: 0 };
    if (z === 'zone-deck') return { location: OcgLocation.DECK, sequence: 0 };
    if (z === 'zone-extra') return { location: OcgLocation.EXTRA, sequence: 0 };
    if (z === 'zone-gy' || z === 'zone-grave' || z === 'zone-graveyard') return { location: OcgLocation.GRAVE, sequence: 0 };
    if (z === 'zone-banished' || z === 'zone-removed') return { location: OcgLocation.REMOVED, sequence: 0 };
    if (z === 'zone-field') return { location: OcgLocation.FZONE, sequence: 5 };
    if (z === 'zone-em-left') return { location: OcgLocation.MZONE, sequence: 5 };
    if (z === 'zone-em-right') return { location: OcgLocation.MZONE, sequence: 6 };
    const mMatch = z.match(/^zone-m([1-5])$/);
    if (mMatch) return { location: OcgLocation.MZONE, sequence: Number(mMatch[1]) - 1 };
    const sMatch = z.match(/^zone-s([1-5])$/);
    if (sMatch) return { location: OcgLocation.SZONE, sequence: Number(sMatch[1]) - 1 };
    return null;
}

/**
 * Maps an OcgLocPos ({ location, sequence }) to a combo visualizer zone string.
 */
export function ocgLocPosToZone(locPos) {
    if (!locPos) return 'zone-deck';
    const loc = locPos.location;
    const seq = locPos.sequence;
    if (loc === OcgLocation.MZONE || loc === 4) {
        if (seq === 5) return 'zone-em-left';
        if (seq === 6) return 'zone-em-right';
        if (seq >= 0 && seq <= 4) return `zone-m${seq + 1}`;
        return 'zone-m1';
    }
    if (loc === OcgLocation.SZONE || loc === 8) {
        if (seq === 5) return 'zone-field';
        if (seq === 6) return 'zone-s1'; // Pendulum left scale
        if (seq === 7) return 'zone-s5'; // Pendulum right scale
        if (seq >= 0 && seq <= 4) return `zone-s${seq + 1}`;
        return 'zone-s1';
    }
    if (loc === OcgLocation.FZONE || loc === 256) return 'zone-field';
    if (loc === OcgLocation.PZONE || loc === 512) {
        return (seq === 0) ? 'zone-s1' : 'zone-s5';
    }
    if (loc === OcgLocation.HAND || loc === 2) return 'zone-hand';
    if (loc === OcgLocation.GRAVE || loc === 16) return 'zone-gy';
    if (loc === OcgLocation.REMOVED || loc === 32) return 'zone-banish';
    if (loc === OcgLocation.EXTRA || loc === 64) return 'zone-extra';
    if (loc === OcgLocation.DECK || loc === 1) return 'zone-deck';
    return 'zone-deck';
}

export function zoneToOcgLocation(zone) {
    if (!zone) return null;
    if (zone.startsWith('zone-m') || zone.startsWith('zone-em')) return OcgLocation.MZONE;
    if (zone.startsWith('zone-s')) return OcgLocation.SZONE;
    if (zone === 'zone-field') return OcgLocation.FZONE;
    if (zone === 'zone-hand') return OcgLocation.HAND;
    if (zone === 'zone-gy') return OcgLocation.GRAVE;
    if (zone === 'zone-banish') return OcgLocation.REMOVED;
    if (zone === 'zone-extra') return OcgLocation.EXTRA;
    if (zone === 'zone-deck') return OcgLocation.DECK;
    return null;
}

/**
 * Captures the exact field state of cards across all locations from OCGCore.
 */
export function captureFieldSnapshot(duel, lib) {
    const snapshot = {
        monsters: [],
        spells: [],
        hand: [],
        gy: [],
        banish: [],
        extra: []
    };
    try {
        const mzone = lib.duelQueryLocation(duel, { flags: 1, controller: 0, location: OcgLocation.MZONE }) || [];
        mzone.forEach((c, seq) => {
            if (c && c.code) {
                let zone = `zone-m${seq + 1}`;
                if (seq === 5) zone = 'zone-em-left';
                if (seq === 6) zone = 'zone-em-right';
                snapshot.monsters.push({ code: c.code, sequence: seq, zone });
            }
        });

        const szone = lib.duelQueryLocation(duel, { flags: 1, controller: 0, location: OcgLocation.SZONE }) || [];
        szone.forEach((c, seq) => {
            if (c && c.code) {
                let zone = `zone-s${seq + 1}`;
                if (seq === 5) zone = 'zone-field';
                if (seq === 6) zone = 'zone-s1';
                if (seq === 7) zone = 'zone-s5';
                snapshot.spells.push({ code: c.code, sequence: seq, zone });
            }
        });

        const hand = lib.duelQueryLocation(duel, { flags: 1, controller: 0, location: OcgLocation.HAND }) || [];
        hand.forEach((c, seq) => {
            if (c && c.code) snapshot.hand.push({ code: c.code, sequence: seq, zone: 'zone-hand' });
        });

        const gy = lib.duelQueryLocation(duel, { flags: 1, controller: 0, location: OcgLocation.GRAVE }) || [];
        gy.forEach((c, seq) => {
            if (c && c.code) snapshot.gy.push({ code: c.code, sequence: seq, zone: 'zone-gy' });
        });

        const banish = lib.duelQueryLocation(duel, { flags: 1, controller: 0, location: OcgLocation.REMOVED }) || [];
        banish.forEach((c, seq) => {
            if (c && c.code) snapshot.banish.push({ code: c.code, sequence: seq, zone: 'zone-banish' });
        });

        const extra = lib.duelQueryLocation(duel, { flags: 1, controller: 0, location: OcgLocation.EXTRA }) || [];
        extra.forEach((c, seq) => {
            if (c && c.code) snapshot.extra.push({ code: c.code, sequence: seq, zone: 'zone-extra' });
        });
    } catch {
        // Fallback on query failure
    }
    return snapshot;
}

/**
 * Decodes legal zone places from ocgcore field_mask (0 = available, 1 = forbidden).
 */
export function getAvailablePlaces(fieldMask, player = 0) {
    const places = [];
    const mask = Number(BigInt.asUintN(32, BigInt(fieldMask)));

    // Player 0 Monster Zones (bits 0-4), ordered [1, 0, 2, 3, 4] so zones pointed to by Left EMZ (seq 5: ⬇=1, ↙=0, ↘=2) are preferred first
    for (const seq of [1, 0, 2, 3, 4]) {
        if ((mask & (1 << seq)) === 0) {
            places.push({ player: 0, location: OcgLocation.MZONE, sequence: seq });
        }
    }
    // Player 0 Extra Monster Zones (bits 5-6)
    if ((mask & (1 << 5)) === 0) {
        places.push({ player: 0, location: OcgLocation.MZONE, sequence: 5 });
    }
    if ((mask & (1 << 6)) === 0) {
        places.push({ player: 0, location: OcgLocation.MZONE, sequence: 6 });
    }
    // Player 0 Spell/Trap Zones (bits 8-12)
    for (let seq = 0; seq < 5; seq++) {
        if ((mask & (1 << (8 + seq))) === 0) {
            places.push({ player: 0, location: OcgLocation.SZONE, sequence: seq });
        }
    }
    // Player 0 Field Zone (bit 13)
    if ((mask & (1 << 13)) === 0) {
        places.push({ player: 0, location: OcgLocation.FZONE, sequence: 5 });
    }

    // Player 1 Monster Zones (bits 16-20) for tokens/monsters placed on opponent's field (Lost World, Girsu, Mimighoul, etc.)
    for (let seq = 0; seq < 5; seq++) {
        if ((mask & (1 << (16 + seq))) === 0) {
            places.push({ player: 1, location: OcgLocation.MZONE, sequence: seq });
        }
    }
    // Player 1 Extra Monster Zones (bits 21-22)
    if ((mask & (1 << 21)) === 0) {
        places.push({ player: 1, location: OcgLocation.MZONE, sequence: 5 });
    }
    if ((mask & (1 << 22)) === 0) {
        places.push({ player: 1, location: OcgLocation.MZONE, sequence: 6 });
    }
    // Player 1 Spell/Trap Zones (bits 24-28)
    for (let seq = 0; seq < 5; seq++) {
        if ((mask & (1 << (24 + seq))) === 0) {
            places.push({ player: 1, location: OcgLocation.SZONE, sequence: seq });
        }
    }
    // Player 1 Field Zone (bit 29)
    if ((mask & (1 << 29)) === 0) {
        places.push({ player: 1, location: OcgLocation.FZONE, sequence: 5 });
    }

    return places;
}

// Why a written step could not be simulated. Only 'narrative' (prose with no game action) leaves later
// failures trustworthy; after any other skip the board may differ from what the writer had.
export const UNSIMULATED_REASONS = {
    'narrative': 'commentary, not a game action',
    'unidentified-card': 'no card in the step could be identified',
    'opponent-board': 'depends on the opponent\'s cards, turn or battle',
    'non-specific': 'step is not specific enough to replay (examples, "any", cross-references)',
    'effect-description': 'describes an effect resolving rather than an action to take',
    'card-script-missing': 'the engine has no script for a card in this step'
};

const LEADING_CONNECTOR_RE = /^(?:(?:then|next|now|finally|also|first|and|afterwards?|optionally|immediately|after that|from there|on resolution),?\s+)+/i;
const ACTION_VERB_RE = /^(?:normal summon|tribute summon|special summon|link summon|xyz summon|synchro summon|fusion summon|ritual summon|pendulum summon|normal set|summon|ss|ns|activate|use|set|send|discard|tribute|banish|add|search|equip|link|xyz|synchro|fuse|fusion|overlay|tune|place|reveal|detach|attach|target|destroy|pay|declare|shuffle|return|revive|excavate|mill|dump|chain|negate|flip|draw|rank[- ]?up|contact fuse|pop|bounce|scale|move|choose|select|apply|resolve|trigger|pass|enter|attack|perform|make|climb|bring|copy|gain|swap|switch|take|stack|recover|retrieve|deploy|field|open|start|begin|play|go|get|do|finish|end)\b/i;
const OPPONENT_RE = /\b(?:opponent|opponents|opponent's|their\s+(?:[a-z-]+\s+){0,2}(?:boss|monsters?|cards?|field|board|turn|hand|gy|graveyard|deck|extra deck|life|lp|effects?|backrow)|enemy|opposing|attack(?:s|ing|ed)?(?!\s+position)|battle|battle damage|damage|direct(?:ly)? attack|otk|for game|lethal)\b/i;
const NON_SPECIFIC_RE = /\b(?:standard|usual|same (?:as|way|three|steps)|as above|as before|previous(?:ly)?|repeat|again|continue|loop|until|as (?:many|much) as|any (?:number|combination)|multiple|several|various|extenders?|swarm|build (?:your|the|a) (?:board|field)|end board|etc\.?|and so on|or (?:any|another|other)|e\.g\.?|such as|for example|(?:a|an|any|some|another|other|two|three|your)\s+(?:[A-Za-z0-9"'+/-]+\s+){0,3}(?:monsters?|cards?|tuners?|spells?|traps?|bodies|materials?|extenders?|starters?)\b|start(?:ing)? (?:by|with)|begin(?:ning)? (?:by|with)|(?:a|an|another|any)\s+(?:[A-Za-z0-9"'+/-]+\s+){0,3}like\b)/i;

// Any game-action word anywhere in a sentence means it is not pure commentary, even when the action follows a
// lead-in ("With two monsters, Link Summon...") or is a fragment ("rank it up into...", "revives Meek from the GY")
const GAME_ACTION_RE = /\b(?:summon(?:s|ed|ing)?|activat(?:e|es|ed|ing)|link(?:s|ed|ing)?|xyz|synchro|fusion|fus(?:e|es|ed|ing)|overlay|tun(?:e|es|ed|ing)|rank[- ]?up|rank (?:it|them) up|search(?:es|ed|ing)?|add(?:s|ed|ing)?|send(?:s|ing)?|sent|discard(?:s|ed|ing)?|banish(?:es|ed|ing)?|tribut(?:e|es|ed|ing)|destroy(?:s|ed|ing)?|reviv(?:e|es|ed|ing)|set(?:s|ting)?(?!\s*up)|equip(?:s|ped|ping)?|attach(?:es|ed|ing)?|detach(?:es|ed|ing)?|draw(?:s|n|ing)?|mill(?:s|ed|ing)?|excavat(?:e|es|ed|ing)|return(?:s|ed|ing)?|shuffl(?:e|es|ed|ing)|flip(?:s|ped|ping)?|reveal(?:s|ed|ing)?|negat(?:e|es|ed|ing)|pay(?:s|ing)?|declar(?:e|es|ed|ing)|plac(?:e|es|ed|ing)(?<!in(?:to)? place)|dump(?:s|ed|ing)?|recover(?:s|ed|ing)?|retriev(?:e|es|ed|ing)|bounc(?:e|es|ed|ing)|pop(?:s|ped|ping)?|scale[sd]?|ritual|climb(?:s|ed|ing)?|deploy(?:s|ed|ing)?|brings?|us(?:e|es|ed|ing)|swap(?:s|ped|ping)?|switch(?:es|ed|ing)?|steal(?:s|ing)?|take control|chain(?:s|ed|ing)?|attack(?:s|ed|ing)?|ss|ns)\b/i;
// A lead-in before the instruction itself: "With 3 counters on Dimonno, ...", "Because ..., ...", "You can then ..."
const LEADING_CLAUSE_RE = /^(?:(?:with|because|since|if|once|when|whenever|after|before|on|during|in|now that|as soon as|as|using|by)\b[^,:]{0,140}[,:]\s*|you (?:can|may|could|should|then|now)\s+(?:then\s+|now\s+|immediately\s+|also\s+)*)/i;

/**
 * Decides whether a step the engine did not match is a step the engine cannot simulate (and why),
 * as opposed to a concrete action the engine refused. Returns a key of UNSIMULATED_REASONS, or null.
 */
export function classifyUnsimulatedStep(rawText, { hasCard = false, stepCodes = [], unscriptedCodes = null } = {}) {
    const text = String(rawText || '').replace(LEADING_CONNECTOR_RE, '').trim();
    if (!text || !GAME_ACTION_RE.test(text)) return 'narrative';
    if (unscriptedCodes && stepCodes.some(c => unscriptedCodes.has(c))) return 'card-script-missing';
    if (OPPONENT_RE.test(text)) return 'opponent-board';
    if (!hasCard) return 'unidentified-card';
    // A described cost ("by discarding another trap") doesn't make the action vague: the builder supplies a matching card
    const withoutCost = text.replace(/\b(?:by|after|while)\s+(?:discard|tribut|banish|send|reveal|detach|pay)\w*\s+[^,.;]*/gi, '');
    if (NON_SPECIFIC_RE.test(withoutCost)) return 'non-specific';
    const core = text.replace(LEADING_CLAUSE_RE, '').replace(LEADING_CONNECTOR_RE, '').trim();
    if (ACTION_VERB_RE.test(core)) return null;
    return 'effect-description';
}

// Steps that tell the player to act. A card picked while resolving an effect never completes one of these:
// searching Diameter is not "Normal Summon Diameter", detaching Winder is not "Overlay Winder and Bezel Ship to Xyz Summon ..."
const PLAYER_COMMAND_STEP_RE = /^(?:then,?\s+)?(?:activat(?:e|ing)|normal summon|tribute summon|normal set|set\b|link summon|xyz summon|synchro summon|fusion summon|ritual summon|pendulum summon|(?:overlay|tune)\b.{0,80}?\b(?:to|into|for)\s+(?:(?:xyz|synchro)\s+summon\b|[A-Z]))/i;
// A step commanding a summon or Set (after any lead-in) describes no trigger: chaining a trigger never completes it
const SUMMON_COMMAND_STEP_RE = /^(?:then,?\s+)?(?:normal summon|tribute summon|normal set|set\b|link summon|xyz summon|synchro summon|fusion summon|ritual summon|pendulum summon)\b/i;

const NAME_STOPWORDS = new Set(['the', 'of', 'and', 'with', 'from', 'for', 'your', 'this', 'that', 'its', 'into', 'card', 'cards', 'monster', 'monsters']);

function nameTokens(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length >= 3 && !NAME_STOPWORDS.has(t));
}

function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        let diag = prev[0];
        prev[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = prev[j];
            prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
        }
    }
    return prev[b.length];
}

// "Diabellstarr" ~ "diabellstar", "Diabell" ~ "diabellstar"; short tokens must match exactly
function tokensMatch(textToken, nameToken) {
    if (textToken === nameToken) return true;
    const shorter = Math.min(textToken.length, nameToken.length);
    if (shorter < 5) return false;
    if (nameToken.startsWith(textToken) || textToken.startsWith(nameToken)) return true;
    return editDistance(textToken, nameToken) <= (shorter >= 8 ? 2 : 1);
}

/**
 * Scores how strongly a step text refers to a card name. Name words shared by many cards in the combo
 * (archetype words like "Abyss", "Actor") count for little; a distinctive word counts fully.
 */
export function scoreNameAgainstText(cardName, text, tokenFrequency) {
    const textTokens = nameTokens(text);
    let score = 0;
    for (const nt of new Set(nameTokens(cardName))) {
        if (textTokens.some(tt => tokensMatch(tt, nt))) {
            score += 1 / Math.max(1, tokenFrequency.get(nt) || 1);
        }
    }
    return score;
}

/**
 * Replays and verifies a combo against ocgcore.
 * options.lenient: steps the engine cannot simulate from prose (commentary, opponent-dependent, unidentifiable)
 *   are recorded in `unverifiedSteps` and skipped instead of ending the replay.
 * options.decisionOverrides: Map of decision id -> choice, used by runComboReplaySearch to try alternatives.
 */
export async function runComboReplay(combo, options = {}) {
    const { resolved, idMap, nameMap, missing } = await resolveComboCards(combo);

    if (missing.length > 0) {
        return {
            status: 'UNOFFICIAL_CARDS',
            legal: false,
            message: `Combo contains ${missing.length} unresolvable or unofficial card(s): ${missing.map(m => m.name || m.id).join(', ')}`,
            missingCards: missing,
            stepsCompleted: 0,
            totalSteps: (combo.steps || []).length
        };
    }

    if (resolved.length === 0) {
        return {
            status: 'UNOFFICIAL_CARDS',
            legal: false,
            message: 'No cards could be resolved for this combo.',
            missingCards: [],
            stepsCompleted: 0,
            totalSteps: (combo.steps || []).length
        };
    }

    // Automatically detect opening "Draw <card> to zone-hand" steps and ensure they start in HAND
    const cardsToStartInHand = new Set();
    for (const step of (combo.steps || [])) {
        if (step.to === 'zone-hand' && /^draw/i.test(step.text || '')) {
            cardsToStartInHand.add(step.card);
        } else {
            break;
        }
    }
    for (const card of resolved) {
        if (cardsToStartInHand.has(card.id)) {
            card.zone = 'zone-hand';
        }
    }

    // Ensure all scripts are cached locally
    const unscriptedCodes = await preloadComboScripts(resolved);

    // Initialize duel instance with TEST_MODE to preserve deterministic deck order
    const duelOptions = {
        ...options,
        flags: (options.flags || OcgDuelMode.MODE_MR5) | OcgDuelMode.TEST_MODE
    };
    const { lib: coreLib, duel } = await createDuelInstance(duelOptions);
    // Counts responses, so the run can tell the idle prompt where it issued the last step (keep going until that
    // action has resolved) from the next one, which it leaves unanswered (the combo is done)
    let responsesSet = 0;
    const lib = new Proxy(coreLib, {
        get(target, prop) {
            if (prop === 'duelSetResponse') return (d, r) => { responsesSet++; return target.duelSetResponse(d, r); };
            const v = target[prop];
            return typeof v === 'function' ? v.bind(target) : v;
        }
    });
    // In scripted combo replay verification, keep the deck deterministic by disabling automatic deck shuffling on searches
    lib.loadScript(duel, 'disable_shuffle.lua', 'Duel.ShuffleDeck = function(p) end');

    try {
        // Separate deck cards and non-deck cards
        const nonDeckCards = [];
        const deckCards = [];
        const isScenarioSetup = /opponent(?:'s)?\s+turn|their\s+turn|turn\s*0|going\s+second|mid-game|puzzle|recovery/i.test((combo.title || '') + ' ' + (combo.description || ''));

        for (const card of resolved) {
            let z = parseZone(card.zone) || { location: OcgLocation.DECK, sequence: 0 };
            const cardData = getCardByCode(card.code);
            const isExtraType = Boolean(cardData && ((cardData.type || 0) & 0x4802040) !== 0); // Fusion, Synchro, Xyz, Link

            // A preset card (deliberate mid-board start, e.g. "Use two Level 3 monsters to Xyz Summon...") keeps its field/GY/banish zone
            const keepsPresetZone = Boolean(card.preset) && [OcgLocation.MZONE, OcgLocation.SZONE, OcgLocation.FZONE, OcgLocation.GRAVE, OcgLocation.REMOVED].includes(z.location);

            if (keepsPresetZone) {
                // ocgcore has no standalone Field Zone location: it is Spell & Trap Zone sequence 5
                if (z.location === OcgLocation.FZONE) z = { location: OcgLocation.SZONE, sequence: 5 };
            } else if (isExtraType) {
                // Extra Deck cards otherwise ALWAYS belong in Extra Deck
                z = { location: OcgLocation.EXTRA, sequence: 0 };
            } else if (!isScenarioSetup && (z.location === OcgLocation.SZONE || z.location === OcgLocation.MZONE || z.location === OcgLocation.GRAVE)) {
                // In standard turn-1 opening combos, Main Deck cards must start in the Deck (not on field/GY)
                z = { location: OcgLocation.DECK, sequence: 0 };
            }

            if (z.location === OcgLocation.DECK) {
                deckCards.push(card);
            } else {
                nonDeckCards.push({ card, z });
            }
        }

        // Place non-deck cards into designated zones
        const usedFieldSeqs = new Set();
        for (const { card, z } of nonDeckCards) {
            let sequence = z.sequence;
            // Two preset cards can't share a zone: shift to the next free Main Monster / Spell & Trap Zone
            if ((z.location === OcgLocation.MZONE || z.location === OcgLocation.SZONE) && sequence < 5) {
                while (usedFieldSeqs.has(`${z.location}:${sequence}`) && sequence < 4) sequence++;
            }
            if (z.location === OcgLocation.MZONE || z.location === OcgLocation.SZONE) usedFieldSeqs.add(`${z.location}:${sequence}`);

            let position = OcgPosition.FACEUP_ATTACK;
            if (z.location === OcgLocation.HAND || z.location === OcgLocation.EXTRA) {
                position = OcgPosition.FACEDOWN;
            } else if (z.location === OcgLocation.SZONE && sequence < 5) {
                // A preset Trap or Normal/Quick-Play Spell sits Set; Continuous/Equip/Field cards are face-up
                const t = card.data?.type || 0;
                const isFaceUpType = (t & 0x20000) || (t & 0x40000) || (t & 0x80000) || (t & 0x1);
                position = isFaceUpType ? OcgPosition.FACEUP_ATTACK : OcgPosition.FACEDOWN;
            }
            lib.duelNewCard(duel, {
                team: 0,
                duelist: 0,
                code: card.code,
                controller: 0,
                location: z.location,
                sequence,
                position
            });
        }

        // Pad main deck with generic dummy cards so excavation/draw/mill effects (requiring >= 5 cards) function deterministically
        const MIN_DECK_SIZE = 20;
        const dummyPadCount = Math.max(0, MIN_DECK_SIZE - deckCards.length);
        for (let i = 0; i < dummyPadCount; i++) {
            lib.duelNewCard(duel, {
                team: 0,
                duelist: 0,
                code: DUMMY_DISCARD_CODE,
                controller: 0,
                location: OcgLocation.DECK,
                sequence: 0,
                position: OcgPosition.FACEDOWN
            });
        }

        // Order combo deck cards so targets needed in earlier steps appear at the TOP of the deck (highest sequence)
        const steps = combo.steps || [];
        const stepMentionIndex = new Map();
        // First match exact card id where step mentions the exact card ID
        for (let s = 0; s < steps.length; s++) {
            const stepCardIds = [
                steps[s].card,
                ...(steps[s].actions || []).map(a => a.card)
            ].filter(Boolean);
            for (const sc of stepCardIds) {
                for (const dc of deckCards) {
                    if (dc.id && sc === dc.id && !stepMentionIndex.has(dc.id)) {
                        stepMentionIndex.set(dc.id, s);
                    }
                }
            }
        }
        // Fallback match by name/code for cards not yet matched by exact id
        for (let s = 0; s < steps.length; s++) {
            const st = cleanCardName(steps[s].text || '').toLowerCase();
            for (const dc of deckCards) {
                const key = dc.id || dc.code;
                if (!stepMentionIndex.has(key)) {
                    if ((dc.officialName && st.includes(dc.officialName.toLowerCase())) || (dc.name && st.includes(dc.name.toLowerCase()))) {
                        stepMentionIndex.set(key, s);
                    }
                }
            }
        }

        // Cards needed in LATER steps are placed first (towards bottom); cards needed in EARLIER steps placed last (at top)
        deckCards.sort((a, b) => {
            const keyA = (a.id && stepMentionIndex.has(a.id)) ? a.id : a.code;
            const keyB = (b.id && stepMentionIndex.has(b.id)) ? b.id : b.code;
            const idxA = stepMentionIndex.has(keyA) ? stepMentionIndex.get(keyA) : 999;
            const idxB = stepMentionIndex.has(keyB) ? stepMentionIndex.get(keyB) : 999;
            return idxB - idxA;
        });

        for (const card of deckCards) {
            const key = (card.id && stepMentionIndex.has(card.id)) ? card.id : card.code;
            const stepIdxForCard = stepMentionIndex.has(key) ? stepMentionIndex.get(key) : -1;
            const stepText = (stepIdxForCard >= 0 && steps[stepIdxForCard]) ? cleanCardName(steps[stepIdxForCard].text || '').toLowerCase() : '';
            const prevStepText = (stepIdxForCard > 0 && steps[stepIdxForCard - 1]) ? cleanCardName(steps[stepIdxForCard - 1].text || '').toLowerCase() : '';
            const isExcavationTarget = /(?:excavat|mill|top \d+ cards?|send top|off (?:researcher|analyzer|seeker|adamancipator|dante|scheiren|havnis|merrli|kitkallos|tear)|(?:researcher|analyzer|seeker|dragite|raptite|leonite|dante|scheiren|havnis|merrli|kitkallos)\s+effect)/i.test(stepText) ||
                /(?:excavat|mill|top \d+ cards?|send top|off (?:researcher|analyzer|seeker|adamancipator|dante|scheiren|havnis|merrli|kitkallos|tear)|(?:researcher|analyzer|seeker|dragite|raptite|leonite|dante|scheiren|havnis|merrli|kitkallos)\s+effect)/i.test(prevStepText);

            // If this card is an excavation target, insert dummy padding below it so it occupies its own excavation window
            if (isExcavationTarget) {
                for (let i = 0; i < 4; i++) {
                    lib.duelNewCard(duel, {
                        team: 0,
                        duelist: 0,
                        code: DUMMY_DISCARD_CODE,
                        controller: 0,
                        location: OcgLocation.DECK,
                        sequence: 0,
                        position: OcgPosition.FACEDOWN
                    });
                }
            }

            lib.duelNewCard(duel, {
                team: 0,
                duelist: 0,
                code: card.code,
                controller: 0,
                location: OcgLocation.DECK,
                sequence: 0,
                position: OcgPosition.FACEDOWN
            });
        }

        // Going-second lines: the opponent already controls these monsters (face-up, no effects of their own)
        (combo.opponentMonsters || []).forEach((code, i) => {
            lib.duelNewCard(duel, {
                team: 1,
                duelist: 0,
                code,
                controller: 1,
                location: OcgLocation.MZONE,
                sequence: i,
                position: OcgPosition.FACEUP_ATTACK
            });
        });
        // The opponent has an Extra Deck, as in any real duel: Dogmatika Maximus can't activate unless they do
        for (const code of [45231177, 66889139, 54752875]) { // Flame Swordsman, Gaia the Dragon Champion, Twin-Headed Thunder Dragon
            lib.duelNewCard(duel, {
                team: 1,
                duelist: 0,
                code,
                controller: 1,
                location: OcgLocation.EXTRA,
                sequence: 0,
                position: OcgPosition.FACEDOWN
            });
        }

        lib.startDuel(duel);

        let stepIdx = 0;
        let loopCount = 0;
        const maxLoops = Math.max(500, steps.length * 60);
        const log = [];
        const errors = [];

        let lastActorCode = null;
        let lastSelectedCardCode = null;
        let lastOfferedActions = null;

        // OCGCore physical location tracking
        let currentActiveStepIdx = 0;
        const stepActions = [];
        for (let i = 0; i < steps.length; i++) {
            stepActions.push([]);
        }
        const cardZoneMap = new Map();
        for (const c of (combo.cards || [])) {
            cardZoneMap.set(c.id, c.zone || 'zone-deck');
        }
        for (const c of resolved) {
            if (c.id && c.zone) cardZoneMap.set(c.id, c.zone);
        }
        if (options.debug) console.log('INIT cardZoneMap 17:', cardZoneMap.get('card_54207171_17'));

        function lookupCleanInNameMap(clean) {
            if (!clean || clean.length < 3) return [];
            if (/^(?:the|a|an|first|second|third|fourth|fifth|effect|effects|card|cards|monster|monsters|spell|spells|trap|traps|deck|hand|field|graveyard|turn|phase|level|rank|link|scale|scales|pendulum|normal|special|summon|summoning|activate|activating|tribute|tributing|discard|discarding|banish|banishing|search|searching|add|adding|set|setting|this|that|it|its|her|his|their|your|itself|herself|himself|both|two|three|one|any|other|another|target|material|materials|starter|extender)$/i.test(clean)) {
                return [];
            }
            if (nameMap.has(clean)) {
                return [nameMap.get(clean).code];
            }
            const sorted = [...nameMap.entries()].sort((a, b) => b[0].length - a[0].length);
            const matched = [];
            const matchedSpans = [];
            for (const [name, c] of sorted) {
                let searchStart = 0;
                while (searchStart < clean.length) {
                    const idx = clean.indexOf(name, searchStart);
                    if (idx === -1) break;
                    const end = idx + name.length;
                    const overlaps = matchedSpans.some(([s, e]) => Math.max(idx, s) < Math.min(end, e));
                    if (!overlaps && !matched.includes(c.code)) {
                        matched.push(c.code);
                        matchedSpans.push([idx, end]);
                    }
                    searchStart = idx + 1;
                }
            }
            if (matched.length > 0) return matched;

            const wordRe = new RegExp(`\\b${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            for (const [name, c] of sorted) {
                if (wordRe.test(name) && !matched.includes(c.code)) {
                    matched.push(c.code);
                }
            }
            if (matched.length > 2) return [];
            return matched;
        }

        function matchFragmentCodes(frag) {
            if (!frag) return [];
            // Special cases: acronyms and common abbreviations
            const trimFrag = frag.trim();
            if (/^(?:the\s+)?servant$/i.test(trimFrag)) {
                const monsterServant = [...nameMap.values()].find(c => c.officialName.toLowerCase().includes('servant') && (c.data.type & 1));
                if (monsterServant) return [monsterServant.code];
            }
            if (/^(?:the\s+)?bewd$/i.test(trimFrag)) return [89631133];
            if (/^(?:the\s+)?dm$/i.test(trimFrag)) return [46986414];
            if (/^(?:the\s+)?dmg$/i.test(trimFrag)) return [38033121];

            const baseClean = cleanCardName(frag)
                .replace(/\s*\((?:currently\s+|now\s+)?(?:limited|semi-limited|banned|forbidden|level\s*\d+|rank\s*\d+|link-\d+|\d+|optional|cost)[^)]*\)/gi, '')
                .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+|one\s+|1\s+|any\s+|2nd\s+|second\s+)/i, '')
                .replace(/\s*'s(?:\s+(?:monster|gy|graveyard|hand|field|scale|on-summon|summon|on-activation|quick|second|first|other|ignition))?(?:\s+effect)?$/i, '')
                .replace(/(?:'s|s')$/i, '')
                .replace(/\s+(?:effect|cost|trigger|action)$/i, '')
                .trim();

            if (!baseClean || baseClean.length < 3) return [];
            if (/^servant$/i.test(baseClean)) {
                const monsterServant = [...nameMap.values()].find(c => c.officialName.toLowerCase().includes('servant') && (c.data.type & 1));
                if (monsterServant) return [monsterServant.code];
            }

            // If baseClean starts with a word that can be part of a card name ("Tribute Lanius", "Link Spider", "Set Rotation"), check unstripped first
            if (/^(?:tribute|link|set|fusion|synchro|xyz|ritual|pendulum|place|target)\s+[A-Z]/i.test(baseClean)) {
                const directMatch = lookupCleanInNameMap(baseClean.toLowerCase());
                if (directMatch.length > 0) return directMatch;
            }

            const verbStripped = baseClean
                .replace(/^(?:(?:activate|activating|use|using|trigger|triggering|normal summon(?:ing)?|special summon(?:ing)?|link summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|fusion summon(?:ing)?|ritual summon(?:ing)?|pendulum summon(?:ing)?|tribute summon(?:ing)?|summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|banish(?:ing)?|send(?:ing)?|target(?:ing)?|chain(?:ing)?|overlay(?:ing)?|tune|tuning|equip(?:ping)?|place|placing|finish(?:ing)?|tribute|tributing|link|linking|set|setting|reviv(?:e|ing)|search(?:ing)?(?:\s+for)?|add(?:ing)?|return(?:ing)?|recover(?:ing)?|retriev(?:e|ing)|dump(?:ing)?|mill(?:ing)?|excavat(?:e|ing)|attach(?:ing)?|detach(?:ing)?|destroy(?:ing)?|pop(?:ping)?|bounc(?:e|ing)|shuffl(?:e|ing)|draw(?:ing)?|fus(?:e|ing)|declar(?:e|ing)|scal(?:e|ing)|flip(?:ping)?)\s+)+/i, '')
                .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+|one\s+|1\s+|any\s+|2nd\s+|second\s+)/i, '')
                .replace(/^(?:(?:on-summon|summon|on-activation|ignition|gy|graveyard|hand|field|scale|quick|first|second)\s+)?effect(?:\s+of)?\s+/i, '')
                .trim()
                .toLowerCase();

            const strippedRes = lookupCleanInNameMap(verbStripped);
            if (strippedRes.length > 0) return strippedRes;
            return lookupCleanInNameMap(baseClean.toLowerCase());
        }

        function findStepCardCodes(step, prevActorCode = null) {
            if (!step) return [];
            const codes = [];
            const addCode = (c) => {
                if (c && !codes.includes(c)) codes.push(c);
            };

            const rawText = cleanCardName(step.text || '').replace(/^(?:action:\s*|step\s+\d+:\s*)+/i, '')
                // "With Manju and Doriado's Blessing in your hand, ...": the opening hand, not cards this step acts on
                .replace(/^with\b.{0,160}?\bin (?:your )?hand,\s*/i, '')
                .trim();
            const textLower = rawText.toLowerCase();

            // 1. Pronoun or bare "Activate effect" / "the searched <X>" reference to previous card
            const explicitColonMatch = /(?:activat(?:e|ing)|us(?:e|ing))\s+(?:the\s+)?(?:[a-z-]+\s+)?effect:\s*([A-Za-z0-9"',\s-]+?)(?:\s+in\b|\s+on\b|\s+to\b|\s+from\b|\s+sends\b|\s+targets\b|\s+adds\b|\s+was\b|,\s*|\.\s*|$)/i.exec(rawText);
            if (explicitColonMatch) {
                for (const c of matchFragmentCodes(explicitColonMatch[1])) addCode(c);
            } else if (
                /^(?:tribute(?:d|ing)? it|discard(?:ing)? it|us(?:e|ing) (?:it|its|her|his)|activat(?:e|ing) (?:it|its|her|his)|(?:its|her|his) (?:[a-z-]+\s+)?effect|(?:activat(?:e|ing)|us(?:e|ing))\s+(?:the\s+)?(?:on-summon\s+|summon\s+|on-activation\s+|monster\s+|ignition\s+|gy\s+|graveyard\s+|hand\s+|field\s+|scale\s+|quick\s+|first\s+|second\s+)?effect\s*(?::|\.|\s+to\b|\s*\(|$)|set(?:ting)? it|banish(?:ing)? it|link(?:ing)? it|overlay(?:ing)? it|special summon(?:ing)? (?:it|himself|herself|itself)|normal summon(?:ing)? it|summon(?:ing)? (?:it|himself|herself|itself)|plac(?:e|ing) it)/i.test(rawText) ||
                /\bthe\s+(?:searched|added|recovered|drawn)\s+[a-z0-9"'\s-]+\b/i.test(rawText)
            ) {
                if ((/^(?:us(?:e|ing)|activat(?:e|ing)|set(?:ting)?|special summon(?:ing)?|normal summon(?:ing)?|summon(?:ing)?|place|placing) it\b/i.test(rawText) || /\bthe\s+(?:searched|added|recovered|drawn)\b/i.test(rawText)) && lastSelectedCardCode) {
                    addCode(lastSelectedCardCode);
                }
                if (prevActorCode) addCode(prevActorCode);
                if (lastSelectedCardCode) addCode(lastSelectedCardCode);
            }

            // 2. "Reveal <Spell/Card> to Special Summon <Monster>" -> <Monster> is the hand effect activator, <Spell/Card> is the cost
            const revealToSummon = rawText.match(/reveal(?:ing)?\s+([A-Za-z0-9',\s-:]+?)\s+to\s+special summon\s+([A-Za-z0-9',\s-:]+?)(?::|\.|\s+from|\s+to|,(?!\s*the\b)|\s+and|\s+then|$)/i);
            if (revealToSummon) {
                for (const c of matchFragmentCodes(revealToSummon[2])) addCode(c);
                for (const c of matchFragmentCodes(revealToSummon[1])) addCode(c);
            }

            // 3. Explicit effect owner: "Activate/Use/Trigger/Chain <Card>'s [monster/gy/hand] effect", "<Card>'s effect", or "(<Card> Effect/Cost)"
            const ownerMatches = [
                ...rawText.matchAll(/(?:activat(?:e|ing)|us(?:e|ing)|trigger(?:ing)?|chain(?:ing)?|finish(?:ing)?)\s+(?:the\s+)?(?:[a-z-]+\s+)?effect(?:\s+of|\s*:)?\s+([A-Za-z0-9"',\s-]+?)(?:\s+in\b|\s+on\b|\s+to\b|\s+from\b|\s+sends\b|\s+targets\b|\s+adds\b|,\s*|\.\s*|$)/gi),
                ...rawText.matchAll(/(?:activat(?:e|ing)|us(?:e|ing)|trigger(?:ing)?|chain(?:ing)?|finish(?:ing)?)\s+(?!(?:the|a|an|its|her|his|their|first|second|third)\s+)([A-Za-z0-9',\s-]+?)(?:\s*'s|\s+monster|\s+gy|\s+graveyard|\s+hand|\s+field|\s+scale|\s+ignition)?\s+(?:[a-z-]+\s+)?effect/gi),
                ...rawText.matchAll(/\b([A-Z][A-Za-z0-9',\s-]+?)\s*'s\s+(?:[a-z-]+\s+)?effect/g),
                ...rawText.matchAll(/\(([A-Z][A-Za-z0-9',\s-]+?)(?:\s+(?:gy|graveyard|hand|field|on-summon|ignition|trigger|continuous|quick))?\s+(?:effect|cost|trigger|search)\)/gi)
            ];
            for (const om of ownerMatches) {
                const ownerClean = om[1]
                    .split(/\b(?:with|using|by|from|after|when|while|as|via|through)\s+/i)
                    .pop()
                    .replace(/\s*'s$/i, '')
                    .replace(/\s+(?:gy|graveyard|hand|field|on-summon|ignition|trigger|continuous|quick)$/i, '')
                    .trim();
                for (const c of matchFragmentCodes(ownerClean)) addCode(c);
            }

            // 4. Primary verb target: "Normal Summon <X>", "Activate <X>", "Link Summon <X>", + concrete examples "(e.g., <X>)" / "like <X>"
            const verbMatches = [...rawText.matchAll(/(?:normal summon(?:ing)?|tribute summon(?:ing)?|^summon(?:ing)?|activat(?:e|ing)|reveal(?:ing)?|special summon(?:ing)?|link summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|fusion summon(?:ing)?|ritual summon(?:ing)?|pendulum summon(?:ing)?|rank-up into|climb(?:ing)?\s+into|overlay(?:ing)?(?:\s+.*?\s+(?:into|to)|\s+into|\s+to)?|tune\s+.*?\s+into|contact fusion|contact fuse(?: into)?|link\s+.*?\s+(?:into|for|->|→)|set(?:ting)?|place|placing)\s+(?:-\s*)?([A-Za-z0-9',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+into\b|\s+as\b|\s+in\b|\s+on\b|,(?!\s*the\b)|\s+and\b|$)/gid)];
            const namesByLength = [...nameMap.entries()].sort((a, b) => b[0].length - a[0].length);
            for (const vm of verbMatches) {
                // The fragment stops at a colon, so "Xyz Summon Number 69: Heraldry Crest" would only look up
                // "Number 69" (and pick Shatter Stream); a full name written at that spot wins, longest first
                const at = vm.indices[1][0];
                const full = namesByLength.find(([name]) => textLower.startsWith(name, at) && !/[a-z0-9]/.test(textLower[at + name.length] || ''));
                if (full) addCode(full[1].code);
                for (const c of matchFragmentCodes(vm[1])) addCode(c);
            }
            const exampleMatches = [...rawText.matchAll(/(?:\(\s*(?:e\.g\.?,?|i\.e\.?,?|like|such as|optimally|ideally|into)\s+|\b(?:e\.g\.?,?|like|such as)\s+)([A-Z][A-Za-z0-9"',\s-:]+?)(?=\)|,|\.|\s+to\b|\s+from\b|\s+in\b|\s+and\b|\s+or\b|$)/gi)];
            for (const em of exampleMatches) {
                for (const c of matchFragmentCodes(em[1])) addCode(c);
            }

            // 5. All cards mentioned in text (longest full card name match first, preventing substrings of longer matched names)
            const sortedEntries = [...nameMap.entries()].sort((a, b) => b[0].length - a[0].length);
            const matchedSpans = [];
            for (const [name, c] of sortedEntries) {
                let searchStart = 0;
                while (searchStart < textLower.length) {
                    const idx = textLower.indexOf(name, searchStart);
                    if (idx === -1) break;
                    const end = idx + name.length;
                    const overlaps = matchedSpans.some(([s, e]) => Math.max(idx, s) < Math.min(end, e));
                    if (!overlaps) {
                        addCode(c.code);
                        matchedSpans.push([idx, end]);
                    }
                    searchStart = idx + 1;
                }
            }

            // 6. Capitalized shorthand references in text (e.g. "Curtain", "Salvation", "the Servant", "Red-Eyes", "Herz")
            const capTokens = [...rawText.matchAll(/\b(?:the\s+)?([A-Z][A-Za-z0-9'-]{3,}(?:\s*(?:-\s*)?[A-Z][A-Za-z0-9'-]+)*)/g)];
            for (const ct of capTokens) {
                const start = ct.index;
                const end = start + ct[0].length;
                if (matchedSpans.some(([s, e]) => start >= s && end <= e)) continue;
                // "Gazelle Special Summons itself" runs a name into the verb: drop trailing words until a card matches
                const words = ct[0].split(/\s+/);
                let found = matchFragmentCodes(ct[0]);
                while (found.length === 0 && words.length > 1) {
                    words.pop();
                    if (/^(?:the\s+)?(?:normal|special|link|xyz|synchro|fusion|ritual|pendulum|tribute|set|activate|use|add|send|then|its|his|her|main|battle|end|standby|quick|deck|extra|field|gy|graveyard|hand)$/i.test(words.join(' '))) break;
                    found = matchFragmentCodes(words.join(' '));
                }
                for (const c of found) addCode(c);
            }

            // 7. Explicit step properties (targetCode, card id, featuredCard)
            if (step.targetCode) addCode(step.targetCode);
            if (step.card && idMap.has(step.card)) addCode(idMap.get(step.card).code);
            if (step.actions && step.actions.length > 0) {
                for (const act of step.actions) {
                    if (act.card && idMap.has(act.card)) addCode(idMap.get(act.card).code);
                }
            }
            if (step.featuredCard) {
                for (const c of matchFragmentCodes(step.featuredCard)) addCode(c);
            }

            return codes;
        }

        function findStepCardCode(step) {
            const codes = findStepCardCodes(step, lastActorCode);
            return codes[0] || null;
        }

        function skipRedundantVisualSteps() {
            while (stepIdx < steps.length) {
                if (chainStepsConsumed.has(stepIdx)) {
                    stepIdx++;
                    continue;
                }
                const s = steps[stepIdx];
                const t = (s.text || '').toLowerCase();
                const trimmed = t.trim();

                // Skip opening draw steps if card already in hand
                if (/^draw/i.test(t) && s.to === 'zone-hand') {
                    stepIdx++;
                    continue;
                }
                // Skip UI visual moves to S/T zone that are followed by activation
                if (/^move to (spell\/trap zone|field zone)/i.test(t)) {
                    const next = steps[stepIdx + 1];
                    if (next && /(activate|set)/i.test(next.text || '')) {
                        stepIdx++;
                        continue;
                    }
                }
                // Skip UI visual equip steps (e.g. "Equip X to Y") that represent the equip state already handled by engine
                if (/^equip\s+[a-z0-9"',\s-]+?\s+to\s+[a-z0-9"',\s-]+$/i.test(trimmed)) {
                    stepIdx++;
                    continue;
                }
                // Skip UI visual detach steps (e.g. "Detach Material to Graveyard X")
                if (/^detach(?:\s+material)?\b/i.test(trimmed)) {
                    stepIdx++;
                    continue;
                }

                const targetCardData = s.card && idMap.get(s.card);
                const isTargetMonster = targetCardData && Boolean(targetCardData.type & 0x1 || getCardByCode(targetCardData.code)?.type & 0x1);
                const isVisualSpellGySend = !isTargetMonster && !/\bcost\b/i.test(trimmed) &&
                    /^(?:move|send)\s+(?:.*?\s+)?(?:to\s+)?(?:the\s+)?(?:graveyard|gy)\b/i.test(trimmed) &&
                    Boolean(lastActorCode && (targetCardData?.code === lastActorCode || findStepCardCodes(s, lastActorCode).includes(lastActorCode)));
                const isPreSummonMaterialMove = (/^(?:move|send)\s+(?:.*?\s+)?(?:to\s+)?(?:the\s+)?(?:graveyard|gy)\b/i.test(trimmed) || /^(?:banish|move to banished|send to banished)\b/i.test(trimmed)) &&
                    !/\bcost\b/i.test(trimmed) &&
                    steps.slice(stepIdx + 1, stepIdx + 5).some(st => /^(?:link|synchro|xyz|fusion|contact fuse|contact fusion|(?:special\s+|normal\s+)?summon\b|\bss\b)/i.test((st?.text || '').trim()));

                // Skip UI visual spell graveyard sending steps, commentary, banlist notes, board state setups, and phase transitions
                if (
                    isVisualSpellGySend ||
                    isPreSummonMaterialMove ||
                    /^(?:.*goes to the (?:gy|graveyard)|(?:.+?\s+)?resolv(?:e|es|ing)(?:\s|:|\b)|battle phase:|enter (?:the )?battle phase|attack\b|after \d+ attacks|end (?:your )?turn|pass (?:the )?turn|legal because|this (?!card\b)|that is two layers|going second|you (?:now have|can now|are now|have now|can easily|now control)|you'll draw|now that you control|from (?:here|this point), (?:a series|the combo|you can|use)|the goal is to|result:|end board:|final board:|note:|required hand:|starting hand:|opening hand:|due to spiral fusion|nothing else is required|.*preparation of rites cannot|the earth-based p\.u\.n\.k\. monsters cannot|start with .* (?:in hand|on (?:your |the )?field|in your banished)|begin with a starter|.+?\s+sit(?:s)? on (?:your |the )?field|.+?\s+sits in your hand with\b|.+?\s+in hand,\s+a\s+level\s+\d+.*in the graveyard|with (?:four|4|three|3|two|2) (?:level|spellbooks|monsters|"[^"]+").*, (?:you (?:have|can)|the condition is met)|with .* on the field, your .* effects no longer|treat the level \d+ .* as level \d+|it (?:stops at|comes back face-up)|modern (?:.* )?builds (?:use|focus)|historically, players would|in the new format,|repeat the process until|enables a cascade of|a typical result includes|next turn it is|summoned during your turn|your scales are negated|cannot be destroyed by battle|its activation and effect cannot be negated|the (?:"[^"]+"|[a-z0-9-]+) (?:lock is now active|combo ends with)|the primary combo line involves|the loop begins|the standard path is to|either half moves|through standard fusion steps|by integrating .* into the)/i.test(trimmed) ||
                    /(?:is currently banned|is now forbidden|\(now forbidden\)|also banned|remains in hand for another reveal|shields other .* cards from battle|is always treated as a)/i.test(trimmed)
                ) {
                    if (!lastActorCode && /^(?:start with|begin with|open|required hand:)\b/i.test(trimmed)) {
                        const setupCodes = findStepCardCodes(s, null);
                        if (setupCodes.length > 0) lastActorCode = setupCodes[0];
                    }
                    stepIdx++;
                    continue;
                }
                break;
            }
        }

        let triggersFiredSinceLastIdle = 0;
        const cardsSelectedSinceLastIdle = new Set();
        const cardsSummonedSinceLastIdle = new Set();
        const cardsSetSinceLastIdle = new Set();
        const cardsBanishedSinceLastIdle = new Set();
        const cardsSentToGYSinceLastIdle = new Set();
        let playerInvokedSummonCode = null;
        let playerInvokedSetCode = null;
        let inOpponentTurn = false;
        let inEndPhase = false;
        let autoFiredPrevStepIgnition = false;
        const chainStack = new Map();
        let currentSolvingChainCard = null;
        let lastHintCardCode = null;
        const chainStepsConsumed = new Set();

        // Every choice the harness makes on the writer's behalf (which card to search, whether to use an optional
        // trigger, which effect option...) is logged with its untried alternatives. The duel is deterministic, so
        // runComboReplaySearch can replay with decisionOverrides to test whether a different choice makes the line work.
        const decisionOverrides = options.decisionOverrides instanceof Map ? options.decisionOverrides : new Map();
        const decisionLog = [];
        let decisionCounter = 0;
        const unverifiedSteps = [];
        let failureDiagnosis = null;
        // Set when a step was matched to an effect by its wording alone; checked at the next idle point
        let pendingPostcondition = null;
        let pendingCardEffect = null;
        const peekDecisionOverride = () => decisionOverrides.has(decisionCounter)
            ? { has: true, value: decisionOverrides.get(decisionCounter) }
            : { has: false, value: undefined };
        // codesOf(choice) lists the cards a choice involves, so the search can start from decisions that touched the
        // card a failure is about ("Dark Sanctuary is in the GY": which pick discarded it?)
        const recordDecision = (kind, defaultChoice, alternatives, { confident = false, describe = null, codesOf = null } = {}) => {
            const id = decisionCounter++;
            const overridden = decisionOverrides.has(id);
            const choice = overridden ? decisionOverrides.get(id) : defaultChoice;
            const alts = overridden ? [] : (alternatives || []);
            decisionLog.push({
                id,
                kind,
                step: stepIdx,
                choice,
                defaultChoice,
                overridden,
                confident,
                alternatives: alts,
                describe,
                choiceCodes: codesOf ? codesOf(choice) : [],
                alternativeCodes: codesOf ? alts.map(codesOf) : []
            });
            return choice;
        };
        const codeName = (code) => getCardByCode(code)?.name || String(code);
        // Cards each step names outright: full name, the part after " - ", or the combo's own spelling of it.
        // Pronouns ("set it") don't count, so a card the harness guessed never looks named by the writer.
        // Short names count too: "Foxy Tune" for Noh-P.U.N.K. Foxy Tune, "Sigma" for Mathmech Sigma. A name's tail
        // qualifies when it starts with a word no other combo card shares and is at least 5 characters long
        const nameWordFreq = new Map();
        for (const name of new Set([...nameMap.values()].map(e => (e.officialName || '').toLowerCase()))) {
            for (const w of new Set(name.split(/\s+/))) nameWordFreq.set(w, (nameWordFreq.get(w) || 0) + 1);
        }
        const nameVariants = new Map();
        for (const [name, entry] of nameMap.entries()) {
            const variants = nameVariants.get(entry.code) || new Set();
            variants.add(name);
            const tail = name.includes(' - ') ? name.split(' - ').pop() : null;
            if (tail && tail.length >= 5) variants.add(tail);
            const words = name.split(/\s+/);
            for (let k = 1; k < words.length; k++) {
                const suffix = words.slice(k).join(' ');
                if (suffix.length >= 5 && (nameWordFreq.get(words[k]) || 0) <= 1) variants.add(suffix);
            }
            // A distinctive single word anywhere: "Astellar" for Astellar of the White Forest
            for (const w of words) {
                const bare = w.replace(/[^a-z0-9-]/g, '');
                if (bare.length >= 5 && (nameWordFreq.get(w) || 0) <= 1) variants.add(bare);
            }
            nameVariants.set(entry.code, variants);
        }
        const stepNamedCodes = steps.map(st => {
            const t = cleanCardName(`${st.text || ''} ${st.featuredCard || ''}`).toLowerCase();
            const named = new Set();
            for (const [code, variants] of nameVariants) {
                if ([...variants].some(v => t.includes(v))) named.add(code);
            }
            return named;
        });
        const comboMentionedCodes = new Set(stepNamedCodes.flatMap(s => [...s]));
        // Is this card named by the step whose effect is resolving ("search for World of Spirits")?
        const isNamedInResolvingStep = (code) => {
            if (!code) return false;
            const resolving = new Set([currentActiveStepIdx, currentSolvingChainCard?.stepIdx, stepIdx - 1]);
            return [...resolving].some(s => s != null && s >= 0 && stepNamedCodes[s]?.has(code));
        };
        // Is a later step going to use this card? Then spending it on a cost now is the likely mistake
        const isNeededLater = (code) => Boolean(code) && stepNamedCodes.slice(stepIdx).some(named => named.has(code));
        // Picks from hand or field pay costs (discard, tribute); picks from Deck/GY/Extra/banished fetch what the step names
        const isCostSelection = (selects) => selects.every(c => [OcgLocation.HAND, OcgLocation.MZONE, OcgLocation.SZONE].includes(c.location));
        // Is this card named in the step being resolved or the next few steps? (a chosen card the text never names is a guess)
        const isMentionedNear = (code) => {
            if (!code) return false;
            const from = Math.max(0, Math.min(currentActiveStepIdx ?? stepIdx, stepIdx) - 1);
            for (let s = from; s < Math.min(steps.length, stepIdx + 4); s++) {
                if (stepNamedCodes[s]?.has(code)) return true;
            }
            return false;
        };
        // How many combo cards share each name word, so archetype words weigh less in fuzzy name matching
        const tokenFrequency = new Map();
        for (const code of new Set(resolved.map(c => c.code))) {
            for (const t of new Set(nameTokens(codeName(code)))) tokenFrequency.set(t, (tokenFrequency.get(t) || 0) + 1);
        }
        // Alternatives to a SELECT_CARD pick: swap one picked card for a different card (one per name and location).
        // Fetching (Deck/GY/Extra): a pick the resolving step names ("search for World of Spirits") may only become
        // another card that step names, so the search can't pass a line by fetching something else; any other pick
        // tries cards the text mentions first. Paying a cost (hand/field): any swap is fine, cards no step names first.
        const buildSelectAlternatives = (picked, selects) => {
            const cost = isCostSelection(selects);
            const key = (c) => `${c.code}:${c.location}`;
            const pickedKeys = new Set(picked.map(i => key(selects[i])));
            const seen = new Set();
            const pool = [];
            for (let i = 0; i < selects.length; i++) {
                const k = key(selects[i]);
                if (pickedKeys.has(k) || seen.has(k)) continue;
                seen.add(k);
                pool.push(i);
            }
            const mentioned = (i) => Number(comboMentionedCodes.has(selects[i].code));
            pool.sort((a, b) => cost ? mentioned(a) - mentioned(b) : mentioned(b) - mentioned(a));
            const positions = picked.map((_, p) => p)
                .sort((a, b) => Number(isMentionedNear(selects[picked[a]]?.code)) - Number(isMentionedNear(selects[picked[b]]?.code)));
            const alternatives = [];
            for (const p of positions) {
                const namedFetch = !cost && isNamedInResolvingStep(selects[picked[p]]?.code);
                for (const i of pool) {
                    if (namedFetch && !isNamedInResolvingStep(selects[i].code)) continue;
                    if (alternatives.length >= 6) return alternatives;
                    const alt = [...picked];
                    alt[p] = i;
                    alternatives.push(alt);
                }
            }
            return alternatives;
        };

        const LOCATION_LABELS = [
            [OcgLocation.HAND, 'hand'],
            [OcgLocation.MZONE, 'Monster Zone'],
            [OcgLocation.SZONE, 'Spell & Trap Zone'],
            [OcgLocation.GRAVE, 'GY'],
            [OcgLocation.REMOVED, 'banishment'],
            [OcgLocation.EXTRA, 'Extra Deck'],
            [OcgLocation.DECK, 'Deck']
        ];
        const locateCode = (code) => {
            for (const [location, label] of LOCATION_LABELS) {
                const cards = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location }) || [];
                if (cards.some(c => c && c.code === code)) return label;
            }
            return null;
        };
        // Why the engine offered nothing for a step: the card isn't where the step needs it (an earlier step never
        // fetched it, or it was already used), or it is there and the engine refused (materials, conditions, costs, OPT)
        // Does the step need this card already in hand/GY/field? ("Special Summon Blue-Eyes from hand", "discarding X")
        const stepNeedsCardInPlace = (code, stepText) => {
            const t = cleanCardName(stepText || '').toLowerCase();
            for (const v of (nameVariants.get(code) || [])) {
                const at = t.indexOf(v);
                if (at === -1) continue;
                const before = t.slice(Math.max(0, at - 35), at);
                const after = t.slice(at + v.length, at + v.length + 40);
                if (/^\s*(?:\([^)]*\)\s*)?(?:from|in) (?:your |the )?(?:hand|gy|graveyard|field|monster zone|pendulum zone)\b/.test(after)) return true;
                if (/(?:discard|tribut|reveal|detach|banish|equip)\w*\s+(?:the\s+|your\s+|a\s+)?$/.test(before) && !/^\s*from (?:your |the )?deck\b/.test(after)) return true;
            }
            return false;
        };
        const diagnoseUnofferedStep = ({ stepCodes, idleCodes, wantsExtraSummon, stepText = '', namedCodes = [] }) => {
            const isExtraCode = (c) => ((getCardByCode(c)?.type || 0) & 0x4802040) !== 0;
            const primary = (wantsExtraSummon ? stepCodes.find(isExtraCode) : null) ?? idleCodes[0] ?? stepCodes[0] ?? null;
            if (!primary) {
                return { kind: 'UNIDENTIFIED_STEP', detail: 'No card in this step could be identified.' };
            }
            const name = codeName(primary);
            if (unscriptedCodes.has(primary)) {
                return { kind: 'CARD_SCRIPT_MISSING', code: primary, detail: `The engine has no script for ${name}, so it has no effects to use.` };
            }
            const where = locateCode(primary);
            if (isExtraCode(primary)) {
                if (where === 'Extra Deck') {
                    return { kind: 'ENGINE_REJECTED', code: primary, location: where, detail: `${name} is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).` };
                }
                return { kind: 'CARD_NOT_AVAILABLE', code: primary, location: where, detail: `${name} is not in the Extra Deck any more (${where ? `it is in the ${where}` : 'already used'}).` };
            }
            if (!where || where === 'Deck') {
                return { kind: 'CARD_NOT_AVAILABLE', code: primary, location: where, detail: `${name} is still in the Deck: no earlier step added it to the hand or field.` };
            }
            // The acting card is in place, but a card the step uses from hand/GY never got there
            const missingPiece = namedCodes.find(c => c !== primary && !isExtraCode(c) && stepNeedsCardInPlace(c, stepText) &&
                ['Deck', null].includes(locateCode(c)));
            if (missingPiece) {
                return { kind: 'CARD_NOT_AVAILABLE', code: missingPiece, location: locateCode(missingPiece), detail: `${name} is in the ${where}, but ${codeName(missingPiece)}, which this step uses from the hand/GY, is still in the Deck: no earlier step added it.` };
            }
            return { kind: 'ENGINE_REJECTED', code: primary, location: where, detail: `${name} is in the ${where}, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).` };
        };

        // Score an ocgcore effect description (from cards.cdb str1..str16) against the current step text
        function scoreEffectDescAgainstStep(descText, stepText, isPendulumScaleStep, rawDescBigInt) {
            let score = 0;
            const d = (descText || '').toLowerCase();
            const st = (stepText || '').toLowerCase();
            const isScaleAction = rawDescBigInt != null && BigInt(rawDescBigInt) === 1160n;
            if (isPendulumScaleStep) {
                if (isScaleAction || /pendulum|scale/i.test(d)) score += 15;
            } else if (isScaleAction) {
                score -= 10;
            }
            if (!d) return score;
            if (/(?:search|add\b.*to\b.*hand|\badd\b)/i.test(st) && /(?:add|search|to your hand|to hand)/i.test(d)) score += 6;
            if (/(?:special summon|\bsummon(?:s|ing)?\b|\breviv(?:e|es|ing)\b)/i.test(st) && /(?:special summon|\bsummon\b)/i.test(d)) score += 6;
            if (/\b(?:send|dump|foolish|to (?:the )?(?:gy|graveyard))\b/i.test(st) && /(?:send|to the gy|to the graveyard|graveyard)/i.test(d)) score += 5;
            if (/\b(?:sends? itself|send this card to the gy)\b/i.test(st) && /send this card to the gy/i.test(d)) score += 8;
            if (/\bdestroy/i.test(st) && /\bdestroy/i.test(d)) score += 6;
            if (/\bbanish/i.test(st) && /\bbanish/i.test(d)) score += 6;
            if (/\bdraw/i.test(st) && /\bdraw/i.test(d)) score += 6;
            if (/\b(?:place|set|move to spell\/trap zone|spell\/trap zone)\b/i.test(st) && /\b(?:place|set)\b/i.test(d)) score += 8;
            if (/\britual summon/i.test(st) && /\britual/i.test(d)) score += 8;
            if (/\bfusion summon/i.test(st) && /\bfusion/i.test(d)) score += 8;
            if (/\b(?:increase|raise)\b.*\blevel/i.test(st) && /\bincrease\b/i.test(d)) score += 8;
            if (/\b(?:decrease|reduce|lower)\b.*\blevel/i.test(st) && /\b(?:decrease|reduce)\b/i.test(d)) score += 8;
            // "Special Summon it face-up on your field" vs "... face-down on your opponent's field" (Mimighoul Fairy)
            for (const side of ['face-up', 'face-down']) {
                if (st.includes(side)) score += d.includes(side) ? 6 : (d.includes(side === 'face-up' ? 'face-down' : 'face-up') ? -6 : 0);
            }
            if (/opponent'?s field/.test(d) && !/opponent/.test(st)) score -= 6;
            // Same place named on both sides: "summon Sharakusai from the deck" vs "Special Summon ... from the Deck"
            // rather than "Special Summon this card from your hand"
            for (const place of [/\bextra deck\b/i, /\bdeck\b/i, /\b(?:gy|graveyard)\b/i, /\bhand\b/i]) {
                if (place.test(st) && place.test(d)) {
                    score += 4;
                    break;
                }
            }

            // Match quoted card/archetype names and specific keywords between description and step text
            const quotedMatches = d.match(/"([^"]+)"/g);
            if (quotedMatches) {
                for (const q of quotedMatches) {
                    const cleanQ = q.replace(/"/g, '').toLowerCase();
                    if (cleanQ && cleanQ.length > 2 && st.includes(cleanQ)) {
                        score += 12;
                    }
                }
            }
            if (/\bpolymerization\b/i.test(d) && /\bpolymerization\b/i.test(st)) score += 12;
            return score;
        }

        while (loopCount++ < maxLoops) {
            const responsesBefore = responsesSet;
            const status = lib.duelProcess(duel);
            const msgs = lib.duelGetMessage(duel);
            if (options.debug) console.log(`[LOOP ${loopCount}] status=${status}, msgs=${msgs.length}`);

            for (const m of msgs) {
                const msgName = ocgMessageTypeStrings.get(m.type) || m.type;
                if (options.debug) console.log('ENGINE MSG:', m.type, msgName);
                if (options.debug && m.type >= 70 && m.type <= 76) {
                    console.log('[DEBUG CHAIN MSG]', m.type, JSON.stringify(m, (k, v) => typeof v === 'bigint' ? v.toString() : v));
                }

                if (m.type === 70) { // CHAINING
                    chainStack.set(m.chain_size, {
                        code: m.code,
                        controller: m.controller,
                        location: m.location,
                        sequence: m.sequence,
                        description: m.description,
                        stepIdx: currentActiveStepIdx
                    });
                    if (m.controller === 0 || m.controller == null) {
                        lastActorCode = m.code;
                        triggersFiredSinceLastIdle++;
                    }
                } else if (m.type === 72) { // CHAIN_SOLVING
                    currentSolvingChainCard = chainStack.get(m.chain_size) || null;
                } else if (m.type === 73) { // CHAIN_SOLVED
                    chainStack.delete(m.chain_size);
                    currentSolvingChainCard = null;
                } else if (m.type === 74) { // CHAIN_END
                    chainStack.clear();
                    currentSolvingChainCard = null;
                    while (stepIdx < steps.length && chainStepsConsumed.has(stepIdx)) {
                        stepIdx++;
                    }
                    chainStepsConsumed.clear();
                    skipRedundantVisualSteps();
                }

                if (m.type === 2) {
                    if (m.hint_type === 3 && m.hint) {
                        lastHintCardCode = Number(m.hint);
                    }
                    if (options.debug) console.log('[DEBUG HINT MSG]', JSON.stringify(m, (k, v) => typeof v === 'bigint' ? v.toString() : v));
                }
                if (m.type === 50) { // MOVE
                    const code = m.card;
                    if (pendingPostcondition && code) pendingPostcondition.moved.add(code);
                    if (options.debug) {
                        console.log('[MOVE CARD]', code, getCardByCode(code)?.name, 'from:', m.from, 'to:', m.to);
                    }
                    if (code && m.from && m.to) {
                        const fromZone = ocgLocPosToZone(m.from);
                        const toZone = ocgLocPosToZone(m.to);

                        if (m.to && (m.to.controller === 0 || m.to.controller == null)) {
                            if (m.to.location === OcgLocation.MZONE) {
                                if (code !== playerInvokedSummonCode) {
                                    cardsSummonedSinceLastIdle.add(code);
                                } else {
                                    playerInvokedSummonCode = null;
                                }
                            } else if (m.to.location === OcgLocation.SZONE) {
                                if (code !== playerInvokedSetCode) {
                                    cardsSetSinceLastIdle.add(code);
                                } else {
                                    playerInvokedSetCode = null;
                                }
                            } else if (m.to.location === OcgLocation.REMOVED) {
                                cardsBanishedSinceLastIdle.add(code);
                            } else if (m.to.location === OcgLocation.GRAVE) {
                                cardsSentToGYSinceLastIdle.add(code);
                            }
                        }

                        if (fromZone !== toZone) {
                            let targetCard = null;

                            // 0. Prefer a card specified in currentActiveStepIdx or nearby steps matching code and toZone/fromZone
                            const candidateStepIndices = [
                                currentActiveStepIdx,
                                stepIdx,
                                stepIdx - 1,
                                stepIdx + 1,
                                stepIdx + 2,
                                stepIdx + 3
                            ].filter(i => i != null && i >= 0 && i < steps.length);

                            for (const si of candidateStepIndices) {
                                const st = steps[si];
                                if (!st) continue;
                                const stepCardId = st.card || (st.actions && st.actions.find(a => a.card && idMap.get(a.card)?.code === code)?.card);
                                if (stepCardId && idMap.has(stepCardId)) {
                                    const c = idMap.get(stepCardId);
                                    if (c.code === code && (!st.to || st.to === toZone || cardZoneMap.get(c.id) === fromZone)) {
                                        targetCard = c;
                                        break;
                                    }
                                }
                            }

                            // Consume passive move steps that match this card move
                            for (const si of candidateStepIndices) {
                                if (chainStepsConsumed.has(si)) continue;
                                const st = steps[si];
                                if (!st) continue;
                                const stText = (st.text || '').toLowerCase();
                                const isPassiveMoveStep = /^(?:tribute|banish|move to (?:graveyard|gy|banish|hand)|send to (?:graveyard|gy|banish)|discard|add\s+[a-z0-9"',\s-]+?\s+to\s+(?:the\s+)?hand)\b/i.test(stText);
                                // The verb says where the card goes: Normal Summoning Clear Cube does not complete
                                // "Tribute Clear Cube to summon Clear Vicious Knight", even when it lands in that step's zone
                                const verbZones = /^(?:add|move to hand)\b/i.test(stText) ? ['zone-hand']
                                    : /^(?:banish|move to banish|send to banish)\b/i.test(stText) ? ['zone-banish']
                                    : ['zone-gy', 'zone-banish'];
                                if (isPassiveMoveStep && verbZones.includes(toZone)) {
                                    const stepCodes = findStepCardCodes(st, lastActorCode);
                                    if (stepCodes.includes(code)) {
                                        chainStepsConsumed.add(si);
                                        if (options.debug) console.log(`[MOVE CONSUMED STEP] si=${si} ("${st.text}") for code=${code}`);
                                        break;
                                    }
                                } else if (chainStack.size > 0 && (toZone.startsWith('zone-m') || toZone.startsWith('zone-em')) && /^(?:(?:special\s+|link\s+|synchro\s+|xyz\s+|fusion\s+)?summon\b|ss\b)/i.test(stText)) {
                                    let summonTargetCode = null;
                                    if (st.card && idMap.has(st.card)) {
                                        if (st.actions && st.actions.length > 0) {
                                            const act = st.actions.find(a => !a.isOverlay && (a.to?.startsWith('zone-m') || a.to?.startsWith('zone-em')));
                                            if (act?.card && idMap.has(act.card)) summonTargetCode = idMap.get(act.card).code;
                                        }
                                        if (!summonTargetCode) summonTargetCode = idMap.get(st.card).code;
                                    } else if (st.actions && st.actions.length > 0) {
                                        const act = st.actions.find(a => !a.isOverlay && (a.to?.startsWith('zone-m') || a.to?.startsWith('zone-em')));
                                        if (act?.card && idMap.has(act.card)) summonTargetCode = idMap.get(act.card).code;
                                    }
                                    if (!summonTargetCode) {
                                        const sm = (st.text || '').match(/^(?:then\s+)?(?:(?:special|fusion|synchro|xyz|link|ritual)?\s*summon\b|\bss\b)\s+(?:-\s*)?([A-Za-z0-9"',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+into\b|\s+as\b|\s+in\b|\s+on\b|,(?!\s*the\b)|\s+and\b|$)/i);
                                        if (sm) {
                                            const vc = matchFragmentCodes(sm[1]);
                                            if (vc.length > 0) summonTargetCode = vc[0];
                                        }
                                    }
                                    if (summonTargetCode === code && (!st.to || st.to === toZone)) {
                                        chainStepsConsumed.add(si);
                                        if (options.debug) console.log(`[MOVE CONSUMED SUMMON STEP] si=${si} ("${st.text}") for code=${code}`);
                                        break;
                                    }
                                }
                            }

                            // 1. Prefer card with matching code currently recorded in fromZone
                            if (!targetCard) {
                                for (const c of (combo.cards || [])) {
                                    if (c.code === code && cardZoneMap.get(c.id) === fromZone) {
                                        targetCard = c;
                                        break;
                                    }
                                }
                            }

                            // 2. If no card at fromZone, match any card with this code
                            if (!targetCard) {
                                for (const c of (combo.cards || [])) {
                                    if (c.code === code) {
                                        targetCard = c;
                                        break;
                                    }
                                }
                            }

                            // 3. If card doesn't exist in combo.cards at all, dynamically create it
                            if (!targetCard) {
                                const cData = getCardByCode(code);
                                const isExtra = cData && ((cData.type & 0x4802040) !== 0);
                                const prefix = isExtra ? 'extra' : 'card';
                                const newId = `${prefix}_${code}_${(combo.cards || []).length}`;
                                targetCard = {
                                    id: newId,
                                    name: cData?.name || `Card ${code}`,
                                    code,
                                    type: isExtra ? 'extra' : (((cData?.type || 0) & 1) ? 'monster' : 'spell'),
                                    zone: fromZone,
                                    data: cData
                                };
                                combo.cards.push(targetCard);
                            }

                            // Update tracked zone
                            if (options.debug && targetCard.code === 54207171) console.log('[MOVE cardZoneMap 54207171]', targetCard.id, 'from:', fromZone, 'to:', toZone);
                            cardZoneMap.set(targetCard.id, toZone);

                            // Record action for current active step
                            const sIdx = Math.min(Math.max(0, currentActiveStepIdx), steps.length - 1);
                            if (!stepActions[sIdx]) stepActions[sIdx] = [];
                            stepActions[sIdx].push({
                                card: targetCard.id,
                                to: toZone
                            });
                        }
                    }
                    continue;
                }

                // The opponent's own picks ("your opponent sends 2 monsters from their Extra Deck") never belong to a step
                if (m.player === 1 && (m.type === 15 || m.type === 26)) {
                    if (m.type === 15) {
                        lib.duelSetResponse(duel, { type: OcgResponseType.SELECT_CARD, indicies: Array.from({ length: m.min || 1 }, (_, i) => i) });
                    } else {
                        lib.duelSetResponse(duel, { type: OcgResponseType.SELECT_UNSELECT_CARD, index: m.can_finish ? null : 0 });
                    }
                    continue;
                }

                if (m.type === 11) { // SELECT_IDLECMD
                    if (m.player === 1) {
                        lib.duelSetResponse(duel, {
                            type: OcgResponseType.SELECT_IDLECMD,
                            action: SelectIdleCMDAction.TO_EP,
                            index: 0
                        });
                        continue;
                    }

                    // A step matched to some card's effect by wording alone ("Revive Spore" -> Kuribon's self-summon) is
                    // only done if that effect moved a card the step names; otherwise the step was not actually performed
                    if (pendingPostcondition) {
                        const pc = pendingPostcondition;
                        pendingPostcondition = null;
                        const pcReason = pc.targets.some(t => pc.moved.has(t))
                            ? null
                            : classifyUnsimulatedStep(pc.text, { hasCard: true, stepCodes: pc.targets, unscriptedCodes });
                        if (pcReason) {
                            // Vague or opponent-dependent wording ("...and a Tuner to summon Chaos Angel"): not simulated,
                            // and the effect that ran instead leaves later steps unverifiable
                            unverifiedSteps.push({ step: pc.stepIdx + 1, text: pc.text, reason: pcReason, taints: true });
                            log.push(`Step ${pc.stepIdx + 1}: Not simulated - ${UNSIMULATED_REASONS[pcReason]}`);
                        } else if (!pc.targets.some(t => pc.moved.has(t))) {
                            stepIdx = pc.stepIdx;
                            failureDiagnosis = diagnoseUnofferedStep({ stepCodes: pc.targets, idleCodes: pc.targets, wantsExtraSummon: false });
                            errors.push(`Step ${pc.stepIdx + 1} ("${pc.text}") was not offered as a legal action by the duel engine. The only effect matching its wording was ${codeName(pc.actor)}'s, and it did not move ${pc.targets.map(codeName).join(' or ')}. ${failureDiagnosis.detail || ''}`.trim());
                            break;
                        }
                    }

                    // "Activate Gate to search Kepler": activating a Continuous/Field Spell or Trap only puts it face-up;
                    // its search is a second activation, which belongs to the same step, not to the next one
                    if (pendingCardEffect) {
                        const pce = pendingCardEffect;
                        pendingCardEffect = null;
                        const handNow = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.HAND }) || [];
                        // No targets: the effect grants something (an extra Normal Summon); the engine only offers it while unused
                        const reached = pce.targets.length > 0 && pce.targets.some(t => handNow.some(h => h && h.code === t));
                        const effIdx = reached ? -1 : (m.activates || []).findIndex(a => a.code === pce.code && a.location !== OcgLocation.HAND);
                        if (effIdx !== -1) {
                            triggersFiredSinceLastIdle = 0;
                            cardsSelectedSinceLastIdle.clear();
                            currentActiveStepIdx = pce.stepIdx;
                            lastActorCode = pce.code;
                            lib.duelSetResponse(duel, { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_ACTIVATE, index: effIdx });
                            log.push(`Step ${pce.stepIdx + 1}: Legal Activation of ${codeName(pce.code)}'s effect (${pce.code})`);
                            continue;
                        }
                    }

                    // Auto-fire pending on-field ignition effect if the previous step summoned/placed a card with a "to <do X>" clause that hasn't resolved yet
                    if (
                        stepIdx > 0 &&
                        !autoFiredPrevStepIgnition &&
                        triggersFiredSinceLastIdle === 0 &&
                        cardsSelectedSinceLastIdle.size === 0 &&
                        lastActorCode &&
                        m.activates &&
                        m.activates.length > 0
                    ) {
                        const prevStepObj = steps[stepIdx - 1];
                        const prevText = cleanCardName(prevStepObj?.text || '');
                        const nextStepObj = steps[stepIdx];
                        const nextText = cleanCardName(nextStepObj?.text || '');
                        const prevHasPurposeClause = /(?:\bto\s+(?:search|add|special summon|summon|send|dump|foolish|set|place|equip|destroy|banish|draw|revive|tribute|copy|gain|increase|reduce)\b|,\s*(?:discard(?:ing)?|tribut(?:e|ing)|searching|adding|special summoning|summoning|sending|dumping|setting|placing|equipping|destroying|banishing|drawing)\b)/i.test(prevText);
                        const nextCodes = nextStepObj ? findStepCardCodes(nextStepObj, lastActorCode) : [];
                        const nextExplicitlyActivatesPrev = /^(?:activat(?:e|ing)|us(?:e|ing))\b/i.test(nextText.trim()) && nextCodes[0] === lastActorCode;
                        const fieldActIndices = [];
                        for (let i = 0; i < m.activates.length; i++) {
                            const a = m.activates[i];
                            if (
                                a.code === lastActorCode &&
                                (a.location === OcgLocation.MZONE || a.location === OcgLocation.SZONE || a.location === OcgLocation.FZONE) &&
                                !(a.description != null && BigInt(a.description) === 1160n)
                            ) {
                                fieldActIndices.push(i);
                            }
                        }
                        if (prevHasPurposeClause && !nextExplicitlyActivatesPrev && fieldActIndices.length > 0) {
                            let bestIdx = fieldActIndices[0];
                            let bestSc = -Infinity;
                            for (const idx of fieldActIndices) {
                                const sc = scoreEffectDescAgainstStep(getEffectDescription(m.activates[idx].description), prevText, false, m.activates[idx].description);
                                if (sc > bestSc) {
                                    bestSc = sc;
                                    bestIdx = idx;
                                }
                            }
                            autoFiredPrevStepIgnition = true;
                            currentActiveStepIdx = Math.max(0, stepIdx - 1);
                            lib.duelSetResponse(duel, {
                                type: OcgResponseType.SELECT_IDLECMD,
                                action: SelectIdleCMDAction.SELECT_ACTIVATE,
                                index: bestIdx
                            });
                            const actorName = getCardByCode(lastActorCode)?.name || lastActorCode;
                            log.push(`Auto-activating on-field effect of ${actorName} (${lastActorCode}) to complete Step ${stepIdx}`);
                            continue;
                        }
                    }

                    while (stepIdx < steps.length) {
                        skipRedundantVisualSteps();

                        if (stepIdx >= steps.length) {
                            break;
                        }

                        const currentStep = steps[stepIdx];
                        const rawStepText = cleanCardName(currentStep.text || '').replace(/^(?:action:\s*|step\s+\d+:\s*)+/i, '').trim();
                        const text = rawStepText.toLowerCase();

                        // Handle transition to opponent's turn ("On your opponent's turn..." / "During your opponent's Main Phase..." / "Your opponent's turn:...")
                        if (/^(?:(?:on|during|in)\s+)?(?:your |the )?opponent's (?:turn|main phase|standby phase|draw phase|battle phase|end phase)\b/i.test(rawStepText)) {
                            inOpponentTurn = true;
                            const strippedOppPrefix = rawStepText.replace(/^(?:(?:on|during|in)\s+)?(?:your |the )?opponent's (?:turn|main phase|standby phase|draw phase|battle phase|end phase)\s*(?:,\s*|:\s*|\.\s*|$)/i, '').trim();
                            if (!strippedOppPrefix) {
                                stepIdx++;
                                skipRedundantVisualSteps();
                            } else {
                                currentStep.text = strippedOppPrefix;
                            }
                            currentActiveStepIdx = stepIdx;
                            lib.duelSetResponse(duel, {
                                type: OcgResponseType.SELECT_IDLECMD,
                                action: SelectIdleCMDAction.TO_EP,
                                index: 0
                            });
                            log.push(`Passing turn to opponent for opponent-turn action`);
                            break;
                        }

                        // The opponent acting ("Opponent Normal Summons their combo starter") can't be replayed solo.
                        // Record it, so the hand-trap reaction that follows isn't reported as illegal on your own turn
                        if (options.lenient && /^(?:(?:then|now|next),?\s+)?(?:your |the )?opponent(?!'s\s+(?:turn|main phase|standby phase|draw phase|battle phase|end phase))\b/i.test(rawStepText)) {
                            unverifiedSteps.push({ step: stepIdx + 1, text: currentStep.text, reason: 'opponent-board', taints: true });
                            log.push(`Step ${stepIdx + 1}: Not simulated - ${UNSIMULATED_REASONS['opponent-board']}`);
                            stepIdx++;
                            skipRedundantVisualSteps();
                            continue;
                        }

                        // "Start by setting Geargiarmor, or summon Geargiarsenal": the write-up leaves the choice open, and
                        // later steps may follow either branch, so playing the first one would test a line nobody wrote
                        if (options.lenient && /^(?:start (?:by|with)\s+)?(?:normal summon|special summon|summon|set|activate|use|tribute)\w*\b[^,]{0,80},\s*or\s+(?:normal summon|special summon|summon|set|activate|use|tribute)\b/i.test(rawStepText)) {
                            unverifiedSteps.push({ step: stepIdx + 1, text: currentStep.text, reason: 'non-specific', taints: true });
                            log.push(`Step ${stepIdx + 1}: Not simulated - ${UNSIMULATED_REASONS['non-specific']}`);
                            stepIdx++;
                            skipRedundantVisualSteps();
                            continue;
                        }

                        const stepCodes = findStepCardCodes(currentStep, lastActorCode);
                        const prevActorHasIdleEffect =Boolean(lastActorCode && m.activates && m.activates.some(a => a.code === lastActorCode));
                        const stepActorHasIdleEffect = Boolean(m.activates && stepCodes.some(c => m.activates.some(a => a.code === c)));

                        // If this step describes a Chain Link or a trigger/search/on-activation effect that already resolved since the last IDLECMD, advance immediately
                        // "Guru's FLIP effect now activates", "Its effect triggers", "Sachi's effect then adds ..."
                        const isPossessiveTriggerDesc = /^(?:(?:(?:its|her|his|their|[a-z0-9'\s-]+?\s*'s)\s+(?:on-summon\s+|summon\s+|on-activation\s+|gy\s+|graveyard\s+|hand\s+|flip\s+|trigger\s+|pendulum\s+)?effect|(?:the\s+)?effect\s+of\s+[a-z0-9"',\s-]+?)\s+(?:then\s+|now\s+|immediately\s+|automatically\s+|also\s+|upon\s+its\s+summon\s+)?(?:activates|triggers|resolves|searches|adds|places|sets|sends|dumps|grants|allows|lets|special summons|summons|revives|continues|destroys|banishes|draws|equips|returns|recovers)\b)/i.test(rawStepText);
                        const isDeclarativeTriggerDesc = /^[A-Z][A-Za-z0-9"',\s-]+?\s+(?:then\s+|successfully\s+|immediately\s+|also\s+|automatically\s+)?(?:searches|adds|sends|dumps|places|sets|triggers|resolves|equips|attaches|draws|recovers|returns|recycles|grants|allows|lets|fuses|fusion\s+summons|special\s+summons|summons|revives|becomes\s+level|is\s+always\s+treated)\b/i.test(rawStepText) && !/\s*->\s*gy\b/i.test(rawStepText) && !(m.special_summons && m.special_summons.some(s => stepCodes.includes(s.code)));
                        // "Shinonome's effect adds Solo Activation" right after Shinonome summoned itself, "Palace adds
                        // Lapauila Mana" right after Palace was activated: the search is the card's other effect, still to
                        // activate, while the named card hasn't reached the hand and the card offers an effect now
                        const ownSearchStillToDo = Boolean(stepCodes[0] && stepCodes[0] === lastActorCode && (m.activates || []).some(a => a.code === stepCodes[0]) && (() => {
                            const so = (rawStepText.match(/\b(?:search(?:es|ing)?(?:\s+for)?|add(?:s|ing)?)\s+(.+?)(?:\s+(?:from|to|and|then|while)\b|[,.;]|$)/i) || [])[1];
                            const wanted = so ? matchFragmentCodes(so).filter(c => c !== stepCodes[0] && !((getCardByCode(c)?.type || 0) & 0x4802040)) : [];
                            if (wanted.length === 0) return false;
                            const hand = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.HAND }) || [];
                            return !wanted.some(c => cardsSelectedSinceLastIdle.has(c) || hand.some(h => h && h.code === c));
                        })());
                        const strippedCommentary = rawStepText.replace(/\s*\([^)]*\)/g, '').trim();
                        const isPassiveResolutionDesc =/\b(?:is|are|was|were)\s+(?:added|sent|special summoned|summoned|tributed|banished|placed|set|drawn|discarded|excavated|destroyed|shuffled(?: back)?|returned)\b/i.test(strippedCommentary);
                        const isOnSummonTriggerDesc = /^(?:activat(?:e|ing)\s+effect:\s*)?[A-Z][A-Za-z0-9"',\s-]+?\s+(?:was\s+(?:normal|special|tribute|flip|synchro|link|xyz|fusion)?\s*summoned|targets?\s+[A-Za-z0-9"',\s-]+?,\s*which\s+you\s+just\s+(?:special\s+)?summoned)\b/i.test(rawStepText);
                        const isTriggerActivationDesc = /^(?:activat(?:e|ing)\s+effect(?:\s+of)?\s+[A-Za-z0-9"',\s-]+|action:\s*activate\s+.*)$/i.test(rawStepText) && triggersFiredSinceLastIdle > 0 && lastActorCode && stepCodes.includes(lastActorCode) && !stepActorHasIdleEffect;
                        const isPureChainOrTriggerStep = /^(?:chain link \d|cl\d+\b|a (?:new )?chain forms|the chain resolves|build the chain|both (?:monsters )?trigger|this triggers|action:\s*activate .* \(on .* summon\)|on summon\b|when summoned\b|if summoned\b|its own on-activation effect\b|[^\s]+(?:'s)? summon trigger\b|her arrival turns on\b|his arrival turns on\b|its arrival turns on\b|(?:when|if|as)\s+[a-z0-9"',\s-]+?\s+(?:is|are)\s+(?:sent|cast|destroyed|tributed|banished|used|detached|summoned|discarded)\b|as [a-z0-9"'\s-]+? leaves the field)/i.test(rawStepText) ||
                            isTriggerActivationDesc ||
                            ((isPossessiveTriggerDesc || isDeclarativeTriggerDesc || isPassiveResolutionDesc || isOnSummonTriggerDesc) && (triggersFiredSinceLastIdle > 0 || cardsSelectedSinceLastIdle.size > 0 || !stepActorHasIdleEffect) &&
                                // "Sigma revives itself", "Rising Carp's effect summons Deer Note and Wa Gon": a card other than
                                // the one that just acted, with an effect matching the wording it can activate right now, is an
                                // action to take, not an effect that already resolved
                                // ("Servant is added from your Deck to your hand" about the card just picked is the
                                // resolution, even though the Servant has a hand effect of its own on offer)
                                !(stepCodes[0] && stepCodes[0] !== lastActorCode &&
                                    !(isPassiveResolutionDesc && cardsSelectedSinceLastIdle.has(stepCodes[0])) &&
                                    (m.activates || []).some(a =>
                                    a.code === stepCodes[0] && scoreEffectDescAgainstStep(getEffectDescription(a.description), rawStepText, false, a.description) > 0)) &&
                                // "Shinonome's effect adds Solo Activation" right after Shinonome summoned itself: the search is
                                // Shinonome's other effect, still to activate, when the named card hasn't reached the hand
                                !ownSearchStillToDo &&
                                // "Activating Reichphobia searches Reichheart" starts with the action itself
                                !(/^(?:activating|using)\s/i.test(rawStepText) && stepActorHasIdleEffect));

                        let explicitSummonCode = null;
                        if (currentStep.card && idMap.has(currentStep.card)) {
                            explicitSummonCode = idMap.get(currentStep.card).code;
                        } else if (currentStep.actions && currentStep.actions.length > 0) {
                            const mainAct = currentStep.actions.find(a => !a.isOverlay && a.to?.startsWith('zone-m'));
                            if (mainAct?.card && idMap.has(mainAct.card)) explicitSummonCode = idMap.get(mainAct.card).code;
                        }
                        const summonVerbMatch = rawStepText.match(/^(?:then\s+)?(?:(?:special|fusion|synchro|xyz|link|ritual)?\s*summon\b|\bss\b)\s+(?:-\s*)?([A-Za-z0-9"',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+into\b|\s+as\b|\s+in\b|\s+on\b|,(?!\s*the\b)|\s+and\b|$)/i);
                        const verbCodes = summonVerbMatch ? matchFragmentCodes(summonVerbMatch[1]) : [];
                        const candidateSummonCodes = explicitSummonCode ? [explicitSummonCode] : (verbCodes.length > 0 ? verbCodes : (stepCodes[0] ? [stepCodes[0]] : []));
                        const mzoneCardsNow = (candidateSummonCodes.length > 0 && /^(?:then\s+)?(?:(?:special|fusion|synchro|xyz|link|ritual)?\s*summon(?:s)?|\bss\b)/i.test(rawStepText))
                            ? (lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE }) || [])
                            : [];
                        const alreadySummonedSelfToField = Boolean(
                            candidateSummonCodes[0] &&
                            candidateSummonCodes[0] === lastActorCode &&
                            /^(?:then\s+)?(?:(?:special|fusion|synchro|xyz|link|ritual)?\s*summon\b|\bss\b)/i.test(rawStepText) &&
                            (!stepActorHasIdleEffect || !/^activat(?:e|ing)\b/i.test(rawStepText)) &&
                            !(m.special_summons && m.special_summons.some(s => s.code === candidateSummonCodes[0])) &&
                            mzoneCardsNow.some(mc => mc && mc.code === candidateSummonCodes[0])
                        );

                        const summonedTargetCode = candidateSummonCodes.find(c => cardsSummonedSinceLastIdle.has(c) && mzoneCardsNow.some(mc => mc && mc.code === c));
                        const alreadySummonedTargetToField = Boolean(
                            summonedTargetCode &&
                            /^(?:then\s+)?(?:(?:special|fusion|synchro|xyz|link|ritual)?\s*summon\b|\bss\b)/i.test(rawStepText) &&
                            (!stepActorHasIdleEffect || !/^activat(?:e|ing)\b/i.test(rawStepText)) &&
                            !(m.special_summons && m.special_summons.some(s => s.code === summonedTargetCode))
                        );

                        const setVerbMatch = rawStepText.match(/\bset\b\s+([A-Za-z0-9"'\s-]+?)(?:\s*\(|\s+from|\s+to|\.|$)/i);
                        const setCardCodes = setVerbMatch ? matchFragmentCodes(setVerbMatch[1]) : stepCodes;
                        const szoneCardsNow = (setCardCodes.length > 0 && /\bset\b/i.test(rawStepText))
                            ? (lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.SZONE }) || [])
                            : [];
                        const setTargetCode = setCardCodes.find(c => (cardsSetSinceLastIdle.has(c) || cardsSelectedSinceLastIdle.has(c)) && szoneCardsNow.some(sc => sc && sc.code === c));
                        const alreadySetTargetToField = Boolean(
                            setTargetCode &&
                            /\bset\b/i.test(rawStepText) &&
                            // A second copy still in hand ("Set the 2nd Fog Blade") can still be Set
                            ![...(m.spell_sets || []), ...(m.monster_sets || [])].some(s => s.code === setTargetCode)
                        );

                        const banishCardsNow = (stepCodes.length > 0 && /\bbanish\b/i.test(rawStepText))
                            ? (lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.REMOVED }) || [])
                            : [];
                        const alreadyBanishedTarget = Boolean(
                            stepCodes.length > 0 &&
                            /\bbanish\b/i.test(rawStepText) &&
                            !stepActorHasIdleEffect &&
                            stepCodes.some(c => cardsBanishedSinceLastIdle.has(c) || banishCardsNow.some(bc => bc && bc.code === c))
                        );

                        const gyCardsNow = (stepCodes.length > 0 && /\b(?:send|dump|discard|tribute)\b.*(?:to (?:the |your )?(?:gy|graveyard)|(?:cost|effect)\))/i.test(rawStepText))
                            ? (lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.GRAVE }) || [])
                            : [];
                        const alreadySentTargetToGY = Boolean(
                            stepCodes.length > 0 &&
                            /\b(?:send|dump|discard|tribute)\b.*(?:to (?:the |your )?(?:gy|graveyard)|(?:cost|effect)\))/i.test(rawStepText) &&
                            !stepActorHasIdleEffect &&
                            stepCodes.some(c => cardsSentToGYSinceLastIdle.has(c) || gyCardsNow.some(gc => gc && gc.code === c))
                        );

                        const szoneOrFzoneCardsNow = (stepCodes.length > 0 && /\b(?:activate|place)\b.*from (?:the |your )?deck/i.test(rawStepText))
                            ? [
                                ...(lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.SZONE }) || []),
                                ...(lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.FZONE }) || [])
                              ]
                            : [];
                        const alreadyPlacedOnField = Boolean(
                            stepCodes.length > 0 &&
                            /\b(?:activate|place)\b.*from (?:the |your )?deck/i.test(rawStepText) &&
                            !stepActorHasIdleEffect &&
                            stepCodes.some(c => szoneOrFzoneCardsNow.some(sc => sc && sc.code === c))
                        );

                        // "search/add X" is only already resolved if X actually reached the hand: another trigger resolving
                        // in between (a Field Spell's mandatory effect...) must not make the search look done
                        // Only what follows the search verb is the target ("Special Summon Sigma ..., searching Superfactorial")
                        const searchObjectText = (rawStepText.match(/\b(?:search(?:es|ing)?(?:\s+for)?|add(?:s|ing)?)\s+(.+?)(?:\s+(?:from|to|and|then|while)\b|[,.;]|$)/i) || [])[1] || '';
                        const namedSearchTargets = searchObjectText
                            ? matchFragmentCodes(searchObjectText).filter(c => c !== lastActorCode && !(((getCardByCode(c)?.type || 0) & 0x4802040) !== 0))
                            : [];
                        const handCardsNow = namedSearchTargets.length > 0
                            ? (lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.HAND }) || [])
                            : [];
                        const namedSearchTargetMissing = namedSearchTargets.length > 0 &&
                            !namedSearchTargets.some(c => cardsSelectedSinceLastIdle.has(c) || handCardsNow.some(h => h && h.code === c));

                        const actorOffersMatchingEffect = Boolean(stepActorHasIdleEffect && stepCodes.length > 0 &&
                            /^activat(?:e|ing)\b/i.test(rawStepText) &&
                            (m.activates || []).some(a => a.code === stepCodes[0] &&
                                scoreEffectDescAgainstStep(getEffectDescription(a.description), rawStepText, false, a.description) > 0));
                        const isAlreadyResolvedSearchOrSet = !namedSearchTargetMissing && (alreadySummonedSelfToField ||
                            alreadySummonedTargetToField ||
                            alreadySetTargetToField ||
                            alreadyBanishedTarget ||
                            alreadySentTargetToGY ||
                            alreadyPlacedOnField ||
                            (!stepActorHasIdleEffect && /effect\s+to\s+use\s+(?:it|itself)\s+as\s+(?:synchro\s+|link\s+)?material\s+from\s+(?:your\s+)?hand/i.test(rawStepText)) ||
                            (!stepActorHasIdleEffect && !prevActorHasIdleEffect && /^(?:activat(?:e|ing)|us(?:e|ing)) (?:its|her|his|the|[a-z0-9'\s-]+?'s) effect (?:to gain|for) an (?:additional|extra) normal summon/i.test(rawStepText)) ||
                            // "Activate Maximus's effect to send ..." right after Maximus summoned itself: the cost picked then
                            // doesn't mean this step happened while Maximus still offers an effect that matches it
                            (!actorOffersMatchingEffect && (triggersFiredSinceLastIdle > 0 || cardsSelectedSinceLastIdle.size > 0) && (
                                /^(?:(?:activat(?:e|ing)|us(?:e|ing)|finish(?:ing)?) (?:its|her|his|the|[a-z0-9'\s-]+?'s) (?:on-summon |summon |on-activation )?effect (?:to|by) (?:search|add|set|send|dump|discard)\b|as part of the effect,\s*send\b|discard\b|shuffle\b.*back|search\b|add\b.*to (?:your )?hand|add\b.*off the rider|put\b.*back on top|place\b.*on (?:top|bottom)|target\b.*to become level \d+|attaches your\b)/i.test(rawStepText) ||
                                (!stepActorHasIdleEffect && /(?:then,?\s+)?set\b.*(?:from (?:the |your )?(?:deck|gy|graveyard)|\(.*effect\)|\bvia\b|\beffect\b)/i.test(rawStepText)) ||
                                (!prevActorHasIdleEffect && /^(?:activat(?:e|ing)|us(?:e|ing)) (?:its|her|his|the) (?:on-summon |summon |on-activation )?effect to (?:place|special summon|summon|revive|gain|equip|target|increase|return|recover)\b/i.test(rawStepText)) ||
                                (/(?:special summons?|summons) (?:itself|himself|herself)\b/i.test(rawStepText) && !stepActorHasIdleEffect && !(m.special_summons && m.special_summons.some(s => stepCodes.includes(s.code)))) ||
                                (/^special summon\b.*from (?:the |your )?deck\b.*whose levels equal/i.test(rawStepText) && !stepActorHasIdleEffect) ||
                                (/^(?:use the (?:extra|additional) summon to )?normal summon\b/i.test(rawStepText) && stepCodes.length > 0 && cardsSelectedSinceLastIdle.has(stepCodes[0]) && !(m.summons && m.summons.some(s => s.code === stepCodes[0])))
                            )));
                        const upcomingSubsequentSteps = steps.slice(stepIdx + 1, stepIdx + 4);
                        const relevantUpcomingSteps = upcomingSubsequentSteps.filter(st => {
                            const rawSt = cleanCardName(st.text || '');
                            return /^(?:move to (?:graveyard|gy|hand)|(?:special\s+|normal\s+)?summon\b)/i.test(rawSt);
                        });
                        const isNextStepAlreadyCompleted = relevantUpcomingSteps.length > 0 && relevantUpcomingSteps.every(st => {
                            const rawSt = cleanCardName(st.text || '');
                            const codes = findStepCardCodes(st, lastActorCode);
                            if (/^move to (?:graveyard|gy)\b/i.test(rawSt)) {
                                const gy = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.GRAVE }) || [];
                                return codes.some(c => gy.some(gc => gc && gc.code === c));
                            }
                            if (/^move to hand\b/i.test(rawSt)) {
                                const hand = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.HAND }) || [];
                                return codes.some(c => hand.some(hc => hc && hc.code === c));
                            }
                            if (/(?:special\s+|normal\s+)?summon\b/i.test(rawSt)) {
                                const mzone = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE }) || [];
                                return codes.some(c => mzone.some(mc => mc && mc.code === c));
                            }
                            return true;
                        });

                        const isRedundantPostTriggerActivation = !stepActorHasIdleEffect &&
                            Boolean(lastActorCode && stepCodes.includes(lastActorCode)) &&
                            isNextStepAlreadyCompleted &&
                            /^activat(?:e|ing) effect\b/i.test(rawStepText) &&
                            (triggersFiredSinceLastIdle > 0 || cardsSelectedSinceLastIdle.size > 0);

                        const nextStep = steps[stepIdx + 1];
                        const nextCodes = nextStep ? findStepCardCodes(nextStep, lastActorCode) : [];
                        const nextActorHasIdleCommand = Boolean(
                            nextStep && (
                                (m.activates && nextCodes.some(c => m.activates.some(a => a.code === c))) ||
                                (m.special_summons && nextCodes.some(c => m.special_summons.some(s => s.code === c))) ||
                                (m.summons && nextCodes.some(c => m.summons.some(s => s.code === c)))
                            )
                        );
                        const isUnexecutableActivationPhantom = !stepActorHasIdleEffect &&
                            (!currentStep.actions || currentStep.actions.length === 0) &&
                            /^activat(?:e|ing)\b/i.test(rawStepText) &&
                            !(m.special_summons && m.special_summons.some(s => stepCodes.includes(s.code))) &&
                            !(m.summons && m.summons.some(s => stepCodes.includes(s.code))) &&
                            nextActorHasIdleCommand;

                        const isPreSummonMaterialStep = /\bas material (?:for|to)\b/i.test(rawStepText) && nextActorHasIdleCommand;

                        if (isPureChainOrTriggerStep || isAlreadyResolvedSearchOrSet || isRedundantPostTriggerActivation || isUnexecutableActivationPhantom || isPreSummonMaterialStep) {
                            if (options.debug) console.log(`[SKIPPED IN IDLE] stepIdx=${stepIdx} ("${rawStepText}") isPure=${isPureChainOrTriggerStep} isAlreadyResolved=${isAlreadyResolvedSearchOrSet} (self=${alreadySummonedSelfToField} target=${alreadySummonedTargetToField} set=${alreadySetTargetToField} banish=${alreadyBanishedTarget} gy=${alreadySentTargetToGY} placed=${alreadyPlacedOnField} candidates=${JSON.stringify(candidateSummonCodes)} lastActor=${lastActorCode}) isPhantom=${isUnexecutableActivationPhantom} isMaterial=${isPreSummonMaterialStep} stepCodes=${JSON.stringify(stepCodes)} stepActorHasIdleEffect=${stepActorHasIdleEffect}`);
                            stepIdx++;
                            autoFiredPrevStepIgnition = false;
                            skipRedundantVisualSteps();
                            continue;
                        }

                        // Strip search/add/set/discard/tribute/summon target clauses when identifying the actor card to summon/activate in IDLECMD
                        let actorText = rawStepText
                            // "With Eset and Su in your hand, Normal Summon Eset": the setup clause names cards that don't act yet
                            .replace(/^with\b.{0,160}?\bin (?:your )?hand,\s*/i, '')
                            .replace(/(?:,\s*|\s+by\s+|\s+and\s+)?discard(?:ing)?\s+[A-Za-z0-9"'\s()-]+?(?=\s+to\b|,|\.|$)/gi, '')
                            .replace(/,\s*tributing\s+[A-Za-z0-9"'\s()-]+?(?=\s+to\b|,|\.|$)/gi, '')
                            .replace(/,\s*(?:adding|searching|sending|dumping|setting|placing|special summoning|summoning|reviving|drawing|banishing|destroying)\b.*$/i, '')
                            .replace(/\bsends?\s+[A-Za-z0-9"'\s-]+?\s+from\s+(?:the\s+|your\s+)?deck\b.*$/i, '')
                            .replace(/\bto\s+(?:search|add|send|dump|foolish|bury|set|place|put|draw|destroy)\b.*$/i, '');
                        if (/^(?:activat(?:e|ing)|normal summon(?:ing)?|tribute summon(?:ing)?|discard(?:ing)?|banish(?:ing)?|tribut(?:e|ing))\b/i.test(actorText) || (/^us(?:e|ing)\b/i.test(actorText) && !/\bto\s+(?:link|synchro|xyz|pendulum|contact|make\s+a)\b/i.test(actorText))) {
                            actorText = actorText.replace(/\bto\s+(?:special summon|fusion summon|ritual summon|summon|revive|equip|banish|target|gain|boost|create|make|lock)\b.*$/i, '');
                        }
                        const actorOnlyCodes = findStepCardCodes({ ...currentStep, text: actorText, featuredCard: null }, lastActorCode);
                        const idleCodes = actorOnlyCodes.length > 0 ? actorOnlyCodes : stepCodes;

                        // Card names don't count: "The Phantom Knights of Torn Scales" is not a Pendulum Scale
                        const textWithoutNames = stepCodes.reduce((t, c) => {
                            const n = getCardByCode(c)?.name;
                            return n ? t.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ') : t;
                        }, text);
                        const isPendulumScaleStep = (/\b(?:pendulum zones?|scales?)\b/i.test(textWithoutNames) ||
                            ((currentStep?.to === 'zone-s1' || currentStep?.to === 'zone-s5' || currentStep?.actions?.some(a => a.to === 'zone-s1' || a.to === 'zone-s5')) &&
                             idleCodes.some(c => (getCardByCode(c)?.type & 0x1000000) !== 0))) &&
                            !/\b(?:destroy|target|bounce|return)\b.*\b(?:pendulum zones?|scales?)\b/i.test(text);
                        const startsWithExplicitActivate = /^activat(?:e|ing)\b/i.test(rawStepText) || (/^us(?:e|ing)\b/i.test(rawStepText) && !/\b(?:to|and)\s+(?:link|synchro|xyz|pendulum|overlay|tune|contact|make|summon\s+(?:number|a\s+link|a\s+rank|a\s+synchro|an\s+xyz))\b/i.test(rawStepText) && !/^use\s+(?:both|the\s+two|two|2|your\s+remaining|these|them)\b/i.test(rawStepText) &&
                            // "Using Rciela and Astellar, Synchro Summon Diabell" names materials, then summons
                            !SUMMON_COMMAND_STEP_RE.test(rawStepText.replace(LEADING_CLAUSE_RE, '')));
                        const hasExtraDeckSummonTarget = Boolean(
                            !startsWithExplicitActivate &&
                            idleCodes.length > 0 &&
                            m.special_summons &&
                            m.special_summons.some(s => s.code === idleCodes[0] && s.location === OcgLocation.EXTRA) &&
                            !/\b(?:reveal|send|dump|banish)\b.*\bextra deck\b/i.test(text)
                        );
                        const isExtraOrProcSummon = !startsWithExplicitActivate && (hasExtraDeckSummonTarget || /(?:link summon|synchro summon|xyz summon|fusion summon|pendulum summon|rank-up into|\boverlay\b|\btune\b.*\b(?:into|for)\b|contact fuse|contact fusion|\blink\b.*\b(?:into|for|away|climb|summon|make|->|→)|^link\s+(?:both|the|your|two|2|them|these)\b)/i.test(text));
                        // "Tribute Clear Cube to summon Clear Vicious Knight" is a Tribute Summon; "... to Special Summon ..." is not
                        const hasNormalSummonVerb = /\b(?:normal summon|tribute summon|tribute .* for|tribut(?:e|ing)\b.*\bto summon)\b/i.test(text) && !/\b(?:cannot|can't|do not|don't|without|instead of)\s+(?:normal|tribute) summon/i.test(text) && !/^(?:after|when|once|if)\s+(?:you\s+)?(?:normal|tribute) summon/i.test(text);
                        const isNormalSummon = (hasNormalSummonVerb || (/^summon\b/i.test(text) && !/special summon/i.test(text))) && !isExtraOrProcSummon;
                        const isSpSummon = isExtraOrProcSummon || /(?:special summon|\bsummons?\b|\brevives?\b|\bmake\b|\bclimb\b)/i.test(text);
                        const isExplicitEffectActivation = startsWithExplicitActivate || ((/(?:^tribut(?:e|ing)\b|^reveal(?:ing)?\b|^discard(?:ing)?\b|^banish(?:ing)?\b|^send(?:ing)?\b|\beffect\b)/i.test(rawStepText) && !isExtraOrProcSummon)) || isPendulumScaleStep || (/\bset\b.*(?:\(.*effect\)|\bvia\b|\beffect\b)/i.test(rawStepText) && stepActorHasIdleEffect);
                        const isActivate = (isExplicitEffectActivation || /(?:activat(?:e|ing)|us(?:e|ing)|search|add .* to hand|look at the top|sends? .* (?:from|to) (?:the |your )?(?:deck|gy|graveyard)|\s->\s*gy\b|\bdumps?\b|\bstacks?\b|\brevives?\b|\britual summon|\bcycle\b.*back to hand|\breturn\b.*to hand)/i.test(text)) && !isPassiveResolutionDesc || ownSearchStillToDo;
                        const isSet = /\bset(?:ting)?\b/i.test(text) && !/from (?:the |your )?(?:deck|gy|graveyard)/i.test(text) && !isPendulumScaleStep && !(stepActorHasIdleEffect && /\b(?:effect|via)\b/i.test(text));

                        let acted = false;
                        if (options.debug) {
                            const safeJson = (val) => JSON.stringify(val, (k, v) => typeof v === 'bigint' ? v.toString() : v);
                            console.log(`[DEBUG IDLECMD] Step ${stepIdx + 1}: idleCodes=${JSON.stringify(idleCodes)}, stepCodes=${JSON.stringify(stepCodes)}, summons=${JSON.stringify((m.summons || []).map(s => s.code))}, sets=${JSON.stringify((m.monster_sets || []).map(s => s.code))}, spSummons=${safeJson(m.special_summons)}, activates=${safeJson(m.activates)}`);
                        }
                        // "During your End Phase, activate Tarotrei's effect ...": go to the End Phase first, so an effect
                        // the same card could use in the Main Phase isn't taken in its place
                        if (!inEndPhase && /^(?:then,?\s+)?during (?:the |your )?end phase\b/i.test(rawStepText)) {
                            inEndPhase = true;
                            currentActiveStepIdx = stepIdx;
                            lib.duelSetResponse(duel, {
                                type: OcgResponseType.SELECT_IDLECMD,
                                action: SelectIdleCMDAction.TO_EP,
                                index: 0
                            });
                            log.push(`Step ${stepIdx + 1}: Moving to the End Phase`);
                            break;
                        }

                        // Helper to try Special Summon from m.special_summons
                        const trySpecialSummon = () => {
                            if (!isSpSummon || !m.special_summons || m.special_summons.length === 0) return false;
                            // "Link Summon Raging Phoenix using Sunlight Wolf, Balelynx and Jack Jaguar": when Raging Phoenix
                            // isn't summonable, Sunlight Wolf (a material) must not be summoned in its place
                            const usingAt = isExtraOrProcSummon ? rawStepText.search(/\s(?:using|with)\s/i) : -1;
                            const namedTargets = usingAt > 0 ? findStepCardCodes({ text: rawStepText.slice(0, usingAt) }, null) : [];
                            const isMaterialOnly = (code) => namedTargets.length > 0 && !namedTargets.includes(code);
                            let sIdx = -1;
                            // "Activate Aromaseraphy Jasmine's effect, Tributing ..." uses the Jasmine on the field: when
                            // that effect isn't on offer, Link Summoning a second Jasmine is not what the step says
                            const isEffectOfActor = startsWithExplicitActivate && /'s\s+effect\b/i.test(rawStepText);
                            for (const code of idleCodes) {
                                if (isMaterialOnly(code)) continue;
                                sIdx = m.special_summons.findIndex(c => c.code === code && !(isEffectOfActor && c.location === OcgLocation.EXTRA));
                                if (sIdx !== -1) break;
                            }
                            // "Activate Jack Jaguar's effect ... to the zone Sunlight Wolf points to" summons Jack Jaguar
                            // through its effect; it never asks to Link Summon another Sunlight Wolf
                            if (sIdx === -1 && !startsWithExplicitActivate) {
                                for (const code of stepCodes) {
                                    if (isMaterialOnly(code)) continue;
                                    sIdx = m.special_summons.findIndex(c => c.code === code);
                                    if (sIdx !== -1) break;
                                }
                            }
                            // "Pendulum Summon Kyubi and Yata": the engine offers it as a summon from the scale in the Pendulum Zone
                            const isPendulumSummon = sIdx === -1 && /\bpendulum summon/i.test(text);
                            if (isPendulumSummon) sIdx = m.special_summons.findIndex(c => c.location === OcgLocation.SZONE);
                            // "summon any Rank 4 Xyz" asks for any monster; "in a Main Monster Zone" does not
                            if (sIdx === -1 && isExtraOrProcSummon && (!stepCodes.some(c => ((getCardByCode(c)?.type || 0) & 0x4802040) !== 0) || /\b(?:any|a|an|1)\s+[a-z0-9"'\s-]+\s+(?:monster|link|synchro|xyz|fusion)\b(?!\s+zones?\b)/i.test(text))) {
                                sIdx = m.special_summons.findIndex(c => c.location === OcgLocation.EXTRA);
                            }
                            if (sIdx === -1 && (stepCodes.length === 0 || /\bsummon\s+(?:any|a|an|1)\b/i.test(text))) sIdx = 0;
                            if (sIdx !== -1) {
                                lastActorCode = m.special_summons[sIdx].code;
                                playerInvokedSummonCode = m.special_summons[sIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                cardsSummonedSinceLastIdle.clear();
                                cardsSetSinceLastIdle.clear();
                                cardsBanishedSinceLastIdle.clear();
                                cardsSentToGYSinceLastIdle.clear();
                                autoFiredPrevStepIgnition = false;
                                currentActiveStepIdx = stepIdx;
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_SPECIAL_SUMMON,
                                    index: sIdx
                                });
                                const spCode = m.special_summons[sIdx].code;
                                const spName = getCardByCode(spCode)?.name || spCode;
                                log.push(isPendulumSummon && sIdx !== -1
                                    ? `Step ${stepIdx + 1}: Legal Pendulum Summon using the scale of ${spName} (${spCode})`
                                    : `Step ${stepIdx + 1}: Legal Special Summon of ${spName} (${spCode})`);
                                stepIdx++;
                                skipRedundantVisualSteps();
                                return true;
                            }
                            return false;
                        };

                        // Helper to try Activation from m.activates (with multi-effect description disambiguation)
                        const tryActivate = () => {
                            if (!(isActivate || isSpSummon) || !m.activates || m.activates.length === 0) return false;
                            let aIdx = -1;
                            const selectBestActivateIndexForCode = (code) => {
                                const matchingIndices = [];
                                for (let i = 0; i < m.activates.length; i++) {
                                    if (m.activates[i].code === code) matchingIndices.push(i);
                                }
                                if (matchingIndices.length === 0) return -1;
                                if (matchingIndices.length === 1) return matchingIndices[0];
                                let bestIdx = matchingIndices[0];
                                let bestScore = -Infinity;
                                let desiredLoc = null;
                                if (/\b(?:from\s+(?:the\s+|your\s+)?(?:gy|graveyard)|in\s+(?:the\s+|your\s+)?(?:gy|graveyard))\b/i.test(rawStepText)) {
                                    desiredLoc = OcgLocation.GRAVE;
                                } else if (/\b(?:from\s+(?:the\s+|your\s+)?(?:hand)|in\s+(?:the\s+|your\s+)?(?:hand))\b/i.test(rawStepText) || /^(?:zone-s|zone-field)/i.test(currentStep?.to || '')) {
                                    desiredLoc = OcgLocation.HAND;
                                } else if (currentStep?.card && cardZoneMap.has(currentStep.card)) {
                                    desiredLoc = zoneToOcgLocation(cardZoneMap.get(currentStep.card));
                                }

                                for (const idx of matchingIndices) {
                                    const entry = m.activates[idx];
                                    const descStr = getEffectDescription(entry.description);
                                    const descScore = scoreEffectDescAgainstStep(descStr, rawStepText, isPendulumScaleStep, entry.description);
                                    let sc = descScore;
                                    if (desiredLoc != null) {
                                        if (entry.location === desiredLoc) sc += 50;
                                        else sc -= 50;
                                    }
                                    if (descScore === 0 && steps && stepIdx < steps.length) {
                                        const nextSteps = steps.slice(stepIdx + 1, stepIdx + 4);
                                        const upcomingTexts = nextSteps.map(s => s.text || '').join(' ');
                                        let upSc = scoreEffectDescAgainstStep(descStr, upcomingTexts, false, entry.description);
                                        if (/destroy|field spell/i.test(descStr)) {
                                            const hasFieldMention = nextSteps.some(s => {
                                                const t = (s.text || '').toLowerCase();
                                                const c = s.card && idMap.get(s.card);
                                                const cardType = c ? (c.data?.type || getCardByCode(c.code)?.type || 0) : 0;
                                                return /field/i.test(t) || s.to === 'zone-field' || (cardType & 0x80000) !== 0;
                                            });
                                            if (hasFieldMention) upSc += 15;
                                        }
                                        sc += upSc;
                                    }
                                    if (sc > bestScore) {
                                        bestScore = sc;
                                        bestIdx = idx;
                                    }
                                }
                                return bestIdx;
                            };

                            for (const code of idleCodes) {
                                aIdx = selectBestActivateIndexForCode(code);
                                if (aIdx !== -1) break;
                            }
                            if (aIdx === -1) {
                                for (const code of stepCodes) {
                                    aIdx = selectBestActivateIndexForCode(code);
                                    if (aIdx !== -1) break;
                                }
                            }
                            if (aIdx === -1 && /\bfield spell\b/i.test(text)) {
                                aIdx = m.activates.findIndex(c => c.location === OcgLocation.FZONE || (c.location === OcgLocation.SZONE && c.sequence === 5) || ((getCardByCode(c.code)?.type || 0) & 0x80000) !== 0);
                            }
                            if (aIdx === -1 && /\britual spell\b/i.test(text)) {
                                aIdx = m.activates.findIndex(c => ((getCardByCode(c.code)?.type || 0) & 0x82) === 0x82);
                            }
                            // "Ritual Summon Demise, Supreme King of Armageddon" without naming the Spell: the Ritual Monster's
                            // own text names it ("You can Ritual Summon this card with "Cycle of the World"")
                            if (aIdx === -1 && /\britual summon/i.test(text)) {
                                const ritualSpells = m.activates.map((c, i) => ({ c, i }))
                                    .filter(({ c }) => ((getCardByCode(c.code)?.type || 0) & 0x82) === 0x82);
                                const monsterTexts = stepCodes.map(c => getCardText(c)).join(' ');
                                const named = ritualSpells.find(({ c }) => monsterTexts.includes(`"${codeName(c.code)}"`));
                                if (named || ritualSpells.length === 1) aIdx = (named || ritualSpells[0]).i;
                            }
                            if (aIdx === -1 && isPendulumScaleStep) {
                                aIdx = m.activates.findIndex(c => c.description != null && BigInt(c.description) === 1160n);
                            }
                            let guessedByDescription = false;
                            if (aIdx === -1) {
                                let bestIdx = -1;
                                let bestSc = -Infinity;
                                const scored = [];
                                for (let i = 0; i < m.activates.length; i++) {
                                    const desc = getEffectDescription(m.activates[i].description);
                                    const sc = scoreEffectDescAgainstStep(desc, rawStepText, false, m.activates[i].description);
                                    if (sc > 0) scored.push({ i, sc });
                                    if (sc > bestSc && sc > 0) {
                                        bestSc = sc;
                                        bestIdx = i;
                                    }
                                }
                                if (bestIdx !== -1) {
                                    aIdx = bestIdx;
                                    if (options.lenient && stepCodes.length > 0) {
                                        // No named card had an action, so this is a guess from effect wording alone: try the
                                        // next-best wording matches too, and check afterwards that it moved a card the step names
                                        guessedByDescription = true;
                                        const acts = m.activates;
                                        const others = scored.filter(s => s.i !== bestIdx && acts[s.i].code !== acts[bestIdx].code)
                                            .sort((a, b) => b.sc - a.sc)
                                            .map(s => s.i)
                                            .slice(0, 3);
                                        aIdx = recordDecision('ACTIVATE_GUESS', aIdx, others, {
                                            describe: (i) => `${codeName(acts[i].code)}: ${getEffectDescription(acts[i].description) || 'effect'}`,
                                            codesOf: (i) => [acts[i].code]
                                        });
                                    }
                                }
                            }
                            if (aIdx === -1 && (stepCodes.length === 0 || /\b(?:any|a|an)\s+[a-z0-9"'\s-]+\s+(?:card|monster|spell|trap|effect)\b/i.test(text))) aIdx = 0;
                            if (aIdx !== -1) {
                                // Other effects of the same card (hand vs field vs GY, scale vs monster effect) are alternatives
                                const chosenAct = m.activates[aIdx];
                                const effectAlternatives = [];
                                for (let i = 0; i < m.activates.length; i++) {
                                    const a = m.activates[i];
                                    if (i !== aIdx && a.code === chosenAct.code && (a.description !== chosenAct.description || a.location !== chosenAct.location)) {
                                        effectAlternatives.push(i);
                                    }
                                }
                                if (effectAlternatives.length > 0) {
                                    const acts = m.activates;
                                    aIdx = recordDecision('ACTIVATE_EFFECT', aIdx, effectAlternatives.slice(0, 3), {
                                        describe: (i) => `${codeName(acts[i].code)}: ${getEffectDescription(acts[i].description) || 'effect'}`,
                                        codesOf: (i) => [acts[i].code]
                                    });
                                }
                            }
                            if (aIdx !== -1) {
                                lastActorCode = m.activates[aIdx].code;
                                playerInvokedSetCode = m.activates[aIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                cardsSummonedSinceLastIdle.clear();
                                cardsSetSinceLastIdle.clear();
                                cardsBanishedSinceLastIdle.clear();
                                cardsSentToGYSinceLastIdle.clear();
                                autoFiredPrevStepIgnition = false;
                                currentActiveStepIdx = stepIdx;
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_ACTIVATE,
                                    index: aIdx
                                });
                                const actCode = m.activates[aIdx].code;
                                const actName = getCardByCode(actCode)?.name || actCode;
                                log.push(`Step ${stepIdx + 1}: Legal Activation of ${actName} (${actCode})${guessedByDescription ? ' (matched by effect wording)' : ''}`);
                                if (guessedByDescription) {
                                    let targets = [...(stepNamedCodes[stepIdx] || [])].filter(c => c !== actCode);
                                    // In a Synchro/Xyz/Link/Fusion Summon step the summoned monster must move, not just a material
                                    const summonedTargets = targets.filter(c => ((getCardByCode(c)?.type || 0) & 0x4802040) !== 0);
                                    if (/\b(?:synchro|xyz|link|fusion)\s+summon/i.test(rawStepText) && summonedTargets.length > 0) targets = summonedTargets;
                                    if (targets.length > 0) {
                                        pendingPostcondition = { stepIdx, text: currentStep.text, actor: actCode, targets, moved: new Set() };
                                    }
                                }
                                const actType = getCardByCode(actCode)?.type || 0;
                                if (m.activates[aIdx].location === OcgLocation.HAND && (actType & 0x6) && (actType & 0xA0000)) {
                                    const searchTargets = [...rawStepText.matchAll(/\b(?:search(?:es|ing)?(?:\s+for)?|add(?:s|ing)?)\s+(.+?)(?:\s+(?:from|to|and|then|while)\b|[,.;]|$)/gi)]
                                        .flatMap(sm => matchFragmentCodes(sm[1])).filter(c => c !== actCode);
                                    if (searchTargets.length > 0) pendingCardEffect = { stepIdx, code: actCode, targets: searchTargets };
                                    // "Activate Domain, pay 500 LP for an additional Normal Summon": the grant is its own activation too
                                    else if (/\b(?:additional|extra|second)\s+normal summon\b/i.test(rawStepText)) pendingCardEffect = { stepIdx, code: actCode, targets: [] };
                                }
                                stepIdx++;
                                skipRedundantVisualSteps();
                                return true;
                            }
                            return false;
                        };

                        // 1. Normal Summon
                        if (isNormalSummon && m.summons && m.summons.length > 0) {
                            let sIdx = -1;
                            for (const code of idleCodes) {
                                sIdx = m.summons.findIndex(c => c.code === code);
                                if (sIdx !== -1) break;
                            }
                            if (sIdx === -1) {
                                for (const code of stepCodes) {
                                    sIdx = m.summons.findIndex(c => c.code === code);
                                    if (sIdx !== -1) break;
                                }
                            }
                            const hasMainDeckMonsterCode = idleCodes.some(c => {
                                const card = getCardByCode(c);
                                return card && (card.type & 0x1) && !(card.type & 0x4802040);
                            });
                            if (sIdx === -1 && (stepCodes.length === 0 || !hasMainDeckMonsterCode || /\bnormal summon\s+(?:any|a|an|1|your)\b/i.test(text))) {
                                sIdx = 0;
                            }
                            if (sIdx !== -1) {
                                lastActorCode = m.summons[sIdx].code;
                                playerInvokedSummonCode = m.summons[sIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                cardsSummonedSinceLastIdle.clear();
                                cardsSetSinceLastIdle.clear();
                                cardsBanishedSinceLastIdle.clear();
                                cardsSentToGYSinceLastIdle.clear();
                                autoFiredPrevStepIgnition = false;
                                currentActiveStepIdx = stepIdx;
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_SUMMON,
                                    index: sIdx
                                });
                                const nsCode = m.summons[sIdx].code;
                                const nsName = getCardByCode(nsCode)?.name || nsCode;
                                log.push(`Step ${stepIdx + 1}: Legal Normal Summon of ${nsName} (${nsCode})`);
                                stepIdx++;
                                skipRedundantVisualSteps();
                                acted = true;
                            }
                        }

                        // 2 & 3. Special Summon vs Activation (prioritize based on step phrasing)
                        if (!acted) {
                            if (isExplicitEffectActivation) {
                                acted = tryActivate() || trySpecialSummon();
                            } else {
                                acted = trySpecialSummon() || tryActivate();
                            }
                        }

                        // 4. Set card from hand
                        if (!acted && isSet) {
                            if (m.spell_sets && m.spell_sets.length > 0) {
                                let setIdx = -1;
                                for (const code of idleCodes) {
                                    setIdx = m.spell_sets.findIndex(c => c.code === code);
                                    if (setIdx !== -1) break;
                                }
                                if (setIdx === -1 && (stepCodes.length === 0 || /\bset(?:ting)?\s+(?:any|a|an|1)\b/i.test(text))) setIdx = 0;
                                if (setIdx !== -1) {
                                    lastActorCode = m.spell_sets[setIdx].code;
                                    playerInvokedSetCode = m.spell_sets[setIdx].code;
                                    triggersFiredSinceLastIdle = 0;
                                    cardsSelectedSinceLastIdle.clear();
                                    cardsSummonedSinceLastIdle.clear();
                                    cardsSetSinceLastIdle.clear();
                                    cardsBanishedSinceLastIdle.clear();
                                    cardsSentToGYSinceLastIdle.clear();
                                    autoFiredPrevStepIgnition = false;
                                    currentActiveStepIdx = stepIdx;
                                    lib.duelSetResponse(duel, {
                                        type: OcgResponseType.SELECT_IDLECMD,
                                        action: SelectIdleCMDAction.SELECT_SPELL_SET,
                                        index: setIdx
                                    });
                                    const setCode = m.spell_sets[setIdx].code;
                                    const setName = getCardByCode(setCode)?.name || setCode;
                                    log.push(`Step ${stepIdx + 1}: Legal Spell/Trap Set of ${setName} (${setCode})`);
                                    stepIdx++;
                                    skipRedundantVisualSteps();
                                    acted = true;
                                }
                            }
                            // "Normal Set Guru", "Set Subterror Guru face-down": a monster Set (Normal or Tribute Set)
                            if (!acted && m.monster_sets && m.monster_sets.length > 0) {
                                let msIdx = -1;
                                for (const code of idleCodes) {
                                    msIdx = m.monster_sets.findIndex(c => c.code === code);
                                    if (msIdx !== -1) break;
                                }
                                if (msIdx !== -1) {
                                    lastActorCode = m.monster_sets[msIdx].code;
                                    playerInvokedSummonCode = m.monster_sets[msIdx].code;
                                    triggersFiredSinceLastIdle = 0;
                                    cardsSelectedSinceLastIdle.clear();
                                    cardsSummonedSinceLastIdle.clear();
                                    cardsSetSinceLastIdle.clear();
                                    cardsBanishedSinceLastIdle.clear();
                                    cardsSentToGYSinceLastIdle.clear();
                                    autoFiredPrevStepIgnition = false;
                                    currentActiveStepIdx = stepIdx;
                                    lib.duelSetResponse(duel, {
                                        type: OcgResponseType.SELECT_IDLECMD,
                                        action: SelectIdleCMDAction.SELECT_MONSTER_SET,
                                        index: msIdx
                                    });
                                    const msCode = m.monster_sets[msIdx].code;
                                    log.push(`Step ${stepIdx + 1}: Legal Monster Set of ${codeName(msCode)} (${msCode})`);
                                    stepIdx++;
                                    skipRedundantVisualSteps();
                                    acted = true;
                                }
                            }
                        }

                        if (acted) {
                            break;
                        }

                        // If unhandled, check if it was a trigger effect, chain resolution, opponent-board interaction, or passive text
                        const OPPONENT_CARDS_RE = /(?:card|monster|spell|trap)s?\s+(?:your\s+)?opponent\s+controls|opponent's\s+(?:card|monster|spell|trap|field|board)/i;
                        const isTriggerOrResolution = /(?:chain link \d|a chain forms|trigger|on summon|if summoned|when summoned|activate (?:its|the) effect to (?:search|add|send|dump|draw|destroy|set)|its own on-activation effect|set .* from (?:the |your )?(?:deck|gy|graveyard)|search |add .* to hand|\bcycle\b.*back to hand|put .* back on top|place .* on (?:top|bottom) of (?:the|your) deck|is now in the gy|is now a .* monster|sets up your|securing a|that is two layers|going second|keeping the extra monster zone|legal because|end (?:your )?turn|negate the first|while returning the|locking your opponent|^continue the combo\b)/i.test(text);
                        // "Activate Dandalos's effect, targeting your opponent's monster, ..." that the engine can't play
                        // is not a note about the opponent: without their board it can't be checked, so it isn't a pass
                        if (!isTriggerOrResolution && OPPONENT_CARDS_RE.test(text) && !namedSearchTargetMissing) {
                            if (startsWithExplicitActivate && stepCodes.length > 0) {
                                unverifiedSteps.push({ step: stepIdx + 1, text: currentStep.text, reason: 'opponent-board', taints: true });
                                log.push(`Step ${stepIdx + 1}: Not simulated - ${UNSIMULATED_REASONS['opponent-board']}`);
                            }
                            stepIdx++;
                            autoFiredPrevStepIgnition = false;
                            skipRedundantVisualSteps();
                            continue;
                        }
                        if (isTriggerOrResolution && !namedSearchTargetMissing) {
                            stepIdx++;
                            autoFiredPrevStepIgnition = false;
                            skipRedundantVisualSteps();
                            continue;
                        }
                        const isMainAction = isNormalSummon || isSpSummon || isActivate || isSet;
                        if (!isMainAction && /(add |send |move\b|draw|detach|tribute|discard|put |place |banish\b|as material\b)/i.test(text)) {
                            stepIdx++;
                            autoFiredPrevStepIgnition = false;
                            continue;
                        }

                        const hasNoIdleActions = !m.activates?.length && !m.summons?.length && !m.special_summons?.length && !m.spell_sets?.length && !m.monster_sets?.length;
                        const isExplicitEndPhaseStep = /\b(?:end phase|in the ep|during the ep|during (?:the |your )?end phase|end (?:your )?turn)\b/i.test(rawStepText) ||
                            (stepCodes.includes(43338320) && !m.activates?.some(a => a.code === 43338320));

                        if (options.lenient && !isExplicitEndPhaseStep) {
                            // Exact name matching found nothing: the step may still name an offered card by a typo or a
                            // short name ("Diabellstarr", "Super Producer"). Take an offered action of the step's kind
                            // only when one card clearly matches the step's actor text better than any other.
                            const pools = [];
                            if (isNormalSummon) pools.push(['summons', SelectIdleCMDAction.SELECT_SUMMON, 'Normal Summon']);
                            if (isSpSummon) pools.push(['special_summons', SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, 'Special Summon']);
                            if (isActivate || isExplicitEffectActivation || isSpSummon) pools.push(['activates', SelectIdleCMDAction.SELECT_ACTIVATE, 'Activation']);
                            if (isSet) pools.push(['spell_sets', SelectIdleCMDAction.SELECT_SPELL_SET, 'Spell/Trap Set']);
                            const bestByCode = new Map();
                            // Score against the actor part only: a cost card or an "(e.g., Jet Synchron)" aside isn't the actor
                            // nor are the materials of a summon ("Link Summon Raging Phoenix using Sunlight Wolf, ...")
                            const nameText = actorText
                                .replace(/\([^)]*\)/g, ' ')
                                .replace(/\b(?:by|after|while)\s+(?:discard|tribut|banish|send|reveal|detach|pay)\w*\s+[^,.;]*/gi, ' ')
                                .replace(isExtraOrProcSummon ? /\s(?:using|with)\s.*$/i : /$^/, ' ');
                            const isEffectOfActorStep = startsWithExplicitActivate && /'s\s+effect\b/i.test(rawStepText);
                            for (const [key, action, label] of pools) {
                                (m[key] || []).forEach((entry, idx) => {
                                    // An "Activate X's effect" step is never a Link/Synchro/Xyz/Fusion Summon from the Extra Deck
                                    if (key === 'special_summons' && isEffectOfActorStep && entry.location === OcgLocation.EXTRA) return;
                                    const sc = scoreNameAgainstText(codeName(entry.code), nameText, tokenFrequency);
                                    if (sc > (bestByCode.get(entry.code)?.score ?? 0)) bestByCode.set(entry.code, { score: sc, action, idx, label, code: entry.code });
                                });
                            }
                            const ranked = [...bestByCode.values()].sort((a, b) => b.score - a.score);
                            const best = ranked[0];
                            // At least half a distinctive word, and clearly ahead of every other card on offer
                            if (best && best.score >= 0.5 && best.score - (ranked[1]?.score ?? 0) >= 0.25) {
                                lastActorCode = best.code;
                                if (best.action === SelectIdleCMDAction.SELECT_SUMMON || best.action === SelectIdleCMDAction.SELECT_SPECIAL_SUMMON) {
                                    playerInvokedSummonCode = best.code;
                                } else {
                                    playerInvokedSetCode = best.code;
                                }
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                cardsSummonedSinceLastIdle.clear();
                                cardsSetSinceLastIdle.clear();
                                cardsBanishedSinceLastIdle.clear();
                                cardsSentToGYSinceLastIdle.clear();
                                autoFiredPrevStepIgnition = false;
                                currentActiveStepIdx = stepIdx;
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: best.action,
                                    index: best.idx
                                });
                                log.push(`Step ${stepIdx + 1}: Legal ${best.label} of ${codeName(best.code)} (${best.code}) (matched by name similarity)`);
                                stepIdx++;
                                skipRedundantVisualSteps();
                                break;
                            }

                            // Steps the engine can't simulate from the prose are recorded and skipped, not reported as illegal
                            const unsimulatedReason = classifyUnsimulatedStep(rawStepText, { hasCard: stepCodes.length > 0, stepCodes, unscriptedCodes });
                            if (unsimulatedReason) {
                                unverifiedSteps.push({
                                    step: stepIdx + 1,
                                    text: currentStep.text,
                                    reason: unsimulatedReason,
                                    taints: unsimulatedReason !== 'narrative'
                                });
                                log.push(`Step ${stepIdx + 1}: Not simulated - ${UNSIMULATED_REASONS[unsimulatedReason]}`);
                                stepIdx++;
                                autoFiredPrevStepIgnition = false;
                                skipRedundantVisualSteps();
                                continue;
                            }
                        }

                        if ((hasNoIdleActions || isExplicitEndPhaseStep) && !inEndPhase) {
                            inEndPhase = true;
                            currentActiveStepIdx = stepIdx;
                            lib.duelSetResponse(duel, {
                                type: OcgResponseType.SELECT_IDLECMD,
                                action: SelectIdleCMDAction.TO_EP,
                                index: 0
                            });
                            log.push(`Step ${stepIdx + 1}: Transitioning to End Phase for remaining actions`);
                            break;
                        }

                        lastOfferedActions = {
                            summons: (m.summons || []).map(s => ({
                                code: s.code,
                                name: getCardByCode(s.code)?.name || String(s.code)
                            })),
                            specialSummons: (m.special_summons || []).map(s => ({
                                code: s.code,
                                name: getCardByCode(s.code)?.name || String(s.code),
                                location: s.location
                            })),
                            activates: (m.activates || []).map(a => ({
                                code: a.code,
                                name: getCardByCode(a.code)?.name || String(a.code),
                                desc: getEffectDescription(a.description),
                                location: a.location,
                                sequence: a.sequence
                            })),
                            spellSets: (m.spell_sets || []).map(s => ({
                                code: s.code,
                                name: getCardByCode(s.code)?.name || String(s.code)
                            })),
                            monsterSets: (m.monster_sets || []).map(s => ({
                                code: s.code,
                                name: getCardByCode(s.code)?.name || String(s.code)
                            })),
                            repos: (m.repos || []).map(r => ({
                                code: r.code,
                                name: getCardByCode(r.code)?.name || String(r.code)
                            }))
                        };
                        if (options.debug) {
                            const hand = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.HAND }) || [];
                            const szone = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.SZONE }) || [];
                            const mzone = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE }) || [];
                            const gy = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.GRAVE }) || [];
                            const extra = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.EXTRA }) || [];
                            const deck = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.DECK }) || [];
                            console.log('[DEBUG IDLE FAILED] HAND:', hand.map(c => c?.code));
                            console.log('[DEBUG IDLE FAILED] SZONE:', szone.map(c => ({ code: c?.code, pos: c?.position, seq: c?.sequence })));
                            console.log('[DEBUG IDLE FAILED] MZONE:', mzone.map(c => c?.code));
                            console.log('[DEBUG IDLE FAILED] GY:', gy.map(c => ({ code: c?.code, name: getCardByCode(c?.code)?.name })));
                            console.log('[DEBUG IDLE FAILED] EXTRA:', extra.map(c => ({ code: c?.code, name: getCardByCode(c?.code)?.name })));
                            console.log('[DEBUG IDLE FAILED] DECK count:', deck.length);
                        }
                        failureDiagnosis = diagnoseUnofferedStep({
                            stepCodes,
                            idleCodes,
                            wantsExtraSummon: isExtraOrProcSummon || (isSpSummon && stepCodes.some(c => ((getCardByCode(c)?.type || 0) & 0x4802040) !== 0)),
                            stepText: rawStepText,
                            namedCodes: [...(stepNamedCodes[stepIdx] || [])]
                        });
                        errors.push(`Step ${stepIdx + 1} ("${currentStep.text}") was not offered as a legal action by the duel engine.${failureDiagnosis.detail ? ` ${failureDiagnosis.detail}` : ''}`);
                        break;
                    }

                } else if (m.type === 12) { // SELECT_EFFECTYN
                    let acceptTrigger = true;
                    const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;
                    const nextStep = steps[stepIdx] || null;
                    const prevText = (prevStep?.text || '');
                    const nextText = (nextStep?.text || '');

                    const descStr = getEffectDescription(m.description);
                    if (options.debug) {
                        console.log('[DEBUG SELECT_EFFECTYN]', m.code, m.description, descStr);
                    }
                    // If an optional continuous protection/dodge/replacement effect is prompted during resolution,
                    // check if upcoming steps within 4 steps indicate banishing or moving a monster to banished zone
                    const isMidChainDodgeOrProtection = /(?:banish .* until immediately after|instead of destroying|from your gy instead|prevent destruction|if .* would be destroyed)/i.test(descStr);
                    if (isMidChainDodgeOrProtection) {
                        let upcomingMentionsThis = false;
                        for (let s = Math.max(0, stepIdx - 2); s < Math.min(steps.length, stepIdx + 4); s++) {
                            if (s > stepIdx) {
                                const rawSt = cleanCardName(steps[s]?.text || '');
                                if (/^(?:(?:normal|special|link|xyz|synchro|fusion)?\s*summon\b|activat(?:e|ing) effect)\b/i.test(rawSt)) {
                                    break;
                                }
                            }
                            const scodes = findStepCardCodes(steps[s], lastActorCode);
                            const stext = (steps[s]?.text || '').toLowerCase();
                            const isBanishStep = steps[s]?.to === 'zone-banish' ||
                                Boolean(steps[s]?.actions?.some(a => a.to === 'zone-banish')) ||
                                /\b(?:banish|banished|protect|shield|prevent|dodge)\b/i.test(stext);
                            if (isBanishStep) {
                                upcomingMentionsThis = true;
                                break;
                            }
                        }
                        if (!upcomingMentionsThis) {
                            acceptTrigger = false;
                        }
                    }

                    // If an optional field removal/destruction trigger is prompted, only accept if upcoming steps mention this card or destruction/removal
                    const isFieldRemovalTrigger = /(?:send .* card .* on the field to the gy|send 1 card on the field to the gy|destroy 1 card on the field|destroy 1 monster on the field|target 1 card on the field)/i.test(descStr);
                    if (isFieldRemovalTrigger) {
                        let upcomingMentionsRemoval = false;
                        for (let s = Math.max(0, stepIdx - 1); s < Math.min(steps.length, stepIdx + 4); s++) {
                            const scodes = findStepCardCodes(steps[s], m.code);
                            const stext = (steps[s]?.text || '').toLowerCase();
                            if (scodes.includes(m.code) || /\b(?:destroy|send .* on the field|pop)\b/i.test(stext)) {
                                upcomingMentionsRemoval = true;
                                break;
                            }
                        }
                        if (!upcomingMentionsRemoval) {
                            acceptTrigger = false;
                        }
                    }

                    // Fiendsmith's Desirae (82135803) has an optional trigger on being sent to GY to shuffle a Fiendsmith and send a card on field to GY.
                    // Only accept if an upcoming step explicitly calls for Desirae's effect or removal.
                    if (m.code === 82135803) {
                        let upcomingMentionsDesirae = false;
                        for (let s = Math.max(0, stepIdx - 1); s < Math.min(steps.length, stepIdx + 4); s++) {
                            const scodes = findStepCardCodes(steps[s], m.code);
                            if (scodes.includes(m.code)) {
                                upcomingMentionsDesirae = true;
                                break;
                            }
                        }
                        if (!upcomingMentionsDesirae) {
                            acceptTrigger = false;
                        }
                    }

                    // A trigger that targets "1 monster on the field" to bounce/destroy/banish it has only our own cards to
                    // hit on turn 1 (Miragestallio returning Sunlight Wolf). The engine's prompt is a generic "use it?",
                    // so read the card text, and use it only when a step from here on asks for that card's effect
                    // (being named as Link material is not asking)
                    if (acceptTrigger && /\btarget\s+1\s+(?:card|monster)s?\s+on the field\b[^.]*\b(?:return|destroy|banish|send|shuffle)/i.test(getCardText(m.code))) {
                        let asked = false;
                        for (let s = currentActiveStepIdx ?? stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                            // The card must be the step's actor: "send N'tss and Titaniklad to the GY" doesn't ask for N'tss's effect
                            const actorPart = cleanCardName(steps[s]?.text || '')
                                .replace(/^(?:(?:during|in)\s+(?:the|your)\s+\w+\s+phase,?\s*)?(?:activat(?:e|ing)|us(?:e|ing)|chain(?:ing)?)\s+(?:the\s+)?/i, '')
                                .split(/'s\b|[:,;]|\s+(?:to|by|and|choosing|targeting|from|in|on|with|for)\s+/i)[0];
                            if (findStepCardCodes({ text: actorPart }, null).includes(m.code) &&
                                /\b(?:return|bounce|destroy|banish|send|shuffle|effect|activat)/i.test(cleanCardName(steps[s]?.text || ''))) {
                                asked = true;
                                break;
                            }
                        }
                        if (!asked) acceptTrigger = false;
                    }

                    const trigCode = m.code;
                    acceptTrigger = recordDecision('EFFECT_YN', acceptTrigger, [!acceptTrigger], {
                        confident: acceptTrigger && isMentionedNear(trigCode),
                        describe: (yes) => `${yes ? 'use' : 'skip'} the optional effect of ${codeName(trigCode)}`,
                        codesOf: () => [trigCode]
                    });

                    if (acceptTrigger) {
                        triggersFiredSinceLastIdle++;
                        lastActorCode = m.code;
                        const trigName = getCardByCode(m.code)?.name || m.code;
                        log.push(`Trigger Effect Accepted for ${trigName} (${m.code})`);

                        // If an upcoming step explicitly corresponds to this trigger effect activation, advance stepIdx
                        let matchedStep = -1;
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                            const stepCodes = findStepCardCodes(steps[s], m.code);
                            // "During your End Phase, activate Titaniklad's effect ..." starts with its timing, not its verb
                            const stText = cleanCardName(steps[s]?.text || '').trim()
                                .replace(/^(?:during|in)\s+(?:the|your)\s+(?:end|standby)\s+phase,?\s*/i, '');
                            // The card being activated is the one right after the verb: "Activate Purrely Delicious Memory,
                            // choosing Purrely" activates the Spell, not Purrely's trigger
                            const activatedPart = stText.replace(/^(?:activat(?:e|ing)|trigger(?:ing)?|chain(?:ing)?|us(?:e|ing))\s+(?:the\s+)?/i, '')
                                .split(/[:,;]|\s+(?:to|by|and|choosing|targeting|from|in|on|with|for)\s+/i)[0];
                            const activatedCodes = activatedPart ? findStepCardCodes({ text: activatedPart }, null) : [];
                            if (stepCodes.includes(m.code) && (activatedCodes.length === 0 || activatedCodes.includes(m.code)) &&
                                /^(?:activat(?:e|ing)|trigger(?:ing)?|chain(?:ing)?|us(?:e|ing))\b/i.test(stText) &&
                                !SUMMON_COMMAND_STEP_RE.test(stText.replace(LEADING_CLAUSE_RE, ''))) {
                                let canAdvance = true;
                                for (let k = stepIdx; k < s; k++) {
                                    const kText = cleanCardName(steps[k]?.text || '').trim();
                                    const kCodes = findStepCardCodes(steps[k], m.code);
                                    const isSummonOfThis = /^(?:(?:special|normal|xyz|synchro|link|fusion)?\s*summon\b|ss\b)/i.test(kText) && kCodes.includes(m.code);
                                    const isPassive = /^(?:tribute|move|send|draw|add|place|put)\s+(?:to\b|from\b)/i.test(kText) ||
                                        /^tribute\b/i.test(kText) ||
                                        /\b(?:is|are|was|were)\s+(?:added|sent|special summoned|summoned|tributed|banished|placed|set|drawn)\b/i.test(kText);
                                    if (!isSummonOfThis && !isPassive) {
                                        canAdvance = false;
                                        break;
                                    }
                                }
                                if (canAdvance) {
                                    matchedStep = s;
                                    break;
                                }
                            }
                        }

                        if (matchedStep !== -1) {
                            currentActiveStepIdx = matchedStep;
                            stepIdx = matchedStep + 1;
                            skipRedundantVisualSteps();
                        } else {
                            currentActiveStepIdx = Math.max(0, stepIdx - 1);
                        }
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_EFFECTYN,
                        yes: acceptTrigger
                    });

                } else if (m.type === 15) { // SELECT_CARD
                    // Find which card(s) in m.selects match the currently resolving step (stepIdx - 1) and upcoming steps
                    const consumedBeforeSelect = new Set(chainStepsConsumed);
                    let chosen = [];
                    // A pick completes the step it matched only when that step is about the picked card as an object:
                    // not a player command ("Normal Summon Diameter") and not the card acting ("Rising Carp's effect ...")
                    // The card a step is about: "Rising Carp's effect ...", "LV7 triggers ...", "Hope searches ..."
                    const stepSubjectCodes = (s) => {
                        const subject = cleanCardName(steps[s]?.text || '').match(/^\s*(?:then,?\s+)?(.+?)(?:'s\b|\s+(?:then\s+)?(?:searches|adds|sends|special summons|summons|revives|sets|places|equips|draws|banishes|destroys|triggers|activates|tributes|attaches|detaches)\b)/i);
                        return subject ? matchFragmentCodes(subject[1]) : [];
                    };
                    const selectionCompletesStep = (s, pickedIdx) => {
                        // "Using Rciela and Astellar, Synchro Summon Diabell" is a command after its lead-in clause
                        const commandText = cleanCardName(steps[s]?.text || '').replace(LEADING_CLAUSE_RE, '');
                        if (PLAYER_COMMAND_STEP_RE.test(commandText)) return false;
                        // Discarding Zephyros from the hand is not "Revive Zephyros": a revive picks from the GY or banishment
                        if (/^(?:then,?\s+)?reviv(?:e|ing)\b/i.test(commandText) &&
                            pickedIdx.some(i => ![OcgLocation.GRAVE, OcgLocation.REMOVED].includes(m.selects?.[i]?.location))) return false;
                        const subjectCodes = stepSubjectCodes(s);
                        // "Scout Buggy's effect Special Summons a second Scout Buggy from your Deck": another copy of the subject
                        const namesCopy = /\b(?:a second|another|a copy of)\b/i.test(commandText);
                        return !pickedIdx.some(i => subjectCodes.includes(m.selects?.[i]?.code) &&
                            !(namesCopy && ![OcgLocation.MZONE, OcgLocation.SZONE].includes(m.selects?.[i]?.location)));
                    };
                    const maxSelect = m.max || 1;
                    const minSelect = m.min || 1;

                    const getDesiredLocFromStep = (stepObj, forCode = null) => {
                        if (!stepObj) return null;
                        let desiredZone = null;
                        if (forCode) {
                            if (stepObj.actions && stepObj.actions.length > 0) {
                                const act = stepObj.actions.find(a => a.card && idMap.has(a.card) && idMap.get(a.card).code === forCode);
                                if (act && cardZoneMap.has(act.card)) {
                                    desiredZone = cardZoneMap.get(act.card);
                                }
                            }
                            if (!desiredZone && stepObj.card && idMap.has(stepObj.card) && idMap.get(stepObj.card).code === forCode) {
                                if (cardZoneMap.has(stepObj.card)) {
                                    desiredZone = cardZoneMap.get(stepObj.card);
                                }
                            }
                            // If desiredZone is not present in m.selects for this code, check if another instance of forCode in cardZoneMap IS in m.selects!
                            if (desiredZone && m.selects && m.selects.length > 0) {
                                const loc = zoneToOcgLocation(desiredZone);
                                const hasMatchAtLoc = m.selects.some(c => c.code === forCode && (c.location === loc || (loc === OcgLocation.FZONE && c.location === OcgLocation.SZONE)));
                                if (!hasMatchAtLoc) {
                                    for (const [cId, zone] of cardZoneMap.entries()) {
                                        const cardObj = idMap.get(cId);
                                        if (cardObj && cardObj.code === forCode) {
                                            const altLoc = zoneToOcgLocation(zone);
                                            if (m.selects.some(c => c.code === forCode && (c.location === altLoc || (altLoc === OcgLocation.FZONE && c.location === OcgLocation.SZONE)))) {
                                                desiredZone = zone;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            if (desiredZone) {
                                return zoneToOcgLocation(desiredZone);
                            }
                        } else {
                            const cardId = stepObj.card || stepObj.actions?.[0]?.card;
                            if (cardId && cardZoneMap.has(cardId)) {
                                return zoneToOcgLocation(cardZoneMap.get(cardId));
                            }
                        }
                        const stText = (stepObj.text || '').toLowerCase();
                        if (/\b(?:from\s+(?:the\s+|your\s+)?(?:gy|graveyard)|in\s+(?:the\s+|your\s+)?(?:gy|graveyard)|revive|retrieve|recover)\b/i.test(stText)) return OcgLocation.GRAVE;
                        if (/\b(?:from\s+(?:the\s+|your\s+)?(?:hand)|in\s+(?:the\s+|your\s+)?(?:hand))\b/i.test(stText)) return OcgLocation.HAND;
                        if (/\b(?:from\s+(?:the\s+|your\s+)?(?:deck)|in\s+(?:the\s+|your\s+)?(?:deck)|search)\b/i.test(stText)) return OcgLocation.DECK;
                        if (/\b(?:from\s+(?:the\s+|your\s+)?(?:extra(?:\s+deck)?)|in\s+(?:the\s+|your\s+)?(?:extra(?:\s+deck)?))\b/i.test(stText)) return OcgLocation.EXTRA;
                        return null;
                    };

                    // How many copies the step asks for: "Special Summon 3x Baby Spider", "two Baby Spiders"
                    const writtenCopies = (stepObj, code) => {
                        const t = cleanCardName(stepObj?.text || '').toLowerCase();
                        for (const v of (nameVariants.get(code) || [])) {
                            const hit = t.match(new RegExp(`\\b(\\d|two|three)\\s*x?\\s+${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
                            if (hit) return { two: 2, three: 3 }[hit[1]] || Number(hit[1]) || 1;
                        }
                        return 1;
                    };
                    const tryMatchCodes = (candidateCodes, desiredLoc = null, maxPerCode = 1, stepForLoc = null) => {
                        // Cards this step names outright first, then cards named nearby, then cards reached through a
                        // pronoun ("its effect" -> last actor)
                        const stepIndex = stepForLoc ? steps.indexOf(stepForLoc) : -1;
                        const namedHere = (c) => Number(stepIndex >= 0 && Boolean(stepNamedCodes[stepIndex]?.has(c)));
                        const ordered = [...candidateCodes].sort((a, b) => (namedHere(b) - namedHere(a)) ||
                            (Number(isMentionedNear(b)) - Number(isMentionedNear(a))));
                        for (const code of ordered) {
                            let matchedForCode = 0;
                            const loc = stepForLoc ? getDesiredLocFromStep(stepForLoc, code) : desiredLoc;
                            const perCode = Math.max(maxPerCode, writtenCopies(stepForLoc, code));
                            while (chosen.length < maxSelect && matchedForCode < perCode && code && m.selects && m.selects.length > 0) {
                                let foundIdx = -1;
                                if (loc != null) {
                                    foundIdx = m.selects.findIndex((c, i) => c.code === code && !chosen.includes(i) && (c.location === loc || (loc === OcgLocation.FZONE && c.location === OcgLocation.SZONE)));
                                }
                                if (foundIdx === -1) {
                                    foundIdx = m.selects.findIndex((c, i) => c.code === code && !chosen.includes(i));
                                }
                                if (foundIdx !== -1) {
                                    chosen.push(foundIdx);
                                    matchedForCode++;
                                } else {
                                    break;
                                }
                            }
                        }
                    };

                    // 0. If a chain link is currently resolving, match against the step of THAT chain link's actor!
                    let chainStepIdx = -1;
                    if (currentSolvingChainCard?.stepIdx != null && currentSolvingChainCard.stepIdx >= 0) {
                        chainStepIdx = currentSolvingChainCard.stepIdx;
                    } else if (currentSolvingChainCard?.code) {
                        for (let s = Math.min(steps.length - 1, stepIdx + 1); s >= Math.max(0, stepIdx - 5); s--) {
                            const cCodes = findStepCardCodes(steps[s], currentSolvingChainCard.code);
                            if (cCodes.includes(currentSolvingChainCard.code)) {
                                chainStepIdx = s;
                                break;
                            }
                        }
                    } else if (currentActiveStepIdx != null && currentActiveStepIdx >= 0) {
                        chainStepIdx = currentActiveStepIdx;
                    }

                    const actorCode = currentSolvingChainCard?.code || lastActorCode;
                    if (options.debug) {
                        console.log('[DEBUG SELECT_CARD at step]', stepIdx, 'chainStepIdx:', chainStepIdx, 'actorCode:', actorCode, 'min:', m.min, 'max:', m.max, 'm.selects:', m.selects?.map(c => ({ code: c.code, name: getCardByCode(c.code)?.name, loc: c.location })));
                    }

                    const isExtraSelect = m.selects?.length > 0 && m.selects.every(c => c.location === OcgLocation.EXTRA);
                    if (isExtraSelect) {
                        const isExtraTargetStep = (step) => {
                            if (!step) return false;
                            const stText = (step.text || '').toLowerCase();
                            const to = step.to || '';
                            if (/\bequip\b/i.test(stText) || to.startsWith('zone-s')) return true;
                            if (/^(?:(?:fusion|synchro|xyz|link|special)?\s*summon\b|ss\b)/i.test(stText) || to.startsWith('zone-m') || to.startsWith('zone-em')) return true;
                            if (/\b(?:extra\s+deck|extra)\b/i.test(stText)) return true;
                            return false;
                        };

                        const startScan = Math.max(0, (chainStepIdx !== -1 ? Math.min(chainStepIdx, stepIdx - 2) : stepIdx - 2));
                        const endScan = Math.min(steps.length, stepIdx + 6);
                        // The resolving step's own Extra Deck card first: "Activate Tartaros to Fusion Summon Dandalos"
                        // picks Dandalos even though the step before ("Jauzah's effect adds Tartaros") names Jauzah
                        const scanOrder = [...Array(Math.max(0, endScan - startScan)).keys()].map(i => startScan + i);
                        // Only when that step names an offered card outright, not by a near match ("Zoroa, the Magistus
                        // of Flame" is not "Zoroa, the Magistus Verethragna")
                        const chainNamesExtraPick = chainStepIdx >= startScan && chainStepIdx < endScan &&
                            m.selects.some(c => c.code !== actorCode && stepNamedCodes[chainStepIdx]?.has(c.code));
                        if (chainNamesExtraPick) scanOrder.sort((a, b) => (b === chainStepIdx) - (a === chainStepIdx));
                        for (const s of scanOrder) {
                            if (chosen.length >= maxSelect) break;
                            if (!isExtraTargetStep(steps[s])) continue;
                            const stepCodes = findStepCardCodes(steps[s], actorCode);
                            for (const code of stepCodes) {
                                const foundIdx = m.selects.findIndex((c, i) => c.code === code && !chosen.includes(i));
                                if (foundIdx !== -1) {
                                    chosen.push(foundIdx);
                                    if (chosen.length >= maxSelect) break;
                                }
                            }
                        }
                    }

                    // An on-summon trigger of a monster already on the field: the step that summoned it lists its
                    // materials ("Tune AFD and Spore into Ancient Fairy Life Dragon"), not what its effect should pick
                    const chainStepIsSummonOfActor = chainStepIdx !== -1 &&
                        currentSolvingChainCard?.location === OcgLocation.MZONE &&
                        Boolean(stepNamedCodes[chainStepIdx]?.has(actorCode)) &&
                        /\b(?:summon|tune|overlay|link|synchro|xyz|fuse|fusion|into)\b/i.test(steps[chainStepIdx]?.text || '');

                    if (chainStepIdx !== -1) {
                        currentActiveStepIdx = chainStepIdx;
                        // A discard prompt (hint 501) picks from a step about discarding, never from "Fusion Summons
                        // Kon-Gyo using Yuhi" further on, which names a material still needed on the field
                        const skipForDiscard = (s) => lastHintCardCode === 501 && s !== chainStepIdx &&
                            /\busing\b/i.test(steps[s]?.text || '') && !/\bdiscard/i.test(steps[s]?.text || '');
                        // A Deck pick is never the card a step Tributes or discards ("activate Mikpolar's effect, Tributing
                        // Miktanus from your hand, ..." then searches from the Deck)
                        const deckPickText = (s) => (m.selects?.length && m.selects.every(c => c.location === OcgLocation.DECK))
                            ? { ...steps[s], text: (steps[s]?.text || '').replace(/(?:,\s*|\bby\s+)(?:tribut|discard)\w*\s+.*?(?=\s+to\s|[,.;]|$)/gi, '') }
                            : steps[s];
                        // The engine's hint says what this pick does (Tribute 500, discard 501, banish 503, send 504): take
                        // the card the step's matching clause names ("banishing Mikpolar from your GY ..., to revive Megatanus")
                        const clauseVerb = { 500: 'tribut', 501: 'discard', 503: 'banish', 504: 'send' }[lastHintCardCode];
                        if (clauseVerb && chosen.length < maxSelect && steps[chainStepIdx] && !chainStepsConsumed.has(chainStepIdx)) {
                            const clause = new RegExp(`\\b${clauseVerb}\\w*\\s+(.+?)(?:\\s+(?:from|to|instead)\\b|[,.;:]|$)`, 'i')
                                .exec(cleanCardName(steps[chainStepIdx].text || '').replace(LEADING_CLAUSE_RE, ''));
                            const clauseCodes = clause ? findStepCardCodes({ text: clause[1] }, null).filter(c => c !== actorCode) : [];
                            if (clauseCodes.length > 0) tryMatchCodes(clauseCodes, null, 1, steps[chainStepIdx]);
                        }
                        // Targets are picked on activation: "Activate Bone Archfiend's effect, targeting itself, sending Red
                        // Resonator ..." targets Bone Archfiend, not a monster the step names elsewhere
                        if (!currentSolvingChainCard && chosen.length < maxSelect && steps[chainStepIdx] && !chainStepsConsumed.has(chainStepIdx)) {
                            const target = /\btargeting\s+(.+?)(?:\s+(?:from|to|in|on|with|and)\b|[,.;:]|$)/i
                                .exec(cleanCardName(steps[chainStepIdx].text || '').replace(LEADING_CLAUSE_RE, ''));
                            const targetCodes = !target ? []
                                : /^(?:itself|this card|it)$/i.test(target[1].trim()) ? [actorCode]
                                : findStepCardCodes({ text: target[1] }, null);
                            if (targetCodes.length > 0) tryMatchCodes(targetCodes, null, 1, steps[chainStepIdx]);
                            // "targeting your opponent's monster" names no card: take one the opponent controls
                            else if (target && /^(?:1\s+|a\s+|an\s+|one\s+)?(?:of\s+)?(?:your\s+)?opponent'?s\b/i.test(target[1].trim())) {
                                const oppIdx = m.selects.findIndex((c, j) => !chosen.includes(j) && c.controller === 1);
                                if (oppIdx !== -1) chosen.push(oppIdx);
                            }
                        }
                        // A step a little later that is about the resolving card ("LV7 triggers ... to search Drill Armed
                        // Dragon") says what its effect picks, even when it chained during another step's activation
                        if (actorCode) {
                            for (let s = chainStepIdx; s < Math.min(steps.length, chainStepIdx + 5) && chosen.length < maxSelect; s++) {
                                if (chainStepsConsumed.has(s) || skipForDiscard(s) || !stepSubjectCodes(s).includes(actorCode)) continue;
                                const objectCodes = findStepCardCodes(deckPickText(s), actorCode).filter(c => c !== actorCode);
                                // "Strategist's effect changes itself to Defense Position" picks the activating card, also
                                // when it targets on activation rather than on resolution
                                const selfPick = objectCodes.length === 0 && /\b(?:itself|this card)\b/i.test(steps[s]?.text || '');
                                if (!currentSolvingChainCard && !selfPick) continue;
                                const beforeLen = chosen.length;
                                tryMatchCodes(selfPick ? [actorCode] : objectCodes, null, 1, steps[s]);
                                if (chosen.length > beforeLen) {
                                    if (selectionCompletesStep(s, chosen.slice(beforeLen))) chainStepsConsumed.add(s);
                                    break;
                                }
                            }
                        }
                        // 0. Check the active step (chainStepIdx) first for explicit targets/costs
                        if (steps[chainStepIdx] && !chainStepsConsumed.has(chainStepIdx) && !chainStepIsSummonOfActor) {
                            const stepCodes = findStepCardCodes(deckPickText(chainStepIdx), actorCode);
                            const nonActorCodes = stepCodes.filter(c => c !== actorCode && !cardsSelectedSinceLastIdle.has(c));
                            if (options.debug) {
                                console.log('[DEBUG SELECT_CARD Phase 0] stepCodes:', stepCodes, 'nonActorCodes:', nonActorCodes);
                            }
                            if (nonActorCodes.length > 0) {
                                const beforeLen = chosen.length;
                                tryMatchCodes(nonActorCodes, null, 1, steps[chainStepIdx]);
                                if (chosen.length > beforeLen && selectionCompletesStep(chainStepIdx, chosen.slice(beforeLen))) {
                                    chainStepsConsumed.add(chainStepIdx);
                                }
                            }
                        }

                        // Check preceding cost / tribute steps right before a summon step (e.g. "Move to Graveyard X" -> "Special Summon Lubellion")
                        if (chosen.length < maxSelect && /^(?:(?:special\s+|normal\s+)?summon\b|ss\b)/i.test(steps[chainStepIdx]?.text || '')) {
                            for (let s = chainStepIdx - 1; s >= Math.max(0, chainStepIdx - 3); s--) {
                                if (chosen.length >= maxSelect) break;
                                if (chainStepsConsumed.has(s)) continue;
                                const st = steps[s];
                                if (!st) continue;
                                const stText = (st.text || '').toLowerCase();
                                const isPreSummonCost = st.to === 'zone-gy' || st.to === 'zone-banish' ||
                                    /^(?:tribute|move\s+(?:to\s+)?(?:gy|graveyard|banish)|send\s+(?:to\s+)?(?:gy|graveyard|banish))\b/i.test(stText);
                                if (isPreSummonCost) {
                                    const costCodes = findStepCardCodes(st, null);
                                    const beforeLen = chosen.length;
                                    tryMatchCodes(costCodes, null, 1, st);
                                    if (chosen.length > beforeLen) {
                                        chainStepsConsumed.add(s);
                                    }
                                } else {
                                    break;
                                }
                            }
                        }

                        // Phase 1: Check steps around chainStepIdx that explicitly mention actorCode
                        for (let s = Math.max(0, chainStepIdx - 2); s <= Math.min(steps.length - 1, chainStepIdx + 3); s++) {
                            if (chosen.length >= maxSelect) break;
                            if (chainStepsConsumed.has(s) || skipForDiscard(s)) continue;
                            if (s === chainStepIdx && chainStepIsSummonOfActor) continue;
                            if (s !== chainStepIdx && /^(?:(?:fusion|synchro|xyz|link|special|normal)?\s*summon\b|ss\b)/i.test(steps[s]?.text || '')) continue;
                            const stepCodes = findStepCardCodes(deckPickText(s), actorCode);
                            if (stepCodes.includes(actorCode)) {
                                const nonActorCodes = stepCodes.filter(c => c !== actorCode && !cardsSelectedSinceLastIdle.has(c));
                                if (options.debug) {
                                    console.log('[DEBUG SELECT_CARD Phase 1] s:', s, 'text:', steps[s]?.text, 'stepCodes:', stepCodes, 'nonActorCodes:', nonActorCodes);
                                }
                                if (nonActorCodes.length > 0) {
                                    const beforeLen = chosen.length;
                                    tryMatchCodes(nonActorCodes, null, 1, steps[s]);
                                    if (chosen.length > beforeLen && selectionCompletesStep(s, chosen.slice(beforeLen))) {
                                        chainStepsConsumed.add(s);
                                    }
                                } else if (/\b(?:itself|this card|himself|herself)\b/i.test(steps[s]?.text || '') && !/^activat(?:e|ing) effect\b/i.test(steps[s]?.text || '') && m.selects?.[0]?.location !== OcgLocation.DECK) {
                                    const beforeLen = chosen.length;
                                    tryMatchCodes([actorCode], null, 1, steps[s]);
                                    if (chosen.length > beforeLen && selectionCompletesStep(s, chosen.slice(beforeLen))) {
                                        chainStepsConsumed.add(s);
                                    }
                                }
                            }
                        }

                        // Phase 2: If still no card chosen, scan immediate subsequent passive resolution steps
                        if (chosen.length < maxSelect) {
                            for (let s = chainStepIdx + 1; s < Math.min(steps.length, Math.max(chainStepIdx + 8, stepIdx + 6)); s++) {
                                if (chosen.length >= maxSelect) break;
                                if (chainStepsConsumed.has(s) || skipForDiscard(s)) continue;
                                const stText = cleanCardName(steps[s]?.text || '').trim();
                                const isPassiveResolution = /^(?:move to|send to|add to|search|draw|discard|place|put|special summon|ss|set)\b/i.test(stText) ||
                                    /\b(?:to\s+(?:hand|gy|graveyard|spell\/trap\s+zone|field)|is\s+(?:added|sent|drawn|special summoned|summoned|set))\b/i.test(stText);
                                const chainStepCodes = findStepCardCodes(steps[s], actorCode);
                                const isTargetMoveStep = /^(?:special summon|ss|revive|move to|send to|send|mill|add|return|recover)\b/i.test(stText) ||
                                    steps[s]?.to?.startsWith('zone-m') ||
                                    Boolean(steps[s]?.actions?.some(a => a.to?.startsWith('zone-m')));
                                const nonActorChainCodes = chainStepCodes.filter(c => c !== actorCode && (!cardsSelectedSinceLastIdle.has(c) || isTargetMoveStep));

                                const candidateCodes = nonActorChainCodes.length > 0 ? nonActorChainCodes : (chainStepCodes.includes(actorCode) ? [actorCode] : []);
                                const hasMatchInSelects = candidateCodes.some(c => m.selects && m.selects.some(sel => sel.code === c));
                                const beforeLen = chosen.length;
                                if (options.debug) {
                                    console.log('[DEBUG SELECT_CARD Phase 2] s:', s, 'text:', steps[s]?.text, 'candidateCodes:', candidateCodes, 'chosen before:', beforeLen);
                                }
                                if (hasMatchInSelects) {
                                    tryMatchCodes(candidateCodes, null, 1, steps[s]);
                                    if (chosen.length > beforeLen && selectionCompletesStep(s, chosen.slice(beforeLen))) {
                                        chainStepsConsumed.add(s);
                                    }
                                    if (options.debug) {
                                        console.log('[DEBUG SELECT_CARD Phase 2 matched] chosen now:', chosen);
                                    }
                                    if (chosen.length >= maxSelect) break;
                                }

                                const isSameActor = chainStepCodes.includes(actorCode);
                                const isIntermediateActivate = /^activat(?:e|ing)\b/i.test(stText) && (s + 1 < steps.length && /^(?:special summon|normal summon|move to|place|equip)\b/i.test(cleanCardName(steps[s + 1]?.text || '')));
                                const isActiveCmd = /^(?:(?:normal|tribute|link|synchro|xyz)?\s*summon\b|contact fuse|contact fusion|activate\b|set\b(?!\s+from))/i.test(stText);
                                if (s >= stepIdx && !isSameActor && isActiveCmd && !isPassiveResolution && !isIntermediateActivate) break;
                            }
                        }
                    }

                    // "Activate Yuhi's effect, targeting the Dual Avatar Spirit Token": the Token, not Yuhi
                    if (chosen.length < maxSelect && m.selects?.length) {
                        const tokenStep = steps[chainStepIdx !== -1 ? chainStepIdx : Math.max(0, stepIdx - 1)];
                        if (/\b(?:target(?:ing|s)?|destroy(?:ing|s)?|tribut(?:e|ing))\b[^.]*?\btokens?\b/i.test(cleanCardName(tokenStep?.text || ''))) {
                            for (let i = 0; i < m.selects.length && chosen.length < maxSelect; i++) {
                                if (!chosen.includes(i) && ((getCardByCode(m.selects[i].code)?.type || 0) & 0x4000)) chosen.push(i);
                            }
                        }
                    }

                    // 1. Check the currently resolving step (stepIdx - 1) first, prioritizing non-actor target/cost codes not yet selected in this IDLECMD
                    const resolvingStepText = (stepIdx > 0 && steps[stepIdx - 1]?.text) ? steps[stepIdx - 1].text : '';
                    if (chosen.length < maxSelect && stepIdx > 0 && steps[stepIdx - 1]) {
                        const activeCodes = findStepCardCodes(steps[stepIdx - 1], lastActorCode);
                        const nonActorCodes = activeCodes.filter(c => c !== lastActorCode && !cardsSelectedSinceLastIdle.has(c));
                        const desiredLoc = getDesiredLocFromStep(steps[stepIdx - 1]);
                        tryMatchCodes(nonActorCodes, desiredLoc);
                    }

                    // Check if an upcoming or current step explicitly specifies moving a card from HAND to GY/banish/deck/discard
                    if (chosen.length < maxSelect && m.selects?.[0]?.location === OcgLocation.HAND) {
                        for (let s = Math.max(0, stepIdx - 1); s < Math.min(steps.length, stepIdx + 4); s++) {
                            if (chosen.length >= maxSelect) break;
                            const st = steps[s];
                            const stText = (st?.text || '').toLowerCase();
                            const isHandCostOrDiscardStep = st?.to === 'zone-gy' || st?.to === 'zone-banish' || st?.to === 'zone-deck' ||
                                /\b(?:discard|send\s+to\s+(?:gy|graveyard)|move\s+(?:to\s+)?(?:gy|graveyard|banish|banished|deck))\b/i.test(stText);
                            if (isHandCostOrDiscardStep) {
                                const stepCodes = findStepCardCodes(st, lastActorCode);
                                const nonActorCostCodes = stepCodes.filter(c => c !== lastActorCode);
                                tryMatchCodes(nonActorCostCodes.length > 0 ? nonActorCostCodes : stepCodes, OcgLocation.HAND);
                            }
                        }
                    }

                    // 2. Check upcoming steps (stepIdx .. stepIdx + 3), UNLESS selecting a card from HAND after already searching/selecting a card (e.g. "search X then discard a card")
                    // AND UNLESS a chain is resolving (where upcoming steps belong to future actions, not this resolving chain link!)
                    const isHandDiscardOrFollowup = m.selects?.[0]?.location === OcgLocation.HAND && (cardsSelectedSinceLastIdle.size > 0 || /\bdiscard\s+(?:a|an|1|one)\s+card\b/i.test(resolvingStepText));
                    if (chosen.length < maxSelect && !isHandDiscardOrFollowup && !currentSolvingChainCard) {
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                            if (chosen.length >= maxSelect) break;
                            const futureCodes = findStepCardCodes(steps[s], lastActorCode).filter(c => c !== lastActorCode && !cardsSelectedSinceLastIdle.has(c));
                            const desiredLoc = getDesiredLocFromStep(steps[s]);
                            tryMatchCodes(futureCodes, desiredLoc);
                        }
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                            if (chosen.length >= maxSelect) break;
                            const futureCodes = findStepCardCodes(steps[s], lastActorCode);
                            const desiredLoc = getDesiredLocFromStep(steps[s]);
                            tryMatchCodes(futureCodes, desiredLoc);
                        }
                    }

                    // 3. If still not enough, allow lastActorCode if mentioned in resolving step
                    if (chosen.length < maxSelect && stepIdx > 0 && steps[stepIdx - 1]) {
                        const activeCodes = findStepCardCodes(steps[stepIdx - 1], lastActorCode);
                        if (activeCodes.includes(lastActorCode)) {
                            tryMatchCodes([lastActorCode]);
                        }
                    }

                    // 4. Fill to minSelect if needed, preferring cards NOT needed as active starters in upcoming steps and NOT just searched (unless selecting from DECK/EXTRA, where we WANT needed cards)
                    if (chosen.length < minSelect && m.selects && m.selects.length > 0) {
                        const isDeckOrExtra = m.selects[0]?.location === OcgLocation.DECK || m.selects[0]?.location === OcgLocation.EXTRA;
                        const upcomingNeeded = new Set();
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 32); s++) {
                            const st = steps[s];
                            const stText = (st?.text || '').toLowerCase();
                            const isDiscardStep = st?.to === 'zone-gy' || st?.to === 'zone-banish' || st?.to === 'zone-deck' ||
                                /\b(?:discard|send\s+to\s+(?:gy|graveyard)|move\s+(?:to\s+)?(?:gy|graveyard|banish|banished|deck))\b/i.test(stText);
                            if (!isDiscardStep) {
                                for (const c of findStepCardCodes(steps[s], lastActorCode)) upcomingNeeded.add(c);
                            }
                        }
                        if (isDeckOrExtra) {
                            for (let i = 0; i < m.selects.length && chosen.length < minSelect; i++) {
                                if (!chosen.includes(i) && upcomingNeeded.has(m.selects[i].code) && !cardsSelectedSinceLastIdle.has(m.selects[i].code)) {
                                    chosen.push(i);
                                }
                            }
                            for (let i = 0; i < m.selects.length && chosen.length < minSelect; i++) {
                                if (!chosen.includes(i) && upcomingNeeded.has(m.selects[i].code)) {
                                    chosen.push(i);
                                }
                            }
                        } else {
                            for (let i = 0; i < m.selects.length && chosen.length < minSelect; i++) {
                                if (!chosen.includes(i) && !upcomingNeeded.has(m.selects[i].code) && !cardsSelectedSinceLastIdle.has(m.selects[i].code)) {
                                    chosen.push(i);
                                }
                            }
                            for (let i = 0; i < m.selects.length && chosen.length < minSelect; i++) {
                                if (!chosen.includes(i) && !upcomingNeeded.has(m.selects[i].code)) {
                                    chosen.push(i);
                                }
                            }
                        }
                        for (let i = 0; i < m.selects.length && chosen.length < minSelect; i++) {
                            if (!chosen.includes(i)) chosen.push(i);
                        }
                    }

                    let finalIndices = chosen.length > 0 ? chosen : [0];
                    if (m.selects && m.selects.length > 1) {
                        const selects = m.selects;
                        finalIndices = recordDecision('SELECT_CARD', finalIndices, buildSelectAlternatives(finalIndices, selects), {
                            confident: isCostSelection(selects)
                                ? finalIndices.every(i => !isNeededLater(selects[i]?.code))
                                : finalIndices.every(i => isMentionedNear(selects[i]?.code)),
                            describe: (choice) => choice.map(i => codeName(selects[i]?.code)).join(', '),
                            codesOf: (choice) => choice.map(i => selects[i]?.code)
                        });
                        if (decisionLog[decisionLog.length - 1].overridden) {
                            // Steps marked done because the default pick matched them are not done under the alternative pick
                            chainStepsConsumed.clear();
                            for (const s of consumedBeforeSelect) chainStepsConsumed.add(s);
                        }
                    }
                    for (const idx of finalIndices) {
                        if (m.selects?.[idx]?.code) {
                            cardsSelectedSinceLastIdle.add(m.selects[idx].code);
                            lastSelectedCardCode = m.selects[idx].code;
                        }
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_CARD,
                        indicies: finalIndices
                    });

                    const selNames = finalIndices.map(idx => {
                        const c = m.selects?.[idx];
                        const name = c ? getCardByCode(c.code)?.name : null;
                        return name ? `${name} (${c.code})` : `code ${c?.code ?? idx}`;
                    });
                    log.push(`Selected: ${selNames.join(', ')} from location ${m.selects?.[finalIndices[0]]?.location}`);

                } else if (m.type === 18) { // SELECT_PLACE
                    // Placing a card on the field
                    const activeStep = (currentActiveStepIdx != null && steps[currentActiveStepIdx])
                        ? steps[currentActiveStepIdx]
                        : (steps[stepIdx - 1] || steps[stepIdx]);
                    const prevStep = steps[stepIdx - 1];
                    const avail = getAvailablePlaces(m.field_mask);

                    let chosenPlace = avail[0] || { player: 0, location: OcgLocation.MZONE, sequence: 2 };
                    if (options.debug) {
                        console.log('[DEBUG SELECT_PLACE]', 'stepIdx:', stepIdx, 'currentActiveStepIdx:', currentActiveStepIdx, 'activeStep:', activeStep?.text, 'm:', JSON.stringify(m), 'avail:', avail);
                    }

                    const isFieldZoneStr = (z) => {
                        if (!z) return false;
                        return z.startsWith('zone-m') || z.startsWith('zone-s') || z.startsWith('zone-em') || z === 'zone-field';
                    };

                    const getTargetZoneForCard = (step, cardCode) => {
                        if (!step) return null;
                        if (step.actions && step.actions.length > 0) {
                            const act = step.actions.find(a => {
                                if (!a.to || a.isOverlay || !isFieldZoneStr(a.to)) return false;
                                if (cardCode && a.card && idMap.has(a.card)) {
                                    return idMap.get(a.card).code === cardCode;
                                }
                                return !cardCode;
                            });
                            if (act) return act.to;
                        }
                        if (step.to && isFieldZoneStr(step.to) && (!step.card || (cardCode && idMap.has(step.card) && idMap.get(step.card).code === cardCode) || !cardCode)) {
                            return step.to;
                        }
                        return null;
                    };

                    let targetZoneStr = null;
                    if (lastHintCardCode) {
                        const scanOrder = [];
                        if (currentActiveStepIdx != null) scanOrder.push(currentActiveStepIdx);
                        if (stepIdx > 0 && !scanOrder.includes(stepIdx - 1)) scanOrder.push(stepIdx - 1);
                        if (!scanOrder.includes(stepIdx)) scanOrder.push(stepIdx);
                        for (let s = Math.max(0, stepIdx - 4); s <= Math.min(steps.length - 1, stepIdx + 6); s++) {
                            if (!scanOrder.includes(s)) scanOrder.push(s);
                        }
                        for (const s of scanOrder) {
                            const stepCodes = findStepCardCodes(steps[s], lastActorCode);
                            if (stepCodes.includes(lastHintCardCode)) {
                                const z = getTargetZoneForCard(steps[s], lastHintCardCode);
                                if (z) {
                                    targetZoneStr = z;
                                    break;
                                }
                            }
                        }
                    }
                    if (!targetZoneStr) {
                        targetZoneStr = getTargetZoneForCard(activeStep, null) || getTargetZoneForCard(prevStep, null);
                    }
                    lastHintCardCode = null;

                    let targetZoneMatched = false;
                    // The write-up's own zone instruction beats a guessed zone
                    const wantsArrowFreeZone = /\b(?:does not|doesn't|do not|don't)\s+point\s+to\b/i.test(activeStep?.text || '');
                    // "Special Summon Laurel to a zone Jasmine points to": a linked zone, not the builder's guessed one
                    const wantsLinkedZone = !wantsArrowFreeZone && /\bzones?\s+(?:that\s+)?[^,.;]{1,60}?\bpoints?\s+to\b/i.test(activeStep?.text || '');
                    if (targetZoneStr && !wantsArrowFreeZone && !wantsLinkedZone) {
                        const reqZone = parseZone(targetZoneStr);
                        if (reqZone) {
                            const match = avail.find(p => p.location === reqZone.location && p.sequence === reqZone.sequence);
                            if (match) {
                                chosenPlace = match;
                                targetZoneMatched = true;
                            }
                        }
                    }
                    // A guessed zone that's taken (the builder's "zone-em-left" while Balelynx sits there) falls back to
                    // the arrow-aware choice below rather than the first free zone
                    if (!targetZoneMatched && avail.some(p => p.player === 0 && p.location === OcgLocation.MZONE && p.sequence < 5)) {
                        // Prefer zones pointed to by any Link Monster currently on Player 0's field
                        const mzoneCards = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE }) || [];
                        const linkedSeqs = new Set();
                        for (let seq = 0; seq < mzoneCards.length; seq++) {
                            const mc = mzoneCards[seq];
                            if (!mc || !mc.code) continue;
                            const cData = getCardByCode(mc.code);
                            if (cData && (cData.type & 0x4000000)) {
                                const markers = cData.link_marker || cData.def || 0;
                                if (seq === 5) {
                                    if (markers & 0x002) linkedSeqs.add(1);
                                    if (markers & 0x001) linkedSeqs.add(0);
                                    if (markers & 0x004) linkedSeqs.add(2);
                                } else if (seq === 6) {
                                    if (markers & 0x002) linkedSeqs.add(3);
                                    if (markers & 0x001) linkedSeqs.add(2);
                                    if (markers & 0x004) linkedSeqs.add(4);
                                } else if (seq < 5) {
                                    if ((markers & 0x008) && seq > 0) linkedSeqs.add(seq - 1);
                                    if ((markers & 0x020) && seq < 4) linkedSeqs.add(seq + 1);
                                }
                            }
                        }
                        const linkedPlace = avail.find(p => p.player === 0 && p.location === OcgLocation.MZONE && linkedSeqs.has(p.sequence));
                        // "Link Summon Sunlight Wolf ... in a Main Monster Zone that Balelynx does not point to" keeps that
                        // zone free for a later "Special Summon Jack Jaguar to the zone Balelynx points to"
                        const freeOfArrows = wantsArrowFreeZone
                            ? avail.find(p => p.player === 0 && p.location === OcgLocation.MZONE && p.sequence < 5 && !linkedSeqs.has(p.sequence))
                            : null;
                        if (freeOfArrows) chosenPlace = freeOfArrows;
                        else if (linkedPlace) chosenPlace = linkedPlace;
                    }

                    // Monster zone choice decides later Link arrows and Extra Monster Zone access: offer an EMZ/main-zone swap and other main zones
                    if (chosenPlace.player === 0 && chosenPlace.location === OcgLocation.MZONE) {
                        const others = avail.filter(p => p.player === 0 && p.location === OcgLocation.MZONE && p.sequence !== chosenPlace.sequence);
                        const placeAlternatives = [
                            ...others.filter(p => (p.sequence >= 5) !== (chosenPlace.sequence >= 5)).slice(0, 1),
                            ...others.filter(p => (p.sequence >= 5) === (chosenPlace.sequence >= 5)).slice(0, 2)
                        ];
                        if (placeAlternatives.length > 0) {
                            chosenPlace = recordDecision('PLACE', chosenPlace, placeAlternatives, {
                                confident: Boolean(targetZoneStr),
                                describe: (p) => ocgLocPosToZone(p)
                            });
                        }
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_PLACE,
                        places: [chosenPlace]
                    });

                } else if (m.type === 16) { // SELECT_CHAIN
                    let chainIdx = null;
                    const chainOverride = (m.selects && m.selects.length > 0) ? peekDecisionOverride() : { has: false };
                    if (chainOverride.has) {
                        chainIdx = chainOverride.value;
                        if (chainIdx !== null) {
                            triggersFiredSinceLastIdle++;
                            lastActorCode = m.selects[chainIdx].code;
                            currentActiveStepIdx = Math.max(0, stepIdx - 1);
                            log.push(`Chain Trigger Accepted for ${codeName(m.selects[chainIdx].code)} (${m.selects[chainIdx].code})`);
                        }
                    } else if (m.selects && m.selects.length > 0) {
                        if (options.debug) {
                            console.log('[DEBUG SELECT_CHAIN selects]', m.selects.map(x => ({ code: x.code, name: getCardByCode(x.code)?.name, loc: x.location })));
                        }
                        if (m.forced) {
                            chainIdx = 0;
                        }
                        if (inOpponentTurn && stepIdx < steps.length) {
                            const oppCodes = findStepCardCodes(steps[stepIdx], lastActorCode);
                            const foundOpp = m.selects.findIndex(c => oppCodes.includes(c.code));
                            if (foundOpp !== -1) {
                                chainIdx = foundOpp;
                                lastActorCode = m.selects[foundOpp].code;
                                const oppCode = m.selects[foundOpp].code;
                                const oppName = getCardByCode(oppCode)?.name || oppCode;
                                log.push(`Step ${stepIdx + 1}: Legal Opponent-Turn Activation of ${oppName} (${oppCode})`);
                                currentActiveStepIdx = stepIdx;
                                stepIdx++;
                                skipRedundantVisualSteps();
                            }
                        }
                        // "Woes Sets itself, and Astellar Special Summons itself": one sentence describing two triggers.
                        // After the first trigger claimed it, the step just passed still covers the other cards it names
                        // ("Activate Retainer in GY, sending Ghost to revive itself": Retainer revives, Ghost is the cost)
                        const prevTriggerStep = stepIdx > 0 ? cleanCardName(steps[stepIdx - 1]?.text || '')
                            .replace(/(?:,\s*|\bby\s+)(?:send|discard|tribut|detach|banish)\w*\s+[^,.;]*/gi, '') : '';
                        if (chainIdx === null && /\b(?:special summons?|summons?|sets?|adds?|revives?|returns?)\s+(?:itself|himself|herself)\b/i.test(prevTriggerStep)) {
                            const prevIdx = m.selects.findIndex(c => stepNamedCodes[stepIdx - 1]?.has(c.code) &&
                                new RegExp(`\\b${[...(nameVariants.get(c.code) || [])].map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}\\b[^,.;]*?\\b(?:special summons?|summons?|sets?|adds?|revives?|returns?)\\s+(?:itself|himself|herself)`, 'i').test(prevTriggerStep));
                            if (prevIdx !== -1) {
                                chainIdx = prevIdx;
                                triggersFiredSinceLastIdle++;
                                lastActorCode = m.selects[prevIdx].code;
                                log.push(`Chain Trigger Accepted for ${codeName(m.selects[prevIdx].code)} (${m.selects[prevIdx].code})`);
                            }
                        }
                        if (chainIdx === null) {
                            skipRedundantVisualSteps();
                            if (options.debug && m.selects?.some(c => c.code === 62089826)) {
                                console.log('[DEBUG SELECT_CHAIN True Light]', m.selects.map(c => ({ code: c.code, desc: getEffectDescription(c.description), rawDesc: c.description })));
                            }
                            for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                                const stText = steps[s]?.text || '';
                                // Passive voice in a reason clause ("... because a Spell/Trap was sent ...") doesn't make the step passive
                                const mainClause = stText.replace(/\b(?:because|since|as|when|after|while|once)\b.*$/i, '');
                                const isPassive = /\b(?:is|are|was|were)\s+(?:added|sent|special summoned|summoned|tributed|banished|placed|set|drawn|discarded|excavated|destroyed)\b/i.test(mainClause) ||
                                    /^(?:move|send|draw)\s+to\s+(?:the\s+)?(?:graveyard|hand|spell\/trap\s+zone|field|gy|deck|banished|banish)\b/i.test(stText) ||
                                    /^set\b/i.test(stText) ||
                                    /^add\s+[a-z0-9"',\s-]+?\s+to\s+(?:the\s+)?hand\b/i.test(stText) ||
                                    chainStepsConsumed.has(s);
                                if (isPassive) continue;
                                if (SUMMON_COMMAND_STEP_RE.test(cleanCardName(stText).replace(LEADING_CLAUSE_RE, ''))) continue;
                                const isExplicitTriggerStep = /(?:chain link \d|a chain forms|\bchain\b|in response|summon trigger|turns on|when .* is (?:sent|destroyed|summoned)|triggered\b)/i.test(stText) ||
                                    /^[A-Z][A-Za-z0-9"',\s-]+?\s+effect\s+(?:sends?|adds?|places?|sets?|triggers?|resolves?|special\s+summons?|summons?|revives?)\b/i.test(stText);
                                if (s > stepIdx && !isExplicitTriggerStep) continue;

                                const isSearchTargetCard = steps[s]?.to === 'zone-hand' || steps[s]?.to === 'zone-deck' || /\b(?:to\s+(?:hand|deck)|adds?\b|searches?\b)/i.test(stText);
                                const stepCard = isSearchTargetCard ? null : steps[s]?.card;
                                // ", sending Ghost to revive itself" names a cost, not a card to chain
                                const chainActorText = stText
                                    .replace(/(?:,\s*|\bby\s+)(?:send|discard|tribut|detach|banish)\w*\s+[^,.;]*/gi, '')
                                    .replace(/\b(?:to\s+(?:search|add|send|dump|set)|searches|adds|sets|sends)\b.*$/i, '');
                                const codes = findStepCardCodes({ ...steps[s], text: chainActorText, card: stepCard, featuredCard: null }, lastActorCode);
                                const matchingIndices = [];
                                for (let i = 0; i < m.selects.length; i++) {
                                    if (codes.includes(m.selects[i].code)) matchingIndices.push(i);
                                }
                                if (matchingIndices.length > 0) {
                                    const contextText = [
                                        steps[s]?.text,
                                        steps[s + 1]?.text,
                                        steps[s + 2]?.text
                                    ].filter(Boolean).join(' ');
                                    let found = matchingIndices[0];
                                    let bestScore = -Infinity;
                                    for (const idx of matchingIndices) {
                                        const entry = m.selects[idx];
                                        const descStr = getEffectDescription(entry.description);
                                        const sc = scoreEffectDescAgainstStep(descStr, contextText, false, entry.description);
                                        if (sc > bestScore) {
                                            bestScore = sc;
                                            found = idx;
                                        }
                                    }

                                    // If the step specifies a concrete effect action (summon, search, send, draw, destroy, etc.)
                                    // and the best matching effect in SELECT_CHAIN scores <= 0 and has a mismatched effect description,
                                    // do not prematurely chain an unrelated Quick Effect; defer to IDLECMD!
                                    const expectsSpecificAction = /(?:special summon|\bsummon\b|\brevives?\b|search|add .* to hand|\bsend\b|\bdump\b|foolish|draw\b|destroy\b)/i.test(contextText);
                                    const bestDesc = (found != null && m.selects[found]) ? getEffectDescription(m.selects[found].description) : '';
                                    if (!m.forced && !isExplicitTriggerStep && expectsSpecificAction && bestDesc && bestScore <= 0) {
                                        continue;
                                    }

                                    chainIdx = found;
                                    if (s === stepIdx) {
                                        lastActorCode = m.selects[found].code;
                                        currentActiveStepIdx = stepIdx;
                                        stepIdx++;
                                        skipRedundantVisualSteps();
                                    }
                                    break;
                                }
                            }
                            if (chainIdx !== null) {
                                triggersFiredSinceLastIdle++;
                                currentActiveStepIdx = Math.max(0, stepIdx - 1);
                                const chainCode = m.selects[chainIdx].code;
                                const chainName = getCardByCode(chainCode)?.name || chainCode;
                                log.push(`Chain Trigger Accepted for ${chainName} (${chainCode})`);
                            }
                        }
                    }
                    if (m.selects && m.selects.length > 0) {
                        // Alternatives: not chaining (when optional) or chaining another card the combo mentions
                        const chainSelects = m.selects;
                        const chainAlternatives = (chainIdx !== null && !m.forced) ? [null] : [];
                        const seenChain = new Set();
                        for (let i = 0; i < chainSelects.length && chainAlternatives.length < 3; i++) {
                            const k = `${chainSelects[i].code}:${chainSelects[i].description}`;
                            if (i === chainIdx || seenChain.has(k)) continue;
                            seenChain.add(k);
                            if (comboMentionedCodes.has(chainSelects[i].code)) chainAlternatives.push(i);
                        }
                        // With an override the heuristic default was never computed; it was the opposite of the override
                        const chainDefault = chainOverride.has ? (chainIdx === null ? -1 : null) : chainIdx;
                        recordDecision('CHAIN', chainDefault, chainAlternatives, {
                            confident: chainIdx === null ? chainAlternatives.length === 0 : isMentionedNear(chainSelects[chainIdx].code),
                            describe: (i) => (i === null ? 'not chaining' : i === -1 ? 'chaining an effect' : `chain ${codeName(chainSelects[i].code)}`),
                            codesOf: (i) => (i === null || i === -1 ? [] : [chainSelects[i].code])
                        });
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_CHAIN,
                        index: chainIdx
                    });

                } else if (m.type === 21 || m.type === 25) { // SORT_CHAIN or SORT_CARD
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SORT_CARD,
                        order: null
                    });

                } else if (m.type === 19) { // SELECT_POSITION
                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    const wantsDefense = /defense position/i.test(resolvingStep?.text || '');
                    const mask = m.positions || OcgPosition.FACEUP_ATTACK;
                    let pos = OcgPosition.FACEUP_ATTACK;
                    if (wantsDefense && (mask & OcgPosition.FACEUP_DEFENSE)) {
                        pos = OcgPosition.FACEUP_DEFENSE;
                    } else if (mask & OcgPosition.FACEUP_ATTACK) {
                        pos = OcgPosition.FACEUP_ATTACK;
                    } else if (mask & OcgPosition.FACEUP_DEFENSE) {
                        pos = OcgPosition.FACEUP_DEFENSE;
                    } else if (mask & OcgPosition.FACEDOWN_DEFENSE) {
                        pos = OcgPosition.FACEDOWN_DEFENSE;
                    } else if (mask & OcgPosition.FACEDOWN_ATTACK) {
                        pos = OcgPosition.FACEDOWN_ATTACK;
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_POSITION,
                        position: pos
                    });

                } else if (m.type === OcgMessageType.SELECT_OPTION || m.type === 14) { // SELECT_OPTION
                    let optIdx = 0;
                    const baseIdx = (currentSolvingChainCard?.stepIdx != null && currentSolvingChainCard.stepIdx >= 0)
                        ? currentSolvingChainCard.stepIdx
                        : (currentActiveStepIdx != null && currentActiveStepIdx >= 0 ? currentActiveStepIdx : stepIdx);
                    const contextSteps = [];
                    for (let s = baseIdx; s <= Math.min(steps.length - 1, baseIdx + 4); s++) {
                        if (steps[s]?.text) contextSteps.push(steps[s].text);
                    }
                    if (contextSteps.length <= 1) {
                        for (let s = Math.max(0, stepIdx - 1); s <= Math.min(steps.length - 1, stepIdx + 2); s++) {
                            if (steps[s]?.text) contextSteps.push(steps[s].text);
                        }
                    }
                    const contextText = contextSteps.join(' ');
                    const nextStep = steps[stepIdx] || null;
                    const opts = m.options || [];

                    if (opts.length > 1) {
                        const optDescs = opts.map(o => getEffectDescription(o));
                        // The step that names the card offering the choice ("Arrive in Light's effect draws 1 card")
                        // outweighs a later step that happens to share words with another option
                        const optCardCode = opts.length ? Number(BigInt(opts[0]) >> 20n) : 0;
                        // (only a sentence that says what the effect does: "X's effect draws ...", not "Send to GY X")
                        const ownStep = optCardCode ? [stepIdx, stepIdx + 1, stepIdx - 1, stepIdx + 2]
                            .map(s => steps[s]).find(st => st && /'s effect\s+(?!:)\w+/i.test(st.text || '') &&
                                findStepCardCodes(st, null).includes(optCardCode)) : null;
                        let bestScore = -Infinity;
                        for (let i = 0; i < opts.length; i++) {
                            let sc = scoreEffectDescAgainstStep(optDescs[i], contextText, false, opts[i]) +
                                (ownStep ? 3 * scoreEffectDescAgainstStep(optDescs[i], ownStep.text || '', false, opts[i]) : 0);
                            const dLower = (optDescs[i] || '').toLowerCase();
                            // Level modulation check against upcoming Synchro/Xyz summon
                            if (/\b(?:decrease|reduce|increase|raise)\b/i.test(dLower)) {
                                let upcomingSummonStep = null;
                                let upcomingSummonCard = null;
                                for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 15); s++) {
                                    const st = steps[s];
                                    if (!st) continue;
                                    const stCodes = findStepCardCodes(st, lastActorCode);
                                    for (const c of stCodes) {
                                        const cData = getCardByCode(c);
                                        if (cData && (cData.type & 0x2000)) { // Synchro Monster
                                            upcomingSummonStep = st;
                                            upcomingSummonCard = cData;
                                            break;
                                        }
                                    }
                                    if (upcomingSummonCard) break;
                                }

                                if (upcomingSummonCard) {
                                    let materialLvSum = 0;
                                    if (upcomingSummonStep.actions && upcomingSummonStep.actions.length > 0) {
                                        for (const act of upcomingSummonStep.actions) {
                                            if (act.to === 'zone-gy' || act.to === 'zone-banish' || (act.fromZone && (act.fromZone.startsWith('zone-m') || act.fromZone.startsWith('zone-em')))) {
                                                const c = idMap.get(act.card);
                                                if (c && c.code) {
                                                    const cd = getCardByCode(c.code);
                                                    if (cd && cd.level) {
                                                        materialLvSum += cd.level;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (materialLvSum === 0) {
                                        const mzoneCards = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE });
                                        for (const mc of (mzoneCards || [])) {
                                            if (mc && mc.level) materialLvSum += mc.level;
                                        }
                                    }
                                    if (/\b(?:decrease|reduce)\b/i.test(dLower) && materialLvSum > upcomingSummonCard.level) {
                                        sc += 20;
                                    } else if (/\b(?:increase|raise)\b/i.test(dLower) && materialLvSum < upcomingSummonCard.level) {
                                        sc += 20;
                                    }
                                }
                            }
                            if (sc > bestScore) {
                                bestScore = sc;
                                optIdx = i;
                            }
                        }
                        if (bestScore <= 0 && /sends itself|send itself|\brevives?\b|\bdecrease\b|\breduce\b|\badd\b.*\bback\b|\btwo\b/i.test(contextText)) {
                            optIdx = 1;
                        }
                        optIdx = recordDecision('OPTION', optIdx, opts.map((_, i) => i).filter(i => i !== optIdx), {
                            confident: bestScore > 0,
                            describe: (i) => `option "${getEffectDescription(opts[i]) || i + 1}"`
                        });
                    }
                    if (options.debug) {
                        const optDescs = (m.options || []).map(o => getEffectDescription(o));
                        console.log('[DEBUG SELECT_OPTION]', { opts: m.options, optDescs, contextText, optIdx, stepIdx });
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_OPTION,
                        index: optIdx
                    });

                } else if (m.type === OcgMessageType.SELECT_TRIBUTE || m.type === 20) { // SELECT_TRIBUTE
                    const chosen = [];
                    const minSelect = m.min || 1;
                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    const activeCodes = findStepCardCodes(resolvingStep, lastActorCode);
                    for (const code of activeCodes) {
                        if (chosen.length >= minSelect) break;
                        const idx = (m.selects || []).findIndex((c, i) => c.code === code && !chosen.includes(i));
                        if (idx !== -1) chosen.push(idx);
                    }
                    for (let i = 0; i < (m.selects || []).length && chosen.length < minSelect; i++) {
                        if (!chosen.includes(i)) chosen.push(i);
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_TRIBUTE,
                        indicies: chosen.length > 0 ? chosen : [0]
                    });

                } else if (m.type === OcgMessageType.SELECT_UNSELECT_CARD || m.type === 26) { // SELECT_UNSELECT_CARD
                    const selectCards = m.select_cards || [];
                    const unselectCards = m.unselect_cards || [];
                    const minSelect = m.min || 1;
                    const maxSelect = m.max || 1;

                    let activeStep = null;
                    const actionStepCandidates = [
                        currentActiveStepIdx != null ? steps[currentActiveStepIdx] : null,
                        stepIdx > 0 ? steps[stepIdx - 1] : null,
                        steps[stepIdx],
                        steps[stepIdx + 1]
                    ];
                    for (const cand of actionStepCandidates) {
                        if (cand?.actions && cand.actions.length > 0) {
                            if (lastActorCode && findStepCardCodes(cand, lastActorCode).includes(lastActorCode)) {
                                activeStep = cand;
                                break;
                            }
                        }
                    }
                    if (!activeStep) {
                        for (const cand of actionStepCandidates) {
                            if (cand?.actions && cand.actions.length > 0) {
                                activeStep = cand;
                                break;
                            }
                        }
                    }
                    if (!activeStep) {
                        activeStep = (currentActiveStepIdx != null && steps[currentActiveStepIdx])
                            ? steps[currentActiveStepIdx]
                            : (steps[stepIdx - 1] || steps[stepIdx]);
                    }

                    const stepMaterialCodes = [];
                    if (activeStep?.actions && activeStep.actions.length > 0) {
                        for (const act of activeStep.actions) {
                            if (act.isOverlay || act.to === 'zone-gy' || act.to === 'zone-banish' || act.to === 'zone-deck' || act.to === 'zone-extra' || act.to?.startsWith('material:')) {
                                if (act.card && idMap.has(act.card)) {
                                    stepMaterialCodes.push(idMap.get(act.card).code);
                                }
                            }
                        }
                    }
                    if (stepMaterialCodes.length === 0) {
                        const checkIdx = currentActiveStepIdx != null ? currentActiveStepIdx : stepIdx;
                        // 1. Scan preceding steps backwards (e.g. materials listed immediately before summon)
                        for (let s = checkIdx - 1; s >= Math.max(0, checkIdx - 6); s--) {
                            const st = steps[s];
                            if (!st) continue;
                            const stText = (st.text || '').toLowerCase();
                            const isSummon = /^(?:(?:fusion|synchro|xyz|link|special)?\s*summon\b|ss\b)/i.test(stText);
                            const isMaterialMove = /^(?:banish|send\s+to\s+(?:gy|graveyard)|move\s+to\s+(?:gy|graveyard|banish)|tribute)\b/i.test(stText) ||
                                st.to === 'zone-banish' || st.to === 'zone-gy';
                            if (isMaterialMove && !isSummon) {
                                const codes = findStepCardCodes(st, null);
                                for (const c of codes) {
                                    stepMaterialCodes.push(c);
                                }
                            } else {
                                break;
                            }
                        }
                        // 2. Scan subsequent steps forwards (e.g. materials listed between activation and summon)
                        if (stepMaterialCodes.length === 0) {
                            const startS = checkIdx + 1;
                            for (let s = startS; s < Math.min(steps.length, startS + 8); s++) {
                                const st = steps[s];
                                if (!st) continue;
                                const stText = (st.text || '').toLowerCase();
                                const isSummon = /^(?:(?:fusion|synchro|xyz|link|special)?\s*summon\b|ss\b)/i.test(stText);
                                const isMaterialMove = /^(?:banish|send\s+to\s+(?:gy|graveyard)|move\s+to\s+(?:gy|graveyard|banish)|tribute)\b/i.test(stText) ||
                                    st.to === 'zone-banish' || st.to === 'zone-gy';
                                if (isMaterialMove && !isSummon) {
                                    const codes = findStepCardCodes(st, null);
                                    for (const c of codes) {
                                        stepMaterialCodes.push(c);
                                    }
                                } else if (isSummon) {
                                    break;
                                }
                            }
                        }
                    }
                    // 3. The summon sentence names its own materials: "Xyz Summon Crest using Gryphon and Amphisbaena"
                    // A cost sentence names what it sends: "activate Unleashed, sending Basiltrice and Gorgoneio from your Deck to the GY"
                    // A material prompt (Fusion/Synchro/Xyz/Link hint) inside an effect ("Invitation's effect Fusion Summons
                    // Un-Gyo using two Tokens") reads the step whose summon target was just picked from the Extra Deck
                    if (stepMaterialCodes.length === 0 && [511, 512, 513, 533].includes(lastHintCardCode) && currentSolvingChainCard) {
                        for (let s = Math.max(0, stepIdx - 2); s <= Math.min(steps.length - 1, stepIdx + 1); s++) {
                            const target = findStepCardCodes(steps[s], null)
                                .find(c => cardsSelectedSinceLastIdle.has(c) && ((getCardByCode(c)?.type || 0) & 0x4802040));
                            if (target && /\busing\b/i.test(steps[s]?.text || '')) {
                                activeStep = steps[s];
                                break;
                            }
                        }
                    }
                    // While Nue's own on-summon effect resolves, "Link Summon Nue using Bunbuku and Yamarashi" lists its materials,
                    // not what the effect picks: read the steps that describe the effect instead
                    const activeStepSummonsResolver = Boolean(currentSolvingChainCard && activeStep?.text &&
                        /\b(?:summon|tune|overlay|link|synchro|xyz|fuse|fusion|into)\b/i.test(activeStep.text) &&
                        // "Invitation's effect Fusion Summons Un-Gyo using ..." names the resolver as the subject, not the summon
                        !/^[^,.;]*?'s\s+effect\b/i.test(cleanCardName(activeStep.text)) &&
                        findStepCardCodes(activeStep, null)[0] === currentSolvingChainCard.code);
                    if (stepMaterialCodes.length === 0 && activeStepSummonsResolver) {
                        const actor = currentSolvingChainCard.code;
                        const offered = new Set([...selectCards, ...unselectCards].map(c => c.code));
                        for (let s = Math.max(0, stepIdx - 1); s <= Math.min(steps.length - 1, stepIdx + 2) && stepMaterialCodes.length === 0; s++) {
                            for (const c of findStepCardCodes(steps[s], actor)) {
                                if (c !== actor && offered.has(c) && !cardsSelectedSinceLastIdle.has(c)) stepMaterialCodes.push(c);
                            }
                        }
                    }
                    if (stepMaterialCodes.length === 0 && activeStep?.text && !activeStepSummonsResolver) {
                        const stepText = cleanCardName(activeStep.text).replace(/^with\b.{0,160}?\bin (?:your )?hand,\s*/i, '');
                        const usingClause = /\b(?:using|with)\s+(.+?)(?:\(|\.|;|$)/i.exec(stepText) ||
                            /\b(?:sending|discarding|banishing|tributing|detaching)\s+(.+?)(?:\bfrom\b|\bto\s+(?:the\s+)?(?:gy|graveyard)\b|\(|\.|;|$)/i.exec(stepText);
                        if (usingClause) {
                            const offered = new Set([...selectCards, ...unselectCards].map(c => c.code));
                            for (const c of findStepCardCodes({ text: usingClause[1] }, null)) {
                                if (offered.has(c)) stepMaterialCodes.push(c);
                            }
                            // "using two Dual Avatar Spirit Tokens": Tokens are never registered as named cards
                            const tokenCount = /\b(one|a|an|two|three|four|five|[1-5])\s+[^,.;]*?\btokens?\b/i.exec(usingClause[1]);
                            const tokenCode = [...selectCards, ...unselectCards].find(c => (getCardByCode(c.code)?.type || 0) & 0x4000)?.code;
                            if (tokenCount && tokenCode) {
                                const n = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5 }[tokenCount[1].toLowerCase()] || Number(tokenCount[1]);
                                for (let i = 0; i < n; i++) stepMaterialCodes.push(tokenCode);
                            }
                        }
                    }
                    if (options.debug) {
                        console.log('[DEBUG SELECT_UNSELECT]', { stepIdx, currentActiveStepIdx, stepMaterialCodes, selectCodes: selectCards.map(c => c.code), unselectCodes: unselectCards.map(c => c.code), can_finish: m.can_finish });
                    }

                    let chosenIdx = null;

                    if (stepMaterialCodes.length > 0) {
                        const requiredCounts = new Map();
                        for (const c of stepMaterialCodes) {
                            requiredCounts.set(c, (requiredCounts.get(c) || 0) + 1);
                        }
                        const selectedCounts = new Map();
                        for (const u of unselectCards) {
                            selectedCounts.set(u.code, (selectedCounts.get(u.code) || 0) + 1);
                        }

                        let allSatisfied = true;
                        for (const [code, reqCount] of requiredCounts.entries()) {
                            if ((selectedCounts.get(code) || 0) < reqCount) {
                                allSatisfied = false;
                                break;
                            }
                        }

                        if (m.can_finish && allSatisfied) {
                            chosenIdx = null;
                        } else if (selectCards.length > 0) {
                            for (let i = 0; i < selectCards.length; i++) {
                                const code = selectCards[i].code;
                                const req = requiredCounts.get(code) || 0;
                                const sel = selectedCounts.get(code) || 0;
                                if (sel < req) {
                                    chosenIdx = i;
                                    break;
                                }
                            }
                        }
                    }

                    if (chosenIdx === null && !(stepMaterialCodes.length > 0 && m.can_finish)) {
                        // 0. Check if a nearby step explicitly specifies moving a card to GY / banish / extra as cost
                        const costCandidateCodes = [];
                        for (let s = Math.max(0, stepIdx - 3); s <= Math.min(steps.length - 1, stepIdx + 2); s++) {
                            if (chainStepsConsumed.has(s)) continue;
                            const st = steps[s];
                            const stText = (st?.text || '').toLowerCase();
                            const isCostOrGrave = st?.to === 'zone-gy' || st?.to === 'zone-banish' ||
                                /\b(?:move|send|discard|tribute)\s+(?:to\s+)?(?:the\s+)?(?:gy|graveyard|banish|banished)\b/i.test(stText);
                            if (isCostOrGrave) {
                                for (const c of findStepCardCodes(st, lastActorCode)) {
                                    if (!costCandidateCodes.includes(c)) costCandidateCodes.push(c);
                                }
                            }
                        }
                        if (costCandidateCodes.length > 0 && selectCards.length > 0) {
                            const alreadyInUnselect = new Set(unselectCards.map(u => u.code));
                            for (const code of costCandidateCodes) {
                                if (alreadyInUnselect.has(code) && (m.can_finish || costCandidateCodes.some(other => !alreadyInUnselect.has(other) && selectCards.some(sc => sc.code === other)))) {
                                    continue;
                                }
                                const found = selectCards.findIndex(c => c.code === code);
                                if (found !== -1) {
                                    chosenIdx = found;
                                    break;
                                }
                            }
                        }
                    }

                    if (chosenIdx === null && !(stepMaterialCodes.length > 0 && m.can_finish)) {
                        const candidateCodes = [];
                        const addStepCodes = (sIdx) => {
                            if (sIdx >= 0 && sIdx < steps.length && !chainStepsConsumed.has(sIdx)) {
                                for (const c of findStepCardCodes(steps[sIdx], lastActorCode)) {
                                    if (sIdx === currentActiveStepIdx && c === lastActorCode) {
                                        const text = (steps[sIdx]?.text || '').toLowerCase();
                                        if (!/\b(?:itself|this card|himself|herself)\b/i.test(text)) continue;
                                    }
                                    if (!candidateCodes.includes(c)) candidateCodes.push(c);
                                }
                            }
                        };
                        // 1. Check current step and upcoming steps first (resolving targets)
                        for (let s = Math.max(0, stepIdx - 1); s <= Math.min(steps.length - 1, stepIdx + 4); s++) {
                            addStepCodes(s);
                        }
                        // 2. Fallback to earlier context
                        for (let s = stepIdx - 2; s >= Math.max(0, stepIdx - 4); s--) {
                            addStepCodes(s);
                        }
                        if (selectCards.length > 0) {
                            const alreadyInUnselect = new Set(unselectCards.map(u => u.code));
                            for (const code of candidateCodes) {
                                if (alreadyInUnselect.has(code) && (m.can_finish || candidateCodes.some(other => !alreadyInUnselect.has(other) && selectCards.some(sc => sc.code === other)))) {
                                    continue;
                                }
                                const found = selectCards.findIndex(c => c.code === code);
                                if (found !== -1) {
                                    chosenIdx = found;
                                    break;
                                }
                            }
                        }
                    }

                    if (chosenIdx === null) {
                        if (m.can_finish) {
                            chosenIdx = null;
                        } else if (selectCards.length > 0) {
                            const upcomingNeeded = new Set();
                            for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 16); s++) {
                                for (const c of findStepCardCodes(steps[s], lastActorCode)) {
                                    upcomingNeeded.add(c);
                                }
                            }
                            const nonNeededIdx = selectCards.findIndex(c => !upcomingNeeded.has(c.code));
                            if (nonNeededIdx !== -1) {
                                chosenIdx = nonNeededIdx;
                            } else {
                                chosenIdx = 0;
                            }
                        }
                    }

                    if (chosenIdx !== null && selectCards[chosenIdx]?.code && selectCards[chosenIdx].location !== OcgLocation.MZONE) {
                        cardsSelectedSinceLastIdle.add(selectCards[chosenIdx].code);
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_UNSELECT_CARD,
                        index: chosenIdx
                    });

                } else if (m.type === OcgMessageType.SELECT_SUM || m.type === 23) { // SELECT_SUM
                    // Pick materials matching exact or minimum sum requirement
                    const selects = m.selects || [];
                    const mustList = m.selects_must || m.must_selects || [];
                    let mustSum = 0;
                    for (const mc of mustList) {
                        mustSum += ((mc.amount || 0) & 0xffff);
                    }
                    const targetSum = Math.max(0, (m.amount || 0) - mustSum);
                    const minC = Math.max(1, (m.min || 1) - mustList.length);
                    const maxC = (m.max && m.max > 0) ? Math.max(minC, m.max - mustList.length) : selects.length;

                    let exactChosen = null;
                    let overflowChosen = null;
                    // "Activate Doriado's Blessing, tributing Manju": cards the step names are tried first
                    const sumStep = steps[currentActiveStepIdx ?? Math.max(0, stepIdx - 1)];
                    const sumNamed = sumStep ? findStepCardCodes(sumStep, null) : [];
                    const order = selects.map((_, i) => i)
                        .sort((a, b) => Number(sumNamed.includes(selects[b].code)) - Number(sumNamed.includes(selects[a].code)));

                    const dfsSum = (startPos, currentIndices, currentSum) => {
                        if (exactChosen) return;
                        if (currentIndices.length >= minC && currentIndices.length <= maxC) {
                            if (currentSum === targetSum) {
                                exactChosen = [...currentIndices];
                                return;
                            }
                            if (currentSum > targetSum && !overflowChosen) {
                                overflowChosen = [...currentIndices];
                            }
                        }
                        if (currentIndices.length >= maxC || currentSum >= targetSum) return;
                        for (let pos = startPos; pos < order.length; pos++) {
                            const i = order[pos];
                            const v1 = (selects[i].amount || 0) & 0xffff;
                            const v2 = ((selects[i].amount || 0) >> 16) & 0xffff;
                            currentIndices.push(i);
                            dfsSum(pos + 1, currentIndices, currentSum + v1);
                            if (!exactChosen && v2 > 0 && v2 !== v1) {
                                dfsSum(pos + 1, currentIndices, currentSum + v2);
                            }
                            currentIndices.pop();
                            if (exactChosen) return;
                        }
                    };
                    dfsSum(0, [], 0);

                    const chosen = exactChosen || overflowChosen || [0];
                    for (const idx of chosen) {
                        // Synchro/Ritual materials on the field are not "selected cards": counting them made the next
                        // "use its effect to search" step look already resolved
                        if (selects[idx]?.code && selects[idx].location !== OcgLocation.MZONE) {
                            cardsSelectedSinceLastIdle.add(selects[idx].code);
                        }
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_SUM,
                        indicies: chosen
                    });

                } else if (m.type === OcgMessageType.SELECT_COUNTER || m.type === 22) { // SELECT_COUNTER
                    let remaining = m.count || 1;
                    const counters = (m.cards || []).map(c => {
                        const take = Math.min(remaining, c.count || 0);
                        remaining -= take;
                        return take;
                    });
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_COUNTER,
                        counters
                    });

                } else if (m.type === OcgMessageType.SELECT_DISFIELD || m.type === 24) { // SELECT_DISFIELD
                    const avail = getAvailablePlaces(m.field_mask);
                    const count = m.count || 1;
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_DISFIELD,
                        places: avail.slice(0, count)
                    });

                } else if (m.type === OcgMessageType.ANNOUNCE_NUMBER || m.type === 143) { // ANNOUNCE_NUMBER
                    let valIdx = 0;
                    let numberFromText = false;
                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    // "Gryphon counts as 2 of its 3 materials" answers a "treat as how many materials" prompt;
                    // otherwise the first number in the text ("Number 69" would match nothing useful there)
                    const numMatch = (resolvingStep?.text || '').match(/\b(?:counts?|counting|treated|treat(?:ing)?)\s+as\s+(\d+)\b/i) ||
                        (resolvingStep?.text || '').match(/\b(?:level|rank)?\s*(\d+)\b/i);
                    if (numMatch && m.options) {
                        const targetNum = BigInt(numMatch[1]);
                        const found = m.options.findIndex(o => BigInt(o) === targetNum);
                        if (found !== -1) {
                            valIdx = found;
                            numberFromText = true;
                        }
                    }
                    // Level gains/changes ("gain up to that many Levels", "declare a Level"): with no number in the text,
                    // pick the value that makes the next Synchro (sum of Levels) or Xyz (Level = Rank) in the combo work
                    const numberOptions = (m.options || []).map(o => Number(o));
                    if (!numberFromText && numberOptions.length > 1) {
                        let target = null;
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 6) && !target; s++) {
                            for (const c of findStepCardCodes(steps[s], lastActorCode)) {
                                const t = getCardByCode(c)?.type || 0;
                                if (t & 0x2000) { target = { kind: 'synchro', level: getCardByCode(c).level }; break; }
                                if (t & 0x800000) { target = { kind: 'xyz', level: getCardByCode(c).level }; break; }
                            }
                        }
                        if (target) {
                            const mzoneNow = (lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE }) || []).filter(c => c && c.code);
                            const actorCode = currentSolvingChainCard?.code || lastActorCode;
                            const actorLevel = mzoneNow.find(c => c.code === actorCode)?.level || 0;
                            const fieldSum = mzoneNow.reduce((sum, c) => sum + (c.level || 0), 0);
                            const fits = (v) => target.kind === 'synchro'
                                ? (fieldSum + v === target.level || fieldSum - actorLevel + v === target.level)
                                : (v === target.level || actorLevel + v === target.level);
                            const fitIdx = numberOptions.findIndex(fits);
                            if (fitIdx !== -1) valIdx = fitIdx;
                        }
                    }
                    if (numberOptions.length > 1) {
                        const announced = numberOptions;
                        valIdx = recordDecision('NUMBER', valIdx, announced.map((_, i) => i).filter(i => i !== valIdx).slice(0, 4), {
                            confident: numberFromText,
                            describe: (i) => `announce ${announced[i]}`
                        });
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.ANNOUNCE_NUMBER,
                        value: valIdx
                    });

                } else if (m.type === OcgMessageType.ANNOUNCE_ATTRIB || m.type === 141) { // ANNOUNCE_ATTRIB
                    const attrs = [];
                    const avail = Number(m.available || 1);
                    for (let bit = 0; bit < 7 && attrs.length < (m.count || 1); bit++) {
                        if (avail & (1 << bit)) attrs.push(1 << bit);
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.ANNOUNCE_ATTRIB,
                        attributes: attrs.length > 0 ? attrs : [1]
                    });

                } else if (m.type === OcgMessageType.ANNOUNCE_RACE || m.type === 140) { // ANNOUNCE_RACE
                    const races = [];
                    const avail = BigInt(m.available || 1n);
                    for (let bit = 0n; bit < 32n && races.length < (m.count || 1); bit++) {
                        if (avail & (1n << bit)) races.push(1n << bit);
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.ANNOUNCE_RACE,
                        races: races.length > 0 ? races : [1n]
                    });

                } else if (m.type === OcgMessageType.ANNOUNCE_CARD || m.type === 142) { // ANNOUNCE_CARD
                    const opcodes = m.opcodes || [];
                    const matchesOpcodes = (code) => {
                        if (!code) return false;
                        const cData = getCardByCode(code);
                        if (!cData) return false;
                        if (!opcodes.length) return true;
                        try {
                            return cardMatchesOpcode(cData, opcodes);
                        } catch {
                            return false;
                        }
                    };

                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    const codes = findStepCardCodes(resolvingStep, lastActorCode).filter(c => c !== lastActorCode && c !== lastSelectedCardCode);

                    // 1. First priority: any explicit card from the resolving step that matches opcodes
                    let announcedCode = codes.find(c => matchesOpcodes(c));

                    // 2. Second priority: if an opcode itself contained a card passcode that matches
                    if (!announcedCode) {
                        const opCodeCard = opcodes.map(o => Number(o)).find(n => n > 10000 && n < 100000000 && matchesOpcodes(n));
                        if (opCodeCard) announcedCode = opCodeCard;
                    }

                    // 3. Third priority: if step mentioned "normal monster"
                    if (!announcedCode && /normal monster/i.test(resolvingStep?.text || '')) {
                        const normalMon = resolved.find(c => (c.data.type & 0x11) === 0x11 && matchesOpcodes(c.code));
                        if (normalMon) announcedCode = normalMon.code;
                    }

                    // 4. Fourth priority: scan common cards / handtraps / staples
                    if (!announcedCode) {
                        const CANDIDATE_CODES = [
                            14558127, // Ash Blossom & Joyous Spring
                            27204311, // Nibiru, the Primal Being
                            10045474, // Infinite Impermanence
                            94145021, // Droll & Lock Bird
                            24224830, // Called by the Grave
                            73642296, // Crossout Designator
                            89631139, // Blue-Eyes White Dragon
                            46986414  // Dark Magician
                        ];
                        announcedCode = CANDIDATE_CODES.find(c => matchesOpcodes(c));
                    }

                    // 5. Fifth priority: any card from the combo deck itself that matches
                    if (!announcedCode) {
                        const matchingResolved = resolved.find(c => matchesOpcodes(c.code));
                        if (matchingResolved) announcedCode = matchingResolved.code;
                    }

                    // 6. Fallback
                    if (!announcedCode) {
                        announcedCode = 14558127;
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.ANNOUNCE_CARD,
                        card: announcedCode
                    });

                } else if (m.type === OcgMessageType.SELECT_YESNO || m.type === 13) { // SELECT_YESNO
                    let answerYes = true;
                    const descStr = getEffectDescription(m.description);
                    const descCode = m.description ? Number(BigInt(m.description) >> 20n) : 0;
                    if (descCode === 81196066) { // Lunalight Perfume Dancer optional secondary hand special summon
                        let expectsSummon = false;
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                            const stText = (steps[s]?.text || '').toLowerCase();
                            if (/^(?:(?:special\s+)?summon\b|ss\b)/i.test(stText)) {
                                expectsSummon = true;
                                break;
                            }
                            if (/^(?:activate\b|set\b|normal\s+summon\b)/i.test(stText)) {
                                break;
                            }
                        }
                        if (!expectsSummon) {
                            answerYes = false;
                        }
                    }
                    // "then you can add 1 Ryu-Ge Pendulum Monster from your hand to your face-up Extra Deck": an optional
                    // extra the write-up may not use, so the choice search can try declining it
                    answerYes = recordDecision('YES_NO', answerYes, [!answerYes], {
                        describe: (yes) => `${yes ? 'accept' : 'decline'} "${descStr || 'optional effect'}"${descCode ? ` (${codeName(descCode)})` : ''}`,
                        codesOf: () => descCode ? [descCode] : []
                    });
                    if (options.debug) console.log('[DEBUG SELECT_YESNO]', descStr, 'descCode:', descCode, '-> answer:', answerYes, 'stepIdx:', stepIdx);
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_YESNO,
                        yes: answerYes
                    });

                } else if (m.type === 1) { // RETRY
                    errors.push(`Engine rejected response (RETRY) at step ${stepIdx}.`);
                    break;
                }
            }

            skipRedundantVisualSteps();

            const hasIdleCmd = msgs.some(m => m.type === 11);
            // Done once an idle prompt arrives after the last step and nothing answered it: the last action has resolved
            if (stepIdx >= steps.length && status === OcgProcessResult.WAITING && hasIdleCmd && responsesSet === responsesBefore) {
                break;
            }

            if (errors.length > 0 || status === OcgProcessResult.END) {
                break;
            }
        }

        // Query final board state and snapshot from OCGCore
        const fieldState = lib.duelQueryField(duel);
        const monstersOnField = fieldState.players[0].monsters.filter(m => m && m.position !== 0).length;
        const spellsOnField = fieldState.players[0].spells.filter(s => s && s.position !== 0).length;
        const fieldSnapshot = captureFieldSnapshot(duel, lib);

        // Enrich combo steps with ground truth OCGCore actions
        for (let i = 0; i < steps.length; i++) {
            const acts = stepActions[i] || [];
            const hasCuratedCard = Boolean(steps[i].card && steps[i].to);
            if (!hasCuratedCard) {
                if (acts.length > 0) {
                    steps[i].actions = acts;
                    steps[i].card = acts[0].card;
                    steps[i].to = acts[0].to;
                } else if (i >= stepIdx) {
                    // Steps that failed or were not offered should not retain phantom movements
                    steps[i].card = undefined;
                    steps[i].to = undefined;
                }
            } else if (!steps[i].actions || steps[i].actions.length === 0) {
                const matchingActs = acts.filter(a => a.card === steps[i].card);
                if (matchingActs.length > 0) {
                    steps[i].actions = matchingActs;
                }
            }
        }

        const legal = (errors.length === 0 && stepIdx >= steps.length);

        // VERIFIED_LEGAL     every step ran (commentary aside)
        // VERIFIED_PARTIAL   every step the engine could simulate ran; some could not be simulated (see unverifiedSteps)
        // UNVERIFIABLE       the replay stopped after a step it could not simulate, or stalled without a concrete rejection
        // ILLEGAL_OR_INCOMPLETE  a concrete step was refused; verdict LIKELY_ILLEGAL (card in place, engine refused) or
        //                    NEEDS_REVIEW (the card never reached the hand/field, or its script is missing)
        const failedStepNum = legal ? null : stepIdx + 1;
        const blockingSkip = unverifiedSteps.find(u => u.taints && (failedStepNum == null || u.step < failedStepNum)) || null;
        let status;
        let verdict;
        if (legal) {
            status = blockingSkip ? 'VERIFIED_PARTIAL' : 'VERIFIED_LEGAL';
            verdict = status;
        } else if (blockingSkip || errors.length === 0 || failureDiagnosis?.kind === 'UNIDENTIFIED_STEP') {
            status = options.lenient ? 'UNVERIFIABLE' : 'ILLEGAL_OR_INCOMPLETE';
            verdict = 'UNVERIFIABLE';
        } else {
            status = 'ILLEGAL_OR_INCOMPLETE';
            verdict = failureDiagnosis?.kind === 'ENGINE_REJECTED' ? 'LIKELY_ILLEGAL' : 'NEEDS_REVIEW';
        }
        const decisions = decisionLog.map(d => ({
            id: d.id,
            kind: d.kind,
            step: d.step,
            confident: d.confident,
            overridden: d.overridden,
            choice: d.choice,
            alternatives: d.alternatives,
            choiceCodes: d.choiceCodes,
            alternativeCodes: d.alternativeCodes,
            label: d.describe ? d.describe(d.choice) : null,
            defaultLabel: d.overridden && d.describe ? d.describe(d.defaultChoice) : null
        }));

        return {
            status,
            verdict,
            failureKind: failureDiagnosis?.kind || null,
            failureCode: failureDiagnosis?.code || null,
            blockingSkip,
            unverifiedSteps,
            decisions,
            legal,
            stepsCompleted: Math.min(stepIdx, steps.length),
            totalSteps: steps.length,
            failedStepIdx: legal ? null : stepIdx,
            offeredActions: legal ? null : lastOfferedActions,
            errors,
            log,
            board: {
                monsters: monstersOnField,
                spells: spellsOnField
            },
            stepActions,
            fieldSnapshot
        };

    } finally {
        lib.destroyDuel(duel);
    }
}

// Search order among equally (un)confident decisions: wrong search/cost picks are the most common harness mistake
const DECISION_KIND_PRIORITY = { SELECT_CARD: 0, ACTIVATE_GUESS: 1, EFFECT_YN: 1, OPTION: 2, NUMBER: 2, ACTIVATE_EFFECT: 3, CHAIN: 4, PLACE: 5 };

function replayScore(r) {
    if (!r) return -Infinity;
    const taintingSkips = (r.unverifiedSteps || []).filter(u => u.taints).length;
    if (r.status === 'VERIFIED_LEGAL') return 3e6;
    if (r.status === 'VERIFIED_PARTIAL') return 2e6 - taintingSkips;
    return (r.stepsCompleted || 0) * 10 - taintingSkips;
}

/**
 * runComboReplay, but a failed line is not reported until alternative choices have been tried. The harness picks
 * search targets, costs, optional triggers and effect options from the prose; when a pick is wrong the line fails
 * later for no rules reason. Replays (deterministic) override one decision at a time, uncertain ones nearest the
 * failure first, and keep any change that gets further (hill climbing), within options.searchBudget extra replays
 * and options.searchTimeMs. Every replay is a real ocgcore duel, so whatever passes is a legal sequence of plays.
 */
export async function runComboReplaySearch(combo, options = {}) {
    const budget = options.searchBudget ?? 12;
    const deadline = Date.now() + (options.searchTimeMs ?? 15000);
    const original = structuredClone(combo);

    const attempt = async (overrides) => {
        const copy = structuredClone(original);
        try {
            const r = await runComboReplay(copy, { ...options, decisionOverrides: overrides });
            return { r, copy, overrides };
        } catch (err) {
            return { r: null, copy, overrides, err };
        }
    };

    let best = await attempt(new Map());
    if (!best.r) throw best.err;
    let extraRuns = 0;
    const tried = new Set();
    const canImprove = (r) => r && !r.legal && Array.isArray(r.decisions) && r.status !== 'UNOFFICIAL_CARDS';
    const MAX_SIDESTEP_DEPTH = 3;

    // Expand the best run's decisions; an alternative that does no worse but opens new decisions (chaining a
    // declined trigger whose search then needs the right pick) is a sidestep, expanded later on its new decisions only
    let frontier = [{ state: best, newDecisionsAfter: -1 }];
    while (frontier.length > 0 && canImprove(best.r) && extraRuns < budget && Date.now() < deadline) {
        const { state, newDecisionsAfter } = frontier.shift();
        const failStep = state.r.stepsCompleted;
        // The card the failure is about: decisions that picked it (it got discarded) or passed it over (it was
        // never searched) are the likeliest cause, however early they were made
        const focus = state.r.failureCode;
        const touchesFocus = (d) => Boolean(focus) && (d.choiceCodes.includes(focus) || d.alternativeCodes.some(c => c.includes(focus)));
        const candidates = state.r.decisions
            .filter(d => !d.overridden && d.alternatives.length > 0 && d.step <= failStep && d.id > newDecisionsAfter)
            .sort((a, b) => (Number(touchesFocus(b)) - Number(touchesFocus(a))) ||
                (Number(a.confident) - Number(b.confident)) ||
                (b.step - a.step) ||
                (DECISION_KIND_PRIORITY[a.kind] - DECISION_KIND_PRIORITY[b.kind]));
        const sidesteps = [];
        let improved = false;
        search: for (const d of candidates) {
            let alternatives = d.alternatives.map((alt, i) => ({ alt, codes: d.alternativeCodes[i] || [] }));
            if (touchesFocus(d)) {
                // Picked the focus card -> try picks without it first; passed it over -> try picks with it first
                const pickedFocus = d.choiceCodes.includes(focus);
                alternatives = alternatives.sort((x, y) => pickedFocus
                    ? Number(x.codes.includes(focus)) - Number(y.codes.includes(focus))
                    : Number(y.codes.includes(focus)) - Number(x.codes.includes(focus)));
            }
            for (const { alt } of alternatives.slice(0, touchesFocus(d) ? 6 : 3)) {
                if (extraRuns >= budget || Date.now() >= deadline) break search;
                const overrides = new Map(state.overrides);
                overrides.set(d.id, alt);
                const key = JSON.stringify([...overrides]);
                if (tried.has(key)) continue;
                tried.add(key);
                extraRuns++;
                const next = await attempt(overrides);
                if (!next.r) continue;
                if (replayScore(next.r) > replayScore(best.r)) {
                    best = next;
                    improved = true;
                    break search;
                }
                if (replayScore(next.r) >= replayScore(state.r) && overrides.size < MAX_SIDESTEP_DEPTH &&
                    next.r.decisions.some(nd => nd.id > d.id && !nd.overridden && !nd.confident && nd.alternatives.length > 0)) {
                    sidesteps.push({ state: next, newDecisionsAfter: d.id });
                }
            }
        }
        frontier = improved
            ? [{ state: best, newDecisionsAfter: -1 }]
            : [...frontier, ...sidesteps.slice(0, 2)];
    }

    // Callers read the enriched steps/cards from the combo object, as with a plain runComboReplay
    combo.steps = best.copy.steps;
    combo.cards = best.copy.cards;

    const r = best.r;
    r.searchRuns = extraRuns;
    r.alternativeChoices = (r.decisions || [])
        .filter(d => d.overridden)
        .map(d => ({ step: d.step + 1, kind: d.kind, chose: d.label, insteadOf: d.defaultLabel }));
    for (const alt of r.alternativeChoices) {
        r.log.push(`Alternate choice near step ${alt.step}: ${alt.chose} (instead of ${alt.insteadOf})`);
    }
    return r;
}
