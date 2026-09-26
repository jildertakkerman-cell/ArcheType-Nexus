/**
 * cross-engine-data.js — content for cross-archetype ("dual-support") releases,
 * rendered by cross-engine-support.js.
 *
 * Each release is one entry. Card facts (stats, effects, official text) live
 * once under `cards` so every page that renders them stays in sync; each
 * archetype's angle on the release lives under `perspectives[<archetype>]`.
 * `burst` is shared by all perspectives.
 *
 * Inline markup in prose fields (text is escaped before this is applied):
 *   [[Card Name]]  -> card reference that opens the CardLoader popup
 *   **bold**       -> <strong>
 *   *italic*       -> <em>
 * `officialText` is rendered verbatim, without markup.
 *
 * Card names must match the card database exactly (they drive image lookup).
 */
(function () {
    'use strict';

    window.CrossEngineData = window.CrossEngineData || {};

    window.CrossEngineData['beyond-the-brave'] = {
        set: {
            name: `Beyond the Brave`,
            code: `BETB`,
            ocgDate: `2026-07-18`,
            tcgDate: `2026-10-08`
        },

        cards: {
            unity: {
                name: `Black Skull Dragon, the Archfiend of Unity`,
                archetype: `Archfiend`,
                frame: `effect`,
                statline: [`Level 9`, `DARK`, `Dragon`, `Effect`],
                atk: 3200,
                def: 2500,
                summon: `Main Deck, but it cannot be Normal Summoned/Set. Only its own effect can Special Summon it.`,
                effects: [
                    {
                        tag: `Summon`,
                        label: `Quick Effect · once per turn`,
                        text: `From your hand, discard 1 Quick-Play or Ritual Spell: Special Summon it in Defense Position, during either player's turn.`
                    },
                    {
                        tag: `Trigger`,
                        label: `If Special Summoned`,
                        text: `Set 1 Spell/Trap that mentions [[Light and Darkness Ritual]] from your Deck or GY.`
                    },
                    {
                        tag: `Battle`,
                        label: `Start of the Battle Phase`,
                        text: `Your opponent loses 800 LP and this card gains 800 ATK, up to **4000 ATK**.`
                    }
                ],
                facts: [
                    `An **“Archfiend”** card (JP: デーモン), so every Archfiend searcher can add it. It is **not** a “Red-Eyes” card: [[Black Metal Dragon]] can't search it.`,
                    `Its text names [[Light and Darkness Ritual]], which makes it a *monster that mentions* the Ritual. That opens up [[Mind Shuffle]], [[Ragged Records of Rites]] and [[Chaos Mystic Box]].`,
                    `Only the summon is once per turn. The Set trigger and the LP drain have no once-per-turn clause.`,
                    `A card it Sets follows normal rules and can't be activated the turn it is Set.`
                ],
                officialText: `Cannot be Normal Summoned/Set. Must be Special Summoned by its own effect. If this card is in your hand (Quick Effect): You can discard 1 Quick-Play or Ritual Spell; Special Summon this card in Defense Position. You can only use this effect of "Black Skull Dragon, the Archfiend of Unity" once per turn. If this card is Special Summoned: You can Set 1 Spell/Trap that mentions "Light and Darkness Ritual" from your Deck or GY. At the start of the Battle Phase: You can make your opponent lose 800 LP, and if you do, this card gains 800 ATK.`
            },

            exceed: {
                name: `Red-Eyes Black Dragon Exceed`,
                archetype: `Red-Eyes`,
                frame: `fusion`,
                statline: [`Level 9`, `DARK`, `Dragon`, `Fusion`],
                atk: 3400,
                def: 3000,
                summon: `“Red-Eyes Black Dragon” + 1 monster that mentions “Dark Time Wizard”.`,
                effects: [
                    {
                        tag: `Procedure`,
                        label: `Summon procedure · starts no chain`,
                        text: `During a turn a monster was destroyed by [[Dark Time Wizard]], Tribute 1 face-up monster on **either** field (in your Main Phase) to Special Summon it from the Extra Deck. It can also be Fusion Summoned. Hard cap: one Exceed per turn, whichever method you use.`
                    },
                    {
                        tag: `Protection`,
                        label: `Continuous`,
                        text: `Unaffected by your opponent's activated Spell and monster effects.`
                    },
                    {
                        tag: `Trigger`,
                        label: `If Special Summoned`,
                        text: `Special Summon 1 Level 8 or lower monster from your hand or GY.`
                    }
                ],
                facts: [
                    `A **“Red-Eyes”** monster that lists [[Red-Eyes Black Dragon]] as material.`,
                    `The Tribute isn't an activated effect and targets nothing. Tributing your opponent's monster is removal that gets around targeting and destruction protection.`,
                    `Only its own procedures can summon it. Once it leaves the field, it can't be revived.`,
                    `The immunity covers *activated Spells and monster effects* only. Traps and continuous effects (e.g. Skill Drain) still apply.`
                ],
                officialText: `"Red-Eyes Black Dragon" + 1 monster that mentions "Dark Time Wizard"\nMust be either Fusion Summoned, or Special Summoned (from your Extra Deck) by Tributing 1 face-up monster on either field during the turn a monster was destroyed by the effect of "Dark Time Wizard". You can only Special Summon "Red-Eyes Black Dragon Exceed" once per turn this way, no matter which method you use. Unaffected by your opponent's activated Spell or monster effects. If this card is Special Summoned: You can Special Summon 1 Level 8 or lower monster from your hand or GY.`
            },

            /* Light and Darkness Ritual support from the same set. Only the
               Light and Darkness perspective shows it, as Unity's partner. */
            sword: {
                name: `Spell Shattering Sword`,
                archetype: `Light and Darkness Ritual`,
                frame: `spell`,
                statline: [`Spell`, `Quick-Play`],
                summon: `A Quick-Play Spell that mentions [[Light and Darkness Ritual]]. [[Griffoh]] can Set it from the Deck and lets you activate it the same turn.`,
                effects: [
                    {
                        tag: `Mode 1`,
                        label: `On activation · pick one mode`,
                        text: `Destroy every face-up Spell your opponent controls: Field Spells, Continuous and Equip Spells, and Pendulum Scales.`
                    },
                    {
                        tag: `Mode 2`,
                        label: `On activation · targets`,
                        text: `Target 1 face-up monster your opponent controls and show [[Light and Darkness Ritual]] from your hand or GY: that monster's ATK becomes 0 and its effects are negated. The text gives no end point, so it lasts while the monster stays face-up.`
                    },
                    {
                        tag: `Float`,
                        label: `If an opponent's card destroys it`,
                        text: `Destroy 1 card in your opponent's hand, at random, or on their field.`
                    }
                ],
                facts: [
                    `The first card in the Light and Darkness engine that **negates**. Chained to an effect a face-up monster activates, it negates that effect, the same way [[Infinite Impermanence]] does.`,
                    `Mode 2 needs a face-up monster, so hand traps, Graveyard effects and Traps are out of its reach.`,
                    `Hard once per turn: you can only activate one copy per turn. The float isn't an activation, so it still works that turn.`,
                    `Its own text spells the name "Spell-Shattering Sword". This page uses the card database name until the TCG print confirms it.`
                ],
                officialText: `Activate 1 of these effects;\n● Destroy all face-up Spells your opponent controls.\n● Target 1 face-up monster your opponent controls; show 1 "Light and Darkness Ritual" in your hand or GY, then that monster's ATK becomes 0, also its effects are negated.\nIf this card in its owner's possession is destroyed by an opponent's card: You can destroy 1 card in your opponent's hand (at random) or their field. You can only activate 1 "Spell-Shattering Sword" per turn.`
            },

            dtw: {
                name: `Dark Time Wizard`,
                typeLine: `Quick-Play Spell`,
                summary: `Choose one mode (each once per turn). **Search:** add any card that mentions it, and a copy returns from the GY in the End Phase. **Coin toss:** call it right to wipe your opponent's monsters and burn half their original ATK; call it wrong to wipe your own.`
            }
        },

        /* Shared by every perspective: the combined OTK when both halves meet. */
        burst: {
            title: `Cross-Engine Burst: the combined OTK`,
            intro: `A Red-Eyes / Dark Time Wizard shell with Unity as tech can deal 8,000 in a single turn through an established board. Best case:`,
            assumptions: [
                `You call the coin toss right, and your opponent's monsters had **4,000** combined original ATK.`,
                `Unity was Special Summoned during your opponent's turn. It entered in Defense Position and can't change position the turn it is summoned.`,
                `You have a spare face-up monster of your own to Tribute for Exceed, since the toss already cleared your opponent's side.`
            ],
            lp: 8000,
            series: {
                redeyes: { label: `Red-Eyes / Dark Time Wizard`, color: `#ea580c` },
                unity: { label: `Archfiend of Unity`, color: `#8b5cf6` }
            },
            steps: [
                { series: `redeyes`, label: `Dark Time Wizard burn`, value: 2000, note: `Half of 4,000 destroyed ATK` },
                { series: `redeyes`, label: `Exceed attacks directly`, value: 3400, note: `3400 ATK, immune to activated Spells and monster effects` },
                { series: `unity`, label: `Unity's Battle Phase drain`, value: 800, note: `Also pushes it to 4000 ATK` },
                { series: `unity`, label: `Unity attacks directly`, value: 4000, note: `Switched to Attack Position this turn` }
            ]
        },

        perspectives: {
            archfiend: {
                theme: `archfiend`,
                kicker: `New Support · Cross-Engine`,
                title: `Black Skull Dragon, the Archfiend of Unity`,
                lede: `The original Black Skull Dragon fused Summoned Skull, an Archfiend, with Red-Eyes Black Dragon. Its retrain goes in the Main Deck: a Level 9 DARK Dragon that Archfiends can search. It costs a Ritual Spell your deck already plays, and it plugs straight into the Light and Darkness engine from the Chaos Bridge build.`,
                primary: `unity`,
                partner: `exceed`,
                partnerNote: `Its partner card from the same set. The Extra Deck half of the bridge is below, along with how Archfiends can splash it.`,
                teaser: {
                    title: `New: Black Skull Dragon, the Archfiend of Unity`,
                    text: `Beyond the Brave prints a searchable Level 9 Archfiend that turns your spare Ritual Spells into a 3200-ATK body. It bridges the Archfiend engine to Light and Darkness and to Red-Eyes.`,
                    cta: `Open the Cross-Engine tab`
                },
                bridge: {
                    title: `How the engines connect`,
                    left: {
                        title: `Archfiend Court`,
                        caption: `Can search it, since it is an “Archfiend” card`,
                        cards: [`Royal Archfiend`, `Archfiend Heiress`, `Archfiend Strategy`, `Archfiend's Fervor`, `Matador Archfiend`]
                    },
                    right: {
                        title: `Light & Darkness Ritual`,
                        caption: `Can search, summon or recover it, since it mentions the Ritual`,
                        cards: [`Mind Shuffle`, `Ragged Records of Rites`, `Chaos Mystic Box`, `Light and Darkness Ritual`]
                    },
                    footer: `**Link to Red-Eyes:** [[Dark Time Wizard]] and [[Sleepy Scapegoats]] are Quick-Play Spells, so the Joey engine that powers [[Red-Eyes Black Dragon Exceed]] also pays Unity's discard cost.`
                },
                synergy: {
                    title: `Discard fodder that pays you back`,
                    intro: `Unity's cost is a Quick-Play or Ritual Spell. Every Ritual Spell in the Archfiend pool has a Graveyard effect, so discarding one loads value instead of losing a card.`,
                    columns: [`Discard`, `Type`, `What you get back`],
                    rows: [
                        [`[[Ritual of the Matador]]`, `Ritual Spell`, `Banish it from the GY to Special Summon 1 non-Ritual “Archfiend” monster from your hand.`],
                        [`[[Throne of the Archfiends]]`, `Ritual Spell`, `Returns to hand from the GY or banishment in the Standby Phase while [[Archfiend Emperor]] is face-up in your Extra Deck.`],
                        [`[[Light and Darkness Ritual]]`, `Ritual Spell`, `From the GY, add it plus 1 card that mentions it back to hand. Unity counts as one of those cards.`],
                        [`[[Chaos Mystic Box]] / [[Chaos Magical Hats]]`, `Quick-Play`, `Both mention Light and Darkness Ritual, so Unity's trigger Sets the discarded copy right back from the GY. The summon costs no cards.`],
                        [`[[Archfiend's Usurpation]] (extra copy)`, `Quick-Play`, `You can only activate one per turn, so a second copy is a dead draw. Unity turns it into a 3200-ATK body.`]
                    ]
                },
                combo: {
                    title: `Line: Court search → Unity → Chaos Bridge backrow`,
                    note: `Unity enters in Defense Position and can't change position the turn it is summoned. To attack with it, summon it during your opponent's turn; the End Phase is ideal.`,
                    steps: [
                        {
                            card: `Royal Archfiend`,
                            title: `Search the bridge`,
                            text: `Tribute [[Royal Archfiend]] from your hand to add Unity. Royal's lock only restricts the **Extra Deck**, so Unity, a Main Deck monster, is unaffected. [[Archfiend Heiress]], [[Archfiend Strategy]] and [[Matador Archfiend]] can search it the same way.`
                        },
                        {
                            card: `Ritual of the Matador`,
                            title: `Pay with a Ritual Spell`,
                            text: `Discard [[Ritual of the Matador]] and Special Summon Unity in Defense Position. It is a Quick Effect, so you can also hold it for your opponent's turn.`
                        },
                        {
                            card: `Mind Shuffle`,
                            title: `Set the backrow`,
                            text: `Unity's trigger Sets [[Mind Shuffle]] from the Deck. You can't activate it this turn, but it is live on your opponent's turn.`
                        },
                        {
                            card: `Duke Archfiend`,
                            title: `Cash in the discard`,
                            text: `Banish Ritual of the Matador from the GY to Special Summon a non-Ritual “Archfiend” from your hand, e.g. [[Duke Archfiend]], and continue into your usual Ritual line.`
                        },
                        {
                            card: `Skull Archfiend of Chaos`,
                            title: `Opponent's turn: shuffle`,
                            text: `When your opponent activates a card or effect, use Mind Shuffle: return Unity (Level 9) to your hand and Special Summon a different monster that mentions Light and Darkness Ritual from your hand, e.g. [[Skull Archfiend of Chaos]], ignoring its Summoning conditions. Unity is back in hand, and re-summoning it next turn fires its Set trigger again.`
                        }
                    ]
                },
                deck: {
                    title: `Deck profile: Unity in an Archfiend build`,
                    groups: [
                        {
                            title: `Add`,
                            rows: [
                                { card: `Black Skull Dragon, the Archfiend of Unity`, count: `1–2`, role: `Searchable extender and Chaos Bridge piece.` },
                                { card: `Ragged Records of Rites`, count: `0–1`, role: `Flex. Reveal Light and Darkness Ritual to add Unity or any monster that mentions it.` }
                            ]
                        },
                        {
                            title: `Fodder already in the deck`,
                            rows: [
                                { card: `Throne of the Archfiends`, count: `—`, role: `Ritual Spell that recurs in the Standby Phase.` },
                                { card: `Ritual of the Matador`, count: `—`, role: `Ritual Spell. Banish it from the GY to summon a non-Ritual Archfiend.` },
                                { card: `Archfiend's Usurpation`, count: `—`, role: `Quick-Play. Extra copies become fodder.` }
                            ]
                        },
                        {
                            title: `Optional splash: Dark Time Wizard package`,
                            rows: [
                                { card: `Dark Time Wizard`, count: `3`, role: `Search or coin-toss wipe, and Unity fodder as well.` },
                                { card: `Foolish Graverobber`, count: `1`, role: `The package's search target outside a Joey deck.` },
                                { card: `Red-Eyes Black Dragon Exceed`, count: `1 (ED)`, role: `The procedure needs no Red-Eyes Black Dragon: any monster destroyed by Dark Time Wizard, plus 1 Tribute.` }
                            ]
                        }
                    ],
                    note: `Don't use Royal Archfiend's search on a turn you want Exceed. Its lock only allows “Archfiend” monsters from the Extra Deck.`
                },
                verdict: {
                    title: `Verdict`,
                    headline: `Strong tech for Archfiend; rogue tier as a shared engine`,
                    ratings: [
                        { label: `Archetype fit`, value: 5, note: `Every Archfiend searcher finds it, and every Archfiend Ritual Spell is fodder that pays you back.` },
                        { label: `Consistency`, value: 4, note: `Needs a Quick-Play or Ritual Spell in hand, and the summon is hard once per turn.` },
                        { label: `Raw power`, value: 3, note: `A 3200/4000 beater plus one Set. No negation.` }
                    ],
                    text: `Community consensus puts the Beyond the Brave cross-engine at rogue to mid tier. It's fun and fair, but too coin-dependent for top tables. Unity is the exception for Archfiend: it needs no coin toss, and the deck already plays its fodder, so it earns 1–2 slots, especially in the Chaos Bridge build.`,
                    watchouts: [
                        `**Summoning condition:** only its own effect, or effects that ignore Summoning conditions (Mind Shuffle, Chaos Mystic Box), can put it on the field. It can't be revived.`,
                        `**Level 9:** it can't be used for a Rank 7 or Rank 8. In the Extra Deck it is only useful as Link material.`,
                        `**Interaction:** [[Infinite Impermanence]] and [[Effect Veiler]] can stop its Set trigger on the field. [[Ash Blossom & Joyous Spring]] can't, because Setting isn't adding, sending or summoning.`,
                        `**Position:** it enters in Defense Position. Summon it on your opponent's turn if it needs to attack on yours.`
                    ]
                }
            },

            'red-eyes': {
                theme: `red-eyes`,
                kicker: `New Support · Cross-Engine`,
                title: `Red-Eyes Black Dragon Exceed`,
                lede: `Red-Eyes finally gets a Fusion boss that skips Red-Eyes Fusion. Exceed comes straight out of the Extra Deck whenever Dark Time Wizard destroys a monster. Win or lose the coin toss, you end up with a 3400-ATK dragon that ignores your opponent's activated Spells and monster effects.`,
                primary: `exceed`,
                partner: `unity`,
                partnerNote: `Its partner card from the same set. Dark Time Wizard's Quick-Plays pay its discard cost, so it slots into the same shell.`,
                teaser: {
                    title: `New: Red-Eyes Black Dragon Exceed`,
                    text: `Beyond the Brave gives Red-Eyes a 3400-ATK Fusion boss you can summon without Red-Eyes Fusion, plus a cross-engine partner, Black Skull Dragon, the Archfiend of Unity.`,
                    cta: `Jump to the new-support analysis`
                },
                enabler: `dtw`,
                bridge: {
                    title: `How the engines connect`,
                    left: {
                        title: `Red-Eyes Core`,
                        caption: `Supplies material and revival targets`,
                        cards: [`Red-Eyes Black Dragon`, `Black Metal Dragon`, `Red-Eyes Insight`]
                    },
                    right: {
                        title: `Dark Time Wizard Engine`,
                        caption: `Unlocks the procedure and supplies the second material`,
                        cards: [`Dark Time Wizard`, `Swiftwind Panther Warrior`, `Alligator's Dragon Knight`, `Jinzo - Energy Shocker`, `Foolish Graverobber`]
                    },
                    footer: `**Link to Archfiend:** [[Black Skull Dragon, the Archfiend of Unity]] discards a Quick-Play or Ritual Spell to summon itself. Dark Time Wizard and [[Sleepy Scapegoats]] are Quick-Plays, so this shell already runs its fodder.`
                },
                synergy: {
                    title: `Exceed revival targets`,
                    intro: `On any Special Summon, Exceed brings back a Level 8 or lower monster from your hand or GY. Ranked by how much each one adds:`,
                    columns: [`Target`, `Level`, `Why it's worth it`],
                    rows: [
                        [`[[Jinzo - Energy Shocker]]`, `7 · Machine`, `Destroys your opponent's Traps on summon. Exceed's text mentions Dark Time Wizard, so while Exceed is on your field your opponent can't activate Traps at all. That closes the one gap in Exceed's immunity.`],
                        [`[[Red-Eyes Black Dragon]]`, `7 · Normal`, `A second Level 7 body. Pair it with another Level 7 for [[Red-Eyes Flare Metal Dragon]] (Rank 7).`],
                        [`[[Alligator's Dragon Knight]]`, `5 · Dragon`, `If its search is still unused this turn, reviving it adds up to 2 Dark Time Wizard Spells/Traps (then you discard 1).`],
                        [`[[Black Metal Dragon]]`, `1 · Dragon`, `Instant Link material. Sending it from the field to the GY again searches another “Red-Eyes” card.`],
                        [`[[Red-Eyes Darkness Metal Dragon]]`, `10 · Dragon`, `**Not a target.** It's Level 10, too high for Exceed. A common misread.`]
                    ]
                },
                combo: {
                    title: `Line: Dark Time Wizard → Exceed (win or lose the toss)`,
                    note: `Exceed's procedure only works in your own Main Phase. A coin toss during your opponent's turn is disruption only.`,
                    branchLabel: `Coin toss result`,
                    branches: [
                        { key: `heads`, label: `Heads: called right` },
                        { key: `tails`, label: `Tails: called wrong` }
                    ],
                    steps: [
                        {
                            card: `Black Metal Dragon`,
                            title: `Stock the GY`,
                            text: `Normal Summon [[Black Metal Dragon]] and Link it into [[Striker Dragon]], as in the core line above. Its GY trigger adds [[Red-Eyes Insight]], which sends [[Red-Eyes Black Dragon]] from the Deck to the GY as a revival target.`
                        },
                        {
                            card: `Dark Time Wizard`,
                            title: `Flip the coin in your Main Phase`,
                            branches: {
                                heads: `Called right: destroy as many of your opponent's monsters as possible, then burn them for half of those monsters' combined original ATK.`,
                                tails: `Called wrong: every monster you control is destroyed. That still counts as a monster destroyed by Dark Time Wizard, so Exceed is still unlocked.`
                            }
                        },
                        {
                            card: `Red-Eyes Black Dragon Exceed`,
                            title: `Procedure summon, no chain`,
                            branches: {
                                heads: `Tribute a spare face-up monster to summon Exceed from the Extra Deck. That can be a survivor on your opponent's side (anything that dodged destruction) or a body of your own.`,
                                tails: `Tribute your opponent's best monster to summon Exceed. It isn't targeted and isn't destroyed, so most protection doesn't help it, and Exceed replaces your lost board.`
                            }
                        },
                        {
                            card: `Jinzo - Energy Shocker`,
                            title: `Revive and lock`,
                            text: `Exceed's trigger Special Summons a Level 8 or lower monster from your hand or GY. [[Jinzo - Energy Shocker]] is the best pick if you have it: it destroys your opponent's Traps, and with Exceed on your field they can't activate Traps. Otherwise, bring back [[Red-Eyes Black Dragon]].`
                        }
                    ]
                },
                deck: {
                    title: `Deck profile: Red-Eyes × Dark Time Wizard`,
                    groups: [
                        {
                            title: `Red-Eyes core`,
                            rows: [
                                { card: `Black Metal Dragon`, count: `3`, role: `Searches any “Red-Eyes” card with no once-per-turn limit. Also a revival target.` },
                                { card: `Red-Eyes Insight`, count: `2–3`, role: `Dumps Red-Eyes Black Dragon and searches your Spell/Trap line.` },
                                { card: `Red-Eyes Black Dragon`, count: `1–2`, role: `Fusion material and Exceed's go-to revival.` }
                            ]
                        },
                        {
                            title: `Dark Time Wizard engine`,
                            rows: [
                                { card: `Dark Time Wizard`, count: `3`, role: `Search mode or coin-toss wipe. It recycles itself in the End Phase.` },
                                { card: `Swiftwind Panther Warrior`, count: `1–3`, role: `Tribute a monster to Special Summon any Dark Time Wizard monster from the Deck.` },
                                { card: `Alligator's Dragon Knight`, count: `1–2`, role: `Summons itself and adds 2 Dark Time Wizard Spells/Traps.` },
                                { card: `Jinzo - Energy Shocker`, count: `1`, role: `Trap lock alongside Exceed.` },
                                { card: `Foolish Graverobber`, count: `1`, role: `Mills a Dark Time Wizard card, then revives a monster from either GY.` }
                            ]
                        },
                        {
                            title: `Extra Deck & cross-engine tech`,
                            rows: [
                                { card: `Red-Eyes Black Dragon Exceed`, count: `1 (ED)`, role: `The boss. Only one can be summoned per turn, so a single copy is enough.` },
                                { card: `Black Skull Dragon, the Archfiend of Unity`, count: `1–2`, role: `Discards a spare Dark Time Wizard or Sleepy Scapegoats to become a 3200-ATK body on either turn.` },
                                { card: `Sleepy Scapegoats`, count: `0–2`, role: `Flex. Four bodies to Tribute; its Extra Deck lock still allows Fusion Monsters like Exceed.` }
                            ]
                        }
                    ],
                    note: `[[Red-Eyes Fusion]] can summon Exceed with Deck materials, but it stops you from making any other summon that turn, which blanks Exceed's revival. Treat it as a fallback, not a route.`
                },
                verdict: {
                    title: `Verdict`,
                    headline: `The boss Red-Eyes Fusion never gave it, at the price of a coin-flip engine`,
                    ratings: [
                        { label: `Archetype fit`, value: 4, note: `A true “Red-Eyes” boss, but it costs Dark Time Wizard slots.` },
                        { label: `Consistency`, value: 3, note: `Either toss result unlocks it; drawing Dark Time Wizard is the bottleneck.` },
                        { label: `Raw power`, value: 4, note: `3400 ATK, near-immune, removal that ignores protection, and a revival.` }
                    ],
                    text: `Community consensus rates the engine rogue to mid tier, too exposed to the coin toss for top-tier play. Still, it is the cleanest bridge from Red-Eyes starters to a real boss since Black Metal Dragon, and it wins games going second.`,
                    watchouts: [
                        `**Once per turn:** one Exceed Special Summon per turn by either method, and it can't be revived once it leaves the field.`,
                        `**Blind spots:** Traps ([[Infinite Impermanence]], [[Solemn Strike]]) and continuous effects (Skill Drain) still land. Aim to revive Jinzo - Energy Shocker.`,
                        `**No destruction, no Exceed:** if Dark Time Wizard is negated before anything is destroyed, the procedure never unlocks.`,
                        `**Revival range:** Level 8 or lower only, so [[Red-Eyes Darkness Metal Dragon]] (Level 10) is out.`
                    ]
                }
            },

            /* The Light and Darkness Ritual page's view: Unity as engine support,
               paired with Spell Shattering Sword from the same set. Every step
               was checked against the printed text of each card in it. */
            'light-and-darkness': {
                theme: `light-darkness`,
                kicker: `Beyond the Brave · New Support`,
                title: `Black Skull Dragon & Spell Shattering Sword`,
                lede: `Beyond the Brave gives the Light and Darkness engine the two things it lacked: a card that negates, and a body that arrives at Quick-Effect speed. Black Skull Dragon, the Archfiend of Unity mentions the Ritual, so Mind Shuffle, Ragged Records and the Ritual's refill all find it, and every time it's Special Summoned it Sets a Spell/Trap that mentions the Ritual. Spell Shattering Sword is the best thing to Set: a Quick-Play that zeroes and negates a monster, or clears every face-up Spell.`,
                primary: `unity`,
                partner: `sword`,
                partnerNote: `A Light and Darkness card from the same set, and the best card for Black Skull Dragon to Set.`,
                showBurst: false,
                teaser: {
                    title: `New: Black Skull Dragon & Spell Shattering Sword`,
                    text: `Beyond the Brave adds the engine's first negate and a Quick-Effect Level 9 that Sets it.`,
                    cta: `Open the Beyond the Brave tab`
                },
                bridge: {
                    title: `How Black Skull Dragon plugs in`,
                    left: {
                        title: `Finds or summons it`,
                        caption: `It mentions Light and Darkness Ritual, so the engine treats it as one of its own`,
                        cards: [`Mind Shuffle`, `Ragged Records of Rites`, `Light and Darkness Ritual`, `Chaos Mystic Box`]
                    },
                    right: {
                        title: `It Sets`,
                        caption: `Any Spell/Trap that mentions the Ritual, from the Deck or GY, every time it's Special Summoned`,
                        cards: [`Spell Shattering Sword`, `Chaos Magical Hats`, `Chaos Mystic Box`, `Mind Shuffle`]
                    },
                    footer: `**Also an “Archfiend” card:** Archfiend searchers such as [[Royal Archfiend]] and [[Archfiend Heiress]] can add it, which is how the Archfiend page's Chaos Bridge build uses it.`
                },
                synergy: {
                    title: `Pay, Set, repeat`,
                    intro: `Black Skull Dragon's summon costs a Quick-Play or Ritual Spell, and its trigger Sets a Spell/Trap that mentions the Ritual. In this deck the two ends meet, so the summon rarely costs a card.`,
                    columns: [`Discard`, `Net`, `What happens next`],
                    rows: [
                        [`[[Light and Darkness Ritual]]`, `+1 Set card`, `It lands in the GY, where its refill works, Black Chaos is protected and the Sword can show it. The trigger Sets Spell Shattering Sword or Mind Shuffle from the Deck.`],
                        [`[[Spell Shattering Sword]]`, `Free body`, `The trigger Sets the same Sword back from the GY, so the 3200-ATK dragon costs nothing. The Sword can't be activated until your next turn.`],
                        [`[[Chaos Magical Hats]] / [[Chaos Mystic Box]]`, `Free body`, `Same trick: discard one and Set it back from the GY.`],
                        [`[[Called by the Grave]] or another generic Quick-Play`, `Even trade`, `It pays the cost, but nothing brings it back. Set a Sword from the Deck instead.`]
                    ]
                },
                combo: {
                    title: `Line: Black Chaos + Black Skull Dragon (going first)`,
                    intro: `This is Line 4 in the combo simulator below.`,
                    note: `Black Skull Dragon enters in Defense Position, and a card it Sets can't be activated the turn it's Set. Neither matters here: by your opponent's turn the Sword is live, and the dragon is a Level 9 for Mind Shuffle's tag-out.`,
                    steps: [
                        {
                            card: `Black Chaos`,
                            title: `Place Mind Shuffle`,
                            text: `Discard [[Black Chaos]] to place [[Mind Shuffle]] face-up from the Deck.`
                        },
                        {
                            card: `Skull Archfiend of Chaos`,
                            title: `Add and discard the bridge`,
                            text: `Mind Shuffle adds [[Skull Archfiend of Chaos]] and discards it. It sends [[Light and Darkness Ritual]] to the GY and adds [[Magician of Dark Chaos - Black Chaos]].`
                        },
                        {
                            card: `Magician of Dark Chaos - Black Chaos`,
                            title: `Refill and Ritual Summon`,
                            text: `The Ritual's GY effect adds itself and Black Chaos. Tribute Black Chaos to Ritual Summon the Magician, whose summon effect adds the Ritual back from the GY.`
                        },
                        {
                            card: `Black Skull Dragon, the Archfiend of Unity`,
                            title: `Discard the Ritual, summon the dragon`,
                            text: `Discard Light and Darkness Ritual to Special Summon [[Black Skull Dragon, the Archfiend of Unity]] in Defense Position. The Ritual is back in the GY for next turn's refill.`
                        },
                        {
                            card: `Spell Shattering Sword`,
                            title: `Set the Sword`,
                            text: `The dragon's trigger Sets [[Spell Shattering Sword]] from the Deck. On your opponent's turn it's live, with the Ritual in your GY to show.`
                        }
                    ],
                    result: [
                        `**End board:** the Magician, Black Skull Dragon, face-up Mind Shuffle and a Set Spell Shattering Sword. The Magician stops your opponent destroying or banishing both Spells/Traps.`,
                        `**On their turn:** Mind Shuffle adds Black Luster Soldier and tags it in for the dragon, banishing 1 card. The Sword zeroes and negates a monster. That's a banish and a negate from two cards.`
                    ]
                },
                deck: {
                    title: `Where they go in the list`,
                    groups: [
                        {
                            title: `Add`,
                            rows: [
                                { card: `Spell Shattering Sword`, count: `2`, role: `The engine's first negate. Griffoh, Black Skull Dragon, the Ritual's refill and the Magician all find or reuse it, so a third copy is rarely needed.` },
                                { card: `Black Skull Dragon, the Archfiend of Unity`, count: `1–2`, role: `A Quick-Effect Level 9 that Sets the Sword. Mind Shuffle and Ragged Records find it.` }
                            ]
                        },
                        {
                            title: `Cut from the focused list`,
                            rows: [
                                { card: `Ghost Ogre & Snow Rabbit`, count: `−2`, role: `The Sword is now the deck's on-field answer.` },
                                { card: `Djinn Demolisher of Rituals`, count: `−1`, role: `Chaos Mystic Box and the Sword already cover targeting threats.` },
                                { card: `Effect Veiler`, count: `0 to −1`, role: `Only if you play the second dragon.` }
                            ]
                        },
                        {
                            title: `Better than before`,
                            rows: [
                                { card: `Chaos Magical Hats`, count: `1`, role: `It now has two good hats: if your opponent hits Chaos Mystic Box, a boss comes out; if they hit the Sword, a card of theirs is destroyed.` },
                                { card: `Light and Darkness Ritual`, count: `2`, role: `The dragon's best discard, and the card the Sword has to show.` }
                            ]
                        }
                    ],
                    note: `Both cards reach the TCG in Beyond the Brave on 8 Oct 2026. Until then, the list in the Strategic Breakdown tab stands.`
                },
                verdict: {
                    title: `Verdict`,
                    headline: `The Sword is a must; the dragon is the best flex slot`,
                    ratings: [
                        { label: `Spell Shattering Sword`, value: 5, note: `A Quick-Play negate the engine can Set on demand, plus a sweep of face-up Spells.` },
                        { label: `Black Skull Dragon`, value: 4, note: `Close to free to summon here, it Sets the Sword and feeds Mind Shuffle. No protection of its own.` },
                        { label: `Negation after Beyond the Brave`, value: 3, note: `From no printed negate to one you can Set through Griffoh or the dragon.` }
                    ],
                    text: `Spell Shattering Sword fixes the engine's biggest hole: it finally has a card that stops a monster effect instead of dodging it, and Griffoh turns it into a hand trap that works the turn you Set it. Black Skull Dragon is how it gets Set every turn. It costs a Ritual Spell the engine wants in the GY anyway, it's a Level 9 for Mind Shuffle whenever you need one, and every summon Sets another card. Neither card turns this into a negation deck, but together they add a real negate and an extra body to the same board without costing a card.`,
                    watchouts: [
                        `**Show requirement:** the Sword needs [[Light and Darkness Ritual]] in your hand or GY. Macro Cosmos or a banished Ritual Spell can leave you with nothing to show.`,
                        `**Face-up monsters only:** hand traps, Graveyard effects and Traps are out of the Sword's reach.`,
                        `**The dragon has no protection:** [[Infinite Impermanence]] or [[Effect Veiler]] on it stops its Set trigger. [[Ash Blossom & Joyous Spring]] can't, because Setting isn't adding.`,
                        `**Timing:** a card the dragon Sets can't be activated that turn. Only Griffoh's Set lets you use the Sword right away.`,
                        `**Summoning condition:** only its own effect, Mind Shuffle or Chaos Mystic Box can put the dragon on the field, and it can't be revived.`
                    ]
                }
            }
        }
    };

    /*
     * Verre, the Maid of Endymion: one card that is an "Endymion" card by name and
     * always a "Witchcrafter" card by rule. Card facts are the printed text; the
     * rulings under `facts` follow the official database Q&A. Each combo step was
     * checked against the printed text of every card in it for once-per-turn
     * limits, summoning conditions and costs. Card names follow the official TCG
     * names (Empire of Endymion, Arrow of Regulus); CardLoader maps them to the
     * names its card sources use.
     */
    window.CrossEngineData['beyond-the-brave-verre'] = {
        set: {
            name: `Beyond the Brave`,
            ocgDate: `2026-01-05`,
            ocgNote: `OCG Stories Vol. 6 promo`,
            tcgDate: `2026-10-08`
        },

        cards: {
            verre: {
                name: `Verre, the Maid of Endymion`,
                archetype: [`Endymion`, `Witchcrafter`],
                frame: `effect`,
                statline: [`Level 4`, `LIGHT`, `Spellcaster`, `Effect`],
                atk: 500,
                def: 1400,
                summon: `Main Deck, with no summoning condition. Her own effect Special Summons her from the hand, so she never costs your Normal Summon.`,
                effects: [
                    {
                        tag: `Rule`,
                        label: `Not an effect · every zone`,
                        text: `Always treated as a “Witchcrafter” card. Her name also makes her an “Endymion” card.`
                    },
                    {
                        tag: `Summon`,
                        label: `From the hand · once per turn`,
                        text: `During your Main Phase, if a Spell Card or effect was activated this turn: Special Summon her from your hand.`
                    },
                    {
                        tag: `Trigger`,
                        label: `If Special Summoned · once per turn`,
                        text: `Add 1 “Witchcrafter” Spell/Trap or 1 [[Magical Dimension]] from your Deck to your hand. Any Special Summon starts it, not only her own.`
                    },
                    {
                        tag: `Continuous`,
                        label: `While Regulus is on your field or in your GY`,
                        text: `She gains 2300 ATK, from 500 to **2800**.`
                    }
                ],
                facts: [
                    `The Spell that turns her on can be **yours or your opponent's**. Only its activation has to go through: if [[Ash Blossom & Joyous Spring]] negates your Spell's *effect*, it still counts, but a Spell whose *activation* is negated, for example by [[Solemn Judgment]], doesn't.`,
                    `Continuous, Field and Equip Spells count even though they do nothing when activated. So does placing a Pendulum Monster from your hand in your Pendulum Zone, because that is activating it as a Spell Card.`,
                    `“Treated as Witchcrafter” is a rule, not an effect. If her effects are negated, Witchcrafter cards can still search, summon and revive her.`,
                    `The ATK boost needs a **face-up** [[Regulus, the Prince of Endymion]] on your field, or Regulus in your GY. A face-down Regulus doesn't count.`
                ],
                officialText: `(This card is always treated as a "Witchcrafter" card.)\nGains 2300 ATK while you have "Regulus, the Prince of Endymion" in your field or GY. You can only use each of the following effects of "Verre, the Maid of Endymion" once per turn.\nDuring your Main Phase, if a Spell Card or effect was activated this turn: You can Special Summon this card from your hand.\nIf this card is Special Summoned: You can add 1 "Witchcrafter" Spell/Trap or 1 "Magical Dimension" from your Deck to your hand.`
            },

            genni: {
                name: `Genni, the Maid of Endymion`,
                typeLine: `Level 1 · WIND · Spellcaster`,
                summary: `Also always a “Witchcrafter” card, so [[Witchcrafter Creation]] searches her. If you control a Spellcaster she Special Summons herself from the hand. In either player's Main Phase (Quick Effect) she banishes a Spellcaster you control, herself included, to Special Summon a “Witchcrafter” monster from the Deck. Verre qualifies.`
            },

            empire: {
                name: `Empire of Endymion`,
                typeLine: `Continuous Spell`,
                summary: `Its activation adds [[Regulus, the Prince of Endymion]] or a monster that mentions him, which includes Verre, and turns her on. If your opponent controls a monster, it can then Special Summon a Spellcaster from your hand. Once per turn it destroys a Regulus from your hand or face-up field in place of your card, which also puts Regulus in the GY for Verre's 2800 ATK.`
            }
        },

        perspectives: {
            endymion: {
                theme: `endymion`,
                kicker: `New Support · Cross-Archetype`,
                title: `Verre, the Maid of Endymion`,
                lede: `Beyond the Brave brings the runaway maid from the OCG Stories manga to the TCG. Her name makes her an “Endymion” card, so Spell Power Mastery searches her, and she always counts as a “Witchcrafter” card. Any Spell activation turns her on, including the Pendulum Scale you set anyway, and her search adds one more Spell for your Spell Counters.`,
                primary: `verre`,
                enabler: `genni`,
                enablerLabel: `Partner card`,
                teaser: {
                    kicker: `Beyond the Brave · Cross-Archetype`,
                    title: `New: Verre, the Maid of Endymion`,
                    text: `A Beyond the Brave card that is both “Endymion” and “Witchcrafter”. Spell Power Mastery searches her, any Spell (a Pendulum Scale included) lets her Special Summon herself, and she adds a Witchcrafter Spell or Magical Dimension. Your Normal Summon stays free.`,
                    cta: `Open the Beyond the Brave tab`
                },
                bridge: {
                    title: `How the engines connect`,
                    left: {
                        title: `Endymion Court`,
                        caption: `Searches her, or turns her on with a Spell activation`,
                        cards: [`Spell Power Mastery`, `Empire of Endymion`, `Servant of Endymion`, `Magical Citadel of Endymion`, `Reflection of Endymion`]
                    },
                    right: {
                        title: `Witchcrafter Coven`,
                        caption: `What her search and her Witchcrafter status open up`,
                        cards: [`Witchcrafter Creation`, `Genni, the Maid of Endymion`, `Magical Dimension`, `Witchcrafter Vice-Madame`]
                    },
                    footer: `**Rules link:** her Witchcrafter status is a rule, not an effect. [[Witchcrafter Creation]] can search her and [[Genni, the Maid of Endymion]] can summon her from the Deck even while her effects are negated.`
                },
                synergy: {
                    title: `What turns her on, and what she adds`,
                    intro: `Verre needs one Spell activated earlier in the turn, and an Endymion turn makes several before its first monster. Every Spell she adds in return is another activation for your Spell Counters.`,
                    columns: [`Card`, `Type`, `What it does with Verre`],
                    rows: [
                        [`[[Spell Power Mastery]]`, `Normal Spell`, `Adds Verre from the Deck, since her name contains “Endymion”, and its activation turns her on.`],
                        [`Any Endymion scale`, `Pendulum Scale`, `Placing a Pendulum Monster from your hand in the Pendulum Zone is activating a Spell Card, so the scale you set anyway turns her on. [[Servant of Endymion]], [[Magister of Endymion]] and [[Reflection of Endymion]] then gain a counter from every Spell you activate.`],
                        [`[[Magical Citadel of Endymion]]`, `Field Spell`, `Its activation turns her on even though it does nothing when activated.`],
                        [`[[Empire of Endymion]]`, `Continuous Spell`, `Adds Verre from the Deck, since she mentions Regulus, and turns her on. Going second, the same activation can Special Summon her from your hand.`],
                        [`[[Witchcrafter Creation]]`, `Her search`, `A Normal Spell for your counters that adds [[Genni, the Maid of Endymion]], who is treated as a “Witchcrafter” monster.`],
                        [`[[Magical Dimension]]`, `Her search`, `Quick-Play. Tribute a monster you control, Special Summon a Spellcaster from your hand, such as [[Endymion, the Mighty Master of Magic]], then you can destroy 1 monster on the field without targeting it.`]
                    ]
                },
                combo: {
                    title: `Line: one Spell into Verre and Genni`,
                    intro: `The route both maid cards were built around. Open **Spell Power Mastery**, or **Verre with any Endymion Pendulum Monster**. Either way you finish with two Spellcasters on the field and your Normal Summon unused.`,
                    branchLabel: `Starter`,
                    branches: [
                        { key: `mastery`, label: `Spell Power Mastery` },
                        { key: `scale`, label: `Verre + a Pendulum Scale` }
                    ],
                    steps: [
                        {
                            card: { mastery: `Spell Power Mastery`, scale: `Servant of Endymion` },
                            title: `Activate a Spell`,
                            branches: {
                                mastery: `Activate [[Spell Power Mastery]] and add Verre from the Deck. Her name contains “Endymion”, so she is a legal search, and Mastery's activation already meets her condition.`,
                                scale: `Place [[Servant of Endymion]], or any Endymion Pendulum Monster, in your Pendulum Zone. That is activating a Spell Card, so Verre's condition is met unless the activation is negated.`
                            }
                        },
                        {
                            card: `Verre, the Maid of Endymion`,
                            title: `Verre summons herself`,
                            text: `In your Main Phase, Special Summon Verre from your hand with her own effect: no Normal Summon, no discard, no Tribute.`
                        },
                        {
                            card: `Witchcrafter Creation`,
                            title: `Search Witchcrafter Creation`,
                            text: `Verre's trigger adds [[Witchcrafter Creation]] from the Deck.`
                        },
                        {
                            card: `Genni, the Maid of Endymion`,
                            title: `Creation adds Genni`,
                            branches: {
                                mastery: `Activate Creation and add [[Genni, the Maid of Endymion]], a “Witchcrafter” monster by rule.`,
                                scale: `Activate Creation and add [[Genni, the Maid of Endymion]], a “Witchcrafter” monster by rule. When Creation resolves, Servant of Endymion gains its first Spell Counter.`
                            }
                        },
                        {
                            card: `Genni, the Maid of Endymion`,
                            title: `Genni joins her`,
                            text: `You control a Spellcaster, Verre, so Special Summon Genni from your hand.`
                        },
                        {
                            card: `Verre, the Maid of Endymion`,
                            title: `Pick the ending`,
                            text: `Link Summon a Link-2 with Verre and Genni. Or, with a second Verre in the Deck, use Genni's Quick Effect first: banish Genni herself and Special Summon that Verre, then overlay the two Level 4s for a Rank 4. The second Verre can't search, because her search is once per turn.`
                        }
                    ],
                    result: [
                        `A Link-2 or a Rank 4 from two monsters that cost no cards, with your Normal Summon still unused.`,
                        `Witchcrafter Creation in the GY and Genni either banished or in the GY.`,
                        `On the scale route, a Pendulum Scale is already set and Servant of Endymion holds a Spell Counter.`
                    ],
                    note: `Verre's summon and search are each once per turn, as are both of Genni's effects. They reset on your opponent's turn: if Verre is in your GY and [[Selene, Queen of the Master Magicians]] is on the field, Selene's Quick Effect (remove 3 Spell Counters) revives her in either player's Main Phase, and her search can add [[Magical Dimension]] to use at once.`
                },
                deck: {
                    title: `Deck profile: Verre in Endymion`,
                    groups: [
                        {
                            title: `Add`,
                            rows: [
                                { card: `Verre, the Maid of Endymion`, count: `1–2`, role: `A Level 4 body that never costs your Normal Summon, searchable with Spell Power Mastery.` },
                                { card: `Genni, the Maid of Endymion`, count: `1–2`, role: `Creation's target. Summons herself next to Verre and can pull a second Verre from the Deck.` },
                                { card: `Witchcrafter Creation`, count: `1–2`, role: `Verre's main search. Adds Genni and is one more Spell for your counters.` },
                                { card: `Magical Dimension`, count: `1`, role: `Verre's other search. Quick-Play removal that also brings out a Spellcaster from your hand.` }
                            ]
                        },
                        {
                            title: `Already in the deck`,
                            rows: [
                                { card: `Spell Power Mastery`, count: `3`, role: `Now also searches Verre, Genni, Regulus and Empire of Endymion: all four have “Endymion” in their names.` },
                                { card: `Selene, Queen of the Master Magicians`, count: `1–2 (ED)`, role: `Verre is Spellcaster material, and Selene can revive her on a later turn so she searches again.` }
                            ]
                        },
                        {
                            title: `Optional: Regulus package`,
                            rows: [
                                { card: `Regulus, the Prince of Endymion`, count: `2`, role: `Turns on Verre's 2800 ATK from the field or the GY, and searches Empire of Endymion.` },
                                { card: `Empire of Endymion`, count: `2–3`, role: `A second way to search Verre, plus protection that sends Regulus to the GY.` }
                            ]
                        }
                    ],
                    note: `Endymion Pendulum builds in the research play 1–2 Verre. A second copy in hand can't summon herself on the same turn, so more copies mostly add dead draws. Genni can still bring the second one out of the Deck.`
                },
                verdict: {
                    title: `Verdict`,
                    headline: `A free Level 4 for Endymion, and the way into the maid package`,
                    ratings: [
                        { label: `Archetype fit`, value: 4, note: `Mastery searches her and the deck activates Spells anyway. Her search leaves the Spell Counter engine for Witchcrafter cards.` },
                        { label: `Consistency`, value: 4, note: `Spell Power Mastery or any Pendulum Scale turns her on. Both her effects are once per turn.` },
                        { label: `Raw power`, value: 3, note: `500 ATK on her own and no negation. She reaches 2800 only alongside Regulus.` }
                    ],
                    text: `Verre doesn't replace Servant of Endymion as the core starter. She gives the deck a second opening that needs no Normal Summon and no Spell Counters, and she brings the Genni and Regulus cards with her. The research puts her at 1–2 copies in Pendulum builds; the full Endymion-Witchcrafter hybrid runs three.`,
                    watchouts: [
                        `**Spell lockdowns:** with no Spell activated this turn she stays in your hand. [[Anti-Spell Fragrance]] and Spell negation hurt her the same way they hurt the rest of the deck.`,
                        `**Negated activations:** a Spell whose activation is negated doesn't count toward her condition. One whose effect is negated, for example by [[Ash Blossom & Joyous Spring]], still does.`,
                        `**Droll & Lock Bird:** chained to Mastery's search, [[Droll & Lock Bird]] also blocks Verre's search. She still summons herself, so you keep a Level 4 body.`,
                        `**Once per turn:** a second Verre can't summon herself or search on the same turn. Genni can bring her from the Deck, but without a search.`
                    ]
                }
            },

            witchcrafter: {
                theme: `witchcrafter`,
                kicker: `New Support · Cross-Archetype`,
                title: `Verre, the Maid of Endymion`,
                lede: `Before she was Madame Verre, she was a maid in Endymion's Citadel. Her card is always treated as a “Witchcrafter” card, so Witchcrafter Creation searches her and every Witchcrafter recruiter can summon her. She fixes the deck's oldest problem: she reaches the field without the Normal Summon, a discard or a Tribute, and her search adds a Witchcrafter Spell.`,
                primary: `verre`,
                enabler: `empire`,
                enablerLabel: `Second searcher`,
                teaser: {
                    kicker: `Beyond the Brave · Cross-Archetype`,
                    title: `New: Verre, the Maid of Endymion`,
                    text: `The young Madame Verre joins the coven from the Endymion side. She always counts as a “Witchcrafter” card, summons herself after any Spell, and adds a Witchcrafter Spell/Trap, all without your Normal Summon or a discard.`,
                    cta: `Open the Beyond the Brave tab`
                },
                bridge: {
                    title: `How the engines connect`,
                    left: {
                        title: `Witchcrafter Coven`,
                        caption: `Searches, summons or revives her, since she is a Witchcrafter`,
                        cards: [`Witchcrafter Creation`, `Witchcrafter Schmietta`, `Witchcrafter Genni`, `Witchcrafter Holiday`, `Witchcrafter Vice-Madame`]
                    },
                    right: {
                        title: `Endymion Court`,
                        caption: `The Regulus cards that find her or power her up`,
                        cards: [`Empire of Endymion`, `Regulus, the Prince of Endymion`, `Genni, the Maid of Endymion`, `Spell Power Mastery`]
                    },
                    footer: `**Link to Regulus:** [[Arrow of Regulus]] can banish itself from the GY to revive Regulus or a monster that mentions him, and Verre mentions him. A revived Verre searches again if her search is still unused that turn.`
                },
                synergy: {
                    title: `How she fits the Witchcrafter loop`,
                    intro: `Every Witchcrafter recruiter asks for something: Schmietta and Genni Tribute themselves and discard a Spell. Verre asks for one Spell activation, which the deck makes every turn, and pays a Spell back.`,
                    columns: [`Card`, `Interaction`, `What you gain`],
                    rows: [
                        [`[[Witchcrafter Creation]]`, `Searches her`, `Creation's own activation meets her condition, so one card becomes a Level 4 on the field plus a searched Witchcrafter Spell/Trap. Your Normal Summon stays free.`],
                        [`[[Witchcrafter Schmietta]] / [[Witchcrafter Genni]]`, `Summon her from the Deck`, `Any Special Summon starts her search, which repays the Spell you discarded to summon her.`],
                        [`[[Witchcrafter Holiday]]`, `Revives her`, `Her search fires again if it's still unused that turn.`],
                        [`[[Witchcrafter Vice-Madame]]`, `Answers her activations`, `Her summon and her search are two separate non-Fusion Spellcaster effects, so Vice-Madame can use two of its effects off her in one turn. Vice-Madame can also Special Summon her from the Deck.`],
                        [`[[Witchcrafter Madame Verre]] / [[Witchcrafter Haine]]`, `Keeps their fuel`, `She costs no Spell to summon or to search, so the Spells in your hand stay available for Madame Verre's negation and Haine's destruction.`],
                        [`[[Witchcrafter Patronus]]`, `Recycles her`, `Shuffles a banished or GY Verre back into the Deck and adds a Witchcrafter Spell, and she can be searched again.`]
                    ]
                },
                combo: {
                    title: `Line: the maids into Madame Verre, Normal Summon unused`,
                    intro: `The Foundational Formula from the Classic Analysis tab, started by the maids instead of a Normal Summoned Schmietta. Opening hand: **Empire of Endymion** or **Spell Power Mastery**, plus **any Spell** to discard.`,
                    branchLabel: `Starter`,
                    branches: [
                        { key: `empire`, label: `Empire of Endymion` },
                        { key: `mastery`, label: `Spell Power Mastery` }
                    ],
                    steps: [
                        {
                            card: { empire: `Empire of Endymion`, mastery: `Spell Power Mastery` },
                            title: `Search Verre with a Spell`,
                            branches: {
                                empire: `Activate [[Empire of Endymion]] and add Verre, since she mentions Regulus. Going second, if your opponent controls a monster, the same activation can Special Summon her from your hand.`,
                                mastery: `Activate [[Spell Power Mastery]] and add Verre, since her name contains “Endymion”. Mastery can also find Genni, Regulus or Empire, which makes it a searcher for the whole maid package.`
                            }
                        },
                        {
                            card: `Verre, the Maid of Endymion`,
                            title: `Verre summons herself`,
                            branches: {
                                empire: `If Empire didn't already summon her, Special Summon Verre from your hand in your Main Phase. Empire's activation meets her condition, and she costs no discard, no Tribute and no Normal Summon.`,
                                mastery: `Mastery's activation meets her condition, so Special Summon Verre from your hand in your Main Phase: no discard, no Tribute, no Normal Summon.`
                            }
                        },
                        {
                            card: `Witchcrafter Creation`,
                            title: `Creation finds Genni`,
                            text: `Verre's trigger adds [[Witchcrafter Creation]]. Activate it and add [[Genni, the Maid of Endymion]], a “Witchcrafter” monster by rule.`
                        },
                        {
                            card: `Genni, the Maid of Endymion`,
                            title: `Genni summons herself`,
                            text: `You control a Spellcaster, so Special Summon Genni from your hand.`
                        },
                        {
                            card: `Witchcrafter Schmietta`,
                            title: `Genni calls Schmietta`,
                            text: `Genni's Quick Effect: target Genni herself, banish her, and Special Summon [[Witchcrafter Schmietta]] from the Deck. Verre stays on the field. Genni can also summon [[Witchcrafter Madame Verre]] directly; going through Schmietta costs a discard but sets up Bystreet.`
                        },
                        {
                            card: `Witchcrafter Madame Verre`,
                            title: `Schmietta summons the master`,
                            text: `Schmietta's Quick Effect: Tribute her, then discard a Spell, and Special Summon [[Witchcrafter Madame Verre]] from the Deck. Then banish Schmietta from the GY to send [[Witchcrafter Bystreet]] from the Deck to the GY, as in the classic formula.`
                        }
                    ],
                    result: [
                        `[[Witchcrafter Madame Verre]] and Verre, the Maid of Endymion on the field, with your Normal Summon still unused.`,
                        `In your End Phase, [[Witchcrafter Bystreet]] places itself face-up. If the Spell you discarded was a Witchcrafter Spell, it returns to your hand.`,
                        `Genni is banished, ready for [[Witchcrafter Patronus]] to shuffle back into the Deck.`
                    ],
                    note: `Activating Creation uses its one effect for the turn, so Creation itself doesn't return in this End Phase. Every other once-per-turn effect in the line is used only once.`
                },
                deck: {
                    title: `Deck profile: the maid package in Witchcrafter`,
                    groups: [
                        {
                            title: `Add`,
                            rows: [
                                { card: `Verre, the Maid of Endymion`, count: `3`, role: `A starter and extender that costs no card. Creation, Empire and every Witchcrafter recruiter reach her.` },
                                { card: `Genni, the Maid of Endymion`, count: `2`, role: `Summons herself next to Verre, then turns into any Witchcrafter monster from the Deck.` },
                                { card: `Empire of Endymion`, count: `2–3`, role: `A second way to search Verre, plus destruction protection that uses Regulus.` }
                            ]
                        },
                        {
                            title: `Optional: Regulus package`,
                            rows: [
                                { card: `Regulus, the Prince of Endymion`, count: `2–3`, role: `Turns on Verre's 2800 ATK from the field or the GY, and searches Empire of Endymion or Arrow of Regulus.` },
                                { card: `Arrow of Regulus`, count: `1–2`, role: `Negates a Normal or Quick-Play Spell while you control Regulus, and revives Verre or Regulus from the GY.` },
                                { card: `Spell Power Mastery`, count: `0–3`, role: `Searches Verre, Genni, Regulus or Empire. Only worth it with the whole package.` }
                            ]
                        },
                        {
                            title: `Already in the deck`,
                            rows: [
                                { card: `Witchcrafter Creation`, count: `3`, role: `Now searches Verre and Genni as well as your classic starters.` },
                                { card: `Magical Dimension`, count: `0–1`, role: `Verre's non-Witchcrafter search. Quick-Play removal that destroys without targeting.` }
                            ]
                        }
                    ],
                    note: `Research deck skeletons for the hybrid build run 3 Verre, 3 Regulus, 2 Genni and 3 Empire. A pure Witchcrafter build can stop at Verre and Genni and still gains an opening that doesn't need the Normal Summon.`
                },
                verdict: {
                    title: `Verdict`,
                    headline: `The Normal Summon-free starter Witchcrafter has always needed`,
                    ratings: [
                        { label: `Archetype fit`, value: 5, note: `A Witchcrafter card by rule: Creation, Schmietta, Genni, Holiday and Vice-Madame all reach her, and she searches Witchcrafter Spells/Traps.` },
                        { label: `Consistency`, value: 4, note: `Creation alone searches her and turns her on. She needs a Spell activated earlier in the turn, and both her effects are once per turn.` },
                        { label: `Raw power`, value: 3, note: `500 ATK and no disruption of her own. With Regulus on your field or in your GY she attacks for 2800.` }
                    ],
                    text: `Witchcrafter's classic weakness is that everything runs through one Normal Summon, which a single hand trap can stop. Verre gives the deck a second route that uses no Normal Summon, no discard and no Tribute, and she replaces herself with a Spell. Run three in any Witchcrafter build, and add Genni and Empire for the full maid package.`,
                    watchouts: [
                        `**Needs a Spell first:** she can't be your very first play. Creation, Empire or another Spell has to be activated earlier in the turn.`,
                        `**Negated activations:** a Spell whose activation is negated doesn't count. One whose effect is negated, for example by [[Ash Blossom & Joyous Spring]], still does.`,
                        `**Droll & Lock Bird:** [[Droll & Lock Bird]] stops her search and Creation's. If she's already in your hand she still summons herself.`,
                        `**GY hate:** Verre herself doesn't need the GY, but [[Macro Cosmos]] and [[Dimension Shifter]] still stop the Witchcrafter Spells she feeds from returning in the End Phase.`
                    ]
                }
            }
        }
    };
})();
