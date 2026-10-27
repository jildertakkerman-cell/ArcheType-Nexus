import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runComboReplay, runComboReplaySearch, UNSIMULATED_REASONS } from './lib/combo-runner.mjs';
import { resolveCardAsync, cleanCardName, parseCardDescription, findCardMatching, findLocalCard, getCardText } from './lib/card-engine.mjs';

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
// --strict: stop at the first step the engine doesn't match, as before (no skipping of prose it can't simulate)
// --no-search: report the harness's first attempt without trying alternative choices
let strictMode = false;
let searchAlternatives = true;

for (const arg of args) {
    if (arg === '--all') {
        runAll = true;
    } else if (arg === '--strict') {
        strictMode = true;
    } else if (arg === '--no-search') {
        searchAlternatives = false;
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
        // "K9-&Oslash;&Oslash; Lupis"
        .replace(/&Oslash;/g, 'Ø').replace(/&oslash;/g, 'ø')
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
            // A block whose badges are all icons is a feature list ("Cannot be destroyed by battle ...", one line per
            // effect), not a numbered combo
            if (!stepMatches.some(sm => /<span class="nc-step-n">\s*\d+\s*<\/span>/i.test(sm[1]))) continue;
            // ...and a numbered "Rulings Worth Knowing" / FAQ list is rulings, not a line to play
            if (/\b(?:rulings?|faq)\b/i.test(comboTitle)) continue;
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

// Does a card fit a parseCardDescription spec? (Main Deck cards only: descriptions never stand for Extra Deck monsters)
function cardMatchesSpec(d, name, spec) {
    if (!d || (d.type & 0x4802040)) return false;
    if (spec.kind === 'spell' ? !(d.type & 0x2) : spec.kind === 'trap' ? !(d.type & 0x4) : !(d.type & 0x1)) return false;
    if (spec.level != null && d.level !== spec.level) return false;
    if (spec.minLevel != null && d.level < spec.minLevel) return false;
    if (spec.maxLevel != null && d.level > spec.maxLevel) return false;
    if (spec.attribute && d.attribute !== spec.attribute) return false;
    if (spec.race && (BigInt(d.race || 0) & BigInt(spec.race)) === 0n) return false;
    if (spec.tuner && !(d.type & 0x1000)) return false;
    if (spec.nonTuner && (d.type & 0x1000)) return false;
    if (spec.normal && !(d.type & 0x10)) return false;
    if (spec.nameLike && !String(name || '').toLowerCase().includes(spec.nameLike.toLowerCase())) return false;
    return true;
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

    // "Activate Clear World, then Clear Wall.": a bare card name after the split shares the previous part's verb
    const leadVerbRe = /^(activate|normal summon|special summon|set|use|discard|banish|reveal|tribute)\s+/i;
    const bareCardNameRe = /^"?[A-Z][\w'"-]*(?:\s+(?:of|the|and|-|[A-Z0-9][\w'"!-]*))*"?\.?$/;
    for (const rawPart of sentenceParts) {
        let part = rawPart;
        const prev = finalParts[finalParts.length - 1];
        const startsWithVerb = /^(?:activate|use|(?:normal|special|tribute|link|xyz|synchro|fusion|ritual|pendulum)\s+summon|summon|set|send|discard|banish|reveal|tribute|add|search|equip|overlay|detach|attach|pay|draw|place|negate|destroy|return|shuffle|target|link|xyz|synchro)\b/i.test(part.trim());
        // ("Immediately Link Summon Striker Dragon." is capitalized throughout but already has its verb)
        const hasActionWord = /\b(?:summon|activate|use|set|link|xyz|synchro|fusion|tribute|banish|send|add|search|discard|special|normal|overlay|immediately|then)\b/i.test(part);
        if (prev && !startsWithVerb && !hasActionWord && bareCardNameRe.test(part.trim()) && leadVerbRe.test(prev)) part = `${prev.match(leadVerbRe)[1]} ${part.trim()}`;
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
    // Only real abbreviations count ("Cyber Repair Plant (CRP)"); a lowercase gloss like "(scale)" or a rules shorthand like "(GY)" is not a card nickname
    const RULES_SHORTHAND = /^(?:gy|ed|emz|lp|atk|def|opt|hopt|ns|ss|ep|mp|bp|sp|otk|ftk|cl\d*|lv\d+|ss'd|ns'd)$/i;
    for (const s of parsedCombo.steps) {
        const acroMatches = [...s.text.matchAll(/([A-Z][A-Za-z0-9'-]+(?:\s+[A-Z][A-Za-z0-9'-]+)*)\s*\(([A-Za-z0-9/-]{2,8})\)/g)];
        for (const m of acroMatches) {
            const full = m[1].trim();
            const acro = m[2].trim();
            const upper = (acro.match(/[A-Z]/g) || []).length;
            const lower = (acro.match(/[a-z]/g) || []).length;
            const looksLikeAcronym = upper >= 2 && upper >= lower;
            if (looksLikeAcronym && !RULES_SHORTHAND.test(acro) && !/^(?:limited|banned|1|2|3)$/i.test(acro)) {
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

    // The page's archetype name ("Mathmech" from "Mathmech Deck Analyis.html", typos included)
    const pageArchetype = String(archetype || '')
        .replace(/\s+(?:Deck\s+Anal\w*|Archetype\s+\w+|Strategy Guide|Guide|Anal\w*)(?:\.html)?$/i, '')
        .replace(/\.html$/i, '')
        .trim();
    const lookupCleanInDeckOrDb = async (candidate) => {
        if (!candidate || candidate.length < 3) return null;
        if (acronymMap.has(candidate.toLowerCase())) candidate = acronymMap.get(candidate.toLowerCase());
        const lower = candidate.toLowerCase();
        for (const c of cardsMap.values()) {
            if (c.name.toLowerCase() === lower) return c.data;
        }
        const wordRe = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        for (const c of cardsMap.values()) {
            if (!wordRe.test(c.name)) continue;
            // A card with exactly this name beats a longer combo card that contains it: "Gagaga Magician" is Gagaga
            // Magician, not "Gagaga Magician - Gagaga Magic", and "Red Dragon Archfiend" isn't "Hot Red Dragon Archfiend
            // Abyss". A short name for a combo card stays that card ("Dark Blade" on the Memento page is Mementotlan Dark
            // Blade), and so does a name cut at a comma ("Dark Magician, the Pharaoh's Servant")
            const full = c.name.toLowerCase();
            if (!full.endsWith(` ${lower}`) && !full.startsWith(`${lower},`)) {
                const exactInDb = findLocalCard(candidate);
                if (exactInDb && exactInDb.name.toLowerCase() === lower) return exactInDb;
            }
            return c.data;
        }
        // A short name on an archetype page means that archetype's card: "Sigma" on the Mathmech page is
        // Mathmech Sigma, not the shortest database name containing it (Vylon Sigma)
        // Plural page names ("Heraldic Beasts") also try the card-name form ("Heraldic Beast Gryphon")
        const archetypeForms = [...new Set([pageArchetype, pageArchetype.replace(/(?<=\w{3})s$/i, '')])].filter(Boolean);
        for (const form of archetypeForms) {
            if (lower.includes(form.toLowerCase())) continue;
            for (const full of [`${form} ${candidate}`, `${form} - ${candidate}`]) {
                const res = findLocalCard(full);
                if (res && res.name.toLowerCase().includes(form.toLowerCase()) && wordRe.test(res.name)) return res;
            }
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
            .replace(/^(?:(?:activate|activating|use|using|trigger|triggering|normal summon(?:ing)?|special summon(?:ing)?|link summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|fusion summon(?:ing)?|ritual summon(?:ing)?|pendulum summon(?:ing)?|tribute summon(?:ing)?|summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|banish(?:ing)?|send(?:ing)?|target(?:ing)?|chain(?:ing)?|overlay(?:ing)?|tune|tuning|equip(?:ping)?|place|placing|search(?:ing)?(?:\s+for)?|add(?:ing)?|finish(?:ing)?|tribute|tributing|link|linking|set|setting|reviv(?:e|ing)|return(?:ing)?|recover(?:ing)?|retriev(?:e|ing)|dump(?:ing)?|mill(?:ing)?|excavat(?:e|ing)|attach(?:ing)?|detach(?:ing)?|destroy(?:ing)?|pop(?:ping)?|bounc(?:e|ing)|shuffl(?:e|ing)|draw(?:ing)?|fus(?:e|ing)|declar(?:e|ing)|scal(?:e|ing)|flip(?:ping)?)\s+)/i, '')
            .replace(/^(?:the\s+(?:original\s+|2nd\s+|second\s+|other\s+)?|a\s+|an\s+|another\s+)/i, '')
            .trim();

        if (verbStripped === baseClean) {
            return await lookupCleanInDeckOrDb(baseClean);
        }
        // A card whose exact name starts with a verb ("Chain Resonator", "Draw Muscle") is that card, not "Chain" + a name
        const exactWhole = findLocalCard(baseClean);
        if (exactWhole && exactWhole.name.toLowerCase() === baseClean.toLowerCase()) return exactWhole;
        // If baseClean started with a single-word potential card-name prefix ("Tribute Lanius", "Link Spider", "Set Rotation"), try baseClean first
        if (/^(?:tribute|link|set|fusion|synchro|xyz|ritual|pendulum|place|target)\s+[A-Z]/i.test(baseClean)) {
            const direct = await lookupCleanInDeckOrDb(baseClean);
            if (direct) return direct;
        }
        return (await lookupCleanInDeckOrDb(verbStripped)) || (await lookupCleanInDeckOrDb(baseClean));
    };

    // Step titles like "Activate Snake Rain" often carry the only card name for that step. Accept the hint only on an
    // exact or whole-word name match, never the fuzzy LIKE fallback ("The Pivot" or "Set Up" must not resolve to a card).
    const titleCardHint = async (stepTitle) => {
        const m = (stepTitle || '').match(/^(?:activate|use|normal summon|special summon|tribute summon|link summon|xyz summon|synchro summon|fusion summon|ritual summon|summon|set|trigger|chain|reveal|discard|equip|place)\s+(?:the\s+|a\s+|an\s+)?([A-Z0-9"'][^:!?]*?)\s*$/i);
        if (!m) return null;
        const cand = cleanCardName(m[1]).replace(/^["']+|["']+$/g, '').trim();
        if (cand.length < 4 || /^(?:&|and\b|set up|it|its|them|the\b)/i.test(cand)) return null;
        const lower = cand.toLowerCase();
        for (const c of cardsMap.values()) {
            if (c.name.toLowerCase() === lower) return c.data;
        }
        const wordRe = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (/\s/.test(cand)) {
            for (const c of cardsMap.values()) {
                if (wordRe.test(c.name)) return c.data;
            }
        }
        const res = await resolveCardAsync(cand);
        if (res && (res.name.toLowerCase() === lower || (/\s/.test(cand) && wordRe.test(res.name)))) return res;
        return null;
    };
    const titleCards = [];
    for (const s of parsedCombo.steps) {
        titleCards.push(s.stepTitle ? await titleCardHint(s.stepTitle) : null);
    }
    for (const tc of titleCards) {
        if (!tc || [...cardsMap.values()].some(c => c.code === tc.code)) continue;
        const isExtra = (tc.type & 0x4802040) !== 0;
        for (let i = 0; i < (isExtra ? 1 : 2); i++) {
            const id = `${isExtra ? 'extra' : 'card'}_${tc.code}_${i}`;
            cardsMap.set(id, {
                id,
                name: tc.name,
                code: tc.code,
                type: isExtra ? 'extra' : ((tc.type & 0x1) ? 'monster' : 'spell'),
                zone: isExtra ? 'zone-extra' : 'zone-deck',
                data: tc
            });
        }
    }
    const textNamesKnownCard = (text) => {
        const t = (text || '').toLowerCase();
        for (const c of cardsMap.values()) {
            const n = c.name.toLowerCase();
            if (t.includes(n)) return true;
            const tail = n.includes(' - ') ? n.split(' - ').pop() : null;
            if (tail && tail.length >= 5 && t.includes(tail)) return true;
        }
        return false;
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
            // A Token is created by an effect, never drawn: one in the Deck gets picked by "send a World Legacy card"
            if (res && (res.type & 0x4000)) continue;
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

    // "banishing 3 more cards from the Extra Deck": a real Extra Deck holds 15 cards, so each card the write-up spends
    // without naming it gets a face-down stand-in (vanilla Fusion Monsters, which add nothing of their own)
    let edFodder = 0;
    for (const s of parsedCombo.steps) {
        for (const fm of decodeHtml(s.text || '').matchAll(/\bbanish(?:es|ing)?\s+(\d+|two|three|four|five)\s+(?:more\s+)?(?:face-down\s+)?cards?\s+from\s+(?:your\s+|the\s+)?extra deck/gi)) {
            edFodder += { two: 2, three: 3, four: 4, five: 5 }[fm[1].toLowerCase()] || Number(fm[1]);
        }
    }
    const ED_FODDER = [45231177, 66889139, 54752875, 41462083]; // Flame Swordsman, Gaia the Dragon Champion, Twin-Headed Thunder Dragon, Thousand Dragon
    for (let i = 0; i < Math.min(edFodder, 12); i++) {
        const res = await resolveCardAsync(ED_FODDER[i % ED_FODDER.length]);
        if (res) cardsMap.set(`extra_fodder_${i}`, { id: `extra_fodder_${i}`, name: res.name, code: res.code, type: 'extra', zone: 'zone-extra', data: res });
    }

    // An Extra Deck card that leaves the Extra Deck in two steps ("Nadir Servant sends Titaniklad ... Maximus sends
    // N'tss and Titaniklad from your Extra Deck") needs a copy for each, up to the 3 a real Extra Deck can hold
    for (const c of [...cardsMap.values()]) {
        if (c.zone !== 'zone-extra' || c.id !== `extra_${c.code}_0`) continue;
        const name = c.name.toLowerCase();
        const uses = parsedCombo.steps.filter(s => {
            const t = decodeHtml(s.text || '').toLowerCase();
            return t.includes(name) && /\bextra deck\b/.test(t);
        }).length;
        for (let i = 1; i < Math.min(3, uses); i++) {
            const id = `extra_${c.code}_${i}`;
            if (!cardsMap.has(id)) cardsMap.set(id, { ...c, id });
        }
    }

    // 4. Decompose compound steps into atomic sub-actions (scoping featuredCard so split sub-steps aren't polluted)
    // A sub-action only inherits the featured card through a word no other combo card shares: "Fairy" in
    // "Regulus the Fairy Beast" must not tie a later "...search for Spore the Fairy Seed" to Regulus
    const nameWordCounts = new Map();
    for (const name of new Set([...cardsMap.values()].map(c => c.name.toLowerCase()))) {
        for (const w of new Set(name.split(/[\s,-]+/))) nameWordCounts.set(w, (nameWordCounts.get(w) || 0) + 1);
    }
    const decomposedSteps = [];
    for (let sIdx = 0; sIdx < parsedCombo.steps.length; sIdx++) {
        const s = parsedCombo.steps[sIdx];
        const titleCard = titleCards[sIdx];
        const subActions = splitSubActions(s.text);
        const actionsToUse = subActions.length > 0 ? subActions : [s.text];
        const featClean = (s.featuredCard && !s.featuredCard.toLowerCase().includes('loading')) ? s.featuredCard.trim() : '';
        const featWords = featClean.split(/[\s,-]+/).filter(w => w.length >= 4 && !/^(?:the|and|for|from|with|into|dragon|warrior|monster)$/i.test(w) && (nameWordCounts.get(w.toLowerCase()) || 0) <= 1);

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
            let useFeatured = !isGenericSubStep && (actionsToUse.length === 1 || subMentionsFeatured) ? featClean : '';
            // The first sub-action of a step that names no card inherits the card from the step title ("Activate Snake Rain")
            if (!useFeatured && titleCard && sub === actionsToUse[0] && !textNamesKnownCard(cleanText)) {
                useFeatured = titleCard.name;
            }

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

    // `preset` marks a deliberate starting position (a mid-board Step 1, "start with X on the field", a Step 1 GY setup).
    // The runner only keeps field/GY starting zones for preset cards; anything else starts in the Deck.
    const ensureInZone = (cardData, targetZone, preset = true) => {
        if (!cardData) return false;
        const already = [...cardsMap.values()].find(c => c.code === cardData.code && c.zone === targetZone);
        if (already) {
            if (preset) already.preset = true;
            return true;
        }
        const deckCopies = [...cardsMap.values()].filter(c => c.code === cardData.code && c.zone === 'zone-deck');
        if (deckCopies.length >= 2) {
            deckCopies[0].zone = targetZone;
            if (preset) deckCopies[0].preset = true;
        } else {
            const id = `setup_${targetZone}_${cardData.code}_${handCloneCounter++}`;
            cardsMap.set(id, {
                id,
                name: cardData.name,
                code: cardData.code,
                type: (cardData.type & 0x4802040) ? 'extra' : ((cardData.type & 0x1) ? 'monster' : 'spell'),
                zone: targetZone,
                data: cardData,
                ...(preset ? { preset: true } : {})
            });
        }
        return true;
    };

    // 5. Determine starting Hand / GY / Field setup chronologically
    if (parsedCombo.steps[0]) {
        const firstStep = parsedCombo.steps[0];
        const candidateNames = [];

        const verbMatch = firstStep.text.match(/(?:normal summon(?:ing)?|tribute summon(?:ing)?|synchro summon(?:ing)?|xyz summon(?:ing)?|link summon(?:ing)?|overlay(?:ing)?|activat(?:e|ing)|reveal(?:ing)?|special summon(?:ing)?|summon(?:ing)?|start (?:with|by)|open(?:ing)?(?:\s+on|\s+with)?|required hand:)\s+([A-Za-z0-9@',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+in\b|\s+by\b|\s+using\b|\s+with\b|\s+plus\b|,(?!\s*the\b)|\s+and\b|$)/i);
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
        // Only the cards the setup clause names start in hand: "With Regulator and Winder in your hand, ... Special
        // Summons Winder and Adjuster from your Deck" keeps Adjuster in the Deck
        // ("With Carrier and Helix on your field and Stealth in your hand" puts only Stealth in the hand)
        const setupClause = !isMultiStarterSetup ? '' :
            (/^with\b.*?\bin (?:your )?hand\b/i.exec(firstStep.text.trim())?.[0] || firstStep.text.trim().split(/\.(?:\s|$)/)[0]).toLowerCase()
                .split(/\b(?:on (?:your |the )?field|in (?:your |the )?(?:gy|graveyard))\b/).pop();
        // ...and when the clause names a candidate, not even the first one outside it ("Activate Ignister A.I.Land"
        // later in Step 1 after "With Achichi @Ignister in your hand")
        // (a whole name: "Megalith Phuloch" in the clause doesn't name "Megalith Phul")
        const clauseHas = (c) => new RegExp(`(?:^|[^a-z0-9])${String(c).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`).test(setupClause);
        const clauseNamesCandidate = Boolean(setupClause) && candidateNames.some(clauseHas);
        for (const cand of candidateNames) {
            if ((placedStarter || clauseNamesCandidate) && setupClause && !clauseHas(cand)) continue;
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
        // A vanilla Normal Monster of a given Level, for materials and Tributes the write-up doesn't name
        const fillerMonster = async (level) => {
            const code = findCardMatching({ kind: 'monster', level, normal: true, nonTuner: true });
            return code ? await resolveCardAsync(code) : null;
        };
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

        // Within one sentence: "With Dragon in your hand, ... Special Summon it face-up on your field" is not a start state
        if (/(?:start with|begin with|with)\s+[^.;]+?\s+on (?:your |the )?field|\bsit(?:s)? on (?:your |the )?field|\bactive on (?:your |the )?field|^with\s+[A-Z][A-Za-z0-9'\s-]+\s+active\b/i.test(firstStep.text)) {
            // Each named card starts where its own clause says: "Start with Revolution Synchron in hand and ..."
            const startText = firstStep.text;
            // Only the cards inside the start clause: "With Diviner and Serve on your field, Synchro Summon Cupid Pitch
            // using ..." doesn't start with Cupid Pitch on the field
            const startSeg = (/(?:start with|begin with|with)\s+[^.;]+?\s+on (?:your |the )?field[^,.;]*/i.exec(startText)?.[0] || '').toLowerCase();
            // (each card once: "With Diviner and Serve on your field, ... using Diviner and Serve" names them twice)
            for (const m of [...new Set(firstStep.cardsMentioned || [])]) {
                if (startSeg && !startSeg.includes(String(m).toLowerCase())) continue;
                const cData = await resolveInComboOrDb(m);
                if (!cData) continue;
                const at = startText.toLowerCase().indexOf(m.toLowerCase());
                // The first place named after the card is where it starts: "With Cube and Soldier on your field and
                // Element and Material in your hand" puts Element in the hand, not just a card directly before "in your hand"
                const after = at === -1 ? '' : startText.slice(at + m.length);
                const place = /\b(?:in (?:your )?(hand)|in (?:your |the )?(gy|graveyard)|on (?:your |the )?field)\b/i.exec(after);
                if (place?.[1]) ensureInHand(cData);
                else if (place?.[2]) ensureInZone(cData, 'zone-gy', true);
                else placeOnField(cData);
            }
            // Described monsters ("any two Level 3 non-Tuner monsters on the field") get real matching cards, vanilla
            // Normal Monsters first so the filler adds nothing of its own
            for (const dm of startText.matchAll(/\b(?:any\s+)?(a|an|one|two|three|1|2|3)\s+([^,.;()]+?)\s+on (?:your |the )?field/gi)) {
                const spec = parseCardDescription(dm[2]);
                if (!spec || spec.kind !== 'monster') continue;
                const count = { a: 1, an: 1, one: 1, 1: 1, two: 2, 2: 2, three: 3, 3: 3 }[dm[1].toLowerCase()] || 1;
                const code = findCardMatching(spec, [...new Set([...cardsMap.values()].map(c => c.code))]);
                const filler = code ? await resolveCardAsync(code) : null;
                for (let k = 0; filler && k < count; k++) placeOnField(filler);
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
                    const fallbackMon = matMons.length ? null : await fillerMonster(rank);
                    for (let k = 0; k < 2; k++) {
                        const chosenMon = matMons[k]?.data || matMons[0]?.data || fallbackMon;
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
                        nonTuner = await fillerMonster(targetLv - 1);
                    }
                    if (tuner && nonTuner) {
                        placeOnField(tuner);
                        placeOnField(nonTuner);
                    }
                } else if (targetExtra.type & 0x4000000) { // Link Monster
                    const deckMons = [...cardsMap.values()].filter(c => (c.data.type & 0x1) && !(c.data.type & 0x4802040));
                    const countNeeded = Math.min(targetExtra.level || 2, 2);
                    for (let k = 0; k < countNeeded; k++) {
                        const chosenMon = deckMons[k]?.data || deckMons[0]?.data || (await fillerMonster(4));
                        if (chosenMon) placeOnField(chosenMon);
                    }
                }
            }
        } else if (/\b(?:normal|tribute) summon\b/i.test(firstSubText) && !/\bwithout\s+tribut/i.test(firstSubText)) {
            // Tribute fodder for the monster the step summons ("Normal Summon Eset"), not whichever monster is first in hand
            const handMons = [...cardsMap.values()].filter(c => c.zone === 'zone-hand' && (c.data.type & 0x1));
            const nsObj = /\b(?:normal|tribute) summon\s+(?:a\s+|an\s+|the\s+)?([^.,;(]+?)(?:\s+(?:by|using|with|from|to|and)\b|[.,;(]|$)/i.exec(firstSubText)?.[1]?.trim().toLowerCase();
            const firstHandMon = (nsObj && handMons.find(c => c.name.toLowerCase() === nsObj || c.name.toLowerCase().endsWith(' ' + nsObj))) || handMons[0];
            if (firstHandMon && firstHandMon.data.level >= 5) {
                const tributesNeeded = firstHandMon.data.level >= 7 ? 2 : 1;
                const dummyMon = await fillerMonster(4);
                for (let k = 0; k < tributesNeeded; k++) {
                    if (dummyMon) placeOnField(dummyMon);
                }
            }
        }
    }

    // Track searched/added/sent cards across steps so we know which unsearched cards used from hand/GY must be in opening setup
    const searchedCodes = new Set();
    // Second copies and described costs are filled only after every step's required cards have their hand slots
    const extraHandRequests = [];
    const resolveExactCardName = async (rawName) => {
        const cand = cleanCardName(rawName).replace(/^["']+|["']+$/g, '').trim();
        if (cand.length < 3) return null;
        const lower = cand.toLowerCase();
        const inCombo = [...cardsMap.values()].find(c => c.name.toLowerCase() === lower);
        if (inCombo) return inCombo.data;
        const res = await resolveCardAsync(cand);
        return res && res.name.toLowerCase() === lower ? res : null;
    };
    // Was this card searched or added earlier in the text than where it is used? ("Its effect adds Ancient Gear
    // Advance from your Deck to your hand. Activate Advance" - the Advance played is the one searched, not a hand card)
    const searchedBefore = (card, sIdx, pos) => {
        const n = card.name.toLowerCase();
        const variants = [n, n.includes(' - ') ? n.split(' - ').pop() : null,
            ...n.split(/[\s,-]+/).filter(w => w.length >= 5 && (nameWordCounts.get(w) || 0) <= 1)].filter(Boolean);
        const text = `${parsedCombo.steps.slice(0, sIdx).map(st => st.text).join(' ')} ${parsedCombo.steps[sIdx].text.slice(0, pos)}`.toLowerCase();
        for (const v of variants) {
            const nameRe = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
            for (const hit of text.matchAll(nameRe)) {
                const before = text.slice(Math.max(0, hit.index - 40), hit.index);
                const after = text.slice(hit.index + hit[0].length, hit.index + hit[0].length + 40);
                if (/(?:search(?:es|ing)?|add(?:s|ing)?)\s+(?:for\s+)?(?:a\s+|the\s+|another\s+)?$/i.test(before) ||
                    /^[\w\s'-]{0,12}from (?:the |your )?deck\b[^.]{0,20}\bto (?:your )?hand/i.test(after)) return true;
                // "Activate Pholis's effect to Set Evo-Force from your Deck. Activate Evo-Force" plays the Set copy
                if (/(?:sets?|setting|places?|placing)\s+(?:a\s+|the\s+)?$/i.test(before) &&
                    /^[\w\s'-]{0,12}(?:directly\s+)?from (?:the |your )?deck\b/i.test(after)) return true;
            }
        }
        return false;
    };
    for (let sIdx = 0; sIdx < parsedCombo.steps.length; sIdx++) {
        const s = parsedCombo.steps[sIdx];

        // A card named only in the step title ("Activate Snake Rain") is used from the hand unless an earlier step, or this
        // step's own text ("Activate the Divine Domain": "... place Divine Domain Baatistina from your Deck"), fetched it
        const titleCard = titleCards[sIdx];
        if (titleCard && !searchedCodes.has(titleCard.code) && !searchedBefore(titleCard, sIdx, s.text.length) &&/^(?:activate|use|normal summon|tribute summon|set|reveal|discard|chain|trigger)\b/i.test(s.stepTitle || '')) {
            ensureInHand(titleCard);
        }

        // Explicit pre-existing GY setup ("With X in your GY", "already in the graveyard", or Step 1 GY activation)
        if (/(?:with|having|already)\b.*?\bin (?:your |the )?(?:gy|graveyard)/i.test(s.text) || (sIdx === 0 && /\bin (?:your |the )?(?:gy|graveyard)|\b(?:gy|graveyard) effect\b/i.test(s.text))) {
            // Only the cards inside a "With X and Y in your GY," clause: "..., activate Necro Slime's effect to Fusion
            // Summon Genghis" doesn't start with Genghis in the GY
            // ("With Gagaga Magic in your hand and Golem and Gigas in your GY," puts only Golem and Gigas there)
            const gySeg = (/^\s*(?:with|having)\s+[^.;]+?\s+in (?:your |the )?(?:gy|graveyard)\s*,/i.exec(s.text)?.[0] || '')
                .toLowerCase().split(/\bin (?:your )?hand\b/).pop();
            for (const m of (s.cardsMentioned || [])) {
                if (gySeg && !gySeg.includes(String(m).toLowerCase())) continue;
                const gyCard = await resolveInComboOrDb(m);
                if (gyCard && !searchedCodes.has(gyCard.code) && !/^(?:activate|use)\s+/i.test(s.text)) {
                    ensureInZone(gyCard, 'zone-gy', sIdx === 0);
                } else if (gyCard && sIdx === 0 && !searchedCodes.has(gyCard.code)) {
                    ensureInZone(gyCard, 'zone-gy', true);
                }
            }
        }

        const discardMatches = [
            ...s.text.matchAll(/(?:discard(?:ing)?|reveal(?:ing)?|send(?:ing)?|destroy(?:ing)?|banish(?:ing)?|tribut(?:e|ing))\s+([A-Za-z0-9"',\s-:]+?)(?:\s+to\b|\s+from\s+(?:your\s+)?hand|\s+in\s+(?:your\s+)?hand|,|\.|\s+and\b|$)/gi),
            ...s.text.matchAll(/(?:\(\s*(?:e\.g\.?,?|i\.e\.?,?|like|such as|optimally|ideally)\s+|\b(?:like|such as)\s+)([A-Z][A-Za-z0-9"',\s-:]+?)(?=\)|,|\.|$)/gi)
        ];
        for (const dm of discardMatches) {
            const candStr = dm[1].trim();
            // "send Nunu, the Ogdoadic Remnant, Nauya, ... from your Deck to the GY": the match stops at the first
            // comma, so read on to the end of the sentence for where the cards come from
            const restOfSentence = s.text.slice(dm.index + dm[0].length).split(/[.;](?:\s|$)/)[0];
            // (and "reveal Kozmo Dark Destroyer, ... from your Deck" for Tincan reveals Deck cards, not hand cards)
            const fromElsewhere = /^(?:send|sending|reveal|revealing)\b/i.test(dm[0]) && /\bfrom (?:the |your )?(?:deck|extra deck|gy|graveyard)\b/i.test(restOfSentence);
            if (/^[A-Z0-9"']/.test(candStr) && !fromElsewhere && !/\b(?:deck|extra deck|gy|graveyard)\b/i.test(dm[0])) {
                const dCard = await resolveInComboOrDb(candStr);
                // "Special Summon Scar from your Deck ... by Tributing Scar": the Tribute is the summoned copy, not a hand card
                const summonedBefore = dCard && /^tribut/i.test(dm[0]) && new RegExp(
                    `special summons?\\s+(?:a\\s+|the\\s+)?${dCard.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+from (?:the |your )?(?:deck|gy|graveyard|extra deck)\\b`)
                    .test(`${parsedCombo.steps.slice(0, sIdx).map(st => st.text).join(' ')} ${s.text.slice(0, dm.index)}`.toLowerCase());
                if (dCard && !searchedCodes.has(dCard.code) && !searchedBefore(dCard, sIdx, dm.index) && !summonedBefore) {
                    ensureInHand(dCard);
                }
            }
        }

        const fromHandMatches = [
            ...s.text.matchAll(/(?:special summon(?:ing)?|normal summon(?:ing)?|tribute summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|activat(?:e|ing)|us(?:e|ing)|send(?:ing)?|destroy(?:ing)?|banish(?:ing)?|fus(?:e|ing)|plac(?:e|ing)|set(?:ting)?)\s+([A-Za-z0-9"',\s-]+?)(?:'s\s+(?:[a-z-]+\s+)?effect)?\s+(?:from|in) (?:your )?hand/gi),
            ...s.text.matchAll(/(?:normal summon(?:ing)?|tribute summon(?:ing)?|ritual summon(?:ing)?|activat(?:e|ing)|plac(?:e|ing)|set(?:ting)?)\s+([A-Za-z0-9"',\s-:]+?)(?::|\.|\s+to\b|\s+from\b|\s+using\b|\s+with\b|\s+by\b|\s+in\b|,(?!\s*the\b)|\s+and\b|$)/gi),
            // "Tribute Clear Cube to summon Clear Vicious Knight": a Tribute Summon from the hand
            ...s.text.matchAll(/\btribut(?:e|ing)\b[^.]{0,60}?\bto summon\s+([A-Za-z0-9"',\s-:]+?)(?::|\.|\s+from\b|\s+using\b|\s+with\b|\s+by\b|,|\s+and\b|$)/gi),
            // "sends Beginning Knight (from Deck) and Evening Twilight Knight (from hand) to the GY"
            ...s.text.matchAll(/(?:^|[\s,(]|\band\s+)([A-Z][A-Za-z0-9"'\s-]{2,60}?)\s*\((?:from|in)\s+(?:your\s+)?hand\)/g)
        ];
        for (const fhm of fromHandMatches) {
            // The match stops at "from", so read a little past it: "place Nazuki from your Deck" is not a hand card
            const matchedWithTail = s.text.slice(fhm.index, fhm.index + fhm[0].length + 24);
            if (/\b(?:from|in)\s+(?:the\s+|your\s+)?(?:deck|gy|graveyard|extra deck|banish)/i.test(matchedWithTail)) continue;
            const rawCand = fhm[1]
                .replace(/^.*?\b(?:special summon(?:ing)?|normal summon(?:ing)?|tribute summon(?:ing)?|ritual summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?|activat(?:e|ing)|us(?:e|ing)|plac(?:e|ing)|set(?:ting)?)\s+/i, '')
                // "Ritual Summon the Level 4 Nekroz of Unicore from your hand"
                .replace(/^(?:the\s+)?(?:level|rank)\s+\d+\s+/i, '')
                // "Use the effect of Fluffal Bear in hand"
                .replace(/^(?:the\s+)?effects?\s+of\s+/i, '')
                .replace(/^the\s+(?=[A-Z])/, '')
                .trim();
            if (!/^[A-Z0-9"']/.test(rawCand)) continue;
            const hCard = await resolveInComboOrDb(rawCand);
            if (hCard && !searchedCodes.has(hCard.code) && !searchedBefore(hCard, sIdx, fhm.index)) {
                // Only place in hand if it's a Spell/Trap, Ritual Monster, Pendulum, or explicitly summoned/used from hand
                const isSpellTrapOrRitualOrPend = (hCard.type & 0x6) !== 0 || (hCard.type & 0x80) !== 0 || (hCard.type & 0x1000000) !== 0;
                const isNormalOrFromHand = /(?:normal summon|tribute summon|from\s+(?:your\s+)?hand|in\s+(?:your\s+)?hand|tribut\w*\b.*\bto summon)/i.test(fhm[0]);
                if (isSpellTrapOrRitualOrPend || isNormalOrFromHand) {
                    ensureInHand(hCard);
                }
                // "Ritual Summon Demise ..." without naming the Spell: the one the monster's text names starts in hand too
                if ((hCard.type & 0x80) && /ritual summon/i.test(fhm[0]) &&
                    !(s.cardsMentioned || []).some(n => [...cardsMap.values()].some(c => c.name.toLowerCase() === String(n).toLowerCase() && (c.data.type & 0x82) === 0x82))) {
                    const spellName = (getCardText(hCard.code).match(/Ritual Summon this card with "([^"]+)"/i) || [])[1];
                    const spell = spellName && !s.text.toLowerCase().includes(spellName.toLowerCase()) ? findLocalCard(spellName) : null;
                    // (only that exact Ritual Spell: Phul's 'with a "Megalith" card' names an archetype, and a fuzzy
                    // match put a second Megalith Phul in the hand)
                    if (spell && (spell.type & 0x82) === 0x82 && spell.name.toLowerCase() === spellName.toLowerCase() &&
                        !searchedCodes.has(spell.code) && !searchedBefore(spell, sIdx, fhm.index)) ensureInHand(spell);
                }
            }
        }

        // "use a second Level Up!", "Activate the 2nd Galaxy Soldier": a copy played again from the hand needs a second
        // copy there. Only after a play-from-hand verb ("Special Summons a second X" comes from the Deck) and only for an
        // exact card name ("another HERO" means a different card, not a copy)
        for (const sm of s.text.matchAll(/\b(?:second|2nd|another)\s+(?:copy\s+of\s+)?("[^"]+"|[A-Z][A-Za-z0-9'!-]*(?:\s+[A-Z0-9][A-Za-z0-9'!-]*)*)/g)) {
            const playedFromHand = /\b(?:activat(?:e|ing)|us(?:e|ing)|set(?:ting)?|play(?:ing)?|chain(?:ing)?|normal summon(?:ing)?|discard(?:ing)?|reveal(?:ing)?)\s+(?:the\s+|a\s+|your\s+)?$/i.test(s.text.slice(Math.max(0, sm.index - 30), sm.index));
            const again = playedFromHand ? await resolveExactCardName(sm[1]) : null;
            if (again && !(again.type & 0x4802040)) extraHandRequests.push({ kind: 'copy', card: again });
        }

        // A hand cost the write-up describes instead of naming ("by discarding a Level 5+ DARK", "reveal a LIGHT Fairy
        // monster"). Asides in parentheses are examples ("(e.g., by discarding a Level 8 Megalith)"), not requirements
        const costText = s.text.replace(/\([^)]*\)/g, ' ');
        for (const gm of costText.matchAll(/\b(discard(?:ing)?|reveal(?:ing)?|send(?:ing)?)\s+(a|an|1|one|another|two|2)\s+(?!cards?\b)([^,.;()]+?)(?=\s+(?:to|from|in|and|as|for|while|then|which|by|when)\b|[,.;()]|$)/gi)) {
            if (/^send/i.test(gm[1]) && !/^\s*from (?:your |the )?hand\b/i.test(costText.slice(gm.index + gm[0].length))) continue;
            let spec = parseCardDescription(gm[3]);
            // "sending a Vampire from hand": an unquoted archetype word that the combo's own card names share
            if (!spec) {
                const word = gm[3].replace(/\s+(?:card|monster|spell|trap)s?$/i, '').trim();
                const lw = word.toLowerCase();
                if (/^[A-Z][A-Za-z-]+(?:\s[A-Z][A-Za-z-]+)?$/.test(word) &&
                    [...cardsMap.values()].some(c => c.name.toLowerCase() !== lw && new RegExp(`\\b${lw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(c.name.toLowerCase()))) {
                    spec = { kind: /\bspells?$/i.test(gm[3]) ? 'spell' : /\btraps?$/i.test(gm[3]) ? 'trap' : 'monster', nameLike: word };
                }
            }
            if (spec) extraHandRequests.push({ kind: 'cost', spec, wanted: /^(?:two|2)$/i.test(gm[2]) ? 2 : 1 });
        }

        // Also check bold cards in this step: if a Spell/Trap or Ritual Monster is activated/set/used and was never searched in a prior step, ensure it's in hand
        for (const m of (s.cardsMentioned || [])) {
            const c = await resolveInComboOrDb(m);
            if (!c) continue;
            if (!searchedCodes.has(c.code) && ((c.type & 0x6) !== 0 || (c.type & 0x80) !== 0)) {
                const nameEsc = m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const usedHereRe = new RegExp(`(?:activat(?:e|ing)|us(?:e|ing)|set(?:ting)?|ritual summon(?:ing)?|summon(?:ing)?\\s+a\\s+monster\\s+like)\\s+(?:a\\s+[A-Za-z-]+\\s+like\\s+)?${nameEsc}`, 'i');
                const usedHere = usedHereRe.exec(s.text);
                // "Set Evo-Force from your Deck" fetches it; it isn't a hand card being played
                const fromElsewhere = usedHere && /^\s*(?:directly\s+)?from (?:the |your )?(?:deck|gy|graveyard)\b/i
                    .test(s.text.slice(usedHere.index + usedHere[0].length));
                if (usedHere && !fromElsewhere && !searchedBefore(c, sIdx, usedHere.index)) {
                    ensureInHand(c);
                }
            }
            if (/(?:search|add|set|place|send|dump|special summon|summon|draw|equip|revive)/i.test(s.text)) {
                searchedCodes.add(c.code);
            }
        }
    }

    // The writer explicitly needs these cards, so they may take the hand one past the usual 5 cards
    const handCount = () => [...cardsMap.values()].filter(c => c.zone === 'zone-hand').length;
    const addToHand = (cardData, idPrefix) => {
        const id = `${idPrefix}_${cardData.code}_${handCloneCounter++}`;
        cardsMap.set(id, { id, name: cardData.name, code: cardData.code, type: (cardData.type & 0x1) ? 'monster' : 'spell', zone: 'zone-hand', data: cardData });
        return id;
    };
    const allComboText = parsedCombo.steps.map(st => `${st.stepTitle || ''} ${st.text}`).join(' ').toLowerCase();
    // A card the combo names at all ("Holeutea" for Traptrix Holeutea) is a combo piece, never cost fodder: full name,
    // the part after " - ", or a name word no other combo card shares
    const isNamedInCombo = (c) => {
        const n = c.name.toLowerCase();
        if (allComboText.includes(n)) return true;
        const tail = n.includes(' - ') ? n.split(' - ').pop() : null;
        if (tail && tail.length >= 5 && allComboText.includes(tail)) return true;
        return n.split(/[\s,-]+/).some(w => w.length >= 5 && (nameWordCounts.get(w) || 0) <= 1 &&
            new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(allComboText));
    };
    // Does the combo fetch this card from the Deck ("search for Foxy Tune", "summon Sharakusai from the deck")?
    // Then it must not start in the hand, or the search has nothing to find
    const isFetchedInCombo = (c) => {
        const n = c.name.toLowerCase();
        const variants = [n, n.includes(' - ') ? n.split(' - ').pop() : null,
            ...n.split(/[\s,-]+/).filter(w => w.length >= 5 && (nameWordCounts.get(w) || 0) <= 1)].filter(Boolean);
        for (const v of variants) {
            const re = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            for (const hit of allComboText.matchAll(re)) {
                const before = allComboText.slice(Math.max(0, hit.index - 40), hit.index);
                const after = allComboText.slice(hit.index + hit[0].length, hit.index + hit[0].length + 30);
                if (/(?:search(?:es|ing)?|add(?:s|ing)?|send(?:s|ing)?|mill(?:s|ing)?|dump(?:s|ing)?|excavat\w*|plac(?:e|es|ing)|set(?:s|ting)?)\s+(?:for\s+)?(?:a\s+|the\s+|another\s+|\w+\s+)?$/i.test(before) ||
                    /^[\w\s'-]{0,12}from (?:the |your )?deck\b/i.test(after)) return true;
            }
        }
        return false;
    };
    // Each described cost gets its own card: "discarding a Level 5+ DARK" then "discard another DARK" needs two
    const reservedForCosts = new Set();
    for (const req of extraHandRequests) {
        if (req.kind === 'copy') {
            // Both copies start in hand
            let copies = [...cardsMap.values()].filter(c => c.code === req.card.code && c.zone === 'zone-hand').length;
            while (copies < 2 && handCount() < 6) {
                addToHand(req.card, 'hand');
                copies++;
            }
            continue;
        }
        // A described cost: a matching card no step names (so it isn't a combo piece), from the decklist if it has one
        const spec = req.spec;
        const matchesSpec = (c) => cardMatchesSpec(c.data, c.name, spec);
        const unnamedInCombo = (c) => !isNamedInCombo(c);
        const usable = [...cardsMap.values()].filter(c => c.zone === 'zone-hand' && matchesSpec(c) && unnamedInCombo(c) && !reservedForCosts.has(c.id));
        for (const c of usable.slice(0, req.wanted)) reservedForCosts.add(c.id);
        let have = Math.min(usable.length, req.wanted);
        while (have < req.wanted && handCount() < 6) {
            const fromDeck = [...cardsMap.values()].find(c => c.zone === 'zone-deck' && matchesSpec(c) && unnamedInCombo(c));
            if (fromDeck) {
                fromDeck.zone = 'zone-hand';
                reservedForCosts.add(fromDeck.id);
            } else {
                const code = findCardMatching(spec, [...new Set([...cardsMap.values()].map(c => c.code))]);
                const costCard = code ? await resolveCardAsync(code) : null;
                if (!costCard) break;
                reservedForCosts.add(addToHand(costCard, 'hand_cost'));
            }
            have++;
        }
    }

    // Fill remaining opening hand slots up to 5 cards using distinct archetype monsters (avoiding generic hand traps and duplicate names)
    // ("With only A and B in your hand" is the whole hand: empty-hand lines like Infernity need nothing else in it)
    const onlyTheseInHand = /^\s*with only\b[^.;]*\bin your hand\b/i.test(parsedCombo.steps[0]?.text || '');
    let inHand = onlyTheseInHand ? 5 : [...cardsMap.values()].filter(c => c.zone === 'zone-hand').length;
    const handTrapCodes = new Set([14558127, 23434538, 97268402, 94145021, 27204311, 59438930, 73642296, 10045474, 24224830]);
    const cleanArchWord = (archetype || '')
        .replace(/\s+(?:Deck Analysis|Archetype Breakdown|Archetype Deep Dive|Strategy Guide|Guide|Analysis)\.html$/i, '')
        .replace(/\.html$/i, '')
        .trim()
        .toLowerCase();

    // Filler order: cards the combo fetches from the Deck go last, so a later search still finds them
    const fillerRanks = new Map();
    const fillerRank = (c) => {
        if (!fillerRanks.has(c.code)) fillerRanks.set(c.code, isFetchedInCombo(c) ? 1 : 0);
        return fillerRanks.get(c.code);
    };
    const namedLast = (a, b) => fillerRank(a) - fillerRank(b);
    const deckMonsters = [...cardsMap.values()].filter(c => c.zone === 'zone-deck' && (c.data.type & 0x1) && !handTrapCodes.has(c.code)).sort(namedLast);
    const deckSpells = [...cardsMap.values()].filter(c => c.zone === 'zone-deck' && (c.data.type & 0x2) && !handTrapCodes.has(c.code)).sort(namedLast);

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
        if (fillerRank(a) !== fillerRank(b)) return namedLast(a, b);
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
        const dummyCode = 32452818; // Beaver Warrior, a vanilla Level 4 Normal Monster
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
            // A summon names its own monster: "Link Summon Balelynx using Fire" is about Balelynx, even when the
            // step's picture (and so its featured card) is Salamangreat of Fire
            const summonObject = /^(?:then,?\s+)?(?:(?:special|fusion|synchro|xyz|link|ritual)\s+)?summon\s+(.+?)(?:\s+(?:using|with|from|to|by|in|as|on)\b|[.,;:(]|$)/i.exec(step.text);
            // A full name right after the verb, commas included ("Synchro Summon Oboro-Guruma, the Wheeled Mayakashi using ...")
            const afterVerb = /^(?:then,?\s+)?(?:(?:special|fusion|synchro|xyz|link|ritual)\s+)?summon\s+(?:a\s+|another\s+|the\s+)?(.*)$/i.exec(step.text);
            if (afterVerb) {
                const rest = afterVerb[1].toLowerCase();
                matchedCard = [...cardsMap.values()].sort((a, b) => b.name.length - a.name.length)
                    .find(c => rest.startsWith(c.name.toLowerCase())) || null;
            }
            if (!matchedCard && summonObject) {
                const obj = summonObject[1].toLowerCase().replace(/^(?:a\s+(?:second\s+)?|another\s+|the\s+)/, '');
                matchedCard = [...cardsMap.values()].sort((a, b) => b.name.length - a.name.length)
                    .find(c => c.name.toLowerCase() === obj || (obj.length >= 4 && new RegExp(`\\b${obj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(c.name.toLowerCase()))) || null;
            }
            if (!matchedCard && step.featuredCard) {
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

    // A going-second line ("Going Second: ...", "while only your opponent controls a monster") starts with one vanilla
    // monster on the opponent's field, so conditions like Tenma's "if only your opponent controls a monster" can be met
    const comboText = [parsedCombo.comboTitle, ...parsedCombo.steps.map(s => s.text)].join(' ');
    // "Tribute 3 of your opponent's monsters" (Soul Crossing): the opponent needs that many monsters
    const countWords = { two: 2, three: 3, four: 4, five: 5 };
    let opponentMonsterCount = 0;
    for (const cm of comboText.matchAll(/\b(\d|two|three|four|five)\s+(?:of\s+)?(?:your\s+)?opponent'?s\s+monsters\b|\byour opponent controls\s+(\d|two|three|four|five)\s+monsters\b/gi)) {
        const n = (cm[1] || cm[2]).toLowerCase();
        opponentMonsterCount = Math.max(opponentMonsterCount, countWords[n] || Number(n) || 0);
    }
    const goingSecond = opponentMonsterCount > 0 || /\bgoing second\b|\bonly your opponent controls a monster\b/i.test(comboText);
    // A line that looks at or reveals your opponent's Deck ("Drone's effect places the top 3 cards of your opponent's
    // Deck ...", SPYRAL's "declaring Monster") needs them to have one: 10 vanilla monsters
    const opponentDeck = /\bopponent'?s\s+(?:top\s+card|deck)\b|\btop\s+(?:card|\d+\s+cards)\s+of\s+(?:your\s+)?opponent'?s\b/i.test(
        parsedCombo.steps.map(s => s.text).join(' '));
    return {
        title: parsedCombo.comboTitle,
        cards: [...cardsMap.values()],
        steps: decomposedSteps,
        // Beaver Warrior, vanilla Level 4
        ...(goingSecond ? { opponentMonsters: Array(Math.max(1, opponentMonsterCount)).fill(32452818), goingSecond: true } : {}),
        ...(opponentDeck ? { opponentDeck: Array(10).fill(32452818) } : {})
    };
}

export async function runHtmlAuditor() {
    console.log('='.repeat(70));
    console.log(' ArcheType Nexus - HTML Combo Engine Rule Auditor');
    console.log('='.repeat(70));
    console.log(`Scanning written combo sections in ${htmlFiles.length} HTML page(s)...`);
    console.log(`Mode: ${strictMode ? 'strict' : 'lenient (prose the engine cannot simulate is recorded, not flagged)'}, ${searchAlternatives ? 'alternative choices searched before flagging' : 'first attempt only'}\n`);

    const violations = [];
    const unverifiableCombos = [];
    const partialCombos = [];
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
            const replayOptions = { lenient: !strictMode };
            replayResult = searchAlternatives
                ? await runComboReplaySearch(comboObj, replayOptions)
                : await runComboReplay(comboObj, replayOptions);
        } catch (err) {
            replayResult = {
                status: 'CRASHED',
                verdict: 'NEEDS_REVIEW',
                legal: false,
                stepsCompleted: 0,
                totalSteps: combo.steps.length,
                errors: [err.message]
            };
        }
        const duration = Date.now() - startTime;

        // Sub-step numbers (the engine's atomic steps) back to the written HTML step they came from
        const htmlStepOf = (subStepNum) => comboObj?.steps?.[subStepNum - 1]?.stepNum || subStepNum;
        const unverifiedSteps = (replayResult.unverifiedSteps || []).map(u => ({
            ...u,
            htmlStep: htmlStepOf(u.step),
            reasonText: UNSIMULATED_REASONS[u.reason] || u.reason
        }));
        const alternativeChoices = replayResult.alternativeChoices || [];

        if (replayResult.status === 'VERIFIED_LEGAL') {
            legalCombos.push({ file, archetype, title: combo.comboTitle, steps: combo.steps.length, duration, alternativeChoices });
            console.log(`\x1b[32mLEGAL\x1b[0m (${combo.steps.length}/${combo.steps.length} HTML steps, ${replayResult.stepsCompleted} engine actions, ${duration}ms)${alternativeChoices.length ? ` after ${alternativeChoices.length} alternative choice(s)` : ''}`);
        } else if (replayResult.status === 'VERIFIED_PARTIAL') {
            partialCombos.push({ file, archetype, title: combo.comboTitle, steps: combo.steps.length, duration, unverifiedSteps, alternativeChoices });
            console.log(`\x1b[36mPARTIALLY VERIFIED\x1b[0m (no illegal play found; ${unverifiedSteps.filter(u => u.taints).length} step(s) could not be simulated)`);
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
            const verdict = replayResult.verdict || 'NEEDS_REVIEW';
            const blockingSkip = replayResult.blockingSkip
                ? unverifiedSteps.find(u => u.step === replayResult.blockingSkip.step) || null
                : null;

            const violationEntry = {
                file,
                archetype,
                comboTitle: combo.comboTitle,
                verdict,
                failureKind: replayResult.failureKind || null,
                failedStepNumber: failedStepNum,
                totalSteps: combo.steps.length,
                writtenTitle: stepData?.stepTitle || '',
                writtenText: stepData?.text || '',
                engineError: blockingSkip
                    ? `${firstError} Not treated as illegal: it follows Step ${blockingSkip.htmlStep}, which the engine could not simulate (${blockingSkip.reasonText}).`
                    : firstError,
                stepsCompletedBeforeFailure: replayResult.stepsCompleted,
                failedSubStepIdx,
                unverifiedSteps,
                alternativeChoices,
                log: replayResult.log || [],
                offeredActions: replayResult.offeredActions || null,
                comboData: comboObj,
                fieldSnapshot: replayResult.fieldSnapshot || null
            };

            if (verdict === 'UNVERIFIABLE') {
                unverifiableCombos.push(violationEntry);
                console.log(`\x1b[33mUNVERIFIABLE AT STEP ${failedStepNum}\x1b[0m`);
            } else {
                violations.push(violationEntry);
                console.log(`\x1b[31m${verdict === 'LIKELY_ILLEGAL' ? 'LIKELY ILLEGAL' : 'NEEDS REVIEW'} AT STEP ${failedStepNum}\x1b[0m`);
            }
            console.log(`     Issue: ${violationEntry.engineError}`);
        }
    }
}

const likelyIllegal = violations.filter(v => v.verdict === 'LIKELY_ILLEGAL');
const needsReview = violations.filter(v => v.verdict !== 'LIKELY_ILLEGAL');

console.log('\n' + '='.repeat(70));
console.log(' HTML Combo Audit Summary');
console.log('='.repeat(70));
console.log(`Pages Evaluated:       ${totalPagesScanned}`);
console.log(`Combos Audited:        ${totalCombosScanned}`);
console.log(`Steps Audited:         ${totalStepsScanned}`);
console.log(`100% Legal Confirmed:  ${legalCombos.length}`);
console.log(`Partially Verified:    ${partialCombos.length}  (no illegal play found; some prose steps not simulated)`);
console.log(`Unofficial Skipped:    ${skippedCombos.length}`);
console.log(`Likely Illegal:        ${likelyIllegal.length}`);
console.log(`Needs Review:          ${needsReview.length}`);
console.log(`Could Not Verify:      ${unverifiableCombos.length}`);
console.log('');

// Save JSON Report (violations = likely illegal + needs review; unverifiable combos are listed separately)
const jsonReport = {
    timestamp: new Date().toISOString(),
    mode: { strict: strictMode, searchAlternatives },
    totalPagesScanned,
    totalCombosScanned,
    totalStepsScanned,
    summary: {
        legal: legalCombos.length,
        partial: partialCombos.length,
        unofficial: skippedCombos.length,
        violations: violations.length,
        likelyIllegal: likelyIllegal.length,
        needsReview: needsReview.length,
        unverifiable: unverifiableCombos.length
    },
    violations,
    unverifiableCombos,
    partialCombos,
    legalCombos,
    skippedCombos
};
// comboData carries card records with BigInt fields (race): serialize them as strings, as build-engine-audit-report does
fs.writeFileSync(REPORT_FILE, JSON.stringify(jsonReport, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
console.log(`Detailed JSON report saved to: ${REPORT_FILE}`);

// Save Markdown Checklist
const mdViolation = (v) => {
    let md = `### [ ] [${v.archetype}](${v.file}) - ${v.comboTitle}\n`;
    md += `- **File**: \`${v.file}\`\n`;
    md += `- **Failed at**: Step ${v.failedStepNumber} of ${v.totalSteps}\n`;
    if (v.writtenTitle) md += `- **Step Title**: "${v.writtenTitle}"\n`;
    md += `- **Written Step**: *"${v.writtenText}"*\n`;
    md += `- **Engine Violation**: \`${v.engineError}\`\n`;
    const skipped = (v.unverifiedSteps || []).filter(u => u.taints);
    if (skipped.length > 0) {
        md += `- **Not simulated**: ${skipped.map(u => `Step ${u.htmlStep} (${u.reasonText})`).join('; ')}\n`;
    }
    if (v.alternativeChoices && v.alternativeChoices.length > 0) {
        md += `- **Alternative choices tried and kept**: ${v.alternativeChoices.map(a => `${a.chose} instead of ${a.insteadOf}`).join('; ')}\n`;
    }
    if (v.log && v.log.length > 0) {
        md += `- **Prior Legal Plays**:\n`;
        for (const l of v.log) {
            md += `  - \`${l}\`\n`;
        }
    }
    return `${md}\n`;
};

let mdContent = `# Headless Yu-Gi-Oh! OCGCore HTML Combo Audit\n\n`;
mdContent += `Generated: ${new Date().toUTCString()}\n\n`;
mdContent += `### Summary\n`;
mdContent += `- **Pages Audited**: ${totalPagesScanned}\n`;
mdContent += `- **Total Combos Audited**: ${totalCombosScanned}\n`;
mdContent += `- **Total Steps Audited**: ${totalStepsScanned}\n`;
mdContent += `- **100% Legal Confirmed**: ${legalCombos.length}\n`;
mdContent += `- **Partially Verified** (no illegal play found; some prose steps could not be simulated): ${partialCombos.length}\n`;
mdContent += `- **Likely Illegal** (the card was in place and the engine refused the action): ${likelyIllegal.length}\n`;
mdContent += `- **Needs Review** (a card the step uses never reached the hand/field, or the harness crashed): ${needsReview.length}\n`;
mdContent += `- **Could Not Verify** (stopped after a step the engine could not simulate): ${unverifiableCombos.length}\n`;
mdContent += `- **Unofficial / Custom Skipped**: ${skippedCombos.length}\n\n`;

if (likelyIllegal.length > 0) {
    mdContent += `## Likely Illegal Plays\n\n`;
    for (const v of likelyIllegal) mdContent += mdViolation(v);
}
if (needsReview.length > 0) {
    mdContent += `## Needs Review\n\n`;
    mdContent += `The engine refused a step because a card it uses was never brought to the hand or field by an earlier step. Either the write-up skips a step (a search, a draw) or the harness picked a different card than the writer meant.\n\n`;
    for (const v of needsReview) mdContent += mdViolation(v);
}
if (unverifiableCombos.length > 0) {
    mdContent += `## Could Not Verify\n\n`;
    mdContent += `Not evidence of an illegal play: the replay stopped after a step the engine could not simulate from the prose (examples, opponent-dependent steps, unidentified cards), so later failures may just reflect that step.\n\n`;
    for (const v of unverifiableCombos) {
        mdContent += `- [ ] [${v.archetype}](${v.file}) - ${v.comboTitle}: stopped at Step ${v.failedStepNumber} of ${v.totalSteps}. ${(v.unverifiedSteps || []).filter(u => u.taints).map(u => `Step ${u.htmlStep}: ${u.reasonText}`).join('; ') || v.engineError}\n`;
    }
    mdContent += `\n`;
}
if (partialCombos.length > 0) {
    mdContent += `## Partially Verified\n\n`;
    mdContent += `Every step the engine could simulate was legal. The steps listed were not simulated.\n\n`;
    for (const p of partialCombos) {
        mdContent += `- [${p.archetype}](${p.file}) - ${p.title}: ${p.unverifiedSteps.filter(u => u.taints).map(u => `Step ${u.htmlStep} (${u.reasonText})`).join('; ')}\n`;
    }
    mdContent += `\n`;
}
if (violations.length === 0 && unverifiableCombos.length === 0) {
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
