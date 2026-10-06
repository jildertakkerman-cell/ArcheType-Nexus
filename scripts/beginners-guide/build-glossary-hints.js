// Builds assets/data/glossary-hints.json: the glossary words that deck pages turn into
// hints (assets/js/glossary-hints.js), with their one-line definitions from glossary.js.
// Usage: node scripts/beginners-guide/build-glossary-hints.js
//
// FORMS lists, per glossary entry, the exact text that may become a hint. Matching is
// case-sensitive: "Special Summon" and "Extra Deck" are written that way on the pages,
// and GY/OTK are abbreviations. A lowercase form also matches with a capital first
// letter at the start of a sentence. Entries left out are everyday words ("field",
// "set", "draw", "target", "support") whose plain meaning already works, and forms that
// pages often use figuratively (plain "chain" and "engine", "swing" as in "a resource swing",
// "simulator" for the site's own).
// MAX_ONE marks words so common on deck pages that one hint per page is enough.
const fs = require('fs');
const path = require('path');
const { terms, short, cats } = require('./glossary.js');

const FORMS = {
    'lp': ['LP'],
    'gy': ['GY'],
    'banish': ['banish', 'banishes', 'banished', 'banishing'],
    'main-deck': ['Main Deck'],
    'extra-deck': ['Extra Deck'],
    'side-deck': ['Side Deck', 'side deck', 'siding'],
    'backrow': ['backrow', 'back row'],
    'emz': ['EMZ', 'Extra Monster Zone', 'Extra Monster Zones'],
    'normal-summon': ['Normal Summon', 'Normal Summons', 'Normal Summoned', 'Normal Summoning', 'Tribute Summon', 'Tribute Summoned'],
    'special-summon': ['Special Summon', 'Special Summons', 'Special Summoned', 'Special Summoning'],
    'materials': ['material', 'materials', 'Synchro Material', 'Xyz Material', 'Xyz Materials', 'Fusion Material', 'Fusion Materials', 'Link Material', 'overlay unit', 'overlay units'],
    'tuner': ['Tuner', 'Tuners', 'non-Tuner', 'non-Tuners'],
    'levels': ['Link Rating'],
    'token': ['Token', 'Tokens'],
    'quick-play': ['Quick-Play Spell', 'Quick-Play Spells'],
    'continuous': ['Continuous Spell', 'Continuous Spells', 'Continuous Trap', 'Continuous Traps'],
    'counter-trap': ['Counter Trap', 'Counter Traps'],
    'field-spell': ['Field Spell', 'Field Spells'],
    'equip': ['Equip Spell', 'Equip Spells'],
    'flip': ['FLIP effect', 'Flip effect', 'flip effect'],
    'chain': ['Chain Link', 'Chain Links', 'chain link', 'chain links', 'chained'],
    'resolve': ['resolve', 'resolves', 'resolved', 'resolving'],
    'negate': ['negate', 'negates', 'negated', 'negating', 'negation', 'negations'],
    'quick-effect': ['Quick Effect', 'Quick Effects', 'quick effect', 'quick effects'],
    'trigger': ['trigger effect', 'trigger effects', 'Trigger Effect', 'Trigger Effects'],
    'ignition': ['ignition effect', 'ignition effects', 'Ignition Effect', 'Ignition Effects'],
    'spell-speed': ['Spell Speed', 'spell speed'],
    'hopt': ['HOPT', 'hard once per turn', 'Hard OPT', 'hard OPT'],
    'soft-opt': ['OPT', 'soft once per turn'],
    'target': ['non-targeting', 'untargetable'],
    'lock': ['locked into', 'summoning restriction', 'summoning restrictions', 'summoning lock'],
    'psct': ['PSCT'],
    'missing-timing': ['miss the timing', 'misses the timing', 'missed the timing', 'missing the timing'],
    'starter': ['starter', 'starters', 'one-card starter', 'one-card starters', '1-card starter', 'two-card combo', 'two-card combos'],
    'extender': ['extender', 'extenders'],
    'handtrap': ['handtrap', 'handtraps', 'hand trap', 'hand traps', 'hand-trap', 'hand-traps'],
    'board-breaker': ['board breaker', 'board breakers', 'board-breaker', 'board-breakers'],
    'boss': ['boss monster', 'boss monsters'],
    'non-engine': ['non-engine'],
    'searcher': ['searcher', 'searchers'],
    'floater': ['floater', 'floaters'],
    'staple': ['staple', 'staples'],
    'generic': ['generic', 'generics'],
    'tech': ['tech', 'tech card', 'tech cards', 'tech choice', 'tech choices'],
    'garnet': ['garnet', 'garnets'],
    'brick': ['brick', 'bricks', 'bricked', 'bricking'],
    'dead': ['dead card', 'dead cards', 'dead draw', 'dead draws'],
    'beatstick': ['beatstick', 'beatsticks', 'beater', 'beaters'],
    'vanilla': ['vanilla', 'vanillas'],
    'floodgate': ['floodgate', 'floodgates'],
    'interruption': ['interruption', 'interruptions', 'disruption', 'disruptions'],
    'omni-negate': ['omni-negate', 'omni-negates', 'omni negate', 'omninegate'],
    'wincon': ['wincon', 'wincons', 'win condition', 'win conditions'],
    'toolbox': ['toolbox'],
    'search': ['search', 'searches', 'searched', 'searching'],
    'dump': ['dump', 'dumps', 'dumped', 'dumping'],
    'mill': ['mill', 'mills', 'milled', 'milling'],
    'tribute': ['Tribute', 'Tributes', 'Tributed', 'Tributing'],
    'detach': ['detach', 'detaches', 'detached', 'detaching'],
    'pop': ['pop', 'pops', 'popped', 'popping'],
    'nuke': ['nuke', 'nukes', 'board wipe', 'board wipes'],
    'bounce': ['bounce', 'bounces', 'bounced', 'bouncing'],
    'spin': ['spin', 'spins', 'spun', 'spinning'],
    'revive': ['revive', 'revives', 'revived', 'reviving'],
    'recycle': ['recursion'],
    'excavate': ['excavate', 'excavates', 'excavated', 'excavating'],
    'crash': ['crash into', 'crashes into', 'crashing into'],
    'burn': ['burn', 'burn damage', 'burn deck'],
    'link-climb': ['Link climb', 'link climb', 'Link climbing', 'link climbing'],
    'rank-up': ['Rank-Up', 'rank-up', 'rank up', 'RUM'],
    'combo': ['combo', 'combos'],
    'going-first': ['going first', 'going second'],
    'end-board': ['end board', 'end boards', 'endboard', 'endboards'],
    'choke-point': ['choke point', 'choke points', 'chokepoint', 'chokepoints'],
    'bait': ['bait', 'baits', 'baited', 'baiting'],
    'play-through': ['play through', 'plays through', 'played through', 'playing through'],
    'otk': ['OTK', 'OTKs', 'FTK', 'one-turn kill', 'one turn kill'],
    'lethal': ['lethal'],
    'card-advantage': ['card advantage'],
    'overextend': ['overextend', 'overextends', 'overextending', 'overextended'],
    'grind': ['grind game', 'grind games', 'grindy'],
    'deck-styles': ['stun deck', 'stun decks', 'control deck', 'control decks', 'midrange'],
    'topdeck': ['topdeck', 'topdecks', 'topdecked', 'topdecking'],
    'win-more': ['win-more'],
    'power-creep': ['power creep'],
    'mirror': ['mirror match', 'mirror matches'],
    'deck-out': ['deck out', 'decks out', 'decked out'],
    'archetype': ['archetype', 'archetypes'],
    'meta': ['meta', 'metagame', 'off-meta'],
    'tier': ['tier list', 'Tier 0', 'Tier 1', 'Tier 2', 'rogue'],
    'netdeck': ['netdeck', 'netdecking'],
    'top': ['top cut', 'topped'],
    'tcg-ocg': ['TCG', 'OCG'],
    'md': ['Master Duel'],
    'banlist': ['banlist', 'Banlist', 'ban list', 'F&L'],
    'locals': ['locals'],
    'ots': ['OTS'],
    'big-events': ['YCS', 'WCQ', 'regionals', 'Regionals'],
    'structure-deck': ['Structure Deck', 'Structure Decks'],
    'singles': ['singles'],
    'sim': ['EDOPro', 'YGOPro']
};
const MAX_ONE = ['archetype', 'combo', 'search', 'negate', 'banish', 'special-summon', 'normal-summon', 'extra-deck', 'main-deck', 'gy', 'materials', 'chain', 'resolve', 'tcg-ocg', 'token', 'tuner', 'tribute', 'meta', 'banlist'];

const decode = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const catLabel = Object.fromEntries(cats.map(([id, label]) => [id, decode(label)]));
const byId = new Map(terms.map(t => [t.id, t]));

const unknown = Object.keys(FORMS).filter(id => !byId.has(id));
if (unknown.length) throw new Error('FORMS lists unknown glossary ids: ' + unknown.join(', '));
const seen = new Map();
for (const [id, forms] of Object.entries(FORMS)) {
    for (const f of forms) {
        if (seen.has(f)) throw new Error(`"${f}" is listed for both ${seen.get(f)} and ${id}`);
        seen.set(f, id);
    }
}

const out = {
    note: 'Generated by scripts/beginners-guide/build-glossary-hints.js from the Beginner\'s Guide glossary. Do not edit by hand.',
    guide: 'Beginners-Guide.html',
    categories: catLabel,
    terms: Object.entries(FORMS).map(([id, forms]) => {
        const t = byId.get(id);
        if (!short[id]) throw new Error('no one-line definition for ' + id);
        const entry = { id, name: decode(t.name), cat: t.cat, short: decode(short[id]), forms };
        if (MAX_ONE.includes(id)) entry.max = 1;
        return entry;
    })
};
const file = path.join(__dirname, '../../assets/data/glossary-hints.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log('glossary hints:', out.terms.length, 'terms,', seen.size, 'forms,', Math.round(fs.statSync(file).size / 1024), 'KB');
