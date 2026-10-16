const fs = require('fs');
const path = require('path');

const DECK_DIR = path.join(__dirname, '../assets/data/decklists');
const CARDS_CACHE = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/cards-cache.json'), 'utf8'));
const RESERVED = new Set(['index.json', 'packages.json', 'packages.generated.json', 'profiles.json', 'report.json']);

console.log('Verifying summary structure, plain-text integrity, and card database validity across all decklists...\n');

const files = fs.readdirSync(DECK_DIR).filter(f => f.endsWith('.json') && !RESERVED.has(f));

let totalFiles = 0;
let totalPassed = 0;
const issues = [];

files.forEach(filename => {
    totalFiles++;
    const filePath = path.join(DECK_DIR, filename);
    let deck;
    try {
        deck = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    } catch (e) {
        issues.push({ file: filename, type: 'JSON Parse Error', detail: e.message });
        return;
    }

    // 1. Check card database validity
    ['main', 'extra'].forEach(z => {
        (deck[z] || []).forEach(row => {
            const name = Array.isArray(row) ? row[0] : row.name;
            if (name && !CARDS_CACHE[name.toLowerCase()]) {
                issues.push({ file: filename, type: 'Card Not in Database', detail: `${z} deck card '${name}' not found in cards-cache.json` });
            }
        });
    });

    Object.keys(deck.allow || {}).forEach(name => {
        if (!CARDS_CACHE[name.toLowerCase()]) {
            issues.push({ file: filename, type: 'Allowed Card Not in Database', detail: `Allowed card '${name}' not found in cards-cache.json` });
        }
    });

    Object.keys(deck.exclude || {}).forEach(name => {
        if (!CARDS_CACHE[name.toLowerCase()]) {
            issues.push({ file: filename, type: 'Excluded Card Not in Database', detail: `Excluded card '${name}' not found in cards-cache.json` });
        }
    });

    const summary = deck.summary;
    if (!Array.isArray(summary) || summary.length < 4) {
        issues.push({ file: filename, type: 'Invalid Summary Structure', detail: `Summary has ${Array.isArray(summary) ? summary.length : 'non-array'} sections (expected at least 4).` });
        return;
    }

    // 2. Intro section
    if (typeof summary[0] !== 'string' || summary[0].trim().length < 30) {
        issues.push({ file: filename, type: 'Invalid Intro', detail: 'Intro section is missing or too short.' });
    }

    // 3. Section titles and structure
    const titles = summary.slice(1).map(s => (s && s.title ? s.title.toLowerCase() : ''));
    const hasStarters = titles.some(t => /starter|enabler|consistency|scale/i.test(t));
    const hasOpening = titles.some(t => /opening|combo|turn-0|line/i.test(t));
    const hasBosses = titles.some(t => /boss|payoff|control|extra deck/i.test(t));

    if (!hasStarters) issues.push({ file: filename, type: 'Missing Starters Section', detail: 'No Starters section found.' });
    if (!hasOpening) issues.push({ file: filename, type: 'Missing Opening Section', detail: 'No Opening combo section found.' });
    if (!hasBosses) issues.push({ file: filename, type: 'Missing Bosses Section', detail: 'No Bosses/Control/Payoff section found.' });

    // 4. Opening steps count
    const openingSection = summary.find(s => s && s.title && /opening|combo|turn-0|line/i.test(s.title) && Array.isArray(s.steps));
    if (!openingSection || openingSection.steps.length < 2) {
        issues.push({ file: filename, type: 'Incomplete Opening Steps', detail: `Opening section has fewer than 2 steps.` });
    }

    // 5. Raw Markdown and HTML syntax check
    const allTexts = [];
    if (typeof summary[0] === 'string') allTexts.push({ loc: 'intro', text: summary[0] });
    summary.slice(1).forEach((sec, idx) => {
        if (!sec) return;
        if (sec.text) allTexts.push({ loc: `section[${idx}].text`, text: sec.text });
        if (Array.isArray(sec.points)) sec.points.forEach((p, pIdx) => allTexts.push({ loc: `section[${idx}].points[${pIdx}]`, text: p }));
        if (Array.isArray(sec.steps)) sec.steps.forEach((s, sIdx) => allTexts.push({ loc: `section[${idx}].steps[${sIdx}]`, text: s }));
    });

    ['main', 'extra'].forEach(z => {
        (deck[z] || []).forEach((row, rIdx) => {
            const note = Array.isArray(row) ? row[2] : row.note;
            if (note) allTexts.push({ loc: `${z}[${rIdx}].note`, text: note });
        });
    });

    allTexts.forEach(({ loc, text }) => {
        if (/\*\*[^*]+\*\*/.test(text)) {
            issues.push({ file: filename, type: 'Markdown Bold Syntax Found', detail: `Found '**' bold syntax at ${loc}: ${text.slice(0, 60)}...` });
        }
        if (/^###?\s+/m.test(text)) {
            issues.push({ file: filename, type: 'Markdown Header Syntax Found', detail: `Found header syntax at ${loc}: ${text.slice(0, 60)}...` });
        }
        if (/<(?:div|span|p|b|i|br|strong|em|h\d)[\s>/]/i.test(text)) {
            issues.push({ file: filename, type: 'HTML Tag Found', detail: `Found HTML tag at ${loc}: ${text.slice(0, 60)}...` });
        }
    });

    if (!issues.some(i => i.file === filename)) {
        totalPassed++;
    }
});

console.log('=======================================================');
console.log(`Files Evaluated: ${totalFiles} | Passed: ${totalPassed} | Files with Issues: ${new Set(issues.map(i => i.file)).size}`);
console.log('=======================================================\n');

if (issues.length > 0) {
    console.log('Sample of issues:');
    issues.slice(0, 20).forEach((iss, i) => {
        console.log(`${i + 1}. [${iss.file}] ${iss.type}: ${iss.detail}`);
    });
    fs.writeFileSync('scripts/summary-quality-report.json', JSON.stringify({ totalFiles, totalPassed, issues }, null, 2));
    process.exit(1);
} else {
    console.log('All decklist summaries verified successfully! (0 quality issues)');
    fs.writeFileSync('scripts/summary-quality-report.json', JSON.stringify({ totalFiles, totalPassed, issues: [] }, null, 2));
    process.exit(0);
}
