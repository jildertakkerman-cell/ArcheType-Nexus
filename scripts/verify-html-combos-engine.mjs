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

function decodeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&#x27;|&apos;/gi, "'")
        .replace(/&amp;/gi, '&')
        .replace(/&mdash;|&ndash;/gi, '-')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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
            const comboTitle = decodeHtml(
                tagMatch
                    ? `${tagMatch[1].replace(/<[^>]+>/g, '').trim()} - ${tagMatch[2].replace(/<[^>]+>/g, '').trim()}`
                    : (titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : `Spotlight Combo ${b + 1}`)
            );

            const stepMatches = [...blockContent.matchAll(/<div class="nc-step">([\s\S]*?)<\/div>\s*(?=<div class="nc-step"|$)/g)];
            let steps = [];
            let subComboIdx = 1;

            for (let s = 0; s < stepMatches.length; s++) {
                const chunk = stepMatches[s][1];
                const numMatch = chunk.match(/<span class="nc-step-n">\s*(\d+)\s*<\/span>/i);
                const stepNum = numMatch ? parseInt(numMatch[1], 10) : (s + 1);

                const pMatch = chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
                const text = pMatch ? decodeHtml(pMatch[1].replace(/<[^>]+>/g, ' ')) : '';

                const boldCards = [...chunk.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/g)]
                    .map(m => decodeHtml(m[1].replace(/<[^>]+>/g, '')))
                    .filter(c => c.length > 2 && !/^(cl\d|chain link|turn|main phase|end phase|legal|illegal)$/i.test(c));

                if (text) {
                    if (stepNum === 1 && steps.length > 0) {
                        combos.push({
                            comboTitle: subComboIdx === 1 ? comboTitle : `${comboTitle} (Line ${subComboIdx})`,
                            comboSystemArch,
                            steps
                        });
                        steps = [];
                        subComboIdx++;
                    }
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
                    comboTitle: subComboIdx === 1 ? comboTitle : `${comboTitle} (Line ${subComboIdx})`,
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
        const comboTitle = decodeHtml(titleMatch ? titleMatch[0].replace(/<[^>]+>/g, '') : 'Core Combo');

        let steps = [];
        let subComboIdx = 1;
        for (const item of numberedStepCards) {
            const chunk = item.chunk;
            const stepNum = item.stepNum;

            const hMatch = chunk.match(/<h[34][^>]*>(.*?)<\/h[34]>/i);
            const stepTitle = hMatch ? decodeHtml(hMatch[1].replace(/<[^>]+>/g, '')) : '';

            const pMatch = chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
            const stepDesc = pMatch ? decodeHtml(pMatch[1].replace(/<[^>]+>/g, ' ')) : '';

            const imgDivMatch = chunk.match(/card-placeholder[^>]*>([\s\S]*?)<\/div>/i);
            const featuredCard = imgDivMatch ? decodeHtml(imgDivMatch[1].replace(/<[^>]+>/g, '')) : '';

            const boldCards = [...chunk.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/g)]
                .map(m => decodeHtml(m[1].replace(/<[^>]+>/g, '')))
                .filter(c => c.length > 2 && !/^(cl\d|chain link|step \d)$/i.test(c));

            if (stepDesc) {
                if (stepNum === 1 && steps.length > 0) {
                    combos.push({
                        comboTitle: subComboIdx === 1 ? comboTitle : `${comboTitle} (Line ${subComboIdx})`,
                        comboSystemArch,
                        steps
                    });
                    steps = [];
                    subComboIdx++;
                }
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
                comboTitle: subComboIdx === 1 ? comboTitle : `${comboTitle} (Line ${subComboIdx})`,
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
        const cleanArch = archetype
            .replace(/\s+(?:Deck Analysis|Archetype Breakdown|Archetype Deep Dive|Strategy Guide|Guide|Analysis)\.html$/i, '')
            .replace(/\.html$/i, '')
            .trim();
        const slug = cleanArch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (decklistIndex.has(slug)) return decklistIndex.get(slug);
        const simple = cleanArch.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const [k, v] of decklistIndex.entries()) {
            if (k.replace(/[^a-z0-9]/g, '') === simple) return v;
        }
    }
    return null;
}

export function splitSubActions(text) {
    if (!text) return [];
    const normalized = decodeHtml(text)
        .replace(/^(?:action:\s*|step\s+\d+:\s*)+/i, '')
        .replace(/\bNS\s+(?=[A-Z])/g, 'Normal Summon ')
        .replace(/\bSS\s+(?=[A-Z])/g, 'Special Summon ')
        .replace(/\s+\./g, '.')
        .replace(/\s+,/g, ',')
        .replace(/\s+;/g, ';');

    const sentenceParts = normalized.split(/(?<!\b(?:e\.g|i\.e|vs|etc|dr|mr|st|lv|no|[A-Za-z])\.)(?<=\.)\s+(?=[A-Z0-9"'])|;\s*|\s*(?:->|→)\s*(?=(?:Normal Summon|Special Summon|Activate|Use|Tribute|Banish|Link|Xyz|Synchro|Fusion|Search|Add|Set|Send)\b)|,\s*(?:and\s+)?then\s+(?!(?:discard|shuffle)\b)(?=[a-z0-9"'])|,\s*which\s+then\s+(?!(?:enables|allows|lets|gives|sets up|leads to|unlocks|creates|provides|makes|protects|locks)\b)(?=[a-z0-9"'])|\s+and\s+(?:immediately\s+|then\s+)?(?=(?:tribute it|activate|use|link summon|link it|xyz summon|synchro summon|fusion summon|special summon|overlay)\b)/i);

    const finalParts = [];
    const subPrefixRe = /^(?:with|using|since|because|after|when|if|once|while|during|in|on|from|by|as|for)\b/i;
    const commaActionRe = /^(.{12,}?),\s*((?:tribute it|activate|use|link summon|xyz summon|synchro summon|fusion summon)\b[\s\S]*)$/i;
    const bareVerbOnlyRe = /^(?:place|activate|summon|normal summon|special summon|set|use|tribute|discard|banish|send)\.?$/i;

    for (const part of sentenceParts) {
        const trimmed = part.replace(/^then,\s*/i, '').trim();
        if (trimmed.length <= 4 || bareVerbOnlyRe.test(trimmed)) continue;
        const m = trimmed.match(commaActionRe);
        if (m && !subPrefixRe.test(m[1].trim())) {
            finalParts.push(m[1].trim());
            finalParts.push(m[2].trim());
        } else {
            finalParts.push(trimmed);
        }
    }
    return finalParts.filter(p => p.length > 4 && !bareVerbOnlyRe.test(p));
}

/**
 * Builds an actionable engine combo definition from parsed HTML steps.
 * Incorporates full decklists, step sentence decomposition, and legal opening hands.
 */
export async function buildComboFromHtml(parsedCombo, archetype = null) {
    const cardsMap = new Map();

    // 1. Scan combo steps for acronyms (e.g. "Cyber Repair Plant (CRP)") + universal YGO shorthand
    const acronymMap = new Map([
        ['rota', 'Reinforcement of the Army'],
        ['ROTA', 'Reinforcement of the Army'],
        ['udf', 'Number F0: Utopic Draco Future'],
        ['UDF', 'Number F0: Utopic Draco Future']
    ]);
    for (const s of parsedCombo.steps) {
        const acroMatches = [...s.text.matchAll(/([A-Z][A-Za-z0-9'-]+(?:\s+[A-Z][A-Za-z0-9'-]+)*)\s*\(([A-Za-z0-9/-]{2,8})\)/g)];
        for (const m of acroMatches) {
            const full = m[1].trim();
            const acro = m[2].trim();
            if (!/^(?:lv\d+|limited|banned|1|2|3)$/i.test(acro)) {
                acronymMap.set(acro.toLowerCase(), full);
                acronymMap.set(acro, full);
            }
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

    const lookupCleanInDeckOrDb = async (candidate) => {
        if (!candidate || candidate.length < 3) return null;
        if (acronymMap.has(candidate.toLowerCase())) candidate = acronymMap.get(candidate.toLowerCase());
        const lower = candidate.toLowerCase();
        for (const c of cardsMap.values()) {
            if (c.name.toLowerCase() === lower) return c.data;
        }
        const wordRe = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        for (const c of cardsMap.values()) {
            if (wordRe.test(c.name)) return c.data;
        }
        return await resolveCardAsync(candidate);
    };

    // Helper to resolve card names against already-loaded archetype decklist cards FIRST before global DB
    const resolveInComboOrDb = async (rawName) => {
        if (!rawName) return null;
        const baseClean = cleanCardName(rawName)
            .replace(/\s*\((?:currently\s+|now\s+)?(?:limited|semi-limited|banned|forbidden|level\s*\d+|rank\s*\d+|link-\d+|\d+|optional|cost)[^)]*\)/gi, '')
            .replace(/\s*\([A-Za-z0-9/-]{2,8}\)$/, '')
            .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+)/i, '')
            .replace(/\s*'s(?:\s+(?:monster|gy|graveyard|hand|field|scale|on-summon|summon|on-activation|quick|second|first|other|ignition))?(?:\s+effect)?$/i, '')
            .replace(/\s+effect$/i, '')
            .trim();
        if (!baseClean || baseClean.length < 3) return null;

        // First try without stripping leading verbs so card names starting with "Tribute", "Link", "Set", "Fusion", etc. resolve intact
        const verbStripped = baseClean
            .replace(/^(?:(?:activate|activating|use|using|trigger|triggering|normal summon(?:ing)?|special summon(?:ing)?|link summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|fusion summon(?:ing)?|ritual summon(?:ing)?|pendulum summon(?:ing)?|tribute summon(?:ing)?|summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|banish(?:ing)?|send(?:ing)?|target(?:ing)?|chain(?:ing)?|overlay(?:ing)?|tune|tuning|equip(?:ping)?|place|placing|search(?:ing)?(?:\s+for)?|add(?:ing)?|finish(?:ing)?|tribute|tributing|link|linking|set|setting)\s+)/i, '')
            .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+)/i, '')
            .trim();

        if (verbStripped === baseClean) {
            return await lookupCleanInDeckOrDb(baseClean);
        }
        // If baseClean started with a single-word potential card-name prefix ("Tribute Lanius", "Link Spider", "Set Rotation"), try baseClean first
        if (/^(?:tribute|link|set|fusion|synchro|xyz|ritual|pendulum|place|target)\s+[A-Z]/i.test(baseClean)) {
            const direct = await lookupCleanInDeckOrDb(baseClean);
            if (direct) return direct;
        }
        return (await lookupCleanInDeckOrDb(verbStripped)) || (await lookupCleanInDeckOrDb(baseClean));
    };

    // 3. Ensure all cards mentioned across combo steps are registered
    for (const s of parsedCombo.steps) {
        const mentions = [...(s.cardsMentioned || []), s.featuredCard];
        const verbMatches = [...s.text.matchAll(/(?:normal summon(?:ing)?|tribute summon(?:ing)?|activat(?:e|ing)|reveal(?:ing)?|special summon(?:ing)?|link summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|fusion summon(?:ing)?|ritual summon(?:ing)?|rank-up into|climb(?:ing)?\s+into|overlay(?:ing)?(?:\s+into|\s+to)?|set(?:ting)?|place|placing|search(?:ing)?(?:\s+for)?|add(?:ing)?|send(?:ing)?|dump(?:ing)?|equip(?:ping)?|tribut(?:e|ing)|reviv(?:e|ing)|summons|revives)\s+([A-Za-z0-9',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+into\b|\s+as\b|,(?!\s*the\b)|\s+and\b|$)/gi)];
        for (const vm of verbMatches) {
            mentions.push(vm[1].trim());
        }
        const exampleMatches = [...s.text.matchAll(/(?:\(\s*(?:e\.g\.?,?|i\.e\.?,?|like|such as|optimally|ideally|preferably|usually|into)\s+|\b(?:e\.g\.?,?|like|such as)\s+)([A-Z][A-Za-z0-9"',\s-:]+?)(?=\)|,|\.|\s+to\b|\s+from\b|\s+in\b|\s+and\b|\s+or\b|$)/gi)];
        for (const em of exampleMatches) {
            mentions.push(em[1].trim());
        }
        const possMatches = [...s.text.matchAll(/\b([A-Z][A-Za-z0-9'\s-]+?)\s*'s\s+(?:on-summon\s+|summon\s+|on-activation\s+|monster\s+|gy\s+|graveyard\s+|hand\s+|field\s+|scale\s+|quick\s+|ignition\s+)?effect/g)];
        for (const pm of possMatches) {
            mentions.push(pm[1].trim());
        }

        for (const m of mentions) {
            if (!m || m.toLowerCase().includes('loading')) continue;
            const res = await resolveInComboOrDb(m);
            if (res) {
                const isExtra = (res.type & 0x4802040) !== 0;
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

    // 4. Decompose compound steps into atomic sub-actions (scoping featuredCard so split sub-steps aren't polluted)
    const decomposedSteps = [];
    for (const s of parsedCombo.steps) {
        const subActions = splitSubActions(s.text);
        const actionsToUse = subActions.length > 0 ? subActions : [s.text];
        const featClean = (s.featuredCard && !s.featuredCard.toLowerCase().includes('loading')) ? s.featuredCard.trim() : '';
        const featWords = featClean.split(/[\s,-]+/).filter(w => w.length >= 4 && !/^(?:the|and|for|from|with|into|dragon|warrior|monster)$/i.test(w));

        for (const sub of actionsToUse) {
            let cleanText = sub;
            for (const [acro, full] of acronymMap.entries()) {
                cleanText = cleanText.replace(new RegExp(`\\b${acro}\\b`, 'g'), full);
            }
            const isGenericSubStep = /\b(?:normal|special|link|synchro|xyz|fusion|ritual)\s+summon\s+(?:any|a|an|1)\b/i.test(cleanText);
            const subMentionsFeatured = Boolean(
                featClean && (
                    cleanText.toLowerCase().includes(featClean.toLowerCase()) ||
                    featWords.some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(cleanText))
                )
            );
            const useFeatured = !isGenericSubStep && (actionsToUse.length === 1 || subMentionsFeatured) ? featClean : '';

            decomposedSteps.push({
                stepNum: s.stepNum,
                stepTitle: s.stepTitle,
                text: cleanText,
                featuredCard: useFeatured
            });
        }
    }

    // Helper to place a card in opening hand without depleting its last copy in Deck
    let handCloneCounter = 0;
    const ensureInHand = (cardData) => {
        if (!cardData) return false;
        const isExtra = (cardData.type & 0x4802040) !== 0;
        if (isExtra) return false;
        const alreadyInHand = [...cardsMap.values()].some(c => c.code === cardData.code && c.zone === 'zone-hand');
        if (alreadyInHand) return true;
        const curHandCount = [...cardsMap.values()].filter(c => c.zone === 'zone-hand').length;
        if (curHandCount >= 5) return false;
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
        return true;
    };

    const ensureInZone = (cardData, targetZone) => {
        if (!cardData) return false;
        const alreadyThere = [...cardsMap.values()].some(c => c.code === cardData.code && c.zone === targetZone);
        if (alreadyThere) return true;
        const deckCopies = [...cardsMap.values()].filter(c => c.code === cardData.code && c.zone === 'zone-deck');
        if (deckCopies.length >= 2) {
            deckCopies[0].zone = targetZone;
        } else {
            const id = `setup_${targetZone}_${cardData.code}_${handCloneCounter++}`;
            cardsMap.set(id, {
                id,
                name: cardData.name,
                code: cardData.code,
                type: (cardData.type & 0x4802040) ? 'extra' : ((cardData.type & 0x1) ? 'monster' : 'spell'),
                zone: targetZone,
                data: cardData
            });
        }
        return true;
    };

    // 5. Determine starting Hand / GY / Field setup chronologically
    if (parsedCombo.steps[0]) {
        const firstStep = parsedCombo.steps[0];
        const candidateNames = [];

        const verbMatch = firstStep.text.match(/(?:normal summon(?:ing)?|tribute summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|link summon(?:ing)?|overlay(?:ing)?|activat(?:e|ing)|reveal(?:ing)?|special summon(?:ing)?|summon(?:ing)?|start (?:with|by)|open(?:ing)?(?:\s+on|\s+with)?|required hand:)\s+([A-Za-z0-9',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+in\b|\s+by\b|\s+using\b|\s+with\b|\s+plus\b|,(?!\s*the\b)|\s+and\b|$)/i);
        if (verbMatch && /^[A-Z0-9"']/.test(verbMatch[1].trim())) candidateNames.push(verbMatch[1].trim());
        const exMatches = [...firstStep.text.matchAll(/(?:\(\s*(?:e\.g\.?,?|i\.e\.?,?|like|such as|optimally|ideally)\s+|\b(?:e\.g\.?,?|like|such as)\s+)([A-Z][A-Za-z0-9"',\s-:]+?)(?=\)|,|\.|\s+to\b|\s+from\b|\s+in\b|\s+and\b|\s+or\b|$)/gi)];
        for (const em of exMatches) {
            candidateNames.push(em[1].trim());
        }
        if (firstStep.featuredCard && !firstStep.featuredCard.toLowerCase().includes('loading')) {
            candidateNames.push(firstStep.featuredCard);
        }
        for (const m of (firstStep.cardsMentioned || [])) {
            candidateNames.push(m);
        }

        let placedStarter = false;
        const isMultiStarterSetup = /^(?:start with|open(?:ing)?|required hand:|with\b.*?\bin (?:your )?hand)/i.test(firstStep.text.trim());
        for (const cand of candidateNames) {
            const cardData = await resolveInComboOrDb(cand);
            if (cardData && ensureInHand(cardData)) {
                placedStarter = true;
                if (!isMultiStarterSetup) break;
            }
        }

        // If Step 1 says "Normal Summon any <Archetype> monster" and no specific Main Deck starter was resolved, place a Level <= 4 monster from the decklist into hand
        if (!placedStarter && /normal summon/i.test(firstStep.text)) {
            const lv4Monster = [...cardsMap.values()].find(c => c.zone === 'zone-deck' && (c.data.type & 0x1) && c.data.level > 0 && c.data.level <= 4);
            if (lv4Monster) ensureInHand(lv4Monster.data);
        }

        // Handle mid-board Step 1 starts (e.g., Step 1 is an immediate Xyz/Synchro/Link/Tribute Summon or "Start with X on field")
        const firstSubText = (decomposedSteps[0]?.text || firstStep.text || '').trim();
        let mzoneSeq = 1;
        let szoneSeq = 1;
        const placeOnField = (cData) => {
            if (!cData) return;
            if (cData.type & 0x80000) {
                ensureInZone(cData, 'zone-field');
            } else if ((cData.type & 0x1) || (cData.type & 0x4802040)) {
                if (mzoneSeq <= 5) ensureInZone(cData, `zone-m${mzoneSeq++}`);
            } else {
                if (szoneSeq <= 5) ensureInZone(cData, `zone-s${szoneSeq++}`);
            }
        };

        if (/(?:start with|begin with|with)\s+.+?\s+on (?:your |the )?field|\bsit(?:s)? on (?:your |the )?field|\bactive on (?:your |the )?field|^with\s+[A-Z][A-Za-z0-9'\s-]+\s+active\b/i.test(firstStep.text)) {
            for (const m of (firstStep.cardsMentioned || [])) {
                const cData = await resolveInComboOrDb(m);
                if (cData) placeOnField(cData);
            }
        } else if (/^(?:use|using|overlay|xyz summon|synchro summon|link summon|link\b|summon\b)/i.test(firstSubText) && !/\bnormal summon\b/i.test(firstSubText)) {
            // Check if Step 1 directly summons an Extra Deck monster without prior setup
            let targetExtra = null;
            for (const cand of candidateNames) {
                const cData = await resolveInComboOrDb(cand);
                if (cData && (cData.type & 0x4802040)) {
                    targetExtra = cData;
                    break;
                }
            }
            if (targetExtra) {
                if (targetExtra.type & 0x800000) { // Xyz Monster: needs 2 monsters of Level == Rank
                    const rank = targetExtra.level;
                    const matMons = [...cardsMap.values()].filter(c => (c.data.type & 0x1) && !(c.data.type & 0x4802040) && c.data.level === rank);
                    const fallbackByRank = { 1: 97268402, 2: 63977008, 3: 10802915, 4: 12607053, 5: 70095154, 6: 6637331, 7: 46986414, 8: 89631139, 9: 30539496, 10: 74530899 };
                    for (let k = 0; k < 2; k++) {
                        const chosenMon = matMons[k]?.data || matMons[0]?.data || (await resolveCardAsync(fallbackByRank[rank] || 12607053));
                        if (chosenMon) placeOnField(chosenMon);
                    }
                } else if (targetExtra.type & 0x2000) { // Synchro Monster
                    const targetLv = targetExtra.level;
                    const deckTuners = [...cardsMap.values()].filter(c => (c.data.type & 0x1) && !(c.data.type & 0x4802040) && (c.data.type & 0x1000) && c.data.level > 0 && c.data.level < targetLv);
                    const deckNonTuners = [...cardsMap.values()].filter(c => (c.data.type & 0x1) && !(c.data.type & 0x4802040) && !(c.data.type & 0x1000) && c.data.level > 0 && c.data.level < targetLv);
                    let tuner = null;
                    let nonTuner = null;
                    for (const t of deckTuners) {
                        const nt = deckNonTuners.find(n => n.data.level + t.data.level === targetLv);
                        if (nt) {
                            tuner = t.data;
                            nonTuner = nt.data;
                            break;
                        }
                    }
                    if (!tuner || !nonTuner) {
                        tuner = await resolveCardAsync(9742784); // Jet Synchron (Lv 1 Tuner)
                        const nonTunerByLv = { 1: 97268402, 2: 63977008, 3: 10802915, 4: 12607053, 5: 70095154, 6: 6637331, 7: 46986414, 8: 89631139, 9: 30539496 };
                        nonTuner = await resolveCardAsync(nonTunerByLv[targetLv - 1] || 12607053);
                    }
                    if (tuner && nonTuner) {
                        placeOnField(tuner);
                        placeOnField(nonTuner);
                    }
                } else if (targetExtra.type & 0x4000000) { // Link Monster
                    const deckMons = [...cardsMap.values()].filter(c => (c.data.type & 0x1) && !(c.data.type & 0x4802040));
                    const countNeeded = Math.min(targetExtra.level || 2, 2);
                    for (let k = 0; k < countNeeded; k++) {
                        const chosenMon = deckMons[k]?.data || deckMons[0]?.data || (await resolveCardAsync(10802915));
                        if (chosenMon) placeOnField(chosenMon);
                    }
                }
            }
        } else if (/\b(?:normal|tribute) summon\b/i.test(firstSubText)) {
            const firstHandMon = [...cardsMap.values()].find(c => c.zone === 'zone-hand' && (c.data.type & 0x1));
            if (firstHandMon && firstHandMon.data.level >= 5) {
                const tributesNeeded = firstHandMon.data.level >= 7 ? 2 : 1;
                const dummyMon = await resolveCardAsync(12607053);
                for (let k = 0; k < tributesNeeded; k++) {
                    if (dummyMon) placeOnField(dummyMon);
                }
            }
        }
    }

    // Track searched/added/sent cards across steps so we know which unsearched cards used from hand/GY must be in opening setup
    const searchedCodes = new Set();
    for (let sIdx = 0; sIdx < parsedCombo.steps.length; sIdx++) {
        const s = parsedCombo.steps[sIdx];

        // Explicit pre-existing GY setup ("With X in your GY", "already in the graveyard", or Step 1 GY activation)
        if (/(?:with|having|already)\b.*?\bin (?:your |the )?(?:gy|graveyard)/i.test(s.text) || (sIdx === 0 && /\bin (?:your |the )?(?:gy|graveyard)|\b(?:gy|graveyard) effect\b/i.test(s.text))) {
            for (const m of (s.cardsMentioned || [])) {
                const gyCard = await resolveInComboOrDb(m);
                if (gyCard && !searchedCodes.has(gyCard.code) && !/^(?:activate|use)\s+/i.test(s.text)) {
                    ensureInZone(gyCard, 'zone-gy');
                } else if (gyCard && sIdx === 0 && !searchedCodes.has(gyCard.code)) {
                    ensureInZone(gyCard, 'zone-gy');
                }
            }
        }

        const discardMatches = [
            ...s.text.matchAll(/(?:discard(?:ing)?|reveal(?:ing)?|send(?:ing)?|destroy(?:ing)?|banish(?:ing)?|tribut(?:e|ing))\s+([A-Za-z0-9"',\s-:]+?)(?:\s+to\b|\s+from\s+(?:your\s+)?hand|\s+in\s+(?:your\s+)?hand|,|\.|\s+and\b|$)/gi),
            ...s.text.matchAll(/(?:\(\s*(?:e\.g\.?,?|i\.e\.?,?|like|such as|optimally|ideally)\s+|\b(?:like|such as)\s+)([A-Z][A-Za-z0-9"',\s-:]+?)(?=\)|,|\.|$)/gi)
        ];
        for (const dm of discardMatches) {
            const candStr = dm[1].trim();
            if (/^[A-Z0-9"']/.test(candStr) && !/\b(?:deck|extra deck|gy|graveyard)\b/i.test(dm[0])) {
                const dCard = await resolveInComboOrDb(candStr);
                if (dCard && !searchedCodes.has(dCard.code)) {
                    ensureInHand(dCard);
                }
            }
        }

        const fromHandMatches = [
            ...s.text.matchAll(/(?:special summon(?:ing)?|normal summon(?:ing)?|tribute summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|activat(?:e|ing)|us(?:e|ing)|send(?:ing)?|destroy(?:ing)?|banish(?:ing)?|fus(?:e|ing)|plac(?:e|ing)|set(?:ting)?)\s+([A-Za-z0-9"',\s-]+?)(?:'s\s+(?:[a-z-]+\s+)?effect)?\s+(?:from|in) (?:your )?hand/gi),
            ...s.text.matchAll(/(?:normal summon(?:ing)?|tribute summon(?:ing)?|ritual summon(?:ing)?|activat(?:e|ing)|plac(?:e|ing)|set(?:ting)?)\s+([A-Za-z0-9"',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+in\b|,(?!\s*the\b)|\s+and\b|$)/gi)
        ];
        for (const fhm of fromHandMatches) {
            if (/\b(?:from|in)\s+(?:the\s+|your\s+)?(?:deck|gy|graveyard|extra deck|banish)/i.test(fhm[0])) continue;
            const rawCand = fhm[1]
                .replace(/^.*?\b(?:special summon(?:ing)?|normal summon(?:ing)?|tribute summon(?:ing)?|ritual summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|activat(?:e|ing)|us(?:e|ing)|plac(?:e|ing)|set(?:ting)?)\s+/i, '')
                .trim();
            if (!/^[A-Z0-9"']/.test(rawCand)) continue;
            const hCard = await resolveInComboOrDb(rawCand);
            if (hCard && !searchedCodes.has(hCard.code)) {
                // Only place in hand if it's a Spell/Trap, Ritual Monster, Pendulum, or explicitly summoned/used from hand
                const isSpellTrapOrRitualOrPend = (hCard.type & 0x6) !== 0 || (hCard.type & 0x80) !== 0 || (hCard.type & 0x1000000) !== 0;
                const isNormalOrFromHand = /(?:normal summon|tribute summon|from\s+(?:your\s+)?hand|in\s+(?:your\s+)?hand)/i.test(fhm[0]);
                if (isSpellTrapOrRitualOrPend || isNormalOrFromHand) {
                    ensureInHand(hCard);
                }
            }
        }

        // Also check bold cards in this step: if a Spell/Trap or Ritual Monster is activated/set/used and was never searched in a prior step, ensure it's in hand
        for (const m of (s.cardsMentioned || [])) {
            const c = await resolveInComboOrDb(m);
            if (!c) continue;
            if (!searchedCodes.has(c.code) && ((c.type & 0x6) !== 0 || (c.type & 0x80) !== 0)) {
                const nameEsc = m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const usedHereRe = new RegExp(`(?:activat(?:e|ing)|us(?:e|ing)|set(?:ting)?|ritual summon(?:ing)?|summon(?:ing)?\\s+a\\s+monster\\s+like)\\s+(?:a\\s+[A-Za-z-]+\\s+like\\s+)?${nameEsc}`, 'i');
                if (usedHereRe.test(s.text)) {
                    ensureInHand(c);
                }
            }
            if (/(?:search|add|set|place|send|dump|special summon|summon|draw|equip|revive)/i.test(s.text)) {
                searchedCodes.add(c.code);
            }
        }
    }

    // Fill remaining opening hand slots up to 5 cards using distinct archetype monsters (avoiding generic hand traps and duplicate names)
    let inHand = [...cardsMap.values()].filter(c => c.zone === 'zone-hand').length;
    const handTrapCodes = new Set([14558127, 23434538, 97268402, 94145021, 27204311, 59438930, 73642296, 10045474, 24224830]);
    const cleanArchWord = (archetype || '')
        .replace(/\s+(?:Deck Analysis|Archetype Breakdown|Archetype Deep Dive|Strategy Guide|Guide|Analysis)\.html$/i, '')
        .replace(/\.html$/i, '')
        .trim()
        .toLowerCase();

    const deckMonsters = [...cardsMap.values()].filter(c => c.zone === 'zone-deck' && (c.data.type & 0x1) && !handTrapCodes.has(c.code));
    const deckSpells = [...cardsMap.values()].filter(c => c.zone === 'zone-deck' && (c.data.type & 0x2) && !handTrapCodes.has(c.code));

    // Sort deckMonsters so archetype-named monsters and Level <= 4 monsters come first, with distinct card codes
    const seenFodderCodes = new Set([...cardsMap.values()].filter(c => c.zone === 'zone-hand').map(c => c.code));
    const sortedDistinctMons = [];
    for (const dm of deckMonsters) {
        if (!seenFodderCodes.has(dm.code)) {
            seenFodderCodes.add(dm.code);
            sortedDistinctMons.push(dm);
        }
    }
    sortedDistinctMons.sort((a, b) => {
        const aArch = cleanArchWord && a.name.toLowerCase().includes(cleanArchWord) ? 1 : 0;
        const bArch = cleanArchWord && b.name.toLowerCase().includes(cleanArchWord) ? 1 : 0;
        if (aArch !== bArch) return bArch - aArch;
        const aLv4 = (a.data.level > 0 && a.data.level <= 4) ? 1 : 0;
        const bLv4 = (b.data.level > 0 && b.data.level <= 4) ? 1 : 0;
        return bLv4 - aLv4;
    });

    for (const dm of sortedDistinctMons) {
        if (inHand >= 4) break;
        const mData = dm.data;
        const id = `hand_fodder_mon_${handCloneCounter++}`;
        cardsMap.set(id, { id, name: mData.name, code: mData.code, type: 'monster', zone: 'zone-hand', data: mData });
        inHand++;
    }
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

    // Enrich decomposedSteps with visual card IDs and destination zones for DuelSimulator
    let nextMZone = 1;
    let nextSZone = 1;
    for (const step of decomposedSteps) {
        if (!step.card) {
            const txt = step.text.toLowerCase();
            let matchedCard = null;
            if (step.featuredCard) {
                matchedCard = [...cardsMap.values()].find(c => c.name.toLowerCase().includes(step.featuredCard.toLowerCase()));
            }
            if (!matchedCard) {
                const sorted = [...cardsMap.values()].sort((a, b) => b.name.length - a.name.length);
                for (const c of sorted) {
                    if (txt.includes(c.name.toLowerCase())) {
                        matchedCard = c;
                        break;
                    }
                }
            }
            if (!matchedCard && /normal summon/i.test(txt)) {
                matchedCard = [...cardsMap.values()].find(c => c.zone === 'zone-hand' && c.type === 'monster');
            }
            if (matchedCard) {
                step.card = matchedCard.id;
            }
        }
        if (!step.to) {
            const txt = step.text.toLowerCase();
            if (/\b(?:link summon|link-\d|link \d)\b/i.test(txt)) {
                step.to = 'zone-em-left';
            } else if (/\b(?:xyz summon|synchro summon|fusion summon|special summon|normal summon|summon)\b/i.test(txt)) {
                step.to = `zone-m${nextMZone++}`;
                if (nextMZone > 5) nextMZone = 1;
            } else if (/\b(?:field spell|activate field)\b/i.test(txt)) {
                step.to = 'zone-field';
            } else if (/\b(?:activate|set)\b/i.test(txt)) {
                step.to = `zone-s${nextSZone++}`;
                if (nextSZone > 5) nextSZone = 1;
            } else if (/\b(?:discard|send .* to (?:the )?(?:gy|graveyard)|tribute|detach)\b/i.test(txt)) {
                step.to = 'zone-gy';
            } else if (/\bbanish\b/i.test(txt)) {
                step.to = 'zone-banish';
            } else if (/\b(?:search|add .* to (?:your )?hand|draw)\b/i.test(txt)) {
                step.to = 'zone-hand';
            }
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
    const archetype = parsed.filename
        .replace(/\s+(?:Deck Analysis|Archetype Breakdown|Archetype Deep Dive|Strategy Guide|Guide|Analysis)\.html$/i, '')
        .replace(/\.html$/i, '');

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
                failedSubStepIdx,
                log: replayResult.log || [],
                offeredActions: replayResult.offeredActions || null,
                comboData: comboObj,
                fieldSnapshot: replayResult.fieldSnapshot || null
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
