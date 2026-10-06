// Writes assets/data/combos/beginners-guide-combos.json: one annotated modern turn.
// Card text checked against the YGOProDeck API on 5 October 2026; every card is
// unrestricted in the TCG (Ash Blossom is Semi-Limited in the OCG only).
const fs = require('fs');
const OUT = require('path').join(__dirname, '../../assets/data/combos/beginners-guide-combos.json');

// The "Any card" entries show a card back by name. They aren't marked isDummy: the
// simulator treats dummies in hand as stand-ins and hides one whenever a real card is
// added from the Deck (Chixiao's search), but these are real cards that stay in hand.
const cards = [
    { id: 'c-moye', name: 'Swordsoul of Mo Ye', type: 'monster', zone: 'zone-hand' },
    { id: 'c-longyuan', name: 'Swordsoul Strategist Longyuan', type: 'monster', zone: 'zone-hand' },
    { id: 'c-ash', name: 'Ash Blossom & Joyous Spring', type: 'monster', zone: 'zone-hand' },
    { id: 'c-any1', name: 'Any card', type: 'monster', zone: 'zone-hand' },
    { id: 'c-any2', name: 'Any card', type: 'monster', zone: 'zone-hand' },
    { id: 'c-draw', name: 'Any card you draw', type: 'monster', zone: 'zone-deck' },
    { id: 'c-taia', name: 'Swordsoul of Taia', type: 'monster', zone: 'zone-deck' },
    { id: 'c-token1', name: 'Swordsoul Token', type: 'monster', zone: 'zone-vanish', isToken: true, code: 20001444 },
    { id: 'c-token2', name: 'Swordsoul Token', type: 'monster', zone: 'zone-vanish', isToken: true, code: 20001444 },
    { id: 'c-chixiao', name: 'Swordsoul Grandmaster - Chixiao', type: 'extra', zone: 'zone-extra' },
    { id: 'c-qixing', name: 'Swordsoul Sinister Sovereign - Qixing Longyuan', type: 'extra', zone: 'zone-extra' }
];

// One move per step. A step whose card stays where it is (an activation, a reveal,
// damage) just highlights that card.
const steps = [
    ['STARTER · Normal Summon Swordsoul of Mo Ye. That uses your one Normal Summon for the turn.', 'c-moye', 'zone-m3'],
    ['CHOKE POINT · Activate effect: Mo Ye was Normal Summoned, so you reveal Swordsoul Strategist Longyuan from your hand to Special Summon a Swordsoul Token. Revealing is the cost, and Longyuan stays in your hand. If your opponent negates Mo Ye right now with Effect Veiler or Infinite Impermanence, there is no Token and the combo stops. Ash Blossom can\'t stop it, because the Token doesn\'t come from the Deck.', 'c-moye', 'zone-m3'],
    ['TOKEN · A Swordsoul Token, a Level 4 Tuner, is Special Summoned. LOCK: while it\'s on the field, Synchro Monsters are the only monsters you can Special Summon from your Extra Deck.', 'c-token1', 'zone-m4'],
    ['MATERIAL · The Swordsoul Token is used as Synchro Material. Tokens never reach the GY; they simply vanish.', 'c-token1', 'zone-vanish'],
    ['MATERIAL · Swordsoul of Mo Ye goes to the GY as the other Synchro Material. Level 4 + Level 4 = 8.', 'c-moye', 'zone-gy'],
    ['Synchro Summon Swordsoul Grandmaster - Chixiao, a Level 8 Synchro Monster. Synchro Monsters can go straight into a Main Monster Zone.', 'c-chixiao', 'zone-m3'],
    ['CHAIN · Activate effects: Chixiao\'s Summon and Mo Ye going to the GY as Synchro Material trigger at the same time, so both go on one chain. You pick the order: Chixiao\'s search is Chain Link 1 and Mo Ye\'s draw is Chain Link 2, so the draw resolves first.', 'c-chixiao', 'zone-m3'],
    ['DRAW · Chain Link 2 resolves: Mo Ye draws you 1 card. That\'s a free card, a +1.', 'c-draw', 'zone-hand'],
    ['SEARCH · Chain Link 1 resolves: Chixiao adds Swordsoul of Taia from your Deck to your hand. Chixiao gets one effect per turn: this search now, and its negate on your opponent\'s turn.', 'c-taia', 'zone-hand'],
    ['COST · Discard Swordsoul of Taia to activate Swordsoul Strategist Longyuan\'s effect in your hand. Its cost is discarding another Swordsoul card, and that\'s why Chixiao searched one.', 'c-taia', 'zone-gy'],
    ['EXTENDER · Longyuan Special Summons itself from your hand. It couldn\'t start this combo alone, but it keeps it going after your first Synchro.', 'c-longyuan', 'zone-m4'],
    ['TOKEN · Longyuan then Special Summons another Swordsoul Token, a Level 4 Tuner, with the same lock.', 'c-token2', 'zone-m2'],
    ['MATERIAL · The second Swordsoul Token vanishes as Synchro Material.', 'c-token2', 'zone-vanish'],
    ['MATERIAL · Swordsoul Strategist Longyuan goes to the GY as Synchro Material. Level 6 + Level 4 = 10.', 'c-longyuan', 'zone-gy'],
    ['Synchro Summon Swordsoul Sinister Sovereign - Qixing Longyuan, a Level 10 Synchro Monster.', 'c-qixing', 'zone-m4'],
    ['BURN · Activate effect: Longyuan was sent to the GY as Synchro Material, so your opponent takes 1200 damage. Their Life Points drop from 8000 to 6800.', 'c-longyuan', 'zone-gy'],
    ['END BOARD · You end your turn with two Synchro Monsters. On your opponent\'s turn, Chixiao can negate a monster\'s effects by banishing Swordsoul of Taia from your GY, and Qixing Longyuan can banish one monster they Special Summon and one Spell or Trap card they activate, with 1200 damage each time. That\'s up to three interruptions, and Ash Blossom is still in your hand as your handtrap.', 'c-qixing', 'zone-m4']
];

const data = {
    archetype: 'Swordsoul',
    combos: {
        combo1: {
            title: 'A Modern First Turn: Swordsoul, Step by Step',
            description: 'A real modern first turn, with every step labelled with the word players use for it. Two cards in hand, Swordsoul of Mo Ye and Swordsoul Strategist Longyuan, become two Synchro Monsters that can stop up to three of your opponent\'s plays, and Ash Blossom stays in your hand. Every card here can be played at three copies in the TCG (as of 5 October 2026).',
            date: 'October 5, 2026',
            cards,
            // customText keeps "GY" as the guide teaches it (plain text gets expanded to "Graveyard").
            steps: steps.map(([text, card, to]) => ({ text, customText: text, card, to }))
        }
    }
};

// Sanity checks: known cards, a real zone for each move, one card per zone.
const ids = new Set(cards.map(c => c.id));
const zones = /^(zone-(hand|deck|extra|gy|banish|field|vanish|m[1-5]|s[1-5]|em-left|em-right)|material:.+)$/;
const where = Object.fromEntries(cards.map(c => [c.id, c.zone]));
steps.forEach(([text, card, to], i) => {
    if (!ids.has(card)) throw new Error(`step ${i + 1}: unknown card ${card}`);
    if (!zones.test(to)) throw new Error(`step ${i + 1}: bad zone ${to}`);
    if (/^zone-[ms]\d$/.test(to) && where[card] !== to) {
        const taken = Object.entries(where).find(([id, z]) => z === to && id !== card);
        if (taken) throw new Error(`step ${i + 1}: ${to} already holds ${taken[0]}`);
    }
    // The simulator plays a summon animation for any step whose text reads like one.
    const summonWords = /xyz summon|synchro summon|contact fusion|fusion|link summon|ritual summon|pendulum summon|tribute summon|advance summon/i;
    if (summonWords.test(text) !== /^Synchro Summon /.test(text)) throw new Error(`step ${i + 1}: summon wording outside a summon step`);
    where[card] = to;
});
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
console.log('steps', steps.length, 'final', JSON.stringify(Object.fromEntries(Object.entries(where).filter(([, z]) => /^zone-(m|s|hand)/.test(z)))));
