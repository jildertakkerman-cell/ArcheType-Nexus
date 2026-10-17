import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
    createDuelInstance,
    getCardByCode,
    getCardByName,
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
    return name
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
 * Decodes legal zone places from ocgcore field_mask (0 = available, 1 = forbidden).
 */
export function getAvailablePlaces(fieldMask, player = 0) {
    const places = [];
    const mask = Number(BigInt.asUintN(32, BigInt(fieldMask)));

    // Player 0 Monster Zones (bits 0-4)
    for (let seq = 0; seq < 5; seq++) {
        if ((mask & (1 << seq)) === 0) {
            places.push({ player: 0, location: OcgLocation.MZONE, sequence: seq });
        }
    }
    // Extra Monster Zones (bits 5-6)
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

        function matchFragmentCodes(frag) {
            if (!frag) return [];
            let clean = frag.trim()
                .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+|2nd\s+|second\s+)/i, '')
                .replace(/(?:'s|s')$/i, '')
                .trim()
                .toLowerCase();
            if (!clean || clean.length < 3) return [];
            if (/^(?:effect|card|monster|spell|trap|deck|hand|field|graveyard|turn|phase|level|rank|link|scale|pendulum|normal|special|summon|activate|tribute|discard|banish|search|add|set)$/i.test(clean)) {
                return [];
            }

            // Special case: "the Servant" -> monster with "servant" in name
            if (/^the\s+servant$/i.test(frag.trim())) {
                const monsterServant = [...nameMap.values()].find(c => c.officialName.toLowerCase().includes('servant') && (c.data.type & 1));
                if (monsterServant) return [monsterServant.code];
            }

            if (nameMap.has(clean)) {
                return [nameMap.get(clean).code];
            }

            const sorted = [...nameMap.entries()].sort((a, b) => b[0].length - a[0].length);
            const matched = [];
            for (const [name, c] of sorted) {
                if (clean.includes(name)) {
                    matched.push(c.code);
                }
            }
            if (matched.length > 0) return matched;

            const wordRe = new RegExp(`\\b${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            for (const [name, c] of sorted) {
                if (wordRe.test(name)) {
                    matched.push(c.code);
                }
            }
            return matched;
        }

        function findStepCardCodes(step, prevActorCode = null) {
            if (!step) return [];
            const codes = [];
            const addCode = (c) => {
                if (c && !codes.includes(c)) codes.push(c);
            };

            const rawText = step.text || '';
            const textLower = rawText.toLowerCase();

            // 1. Pronoun reference to previous card ("Tribute it", "Use its effect", "Activate its effect", "Set it", "Link it")
            if (/^(?:tribute it|use (?:its|her|his)|activate (?:its|her|his)|(?:its|her|his) effect|set it|banish it|link it)/i.test(rawText.trim()) && prevActorCode) {
                addCode(prevActorCode);
            }

            // 2. "Reveal <Spell/Card> to Special Summon <Monster>" -> <Monster> is the hand effect activator, <Spell/Card> is the cost
            const revealToSummon = rawText.match(/reveal\s+([A-Za-z0-9'\s-:]+?)\s+to\s+special summon\s+([A-Za-z0-9'\s-:]+?)(?::|\.|\s+from|\s+to|,|\s+and|\s+then|$)/i);
            if (revealToSummon) {
                for (const c of matchFragmentCodes(revealToSummon[2])) addCode(c);
                for (const c of matchFragmentCodes(revealToSummon[1])) addCode(c);
            }

            // 3. Explicit effect owner: "Activate/Use/Trigger <Card>'s [monster/gy/hand] effect"
            const ownerMatch = rawText.match(/(?:activate|use|trigger)\s+([A-Za-z0-9'\s-]+?)(?:'s|\s+monster|\s+gy|\s+graveyard|\s+hand|\s+field|\s+scale)?\s+effect/i);
            if (ownerMatch) {
                for (const c of matchFragmentCodes(ownerMatch[1])) addCode(c);
            }

            // 4. Primary verb target: "Normal Summon <X>", "Activate <X>", "Link Summon <X>", etc.
            const verbMatches = [...rawText.matchAll(/(?:normal summon|tribute summon|^summon|activate|reveal|special summon|link summon|synchro summon|xyz summon|fusion summon|rank-up into|overlay (?:into|to)|contact fusion|contact fuse(?: into)?|link .* into|set)\s+(?:-\s*)?([A-Za-z0-9'\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+into\b|\s+as\b|\s+in\b|\s+on\b|,|\s+and\b|$)/gi)];
            for (const vm of verbMatches) {
                for (const c of matchFragmentCodes(vm[1])) addCode(c);
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
                // Skip UI visual spell graveyard sending steps, commentary, banlist notes, and phase transitions
                if (
                    /^(?:move to (?:graveyard|gy)|send .* to (?:graveyard|gy)|.*goes to the (?:gy|graveyard)|resolve |battle phase:|end your turn|pass (?:the )?turn|legal because|this is (?:legal|done|the|your|a\b)|this (?:establishes|sequence|allows|gives|leaves|sets up|creates)|that is two layers|going second|you (?:now have|can now|are now|have now)|from here, a series|the goal is to|result:|note:|due to spiral fusion|nothing else is required|preparation of rites cannot help|start with .* in hand|begin with a starter|with (?:three|3|two|2) (?:level|spellbooks|monsters).*, you (?:have|can))/i.test(trimmed) ||
                    /(?:is currently banned|is now forbidden|remains in hand for another reveal)/i.test(trimmed)
                ) {
                    stepIdx++;
                    continue;
                }
                break;
            }
        }

        let triggersFiredSinceLastIdle = 0;
        const cardsSelectedSinceLastIdle = new Set();
        let inOpponentTurn = false;

        while (loopCount++ < maxLoops) {
            const status = lib.duelProcess(duel);
            const msgs = lib.duelGetMessage(duel);
            if (options.debug) console.log(`[LOOP ${loopCount}] status=${status}, msgs=${msgs.length}`);

            for (const m of msgs) {
                const msgName = ocgMessageTypeStrings.get(m.type) || m.type;
                if (options.debug) console.log('ENGINE MSG:', m.type, msgName);

                if (m.type === 11) { // SELECT_IDLECMD
                    if (m.player === 1) {
                        lib.duelSetResponse(duel, {
                            type: OcgResponseType.SELECT_IDLECMD,
                            action: SelectIdleCMDAction.TO_EP,
                            index: 0
                        });
                        continue;
                    }

                    while (stepIdx < steps.length) {
                        skipRedundantVisualSteps();

                        if (stepIdx >= steps.length) {
                            break;
                        }

                        const currentStep = steps[stepIdx];
                        const rawStepText = (currentStep.text || '').trim();
                        const text = rawStepText.toLowerCase();

                        // Handle transition to opponent's turn ("On your opponent's turn...")
                        if (/^(?:on|during|in) (?:your |the )?opponent's turn\b/i.test(rawStepText)) {
                            inOpponentTurn = true;
                            if (/^(?:on|during|in) (?:your |the )?opponent's turn\.?$/i.test(rawStepText)) {
                                stepIdx++;
                                skipRedundantVisualSteps();
                            }
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

                        // If this step describes a Chain Link or a trigger/search/on-activation effect that already resolved since the last IDLECMD, advance immediately
                        const isPureChainOrTriggerStep = /^(?:chain link \d|cl1\b|a chain forms|build the chain|action:\s*activate .* \(on .* summon\)|on summon\b|when summoned\b|if summoned\b|(?:its|her|his|their|[a-z0-9'-]+'s) effect (?:activates|triggers|searches|adds|places|grants|allows|lets|special summons|summons|revives)\b|its own on-activation effect\b|[^\s]+(?:'s)? summon trigger\b|her arrival turns on\b|his arrival turns on\b|its arrival turns on\b)/i.test(rawStepText);
                        const isAlreadyResolvedSearchOrSet = (triggersFiredSinceLastIdle > 0 || cardsSelectedSinceLastIdle.size > 0) && (
                            /^(?:(?:activate|use) (?:its|her|his|the) (?:on-summon |summon )?effect to (?:search|add|set|send|dump)\b|search\b|add\b.*to (?:your )?hand|add\b.*off the rider|put\b.*back on top|place\b.*on (?:top|bottom)|(?:then,?\s+)?set\b.*from (?:the |your )?(?:deck|gy|graveyard))/i.test(rawStepText) ||
                            (!prevActorHasIdleEffect && /^(?:activate|use) (?:its|her|his|the) (?:on-summon |summon )?effect to (?:place|special summon|summon|revive|gain|equip|target|increase|return|recover)\b/i.test(rawStepText)) ||
                            (/(?:special summons?|summons) itself\b/i.test(rawStepText) && stepCodes.some(c => cardsSelectedSinceLastIdle.has(c)))
                        );
                        if (isPureChainOrTriggerStep || isAlreadyResolvedSearchOrSet) {
                            stepIdx++;
                            skipRedundantVisualSteps();
                            continue;
                        }

                        // Strip search/add/set/discard target clauses when identifying the actor card to summon/activate in IDLECMD
                        const actorText = rawStepText
                            .replace(/(?:,\s*|\s+by\s+|\s+and\s+)?discard(?:ing)?\s+[A-Za-z0-9'\s-]+?(?=\s+to\b|,|\.|$)/gi, '')
                            .replace(/\bsends?\s+[A-Za-z0-9'\s-]+?\s+from\s+(?:the\s+|your\s+)?deck\b.*$/i, '')
                            .replace(/\bto\s+(?:search|add|send|dump|foolish|bury|set|place|put|draw|destroy)\b.*$/i, '');
                        const actorOnlyCodes = findStepCardCodes({ ...currentStep, text: actorText, featuredCard: null }, lastActorCode);
                        const idleCodes = actorOnlyCodes.length > 0 ? actorOnlyCodes : stepCodes;

                        const isExtraOrProcSummon = /(?:link summon|synchro summon|xyz summon|fusion summon|rank-up into|overlay (?:into|to)|contact fuse|contact fusion|link .* into|link (?:climb|it|them|away))/i.test(text);
                        const isNormalSummon = /(?:normal summon|tribute summon|tribute .* for\b|^summon\b)/i.test(text) && !isExtraOrProcSummon && !/special summon/i.test(text);
                        const isSpSummon = isExtraOrProcSummon || /(?:special summon|\brevives?\b)/i.test(text);
                        const isExplicitEffectActivation = /(?:^activate\b|^use\b|^tribute\b|^reveal\b|^discard\b|^banish\b|\beffect\b)/i.test(rawStepText) && !isExtraOrProcSummon;
                        const isActivate = isExplicitEffectActivation || /(?:activate|search|add .* to hand|look at the top|sends? .* from (?:the |your )?deck|\bdumps?\b|\bstacks?\b|\brevives?\b)/i.test(text);
                        const isSet = /\bset\b/i.test(text) && !/from (?:the |your )?(?:deck|gy|graveyard)/i.test(text);

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
                            if (sIdx === -1 && stepCodes.length === 0) sIdx = 0;
                            if (sIdx !== -1) {
                                lastActorCode = m.special_summons[sIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_SPECIAL_SUMMON,
                                    index: sIdx
                                });
                                log.push(`Step ${stepIdx + 1}: Legal Special Summon of code ${m.special_summons[sIdx].code}`);
                                stepIdx++;
                                skipRedundantVisualSteps();
                                return true;
                            }
                            return false;
                        };

                        // Helper to try Activation from m.activates
                        const tryActivate = () => {
                            if (!(isActivate || isSpSummon) || !m.activates || m.activates.length === 0) return false;
                            let aIdx = -1;
                            for (const code of idleCodes) {
                                aIdx = m.activates.findIndex(c => c.code === code);
                                if (aIdx !== -1) break;
                            }
                            if (aIdx === -1 && stepCodes.length === 0) aIdx = 0;
                            if (aIdx !== -1) {
                                lastActorCode = m.activates[aIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_ACTIVATE,
                                    index: aIdx
                                });
                                log.push(`Step ${stepIdx + 1}: Legal Activation of code ${m.activates[aIdx].code}`);
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
                            if (sIdx === -1 && stepCodes.length === 0) sIdx = 0;
                            if (sIdx !== -1) {
                                lastActorCode = m.summons[sIdx].code;
                                triggersFiredSinceLastIdle = 0;
                                cardsSelectedSinceLastIdle.clear();
                                lib.duelSetResponse(duel, {
                                    type: OcgResponseType.SELECT_IDLECMD,
                                    action: SelectIdleCMDAction.SELECT_SUMMON,
                                    index: sIdx
                                });
                                log.push(`Step ${stepIdx + 1}: Legal Normal Summon of code ${m.summons[sIdx].code}`);
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
                                if (setIdx === -1 && stepCodes.length === 0) setIdx = 0;
                                if (setIdx !== -1) {
                                    lastActorCode = m.spell_sets[setIdx].code;
                                    triggersFiredSinceLastIdle = 0;
                                    cardsSelectedSinceLastIdle.clear();
                                    lib.duelSetResponse(duel, {
                                        type: OcgResponseType.SELECT_IDLECMD,
                                        action: SelectIdleCMDAction.SELECT_SPELL_SET,
                                        index: setIdx
                                    });
                                    log.push(`Step ${stepIdx + 1}: Legal Spell/Trap Set of code ${m.spell_sets[setIdx].code}`);
                                    stepIdx++;
                                    skipRedundantVisualSteps();
                                    acted = true;
                                }
                            }
                        }

                        if (acted) {
                            break;
                        }

                        // If unhandled, check if it was a trigger effect, chain resolution, or passive text
                        const isTriggerOrResolution = /(?:chain link \d|a chain forms|trigger|on summon|if summoned|when summoned|activate (?:its|the) effect to (?:search|add|send|dump|draw|destroy|set)|its own on-activation effect|set .* from (?:the |your )?(?:deck|gy|graveyard)|search |add .* to hand|put .* back on top|place .* on (?:top|bottom) of (?:the|your) deck|is now in the gy|is now a .* monster|sets up your|securing a|that is two layers|going second|keeping the extra monster zone|legal because|end your turn)/i.test(text);
                        if (isTriggerOrResolution) {
                            stepIdx++;
                            skipRedundantVisualSteps();
                            continue;
                        }
                        const isMainAction = isNormalSummon || isSpSummon || isActivate || isSet;
                        if (!isMainAction && /(add |send |move to|draw|detach|tribute|discard|put |place )/i.test(text)) {
                            stepIdx++;
                            skipRedundantVisualSteps();
                            continue;
                        }
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
                        log.push(`Trigger Effect Accepted for Card Code ${m.code}`);
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
                    if (stepIdx > 0 && steps[stepIdx - 1]) {
                        const activeCodes = findStepCardCodes(steps[stepIdx - 1], lastActorCode);
                        const nonActorCodes = activeCodes.filter(c => c !== lastActorCode && !cardsSelectedSinceLastIdle.has(c));
                        tryMatchCodes(nonActorCodes);
                    }

                    // 2. Check upcoming steps (stepIdx .. stepIdx + 3)
                    for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                        if (chosen.length >= maxSelect) break;
                        const futureCodes = findStepCardCodes(steps[s], lastActorCode);
                        tryMatchCodes(futureCodes);
                    }

                    // 3. If still not enough, allow lastActorCode if mentioned in resolving step
                    if (chosen.length < maxSelect && stepIdx > 0 && steps[stepIdx - 1]) {
                        const activeCodes = findStepCardCodes(steps[stepIdx - 1], lastActorCode);
                        if (activeCodes.includes(lastActorCode)) {
                            tryMatchCodes([lastActorCode]);
                        }
                    }

                    // 3. Fill to minSelect if needed, preferring cards NOT needed as active starters in upcoming steps
                    if (chosen.length < minSelect && m.selects && m.selects.length > 0) {
                        const upcomingNeeded = new Set();
                        for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                            for (const c of findStepCardCodes(steps[s], lastActorCode)) upcomingNeeded.add(c);
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
                        }
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_CARD,
                        indicies: finalIndices
                    });

                    log.push(`Selected Card(s) [${finalIndices.join(', ')}] from location ${m.selects?.[finalIndices[0]]?.location}`);

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
                                log.push(`Step ${stepIdx + 1}: Legal Opponent-Turn Activation of code ${m.selects[foundOpp].code}`);
                                stepIdx++;
                                skipRedundantVisualSteps();
                            }
                        }
                        if (chainIdx === null) {
                            for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                                const stText = steps[s]?.text || '';
                                if (/(?:chain link \d|a chain forms|\bchain\b|summon trigger|turns on)/i.test(stText)) {
                                    const chainActorText = stText.replace(/\b(?:to\s+(?:search|add|send|dump|set)|searches|adds|sets)\b.*$/i, '');
                                    const codes = findStepCardCodes({ ...steps[s], text: chainActorText, featuredCard: null }, lastActorCode);
                                    const found = m.selects.findIndex(c => codes.includes(c.code));
                                    if (found !== -1) {
                                        chainIdx = found;
                                        break;
                                    }
                                }
                            }
                            if (chainIdx !== null) {
                                triggersFiredSinceLastIdle++;
                                log.push(`Chain Trigger Accepted for Card Code ${m.selects[chainIdx].code}`);
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
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_POSITION,
                        position: OcgPosition.FACEUP_ATTACK
                    });

                } else if (m.type === OcgMessageType.SELECT_OPTION || m.type === 14) { // SELECT_OPTION
                    let optIdx = 0;
                    const resolvingStep = stepIdx > 0 ? steps[stepIdx - 1] : steps[stepIdx];
                    if (resolvingStep && /sends itself|send itself|\brevives?\b/i.test(resolvingStep.text || '') && (m.options || []).length > 1) {
                        optIdx = 1;
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_OPTION,
                        index: optIdx
                    });

                } else if (m.type === OcgMessageType.SELECT_TRIBUTE || m.type === 20) { // SELECT_TRIBUTE
                    const chosen = [];
                    for (let i = 0; i < (m.selects || []).length && chosen.length < (m.min || 1); i++) {
                        chosen.push(i);
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_TRIBUTE,
                        indicies: chosen.length > 0 ? chosen : [0]
                    });

                } else if (m.type === OcgMessageType.SELECT_UNSELECT_CARD || m.type === 26) { // SELECT_UNSELECT_CARD
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_UNSELECT_CARD,
                        index: m.can_finish ? null : 0
                    });

                } else if (m.type === OcgMessageType.SELECT_SUM || m.type === 23) { // SELECT_SUM
                    // Pick materials matching sum requirement
                    const chosen = [];
                    let currentSum = 0;
                    for (let i = 0; i < (m.selects || []).length; i++) {
                        chosen.push(i);
                        currentSum += (m.selects[i].amount || 0);
                        if (currentSum >= m.amount) break;
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_SUM,
                        indicies: chosen.length > 0 ? chosen : [0]
                    });

                } else if (m.type === OcgMessageType.SELECT_YESNO || m.type === 13) { // SELECT_YESNO
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_YESNO,
                        yes: true
                    });
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

        // Query final board state
        const fieldState = lib.duelQueryField(duel);
        const monstersOnField = fieldState.players[0].monsters.filter(m => m && m.position !== 0).length;
        const spellsOnField = fieldState.players[0].spells.filter(s => s && s.position !== 0).length;

        const legal = (errors.length === 0 && stepIdx >= steps.length);

        return {
            status: legal ? 'VERIFIED_LEGAL' : 'ILLEGAL_OR_INCOMPLETE',
            legal,
            stepsCompleted: Math.min(stepIdx, steps.length),
            totalSteps: steps.length,
            errors,
            log,
            board: {
                monsters: monstersOnField,
                spells: spellsOnField
            }
        };

    } finally {
        lib.destroyDuel(duel);
    }
}
