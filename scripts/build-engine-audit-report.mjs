import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
const OUTPUT_FILE = path.resolve(COMBOS_DIR, 'engine-audit-report.json');

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
            if (s.actions) stepObj.actions = s.actions;
            return stepObj;
        })
    };
}

const auditItems = [];

// 1. Process Curated JSON Combos
if (fs.existsSync(CURATED_REPORT_FILE)) {
    try {
        const curatedRaw = JSON.parse(fs.readFileSync(CURATED_REPORT_FILE, 'utf8'));
        const issues = (curatedRaw.results || []).filter(r => !r.legal);
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
                comboData: sanitizeComboData(comboData),
                fieldSnapshot: item.fieldSnapshot || null
            });
        }
    } catch (err) {
        console.warn('Warning: Failed to parse curated report:', err.message);
    }
}

// 2. Process HTML Written Guide Combos
if (fs.existsSync(HTML_REPORT_FILE)) {
    try {
        const htmlRaw = JSON.parse(fs.readFileSync(HTML_REPORT_FILE, 'utf8'));
        const violations = htmlRaw.violations || [];
        console.log(`Processing ${violations.length} flagged HTML walkthrough combo(s)...`);

        for (let i = 0; i < violations.length; i++) {
            const v = violations[i];
            let comboData = v.comboData || null;

            // If comboData is not stored in the violation record, build it on-demand
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

            if (comboData && (!comboData.steps?.[0]?.actions || !v.fieldSnapshot)) {
                try {
                    const replay = await runComboReplay(comboData);
                    if (!v.fieldSnapshot && replay.fieldSnapshot) {
                        v.fieldSnapshot = replay.fieldSnapshot;
                    }
                } catch {
                    // ignore replay error
                }
            }

            const cleanArch = (v.archetype || v.file.replace(/\.html$/i, ''))
                .replace(/\s+(?:Deck Analysis|Archetype Breakdown|Archetype Deep Dive|Strategy Guide|Guide|Analysis)$/i, '');

            const slug = cleanArch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            auditItems.push({
                id: `html_${slug}_${i}_${(v.comboTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                source: 'html',
                sourceLabel: 'HTML Guide Walkthrough',
                archetype: cleanArch,
                archetypeSlug: slug,
                comboKey: `combo_${i + 1}`,
                comboTitle: v.comboTitle || `Combo ${i + 1}`,
                file: v.file,
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

const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
        totalFlagged: auditItems.length,
        curatedCount,
        htmlCount
    },
    items: auditItems
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(reportData, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2), 'utf8');
console.log(`\nSuccess! Unified audit report with ${auditItems.length} combos saved to:`);
console.log(`  ${OUTPUT_FILE}`);
console.log(`  (${curatedCount} Curated JSON combos, ${htmlCount} HTML combos)\n`);
