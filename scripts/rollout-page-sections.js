/**
 * Rollout script for page-sections.js (community "suggest edit" widget —
 * see assets/js/page-sections.js and scripts/sql/009_page_sections.sql).
 *
 * Mirrors the pattern already used by inject-synergy-tags.js: find every
 * archetype page via a reliable anchor already present on it, then
 * idempotently inject the script include + initPageSections('Name') call.
 * No markup restructuring happens here — block discovery is entirely
 * runtime (see _pcsAutoDiscoverBlocks in page-sections.js), so this script's
 * only job is wiring the two lines every page needs.
 *
 * Dry-run by default — prints what WOULD change without writing anything.
 * Pass --apply to actually write the changes. Re-running (in either mode)
 * is safe: already-wired pages are skipped, never double-injected.
 *
 * Usage:
 *   node scripts/rollout-page-sections.js            # dry run
 *   node scripts/rollout-page-sections.js --apply     # writes changes
 *   node scripts/rollout-page-sections.js --apply --only="Drytron,Azamina"  # limit to specific archetypes, for canary batches
 */
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');
const apply = process.argv.includes('--apply');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const onlyList = onlyArg ? onlyArg.slice('--only='.length).split(',').map(s => s.trim().toLowerCase()) : null;

let modifiedCount = 0;
let skippedCount = 0;
const skippedReasons = {};
const skippedFiles = {}; // reason -> [filenames], so a summary can list exactly which pages need separate attention

function skip(filename, reason) {
    skippedCount++;
    skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
    (skippedFiles[reason] = skippedFiles[reason] || []).push(filename);
}

// Matches a JS string literal in EITHER quote style, correctly handling an
// escaped quote inside it (e.g. 'Koa\'ki Meiru' or "Battlin' Boxer" — both
// forms show up on real pages because of the apostrophe in the archetype
// name). Group 1 is the FULL literal including its quotes, so it can be
// reused verbatim in the inserted call without re-deriving escaping rules.
const STRING_LITERAL = String.raw`((['"])(?:\\.|(?!\2).)*\2)`;

function unescapeJsLiteral(literal) {
    return literal.slice(1, -1).replace(/\\(.)/g, '$1');
}

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

for (const filename of files) {
    const filepath = path.join(pagesDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    if (content.includes('assets/js/page-sections.js')) {
        skip(filename, 'already wired');
        continue;
    }

    // Prefer chaining after initSynergyTags (matches the order used on the
    // two pilot pages: combos -> synergy -> sections); fall back to
    // initCommunityCombos for a page that has that but not synergy-tags yet.
    // Absence of BOTH anchors means either this isn't an archetype page
    // (Admin.html, Banlist.html, ...) or it's an archetype page that never
    // got the community-combos/synergy-tags rollout in the first place
    // (confirmed cases: Slifer the Sky Dragon, Snake-Eyes) — those need their
    // own separate rollout pass, not a guess about where to inject here.
    const synergyMatch = content.match(new RegExp(String.raw`initSynergyTags\(${STRING_LITERAL}\);`));
    const combosMatch = content.match(new RegExp(String.raw`initCommunityCombos\('community-combos-wrapper',\s*${STRING_LITERAL}\)`));
    const anchorMatch = synergyMatch || combosMatch;
    if (!anchorMatch) {
        skip(filename, 'no initSynergyTags/initCommunityCombos anchor found');
        continue;
    }
    const archetypeLiteral = anchorMatch[1]; // full quoted literal, reused as-is below
    const archetypeName = unescapeJsLiteral(archetypeLiteral); // for --only matching and the console log only

    if (onlyList && !onlyList.includes(archetypeName.toLowerCase())) {
        skip(filename, 'excluded by --only filter');
        continue;
    }

    // 1. Script include — right after synergy-tags.js if present, else
    //    before </head>.
    const jsTag = '<script src="../assets/js/page-sections.js"></script>';
    const jsAnchor = '<script src="../assets/js/synergy-tags.js"></script>';
    if (content.includes(jsAnchor)) {
        content = content.replace(jsAnchor, `${jsAnchor}\n    ${jsTag}`);
    } else {
        content = content.replace('</head>', `    ${jsTag}\n</head>`);
    }

    // 2. Init call, chained right after whichever anchor call we matched.
    //    Reuses the SAME quoted literal captured above, so a page using
    //    "Battlin' Boxer" gets initPageSections("Battlin' Boxer") — no
    //    separate escaping logic needed.
    const anchorCallText = anchorMatch[0];
    const initCall = `initPageSections(${archetypeLiteral});`;
    content = content.replace(anchorCallText, `${anchorCallText}\n                ${initCall}`);

    if (apply) {
        fs.writeFileSync(filepath, content, 'utf8');
    }
    console.log(`${apply ? 'MODIFIED' : 'WOULD MODIFY'}  ${filename}  (archetype: ${archetypeName})`);
    modifiedCount++;
}

console.log(`\n--- ${apply ? 'Applied' : 'Dry run'} summary ---`);
console.log(`${apply ? 'Modified' : 'Would modify'}: ${modifiedCount}`);
console.log(`Skipped: ${skippedCount}`);
for (const [reason, count] of Object.entries(skippedReasons)) {
    console.log(`  - ${reason}: ${count}`);
    // "already wired" and "excluded by --only filter" are expected/routine;
    // the "no anchor" case can hide a real archetype page that never got
    // the community-combos/synergy-tags rollout at all (confirmed: Slifer
    // the Sky Dragon, Snake-Eyes) — list those by name so they don't
    // silently fall through the cracks of an aggregate count.
    if (reason.startsWith('no initSynergyTags')) {
        skippedFiles[reason].forEach(f => console.log(`      - ${f}`));
    }
}
if (!apply) {
    console.log(`\nThis was a dry run — no files were changed. Re-run with --apply to write these changes.`);
    console.log(`Tip: start with a canary batch, e.g. --apply --only="Drytron,Azamina,SomeOtherArchetype"`);
}
