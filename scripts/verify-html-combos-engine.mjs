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
    const ncStepsBlocks = [...content.matchAll(/<div class="nc-steps">([\s\S]*?)<\/div>\s*<\/div>/g)];

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

/**
 * Builds an actionable engine combo definition from parsed HTML steps.
 */
async function buildComboFromHtml(parsedCombo) {
    const cardsMap = new Map();
    const steps = [];

    // 1. Collect and resolve all mentioned cards
    for (const s of parsedCombo.steps) {
        // Collect candidate names
        const candidates = new Set();
        if (s.featuredCard && !s.featuredCard.toLowerCase().includes('loading')) {
            candidates.add(s.featuredCard);
        }
        for (const c of (s.cardsMentioned || [])) {
            candidates.add(c);
        }

        // Direct verb target check in step text (e.g. "Normal Summon X", "Activate X")
        const verbMatch = s.text.match(/(?:normal summon|activate|special summon|link summon|synchro summon|xyz summon|fusion summon|set)\s+([A-Z][A-Za-z0-9'\s-:]+?)(?::|\.|\s+to|\s+from|,|\s+and|$)/i);
        if (verbMatch) {
            candidates.add(verbMatch[1].trim());
        }

        for (const name of candidates) {
            const cardData = await resolveCardAsync(name);
            if (cardData && !cardsMap.has(cardData.name.toLowerCase())) {
                const isExtra = (cardData.type & 0x4000040) !== 0; // Fusion/Link/Synchro/Xyz
                cardsMap.set(cardData.name.toLowerCase(), {
                    id: `card_${cardData.code}`,
                    name: cardData.name,
                    code: cardData.code,
                    type: isExtra ? 'extra' : ((cardData.type & 0x1) ? 'monster' : 'spell'),
                    zone: isExtra ? 'zone-extra' : 'zone-deck',
                    data: cardData
                });
            }
        }

        let stepFeatured = s.featuredCard;
        if (s.featuredCard) {
            const resolvedFeatured = await resolveCardAsync(s.featuredCard);
            if (resolvedFeatured) {
                stepFeatured = resolvedFeatured.name;
            }
        }

        steps.push({
            stepNum: s.stepNum,
            stepTitle: s.stepTitle,
            text: s.text,
            featuredCard: stepFeatured
        });
    }

    // 2. Determine starting Hand cards
    // The first card summoned or activated in Step 1 starts in Hand
    if (parsedCombo.steps[0]) {
        const firstStep = parsedCombo.steps[0];
        let starterName = null;

        if (firstStep.featuredCard && !firstStep.featuredCard.toLowerCase().includes('loading')) {
            starterName = firstStep.featuredCard;
        } else {
            const verbMatch = firstStep.text.match(/(?:normal summon|activate|special summon)\s+([A-Z][A-Za-z0-9'\s-:]+?)(?::|\.|\s+to|\s+from|,|\s+and|$)/i);
            if (verbMatch) {
                starterName = verbMatch[1].trim();
            } else if (firstStep.cardsMentioned && firstStep.cardsMentioned[0]) {
                starterName = firstStep.cardsMentioned[0];
            }
        }

        if (starterName) {
            const starterCard = await resolveCardAsync(starterName);
            if (starterCard) {
                const isExtra = (starterCard.type & 0x4000040) !== 0;
                const existing = cardsMap.get(starterCard.name.toLowerCase());
                if (existing) {
                    existing.zone = isExtra ? 'zone-extra' : 'zone-hand';
                } else {
                    cardsMap.set(starterCard.name.toLowerCase(), {
                        id: `card_${starterCard.code}`,
                        name: starterCard.name,
                        code: starterCard.code,
                        type: isExtra ? 'extra' : 'monster',
                        zone: isExtra ? 'zone-extra' : 'zone-hand',
                        data: starterCard
                    });
                }
            }
        }
    }

    // 3. Merge auxiliary targets from matching JSON combo if available
    if (parsedCombo.comboSystemArch) {
        const jsonPath = path.join(COMBOS_DIR, `${parsedCombo.comboSystemArch}-combos.json`);
        if (fs.existsSync(jsonPath)) {
            try {
                const raw = fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
                const jsonData = JSON.parse(raw);
                const firstCombo = Object.values(jsonData.combos || {})[0];
                if (firstCombo && firstCombo.cards) {
                    for (const c of firstCombo.cards) {
                        const resolved = await resolveCardAsync(c.name);
                        if (resolved && !cardsMap.has(resolved.name.toLowerCase())) {
                            cardsMap.set(resolved.name.toLowerCase(), {
                                id: `card_${resolved.code}`,
                                name: resolved.name,
                                code: resolved.code,
                                type: c.type || 'monster',
                                zone: c.zone || 'zone-deck',
                                data: resolved
                            });
                        }
                    }
                }
            } catch (e) {
                // Ignore json read errors
            }
        }
    }

    return {
        title: parsedCombo.comboTitle,
        cards: [...cardsMap.values()],
        steps
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
        const comboObj = await buildComboFromHtml(combo);

        let replayResult;
        try {
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
            console.log(`\x1b[32mLEGAL\x1b[0m (${replayResult.stepsCompleted}/${combo.steps.length} steps, ${duration}ms)`);
        } else if (replayResult.status === 'UNOFFICIAL_CARDS') {
            skippedCombos.push({ file, archetype, title: combo.comboTitle, missing: replayResult.missingCards });
            console.log(`\x1b[33mSKIPPED\x1b[0m (${replayResult.missingCards?.length || 0} unofficial/unresolved cards)`);
        } else {
            const firstError = replayResult.errors?.[0] || 'Step could not be completed legally under duel engine rules.';
            const stepNumMatch = firstError.match(/Step (\d+)/i);
            const failedStepNum = stepNumMatch ? Number(stepNumMatch[1]) : (replayResult.stepsCompleted + 1);
            const stepData = combo.steps[failedStepNum - 1] || combo.steps[0];

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
