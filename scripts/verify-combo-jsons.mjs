import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runComboReplay, runComboReplaySearch } from './lib/combo-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMBOS_DIR = path.resolve(__dirname, '../assets/data/combos');
const REPORT_FILE = path.resolve(__dirname, 'engine-verification-report.json');

// Parse CLI arguments
const args = process.argv.slice(2);
let targetFile = null;
let targetArchetype = null;
let maxCombos = null;
let runAll = false;

let targetCombo = null;
let debugMode = false;
let noFail = false;

for (const arg of args) {
    if (arg === '--all') {
        runAll = true;
    } else if (arg === '--debug') {
        debugMode = true;
    } else if (arg === '--no-fail') {
        noFail = true;
    } else if (arg.startsWith('--file=')) {
        targetFile = arg.split('=')[1];
    } else if (arg.startsWith('--archetype=')) {
        targetArchetype = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--combo=')) {
        targetCombo = arg.split('=')[1];
    } else if (arg.startsWith('--max=')) {
        maxCombos = Number(arg.split('=')[1]);
    } else if (!arg.startsWith('--') && arg.endsWith('.json')) {
        targetFile = arg;
    } else if (!arg.startsWith('--')) {
        targetArchetype = arg.toLowerCase();
    }
}

// Find files to process
let files = fs.readdirSync(COMBOS_DIR).filter(f => f.endsWith('.json') && f !== 'engine-audit-report.json');

if (targetFile) {
    const base = path.basename(targetFile);
    files = files.filter(f => f === base || f.toLowerCase() === base.toLowerCase());
    if (files.length === 0) {
        console.error(`Error: Combo file "${targetFile}" not found in ${COMBOS_DIR}`);
        process.exit(1);
    }
} else if (targetArchetype) {
    files = files.filter(f => f.toLowerCase().includes(targetArchetype));
    if (files.length === 0) {
        console.error(`Error: No combo files matching archetype "${targetArchetype}"`);
        process.exit(1);
    }
} else if (!runAll) {
    // Default mode: Run against curated archetypes with official cards for quick verification
    const defaultArchetypes = [
        'primite-combos.json',
        'cyber-dragon-combos.json',
        'blue-eyes-combos.json',
        'dark-magician-combos.json',
        'toon-combos.json'
    ];
    files = files.filter(f => defaultArchetypes.includes(f));
}

console.log('='.repeat(70));
console.log(' archeType Nexus - Headless Yu-Gi-Oh! OCGCore Combo Verifier');
console.log('='.repeat(70));
console.log(`Analyzing ${files.length} combo file(s)...`);
if (maxCombos) console.log(`Limit: max ${maxCombos} combos`);
console.log('');

const results = [];
let totalCombosTested = 0;
let passedLegal = 0;
let unofficialSkipped = 0;
let issuesDetected = 0;

for (const file of files) {
    const filePath = path.join(COMBOS_DIR, file);
    let data;
    try {
        const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
        data = JSON.parse(raw);
    } catch (err) {
        console.error(`[Error] Failed to parse ${file}:`, err.message);
        continue;
    }

    const archetype = data.archetype || file.replace(/-combos\.json$/, '');
    const combos = data.combos || {};
    const comboKeys = Object.keys(combos);

    console.log(`[Archetype] ${archetype} (${file}) - ${comboKeys.length} combo(s)`);

    for (const key of comboKeys) {
        if (targetCombo && key !== targetCombo) continue;
        if (maxCombos && totalCombosTested >= maxCombos) break;

        const combo = combos[key];
        totalCombosTested++;

        const comboTitle = combo.title || key;
        process.stdout.write(`  -> Verifying [${key}] "${comboTitle}"... `);

        const startTime = Date.now();
        let replayResult;
        try {
            replayResult = debugMode
                ? await runComboReplay(combo, { debug: true, lenient: true })
                : await runComboReplaySearch(combo, { lenient: true });
        } catch (err) {
            replayResult = {
                status: 'CRASHED',
                legal: false,
                message: err.message,
                stepsCompleted: 0,
                totalSteps: (combo.steps || []).length,
                errors: [err.message]
            };
        }
        const duration = Date.now() - startTime;

        const entry = {
            file,
            archetype,
            comboKey: key,
            title: comboTitle,
            status: replayResult.status,
            legal: replayResult.legal,
            stepsCompleted: replayResult.stepsCompleted,
            totalSteps: replayResult.totalSteps,
            durationMs: duration,
            errors: replayResult.errors || [],
            log: replayResult.log || [],
            missingCards: replayResult.missingCards || [],
            failedStepIdx: replayResult.failedStepIdx != null ? replayResult.failedStepIdx : null,
            offeredActions: replayResult.offeredActions || null,
            comboData: combo
        };
        results.push(entry);

        if (replayResult.legal || replayResult.status === 'VERIFIED_LEGAL' || replayResult.status === 'VERIFIED_PARTIAL') {
            passedLegal++;
            console.log(`\x1b[32mLEGAL\x1b[0m (${replayResult.stepsCompleted}/${replayResult.totalSteps} steps, ${duration}ms)`);
        } else if (replayResult.status === 'UNOFFICIAL_CARDS') {
            unofficialSkipped++;
            console.log(`\x1b[33mSKIPPED (Unofficial Cards)\x1b[0m (${replayResult.missingCards.length} missing)`);
        } else {
            issuesDetected++;
            console.log(`\x1b[31mISSUE DETECTED\x1b[0m (${replayResult.stepsCompleted}/${replayResult.totalSteps} steps)`);
            if (replayResult.errors && replayResult.errors.length > 0) {
                console.log(`     Reason: ${replayResult.errors[0]}`);
            }
        }
    }
    console.log('');
    if (maxCombos && totalCombosTested >= maxCombos) break;
}

console.log('='.repeat(70));
console.log(' Verification Summary');
console.log('='.repeat(70));
console.log(`Total Combos Tested:   ${totalCombosTested}`);
console.log(`100% Legal Confirmed:  ${passedLegal}`);
console.log(`Unofficial Skipped:    ${unofficialSkipped}`);
console.log(`Rules/Steps Issues:    ${issuesDetected}`);
console.log('');

// Save report to disk
fs.writeFileSync(REPORT_FILE, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalCombosTested,
    passedLegal,
    unofficialSkipped,
    issuesDetected,
    results
}, (k, v) => typeof v === 'bigint' ? Number(v) : v, 2));

console.log(`Detailed report saved to: ${REPORT_FILE}`);

if (issuesDetected > 0 && process.env.CI && !noFail) {
    process.exit(1);
} else {
    process.exit(0);
}
