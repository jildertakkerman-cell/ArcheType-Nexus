const fs = require('fs');
const path = require('path');

const DECK_DIR = path.join(__dirname, '../assets/data/decklists');
const CARDS_CACHE = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/cards-cache.json'), 'utf8'));
const RESERVED = new Set(['index.json', 'packages.json', 'packages.generated.json', 'profiles.json', 'report.json']);

console.log('Verifying Extra Deck summon materials & level math across all decklists...\n');

const files = fs.readdirSync(DECK_DIR).filter(f => f.endsWith('.json') && !RESERVED.has(f));

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanMaterialsPart(rawPart) {
    if (!rawPart) return '';
    const splitRegex = /,\s*(?:and\s+)?(?:activate|trigger|use|set|climb|revive|special|summon|send|target|add|banish|draw|equip)\b|,\s*then\b|\bthen\b|;\s*|\.\s*$/i;
    const idx = rawPart.search(splitRegex);
    if (idx !== -1) {
        return rawPart.slice(0, idx).trim();
    }
    return rawPart.trim();
}

function extractMaterialsAndLevels(matsPart, sortedNames, deckCards, targetName) {
    const foundMaterials = [];
    let workingText = matsPart;

    for (const name of sortedNames) {
        if (name.toLowerCase() === targetName.toLowerCase()) continue;
        const esc = escapeRegex(name);
        const matchRegex = new RegExp(`(?:(?:Level|Lv)\\s*(\\d+)\\s+(?:Tuner\\s+)?)?\\b${esc}\\b(?:\\s*\\([^)]*?(?:Level|Lv|reduced to Level|modulated to Level)\\s*(\\d+)[^)]*\\))?`, 'i');
        const m = workingText.match(matchRegex);
        if (m) {
            const cData = deckCards.get(name);
            let effectiveLevel = cData ? cData.level : 0;
            if (m[1]) effectiveLevel = parseInt(m[1], 10);
            else if (m[2]) effectiveLevel = parseInt(m[2], 10);

            foundMaterials.push({ ...cData, effectiveLevel });

            // Mask out the matched portion so shorter names don't match it
            workingText = workingText.replace(new RegExp(`\\b${esc}\\b`, 'i'), '___MASKED___');
        }
    }

    return foundMaterials;
}

let verifiedSummons = 0;
let potentialErrors = 0;
const errorDetails = [];

for (const filename of files) {
    const filePath = path.join(DECK_DIR, filename);
    const deck = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

    // Map deck cards
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
    if (openings.length === 0) continue;

    for (const opening of openings) {
        for (let stepIdx = 0; stepIdx < opening.steps.length; stepIdx++) {
            const step = opening.steps[stepIdx];

            // 1. Check Synchro Summons
            // Patterns: 
            // "Synchro Summon [Name] using [Materials]"
            // "Synchro Summon [Name] ([Mat1] + [Mat2])"
            const synchroMatch = step.match(/Synchro Summon (?:Level \d+ )?(?:Synchro )?(?:Tuner )?([A-Z][A-Za-z0-9'\s-:]+?)(?:\s*\([^)]*\))?\s+using\s+([^.;]+)/i);
            const synchroParenMatch = step.match(/Synchro Summon ([A-Z][A-Za-z0-9'\s-:]+?)\s*\(([^)]+\+[^)]+)\)/i);

            let sTargetName = null;
            let sMatsPart = null;

            if (synchroMatch) {
                sTargetName = synchroMatch[1].trim();
                sMatsPart = cleanMaterialsPart(synchroMatch[2]);
            } else if (synchroParenMatch) {
                sTargetName = synchroParenMatch[1].trim();
                sMatsPart = synchroParenMatch[2].trim();
            }

            if (sTargetName && sMatsPart) {
                const targetCard = deckCards.get(sTargetName) || CARDS_CACHE[sTargetName.toLowerCase()];
                if (targetCard && /synchro/i.test(targetCard.type)) {
                    const foundMaterials = extractMaterialsAndLevels(sMatsPart, sortedNames, deckCards, sTargetName);

                    if (foundMaterials.length >= 2) {
                        const totalLevel = foundMaterials.reduce((sum, m) => sum + (m.effectiveLevel || 0), 0);
                        const hasTuner = foundMaterials.some(m => /tuner/i.test(m.type))
                            || /tuner/i.test(sMatsPart)
                            || foundMaterials.some(m => (m.desc || '').toLowerCase().includes('treat it as a tuner') || (m.desc || '').toLowerCase().includes('treated as a tuner'));

                        if (targetCard.level && totalLevel > 0 && totalLevel !== targetCard.level) {
                            potentialErrors++;
                            errorDetails.push({
                                file: filename,
                                type: 'Synchro Level Mismatch',
                                step: step.slice(0, 100),
                                target: targetCard.name,
                                targetLevel: targetCard.level,
                                materials: foundMaterials.map(m => `${m.name} (Lv ${m.effectiveLevel})`),
                                totalLevel
                            });
                        } else if (!hasTuner) {
                            potentialErrors++;
                            errorDetails.push({
                                file: filename,
                                type: 'Synchro Missing Tuner',
                                step: step.slice(0, 100),
                                target: targetCard.name,
                                materials: foundMaterials.map(m => `${m.name} (${m.type})`)
                            });
                        } else {
                            verifiedSummons++;
                        }
                    }
                }
            }

            // 2. Check Xyz Summons
            // Pattern: Overlay [Mat1] and [Mat2] into [Xyz] OR Xyz Summon [Xyz] using [Mat1] and [Mat2]
            const xyzOverlayMatch = step.match(/(?:overlay|use)\s+([^.;:]+?)\s+into\s+([A-Z][A-Za-z0-9'\s-:]+)/i);
            const xyzSummonMatch = step.match(/Xyz Summon (?:Rank \d+ )?([A-Z][A-Za-z0-9'\s-:]+?)(?:\s*\([^)]*\))?\s+using\s+([^.;]+)/i);

            let xyzTargetName = null;
            let xyzMatsPart = null;

            if (xyzOverlayMatch) {
                xyzTargetName = xyzOverlayMatch[2].trim();
                xyzMatsPart = cleanMaterialsPart(xyzOverlayMatch[1]);
            } else if (xyzSummonMatch) {
                xyzTargetName = xyzSummonMatch[1].trim();
                xyzMatsPart = cleanMaterialsPart(xyzSummonMatch[2]);
            }

            if (xyzTargetName && xyzMatsPart) {
                const targetCard = deckCards.get(xyzTargetName) || CARDS_CACHE[xyzTargetName.toLowerCase()];
                if (targetCard && /xyz/i.test(targetCard.type)) {
                    const foundMaterials = extractMaterialsAndLevels(xyzMatsPart, sortedNames, deckCards, xyzTargetName);

                    if (foundMaterials.length >= 2) {
                        const isAltXyz = /can also be xyz summoned|rank-up|utopic future|treated as an xyz summon/i.test(targetCard.desc || '') 
                            || /rank-up|hyper rank-up/i.test(step);

                        if (!isAltXyz && targetCard.level) {
                            const wrongLevelMats = foundMaterials.filter(m => m.effectiveLevel && m.effectiveLevel !== targetCard.level);
                            if (wrongLevelMats.length > 0) {
                                potentialErrors++;
                                errorDetails.push({
                                    file: filename,
                                    type: 'Xyz Rank Mismatch',
                                    step: step.slice(0, 100),
                                    target: targetCard.name,
                                    targetRank: targetCard.level,
                                    materials: foundMaterials.map(m => `${m.name} (Lv ${m.effectiveLevel})`)
                                });
                            } else {
                                verifiedSummons++;
                            }
                        } else {
                            verifiedSummons++;
                        }
                    }
                }
            }

            // 3. Check Link Summons
            // Pattern: Link Summon [Link] using [Mat1] and [Mat2]
            const linkMatch = step.match(/Link Summon ([A-Z][A-Za-z0-9'\s-:]+?)(?:\s*\([^)]*\))?\s+using\s+([^.;]+)/i);
            if (linkMatch) {
                const targetName = linkMatch[1].trim();
                const materialsPart = cleanMaterialsPart(linkMatch[2]);

                const targetCard = deckCards.get(targetName) || CARDS_CACHE[targetName.toLowerCase()];
                if (targetCard && /link/i.test(targetCard.type)) {
                    const foundMaterials = extractMaterialsAndLevels(materialsPart, sortedNames, deckCards, targetName);

                    if (foundMaterials.length >= 2) {
                        const firstLine = (targetCard.desc || '').split('\n')[0].trim();
                        const archReq = firstLine.match(/\b\d\+?\s+"([^"]+)"\s+monsters/i);
                        if (archReq) {
                            const reqArch = archReq[1].toLowerCase();
                            const invalidMats = foundMaterials.filter(m => {
                                const arch = (m.archetype || '').toLowerCase();
                                const name = m.name.toLowerCase();
                                return !arch.includes(reqArch) && !name.includes(reqArch);
                            });

                            if (invalidMats.length > 0) {
                                potentialErrors++;
                                errorDetails.push({
                                    file: filename,
                                    type: 'Link Archetype Material Violation',
                                    step: step.slice(0, 100),
                                    target: targetCard.name,
                                    requirement: firstLine,
                                    invalidMaterials: invalidMats.map(m => `${m.name} (${m.archetype || 'No Archetype'})`)
                                });
                            } else {
                                verifiedSummons++;
                            }
                        } else {
                            verifiedSummons++;
                        }
                    }
                }
            }
        }
    }
}

console.log('=======================================================');
console.log(`Extra Deck Summons Verified: ${verifiedSummons} | Potential Errors: ${potentialErrors}`);
console.log(`Files with potential errors: ${new Set(errorDetails.map(e => e.file)).size}`);
console.log('=======================================================\n');

if (errorDetails.length > 0) {
    console.log('Detected Material / Math Issues:');
    errorDetails.forEach((err, i) => {
        console.log(`${i + 1}. [${err.file}] ${err.type} on '${err.target}':`);
        console.log(`   Step: "${err.step}..."`);
        if (err.materials) console.log(`   Materials: ${err.materials.join(', ')}`);
        if (err.invalidMaterials) console.log(`   Invalid: ${err.invalidMaterials.join(', ')} (Required: ${err.requirement})`);
    });
    process.exit(1);
} else {
    console.log('All Extra Deck summon materials and level math verified successfully! (0 errors)');
    process.exit(0);
}
