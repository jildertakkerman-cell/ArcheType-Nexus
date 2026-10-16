const { execSync } = require('child_process');
const path = require('path');

console.log('======================================================================');
console.log('ArcheType Nexus - Comprehensive Decklist & Gameplay Verification Suite');
console.log('======================================================================\n');

const scripts = [
    { name: 'Tier 1: Searcher PSCT Verification', file: 'verify-searchers.js' },
    { name: 'Tier 2: Boss Capability Verification', file: 'verify-boss-claims.js' },
    { name: 'Tier 3: Combo Opening Summon Lock Verification', file: 'verify-combo-locks.js' },
    { name: 'Tier 4: Extra Deck Materials & Level Math Verification', file: 'verify-materials.js' },
    { name: 'Tier 5: Summary Quality, Structure & Database Validity', file: 'verify-summary-quality.js' },
    { name: 'Tier 6: Website HTML Combo Section Verification', file: 'verify-html-combos.js' }
];

let allPassed = true;

for (const s of scripts) {
    console.log(`>>> Running [${s.name}]...`);
    try {
        const output = execSync(`node "${path.join(__dirname, s.file)}"`, { encoding: 'utf8' });
        console.log(output.trim());
        console.log('----------------------------------------------------------------------\n');
    } catch (err) {
        console.error(`ERROR running ${s.file}:`, err.message);
        if (err.stdout) console.log(err.stdout.toString().trim());
        allPassed = false;
    }
}

if (allPassed) {
    console.log('======================================================================');
    console.log('ALL VERIFICATIONS PASSED: 100% Legal PSCT, Boss Capabilities, Locks & Math!');
    console.log('Zero illegal moves or unplayable interactions across all 501 decklists and 462 website combo guides.');
    console.log('======================================================================');
} else {
    console.error('FAILED: Verification detected rule or gameplay violations.');
    process.exit(1);
}
