const fs = require('fs');
const path = require('path');

const DECK_DIR = path.join(__dirname, '../assets/data/decklists');
const CARDS_CACHE = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/cards-cache.json'), 'utf8'));

// Recognized types, attributes, and mechanics
const MECHANICS = ['Fusion', 'Synchro', 'Xyz', 'Link', 'Pendulum', 'Ritual'];
const ATTRIBUTES = ['DARK', 'LIGHT', 'WATER', 'FIRE', 'EARTH', 'WIND', 'DIVINE'];
const RACES = [
    'Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Dragon', 'Fairy',
    'Fiend', 'Fish', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 'Reptile',
    'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior', 'Winged Beast',
    'Wyrm', 'Zombie', 'Illusion'
];

// Helper to escape regex
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse lock from card desc
function extractLock(desc) {
    if (!desc) return null;

    // Pattern 1: cannot Special Summon [other] monsters [from the Extra Deck] [for the rest of this turn / the turn you activate this card], except X monsters
    const lockMatch = desc.match(/(?:cannot|you cannot) Special Summon (?:other )?monsters (?:from the Extra Deck )?(?:for the rest of this turn|the turn you activate this (?:card|effect))?,? except ([^.;]+?)(?:,\s*also|\.|\;|\band you cannot|\bfor the rest of this Duel|$)/i);
    if (!lockMatch) return null;

    const rawExcept = lockMatch[1].trim();
    const isTurnLong = /the turn you activate this/i.test(desc);
    const isExtraDeckOnly = /from the Extra Deck/i.test(lockMatch[0]) || /from your Extra Deck/i.test(desc);

    // Identify allowed types/attributes/mechanics/archetypes
    const allowedMechanics = MECHANICS.filter(m => new RegExp(`\\b${m}\\b`, 'i').test(rawExcept));
    const allowedAttributes = ATTRIBUTES.filter(a => new RegExp(`\\b${a}\\b`, 'i').test(rawExcept));
    const allowedRaces = RACES.filter(r => new RegExp(`\\b${r}\\b`, 'i').test(rawExcept));

    // Check for archetype in quotes: e.g. '"Abyss Actor"'
    const archMatch = rawExcept.match(/"([^"]+)"/);
    const allowedArchetype = archMatch ? archMatch[1] : null;

    // Check for "monsters that mention it"
    const mentionsCard = /monsters that mention it/i.test(rawExcept) && archMatch ? archMatch[1] : null;

    if (allowedMechanics.length === 0 && allowedAttributes.length === 0 && allowedRaces.length === 0 && !allowedArchetype && !mentionsCard) {
        return null;
    }

    return {
        rawExcept,
        isTurnLong,
        isExtraDeckOnly,
        allowedMechanics,
        allowedAttributes,
        allowedRaces,
        allowedArchetype,
        mentionsCard
    };
}

// Pre-index locking cards in the cache
const LOCKING_CARDS = new Map();
for (const [key, card] of Object.entries(CARDS_CACHE)) {
    const lock = extractLock(card.desc);
    if (lock) {
        LOCKING_CARDS.set(key, { ...card, lock });
    }
}

console.log(`Pre-indexed ${LOCKING_CARDS.size} locking cards from cache.`);

function verifyDeckCombo(filename) {
    const filePath = path.join(DECK_DIR, filename);
    const deck = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

    // Map card names in this decklist to card cache data
    const deckCards = new Map();
    ['main', 'extra'].forEach(z => {
        (deck[z] || []).forEach(row => {
            const name = Array.isArray(row) ? row[0] : row.name;
            const data = CARDS_CACHE[name.toLowerCase()];
            if (data) deckCards.set(name, data);
        });
    });
    Object.keys(deck.allow || {}).forEach(name => {
        const data = CARDS_CACHE[name.toLowerCase()];
        if (data) deckCards.set(name, data);
    });

    const sortedNames = [...deckCards.keys()].sort((a, b) => b.length - a.length);

    const openings = (deck.summary || []).filter(s => s && s.steps && Array.isArray(s.steps));
    if (openings.length === 0) return { file: filename, verified: 0, violations: [] };

    let verifiedCount = 0;
    const violations = [];

    for (const opening of openings) {
        const steps = opening.steps;
        const activeLocks = []; // array of { stepIndex, cardName, lock }

        // Phase 1: Detect locks activated at each step
        steps.forEach((stepText, idx) => {
            for (const name of sortedNames) {
                const card = deckCards.get(name);
                if (!card) continue;

                const lockInfo = LOCKING_CARDS.get(name.toLowerCase());
                if (!lockInfo) continue;

                // If card was merely added/searched/milled/discarded/revealed, its lock effect wasn't activated
                if (new RegExp(`\\b(?:add|adds|search|searches|milling|mills|discard|discards|reveal|reveals|send|sends)\\s+[^.;:]*?\\b${escapeRegex(name)}\\b`, 'i').test(stepText) && !new RegExp(`\\b(?:activate|activates|special summon|special summons|normal summon|normal summons)\\s+[^.;:]*?\\b${escapeRegex(name)}\\b`, 'i').test(stepText)) {
                    continue;
                }

                // If GY search effect of Crystrons or similar was used: e.g. "Banish Thystvern from the GY to search"
                if (new RegExp(`\\bbanish\\s+${escapeRegex(name)}\\b[^.;:]*?to (?:search|add)`, 'i').test(stepText)) {
                    continue;
                }

                // If card is used as Link/Synchro material and its lock was an on-field ignition effect
                if (new RegExp(`\\b(?:link it off|send [^.;:]*?as material|using [^.;:]*?${escapeRegex(name)}[^.;:]*?as material)\\b`, 'i').test(stepText) && !new RegExp(`\\b${escapeRegex(name)}\\b\\s+triggers?\\b`, 'i').test(stepText)) {
                    continue;
                }

                const nameRegex = new RegExp(`\\b(?:activate|summon|normal summon|special summon|link summon|synchro summon|xyz summon|fusion summon)\\s+(?:the (?:Pendulum )?effects? of )?\\b${escapeRegex(name)}\\b|\\b${escapeRegex(name)}\\b\\s+(?:activates|special summons|revives|triggers|sends)`, 'i');
                if (nameRegex.test(stepText)) {
                    // Check if the locking effect was actually used (some cards have locks on specific effects)
                    activeLocks.push({
                        stepIndex: idx,
                        cardName: name,
                        lock: lockInfo.lock,
                        charIndex: stepText.toLowerCase().indexOf(name.toLowerCase())
                    });
                }
            }
        });

        if (activeLocks.length === 0) continue;

        // Phase 2: Check summons in each step against active locks
        steps.forEach((stepText, stepIdx) => {
            // Find monsters summoned in this step
            const summonedMonsters = [];
            for (const name of sortedNames) {
                const card = deckCards.get(name);
                if (!card || /spell|trap/i.test(card.type)) continue;

                const summonRegex = new RegExp(`\\b(?:special summon|summon|link summon|synchro summon|xyz summon|fusion summon|revive|cheat out|ladder into|bring out)\\s+[^.;:]*?\\b${escapeRegex(name)}\\b|into\\s+${escapeRegex(name)}\\b|\\boverlay [^.;:]*?into\\s+${escapeRegex(name)}\\b`, 'i');
                if (summonRegex.test(stepText)) {
                    summonedMonsters.push({ name, card });
                }
            }

            for (const { name, card } of summonedMonsters) {
                const isExtraDeck = /fusion|synchro|xyz|link/i.test(card.type);

                for (const lockEntry of activeLocks) {
                    const { stepIndex: lockIdx, cardName: lockCardName, lock } = lockEntry;

                    // If rest-of-turn lock, only applies to steps >= lockIdx
                    if (!lock.isTurnLong && stepIdx < lockIdx) continue;

                    // If intra-step, check if the summoned monster appeared before the locking card was activated/summoned
                    if (!lock.isTurnLong && stepIdx === lockIdx) {
                        const summonCharIdx = stepText.toLowerCase().indexOf(name.toLowerCase());
                        if (summonCharIdx !== -1 && summonCharIdx < lockEntry.charIndex) {
                            continue;
                        }
                    }

                    // If Extra Deck only lock, only applies to Extra Deck monsters
                    if (lock.isExtraDeckOnly && !isExtraDeck) continue;

                    // If the summoned monster is the locking card itself being summoned, skip
                    if (name.toLowerCase() === lockCardName.toLowerCase()) continue;

                    // Validate against lock
                    let complies = true;

                    // Check mechanics
                    if (lock.allowedMechanics.length > 0) {
                        const matchesMech = lock.allowedMechanics.some(m => new RegExp(`\\b${m}\\b`, 'i').test(card.type));
                        if (!matchesMech) complies = false;
                    }

                    // Check attributes
                    if (complies && lock.allowedAttributes.length > 0) {
                        const matchesAttr = lock.allowedAttributes.some(a => (card.attribute || '').toUpperCase() === a.toUpperCase());
                        if (!matchesAttr) complies = false;
                    }

                    // Check races
                    if (complies && lock.allowedRaces.length > 0) {
                        const matchesRace = lock.allowedRaces.some(r => (card.race || '').toLowerCase() === r.toLowerCase());
                        if (!matchesRace) complies = false;
                    }

                    // Check archetype
                    if (complies && lock.allowedArchetype) {
                        const matchesArch = (card.archetype || '').toLowerCase() === lock.allowedArchetype.toLowerCase() 
                            || card.name.toLowerCase().includes(lock.allowedArchetype.toLowerCase());
                        if (!matchesArch) complies = false;
                    }

                    // Check mentionsCard
                    if (!complies && lock.mentionsCard) {
                        if ((card.desc || '').toLowerCase().includes(lock.mentionsCard.toLowerCase())) {
                            complies = true;
                        }
                    }

                    if (!complies) {
                        violations.push({
                            file: filename,
                            stepIndex: stepIdx,
                            stepText: stepText.slice(0, 100),
                            lockingCard: lockCardName,
                            lockStep: lockIdx,
                            lockDetails: lock.rawExcept,
                            summonedMonster: name,
                            summonedType: card.type,
                            summonedRace: card.race,
                            summonedAttr: card.attribute
                        });
                    } else {
                        verifiedCount++;
                    }
                }
            }
        });
    }

    return { file: filename, verified: verifiedCount, violations };
}

// Run across all decklists
console.log('Verifying combo opening summon legality & locks across all 501 decklists...');
const allFiles = fs.readdirSync(DECK_DIR).filter(f => f.endsWith('.json'));

let totalVerified = 0;
let totalViolations = 0;
const violationFiles = [];

for (const f of allFiles) {
    const res = verifyDeckCombo(f);
    totalVerified += res.verified;
    totalViolations += res.violations.length;
    if (res.violations.length > 0) {
        violationFiles.push(res);
    }
}

console.log('\n=======================================================');
console.log(`Summons Verified: ${totalVerified} | Potential Lock Violations: ${totalViolations} | Files Scanned: ${allFiles.length}`);
console.log(`Files with potential violations: ${violationFiles.length}`);
console.log('=======================================================\n');

fs.writeFileSync('scripts/combo-locks-report.json', JSON.stringify({ verified: totalVerified, violations: totalViolations, violationFiles }, null, 2));
