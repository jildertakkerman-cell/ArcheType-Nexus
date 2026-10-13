const fs = require('fs');
const path = require('path');
const decks = require('./validate_batch_e_f.js');

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
  "Ecclesia": "ecclesia.json",
  "Egyptian God": "egyptian-god.json",
  "Empowered Warrior": "empowered-warrior.json",
  "End of the World": "end-of-the-world.json",
  "Engine Token": "engine-token.json",
  "Entity": "entity.json",
  "Exchange of the Spirit": "exchange-of-the-spirit.json",
  "Fairy Tale": "fairy-tail.json",
  "Felgrand": "felgrand.json",
  "Feral Imp": "feral-imp.json",
  "Flamvell": "flamvell.json",
  "From the Underworld": "from-the-underworld.json",
  "Fusion": "fusion.json"
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
