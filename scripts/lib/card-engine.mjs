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

export function formatCardData(row) {
    if (!row) return null;
    const isLink = (row.type & 0x4000000) !== 0; // TYPE_LINK = 0x4000000
    const isPendulum = (row.type & 0x1000000) !== 0; // TYPE_PENDULUM = 0x1000000
    return {
        code: row.id,
        alias: row.alias || 0,
        setcodes: parseSetcodes(row.setcode),
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

export function getCardByCode(code) {
    const row = stmtByCode.get(Number(code));
    return formatCardData(row);
}

export function getCardByName(name) {
    const row = stmtByName.get(name.trim());
    return formatCardData(row);
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

export function parseSupabaseRow(row) {
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
    const def = row.def != null ? Number(row.def) : 0;
    const level = row.level != null ? Number(row.level) : 0;
    const setcode = (/toon/i.test(row.cardname) || /toon/i.test(cardtype)) ? 0x62 : 0;

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
        setcodes: setcode ? [setcode] : [],
        type,
        level,
        attribute,
        race,
        attack: atk,
        defense: def,
        lscale: 0,
        rscale: 0,
        link_marker: 0,
        name: row.cardname
    };
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
        if (!rawClean || GENERIC_NON_CARD_RE.test(rawClean)) return null;

        const exact = getCardByName(rawClean);
        if (exact) return exact;

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
                return parseSupabaseRow(rows[0]);
            }
        }
    } catch (err) {
        // Fall through on network failure
    }

    return null;
}

export async function getScript(scriptName) {
    const localPath = path.join(SCRIPT_DIR, scriptName);
    if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath, 'utf8');
    }

    // Determine remote path in ProjectIgnis/CardScripts
    const url = /^c\d+\.lua$/.test(scriptName)
        ? `https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master/official/${scriptName}`
        : `https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master/${scriptName}`;

    try {
        const res = await fetch(url);
        if (res.ok) {
            const text = await res.text();
            fs.writeFileSync(localPath, text, 'utf8');
            return text;
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
            return getCardByCode(code);
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
