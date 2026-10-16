const fs = require('fs');
const path = require('path');

const DECK_DIR = path.join(__dirname, '../assets/data/decklists');
const CARDS_CACHE = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/cards-cache.json'), 'utf8'));

const RACES = [
    'Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Divine-Beast', 'Dragon',
    'Fairy', 'Fiend', 'Fish', 'Illusion', 'Insect', 'Machine', 'Plant', 'Psychic',
    'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior',
    'Winged Beast', 'Wyrm', 'Zombie'
];
const ATTRIBUTES = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];

const TYPES = [
    'aqua', 'beast', 'creator god', 'cyberse', 'dinosaur', 'divine-beast', 'dragon', 'dragons',
    'fairy', 'fiend', 'fiends', 'fish', 'illusion', 'insect', 'insects', 'machine', 'machines',
    'plant', 'plants', 'psychic', 'pyro', 'reptile', 'reptiles', 'rock', 'rocks', 'sea serpent',
    'spellcaster', 'spellcasters', 'thunder', 'warrior', 'warriors', 'winged beast', 'wyrm', 'wyrms',
    'zombie', 'zombies'
];
const ATTRS = ['dark', 'light', 'earth', 'water', 'fire', 'wind', 'divine'];

const RESERVED_WORDS = new Set([
    'fusion', 'synchro', 'xyz', 'link', 'tribute', 'ritual', 'flip', 'normal', 'special',
    'monster', 'monsters', 'spell', 'spells', 'trap', 'traps', 'effect', 'effects',
    'deck', 'hand', 'graveyard', 'gy', 'level', 'rank', 'scale', 'pendulum', 'token', 'tokens',
    'activation', 'summon', 'summons', 'turn', 'cost', 'target', 'targets', 'phase', 'damage', 'battle',
    'material', 'materials', 'card', 'cards', 'counter', 'counters',
    'hero', 'heroes', 'magician', 'magicians', 'rose', 'patron', 'spirit', 'knight', 'knights',
    'shade', 'dragon', 'dragons', 'force', 'power', 'break', 'armor', 'box', 'city', 'soldier',
    ...TYPES,
    ...ATTRS
]);

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canSearchDirectly(searcherCard, targetCard) {
    const sDesc = searcherCard.desc || '';
    const clauses = sDesc.split(/(?:;|\. |\n)/g);

    for (const clause of clauses) {
        if (!/(?:deck|add 1|special summon|send 1|set 1)/i.test(clause)) {
            continue;
        }

        // 1. Generic dumps
        if (/send (?:1|a|an) monster from your deck to the gy/i.test(clause) || /send 1 card from your deck to the gy/i.test(clause)) {
            return { valid: true, matchedClause: 'Generic dump (Foolish Burial style)' };
        }
        if (/send (?:1|a|an) (?:spell|trap|spell\/trap) from your deck/i.test(clause)) {
            if (/spell|trap/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Generic Spell/Trap dump' };
            }
        }
        if (/send (?:1|a|an) trap from your deck/i.test(clause)) {
            if (/trap/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Generic Trap dump' };
            }
        }
        if (/(?:add|place|set) (?:1|a|an) field spell/i.test(clause)) {
            if (targetCard.race === 'Field') {
                return { valid: true, matchedClause: 'Field Spell search' };
            }
        }

        // Extra Deck dump: e.g. Ext Ryzeal, Infernoid Tierra
        if (/send [^.;:]*?from (?:both players' |your |their )?extra deck/i.test(clause) || /sending [^.;:]*?from (?:both players' |your |their )?extra deck/i.test(clause)) {
            if (/fusion|synchro|xyz|link/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Extra Deck dump' };
            }
        }

        // 2. Exact card name mentioned in double quotes
        const exactNameRegex = new RegExp(`"${escapeRegex(targetCard.name)}"`, 'i');
        if (exactNameRegex.test(clause)) {
            return { valid: true, matchedClause: `Explicitly names "${targetCard.name}"` };
        }

        // 3a. Mentions / specifically lists card(s)
        const mentionsMatch = clause.match(/(?:specifically lists|mentions)(?: all of)?\s*(.+?)(?:$|[.;])/i);
        if (mentionsMatch) {
            const rawList = mentionsMatch[1];
            const quotedNames = [...rawList.matchAll(/"([^"\n]+)"/g)].map(m => m[1].toLowerCase());
            if (quotedNames.length > 0) {
                const targetText = ((targetCard.name || '') + ' ' + (targetCard.desc || '')).toLowerCase();
                const allMentioned = quotedNames.every(qName => targetText.includes(qName));
                if (allMentioned) {
                    let typeOk = true;
                    if (/\bspell\/trap that mentions\b/i.test(clause)) {
                        if (!/spell|trap/i.test(targetCard.type)) typeOk = false;
                    } else if (/\btrap that mentions\b/i.test(clause)) {
                        if (!/trap/i.test(targetCard.type)) typeOk = false;
                    } else if (/\bspell that mentions\b/i.test(clause)) {
                        if (!/spell/i.test(targetCard.type)) typeOk = false;
                    } else if (/\bmonster that mentions\b/i.test(clause)) {
                        if (!/monster/i.test(targetCard.type)) typeOk = false;
                    }
                    if (typeOk) {
                        return { valid: true, matchedClause: `Target card mentions required name(s): ${quotedNames.join(', ')}` };
                    }
                }
            }
        }

        // 3b. "Card Name" or 1 card that mentions it / specifically lists it: e.g. Crimson Gaia, Chaos Distill, Toon Bookmark, Koa'ki Meiru Supplier
        const orMentionsMatch = clause.match(/"([^"\n]+)"(?:\s*,)?\s*or\s+(?:1\s+)?card\s+that\s+(?:mentions|specifically lists)\s+(?:it|(?:the card\s*)?"[^"\n]+")/i);
        if (orMentionsMatch) {
            const namedCard = orMentionsMatch[1].toLowerCase();
            const targetText = ((targetCard.name || '') + ' ' + (targetCard.desc || '')).toLowerCase();
            if (targetText.includes(namedCard)) {
                return { valid: true, matchedClause: `Card that mentions/lists "${orMentionsMatch[1]}"` };
            }
        }

        // Also check "specifically lists any of those cards in its text"
        if (/specifically lists (?:any|1) of those cards in its text/i.test(clause)) {
            const priorQuotes = [...clause.matchAll(/"([^"\n]+)"/g)].map(m => m[1].toLowerCase());
            const targetText = ((targetCard.name || '') + ' ' + (targetCard.desc || '')).toLowerCase();
            if (priorQuotes.some(qName => targetText.includes(qName))) {
                return { valid: true, matchedClause: 'Specifically lists one of the previously mentioned cards' };
            }
        }

        // 4. Normal Trap search
        if (/\b(?:set|add)\b[^.;:]*?\bnormal trap\b/i.test(clause) || /\bnormal trap\b[^.;:]*?\bfrom (?:the |your )?deck\b/i.test(clause)) {
            if (targetCard.race === 'Normal' && /trap/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Normal Trap search' };
            }
        }

        // 5. Normal Monster search / dump
        if (/\bnormal monsters?\b/i.test(clause)) {
            if (/normal/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Normal Monster search/dump' };
            }
        }

        // 6. Flip Monster search / dump
        if (/\bflip monsters?\b/i.test(clause)) {
            if (/flip/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Flip Monster search' };
            }
        }

        // 7. Tuner monster search
        if (/\btuner (?:monsters?)?\b/i.test(clause)) {
            if (/tuner/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Tuner monster search' };
            }
        }

        // 8. Pendulum monster search
        if (/\bpendulum monsters?\b/i.test(clause)) {
            if (/pendulum/i.test(targetCard.type)) {
                return { valid: true, matchedClause: 'Pendulum Monster search' };
            }
        }

        // 9. Continuous Spell / Trap
        if (/\bcontinuous spell\b/i.test(clause) && targetCard.race === 'Continuous' && /spell/i.test(targetCard.type)) {
            return { valid: true, matchedClause: 'Continuous Spell search' };
        }
        if (/\bcontinuous trap\b/i.test(clause) && targetCard.race === 'Continuous' && /trap/i.test(targetCard.type)) {
            return { valid: true, matchedClause: 'Continuous Trap search' };
        }

        // 10. Equip Spell
        if (/\bequip spell\b/i.test(clause) && targetCard.race === 'Equip' && /spell/i.test(targetCard.type)) {
            return { valid: true, matchedClause: 'Equip Spell search' };
        }

        // 11. Ritual Spell / Ritual Monster
        if (/\britual spell\b/i.test(clause) && (targetCard.race === 'Ritual' || /ritual/i.test(targetCard.type))) {
            return { valid: true, matchedClause: 'Ritual Spell search' };
        }
        if (/\britual monster\b/i.test(clause) && /ritual/i.test(targetCard.type)) {
            return { valid: true, matchedClause: 'Ritual Monster search' };
        }
        if (searcherCard.name === 'Pre-Preparation of Rites' && (targetCard.race === 'Ritual' || /ritual/i.test(targetCard.type))) {
            return { valid: true, matchedClause: 'Pre-Preparation of Rites search' };
        }

        // 12. Archetype searches (using double quotes only)
        const quoteMatches = [...clause.matchAll(/"([^"\n]+)"\s*(?:,\s*|or\s+)?(\b(?:monster|card|spell\/trap|spell|trap|pendulum monster)s?\b)?/gi)];
        let trailingKind = '';
        for (let k = quoteMatches.length - 1; k >= 0; k--) {
            if (quoteMatches[k][2]) {
                trailingKind = quoteMatches[k][2].toLowerCase();
                break;
            }
        }
        for (const q of quoteMatches) {
            const requiredArch = q[1];
            const cardKind = (q[2] ? q[2].toLowerCase() : trailingKind);
            const targetName = targetCard.name.toLowerCase();
            const targetArch = (targetCard.archetype || '').toLowerCase();

            const matchesArch = targetName.includes(requiredArch.toLowerCase()) || targetArch.includes(requiredArch.toLowerCase());
            if (matchesArch) {
                if (cardKind.includes('monster') && !/monster/i.test(targetCard.type)) continue;
                if (cardKind === 'spell' && !/spell/i.test(targetCard.type)) continue;
                if (cardKind === 'trap' && !/trap/i.test(targetCard.type)) continue;
                if ((cardKind === 'spell/trap' || cardKind.includes('spell') && cardKind.includes('trap')) && !/spell|trap/i.test(targetCard.type)) continue;
                return { valid: true, matchedClause: `Matches archetype "${requiredArch}" ${cardKind}` };
            }
        }

        // 13. Typal (Race) + Level criteria
        for (const race of RACES) {
            const raceRegex = new RegExp(`\\b${race}(?:-Type)? monsters?\\b`, 'i');
            if (raceRegex.test(clause)) {
                if (targetCard.race === race && /monster/i.test(targetCard.type)) {
                    const maxLevelMatch = clause.match(new RegExp(`level (\\d+) or lower (?:[a-z\\s]+ )?${race}[^.;:]*?from (?:your |the )?deck`, 'i'))
                                       || clause.match(new RegExp(`level (\\d+) or lower (?:[a-z\\s]+ )?${race}`, 'i'));
                    if (maxLevelMatch && !/on the field;\s*destroy/i.test(clause)) {
                        const maxLvl = parseInt(maxLevelMatch[1], 10);
                        if (targetCard.level && targetCard.level <= maxLvl) {
                            return { valid: true, matchedClause: `Matches Level ${maxLvl} or lower ${race}` };
                        }
                    } else {
                        return { valid: true, matchedClause: `Matches ${race} monster` };
                    }
                }
            }
        }

        // 14. Attribute criteria
        for (const attr of ATTRIBUTES) {
            const attrRegex = new RegExp(`\\b${attr}\\b.*(?:from (?:your |the )?deck|add|special summon|send)`, 'i');
            if (attrRegex.test(clause) && targetCard.attribute === attr && /monster/i.test(targetCard.type)) {
                const maxLevelMatch = clause.match(new RegExp(`level (\\d+) or lower`, 'i'));
                if (maxLevelMatch) {
                    const maxLvl = parseInt(maxLevelMatch[1], 10);
                    if (targetCard.level && targetCard.level <= maxLvl) {
                        return { valid: true, matchedClause: `Matches Level ${maxLvl} or lower ${attr} monster` };
                    }
                } else {
                    return { valid: true, matchedClause: `Matches Attribute ${attr}` };
                }
            }
        }

        // 15. Generic Level / Rank / Link criteria: e.g. One for One, Spright Sprind
        const genericLevelMatch = clause.match(/\b(?:level|rank|link)[\s/]*(\d+)(?:\s*or\s*(?:lower|less))?\s+monsters?\b/i);
        if (genericLevelMatch && /monster/i.test(targetCard.type)) {
            const reqLvl = parseInt(genericLevelMatch[1], 10);
            const isOrLower = /or (?:lower|less)/i.test(genericLevelMatch[0]);
            const targetLvl = targetCard.level || targetCard.rank || targetCard.linkval;
            if (targetLvl !== undefined && targetLvl !== null) {
                if (isOrLower ? targetLvl <= reqLvl : targetLvl === reqLvl) {
                    return { valid: true, matchedClause: `Matches generic Level/Rank/Link ${reqLvl} monster` };
                }
            }
        }

        // 16. Exact / Stat criteria
        const exactStatsMatch = clause.match(/with (\d+) atk(?:\/| and )(\d+) def/i);
        if (exactStatsMatch) {
            const reqAtk = parseInt(exactStatsMatch[1], 10);
            const reqDef = parseInt(exactStatsMatch[2], 10);
            if (targetCard.atk === reqAtk && targetCard.def === reqDef) {
                return { valid: true, matchedClause: `Matches exact ${reqAtk} ATK / ${reqDef} DEF` };
            }
        }
        const exactDefMatch = clause.match(/with (\d+) def\b/i);
        if (exactDefMatch) {
            const reqDef = parseInt(exactDefMatch[1], 10);
            if (targetCard.def === reqDef) {
                return { valid: true, matchedClause: `Matches exact ${reqDef} DEF` };
            }
        }
        if (/with 0 atk/i.test(clause) && targetCard.atk === 0 && /monster/i.test(targetCard.type)) {
            return { valid: true, matchedClause: '0 ATK monster search' };
        }
        const atkCapMatch = clause.match(/with (\d+) or (?:less|lower) atk/i);
        if (atkCapMatch && targetCard.atk !== null && targetCard.atk <= parseInt(atkCapMatch[1], 10)) {
            return { valid: true, matchedClause: `Monster with <= ${atkCapMatch[1]} ATK` };
        }
        // Cartoon Shade: with 2000 ATK or DEF that cannot be Normal Summoned/Set
        if (/with 2000 atk or def/i.test(clause) && (targetCard.atk === 2000 || targetCard.def === 2000)) {
            if (/cannot be normal summoned/i.test(clause) && /cannot be normal summoned/i.test(targetCard.desc || '')) {
                return { valid: true, matchedClause: '2000 ATK/DEF cannot be Normal Summoned monster' };
            }
        }
    }

    return {
        valid: false,
        reason: `${searcherCard.name} has no search/fetch clause matching ${targetCard.name} (${targetCard.race}, ${targetCard.attribute}, Level ${targetCard.level || targetCard.rank || targetCard.linkval || 'N/A'}, Archetype: ${targetCard.archetype || 'None'}).`
    };
}

function splitIntoClauses(text) {
    const clauses = [];
    // Split on semicolons, periods, newlines, em-dashes, coordinating conjunctions, and comma + capitalized card name + action verb
    const rawClauses = text.split(/(?:;|\. |\n|—|, and (?:then )?|, while |, whereas |, but |, or alternatively |, so that |,\s+(?=[A-Z][A-Za-z0-9'\s-]+\s+(?:searches|adds|dumps|sends|summons|sets|revives|recycles|Normal Summons|Special Summons)\b))/g);
    for (const c of rawClauses) {
        const trimmed = c.trim();
        if (trimmed.length < 10) continue;

        const parens = [...trimmed.matchAll(/\(([^)]+)\)/g)];
        parens.forEach(p => {
            if (p[1].length >= 10 && !/^(?:like|such as)\b/i.test(p[1])) {
                clauses.push(p[1]);
            }
        });

        const withoutParens = trimmed.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
        if (withoutParens.length >= 10) {
            clauses.push(withoutParens);
        }
    }
    return clauses;
}

function buildAliasMap(availableCardNames, archetype, match = []) {
    const aliasMap = new Map();
    const prefixes = [(archetype || ''), ...(match || [])].filter(Boolean);

    for (const fullName of availableCardNames) {
        aliasMap.set(fullName.toLowerCase(), fullName);
        
        // 1. Archetype prefix stripping (e.g. "Elemental HERO Stratos" -> "Stratos")
        for (const prefix of prefixes) {
            const pLower = prefix.toLowerCase();
            const fLower = fullName.toLowerCase();
            if (fLower.startsWith(pLower + ' ')) {
                const short = fullName.slice(prefix.length).trim().replace(/^-\s*/, '');
                const sLower = short.toLowerCase();
                if (short.length >= 4 && !RESERVED_WORDS.has(sLower) && !aliasMap.has(sLower)) {
                    aliasMap.set(sLower, fullName);
                }
            }
        }

        // 2. Part after dash (e.g. "Majespecter Fox - Kyubi" -> "Kyubi")
        if (fullName.includes(' - ')) {
            const afterDash = fullName.split(' - ').slice(1).join(' - ').trim();
            const aLower = afterDash.toLowerCase();
            if (afterDash.length >= 4 && !RESERVED_WORDS.has(aLower) && !aliasMap.has(aLower)) {
                aliasMap.set(aLower, fullName);
            }
        }
    }
    return aliasMap;
}

function extractClaimsFromText(text, availableCardNames, archetype, match = []) {
    const claims = [];
    const clauses = splitIntoClauses(text);
    const aliasMap = buildAliasMap(availableCardNames, archetype, match);
    const allAliases = [...aliasMap.keys()].sort((a, b) => b.length - a.length);

    for (const clause of clauses) {
        if (/(?:xyz summons?(?: directly)? over|fusion summons? .* using|synchro summons? .* using|tunes with .* to|to link summon .* it searches)/i.test(clause)) {
            continue;
        }
        
        // Filter out non-deck fetches
        const clauseWithoutExtra = clause.replace(/\bextra deck\b/gi, '');
        if (/from (?:the |your )?gy\b/i.test(clauseWithoutExtra) && !/deck/i.test(clauseWithoutExtra)) continue;
        if (/from (?:the |your )?hand\b/i.test(clauseWithoutExtra) && !/deck/i.test(clauseWithoutExtra)) continue;
        if (/from (?:the |your )?hand or field\b/i.test(clause)) continue;
        if (/\b(?:re-Sets?|recovers?|salvages?)\b/i.test(clauseWithoutExtra) && !/deck/i.test(clauseWithoutExtra)) continue;
        if (/sends the top \d+ cards of your deck/i.test(clause)) continue;

        let maskedClause = clause;
        const tokens = [];
        for (const alias of allAliases) {
            const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
            let m;
            while ((m = regex.exec(maskedClause)) !== null) {
                const tokenId = `__CARD_${tokens.length}__`;
                const resolvedFullName = aliasMap.get(alias);
                tokens.push({ id: tokenId, fullName: resolvedFullName, index: m.index });
                maskedClause = maskedClause.slice(0, m.index) + tokenId + maskedClause.slice(m.index + m[0].length);
            }
        }

        if (tokens.length < 2) continue;

        const foundTokens = tokens
            .filter(t => maskedClause.includes(t.id))
            .sort((a, b) => maskedClause.indexOf(a.id) - maskedClause.indexOf(b.id));

        const orderedCards = [];
        for (const t of foundTokens) {
            if (!orderedCards.length || orderedCards[orderedCards.length - 1].fullName !== t.fullName) {
                orderedCards.push({ id: t.id, fullName: t.fullName, pos: maskedClause.indexOf(t.id) });
            }
        }

        if (orderedCards.length < 2) continue;

        const chainedPairs = new Set();

        // 1. Chained action: [A] sends/dumps [B] (from Deck) to search [C]
        for (let i = 0; i < orderedCards.length - 2; i++) {
            const cardA = orderedCards[i];
            const cardB = orderedCards[i + 1];
            const cardC = orderedCards[i + 2];

            const sub = maskedClause.substring(cardA.pos, cardC.pos + cardC.id.length);
            const chainPattern = new RegExp(`${cardA.id}[^.]*?\\b(sends|dumps)\\b[^.]*?${cardB.id}[^.]*?\\b(search|searches|adds)\\b[^.]*?${cardC.id}`, 'i');
            if (chainPattern.test(sub)) {
                claims.push({ searcherName: cardA.fullName, targetName: cardB.fullName, verb: 'sends from Deck', sentence: clause });
                const cardBCard = CARDS_CACHE[cardB.fullName.toLowerCase()];
                const cardACard = CARDS_CACHE[cardA.fullName.toLowerCase()];
                const cardCCard = CARDS_CACHE[cardC.fullName.toLowerCase()];
                if (cardBCard && cardCCard && canSearchDirectly(cardBCard, cardCCard).valid) {
                    claims.push({ searcherName: cardB.fullName, targetName: cardC.fullName, verb: 'searches', sentence: clause });
                } else if (cardACard && cardCCard && canSearchDirectly(cardACard, cardCCard).valid) {
                    claims.push({ searcherName: cardA.fullName, targetName: cardC.fullName, verb: 'searches', sentence: clause });
                }
                chainedPairs.add(`${cardA.fullName}->${cardC.fullName}`);
            }
        }

        // 2. Direct action between adjacent cards
        for (let i = 0; i < orderedCards.length - 1; i++) {
            const cardA = orderedCards[i];
            const cardB = orderedCards[i + 1];

            if (cardA.fullName === cardB.fullName) continue;
            if (chainedPairs.has(`${cardA.fullName}->${cardB.fullName}`)) continue;

            const textBeforeA = maskedClause.substring(0, cardA.pos);
            const textBetween = maskedClause.substring(cardA.pos + cardA.id.length, cardB.pos);
            const textAfterB = maskedClause.substring(cardB.pos + cardB.id.length);

            // Filter out non-search relations
            if (/\b(?:made with|summoned using|searchable by|alongside)\b/i.test(textBeforeA)) continue;
            if (/\bwhile\s+a\s*$/i.test(textBeforeA) && /\bcard is out and\b/i.test(textBetween)) continue;

            if (/\b(?:sets itself|summons itself|special summons itself|normal summons itself)\b/i.test(textBetween)) continue;
            if (/\badds (?:a warrior's|\d+|[\w\s]+ original)?\s*(?:def|atk|damage)\b/i.test(textBetween)) continue;
            if (/\bsets? (?:the )?equipped\b/i.test(textBetween)) continue;
            if (/\b(?:enabling|to enable|as cost for|for|into|to fuel|to turn on|to set up|to assemble|to be revived by|so|alongside|provides materials? for|tunes with)\b/i.test(textBetween)) continue;
            if (/\b(?:to\s+(?:link|synchro|xyz|fusion)\s+summon)\b/i.test(textBetween)) continue;
            if (/\b(?:while\s+[^,;.]+\s+searches)\b/i.test(textBetween)) continue;
            if (/,\s*[^,;.]+?\s+(?:searches|adds|dumps|sends|summons|sets|revives|Normal Summons|Special Summons)\b/i.test(textBetween)) continue;
            if (/\b(?:while|whenever you negate|if you control|while controlling|equipped to)\b/i.test(textBetween)) continue;
            if (/\b(?:triggering|triggers|fueled by)\b/i.test(textBetween)) continue;
            if (/\bdiscards\b[^.;:]*?\bfrom (?:your |the )?hand\b/i.test(textBetween)) continue;
            if (/\bsets\b[^.;:]*?\bfrom (?:your |the )?gy\b/i.test(textBetween)) continue;
            if (/\bor\s+(?:searches|adds|dumps|sends)\b/i.test(textBetween)) continue;
            if (/\bto Special Summon itself,?\s*then\s+(?:searches|adds)\b/i.test(textBetween)) continue;
            if (/\b(?:adds|summons?)\s+a\s+banished\b/i.test(textBetween)) continue;
            if (/\bsends?\b[^.;:]*?\bfrom\s+__CARD_\d+__/i.test(textBetween)) continue;
            if (/\bfrom (?:the |your )?deck,\s*adds\b/i.test(textBetween)) continue;
            if (/\bfrom (?:your |the )?hand\s+and\s+sends\b/i.test(textBetween)) continue;
            if (/,\s*or\s*$/i.test(textBetween.trim())) continue;
            if (/\bfrom\s*$/i.test(textBetween.trim())) continue;

            if (/^(?:\s*directly)?\s*from (?:your |the )?gy\b/i.test(textAfterB)) continue;
            if (/^\s+tokens?\b/i.test(textAfterB)) continue;

            const verbMatch = textBetween.match(/\b(searches|adds|fetches|sets|dumps|sends|special summons? from the deck|summons? from the deck|calls from the deck)\b/i);
            if (!verbMatch) continue;

            if (/\b(?:so it summons|triggers)\b/i.test(textBetween)) continue;

            // If cardA was just summoned from deck by a previous card: e.g. "discards 1 card to Special Summon Queen's Knight from the Deck, adds King's Knight"
            if (/\b(?:special summon|summons?)\b[^.;:]*?\bfrom (?:the |your )?deck\b/i.test(textBeforeA) && /,\s*adds\b/i.test(textBetween)) {
                continue;
            }

            claims.push({
                searcherName: cardA.fullName,
                targetName: cardB.fullName,
                verb: verbMatch[1],
                sentence: clause
            });
        }
    }

    return claims;
}

function verifyDecklistSearchers(filename) {
    const filePath = path.join(DECK_DIR, filename);
    const deck = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

    const deckCards = new Set();
    ['main', 'extra'].forEach(z => {
        (deck[z] || []).forEach(row => {
            const name = Array.isArray(row) ? row[0] : row.name;
            deckCards.add(name);
        });
    });
    Object.keys(deck.allow || {}).forEach(name => deckCards.add(name));

    const summaryTexts = [];
    if (Array.isArray(deck.summary)) {
        for (const item of deck.summary) {
            if (typeof item === 'string') summaryTexts.push(item);
            else if (item && typeof item === 'object') {
                if (item.text) summaryTexts.push(item.text);
                if (Array.isArray(item.points)) item.points.forEach(p => summaryTexts.push(p));
                if (Array.isArray(item.steps)) item.steps.forEach(s => summaryTexts.push(s));
            }
        }
    }

    const availableNames = [...deckCards];
    const claims = [];
    for (const text of summaryTexts) {
        claims.push(...extractClaimsFromText(text, availableNames, deck.archetype, deck.match));
    }

    // Role notes
    ['main', 'extra'].forEach(z => {
        (deck[z] || []).forEach(row => {
            const cardName = Array.isArray(row) ? row[0] : row.name;
            const note = Array.isArray(row) ? row[2] : row.note;
            if (note) {
                const noteText = `${cardName} note: "${note}"`;
                claims.push(...extractClaimsFromText(noteText, availableNames, deck.archetype, deck.match));
            }
        });
    });

    const results = {
        file: filename,
        archetype: deck.archetype,
        verified: [],
        errors: [],
        unresolved: []
    };

    for (const claim of claims) {
        const searcherCard = CARDS_CACHE[claim.searcherName.toLowerCase()];
        const targetCard = CARDS_CACHE[claim.targetName.toLowerCase()];

        if (!searcherCard) {
            results.unresolved.push({ ...claim, reason: `Searcher "${claim.searcherName}" not in cards-cache.` });
            continue;
        }
        if (!targetCard) {
            results.unresolved.push({ ...claim, reason: `Target "${claim.targetName}" not in cards-cache.` });
            continue;
        }

        const directCheck = canSearchDirectly(searcherCard, targetCard);
        if (directCheck.valid) {
            results.verified.push({
                searcher: claim.searcherName,
                target: claim.targetName,
                matchedClause: directCheck.matchedClause,
                sentence: claim.sentence
            });
        } else {
            results.errors.push({
                searcher: claim.searcherName,
                target: claim.targetName,
                verb: claim.verb,
                reason: directCheck.reason,
                sentence: claim.sentence
            });
        }
    }

    return results;
}

// Run across all 501 files
console.log('Testing upgraded engine on 501 decklists...');
const allFiles = fs.readdirSync(DECK_DIR).filter(f => f.endsWith('.json'));

let totalVerified = 0;
let totalErrors = 0;
const errorFiles = [];

for (const f of allFiles) {
    const res = verifyDecklistSearchers(f);
    totalVerified += res.verified.length;
    totalErrors += res.errors.length;
    if (res.errors.length > 0) {
        errorFiles.push(res);
    }
}

console.log('\n=======================================================');
console.log(`Verified Claims: ${totalVerified} | Potential Errors: ${totalErrors} | Files Scanned: ${allFiles.length}`);
console.log(`Files with errors: ${errorFiles.length}`);
console.log('=======================================================\n');

fs.writeFileSync('scripts/upgraded-errors.json', JSON.stringify(errorFiles, null, 2));
