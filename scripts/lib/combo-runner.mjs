import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
    createDuelInstance,
    getCardByCode,
    getCardByName,
    getScript,
    OcgDuelMode,
    OcgLocation,
    OcgPosition,
    OcgProcessResult,
    OcgResponseType,
    SelectIdleCMDAction,
    ocgMessageTypeStrings
} from './card-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CDB_PATH = path.resolve(__dirname, '../../assets/data/cards.cdb');

const db = new DatabaseSync(CDB_PATH);
const stmtByCode = db.prepare('SELECT datas.*, texts.name FROM datas JOIN texts ON datas.id = texts.id WHERE datas.id = ?');
const stmtByName = db.prepare('SELECT datas.*, texts.name FROM datas JOIN texts ON datas.id = texts.id WHERE LOWER(texts.name) = LOWER(?) LIMIT 1');

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
export function resolveComboCards(combo) {
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
    const { resolved, idMap, nameMap, missing } = resolveComboCards(combo);

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
        const maxLoops = Math.max(120, steps.length * 15);
        const log = [];
        const errors = [];

        function findStepCardCode(step) {
            if (!step) return null;
            if (step.card && idMap.has(step.card)) {
                return idMap.get(step.card).code;
            }
            if (step.actions && step.actions.length > 0) {
                for (const act of step.actions) {
                    if (act.card && idMap.has(act.card)) {
                        return idMap.get(act.card).code;
                    }
                }
            }
            const textLower = (step.text || '').toLowerCase();
            for (const [name, c] of nameMap.entries()) {
                if (textLower.includes(name)) {
                    return c.code;
                }
            }
            return null;
        }

        function skipRedundantVisualSteps() {
            while (stepIdx < steps.length) {
                const s = steps[stepIdx];
                const t = (s.text || '').toLowerCase();

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
                // Skip UI visual spell graveyard sending steps
                if (/^(move to (graveyard|gy)|send .* to (graveyard|gy)|resolve )/i.test(t)) {
                    stepIdx++;
                    continue;
                }
                break;
            }
        }

        while (loopCount++ < maxLoops) {
            const status = lib.duelProcess(duel);
            const msgs = lib.duelGetMessage(duel);

            for (const m of msgs) {
                const msgName = ocgMessageTypeStrings.get(m.type) || m.type;

                if (m.type === 11) { // SELECT_IDLECMD
                    skipRedundantVisualSteps();

                    if (stepIdx >= steps.length) {
                        break;
                    }

                    const currentStep = steps[stepIdx];
                    const targetCode = findStepCardCode(currentStep);
                    const text = (currentStep.text || '').toLowerCase();

                    const isNormalSummon = /normal summon/i.test(text);
                    const isSpSummon = /(special summon|link summon|synchro summon|xyz summon|fusion summon)/i.test(text);
                    const isActivate = /activate/i.test(text);
                    const isSet = /set/i.test(text);

                    let acted = false;

                    // 1. Normal Summon
                    if (isNormalSummon && m.summons && m.summons.length > 0) {
                        const sIdx = targetCode
                            ? m.summons.findIndex(c => c.code === targetCode)
                            : 0;
                        if (sIdx !== -1) {
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

                    // 2. Special Summon from Extra Deck or Hand
                    if (!acted && isSpSummon && m.special_summons && m.special_summons.length > 0) {
                        const sIdx = targetCode
                            ? m.special_summons.findIndex(c => c.code === targetCode)
                            : 0;
                        if (sIdx !== -1) {
                            lib.duelSetResponse(duel, {
                                type: OcgResponseType.SELECT_IDLECMD,
                                action: SelectIdleCMDAction.SELECT_SPECIAL_SUMMON,
                                index: sIdx
                            });
                            log.push(`Step ${stepIdx + 1}: Legal Special Summon of code ${m.special_summons[sIdx].code}`);
                            stepIdx++;
                            skipRedundantVisualSteps();
                            acted = true;
                        }
                    }

                    // 3. Activation from hand, field, or GY
                    if (!acted && (isActivate || isSpSummon) && m.activates && m.activates.length > 0) {
                        const aIdx = targetCode
                            ? m.activates.findIndex(c => c.code === targetCode)
                            : 0;
                        if (aIdx !== -1) {
                            lib.duelSetResponse(duel, {
                                type: OcgResponseType.SELECT_IDLECMD,
                                action: SelectIdleCMDAction.SELECT_ACTIVATE,
                                index: aIdx
                            });
                            log.push(`Step ${stepIdx + 1}: Legal Activation of code ${m.activates[aIdx].code}`);
                            stepIdx++;
                            skipRedundantVisualSteps();
                            acted = true;
                        }
                    }

                    // 4. Set card from hand
                    if (!acted && isSet) {
                        if (m.spell_sets && m.spell_sets.length > 0) {
                            const setIdx = targetCode
                                ? m.spell_sets.findIndex(c => c.code === targetCode)
                                : 0;
                            if (setIdx !== -1) {
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

                    // If unhandled, check if it was a passive resolution step
                    if (!acted) {
                        if (/(add |send |move to|draw|detach|tribute|discard)/i.test(text)) {
                            stepIdx++;
                            skipRedundantVisualSteps();
                            continue;
                        }
                        errors.push(`Step ${stepIdx + 1} ("${currentStep.text}") was not offered as a legal action by the duel engine.`);
                        break;
                    }

                } else if (m.type === 12) { // SELECT_EFFECTYN
                    // Optional trigger effect prompt: scan forward up to 3 steps
                    let wantsEffect = false;
                    let matchedStepIdx = -1;
                    for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 3); s++) {
                        const code = findStepCardCode(steps[s]);
                        if (code === m.code && /(activate|trigger|effect)/i.test(steps[s].text || '')) {
                            wantsEffect = true;
                            matchedStepIdx = s;
                            break;
                        }
                    }
                    // Default to true if current step card matches
                    if (!wantsEffect && findStepCardCode(steps[stepIdx]) === m.code) {
                        wantsEffect = true;
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_EFFECTYN,
                        yes: wantsEffect
                    });
                    if (wantsEffect) {
                        log.push(`Trigger Effect Accepted for Card Code ${m.code}`);
                        if (matchedStepIdx !== -1) {
                            stepIdx = matchedStepIdx + 1;
                            skipRedundantVisualSteps();
                        }
                    }

                } else if (m.type === 15) { // SELECT_CARD
                    // Find which card in m.selects matches current or upcoming steps
                    let chosen = [];
                    let matchedStepIdx = -1;

                    for (let s = stepIdx; s < Math.min(steps.length, stepIdx + 4); s++) {
                        const code = findStepCardCode(steps[s]);
                        if (code && m.selects && m.selects.length > 0) {
                            const foundIdx = m.selects.findIndex((c, i) => c.code === code && !chosen.includes(i));
                            if (foundIdx !== -1) {
                                chosen.push(foundIdx);
                                if (matchedStepIdx === -1) matchedStepIdx = s;
                                if (chosen.length >= (m.max || 1)) break;
                            }
                        }
                    }

                    // Fill to m.min if needed
                    for (let i = 0; i < (m.selects || []).length && chosen.length < (m.min || 1); i++) {
                        if (!chosen.includes(i)) chosen.push(i);
                    }

                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_CARD,
                        indicies: chosen.length > 0 ? chosen : [0]
                    });

                    log.push(`Selected Card(s) [${chosen.join(', ')}] from location ${m.selects?.[chosen[0]]?.location}`);
                    if (matchedStepIdx !== -1) {
                        stepIdx = matchedStepIdx + 1;
                        skipRedundantVisualSteps();
                    }

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
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_CHAIN,
                        index: null // Pass priority
                    });

                } else if (m.type === 19) { // SELECT_POSITION
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_POSITION,
                        position: OcgPosition.FACEUP_ATTACK
                    });

                } else if (m.type === 13) { // SELECT_OPTION
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_OPTION,
                        index: 0
                    });

                } else if (m.type === 20) { // SELECT_TRIBUTE
                    const chosen = [];
                    for (let i = 0; i < (m.selects || []).length && chosen.length < (m.min || 1); i++) {
                        chosen.push(i);
                    }
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_TRIBUTE,
                        indicies: chosen.length > 0 ? chosen : [0]
                    });

                } else if (m.type === 26) { // SELECT_UNSELECT_CARD
                    lib.duelSetResponse(duel, {
                        type: OcgResponseType.SELECT_UNSELECT_CARD,
                        index: m.can_finish ? null : 0
                    });

                } else if (m.type === 23) { // SELECT_SUM
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

                } else if (m.type === 3) { // SELECT_YESNO
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
