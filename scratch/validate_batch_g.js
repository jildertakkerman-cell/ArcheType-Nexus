const fs = require('fs');

const banlist = JSON.parse(fs.readFileSync('assets/data/banlist.json', 'utf8'));
const tcgForbidden = new Set((banlist.tcg?.forbidden || []).map(c => c.toLowerCase()));
const tcgLimited = new Set((banlist.tcg?.limited || []).map(c => c.toLowerCase()));
const tcgSemi = new Set((banlist.tcg?.semiLimited || []).map(c => c.toLowerCase()));

const decks = [
  {
    slug: "g-golem.json",
    archetype: "G Golem",
    title: "Pure G Golem",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["G Golem", "Gravity Balance"],
    summary: "The G Golem strategy is an EARTH Cyberse co-linking beatdown archetype led by G Golem Rock Hammer, Pebble Dog, and Gravity Balance. Rock Hammer tributes itself to generate 3 EARTH Cyberse Tokens, fueling Link climbs into G Golem Stubborn Menhir and G Golem Crystal Heart. Crystal Heart revives Menhir to trigger its recursion, locking the field under a co-linked G Golem Invalid Dolmen and Dignified Trilithon board immune to opponent's monster effects on the field.",
    allow: {
      "Cynet Mining": "Discards G Golem Pebble Dog (triggering its hand-to-GY search effect) to search another Level 4 or lower Cyberse starter.",
      "Dotscaper": "Level 1 EARTH Cyberse that Special Summons itself when sent to the GY or banished (synergizing with Gravity Balance), providing the EARTH material required for G Golem Stubborn Menhir.",
      "Widget Kid": "Level 3 EARTH Cyberse that Special Summons a Cyberse monster from hand, satisfying both EARTH and Cyberse Link requirements.",
      "Lady Debug": "Level 4 Cyberse starter that searches G Golem Pebble Dog, Widget Kid, or Dotscaper on Normal or Special Summon.",
      "Foolish Burial": "Limited to 1 in TCG: sends Dotscaper or G Golem Pebble Dog to the GY to extend EARTH Cyberse Link plays.",
      "Transcode Talker": "Link-3 EARTH Cyberse that revives a Link-3 or lower Cyberse to a co-linked zone, satisfying G Golem Invalid Dolmen's co-link requirement and EARTH Attribute.",
      "Update Jammer": "Link-2 WIND Cyberse that allows a Link Monster summoned using it as material to attack twice during each Battle Phase.",
      "Accesscode Talker": "Link-4 DARK Cyberse finisher that gains massive ATK and banishes Link Monsters from GY to destroy multiple cards without allowing responses."
    },
    exclude: {},
    main: [
      ["G Golem Pebble Dog", 3, "Searches a copy of itself when Normal/Special Summoned, and searches any 'G Golem' card from the Deck if sent from the hand to the GY."],
      ["G Golem Rock Hammer", 3, "Discards itself to reduce a G Golem's Level by 2, and tributes itself on the field to summon 3 EARTH Cyberse G Golem Tokens."],
      ["Dotscaper", 3, "Level 1 EARTH Cyberse that revives itself once per Duel when sent to GY and once per Duel when banished by Gravity Balance."],
      ["Widget Kid", 3, "Level 3 EARTH Cyberse that Special Summons Pebble Dog from hand to assemble 2 EARTH monsters for Stubborn Menhir."],
      ["Lady Debug", 3, "Searches G Golem Pebble Dog or Widget Kid on Normal or Special Summon."],
      ["Gravity Balance", 3, "Banishes 2 EARTH monsters from GY to Special Summon 2 G Golem monsters with 0 ATK/DEF from GY, and banishes itself from GY to prevent G Golem destruction."],
      ["Cynet Mining", 3, "Sends G Golem Pebble Dog from hand to GY (triggering its search for Gravity Balance or Rock Hammer) to add another Cyberse starter."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: dumps Dotscaper to immediately place an EARTH Cyberse body on the field."]
    ],
    extra: [
      ["G Golem Crystal Heart", 3, "Link-2 WATER Cyberse that revives an EARTH Link Monster (Stubborn Menhir or Transcode Talker) to its arrow and grants co-linked EARTH monsters double attacks and piercing."],
      ["G Golem Stubborn Menhir", 3, "Link-2 EARTH Cyberse that revives or recovers an EARTH monster when Special Summoned from the GY by Crystal Heart."],
      ["G Golem Invalid Dolmen", 2, "Link-3 EARTH Cyberse boss that makes all co-linked monsters you control unaffected by monster effects activated on the opponent's field and draws 1 by discarding a Cyberse."],
      ["G Golem Dignified Trilithon", 2, "Link-3 EARTH Cyberse boss that sends an EARTH monster from hand to negate an attacking monster and negates opponent's targeting effects on your Link Monsters."],
      ["Transcode Talker", 2, "Link-3 EARTH Cyberse that revives Stubborn Menhir or Crystal Heart to a co-linked zone and grants targeting protection."],
      ["Update Jammer", 1, "Link-2 Cyberse extender that grants a co-linked Link boss a second attack during each Battle Phase."],
      ["Accesscode Talker", 1, "Link-4 Cyberse finisher that destroys opposing cards by banishing Link Monsters from the GY."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "gaia.json",
    archetype: "Gaia",
    title: "Pure Gaia",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Gaia", "Curse of Dragon", "Spiral Fusion", "Spiral Spear Strike", "Spiral Reborn", "Spiral Discharge", "Gateway to Chaos"],
    summary: "The Gaia archetype brings Yugi Muto's iconic champion into the modern era with high-powered Dragon Fusions and the field control of Galloping Gaia. By using Gaia the Magical Knight and Curse of Dragon, the Cursed Dragon to search Spiral Fusion, the deck summons a 5200 ATK Gaia the Magical Knight of Dragons capable of attacking twice per turn and popping cards as Quick Effects, all while Galloping Gaia locks the opponent out of Battle Phase activations.",
    allow: {
      "Artillery Catapult Turtle": "Tributes itself to Special Summon any 'Gaia the Fierce Knight' monster or Level 5 Dragon monster directly from the hand or Deck.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Gaia the Magical Knight.",
      "Terraforming": "Limited to 1 in TCG: searches Gateway to Chaos."
    },
    exclude: {},
    main: [
      ["Gaia the Magical Knight", 3, "Level 7 Warrior treated as 'Gaia the Fierce Knight' that Normal Summons without Tributing and Special Summons a Level 5 Dragon from hand or GY."],
      ["Soldier Gaia the Fierce Knight", 2, "Tributes a Dragon Fusion Monster as a Quick Effect to Special Summon itself and switches an Attack Position monster to Defense Position."],
      ["Gaia the Fierce Knight Origin", 3, "Special Summons itself by sending 1 Level 5 or higher monster from hand to GY and can serve as 2 Tributes for a Warrior."],
      ["Charging Gaia the Fierce Knight", 2, "Can be Normal Summoned without Tributing as a 1900 ATK monster and searches a Black Luster Soldier or provides an extra Gaia name."],
      ["Curse of Dragon, the Cursed Dragon", 3, "Level 5 Dragon that searches Spiral Fusion or any Spell/Trap mentioning Gaia the Dragon Champion on Normal or Special Summon."],
      ["Artillery Catapult Turtle", 3, "One-card starter that tributes itself to summon Gaia the Magical Knight or Curse of Dragon, the Cursed Dragon from the Deck."],
      ["Galloping Gaia", 3, "Continuous Spell that reveals Gaia to search a Level 5 Dragon (or vice versa) and prevents the opponent from activating effects during the Battle Phase."],
      ["Gateway to Chaos", 3, "Field Spell that searches a 'Gaia the Fierce Knight' monster on activation and removes 3 counters to search a Ritual/Fusion piece."],
      ["Spiral Fusion", 3, "Fuses a Dragon Fusion Monster from hand/field and gives 'Gaia the Dragon Champion' +2600 ATK and 2 attacks on monsters."],
      ["Spiral Spear Strike", 2, "Grants piercing battle damage to Gaia the Dragon Champion and draws 2 cards (discarding 1) when it inflicts piercing damage."],
      ["Spiral Reborn", 1, "Revives a Level 7 or lower Dragon or Gaia the Dragon Champion and grants targeting/destruction immunity."],
      ["Spiral Discharge", 1, "Protects Gaia the Dragon Champion from targeting and destroys 1 card on the field when it attacks a monster."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Gaia the Magical Knight or Gaia the Fierce Knight Origin."],
      ["Terraforming", 1, "Limited to 1 in TCG: searches Gateway to Chaos."]
    ],
    extra: [
      ["Gaia the Magical Knight of Dragons", 3, "Treated as 'Gaia the Dragon Champion'; loses 2600 ATK as a Quick Effect during the Main Phase to destroy 1 card on the field, and gains 2600 ATK when destroying a monster by battle."],
      ["Sky Galloping Gaia the Dragon Champion", 2, "Treated as 'Gaia the Dragon Champion'; searches Spiral Spear Strike on Summon and changes an opponent's monster's battle position on attack declaration."],
      ["Curse of Dragon, the Magical Knight Dragon", 2, "Level 5 Dragon Fusion Monster that recycles a Gaia Spell/Trap on Fusion Summon and allows banishing materials from the GY to Fusion Summon a Level 7 Dragon Fusion Monster."],
      ["Gaia Dragon, the Thunder Charger", 2, "Rank 7 Xyz that can rank up directly over a Level 7 Gaia Fusion Monster that has already used its ATK to pop cards, granting piercing damage."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "galaxy-photon.json",
    archetype: "Galaxy-Photon",
    title: "Pure Galaxy-Photon",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Galaxy", "Photon"],
    summary: "Galaxy-Photon unites Kite Tenjo's Level 4 and Level 8 LIGHT engine to field devastating Rank 4 and Rank 8 Xyz bosses. Photon Delta Wing sets up the essential Rank 4 Galaxy Photon Dragon, which mills Photon Emperor or searches Galaxy Hundred to climb into Number 90: Galaxy-Eyes Photon Lord for monster negation and Number 38: Hope Harbinger Dragon Titanic Galaxy for Spell disruption, backed by the raw OTK power of Number 62 and Number C62.",
    allow: {
      "Number 38: Hope Harbinger Dragon Titanic Galaxy": "Rank 8 LIGHT Dragon Xyz summoned via two Level 8 Galaxy/Photon monsters that negates Spells and redirects attacks.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Photon Jumper, Photon Vanisher, or Photon Thrasher.",
      "Foolish Burial": "Limited to 1 in TCG: sends Photon Emperor (for an instant Level 8 body) or Photon Jumper (to search any Galaxy/Photon Spell/Trap) to the GY."
    },
    exclude: {},
    main: [
      ["Galaxy-Eyes Photon Dragon", 3, "Core Level 8 LIGHT Dragon required in hand, Deck, and GY for Photon Vanisher, Galaxy Trance, and Number 90's full detach effects."],
      ["Galaxy-Eyes Afterglow Dragon", 2, "Special Summons itself while you control a Galaxy-Eyes monster, and when detached as Xyz Material, summons Galaxy-Eyes Photon Dragon and doubles all Number Xyz ATK."],
      ["Galaxy Soldier", 3, "Sends 1 LIGHT monster from hand to GY (triggering Photon Jumper or Photon Emperor) to Special Summon itself and searches another Galaxy monster."],
      ["Photon Emperor", 2, "Level 8 LIGHT Warrior that Special Summons itself when sent to the GY (except from field) while you control a Photon/Galaxy monster, and grants an extra LIGHT Normal Summon."],
      ["Galaxy Summoner", 2, "Revives a Photon or Galaxy monster from the GY in Defense Position on Normal/Special Summon and changes another LIGHT monster's Level to 4."],
      ["Galaxy Wizard", 2, "Increases its Level by 4 to become Level 8, or tributes itself to search any Galaxy card from the Deck."],
      ["Photon Jumper", 2, "Searches any Photon or Galaxy Spell/Trap when sent to the GY, and can Special Summon itself to end the Battle Phase when an opponent attacks."],
      ["Photon Vanisher", 2, "Special Summons itself while you control a Photon or Galaxy monster and searches Galaxy-Eyes Photon Dragon from the Deck."],
      ["Photon Delta Wing", 3, "Summons a second Photon Delta Wing from the hand or Deck on Normal Summon for a 1-card Rank 4 Galaxy Photon Dragon (locking you to LIGHT monsters)."],
      ["Photon Orbital", 2, "Equips itself from hand/field to a Photon or Galaxy monster and sends itself to the GY to search any Photon or Galaxy monster."],
      ["Galaxy Hundred", 3, "Continuous Spell that sends any Photon or Galaxy monster from Deck to GY on activation, and steals or banishes a monster from the opponent's Extra Deck when Galaxy-Eyes Photon Dragon is summoned."],
      ["Galaxy Expedition", 2, "Special Summons a Level 5 or higher Photon or Galaxy monster from the Deck while you control a Level 5+ Photon or Galaxy."],
      ["Galaxy Trance", 2, "Pays 2000 LP to revive a Photon monster from the GY and Special Summon a Galaxy monster with the same Level from the Deck."],
      ["Photon Sanctuary", 2, "Summons 2 LIGHT Thunder Photon Tokens (2000 ATK) to immediately Link Summon Galaxy-Eyes Solflare Dragon."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Photon Jumper or Photon Vanisher."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: dumps Photon Emperor or Photon Jumper."]
    ],
    extra: [
      ["Galaxy Photon Dragon", 2, "Rank 4 Xyz that detaches 1 material to search or dump any Photon/Galaxy card, boosts LIGHT monsters by 500 ATK, and changes summoned LIGHT monsters to Level 4 or 8."],
      ["Number 90: Galaxy-Eyes Photon Lord", 2, "Rank 8 Xyz that detaches 1 material to negate an opponent's monster effect (and destroys it if detaching a Galaxy card), and searches/attaches a Photon or Galaxy card."],
      ["Number 62: Galaxy-Eyes Prime Photon Dragon", 1, "Rank 8 OTK boss that gains 200 ATK per Rank on the field and reaches 11,200+ ATK when detaching Galaxy-Eyes Afterglow Dragon."],
      ["Number C62: Neo Galaxy-Eyes Prime Photon Dragon", 1, "Ranks up over Number 62 to attack up to 3 times on monsters while unaffected by opponent's monster effects."],
      ["Galaxy-Eyes Full Armor Photon Dragon", 1, "Rank 8 Xyz that stacks over any Galaxy-Eyes Xyz to detach 1 material and destroy a face-up card."],
      ["Galaxy-Eyes Cipher Dragon", 1, "Rank 8 Xyz that detaches 1 material to steal an opponent's monster (which can then be ranked up into Full Armor or Cipher Blade)."],
      ["Galaxy-Eyes Cipher Blade Dragon", 1, "Rank 9 Xyz that stacks over Cipher or Full Armor to detach 1 material and destroy any card on the field."],
      ["Starliege Photon Blast Dragon", 1, "Rank 4 Xyz that Special Summons a Photon monster from hand and makes your 2000+ ATK monsters untargetable and indestructible by effects."],
      ["Number 38: Hope Harbinger Dragon Titanic Galaxy", 1, "Rank 8 Xyz that negates Spell activations and attaches them as Xyz Material."],
      ["Galaxy-Eyes Solflare Dragon", 2, "Link-2 LIGHT Dragon that recovers a Photon/Galaxy monster from the GY on Link Summon and discards 1 Photon/Galaxy card (or Galaxy-Eyes Photon Dragon) as a Quick Effect to destroy an opponent's Special Summoned monster."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "garbage.json",
    archetype: "Garbage",
    title: "Pure Garbage",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Garbage"],
    summary: "The Garbage archetype revolves around Dr. Faker's DARK Fiend engine of Garbage Lord, Garbage Ogre, and Garbage Golem. By paying LP to Special Summon multiple copies of Garbage Lord without once-per-turn limits, the deck quickly accesses Rank 5 DARK Xyz bosses like Adreus, Keeper of Armageddon and Number 53: Heart-eartH, which floats into the devastating game-ending boss Number 92: Heart-eartH Dragon.",
    allow: {
      "Tour Guide From the Underworld": "Normal Summon starter that summons Level 3 DARK Fiend Garbage Ogre or Sangan from the Deck.",
      "Sangan": "Level 3 DARK Fiend that searches Garbage Ogre, Garbage Golem, or Garbage Lord (all have 1500 or less ATK!) when linked off.",
      "Foolish Burial": "Limited to 1 in TCG: sends Garbage Golem directly to the GY to trigger its GY banish effect (detaching 1 material to revive Garbage Lord).",
      "Allure of Darkness": "Draws 2 cards and banishes excess DARK Fiends.",
      "Number 53: Heart-eartH": "Dr. Faker's signature Rank 5 DARK Fiend Xyz (0 ATK / 0 DEF!) made with Level 5 Garbage Lords that floats into Number 92: Heart-eartH Dragon.",
      "Number 92: Heart-eartH Dragon": "Rank 9 DARK Dragon Xyz (0 ATK / 0 DEF) cheated out by Number 53 that reflects battle damage and banishes the opponent's board.",
      "Adreus, Keeper of Armageddon": "Rank 5 DARK Fiend Xyz summonable using two Level 5 Garbage Lords (satisfying Garbage Lord's DARK Xyz restriction) that detaches 1 material to destroy a face-up card.",
      "D/D/D Marksman King Tell": "Rank 5 DARK Fiend Xyz that can be ranked up or summoned to burn and send Garbage Golem from the Deck to the GY.",
      "D/D/D Deviser King Deus Machinex": "Rank 10 DARK Fiend Xyz that stacks directly over any D/D/D Xyz (Marksman King Tell) to absorb opposing monsters when they activate effects.",
      "Muckraker From the Underworld": "Link-2 DARK Fiend that discards a card to revive Garbage Lord or Garbage Golem from the GY."
    },
    exclude: {},
    main: [
      ["Garbage Lord", 3, "Level 5 DARK Fiend (0 ATK / 2400 DEF) that pays 2000 LP to Special Summon itself from the hand (not once per turn!) to assemble Rank 5 DARK Xyz monsters."],
      ["Garbage Ogre", 3, "Level 3 DARK Fiend that sends itself from your hand to the GY to add 1 Garbage Lord from your Deck to your hand."],
      ["Garbage Golem", 3, "Level 4 DARK Fiend: Special Summons itself while you control a 0 ATK/DEF monster (Garbage Lord), reveals 3 different-Rank Xyz to pop itself and a card, and banishes from GY to detach 1 Xyz Material and revive a 0 ATK/DEF monster."],
      ["Garbage Collector", 2, "Level 2 Cyberse that bounces another Cyberse or acts as an archetypal Garbage name."],
      ["Tour Guide From the Underworld", 3, "Summons Sangan or Garbage Ogre from the Deck to link into Muckraker From the Underworld and search Garbage Lord."],
      ["Sangan", 3, "Searches Garbage Lord (0 ATK), Garbage Ogre (800 ATK), or Garbage Golem when sent from the field to the GY."],
      ["Allure of Darkness", 3, "Draws 2 cards by banishing a DARK Fiend."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: sends Garbage Golem or Garbage Lord to the GY."]
    ],
    extra: [
      ["Adreus, Keeper of Armageddon", 2, "Rank 5 DARK Fiend Xyz (2 Level 5 monsters) valid under Garbage Lord's DARK restriction; detaches 1 material to destroy 1 face-up card the opponent controls."],
      ["Number 53: Heart-eartH", 1, "Rank 5 DARK Fiend Xyz (0 ATK / 0 DEF—valid revival target for Garbage Golem!) that gains attacking monsters' ATK and cheats out Number 92 when destroyed without materials."],
      ["Number 92: Heart-eartH Dragon", 1, "Rank 9 DARK Dragon Xyz summoned by Number 53 that banishes all cards Normal/Special Summoned or Set by the opponent this turn."],
      ["D/D/D Marksman King Tell", 2, "Rank 5 DARK Fiend Xyz that detaches 1 material when you take effect damage to burn for 1000 and sends a Fiend to GY when sent to GY."],
      ["D/D/D Deviser King Deus Machinex", 2, "Rank 10 DARK Fiend Xyz stacked over Marksman King Tell that detaches 2 materials (or destroys a Dark Contract) to attach an opponent's monster that activates an effect."],
      ["Muckraker From the Underworld", 2, "Link-2 DARK Fiend that revives Garbage Lord or Garbage Golem from the GY."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "gearfried.json",
    archetype: "Gearfried",
    title: "Pure Gearfried",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Gearfried", "Release Restraint", "Red-Eyes Fang with Chain", "Red-Eyes Baby Dragon"],
    summary: "Pure Gearfried combines Joey Wheeler's classic ironclad warrior with the ferocious Equip Spell mastery of Immortal Phoenix Gearfried and Gearfried the Red-Eyes Iron Knight. Sublimation Knight and Renaud load the graveyard with Equip Spells like Phoenix Gearblade and Blast with Chain, effortlessly Special Summoning the 3000 ATK Immortal Phoenix Gearfried to absorb opposing monsters and negate effects by cycling equipment.",
    allow: {
      "Sublimation Knight": "Level 3 FIRE Warrior starter that equips Squeaknight from the Deck to load Equip Spells in the GY for Immortal Phoenix Gearfried.",
      "Squeaknight": "FIRE Warrior that Special Summons itself when equipped by Sublimation Knight.",
      "Infernoble Knight - Renaud": "Level 1 FIRE Warrior that Special Summons itself while you control a FIRE Warrior and recovers an Equip Spell banished by Immortal Phoenix Gearfried.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Gearfried the Iron Knight, Gearfried the Red-Eyes Iron Knight, or Sublimation Knight.",
      "Phoenix Gearblade": "Warrior Equip Spell that boosts ATK by 300, sends itself to allow FIRE Warriors to attack twice, and recovers itself to hand when banished for Immortal Phoenix Gearfried.",
      "Living Fossil": "Equip Spell that revives a Level 4 Gearfried from the GY.",
      "Blast with Chain": "Normal Trap that equips to Gearfried the Iron Knight (which immediately destroys it) or Gearfried the Red-Eyes Iron Knight, triggering Blast with Chain's GY effect to destroy any 1 card on the field!",
      "Ferocious Flame Swordsman": "Link-2 FIRE Warrior that boosts all Warrior monsters by 500 ATK and revives a non-Link Warrior (such as Gearfried) from your GY when destroyed.",
      "Hiita the Fire Charmer, Ablaze": "Link-2 FIRE monster made with Sublimation Knight or Renaud that steals a FIRE monster from the opponent's GY and searches a FIRE monster when destroyed.",
      "Infernoble Knight Captain Roland": "Level 5 FIRE Warrior Synchro made with Level 1 Tuner Renaud + Level 4 Gearfried that searches a Warrior or Equip Spell in the End Phase and equips itself from the GY to fuel Immortal Phoenix Gearfried.",
      "Knightmare Phoenix": "Link-2 monster that discards a card to destroy an opponent's Spell or Trap Card.",
      "S:P Little Knight": "Link-2 Warrior that banishes an opposing card on summon and banishes 2 monsters until the End Phase as a Quick Effect."
    },
    exclude: {},
    main: [
      ["Immortal Phoenix Gearfried", 3, "Level 9 FIRE Warrior boss that banishes 1 Equip Spell from your field or GY to Special Summon itself, equips an opponent's monster at the start of the Damage Step, and sends 1 face-up Equip Card you control to the GY to negate and destroy a monster effect."],
      ["Gearfried the Red-Eyes Iron Knight", 3, "Level 4 DARK Warrior that destroys 1 Equip Card equipped to it once per turn to destroy 1 Spell/Trap your opponent controls, and sends 1 Equip Card you control to the GY to revive a Level 7 or lower Red-Eyes monster."],
      ["Gearfried the Iron Knight", 3, "Classic Level 4 EARTH Warrior (1800 ATK) that automatically destroys any Equip Card equipped to it (instantly triggering Blast with Chain!) and tributes via Release Restraint."],
      ["Gearfried the Swordmaster", 1, "Level 7 LIGHT Warrior (2600 ATK) Special Summoned from hand or Deck via Release Restraint; destroys 1 monster your opponent controls every time an Equip Card is equipped to it."],
      ["Phoenix Gearfried", 1, "Level 8 FIRE Warrior Gemini that revives a Gemini monster when the opponent activates a Spell and sends 1 face-up Equip Card to negate targeting effects."],
      ["Lightray Gearfried", 1, "Level 8 LIGHT Warrior that Special Summons itself when you have 5+ LIGHT monsters with different names in your GY and negates Spell/Traps while you control only Warriors."],
      ["Red-Eyes Baby Dragon", 2, "Equips itself to Gearfried the Red-Eyes Iron Knight to boost its ATK by 300, and searches any Level 1 Dragon or adds a Red-Eyes when sent from the Spell & Trap Zone to the GY by Gearfried!"],
      ["Sublimation Knight", 3, "Equips Squeaknight from the Deck on Normal Summon to provide Warrior bodies and an Equip in the GY for Immortal Phoenix Gearfried."],
      ["Squeaknight", 1, "Summons itself when equipped to Sublimation Knight."],
      ["Infernoble Knight - Renaud", 2, "Special Summons itself alongside Sublimation Knight or Immortal Phoenix Gearfried and recovers a banished Equip Spell."],
      ["Release Restraint", 2, "Tributes 1 face-up Gearfried the Iron Knight to Special Summon Gearfried the Swordmaster from your hand or Deck."],
      ["Phoenix Gearblade", 2, "Recovers itself back to your hand whenever it is sent to the GY or banished from the GY to summon Immortal Phoenix Gearfried!"],
      ["Living Fossil", 1, "Equip Spell that revives a Level 4 Gearfried from the GY."],
      ["Red-Eyes Fang with Chain", 2, "Equips to a Red-Eyes monster (Gearfried the Red-Eyes Iron Knight!) to grant 2 attacks on monsters, or sends itself to the GY to equip an opponent's Effect Monster to it."],
      ["Blast with Chain", 3, "Equips to Gearfried the Iron Knight (which immediately destroys it by its mandatory effect) or Gearfried the Red-Eyes Iron Knight, triggering Blast with Chain's effect to destroy ANY 1 card on the field!"],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches any Level 4 Gearfried or Sublimation Knight."]
    ],
    extra: [
      ["Ferocious Flame Swordsman", 2, "Link-2 FIRE Warrior that boosts all Warrior monsters by 500 ATK and revives a non-Link Warrior from GY."],
      ["Hiita the Fire Charmer, Ablaze", 1, "Link-2 FIRE monster that steals a FIRE monster from the opponent's GY and searches a FIRE monster when destroyed."],
      ["Infernoble Knight Captain Roland", 2, "Level 5 FIRE Warrior Synchro made with Renaud + Level 4 Gearfried that searches a Warrior/Equip in the End Phase and equips itself from the GY."],
      ["Knightmare Phoenix", 1, "Link-2 generic removal that destroys an opposing Spell/Trap."],
      ["S:P Little Knight", 1, "Link-2 Warrior that provides temporary banish disruption on summon and on activated effects."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "geargia.json",
    archetype: "Geargia",
    title: "Pure Geargia",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Geargia"],
    summary: "Geargia is an EARTH Machine Xyz toolbox strategy centered around flip recursion and rapid rank climbing. Geargiarmor flips face-up to search key extenders like Geargiaccelerator, while Geargiarsenal and the explosive trap Geargiagear recruit swarms of Geargianos directly from the Deck. This fuels consistent access to signature rank 4 boss Gear Gigant X to search any low-level Machine, backed by Machina Fortress and Geargiagear Gigant XG.",
    allow: {
      "Machina Gearframe": "Level 4 EARTH Machine Union monster that searches Machina Fortress on Normal Summon and pairs with Geargiaccelerator for Rank 4 Gear Gigant X.",
      "Machina Fortress": "Level 7 EARTH Machine that discards Level 8+ worth of Machines (including itself + another Machine) to Special Summon itself from hand or GY.",
      "Ancient Gear Box": "Level 4 EARTH Machine (500 ATK / 2000 DEF) that searches Geargiauger (500 ATK / 500 DEF) from the Deck whenever added from Deck/GY to hand by Gear Gigant X or Geargiauger!",
      "Gear Gigant X": "Signature Rank 4 EARTH Machine Xyz (2 Level 4 Machine monsters) of the Geargia archetype that detaches 1 material to add a Level 4 or lower Machine from Deck or GY to hand, and revives a Level 3 or lower Geargia when leaving the field!",
      "Ancient Gear Ballista": "Link-2 EARTH Machine made with two Geargias that searches Ancient Gear Box (which then searches Geargiauger!).",
      "Platinum Gadget": "Link-2 Machine that Special Summons a Level 4 or lower Machine (Geargiarmor or Geargiarsenal) from the hand."
    },
    exclude: {},
    main: [
      ["Geargiarmor", 3, "Core Level 4 EARTH Machine (1900 DEF) that flips itself face-down once per turn and searches any 'Geargia' monster (except itself) when flipped face-up."],
      ["Geargiaccelerator", 3, "Level 4 EARTH Machine that Special Summons itself from your hand in Defense Position while you control a 'Geargia' monster, and recovers another Geargia from the GY when sent from field to GY (including when detached from Gear Gigant X!)."],
      ["Geargiarsenal", 3, "Level 4 EARTH Machine that tributes itself to Special Summon any 'Geargia' monster (Geargiarmor or Geargiauger) from your Deck in Defense Position."],
      ["Geargiauger", 3, "Level 4 EARTH Machine (500 ATK / 500 DEF) that searches any Level 4 EARTH Machine (like Ancient Gear Box, which searches another Geargia!) on Normal Summon."],
      ["Geargianchor", 2, "Level 4 EARTH Machine that flips itself face-down and destroys monsters on the field up to the number of other Geargia monsters you control when flipped face-up."],
      ["Geargiano Mk-II", 3, "Level 3 EARTH Machine that Special Summons a 'Geargia' monster from your hand or GY in Defense Position when Normal or Flip Summoned."],
      ["Geargiano Mk-III", 2, "Level 3 EARTH Machine that Special Summons a 'Geargia' monster from your hand or GY in Defense Position when Special Summoned by the effect of a Geargia card (like Geargiagear!)."],
      ["Geargiano", 1, "Original Level 3 EARTH Machine summoned from the Deck alongside Mk-II or Mk-III by Geargiagear."],
      ["Ancient Gear Box", 1, "Searched by Geargiauger, Gear Gigant X, or Ancient Gear Ballista to immediately search another 500 ATK/DEF EARTH Machine (Geargiauger or Geargiano)."],
      ["Machina Gearframe", 2, "Searches Machina Fortress and serves as a Level 4 Machine for Gear Gigant X."],
      ["Machina Fortress", 2, "Recursive 2500 ATK EARTH Machine boss summoned by discarding extra Machines searched by Gear Gigant X and Ancient Gear Box."],
      ["Geargiagear", 3, "Signature Normal Trap that Special Summons 2 'Geargiano' monsters from your Deck and increases their Levels by 1—instantly assembling a 1-card Rank 4 Gear Gigant X or Rank 3 Geargiagear Gigant XG!"]
    ],
    extra: [
      ["Gear Gigant X", 3, "Signature Rank 4 EARTH Machine Xyz (2 Level 4 Machines): detaches 1 material (triggering Geargiaccelerator's GY recovery!) to search any Level 4 or lower Machine from Deck/GY, and Special Summons a Level 3 or lower Geargiano from GY when leaving the field."],
      ["Geargiagear Gigant XG", 2, "Rank 3 EARTH Machine Xyz (3 Level 3 monsters): detaches 1 material during the Battle Step when a Machine battles to negate all face-up cards the opponent controls and prevent their activations, and recovers a Geargia card when leaving the field."],
      ["Ancient Gear Ballista", 2, "Link-2 EARTH Machine that searches Ancient Gear Box on Link Summon, which triggers to search Geargiauger."],
      ["Platinum Gadget", 1, "Link-2 Machine that summons a Level 4 Geargia from the hand."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "gigo.json",
    archetype: "Gigo",
    title: "Pure Gigo",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Gagagigo", "Gigobyte", "Jigabyte", "Awakening of the Possessed - Gagigobyte"],
    summary: "The Gigo storyline series chronicles the tragic and powerful journey of Gagagigo through all of his WATER Reptile forms—from Gigobyte and Gagagigo to Giga Gagagigo and Gogiga Gagagigo. Supported by his lore partner Eria the Water Charmer and A Legendary Ocean (which reduces their Levels so high-ATK beatsticks can be summoned with fewer or no Tributes), the deck swarms the field with Rescue Rabbit and Jigabyte to field 2950 ATK Rank 4 Gagagigo the Risen and control the board with Number 4: Stealth Kragen.",
    allow: {
      "Rescue Rabbit": "Banishes itself to Special Summon 2 copies of Level 4 Gagagigo or Level 1 Gigobyte directly from the Deck.",
      "Unexpected Dai": "Special Summons Level 4 Gagagigo or Level 1 Gigobyte directly from the Deck while you control no monsters.",
      "A Legendary Ocean": "Treated as 'Umi'; boosts all WATER Gigo monsters by 200 ATK/DEF and reduces their Levels in hand and field by 1 so Level 5 Giga Gagagigo requires 0 Tributes!",
      "Warrior of Atlantis": "Discards itself to add A Legendary Ocean from the Deck to the hand and is a Level 4 WATER monster for Rank 4 plays.",
      "Eria the Water Charmer": "Level 3 WATER Spellcaster (Gagagigo's lore partner!) whose Spellcaster Type on field enables Jigabyte to Special Summon itself from the hand and send both to the GY to summon Awakening of the Possessed - Gagigobyte directly from the Deck!",
      "Number 4: Stealth Kragen": "Rank 4 WATER Aqua boss that turns all monsters on the field into WATER, destroys a WATER monster on either player's turn to burn for half its ATK, and floats into Stealth Kragen Spawns when destroyed.",
      "Stealth Kragen Spawn": "Rank 4 WATER Aqua Xyz summoned by Number 4: Stealth Kragen that destroys a WATER monster on either player's turn and floats back into Number 4: Stealth Kragen.",
      "Eria the Water Charmer, Gentle": "Link-2 WATER Spellcaster depicting Gagagigo/Jigabyte that revives a WATER monster from the opponent's GY, enables Jigabyte's Special Summon, and searches a 1500 DEF WATER monster when destroyed.",
      "Mistar Boy": "Link-2 WATER monster that boosts all WATER Gigo monsters by 500 ATK.",
      "Number 41: Bagooska the Terribly Tired Tapir": "Rank 4 stall boss made with two Level 4 WATER monsters that switches all monsters to Defense Position and negates their activated effects."
    },
    exclude: {},
    main: [
      ["Gagagigo", 3, "Level 4 WATER Reptile Normal Monster (1850 ATK / 1000 DEF) summoned via Rescue Rabbit and Unexpected Dai to make Gagagigo the Risen and Stealth Kragen."],
      ["Jigabyte", 3, "Level 4 WATER Reptile Effect Monster (1500 ATK / 200 DEF) that Special Summons itself from the hand while you control a Spellcaster (Eria), and summons another 1500 ATK / 200 DEF monster when destroyed."],
      ["Awakening of the Possessed - Gagigobyte", 2, "Level 5 WATER Reptile boss (2000 ATK / 200 DEF) that can be Special Summoned directly from your hand OR Deck by sending 1 Spellcaster (Eria) and 1 Level 4 or lower WATER monster (Gagagigo/Jigabyte) you control to the GY, ripping 1 random card from the opponent's hand!"],
      ["Giga Gagagigo", 3, "Level 5 WATER Reptile Normal Monster (2450 ATK / 1500 DEF) that becomes a Level 4 2650 ATK monster in hand/field with 0 Tributes while A Legendary Ocean is active!"],
      ["Gogiga Gagagigo", 2, "Level 8 WATER Reptile Normal Monster (2950 ATK / 2800 DEF) that becomes a 1-Tribute 3150 ATK monster under A Legendary Ocean."],
      ["Gigobyte", 2, "Level 1 WATER Reptile Normal Monster (350 ATK / 300 DEF) representing baby Gagagigo, summonable via Unexpected Dai to fuel Awakening of the Possessed - Gagigobyte."],
      ["Eria the Water Charmer", 2, "WATER Spellcaster partner of Gagagigo that turns on both Jigabyte's hand Special Summon and Awakening of the Possessed - Gagigobyte's Deck summon."],
      ["Rescue Rabbit", 3, "Summons 2 Gagagigo from the Deck; adding Jigabyte from hand immediately assembles the 3 Level 4 monsters required for Gagagigo the Risen!"],
      ["Unexpected Dai", 3, "Special Summons Gagagigo or Gigobyte directly from the Deck without using your Normal Summon."],
      ["Warrior of Atlantis", 3, "Discards itself to search A Legendary Ocean, or Normal Summons as a Level 4 WATER body for Rank 4 plays."],
      ["A Legendary Ocean", 3, "Boosts all WATER Gigo monsters by 200 ATK/DEF and reduces their Levels by 1 so Level 5 Giga Gagagigo is a Level 4 2650 ATK Normal Summon."]
    ],
    extra: [
      ["Gagagigo the Risen", 3, "Signature Rank 4 WATER Reptile Xyz boss (3 Level 4 monsters) with 2950 ATK / 2800 DEF, easily summoned using 2 Gagagigo (from Rescue Rabbit) + Jigabyte or Unexpected Dai."],
      ["Number 4: Stealth Kragen", 2, "Rank 4 WATER Aqua boss that turns all monsters into WATER, pops a WATER monster once per turn on either turn to burn, and floats into Stealth Kragen Spawns."],
      ["Stealth Kragen Spawn", 2, "Rank 4 WATER Aqua Xyz summoned by Number 4: Stealth Kragen that pops a WATER monster and floats back into Stealth Kragen."],
      ["Eria the Water Charmer, Gentle", 2, "Link-2 WATER Spellcaster made with any WATER Gigo monster; provides a face-up Spellcaster on field so Jigabyte can Special Summon itself from hand and Tribute both for Awakening of the Possessed - Gagigobyte from the Deck!"],
      ["Mistar Boy", 2, "Link-2 WATER monster that boosts Gagagigo the Risen to 3450 ATK."],
      ["Number 41: Bagooska the Terribly Tired Tapir", 1, "Rank 4 stall boss that switches monsters to Defense Position and negates their activated effects."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "glacial-beast.json",
    archetype: "Glacial Beast",
    title: "Pure Glacial Beast",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Glacial Beast", "Penguin"],
    summary: "Glacial Beast is a WATER Aqua Synchro archetype centered on Glacial Beast Polar Penguin, Blizzard Wolf, and their signature boss Glacial Beast Iceberg Narwhal. The deck synergizes seamlessly with the wider Penguin engine—using The Great Emperor Penguin and Royal Penguins Garden to summon Polar Penguin from the Deck for instant monster bounces, then tuning into the 2700 ATK Iceberg Narwhal to dominate the Battle Phase with all-around effect negation.",
    allow: {
      "Swap Frog": "Level 2 WATER Aqua that sends Glacial Beast Blizzard Wolf or The Great Emperor Penguin from the Deck to the GY on Summon.",
      "Icejade Ran Aegirine": "Level 7 WATER Aqua Tuner that discards a WATER monster (like Blizzard Wolf) to Special Summon itself and a Level 3 WATER Token, providing instant WATER Synchro access.",
      "Surface": "Spell that revives Level 3 Glacial Beast Polar Penguin from the GY in Defense Position—immediately triggering Polar Penguin's on-Special-Summon effect to return 1 monster your opponent controls to the hand!",
      "Foolish Burial": "Limited to 1 in TCG: sends Glacial Beast Blizzard Wolf or Nopenguin to the GY.",
      "Marincess Coral Anemone": "Link-2 WATER monster that revives Glacial Beast Polar Penguin or Blizzard Wolf (both have 1500 or less ATK!) from the GY—triggering Polar Penguin's monster bounce!",
      "White Aura Whale": "Level 8 WATER Synchro companion that destroys all opponent's Attack Position monsters on Synchro Summon.",
      "Swordsoul Supreme Sovereign - Chengying": "Level 10 WATER Synchro boss accessible via Polar Penguin + Level 7 Iceberg Narwhal or Ran Aegirine."
    },
    exclude: {},
    main: [
      ["Glacial Beast Polar Penguin", 3, "Level 3 WATER Aqua Tuner: targets 1 monster the opponent controls and returns it to the hand when Special Summoned (or returns 1 card on field if destroyed by battle/effect); treated as both a 'Glacial Beast' and 'Penguin' monster!"],
      ["Glacial Beast Blizzard Wolf", 3, "Level 4 WATER Aqua non-Tuner: negates an attack once per turn to Special Summon a Level 4 or lower WATER monster (Polar Penguin!) from your hand, and revives itself from the GY at the start of the opponent's Battle Phase if you control no monsters."],
      ["Penguin Squire", 3, "Level 5 WATER Aqua Tuner that Special Summons itself when a monster is Set and reduces its Level by 1 or 2 to Synchro Summon Level 7 Glacial Beast Iceberg Narwhal."],
      ["The Great Emperor Penguin", 3, "Tributes itself to Special Summon up to 2 'Penguin' monsters (Glacial Beast Polar Penguin + Puny Penguin/Nopenguin) directly from your Deck—immediately triggering Polar Penguin's bounce effect and assembling a Synchro Summon!"],
      ["Nopenguin", 2, "Level 3 WATER Aqua that revives itself from the GY whenever a Penguin effect (including Glacial Beast Polar Penguin!) is activated, and changes Polar Penguin's 'return to hand' effect into 'banish'!"],
      ["Puny Penguin", 2, "Revives a Penguin monster (Glacial Beast Polar Penguin!) from the GY in face-up Attack or face-down Defense Position when sent to the GY after being flipped."],
      ["Penguin Ninja", 2, "Level 3 WATER Aqua that bounces up to 2 opponent's Spells/Traps when flipped and flips Penguins face-down."],
      ["Swap Frog", 3, "Special Summons itself by discarding a WATER monster and sends Glacial Beast Blizzard Wolf or Nopenguin from the Deck to the GY on Summon."],
      ["Royal Penguins Garden", 3, "Continuous Spell that searches ANY 'Penguin' card (including Glacial Beast Polar Penguin!) on activation, then reduces a Penguin's Level by 1 and discards 1 card (putting Blizzard Wolf or Nopenguin into the GY)."],
      ["Surface", 3, "Special Summons Level 3 Glacial Beast Polar Penguin from your GY in Defense Position, immediately triggering Polar Penguin's effect to bounce (or banish via Nopenguin!) an opponent's monster."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: sends Nopenguin or Glacial Beast Blizzard Wolf to the GY."]
    ],
    extra: [
      ["Glacial Beast Iceberg Narwhal", 3, "Signature Level 7 WATER Aqua Synchro boss (1 Tuner + 1+ non-Tuner WATER monsters): inflicts 600 burn damage whenever your monster is destroyed by battle/opponent's effect, and during the Battle Phase while you control another monster, negates and destroys ANY card or effect your opponent activates!"],
      ["Penguin Brave", 2, "Level 6 WATER Aqua Synchro (summoned with Level 3 Polar Penguin + Level 3 Nopenguin) that Special Summons a Penguin from the Deck face-down and flips it face-up when the opponent activates a monster effect."],
      ["Marincess Coral Anemone", 2, "Link-2 WATER monster that revives Glacial Beast Polar Penguin (800 ATK) or Blizzard Wolf (1400 ATK) from the GY, triggering Polar Penguin's on-Special-Summon bounce!"],
      ["White Aura Whale", 1, "Level 8 WATER Synchro that wipes the opponent's Attack Position monsters."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "goblin.json",
    archetype: "Goblin",
    title: "Pure Goblin",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Goblin"],
    summary: "The Goblin Biker strategy is an explosive Rank 3 Xyz archetype where every rider detaches material from either player's field to swarm from hand or graveyard. Guided by Goblin Biker Dugg Charger, Mean Merciless, and Goblin Biker Grand Entrance, the deck rapidly establishes Goblin Biker Big Gabonga, which attaches opposing face-up monsters as material whenever materials are detached on either turn before ranking up into the towering Full Armored Dark Knight Lancer.",
    allow: {
      "Tour Guide From the Underworld": "Normal Summon starter that summons Level 3 Fiend Goblin Biker Mean Merciless or Dugg Charger directly from the Deck for a 1-card Rank 3 Goblin Biker Big Gabonga.",
      "Speedroid Terrortop": "Special Summons itself when you control no monsters and searches Speedroid Taketomborg for a 0-Normal-Summon Rank 3 Goblin Biker Big Gabonga.",
      "Speedroid Taketomborg": "Searched by Terrortop; Special Summons itself while you control a WIND monster to overlay into Big Gabonga.",
      "Emergency Teleport": "Special Summons Level 3 Psychic Goblin Biker Clatter Sploder from the Deck.",
      "Xyz Armor Fortress": "Rank 5 Xyz that ranks up over any Rank 3 Xyz; Goblin Biker Dugg Charger can detach Fortress's materials to Special Summon itself, immediately fulfilling Fortress's 0-material requirement to rank up into Full Armored Dark Knight Lancer!",
      "Full Armored Dark Knight Lancer": "Rank 7 Xyz stacked over Xyz Armor Fortress that equips an opponent's monster when an equip occurs and provides extra Xyz Materials for Goblin Bikers to detach on the opponent's turn.",
      "Full-Armored Xyz": "Searched by Xyz Armor Fortress to Rank-Up on the opponent's turn and equip an Xyz from GY."
    },
    exclude: {},
    main: [
      ["Goblin Biker Dugg Charger", 3, "Level 3 EARTH Warrior that detaches 1 Xyz Material from EITHER field to Special Summon itself from hand, and searches any 'Goblin' Spell/Trap on Normal or Special Summon."],
      ["Goblin Biker Mean Merciless", 3, "Level 3 WATER Fiend that Special Summons a Goblin from hand on Normal/Special Summon, and detaches 1 Xyz Material from either field during your Main Phase to revive itself from the GY."],
      ["Goblin Biker Clatter Sploder", 3, "Level 3 FIRE Psychic that revives a Goblin from your GY on Normal/Special Summon, and detaches 1 Xyz Material from either field as a Quick Effect during the opponent's Main Phase to revive itself from the GY!"],
      ["Goblin Biker Boom Mach", 2, "Level 3 WIND Warrior that detaches 1 Xyz Material from either field as a Quick Effect during either Main Phase to Special Summon itself from hand or GY (instantly triggering Big Gabonga's monster-attach on the opponent's turn!)."],
      ["Goblin Bikers Gone Wild", 2, "Level 6 DARK Beast-Warrior that Special Summons itself from hand/GY if you control no monsters or only Goblins, and summons a Level 4 or lower Goblin from Deck on Normal/Special Summon."],
      ["Tour Guide From the Underworld", 3, "One-card Rank 3 Goblin Biker Big Gabonga starter that summons Dugg Charger or Mean Merciless from the Deck."],
      ["Speedroid Terrortop", 3, "Summons itself without using the Normal Summon and searches Taketomborg for an instant Rank 3 Big Gabonga."],
      ["Speedroid Taketomborg", 1, "Summons itself from hand alongside Terrortop."],
      ["Goblin Biker Grand Entrance", 3, "Searches any 'Goblin' monster from your Deck, then lets you detach 1 Xyz Material from either field to Special Summon a Level 4 or lower Goblin from your hand; banishes from GY to detach 1 material and add a Goblin from GY to hand."],
      ["Goblin Biker Grand Breakout", 2, "Quick-Play Spell that tributes 1 monster you control to Special Summon a Goblin Biker from your Deck with a different Type, and neither player can target it with monster effects this turn."],
      ["Goblin Biker Grand Bash", 1, "Continuous Spell that boosts all Goblin monsters by 300 ATK, grants an extra Normal Summon of a Goblin monster, and modulates two Goblins' Levels for Rank 3 or Rank 6 Xyz plays."],
      ["Goblin Biker Grand Stampede", 1, "Continuous Trap that detaches 1 Xyz Material on the field while you control a Goblin Biker to negate an Effect Monster on the field."],
      ["Goblin Freefall Squad", 1, "Trap that attaches an opponent's monster summoned from the Extra Deck directly to a Goblin Xyz Monster you control as material."],
      ["Full-Armored Xyz", 1, "Searched by Xyz Armor Fortress to Xyz Summon Full Armored Dark Knight Lancer on the opponent's turn."]
    ],
    extra: [
      ["Goblin Biker Big Gabonga", 3, "Signature Rank 3 Xyz boss: searches any 'Goblin' monster on Xyz Summon, attaches 1 face-up monster on the field as material whenever an Xyz Material is detached from ANY monster on the field (triggered on the opponent's turn by Boom Mach or Clatter Sploder!), and attaches a Goblin from Deck in the End Phase."],
      ["Goblin Biker Troika Griare", 2, "Rank 6 Xyz boss (summoned using two Level 6 Gone Wild or via Grand Bash) that lets your Goblins attack directly while you have 3+ Xyz Materials on field, changes an opposing monster's battle position on summon, and detaches 1 material when an opponent attacks to negate the attack."],
      ["Goblin's Crazy Beast", 2, "Rank 6 Fiend Xyz that detaches 2 materials as a Quick Effect to attach 1 Spell/Trap on the field to itself as material, and detaches 1 material to protect your Xyz Monsters from destruction."],
      ["Xyz Armor Fortress", 1, "Rank 5 Xyz that ranks up over a Rank 3, searches Full-Armored Xyz, and has its materials detached by Dugg Charger/Mean Merciless so Full Armored Dark Knight Lancer can immediately rank up over it!"],
      ["Full Armored Dark Knight Lancer", 1, "Rank 7 Xyz boss that equips an opponent's monster when an equip occurs and provides extra Xyz Materials for Goblin Bikers."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "golden-castle-of-stromberg.json",
    archetype: "Golden Castle of Stromberg",
    title: "Pure Golden Castle of Stromberg",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Stromberg", "Glife", "Hexe Trude", "Prinzessin", "Pumpkin Carriage", "Glass Slippers", "Iron Hans", "Iron Knight", "Iron Cage"],
    summary: "Golden Castle of Stromberg is Leon von Schroeder's fairy-tale beatdown strategy powered by the terrifying banish synergies of Gren Maju Da Eiza. Discarding Glife the Phantom Bird fetches the signature Field Spell, which summons Prinzessin, Pumpkin Carriage, or Iron Hans directly from the Deck each turn. As Stromberg's maintenance cost banishes 10 cards face-down every Standby Phase, Gren Maju Da Eiza rapidly balloons past 4000 to 8000 ATK to deliver unstoppable game-ending blows.",
    allow: {
      "Gren Maju Da Eiza": "Level 3 Fiend that gains 400 ATK/DEF for each of your banished cards—gaining +4000 ATK/DEF every time Golden Castle of Stromberg's 10-card Standby Phase maintenance resolves!",
      "Pot of Desires": "Banishes 10 cards from the top of your Deck face-down to draw 2 cards, adding another +4000 ATK to Gren Maju Da Eiza while digging for Glife or Golden Castle.",
      "Terraforming": "Limited to 1 in TCG: searches Golden Castle of Stromberg directly from the Deck.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Level 4 Warriors Iron Hans or Iron Knight.",
      "Number 38: Hope Harbinger Dragon Titanic Galaxy": "Rank 8 Xyz summoned using Level 8 Hexe Trude that negates Spells and redirects attacks.",
      "Dingirsu, the Orcust of the Evening Star": "Rank 8 Xyz summoned using Level 8 Hexe Trude that sends an opponent's card to the GY without targeting and protects cards from destruction.",
      "Number 41: Bagooska the Terribly Tired Tapir": "Rank 4 stall boss made with Iron Hans + Iron Knight.",
      "Tornado Dragon": "Rank 4 Quick Effect Spell/Trap destruction made with Iron Hans + Iron Knight.",
      "Time Thief Redoer": "Rank 4 Xyz that detaches materials to spin opposing cards and banish itself as a Quick Effect."
    },
    exclude: {},
    main: [
      ["Glife the Phantom Bird", 3, "Level 4 WIND Winged Beast that discards itself from the hand to add 1 'Golden Castle of Stromberg' from your Deck to your hand, and destroys 1 Spell/Trap your opponent controls on Normal or Special Summon."],
      ["Hexe Trude", 2, "Level 8 DARK Spellcaster boss (2600 ATK) that can be Normal Summoned without Tributing while Golden Castle of Stromberg is on the field, destroys 1 card on the field per turn while Stromberg is up, and attacks a second time while gaining 400 ATK on battle destruction."],
      ["Prinzessin", 3, "Level 4 LIGHT Fairy that cannot be attacked by Level 4+ monsters, gains 300 ATK per turn, and Special Summons Pumpkin Carriage from hand/Deck; if she inflicts direct battle damage while Golden Castle is up, she equips Glass Slippers directly from your Deck to an opponent's monster!"],
      ["Pumpkin Carriage", 2, "Level 3 EARTH Plant that allows Prinzessin to attack directly, and while Golden Castle of Stromberg is in the Field Zone, makes Golden Castle of Stromberg immune to card effect destruction and targeting!"],
      ["Iron Hans", 3, "Level 4 EARTH Warrior that Special Summons Iron Knight from your Deck when Normal/Special Summoned (locking Extra Deck only if Golden Castle is NOT on the field!), and gains 1000 ATK while Golden Castle is active."],
      ["Iron Knight", 2, "Level 4 EARTH Warrior summoned by Iron Hans; loses 1000 ATK while you control Iron Hans, and searches any 'Iron Hans' or Spellcaster monster that mentions Golden Castle of Stromberg (Hexe Trude!) when destroyed by battle or card effect."],
      ["Gren Maju Da Eiza", 3, "Gains 400 ATK/DEF per banished card, reaching 4000 ATK after 1 Golden Castle Standby Phase or Pot of Desires, and 8000 ATK after both!"],
      ["Golden Castle of Stromberg", 3, "Signature Field Spell: banishes 10 cards face-down from your Deck each Standby Phase, Special Summons any monster that mentions it directly from your Deck during your Main Phase, and automatically destroys any opponent's monster that declares an attack while burning for half its ATK!"],
      ["Glass Slippers", 2, "Equip Spell that gives a Fairy +1000 ATK, OR when equipped to a non-Fairy (an opponent's monster via Prinzessin's direct attack!), prevents that monster from attacking and lowers its ATK by 1000!"],
      ["Iron Cage", 2, "Continuous Spell that sends 1 monster you control to the GY (or 1 opponent's monster if Golden Castle of Stromberg is in the Field Zone!) and revives it during your next Standby Phase."],
      ["Pot of Desires", 3, "Banishes 10 cards face-down to draw 2 cards and fuel Gren Maju Da Eiza."],
      ["Terraforming", 1, "Limited to 1 in TCG: searches Golden Castle of Stromberg."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Iron Hans."]
    ],
    extra: [
      ["Number 38: Hope Harbinger Dragon Titanic Galaxy", 2, "Rank 8 Xyz made with two Level 8 Hexe Trude to negate opposing Spells."],
      ["Dingirsu, the Orcust of the Evening Star", 1, "Rank 8 Xyz that sends an opposing card to the GY and protects your cards from destruction."],
      ["Number 41: Bagooska the Terribly Tired Tapir", 1, "Rank 4 stall boss made with Iron Hans + Iron Knight."],
      ["Tornado Dragon", 1, "Rank 4 Quick Effect Spell/Trap removal."],
      ["Time Thief Redoer", 1, "Rank 4 Xyz disruption made with Iron Hans + Iron Knight."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "gouki.json",
    archetype: "Gouki",
    title: "Pure Gouki",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Gouki"],
    summary: "Gouki is an aggressive EARTH Warrior Link-climbing archetype where every Main Deck monster searches another Gouki card whenever sent from the field to the GY. Normal Summoning Gouki Suprex or Machine Suprex quickly chains multiple searches into Gouki Re-Match, assembling unstoppable boss monsters like the all-unaffected Link-4 Gouki The Powerload Ogre and the multi-attacking board-negator Gouki The Master Ogre.",
    allow: {
      "Fire Flint Lady": "Level 1 FIRE Warrior that Special Summons itself while you control a Warrior to put a second Warrior on the field alongside any Gouki monster.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Gouki Suprex or Gouki Machine Suprex.",
      "Ferocious Flame Swordsman": "Link-2 FIRE Warrior that boosts all Warrior monsters by 500 ATK and revives a non-Link Warrior upon destruction.",
      "S:P Little Knight": "Link-2 Warrior that banishes an opposing card on summon and banishes 2 monsters until the End Phase as a Quick Effect."
    },
    exclude: {},
    main: [
      ["Gouki Suprex", 3, "Core Level 4 starter: Special Summons 1 'Gouki' monster from your hand when Normal Summoned, and searches any Gouki card from your Deck when sent from the field to the GY."],
      ["Gouki Machine Suprex", 3, "Level 4 EARTH Warrior Tuner: Special Summons itself and another Gouki from hand, and searches any Gouki card from your Deck when sent from the field to the GY."],
      ["Gouki Headbatt", 3, "Level 2 Gouki that sends 1 other Gouki monster from your hand to the GY to Special Summon itself from your hand while you control a Gouki, and searches any Gouki card when sent from field to GY."],
      ["Gouki Twistcobra", 3, "Level 3 Gouki that tributes 1 Gouki monster as a Quick Effect to give another Gouki ATK equal to its original ATK, and searches any Gouki card when sent from field to GY."],
      ["Gouki Octostretch", 2, "Level 1 Gouki handtrap that halves battle/effect damage and searches any Gouki card when sent from the field to the GY."],
      ["Gouki Guts", 2, "Level 1 Gouki that cannot be destroyed by battle, boosts all Goukis by 200 ATK, and searches any Gouki card when sent from the field to the GY."],
      ["Gouki Iron Claw", 2, "Level 2 Gouki handtrap that discards itself during damage calculation to give your battling Gouki +1000 ATK and make it unaffected by opponent's card effects, and searches when sent from field to GY."],
      ["Gouki Riscorpio", 2, "Level 5 Gouki (2300 ATK) that can be Normal Summoned without Tributing if you control no monsters or only Goukis, and searches any Gouki card when sent from field to GY."],
      ["Fire Flint Lady", 2, "Free Level 1 Warrior extender from hand to enable a Link-2 Summon alongside any single Gouki."],
      ["Gouki Re-Match", 3, "Core Spell (searchable by any Gouki!) that Special Summons 2 Gouki monsters with different Levels from your GY in Defense Position—turning any Link-2 into a Link-4 Powerload Ogre or Master Ogre!"],
      ["Gouki Gameface", 2, "Continuous Spell that protects Goukis and tributes a Link-3+ Gouki to Special Summon a Gouki from Deck or Extra Deck."],
      ["Gouki Cage Match", 2, "Continuous Spell that places counters when Gouki monsters are summoned and searches Gouki cards."],
      ["Gouki Finishing Move", 1, "Searched by Gouki GY effects; gives a Gouki Link Monster +1000 ATK per Link Rating (putting Link-4 Master Ogre or Powerload Ogre at 6800 ATK!) and piercing damage."],
      ["Gouki Face Turn", 1, "Destroys 1 Gouki card you control (like Gouki Gameface) to revive a Gouki monster from your GY (including Gouki Link Monsters!)."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Gouki Suprex or Gouki Machine Suprex."]
    ],
    extra: [
      ["Gouki The Powerload Ogre", 2, "Signature Link-4 boss (2+ Warrior monsters): gains ATK equal to the combined Link Rating of other Link Monsters you control x 200, is completely UNAFFECTED by other cards' effects while Link Summoned, and tributes 1 Gouki Link Monster to destroy cards on the field up to its Link Rating!"],
      ["Gouki The Master Ogre", 2, "Signature Link-4 boss: attacks all monsters your opponent controls, and returns Gouki monsters it points to back to the hand as a Quick Effect to negate an equal number of face-up cards your opponent controls!"],
      ["Gouki The Tyrant Ogre", 1, "Level 8 EARTH Warrior Fusion boss (summoned via Gouki Sheik Ogre): destroys cards on the field on Fusion Summon up to the total Link Rating of Gouki Link Monsters used as material, and prevents opponent activations when battling!"],
      ["Gouki Dragon Ogre", 1, "Level 6 EARTH Warrior Synchro (made with Machine Suprex + Headbatt/Iron Claw): searches a Gouki Spell on Synchro Summon and floats into Gouki monsters."],
      ["Gouki Sheik Ogre", 2, "Link-2 Gouki that Special Summons a Gouki from hand when added there from the Deck, and Fusion Summons Gouki The Tyrant Ogre during your Main Phase without a Fusion Spell!"],
      ["Gouki The Great Ogre", 1, "Link-3 Gouki that reduces opposing monsters' ATK by their original DEF and protects itself from destruction."],
      ["Gouki Thunder Ogre", 1, "Link-3 Gouki that grants an additional Normal Summon to a zone it points to during the Main Phase."],
      ["Gouki Heel Ogre", 1, "Link-2 Gouki that negates the activation of an opponent's monster effect that points to it and revives a Gouki."],
      ["Gouki Jet Ogre", 1, "Link-2 Gouki that pops a Gouki card you control to boost all Gouki monsters by 500 ATK."],
      ["Ferocious Flame Swordsman", 1, "Link-2 FIRE Warrior that boosts all Warriors by 500 ATK and revives a Warrior upon destruction."],
      ["S:P Little Knight", 1, "Link-2 Warrior providing banish disruption."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "goyo.json",
    archetype: "Goyo",
    title: "Pure Goyo",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Goyo", "Miracle Synchro Fusion"],
    summary: "Goyo is Officer Trudge's iconic EARTH Warrior Synchro strategy centered around stealing opposing monsters destroyed by battle. Normal Summoning an EARTH Tuner alongside Level 2/3 extenders easily accesses Level 3 Goyo Defender, whose effect immediately summons a second and third copy from the Extra Deck. These three defenders then serve as Synchro or Fusion material for Goyo Guardian, Goyo King, and Miracle Synchro Fusion's devastating 3000 ATK boss Goyo Emperor.",
    allow: {
      "Jutte Fighter": "Trudge's signature Level 2 EARTH Warrior Tuner that switches an opponent's Attack Position monster to Defense Position (making it easy to destroy by battle with Goyo monsters to steal it!) and satisfies the EARTH Tuner requirement of Goyo Guardian and Goyo Chaser.",
      "Junk Forward": "Level 3 EARTH Warrior that Special Summons itself when you control no monsters; Normal Summoning a Level 3 EARTH Tuner (Psychic Wheeleder) alongside it makes Level 6 Goyo Guardian, or pairing a Level 1 EARTH Tuner with a Level 2 makes Level 3 Goyo Defender!",
      "Super Quantum Red Layer": "Level 5 Warrior that Special Summons itself when you control no monsters; pairs with Level 1 EARTH Tuner Attack Gainer to immediately Synchro Summon Level 6 Goyo Guardian without using your Normal Summon!",
      "Attack Gainer": "Level 1 EARTH Warrior Tuner that pairs with Level 2 monsters to Synchro Summon Level 3 Goyo Defender (which then summons 2 more Goyo Defenders from the Extra Deck!).",
      "Spell Striker": "Level 3 EARTH Warrior that banishes a Spell from the GY to Special Summon itself; pairs with Level 3 EARTH Tuner Psychic Wheeleder for Goyo Guardian, or with Level 2 Jutte Fighter for Level 5 Goyo Chaser.",
      "Psychic Wheeleder": "Level 3 EARTH Psychic Tuner that Special Summons itself from the hand while you control a Level 3 monster (Junk Forward, Spell Striker, or Goyo Defender!) and pops a monster when used for a Synchro Summon.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Jutte Fighter, Attack Gainer, Junk Forward, or Spell Striker.",
      "Naturia Beast": "Level 5 EARTH Beast Synchro made with Level 2 EARTH Tuner Jutte Fighter + Level 3 Junk Forward that sends the top 2 cards of your Deck to the GY to negate Spell card activations.",
      "The Phantom Knights of Break Sword": "Rank 3 Xyz made with two Level 3 Goyo Defenders that detaches 1 material to destroy 1 card you control and 1 card the opponent controls."
    },
    exclude: {},
    main: [
      ["Jutte Fighter", 3, "Trudge's Level 2 EARTH Warrior Tuner that switches an opponent's Attack Position monster to weak Defense Position so Goyo Guardian, Chaser, or Predator can destroy and steal it."],
      ["Attack Gainer", 3, "Level 1 EARTH Warrior Tuner that lowers an opposing monster's ATK by 1000 when used as Synchro Material, and tunes with Level 5 Red Layer for Level 6 Goyo Guardian or with Level 3 Goyo Defender for a Level 4/7 climb."],
      ["Psychic Wheeleder", 3, "Level 3 EARTH Psychic Tuner that Special Summons itself from the hand while you control a Level 3 monster (including Level 3 Goyo Defender!), then tunes with Goyo Defender to make Level 6 Goyo Guardian while destroying an opponent's monster!"],
      ["Junk Forward", 3, "Level 3 EARTH Warrior that Special Summons itself when you control no monsters to pair with Jutte Fighter (for Level 5 Goyo Chaser) or Psychic Wheeleder (for Level 6 Goyo Guardian)."],
      ["Spell Striker", 3, "Level 3 EARTH Warrior that banishes a Spell from the GY to Special Summon itself without using your Normal Summon."],
      ["Super Quantum Red Layer", 3, "Level 5 Warrior that Special Summons itself when you control no monsters; pairs with Level 1 EARTH Tuner Attack Gainer for Goyo Guardian or with Level 3 Psychic Wheeleder for Level 8 Goyo King."],
      ["Miracle Synchro Fusion", 3, "Banishes 2 EARTH Warrior Synchro Monsters from your field or GY (such as two used Goyo Defenders!) to Fusion Summon Goyo Emperor, and draws 1 card if destroyed while Set."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Jutte Fighter, Attack Gainer, Junk Forward, or Spell Striker."]
    ],
    extra: [
      ["Goyo Guardian", 2, "Iconic Level 6 EARTH Warrior Synchro (1 EARTH Tuner + 1+ non-Tuners; 2800 ATK): Special Summons any opponent's monster it destroys by battle to your field in Defense Position."],
      ["Goyo Defender", 3, "Core Level 3 EARTH Warrior Synchro: while you control only EARTH Warrior Synchro Monsters, Special Summons a 2nd and 3rd copy of Goyo Defender directly from your Extra Deck, turning 1 Level 3 Synchro into 3 bodies!"],
      ["Goyo King", 2, "Level 8 EARTH Warrior Synchro boss (1 Tuner + 1+ non-Tuner Synchro Monsters—made with Level 2 Jutte Fighter + two Level 3 Goyo Defenders!): gains 400 ATK per EARTH Warrior Synchro on the field, and steals an opponent's monster when destroying a monster by battle!"],
      ["Goyo Emperor", 2, "Level 10 EARTH Warrior Fusion boss (2 EARTH Warrior Synchro Monsters; summoned via Miracle Synchro Fusion with 3000 ATK): steals any monster that you or your stolen monsters destroy by battle, and tributes an EARTH Warrior Synchro to steal any Special Summoned monster your opponent summons!"],
      ["Goyo Chaser", 2, "Level 5 EARTH Warrior Synchro (1 EARTH Tuner + 1+ non-Tuners): gains 300 ATK per other EARTH Warrior Synchro on the field and steals monsters it destroys by battle with halved ATK."],
      ["Goyo Predator", 2, "Level 6 EARTH Warrior Synchro that steals monsters it destroys by battle with halved battle damage."],
      ["Naturia Beast", 1, "Level 5 EARTH Synchro that mills 2 cards to negate Spell card activations."],
      ["The Phantom Knights of Break Sword", 1, "Rank 3 Xyz made with two Level 3 Goyo Defenders to destroy a card on each field."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "gravekeeper-s.json",
    archetype: "Gravekeeper's",
    title: "Pure Gravekeeper's",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Gravekeeper", "Necrovalley", "Royal Tribute"],
    summary: "Gravekeeper's is the original graveyard-lockdown control archetype protecting the tomb of the Pharaoh with Necrovalley. Discarding Gravekeeper's Commandant searches Necrovalley, instantly turning on devastating floodgates like Royal Tribute (wiping all monsters from both hands) and Hidden Temples of Necrovalley (preventing all non-Gravekeeper's Special Summons). Gravekeeper's Spiritualist then fuses directly into Gravekeeper's Supernaturalist to protect Necrovalley from destruction and search fresh pieces every End Phase.",
    allow: {
      "Terraforming": "Limited to 1 in TCG: searches Necrovalley directly from the Deck.",
      "Artemis, the Magistus Moon Maiden": "Link-1 Spellcaster that links off Level 4 Gravekeeper's Recruiter on Turn 1—immediately triggering Recruiter's mandatory GY effect to search Gravekeeper's Commandant (which then searches Necrovalley!)."
    },
    exclude: {},
    main: [
      ["Gravekeeper's Commandant", 3, "Core starter: discards itself to the GY to add 1 'Necrovalley' from your Deck to your hand (and is a 2100 ATK beater on the field under Necrovalley)."],
      ["Gravekeeper's Spiritualist", 3, "Level 4 Gravekeeper that Fusion Summons 1 Spellcaster Fusion Monster (Gravekeeper's Supernaturalist) during your Main Phase while Necrovalley is on the field, using itself and monsters from your hand or field as material!"],
      ["Gravekeeper's Recruiter", 3, "Mandatory trigger when sent from your field to the GY (including by linking into Link-1 Artemis!): adds any 'Gravekeeper's' monster with 1500 or less DEF (Commandant, Headman, Spiritualist, or Descendant) from your Deck to your hand."],
      ["Gravekeeper's Spy", 3, "2000 DEF Flip monster (2500 DEF under Necrovalley) that Special Summons any Gravekeeper's monster with 1500 or less ATK from your Deck when flipped face-up."],
      ["Gravekeeper's Headman", 2, "Level 3 Gravekeeper that Special Summons 1 Level 4 Gravekeeper's monster from your hand or GY in Attack or face-down Defense Position when Normal or Special Summoned."],
      ["Gravekeeper's Descendant", 2, "Tributes 1 other face-up Gravekeeper's monster you control (like Recruiter, triggering its search!) to destroy 1 card your opponent controls."],
      ["Gravekeeper's Heretic", 1, "1800 ATK Gravekeeper that is completely unaffected by ALL other card effects while Necrovalley is on the field."],
      ["Necrovalley", 3, "Iconic Field Spell: boosts all Gravekeeper's monsters by 500 ATK/DEF, prevents either player from banishing cards from the GY, and negates any card effect that would move a card in the GY to a different place."],
      ["Necrovalley Throne", 3, "Searches any 'Gravekeeper's' monster from your Deck OR immediately Normal Summons 1 Gravekeeper's monster from your hand in addition to your Normal Summon/Set."],
      ["Royal Tribute", 3, "Devastating Spell usable while you control Necrovalley: both players must discard ALL monsters in their hands to the GY!"],
      ["Hidden Temples of Necrovalley", 2, "Continuous Spell usable while both a Gravekeeper's monster and Necrovalley are on the field: neither player can Special Summon monsters, except 'Gravekeeper's' monsters!"],
      ["Gravekeeper's Stele", 2, "Bypasses Necrovalley by text to add 2 'Gravekeeper's' monsters from your GY back to your hand (recovering monsters discarded by Royal Tribute or Commandant!)."],
      ["Imperial Tombs of Necrovalley", 2, "Counter Trap that negates and destroys ANY Spell, Trap, or monster effect while both a Gravekeeper's monster and Necrovalley are on the field."],
      ["Necrovalley Temple", 1, "Continuous Trap that reduces opposing monsters' ATK/DEF by 500, activates Necrovalley from hand/GY during the Main Phase, and sets a Necrovalley Spell/Trap from the Deck if destroyed."],
      ["Terraforming", 1, "Limited to 1 in TCG: searches Necrovalley."]
    ],
    extra: [
      ["Gravekeeper's Supernaturalist", 3, "Signature Level 7 Fusion boss (2 Gravekeeper's monsters; summoned by Spiritualist): gains ATK/DEF equal to the combined original Levels of its materials x 100, prevents BOTH itself and any card in your Field Zone (Necrovalley!) from being destroyed by card effects, and searches any Gravekeeper's monster or Necrovalley card during the End Phase!"],
      ["Artemis, the Magistus Moon Maiden", 2, "Link-1 Spellcaster that converts a Normal Summoned Gravekeeper's Recruiter into an immediate search for Gravekeeper's Commandant (and thus Necrovalley + Royal Tribute) on Turn 1!"]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "graydle.json",
    archetype: "Graydle",
    title: "Pure Graydle",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Graydle"],
    summary: "Graydle is an insidious WATER Aqua parasite strategy where every Level 3 monster equips to and permanently steals an opponent's monster when destroyed by specific card types: Alligator by Spells, Cobra by Traps, and Eagle by Monsters. By triggering these self-destructions with board-clearing cards like Graydle Impact and Graydle Split, the deck turns the opponent's strongest threats against them while Level 2 Tuner Graydle Slime Jr. fuels rapid climbs into the multi-popping Level 8 boss Graydle Dragon.",
    allow: {
      "Surface": "Spell that Special Summons Level 3 WATER Aqua Graydle Slime Jr., Alligator, Cobra, or Eagle from your GY in Defense Position.",
      "Supply Squad": "Continuous Spell that draws 1 card once per turn whenever a Graydle monster you control is destroyed by battle or card effect.",
      "White Aura Whale": "Level 8 WATER Synchro (1 WATER Tuner + 1+ WATER non-Tuners) summoned via Graydle Slime Jr. + Graydle Slime that destroys all opponent's Attack Position monsters.",
      "Coral Dragon": "Level 6 WATER Synchro Tuner made with Level 3 Graydle Slime Jr. + Level 3 Graydle that pops a card and draws 1 when climbing into Graydle Dragon.",
      "Marincess Coral Anemone": "Link-2 WATER monster that revives any Graydle monster from the GY."
    },
    exclude: {},
    main: [
      ["Graydle Alligator", 3, "Level 3 WATER Aqua: when destroyed by battle OR by a Spell effect (such as Graydle Impact!) and sent to the GY, equips to 1 face-up monster your opponent controls and takes control of it."],
      ["Graydle Cobra", 3, "Level 3 WATER Aqua: when destroyed by battle OR by a Trap effect (such as Graydle Split!) and sent to the GY, equips to 1 face-up monster your opponent controls and takes control of it."],
      ["Graydle Eagle", 3, "Level 3 WATER Aqua: when destroyed by battle OR by a Monster effect (such as Graydle Dragon or Graydle Slime!) and sent to the GY, equips to 1 face-up monster your opponent controls and takes control of it."],
      ["Graydle Slime Jr.", 3, "Core Level 2 WATER Aqua Tuner: revives 1 'Graydle' monster from your GY when Normal Summoned, then Special Summons 1 Aqua monster with the same Level from your hand (assembling Level 2 + 3 + 3 = Level 8 Graydle Dragon in 1 Normal Summon!), and summons a Graydle from Deck when destroyed by battle."],
      ["Graydle Slime", 2, "Level 5 WATER Aqua Tuner: destroys 2 'Graydle' cards you control (triggering Graydle Eagle via its Monster effect!) to Special Summon itself from hand or GY, then revives 1 Graydle monster from your GY to immediately Synchro Summon Level 8 Graydle Dragon!"],
      ["Graydle Impact", 3, "Core Continuous Spell: either destroys 1 other Graydle card you control (triggering Graydle Alligator via Spell destruction!) and 1 card your opponent controls, OR searches any 'Graydle' card from your Deck during your End Phase."],
      ["Graydle Split", 3, "Normal Trap: equips to a monster you control for +500 ATK, then sends the equipped monster to the GY during your Main Phase to Special Summon 2 'Graydle' monsters with different names directly from your Deck!"],
      ["Graydle Parasite", 2, "Continuous Trap: Special Summons 1 Graydle monster from your Deck in Attack Position if your opponent declares a direct attack while you control no monsters, and revives a monster from the opponent's GY if a Graydle attacks directly."],
      ["Graydle Combat", 2, "Counter Trap: when a Spell/Trap or monster effect is activated that targets exactly 1 Graydle monster you control, either changes that effect into 'Destroy that monster' (triggering your Graydle's steal effect!) OR negates and destroys the activation."],
      ["Surface", 2, "Revives Graydle Slime Jr. or any Level 3 Graydle from the GY."],
      ["Supply Squad", 2, "Draws 1 card each turn when your Graydles are destroyed by battle or Graydle Impact."]
    ],
    extra: [
      ["Graydle Dragon", 3, "Signature Level 8 WATER Aqua Synchro boss (1 Aqua Tuner + 1+ non-Tuners; 3000 ATK): targets and destroys cards your opponent controls up to the number of WATER monsters used for its Synchro Summon, and revives 1 other WATER monster from your GY when destroyed by battle or card effect!"],
      ["White Aura Whale", 2, "Level 8 WATER Synchro (accessible via Graydle Slime + Level 3 Graydle or Slime Jr. + two Level 3s) that wipes Attack Position monsters and revives itself as a Tuner by banishing a WATER monster from GY."],
      ["Coral Dragon", 1, "Level 6 WATER Synchro Tuner made with Graydle Slime Jr. + a Level 4 stolen monster (or Coral Anemone climb)."],
      ["Marincess Coral Anemone", 2, "Link-2 WATER monster that revives any Graydle from your GY."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "grepher.json",
    archetype: "Grepher",
    title: "Pure Grepher",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Grepher", "Ryu Senshi"],
    summary: "The Grepher series explores the diverging destinies of Warrior Dai Grepher across LIGHT, DARK, and Chaos dimensions. Combining Chaos Grepher, Dark Grepher, and Lightray Grepher with Fusion Deployment (which reveals Ryu Senshi to summon Warrior Dai Grepher directly from the Deck), the strategy rapidly fills the graveyard with opposite Attributes. This fuels explosive special summons of iconic bosses like Black Luster Soldier - Envoy of the Beginning and the banishing, all-protecting Level 10 Synchro Chaos Angel.",
    allow: {
      "Ryu-Kishin Powered": "Named Fusion Material alongside Warrior Dai Grepher on Ryu Senshi; enables Fusion Deployment to summon Warrior Dai Grepher from the Deck and Polymerizes into Ryu Senshi.",
      "Black Luster Soldier - Envoy of the Beginning": "Iconic Chaos Warrior boss effortlessly summoned because Chaos Grepher, Dark Grepher, and Lightray Grepher load the GY with both LIGHT and DARK Warriors.",
      "The Chaos Creator": "Level 8 DARK monster (fuels Dark Grepher's hand Special Summon cost!) that banishes 1 LIGHT and 1 DARK from GY to summon itself and Special Summons a banished monster (synergizing with Lightray Grepher's deck-banish effect!).",
      "Destrudo the Lost Dragon's Frisson": "Level 7 DARK Dragon Tuner that can be discarded from hand to Special Summon Dark Grepher OR dumped from Deck by Dark Grepher/Chaos Grepher, then pays half LP to revive itself from the GY and tune with any Level 4 Grepher into Level 7 Synchros or Level 10 Chaos Angel!",
      "Fusion Deployment": "Reveals Ryu Senshi in the Extra Deck to Special Summon Warrior Dai Grepher directly from your hand or Deck!",
      "Unexpected Dai": "Special Summons the Level 4 Normal Monster Warrior Dai Grepher directly from the Deck while you control no monsters.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Dark Grepher, Chaos Grepher, Lightray Grepher, or Warrior Dai Grepher.",
      "Chaos Space": "Limited to 1 in TCG: discards a LIGHT or DARK Grepher to search Black Luster Soldier - Envoy of the Beginning or The Chaos Creator.",
      "Allure of Darkness": "Draws 2 cards by banishing a DARK monster from hand.",
      "Foolish Burial": "Limited to 1 in TCG: sends Destrudo or a Grepher to the GY.",
      "Polymerization": "Fuses Warrior Dai Grepher and Ryu-Kishin Powered into Ryu Senshi.",
      "Chaos Angel": "Level 10 Synchro boss that treats any LIGHT or DARK monster (including Level 4 Chaos Grepher or Dark Grepher!) as a Tuner, banishes a card on Summon, and grants both LIGHT and DARK protection.",
      "Ferocious Flame Swordsman": "Link-2 FIRE Warrior that boosts all Warrior monsters by 500 ATK and revives a non-Link Warrior from GY.",
      "S:P Little Knight": "Link-2 Warrior providing banish disruption.",
      "Black Luster Soldier - Soldier of Chaos": "Link-3 Warrior boss made using 3 monsters (including a Level 7+ monster like Destrudo or BLS Envoy) that gains targeting/destruction immunity and banishes cards or boosts ATK on battle."
    },
    exclude: {},
    main: [
      ["Chaos Grepher", 3, "Level 4 LIGHT Warrior (also treated as DARK on the field): discards 1 LIGHT or DARK monster to send 1 LIGHT or DARK monster with the opposite Attribute directly from your Deck to the GY."],
      ["Dark Grepher", 1, "Limited to 1 in TCG: Special Summons itself from the hand by discarding 1 Level 5 or higher DARK monster (Destrudo or The Chaos Creator), then discards 1 DARK monster to send any DARK monster from your Deck to the GY."],
      ["Lightray Grepher", 3, "Level 4 LIGHT Warrior: Special Summons itself from the hand by discarding 1 Level 5 or higher LIGHT monster, and discards 1 LIGHT monster to banish 1 LIGHT monster from your Deck (setting up The Chaos Creator!)."],
      ["Warrior Dai Grepher", 3, "Original Level 4 EARTH Warrior Normal Monster (1700 ATK / 1600 DEF) summoned from the Deck via Unexpected Dai and Fusion Deployment, and named Fusion Material for Ryu Senshi."],
      ["Knight Day Grepher", 2, "Level 4 LIGHT Warrior Gemini that recovers 1 Equip Spell from your GY during the End Phase once Gemini Summoned, and serves as a LIGHT discard for Chaos Grepher and Lightray Grepher."],
      ["Ryu-Kishin Powered", 2, "Level 4 DARK Fiend Normal Monster (named Fusion Material on Ryu Senshi) that serves as a DARK discard for Dark Grepher and Chaos Grepher."],
      ["Destrudo the Lost Dragon's Frisson", 2, "Level 7 DARK Dragon Tuner: serves as the Level 5+ DARK discard to Special Summon Dark Grepher from hand (or is dumped from Deck by Chaos/Dark Grepher), then revives itself from the GY to make Synchros!"],
      ["The Chaos Creator", 2, "Level 8 DARK Thunder: serves as a Level 5+ DARK discard for Dark Grepher, then banishes 1 LIGHT and 1 DARK from GY to Special Summon itself and Special Summons the LIGHT monster banished by Lightray Grepher!"],
      ["Black Luster Soldier - Envoy of the Beginning", 1, "Level 8 LIGHT Warrior (searchable by Chaos Space; serves as the Level 5+ LIGHT discard for Lightray Grepher!) that banishes 1 LIGHT and 1 DARK from GY to summon itself."],
      ["Fusion Deployment", 3, "Reveals Ryu Senshi in the Extra Deck to Special Summon Warrior Dai Grepher or Ryu-Kishin Powered directly from the Deck."],
      ["Unexpected Dai", 3, "Special Summons Warrior Dai Grepher or Ryu-Kishin Powered from the Deck while you control no monsters."],
      ["Chaos Space", 1, "Limited to 1 in TCG: sends a LIGHT or DARK Grepher from hand to GY to search Black Luster Soldier - Envoy of the Beginning or The Chaos Creator, then recycles a banished Grepher to draw 1."],
      ["Allure of Darkness", 2, "Draws 2 cards by banishing a DARK monster from hand."],
      ["Polymerization", 2, "Fuses Warrior Dai Grepher and Ryu-Kishin Powered into Ryu Senshi."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: dumps Destrudo or a Grepher to the GY."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Dark Grepher, Chaos Grepher, or Lightray Grepher."]
    ],
    extra: [
      ["Ryu Senshi", 2, "Signature Level 6 EARTH Warrior Fusion boss ('Warrior Dai Grepher' + 'Ryu-Kishin Powered'; 2000 ATK): negates the activation of any Normal Trap Card for 1000 LP, and negates and destroys any Spell Card that targets it!"],
      ["Chaos Angel", 2, "Level 10 Synchro boss (easily summoned using Level 4 Chaos Grepher [which is both LIGHT and DARK!] + Level 6 Ryu Senshi or via Destrudo!) that banishes a card on Summon and makes your monsters unaffected by monster effects."],
      ["Ferocious Flame Swordsman", 2, "Link-2 FIRE Warrior that boosts all Warrior monsters by 500 ATK and revives a non-Link Warrior from GY."],
      ["S:P Little Knight", 1, "Link-2 Warrior providing banish disruption."],
      ["Black Luster Soldier - Soldier of Chaos", 1, "Link-3 Warrior boss made using 3 monsters that gains targeting/destruction immunity and banishes cards on battle destruction."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  }
];

function checkDeck(d) {
  const issues = [];
  const mainCards = d.main || [];
  const extraCards = d.extra || [];
  const matches = d.match || [];
  const allow = d.allow || {};

  function cardMatches(cardName) {
    return matches.some(m => cardName.toLowerCase().includes(m.toLowerCase()));
  }

  // Check main cards
  for (const row of mainCards) {
    if (!Array.isArray(row) || row.length !== 3) {
      issues.push(`Main card row format error: ${JSON.stringify(row)}`);
      continue;
    }
    const [name, count, desc] = row;
    const lower = name.toLowerCase();

    // Banlist check
    if (tcgForbidden.has(lower)) {
      issues.push(`[FORBIDDEN] ${name} in main`);
    } else if (tcgLimited.has(lower) && count > 1) {
      issues.push(`[OVER-LIMITED] ${name} has ${count} copies (limit 1)`);
    } else if (tcgSemi.has(lower) && count > 2) {
      issues.push(`[OVER-SEMI] ${name} has ${count} copies (limit 2)`);
    } else if (count > 3) {
      issues.push(`[OVER-3] ${name} has ${count} copies`);
    }

    // Match or allow check
    if (!cardMatches(name) && !allow[name]) {
      issues.push(`[UNALLOWED OUTSIDE CARD] "${name}" in main not matched by ${JSON.stringify(matches)} and missing in allow!`);
    }
  }

  // Check extra cards
  for (const row of extraCards) {
    if (!Array.isArray(row) || row.length !== 3) {
      issues.push(`Extra card row format error: ${JSON.stringify(row)}`);
      continue;
    }
    const [name, count, desc] = row;
    const lower = name.toLowerCase();

    // Banlist check
    if (tcgForbidden.has(lower)) {
      issues.push(`[FORBIDDEN] ${name} in extra`);
    } else if (tcgLimited.has(lower) && count > 1) {
      issues.push(`[OVER-LIMITED] ${name} has ${count} copies (limit 1)`);
    } else if (tcgSemi.has(lower) && count > 2) {
      issues.push(`[OVER-SEMI] ${name} has ${count} copies (limit 2)`);
    } else if (count > 3) {
      issues.push(`[OVER-3] ${name} has ${count} copies`);
    }

    // Match or allow check
    if (!cardMatches(name) && !allow[name]) {
      issues.push(`[UNALLOWED OUTSIDE CARD] "${name}" in extra not matched by ${JSON.stringify(matches)} and missing in allow!`);
    }
  }

  return issues;
}

let allOk = true;
for (const d of decks) {
  const issues = checkDeck(d);
  if (issues.length > 0) {
    allOk = false;
    console.error(`Issues in ${d.archetype} (${d.slug}):\n`, issues.join('\n'));
  } else {
    console.log(`✓ ${d.archetype} (${d.slug}) passed all checks!`);
  }
}

if (allOk) {
  console.log('\nALL 15 DECKS PASSED LOCAL VALIDATION PERFECTLY!');
}

module.exports = decks;
