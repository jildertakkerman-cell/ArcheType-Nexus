# Headless Yu-Gi-Oh! OCGCore HTML Combo Audit

Generated: Sun, 01 Nov 2026 10:36:30 GMT

### Summary
- **Pages Audited**: 407
- **Total Combos Audited**: 517
- **Total Steps Audited**: 1618
- **100% Legal Confirmed**: 464
- **Partially Verified** (no illegal play found; some prose steps could not be simulated): 10
- **Likely Illegal** (the card was in place and the engine refused the action): 27
- **Needs Review** (a card the step uses never reached the hand/field, or the harness crashed): 11
- **Could Not Verify** (stopped after a step the engine could not simulate): 5
- **Unofficial / Custom Skipped**: 0

## Likely Illegal Plays

### [ ] [Adamancipator](Adamancipator Archetype Breakdown.html) - Core Combo: Stack the Deck, Then Excavate (Line 2)
- **File**: `Adamancipator Archetype Breakdown.html`
- **Failed at**: Step 4 of 5
- **Step Title**: "Synchro Summon Risen - Tiamite"
- **Written Step**: *"Synchro Summon Adamancipator Risen - Tiamite using Adamancipator Conductor and Adamancipator Crystal - Tiamite ."*
- **Engine Violation**: `Step 5 ("Synchro Summon Adamancipator Risen - Tiamite using Adamancipator Conductor and Adamancipator Crystal - Tiamite.") was not offered as a legal action by the duel engine. The only effect matching its wording was Adamancipator Seeker's, and it did not move Adamancipator Risen - Tiamite. Adamancipator Risen - Tiamite is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Adamancipator Conductor (24925387)`
  - `Selected: Adamancipator Crystal - Tiamite (51420096) from location 2`
  - `Step 2: Legal Activation of Adamancipator Conductor (24925387)`
  - `Selected: Adamancipator Crystal - Tiamite (51420096) from location 1`
  - `Trigger Effect Accepted for Adamancipator Crystal - Tiamite (51420096)`
  - `Selected: Adamancipator Mates (30068809) from location 1`
  - `Selected: Adamancipator Researcher (85914562) from location 2`
  - `Step 5: Legal Activation of Adamancipator Seeker (48519867) (matched by effect wording)`

### [ ] [Ancient Gear](Ancient Gear Deck Analysis.html) - Core Combo: The Wyvern One-Card OTK Setup
- **File**: `Ancient Gear Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Clear the Field"
- **Written Step**: *"Use Advance's effect: Tribute Wyvern to draw 1 card. With no monsters on your field, activate Ancient Gear Catapult targeting the face-up Advance: destroy it and Special Summon Ancient Gear Dark Golem from your Deck."*
- **Engine Violation**: `Step 4 ("Use Advance's effect: Tribute Wyvern to draw 1 card.") was not offered as a legal action by the duel engine. Ancient Gear Advance is in the Spell & Trap Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Ancient Gear Wyvern (17663375)`
  - `Trigger Effect Accepted for Ancient Gear Wyvern (17663375)`
  - `Selected: Ancient Gear Advance (4064925) from location 1`
  - `Step 3: Legal Activation of Ancient Gear Advance (4064925)`
  - `Selected: Ancient Gear Catapult (44052074) from location 1`

### [ ] [Armed Dragon](Armed Dragon Deck Analysis.html) - Core Combo: The "Drill" Pivot (Line 2)
- **File**: `Armed Dragon Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Launch the Fist"
- **Written Step**: *"Normal Summon Artillery Catapult Turtle . Tribute it to Special Summon Fist Armed Dragon directly from the Deck."*
- **Engine Violation**: `Step 2 ("Tribute it to Special Summon Fist Armed Dragon directly from the Deck.") was not offered as a legal action by the duel engine. Artillery Catapult Turtle is in the Monster Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Artillery Catapult Turtle (7913375)`

### [ ] [Artmage](Artmage Deck Analysis.html) - Core Combo: The Non-Finito Bridge
- **File**: `Artmage Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "The Pivot"
- **Written Step**: *"Activate Artmage Power Patron 's effect to Fusion Summon Artmage Diactorus using Medius the Pure and Artmage Power Patron . Artmage Power Patron 's effect adds Artmage Varnish -Alteration- from your Deck to your hand."*
- **Engine Violation**: `Step 5 ("Activate Artmage Power Patron 's effect to Fusion Summon Artmage Diactorus using Medius the Pure and Artmage Power Patron.") was not offered as a legal action by the duel engine. The only effect matching its wording was Artmage Vandalism -Assault-'s, and it did not move Artmage Diactorus. Artmage Diactorus is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Artmage Vandalism -Assault- (1122030)`
  - `Selected: Medius the Pure (97556336) from location 1`
  - `Step 2: Legal Normal Summon of Medius the Pure (97556336)`
  - `Trigger Effect Accepted for Medius the Pure (97556336)`
  - `Selected: Artmage Power Patron (23829452) from location 1`
  - `Step 4: Legal Activation of Theorealize Past Lull (36709484)`
  - `Selected: Medius the Pure (97556336) from location 1`
  - `Step 5: Legal Activation of Artmage Vandalism -Assault- (1122030) (matched by effect wording)`
  - `Selected: Artmage Power Patron (23829452) from location 4`

### [ ] [Cyberdark](Cyberdark Deck Analysis.html) - Core Combo: Cyber Dragon Core Turbo
- **File**: `Cyberdark Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Construct the Final Boss"
- **Written Step**: *"Activate Power Bond to Fusion Summon Cyberdarkness Dragon using Cyberdark Chimera , Cyberdark Keel , Cyberdark Claw , Cyberdark Cannon and Cyberdark Edge . Cyberdarkness Dragon 's effect equips Cyber End Dragon from your GY to it. Special Summon Cyberdark End Dragon from your Extra Deck by Tributing Cyberdarkness Dragon ."*
- **Engine Violation**: `Step 11 ("Special Summon Cyberdark End Dragon from your Extra Deck by Tributing Cyberdarkness Dragon.") was not offered as a legal action by the duel engine. Cyberdark End Dragon is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Cyber Dragon Core (23893227)`
  - `Selected: Cyberdark Realm (64753988) from location 1`
  - `Step 3: Legal Activation of Cyberdark Realm (64753988)`
  - `Selected: Cyberdark Claw (82562802) from location 1`
  - `Step 4: Legal Activation of Cyberdark Claw (82562802)`
  - `Selected: Cybernetic Horizon (63031396) from location 1`
  - `Step 5: Legal Activation of Cyberdark Cannon (45078193)`
  - `Selected: Cyberdark Keel (3019642) from location 1`
  - `Step 6: Legal Activation of Cybernetic Horizon (63031396)`
  - `Selected: Cyberdark Chimera (5370235) from location 1`
  - `Selected: Cyber End Dragon (1546123) from location 64`
  - `Step 7: Legal Activation of Cyberdark Realm (64753988)`
  - `Selected: Cyberdark Chimera (5370235) from location 2`
  - `Step 8: Legal Activation of Cyberdark Chimera (5370235)`
  - `Selected: Cyberdark Inferno (44352516) from location 2`
  - `Selected: Power Bond (37630732) from location 1`
  - `Step 9: Legal Activation of Power Bond (37630732)`
  - `Selected: Cyberdarkness Dragon (18967507) from location 64`

### [ ] [D_D](D_D Deck Analysis.html) - Core Combo Walkthroughs (Line 3)
- **File**: `D_D Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Open the Gateway"
- **Written Step**: *"Link Summon D/D/D Abyss King Gilgamesh using D/D Savant Kepler and D/D/D Oracle King d'Arc . D/D/D Abyss King Gilgamesh 's effect places D/D Savant Copernicus and D/D Savant Newton from your Deck in your Pendulum Zones."*
- **Engine Violation**: `Step 6 ("Link Summon D/D/D Abyss King Gilgamesh using D/D Savant Kepler and D/D/D Oracle King d'Arc.") was not offered as a legal action by the duel engine. D/D/D Abyss King Gilgamesh is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of D/D Savant Kepler (11609969)`
  - `Trigger Effect Accepted for D/D Savant Kepler (11609969)`
  - `Selected: Dark Contract with the Gate (46372010) from location 1`
  - `Step 3: Legal Activation of Dark Contract with the Gate (46372010)`
  - `Step 4: Legal Activation of Dark Contract with the Gate (46372010)`
  - `Selected: D/D Swirl Slime (45206713) from location 1`

### [ ] [Dracotail](Dracotail Archetype Breakdown.html) - Core Combo (Line 5)
- **File**: `Dracotail Archetype Breakdown.html`
- **Failed at**: Step 2 of 2
- **Step Title**: "Set and Fuse Again"
- **Written Step**: *"Dracotail Mululu 's effect Sets Dracotail Horn from your Deck. Activate Lubellion the Searing Dragon 's effect, discarding Dracotail Pan , to Fusion Summon Mirrorjade the Iceblade Dragon by shuffling Fallen of Albaz and Lubellion the Searing Dragon into the Deck."*
- **Engine Violation**: `Step 3 ("Activate Lubellion the Searing Dragon 's effect, discarding Dracotail Pan, to Fusion Summon Mirrorjade the Iceblade Dragon by shuffling Fallen of Albaz and Lubellion the Searing Dragon into the Deck.") was not offered as a legal action by the duel engine. The only effect matching its wording was Ketu Dracotail's, and it did not move Lubellion the Searing Dragon or Mirrorjade the Iceblade Dragon. Lubellion the Searing Dragon is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Branded Fusion (44362883)`
  - `Selected: Lubellion the Searing Dragon (70534340) from location 64`
  - `Step 3: Legal Activation of Ketu Dracotail (6153210) (matched by effect wording)`
  - `Selected: Dracotail Pan (44482554) from location 1`

### [ ] [Evol](Evol Deck Analysis.html) - Core Combo Paths
- **File**: `Evol Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Summon & Activate"
- **Written Step**: *"Normal Summon Najasho . Activate Evo-Force , Tributing Najasho."*
- **Engine Violation**: `Step 2 ("Activate Evo-Force, Tributing Najasho.") was not offered as a legal action by the duel engine. Evo-Force is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Evoltile Najasho (88095331)`

### [ ] [Gaia](Gaia Deck Analysis.html) - Core Combo (Line 2)
- **File**: `Gaia Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "The Lock"
- **Written Step**: *"Normal Summon Heart of Gaia ."*
- **Engine Violation**: `Step 4 ("Normal Summon Heart of Gaia.") was not offered as a legal action by the duel engine. Heart of Gaia is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Galloping Gaia (2106266)`
  - `Step 2: Legal Activation of Galloping Gaia (2106266)`
  - `Step 2: Legal Activation of Galloping Gaia's effect (2106266)`
  - `Selected: Gaia the Magical Knight (34130561) from location 2`
  - `Selected: Curse of Dragon, the Cursed Dragon (61525276) from location 1`
  - `Step 3: Legal Activation of Spiral Fusion (38590361)`
  - `Selected: Gaia the Magical Knight of Dragons (15989522) from location 64`

### [ ] [Generaider](Generaider Deck Analysis.html) - Core Combo: The "Loptr" One-Card Setup
- **File**: `Generaider Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Normal Summon & Tribute"
- **Written Step**: *"Normal Summon Loptr . Activate its Quick Effect, tributing itself."*
- **Engine Violation**: `Step 2 ("Activate its Quick Effect, tributing itself.") was not offered as a legal action by the duel engine. Loptr, Shadow of the Generaider Bosses is in the Monster Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Loptr, Shadow of the Generaider Bosses (94183877)`

### [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 3)
- **File**: `Hecahands Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Hecahands Payoff"
- **Written Step**: *"Activate Hecahands Mankibuel 's effect, revealing it, to Fusion Summon Hecahands Jauzah using it and the Hecahands Mankibuel on your field. Activate Hecahands Jauzah 's effect to add Ib'al-Hecahands from your Deck to your hand. Set Ib'al-Hecahands ."*
- **Engine Violation**: `Step 8 ("Activate Hecahands Mankibuel 's effect, revealing it, to Fusion Summon Hecahands Jauzah using it and the Hecahands Mankibuel on your field.") was not offered as a legal action by the duel engine. The only effect matching its wording was Hecahands Ibtel's, and it did not move Hecahands Jauzah. Hecahands Jauzah is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Alternative choices tried and kept**: The Hidden Hecahands: Add 1 "Hecahands" monster from your Deck to your hand instead of Hecahands Yadel: Add 1 "Hecahands" Spell/Trap from your Deck to your hand
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Mirror Swordknight (28954097)`
  - `Chain Trigger Accepted for Mirror Swordknight (28954097)`
  - `Selected: Gazelle the King of Mythical Claws (23076639) from location 1`
  - `Trigger Effect Accepted for Gazelle the King of Mythical Claws (23076639)`
  - `Selected: Chimera Fusion (63136489) from location 1`
  - `Chain Trigger Accepted for Chimera Fusion (63136489)`
  - `Selected: Berfomet the Mythical King of Phantom Beasts (69601012) from location 64`
  - `Step 7: Legal Activation of The Hidden Hecahands (20415050) (matched by effect wording)`
  - `Selected: Gazelle the King of Mythical Claws (23076639) from location 4`
  - `Selected: Hecahands Ibtel (95365081) from location 1`
  - `Selected: Ib'al-Hecahands (93294363) from location 1`
  - `Step 8: Legal Activation of Hecahands Ibtel (95365081) (matched by effect wording)`
  - `Selected: Hecahands Mankibuel (18321034) from location 1`
  - `Alternate choice near step 7: The Hidden Hecahands: Add 1 "Hecahands" monster from your Deck to your hand (instead of Hecahands Yadel: Add 1 "Hecahands" Spell/Trap from your Deck to your hand)`

### [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 4)
- **File**: `Hecahands Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Fuse Jauzah"
- **Written Step**: *"Activate Hecahands Mankibuel 's effect, revealing it, to Fusion Summon Hecahands Jauzah using Hecahands Mankibuel from your hand and Hecahands Yadel . Hecahands Yadel 's effect Sets The Hidden Hecahands from your GY. Activate Hecahands Jauzah 's effect to add Ib'al-Hecahands from your Deck to your hand. Set Ib'al-Hecahands ."*
- **Engine Violation**: `Step 6 ("Activate Hecahands Jauzah 's effect to add Ib'al-Hecahands from your Deck to your hand.") was not offered as a legal action by the duel engine. Hecahands Jauzah is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of The Hidden Hecahands (20415050)`
  - `Selected: Hecahands Ibtel (95365081) from location 1`
  - `Step 2: Legal Activation of Hecahands Ibtel (95365081)`
  - `Selected: Hecahands Yadel (32759190) from location 1`

### [ ] [Infernoid](Infernoid Deck Analysis.html) - Core Combo Walkthrough (Line 2)
- **File**: `Infernoid Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "The "Double Dip""
- **Written Step**: *"Link Summon Gravity Controller using Infernoid Evil . Infernoid Evil 's effect adds Void Feast from your Deck to your hand. Special Summon Infernoid Devyaty from your GY by banishing Infernoid Pirmais , Infernoid Harmadik and Infernoid Patrulea from your GY."*
- **Engine Violation**: `Step 5 ("Link Summon Gravity Controller using Infernoid Evil.") was not offered as a legal action by the duel engine. Gravity Controller is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Infernoid Decatron (58446973)`
  - `Trigger Effect Accepted for Infernoid Decatron (58446973)`
  - `Selected: Infernoid Seitsemas (51316684) from location 1`
  - `Step 3: Legal Activation of Dark Fusion (94820406)`
  - `Selected: Infernoid Evil (97051536) from location 64`

### [ ] [Infinittrack](Infinittrack Deck Analysis.html) - Core Combo
- **File**: `Infinittrack Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Escalate and Extend"
- **Written Step**: *"Tribute Harvester to Special Summon Brutal Dozer . Its effect triggers, summoning Infinitrack Trencher from the Deck."*
- **Engine Violation**: `Step 3 ("Tribute Harvester to Special Summon Brutal Dozer.") was not offered as a legal action by the duel engine. Infinitrack Brutal Dozer is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Infinitrack Harvester (35645105)`
  - `Trigger Effect Accepted for Infinitrack Harvester (35645105)`
  - `Selected: Infinitrack Brutal Dozer (76830505) from location 1`
  - `Step 3: Transitioning to End Phase for remaining actions`

### [ ] [Invoked](Invoked Deck Analysis.html) - Strategic Combo Lines (Line 3)
- **File**: `Invoked Deck Analysis.html`
- **Failed at**: Step 3 of 5
- **Written Step**: *"Link Summon Aleister the Invoker of Madness using Aleister the Reminiscent and Invoked Sorath . Activate Invoked Sorath 's effect in your GY to Fusion Summon Invoked Baybarron by banishing Invoked Sorath and Aleister the Reminiscent from your GY. Invoked Baybarron 's effect adds Virakam, the Divine Spirit of Artifice from your Deck to your hand. Aleister the Invoker of Madness 's effect discards Aleister the Invoker to add The Book of the Law from your Deck to your hand."*
- **Engine Violation**: `Step 8 ("Link Summon Aleister the Invoker of Madness using Aleister the Reminiscent and Invoked Sorath.") was not offered as a legal action by the duel engine. The only effect matching its wording was Aiwass, Divine Spirit of the Law's, and it did not move Invoked Sorath or Aleister the Invoker of Madness. Invoked Sorath is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Alternative choices tried and kept**: Virakam, the Divine Spirit of Artifice: Special Summon this card from your hand instead of Aiwass, Divine Spirit of the Law: Add 1 "Aleister" monster from your Deck to your hand
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Aleister the Invoker (86120751)`
  - `Trigger Effect Accepted for Aleister the Invoker (86120751)`
  - `Selected: Invocation (74063034) from location 1`
  - `Step 3: Legal Special Summon of Salamangreat Almiraj (60303245)`
  - `Step 4: Legal Activation of Invocation (74063034)`
  - `Selected: Invoked Sorath (43989315) from location 64`
  - `Step 5: Legal Activation of Virakam, the Divine Spirit of Artifice (10673071) (matched by effect wording)`
  - `Trigger Effect Accepted for Virakam, the Divine Spirit of Artifice (10673071)`
  - `Selected: Invocation (74063034) from location 1`
  - `Step 8: Legal Activation of Aiwass, Divine Spirit of the Law (84288367) (matched by effect wording)`
  - `Selected: Aleister the Reminiscent (57294268) from location 1`
  - `Alternate choice near step 5: Virakam, the Divine Spirit of Artifice: Special Summon this card from your hand (instead of Aiwass, Divine Spirit of the Law: Add 1 "Aleister" monster from your Deck to your hand)`

### [ ] [Lair of Darkness](Lair of Darkness Deck Analysis.html) - Core Combo
- **File**: `Lair of Darkness Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Disrupt & Summon"
- **Written Step**: *"On the opponent's turn, activate Lilith's Quick Effect. Tribute one of their key monsters as cost. This triggers Darkest Diabolos , Special Summoning it from your hand or GY."*
- **Engine Violation**: `Step 5 ("activate Lilith's Quick Effect.") was not offered as a legal action by the duel engine. Lilith, Lady of Lament is in the Monster Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Lair of Darkness (59160188)`
  - `Step 3: Legal Normal Summon of Lilith, Lady of Lament (23898021)`
  - `Passing turn to opponent for opponent-turn action`

### [ ] [Masked hero](Masked hero Deck Analysis.html) - Core Combo: The Vision HERO Engine
- **File**: `Masked hero Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "The Chain"
- **Written Step**: *"Activate Vision HERO Increase 's effect, Tributing Vision HERO Faris , to Special Summon it. Vision HERO Increase 's effect Special Summons Vision HERO Vyon from your Deck. Vision HERO Vyon 's effect sends Destiny HERO - Malicious from your Deck to the GY."*
- **Engine Violation**: `Step 3 ("Activate Vision HERO Increase 's effect, Tributing Vision HERO Faris, to Special Summon it.") was not offered as a legal action by the duel engine. The only effect matching its wording was Destiny HERO - Malicious's, and it did not move Vision HERO Faris or Vision HERO Increase. Vision HERO Faris is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Vision HERO Faris (18094166)`
  - `Selected: Destiny HERO - Malicious (9411399) from location 2`
  - `Trigger Effect Accepted for Vision HERO Faris (18094166)`
  - `Selected: Vision HERO Increase (22865492) from location 1`
  - `Step 3: Legal Activation of Destiny HERO - Malicious (9411399) (matched by effect wording)`
  - `Selected: Destiny HERO - Malicious (9411399) from location 1`

### [ ] [Monarch](Monarch Deck Analysis.html) - Core Combo: The One-Card Monarch
- **File**: `Monarch Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Summon the Monarch"
- **Written Step**: *"Tribute Summon Erebus the Underworld Monarch by Tributing Edea the Heavenly Squire and Eidos the Underworld Squire . Erebus the Underworld Monarch 's effect sends Return of the Monarchs and Pantheism of the Monarchs from your Deck to the GY."*
- **Engine Violation**: `Step 4 ("Tribute Summon Erebus the Underworld Monarch by Tributing Edea the Heavenly Squire and Eidos the Underworld Squire.") was not offered as a legal action by the duel engine. The only effect matching its wording was The Monarchs Masterplan's, and it did not move Edea the Heavenly Squire or Eidos the Underworld Squire or Erebus the Underworld Monarch. Edea the Heavenly Squire is in the Monster Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Edea the Heavenly Squire (95457011)`
  - `Trigger Effect Accepted for Edea the Heavenly Squire (95457011)`
  - `Selected: Eidos the Underworld Squire (59463312) from location 1`
  - `Step 4: Legal Activation of The Monarchs Masterplan (63899196) (matched by effect wording)`
  - `Selected: Return of the Monarchs (61466310) from location 1`

### [ ] [P.U.N.K.](P.U.N.K. Deck Analysis.html) - Core Combo
- **File**: `P.U.N.K. Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Climb into Synchro"
- **Written Step**: *"Rising Carp's effect summons Deer Note and Wa Gon . Synchro them into Dragon Drive . Deer Note's effect in GY revives Sharakusai ."*
- **Engine Violation**: `Step 6 ("Synchro them into Dragon Drive.") was not offered as a legal action by the duel engine. P.U.N.K. JAM Dragon Drive is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Noh-P.U.N.K. Ze Amin (19535693)`
  - `Step 2: Legal Activation of Noh-P.U.N.K. Ze Amin (19535693) (matched by effect wording)`
  - `Selected: Noh-P.U.N.K. Foxy Tune (55920742) from location 1`
  - `Step 3: Legal Activation of Noh-P.U.N.K. Foxy Tune (55920742)`
  - `Selected: Gagaku-P.U.N.K. Wa Gon (50642380) from location 2`
  - `Selected: Ukiyoe-P.U.N.K. Sharakusai (13258285) from location 1`
  - `Step 4: Legal Activation of Ukiyoe-P.U.N.K. Sharakusai (13258285)`
  - `Selected: Ukiyoe-P.U.N.K. Rising Carp (18313046) from location 64`

### [ ] [Spider](Spider Deck Analysis.html) - Core Combo: The Go-Second OTK
- **File**: `Spider Deck Analysis.html`
- **Failed at**: Step 3 of 6
- **Step Title**: "The First Titan"
- **Written Step**: *"Overlay the two Level 10 Baby Spiders to Xyz Summon Number 35: Ravenous Tarantula in Attack Position."*
- **Engine Violation**: `Step 7 ("Overlay the two Level 10 Baby Spiders to Xyz Summon Number 35: Ravenous Tarantula in Attack Position.") was not offered as a legal action by the duel engine. Number 35: Ravenous Tarantula is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Special Summon of Mother Spider Splitter (34034150)`
  - `Step 2: Legal Activation of Mother Spider Splitter (34034150)`
  - `Selected: Baby Spider (60023855), Baby Spider (60023855), Baby Spider (60023855) from location 1`
  - `Step 4: Not simulated - commentary, not a game action`
  - `Step 5: Legal Activation of Small World (89558743)`
  - `Selected: Baby Spider (60023855) from location 2`
  - `Selected: Kumongous, the Sticky String Kaiju (29726552) from location 1`
  - `Selected: Mother Spider Splitter (34034150) from location 1`
  - `Step 6: Not simulated - commentary, not a game action`

### [ ] [T.G.](T.G. Deck Analysis.html) - Core Combo: Salamander + Serpent Ignition
- **File**: `T.G. Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Begin the Climb"
- **Written Step**: *"Synchro Summon the Level 5 T.G. Over Dragonar . Activate its effect to Special Summon both materials back from the GY, flooding the board and setting up further Synchro or Link plays."*
- **Engine Violation**: `Step 4 ("Synchro Summon the Level 5 T.G. Over Dragonar.") was not offered as a legal action by the duel engine. The only effect matching its wording was T.G. Limiter Removal's, and it did not move T.G. Over Dragonar. T.G. Over Dragonar is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of T.G. Rocket Salamander (77392987)`
  - `Step 2: Legal Activation of T.G. Limiter Removal (28189908) (matched by effect wording)`
  - `Selected: T.G. Striker (1315120) from location 2`
  - `Step 4: Transitioning to End Phase for remaining actions`
  - `Step 4: Legal Activation of T.G. Limiter Removal (28189908) (matched by effect wording)`
  - `Selected: T.G. Striker (1315120) from location 16`

### [ ] [The Agents](The Agents Deck Analysis.html) - Orchestrating the Cosmos: Core Combos
- **File**: `The Agents Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Synchro Summon"
- **Written Step**: *"Synchro Summon Masterflare Hyperion using Trias Hierarchia (Level 9) and Buten (Level 1). Masterflare can now start building the board."*
- **Engine Violation**: `Step 5 ("Synchro Summon Masterflare Hyperion using Trias Hierarchia (Level 9) and Buten (Level 1).") was not offered as a legal action by the duel engine. Masterflare Hyperion is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Diviner of the Herald (92919429)`
  - `Trigger Effect Accepted for Diviner of the Herald (92919429)`
  - `Selected: Trias Hierarchia (26866984) from location 1`

### [ ] [Trains](Trains Deck Analysis.html) - Blueprint for Victory: The Legacy Harvester Combo (Line 2)
- **File**: `Trains Deck Analysis.html`
- **Failed at**: Step 6 of 6
- **Step Title**: "Dozer Into Rank 5"
- **Written Step**: *"Activate Infinitrack Brutal Dozer 's effect, Tributing Infinitrack Harvester , to Special Summon it from your hand. Infinitrack Brutal Dozer 's effect Special Summons Infinitrack Trencher from your Deck. Xyz Summon Infinitrack River Stormer using Infinitrack Brutal Dozer and Infinitrack Trencher ."*
- **Engine Violation**: `Step 11 ("Xyz Summon Infinitrack River Stormer using Infinitrack Brutal Dozer and Infinitrack Trencher.") was not offered as a legal action by the duel engine. Infinitrack River Stormer is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Alternative choices tried and kept**: Flying Pegasus Railroad Stampede instead of Infinitrack Harvester; Infinitrack Brutal Dozer instead of Infinitrack Brutal Dozer
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Night Train Blue Traveler (81101309)`
  - `Selected: Revolving Switchyard (76136345) from location 1`
  - `Step 2: Legal Activation of Revolving Switchyard (76136345)`
  - `Step 3: Legal Activation of Revolving Switchyard (76136345)`
  - `Selected: Flying Pegasus Railroad Stampede (88875132) from location 2`
  - `Selected: Heavy Armored Knight Babeldecker (45116390) from location 1`
  - `Step 4: Legal Normal Summon of Heavy Armored Knight Babeldecker (45116390)`
  - `Trigger Effect Accepted for Heavy Armored Knight Babeldecker (45116390)`
  - `Selected: Infinitrack Harvester (35645105) from location 2`
  - `Trigger Effect Accepted for Infinitrack Harvester (35645105)`
  - `Selected: Infinitrack Brutal Dozer (76830505) from location 1`
  - `Step 5: Legal Activation of Night Train Blue Traveler (81101309)`
  - `Selected: Flying Pegasus Railroad Stampede (88875132) from location 16`
  - `Step 7: Legal Special Summon of Superdreadnought Rail Cannon Flying Launcher (38354018)`
  - `Trigger Effect Accepted for Superdreadnought Rail Cannon Flying Launcher (38354018)`
  - `Selected: Infinitrack Harvester (35645105) from location 1`
  - `Step 9: Legal Activation of Infinitrack Harvester (35645105)`
  - `Selected: Flying Pegasus Railroad Stampede (88875132) from location 4`
  - `Alternate choice near step 4: Flying Pegasus Railroad Stampede (instead of Infinitrack Harvester)`
  - `Alternate choice near step 5: Infinitrack Brutal Dozer (instead of Infinitrack Brutal Dozer)`

### [ ] [Trains](Trains Deck Analysis.html) - Blueprint for Victory: The Legacy Harvester Combo (Line 3)
- **File**: `Trains Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Xyz Summon & Full Search"
- **Written Step**: *"Overlay the Level 5 Dozer and Trencher to Xyz Summon Infinitrack River Stormer . Activate its effect (detaching 1) to search any EARTH Machine from your deck (e.g., Bullet Train for an OTK, or Machina Citadel for setup)."*
- **Engine Violation**: `Step 5 ("Overlay the Level 5 Dozer and Trencher to Xyz Summon Infinitrack River Stormer.") was not offered as a legal action by the duel engine. Infinitrack River Stormer is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Infinitrack Harvester (35645105)`
  - `Trigger Effect Accepted for Infinitrack Harvester (35645105)`
  - `Selected: Infinitrack Brutal Dozer (76830505) from location 1`

### [ ] [Ursarctic](Ursarctic Deck Analysis.html) - Core Combo
- **File**: `Ursarctic Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Negative Synchro Summon"
- **Written Step**: *"Activate Ursarctic Megatanus 's effect, Tributing Ursarctic Mikbilis from your hand, to Special Summon it. Special Summon Ursarctic Polari from your Extra Deck by sending Ursarctic Mikpolar and Ursarctic Megatanus to the GY. Ursarctic Polari 's effect activates Ursarctic Big Dipper from your Deck."*
- **Engine Violation**: `Step 3 ("Activate Ursarctic Megatanus 's effect, Tributing Ursarctic Mikbilis from your hand, to Special Summon it.") was not offered as a legal action by the duel engine. Ursarctic Megatanus is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Ursarctic Departure (16471775) (matched by effect wording)`
  - `Selected: Ursarctic Mikpolar (29537493) from location 2`
  - `Selected: Ursarctic Megatanus (54700519), Ursarctic Megatanus (54700519) from location 1`
  - `Step 3: Transitioning to End Phase for remaining actions`

### [ ] [Winged Dragon of Ra](Winged Dragon of Ra Deck Analysis.html) - Part IV: Sacred Combo Lines
- **File**: `Winged Dragon of Ra Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Activate Chant"
- **Written Step**: *"Activate Ancient Chant . Add "The Winged Dragon of Ra" to hand and gain an additional Tribute Summon."*
- **Engine Violation**: `Step 1 ("Activate Ancient Chant.") was not offered as a legal action by the duel engine. Ancient Chant is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

### [ ] [Xtra Hero](Xtra Hero Deck Analysis.html) - Core Combo: The "Faris" Full Extension
- **File**: `Xtra Hero Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon the Catalyst"
- **Written Step**: *"Use Vyon 's effect to send Destiny HERO - Malicious to the GY. Then, Link Summon Xtra HERO Cross Crusader using your two Vision HEROs."*
- **Engine Violation**: `Step 5 ("Link Summon Xtra HERO Cross Crusader using your two Vision HEROs.") was not offered as a legal action by the duel engine. The only effect matching its wording was Destiny HERO - Malicious's, and it did not move Xtra HERO Cross Crusader. Xtra HERO Cross Crusader is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Vision HERO Faris (18094166)`
  - `Selected: Destiny HERO - Malicious (9411399) from location 2`
  - `Trigger Effect Accepted for Vision HERO Faris (18094166)`
  - `Selected: Vision HERO Increase (22865492) from location 1`
  - `Step 5: Legal Activation of Destiny HERO - Malicious (9411399) (matched by effect wording)`
  - `Selected: Destiny HERO - Malicious (9411399) from location 1`

## Needs Review

The engine refused a step because a card it uses was never brought to the hand or field by an earlier step. Either the write-up skips a step (a search, a draw) or the harness picked a different card than the writer meant.

### [ ] [Beetrooper](Beetrooper Deck Analysis.html) - Core Combo
- **File**: `Beetrooper Deck Analysis.html`
- **Failed at**: Step 8 of 10
- **Step Title**: "Send in the Specialist"
- **Written Step**: *"Activate Giant Beetrooper Invincible Atlas 's effect: Tribute Beetrooper Armor Horn to Special Summon Beetrooper Sting Lancer from your Deck."*
- **Engine Violation**: `Step 8 ("Activate Giant Beetrooper Invincible Atlas 's effect: Tribute Beetrooper Armor Horn to Special Summon Beetrooper Sting Lancer from your Deck.") was not offered as a legal action by the duel engine. Giant Beetrooper Invincible Atlas is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Beetrooper Scout Buggy (2656842)`
  - `Trigger Effect Accepted for Beetrooper Scout Buggy (2656842)`
  - `Selected: Beetrooper Scout Buggy (2656842) from location 1`
  - `Chain Trigger Accepted for Beetrooper Scale Bomber (39041550)`
  - `Step 4: Legal Special Summon of Beetrooper Armor Horn (2834264)`
  - `Step 5: Legal Activation of Beetrooper Armor Horn (2834264)`
  - `Selected: Beetrooper Assault Roller (51578214) from location 2`
  - `Step 6: Legal Special Summon of Giant Beetrooper Invincible Atlas (38229962)`
  - `Step 7: Legal Activation of Beetrooper Armor Horn (2834264)`
  - `Selected: Beetrooper Assault Roller (51578214), Beetrooper Scout Buggy (2656842), Beetrooper Scale Bomber (39041550) from location 16`

### [ ] [Drytron](Drytron Deck Analysis.html) - Core Combo: Path to Ultimateness
- **File**: `Drytron Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Establish the Board"
- **Written Step**: *"Activate Meteonis Drytron , Tributing Drytron Alpha Thuban , to Ritual Summon Herald of Ultimateness from your hand."*
- **Engine Violation**: `Step 3 ("Activate Meteonis Drytron, Tributing Drytron Alpha Thuban, to Ritual Summon Herald of Ultimateness from your hand.") was not offered as a legal action by the duel engine. Meteonis Drytron is in the hand, but Herald of Ultimateness, which this step uses from the hand/GY, is still in the Deck: no earlier step added it.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Meteonis Drytron (22398665) (matched by effect wording)`
  - `Selected: Cyber Angel Benten (77235086) from location 2`

### [ ] [Flower Cardian](Flower Cardian Deck Analysis.html) - The Art of the Stack: Core Combo
- **File**: `Flower Cardian Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Climb and Loop"
- **Written Step**: *"Special Summon Flower Cardian Peony with Butterfly from your hand by Tributing Flower Cardian Cherry Blossom with Curtain . Flower Cardian Peony with Butterfly 's effect draws Flower Cardian Zebra Grass . Special Summon Flower Cardian Willow from your hand. Synchro Summon Flower Cardian Moonflowerviewing using Flower Cardian Peony with Butterfly , Flower Cardian Pine and Flower Cardian Willow ."*
- **Engine Violation**: `Step 6 ("Special Summon Flower Cardian Peony with Butterfly from your hand by Tributing Flower Cardian Cherry Blossom with Curtain.") was not offered as a legal action by the duel engine. The only effect matching its wording was Flower Cardian Willow's, and it did not move Flower Cardian Cherry Blossom or Flower Cardian Cherry Blossom with Curtain or Flower Cardian Peony with Butterfly. Flower Cardian Cherry Blossom is still in the Deck: no earlier step added it to the hand or field.`
- **Alternative choices tried and kept**: zone-m1 instead of zone-m2
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Flower Stacking (30786387)`
  - `Step 2: Legal Activation of Flower Cardian Cherry Blossom with Curtain (5489987)`
  - `Step 4: Legal Normal Summon of Flower Cardian Pine (81752019)`
  - `Step 6: Legal Activation of Flower Cardian Willow (54135423) (matched by effect wording)`
  - `Alternate choice near step 3: zone-m1 (instead of zone-m2)`

### [ ] [Gem-Knight](Gem-Knight Deck Analysis.html) - Core Combo: The OTK Path
- **File**: `Gem-Knight Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Summon the Diamonds"
- **Written Step**: *"Use Phantom Quartz to summon Gem-Knight Lady Brilliant Diamond , then use her effect to cheat out the main boss monster, Gem-Knight Master Diamond , and prepare for the final push."*
- **Engine Violation**: `Step 6 ("use her effect to cheat out the main boss monster, Gem-Knight Master Diamond, and prepare for the final push.") was not offered as a legal action by the duel engine. Gem-Knight Phantom Quartz is not in the Extra Deck any more (it is in the Monster Zone).`
- **Alternative choices tried and kept**: skip the optional effect of Gem-Knight Nepyrim instead of use the optional effect of Gem-Knight Nepyrim
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Gem-Knight Nepyrim (51831560)`
  - `Step 2: Legal Activation of Gem-Knight Nepyrim (51831560)`
  - `Selected: Gem-Knight Garnet (91731841) from location 2`
  - `Step 3: Legal Special Summon of Gem-Knight Phantom Quartz (24484270)`
  - `Trigger Effect Accepted for Gem-Knight Phantom Quartz (24484270)`
  - `Selected: Gem-Knight Fusion (1264319) from location 1`
  - `Step 5: Legal Activation of Gem-Knight Phantom Quartz (24484270)`
  - `Selected: Gem-Knight Citrine (67985943) from location 64`
  - `Alternate choice near step 2: skip the optional effect of Gem-Knight Nepyrim (instead of use the optional effect of Gem-Knight Nepyrim)`

### [ ] [Kuriboh](Kuriboh Deck Analysis.html) - Core Combo: The Five Star Twilight Power Play
- **File**: `Kuriboh Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Activate Five Star Twilight"
- **Written Step**: *"Activate Five Star Twilight : Tribute Flame Swordsman to Special Summon Kuribah, Kuribee, Kuriboo, Kuribeh and Kuriboh from your Deck."*
- **Engine Violation**: `Step 2 ("Activate Five Star Twilight : Tribute Flame Swordsman to Special Summon Kuribah, Kuribee, Kuriboo, Kuribeh and Kuriboh from your Deck.") was not offered as a legal action by the duel engine. Flame Swordsman is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Instant Fusion (1845204)`
  - `Selected: Flame Swordsman (45231177) from location 64`

### [ ] [Legendary Dragon](Legendary Dragon Deck Analysis.html) - Core Combo: The Path to the Knight of Destiny
- **File**: `Legendary Dragon Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Unleash the Heart"
- **Written Step**: *"Activate Legend of Heart : pay 2000 LP and Tribute Celtic Guardian to banish The Eye of Timaeus , The Claw of Hermos and The Fang of Critias from your hand and Special Summon Legendary Knight Timaeus , Legendary Knight Critias and Legendary Knight Hermos from your Deck."*
- **Engine Violation**: `Step 3 ("Special Summon Legendary Knight Timaeus, Legendary Knight Critias and Legendary Knight Hermos from your Deck.") was not offered as a legal action by the duel engine. Legendary Knight Timaeus is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Celtic Guardian (91152256)`
  - `Step 2: Legal Activation of The Claw of Hermos (46232525)`
  - `Selected: Celtic Guardian (91152256) from location 4`
  - `Selected: Goddess Bow (83743222) from location 64`

### [ ] [Majespecter](Majespecter Deck Analysis.html) - The Updated One-Card Line
- **File**: `Majespecter Deck Analysis.html`
- **Failed at**: Step 7 of 9
- **Written Step**: *"Activate Majespecter Wind , Tributing Majespecter Orthrus - Nue , to Special Summon Majespecter Toad - Ogama from your Deck."*
- **Engine Violation**: `Step 12 ("Activate Majespecter Wind, Tributing Majespecter Orthrus - Nue, to Special Summon Majespecter Toad - Ogama from your Deck.") was not offered as a legal action by the duel engine. Majespecter Orthrus - Nue is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Majespecter Raccoon - Bunbuku (31991800)`
  - `Trigger Effect Accepted for Majespecter Raccoon - Bunbuku (31991800)`
  - `Selected: Majespecter Porcupine - Yamarashi (51073802) from location 1`
  - `Chain Trigger Accepted for Majespecter Porcupine - Yamarashi (51073802)`
  - `Step 4: Legal Special Summon of Majespecter Orthrus - Nue (66384688)`
  - `Trigger Effect Accepted for Majespecter Orthrus - Nue (66384688)`
  - `Selected: Majespecter Raccoon - Bunbuku (31991800), Majespecter Porcupine - Yamarashi (51073802) from location 64`
  - `Step 6: Legal Activation of Majespecter Porcupine - Yamarashi (51073802)`
  - `Step 7: Legal Activation of Majespecter Raccoon - Bunbuku (31991800)`
  - `Step 8: Legal Pendulum Summon using the scale of Majespecter Porcupine - Yamarashi (51073802)`
  - `Chain Trigger Accepted for Majespecter Fox - Kyubi (94784213)`
  - `Chain Trigger Accepted for Majespecter Crow - Yata (68395509)`
  - `Selected: Majespecter Wind (51250293) from location 1`
  - `Selected: Majespecter Tempest (2572890) from location 1`
  - `Step 11: Legal Special Summon of Majespecter Draco - Ryu (3594985)`

### [ ] [Predaplant](Predaplant Deck Analysis.html) - Core Combo: The Scorpio Starter (Line 2)
- **File**: `Predaplant Deck Analysis.html`
- **Failed at**: Step 6 of 7
- **Step Title**: "Fusion Summon Starving Venom Fusion Dragon"
- **Written Step**: *"Activate Predaplant Bufolicula in your Pendulum Zone. Activate Predaplant Bufolicula 's effect to Fusion Summon Starving Venom Fusion Dragon using Predaplant Ambulomelides and Predaplant Ophrys Scorpio ."*
- **Engine Violation**: `Step 11 ("Activate Predaplant Bufolicula in your Pendulum Zone.") was not offered as a legal action by the duel engine. Predaplant Bufolicula is still in the Deck: no earlier step added it to the hand or field.`
- **Alternative choices tried and kept**: Predaplant Lilizard: Special Summon this card from your hand instead of Predaprimitive: Add 1 "Polymerization" Spell or "Fusion" Spell from your Deck to your hand
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Predaplant Ophrys Scorpio (35272499)`
  - `Trigger Effect Accepted for Predaplant Ophrys Scorpio (35272499)`
  - `Selected: Predaplant Byblisp (44932065) from location 2`
  - `Selected: Predaplant Darlingtonia Cobra (61677004) from location 1`
  - `Chain Trigger Accepted for Predaplant Darlingtonia Cobra (61677004)`
  - `Chain Trigger Accepted for Predaplant Byblisp (44932065)`
  - `Selected: Predaplant Drosophyllum Hydra (99913726) from location 1`
  - `Selected: Ultra Polymerization (76647978) from location 1`
  - `Step 6: Legal Activation of Ultra Polymerization (76647978)`
  - `Selected: Predaplant Ambulomelides (66309175) from location 64`
  - `Step 8: Legal Activation of Predaplant Lilizard (18595008) (matched by effect wording)`
  - `Selected: Polymerization (24094653) from location 1`
  - `Step 9: Legal Activation of Predaprimitive (89176044) (matched by effect wording)`
  - `Selected: Predaplant Longinephila (44994712) from location 1`
  - `Selected: Predaprime Fusion (8148322) from location 1`
  - `Alternate choice near step 8: Predaplant Lilizard: Special Summon this card from your hand (instead of Predaprimitive: Add 1 "Polymerization" Spell or "Fusion" Spell from your Deck to your hand)`

### [ ] [Rikka](Rikka Deck Analysis.html) - Core Combo: The "Petal" Starter
- **File**: `Rikka Deck Analysis.html`
- **Failed at**: Step 2 of 2
- **Step Title**: "Tribute & Search Field Spell"
- **Written Step**: *"Activate Mudan the Rikka Fairy 's effect, Tributing Rikka Petal , to Special Summon it from your hand. Mudan the Rikka Fairy 's effect adds Rikka Konkon from your Deck to your hand. Activate Rikka Konkon . Activate Rikka Konkon 's effect to Set Rikka Sheet from your Deck."*
- **Engine Violation**: `Step 5 ("Activate Rikka Konkon.") was not offered as a legal action by the duel engine. Rikka Konkon is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Rikka Petal (71734607)`
  - `Step 2: Legal Activation of Rikka Petal (71734607)`
  - `Selected: Mudan the Rikka Fairy (71002019) from location 1`
  - `Step 3: Legal Activation of Rikka Glamour (69164989) (matched by effect wording)`
  - `Selected: Mudan the Rikka Fairy (71002019) from location 1`

### [ ] [Shiranui](Shiranui Deck Analysis.html) - Core Combo
- **File**: `Shiranui Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Opening the Netherworld"
- **Written Step**: *"Use Uni-Zombie 's effect twice, sending Mezuki and Shiranui Spectralsword from Deck to GY."*
- **Engine Violation**: `Step 3 ("Use Uni-Zombie 's effect twice, sending Mezuki and Shiranui Spectralsword from Deck to GY.") was not offered as a legal action by the duel engine. Uni-Zombie is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Shiranui Solitaire (94801854)`

### [ ] [Sylvan Deck Analyis](Sylvan Deck Analyis.html) - Cultivating a Combo
- **File**: `Sylvan Deck Analyis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "The Payoff: Excavate & Summon"
- **Written Step**: *"Activate Sylvan Hermitree 's effect to excavate Sylvan Princessprout , sending it to the GY, and draw 1 card. Sylvan Princessprout 's effect Special Summons it from your GY as a Level 8 monster. Xyz Summon Alsei, the Sylvan High Protector using Sylvan Hermitree and Sylvan Princessprout ."*
- **Engine Violation**: `Step 5 ("Activate Sylvan Hermitree 's effect to excavate Sylvan Princessprout, sending it to the GY, and draw 1 card.") was not offered as a legal action by the duel engine. Sylvan Hermitree is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Lonefire Blossom (48686504)`
  - `Step 3: Legal Activation of Sylvan Charity (82016179)`
  - `Selected: Sylvan Princessprout (20579538) from location 2`
  - `Selected: Sylvan Hermitree (25824484) from location 2`

## Could Not Verify

Not evidence of an illegal play: the replay stopped after a step the engine could not simulate from the prose (examples, opponent-dependent steps, unidentified cards), so later failures may just reflect that step.

- [ ] [Appliancer](Appliancer Deck Analysis.html) - Core Combo: The Codebreaker Pivot: stopped at Step 3 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references); Step 2: describes an effect resolving rather than an action to take
- [ ] [Chaos](Chaos Deck Analysis.html) - Core Combo: The Path to Synchro Dominance (Line 2): stopped at Step 3 of 4. Step 1: the engine has no script for a card in this step
- [ ] [Destiny Hero](Destiny Hero Deck Analysis.html) - Core Combo: Vision HERO Faris + 1 HERO: stopped at Step 3 of 3. Step 2: describes an effect resolving rather than an action to take
- [ ] [Evol](Evol Deck Analysis.html) - Core Combo Paths (Line 2): stopped at Step 3 of 3. Step 2: describes an effect resolving rather than an action to take
- [ ] [Pendulum Pile](Pendulum Pile Deck Analysis.html) - Combo Lines (Line 2): stopped at Step 7 of 8. Step 6: step is not specific enough to replay (examples, "any", cross-references)

## Partially Verified

Every step the engine could simulate was legal. The steps listed were not simulated.

- [Blackwing](Blackwing Deck Analysis.html) - Core Combo: The Simoon 1.5-Card Line: Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Code Breaker](Code Breaker Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Dracotail](Dracotail Archetype Breakdown.html) - Core Combo (Line 7): Step 2 (describes an effect resolving rather than an action to take)
- [Hecahands](Hecahands Deck Analysis.html) - Core Combo: Step 3 (depends on the opponent's cards, turn or battle)
- [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 2): Step 4 (depends on the opponent's cards, turn or battle)
- [Invoked](Invoked Deck Analysis.html) - Strategic Combo Lines (Line 2): Step 4 (step is not specific enough to replay (examples, "any", cross-references))
- [Kaiser Glider](Kaiser Glider Deck Analysis.html) - Primary Combo: The "Lair of Darkness" Removal: Step 3 (depends on the opponent's cards, turn or battle)
- [Obelisk the Tormentor](Obelisk the Tormentor Deck Analysis.html) - Core Combos & Synergistic Engines (Line 2): Step 3 (depends on the opponent's cards, turn or battle)
- [P series](P series Deck Analysis.html) - Making It on Your Own Turn: Step 2 (no card in the step could be identified); Step 2 (no card in the step could be identified); Step 4 (no card in the step could be identified)
- [Synchron](Synchron Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))

