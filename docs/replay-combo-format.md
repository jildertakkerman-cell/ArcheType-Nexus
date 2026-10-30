# Replay combo JSON, format version 2

Combo JSONs distilled from EDOPro replays (`.yrpX`) by the yrp service. Since 2026-10-28 they are
`formatVersion: 2`: they hold **both players' moves, turn and phase boundaries, chain results,
full decklists, the duel's rules, and what each activation targeted, picked and chose**, so a replay
can be re-run in ocgcore as it was played.

The generator is `src/distill_combo_v2.ts` in the `yrp-private` repo, and its type comments are the
source of truth. The move tracking behind it is in `src/move_log_builder.ts`.

## Where these files are

| Location | Produced by | Notes |
|---|---|---|
| GCS `combo-json/{comboid}.json` | `POST /generate-combo-json` (admin, my-replays, replay analyzer) | Community combos (`combos.gcscombojsonpath`). The 4 existing files are still v1 until regenerated. |
| GCS `replays_json/<timestamp>_<raw replay name>.json` | `npm run replays:reanalyze-raw` | Replay archive. Older v1 copies sit next to the v2 ones. For each replay, the file with the latest timestamp prefix is current. The same folder also holds upload-time *analysis* JSONs (`replaySteps`, `moveLog`, …), which are a different format. |
| yrp-private `replays/synced_by_archetype/<archetype>/json/` | `npm run replays:sync-local` | Local copies of the above. |

## Detecting the version

```js
const combo = data.combos.combo1;
const isV2 = combo.formatVersion >= 2;
```

A combo without `formatVersion` is v1: player 0's moves only, no turn or phase markers, an opening
hand that can include later draws, and ids that may merge copies. Hand-written combos in
`assets/data/combos/` are also unversioned. Keep the old code path for them.

Some v2 fields were added after the first v2 export run, so files from that run lack them. Treat
them as optional: `duel`, `reveal` steps, and `targets`, `selected` and `choices` on steps. Test-hand
replays from that run also lack `decks`.

In GCS, the first v2 run's files are `replays_json/2026-10-28T15-…` and the run with all the fields
is `replays_json/2026-10-28T21-…`. The second run covers every replay, and taking the newest file
per replay always gives it. Of its 227 files:

- all have `duel`;
- 223 have `duel.flags` and `duel.replay`;
- 224 have both decklists;
- 211 have activation `targets`, 153 have `choices` and 109 have `reveal` steps.

## Top level

```jsonc
{
  "archetype": "Tearlaments",          // inferred from player 0's cards
  "playerName": "[AI] Tearlaments",    // player 0's name
  "combos": {
    "combo1": {
      "title": "Imported Combo",       // placeholder
      "description": "Automatically distilled from replay file.",
      "formatVersion": 2,
      "cards": [ /* CardDetail */ ],
      "decks": [ /* DeckList | null, per player */ ],   // optional, see below
      "duel": { /* rules and start parameters */ },     // see below
      "steps": [ /* ComboStep */ ]
    }
  }
}
```

**Player 0 is the combo player** (the replay's first player, usually the uploader). Player 1 is the
opponent.

## `cards`: one entry per physical copy

```json
{ "id": "p1-card-003", "name": "Tearlaments Reinoheart", "type": "monster", "zone": "zone-hand", "code": 73956664, "isToken": false, "player": 0 }
{ "id": "p2-card-001", "name": "Infinite Impermanence", "type": "trap", "zone": "zone-hand", "code": 10045474, "isToken": false, "player": 1 }
```

| Field | Meaning |
|---|---|
| `id` | Stable for the whole duel, one per physical copy: two copies of the same card get different ids. **The prefix names the owner, counting from 1: `p1-` is player 0, `p2-` is player 1.** Numbers can have gaps. |
| `player` | Owner: `0` or `1`. It always agrees with the id prefix. |
| `code` | EDOPro passcode. A few are EDOPro-only alias codes that YGOPRODeck doesn't know; those get the name `Card #<code>` and `type` `monster`. |
| `type` | `monster` \| `spell` \| `trap` \| `extra` (Fusion/Synchro/Xyz/Link), from YGOPRODeck. It defaults to `monster` when the lookup fails, so for engine work use the cdb by `code`. |
| `zone` | **Where the card is when the duel starts:** `zone-hand` (opening hand), `zone-deck`, `zone-extra`, or `zone-vanish` (Tokens, which don't exist yet). |
| `isToken` | The card is a Token. Never put it in a Deck. It appears through a summon step `from: "zone-vanish"`. |
| `preset` | Only on puzzle replays (see "Puzzles"): the card starts on the field, in the GY or banished, and `zone` says where. |

`cards` lists only the copies that **move, activate or are revealed in the replay**. A card that is
only revealed (shown from the Extra Deck as a cost, say) starts where it was revealed. A card that
never does any of these is not in `cards`; it is in `decks`. Order: player 0's cards, then player
1's, each by first appearance.

The opening hand is exactly the cards drawn before turn 1. Every later draw is a `draw` step, and
the card it draws starts in `zone-deck`.

## `decks`: full decklists

```jsonc
"decks": [
  { "main": [/* 40 codes, bottom → top */], "extra": [/* 15 codes */] },   // player 0
  { "main": [/* … */], "extra": [/* … */] }                               // player 1
]
```

- `main` is the Main Deck in its **real starting order, bottom to top**. The last code is the top
  card, which is drawn first. It **includes the opening hand**: player *p*'s opening hand is the last
  *n* codes of `decks[p].main`, where *n* is the number of `zone-hand` cards player *p* owns.
- `extra` is the Extra Deck. Its order carries no meaning.
- The ids in `cards` are particular copies within these lists. Copies of the same code are
  interchangeable at the start, so to build a Deck, take `main` and remove the codes that start in
  hand. The rest is the Deck, still in order.
- The order comes from the engine's first look at each Deck, which is checked against the decklist
  the replay recorded (`duel.replay.decks`). An entry is `null` when that look came after the
  player's first draw or doesn't hold exactly the recorded cards; some bot-made replays do this.
  `decks` is absent only on puzzles and on the few replays with no recorded decklist.
- Test-hand replays have `decks` too, in exports made after the first v2 run.
- The order only holds until that Deck is first shuffled in the real game, for example after a
  search. A `draw` step always names the card drawn, so a verifier that disables shuffling should put
  that card on top before the draw.
- `duel.replay.decks` lists the same cards **as built, before the duel shuffled them**. Use `decks`
  to lay out a Deck yourself, and `duel.replay.decks` to re-run the recorded duel.

## `duel`: rules and start parameters

```jsonc
"duel": {
  "flags": "190466",              // ocgcore DUEL_* flags, a uint64 as a decimal string
  "handTest": true,               // EDOPro test-hand mode
  "puzzle": false,
  "startLP": [8000, 8000],
  "startHand": [5, 5],
  "drawPerTurn": [1, 1],
  "firstPlayer": 0,               // who took turn 1
  "replay": {                     // to re-run the recorded duel; see below
    "seed": ["…", "…", "…", "…"],
    "decks": [{ "main": [/* … */], "extra": [/* … */] }, { "main": [], "extra": [] }],
    "responses": ["01000000", "…"]
  }
}
```

EDOPro writes a complete old-style replay inside every `.yrpX`. That embedded replay holds the duel's
parameters, both decklists as built and every response the players gave; `duel` comes from it.

| Field | Meaning |
|---|---|
| `flags` | The duel's ocgcore duel-mode flags: the `DUEL_*` bits of `ocgapi_constants.h`, which are the same values as `OcgDuelMode` in `@n1xx1/ocgcore-wasm`. Read it with `BigInt(duel.flags)`, because it can exceed 2^53. Absent when the replay has no embedded replay (4 of 228 local replays). |
| `handTest` | The replay header's `REPLAY_HAND_TEST` flag. |
| `puzzle` | Single mode without hand test: the board is set up by a script (`replay.scriptName`). |
| `startLP` | Per player, from MSG_START when the duel has one, otherwise from the embedded replay. |
| `startHand`, `drawPerTurn` | Per player, from the embedded replay. EDOPro uses one value for both players. |
| `firstPlayer` | The player of the first `turn` marker. |

Values seen in the local replays:

| `flags` | Meaning |
|---|---|
| `190464` | Master Rule 5 (`DUEL_MODE_MR5`): normal duels |
| `190466` | MR5 + `ATTACK_FIRST_TURN`: test hand |
| `190482` | MR5 + `ATTACK_FIRST_TURN` + `PSEUDO_SHUFFLE`: test hand |
| `853760` | Master Rule 1 (`DUEL_MODE_MR1`, which includes `1ST_TURN_DRAW`) |

A handful of other values are custom rule sets. The Primite replay's `82410636076` includes
`1ST_TURN_DRAW`. No normal MR5 duel has `ATTACK_FIRST_TURN` or `1ST_TURN_DRAW`. Test-hand duels
allow a Battle Phase on turn 1, and `Duel.IsAbleToEnterBP()` is true then.

### `duel.replay`: re-running the recorded duel

`replay` has what it takes to replay the real duel in ocgcore, decision for decision:

| Field | Meaning |
|---|---|
| `seed` | The Xoshiro256** state the duel was created with: four uint64s as decimal strings (`OCG_DuelOptions.seed`). |
| `decks` | One decklist per duelist, home team first, **in build order before the shuffle**. In a 1-vs-1 duel these are players 0 and 1. |
| `ruleCards` | Custom rule cards, when the duel had any. |
| `scriptName` | A puzzle's script. |
| `responses` | Every response the players gave, in order, as hex. Each is what `OCG_DuelSetResponse` received. |

Create the duel with `flags`, `seed`, `startLP`, `startHand` and `drawPerTurn`, and add the cards
from `replay.decks` the way EDOPro's replay mode does (`gframe/replay_mode.cpp`). Then answer each
prompt with the next response. The engine shuffles and draws exactly as in the recording, so every
prompt and answer comes back: targets, options, yes/no, declarations, zones. That holds as long as
the core and card scripts behave like the ones that recorded it. A response that's rejected, or a
prompt with no response left, means they don't.

## Puzzles

Puzzle replays (`duel.puzzle`) start from a board a script set up instead of dealing from decks:

- Cards that start on the field, in the GY or banished have that `zone` and `preset: true`.
  `combo-runner.mjs` already keeps a preset zone when `card.preset` is set.
- `decks` is absent, and the opponent may have no cards at all.

Test-hand replays are dealt from decks like normal duels. They have `decks`, no `preset` cards, and
`duel.handTest: true`. The opponent's decklist can be empty there.

## Zones and sides

Zone ids are the DuelSimulator's own:

| Zone | Meaning |
|---|---|
| `zone-hand`, `zone-deck`, `zone-extra`, `zone-gy`, `zone-banish` | Piles |
| `zone-m1` … `zone-m5` | Main Monster Zones, left to right (ocgcore sequence 0–4) |
| `zone-em-left`, `zone-em-right` | Extra Monster Zones (sequence 5, 6) |
| `zone-s1` … `zone-s5` | Spell & Trap Zones (sequence 0–4; s1/s5 are the Pendulum Zones) |
| `zone-field` | Field Zone |
| `material:<hostId>` | Attached as Xyz Material to card `<hostId>` |
| `zone-vanish` | Not on the board: a Token before it is created or after it leaves the field, or a card removed from the game |

A zone id doesn't say whose zone it is. **A zone belongs to whoever controls the card, which is
its owner unless the action carries `controller`:**

```js
const owner = id => (id.startsWith('p2-') ? 1 : 0);
const sideAfter = action => action.controller ?? owner(action.card);
```

`controller` is present exactly when the card's controller after the step isn't its owner. That
happens after a control change, when the opponent's monster is revived onto your field, for a
monster summoned to the opponent's field (Kaiju, Lava Golem), and so on. Every later action on that
card keeps carrying `controller` until the card is back with its owner. Cards always go to their
owner's piles, so a `to` pile zone never has `controller`. A card's `from` side is wherever its
previous action left it, or its owner at the start.

## `steps`

Every step has `text`, `type` and `player`. Card movements are either a single card on the step or
a list of `actions`:

```jsonc
// single card
{ "text": "Normal Summon Tearlaments Reinoheart", "type": "normal-summon", "player": 0,
  "card": "p1-card-003", "from": "zone-hand", "to": "zone-m3", "position": "atk" }

// several cards at once (Xyz Summons, multi-card draws, simultaneous summons, swaps)
{ "text": "Opponent: Xyz Summon Officiator of Doom Samuel", "type": "xyz-summon", "player": 1,
  "actions": [
    { "card": "p2-card-010", "from": "zone-extra", "to": "zone-m1", "position": "def" },
    { "card": "p2-card-003", "from": "zone-m1", "to": "material:p2-card-010" },
    { "card": "p2-card-009", "from": "zone-m3", "to": "material:p2-card-010" } ] }
```

| Field | Meaning |
|---|---|
| `text` | Human-readable and generated. It starts with `Opponent: ` when `player` is 1. Display it, but don't parse it: every fact in it is also a field. |
| `type` | What happened; see the table below. |
| `player` | See "Whose step it is". |
| `card`, `from`, `to` | Single-card steps. **`from` is always present.** |
| `actions[]` | `{ card, from, to, position?, controller? }` per card |
| `position` | On summons, Sets and position changes: `atk`, `def`, or `set` (face-down) |
| `controller` | See "Zones and sides" |
| `targets`, `selected`, `choices` | On activations and summons; see "Targets, selections and choices" |

### Step types

| `type` | What happened | Notes |
|---|---|---|
| `turn` | A turn starts | `turn` (1-based) and `player` (the turn player). It implies the Draw Phase. |
| `phase` | The turn player enters a phase | `phase`: `standby`, `main1`, `battle`, `main2` or `end`. Battle Phase steps are merged into one `battle`. |
| `draw` | Card(s) drawn | Draw-phase draws and effect draws alike. The opening hand is never a step. |
| `activate` | A card or effect is activated | See "Activations and chains". `from` is where it was, `to` is where it is after activating: a Spell/Trap from the hand goes `zone-hand` → `zone-sN`. |
| `normal-summon`, `tribute-summon`, `flip-summon` | Those summons | A Tribute Summon is preceded by its `tribute` steps. |
| `special-summon`, `fusion-summon`, `synchro-summon`, `xyz-summon`, `link-summon`, `ritual-summon`, `pendulum-summon` | A monster is Special Summoned | **The kind comes from the monster's card type, not from how it was summoned.** A Link Monster revived from the GY is still `link-summon`, so check `from`. In `xyz-summon`, `actions[0]` is the Xyz Monster and the rest are its materials. |
| `set`, `set-monster` | A Spell/Trap Set, or a monster Set | |
| `tribute` | A monster tributed for a summon | |
| `send-to-gy`, `banish` | To the GY, or banished | Costs, effects, battle, rules (a Normal Spell after it resolves), and Xyz Materials detached (`from: "material:<host>"`) |
| `add-to-hand` | To the hand from anywhere off the field | Searches, GY → hand, … |
| `return-to-hand` | Field → hand | |
| `return-to-extra` | Field → Extra Deck **or Deck** | `to` tells which. |
| `attach-material` | Attached to a monster already on the field | `to: "material:<host>"`. If the host isn't known, `to` falls back to `zone-gy`; this is rare. |
| `cease-to-exist` | A Token leaves the field (or a card leaves the game) | `to: "zone-vanish"` |
| `move` | Any other move | Deck → S/T placement (e.g. Black Whirlwind placed by an effect), GY/banished → Deck, hand → Deck, a control change on the field (`from` may equal `to`, with `controller` set), a monster becoming an Equip, … |
| `swap-control` | Two monsters swap controllers | Two actions; each card goes to the other's zone, with `controller` on whichever isn't with its owner. |
| `attack` | An attack | `card` is the attacker. `target` is the attacked monster's id, absent for a direct attack. |
| `position-change` | A battle-position change | `position` is the new position. |
| `reveal` | Cards shown to the opponent: a cost ("reveal 1 … in your Extra Deck"), an excavation, a card looked at | `from` = `to` = where the card is, and `player` is its owner. A card shown only because it was just added to the hand (a search) gets no step. A cost reveal comes right after its `activate` step, and a summon procedure's reveal right before the summon. |

LP changes and ATK/DEF changes are left out: they follow from the steps.

### Whose step it is (`player`)

| Steps | `player` is |
|---|---|
| `turn`, `phase`, `swap-control` | the turn player |
| `activate` | the player who activated |
| `reveal` | the revealed cards' owner |
| `draw`, `normal-summon`, `tribute-summon`, `flip-summon`, `set`, `set-monster`, `attack`, `position-change` | the player who did it |
| Special Summon types | who controls the monster afterwards: normally the summoner, but the opponent for a summon onto their field |
| All other moves | **whose card it was before the move**, not who caused it. Your effect banishing the opponent's monster is a `banish` step with `player: 1`. |

### Activations and chains

```json
{ "type": "activate", "player": 0, "card": "p1-card-003", "from": "zone-m3", "to": "zone-m3",
  "chainLink": 1, "desc": 77549182910465, "disabled": true }
{ "type": "activate", "player": 1, "card": "p2-card-001", "from": "zone-hand", "to": "zone-s3", "chainLink": 2 }
```

- `chainLink` is the link number in the chain being built. Each new chain restarts at 1. Activation
  steps come in the order the chain was built, and the steps that resolve it follow.
- `desc` says which effect was used. It is the effect's description id, `aux.Stringid(code, n)` =
  `code * 2^20 + n`, **wider than 32 bits**, so use arithmetic, never bitwise operators:
  ```js
  const code = Math.floor(desc / 2 ** 20);  // whose string table: usually the activated card
  const n = desc % 2 ** 20;                 // string index, effect 0, 1, 2, …
  ```
  Compare the whole value against the `desc`/description of the options ocgcore offers in
  `SELECT_IDLECMD` / `SELECT_CHAIN` to pick the same effect. `desc` is absent when the effect has no
  description, which is typical for activating a Spell/Trap card itself.
- `negated: true`: the activation was negated (MSG_CHAIN_NEGATED), for example Herald of Orange
  Light on Pumpking.
- `disabled: true`: the activation stood, but its effect was negated at resolution
  (MSG_CHAIN_DISABLED), for example Infinite Impermanence on Reinoheart.
- In both cases the activation happened and its costs were paid.

### Targets, selections and choices

```json
{ "type": "activate", "player": 1, "card": "p2-card-001", "from": "zone-hand", "to": "zone-s3",
  "chainLink": 2, "targets": ["p1-card-003"] }
{ "type": "activate", "player": 0, "card": "p1-card-010", "from": "zone-m4", "to": "zone-m4",
  "chainLink": 1, "targets": ["p1-card-010"], "choices": [{ "kind": "option", "desc": 27037107486724 }] }
```

All three fields are optional and are omitted when empty. Card ids are mapped with the same
tracker that builds the actions, at the moment the replay names the card.

| Field | Source | Meaning |
|---|---|---|
| `targets` | MSG_BECOME_TARGET | The cards the activation targeted. It's recorded while the link is activated, after its costs. |
| `selected` | MSG_CARD_SELECTED | Cards picked without targeting. On an activation: picked while it was activated (costs such as a discard) or resolved (which card to destroy or send). On a summon: picked for its procedure, outside any chain. |
| `choices` | MSG_HINT, MSG_RANDOM_SELECTED | Answers given while this link was activated or resolved, or for a summon's procedure. In order. |

Each `choices` entry has a `kind`:

| `kind` | Field | Meaning |
|---|---|---|
| `option` | `desc` | The chosen option's description id, encoded like an activation's `desc`. Below 2^20 it is an EDOPro system string: `573` is "Add it to your hand", `574` "Send it to the GY". |
| `card` | `code` | A declared card |
| `number` | `value` | A declared number (a Level, say) |
| `race` | `value` | A declared Type (`RACE_*` bits) |
| `attribute` | `value` | A declared Attribute (`ATTRIBUTE_*` bits) |
| `zone` | `value` | The chosen zone(s) as a field bit mask, as the hint sent it. Whose side the bits count from isn't verified yet. |
| `random` | `cards` | Card ids the engine picked at random (a random discard, say). Nobody chose these, but a replay has to match them. |

Each link's choices are in the order they were made, activation first, then resolution.

Not every answer reaches the replay as a hint. These only exist in `duel.replay.responses`:

- yes/no prompts;
- which card in a Deck or Extra Deck was picked, since a position there can't be mapped to an id (a
  searched card still shows up as the card that moves);
- picks a script doesn't announce with a selection hint.

Re-running the recorded duel recovers them all.

### Player actions and their consequences

Steps record everything that moved, not only player decisions. Costs, effect results and rule moves
are steps too. **There is no field yet that marks a step as a cost or a chain result.** In practice:

- The steps between an `activate` and the next activation or chain resolution are mostly its costs
  (discards, tributes, detached materials).
- After the last activation of a chain, the following steps until the next activation, summon or
  marker are its resolution, in resolution order (last link first).
- A summon `from: "zone-extra"` that isn't inside a chain is a player's summon procedure. Inside a
  chain, it is an effect result.
- `draw` steps right after a `turn` marker are the normal draw.
- An activation's `selected` names the cards its costs and resolution picked, so the steps moving
  those cards next are the consequences of that activation.

## What existing site code assumes that v2 changes

**`scripts/lib/combo-runner.mjs` (verifier)**

- Every `p2-*` card is placed face-down in the opponent's hand. In v2, a p2 card's `zone` is its
  real starting zone (`zone-deck`, `zone-extra`, `zone-hand`), and `decks[1]` is the opponent's full
  Deck.
- The Deck is built from `zone-deck` cards plus filler. Use `decks[p].main` in order instead,
  falling back to the old filler when `decks` or `decks[p]` is missing.
- Rules are inferred (a turn-1 draw or Battle Phase in test hand). Create the duel with
  `duel.flags`, `startLP`, `startHand` and `drawPerTurn` instead, when present.
- Targets and option picks are inferred from later steps. `targets`, `selected` and `choices` give
  them directly. For a full answer key, re-run the recorded duel from `duel.replay`.
- Steps are matched by `text`. In v2, `Opponent: …` steps match `OPPONENT_RE` and are classified
  `opponent-board`, while `turn`/`phase` markers read as narrative. To actually replay, switch on
  `type` and `player` when `formatVersion >= 2`: respond as player 1 to `player: 1` activations, and
  advance phases and turns at the markers. If the first `turn` marker has `player: 1`, player 0 is
  going second.
- The "leading `Draw … to zone-hand` steps start in hand" heuristic has no effect on v2, since the
  first step is always a `turn` marker and opening hands are already `zone-hand`. That's fine.
- The rule that moves `p1-card-*` cards on the field or in the GY into the Deck stays harmless:
  outside puzzles, v2 never gives a card a starting zone on the field or in the GY.

**Viewers: handled since 2026-10-28**

`assets/js/replay-v2.js` holds the v2 rules for the site (browser global `ReplayV2`, also
`require()`-able from Node):

- `combo-system.js` loads it on demand when it meets a v2 combo. `prepareForSimulator()` cuts the
  combo to player 0's first turn and to player 0's half of the board: the opponent's moves become
  log lines and step-list entries tagged "Opponent", a card that crosses to the opponent's half
  goes to the hidden `zone-offside`, and the opening hand gets no dummies. ComboLoader prepares
  the combo once, so the guide and the board show the same steps. A **Full duel** button links to
  the whole duel. The admin audit passes `v2Range: 'all'` so step numbers match the verifier's.
- `Replay-Analyzer.html?duel=<source>&combo=<key>` plays the whole duel in the Replay Browser
  through `toMoveLog()`. `<source>` is a site combo file (`assets/data/combos/…`) or a GCS path
  (`combo-json/…`, `replays_json/…`). A trimmed curated combo can name its full replay in
  `source` (plus `sourceKey`), and the button uses that.
- `node scripts/check-replay-v2.mjs` checks local exports (yrp-private's `synced_by_archetype` by
  default) against this document and runs them through both viewers' preparation.
- `node scripts/import-replay-combo.mjs` turns the exports in yrp-private's `combo_guides` into
  curated combo drafts in `assets/data/combos/v2-drafts/`, with a `REPORT.md`. Drafts have one card
  per step (split steps share `replayStep`) and keep the key of the curated combo they match.
  `dev/v2-draft-preview.html` shows a draft next to the live combo. Nothing on the site reads the
  drafts; adopting one means copying it into the real file.

## Known limitations

- **Only the answers the replay announces are in `choices`** (see "Targets, selections and
  choices"); the rest are only in `duel.replay.responses`.
- **Lasting targets** (MSG_CARD_TARGET: an Equip-like card pointing at a monster for as long as it
  stays) are decoded but not exported.
- **No cost/result tagging** (see above).
- **Tag duels (2 vs 2) aren't tracked.** Hands swapped in from a tag partner get fresh ids.
- In a handful of long full duels the tracker misses a card's arrival somewhere. That card then
  starts in `zone-deck` (9 of 225 local replays, none of them combo guides).
- `title` and `description` are placeholders, and `archetype` is a best guess from player 0's cards.

### Seen in the first export run (check-replay-v2, 224 combos, 2026-10-28)

These differ from what the sections above promise. The viewers cope with all of them.

- **`desc` below 2²⁰** (2, 1068, 1160, 1170, 1171; 171 steps). These are EDOPro system strings, not
  `aux.Stringid(code, n)`, so `Math.floor(desc / 2 ** 20)` gives code 0. `ReplayV2.decodeDesc()`
  returns `{ system }` for them.
- **`decks` missing on 38 combos without `preset` cards**, 27 of which also have an opening hand
  that isn't 5 cards (test-hand replays, apparently). `decks[p]` is `null` on 4 more. *Exports made
  after the first v2 run give test-hand replays `decks` too, checked against their recorded
  decklists. In a local run, 225 of 228 replays had both lists.*
- **Steps before the first `turn` marker** on 3 combos: a skill card (alias code, `Card #…`)
  leaving the Deck by `cease-to-exist` before turn 1.
- **2 combos with no steps at all.**
- **A multi-card `draw` names only the first card in `text`** ("Draw Ancient Gear Castle" for 2
  cards; 193 steps). The viewers write "Draw 2 cards" instead.
- **`from` differs from the tracked zone** 21 times: the missed-arrival case above, in full duels.
- **`controller` also appears on `material:` moves**, when a card is attached to the opponent's
  Xyz Monster. `sideAfter()` covers it as written.
