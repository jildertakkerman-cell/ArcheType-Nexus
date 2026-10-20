# Headless Yu-Gi-Oh! OCGCore HTML Combo Audit

Generated: Tue, 20 Oct 2026 13:47:52 GMT

### Summary
- **Pages Audited**: 409
- **Total Combos Audited**: 538
- **Total Steps Audited**: 1806
- **100% Legal Confirmed**: 342
- **Partially Verified** (no illegal play found; some prose steps could not be simulated): 114
- **Likely Illegal** (the card was in place and the engine refused the action): 24
- **Needs Review** (a card the step uses never reached the hand/field, or the harness crashed): 12
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

### [ ] [Code Talker](Code Talker Deck Analysis.html) - Standard Combo Protocol (Line 2)
- **File**: `Code Talker Deck Analysis.html`
- **Failed at**: Step 1 of 4
- **Step Title**: "Climb, hold a zone"
- **Written Step**: *"Link Summon Integration into the Extra Monster Zone. Keep one monster in a zone its bottom arrows point at."*
- **Engine Violation**: `Step 1 ("Link Summon Integration into the Extra Monster Zone.") was not offered as a legal action by the duel engine. Decode Talker Integration is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`

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

### [ ] [Gouki](Gouki Deck Analysis.html) - Core Combo Walkthroughs (Line 3)
- **File**: `Gouki Deck Analysis.html`
- **Failed at**: Step 2 of 4
- **Step Title**: "The Loop Enabler"
- **Written Step**: *"Use Gouki Re-Match (searched earlier) to revive 2 Goukis. Link climb into the Pre-Errata Firewall Dragon . Its non-HOPT Special Summon effect is now live."*
- **Engine Violation**: `Step 4 ("Use Gouki Re-Match (searched earlier) to revive 2 Goukis.") was not offered as a legal action by the duel engine. Gouki Re-Match is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Gouki Machine Suprex (29099860)`
  - `Selected: Gouki Suprex (24073068) from location 2`

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

### [ ] [Malefic](Malefic Deck Analysis.html) - The 2026 Combo Lines (Line 3)
- **File**: `Malefic Deck Analysis.html`
- **Failed at**: Step 1 of 7
- **Step Title**: "The Starter"
- **Written Step**: *"Normal Summon Malefic Paradox Gear and Tribute it: Special Summon Malefic Parallel Gear from the Deck and add Malefic Stardust Dragon to your hand."*
- **Engine Violation**: `Step 2 ("Tribute it: Special Summon Malefic Parallel Gear from the Deck and add Malefic Stardust Dragon to your hand.") was not offered as a legal action by the duel engine. Malefic Paradox Gear is in the Monster Zone, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Malefic Paradox Gear (48829461)`

### [ ] [Mega Phantom Beast](Mega Phantom Beast Deck Analysis.html) - Core Combo: Tetherwolf to Rank 10
- **File**: `Mega Phantom Beast Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Extension & Swarm"
- **Written Step**: *"Use effects to summon Harrliard and Coltwing . A common sequence involves using Harrliard to tribute tokens and bring out other MPBs from hand, triggering multiple effects that flood the board."*
- **Engine Violation**: `Step 3 ("Use effects to summon Harrliard and Coltwing.") was not offered as a legal action by the duel engine. Mecha Phantom Beast Harrliard is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Mecha Phantom Beast Tetherwolf (67922702)`
  - `Step 3: Transitioning to End Phase for remaining actions`

### [ ] [Mimighoul](Mimighoul Deck Analysis.html) - Combo Trajectories (Line 4)
- **File**: `Mimighoul Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Generic Search"
- **Written Step**: *"Deploy and flip Flower. Utilize its effect to bypass archetype targets entirely and search Guard Dog directly to your hand."*
- **Engine Violation**: `Step 1 ("Deploy and flip Flower.") was not offered as a legal action by the duel engine. Mimighoul Flower is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

### [ ] [Number](Number Deck Analysis.html) - The Tournament Proof: Dwayne Howell's Onomat Utopia
- **File**: `Number Deck Analysis.html`
- **Failed at**: Step 4 of 8
- **Written Step**: *"Overlay into Galaxy Photon Dragon, detach to search Galaxy-Eyes Tachyon Primal . The detached Zubababa Knight triggers too and adds a "Gagaga" monster from the Deck."*
- **Engine Violation**: `Step 5 ("Overlay into Galaxy Photon Dragon, detach to search Galaxy-Eyes Tachyon Primal.") was not offered as a legal action by the duel engine. Galaxy Photon Dragon is in the Extra Deck, but the board at this point can't summon it (materials, Levels or summon conditions).`
- **Prior Legal Plays**:
  - `Step 1: Not simulated - commentary, not a game action`
  - `Step 2: Legal Normal Summon of Gagaga Ganbara Knight (9491461)`

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

### [ ] [Supreme King](Supreme King Deck Analysis.html) - Historical Combo: The Electrumite Loop
- **File**: `Supreme King Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "The Starter"
- **Written Step**: *"Start by sending Darkwurm to the GY (e.g., with `Dragon Shrine`). Darkwurm revives itself and searches Gate Magician , which in turn summons itself and searches a trap."*
- **Engine Violation**: `Step 1 ("Start by sending Darkwurm to the GY (e.g., with `Dragon Shrine`).") was not offered as a legal action by the duel engine. Supreme King Dragon Darkwurm is in the hand, but none of its summons or effects can be used at this point (condition, cost, once-per-turn or timing).`

## Needs Review

The engine refused a step because a card it uses was never brought to the hand or field by an earlier step. Either the write-up skips a step (a search, a draw) or the harness picked a different card than the writer meant.

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

### [ ] [Dracotail](Dracotail Archetype Breakdown.html) - Core Combo (Line 7)
- **File**: `Dracotail Archetype Breakdown.html`
- **Failed at**: Step 3 of 3
- **Step Title**: "Activate & Resolve"
- **Written Step**: *"Activate Branded Fusion . Send Albaz + Faimena to summon Albion . CL1: Albion , CL2: Faimena ."*
- **Engine Violation**: `Step 5 ("Activate Branded Fusion.") was not offered as a legal action by the duel engine. Branded Fusion is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Rahu Dracotail (32548318)`
  - `Selected: Dracotail Gulamel (79755671) from location 64`

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

### [ ] [Guardragon](Guardragon Deck Analysis.html) - Peak Power: The Forbidden Combo (Historical)
- **File**: `Guardragon Deck Analysis.html`
- **Failed at**: Step 1 of 3
- **Step Title**: "Summon Elpy & Tutor REDMD"
- **Written Step**: *"Summon Elpy (Forbidden) to a zone pointed to by another Link Monster. Activate Elpy's effect to Special Summon Red-Eyes Darkness Metal Dragon directly from the Deck."*
- **Engine Violation**: `Step 2 ("Activate Elpy's effect to Special Summon Red-Eyes Darkness Metal Dragon directly from the Deck.") was not offered as a legal action by the duel engine. Guardragon Elpy is not in the Extra Deck any more (it is in the Monster Zone).`
- **Prior Legal Plays**:
  - `Step 1: Legal Special Summon of Guardragon Elpy (86148577)`

### [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 4)
- **File**: `Hecahands Deck Analysis.html`
- **Failed at**: Step 1 of 6
- **Step Title**: "Chimera Engine Start"
- **Written Step**: *"Normal Summon Swordknight . Tribute → SS Berfomet . Add Chimera Fusion & Gazelle."*
- **Engine Violation**: `Step 2 ("Special Summon Berfomet.") was not offered as a legal action by the duel engine. Berfomet is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Normal Summon of Mirror Swordknight (28954097)`

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

### [ ] [Mimighoul](Mimighoul Deck Analysis.html) - Combo Trajectories
- **File**: `Mimighoul Deck Analysis.html`
- **Failed at**: Step 2 of 3
- **Step Title**: "Summon & Flip"
- **Written Step**: *"Slime is Set to opponent's field. Special Summon Archfiend, trigger effect to flip Slime."*
- **Engine Violation**: `Step 3 ("Special Summon Archfiend, trigger effect to flip Slime.") was not offered as a legal action by the duel engine. The only effect matching its wording was Mimighoul Armor's, and it did not move Mimighoul Archfiend or Mimighoul Slime. Mimighoul Archfiend is still in the Deck: no earlier step added it to the hand or field.`
- **Prior Legal Plays**:
  - `Step 1: Legal Activation of Mimighoul Slime (80551022)`
  - `Step 3: Legal Activation of Mimighoul Armor (11677278) (matched by effect wording)`

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

## Could Not Verify

Not evidence of an illegal play: the replay stopped after a step the engine could not simulate from the prose (examples, opponent-dependent steps, unidentified cards), so later failures may just reflect that step.

- [ ] [Appliancer](Appliancer Deck Analysis.html) - Core Combo: The Codebreaker Pivot: stopped at Step 3 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references); Step 2: describes an effect resolving rather than an action to take
- [ ] [Chaos](Chaos Deck Analysis.html) - Core Combo: The Path to Synchro Dominance (Line 2): stopped at Step 3 of 4. Step 1: the engine has no script for a card in this step
- [ ] [Cocoon of evolution](Cocoon of evolution Deck Analysis.html) - Foundational Combo: The Two-Card Board Break: stopped at Step 2 of 3. Step 1: depends on the opponent's cards, turn or battle; Step 1: describes an effect resolving rather than an action to take
- [ ] [Constellar](Constellar Deck Analysis.html) - Glorious Gallery Combos (Line 2): stopped at Step 7 of 8. Step 2: describes an effect resolving rather than an action to take
- [ ] [Crusadia](Crusadia Deck Analysis.html) - Core Combo: The Path to Equimax: stopped at Step 2 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Dinomorphia](Dinomorphia Deck Analysis.html) - Core Combo: The Therizia-to-Rexterm Lockdown: stopped at Step 3 of 3. Step 2: no card in the step could be identified
- [ ] [Dododo](Dododo Deck Analysis.html) - Core Combo: The 1-Card Warrior-Kage Nexus (Line 3): stopped at Step 7 of 9. Step 4: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Endymoin](Endymoin Deck Analysis.html) - Core Combo: The Path to Mastery (Line 2): stopped at Step 5 of 6. Step 4: describes an effect resolving rather than an action to take
- [ ] [Entity](Entity Deck Analysis.html) - Core Combo: stopped at Step 2 of 3. Step 2: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [From the Underworld](From the Underworld Deck Analysis.html) - Core Combo: stopped at Step 3 of 3. Step 2: describes an effect resolving rather than an action to take
- [ ] [Gagaga](Gagaga Deck Analysis.html) - Core Combo: The 1-Card 'Onomatopaira' Starter (Line 2): stopped at Step 3 of 3. Step 2: depends on the opponent's cards, turn or battle; Step 3: depends on the opponent's cards, turn or battle; Step 3: depends on the opponent's cards, turn or battle
- [ ] [Galaxy-photon](Galaxy-photon Deck Analysis.html) - Core Combo: Delta Wing Ignition (Line 2): stopped at Step 5 of 5. Step 2: no card in the step could be identified; Step 3: commentary, not a game action; Step 3: no card in the step could be identified
- [ ] [Geargia](Geargia Deck Analysis.html) - Core Combo: The Armor-to-Gigant X Loop: stopped at Step 1 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Gogogo](Gogogo Deck Analysis.html) - Modern Core Combos: stopped at Step 2 of 4. Step 2: no card in the step could be identified
- [ ] [Gusto](Gusto Deck Analysis.html) - Core Combo: The Sphreez "Stop Hitting Yourself" OTK: stopped at Step 2 of 3. Step 1: step is not specific enough to replay (examples, "any", cross-references)
- [ ] [Hecahands](Hecahands Deck Analysis.html) - Core Combo (Line 3): stopped at Step 3 of 3. Step 1: depends on the opponent's cards, turn or battle
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
- [Adamancipator](Adamancipator Archetype Breakdown.html) - Core Combo: The "Block Dragon Turbo" Strategy (Historical) (Line 2): Step 2 (describes an effect resolving rather than an action to take); Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Amazement](Amazement Deck Analysis.html) - Core Combo: Step 2 (describes an effect resolving rather than an action to take)
- [Ancient Warriors](Ancient Warriors Deck Analysis.html) - Core Combo: The "Three Visits" Line: Step 2 (depends on the opponent's cards, turn or battle)
- [Aquaactress](Aquaactress Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Armed Dragon](Armed Dragon Deck Analysis.html) - Core Combo: The "Drill" Pivot: Step 2 (describes an effect resolving rather than an action to take); Step 2 (describes an effect resolving rather than an action to take)
- [Artifact](Artifact Deck Analysis.html) - Legacy Combo: The Ignition Setup (Line 2): Step 1 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (depends on the opponent's cards, turn or battle)
- [Artmage](Artmage Deck Analysis.html) - Core Combo: The Non-Finito Bridge (Line 3): Step 3 (describes an effect resolving rather than an action to take)
- [Ashened](Ashened Deck Analysis.html) - Core Combo: The Awakening Starter: Step 2 (depends on the opponent's cards, turn or battle); Step 3 (describes an effect resolving rather than an action to take)
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
- [Chimera](Chimera Deck Analysis.html) - The One-Card Combo Blueprint: Step 3 (depends on the opponent's cards, turn or battle)
- [Cloudian](Cloudian Deck Analysis.html) - Core Combo: The Perfect Storm: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Code Breaker](Code Breaker Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references))
- [Constellar](Constellar Deck Analysis.html) - Glorious Gallery Combos: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Constellar](Constellar Deck Analysis.html) - Glorious Gallery Combos (Line 3): Step 2 (describes an effect resolving rather than an action to take)
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
- [Gagaga](Gagaga Deck Analysis.html) - Core Combo: The 1-Card 'Onomatopaira' Starter: Step 4 (step is not specific enough to replay (examples, "any", cross-references)); Step 4 (step is not specific enough to replay (examples, "any", cross-references))
- [Gaia](Gaia Deck Analysis.html) - Core Combo (Line 2): Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Genex](Genex Deck Analysis.html) - Core Combo: The One-Card Assembly Line: Step 3 (step is not specific enough to replay (examples, "any", cross-references)); Step 3 (no card in the step could be identified)
- [Gladiator Beast](Gladiator Beast Deck Analysis.html) - Path to Victory: The Core Combo: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Gogogo](Gogogo Deck Analysis.html) - The Third Card: Number 39: Utopia, Emissary of Light: Step 2 (no card in the step could be identified); Step 3 (depends on the opponent's cards, turn or battle); Step 3 (depends on the opponent's cards, turn or battle)
- [Hand](Hand Deck Analysis.html) - Core Combo: Step 1 (depends on the opponent's cards, turn or battle); Step 2 (depends on the opponent's cards, turn or battle); Step 3 (depends on the opponent's cards, turn or battle)
- [Heroic](Heroic Deck Analysis.html) - Core Combo: The Claivesolish OTK: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Infernal](Infernal Deck Analysis.html) - Combo Execution: Accessing Pyro Strategies (Line 3): Step 2 (step is not specific enough to replay (examples, "any", cross-references))
- [Infernoid](Infernoid Deck Analysis.html) - Core Combo Walkthrough: Step 3 (depends on the opponent's cards, turn or battle)
- [Invoked](Invoked Deck Analysis.html) - Strategic Combo Lines (Line 2): Step 4 (step is not specific enough to replay (examples, "any", cross-references))
- [Kaiser Glider](Kaiser Glider Deck Analysis.html) - Primary Combo: The "Lair of Darkness" Removal (Line 2): Step 1 (depends on the opponent's cards, turn or battle)
- [Knightmare](Knightmare Deck Analysis.html) - Core Combo: Step 1 (step is not specific enough to replay (examples, "any", cross-references)); Step 2 (depends on the opponent's cards, turn or battle)
- [Koaki Meiru](Koaki Meiru Deck Analysis.html) - Core Combo: The "Urnight into Maximus" OTK: Step 3 (depends on the opponent's cards, turn or battle)
- [Legacy of Greed](Legacy of Greed Deck Analysis.html) - Core Combo: Step 1 (describes an effect resolving rather than an action to take)
- [Mannadium](Mannadium Deck Analysis.html) - The Riumheart 1-Card Combo: Step 2 (describes an effect resolving rather than an action to take)
- [Masked hero](Masked hero Deck Analysis.html) - Core Combo: The Vision HERO Engine: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
- [Megalith](Megalith Deck Analysis.html) - Core Combo: The "Anastasis" 1-Card Starter: Step 3 (step is not specific enough to replay (examples, "any", cross-references))
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
- [Predaplant](Predaplant Deck Analysis.html) - Core Combo: The Scorpio Starter (Line 2): Step 4 (describes an effect resolving rather than an action to take); Step 5 (describes an effect resolving rather than an action to take); Step 8 (step is not specific enough to replay (examples, "any", cross-references)); Step 9 (depends on the opponent's cards, turn or battle)
- [Qliphort](Qliphort Deck Analysis.html) - Core Combo: Step 3 (no card in the step could be identified)
- [Radiant Typhoon](Radiant Typhoon Deck Analysis.html) - Core Combo: The 1.5 Card Opening: Step 3 (no card in the step could be identified)
- [Red Dragon Archfiend](Red Dragon Archfiend Deck Analysis.html) - Core Operational Combo Sequences (Line 2): Step 2 (step is not specific enough to replay (examples, "any", cross-references))
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

