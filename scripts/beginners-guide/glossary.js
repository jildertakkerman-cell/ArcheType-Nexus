// The glossary data and its HTML for pages/Beginners-Guide.html (used by build.js,
// and by build-glossary-hints.js for the word hints on deck pages).
//   {{Card Name}}        -> card popup button
//   [[term-id|label]]    -> jump link to another glossary entry
const fs = require('fs');
const path = require('path');

const CATS = [
    ['basics', 'Game basics', 'The pieces of the game: zones, piles, and the kinds of Summon.'],
    ['effects', 'Effects &amp; rulings', 'How card effects are used, answered and limited.'],
    ['roles', 'Card roles', 'Words for the job a card does in a deck.'],
    ['actions', 'Actions', 'The verbs. Most of these are shorthand for something a card effect does.'],
    ['strategy', 'Strategy', 'How players talk about turns, plans and games.'],
    ['community', 'Community &amp; tournaments', 'Words from deck lists, events and the wider player base.'],
];

const T = [];
const add = (cat, id, name, o) => T.push({ cat, id, name, ...o });

// ---------------- Game basics ----------------
add('basics', 'lp', 'LP (Life Points)', {
    alias: 'life points, lp, health',
    def: 'Your health total. Both players start at 8000, and you lose when yours reaches 0.',
    heard: 'I\'m at 2000 LP, one more attack and I\'m done.',
});
add('basics', 'gy', 'GY (Graveyard)', {
    core: true, alias: 'graveyard, grave, yard, gy',
    def: 'The face-up pile beside your field. Destroyed, used, discarded and Tributed cards go here. Either player can look through either GY at any time. Many modern cards have effects that work <em>from</em> the GY, so treat it as a second hand rather than a trash can.',
    heard: 'Banish it so they can\'t use it in the GY.',
    see: ['banish', 'revive', 'mill'],
});
add('basics', 'banish', 'Banish', {
    core: true, alias: 'banished, banishment, removed from play, rfg, remove',
    def: 'Set a card aside away from the field, face-up unless the card says face-down. Banished cards are much harder to get back than cards in the GY, so banishing is one of the strongest ways to get rid of something.',
    eg: '{{Called by the Grave}} banishes a monster from your opponent\'s GY and shuts its effects off for a while.',
    see: ['gy'],
});
add('basics', 'main-deck', 'Main Deck', {
    alias: 'deck, 40 cards',
    def: 'The face-down pile you draw from: 40 to 60 cards. You can play up to 3 copies of any card (fewer if the [[banlist|Banlist]] says so). Staying close to 40 means you draw your best cards more often.',
    see: ['extra-deck', 'side-deck'],
});
add('basics', 'extra-deck', 'Extra Deck', {
    core: true, alias: 'ed, extra',
    def: 'A separate pile of up to 15 Fusion, Synchro, Xyz and Link Monsters. You never draw these. You Summon them straight from the Extra Deck when you meet their requirements, and most combos end with Extra Deck monsters on the field.',
    heard: 'That effect locks me out of my Extra Deck for the rest of the turn.',
    see: ['materials', 'emz', 'lock'],
});
add('basics', 'side-deck', 'Side Deck / Siding', {
    alias: 'side, siding, sided, side in, side out',
    def: 'Up to 15 extra cards you can swap into your deck between games of a [[match|match]], to prepare for the deck you\'re facing. "Siding in" a card means putting it in for the next game.',
    heard: 'I sided in three floodgates for game two.',
    see: ['tech', 'match'],
});
add('basics', 'field', 'Field / Board', {
    alias: 'board, table, field',
    def: 'Everything on the play area: monsters, Spells and Traps. "Board" usually means the cards one player has on the field right now.',
    heard: 'What does their board look like?',
    see: ['end-board', 'backrow'],
});
add('basics', 'backrow', 'Backrow', {
    alias: 'back row, s/t, spell trap zone, set cards',
    def: 'Your Spell &amp; Trap Zones (the row behind your monsters), or the face-down cards in it. A lot of backrow usually means Traps are waiting to go off.',
    heard: 'They Set three backrow, careful.',
    eg: '{{Mirror Force}} is the classic Trap that sits in the backrow waiting for an attack.',
    see: ['set', 'board-breaker'],
});
add('basics', 'emz', 'EMZ (Extra Monster Zone)', {
    alias: 'extra monster zone, emz',
    def: 'The two monster zones in the middle of the table, shared by both players. You can only use one of them. Link Monsters (and face-up Pendulum Monsters from the Extra Deck) must be Summoned there or to a zone a Link Monster points to. Fusion, Synchro and Xyz Monsters can go straight into your regular Main Monster Zones. The <a href="#field">field diagram</a> shows where it is.',
    see: ['extra-deck'],
});
add('basics', 'set', 'Set / Face-down', {
    alias: 'set, face down, face-down, flip',
    def: 'Place a card face-down. A Set monster is in face-down Defense Position and uses your Normal Summon for the turn. Set Spells and Traps wait in the backrow, and a Trap can\'t be activated the turn it was Set unless its text says otherwise.',
    see: ['backrow', 'normal-summon'],
});
add('basics', 'normal-summon', 'Normal Summon / Tribute Summon', {
    alias: 'ns, tribute summon, normal summon',
    def: 'Your one free Summon each turn: put a monster from your hand onto the field. Level 1 to 4 monsters need nothing. Level 5 and 6 need you to [[tribute|Tribute]] 1 monster you control, and Level 7 or higher need 2. Setting a monster face-down uses the same once-per-turn allowance.',
    heard: 'It uses your Normal Summon, so it\'s a big commitment.',
    see: ['special-summon'],
});
add('basics', 'special-summon', 'Special Summon', {
    core: true, alias: 'ss, special, summon',
    def: 'Any Summon that isn\'t your Normal Summon: one made by a card effect, or from the Extra Deck using materials. There\'s no limit per turn unless a card says so, which is why a modern turn can include ten or more Summons.',
    eg: '{{Nibiru, the Primal Being}} punishes a player who Summons five or more monsters in one turn.',
    see: ['combo', 'materials'],
});
add('basics', 'materials', 'Materials', {
    alias: 'material, fusion material, xyz material, overlay, overlay unit',
    def: 'The monsters you use up to Summon an Extra Deck monster. Fusion, Synchro and Link materials go to the GY. Xyz materials are tucked under the Xyz Monster instead, and get [[detach|detached]] to pay for its effects.',
    see: ['tuner', 'link-climb'],
});
add('basics', 'tuner', 'Tuner', {
    alias: 'tuners, non-tuner, synchro',
    def: 'A kind of monster needed for Synchro Summons: 1 Tuner plus any number of non-Tuners whose Levels add up to the Synchro Monster\'s Level. It says "Tuner" on the card\'s type line.',
    eg: '{{Ash Blossom & Joyous Spring}} and {{Effect Veiler}} are both Tuners, a handy bonus for Synchro decks.',
});
add('basics', 'levels', 'Level, Rank &amp; Link Rating', {
    alias: 'level, rank, link rating, stars, link-2, link-3, link-4',
    def: 'The number that says how big a monster is. Most monsters have a Level (the stars). Xyz Monsters have a Rank instead, and Link Monsters have a Link Rating ("Link-3") equal to the number of materials they need. A Rank or Link Rating is not a Level, so effects that care about Levels ignore them.',
});

add('basics', 'attribute', 'Attribute', {
    alias: 'attributes, dark, light, earth, water, fire, wind, divine',
    def: 'The element in the circle at the top right of a monster: DARK, LIGHT, EARTH, WATER, FIRE, WIND or DIVINE. Many effects care about it, such as "add 1 Level 1 FIRE monster".',
    eg: '{{Snake-Eye Ash}} searches a Level 1 FIRE monster, so only FIRE monsters count.',
    see: ['monster-type', 'levels'],
});
add('basics', 'monster-type', 'Type (monster type)', {
    alias: 'type, types, race, dragon, warrior, spellcaster, monster type',
    def: 'A monster\'s species, printed in square brackets above its text, like [Dragon] or [Spellcaster]. There are more than 20 Types, and many archetypes and effects care about one of them. Don\'t mix it up with the card type (Normal, Effect, Fusion and so on), which the frame colour shows.',
    eg: '{{Reinforcement of the Army}} only searches Warriors.',
    see: ['attribute'],
});
add('basics', 'token', 'Token', {
    alias: 'tokens',
    def: 'A stand-in monster created by a card effect. It isn\'t a real card: it can\'t be in your Deck or hand, and if it leaves the field it simply disappears. Tokens are often used up as Tribute or Link material.',
    eg: '{{Nibiru, the Primal Being}} hands your opponent a big Token after it Tributes the field.',
    see: ['materials'],
});
add('basics', 'quick-play', 'Quick-Play Spell', {
    alias: 'quick play, quickplay, quick-play',
    def: 'A Spell with a lightning-bolt icon. You can activate it from your hand during your own turn, even in response to something. If you Set it, you can also use it on your opponent\'s turn, but not on the turn you Set it.',
    eg: '{{Called by the Grave}} and {{Book of Moon}} are Quick-Play Spells.',
    see: ['spell-speed', 'set'],
});
add('basics', 'continuous', 'Continuous Spell / Trap', {
    alias: 'continuous spell, continuous trap',
    def: 'A Spell or Trap with an infinity icon. It stays on the field after it\'s activated and keeps working until it leaves the field.',
    eg: '{{Skill Drain}} and {{Call of the Haunted}} are Continuous Traps.',
    see: ['continuous-effect', 'floodgate'],
});
add('basics', 'counter-trap', 'Counter Trap', {
    alias: 'counter, counter traps',
    def: 'A Trap with an arrow icon, and the fastest card in the game: only another Counter Trap can be activated in response to it. Most Counter Traps negate something.',
    eg: '{{Solemn Judgment}} and {{Solemn Strike}} are Counter Traps.',
    see: ['spell-speed', 'negate'],
});
add('basics', 'field-spell', 'Field Spell', {
    alias: 'field spells',
    def: 'A Spell that goes in the Field Zone. Each player can have one; if you activate a new one, your old one is sent to the GY. Many archetypes have a Field Spell that powers up the whole deck.',
    see: ['field'],
});
add('basics', 'equip', 'Equip Spell', {
    alias: 'equip, equips, equipped',
    def: 'A Spell attached to one monster, usually to power it up. If that monster leaves the field or is turned face-down, the Equip Spell is destroyed.',
    see: ['continuous'],
});
add('basics', 'flip', 'Flip effect', {
    alias: 'flip, flip effect, flip monster',
    def: 'An effect marked "FLIP:" that activates when the monster is turned face-up, for example when a Set monster is attacked or Flip Summoned.',
    eg: '{{Man-Eater Bug}}: "FLIP: Target 1 monster on the field; destroy it."',
    see: ['set'],
});

// ---------------- Effects & rulings ----------------
add('effects', 'chain', 'Chain / Chain Link', {
    core: true, alias: 'chain, chain link, cl1, cl2, cl3, chained',
    def: 'When a card or effect is activated, both players get the chance to activate something in response. Each response is a new Chain Link, and the chain then resolves backwards: the last card activated happens first. The <a href="#basics-chain">chain example</a> above walks through one.',
    heard: 'Chain Link 2: Ash Blossom.',
    see: ['respond', 'resolve', 'spell-speed'],
});
add('effects', 'respond', 'Respond / Chain to', {
    alias: 'response, in response, responses, chain to',
    def: 'Activate a card or effect right after your opponent activates one, so yours goes on top of the chain and resolves first. When an opponent asks "any responses?", they\'re giving you that chance before they carry on.',
    heard: 'In response to the search, I discard Ash.',
    see: ['chain'],
});
add('effects', 'resolve', 'Resolve', {
    alias: 'resolves, resolution, resolving',
    def: 'The moment an activated effect actually does what it says. Activating a card and resolving it are two separate moments, and in between it can be responded to or negated.',
    see: ['chain', 'negate'],
});
add('effects', 'negate', 'Negate', {
    core: true, alias: 'negation, negated, negates, negating',
    def: 'Cancel something. Negating an <em>activation</em> stops the card completely. Negating an <em>effect</em> stops what it does (for a monster, often until the end of the turn). Negating a Summon means the monster never arrives.',
    eg: '{{Solemn Judgment}} negates a Summon or a Spell/Trap activation, and destroys that card.',
    see: ['omni-negate', 'interruption'],
});
add('effects', 'quick-effect', 'Quick Effect', {
    alias: 'quick effect, fast effect, quick',
    def: 'A monster effect you can use during either player\'s turn, even in response to something, not only in your own Main Phase. Handtraps are Quick Effects, and newer cards print "(Quick Effect)" in their text.',
    see: ['spell-speed', 'handtrap'],
});
add('effects', 'trigger', 'Trigger effect', {
    alias: 'trigger, triggers, on summon',
    def: 'An effect that activates when something happens: "If this card is Summoned…", "If this card is sent to the GY…". Many starters are trigger effects that search as soon as they\'re Summoned.',
    eg: '{{Snake-Eye Ash}}: "If this card is Normal or Special Summoned: You can add 1 Level 1 FIRE monster from your Deck to your hand."',
    see: ['missing-timing'],
});
add('effects', 'ignition', 'Ignition effect', {
    alias: 'ignition',
    def: 'A monster effect you activate yourself during your own Main Phase, much like a Spell Card. It needs no special timing, but it can\'t be used in response to anything.',
});
add('effects', 'continuous-effect', 'Continuous effect', {
    alias: 'continuous',
    def: 'An effect that is simply always on while its card is face-up. It never starts a chain. Many floodgates work this way.',
    eg: 'Once {{Skill Drain}} is active, it keeps negating the effects of every face-up monster on the field.',
    see: ['floodgate'],
});
add('effects', 'spell-speed', 'Spell Speed', {
    alias: 'spell speed, spell speed 1, spell speed 2, spell speed 3, speed',
    def: 'Decides what can respond to what. <strong>Spell Speed 1:</strong> Normal Spells, Ignition effects and most Trigger effects. They start chains and can\'t respond to anything. <strong>Spell Speed 2:</strong> Quick-Play Spells, Traps and Quick Effects. They can respond to Spell Speed 1 or 2. <strong>Spell Speed 3:</strong> Counter Traps. Only another Spell Speed 3 card can respond to them.',
    see: ['chain', 'quick-effect'],
});
add('effects', 'hopt', 'Hard once per turn (HOPT)', {
    core: true, alias: 'hopt, hard opt, once per turn, hard once per turn',
    def: 'Text like "You can only use this effect of [card name] once per turn" limits that effect to once per turn <em>across every copy you have</em>. Nearly every modern card has it, and it\'s the main thing that stops combos from looping forever. A close cousin, "You can only activate 1 [card name] per turn", limits activating the card itself.',
    heard: 'It\'s HOPT, so the second copy does nothing this turn.',
    eg: '{{Sangan}}\'s search is hard once per turn.',
    see: ['soft-opt'],
});
add('effects', 'soft-opt', 'Once per turn (soft OPT)', {
    alias: 'opt, soft opt, soft once per turn',
    def: '"Once per turn" with no card name attached. Each copy can use the effect once per turn, so a second copy can use it again.',
    see: ['hopt'],
});
add('effects', 'target', 'Target / Non-targeting', {
    alias: 'targeting, targets, targeted, non-targeting, untargetable',
    def: 'An effect targets when its text says "target", and you pick the card when you activate it. Some monsters can\'t be targeted, so removal that doesn\'t target ("destroy all", "banish face-down") gets around them.',
    eg: '{{Evenly Matched}} doesn\'t target, so it can remove cards that are protected from targeting.',
    heard: 'It can\'t be targeted, so you need a non-targeting out.',
    see: ['out'],
});
add('effects', 'cost', 'Cost', {
    alias: 'costs, pay, paid',
    def: 'What you do to activate a card, before anyone can respond: pay LP, discard, Tribute, detach. In card text, the cost comes before the semicolon (;). If the activation gets negated, the cost stays paid.',
    eg: '{{Ash Blossom & Joyous Spring}} discards itself as its cost.',
    see: ['psct'],
});
add('effects', 'lock', 'Lock / Summoning restriction', {
    alias: 'locked, locked into, restriction, clause, lock',
    def: 'A limit a card puts on <em>you</em> for the rest of the turn, such as "you cannot Special Summon from the Extra Deck, except Fiend monsters". Being "locked into" a type means you can only use that kind of monster for the rest of the turn, so the order of your plays matters. "Lock" can also mean a board of floodgates that stops the opponent from playing at all.',
    see: ['floodgate'],
});
add('effects', 'psct', 'PSCT (Problem-Solving Card Text)', {
    alias: 'psct, card text, colon, semicolon',
    def: 'Konami\'s standard way of writing card text. A colon (:) ends the condition for activating. A semicolon (;) comes right after the cost or target. "And if you do" means both parts happen together, but only if the first part succeeded. "Then" means one after the other. "Also" means both happen independently.',
    see: ['cost', 'target'],
});
add('effects', 'missing-timing', 'Missing the timing', {
    alias: 'miss timing, missed the timing, mtt',
    def: 'An old rule that still matters. An optional "<strong>When</strong> … you can" effect fails to activate if its trigger wasn\'t the very last thing that happened, for example if it happened partway through a chain. "<strong>If</strong> … you can" effects don\'t have this problem, which is why modern cards almost always say "If".',
    see: ['trigger'],
});

// ---------------- Card roles ----------------
add('roles', 'starter', 'Starter / One-card starter', {
    core: true, alias: 'starter, starters, one-card starter, 1-card starter, one card combo, 1 card combo, two-card combo, 2 card combo',
    def: 'A card that begins your combo. A "one-card starter" needs nothing else in your hand and can make your whole end board alone; other starters need one specific partner card, which players call a two-card combo. The more starters a deck plays, the more often it gets going.',
    eg: '{{Snake-Eye Ash}} is a one-card starter in <a href="Snake-Eyes%20Deck%20Analysis.html">Snake-Eye</a> decks: it searches the next piece as soon as it\'s Summoned.',
    heard: 'Snake-Eye Ash is a one-card starter, so almost any hand with it plays.',
    see: ['extender', 'combo'],
});
add('roles', 'extender', 'Extender', {
    core: true, alias: 'extenders, extend',
    def: 'A card that makes your combo longer or bigger, or lets it keep going after the opponent interrupts it, but usually can\'t start the combo on its own. Starters get you going; extenders get you further.',
    heard: 'They had one starter and two extenders, so one handtrap wasn\'t enough.',
    see: ['starter', 'play-through'],
});
add('roles', 'handtrap', 'Handtrap', {
    core: true, alias: 'hand trap, hand-trap, handtraps, hts',
    def: 'A card you use straight from your hand during your opponent\'s turn to stop part of their combo. Handtraps are how the player going second fights back before their first turn.',
    eg: 'The classics: {{Ash Blossom & Joyous Spring}}, {{Effect Veiler}}, {{Infinite Impermanence}} and {{Droll & Lock Bird}}.',
    heard: 'I\'m holding two handtraps and waiting for the right moment.',
    see: ['choke-point', 'going-first'],
});
add('roles', 'board-breaker', 'Board breaker', {
    core: true, alias: 'breaker, board breakers, break, breaking, break the board',
    def: 'A card that clears or gets around the opponent\'s finished board, usually when you go second. Some destroy everything, some negate, some banish. "Breaking" a board means clearing enough of it that you can make your own plays.',
    eg: '{{Harpie\'s Feather Duster}} (all their Spells and Traps), {{Lightning Storm}}, {{Dark Ruler No More}} and {{Evenly Matched}}.',
    see: ['going-first', 'nuke'],
});
add('roles', 'boss', 'Boss monster', {
    alias: 'boss, bosses, payoff',
    def: 'The big payoff monster your deck is built to reach: strong, hard to remove, or both. Most archetypes have one or two.',
    eg: '{{Blue-Eyes Ultimate Dragon}} for classic Blue-Eyes, or {{Accesscode Talker}} as a finisher in many Link decks.',
    heard: 'Once the boss hits the field they can\'t do anything.',
});
add('roles', 'engine', 'Engine', {
    alias: 'engines, core',
    def: 'A group of cards that work together as a unit. "The engine" is the core of your deck, and you\'ll also hear about adding a small engine from another archetype into a deck.',
    see: ['non-engine', 'archetype'],
});
add('roles', 'non-engine', 'Non-engine', {
    alias: 'non engine, nonengine',
    def: 'The cards in your deck that aren\'t part of your combo, mostly handtraps and board breakers. They\'re there to stop your opponent, not to make your own plays.',
    see: ['engine', 'handtrap', 'board-breaker'],
});
add('roles', 'searcher', 'Searcher', {
    alias: 'searchers, tutor',
    def: 'A card whose job is to [[search|search]]: take a specific card from your Deck to your hand. Decks full of searchers are consistent, because any card can fetch the one they need.',
    eg: '{{Reinforcement of the Army}} searches a Level 4 or lower Warrior.',
    see: ['consistency'],
});
add('roles', 'floater', 'Floater', {
    alias: 'floaters, float',
    def: 'A monster that replaces itself when it leaves the field, usually by Summoning or searching another card. Destroying a floater doesn\'t really get rid of anything.',
    eg: '{{Mystic Tomato}} Summons a monster from the Deck when it\'s destroyed by battle. {{Sangan}} searches when it goes from the field to the GY.',
});
add('roles', 'staple', 'Staple', {
    alias: 'staples',
    def: 'A card that almost every deck plays or considers, because it\'s good whatever your archetype. Most handtraps and board breakers are staples.',
    heard: 'Ash is a staple, it\'s never a wasted pickup.',
    see: ['generic'],
});
add('roles', 'generic', 'Generic', {
    alias: 'generics',
    def: 'Not tied to any archetype, so any deck can play it, as long as it can meet the card\'s requirements.',
    see: ['staple', 'archetype'],
});
add('roles', 'tech', 'Tech / Tech card', {
    alias: 'tech, teched, teching, tech choice',
    def: 'A card added to beat specific decks or situations, rather than to help the deck\'s own plan. "Teching" a card means adding it for that reason.',
    heard: 'I teched a Kaiju for their big boss monster.',
    see: ['side-deck'],
});
add('roles', 'garnet', 'Garnet', {
    alias: 'garnets',
    def: 'A card your deck needs to contain, because other effects use it from the Deck, but that\'s bad to draw. Drawing garnets is one of the most common ways to [[brick|brick]].',
});
add('roles', 'brick', 'Brick / Bricking', {
    core: true, alias: 'brick, bricked, bricking, bricks',
    def: 'A hand that can\'t do anything useful, or a single card that\'s awful to draw. "I bricked" means you drew a hand that couldn\'t make a play.',
    heard: 'Five Spells and no monster, full brick.',
    see: ['garnet', 'dead', 'consistency'],
});
add('roles', 'dead', 'Dead card', {
    alias: 'dead, dead draw',
    def: 'A card that does nothing in the current situation.',
    eg: '{{Harpie\'s Feather Duster}} is dead if your opponent never Sets a Spell or Trap.',
});
add('roles', 'beatstick', 'Beatstick / Beater', {
    alias: 'beater, beatstick, beat stick',
    def: 'A monster whose job is simply to attack hard: high ATK, little or no effect.',
    eg: '{{Blue-Eyes White Dragon}}: 3000 ATK and no effect at all.',
});
add('roles', 'vanilla', 'Vanilla', {
    alias: 'normal monster, vanillas',
    def: 'A Normal Monster: no effect, just stats and a line of flavour text, on a yellow card. A few archetypes are built around them.',
    eg: '{{Dark Magician}} and {{Blue-Eyes White Dragon}}.',
});
add('roles', 'wall', 'Wall', {
    alias: 'walls',
    def: 'A monster that\'s hard to attack past, usually thanks to very high DEF or protection effects.',
    eg: '{{Big Shield Gardna}}, with 2600 DEF.',
});
add('roles', 'floodgate', 'Floodgate', {
    alias: 'floodgates, stun',
    def: 'A card with an ongoing effect that shuts off a whole type of play, such as no monster effects, or only one monster of each Type. Some hit both players. Decks built around them are called Stun decks.',
    eg: '{{Skill Drain}} negates every face-up monster\'s effects. {{Anti-Spell Fragrance}} makes Spells wait a turn. {{There Can Be Only One}} allows each player only one monster of each Type.',
    see: ['continuous-effect', 'deck-styles'],
});
add('roles', 'interruption', 'Interruption / Disruption', {
    alias: 'interruptions, disruption, disruptions, interaction',
    def: 'Anything that stops the opponent partway through their turn: a negate, a handtrap, a Trap that destroys something. Players rate a board by how many interruptions it has.',
    heard: 'Their end board has three interruptions.',
    see: ['negate', 'end-board'],
});
add('roles', 'omni-negate', 'Omni-negate', {
    alias: 'omni, omninegate, omni negate',
    def: 'An effect that can negate almost anything, any card or effect, usually once per turn. These are the scariest pieces of an end board.',
    see: ['negate', 'bait'],
});
add('roles', 'out', 'Out', {
    alias: 'outs',
    def: 'A card that can get you out of a losing position. "What are my outs?" means "what could I draw that wins this or saves me?"',
    heard: 'My only out to that floodgate is Harpie\'s Feather Duster.',
    see: ['topdeck'],
});
add('roles', 'wincon', 'Win condition (wincon)', {
    alias: 'win con, wincon, win condition',
    def: 'How a deck actually plans to win. Usually that\'s attacking with big monsters, but it can also be burn damage, making the opponent run out of cards, or a special win like holding all five pieces of <a href="Exodia%20Deck%20Analysis.html">Exodia</a>.',
});
add('roles', 'toolbox', 'Toolbox', {
    alias: 'toolbox',
    def: 'A deck that can search or Summon one of many different answers depending on the situation, like reaching into a toolbox for the right tool.',
});

// ---------------- Actions ----------------
add('actions', 'search', 'Search', {
    core: true, alias: 'searched, searches, searching, add, tutor',
    def: 'Use a card effect to add a specific card from your Deck to your hand. Searching is different from drawing, which gives you the top card.',
    eg: '{{Reinforcement of the Army}} searches a Warrior.',
    heard: 'Normal Summon, search, search, and we\'re off.',
    see: ['searcher', 'draw'],
});
add('actions', 'draw', 'Draw', {
    alias: 'draws, drew, draw power',
    def: 'Take the top card of your Deck into your hand: once per turn in your Draw Phase, or more with effects. Extra draws are powerful because they give you cards you\'d never otherwise see.',
    eg: '{{Pot of Greed}} (draw 2) was so strong that it has been <span data-ban-card="Pot of Greed" data-ban-expect="Forbidden">Forbidden for years</span>.',
});
add('actions', 'dump', 'Dump / Send', {
    alias: 'dump, dumped, send, sent, send to gy',
    def: 'Send a card you choose from your Deck to the GY. Great for decks whose cards work from the GY.',
    eg: '{{Foolish Burial}} dumps any monster.',
    see: ['mill', 'gy'],
});
add('actions', 'mill', 'Mill', {
    alias: 'milled, milling, mills',
    def: 'Send cards from the <em>top</em> of your Deck to the GY. Unlike a dump, you don\'t get to choose which cards.',
    eg: '{{Card Trooper}} mills up to 3 cards.',
    see: ['dump'],
});
add('actions', 'discard', 'Discard / Pitch', {
    alias: 'pitch, pitched, discarded, discarding',
    def: 'Send a card from your hand to the GY. "Pitching" a card usually means discarding it to pay for another effect.',
    eg: 'Handtraps like {{Ash Blossom & Joyous Spring}} discard themselves.',
    see: ['cost'],
});
add('actions', 'tribute', 'Tribute', {
    alias: 'tributed, tributing, sacrifice',
    def: 'Send a monster you control to the GY, either for a Tribute Summon or to pay for an effect. Older players still call it a "sacrifice".',
    see: ['normal-summon'],
});
add('actions', 'detach', 'Detach', {
    alias: 'detached, detaching, overlay unit, xyz material',
    def: 'Take a material out from under an Xyz Monster and send it to the GY, usually to pay for that monster\'s effect. An Xyz Monster with no materials left often can\'t use its effect.',
    eg: '{{Number 39: Utopia}} detaches a material to stop an attack.',
    see: ['materials'],
});
add('actions', 'pop', 'Pop', {
    alias: 'popped, pops, popping, destroy',
    def: 'Destroy a card, usually a single card with an effect.',
    eg: '{{Mystical Space Typhoon}} pops one Spell or Trap.',
    heard: 'Pop the Field Spell before you Summon anything.',
    see: ['nuke'],
});
add('actions', 'nuke', 'Nuke / Board wipe', {
    alias: 'wipe, board wipe, nuked, sweep',
    def: 'Destroy or remove everything, or everything on one player\'s side.',
    eg: '{{Raigeki}} destroys all your opponent\'s monsters. {{Dark Hole}} destroys every monster on the field.',
    see: ['board-breaker', 'overextend'],
});
add('actions', 'bounce', 'Bounce', {
    alias: 'bounced, bouncing, return to hand',
    def: 'Return a card from the field to its owner\'s hand. A bounced Extra Deck monster goes back to the Extra Deck instead, which makes bounce great against big bosses.',
    eg: '{{Compulsory Evacuation Device}} bounces one monster.',
    see: ['spin'],
});
add('actions', 'spin', 'Spin', {
    alias: 'spun, spinning, shuffle, return to deck',
    def: 'Return a card from the field to its owner\'s Deck, either shuffled in or put on top. Like bounce, a spun Extra Deck monster goes back to the Extra Deck.',
    eg: '{{Phoenix Wing Wind Blast}} puts a card on top of the Deck. {{Knightmare Unicorn}} shuffles one in.',
    see: ['bounce'],
});
add('actions', 'revive', 'Revive / Reborn', {
    alias: 'rez, reborn, revived, resurrect, reanimate',
    def: 'Special Summon a monster from the GY back onto the field.',
    eg: '{{Monster Reborn}} revives a monster from either player\'s GY. {{Call of the Haunted}} revives one from yours.',
    see: ['gy', 'recycle'],
});
add('actions', 'recycle', 'Recycle / Add back', {
    alias: 'add back, recover, recursion, recycled',
    def: 'Get a used card back from the GY (or from banishment) to your hand or Deck. Decks that do this a lot have good "recursion" and are hard to run out of cards.',
    eg: '{{Monster Reincarnation}} adds a monster from your GY back to your hand.',
    see: ['grind'],
});
add('actions', 'excavate', 'Excavate', {
    alias: 'excavated, excavating',
    def: 'Reveal cards from the top of your Deck, usually to pick one of them and put the rest back or away.',
    eg: '{{Pot of Prosperity}} excavates 3 or 6 cards and adds 1 of them to your hand.',
});
add('actions', 'steal', 'Steal / Take control', {
    alias: 'steal, stole, stealing, take control, control',
    def: 'Take control of an opponent\'s monster and use it as your own, usually until the end of the turn.',
    eg: '{{Change of Heart}}.',
});
add('actions', 'swing', 'Swing / Attack', {
    alias: 'attack, swing, swung, swing in, attacking',
    def: 'Attack. To "swing for game" or "swing for lethal" is to make the attack that wins.',
    see: ['lethal', 'crash'],
});
add('actions', 'crash', 'Crash', {
    alias: 'crash into, crashed, crashing, suicide',
    def: 'Attack into a monster with equal or higher ATK on purpose, either to clear it (equal ATK destroys both) or to set off an effect when your own monster is destroyed.',
});
add('actions', 'burn', 'Burn', {
    alias: 'burn damage, effect damage, burn deck',
    def: 'Damage from a card effect rather than an attack. "Burn decks" try to win this way.',
    eg: '{{Ookazi}} deals 800 damage. {{Magic Cylinder}} turns an attack back on the attacker.',
    see: ['wincon'],
});
add('actions', 'scoop', 'Scoop', {
    alias: 'concede, forfeit, surrender, scooped',
    def: 'Give up the game (you "scoop up" your cards). In a best-of-three match, scooping a lost game early to save time for the next one is completely normal.',
    see: ['match'],
});
add('actions', 'link-climb', 'Link climb', {
    alias: 'link climbing, climb, climbing',
    def: 'Use a Link Monster as material for a bigger one: a Link-2 into a Link-3, then a Link-4. A Link Monster can count as a number of materials equal to its Link Rating, so a few monsters can climb into a big finisher.',
    see: ['levels', 'materials'],
});
add('actions', 'rank-up', 'Rank-up', {
    alias: 'rank up, rum, rank-up-magic, ranked up',
    def: 'Summon a higher-Rank Xyz Monster by using one you already control as the material, usually with a "Rank-Up-Magic" Spell. The old materials come along underneath.',
    see: ['levels'],
});

// ---------------- Strategy ----------------
add('strategy', 'combo', 'Combo / Line', {
    alias: 'combos, comboing, line, lines, route',
    def: 'A string of card effects played one after another in a single turn, each leading into the next, to build a strong board. One specific route through a combo is called a "line". Many deck pages on this site have a step-by-step combo simulator.',
    heard: 'What\'s the line if they Veiler my first monster?',
    see: ['starter', 'end-board'],
});
add('strategy', 'going-first', 'Going first / going second', {
    core: true, alias: 'go first, go second, going second, first, second',
    def: 'In game one, the winner of a dice roll or rock-paper-scissors chooses. If you go first, you can\'t draw or attack on your first turn, but you set up a board before your opponent does anything. If you go second, you draw and can attack right away, but you face whatever they built. Most modern decks prefer to go first, and decks that like going second pack board breakers.',
    see: ['end-board', 'board-breaker', 'handtrap'],
});
add('strategy', 'end-board', 'End board', {
    core: true, alias: 'end board, endboard, final board',
    def: 'What\'s on your field when you end your turn, especially your first turn. A good end board holds several interruptions to stop the opponent\'s turn.',
    heard: 'The end board is two negates and a floodgate.',
    see: ['interruption', 'board-breaker'],
});
add('strategy', 'choke-point', 'Choke point', {
    alias: 'chokepoint, choke',
    def: 'The one card or effect a combo can\'t do without. Hit the choke point with your handtrap and most of the turn falls apart; hit the wrong card and they play through it.',
    see: ['handtrap', 'play-through'],
});
add('strategy', 'bait', 'Bait', {
    alias: 'baiting, baited',
    def: 'Make a less important play first so the opponent spends their negation on it, then make the play you actually care about.',
    heard: 'Bait the negate with the first monster, then go for the real combo.',
    see: ['omni-negate'],
});
add('strategy', 'play-through', 'Play through', {
    alias: 'played through, playing through',
    def: 'Keep your combo going after an interruption, usually thanks to extenders or a second route. "Can it play through Ash?" asks whether the deck still does something when its first search is negated.',
    see: ['extender'],
});
add('strategy', 'otk', 'OTK / FTK', {
    alias: 'otk, ftk, one turn kill, first turn kill',
    def: 'An OTK (One Turn Kill) takes the opponent from 8000 LP to 0 in a single turn. An FTK (First Turn Kill) wins on the very first turn of the game, before the opponent plays at all. FTKs are rare, and the Banlist usually shuts them down.',
    see: ['lethal'],
});
add('strategy', 'lethal', 'Lethal / Game', {
    alias: 'lethal, game, for game, has game',
    def: 'Enough damage to win this turn. "I have lethal" or "that\'s game" means the opponent is about to lose.',
});
add('strategy', 'card-advantage', 'Card advantage (+1 / −1)', {
    alias: 'plus, +1, -1, minus, advantage, 2-for-1, 2 for 1, plus one',
    def: 'Counting cards. If one of your cards takes out two of your opponent\'s, you gained a card (+1). A card that draws 2 is also a +1. It matters most in long games; in fast combo games, what the cards do matters more than how many there are.',
    see: ['grind'],
});
add('strategy', 'overextend', 'Overextend', {
    alias: 'overextending, overextended',
    def: 'Commit more cards to the field than you need, so that one board wipe or one big negate costs you everything.',
    see: ['nuke'],
});
add('strategy', 'consistency', 'Consistency', {
    alias: 'consistent, inconsistent',
    def: 'How often a deck gets to do what it wants. Plenty of starters and searchers and few garnets make a deck consistent.',
    see: ['starter', 'brick'],
});
add('strategy', 'grind', 'Grind game', {
    alias: 'grind, grindy, grinding, long game',
    def: 'A long game where both players trade resources over many turns. Decks with lots of recursion and card advantage are good at grinding.',
    see: ['recycle', 'card-advantage'],
});
add('strategy', 'deck-styles', 'Combo, control &amp; stun decks', {
    alias: 'combo deck, control, control deck, stun, stun deck, midrange, playstyle',
    def: 'Three broad playstyles. Combo decks build a big board in one explosive turn. Control decks answer everything the opponent does and win slowly. Stun decks use floodgates to stop the opponent from playing at all. Plenty of decks sit somewhere in between ("midrange").',
    see: ['floodgate', 'combo'],
});
add('strategy', 'topdeck', 'Topdeck', {
    alias: 'top deck, topdecked, topdecking',
    def: 'The card you draw at the start of your turn, or needing that draw to be exactly the right card. "I topdecked my out" means you drew the one card that saved you.',
    see: ['out'],
});
add('strategy', 'win-more', 'Win-more', {
    alias: 'win more',
    def: 'A card that\'s only good when you\'re already winning. It looks strong, but it does nothing when you\'re behind, which is exactly when you need help.',
});
add('strategy', 'power-creep', 'Power creep', {
    alias: 'creep',
    def: 'New cards slowly getting stronger than old ones over the years. It\'s why older favourites need new support to stay competitive.',
    see: ['support'],
});
add('strategy', 'mirror', 'Mirror match', {
    alias: 'mirror',
    def: 'A game in which both players use the same deck.',
});

add('strategy', 'deck-out', 'Deck out', {
    alias: 'decked out, deckout, deck-out',
    def: 'Losing because you have to draw a card but your Deck is empty. A few decks try to make the opponent deck out on purpose by milling them.',
    see: ['mill', 'wincon'],
});

// ---------------- Community & tournaments ----------------
add('community', 'archetype', 'Archetype', {
    core: true, alias: 'archetypes, theme, deck',
    def: 'A family of cards that share part of their name and are designed to work together, like Blue-Eyes or Snake-Eye. Most decks are built around one or two. This whole site is organised by archetype: <a href="../index.html">browse them here</a>.',
    see: ['support', 'engine'],
});
add('community', 'support', 'Support', {
    alias: 'new support, retrain',
    def: 'New cards printed for an existing archetype. When an old deck gets support, it can suddenly become strong again. On the <a href="../index.html">home page</a>, sort by "Support (Newest)" to see which archetypes just got new cards.',
    see: ['power-creep'],
});
add('community', 'meta', 'Meta', {
    alias: 'meta deck, metagame, off-meta, meta decks',
    def: 'The decks that are currently the strongest and most played: the "meta decks". The meta shifts with every new set and every Banlist.',
    see: ['tier'],
});
add('community', 'tier', 'Tier 0 / 1 / 2 / Rogue', {
    alias: 'tier, tier list, tier 1, tier 0, tier 2, rogue, t1',
    def: 'An informal ranking of decks by tournament results. Tier 1 decks win a lot. Tier 2 decks are strong but less common. Rogue decks are off the radar but can surprise people. "Tier 0" means one deck is so dominant that everyone has to play it or plan to beat it. Nobody agrees on the exact cut-offs.',
    see: ['meta'],
});
add('community', 'netdeck', 'Netdeck', {
    alias: 'netdecking, netdecked, copy a list',
    def: 'Copy a decklist that someone else published, often one that did well at a tournament. It\'s the smartest way to build your first deck.',
    see: ['decklist'],
});
add('community', 'decklist', 'Decklist / Ratios', {
    alias: 'list, decklist, ratios, ratio',
    def: 'The exact cards in a deck and how many copies of each: the "ratios".',
    see: ['netdeck'],
});
add('community', 'top', 'Top / Top cut', {
    alias: 'topped, topping, top 8, top cut, top 32',
    def: 'Finishing high enough at a tournament to reach the final elimination rounds. "This deck topped a YCS" means it placed near the top of one.',
});
add('community', 'tcg-ocg', 'TCG / OCG', {
    alias: 'tcg, ocg, rest of world, asia, trading card game, official card game',
    def: 'Two versions of the same paper game. The TCG (Trading Card Game) is played in the Americas, Europe and Oceania. The OCG (Official Card Game) is played in Japan and elsewhere in Asia. The OCG usually gets new cards months earlier, and each has its own Banlist.',
    see: ['banlist', 'md'],
});
add('community', 'md', 'MD (Master Duel)', {
    alias: 'master duel, md',
    def: 'Konami\'s official, free-to-play online version of the game. It uses the same rules as the paper game, but it releases cards on its own schedule and has its own Banlist.',
    see: ['tcg-ocg'],
});
add('community', 'format', 'Format', {
    alias: 'formats, advanced format, goat, edison, retro',
    def: 'The rules and card pool you\'re playing with. The normal, current format is called Advanced Format. Some players enjoy fan-run retro formats that only allow cards up to an older date, such as Goat or Edison.',
});
add('community', 'banlist', 'Banlist (F&amp;L list)', {
    alias: 'forbidden, limited, semi-limited, semi, banned, f&l, ban list, hit, unlimited',
    def: 'The Forbidden &amp; Limited List. Forbidden cards can\'t be played, Limited cards can be played at 1 copy, and Semi-Limited cards at 2. It\'s updated several times a year, and a card that "got hit" was put on it. See <a href="#banlist">the Banlist section</a> below, or <a href="Banlist.html">our live Banlist page</a>.',
    see: ['tcg-ocg'],
});
add('community', 'locals', 'Locals', {
    alias: 'local, local tournament, lgs, game store',
    def: 'The regular tournaments at your local game store. They\'re the friendliest place to start playing in person.',
    see: ['ots'],
});
add('community', 'ots', 'OTS', {
    alias: 'official tournament store, ots championship',
    def: 'An Official Tournament Store: a shop that runs official Konami events. Its yearly OTS Championship can award invitations to bigger events.',
    see: ['locals', 'big-events'],
});
add('community', 'big-events', 'Regionals, YCS &amp; WCQ', {
    alias: 'regional, regionals, ycs, wcq, nationals, nats, worlds, championship',
    def: 'The bigger events. Regionals are large one-day tournaments. A YCS (Yu-Gi-Oh! Championship Series) can draw thousands of players. WCQs (World Championship Qualifiers, called Nationals in some regions) decide who goes to the World Championship.',
    see: ['top'],
});
add('community', 'premiere', 'Premiere! event', {
    alias: 'sneak peek, premiere, prerelease',
    def: 'An event where you can play with a new set before its official release. Its older name was Sneak Peek.',
});
add('community', 'match', 'Match / Game 1, 2, 3', {
    alias: 'best of three, bo3, game 1, game one, game two, game 3, match',
    def: 'Tournament rounds are usually a match: the best of three games. Between games both players can side, swapping cards with their Side Deck, so game 1 is always played with the main deck alone.',
    see: ['side-deck'],
});
add('community', 'structure-deck', 'Structure Deck', {
    alias: 'sd, structure, precon',
    def: 'A pre-built deck sold as one box and built around one theme. It\'s the easiest way to own a playable core in paper, and many players buy two or three copies to get more of the key cards.',
    see: ['singles'],
});
add('community', 'singles', 'Singles', {
    alias: 'single, buying singles',
    def: 'Individual cards bought on their own instead of in random packs. If you want a specific deck, buying singles usually costs far less overall than hoping to open the right cards.',
    see: ['structure-deck'],
});
add('community', 'sim', 'Sim (simulator)', {
    alias: 'simulator, edopro, ygopro, sims',
    def: 'An unofficial program for playing Yu-Gi-Oh! online for free. <a href="https://projectignis.github.io/" target="_blank" rel="noopener">EDOPro</a> is the most popular. Every card is available straight away, which makes it perfect for trying a deck before you buy it.',
    see: ['replay', 'md'],
});
add('community', 'replay', 'Replay', {
    alias: 'replays, yrp, yrpx',
    def: 'A recording of a game you can watch back. EDOPro saves replays as .yrpX files, and you can upload one to our <a href="Replay-Analyzer.html">Replay Analyzer</a> for a turn-by-turn breakdown.',
    see: ['sim'],
});
add('community', 'judge', 'Judge / Ruling', {
    alias: 'judges, call a judge, ruling, rulings',
    def: 'A judge is the official who answers rules questions and fixes problems at a tournament. Calling one is normal and never rude. A ruling is an official answer on how a specific interaction works when the card text alone isn\'t clear.',
    see: ['psct'],
});
add('community', 'sleeves', 'Sleeves / Double sleeving', {
    alias: 'sleeve, double sleeve, inner sleeves, small size, japanese size',
    def: 'Plastic covers for your cards. Yu-Gi-Oh! cards are smaller than Magic or Pokémon cards, so buy "small" or "Japanese size" sleeves. Double sleeving adds a snug inner sleeve for extra protection.',
});


// ---------------- One-line summaries (shown collapsed, in popovers and in practice) ----------------
const SHORT = {
    // basics
    'lp': 'Your health: both players start at 8000, and 0 means you lose.',
    'gy': 'The discard pile, and a resource many cards use.',
    'banish': 'Removing a card from play, usually for good.',
    'main-deck': 'The 40 to 60 card pile you draw from.',
    'extra-deck': 'Up to 15 Fusion, Synchro, Xyz and Link Monsters you Summon directly.',
    'side-deck': 'Up to 15 cards you swap in between games of a match.',
    'field': 'Everything on the table; "board" means one player\'s cards on it.',
    'backrow': 'Your Spell & Trap Zones, or the face-down cards in them.',
    'emz': 'The two shared middle zones where Link Monsters are Summoned.',
    'set': 'Placing a card face-down.',
    'normal-summon': 'Your one free Summon from the hand each turn.',
    'special-summon': 'Any other Summon, from effects or the Extra Deck, with no limit per turn.',
    'materials': 'The monsters used up to Summon an Extra Deck monster.',
    'tuner': 'The kind of monster every Synchro Summon needs one of.',
    'levels': 'The number that sizes a monster: Level, Rank (Xyz) or Link Rating.',
    'attribute': 'The element in a monster\'s top-right circle, like DARK or FIRE.',
    'monster-type': 'A monster\'s species, like Dragon or Warrior, shown in square brackets.',
    'token': 'A stand-in monster made by an effect that vanishes when it leaves the field.',
    'quick-play': 'A fast Spell you can use in response, or on the opponent\'s turn once Set.',
    'continuous': 'A Spell or Trap that stays on the field and keeps working.',
    'counter-trap': 'The fastest Trap: only another Counter Trap can respond to it.',
    'field-spell': 'A Spell played in the Field Zone; one per player.',
    'equip': 'A Spell attached to one monster, usually to power it up.',
    'flip': 'An effect that activates when the monster is turned face-up.',
    // effects
    'chain': 'A stack of activations that resolves last in, first out.',
    'respond': 'Activating something right after your opponent does, so yours resolves first.',
    'resolve': 'The moment an effect actually happens.',
    'negate': 'Cancelling a card\'s activation, effect or Summon.',
    'quick-effect': 'A monster effect you can use during either player\'s turn.',
    'trigger': 'An effect that activates when something happens, like being Summoned.',
    'ignition': 'A monster effect you activate in your own Main Phase.',
    'continuous-effect': 'An effect that\'s always on while its card is face-up.',
    'spell-speed': 'The 1, 2 or 3 rating that decides what can respond to what.',
    'hopt': 'An effect you can use once per turn across all your copies.',
    'soft-opt': 'Once per turn for each copy of the card.',
    'target': 'Picking a specific card as you activate an effect.',
    'cost': 'What you pay to activate a card; it stays paid even if negated.',
    'lock': 'A restriction a card puts on you for the rest of the turn.',
    'psct': 'Konami\'s standard wording for card text, where the punctuation matters.',
    'missing-timing': 'Why some old "When ... you can" effects fail to activate.',
    // roles
    'starter': 'A card that starts your combo, ideally on its own.',
    'extender': 'A card that makes your combo bigger or keeps it going.',
    'handtrap': 'A card used from your hand on your opponent\'s turn to stop them.',
    'board-breaker': 'A card that clears or gets around a finished board.',
    'boss': 'The big monster your deck is built to reach.',
    'engine': 'The group of cards that makes your deck\'s plays.',
    'non-engine': 'Cards that stop your opponent instead of making your plays.',
    'searcher': 'A card that adds another specific card from your Deck to your hand.',
    'floater': 'A monster that replaces itself when it leaves the field.',
    'staple': 'A card almost every deck plays.',
    'generic': 'A card any deck can use, not tied to an archetype.',
    'tech': 'A card added to beat a specific deck or situation.',
    'garnet': 'A card your deck needs but you never want to draw.',
    'brick': 'A hand, or a card, that can\'t do anything.',
    'dead': 'A card that does nothing in the current situation.',
    'beatstick': 'A monster whose job is simply to attack hard.',
    'vanilla': 'A Normal Monster: no effect, just stats.',
    'wall': 'A monster that\'s hard to attack past.',
    'floodgate': 'A card that shuts off a whole kind of play.',
    'interruption': 'Anything that stops the opponent partway through their turn.',
    'omni-negate': 'An effect that can negate almost anything.',
    'out': 'A card that could get you out of a losing position.',
    'wincon': 'How a deck actually plans to win.',
    'toolbox': 'A deck that fetches a different answer for each situation.',
    // actions
    'search': 'Adding a specific card from your Deck to your hand.',
    'draw': 'Taking the top card of your Deck into your hand.',
    'dump': 'Sending a card you choose from your Deck to the GY.',
    'mill': 'Sending cards from the top of your Deck to the GY.',
    'discard': 'Sending a card from your hand to the GY.',
    'tribute': 'Sending your own monster to the GY for a Summon or a cost.',
    'detach': 'Removing a material from under an Xyz Monster.',
    'pop': 'Destroying a card.',
    'nuke': 'Destroying or removing everything on one or both sides.',
    'bounce': 'Returning a card from the field to the hand.',
    'spin': 'Returning a card from the field to the Deck.',
    'revive': 'Special Summoning a monster from the GY.',
    'recycle': 'Getting a used card back from the GY or banishment.',
    'excavate': 'Revealing cards from the top of your Deck, usually to pick one.',
    'steal': 'Taking control of your opponent\'s monster.',
    'swing': 'Attacking.',
    'crash': 'Attacking into an equal or stronger monster on purpose.',
    'burn': 'Damage dealt by a card effect instead of an attack.',
    'scoop': 'Conceding the game.',
    'link-climb': 'Using Link Monsters as material for bigger Link Monsters.',
    'rank-up': 'Turning an Xyz Monster into a higher-Rank one.',
    // strategy
    'combo': 'A string of effects played in one turn; one route through it is a "line".',
    'going-first': 'Who takes the first turn, and what each choice gives up.',
    'end-board': 'The cards left on your field when your turn ends.',
    'choke-point': 'The one card or effect a combo can\'t do without.',
    'bait': 'Making a play just to draw out the opponent\'s answer.',
    'play-through': 'Carrying on with your combo after an interruption.',
    'otk': 'Winning from 8000 LP in one turn, or on the very first turn.',
    'lethal': 'Enough damage to win this turn.',
    'card-advantage': 'Having more cards to work with than your opponent.',
    'overextend': 'Committing more cards to the field than you need to.',
    'consistency': 'How often a deck gets to do what it wants.',
    'grind': 'A long game of trading cards over many turns.',
    'deck-styles': 'The three broad ways decks play: combo, control and stun.',
    'topdeck': 'The card you draw for the turn, especially when you need a specific one.',
    'win-more': 'A card that only helps when you\'re already winning.',
    'power-creep': 'New cards gradually outclassing old ones.',
    'mirror': 'Both players using the same deck.',
    'deck-out': 'Losing because you must draw from an empty Deck.',
    // community
    'archetype': 'A family of cards with a shared name that work together.',
    'support': 'New cards printed for an existing archetype.',
    'meta': 'The strongest, most-played decks right now.',
    'tier': 'An informal ranking of decks by tournament results.',
    'netdeck': 'Copying a decklist someone else published.',
    'decklist': 'The exact cards in a deck and how many of each.',
    'top': 'Reaching the final rounds of a tournament.',
    'tcg-ocg': 'The two regional versions of the paper game.',
    'md': 'Konami\'s official free online version of the game.',
    'format': 'Which rules and cards are allowed.',
    'banlist': 'The list of Forbidden, Limited and Semi-Limited cards.',
    'locals': 'Regular tournaments at your local game store.',
    'ots': 'A store that runs official Konami tournaments.',
    'big-events': 'Large tournaments, up to the World Championship qualifiers.',
    'premiere': 'An event where you play with a new set before its release.',
    'match': 'A best-of-three set of games.',
    'structure-deck': 'A pre-built, ready-to-play deck in one box.',
    'singles': 'Individual cards bought on their own.',
    'sim': 'A free, unofficial program for playing online.',
    'replay': 'A recording of a game you can watch back.',
    'judge': 'The rules official at a tournament.',
    'sleeves': 'Card protectors; Yu-Gi-Oh! cards need small size.',
};

// ---------------- Render ----------------
const esc = s => s.replace(/&(?!(amp|lt|gt|quot|#\d+|[a-z]+);)/g, '&amp;');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const byId = new Map(T.map(t => [t.id, t]));

for (const t of T) if (!SHORT[t.id]) throw new Error('Missing short for ' + t.id);
for (const id of Object.keys(SHORT)) if (!byId.has(id)) throw new Error('Short for unknown term ' + id);
const shorts = Object.values(SHORT);
if (new Set(shorts).size !== shorts.length) throw new Error('Duplicate short');

function inline(s) {
    return s
        .replace(/\{\{(.+?)\}\}/g, (_, name) =>
            `<span class="card-ref" role="button" tabindex="0" data-cardname="${attr(name)}">${esc(name)}</span>`)
        .replace(/\[\[([a-z0-9-]+)\|(.+?)\]\]/g, (_, id, label) => {
            if (!byId.has(id)) throw new Error('Unknown term link: ' + id);
            return `<a href="#term-${id}">${label}</a>`;
        });
}

// Glossary words the field diagram can act out (keys match VERBS in the page script).
const VERB_DEMO = {
    'draw': 'draw', 'search': 'search', 'normal-summon': 'normal-summon', 'set': 'set', 'dump': 'dump',
    'mill': 'mill', 'discard': 'discard', 'tribute': 'tribute', 'detach': 'detach', 'pop': 'pop',
    'banish': 'banish', 'bounce': 'bounce', 'spin': 'spin', 'revive': 'revive', 'recycle': 'recycle'
};

const I = n => ' '.repeat(n);
let html = '';
for (const [cat, label, intro] of CATS) {
    const terms = T.filter(t => t.cat === cat);
    html += `${I(16)}<div class="gl-group" data-cat="${cat}">\n`;
    html += `${I(20)}<h3 class="gl-group__title"><span class="gl-dot" aria-hidden="true"></span>${label} <span class="gl-group__count">${terms.length}</span></h3>\n`;
    html += `${I(20)}<p class="gl-group__intro">${intro} <a class="gl-group__practise" href="#practice" data-practice-deck="cat:${cat}">Practise these</a></p>\n`;
    html += `${I(20)}<div class="gl-grid">\n`;
    for (const t of terms) {
        const see = (t.see || []).map(id => {
            const target = byId.get(id);
            if (!target) throw new Error(`Unknown see-also "${id}" on ${t.id}`);
            return `<a href="#term-${id}">${target.name}</a>`;
        });
        html += `${I(24)}<details class="term" id="term-${t.id}" data-cat="${cat}"${t.core ? ' data-core' : ''} data-alias="${attr(t.alias || '')}">\n`;
        html += `${I(28)}<summary class="term__sum">\n`;
        html += `${I(32)}<h4 class="term__name">${t.name}</h4>\n`;
        html += `${I(32)}<span class="term__marks">`;
        if (t.core) html += `<span class="term__core" title="Learn this one first"><i class="fas fa-star" aria-hidden="true"></i><span class="sr-only">Learn this one first</span></span>`;
        html += `<span class="term__done" title="You know this one" hidden><i class="fas fa-check" aria-hidden="true"></i><span class="sr-only">Learned</span></span>`;
        html += `<i class="fas fa-chevron-down term__chev" aria-hidden="true"></i></span>\n`;
        html += `${I(32)}<span class="term__short">${esc(SHORT[t.id])}</span>\n`;
        html += `${I(28)}</summary>\n`;
        html += `${I(28)}<div class="term__body">\n`;
        html += `${I(32)}<p class="term__def">${inline(t.def)}</p>\n`;
        if (t.heard) html += `${I(32)}<p class="term__heard"><span class="term__label">You'll hear</span> "${inline(t.heard)}"</p>\n`;
        if (t.eg) html += `${I(32)}<p class="term__eg"><span class="term__label">Example</span> ${inline(t.eg)}</p>\n`;
        if (see.length) html += `${I(32)}<p class="term__see"><span class="term__label">See also</span> ${see.join(', ')}</p>\n`;
        // A role="checkbox" span, not a <button>: page-sections.js treats any <button>
        // as a tool and would stop offering the definitions above for editing.
        const demo = VERB_DEMO[t.id]
            ? ` <a class="term__demo" href="#field" data-verb-demo="${VERB_DEMO[t.id]}"><i class="fas fa-play" aria-hidden="true"></i> Watch it on the field</a>`
            : '';
        html += `${I(32)}<div class="term__foot"><span class="term__learn" role="checkbox" aria-checked="false" tabindex="0"><i class="fas fa-check" aria-hidden="true"></i> I know this one</span>${demo}</div>\n`;
        html += `${I(28)}</div>\n`;
        html += `${I(24)}</details>\n`;
    }
    html += `${I(20)}</div>\n${I(16)}</div>\n`;
}

module.exports = { html, terms: T, short: SHORT, cats: CATS };
if (require.main === module) console.log('terms:', T.length, 'core:', T.filter(t => t.core).length, 'longest short:', Math.max(...shorts.map(s => s.length)));
