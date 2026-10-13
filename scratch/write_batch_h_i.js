const fs = require('fs');
const path = require('path');
const decks = require('./validate_batch_h_i.js');

const targetDir = path.resolve('assets/data/decklists');
const indexPath = path.resolve(targetDir, 'index.json');

// Write each deck file
for (const d of decks) {
  const filePath = path.join(targetDir, d.slug);
  const deckData = {
    archetype: d.archetype,
    title: d.title,
    status: d.status,
    reviewed: d.reviewed,
    match: d.match,
    summary: d.summary,
    allow: d.allow,
    exclude: d.exclude || {},
    main: d.main,
    extra: d.extra,
    fill: d.fill
  };
  fs.writeFileSync(filePath, JSON.stringify(deckData, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${d.slug}`);
}

// Update index.json
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const mappings = {
  "Hand": "hand.json",
  "Hazy Flame": "hazy-flame.json",
  "Helios": "helios.json",
  "Heraldic Beast": "heraldic-beast.json",
  "Heraldic": "heraldic-beast.json",
  "Hex Sealed Fusion": "hex-sealed-fusion.json",
  "Hex-Sealed Fusion": "hex-sealed-fusion.json",
  "Horn of Heaven": "horn-of-heaven.json",
  "Hunder": "hunder.json",
  "Igknight": "igknight.json",
  "Imperial traps": "imperial-traps.json",
  "Imperial Traps": "imperial-traps.json",
  "Inca": "inca.json",
  "Infernal Flame": "infernal-flame.json",
  "Inpachi": "inpachi.json",
  "Iron Chain": "iron-chain.json"
};

for (const [k, v] of Object.entries(mappings)) {
  index[k] = v;
}

// Sort index alphabetically by keys (case-insensitive)
const sortedKeys = Object.keys(index).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
const sortedIndex = {};
for (const k of sortedKeys) {
  sortedIndex[k] = index[k];
}

fs.writeFileSync(indexPath, JSON.stringify(sortedIndex, null, 4) + '\n', 'utf8');
console.log('Successfully updated assets/data/decklists/index.json with all mappings!');
