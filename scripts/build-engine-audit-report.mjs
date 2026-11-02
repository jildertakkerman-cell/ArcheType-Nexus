import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { parseHtmlCombos, buildComboFromHtml } from './verify-html-combos-engine.mjs';
import { runComboReplay } from './lib/combo-runner.mjs';
import { getCardByCode } from './lib/card-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMBOS_DIR = path.resolve(__dirname, '../assets/data/combos');
const PAGES_DIR = path.resolve(__dirname, '../pages');
const CDB_PATH = path.resolve(__dirname, '../assets/data/cards.cdb');

const HTML_REPORT_FILE = path.resolve(__dirname, 'engine-illegal-plays-report.json');
const CURATED_REPORT_FILE = path.resolve(__dirname, 'engine-verification-report.json');
// v2 replay drafts (assets/data/combos/v2-drafts), checked by verify-combo-jsons.mjs --dir=... --v2-only
const DRAFTS_REPORT_FILE = path.resolve(__dirname, 'engine-verification-v2-drafts-report.json');
const OUTPUT_FILE = path.resolve(COMBOS_DIR, 'engine-audit-report.json');
const BANLIST_FILE = path.resolve(__dirname, '../assets/data/banlist.json');
const ReplayV2 = createRequire(import.meta.url)('../assets/js/replay-v2.js');

console.log('='.repeat(70));
console.log(' ArcheType Nexus - Building Unified Combo Audit Report for Admin');
console.log('='.repeat(70));

const db = new DatabaseSync(CDB_PATH);
const cardNameStmt = db.prepare('SELECT name FROM texts WHERE id = ?');
function lookupName(code) {
    if (!code) return null;
    try {
        const row = cardNameStmt.get(Number(code));
        return row?.name || null;
    } catch {
        return null;
    }
}

function enrichLogString(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/\bcode\s+(\d{5,8})\b/gi, (match, code) => {
            const name = lookupName(code);
            return name ? `${name} (${code})` : match;
        })
        .replace(/\bCard Code\s+(\d{5,8})\b/gi, (match, code) => {
            const name = lookupName(code);
            return name ? `${name} (${code})` : match;
        });
}

function sanitizeComboData(cd) {
    if (!cd) return null;
    // A v2 replay combo keeps its own shape (type/player/from/controller...), which the DuelSimulator turns into
    // player 0's board; only the recorded duel (seed, decks, responses) is left out
    if (cd.formatVersion >= 2) {
        const { duel, decks, ...rest } = cd;
        return rest;
    }
    return {
        title: cd.title || '',
        description: cd.description || '',
        cards: (cd.cards || []).map(c => ({
            id: c.id,
            name: c.name,
            code: c.code,
            type: c.type,
            zone: c.zone,
            isDummy: Boolean(c.isDummy),
            isToken: Boolean(c.isToken)
        })),
        steps: (cd.steps || []).map(s => {
            const stepObj = {
                stepNum: s.stepNum,
                text: s.text || ''
            };
            if (s.stepTitle) stepObj.stepTitle = s.stepTitle;
            if (s.featuredCard) stepObj.featuredCard = s.featuredCard;
            if (s.card) stepObj.card = s.card;
            if (s.to) stepObj.to = s.to;
            if (s.actions && s.actions.length > 0) stepObj.actions = s.actions;
            return stepObj;
        })
    };
}

const existingAuditMap = new Map();
let existingReport = null;
if (fs.existsSync(OUTPUT_FILE)) {
    try {
        existingReport = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        (existingReport.items || []).forEach(it => {
            if (it && it.id) existingAuditMap.set(it.id, it);
        });
    } catch {}
}

const auditItems = [];
const readReport = (file) => {
    if (!fs.existsSync(file)) return null;
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
        console.warn(`Warning: Failed to parse ${path.basename(file)}:`, err.message);
        return null;
    }
};
// How a v2 combo was checked: the export's recorded duel replayed exactly ('recorded'), or step by step ('steps'),
// with what happened to the recorded duel and the answers the export didn't record. `recorded`: 'exact' (it
// replayed), 'diverged' (today's scripts refused a recorded answer), 'old-seed' (a one-part seed from EDOPro before
// 2021, which today's core can't replay) or 'none' (exported before the converter recorded the duel)
function replayInfo(item) {
    if (!(item.formatVersion >= 2)) return null;
    const rec = item.comboData?.duel?.replay;
    const recorded = item.mode === 'recorded' ? 'exact'
        : item.recordedFailure ? 'diverged'
            : Array.isArray(rec?.seed) && rec.seed.length !== 4 ? 'old-seed'
                : 'none';
    return {
        mode: item.mode || 'steps',
        recorded,
        recordedFailure: item.recordedFailure || null,
        responsesUsed: item.responsesUsed ?? null,
        responsesTotal: item.responsesTotal ?? null,
        guesses: item.guesses || [],
        unknownCards: item.unknownCards || []
    };
}
// Totals per source, for the overview at the top of the admin audit
const overview = {};

// 1. Process Curated JSON Combos
if (fs.existsSync(CURATED_REPORT_FILE)) {
    try {
        const curatedRaw = JSON.parse(fs.readFileSync(CURATED_REPORT_FILE, 'utf8'));
        const all = curatedRaw.results || [];
        const v2 = all.filter(r => r.formatVersion >= 2);
        overview.curated = {
            tested: all.length,
            legal: all.filter(r => r.legal).length,
            v2: { tested: v2.length, legal: v2.filter(r => r.legal).length, recorded: v2.filter(r => r.legal && r.mode === 'recorded').length }
        };
        const issues = all.filter(r => !r.legal);
        console.log(`Processing ${issues.length} flagged curated JSON combo(s)...`);

        for (const item of issues) {
            let comboData = item.comboData || null;
            if (!comboData && item.file) {
                const filePath = path.join(COMBOS_DIR, item.file);
                if (fs.existsSync(filePath)) {
                    try {
                        const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
                        const fileJson = JSON.parse(raw);
                        comboData = fileJson.combos?.[item.comboKey] || null;
                    } catch (e) {
                        console.error(`Error reading ${item.file}:`, e.message);
                    }
                }
            }

            const cleanArch = (item.archetype || item.file.replace(/-combos\.json$/i, ''))
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());

            const failedStepNum = (item.stepsCompleted || 0) + 1;
            const stepText = comboData?.steps?.[item.stepsCompleted]?.text || item.errors?.[0] || 'Unknown step';

            auditItems.push({
                id: `curated_${item.file}_${item.comboKey}`,
                source: 'curated',
                sourceLabel: 'Curated JSON',
                archetype: cleanArch,
                archetypeSlug: item.archetype?.toLowerCase() || item.file.replace(/-combos\.json$/i, '').toLowerCase(),
                comboKey: item.comboKey,
                comboTitle: item.title || item.comboKey,
                file: item.file,
                failedStepNumber: failedStepNum,
                totalSteps: item.totalSteps || comboData?.steps?.length || 0,
                writtenTitle: item.title || '',
                writtenText: stepText,
                engineError: item.errors?.[0] || `Step ${failedStepNum} could not be legally verified by OCGCore.`,
                stepsCompletedBeforeFailure: item.stepsCompleted || 0,
                log: (item.log || []).map(enrichLogString),
                offeredActions: item.offeredActions || null,
                formatVersion: item.formatVersion || 1,
                replay: replayInfo(item),
                comboData: sanitizeComboData(comboData),
                fieldSnapshot: item.fieldSnapshot || null
            });
        }
    } catch (err) {
        console.warn('Warning: Failed to parse curated report:', err.message);
    }
}

// 1b. v2 replay drafts: every result goes in the overview, the ones that fail in the queue too
const draftsRaw = readReport(DRAFTS_REPORT_FILE);
if (draftsRaw) {
    const results = (draftsRaw.results || []).filter(r => r.formatVersion >= 2);
    const slugOf = (file) => file.replace(/-combos\.json$/i, '');
    overview.drafts = {
        tested: results.length,
        legal: results.filter(r => r.legal).length,
        recorded: results.filter(r => r.legal && r.mode === 'recorded').length,
        results: results.map(r => ({
            id: r.legal ? null : `draft_${r.file}_${r.comboKey}`,
            slug: slugOf(r.file),
            comboKey: r.comboKey,
            title: r.title || r.comboKey,
            legal: Boolean(r.legal),
            mode: r.mode || 'steps',
            recorded: replayInfo(r).recorded,
            recordedFailure: r.recordedFailure || null,
            stepsCompleted: r.stepsCompleted || 0,
            totalSteps: r.totalSteps || 0,
            error: r.legal ? null : (r.errors?.[0] || null)
        }))
    };
    const issues = results.filter(r => !r.legal);
    console.log(`Processing ${issues.length} flagged v2 replay draft(s) of ${results.length}...`);
    for (const item of issues) {
        const slug = slugOf(item.file);
        const comboData = item.comboData || null;
        const failedStepNum = (item.stepsCompleted || 0) + 1;
        auditItems.push({
            id: `draft_${item.file}_${item.comboKey}`,
            source: 'drafts',
            sourceLabel: 'Replay Draft (v2)',
            archetype: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            archetypeSlug: slug,
            comboKey: item.comboKey,
            comboTitle: item.title || item.comboKey,
            file: `v2-drafts/${item.file}`,
            failedStepNumber: failedStepNum,
            totalSteps: item.totalSteps || comboData?.steps?.length || 0,
            writtenTitle: item.title || '',
            writtenText: comboData?.steps?.[item.stepsCompleted]?.text || item.errors?.[0] || 'Unknown step',
            engineError: item.errors?.[0] || `Step ${failedStepNum} could not be legally verified by OCGCore.`,
            stepsCompletedBeforeFailure: item.stepsCompleted || 0,
            log: (item.log || []).map(enrichLogString),
            offeredActions: item.offeredActions || null,
            formatVersion: item.formatVersion,
            replay: replayInfo(item),
            comboData: sanitizeComboData(comboData),
            fieldSnapshot: item.fieldSnapshot || null
        });
    }
}

// 1c. Legacy lines: live curated combos that use a card Forbidden in the TCG. They stay up as an archive, and the
// combo selector marks them by the same rule (ComboSelector.forbiddenCardsIn in combo-system.js, keep the two in
// step): the combo player's cards that move in a step of the window the page plays, plus a step's featuredCard.
// Names are compared without case or punctuation ("Cupsy★Yummy Way" vs the banlist's "Cupsy☆Yummy Way").
const banlistKey = name => String(name || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function forbiddenCardsIn(combo, forbiddenKeys) {
    const cards = new Map((combo.cards || []).map(c => [c.id, c]));
    const isOwn = c => c && !c.isOpponentCard && c.player !== 1 && !/^p2-/.test(c.id || '');
    const found = [];
    const check = name => {
        if (name && forbiddenKeys.has(banlistKey(name)) && !found.includes(name)) found.push(name);
    };
    (combo.steps || []).forEach(step => {
        [step.card, ...(step.actions || []).map(a => a && a.card)].forEach(id => {
            const card = cards.get(id);
            if (isOwn(card)) check(card.name);
        });
        if (step.player !== 1) check(step.featuredCard);
    });
    return found;
}
const banlist = readReport(BANLIST_FILE);
if (banlist?.tcg?.forbidden) {
    // Like card-loader.js, switch to a scheduled list once its date has passed
    const next = banlist.nextBanlist;
    const useNext = next?.tcg?.forbidden && next.effectiveDate && new Date(next.effectiveDate) <= new Date();
    const forbiddenKeys = new Set((useNext ? next.tcg : banlist.tcg).forbidden.map(banlistKey));
    const engine = new Map((readReport(CURATED_REPORT_FILE)?.results || []).map(r => [`${r.file}:${r.comboKey}`, r]));
    const results = [];
    let lines = 0;
    for (const file of fs.readdirSync(COMBOS_DIR).filter(f => f.endsWith('-combos.json')).sort()) {
        let combos;
        try {
            combos = JSON.parse(fs.readFileSync(path.join(COMBOS_DIR, file), 'utf8').replace(/^\uFEFF/, '')).combos || {};
        } catch {
            continue;
        }
        const slug = file.replace(/-combos\.json$/i, '');
        for (const [comboKey, combo] of Object.entries(combos)) {
            lines++;
            const cards = forbiddenCardsIn(ReplayV2.prepareForSimulator(combo), forbiddenKeys);
            if (!cards.length) continue;
            const r = engine.get(`${file}:${comboKey}`);
            results.push({
                id: r && !r.legal ? `curated_${file}_${comboKey}` : null,
                slug,
                archetype: r?.archetype
                    ? r.archetype.replace(/^\w/, c => c.toUpperCase())
                    : slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                comboKey,
                title: combo.title || comboKey,
                cards,
                legal: r ? Boolean(r.legal) : null
            });
            const item = auditItems.find(it => it.source === 'curated' && it.file === file && it.comboKey === comboKey);
            if (item) item.legacy = cards;
        }
    }
    overview.legacy = {
        lines,
        count: results.length,
        banlistDate: (useNext ? next.effectiveDate : banlist.tcg.effectiveDate) || null,
        results
    };
    console.log(`Legacy lines (TCG Forbidden cards): ${results.length} of ${lines} curated lines`);
}

// 2. Process HTML Written Guide Combos
if (fs.existsSync(HTML_REPORT_FILE)) {
    try {
        const htmlRaw = JSON.parse(fs.readFileSync(HTML_REPORT_FILE, 'utf8'));
        const hs = htmlRaw.summary || {};
        overview.html = {
            tested: htmlRaw.totalCombosScanned || 0,
            legal: hs.legal || 0,
            partial: hs.partial || 0,
            likelyIllegal: hs.likelyIllegal || 0,
            needsReview: hs.needsReview || 0,
            unverifiable: hs.unverifiable || 0
        };
        // Likely illegal / needs review first, then combos the engine could not verify (each carries its verdict)
        const violations = [...(htmlRaw.violations || []), ...(htmlRaw.unverifiableCombos || [])];
        console.log(`Processing ${violations.length} flagged HTML walkthrough combo(s)...`);

        for (let i = 0; i < violations.length; i++) {
            const v = violations[i];
            const cleanArch = (v.archetype || v.file.replace(/\.html$/i, ''))
                .replace(/\s+(?:Deck Analysis|Archetype Breakdown|Archetype Deep Dive|Strategy Guide|Guide|Analysis)$/i, '');

            const slug = cleanArch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const htmlId = `html_${slug}_${i}_${(v.comboTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

            let comboData = v.comboData || null;

            if (!comboData && existingAuditMap.has(htmlId)) {
                const ex = existingAuditMap.get(htmlId);
                comboData = ex.comboData;
                if (!v.fieldSnapshot && ex.fieldSnapshot) v.fieldSnapshot = ex.fieldSnapshot;
                if (!v.offeredActions && ex.offeredActions) v.offeredActions = ex.offeredActions;
                if ((!v.log || !v.log.length) && ex.log) v.log = ex.log;
            }

            // If comboData is not stored in cache or violation record, build it on-demand
            if (!comboData && v.file) {
                const fullPath = path.join(PAGES_DIR, v.file);
                if (fs.existsSync(fullPath)) {
                    try {
                        const parsed = parseHtmlCombos(fullPath);
                        const matchedCombo = (parsed?.combos || []).find(c => c.comboTitle === v.comboTitle)
                            || parsed?.combos?.[0];
                        if (matchedCombo) {
                            comboData = await buildComboFromHtml(matchedCombo, v.archetype);
                        }
                    } catch (e) {
                        // ignore build error fallback
                    }
                }
            }

            if (comboData && !v.fieldSnapshot) {
                try {
                    const replay = await runComboReplay(comboData);
                    if (!v.fieldSnapshot && replay.fieldSnapshot) {
                        v.fieldSnapshot = replay.fieldSnapshot;
                    }
                    if (!v.offeredActions && replay.offeredActions) {
                        v.offeredActions = replay.offeredActions;
                    }
                    if ((!v.log || !v.log.length) && replay.log && replay.log.length) {
                        v.log = replay.log;
                    }
                } catch {
                    // ignore replay error
                }
            }

            auditItems.push({
                id: `html_${slug}_${i}_${(v.comboTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                source: 'html',
                sourceLabel: 'HTML Guide Walkthrough',
                archetype: cleanArch,
                archetypeSlug: slug,
                comboKey: `combo_${i + 1}`,
                comboTitle: v.comboTitle || `Combo ${i + 1}`,
                file: v.file,
                verdict: v.verdict || null,
                failureKind: v.failureKind || null,
                unverifiedSteps: v.unverifiedSteps || [],
                alternativeChoices: v.alternativeChoices || [],
                failedStepNumber: v.failedStepNumber || 1,
                totalSteps: v.totalSteps || comboData?.steps?.length || 1,
                writtenTitle: v.writtenTitle || '',
                writtenText: v.writtenText || '',
                engineError: v.engineError || 'Step could not be completed legally under duel engine rules.',
                stepsCompletedBeforeFailure: v.stepsCompletedBeforeFailure || 0,
                failedSubStepIdx: v.failedSubStepIdx ?? null,
                log: (v.log || []).map(enrichLogString),
                offeredActions: v.offeredActions || null,
                comboData: sanitizeComboData(comboData),
                fieldSnapshot: v.fieldSnapshot || null
            });

            if ((i + 1) % 50 === 0 || i === violations.length - 1) {
                process.stdout.write(`  -> Built ${i + 1}/${violations.length} HTML combos\r`);
            }
        }
        console.log('');
    } catch (err) {
        console.warn('Warning: Failed to parse HTML report:', err.message);
    }
}

// Summary Statistics
const curatedCount = auditItems.filter(i => i.source === 'curated').length;
const htmlCount = auditItems.filter(i => i.source === 'html').length;
const draftsCount = auditItems.filter(i => i.source === 'drafts').length;
const byVerdict = {};
for (const it of auditItems) {
    const v = it.verdict || 'UNCLASSIFIED';
    byVerdict[v] = (byVerdict[v] || 0) + 1;
}

const summary = {
    totalFlagged: auditItems.length,
    curatedCount,
    htmlCount,
    draftsCount,
    byVerdict
};
const serialize = obj => JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
const unchanged = existingReport
    && serialize({ summary: existingReport.summary, overview: existingReport.overview, items: existingReport.items }) === serialize({ summary, overview, items: auditItems });

const reportData = {
    timestamp: (unchanged && existingReport.timestamp) ? existingReport.timestamp : new Date().toISOString(),
    summary,
    overview,
    items: auditItems
};

fs.writeFileSync(OUTPUT_FILE, serialize(reportData), 'utf8');
console.log(`\nSuccess! Unified audit report with ${auditItems.length} combos saved to:`);
console.log(`  ${OUTPUT_FILE}`);
console.log(`  (${curatedCount} Curated JSON combos, ${htmlCount} HTML combos, ${draftsCount} v2 replay drafts)\n`);
