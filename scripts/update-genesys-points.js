// scripts/update-genesys-points.js
// Fetches both Genesys format points and banlist updates from the YGOPRODeck API,
// updates assets/data/genesys_points.json and assets/data/banlist.json,
// and preserves all alternative spellings, aliases, and custom/manual entries.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'assets', 'data');
const GENESYS_FILE = path.join(DATA_DIR, 'genesys_points.json');
const BANLIST_FILE = path.join(DATA_DIR, 'banlist.json');

// Helper to delay between requests to stay well below YGOPRODeck's 20 req/s rate limit
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`API returned ${res.status} ${res.statusText} for ${url}`);
    }
    return res.json();
}

/**
 * Predefined bidirectional alias groups for cards with known alternative spellings.
 * Any card in a group will share the exact same banlist status as its counterpart.
 */
const KNOWN_ALIASES = [
    // Maliss cards (both with and without code letters <P> / <Q>)
    ['Maliss <Q> White Binder', 'Maliss White Binder'],
    ['Maliss <P> Dormouse', 'Maliss Dormouse'],
    ['Maliss <P> White Rabbit', 'Maliss White Rabbit'],
    ['Maliss <Q> Red Ransom', 'Maliss Red Ransom'],
    ['Maliss <P> March Hare', 'Maliss March Hare'],
    ['Maliss <P> Chessy Cat', 'Maliss Chessy Cat'],

    // Yummy cards (with star, hollow star, and clean spaces)
    ['Cupsy★Yummy', 'Cupsy☆Yummy', 'Cupsy Yummy'],
    ['Cupsy★Yummy Way', 'Cupsy☆Yummy Way', 'Cupsy Yummy Way'],
    ['Yummy★Snatchy', 'Yummy☆Snatchy', 'Yummy Snatchy'],
    ['Marshmao☆Yummy', 'Marshmao★Yummy', 'Marshmao Yummy'],

    // K9 cards
    ['"A Case for K9"', 'A Case for K9'],
    ['K9-66A Jokul', 'K9-66a Jokul'],

    // CXYZ / CXyz
    ['CXYZ Gimmick Puppet Fanatix Machinix', 'CXyz Gimmick Puppet Fanatix Machinix']
];

/**
 * Returns all equivalent aliases/spellings for a given card name.
 */
function getAliases(name) {
    const aliases = new Set([name]);

    // 1. Predefined alias groups
    for (const group of KNOWN_ALIASES) {
        if (group.some(n => n.toLowerCase() === name.toLowerCase())) {
            group.forEach(n => aliases.add(n));
        }
    }

    // 2. Pattern: Maliss <X> -> Maliss
    if (/Maliss <[A-Z]> /i.test(name)) {
        aliases.add(name.replace(/Maliss <[A-Z]> /i, 'Maliss '));
    }

    // 3. Pattern: Stars ★ or ☆
    if (name.includes('★') || name.includes('☆')) {
        aliases.add(name.replace(/[★☆]/g, ' ').replace(/\s+/g, ' ').trim());
        aliases.add(name.replace(/[★☆]/g, '★'));
        aliases.add(name.replace(/[★☆]/g, '☆'));
    }

    // 4. Pattern: Quotes
    if (name.startsWith('"') && name.endsWith('"')) {
        aliases.add(name.slice(1, -1));
    } else if (name === 'A Case for K9') {
        aliases.add('"A Case for K9"');
    }

    // 5. Pattern: CXYZ / CXyz
    if (name.startsWith('CXYZ ')) {
        aliases.add(name.replace('CXYZ ', 'CXyz '));
    } else if (name.startsWith('CXyz ')) {
        aliases.add(name.replace('CXyz ', 'CXYZ '));
    }

    return [...aliases];
}

/**
 * Update Genesys Points for TCG and OCG
 */
async function updateGenesysPoints() {
    console.log('\n--- Updating Genesys Points ---');
    const fetchPoints = async (formatParam, pointsKey) => {
        console.log(`Fetching Genesys points for format: ${formatParam}...`);
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?format=${encodeURIComponent(formatParam)}&misc=yes`;
        const json = await fetchJson(url);
        const map = {};
        if (Array.isArray(json.data)) {
            for (const card of json.data) {
                const misc = card.misc_info && card.misc_info[0];
                const pts = misc ? misc[pointsKey] : undefined;
                if (typeof pts === 'number' && pts > 0) {
                    map[card.name] = pts;
                    // Also populate aliases in Genesys points so alternate spellings work
                    for (const alias of getAliases(card.name)) {
                        map[alias] = pts;
                    }
                }
            }
        }
        console.log(`  -> Saved ${Object.keys(map).length} card entries (including aliases) with > 0 points in ${formatParam}.`);
        return map;
    };

    const tcgMap = await fetchPoints('genesys', 'genesys_points');
    await sleep(300);
    const ocgMap = await fetchPoints('genesys ocg', 'genesys_ocg_points');

    const result = {
        lastUpdated: new Date().toISOString().split('T')[0],
        source: 'YGOPRODeck API v7',
        tcg: tcgMap,
        ocg: ocgMap
    };

    fs.writeFileSync(GENESYS_FILE, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Saved Genesys points to ${path.relative(process.cwd(), GENESYS_FILE)}`);
}

/**
 * Update Banlist data for TCG and OCG (preserving alternative spellings and custom cards)
 */
async function updateBanlistData() {
    console.log('\n--- Updating Banlist Data ---');
    let existingBanlist = {};
    if (fs.existsSync(BANLIST_FILE)) {
        try {
            existingBanlist = JSON.parse(fs.readFileSync(BANLIST_FILE, 'utf-8'));
        } catch (e) {
            console.warn('Could not parse existing banlist.json, starting fresh structure:', e.message);
        }
    }

    const processFormat = async (format) => {
        console.log(`Fetching and processing ${format.toUpperCase()} banlist...`);
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${format}`;
        const json = await fetchJson(url);

        const banKey = format === 'tcg' ? 'ban_tcg' : 'ban_ocg';
        const finalStatusMap = new Map();

        // 1. Populate from API response and expand aliases
        if (Array.isArray(json.data)) {
            for (const card of json.data) {
                const status = card.banlist_info && card.banlist_info[banKey];
                let listName = null;
                if (status === 'Forbidden' || status === 'Banned') listName = 'forbidden';
                else if (status === 'Limited') listName = 'limited';
                else if (status === 'Semi-Limited') listName = 'semiLimited';

                if (listName) {
                    finalStatusMap.set(card.name, listName);
                    for (const alias of getAliases(card.name)) {
                        if (!finalStatusMap.has(alias)) {
                            finalStatusMap.set(alias, listName);
                        }
                    }
                }
            }
        }

        // 2. Preserve custom / manually-maintained cards and alternative spellings
        // from the existing banlist if they are not explicitly overridden by the API.
        const existingFormat = existingBanlist[format] || {};
        for (const listName of ['forbidden', 'limited', 'semiLimited']) {
            const existingCards = existingFormat[listName] || [];
            for (const card of existingCards) {
                const aliases = getAliases(card);
                const isOverriddenByApi = aliases.some(a => finalStatusMap.has(a));
                if (!isOverriddenByApi) {
                    // Card is not in the API: preserve existing status along with its aliases
                    finalStatusMap.set(card, listName);
                    for (const alias of aliases) {
                        if (!finalStatusMap.has(alias)) {
                            finalStatusMap.set(alias, listName);
                        }
                    }
                }
            }
        }

        // 3. Separate into sorted arrays
        const forbidden = [];
        const limited = [];
        const semiLimited = [];

        for (const [name, st] of finalStatusMap.entries()) {
            if (st === 'forbidden') forbidden.push(name);
            else if (st === 'limited') limited.push(name);
            else if (st === 'semiLimited') semiLimited.push(name);
        }

        forbidden.sort((a, b) => a.localeCompare(b));
        limited.sort((a, b) => a.localeCompare(b));
        semiLimited.sort((a, b) => a.localeCompare(b));

        console.log(`  -> ${format.toUpperCase()}: ${forbidden.length} Forbidden, ${limited.length} Limited, ${semiLimited.length} Semi-Limited (aliases preserved).`);

        return { forbidden, limited, semiLimited };
    };

    const tcgLists = await processFormat('tcg');
    await sleep(300);
    const ocgLists = await processFormat('ocg');

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    // Merge into updated banlist structure
    const updatedBanlist = {
        lastUpdated: formattedDate,
        effectiveDate: existingBanlist.effectiveDate || formattedDate,
        source: existingBanlist.source || 'YGOPRODeck API v7',
        tcg: {
            effectiveDate: existingBanlist.tcg?.effectiveDate || formattedDate,
            source: existingBanlist.tcg?.source || 'https://www.yugioh-card.com/en/limited/',
            forbidden: tcgLists.forbidden,
            limited: tcgLists.limited,
            semiLimited: tcgLists.semiLimited
        },
        ocg: {
            effectiveDate: existingBanlist.ocg?.effectiveDate || formattedDate,
            source: existingBanlist.ocg?.source || 'https://www.yugioh-card.com/japan/event/deck_regulation/',
            forbidden: ocgLists.forbidden,
            limited: ocgLists.limited,
            semiLimited: ocgLists.semiLimited
        },
        // Preserve Master Duel and nextBanlist
        masterduel: existingBanlist.masterduel || {
            effectiveDate: formattedDate,
            source: 'Master Duel In-Game Notification',
            forbidden: [],
            limited: [],
            semiLimited: []
        }
    };

    if (existingBanlist.nextBanlist) {
        updatedBanlist.nextBanlist = existingBanlist.nextBanlist;
    }

    fs.writeFileSync(BANLIST_FILE, JSON.stringify(updatedBanlist, null, 2), 'utf-8');
    console.log(`Saved Banlist data to ${path.relative(process.cwd(), BANLIST_FILE)}`);
}

async function main() {
    try {
        console.log(`[Data Updater] Starting automated data update at ${new Date().toISOString()}...`);
        await updateGenesysPoints();
        await sleep(300);
        await updateBanlistData();
        console.log('\n[Data Updater] All updates completed successfully!\n');
    } catch (err) {
        console.error('\n[Data Updater] Failed to update data:', err);
        process.exit(1);
    }
}

main();
