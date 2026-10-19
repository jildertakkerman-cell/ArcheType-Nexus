# Headless Yu-Gi-Oh! OCGCore HTML Combo Audit

Generated: Mon, 19 Oct 2026 14:48:26 GMT

### Summary
- **Pages Audited**: 409
- **Total Combos Audited**: 539
- **Total Steps Audited**: 1809
- **100% Legal Confirmed**: 295
- **Partially Verified** (no illegal play found; some prose steps could not be simulated): 110
- **Likely Illegal** (the card was in place and the engine refused the action): 48
- **Needs Review** (a card the step uses never reached the hand/field, or the harness crashed): 40
- **Could Not Verify** (stopped after a step the engine could not simulate): 46
- **Unofficial / Custom Skipped**: 0

## Likely Illegal Plays

### [ ] [Adamancipator](Adamancipator Archetype Breakdown.html) - Core Combo: The "Block Dragon Turbo" Strategy (Historical)
- **File**: `Adamancipator Archetype Breakdown.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Search for Block Dragon"
- **Written Step**: *"Use the monsters you have to Xyz Summon Gallant Granite . Activate its effect to search for Block Dragon ( currently banned ) from your deck, securing a massive resource boost."*
- **Engine Violation**: `Step 4 ("Use the monsters you have to Xyz Summon Gallant Granite.") was not offered as a legal action by the duel engine. The only effect matching its wording was Adamancipator Seeker's, and it did not move Gallant Granite. Gallant Granite is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Adamancipator Analyzer (11302671)`
  - `Step 2: Legal Activation of Adamancipator Analyzer (11302671)`
  - `Step 3: Legal Activation of Adamancipator Researcher (85914562)`
  - `Step 4: Legal Activation of Adamancipator Seeker (48519867) (matched by effect wording)`

### [ ] [Alien](Alien Archetype Breakdown.html) - Key Combo Walkthrough: The "Zer'oll Lock"
- **File**: `Alien Archetype Breakdown.html`
- **Failed at**: Step 3 of 4
- **Step Title**: "Link Summon Zer'oll"
- **Written Step**: *"Use the summoned monsters to Link Summon the key boss monster, Cosmic Slicer Zer'oll . Its effect can then search for an A-Counter placer."*
- **Engine Violation**: `Step 4 ("Use the summoned monsters to Link Summon the key boss monster, Cosmic Slicer Zer'oll.") was not offered as a legal action by the duel engine. Cosmic Slicer Zer'oll is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Snake Rain (17189677)`
  - `Selected: Alien Ammonite (652362) from location 2`
  - `Selected: Nauya, the Ogdoadic Remnant (62405028), Nunu, the Ogdoadic Remnant (36010310), Alien Kid (64160836), Nauya, the Ogdoadic Remnant (62405028) from location 1`

### [ ] [Altergeist](Altergeist Deck Analysis.html) - Core Combo Line: Multi-Layered Lock Setup
- **File**: `Altergeist Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Convert to Link-2"
- **Written Step**: *"Use Marionetter and another Altergeist to Link Summon Altergeist Hexstia . Hexstia's effect searches for Altergeist Multifaker , preparing your key extender."*
- **Engine Violation**: `Step 4 ("Use Marionetter and another Altergeist to Link Summon Altergeist Hexstia.") was not offered as a legal action by the duel engine. Altergeist Hexstia is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Altergeist Marionetter (53143898)`
  - `Trigger Effect Accepted for Altergeist Marionetter (53143898)`
  - `Selected: Altergeist Protocol (27541563) from location 1`

### [ ] [Aroma](Aroma Deck Analysis.html) - Core Combo: The Sunseed Genius Loci Starter
- **File**: `Aroma Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Trigger LP Gain"
- **Written Step**: *"Summon Sunvine Healer and use its effect to gain 300 LP. This mandatory LP gain is the most reliable way to trigger your Aroma effects during the combo."*
- **Engine Violation**: `Step 4 ("Summon Sunvine Healer") was not offered as a legal action by the duel engine. Sunvine Healer is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Sunseed Genius Loci (27520594)`
  - `Step 2: Legal Special Summon of Sunavalon Dryas (93896655)`

### [ ] [Butterspy](Butterspy Deck Analysis.html) - Core Combo: The Isolde Line
- **File**: `Butterspy Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Extend the Swarm"
- **Written Step**: *"Use Isolde's second effect, sending 4 Equip Spells to the GY, to Special Summon Moonlit Papillon from the deck."*
- **Engine Violation**: `Step 3 ("Use Isolde's second effect, sending 4 Equip Spells to the GY, to Special Summon Moonlit Papillon from the deck.") was not offered as a legal action by the duel engine. Isolde, Two Tales of the Noble Knights is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`

### [ ] [Code Talker](Code Talker Deck Analysis.html) - Standard Combo Protocol (Line 2)
- **File**: `Code Talker Deck Analysis.html`
- **Failed at**: Step 1 of 4
- **Step Title**: "Climb, hold a zone"
- **Written Step**: *"Link Summon Integration into the Extra Monster Zone. Keep one monster in a zone its bottom arrows point at."*
- **Engine Violation**: `Step 1 ("Link Summon Integration into the Extra Monster Zone.") was not offered as a legal action by the duel engine. Decode Talker Integration is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`

### [ ] [Constellar](Constellar Deck Analysis.html) - Glorious Gallery Combos (Line 2)
- **File**: `Constellar Deck Analysis.html`
- **Failed at**: Step 7 of 8
- **Step Title**: "Xyz Summon Ptolemaeus"
- **Written Step**: *"Overlay Cygnian, Lyran and Constellar Caduceus for Tellarknight Ptolemaeus with 3 materials."*
- **Engine Violation**: `Step 14 ("Overlay Cygnian, Lyran and Constellar Caduceus for Tellarknight Ptolemaeus with 3 materials.") was not offered as a legal action by the duel engine. Tellarknight Ptolemaeus is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Alternative choices tried and kept**: Constellar Tellarknights instead of Constellar Star Chart; Tellarknight Altairan instead of Tellarknight Cygnian
- **Prior Legal Plays**:
  - `Step 4: Legal Activation of Stellarnova Bonds (69678646)`
  - `Selected: Constellar Castor (33302589) from location 2`
  - `Selected: Constellar Caduceus (82913020) from location 1`
  - `Step 6: Legal Activation of Constellar Caduceus (82913020)`
  - `Selected: Constellar Tellarknights (10125011) from location 1`
  - `Step 7: Legal Activation of Constellar Tellarknights (10125011) (matched by effect wording)`
  - `Selected: Constellar Castor (33302589) from location 16`
  - `Trigger Effect Accepted for Constellar Castor (33302589)`
  - `Selected: Tellarknight Lyran (79210531) from location 1`
  - `Trigger Effect Accepted for Tellarknight Lyran (79210531)`
  - `Selected: Constellar Tellarknights (10125011) from location 1`
  - `Step 9: Legal Special Summon of Tellarknight Constellar Delteros (32289031)`
  - `Auto-activating on-field effect of Tellarknight Constellar Delteros (32289031) to complete Step 9`
  - `Selected: Tellarknight Lyran (79210531) from location 4`
  - `Selected: Tellarknight Cygnian (60700283) from location 1`
  - `Selected: Tellarknight Altairan (42822433) from location 2`
  - `Trigger Effect Accepted for Tellarknight Altairan (42822433)`
  - `Selected: Tellarknight Constellar Delteros (32289031) from location 4`
  - `Alternate choice near step 7: Constellar Tellarknights (instead of Constellar Star Chart)`
  - `Alternate choice near step 10: Tellarknight Altairan (instead of Tellarknight Cygnian)`

### [ ] [Crystron](Crystron Deck Analysis.html) - Blueprint Combo: Smiger/Inclusion Route (1.5 Card)
- **File**: `Crystron Deck Analysis.html`
- **Failed at**: Step 12 of 14
- **Written Step**: *"Action: XYZ Summon Cyber Dragon Nova."*
- **Engine Violation**: `Step 12 ("XYZ Summon Cyber Dragon Nova.") was not offered as a legal action by the duel engine. Cyber Dragon Nova is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Alternative choices tried and kept**: Crystron Sulfador instead of Crystron Tristaros
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Crystron Smiger (83443619)`
  - `Step 2: Legal Special Summon of Clockwork Knight (41739381)`
  - `Step 3: Legal Activation of Crystron Smiger (83443619)`
  - `Selected: Crystron Inclusion (31552317) from location 1`
  - `Step 4: Legal Activation of Crystron Inclusion (31552317)`
  - `Selected: Crystron Sulfador (25865565) from location 1`
  - `Step 5: Legal Activation of Crystron Sulfador (25865565)`
  - `Selected: Crystron Inclusion (31552317) from location 8`
  - `Trigger Effect Accepted for Crystron Sulfador (25865565)`
  - `Step 7: Legal Activation of Crystron Inclusion (31552317)`
  - `Selected: Crystron Tristaros (99471856) from location 16`
  - `Step 8: Legal Special Summon of Crystron Eleskeletus (47736165)`
  - `Trigger Effect Accepted for Crystron Eleskeletus (47736165)`
  - `Selected: Crystron Sulfador (25865565) from location 16`
  - `Step 10: Legal Activation of Crystron Tristaros (99471856)`
  - `Selected: Crystron Eleskeletus (47736165) from location 4`
  - `Selected: Crystron Tristaros (99471856), Crystron Sulfefnir (3422200) from location 1`
  - `Trigger Effect Accepted for Crystron Eleskeletus (47736165)`
  - `Selected: Crystron Eleskeletus (47736165) from location 16`
  - `Alternate choice near step 10: Crystron Sulfador (instead of Crystron Tristaros)`

### [ ] [Dark Scorpion](Dark Scorpion Deck Analysis.html) - Core Combo: The Isolde to Bardiche Line
- **File**: `Dark Scorpion Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon Isolde & Extend"
- **Written Step**: *"Link Summon Isolde, Two Tales of the Noble Knights ( currently banned ). Use her effects to search for a Warrior and Special Summon another from the deck by sending Equip Spells to the GY, often bringing out Dark Scorpion - Cliff the Trap Remover ."*
- **Engine Violation**: `Step 3 ("Link Summon Isolde, Two Tales of the Noble Knights ( currently banned ).") was not offered as a legal action by the duel engine. Isolde, Two Tales of the Noble Knights is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Not simulated - commentary, not a game action`

### [ ] [Djinn](Djinn Deck Analysis.html) - The Lines That Matter
- **File**: `Djinn Deck Analysis.html`
- **Failed at**: Step 3 of 6
- **Written Step**: *"Field a second Level 3 pair with an extender such as Zubababancho Gagagacoat and Xyz Summon Muzurhythm the String Djinn ."*
- **Engine Violation**: `Step 5 ("Xyz Summon Muzurhythm the String Djinn.") was not offered as a legal action by the duel engine. Muzurhythm the String Djinn is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Gagaga Magician - Gagaga Magic (12908094)`
  - `Selected: Gagaga Girl (3606728) from location 2`
  - `Selected: Melomelody the Brass Djinn (88942504) from location 64`
  - `Step 4: Not simulated - commentary, not a game action`

### [ ] [Dragonmaid](Dragonmaid Deck Analysis.html) - Core Combo: One-Card Starters
- **File**: `Dragonmaid Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "Set Up Fusion Materials"
- **Written Step**: *"Activate Dragonmaid Hospitality . Send Chamber to GY, then use Hospitality to summon her back while sending Dragonmaid Laundry (her Dragon form) to the GY. You now have two same-Attribute monsters with different Levels�valid materials for House Dragonmaid."*
- **Engine Violation**: `Step 5 ("use Hospitality to summon her back while sending Dragonmaid Laundry (her Dragon form) to the GY.") was not offered as a legal action by the duel engine. Dragonmaid Hospitality is in the GY, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Chamber Dragonmaid (32600024)`
  - `Trigger Effect Accepted for Chamber Dragonmaid (32600024)`
  - `Selected: Dragonmaid Hospitality (78231355) from location 1`
  - `Step 3: Legal Activation of Dragonmaid Hospitality (78231355)`
  - `Selected: Parlor Dragonmaid (88453933) from location 2`
  - `Selected: Dragonmaid Lorpar (15848542) from location 1`
  - `Trigger Effect Accepted for Parlor Dragonmaid (88453933)`
  - `Selected: Chamber Dragonmaid (32600024) from location 1`

### [ ] [Dragunity](Dragunity Deck Analysis.html) - Core Combo: The 1-Card Remus Line (Line 2)
- **File**: `Dragunity Deck Analysis.html`
- **Failed at**: Step 1 of 5
- **Step Title**: "Link Summon Georgius"
- **Written Step**: *"Link Summon Dragunity Lord - Georgius using your accumulated field presence."*
- **Engine Violation**: `Step 1 ("Link Summon Dragunity Lord - Georgius using your accumulated field presence.") was not offered as a legal action by the duel engine. The only effect matching its wording was Dragunity Falchion's, and it did not move Dragunity Lord - Georgius. Dragunity Lord - Georgius is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Dragunity Falchion (8039562) (matched by effect wording)`
  - `Selected: Dragunity Remus (26577155) from location 4`
  - `Selected: Dragunity Arma Mystletainn (876330) from location 1`

### [ ] [Dragunity](Dragunity Deck Analysis.html) - Core Combo: The 1-Card Remus Line (Line 3)
- **File**: `Dragunity Deck Analysis.html`
- **Failed at**: Step 2 of 7
- **Step Title**: "First Ascent — Gae Dearg"
- **Written Step**: *"Special Summon Legatus (Ravine on field), revive Remus . Synchro into Dragunity Knight - Gae Dearg . Add Mist Valley Baby Roc , discard it — Baby Roc Special Summons itself."*
- **Engine Violation**: `Step 4 ("Synchro into Dragunity Knight - Gae Dearg.") was not offered as a legal action by the duel engine. Dragunity Knight - Gae Dearg is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Dragunity Remus (26577155)`
  - `Step 2: Legal Activation of Dragon Ravine (62265044)`
  - `Step 2: Legal Activation of Dragon Ravine's effect (62265044)`
  - `Selected: Dragon Ravine (62265044) from location 2`
  - `Selected: Dragunity Legatus (89172051) from location 1`
  - `Step 3: Legal Activation of Dragunity Legatus (89172051)`

### [ ] [Evol](Evol Deck Analysis.html) - Core Combo Paths (Line 2)
- **File**: `Evol Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Reactive Disruption"
- **Written Step**: *"End turn with Lios and the Set Trap. During the opponent's turn, use Singularity targeting an Evoltile and Evolsaur in GY to summon an Evolzar for disruption."*
- **Engine Violation**: `Step 4 ("use Singularity targeting an Evoltile and Evolsaur in GY to summon an Evolzar for disruption.") was not offered as a legal action by the duel engine. The only effect matching its wording was Evolsaur Lios's, and it did not move Evo-Singularity. Evo-Singularity is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Evolsaur Lios (15171722)`
  - `Trigger Effect Accepted for Evolsaur Lios (15171722)`
  - `Selected: Evo-Singularity (74100225) from location 1`
  - `Passing turn to opponent for opponent-turn action`
  - `Step 4: Legal Activation of Evolsaur Lios (15171722) (matched by effect wording)`
  - `Selected: Evolsaur Lios (15171722) from location 1`

### [ ] [Fabled](Fabled Deck Analysis.html) - Core Combo: The Kushano Loop
- **File**: `Fabled Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Summon Gammajin"
- **Written Step**: *"Start your combo by Synchro Summoning Fabled Gammajin . Its on-summon effect lets you Special Summon Fabled Kushano directly from your Deck."*
- **Engine Violation**: `Step 1 ("Start your combo by Synchro Summoning Fabled Gammajin.") was not offered as a legal action by the duel engine. The only effect matching its wording was The Fabled Behilmoth's, and it did not move Fabled Gammajin. Fabled Gammajin is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of The Fabled Behilmoth (68897338) (matched by effect wording)`
  - `Selected: Fabled Ragin (47395382) from location 64`

### [ ] [Firewall](Firewall Deck Analysis.html) - Core Combo
- **File**: `Firewall Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "The Summit"
- **Written Step**: *"Use Sage to fuse into Diplexer Chimera and synchro (if able). Climb through Splash Mage and Transcode Talker. End on Terahertz (sending Desavewurm) and set up Superfactorial ."*
- **Engine Violation**: `Step 7 ("Use Sage to fuse into Diplexer Chimera and synchro (if able).") was not offered as a legal action by the duel engine. Diplexer Chimera is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Firewall Defenser (20455229)`
  - `Step 2: Legal Special Summon of Linguriboh (24842059)`
  - `Trigger Effect Accepted for Firewall Defenser (20455229)`
  - `Selected: Firewall Guardian (86605184) from location 1`
  - `Step 4: Legal Special Summon of Cyberse Wicckid (52698008)`
  - `Trigger Effect Accepted for Firewall Guardian (86605184)`
  - `Trigger Effect Accepted for Cyberse Wicckid (52698008)`
  - `Selected: Linguriboh (24842059) from location 16`
  - `Selected: Cyberse Sage (65037172) from location 1`

### [ ] [Fossil](Fossil Deck Analysis.html) - Core Combo: The OTK Blueprint
- **File**: `Fossil Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "The Fusion Summon"
- **Written Step**: *"Activate Fossil Fusion . Banish a Rock monster from your GY and a high-level monster from the opponent's GY to summon Fossil Dragon Skullgios ."*
- **Engine Violation**: `Step 3 ("Activate Fossil Fusion.") was not offered as a legal action by the duel engine. Fossil Fusion is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Miracle Rupture (44297127)`
  - `Selected: Weathering Soldier (23147658) from location 1`
  - `Trigger Effect Accepted for Weathering Soldier (23147658)`
  - `Selected: Fossil Fusion (59419719) from location 1`

### [ ] [Gold Pride](Gold Pride Deck Analysis.html) - Core Combo: The P.U.N.K. Engine Starter
- **File**: `Gold Pride Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Start the P.U.N.K. Engine"
- **Written Step**: *"Normal Summon Ze Amin . Pay LP to search and extend into the P.U.N.K. engine, ultimately summoning Ukiyoe-P.U.N.K. Rising Carp ."*
- **Engine Violation**: `Step 2 ("Pay LP to search and extend into the P.U.N.K. engine, ultimately summoning Ukiyoe-P.U.N.K. Rising Carp.") was not offered as a legal action by the duel engine. The only effect matching its wording was Gold Pride - The Crowd Goes Wild!'s, and it did not move Ukiyoe-P.U.N.K. Rising Carp. Ukiyoe-P.U.N.K. Rising Carp is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Noh-P.U.N.K. Ze Amin (19535693)`
  - `Step 2: Legal Activation of Gold Pride - The Crowd Goes Wild! (95283172) (matched by effect wording)`
  - `Selected: Gold Pride - Roller Baller (92003832) from location 2`
  - `Selected: Gold Pride - Leon (23512906) from location 1`
  - `Selected: Gold Pride - Roller Baller (92003832) from location 2`

### [ ] [Gouki](Gouki Deck Analysis.html) - Core Combo Walkthroughs (Line 3)
- **File**: `Gouki Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "The Loop Enabler"
- **Written Step**: *"Use Gouki Re-Match (searched earlier) to revive 2 Goukis. Link climb into the Pre-Errata Firewall Dragon . Its non-HOPT Special Summon effect is now live."*
- **Engine Violation**: `Step 4 ("Use Gouki Re-Match (searched earlier) to revive 2 Goukis.") was not offered as a legal action by the duel engine. Gouki Re-Match is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Gouki Machine Suprex (29099860)`
  - `Selected: Gouki Suprex (24073068) from location 2`

### [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo
- **File**: `Hecahands Deck Analysis.html`
- **Failed at**: Step 2 of 5
- **Step Title**: "Fusion Summon Dandalos"
- **Written Step**: *"Fusion Summon Hecahands Dandalos using Makibel and the in-hand card. This fusion is un-targetable by on-field negates (Imperm/Veiler)."*
- **Engine Violation**: `Step 4 ("Fusion Summon Hecahands Dandalos using Makibel and the in-hand card.") was not offered as a legal action by the duel engine. The only effect matching its wording was The Hidden Hecahands's, and it did not move Hecahands Dandalos. Hecahands Dandalos is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Hecahands Makibel (18321034)`
  - `Selected: Hecahands Jauzah (67021206) from location 64`
  - `Step 2: Legal Activation of Hecahands Ibtel (95365081)`
  - `Selected: Hecahands Yadel (32759190) from location 1`
  - `Step 4: Legal Activation of The Hidden Hecahands (20415050) (matched by effect wording)`
  - `Selected: Hecahands Yadel (32759190) from location 4`
  - `Selected: Hecahands Ibtel (95365081) from location 1`
  - `Selected: Yad'al-Hecahands (29792472) from location 1`
  - `Trigger Effect Accepted for Hecahands Yadel (32759190)`
  - `Selected: The Hidden Hecahands (20415050) from location 16`

### [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 2)
- **File**: `Hecahands Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "Ibtel → Yadel Chain"
- **Written Step**: *"Shuffle Ibtel → SS Yadel → Search Hecahands Tartaros ."*
- **Engine Violation**: `Step 3 ("Shuffle Ibtel") was not offered as a legal action by the duel engine. Hecahands Ibtel is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Special Summon of Nightmare Apprentice (58143852)`
  - `Selected: Hecahands Yadel (32759190) from location 2`
  - `Trigger Effect Accepted for Nightmare Apprentice (58143852)`
  - `Selected: Hecahands Ibtel (95365081) from location 1`

### [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 5)
- **File**: `Hecahands Deck Analysis.html`
- **Failed at**: Step 1 of 5
- **Step Title**: "Link into Requiem"
- **Written Step**: *"Link Berfomet → Fiendsmith Requiem ."*
- **Engine Violation**: `Step 1 ("Link Berfomet → Fiendsmith Requiem.") was not offered as a legal action by the duel engine. Berfomet is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

### [ ] [Ignister](Ignister Archetype Breakdown.html) - Strategic Combo Lines (Post-Banlist)
- **File**: `Ignister Archetype Breakdown.html`
- **Failed at**: Step 1 of 4
- **Step Title**: "The Setup"
- **Written Step**: *"NS Achichi -> Search Pikari . Link into Dark Infant to search A.I.Land . Use Land to SS Pikari -> Search A.I. Meet You . Reveal Templar to add Doyon ."*
- **Engine Violation**: `Step 6 ("Reveal Templar to add Doyon.") was not offered as a legal action by the duel engine. Dark Templar @Ignister is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Achichi @Ignister (15808381)`
  - `Trigger Effect Accepted for Achichi @Ignister (15808381)`
  - `Selected: Pikari @Ignister (16020923) from location 1`
  - `Step 3: Legal Special Summon of Dark Infant @Ignister (74567889)`
  - `Trigger Effect Accepted for Dark Infant @Ignister (74567889)`
  - `Selected: Ignister A.I.Land (59054773) from location 1`

### [ ] [Ignister](Ignister Archetype Breakdown.html) - Strategic Combo Lines (Post-Banlist) (Line 3)
- **File**: `Ignister Archetype Breakdown.html`
- **Failed at**: Step 2 of 2
- **Step Title**: "Extension & Rip"
- **Written Step**: *"Search Superfactorial . Tribute Alembertian to SS a Level 4 from hand/GY. Use these bodies for Templar. Set Superfactorial for opponent's turn (Laplacian hand rip)."*
- **Engine Violation**: `Step 6 ("Use these bodies for Templar.") was not offered as a legal action by the duel engine. Dark Templar @Ignister is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Mathmech Circular (36521307)`
  - `Selected: Mathmech Sigma (27182739) from location 1`
  - `Step 2: Legal Activation of Mathmech Sigma (27182739)`
  - `Trigger Effect Accepted for Mathmech Circular (36521307)`
  - `Selected: Mathmech Superfactorial (87804365) from location 1`
  - `Step 3: Legal Special Summon of Primathmech Alembertian (85692042)`
  - `Trigger Effect Accepted for Primathmech Alembertian (85692042)`
  - `Selected: Mathmech Circular (36521307), Mathmech Sigma (27182739) from location 4`
  - `Selected: Mathmech Superfactorial (87804365) from location 1`
  - `Step 5: Legal Activation of Primathmech Alembertian (85692042)`
  - `Selected: Mathmech Sigma (27182739) from location 2`

### [ ] [Infernal](Infernal Deck Analysis.html) - Combo Execution: Accessing Pyro Strategies
- **File**: `Infernal Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Summon Banshee"
- **Written Step**: *"Summon any two Level 4 monsters (e.g., from a Superheavy Samurai engine) and Xyz Summon Infernal Flame Banshee ."*
- **Engine Violation**: `Step 2 ("Xyz Summon Infernal Flame Banshee.") was not offered as a legal action by the duel engine. Infernal Flame Banshee is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Infernal Flame Emperor (19847532)`

### [ ] [Infernoid](Infernoid Deck Analysis.html) - Core Combo Walkthrough (Line 2)
- **File**: `Infernoid Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "The Surgical Mill"
- **Written Step**: *"Activate Evil 's effect: banish an Infernoid from your GY to mill 'Noids with different names equal to its Level. The prime target is Infernoid Attondel ( 8 ) or Seitsemas ( 7 ), which are often sent to the GY beforehand by Decatron or Foolish Burial . This mills 7-8 key names, including Onuncu and Devyaty ."*
- **Engine Violation**: `Step 3 ("Activate Evil 's effect: banish an Infernoid from your GY to mill 'Noids with different names equal to its Level.") was not offered as a legal action by the duel engine. Infernoid Evil is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Infernoid Decatron (58446973)`
  - `Trigger Effect Accepted for Infernoid Decatron (58446973)`
  - `Selected: Infernoid Attondel (88301393) from location 1`

### [ ] [Invoked](Invoked Deck Analysis.html) - Strategic Combo Lines (Line 3)
- **File**: `Invoked Deck Analysis.html`
- **Failed at**: Step 1 of 5
- **Written Step**: *"Link into Salamangreat Almiraj , activate Invocation , fuse Aleister + Almiraj into Invoked Sorath ."*
- **Engine Violation**: `Step 1 ("Link into Salamangreat Almiraj") was not offered as a legal action by the duel engine. Salamangreat Almiraj is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`

### [ ] [K9](K9 Deck Analysis.html) - Interactive Combo Replays
- **File**: `K9 Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Activate & Destroy"
- **Written Step**: *"On opponent's turn, activate Forced Release . Summon K9-X "Ripper/M" using the Rank 5. Destroy 1 card immediately upon resolution."*
- **Engine Violation**: `Step 5 ("activate Forced Release.") was not offered as a legal action by the duel engine. K9-X Forced Release is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 2: Not simulated - commentary, not a game action`
  - `Step 4: Legal Spell/Trap Set of K9-X Forced Release (53792930)`
  - `Passing turn to opponent for opponent-turn action`

### [ ] [Malefic](Malefic Deck Analysis.html) - The 2026 Combo Lines (Line 2)
- **File**: `Malefic Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Cheat the Body"
- **Written Step**: *"Special Summon Malefic Paradigm Dragon from your Deck in Defense Position, ignoring its Summoning conditions. No counterpart is banished, so the originals never have to sit in your list."*
- **Engine Violation**: `Step 5 ("Special Summon Malefic Paradigm Dragon from your Deck in Defense Position, ignoring its Summoning conditions.") was not offered as a legal action by the duel engine. Malefic Paradigm Dragon is in the GY, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Chain Trigger Accepted for Malefic Paradigm Shift (5125629)`
  - `Selected: Malefic World (27564031) from location 1`
  - `Selected: Malefic Paradigm Dragon (16958382) from location 1`
  - `Step 2: Not simulated - commentary, not a game action`
  - `Step 4: Legal Activation of Malefic Territory (75223115)`
  - `Selected: Malefic World (27564031) from location 1`

### [ ] [Malefic](Malefic Deck Analysis.html) - The 2026 Combo Lines (Line 3)
- **File**: `Malefic Deck Analysis.html`
- **Failed at**: Step 1 of 7
- **Step Title**: "The Starter"
- **Written Step**: *"Normal Summon Malefic Paradox Gear and Tribute it: Special Summon Malefic Parallel Gear from the Deck and add Malefic Stardust Dragon to your hand."*
- **Engine Violation**: `Step 2 ("Tribute it: Special Summon Malefic Parallel Gear from the Deck and add Malefic Stardust Dragon to your hand.") was not offered as a legal action by the duel engine. Malefic Paradox Gear is in the Monster Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Malefic Paradox Gear (48829461)`

### [ ] [Mayakashi](Mayakashi Deck Analysis.html) - Core Combo
- **File**: `Mayakashi Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "The Link Culmination"
- **Written Step**: *"After reaching your final Synchro, use it and the revived Dakki to Link Summon into the powerful Mayakashi Link monsters."*
- **Engine Violation**: `Step 3 ("After reaching your final Synchro, use it and the revived Dakki to Link Summon into the powerful Mayakashi Link monsters.") was not offered as a legal action by the duel engine. Yuki-Onna, the Icicle Mayakashi is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Not simulated - commentary, not a game action`

### [ ] [Mega Phantom Beast](Mega Phantom Beast Deck Analysis.html) - Core Combo: Tetherwolf to Rank 10
- **File**: `Mega Phantom Beast Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Extension & Swarm"
- **Written Step**: *"Use effects to summon Harrliard and Coltwing . A common sequence involves using Harrliard to tribute tokens and bring out other MPBs from hand, triggering multiple effects that flood the board."*
- **Engine Violation**: `Step 3 ("Use effects to summon Harrliard and Coltwing.") was not offered as a legal action by the duel engine. Mecha Phantom Beast Harrliard is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Mecha Phantom Beast Tetherwolf (67922702)`
  - `Step 3: Transitioning to End Phase for remaining actions`

### [ ] [Mimighoul](Mimighoul Deck Analysis.html) - Combo Trajectories (Line 2)
- **File**: `Mimighoul Deck Analysis.html`
- **Failed at**: Step 2 of 2
- **Step Title**: "Xyz for Maker"
- **Written Step**: *"Overlay for Giant Mimighoul. Giant searches Mimighoul Maker. Proceed with Maker combo."*
- **Engine Violation**: `Step 4 ("Overlay for Giant Mimighoul.") was not offered as a legal action by the duel engine. Giant Mimighoul is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Mimighoul Dragon (81522098)`
  - `Trigger Effect Accepted for Mimighoul Dragon (81522098)`
  - `Selected: Mimighoul Dungeon (86809440) from location 1`

### [ ] [Mimighoul](Mimighoul Deck Analysis.html) - Combo Trajectories (Line 4)
- **File**: `Mimighoul Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Generic Search"
- **Written Step**: *"Deploy and flip Flower. Utilize its effect to bypass archetype targets entirely and search Guard Dog directly to your hand."*
- **Engine Violation**: `Step 1 ("Deploy and flip Flower.") was not offered as a legal action by the duel engine. Mimighoul Flower is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

### [ ] [Mystical Beast of the Forest](Mystical Beast of the Forest Deck Analysis.html) - Core Combo: The Kalantosa Trigger
- **File**: `Mystical Beast of the Forest Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Load the Graveyard"
- **Written Step**: *"Summon Kittytail . Use its effect to send Kalantosa from your Deck to the Graveyard."*
- **Engine Violation**: `Step 2 ("Use its effect to send Kalantosa from your Deck to the Graveyard.") was not offered as a legal action by the duel engine. Kittytail, Mystical Beast of the Forest is in the Monster Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Kittytail, Mystical Beast of the Forest (64475743)`
  - `Step 2: Transitioning to End Phase for remaining actions`

### [ ] [Nemesis](Nemesis Deck analysis.html) - Core Combo: The Flag Starter
- **File**: `Nemesis Deck analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon and Recycle"
- **Written Step**: *"Activate Nemeses Flag in hand. Target the banished monster, Special Summon Flag, and shuffle the target back into the Deck."*
- **Engine Violation**: `Step 3 ("Activate Nemeses Flag in hand.") was not offered as a legal action by the duel engine. Nemeses Flag is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

### [ ] [Nemleria](Nemleria Deck Analysis.html) - The Flow of Dreams: Core Combo
- **File**: `Nemleria Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Set the Interruption"
- **Written Step**: *"Activate Reveil's effect, banishing 3 more cards from the Extra Deck to Special Summon it. Use its on-field effect, send Couette to the GY, and Set Nemleria Repeter from your Deck."*
- **Engine Violation**: `Step 6 ("Activate Reveil's effect, banishing 3 more cards from the Extra Deck to Special Summon it.") was not offered as a legal action by the duel engine. The only effect matching its wording was Dreaming Reality of Nemleria, Realized's, and it did not move Nemleria Dream Devourer - Reveil. Nemleria Dream Devourer - Reveil is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Dreaming Nemleria (70155677)`
  - `Step 2: Legal Activation of Dreaming Nemleria (70155677)`
  - `Selected: Dream Tower of Princess Nemleria (18458255) from location 1`
  - `Step 4: Legal Activation of Dream Tower of Princess Nemleria (18458255)`
  - `Selected: Mercurium the Living Quicksilver (22984000), Varudras, the Final Bringer of the End Times (70636044) from location 64`
  - `Step 5: Legal Special Summon of Nemleria Dream Defender - Couette (43944080)`
  - `Step 6: Legal Activation of Dreaming Reality of Nemleria, Realized (16893370) (matched by effect wording)`
  - `Selected: Nemleria Dream Defender - Couette (43944080) from location 4`
  - `Trigger Effect Accepted for Dreaming Reality of Nemleria, Realized (16893370)`
  - `Selected: Dreaming Nemleria (70155677) from location 1`

### [ ] [Number](Number Deck Analysis.html) - The Tournament Proof: Dwayne Howell's Onomat Utopia
- **File**: `Number Deck Analysis.html`
- **Failed at**: Step 4 of 8
- **Written Step**: *"Overlay into Galaxy Photon Dragon, detach to search Galaxy-Eyes Tachyon Primal . The detached Zubababa Knight triggers too and adds a "Gagaga" monster from the Deck."*
- **Engine Violation**: `Step 5 ("Overlay into Galaxy Photon Dragon, detach to search Galaxy-Eyes Tachyon Primal.") was not offered as a legal action by the duel engine. Galaxy Photon Dragon is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Not simulated - commentary, not a game action`
  - `Step 2: Legal Normal Summon of Gagaga Ganbara Knight (9491461)`

### [ ] [Number](Number Deck Analysis.html) - Core Combo: The Path to Dragonar
- **File**: `Number Deck Analysis.html`
- **Failed at**: Step 3 of 1
- **Step Title**: "Rank-Up to Dragonar"
- **Written Step**: *"Activate Utopiforce , using Utopia to Xyz Summon Number 99: Utopia Dragonar . This sets up a powerful interruption for the opponent's turn."*
- **Engine Violation**: `Step 1 ("Activate Utopiforce, using Utopia to Xyz Summon Number 99: Utopia Dragonar.") was not offered as a legal action by the duel engine. Number 99: Utopia Dragonar is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`

### [ ] [Obelisk the Tormentor](Obelisk the Tormentor Deck Analysis.html) - Core Combos & Synergistic Engines (Line 4)
- **File**: `Obelisk the Tormentor Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Activate Soul Crossing"
- **Written Step**: *"Activate Soul Crossing . Tribute 3 of your opponent's monsters to Normal Summon Obelisk the Tormentor from your hand."*
- **Engine Violation**: `Step 3 ("Activate Soul Crossing.") was not offered as a legal action by the duel engine. Soul Crossing is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Lair of Darkness (59160188)`

### [ ] [Pendulum Pile](Pendulum Pile Deck Analysis.html) - Combo Lines (Line 3)
- **File**: `Pendulum Pile Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Pay Half, Summon Z-ARC"
- **Written Step**: *"Activate Soul of the Supreme King , pay half your Life Points and Special Summon Supreme King Z-ARC from the Extra Deck with its effects negated."*
- **Engine Violation**: `Step 1 ("Activate Soul of the Supreme King, pay half your Life Points") was not offered as a legal action by the duel engine. Soul of the Supreme King is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

### [ ] [Rebel Bots](Rebel Bots Deck Analysis.html) - Primary Combos & End Boards
- **File**: `Rebel Bots Deck Analysis.html`
- **Failed at**: Step 1 of 4
- **Step Title**: "Establish Engine"
- **Written Step**: *"Start by Special Summoning 2+ "R.B." extenders (e.g., Ga10 Cutter + Ga10 Driller ). Link them into R.B. VALCan Booster ."*
- **Engine Violation**: `Step 2 ("Link them into R.B. VALCan Booster.") was not offered as a legal action by the duel engine. R.B. VALCan Booster is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Special Summon of R.B. Ga10 Cutter (33438265)`

### [ ] [Ritual Beast](Ritual Beast Deck Analysis.html) - Core Combo: The "El Clasico" Loop (Line 2)
- **File**: `Ritual Beast Deck Analysis.html`
- **Failed at**: Step 1 of 9
- **Step Title**: "Initial Setup"
- **Written Step**: *"Normal Summon Spiritual Beast Rampengu . Banish Extra Deck Ritual Beast Ulti-Apelio (Psychic) to send Spiritual Beast Tamer Lara (Psychic) from Main Deck to GY."*
- **Engine Violation**: `Step 2 ("Banish Extra Deck Ritual Beast Ulti-Apelio (Psychic) to send Spiritual Beast Tamer Lara (Psychic) from Main Deck to GY.") was not offered as a legal action by the duel engine. Ritual Beast Ulti-Apelio is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Spiritual Beast Rampengu (88123329)`

### [ ] [Ritual Beast](Ritual Beast Deck Analysis.html) - Core Combo: The "El Clasico" Loop (Line 4)
- **File**: `Ritual Beast Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "Fusion & Search Loop"
- **Written Step**: *"Contact fuse Elder and Rampengu into Ulti-Cannahawk . Execute the search loop to add the original Ritual Beast Tamer Lara (Lara) from Deck to hand, returning Cannahawk to the GY."*
- **Engine Violation**: `Step 3 ("Contact fuse Elder and Rampengu into Ulti-Cannahawk.") was not offered as a legal action by the duel engine. Ritual Beast Ulti-Cannahawk is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Ritual Beast Tamer Elder (14513016)`
  - `Step 2: Legal Activation of Ritual Beast Inheritance (22501005)`

### [ ] [Signer Dragon](Signer Dragon Deck Analysis.html) - Core Combo (Line 2)
- **File**: `Signer Dragon Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "The Red Rising Bridge"
- **Written Step**: *"Synchro Summon the Level 6 Red Rising Dragon . Its effect revives the "Resonator" from your GY, flooding the field and enabling further Synchro Summons into your boss monsters."*
- **Engine Violation**: `Step 4 ("Synchro Summon the Level 6 Red Rising Dragon.") was not offered as a legal action by the duel engine. The only effect matching its wording was Stardust Synchron's, and it did not move Red Rising Dragon. Red Rising Dragon is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Soul Resonator (62991792)`
  - `Trigger Effect Accepted for Soul Resonator (62991792)`
  - `Selected: Bone Archfiend (25784595) from location 1`
  - `Step 3: Legal Activation of Bone Archfiend (25784595)`
  - `Selected: Vision Resonator (98396890) from location 2`
  - `Step 4: Legal Activation of Stardust Synchron (37799519) (matched by effect wording)`
  - `Trigger Effect Accepted for Stardust Synchron (37799519)`
  - `Selected: Stardust Illumination (37750912) from location 1`

### [ ] [Supreme King](Supreme King Deck Analysis.html) - Historical Combo: The Electrumite Loop
- **File**: `Supreme King Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "The Starter"
- **Written Step**: *"Start by sending Darkwurm to the GY (e.g., with `Dragon Shrine`). Darkwurm revives itself and searches Gate Magician , which in turn summons itself and searches a trap."*
- **Engine Violation**: `Step 1 ("Start by sending Darkwurm to the GY (e.g., with `Dragon Shrine`).") was not offered as a legal action by the duel engine. Supreme King Dragon Darkwurm is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

### [ ] [Tearlaments](Tearlaments Deck Analysis.html) - Combo Evolution
- **File**: `Tearlaments Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "The Result"
- **Written Step**: *"Shuffle Havnis and King of the Swamp into the Deck to Fusion Summon Tearlaments Rulkallos . You now have a Special Summon negate without needing the banned Kitkallos bridge."*
- **Engine Violation**: `Step 6 ("Shuffle Havnis and King of the Swamp into the Deck to Fusion Summon Tearlaments Rulkallos.") was not offered as a legal action by the duel engine. The only effect matching its wording was Tearlaments Scheiren's, and it did not move Tearlaments Rulkallos. Tearlaments Rulkallos is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Tearlaments Reinoheart (73956664)`
  - `Trigger Effect Accepted for Tearlaments Reinoheart (73956664)`
  - `Selected: Tearlaments Havnis (37961969) from location 1`
  - `Trigger Effect Accepted for Tearlaments Havnis (37961969)`
  - `Selected: Garura, Wings of Resonant Life (11765832) from location 64`
  - `Step 4: Not simulated - commentary, not a game action`
  - `Step 6: Legal Activation of Tearlaments Scheiren (572850) (matched by effect wording)`
  - `Selected: Tearlaments Kashtira (4928565) from location 2`

### [ ] [Tearlaments](Tearlaments Deck Analysis.html) - Combo Evolution (Line 2)
- **File**: `Tearlaments Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Rank 6 Climb"
- **Written Step**: *"Link climb through Requiem and Sequence to summon Fiendsmith's Lacrima . Use the bodies to Xyz Summon Beatrice, Lady of the Eternal ."*
- **Engine Violation**: `Step 4 ("Use the bodies to Xyz Summon Beatrice, Lady of the Eternal.") was not offered as a legal action by the duel engine. The only effect matching its wording was Fiendsmith Engraver's, and it did not move Beatrice, Lady of the Eternal. Beatrice, Lady of the Eternal is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Fiendsmith's Tract (98567237)`
  - `Selected: Fiendsmith Engraver (60764609) from location 1`
  - `Selected: Fiendsmith Engraver (60764609) from location 2`
  - `Step 3: Legal Activation of Fiendsmith Engraver (60764609)`
  - `Selected: Fiendsmith's Tract (98567237) from location 1`
  - `Step 4: Legal Activation of Fiendsmith Engraver (60764609) (matched by effect wording)`
  - `Selected: Fiendsmith Engraver (60764609) from location 16`

## Needs Review

The engine refused a step because a card it uses was never brought to the hand or field by an earlier step. Either the write-up skips a step (a search, a draw) or the harness picked a different card than the writer meant.

### [ ] [Argostars](Argostars Deck Analysis.html) - Core Combo: The Glorious Adra Starter Line
- **File**: `Argostars Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon and Search"
- **Written Step**: *"Activate Lightning Tydeu by discarding a card. It Special Summons itself as a 2000 ATK monster and searches for the Field Spell, Argostars - Home Stadium ."*
- **Engine Violation**: `Step 3 ("Activate Lightning Tydeu by discarding a card.") was not offered as a legal action by the duel engine. Argostars - Lightning Tydeu is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Argostars - Glorious Adra (91438674)`

### [ ] [Atlantean](Atlantean Deck Analysis.html) - Core Combo: The Deep Sea Diva Hand Loop
- **File**: `Atlantean Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Hand Rip & Build Board"
- **Written Step**: *"Continue the combo to summon Deep Sea Minstrel to banish a card from the opponent's hand, then summon Moulinglacia to discard two more before building your final board."*
- **Engine Violation**: `Step 6 ("summon Moulinglacia to discard two more before building your final board.") was not offered as a legal action by the duel engine. Moulinglacia the Elemental Lord is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Deep Sea Diva (78868119)`
  - `Trigger Effect Accepted for Deep Sea Diva (78868119)`
  - `Selected: Neptabyss, the Atlantean Prince (21565445) from location 1`
  - `Step 3: Legal Activation of Neptabyss, the Atlantean Prince (21565445)`
  - `Selected: Atlantean Dragoons (74311226) from location 1`
  - `Selected: Abyssrhine, the Atlantean Spirit (17080584) from location 1`
  - `Selected: Neptabyss, the Atlantean Prince (21565445) from location 1`

### [ ] [Code Talker](Code Talker Deck Analysis.html) - Standard Combo Protocol
- **File**: `Code Talker Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Begin Attribute Chain"
- **Written Step**: *"Splash Mage ( currently banned ) revives a monster. Use them to summon the EARTH Transcode Talker . Codec triggers, searching an EARTH Cyberse monster. Transcode then revives another monster, continuing the chain."*
- **Engine Violation**: `Step 9 ("Use them to summon the EARTH Transcode Talker.") was not offered as a legal action by the duel engine. Transcode Talker is not in the Extra Deck any more (it is in the GY).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Firewall Defenser (20455229)`
  - `Step 2: Legal Special Summon of Transcode Talker (46947713)`
  - `Chain Trigger Accepted for Firewall Defenser (20455229)`
  - `Selected: Firewall Phantom (57940938) from location 1`
  - `Step 4: Legal Special Summon of Splash Mage (59859086)`
  - `Trigger Effect Accepted for Firewall Phantom (57940938)`
  - `Selected: Cynet Codec (60018643) from location 1`
  - `Selected: Cynet Codec (60018643) from location 2`
  - `Step 8: Legal Activation of Splash Mage (59859086)`
  - `Selected: Firewall Phantom (57940938) from location 16`

### [ ] [Crystron](Crystron Deck Analysis.html) - Blueprint Combo: Smiger/Inclusion Route (1.5 Card) (Line 2)
- **File**: `Crystron Deck Analysis.html`
- **Failed at**: Step 4 of 5
- **Step Title**: "Banish Prism for Three Bodies"
- **Written Step**: *"Banish Prism as a cost and Special Summon three Crystron Tokens . You now control four monsters with a combined Level of seven, all of them WATER Machines, in the middle of someone else's turn."*
- **Engine Violation**: `Step 8 ("Banish Prism as a cost") was not offered as a legal action by the duel engine. Crystron Halqifibrax Prism is not in the Extra Deck any more (it is in the GY).`
- **Prior Legal Plays**:
  - `Step 2: Legal Special Summon of Crystron Halqifibrax Prism (65400671)`
  - `Trigger Effect Accepted for Crystron Halqifibrax Prism (65400671)`
  - `Selected: Crystron Quandax (39964797) from location 64`
  - `Step 3: Legal Special Summon of Crystron Halqifibrax Prism (65400671)`
  - `Step 4: Legal Activation of Crystron Sulfador (25865565)`
  - `Selected: Crystron Halqifibrax Prism (65400671) from location 4`
  - `Trigger Effect Accepted for Crystron Sulfador (25865565)`
  - `Step 6: Legal Activation of Crystron Inclusion (31552317)`
  - `Selected: Crystron Thystvern (29838323) from location 1`

### [ ] [Cupid](Cupid Deck Analysis.html) - Cupid's Flight Path: Core Combo
- **File**: `Cupid Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Modulate Level"
- **Written Step**: *"Activate Cupid Pitch's effect. Increase its Level by 2 (the Level of the Tuner used), making it a Level 6 Tuner."*
- **Engine Violation**: `Step 2 ("Activate Cupid Pitch's effect.") was not offered as a legal action by the duel engine. Cupid Pitch is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Special Summon of Cupid Pitch (21915012)`

### [ ] [Cyber Angel](Cyber Angel Deck Analysis.html) - Foundational Combo Lines (Line 3)
- **File**: `Cyber Angel Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Send Arc Light"
- **Written Step**: *"Send Herald of the Arc Light from your Extra Deck. Diviner becomes Level 6."*
- **Engine Violation**: `Step 3 ("Send Herald of the Arc Light from your Extra Deck.") was not offered as a legal action by the duel engine. Herald of the Arc Light is not in the Extra Deck any more (it is in the GY).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Diviner of the Herald (92919429)`
  - `Trigger Effect Accepted for Diviner of the Herald (92919429)`
  - `Selected: Herald of the Arc Light (79606837) from location 64`
  - `Trigger Effect Accepted for Herald of the Arc Light (79606837)`
  - `Selected: Machine Angel Absolute Ritual (11398951) from location 1`
  - `Step 2: Legal Activation of Machine Angel Ritual (39996157)`
  - `Selected: Cyber Angel Benten (77235086) from location 2`
  - `Trigger Effect Accepted for Cyber Angel Idaten (3629090)`

### [ ] [Cyberdark](Cyberdark Deck Analysis.html) - Core Combo: Cyber Dragon Core Turbo
- **File**: `Cyberdark Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Construct the Final Boss"
- **Written Step**: *"Activate Power Bond , banishing 5 "Cyber" monsters from the GY (thanks to Chimera) to Fusion Summon Cyberdarkness Dragon . Equip it with Cyber End Dragon from the GY, then Tribute it to Special Summon Cyberdark End Dragon ."*
- **Engine Violation**: `Step 7 ("Equip it with Cyber End Dragon from the GY") was not offered as a legal action by the duel engine. Cyber End Dragon is not in the Extra Deck any more (it is in the GY).`
- **Alternative choices tried and kept**: Cyberdark Claw instead of Cyberdark Chimera
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Cyber Dragon Core (23893227)`
  - `Selected: Cyberdark Realm (64753988) from location 1`
  - `Step 2: Legal Activation of Cyberdark Realm (64753988)`
  - `Selected: Cyberdark Claw (82562802) from location 1`
  - `Step 3: Legal Activation of Cyberdark Claw (82562802)`
  - `Selected: Cybernetic Horizon (63031396) from location 1`
  - `Step 4: Legal Activation of Cybernetic Horizon (63031396)`
  - `Selected: Cyberdark Chimera (5370235) from location 1`
  - `Selected: Cyber End Dragon (1546123) from location 64`
  - `Step 5: Legal Activation of Cyberdark Realm (64753988)`
  - `Selected: Cyberdark Chimera (5370235) from location 2`
  - `Step 6: Legal Activation of Cyberdark Chimera (5370235)`
  - `Selected: Cyberdark Impact! (80033124) from location 2`
  - `Selected: Power Bond (37630732) from location 1`
  - `Alternate choice near step 3: Cyberdark Claw (instead of Cyberdark Chimera)`

### [ ] [Dinowrestler](Dinowrestler Deck Analysis.html) - Core Combo: Standard 2-Card Dinosaur Integration
- **File**: `Dinowrestler Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "The Destruction Trigger"
- **Written Step**: *"Special Summon Archosaur by destroying a Babycerasaurus in hand. This triggers Babycerasaurus to Special Summon another Dinosaur from the deck."*
- **Engine Violation**: `Step 3 ("Special Summon Archosaur by destroying a Babycerasaurus in hand.") was not offered as a legal action by the duel engine. Animadorned Archosaur is in the hand, but Babycerasaurus, which this step uses from the hand/GY, is still in the Deck: no earlier step added it.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Souleating Oviraptor (44335251)`
  - `Trigger Effect Accepted for Souleating Oviraptor (44335251)`
  - `Selected: Animadorned Archosaur (98022050) from location 1`

### [ ] [Dododo](Dododo Deck Analysis.html) - Core Combo: The 1-Card Warrior-Kage Nexus
- **File**: `Dododo Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "The 1-Card Starter"
- **Written Step**: *"1. Normal Summon Dodododo Warrior . 2. Activate Warrior's effect, sending Onomatokage (as it's treated as a "Dododo" card) from Deck to GY. Warrior Special Summons itself. 3. Activate Onomatokage's GY effect to Special Summon itself. 4. Result: Two Level 4 monsters. Immediately Xyz Summon Infernal Flame Banshee . This is the crucial step that converts your generic starter into the specialized Ryzeal engine."*
- **Engine Violation**: `Step 6 ("Immediately Xyz Summon Infernal Flame Banshee.") was not offered as a legal action by the duel engine. The only effect matching its wording was Gagaga Magician - Gagaga Magic's, and it did not move Infernal Flame Banshee. Infernal Flame Banshee is not in the Extra Deck any more (it is in the GY).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Dodododo Warrior (62880279)`
  - `Step 2: Legal Activation of Onomatokage (55088578)`
  - `Step 6: Legal Activation of Gagaga Magician - Gagaga Magic (12908094) (matched by effect wording)`
  - `Selected: Dodododwarf Gogogoglove (59724555) from location 2`
  - `Selected: Gagagaga Magician (86331741) from location 64`

### [ ] [Dododo](Dododo Deck Analysis.html) - Core Combo: The 1-Card Warrior-Kage Nexus (Line 2)
- **File**: `Dododo Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "Summon Both Halves at Once"
- **Written Step**: *"Activate Gagaga Magic in the hand. Special Summon itself plus Dododo Buster back out of the graveyard. The Normal Summon is still untouched."*
- **Engine Violation**: `Step 3 ("Activate Gagaga Magic in the hand.") was not offered as a legal action by the duel engine. The only effect matching its wording was Dodododo Warrior's, and it did not move Gagaga Magician - Gagaga Magic. Gagaga Magician - Gagaga Magic is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Dodododraw (73866096)`
  - `Selected: Dododo Buster (57996334) from location 2`
  - `Step 3: Legal Activation of Dodododo Warrior (62880279) (matched by effect wording)`
  - `Selected: Dododo Buster (57996334) from location 1`

### [ ] [Dracotail](Dracotail Archetype Breakdown.html) - Core Combo (Line 7)
- **File**: `Dracotail Archetype Breakdown.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Activate & Resolve"
- **Written Step**: *"Activate Branded Fusion . Send Albaz + Faimena to summon Albion . CL1: Albion , CL2: Faimena ."*
- **Engine Violation**: `Step 5 ("Activate Branded Fusion.") was not offered as a legal action by the duel engine. Branded Fusion is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Rahu Dracotail (32548318)`
  - `Selected: Dracotail Gulamel (79755671) from location 64`

### [ ] [Duston](Duston Deck Analysis.html) - Core Combo: The Goblin King OTK
- **File**: `Duston Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Summon the King"
- **Written Step**: *"Summon Goblin King . With 8 other Fiends on the field, its ATK becomes 8000. Attack a 0 ATK Duston on the opponent's field for game."*
- **Engine Violation**: `Step 4 ("Summon Goblin King.") was not offered as a legal action by the duel engine. Goblin King is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of House Duston (40343749)`

### [ ] [Elemental Hero](Elemental Hero Deck Analysis.html) - Core Combo: The "Faris" Starter (Line 2)
- **File**: `Elemental Hero Deck Analysis.html`
- **Failed at**: Step 4 of 4
- **Step Title**: "The Lock"
- **Written Step**: *"During the opponent's Draw Phase, activate Favorite Contact. Return Neos and 3 different Neo-Spacians to the deck to summon Cosmo Neos . The opponent's turn is entirely skipped as they cannot activate cards or effects."*
- **Engine Violation**: `Step 8 ("activate Favorite Contact.") was not offered as a legal action by the duel engine. Favorite Contact is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Miracle Ejector (30875635)`
  - `Selected: Neo-Spacian Aqua Dolphin (17955766) from location 1`
  - `Trigger Effect Accepted for Miracle Ejector (30875635)`
  - `Selected: EN Shuffle (10186633) from location 1`
  - `Step 3: Legal Activation of EN Shuffle (10186633)`
  - `Selected: Miracle Ejector (30875635) from location 4`
  - `Selected: Elemental HERO Stratos (40044918) from location 1`
  - `Trigger Effect Accepted for Elemental HERO Stratos (40044918)`
  - `Selected: Masked HERO Furnace (58288218) from location 1`
  - `Step 6: Legal Activation of Masked HERO Furnace (58288218) (matched by effect wording)`
  - `Selected: Mask Change (21143940) from location 1`
  - `Selected: Elemental HERO Shadow Mist (50720316) from location 2`
  - `Trigger Effect Accepted for Elemental HERO Shadow Mist (50720316)`
  - `Selected: Destiny HERO - Malicious (9411399) from location 1`
  - `Passing turn to opponent for opponent-turn action`

### [ ] [Gouki](Gouki Deck Analysis.html) - Core Combo Walkthroughs (Line 4)
- **File**: `Gouki Deck Analysis.html`
- **Failed at**: Step 3 of 4
- **Step Title**: "The Re-Match Extender"
- **Written Step**: *"One of your searches will be Gouki Re-Match . Activate it to revive two more Goukis, providing the materials needed for the final board."*
- **Engine Violation**: `Step 6 ("Activate it to revive two more Goukis, providing the materials needed for the final board.") was not offered as a legal action by the duel engine. Gouki The Tyrant Ogre is not in the Extra Deck any more (it is in the GY).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Gouki Machine Suprex (29099860)`
  - `Selected: Gouki Suprex (24073068) from location 2`
  - `Step 2: Legal Special Summon of Gouki Sheik Ogre (7382007)`
  - `Step 3: Legal Activation of Gouki Sheik Ogre (7382007)`
  - `Selected: Gouki The Tyrant Ogre (7782069) from location 64`
  - `Trigger Effect Accepted for Gouki The Tyrant Ogre (7782069)`
  - `Selected: Gouki The Tyrant Ogre (7782069) from location 4`

### [ ] [Grepher](Grepher Deck Analysis.html) - Strategic Execution: Core Combo Lines (Line 2)
- **File**: `Grepher Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "Chain Search"
- **Written Step**: *"Banish Ancient Cloak from GY to add The Phantom Knights of Silent Boots to hand. Special Summon Silent Boots."*
- **Engine Violation**: `Step 5 ("Special Summon Silent Boots.") was not offered as a legal action by the duel engine. The Phantom Knights of Silent Boots is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Reinforcement of the Army (32807846)`
  - `Selected: Dark Grepher (14536035) from location 1`
  - `Step 2: Legal Normal Summon of Chaos Grepher (18859369)`
  - `Step 3: Legal Activation of Chaos Grepher (18859369)`
  - `Selected: Dark Grepher (14536035) from location 2`
  - `Selected: Chaos Grepher (18859369) from location 1`

### [ ] [Guardragon](Guardragon Deck Analysis.html) - Peak Power: The Forbidden Combo (Historical)
- **File**: `Guardragon Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Summon Elpy & Tutor REDMD"
- **Written Step**: *"Summon Elpy (Forbidden) to a zone pointed to by another Link Monster. Activate Elpy's effect to Special Summon Red-Eyes Darkness Metal Dragon directly from the Deck."*
- **Engine Violation**: `Step 2 ("Activate Elpy's effect to Special Summon Red-Eyes Darkness Metal Dragon directly from the Deck.") was not offered as a legal action by the duel engine. Guardragon Elpy is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Special Summon of Guardragon Elpy (86148577)`

### [ ] [Hazy flame](Hazy flame Deck Analysis.html) - Core Combo: The Peryton Offensive
- **File**: `Hazy flame Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Unleash the Hydras"
- **Written Step**: *"Special Summon two copies of Hazy Flame Hydra from your deck. Their Dinosaur typing is key to accessing the deck's true boss monster."*
- **Engine Violation**: `Step 3 ("Special Summon two copies of Hazy Flame Hydra from your deck.") was not offered as a legal action by the duel engine. Hazy Flame Hydra is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Hazy Pillar (83108603)`

### [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 4)
- **File**: `Hecahands Deck Analysis.html`
- **Failed at**: Step 1 of 6
- **Step Title**: "Chimera Engine Start"
- **Written Step**: *"Normal Summon Swordknight . Tribute → SS Berfomet . Add Chimera Fusion & Gazelle."*
- **Engine Violation**: `Step 2 ("Special Summon Berfomet.") was not offered as a legal action by the duel engine. Berfomet is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Mirror Swordknight (28954097)`

### [ ] [Magical Muskets](Magical Muskets Deck Analysis.html) - Core Combo: The Fiendsmith Alliance
- **File**: `Magical Muskets Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon the Conductor"
- **Written Step**: *"Link Summon Fiendsmith's Requiem using Starfire. Activate Requiem's effect, Tributing itself to Special Summon The Fiendsmith from your deck, the main engine piece."*
- **Engine Violation**: `Step 5 ("Activate Requiem's effect, Tributing itself to Special Summon The Fiendsmith from your deck, the main engine piece.") was not offered as a legal action by the duel engine. Fiendsmith's Requiem is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Special Summon of Kashtira Unicorn (68304193)`
  - `Step 2: Legal Normal Summon of Magical Musketeer Starfire (31629407)`
  - `Step 4: Legal Special Summon of Fiendsmith's Requiem (2463794)`

### [ ] [Malefic](Malefic Deck Analysis.html) - The 2026 Combo Lines (Line 4)
- **File**: `Malefic Deck Analysis.html`
- **Failed at**: Step 4 of 5
- **Step Title**: "The Second Body"
- **Written Step**: *"Banish Paradox Gear from the GY to Special Summon Malefic Cyber End Dragon from your hand. That is a second 4000 ATK attacker on an empty field."*
- **Engine Violation**: `Step 9 ("Banish Paradox Gear from the GY to Special Summon Malefic Cyber End Dragon from your hand.") was not offered as a legal action by the duel engine. Malefic Paradox Gear is in the hand, but Malefic Cyber End Dragon, which this step uses from the hand/GY, is still in the Deck: no earlier step added it.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Malefic Paradigm Shift (5125629) (matched by effect wording)`
  - `Selected: Malefic World (27564031) from location 1`
  - `Selected: Malefic Paradigm Dragon (16958382) from location 1`
  - `Step 2: Legal Spell/Trap Set of Malefic Force (68721020)`
  - `Step 4: Not simulated - commentary, not a game action`
  - `Step 5: Not simulated - commentary, not a game action`
  - `Step 7: Not simulated - commentary, not a game action`
  - `Step 8: Legal Activation of Malefic World (27564031)`

### [ ] [Malicevorous](Malicevorous Deck Analysis.html) - Core Combo: Fork into Full Board
- **File**: `Malicevorous Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Spright Extension"
- **Written Step**: *"With Fork on field, Special Summon Spright Blue to search Spright Jet . Special Summon Jet to search Spright Starter ."*
- **Engine Violation**: `Step 3 ("With Fork on field, Special Summon Spright Blue to search Spright Jet.") was not offered as a legal action by the duel engine. The only effect matching its wording was Opening of the Spirit Gates's, and it did not move Spright Blue or Spright Jet. Spright Blue is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Malicevorous Fork (61791132)`
  - `Selected: Malicevorous Knife (98780137) from location 2`
  - `Step 3: Legal Activation of Opening of the Spirit Gates (80312545) (matched by effect wording)`
  - `Selected: Chaos Summoning Beast (27439792) from location 1`

### [ ] [Mikanko](Mikanko Deck Analysis.html) - Primary Combo Sequence
- **File**: `Mikanko Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Prepare the Target"
- **Written Step**: *"Tribute an opponent's monster to summon a Kaiju to their field. Equip it with Double-Edged Sword ."*
- **Engine Violation**: `Step 6 ("Equip it with Double-Edged Sword.") was not offered as a legal action by the duel engine. Double-Edged Sword is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Mikanko Shinbu - Noble Twins (84550369) (matched by effect wording)`
  - `Selected: Mikanko Water Arabesque (43527730) from location 1`
  - `Selected: Mikanko Spiritwalk (53174748) from location 1`

### [ ] [Mikanko](Mikanko Deck Analysis.html) - Primary Combo Sequence (Line 2)
- **File**: `Mikanko Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Xyz & Lethal Search"
- **Written Step**: *"Overlay Level 3s for Uzuhime . Effect: Search Double-Edged Sword . Equip it to Uzuhime."*
- **Engine Violation**: `Step 9 ("Equip it to Uzuhime.") was not offered as a legal action by the duel engine. Uzuhime the Manifested Mikanko is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Mikanko Shinbu - Noble Twins (84550369)`
  - `Selected: Mikanko Fire Dance (80044027) from location 1`
  - `Selected: Mikanko Water Arabesque (43527730) from location 1`
  - `Step 3: Legal Activation of Mikanko Fire Dance (80044027)`
  - `Selected: Ha-Re the Sword Mikanko (18377261) from location 2`
  - `Trigger Effect Accepted for Ha-Re the Sword Mikanko (18377261)`
  - `Selected: Mikanko Water Arabesque (43527730) from location 1`
  - `Step 5: Legal Activation of Mikanko Water Arabesque (43527730)`
  - `Selected: Ha-Re the Sword Mikanko (18377261) from location 4`
  - `Step 6: Legal Activation of Mikanko Water Arabesque (43527730) (matched by effect wording)`
  - `Selected: Sanaki the Mikanko Devotee (11161666) from location 1`
  - `Trigger Effect Accepted for Sanaki the Mikanko Devotee (11161666)`
  - `Selected: Ha-Re the Sword Mikanko (18377261) from location 1`
  - `Step 7: Legal Special Summon of Uzuhime the Manifested Mikanko (57566760)`
  - `Trigger Effect Accepted for Uzuhime the Manifested Mikanko (57566760)`
  - `Selected: Double-Edged Sword (41927278) from location 1`

### [ ] [Mimighoul](Mimighoul Deck Analysis.html) - Combo Trajectories
- **File**: `Mimighoul Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon & Flip"
- **Written Step**: *"Slime is Set to opponent's field. Special Summon Archfiend, trigger effect to flip Slime."*
- **Engine Violation**: `Step 3 ("Special Summon Archfiend, trigger effect to flip Slime.") was not offered as a legal action by the duel engine. The only effect matching its wording was Mimighoul Armor's, and it did not move Mimighoul Archfiend or Mimighoul Slime. Mimighoul Archfiend is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Mimighoul Slime (80551022)`
  - `Step 3: Legal Activation of Mimighoul Armor (11677278) (matched by effect wording)`

### [ ] [Mystical Elf](Mystical Elf Deck Analysis.html) - Strategic Execution: Combo Lines
- **File**: `Mystical Elf Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Establish Enabler"
- **Written Step**: *"Activate Ancient Rules to Special Summon Blue-Eyes White Dragon from hand. White Lightning is now live."*
- **Engine Violation**: `Step 5 ("Activate Ancient Rules to Special Summon Blue-Eyes White Dragon from hand.") was not offered as a legal action by the duel engine. Ancient Rules is in the hand, but Blue-Eyes White Dragon, which this step uses from the hand/GY, is still in the Deck: no earlier step added it.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Unexpected Dai (911883)`
  - `Selected: Mystical Elf (15025844) from location 1`
  - `Step 2: Legal Normal Summon of The White Stone of Legend (79814787)`
  - `Step 3: Legal Special Summon of Artemis, the Magistus Moon Maiden (34755994)`

### [ ] [Obelisk the Tormentor](Obelisk the Tormentor Deck Analysis.html) - Core Combos & Synergistic Engines (Line 3)
- **File**: `Obelisk the Tormentor Deck Analysis.html`
- **Failed at**: Step 1 of 5
- **Step Title**: "Activate Imsety (Cost as Benefit)"
- **Written Step**: *"Activate Imsety, Glory of Horus from hand. Send itself and Soul Energy MAX!!! to the GY as cost. Imsety's effect searches King's Sarcophagus ."*
- **Engine Violation**: `Step 2 ("Send itself and Soul Energy MAX!!! to the GY as cost.") was not offered as a legal action by the duel engine. Soul Energy MAX!!! is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Imsety, Glory of Horus (84941194)`
  - `Selected: Reactor Slime (79387392) from location 2`
  - `Selected: King's Sarcophagus (16528181) from location 1`

### [ ] [Performage](Performage Deck Analysis.html) - Core Combo: The Fire Dancer One-Card Starter
- **File**: `Performage Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Xyz Climb"
- **Written Step**: *"Place Water Dancer in the Pendulum Zone and use its effect to Special Summon itself. Xyz Summon Tellarknight Constellar Caduceus and use its effect to search for Constellar Tellarknights ."*
- **Engine Violation**: `Step 6 ("use its effect to search for Constellar Tellarknights.") was not offered as a legal action by the duel engine. Tellarknight Constellar Caduceus is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Performage Fire Dancer (7934362)`
  - `Trigger Effect Accepted for Performage Fire Dancer (7934362)`
  - `Selected: Performage Water Dancer (34323367) from location 1`
  - `Step 3: Legal Activation of Performage Water Dancer (34323367)`
  - `Step 4: Legal Activation of Performage Water Dancer (34323367)`
  - `Step 5: Legal Special Summon of Tellarknight Constellar Caduceus (58858807)`

### [ ] [Raidraptor](Raidraptor Deck Analysis.html) - One-Card Full Combo
- **File**: `Raidraptor Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Bridge to Power"
- **Written Step**: *"Special Summon Strangle Lanius . Overlay both monsters into Raider's Knight , then use its effect to rank up into Raidraptor - Brave Strix ."*
- **Engine Violation**: `Step 4 ("Special Summon Strangle Lanius.") was not offered as a legal action by the duel engine. Raidraptor - Strangle Lanius is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Raidraptor - Tribute Lanius (83236601)`
  - `Step 2: Legal Activation of Raidraptor - Tribute Lanius (83236601)`
  - `Selected: Raidraptor - Mimicry Lanius (96345188) from location 1`

### [ ] [Red Dragon Archfiend](Red Dragon Archfiend Deck Analysis.html) - Core Operational Combo Sequences (Line 3)
- **File**: `Red Dragon Archfiend Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "The Burn Tuner"
- **Written Step**: *"Normal Summon Soul Resonator to search Red Lotus King, Flame Crime . Because a Fiend Tuner is controlled, Flame Crime Special Summons itself from hand, burning the opponent for 800."*
- **Engine Violation**: `Step 3 ("Normal Summon Soul Resonator to search Red Lotus King, Flame Crime.") was not offered as a legal action by the duel engine. The only effect matching its wording was Darkness Resonator's, and it did not move Soul Resonator or Red Lotus King, Flame Crime. Soul Resonator is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Bone Archfiend (25784595)`
  - `Selected: Vision Resonator (98396890) from location 2`
  - `Trigger Effect Accepted for Vision Resonator (98396890)`
  - `Selected: Crimson Gaia (98173209) from location 1`
  - `Step 3: Legal Activation of Darkness Resonator (83445539) (matched by effect wording)`
  - `Selected: Red Dragon Archfiend (70902743) from location 64`
  - `Trigger Effect Accepted for Darkness Resonator (83445539)`

### [ ] [Relinquished](Relinquished Deck Analysis.html) - Core Combo: The "Kaiju Slingshot"
- **File**: `Relinquished Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Absorb & Attack"
- **Written Step**: *"Activate Anima's effect to equip the Kaiju to itself. Anima now has the high ATK of the Kaiju, and you have removed a threat while building your own."*
- **Engine Violation**: `Step 4 ("Activate Anima's effect to equip the Kaiju to itself.") was not offered as a legal action by the duel engine. Relinquished Anima is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Relinquished Fusion (78063197)`
  - `Selected: Millennium-Eyes Restrict (41578483) from location 64`
  - `Step 2: Legal Normal Summon of Millennium-Eyes Illusionist (89785779)`
  - `Step 3: Legal Special Summon of Relinquished Anima (94259633)`
  - `Step 4: Transitioning to End Phase for remaining actions`

### [ ] [S-Force](S-Force Deck Analysis.html) - Core Combo
- **File**: `S-Force Deck Analysis.html`
- **Failed at**: Step 4 of 6
- **Written Step**: *"Nightcatcher Quick Effect: banish itself + Retroactive from GY (Retroactive's own GY effect lets it substitute as the banish cost) → Special Summon S-Force Pla-Tina from Deck. Pla-Tina's trigger revives the banished Retroactive."*
- **Engine Violation**: `Step 8 ("Special Summon S-Force Pla-Tina from Deck.") was not offered as a legal action by the duel engine. S-Force Pla-Tina is still in the Deck: no earlier step added it to the hand or field.`
- **Alternative choices tried and kept**: S-Force Signify instead of S-Force Nightcatcher
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of S-Force Signify (19951423)`
  - `Trigger Effect Accepted for S-Force Signify (19951423)`
  - `Selected: S-Force Retroactive (53782828) from location 1`
  - `Step 3: Legal Special Summon of S-Force Nightcatcher (67216732)`
  - `Trigger Effect Accepted for S-Force Nightcatcher (67216732)`
  - `Chain Trigger Accepted for S-Force Nightcatcher (67216732)`
  - `Trigger Effect Accepted for S-Force Retroactive (53782828)`
  - `Selected: S-Force Signify (19951423) from location 1`
  - `Selected: S-Force Origin (99199231) from location 1`
  - `Step 5: Legal Activation of S-Force Origin (99199231)`
  - `Selected: S-Force Signify (19951423) from location 16`
  - `Alternate choice near step 6: S-Force Signify (instead of S-Force Nightcatcher)`

### [ ] [SPYRAL](SPYRAL Deck Analysis.html) - Standard Combo Protocol
- **File**: `SPYRAL Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Deploy Agent & Link Up"
- **Written Step**: *"Special Summon Super Agent using the intel from Drone. Link Summon SPYRAL Double Helix ."*
- **Engine Violation**: `Step 3 ("Special Summon Super Agent using the intel from Drone.") was not offered as a legal action by the duel engine. SPYRAL Super Agent is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 2: Legal Normal Summon of SPYRAL GEAR - Drone (4474060)`

### [ ] [Symphonic Warrior](Symphonic Warrior Deck Analysis.html) - Core Combo
- **File**: `Symphonic Warrior Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Modulate and Dominate"
- **Written Step**: *"Through a series of Link Summons and Pendulum Summons, use the FLIP effect of Synthess to search for Drumss . Banish Drumss from the GY to change another monster to EARTH, then Synchro Summon the devastating Naturia Beast ."*
- **Engine Violation**: `Step 6 ("use the FLIP effect of Synthess to search for Drumss.") was not offered as a legal action by the duel engine. Symphonic Warrior Synthess is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Symphonic Warrior Guitaar (12525049)`
  - `Step 2: Legal Activation of Symphonic Warrior Guitaar (12525049)`
  - `Selected: Symphonic Warrior DJJ (70204022) from location 2`
  - `Selected: Symphonic Warrior Guitariss (43210483) from location 1`
  - `Trigger Effect Accepted for Symphonic Warrior Guitariss (43210483)`
  - `Selected: Symphonic Warrior Guitaar (12525049) from location 8`

### [ ] [Tearlaments](Tearlaments Deck Analysis.html) - Combo Evolution (Line 4)
- **File**: `Tearlaments Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Mill 8 & Climb"
- **Written Step**: *"Kitkallos adds Merrli to hand, then swaps herself to summon Merrli. Both trigger (Mill 5 + Mill 3). If you mill a Fusion name, fuse Kitkallos (GY) + Name into Rulkallos ."*
- **Engine Violation**: `Step 9 ("If you mill a Fusion name, fuse Kitkallos (GY) + Name into Rulkallos.") was not offered as a legal action by the duel engine. Tearlaments Kitkallos is not in the Extra Deck any more (it is in the banishment).`
- **Alternative choices tried and kept**: skip the optional effect of Tearlaments Kitkallos instead of use the optional effect of Tearlaments Kitkallos
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Tearlaments Reinoheart (73956664)`
  - `Trigger Effect Accepted for Tearlaments Reinoheart (73956664)`
  - `Selected: Tearlaments Havnis (37961969) from location 1`
  - `Trigger Effect Accepted for Tearlaments Havnis (37961969)`
  - `Selected: Tearlaments Kitkallos (92731385) from location 64`
  - `Step 4: Legal Activation of Tearlaments Kitkallos (92731385)`
  - `Selected: Tearlaments Kitkallos (92731385) from location 4`
  - `Selected: Tearlaments Scheiren (572850) from location 2`
  - `Trigger Effect Accepted for Tearlaments Kitkallos (92731385)`
  - `Step 7: Legal Activation of Tearlaments Kashtira (4928565) (matched by effect wording)`
  - `Selected: Tearlaments Kitkallos (92731385) from location 16`
  - `Trigger Effect Accepted for Tearlaments Kashtira (4928565)`
  - `Trigger Effect Accepted for Tearlaments Merrli (74078255)`
  - `Selected: Tearlaments Rulkallos (84330567) from location 64`
  - `Alternate choice near step 4: skip the optional effect of Tearlaments Kitkallos (instead of use the optional effect of Tearlaments Kitkallos)`

### [ ] [Tistina](Tistina Deck Analysis.html) - Core Combo
- **File**: `Tistina Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Activate the Divine Domain"
- **Written Step**: *"Send Fallen of the Tistina from hand to GY to activate Divine Domain Baatistina from deck. Then, use its effect to send Miasma Dragon Tistina from deck to GY."*
- **Engine Violation**: `Step 2 ("use its effect to send Miasma Dragon Tistina from deck to GY.") was not offered as a legal action by the duel engine. The only effect matching its wording was Play of the Tistina's, and it did not move Miasma Dragon Tistina or Tistina, the Divinity that Defies Darkness. Miasma Dragon Tistina is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 2: Legal Activation of Play of the Tistina (13070280) (matched by effect wording)`
  - `Selected: Fallen of the Tistina (87498729) from location 2`

### [ ] [Trains](Trains Deck Analysis.html) - Blueprint for Victory: The Legacy Harvester Combo
- **File**: `Trains Deck Analysis.html`
- **Failed at**: Step 3 of 7
- **Step Title**: "Link Summon & Double Search"
- **Written Step**: *"Link Summon Qliphort Genius using Bleu Traveler + Harvester. Chain block: Harvester searches Infinitrack Brutal Dozer ; Genius searches Therion "King" Regulus ."*
- **Engine Violation**: `Step 7 ("Chain block: Harvester searches Infinitrack Brutal Dozer") was not offered as a legal action by the duel engine. Infinitrack Brutal Dozer is still in the Deck: no earlier step added it to the hand or field.`
- **Alternative choices tried and kept**: not chaining instead of chaining an effect
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Exceptional Schedule (52782439)`
  - `Selected: Urgent Schedule (25274141) from location 1`
  - `Step 4: Legal Activation of Urgent Schedule (25274141)`
  - `Step 6: Legal Special Summon of Qliphort Genius (22423493)`
  - `Alternate choice near step 3: not chaining (instead of chaining an effect)`

### [ ] [True King True Draco](True King True Draco Deck Analysis.html) - Core Combo
- **File**: `True King True Draco Deck Analysis.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Search and Set"
- **Written Step**: *"Dinomight Knight's effect activates. Add True King's Return from Deck to hand. Set it alongside your other floodgates."*
- **Engine Violation**: `Step 5 ("Add True King's Return from Deck to hand.") was not offered as a legal action by the duel engine. True King's Return is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Draco Awakening (66092596)`
  - `Selected: Dinomight Knight, the True Dracofighter (58984738) from location 1`
  - `Step 3: Legal Normal Summon of Dinomight Knight, the True Dracofighter (58984738)`

### [ ] [Visas](Visas Deck Analysis.html) - Primary Combo: The One-Card Scareclaw Starter
- **File**: `Visas Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Search & Extend"
- **Written Step**: *"Scareclaw Light-Heart searches Primitive Planet Reichphobia . Activate Primitive Planet Reichphobia to search Visas Starfrost . Use Visas's effect to destroy Light-Heart and Special Summon himself."*
- **Engine Violation**: `Step 5 ("Use Visas's effect to destroy Light-Heart") was not offered as a legal action by the duel engine. Scareclaw Light-Heart is not in the Extra Deck any more (it is in the Monster Zone).`
- **Alternative choices tried and kept**: skip the optional effect of Scareclaw Reichheart instead of use the optional effect of Scareclaw Reichheart
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Scareclaw Reichheart (82361809)`
  - `Step 2: Legal Special Summon of Scareclaw Light-Heart (53776969)`
  - `Trigger Effect Accepted for Scareclaw Light-Heart (53776969)`
  - `Selected: Primitive Planet Reichphobia (56063182) from location 1`
  - `Step 4: Legal Activation of Primitive Planet Reichphobia (56063182)`
  - `Selected: Visas Starfrost (56099748) from location 1`
  - `Alternate choice near step 2: skip the optional effect of Scareclaw Reichheart (instead of use the optional effect of Scareclaw Reichheart)`

### [ ] [Volcanic](Volcanic Deck Analysis.html) - Core Combo
- **File**: `Volcanic Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon the Emperor"
- **Written Step**: *"After setting up the GY with Pyro monsters (often via the Snake-Eye engine), summon Volcanic Emperor by banishing 3 Pyro monsters. Its effect burns for 1500 and sets Volcanic Emission from the deck."*
- **Engine Violation**: `Step 3 ("After setting up the GY with Pyro monsters (often via the Snake-Eye engine), summon Volcanic Emperor by banishing 3 Pyro monsters.") was not offered as a legal action by the duel engine. Volcanic Emperor is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Not simulated - commentary, not a game action`

### [ ] [Warrior](Warrior Deck Analysis.html) - Core Combo
- **File**: `Warrior Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Durendal: 2nd–4th ROTA & Gearfried Fuel"
- **Written Step**: *"Equip "Infernoble Arms - Durendal" to any monster on the field, then activate its effect to destroy itself and search Sublimation Knight . You now hold a 1-card starter, with an Equip Spell loaded into your GY ready to banish for Immortal Phoenix Gearfried 's free summon!"*
- **Engine Violation**: `Step 2 ("activate its effect to destroy itself and search Sublimation Knight.") was not offered as a legal action by the duel engine. Sublimation Knight is still in the Deck: no earlier step added it to the hand or field.`

## Could Not Verify

Not evidence of an illegal play: the replay stopped after a step the engine could not simulate from the prose (examples, opponent-dependent steps, unidentified cards), so later failures may just reflect that step.

- [ ] [Adamancipator](Adamancipator Archetype Breakdown.html) - Core Combo: The "Block Dragon Turbo" Strategy (Historical) (Line 2): stopped at Step 5 of 5. Step 2: describes an effect resolving rather than an action to take; Step 5: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Appliancer](Appliancer Deck Analysis.html) - Core Combo: The Codebreaker Pivot: stopped at Step 3 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references); Step 2: describes an effect resolving rather than an action to take
- [ ] [Chaos](Chaos Deck Analysis.html) - Core Combo: The Path to Synchro Dominance (Line 2): stopped at Step 3 of 4. Step 1: the engine has no script for a card in this step
- [ ] [Cocoon of evolution](Cocoon of evolution Deck Analysis.html) - Foundational Combo: The Two-Card Board Break: stopped at Step 2 of 3. Step 1: describes an effect resolving rather than an action to take
- [ ] [Crusadia](Crusadia Deck Analysis.html) - Core Combo: The Path to Equimax: stopped at Step 2 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Dinomorphia](Dinomorphia Deck Analysis.html) - Core Combo: The Therizia-to-Rexterm Lockdown: stopped at Step 3 of 3. Step 2: no card in the step could be identified
- [ ] [Dododo](Dododo Deck Analysis.html) - Core Combo: The 1-Card Warrior-Kage Nexus (Line 3): stopped at Step 5 of 9. Step 4: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Endymoin](Endymoin Deck Analysis.html) - Core Combo: The Path to Mastery (Line 2): stopped at Step 5 of 6. Step 4: describes an effect resolving rather than an action to take
- [ ] [Entity](Entity Deck Analysis.html) - Core Combo: stopped at Step 2 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [From the Underworld](From the Underworld Deck Analysis.html) - Core Combo: stopped at Step 3 of 3. Step 2: describes an effect resolving rather than an action to take
- [ ] [Gagaga](Gagaga Deck Analysis.html) - Core Combo: The 1-Card 'Onomatopaira' Starter (Line 2): stopped at Step 3 of 3. Step 2: depends on the opponent's cards, turn or battle; Step 3: depends on the opponent's cards, turn or battle; Step 3: depends on the opponent's cards, turn or battle
- [ ] [Galaxy-photon](Galaxy-photon Deck Analysis.html) - Core Combo: Delta Wing Ignition (Line 2): stopped at Step 5 of 5. Step 2: no card in the step could be identified; Step 3: commentary, not a game action; Step 3: no card in the step could be identified
- [ ] [Geargia](Geargia Deck Analysis.html) - Core Combo: The Armor-to-Gigant X Loop: stopped at Step 1 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Gogogo](Gogogo Deck Analysis.html) - Modern Core Combos: stopped at Step 2 of 4. Step 2: no card in the step could be identified
- [ ] [Gusto](Gusto Deck Analysis.html) - Core Combo: The Sphreez "Stop Hitting Yourself" OTK: stopped at Step 2 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 3): stopped at Step 2 of 3. Step 1: depends on the opponent's cards, turn or battle
- [ ] [Ignister](Ignister Archetype Breakdown.html) - Strategic Combo Lines (Post-Banlist) (Line 2): stopped at Step 2 of 2. Step 1: describes an effect resolving rather than an action to take
- [ ] [Iron Chain](Iron Chain Deck Analysis.html) - Core Combo: stopped at Step 2 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references); Step 1: describes an effect resolving rather than an action to take
- [ ] [Junk Deck Analyis](Junk Deck Analyis.html) - Core Combo: stopped at Step 1 of 4. Step 1: no card in the step could be identified
- [ ] [Kaiser Glider](Kaiser Glider Deck Analysis.html) - Primary Combo: The "Lair of Darkness" Removal: stopped at Step 3 of 3. Step 2: depends on the opponent's cards, turn or battle
- [ ] [Kozmo](Kozmo Deck Analysis.html) - Core Combo: The "Tincan Pass": stopped at Step 2 of 2. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Kuriboh](Kuriboh Deck Analysis.html) - Core Combo: The Five Star Twilight Power Play (Line 2): stopped at Step 2 of 3. Step 1: depends on the opponent's cards, turn or battle; Step 2: depends on the opponent's cards, turn or battle
- [ ] [Kuriboh](Kuriboh Deck Analysis.html) - Core Combo: The Five Star Twilight Power Play (Line 3): stopped at Step 2 of 4. Step 1: step is not specific enough to replay (examples, "any", cross-references); Step 1: describes an effect resolving rather than an action to take
- [ ] [Lunalight](Lunalight Deck Analysis.html) - Interactive Combo Replays (Line 3): stopped at Step 2 of 4. Step 1: depends on the opponent's cards, turn or battle
- [ ] [Mekk-knight](Mekk-knight Deck Analysis.html) - Core Combo: The Girsu Lockdown: stopped at Step 3 of 3. Step 3: depends on the opponent's cards, turn or battle
- [ ] [Memento](Memento Deck Analysis.html) - Core Combo: The Tatsunootoshigo Opening: stopped at Step 2 of 8. Step 1: describes an effect resolving rather than an action to take
- [ ] [Mimighoul](Mimighoul Deck Analysis.html) - Combo Trajectories (Line 3): stopped at Step 2 of 3. Step 1: depends on the opponent's cards, turn or battle
- [ ] [P series](P series Deck Analysis.html) - Rulings Worth Knowing: stopped at Step 3 of 4. Step 2: no card in the step could be identified; Step 2: no card in the step could be identified
- [ ] [P series](P series Deck Analysis.html) - Core Combo: stopped at Step 3 of 4. Step 2: describes an effect resolving rather than an action to take; Step 2: depends on the opponent's cards, turn or battle
- [ ] [Pendulum Pile](Pendulum Pile Deck Analysis.html) - Combo Lines (Line 2): stopped at Step 7 of 8. Step 6: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Rebel Bots](Rebel Bots Deck Analysis.html) - Primary Combos & End Boards (Line 3): stopped at Step 3 of 4. Step 2: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Red Dragon Archfiend](Red Dragon Archfiend Deck Analysis.html) - Core Operational Combo Sequences: stopped at Step 5 of 5. Step 4: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Resonator](Resonator Deck Analysis.html) - Classic Core Combo: The 1-Card Soul Resonator Line (Line 2): stopped at Step 4 of 6. Step 3: no card in the step could be identified
- [ ] [Resonator](Resonator Deck Analysis.html) - Classic Core Combo: The 1-Card Soul Resonator Line (Line 3): stopped at Step 5 of 5. Step 4: depends on the opponent's cards, turn or battle
- [ ] [Ritual Beast](Ritual Beast Deck Analysis.html) - Core Combo: The "El Clasico" Loop (Line 3): stopped at Step 2 of 7. Step 1: describes an effect resolving rather than an action to take
- [ ] [Runick](Runick Deck Analysis.html) - Core Combo: Establishing the Fountain: stopped at Step 3 of 3. Step 1: no card in the step could be identified
- [ ] [Skilled Magician](Skilled Magician Deck Analysis.html) - Foundational Combo: Path to the Boss: stopped at Step 3 of 3. Step 2: describes an effect resolving rather than an action to take
- [ ] [Synchron](Synchron Deck Analysis.html) - The Speederless Ladder: stopped at Step 6 of 6. Step 4: describes an effect resolving rather than an action to take
- [ ] [Tenyi](Tenyi Deck Analysis.html) - Core Combo: stopped at Step 3 of 3. Step 3: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Therion](Therion Deck Analysis.html) - Core Combo: stopped at Step 2 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Utopia](Utopia Deck Analysis.html) - Core Combo: stopped at Step 1 of 3. Step 1: no card in the step could be identified
- [ ] [Utopia](Utopia Deck Analysis.html) - Core Combo (Line 2): stopped at Step 4 of 8. Step 2: step is not specific enough to replay (examples, "any", cross-references); Step 3: describes an effect resolving rather than an action to take
- [ ] [Warrior Lady](Warrior Lady Deck Analysis.html) - Core Combo Pathways: stopped at Step 3 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Water Dragon](Water Dragon Deck Analysis.html) - Core Combo: Duoterion Starter: stopped at Step 3 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Winged Dragon of Ra](Winged Dragon of Ra Deck Analysis.html) - Part IV: Sacred Combo Lines (Line 2): stopped at Step 2 of 3. Step 1: depends on the opponent's cards, turn or battle
- [ ] [lswarm](lswarm Deck Analysis.html) - Core Combo: Summoning the Ophion Lock: stopped at Step 2 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references)

## Partially Verified

Every step the engine could simulate was legal. The steps listed were not simulated.

- [Abyss Actor](Abyss Actor Deck Analysis.html) - Core Combo (Line 3): Step 1 (depends on the opponent's cards, turn or battle)
- [Amazement](Amazement Deck Analysis.html) - Core Combo: Step 2 (describes an effect resolving rather than an action to take)
- [Ancient Warriors](Ancient Warriors Deck Analysis.html) - Core Combo: The "Three Visits" Line: Step 2 (depends on the opponent's cards, turn or battle)
- [Aquaactress](Aquaactress Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Artifact](Artifact Deck Analysis.html) - Legacy Combo: The Ignition Setup (Line 2): Step 1 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (depends on the opponent's cards, turn or battle)
- [Artmage](Artmage Deck Analysis.html) - Core Combo: The Non-Finito Bridge (Line 3): Step 3 (describes an effect resolving rather than an action to take)
- [Bamboo Sword](Bamboo Sword Deck Analysis.html) - Core Combo: The Isolde Draw Engine: Step 2 (describes an effect resolving rather than an action to take); Step 3 (no card in the step could be identified); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Batteryman](Batteryman Deck Analysis.html) - Core Combo: The 2-Card Swarm: Step 3 (depends on the opponent's cards, turn or battle)
- [Battleguard](Battleguard Deck Analysis.html) - Core Combo: Isolde to Rank 5: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Battlin' Boxer](Battlin' Boxer Deck Analysis.html) - The Championship Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (describes an effect resolving rather than an action to take)
- [Black Dinosaur](Black Dinosaur Deck Analysis.html) - One-Card Combo: Oviraptor + Lost World: Step 2 (depends on the opponent's cards, turn or battle); Step 2 (describes an effect resolving rather than an action to take)
- [Bounzer](Bounzer Deck Analysis.html) - Core Combo: Hieratic Engine into Bounzer: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Bujin](Bujin Deck Analysis.html) - Core Combo: Torifune into Utopic Draco Future: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Bystial](Bystial Deck Analysis.html) - Core Combo: Branded Bystial Fusion Line: Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [C Series](C Series Deck Analysis.html) - Core Combo: Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Chaos](Chaos Deck Analysis.html) - Core Combo: The Path to Synchro Dominance: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Chemicritter](Chemicritter Deck Analysis.html) - Core Combo: The Synthesis Protocol: Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Cloudian](Cloudian Deck Analysis.html) - Core Combo: The Perfect Storm: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Code Breaker](Code Breaker Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Constellar](Constellar Deck Analysis.html) - Glorious Gallery Combos: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Crashbug](Crashbug Deck Analysis.html) - Core Combo: Step 2 (describes an effect resolving rather than an action to take); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Cubic](Cubic Deck Analysis.html) - Core Combo: The Crimson Nova Turbo OTK: Step 3 (depends on the opponent's cards, turn or battle)
- [D_D](D_D Deck Analysis.html) - Core Combo Walkthroughs (Line 3): Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Danger](Danger Deck Analysis.html) - Core Combo: The Nessie + Jackalope Starter: Step 1 (depends on the opponent's cards, turn or battle); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Deep Sea](Deep Sea Deck Analysis.html) - Core Combo: Step 2 (depends on the opponent's cards, turn or battle); Step 3 (depends on the opponent's cards, turn or battle)
- [Die Roll](Die Roll Deck Analysis.html) - Core Combo: Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Die Roll](Die Roll Deck Analysis.html) - Core Combo (Line 2): Step 1 (describes an effect resolving rather than an action to take); Step 2 (depends on the opponent's cards, turn or battle)
- [Digital Bug](Digital Bug Deck Analysis.html) - Core Combo: Step 2 (no card in the step could be identified)
- [Dinomist](Dinomist Deck Analysis.html) - Core Combo: The BTP Conversion: Step 2 (no card in the step could be identified); Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Djinn of the Rituals](Djinn of the Rituals Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Doom-Z](Doom-Z Archetype Deep Dive.html) - The Standard: 1-Card Full Combo: Step 2 (depends on the opponent's cards, turn or battle)
- [Dracoslayer](Dracoslayer Deck Analysis.html) - Core Combo: The Luster Chain (Line 2): Step 1 (depends on the opponent's cards, turn or battle)
- [Dracotail](Dracotail Archetype Breakdown.html) - Core Combo (Line 3): Step 1 (depends on the opponent's cards, turn or battle)
- [Dracotail](Dracotail Archetype Breakdown.html) - Core Combo (Line 4): Step 3 (describes an effect resolving rather than an action to take)
- [Dragunity](Dragunity Deck Analysis.html) - Core Combo: The 1-Card Remus Line: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Drytron](Drytron Deck Analysis.html) - Core Combo: Path to Ultimateness: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Elemental Hero](Elemental Hero Deck Analysis.html) - Core Combo: The "Faris" Starter (Line 3): Step 2 (describes an effect resolving rather than an action to take); Step 4 (describes an effect resolving rather than an action to take); Step 4 (depends on the opponent's cards, turn or battle)
- [End of the World](End of the World Deck Analysis.html) - Core Combo (Line 2): Step 2 (no card in the step could be identified); Step 3 (describes an effect resolving rather than an action to take); Step 4 (describes an effect resolving rather than an action to take); Step 5 (no card in the step could be identified); Step 5 (depends on the opponent's cards, turn or battle)
- [Endymoin](Endymoin Deck Analysis.html) - Core Combo: The Path to Mastery: Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Evil Hero](Evil Hero Deck Analysis.html) - Core Combo: The Path to Malicious Bane: Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Fishborg](Fishborg Deck Analysis.html) - Core Combo: The Harpooner Extender: Step 1 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Flower Cardian](Flower Cardian Deck Analysis.html) - The Art of the Stack: Core Combo: Step 2 (describes an effect resolving rather than an action to take); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Fortune Lady](Fortune Lady Deck Analysis.html) - Core Combo: The Path to Advantage: Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (describes an effect resolving rather than an action to take)
- [G Golem](G Golem Deck Analysis.html) - Core "Pure" Combo: Pebble Dog + Rock Hammer: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Gagaga](Gagaga Deck Analysis.html) - Core Combo: The 1-Card 'Onomatopaira' Starter: Step 4 (step is not specific enough to replay (examples, "any", cross-references)); Step 4 (step is not specific enough to replay (examples, "any", cross-references))
- [Gaia](Gaia Deck Analysis.html) - Core Combo (Line 2): Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Genex](Genex Deck Analysis.html) - Core Combo: The One-Card Assembly Line: Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (no card in the step could be identified)
- [Gladiator Beast](Gladiator Beast Deck Analysis.html) - Path to Victory: The Core Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Gogogo](Gogogo Deck Analysis.html) - The Third Card: Number 39: Utopia, Emissary of Light: Step 2 (no card in the step could be identified); Step 3 (depends on the opponent's cards, turn or battle); Step 3 (depends on the opponent's cards, turn or battle)
- [Hand](Hand Deck Analysis.html) - Core Combo: Step 1 (depends on the opponent's cards, turn or battle); Step 2 (depends on the opponent's cards, turn or battle); Step 3 (depends on the opponent's cards, turn or battle)
- [Heroic](Heroic Deck Analysis.html) - Core Combo: The Claivesolish OTK: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Infernal](Infernal Deck Analysis.html) - Combo Execution: Accessing Pyro Strategies (Line 3): Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Infernity](Infernity Deck Analysis.html) - Core Combo: From Zero to Oppression: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Invoked](Invoked Deck Analysis.html) - Strategic Combo Lines (Line 2): Step 4 (step is not specific enough to replay (examples, "any", cross-references))
- [Kaiser Glider](Kaiser Glider Deck Analysis.html) - Primary Combo: The "Lair of Darkness" Removal (Line 2): Step 1 (depends on the opponent's cards, turn or battle)
- [Knightmare](Knightmare Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references)); Step 2 (depends on the opponent's cards, turn or battle)
- [Koaki Meiru](Koaki Meiru Deck Analysis.html) - Core Combo: The "Urnight into Maximus" OTK: Step 3 (depends on the opponent's cards, turn or battle)
- [Legacy of Greed](Legacy of Greed Deck Analysis.html) - Core Combo: Step 1 (describes an effect resolving rather than an action to take)
- [Mannadium](Mannadium Deck Analysis.html) - The Riumheart 1-Card Combo: Step 2 (describes an effect resolving rather than an action to take)
- [Masked hero](Masked hero Deck Analysis.html) - Core Combo: The Vision HERO Engine: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Megalith](Megalith Deck Analysis.html) - Core Combo: The "Anastasis" 1-Card Starter: Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 4 (describes an effect resolving rather than an action to take)
- [Mimighoul](Mimighoul Deck Analysis.html) - Combo Trajectories (Line 6): Step 1 (no card in the step could be identified)
- [Mokey Mokey](Mokey Mokey Deck Analysis.html) - Core Combo: The King's Gambit OTK: Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Monarch](Monarch Deck Analysis.html) - Core Combo: The One-Card Monarch: Step 3 (describes an effect resolving rather than an action to take)
- [Mystic Swordsman](Mystic Swordsman Deck Analysis.html) - Core Combo (Line 2): Step 1 (depends on the opponent's cards, turn or battle); Step 1 (depends on the opponent's cards, turn or battle); Step 2 (depends on the opponent's cards, turn or battle)
- [Mystical Elf](Mystical Elf Deck Analysis.html) - Strategic Execution: Combo Lines (Line 2): Step 3 (describes an effect resolving rather than an action to take)
- [Numeron](Numeron Deck Analysis.html) - Core Combo: The Path to Victory: Step 3 (depends on the opponent's cards, turn or battle)
- [Obelisk the Tormentor](Obelisk the Tormentor Deck Analysis.html) - Core Combos & Synergistic Engines (Line 2): Step 4 (depends on the opponent's cards, turn or battle)
- [Obelisk the Tormentor](Obelisk the Tormentor Deck Analysis.html) - Core Combos & Synergistic Engines (Line 5): Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (depends on the opponent's cards, turn or battle)
- [Orcust](Orcust Deck Analysis.html) - Core Combo: The Girsu Starter (Line 2): Step 4 (step is not specific enough to replay (examples, "any", cross-references))
- [P series](P series Deck Analysis.html) - Core Combo (Line 2): Step 1 (depends on the opponent's cards, turn or battle)
- [Pendulum Magician](Pendulum Magician Deck Analysis.html) - Core Combo: Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Penguin](Penguin Deck Analysis.html) - Core Combo: Step 1 (describes an effect resolving rather than an action to take)
- [Performapal](Performapal Deck Analysis.html) - The circus gets thinner: Step 3 (describes an effect resolving rather than an action to take)
- [Performapal](Performapal Deck Analysis.html) - The Partner Card: Odd-Eyes Override Dragon: Step 1 (no card in the step could be identified)
- [Performapal](Performapal Deck Analysis.html) - Core Combo: Step 3 (no card in the step could be identified); Step 4 (no card in the step could be identified); Step 4 (no card in the step could be identified)
- [Phantom knights](Phantom knights Deck Analysis.html) - Core Combo Sequences: Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (depends on the opponent's cards, turn or battle)
- [Potan](Potan Deck Analysis.html) - Foundational Combo: 3-Card Synchro Loop: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Predaplant](Predaplant Deck Analysis.html) - Core Combo: The Scorpio Starter (Line 2): Step 8 (step is not specific enough to replay (examples, "any", cross-references)); Step 9 (depends on the opponent's cards, turn or battle)
- [Qliphort](Qliphort Deck Analysis.html) - Core Combo: Step 3 (no card in the step could be identified)
- [Radiant Typhoon](Radiant Typhoon Deck Analysis.html) - Core Combo: The 1.5 Card Opening: Step 3 (no card in the step could be identified)
- [Rikka](Rikka Deck Analysis.html) - Core Combo: The "Petal" Starter: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Ryuge](Ryuge Deck Analysis.html) - Core Combo: The Ryu-Ge Rising Starter: Step 3 (no card in the step could be identified)
- [Ryzeal](Ryzeal Deck Analysis.html) - Core Combo: The Ice Ryzeal Standard: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [S-Force](S-Force Deck Analysis.html) - Core Combo (Line 2): Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Shaddol](Shaddol Deck Analysis.html) - Signature Glorious Gallery Combos: Step 5 (describes an effect resolving rather than an action to take); Step 5 (step is not specific enough to replay (examples, "any", cross-references))
- [Shaddol](Shaddol Deck Analysis.html) - Signature Glorious Gallery Combos (Line 2): Step 1 (describes an effect resolving rather than an action to take); Step 3 (describes an effect resolving rather than an action to take); Step 4 (step is not specific enough to replay (examples, "any", cross-references))
- [Skull Servant](Skull Servant Deck Analysis.html) - Core Combo: The 'Moissa Wight' Starter: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Skyscraper](Skyscraper Deck Analysis.html) - Core Combo: Step 1 (depends on the opponent's cards, turn or battle)
- [Sphinx](Sphinx Deck Analysis.html) - Combo Line: The Theinen OTK: Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (depends on the opponent's cards, turn or battle)
- [Stardust](Stardust Deck Analysis.html) - Core Combo (Line 2): Step 2 (depends on the opponent's cards, turn or battle); Step 2 (describes an effect resolving rather than an action to take); Step 4 (no card in the step could be identified)
- [Stygian](Stygian Deck Analysis.html) - Core Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Sylvan Deck Analyis](Sylvan Deck Analyis.html) - Cultivating a Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (describes an effect resolving rather than an action to take)
- [Synchron](Synchron Deck Analysis.html) - Core Combo: Step 1 (no card in the step could be identified)
- [Tenpai Dragon](Tenpai Dragon Deck Analysis.html) - Core Combo: Step 3 (depends on the opponent's cards, turn or battle)
- [Tindangle Deck Analyis](Tindangle Deck Analyis.html) - Core Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Trains](Trains Deck Analysis.html) - Blueprint for Victory: The Legacy Harvester Combo (Line 2): Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Tri-Brigade](Tri-Brigade Deck Analysis.html) - Foundational Combos: Step 2 (describes an effect resolving rather than an action to take)
- [Triamid](Triamid Deck Analysis.html) - Core Combo: Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Utopia](Utopia Deck Analysis.html) - Core Combo (Line 3): Step 1 (depends on the opponent's cards, turn or battle); Step 2 (depends on the opponent's cards, turn or battle); Step 3 (depends on the opponent's cards, turn or battle); Step 4 (depends on the opponent's cards, turn or battle); Step 5 (depends on the opponent's cards, turn or battle)
- [Valkyrie](Valkyrie Deck Analysis.html) - Core Combo: Step 3 (depends on the opponent's cards, turn or battle)
- [Veda](Veda Deck Analysis.html) - Core Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Vendread](Vendread Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Vylon](Vylon Deck Analysis.html) - Core Combo: Step 2 (step is not specific enough to replay (examples, "any", cross-references)); Step 2 (no card in the step could be identified); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [War Rock](War Rock Deck Analysis.html) - Core Combo: Step 3 (depends on the opponent's cards, turn or battle)
- [White Forest](White Forest Deck Analysis.html) - Core Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Yang Zing](Yang Zing Deck Analysis.html) - Core Combo: Step 3 (describes an effect resolving rather than an action to take); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Yosenju](Yosenju Deck Analysis.html) - The Foundational Combo: The Kama Chain: Step 2 (depends on the opponent's cards, turn or battle)
- [Zubaba](Zubaba Deck Analysis.html) - Core Combo & Strategy (Line 2): Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (describes an effect resolving rather than an action to take)
- [Zubaba](Zubaba Deck Analysis.html) - Core Combo & Strategy (Line 3): Step 3 (no card in the step could be identified)

