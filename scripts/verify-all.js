const { execSync } = require('child_process');
const path = require('path');

console.log('======================================================================');
console.log('ArcheType Nexus - Comprehensive Decklist & Gameplay Verification Suite');
console.log('======================================================================\n');

const scripts = [
    { name: 'Searcher PSCT Verification', file: 'verify-searchers.js' },
    { name: 'Boss Capability Verification', file: 'verify-boss-claims.js' },
    { name: 'Combo Opening Summon Lock Verification', file: 'verify-combo-locks.js' }
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
        allPassed = false;
    }
}

if (allPassed) {
    console.log('======================================================================');
    console.log('ALL VERIFICATIONS PASSED: 100% Legal PSCT, Boss Capabilities & Locks!');
    console.log('Zero illegal moves or unplayable interactions across all 501 decklists.');
    console.log('======================================================================');
} else {
    console.error('FAILED: Verification detected rule or gameplay violations.');
    process.exit(1);
}
