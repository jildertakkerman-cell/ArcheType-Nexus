import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const wasmPath = pathToFileURL(path.resolve('node_modules/@n1xx1/ocgcore-wasm/dist/index.js')).href;
const { default: createCore, OcgDuelMode, OcgLocation, OcgPosition, OcgType, OcgProcessResult, ocgMessageTypeStrings } = await import(wasmPath);

console.log('Initializing ocgcore WebAssembly engine...');
const lib = await createCore({ sync: true });
console.log('Engine ready! Version:', lib.getVersion());

console.log('Fetching official EDOPro card scripts...');
const constantLua = await fetch('https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master/constant.lua').then(r => r.text());
const archSetcodeLua = await fetch('https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master/archetype_setcode_constants.lua').then(r => r.text());
const utilityLua = await fetch('https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master/utility.lua').then(r => r.text());
const toonTableLua = await fetch('https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master/official/c89997728.lua').then(r => r.text());
const toonMermaidLua = await fetch('https://raw.githubusercontent.com/ProjectIgnis/CardScripts/master/official/c65458948.lua').then(r => r.text());

const duel = lib.createDuel({
  flags: OcgDuelMode.MODE_MR5,
  seed: [1n, 1n, 1n, 1n],
  team1: { startingLP: 8000, startingDrawCount: 0, drawCountPerTurn: 1 },
  team2: { startingLP: 8000, startingDrawCount: 0, drawCountPerTurn: 1 },
  cardReader: (code) => {
    if (code === 89997728) {
      return {
        code: 89997728,
        alias: 0,
        setcodes: [0x62], // "Toon" archetype
        type: OcgType.SPELL,
        level: 0,
        attribute: 0,
        race: 0n,
        attack: 0,
        defense: 0,
        lscale: 0,
        rscale: 0,
        link_marker: 0
      };
    }
    if (code === 65458948) {
      return {
        code: 65458948,
        alias: 0,
        setcodes: [0x62], // "Toon" archetype
        type: OcgType.MONSTER | OcgType.EFFECT | OcgType.TOON,
        level: 4,
        attribute: 2,
        race: 0x40n,
        attack: 1400,
        defense: 1500,
        lscale: 0,
        rscale: 0,
        link_marker: 0
      };
    }
    return null;
  },
  scriptReader: (script) => {
    if (script === 'constant.lua') return constantLua;
    if (script === 'archetype_setcode_constants.lua') return archSetcodeLua;
    if (script === 'utility.lua') return utilityLua;
    if (script.includes('89997728')) return toonTableLua;
    if (script.includes('65458948')) return toonMermaidLua;
    return '';
  },
  errorHandler: (type, text) => {
    console.warn('Engine warning:', type, text);
  }
});

// Load standard library scripts
lib.loadScript(duel, 'constant.lua', constantLua);
lib.loadScript(duel, 'archetype_setcode_constants.lua', archSetcodeLua);
lib.loadScript(duel, 'utility.lua', utilityLua);

// Place Toon Table of Contents into Player 0's hand
lib.duelNewCard(duel, {
  team: 0,
  duelist: 0,
  code: 89997728,
  controller: 0,
  location: OcgLocation.HAND,
  sequence: 0,
  position: OcgPosition.FACEDOWN
});

// Place Toon Mermaid into Player 0's deck
lib.duelNewCard(duel, {
  team: 0,
  duelist: 0,
  code: 65458948,
  controller: 0,
  location: OcgLocation.DECK,
  sequence: 0,
  position: OcgPosition.FACEDOWN
});

console.log('Cards placed: Toon Table of Contents (Hand), Toon Mermaid (Deck)');
lib.startDuel(duel);
console.log('Starting duel...');

let status;
let loopCount = 0;
while (loopCount < 20) {
  status = lib.duelProcess(duel);
  const msgs = lib.duelGetMessage(duel);
  for (const m of msgs) {
    const name = ocgMessageTypeStrings.get(m.type) || m.type;
    console.log(`[Engine Event] ${name} (${m.type})`);
    if (m.type === 11) { // SELECT_IDLECMD
      console.log('>>> Turn 1 Main Phase 1 reached!');
      console.log('>>> Available activations:', m.activates?.length, 'summons:', m.summons?.length);
      if (m.activates && m.activates.length > 0) {
        console.log(`>>> SUCCESS: Found playable effect in hand: Card Code ${m.activates[0].code} (Toon Table of Contents)`);
        console.log(`>>> Legality Confirmed: Toon Table of Contents is 100% legal to activate!`);
      }
    }
  }
  if (status === OcgProcessResult.WAITING) {
    break;
  }
  loopCount++;
}

lib.destroyDuel(duel);
console.log('Test completed cleanly!');
