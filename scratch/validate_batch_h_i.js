const fs = require('fs');

const banlist = JSON.parse(fs.readFileSync('assets/data/banlist.json', 'utf8'));
const tcgForbidden = new Set((banlist.tcg?.forbidden || []).map(c => c.toLowerCase()));
const tcgLimited = new Set((banlist.tcg?.limited || []).map(c => c.toLowerCase()));
const tcgSemi = new Set((banlist.tcg?.semiLimited || []).map(c => c.toLowerCase()));

const decks = [
  {
    slug: "hand.json",
    archetype: "Hand",
    title: "Pure Hand",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Fire Hand", "Ice Hand", "Thunder Hand", "Magic Hand", "Prominence Hand", "Giant Hand", "Giant Red Hand"],
    summary: "The Hand strategy is Girag's iconic Barian control archetype built on the self-floating destruction loop of Fire Hand and Ice Hand. Crashing Fire Hand destroys an opposing monster to summon Ice Hand from the Deck, which in turn destroys a Spell or Trap to summon Fire Hand. Because both possess exactly 1600 ATK or DEF, any destruction on the field triggers Thunder Hand from the hand or GY to destroy another opponent's card, setting up Rank 4 overlays into Number 106: Giant Hand and the field-negating Rank 5 boss Number C106: Giant Red Hand.",
    allow: {
      "Number 106: Giant Hand": "Girag's signature Rank 4 'Hand' Xyz boss that detaches 2 materials as a Quick Effect to negate an opponent's monster effect and lock its battle position.",
      "Number C106: Giant Red Hand": "Girag's Rank 5 Chaos 'Hand' Xyz boss that detaches 1 material as a Quick Effect when any card/effect is activated to negate the effects of ALL other face-up cards currently on the field!",
      "Seventh Tachyon": "Reveals Number 106: Giant Hand in the Extra Deck to search a Level 4 monster, or searches Rank-Up-Magic via Seventh Ascension.",
      "Seventh Ascension": "Searches Rank-Up-Magic Barian's Force or Seventh Tachyon to rank up Number 106: Giant Hand into Number C106: Giant Red Hand.",
      "Rank-Up-Magic Barian's Force": "Upgrades Rank 4 Number 106: Giant Hand into Rank 5 Number C106: Giant Red Hand.",
      "Supply Squad": "Continuous Spell that draws 1 card every turn when Fire Hand or Ice Hand is destroyed by battle or card effect.",
      "Torrential Tribute": "Destroys all monsters on the field when a monster is summoned, destroying your 1600 ATK/DEF Hand monster to immediately trigger Thunder Hand from hand or GY.",
      "Tornado Dragon": "Rank 4 Xyz made with any two Level 4 Hands that pops backrow as a Quick Effect.",
      "Number 41: Bagooska the Terribly Tired Tapir": "Rank 4 stall boss made with two Level 4 Hands that forces monsters to Defense Position and negates their activated effects.",
      "Castel, the Skyblaster Musketeer": "Rank 4 Xyz that detaches 2 materials to spin any face-up card into the Deck.",
      "Time Thief Redoer": "Rank 4 Xyz that attaches cards from the opponent's Deck and provides quick-effect banish disruption."
    },
    exclude: {},
    main: [
      ["Fire Hand", 3, "Level 4 FIRE Pyro (1600 ATK / 1000 DEF): when destroyed by an opponent's card and sent to the GY, destroys 1 monster they control and Special Summons Ice Hand from your Deck; its 1600 original ATK satisfies Thunder Hand!"],
      ["Ice Hand", 3, "Level 4 WATER Aqua (1400 ATK / 1600 DEF): when destroyed by an opponent's card and sent to the GY, destroys 1 Spell/Trap they control and Special Summons Fire Hand from your Deck; its 1600 original DEF satisfies Thunder Hand!"],
      ["Thunder Hand", 3, "Level 4 LIGHT Thunder (1600 ATK / 1600 DEF): Quick Effect when a face-up monster(s) you control with 1600 original ATK or DEF is destroyed by battle or card effect: Special Summons itself from hand OR GY and destroys 1 card your opponent controls!"],
      ["Prominence Hand", 3, "Level 4 FIRE Pyro (600 ATK / 2000 DEF): Special Summons itself from your hand while you control a 'Magic Hand', 'Fire Hand', or 'Ice Hand', providing an instant Rank 4 Xyz Summon into Number 106: Giant Hand."],
      ["Magic Hand", 3, "Level 4 DARK Spellcaster (800 ATK / 1600 DEF): when your opponent adds a card(s) from their Deck to their hand (except by drawing), immediately sends that card(s) to the GY and inflicts 800 burn damage; has 1600 DEF for Thunder Hand!"],
      ["Seventh Ascension", 3, "Searches Seventh Tachyon or Rank-Up-Magic Barian's Force to access Girag's Giant Hand Xyz bosses."],
      ["Seventh Tachyon", 2, "Reveals Number 106: Giant Hand to search a Level 4 starter."],
      ["Rank-Up-Magic Barian's Force", 2, "Ranks up Number 106: Giant Hand into Number C106: Giant Red Hand and steals an opponent's Xyz Material."],
      ["Supply Squad", 3, "Draws 1 card once per turn whenever Fire Hand or Ice Hand crashes in battle or is destroyed by Torrential Tribute."],
      ["Torrential Tribute", 3, "Wipes the field on summon and destroys your 1600 ATK/DEF Hand monster to immediately trigger Thunder Hand from your hand or GY."]
    ],
    extra: [
      ["Number 106: Giant Hand", 3, "Girag's Rank 4 Xyz boss (2 Level 4 monsters): detaches 2 materials when an opponent's monster effect is activated on the field to negate that face-up monster's effects and prevent it from changing battle positions."],
      ["Number C106: Giant Red Hand", 2, "Girag's Rank 5 Chaos Xyz boss: once per turn when a card or effect is activated on the field (Quick Effect), detaches 1 material to negate the effects of ALL other face-up cards on the field until the end of the turn!"],
      ["Tornado Dragon", 1, "Rank 4 Xyz made with two Level 4 Hands for Quick Effect Spell/Trap removal."],
      ["Number 41: Bagooska the Terribly Tired Tapir", 1, "Rank 4 stall boss made with two Level 4 Hands."],
      ["Castel, the Skyblaster Musketeer", 1, "Rank 4 removal Xyz that spins a face-up card into the Deck."],
      ["Time Thief Redoer", 1, "Rank 4 Xyz disruption made with two Level 4 Hands."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "hazy-flame.json",
    archetype: "Hazy Flame",
    title: "Pure Hazy Flame",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Hazy Flame", "Hazy Pillar", "Hazy Glory"],
    summary: "Hazy Flame is a Level 6 FIRE Xyz archetype of mythical beasts completely immune to the opponent's card targeting. Using Hazy Pillar and Hazy Glory to bypass Tribute requirements, the deck swarms with Hazy Flame Peryton and Sphynx directly from the Deck and graveyard. Supported by Rekindling (which revives multiple 200 DEF Hazy Flames simultaneously), the deck stacks massive materials onto signature Rank 6 boss Hazy Flame Basiltrice to achieve complete targeting and effect destruction immunity while banishing opposing monsters each turn.",
    allow: {
      "Rekindling": "Special Summons as many FIRE monsters with 200 DEF as possible from your GY—and Hazy Flame Cerbereus, Hazy Flame Peryton, Hazy Flame Griffin, and Hazy Flame Mantikor ALL have exactly 200 DEF!",
      "Fire King Avatar Arvata": "Level 4 FIRE Beast-Warrior with 200 DEF that negates monster effects by destroying Hazy Flame Cerbereus in your hand or field (immediately triggering Cerbereus to search Hazy Pillar or Sphynx!).",
      "Onslaught of the Fire Kings": "Special Summons a Level 6 FIRE Beast/Beast-Warrior/Winged Beast Hazy Flame (Sphynx, Cerbereus, Griffin, or Mantikor) from the Deck and destroys it during the End Phase (triggering Cerbereus!).",
      "Fire Formation - Tenki": "Searches Fire King Avatar Arvata and boosts Beast-Warrior Hazy Flame Sphynx by 100 ATK.",
      "Evolzar Lars": "Rank 6 FIRE Dragon Xyz summonable using any two Level 6 FIRE Hazy Flame monsters that detaches 1 material to negate any face-up card the opponent controls.",
      "Bujinki Ahashima": "Link-2 monster that summons 2 Level 6 Hazy Flames (1 from hand, 1 from GY) to immediately Xyz Summon Hazy Flame Basiltrice or Evolzar Lars."
    },
    exclude: {},
    main: [
      ["Hazy Flame Peryton", 3, "Core Level 6 FIRE Pyro (200 DEF for Rekindling!): cannot be targeted by opponent's effects; sends 1 FIRE monster from your hand to the GY and tributes itself to Special Summon 2 'Hazy Flame' monsters directly from your Deck!"],
      ["Hazy Flame Sphynx", 3, "Core Level 6 FIRE Beast-Warrior: cannot be targeted by opponent's effects; declares the top card type of your Deck (Monster/Spell/Trap) to mill 1 card, and if correct, Special Summons 1 FIRE monster from your hand or GY!"],
      ["Hazy Flame Cerbereus", 3, "Level 6 FIRE Beast (2000 ATK / 200 DEF for Rekindling!): can be Normal Summoned without Tributing (as 1000 ATK), cannot be targeted by opponent's effects, and searches ANY 'Hazy' card (including Hazy Pillar!) when destroyed and sent to the GY."],
      ["Hazy Flame Griffin", 3, "Level 6 FIRE Winged Beast (200 DEF for Rekindling!): Special Summons itself from your hand in Defense Position if your opponent controls a monster and all monsters in your field/GY are FIRE, and cannot be targeted by opponent's effects."],
      ["Hazy Flame Hydra", 2, "Level 6 FIRE Dinosaur: cannot be targeted by opponent's effects; an Xyz Monster summoned using Hydra as material (Hazy Flame Basiltrice!) attaches 1 additional Hazy Flame monster from your GY as Xyz Material—helping Basiltrice instantly reach 5 materials!"],
      ["Hazy Flame Mantikor", 1, "Level 6 FIRE Winged Beast (2200 ATK / 200 DEF for Rekindling!): sends 1 other FIRE monster from hand/field to GY as a Quick Effect to make itself indestructible by card effects this turn."],
      ["Fire King Avatar Arvata", 3, "200 DEF FIRE monster that negates any monster effect by destroying Hazy Flame Cerbereus in your hand or field, immediately triggering Cerbereus to search Hazy Pillar or Peryton!"],
      ["Hazy Pillar", 3, "Core Continuous Spell: lets you Normal Summon 'Hazy Flame' monsters for 1 less Tribute (0 Tributes for Level 6s!), and once per turn attaches 1 Hazy Flame monster from your hand or field to a Hazy Flame Basiltrice you control!"],
      ["Rekindling", 3, "Revives up to 5 copies of Hazy Flame Peryton, Cerbereus, Griffin, Mantikor, and Arvata (all 200 DEF FIRE!) from your GY for a massive 5-material Hazy Flame Basiltrice + Evolzar Lars board!"],
      ["Onslaught of the Fire Kings", 2, "Special Summons Hazy Flame Cerbereus from the Deck and destroys it during the End Phase to search Hazy Pillar."],
      ["Fire Formation - Tenki", 2, "Searches Fire King Avatar Arvata and boosts Hazy Flame Sphynx."],
      ["Hazy Glory", 2, "Continuous Trap: lets you Normal Summon Hazy Flame monsters for 1 less Tribute, and sends itself from the field to the GY to recover 1 'Hazy' card from your GY to your hand."]
    ],
    extra: [
      ["Hazy Flame Basiltrice", 3, "Signature Rank 6 FIRE Pyro Xyz boss (2 or more [max. 5] Level 6 FIRE monsters): detaches 1 material to banish 1 monster your opponent controls or in their GY; gains +200 ATK/DEF per material (3+ materials), cannot be targeted by card effects (4+ materials), and cannot be destroyed by card effects (5 materials)!"],
      ["Evolzar Lars", 2, "Rank 6 FIRE Dragon Xyz that detaches 1 material to negate the effects of any face-up card your opponent controls."],
      ["Bujinki Ahashima", 1, "Link-2 monster that summons 1 Level 6 Hazy Flame from hand and 1 from GY to immediately Xyz Summon Hazy Flame Basiltrice."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "helios.json",
    archetype: "Helios",
    title: "Pure Helios",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Helios", "Macro Cosmos", "Grand Convergence", "Chaos Distill", "Golden Homunculus"],
    summary: "The Helios archetype embodies Professor Banner's alchemical mastery over the banish zone through Helios - The Primordial Sun and Macro Cosmos. Supported by Chaos Distill, which banishes sent cards while searching Macro Cosmos and your bosses, the deck continually grows Helios Duo Megistus, Helios Trice Megistus, and Golden Homunculus to astronomical ATK values. Paired with Grand Convergence for complete board wipes and Pot of Desires to instantly fuel thousands of bonus stats, the deck crushes opponents beneath overwhelming banish power.",
    allow: {
      "Gren Maju Da Eiza": "Level 3 FIRE Fiend companion that gains 400 ATK/DEF for each of your banished cards alongside Helios and Golden Homunculus.",
      "Eater of Millions": "Banishes 5+ cards face-down from your Extra Deck to Special Summon itself, instantly adding ATK to Helios, Golden Homunculus, and Gren Maju while banishing any monster it battles.",
      "Pot of Desires": "Banishes 10 cards from the top of your Deck face-down to draw 2 cards, immediately giving Golden Homunculus and Helios Trice Megistus +3000 ATK and Gren Maju +4000 ATK!",
      "Dimensional Fissure": "Continuous Spell that acts as copies 7-9 of Macro Cosmos by banishing any monster sent to the GY.",
      "Trap Trick": "Banishes 1 Macro Cosmos from your Deck to Set a 2nd Macro Cosmos directly to your field that can be activated the same turn to summon Helios - The Primordial Sun!",
      "Infernal Flame Banshee": "Rank 4 Pyro Xyz that can be summoned using two Level 4 Helios - The Primordial Sun to search another Helios Pyro monster, and revives itself when banished while you control a Pyro monster."
    },
    exclude: {},
    main: [
      ["Helios - The Primordial Sun", 3, "Level 4 LIGHT Pyro (? ATK / ? DEF): Special Summoned directly from your hand or Deck whenever Macro Cosmos is activated; gains 100 ATK/DEF for each banished monster."],
      ["Helios Duo Megistus", 2, "Level 6 LIGHT Pyro (? ATK / ? DEF): searchable by Chaos Distill; can be Special Summoned from hand by Tributing 1 Helios - The Primordial Sun, gains 200 ATK/DEF per banished monster, and revives itself during the End Phase with +300 ATK/DEF if destroyed by battle!"],
      ["Helios Trice Megistus", 1, "Level 8 LIGHT Pyro boss (? ATK / ? DEF): searchable by Chaos Distill; Special Summons itself by Tributing Helios Duo Megistus, gains 300 ATK/DEF per banished monster, attacks a second time if the opponent controls a monster, and revives itself with +500 ATK/DEF if destroyed by battle!"],
      ["Golden Homunculus", 3, "Amnael's Level 6 LIGHT Warrior boss (1500 base ATK/DEF) that gains 300 ATK and DEF for EACH of your banished cards—reaching 4500 ATK/DEF after a single Pot of Desires!"],
      ["Gren Maju Da Eiza", 3, "Gains 400 ATK/DEF for each of your banished cards, pairing with Macro Cosmos, Chaos Distill, and Pot of Desires for 4000–8000 ATK beatdown."],
      ["Eater of Millions", 3, "Banishes 5 to 15 Extra Deck cards face-down to Special Summon itself, fueling Helios, Golden Homunculus, and Gren Maju."],
      ["Chaos Distill", 3, "Core Continuous Spell: banishes any card sent to your GY, searches Macro Cosmos or Grand Convergence from your Deck, and banishes itself while Macro Cosmos is on the field to search Helios - The Primordial Sun, Helios Duo Megistus, or Helios Trice Megistus!"],
      ["Macro Cosmos", 3, "Signature Continuous Trap: when activated, Special Summons 1 'Helios - The Primordial Sun' directly from your hand or Deck, and banishes any card sent to the GY while face-up."],
      ["Grand Convergence", 3, "Signature Quick-Play Spell: while you control Macro Cosmos, inflicts 300 damage to your opponent and destroys ALL monsters on the field!"],
      ["Dimensional Fissure", 3, "Continuous Spell that banishes any monster sent to the GY, fueling Helios and Golden Homunculus."],
      ["Pot of Desires", 3, "Banishes 10 cards from your Deck to draw 2 cards and add +3000/+4000 ATK to your bosses."],
      ["Trap Trick", 2, "Banishes 1 Macro Cosmos from your Deck to Set another Macro Cosmos that can be activated immediately on the same turn."]
    ],
    extra: [
      ["Infernal Flame Banshee", 2, "Rank 4 Pyro Xyz that can be summoned using two Level 4 Helios - The Primordial Sun to search another Helios Pyro monster, and revives itself with bonus ATK when banished while you control a Pyro monster."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "heraldic-beast.json",
    archetype: "Heraldic Beast",
    title: "Pure Heraldic Beast",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Heraldic", "Heraldry"],
    summary: "Heraldic Beast is Vetrix's psychic Rank 4 Xyz archetype that weaponizes name manipulation and graveyard recursion to overwhelm opponent boards. Modern starters Heraldic Beast Gryphon and Stad Whale rapidly fetch Advanced Heraldry Art and Flash of Heraldry, easily fulfilling 3-material requirements to summon Number 69: Heraldry Crest. From there, the deck ranks up into Number 69: Heraldry Crest - Shatter Stream and the indestructible boss Dark Matter Demolition, turning opposing monsters into 'Unknown' cards with permanently negated effects.",
    allow: {
      "Foolish Burial": "Limited to 1 in TCG: sends Heraldic Beast Leo to the GY to immediately trigger its mandatory search for any Heraldic Beast monster.",
      "Terraforming": "Limited to 1 in TCG: searches Augmented Heraldry."
    },
    exclude: {},
    main: [
      ["Heraldic Beast Gryphon", 3, "Core starter: sends 1 Heraldic Beast (Leo!) from your Deck to the GY to Special Summon itself from hand, and counts as 2 materials for the Xyz Summon of a 3+ material 'Number' Xyz Monster (making 3-material Number 69 with just 2 monsters!)."],
      ["Heraldic Beast Stad Whale", 3, "Core starter: discards 1 card when Normal or Special Summoned to add ANY 2 'Heraldry' Spells/Traps from your Deck to your hand, and banishes itself from the GY to summon 2 same-name Heraldic Beasts from GY in Defense Position!"],
      ["Heraldic Beast Leo", 3, "Core searcher: mandatory trigger when sent to the GY (by Gryphon, Number 18, or Xyz detach) to add 1 'Heraldic Beast' monster (except Leo) from your Deck to your hand."],
      ["Heraldic Beast Amphisbaena", 3, "Discards 1 other Heraldic Beast monster to Special Summon itself from your hand."],
      ["Heraldic Beast Aberconway", 3, "Banishes another Heraldic Beast Aberconway from your GY to add 1 Heraldic Beast monster from your GY to your hand, and provides an 1800 ATK body for Stad Whale's revival."],
      ["Heraldic Beast Unicorn", 2, "Banishes itself from your GY to target 1 Psychic Xyz Monster (Number 18 or any Number 69 form!) in your GY and Special Summon it."],
      ["Heraldic Beast Twin-Headed Eagle", 1, "Banishes itself from your GY to target 1 face-up Xyz Monster you control with no materials and attach 2 Heraldic Beast monsters from your GY to it as materials."],
      ["Advanced Heraldry Art", 3, "Signature Spell: targets 2 Heraldic Beast monsters in your GY, Special Summons both of them, and immediately Xyz Summons 1 Xyz Monster using those 2 monsters only!"],
      ["Charged-Up Heraldry", 3, "Sends 1 monster from your hand/field to the GY to Special Summon 2 Heraldic Beast monsters from your Deck in Defense Position."],
      ["Flash of Heraldry", 2, "Quick-Play Spell: targets 1+ monsters your opponent controls and changes their names to 'Unknown'—causing Number 69: Heraldry Crest - Dark Matter Demolition to negate all of their activated effects!"],
      ["Heraldry Reborn", 2, "Special Summons 1 Heraldic Beast monster from your GY."],
      ["Augmented Heraldry", 2, "Field Spell that makes all Psychic Xyz Monsters on the field untargetable by Spells/Traps and discards a Heraldic Beast to search any 'Heraldry' Spell/Trap."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: sends Heraldic Beast Leo from Deck to GY to search Gryphon or Stad Whale."],
      ["Terraforming", 1, "Limited to 1 in TCG: searches Augmented Heraldry."]
    ],
    extra: [
      ["Number 69: Heraldry Crest", 2, "Rank 4 LIGHT Psychic Xyz: negates all other face-up Xyz Monsters on Summon, copies an Xyz Monster's name/effect, and immediately ranks up into Number 69: Heraldry Crest - Shatter Stream!"],
      ["Number 69: Heraldry Crest - Shatter Stream", 2, "Rank 4 LIGHT Psychic Xyz (2800 ATK): Xyz Summons directly over Number 69: Heraldry Crest; when your opponent activates a monster effect or declares an attack, Special Summons Dark Matter Demolition and destroys 1 card your opponent controls!"],
      ["Number 69: Heraldry Crest - Dark Matter Demolition", 2, "Rank 4 LIGHT Psychic Xyz boss (2900 ATK): cannot be destroyed by battle or card effects; detaches 1 material as a Quick Effect to change an opponent's monster's name to 'Unknown', and continuously negates ALL 'Unknown' effects activated by your opponent!"],
      ["Number 18: Heraldry Patriarch", 3, "Rank 4 LIGHT Psychic Xyz (2 Level 4 monsters): detaches 1 material as a Quick Effect to destroy all extra copies of same-name monsters on the field, and sends ANY 2 'Heraldic Beast' monsters from your Deck to the GY when sent to the GY!"],
      ["Number 8: Heraldic King Genom-Heritage", 1, "Rank 4 LIGHT Psychic Xyz: steals an opponent's Xyz Monster's name, ATK, and effect while reducing that monster's ATK to 0."],
      ["Number C69: Heraldry Crest of Horror", 1, "Rank 5 LIGHT Psychic Chaos Xyz (4000 ATK) that destroys all cards your opponent controls when an opponent's monster declares an attack."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "hex-sealed-fusion.json",
    archetype: "Hex Sealed Fusion",
    title: "Pure Hex Sealed Fusion",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Hex-Sealed Fusion"],
    summary: "The Hex-Sealed Fusion strategy centers around The Dark, The Light, and The Earth - Hex-Sealed Fusion—versatile Rock monsters that serve as named Fusion substitutes or Tribute themselves alongside field materials to cheat out Fusion bosses without Polymerization. Supported by Keeper of Dragon Magic, Fallen of Albaz, and Adamancipator Signs, the deck rapidly deploys devastating bosses like Red-Eyes Dark Dragoon, Blue-Eyes Tyrant Dragon, and Millennium-Eyes Restrict.",
    allow: {
      "Fallen of Albaz": "Level 4 DARK Dragon: fuses with an opponent's monster on Summon, OR pairs on the field with The Dark - Hex-Sealed Fusion to Tribute both and cheat out Red-Eyes Dark Dragoon.",
      "Albion the Shrouded Dragon": "Level 8 DARK Dragon that Special Summons itself from the hand/GY by sending Branded Retribution/Albaz to GY, providing a free Dragon Effect Monster on the field to Tribute alongside Hex-Sealed Fusions.",
      "Keeper of Dragon Magic": "Level 4 DARK Dragon that searches Polymerization and revives a named Fusion Material from the GY, AND serves as a Dragon on the field to Tribute with The Dark - Hex-Sealed Fusion for Red-Eyes Dark Dragoon.",
      "Doki Doki": "Level 2 EARTH Rock that discards a Rock (a Hex-Sealed Fusion) to Special Summon The Light, The Dark, or The Earth - Hex-Sealed Fusion directly from your Deck matching the discarded Attribute.",
      "Adamancipator Signs": "Revives any Rock monster (The Light, The Dark, or The Earth - Hex-Sealed Fusion!) from your GY and stacks another Hex-Sealed Fusion on top of your Deck.",
      "Polymerization": "Searched by Keeper of Dragon Magic; allows the Hex-Sealed Fusions to Fusion Summon from the hand or field into bosses that require a proper Fusion Summon.",
      "Red-Eyes Dark Dragoon": "Level 8 DARK Spellcaster Fusion boss that can be Special Summoned directly from the Extra Deck without Polymerization by Tributing The Dark - Hex-Sealed Fusion + any Dragon Effect Monster on the field.",
      "Blue-Eyes Tyrant Dragon": "Level 8 LIGHT Dragon Fusion boss summoned without Polymerization by Tributing The Light - Hex-Sealed Fusion + any Dragon on the field.",
      "Millennium-Eyes Restrict": "Level 1 DARK Spellcaster Fusion boss summoned without Polymerization by Tributing The Dark - Hex-Sealed Fusion + any Effect Monster on the field to absorb and negate opposing monsters.",
      "Invoked Caliga": "Level 4 DARK Beast Fusion boss summoned by Tributing The Dark - Hex-Sealed Fusion + any DARK monster on the field to restrict both players to 1 monster effect and 1 attack per turn.",
      "Invoked Mechaba": "Level 9 LIGHT Machine Fusion boss summoned via Polymerization using The Light - Hex-Sealed Fusion + any LIGHT monster for omni-negation.",
      "Lubellion the Searing Dragon": "Level 8 LIGHT Dragon Fusion summoned via Fallen of Albaz + 1 DARK monster to shuffle materials into the Deck for Fusion Summons.",
      "Ryu Senshi": "Level 6 EARTH Warrior Fusion boss summoned by Tributing The Earth - Hex-Sealed Fusion + a Warrior/Fiend on field to negate Normal Traps and targeting Spells."
    },
    exclude: {},
    main: [
      ["The Dark - Hex-Sealed Fusion", 3, "Level 3 DARK Rock: substitutes for any 1 named Fusion Material, OR tributes itself + 1 other material on the field without Polymerization to Special Summon Red-Eyes Dark Dragoon, Millennium-Eyes Restrict, or Invoked Caliga!"],
      ["The Light - Hex-Sealed Fusion", 3, "Level 3 LIGHT Rock: substitutes for any 1 named Fusion Material, OR tributes itself + 1 Dragon on the field without Polymerization to Special Summon Blue-Eyes Tyrant Dragon!"],
      ["The Earth - Hex-Sealed Fusion", 3, "Level 3 EARTH Rock: substitutes for any 1 named Fusion Material, OR tributes itself + 1 other material on the field without Polymerization to Special Summon an EARTH Fusion Monster."],
      ["Keeper of Dragon Magic", 3, "Level 4 DARK Dragon Effect Monster: discards 1 card on Normal/Special Summon to search Polymerization, AND serves as the exact '1 Dragon Effect Monster' on the field to Tribute alongside The Dark - Hex-Sealed Fusion for Red-Eyes Dark Dragoon!"],
      ["Fallen of Albaz", 3, "Level 4 DARK Dragon Effect Monster: fuses with an opponent's monster into Lubellion, or Tributes on the field with a Hex-Sealed Fusion."],
      ["Albion the Shrouded Dragon", 3, "Level 8 DARK Dragon Effect Monster: sends Fallen of Albaz from Deck to GY to Special Summon itself from hand, giving you a free Dragon on the field to Tribute alongside a Hex-Sealed Fusion!"],
      ["Doki Doki", 3, "Level 2 EARTH Rock: discards 1 Rock monster to Special Summon a Rock monster with the same Attribute and Level from your Deck."],
      ["Adamancipator Signs", 3, "Special Summons any Rock monster (The Dark, The Light, or The Earth - Hex-Sealed Fusion) from your GY with 0 Normal Summon cost."],
      ["Polymerization", 3, "Searched by Keeper of Dragon Magic; fuses a Hex-Sealed Fusion with another material from your hand or field to Fusion Summon Invoked Mechaba, Red-Eyes Dark Dragoon, or Blue-Eyes Tyrant Dragon."]
    ],
    extra: [
      ["Red-Eyes Dark Dragoon", 2, "3000 ATK DARK Fusion boss: summoned either by Tributing The Dark - Hex-Sealed Fusion + 1 Dragon Effect Monster on the field (no Polymerization needed!), via Polymerization, or via Lubellion; cannot be targeted or destroyed by card effects and discards 1 card for an omni-negate."],
      ["Blue-Eyes Tyrant Dragon", 2, "3400 ATK LIGHT Dragon Fusion boss: summoned by Tributing The Light - Hex-Sealed Fusion + 1 Dragon on the field (no Polymerization needed!) or via Polymerization; unaffected by Trap Cards and attacks all opponent's monsters."],
      ["Millennium-Eyes Restrict", 2, "Level 1 DARK Fusion boss: summoned by Tributing The Dark - Hex-Sealed Fusion + ANY Effect Monster on the field (no Polymerization needed!); equips an opponent's monster as a Quick Effect when they activate a monster effect."],
      ["Invoked Caliga", 1, "Level 4 DARK Fusion boss: summoned by Tributing The Dark - Hex-Sealed Fusion + any DARK monster on the field (no Polymerization needed!) to restrict both players to 1 monster effect and 1 attack per turn."],
      ["Invoked Mechaba", 2, "Level 9 LIGHT Machine Fusion boss: summoned via Polymerization using The Light - Hex-Sealed Fusion + another LIGHT monster; discards a card type to negate and banish that card type."],
      ["Lubellion the Searing Dragon", 2, "Level 8 LIGHT Dragon Fusion summoned via Fallen of Albaz + a DARK monster; discards 1 card to shuffle materials from your field/GY into the Deck for Fusion Summons."],
      ["Ryu Senshi", 1, "Level 6 EARTH Warrior Fusion boss for The Earth - Hex-Sealed Fusion that negates Normal Traps and targeting Spells."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "horn-of-heaven.json",
    archetype: "Horn of Heaven",
    title: "Pure Horn of Heaven",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Horn of Heaven", "Guiding Ariadne", "Bountiful Artemis", "Sanctum of Parshath", "Rebirth of Parshath"],
    summary: "The Horn of Heaven strategy is a punishing Counter Trap control deck built around Horn of Heaven, Black Horn of Heaven, and Grand Horn of Heaven. By placing Guiding Ariadne in the Pendulum Zone to waive all LP and discard costs, your Counter Traps activate for free while Ariadne reveals more traps upon destruction. Bountiful Artemis draws a card with every resolved negate, and Power Angel Valkyria searches replacement Fairies, completely shutting down the opponent's summons and ending their Main Phases on command.",
    allow: {
      "Minerva, Scholar of the Sky": "Level 4 LIGHT Fairy that gains 500 ATK every time a Horn of Heaven Counter Trap is activated and recovers a Counter Trap with a different name from your GY while The Sanctum of Parshath is face-up.",
      "Meltiel, Sage of the Sky": "Level 4 LIGHT Fairy that gains 1000 LP every time a Horn of Heaven Counter Trap resolves and destroys 1 card your opponent controls while The Sanctum of Parshath is face-up.",
      "Power Angel Valkyria": "Level 4 LIGHT Fairy that searches any LIGHT Fairy whenever you negate a Summon with Horn of Heaven, Black Horn of Heaven, or Grand Horn of Heaven.",
      "Sacred Arch-Airknight Parshath": "Level 9 LIGHT Fairy boss that Special Summons itself from your hand or GY by banishing 2 Fairies (or Counter Traps) whenever you activate a Horn of Heaven Counter Trap.",
      "Ties of the Brethren": "Pays 2000 LP to target 1 Level 4 LIGHT Fairy you control and Special Summon 2 other Level 4 LIGHT Fairies from your Deck.",
      "Solemn Judgment": "Iconic Counter Trap that protects your Set Horn of Heaven traps from backrow removal at 0 LP cost under Guiding Ariadne (1 copy, Limited in TCG).",
      "Solemn Strike": "Counter Trap that negates Special Summons or monster effects at 0 LP cost under Guiding Ariadne.",
      "Celestial Knightlord Parshath": "Link-3 LIGHT Fairy that searches The Sanctum of Parshath or Guiding Ariadne and Special Summons a Fairy from hand when a Fairy is sent to the GY.",
      "Avenging Knight Parshath": "Level 8 LIGHT Fairy Synchro cheated out by Rebirth of Parshath."
    },
    exclude: {},
    main: [
      ["Horn of Heaven", 3, "Original Counter Trap: when a monster(s) would be Summoned, tributes 1 monster you control (like Guiding Ariadne, triggering her search!) to negate the Summon and destroy that monster(s)."],
      ["Black Horn of Heaven", 3, "Signature Counter Trap: when your opponent would Special Summon exactly 1 monster, negates the Special Summon and destroys it with ZERO LP, discard, or Tribute cost!"],
      ["Grand Horn of Heaven", 3, "Signature Counter Trap: during your opponent's Main Phase, when they would Special Summon a monster(s), negates the Special Summon, destroys that monster, makes them draw 1 card, and immediately ENDS their Main Phase!"],
      ["Guiding Ariadne", 3, "Scale 3 Level 4 LIGHT Fairy Pendulum: waives all LP and discard costs for your Counter Traps in the Pendulum Zone, and when destroyed reveals 3 Counter Traps from your Deck so your opponent adds 1 to your hand."],
      ["Bountiful Artemis", 3, "Core Level 4 LIGHT Fairy that draws 1 card immediately every time Horn of Heaven, Black Horn of Heaven, or Grand Horn of Heaven resolves."],
      ["Power Angel Valkyria", 3, "Level 4 LIGHT Fairy that adds any LIGHT Fairy monster from your Deck to your hand whenever you negate a Summon with any of the three Horn of Heaven Counter Traps!"],
      ["Minerva, Scholar of the Sky", 3, "Gains 500 ATK and recycles a Counter Trap from your GY back to your hand every time a Counter Trap resolves while The Sanctum of Parshath is active."],
      ["Meltiel, Sage of the Sky", 2, "Gains 1000 LP and destroys 1 card your opponent controls every time a Horn of Heaven resolves while The Sanctum of Parshath is active."],
      ["Sacred Arch-Airknight Parshath", 2, "2800 ATK boss that Special Summons itself from hand or GY when you activate a Horn of Heaven Counter Trap, and searches a Counter Trap when inflicting battle damage."],
      ["The Sanctum of Parshath", 3, "Continuous Spell treated as The Sanctuary in the Sky that protects all Set Counter Traps on your field from targeting and destruction, and recycles 3 Fairies/Counter Traps from GY to the top of your Deck."],
      ["Ties of the Brethren", 3, "Special Summons Bountiful Artemis + Power Angel Valkyria directly from the Deck alongside any Level 4 LIGHT Fairy."],
      ["Rebirth of Parshath", 3, "Counter Trap that negates any card/effect at zero cost under Guiding Ariadne, shuffles it into the Deck, and Special Summons Sacred Arch-Airknight Parshath or Avenging Knight Parshath from Deck/Extra Deck."],
      ["Solemn Judgment", 1, "Limited to 1 in TCG: protects your Set Horn of Heaven traps from backrow removal for 0 LP while Guiding Ariadne is in the Pendulum Zone."],
      ["Solemn Strike", 2, "Counter Trap that negates an opponent's Special Summon or monster effect activation."]
    ],
    extra: [
      ["Celestial Knightlord Parshath", 2, "Link-3 LIGHT Fairy that searches The Sanctum of Parshath or Guiding Ariadne and Special Summons a Fairy from hand when a Fairy is sent to the GY."],
      ["Avenging Knight Parshath", 2, "Level 8 LIGHT Fairy Synchro summoned from the Extra Deck by Rebirth of Parshath."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "hunder.json",
    archetype: "Hunder",
    title: "Pure Hunder",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Pahunder", "Mahunder", "Sishunder", "Brohunder", "Thunder Sea Horse", "Spirit Converter"],
    summary: "The Hunder family—Pahunder, Mahunder, Sishunder, and Brohunder—is an explosive LIGHT Thunder chain-Normal Summon archetype. Because Pahunder and Mahunder grant additional Normal Summons via activated ignition effects, summoning one chains into the next, rapidly swarming 3 to 4 Level 4 monsters in a single turn without relying on Special Summons. This effortlessly unlocks powerful Rank 4 bosses like Starliege Paladynamo and the board-wiping Number 91: Thunder Spark Dragon, or Level 8 Synchro plays with Tuner Vylon Prism, all refueled each turn by Recycling Batteries.",
    allow: {
      "Batteryman Solar": "Level 4 LIGHT Thunder that dumps a Thunder monster on Summon and generates a Token when another Thunder is summoned.",
      "Vylon Prism": "Level 4 LIGHT Thunder Tuner that is searchable by Brohunder and Thunder Sea Horse, tunes into a Level 8 Synchro, and equips itself from GY for +1000 ATK.",
      "Recycling Batteries": "Spell that adds 2 Thunder monsters with 1500 or less ATK (Pahunder, Mahunder, Brohunder, Sishunder, Vylon Prism, or Batteryman Solar!) from your GY back to your hand.",
      "Starliege Paladynamo": "Rank 4 LIGHT Xyz that detaches 2 materials to reduce an opponent's monster's ATK to 0 and negate its effects, and draws 1 card when destroyed.",
      "Bujintei Tsukuyomi": "Rank 4 LIGHT Xyz that detaches 1 material to discard your remaining hand and draw 2 fresh cards after emptying your hand with Pahunder and Mahunder.",
      "Number 91: Thunder Spark Dragon": "Signature Rank 4 LIGHT Dragon Xyz that detaches 3 materials to destroy all other face-up monsters on the field, or 5 materials to destroy all cards the opponent controls.",
      "Crimson Blader": "Level 8 Synchro made with Pahunder/Mahunder + Level 4 LIGHT Thunder Tuner Vylon Prism that locks the opponent out of Level 5+ summons.",
      "Scarlight Red Dragon Archfiend": "Level 8 DARK Dragon Synchro that destroys all Special Summoned monsters on the field with ATK less than or equal to its own and burns for each.",
      "Some Summer Summoner": "Link-2 LIGHT Thunder that discards 1 card during the opponent's turn to revive Pahunder, Mahunder, or Batteryman Solar from the GY."
    },
    exclude: {},
    main: [
      ["Pahunder", 3, "Core Level 4 LIGHT Thunder (1300 ATK): once per turn, activates an Ignition Effect to immediately Normal Summon 1 Level 4 LIGHT Thunder monster from your hand (except Pahunder) as an additional Normal Summon."],
      ["Mahunder", 3, "Core Level 4 LIGHT Thunder (1400 ATK): once per turn, activates an Ignition Effect to immediately Normal Summon 1 Level 4 LIGHT Thunder monster from your hand (except Mahunder) as an additional Normal Summon—chaining directly off Pahunder!"],
      ["Brohunder", 3, "Level 4 LIGHT Thunder (900 ATK): when Normal Summoned, adds ANY Level 4 LIGHT Thunder monster with 1600 or less ATK (Pahunder, Mahunder, Sishunder, Thunder Sea Horse, or Vylon Prism!) from your Deck to your hand."],
      ["Sishunder", 2, "Level 4 LIGHT Thunder (900 ATK): when Normal Summoned, banishes 1 Level 4 LIGHT Thunder monster with 1600 or less ATK from your GY and adds it to your hand during the End Phase."],
      ["Thunder Sea Horse", 3, "Discards itself from the hand to add 2 Level 4 LIGHT Thunder monsters with 1600 or less ATK and the same name from your Deck to your hand."],
      ["Vylon Prism", 3, "Level 4 LIGHT Thunder Tuner (1500 ATK): searchable by Brohunder and Thunder Sea Horse, and Normal Summonable via Pahunder/Mahunder! Tunes into a Level 8 Synchro and equips itself from the GY for +1000 ATK!"],
      ["Batteryman Solar", 2, "Level 4 LIGHT Thunder (1500 ATK): searchable by Brohunder and Normal Summonable via Pahunder/Mahunder; dumps a Thunder from Deck to GY and summons a Token."],
      ["Recycling Batteries", 3, "Adds any 2 Thunder monsters with 1500 or less ATK from your GY back to your hand."],
      ["Spirit Converter", 2, "Continuous Spell: attaches 1 Level 4 LIGHT monster you control to an Xyz Monster, and recovers 2 Level 4 LIGHT Thunder monsters from your GY when sent to the GY."]
    ],
    extra: [
      ["Starliege Paladynamo", 2, "Rank 4 LIGHT Xyz: detaches 2 materials to permanently set an opponent's monster's ATK to 0 and negate its effects, and draws 1 card if destroyed by the opponent."],
      ["Number 91: Thunder Spark Dragon", 2, "Rank 4 LIGHT Xyz: detaches 3 materials to destroy all other face-up monsters on the field, or 5 materials to wipe the opponent's entire board!"],
      ["Bujintei Tsukuyomi", 2, "Rank 4 LIGHT Xyz: detaches 1 material after you Normal Summon your entire hand via Pahunder/Mahunder to draw 2 new cards!"],
      ["Crimson Blader", 2, "Level 8 Synchro made with Pahunder/Mahunder + Vylon Prism that locks the opponent out of Level 5+ summons."],
      ["Scarlight Red Dragon Archfiend", 1, "Level 8 Synchro that destroys Special Summoned monsters and burns."],
      ["Some Summer Summoner", 2, "Link-2 LIGHT Thunder that revives a Thunder monster from GY during the opponent's turn."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "igknight.json",
    archetype: "Igknight",
    title: "Pure Igknight",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Igknight", "Ignition Phoenix", "Ignis Phoenix"],
    summary: "Igknight is a fiery Normal Pendulum archetype of militarized FIRE Warriors with uniform scale effects. Any two Igknights in the Pendulum Zones can destroy themselves to search any FIRE Warrior from the Deck or graveyard—loading the face-up Extra Deck while searching extenders like Ignis Phoenix and Immortal Phoenix Gearfried. The deck then Pendulum Summons in mass to access Beyond the Pendulum, Promethean Princess, and the untargeted removal of Ignister Prominence, the Blasting Dracoslayer.",
    allow: {
      "Immortal Phoenix Gearfried": "Level 9 FIRE Warrior boss directly searchable by ANY Igknight Pendulum Zone effect that negates monster effects.",
      "Sublimation Knight": "Level 3 FIRE Warrior starter directly searchable by ANY Igknight Pendulum Zone effect that equips Squeaknight from the Deck on Normal Summon.",
      "Squeaknight": "FIRE Warrior that Special Summons itself when equipped to Sublimation Knight.",
      "Infernoble Knight - Renaud": "Level 1 FIRE Warrior Tuner that Special Summons itself while you control a FIRE Warrior and tunes with a Level 4/6 Igknight into Level 8 Ignister Prominence.",
      "Summoner's Art": "Searches Level 5 Igknight Cavalier or Level 6 Igknight Gallant / Igknight Margrave with zero cost.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Igknight Templar, Igknight Paladin, Igknight Crusader, or Sublimation Knight.",
      "Terraforming": "Limited to 1 in TCG: searches Ignition Phoenix.",
      "Beyond the Pendulum": "Link-2 Pendulum monster that searches any missing Pendulum Scale and destroys 2 cards on the field after you Pendulum Summon.",
      "Promethean Princess, Bestower of Flames": "Link-3 FIRE monster that revives a FIRE Igknight or Ignis Phoenix from the GY and pops a FIRE Igknight you control + an opponent's Special Summoned monster from the GY.",
      "Ignister Prominence, the Blasting Dracoslayer": "Level 8 FIRE Dragon Synchro that pops a Pendulum Card to shuffle 1 card on the opponent's field into the Deck without targeting.",
      "Majester Paladin, the Ascending Dracoslayer": "Rank 4 Xyz made with Level 4 Igknights and Ignis Phoenix that searches any Pendulum Monster during the End Phase.",
      "Ferocious Flame Swordsman": "Link-2 FIRE Warrior that boosts all Warrior monsters by 500 ATK and revives a non-Link Warrior upon destruction.",
      "S:P Little Knight": "Link-2 Warrior providing temporary banish disruption."
    },
    exclude: {},
    main: [
      ["Igknight Templar", 3, "Scale 7 Level 4 FIRE Warrior Normal Pendulum: destroys both Igknight Pendulum Scales to add ANY FIRE Warrior monster from your Deck or GY to your hand."],
      ["Igknight Paladin", 3, "Scale 2 Level 4 FIRE Warrior Normal Pendulum: pairs with Templar for Rank 4 plays and destroys both Scales to search any FIRE Warrior from Deck or GY."],
      ["Igknight Crusader", 3, "Scale 2 Level 3 FIRE Warrior Normal Pendulum: destroys both Igknight Scales to search any FIRE Warrior from Deck or GY."],
      ["Igknight Squire", 2, "Scale 7 Level 3 FIRE Warrior Normal Pendulum: destroys both Igknight Scales to search any FIRE Warrior from Deck or GY."],
      ["Igknight Margrave", 3, "Scale 2 Level 5 FIRE Warrior Normal Pendulum: destroys both Igknight Scales to search any FIRE Warrior."],
      ["Igknight Cavalier", 3, "Scale 7 Level 5 FIRE Warrior Normal Pendulum: destroys both Igknight Scales to search any FIRE Warrior."],
      ["Igknight Gallant", 2, "Scale 2 Level 6 FIRE Warrior Normal Pendulum: searchable by Summoner's Art."],
      ["Igknight Veteran", 2, "Scale 7 Level 6 FIRE Warrior Normal Pendulum: searchable by Summoner's Art."],
      ["Ignis Phoenix, the Dracoslayer", 2, "Scale 7 Level 4 FIRE Warrior Effect Pendulum: when destroyed on the field or in the Pendulum Zone by battle or card effect, Special Summons 1 Dracoslayer or Igknight from your Deck and treats it as a Tuner!"],
      ["Immortal Phoenix Gearfried", 2, "Level 9 FIRE Warrior boss searchable by every Igknight Scale effect that negates monster effects."],
      ["Sublimation Knight", 2, "Level 3 FIRE Warrior searchable by every Igknight Scale effect that equips Squeaknight on Normal Summon."],
      ["Squeaknight", 1, "Summons itself when equipped to Sublimation Knight."],
      ["Infernoble Knight - Renaud", 1, "Level 1 FIRE Warrior that treats itself as a Tuner to make Ignister Prominence."],
      ["Ignition Phoenix", 3, "Archetypal Field Spell: boosts all Igknights by 300 ATK/DEF and destroys 1 Igknight card you control to add any Igknight card from your Deck to your hand."],
      ["Igknight Reload", 2, "Quick-Play Spell: reveals any number of Pendulum Monsters in your hand, shuffles them into the Deck, then draws that many cards + 1."],
      ["Summoner's Art", 3, "Searches Level 5/6 Igknight Margrave, Cavalier, Gallant, or Veteran with zero cost."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Igknight Templar, Paladin, or Sublimation Knight."],
      ["Terraforming", 1, "Limited to 1 in TCG: searches Ignition Phoenix."]
    ],
    extra: [
      ["Beyond the Pendulum", 2, "Link-2 Pendulum monster that searches any Scale 2/7 Igknight or Ignis Phoenix and pops 2 cards on the field after you Pendulum Summon."],
      ["Promethean Princess, Bestower of Flames", 2, "Link-3 FIRE monster that revives a FIRE Igknight or Ignis Phoenix from the GY and pops a FIRE monster you control + an opponent's Special Summoned monster."],
      ["Ignister Prominence, the Blasting Dracoslayer", 2, "Level 8 FIRE Synchro boss that destroys 1 Pendulum Card on the field to shuffle 1 card on the field into the Deck without targeting!"],
      ["Majester Paladin, the Ascending Dracoslayer", 2, "Rank 4 Xyz made with Level 4 Igknights and Ignis Phoenix that searches an Igknight during the End Phase."],
      ["Ferocious Flame Swordsman", 1, "Link-2 FIRE Warrior that boosts all Warriors by 500 ATK and revives a Warrior upon destruction."],
      ["S:P Little Knight", 1, "Link-2 Warrior providing banish disruption."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "imperial-traps.json",
    archetype: "Imperial traps",
    title: "Pure Imperial traps",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Imperial Custom", "Imperial Iron Wall", "Imperial Tombs of Necrovalley", "Uria, Lord of Searing Flames", "Hyper Blaze"],
    summary: "The Imperial Traps archetype centers on the lockdown synergy between Imperial Custom and face-up Continuous Traps. Because Continuous Trap Monsters remain Continuous Trap Cards while in the Monster Zone, Imperial Custom makes Statue of Anguish Pattern, Angel Statue - Azurune, and Apophis the Swamp Deity completely immune to destruction by both battle and card effects. Protected from backrow sweeps by Imperial Custom and Lord of the Heavenly Prison, the deck systematically dismantles the opponent's board before finishing with Uria, Lord of Searing Flames.",
    allow: {
      "Statue of Anguish Pattern": "Level 7 EARTH Rock Continuous Trap Monster (0 ATK / 2500 DEF) that cannot be targeted by opponent's card effects, becomes completely indestructible by battle and card effects under Imperial Custom, and destroys 1 card on the field every time a Trap Monster is Special Summoned!",
      "Angel Statue - Azurune": "Level 4 LIGHT Fairy Continuous Trap Monster (1800 ATK / 1800 DEF) that becomes indestructible by battle and card effects under Imperial Custom and sends itself to the GY to negate an opponent's Special Summon!",
      "Apophis the Swamp Deity": "Level 6 EARTH Reptile Continuous Trap Monster (2000 ATK / 2200 DEF) that becomes indestructible by battle and card effects under Imperial Custom and negates face-up cards your opponent controls up to the number of other Continuous Traps you control!",
      "Zoma the Spirit": "Level 4 DARK Zombie Continuous Trap Monster (1800 ATK / 500 DEF) that becomes indestructible by battle under Imperial Custom!",
      "The Despair Uranus": "Level 8 LIGHT Rock that directly sets Imperial Custom or Imperial Iron Wall from your Deck when Tribute Summoned, gains 300 ATK per face-up Continuous Spell/Trap, and protects face-up Continuous Traps from destruction.",
      "Lord of the Heavenly Prison": "Level 10 DARK Rock (3000 ATK) that reveals itself in hand to protect all Set Imperial Traps before they are flipped face-up!",
      "Skill Drain": "Limited to 1 in TCG: Continuous Trap protected from destruction by Imperial Custom that negates all Effect Monsters on the field.",
      "Solemn Judgment": "Limited to 1 in TCG: Counter Trap that protects your Continuous Traps from Spell/Trap wipes.",
      "Superdreadnought Rail Cannon Gustav Max": "Rank 10 Xyz made with Uria, Lord of Searing Flames + Lord of the Heavenly Prison to inflict 2000 burn damage.",
      "Gallant Granite": "Rank 4 Rock Xyz made with two Level 4 Trap Monsters that searches The Despair Uranus or Lord of the Heavenly Prison from the Deck!"
    },
    exclude: {},
    main: [
      ["Imperial Custom", 3, "Core Continuous Trap: face-up Continuous Trap Cards cannot be destroyed by battle or card effects, except 'Imperial Custom'—making Imperial Iron Wall AND all of your Continuous Trap Monsters completely indestructible!"],
      ["Imperial Iron Wall", 3, "Signature Continuous Trap (protected from destruction by Imperial Custom!): neither player can banish cards from anywhere."],
      ["Statue of Anguish Pattern", 3, "Continuous Trap Monster: Special Summons itself as a Level 7 Rock (0 ATK / 2500 DEF) that cannot be targeted by opponent's card effects, cannot be destroyed by battle or effects under Imperial Custom, and destroys 1 card on the field every time another Trap Card is Special Summoned as a monster!"],
      ["Apophis the Swamp Deity", 3, "Continuous Trap Monster: Special Summons itself as a Level 6 Reptile (2000 ATK / 2200 DEF) and negates face-up cards your opponent controls up to the number of other Continuous Traps you control!"],
      ["Angel Statue - Azurune", 3, "Continuous Trap Monster: Special Summons itself as a Level 4 Fairy (1800 ATK / 1800 DEF), cannot be destroyed by battle/effects under Imperial Custom, and sends a Continuous Trap Monster to the GY to negate an opponent's Special Summon!"],
      ["Zoma the Spirit", 3, "Continuous Trap Monster: Special Summons itself as a Level 4 Zombie (1800 ATK / 500 DEF) and cannot be destroyed by battle or card effects while Imperial Custom is face-up."],
      ["Uria, Lord of Searing Flames", 2, "Iconic Level 10 Pyro boss: Special Summons itself by sending 3 face-up Traps you control to the GY, gains 1000 ATK/DEF per Continuous Trap in your GY, and destroys 1 Set Spell/Trap your opponent controls each turn."],
      ["Hyper Blaze", 2, "Continuous Trap (protected by Imperial Custom!) that lets Uria use face-down Traps for its Summon, gives Uria +1000 ATK/DEF for every Trap on the field and in the GYs during battle, and discards 1 card to recover or revive Uria!"],
      ["The Despair Uranus", 2, "2900 ATK Rock searchable by Gallant Granite that sets Imperial Custom or Imperial Iron Wall directly from your Deck and gains 300 ATK for every Continuous Trap you control."],
      ["Lord of the Heavenly Prison", 3, "3000 ATK Rock that reveals itself in hand to protect all Set cards on the field until you flip Imperial Custom face-up."],
      ["Skill Drain", 1, "Limited to 1 in TCG: Continuous Trap (indestructible while Imperial Custom is face-up!) that negates all face-up Effect Monsters on the field."],
      ["Solemn Judgment", 1, "Limited to 1 in TCG: Counter Trap that negates Spell/Trap wipes to protect your Continuous Traps."]
    ],
    extra: [
      ["Gallant Granite", 2, "Rank 4 Rock Xyz (summoned using Angel Statue - Azurune + Zoma the Spirit!) that detaches 1 material to search Lord of the Heavenly Prison or The Despair Uranus directly from your Deck!"],
      ["Superdreadnought Rail Cannon Gustav Max", 1, "Rank 10 Xyz made with Uria, Lord of Searing Flames + Lord of the Heavenly Prison to inflict 2000 burn damage."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "inca.json",
    archetype: "Inca",
    title: "Pure Inca",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Inti", "Quilla", "Ascator", "Supay", "Oracle of the Sun", "Fire Ant", "Weeping Idol", "Apocatequil"],
    summary: "Inca is Rex Goodwin's mythological 5D's strategy built around an endless reincarnation loop between Sun Dragon Inti and Moon Dragon Quilla. Starters Ascator, Dawnwalker and Supay, Duskwalker effortlessly summon their respective Tuners from the Deck to produce instant 1-card Synchro Summons. When Sun Dragon Inti is destroyed, it takes down the attacking monster, burns for damage, and prepares to revive Moon Dragon Quilla; when Moon Dragon Quilla falls, it immediately brings Sun Dragon Inti back from the graveyard, creating an unbreakable cycle of celestial dragons.",
    allow: {
      "Call of the Earthbound": "Rex Goodwin's Trap that redirects an opponent's attack onto Sun Dragon Inti or Moon Dragon Quilla to force their destruction/revival loop.",
      "Temple of the Sun": "Continuous Spell that boosts all monsters Special Summoned from the GY (your revived Sun Dragon Inti and Moon Dragon Quilla!) by 300 ATK.",
      "Destruct Potion": "Normal Trap that destroys Sun Dragon Inti or Moon Dragon Quilla to gain LP equal to its ATK and trigger their GY revival loop during the opponent's turn.",
      "Limit Reverse": "Continuous Trap that revives Fire Ant Ascator or Supay from your GY.",
      "Crystal Wing Synchro Dragon": "Level 8 Dragon Synchro summoned by tuning Level 1 Supay + Level 6 Moon Dragon Quilla or Level 2 Weeping Idol + Level 6 Quilla."
    },
    exclude: {},
    main: [
      ["Ascator, Dawnwalker", 3, "Core 1-card Sun Dragon Inti starter: discards 1 card to Special Summon itself from hand in Defense Position AND Special Summon 1 'Fire Ant Ascator' from your hand or Deck (Level 5 + Level 3 Tuner = Level 8 Sun Dragon Inti!)."],
      ["Fire Ant Ascator", 2, "Required Level 3 EARTH Insect Tuner for Sun Dragon Inti, summoned directly from the Deck by Ascator, Dawnwalker."],
      ["Supay, Duskwalker", 3, "Core 1-card Moon Dragon Quilla starter: discards 1 card to Special Summon itself from hand in Defense Position AND Special Summon 1 'Supay' from your hand or Deck (Level 5 + Level 1 Tuner = Level 6 Moon Dragon Quilla!)."],
      ["Supay", 2, "Required Level 1 EARTH Fiend Tuner for Moon Dragon Quilla, summoned directly from the Deck by Supay, Duskwalker, and Special Summons Oracle of the Sun from Deck when sent from field to GY by card effect."],
      ["Oracle of the Sun", 3, "Level 5 LIGHT Spellcaster: Special Summons itself from the hand if only your opponent controls a monster, and searches Fire Ant Ascator or Supay from your Deck when destroyed on the field."],
      ["Apocatequil", 3, "Level 4 LIGHT Thunder that automatically becomes Level 5 while you control a face-up Tuner (Fire Ant Ascator or Supay!), and revives Oracle of the Sun from your GY when destroyed on the field."],
      ["Weeping Idol", 2, "Level 2 DARK Rock that banishes 1 Tuner from your GY to Special Summon itself from your hand."],
      ["Call of the Earthbound", 2, "Trap that redirects an opponent's attack onto Sun Dragon Inti or Moon Dragon Quilla to force their destruction/revival loop."],
      ["Temple of the Sun", 2, "Continuous Spell that boosts all monsters Special Summoned from the GY by 300 ATK."],
      ["Destruct Potion", 3, "Normal Trap that destroys Sun Dragon Inti or Moon Dragon Quilla to gain LP equal to its ATK and trigger their GY revival loop during the opponent's turn!"],
      ["Limit Reverse", 2, "Continuous Trap that revives Fire Ant Ascator or Supay from your GY."]
    ],
    extra: [
      ["Sun Dragon Inti", 3, "Signature Level 8 LIGHT Dragon Synchro boss ('Fire Ant Ascator' + 1+ non-Tuners; 3000 ATK): when destroyed by battle, destroys the monster that destroyed it and inflicts half that monster's ATK as burn damage; Special Summons Moon Dragon Quilla from GY during the next Standby Phase!"],
      ["Moon Dragon Quilla", 3, "Signature Level 6 DARK Dragon Synchro boss ('Supay' + 1+ non-Tuners; 2500 ATK): gains LP equal to half the attacking monster's ATK when targeted for an attack; if destroyed on the field, immediately Special Summons 1 'Sun Dragon Inti' from your GY!"],
      ["Crystal Wing Synchro Dragon", 2, "Level 8 Dragon Synchro summoned using Level 1 Supay + Level 6 Moon Dragon Quilla."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "infernal-flame.json",
    archetype: "Infernal Flame",
    title: "Pure Infernal Flame",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Infernal Flame", "Solar Flare Dragon", "Ultimate Baseball Kid", "Spirit of Flames", "Raging Flame Sprite", "Bonfire"],
    summary: "The Infernal Flame strategy revolves around the explosive GY-banishing synergies of Infernal Flame Emperor and its companion Xyz monsters, Infernal Flame Banshee and Infernal Flame Vixen. Infernal Flame Banshee searches any Pyro monster on detach and Special Summons itself whenever banished while you control a Pyro. Tributing for the 2700 ATK Infernal Flame Emperor banishes multiple FIRE monsters from the GY to wipe opposing backrow, triggering Banshee's return to establish an overwhelming aggressive board.",
    allow: {
      "Neo Flamvell Lady": "Level 4 FIRE Pyro that banishes a card from the opponent's GY as a Quick Effect and dumps a 200 DEF FIRE Pyro from Deck to GY.",
      "Royal Firestorm Guards": "Level 4 FIRE Pyro that shuffles 4 Pyro monsters from your GY into the Deck to draw 2 cards.",
      "Flamvell Firedog": "Level 4 FIRE monster that summons Neo Flamvell Lady from the Deck on battle destruction for an instant Rank 4 Xyz Summon.",
      "Blaster, Dragon Ruler of Infernos": "Banishes 2 FIRE monsters from your hand or GY (including Infernal Flame Banshee to immediately revive her!) to Special Summon itself.",
      "Rekindling": "Revives 200 DEF FIRE Pyros (Neo Flamvell Lady, Flamvell Firedog) to immediately Xyz Summon Infernal Flame Vixen and Infernal Flame Banshee.",
      "Circle of the Fire Kings": "Quick-Play Spell that destroys Infernal Flame Vixen to revive Infernal Flame Emperor or Infernal Flame Banshee from your GY."
    },
    exclude: {},
    main: [
      ["Infernal Flame Emperor", 3, "Signature Level 9 FIRE Pyro boss (2700 ATK / 1600 DEF; directly searchable by Infernal Flame Banshee!): when Tribute Summoned, banishes up to 5 FIRE monsters from your GY (triggering Infernal Flame Banshee!) to destroy an equal number of Spell/Trap Cards on the field."],
      ["Spirit of Flames", 3, "Level 4 FIRE Pyro (1700 ATK): banishes 1 FIRE monster from your GY (including Infernal Flame Banshee, immediately reviving Banshee!) to Special Summon itself from your hand and gains 300 ATK during your Battle Phase."],
      ["Solar Flare Dragon", 3, "Level 4 FIRE Pyro (1500 ATK): cannot be attacked while you control another Pyro monster, burns for 500 every End Phase, and overlays into Infernal Flame Vixen."],
      ["Neo Flamvell Lady", 3, "Level 4 FIRE Pyro (200 DEF): sends a FIRE monster from hand to GY as a Quick Effect to banish a card from the opponent's GY, and dumps a 200 DEF FIRE monster from Deck to GY."],
      ["Royal Firestorm Guards", 2, "Level 4 FIRE Pyro (1700 ATK) that recycles 4 Pyro monsters from your GY into the Deck to draw 2 cards."],
      ["Flamvell Firedog", 3, "Level 4 FIRE monster (1900 ATK / 200 DEF) that summons Neo Flamvell Lady from the Deck to immediately overlay into Infernal Flame Banshee or Infernal Flame Vixen."],
      ["Blaster, Dragon Ruler of Infernos", 3, "Banishes 2 FIRE monsters from your hand/GY to Special Summon itself from hand or GY."],
      ["Bonfire", 1, "Limited to 1 in TCG: adds any Level 4 or lower Pyro monster (Spirit of Flames, Solar Flare Dragon, or Neo Flamvell Lady) from your Deck to your hand."],
      ["Rekindling", 3, "Special Summons Neo Flamvell Lady and Flamvell Firedog from your GY to assemble both Infernal Flame Banshee and Infernal Flame Vixen in a single turn."],
      ["Circle of the Fire Kings", 2, "Destroys Infernal Flame Vixen on the field to revive Infernal Flame Emperor or Infernal Flame Banshee from your GY."]
    ],
    extra: [
      ["Infernal Flame Banshee", 3, "Signature Rank 4 FIRE Pyro Xyz (2 Level 4 monsters): detaches 1 material to add ANY Pyro monster from your Deck to your hand or send it to the GY; if banished while you control a Pyro monster, Special Summons itself and gains +100 ATK per banished monster!"],
      ["Infernal Flame Vixen", 3, "Signature Rank 4 FIRE Pyro Xyz (2 FIRE Pyro-Type monsters; 2200 ATK): detaches 1 material to gain 500 ATK until the end of your opponent's turn; when destroyed on the field, banishes up to 3 monsters from either GY!"]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "inpachi.json",
    archetype: "Inpachi",
    title: "Pure Inpachi",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Inpachi"],
    summary: "Inpachi chronicles the tragic saga of a possessed log spirit through its multiple evolutionary forms: Inpachi, Blazing Inpachi, Charcoal Inpachi, and Woodborg Inpachi. By using Rescue Rabbit, Unexpected Dai, and Machine Duplication to flood the field with Normal and Machine Inpachis, the deck triggers Piercing the Darkness for repeated draws and massive battle boosts, while locking down opposing plays behind Fists of the Unrivaled Tenyi and versatile Rank 4 Xyz monsters.",
    allow: {
      "Rescue Rabbit": "Banishes itself to Special Summon 2 copies of Blazing Inpachi, Inpachi, or Charcoal Inpachi directly from your Deck.",
      "Unexpected Dai": "Special Summons Blazing Inpachi, Inpachi, or Charcoal Inpachi directly from your Deck while you control no monsters.",
      "Painful Decision": "Sends 1 Level 4 or lower Normal Monster from your Deck to the GY to add another copy with the same name to your hand.",
      "Piercing the Darkness": "Continuous Spell that draws 1 card once per turn when you summon a non-Token Normal Monster and boosts your battling Normal Inpachi by the opponent's monster's full ATK.",
      "Machine Duplication": "Targets Woodborg Inpachi (a Machine monster with exactly 500 ATK!) to Special Summon up to 2 additional copies of Woodborg Inpachi directly from your Deck.",
      "Fists of the Unrivaled Tenyi": "Counter Trap that negates any Spell/Trap or monster effect while you control a face-up non-Effect Monster.",
      "Gear Gigant X": "Rank 4 Machine Xyz summoned using two Level 4 Machine Inpachis that detaches 1 material to search another Inpachi or Woodborg Inpachi from Deck/GY.",
      "Infernal Flame Banshee": "Rank 4 FIRE Pyro Xyz summoned using two Level 4 Blazing Inpachis that detaches 1 material to search Pyro-Type Blazing Inpachi or Charcoal Inpachi from the Deck.",
      "Link Spider": "Link-1 monster summoned using a Normal Monster Inpachi that Special Summons another Level 4 or lower Normal Inpachi from your hand.",
      "First of the Dragons": "Level 9 Fusion summoned using 2 Normal Monster Inpachis that is unaffected by monster effects."
    },
    exclude: {},
    main: [
      ["Blazing Inpachi", 3, "Level 4 FIRE Pyro Normal Monster (1850 ATK / 0 DEF): the burning stage of Inpachi, summoned from the Deck via Rescue Rabbit and Unexpected Dai to beat down with Piercing the Darkness or overlay into Rank 4 Xyz."],
      ["Inpachi", 3, "Level 4 EARTH Machine Normal Monster (1600 ATK / 1900 DEF): the original wicked wooden spirit, pairing with Woodborg Inpachi for Rank 4 Machine Xyz Gear Gigant X."],
      ["Charcoal Inpachi", 3, "Level 1 FIRE Pyro Normal Monster (100 ATK / 2100 DEF): the burned-out charcoal stage with a massive 2100 DEF for a Level 1 monster, searchable via Infernal Flame Banshee and Painful Decision."],
      ["Woodborg Inpachi", 3, "Level 4 FIRE Machine Effect Monster (500 ATK / 2500 DEF): the mechanized final form of Inpachi; reduces all effect damage you take by 500 while in Defense Position, and has 500 ATK to unlock Machine Duplication!"],
      ["Rescue Rabbit", 3, "Banishes itself to Special Summon 2 Blazing Inpachi or 2 Inpachi directly from your Deck."],
      ["Unexpected Dai", 3, "Special Summons Blazing Inpachi, Inpachi, or Charcoal Inpachi directly from the Deck while you control no monsters."],
      ["Painful Decision", 3, "Sends 1 Blazing Inpachi, Inpachi, or Charcoal Inpachi from your Deck to the GY to add a 2nd copy to your hand."],
      ["Machine Duplication", 3, "Targets face-up Woodborg Inpachi (500 ATK Machine) to Special Summon 2 more Woodborg Inpachi from your Deck for an instant Rank 4 Gear Gigant X + a 2500 DEF wall!"],
      ["Piercing the Darkness", 3, "Draws 1 card every turn you summon Blazing Inpachi, Inpachi, or Charcoal Inpachi, and gives your Normal Inpachis ATK equal to the opponent's battling monster's ATK!"],
      ["Fists of the Unrivaled Tenyi", 3, "Counter Trap that negates any Spell, Trap, or monster effect activation while you control a face-up Normal Monster Inpachi."]
    ],
    extra: [
      ["Gear Gigant X", 3, "Rank 4 Machine Xyz: detaches 1 material to add Inpachi or Woodborg Inpachi from Deck or GY to your hand."],
      ["Infernal Flame Banshee", 2, "Rank 4 FIRE Pyro Xyz: detaches 1 material to add Pyro-Type Blazing Inpachi or Charcoal Inpachi from your Deck to your hand."],
      ["Link Spider", 2, "Link-1 monster made with Charcoal Inpachi, Inpachi, or Blazing Inpachi that Special Summons another Normal Inpachi from your hand."],
      ["First of the Dragons", 1, "Level 9 Dragon Fusion made with 2 Normal Monsters that cannot be destroyed by battle except by Normal Monsters and is immune to monster effects."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "iron-chain.json",
    archetype: "Iron Chain",
    title: "Pure Iron Chain",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Iron Chain", "Poison Chain"],
    summary: "Iron Chain is Warden Armstrong's punishing 5D's strategy focusing on deck destruction, burn damage, and EARTH Synchro recursion. Iron Chain Repairman revives Level 3 Tuner Iron Chain Coil from the graveyard every turn with no effect negation, immediately tuning into the 2500 ATK Iron Chain Dragon. As Iron Chain Dragon mills the opponent's Deck with every hit, Poison Chain and Paralyzing Chain steadily deplete the opponent's cards and Life Points, backed by Naturia Beast and Naturia Barkion for total spell and trap denial.",
    allow: {
      "Crane Crane": "Level 3 EARTH monster that revives Level 3 Tuner Iron Chain Coil from your GY on Normal Summon to immediately Synchro Summon Level 6 Iron Chain Dragon.",
      "Psychic Wheeleder": "Level 3 EARTH Psychic Tuner that Special Summons itself from the hand while you control a Level 3 monster and pops an opponent's monster on Synchro Summon.",
      "Psychic Tracker": "Level 3 EARTH Psychic that Special Summons itself while you control a Level 3 monster and grants +600 ATK to the Synchro Monster.",
      "Paralyzing Chain": "Continuous Spell that burns for 300 damage every time cards are sent from the opponent's Deck to the GY by a card effect.",
      "Foolish Burial": "Limited to 1 in TCG: sends Level 3 Tuner Iron Chain Coil to the GY so Iron Chain Repairman can immediately revive it.",
      "Reinforcement of the Army": "Limited to 1 in TCG: searches Iron Chain Repairman or Iron Chain Blaster.",
      "Naturia Barkion": "Level 6 EARTH Dragon Synchro made with Level 3 EARTH Tuner Iron Chain Coil + Level 3 non-Tuner that banishes 2 cards from GY to negate Trap activations.",
      "Naturia Beast": "Level 5 EARTH Beast Synchro made with Level 3 Coil + Level 2 Blaster that mills 2 cards to negate Spell activations.",
      "Goyo Guardian": "Level 6 EARTH Warrior Synchro that steals monsters destroyed by battle.",
      "The Phantom Knights of Break Sword": "Rank 3 Xyz made with two Level 3 monsters that destroys a card on each field.",
      "Brionac, Dragon of the Ice Barrier": "Level 6 Synchro that discards cards to bounce opposing cards back to hand.",
      "Coral Dragon": "Level 6 Synchro Tuner that destroys a card and draws 1 card when sent to GY."
    },
    exclude: {},
    main: [
      ["Iron Chain Repairman", 3, "Core Level 4 EARTH Warrior (1600 ATK): inflicts 300 burn damage when destroying a monster by battle, and once per turn Special Summons ANY Level 4 or lower 'Iron Chain' monster from your GY!"],
      ["Iron Chain Coil", 3, "Core Level 3 EARTH Machine Tuner: once per turn targets 1 'Iron Chain' monster you control to permanently grant it +300 ATK/DEF, and tunes with Level 3s into Level 6 Iron Chain Dragon."],
      ["Iron Chain Snake", 3, "Level 3 EARTH Reptile: equips itself to an opponent's monster during your Main Phase to reduce its ATK/DEF by 800; when that monster is destroyed by battle, mills cards from the opponent's Deck equal to its Level!"],
      ["Iron Chain Blaster", 3, "Level 2 EARTH Warrior: tributes 1 'Iron Chain' monster you control to inflict 800 burn damage to your opponent, and tunes with Level 3 Tuner Iron Chain Coil for Level 5 Naturia Beast."],
      ["Crane Crane", 3, "Level 3 EARTH monster that revives Level 3 Tuner Iron Chain Coil or Iron Chain Snake from your GY upon Normal Summon for an instant Level 6 Synchro or Rank 3 Xyz."],
      ["Psychic Wheeleder", 3, "Level 3 EARTH Psychic Tuner that Special Summons itself from the hand while you control Level 3 Iron Chain Coil or Iron Chain Snake to make Level 6 Synchros."],
      ["Psychic Tracker", 2, "Level 3 EARTH Psychic extender that Special Summons itself while you control a Level 3 monster."],
      ["Poison Chain", 3, "Archetypal Continuous Spell: during each of your End Phases, if you did not declare an attack, forces your opponent to send cards from the top of their Deck to the GY equal to the number of face-up 'Iron Chain' monsters you control."],
      ["Paralyzing Chain", 2, "Continuous Spell: every time a card(s) is sent from your opponent's Deck to the GY by a card effect, inflicts 300 burn damage to your opponent!"],
      ["Foolish Burial", 1, "Limited to 1 in TCG: sends Iron Chain Coil from Deck to GY so Iron Chain Repairman or Crane Crane can immediately revive it."],
      ["Reinforcement of the Army", 1, "Limited to 1 in TCG: searches Iron Chain Repairman."]
    ],
    extra: [
      ["Iron Chain Dragon", 3, "Signature Level 6 EARTH Dragon Synchro boss (1 Tuner + 1+ non-Tuners; 2500 ATK): banishes all 'Iron Chain' monsters from your GY to gain +200 ATK for each, and sends the top 3 cards of your opponent's Deck to the GY every time it inflicts battle damage!"],
      ["Naturia Barkion", 2, "Level 6 EARTH Dragon Synchro that negates all opponent's Trap activations."],
      ["Goyo Guardian", 2, "Level 6 EARTH Warrior Synchro that steals monsters destroyed by battle."],
      ["Naturia Beast", 1, "Level 5 EARTH Synchro made with Level 3 Coil + Level 2 Blaster that mills 2 cards to negate Spell activations."],
      ["The Phantom Knights of Break Sword", 1, "Rank 3 Xyz made with two Level 3 monsters to destroy a card on each field."],
      ["Brionac, Dragon of the Ice Barrier", 1, "Level 6 Synchro that discards to bounce opposing cards."],
      ["Coral Dragon", 1, "Level 6 Synchro Tuner that pops a card and draws 1 card when sent from field to GY."]
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
  console.log('\nALL 13 DECKS PASSED LOCAL VALIDATION PERFECTLY!');
}

module.exports = decks;
