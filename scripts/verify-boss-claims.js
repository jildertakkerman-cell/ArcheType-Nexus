const fs = require('fs');
const path = require('path');

const DECK_DIR = path.join(__dirname, '../assets/data/decklists');
const CARDS_CACHE = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/cards-cache.json'), 'utf8'));

const CAPABILITY_RULES = [
    {
        type: 'Omni-negate',
        pattern: /\b(?:omni-negat(?:e|es|ion)|negates? any (?:card or effect|activation)(?!\s+(?:that includes|in the same column|activated in)))\b/i,
        verify: (desc, card) => {
            if (/trap/i.test(card.type) && card.race === 'Counter') {
                return /negate (?:the|that) activation/i.test(desc);
            }
            if (/when (?:another|a|an|your opponent('s)?) (?:card|opponent activates a card),? or (?:its|a|an)?\s*effect,? is activated(?:\s*\([^)]*\))?:?\s*[^.;]*?negate (?:the|that) activation/i.test(desc)) return true;
            if (/when (?:a|an|your opponent('s)?|an opponent's) (?:card or effect is activated|activates a card or effect)/i.test(desc) && /negate (?:the|that) activation/i.test(desc)) return true;
            if (/when your opponent activates a card or effect/i.test(desc) && /negate/i.test(desc)) return true;
            if (/negate (?:the|that) activation/i.test(desc) && /spell/i.test(desc) && /trap/i.test(desc) && /monster/i.test(desc)) return true;
            return false;
        }
    },
    {
        type: 'Monster effect negate',
        pattern: /\b(?:monster (?:effect )?negat(?:e|es|ion)|negates? (?:an? )?monster effects?)\b/i,
        verify: (desc, card) => {
            if (/when (?:a|an|your opponent('s)?|an opponent's) monster (?:effect is activated|activates (?:its|an?) effect)/i.test(desc) && /negate/i.test(desc)) return true;
            if (/when a monster on the field activates its effect/i.test(desc) && /negate/i.test(desc)) return true;
            if (/in response to (?:your|an) opponent's monster effect activation/i.test(desc) && /negate/i.test(desc)) return true;
            if (/negate (?:the|its|that|those|their|that activated|that opponent's activated|that opponent's|that monster's) effects?/i.test(desc)) return true;
            if (/negate any opponent's activated effect/i.test(desc)) return true;
            if (/negate any (?:opponent's monster effects?|monster effects? activated by (?:your|an) opponent)/i.test(desc)) return true;
            if (/effects? (?:are|is) negated/i.test(desc) && /monster/i.test(desc)) return true;
            if (/negate the effects of (?:all )?face-up monsters/i.test(desc)) return true;
            if (/negate (?:the|that) activation/i.test(desc) && /monster/i.test(desc)) return true;
            if (/negate that effect, or any monster effect in the same column/i.test(desc)) return true;
            if (/when a (?:card or effect|spell\/trap card, or monster effect) is activated/i.test(desc) && /negate/i.test(desc)) return true;
            return false;
        }
    },
    {
        type: 'Spell negate',
        pattern: /\b(?:spell negat(?:e|es|ion)|negates? spells?)\b/i,
        verify: (desc, card) => {
            if (/when a spell (?:card )?(?:or effect )?is activated/i.test(desc) && /negate/i.test(desc)) return true;
            if (/when a spell\/trap (?:card )?(?:or effect )?is activated/i.test(desc) && /negate/i.test(desc)) return true;
            if (/when your opponent activates a spell\/trap card or effect/i.test(desc) && /negate/i.test(desc)) return true;
            if (/when a (?:card or effect|spell\/trap card, or monster effect) is activated/i.test(desc) && /negate/i.test(desc)) return true;
            if (/negate (?:the|that) (?:activation|effect|activated effect)/i.test(desc) && /spell/i.test(desc)) return true;
            if (/negate the (?:Summon or )?activation/i.test(desc) && /spell/i.test(desc)) return true;
            if (/negate that effect, or any spell effect in the same column/i.test(desc)) return true;
            if (/negate any opponent's spell effect/i.test(desc)) return true;
            if (/spell card activations? as many times/i.test(desc) && /negate/i.test(desc)) return true;
            return false;
        }
    },
    {
        type: 'Trap negate',
        pattern: /\b(?:trap negat(?:e|es|ion)|negates? traps?)\b/i,
        verify: (desc, card) => {
            if (/when a trap (?:card )?(?:or effect )?is activated/i.test(desc) && /negate/i.test(desc)) return true;
            if (/when a spell\/trap (?:card )?(?:or effect )?is activated/i.test(desc) && /negate/i.test(desc)) return true;
            if (/when your opponent activates a spell\/trap card or effect/i.test(desc) && /negate/i.test(desc)) return true;
            if (/when a (?:card or effect|spell\/trap card, or monster effect) is activated/i.test(desc) && /negate/i.test(desc)) return true;
            if (/negate (?:the|that) (?:activation|effect|activated effect)/i.test(desc) && /trap/i.test(desc)) return true;
            if (/negate the (?:Summon or )?activation/i.test(desc) && /trap/i.test(desc)) return true;
            if (/negate that effect, or any trap effect in the same column/i.test(desc)) return true;
            if (/negate any opponent's trap effect/i.test(desc)) return true;
            return false;
        }
    },
    {
        type: 'Summon negate',
        pattern: /\b(?:summon negat(?:e|es|ion)|negates? (?:a |the )?summons?)\b/i,
        verify: (desc, card) => {
            return /negate (?:the|that) (?:special )?summon/i.test(desc) 
                || /would (?:special )?summon [^.;:]*?negate/i.test(desc)
                || /negate the (?:Summon or )?activation/i.test(desc)
                || (/includes an effect that special summons/i.test(desc) && /negate/i.test(desc));
        }
    },
    {
        type: 'Quick Effect / Fast speed',
        pattern: /\b(?:as a quick effect|quick-effect (?:speed|negate|pop|banish|disruption|removal)|during either (?:player's )?turn|on either turn|at quick-effect speed)\b/i,
        verify: (desc, card) => {
            if (/trap/i.test(card.type) || card.race === 'Quick-Play') return true;
            return /\(quick effect\)/i.test(desc) 
                || /\(?this is a quick effect\b/i.test(desc)
                || /during either player's (?:turn|main phase|battle phase)/i.test(desc) 
                || /during your opponent's (?:turn|main phase|battle phase)/i.test(desc)
                || /when (?:a|an|your opponent's) [^.;:]*?activates (?:its|a)?\s*effect:?\s*you can/i.test(desc)
                || /if your opponent special summons a monster[^.;:]*?:?\s*you can/i.test(desc);
        }
    },
    {
        type: 'Unaffected / Towers',
        pattern: /\b(?:unaffected by (?:other )?(?:card )?effects?|unaffected by opponent's card effects|unaffected by other cards' effects)\b/i,
        verify: (desc) => {
            return /unaffected by/i.test(desc);
        }
    },
    {
        type: 'Battle destruction immunity',
        pattern: /\b(?:cannot be destroyed by battle|immune to battle destruction)\b/i,
        verify: (desc) => {
            return /cannot be destroyed by battle/i.test(desc);
        }
    },
    {
        type: 'Effect destruction immunity',
        pattern: /\b(?:cannot be destroyed by (?:card )?effects?|immune to (?:card )?destruction)\b/i,
        verify: (desc) => {
            return /cannot be destroyed by (?:battle or )?(?:(?:an?|your) opponent's )?(?:card )?effects?/i.test(desc)
                || /cannot be destroyed(?:, or banished,)? by (?:(?:an?|your) opponent's )?(?:card )?effects?/i.test(desc)
                || /monsters (?:you control )?cannot be destroyed [^.;:]*?by [^.;:]*?card effects/i.test(desc);
        }
    },
    {
        type: 'Targeting immunity',
        pattern: /\b(?:cannot be targeted by (?:opponent's )?(?:card )?effects?|targeting immunity|untargetable)\b/i,
        verify: (desc) => {
            return /cannot (?:be targeted|target [^.;:]*?with card effects)/i.test(desc)
                || /neither player can target (?:this card|it)/i.test(desc)
                || /your opponent cannot target (?:this card|it|this tribute summoned card)/i.test(desc)
                || /cannot be targeted [^.;:]*?by (?:an opponent's )?card effects/i.test(desc);
        }
    },
    {
        type: 'Banishment',
        pattern: /\b(?:banishes? (?:an? |all |up to \d+ |face-down )?(?:cards?|monsters?|opposing|opponent's)|non-targeting banish(?:ment)?)\b/i,
        verify: (desc) => {
            return /\bbanish(?:es|ed)?\b/i.test(desc) || /remove [^.;:]*?from play/i.test(desc);
        }
    },
    {
        type: 'Board wipe',
        pattern: /\b(?:board wipe|destroys? (?:all|every) cards?|wipes? the (?:board|field))\b/i,
        verify: (desc) => {
            return /destroy all (?:other )?(?:cards|monsters)/i.test(desc) 
                || /destroy every card/i.test(desc) 
                || /destroy as many [^.;:]*?as possible/i.test(desc)
                || /send all other cards from the field to the gy/i.test(desc)
                || /wipe/i.test(desc);
        }
    }
];

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function verifyDecklistBosses(filename) {
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

    const sortedCardNames = [...deckCards].sort((a, b) => b.length - a.length);

    const cardClaims = [];

    // 1. Role notes
    ['main', 'extra'].forEach(z => {
        (deck[z] || []).forEach(row => {
            const cardName = Array.isArray(row) ? row[0] : row.name;
            const note = Array.isArray(row) ? row[2] : row.note;
            if (note) {
                // If note describes being material for another card's board wipe / effect: e.g. "sent from your Deck by Royal Straight Slasher's board wipe"
                if (/\bsent [^.;:]*?by [A-Z][A-Za-z0-9'\s-]+\b/i.test(note)) return;

                for (const rule of CAPABILITY_RULES) {
                    if (rule.pattern.test(note)) {
                        cardClaims.push({
                            cardName,
                            capability: rule.type,
                            rule,
                            source: 'note',
                            text: note
                        });
                    }
                }
            }
        });
    });

    // 2. Summary Boss / Payoff sections
    const bossSections = (deck.summary || []).filter(item => {
        if (typeof item === 'object' && item && item.title) {
            return /boss|payoff|control|extra deck/i.test(item.title);
        }
        return false;
    });

    for (const section of bossSections) {
        const rawTexts = [];
        if (section.text) rawTexts.push(section.text);
        if (Array.isArray(section.points)) section.points.forEach(p => rawTexts.push(p));

        for (const rawText of rawTexts) {
            // Split sentences on coordinating conjunctions with commas separating different card subjects
            const subSentences = rawText.split(/(?:\. |;\s*|,\s*while |\n|,\s*(?=[A-Z][A-Za-z0-9'\s-:]+\s+(?:is|can|has|negates|destroys|banishes|summons|tributes|wipes|sets|provides|detaches|shuffles|caps|adds|draws|bounces|spins)\b)|, and (?:then )?(?=[A-Z][A-Za-z0-9'\s-:]+\s+(?:is|can|has|negates|destroys|banishes|summons|tributes|wipes|sets|provides|detaches|shuffles|caps|adds|draws|bounces|spins)\b))/g);

            for (const sentence of subSentences) {
                const cleanedSentence = sentence.replace(/\([^)]*?\+[^)]*?\)/g, ' ');

                let earliestMatch = null;
                for (const name of sortedCardNames) {
                    if (name.length < 3) continue;

                    const earlyRegex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
                    const m = cleanedSentence.match(earlyRegex);

                    if (m && m.index < 40) {
                        if (!earliestMatch || m.index < earliestMatch.index) {
                            earliestMatch = { name, index: m.index };
                        }
                    }
                }

                if (earliestMatch) {
                    for (const rule of CAPABILITY_RULES) {
                        if (rule.pattern.test(sentence)) {
                            cardClaims.push({
                                cardName: earliestMatch.name,
                                capability: rule.type,
                                rule,
                                source: 'summary',
                                text: sentence
                            });
                        }
                    }
                }
            }
        }
    }

    const verified = [];
    const errors = [];
    const skipped = [];

    for (const claim of cardClaims) {
        const cardData = CARDS_CACHE[claim.cardName.toLowerCase()];
        if (!cardData) {
            skipped.push({ ...claim, reason: 'Card not in cache' });
            continue;
        }

        // External grant check
        if (/\b(?:grants?|gives?|made with|using [^.;:]*?as material|while [^.;:]*?is active|while [^.;:]*?is face-up|under [A-Z][A-Za-z0-9'\s-:]+|equipped with [A-Z][A-Za-z0-9'\s-:]+|equipping (?:it )?with|overlay into|via [A-Z][A-Za-z0-9'\s-:]+|whenever you negate|alongside [A-Z][A-Za-z0-9'\s-:]+|paired with [A-Z][A-Za-z0-9'\s-:]+|calling [A-Z][A-Za-z0-9'\s-:]+ for|summoning [A-Z][A-Za-z0-9'\s-:]+ for|to (?:Special )?Summon [A-Z][A-Za-z0-9'\s-:]+ [^.;:]*?for)\b/i.test(claim.text)) {
            continue;
        }

        const isValid = claim.rule.verify(cardData.desc || '', cardData);
        if (isValid) {
            verified.push({
                card: claim.cardName,
                capability: claim.capability,
                source: claim.source,
                text: claim.text.slice(0, 80)
            });
        } else {
            errors.push({
                card: claim.cardName,
                capability: claim.capability,
                source: claim.source,
                text: claim.text,
                desc: (cardData.desc || '').slice(0, 150)
            });
        }
    }

    return {
        file: filename,
        archetype: deck.archetype,
        verified,
        errors,
        skipped
    };
}

// Run across all decklists
console.log('Scanning all 501 decklists for boss capability claims...');
const allFiles = fs.readdirSync(DECK_DIR).filter(f => f.endsWith('.json'));

let totalVerified = 0;
let totalErrors = 0;
const errorFiles = [];

for (const f of allFiles) {
    const res = verifyDecklistBosses(f);
    totalVerified += res.verified.length;
    totalErrors += res.errors.length;
    if (res.errors.length > 0) {
        errorFiles.push(res);
    }
}

console.log('\n=======================================================');
console.log(`Boss Claims Verified: ${totalVerified} | Potential Errors: ${totalErrors} | Files Scanned: ${allFiles.length}`);
console.log(`Files with potential errors: ${errorFiles.length}`);
console.log('=======================================================\n');

fs.writeFileSync('scripts/boss-claims-report.json', JSON.stringify({ verified: totalVerified, errors: totalErrors, errorFiles }, null, 2));
