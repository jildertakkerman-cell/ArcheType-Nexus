const fs = require('fs');
const https = require('https');

const banlist = JSON.parse(fs.readFileSync('assets/data/banlist.json', 'utf8'));
const fb = new Set((banlist.tcg?.forbidden || []).map(c => c.toLowerCase()));
const lim = new Set((banlist.tcg?.limited || []).map(c => c.toLowerCase()));
const semi = new Set((banlist.tcg?.semiLimited || []).map(c => c.toLowerCase()));

// Collect all cards from the 13 decks
const cards = [
  // Hand
  "Fire Hand", "Ice Hand", "Thunder Hand", "Prominence Hand", "Magic Hand",
  "Seventh Ascension", "Seventh Tachyon", "Rank-Up-Magic Barian's Force", "Supply Squad", "Torrential Tribute",
  "Number 106: Giant Hand", "Number C106: Giant Red Hand", "Abyss Dweller", "Tornado Dragon",

  // Hazy Flame
  "Hazy Flame Peryton", "Hazy Flame Sphynx", "Hazy Flame Cerbereus", "Hazy Flame Griffin",
  "Hazy Flame Hydra", "Hazy Flame Mantikor", "Fire King Avatar Arvata", "Hazy Pillar",
  "Rekindling", "Onslaught of the Fire Kings", "Fire Formation - Tenki", "Hazy Glory",
  "Hazy Flame Basiltrice", "Evolzar Lars", "Bujinki Ahashima",

  // Helios
  "Helios - The Primordial Sun", "Helios Duo Megistus", "Helios Trice Megistus", "Golden Homunculus",
  "Gren Maju Da Eiza", "Eater of Millions", "Chaos Distill", "Macro Cosmos", "Grand Convergence",
  "Dimensional Fissure", "Pot of Desires", "Trap Trick",
  "Infernal Flame Banshee",

  // Heraldic Beast
  "Heraldic Beast Gryphon", "Heraldic Beast Stad Whale", "Heraldic Beast Leo", "Heraldic Beast Amphisbaena",
  "Heraldic Beast Aberconway", "Heraldic Beast Unicorn", "Heraldic Beast Twin-Headed Eagle",
  "Advanced Heraldry Art", "Charged-Up Heraldry", "Flash of Heraldry", "Heraldry Reborn", "Augmented Heraldry",
  "Foolish Burial", "Terraforming",
  "Number 69: Heraldry Crest", "Number 69: Heraldry Crest - Shatter Stream", "Number 69: Heraldry Crest - Dark Matter Demolition",
  "Number 18: Heraldry Patriarch", "Number 8: Heraldic King Genom-Heritage", "Number C69: Heraldry Crest of Horror",

  // Hex Sealed Fusion
  "The Dark - Hex-Sealed Fusion", "The Light - Hex-Sealed Fusion", "The Earth - Hex-Sealed Fusion",
  "Keeper of Dragon Magic", "Fallen of Albaz", "Albion the Shrouded Dragon", "Doki Doki",
  "Adamancipator Signs", "Polymerization",
  "Red-Eyes Dark Dragoon", "Blue-Eyes Tyrant Dragon", "Millennium-Eyes Restrict", "Invoked Caliga",
  "Invoked Mechaba", "Lubellion the Searing Dragon", "Ryu Senshi",

  // Horn of Heaven
  "Horn of Heaven", "Black Horn of Heaven", "Grand Horn of Heaven", "Guiding Ariadne", "Bountiful Artemis",
  "Power Angel Valkyria", "Minerva, Scholar of the Sky", "Meltiel, Sage of the Sky", "Sacred Arch-Airknight Parshath",
  "Sanctum of Parshath", "Ties of the Brethren", "Rebirth of Parshath", "Solemn Judgment",
  "Celestial Knightlord Parshath", "Avenging Knight Parshath",

  // Hunder
  "Pahunder", "Mahunder", "Brohunder", "Sishunder", "Thunder Sea Horse", "Vylon Prism",
  "Batteryman Solar", "Recycling Batteries", "Spirit Converter",
  "Starliege Paladynamo", "Number 91: Thunder Spark Dragon", "Bujintei Tsukuyomi", "PSY-Framelord Omega",
  "Crimson Blader", "Some Summer Summoner",

  // Igknight
  "Igknight Templar", "Igknight Paladin", "Igknight Crusader", "Igknight Squire", "Igknight Margrave",
  "Igknight Cavalier", "Igknight Gallant", "Igknight Veteran", "Ignis Phoenix, the Dracoslayer",
  "Immortal Phoenix Gearfried", "Sublimation Knight", "Squeaknight", "Infernoble Knight - Renaud",
  "Ignition Phoenix", "Summoner's Art", "Phoenix Gearblade", "Living Fossil",
  "Isolde, Two Tales of the Noble Knights", "Beyond the Pendulum", "Promethean Princess, Bestower of Flames",
  "Ignister Prominence, the Blasting Dracoslayer", "Majester Paladin, the Ascending Dracoslayer",

  // Imperial traps
  "Imperial Custom", "Imperial Iron Wall", "Statue of Anguish Pattern", "Apophis the Swamp Deity",
  "Angel Statue - Azurune", "Zoma the Spirit", "Uria, Lord of Searing Flames", "Hyper Blaze",
  "The Despair Uranus", "Lord of the Heavenly Prison", "Skill Drain",
  "Gallant Granite", "Superdreadnought Rail Cannon Gustav Max",

  // Inca
  "Ascator, Dawnwalker", "Fire Ant Ascator", "Supay, Duskwalker", "Supay", "Oracle of the Sun",
  "Apocatequil", "Weeping Idol", "Call of the Earthbound", "Temple of the Sun", "Destruct Potion", "Limit Reverse",
  "Sun Dragon Inti", "Moon Dragon Quilla", "Crystal Wing Synchro Dragon",

  // Infernal Flame
  "Infernal Flame Emperor", "Spirit of Flames", "Solar Flare Dragon", "Neo Flamvell Lady",
  "Royal Firestorm Guards", "Flamvell Firedog", "Blaster, Dragon Ruler of Infernos", "Bonfire",
  "Circle of the Fire Kings",
  "Infernal Flame Banshee", "Infernal Flame Vixen",

  // Inpachi
  "Blazing Inpachi", "Inpachi", "Charcoal Inpachi", "Woodborg Inpachi", "Rescue Rabbit", "Unexpected Dai",
  "Painful Decision", "Machine Duplication", "Piercing the Darkness", "Fists of the Unrivaled Tenyi",
  "Gear Gigant X", "Link Spider", "First of the Dragons",

  // Iron Chain
  "Iron Chain Repairman", "Iron Chain Coil", "Iron Chain Snake", "Iron Chain Blaster",
  "Crane Crane", "Psychic Wheeleder", "Poison Chain", "Paralyzing Chain",
  "Iron Chain Dragon", "M-X-Saber Invoker", "Naturia Barkion", "Goyo Guardian"
];

const unique = [...new Set(cards)];
console.log(`Checking ${unique.length} unique cards...`);

for (const c of unique) {
  const low = c.toLowerCase();
  if (fb.has(low)) console.log(`[BANLIST FORBIDDEN] ${c}`);
  if (lim.has(low)) console.log(`[BANLIST LIMITED] ${c}`);
  if (semi.has(low)) console.log(`[BANLIST SEMI-LIMITED] ${c}`);
}

function fetchCard(name) {
  return new Promise((resolve) => {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            resolve({ name, found: true, type: json.data[0].type });
          } else {
            resolve({ name, found: false });
          }
        } catch (e) {
          resolve({ name, found: false });
        }
      });
    }).on('error', () => resolve({ name, found: false }));
  });
}

async function run() {
  const notFound = [];
  for (let i = 0; i < unique.length; i += 6) {
    const chunk = unique.slice(i, i + 6);
    const res = await Promise.all(chunk.map(fetchCard));
    for (const r of res) {
      if (!r.found) notFound.push(r.name);
    }
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  console.log('\n--- CARDS NOT FOUND ON YGOPRODECK ---');
  console.log(notFound);
}

run();
