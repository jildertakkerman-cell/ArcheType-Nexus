import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runComboReplay } from './lib/combo-runner.mjs';
import { resolveCardAsync, cleanCardName } from './lib/card-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PAGES_DIR = path.resolve(__dirname, '../pages');
const COMBOS_DIR = path.resolve(__dirname, '../assets/data/combos');
const REPORT_FILE = path.resolve(__dirname, 'engine-illegal-plays-report.json');
const CHECKLIST_FILE = path.resolve(__dirname, 'ILLEGAL_COMBOS_AUDIT.md');

// Parse CLI flags
const args = process.argv.slice(2);
let targetFile = null;
let maxPages = null;
let runAll = false;

for (const arg of args) {
    if (arg === '--all') {
        runAll = true;
    } else if (arg.startsWith('--file=')) {
        targetFile = arg.split('=')[1];
    } else if (arg.startsWith('--max=')) {
        maxPages = Number(arg.split('=')[1]);
    } else if (!arg.startsWith('--') && arg.endsWith('.html')) {
        targetFile = arg;
    }
}

// Find HTML files
let htmlFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html')).sort();

if (targetFile) {
    const base = path.basename(targetFile);
    htmlFiles = htmlFiles.filter(f => f === base || f.toLowerCase() === base.toLowerCase());
    if (htmlFiles.length === 0) {
        console.error(`Error: File "${targetFile}" not found in ${PAGES_DIR}`);
        process.exit(1);
    }
} else if (!runAll) {
    // Default: Run against a representative sample of popular archetypes
    const curatedSample = [
        'Primite Deck Analysis.html',
        'Dark Magician Deck Analysis.html',
        'Cyber Dragon Deck Analysis.html',
        'Toon Deck Analysis.html',
        'Blue-Eyes Deck Analysis.html',
        'Branded Deck Analysis.html'
    ];
    htmlFiles = htmlFiles.filter(f => curatedSample.includes(f));
}

/**
 * Parses written combos from an HTML page.
 * Supports both Spotlight (nc-steps) and standard (combo-step-card) layouts.
 */
export function parseHtmlCombos(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);

    // Extract archetype from data-combo-system if present
    const systemMatch = content.match(/data-combo-system="([^"]+)"/i);
    const comboSystemArch = systemMatch ? systemMatch[1].toLowerCase() : null;

    const combos = [];

    // 1. Check for Spotlight format (nc-steps blocks)
    const ncStepsBlocks = [...content.matchAll(/<div class="nc-steps">([\s\S]*?<\/div>)\s*<\/div>/g)];

    if (ncStepsBlocks.length > 0) {
        for (let b = 0; b < ncStepsBlocks.length; b++) {
            const blockContent = ncStepsBlocks[b][1];
            const blockIndex = ncStepsBlocks[b].index;
            const precedingText = content.slice(Math.max(0, blockIndex - 1000), blockIndex);
            const tagMatch = precedingText.match(/<span class="nc-tag[^"]*">(.*?)<\/span>\s*([^<]+)/i);
            const titleMatch = precedingText.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
            const comboTitle = tagMatch
                ? `${tagMatch[1].replace(/<[^>]+>/g, '').trim()} - ${tagMatch[2].replace(/<[^>]+>/g, '').trim()}`
                : (titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : `Spotlight Combo ${b + 1}`);

            const stepMatches = [...blockContent.matchAll(/<div class="nc-step">([\s\S]*?)<\/div>\s*(?=<div class="nc-step"|$)/g)];
            const steps = [];

            for (let s = 0; s < stepMatches.length; s++) {
                const chunk = stepMatches[s][1];
                const numMatch = chunk.match(/<span class="nc-step-n">\s*(\d+)\s*<\/span>/i);
                const stepNum = numMatch ? parseInt(numMatch[1], 10) : (s + 1);

                const pMatch = chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
                const text = pMatch ? pMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

                const boldCards = [...chunk.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/g)]
                    .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
                    .filter(c => c.length > 2 && !/^(cl\d|chain link|turn|main phase|end phase|legal|illegal)$/i.test(c));

                if (text) {
                    steps.push({
                        stepNum,
                        stepTitle: '',
                        featuredCard: boldCards[0] || '',
                        cardsMentioned: boldCards,
                        text
                    });
                }
            }

            if (steps.length > 0) {
                combos.push({
                    comboTitle,
                    comboSystemArch,
                    steps
                });
            }
        }
    }

    // 2. Check for standard combo-step-card layout
    const stepCards = [...content.matchAll(/class="[^"]*combo-step-card[^"]*"([\s\S]*?)(?=(?:class="[^"]*combo-step-card[^"]*")|<\/section>|$)/gi)];
    const numberedStepCards = [];
    for (const match of stepCards) {
        const chunk = match[1].slice(0, 2500);
        const numMatch = chunk.match(/<span[^>]*class="[^"]*(?:rounded-full|h-8|w-8)[^"]*"[^>]*>\s*(\d+)\s*<\/span>/i)
            || chunk.match(/<span[^>]*>\s*(\d+)\s*<\/span>/i);
        if (numMatch) {
            numberedStepCards.push({ chunk, stepNum: parseInt(numMatch[1], 10) });
        }
    }

    if (numberedStepCards.length > 0) {
        const titleMatch = content.match(/<h2[^>]*class="[^"]*(?:text-center|font-bold)[^"]*"[^>]*>\s*(?:Core Combo:[^<]*|Key Combo[^<]*|The One-Card Combo:[^<]*|.*?Combo[^<]*)\s*<\/h2>/i);
        const comboTitle = titleMatch ? titleMatch[0].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : 'Core Combo';

        const steps = [];
        for (const item of numberedStepCards) {
            const chunk = item.chunk;
            const stepNum = item.stepNum;

            const hMatch = chunk.match(/<h[34][^>]*>(.*?)<\/h[34]>/i);
            const stepTitle = hMatch ? hMatch[1].replace(/<[^>]+>/g, '').trim() : '';

            const pMatch = chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
            const stepDesc = pMatch ? pMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

            const imgDivMatch = chunk.match(/card-placeholder[^>]*>([\s\S]*?)<\/div>/i);
            const featuredCard = imgDivMatch ? imgDivMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';

            const boldCards = [...chunk.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/g)]
                .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
                .filter(c => c.length > 2 && !/^(cl\d|chain link|step \d)$/i.test(c));

            if (stepDesc) {
                const cleanFeatured = (featuredCard && !featuredCard.toLowerCase().includes('loading')) ? featuredCard : '';
                steps.push({
                    stepNum,
                    stepTitle,
                    featuredCard: cleanFeatured || boldCards[0] || '',
                    cardsMentioned: boldCards,
                    text: stepDesc
                });
            }
        }

        if (steps.length > 0) {
            combos.push({
                comboTitle,
                comboSystemArch,
                steps
            });
        }
    }

    return { filename, combos };
}

const DECKLISTS_DIR = path.resolve(__dirname, '../assets/data/decklists');
const decklistIndex = new Map();
if (fs.existsSync(DECKLISTS_DIR)) {
    const listFiles = fs.readdirSync(DECKLISTS_DIR).filter(f => f.endsWith('.json'));
    for (const f of listFiles) {
        const baseSlug = f.replace(/\.json$/i, '').toLowerCase();
        decklistIndex.set(baseSlug, path.join(DECKLISTS_DIR, f));
    }
}

function findDecklistPath(archetype, comboSystemArch) {
    if (comboSystemArch && decklistIndex.has(comboSystemArch.toLowerCase())) {
        return decklistIndex.get(comboSystemArch.toLowerCase());
    }
    if (archetype) {
        const slug = archetype.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (decklistIndex.has(slug)) return decklistIndex.get(slug);
        const simple = archetype.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const [k, v] of decklistIndex.entries()) {
            if (k.replace(/[^a-z0-9]/g, '') === simple) return v;
        }
    }
    return null;
}

export function splitSubActions(text) {
    if (!text) return [];
    const normalized = text
        .replace(/\s+\./g, '.')
        .replace(/\s+,/g, ',')
        .replace(/\s+;/g, ';');

    const sentenceParts = normalized.split(/(?<!\b(?:e\.g|i\.e|vs|etc|dr|mr|st|lv|no|[A-Z]))(?<=\.)\s+(?=[A-Z0-9"'])|;\s*|,\s*(?:and\s+)?then\s+(?=[a-z0-9"'])|\s+and\s+(?=(?:tribute it|activate its)\b)/i);

    const finalParts = [];
    const subPrefixRe = /^(?:with|using|since|because|after|when|if|once|while|during|in|on|from|by|as|for)\b/i;
    const commaActionRe = /^(.{12,}?),\s*((?:tribute it|activate|use|link summon|xyz summon|synchro summon|fusion summon)\b[\s\S]*)$/i;

    for (const part of sentenceParts) {
        const trimmed = part.replace(/^then,\s*/i, '').trim();
        if (trimmed.length <= 4) continue;
        const m = trimmed.match(commaActionRe);
        if (m && !subPrefixRe.test(m[1].trim())) {
            finalParts.push(m[1].trim());
            finalParts.push(m[2].trim());
        } else {
            finalParts.push(trimmed);
        }
    }
    return finalParts.filter(p => p.length > 4);
}

/**
 * Builds an actionable engine combo definition from parsed HTML steps.
 * Incorporates full decklists, step sentence decomposition, and legal opening hands.
 */
export async function buildComboFromHtml(parsedCombo, archetype = null) {
    const cardsMap = new Map();

    // 1. Scan combo steps for acronyms (e.g. "Cyber Repair Plant (CRP)")
    const acronymMap = new Map();
    for (const s of parsedCombo.steps) {
        const acroMatches = [...s.text.matchAll(/([A-Z][A-Za-z0-9'-]+(?:\s+[A-Z][A-Za-z0-9'-]+)*)\s*\(([A-Za-z0-9/-]{2,8})\)/g)];
        for (const m of acroMatches) {
            const full = m[1].trim();
            const acro = m[2].trim();
            acronymMap.set(acro.toLowerCase(), full);
            acronymMap.set(acro, full);
        }
    }

    // 2. Load decklist for realistic Main & Extra Deck target pool
    const deckPath = findDecklistPath(archetype, parsedCombo.comboSystemArch);
    if (deckPath && fs.existsSync(deckPath)) {
        try {
            const deckData = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
            for (const item of (deckData.main || [])) {
                const cardName = item[0];
                const count = typeof item[1] === 'number' ? item[1] : 1;
                const res = await resolveCardAsync(cardName);
                if (res) {
                    for (let i = 0; i < count; i++) {
                        const id = `card_${res.code}_${i}`;
                        cardsMap.set(id, {
                            id,
                            name: res.name,
                            code: res.code,
                            type: (res.type & 0x1) ? 'monster' : 'spell',
                            zone: 'zone-deck',
                            data: res
                        });
                    }
                }
            }
            for (const item of (deckData.extra || [])) {
                const cardName = item[0];
                const count = typeof item[1] === 'number' ? item[1] : 1;
                const res = await resolveCardAsync(cardName);
                if (res) {
                    for (let i = 0; i < count; i++) {
                        const id = `extra_${res.code}_${i}`;
                        cardsMap.set(id, {
                            id,
                            name: res.name,
                            code: res.code,
                            type: 'extra',
                            zone: 'zone-extra',
                            data: res
                        });
                    }
                }
            }
        } catch (e) {
            // Ignore decklist read error
        }
    }

    // 3. Ensure all cards mentioned across combo steps are registered
    for (const s of parsedCombo.steps) {
        const mentions = [...(s.cardsMentioned || []), s.featuredCard];
        const verbMatches = [...s.text.matchAll(/(?:normal summon|activate|reveal|special summon|link summon|synchro summon|xyz summon|fusion summon|rank-up into|overlay (?:into|to)|set)\s+([A-Za-z0-9'\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+into\b|\s+as\b|,|\s+and\b|$)/gi)];
        for (const vm of verbMatches) {
            mentions.push(vm[1].trim());
        }

        for (let m of mentions) {
            if (!m || m.toLowerCase().includes('loading')) continue;
            if (acronymMap.has(m.toLowerCase())) m = acronymMap.get(m.toLowerCase());
            m = m.replace(/\s*\([A-Za-z0-9/-]{2,8}\)$/, '').trim();
            const res = await resolveCardAsync(m);
            if (res) {
                const isExtra = (res.type & 0x4000040) !== 0;
                const existing = [...cardsMap.values()].filter(c => c.code === res.code);
                if (existing.length === 0) {
                    const copies = isExtra ? 1 : 2;
                    for (let i = 0; i < copies; i++) {
                        const id = `${isExtra ? 'extra' : 'card'}_${res.code}_${i}`;
                        cardsMap.set(id, {
                            id,
                            name: res.name,
                            code: res.code,
                            type: isExtra ? 'extra' : ((res.type & 0x1) ? 'monster' : 'spell'),
                            zone: isExtra ? 'zone-extra' : 'zone-deck',
                            data: res
                        });
                    }
                }
            }
        }
    }

    // 4. Decompose compound steps into atomic sub-actions
    const decomposedSteps = [];
    for (const s of parsedCombo.steps) {
        const subActions = splitSubActions(s.text);
        const actionsToUse = subActions.length > 0 ? subActions : [s.text];
        for (const sub of actionsToUse) {
            let cleanText = sub;
            for (const [acro, full] of acronymMap.entries()) {
                cleanText = cleanText.replace(new RegExp(`\\b${acro}\\b`, 'g'), full);
            }
            decomposedSteps.push({
                stepNum: s.stepNum,
                stepTitle: s.stepTitle,
                text: cleanText,
                featuredCard: s.featuredCard
            });
        }
    }

    // Helper to place a card in opening hand without depleting its last copy in Deck
    let handCloneCounter = 0;
    const ensureInHand = (cardData) => {
        if (!cardData) return;
        const isExtra = (cardData.type & 0x4000040) !== 0;
        if (isExtra) return;
        const alreadyInHand = [...cardsMap.values()].some(c => c.code === cardData.code && c.zone === 'zone-hand');
        if (alreadyInHand) return;
        const deckCopies = [...cardsMap.values()].filter(c => c.code === cardData.code && c.zone === 'zone-deck');
        if (deckCopies.length >= 2) {
            deckCopies[0].zone = 'zone-hand';
        } else {
            const id = `hand_${cardData.code}_${handCloneCounter++}`;
            cardsMap.set(id, {
                id,
                name: cardData.name,
                code: cardData.code,
                type: (cardData.type & 0x1) ? 'monster' : 'spell',
                zone: 'zone-hand',
                data: cardData
            });
        }
    };

    // 5. Determine starting Hand cards (Official 5-card opening hand)
    if (parsedCombo.steps[0]) {
        const firstStep = parsedCombo.steps[0];
        let starterName = null;

        if (firstStep.featuredCard && !firstStep.featuredCard.toLowerCase().includes('loading')) {
            starterName = firstStep.featuredCard;
        } else {
            const verbMatch = firstStep.text.match(/(?:normal summon|activate|reveal|special summon)\s+([A-Z][A-Za-z0-9'\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+by\b|\s+using\b|\s+with\b|,|\s+and\b|$)/i);
            if (verbMatch) {
                starterName = verbMatch[1].trim();
            } else if (firstStep.cardsMentioned && firstStep.cardsMentioned[0]) {
                starterName = firstStep.cardsMentioned[0];
            }
        }

        if (starterName) {
            const starterCard = await resolveCardAsync(starterName);
            ensureInHand(starterCard);
        }
    }

    // Track searched/added cards across steps so we know which "from hand" cards must have been in the opening hand
    const searchedCodes = new Set();
    for (const s of parsedCombo.steps) {
        const discardMatch = s.text.match(/(?:discard(?:ing)?|reveal)\s+([A-Z][A-Za-z0-9'\s-:]+?)(?:\s+to|\s+from|\s+in\s+hand|,|\.|\s+and|$)/i);
        if (discardMatch) {
            const dCard = await resolveCardAsync(discardMatch[1].trim());
            if (dCard && !searchedCodes.has(dCard.code)) {
                ensureInHand(dCard);
            }
        }

        const fromHandMatch = s.text.match(/(?:special summon|normal summon|discard(?:ing)?|reveal)\s+([A-Z][A-Za-z0-9',\s-]+?)\s+(?:from|in) (?:your )?hand/i);
        if (fromHandMatch) {
            const hCard = await resolveCardAsync(fromHandMatch[1].trim());
            if (hCard && !searchedCodes.has(hCard.code)) {
                ensureInHand(hCard);
            }
        }

        // Record cards searched/added in this step for subsequent steps
        for (const m of (s.cardsMentioned || [])) {
            const c = await resolveCardAsync(m);
            if (c && /(?:search|add)/i.test(s.text)) {
                searchedCodes.add(c.code);
            }
        }
    }

    // Fill remaining opening hand slots up to 5 cards (cloning 1 archetype monster and 1 spell from decklist so Deck targets are never depleted)
    let inHand = [...cardsMap.values()].filter(c => c.zone === 'zone-hand').length;
    const deckMonsters = [...cardsMap.values()].filter(c => c.zone === 'zone-deck' && (c.data.type & 0x1));
    const deckSpells = [...cardsMap.values()].filter(c => c.zone === 'zone-deck' && (c.data.type & 0x2));

    if (inHand < 5 && deckSpells.length > 0) {
        const sp = deckSpells[0].data;
        const id = `hand_fodder_spell_${handCloneCounter++}`;
        cardsMap.set(id, { id, name: sp.name, code: sp.code, type: 'spell', zone: 'zone-hand', data: sp });
        inHand++;
    }
    for (const dm of deckMonsters) {
        if (inHand >= 5) break;
        const mData = dm.data;
        const id = `hand_fodder_mon_${handCloneCounter++}`;
        cardsMap.set(id, { id, name: mData.name, code: mData.code, type: 'monster', zone: 'zone-hand', data: mData });
        inHand++;
    }

    // Fallback dummy cards if deck had fewer than 5 cards
    while (inHand < 5) {
        const dummyCode = 12607053; // "Beaver Warrior"
        const dummyCard = await resolveCardAsync(dummyCode);
        if (dummyCard) {
            const id = `dummy_hand_${inHand}`;
            cardsMap.set(id, {
                id,
                name: dummyCard.name,
                code: dummyCard.code,
                type: 'monster',
                zone: 'zone-hand',
                data: dummyCard
            });
            inHand++;
        } else {
            break;
        }
    }

    return {
        title: parsedCombo.comboTitle,
        cards: [...cardsMap.values()],
        steps: decomposedSteps
    };
}

export async function runHtmlAuditor() {
    console.log('='.repeat(70));
    console.log(' ArcheType Nexus - HTML Combo Engine Rule Auditor');
    console.log('='.repeat(70));
    console.log(`Scanning written combo sections in ${htmlFiles.length} HTML page(s)...\n`);

    const violations = [];
    const legalCombos = [];
    const skippedCombos = [];

    let totalPagesScanned = 0;
    let totalCombosScanned = 0;
    let totalStepsScanned = 0;

for (let i = 0; i < htmlFiles.length; i++) {
    if (maxPages && totalPagesScanned >= maxPages) break;

    const file = htmlFiles[i];
    const fullPath = path.join(PAGES_DIR, file);
    const parsed = parseHtmlCombos(fullPath);

    if (!parsed || parsed.combos.length === 0) continue;

    totalPagesScanned++;
    const archetype = parsed.filename.replace(/ Deck Analysis\.html$/i, '');

    for (let cIdx = 0; cIdx < parsed.combos.length; cIdx++) {
        const combo = parsed.combos[cIdx];
        totalCombosScanned++;
        totalStepsScanned += combo.steps.length;

        const comboLabel = parsed.combos.length > 1
            ? `${archetype} [Combo ${cIdx + 1}: ${combo.comboTitle}]`
            : `${archetype} - "${combo.comboTitle}"`;

        process.stdout.write(`[${totalCombosScanned}] ${comboLabel} (${combo.steps.length} steps)... `);
        const startTime = Date.now();
        let replayResult;
        let comboObj = null;
        try {
            comboObj = await buildComboFromHtml(combo, archetype);
            replayResult = await runComboReplay(comboObj);
        } catch (err) {
            replayResult = {
                status: 'CRASHED',
                legal: false,
                stepsCompleted: 0,
                totalSteps: combo.steps.length,
                errors: [err.message]
            };
        }
        const duration = Date.now() - startTime;

        if (replayResult.status === 'VERIFIED_LEGAL') {
            legalCombos.push({ file, archetype, title: combo.comboTitle, steps: combo.steps.length, duration });
            console.log(`\x1b[32mLEGAL\x1b[0m (${combo.steps.length}/${combo.steps.length} HTML steps, ${replayResult.stepsCompleted} engine actions, ${duration}ms)`);
        } else if (replayResult.status === 'UNOFFICIAL_CARDS') {
            skippedCombos.push({ file, archetype, title: combo.comboTitle, missing: replayResult.missingCards });
            console.log(`\x1b[33mSKIPPED\x1b[0m (${replayResult.missingCards?.length || 0} unofficial/unresolved cards)`);
        } else {
            const firstError = replayResult.errors?.[0] || 'Step could not be completed legally under duel engine rules.';
            const stepNumMatch = firstError.match(/Step (\d+)/i);
            const failedSubStepIdx = stepNumMatch ? Number(stepNumMatch[1]) - 1 : replayResult.stepsCompleted;
            const failedSubStep = comboObj?.steps?.[failedSubStepIdx];
            const failedStepNum = failedSubStep?.stepNum || (failedSubStepIdx + 1);
            const stepData = combo.steps.find(s => s.stepNum === failedStepNum) || combo.steps[failedStepNum - 1] || combo.steps[0];

            const violationEntry = {
                file,
                archetype,
                comboTitle: combo.comboTitle,
                failedStepNumber: failedStepNum,
                totalSteps: combo.steps.length,
                writtenTitle: stepData?.stepTitle || '',
                writtenText: stepData?.text || '',
                engineError: firstError,
                stepsCompletedBeforeFailure: replayResult.stepsCompleted,
                log: replayResult.log || []
            };
            violations.push(violationEntry);

            console.log(`\x1b[31mILLEGAL / FAILED AT STEP ${failedStepNum}\x1b[0m`);
            console.log(`     Issue: ${firstError}`);
        }
    }
}

console.log('\n' + '='.repeat(70));
console.log(' HTML Combo Audit Summary');
console.log('='.repeat(70));
console.log(`Pages Evaluated:       ${totalPagesScanned}`);
console.log(`Combos Audited:        ${totalCombosScanned}`);
console.log(`Steps Audited:         ${totalStepsScanned}`);
console.log(`100% Legal Confirmed:  ${legalCombos.length}`);
console.log(`Unofficial Skipped:    ${skippedCombos.length}`);
console.log(`Rule Issues Detected:  ${violations.length}`);
console.log('');

// Save JSON Report
const jsonReport = {
    timestamp: new Date().toISOString(),
    totalPagesScanned,
    totalCombosScanned,
    totalStepsScanned,
    summary: {
        legal: legalCombos.length,
        unofficial: skippedCombos.length,
        violations: violations.length
    },
    violations,
    legalCombos,
    skippedCombos
};
fs.writeFileSync(REPORT_FILE, JSON.stringify(jsonReport, null, 2));
console.log(`Detailed JSON report saved to: ${REPORT_FILE}`);

// Save Markdown Checklist
let mdContent = `# Headless Yu-Gi-Oh! OCGCore HTML Combo Audit\n\n`;
mdContent += `Generated: ${new Date().toUTCString()}\n\n`;
mdContent += `### Summary\n`;
mdContent += `- **Pages Audited**: ${totalPagesScanned}\n`;
mdContent += `- **Total Combos Audited**: ${totalCombosScanned}\n`;
mdContent += `- **Total Steps Audited**: ${totalStepsScanned}\n`;
mdContent += `- **100% Legal Confirmed**: ${legalCombos.length}\n`;
mdContent += `- **Rule / Illegal Plays Detected**: ${violations.length}\n`;
mdContent += `- **Unofficial / Custom Skipped**: ${skippedCombos.length}\n\n`;

if (violations.length > 0) {
    mdContent += `## Illegal Plays & Action Items\n\n`;
    for (const v of violations) {
        mdContent += `### [ ] [${v.archetype}](${v.file}) - ${v.comboTitle}\n`;
        mdContent += `- **File**: \`${v.file}\`\n`;
        mdContent += `- **Failed at**: Step ${v.failedStepNumber} of ${v.totalSteps}\n`;
        if (v.writtenTitle) mdContent += `- **Step Title**: "${v.writtenTitle}"\n`;
        mdContent += `- **Written Step**: *"${v.writtenText}"*\n`;
        mdContent += `- **Engine Violation**: \`${v.engineError}\`\n`;
        if (v.log && v.log.length > 0) {
            mdContent += `- **Prior Legal Plays**:\n`;
            for (const l of v.log) {
                mdContent += `  - \`${l}\`\n`;
            }
        }
        mdContent += `\n`;
    }
} else {
    mdContent += `## All Audited Pages Passed 100% Legal!\n`;
}

    fs.writeFileSync(CHECKLIST_FILE, mdContent, 'utf8');
    console.log(`Actionable checklist saved to: ${CHECKLIST_FILE}`);
}

const currentScript = fileURLToPath(import.meta.url);
if (process.argv[1] && (path.resolve(process.argv[1]) === path.resolve(currentScript))) {
    runHtmlAuditor().catch(err => {
        console.error('Fatal auditor error:', err);
        process.exit(1);
    });
}
