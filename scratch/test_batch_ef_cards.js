const fs = require('fs');
const https = require('https');

const banlist = JSON.parse(fs.readFileSync('assets/data/banlist.json', 'utf8'));

// All cards mentioned across the 13 decks
const cardsToCheck = [
  // Ecclesia
  "Fallen of the White Dragon",
  "Fallen of Albaz",
  "Dogmatika Fleurdelis, the Knighted",
  "Dogmatika Punishment",
  "Nadir Servant",
  "Titaniklad the Ash Dragon",
  "Granguignol the Dusk Dragon",
  "Mirrorjade the Iceblade Dragon",
  "Albion the Branded Dragon",
  "Incredible Ecclesia, the Virtuous",
  "Dogmatika Ecclesia, the Virtuous",
  "Blazing Cartesia, the Virtuous",
  "Guiding Quem, the Virtuous",
  "The Fallen & The Virtuous",
  "Ecclesia and the Dark Dragon",

  // Egyptian God
  "Slifer the Sky Dragon",
  "Obelisk the Tormentor",
  "The Winged Dragon of Ra",
  "The Winged Dragon of Ra - Sphere Mode",
  "The Winged Dragon of Ra - Immortal Phoenix",
  "Reactor Slime",
  "Guardian Slime",
  "Soul Crossing",
  "Ancient Chant",
  "The True Name",
  "Mound of the Bound Creator",
  "Millennium Revelation",
  "The Revived Sky God",
  "Fist of Fate",
  "Metal Reflect Slime",
  "Egyptian God Slime",

  // Empowered Warrior
  "Summoner Monk",
  "Reinforcement of the Army",
  "Terraforming",
  "Beyond the Pendulum",
  "Majester Paladin, the Ascending Dracoslayer",
  "Dragodies, the Empowered Warrior",
  "Dragonox, the Empowered Warrior",
  "Aether, the Empowering Dragon",
  "Aether, the Evil Empowering Dragon",
  "Arnis, the Empowered Warrior",
  "Terratiger, the Empowered Warrior",
  "Hydrotortoise, the Empowered Warrior",
  "Ventdra, the Empowered Warrior",
  "Empowerment",

  // End of the World
  "Pre-Preparation of Rites",
  "Preparation of Rites",
  "Manju of the Ten Thousand Hands",
  "Impcantation Talismandra",
  "Impcantation Candoll",
  "Superdreadnought Rail Cannon Gustav Max",
  "Superdreadnought Rail Cannon Juggernaut Liebe",
  "Ruler of the End of the World",
  "Demise, Supreme King of Armageddon",
  "Ruin, Supreme Queen of Oblivion",
  "Demise, King of Armageddon",
  "Ruin, Queen of Oblivion",
  "Demise, Agent of Armageddon",
  "Ruin, Angel of Oblivion",
  "Cycle of the World",
  "End of the World",
  "Turning of the World",
  "Breaking of the World",
  "Renewing of the World",

  // Engine Token
  "Scrap Recycler",
  "Therion \"King\" Regulus",
  "Foolish Burial",
  "Link Spider",
  "Clockwork Knight",
  "Clockwork Night",
  "Platinum Gadget",
  "Ancient Gear Ballista",
  "Motor Kaiser",
  "Motor Shell",
  "Motor Frenzy",
  "Fiendish Engine Ω",
  "Two-for-One Repair Job",

  // Entity
  "Deep Sea Diva",
  "Guitar Gurnards Duonigis",
  "Assault Synchron",
  "Red Resonator",
  "Photon Thrasher",
  "Kagetokage",
  "Instant Fusion",
  "Super Polymerization",
  "Forbidden Trapezohedron",
  "Dreamland",
  "Forbidden Apocrypha",
  "Elder Entity N'tss",
  "Elder Entity Norden",
  "Old Entity Hastorr",
  "Old Entity Cthugua",
  "Outer Entity Nyarla",

  // Exchange of the Spirit
  "Vernusylph of the Flourishing Hills",
  "Vernusylph of the Awakening Forests",
  "Vernusylph of the Misting Seedlings",
  "Herald of Orange Light",
  "Foolish Burial Goods",
  "Number 41: Bagooska the Terribly Tired Tapir",
  "Gallant Granite",
  "Missus Radiant",
  "Keldo the Sacred Protector",
  "Mudora the Sword Oracle",
  "Zolga the Prophet",
  "Kelbek",
  "Mudora",
  "Gravekeeper's Trap",
  "Exchange of the Spirit",
  "Blast Held by Destiny",

  // Fairy Tale
  "Wonder Wand",
  "Book of Moon",
  "Fairy Tail - Matchgiru",
  "Fairy Tail - Luna",
  "Fairy Tail - Rochka",
  "Fairy Tail - Rella",
  "Fairy Tail - Sleeper",
  "Fairy Tail - Snow",
  "Fairy Tail Ball",
  "Fairy Tale Tails",
  "Teller of Fairy Tails",
  "Fairy Tail - Wiccat",

  // Felgrand
  "Dragon Shrine",
  "Trade-In",
  "Number 38: Hope Harbinger Dragon Titanic Galaxy",
  "Hieratic Seal of the Heavenly Spheres",
  "Divine Dragon Lord Felgrand",
  "Arkbrave Dragon",
  "Paladin of Felgrand",
  "Guardian of Felgrand",
  "Dragon Knight of Creation",
  "Felgrand Dragon",
  "Return of the Dragon Lords",
  "Ruins of the Divine Dragon Lords",
  "Divine Dragon Knight Felgrand",

  // Feral Imp
  "Rescue Rabbit",
  "Unexpected Dai",
  "Nefarious Archfiend Eater of Nefariousness",
  "Danger!? Tsuchinoko?",
  "Masked Chameleon",
  "Night Sword Serpent",
  "First of the Dragons",
  "Feral Imp",
  "Des Feral Imp",
  "Horn of the Unicorn",
  "Horn of Light",
  "King of the Feral Imps",

  // Flamvell
  "Bonfire",
  "T.G. Hyper Librarian",
  "Crimson Blader",
  "Formula Synchron",
  "Flamvell Firedog",
  "Flamvell Magician",
  "Neo Flamvell Lady",
  "Neo Flamvell Origin",
  "Flamvell Poun",
  "Flamvell Archer",
  "Flamvell Baby",
  "Flamvell Guard",
  "Rekindling",
  "Flamvell Counter",
  "Ancient Flamvell Deity",
  "Flamvell Uruquizas",

  // From the Underworld
  "Underworld Goddess of the Closed World",
  "Sangan",
  "Fiendish Rhino Warrior",
  "Scarm, Malebranche of the Burning Abyss",
  "Doomdog Octhros",
  "Dark Spirit of Banishment",
  "Dark Necrofear",
  "Tour Guide From the Underworld",
  "Tour Bus From the Underworld",
  "Tour Bus To Forbidden Realms",
  "Muckraker From the Underworld",
  "Beat Cop from the Underworld",

  // Fusion
  "Keeper of Dragon Magic",
  "Beastking of the Swamps",
  "Goddess with the Third Eye",
  "Guardian Chimera",
  "Magnum the Reliever",
  "Millennium-Eyes Restrict",
  "Thousand-Eyes Restrict",
  "Garura, Wings of Resonant Life",
  "Mudragon of the Swamp",
  "King of the Swamp",
  "Polymerization",
  "Ultra Polymerization",
  "Fusion Recycling Plant",
  "Fusion Sage",
  "Fusion Reserve",
  "Fusion Duplication"
];

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
            const card = json.data[0];
            resolve({ name, found: true, realName: card.name, type: card.type, frameType: card.frameType, ban_tcg: card.banlist_info?.ban_tcg });
          } else {
            resolve({ name, found: false });
          }
        } catch (e) {
          resolve({ name, found: false, error: e.message });
        }
      });
    }).on('error', (err) => {
      resolve({ name, found: false, error: err.message });
    });
  });
}

async function run() {
  const uniqueNames = [...new Set(cardsToCheck)];
  console.log(`Checking ${uniqueNames.length} unique cards...`);

  // Check banlist.json locally first
  const tcgForbidden = new Set((banlist.tcg?.forbidden || []).map(c => c.toLowerCase()));
  const tcgLimited = new Set((banlist.tcg?.limited || []).map(c => c.toLowerCase()));
  const tcgSemi = new Set((banlist.tcg?.semiLimited || []).map(c => c.toLowerCase()));

  for (const name of uniqueNames) {
    const lower = name.toLowerCase();
    if (tcgForbidden.has(lower)) {
      console.log(`[BANLIST FORBIDDEN] ${name}`);
    } else if (tcgLimited.has(lower)) {
      console.log(`[BANLIST LIMITED] ${name}`);
    } else if (tcgSemi.has(lower)) {
      console.log(`[BANLIST SEMI-LIMITED] ${name}`);
    }
  }

  // Check with ygoprodeck in chunks
  const notFound = [];
  const foundCards = [];
  for (let i = 0; i < uniqueNames.length; i += 5) {
    const chunk = uniqueNames.slice(i, i + 5);
    const results = await Promise.all(chunk.map(fetchCard));
    for (const res of results) {
      if (!res.found) {
        notFound.push(res.name);
      } else {
        foundCards.push(res);
      }
    }
    // tiny delay to avoid rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n--- NOT FOUND ON YGOPRODECK ---');
  console.log(notFound);
}

run();
