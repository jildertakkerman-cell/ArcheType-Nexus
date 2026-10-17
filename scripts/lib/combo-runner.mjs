import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
    createDuelInstance,
    getCardByCode,
    getCardByName,
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
const DUMMY_DISCARD_CODE = 12607053; // "Beaver Warrior"

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

        // 1. Check numeric code in ID if present (e.g. "card_89997728_1" or "89997728")
        const idCodeMatch = String(rawCard.id || '').match(/\b(\d{5,8})\b/);
        if (idCodeMatch) {
            const row = stmtByCode.get(Number(idCodeMatch[1]));
            if (row) cardData = getCardByCode(row.id);
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
        } else {
            missing.push({ id: rawCard.id, name: rawName });
        }
    }

    return { resolved, idMap, nameMap, missing };
}

/**
 * Pre-caches Lua scripts for all resolved cards in a combo.
 */
export async function preloadComboScripts(resolvedCards) {
    for (const card of resolvedCards) {
        if (card.code) {
            await getScript(`c${card.code}.lua`);
            if (card.data?.alias && card.data.alias !== card.code) {
                await getScript(`c${card.data.alias}.lua`);
            }
        }
    }
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

/**
 * Replays and verifies a combo against ocgcore.
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
    await preloadComboScripts(resolved);

    // Initialize duel instance
    const { lib, duel } = await createDuelInstance(options);

    try {
        // Place initial cards into designated zones
        for (const card of resolved) {
            const z = parseZone(card.zone) || { location: OcgLocation.DECK, sequence: 0 };
            lib.duelNewCard(duel, {
                team: 0,
                duelist: 0,
                code: card.code,
                controller: 0,
                location: z.location,
                sequence: z.sequence,
                position: (z.location === OcgLocation.HAND || z.location === OcgLocation.DECK || z.location === OcgLocation.EXTRA)
                    ? OcgPosition.FACEDOWN
                    : OcgPosition.FACEUP_ATTACK
            });
        }

        lib.startDuel(duel);

        const steps = combo.steps || [];
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

        function lookupCleanInNameMap(clean) {
            if (!clean || clean.length < 3) return [];
            if (/^(?:effect|effects|card|cards|monster|monsters|spell|spells|trap|traps|deck|hand|field|graveyard|turn|phase|level|rank|link|scale|scales|pendulum|normal|special|summon|summoning|activate|activating|tribute|tributing|discard|discarding|banish|banishing|search|searching|add|adding|set|setting|this|that|it|its|her|his|their|your|itself|herself|himself|both|two|three|one|any|other|another|target|material|materials|starter|extender)$/i.test(clean)) {
                return [];
            }
            if (nameMap.has(clean)) {
                return [nameMap.get(clean).code];
            }
            const sorted = [...nameMap.entries()].sort((a, b) => b[0].length - a[0].length);
            const matched = [];
            for (const [name, c] of sorted) {
                if (clean.includes(name) && !matched.includes(c.code)) {
                    matched.push(c.code);
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
            // Special case: "the Servant" -> monster with "servant" in name
            if (/^the\s+servant$/i.test(frag.trim())) {
                const monsterServant = [...nameMap.values()].find(c => c.officialName.toLowerCase().includes('servant') && (c.data.type & 1));
                if (monsterServant) return [monsterServant.code];
            }

            const baseClean = cleanCardName(frag)
                .replace(/\s*\((?:currently\s+|now\s+)?(?:limited|semi-limited|banned|forbidden|level\s*\d+|rank\s*\d+|link-\d+|\d+|optional|cost)[^)]*\)/gi, '')
                .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+|one\s+|1\s+|any\s+|2nd\s+|second\s+)/i, '')
                .replace(/\s*'s(?:\s+(?:monster|gy|graveyard|hand|field|scale|on-summon|summon|on-activation|quick|second|first|other|ignition))?(?:\s+effect)?$/i, '')
                .replace(/(?:'s|s')$/i, '')
                .replace(/\s+effect$/i, '')
                .trim();

            if (!baseClean || baseClean.length < 3) return [];

            // If baseClean starts with a word that can be part of a card name ("Tribute Lanius", "Link Spider", "Set Rotation"), check unstripped first
            if (/^(?:tribute|link|set|fusion|synchro|xyz|ritual|pendulum|place|target)\s+[A-Z]/i.test(baseClean)) {
                const directMatch = lookupCleanInNameMap(baseClean.toLowerCase());
                if (directMatch.length > 0) return directMatch;
            }

            const verbStripped = baseClean
                .replace(/^(?:(?:activate|activating|use|using|trigger|triggering|normal summon(?:ing)?|special summon(?:ing)?|link summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|fusion summon(?:ing)?|ritual summon(?:ing)?|pendulum summon(?:ing)?|tribute summon(?:ing)?|summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|banish(?:ing)?|send(?:ing)?|target(?:ing)?|chain(?:ing)?|overlay(?:ing)?|tune|tuning|equip(?:ping)?|place|placing|finish(?:ing)?|tribute|tributing|link|linking|set|setting)\s+)/i, '')
                .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+|one\s+|1\s+|any\s+|2nd\s+|second\s+)/i, '')
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

            const rawText = cleanCardName(step.text || '').replace(/^(?:action:\s*|step\s+\d+:\s*)+/i, '').trim();
            const textLower = rawText.toLowerCase();

            // 1. Pronoun or bare "Activate effect" / "the searched <X>" reference to previous card
            if (
                /^(?:tribute(?:d|ing)? it|discard(?:ing)? it|us(?:e|ing) (?:it|its|her|his)|activat(?:e|ing) (?:it|its|her|his)|(?:its|her|his) (?:[a-z-]+\s+)?effect|(?:activat(?:e|ing)|us(?:e|ing))\s+(?:the\s+)?(?:on-summon\s+|summon\s+|on-activation\s+|monster\s+|ignition\s+|gy\s+|graveyard\s+|hand\s+|field\s+|scale\s+|quick\s+|first\s+|second\s+)?effect\b|set(?:ting)? it|banish(?:ing)? it|link(?:ing)? it|overlay(?:ing)? it|special summon(?:ing)? (?:it|himself|herself|itself)|normal summon(?:ing)? it|summon(?:ing)? (?:it|himself|herself|itself)|place|placing it)/i.test(rawText) ||
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

            // 3. Explicit effect owner: "Activate/Use/Trigger/Chain <Card>'s [monster/gy/hand] effect" or "<Card>'s effect"
            const ownerMatches = [
                ...rawText.matchAll(/(?:activat(?:e|ing)|us(?:e|ing)|trigger(?:ing)?|chain(?:ing)?|finish(?:ing)?)\s+([A-Za-z0-9',\s-]+?)(?:\s*'s|\s+monster|\s+gy|\s+graveyard|\s+hand|\s+field|\s+scale|\s+ignition)?\s+(?:[a-z-]+\s+)?effect/gi),
                ...rawText.matchAll(/\b([A-Z][A-Za-z0-9',\s-]+?)\s*'s\s+(?:[a-z-]+\s+)?effect/g)
            ];
            for (const om of ownerMatches) {
                const ownerClean = om[1]
                    .split(/\b(?:with|using|by|from|after|when|while|as|via|through)\s+/i)
                    .pop()
                    .replace(/\s*'s$/i, '')
                    .trim();
                for (const c of matchFragmentCodes(ownerClean)) addCode(c);
            }

            // 4. Primary verb target: "Normal Summon <X>", "Activate <X>", "Link Summon <X>", + concrete examples "(e.g., <X>)" / "like <X>"
            const verbMatches = [...rawText.matchAll(/(?:normal summon(?:ing)?|tribute summon(?:ing)?|^summon(?:ing)?|activat(?:e|ing)|reveal(?:ing)?|special summon(?:ing)?|link summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|fusion summon(?:ing)?|ritual summon(?:ing)?|pendulum summon(?:ing)?|rank-up into|climb(?:ing)?\s+into|overlay(?:ing)?(?:\s+.*?\s+(?:into|to)|\s+into|\s+to)?|tune\s+.*?\s+into|contact fusion|contact fuse(?: into)?|link\s+.*?\s+(?:into|for|->|→)|set(?:ting)?|place|placing)\s+(?:-\s*)?([A-Za-z0-9',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+into\b|\s+as\b|\s+in\b|\s+on\b|,(?!\s*the\b)|\s+and\b|$)/gi)];
            for (const vm of verbMatches) {
                for (const c of matchFragmentCodes(vm[1])) addCode(c);
            }
            const exampleMatches = [...rawText.matchAll(/(?:\(\s*(?:e\.g\.?,?|i\.e\.?,?|like|such as|optimally|ideally|into)\s+|\b(?:e\.g\.?,?|like|such as)\s+)([A-Z][A-Za-z0-9"',\s-:]+?)(?=\)|,|\.|\s+to\b|\s+from\b|\s+in\b|\s+and\b|\s+or\b|$)/gi)];
            for (const em of exampleMatches) {
                for (const c of matchFragmentCodes(em[1])) addCode(c);
            }

            // 5. All cards mentioned in text (longest full card name match first)
            const sortedEntries = [...nameMap.entries()].sort((a, b) => b[0].length - a[0].length);
            for (const [name, c] of sortedEntries) {
                if (textLower.includes(name)) {
                    addCode(c.code);
                }
            }

            // 6. Capitalized shorthand references in text (e.g. "Curtain", "Salvation", "the Servant", "Red-Eyes", "Herz")
            const capTokens = [...rawText.matchAll(/\b(?:the\s+)?([A-Z][A-Za-z0-9'-]{3,}(?:\s+[A-Z][A-Za-z0-9'-]+)*)/g)];
            for (const ct of capTokens) {
                for (const c of matchFragmentCodes(ct[0])) addCode(c);
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
                // Skip UI visual spell graveyard sending steps, commentary, banlist notes, board state setups, and phase transitions
                if (
                    /^(?:move to (?:graveyard|gy)|send .* to (?:graveyard|gy)|.*goes to the (?:gy|graveyard)|resolve(?:\s|:)|battle phase:|enter (?:the )?battle phase|attack\b|after \d+ attacks|end (?:your )?turn|pass (?:the )?turn|legal because|this (?!card\b)|that is two layers|going second|you (?:now have|can now|are now|have now|can easily|now control)|you'll draw|now that you control|from (?:here|this point), (?:a series|the combo|you can|use)|the goal is to|result:|note:|required hand:|starting hand:|opening hand:|due to spiral fusion|nothing else is required|.*preparation of rites cannot|the earth-based p\.u\.n\.k\. monsters cannot|start with .* (?:in hand|on (?:your |the )?field|in your banished)|begin with a starter|.+?\s+sit(?:s)? on (?:your |the )?field|.+?\s+sits in your hand with\b|.+?\s+in hand,\s+a\s+level\s+\d+.*in the graveyard|with (?:four|4|three|3|two|2) (?:level|spellbooks|monsters|"[^"]+").*, (?:you (?:have|can)|the condition is met)|with .* on the field, your .* effects no longer|treat the level \d+ .* as level \d+|it (?:stops at|comes back face-up)|modern (?:.* )?builds (?:use|focus)|historically, players would|in the new format,|repeat the process until|enables a cascade of|a typical result includes|next turn it is|summoned during your turn|your scales are negated|cannot be destroyed by battle|its activation and effect cannot be negated|the (?:"[^"]+"|[a-z0-9-]+) (?:lock is now active|combo ends with)|the primary combo line involves|the loop begins|the standard path is to|either half moves|through standard fusion steps|by integrating .* into the)/i.test(trimmed) ||
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
        let inOpponentTurn = false;
        let autoFiredPrevStepIgnition = false;

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
            if (/(?:special summon|\bsummon\b|\brevives?\b)/i.test(st) && /(?:special summon|\bsummon\b)/i.test(d)) score += 6;
            if (/\b(?:send|dump|foolish|to (?:the )?(?:gy|graveyard))\b/i.test(st) && /(?:send|to the gy|to the graveyard|graveyard)/i.test(d)) score += 5;
            if (/\b(?:sends? itself|send this card to the gy)\b/i.test(st) && /send this card to the gy/i.test(d)) score += 8;
            if (/\bdestroy/i.test(st) && /\bdestroy/i.test(d)) score += 6;
            if (/\bbanish/i.test(st) && /\bbanish/i.test(d)) score += 6;
            if (/\bdraw/i.test(st) && /\bdraw/i.test(d)) score += 6;
            if (/\b(?:place|set)\b/i.test(st) && /\b(?:place|set)\b/i.test(d)) score += 5;
            if (/\britual summon/i.test(st) && /\britual/i.test(d)) score += 8;
            if (/\bfusion summon/i.test(st) && /\bfusion/i.test(d)) score += 8;
            if (/\b(?:increase|raise)\b.*\blevel/i.test(st) && /\bincrease\b/i.test(d)) score += 8;
            if (/\b(?:decrease|reduce|lower)\b.*\blevel/i.test(st) && /\b(?:decrease|reduce)\b/i.test(d)) score += 8;
            return score;
        }

        while (loopCount++ < maxLoops) {
            const status = lib.duelProcess(duel);
            const msgs = lib.duelGetMessage(duel);
            if (options.debug) console.log(`[LOOP ${loopCount}] status=${status}, msgs=${msgs.length}`);

            for (const m of msgs) {
                const msgName = ocgMessageTypeStrings.get(m.type) || m.type;
                if (options.debug) console.log('ENGINE MSG:', m.type, msgName);

                if (m.type === 50) { // MOVE
                    const code = m.card;
                    if (code && m.from && m.to) {
                        const fromZone = ocgLocPosToZone(m.from);
                        const toZone = ocgLocPosToZone(m.to);

                        if (fromZone !== toZone) {
                            let targetCard = null;

                            // 1. Prefer card with matching code currently recorded in fromZone
                            for (const c of (combo.cards || [])) {
                                if (c.code === code && cardZoneMap.get(c.id) === fromZone) {
                                    targetCard = c;
                                    break;
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

                if (m.type === 11) { // SELECT_IDLECMD
                    if (m.player === 1) {
                        lib.duelSetResponse(duel, {
                            type: OcgResponseType.SELECT_IDLECMD,
                            action: SelectIdleCMDAction.TO_EP,
                            index: 0
                        });
                        continue;
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

                        // Handle transition to opponent's turn ("On your opponent's turn..." / "During your opponent's Main Phase...")
                        if (/^(?:on|during|in) (?:your |the )?opponent's (?:turn|main phase|standby phase|draw phase|battle phase|end phase)\b/i.test(rawStepText)) {
                            inOpponentTurn = true;
                            const strippedOppPrefix = rawStepText.replace(/^(?:on|during|in) (?:your |the )?opponent's (?:turn|main phase|standby phase|draw phase|battle phase|end phase)\s*(?:,\s*|\.\s*|$)/i, '').trim();
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

                        const stepCodes = findStepCardCodes(currentStep, lastActorCode);
                        const prevActorHasIdleEffect = Boolean(lastActorCode && m.activates && m.activates.some(a => a.code === lastActorCode));
                        const stepActorHasIdleEffect = Boolean(stepCodes[0] && m.activates && m.activates.some(a => a.code === stepCodes[0]));

                        // If this step describes a Chain Link or a trigger/search/on-activation effect that already resolved since the last IDLECMD, advance immediately
                        const isPossessiveTriggerDesc = /^(?:(?:(?:its|her|his|their|[a-z0-9'\s-]+?\s*'s)\s+(?:on-summon\s+|summon\s+|on-activation\s+|gy\s+|graveyard\s+|hand\s+)?effect|(?:the\s+)?effect\s+of\s+[a-z0-9"',\s-]+?)\s+(?:then\s+|immediately\s+|also\s+|upon\s+its\s+summon\s+)?(?:activates|triggers|resolves|searches|adds|places|sets|sends|dumps|grants|allows|lets|special summons|summons|revives|continues|destroys|banishes|draws|equips|returns|recovers)\b)/i.test(rawStepText);
                        const isDeclarativeTriggerDesc = /^[A-Z][A-Za-z0-9"',\s-]+?\s+(?:then\s+|successfully\s+|immediately\s+|also\s+|automatically\s+)?(?:searches|adds|sends|dumps|places|sets|triggers|resolves|equips|attaches|draws|recovers|returns|recycles|grants|allows|lets|fuses|fusion\s+summons|special\s+summons|summons|revives|becomes\s+level|is\s+always\s+treated)\b/i.test(rawStepText) && !/\s*->\s*gy\b/i.test(rawStepText) && !(m.special_summons && m.special_summons.some(s => stepCodes.includes(s.code)));
                        const isPureChainOrTriggerStep = /^(?:chain link \d|cl\d+\b|a (?:new )?chain forms|the chain resolves|build the chain|both (?:monsters )?trigger|this triggers|action:\s*activate .* \(on .* summon\)|on summon\b|when summoned\b|if summoned\b|its own on-activation effect\b|[^\s]+(?:'s)? summon trigger\b|her arrival turns on\b|his arrival turns on\b|its arrival turns on\b|(?:when|if|as)\s+[a-z0-9"',\s-]+?\s+(?:is|are)\s+(?:sent|cast|destroyed|tributed|banished|used|detached|summoned|discarded)\b|as [a-z0-9"'\s-]+? leaves the field)/i.test(rawStepText) ||
                            ((isPossessiveTriggerDesc || isDeclarativeTriggerDesc) && (triggersFiredSinceLastIdle > 0 || cardsSelectedSinceLastIdle.size > 0 || !stepActorHasIdleEffect));

                        const mzoneCardsNow = (stepCodes.length > 0 && /^(?:then\s+)?(?:special\s+)?summon(?:s)?\b/i.test(rawStepText))
                            ? (lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE }) || [])
                            : [];
                        const alreadySummonedSelfToField = Boolean(
                            stepCodes[0] &&
                            stepCodes[0] === lastActorCode &&
                            /^(?:then\s+)?special summon\b/i.test(rawStepText) &&
                            !stepActorHasIdleEffect &&
                            !(m.special_summons && m.special_summons.some(s => s.code === stepCodes[0])) &&
                            mzoneCardsNow.some(mc => mc && mc.code === stepCodes[0])
                        );

                        const isAlreadyResolvedSearchOrSet = alreadySummonedSelfToField ||
                            (!stepActorHasIdleEffect && /effect\s+to\s+use\s+(?:it|itself)\s+as\s+(?:synchro\s+|link\s+)?material\s+from\s+(?:your\s+)?hand/i.test(rawStepText)) ||
                            (!stepActorHasIdleEffect && !prevActorHasIdleEffect && /^(?:activat(?:e|ing)|us(?:e|ing)) (?:its|her|his|the) effect to gain an (?:additional|extra) normal summon/i.test(rawStepText)) ||
                            ((triggersFiredSinceLastIdle > 0 || cardsSelectedSinceLastIdle.size > 0) && (
                                /^(?:(?:activat(?:e|ing)|us(?:e|ing)|finish(?:ing)?) (?:its|her|his|the|[a-z0-9'\s-]+?'s) (?:on-summon |summon |on-activation )?effect (?:to|by) (?:search|add|set|send|dump|discard)\b|as part of the effect,\s*send\b|discard\b|shuffle\b.*back|search\b|add\b.*to (?:your )?hand|add\b.*off the rider|put\b.*back on top|place\b.*on (?:top|bottom)|(?:then,?\s+)?set\b.*from (?:the |your )?(?:deck|gy|graveyard)|target\b.*to become level \d+|attaches your\b)/i.test(rawStepText) ||
                                (!prevActorHasIdleEffect && /^(?:activat(?:e|ing)|us(?:e|ing)) (?:its|her|his|the) (?:on-summon |summon |on-activation )?effect to (?:place|special summon|summon|revive|gain|equip|target|increase|return|recover)\b/i.test(rawStepText)) ||
                                (/(?:special summons?|summons) (?:itself|himself|herself)\b/i.test(rawStepText) && !stepActorHasIdleEffect && !(m.special_summons && m.special_summons.some(s => stepCodes.includes(s.code)))) ||
                                (/^special summon\b.*from (?:the |your )?deck\b.*whose levels equal/i.test(rawStepText) && !stepActorHasIdleEffect) ||
                                (/^(?:use the (?:extra|additional) summon to )?normal summon\b/i.test(rawStepText) && stepCodes.length > 0 && cardsSelectedSinceLastIdle.has(stepCodes[0]) && !(m.summons && m.summons.some(s => s.code === stepCodes[0])))
                            ));
                        if (isPureChainOrTriggerStep || isAlreadyResolvedSearchOrSet) {
                            stepIdx++;
                            autoFiredPrevStepIgnition = false;
                            skipRedundantVisualSteps();
                            continue;
                        }

                        // Strip search/add/set/discard/tribute/summon target clauses when identifying the actor card to summon/activate in IDLECMD
                        let actorText = rawStepText
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

                        const isPendulumScaleStep = /\b(?:pendulum zones?|scales?)\b/i.test(text) && !/\b(?:destroy|target|bounce|return)\b.*\b(?:pendulum zones?|scales?)\b/i.test(text);
                        const startsWithExplicitActivate = /^activat(?:e|ing)\b/i.test(rawStepText) || (/^us(?:e|ing)\b/i.test(rawStepText) && !/\b(?:to|and)\s+(?:link|synchro|xyz|pendulum|overlay|tune|contact|make|summon\s+(?:number|a\s+link|a\s+rank|a\s+synchro|an\s+xyz))\b/i.test(rawStepText) && !/^use\s+(?:both|the\s+two|two|2|your\s+remaining|these|them)\b/i.test(rawStepText));
                        const hasExtraDeckSummonTarget = Boolean(
                            !startsWithExplicitActivate &&
                            idleCodes.length > 0 &&
                            m.special_summons &&
                            m.special_summons.some(s => s.code === idleCodes[0] && s.location === OcgLocation.EXTRA) &&
                            !/\b(?:reveal|send|dump|banish)\b.*\bextra deck\b/i.test(text)
                        );
                        const isExtraOrProcSummon = !startsWithExplicitActivate && (hasExtraDeckSummonTarget || /(?:link summon|synchro summon|xyz summon|fusion summon|pendulum summon|rank-up into|\boverlay\b|\btune\b.*\b(?:into|for)\b|contact fuse|contact fusion|\blink\b.*\b(?:into|for|away|climb|summon|make|->|→)|^link\s+(?:both|the|your|two|2|them|these)\b)/i.test(text));
                        const hasNormalSummonVerb = /\b(?:normal summon|tribute summon|tribute .* for)\b/i.test(text) && !/\b(?:cannot|can't|do not|don't|without|instead of)\s+(?:normal|tribute) summon/i.test(text) && !/^(?:after|when|once|if)\s+(?:you\s+)?(?:normal|tribute) summon/i.test(text);
                        const isNormalSummon = (hasNormalSummonVerb || (/^summon\b/i.test(text) && !/special summon/i.test(text))) && !isExtraOrProcSummon;
                        const isSpSummon = isExtraOrProcSummon || /(?:special summon|\bsummons?\b|\brevives?\b|\bmake\b|\bclimb\b)/i.test(text);
                        const isExplicitEffectActivation = startsWithExplicitActivate || ((/(?:^tribut(?:e|ing)\b|^reveal(?:ing)?\b|^discard(?:ing)?\b|^banish(?:ing)?\b|\beffect\b)/i.test(rawStepText) && !isExtraOrProcSummon)) || isPendulumScaleStep;
                        const isActivate = isExplicitEffectActivation || /(?:activat(?:e|ing)|us(?:e|ing)|search|add .* to hand|look at the top|sends? .* from (?:the |your )?deck|\s->\s*gy\b|\bdumps?\b|\bstacks?\b|\brevives?\b|\britual summon|\bcycle\b.*back to hand|\breturn\b.*to hand)/i.test(text);
                        const isSet = /\bset(?:ting)?\b/i.test(text) && !/from (?:the |your )?(?:deck|gy|graveyard)/i.test(text) && !isPendulumScaleStep;

                        let acted = false;
                        if (options.debug) {
                            const safeJson = (val) => JSON.stringify(val, (k, v) => typeof v === 'bigint' ? v.toString() : v);
                            console.log(`[DEBUG IDLECMD] Step ${stepIdx + 1}: idleCodes=${JSON.stringify(idleCodes)}, stepCodes=${JSON.stringify(stepCodes)}, spSummons=${safeJson(m.special_summons)}, activates=${safeJson(m.activates)}`);
                        }

                        // Helper to try Special Summon from m.special_summons
                        const trySpecialSummon = () => {
                            if (!isSpSummon || !m.special_summons || m.special_summons.length === 0) return false;
                            let sIdx = -1;
                            for (const code of idleCodes) {
                                sIdx = m.special_summons.findIndex(c => c.code === code);
                                if (sIdx !== -1) break;
                            }
                            if (sIdx === -1) {
                                for (const code of stepCodes) {
                                    sIdx = m.special_summons.findIndex(c => c.code === code);
                                    if (sIdx !== -1) break;
                                }
                            }
                            if (sIdx === -1 && isExtraOrProcSummon && (!stepCodes.some(c => ((getCardByCode(c)?.type || 0) & 0x4802040) !== 0) || /\b(?:any|a|an|1)\s+[a-z0-9"'\s-]+\s+(?:monster|link|synchro|xyz|fusion)/i.test(text))) {
                                sIdx = m.special_summons.findIndex(c => c.location === OcgLocation.EXTRA);
                            }
                            if (sIdx === -1 && (stepCodes.length === 0 || /\bsummon\s+(?:any|a|an|1)\b/i.test(text))) sIdx = 0;
                            if (sIdx !== -1) {
                                lastActorCode = m.special_summons[sIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                autoFiredPrevStepIgnition = false;
                                currentActiveStepIdx = stepIdx;
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_SPECIAL_SUMMON,
                                    index: sIdx
                                });
                                const spCode = m.special_summons[sIdx].code;
                                const spName = getCardByCode(spCode)?.name || spCode;
                                log.push(`Step ${stepIdx + 1}: Legal Special Summon of ${spName} (${spCode})`);
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
                                for (const idx of matchingIndices) {
                                    const entry = m.activates[idx];
                                    const descStr = getEffectDescription(entry.description);
                                    const sc = scoreEffectDescAgainstStep(descStr, rawStepText, isPendulumScaleStep, entry.description);
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
                            if (aIdx === -1 && isPendulumScaleStep) {
                                aIdx = m.activates.findIndex(c => c.description != null && BigInt(c.description) === 1160n);
                            }
                            if (aIdx === -1 && (stepCodes.length === 0 || /\b(?:any|a|an)\s+[a-z0-9"'\s-]+\s+(?:card|monster|spell|trap|effect)\b/i.test(text))) aIdx = 0;
                            if (aIdx !== -1) {
                                lastActorCode = m.activates[aIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                autoFiredPrevStepIgnition = false;
                                currentActiveStepIdx = stepIdx;
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_ACTIVATE,
                                    index: aIdx
                                });
                                const actCode = m.activates[aIdx].code;
                                const actName = getCardByCode(actCode)?.name || actCode;
                                log.push(`Step ${stepIdx + 1}: Legal Activation of ${actName} (${actCode})`);
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
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
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
                                    triggersFiredSinceLastIdle = 0;
                                    cardsSelectedSinceLastIdle.clear();
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
                        }

                        if (acted) {
                            break;
                        }

                        // If unhandled, check if it was a trigger effect, chain resolution, opponent-board interaction, or passive text
                        const isTriggerOrResolution = /(?:chain link \d|a chain forms|trigger|on summon|if summoned|when summoned|activate (?:its|the) effect to (?:search|add|send|dump|draw|destroy|set)|its own on-activation effect|set .* from (?:the |your )?(?:deck|gy|graveyard)|search |add .* to hand|\bcycle\b.*back to hand|put .* back on top|place .* on (?:top|bottom) of (?:the|your) deck|is now in the gy|is now a .* monster|sets up your|securing a|that is two layers|going second|keeping the extra monster zone|legal because|end (?:your )?turn|(?:card|monster|spell|trap)s?\s+(?:your\s+)?opponent\s+controls|opponent's\s+(?:card|monster|spell|trap|field|board)|negate the first|while returning the|locking your opponent|^continue the combo\b)/i.test(text);
                        if (isTriggerOrResolution) {
                            stepIdx++;
                            autoFiredPrevStepIgnition = false;
                            skipRedundantVisualSteps();
                            continue;
                        }
                        const isMainAction = isNormalSummon || isSpSummon || isActivate || isSet;
                        if (!isMainAction && /(add |send |move to|draw|detach|tribute|discard|put |place )/i.test(text)) {
                            stepIdx++;
                            autoFiredPrevStepIgnition = false;
                            skipRedundantVisualSteps();
                            continue;
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
                        errors.push(`Step ${stepIdx + 1} ("${currentStep.text}") was not offered as a legal action by the duel engine.`);
                        break;
                    }

                } else if (m.type === 12) { // SELECT_EFFECTYN
                    let acceptTrigger = true;
                    const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;
                    const nextStep = steps[stepIdx] || null;
                    const prevText = (prevStep?.text || '');
                    const nextText = (nextStep?.text || '');

                    // If an Extra Deck summon just occurred and neither the summon step nor the next step mentions triggering/searching/recovering with this card, decline optional trigger
                    if (prevStep && /(?:link summon|synchro summon|xyz summon|fusion summon|link .* into)/i.test(prevText)) {
                        const prevMentionsEffect = /(?:search|add|recover|return|trigger|draw|destroy|banish|set|revive)/i.test(prevText);
                        const nextCodes = nextStep ? findStepCardCodes(nextStep, lastActorCode) : [];
                        const nextMentionsThisTrigger = nextCodes.includes(m.code) || /^(?:on summon|when summoned|if summoned|its effect|activate its|[^\s]+(?:'s)? summon trigger)/i.test(nextText.trim());
                        if (!prevMentionsEffect && !nextMentionsThisTrigger) {
                            acceptTrigger = false;
                        }
                    }

                    if (acceptTrigger) {
                        triggersFiredSinceLastIdle++;
                        currentActiveStepIdx = Math.max(0, stepIdx - 1);
                        const trigName = getCardByCode(m.code)?.name || m.code;
                        log.push(`Trigger Effect Accepted for ${trigName} (${m.code})`);
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_EFFECTYN,
                        yes: acceptTrigger
                    });

                } else if (m.type === 15) { // SELECT_CARD
                    // Find which card(s) in m.selects match the currently resolving step (stepIdx - 1) and upcoming steps
                    let chosen = [];
                    const maxSelect = m.max || 1;
                    const minSelect = m.min || 1;

                    const tryMatchCodes = (candidateCodes) => {
                        for (const code of candidateCodes) {
                            while (chosen.length < maxSelect && code && m.selects && m.selects.length > 0) {
                                const foundIdx = m.selects.findIndex((c, i) => c.code === code && !chosen.includes(i));
                                if (foundIdx !== -1) {
                                    chosen.push(foundIdx);
                                } else {
                                    break;
                                }
                            }
                        }
                    };

                    // 1. Check the currently resolving step (stepIdx - 1) first, prioritizing non-actor target/cost codes not yet selected in this IDLECMD
                    const resolvingStepText = (stepIdx > 0 && steps[stepIdx - 1]?.text) ? steps[stepIdx - 1].text : '';
                    if (stepIdx > 0 && steps[stepIdx - 1]) {
                        const activeCodes = findStepCardCodes(steps[stepIdx - 1], lastActorCode);
                        const nonActorCodes = activeCodes.filter(c => c !== lastActorCode && !cardsSelectedSinceLastIdle.has(c));
                        tryMatchCodes(nonActorCodes);
                    }

                    // 2. Check upcoming steps (stepIdx .. stepIdx + 3), UNLESS selecting a card from HAND after already searching/selecting a card (e.g. "search X then discard a card")
                    const isHandDiscardOrFollowup = m.selects?.[0]?.location === OcgLocation.HAND && (cardsSelectedSinceLastIdle.size > 0 || /\bdiscard\s+(?:a|an|1|one)\s+card\b/i.test(resolvingStepText));
                    if (!isHandDiscardOrFollowup) {
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                            if (chosen.length >= maxSelect) break;
                            const futureCodes = findStepCardCodes(steps[s], lastActorCode).filter(c => c !== lastActorCode && !cardsSelectedSinceLastIdle.has(c));
                            tryMatchCodes(futureCodes);
                        }
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                            if (chosen.length >= maxSelect) break;
                            const futureCodes = findStepCardCodes(steps[s], lastActorCode).filter(c => !cardsSelectedSinceLastIdle.has(c));
                            tryMatchCodes(futureCodes);
                        }
                    }

                    // 3. If still not enough, allow lastActorCode if mentioned in resolving step
                    if (chosen.length < maxSelect && stepIdx > 0 && steps[stepIdx - 1]) {
                        const activeCodes = findStepCardCodes(steps[stepIdx - 1], lastActorCode);
                        if (activeCodes.includes(lastActorCode)) {
                            tryMatchCodes([lastActorCode]);
                        }
                    }

                    // 4. Fill to minSelect if needed, preferring cards NOT needed as active starters in upcoming steps and NOT just searched
                    if (chosen.length < minSelect && m.selects && m.selects.length > 0) {
                        const upcomingNeeded = new Set();
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                            for (const c of findStepCardCodes(steps[s], lastActorCode)) upcomingNeeded.add(c);
                        }
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
                        for (let i = 0; i < m.selects.length && chosen.length < minSelect; i++) {
                            if (!chosen.includes(i)) chosen.push(i);
                        }
                    }

                    const finalIndices = chosen.length > 0 ? chosen : [0];
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
                    const currentStep = steps[stepIdx - 1] || steps[stepIdx];
                    const avail = getAvailablePlaces(m.field_mask);

                    let chosenPlace = avail[0] || { player: 0, location: OcgLocation.MZONE, sequence: 2 };
                    if (currentStep?.to) {
                        const reqZone = parseZone(currentStep.to);
                        if (reqZone) {
                            const match = avail.find(p => p.location === reqZone.location && p.sequence === reqZone.sequence);
                            if (match) chosenPlace = match;
                        }
                    } else if (avail.some(p => p.player === 0 && p.location === OcgLocation.MZONE && p.sequence < 5)) {
                        // Prefer zones pointed to by any Link Monster currently on Player 0's field
                        const mzoneCards = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE }) || [];
                        const linkedSeqs = new Set();
                        for (let seq = 0; seq < mzoneCards.length; seq++) {
                            const mc = mzoneCards[seq];
                            if (!mc || !mc.code) continue;
                            const cData = getCardByCode(mc.code);
                            if (cData && (cData.type & 0x4000000)) {
                                const markers = cData.def || 0;
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
                        if (linkedPlace) chosenPlace = linkedPlace;
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_PLACE,
                        places: [chosenPlace]
                    });

                } else if (m.type === 16) { // SELECT_CHAIN
                    let chainIdx = null;
                    if (m.selects && m.selects.length > 0) {
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
                        if (chainIdx === null) {
                            for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                                const stText = steps[s]?.text || '';
                                if (/(?:chain link \d|a chain forms|\bchain\b|in response|summon trigger|turns on|when .* is (?:sent|destroyed|summoned))/i.test(stText)) {
                                    const chainActorText = stText.replace(/\b(?:to\s+(?:search|add|send|dump|set)|searches|adds|sets)\b.*$/i, '');
                                    const codes = findStepCardCodes({ ...steps[s], text: chainActorText, featuredCard: null }, lastActorCode);
                                    const found = m.selects.findIndex(c => codes.includes(c.code));
                                    if (found !== -1) {
                                        chainIdx = found;
                                        if (s === stepIdx && /^(?:chain\b|in response\b)/i.test(stText.trim()) && !/^chain link \d/i.test(stText.trim())) {
                                            lastActorCode = m.selects[found].code;
                                            currentActiveStepIdx = stepIdx;
                                            stepIdx++;
                                            skipRedundantVisualSteps();
                                        }
                                        break;
                                    }
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
                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    const nextStep = steps[stepIdx] || null;
                    const opts = m.options || [];

                    if (opts.length > 1) {
                        const optDescs = opts.map(o => getEffectDescription(o));
                        let bestScore = -Infinity;
                        for (let i = 0; i < opts.length; i++) {
                            let sc = scoreEffectDescAgainstStep(optDescs[i], resolvingStep?.text || '', false, opts[i]);
                            const dLower = (optDescs[i] || '').toLowerCase();
                            // Level modulation check against upcoming Synchro/Xyz summon
                            if (/\b(?:decrease|reduce|increase|raise)\b/i.test(dLower) && nextStep) {
                                const nextCodes = findStepCardCodes(nextStep, lastActorCode);
                                const nextCard = nextCodes.length > 0 ? getCardByCode(nextCodes[0]) : null;
                                if (nextCard && (nextCard.type & 0x2000)) { // Synchro Monster
                                    const mzoneCards = lib.duelQueryLocation(duel, { flags: 17, controller: 0, location: OcgLocation.MZONE });
                                    let fieldLvSum = 0;
                                    for (const mc of (mzoneCards || [])) {
                                        if (mc && mc.level) fieldLvSum += mc.level;
                                    }
                                    if (/\b(?:decrease|reduce)\b/i.test(dLower) && fieldLvSum > nextCard.level) {
                                        sc += 12;
                                    } else if (/\b(?:increase|raise)\b/i.test(dLower) && fieldLvSum < nextCard.level) {
                                        sc += 12;
                                    }
                                }
                            }
                            if (sc > bestScore) {
                                bestScore = sc;
                                optIdx = i;
                            }
                        }
                        if (bestScore <= 0 && /sends itself|send itself|\brevives?\b|\bdecrease\b|\breduce\b|\badd\b.*\bback\b|\btwo\b/i.test(resolvingStep?.text || '')) {
                            optIdx = 1;
                        }
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

                    let chosenIdx = null;
                    if (selectCards.length > 0 && unselectCards.length < maxSelect) {
                        const candidateCodes = [];
                        if (stepIdx > 0 && steps[stepIdx - 1]) {
                            for (const c of findStepCardCodes(steps[stepIdx - 1], lastActorCode)) {
                                if (c !== lastActorCode && !candidateCodes.includes(c)) candidateCodes.push(c);
                            }
                        }
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                            for (const c of findStepCardCodes(steps[s], lastActorCode)) {
                                if (c !== lastActorCode && !candidateCodes.includes(c)) candidateCodes.push(c);
                            }
                        }
                        const alreadyInUnselect = new Set(unselectCards.map(u => u.code));
                        for (const code of candidateCodes) {
                            if (m.can_finish && alreadyInUnselect.has(code)) continue;
                            const found = selectCards.findIndex(c => c.code === code);
                            if (found !== -1) {
                                chosenIdx = found;
                                break;
                            }
                        }
                    }

                    if (chosenIdx === null) {
                        if (m.can_finish && unselectCards.length >= minSelect) {
                            chosenIdx = null;
                        } else if (selectCards.length > 0) {
                            chosenIdx = 0;
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

                    const dfsSum = (startIdx, currentIndices, currentSum) => {
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
                        for (let i = startIdx; i < selects.length; i++) {
                            const v1 = (selects[i].amount || 0) & 0xffff;
                            const v2 = ((selects[i].amount || 0) >> 16) & 0xffff;
                            currentIndices.push(i);
                            dfsSum(i + 1, currentIndices, currentSum + v1);
                            if (!exactChosen && v2 > 0 && v2 !== v1) {
                                dfsSum(i + 1, currentIndices, currentSum + v2);
                            }
                            currentIndices.pop();
                            if (exactChosen) return;
                        }
                    };
                    dfsSum(0, [], 0);

                    const chosen = exactChosen || overflowChosen || [0];
                    for (const idx of chosen) {
                        if (selects[idx]?.code) {
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
                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    const numMatch = (resolvingStep?.text || '').match(/\b(?:level|rank)?\s*(\d+)\b/i);
                    if (numMatch && m.options) {
                        const targetNum = BigInt(numMatch[1]);
                        const found = m.options.findIndex(o => BigInt(o) === targetNum);
                        if (found !== -1) valIdx = found;
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
                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    const codes = findStepCardCodes(resolvingStep, lastActorCode).filter(c => c !== lastActorCode && c !== lastSelectedCardCode);
                    const opCodeCard = (m.opcodes || []).map(o => Number(o)).find(n => n > 10000 && n < 100000000 && getCardByCode(n));
                    let announcedCode = codes[0] || opCodeCard || 89631139;
                    if (!codes[0] && !opCodeCard && /normal monster/i.test(resolvingStep?.text || '')) {
                        const normalMon = resolved.find(c => (c.data.type & 0x11) === 0x11);
                        if (normalMon) announcedCode = normalMon.code;
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.ANNOUNCE_CARD,
                        card: announcedCode
                    });

                } else if (m.type === OcgMessageType.SELECT_YESNO || m.type === 13) { // SELECT_YESNO
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_YESNO,
                        yes: true
                    });

                } else if (m.type === 1) { // RETRY
                    errors.push(`Engine rejected response (RETRY) at step ${stepIdx}.`);
                    break;
                }
            }

            skipRedundantVisualSteps();

            const hasIdleCmd = msgs.some(m => m.type === 11);
            if (stepIdx >= steps.length && status === OcgProcessResult.WAITING && hasIdleCmd) {
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
            steps[i].actions = acts;
            if (acts.length > 0) {
                steps[i].card = acts[0].card;
                steps[i].to = acts[0].to;
            } else if (i >= stepIdx) {
                // Steps that failed or were not offered should not retain phantom movements
                steps[i].card = undefined;
                steps[i].to = undefined;
            }
        }

        const legal = (errors.length === 0 && stepIdx >= steps.length);

        return {
            status: legal ? 'VERIFIED_LEGAL' : 'ILLEGAL_OR_INCOMPLETE',
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
