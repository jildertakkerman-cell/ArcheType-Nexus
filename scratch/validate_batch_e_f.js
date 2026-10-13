const fs = require('fs');
const https = require('https');

const banlist = JSON.parse(fs.readFileSync('assets/data/banlist.json', 'utf8'));
const tcgForbidden = new Set((banlist.tcg?.forbidden || []).map(c => c.toLowerCase()));
const tcgLimited = new Set((banlist.tcg?.limited || []).map(c => c.toLowerCase()));
const tcgSemi = new Set((banlist.tcg?.semiLimited || []).map(c => c.toLowerCase()));

const decks = [
  {
    slug: "ecclesia.json",
    archetype: "Ecclesia",
    title: "Pure Ecclesia",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Ecclesia", "Virtuous"],
    summary: "The Ecclesia strategy unites the LIGHT Spellcaster incarnations of Ecclesia—Dogmatika Ecclesia, Incredible Ecclesia, Blazing Cartesia, Guiding Quem, and the Level 8 Synchro Ecclesia and the Dark Dragon. Supported by Fallen of the White Dragon (which summons any Ecclesia directly from the Deck) and The Fallen & The Virtuous, the deck rapidly cycles between Level 8 Synchros and Fusions on both players' turns.",
    allow: {
      "Fallen of the White Dragon": "Sends a Fusion mentioning Fallen of Albaz from Extra Deck to GY to Special Summon itself, then Special Summons any 'Ecclesia' monster from hand, Deck, or GY.",
      "Fallen of Albaz": "Essential partner summoned from the Deck by Incredible Ecclesia and Ecclesia and the Dark Dragon to fuse away opposing monsters.",
      "Dogmatika Fleurdelis, the Knighted": "Searched by Dogmatika Ecclesia to Special Summon itself as a Quick Effect and negate an opponent's monster.",
      "Dogmatika Punishment": "Searched by Dogmatika Ecclesia to send Titaniklad or Granguignol from the Extra Deck to the GY and destroy an opponent's monster.",
      "Nadir Servant": "Sends an Extra Deck monster to the GY to search Dogmatika Ecclesia and triggers End Phase recursion for Incredible Ecclesia and Cartesia.",
      "Titaniklad the Ash Dragon": "Level 8 Fusion that searches or Special Summons Dogmatika Ecclesia or Guiding Quem during the End Phase when sent to the GY.",
      "Granguignol the Dusk Dragon": "Level 8 Fusion summoned by Blazing Cartesia that dumps LIGHT/DARK monsters and tags out into Dogmatika or Despia monsters.",
      "Mirrorjade the Iceblade Dragon": "Level 8 Fusion boss summoned via Fallen of Albaz that banishes opposing monsters and wipes the board if removed.",
      "Albion the Branded Dragon": "Level 8 Fusion that Fusion Summons on summon and searches The Fallen & The Virtuous during the End Phase."
    },
    exclude: {},
    main: [
      ["Incredible Ecclesia, the Virtuous", 3, "Level 4 LIGHT Spellcaster Tuner that Special Summons itself if the opponent controls more monsters, tributes itself as a Quick Effect to summon Fallen of Albaz, and recurs from GY in the End Phase."],
      ["Dogmatika Ecclesia, the Virtuous", 3, "Level 4 LIGHT Spellcaster that Special Summons itself when an Extra Deck monster is on the field and searches any Dogmatika card on Normal or Special Summon."],
      ["Blazing Cartesia, the Virtuous", 3, "Level 4 LIGHT Spellcaster Tuner that Special Summons itself if Fallen of Albaz is on your field/GY, Quick-Fusions a Level 8+ Fusion during the Main Phase, and recurs in the End Phase."],
      ["Guiding Quem, the Virtuous", 3, "Level 4 LIGHT Spellcaster Tuner that dumps Fallen of Albaz or a card mentioning it on Summon, and revives an Ecclesia or Albaz monster whenever a card leaves the Extra Deck."],
      ["Fallen of the White Dragon", 3, "Treated as Fallen of Albaz on field/GY; sends Titaniklad or Albion from Extra Deck to GY to Special Summon itself and immediately summons any 'Ecclesia' monster from Deck."],
      ["Fallen of Albaz", 2, "Summoned from Deck by Incredible Ecclesia or Ecclesia and the Dark Dragon to fuse with an opponent's monster into Mirrorjade or Albion."],
      ["Dogmatika Fleurdelis, the Knighted", 1, "Searched by Dogmatika Ecclesia to provide Quick Effect monster negation and boost Attack Position Dogmatikas by 500 ATK."],
      ["The Fallen & The Virtuous", 3, "Quick-Play Spell that either sends an Albaz Fusion from Extra Deck to GY to destroy a face-up card, OR revives any monster from either GY while you have an Ecclesia on field/GY."],
      ["Nadir Servant", 3, "Sends Titaniklad or Granguignol from Extra Deck to GY to search Dogmatika Ecclesia from Deck or GY."],
      ["Dogmatika Punishment", 2, "Normal Trap searched by Dogmatika Ecclesia that sends an Extra Deck monster to the GY to destroy an opponent's monster with equal or lower ATK."]
    ],
    extra: [
      ["Ecclesia and the Dark Dragon", 2, "Signature Level 8 Synchro boss that banishes itself until the End Phase as a Quick Effect to summon Fallen of Albaz or a Level 4 monster mentioning it from Deck/GY, and shuffles a card on the field into the Deck from the GY."],
      ["Granguignol the Dusk Dragon", 2, "Level 8 Fusion summoned by Blazing Cartesia that sends a Level 6+ LIGHT or DARK monster from Deck/Extra Deck to GY."],
      ["Titaniklad the Ash Dragon", 2, "Level 8 Fusion that Special Summons Dogmatika Ecclesia or Guiding Quem directly from the Deck during the End Phase when sent to the GY."],
      ["Mirrorjade the Iceblade Dragon", 2, "Level 8 Fusion boss that sends an Albaz Fusion from Extra Deck to GY (triggering Guiding Quem!) to banish a monster on the field."],
      ["Albion the Branded Dragon", 2, "Level 8 Fusion that sets or searches The Fallen & The Virtuous during the End Phase when sent to the GY."]
    ],
    fill: {
      main: [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      extra: ["auto"]
    }
  },
  {
    slug: "egyptian-god.json",
    archetype: "Egyptian God",
    title: "Pure Egyptian God",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Slifer", "Obelisk", "The Winged Dragon of Ra", "Egyptian God", "Reactor Slime", "Guardian Slime", "Soul Crossing", "Millennium Revelation", "Mound of the Bound Creator", "The True Name", "Ancient Chant", "The Revived Sky God", "Fist of Fate"],
    summary: "Pure Egyptian God unites the three DIVINE Divine-Beast Creator Gods—Slifer the Sky Dragon, Obelisk the Tormentor, and The Winged Dragon of Ra—with their shared Slime and Crossing engine. Reactor Slime, Egyptian God Slime, and Soul Crossing allow you to Tribute Summon any of the three Egyptian Gods by Tributing tokens or your opponent's own monsters during either player's Main Phase.",
    allow: {
      "Metal Reflect Slime": "Trap Monster summoned directly from the Deck by Reactor Slime that tributes itself during the Battle Phase to cheat out Egyptian God Slime."
    },
    exclude: {},
    main: [
      ["Slifer the Sky Dragon", 2, "Egyptian God card that gains 1000 ATK/DEF per card in your hand and reduces the ATK of all monsters the opponent summons in Attack Position by 2000, destroying them if their ATK hits 0."],
      ["Obelisk the Tormentor", 2, "4000 ATK/DEF Egyptian God card that cannot be targeted by Spells, Traps, or effects and tributes 2 monsters to destroy all monsters the opponent controls."],
      ["The Winged Dragon of Ra", 1, "Egyptian God card that converts your LP into ATK/DEF via Ancient Chant and pays 1000 LP to destroy any monster on the field."],
      ["The Winged Dragon of Ra - Sphere Mode", 2, "Tributes 3 monsters your opponent controls to Normal Summon itself to their field, then tributes itself to summon a 4000 ATK/DEF Winged Dragon of Ra from your hand or Deck."],
      ["The Winged Dragon of Ra - Immortal Phoenix", 1, "4000 ATK/DEF form that Special Summons itself from the GY when Ra is sent from the field to the GY and pays 1000 LP to send a monster to the GY without targeting."],
      ["Reactor Slime", 3, "Summons 2 Slime Tokens during your Main Phase for a 3-Tribute Summon, and tributes itself during the Battle Phase to set Metal Reflect Slime from hand, Deck, or GY."],
      ["Guardian Slime", 3, "Special Summons itself from the hand when you take battle or effect damage, and searches any Spell/Trap mentioning The Winged Dragon of Ra when sent from hand or field to the GY."],
      ["Soul Crossing", 3, "Quick-Play Spell that immediately Tribute Summons 1 Divine-Beast monster during the Main Phase by Tributing monsters from EITHER field (including your opponent's monsters!)."],
      ["Ancient Chant", 3, "Searches The Winged Dragon of Ra from Deck or GY, grants an extra Tribute Summon this turn, and banishes from GY to give Ra the combined original ATK/DEF of its Tributes."],
      ["The True Name", 2, "Declares the top card of your Deck; if correct, adds it to your hand and adds or Special Summons 1 DIVINE monster directly from your Deck."],
      ["Mound of the Bound Creator", 2, "Field Spell that makes Level 10 or higher monsters on the field untargetable and indestructible by card effects, and searches a DIVINE monster when destroyed."],
      ["Millennium Revelation", 1, "Continuous Spell that sends a Divine-Beast from hand to GY to add Monster Reborn from Deck/GY, and allows Monster Reborn to revive The Winged Dragon of Ra."],
      ["The Revived Sky God", 2, "Normal Trap whose activation cannot be negated; revives Slifer the Sky Dragon from your GY and makes both players draw until they have 6 cards in hand."],
      ["Fist of Fate", 1, "Quick-Play Spell whose activation cannot be negated; while you control Obelisk, negates an opponent's Effect Monster and destroys it plus all Spells/Traps they control."],
      ["Metal Reflect Slime", 1, "Set from Deck by Reactor Slime; summons itself as a Level 10 WATER Aqua with 3000 DEF to immediately transform into Egyptian God Slime."]
    ],
    extra: [
      ["Egyptian God Slime", 3, "Level 10 Fusion boss summoned by Tributing a Level 10 WATER Aqua with 0 ATK (Guardian Slime or Metal Reflect Slime); counts as 1 or 3 Tributes for an Egyptian God, cannot be destroyed by battle, and protects your other monsters from attacks and targeting."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "empowered-warrior.json",
    archetype: "Empowered Warrior",
    title: "Pure Empowered Warrior",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Empowered", "Empowerment", "Aether, the"],
    summary: "Empowered Warrior is a Pendulum and Rank 4/6 Xyz archetype led by Empowerment, Dragodies, the Empowered Warrior, and Dragonox, the Empowered Warrior. Empowerment discards a card each turn to summon any Empowered Warrior directly from the Deck, setting up Pendulum Scales to Pendulum Summon Aether, the Empowering Dragon (which banishes a monster on the field every time it is Pendulum Summoned).",
    allow: {
      "Reinforcement of the Army": "Searches any Level 4 Empowered Warrior monster from the Deck (1 copy, Limited in TCG).",
      "Terraforming": "Searches the essential Empowerment Field Spell (1 copy, Limited in TCG).",
      "Beyond the Pendulum": "Link-2 Pendulum monster that searches Dragodies or Dragonox to complete your Pendulum Scales and pops 2 cards on the field.",
      "Majester Paladin, the Ascending Dracoslayer": "Rank 4 Xyz made with Level 4 Pendulum Empowered Warriors that searches any Pendulum Monster during the End Phase."
    },
    exclude: {},
    main: [
      ["Dragodies, the Empowered Warrior", 3, "Scale 2 Level 4 LIGHT Warrior Pendulum that halves an attacking monster's ATK in the Pendulum Zone, and searches any Warrior or Spellcaster with 2000 or less ATK during the End Phase if destroyed."],
      ["Dragonox, the Empowered Warrior", 3, "Scale 7 Level 4 DARK Warrior Pendulum that ends the Battle Phase when an opponent attacks in the Pendulum Zone, and discards 1 card on the field to revive a Warrior or Spellcaster with 2000 or less ATK in face-down Defense Position."],
      ["Aether, the Empowering Dragon", 3, "Level 6 LIGHT Dragon Pendulum boss that targets 1 card on the field and returns it to the hand whenever it is Normal or Special Summoned."],
      ["Aether, the Evil Empowering Dragon", 3, "Level 6 DARK Dragon Pendulum boss that targets 1 monster on the field and banishes it whenever it is Normal or Special Summoned."],
      ["Arnis, the Empowered Warrior", 3, "Level 4 FIRE Warrior that Special Summons a Spellcaster with 1500 or less ATK from the Deck when destroyed by battle."],
      ["Terratiger, the Empowered Warrior", 3, "Level 4 EARTH Warrior that Special Summons a Level 4 or lower Normal Monster or Warrior from your hand in Defense Position when Normal Summoned."],
      ["Hydrotortoise, the Empowered Warrior", 2, "Level 3 WATER Warrior Flip monster that destroys 1 Spell or Trap Card your opponent controls when flipped face-up (synergizing with Dragonox's face-down revival!)."],
      ["Ventdra, the Empowered Warrior", 2, "Level 5 WIND Warrior that can attack your opponent directly and recovers a Dragon, Warrior, or Spellcaster Normal Monster from the GY when sent from field to GY."],
      ["Empowerment", 3, "Core Field Spell that boosts all Dragon, Warrior, and Spellcaster monsters you control by 300 ATK/DEF and discards 1 card once per turn to Special Summon ANY 'Empowered Warrior' monster directly from your Deck."],
      ["Reinforcement of the Army", 1, "Searches Dragodies, Dragonox, Arnis, or Terratiger."],
      ["Terraforming", 1, "Searches Empowerment."]
    ],
    extra: [
      ["Beyond the Pendulum", 2, "Link-2 Pendulum monster that searches Aether, Dragodies, or Dragonox and destroys 2 cards on the field."],
      ["Majester Paladin, the Ascending Dracoslayer", 2, "Rank 4 Warrior Xyz made with Dragodies and Dragonox that searches Aether, the Evil Empowering Dragon during the End Phase."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "end-of-the-world.json",
    archetype: "End of the World",
    title: "Pure End of the World",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["End of the World", "of the World", "Oblivion", "Armageddon", "Ruin,", "Demise,"],
    summary: "The End of the World Ritual strategy revolves around Demise, King of Armageddon, Ruin, Queen of Oblivion, and their newest boss Ruler of the End of the World. Ruler of the End of the World reveals itself in hand to banish an End of the World Ritual Spell directly from the Deck and copy its Ritual Summon effect, then pays 2000 LP on the field to nuke all other cards and gain 2900 ATK (to 5900 ATK)!",
    allow: {
      "Pre-Preparation of Rites": "Adds End of the World and either Demise, King of Armageddon or Ruin, Queen of Oblivion from your Deck or GY to your hand.",
      "Preparation of Rites": "Searches Level 4 Demise, Agent of Armageddon or Ruin, Angel of Oblivion and recovers a Ritual Spell from the GY.",
      "Manju of the Ten Thousand Hands": "Normal Summon starter that searches any End of the World Ritual Monster or Ritual Spell from the Deck.",
      "Superdreadnought Rail Cannon Gustav Max": "Rank 10 Xyz made with two Level 10 Supreme Demise/Ruin or Ruler of the End of the World to burn for 2000 damage after attacking.",
      "Superdreadnought Rail Cannon Juggernaut Liebe": "Rank 11 Xyz stacked over Gustav Max for a 6000 ATK multi-attacker."
    },
    exclude: {},
    main: [
      ["Ruler of the End of the World", 3, "Level 10 Ritual boss (treated as Demise, King of Armageddon in hand/field) that reveals itself in hand and pays 2000 LP to banish a Ritual Spell from Deck and apply its Ritual Summon effect, then pays 2000 LP on field to destroy all other cards and gain 2900 ATK."],
      ["Demise, Supreme King of Armageddon", 2, "Level 10 Ritual boss that makes your Ritual Monsters immune to battle destruction and pays 2000 LP (for free if Ritual Summoned using only Ritual Monsters) to destroy all other cards on the field and burn for 200 per destroyed opponent's card."],
      ["Ruin, Supreme Queen of Oblivion", 2, "Level 10 Ritual boss that makes your Ritual Monsters immune to card effect destruction, attacks twice during each Battle Phase if Ritual Summoned using only Ritual Monsters, and burns for the destroyed monster's original ATK."],
      ["Demise, King of Armageddon", 2, "Classic Level 8 Ritual boss searchable by Pre-Preparation of Rites that pays 2000 LP to destroy all other cards on the field."],
      ["Ruin, Queen of Oblivion", 1, "Classic Level 8 Ritual boss searchable by Pre-Preparation of Rites that can attack once again in a row when it destroys an opponent's monster by battle."],
      ["Demise, Agent of Armageddon", 2, "Level 4 Ritual Monster treated as Demise, King of Armageddon that destroys 1 face-up monster on Summon and protects Ritual Monsters when sent to the GY."],
      ["Ruin, Angel of Oblivion", 1, "Level 4 Ritual Monster treated as Ruin, Queen of Oblivion that attacks twice on monsters and prevents opponent activations when sent to the GY."],
      ["Cycle of the World", 3, "Quick-Play Ritual Spell that tributes monsters from your field to Ritual Summon Demise or Ruin from your hand OR Deck, and recycles itself from the GY to add End of the World and recover Demise/Ruin."],
      ["End of the World", 3, "Classic Ritual Spell that Ritual Summons Demise or Ruin and enables Pre-Preparation of Rites."],
      ["Turning of the World", 2, "Quick-Play Spell that tributes a Ritual Monster from your hand to Ritual Summon Demise or Ruin from your hand OR Deck during either player's turn."],
      ["Breaking of the World", 2, "Field Spell that reveals a Ritual Monster to make its Level match a monster on the field, and either draws 1 card or destroys 1 card on the field whenever Demise or Ruin is Ritual Summoned."],
      ["Renewal of the World", 1, "Continuous Trap that banishes a Ritual Monster from your Deck on activation and tributes it to Ritual Summon from hand or GY."],
      ["Pre-Preparation of Rites", 3, "Searches End of the World + Demise, King of Armageddon or Ruin, Queen of Oblivion."],
      ["Preparation of Rites", 2, "Searches Demise, Agent of Armageddon and recovers Cycle of the World or End of the World from the GY."],
      ["Manju of the Ten Thousand Hands", 3, "Searches Ruler of the End of the World or Cycle of the World on Normal Summon."]
    ],
    extra: [
      ["Superdreadnought Rail Cannon Gustav Max", 2, "Rank 10 Xyz made with two Level 10 End of the World Ritual bosses to inflict 2000 burn damage."],
      ["Superdreadnought Rail Cannon Juggernaut Liebe", 1, "Rank 11 Xyz stacked over Gustav Max for 6000 ATK."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "engine-token.json",
    archetype: "Engine Token",
    title: "Pure Engine Token",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Motor", "Fiendish Engine", "Two-for-One Repair Job"],
    summary: "The Engine Token (Motor) archetype is Bandit Keith and Yako Tenma's DARK Machine series from Yu-Gi-Oh! R, consisting of Motor Kaiser, Motor Frenzy, Motor Shell, Fiendish Engine Ω, and Two-for-One Repair Job. Every monster generates Level 1 EARTH Machine 'Engine Tokens' (200 ATK / 200 DEF) when destroying cards or hitting the GY, fueling Tribute Summons, Two-for-One Repair Job revivals, and Machine Link climbing.",
    allow: {
      "Scrap Recycler": "Level 3 EARTH Machine starter that sends Motor Shell or Fiendish Engine Ω from the Deck to the GY (setting up Two-for-One Repair Job) and recycles Level 4 EARTH Machines.",
      "Therion \"King\" Regulus": "Equips Motor Shell or Scrap Recycler from the GY to Special Summon itself and provide omni-negation (and if Motor Shell leaves the field while equipped, it generates an Engine Token!).",
      "Clockwork Night": "Continuous Spell searched by Clockwork Knight that turns all monsters on the field into Machines, boosts your Machines by 500 ATK, and banishes from GY to search Scrap Recycler or Therion \"King\" Regulus.",
      "Foolish Burial": "Sends Motor Shell or Fiendish Engine Ω to the GY to enable Two-for-One Repair Job (1 copy, Limited in TCG).",
      "Clockwork Knight": "Link-1 EARTH Machine that can be summoned using a Level 1 EARTH Machine Engine Token, searches Clockwork Night, and tributes a Machine to revive an EARTH Machine.",
      "Link Spider": "Link-1 EARTH Cyberse summoned using an Engine Token to convert tokens into Effect Monsters for Link climbing.",
      "Ancient Gear Ballista": "Link-2 EARTH Machine made using two EARTH Machine Engine Tokens that pops a Spell/Trap to drop an opposing monster to 0 ATK/DEF.",
      "Platinum Gadget": "Link-2 Machine made with Motor Shell + Engine Token that Special Summons a Level 4 or lower Machine from the hand."
    },
    exclude: {},
    main: [
      ["Motor Kaiser", 3, "Level 5 DARK Machine that reveals itself in hand to immediately Normal Summon 1 DARK Machine (using an Engine Token as Tribute!), and targets 1 monster you control (Motor Shell!) to destroy it and Special Summon 1 Engine Token."],
      ["Motor Shell", 3, "Core Level 4 DARK Machine that automatically Special Summons 1 'Engine Token' (Machine/EARTH/Level 1/ATK 200/DEF 200) whenever it is sent from the field to the GY (including as Link or Tribute Material!)."],
      ["Motor Frenzy", 3, "Level 6 DARK Machine that gains ATK equal to half the highest original DEF of a Machine used for its Tribute Summon, protects your monsters from battle Position changes, and summons 2 Engine Tokens when sent to the GY after being Tribute Summoned."],
      ["Fiendish Engine Ω", 2, "Signature Level 8 DARK Machine boss with 2800 ATK that Special Summons 1 Engine Token in Attack Position during every End Phase and boosts its own ATK by 1000 (to 3800 ATK)."],
      ["Scrap Recycler", 3, "Normal Summon starter that sends Motor Shell, Motor Kaiser, or Fiendish Engine Ω directly from the Deck to the GY."],
      ["Therion \"King\" Regulus", 2, "Special Summons itself by equipping Motor Shell from your GY; when Regulus sends the equipped Motor Shell to the GY to negate an opponent's card, Motor Shell triggers to summon an Engine Token!"],
      ["Two-for-One Repair Job", 3, "Archetypal Spell that banishes 1 DARK Machine from your GY to Special Summon 1 monster from your hand, Deck, or GY that specifically lists 'Engine Token' in its text (Fiendish Engine Ω, Motor Kaiser, Motor Frenzy, or Motor Shell!), and banishes from GY when your DARK Machine is destroyed to summon an Engine Token."],
      ["Clockwork Night", 2, "Continuous Spell searched by Clockwork Knight that boosts all your Machines/Engine Tokens by 500 ATK, weakens opponent's monsters by 500 ATK, and banishes from GY to search Regulus."],
      ["Foolish Burial", 1, "Dumps Motor Shell or Fiendish Engine Ω to turn on Two-for-One Repair Job immediately."]
    ],
    extra: [
      ["Clockwork Knight", 2, "Link-1 EARTH Machine summoned directly using a single Level 1 EARTH Machine 'Engine Token'! Sends a Continuous Spell to search Clockwork Night and tributes a Machine (Motor Shell!) to revive Scrap Recycler."],
      ["Link Spider", 2, "Link-1 summoned using an Engine Token to convert tokens into Effect Monsters."],
      ["Ancient Gear Ballista", 2, "Link-2 EARTH Machine summoned using two EARTH Machine Engine Tokens to search an EARTH Machine and reduce an opposing monster's stats to 0."],
      ["Platinum Gadget", 1, "Link-2 Machine that summons Motor Shell or Scrap Recycler from the hand."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "entity.json",
    archetype: "Entity",
    title: "Pure Entity",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Elder Entity", "Old Entity", "Outer Entity", "Trapezohedron", "Dreamland", "Forbidden Apocrypha"],
    summary: "Entity is the Lovecraftian multi-Extra-Deck archetype combining Elder Entity (Fusion), Old Entity (Synchro), and Outer Entity (Xyz) alongside their lore spells Forbidden Trapezohedron, Dreamland, and Forbidden Apocrypha. Pairing Level 2 Tuners and Level 2 non-Tuners lets you Synchro Summon Level 4 Old Entity Hastorr/Cthugua, make Rank 4 Outer Entity Nyarla, Contact Fuse into Elder Entity N'tss, or cheat out entities via Forbidden Trapezohedron!",
    allow: {
      "Deep Sea Diva": "Level 2 Tuner that summons a Level 2 Sea Serpent from the Deck on Normal Summon to immediately Synchro Summon Level 4 Old Entity Hastorr or Cthugua.",
      "Guitar Gurnards Duonigis": "Level 2 Sea Serpent summoned by Deep Sea Diva to make a Level 4 Old Entity Synchro.",
      "Assault Synchron": "Level 2 Tuner that Special Summons itself from the hand to pair with any Level 2 monster for a Level 4 Old Entity Synchro without using your Normal Summon.",
      "Red Resonator": "Level 2 Tuner that Special Summons a Level 4 or lower monster from your hand on Normal Summon to make Level 4 Old Entity Cthugua/Hastorr or Rank 4 Outer Entity Nyarla.",
      "Photon Thrasher": "Level 4 extender that Special Summons itself when you control no monsters to pair with another Level 4 for Rank 4 Outer Entity Nyarla.",
      "Kagetokage": "Level 4 extender that Special Summons itself on a Normal Summon to make Rank 4 Outer Entity Nyarla alongside a Level 4.",
      "Instant Fusion": "Pays 1000 LP to Special Summon Mudragon of the Swamp directly from the Extra Deck, providing a Level 4 body to make Outer Entity Nyarla or Old Entity Cthugua (1 copy, Limited in TCG).",
      "Super Polymerization": "Fuses opposing monsters into Mudragon of the Swamp or Garura, Wings of Resonant Life.",
      "Mudragon of the Swamp": "Level 4 Fusion summoned via Instant Fusion or Super Polymerization that protects your monsters of the declared Attribute and serves as Level 4 material for Outer Entity Nyarla.",
      "Garura, Wings of Resonant Life": "Level 6 Fusion summoned via Super Polymerization using 2 monsters with the same Type and Attribute that draws 1 card when sent to the GY."
    },
    exclude: {},
    main: [
      ["Deep Sea Diva", 3, "One-card Level 4 Synchro starter that summons Duonigis from the Deck to Synchro Summon Old Entity Hastorr or Old Entity Cthugua."],
      ["Guitar Gurnards Duonigis", 2, "Level 2 Sea Serpent target for Deep Sea Diva that banishes cards from the opponent's Deck and enables Level 4 Synchros."],
      ["Red Resonator", 3, "Level 2 Tuner that Special Summons a Level 2 or Level 4 monster from your hand on Normal Summon."],
      ["Assault Synchron", 3, "Special Summons itself from the hand as a Level 2 Tuner to immediately climb into a Level 4 Old Entity Synchro."],
      ["Photon Thrasher", 3, "Level 4 Special Summon extender that pairs with Level 4 monsters to Xyz Summon Rank 4 Outer Entity Nyarla."],
      ["Kagetokage", 3, "Special Summons itself when you Normal Summon a Level 4 monster to assemble Rank 4 Outer Entity Nyarla."],
      ["Forbidden Trapezohedron", 3, "Signature Entity Spell: if you control a Fusion + Synchro, summons Outer Entity Nyarla and attaches it; if Synchro + Xyz, summons Elder Entity N'tss; if Xyz + Fusion, summons Old Entity Hastorr or Cthugua!"],
      ["Dreamland", 3, "Signature Entity Field Spell that applies bonus effects based on the monster card types on the field: draws 1 card if a monster is sent to GY (Fusion), increases a monster's Level by 1 on summon (Synchro), and destroys the highest-Level monster during the End Phase (Xyz)."],
      ["Instant Fusion", 1, "Summons Mudragon of the Swamp directly from the Extra Deck (Limited to 1 in TCG) to make Outer Entity Nyarla or Old Entity Cthugua (which draws 1 card when used as material!)."],
      ["Super Polymerization", 3, "Fuses monsters on either field into Mudragon of the Swamp or Garura as an unrespondable Quick-Play Spell."],
      ["Forbidden Apocrypha", 2, "Signature Entity Trap that declares 1 monster card type (Fusion, Synchro, or Xyz); if 2 or more monsters of that type are on the field, forces both players to send all monsters of that type they control to the GY."]
    ],
    extra: [
      ["Elder Entity N'tss", 3, "Level 4 Fusion (1 Synchro + 1 Xyz) summoned by Contact Fusion without Polymerization; Special Summons a Level 4 monster from hand once per turn and destroys 1 card on the field whenever it is sent to the GY."],
      ["Old Entity Hastorr", 3, "Level 4 WIND Reptile Synchro that equips to an opponent's monster when sent from the Monster Zone to the GY to negate its effects and prevent it from attacking, then permanently steals control of that monster if Hastorr leaves the Spell & Trap Zone!"],
      ["Old Entity Cthugua", 3, "Level 4 FIRE Pyro Synchro that bounces all Rank 4 Xyz Monsters on the field on Synchro Summon, and lets you draw 1 card if a Fusion or Xyz Monster is summoned using Cthugua as material!"],
      ["Outer Entity Nyarla", 3, "Rank 4 EARTH Fiend Xyz that discards cards on Xyz Summon to increase its Rank, and detaches all materials to attach 1 monster from your GY (like Old Entity Hastorr or Elder Entity N'tss!) to copy its Type/Attribute and trigger its GY effect when sent to the GY."],
      ["Mudragon of the Swamp", 2, "Level 4 Fusion summoned via Instant Fusion or Super Polymerization that grants targeting immunity and serves as Level 4 material for Nyarla."],
      ["Garura, Wings of Resonant Life", 1, "Level 6 Fusion summoned via Super Polymerization that inflicts double battle damage and draws 1 card when sent to the GY."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "exchange-of-the-spirit.json",
    archetype: "Exchange of the Spirit",
    title: "Pure Exchange of the Spirit",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Exchange of the Spirit", "Gravekeeper's Trap", "Blast Held by Destiny", "Keldo", "Mudora", "Agido", "Kelbek", "Zolga"],
    summary: "Exchange of the Spirit is Ishizu Ishtar's EARTH Fairy graveyard-control strategy centered around Gravekeeper's Trap, Exchange of the Spirit, and Blast Held by Destiny. Fully compliant with the TCG Banlist (where Kelbek the Ancient Vanguard and Agido the Ancient Sentinel are Forbidden, and Keldo the Sacred Protector and Mudora the Sword Oracle are Limited to 1), this build pairs the legal Ishizu Fairies and Zolga the Prophet with Vernusylph EARTH Fairy extenders to lock the opponent out of their GY and draws via Gravekeeper's Trap.",
    allow: {
      "Vernusylph of the Flourishing Hills": "Level 4 EARTH Fairy that discards itself and a monster or Vernusylph card to search a Vernusylph and revive an EARTH monster from the GY.",
      "Vernusylph of the Awakening Forests": "Level 4 EARTH Fairy that discards itself and a monster to send any EARTH monster that can be Normal Summoned (Keldo, Mudora, or Zolga the Prophet!) from the Deck to the GY.",
      "Vernusylph of the Misting Seedlings": "Level 3 EARTH Fairy that discards itself and a monster to search ANY Level 4 or lower EARTH Fairy monster from the Deck (searching Keldo, Mudora, or Zolga the Prophet!).",
      "Herald of Orange Light": "EARTH/LIGHT Fairy handtrap that discards itself and a Fairy (Keldo or Mudora!) to negate and destroy an opponent's monster effect.",
      "Foolish Burial Goods": "Sends Exchange of the Spirit directly from the Deck to the GY so Gravekeeper's Trap's GY floodgate and Keldo/Mudora's 5-card shuffles are immediately active (1 copy, Limited in TCG).",
      "Foolish Burial": "Sends Keldo the Sacred Protector or Mudora the Sword Oracle directly from the Deck to the GY (1 copy, Limited in TCG).",
      "Number 41: Bagooska the Terribly Tired Tapir": "Rank 4 EARTH Xyz made with two Level 4 EARTH Fairies that stalls the board while Gravekeeper's Trap strips the opponent's draws.",
      "Missus Radiant": "Link-2 EARTH monster that boosts all EARTH Fairies by 500 ATK/DEF and recovers an EARTH monster from the GY when destroyed."
    },
    exclude: {},
    main: [
      ["Keldo the Sacred Protector", 1, "Limited to 1 in TCG: discards 1 EARTH Fairy to Special Summon itself and search Exchange of the Spirit or any card that mentions it, and banishes itself from field/GY as a Quick Effect to shuffle up to 5 cards from either GY into the Deck."],
      ["Mudora the Sword Oracle", 1, "Limited to 1 in TCG: discards 1 EARTH Fairy to Special Summon itself and place Gravekeeper's Trap face-up directly from your Deck, and banishes itself from field/GY as a Quick Effect to shuffle up to 5 cards from either GY into the Deck."],
      ["Zolga the Prophet", 3, "Ishizu's Level 4 EARTH Fairy that Special Summons itself from the hand while you control an EARTH Fairy (except Zolga) and looks at the top 5 cards of BOTH Decks—guaranteeing you know the exact top card of the opponent's Deck to snipe it with Gravekeeper's Trap!"],
      ["Kelbek", 2, "Original TCG-legal Level 4 EARTH Fairy from Ishizu's deck that returns any monster that attacks it back to the owner's hand and fuels discard costs for Gravekeeper's Trap and Vernusylphs."],
      ["Mudora", 2, "Original TCG-legal Level 4 EARTH Fairy that gains 200 ATK for every Fairy monster in your GY."],
      ["Vernusylph of the Misting Seedlings", 3, "Discards itself and 1 monster to search ANY Level 4 EARTH Fairy (Keldo the Sacred Protector, Mudora the Sword Oracle, or Zolga the Prophet!) from your Deck and revive an EARTH monster."],
      ["Vernusylph of the Awakening Forests", 3, "Discards itself and 1 monster to send Keldo the Sacred Protector or Mudora the Sword Oracle directly from your Deck to the GY and revive an EARTH monster."],
      ["Vernusylph of the Flourishing Hills", 3, "Discards itself and 1 card to search another Vernusylph and protect your EARTH monsters from effect destruction."],
      ["Herald of Orange Light", 3, "Unlimited in TCG: discards itself and an EARTH Fairy from hand to negate and destroy an opponent's monster effect, putting Keldo or Mudora into the GY on Turn 0."],
      ["Gravekeeper's Trap", 3, "Core Continuous Trap: while Exchange of the Spirit is in your GY, prevents your opponent from activating card effects in the GY or Special Summoning from the GY; discards 1 card to search any Level 4 EARTH Fairy; and declares the card your opponent draws to send it to the GY (100% accurate with Zolga the Prophet!)."],
      ["Exchange of the Spirit", 2, "Signature Trap that swaps both players' GYs with their Decks when both GYs have 15+ cards, and serves as the required GY enabler for Gravekeeper's Trap, Blast Held by Destiny, Keldo, and Mudora."],
      ["Blast Held by Destiny", 2, "Signature Trap searchable by Keldo that destroys the opponent's highest-ATK monster on attack declaration to burn for its ATK, and banishes itself from the GY to recover a Level 4 EARTH Fairy."],
      ["Foolish Burial Goods", 1, "Limited to 1 in TCG: sends Exchange of the Spirit directly from the Deck to the GY so Gravekeeper's Trap's GY floodgate is immediately live."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: sends Keldo or Mudora directly from the Deck to the GY."]
    ],
    extra: [
      ["Number 41: Bagooska the Terribly Tired Tapir", 1, "Rank 4 EARTH Xyz made with two Level 4 EARTH Fairies that locks down the field while Gravekeeper's Trap and Zolga the Prophet strip the opponent's draws."],
      ["Missus Radiant", 2, "Link-2 EARTH monster that boosts all EARTH Fairies by 500 ATK and recycles Keldo or Mudora from the GY if destroyed."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "felgrand.json",
    archetype: "Felgrand",
    title: "Pure Felgrand",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Felgrand", "Ruins of the Divine Dragon Lords", "Return of the Dragon Lords", "Arkbrave Dragon", "Dragon Knight of Creation"],
    summary: "Felgrand is a Level 7/8 LIGHT Dragon graveyard revival archetype centered around Divine Dragon Lord Felgrand, Arkbrave Dragon, and Return of the Dragon Lords. Whenever Divine Dragon Lord Felgrand is Special Summoned from the GY, it banishes a monster from the opponent's field or GY and gains ATK, while Arkbrave Dragon wipes face-up Spells/Traps and revives Felgrand during the next Standby Phase.",
    allow: {
      "Dragon Shrine": "Sends a Dragon from the Deck to the GY (like Arkbrave Dragon or Divine Dragon Lord Felgrand) to set up Standby Phase revivals and Return of the Dragon Lords.",
      "Trade-In": "Discards a Level 8 Felgrand monster to draw 2 cards while putting Felgrand directly into the GY to be revived.",
      "Foolish Burial": "Sends Arkbrave Dragon or Divine Dragon Lord Felgrand directly from the Deck to the GY (1 copy, Limited in TCG).",
      "Number 38: Hope Harbinger Dragon Titanic Galaxy": "Rank 8 Dragon Xyz made with two Level 8 Felgrand Dragons that negates Spells and redirects attacks.",
      "Hieratic Seal of the Heavenly Spheres": "Link-2 Dragon made with any two Dragons that bounces an opposing card and summons Arkbrave Dragon or Felgrand from the Deck."
    },
    exclude: {},
    main: [
      ["Divine Dragon Lord Felgrand", 3, "Signature Level 8 Dragon boss: when Special Summoned from the GY, targets 1 monster your opponent controls or in their GY, banishes it, and gains ATK/DEF equal to its Level/Rank x 100; revives a Level 7/8 Dragon from GY when it destroys a monster by battle."],
      ["Arkbrave Dragon", 3, "Level 7 Dragon companion: banishes as many face-up Spells/Traps your opponent controls as possible when Special Summoned from the GY, and revives a Level 7 or 8 Dragon (Felgrand!) during the Standby Phase of the next turn after being sent to the GY."],
      ["Paladin of Felgrand", 3, "Level 4 Warrior that equips a Level 7 or 8 Dragon from your hand or Deck on Normal/Special Summon, is unaffected by other monsters' effects while equipped, and tributes itself + 1 monster to revive a Level 7/8 Dragon from the GY."],
      ["Guardian of Felgrand", 2, "Level 4 Warrior that equips a Level 7/8 Dragon from hand or GY on Summon, gains half its ATK/DEF, and tributes itself + 1 monster to revive a Level 7/8 Dragon."],
      ["Dragon Knight of Creation", 3, "Level 4 Dragon that increases its Level by 4 during the opponent's turn, sends a Level 7/8 Dragon from Deck to GY when destroying a monster by battle, and sends 1 card from hand + itself to revive a Level 7/8 Dragon from the GY."],
      ["Felgrand Dragon", 1, "Original Level 8 Felgrand Dragon that gains ATK equal to a GY monster's Level x 200 when revived from the GY."],
      ["Return of the Dragon Lords", 3, "Core Spell that Special Summons any Level 7 or 8 Dragon monster from your GY, and banishes itself from your GY to protect your Dragon monster(s) from being destroyed by battle or card effect."],
      ["Ruins of the Divine Dragon Lords", 3, "Continuous Spell that negates the effects of any monster Special Summoned from anywhere EXCEPT the GY while you control a Level 7/8 Dragon, and sends 1 other face-up card you control (an equipped Arkbrave Dragon!) to the GY to summon a Dragon Lord Token."],
      ["Dragon Shrine", 3, "Sends Arkbrave Dragon or Divine Dragon Lord Felgrand directly from the Deck to the GY."],
      ["Trade-In", 3, "Discards Divine Dragon Lord Felgrand or Felgrand Dragon to draw 2 cards and put them into the GY for revival."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: sends Arkbrave Dragon to the GY so it revives Felgrand during the Standby Phase."]
    ],
    extra: [
      ["Divine Dragon Knight Felgrand", 3, "Signature Rank 8 Xyz boss that detaches 1 material as a Quick Effect to target any face-up monster on the field, negating its effects AND making it completely unaffected by other card effects this turn."],
      ["Number 38: Hope Harbinger Dragon Titanic Galaxy", 2, "Rank 8 Dragon Xyz made with two revived Level 8 Dragons to negate Spells."],
      ["Hieratic Seal of the Heavenly Spheres", 2, "Link-2 Dragon that bounces a card and summons Arkbrave Dragon from the Deck (sending it to GY in the End Phase to trigger its revival!)."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "feral-imp.json",
    archetype: "Feral Imp",
    title: "Pure Feral Imp",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Feral Imp", "Horn of"],
    summary: "Feral Imp is Yugi Muto's classic Level 4 DARK Fiend Normal Monster and its Flip counterpart, Des Feral Imp. Powered by Rescue Rabbit, Unexpected Dai, and Horn of the Unicorn/Horn of Light support alongside Level 4 extenders, the deck swarms Level 4 monsters to fuse into First of the Dragons, revive Feral Imp repeatedly via Daigusto Emeral, and command the board with versatile Rank 4 Xyz and Link monsters.",
    allow: {
      "Rescue Rabbit": "Banishes itself to Special Summon 2 copies of the Level 4 Normal Monster Feral Imp directly from the Deck for an instant Rank 4 Xyz Summon or Link play.",
      "Unexpected Dai": "Special Summons Feral Imp directly from the Deck while you control no monsters.",
      "Kagetokage": "Level 4 Reptile that Special Summons itself when you Normal Summon Feral Imp or Des Feral Imp to immediately Xyz Summon Rank 4 monsters.",
      "Nefarious Archfiend Eater of Nefariousness": "Level 4 EARTH Beast that Special Summons itself while you control a Spellcaster or Normal Monster to make Rank 4 Xyz plays alongside Feral Imp.",
      "Polymerization": "Fuses 2 copies of the Normal Monster Feral Imp together to summon First of the Dragons.",
      "Dark Factory of Mass Production": "Adds 2 copies of the Normal Monster Feral Imp from your GY back to your hand to refuel your field.",
      "First of the Dragons": "Level 9 Fusion boss summoned using 2 Normal Monsters (Feral Imp) that cannot be destroyed by battle except with a Normal Monster and is unaffected by other monster effects.",
      "Daigusto Emeral": "Rank 4 Xyz monster made with Level 4 monsters that detaches 1 material to Special Summon a Normal Monster (Feral Imp) from your GY, or shuffles 3 monsters from GY to draw 1 (1 copy, Limited in TCG).",
      "Number 41: Bagooska the Terribly Tired Tapir": "Rank 4 Xyz monster that stalls the game by switching monsters to Defense Position and negating their activated effects.",
      "Tornado Dragon": "Rank 4 Xyz monster that detaches 1 material as a Quick Effect to destroy a Spell/Trap on the field.",
      "Evilswarm Exciton Knight": "Rank 4 Xyz monster that destroys all other cards on the field if your opponent has more total cards.",
      "Wee Witch's Apprentice": "Link-2 DARK monster that boosts all DARK monsters (including Feral Imp and Des Feral Imp) by 500 ATK/DEF.",
      "Link Spider": "Link-1 monster summoned using the Normal Monster Feral Imp to convert it into an Effect Monster for Link plays."
    },
    exclude: {},
    main: [
      ["Feral Imp", 3, "Yugi's iconic Level 4 DARK Fiend Normal Monster with 1300 ATK / 1400 DEF that serves as the primary Rescue Rabbit / Unexpected Dai target."],
      ["Des Feral Imp", 3, "Level 4 DARK Reptile Flip evolution of Feral Imp (1600 ATK / 1800 DEF) that shuffles 1 card from your GY back into the Deck when flipped face-up."],
      ["Rescue Rabbit", 3, "Banishes itself to summon 2 copies of Feral Imp directly from the Deck to Xyz Summon Rank 4 monsters or Link climb."],
      ["Unexpected Dai", 3, "Special Summons Feral Imp directly from the Deck while you control no monsters."],
      ["Kagetokage", 3, "Level 4 DARK Reptile that Special Summons itself from the hand whenever you Normal Summon a Level 4 monster (Feral Imp or Des Feral Imp)."],
      ["Nefarious Archfiend Eater of Nefariousness", 2, "Level 4 EARTH Beast that Special Summons itself while you control a Normal Monster or Spellcaster to make Rank 4 Xyz plays."],
      ["Horn of the Unicorn", 3, "Yugi's signature Equip Spell for Feral Imp in Duelist Kingdom that increases ATK and DEF by 700 (putting Feral Imp at 2000 ATK / 2100 DEF) and returns to the top of the Deck when sent to the GY."],
      ["Horn of Light", 2, "Companion Horn Equip Spell that increases DEF by 800."],
      ["Polymerization", 2, "Fuses 2 copies of Feral Imp into First of the Dragons."],
      ["Dark Factory of Mass Production", 2, "Adds 2 Normal Monsters (Feral Imp) from your GY back to your hand."]
    ],
    extra: [
      ["First of the Dragons", 2, "Fusion boss made with 2 Normal Monsters (Feral Imp) that is immune to monster effects and battle destruction by Effect Monsters."],
      ["Daigusto Emeral", 1, "Limited to 1 in TCG: Rank 4 Xyz that detaches 1 material to Special Summon Feral Imp from the GY or recycle 3 monsters to draw 1 card."],
      ["Number 41: Bagooska the Terribly Tired Tapir", 1, "Rank 4 stall boss that forces monsters into Defense Position and negates their activated effects."],
      ["Tornado Dragon", 1, "Rank 4 Quick Effect Spell/Trap removal."],
      ["Evilswarm Exciton Knight", 1, "Rank 4 board wipe when at a card disadvantage."],
      ["Wee Witch's Apprentice", 2, "Link-2 DARK monster that boosts Feral Imp and Des Feral Imp by 500 ATK/DEF."],
      ["Link Spider", 2, "Link-1 summoned with Feral Imp to convert it into an Effect Monster."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "flamvell.json",
    archetype: "Flamvell",
    title: "Pure Flamvell",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Flamvell", "Rekindling"],
    summary: "Flamvell is a FIRE Pyro/Spellcaster/Dragon Synchro archetype where almost every monster has exactly 200 DEF. When Flamvell Firedog destroys an opponent's monster by battle, it summons Flamvell Magician from the Deck for an instant Level 8 Synchro, while Rekindling revives up to 5 FIRE monsters with 200 DEF simultaneously for explosive Synchro climbs and Flamvell Counter omni-Spell/Trap negation.",
    allow: {
      "Bonfire": "Searches any Level 4 or lower Pyro monster from your Deck (searching Flamvell Firedog, Neo Flamvell Lady, Neo Flamvell Origin, or Flamvell Baby; Limited to 1 in TCG).",
      "Foolish Burial": "Sends a 200 DEF Flamvell monster to the GY to fuel Rekindling and Flamvell Counter (1 copy, Limited in TCG).",
      "Ancient Flamvell Deity": "Signature Level 7 FIRE Pyro Synchro boss (1 Flamvell Tuner + 1+ FIRE non-Tuners).",
      "Flamvell Uruquizas": "Signature Level 6 FIRE Pyro Synchro.",
      "Crimson Blader": "Level 8 FIRE Synchro made with Flamvell Firedog + Flamvell Magician that locks the opponent out of summoning Level 5 or higher monsters.",
      "T.G. Hyper Librarian": "Level 5 Synchro that draws 1 card for every Synchro Summon performed after resolving Rekindling (1 copy, Limited in TCG).",
      "Formula Synchron": "Level 2 Synchro Tuner made with Flamvell Baby + Level 1 that draws 1 card on Summon."
    },
    exclude: {},
    main: [
      ["Flamvell Firedog", 3, "Signature Level 4 FIRE Beast-Warrior (1900 ATK / 200 DEF) that Special Summons any FIRE monster with 200 or less DEF directly from your Deck whenever it destroys an opponent's monster by battle."],
      ["Flamvell Magician", 3, "Level 4 FIRE Spellcaster Tuner (1400 ATK / 200 DEF) summoned from the Deck by Flamvell Firedog for an instant Level 8 Synchro Summon, and valid target for Rekindling."],
      ["Neo Flamvell Lady", 3, "Level 4 FIRE Pyro (1600 ATK / 200 DEF) that sends 1 FIRE monster from hand to GY as a Quick Effect to banish a card from the opponent's GY, and sends a FIRE monster with 200 or less DEF from Deck to GY if a card is banished from their GY!"],
      ["Neo Flamvell Origin", 3, "Level 2 FIRE Pyro Tuner (500 ATK / 200 DEF) that Special Summons itself from the hand if you control a Flamvell monster and your opponent has 3 or fewer cards in their GY."],
      ["Flamvell Poun", 3, "Level 1 FIRE Pyro (200 ATK / 200 DEF) that adds ANY monster with 200 DEF from your Deck to your hand when destroyed by battle and sent to the GY."],
      ["Flamvell Archer", 2, "Level 3 FIRE Pyro Tuner (1000 ATK / 200 DEF) that tributes 1 face-up Pyro monster you control to boost all Flamvell monsters on the field by 800 ATK."],
      ["Flamvell Baby", 2, "Level 1 FIRE Pyro Tuner (800 ATK / 200 DEF) that can be discarded from the hand to give a FIRE monster 400 ATK and load the GY for Rekindling."],
      ["Flamvell Guard", 2, "Level 1 FIRE Dragon Normal Tuner (100 ATK / 2000 DEF) that provides Level 1 Tuner access."],
      ["Rekindling", 3, "Iconic Spell that Special Summons as many FIRE monsters with 200 DEF as possible from your GY (reviving up to 5 Flamvell Tuners and non-Tuners at once!)."],
      ["Flamvell Counter", 3, "Signature Counter Trap that banishes 1 FIRE monster with 200 DEF from your GY to negate the activation of ANY Spell or Trap Card and destroy it."],
      ["Bonfire", 1, "Limited to 1 in TCG: adds any Level 4 or lower Pyro monster (Neo Flamvell Lady or Neo Flamvell Origin) from your Deck to your hand."],
      ["Foolish Burial", 1, "Limited to 1 in TCG: dumps a 200 DEF Flamvell monster to the GY to turn on Rekindling and Flamvell Counter."]
    ],
    extra: [
      ["Ancient Flamvell Deity", 2, "Signature Level 7 FIRE Pyro Synchro boss (1 Flamvell Tuner + 1+ FIRE non-Tuners) that banishes cards from the opponent's GY up to the number of cards in their hand on Synchro Summon and gains 200 ATK for each banished card."],
      ["Flamvell Uruquizas", 2, "Signature Level 6 FIRE Pyro Synchro that inflicts piercing battle damage and permanently gains 300 ATK every time it inflicts battle damage to the opponent."],
      ["Crimson Blader", 1, "Level 8 FIRE Synchro made with Firedog + Magician that locks down Level 5+ summons."],
      ["T.G. Hyper Librarian", 1, "Limited to 1 in TCG: Level 5 Synchro that draws cards repeatedly when Synchro climbing off Rekindling."],
      ["Formula Synchron", 1, "Level 2 Synchro Tuner that draws 1 card on Summon."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "from-the-underworld.json",
    archetype: "From the Underworld",
    title: "Pure From the Underworld",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["From the Underworld", "from the Underworld", "Tour Bus To Forbidden Realms"],
    summary: "From the Underworld is the Tour Guide Fiend series featuring Tour Guide From the Underworld, Tour Bus From the Underworld, Tour Bus To Forbidden Realms, Doomdog Octhros, and the Link bosses Muckraker From the Underworld, Beat Cop from the Underworld, and Underworld Goddess of the Closed World. Tour Guide summons Level 3 Fiends directly from the Deck to climb into Beat Cop and Muckraker while Tour Bus recycles resources every turn.",
    allow: {
      "Underworld Goddess of the Closed World": "Link-5 Fiend boss of the Underworld series that uses 1 monster the opponent controls as Link Material, negates all face-up cards the opponent controls on Summon, and negates GY Special Summons.",
      "Sangan": "Classic Level 3 DARK Fiend passenger on Tour Guide's bus that is summoned by Tour Guide and searches any monster with 1500 or less ATK when linked off into Muckraker or Beat Cop.",
      "Fiendish Rhino Warrior": "Level 3 EARTH Fiend passenger summoned by Tour Guide that protects Fiend monsters and sends Tour Bus From the Underworld or Scarm from the Deck to the GY.",
      "Scarm, Malebranche of the Burning Abyss": "Level 3 DARK Fiend that searches Tour Guide From the Underworld during the End Phase of the turn it is sent to the GY.",
      "Doomdog Octhros": "Level 3 DARK Fiend companion that searches a Level 8 Fiend when sent from the field to the GY.",
      "Dark Spirit of Banishment": "Level 8 DARK Fiend searchable by Tour Bus To Forbidden Realms and Doomdog Octhros that recycles from the GY and revives Level 8 Fiends.",
      "Dark Necrofear": "Level 8 DARK Fiend searchable by Tour Bus To Forbidden Realms and Doomdog Octhros that banishes 3 Fiends from GY to summon itself and steals an opponent's monster when destroyed."
    },
    exclude: {},
    main: [
      ["Tour Guide From the Underworld", 3, "Iconic Level 3 DARK Fiend starter that Special Summons any Level 3 Fiend monster from your hand or Deck upon Normal Summon for an instant Link-2 or Rank 3 Xyz."],
      ["Tour Bus From the Underworld", 3, "Level 3 DARK Fiend that targets 1 monster in either player's GY (except itself) when sent to the GY and shuffles it into the Deck—recycling your Extra Deck bosses or disrupting the opponent's GY."],
      ["Tour Bus To Forbidden Realms", 3, "Level 3 DARK Fiend Flip monster that adds any DARK Fiend monster (except a LIGHT/Level 1) from your Deck to your hand when flipped face-up."],
      ["Sangan", 3, "Summoned from the Deck by Tour Guide; searches Tour Guide, Tour Bus, or a handtrap when used as Link Material for Muckraker or Beat Cop."],
      ["Fiendish Rhino Warrior", 3, "Summoned by Tour Guide; protects your other Fiend monsters from battle/card destruction and sends Scarm or Tour Bus From the Underworld from the Deck to the GY when sent to the GY."],
      ["Scarm, Malebranche of the Burning Abyss", 3, "Searches Tour Guide From the Underworld or Tour Bus From the Underworld during the End Phase when sent to the GY."],
      ["Doomdog Octhros", 2, "Level 3 Fiend summoned by Tour Guide that searches Dark Necrofear or Dark Spirit of Banishment when linked off."],
      ["Dark Necrofear", 2, "Level 8 Fiend boss searched by Doomdog Octhros and Tour Bus To Forbidden Realms that banishes 3 Fiends from GY to summon itself and equips to steal an opposing monster when destroyed."],
      ["Dark Spirit of Banishment", 2, "Level 8 Fiend searched by Tour Bus To Forbidden Realms that discards itself when an opponent attacks to revive Dark Necrofear from the GY."]
    ],
    extra: [
      ["Muckraker From the Underworld", 3, "Signature Link-2 DARK Fiend that tributes a Fiend instead of a Fiend you control being destroyed, and discards 1 card to Special Summon any Fiend monster from your GY."],
      ["Beat Cop from the Underworld", 3, "Signature Link-2 DARK Fiend that tributes 1 monster (triggering Sangan, Rhino, or Doomdog!) to place a Patrol Counter on any card on the field, protecting it from destruction."],
      ["Underworld Goddess of the Closed World", 2, "Signature Link-5 Fiend boss that links away an opponent's monster, negates their entire face-up board on Link Summon, and negates effects that Special Summon from the GY."]
    ],
    fill: {
      "main": [{ "package": "handtraps", "max": 6 }, { "package": "staple-spells" }],
      "extra": ["auto"]
    }
  },
  {
    slug: "fusion.json",
    archetype: "Fusion",
    title: "Pure Fusion",
    status: "draft",
    reviewed: "2026-10-13",
    match: ["Polymerization", "Fusion", "King of the Swamp"],
    summary: "The Pure 'Fusion' / Polymerization archetype focuses on cards that search, recycle, and weaponize 'Polymerization' and 'Fusion' Spells—led by King of the Swamp, Keeper of Dragon Magic, Fusion Recycling Plant, and Fusion Duplication. By substituting for named materials with King of the Swamp and recycling Polymerization every turn via Fusion Recycling Plant, the deck effortlessly chains together Guardian Chimera, Millennium-Eyes Restrict, and Magnum the Reliever.",
    allow: {
      "Keeper of Dragon Magic": "Normal/Special Summon starter that discards 1 card to search any 'Polymerization' Normal Spell or 'Fusion' Normal Spell directly from the Deck.",
      "Beastking of the Swamps": "Level 4 WATER Aqua Fusion Substitute monster that can substitute for any 1 named Fusion Material on a Fusion Monster.",
      "Goddess with the Third Eye": "Level 4 LIGHT Fairy Fusion Substitute monster that substitutes for any 1 named Fusion Material.",
      "Magnum the Reliever": "Level 8 Fusion boss (1 monster Summoned from the Extra Deck + 1 monster in the hand) that recycles a 'Polymerization' or 'Fusion' Spell from your GY to draw 1 card, and banishes a Polymerization/Fusion Spell from GY as a Quick Effect to destroy a card on the field!",
      "Guardian Chimera": "Level 9 Fusion boss summoned via Polymerization or Fusion Duplication that draws cards and destroys cards on the opponent's field.",
      "Millennium-Eyes Restrict": "Level 1 Fusion summoned via Instant Fusion or King of the Swamp that absorbs opposing monsters when they activate effects and negates them.",
      "Thousand-Eyes Restrict": "Classic Level 1 Fusion summoned via Instant Fusion or King of the Swamp that absorbs an opponent's monster.",
      "Mudragon of the Swamp": "Level 4 Fusion summoned via Super Polymerization that protects your monsters of the declared Attribute from targeting.",
      "Garura, Wings of Resonant Life": "Level 6 Fusion summoned via Super Polymerization using 2 monsters with the same Type and Attribute that draws 1 card when sent to the GY."
    },
    exclude: {},
    main: [
      ["King of the Swamp", 3, "Core Fusion engine: substitutes for ANY 1 named Fusion Material on a Fusion Monster, OR discards itself from the hand to add 1 'Polymerization' from your Deck to your hand."],
      ["Keeper of Dragon Magic", 3, "Core starter: discards 1 card on Normal or Special Summon to add ANY 'Polymerization' Normal Spell or 'Fusion' Normal Spell from your Deck to your hand."],
      ["Beastking of the Swamps", 3, "Substitutes for any 1 named Fusion Material and pairs with King of the Swamp for WATER/Aqua synergies."],
      ["Goddess with the Third Eye", 2, "Substitutes for any 1 named Fusion Material and provides a LIGHT Fairy body for Magnum the Reliever and Guardian Chimera."],
      ["Polymerization", 3, "The iconic original Fusion Spell, searchable by King of the Swamp, Keeper of Dragon Magic, Fusion Sage, and Fusion Recycling Plant."],
      ["Ultra Polymerization", 2, "Pays 2000 LP to Fusion Summon using 2 monsters you control with neither player able to respond, then banishes itself from GY to revive both Fusion Materials!"],
      ["Super Polymerization", 3, "Unrespondable Quick-Play Fusion Spell that fuses your opponent's monsters into Mudragon of the Swamp or Garura, Wings of Resonant Life."],
      ["Instant Fusion", 1, "Limited to 1 in TCG: pays 1000 LP to Special Summon Millennium-Eyes Restrict or Thousand-Eyes Restrict directly from the Extra Deck."],
      ["Fusion Recycling Plant", 3, "Field Spell that discards 1 card to add Polymerization from your Deck or GY to your hand, and recovers 1 Fusion Material from your GY during the End Phase."],
      ["Fusion Sage", 2, "Adds 1 Polymerization from your Deck to your hand."],
      ["Fusion Reserve", 2, "Normal Trap that reveals a Fusion Monster in the Extra Deck to add 1 listed material (or King of the Swamp) and recover Polymerization from your GY."],
      ["Fusion Duplication", 2, "Normal Trap that banishes 1 'Fusion' or 'Polymerization' Normal/Quick-Play Spell from either GY and applies its Fusion Summon effect during the opponent's turn!"]
    ],
    extra: [
      ["Magnum the Reliever", 3, "Signature Fusion boss for the Polymerization engine: returns 1 'Polymerization' or 'Fusion' Spell from your GY to the bottom of the Deck to draw 1 card, and banishes 1 Polymerization/Fusion Spell from your GY as a Quick Effect to destroy 1 card on the field!"],
      ["Guardian Chimera", 2, "Level 9 Fusion boss (3 monsters with different names) that draws cards equal to hand materials and destroys cards equal to field materials, and is untargetable while Polymerization is in your GY!"],
      ["Millennium-Eyes Restrict", 2, "Summoned using King of the Swamp + 1 Effect Monster (or Instant Fusion) to absorb and negate opposing monsters when they activate effects."],
      ["Thousand-Eyes Restrict", 1, "Summoned via King of the Swamp or Instant Fusion to absorb an opponent's monster."],
      ["Mudragon of the Swamp", 1, "Super Polymerization target that prevents your opponent from targeting monsters of a declared Attribute."],
      ["Garura, Wings of Resonant Life", 1, "Super Polymerization target that inflicts double battle damage and draws 1 card when sent to the GY."]
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
  console.log('\nALL 12 DECKS PASSED LOCAL VALIDATION PERFECTLY!');
}

module.exports = decks;
