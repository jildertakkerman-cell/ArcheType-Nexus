import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CDB_PATH = path.resolve(__dirname, '../../assets/data/cards.cdb');
const SCRIPT_DIR = path.resolve(__dirname, '../../assets/data/cardscripts');
const WASM_INDEX = pathToFileURL(path.resolve(__dirname, '../../node_modules/@n1xx1/ocgcore-wasm/dist/index.js')).href;

// Ensure local script cache directory exists
if (!fs.existsSync(SCRIPT_DIR)) {
    fs.mkdirSync(SCRIPT_DIR, { recursive: true });
}

// Ensure cards.cdb exists, or download it if missing
if (!fs.existsSync(CDB_PATH)) {
    console.log('Downloading ProjectIgnis cards.cdb (~8MB)...');
    const res = await fetch('https://raw.githubusercontent.com/ProjectIgnis/BabelCDB/master/cards.cdb');
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(CDB_PATH, buf);
    console.log('Downloaded cards.cdb successfully!');
}

const db = new DatabaseSync(CDB_PATH);
const SELECT_CARD_SQL = 'SELECT datas.id, datas.ot, datas.alias, CAST(datas.setcode AS TEXT) AS setcode, datas.type, datas.atk, datas.def, datas.level, CAST(datas.race AS TEXT) AS race, datas.attribute, CAST(datas.category AS TEXT) AS category, texts.name FROM datas JOIN texts ON datas.id = texts.id';
const stmtByCode = db.prepare(`${SELECT_CARD_SQL} WHERE datas.id = ?`);
const stmtByName = db.prepare(`${SELECT_CARD_SQL} WHERE LOWER(texts.name) = LOWER(?) LIMIT 1`);
const stmtByNameLike = db.prepare(`${SELECT_CARD_SQL} WHERE LOWER(texts.name) LIKE ? ORDER BY LENGTH(texts.name) ASC LIMIT 1`);
const stmtStringsByCode = db.prepare('SELECT str1, str2, str3, str4, str5, str6, str7, str8, str9, str10, str11, str12, str13, str14, str15, str16 FROM texts WHERE id = ?');

const stmtInsertData = db.prepare('INSERT OR REPLACE INTO datas (id, ot, alias, setcode, type, atk, def, level, race, attribute, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const stmtInsertText = db.prepare('INSERT OR REPLACE INTO texts (id, name, desc) VALUES (?, ?, ?)');

const SUPABASE_URL = 'https://pdvrdrmmykbznmojacwp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ia1JW1tEjKQgUFe2ni5WQA_qgBU45JZ';

export function cleanCardName(name) {
    if (!name) return '';
    return String(name)
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&#x27;|&apos;/gi, "'")
        .replace(/&amp;/gi, '&')
        .replace(/&mdash;|&ndash;/gi, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/^(?:[A-Z][A-Z0-9\s/-]{1,22}\s*·\s*)+/, '')
        .trim();
}

export function getEffectDescription(desc) {
    if (desc == null) return '';
    try {
        const big = BigInt(desc);
        if (big === 1160n) return 'Place in Pendulum Zone / Activate as Pendulum Scale';
        if (big === 1150n) return 'Activate Spell/Trap Card';
        const code = Number(big >> 20n);
        const idx = Number(big & 0xfffffn);
        if (code <= 0 || idx < 0 || idx > 15) return '';
        const row = stmtStringsByCode.get(code);
        if (!row) return '';
        return row[`str${idx + 1}`] || '';
    } catch {
        return '';
    }
}

export function parseSetcodes(rawSetcode) {
    const setcodes = [];
    if (!rawSetcode) return setcodes;
    const big = BigInt(rawSetcode);
    for (let i = 0n; i < 4n; i++) {
        const code = Number((big >> (i * 16n)) & 0xffffn);
        if (code !== 0) {
            setcodes.push(code);
        }
    }
    return setcodes;
}

// Rows an earlier run cached from Supabase (texts.str1 is NULL) were stored without archetype setcodes
let supabaseCachedIds = null;
function isSupabaseCached(id) {
    if (!supabaseCachedIds) {
        supabaseCachedIds = new Set(db.prepare('SELECT id FROM texts WHERE str1 IS NULL').all().map(r => Number(r.id)));
    }
    return supabaseCachedIds.has(Number(id));
}

export function formatCardData(row) {
    if (!row) return null;
    const isLink = (row.type & 0x4000000) !== 0; // TYPE_LINK = 0x4000000
    const isPendulum = (row.type & 0x1000000) !== 0; // TYPE_PENDULUM = 0x1000000
    const setcodes = parseSetcodes(row.setcode);
    return {
        code: row.id,
        alias: row.alias || 0,
        setcodes: setcodes.length === 0 && isSupabaseCached(row.id) ? parseSetcodes(deriveSetcodeFromName(row.name)) : setcodes,
        type: row.type,
        level: (row.level & 0xff),
        attribute: row.attribute,
        race: BigInt(row.race || 0),
        attack: row.atk,
        defense: isLink ? 0 : row.def,
        lscale: isPendulum ? ((row.level >> 24) & 0xff) : 0,
        rscale: isPendulum ? ((row.level >> 16) & 0xff) : 0,
        link_marker: isLink ? row.def : 0,
        name: row.name
    };
}

const dynamicTokens = new Map();

export function getCardByCode(code) {
    const num = Number(code);
    if (dynamicTokens.has(num)) return dynamicTokens.get(num);
    const row = stmtByCode.get(num);
    return formatCardData(row);
}

// The card's rules text from cards.cdb ('' if unknown)
const stmtTextByCode = db.prepare('SELECT desc FROM texts WHERE id = ?');
export function getCardText(code) {
    return stmtTextByCode.get(Number(code))?.desc || '';
}

export function getCardByName(name) {
    const row = stmtByName.get(name.trim());
    return formatCardData(row);
}

// Local cards.cdb only (exact name, then shortest name containing it): no network fallback, for speculative lookups
export function findLocalCard(name) {
    const clean = cleanCardName(name).trim();
    if (clean.length < 3) return null;
    return getCardByName(clean) || formatCardData(stmtByNameLike.get(`%${clean.toLowerCase()}%`));
}

const ATTRIBUTE_MAP = {
    EARTH: 1,
    WATER: 2,
    FIRE: 4,
    WIND: 8,
    LIGHT: 16,
    DARK: 32,
    DIVINE: 64
};

const RACE_MAP = {
    WARRIOR: 0x1n,
    SPELLCASTER: 0x2n,
    FAIRY: 0x4n,
    FIEND: 0x8n,
    ZOMBIE: 0x10n,
    MACHINE: 0x20n,
    AQUA: 0x40n,
    PYRO: 0x80n,
    ROCK: 0x100n,
    WINGEDBEAST: 0x200n,
    'WINGED BEAST': 0x200n,
    PLANT: 0x400n,
    INSECT: 0x800n,
    THUNDER: 0x1000n,
    DRAGON: 0x2000n,
    BEAST: 0x4000n,
    BEASTWARRIOR: 0x8000n,
    'BEAST-WARRIOR': 0x8000n,
    DINOSAUR: 0x10000n,
    FISH: 0x20000n,
    SEASERPENT: 0x40000n,
    'SEA SERPENT': 0x40000n,
    REPTILE: 0x80000n,
    PSYCHIC: 0x100000n,
    DIVINEBEAST: 0x200000n,
    'DIVINE-BEAST': 0x200000n,
    CREATORGOD: 0x400000n,
    WYRM: 0x800000n,
    CYBERSE: 0x1000000n,
    ILLUSION: 0x2000000n
};

// Archetype setcodes for cards that only exist in Supabase (newer than the cards.cdb snapshot). A card belongs to the
// archetypes its name contains, so the name is matched against the engine's SET_* constants ("SET_HECAHANDS" ->
// "hecahands"). A constant whose words never appear in the names of the cards.cdb cards that carry it is named
// differently from its archetype (D/D, U.A. ...) and is not used.
const normalizeForSetMatch = (name) => ` ${String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
let setNameIndex = null;
function getSetNameIndex() {
    if (setNameIndex) return setNameIndex;
    setNameIndex = [];
    let src = '';
    try { src = fs.readFileSync(path.join(SCRIPT_DIR, 'archetype_setcode_constants.lua'), 'utf8'); } catch { return setNameIndex; }
    const byCode = new Map();
    for (const m of src.matchAll(/^SET_([A-Z0-9_]+)\s*=\s*0x([0-9a-fA-F]+)/gm)) {
        const words = ` ${m[1].toLowerCase().replace(/_/g, ' ')} `;
        if (words.trim().length >= 2) byCode.set(parseInt(m[2], 16), words);
    }
    const carriers = new Map(); // code -> [cards carrying it, of which named with the words]
    for (const row of db.prepare('SELECT CAST(datas.setcode AS TEXT) AS setcode, texts.name FROM datas JOIN texts ON datas.id = texts.id WHERE datas.setcode != 0').all()) {
        const name = normalizeForSetMatch(row.name);
        for (const code of parseSetcodes(row.setcode)) {
            const words = byCode.get(code);
            if (!words) continue;
            const c = carriers.get(code) || [0, 0];
            c[0]++;
            if (name.includes(words)) c[1]++;
            carriers.set(code, c);
        }
    }
    for (const [code, words] of byCode) {
        const c = carriers.get(code);
        if (!c || c[1] > 0) setNameIndex.push({ code, words });
    }
    return setNameIndex;
}

export function deriveSetcodeFromName(name) {
    const n = normalizeForSetMatch(name);
    let codes = getSetNameIndex().filter(s => n.includes(s.words)).map(s => s.code);
    // "Destiny HERO" (0xc008) already counts as "HERO" (0x8): keep the most specific code of a family
    codes = codes.filter(c => !codes.some(o => o !== c && (o & 0xfff) === (c & 0xfff) && (o & 0xf000) !== 0 && (c & 0xf000) === 0));
    return codes.slice(0, 4).reduce((acc, c, i) => acc | (BigInt(c) << BigInt(16 * i)), 0n);
}

// Supabase has a card's Link Rating but not its arrows: YGOProDeck's linkmarkers, as the cards.cdb bitmask
const LINK_MARKER_BITS = { 'Bottom-Left': 0x1, 'Bottom': 0x2, 'Bottom-Right': 0x4, 'Left': 0x8, 'Right': 0x20, 'Top-Left': 0x40, 'Top': 0x80, 'Top-Right': 0x100 };
async function fetchLinkMarkers(passcode) {
    try {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${Number(passcode)}`);
        if (!res.ok) return 0;
        const markers = (await res.json())?.data?.[0]?.linkmarkers || [];
        return markers.reduce((acc, m) => acc | (LINK_MARKER_BITS[m] || 0), 0);
    } catch {
        return 0;
    }
}

export function parseSupabaseRow(row, linkMarkers = 0) {
    if (!row || !row.passcode) return null;
    const passcode = Number(row.passcode);
    const cardtype = (row.cardtype || '');
    const desc = (row.description || '');

    let type = 0;
    if (/monster/i.test(cardtype)) {
        type |= 0x1; // TYPE_MONSTER
        if (/effect/i.test(cardtype)) type |= 0x20;
        if (/fusion/i.test(cardtype)) type |= 0x40;
        if (/ritual/i.test(cardtype)) type |= 0x80;
        if (/synchro/i.test(cardtype)) type |= 0x2000;
        if (/xyz/i.test(cardtype)) type |= 0x800000;
        if (/pendulum/i.test(cardtype)) type |= 0x1000000;
        if (/link/i.test(cardtype)) type |= 0x4000000;
        // Supabase calls every Link Monster "Link Monster": text past the materials line makes it an Effect Monster
        if (/link/i.test(cardtype) && desc.split(/\r?\n/).filter(l => l.trim()).length > 1) type |= 0x20;
        if (/toon/i.test(cardtype) || /"toon"/i.test(row.cardname)) type |= 0x400000;
        if (/(cannot be normal summoned|must be special summoned)/i.test(desc)) type |= 0x2000000; // TYPE_SPECIAL
    } else if (/spell/i.test(cardtype)) {
        type |= 0x2; // TYPE_SPELL
        const prop = (row.property || '');
        if (/quick/i.test(prop)) type |= 0x10000;
        if (/continuous/i.test(prop)) type |= 0x20000;
        if (/equip/i.test(prop)) type |= 0x40000;
        if (/field/i.test(prop)) type |= 0x80000;
        if (/ritual/i.test(prop)) type |= 0x80;
    } else if (/trap/i.test(cardtype)) {
        type |= 0x4; // TYPE_TRAP
        const prop = (row.property || '');
        if (/continuous/i.test(prop)) type |= 0x20000;
        if (/counter/i.test(prop)) type |= 0x100000;
    }

    const attrKey = (row.attribute || '').toUpperCase().trim();
    const attribute = ATTRIBUTE_MAP[attrKey] || 0;

    const raceKey = (row.types || '').toUpperCase().trim();
    const race = RACE_MAP[raceKey] || 0n;

    const atk = row.atk != null ? Number(row.atk) : 0;
    const isLink = (type & 0x4000000) !== 0;
    // cards.cdb keeps a Link Monster's rating in level and its arrows in def
    const def = isLink ? linkMarkers : row.def != null ? Number(row.def) : 0;
    const level = isLink ? Number(row.link) || 0 : row.level != null ? Number(row.level) : 0;
    const derived = deriveSetcodeFromName(row.cardname);
    const setcode = derived !== 0n ? derived : (/toon/i.test(row.cardname) || /toon/i.test(cardtype)) ? 0x62 : 0;

    // Persist in local SQLite cards.cdb so all subsequent lookups are synchronous and native
    try {
        stmtInsertData.run(passcode, 3, 0, setcode, type, atk, def, level, Number(race), attribute, 0);
        stmtInsertText.run(passcode, row.cardname, desc);
    } catch (e) {
        // Ignore write conflicts
    }

    return {
        code: passcode,
        alias: 0,
        setcodes: parseSetcodes(setcode),
        type,
        level,
        attribute,
        race,
        attack: atk,
        defense: isLink ? 0 : def,
        lscale: 0,
        rscale: 0,
        link_marker: isLink ? def : 0,
        name: row.cardname
    };
}

/**
 * Finds a real TCG/OCG card matching a generic description ({ kind: 'monster'|'spell'|'trap', minLevel, maxLevel,
 * level, attribute, race (bigint), tuner, nonTuner, normal, nameLike }), for costs a write-up doesn't name ("discarding a
 * Level 5+ DARK"). Vanilla Normal Monsters and plain Normal Spells/Traps first: a filler card with no effects of
 * its own can't change the line. Returns a card code, or null.
 */
export function findCardMatching(spec, excludeCodes = []) {
    if (!spec) return null;
    const where = ['datas.ot IN (1, 2, 3)', 'datas.alias = 0', '(datas.type & 0x4000) = 0'];
    const params = [];
    if (spec.kind === 'spell') where.push('(datas.type & 0x2) != 0');
    else if (spec.kind === 'trap') where.push('(datas.type & 0x4) != 0');
    else where.push('(datas.type & 0x1) != 0', '(datas.type & 0x4802040) = 0');
    if (spec.level != null) { where.push('(datas.level & 0xff) = ?'); params.push(spec.level); }
    if (spec.minLevel != null) { where.push('(datas.level & 0xff) >= ?'); params.push(spec.minLevel); }
    if (spec.maxLevel != null) { where.push('(datas.level & 0xff) <= ?'); params.push(spec.maxLevel); }
    if (spec.attribute) { where.push('datas.attribute = ?'); params.push(spec.attribute); }
    if (spec.race) { where.push('(CAST(datas.race AS INTEGER) & ?) != 0'); params.push(Number(spec.race)); }
    if (spec.tuner) where.push('(datas.type & 0x1000) != 0');
    if (spec.nonTuner) where.push('(datas.type & 0x1000) = 0');
    if (spec.normal) where.push('(datas.type & 0x10) != 0');
    if (spec.nameLike) { where.push('LOWER(texts.name) LIKE ?'); params.push(`%${spec.nameLike.toLowerCase()}%`); }
    if (excludeCodes.length > 0) where.push(`datas.id NOT IN (${excludeCodes.map(() => '?').join(', ')})`);
    params.push(...excludeCodes);
    const sql = `SELECT datas.id FROM datas JOIN texts ON datas.id = texts.id WHERE ${where.join(' AND ')}
        ORDER BY (datas.type IN (17, 2, 4)) DESC, ((datas.type & 0x1000000) != 0) ASC, datas.id ASC LIMIT 1`;
    try {
        return db.prepare(sql).get(...params)?.id ?? null;
    } catch {
        return null;
    }
}

// Longest first, so "Winged Beast" and "Beast-Warrior" win over "Beast" and "Warrior"
const RACE_NAMES = Object.keys(RACE_MAP)
    .filter(k => !/^(?:WINGEDBEAST|BEASTWARRIOR|SEASERPENT|DIVINEBEAST|CREATORGOD)$/.test(k))
    .sort((a, b) => b.length - a.length);

/**
 * Reads a generic card description from a write-up ("Level 5+ DARK", "LIGHT Fairy monster", "Tuner", "Trap",
 * "\"Infernoid\" monster") into a findCardMatching spec. Returns null when nothing narrows it down ("card",
 * "monster"): any card in hand will do then.
 */
export function parseCardDescription(desc) {
    const raw = cleanCardName(desc).trim();
    if (!raw) return null;
    const spec = { kind: 'monster' };
    let specific = false;
    const lv = raw.match(/\blevel\s*(\d+)\s*(\+|or\s+(?:higher|more|above)|or\s+(?:lower|less|below))?/i);
    if (lv) {
        const n = Number(lv[1]);
        if (!lv[2]) spec.level = n;
        else if (/\+|higher|more|above/i.test(lv[2])) spec.minLevel = n;
        else spec.maxLevel = n;
        specific = true;
    }
    // Write-ups capitalize Attributes; a lowercase "Dark" is usually part of a card name (unless after "any ")
    const attr = /^any\s+/i.test(raw)
        ? raw.match(/\b(LIGHT|DARK|EARTH|WATER|FIRE|WIND|DIVINE)\b/i)
        : raw.match(/\b(LIGHT|DARK|EARTH|WATER|FIRE|WIND|DIVINE)\b/);
    if (attr) {
        spec.attribute = ATTRIBUTE_MAP[attr[1].toUpperCase()];
        specific = true;
    }
    for (const r of RACE_NAMES) {
        if (new RegExp(`\\b${r.replace('-', '[- ]')}s?\\b`, 'i').test(raw)) {
            spec.race = RACE_MAP[r];
            specific = true;
            break;
        }
    }
    if (/\bnon-?tuners?\b/i.test(raw)) { spec.nonTuner = true; specific = true; }
    else if (/\btuners?\b/i.test(raw)) { spec.tuner = true; specific = true; }
    if (/\bnormal monsters?\b/i.test(raw)) { spec.normal = true; specific = true; }
    const quoted = raw.match(/"([^"]{3,})"/);
    if (quoted) { spec.nameLike = quoted[1]; specific = true; }
    if (/\bspells?\b/i.test(raw) && !/\bspellcasters?\b/i.test(raw)) { spec.kind = 'spell'; specific = true; }
    else if (/\btraps?\b/i.test(raw)) { spec.kind = 'trap'; specific = true; }
    return specific ? spec : null;
}

const GENERIC_NON_CARD_RE = /^(?:this|that|it|its|her|his|their|your|my|our|any|another|other|one|two|three|both|all|some|each|every|either|neither|a\s+|an\s+|the\s+(?:field|deck|gy|graveyard|hand|extra|first|second|third|other|same|combo|turn|effect|monster|spell|trap|ritual|fusion|synchro|xyz|link)|extra deck|main phase|battle phase|end phase|opponent|level\s+\d|rank\s+\d|link-\d|normal monster|effect monster|ritual monster|fusion monster|synchro monster|xyz monster|link monster|pendulum monster|tuner|non-tuner|monster|monsters|spell|spells|trap|traps|card|cards|effect|effects|token|scale|scales|material|materials|starter|extender|target|cost|itself|herself|himself|themselves)\b/i;

export async function resolveCardAsync(nameOrCode) {
    if (!nameOrCode) return null;

    // 1. Try local SQLite cards.cdb
    if (typeof nameOrCode === 'number' || /^\d{5,8}$/.test(String(nameOrCode).trim())) {
        const found = getCardByCode(nameOrCode);
        if (found) return found;
    } else {
        const rawClean = cleanCardName(nameOrCode).replace(/^["']+|["']+$/g, '').trim();
        if (!rawClean) return null;
        // An exact card name wins over the generic-word filter: "My Friend Purrely" is a card, "my field" is not
        const exact = getCardByName(rawClean);
        if (exact) return exact;
        // Some official names keep their quotation marks: "A Case for K9"
        const quoted = getCardByName(`"${rawClean}"`);
        if (quoted) return quoted;
        // "Spell Shattering Sword" starts with a generic word but is a card newer than cards.cdb: a name of three or more
        // capitalised words still gets the exact Supabase lookup below (never the local LIKE match)
        const genericStart = GENERIC_NON_CARD_RE.test(rawClean);
        if (genericStart && !/^[A-Z]\S*(?:\s+[A-Z0-9"'(]\S*){2,}$/.test(rawClean)) return null;

        if (!genericStart) {
            const strippedPossessive = rawClean
                .replace(/\s*'s(?:\s+(?:monster|gy|graveyard|hand|field|scale|on-summon|summon|quick|second|first|other))?(?:\s+effect)?$/i, '')
                .replace(/\s+effect$/i, '')
                .trim();
            if (!strippedPossessive || GENERIC_NON_CARD_RE.test(strippedPossessive)) return null;

            if (strippedPossessive !== rawClean) {
                const exactStripped = getCardByName(strippedPossessive);
                if (exactStripped) return exactStripped;
            }

            if (strippedPossessive.length >= 4) {
                const likeRow = stmtByNameLike.get(`%${strippedPossessive.toLowerCase()}%`);
                if (likeRow) return formatCardData(likeRow);
            }
        }
    }

    // 2. Query Supabase
    try {
        let url;
        if (typeof nameOrCode === 'number' || /^\d{5,8}$/.test(String(nameOrCode).trim())) {
            url = `${SUPABASE_URL}/rest/v1/cards?passcode=eq.${Number(nameOrCode)}&select=*`;
        } else {
            const clean = String(nameOrCode).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').trim();
            url = `${SUPABASE_URL}/rest/v1/cards?cardname=ilike.${encodeURIComponent(clean)}&select=*`;
        }

        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (res.ok) {
            const rows = await res.json();
            if (rows && rows.length > 0) {
                // "Maliss Dormouse" is "Maliss <P> Dormouse" in cards.cdb: keep that ProjectIgnis row, since overwriting
                // it dropped the Link Rating, arrows, setcodes and effect strings the engine needs
                const local = getCardByCode(rows[0].passcode);
                if (local && !isSupabaseCached(rows[0].passcode)) return local;
                return parseSupabaseRow(rows[0], /link/i.test(rows[0].cardtype || '') ? await fetchLinkMarkers(rows[0].passcode) : 0);
            }
        }
    } catch (err) {
        // Fall through on network failure
    }

    return null;
}

// Script names already looked up remotely and not found, so one audit run doesn't re-request them for every combo
const missingScripts = new Set();

export function isScriptMissing(scriptName) {
    return missingScripts.has(scriptName);
}

export async function getScript(scriptName) {
    const localPath = path.join(SCRIPT_DIR, scriptName);
    if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath, 'utf8');
    }
    if (missingScripts.has(scriptName)) return '';

    // Vanilla Normal Monsters have no script file (Normal Pendulum Monsters do, for their Pendulum procedure)
    const codeMatch = scriptName.match(/^c(\d+)\.lua$/);
    if (codeMatch) {
        const card = getCardByCode(codeMatch[1]);
        if (card && (card.type & 0x1) && (card.type & 0x10) && !(card.type & 0x1000000)) {
            missingScripts.add(scriptName);
            return '';
        }
    }

    // Determine remote path in ProjectIgnis/CardScripts. Card scripts live in official/, but some current cards are
    // filed elsewhere: Red-Eyes Darkness Metal Dragon's errata'd text is pre-errata/c88264978.lua, new cards sit in pre-release/
    const base = 'https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master';
    const urls = /^c\d+\.lua$/.test(scriptName)
        ? [`${base}/official/${scriptName}`, `${base}/pre-release/${scriptName}`, `${base}/pre-errata/${scriptName}`]
        : [`${base}/${scriptName}`];

    try {
        for (const url of urls) {
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                fs.writeFileSync(localPath, text, 'utf8');
                return text;
            }
        }

        // If card script not found under primary code, check if it has an alias
        const match = scriptName.match(/^c(\d+)\.lua$/);
        if (match) {
            const card = getCardByCode(match[1]);
            if (card && card.alias && card.alias !== card.code) {
                const aliasScript = await getScript(`c${card.alias}.lua`);
                if (aliasScript) {
                    fs.writeFileSync(localPath, aliasScript, 'utf8');
                    return aliasScript;
                }
            }
        }
        missingScripts.add(scriptName);
        return '';
    } catch (err) {
        console.warn(`[getScript] Error fetching ${scriptName}:`, err.message);
        return '';
    }
}

// Load WebAssembly module exports
const wasmModule = await import(WASM_INDEX);
export const {
    default: createCore,
    OcgAttribute,
    OcgCardHintType,
    OcgDuelMode,
    OcgEffectClientMode,
    OcgHintTiming,
    OcgHintType,
    OcgLinkMarker,
    OcgLocation,
    OcgLogType,
    OcgMessageType,
    OcgOpCode,
    OcgPhase,
    OcgPlayerHintType,
    OcgPosition,
    OcgProcessResult,
    OcgQueryFlags,
    OcgRPS,
    OcgRace,
    OcgResponseType,
    OcgScope,
    OcgType,
    SelectBattleCMDAction,
    SelectIdleCMDAction,
    cardMatchesOpcode,
    ocgMessageTypeStrings,
    responseTypeStrings,
    selectBattleCMDActionStrings,
    selectIdleCMDActionStrings
} = wasmModule;

let coreInstance = null;

export async function getCoreInstance() {
    if (!coreInstance) {
        coreInstance = await createCore({ sync: true });
    }
    return coreInstance;
}

const CORE_PROC_SCRIPTS = [
    'constant.lua',
    'archetype_setcode_constants.lua',
    'card_counter_constants.lua',
    'utility.lua',
    'proc_fusion.lua',
    'proc_fusion_spell.lua',
    'proc_synchro.lua',
    'proc_xyz.lua',
    'proc_link.lua',
    'proc_ritual.lua',
    'proc_pendulum.lua',
    'proc_equip.lua',
    'proc_normal.lua',
    'proc_union.lua',
    'proc_gemini.lua',
    'proc_spirit.lua',
    'chain.lua',
    'cards_specific_functions.lua'
];

export async function createDuelInstance(options = {}) {
    const lib = await getCoreInstance();

    // Ensure core scripts are loaded into memory
    const coreScriptMap = new Map();
    for (const name of CORE_PROC_SCRIPTS) {
        let content = await getScript(name);
        coreScriptMap.set(name, content);
    }

    const duel = lib.createDuel({
        flags: options.flags || OcgDuelMode.MODE_MR5,
        seed: options.seed || [1n, 1n, 1n, 1n],
        team1: options.team1 || { startingLP: 8000, startingDrawCount: 0, drawCountPerTurn: 1 },
        team2: options.team2 || { startingLP: 8000, startingDrawCount: 0, drawCountPerTurn: 0 },
        cardReader: (code) => {
            if (options.cardReader) {
                const custom = options.cardReader(code);
                if (custom) return custom;
            }
            const card = getCardByCode(code);
            if (card) return card;
            // Fallback for dynamically spawned Tokens (e.g., Duel.CreateToken with custom/unindexed Token passcodes)
            const tokenFallback = {
                code: Number(code),
                name: 'Token',
                desc: 'Special Summoned with the effect of a card.',
                alias: 0,
                setcodes: [],
                type: 0x4011, // TYPE_MONSTER | TYPE_NORMAL | TYPE_TOKEN
                level: 1,
                attribute: 1,
                race: 1n,
                attack: 0,
                defense: 0,
                lscale: 0,
                rscale: 0,
                link_marker: 0
            };
            dynamicTokens.set(Number(code), tokenFallback);
            return tokenFallback;
        },
        scriptReader: (scriptName) => {
            if (coreScriptMap.has(scriptName)) {
                return coreScriptMap.get(scriptName);
            }
            // Synchronous read for already-cached card scripts
            const localPath = path.join(SCRIPT_DIR, scriptName);
            if (fs.existsSync(localPath)) {
                return fs.readFileSync(localPath, 'utf8');
            }
            return '';
        },
        errorHandler: options.errorHandler || ((type, text) => {
            if (type === 0 || type === 2) {
                console.warn('[Engine Warning]', text);
            }
        })
    });

    if (!duel) {
        throw new Error('Failed to create ocgcore duel instance');
    }

    // Load base library and procedure scripts into engine
    for (const name of CORE_PROC_SCRIPTS) {
        const content = coreScriptMap.get(name);
        if (content) {
            lib.loadScript(duel, name, content);
        }
    }

    return { lib, duel };
}
