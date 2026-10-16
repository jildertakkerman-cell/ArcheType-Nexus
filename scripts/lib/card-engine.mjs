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
const stmtByCode = db.prepare('SELECT datas.*, texts.name FROM datas JOIN texts ON datas.id = texts.id WHERE datas.id = ?');
const stmtByName = db.prepare('SELECT datas.*, texts.name FROM datas JOIN texts ON datas.id = texts.id WHERE LOWER(texts.name) = LOWER(?) LIMIT 1');

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
        level: isLink ? 0 : (row.level & 0xff),
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
        team2: options.team2 || { startingLP: 8000, startingDrawCount: 0, drawCountPerTurn: 1 },
        cardReader: (code) => {
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
