// scripts/find-generic-searchers.js
// Finds Spells that fetch a card by its Type, Attribute, Level or kind ("Add 1 Level 4 or lower Warrior
// monster from your Deck", "Add 1 Field Spell from your Deck") for the admin page's review queue, and
// applies the moderators' decisions to assets/data/generic-searchers.json.
//
//   node scripts/find-generic-searchers.js
//
// 1. Reads every TCG Spell from the Supabase card table and reads its text with PATTERN. A Spell
//    qualifies when it adds or Special Summons one card from the Deck described only by Level,
//    Attribute, Type, frame (Normal/Ritual) or as a Field Spell, never by a card or archetype name.
// 2. Applies the decisions in Supabase table genericsearcherreviews (scripts/sql/013_...): an approved
//    card goes into generic-searchers.json with the rule the moderator confirmed, a rejected one comes
//    out. Entries nobody reviewed (the hand-made first eleven) are left alone.
// 3. Writes assets/data/generic-searcher-candidates.json: the qualifying Spells that aren't in
//    generic-searchers.json and haven't been reviewed, each with the parsed rule, the sentence it came
//    from, and how many test decks it would fit and reach a starter in (from the Small World scores in
//    assets/data/small-world-scores/). "conditional" marks a Spell with a condition or cost before the
//    fetch, which the pattern can't judge.
// No timestamps, so the weekly run only changes the files when something changed. When Supabase can't
// be reached, nothing is written (exit 0); when the review table doesn't exist yet, step 2 is skipped.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const SEARCHERS_FILE = path.join(DATA_DIR, 'generic-searchers.json');
const CANDIDATES_FILE = path.join(DATA_DIR, 'generic-searcher-candidates.json');
const SCORES_DIR = path.join(DATA_DIR, 'small-world-scores');
const DECK_DIR = path.join(DATA_DIR, 'decklists');
const REVIEW_TABLE = 'genericsearcherreviews';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

// ---------- Supabase ----------

function supabaseConfig() {
    const text = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'supabase-config.js'), 'utf8');
    const url = /url:\s*'([^']+)'/.exec(text);
    const key = /anonKey:\s*'([^']+)'/.exec(text);
    if (!url || !key) throw new Error('No Supabase url/anonKey in assets/js/supabase-config.js');
    return { url: url[1], key: key[1] };
}

async function rest(sb, query) {
    const res = await fetch(`${sb.url}/rest/v1/${query}`, {
        headers: { apikey: sb.key, Authorization: `Bearer ${sb.key}` },
        signal: AbortSignal.timeout(45000)
    });
    const body = await res.text();
    if (!res.ok) {
        const err = new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`);
        err.status = res.status;
        err.body = body;
        throw err;
    }
    return JSON.parse(body);
}

// Every row of a query, 1,000 at a time in a fixed order (Supabase cuts responses at 1,000 rows)
async function allRows(sb, query, order) {
    const out = [];
    for (let offset = 0; ; offset += 1000) {
        const page = await rest(sb, `${query}&order=${order}&limit=1000&offset=${offset}`);
        out.push(...page);
        if (page.length < 1000) return out;
    }
}

// ---------- Reading the card text ----------

const TYPES = ['Aqua', 'Beast-Warrior', 'Beast', 'Cyberse', 'Dinosaur', 'Divine-Beast', 'Dragon', 'Fairy', 'Fiend', 'Fish',
    'Illusion', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder',
    'Warrior', 'Winged Beast', 'Wyrm', 'Zombie'];
const ATTRIBUTES = ['LIGHT', 'DARK', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
// "Add 1 Level 4 or lower Warrior monster from your Deck", "Special Summon 1 Level 3 or lower Psychic-Type
// monster from your hand or Deck", "Add 1 Field Spell from your Deck". No quotes can sit in the description,
// so a card or archetype name never matches.
const PATTERN = new RegExp(
    '(add|Special Summon) 1 ' +
    '(?:Level ([0-9]+)( or lower| or higher)? )?' +
    '(?:(' + ATTRIBUTES.join('|') + ') )?' +
    '(?:(' + TYPES.join('|') + ')(?:-Type)? )?' +
    '(?:(Normal|Ritual) )?' +
    '(monster|Monster|Field Spell)(?: Card)?' +
    ' from (?:your hand or )?(?:your |the )?Deck', 'i');

function parseSpell(text) {
    const d = String(text || '').replace(/\s+/g, ' ').trim();
    const m = PATTERN.exec(d);
    if (!m) return null;
    const [, verb, level, cmp, attribute, race, frame, kind] = m;
    const field = /Field Spell/i.test(kind);
    if (!level && !attribute && !race && !frame && !field) return null; // "1 monster" alone isn't generic by Type
    const start = d.lastIndexOf('. ', m.index) + 1;
    const endDot = d.indexOf('.', m.index + m[0].length);
    const sentence = d.slice(start, endDot < 0 ? d.length : endDot + 1).trim();
    const before = d.slice(start, m.index);
    const after = sentence.slice(sentence.indexOf(m[0]) + m[0].length);
    // The clause right after the fetch can narrow what it fetches ("that mentions 'Umi'", "whose name is
    // listed on that Ritual Spell"); after ", but / also / then" only an "only ... 'Name'" limit does
    // ("you can only Special Summon 'Eldlich' monsters"), not a side effect ("but you cannot Normal Summon")
    const cut = after.search(/, but\b|, also\b|, then\b|;/);
    const qualifier = cut < 0 ? after : after.slice(0, cut);
    const trailing = cut < 0 ? '' : after.slice(cut);
    const restricted = /"|\bthat\b|\bwith\b|\bexcept\b|\bwhose\b/i.test(qualifier) || /\bonly\b[^.]*"/i.test(trailing);
    const target = field ? { spell: 'Field' } : Object.assign({ monster: true },
        race ? { race } : {},
        attribute ? { attribute: attribute.toUpperCase() } : {},
        level ? (cmp && /lower/i.test(cmp) ? { levelMax: +level } : cmp ? { levelMin: +level } : { level: +level }) : {},
        frame ? { frame: frame[0].toUpperCase() + frame.slice(1).toLowerCase() } : {});
    return {
        verb: /summon/i.test(verb) ? 'summon' : 'add',
        target,
        // Needs a person's look: anything before the fetch in its sentence (a condition, a cost, a target),
        // a bullet under an earlier trigger, or a restriction after it ("that mentions 'Umi'", "with 1500 or
        // less ATK", "you can only Special Summon 'Eldlich' monsters")
        conditional: /[:;"]/.test(before) || /^\s*(If|When|While|During|Target|Activate only|You can only activate)/i.test(before)
            || /^\s*(If|When|●)/i.test(sentence) || restricted,
        sentence
    };
}

// "Adds a Level 4 or lower Warrior from the Deck."
function describeRule(verb, target) {
    let what;
    if (target.spell) what = 'a Field Spell';
    else {
        const parts = [];
        if (target.level !== undefined) parts.push(`Level ${target.level}`);
        if (target.levelMax !== undefined) parts.push(`Level ${target.levelMax} or lower`);
        if (target.levelMin !== undefined) parts.push(`Level ${target.levelMin} or higher`);
        if (target.attribute) parts.push(target.attribute);
        if (target.race) parts.push(target.race);
        parts.push(target.frame ? `${target.frame} Monster` : (target.race ? '' : 'monster'));
        const phrase = parts.filter(Boolean).join(' ');
        what = `${/^[AEIOU]/i.test(phrase) && !/^Level/.test(phrase) ? 'an' : 'a'} ${phrase}`;
    }
    return `${verb === 'summon' ? 'Special Summons' : 'Adds'} ${what} from the Deck.`;
}

// Same rule as build-small-world-scores.js fitsTarget() and card-browser.js gsFits()
function fitsTarget(target, c) {
    if (!target || !c) return false;
    if (target.spell) return c.kind === 'spell' && target.spell === 'Field' && !!c.field;
    if (target.monster && c.kind !== 'monster') return false;
    if (target.race && c.race !== target.race) return false;
    if (target.attribute && c.attribute !== target.attribute) return false;
    if (target.level !== undefined && c.level !== target.level) return false;
    if (target.levelMax !== undefined && !(c.level !== null && c.level <= target.levelMax)) return false;
    if (target.levelMin !== undefined && !(c.level !== null && c.level >= target.levelMin)) return false;
    if (target.frame === 'Normal' && !(/Normal/i.test(c.type || '') && !/Effect/i.test(c.type || ''))) return false;
    if (target.frame === 'Ritual' && !/Ritual/i.test(c.type || '')) return false;
    return true;
}

// ---------- generic-searchers.json, written in its own layout ----------

const inline = obj => `{ ${Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')} }`;

function formatSearchers(about, list) {
    const entries = list.map(s => {
        const fields = [`"name": ${JSON.stringify(s.name)}`];
        if (s.passcode) fields.push(`"passcode": ${s.passcode}`);
        fields.push(`"verb": ${JSON.stringify(s.verb)}`);
        if (s.cost) fields.push(`"cost": ${JSON.stringify(s.cost)}`);
        if (s.excavate) fields.push(`"excavate": ${s.excavate}`);
        if (s.target) fields.push(`"target": ${inline(s.target)}`);
        if (s.note) fields.push(`"note": ${JSON.stringify(s.note)}`);
        return `        {\n${fields.map(f => `            ${f}`).join(',\n')}\n        }`;
    });
    return `{\n    "_about": ${JSON.stringify(about)},\n    "searchers": [\n${entries.join(',\n')}\n    ]\n}\n`;
}

// ---------- Main ----------

async function main() {
    const sb = supabaseConfig();
    const searchersFile = readJson(SEARCHERS_FILE);
    let searchers = searchersFile.searchers.slice();
    const cache = readJson(path.join(DATA_DIR, 'cards-cache.json'));
    const tcgNames = new Map();
    (readJson(path.join(DATA_DIR, 'tcg-card-names.json')).cards || []).forEach(c => {
        if (c.passcode) tcgNames.set(Number(c.passcode), c.name);
        if (c.prerelease) tcgNames.set(Number(c.prerelease), c.name);
    });

    let spells, reviews = [];
    try {
        spells = await allRows(sb, 'cards?select=cardid,cardname,passcode,description,format,tcgreleasedate&cardtype=eq.Spell%20Card', 'cardid.asc');
    } catch (err) {
        console.warn(`Supabase could not be read, so nothing changes: ${err.message}`);
        return;
    }
    try {
        reviews = await allRows(sb, `${REVIEW_TABLE}?select=passcode,cardname,status,rule`, 'passcode.asc');
    } catch (err) {
        // PGRST205 / 404: the table doesn't exist yet (scripts/sql/013_generic_searcher_reviews.sql)
        console.warn(`No review decisions read (${err.status || ''} ${/PGRST205|does not exist|Could not find/.test(err.body || err.message) ? 'run scripts/sql/013_generic_searcher_reviews.sql first' : err.message}).`);
    }

    // 2. Apply the decisions
    const changes = [];
    for (const r of reviews) {
        const code = Number(r.passcode);
        const at = searchers.findIndex(s => Number(s.passcode) === code || s.name === r.cardname);
        if (r.status === 'rejected') {
            if (at >= 0) { changes.push(`removed ${searchers[at].name}`); searchers.splice(at, 1); }
            continue;
        }
        if (r.status !== 'approved' || !r.rule || !r.rule.target) continue;
        const entry = {
            name: at >= 0 ? searchers[at].name : r.cardname,
            passcode: code,
            verb: r.rule.verb === 'summon' ? 'summon' : 'add',
            cost: r.rule.cost || undefined,
            target: r.rule.target,
            note: r.rule.note || describeRule(r.rule.verb, r.rule.target)
        };
        if (at < 0) { searchers.push(entry); changes.push(`added ${entry.name}`); }
        else {
            const old = searchers[at];
            const same = old.verb === entry.verb && (old.cost || null) === (entry.cost || null)
                && JSON.stringify(old.target) === JSON.stringify(entry.target) && old.note === entry.note;
            if (!same && !old.excavate) { searchers[at] = Object.assign({}, old, entry); changes.push(`updated ${entry.name}`); }
        }
    }
    const searchersText = formatSearchers(searchersFile._about, searchers);
    if (searchersText !== fs.readFileSync(SEARCHERS_FILE, 'utf8')) {
        fs.writeFileSync(SEARCHERS_FILE, searchersText);
        console.log(`generic-searchers.json: ${changes.join(', ') || 'reformatted'}`);
    }

    // 3. Candidates: TCG Spells the pattern reads, not listed and not reviewed
    const listed = new Set(searchers.map(s => s.name));
    const listedCodes = new Set(searchers.map(s => Number(s.passcode)).filter(Boolean));
    const reviewed = new Set(reviews.map(r => Number(r.passcode)));
    const byName = new Map();
    for (const row of spells) {
        if (/anime/i.test(row.format || '') || !(row.format === 'TCG' || row.tcgreleasedate)) continue;
        const code = Number(row.passcode);
        const name = tcgNames.get(code) || row.cardname;
        if (!code || listed.has(name) || listedCodes.has(code) || reviewed.has(code)) continue;
        const parsed = parseSpell(row.description);
        if (!parsed) continue;
        const known = byName.get(name);
        if (!known || code < known.passcode) byName.set(name, Object.assign({ name, passcode: code, text: String(row.description || '').replace(/\s+/g, ' ').trim() }, parsed));
    }

    // How many test decks each would fit (a card it can fetch) and reach a starter in
    const index = readJson(path.join(DECK_DIR, 'index.json'));
    const decks = [...new Set(Object.values(index))].map(file => {
        let score = null;
        try { score = readJson(path.join(SCORES_DIR, file)); } catch (_) { return null; }
        const starterNames = new Set((score.starters || []).map(s => s.name));
        const cards = (score.pool || []).map(m => Object.assign({ kind: 'monster', type: (cache[m.name.toLowerCase()] || {}).type || '' }, m));
        let own = [];
        try { own = (readJson(path.join(DECK_DIR, file)).main || []).map(r => (Array.isArray(r) ? r[0] : r.name)); } catch (_) { /* no list */ }
        own.forEach(name => {
            const c = cache[name.toLowerCase()];
            if (c && /Spell/.test(c.type || '') && c.race === 'Field') cards.push({ name, kind: 'spell', field: true, starter: starterNames.has(name) });
        });
        return { archetype: score.archetype, cards };
    }).filter(Boolean);
    const candidates = [...byName.values()].map(c => {
        let fits = 0, reaches = 0;
        const reachesIn = [];
        for (const deck of decks) {
            const hit = deck.cards.filter(card => fitsTarget(c.target, card));
            if (!hit.length) continue;
            fits++;
            if (hit.some(card => card.starter)) { reaches++; reachesIn.push(deck.archetype); }
        }
        return {
            name: c.name, passcode: c.passcode, verb: c.verb, target: c.target, conditional: c.conditional,
            note: describeRule(c.verb, c.target), sentence: c.sentence, text: c.text,
            fits, reaches, reachesIn: reachesIn.sort().slice(0, 8)
        };
    }).sort((a, b) => (a.conditional - b.conditional) || (b.reaches - a.reaches) || (b.fits - a.fits) || a.name.localeCompare(b.name));

    const out = {
        _about: 'Spells that fetch a card by Type, Attribute, Level or kind, found by scripts/find-generic-searchers.js and not yet in generic-searchers.json or reviewed. The admin page (Generic Searchers) approves or rejects them; "conditional" ones have a condition or cost before the fetch. fits / reaches: test decks with a card it can fetch / with a starter it can fetch.',
        candidates
    };
    const text = JSON.stringify(out, null, 1) + '\n';
    const before = fs.existsSync(CANDIDATES_FILE) ? fs.readFileSync(CANDIDATES_FILE, 'utf8') : '';
    if (text !== before) fs.writeFileSync(CANDIDATES_FILE, text);
    const plain = candidates.filter(c => !c.conditional).length;
    console.log(`${candidates.length} candidate(s) to review (${plain} with no condition first), ${reviews.length} decision(s) read, ${searchers.length} generic searchers listed.`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
