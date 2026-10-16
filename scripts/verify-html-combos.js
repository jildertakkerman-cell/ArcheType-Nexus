const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../pages');
const CARDS_CACHE = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/cards-cache.json'), 'utf8'));

console.log('Verifying all HTML combo guides across pages/ directory...\n');

const htmlFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Map card names
const allCardNames = Object.keys(CARDS_CACHE).map(k => CARDS_CACHE[k].name).sort((a, b) => b.length - a.length);
const cardNameMap = new Map();
allCardNames.forEach(n => cardNameMap.set(n.toLowerCase(), CARDS_CACHE[n.toLowerCase()]));

// Check if a searcher can legally search a target card
function verifySearcher(searcherCard, targetCard) {
    const sDesc = (searcherCard.desc || '').toLowerCase();
    const tName = targetCard.name.toLowerCase();
    const tArch = (targetCard.archetype || '').toLowerCase();
    const tType = targetCard.type.toLowerCase();
    const tDesc = (targetCard.desc || '').toLowerCase();

    // 1. Direct name match
    if (sDesc.includes(`"${tName}"`)) return true;

    // 2. Archetype match across all occurrences in searcher text
    if (tArch) {
        const archPattern = new RegExp(`"${escapeRegex(tArch)}"\\s+(?:card|monster|spell\\/trap|spell|trap|field spell)`, 'gi');
        const matches = [...sDesc.matchAll(archPattern)];
        for (const m of matches) {
            const clause = m[0].toLowerCase();
            if (clause.includes('card')) return true;
            if (clause.includes('monster') && tType.includes('monster')) return true;
            if (clause.includes('spell/trap') && (tType.includes('spell') || tType.includes('trap'))) return true;
            if (clause.includes('spell') && !clause.includes('trap') && tType.includes('spell')) return true;
            if (clause.includes('trap') && !clause.includes('spell') && tType.includes('trap')) return true;
        }
    }

    // Secondary archetype match inside quotes (e.g. "Sea Stealth", "Runick", "Gladiator Beast", "Onomat")
    const quotedArchetypes = [...sDesc.matchAll(/"([^"]+)"\s+(?:card|monster|spell\/trap|spell|trap|field spell)/gi)];
    for (const q of quotedArchetypes) {
        const arch = q[1].toLowerCase();
        if (tName.includes(arch) || tArch.includes(arch)) {
            const clause = q[0].toLowerCase();
            if (clause.includes('card')) return true;
            if (clause.includes('monster') && tType.includes('monster')) return true;
            if (clause.includes('spell/trap') && (tType.includes('spell') || tType.includes('trap'))) return true;
            if (clause.includes('spell') && !clause.includes('trap') && tType.includes('spell')) return true;
            if (clause.includes('trap') && !clause.includes('spell') && tType.includes('trap')) return true;
        }
    }

    // Multi-archetype lists inside quotes (e.g. "Gagaga", "Onomat", or "Xyz" card)
    const listPattern = /"[^"]+"(?:\s*,\s*"[^"]+")*(?:\s*,?\s*or\s*"[^"]+")?\s+(?:card|monster|spell\/trap|spell|trap|field spell)s?/gi;
    const listMatches = [...sDesc.matchAll(listPattern)];
    for (const lm of listMatches) {
        const fullClause = lm[0].toLowerCase();
        const cardKind = fullClause.includes('card') ? 'card'
            : fullClause.includes('monster') ? 'monster'
            : fullClause.includes('spell/trap') ? 'spell/trap'
            : fullClause.includes('spell') ? 'spell' : 'trap';
        const quotedNames = [...lm[0].matchAll(/"([^"]+)"/g)].map(m => m[1].toLowerCase());
        for (const arch of quotedNames) {
            if (tName.includes(arch) || tArch.includes(arch)) {
                if (cardKind === 'card') return true;
                if (cardKind === 'monster' && tType.includes('monster')) return true;
                if (cardKind === 'spell/trap' && (tType.includes('spell') || tType.includes('trap'))) return true;
                if (cardKind === 'spell' && tType.includes('spell')) return true;
                if (cardKind === 'trap' && tType.includes('trap')) return true;
            }
        }
    }

    // 3. Mentions / specifically lists X in its text
    const mentionsPattern = /(?:specifically lists|mentions?)(?:\s+an?)?\s+"([^"]+)"/gi;
    const mentionsMatches = [...sDesc.matchAll(mentionsPattern)];
    for (const mm of mentionsMatches) {
        const requiredMention = mm[1].toLowerCase();
        if (tDesc.includes(`"${requiredMention}"`) || tDesc.includes(requiredMention) || tName.includes(requiredMention)) {
            return true;
        }
    }

    // Mentions it (e.g. Crimson Gaia, Moissa Wight)
    const mentionItPattern = /"([^"]+)"\s+or\s+(?:1\s+|a\s+)?(?:card|monster|spell|trap)\s+that\s+mentions\s+it/gi;
    const mentionItMatches = [...sDesc.matchAll(mentionItPattern)];
    for (const mim of mentionItMatches) {
        const req = mim[1].toLowerCase();
        if (tDesc.includes(`"${req}"`) || tDesc.includes(req) || tName.includes(req)) {
            return true;
        }
    }

    // Specifically lists any of those cards (e.g. Dark Beckoning Beast)
    if (sDesc.includes('specifically lists any of those cards') || sDesc.includes('mentions any of those cards')) {
        const quoted = [...sDesc.matchAll(/"([^"]+)"/g)].map(m => m[1].toLowerCase());
        for (const q of quoted) {
            if (tDesc.includes(`"${q}"`) || tDesc.includes(q)) return true;
        }
    }

    // 4. Generic named cards: e.g. "Polymerization", "Fusion", "Ritual"
    if (tName === 'polymerization' && (sDesc.includes('"polymerization"') || sDesc.includes('"fusion"'))) return true;
    if (tType.includes('ritual') && /ritual (?:monster|spell|card)/i.test(sDesc)) return true;
    if (tType.includes('field') && /field spell/i.test(sDesc)) return true;
    if (tType.includes('equip') && /equip (?:spell|card)/i.test(sDesc)) return true;
    if (tType.includes('normal') && /normal (?:monster|spell|trap)/i.test(sDesc)) return true;

    // 5. Level / Attribute / Type / Race queries (including Dinosaur)
    if (/(?:add|take)\s+1\s+(?:level \d+|rock|fiend|dragon|spellcaster|warrior|machine|zombie|fairy|insect|dinosaur|beast|reptile|aqua|fish|sea serpent|pyro|thunder|plant|winged beast|cyberse|psychic|wyrm)/i.test(sDesc)) {
        return true;
    }

    // 6. General deck addition / take effect
    if (/(?:add|take)\s+(?:1|a|it|them|1 card)\s+(?:from (?:your )?deck|from your deck or gy)/i.test(sDesc)) {
        return true;
    }

    // 7. Counter placing card searcher (e.g. Battle Shogun of the Six Samurai)
    if (/places? a? bushido counter/i.test(sDesc) && /places? a? bushido counter/i.test(tDesc)) {
        return true;
    }

    return false;
}

// Parse combo steps from an HTML file
function parseHtmlCombos(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);

    const parts = content.split(/class="[^"]*combo-step-card[^"]*"/i);
    if (parts.length <= 1) return null;

    const titleMatch = content.match(/<h2[^>]*class="[^"]*(?:text-center|font-bold)[^"]*"[^>]*>\s*(?:Core Combo:[^<]*|Key Combo[^<]*|The One-Card Combo:[^<]*|.*?Combo[^<]*)\s*<\/h2>/i);
    const comboTitle = titleMatch ? titleMatch[0].replace(/<[^>]+>/g, '').trim() : 'Core Combo';

    const steps = [];

    for (let i = 1; i < parts.length; i++) {
        const chunk = parts[i].slice(0, 2500);

        const numMatch = chunk.match(/<span[^>]*>\s*(\d+)\s*<\/span>/i) || chunk.match(/(\d+)\.\s+/);
        const stepNum = numMatch ? parseInt(numMatch[1], 10) : i;

        const titleMatch = chunk.match(/<h[34][^>]*>(.*?)<\/h[34]>/i);
        const stepTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        const pMatch = chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        const stepDesc = pMatch ? pMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

        const imgDivMatch = chunk.match(/card-placeholder"[^>]*>(.*?)<\/div>/i);
        const featuredCard = imgDivMatch ? imgDivMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        if (stepDesc) {
            steps.push({ stepNum, stepTitle, featuredCard, text: stepDesc });
        }
    }

    return { filename, comboTitle, steps };
}

let verifiedSearchers = 0;
let searcherErrors = 0;
const searcherErrorDetails = [];

let verifiedEffects = 0;
let effectErrors = 0;
const effectErrorDetails = [];

let totalCombos = 0;
let totalSteps = 0;

for (const file of htmlFiles) {
    const parsed = parseHtmlCombos(path.join(PAGES_DIR, file));
    if (!parsed || parsed.steps.length === 0) continue;

    totalCombos++;
    totalSteps += parsed.steps.length;

    for (const step of parsed.steps) {
        // Split step text into sub-sentences / clauses to prevent cross-clause searcher conflation
        const clauses = step.text.split(/(?:\. |\n|;\s*|,\s*(?:then|activate|use|and\s+use)\b)/i);

        for (const clause of clauses) {
            // Ignore "Contact Fuse"
            const cleanedClause = clause.replace(/\bContact\s+Fus(?:e|ion)\b/gi, 'Fusion');

            // 1. Searcher Verification
            const searchMatches = [
                cleanedClause.match(/(?:(?:activate|use)\s+)?([A-Z][A-Za-z0-9'\s-:]+?)(?:'s effect)?\s+(?:activates?,?\s+)?(?:adding|adds|add)\s+([A-Z][A-Za-z0-9'\s-:]+?)\s+(?:from (?:your |the )?deck)/i),
                cleanedClause.match(/(?:activate|use)\s+([A-Z][A-Za-z0-9'\s-:]+?)(?:'s effect)?\s+to\s+search(?:\s+for)?\s+([A-Z][A-Za-z0-9'\s-:]+)/i),
                cleanedClause.match(/search(?:es)?(?:\s+for)?\s+([A-Z][A-Za-z0-9'\s-:]+)/i)
            ];

            let sTargetCard = null;
            let sSearcherCard = null;

            if (searchMatches[0]) {
                const sName = searchMatches[0][1].replace(/^(?:activate|use|banish)\s+/i, '').trim();
                const tName = searchMatches[0][2].replace(/^(?:a |an |the )/i, '').trim();
                sSearcherCard = cardNameMap.get(sName.toLowerCase());
                sTargetCard = cardNameMap.get(tName.toLowerCase());
            } else if (searchMatches[1]) {
                const sName = searchMatches[1][1].replace(/^(?:activate|use|banish)\s+/i, '').trim();
                const tName = searchMatches[1][2].replace(/^(?:a |an |the )/i, '').trim();
                sSearcherCard = cardNameMap.get(sName.toLowerCase());
                sTargetCard = cardNameMap.get(tName.toLowerCase());
            } else if (searchMatches[2]) {
                const tName = searchMatches[2][1].replace(/^(?:a |an |the )/i, '').trim();
                sTargetCard = cardNameMap.get(tName.toLowerCase());

                // Find candidate searchers mentioned in this clause before the search verb
                const beforeSearch = cleanedClause.slice(0, searchMatches[2].index);
                const candidates = [];

                for (const name of allCardNames) {
                    if (name.length < 3) continue;
                    const r = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
                    if (r.test(beforeSearch)) {
                        candidates.push(cardNameMap.get(name.toLowerCase()));
                    }
                }

                // Check candidate searchers for who can legally search sTargetCard
                if (sTargetCard) {
                    const validCandidate = candidates.find(c => verifySearcher(c, sTargetCard));
                    if (validCandidate) {
                        sSearcherCard = validCandidate;
                    } else if (candidates.length > 0) {
                        sSearcherCard = candidates[candidates.length - 1]; // closest candidate before search
                    } else {
                        // Look back across the whole step text for a valid searcher of sTargetCard
                        const stepCandidates = [];
                        for (const name of allCardNames) {
                            if (name.length < 3) continue;
                            const r = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
                            if (r.test(step.text)) {
                                stepCandidates.push(cardNameMap.get(name.toLowerCase()));
                            }
                        }
                        const validStepCandidate = stepCandidates.find(c => verifySearcher(c, sTargetCard));
                        if (validStepCandidate) {
                            sSearcherCard = validStepCandidate;
                        }
                    }
                }
            }

            if (!sSearcherCard && sTargetCard) {
                // If sSearcherCard is not set yet, check if step text contains a valid searcher
                const stepCandidates = [];
                for (const name of allCardNames) {
                    if (name.length < 3) continue;
                    const r = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
                    if (r.test(step.text)) {
                        stepCandidates.push(cardNameMap.get(name.toLowerCase()));
                    }
                }
                const validCandidate = stepCandidates.find(c => verifySearcher(c, sTargetCard));
                if (validCandidate) {
                    sSearcherCard = validCandidate;
                } else if (step.featuredCard && cardNameMap.has(step.featuredCard.toLowerCase())) {
                    sSearcherCard = cardNameMap.get(step.featuredCard.toLowerCase());
                }
            }

            if (sSearcherCard && sTargetCard && sSearcherCard.name !== sTargetCard.name) {
                if (verifySearcher(sSearcherCard, sTargetCard)) {
                    verifiedSearchers++;
                } else {
                    searcherErrors++;
                    searcherErrorDetails.push({
                        file: parsed.filename,
                        step: step.stepNum,
                        searcher: sSearcherCard.name,
                        target: sTargetCard.name,
                        clause: clause.trim(),
                        text: step.text
                    });
                }
            }

            // 2. On-Summon Deck Summon Claim Verification
            const onSummonMatch = clause.match(/(?:her|his|its)?\s*effect\s+then\s+summons?\s+([A-Z][A-Za-z0-9'\s-:]+?)\s+from the deck/i);
            if (onSummonMatch) {
                const summonedName = onSummonMatch[1].replace(/^(?:a |an |the )/i, '').trim();
                const summonedCard = cardNameMap.get(summonedName.toLowerCase());
                let sourceCard = sSearcherCard || (step.featuredCard ? cardNameMap.get(step.featuredCard.toLowerCase()) : null);

                if (sourceCard && summonedCard) {
                    const desc = (sourceCard.desc || '').toLowerCase();
                    const canSummonFromDeck = /special summon 1 [^.;]*?from (?:your |the )?deck/i.test(desc);
                    const isOnSummon = /if this card is (?:fusion |synchro |xyz |link |special |normal )?summoned/i.test(desc);

                    if (canSummonFromDeck && isOnSummon) {
                        verifiedEffects++;
                    } else {
                        effectErrors++;
                        effectErrorDetails.push({
                            file: parsed.filename,
                            step: step.stepNum,
                            source: sourceCard.name,
                            target: summonedCard.name,
                            reason: `${sourceCard.name} does not Special Summon from the Deck upon summon`,
                            text: step.text
                        });
                    }
                }
            }
        }
    }
}

console.log('=======================================================');
console.log(`HTML Combos Verified: ${totalCombos} | Total Steps: ${totalSteps}`);
console.log(`Searcher Claims Verified: ${verifiedSearchers} | Errors: ${searcherErrors}`);
console.log(`Effect / Trigger Claims Verified: ${verifiedEffects} | Errors: ${effectErrors}`);
console.log('=======================================================\n');

if (searcherErrors > 0 || effectErrors > 0) {
    if (searcherErrors > 0) {
        console.log('Searcher Errors Detected:');
        searcherErrorDetails.forEach((e, idx) => {
            console.log(`${idx + 1}. [${e.file}] Step ${e.step}: '${e.searcher}' searching '${e.target}'`);
            console.log(`   Clause: "${e.clause}"`);
        });
    }
    if (effectErrors > 0) {
        console.log('\nEffect / Trigger Errors Detected:');
        effectErrorDetails.forEach((e, idx) => {
            console.log(`${idx + 1}. [${e.file}] Step ${e.step}: '${e.source}' summoning '${e.target}' from Deck`);
            console.log(`   Reason: ${e.reason}`);
            console.log(`   Text: "${e.text}"`);
        });
    }
    process.exit(1);
} else {
    console.log('All HTML combo guides verified successfully! (0 errors)');
    process.exit(0);
}
