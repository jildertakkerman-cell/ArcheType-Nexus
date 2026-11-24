# Supabase gameplay tags: reference for the front end

Snapshot of the live database on 2026-11-23: **67 tags, 60 of which have cards**.
Use this file to check the front end against what the database actually holds. Re-run the query at the bottom to refresh the numbers.
The code fixes made on 2026-11-24 are listed under [Gaps and fixes](#gaps-and-fixes).

## How a card gets a tag

```
cards → cardactions → actions → actiontags → tags      (action tags: every tag)
cards → cardtags → tags                               (card-level tags: only "Hand Trap", 225 monster hand traps)
```

- `cardtags` is filled by `populate_monster_hand_traps()` in `yugioh-archetype-db/Database/YuGiOh-Database-main/sql/create_cardtags_handtraps.sql`: monsters with "Quick Effect" in their text, the `Hand Activation` tag and a disruption or draw tag. Mulcharmy Fuwalos, Meowls and Purulia are in it.

- Actions come from Yugipedia's search categories. `actiontags` is rebuilt from `TAG_MAPPINGS` in `yugioh-archetype-db/Database/YuGiOh-Database-main/tags/apply_tags.py` on every run (the table is truncated first).
- Tag names are exact, case-sensitive strings. Note the lowercase "i" in `Trap interaction`.
- Categories are capitalised in the DB: `Combat`, `Consistency`, `Cost`, `Disruption`, `Economy`, `Interaction`, `Mechanics`, `Protection`, `Removal`.

### Read paths and what they return

| Caller | Call | Returns | Includes `cardtags`? |
|---|---|---|---|
| `assets/js/card-browser.js` `loadTags()` | REST embed `cardactions → actions → actiontags → tags`, plus REST `cardtags → tags`, 30 cards per request each | tags plus the action names behind them | Yes, since 2026-11-24 (the second query) |
| `assets/js/card-loader.js` | RPC `get_tags_by_passcode(card_passcode int)` | `tag_name, tag_category`. Adds a pseudo-tag `OCG` (category `Format`) for OCG cards. Skips `Anime Only` cards. | Yes, since 2026-11-24 |
| `assets/js/card-loader.js` | RPC `get_actions_for_card_tag(p_passcode bigint, p_tag_name text)` | `action_name` rows behind one tag. For a card-level tag: one line saying the tag is set on the card | Yes, since 2026-11-24 |
| yrp-private `src/card_tag_service.ts` | RPC `get_card_tags_by_passcodes(passcodes int[])` | `passcode, tagname, tagcategory, cardlevel, cardtype`; also resolves alternate passcodes. `cardtype` is the card frame ("Effect Monster", "Spell Card", "Trap Card"; NULL for some cards) | Yes, since 2026-11-24 |

**Applied 2026-11-24.** `yugioh-archetype-db/Database/YuGiOh-Database-main/rpc/include_cardtags_in_tag_rpcs.sql` added the `cardtags` path to the three RPCs. It also changed the `cardtype` column of `get_card_tags_by_passcodes`: it used to hold `cards.types`, the monster Type ("Zombie", "Spellcaster"), and NULL for Spells and Traps. Checked through the public API afterwards: Ash Blossom, Effect Veiler, Droll & Lock Bird and Mulcharmy Fuwalos all return `Hand Trap`. If any of these functions is redefined, keep the `cardtags` branches (`rpc/fix_security_warnings.sql` no longer redefines `get_card_tags_by_passcodes` for that reason).

## All tags

"Cards" is the number of distinct cards reached through actions. 0 means the tag exists but no card has it.

### Consistency

| Tag | ID | Cards | Meaning (main actions) |
|---|---|---|---|
| Extender | 35 | 5,347 | Special Summons itself or others from hand, Deck, GY or Extra Deck. Very broad: it is not a combo-role judgement. |
| Searcher | 31 | 2,054 | Adds from Deck or Extra Deck to hand |
| Recur | 34 | 1,122 | Adds from GY or banishment back to hand |
| Draw Power | 32 | 1,018 | Draws cards (includes 120 "Your opponent draws cards") |
| Miller | 33 | 800 | Sends from Deck or Extra Deck to GY |

### Economy

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| Foolish | 81 | 610 | Sends from your Deck to your GY (mostly a subset of Miller) |

### Disruption

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| Hand Activation | 43 | 1,572 | Effect used from the hand, including discard-self costs. Much broader than Hand Trap. |
| Negate | 41 | 1,571 | Negates effects, activations or Summons |
| Floodgate | 42 | 980 | Ongoing lock: prevents attacks, activations or Summons |
| Discard | 44 | 166 | Makes the opponent discard, or sends from their hand to the GY |
| Hand Trap | 104 | 46 (+225 in `cardtags`) | Can be activated from the hand. Monster hand traps come from `cardtags`; all read paths include it. |
| Prevent Search | 1619 | 0 | Empty |
| Prevent Draw | 1618 | 0 | Empty |

### Removal

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| Monster Destruction | 64 | 2,074 | Destroys monsters |
| Destruction | 36 | 1,483 | Destroys cards. Noisy: also contains "Sends from field to Graveyard for cost" (341 cards). |
| Spell Destruction | 62 | 1,367 | Destroys Spells |
| Trap Destruction | 63 | 1,301 | Destroys Traps |
| Banishment | 37 | 1,121 | Banishes as an effect (either player's cards, any zone) |
| Send to GY | 40 | 858 | Sends to the GY without destroying (includes the "for cost" variant) |
| Bounce | 38 | 613 | Returns to hand |
| Spin | 39 | 353 | Returns to Deck or Extra Deck |

### Interaction

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| Removal | 72 | 0 | Empty meta-tag. To mean "removal", combine the Removal-category tags above. |

### Combat

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| ATK/DEF Modification | 57 | 1,949 | Changes ATK or DEF |
| Burn | 51 | 997 | Damages the opponent (also counts battle-damage triggers) |
| Self-Burn | 68 | 393 | Pays your own LP (mostly the same cards as LP for Cost) |
| Control Change | 52 | 335 | Takes control of, or steals, opponent's monsters |
| LP Gain | 67 | 268 | Gains LP |
| Multiple Attacks | 53 | 173 | Can attack more than once |
| Battle Phase Control | 55 | 149 | Ends or skips the Battle Phase |
| Direct Attack | 54 | 70 | Can attack directly |
| Flip Control | 56 | 45 | Flips monsters face-down |

### Cost

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| Discard for Cost | 89 | 748 | Discards as a cost |
| LP for Cost | 91 | 416 | Pays LP as a cost |

### Protection

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| Battle Protection | 45 | 877 | Can't be destroyed by battle, or prevents battle damage |
| Destruction Protection | 46 | 781 | Can't be destroyed by effects, or redirects destruction |
| Targeting Protection | 47 | 320 | Can't be targeted |
| Effect Protection | 48 | 221 | Unaffected by effects, or can't be negated |
| Cannot Be Tributed | 49 | 79 | Can't be Tributed |
| Cannot Be Banished | 50 | 9 | Can't be banished |
| Damage Protection | 66 | 0 | Empty |

### Mechanics

| Tag | ID | Cards | Meaning |
|---|---|---|---|
| Activation Requirement | 87 | 5,416 | Mostly "Only once per turn" (5,041). Almost every card has it, so it says little. |
| Special Summon | 80 | 4,091 | Special Summons from hand, GY or Extra Deck |
| Graveyard Trigger | 85 | 3,122 | Works from the GY, or when sent there |
| Summoning Restriction | 1265 | 2,855 | Can't be Normal Summoned or Set; Special Summon locks |
| Activation Trigger | 493 | 2,661 | Triggers on Normal, Special, Synchro or Flip Summon |
| Battle Trigger | 83 | 1,522 | Triggers on battle destruction or battle damage |
| Hand Trigger | 86 | 1,502 | "Activates from your hand" (same main action as Hand Activation) |
| Banishment Cost | 254 | 1,497 | Banishes as a cost (mostly itself from the GY) |
| Tribute | 76 | 1,344 | Tributes as a cost or effect |
| Effect Trigger | 88 | 1,020 | Triggers when destroyed or targeted by an effect |
| Synchro Support | 123 | 1,001 | Synchro Summoning and materials. Noisy: also contains "Banishes from hand for cost" (119) and "Prevents your opponent's monsters from attacking" (97). |
| Fusion Support | 122 | 840 | Fusion Summoning and materials |
| Xyz Support | 58 | 807 | Xyz Summoning, materials and attaching |
| Trap interaction | 73 | 652 | Stops, negates or enables Trap activation |
| Position Change | 79 | 554 | Changes battle positions |
| Level Modulation | 253 | 490 | Gains, loses or changes Levels |
| Activation Condition | 74 | 438 | Needs a specific card on the field |
| Link Support | 1261 | 434 | Link Summoning and materials |
| Equip | 75 | 416 | Equips itself or other cards |
| Counter | 78 | 333 | Places or removes counters (Spell Counter, A-Counter, …). This is not Counter Trap cards. |
| Material Trigger | 84 | 157 | Triggers when used as material |
| Pendulum Support | 59 | 151 | Places cards in the Pendulum Zone |
| Copy Effect | 255 | 52 | Resolves as another card's effect |
| Quick Effect | 61 | 30 | Severely undercounted (only one action is mapped). Don't rely on it. |
| Non-Respondable | 252 | 0 | Empty |
| Stacking | 77 | 0 | Empty |
| Tribute Effects | 60 | 0 | Empty legacy tag, merged into `Tribute` |

## Gaps and fixes

Found on 2026-11-23, fixed in code on 2026-11-24. Re-check against the current code before relying on a line here.

### Status

- **Database:** the RPC change was applied on 2026-11-24 (see the read-path table above).
- **yrp-private:** commit 0fbc552 was deployed to Cloud Run on 2026-11-24 (revision yrp-00080-htt). A live `/analyze` test counted Mulcharmy, Ash Blossom and Droll & Lock Bird as hand traps (the last two by their alternate-art passcodes), and every tag in the breakdown came back with its category.
- **Still open:** the escaped action names (section 4) are still stored that way in the database; the client decodes them.

### 1. Names the code used that are not tags

| Name | Where | Now |
|---|---|---|
| `Starter` | yrp-private `hand_analyzer.ts`; Nexus `replay-analyzer.js` | A role the hand analyzer works out (`Searcher` or `Draw Power`; a Spell or a monster of Level 4 or lower; not a `Hand Trap`). It goes in `tagBreakdown` and `cardsByTag` under this key. |
| `Board Breaker` | same | A worked-out role: any of the eight Removal-category tags. Its count, `cardsByTag['Board Breaker']` and the replay page's highlight are now the same set of cards. Before, the count was always 0 while the highlight showed every Destruction card. |
| `Combo Piece` | `hand_analyzer.ts` | Removed. The penalty that used it never applied. |
| `Special Summon from Hand`, `Special Summon from Deck`, `Token` | `hand_analyzer.ts` | Removed. They never matched, so a Starter was already just "searches or draws". |
| `Draw`, `Search` | `hand_analyzer.ts`, `replay-analyzer.js` | Now `Draw Power` and `Searcher`. |
| `Banish`, `Kaiju`, `Lava Golem` | `replay-analyzer.js` | Removed; the highlight reads `cardsByTag` by its own key. |
| `Removal` | `hand_analyzer.ts` | Replaced by the eight Removal-category tags (`REMOVAL_TAGS` in `card_tag_service.ts`). |
| `Prevent Search` | `hand_analyzer.ts` | Kept: the tag exists, but no card has it yet. |

yrp-private's `docs/frontend-tag-integration.md` has been updated to match.

### 2. Substring matching in yrp-private

`hasTag()` matched with a case-insensitive `includes`, so `Destruction` also hit Destruction Protection and `Banishment` also hit Banishment Cost (1,497 cards, mostly self-banish from the GY). Going-second "removal" therefore counted almost any card with a GY effect. `hasTag()` now matches exact names; `hasAnyTag()` takes a list.

### 3. Tags the card browser's curated lists leave out

`Hand Trap` is now first in `TILE_ROLES` and in `QUICK_ROLES` after `Negate`. The other 28 tags with cards are still in neither list; they appear under "All tags". Candidates if a tile role is ever wanted: Counter, Level Modulation, Battle Phase Control, Equip, LP Gain, Flip Control.

`CATEGORY_ORDER` covers all nine DB categories. Its `timing` entry is unused, since no tag has that category.

### 4. Escaped action names

14 action names still contain Yugipedia URL escapes: `-2D` stands for `-` and `-2F` stands for `/` ("Flips monsters face-2Ddown", "Goes to S-2FT Zone"; 132 card links). `decodeActionName()` in `card-loader.js` fixes them in the tag-actions popup, and `card-browser.js` does the same for its action list.

### 5. Category lookups in the front end

`KNOWN_TAG_CATEGORIES` in `card-loader.js` had drifted: `LP Gain` was under Mechanics (DB: Combat), 5 entries were not tags (Discard Cost, Banish for Cost, Banish, Cost, Summoning Trigger), and 9 tags with cards were missing (Hand Trap, Summoning Restriction, Activation Trigger, Banishment Cost, Fusion/Synchro/Link Support, Level Modulation, Copy Effect). It took priority over the database category. In the replay analyzer's tag breakdown and the tag-actions popup header it was the only source, so those 9 tags showed under "Default" in grey.

Now the map is an exact copy of the `tags` table (67 entries, checked against the live table on 2026-11-24). `tagCategoryKey(name, dbCategory)` puts the database category first everywhere. The popup header takes the colour of the pill that was clicked. The replay analyzer reads `tagCategories` from the hand analysis when the backend sends it. **When a tag is added to the database, add it to `KNOWN_TAG_CATEGORIES` too.**

### 6. Hand-trap badge in the card popup

The badge needed `Hand Activation` plus an action matching "discard this card" or "send this card from your hand to the gy". The real action names are "Discards itself for cost" and "Sends itself from hand to Graveyard for cost", so it only ever showed for Mulcharmy cards (matched by name). The matching could not simply be repaired either: Fiendsmith Engraver has the same two actions as Ash Blossom. The badge now follows the database's `Hand Trap` tag, and the extra `get_actions_for_card_tag` call per popup is gone.

### 7. Hand analyzer scoring (yrp-private)

- **Starter Level check never ran.** `isStarter()` looked for "Monster" in the RPC's `cardtype`, which held the monster Type. Any monster that searched or drew counted at any Level, and Spellcaster monsters passed the check meant for Spell cards. `cardKind()` now reads YGOProDeck's type first, then the card frame, then "has a Level".
- **The going-second block ran twice**, doubling the removal and Special Summon bonuses. It now runs once.
- **Hand-trap count** comes from the `Hand Trap` tag only. Since the database change it includes the monster hand traps.

## Refresh query

```sql
SELECT t.tagid, t.tagname, t.tagcategory,
       COUNT(DISTINCT ca.cardid) AS cards_via_actions,
       (SELECT COUNT(*) FROM cardtags ct WHERE ct.tagid = t.tagid) AS cards_via_cardtags
FROM tags t
LEFT JOIN actiontags at ON at.tagid = t.tagid
LEFT JOIN cardactions ca ON ca.actionid = at.actionid
GROUP BY t.tagid, t.tagname, t.tagcategory
ORDER BY t.tagcategory, cards_via_actions DESC;
```
