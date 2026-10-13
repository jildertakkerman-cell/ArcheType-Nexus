const fs = require('fs');
const https = require('https');

const banlist = JSON.parse(fs.readFileSync('assets/data/banlist.json', 'utf8'));
const fb = new Set((banlist.tcg?.forbidden || []).map(c => c.toLowerCase()));
const lim = new Set((banlist.tcg?.limited || []).map(c => c.toLowerCase()));
const semi = new Set((banlist.tcg?.semiLimited || []).map(c => c.toLowerCase()));

// Collect all card names from the 15 prompt decks
const cards = [
  // G Golem
  "G Golem Pebble Dog", "G Golem Rock Hammer", "Dotscaper", "Widget Kid", "Lady Debug",
  "Gravity Balance", "Cynet Mining", "Foolish Burial",
  "G Golem Crystal Heart", "G Golem Stubborn Menhir", "G Golem Invalid Dolmen", "G Golem Dignified Trilithon",
  "Transcode Talker", "Splash Mage",

  // Gaia
  "Gaia the Magical Knight", "Soldier Gaia the Fierce Knight", "Gaia the Fierce Knight Origin",
  "Charging Gaia the Fierce Knight", "Curse of Dragon, the Cursed Dragon", "Curse of Dragon, the Magical Knight Dragon",
  "Artillery Catapult Turtle", "Galloping Gaia", "Gateway to Chaos", "Spiral Fusion", "Spiral Spear Strike",
  "Spiral Reborn", "Spiral Discharge", "Reinforcement of the Army", "Terraforming",
  "Gaia the Magical Knight of Dragons", "Sky Galloping Gaia the Dragon Champion", "Gaia Dragon, the Thunder Charger",

  // Galaxy-Photon
  "Galaxy-Eyes Photon Dragon", "Galaxy-Eyes Afterglow Dragon", "Galaxy Soldier", "Photon Emperor",
  "Galaxy Summoner", "Galaxy Wizard", "Photon Jumper", "Photon Vanisher", "Photon Delta Wing",
  "Photon Orbital", "Galaxy Hundred", "Galaxy Expedition", "Galaxy Trance", "Photon Sanctuary",
  "Galaxy Photon Dragon", "Number 90: Galaxy-Eyes Photon Lord", "Number 62: Galaxy-Eyes Prime Photon Dragon",
  "Number C62: Neo Galaxy-Eyes Prime Photon Dragon", "Galaxy-Eyes Full Armor Photon Dragon",
  "Galaxy-Eyes Cipher Dragon", "Galaxy-Eyes Cipher Blade Dragon", "Starliege Photon Blast Dragon",
  "Number 38: Hope Harbinger Dragon Titanic Galaxy", "Galaxy-Eyes Solflare Dragon",

  // Garbage
  "Garbage Lord", "Garbage Ogre", "Garbage Golem", "Garbage Collector",
  "Tour Guide From the Underworld", "Sangan", "Allure of Darkness",
  "Adreus, Keeper of Armageddon", "Number 53: Heart-eartH", "Number 92: Heart-eartH Dragon",
  "D/D/D Marksman King Tell", "D/D/D Deviser King Deus Machinex", "Muckraker From the Underworld",

  // Gearfried
  "Immortal Phoenix Gearfried", "Gearfried the Red-Eyes Iron Knight", "Gearfried the Iron Knight",
  "Gearfried the Swordmaster", "Phoenix Gearfried", "Lightray Gearfried", "Red-Eyes Baby Dragon",
  "Sublimation Knight", "Squeaknight", "Infernoble Knight - Renaud", "Release Restraint",
  "Phoenix Gearblade", "Living Fossil", "Red-Eyes Fang with Chain", "Blast with Chain",
  "Isolde, Two Tales of the Noble Knights",

  // Geargia
  "Geargiarmor", "Geargiaccelerator", "Geargiarsenal", "Geargiauger", "Geargianchor",
  "Geargiano Mk-II", "Geargiano Mk-III", "Geargiano", "Ancient Gear Box", "Machina Gearframe",
  "Machina Fortress", "Geargiagear",
  "Gear Gigant X", "Geargiagear Gigant XG", "Ancient Gear Ballista", "Platinum Gadget",

  // Gigo
  "Gagagigo", "Jigabyte", "Awakening of the Possessed - Gagigobyte", "Giga Gagagigo", "Gogiga Gagagigo",
  "Gigobyte", "Eria the Water Charmer", "Rescue Rabbit", "Unexpected Dai", "Warrior of Atlantis",
  "A Legendary Ocean",
  "Gagagigo the Risen", "King of the Feral Imps", "Eria the Water Charmer, Gentle", "Bahamut Shark", "Mistar Boy",

  // Glacial Beast
  "Glacial Beast Polar Penguin", "Glacial Beast Blizzard Wolf", "Penguin Squire", "The Great Emperor Penguin",
  "Nopenguin", "Puny Penguin", "Penguin Ninja", "Swap Frog", "Royal Penguins Garden", "Surface",
  "Glacial Beast Iceberg Narwhal", "Penguin Brave", "Marincess Coral Anemone", "White Aura Whale",
  "Icejade Ran Aegirine", "Swordsoul Supreme Sovereign - Chengying",

  // Goblin
  "Goblin Biker Dugg Charger", "Goblin Biker Mean Merciless", "Goblin Biker Clatter Sploder",
  "Goblin Biker Boom Mach", "Goblin Biker Gone Wild", "Speedroid Terrortop", "Speedroid Taketomborg",
  "Goblin Biker Grand Entrance", "Goblin Biker Grand Breakout", "Goblin Biker GrandBash",
  "Goblin Biker Grand Stampede", "Goblin Freefall Squad", "Full-Armored Xyz",
  "Goblin Biker Big Gabonga", "Goblin Biker Troika Griare", "Goblin's Crazy Beast",
  "Xyz Armor Fortress", "Full Armored Dark Knight Lancer",

  // Golden Castle of Stromberg
  "Glife the Phantom Bird", "Hexe Trude", "Prinzincessin", "Pumpkin Carriage", "Iron Hans", "Iron Knight",
  "Gren Maju Da Eiza", "Golden Castle of Stromberg", "Glass Slippers", "Iron Cage", "Pot of Desires",

  // Gouki
  "Gouki Suprex", "Gouki Machine Suprex", "Gouki Headbatt", "Gouki Twistcobra", "Gouki Octostretch",
  "Gouki Guts", "Gouki Iron Claw", "Gouki Riscorpio", "Fire Flint Lady", "Gouki Re-Match",
  "Gouki Gameface", "Gouki Finishing Move", "Gouki Face Turn",
  "Gouki The Powerload Ogre", "Gouki The Master Ogre", "Gouki The Tyrant Ogre", "Gouki Dragon Ogre",
  "Gouki Sheik Ogre", "Gouki Thunder Ogre", "Gouki Heel Ogre", "Gouki Jet Ogre",

  // Goyo
  "Jutte Fighter", "Attack Gainer", "Psychic Wheeleder", "Junk Forward", "Spell Striker",
  "Super Quantum Red Layer", "Miracle Synchro Fusion",
  "Goyo Guardian", "Goyo Defender", "Goyo King", "Goyo Emperor", "Goyo Chaser", "Goyo Predator", "M-X-Saber Invoker",

  // Gravekeeper's
  "Gravekeeper's Commandant", "Gravekeeper's Spiritualist", "Gravekeeper's Recruiter", "Gravekeeper's Spy",
  "Gravekeeper's Headman", "Gravekeeper's Descendant", "Gravekeeper's Heretic", "Necrovalley",
  "Necrovalley Throne", "Royal Tribute", "Hidden Temples of Necrovalley", "Gravekeeper's Stele",
  "Imperial Tombs of Necrovalley", "Necrovalley Temple",
  "Gravekeeper's Supernaturalist", "Artemis, the Magistus Moon Maiden",

  // Graydle
  "Graydle Alligator", "Graydle Cobra", "Graydle Eagle", "Graydle Slime Jr.", "Graydle Slime",
  "Graydle Impact", "Graydle Split", "Graydle Parasite", "Graydle Combat", "Supply Squad",
  "Graydle Dragon", "Coral Dragon",

  // Grepher
  "Chaos Grepher", "Dark Grepher", "Lightray Grepher", "Warrior Dai Grepher", "Knight Day Grepher",
  "Ryu-Kishin Powered", "Destrudo the Lost Dragon's Frisson", "The Chaos Creator",
  "Black Luster Soldier - Envoy of the Beginning", "Fusion Deployment", "Chaos Space", "Polymerization",
  "Ryu Senshi", "Chaos Angel"
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
