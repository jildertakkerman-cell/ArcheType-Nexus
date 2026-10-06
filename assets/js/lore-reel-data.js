/**
 * lore-reel-data.js — the story beats shown by lore-reel.js at the top of a
 * page's Lore Archive. Keyed by the page's data-lore-reel value.
 *
 * label   accessible name of the slideshow
 * slides  in story order; slide k's caption is the k-th <li> of the page's
 *         .lore-reel-story list, so keep the two in the same order.
 *         '|' starts a new act (a wider gap between the pips); it isn't a slide.
 *   card   exact card name; its cropped art is the slide, and a click opens its popup
 *   title  chapter title, shown after a Roman numeral
 *   color  the beat's colour: chapter label, progress pip, numeral in the whole story
 *   pan    [start, end] of the drift: the centre of the frame's band on the art,
 *          0 (top) to 1 (bottom). Clamped to the art, so phones' taller frame
 *          drifts less.
 *   on     optional: cast names to light on this slide, for a passage that names
 *          no one (otherwise the names in the passage decide)
 *
 * cast    optional "Who's who" row, one entry per person
 *   name   label under the portrait
 *   color  portrait ring and name colour
 *   names  names that light the portrait up when the current passage uses them
 *          (whole words, case-sensitive); default [name]
 *   forms  the cards this person is, in order; each shows from slide `from` on
 *     card   exact card name: portrait art and popup
 *     as     short form name shown under the person's name ("as Diactorus")
 *     face   [x, y] of the face in the cropped art, 0-1 from the top-left
 *     zoom   optional, default 2.4
 *
 * The story never names cards, so pairing art with a beat is a reading of the art.
 * Artmage (checked September 2026): The Valuable Book EX 6 story, translated by
 * YGOrganization. The Power Patron appears in the art of Succession, Assault and
 * Awakening (Yugipedia card trivia): Assault is the DoomZ raid on the succession
 * ceremony, Awakening the Patron speaking to the wounded Medius. VBEX6 prints
 * Movement -Pedigree- beside Graflare facing his brother Drastea; the last three
 * slides follow the "Ars Magna" story (V Jump, via YGOrganization) and the card
 * trivia: Purification Power Patron (Non-Finito) carries Theorealized Medius out,
 * then the two become Mediclius. Medius the Pure, Theorealize, Theorealize
 * Overdrive, DoomZ Break - Diactorus and Theorealize Liberation follow the page's
 * own "Medius saga" section (Beyond the Brave tab), whose order is the community's
 * reading of the art. The truce shows DoomZ XIII Over - Graflareio, Graflare in
 * the armor its caption describes.
 *
 * Invoked (checked September 2026, via Yugipedia): the OCG Stories "Magistus"
 * manga for Crowley's youth, Aiwass and Omega; the Master Guide 6 storylines and
 * card trivia for the Invoked, Madness, Caliga and the First Propheseer; THE
 * CHRONICLES episodes 13 and 16 for the Reminiscent's journey. The art pairings
 * come from card trivia: Crowley, the Gifted Magistus shows Chorozo; Magistus
 * Theurgy shows the four Magistus; the Invoker of Madness shows Aleister turning
 * into Caliga; the First Propheseer is an older Aleister kept in the Grand
 * Spellbook Tower, still with Caliga's horns; Invocation's second art and manga
 * chapter 13 show Omega; Undaunted Bumpkin Beast is the impostor's beast;
 * Mechaba is the knight and De Anima the black dragon of the final battle; the
 * Reminiscent carries that battle's sword and grail. Rilliona is the older
 * Magistus form of Witchcrafter Madame Verre, who goes by Verre in the anime.
 *
 * Sky Striker (checked September 2026, via Yugipedia): the OCG Stories "Sky
 * Striker Ace" arc, chapters 1-19 (chapter summaries, the Raye (manga), Roze
 * (manga), Kama, Zard and Cyanos pages). The anime shorts and Master Guide 6
 * tell a different version (Roze inside Zeke); the page notes it by its videos.
 * The art pairings come from card trivia: Himmel and Ciela are chapter 1 panels,
 * Akash a chapter 2 panel; Engage! was adapted into Raye's first activation in
 * chapter 1 and Afterburners! into chapter 5; Camellia and Cyanos are chapter 9
 * panels; Azalea Temperance is the armor Azalea made from Zard and Solferina in
 * chapter 15; S.P.E.C.T.R.A. is the sisters' mecha from chapter 17, destroyed by
 * Engage Zero in chapter 18; Linkage! was adapted into chapter 19's closing panel.
 *
 * Magistus (checked September 2026, via Yugipedia): Act I follows the OCG Stories
 * "Magistus" arc, chapters 1-14 (chapter summaries, the Zoroa (manga), Spenta,
 * Rilliona, Endymion (manga), Artemis (manga) and Vahram pages); Act II follows
 * THE CHRONICLES "Magistus" episodes I-IV (episodes 13-16), whose featured-card
 * lists name the cards adapted into each episode, e.g. Zoroa, the Magistus
 * Conflagrant Calamity as Vahram's new form in episode IV. Art pairings: Zoroa,
 * the Magistus Verethragna is the chapter 6 panel of Zoroa after absorbing Vahram;
 * Trismagistus shows the three Sages in Theurgy's circle; Alpha Summon shows
 * Crowley turning into Omega beside Endymion and Rilliona; Magistus Theurgy shows
 * the four Magistus.
 *
 * Elfnote (checked September 2026, via Yugipedia): The Valuable Book EX 6 card
 * storylines, Story III ("The Weavers of Sacred Poems: Elfnotes") and Story IV
 * ("The Opened Power Patron Portal"). Card trivia: Elfnotes: Welcome Home shows
 * the party arriving with Power Patron DoomZ; A Plea for Help shows Litera's
 * friends with the three Elfnotes; Rhapsodia of Madness shows Lucina and
 * Strelitzia, "the corrupted Synchro version of Elfnote Lucina after merging with
 * the Grand Spirit"; the Elfnote Power Patron appears in Theorealize Liberation;
 * Elfnote Regina is Litera "achieved by taking on the power of the Grand Spirit";
 * Quatrain of Succession shows Litera with Lucina, Fortuna and Tinia. Junoldo as
 * the Elfnote Power Patron's Shade follows VBEX6 (the Beasts who Serve the Gods
 * evolved into the Power Patron Shades) and the card names.
 *
 * Albaz saga ('albaz', shared by the Branded and Fallen of Albaz pages) and
 * Swordsoul (checked September 2026, via Yugipedia): The Valuable Book EX 2
 * ("The Land of the Abyss") and EX 3 ("The Decisive Battle of the Northern
 * Land") card storylines. Card trivia ties the art to the story in sequence:
 * Dogmatika Punishment (Fleurdelis downs Titaniklad) then Dogmatika Encounter;
 * Dogmatikalamity (Maximus waking the stigmata); Judgment of the Branded (Albion
 * and Golgonda); Branded Bond (Albion calmed with Ecclesia); Swordsoul Strife
 * (Longyuan's revolt); Branded Lost (Aluber stealing Albaz's power) then Branded
 * Fusion (Lubellion vs Mirrorjade); Icejade Curse (Kosmochlor's end); Branded
 * Sword (Mirrorjade vs Qixing); Branded in Central Dogmatika (Ecclesia taken by
 * Quem and Quaeritis); Decisive Battle of Golgonda; Branded Befallen (Rindbrumm,
 * Cartesia, Bystial Lubellion); Brightest, Blazing, Branded King (Sanctifire);
 * Swordsoul Emergence (the three knights meet the Swordsouls); The Abyss Dragon
 * Swordsoul (Qixing Longyuan fused with the Golgonda serpent), frozen in Icejade
 * Ran Aegirine; Icejade Gymir Aegirine (Aegirine with Kosmochlor's crown).
 *
 * World Legacy ('world-legacy', shared by the World Chalice, Crusadia,
 * Mekk-Knight, Knightmare, Krawler, Orcust and Guardragon pages; checked
 * September 2026, via Yugipedia): Master Guide 6 card storylines, File No. 01.
 * Each slide's card is one Master Guide 6 itself uses to illustrate that part of
 * the story. The Ib disambiguation page lists her forms (Crowned, Priestess,
 * Iblee, Justiciar, Lib); card trivia gives Beckoned as young Ningirsu, Lib's
 * brother as the reborn Girsu, Iblee and Idlee as Lee in Ib's and Galatea's
 * bodies, and World Legacy's Mind Meld as Crusadia Maximus doing what the
 * storyline says Auram did (Avramax = Avram + Maximus).
 *
 * The Sacred Tree war ('sacred-tree', shared by the Yang Zing, Qliphort, Nekroz,
 * Ritual Beast, Zefra and Infernoid pages; checked September 2026, via
 * Yugipedia): Master Guide 5 card storylines. Its sections name the monster at
 * the centre of each event, and each slide shows that monster: Constellar
 * Sombre creating the Yang Zing, Shaddoll Core (Cairngorgon, the revived Master
 * Diamond, after absorbing Kerykeion), Baxia, Stellarknight Delteros, El Shaddoll
 * Grysta, Wendigo (Ritual Beast Tamer Wen), Winda, Apoqliphort Towers, Infernoid
 * Onuncu, Stellarknight Constellar Diamond, Tellarknight Ptolemaeus (Sombre fused
 * with Constellar Diamond), Anoyatyllis, the Dragunity Divine Lance, Tierra and
 * Zefraath. Master Guide 5 prints no card lists with its sections, unlike Master
 * Guide 6.
 *
 * The Duel Terminal wars (checked September 2026, via Yugipedia): the Duel
 * Terminal Master Guide card storylines, the revised telling of Master Guide 3
 * Files 01-02 plus the events between them. 'dt-worm-war' is Age 1.0 (the Worm
 * invasion to Trishula) and the Sacred Spirit's seal from Age 1.5, shared by the
 * Worm, Ice Barrier, Ally of Justice, Genex, X-Saber, Naturia, Mist Valley,
 * Flamvell, Fabled, Jurrac and Dragunity pages. 'dt-great-war' is Noellia's past
 * from Age 1.5 and Age 2.0 (the Laval invasion to Sophia's defeat), shared by the
 * Gishki, Gem-Knight, Laval, Vylon, Gusto, lswarm and Constellar pages. Each
 * slide's card is one the guide prints with that section. Card trivia: Revealer
 * of the Ice Barrier is the young Noellia; Zirconia is Crystal at the limit of his
 * fusion, and the guide has Zirconia become Master Diamond; Seraphinite is Lazuli
 * fused with Virgo; Sombre and Kerykeion are Lazuli's and Rasalhague's fusions;
 * Oni-Gami Combo is Pearl striking Disigma; Aquamirror Cycle is Noellia reviving
 * Emilia; Jewels of the Valiant is Sombre and Kerykeion at Sophia's orb. The
 * Master Guide 5 reel ('sacred-tree') continues the story.
 *
 * Visas ('visas', shared by the Visas, Veda, Scareclaw, Tearlaments, Kashtira and
 * Mannadium pages; checked September 2026, via Yugipedia): The Valuable Book EX 3
 * No. 02 "The New Broken Worlds" (chapters 1-4) and EX 4 No. 01 "Sharv Sarga"
 * (chapters 5-7). Each slide's card is one the book prints with that chapter.
 * Card trivia: Scareclaw Light-Heart is a downgraded form of Reichheart, the
 * voice that travels on inside Visas; Mannadium Trisukta is Kitkallos's
 * Mannadium form; Visas Samsara is Amritara reborn by Veda's Sharv Sarga; Ages
 * of Stars and Frost shows him with Reichheart.
 *
 * Sinful Spoils ('sinful-spoils', shared by the Diabellstar, Snake-Eyes, White
 * Forest, Azamina and Morganite pages; checked September 2026, via Yugipedia):
 * The Valuable Book EX 5 No. 1 "Witch of the White Forest" (the prologue, Stories
 * III-IV and the epilogue) around EX 4 No. 15 "The Hidden Sinful Spoils"
 * (Stories I-II). Card trivia: Astellar grows up as Diabellstar and Elzette as
 * Diabellze; Susurrus of the Sinful Spoils shows the two girls with the apple;
 * Silvera and Rciela are the souls of Silvy and Rucia, whose bodies are the
 * saints in Azamina Debtors and Guilt of the Sinful Spoils; Snake-Eyes
 * Diabellstar is Diabellstar with Poplar after it ate the Goblins' beast; Sinful
 * Spoils Awakening is Elzette freed by Morgana's magical eyes, which the book
 * links to the Morganite; Azamina Moa Regina is Morgana's body.
 *
 * The Fire Island war ('fire-island', shared by the Fire King, Atlantean and
 * Mermail pages; checked September 2026, via Yugipedia): Master Guide 4 File
 * No. 01 and its sequel, The Valuable Book EX 5 No. 15. Where the two differ on
 * what Abyssgaios did in Poseidra's body, the reel follows the later book (he led
 * both armies against the island). Card trivia: Neptabyss is Abyssgaios after
 * losing his power; Abyss-squall is the bracelet.
 *
 * Ghost Meets Girl ('ghost-meets-girl', shared by the Shiranui and Mayakashi
 * pages): Master Guide 6 File No. 04. It pairs each Mayakashi's night form with
 * its daytime disguise (Yoko/Dakki, Tengu/Hajun, Yuki-Onna/Yuki-Musume); card
 * trivia puts Squire and Dakki in Ghost Meets Girl - A Shiranui's Story, and
 * Yuki-Onna attacking Skillsaga Supremacy in A Mayakashi's Manuscript. The
 * founder's portrait is the ghost of Shiranui Spectralsword, since the guide
 * describes the Samuraisaga card as Samurai holding the sword.
 *
 * Prophecy ('prophecy'): Master Guide 4 File No. 04, "the fate of one boy".
 * Card trivia: Reaper of Prophecy is the Fool, Mat, corrupted by the Spellbook
 * of the Master.
 *
 * Runick ('runick', shared by the Runick and Generaider pages): The Valuable
 * Book EX 3 No. 05, written as a strategy guide, so the captions keep its "you".
 * The guide names the bosses by title; the cards give their names (Frodi, Boss of
 * Swords; Hela, Boss of Doom). Card trivia: Laevatein is Loptr's upgraded form.
 *
 * Centur-Ion ('centur-ion'): The Valuable Book EX 4 No. 05. Card trivia: Legatia
 * is Primera, Trudea and Emeth VI combined.
 *
 * Rosters (kind: 'roster'), for pages whose official lore is profiles rather than
 * a story. people: in the order of the page's <li> profiles.
 *   name, tag (a code shown before the name), group (portraits are grouped by it),
 *   color, forms: the cards to pick from, each { card, as, face, pan } as above.
 * portraits: 'first' keeps each portrait on the person's first card, for rosters
 *   whose extra cards are scenes rather than forms (Mikanko's dances).
 * More rosters (checked September 2026, via Yugipedia): Clown Crew, The Valuable
 * Book EX 6 No. 2; Fiendsmith, EX 5 No. 6 (card trivia: Fiendsmith's Lacrima shows
 * Lacrima's ghostly image over the Fiendsmith); Argostars, EX 5 No. 2; S-Force, EX
 * No. 02; Live☆Twin, EX No. 04 and EX 5 No. 8; Purrely, EX 3 No. 06; Machina, EX
 * No. 09 (card trivia: Possesstorage and Resavenger are the DARK counterparts of
 * Soldier and Defender); Labrynth, EX 3 No. 04 (card trivia: Lady Labrynth is the
 * princess in a combat outfit; the knight is the figure in Welcome Labrynth);
 * Dinomorphia, EX 2 No. 02 (each humanoid's ancestor follows its name).
 *
 * Art trails (kind: 'trail'), for pages with no official story or profiles: stops
 * { card, title, color, face, pan, zoom }, walked in order, one <li> note per stop.
 * Notes come from Yugipedia card trivia ("X appears in this card's artwork"),
 * checked September 2026, plus official lines where a book has them (Witchcrafter:
 * Master Guide 6 File No. 08 and The Valuable Book EX 2; Time Thief: The Valuable
 * Book EX 4 No. 14). Trails: Witchcrafter, Dragonmaid, Evil Eye, Time Thief,
 * Madolche, Monarch, Bujin (citing the Gagaga Academy Tospedia storylines),
 * Melffy, Ojama, Solfachord, Prank-Kids, Noble Knight, Adamancipator, F.A., Abyss
 * Actor, Goblin (with Master Guide 6 File No. 03), Subterror, Vendread (citing the
 * Master Duel card storylines), Kozmo, Fur Hire (with The Valuable Book EX 6 No.
 * 15), SPYRAL (Master Guide 6 File No. 05 and The Valuable Book EX 4 No. 14), The
 * Weather, P.U.N.K. (The Valuable Book EX 2 No. 03 and EX 5 No. 7), Libromancer
 * (The Valuable Book EX 3 No. 11), Duston, War Rock, Yummy (The Valuable Book EX 6
 * No. 8), Magikey (EX 2 No. 08), Salamangreat, Ancient Warriors, Vaalmonica (EX 4
 * No. 06), Tenyi, Myutant, Morphtronic, Gagaga, Cyberdark, Dark World (Master
 * Guide 2 File No. 04), Impcantation, Trickstar. Roster: Gold Pride (The Valuable
 * Book EX 4 No. 03).
 * Batch of 2026-09-28: slideshows Gladiator Beast (Master Guide 2 File No. 06) and
 * machine-dragons on Cyber Dragon (The Valuable Book EX 5 No. 16); rosters Six Samurai
 * (Master Guide 2 File No. 05 and Master Guide 3 File Number 03, then and now), Crystal
 * Beast (MG2 File No. 07), Lightsworn (MG3 File Number 04, by unit), and from The
 * Valuable Book EX 6 Kewl Tune (No. 5), Hecahands (No. 3), Enneacraft (No. 4) and Radiant
 * Typhoon (No. 6); art trail Skull Servant (MG3 File Number 06, "find him").
 * Batch of 2026-09-28 (slideshows): Grepher (Master Guide 2 File No. 01, the two paths of
 * destiny), Koa'ki Meiru (Master Guide 3 File Number 05, the researcher's notes), Alien (MG2
 * File No. 08), Eldlich (The Valuable Book EX No. 05 and EX 5 No. 9) and adventurer on
 * Adventure (The Valuable Book EX 2 No. 05).
 * Batch 8 (2026-09-28): slideshows Zombie World (Master Guide 6 File No. 06), Vanquish Soul
 * (The Valuable Book EX 4 No. 07), Voiceless Voice (VBEX4 No. 02) and dragon-rulers on Dragon
 * Ruler (VBEX5 No. 12); rosters Maliss (VBEX5 No. 3, the White Rabbit's asides), Amazement
 * (VBEX2 No. 13), charmers on Charmer (MG2 File No. 03, each girl's four forms), Memento
 * (VBEX4 No. 04) and Dracotail (VBEX6 No. 7).
 * Roster Nouvelles (The Valuable Book EX 4 No. 08, "A Demonic Menu": the dishes by course).
 * Batch 9 (2026-09-28), slideshows from the official English Master Duel card storylines:
 * Geargia ("Gears of Justice Dispatch!"), Dream Mirror ("Dream Domination"), Digital Bug
 * ("Digital Bugs in Cyberspace"), Danger ("The Danger Files"), Herald ("The Herald's Guidance"),
 * Starry Knight ("Legend of the Starry Dragon") and Rikka ("The Rikka Fairies Descend").
 * Batch 10 (2026-09-28), from Master Guide 1: rosters Dark Scorpion, dd on D.D. (with the crew's
 * correlation diagram), Amazoness and Gravekeepers; slideshows mokey-mokey, revolution on Royal,
 * and inpachi (plus Master Guide 2 File No. 02, Kozaky's reconstruction).
 * Batch 11 (2026-09-28): the art trails on Myutant, Tenyi, Bujin, Vendread and The Weather became
 * slideshows, and Subterror's a roster, from the official English Master Duel card storylines.
 * Batch 12 (2026-09-28): slideshows Megalith and Karakuri, rosters Dinomist, Beetrooper and ua on
 * U.A. (Master Duel storylines), and Traptrix (Master Guide 4 File No. 09 + the Forest of the Traptrix leaflet).
 * Batch 13 (2026-09-29): art trails Yosenju, Toon, Raidraptor, Harpie, Majespecter and Metalfoes (Yugipedia card
 * trivia; the Metalfoes notes quote their Normal Monsters' flavor text, Harpie's quotes Master Guide 1's Ojama file).
 * Batch 14 (2026-09-29): art trails Hieratic, Vampire, Ancient Gear and Performapal (Yugipedia card trivia);
 * sacred-tree also on Shaddol.
 * Batch 15 (2026-09-29): rosters Gunkan, Ogdoadic (The Valuable Book EX 2), Ninja, Rescue-ACE (VBEX3) and
 * ursarctic-drytron on both pages (VBEX2 No. 11 & 12), with card trivia.
 * Batch 16 (2026-09-30): darklord slideshow (Master Guide 4 File No. 02 + VBEX No. 08); rosters Ryzeal, ryu-ge
 * (VBEX5), Nemleria, Aroma (VBEX4) and virtual-world (VBEX No. 06).
 * Batch 18 (2026-09-30): art trails Kaiju, Crystron, Lunalight, Unchained, dual-avatar and Marincess (Yugipedia card trivia).
 * Batch 19 (2026-09-30): art trails burning-abyss, Meklord, Simorgh and Angelechy (Yugipedia card trivia).
 * Batch 20 (2026-10-05): art trails Floowandereeze, Chronomaly, Gouki, Deskbot, Materiactor and Inzektor (Yugipedia card
 * trivia); deep-sea slideshow (The Valuable Book EX No. 07).
 * Batch 21 (2026-10-05): art trails Earthbound, Malefic, Igknight, Ghoti and Infernity (Yugipedia card trivia;
 * Igknight flavor texts).
 * Batch 22 (2026-10-05): art trails supreme-king, armed-dragon, Artifact, Watt, Numeron and symphonic-warrior
 * (Yugipedia card trivia).
 * Batch 23 (2026-10-05): art trails red-eyes, Blackwing, elemental-hero, psy-frame and Graydle
 * (Yugipedia card trivia).
 * Batch 24 (2026-10-05): art trails dark-magician, blue-eyes, odd-eyes, Kuriboh, Utopia and d-d
 * (Yugipedia card trivia).
 * Batch 25 (2026-10-05): art trails destiny-hero, Stardust, Shark, Nordic, fire-fist, arcana-force, flower-cardian
 * and Timelord
 * (Yugipedia card trivia).
 * Batch 26 (2026-10-05): art trails evil-hero, Gaia, Chimera, t-g, gimmick-puppet, battlin-boxer, phantom-knights,
 * red-dragon-archfiend, black-luster-soldier and Firewall
 * (Yugipedia card trivia).
 * Batch 27 (2026-10-06): art trails Speedroid, sacred-beast, superheavy-samurai, Venom, magnet-warrior, code-talker,
 * masked-hero and Horus
 * (Yugipedia card trivia).
 * Batch 28 (2026-10-06): art trails Cubic, Melodious, wind-up, Penguin, Gizmek, Dinowrestler, Predaplant, Resonator,
 * Battlewasp and Altergeist
 * (Yugipedia card trivia).
 * Sources (checked September 2026, via Yugipedia): K9, The Valuable Book EX 6 No. 9
 * (the personnel files); Ghostrick, Master Guide 4 File No. 07 (where each ghost
 * lives); Mikanko, The Valuable Book EX 3 No. 07 (the three families; each girl's
 * dance cards are the ones the book prints with her); Exosister, The Valuable Book
 * EX 2 No. 04 (team Lilium and each sister's messenger form); Vaylantz, The
 * Valuable Book EX 3 No. 03 (a magazine feature on the Vaylantz Wars board game,
 * so the roster is its unit list).
 */
(function () {
    'use strict';

    window.LoreReelData = window.LoreReelData || {};

    window.LoreReelData['artmage'] = {
        label: 'The Artmage story in card art',
        slides: [
            { card: 'Artmage Academic Arcane Arts Acropolis', title: 'The Acropolis', color: '#a78bfa', pan: [0.3, 0.66], on: ['Medius', 'Finmel', 'Graflare', 'Litera'] },
            { card: 'Medius the Pure', title: 'The student', color: '#f472b6', pan: [0.5, 0.22] },
            { card: 'Artmage Masterwork -Succession-', title: 'The succession', color: '#fcd34d', pan: [0.44, 0.3] },
            { card: 'Theorealize', title: 'The first vision', color: '#22d3ee', pan: [0.25, 0.6] },
            { card: 'Artmage Vandalism -Assault-', title: 'The raid', color: '#fb923c', pan: [0.22, 0.5], on: ['Drastea'] },
            { card: 'Artmage Pact -Awakening-', title: 'The pact', color: '#f43f5e', pan: [0.3, 0.78] },
            { card: 'Artmage Diactorus', title: 'The pseudo-successor', color: '#e879f9', pan: [0.55, 0.25] },
            '|',
            { card: 'Artmage Movement -Pedigree-', title: 'The brothers', color: '#4ade80', pan: [0.25, 0.6] },
            { card: 'Theorealize Overdrive', title: 'The second vision', color: '#22d3ee', pan: [0.62, 0.28] },
            { card: 'DoomZ Break - Diactorus', title: 'The second form', color: '#dc2626', pan: [0.55, 0.25] },
            { card: 'Theorealize Liberation', title: 'The forest', color: '#a3e635', pan: [0.3, 0.7] },
            { card: 'Artmage Non-Finito', title: 'Non-Finito', color: '#38bdf8', pan: [0.2, 0.55] },
            '|',
            { card: 'Vidolium the Unstable Power Patron of Unity', title: 'Vidolium', color: '#ef4444', pan: [0.2, 0.6] },
            { card: 'DoomZ XIII Over - Graflareio', title: 'The truce', color: '#34d399', pan: [0.6, 0.25] },
            { card: 'Theorealized Medius', title: 'Theorealized', color: '#93c5fd', pan: [0.3, 0.55] },
            { card: 'Mediclius the Extraordinary Power Patron', title: 'Ars Magna', color: '#fde68a', pan: [0.2, 0.55] }
        ],
        // Face positions from the earlier Lore Archive cast
        cast: [
            {
                name: 'Medius', color: '#facc15', names: ['Medius', 'Diactorus'], forms: [
                    { from: 0, card: 'Medius the Pure', face: [0.42, 0.18] },
                    { from: 6, card: 'Artmage Diactorus', as: 'Diactorus', face: [0.5, 0.17] },
                    { from: 9, card: 'DoomZ Break - Diactorus', as: 'DoomZ Break', face: [0.47, 0.18], zoom: 3.2 },
                    { from: 12, card: 'Vidolium the Unstable Power Patron of Unity', as: 'Vidolium', face: [0.5, 0.2], zoom: 2 },
                    { from: 14, card: 'Theorealized Medius', as: 'Theorealized', face: [0.55, 0.22] },
                    { from: 15, card: 'Mediclius the Extraordinary Power Patron', as: 'Mediclius', face: [0.42, 0.18] }
                ]
            },
            {
                name: 'Finmel', color: '#93c5fd', names: ['Finmel', 'Non-Finito', 'Purification Power Patron'], forms: [
                    { from: 0, card: 'Artmage Finmel', face: [0.52, 0.19] },
                    { from: 11, card: 'Artmage Non-Finito', as: 'Non-Finito', face: [0.47, 0.25] },
                    { from: 14, card: 'Purification Power Patron', as: 'Purification', face: [0.5, 0.22], zoom: 2 }
                ]
            },
            {
                name: 'Graflare', color: '#4ade80', names: ['Graflare', 'Graflareio'], forms: [
                    { from: 0, card: 'Artmage Graflare', face: [0.56, 0.24] },
                    { from: 13, card: 'DoomZ XIII Over - Graflareio', as: 'Graflareio', face: [0.52, 0.22] }
                ]
            },
            {
                name: 'Litera', color: '#f9a8d4', names: ['Litera', 'Elfnote Regina'], forms: [
                    { from: 0, card: 'Artmage Litera', face: [0.53, 0.2] },
                    { from: 13, card: 'Elfnote Regina', as: 'Regina', face: [0.42, 0.24] }
                ]
            },
            {
                // "the Power Patron" is Nerva's Patron speaking to Medius (chapter VI)
                name: 'Nerva', color: '#c084fc', names: ['Nerva', 'the Power Patron'], forms: [
                    { from: 0, card: 'Artmage Power Patron', face: [0.4, 0.19] }
                ]
            },
            {
                name: 'Drastea', color: '#f87171', names: ['Drastea', 'Drastrius'], forms: [
                    { from: 0, card: 'DoomZ XII Zero - Drastea', face: [0.47, 0.1] },
                    { from: 9, card: 'DoomZ XII End - Drastrius', as: 'Drastrius', face: [0.55, 0.33], zoom: 3.2 }
                ]
            }
        ]
    };

    window.LoreReelData['invoked'] = {
        label: 'The story of Aleister in card art',
        slides: [
            // OCG Stories: Crowley's youth
            { card: 'Crowley, the Gifted Magistus', title: 'The foundling', color: '#86efac', pan: [0.6, 0.25] },
            { card: 'Crowley, the Magistus of Grimoires', title: 'Invocation', color: '#a5b4fc', pan: [0.55, 0.22] },
            { card: 'Magistus Theurgy', title: 'The gate', color: '#fbbf24', pan: [0.3, 0.62] },
            { card: 'Aiwass, the Magistus Spell Spirit', title: 'The guardian', color: '#c4b5fd', pan: [0.2, 0.45] },
            { card: 'Invoked Magistus Omega', title: 'Omega', color: '#fb923c', pan: [0.6, 0.25] },
            '|',
            // Master Guide 6 and card trivia: the Invoker's fall
            { card: 'Aleister the Invoker', title: 'The Invoker', color: '#a855f7', pan: [0.6, 0.25] },
            { card: 'Aleister the Invoker of Madness', title: 'Madness', color: '#f43f5e', pan: [0.25, 0.6] },
            { card: 'Invoked Caliga', title: 'Caliga', color: '#dc2626', pan: [0.6, 0.3] },
            { card: 'Crowley, the First Propheseer', title: 'The sleeper', color: '#67e8f9', pan: [0.25, 0.72] },
            '|',
            // THE CHRONICLES: the Reminiscent
            { card: 'The Grand Spellbook Tower', title: 'Out of the tower', color: '#93c5fd', pan: [0.25, 0.7] },
            { card: 'Undaunted Bumpkin Beast', title: 'The impostor', color: '#facc15', pan: [0.35, 0.6] },
            { card: 'Invoked Cocytus', title: 'Cocytus', color: '#38bdf8', pan: [0.6, 0.3] },
            { card: 'Invoked Mechaba', title: 'The knight', color: '#fde68a', pan: [0.6, 0.25] },
            { card: 'Invoked De Anima', title: 'The black dragon', color: '#4ade80', pan: [0.6, 0.3] },
            { card: 'Aleister the Reminiscent', title: 'Farewell', color: '#e9d5ff', pan: [0.6, 0.22] }
        ],
        // Face positions from the earlier Lore Archive casts of this page and Magistus
        cast: [
            {
                name: 'Aleister', color: '#c084fc', names: ['Aleister', 'Crowley'], forms: [
                    { from: 0, card: 'Crowley, the Gifted Magistus', as: 'Crowley', face: [0.45, 0.2] },
                    { from: 1, card: 'Crowley, the Magistus of Grimoires', as: 'Crowley', face: [0.56, 0.24] },
                    { from: 4, card: 'Invoked Magistus Omega', as: 'Omega', face: [0.5, 0.18] },
                    { from: 5, card: 'Aleister the Invoker', face: [0.47, 0.12] },
                    { from: 6, card: 'Aleister the Invoker of Madness', as: 'Madness', face: [0.47, 0.25] },
                    { from: 7, card: 'Invoked Caliga', as: 'Caliga', face: [0.33, 0.3] },
                    { from: 8, card: 'Crowley, the First Propheseer', as: 'First Propheseer', face: [0.5, 0.63], zoom: 2.8 },
                    { from: 9, card: 'Aleister the Reminiscent', as: 'Reminiscent', face: [0.45, 0.2] }
                ]
            },
            {
                name: 'Aiwass', color: '#a5b4fc', forms: [
                    { from: 0, card: 'Aiwass, the Magistus Spell Spirit', face: [0.3, 0.45], zoom: 2 }
                ]
            },
            {
                name: 'Endymion', color: '#fcd34d', forms: [
                    { from: 0, card: 'Endymion, the Magistus of Mastery', face: [0.42, 0.15] }
                ]
            },
            {
                name: 'Rilliona', color: '#93c5fd', names: ['Rilliona', 'Verre'], forms: [
                    { from: 0, card: 'Rilliona, the Magistus of Verre', face: [0.42, 0.22] },
                    { from: 9, card: 'Witchcrafter Madame Verre', as: 'Verre', face: [0.45, 0.2] }
                ]
            },
            {
                name: 'Zoroa', color: '#f87171', forms: [
                    { from: 0, card: 'Zoroa, the Magistus of Flame', face: [0.5, 0.2] }
                ]
            }
        ]
    };

    window.LoreReelData['sky-striker'] = {
        label: 'The story of Raye and Roze in card art',
        slides: [
            // OCG Stories, chapters 1-3: Kama's last human
            { card: 'Sage of Wisdom - Himmel', title: 'The end of humanity', color: '#a5b4fc', pan: [0.55, 0.25] },
            { card: 'Sage of Benevolence - Ciela', title: 'The last human', color: '#93c5fd', pan: [0.42, 0.22] },
            { card: 'Sky Striker Mobilize - Engage!', title: 'Engage!', color: '#38bdf8', pan: [0.45, 0.22] },
            { card: 'Sage of Strength - Akash', title: 'The first battle', color: '#fca5a5', pan: [0.42, 0.22] },
            '|',
            // Chapters 4-10: two Sky Strikers
            { card: 'Sky Striker Mecha Modules - Multirole', title: 'Two years', color: '#fb923c', pan: [0.25, 0.6] },
            { card: 'Sky Striker Ace - Roze', title: 'Roze', color: '#f43f5e', pan: [0.42, 0.22] },
            { card: 'Sky Striker Maneuver - Afterburners!', title: 'Afterburners', color: '#facc15', pan: [0.3, 0.6] },
            { card: 'Pillar of the Future - Cyanos', title: 'A room of her own', color: '#67e8f9', pan: [0.6, 0.3] },
            { card: 'Sky Striker Ace - Camellia', title: 'The clones', color: '#f9a8d4', pan: [0.42, 0.22] },
            '|',
            // Chapters 11-19: the sisters' betrayal
            { card: 'Sky Striker Maneuver - Scissors Cross', title: 'The rematch', color: '#fbbf24', pan: [0.55, 0.3] },
            { card: 'Sky Striker Ace - Azalea', title: 'The betrayal', color: '#c084fc', pan: [0.45, 0.25] },
            { card: 'Sky Striker Ace - Azalea Temperance', title: 'Temperance', color: '#a855f7', pan: [0.6, 0.3] },
            { card: 'Surgical Striker - S.P.E.C.T.R.A.', title: 'S.P.E.C.T.R.A.', color: '#ef4444', pan: [0.3, 0.6] },
            { card: 'Combined Maneuver - Engage Zero!', title: 'Engage Zero', color: '#7dd3fc', pan: [0.2, 0.45] },
            { card: 'Sky Striker Mobilize - Linkage!', title: 'The wider world', color: '#fde68a', pan: [0.45, 0.28] }
        ],
        // Face positions from the earlier Lore Archive cast
        cast: [
            {
                name: 'Raye', color: '#38bdf8', forms: [
                    { from: 0, card: 'Sky Striker Ace - Raye', face: [0.6, 0.1] },
                    { from: 4, card: 'Sky Striker Ace - Kagari', as: 'Kagari', face: [0.42, 0.29] },
                    { from: 13, card: 'Combined Maneuver - Engage Zero!', as: 'Engage Zero', face: [0.24, 0.45], zoom: 3.4 },
                    { from: 14, card: 'Sky Striker Ace - Raye', face: [0.6, 0.1] }
                ]
            },
            {
                name: 'Roze', color: '#f43f5e', forms: [
                    { from: 0, card: 'Sky Striker Ace - Roze', face: [0.42, 0.08] },
                    { from: 13, card: 'Combined Maneuver - Engage Zero!', as: 'Engage Zero', face: [0.68, 0.44], zoom: 3.4 },
                    { from: 14, card: 'Sky Striker Ace - Roze', face: [0.42, 0.08] }
                ]
            },
            { name: 'Ciela', color: '#93c5fd', forms: [{ from: 0, card: 'Sage of Benevolence - Ciela', face: [0.6, 0.12] }] },
            { name: 'Himmel', color: '#a5b4fc', forms: [{ from: 0, card: 'Sage of Wisdom - Himmel', face: [0.52, 0.12] }] },
            { name: 'Akash', color: '#fca5a5', forms: [{ from: 0, card: 'Sage of Strength - Akash', face: [0.5, 0.1] }] },
            { name: 'Cyanos', color: '#67e8f9', forms: [{ from: 0, card: 'Pillar of the Future - Cyanos', face: [0.52, 0.12] }] },
            {
                name: 'Camellia', color: '#f9a8d4', forms: [
                    { from: 0, card: 'Sky Striker Ace - Camellia', face: [0.73, 0.13] },
                    { from: 12, card: 'Surgical Striker - S.P.E.C.T.R.A.', as: 'S.P.E.C.T.R.A.', face: [0.5, 0.4], zoom: 1.6 },
                    { from: 13, card: 'Sky Striker Ace - Camellia', face: [0.73, 0.13] }
                ]
            },
            {
                name: 'Azalea', color: '#c084fc', forms: [
                    { from: 0, card: 'Sky Striker Ace - Azalea', face: [0.53, 0.18] },
                    { from: 11, card: 'Sky Striker Ace - Azalea Temperance', as: 'Temperance', face: [0.33, 0.3] },
                    { from: 12, card: 'Surgical Striker - S.P.E.C.T.R.A.', as: 'S.P.E.C.T.R.A.', face: [0.5, 0.4], zoom: 1.6 },
                    { from: 13, card: 'Sky Striker Ace - Azalea', face: [0.53, 0.18] }
                ]
            }
        ]
    };

    window.LoreReelData['magistus'] = {
        label: 'The story of the Magistus in card art',
        slides: [
            // OCG Stories: the four Magistus
            { card: 'Spenta, the Magistus Sealer', title: 'Graybeard', color: '#a5b4fc', pan: [0.55, 0.25] },
            { card: 'Trismagistus', title: 'The three', color: '#cbd5e1', pan: [0.3, 0.6] },
            { card: 'Magistus Theurgy', title: 'Theurgy', color: '#fbbf24', pan: [0.25, 0.6] },
            { card: 'Zoroa, the Magistus Verethragna', title: 'Vahram', color: '#f97316', pan: [0.55, 0.25] },
            { card: 'Artemis, the Magistus Moon Maiden', title: 'The guardian gods', color: '#fde68a', pan: [0.45, 0.25] },
            { card: 'Alpha Summon', title: 'Omega', color: '#e879f9', pan: [0.3, 0.6] },
            { card: 'Vahram, the Magistus Divinity Dragon', title: 'The seal', color: '#ef4444', pan: [0.6, 0.3] },
            { card: 'Aleister the Invoker of Madness', title: 'Madness', color: '#f43f5e', pan: [0.25, 0.6] },
            '|',
            // THE CHRONICLES: the Three Sages, years later
            { card: 'Invocation', title: 'Out of the tower', color: '#38bdf8', pan: [0.3, 0.65] },
            { card: 'Endymion, the Master Magician', title: 'The Master Magician', color: '#a78bfa', pan: [0.6, 0.25] },
            { card: 'Magical Citadel of Endymion', title: 'The foolish king', color: '#86efac', pan: [0.25, 0.6] },
            { card: 'Witchcrafter Madame Verre', title: 'Madame Verre', color: '#93c5fd', pan: [0.45, 0.22] },
            { card: 'Zoroa, the Magistus Conflagrant Calamity', title: 'Vahram rises', color: '#dc2626', pan: [0.6, 0.25] },
            { card: 'Invoked De Anima', title: 'The black dragon', color: '#4ade80', pan: [0.6, 0.3] },
            { card: 'Zoroa, the Magistus of Flame', title: "Zoroa's request", color: '#fb923c', pan: [0.6, 0.25] },
            { card: 'Aleister the Reminiscent', title: 'Farewell', color: '#e9d5ff', pan: [0.6, 0.22], on: ['Aleister', 'Endymion', 'Rilliona'] }
        ],
        // Face positions from the earlier Lore Archive casts of this page and Invoked
        cast: [
            {
                name: 'Aleister', color: '#c084fc', names: ['Aleister', 'Crowley'], forms: [
                    { from: 0, card: 'Crowley, the Magistus of Grimoires', as: 'Crowley', face: [0.56, 0.24] },
                    { from: 5, card: 'Invoked Magistus Omega', as: 'Omega', face: [0.5, 0.18] },
                    { from: 6, card: 'Crowley, the Magistus of Grimoires', as: 'Crowley', face: [0.56, 0.24] },
                    { from: 7, card: 'Aleister the Invoker of Madness', as: 'Madness', face: [0.47, 0.25] },
                    { from: 8, card: 'Aleister the Reminiscent', as: 'Reminiscent', face: [0.45, 0.2] }
                ]
            },
            {
                name: 'Endymion', color: '#fcd34d', forms: [
                    { from: 0, card: 'Endymion, the Magistus of Mastery', face: [0.42, 0.15] },
                    { from: 9, card: 'Endymion, the Master Magician', as: 'Master Magician', face: [0.5, 0.24], zoom: 3 }
                ]
            },
            {
                name: 'Rilliona', color: '#93c5fd', names: ['Rilliona', 'Verre'], forms: [
                    { from: 0, card: 'Rilliona, the Magistus of Verre', face: [0.42, 0.22] },
                    { from: 11, card: 'Witchcrafter Madame Verre', as: 'Verre', face: [0.45, 0.2] }
                ]
            },
            {
                name: 'Zoroa', color: '#f87171', forms: [
                    { from: 0, card: 'Zoroa, the Magistus of Flame', face: [0.5, 0.2] },
                    { from: 3, card: 'Zoroa, the Magistus Verethragna', as: 'Verethragna', face: [0.45, 0.12] },
                    { from: 12, card: 'Zoroa, the Magistus Conflagrant Calamity', as: 'Conflagrant Calamity', face: [0.48, 0.14] },
                    { from: 14, card: 'Zoroa, the Magistus of Flame', face: [0.5, 0.2] }
                ]
            },
            { name: 'Spenta', color: '#a5b4fc', forms: [{ from: 0, card: 'Spenta, the Magistus Sealer', face: [0.64, 0.1] }] },
            { name: 'Artemis', color: '#fde68a', forms: [{ from: 0, card: 'Artemis, the Magistus Moon Maiden', face: [0.28, 0.27] }] },
            { name: 'Vahram', color: '#fb923c', forms: [{ from: 0, card: 'Vahram, the Magistus Divinity Dragon', face: [0.47, 0.13], zoom: 2 }] }
        ]
    };

    window.LoreReelData['elfnote'] = {
        label: 'The story of the Elfnotes in card art',
        slides: [
            // VBEX6 Story III: the plea
            { card: 'Elfnotes: Welcome Home', title: 'Oratorio Garden', color: '#86efac', pan: [0.25, 0.65] },
            { card: 'Power Patron DoomZ', title: 'The coma', color: '#f87171', pan: [0.6, 0.3] },
            { card: 'Elfnotes: A Plea for Help', title: 'A plea for help', color: '#d8b4fe', pan: [0.3, 0.5] },
            { card: 'Elfnotes: Aristeia of Trust', title: 'The Sacred Song Corps', color: '#fde68a', pan: [0.25, 0.5] },
            '|',
            // The ritual
            { card: 'Theorealize Liberation', title: 'The ritual', color: '#a3e635', pan: [0.3, 0.7], on: ['Lucina', 'Fortuna', 'Tinia', 'Power Patron'] },
            { card: 'Elfnotes: Rhapsodia of Madness', title: 'Strelitzia', color: '#ef4444', pan: [0.22, 0.42] },
            { card: 'Artmage Non-Finito', title: 'Non-Finito', color: '#38bdf8', pan: [0.6, 0.3] },
            { card: 'Elfnote Power Patron', title: 'The portals', color: '#a5b4fc', pan: [0.3, 0.55] },
            '|',
            // VBEX6 Story IV: the shades
            { card: 'Vidolium the Unstable Power Patron of Unity', title: 'Vidolium', color: '#dc2626', pan: [0.6, 0.3] },
            { card: 'Junoldo the Shadespirit Power Patron', title: 'Junoldo', color: '#818cf8', pan: [0.6, 0.35] },
            { card: 'Elfnote Regina', title: 'Regina', color: '#fde047', pan: [0.45, 0.22] },
            { card: 'Elfnotes: Quatrain of Succession', title: 'Save Medius', color: '#f9a8d4', pan: [0.25, 0.5] }
        ],
        // Face positions from the earlier Lore Archive casts of this page and Artmage
        cast: [
            {
                name: 'Litera', color: '#d8b4fe', names: ['Litera', 'Regina'], forms: [
                    { from: 0, card: 'Artmage Litera', face: [0.53, 0.2] },
                    { from: 10, card: 'Elfnote Regina', as: 'Regina', face: [0.42, 0.24] }
                ]
            },
            {
                name: 'Lucina', color: '#fca5a5', names: ['Lucina', 'Strelitzia'], forms: [
                    { from: 0, card: 'Elfnote Lucina', face: [0.43, 0.13] },
                    { from: 5, card: 'Elfnote Seraphim Strelitzia', as: 'Strelitzia', face: [0.45, 0.28] },
                    { from: 11, card: 'Elfnote Lucina', face: [0.43, 0.13] }
                ]
            },
            { name: 'Fortuna', color: '#fde047', forms: [{ from: 0, card: 'Elfnote Fortuna', face: [0.33, 0.12] }] },
            { name: 'Tinia', color: '#93c5fd', forms: [{ from: 0, card: 'Elfnote Tinia', face: [0.37, 0.2] }] },
            {
                name: 'Medius', color: '#facc15', names: ['Medius', 'Vidolium'], forms: [
                    { from: 0, card: 'Medius the Pure', face: [0.42, 0.18] },
                    { from: 8, card: 'Vidolium the Unstable Power Patron of Unity', as: 'Vidolium', face: [0.5, 0.2], zoom: 2 }
                ]
            },
            {
                name: 'Finmel', color: '#7dd3fc', names: ['Finmel', 'Non-Finito'], forms: [
                    { from: 0, card: 'Artmage Finmel', face: [0.52, 0.19] },
                    { from: 6, card: 'Artmage Non-Finito', as: 'Non-Finito', face: [0.47, 0.25] }
                ]
            },
            {
                name: 'Power Patron', color: '#a5b4fc', names: ['Elfnote Power Patron', 'Junoldo'], forms: [
                    { from: 0, card: 'Elfnote Power Patron', face: [0.5, 0.4], zoom: 2 },
                    { from: 9, card: 'Junoldo the Shadespirit Power Patron', as: 'Junoldo', face: [0.5, 0.3], zoom: 2 }
                ]
            }
        ]
    };

    window.LoreReelData['albaz'] = {
        label: 'The story of Albaz in card art',
        slides: [
            // VBEX2/VBEX3: Dogmatika and the Great Sand Sea
            { card: 'Dogmatika Punishment', title: 'The fall', color: '#fcd34d', pan: [0.3, 0.6], on: ['Albaz', 'Fleurdelis'] },
            { card: 'Dogmatika Encounter', title: 'The encounter', color: '#e5e7eb', pan: [0.3, 0.6] },
            { card: 'Tri-Brigade Mercourier', title: 'The escape', color: '#fbbf24', pan: [0.3, 0.5], on: ['Albaz', 'Ecclesia'] },
            { card: 'Dogmatikalamity', title: 'Gospel', color: '#c084fc', pan: [0.25, 0.6] },
            { card: 'Judgment of the Branded', title: 'Albion', color: '#ef4444', pan: [0.3, 0.6] },
            { card: 'Branded Bond', title: 'His name', color: '#fca5a5', pan: [0.3, 0.7] },
            '|',
            // The Sacred Summit
            { card: 'Icejade Cenote Enion Cradle', title: 'The summit', color: '#67e8f9', pan: [0.3, 0.65], on: ['Albaz', 'Ecclesia'] },
            { card: 'Swordsoul Strife', title: 'Betrayal', color: '#94a3b8', pan: [0.25, 0.55] },
            { card: 'Branded Lost', title: 'Aluber', color: '#f87171', pan: [0.3, 0.6] },
            { card: 'Branded Fusion', title: 'Mirrorjade', color: '#7dd3fc', pan: [0.3, 0.6] },
            { card: 'Branded in Central Dogmatika', title: 'Despair', color: '#a78bfa', pan: [0.25, 0.6] },
            '|',
            // The Golgonda War
            { card: 'The Bystial Lubellion', title: 'Dragon kings', color: '#dc2626', pan: [0.6, 0.3] },
            { card: 'Decisive Battle of Golgonda', title: 'Golgonda', color: '#fb923c', pan: [0.2, 0.65] },
            { card: 'Branded Befallen', title: 'Ecclesia!', color: '#38bdf8', pan: [0.3, 0.6] },
            { card: 'Brightest, Blazing, Branded King', title: 'Sanctifire', color: '#facc15', pan: [0.6, 0.4] },
            { card: 'Bystial Dis Pater', title: 'Dis Pater', color: '#e879f9', pan: [0.3, 0.55] },
            { card: 'Branded in White', title: 'A new journey', color: '#fde68a', pan: [0.35, 0.5] }
        ],
        // Face positions from the earlier Lore Archive casts of the Branded and Swordsoul pages
        cast: [
            {
                name: 'Albaz', color: '#fde68a', names: ['Albaz', 'Albion', 'Mirrorjade'], forms: [
                    { from: 0, card: 'Titaniklad the Ash Dragon', as: 'Titaniklad', face: [0.5, 0.35], zoom: 1.6 },
                    { from: 1, card: 'Fallen of Albaz', face: [0.42, 0.13] },
                    { from: 4, card: 'Albion the Branded Dragon', as: 'Albion', face: [0.45, 0.14], zoom: 2 },
                    { from: 5, card: 'Albion the Shrouded Dragon', as: 'Shrouded Dragon', face: [0.45, 0.22], zoom: 2 },
                    { from: 8, card: 'Fallen of Albaz', face: [0.42, 0.13] },
                    { from: 9, card: 'Mirrorjade the Iceblade Dragon', as: 'Mirrorjade', face: [0.55, 0.22], zoom: 2 },
                    { from: 11, card: 'Albaz the Ashen', as: 'Ashen', face: [0.55, 0.15] },
                    { from: 14, card: 'Albion the Sanctifire Dragon', as: 'Sanctifire', face: [0.5, 0.25], zoom: 2 },
                    { from: 16, card: 'Fallen of Albaz', face: [0.42, 0.13] }
                ]
            },
            {
                name: 'Ecclesia', color: '#bae6fd', names: ['Ecclesia', 'Cartesia'], forms: [
                    { from: 0, card: 'Dogmatika Ecclesia, the Virtuous', face: [0.6, 0.12] },
                    { from: 2, card: 'Incredible Ecclesia, the Virtuous', as: 'Incredible Ecclesia', face: [0.5, 0.2] },
                    { from: 10, card: 'Blazing Cartesia, the Virtuous', as: 'Cartesia', face: [0.4, 0.3], zoom: 2 },
                    { from: 14, card: 'Incredible Ecclesia, the Virtuous', as: 'Incredible Ecclesia', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Fleurdelis', color: '#fcd34d', forms: [
                    { from: 0, card: 'Dogmatika Fleurdelis, the Knighted', face: [0.53, 0.14] },
                    { from: 10, card: 'The Iris Swordsoul', as: 'Iris Swordsoul', face: [0.55, 0.15] }
                ]
            },
            {
                name: 'Maximus', color: '#d6d3d1', names: ['Maximus', 'Dramaturge', 'Dis Pater'], forms: [
                    { from: 0, card: 'Dogmatika Maximus', face: [0.45, 0.12] },
                    { from: 3, card: 'Dramaturge of Despia', as: 'Dramaturge', face: [0.5, 0.38] },
                    { from: 15, card: 'Bystial Dis Pater', as: 'Dis Pater', face: [0.5, 0.25], zoom: 2 }
                ]
            },
            {
                name: 'Aluber', color: '#f87171', names: ['Aluber', 'Lubellion'], forms: [
                    { from: 0, card: 'Aluber the Jester of Despia', face: [0.47, 0.32] },
                    { from: 9, card: 'Lubellion the Searing Dragon', as: 'Lubellion', face: [0.4, 0.2], zoom: 2 },
                    { from: 11, card: 'The Bystial Lubellion', as: 'Bystial Lubellion', face: [0.45, 0.13], zoom: 2 }
                ]
            },
            {
                name: 'Longyuan', color: '#94a3b8', forms: [
                    { from: 0, card: 'Swordsoul Strategist Longyuan', face: [0.52, 0.12] },
                    { from: 7, card: 'Swordsoul Sinister Sovereign - Qixing Longyuan', as: 'Qixing Longyuan', face: [0.5, 0.15] },
                    { from: 12, card: 'The Abyss Dragon Swordsoul', as: 'Abyss Dragon', face: [0.55, 0.3], zoom: 1.8 }
                ]
            }
        ]
    };

    window.LoreReelData['swordsoul'] = {
        label: 'The story of the Swordsoul in card art',
        slides: [
            // VBEX2: the Sacred Summit
            { card: 'Swordsoul Sacred Summit', title: 'The Sacred Summit', color: '#a5f3fc', pan: [0.3, 0.6], on: ['Chengying', 'Mo Ye', 'Longyuan'] },
            { card: 'Icejade Cenote Enion Cradle', title: 'The Enion Cradle', color: '#6ee7b7', pan: [0.3, 0.65] },
            { card: 'Swordsoul Supreme Sovereign - Chengying', title: 'Chengying', color: '#fcd34d', pan: [0.6, 0.3] },
            { card: 'Swordsoul Emergence', title: 'The knights', color: '#f9a8d4', pan: [0.25, 0.6] },
            { card: 'Icejade Erosion', title: 'The black sword', color: '#94a3b8', pan: [0.3, 0.55] },
            '|',
            // The betrayal
            { card: 'Swordsoul Strife', title: 'The betrayal', color: '#ef4444', pan: [0.25, 0.55] },
            { card: 'Icejade Curse', title: 'Ash', color: '#e5e7eb', pan: [0.35, 0.72] },
            { card: 'Branded Sword', title: 'Mirrorjade', color: '#7dd3fc', pan: [0.3, 0.6] },
            '|',
            // VBEX3: the wrath of ice
            { card: 'Icejade Gymir Aegirine', title: 'The Empress', color: '#67e8f9', pan: [0.6, 0.3] },
            { card: 'Icejade Creation Aegirocassis', title: 'Aegirocassis', color: '#93c5fd', pan: [0.3, 0.55] },
            { card: 'The Abyss Dragon Swordsoul', title: 'The Abyss Dragon', color: '#c084fc', pan: [0.6, 0.35], on: ['Longyuan'] },
            { card: 'Icejade Manifestation', title: 'Revenge', color: '#38bdf8', pan: [0.3, 0.6] },
            { card: 'The Iris Swordsoul', title: 'The Iris Swordsoul', color: '#fbcfe8', pan: [0.6, 0.25] },
            { card: 'Icejade Ran Aegirine', title: 'Shut in ice', color: '#bae6fd', pan: [0.3, 0.6], on: ['Aegirine', 'Longyuan'] }
        ],
        cast: [
            { name: 'Chengying', color: '#fcd34d', forms: [{ from: 0, card: 'Swordsoul Supreme Sovereign - Chengying', face: [0.52, 0.3], zoom: 2.2 }] },
            { name: 'Kosmochlor', color: '#6ee7b7', forms: [{ from: 0, card: 'Icejade Kosmochlor', face: [0.4, 0.25], zoom: 2 }] },
            {
                name: 'Mo Ye', color: '#93c5fd', names: ['Mo Ye', 'Aegirocassis'], forms: [
                    { from: 0, card: 'Swordsoul of Mo Ye', face: [0.41, 0.1] },
                    { from: 9, card: 'Icejade Creation Aegirocassis', as: 'Aegirocassis', face: [0.5, 0.2], zoom: 2 }
                ]
            },
            {
                name: 'Longyuan', color: '#94a3b8', forms: [
                    { from: 0, card: 'Swordsoul Strategist Longyuan', face: [0.52, 0.12] },
                    { from: 5, card: 'Swordsoul Sinister Sovereign - Qixing Longyuan', as: 'Qixing Longyuan', face: [0.5, 0.15] },
                    { from: 10, card: 'The Abyss Dragon Swordsoul', as: 'Abyss Dragon', face: [0.55, 0.3], zoom: 1.8 }
                ]
            },
            {
                name: 'Aegirine', color: '#67e8f9', names: ['Aegirine', 'Empress'], forms: [
                    { from: 0, card: 'Icejade Aegirine', face: [0.5, 0.45], zoom: 2.2 },
                    { from: 8, card: 'Icejade Gymir Aegirine', as: 'Empress', face: [0.5, 0.3] }
                ]
            },
            {
                name: 'Albaz', color: '#fde68a', names: ['Albaz', 'Mirrorjade'], forms: [
                    { from: 0, card: 'Fallen of Albaz', face: [0.42, 0.13] },
                    { from: 7, card: 'Mirrorjade the Iceblade Dragon', as: 'Mirrorjade', face: [0.55, 0.22], zoom: 2 }
                ]
            },
            {
                name: 'Fleurdelis', color: '#f9a8d4', forms: [
                    { from: 0, card: 'Dogmatika Fleurdelis, the Knighted', face: [0.53, 0.14] },
                    { from: 12, card: 'The Iris Swordsoul', as: 'Iris Swordsoul', face: [0.55, 0.15] }
                ]
            }
        ]
    };

    window.LoreReelData['world-legacy'] = {
        label: 'The World Legacy story in card art',
        slides: [
            // Part 1: the World Heroes
            { card: 'Crowned by the World Chalice', title: 'The forest', color: '#c4b5fd', pan: [0.42, 0.22] },
            { card: 'World Legacy Discovery', title: 'The World Chalice', color: '#a5f3fc', pan: [0.3, 0.6] },
            { card: 'World Legacy Trap Globe', title: 'Taken', color: '#fb7185', pan: [0.25, 0.6] },
            { card: 'Knightmare Corruptor Iblee', title: 'Iblee', color: '#a855f7', pan: [0.42, 0.2] },
            { card: 'Knightmare Mermaid', title: 'Knightmares', color: '#60a5fa', pan: [0.55, 0.3] },
            { card: "World Legacy's Sorrow", title: "Ib's choice", color: '#f9a8d4', pan: [0.25, 0.5] },
            '|',
            // The ancient civilization
            { card: "World Legacy's Memory", title: 'The Key', color: '#94a3b8', pan: [0.3, 0.6] },
            { card: 'Mekk-Knight of the Morning Star', title: 'The Morning Star', color: '#f97316', pan: [0.6, 0.25] },
            '|',
            // Part 2: the World War
            { card: "World Legacy's Mind Meld", title: 'Crusadia', color: '#fcd34d', pan: [0.3, 0.55] },
            { card: 'Orcustrated Babel', title: 'Babel', color: '#e5e7eb', pan: [0.25, 0.6] },
            { card: 'Longirsu, the Orcust Orchestrator', title: 'The World Wand', color: '#a78bfa', pan: [0.6, 0.3] },
            { card: 'Guardragon Andrake', title: 'Guardragons', color: '#4ade80', pan: [0.55, 0.3] },
            { card: 'Knightmare Incarnation Idlee', title: 'Idlee', color: '#ef4444', pan: [0.3, 0.55] },
            { card: 'Ib the World Chalice Justiciar', title: 'Justiciar', color: '#bae6fd', pan: [0.45, 0.22] },
            { card: 'Dingirsu, the Orcust of the Evening Star', title: 'Dingirsu', color: '#fde68a', pan: [0.6, 0.25] },
            '|',
            // The World Hero
            { card: 'Mekk-Knight Crusadia Avramax', title: 'Avramax', color: '#38bdf8', pan: [0.6, 0.25] },
            { card: 'Avida, Rebuilder of Worlds', title: 'Avida', color: '#fbbf24', pan: [0.6, 0.3] },
            { card: 'The World Legacy', title: 'Rebirth', color: '#c7d2fe', pan: [0.3, 0.75] }
        ],
        cast: [
            {
                name: 'Ib', color: '#c4b5fd', names: ['Ib', 'Iblee', 'Lib'], forms: [
                    { from: 0, card: 'Crowned by the World Chalice', face: [0.45, 0.2] },
                    { from: 1, card: 'Ib the World Chalice Priestess', as: 'Priestess', face: [0.42, 0.18] },
                    { from: 3, card: 'Knightmare Corruptor Iblee', as: 'Iblee', face: [0.45, 0.15] },
                    { from: 5, card: 'Ib the World Chalice Priestess', as: 'Priestess', face: [0.42, 0.18] },
                    { from: 13, card: 'Ib the World Chalice Justiciar', as: 'Justiciar', face: [0.5, 0.22] },
                    { from: 17, card: 'Lib the World Key Blademaster', as: 'Lib', face: [0.48, 0.18] }
                ]
            },
            {
                name: 'Lee', color: '#f0abfc', names: ['Lee', 'Iblee', 'Idlee'], forms: [
                    { from: 0, card: 'Lee the World Chalice Fairy', face: [0.45, 0.35], zoom: 3 },
                    { from: 3, card: 'Knightmare Corruptor Iblee', as: 'Iblee', face: [0.45, 0.15] },
                    { from: 6, card: 'Lee the World Chalice Fairy', face: [0.45, 0.35], zoom: 3 },
                    { from: 12, card: 'Knightmare Incarnation Idlee', as: 'Idlee', face: [0.38, 0.33] }
                ]
            },
            {
                name: 'Auram', color: '#7dd3fc', names: ['Auram', 'Avramax', 'Avida'], forms: [
                    { from: 0, card: 'Auram the World Chalice Blademaster', face: [0.45, 0.2] },
                    { from: 5, card: 'Mekk-Knight Avram', as: 'Avram', face: [0.45, 0.2] },
                    { from: 8, card: 'Crusadia Maximus', as: 'Maximus', face: [0.45, 0.2] },
                    { from: 15, card: 'Mekk-Knight Crusadia Avramax', as: 'Avramax', face: [0.45, 0.2] },
                    { from: 16, card: 'Avida, Rebuilder of Worlds', as: 'Avida', face: [0.5, 0.25], zoom: 2 }
                ]
            },
            {
                name: 'Ningirsu', color: '#fca5a5', forms: [
                    { from: 0, card: 'Beckoned by the World Chalice', face: [0.62, 0.12] },
                    { from: 1, card: 'Ningirsu the World Chalice Warrior', face: [0.4, 0.25] },
                    { from: 17, card: 'Girsu, the Orcust Mekk-Knight', as: 'Girsu', face: [0.5, 0.15] }
                ]
            },
            {
                name: 'Imduk', color: '#86efac', names: ['Imduk', 'Andrake', 'Mardark', 'Almarduke'], forms: [
                    { from: 0, card: 'Imduk the World Chalice Dragon', face: [0.35, 0.35], zoom: 2 },
                    { from: 11, card: 'Guardragon Andrake', as: 'Andrake', face: [0.35, 0.3], zoom: 2 },
                    { from: 12, card: 'World Legacy Guardragon Mardark', as: 'Mardark', face: [0.5, 0.25], zoom: 2 },
                    { from: 14, card: 'World Chalice Guardragon Almarduke', as: 'Almarduke', face: [0.4, 0.3], zoom: 2 },
                    { from: 17, card: 'Imduk the World Chalice Dragon', face: [0.35, 0.35], zoom: 2 }
                ]
            },
            { name: 'Galatea', color: '#e5e7eb', names: ['Galatea', 'mechanical body'], forms: [{ from: 0, card: 'Galatea, the Orcust Automaton', face: [0.4, 0.2] }] }
        ]
    };

    window.LoreReelData['sacred-tree'] = {
        label: 'The war of the Sacred Tree in card art',
        slides: [
            // The shadows
            { card: 'Naturia Sacred Tree', title: 'The Sacred Tree', color: '#86efac', pan: [0.3, 0.6], on: ['Tierra'] },
            { card: 'Constellar Sombre', title: 'The Yang Zing', color: '#fde68a', pan: [0.6, 0.25] },
            { card: 'Shaddoll Core', title: 'The Shaddolls', color: '#a78bfa', pan: [0.3, 0.6] },
            { card: 'Baxia, Brightness of the Yang Zing', title: 'Baxia', color: '#facc15', pan: [0.6, 0.3], on: ['Sombre'] },
            { card: 'Stellarknight Delteros', title: 'Tellarknights', color: '#fcd34d', pan: [0.6, 0.25] },
            { card: 'El Shaddoll Grysta', title: 'Grysta', color: '#f87171', pan: [0.6, 0.3] },
            '|',
            // The Sacred Tree
            { card: 'El Shaddoll Wendigo', title: 'Wendigo', color: '#c084fc', pan: [0.3, 0.6] },
            { card: 'El Shaddoll Winda', title: 'Winda', color: '#6ee7b7', pan: [0.55, 0.25] },
            { card: 'Apoqliphort Towers', title: 'Qliphorts', color: '#d1d5db', pan: [0.3, 0.6], on: ['Kerykeion'] },
            { card: 'Infernoid Onuncu', title: 'Infernoids', color: '#ef4444', pan: [0.3, 0.55] },
            '|',
            // Purgatory
            { card: 'Stellarknight Constellar Diamond', title: 'Constellar Diamond', color: '#e5e7eb', pan: [0.6, 0.3] },
            { card: 'Tellarknight Ptolemaeus', title: 'Ptolemaeus', color: '#fbbf24', pan: [0.6, 0.3] },
            { card: 'El Shaddoll Anoyatyllis', title: 'Anoyatyllis', color: '#f0abfc', pan: [0.6, 0.25], on: ['Kerykeion'] },
            { card: 'Dragunity Divine Lance', title: 'The lance', color: '#a3e635', pan: [0.3, 0.6] },
            { card: 'Zefra Divine Strike', title: 'The Zefra', color: '#5eead4', pan: [0.3, 0.6], on: ['Dance Princess', 'Sombre', 'Master Diamond'] },
            '|',
            // The god of destruction
            { card: 'Tierra, Source of Destruction', title: 'Tierra', color: '#dc2626', pan: [0.25, 0.55] },
            { card: 'Zefraath', title: 'Zefraath', color: '#99f6e4', pan: [0.55, 0.3] },
            { card: 'Gem-Knight Crystal', title: 'Returning lives', color: '#bfdbfe', pan: [0.6, 0.25] }
        ],
        cast: [
            {
                name: 'Master Diamond', color: '#e5e7eb', names: ['Master Diamond', 'Cairngorgon', 'Shaddoll Core', 'Grysta', 'Constellar Diamond', 'Ptolemaeus'], forms: [
                    { from: 0, card: 'Gem-Knight Master Diamond', face: [0.5, 0.1], zoom: 1.8 },
                    { from: 2, card: 'Shaddoll Core', as: 'Shaddoll Core', face: [0.5, 0.45], zoom: 1.6 },
                    { from: 5, card: 'El Shaddoll Grysta', as: 'Grysta', face: [0.5, 0.2] },
                    { from: 10, card: 'Stellarknight Constellar Diamond', as: 'Constellar Diamond', face: [0.45, 0.3] },
                    { from: 11, card: 'Tellarknight Ptolemaeus', as: 'Ptolemaeus', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Sombre', color: '#fde68a', names: ['Sombre', 'Ptolemaeus'], forms: [
                    { from: 0, card: 'Constellar Sombre', face: [0.5, 0.15] },
                    { from: 11, card: 'Tellarknight Ptolemaeus', as: 'Ptolemaeus', face: [0.5, 0.2] }
                ]
            },
            { name: 'Kerykeion', color: '#c084fc', forms: [{ from: 0, card: 'Evilswarm Kerykeion', face: [0.55, 0.25] }] },
            {
                name: 'Wen', color: '#86efac', names: ['Wen', 'Wendigo'], forms: [
                    { from: 0, card: 'Ritual Beast Tamer Wen', face: [0.4, 0.15] },
                    { from: 6, card: 'El Shaddoll Wendigo', as: 'Wendigo', face: [0.55, 0.45] }
                ]
            },
            { name: 'Winda', color: '#6ee7b7', forms: [{ from: 0, card: 'El Shaddoll Winda', face: [0.52, 0.15] }] },
            {
                name: 'Dance Princess', color: '#93c5fd', names: ['Dance Princess', 'Nekroz of Sophia'], forms: [
                    { from: 0, card: 'Dance Princess of the Nekroz', face: [0.5, 0.25] },
                    { from: 13, card: 'Nekroz of Sophia', as: 'Sophia', face: [0.45, 0.2] }
                ]
            },
            { name: 'Tierra', color: '#ef4444', forms: [{ from: 0, card: 'Tierra, Source of Destruction', face: [0.5, 0.35], zoom: 1.8 }] }
        ]
    };

    window.LoreReelData['dt-worm-war'] = {
        label: 'The Worm War of the Duel Terminal in card art',
        slides: [
            // The Worms
            { card: 'Worm Apocalypse', title: 'The Worms', color: '#a3e635', pan: [0.55, 0.3] },
            { card: 'Brionac, Dragon of the Ice Barrier', title: 'Brionac', color: '#67e8f9', pan: [0.55, 0.25] },
            { card: 'Ally of Justice Catastor', title: 'The Allies', color: '#7dd3fc', pan: [0.6, 0.3] },
            { card: 'Genex Controller', title: 'The Genex', color: '#6ee7b7', pan: [0.3, 0.55] },
            { card: 'XX-Saber Gottoms', title: 'XX-Sabers', color: '#fdba74', pan: [0.5, 0.22] },
            { card: 'Naturia Beast', title: 'Naturia', color: '#86efac', pan: [0.55, 0.25] },
            { card: 'Mist Valley Thunder Lord', title: 'Mist Valley', color: '#5eead4', pan: [0.5, 0.2] },
            '|',
            // The Fabled
            { card: 'Fabled Valkyrus', title: 'The Fabled', color: '#c084fc', pan: [0.55, 0.2] },
            { card: 'Jurrac Giganoto', title: 'Jurrac', color: '#f87171', pan: [0.6, 0.3] },
            { card: 'Gungnir, Dragon of the Ice Barrier', title: 'Gungnir', color: '#a5f3fc', pan: [0.5, 0.2] },
            { card: 'Dragunity Knight - Trident', title: 'Dragunity', color: '#bef264', pan: [0.55, 0.25] },
            { card: 'Worm Zero', title: 'Worm Zero', color: '#84cc16', pan: [0.25, 0.65] },
            '|',
            // The Ice Dragons
            { card: 'Genex Ally Triforce', title: 'Genex Allies', color: '#34d399', pan: [0.2, 0.45] },
            { card: 'Jurrac Meteor', title: 'Jurrac Impact', color: '#fb923c', pan: [0.3, 0.7] },
            { card: 'Trishula, Dragon of the Ice Barrier', title: 'Trishula', color: '#cffafe', pan: [0.55, 0.22] },
            { card: 'Sacred Spirit of the Ice Barrier', title: 'The Sacred Spirit', color: '#bae6fd', pan: [0.55, 0.25] }
        ]
    };

    window.LoreReelData['dt-great-war'] = {
        label: 'The Great War of the Duel Terminal in card art',
        slides: [
            // Noellia
            { card: 'Trial and Tribulation', title: 'Noellia', color: '#67e8f9', pan: [0.3, 0.55] },
            { card: 'Gishki Aquamirror', title: 'The Gishki', color: '#93c5fd', pan: [0.3, 0.6] },
            '|',
            // The Steelswarm and the Vylon
            { card: 'Laval Judgment Lord', title: 'The Laval', color: '#fb923c', pan: [0.55, 0.22] },
            { card: 'Vylon Sigma', title: 'The Vylon', color: '#fde68a', pan: [0.55, 0.3] },
            { card: 'Daigusto Eguls', title: 'The Gusto', color: '#6ee7b7', pan: [0.5, 0.22] },
            { card: 'Steelswarm Caucastag', title: 'The Steelswarm', color: '#a78bfa', pan: [0.55, 0.22] },
            { card: 'Vylon Omega', title: 'Vylon Omega', color: '#fef08a', pan: [0.3, 0.55] },
            { card: 'Vylon Disigma', title: 'Disigma', color: '#fbbf24', pan: [0.3, 0.6] },
            { card: 'Oni-Gami Combo', title: 'Pearl', color: '#f3f4f6', pan: [0.3, 0.55] },
            '|',
            // The Evilswarm
            { card: 'Poisonous Winds', title: 'Poisoned wind', color: '#86efac', pan: [0.25, 0.45] },
            { card: 'Gem-Knight Zirconia', title: 'Zirconia', color: '#e5e7eb', pan: [0.55, 0.25] },
            { card: 'Infestation Pandemic', title: 'The Evilswarm', color: '#c084fc', pan: [0.3, 0.6] },
            { card: 'Constellar Pleiades', title: 'The Constellar', color: '#fcd34d', pan: [0.5, 0.25] },
            { card: 'Aquamirror Cycle', title: "Noellia's end", color: '#67e8f9', pan: [0.25, 0.7] },
            { card: 'Gem-Knight Seraphinite', title: 'Seraphinite', color: '#a7f3d0', pan: [0.45, 0.22] },
            { card: 'Constellar Ptolemy M7', title: 'Ptolemy M7', color: '#fde047', pan: [0.3, 0.6] },
            '|',
            // The goddess
            { card: 'Sophia, Goddess of Rebirth', title: 'Sophia', color: '#fcd34d', pan: [0.3, 0.55] },
            { card: 'Constellar Sombre', title: 'Sombre', color: '#fef3c7', pan: [0.5, 0.2] },
            { card: 'Evilswarm Kerykeion', title: 'Kerykeion', color: '#d8b4fe', pan: [0.45, 0.22] },
            { card: 'Jewels of the Valiant', title: 'The last battle', color: '#fde68a', pan: [0.7, 0.3], on: ['Lazuli', 'Rasalhague', 'Sophia', 'Avance', 'Emilia'] }
        ],
        cast: [
            {
                name: 'Noellia', color: '#67e8f9', names: ['Noellia', 'Tetrogre', 'Psychelone'], forms: [
                    { from: 0, card: 'Revealer of the Ice Barrier', as: 'Revealer', face: [0.45, 0.15] },
                    { from: 1, card: 'Gishki Noellia', face: [0.42, 0.12] },
                    { from: 6, card: 'Evigishki Tetrogre', as: 'Tetrogre', face: [0.55, 0.2] },
                    { from: 8, card: 'Gishki Noellia', face: [0.42, 0.12] },
                    { from: 12, card: 'Gishki Psychelone', as: 'Psychelone', face: [0.6, 0.3] },
                    { from: 13, card: 'Gishki Noellia', face: [0.42, 0.12] }
                ]
            },
            {
                name: 'Avance', color: '#e5e7eb', names: ['Avance', 'Levianima'], forms: [
                    { from: 0, card: 'Gishki Avance', face: [0.5, 0.22] },
                    { from: 13, card: 'Evigishki Levianima', as: 'Levianima', face: [0.78, 0.35] },
                    { from: 14, card: 'Gishki Avance', face: [0.5, 0.22] }
                ]
            },
            { name: 'Emilia', color: '#fca5a5', forms: [{ from: 0, card: 'Gishki Emilia', face: [0.45, 0.25] }] },
            {
                name: 'Crystal', color: '#e5e7eb', names: ['Crystal', 'Prismaura', 'Zirconia', 'Master Diamond'], forms: [
                    { from: 0, card: 'Gem-Knight Crystal', face: [0.5, 0.15] },
                    { from: 6, card: 'Gem-Knight Prismaura', as: 'Prismaura', face: [0.4, 0.15] },
                    { from: 7, card: 'Gem-Knight Crystal', face: [0.5, 0.15] },
                    { from: 10, card: 'Gem-Knight Zirconia', as: 'Zirconia', face: [0.45, 0.2] },
                    { from: 15, card: 'Gem-Knight Master Diamond', as: 'Master Diamond', face: [0.55, 0.12] }
                ]
            },
            {
                name: 'Lazuli', color: '#fde68a', names: ['Lazuli', 'Seraphinite', 'Sombre'], forms: [
                    { from: 0, card: 'Gem-Knight Lazuli', face: [0.55, 0.15] },
                    { from: 14, card: 'Gem-Knight Seraphinite', as: 'Seraphinite', face: [0.35, 0.15] },
                    { from: 17, card: 'Constellar Sombre', as: 'Sombre', face: [0.5, 0.15] }
                ]
            },
            {
                name: 'Rasalhague', color: '#d8b4fe', names: ['Rasalhague', 'Kerykeion'], forms: [
                    { from: 0, card: 'Constellar Rasalhague', face: [0.55, 0.2] },
                    { from: 18, card: 'Evilswarm Kerykeion', as: 'Kerykeion', face: [0.55, 0.25] }
                ]
            },
            { name: 'Sophia', color: '#fcd34d', forms: [{ from: 0, card: 'Sophia, Goddess of Rebirth', face: [0.5, 0.35], zoom: 2 }] }
        ]
    };

    window.LoreReelData['visas'] = {
        label: 'The Visas story in card art',
        slides: [
            // Fear and sorrow
            { card: 'Primitive Planet Reichphobia', title: 'Reichphobia', color: '#86efac', pan: [0.3, 0.6], on: ['Visas', 'Reichheart'] },
            { card: 'Scareclaw Sclash', title: 'Fear', color: '#a78bfa', pan: [0.55, 0.3] },
            { card: 'Primeval Planet Perlereino', title: 'Perlereino', color: '#7dd3fc', pan: [0.3, 0.6] },
            { card: 'Tearlaments Kitkallos', title: 'Sorrow', color: '#93c5fd', pan: [0.45, 0.2] },
            '|',
            // Anger and joy
            { card: 'Kashtira Shangri-Ira', title: 'Shangri-Ira', color: '#f87171', pan: [0.3, 0.65] },
            { card: 'Kashtira Riseheart', title: 'Anger', color: '#ef4444', pan: [0.5, 0.2] },
            { card: 'Kashtira Arise-Heart', title: 'Wraitsoth', color: '#fb7185', pan: [0.5, 0.22] },
            { card: 'Vicious Astraloud', title: 'Vicious', color: '#a3e635', pan: [0.3, 0.6] },
            { card: 'Peaceful Planet Calarium', title: 'Calarium', color: '#fde68a', pan: [0.3, 0.6] },
            { card: 'Mannadium Prime-Heart', title: 'Joy', color: '#fef3c7', pan: [0.55, 0.3] },
            '|',
            // Amritara
            { card: 'Realm Resonance', title: 'Resolve', color: '#fcd34d', pan: [0.3, 0.7], on: ['Visas', 'Reichheart', 'Reinoheart', 'Riseheart', 'Riumheart'] },
            { card: 'New World Formation', title: 'Amritara', color: '#67e8f9', pan: [0.3, 0.6] },
            '|',
            // Veda
            { card: 'Veda Kalanta', title: 'Veda', color: '#c4b5fd', pan: [0.45, 0.2] },
            { card: 'Mannadium Trisukta', title: 'Sharv Sarga', color: '#fde68a', pan: [0.45, 0.2] },
            { card: 'Ages of Stars and Frost', title: 'Again', color: '#bae6fd', pan: [0.55, 0.3] }
        ],
        cast: [
            {
                name: 'Visas', color: '#bae6fd', names: ['Visas', 'Vicious'], forms: [
                    { from: 0, card: 'Visas Starfrost', face: [0.6, 0.15] },
                    { from: 7, card: 'Vicious Astraloud', as: 'Vicious', face: [0.5, 0.3] },
                    { from: 10, card: 'Visas Starfrost', face: [0.6, 0.15] },
                    { from: 11, card: 'Visas Amritara', as: 'Amritara', face: [0.45, 0.2] },
                    { from: 14, card: 'Visas Samsara', as: 'Samsara', face: [0.45, 0.22], zoom: 3 }
                ]
            },
            {
                name: 'Reichheart', color: '#a78bfa', names: ['Reichheart', 'Light-Heart'], forms: [
                    { from: 0, card: 'Scareclaw Reichheart', face: [0.5, 0.15] },
                    { from: 2, card: 'Scareclaw Light-Heart', as: 'Light-Heart', face: [0.55, 0.25] },
                    { from: 14, card: 'Scareclaw Reichheart', face: [0.5, 0.15] }
                ]
            },
            { name: 'Reinoheart', color: '#7dd3fc', forms: [{ from: 0, card: 'Tearlaments Reinoheart', face: [0.55, 0.2] }] },
            {
                name: 'Kitkallos', color: '#93c5fd', names: ['Kitkallos', 'Trisukta'], forms: [
                    { from: 0, card: 'Tearlaments Kitkallos', face: [0.6, 0.2] },
                    { from: 13, card: 'Mannadium Trisukta', as: 'Trisukta', face: [0.5, 0.15] }
                ]
            },
            {
                name: 'Riseheart', color: '#f87171', names: ['Riseheart', 'Arise-Heart'], forms: [
                    { from: 0, card: 'Kashtira Riseheart', face: [0.3, 0.12] },
                    { from: 6, card: 'Kashtira Arise-Heart', as: 'Arise-Heart', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Riumheart', color: '#fde68a', names: ['Riumheart', 'Prime-Heart'], forms: [
                    { from: 0, card: 'Mannadium Riumheart', face: [0.65, 0.22] },
                    { from: 9, card: 'Mannadium Prime-Heart', as: 'Prime-Heart', face: [0.55, 0.15] }
                ]
            },
            { name: 'Veda', color: '#c4b5fd', forms: [{ from: 0, card: 'Veda Kalanta', face: [0.5, 0.2] }] }
        ]
    };

    window.LoreReelData['sinful-spoils'] = {
        label: 'The Sinful Spoils story in card art',
        slides: [
            // The White Forest
            { card: 'Tales of the White Forest', title: 'The White Forest', color: '#e5e7eb', pan: [0.35, 0.6] },
            { card: 'Susurrus of the Sinful Spoils', title: 'The Sinful Fruit', color: '#f87171', pan: [0.45, 0.25] },
            { card: 'Scourge of the White Forest', title: 'The curse', color: '#fb7185', pan: [0.3, 0.6] },
            '|',
            // The Seeker
            { card: 'Diabellstar the Black Witch', title: 'The Seeker', color: '#f472b6', pan: [0.42, 0.18] },
            { card: 'Snake-Eyes Flamberge Dragon', title: 'Snake-Eye', color: '#60a5fa', pan: [0.55, 0.25] },
            { card: 'Snake-Eyes Diabellstar', title: 'Goblin Bikers', color: '#fb923c', pan: [0.3, 0.6] },
            { card: 'Diabellze the Original Sinkeeper', title: 'Diabellze', color: '#e0e7ff', pan: [0.35, 0.2] },
            { card: 'Sinful Spoils Awakening', title: "Elzette's past", color: '#f9a8d4', pan: [0.3, 0.5] },
            '|',
            // The Azamina saints
            { card: 'Azamina Debtors', title: 'The saints', color: '#a3e635', pan: [0.3, 0.55] },
            { card: 'Guilt of the Sinful Spoils', title: 'Silvy and Rucia', color: '#86efac', pan: [0.3, 0.55] },
            { card: 'Queen Azamina', title: 'Queen Azamina', color: '#dc2626', pan: [0.5, 0.25] },
            { card: 'Snake-Eyes Doomed Dragon', title: 'Doomed Dragon', color: '#93c5fd', pan: [0.3, 0.6] },
            { card: 'Saint Azamina', title: 'Saint Azamina', color: '#ef4444', pan: [0.35, 0.6] },
            '|',
            // The witches
            { card: 'Diabellze the White Witch', title: 'The White Witch', color: '#e0e7ff', pan: [0.3, 0.5] },
            { card: 'Diabellstar Vengeance', title: 'Vengeance', color: '#bef264', pan: [0.3, 0.55] },
            { card: 'Azamina', title: 'Azamina', color: '#fde68a', pan: [0.55, 0.25] },
            { card: 'Snake-Eyes Vengeance Dragon', title: 'Vengeance Dragon', color: '#f87171', pan: [0.3, 0.6] },
            { card: 'Sinful Spoils Sanctification', title: 'Sanctification', color: '#fef9c3', pan: [0.3, 0.6] },
            { card: 'Witch of the White Forest', title: 'The small witch', color: '#e5e7eb', pan: [0.3, 0.7] }
        ],
        cast: [
            {
                name: 'Astellar', color: '#f472b6', names: ['Astellar', 'Diabellstar'], forms: [
                    { from: 0, card: 'Astellar of the White Forest', face: [0.45, 0.2] },
                    { from: 3, card: 'Diabellstar the Black Witch', as: 'Diabellstar', face: [0.42, 0.12] },
                    { from: 14, card: 'Diabellstar Vengeance', as: 'Vengeance', face: [0.45, 0.3] },
                    { from: 16, card: 'Snake-Eyes Vengeance Dragon', as: 'Vengeance Dragon', face: [0.4, 0.3] },
                    { from: 17, card: 'Diabellstar the Black Witch', as: 'Diabellstar', face: [0.42, 0.12] }
                ]
            },
            {
                name: 'Elzette', color: '#e0e7ff', names: ['Elzette', 'Diabellze'], forms: [
                    { from: 0, card: 'Elzette of the White Forest', face: [0.45, 0.2] },
                    { from: 6, card: 'Diabellze the Original Sinkeeper', as: 'Diabellze', face: [0.35, 0.18] },
                    { from: 7, card: 'Elzette, Azamina of the White Forest', as: 'Azamina saint', face: [0.55, 0.2] },
                    { from: 8, card: 'Diabellze the Original Sinkeeper', as: 'Diabellze', face: [0.35, 0.18] },
                    { from: 11, card: 'Snake-Eyes Doomed Dragon', as: 'Doomed Dragon', face: [0.6, 0.35] },
                    { from: 12, card: 'Diabellze the Original Sinkeeper', as: 'Diabellze', face: [0.35, 0.18] },
                    { from: 13, card: 'Diabellze the White Witch', as: 'White Witch', face: [0.6, 0.3] }
                ]
            },
            {
                name: 'Diabell', color: '#c4b5fd', names: ['Diabell', 'Queen Azamina'], forms: [
                    { from: 0, card: 'Diabell, Queen of the White Forest', face: [0.45, 0.2] },
                    { from: 10, card: 'Queen Azamina', as: 'Queen Azamina', face: [0.55, 0.2] },
                    { from: 17, card: 'Diabell, Queen of the White Forest', face: [0.45, 0.2] }
                ]
            },
            {
                name: 'Silvy', color: '#86efac', names: ['Silvy', 'Silvera'], forms: [
                    { from: 0, card: 'Silvy of the White Forest', face: [0.55, 0.25] },
                    { from: 2, card: 'Sinful Spoils of Betrayal - Silvera', as: 'Silvera', face: [0.15, 0.3] },
                    { from: 17, card: 'Silvy of the White Forest', face: [0.55, 0.25] }
                ]
            },
            {
                name: 'Rucia', color: '#bef264', names: ['Rucia', 'Rciela'], forms: [
                    { from: 0, card: 'Rucia of the White Forest', face: [0.6, 0.2] },
                    { from: 2, card: 'Sinful Spoils of Doom - Rciela', as: 'Rciela', face: [0.55, 0.45] },
                    { from: 17, card: 'Rucia of the White Forest', face: [0.6, 0.2] }
                ]
            },
            {
                name: 'Poplar', color: '#fda4af', forms: [
                    { from: 0, card: 'Snake-Eyes Poplar', face: [0.45, 0.3] },
                    { from: 15, card: 'Poplar of the White Forest', as: 'of the White Forest', face: [0.5, 0.3] }
                ]
            },
            {
                name: 'Azamina', color: '#fde68a', forms: [
                    { from: 0, card: 'Saint Azamina', face: [0.5, 0.35] },
                    { from: 15, card: 'Azamina', as: 'true form', face: [0.5, 0.22] }
                ]
            }
        ]
    };

    window.LoreReelData['fire-island'] = {
        label: 'The Fire Island war in card art',
        slides: [
            // The first war
            { card: 'Call of the Atlanteans', title: 'The Atlanteans', color: '#7dd3fc', pan: [0.3, 0.6] },
            { card: 'Fire King High Avatar Garunix', title: 'The Fire Kings', color: '#fb923c', pan: [0.45, 0.2] },
            { card: 'High Tide on Fire Island', title: 'High tide', color: '#f97316', pan: [0.3, 0.55] },
            { card: 'Lemuria, the Forgotten City', title: 'Lemuria', color: '#bae6fd', pan: [0.3, 0.6] },
            { card: 'Mermail Abysstrite', title: 'The Mermail', color: '#67e8f9', pan: [0.35, 0.18] },
            { card: 'Abyss-squall', title: 'The bracelet', color: '#fde68a', pan: [0.3, 0.55] },
            { card: 'Mermail Abyssgaios', title: 'Abyssgaios', color: '#38bdf8', pan: [0.45, 0.2] },
            '|',
            // The Fire King Gods
            { card: 'Fire King Courtier Ulcanix', title: 'Ulcanix', color: '#fca5a5', pan: [0.35, 0.2] },
            { card: 'Sacred Fire King Garunix', title: 'Sacred Fire King', color: '#fbbf24', pan: [0.45, 0.2] },
            { card: 'Garunix Eternity, Hyang of the Fire Kings', title: 'Garunix Eternity', color: '#fde047', pan: [0.3, 0.55] },
            '|',
            // The divided seas
            { card: 'Poseidra, the Atlantean Dragon', title: 'Poseidra returns', color: '#60a5fa', pan: [0.45, 0.2] },
            { card: 'Neptabyss, the Atlantean Prince', title: 'Neptabyss', color: '#5eead4', pan: [0.42, 0.2] },
            { card: 'Abysstrite, the Atlantean Spirit', title: 'The covenant', color: '#fde68a', pan: [0.35, 0.2] },
            { card: 'Mermail King - Neptabyss', title: 'Mermail King', color: '#22d3ee', pan: [0.45, 0.2] },
            { card: 'Poseidra Abyss, the Atlantean Dragon Lord', title: 'Poseidra Abyss', color: '#3b82f6', pan: [0.45, 0.2] }
        ],
        cast: [
            {
                name: 'Poseidra', color: '#60a5fa', forms: [
                    { from: 0, card: 'Poseidra, the Atlantean Dragon', face: [0.4, 0.2] },
                    { from: 14, card: 'Poseidra Abyss, the Atlantean Dragon Lord', as: 'Poseidra Abyss', face: [0.45, 0.15] }
                ]
            },
            {
                name: 'Abyssgaios', color: '#38bdf8', names: ['Abyssgaios', 'Neptabyss', 'Mermail King'], forms: [
                    { from: 0, card: 'Mermail Abyssgaios', face: [0.5, 0.12] },
                    { from: 11, card: 'Neptabyss, the Atlantean Prince', as: 'Neptabyss', face: [0.55, 0.15] },
                    { from: 13, card: 'Mermail King - Neptabyss', as: 'Mermail King', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Garunix', color: '#fb923c', names: ['Garunix', 'Ponix', 'Sacred Fire King'], forms: [
                    { from: 0, card: 'Fire King High Avatar Garunix', face: [0.6, 0.12] },
                    { from: 8, card: 'Sacred Fire King Garunix', as: 'Sacred Fire King', face: [0.5, 0.2] },
                    { from: 9, card: 'Garunix Eternity, Hyang of the Fire Kings', as: 'Garunix Eternity', face: [0.5, 0.3] }
                ]
            },
            { name: 'Ulcanix', color: '#fca5a5', forms: [{ from: 0, card: 'Fire King Courtier Ulcanix', face: [0.45, 0.15] }] },
            {
                name: 'Abysstrite', color: '#67e8f9', forms: [
                    { from: 0, card: 'Mermail Abysstrite', face: [0.5, 0.12] },
                    { from: 12, card: 'Abysstrite, the Atlantean Spirit', as: 'Atlantean Spirit', face: [0.45, 0.12] }
                ]
            }
        ]
    };

    window.LoreReelData['ghost-meets-girl'] = {
        label: 'Ghost Meets Girl: the Shiranui and the Mayakashi in card art',
        slides: [
            // The feud
            { card: 'Shiranui Spectralsword', title: 'The Spectralsword', color: '#c4b5fd', pan: [0.45, 0.25] },
            { card: 'Shiranui Samuraisaga', title: 'Samuraisaga', color: '#a5f3fc', pan: [0.45, 0.2] },
            { card: 'Shiranui Smith', title: 'The swordsmiths', color: '#fdba74', pan: [0.45, 0.2] },
            { card: 'Yuki-Onna, the Ice Mayakashi', title: 'The Mayakashi', color: '#e0f2fe', pan: [0.35, 0.18] },
            { card: 'Yoko, the Graceful Mayakashi', title: 'Yoko', color: '#a78bfa', pan: [0.45, 0.2] },
            '|',
            // The first heir
            { card: 'Shiranui Shogunsaga', title: 'Shogunsaga', color: '#f87171', pan: [0.45, 0.2] },
            { card: 'Shiranui Sunsaga', title: 'Sunsaga', color: '#fca5a5', pan: [0.45, 0.2] },
            '|',
            // Ghost Meets Girl
            { card: 'Shiranui Style Solemnity', title: 'Squire', color: '#fb923c', pan: [0.3, 0.55] },
            { card: "Ghost Meets Girl - A Shiranui's Story", title: 'Ghost meets girl', color: '#f9a8d4', pan: [0.55, 0.3] },
            { card: 'Shiranui Skillsaga Supremacy', title: 'Skillsaga Supremacy', color: '#f472b6', pan: [0.42, 0.2] },
            { card: 'Yuki-Onna, the Absolute Zero Mayakashi', title: 'Absolute Zero', color: '#bae6fd', pan: [0.35, 0.2] }
        ],
        cast: [
            {
                name: 'Samuraisaga', color: '#c4b5fd', names: ['Samuraisaga', 'Sunsaga', 'Spectralsword', 'founder'], forms: [
                    { from: 0, card: 'Shiranui Spectralsword', face: [0.45, 0.15] },
                    { from: 6, card: 'Shiranui Sunsaga', as: 'Sunsaga', face: [0.3, 0.12] },
                    { from: 7, card: 'Shiranui Spectralsword Shade', as: 'Shade', face: [0.55, 0.2] }
                ]
            },
            {
                name: 'Samurai', color: '#f87171', names: ['Samurai', 'Shogunsaga'], forms: [
                    { from: 0, card: 'Shiranui Samurai', face: [0.45, 0.2] },
                    { from: 5, card: 'Shiranui Shogunsaga', as: 'Shogunsaga', face: [0.45, 0.15] }
                ]
            },
            {
                name: 'Squire', color: '#fb923c', names: ['Squire', 'Skillsaga Supremacy'], forms: [
                    { from: 0, card: 'Shiranui Squire', face: [0.5, 0.12] },
                    { from: 9, card: 'Shiranui Skillsaga Supremacy', as: 'Skillsaga', face: [0.5, 0.15] }
                ]
            },
            {
                name: 'Yoko', color: '#a78bfa', names: ['Yoko', 'Dakki'], forms: [
                    { from: 0, card: 'Yoko, the Graceful Mayakashi', face: [0.4, 0.12] },
                    { from: 8, card: 'Dakki, the Graceful Mayakashi', as: 'Dakki', face: [0.5, 0.15] },
                    { from: 9, card: 'Yoko, the Graceful Mayakashi', face: [0.4, 0.12] }
                ]
            },
            {
                name: 'Yuki-Onna', color: '#bae6fd', names: ['Yuki-Onna', 'Yuki-Musume'], forms: [
                    { from: 0, card: 'Yuki-Onna, the Ice Mayakashi', face: [0.5, 0.12] },
                    { from: 10, card: 'Yuki-Onna, the Absolute Zero Mayakashi', as: 'Absolute Zero', face: [0.5, 0.15] }
                ]
            }
        ]
    };

    window.LoreReelData['prophecy'] = {
        label: 'The Prophecy story in card art',
        slides: [
            // La Maison
            { card: 'The Grand Spellbook Tower', title: 'La Maison', color: '#7dd3fc', pan: [0.3, 0.6], on: ['Trice', 'Hieron'] },
            { card: 'Spellbook Star Hall', title: 'Etoile', color: '#a5f3fc', pan: [0.3, 0.6] },
            { card: 'Spellbook Magician of Prophecy', title: 'Batel', color: '#93c5fd', pan: [0.45, 0.2] },
            '|',
            // The invasion
            { card: 'Magical Citadel of Endymion', title: 'Endymion', color: '#c4b5fd', pan: [0.3, 0.6] },
            { card: 'Fool of Prophecy', title: 'Mat', color: '#fde68a', pan: [0.45, 0.2] },
            { card: 'Spellbook of Fate', title: 'The invasion', color: '#a78bfa', pan: [0.3, 0.6] },
            { card: 'Spellbook of the Master', title: 'The forbidden book', color: '#818cf8', pan: [0.3, 0.6] },
            '|',
            // The boy
            { card: 'Reaper of Prophecy', title: 'La Mort', color: '#9ca3af', pan: [0.45, 0.25] },
            { card: 'Spellbook of Judgment', title: 'Judgment', color: '#fef3c7', pan: [0.3, 0.6] },
            { card: 'World of Prophecy', title: 'The World', color: '#bbf7d0', pan: [0.5, 0.3] }
        ],
        cast: [
            {
                name: 'Mat', color: '#fde68a', names: ['Mat', 'La Mort'], forms: [
                    { from: 0, card: 'Fool of Prophecy', face: [0.45, 0.15] },
                    { from: 7, card: 'Reaper of Prophecy', as: 'Reaper', face: [0.4, 0.25] },
                    { from: 9, card: 'World of Prophecy', as: 'World', face: [0.5, 0.33] }
                ]
            },
            { name: 'Trice', color: '#bbf7d0', forms: [{ from: 0, card: 'Empress of Prophecy', face: [0.45, 0.15] }] },
            { name: 'Hieron', color: '#fcd34d', forms: [{ from: 0, card: 'Hierophant of Prophecy', face: [0.5, 0.15] }] },
            { name: 'Batel', color: '#93c5fd', forms: [{ from: 0, card: 'Spellbook Magician of Prophecy', face: [0.5, 0.15] }] },
            { name: 'Endymion', color: '#c4b5fd', forms: [{ from: 0, card: 'Endymion, the Master Magician', face: [0.4, 0.15] }] }
        ]
    };

    window.LoreReelData['runick'] = {
        label: 'The Runick quest in card art',
        slides: [
            // The early realms
            { card: 'Runick Fountain', title: 'The summons', color: '#67e8f9', pan: [0.3, 0.6] },
            { card: 'Frodi, Generaider Boss of Swords', title: 'Boss of Swords', color: '#fde68a', pan: [0.5, 0.25] },
            { card: 'Runick Destruction', title: 'The Divine Giant', color: '#fb923c', pan: [0.3, 0.6] },
            { card: 'Naglfar, Generaider Boss of Fire', title: 'Boss of Fire', color: '#ef4444', pan: [0.45, 0.2] },
            { card: 'Hugin the Runick Wings', title: 'Companions', color: '#86efac', pan: [0.45, 0.2] },
            '|',
            // The late realms
            { card: 'Runick Golden Droplet', title: 'The bracelet', color: '#fcd34d', pan: [0.35, 0.6] },
            { card: 'Nidhogg, Generaider Boss of Ice', title: 'Boss of Ice', color: '#bae6fd', pan: [0.3, 0.6] },
            { card: 'Hela, Generaider Boss of Doom', title: 'Boss of Doom', color: '#9ca3af', pan: [0.45, 0.2] },
            '|',
            // The Extra Stage
            { card: 'Loptr, Shadow of the Generaider Bosses', title: 'The magician', color: '#c4b5fd', pan: [0.45, 0.2] },
            { card: 'Laevatein, Generaider Boss of Shadows', title: 'Extra Stage', color: '#a855f7', pan: [0.45, 0.2] }
        ]
    };

    window.LoreReelData['centur-ion'] = {
        label: 'The Centur-Ion story in card art',
        slides: [
            { card: 'Centur-Ion Primera', title: 'Primera', color: '#fca5a5', pan: [0.45, 0.2] },
            { card: 'Centur-Ion Trudea', title: 'Trudea', color: '#f9a8d4', pan: [0.42, 0.2] },
            { card: 'Emblema Oath', title: 'The oath', color: '#fde68a', pan: [0.3, 0.55] },
            { card: 'Stand Up Centur-Ion!', title: 'Stand up!', color: '#f472b6', pan: [0.3, 0.6] },
            { card: 'Centur-Ion Phalanx', title: 'The last wall', color: '#a78bfa', pan: [0.3, 0.6] },
            { card: 'Centur-Ion True Awakening', title: 'True Awakening', color: '#fcd34d', pan: [0.3, 0.6], on: ['Primera', 'Trudea', 'Emeth VI'] },
            { card: 'Centur-Ion Auxila', title: 'Dragonblaze', color: '#60a5fa', pan: [0.45, 0.2] }
        ],
        cast: [
            {
                name: 'Primera', color: '#fca5a5', names: ['Primera', 'Legatia'], forms: [
                    { from: 0, card: 'Centur-Ion Primera', face: [0.5, 0.2] },
                    { from: 5, card: 'Centur-Ion Legatia', as: 'Legatia', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Trudea', color: '#f9a8d4', names: ['Trudea', 'Legatia'], forms: [
                    { from: 0, card: 'Centur-Ion Trudea', face: [0.45, 0.2] },
                    { from: 5, card: 'Centur-Ion Legatia', as: 'Legatia', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Emeth VI', color: '#fde68a', names: ['Emeth VI', 'Legatia'], forms: [
                    { from: 0, card: 'Centur-Ion Emeth VI', face: [0.5, 0.3] },
                    { from: 5, card: 'Centur-Ion Legatia', as: 'Legatia', face: [0.5, 0.2] }
                ]
            },
            { name: 'Auxila', color: '#60a5fa', forms: [{ from: 0, card: 'Centur-Ion Auxila', face: [0.5, 0.2] }] }
        ]
    };

    window.LoreReelData['k9'] = {
        kind: 'roster',
        label: 'K9 personnel files',
        people: [
            {
                name: 'Izuna', tag: 'K9-17', color: '#fcd34d', forms: [
                    { card: 'K9-17 Izuna', face: [0.45, 0.15], pan: [0.4, 0.2] },
                    { card: 'K9-17 "Ripper"', as: 'Ripper', face: [0.4, 0.15], pan: [0.3, 0.18] },
                    { card: 'K9-X "Ripper/M"', as: 'Ripper/M', face: [0.3, 0.25], pan: [0.45, 0.25] }
                ]
            },
            { name: 'Noroi', tag: 'K9-04', color: '#f472b6', forms: [{ card: 'K9-04 Noroi', face: [0.45, 0.1], pan: [0.4, 0.15] }] },
            {
                name: 'Jokul & Lantern', tag: 'K9-66a/b', color: '#7dd3fc', forms: [
                    { card: 'K9-66a Jokul', as: 'Jokul', face: [0.5, 0.15], pan: [0.4, 0.2] },
                    { card: 'K9-66b Lantern', as: 'Lantern', face: [0.55, 0.12], pan: [0.4, 0.2] },
                    { card: 'K9-66X "Jacks"', as: 'Jacks', face: [0.5, 0.3], pan: [0.3, 0.55] }
                ]
            },
            {
                name: 'Lupis', tag: 'K9-ØØ', color: '#f87171', forms: [
                    { card: 'K9-ØØ Lupis', face: [0.42, 0.12], pan: [0.42, 0.2] },
                    { card: 'K9-ØØ "Hound"', as: 'Hound', face: [0.35, 0.2], pan: [0.45, 0.25] },
                    { card: 'K9-X "Werewolf"', as: 'Werewolf', face: [0.4, 0.2], pan: [0.45, 0.25] }
                ]
            }
        ]
    };

    window.LoreReelData['ghostrick'] = {
        kind: 'roster',
        label: 'Ghostrick residents',
        people: [
            { name: 'Alucard', group: 'The mansion', color: '#f87171', forms: [{ card: 'Ghostrick Alucard', face: [0.35, 0.12], pan: [0.35, 0.2] }] },
            { name: 'Specter', group: 'The mansion', color: '#e5e7eb', forms: [{ card: 'Ghostrick Specter', face: [0.5, 0.3], pan: [0.4, 0.3] }] },
            { name: 'Lantern', group: 'The mansion', color: '#fb923c', forms: [{ card: 'Ghostrick Lantern', face: [0.45, 0.3], pan: [0.45, 0.3] }] },
            { name: 'Yuki-onna', group: 'The mansion', color: '#bae6fd', forms: [{ card: 'Ghostrick Yuki-onna', face: [0.45, 0.2], pan: [0.35, 0.2] }] },
            { name: 'Witch', group: 'The mansion', color: '#fde68a', forms: [{ card: 'Ghostrick Witch', face: [0.5, 0.3], pan: [0.4, 0.3] }] },
            { name: 'Jiangshi', group: 'The mansion', color: '#c4b5fd', forms: [{ card: 'Ghostrick Jiangshi', face: [0.55, 0.35], pan: [0.45, 0.35] }] },
            { name: 'Dullahan', group: 'The museum', color: '#d1d5db', forms: [{ card: 'Ghostrick Dullahan', face: [0.6, 0.2], pan: [0.45, 0.3] }] },
            { name: 'Jackfrost', group: 'The museum', color: '#7dd3fc', forms: [{ card: 'Ghostrick Jackfrost', face: [0.45, 0.25], pan: [0.45, 0.3] }] },
            { name: 'Mary', group: 'The museum', color: '#a78bfa', forms: [{ card: 'Ghostrick Mary', face: [0.45, 0.35], pan: [0.4, 0.3] }] },
            { name: 'Nekomusume', group: 'The museum', color: '#fdba74', forms: [{ card: 'Ghostrick Nekomusume', face: [0.45, 0.25], pan: [0.4, 0.25] }] },
            { name: 'Mummy', group: 'The museum', color: '#e7e5e4', forms: [{ card: 'Ghostrick Mummy', face: [0.45, 0.3], pan: [0.45, 0.3] }] },
            { name: 'Skeleton', group: 'The museum', color: '#fef3c7', forms: [{ card: 'Ghostrick Skeleton', face: [0.45, 0.3], pan: [0.45, 0.3] }] },
            { name: 'Ghoul', group: 'Somewhere out there', color: '#86efac', forms: [{ card: 'Ghostrick Ghoul', face: [0.4, 0.3], pan: [0.45, 0.3] }] },
            { name: 'Yeti', group: 'Somewhere out there', color: '#fde68a', forms: [{ card: 'Ghostrick Yeti', face: [0.4, 0.35], pan: [0.45, 0.35] }] },
            { name: 'Socuteboss', group: 'In town', color: '#fca5a5', forms: [{ card: 'Ghostrick Socuteboss', face: [0.45, 0.3], pan: [0.45, 0.3] }] },
            { name: 'Doll', group: 'In town', color: '#f9a8d4', forms: [{ card: 'Ghostrick Doll', face: [0.45, 0.25], pan: [0.4, 0.25] }] },
            { name: 'Warwolf', group: 'In town', color: '#d6d3d1', forms: [{ card: 'Ghostrick Warwolf', face: [0.5, 0.3], pan: [0.45, 0.3] }] }
        ]
    };

    window.LoreReelData['mikanko'] = {
        kind: 'roster',
        portraits: 'first',   // the extra cards are dances and the Gate, not forms
        label: 'The Mikanko and their families',
        people: [
            {
                name: 'Ohime', group: 'The Kami', color: '#fde68a', forms: [
                    { card: 'Ohime the Manifested Mikanko', face: [0.42, 0.12], pan: [0.3, 0.18] },
                    { card: 'Heavenly Gate of the Mikanko', as: 'Heavenly Gate', face: [0.5, 0.5], pan: [0.3, 0.6] }
                ]
            },
            {
                name: 'Ha-Re', group: 'Mitsurugi', color: '#f87171', forms: [
                    { card: 'Ha-Re the Sword Mikanko', face: [0.35, 0.2], pan: [0.35, 0.2] },
                    { card: 'Mikanko Fire Dance', as: 'Fire Dance', face: [0.4, 0.2], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Ni-Ni', group: 'Mikagami', color: '#7dd3fc', forms: [
                    { card: 'Ni-Ni the Mirror Mikanko', face: [0.55, 0.18], pan: [0.35, 0.2] },
                    { card: 'Mikanko Water Arabesque', as: 'Water Arabesque', face: [0.5, 0.3], pan: [0.4, 0.25] },
                    { card: 'Mikanko Reflection Rondo', as: 'Reflection Rondo', face: [0.5, 0.25], pan: [0.3, 0.45] }
                ]
            },
            {
                name: 'Hu-Li', group: 'Mitama', color: '#bef264', forms: [
                    { card: 'Hu-Li the Jewel Mikanko', face: [0.45, 0.15], pan: [0.28, 0.18] },
                    { card: 'Mikanko Dance - Mayowashidori', as: 'Mayowashidori', face: [0.45, 0.3], pan: [0.35, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['exosister'] = {
        kind: 'roster',
        label: 'Team Lilium',
        people: [
            {
                name: 'Elis', group: 'Elis & Stella', color: '#fde68a', forms: [
                    { card: 'Exosister Elis', face: [0.45, 0.12], pan: [0.35, 0.18] },
                    { card: 'Exosister Mikailis', as: 'Mikailis', face: [0.45, 0.2], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'Stella', group: 'Elis & Stella', color: '#fca5a5', forms: [
                    { card: 'Exosister Stella', face: [0.45, 0.12], pan: [0.35, 0.18] },
                    { card: 'Exosister Kaspitell', as: 'Kaspitell', face: [0.55, 0.2], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'Irene', group: 'Irene & Sophia', color: '#bae6fd', forms: [
                    { card: 'Exosister Irene', face: [0.6, 0.1], pan: [0.35, 0.18] },
                    { card: 'Exosister Gibrine', as: 'Gibrine', face: [0.4, 0.15], pan: [0.35, 0.18] }
                ]
            },
            {
                name: 'Sophia', group: 'Irene & Sophia', color: '#c4b5fd', forms: [
                    { card: 'Exosister Sophia', face: [0.45, 0.12], pan: [0.35, 0.18] },
                    { card: 'Exosister Asophiel', as: 'Asophiel', face: [0.45, 0.2], pan: [0.35, 0.2] }
                ]
            }
        ]
    };

    window.LoreReelData['vaylantz'] = {
        kind: 'roster',
        label: 'Vaylantz Wars units',
        people: [
            { name: 'Baron', group: 'Konig Wissen', color: '#e5e7eb', forms: [{ card: 'Vaylantz Buster Baron', face: [0.45, 0.2], pan: [0.4, 0.2] }] },
            { name: 'Viscount', group: 'Konig Wissen', color: '#d1d5db', forms: [{ card: 'Vaylantz Voltage Viscount', face: [0.5, 0.25], pan: [0.45, 0.3] }] },
            { name: 'Marquess', group: 'Konig Wissen', color: '#a5f3fc', forms: [{ card: 'Vaylantz Mad Marquess', face: [0.55, 0.25], pan: [0.45, 0.3] }] },
            { name: 'Duke', group: 'Konig Wissen', color: '#bae6fd', forms: [{ card: 'Vaylantz Dominator Duke', face: [0.5, 0.2], pan: [0.45, 0.25] }] },
            { name: 'Grand Duke', group: 'Konig Wissen', color: '#f87171', forms: [{ card: 'Vaylantz Genesis Grand Duke', face: [0.5, 0.2], pan: [0.45, 0.25] }] },
            { name: 'Hojo', group: 'Shinra Bansho', color: '#fb923c', forms: [{ card: 'Hojo the Vaylantz Warrior', face: [0.45, 0.15], pan: [0.4, 0.2] }] },
            { name: 'Shinonome', group: 'Shinra Bansho', color: '#f9a8d4', forms: [{ card: 'Shinonome the Vaylantz Priestess', face: [0.3, 0.12], pan: [0.25, 0.15] }] },
            { name: 'Saion', group: 'Shinra Bansho', color: '#86efac', forms: [{ card: 'Saion the Vaylantz Archer', face: [0.45, 0.2], pan: [0.4, 0.2] }] },
            { name: 'Mamonaka', group: 'Shinra Bansho', color: '#fde68a', forms: [{ card: 'Mamonaka the Vaylantz United', face: [0.5, 0.25], pan: [0.5, 0.28] }] },
            { name: 'Nazuki', group: 'Shinra Bansho', color: '#c4b5fd', forms: [{ card: 'Nazuki the Vaylantz Ninja', face: [0.45, 0.15], pan: [0.4, 0.2] }] },
            { name: 'Arktos XII', group: 'Coming soon', color: '#fcd34d', forms: [{ card: 'Arktos XII - Chronochasm Vaylantz', face: [0.5, 0.25], pan: [0.4, 0.3] }] }
        ]
    };

    window.LoreReelData['clown-crew'] = {
        kind: 'roster',
        portraits: 'first',
        label: 'The Clown Crew troupe',
        people: [
            {
                name: 'Biancaviso', color: '#e5e7eb', forms: [
                    { card: 'Clown Crew Biancaviso', face: [0.42, 0.28], pan: [0.4, 0.25] },
                    { card: 'Clown Crew Soiree Operations', as: 'Soiree Operations', face: [0.3, 0.25], pan: [0.35, 0.45] }
                ]
            },
            {
                name: 'Flair', color: '#c084fc', forms: [
                    { card: 'Clown Crew Flair', face: [0.32, 0.14], pan: [0.35, 0.2] },
                    { card: 'Clown Crew New Face', as: 'New Face', face: [0.3, 0.3], pan: [0.35, 0.3] }
                ]
            },
            { name: 'Diabolo', color: '#f472b6', forms: [{ card: 'Clown Crew Diabolo', face: [0.38, 0.42], pan: [0.45, 0.35] }] },
            {
                name: 'Meteor', color: '#5eead4', forms: [
                    { card: 'Clown Crew Meteor', face: [0.45, 0.25], pan: [0.4, 0.25] },
                    { card: 'Clown Crew Malabarisme', as: 'Malabarisme', face: [0.4, 0.4], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Puck & Gubble', color: '#93c5fd', forms: [
                    { card: 'Clown Crew Fiends', face: [0.55, 0.35], pan: [0.45, 0.3] },
                    { card: 'Clown Crew Rehearsal', as: 'Rehearsal', face: [0.3, 0.2], pan: [0.45, 0.35] }
                ]
            }
        ]
    };

    window.LoreReelData['fiendsmith'] = {
        kind: 'roster',
        label: 'The Fiendsmith and his demons',
        people: [
            {
                name: 'The Fiendsmith', color: '#f87171', forms: [
                    { card: 'Fiendsmith Engraver', face: [0.4, 0.2], pan: [0.35, 0.2] },
                    { card: 'Fiendsmith\'s Rextremende', as: 'Rextremende', face: [0.35, 0.3], pan: [0.4, 0.3] }
                ]
            },
            {
                name: 'Requiem', color: '#9ca3af', forms: [
                    { card: 'Fiendsmith\'s Requiem', face: [0.5, 0.35], pan: [0.3, 0.5] },
                    { card: 'Fiendsmith\'s Sequence', as: 'Sequence', face: [0.5, 0.4], pan: [0.35, 0.5] },
                    { card: 'Fiendsmith\'s Agnumday', as: 'Agnumday', face: [0.45, 0.3], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Lacrima', color: '#fb7185', forms: [
                    { card: 'Lacrima the Crimson Tears', face: [0.45, 0.18], pan: [0.22, 0.15] },
                    { card: 'Fiendsmith\'s Lacrima', as: 'Fiendsmith\'s Lacrima', face: [0.4, 0.2], pan: [0.35, 0.25] }
                ]
            }
        ]
    };

    window.LoreReelData['argostars'] = {
        kind: 'roster',
        label: 'Team Argostars',
        people: [
            { name: 'Parthe', group: 'Team Argostars', color: '#60a5fa', forms: [{ card: 'Argostars - Fierce Parthe', face: [0.6, 0.28], pan: [0.35, 0.25] }] },
            { name: 'Tydeu', group: 'Team Argostars', color: '#86efac', forms: [{ card: 'Argostars - Lightning Tydeu', face: [0.2, 0.4], pan: [0.45, 0.35] }] },
            { name: 'Capane', group: 'Team Argostars', color: '#fdba74', forms: [{ card: 'Argostars - Swift Capane', face: [0.3, 0.25], pan: [0.35, 0.25] }] },
            { name: 'Eteo', group: 'Team Argostars', color: '#c4b5fd', forms: [{ card: 'Argostars - Slayer Eteo', face: [0.45, 0.2], pan: [0.35, 0.2] }] },
            { name: 'Adra', group: 'Team Argostars', color: '#fca5a5', forms: [{ card: 'Argostars - Glorious Adra', face: [0.45, 0.2], pan: [0.35, 0.2] }] },
            {
                name: 'NEMEAN', group: 'The tournament', color: '#67e8f9', forms: [
                    { card: 'Argostars - Home Stadium', face: [0.5, 0.35], pan: [0.3, 0.5] },
                    { card: 'Argostars - Giantslaying', as: 'Giant-killing', face: [0.45, 0.35], pan: [0.35, 0.4] }
                ]
            }
        ]
    };

    window.LoreReelData['s-force'] = {
        kind: 'roster',
        portraits: 'first',
        label: 'The S-Force',
        people: [
            { name: 'Justify', group: 'Command', color: '#7dd3fc', forms: [{ card: 'S-Force Justify', face: [0.5, 0.2], pan: [0.4, 0.25] }] },
            { name: 'DiGamma', group: 'Command', color: '#86efac', forms: [{ card: 'S-Force Professor DiGamma', face: [0.45, 0.15], pan: [0.35, 0.2] }] },
            { name: 'Pla-Tina', group: 'Field agents', color: '#c4b5fd', forms: [{ card: 'S-Force Pla-Tina', face: [0.5, 0.15], pan: [0.3, 0.2] }] },
            { name: 'Orrafist', group: 'Field agents', color: '#fdba74', forms: [{ card: 'S-Force Orrafist', face: [0.4, 0.15], pan: [0.35, 0.2] }] },
            { name: 'Edge Razor', group: 'Field agents', color: '#f87171', forms: [{ card: 'S-Force Edge Razor', face: [0.3, 0.3], pan: [0.4, 0.3] }] },
            { name: 'Gravitino', group: 'Field agents', color: '#a3e635', forms: [{ card: 'S-Force Gravitino', face: [0.35, 0.45], pan: [0.5, 0.4] }] },
            {
                name: 'The base', group: 'Equipment', color: '#93c5fd', forms: [
                    { card: 'S-Force Bridgehead', face: [0.5, 0.4], pan: [0.3, 0.5] },
                    { card: 'S-Force Dog Tag', as: 'Dog Tags', face: [0.6, 0.35], pan: [0.4, 0.35] }
                ]
            },
            {
                name: 'Chiyomaru', group: 'Your guide', color: '#fde68a', forms: [
                    { card: 'S-Force Rappa Chiyomaru', face: [0.25, 0.45], pan: [0.45, 0.4] },
                    { card: 'S-Force Chase', as: 'The chase', face: [0.3, 0.25], pan: [0.35, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['live-twin'] = {
        kind: 'roster',
        label: 'Live☆Twin and Evil★Twin',
        people: [
            {
                name: 'Ki-sikil', group: 'The duo', color: '#f472b6', forms: [
                    { card: 'Live☆Twin Ki-sikil', face: [0.45, 0.25], pan: [0.35, 0.25] },
                    { card: 'Live☆Twin Ki-sikil Frost', as: 'Frost', face: [0.3, 0.3], pan: [0.35, 0.3] },
                    { card: 'Evil★Twin Ki-sikil', as: 'Evil★Twin', face: [0.45, 0.2], pan: [0.35, 0.2] },
                    { card: 'Evil★Twin Ki-sikil Deal', as: 'Deal', face: [0.3, 0.25], pan: [0.35, 0.25] }
                ]
            },
            {
                name: 'Lil-la', group: 'The duo', color: '#7dd3fc', forms: [
                    { card: 'Live☆Twin Lil-la', face: [0.45, 0.3], pan: [0.35, 0.3] },
                    { card: 'Live☆Twin Lil-la Treat', as: 'Treat', face: [0.4, 0.3], pan: [0.35, 0.3] },
                    { card: 'Live☆Twin Lil-la Sweet', as: 'Sweet', face: [0.35, 0.3], pan: [0.35, 0.3] },
                    { card: 'Evil★Twin Lil-la', as: 'Evil★Twin', face: [0.45, 0.15], pan: [0.3, 0.2] }
                ]
            },
            {
                name: 'The channel', group: 'Behind the scenes', color: '#f9a8d4', forms: [
                    { card: 'Live☆Twin Home', face: [0.35, 0.3], pan: [0.3, 0.45] },
                    { card: 'Live☆Twin Channel', as: 'Homepage', face: [0.4, 0.4], pan: [0.3, 0.45] },
                    { card: 'Secret Password', as: 'Secret Password', face: [0.5, 0.45], pan: [0.35, 0.5] }
                ]
            },
            { name: 'The Big Jewel', group: 'Behind the scenes', color: '#c4b5fd', forms: [{ card: 'Evil★Twin GG EZ', face: [0.3, 0.2], pan: [0.35, 0.25] }] }
        ]
    };

    window.LoreReelData['purrely'] = {
        kind: 'roster',
        label: 'Purrelies, growing up',
        people: [
            { name: 'Purrely', group: 'Growing up', color: '#fbcfe8', forms: [{ card: 'Purrely', face: [0.5, 0.35], pan: [0.4, 0.35] }] },
            {
                name: 'Epurrely', group: 'Growing up', color: '#bae6fd', forms: [
                    { card: 'Epurrely Happiness', as: 'Happiness', face: [0.5, 0.66], pan: [0.66, 0.6] },
                    { card: 'Epurrely Beauty', as: 'Beauty', face: [0.5, 0.35], pan: [0.4, 0.35] },
                    { card: 'Epurrely Plump', as: 'Plump', face: [0.5, 0.4], pan: [0.4, 0.35] }
                ]
            },
            {
                name: 'Expurrely', group: 'Growing up', color: '#c4b5fd', forms: [
                    { card: 'Expurrely Happiness', as: 'Happiness', face: [0.5, 0.55], pan: [0.55, 0.5] },
                    { card: 'Expurrely Noir', as: 'Noir', face: [0.45, 0.35], pan: [0.4, 0.35] }
                ]
            },
            { name: 'Found', group: 'A diary', color: '#fde68a', forms: [{ card: 'My Friend Purrely', face: [0.45, 0.55], pan: [0.55, 0.5] }] },
            { name: 'Playtime', group: 'A diary', color: '#86efac', forms: [{ card: 'Purrely Happy Memory', face: [0.45, 0.6], pan: [0.6, 0.55] }] },
            { name: 'Dinner', group: 'A diary', color: '#fdba74', forms: [{ card: 'Purrely Delicious Memory', face: [0.5, 0.15], pan: [0.3, 0.2] }] },
            { name: 'A visitor', group: 'A diary', color: '#a5b4fc', forms: [{ card: 'Purrely Sleepy Memory', face: [0.3, 0.45], pan: [0.4, 0.45] }] },
            { name: 'Bath time', group: 'A diary', color: '#7dd3fc', forms: [{ card: 'Purrely Pretty Memory', face: [0.5, 0.4], pan: [0.35, 0.4] }] }
        ]
    };

    window.LoreReelData['machina'] = {
        kind: 'roster',
        label: 'The Machina armored corps',
        people: [
            { name: 'Fortress', group: 'The new army', color: '#7dd3fc', forms: [{ card: 'Machina Fortress', face: [0.5, 0.4], pan: [0.35, 0.4] }] },
            { name: 'Citadel', group: 'The new army', color: '#fbbf24', forms: [{ card: 'Machina Citadel', face: [0.4, 0.3], pan: [0.35, 0.35] }] },
            { name: 'Air Raider', group: 'The new army', color: '#c4b5fd', forms: [{ card: 'Machina Air Raider', face: [0.5, 0.4], pan: [0.35, 0.4] }] },
            { name: 'Irradiator', group: 'The new army', color: '#86efac', forms: [{ card: 'Machina Irradiator', face: [0.5, 0.3], pan: [0.35, 0.35] }] },
            {
                name: 'Soldier', group: 'The legacy models', color: '#4ade80', forms: [
                    { card: 'Machina Soldier', face: [0.5, 0.2], pan: [0.35, 0.25] },
                    { card: 'Machina Possesstorage', as: 'Possesstorage', face: [0.5, 0.3], pan: [0.35, 0.35] }
                ]
            },
            {
                name: 'Defender', group: 'The legacy models', color: '#60a5fa', forms: [
                    { card: 'Machina Defender', face: [0.5, 0.35], pan: [0.35, 0.35] },
                    { card: 'Machina Resavenger', as: 'Resavenger', face: [0.5, 0.4], pan: [0.35, 0.4] }
                ]
            },
            { name: 'Bootup Device', group: 'The intruder', color: '#f87171', forms: [{ card: 'Unauthorized Bootup Device', face: [0.5, 0.3], pan: [0.35, 0.3] }] }
        ]
    };

    window.LoreReelData['labrynth'] = {
        kind: 'roster',
        label: 'The Silver Castle of Labrynth',
        people: [
            {
                name: 'The Princess', group: 'The princess', color: '#e5e7eb', forms: [
                    { card: 'Lovely Labrynth of the Silver Castle', face: [0.45, 0.2], pan: [0.35, 0.2] },
                    { card: 'Lady Labrynth of the Silver Castle', as: 'Lady Labrynth', face: [0.5, 0.2], pan: [0.35, 0.2] }
                ]
            },
            { name: 'Ariane', group: 'The staff', color: '#f9a8d4', forms: [{ card: 'Ariane the Labrynth Servant', face: [0.45, 0.2], pan: [0.3, 0.2] }] },
            { name: 'Arianna', group: 'The staff', color: '#86efac', forms: [{ card: 'Arianna the Labrynth Servant', face: [0.45, 0.15], pan: [0.3, 0.2] }] },
            { name: 'Archfiend', group: 'The staff', color: '#cbd5e1', forms: [{ card: 'Labrynth Archfiend', face: [0.3, 0.2], pan: [0.35, 0.25] }] },
            {
                name: 'Furnishings', group: 'The staff', color: '#fcd34d', forms: [
                    { card: 'Labrynth Chandraglier', as: 'Chandraglier', face: [0.5, 0.35], pan: [0.35, 0.35] },
                    { card: 'Labrynth Cooclock', as: 'Cooclock', face: [0.45, 0.35], pan: [0.35, 0.35] },
                    { card: 'Labrynth Stovie Torbie', as: 'Stovie Torbie', face: [0.5, 0.4], pan: [0.35, 0.4] }
                ]
            },
            { name: 'The knight', group: 'The guest', color: '#fca5a5', forms: [{ card: 'Welcome Labrynth', face: [0.45, 0.72], pan: [0.4, 0.65] }] }
        ]
    };

    window.LoreReelData['dinomorphia'] = {
        kind: 'roster',
        portraits: 'first',
        label: 'The Dinomorphia, a special report',
        people: [
            {
                name: 'The attack', group: 'The report', color: '#f87171', forms: [
                    { card: 'Dinomorphia Frenzy', face: [0.5, 0.3], pan: [0.3, 0.45] },
                    { card: 'Dinomorphia Sonic', as: 'Security footage', face: [0.5, 0.4], pan: [0.35, 0.4] },
                    { card: 'Dinomorphia Reversion', as: 'On the scene', face: [0.5, 0.3], pan: [0.35, 0.35] }
                ]
            },
            { name: 'Kentregina', group: 'Humanoid Dinomorphia', color: '#fca5a5', forms: [{ card: 'Dinomorphia Kentregina', face: [0.5, 0.2], pan: [0.35, 0.25] }] },
            { name: 'Therizia', group: 'Humanoid Dinomorphia', color: '#fde68a', forms: [{ card: 'Dinomorphia Therizia', face: [0.5, 0.15], pan: [0.3, 0.2] }] },
            { name: 'Diplos', group: 'Humanoid Dinomorphia', color: '#86efac', forms: [{ card: 'Dinomorphia Diplos', face: [0.5, 0.35], pan: [0.4, 0.35] }] },
            { name: 'Stealth\u00ADbergia', group: 'Weapons', color: '#fbbf24', forms: [{ card: 'Dinomorphia Stealthbergia', face: [0.45, 0.35], pan: [0.35, 0.4] }] },
            { name: 'Rexterm', group: 'Weapons', color: '#f87171', forms: [{ card: 'Dinomorphia Rexterm', face: [0.45, 0.3], pan: [0.35, 0.35] }] }
        ]
    };

    window.LoreReelData['witchcrafter'] = {
        kind: 'trail',
        label: 'The Witchcrafter art trail',
        stops: [
            { card: 'Witchcrafter Bystreet', title: 'The street', color: '#fde68a', face: [0.5, 0.55], pan: [0.3, 0.6], zoom: 1.8 },
            { card: 'Witchcrafter Madame Verre', title: 'The guild master', color: '#a5f3fc', face: [0.42, 0.25], pan: [0.35, 0.25] },
            { card: 'Witchcrafter Masterpiece', title: 'The masterpiece', color: '#fcd34d', face: [0.18, 0.2], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Witchcrafter Unveiling', title: 'The unveiling', color: '#c4b5fd', face: [0.45, 0.45], pan: [0.5, 0.4] },
            { card: 'Witchcrafter Genni', title: 'Genni', color: '#fdba74', face: [0.55, 0.2], pan: [0.35, 0.2] },
            { card: 'Witchcrafter Pupils', title: 'The pupils', color: '#fca5a5', face: [0.55, 0.45], pan: [0.35, 0.45] },
            { card: 'Witchcrafter Haine', title: 'Haine', color: '#93c5fd', face: [0.2, 0.18], pan: [0.35, 0.2] },
            { card: 'Witchcrafter Confusion Confession', title: 'The letter', color: '#f9a8d4', face: [0.45, 0.2], pan: [0.3, 0.5] },
            { card: 'Witchcrafter Vice-Madame', title: 'Vice-Madame', color: '#86efac', face: [0.5, 0.2], pan: [0.35, 0.2] },
            { card: 'Witchcrafter Distortion', title: 'The hat', color: '#a78bfa', face: [0.4, 0.55], pan: [0.3, 0.55] },
            { card: 'Witchcrafter Madame Rilliona', title: 'Rilliona', color: '#818cf8', face: [0.5, 0.3], pan: [0.35, 0.3] },
            { card: 'Witchcrafter Celebration', title: 'Celebration', color: '#fde047', face: [0.5, 0.65], pan: [0.45, 0.55], zoom: 1.8 }
        ]
    };

    window.LoreReelData['dragonmaid'] = {
        kind: 'trail',
        label: 'The Dragonmaid art trail',
        stops: [
            { card: 'House Dragonmaid', title: 'House', color: '#e5e7eb', face: [0.4, 0.15], pan: [0.35, 0.18] },
            { card: 'Dragonmaid Hospitality', title: 'Hospitality', color: '#fca5a5', face: [0.45, 0.4], pan: [0.35, 0.45], zoom: 1.8 },
            { card: 'Parlor Dragonmaid', title: 'Parlor', color: '#bef264', face: [0.5, 0.2], pan: [0.3, 0.2] },
            { card: 'Kitchen Dragonmaid', title: 'Kitchen', color: '#f87171', face: [0.4, 0.12], pan: [0.3, 0.15] },
            { card: 'Laundry Dragonmaid', title: 'Laundry', color: '#93c5fd', face: [0.4, 0.2], pan: [0.3, 0.2] },
            { card: 'Nurse Dragonmaid', title: 'Nurse', color: '#f9a8d4', face: [0.45, 0.15], pan: [0.3, 0.18] },
            { card: 'Chamber Dragonmaid', title: 'Chamber', color: '#d1d5db', face: [0.45, 0.2], pan: [0.35, 0.2] },
            { card: 'Dragonmaid Tidying', title: 'Tidying', color: '#fde68a', face: [0.3, 0.45], pan: [0.4, 0.35] },
            { card: 'Dragonmaid Downtime', title: 'Downtime', color: '#c4b5fd', face: [0.2, 0.45], pan: [0.35, 0.45] },
            { card: 'Dragonmaid Changeover', title: 'Changeover', color: '#a78bfa', face: [0.5, 0.45], pan: [0.45, 0.4] },
            { card: 'Dragonmaid Welcome', title: 'Welcome', color: '#5eead4', face: [0.6, 0.75], pan: [0.45, 0.65], zoom: 1.8 },
            { card: 'Dragonmaid Send-Off', title: 'Send-Off', color: '#fdba74', face: [0.5, 0.35], pan: [0.4, 0.35], zoom: 1.8 }
        ]
    };

    window.LoreReelData['evil-eye'] = {
        kind: 'trail',
        label: 'The Evil Eye art trail',
        stops: [
            { card: 'Evil Eye of Selene', title: 'Selene', color: '#f87171', face: [0.55, 0.55], pan: [0.55, 0.45] },
            { card: 'Serziel, Watcher of the Evil Eye', title: 'Serziel', color: '#fca5a5', face: [0.45, 0.2], pan: [0.35, 0.2] },
            { card: 'Basilius, Familiar of the Evil Eye', title: 'Basilius', color: '#86efac', face: [0.5, 0.3], pan: [0.4, 0.3] },
            { card: 'Catoblepas, Familiar of the Evil Eye', title: 'Catoblepas', color: '#d1d5db', face: [0.45, 0.4], pan: [0.45, 0.4] },
            { card: 'Medusa, Watcher of the Evil Eye', title: 'Medusa', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.35, 0.2] },
            { card: 'Evil Eye Confrontation', title: 'Confrontation', color: '#a78bfa', face: [0.85, 0.55], pan: [0.5, 0.45] },
            { card: 'Evil Eye Defeat', title: 'Defeat', color: '#fb7185', face: [0.75, 0.4], pan: [0.45, 0.4] },
            { card: 'Evil Eye Awakening', title: 'Awakening', color: '#fbbf24', face: [0.55, 0.4], pan: [0.35, 0.4] },
            { card: 'Zerrziel, Ruler of the Evil Eyed', title: 'Zerrziel', color: '#ef4444', face: [0.5, 0.35], pan: [0.4, 0.35] },
            { card: 'Evil Eye of Gorgoneio', title: 'Gorgoneio', color: '#e879f9', face: [0.45, 0.6], pan: [0.6, 0.55] },
            { card: 'Gorgon, Empress of the Evil Eyed', title: 'Gorgon', color: '#a5b4fc', face: [0.5, 0.12], pan: [0.3, 0.15] },
            { card: 'Evil Eye Reemergence', title: 'Reemergence', color: '#f0abfc', face: [0.75, 0.3], pan: [0.35, 0.35] },
            { card: 'Basiltrice, Familiar of the Evil Eye', title: 'Basiltrice', color: '#fde68a', face: [0.5, 0.25], pan: [0.5, 0.3] }
        ]
    };

    window.LoreReelData['time-thief'] = {
        kind: 'trail',
        label: 'The Time Thief art trail',
        stops: [
            { card: 'Time Thief Startup', title: 'The inventor', color: '#fde68a', face: [0.3, 0.15], pan: [0.3, 0.2] },
            { card: 'Time Thief Hack', title: 'The hack', color: '#fb923c', face: [0.3, 0.3], pan: [0.35, 0.3] },
            { card: 'Time Thief Flyback', title: 'Flyback', color: '#86efac', face: [0.65, 0.35], pan: [0.35, 0.35] },
            { card: 'Time Thief Redoer', title: 'Redoer', color: '#f87171', face: [0.45, 0.2], pan: [0.35, 0.2] },
            { card: 'Time Thief Winder', title: 'Winder', color: '#7dd3fc', face: [0.4, 0.12], pan: [0.3, 0.15] },
            { card: 'Time Thief Double Barrel', title: 'Double Barrel', color: '#c4b5fd', face: [0.55, 0.15], pan: [0.3, 0.2] },
            { card: 'Time Thief Retrograde', title: 'Retrograde', color: '#fbbf24', face: [0.85, 0.72], pan: [0.55, 0.65], zoom: 1.8 },
            { card: 'Time Thief Adjuster', title: 'Adjuster', color: '#fca5a5', face: [0.3, 0.35], pan: [0.4, 0.35] },
            { card: 'Time Thief Perpetua', title: 'Perpetua', color: '#f472b6', face: [0.4, 0.15], pan: [0.3, 0.18] },
            { card: 'Time Thief Power Reserve', title: 'Power Reserve', color: '#67e8f9', face: [0.68, 0.2], pan: [0.3, 0.3] }
        ]
    };

    window.LoreReelData['madolche'] = {
        kind: 'trail',
        label: 'The Madolche art trail',
        stops: [
            { card: 'Madolche Chateau', title: 'The chateau', color: '#f9a8d4', face: [0.2, 0.2], pan: [0.35, 0.45] },
            { card: 'Madolche Puddingcess', title: 'Puddingcess', color: '#fde68a', face: [0.45, 0.2], pan: [0.3, 0.2] },
            { card: 'Madolche Lesson', title: 'The lesson', color: '#fca5a5', face: [0.5, 0.3], pan: [0.35, 0.3] },
            { card: 'Madolche Marmalmaide', title: 'Marmalmaide', color: '#fdba74', face: [0.4, 0.2], pan: [0.3, 0.25] },
            { card: 'Madolche Tea Break', title: 'Tea break', color: '#c4b5fd', face: [0.45, 0.4], pan: [0.35, 0.4], zoom: 1.8 },
            { card: 'Madolche Magileine', title: 'Magileine', color: '#a78bfa', face: [0.55, 0.15], pan: [0.3, 0.2] },
            { card: 'Madolche Waltz', title: 'The waltz', color: '#f0abfc', face: [0.45, 0.25], pan: [0.35, 0.3], zoom: 1.8 },
            { card: 'Madolche Chouxvalier', title: 'Chouxvalier', color: '#86efac', face: [0.6, 0.25], pan: [0.35, 0.3] },
            { card: 'Madolche Salon', title: 'The salon', color: '#bae6fd', face: [0.3, 0.35], pan: [0.35, 0.35] },
            { card: 'Madolche Promenade', title: 'Promenade', color: '#fcd34d', face: [0.45, 0.4], pan: [0.35, 0.4], zoom: 1.8 },
            { card: 'Madolche Queen Tiaramisu', title: 'The queen', color: '#fef3c7', face: [0.5, 0.2], pan: [0.3, 0.25] },
            { card: 'Madolchepalooza', title: 'Madolche\u00ADpalooza', color: '#fb7185', face: [0.5, 0.4], pan: [0.35, 0.45], zoom: 1.8 },
            { card: 'Madolche Nights', title: 'Nights', color: '#818cf8', face: [0.6, 0.6], pan: [0.45, 0.62] }
        ]
    };

    window.LoreReelData['monarch'] = {
        kind: 'trail',
        label: 'The Monarch art trail',
        stops: [
            { card: 'The First Monarch', title: 'The first', color: '#e5e7eb', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'March of the Monarchs', title: 'The march', color: '#f97316', face: [0.5, 0.4], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'The Monarchs Masterplan', title: 'The masterplan', color: '#a78bfa', face: [0.5, 0.4], pan: [0.35, 0.55], zoom: 1.6 },
            { card: 'The Monarchs Revolt', title: 'The revolt', color: '#ef4444', face: [0.5, 0.2], pan: [0.25, 0.5] },
            { card: 'Domain of the True Monarchs', title: 'The true domain', color: '#fde68a', face: [0.5, 0.35], pan: [0.35, 0.7], zoom: 1.6 },
            { card: 'Erebus the Underworld Monarch', title: 'Erebus', color: '#94a3b8', face: [0.55, 0.15], pan: [0.3, 0.2] },
            { card: 'The Monarchs Awaken', title: 'Mega Monarchs', color: '#7dd3fc', face: [0.5, 0.35], pan: [0.3, 0.45], zoom: 1.8 },
            { card: 'Escalation of the Monarchs', title: 'Escalation', color: '#f472b6', face: [0.5, 0.5], pan: [0.4, 0.6], zoom: 1.6 },
            { card: 'Tenacity of the Monarchs', title: 'Tenacity', color: '#a1a1aa', face: [0.5, 0.4], pan: [0.3, 0.45], zoom: 1.8 },
            { card: 'The Prime Monarch', title: 'The prime', color: '#f8fafc', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'Pantheism of the Monarchs', title: 'Pantheism', color: '#fcd34d', face: [0.5, 0.35], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Restoration of the Monarchs', title: 'Restoration', color: '#fef3c7', face: [0.55, 0.3], pan: [0.25, 0.4] }
        ]
    };


    window.LoreReelData['melffy'] = {
        kind: 'trail',
        label: 'The Melffy art trail',
        stops: [
            { card: 'Melffy of the Forest', title: 'The forest', color: '#86efac', face: [0.5, 0.55], pan: [0.45, 0.6], zoom: 1.6 },
            { card: 'Melffy Hide-and-Seek', title: 'Hide-and-seek', color: '#bef264', face: [0.25, 0.55], pan: [0.5, 0.55] },
            { card: 'Melffy Footsteps', title: 'Footsteps', color: '#fcd34d', face: [0.3, 0.3], pan: [0.3, 0.5] },
            { card: 'Melffy Staring Contest', title: 'Staring contest', color: '#fda4af', face: [0.5, 0.4], pan: [0.4, 0.4], zoom: 1.6 },
            { card: 'Melffy Tag', title: 'Tag', color: '#f9a8d4', face: [0.5, 0.5], pan: [0.4, 0.55], zoom: 1.6 },
            { card: 'Melffy Playhouse', title: 'The playhouse', color: '#f0abfc', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Melffy Playtime Surprise', title: 'The fruit', color: '#fb7185', face: [0.5, 0.5], pan: [0.3, 0.5] },
            { card: 'Melffys\' Joyful Surprise', title: 'The feast', color: '#fdba74', face: [0.5, 0.5], pan: [0.35, 0.55], zoom: 1.6 },
            { card: 'Merry Melffys', title: 'Swimming', color: '#7dd3fc', face: [0.5, 0.4], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'Melffy Puppy', title: 'Puppy', color: '#fde68a', face: [0.5, 0.4], pan: [0.4, 0.45] }
        ]
    };

    window.LoreReelData['ojama'] = {
        kind: 'trail',
        label: 'The Ojama art trail',
        stops: [
            { card: 'Ojama Country', title: 'Ojama Country', color: '#fde047', face: [0.5, 0.6], pan: [0.45, 0.7], zoom: 1.6 },
            { card: 'Ojama Trio', title: 'The trio', color: '#4ade80', face: [0.5, 0.4], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Ojama Duo', title: 'The duo', color: '#60a5fa', face: [0.5, 0.3], pan: [0.3, 0.4], zoom: 1.8 },
            { card: 'Ojama Yellow', title: 'Yellow', color: '#fde047', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Ojama Delta Hurricane!!', title: 'Delta Hurricane', color: '#f472b6', face: [0.5, 0.5], pan: [0.4, 0.6], zoom: 1.6 },
            { card: 'Ojamagic', title: 'Ojamagic', color: '#fb7185', face: [0.5, 0.3], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Ojamatch', title: 'Ojamatch', color: '#f87171', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'Ojama Pajama', title: 'Pajama party', color: '#c4b5fd', face: [0.5, 0.35], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'Solidarity', title: 'Solidarity', color: '#a1a1aa', face: [0.5, 0.45], pan: [0.35, 0.55], zoom: 1.6 },
            { card: 'Ojama King', title: 'The king', color: '#fef3c7', face: [0.5, 0.35], pan: [0.3, 0.4] }
        ]
    };

    window.LoreReelData['solfachord'] = {
        kind: 'trail',
        label: 'The Solfachord art trail',
        stops: [
            { card: 'DoSolfachord Cutia', title: 'Cutia', color: '#f9a8d4', face: [0.3, 0.2], pan: [0.25, 0.35] },
            { card: 'Solfachord Happiness', title: 'Happiness', color: '#fde68a', face: [0.5, 0.4], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Solfachord Elegance', title: 'Elegance', color: '#fcd34d', face: [0.5, 0.35], pan: [0.3, 0.4], zoom: 1.6 },
            { card: 'Solfachord Formal', title: 'Formal', color: '#a5b4fc', face: [0.5, 0.3], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Solfachord Harmonia', title: 'Harmonia', color: '#f0abfc', face: [0.5, 0.4], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'Solfachord Symphony', title: 'Symphony', color: '#fda4af', face: [0.5, 0.4], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'DoSolfachord Coolia', title: 'Coolia', color: '#c4b5fd', face: [0.45, 0.18], pan: [0.25, 0.3] },
            { card: 'Solfachord Scale', title: 'Scale', color: '#e879f9', face: [0.4, 0.3], pan: [0.3, 0.45], zoom: 1.8 },
            { card: 'Solfachord Solfegia', title: 'Solfegia', color: '#fef08a', face: [0.5, 0.4], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'GranSolfachord Musecia', title: 'Musecia', color: '#fdba74', face: [0.45, 0.2], pan: [0.25, 0.3] }
        ]
    };

    window.LoreReelData['prank-kids'] = {
        kind: 'trail',
        label: 'The Prank-Kids art trail',
        stops: [
            { card: 'Prank-Kids Place', title: 'The house', color: '#fde047', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'Prank-Kids Fansies', title: 'Fansies', color: '#86efac', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Prank-Kids Lampsies', title: 'Lampsies', color: '#fb923c', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Prank-Kids Dropsies', title: 'Dropsies', color: '#7dd3fc', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Prank-Kids Plan', title: 'The plan', color: '#fcd34d', face: [0.5, 0.4], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'Prank-Kids Pandemonium', title: 'Pandemonium', color: '#f472b6', face: [0.5, 0.5], pan: [0.35, 0.6], zoom: 1.6 },
            { card: 'Prank-Kids Battle Butler', title: 'Battle Butler', color: '#a78bfa', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Prank-Kids Rocket Ride', title: 'Rocket Ride', color: '#f87171', face: [0.55, 0.35], pan: [0.3, 0.45] },
            { card: 'Prank-Kids Weather Washer', title: 'Weather Washer', color: '#38bdf8', face: [0.4, 0.2], pan: [0.25, 0.35] },
            { card: 'Prank-Kids Meow-Meow-Mu', title: 'Meow-Meow-Mu', color: '#fdba74', face: [0.5, 0.35], pan: [0.35, 0.45], zoom: 1.8 }
        ]
    };

    window.LoreReelData['noble-knight'] = {
        kind: 'trail',
        label: 'The Noble Knight art trail',
        stops: [
            { card: 'Noble Knight Artorigus', title: 'The sword', color: '#fde68a', face: [0.45, 0.12], pan: [0.25, 0.35] },
            { card: 'Noble Knights of the Round Table', title: 'The Round Table', color: '#fbbf24', face: [0.5, 0.3], pan: [0.25, 0.4], zoom: 1.6 },
            { card: 'Noble Knight Gawayn', title: 'Gawayn', color: '#fcd34d', face: [0.38, 0.42], pan: [0.3, 0.45] },
            { card: 'Noble Knight Medraut', title: 'Medraut', color: '#f87171', face: [0.55, 0.2], pan: [0.25, 0.3] },
            { card: 'Noble Knight Brothers', title: 'The brothers', color: '#d6d3d1', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Noble Knight Peredur', title: 'Peredur', color: '#86efac', face: [0.55, 0.2], pan: [0.25, 0.3] },
            { card: 'Noble Knight Borz', title: 'Borz', color: '#fef08a', face: [0.5, 0.15], pan: [0.25, 0.45] },
            { card: 'Ignoble Knight of Black Laundsallyn', title: 'Laundsallyn', color: '#9ca3af', face: [0.45, 0.25], pan: [0.25, 0.45] },
            { card: 'Noble Knight Eachtar', title: 'Eachtar', color: '#c4b5fd', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Artorigus, King of the Noble Knights', title: 'The king', color: '#fb923c', face: [0.4, 0.2], pan: [0.25, 0.3] },
            { card: 'Last Chapter of the Noble Knights', title: 'The last chapter', color: '#7dd3fc', face: [0.6, 0.2], pan: [0.3, 0.45] },
            { card: 'Sacred Noble Knight of King Artorigus', title: 'The sacred king', color: '#fde047', face: [0.5, 0.2], pan: [0.25, 0.3] }
        ]
    };

    window.LoreReelData['adamancipator'] = {
        kind: 'trail',
        label: 'The Adamancipator art trail',
        stops: [
            { card: 'Adamancipator Laputite', title: 'The cave', color: '#a5b4fc', face: [0.5, 0.6], pan: [0.4, 0.65], zoom: 1.6 },
            { card: 'Adamancipator Seeker', title: 'Seeker', color: '#fbbf24', face: [0.45, 0.12], pan: [0.2, 0.25] },
            { card: 'Adamancipator Researcher', title: 'Researcher', color: '#fca5a5', face: [0.4, 0.15], pan: [0.2, 0.25] },
            { card: 'Adamancipator Analyzer', title: 'Analyzer', color: '#bef264', face: [0.55, 0.25], pan: [0.25, 0.35] },
            { card: 'Adamancipator Signs', title: 'Signs', color: '#6ee7b7', face: [0.5, 0.4], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'Adamancipator Risen - Raptite', title: 'Raptite', color: '#34d399', face: [0.5, 0.45], pan: [0.35, 0.45], zoom: 1.8 },
            { card: 'Adamancipator Resonance', title: 'Resonance', color: '#fde68a', face: [0.5, 0.5], pan: [0.4, 0.5], zoom: 1.8 },
            { card: 'Adamancipator Relief', title: 'Relief', color: '#f87171', face: [0.5, 0.25], pan: [0.25, 0.4] },
            { card: 'Adamancipator Luminous', title: 'Luminous', color: '#e9d5ff', face: [0.5, 0.35], pan: [0.3, 0.4], zoom: 1.8 },
            { card: 'Adamancipator Risen - Tiamite', title: 'Tiamite', color: '#a78bfa', face: [0.5, 0.4], pan: [0.35, 0.45], zoom: 1.8 },
            { card: 'Adamancipator Mates', title: 'Mates', color: '#86efac', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 }
        ]
    };

    window.LoreReelData['fa'] = {
        kind: 'trail',
        label: 'The F.A. art trail',
        stops: [
            { card: 'F.A. Sonic Meister', title: 'Sonic Meister', color: '#7dd3fc', face: [0.5, 0.55], pan: [0.4, 0.55], zoom: 1.8 },
            { card: 'F.A. Pit Stop', title: 'Pit stop', color: '#fb923c', face: [0.5, 0.5], pan: [0.4, 0.55], zoom: 1.6 },
            { card: 'F.A. Downforce', title: 'Downforce', color: '#a78bfa', face: [0.5, 0.3], pan: [0.3, 0.5], zoom: 1.8 },
            { card: 'F.A. City Grand Prix', title: 'City GP', color: '#67e8f9', face: [0.62, 0.25], pan: [0.3, 0.4], zoom: 1.6 },
            { card: 'F.A. Circuit Grand Prix', title: 'Circuit GP', color: '#34d399', face: [0.5, 0.6], pan: [0.45, 0.6], zoom: 1.6 },
            { card: 'F.A. Off-Road Grand Prix', title: 'Off-Road GP', color: '#fbbf24', face: [0.6, 0.6], pan: [0.45, 0.6], zoom: 1.6 },
            { card: 'F.A. Dawn Dragster', title: 'Dawn Dragster', color: '#fde68a', face: [0.5, 0.5], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'F.A. Test Run', title: 'Test run', color: '#bae6fd', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'F.A. Dead Heat', title: 'Dead heat', color: '#f472b6', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'F.A. Overheat', title: 'Overheat', color: '#ef4444', face: [0.5, 0.45], pan: [0.35, 0.55], zoom: 1.6 },
            { card: 'F.A. Winners', title: 'Winners', color: '#fcd34d', face: [0.5, 0.42], pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['abyss-actor'] = {
        kind: 'trail',
        label: 'The Abyss Actor art trail',
        stops: [
            { card: 'Abyss Playhouse - Fantastic Theater', title: 'The theater', color: '#c084fc', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'Abyss Actor - Superstar', title: 'Superstar', color: '#fde68a', face: [0.5, 0.2], pan: [0.4, 0.2] },
            { card: 'Abyss Actor - Leading Lady', title: 'Leading Lady', color: '#f472b6', face: [0.6, 0.3], pan: [0.3, 0.4] },
            { card: 'Abyss Actor - Evil Heel', title: 'Evil Heel', color: '#818cf8', face: [0.55, 0.25], pan: [0.25, 0.35] },
            { card: 'Abyss Actor - Funky Comedian', title: 'Funky Comedian', color: '#bef264', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Abyss Actors Back Stage', title: 'Back stage', color: '#a78bfa', face: [0.5, 0.35], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Abyss Actors\' Dress Rehearsal', title: 'Dress rehearsal', color: '#f9a8d4', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 },
            { card: 'Abyss Actor - Extras', title: 'Extras', color: '#5eead4', face: [0.5, 0.2], pan: [0.25, 0.35], zoom: 1.8 },
            { card: 'Abyss Actor - Wild Hope', title: 'Wild Hope', color: '#fbbf24', face: [0.55, 0.2], pan: [0.25, 0.4] },
            { card: 'Abyss Actors\' Curtain Call', title: 'Curtain call', color: '#e879f9', face: [0.5, 0.4], pan: [0.3, 0.5], zoom: 1.6 }
        ]
    };

    window.LoreReelData['goblin'] = {
        kind: 'trail',
        label: 'The Goblin art trail',
        stops: [
            { card: 'Goblin of Greed', title: 'Goblin of Greed', color: '#fb923c', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Peeking Goblin', title: 'The vault', color: '#94a3b8', face: [0.3, 0.4], pan: [0.4, 0.45] },
            { card: 'Goblin Thief', title: 'The thief', color: '#86efac', face: [0.65, 0.35], pan: [0.35, 0.4] },
            { card: 'Upstart Goblin', title: 'The upstart', color: '#c084fc', face: [0.3, 0.2], pan: [0.25, 0.4] },
            { card: 'Goblin Circus', title: 'The circus', color: '#fbbf24', face: [0.45, 0.2], pan: [0.3, 0.4] },
            { card: 'Goblin Attack Force', title: 'Attack Force', color: '#4ade80', face: [0.55, 0.35], pan: [0.3, 0.4] },
            { card: 'Goblin Marauding Squad', title: 'Marauders', color: '#a3e635', face: [0.4, 0.25], pan: [0.3, 0.4] },
            { card: 'Goblindbergh', title: 'Goblindbergh', color: '#f87171', face: [0.6, 0.3], pan: [0.3, 0.4] },
            { card: 'Gogogo Goblindbergh', title: 'Gogogo', color: '#7dd3fc', face: [0.4, 0.5], pan: [0.35, 0.5] },
            { card: 'Second Goblin', title: 'Second', color: '#fde68a', face: [0.5, 0.2], pan: [0.3, 0.4] },
            { card: 'Goblin Calligrapher', title: 'Calligrapher', color: '#c4b5fd', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Goblin Biker Big Gabonga', title: 'Goblin Bikers', color: '#f97316', face: [0.5, 0.35], pan: [0.3, 0.45], zoom: 1.8 }
        ]
    };



    window.LoreReelData['kozmo'] = {
        kind: 'trail',
        label: 'The Kozmo art trail',
        stops: [
            { card: 'Kozmo Farmgirl', title: 'Farmgirl', color: '#fdba74', face: [0.52, 0.12], pan: [0.35, 0.15] },
            { card: 'Kozmo Strawman', title: 'Strawman', color: '#fde68a', face: [0.55, 0.08], pan: [0.35, 0.2] },
            { card: 'Kozmo Tincan', title: 'Tincan', color: '#d1d5db', face: [0.4, 0.3], pan: [0.35, 0.35] },
            { card: 'Kozmo Scaredy Lion', title: 'Scaredy Lion', color: '#fb923c', face: [0.4, 0.25], pan: [0.3, 0.3] },
            { card: 'Kozmo Sliprider', title: 'Sliprider', color: '#f87171', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Kozmo Forerunner', title: 'Forerunner', color: '#7dd3fc', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Kozmo Goodwitch', title: 'Goodwitch', color: '#fef08a', face: [0.5, 0.15], pan: [0.3, 0.2] },
            { card: 'Kozmo Lightsword', title: 'Lightsword', color: '#a3e635', face: [0.5, 0.2], pan: [0.3, 0.3] },
            { card: 'Kozmoll Dark Lady', title: 'Dark Lady', color: '#e879f9', face: [0.5, 0.18], pan: [0.3, 0.2] },
            { card: 'Kozmo Landwalker', title: 'Landwalker', color: '#fcd34d', face: [0.5, 0.4], pan: [0.35, 0.55], zoom: 1.6 },
            { card: 'Kozmojo', title: 'Kozmojo', color: '#a78bfa', face: [0.35, 0.15], pan: [0.3, 0.3] },
            { card: 'Kozmourning', title: 'Kozmourning', color: '#e5e7eb', face: [0.3, 0.62], pan: [0.2, 0.5] }
        ]
    };

    window.LoreReelData['fur-hire'] = {
        kind: 'trail',
        label: 'The Fur Hire art trail',
        stops: [
            { card: 'Mayhem Fur Hire', title: 'Mayhem', color: '#fbbf24', face: [0.5, 0.4], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Rafale, Champion Fur Hire', title: 'Rafale', color: '#fca5a5', face: [0.8, 0.43], pan: [0.25, 0.42] },
            { card: 'Training Fur Hire, Fur All Your Training Needs', title: 'Training', color: '#86efac', face: [0.5, 0.3], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'Beat, Bladesman Fur Hire', title: 'Beat', color: '#c4b5fd', face: [0.45, 0.25], pan: [0.3, 0.3] },
            { card: 'Rookie Fur Hire', title: 'Rookie', color: '#fde68a', face: [0.4, 0.3], pan: [0.3, 0.4], zoom: 1.8 },
            { card: 'Whirlwind Fur Hire', title: 'Whirlwind', color: '#5eead4', face: [0.6, 0.3], pan: [0.3, 0.4] },
            { card: 'Helmer, Helmsman Fur Hire', title: 'Helmer', color: '#93c5fd', face: [0.65, 0.25], pan: [0.3, 0.3] },
            { card: 'Filo, Messenger Fur Hire', title: 'Filo', color: '#fcd34d', face: [0.35, 0.3], pan: [0.3, 0.35] },
            { card: 'Rex, Ride Fur Hire', title: 'Rex', color: '#f97316', face: [0.4, 0.25], pan: [0.3, 0.35] },
            { card: 'Furtive Techniques Fur Hire, Fur All Your Ultimate Moves', title: 'Old rivals', color: '#fb7185', face: [0.5, 0.2], pan: [0.3, 0.35] },
            { card: 'Fandora, the Flying Fighting Furtress', title: 'The upgrade', color: '#bae6fd', face: [0.5, 0.4], pan: [0.35, 0.45], zoom: 1.6 }
        ]
    };

    window.LoreReelData['spyral'] = {
        kind: 'trail',
        label: 'The SPYRAL art trail',
        stops: [
            { card: 'SPYRAL Resort', title: 'The Resort', color: '#7dd3fc', face: [0.7, 0.3], pan: [0.3, 0.45], zoom: 1.6 },
            { card: 'SPYRAL Super Agent', title: 'Super Agent', color: '#fcd34d', face: [0.6, 0.12], pan: [0.3, 0.2] },
            { card: 'SPYRAL GEAR - Big Red', title: 'Big Red', color: '#ef4444', face: [0.5, 0.5], pan: [0.4, 0.5], zoom: 1.6 },
            { card: 'SPYRAL MISSION - Assault', title: 'Assault', color: '#f97316', face: [0.62, 0.15], pan: [0.2, 0.3] },
            { card: 'SPYRAL MISSION - Recapture', title: 'Recapture', color: '#fde68a', face: [0.45, 0.42], pan: [0.25, 0.4] },
            { card: 'SPYRAL Sleeper', title: 'Sleeper', color: '#a78bfa', face: [0.45, 0.25], pan: [0.3, 0.3] },
            { card: 'SPYRAL MISSION - Rescue', title: 'Rescue', color: '#60a5fa', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'SPYRAL GEAR - Fully Armed', title: 'Fully Armed', color: '#fbbf24', face: [0.55, 0.1], pan: [0.25, 0.35] },
            { card: 'SPYRAL Double Helix', title: 'Double Helix', color: '#c4b5fd', face: [0.72, 0.3], pan: [0.2, 0.3] },
            { card: 'SPYRAL Double Agent', title: 'Double Agent', color: '#e5e7eb', face: [0.55, 0.18], pan: [0.3, 0.25] }
        ]
    };


    window.LoreReelData['punk'] = {
        kind: 'trail',
        label: 'The P.U.N.K. art trail',
        stops: [
            { card: 'Ukiyoe-P.U.N.K. Sharakusai', title: 'Sharakusai', color: '#c084fc', face: [0.5, 0.2], pan: [0.3, 0.25] },
            { card: 'Ukiyoe-P.U.N.K. Amazing Dragon', title: 'Amazing Dragon', color: '#f472b6', face: [0.5, 0.2], pan: [0.3, 0.4] },
            { card: 'Gagaku-P.U.N.K. Wa Gon', title: 'Wa Gon', color: '#fbbf24', face: [0.45, 0.12], pan: [0.3, 0.2] },
            { card: 'Gagaku-P.U.N.K. Crash Beat', title: 'Crash Beat', color: '#fcd34d', face: [0.5, 0.62], pan: [0.4, 0.6] },
            { card: 'Joruri-P.U.N.K. Madame Spider', title: 'Madame Spider', color: '#a78bfa', face: [0.45, 0.12], pan: [0.3, 0.2] },
            { card: 'Joruri-P.U.N.K. Dangerous Gabu', title: 'Dangerous Gabu', color: '#f87171', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Noh-P.U.N.K. Ze Amin', title: 'Ze Amin', color: '#5eead4', face: [0.45, 0.25], pan: [0.3, 0.3] },
            { card: 'Noh-P.U.N.K. Deer Note', title: 'Deer Note', color: '#86efac', face: [0.35, 0.2], pan: [0.3, 0.25] },
            { card: 'P.U.N.K. JAM Dragon Drive', title: 'Dragon Drive', color: '#f0abfc', face: [0.5, 0.25], pan: [0.3, 0.4], zoom: 1.8 },
            { card: 'P.U.N.K. JAM Extreme Session', title: 'Extreme Session', color: '#7dd3fc', face: [0.3, 0.3], pan: [0.35, 0.45], zoom: 1.8 },
            { card: 'Noh-P.U.N.K. Rising Scale', title: 'Rising Scale', color: '#fde68a', face: [0.5, 0.2], pan: [0.3, 0.35] },
            { card: 'P.U.N.K. JAM FEVER!', title: 'JAM FEVER', color: '#fb7185', face: [0.4, 0.3], pan: [0.35, 0.45], zoom: 1.8 }
        ]
    };

    window.LoreReelData['libromancer'] = {
        kind: 'trail',
        label: 'The Libromancer art trail',
        stops: [
            { card: 'Libromancer Geek Boy', title: 'The boy', color: '#fca5a5', face: [0.42, 0.35], pan: [0.35, 0.4] },
            { card: 'Libromancer Magigirl', title: 'The girl', color: '#bef264', face: [0.4, 0.2], pan: [0.3, 0.25] },
            { card: 'Libromancer First Appearance', title: 'First appearance', color: '#fb923c', face: [0.35, 0.12], pan: [0.3, 0.4] },
            { card: 'Libromancer Firestarter', title: 'Firestarter', color: '#ef4444', face: [0.5, 0.2], pan: [0.3, 0.25] },
            { card: 'Libromancer Agent', title: 'The Agent', color: '#94a3b8', face: [0.55, 0.2], pan: [0.3, 0.3] },
            { card: 'Libromancer Doombroker', title: 'Doombroker', color: '#dc2626', face: [0.6, 0.2], pan: [0.3, 0.3] },
            { card: 'Libromancer Intervention', title: 'Intervention', color: '#60a5fa', face: [0.8, 0.35], pan: [0.35, 0.45] },
            { card: 'Libromancer Realized', title: 'Realized', color: '#fde68a', face: [0.62, 0.32], pan: [0.3, 0.4] },
            { card: 'Libromancer Fire', title: 'Fire', color: '#f87171', face: [0.5, 0.2], pan: [0.3, 0.3] },
            { card: 'Libromancer Bonded', title: 'Bonded', color: '#fdba74', face: [0.72, 0.25], pan: [0.3, 0.35] },
            { card: 'Libromancer Mystigirl', title: 'Mystigirl', color: '#86efac', face: [0.45, 0.2], pan: [0.3, 0.25] },
            { card: 'Libromancer Prevented', title: 'Prevented', color: '#a78bfa', face: [0.5, 0.3], pan: [0.35, 0.4] }
        ]
    };

    window.LoreReelData['duston'] = {
        kind: 'trail',
        label: 'The Duston art trail',
        stops: [
            { card: 'House Duston', title: 'At home', color: '#f9a8d4', face: [0.45, 0.55], pan: [0.3, 0.6], zoom: 1.8 },
            { card: 'Red Duston', title: 'Red', color: '#f87171', face: [0.4, 0.35], pan: [0.35, 0.4] },
            { card: 'Green Duston', title: 'Green', color: '#86efac', face: [0.45, 0.3], pan: [0.3, 0.4] },
            { card: 'White Duston', title: 'White', color: '#e5e7eb', face: [0.45, 0.55], pan: [0.4, 0.55] },
            { card: 'Yellow Duston', title: 'Yellow', color: '#fde047', face: [0.5, 0.4], pan: [0.35, 0.4] },
            { card: 'Duston Roller', title: 'The roller', color: '#fcd34d', face: [0.4, 0.55], pan: [0.3, 0.55], zoom: 1.6 },
            { card: 'Magicalized Duston Mop', title: 'The mop', color: '#c4b5fd', face: [0.35, 0.7], pan: [0.4, 0.65], zoom: 1.6 },
            { card: 'Starduston', title: 'Starduston', color: '#a78bfa', face: [0.45, 0.45], pan: [0.35, 0.45] }
        ]
    };

    window.LoreReelData['war-rock'] = {
        kind: 'trail',
        label: 'The War Rock art trail',
        stops: [
            { card: 'War Rock Ordeal', title: 'The ordeal', color: '#fb923c', face: [0.6, 0.15], pan: [0.2, 0.5] },
            { card: 'War Rock Fortia', title: 'Fortia', color: '#fca5a5', face: [0.5, 0.15], pan: [0.3, 0.2] },
            { card: 'War Rock Skyler', title: 'Skyler', color: '#f87171', face: [0.47, 0.15], pan: [0.2, 0.17] },
            { card: 'War Rock Spirit', title: 'Spirit', color: '#86efac', face: [0.62, 0.15], pan: [0.2, 0.22] },
            { card: 'War Rock Wento', title: 'Wento', color: '#bef264', face: [0.37, 0.12], pan: [0.2, 0.17] },
            { card: 'War Rock Big Blow', title: 'Big Blow', color: '#a8a29e', face: [0.55, 0.2], pan: [0.25, 0.4] },
            { card: 'War Rock Meteoragon', title: 'Meteoragon', color: '#ef4444', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'War Rock Dignity', title: 'Dignity', color: '#f97316', face: [0.35, 0.6], pan: [0.4, 0.6] },
            { card: 'War Rock Bashileos', title: 'Bashileos', color: '#fbbf24', face: [0.4, 0.2], pan: [0.25, 0.35] },
            { card: 'War Rock Generations', title: 'Generations', color: '#fde68a', face: [0.25, 0.25], pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['yummy'] = {
        kind: 'trail',
        label: 'The Yummy art trail',
        stops: [
            { card: 'Yummyusment☆Mignon', title: 'The garden', color: '#f9a8d4', face: [0.5, 0.5], pan: [0.3, 0.6], zoom: 1.6 },
            { card: 'Cupsy☆Yummy', title: 'Cupsy', color: '#fda4af', face: [0.45, 0.4], pan: [0.35, 0.45] },
            { card: 'Cooky☆Yummy', title: 'Cooky', color: '#fcd34d', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Lollipo☆Yummy', title: 'Lollipo', color: '#86efac', face: [0.4, 0.4], pan: [0.35, 0.45] },
            { card: 'Marshmao☆Yummy', title: 'Marshmao', color: '#e5e7eb', face: [0.45, 0.35], pan: [0.3, 0.45] },
            { card: 'Yummy★Snatchy', title: 'Snatchy', color: '#a5f3fc', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Yummy★Redemption', title: 'Redemption', color: '#fb923c', face: [0.6, 0.45], pan: [0.35, 0.5] },
            { card: 'Yummy☆Surprise', title: 'Surprise', color: '#bef264', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Yummyusment★Acroquey', title: 'Acroquey', color: '#fde68a', face: [0.3, 0.5], pan: [0.35, 0.5] },
            { card: 'Assist★Yummy!', title: 'Assist', color: '#c4b5fd', face: [0.5, 0.5], pan: [0.3, 0.55] },
            { card: 'Yum☆Yum☆Yummys', title: 'The crane game', color: '#f0abfc', face: [0.5, 0.45], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['magikey'] = {
        kind: 'trail',
        label: 'The Magikey art trail',
        stops: [
            { card: 'Clavkiys, the Magikey Skyblaster', title: 'Clavkiys', color: '#fde68a', face: [0.4, 0.15], pan: [0.3, 0.25] },
            { card: 'Magikey Maftea', title: 'Maftea', color: '#a5b4fc', face: [0.4, 0.4], pan: [0.35, 0.45] },
            { card: 'Magikey World', title: 'The doors', color: '#818cf8', face: [0.4, 0.5], pan: [0.35, 0.5], zoom: 1.8 },
            { card: 'Maginificent Magikey Mafteal', title: 'Mafteal', color: '#6366f1', face: [0.55, 0.2], pan: [0.25, 0.35] },
            { card: 'Magikey Mechmusket - Batosbuster', title: 'Batosbuster', color: '#fbbf24', face: [0.55, 0.15], pan: [0.3, 0.4] },
            { card: 'Magikey Dragon - Andrabime', title: 'Andrabime', color: '#86efac', face: [0.55, 0.25], pan: [0.3, 0.4] },
            { card: 'Magikey Spirit - Vepartu', title: 'Vepartu', color: '#7dd3fc', face: [0.45, 0.2], pan: [0.3, 0.3] },
            { card: 'Magikey Fiend - Transfurlmine', title: 'Transfurlmine', color: '#ef4444', face: [0.4, 0.2], pan: [0.3, 0.3] },
            { card: 'Magikey Battle', title: 'The battle', color: '#c4b5fd', face: [0.2, 0.35], pan: [0.35, 0.45] },
            { card: 'Magikey Locking', title: 'Locking', color: '#a78bfa', face: [0.55, 0.3], pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['salamangreat'] = {
        kind: 'trail',
        label: 'The Salamangreat art trail',
        stops: [
            { card: 'Salamangreat Sanctuary', title: 'Sanctuary', color: '#fb923c', face: [0.5, 0.6], pan: [0.3, 0.6], zoom: 1.6 },
            { card: 'Salamangreat Heatleo', title: 'Heatleo', color: '#fbbf24', face: [0.5, 0.2], pan: [0.3, 0.3] },
            { card: 'Will of the Salamangreat', title: 'Will', color: '#f97316', face: [0.5, 0.4], pan: [0.3, 0.45] },
            { card: 'Salamangreat Charge', title: 'Charge', color: '#f87171', face: [0.45, 0.4], pan: [0.3, 0.5] },
            { card: 'Salamangreat Gift', title: 'Gift', color: '#fdba74', face: [0.45, 0.35], pan: [0.3, 0.45] },
            { card: 'Salamangreat Recureance', title: 'Recureance', color: '#5eead4', face: [0.35, 0.65], pan: [0.4, 0.6] },
            { card: 'Salamangreat Rage', title: 'Rage', color: '#ef4444', face: [0.5, 0.25], pan: [0.25, 0.45] },
            { card: 'Rise of the Salamangreat', title: 'Rise', color: '#a3e635', face: [0.5, 0.2], pan: [0.3, 0.55], zoom: 1.8 },
            { card: 'Salamangreat Roar', title: 'Roar', color: '#fde68a', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Salamangreat Raging Phoenix', title: 'Raging Phoenix', color: '#dc2626', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Salamangreat Transcendence', title: 'Transcen\u00ADdence', color: '#fef08a', face: [0.5, 0.45], pan: [0.35, 0.5] }
        ]
    };

    window.LoreReelData['ancient-warriors'] = {
        kind: 'trail',
        label: 'The Ancient Warriors art trail',
        stops: [
            { card: 'Ancient Warriors Saga - Deception and Betrayal', title: 'Betrayal', color: '#f87171', face: [0.3, 0.3], pan: [0.3, 0.4] },
            { card: 'Ancient Warriors - Savage Don Ying', title: 'Don Ying', color: '#a855f7', face: [0.45, 0.2], pan: [0.25, 0.35] },
            { card: 'Ancient Warriors - Rebellious Lu Feng', title: 'Lu Feng', color: '#fb7185', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Ancient Warriors Saga - Chivalrous Path', title: 'Chivalrous Path', color: '#86efac', face: [0.55, 0.3], pan: [0.3, 0.45] },
            { card: 'Ancient Warriors - Loyal Guan Yun', title: 'Guan Yun', color: '#4ade80', face: [0.5, 0.15], pan: [0.25, 0.3] },
            { card: 'Ancient Warriors Saga - Three Visits', title: 'Three Visits', color: '#bef264', face: [0.85, 0.25], pan: [0.25, 0.4] },
            { card: 'Ancient Warriors - Valiant Zhang De', title: 'Zhang De', color: '#fbbf24', face: [0.3, 0.15], pan: [0.25, 0.3] },
            { card: 'Ancient Warriors Saga - Defense of Changban', title: 'Changban', color: '#ef4444', face: [0.5, 0.25], pan: [0.3, 0.35] },
            { card: 'Ancient Warriors - Ingenious Zhuge Kong', title: 'Zhuge Kong', color: '#bae6fd', face: [0.5, 0.15], pan: [0.25, 0.3] },
            { card: 'Ancient Warriors Saga - Sun-Liu Alliance', title: 'The alliance', color: '#fcd34d', face: [0.55, 0.35], pan: [0.3, 0.45] },
            { card: 'Ancient Warriors Oath - Double Dragon Lords', title: 'Double Dragon', color: '#fde68a', face: [0.4, 0.2], pan: [0.25, 0.35] }
        ]
    };

    window.LoreReelData['vaalmonica'] = {
        kind: 'trail',
        label: 'The Vaalmonica art trail',
        stops: [
            { card: 'Vaalmonica Invitare', title: 'The invitation', color: '#c4b5fd', face: [0.5, 0.3], pan: [0.3, 0.5] },
            { card: 'Selettrice Vaalmonica', title: 'Selettrice', color: '#e9d5ff', face: [0.45, 0.2], pan: [0.3, 0.25] },
            { card: 'Vaalmonica Scelta', title: 'The choice', color: '#f0abfc', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Angello Vaalmonica', title: 'Angello', color: '#fef3c7', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Dimonno Vaalmonica', title: 'Dimonno', color: '#818cf8', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Vaalmonica, the Agathokakological Voice', title: 'The Voice', color: '#a5f3fc', face: [0.5, 0.5], pan: [0.35, 0.5], zoom: 1.6 },
            { card: 'Vaalmonica Intonare', title: 'Angel\'s glass', color: '#fde68a', face: [0.65, 0.2], pan: [0.25, 0.35] },
            { card: 'Vaalmonica Versare', title: 'Demon\'s glass', color: '#a78bfa', face: [0.4, 0.2], pan: [0.25, 0.4] },
            { card: 'Zebufera, Vaalmonican Hallow Heathen', title: 'Zebufera', color: '#6366f1', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Duralume, Vaalmonican Heathen Hallow', title: 'Duralume', color: '#fef08a', face: [0.5, 0.4], pan: [0.3, 0.45] }
        ]
    };



    window.LoreReelData['morphtronic'] = {
        kind: 'trail',
        label: 'The Morphtronic art trail',
        stops: [
            { card: 'Morphtronic Celfon', title: 'Celfon', color: '#fcd34d', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Morphtronic Map', title: 'The map', color: '#d6d3d1', face: [0.5, 0.55], pan: [0.4, 0.6], zoom: 1.8 },
            { card: 'Morphtronic Clocken', title: 'Clocken', color: '#e5e7eb', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Morphtronic Boarden', title: 'Boarden', color: '#7dd3fc', face: [0.5, 0.2], pan: [0.3, 0.35] },
            { card: 'Morphtronic Mix-up', title: 'Mix-up', color: '#fb923c', face: [0.45, 0.2], pan: [0.3, 0.45] },
            { card: 'Morphtronics, Scramble!', title: 'Scramble!', color: '#f9a8d4', face: [0.45, 0.4], pan: [0.35, 0.5] },
            { card: 'Morphtronic Remoten', title: 'Remoten', color: '#fef3c7', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Morphtronic Magnen', title: 'Magnen', color: '#60a5fa', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Morphtronic Boomboxen', title: 'Boomboxen', color: '#f87171', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Morphtronic Slingen', title: 'Slingen', color: '#c4b5fd', face: [0.4, 0.25], pan: [0.3, 0.4] },
            { card: 'Morphtronic Scannen', title: 'Scannen', color: '#fde68a', face: [0.5, 0.55], pan: [0.35, 0.5] },
            { card: 'Morphtronic Smartfon', title: 'Smartfon', color: '#86efac', face: [0.5, 0.2], pan: [0.3, 0.35] }
        ]
    };

    window.LoreReelData['gagaga'] = {
        kind: 'trail',
        label: 'The Gagaga art trail',
        stops: [
            { card: 'Gagaga Magician', title: 'Magician', color: '#a78bfa', face: [0.5, 0.15], pan: [0.2, 0.3] },
            { card: 'Gagaga Child', title: 'Child', color: '#fca5a5', face: [0.4, 0.2], pan: [0.25, 0.35] },
            { card: 'Gagaga Girl', title: 'Girl', color: '#f9a8d4', face: [0.5, 0.2], pan: [0.2, 0.25] },
            { card: 'Gagagaguard', title: 'Gagagaguard', color: '#7dd3fc', face: [0.5, 0.4], pan: [0.3, 0.45] },
            { card: 'Gagagatag', title: 'Gagagatag', color: '#fb923c', face: [0.5, 0.4], pan: [0.3, 0.45] },
            { card: 'Gagagadraw', title: 'Gagagadraw', color: '#f472b6', face: [0.7, 0.25], pan: [0.25, 0.4] },
            { card: 'Gagaga Caesar', title: 'Caesar', color: '#e5e7eb', face: [0.5, 0.15], pan: [0.2, 0.3] },
            { card: 'Gagagarevenge', title: 'Revenge', color: '#fbbf24', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Gagagarush', title: 'Rush', color: '#fde68a', face: [0.55, 0.3], pan: [0.3, 0.4] },
            { card: 'Gagaga Utopic Tactics', title: 'Utopic Tactics', color: '#fef08a', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Gagaga Ganbara Knight', title: 'Ganbara Knight', color: '#86efac', face: [0.45, 0.3], pan: [0.3, 0.35] }
        ]
    };

    window.LoreReelData['cyberdark'] = {
        kind: 'trail',
        label: 'The Cyberdark art trail',
        stops: [
            { card: 'Cyberdark Realm', title: 'The realm', color: '#a5b4fc', face: [0.5, 0.55], pan: [0.35, 0.55], zoom: 1.8 },
            { card: 'Cyberdark Horn', title: 'Horn', color: '#fbbf24', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Cyberdark Edge', title: 'Edge', color: '#c4b5fd', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Cyberdark Keel', title: 'Keel', color: '#86efac', face: [0.3, 0.3], pan: [0.3, 0.5] },
            { card: 'Cyberdark Impact!', title: 'Impact', color: '#e879f9', face: [0.5, 0.3], pan: [0.3, 0.5] },
            { card: 'Cyberdark Dragon', title: 'The Dragon', color: '#f87171', face: [0.55, 0.35], pan: [0.3, 0.4] },
            { card: 'Cyberdark Invasion', title: 'Invasion', color: '#dc2626', face: [0.6, 0.2], pan: [0.25, 0.5] },
            { card: 'Cyberdark Inferno', title: 'Inferno', color: '#fb923c', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Cyberdarkness Dragon', title: 'Cyberdarkness', color: '#94a3b8', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Cyberdark End Dragon', title: 'End Dragon', color: '#fde68a', face: [0.45, 0.2], pan: [0.25, 0.4] }
        ]
    };

    window.LoreReelData['dark-world'] = {
        kind: 'trail',
        label: 'The Dark World art trail',
        stops: [
            { card: 'Gateway to Dark World', title: 'The gateway', color: '#a78bfa', face: [0.3, 0.25], pan: [0.25, 0.5] },
            { card: 'Renge, Gatekeeper of Dark World', title: 'Renge', color: '#fb923c', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Broww, Huntsman of Dark World', title: 'Broww', color: '#d6d3d1', face: [0.45, 0.15], pan: [0.2, 0.35] },
            { card: 'Scarr, Scout of Dark World', title: 'Scarr', color: '#ef4444', face: [0.6, 0.2], pan: [0.25, 0.35] },
            { card: 'The Forces of Darkness', title: 'Tag team', color: '#c084fc', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Sillva, Warlord of Dark World', title: 'Sillva', color: '#e5e7eb', face: [0.55, 0.15], pan: [0.2, 0.3] },
            { card: 'Gren, Tactician of Dark World', title: 'Gren', color: '#86efac', face: [0.4, 0.15], pan: [0.2, 0.3] },
            { card: 'Brron, Mad King of Dark World', title: 'Brron', color: '#bef264', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Zure, Knight of Dark World', title: 'Zure', color: '#93c5fd', face: [0.5, 0.15], pan: [0.2, 0.3] },
            { card: 'Goldd, Wu-Lord of Dark World', title: 'Goldd', color: '#fcd34d', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Reign-Beaux, Overlord of Dark World', title: 'Reign-Beaux', color: '#a8a29e', face: [0.5, 0.2], pan: [0.25, 0.35] },
            { card: 'Grapha, Dragon Lord of Dark World', title: 'Grapha', color: '#7c3aed', face: [0.6, 0.25], pan: [0.25, 0.4] }
        ]
    };

    window.LoreReelData['impcantation'] = {
        kind: 'trail',
        label: 'The Impcantation art trail',
        stops: [
            { card: 'Impcantation Thanatosis', title: 'The room', color: '#c084fc', face: [0.5, 0.55], pan: [0.3, 0.6], zoom: 1.6 },
            { card: 'Impcantation Candoll', title: 'Candoll', color: '#fb923c', face: [0.5, 0.2], pan: [0.2, 0.75] },
            { card: 'Impcantation Talismandra', title: 'Talismandra', color: '#fde68a', face: [0.5, 0.2], pan: [0.25, 0.45] },
            { card: 'Impcantation Bookstone', title: 'Bookstone', color: '#93c5fd', face: [0.5, 0.4], pan: [0.3, 0.45] },
            { card: 'Impcantation Penciplume', title: 'Penciplume', color: '#e5e7eb', face: [0.6, 0.25], pan: [0.3, 0.4] },
            { card: 'Impcantation Inception', title: 'Inception', color: '#86efac', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Impcantation Chalislime', title: 'Chalislime', color: '#4ade80', face: [0.5, 0.25], pan: [0.25, 0.45] },
            { card: 'Crealtar, the Impcantation Originator', title: 'Crealtar', color: '#ef4444', face: [0.5, 0.2], pan: [0.25, 0.55] }
        ]
    };

    window.LoreReelData['trickstar'] = {
        kind: 'trail',
        label: 'The Trickstar art trail',
        stops: [
            { card: 'Trickstar Light Stage', title: 'On stage', color: '#f9a8d4', face: [0.5, 0.25], pan: [0.25, 0.4], zoom: 1.8 },
            { card: 'Trickstar Candina', title: 'Candina', color: '#fde047', face: [0.45, 0.18], pan: [0.18, 0.25] },
            { card: 'Trickstar Lilybell', title: 'Lilybell', color: '#f0abfc', face: [0.5, 0.2], pan: [0.18, 0.25] },
            { card: 'Trickstar Lycoris', title: 'Lycoris', color: '#f87171', face: [0.5, 0.2], pan: [0.18, 0.25] },
            { card: 'Trickstar Holly Angel', title: 'Holly Angel', color: '#bae6fd', face: [0.4, 0.18], pan: [0.18, 0.25] },
            { card: 'Trickstar Light Arena', title: 'The crowd', color: '#fef08a', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Trickstar Black Catbat', title: 'Black Catbat', color: '#a78bfa', face: [0.35, 0.15], pan: [0.18, 0.25] },
            { card: 'Trickstar Narkissus', title: 'Narkissus', color: '#86efac', face: [0.5, 0.15], pan: [0.18, 0.25] },
            { card: 'Trickstar Reincarnation', title: 'Reincarnation', color: '#fb7185', face: [0.45, 0.3], pan: [0.3, 0.45] },
            { card: 'Trickstar Festival', title: 'Festival', color: '#fda4af', face: [0.3, 0.3], pan: [0.25, 0.4] },
            { card: 'Trickstar Live Stage', title: 'Live stage', color: '#fcd34d', face: [0.5, 0.5], pan: [0.35, 0.55], zoom: 1.6 }
        ]
    };

    window.LoreReelData['gold-pride'] = {
        kind: 'roster',
        label: 'Gold Pride Grand Prix entrants',
        people: [
            {
                name: 'Leon', tag: 'No. 11', color: '#fcd34d', forms: [
                    { card: 'Gold Pride - Leon', face: [0.3, 0.25], pan: [0.3, 0.4] },
                    { card: 'Gold Pride - Star Leon', as: 'Star Leon', face: [0.4, 0.35], pan: [0.3, 0.45] }
                ]
            },
            {
                name: 'Nytro Head', tag: 'No. 108', color: '#fb923c', forms: [
                    { card: 'Gold Pride - Nytro Head', face: [0.4, 0.35], pan: [0.3, 0.45] },
                    { card: 'Gold Pride - Nytro Blaster', as: 'Nytro Blaster', face: [0.4, 0.3], pan: [0.3, 0.4] }
                ]
            },
            {
                name: 'Roller Baller', tag: 'No. 573', color: '#86efac', forms: [
                    { card: 'Gold Pride - Roller Baller', face: [0.5, 0.3], pan: [0.25, 0.4] },
                    { card: 'Gold Pride - Pin Baller', as: 'Pin Baller', face: [0.5, 0.45], pan: [0.35, 0.5] }
                ]
            },
            {
                name: 'Captain Carrie', tag: 'No. 332', color: '#f9a8d4', forms: [
                    { card: 'Gold Pride - Captain Carrie', face: [0.45, 0.15], pan: [0.18, 0.25] },
                    { card: 'Gold Pride - Chariot Carrie', as: 'Chariot Carrie', face: [0.5, 0.4], pan: [0.3, 0.45] }
                ]
            },
            {
                name: 'Eliminator', tag: 'No. 999', color: '#a78bfa', forms: [
                    { card: 'Gold Pride - Eliminator', face: [0.5, 0.35], pan: [0.3, 0.45] },
                    { card: 'Gold Pride - Eradicator', as: 'Eradicator', face: [0.5, 0.3], pan: [0.3, 0.4] }
                ]
            },
            {
                name: 'The race', color: '#fde68a', forms: [
                    { card: 'Gold Pride - Start Your Engines!', as: 'Start', face: [0.5, 0.4], pan: [0.3, 0.5] },
                    { card: 'Gold Pride - Pedal to the Metal!', as: 'Pedal to the Metal', face: [0.5, 0.5], pan: [0.35, 0.5] },
                    { card: 'Gold Pride - That Came Out of Nowhere!', as: 'Out of Nowhere', face: [0.6, 0.4], pan: [0.3, 0.45] },
                    { card: 'Gold Pride - The Crowd Goes Wild!', as: 'The Crowd', face: [0.4, 0.35], pan: [0.3, 0.45] },
                    { card: 'Gold Pride - It\'s Neck and Neck!', as: 'Neck and Neck', face: [0.5, 0.4], pan: [0.3, 0.45] },
                    { card: 'Gold Pride - Better Luck Next Time!', as: 'Better Luck', face: [0.6, 0.5], pan: [0.35, 0.5] }
                ]
            }
        ]
    };

    window.LoreReelData['six-samurai'] = {
        kind: 'roster',
        label: 'The Six Samurai, then and now',
        people: [
            {
                name: 'Shi En', group: 'The Legendary Six Samurai', color: '#f87171', forms: [
                    { card: 'Legendary Six Samurai - Shi En', face: [0.47, 0.15], pan: [0.4, 0.2] },
                    { card: 'Great Shogun Shien', as: 'Great Shogun', face: [0.5, 0.2], pan: [0.4, 0.2] },
                    { card: 'Tenkabito Shien', as: 'Tenkabito', face: [0.37, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Kizan', group: 'The Legendary Six Samurai', color: '#93c5fd', forms: [
                    { card: 'Legendary Six Samurai - Kizan', face: [0.5, 0.12], pan: [0.4, 0.15] },
                    { card: 'Grandmaster of the Six Samurai', as: 'Grandmaster', face: [0.5, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Enishi', group: 'The Legendary Six Samurai', color: '#86efac', forms: [
                    { card: 'Legendary Six Samurai - Enishi', face: [0.55, 0.22], pan: [0.4, 0.22] },
                    { card: 'Enishi, Shien\'s Chancellor', as: 'Chancellor', face: [0.4, 0.12], pan: [0.35, 0.15] }
                ]
            },
            {
                name: 'Kageki', group: 'The Legendary Six Samurai', color: '#fbbf24', forms: [
                    { card: 'Legendary Six Samurai - Kageki', face: [0.45, 0.3], pan: [0.45, 0.3] },
                    { card: 'Chamberlain of the Six Samurai', as: 'Chamberlain', face: [0.6, 0.25], pan: [0.4, 0.25] }
                ]
            },
            {
                name: 'Shinai', group: 'The Legendary Six Samurai', color: '#a78bfa', forms: [
                    { card: 'Legendary Six Samurai - Shinai', face: [0.5, 0.3], pan: [0.45, 0.3] },
                    { card: 'Spirit of the Six Samurai', as: 'Spirit', face: [0.5, 0.12], pan: [0.45, 0.15] }
                ]
            },
            {
                name: 'Mizuho', group: 'The Legendary Six Samurai', color: '#f9a8d4', forms: [
                    { card: 'Legendary Six Samurai - Mizuho', face: [0.62, 0.35], pan: [0.45, 0.35] },
                    { card: 'Hand of the Six Samurai', as: 'Hand', face: [0.62, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'The Six', group: 'The Six Samurai', color: '#fca5a5', forms: [
                    { card: 'The Six Samurai - Irou', as: 'Irou', face: [0.55, 0.12], pan: [0.4, 0.15] },
                    { card: 'The Six Samurai - Kamon', as: 'Kamon', face: [0.47, 0.22], pan: [0.4, 0.22] },
                    { card: 'The Six Samurai - Nisashi', as: 'Nisashi', face: [0.5, 0.15], pan: [0.4, 0.15] },
                    { card: 'The Six Samurai - Yariza', as: 'Yariza', face: [0.62, 0.12], pan: [0.4, 0.15] },
                    { card: 'The Six Samurai - Yaichi', as: 'Yaichi', face: [0.5, 0.15], pan: [0.4, 0.15] },
                    { card: 'The Six Samurai - Zanji', as: 'Zanji', face: [0.4, 0.15], pan: [0.35, 0.15] }
                ]
            },
            {
                name: 'Advisor', group: 'Shien\'s court', color: '#e5e7eb', forms: [
                    { card: 'Shien\'s Advisor', face: [0.45, 0.22], pan: [0.4, 0.22] },
                    { card: 'Elder of the Six Samurai', as: 'Elder', face: [0.52, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Kagemusha', group: 'Shien\'s court', color: '#9ca3af', forms: [
                    { card: 'Kagemusha of the Six Samurai', face: [0.45, 0.06], pan: [0.35, 0.1], zoom: 2 }
                ]
            },
            {
                name: 'Aides', group: 'Shien\'s court', color: '#d6d3d1', forms: [
                    { card: 'Shien\'s Footsoldier', as: 'Footsoldier', face: [0.45, 0.3], pan: [0.4, 0.3] },
                    { card: 'Shien\'s Spy', as: 'Spy', face: [0.35, 0.25], pan: [0.4, 0.25] },
                    { card: 'Shien\'s Squire', as: 'Squire', face: [0.4, 0.35], pan: [0.45, 0.35] }
                ]
            }
        ]
    };

    window.LoreReelData['crystal-beast'] = {
        kind: 'roster',
        label: 'The Crystal Beasts',
        portraits: 'first',
        people: [
            {
                name: 'Ruby', tag: 'Carbuncle', group: 'The seven crystals', color: '#fb7185', forms: [
                    { card: 'Crystal Beast Ruby Carbuncle', face: [0.6, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Sapphire', tag: 'Pegasus', group: 'The seven crystals', color: '#60a5fa', forms: [
                    { card: 'Crystal Beast Sapphire Pegasus', face: [0.55, 0.3], pan: [0.4, 0.3] }
                ]
            },
            {
                name: 'Topaz', tag: 'Tiger', group: 'The seven crystals', color: '#facc15', forms: [
                    { card: 'Crystal Beast Topaz Tiger', face: [0.55, 0.2], pan: [0.45, 0.2] }
                ]
            },
            {
                name: 'Emerald', tag: 'Tortoise', group: 'The seven crystals', color: '#34d399', forms: [
                    { card: 'Crystal Beast Emerald Tortoise', face: [0.45, 0.45], pan: [0.5, 0.4] }
                ]
            },
            {
                name: 'Amber', tag: 'Mammoth', group: 'The seven crystals', color: '#fb923c', forms: [
                    { card: 'Crystal Beast Amber Mammoth', face: [0.45, 0.25], pan: [0.45, 0.3] }
                ]
            },
            {
                name: 'Amethyst', tag: 'Cat', group: 'The seven crystals', color: '#c084fc', forms: [
                    { card: 'Crystal Beast Amethyst Cat', face: [0.7, 0.15], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Cobalt', tag: 'Eagle', group: 'The seven crystals', color: '#818cf8', forms: [
                    { card: 'Crystal Beast Cobalt Eagle', face: [0.15, 0.6], pan: [0.45, 0.55] }
                ]
            },
            {
                name: 'Their bond', group: 'Friends', color: '#f0abfc', forms: [
                    { card: 'Crystal Pair', face: [0.5, 0.45], pan: [0.4, 0.5] },
                    { card: 'Crystal Blessing', as: 'Blessing', face: [0.5, 0.5], pan: [0.3, 0.5] },
                    { card: 'Crystal Tree', as: 'Tree', face: [0.5, 0.5], pan: [0.4, 0.6] },
                    { card: 'Crystal Raigeki', as: 'Raigeki', face: [0.5, 0.35], pan: [0.35, 0.5] },
                    { card: 'Crystal Promise', as: 'Promise', face: [0.5, 0.35], pan: [0.4, 0.5] }
                ]
            },
            {
                name: 'Rainbow Dragon', group: 'The Crystal Deity', color: '#e879f9', forms: [
                    { card: 'Rainbow Dragon', face: [0.55, 0.45], pan: [0.35, 0.45] },
                    { card: 'Ancient City - Rainbow Ruins', as: 'Rainbow Ruins', face: [0.5, 0.5], pan: [0.3, 0.55] }
                ]
            }
        ]
    };

    window.LoreReelData['lightsworn'] = {
        kind: 'roster',
        label: 'The Lightsworn army',
        people: [
            {
                name: 'Realm of Light', group: 'Home', color: '#fde68a', forms: [
                    { card: 'Realm of Light', face: [0.5, 0.4], pan: [0.3, 0.55] },
                    { card: 'Charge of the Light Brigade', as: 'Arrival', face: [0.5, 0.3], pan: [0.4, 0.3] },
                    { card: 'Glorious Illusion', as: 'Return', face: [0.45, 0.2], pan: [0.4, 0.25] }
                ]
            },
            {
                name: 'Advance Guard', group: 'The army', color: '#fbbf24', forms: [
                    { card: 'Ryko, Lightsworn Hunter', as: 'Ryko', face: [0.55, 0.5], pan: [0.5, 0.45] },
                    { card: 'Jain, Lightsworn Paladin', as: 'Jain', face: [0.5, 0.2], pan: [0.4, 0.2] },
                    { card: 'Ehren, Lightsworn Monk', as: 'Ehren', face: [0.45, 0.12], pan: [0.4, 0.15] },
                    { card: 'Garoth, Lightsworn Warrior', as: 'Garoth', face: [0.4, 0.15], pan: [0.35, 0.15] },
                    { card: 'Wulf, Lightsworn Beast', as: 'Wulf', face: [0.45, 0.18], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Backline', group: 'The army', color: '#a5b4fc', forms: [
                    { card: 'Lumina, Lightsworn Summoner', as: 'Lumina', face: [0.5, 0.2], pan: [0.4, 0.2] },
                    { card: 'Lyla, Lightsworn Sorceress', as: 'Lyla', face: [0.5, 0.2], pan: [0.4, 0.2] },
                    { card: 'Aurkus, Lightsworn Druid', as: 'Aurkus', face: [0.5, 0.12], pan: [0.4, 0.15] },
                    { card: 'Jenis, Lightsworn Mender', as: 'Jenis', face: [0.4, 0.18], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Air Force', group: 'The army', color: '#7dd3fc', forms: [
                    { card: 'Shire, Lightsworn Spirit', as: 'Shire', face: [0.5, 0.12], pan: [0.4, 0.15] },
                    { card: 'Celestia, Lightsworn Angel', as: 'Celestia', face: [0.5, 0.2], pan: [0.4, 0.2] },
                    { card: 'Gragonith, Lightsworn Dragon', as: 'Gragonith', face: [0.35, 0.15], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Black Ops', group: 'The army', color: '#86efac', forms: [
                    { card: 'Rinyan, Lightsworn Rogue', as: 'Rinyan', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Judgment', group: 'The army', color: '#f5f5f4', forms: [
                    { card: 'Judgment Dragon', face: [0.42, 0.08], pan: [0.45, 0.12] }
                ]
            }
        ]
    };

    window.LoreReelData['kewl-tune'] = {
        kind: 'roster',
        label: 'The Kewl Tune DJs',
        people: [
            {
                name: 'Track Maker', group: 'On the decks', color: '#fbbf24', forms: [
                    { card: 'Kewl Tune Track Maker', face: [0.45, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Mix', group: 'On the decks', color: '#f472b6', forms: [
                    { card: 'Kewl Tune Mix', face: [0.55, 0.22], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'Clip', group: 'On the decks', color: '#a3e635', forms: [
                    { card: 'Kewl Tune Clip', face: [0.5, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Cue', group: 'On the decks', color: '#60a5fa', forms: [
                    { card: 'Kewl Tune Cue', face: [0.55, 0.15], pan: [0.35, 0.15] }
                ]
            },
            {
                name: 'Reco', group: 'On the decks', color: '#fcd34d', forms: [
                    { card: 'Kewl Tune Reco', face: [0.5, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Rotary', group: 'On the decks', color: '#5eead4', forms: [
                    { card: 'Kewl Tune Rotary', face: [0.7, 0.2], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'Remix', group: 'After dark', color: '#fb7185', forms: [
                    { card: 'Kewl Tune Remix', face: [0.46, 0.2], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'RS', group: 'After dark', color: '#ef4444', forms: [
                    { card: 'Kewl Tune RS', face: [0.49, 0.19], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'B2B', group: 'After dark', color: '#93c5fd', forms: [
                    { card: 'Kewl Tune B2B', face: [0.5, 0.18], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'Crackle', group: 'After dark', color: '#c4b5fd', forms: [
                    { card: 'Kewl Tune Crackle', face: [0.62, 0.12], pan: [0.3, 0.12] }
                ]
            },
            {
                name: 'The club', group: 'The club', color: '#e879f9', forms: [
                    { card: 'JJ "Kewl Tune"', face: [0.6, 0.35], pan: [0.35, 0.45] },
                    { card: 'Kewl Tune Loudness War', as: 'First song', face: [0.5, 0.4], pan: [0.3, 0.5] },
                    { card: 'Kewl Tune Synchro', as: 'After dark', face: [0.55, 0.4], pan: [0.4, 0.45] }
                ]
            }
        ]
    };

    window.LoreReelData['hecahands'] = {
        kind: 'roster',
        label: 'The Hecahands',
        people: [
            {
                name: 'Jauzah', group: 'Jauzah\'s faction', color: '#f87171', forms: [
                    { card: 'Hecahands Jauzah', face: [0.5, 0.15], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'Ibtel & Yadel', group: 'Jauzah\'s faction', color: '#fde68a', forms: [
                    { card: 'Hecahands Ibtel', as: 'Ibtel', face: [0.45, 0.12], pan: [0.35, 0.15] },
                    { card: 'Hecahands Yadel', as: 'Yadel', face: [0.6, 0.12], pan: [0.35, 0.15] }
                ]
            },
            {
                name: 'Mankibuel', group: 'Jauzah\'s faction', color: '#fb923c', forms: [
                    { card: 'Hecahands Mankibuel', face: [0.5, 0.3], pan: [0.4, 0.3] },
                    { card: 'Hecahands Bait', as: 'Bait', face: [0.4, 0.5], pan: [0.4, 0.4] }
                ]
            },
            {
                name: 'Xeno', group: 'Xeno\'s faction', color: '#a3e635', forms: [
                    { card: 'Hecahands Xeno', face: [0.65, 0.2], pan: [0.4, 0.25] }
                ]
            },
            {
                name: 'Gaigas & Godos', group: 'Xeno\'s faction', color: '#94a3b8', forms: [
                    { card: 'Hecahands Gaigas', as: 'Gaigas', face: [0.3, 0.4], pan: [0.4, 0.4] },
                    { card: 'Hecahands Godos', as: 'Godos', face: [0.35, 0.15], pan: [0.35, 0.2] },
                    { card: 'Hecahands Dandalos', as: 'Dandalos', face: [0.5, 0.25], pan: [0.4, 0.3] }
                ]
            },
            {
                name: 'Tartaros', group: 'Xeno\'s faction', color: '#e5e7eb', forms: [
                    { card: 'Hecahands Tartaros', face: [0.4, 0.3], pan: [0.3, 0.5] }
                ]
            }
        ]
    };

    window.LoreReelData['enneacraft'] = {
        kind: 'roster',
        label: 'The Enneacraft',
        people: [
            {
                name: 'Aiza.LEON', tag: 'No. 2', color: '#fcd34d', forms: [
                    { card: 'Enneacraft - Aiza.LEON', face: [0.5, 0.3], pan: [0.4, 0.35] }
                ]
            },
            {
                name: 'Asta.PIXEA', tag: 'No. 3', color: '#f87171', forms: [
                    { card: 'Enneacraft - Asta.PIXEA', face: [0.45, 0.3], pan: [0.4, 0.35] }
                ]
            },
            {
                name: 'Atil.SPIA', tag: 'No. 5', color: '#a5b4fc', forms: [
                    { card: 'Enneacraft - Atil.SPIA', face: [0.47, 0.55], pan: [0.45, 0.5] }
                ]
            },
            {
                name: 'Atori.MAR', tag: 'No. 6', color: '#fb923c', forms: [
                    { card: 'Enneacraft - Atori.MAR', face: [0.5, 0.4], pan: [0.4, 0.45] }
                ]
            },
            {
                name: 'Archa.TAIL', tag: 'No. 8', color: '#c084fc', forms: [
                    { card: 'Enneacraft - Archa.TAIL', face: [0.5, 0.3], pan: [0.4, 0.35] }
                ]
            },
            {
                name: 'Deployment', color: '#7dd3fc', forms: [
                    { card: 'Ekto Enneacraft - "tromarIA"', as: 'A sin is detected', face: [0.5, 0.45], pan: [0.4, 0.5] },
                    { card: 'Enneacraft Reverth', as: 'Deployment!!', face: [0.5, 0.45], pan: [0.4, 0.5] },
                    { card: 'Enneacraft Release', as: 'Release', face: [0.55, 0.3], pan: [0.3, 0.4] },
                    { card: 'Enneapolis', as: 'Enneapolis', face: [0.5, 0.4], pan: [0.3, 0.5] }
                ]
            }
        ]
    };

    window.LoreReelData['radiant-typhoon'] = {
        kind: 'roster',
        label: 'The Radiant Typhoon',
        people: [
            {
                name: 'Swen', tag: 'Priest', group: 'The people', color: '#fde68a', forms: [
                    { card: 'Radiant Typhoon Swen', face: [0.45, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Meghala', tag: 'Priestess', group: 'The people', color: '#c4b5fd', forms: [
                    { card: 'Radiant Typhoon Meghala', face: [0.44, 0.33], pan: [0.4, 0.3] },
                    { card: 'Radiant Typhoon Chant', as: 'At prayer', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Krosea', tag: 'Priestess', group: 'The people', color: '#6ee7b7', forms: [
                    { card: 'Radiant Typhoon Krosea', face: [0.4, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Eldam', tag: 'Warrior', group: 'The people', color: '#f9a8d4', forms: [
                    { card: 'Radiant Typhoon Eldam', face: [0.45, 0.2], pan: [0.4, 0.2] },
                    { card: 'Radiant Typhoon Ascendance', as: 'The trial', face: [0.55, 0.6], pan: [0.3, 0.55] }
                ]
            },
            {
                name: 'Varuroon', tag: 'Supreme god', group: 'The storm gods', color: '#38bdf8', forms: [
                    { card: 'Radiant Typhoon Varuroon, the Marine Eidolon', as: 'Marine Eidolon', face: [0.45, 0.3], pan: [0.4, 0.3] },
                    { card: 'Radiant Typhoon Manifestation', as: 'Manifestation', face: [0.55, 0.4], pan: [0.4, 0.4] },
                    { card: 'Radiant Typhoon Varuroon, the Vibrant Vortex', as: 'Vibrant Vortex', face: [0.45, 0.35], pan: [0.4, 0.35] }
                ]
            },
            {
                name: 'Fonix', group: 'The storm gods', color: '#fb923c', forms: [
                    { card: 'Radiant Typhoon Fonix, the Great Flame', face: [0.55, 0.3], pan: [0.4, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['gladiator-beast'] = {
        label: 'The Gladiator Beasts',
        slides: [
            { card: 'Colosseum - Cage of the Gladiator Beasts', title: 'The Colosseum', color: '#d6d3d1', pan: [0.35, 0.55] },
            { card: 'Gladiator Beast\'s Respite', title: 'Sealed away', color: '#a3e635', pan: [0.45, 0.3] },
            { card: 'Gladiator\'s Return', title: 'The seal breaks', color: '#7dd3fc', pan: [0.45, 0.25] },
            '|',
            { card: 'Gladiator Beast\'s Battle Gladius', title: 'Sword and shield', color: '#bef264', pan: [0.4, 0.3] },
            { card: 'Gladiator Beast\'s Battle Halberd', title: 'Manica and halberd', color: '#c4b5fd', pan: [0.3, 0.45] },
            '|',
            { card: 'Gladiator Beast Laquari', title: 'Out of the cage', color: '#fb923c', pan: [0.4, 0.3] },
            { card: 'Gladiator Beast Heraklinos', title: 'A new form', color: '#fde68a', pan: [0.45, 0.25] },
            { card: 'Gladiator Beast Gaiodiaz', title: 'Gaiodiaz', color: '#f87171', pan: [0.45, 0.2] },
            '|',
            { card: 'Disarm', title: 'Disarm', color: '#60a5fa', pan: [0.45, 0.3] },
            { card: 'Parry', title: 'Parry', color: '#e5e7eb', pan: [0.4, 0.35] },
            { card: 'Gladiator Proving Ground', title: 'Still fighting', color: '#fcd34d', pan: [0.35, 0.55] }
        ]
    };

    window.LoreReelData['machine-dragons'] = {
        label: 'Machine Dragon Development Records',
        slides: [
            { card: 'Cyber Dragon', title: 'The Front Faction', color: '#93c5fd', pan: [0.4, 0.15] },
            { card: 'Power Bond', title: 'Fusion', color: '#fde68a', pan: [0.3, 0.5] },
            { card: 'Cyber End Dragon', title: 'No bounds', color: '#e5e7eb', pan: [0.45, 0.25] },
            '|',
            { card: 'Cyberdark Cannon', title: 'The Reverse Faction', color: '#a78bfa', pan: [0.35, 0.5] },
            { card: 'Cyberdark Impact!', title: 'A live specimen', color: '#86efac', pan: [0.45, 0.3] },
            { card: 'Cyberdark Dragon', title: 'Growing costs', color: '#fb923c', pan: [0.45, 0.3] },
            '|',
            { card: 'Infernal Dragon', title: 'Evolving', color: '#4ade80', pan: [0.45, 0.3] },
            { card: 'Cyberdark Wurm', title: 'The Wurm', color: '#c4b5fd', pan: [0.45, 0.3] },
            '|',
            { card: 'Cyberdark Chimera', title: 'The answer', color: '#f472b6', pan: [0.45, 0.4] },
            { card: 'Cyber Jormungardr', title: 'Jormungardr', color: '#fbbf24', pan: [0.45, 0.3] }
        ],
        cast: [
            {
                name: 'Front Faction', color: '#93c5fd', names: ['Front Faction', 'Front', 'Cyber Dragon', 'Jormungardr'],
                forms: [
                    { from: 0, card: 'Cyber Dragon', face: [0.75, 0.12] },
                    { from: 2, card: 'Cyber End Dragon', as: 'Cyber End', face: [0.55, 0.25] },
                    { from: 9, card: 'Cyber Jormungardr', as: 'Jormungardr', face: [0.7, 0.25] }
                ]
            },
            {
                name: 'Reverse Faction', color: '#a78bfa', names: ['Reverse Faction', 'Reverse', 'Cyberdark', 'Cyberdarks'],
                forms: [
                    { from: 0, card: 'Cyberdark Dragon', face: [0.5, 0.25] },
                    { from: 7, card: 'Cyberdark Wurm', as: 'Wurm', face: [0.45, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['skull-servant'] = {
        kind: 'trail',
        label: 'Where is Mr. Skull Servant?',
        stops: [
            { card: 'Skull Servant', title: 'Our favorite guy', color: '#e5e7eb', face: [0.45, 0.25], pan: [0.45, 0.25] },
            { card: 'The Wandering Doomed', title: 'The look-alike', color: '#86efac', face: [0.4, 0.3], pan: [0.45, 0.3] },
            { card: 'King of the Skull Servants', title: 'The king', color: '#c4b5fd', face: [0.5, 0.08], pan: [0.3, 0.1], zoom: 1.6 },
            { card: 'The Lady in Wight', title: 'The superstar', color: '#fde68a', face: [0.5, 0.3], pan: [0.4, 0.3] },
            { card: 'Wightmare', title: 'The newcomer', color: '#93c5fd', face: [0.55, 0.2], pan: [0.4, 0.25] },
            { card: 'Spirit Caller', title: 'Find him ★', color: '#a78bfa', face: [0.3, 0.5], pan: [0.45, 0.5] },
            { card: 'Pride of the Weak', title: 'Find him ★★', color: '#d6d3d1', face: [0.65, 0.3], pan: [0.45, 0.35] },
            { card: 'Chthonian Blast', title: 'Find him ★★★', color: '#fb923c', face: [0.45, 0.45], pan: [0.4, 0.5] },
            { card: 'Dark Eruption', title: 'Find him ★★★★', color: '#f87171', face: [0.2, 0.1], pan: [0.3, 0.12], zoom: 2.0 },
            { card: 'Zombie Master', title: 'Find him ★★★★★', color: '#bef264', face: [0.12, 0.71], pan: [0.45, 0.7], zoom: 2.2 },
            { card: 'Self-Mummification', title: 'Super cool', color: '#fcd34d', face: [0.5, 0.25], pan: [0.4, 0.3] }
        ]
    };

    window.LoreReelData['grepher'] = {
        label: 'The Destiny of Dai Grepher',
        slides: [
            { card: 'Warrior Dai Grepher', title: 'Dai Grepher', color: '#93c5fd', pan: [0.4, 0.2], on: ['Grepher'] },
            { card: 'Simultaneous Loss', title: 'The rival', color: '#fda4af', pan: [0.35, 0.4], on: ['Grepher'] },
            { card: 'Dimension Wall', title: 'Flung away', color: '#c4b5fd', pan: [0.35, 0.45], on: ['Grepher'] },
            { card: 'Dimensional Inversion', title: 'The way back', color: '#7dd3fc', pan: [0.45, 0.3], on: ['Grepher'] },
            { card: 'Array of Revealing Light', title: 'Covered', color: '#fbbf24', pan: [0.35, 0.4], on: ['Grepher'] },
            '|',
            { card: 'The Paths of Destiny', title: 'The fork', color: '#a3e635', pan: [0.35, 0.5], on: ['Grepher'] },
            { card: 'Spirit Ryu', title: 'The right way', color: '#4ade80', pan: [0.45, 0.65], on: ['Grepher'] },
            { card: 'Ryu Senshi', title: 'Ryu Senshi', color: '#38bdf8', pan: [0.4, 0.2], on: ['Grepher'] },
            '|',
            { card: 'Morale Boost', title: 'The wrong way', color: '#fb923c', pan: [0.45, 0.25], on: ['Grepher'] },
            { card: 'Dark Lucius LV4', title: 'Corruption', color: '#a78bfa', pan: [0.4, 0.2], on: ['Grepher'] },
            { card: 'Dark Lucius LV8', title: 'Dark Lucius', color: '#ef4444', pan: [0.4, 0.2], on: ['Grepher'] }
        ],
        cast: [
            {
                name: 'Grepher', color: '#93c5fd', names: ['Grepher'],
                forms: [
                    { from: 0, card: 'Warrior Dai Grepher', face: [0.4, 0.18] },
                    { from: 7, card: 'Ryu Senshi', as: 'Ryu Senshi', face: [0.45, 0.2] },
                    { from: 8, card: 'Warrior Dai Grepher', face: [0.4, 0.18] },
                    { from: 9, card: 'Dark Lucius LV4', as: 'Dark Lucius', face: [0.45, 0.15] },
                    { from: 10, card: 'Dark Lucius LV8', as: 'Dark Lucius LV8', face: [0.5, 0.22] }
                ]
            }
        ]
    };

    window.LoreReelData['koaki-meiru'] = {
        label: 'Project C: the Koa\'ki Meiru research notes',
        slides: [
            { card: 'Iron Core Specimen Lab', title: 'The lab', color: '#fbbf24', pan: [0.3, 0.5] },
            { card: 'Koa\'ki Meiru Powerhand', title: 'Superbia 9th', color: '#facc15', pan: [0.35, 0.1] },
            { card: 'Iron Core of Koa\'ki Meiru', title: 'The core', color: '#fb923c', pan: [0.35, 0.5] },
            { card: 'Koa\'ki Meiru Sea Panther', title: 'Avaritia 17th', color: '#86efac', pan: [0.4, 0.25] },
            { card: 'Koa\'ki Meiru Bergzak', title: 'The sentry', color: '#d1d5db', pan: [0.4, 0.15] },
            { card: 'Koa\'ki Meiru Doom', title: 'Invidia 49th', color: '#60a5fa', pan: [0.4, 0.15] },
            { card: 'Koa\'ki Meiru Valafar', title: 'The red demon', color: '#ef4444', pan: [0.4, 0.2] },
            { card: 'Core Reinforcement', title: 'Deterioration', color: '#fde68a', pan: [0.3, 0.5] },
            '|',
            { card: 'Automatic Laser', title: 'Luxuria 14th', color: '#7dd3fc', pan: [0.35, 0.45] },
            { card: 'Core Blaster', title: 'A weapon', color: '#f59e0b', pan: [0.35, 0.45] },
            { card: 'Core Transport Unit', title: 'Gula 4th', color: '#67e8f9', pan: [0.35, 0.45] },
            { card: 'Koa\'ki Meiru Drago', title: 'The dragon', color: '#93c5fd', pan: [0.35, 0.6] },
            '|',
            { card: 'Koa\'ki Meiru Maximus', title: 'Acedia 13th', color: '#e5e7eb', pan: [0.35, 0.7] },
            { card: 'Koa\'ki Meiru Guardian', title: 'Ira 666th', color: '#fef3c7', pan: [0.35, 0.2] }
        ]
    };

    window.LoreReelData['alien'] = {
        label: 'The Invaders from Outer Space',
        slides: [
            { card: 'Alien Mother', title: 'The mother', color: '#f0abfc', pan: [0.4, 0.25] },
            { card: 'Flying Saucer Muusik\'i', title: 'The base', color: '#93c5fd', pan: [0.35, 0.4] },
            { card: 'Alien Warrior', title: 'Ground troops', color: '#e5e7eb', pan: [0.4, 0.25] },
            '|',
            { card: '"A" Cell Breeding Device', title: '"A" Cells', color: '#fb923c', pan: [0.35, 0.45] },
            { card: '"A" Cell Incubator', title: 'The incubator', color: '#fda4af', pan: [0.35, 0.45] },
            { card: '"A" Cell Scatter Burst', title: 'The bomb', color: '#f87171', pan: [0.35, 0.45] },
            { card: 'Interdimensional Warp', title: 'Warps', color: '#60a5fa', pan: [0.4, 0.35] },
            { card: 'Brainwashing Beam', title: 'Brainwashing', color: '#fde68a', pan: [0.35, 0.45] },
            { card: 'Detonator Circle "A"', title: 'Explosives', color: '#86efac', pan: [0.4, 0.45] },
            '|',
            { card: 'Otherworld - The "A" Zone', title: 'The A Zone', color: '#5eead4', pan: [0.3, 0.55] },
            { card: 'Cosmic Horror Gangi\'el', title: 'Cosmic Horror', color: '#c4b5fd', pan: [0.4, 0.3] }
        ]
    };

    window.LoreReelData['eldlich'] = {
        label: 'Eldland, the Golden Land',
        slides: [
            { card: 'Eldlixir of Black Awakening', title: 'Eldlixir', color: '#fde68a', pan: [0.35, 0.5] },
            { card: 'Cursed Eldland', title: 'Eldland', color: '#f59e0b', pan: [0.3, 0.5] },
            { card: 'Eldlich the Golden Lord', title: 'The Golden Lord', color: '#facc15', pan: [0.4, 0.2] },
            { card: 'Huaquero of the Golden Land', title: 'The travelers', color: '#93c5fd', pan: [0.4, 0.3] },
            { card: 'Conquistador of the Golden Land', title: 'The armies', color: '#e5e7eb', pan: [0.35, 0.3] },
            { card: 'Guardian of the Golden Land', title: 'The beasts', color: '#5eead4', pan: [0.4, 0.35] },
            '|',
            { card: 'Seven Cities of the Golden Land', title: 'The world', color: '#f472b6', pan: [0.4, 0.3] },
            { card: 'Pot of Extravagance', title: 'Golden soldiers', color: '#86efac', pan: [0.35, 0.5] },
            { card: 'Fallen Angel of the Golden Land', title: 'The Fallen Angel', color: '#f87171', pan: [0.35, 0.45] },
            { card: 'Eldlixir of the Glorious Golden Land', title: 'Insatiable', color: '#ef4444', pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['adventurer'] = {
        label: 'Adventurer of Another World',
        slides: [
            { card: 'Rite of Aramesir', title: 'The ritual', color: '#bae6fd', pan: [0.35, 0.5], on: ['Enchantress'] },
            { card: 'Water Enchantress of the Temple', title: 'The Enchantress', color: '#7dd3fc', pan: [0.4, 0.2], on: ['Enchantress'] },
            { card: 'Magicore Warrior of the Relics', title: 'Companions', color: '#fbbf24', pan: [0.4, 0.2], on: ['Enchantress', 'Magicore Warrior'] },
            { card: 'Wandering Gryphon Rider', title: 'The party', color: '#c4b5fd', pan: [0.4, 0.3], on: ['Enchantress', 'Gryphon Rider'] },
            { card: 'Dracoback, the Rideable Dragon', title: 'On the road', color: '#86efac', pan: [0.35, 0.3], on: ['Enchantress', 'Magicore Warrior', 'Gryphon Rider'] },
            '|',
            { card: 'Forest of Lost Flowers', title: 'Lost flowers', color: '#f0abfc', pan: [0.35, 0.5], on: ['Gryphon Rider'] },
            { card: 'Starlit Papillon', title: 'The butterfly', color: '#e879f9', pan: [0.35, 0.45], on: ['Gryphon Rider'] },
            { card: 'Breath of Resurrection', title: 'Healing', color: '#bef264', pan: [0.35, 0.7], on: ['Gryphon Rider'] },
            { card: 'Zaralaam the Dark Palace', title: 'Zaralaam', color: '#67e8f9', pan: [0.35, 0.5], on: ['Magicore Warrior'] },
            { card: 'Dunnell, the Noble Arms of Light', title: 'Dunnell', color: '#fde68a', pan: [0.35, 0.45], on: ['Magicore Warrior'] },
            { card: 'Illegal Knight', title: 'The unknown knight', color: '#94a3b8', pan: [0.35, 0.25], on: ['Enchantress', 'Magicore Warrior', 'Gryphon Rider'] },
            { card: 'Fateful Adventure', title: 'A new adventure', color: '#fcd34d', pan: [0.35, 0.3], on: ['Enchantress', 'Magicore Warrior', 'Gryphon Rider'] }
        ],
        cast: [
            {
                name: 'Enchantress', color: '#7dd3fc', names: ['Water Enchantress', 'Enchantress'],
                forms: [
                    { from: 0, card: 'Water Enchantress of the Temple', face: [0.42, 0.18] }
                ]
            },
            {
                name: 'Magicore Warrior', color: '#fbbf24', names: ['Magicore Warrior'],
                forms: [
                    { from: 0, card: 'Magicore Warrior of the Relics', face: [0.47, 0.32] }
                ]
            },
            {
                name: 'Gryphon Rider', color: '#c4b5fd', names: ['Gryphon Rider'],
                forms: [
                    { from: 0, card: 'Wandering Gryphon Rider', face: [0.47, 0.39], zoom: 4 }
                ]
            }
        ]
    };

    window.LoreReelData['zombie-world'] = {
        label: 'The two rulers of Zombie World',
        slides: [
            { card: 'Zombie World', title: 'The undead land', color: '#c4b5fd', pan: [0.3, 0.6] },
            { card: 'Doomking Balerdroch', title: 'Balerdroch', color: '#e5e7eb', pan: [0.45, 0.35] },
            { card: 'Red-Eyes Zombie Dragon', title: 'The stolen eye', color: '#ef4444', pan: [0.5, 0.4] },
            '|',
            { card: 'Zombie Necronize', title: 'The miasma', color: '#93c5fd', pan: [0.35, 0.15] },
            { card: 'Red-Eyes Zombie Necro Dragon', title: 'Necro Dragon', color: '#60a5fa', pan: [0.5, 0.35] },
            { card: 'Return of the Zombies', title: 'Expansion', color: '#f87171', pan: [0.3, 0.55] },
            { card: 'Zombie Power Struggle', title: 'The clash', color: '#fde68a', pan: [0.35, 0.5] },
            '|',
            { card: 'Tatsunecro', title: 'Zombified', color: '#86efac', pan: [0.35, 0.4] },
            { card: 'Glow-Up Bloom', title: 'Zombified!!', color: '#f9a8d4', pan: [0.3, 0.5] }
        ],
        cast: [
            {
                name: 'Balerdroch', color: '#e5e7eb', names: ['Balerdroch', 'Doomking'],
                forms: [
                    { from: 0, card: 'Doomking Balerdroch', face: [0.45, 0.38] }
                ]
            },
            {
                name: 'Zombie Dragon', color: '#ef4444', names: ['Zombie Dragon', 'Necro Dragon'],
                forms: [
                    { from: 0, card: 'Red-Eyes Zombie Dragon', face: [0.5, 0.45] },
                    { from: 4, card: 'Red-Eyes Zombie Necro Dragon', as: 'Necro Dragon', face: [0.2, 0.37] }
                ]
            }
        ]
    };

    window.LoreReelData['vanquish-soul'] = {
        label: 'The fighters drawn to one another',
        slides: [
            { card: 'Vanquish Soul Calamity Caesar', title: 'The old fight', color: '#f87171', pan: [0.2, 0.5] },
            { card: 'Rock of the Vanquisher', title: 'The god of battle', color: '#d6d3d1', pan: [0.3, 0.45] },
            { card: 'Vanquish Soul Caesar Valius', title: 'The dragon', color: '#ef4444', pan: [0.35, 0.3] },
            '|',
            { card: 'Vanquish Soul Razen', title: 'Razen', color: '#60a5fa', pan: [0.35, 0.2] },
            { card: 'Vanquish Soul Dust Devil', title: 'The Spiral style', color: '#fbbf24', pan: [0.35, 0.25] },
            { card: 'Vanquish Soul Pantera', title: 'The Empress', color: '#f472b6', pan: [0.3, 0.12] },
            { card: 'Vanquish Soul Heavy Borger', title: 'The colonel', color: '#fb923c', pan: [0.35, 0.45] },
            { card: 'Vanquish Soul Dr. Mad Love', title: 'The scientist', color: '#c084fc', pan: [0.3, 0.25] },
            { card: 'Vanquish Soul Pluton HG', title: 'The liquid', color: '#86efac', pan: [0.4, 0.4] },
            '|',
            { card: 'Vanquish Soul Jiaolong', title: 'An old rival', color: '#e5e7eb', pan: [0.3, 0.15] },
            { card: 'Vanquish Soul Snow Devil', title: 'The hidden truth', color: '#7dd3fc', pan: [0.3, 0.15] },
            { card: 'Stake your Soul!', title: 'Stake your soul', color: '#fda4af', pan: [0.35, 0.3] },
            { card: 'Vanquish Soul - Continue?', title: 'Continue?', color: '#5eead4', pan: [0.4, 0.5] },
            { card: 'Vanquish Soul Trinity Burst', title: 'Side by side', color: '#fcd34d', pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['voiceless-voice'] = {
        label: 'The maiden and her silent protector',
        slides: [
            { card: 'Novox\'s Prayer', title: 'The maiden', color: '#f87171', pan: [0.2, 0.25] },
            { card: 'Skull Guardian', title: 'The protector', color: '#d6d3d1', pan: [0.3, 0.4] },
            { card: 'Lo, the Prayers of the Voiceless Voice', title: 'The journey', color: '#fca5a5', pan: [0.25, 0.2] },
            '|',
            { card: 'Sauravis, Dragon Sage of the Voiceless Voice', title: 'Watched over', color: '#bae6fd', pan: [0.25, 0.2] },
            { card: 'Saffira, Dragon Queen of the Voiceless Voice', title: 'Saffira', color: '#fde68a', pan: [0.2, 0.2] },
            { card: 'Prayers of the Voiceless Voice', title: 'The sanctuary', color: '#fef3c7', pan: [0.3, 0.5] },
            '|',
            { card: 'Skull Guardian, Protector of the Voiceless Voice', title: 'Blessed', color: '#fcd34d', pan: [0.3, 0.4] },
            { card: 'Saffira, Divine Dragon of the Voiceless Voice', title: 'The Divine Dragon', color: '#fffbeb', pan: [0.3, 0.3] }
        ],
        cast: [
            {
                name: 'Lo', color: '#f87171', names: ['Lo', 'maiden'],
                forms: [
                    { from: 0, card: 'Novox\'s Prayer', face: [0.5, 0.25] },
                    { from: 2, card: 'Lo, the Prayers of the Voiceless Voice', as: 'Prayers', face: [0.58, 0.2] }
                ]
            },
            {
                name: 'Skull Guardian', color: '#d6d3d1', names: ['Skull Guardian', 'protector'],
                forms: [
                    { from: 0, card: 'Skull Guardian', face: [0.5, 0.35] },
                    { from: 6, card: 'Skull Guardian, Protector of the Voiceless Voice', as: 'Protector', face: [0.5, 0.3] }
                ]
            },
            {
                name: 'Saffira', color: '#fde68a', names: ['Saffira', 'divine dragons'],
                forms: [
                    { from: 0, card: 'Saffira, Dragon Queen of the Voiceless Voice', face: [0.5, 0.18] },
                    { from: 7, card: 'Saffira, Divine Dragon of the Voiceless Voice', as: 'Divine Dragon', face: [0.5, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['dragon-rulers'] = {
        label: 'The paranormal calamities',
        slides: [
            { card: 'Redox, Dragon Ruler of Boulders', title: 'Boulders', color: '#d6d3d1', pan: [0.35, 0.65] },
            { card: 'Tidal, Dragon Ruler of Waterfalls', title: 'Waterfalls', color: '#7dd3fc', pan: [0.2, 0.35] },
            { card: 'Blaster, Dragon Ruler of Infernos', title: 'Infernos', color: '#f97316', pan: [0.3, 0.3] },
            { card: 'Tempest, Dragon Ruler of Storms', title: 'Storms', color: '#bbf7d0', pan: [0.2, 0.3] },
            '|',
            { card: 'Here There Be Dragons', title: 'Resonance', color: '#fde68a', pan: [0.3, 0.55] },
            { card: 'Chasma, Dragon Ruler of Auroras', title: 'Light', color: '#e0f2fe', pan: [0.3, 0.4] },
            { card: 'Eclipse, Dragon Ruler of Catastrophes', title: 'Darkness', color: '#a78bfa', pan: [0.4, 0.2] },
            { card: 'Disaster, Dragon Ruler of All Apocalypses', title: 'The apocalypse', color: '#ef4444', pan: [0.25, 0.35] }
        ]
    };

    window.LoreReelData['maliss'] = {
        kind: 'roster',
        label: 'The Maliss',
        people: [
            {
                name: 'White Rabbit', color: '#f9a8d4', forms: [
                    { card: 'Maliss <P> White Rabbit', face: [0.47, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Chessy Cat', color: '#c084fc', forms: [
                    { card: 'Maliss <P> Chessy Cat', face: [0.55, 0.22], pan: [0.33999999999999997, 0.22] },
                    { card: 'Maliss <C> GWC-06', as: 'GWC-06', face: [0.7, 0.25], pan: [0.35, 0.25] },
                    { card: 'Mad Hacker', as: 'Mad Hacker', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Dormouse', color: '#fde047', forms: [
                    { card: 'Maliss <P> Dormouse', face: [0.35, 0.12], pan: [0.24, 0.12] },
                    { card: 'Maliss <C> MTP-07', as: 'MTP-07', face: [0.4, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'March Hare', color: '#5eead4', forms: [
                    { card: 'Maliss <P> March Hare', face: [0.5, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'The queens', color: '#fb7185', forms: [
                    { card: 'Maliss <Q> White Binder', as: 'White Binder', face: [0.5, 0.15], pan: [0.27, 0.15] },
                    { card: 'Maliss <Q> Red Ransom', as: 'Red Ransom', face: [0.48, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Hearts Crypter', color: '#ef4444', forms: [
                    { card: 'Maliss <Q> Hearts Crypter', face: [0.5, 0.1], pan: [0.22, 0.1] }
                ]
            },
            {
                name: 'Under\u00ADground', color: '#e879f9', forms: [
                    { card: 'Maliss in Underground', face: [0.45, 0.3], pan: [0.42, 0.3] },
                    { card: 'Maliss in the Mirror', as: 'The mirror', face: [0.45, 0.3], pan: [0.42, 0.3] },
                    { card: 'Maliss <C> TB-11', as: 'TB-11', face: [0.35, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['amazement'] = {
        kind: 'roster',
        label: 'Amazement Precious Park',
        portraits: 'first',
        people: [
            {
                name: 'The park', color: '#fbbf24', forms: [
                    { card: 'Amazement Precious Park', face: [0.5, 0.45], pan: [0.45, 0.45] },
                    { card: 'Amazement Special Show', as: 'Special Show', face: [0.5, 0.4], pan: [0.45, 0.4] }
                ]
            },
            {
                name: 'Arlekino', color: '#60a5fa', forms: [
                    { card: 'Amazement Administrator Arlekino', face: [0.45, 0.12], pan: [0.24, 0.12] }
                ]
            },
            {
                name: 'Bufo', color: '#fb7185', forms: [
                    { card: 'Amazement Ambassador Bufo', face: [0.45, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Attractions', color: '#f472b6', forms: [
                    { card: 'Amaze Attraction Horror House', as: 'Horror House', face: [0.7, 0.55], pan: [0.45, 0.55] },
                    { card: 'Amaze Attraction Rapid Racing', as: 'Rapid Racing', face: [0.5, 0.45], pan: [0.45, 0.45] },
                    { card: 'Amaze Attraction Majestic Merry-Go-Round', as: 'Merry-Go-Round', face: [0.55, 0.45], pan: [0.45, 0.45] },
                    { card: 'Amaze Attraction Viking Vortex', as: 'Viking Vortex', face: [0.4, 0.45], pan: [0.45, 0.45] },
                    { card: 'Amaze Attraction Cyclo-Coaster', as: 'Cyclo-Coaster', face: [0.45, 0.45], pan: [0.45, 0.45] },
                    { card: 'Amaze Attraction Wonder Wheel', as: 'Wonder Wheel', face: [0.45, 0.4], pan: [0.45, 0.4] }
                ]
            },
            {
                name: 'Comica & Delia', color: '#86efac', forms: [
                    { card: 'Amazement Attendant Comica', as: 'Comica', face: [0.4, 0.15], pan: [0.27, 0.15] },
                    { card: 'Amazement Assistant Delia', as: 'Delia', face: [0.55, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Tickets', color: '#fde68a', forms: [
                    { card: 'Amazing Time Ticket', face: [0.5, 0.5], pan: [0.45, 0.5] },
                    { card: 'Fukubiki', as: 'Fukubiki', face: [0.75, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['charmers'] = {
        kind: 'roster',
        label: 'The four Charmers',
        people: [
            {
                name: 'Aussa', tag: 'Earth', color: '#d6a76c', forms: [
                    { card: 'Aussa the Earth Charmer', face: [0.4, 0.25], pan: [0.37, 0.25] },
                    { card: 'Familiar-Possessed - Aussa', as: 'Possessed', face: [0.4, 0.25], pan: [0.37, 0.25] },
                    { card: 'Spiritual Earth Art - Kurogane', as: 'Spiritual Art', face: [0.45, 0.3], pan: [0.42, 0.3] },
                    { card: 'Avalanching Aussa', as: 'Avalanching', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Hiita', tag: 'Fire', color: '#f87171', forms: [
                    { card: 'Hiita the Fire Charmer', face: [0.45, 0.25], pan: [0.37, 0.25] },
                    { card: 'Familiar-Possessed - Hiita', as: 'Possessed', face: [0.35, 0.28], pan: [0.4, 0.28] },
                    { card: 'Spiritual Fire Art - Kurenai', as: 'Spiritual Art', face: [0.45, 0.25], pan: [0.37, 0.25] },
                    { card: 'Blazing Hiita', as: 'Blazing', face: [0.5, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Eria', tag: 'Water', color: '#60a5fa', forms: [
                    { card: 'Eria the Water Charmer', face: [0.5, 0.2], pan: [0.32, 0.2] },
                    { card: 'Familiar-Possessed - Eria', as: 'Possessed', face: [0.68, 0.25], pan: [0.37, 0.25] },
                    { card: 'Spiritual Water Art - Aoi', as: 'Spiritual Art', face: [0.45, 0.28], pan: [0.4, 0.28] },
                    { card: 'Raging Eria', as: 'Raging', face: [0.5, 0.22], pan: [0.33999999999999997, 0.22] }
                ]
            },
            {
                name: 'Wynn', tag: 'Wind', color: '#4ade80', forms: [
                    { card: 'Wynn the Wind Charmer', face: [0.4, 0.2], pan: [0.32, 0.2] },
                    { card: 'Familiar-Possessed - Wynn', as: 'Possessed', face: [0.4, 0.2], pan: [0.32, 0.2] },
                    { card: 'Spiritual Wind Art - Miyabi', as: 'Spiritual Art', face: [0.5, 0.28], pan: [0.4, 0.28] },
                    { card: 'Storming Wynn', as: 'Storming', face: [0.55, 0.28], pan: [0.4, 0.28] }
                ]
            }
        ]
    };

    window.LoreReelData['memento'] = {
        kind: 'roster',
        label: 'The banquet of bones',
        people: [
            {
                name: 'Memento\u00ADmictlan', color: '#fde68a', forms: [
                    { card: 'Mementomictlan', face: [0.5, 0.4], pan: [0.45, 0.4] },
                    { card: 'Mementotlan Bone Party', as: 'Bone Party', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Mace', color: '#f472b6', forms: [
                    { card: 'Mementotlan Mace', face: [0.55, 0.22], pan: [0.33999999999999997, 0.22] }
                ]
            },
            {
                name: 'Dark Blade', color: '#fb923c', forms: [
                    { card: 'Mementotlan Dark Blade', face: [0.5, 0.18], pan: [0.3, 0.18] }
                ]
            },
            {
                name: 'Goblin', color: '#bef264', forms: [
                    { card: 'Mementotlan Goblin', face: [0.4, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Tatsuno\u00ADotoshigo', color: '#c4b5fd', forms: [
                    { card: 'Mementotlan Tatsunootoshigo', face: [0.6, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Ghattic', color: '#86efac', forms: [
                    { card: 'Mementotlan Ghattic', face: [0.5, 0.4], pan: [0.45, 0.4] }
                ]
            },
            {
                name: 'Twin Dragon', color: '#fde047', forms: [
                    { card: 'Mementotlan Twin Dragon', face: [0.35, 0.72], pan: [0.5, 0.72] }
                ]
            },
            {
                name: 'Bone Back', color: '#a78bfa', forms: [
                    { card: 'Mementotlan Bone Back', face: [0.2, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Horned Dragon', color: '#ef4444', forms: [
                    { card: 'Mementotlan-Horned Dragon', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Angwitch', color: '#e5e7eb', forms: [
                    { card: 'Mementotlan Angwitch', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Tecuhtlica', color: '#f9a8d4', forms: [
                    { card: 'Mementoal Tecuhtlica - Combined Creation', face: [0.5, 0.12], pan: [0.3, 0.12] },
                    { card: 'Mementotlan Fusion', as: 'Fusion', face: [0.5, 0.45], pan: [0.45, 0.45] }
                ]
            }
        ]
    };

    window.LoreReelData['dracotail'] = {
        kind: 'roster',
        label: 'The Stardraco',
        people: [
            {
                name: 'Lukias', color: '#e5e7eb', forms: [
                    { card: 'Dracotail Lukias', face: [0.47, 0.2], pan: [0.32, 0.2] },
                    { card: 'Dracotail Pan', as: 'Pan', face: [0.52, 0.25], pan: [0.37, 0.25] },
                    { card: 'Dracotail Arthalion', as: 'Arthalion', face: [0.5, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Faimena', color: '#a5b4fc', forms: [
                    { card: 'Dracotail Faimena', face: [0.45, 0.22], pan: [0.33999999999999997, 0.22] }
                ]
            },
            {
                name: 'Phryxul', color: '#86efac', forms: [
                    { card: 'Dracotail Phryxul', face: [0.5, 0.2], pan: [0.32, 0.2] },
                    { card: 'Dracotail Mululu', as: 'Mululu', face: [0.62, 0.48], pan: [0.45, 0.48] }
                ]
            },
            {
                name: 'The secret arts', color: '#fbbf24', forms: [
                    { card: 'Ketu Dracotail', face: [0.55, 0.48], pan: [0.45, 0.48] },
                    { card: 'Dracotail Horn', as: 'Horn', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['nouvelles'] = {
        kind: 'roster',
        label: 'A demonic menu',
        people: [
            {
                name: 'At Table', group: 'The restaurant', color: '#fde68a', forms: [
                    { card: 'Nouvelles Restaurant "At Table"', face: [0.5, 0.4], pan: [0.45, 0.4] },
                    { card: 'Voici la Carte (Today\'s Menu)', as: 'Today\'s menu', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Bueril\u00ADlabaisse', group: 'Plats de poisson', color: '#fb923c', forms: [
                    { card: 'Buerillabaisse de Nouvelles', face: [0.55, 0.2], pan: [0.32, 0.2] },
                    { card: 'Recette de Poisson (Fish Recipe)', as: 'Fish Recipe', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Poeltis', group: 'Plats de poisson', color: '#c4b5fd', forms: [
                    { card: 'Poeltis de Nouvelles', face: [0.5, 0.12], pan: [0.24, 0.12] },
                    { card: 'Recette de Personnel (Staff Recipe)', as: 'Staff Recipe', face: [0.5, 0.62], pan: [0.45, 0.62] }
                ]
            },
            {
                name: 'Bala\u00ADmeuniere', group: 'Plats de poisson', color: '#f87171', forms: [
                    { card: 'Balameuniere de Nouvelles', face: [0.5, 0.25], pan: [0.37, 0.25] },
                    { card: 'Concours de Cuisine (Culinary Confrontation)', as: 'Culinary Confrontation', face: [0.45, 0.38], pan: [0.4, 0.38] }
                ]
            },
            {
                name: 'Confiras', group: 'Plats de viande', color: '#86efac', forms: [
                    { card: 'Confiras de Nouvelles', face: [0.4, 0.25], pan: [0.37, 0.25] },
                    { card: 'Recette de Viande (Meat Recipe)', as: 'Meat Recipe', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Foie Glasya', group: 'Plats de viande', color: '#f472b6', forms: [
                    { card: 'Foie Glasya de Nouvelles', face: [0.5, 0.2], pan: [0.32, 0.2] },
                    { card: 'Chef\'s Special Recipe', as: 'Chef\'s Special', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Baelgrill', group: 'Plats de viande', color: '#a78bfa', forms: [
                    { card: 'Baelgrill de Nouvelles', face: [0.5, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Poisson\u00ADniere', group: 'The kitchen', color: '#93c5fd', forms: [
                    { card: 'Poissonniere de Nouvelles', face: [0.45, 0.15], pan: [0.27, 0.15] },
                    { card: 'Hungry Burger', as: 'Hungry Burger', face: [0.5, 0.45], pan: [0.45, 0.45] }
                ]
            },
            {
                name: 'Patissciel', group: 'The kitchen', color: '#fbcfe8', forms: [
                    { card: 'Patissciel Couverture', face: [0.5, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Head chef', group: 'The kitchen', color: '#d6d3d1', forms: [
                    { card: 'Hamburger Recipe', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['geargia'] = {
        label: 'Gears of Justice Dispatch!',
        slides: [
            { card: 'Geargiano', title: 'Gears of Justice', color: '#e5e7eb', pan: [0.3, 0.4] },
            { card: 'Geargiaccelerator', title: 'Top speed', color: '#fbbf24', pan: [0.3, 0.4] },
            { card: 'Geargianchor', title: 'Deep sea', color: '#60a5fa', pan: [0.3, 0.45] },
            { card: 'Geargiattacker', title: 'Mach speed', color: '#fde047', pan: [0.35, 0.4] },
            { card: 'Geargiarmor', title: 'Double shield', color: '#d6d3d1', pan: [0.3, 0.45] },
            { card: 'Gear Gigant X', title: 'Gear Gigant X', color: '#4ade80', pan: [0.2, 0.35] },
            '|',
            { card: 'Geargiagear', title: 'Out of gas?', color: '#f87171', pan: [0.3, 0.5] },
            { card: 'Geargia Change', title: 'Geargia Change!', color: '#93c5fd', pan: [0.3, 0.45] },
            { card: 'Geargiagear Gigant XG', title: 'Gigant XG', color: '#fb923c', pan: [0.25, 0.35] }
        ]
    };

    window.LoreReelData['dream-mirror'] = {
        label: 'Dream Domination',
        slides: [
            { card: 'Dream Mirror Oneiromancy', title: 'Lost in a dream', color: '#bae6fd', pan: [0.3, 0.6], on: ['Oneiros'] },
            { card: 'Oneiros, the Dream Mirror Erlking', title: 'The dream ruler', color: '#fbcfe8', pan: [0.15, 0.3], on: ['Oneiros'] },
            { card: 'Oneiros, the Dream Mirror Tormentor', title: 'Two forms', color: '#a78bfa', pan: [0.3, 0.4], on: ['Oneiros'] },
            { card: 'Neiroy, the Dream Mirror Disciple', title: 'The disciples', color: '#f9a8d4', pan: [0.25, 0.3], on: ['Neiroy'] },
            { card: 'Neiroy, the Dream Mirror Traitor', title: 'Sun or moon', color: '#818cf8', pan: [0.2, 0.35], on: ['Neiroy'] },
            { card: 'Morpheus, the Dream Mirror White Knight', title: 'The sun', color: '#fde68a', pan: [0.2, 0.35], on: ['Morpheus'] },
            { card: 'Morpheus, the Dream Mirror Black Knight', title: 'The moon', color: '#ef4444', pan: [0.25, 0.3], on: ['Morpheus'] },
            { card: 'Dream Mirror Phantasms', title: 'Never waking', color: '#c084fc', pan: [0.3, 0.5], on: ['Oneiros'] },
            { card: 'Dream Mirror Recap', title: 'The children', color: '#fcd34d', pan: [0.4, 0.6], on: ['Oneiros'] }
        ],
        cast: [
            {
                name: 'Oneiros', color: '#fbcfe8', names: ['Oneiros', 'dream ruler'],
                forms: [
                    { from: 0, card: 'Oneiros, the Dream Mirror Erlking', as: 'Erlking', face: [0.5, 0.12] },
                    { from: 2, card: 'Oneiros, the Dream Mirror Tormentor', as: 'Tormentor', face: [0.48, 0.3] },
                    { from: 5, card: 'Oneiros, the Dream Mirror Erlking', as: 'Erlking', face: [0.5, 0.12] },
                    { from: 6, card: 'Oneiros, the Dream Mirror Tormentor', as: 'Tormentor', face: [0.48, 0.3] },
                    { from: 7, card: 'Oneiros, the Dream Mirror Erlking', as: 'Erlking', face: [0.5, 0.12] }
                ]
            },
            {
                name: 'Neiroy', color: '#f9a8d4', names: ['Neiroy', 'disciples'],
                forms: [
                    { from: 0, card: 'Neiroy, the Dream Mirror Disciple', as: 'Disciple', face: [0.5, 0.2] },
                    { from: 4, card: 'Neiroy, the Dream Mirror Traitor', as: 'Traitor', face: [0.5, 0.12] },
                    { from: 5, card: 'Neiroy, the Dream Mirror Disciple', as: 'Disciple', face: [0.5, 0.2] },
                    { from: 6, card: 'Neiroy, the Dream Mirror Traitor', as: 'Traitor', face: [0.5, 0.12] },
                    { from: 7, card: 'Neiroy, the Dream Mirror Disciple', as: 'Disciple', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Morpheus', color: '#fde68a', names: ['Morpheus', 'knights'],
                forms: [
                    { from: 0, card: 'Morpheus, the Dream Mirror White Knight', as: 'White Knight', face: [0.45, 0.15] },
                    { from: 6, card: 'Morpheus, the Dream Mirror Black Knight', as: 'Black Knight', face: [0.5, 0.2] },
                    { from: 7, card: 'Morpheus, the Dream Mirror White Knight', as: 'White Knight', face: [0.45, 0.15] }
                ]
            }
        ]
    };

    window.LoreReelData['digital-bug'] = {
        label: 'Digital Bugs in Cyberspace',
        slides: [
            { card: 'Digital Bug LEDybug', title: 'Minor bugs', color: '#fde047', pan: [0.35, 0.45] },
            { card: 'Digital Bug Cocoondenser', title: 'Insects', color: '#e5e7eb', pan: [0.35, 0.45] },
            { card: 'Digital Bug Centibit', title: 'One species?', color: '#60a5fa', pan: [0.3, 0.5] },
            { card: 'Digital Bug Scaradiator', title: 'Defects', color: '#86efac', pan: [0.35, 0.45] },
            { card: 'Digital Bug Corebage', title: 'Eradicated', color: '#fbbf24', pan: [0.3, 0.4] },
            { card: 'Digital Bug Rhinosebus', title: 'Short-lived peace', color: '#c4b5fd', pan: [0.3, 0.4] },
            '|',
            { card: 'Digital Bug Registrider', title: 'Released', color: '#fde68a', pan: [0.35, 0.45] },
            { card: 'Digital Bug Websolder', title: 'Repairs', color: '#93c5fd', pan: [0.35, 0.45] },
            { card: 'Bug Matrix', title: 'Co-existence', color: '#5eead4', pan: [0.35, 0.55] }
        ]
    };

    window.LoreReelData['danger'] = {
        label: 'The Danger Files',
        slides: [
            { card: 'Realm of Danger!', title: 'The island', color: '#bae6fd', pan: [0.3, 0.5] },
            { card: 'Danger! Response Team', title: 'The debriefing', color: '#fbbf24', pan: [0.3, 0.4] },
            { card: 'Danger!? Tsuchinoko?', title: 'File No. 0028', color: '#fda4af', pan: [0.35, 0.5] },
            { card: 'Danger! Thunderbird!', title: 'File No. 0159', color: '#fb923c', pan: [0.2, 0.35] },
            { card: 'Danger! Bigfoot!', title: 'File No. 0232', color: '#a8a29e', pan: [0.25, 0.35] },
            { card: 'Danger! Zone', title: 'The fight', color: '#86efac', pan: [0.35, 0.45] },
            { card: 'Danger! Nessie!', title: 'File No. 0257', color: '#7dd3fc', pan: [0.2, 0.35] },
            { card: 'Danger! Mothman!', title: 'More files', color: '#f87171', pan: [0.35, 0.45] },
            { card: 'Second Expedition into Danger!', title: 'Expedition two', color: '#fcd34d', pan: [0.4, 0.6] }
        ]
    };

    window.LoreReelData['herald'] = {
        label: 'The Herald\'s Guidance',
        slides: [
            { card: 'Herald of Ultimateness', title: 'The Herald', color: '#fef3c7', pan: [0.2, 0.35] },
            { card: 'Herald of Orange Light', title: 'Witnesses', color: '#fb923c', pan: [0.3, 0.4] },
            { card: 'Herald of Green Light', title: 'The afterglow', color: '#86efac', pan: [0.3, 0.4] },
            { card: 'Herald of Purple Light', title: 'Silence', color: '#c4b5fd', pan: [0.3, 0.4] },
            { card: 'Herald of Perfection', title: 'Forgiveness', color: '#fde68a', pan: [0.25, 0.4] },
            { card: 'Dawn of the Herald', title: 'The temple', color: '#e5e7eb', pan: [0.3, 0.5] },
            { card: 'Diviner of the Herald', title: 'The Diviner', color: '#93c5fd', pan: [0.2, 0.3] }
        ]
    };

    window.LoreReelData['starry-knight'] = {
        label: 'Legend of the Starry Dragon',
        slides: [
            { card: 'Starry Knight Sky', title: 'A starry night', color: '#5eead4', pan: [0.3, 0.5] },
            { card: 'Starry Knight Arrival', title: 'The legend', color: '#fde68a', pan: [0.2, 0.35] },
            { card: 'Starry Knight Ceremony', title: 'The prayer', color: '#bae6fd', pan: [0.25, 0.4] },
            { card: 'Starry Night, Starry Dragon', title: 'The dragon', color: '#e5e7eb', pan: [0.2, 0.35] },
            { card: 'Starry Knight Blast', title: 'Holy fire', color: '#fb923c', pan: [0.3, 0.45] },
            { card: 'Starry Knight Rayel', title: 'Starry Knights', color: '#c4b5fd', pan: [0.2, 0.3] },
            { card: 'Starry Knight Astel', title: 'Unseen', color: '#7dd3fc', pan: [0.25, 0.35] }
        ]
    };

    window.LoreReelData['rikka'] = {
        label: 'The Rikka Fairies Descend',
        slides: [
            { card: 'Rikka Petal', title: 'Snow flowers', color: '#bae6fd', pan: [0.3, 0.5] },
            { card: 'Rikka Princess', title: 'The droplet', color: '#e0f2fe', pan: [0.25, 0.4] },
            { card: 'Rikka Queen Strenna', title: 'The fairies', color: '#fde047', pan: [0.25, 0.35] },
            { card: 'Teardrop the Rikka Queen', title: 'Parasols', color: '#e5e7eb', pan: [0.2, 0.35] },
            { card: 'Rikka Konkon', title: 'The song', color: '#c084fc', pan: [0.2, 0.35] },
            { card: 'Rikka Glamour', title: 'Hand in hand', color: '#a5b4fc', pan: [0.2, 0.4] },
            { card: 'Rikka Sheet', title: 'The dance', color: '#7dd3fc', pan: [0.3, 0.2] }
        ]
    };

    window.LoreReelData['mokey-mokey'] = {
        label: 'The life of Mokey Mokey',
        slides: [
            { card: 'Mokey Mokey', title: 'Mokey Mokey~', color: '#e0f2fe', pan: [0.25, 0.4] },
            { card: 'Mokey Mokey Smackdown', title: 'Really mad', color: '#fb7185', pan: [0.3, 0.4] },
            { card: 'Human-Wave Tactics', title: 'A swarm', color: '#bae6fd', pan: [0.3, 0.5] },
            { card: 'Mokey Mokey King', title: 'The King', color: '#fde68a', pan: [0.35, 0.45] },
            { card: 'Dark Factory of Mass Production', title: 'The truth', color: '#94a3b8', pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['revolution'] = {
        label: 'A Huge Revolution is Stirring',
        slides: [
            { card: 'Royal Oppression', title: 'Taxes', color: '#fbbf24', pan: [0.3, 0.5] },
            { card: 'Toll', title: 'The toll', color: '#93c5fd', pan: [0.3, 0.4] },
            { card: 'Confiscation', title: 'Confiscation', color: '#fda4af', pan: [0.35, 0.5] },
            { card: 'Oppressed People', title: 'The last straw', color: '#f87171', pan: [0.35, 0.5] },
            { card: 'United Resistance', title: 'Underground', color: '#d6d3d1', pan: [0.3, 0.5] },
            { card: 'Huge Revolution', title: 'Revolution!!', color: '#fde68a', pan: [0.5, 0.78] }
        ]
    };

    window.LoreReelData['inpachi'] = {
        label: 'Inpachi the Tree Man',
        slides: [
            { card: 'Inpachi', title: 'My name is 18', color: '#d6a76c', pan: [0.2, 0.3] },
            { card: 'Blazing Inpachi', title: 'Blazing', color: '#fb923c', pan: [0.25, 0.5] },
            { card: 'Charcoal Inpachi', title: 'Burned out', color: '#78716c', pan: [0.2, 0.35] },
            { card: 'Kozaky', title: 'Kozaky', color: '#a78bfa', pan: [0.25, 0.3] },
            { card: 'Double Attack', title: 'Materials', color: '#fde68a', pan: [0.3, 0.4] },
            { card: 'Woodborg Inpachi', title: 'Woodborg', color: '#e5e7eb', pan: [0.25, 0.35] }
        ]
    };

    window.LoreReelData['dark-scorpion'] = {
        kind: 'roster',
        label: 'The Dark Scorpion Burglars',
        people: [
            {
                name: 'Don Zaloog', color: '#a78bfa', forms: [
                    { card: 'Don Zaloog', face: [0.5, 0.15], pan: [0.27, 0.15] },
                    { card: 'Legacy Hunter', as: 'Younger days', face: [0.5, 0.12], pan: [0.24, 0.12] }
                ]
            },
            {
                name: 'Cliff', tag: 'No. 2', color: '#fbbf24', forms: [
                    { card: 'Dark Scorpion - Cliff the Trap Remover', face: [0.45, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Gorg', color: '#fb923c', forms: [
                    { card: 'Dark Scorpion - Gorg the Strong', face: [0.45, 0.12], pan: [0.24, 0.12] }
                ]
            },
            {
                name: 'Meanae', color: '#f472b6', forms: [
                    { card: 'Dark Scorpion - Meanae the Thorn', face: [0.5, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Chick', color: '#fde047', forms: [
                    { card: 'Dark Scorpion - Chick the Yellow', face: [0.4, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'The five', color: '#ef4444', forms: [
                    { card: 'Dark Scorpion Burglars', face: [0.5, 0.3], pan: [0.42, 0.3] },
                    { card: 'Dark Scorpion Combination', as: 'Combination', face: [0.4, 0.35], pan: [0.45, 0.35] },
                    { card: 'Mustering of the Dark Scorpions', as: 'Mustering', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['dd'] = {
        kind: 'roster',
        label: 'The Different Dimension',
        people: [
            {
                name: 'Designator', group: 'Your guide', color: '#f0abfc', forms: [
                    { card: 'D.D. Designator', face: [0.65, 0.25], pan: [0.37, 0.25] }
                ]
            },
            {
                name: 'D.D. Warrior', group: 'The residents', color: '#f87171', forms: [
                    { card: 'D.D. Warrior', face: [0.35, 0.12], pan: [0.24, 0.12] },
                    { card: 'D.D. Scout Plane', as: 'Scout Plane', face: [0.55, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Warrior Lady', group: 'The residents', color: '#fde68a', forms: [
                    { card: 'D.D. Warrior Lady', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Trainer', group: 'The residents', color: '#86efac', forms: [
                    { card: 'D.D. Trainer', face: [0.72, 0.1], pan: [0.2, 0.1], zoom: 3 },
                    { card: 'D.D. Crazy Beast', as: 'Crazy Beast', face: [0.4, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'The dragon', group: 'The residents', color: '#5eead4', forms: [
                    { card: 'Different Dimension Dragon', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'The gate', group: 'Coming and going', color: '#93c5fd', forms: [
                    { card: 'Different Dimension Gate', face: [0.5, 0.35], pan: [0.45, 0.35] },
                    { card: 'Return from the Different Dimension', as: 'Return', face: [0.45, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['amazoness'] = {
        kind: 'roster',
        label: 'The Amazoness village',
        people: [
            {
                name: 'Paladin', color: '#fbbf24', forms: [
                    { card: 'Amazoness Paladin', face: [0.35, 0.12], pan: [0.24, 0.12] }
                ]
            },
            {
                name: 'Archers', color: '#a3e635', forms: [
                    { card: 'Amazoness Archer', face: [0.45, 0.15], pan: [0.27, 0.15] },
                    { card: 'Amazoness Archers', as: 'Archers', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Fighter', color: '#fb923c', forms: [
                    { card: 'Amazoness Fighter', face: [0.5, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Weapons', color: '#f472b6', forms: [
                    { card: 'Amazoness Blowpiper', as: 'Blowpiper', face: [0.6, 0.15], pan: [0.27, 0.15] },
                    { card: 'Amazoness Swords Woman', as: 'Swords Woman', face: [0.52, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Tiger', color: '#fde68a', forms: [
                    { card: 'Amazoness Tiger', face: [0.4, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['gravekeepers'] = {
        kind: 'roster',
        label: 'The Gravekeeper clan',
        people: [
            {
                name: 'Chief', color: '#fde047', forms: [
                    { card: 'Gravekeeper\'s Chief', face: [0.3, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Spy', color: '#93c5fd', forms: [
                    { card: 'Gravekeeper\'s Spy', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Guard', color: '#d6d3d1', forms: [
                    { card: 'Gravekeeper\'s Guard', face: [0.45, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Curse', color: '#86efac', forms: [
                    { card: 'Gravekeeper\'s Curse', face: [0.5, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Assailant', color: '#a78bfa', forms: [
                    { card: 'Gravekeeper\'s Assailant', face: [0.5, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'The royal curse', color: '#ef4444', forms: [
                    { card: 'Graverobber\'s Retribution', face: [0.6, 0.25], pan: [0.37, 0.25] }
                ]
            }
        ]
    };

    window.LoreReelData['myutant'] = {
        label: 'Myutant Mutation',
        slides: [
            { card: 'Myutant Mutant', title: 'First contact', color: '#a3e635', pan: [0.35, 0.55] },
            { card: 'Myutant Evolution Lab', title: 'The lab', color: '#c4b5fd', pan: [0.3, 0.5] },
            { card: 'Myutant Mist', title: 'Evolution', color: '#fbbf24', pan: [0.3, 0.45] },
            { card: 'Myutant Blast', title: 'Warnings', color: '#fb923c', pan: [0.3, 0.45] },
            { card: 'Myutant GB-88', title: 'The escape', color: '#f87171', pan: [0.3, 0.4] },
            { card: 'Myutant Beast', title: 'Beasts', color: '#bef264', pan: [0.25, 0.35] },
            { card: 'Myutant Arsenal', title: 'Machines', color: '#94a3b8', pan: [0.25, 0.4] },
            { card: 'Myutant Expansion', title: 'Evacuate!', color: '#fcd34d', pan: [0.3, 0.45] },
            { card: 'Myutant Synthesis', title: 'Merging', color: '#a78bfa', pan: [0.35, 0.5] },
            { card: 'Myutant Cry', title: 'The last record', color: '#ef4444', pan: [0.35, 0.6] }
        ]
    };

    window.LoreReelData['tenyi'] = {
        label: 'Land of the Tenyi',
        slides: [
            { card: 'Flawless Perfection of the Tenyi', title: 'The Dragon Vein', color: '#86efac', pan: [0.3, 0.4], on: ['Monk', 'Shaman'] },
            { card: 'Tenyi Spirit - Adhara', title: 'Harmony', color: '#fde68a', pan: [0.3, 0.45], on: ['Monk', 'Shaman'] },
            { card: 'Monk of the Tenyi', title: 'The boy', color: '#fb923c', pan: [0.3, 0.15], on: ['Monk'] },
            { card: 'Shaman of the Tenyi', title: 'The girl', color: '#c4b5fd', pan: [0.3, 0.15], on: ['Shaman'] },
            '|',
            { card: 'Vessel for the Dragon Cycle', title: 'The heretic', color: '#a8a29e', pan: [0.3, 0.45], on: ['Berserker'] },
            { card: 'Berserker of the Tenyi', title: 'His return', color: '#ef4444', pan: [0.3, 0.2], on: ['Berserker'] },
            { card: 'Fists of the Unrivaled Tenyi', title: 'Defeat', color: '#fca5a5', pan: [0.3, 0.4], on: ['Monk', 'Shaman', 'Berserker'] },
            '|',
            { card: 'Tenyi Spirit - Ashuna', title: 'The light', color: '#fef9c3', pan: [0.3, 0.4], on: ['Monk', 'Shaman'] },
            { card: 'Draco Berserker of the Tenyi', title: 'Stronger still', color: '#b91c1c', pan: [0.25, 0.3], on: ['Berserker'] },
            { card: 'Draco Masters of the Tenyi', title: 'The real battle', color: '#fbbf24', pan: [0.25, 0.35], on: ['Monk', 'Shaman'] }
        ],
        cast: [
            {
                name: 'Monk', color: '#fb923c', names: ['Monk', 'boy'],
                forms: [
                    { from: 0, card: 'Monk of the Tenyi', face: [0.5, 0.15] },
                    { from: 9, card: 'Draco Masters of the Tenyi', as: 'Draco Masters', face: [0.35, 0.25] }
                ]
            },
            {
                name: 'Shaman', color: '#c4b5fd', names: ['Shaman', 'girl'],
                forms: [
                    { from: 0, card: 'Shaman of the Tenyi', face: [0.42, 0.15] }
                ]
            },
            {
                name: 'Berserker', color: '#ef4444', names: ['Berserker'],
                forms: [
                    { from: 0, card: 'Berserker of the Tenyi', face: [0.5, 0.2] },
                    { from: 8, card: 'Draco Berserker of the Tenyi', as: 'Draco Berserker', face: [0.5, 0.2] }
                ]
            }
        ]
    };

    window.LoreReelData['bujin'] = {
        label: 'Bujin of the Divine Realm',
        slides: [
            { card: 'Bujin Hirume', title: 'Hirume', color: '#fef3c7', pan: [0.15, 0.1] },
            { card: 'Bujintei Susanowo', title: 'Susanowo', color: '#fb923c', pan: [0.25, 0.3] },
            { card: 'Bujintei Kagutsuchi', title: 'Kagutsuchi', color: '#93c5fd', pan: [0.25, 0.3] },
            { card: 'Bujintei Tsukuyomi', title: 'Tsukuyomi', color: '#c4b5fd', pan: [0.25, 0.3] },
            '|',
            { card: 'Bujinfidel', title: 'Banished', color: '#f87171', pan: [0.3, 0.45] },
            { card: 'Bujin Yamato', title: 'Yamato', color: '#fbbf24', pan: [0.25, 0.3] },
            { card: 'Bujin Mikazuchi', title: 'Disguised', color: '#60a5fa', pan: [0.25, 0.3] },
            { card: 'Bujin Hiruko', title: 'Hiruko', color: '#a78bfa', pan: [0.3, 0.4] },
            { card: 'Bujincarnation', title: 'Reunited', color: '#fde68a', pan: [0.3, 0.45] },
            '|',
            { card: 'Bujingi Warg', title: 'Blackened', color: '#57534e', pan: [0.3, 0.45] },
            { card: 'Bujinki Amaterasu', title: 'Eclipse', color: '#7c3aed', pan: [0.25, 0.3] },
            { card: 'Bujintervention', title: 'The sacred swords', color: '#e5e7eb', pan: [0.3, 0.45] },
            { card: 'Bujincident', title: 'A new battle', color: '#fcd34d', pan: [0.5, 0.75], on: ['Susanowo', 'Kagutsuchi', 'Tsukuyomi', 'Hirume'] }
        ],
        cast: [
            {
                name: 'Susanowo', color: '#fb923c', names: ['Susanowo', 'Yamato'],
                forms: [
                    { from: 0, card: 'Bujintei Susanowo', face: [0.52, 0.22] },
                    { from: 5, card: 'Bujin Yamato', as: 'Yamato', face: [0.5, 0.12] },
                    { from: 8, card: 'Bujintei Susanowo', face: [0.52, 0.22] }
                ]
            },
            {
                name: 'Hirume', color: '#fef3c7', names: ['Hirume', 'Amaterasu'],
                forms: [
                    { from: 0, card: 'Bujin Hirume', face: [0.55, 0.1] },
                    { from: 10, card: 'Bujinki Amaterasu', as: 'Amaterasu', face: [0.5, 0.12] }
                ]
            },
            {
                name: 'Kagutsuchi', color: '#93c5fd', names: ['Kagutsuchi', 'Mikazuchi'],
                forms: [
                    { from: 0, card: 'Bujintei Kagutsuchi', face: [0.5, 0.2] },
                    { from: 6, card: 'Bujin Mikazuchi', as: 'Mikazuchi', face: [0.52, 0.15] },
                    { from: 8, card: 'Bujintei Kagutsuchi', face: [0.5, 0.2] }
                ]
            },
            {
                name: 'Tsukuyomi', color: '#c4b5fd', names: ['Tsukuyomi', 'Arasuda'],
                forms: [
                    { from: 0, card: 'Bujintei Tsukuyomi', face: [0.55, 0.2] },
                    { from: 6, card: 'Bujin Arasuda', as: 'Arasuda', face: [0.5, 0.18] },
                    { from: 8, card: 'Bujintei Tsukuyomi', face: [0.55, 0.2] }
                ]
            }
        ]
    };

    window.LoreReelData['vendread'] = {
        label: 'Dark, Dead Vengeance',
        slides: [
            { card: 'Vendread Revenants', title: 'Endless night', color: '#94a3b8', pan: [0.3, 0.4], on: ['The horde'] },
            { card: 'Vendread Reorigin', title: 'The wall', color: '#a78bfa', pan: [0.3, 0.45], on: ['The horde'] },
            { card: 'Revendread Origin', title: 'The locket', color: '#fda4af', pan: [0.3, 0.45], on: ['Slayer'] },
            { card: 'Revendread Slayer', title: 'The Slayer', color: '#fbbf24', pan: [0.25, 0.3], on: ['Slayer'] },
            { card: 'Vendread Nights', title: 'A shadow', color: '#60a5fa', pan: [0.3, 0.45], on: ['Slayer', 'The horde'] },
            { card: 'Vendread Chimera', title: 'The Chimera', color: '#86efac', pan: [0.3, 0.4], on: ['The horde'] },
            { card: 'Vendread Reunion', title: 'The core', color: '#f87171', pan: [0.3, 0.45], on: ['Slayer', 'The horde'] },
            '|',
            { card: 'Vendread Charge', title: 'The Battlelord', color: '#ef4444', pan: [0.3, 0.45], on: ['The horde'] },
            { card: 'Vendread Battlelord', title: 'Overwhelmed', color: '#d6d3d1', pan: [0.25, 0.35], on: ['Slayer', 'The horde'] },
            { card: 'Vendread Revolution', title: 'The glint', color: '#fde68a', pan: [0.3, 0.45], on: ['Slayer', 'The horde'] },
            { card: 'Revendread Evolution', title: 'Its core', color: '#fb923c', pan: [0.3, 0.45], on: ['Slayer'] },
            { card: 'Vendread Anima', title: 'Her form', color: '#f9a8d4', pan: [0.25, 0.35], on: ['Slayer', 'The horde'] },
            { card: 'Revendread Executor', title: 'The Executor', color: '#dc2626', pan: [0.25, 0.3], on: ['Slayer'] },
            '|',
            { card: 'Vendread Daybreak', title: 'Daybreak', color: '#fcd34d', pan: [0.3, 0.45], on: ['Slayer'] },
            { card: 'Avendread Savior', title: 'The Savior', color: '#e5e7eb', pan: [0.25, 0.3], on: ['Slayer'] }
        ],
        cast: [
            {
                name: 'Slayer', color: '#fbbf24', names: ['Slayer'],
                forms: [
                    { from: 0, card: 'Revendread Origin', as: 'Origin', face: [0.2, 0.12] },
                    { from: 3, card: 'Revendread Slayer', face: [0.5, 0.15] },
                    { from: 12, card: 'Revendread Executor', as: 'Executor', face: [0.52, 0.18] },
                    { from: 14, card: 'Avendread Savior', as: 'Savior', face: [0.4, 0.12] }
                ]
            },
            {
                name: 'The horde', color: '#94a3b8', names: ['Vendreads', 'horde', 'Chimera', 'Battlelord'],
                forms: [
                    { from: 0, card: 'Vendread Revenants', face: [0.8, 0.3] },
                    { from: 5, card: 'Vendread Chimera', as: 'Chimera', face: [0.5, 0.2] },
                    { from: 7, card: 'Vendread Battlelord', as: 'Battlelord', face: [0.5, 0.3] },
                    { from: 11, card: 'Vendread Revenants', face: [0.8, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['the-weather'] = {
        label: 'The Fairies Who Paint the Weather',
        slides: [
            { card: 'The Weather Rainy Canvas', title: 'A rainy day', color: '#7dd3fc', pan: [0.3, 0.5] },
            { card: 'The Weather Painter Rain', title: 'Rain', color: '#93c5fd', pan: [0.3, 0.3] },
            { card: 'The Weather Painter Snow', title: 'Snow', color: '#e0f2fe', pan: [0.3, 0.3] },
            { card: 'The Weather Painter Cloud', title: 'Cloud', color: '#e5e7eb', pan: [0.3, 0.35] },
            { card: 'The Weather Painter Sun', title: 'Sun', color: '#fb923c', pan: [0.3, 0.3] },
            { card: 'The Weather Painter Thunder', title: 'Thunder', color: '#fde047', pan: [0.25, 0.3] },
            { card: 'The Weather Painter Aurora', title: 'Aurora', color: '#86efac', pan: [0.3, 0.3] },
            { card: 'The Weather Painter Rainbow', title: 'Rainbow', color: '#f9a8d4', pan: [0.3, 0.4] },
            { card: 'The Weather Rainbowed Canvas', title: 'Meeting a fairy', color: '#fde68a', pan: [0.3, 0.55] }
        ]
    };

    window.LoreReelData['subterror'] = {
        kind: 'roster',
        label: 'The Subterror Behemoths',
        people: [
            {
                name: 'The Hidden City', group: 'The city', color: '#5eead4', forms: [
                    { card: 'The Hidden City', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Stalagmo', group: 'The wicked dragons', color: '#a8a29e', forms: [
                    { card: 'Subterror Behemoth Stalagmo', face: [0.5, 0.25], pan: [0.37, 0.25] }
                ]
            },
            {
                name: 'Voltelluric', group: 'The wicked dragons', color: '#7dd3fc', forms: [
                    { card: 'Subterror Behemoth Voltelluric', face: [0.55, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Umastryx', group: 'The wicked dragons', color: '#94a3b8', forms: [
                    { card: 'Subterror Behemoth Umastryx', face: [0.8, 0.3], pan: [0.3, 0.3] }
                ]
            },
            {
                name: 'Ultramafus', group: 'The wicked dragons', color: '#f97316', forms: [
                    { card: 'Subterror Behemoth Ultramafus', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Stygo\u00ADkraken', group: 'The wicked dragons', color: '#60a5fa', forms: [
                    { card: 'Subterror Behemoth Stygokraken', face: [0.55, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Phosphero\u00ADglacier', group: 'The wicked dragons', color: '#6ee7b7', forms: [
                    { card: 'Subterror Behemoth Phospheroglacier', face: [0.35, 0.25], pan: [0.37, 0.25] }
                ]
            },
            {
                name: 'Drago\u00ADssuary', group: 'The wicked dragons', color: '#f87171', forms: [
                    { card: 'Subterror Behemoth Dragossuary', face: [0.45, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Speleogeist', group: 'The Dragon King', color: '#c084fc', forms: [
                    { card: 'Subterror Behemoth Speleogeist', face: [0.55, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['megalith'] = {
        label: 'The Mystery of the Megalith',
        slides: [
            { card: 'Megalith Ophiel', title: 'The white angel', color: '#e0f2fe', pan: [0.25, 0.35] },
            { card: 'Megalith Hagith', title: 'The black demon', color: '#fbbf24', pan: [0.3, 0.35] },
            { card: 'Megalith Och', title: 'The twins', color: '#f5f5f4', pan: [0.25, 0.35] },
            { card: 'Megalith Portal', title: 'The pedestals', color: '#7dd3fc', pan: [0.4, 0.7] },
            { card: 'Megalith Phaleg', title: 'Phaleg', color: '#fda4af', pan: [0.2, 0.3] },
            { card: 'Megalith Bethor', title: 'Bethor', color: '#bef264', pan: [0.25, 0.35] },
            { card: 'Megalith Emergence', title: 'Aratron', color: '#f97316', pan: [0.3, 0.4] },
            { card: 'Megalith Unformed', title: 'Force field', color: '#c4b5fd', pan: [0.35, 0.5] },
            { card: 'Megalith Phul', title: 'Beyond', color: '#e879f9', pan: [0.3, 0.35] }
        ]
    };

    window.LoreReelData['karakuri'] = {
        label: 'Studying the Origins of the Karakuri',
        slides: [
            { card: 'Karakuri Anatomy', title: 'The tome', color: '#fde68a', pan: [0.3, 0.5] },
            { card: 'Karakuri Showdown Castle', title: 'Hell on earth', color: '#93c5fd', pan: [0.3, 0.45] },
            { card: 'Karakuri Soldier mdl 236 "Nisamu"', title: 'Golden Gears', color: '#86efac', pan: [0.25, 0.3] },
            { card: 'Karakuri Ninja mdl 7749 "Nanashick"', title: 'Unrivaled', color: '#60a5fa', pan: [0.25, 0.3] },
            { card: 'Karakuri Shogun mdl 00 "Burei"', title: 'Burei', color: '#f87171', pan: [0.25, 0.3] },
            { card: 'Karakuri Muso mdl 818 "Haipa"', title: 'Calm', color: '#a3e635', pan: [0.25, 0.35] },
            '|',
            { card: 'Karakuri Cash Inn', title: 'Prosperity', color: '#d6d3d1', pan: [0.3, 0.5] },
            { card: 'Karakuri Gama Oil', title: 'Merchants', color: '#fdba74', pan: [0.3, 0.45] },
            { card: 'Karakuri Trick House', title: 'The fortress', color: '#fcd34d', pan: [0.3, 0.5] },
            { card: 'Karakuri Cash Shed', title: 'Fire', color: '#ef4444', pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['dinomist'] = {
        kind: 'roster',
        label: 'The steam dinosaurs',
        people: [
            {
                name: 'Plesios', group: 'The river', color: '#7dd3fc', forms: [
                    { card: 'Dinomist Plesios', face: [0.7, 0.18], pan: [0.3, 0.18] }
                ]
            },
            {
                name: 'Pteran', group: 'The sky', color: '#fb923c', forms: [
                    { card: 'Dinomist Pteran', face: [0.72, 0.22], pan: [0.33999999999999997, 0.22] }
                ]
            },
            {
                name: 'Ceratops', group: 'The land', color: '#a3e635', forms: [
                    { card: 'Dinomist Ceratops', face: [0.35, 0.3], pan: [0.42, 0.3] },
                    { card: 'Dinomist Rush', as: 'On patrol', face: [0.45, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Stegosaur', group: 'The land', color: '#34d399', forms: [
                    { card: 'Dinomist Stegosaur', face: [0.45, 0.33], pan: [0.4, 0.33] }
                ]
            },
            {
                name: 'Spinos', group: 'The volcano belt', color: '#f87171', forms: [
                    { card: 'Dinomist Spinos', face: [0.3, 0.33], pan: [0.4, 0.33] }
                ]
            },
            {
                name: 'Rex', group: 'The volcano belt', color: '#fde047', forms: [
                    { card: 'Dinomist Rex', face: [0.45, 0.12], pan: [0.3, 0.12] },
                    { card: 'Dinomists Howling', as: 'Rivals', face: [0.3, 0.3], pan: [0.42, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['beetrooper'] = {
        kind: 'roster',
        label: 'The Beetrooper army',
        people: [
            {
                name: 'Scout Buggy', group: 'The front line', color: '#f87171', forms: [
                    { card: 'Beetrooper Scout Buggy', face: [0.5, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Armor Horn', group: 'The front line', color: '#86efac', forms: [
                    { card: 'Beetrooper Armor Horn', face: [0.5, 0.18], pan: [0.3, 0.18] }
                ]
            },
            {
                name: 'Squad', group: 'The front line', color: '#e5e7eb', forms: [
                    { card: 'Beetrooper Squad', face: [0.45, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Light Flapper', group: 'Support', color: '#f0abfc', forms: [
                    { card: 'Beetrooper Light Flapper', face: [0.48, 0.12], pan: [0.24, 0.12] }
                ]
            },
            {
                name: 'Assault Roller', group: 'Specialists', color: '#fb923c', forms: [
                    { card: 'Beetrooper Assault Roller', face: [0.45, 0.35], pan: [0.45, 0.35] },
                    { card: 'Beetrooper Descent', as: 'Descent', face: [0.3, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Scale Bomber', group: 'Specialists', color: '#c084fc', forms: [
                    { card: 'Beetrooper Scale Bomber', face: [0.45, 0.3], pan: [0.42, 0.3] },
                    { card: 'Beetrooper Fly & Sting', as: 'Fly & Sting', face: [0.6, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Sting Lancer', group: 'Specialists', color: '#fde047', forms: [
                    { card: 'Beetrooper Sting Lancer', face: [0.5, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Atlas', group: 'Giant beetles', color: '#93c5fd', forms: [
                    { card: 'Giant Beetrooper Invincible Atlas', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Neptune', group: 'Giant beetles', color: '#4ade80', forms: [
                    { card: 'Heavy Beetrooper Mighty Neptune', face: [0.45, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'Hercules', group: 'Giant beetles', color: '#fbbf24', forms: [
                    { card: 'Ultra Beetrooper Absolute Hercules', face: [0.5, 0.35], pan: [0.45, 0.35] }
                ]
            },
            {
                name: 'The army', group: 'The campaign', color: '#bef264', forms: [
                    { card: 'Beetrooper Formation', face: [0.4, 0.3], pan: [0.42, 0.3] },
                    { card: 'Beetrooper Landing', as: 'New territory', face: [0.5, 0.25], pan: [0.37, 0.25] }
                ]
            }
        ]
    };

    window.LoreReelData['ua'] = {
        kind: 'roster',
        label: 'The Ultra Athletes',
        people: [
            {
                name: 'Perfect Ace', group: 'Tonight\'s stars', color: '#60a5fa', forms: [
                    { card: 'U.A. Perfect Ace', face: [0.62, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Midfielder', group: 'Tonight\'s stars', color: '#86efac', forms: [
                    { card: 'U.A. Midfielder', face: [0.55, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Playmaker', group: 'Tonight\'s stars', color: '#fbbf24', forms: [
                    { card: 'U.A. Playmaker', face: [0.45, 0.15], pan: [0.27, 0.15] }
                ]
            },
            {
                name: 'Blockbacker', group: 'Tonight\'s stars', color: '#f97316', forms: [
                    { card: 'U.A. Blockbacker', face: [0.5, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Dunker', group: 'Tonight\'s stars', color: '#fdba74', forms: [
                    { card: 'U.A. Dreadnought Dunker', face: [0.55, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'The U.A.s', group: 'The league', color: '#e5e7eb', forms: [
                    { card: 'U.A. Mighty Slugger', as: 'Slugger', face: [0.5, 0.25], pan: [0.37, 0.25] },
                    { card: 'U.A. Goalkeeper', as: 'Goalkeeper', face: [0.5, 0.35], pan: [0.45, 0.35] },
                    { card: 'U.A. Libero Spiker', as: 'Spiker', face: [0.45, 0.25], pan: [0.37, 0.25] },
                    { card: 'U.A. Rival Rebounder', as: 'Rebounder', face: [0.5, 0.25], pan: [0.37, 0.25] },
                    { card: 'U.A. Powered Jersey', as: 'Any sport', face: [0.5, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Off the field', group: 'The league', color: '#a78bfa', forms: [
                    { card: 'U.A. Locker Room', face: [0.5, 0.35], pan: [0.45, 0.35] },
                    { card: 'Loss Time', as: 'Teamwork', face: [0.45, 0.35], pan: [0.45, 0.35] },
                    { card: 'U.A. Signing Deal', as: 'Signing', face: [0.3, 0.25], pan: [0.37, 0.25] },
                    { card: 'U.A. Man of the Match', as: 'Man of the Match', face: [0.5, 0.25], pan: [0.37, 0.25] }
                ]
            },
            {
                name: 'The stadium', group: 'The league', color: '#fcd34d', forms: [
                    { card: 'U.A. Stadium', face: [0.5, 0.4], pan: [0.45, 0.4] },
                    { card: 'U.A. Hyper Stadium', as: 'Hyper Stadium', face: [0.5, 0.4], pan: [0.45, 0.4] }
                ]
            }
        ]
    };

    window.LoreReelData['traptrix'] = {
        kind: 'roster',
        label: 'The Traptrix',
        people: [
            {
                name: 'Atrax', group: 'The search log', color: '#c084fc', forms: [
                    { card: 'Traptrix Atrax', face: [0.5, 0.28], pan: [0.4, 0.28] }
                ]
            },
            {
                name: 'Myrmeleo', group: 'The search log', color: '#fb923c', forms: [
                    { card: 'Traptrix Myrmeleo', face: [0.5, 0.2], pan: [0.32, 0.2] }
                ]
            },
            {
                name: 'Nepenthes', group: 'The search log', color: '#fda4af', forms: [
                    { card: 'Traptrix Nepenthes', face: [0.5, 0.18], pan: [0.3, 0.18] }
                ]
            },
            {
                name: 'Dionaea', group: 'The search log', color: '#86efac', forms: [
                    { card: 'Traptrix Dionaea', face: [0.35, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'The banquet', group: 'The search log', color: '#ef4444', forms: [
                    { card: 'Traptrix Trap Hole Nightmare', face: [0.45, 0.35], pan: [0.45, 0.35] },
                    { card: 'Eradicating Aerosol', as: 'The escape', face: [0.6, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Pinguicula', group: 'The research report', color: '#f9a8d4', forms: [
                    { card: 'Traptrix Pinguicula', face: [0.3, 0.25], pan: [0.37, 0.25] }
                ]
            },
            {
                name: 'Atypus', group: 'The research report', color: '#f472b6', forms: [
                    { card: 'Traptrix Atypus', face: [0.5, 0.25], pan: [0.37, 0.25] }
                ]
            },
            {
                name: 'Holeutea', group: 'The research report', color: '#a3e635', forms: [
                    { card: 'Traptrix Holeutea', face: [0.45, 0.3], pan: [0.42, 0.3] }
                ]
            },
            {
                name: 'Arachno\u00ADcampa', group: 'The research report', color: '#5eead4', forms: [
                    { card: 'Traptrix Arachnocampa', face: [0.5, 0.25], pan: [0.37, 0.25] },
                    { card: 'Traptrix Rafflesia', as: 'Rafflesia', face: [0.55, 0.2], pan: [0.32, 0.2] },
                    { card: 'Traptantalizing Tune', as: 'Their song', face: [0.45, 0.25], pan: [0.37, 0.25] }
                ]
            },
            {
                name: 'Sera', group: 'The research report', color: '#fde047', forms: [
                    { card: 'Traptrix Sera', face: [0.45, 0.2], pan: [0.32, 0.2] },
                    { card: 'Traptrip Garden', as: 'Her meadow', face: [0.4, 0.4], pan: [0.45, 0.4] }
                ]
            },
            {
                name: 'Pudica', group: 'The research report', color: '#fecdd3', forms: [
                    { card: 'Traptrix Pudica', face: [0.5, 0.3], pan: [0.42, 0.3] },
                    { card: 'Traptrix Mantis', as: 'Mantis', face: [0.5, 0.2], pan: [0.32, 0.2] },
                    { card: 'Terrifying Trap Hole Nightmare', as: 'Hunting together', face: [0.5, 0.25], pan: [0.37, 0.25] }
                ]
            }
        ]
    };

    window.LoreReelData['yosenju'] = {
        kind: 'trail',
        label: 'The Yosenju art trail',
        stops: [
            { card: 'Yosen Training Grounds', title: 'The gate', color: '#fca5a5', face: [0.5, 0.4], pan: [0.3, 0.75] },
            { card: 'Yosenju Shinchu L', title: 'Left pillar', color: '#93c5fd', face: [0.5, 0.45], pan: [0.25, 0.45] },
            { card: 'Yosenju Shinchu R', title: 'Right pillar', color: '#f87171', face: [0.5, 0.42], pan: [0.25, 0.42] },
            { card: 'Yosenju Kama 1', title: 'Kama 1', color: '#c4b5fd', face: [0.47, 0.2], pan: [0.45, 0.18] },
            { card: 'Yosenju Kama 2', title: 'Kama 2', color: '#7dd3fc', face: [0.4, 0.18], pan: [0.45, 0.2] },
            { card: 'Yosenju Kama 3', title: 'Kama 3', color: '#86efac', face: [0.47, 0.18], pan: [0.45, 0.2] },
            { card: 'Yosenjus\' Secret Move', title: 'Secret move', color: '#fde68a', face: [0.8, 0.25], pan: [0.35, 0.3] },
            { card: 'Yosenju Tsujik', title: 'Tsujik', color: '#fdba74', face: [0.3, 0.2], pan: [0.45, 0.2] },
            { card: 'Yosenju Sabu', title: 'Sabu', color: '#d8b4fe', face: [0.47, 0.18], pan: [0.45, 0.2] },
            { card: 'Yosenjus\' Sword Sting', title: 'Sword Sting', color: '#fcd34d', face: [0.2, 0.22], pan: [0.4, 0.35] },
            { card: 'Yosenju Oroshi Channeling', title: 'Oroshi', color: '#a5f3fc', face: [0.5, 0.3], pan: [0.25, 0.55] },
            { card: 'Yosenju Wind Worship', title: 'Wind Worship', color: '#fb7185', face: [0.5, 0.7], pan: [0.25, 0.7] },
            { card: 'Mayosenju Hitot', title: 'Hitot', color: '#ef4444', face: [0.35, 0.3], pan: [0.3, 0.4] },
            { card: 'Mayosenju Daibak', title: 'Daibak', color: '#5eead4', face: [0.15, 0.3], pan: [0.3, 0.35] }
        ]
    };

    window.LoreReelData['toon'] = {
        kind: 'trail',
        label: 'The Toon art trail',
        stops: [
            { card: 'Toon World', title: 'The book', color: '#93c5fd', face: [0.75, 0.72], pan: [0.3, 0.7] },
            { card: 'Toon Terror', title: 'Off the shelf', color: '#c4b5fd', face: [0.5, 0.33], pan: [0.3, 0.45] },
            { card: 'Toon Table of Contents', title: 'Contents', color: '#fde68a', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Manga Ryu-Ran', title: 'The cover', color: '#fb923c', face: [0.45, 0.2], pan: [0.45, 0.2] },
            { card: 'Toon Mermaid', title: 'Back cover', color: '#5eead4', face: [0.45, 0.4], pan: [0.5, 0.35] },
            { card: 'Shine Palace', title: 'Shine Palace', color: '#e0f2fe', face: [0.5, 0.3], pan: [0.3, 0.6] },
            { card: 'Toon Page-Flip', title: 'Page-flip', color: '#a5b4fc', face: [0.4, 0.5], pan: [0.35, 0.6] },
            { card: 'Blue-Eyes Toon Dragon', title: 'Blue-Eyes', color: '#bfdbfe', face: [0.35, 0.35], pan: [0.35, 0.45] },
            { card: 'Toon World the Perfect World', title: 'Perfect world', color: '#f9a8d4', face: [0.5, 0.35], pan: [0.3, 0.55] },
            { card: 'Toon Summoned Skull', title: 'The Demon', color: '#a78bfa', face: [0.35, 0.3], pan: [0.3, 0.45] },
            { card: 'Comic Cat', title: 'Copycat', color: '#fcd34d', face: [0.65, 0.8], pan: [0.3, 0.75] },
            { card: 'Mind Mirror Force', title: 'The end', color: '#fca5a5', face: [0.8, 0.4], pan: [0.3, 0.5] },
            { card: 'Cartoon Shade', title: 'TV Duel', color: '#d1d5db', face: [0.75, 0.35], pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['raidraptor'] = {
        kind: 'trail',
        label: 'The Raidraptor art trail',
        stops: [
            { card: 'Raidraptor - Rise Falcon', title: 'The rise', color: '#fb923c', face: [0.47, 0.32], pan: [0.45, 0.3] },
            { card: 'Raidraptor\'s Phantom Knights Claw', title: 'Flame cloak', color: '#f87171', face: [0.55, 0.4], pan: [0.35, 0.5] },
            { card: 'Raidraptor - Revolution Falcon', title: 'Revolution', color: '#fbbf24', face: [0.55, 0.35], pan: [0.35, 0.45] },
            { card: 'Raider\'s Unbreakable Mind', title: 'Heartland', color: '#c084fc', face: [0.3, 0.3], pan: [0.3, 0.55] },
            { card: 'Raidraptor - Revolution Falcon - Air Raid', title: 'Air raid', color: '#fde68a', face: [0.45, 0.3], pan: [0.35, 0.5] },
            { card: 'Raidraptor - Force Strix', title: 'The owl', color: '#7dd3fc', face: [0.5, 0.35], pan: [0.4, 0.35] },
            { card: 'Raidraptor - Arsenal Falcon', title: 'The carrier', color: '#93c5fd', face: [0.5, 0.35], pan: [0.3, 0.55] },
            { card: 'Raidraptor - Roost', title: 'The roost', color: '#a3e635', face: [0.6, 0.3], pan: [0.3, 0.65] },
            { card: 'Raidraptor - Blade Burner Falcon', title: 'The manga', color: '#f472b6', face: [0.6, 0.35], pan: [0.3, 0.5] },
            { card: 'Raidraptor - Ultimate Falcon', title: 'Ultimate', color: '#facc15', face: [0.5, 0.35], pan: [0.4, 0.4] },
            { card: 'Raidraptor - Rising Rebellion Falcon', title: 'Rising', color: '#e879f9', face: [0.5, 0.3], pan: [0.3, 0.45] },
            { card: 'Rise Rank-Up-Magic Raidraptor\'s Force', title: 'The crest', color: '#d946ef', face: [0.5, 0.2], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['harpie'] = {
        kind: 'trail',
        label: 'The Harpie art trail',
        stops: [
            { card: 'Harpie Lady', title: 'Harpie Lady', color: '#86efac', face: [0.53, 0.47], pan: [0.2, 0.47] },
            { card: 'Elegant Egotist', title: 'Kaleidoscope', color: '#c4b5fd', face: [0.5, 0.5], pan: [0.3, 0.6] },
            { card: 'Harpie Lady Sisters', title: 'The sisters', color: '#f9a8d4', face: [0.3, 0.3], pan: [0.3, 0.35] },
            { card: 'Harpie Lady 1', title: 'Harpie Lady\u00A01', color: '#bbf7d0', face: [0.57, 0.22], pan: [0.15, 0.25] },
            { card: 'Cyber Harpie Lady', title: 'Cyber', color: '#e879f9', face: [0.5, 0.1], pan: [0.3, 0.2] },
            { card: 'Harpies\' Hunting Ground', title: 'Hunting ground', color: '#fde047', face: [0.3, 0.35], pan: [0.3, 0.45] },
            { card: 'Triangle Ecstasy Spark', title: 'Triangle', color: '#a5f3fc', face: [0.55, 0.15], pan: [0.3, 0.45] },
            { card: 'Harpie\'s Pet Baby Dragon', title: 'The pet', color: '#fb7185', face: [0.63, 0.2], pan: [0.3, 0.4] },
            { card: 'Harpie Oracle', title: 'The oracle', color: '#a78bfa', face: [0.55, 0.18], pan: [0.3, 0.3] },
            { card: 'Harpie\'s Pet Phantasmal Dragon', title: 'Phantasmal', color: '#818cf8', face: [0.6, 0.3], pan: [0.3, 0.45] },
            { card: 'Alluring Mirror Split', title: 'Every era', color: '#f0abfc', face: [0.85, 0.12], pan: [0.25, 0.35] },
            { card: 'Harpie Lady Elegance', title: 'Elegance', color: '#fda4af', face: [0.5, 0.3], pan: [0.3, 0.5] },
            { card: 'Harpie\'s Feather Duster', title: 'Feather Duster', color: '#bef264', face: [0.78, 0.2], pan: [0.25, 0.5] }
        ]
    };

    window.LoreReelData['majespecter'] = {
        kind: 'trail',
        label: 'The Majespecter art trail',
        stops: [
            { card: 'Majespecter Crow - Yata', title: 'Yata', color: '#c084fc', face: [0.72, 0.25], pan: [0.3, 0.35] },
            { card: 'Majespecter Cat - Nekomata', title: 'Nekomata', color: '#5eead4', face: [0.4, 0.25], pan: [0.3, 0.35] },
            { card: 'Majespecter Fox - Kyubi', title: 'Kyubi', color: '#fde047', face: [0.33, 0.33], pan: [0.3, 0.35] },
            { card: 'Majespecter Raccoon - Bunbuku', title: 'Bunbuku', color: '#fb923c', face: [0.3, 0.3], pan: [0.3, 0.35] },
            { card: 'Majespecter Toad - Ogama', title: 'Ogama', color: '#a3e635', face: [0.45, 0.3], pan: [0.3, 0.4] },
            { card: 'Majespecter Orthrus - Nue', title: 'Nue', color: '#f87171', face: [0.35, 0.33], pan: [0.3, 0.4] },
            { card: 'Majespecter Supercell', title: 'Supercell', color: '#93c5fd', face: [0.5, 0.7], pan: [0.3, 0.7] },
            { card: 'Majespecter Unicorn - Kirin', title: 'Kirin', color: '#fcd34d', face: [0.35, 0.25], pan: [0.45, 0.25] },
            { card: 'Majesty\'s Pegasus', title: 'The steed', color: '#e0f2fe', face: [0.4, 0.3], pan: [0.3, 0.75] },
            { card: 'Majester Paladin, the Ascending Dracoslayer', title: 'The paladin', color: '#bae6fd', face: [0.55, 0.2], pan: [0.25, 0.5] },
            { card: 'Majespecter Gust', title: 'Gust', color: '#bef264', face: [0.4, 0.3], pan: [0.3, 0.6] },
            { card: 'Majesty Pegasus, the Dracoslayer', title: 'Dracoslayer', color: '#fda4af', face: [0.47, 0.18], pan: [0.45, 0.2] },
            { card: 'Majespecter Draco - Ryu', title: 'Ryu', color: '#fde68a', face: [0.33, 0.15], pan: [0.35, 0.2] },
            { card: 'Wind Unicorn Parallel, the Dracoslayer', title: 'Parallel', color: '#99f6e4', face: [0.5, 0.2], pan: [0.45, 0.25] }
        ]
    };

    window.LoreReelData['metalfoes'] = {
        kind: 'trail',
        label: 'The Metalfoes art trail',
        stops: [
            { card: 'Metalfoes Steelen', title: 'Steelen', color: '#cbd5e1', face: [0.45, 0.2], pan: [0.35, 0.15] },
            { card: 'Metalfoes Silverd', title: 'Silverd', color: '#e5e7eb', face: [0.43, 0.2], pan: [0.35, 0.2] },
            { card: 'Metalfoes Fusion', title: 'Fusion', color: '#fca5a5', face: [0.4, 0.3], pan: [0.45, 0.3] },
            { card: 'Metalfoes Goldriver', title: 'Goldriver', color: '#fcd34d', face: [0.55, 0.3], pan: [0.3, 0.5] },
            { card: 'Metalfoes Volflame', title: 'Volflame', color: '#fb923c', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Metalfoes Combination', title: 'Combination', color: '#f87171', face: [0.4, 0.15], pan: [0.25, 0.55] },
            { card: 'True King Agnimazud, the Vanisher', title: 'The Vanisher', color: '#dc2626', face: [0.45, 0.2], pan: [0.35, 0.2] },
            { card: 'Heavymetalfoes Electrumite', title: 'Electrumite', color: '#fef08a', face: [0.25, 0.2], pan: [0.4, 0.25] },
            { card: 'Raremetalfoes Bismugear', title: 'Bismugear', color: '#f0abfc', face: [0.45, 0.2], pan: [0.4, 0.2] },
            { card: 'Fullmetalfoes Alkahest', title: 'Alkahest', color: '#86efac', face: [0.52, 0.2], pan: [0.45, 0.25] },
            { card: 'Heavymetalfoes Amalgam', title: 'Amalgam', color: '#a5f3fc', face: [0.6, 0.3], pan: [0.4, 0.35] },
            { card: 'Parametalfoes Fusion', title: 'Calamity', color: '#c084fc', face: [0.8, 0.55], pan: [0.35, 0.55] },
            { card: 'Metalfoes Vanisher', title: 'Vanisher', color: '#ef4444', face: [0.45, 0.3], pan: [0.35, 0.35] },
            { card: 'Dragonic Diagram', title: 'The diagram', color: '#fde68a', face: [0.8, 0.3], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['hieratic'] = {
        kind: 'trail',
        label: 'The Hieratic art trail',
        stops: [
            { card: 'Hieratic Seal of the Heavenly Spheres', title: 'The spheres', color: '#fde68a', face: [0.55, 0.52], pan: [0.25, 0.55] },
            { card: 'Hieratic Seal of the Sun Dragon Overlord', title: 'Sun seal', color: '#facc15', face: [0.5, 0.3], pan: [0.3, 0.5] },
            { card: 'Hieratic Sun Dragon Overlord of Heliopolis', title: 'Heliopolis', color: '#fb923c', face: [0.5, 0.12], pan: [0.5, 0.2] },
            { card: 'Hieratic Dragon King of Atum', title: 'Atum', color: '#fcd34d', face: [0.5, 0.17], pan: [0.45, 0.2] },
            { card: 'Hieratic Dragon of Su', title: 'Su', color: '#bae6fd', face: [0.35, 0.2], pan: [0.45, 0.25] },
            { card: 'Hieratic Dragon of Tefnuit', title: 'Tefnuit', color: '#93c5fd', face: [0.45, 0.15], pan: [0.45, 0.2] },
            { card: 'Hieratic Dragon of Gebeb', title: 'Gebeb', color: '#86efac', face: [0.58, 0.3], pan: [0.5, 0.3] },
            { card: 'Hieratic Dragon of Nuit', title: 'Nuit', color: '#a5b4fc', face: [0.4, 0.15], pan: [0.45, 0.2] },
            { card: 'Hieratic Dragon of Asar', title: 'Asar', color: '#4ade80', face: [0.55, 0.25], pan: [0.5, 0.3] },
            { card: 'Hieratic Dragon of Eset', title: 'Eset', color: '#f87171', face: [0.52, 0.4], pan: [0.2, 0.4] },
            { card: 'Hieratic Dragon of Sutekh', title: 'Sutekh', color: '#ef4444', face: [0.6, 0.2], pan: [0.5, 0.25] },
            { card: 'Hieratic Dragon of Nebthet', title: 'Nebthet', color: '#c4b5fd', face: [0.48, 0.4], pan: [0.2, 0.4] },
            { card: 'Hieratic Seal of Convocation', title: 'Convocation', color: '#fde047', face: [0.5, 0.52], pan: [0.25, 0.55] }
        ]
    };

    window.LoreReelData['vampire'] = {
        kind: 'trail',
        label: 'The Vampire art trail',
        stops: [
            { card: 'Vampire Lord', title: 'The Lord', color: '#fca5a5', face: [0.45, 0.18], pan: [0.45, 0.2] },
            { card: 'Vampire Genesis', title: 'Genesis', color: '#dc2626', face: [0.47, 0.08], pan: [0.3, 0.1] },
            { card: 'Vampire Voivode', title: 'Voivode', color: '#f87171', face: [0.68, 0.2], pan: [0.45, 0.25] },
            { card: 'The Zombie Vampire', title: 'The Undead', color: '#a78bfa', face: [0.5, 0.25], pan: [0.45, 0.25] },
            { card: 'Crimson Knight Vampire Bram', title: 'Bram', color: '#fb7185', face: [0.45, 0.15], pan: [0.4, 0.2] },
            { card: 'Dhampir Vampire Sheridan', title: 'Sheridan', color: '#fda4af', face: [0.45, 0.13], pan: [0.4, 0.15] },
            { card: 'Vampire Familiar', title: 'The bats', color: '#c084fc', face: [0.55, 0.45], pan: [0.3, 0.5] },
            { card: 'Vampire Fraulein', title: 'Fraulein', color: '#f472b6', face: [0.4, 0.3], pan: [0.2, 0.35] },
            { card: 'Vampire Scarlet Scourge', title: 'Scarlet Scourge', color: '#ef4444', face: [0.4, 0.2], pan: [0.45, 0.2] },
            { card: 'Vampire Grimson', title: 'Grimson', color: '#fb7185', face: [0.47, 0.25], pan: [0.2, 0.3] },
            { card: 'Vampire Sorcerer', title: 'Sorcerer', color: '#818cf8', face: [0.47, 0.2], pan: [0.45, 0.2] },
            { card: 'Vampire Takeover', title: 'Takeover', color: '#fde68a', face: [0.25, 0.35], pan: [0.2, 0.5] },
            { card: 'Vampire Fascinator', title: 'Fascinator', color: '#f0abfc', face: [0.5, 0.18], pan: [0.4, 0.2] },
            { card: 'Vampire Hunter', title: 'The hunter', color: '#d6d3d1', face: [0.35, 0.15], pan: [0.25, 0.2] }
        ]
    };

    window.LoreReelData['ancient-gear'] = {
        kind: 'trail',
        label: 'The Ancient Gear art trail',
        stops: [
            { card: 'Ancient Gear Golem', title: 'The Golem', color: '#fbbf24', face: [0.55, 0.15], pan: [0.45, 0.2] },
            { card: 'Ancient Gear Castle', title: 'The castle', color: '#d6d3d1', face: [0.5, 0.35], pan: [0.3, 0.5] },
            { card: 'Ancient Gear Fortress', title: 'The fortress', color: '#a8a29e', face: [0.5, 0.2], pan: [0.2, 0.5] },
            { card: 'Ancient Gear Advance', title: 'The advance', color: '#fb923c', face: [0.3, 0.25], pan: [0.3, 0.6] },
            { card: 'Ancient Gear Catapult', title: 'The catapult', color: '#fde68a', face: [0.45, 0.25], pan: [0.3, 0.6] },
            { card: 'Ancient Gear Soldier', title: 'The soldier', color: '#cbd5e1', face: [0.3, 0.12], pan: [0.3, 0.2] },
            { card: 'Ancient Gear Tank', title: 'The tank', color: '#94a3b8', face: [0.4, 0.3], pan: [0.35, 0.45] },
            { card: 'Ancient Gear Factory', title: 'The factory', color: '#f59e0b', face: [0.6, 0.5], pan: [0.3, 0.6] },
            { card: 'Ultimate Ancient Gear Golem', title: 'Ultimate', color: '#f97316', face: [0.5, 0.2], pan: [0.45, 0.25] },
            { card: 'Ancient Gear Duel', title: 'The duel', color: '#ef4444', face: [0.6, 0.3], pan: [0.25, 0.6] },
            { card: 'Ancient Gear Megaton Golem', title: 'Megaton', color: '#d97706', face: [0.5, 0.18], pan: [0.45, 0.2] },
            { card: 'Chaos Ancient Gear Giant', title: 'Chaos Giant', color: '#a78bfa', face: [0.45, 0.12], pan: [0.4, 0.2] },
            { card: 'Ancient Gear Gadjiltron Dragon', title: 'Gadjiltron', color: '#86efac', face: [0.3, 0.3], pan: [0.3, 0.45] },
            { card: 'Ancient Gear Reactor Dragon', title: 'Reactor', color: '#fca5a5', face: [0.5, 0.15], pan: [0.4, 0.2] }
        ]
    };

    window.LoreReelData['performapal'] = {
        kind: 'trail',
        label: 'The Performapal art trail',
        stops: [
            { card: 'Performapal Hip Hippo', title: 'Hip Hippo', color: '#fdba74', face: [0.4, 0.4], pan: [0.5, 0.35] },
            { card: 'Performapal Cheermole', title: 'Cheermole', color: '#fde047', face: [0.5, 0.2], pan: [0.5, 0.25] },
            { card: 'Performapal Dramatic Theater', title: 'The theater', color: '#f472b6', face: [0.5, 0.5], pan: [0.3, 0.7] },
            { card: 'Performapal Parrotrio', title: 'Parrotrio', color: '#86efac', face: [0.5, 0.35], pan: [0.35, 0.4] },
            { card: 'Performapal Sleight Hand Magician', title: 'Sleight Hand', color: '#c4b5fd', face: [0.5, 0.15], pan: [0.45, 0.2] },
            { card: 'Performapal Show Down', title: 'Show Down', color: '#fb923c', face: [0.5, 0.4], pan: [0.3, 0.55] },
            { card: 'Performapal Salutiger', title: 'Salutiger', color: '#fbbf24', face: [0.4, 0.15], pan: [0.45, 0.2] },
            { card: 'Performapal Gold Fang', title: 'Gold Fang', color: '#facc15', face: [0.65, 0.2], pan: [0.4, 0.3] },
            { card: 'Performapal Silver Claw', title: 'Silver Claw', color: '#d1d5db', face: [0.3, 0.25], pan: [0.4, 0.3] },
            { card: 'Performapal Revival', title: 'Revival', color: '#a3e635', face: [0.4, 0.3], pan: [0.3, 0.5] },
            { card: 'Performapal Five-Rainbow Magician', title: 'Five-Rainbow', color: '#f0abfc', face: [0.48, 0.18], pan: [0.35, 0.18] },
            { card: 'Performapal Card Gardna', title: 'Card Gardna', color: '#93c5fd', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Performapal Celestial Magician', title: 'Celestial', color: '#e879f9', face: [0.48, 0.15], pan: [0.4, 0.2] },
            { card: 'Performapal Duelist Extraordinaire', title: 'The finale', color: '#fef08a', face: [0.55, 0.15], pan: [0.2, 0.6] }
        ]
    };

    window.LoreReelData['gunkan'] = {
        kind: 'roster',
        label: 'The Gunkan Sushipyard',
        people: [
            {
                name: 'The shop', group: 'The shop', color: '#fca5a5', forms: [
                    { card: 'Gunkan Sushipyard Seaside Supper Spot', face: [0.35, 0.7], pan: [0.3, 0.7] },
                    { card: 'Gunkan Suship Daily Special', as: 'Daily Special', face: [0.55, 0.5], pan: [0.35, 0.75] }
                ]
            },
            {
                name: 'Shari', group: 'The reviews', color: '#f5f5f4', forms: [
                    { card: 'Gunkan Suship Shari', face: [0.55, 0.55], pan: [0.3, 0.55] },
                    { card: 'Gunkan Suship Shari Red', as: 'Shari Red', face: [0.5, 0.5], pan: [0.3, 0.55] }
                ]
            },
            {
                name: 'Uni', group: 'The reviews', color: '#fb923c', forms: [
                    { card: 'Gunkan Suship Uni', face: [0.55, 0.35], pan: [0.3, 0.5] },
                    { card: 'Gunkan Suship Uni-class Super-Dreadnought', as: 'Super-Dreadnought', face: [0.55, 0.4], pan: [0.25, 0.55] }
                ]
            },
            {
                name: 'Shirauo', group: 'The reviews', color: '#e0f2fe', forms: [
                    { card: 'Gunkan Suship Shirauo', face: [0.5, 0.35], pan: [0.3, 0.5] },
                    { card: 'Gunkan Suship Shirauo-class Carrier', as: 'Carrier', face: [0.3, 0.45], pan: [0.3, 0.55] }
                ]
            },
            {
                name: 'Ikura', group: 'The reviews', color: '#f87171', forms: [
                    { card: 'Gunkan Suship Ikura', face: [0.6, 0.35], pan: [0.3, 0.5] },
                    { card: 'Gunkan Suship Ikura-class Dreadnought', as: 'Dreadnought', face: [0.5, 0.45], pan: [0.25, 0.6] }
                ]
            }
        ]
    };

    window.LoreReelData['ogdoadic'] = {
        kind: 'roster',
        label: 'The eight pillar deities',
        people: [
            {
                name: 'Ogdoabyss', group: 'The sun', color: '#fde047', forms: [
                    { card: 'Ogdoabyss, the Ogdoadic Overlord', face: [0.5, 0.2], pan: [0.35, 0.25] }
                ]
            },
            {
                name: 'Nunu', group: 'Water and life', color: '#5eead4', forms: [
                    { card: 'Nunu, the Ogdoadic Remnant', face: [0.47, 0.18], pan: [0.4, 0.25] },
                    { card: 'Ogdoadic Water Lily', as: 'Water Lily', face: [0.5, 0.5], pan: [0.3, 0.6] }
                ]
            },
            {
                name: 'Nauya', group: 'Water and life', color: '#86efac', forms: [
                    { card: 'Nauya, the Ogdoadic Remnant', face: [0.4, 0.25], pan: [0.4, 0.3] },
                    { card: 'Ogdoadic Origin', as: 'Unarmored', face: [0.5, 0.3], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Aron', group: 'Weather and warmth', color: '#fcd34d', forms: [
                    { card: 'Aron, the Ogdoadic King', face: [0.5, 0.2], pan: [0.4, 0.25] },
                    { card: 'Ogdoadic Serpent Strike', as: 'Serpent Strike', face: [0.3, 0.3], pan: [0.3, 0.45] }
                ]
            },
            {
                name: 'Amunessia', group: 'Weather and warmth', color: '#fda4af', forms: [
                    { card: 'Amunessia, the Ogdoadic Queen', face: [0.45, 0.18], pan: [0.4, 0.2] },
                    { card: 'Ogdoadic Hollow', as: 'Hollow', face: [0.5, 0.2], pan: [0.2, 0.5] }
                ]
            },
            {
                name: 'Flogos', group: 'Time and space', color: '#c4b5fd', forms: [
                    { card: 'Flogos, the Ogdoadic Boundless', face: [0.35, 0.3], pan: [0.35, 0.35] },
                    { card: 'Ogdoadic Calling', as: 'Calling', face: [0.35, 0.3], pan: [0.3, 0.45] }
                ]
            },
            {
                name: 'Zohah', group: 'Time and space', color: '#a5b4fc', forms: [
                    { card: 'Zohah, the Ogdoadic Boundless', face: [0.55, 0.3], pan: [0.35, 0.35] }
                ]
            },
            {
                name: 'Keurse', group: 'Light and darkness', color: '#fef3c7', forms: [
                    { card: 'Keurse, the Ogdoadic Light', face: [0.45, 0.2], pan: [0.35, 0.25] }
                ]
            },
            {
                name: 'Aleirtt', group: 'Light and darkness', color: '#9ca3af', forms: [
                    { card: 'Aleirtt, the Ogdoadic Dark', face: [0.45, 0.25], pan: [0.35, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['ursarctic-drytron'] = {
        kind: 'roster',
        label: 'The star-powered fleets',
        people: [
            {
                name: 'Nebula class', group: 'Ursarctic', color: '#a5b4fc', forms: [
                    { card: 'Ursarctic Septentrion', as: 'Septentrion', face: [0.6, 0.15], pan: [0.4, 0.2] },
                    { card: 'Ursarctic Grand Chariot', as: 'Grand Chariot', face: [0.5, 0.2], pan: [0.4, 0.25] }
                ]
            },
            {
                name: 'Big Dipper', group: 'Ursarctic', color: '#93c5fd', forms: [
                    { card: 'Ursarctic Big Dipper', face: [0.5, 0.4], pan: [0.3, 0.55] }
                ]
            },
            {
                name: 'The polar bears', group: 'Ursarctic', color: '#e0e7ff', forms: [
                    { card: 'Ursarctic Polari', as: 'Polari', face: [0.35, 0.2], pan: [0.3, 0.3] },
                    { card: 'Ursarctic Megapolar', as: 'Megapolar', face: [0.6, 0.2], pan: [0.4, 0.25] },
                    { card: 'Ursarctic Mikpolar', as: 'Mikpolar', face: [0.55, 0.15], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Meteonis', group: 'Drytron', color: '#60a5fa', forms: [
                    { card: 'Drytron Meteonis Draconids', as: 'Draconids', face: [0.5, 0.25], pan: [0.4, 0.3] },
                    { card: 'Drytron Meteonis Quadrantids', as: 'Quadrantids', face: [0.5, 0.25], pan: [0.4, 0.3] }
                ]
            },
            {
                name: 'Fafnir', group: 'Drytron', color: '#fbbf24', forms: [
                    { card: 'Drytron Mu Beta Fafnir', face: [0.45, 0.35], pan: [0.35, 0.4] }
                ]
            },
            {
                name: 'The Draco stars', group: 'Drytron', color: '#fde68a', forms: [
                    { card: 'Drytron Alpha Thuban', as: 'Thuban', face: [0.45, 0.3], pan: [0.35, 0.35] },
                    { card: 'Drytron Gamma Eltanin', as: 'Eltanin', face: [0.7, 0.45], pan: [0.3, 0.45] },
                    { card: 'Drytron Zeta Aldhibah', as: 'Aldhibah', face: [0.35, 0.35], pan: [0.35, 0.4] },
                    { card: 'Drytron Beta Rastaban', as: 'Rastaban', face: [0.35, 0.35], pan: [0.35, 0.4] },
                    { card: 'Drytron Delta Altais', as: 'Altais', face: [0.35, 0.3], pan: [0.3, 0.4] }
                ]
            },
            {
                name: 'Ursatron', group: 'United', color: '#c084fc', forms: [
                    { card: 'Ultimate Flagship Ursatron', face: [0.5, 0.4], pan: [0.3, 0.5] },
                    { card: 'Ursarctic Drytron', as: 'The merger', face: [0.6, 0.7], pan: [0.3, 0.7] }
                ]
            }
        ]
    };

    window.LoreReelData['ninja'] = {
        kind: 'roster',
        label: 'The special ability shinobi',
        people: [
            {
                name: 'Meizen', group: 'The head', color: '#c084fc', forms: [
                    { card: 'Meizen the Battle Ninja', face: [0.45, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'The record', group: 'The head', color: '#e5e7eb', forms: [
                    { card: 'Ninjitsu Art Notebook of Mystery', face: [0.5, 0.4], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Tobari', group: 'Ninjitsu arts', color: '#7dd3fc', forms: [
                    { card: 'Tobari the Sky Ninja', face: [0.45, 0.18], pan: [0.4, 0.2] },
                    { card: 'Ninjitsu Art of Dancing Leaves', as: 'Dancing Leaves', face: [0.5, 0.2], pan: [0.3, 0.3] }
                ]
            },
            {
                name: 'Mitsu', group: 'Ninja weapons', color: '#fde047', forms: [
                    { card: 'Mitsu the Insect Ninja', face: [0.62, 0.2], pan: [0.3, 0.2] },
                    { card: 'Ninjitsu Art Tool - Iron Digger', as: 'Iron Digger', face: [0.75, 0.45], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Kagero', group: 'The main force', color: '#f87171', forms: [
                    { card: 'Kagero the Cannon Ninja', face: [0.15, 0.12], pan: [0.25, 0.15] }
                ]
            },
            {
                name: 'Baku', group: 'The main force', color: '#a8a29e', forms: [
                    { card: 'Baku the Beast Ninja', face: [0.35, 0.6], pan: [0.3, 0.6] }
                ]
            },
            {
                name: 'Jioh', group: 'The main force', color: '#93c5fd', forms: [
                    { card: 'Jioh the Gravity Ninja', face: [0.5, 0.2], pan: [0.4, 0.2] }
                ]
            },
            {
                name: 'Yaguramaru', group: 'The main force', color: '#fb923c', forms: [
                    { card: 'Yaguramaru the Armor Ninja', face: [0.45, 0.2], pan: [0.4, 0.25] }
                ]
            }
        ]
    };

    window.LoreReelData['rescue-ace'] = {
        kind: 'roster',
        label: 'The Rescue-ACE special forces',
        people: [
            {
                name: 'Impulse', group: 'Super exo-armor', color: '#f87171', forms: [
                    { card: 'Rescue-ACE Impulse', face: [0.5, 0.2], pan: [0.4, 0.25] },
                    { card: 'REINFORCE!', as: 'REINFORCE!', face: [0.45, 0.4], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Air Lifter', group: 'Super exo-armor', color: '#7dd3fc', forms: [
                    { card: 'Rescue-ACE Air Lifter', face: [0.45, 0.2], pan: [0.4, 0.25] }
                ]
            },
            {
                name: 'Monitor', group: 'Super exo-armor', color: '#fcd34d', forms: [
                    { card: 'Rescue-ACE Monitor', face: [0.55, 0.25], pan: [0.4, 0.3] }
                ]
            },
            {
                name: 'Turbulence', group: 'Vehicles', color: '#fb923c', forms: [
                    { card: 'Rescue-ACE Turbulence', face: [0.4, 0.3], pan: [0.3, 0.4] }
                ]
            },
            {
                name: 'Fire Attacker', group: 'Vehicles', color: '#fca5a5', forms: [
                    { card: 'Rescue-ACE Fire Attacker', face: [0.5, 0.35], pan: [0.3, 0.45] }
                ]
            },
            {
                name: 'Fire Engine', group: 'Vehicles', color: '#ef4444', forms: [
                    { card: 'Rescue-ACE Fire Engine', face: [0.5, 0.25], pan: [0.35, 0.35] }
                ]
            },
            {
                name: 'HQ', group: 'Command', color: '#e5e7eb', forms: [
                    { card: 'Rescue-ACE HQ', face: [0.5, 0.3], pan: [0.3, 0.5] },
                    { card: 'Rescue-ACE Hydrant', as: 'Hydrant', face: [0.5, 0.2], pan: [0.35, 0.3] }
                ]
            },
            {
                name: 'R-A-C-E', group: 'Procedures', color: '#fde68a', forms: [
                    { card: 'RESCUE!', as: 'RESCUE!', face: [0.45, 0.25], pan: [0.25, 0.7] },
                    { card: 'ALERT!', as: 'ALERT!', face: [0.45, 0.6], pan: [0.25, 0.6] },
                    { card: 'CONTAIN!', as: 'CONTAIN!', face: [0.45, 0.25], pan: [0.25, 0.65] },
                    { card: 'EXTINGUISH!', as: 'EXTINGUISH!', face: [0.5, 0.25], pan: [0.25, 0.7] }
                ]
            }
        ]
    };

    window.LoreReelData['darklord'] = {
        label: 'The maiden exiled from Paradise',
        slides: [
            { card: 'Forbidden Chalice', title: 'The Chalice', color: '#fbbf24', pan: [0.4, 0.2] },
            { card: 'Forbidden Lance', title: 'The Lance', color: '#e5e7eb', pan: [0.4, 0.25] },
            { card: 'Forbidden Dress', title: 'The Dress', color: '#f0abfc', pan: [0.4, 0.2] },
            { card: 'Forbidden Scripture', title: 'The Scripture', color: '#fde68a', pan: [0.4, 0.2] },
            { card: 'Solemn Judgment', title: 'Judgment', color: '#f87171', pan: [0.3, 0.4] },
            { card: 'Condemned Maiden', title: 'Exiled', color: '#c4b5fd', pan: [0.35, 0.15] },
            '|',
            { card: 'Condemned Witch', title: 'The witch', color: '#a78bfa', pan: [0.35, 0.15] },
            { card: 'Indulged Darklord', title: 'The fall spreads', color: '#f9a8d4', pan: [0.35, 0.2] },
            { card: 'Capricious Darklord', title: 'Another fall', color: '#fda4af', pan: [0.35, 0.2], on: ['The maiden'] },
            { card: 'Condemned Darklord', title: 'Rebellion', color: '#e879f9', pan: [0.35, 0.2] },
            { card: 'The First Darklord', title: 'Morningstar', color: '#fde047', pan: [0.35, 0.2] }
        ],
        cast: [
            {
                name: 'The maiden', color: '#c4b5fd', names: ['maiden', 'Maiden', 'Witch', 'Condemned Darklord', 'she', 'her', 'She', 'Her'], forms: [
                    { from: 0, card: 'Forbidden Chalice', as: 'Holy maiden', face: [0.45, 0.18] },
                    { from: 5, card: 'Condemned Maiden', as: 'Condemned Maiden', face: [0.45, 0.12] },
                    { from: 6, card: 'Condemned Witch', as: 'Condemned Witch', face: [0.3, 0.12] },
                    { from: 9, card: 'Condemned Darklord', as: 'Condemned Darklord', face: [0.45, 0.15] }
                ]
            },
            {
                name: 'Morningstar', color: '#fde047', names: ['Morningstar'], forms: [
                    { from: 0, card: 'The First Darklord', face: [0.5, 0.15] }
                ]
            }
        ]
    };

    window.LoreReelData['ryzeal'] = {
        kind: 'roster',
        label: 'The Ryzeal arsenal',
        people: [
            {
                name: 'Ryzeal Cross', group: 'The engine', color: '#fca5a5', forms: [
                    { card: 'Ryzeal Cross', face: [0.5, 0.45], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Sword', group: 'The units', color: '#f87171', forms: [
                    { card: 'Sword Ryzeal', face: [0.45, 0.2], pan: [0.4, 0.25] }
                ]
            },
            {
                name: 'Ice', group: 'The units', color: '#7dd3fc', forms: [
                    { card: 'Ice Ryzeal', face: [0.6, 0.25], pan: [0.35, 0.3] }
                ]
            },
            {
                name: 'Node', group: 'The units', color: '#fde047', forms: [
                    { card: 'Node Ryzeal', face: [0.45, 0.25], pan: [0.35, 0.3] }
                ]
            },
            {
                name: 'Palm', group: 'The units', color: '#fdba74', forms: [
                    { card: 'Palm Ryzeal', face: [0.5, 0.35], pan: [0.3, 0.4] }
                ]
            },
            {
                name: 'Star', group: 'The units', color: '#c4b5fd', forms: [
                    { card: 'Star Ryzeal', face: [0.5, 0.2], pan: [0.35, 0.25] }
                ]
            },
            {
                name: 'Ext', group: 'The units', color: '#fb923c', forms: [
                    { card: 'Ext Ryzeal', face: [0.45, 0.3], pan: [0.35, 0.35] }
                ]
            },
            {
                name: 'Duo Drive', group: 'The heavy units', color: '#fca5a5', forms: [
                    { card: 'Ryzeal Duo Drive', face: [0.5, 0.3], pan: [0.35, 0.35] }
                ]
            },
            {
                name: 'Detonator', group: 'The heavy units', color: '#ef4444', forms: [
                    { card: 'Ryzeal Detonator', face: [0.45, 0.35], pan: [0.35, 0.4] },
                    { card: 'Ryzeal Plasma Hole', as: 'Plasma Hole', face: [0.6, 0.45], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Mass Driver', group: 'The heavy units', color: '#fef08a', forms: [
                    { card: 'Ryzeal Mass Driver', face: [0.75, 0.62], pan: [0.35, 0.6] }
                ]
            }
        ]
    };

    window.LoreReelData['ryu-ge'] = {
        kind: 'roster',
        label: 'The dragon kings of the Ryu-Ge',
        people: [
            {
                name: 'Mistva', group: 'The creator', color: '#e0f2fe', forms: [
                    { card: 'Sosei Ryu-Ge Mistva', face: [0.3, 0.12], pan: [0.35, 0.2] },
                    { card: 'Ryu-Ge Rising', as: 'Rising', face: [0.5, 0.25], pan: [0.3, 0.55] }
                ]
            },
            {
                name: 'Kaiva', group: 'The three kings', color: '#86efac', forms: [
                    { card: 'Kyoro Ryu-Ge Kaiva', face: [0.63, 0.25], pan: [0.35, 0.25] },
                    { card: 'Ryu-Ge Realm - Dino Domains', as: 'Dino Domains', face: [0.5, 0.45], pan: [0.3, 0.55] }
                ]
            },
            {
                name: 'Emva', group: 'The three kings', color: '#7dd3fc', forms: [
                    { card: 'Kairo Ryu-Ge Emva', face: [0.55, 0.25], pan: [0.35, 0.3] },
                    { card: 'Ryu-Ge Realm - Sea Spires', as: 'Sea Spires', face: [0.5, 0.2], pan: [0.25, 0.5] }
                ]
            },
            {
                name: 'Hakva', group: 'The three kings', color: '#fde68a', forms: [
                    { card: 'Genro Ryu-Ge Hakva', face: [0.55, 0.45], pan: [0.35, 0.45] },
                    { card: 'Ryu-Ge Realm - Wyrm Winds', as: 'Wyrm Winds', face: [0.5, 0.25], pan: [0.25, 0.55] }
                ]
            },
            {
                name: 'The rivalry', group: 'The three kings', color: '#fca5a5', forms: [
                    { card: 'Ryu-Ge Rivalry', face: [0.55, 0.4], pan: [0.3, 0.5] }
                ]
            },
            {
                name: 'Anva', group: 'The fallen', color: '#a78bfa', forms: [
                    { card: 'Tensei Ryu-Ge Anva', face: [0.5, 0.15], pan: [0.35, 0.2] }
                ]
            }
        ]
    };

    window.LoreReelData['nemleria'] = {
        kind: 'roster',
        label: 'The dreams of Nemleria',
        people: [
            {
                name: 'Nemleria', group: 'The dreamer', color: '#f9a8d4', forms: [
                    { card: 'Dreaming Nemleria', face: [0.3, 0.15], pan: [0.35, 0.2] },
                    { card: 'Sweet Dreams, Nemleria', as: 'Sweet Dreams', face: [0.55, 0.4], pan: [0.3, 0.4] },
                    { card: 'Dream Tower of Princess Nemleria', as: 'The tower', face: [0.35, 0.35], pan: [0.25, 0.55] }
                ]
            },
            {
                name: 'Dream monsters', group: 'The dream', color: '#fde68a', forms: [
                    { card: 'Nemleria Louve', as: 'Louve', face: [0.25, 0.3], pan: [0.35, 0.35] },
                    { card: 'Nemleria Repeter', as: 'Repeter', face: [0.35, 0.3], pan: [0.3, 0.35] }
                ]
            },
            {
                name: 'Reveil', group: 'The dream', color: '#c084fc', forms: [
                    { card: 'Nemleria Dream Devourer - Reveil', face: [0.5, 0.3], pan: [0.3, 0.35] }
                ]
            },
            {
                name: 'Oreiller', group: 'The dream', color: '#93c5fd', forms: [
                    { card: 'Nemleria Dream Defender - Oreiller', face: [0.5, 0.2], pan: [0.35, 0.25] },
                    { card: 'Dreaming Reality of Nemleria, Realized', as: 'Realized', face: [0.45, 0.3], pan: [0.3, 0.4] }
                ]
            }
        ]
    };

    window.LoreReelData['aroma'] = {
        kind: 'roster',
        label: 'The Aroma Garden',
        people: [
            {
                name: 'Rosalina', group: 'The newcomers', color: '#f0abfc', forms: [
                    { card: 'Aromalilith Rosalina', face: [0.47, 0.2], pan: [0.3, 0.2] }
                ]
            },
            {
                name: 'Angelica', group: 'The newcomers', color: '#fef9c3', forms: [
                    { card: 'Aromaseraphy Angelica', face: [0.47, 0.2], pan: [0.25, 0.2] }
                ]
            },
            {
                name: 'Rosemary', group: 'The garden', color: '#86efac', forms: [
                    { card: 'Aromage Rosemary', face: [0.5, 0.18], pan: [0.3, 0.2] },
                    { card: 'Aromalilith Rosemary', as: 'Aromalilith', face: [0.47, 0.18], pan: [0.3, 0.2] }
                ]
            },
            {
                name: 'Magnolia', group: 'The garden', color: '#fbcfe8', forms: [
                    { card: 'Aromalilith Magnolia', face: [0.5, 0.15], pan: [0.25, 0.18] }
                ]
            },
            {
                name: 'Marjoram', group: 'The garden', color: '#bef264', forms: [
                    { card: 'Aromage Marjoram', face: [0.6, 0.18], pan: [0.3, 0.2] },
                    { card: 'Aroma Blend', as: 'Aroma Blend', face: [0.3, 0.25], pan: [0.3, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['virtual-world'] = {
        kind: 'roster',
        label: 'The residents of the Virtual World',
        people: [
            {
                name: 'Shenshen', group: 'The rulers', color: '#a5f3fc', forms: [
                    { card: 'Virtual World Kyubi - Shenshen', face: [0.35, 0.25], pan: [0.3, 0.3] }
                ]
            },
            {
                name: 'Laolao', group: 'The rulers', color: '#e5e7eb', forms: [
                    { card: 'Virtual World Roshi - Laolao', face: [0.45, 0.2], pan: [0.35, 0.25] }
                ]
            },
            {
                name: 'Kauwloon', group: 'The city', color: '#67e8f9', forms: [
                    { card: 'Virtual World City - Kauwloon', face: [0.5, 0.45], pan: [0.25, 0.55] }
                ]
            },
            {
                name: 'Fanfan', group: 'The Four Great Divine Dragons', color: '#f87171', forms: [
                    { card: 'Virtual World Phoenix - Fanfan', face: [0.5, 0.2], pan: [0.35, 0.25] },
                    { card: 'Virtual World Gate - Chuche', as: 'South gate', face: [0.5, 0.3], pan: [0.25, 0.4] }
                ]
            },
            {
                name: 'Longlong', group: 'The Four Great Divine Dragons', color: '#4ade80', forms: [
                    { card: 'Virtual World Dragon - Longlong', face: [0.35, 0.15], pan: [0.3, 0.2] },
                    { card: 'Virtual World Gate - Qinglong', as: 'East gate', face: [0.4, 0.35], pan: [0.3, 0.45] }
                ]
            },
            {
                name: 'Jaja', group: 'The Four Great Divine Dragons', color: '#94a3b8', forms: [
                    { card: 'Virtual World Shell - Jaja', face: [0.72, 0.2], pan: [0.3, 0.35] },
                    { card: 'Virtual World Gate - Xuanwu', as: 'North gate', face: [0.5, 0.3], pan: [0.3, 0.6] }
                ]
            },
            {
                name: 'The disciples', group: 'Laolao\'s disciples', color: '#f9a8d4', forms: [
                    { card: 'Virtual World Oto-Hime - Toutou', as: 'Toutou', face: [0.5, 0.15], pan: [0.35, 0.2] },
                    { card: 'Virtual World Mai-Hime - Lulu', as: 'Lulu', face: [0.45, 0.15], pan: [0.35, 0.2] },
                    { card: 'Virtual World Hime - Nyannyan', as: 'Nyannyan', face: [0.45, 0.15], pan: [0.35, 0.2] }
                ]
            },
            {
                name: 'Guardian beasts', group: 'Guardian beasts', color: '#fde68a', forms: [
                    { card: 'Virtual World Beast - Jiujiu', as: 'Jiujiu', face: [0.5, 0.2], pan: [0.35, 0.3] },
                    { card: 'Virtual World Kirin - Lili', as: 'Lili', face: [0.5, 0.25], pan: [0.35, 0.3] },
                    { card: 'Virtual World Xiezhi - Jiji', as: 'Jiji', face: [0.45, 0.25], pan: [0.35, 0.3] }
                ]
            }
        ]
    };

    window.LoreReelData['kaiju'] = {
        kind: 'trail',
        label: 'The Kaiju art trail',
        stops: [
            { card: 'Kyoutou Waterfront', title: 'The city', color: '#93c5fd', face: [0.5, 0.15], pan: [0.2, 0.5] },
            { card: 'Dogoran, the Mad Flame Kaiju', title: 'Dogoran', color: '#f87171', face: [0.55, 0.15], pan: [0.3, 0.2] },
            { card: 'Thunder King, the Lightningstrike Kaiju', title: 'Thunder King', color: '#fde047', face: [0.45, 0.3], pan: [0.3, 0.35] },
            { card: 'Super Anti-Kaiju War Machine Mecha-Dogoran', title: 'Mecha-Dogoran', color: '#cbd5e1', face: [0.3, 0.15], pan: [0.25, 0.25] },
            { card: 'Super Anti-Kaiju War Machine Mecha-Thunder-King', title: 'Mecha-Thunder-King', color: '#e5e7eb', face: [0.45, 0.35], pan: [0.3, 0.4] },
            { card: 'Gameciel, the Sea Turtle Kaiju', title: 'Gameciel', color: '#86efac', face: [0.35, 0.2], pan: [0.25, 0.3] },
            { card: 'Jizukiru, the Star Destroying Kaiju', title: 'Jizukiru', color: '#c4b5fd', face: [0.55, 0.25], pan: [0.25, 0.35] },
            { card: 'Radian, the Multidimensional Kaiju', title: 'Radian', color: '#fb923c', face: [0.7, 0.22], pan: [0.25, 0.3] },
            { card: 'Kaiju Capture Mission', title: 'Capture', color: '#fdba74', face: [0.5, 0.4], pan: [0.2, 0.5] },
            { card: 'Gadarla, the Mystery Dust Kaiju', title: 'Gadarla', color: '#f0abfc', face: [0.55, 0.4], pan: [0.35, 0.45] },
            { card: 'Kumongous, the Sticky String Kaiju', title: 'Kumongous', color: '#a3e635', face: [0.45, 0.2], pan: [0.2, 0.35] },
            { card: 'Interrupted Kaiju Slumber', title: 'Slumber', color: '#7dd3fc', face: [0.35, 0.35], pan: [0.3, 0.4] },
            { card: 'The Kaiju Files', title: 'The files', color: '#fef08a', face: [0.35, 0.65], pan: [0.3, 0.6] }
        ]
    };

    window.LoreReelData['crystron'] = {
        kind: 'trail',
        label: 'The Crystron art trail',
        stops: [
            { card: 'Crystron Quan', title: 'Quan', color: '#e0f2fe', face: [0.5, 0.2], pan: [0.3, 0.25] },
            { card: 'Crystron Smiger', title: 'Smiger', color: '#a8a29e', face: [0.88, 0.62], pan: [0.35, 0.55] },
            { card: 'Crystron Entry', title: 'Entry', color: '#7dd3fc', face: [0.4, 0.3], pan: [0.3, 0.4] },
            { card: 'Crystron Citree', title: 'Citree', color: '#fde047', face: [0.5, 0.25], pan: [0.3, 0.3] },
            { card: 'Crystron Thystvern', title: 'Thystvern', color: '#c084fc', face: [0.4, 0.2], pan: [0.3, 0.25] },
            { card: 'Crystron Ametrix', title: 'Ametrix', color: '#e9d5ff', face: [0.5, 0.15], pan: [0.3, 0.25] },
            { card: 'Crystron Rosenix', title: 'Rosenix', color: '#f9a8d4', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Crystron Phoenix', title: 'Phoenix', color: '#fb7185', face: [0.5, 0.15], pan: [0.3, 0.2] },
            { card: 'Crystron Impact', title: 'Impact', color: '#38bdf8', face: [0.6, 0.3], pan: [0.3, 0.4] },
            { card: 'Crystron Inclusion', title: 'Inclusion', color: '#a5b4fc', face: [0.5, 0.25], pan: [0.2, 0.45] },
            { card: 'Crystron Sulfador', title: 'Sulfador', color: '#facc15', face: [0.5, 0.4], pan: [0.3, 0.4] },
            { card: 'Crystron Halqifibrax', title: 'Halqifibrax', color: '#67e8f9', face: [0.5, 0.2], pan: [0.3, 0.25] },
            { card: 'Crystron Quariongandrax', title: 'Quarion\u00ADgandrax', color: '#bae6fd', face: [0.45, 0.2], pan: [0.3, 0.25] },
            { card: 'Metaltron XII, the True Dracombatant', title: 'Metaltron XII', color: '#fde68a', face: [0.5, 0.2], pan: [0.3, 0.25] }
        ]
    };

    window.LoreReelData['lunalight'] = {
        kind: 'trail',
        label: 'The Lunalight art trail',
        stops: [
            { card: 'Lunalight Masquerade', title: 'Masquerade', color: '#c4b5fd', face: [0.25, 0.25], pan: [0.25, 0.4] },
            { card: 'Lunalight White Rabbit', title: 'White Rabbit', color: '#e5e7eb', face: [0.55, 0.15], pan: [0.25, 0.2] },
            { card: 'Lunalight Reincarnation Dance', title: 'Reincarnation', color: '#a5b4fc', face: [0.45, 0.3], pan: [0.3, 0.5] },
            { card: 'Lunalight Purple Butterfly', title: 'Butterfly', color: '#c084fc', face: [0.4, 0.2], pan: [0.3, 0.2] },
            { card: 'Lunalight Fusion', title: 'Fusion', color: '#818cf8', face: [0.2, 0.45], pan: [0.3, 0.5] },
            { card: 'Lunalight Blue Cat', title: 'Blue Cat', color: '#60a5fa', face: [0.4, 0.25], pan: [0.3, 0.25] },
            { card: 'Lunalight Serenade Dance', title: 'Serenade', color: '#93c5fd', face: [0.55, 0.25], pan: [0.3, 0.3] },
            { card: 'Lunalight Cat Dancer', title: 'Cat Dancer', color: '#f0abfc', face: [0.47, 0.2], pan: [0.3, 0.2] },
            { card: 'Lunalight Panther Dancer', title: 'Panther', color: '#a78bfa', face: [0.45, 0.2], pan: [0.3, 0.2] },
            { card: 'Lunalight Leo Dancer', title: 'Leo', color: '#fbbf24', face: [0.5, 0.33], pan: [0.3, 0.33] },
            { card: 'Lunalight Liger Dancer', title: 'Liger', color: '#f59e0b', face: [0.5, 0.15], pan: [0.3, 0.2] },
            { card: 'Lunalight Tiger', title: 'Tiger', color: '#fb923c', face: [0.45, 0.2], pan: [0.3, 0.25] },
            { card: 'Lunalight Wolf', title: 'Wolf', color: '#94a3b8', face: [0.35, 0.2], pan: [0.25, 0.2] },
            { card: 'Lunalight Perfume Dancer', title: 'Perfume', color: '#f9a8d4', face: [0.45, 0.2], pan: [0.3, 0.2] }
        ]
    };

    window.LoreReelData['unchained'] = {
        kind: 'trail',
        label: 'The Unchained art trail',
        stops: [
            { card: 'Abomination\'s Prison', title: 'The prison', color: '#fca5a5', face: [0.4, 0.2], pan: [0.25, 0.45] },
            { card: 'Unchained Twins - Aruha', title: 'Aruha', color: '#f87171', face: [0.45, 0.2], pan: [0.3, 0.2] },
            { card: 'Unchained Twins - Rakea', title: 'Rakea', color: '#93c5fd', face: [0.35, 0.2], pan: [0.3, 0.2] },
            { card: 'Unchained Soul of Rage', title: 'Rage', color: '#ef4444', face: [0.4, 0.3], pan: [0.3, 0.35] },
            { card: 'Unchained Soul of Anguish', title: 'Anguish', color: '#60a5fa', face: [0.5, 0.25], pan: [0.3, 0.3] },
            { card: 'Escape of the Unchained', title: 'Escape', color: '#fde047', face: [0.4, 0.2], pan: [0.25, 0.3] },
            { card: 'Unchained Syncretism', title: 'Syncretism', color: '#86efac', face: [0.4, 0.3], pan: [0.3, 0.5] },
            { card: 'Unchained Soul Rage Abominator', title: 'Abominator', color: '#dc2626', face: [0.4, 0.25], pan: [0.3, 0.3] },
            { card: 'Unchained Abomination', title: 'Abomination', color: '#a855f7', face: [0.45, 0.3], pan: [0.3, 0.35] },
            { card: 'Unchained Soul of Sharvara', title: 'Sharvara', color: '#fb923c', face: [0.5, 0.25], pan: [0.3, 0.3] },
            { card: 'Unchained Soul of Shyama', title: 'Shyama', color: '#94a3b8', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Unchained Twins - Sarama', title: 'Sarama', color: '#fcd34d', face: [0.5, 0.25], pan: [0.3, 0.3] },
            { card: 'Unchained Soul Lord of Yama', title: 'Yama', color: '#b91c1c', face: [0.4, 0.25], pan: [0.3, 0.3] },
            { card: 'Unchained Enma Lord Yama', title: 'Enma', color: '#fda4af', face: [0.45, 0.25], pan: [0.3, 0.3] }
        ]
    };

    window.LoreReelData['dual-avatar'] = {
        kind: 'trail',
        label: 'The Dual Avatar art trail',
        stops: [
            { card: 'Dual Avatar Fists - Yuhi', title: 'Yuhi', color: '#fdba74', face: [0.3, 0.2], pan: [0.3, 0.2] },
            { card: 'Dual Avatar Feet - Kokoku', title: 'Kokoku', color: '#fcd34d', face: [0.5, 0.2], pan: [0.3, 0.2] },
            { card: 'Dual Avatar Invitation', title: 'Invitation', color: '#fb923c', face: [0.4, 0.25], pan: [0.3, 0.3] },
            { card: 'Dual Avatar Fists - Armored Ah-Gyo', title: 'Ah-Gyo', color: '#f87171', face: [0.6, 0.25], pan: [0.3, 0.3] },
            { card: 'Dual Avatar Feet - Armored Un-Gyo', title: 'Un-Gyo', color: '#60a5fa', face: [0.35, 0.12], pan: [0.25, 0.2] },
            { card: 'Perfect Sync - A-Un', title: 'Perfect Sync', color: '#fde68a', face: [0.75, 0.25], pan: [0.3, 0.3] },
            { card: 'Dual Avatar - Manifested A-Un', title: 'A-Un', color: '#fef9c3', face: [0.3, 0.25], pan: [0.3, 0.3] },
            { card: 'Dual Avatar - Empowered Kon-Gyo', title: 'Kon-Gyo', color: '#fbbf24', face: [0.45, 0.2], pan: [0.3, 0.25] },
            { card: 'Dual Avatar Defeating Evil', title: 'Defeating Evil', color: '#ef4444', face: [0.5, 0.4], pan: [0.3, 0.45] },
            { card: 'Dual Avatar - Empowered Mitsu-Jaku', title: 'Mitsu-Jaku', color: '#f97316', face: [0.45, 0.12], pan: [0.25, 0.2] },
            { card: 'Dual Avatar Ascendance', title: 'Ascendance', color: '#fdba74', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Dual Avatar Compact', title: 'Compact', color: '#a5b4fc', face: [0.3, 0.2], pan: [0.3, 0.3] }
        ]
    };

    window.LoreReelData['marincess'] = {
        kind: 'trail',
        label: 'The Marincess art trail',
        stops: [
            { card: 'Marincess Sea Angel', title: 'Sea Angel', color: '#bae6fd', face: [0.45, 0.2], pan: [0.3, 0.2] },
            { card: 'Marincess Dive', title: 'Dive', color: '#7dd3fc', face: [0.5, 0.25], pan: [0.3, 0.3] },
            { card: 'Marincess Blue Tang', title: 'Blue Tang', color: '#3b82f6', face: [0.5, 0.12], pan: [0.25, 0.15] },
            { card: 'Marincess Blue Slug', title: 'Blue Slug', color: '#818cf8', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Marincess Cascade', title: 'Cascade', color: '#a5f3fc', face: [0.5, 0.5], pan: [0.3, 0.5] },
            { card: 'Marincess Marbled Rock', title: 'Marbled Rock', color: '#fbbf24', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Marincess Coral Anemone', title: 'Coral Anemone', color: '#fb7185', face: [0.45, 0.12], pan: [0.25, 0.2] },
            { card: 'Marincess Crown Tail', title: 'Crown Tail', color: '#f87171', face: [0.45, 0.15], pan: [0.25, 0.2] },
            { card: 'Marincess Mandarin', title: 'Mandarin', color: '#fb923c', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Marincess Coral Triangle', title: 'Coral Triangle', color: '#f472b6', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Marincess Crystal Heart', title: 'Crystal Heart', color: '#67e8f9', face: [0.5, 0.5], pan: [0.3, 0.5] },
            { card: 'Marincess Circulation', title: 'Circulation', color: '#22d3ee', face: [0.35, 0.2], pan: [0.25, 0.3] },
            { card: 'Marincess Great Bubble Reef', title: 'Great Bubble Reef', color: '#e0f2fe', face: [0.5, 0.12], pan: [0.25, 0.18] },
            { card: 'Marincess Aqua Argonaut', title: 'Aqua Argonaut', color: '#93c5fd', face: [0.5, 0.15], pan: [0.25, 0.2] }
        ]
    };

    window.LoreReelData['burning-abyss'] = {
        kind: 'trail',
        label: 'The Burning Abyss art trail',
        stops: [
            { card: 'The Traveler and the Burning Abyss', title: 'The gate', color: '#c4b5fd', face: [0.25, 0.8], pan: [0.3, 0.7] },
            { card: 'Dante, Traveler of the Burning Abyss', title: 'Dante', color: '#e9d5ff', face: [0.5, 0.15], pan: [0.3, 0.2] },
            { card: 'Virgil, Rock Star of the Burning Abyss', title: 'Virgil', color: '#fde68a', face: [0.48, 0.18], pan: [0.3, 0.2] },
            { card: 'Good & Evil in the Burning Abyss', title: 'Good & Evil', color: '#f0abfc', face: [0.5, 0.45], pan: [0.4, 0.45] },
            { card: 'Malacoda, Netherlord of the Burning Abyss', title: 'Malacoda', color: '#f87171', face: [0.55, 0.15], pan: [0.3, 0.2] },
            { card: 'Scarm, Malebranche of the Burning Abyss', title: 'Scarm', color: '#a78bfa', face: [0.45, 0.2], pan: [0.3, 0.25] },
            { card: 'Cir, Malebranche of the Burning Abyss', title: 'Cir', color: '#fdba74', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Graff, Malebranche of the Burning Abyss', title: 'Graff', color: '#fca5a5', face: [0.55, 0.3], pan: [0.3, 0.35] },
            { card: 'Draghig, Malebranche of the Burning Abyss', title: 'Draghig', color: '#86efac', face: [0.4, 0.2], pan: [0.3, 0.25] },
            { card: 'Fire Lake of the Burning Abyss', title: 'Fire Lake', color: '#ef4444', face: [0.4, 0.55], pan: [0.4, 0.55] },
            { card: 'Cherubini, Ebon Angel of the Burning Abyss', title: 'Cherubini', color: '#94a3b8', face: [0.55, 0.3], pan: [0.3, 0.35] },
            { card: 'The Terminus of the Burning Abyss', title: 'Terminus', color: '#fef08a', face: [0.65, 0.22], pan: [0.2, 0.3] },
            { card: 'Dante, Pilgrim of the Burning Abyss', title: 'Pilgrim', color: '#fbbf24', face: [0.45, 0.12], pan: [0.25, 0.2] }
        ]
    };

    window.LoreReelData['meklord'] = {
        kind: 'trail',
        label: 'The Meklord art trail',
        stops: [
            { card: 'Meklord Emperor Wisel', title: 'Wisel', color: '#f1f5f9', face: [0.6, 0.2], pan: [0.25, 0.3] },
            { card: 'Meklord Emperor Wisel - Synchro Absorption', title: 'Absorption', color: '#bae6fd', face: [0.3, 0.25], pan: [0.3, 0.4] },
            { card: 'Meklord Emperor Skiel', title: 'Skiel', color: '#93c5fd', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Meklord Emperor Granel', title: 'Granel', color: '#fdba74', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Meklord Assembly', title: 'Assembly', color: '#fb923c', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Meklord Astro Mekanikle', title: 'Mekanikle', color: '#e5e7eb', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Meklord Nucleus Infinity Core', title: 'Infinity Core', color: '#fde68a', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Meklord Army of Wisel', title: 'Army of Wisel', color: '#cbd5e1', face: [0.6, 0.22], pan: [0.25, 0.3] },
            { card: 'Meklord Army of Skiel', title: 'Army of Skiel', color: '#7dd3fc', face: [0.55, 0.35], pan: [0.35, 0.4] },
            { card: 'Meklord Army of Granel', title: 'Army of Granel', color: '#fdba74', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Meklord Astro the Eradicator', title: 'Eradicator', color: '#a5b4fc', face: [0.35, 0.25], pan: [0.25, 0.45] },
            { card: 'Meklord Astro Dragon Asterisk', title: 'Asterisk', color: '#c4b5fd', face: [0.5, 0.25], pan: [0.3, 0.35] },
            { card: 'Meklord Astro Dragon Triskelion', title: 'Triskelion', color: '#f0abfc', face: [0.4, 0.4], pan: [0.3, 0.45] },
            { card: 'Meklord Factory', title: 'Factory', color: '#94a3b8', face: [0.5, 0.3], pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['simorgh'] = {
        kind: 'trail',
        label: 'The Simorgh art trail',
        stops: [
            { card: 'Simorgh, Bird of Divinity', title: 'Divinity', color: '#86efac', face: [0.5, 0.12], pan: [0.25, 0.25] },
            { card: 'Simorgh, Bird of Beginning', title: 'Beginning', color: '#bbf7d0', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Simorgh, Lord of the Storm', title: 'Lord of the Storm', color: '#4ade80', face: [0.5, 0.25], pan: [0.25, 0.3] },
            { card: 'Elborz, the Sacred Lands of Simorgh', title: 'Elborz', color: '#a3e635', face: [0.3, 0.15], pan: [0.2, 0.5] },
            { card: 'Dark Simorgh', title: 'Dark Simorgh', color: '#a78bfa', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Simorgh of Darkness', title: 'Of Darkness', color: '#8b5cf6', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Simorgh Sky Battle', title: 'Sky Battle', color: '#c4b5fd', face: [0.5, 0.3], pan: [0.3, 0.5] },
            { card: 'Simorgh, Bird of Sovereignty', title: 'Sovereignty', color: '#fde047', face: [0.5, 0.25], pan: [0.25, 0.3] },
            { card: 'Simorgh, Bird of Calamity', title: 'Calamity', color: '#f87171', face: [0.6, 0.3], pan: [0.3, 0.35] },
            { card: 'Simorgh, Bird of Perfection', title: 'Perfection', color: '#fb7185', face: [0.4, 0.3], pan: [0.3, 0.35] },
            { card: 'Simorgh Onslaught', title: 'Onslaught', color: '#fca5a5', face: [0.4, 0.4], pan: [0.3, 0.5] },
            { card: 'Simorgh, Bird of Ancestry', title: 'Ancestry', color: '#fde68a', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Simorgh, Bird of Bringing', title: 'Bringing', color: '#fef08a', face: [0.4, 0.25], pan: [0.25, 0.3] },
            { card: 'Simorgh Repulsion', title: 'Repulsion', color: '#bef264', face: [0.4, 0.45], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['angelechy'] = {
        kind: 'trail',
        label: 'The Angelechy art trail',
        stops: [
            { card: 'Angelechy Shatranga', title: 'Shatranga', color: '#fef08a', face: [0.5, 0.12], pan: [0.2, 0.25] },
            { card: 'Angelechy Opening to e4', title: 'Opening', color: '#fde68a', face: [0.6, 0.25], pan: [0.25, 0.4] },
            { card: 'Angelechy Enlisted', title: 'Enlisted', color: '#e5e7eb', face: [0.5, 0.25], pan: [0.25, 0.35] },
            { card: 'Angelechy Destrier', title: 'Destrier', color: '#fcd34d', face: [0.45, 0.3], pan: [0.3, 0.35] },
            { card: 'Angelechy Bastion', title: 'Bastion', color: '#d6d3d1', face: [0.5, 0.25], pan: [0.3, 0.35] },
            { card: 'Angelechy Disturbance', title: 'Disturbance', color: '#a8a29e', face: [0.3, 0.3], pan: [0.3, 0.4] },
            { card: 'Angelechy Problem', title: 'Problem', color: '#fdba74', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Angelechy Endgame Problem', title: 'Endgame', color: '#fbbf24', face: [0.5, 0.35], pan: [0.3, 0.4] }
        ]
    };

    window.LoreReelData['floowandereeze'] = {
        kind: 'trail',
        label: 'The Floowandereeze art trail',
        stops: [
            { card: 'Floowandereeze and the Magnificent Map', title: 'The map', color: '#7dd3fc', face: [0.5, 0.5], pan: [0.3, 0.6] },
            { card: 'Floowandereeze and the Advent of Adventure', title: 'Setting out', color: '#bae6fd', face: [0.55, 0.15], pan: [0.25, 0.4] },
            { card: 'Floowandereeze & Snowl', title: 'Snowl', color: '#f1f5f9', face: [0.45, 0.15], pan: [0.25, 0.45] },
            { card: 'Floowandereeze & Robina', title: 'Robina', color: '#fca5a5', face: [0.35, 0.3], pan: [0.3, 0.35] },
            { card: 'Floowandereeze & Eglen', title: 'Eglen', color: '#fde68a', face: [0.65, 0.3], pan: [0.3, 0.4] },
            { card: 'Floowandereeze & Stri', title: 'Stri', color: '#fdba74', face: [0.7, 0.12], pan: [0.2, 0.35] },
            { card: 'Floowandereeze & Toccan', title: 'Toccan', color: '#86efac', face: [0.25, 0.45], pan: [0.35, 0.45] },
            { card: 'Floowandereeze & Empen', title: 'Empen', color: '#93c5fd', face: [0.65, 0.45], pan: [0.3, 0.5] },
            { card: 'Floowandereeze and the Unexplored Winds', title: 'Journey\'s end', color: '#e0f2fe', face: [0.45, 0.6], pan: [0.3, 0.6] }
        ]
    };

    window.LoreReelData['chronomaly'] = {
        kind: 'trail',
        label: 'The Chronomaly art trail',
        stops: [
            { card: 'Chronomaly Crystal Skull', title: 'Crystal Skull', color: '#e0f2fe', face: [0.5, 0.4], pan: [0.4, 0.4] },
            { card: 'Chronomaly Crystal Bones', title: 'Crystal Bones', color: '#cbd5e1', face: [0.5, 0.2], pan: [0.3, 0.25] },
            { card: 'Chronomaly Crystal Chrononaut', title: 'Chrononaut', color: '#a5f3fc', face: [0.5, 0.2], pan: [0.3, 0.3] },
            { card: 'Chronomaly Golden Jet', title: 'Golden Jet', color: '#fcd34d', face: [0.5, 0.4], pan: [0.35, 0.4] },
            { card: 'Chronomaly Moai', title: 'Moai', color: '#a8a29e', face: [0.6, 0.35], pan: [0.3, 0.4] },
            { card: 'Chronomaly Esperanza Glyph', title: 'Esperanza', color: '#fde68a', face: [0.55, 0.4], pan: [0.3, 0.45] },
            { card: 'Chronomaly Colossal Head', title: 'Colossal Head', color: '#d6d3d1', face: [0.5, 0.45], pan: [0.4, 0.45] },
            { card: 'Chronomaly Pyramid Eye Tablet', title: 'Eye Tablet', color: '#86efac', face: [0.5, 0.75], pan: [0.3, 0.7] },
            { card: 'Chronomaly Cabrera Trebuchet', title: 'Trebuchet', color: '#fb923c', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Chronomaly Aztec Mask Golem', title: 'Aztec Mask', color: '#f87171', face: [0.5, 0.15], pan: [0.3, 0.2] },
            { card: 'Chronomaly Mud Golem', title: 'Mud Golem', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.3, 0.25] },
            { card: 'Number 33: Chronomaly Machu Mech', title: 'Machu Mech', color: '#67e8f9', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Number 36: Chronomaly Chateau Huyuk', title: 'Chateau Huyuk', color: '#22d3ee', face: [0.5, 0.45], pan: [0.4, 0.45] },
            { card: 'Number 6: Chronomaly Atlandis', title: 'Atlandis', color: '#38bdf8', face: [0.45, 0.5], pan: [0.3, 0.55] }
        ]
    };

    window.LoreReelData['gouki'] = {
        kind: 'trail',
        label: 'The Gouki art trail',
        stops: [
            { card: 'Gouki The Great Ogre', title: 'Great Ogre', color: '#fca5a5', face: [0.5, 0.12], pan: [0.25, 0.2] },
            { card: 'Gouki Face Turn', title: 'Face turn', color: '#fde68a', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Gouki Cage Match', title: 'Cage match', color: '#a8a29e', face: [0.3, 0.25], pan: [0.25, 0.45] },
            { card: 'Gouki Thunder Ogre', title: 'Thunder Ogre', color: '#fde047', face: [0.5, 0.12], pan: [0.25, 0.2] },
            { card: 'Gouki Gameface', title: 'Gameface', color: '#86efac', face: [0.7, 0.35], pan: [0.3, 0.4] },
            { card: 'Gouki The Tyrant Ogre', title: 'Tyrant Ogre', color: '#ef4444', face: [0.6, 0.2], pan: [0.25, 0.3] },
            { card: 'Gouki The Master Ogre', title: 'Master Ogre', color: '#fdba74', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Gouki Finishing Move', title: 'Finishing move', color: '#f97316', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Gouki Suprex', title: 'Suprex', color: '#a3e635', face: [0.45, 0.12], pan: [0.25, 0.2] },
            { card: 'Gouki Twistcobra', title: 'Twistcobra', color: '#4ade80', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Gouki Moonsault', title: 'Moonsault', color: '#e0f2fe', face: [0.4, 0.15], pan: [0.25, 0.2] },
            { card: 'Gouki Headbatt', title: 'Headbatt', color: '#c4b5fd', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Gouki Octostretch', title: 'Octostretch', color: '#f9a8d4', face: [0.4, 0.15], pan: [0.25, 0.2] },
            { card: 'Gouki The Solid Ogre', title: 'Solid Ogre', color: '#d6d3d1', face: [0.5, 0.15], pan: [0.25, 0.2] }
        ]
    };

    window.LoreReelData['deskbot'] = {
        kind: 'trail',
        label: 'The Deskbot art trail',
        stops: [
            { card: 'Deskbot Base', title: 'The base', color: '#86efac', face: [0.6, 0.4], pan: [0.3, 0.5] },
            { card: 'Deskbot Jet', title: 'The jet', color: '#bbf7d0', face: [0.4, 0.55], pan: [0.3, 0.55] },
            { card: 'Deskbot 001', title: '001', color: '#fde68a', face: [0.45, 0.3], pan: [0.3, 0.35] },
            { card: 'Deskbot 002', title: '002', color: '#fbcfe8', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Deskbot 003', title: '003', color: '#7dd3fc', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Deskbot 004', title: '004', color: '#fdba74', face: [0.45, 0.25], pan: [0.3, 0.3] },
            { card: 'Deskbot 005', title: '005', color: '#fef08a', face: [0.4, 0.25], pan: [0.3, 0.3] },
            { card: 'Deskbot 006', title: '006', color: '#d1d5db', face: [0.5, 0.25], pan: [0.3, 0.3] },
            { card: 'Deskbot 008', title: '008', color: '#a5b4fc', face: [0.45, 0.2], pan: [0.3, 0.3] },
            { card: 'Deskbot 009', title: '009', color: '#4ade80', face: [0.5, 0.25], pan: [0.3, 0.3] }
        ]
    };

    window.LoreReelData['materiactor'] = {
        kind: 'trail',
        label: 'The Materiactor art trail',
        stops: [
            { card: 'Prima Materiactor', title: 'Prima', color: '#e9d5ff', face: [0.3, 0.2], pan: [0.3, 0.4] },
            { card: 'Materiactor Meltthrough', title: 'Meltthrough', color: '#f472b6', face: [0.45, 0.25], pan: [0.25, 0.45] },
            { card: 'Materiactor Gigaboros', title: 'Gigaboros', color: '#c084fc', face: [0.25, 0.4], pan: [0.3, 0.45] },
            { card: 'Materiactor Meltdown', title: 'Meltdown', color: '#e879f9', face: [0.5, 0.45], pan: [0.35, 0.5] },
            { card: 'Materiactor Annulus', title: 'Annulus', color: '#a78bfa', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Materiactor Gigadra', title: 'Gigadra', color: '#d8b4fe', face: [0.65, 0.25], pan: [0.3, 0.35] },
            { card: 'Materiactor Exagard', title: 'Exagard', color: '#67e8f9', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Materiactor Critical', title: 'Critical', color: '#22d3ee', face: [0.5, 0.45], pan: [0.35, 0.5] },
            { card: 'Materiactor Exareptor', title: 'Exareptor', color: '#a5f3fc', face: [0.45, 0.45], pan: [0.4, 0.5] }
        ]
    };

    window.LoreReelData['inzektor'] = {
        kind: 'trail',
        label: 'The Inzektor art trail',
        stops: [
            { card: 'Inzektor Ant', title: 'Ant', color: '#86efac', face: [0.55, 0.15], pan: [0.25, 0.2] },
            { card: 'Inzektor Giga-Mantis', title: 'Giga-Mantis', color: '#4ade80', face: [0.5, 0.12], pan: [0.25, 0.2] },
            { card: 'Inzektor Giga-Weevil', title: 'Giga-Weevil', color: '#a3e635', face: [0.45, 0.15], pan: [0.25, 0.2] },
            { card: 'Inzektor Exa-Beetle', title: 'Exa-Beetle', color: '#facc15', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Inzektor Axe - Zektahawk', title: 'Zektahawk', color: '#fde047', face: [0.5, 0.5], pan: [0.35, 0.5] },
            { card: 'Inzektor Exa-Stag', title: 'Exa-Stag', color: '#e5e7eb', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Inzektor Crossbow - Zektarrow', title: 'Zektarrow', color: '#cbd5e1', face: [0.4, 0.5], pan: [0.35, 0.5] },
            { card: 'Inzektor Dragonfly', title: 'Dragonfly', color: '#7dd3fc', face: [0.45, 0.25], pan: [0.3, 0.3] },
            { card: 'Inzektor Hornet', title: 'Hornet', color: '#fbbf24', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Inzektor Hopper', title: 'Hopper', color: '#bef264', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Inzektor Firefly', title: 'Firefly', color: '#fef08a', face: [0.3, 0.15], pan: [0.25, 0.2] },
            { card: 'Inzektor Giga-Cricket', title: 'Giga-Cricket', color: '#fdba74', face: [0.5, 0.2], pan: [0.25, 0.25] }
        ]
    };

    window.LoreReelData['deep-sea'] = {
        label: 'Magellanica, the Deep Sea City',
        slides: [
            { card: 'Magellanica, the Deep Sea City', title: 'The city', color: '#7dd3fc', pan: [0.3, 0.6] },
            { card: 'Deep Sea Minstrel', title: 'The music hall', color: '#a5f3fc', pan: [0.4, 0.25] },
            { card: 'Deep Sea Aria', title: 'The artists', color: '#93c5fd', pan: [0.55, 0.2] },
            { card: 'Deep Sea Diva', title: 'The news', color: '#f9a8d4', pan: [0.4, 0.15] },
            { card: 'Deep Sea Artisan', title: 'The gift', color: '#fde68a', pan: [0.4, 0.2] },
            { card: 'Deep Sea Prima Donna', title: 'Prima Donna', color: '#f472b6', pan: [0.4, 0.15] }
        ],
        cast: [
            {
                name: 'Diva', color: '#f9a8d4', names: ['Diva', 'Prima Donna'], forms: [
                    { from: 0, card: 'Deep Sea Diva', face: [0.6, 0.1] },
                    { from: 5, card: 'Deep Sea Prima Donna', as: 'Prima Donna', face: [0.5, 0.15] }
                ]
            },
            {
                name: 'Artisan', color: '#fde68a', names: ['Artisan'], forms: [
                    { from: 0, card: 'Deep Sea Artisan', face: [0.35, 0.2] }
                ]
            }
        ]
    };

    window.LoreReelData['earthbound'] = {
        kind: 'trail',
        label: 'The Earthbound art trail',
        stops: [
            { card: 'Earthbound Immortal Wiraqocha Rasca', title: 'Wiraqocha Rasca', color: '#c4b5fd', face: [0.5, 0.3], pan: [0.25, 0.4] },
            { card: 'Ultimate Earthbound Immortal', title: 'The purple fire', color: '#a78bfa', face: [0.3, 0.15], pan: [0.25, 0.4] },
            { card: 'Earthbound Linewalker', title: 'Linewalker', color: '#ddd6fe', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Earthbound Greater Linewalker', title: 'Greater', color: '#e9d5ff', face: [0.5, 0.12], pan: [0.2, 0.2] },
            { card: 'Earthbound Immortal Uru', title: 'Uru', color: '#a855f7', face: [0.5, 0.3], pan: [0.25, 0.4] },
            { card: 'Earthbound Immortal Ccapac Apu', title: 'Ccapac Apu', color: '#f87171', face: [0.5, 0.25], pan: [0.25, 0.35] },
            { card: 'Earthbound Release', title: 'Release', color: '#fca5a5', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Earthbound Immortal Ccarayhua', title: 'Ccarayhua', color: '#86efac', face: [0.35, 0.15], pan: [0.25, 0.3] },
            { card: 'Earthbound Immortal Aslla piscu', title: 'Aslla piscu', color: '#fde68a', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Earthbound Whirlwind', title: 'Whirlwind', color: '#fef08a', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Earthbound Immortal Chacu Challhua', title: 'Chacu Challhua', color: '#7dd3fc', face: [0.35, 0.25], pan: [0.25, 0.35] },
            { card: 'Earthbound Immortal Cusillu', title: 'Cusillu', color: '#fdba74', face: [0.7, 0.25], pan: [0.25, 0.4] },
            { card: 'Earthbound Prison', title: 'The Hands', color: '#d6d3d1', face: [0.5, 0.35], pan: [0.3, 0.45] },
            { card: 'Earthbound Immortal Red Nova', title: 'Red Nova', color: '#ef4444', face: [0.5, 0.2], pan: [0.25, 0.3] }
        ]
    };

    window.LoreReelData['malefic'] = {
        kind: 'trail',
        label: 'The Malefic art trail',
        stops: [
            { card: 'Malefic World', title: 'Malefic World', color: '#c4b5fd', face: [0.5, 0.35], pan: [0.3, 0.5] },
            { card: 'Malefic Territory', title: 'Territory', color: '#a78bfa', face: [0.3, 0.2], pan: [0.25, 0.35] },
            { card: 'Malefic Cyber End Dragon', title: 'Cyber End', color: '#94a3b8', face: [0.6, 0.55], pan: [0.35, 0.5] },
            { card: 'Malefic Rainbow Dragon', title: 'Rainbow', color: '#f0abfc', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Malefic Stardust Dragon', title: 'Stardust', color: '#93c5fd', face: [0.5, 0.25], pan: [0.25, 0.3] },
            { card: 'Malefic Divide', title: 'Divide', color: '#e879f9', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Malefic Force', title: 'Force', color: '#d8b4fe', face: [0.5, 0.75], pan: [0.3, 0.65] },
            { card: 'Malefic Blue-Eyes White Dragon', title: 'Blue-Eyes', color: '#bae6fd', face: [0.7, 0.4], pan: [0.3, 0.4] },
            { card: 'Malefic Red-Eyes Black Dragon', title: 'Red-Eyes', color: '#fca5a5', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Malefic Parallel Gear', title: 'Parallel Gear', color: '#e5e7eb', face: [0.5, 0.25], pan: [0.25, 0.4] },
            { card: 'Malefic Paradox Gear', title: 'Paradox Gear', color: '#d1d5db', face: [0.5, 0.3], pan: [0.25, 0.4] },
            { card: 'Malefic Paradox Dragon', title: 'Paradox Dragon', color: '#f5f5f4', face: [0.5, 0.4], pan: [0.3, 0.45] },
            { card: 'Malefic Paradigm Shift', title: 'Paradigm Shift', color: '#fde68a', face: [0.3, 0.4], pan: [0.3, 0.45] },
            { card: 'Malefic Truth Dragon', title: 'Truth Dragon', color: '#facc15', face: [0.6, 0.45], pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['igknight'] = {
        kind: 'trail',
        label: 'The Igknight art trail',
        stops: [
            { card: 'Ignition Phoenix', title: 'The squad', color: '#fca5a5', face: [0.5, 0.3], pan: [0.3, 0.5] },
            { card: 'Igknight Templar', title: 'Templar', color: '#fdba74', face: [0.45, 0.15], pan: [0.25, 0.2] },
            { card: 'Igknight Crusader', title: 'Crusader', color: '#f87171', face: [0.55, 0.15], pan: [0.25, 0.2] },
            { card: 'Igknight Squire', title: 'Squire', color: '#e5e7eb', face: [0.55, 0.12], pan: [0.25, 0.2] },
            { card: 'Igknight Paladin', title: 'Paladin', color: '#93c5fd', face: [0.45, 0.15], pan: [0.25, 0.2] },
            { card: 'Igknight Cavalier', title: 'Cavalier', color: '#f9a8d4', face: [0.55, 0.15], pan: [0.25, 0.2] },
            { card: 'Bad Aim', title: 'Bad aim', color: '#fde047', face: [0.6, 0.35], pan: [0.3, 0.45] },
            { card: 'Oops!', title: 'Oops!', color: '#fb923c', face: [0.3, 0.2], pan: [0.3, 0.4] },
            { card: 'Igknight Margrave', title: 'Margrave', color: '#a8a29e', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Igknight Gallant', title: 'Gallant', color: '#fcd34d', face: [0.5, 0.2], pan: [0.25, 0.25] },
            { card: 'Igknight Champion', title: 'Champion', color: '#ef4444', face: [0.4, 0.15], pan: [0.25, 0.2] },
            { card: 'Igknights Unite', title: 'Unite', color: '#fecaca', face: [0.5, 0.3], pan: [0.3, 0.4] }
        ]
    };

    window.LoreReelData['ghoti'] = {
        kind: 'trail',
        label: 'The Ghoti art trail',
        stops: [
            { card: 'Psiics, Moonlight of the Ghoti', title: 'Psiics', color: '#a5f3fc', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Keaf, Murk of the Ghoti', title: 'Keaf', color: '#94a3b8', face: [0.5, 0.25], pan: [0.3, 0.3] },
            { card: 'Paces, Light of the Ghoti', title: 'Paces', color: '#fef9c3', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Askaan, the Bicorned Ghoti', title: 'Askaan', color: '#7dd3fc', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Ghoti Chain', title: 'Chain', color: '#38bdf8', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Guoglim, Spear of the Ghoti', title: 'Guoglim', color: '#67e8f9', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Ghoti Fury', title: 'Fury', color: '#22d3ee', face: [0.4, 0.3], pan: [0.3, 0.4] },
            { card: 'Shif, Fairy of the Ghoti', title: 'Shif', color: '#bae6fd', face: [0.72, 0.4], pan: [0.3, 0.4] },
            { card: 'Eanoc, Sentry of the Ghoti', title: 'Eanoc', color: '#0ea5e9', face: [0.6, 0.35], pan: [0.3, 0.4] },
            { card: 'Ixeep, Omen of the Ghoti', title: 'Ixeep', color: '#c4b5fd', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Arionpos, Serpent of the Ghoti', title: 'Arionpos', color: '#a78bfa', face: [0.4, 0.35], pan: [0.3, 0.4] },
            { card: 'Ghoti of the Deep Beyond', title: 'Deep Beyond', color: '#e0f2fe', face: [0.7, 0.25], pan: [0.3, 0.35] }
        ]
    };

    window.LoreReelData['infernity'] = {
        kind: 'trail',
        label: 'The Infernity art trail',
        stops: [
            { card: 'Infernity Archfiend', title: 'Archfiend', color: '#c4b5fd', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Infernity Doom Archfiend', title: 'Doom Archfiend', color: '#a78bfa', face: [0.5, 0.12], pan: [0.25, 0.2] },
            { card: 'Infernity Launcher', title: 'Launcher', color: '#f87171', face: [0.6, 0.35], pan: [0.3, 0.4] },
            { card: 'Infernity Avenger', title: 'Avenger', color: '#fca5a5', face: [0.5, 0.3], pan: [0.25, 0.3] },
            { card: 'Infernity Force', title: 'Force', color: '#fde68a', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Infernity Paranoia', title: 'Paranoia', color: '#e9d5ff', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Infernity Doom Dragon', title: 'Doom Dragon', color: '#ef4444', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Infernity Barrier', title: 'Barrier', color: '#d8b4fe', face: [0.35, 0.4], pan: [0.3, 0.45] },
            { card: 'Infernity Randomizer', title: 'Randomizer', color: '#fdba74', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Infernity Knight', title: 'Knight', color: '#94a3b8', face: [0.45, 0.2], pan: [0.25, 0.25] },
            { card: 'Infernity General', title: 'General', color: '#cbd5e1', face: [0.4, 0.2], pan: [0.25, 0.3] },
            { card: 'Infernity Sage', title: 'Sage', color: '#fef08a', face: [0.5, 0.15], pan: [0.25, 0.2] },
            { card: 'Infernity Queen', title: 'Queen', color: '#f0abfc', face: [0.45, 0.15], pan: [0.25, 0.2] },
            { card: 'Infernity Reflector', title: 'Reflector', color: '#93c5fd', face: [0.55, 0.3], pan: [0.3, 0.35] }
        ]
    };

    window.LoreReelData['supreme-king'] = {
        kind: 'trail',
        label: 'The Supreme King art trail',
        stops: [
            { card: 'Supreme King Z-ARC', title: 'Z-ARC', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Soul of the Supreme King', title: 'The split', color: '#a78bfa', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Supreme King Dragon Odd-Eyes', title: 'Odd-Eyes', color: '#f87171', face: [0.55, 0.2], pan: [0.25, 0.3] },
            { card: 'Supreme King Dragon Dark Rebellion', title: 'Dark Rebellion', color: '#818cf8', face: [0.5, 0.15], pan: [0.25, 0.25] },
            { card: 'Supreme King Dragon Clear Wing', title: 'Clear Wing', color: '#e9d5ff', face: [0.4, 0.15], pan: [0.25, 0.3] },
            { card: 'Supreme King Dragon Starving Venom', title: 'Starving Venom', color: '#a3e635', face: [0.45, 0.2], pan: [0.25, 0.3] },
            { card: 'Starving Venom Wing Dragon', title: 'Venom Wing', color: '#bef264', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Supreme King Z-ARC - Synchro Universe', title: 'Synchro Universe', color: '#d8b4fe', face: [0.4, 0.3], pan: [0.3, 0.4] },
            { card: 'Supreme King Dragon Darkwurm', title: 'Darkwurm', color: '#a855f7', face: [0.45, 0.3], pan: [0.3, 0.4] },
            { card: 'Wings of Light', title: 'Wings of Light', color: '#fef9c3', face: [0.5, 0.45], pan: [0.3, 0.4] },
            { card: 'Miracle of the Supreme King', title: 'The miracle', color: '#fde68a', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Odd-Eyes Arcray Dragon', title: 'Arcray', color: '#fef08a', face: [0.5, 0.3], pan: [0.3, 0.35] },
            { card: 'Supreme King Gate Zero', title: 'Gate Zero', color: '#94a3b8', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Supreme King Gate Infinity', title: 'Gate Infinity', color: '#cbd5e1', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Supreme King Gate Magician', title: 'Gate Magician', color: '#e879f9', face: [0.5, 0.15], pan: [0.25, 0.25] }
        ]
    };

    window.LoreReelData['armed-dragon'] = {
        kind: 'trail',
        label: 'The Armed Dragon art trail',
        stops: [
            { card: 'Armed Dragon LV3', title: 'LV3', color: '#fde68a', face: [0.45, 0.15], pan: [0.25, 0.3] },
            { card: 'Armed Dragon LV5', title: 'LV5', color: '#fdba74', face: [0.6, 0.25], pan: [0.25, 0.35] },
            { card: 'Fist Armed Dragon', title: 'Fist', color: '#f87171', face: [0.5, 0.25], pan: [0.3, 0.35] },
            { card: 'Armed Dragon LV7', title: 'LV7', color: '#fb923c', face: [0.45, 0.15], pan: [0.25, 0.3] },
            { card: 'Pile Armed Dragon', title: 'Pile', color: '#93c5fd', face: [0.55, 0.15], pan: [0.25, 0.3] },
            { card: 'Armed Dragon LV10', title: 'LV10', color: '#ef4444', face: [0.22, 0.2], pan: [0.15, 0.3] },
            { card: 'Level Down!?', title: 'Level Down!?', color: '#fca5a5', face: [0.5, 0.45], pan: [0.3, 0.4] },
            { card: 'Armed Dragon LV10 White', title: 'LV10 White', color: '#f5f5f4', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Armed Dragon Thunder LV3', title: 'Thunder LV3', color: '#bef264', face: [0.4, 0.2], pan: [0.25, 0.3] },
            { card: 'Armed Dragon Blitz', title: 'Blitz', color: '#fde047', face: [0.5, 0.25], pan: [0.3, 0.35] },
            { card: 'Armed Dragon Thunder LV10', title: 'Thunder LV10', color: '#facc15', face: [0.45, 0.15], pan: [0.25, 0.3] },
            { card: 'Armed Dragon Thunderbolt', title: 'Thunderbolt', color: '#fef08a', face: [0.7, 0.35], pan: [0.3, 0.4] },
            { card: 'Dark Armed Dragon', title: 'Dark Armed', color: '#a78bfa', face: [0.55, 0.25], pan: [0.2, 0.35] },
            { card: 'Dracocension', title: 'Draco\u00ADcension', color: '#c4b5fd', face: [0.5, 0.4], pan: [0.35, 0.45] }
        ]
    };

    window.LoreReelData['artifact'] = {
        kind: 'trail',
        label: 'The Artifact art trail',
        stops: [
            { card: 'Artifact Sanctum', title: 'The sanctum', color: '#fde68a', face: [0.5, 0.75], pan: [0.55, 0.75] },
            { card: 'Artifact Ignition', title: 'Ignition', color: '#fbbf24', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Artifact Achilleshield', title: 'Achilleshield', color: '#fcd34d', face: [0.45, 0.35], pan: [0.35, 0.45] },
            { card: 'Artifact Aegis', title: 'Aegis', color: '#e5e7eb', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Artifact Labrys', title: 'Labrys', color: '#fdba74', face: [0.45, 0.45], pan: [0.35, 0.45] },
            { card: 'Artifact Moralltach', title: 'Moralltach', color: '#f87171', face: [0.55, 0.4], pan: [0.35, 0.45] },
            { card: 'Artifact Beagalltach', title: 'Beagalltach', color: '#93c5fd', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Artifacts Unleashed', title: 'Unleashed', color: '#c4b5fd', face: [0.5, 0.4], pan: [0.3, 0.6] },
            { card: 'Artifact Durendal', title: 'Durendal', color: '#fef08a', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Artifact Failnaught', title: 'Failnaught', color: '#86efac', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Artifact Caduceus', title: 'Caduceus', color: '#a5f3fc', face: [0.45, 0.35], pan: [0.35, 0.45] },
            { card: 'Artifact Mjollnir', title: 'Mjollnir', color: '#7dd3fc', face: [0.45, 0.35], pan: [0.35, 0.45] },
            { card: 'Artifact Lancea', title: 'Lancea', color: '#fca5a5', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Artifact Scythe', title: 'Scythe', color: '#a8a29e', face: [0.5, 0.35], pan: [0.35, 0.45] }
        ]
    };

    window.LoreReelData['watt'] = {
        kind: 'trail',
        label: 'The Watt art trail',
        stops: [
            { card: 'Wattkid', title: 'Wattkid', color: '#fde047', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Wattcastle', title: 'The castle', color: '#fef08a', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Wattrain', title: 'The train', color: '#fcd34d', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Wattgiraffe', title: 'Wattgiraffe', color: '#facc15', face: [0.4, 0.72], pan: [0.55, 0.7] },
            { card: 'Wattlemur', title: 'Wattlemur', color: '#d6d3d1', face: [0.5, 0.2], pan: [0.25, 0.3] },
            { card: 'Wattsquirrel', title: 'Wattsquirrel', color: '#fb923c', face: [0.4, 0.2], pan: [0.25, 0.3] },
            { card: 'Wattkingdom', title: 'The kingdom', color: '#fde68a', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Wattaildragon', title: 'Wattail\u00ADdragon', color: '#60a5fa', face: [0.35, 0.3], pan: [0.3, 0.35] },
            { card: 'Ancient Rules', title: 'Ancient Rules', color: '#fbbf24', face: [0.5, 0.45], pan: [0.35, 0.7] },
            { card: 'Wattkiwi', title: 'Wattkiwi', color: '#bef264', face: [0.3, 0.25], pan: [0.25, 0.35] },
            { card: 'Wattmole', title: 'Wattmole', color: '#a8a29e', face: [0.45, 0.25], pan: [0.15, 0.3] },
            { card: 'Watthydra', title: 'Watthydra', color: '#86efac', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Wattkyuki', title: 'Wattkyuki', color: '#c4b5fd', face: [0.4, 0.4], pan: [0.3, 0.4] },
            { card: 'Wattuna', title: 'Wattuna', color: '#7dd3fc', face: [0.35, 0.55], pan: [0.3, 0.4] }
        ]
    };

    window.LoreReelData['numeron'] = {
        kind: 'trail',
        label: 'The Numeron art trail',
        stops: [
            { card: 'Numeron Calling', title: 'The calling', color: '#fca5a5', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Number 1: Numeron Gate Ekam', title: 'Ekam', color: '#f87171', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Number 2: Numeron Gate Dve', title: 'Dve', color: '#fb923c', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Number 3: Numeron Gate Trini', title: 'Trini', color: '#fbbf24', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Number 4: Numeron Gate Catvari', title: 'Catvari', color: '#facc15', face: [0.5, 0.6], pan: [0.45, 0.6] },
            { card: 'Number C1: Numeron Chaos Gate Sunya', title: 'Sunya', color: '#e5e7eb', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Number 100: Numeron Dragon', title: 'Numeron Dragon', color: '#fde68a', face: [0.45, 0.15], pan: [0.3, 0.35] },
            { card: 'Numeron Creation', title: 'Creation', color: '#fef08a', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Rank-Up-Magic Numeron Force', title: 'Numeron Force', color: '#c4b5fd', face: [0.5, 0.45], pan: [0.3, 0.4] },
            { card: 'Rank-Down-Magic Numeron Fall', title: 'Numeron Fall', color: '#a78bfa', face: [0.5, 0.45], pan: [0.35, 0.45] },
            { card: 'Number C1000: Numerounius', title: 'Numerounius', color: '#d8b4fe', face: [0.5, 0.25], pan: [0.3, 0.35] },
            { card: 'Numeron Storm', title: 'Storm', color: '#e9d5ff', face: [0.5, 0.35], pan: [0.35, 0.45] },
            { card: 'Number iC1000: Numerounius Numerounia', title: 'Numerounia', color: '#f0abfc', face: [0.5, 0.45], pan: [0.3, 0.4] },
            { card: 'Numeron Network', title: 'Network', color: '#ef4444', face: [0.5, 0.4], pan: [0.35, 0.45] }
        ]
    };

    window.LoreReelData['symphonic-warrior'] = {
        kind: 'trail',
        label: 'The Symphonic Warrior art trail',
        stops: [
            { card: 'Symphonic Warrior Guitaar', title: 'Guitaar', color: '#fca5a5', face: [0.45, 0.3], pan: [0.3, 0.4] },
            { card: 'Symphonic Warrior Basses', title: 'Basses', color: '#93c5fd', face: [0.4, 0.35], pan: [0.3, 0.4] },
            { card: 'Symphonic Warrior Drumss', title: 'Drumss', color: '#fde68a', face: [0.45, 0.35], pan: [0.3, 0.4] },
            { card: 'Symphonic Warrior Piaano', title: 'Piaano', color: '#e5e7eb', face: [0.5, 0.35], pan: [0.3, 0.4] },
            { card: 'Symphonic Warrior Synthess', title: 'Synthess', color: '#c4b5fd', face: [0.5, 0.3], pan: [0.3, 0.4] },
            { card: 'Symphonic Warrior Miccs', title: 'Miccs', color: '#f0abfc', face: [0.5, 0.25], pan: [0.3, 0.4] },
            { card: 'Symph Amplifire', title: 'The amp', color: '#7dd3fc', face: [0.45, 0.6], pan: [0.4, 0.7] },
            { card: 'Concentrating Current', title: 'Current', color: '#fef08a', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Downbeat', title: 'Downbeat', color: '#fdba74', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'And the Band Played On', title: 'Band Played On', color: '#a5b4fc', face: [0.5, 0.5], pan: [0.35, 0.45] },
            { card: 'Symphonic Warrior Guitariss', title: 'Guitariss', color: '#fb7185', face: [0.5, 0.4], pan: [0.35, 0.45] },
            { card: 'Symphonic Warrior Rockks', title: 'Rockks', color: '#60a5fa', face: [0.5, 0.5], pan: [0.35, 0.45] }
        ]
    };

    window.LoreReelData['red-eyes'] = {
        kind: 'trail',
        label: 'The Red-Eyes art trail',
        stops: [
            { card: 'Red-Eyes Black Dragon', title: 'Red-Eyes', color: '#ef4444', face: [0.45, 0.15], pan: [0.15, 0.35] },
            { card: 'Black Dragon\'s Chick', title: 'The chick', color: '#fca5a5', face: [0.6, 0.25], pan: [0.2, 0.4] },
            { card: 'Red-Eyes Baby Dragon', title: 'Baby Dragon', color: '#f87171', face: [0.5, 0.45], pan: [0.35, 0.5] },
            { card: 'Red-Eyes Retro Dragon', title: 'Retro', color: '#fdba74', face: [0.55, 0.25], pan: [0.2, 0.4] },
            { card: 'Red-Eyes Black Metal Dragon', title: 'Black Metal', color: '#d1d5db', face: [0.4, 0.2], pan: [0.15, 0.35] },
            { card: 'Red-Eyes Black Fullmetal Dragon', title: 'Fullmetal', color: '#e5e7eb', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Red-Eyes Metal Claws Dragon', title: 'Metal Claws', color: '#fca5a5', face: [0.45, 0.25], pan: [0.2, 0.4] },
            { card: 'Red-Eyes Soul', title: 'Red-Eyes Soul', color: '#f87171', face: [0.6, 0.45], pan: [0.3, 0.5] },
            { card: 'Red-Eyes Black Dragon Sword', title: 'The sword', color: '#9ca3af', face: [0.55, 0.3], pan: [0.3, 0.5] },
            { card: 'Red-Eyes Darkness Dragon', title: 'Darkness', color: '#fde047', face: [0.5, 0.45], pan: [0.3, 0.5] },
            { card: 'Red-Eyes Zombie Dragon', title: 'Zombie', color: '#86efac', face: [0.45, 0.3], pan: [0.2, 0.4] },
            { card: 'Red-Eyes Zombie Necro Dragon', title: 'Necro', color: '#7dd3fc', face: [0.3, 0.3], pan: [0.2, 0.4] },
            { card: 'Red-Eyes Zombie Dragon Lord', title: 'Dragon Lord', color: '#a78bfa', face: [0.65, 0.15], pan: [0.1, 0.35] },
            { card: 'Return of the Red-Eyes', title: 'The return', color: '#fb923c', face: [0.45, 0.3], pan: [0.2, 0.45] },
            { card: 'Red-Eyes Dark Dragoon', title: 'Dark Dragoon', color: '#c4b5fd', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Red-Eyes Black Dragon Exceed', title: 'Exceed', color: '#dc2626', face: [0.4, 0.25], pan: [0.15, 0.4] }
        ]
    };

    window.LoreReelData['blackwing'] = {
        kind: 'trail',
        label: 'The Blackwing art trail',
        stops: [
            { card: 'Blackwing - Sirocco the Dawn', title: 'Sirocco', color: '#fdba74', face: [0.35, 0.1], pan: [0.1, 0.3] },
            { card: 'Blackwing - Ghibli the Searing Wind', title: 'Ghibli', color: '#f87171', face: [0.42, 0.3], pan: [0.2, 0.4] },
            { card: 'Blackwing - Zephyros the Elite', title: 'Zephyros', color: '#e5e7eb', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Blackwing - Auster the South Wind', title: 'Auster', color: '#fde68a', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Blackwing - Boreas the Sharp', title: 'Boreas', color: '#bae6fd', face: [0.45, 0.15], pan: [0.1, 0.3] },
            { card: 'Blackwing - Bora the Spear', title: 'Bora', color: '#fb923c', face: [0.5, 0.25], pan: [0.2, 0.4] },
            { card: 'Blackwing - Kochi the Daybreak', title: 'Kochi', color: '#fcd34d', face: [0.17, 0.65], pan: [0.5, 0.65] },
            { card: 'Blackwing - Twin Shadow', title: 'Twin Shadow', color: '#a8a29e', face: [0.5, 0.35], pan: [0.25, 0.5] },
            { card: 'Blackwing - Gale the Whirlwind', title: 'Gale', color: '#d6d3d1', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Blackwing Armor Master', title: 'Armor Master', color: '#9ca3af', face: [0.55, 0.2], pan: [0.15, 0.35] },
            { card: 'Blackwing - Pinaki the Waxing Moon', title: 'Pinaki', color: '#c4b5fd', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Blackwing - Sharnga the Waning Moon', title: 'Sharnga', color: '#a5b4fc', face: [0.5, 0.38], pan: [0.2, 0.42] },
            { card: 'Blackwing - Gram the Shining Star', title: 'Gram', color: '#fef08a', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Assault Blackwing - Raikiri the Rain Shower', title: 'Raikiri', color: '#93c5fd', face: [0.5, 0.2], pan: [0.1, 0.35] },
            { card: 'Blackwing - Vayu the Emblem of Honor', title: 'Vayu', color: '#fca5a5', face: [0.45, 0.3], pan: [0.3, 0.45] }
        ]
    };

    window.LoreReelData['elemental-hero'] = {
        kind: 'trail',
        label: 'The Elemental HERO art trail',
        stops: [
            { card: 'Elemental HERO Avian', title: 'Avian', color: '#86efac', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Elemental HERO Burstinatrix', title: 'Burstinatrix', color: '#f87171', face: [0.5, 0.15], pan: [0.3, 0.12] },
            { card: 'Elemental HERO Flame Wingman', title: 'Flame Wingman', color: '#fb923c', face: [0.55, 0.2], pan: [0.15, 0.35] },
            { card: 'Favorite HERO Flame Wingman', title: 'Favorite HERO', color: '#fdba74', face: [0.4, 0.2], pan: [0.1, 0.35] },
            { card: 'Elemental HERO Shining Flare Wingman', title: 'Shining Flare', color: '#fef08a', face: [0.5, 0.2], pan: [0.1, 0.3] },
            { card: 'Elemental HERO Tempest', title: 'Tempest', color: '#7dd3fc', face: [0.55, 0.15], pan: [0.1, 0.3] },
            { card: 'Elemental HERO Mudballman', title: 'Mudballman', color: '#a8a29e', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Elemental HERO Electrum', title: 'Electrum', color: '#fcd34d', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Elemental HERO Neos', title: 'Neos', color: '#e5e7eb', face: [0.5, 0.2], pan: [0.15, 0.3] },
            { card: 'Elemental HERO Magma Neos', title: 'Magma Neos', color: '#ef4444', face: [0.43, 0.4], pan: [0.3, 0.45] },
            { card: 'Elemental HERO Storm Neos', title: 'Storm Neos', color: '#93c5fd', face: [0.5, 0.25], pan: [0.15, 0.35] },
            { card: 'Elemental HERO Cosmo Neos', title: 'Cosmo Neos', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Elemental HERO Honest Neos', title: 'Honest Neos', color: '#fde68a', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Elemental HERO Terra Firma', title: 'Terra Firma', color: '#a3e635', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Wake Up Your Elemental HERO', title: 'Wake Up', color: '#f0abfc', face: [0.5, 0.4], pan: [0.3, 0.6] },
            { card: 'Elemental HERO Sunrise', title: 'Sunrise', color: '#f97316', face: [0.45, 0.15], pan: [0.1, 0.3] }
        ]
    };

    window.LoreReelData['psy-frame'] = {
        kind: 'trail',
        label: 'The PSY-Frame art trail',
        stops: [
            { card: 'PSY-Frame Driver', title: 'Driver', color: '#93c5fd', face: [0.35, 0.38], pan: [0.2, 0.4] },
            { card: 'PSY-Framegear Alpha', title: 'Alpha', color: '#fca5a5', face: [0.5, 0.3], pan: [0.2, 0.45] },
            { card: 'PSY-Framegear Beta', title: 'Beta', color: '#fdba74', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'PSY-Framegear Gamma', title: 'Gamma', color: '#86efac', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'PSY-Framegear Delta', title: 'Delta', color: '#c4b5fd', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'PSY-Framegear Epsilon', title: 'Epsilon', color: '#fde68a', face: [0.55, 0.35], pan: [0.25, 0.45] },
            { card: 'PSY-Frame Circuit', title: 'The circuit', color: '#7dd3fc', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'PSY-Framelord Zeta', title: 'Zeta', color: '#60a5fa', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'PSY-Framelord Omega', title: 'Omega', color: '#e5e7eb', face: [0.45, 0.2], pan: [0.15, 0.4] },
            { card: 'PSY-Frame Multi-Threader', title: 'Multi-Threader', color: '#a5b4fc', face: [0.45, 0.25], pan: [0.2, 0.4] }
        ]
    };

    window.LoreReelData['graydle'] = {
        kind: 'trail',
        label: 'The Graydle art trail',
        stops: [
            { card: 'Graydle Slime', title: 'The Slime', color: '#a5f3fc', face: [0.45, 0.2], pan: [0.15, 0.35] },
            { card: 'Graydle Parasite', title: 'Parasite', color: '#86efac', face: [0.6, 0.5], pan: [0.3, 0.55] },
            { card: 'Graydle Alligator', title: 'Alligator', color: '#4ade80', face: [0.7, 0.2], pan: [0.15, 0.4] },
            { card: 'Graydle Eagle', title: 'Eagle', color: '#fde68a', face: [0.6, 0.35], pan: [0.25, 0.45] },
            { card: 'Graydle Cobra', title: 'Cobra', color: '#c4b5fd', face: [0.4, 0.15], pan: [0.1, 0.35] },
            { card: 'Graydle Combat', title: 'Combat', color: '#93c5fd', face: [0.4, 0.25], pan: [0.2, 0.4] },
            { card: 'Graydle Slime Jr.', title: 'Slime Jr.', color: '#bae6fd', face: [0.45, 0.25], pan: [0.2, 0.4] },
            { card: 'Graydle Dragon', title: 'The Dragon', color: '#7dd3fc', face: [0.45, 0.35], pan: [0.25, 0.45] }
        ]
    };

    window.LoreReelData['dark-magician'] = {
        kind: 'trail',
        label: 'The Dark Magician art trail',
        stops: [
            { card: 'Dark Magician', title: 'Dark Magician', color: '#c084fc', face: [0.6, 0.15], pan: [0.1, 0.3] },
            { card: 'Dark Magician, the Pharaoh\'s Servant', title: 'Pharaoh\'s Servant', color: '#a78bfa', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Dark Magician Girl', title: 'Dark Magician Girl', color: '#f9a8d4', face: [0.5, 0.35], pan: [0.45, 0.3] },
            { card: 'Dark Magician Girl the Magician\'s Apprentice', title: 'Apprentice', color: '#f0abfc', face: [0.5, 0.2], pan: [0.22, 0.12] },
            { card: 'Dark Magician the Magician of Black Magic', title: 'Black Magic', color: '#818cf8', face: [0.45, 0.15], pan: [0.1, 0.3] },
            { card: 'Skilled Dark Magician', title: 'Skilled', color: '#93c5fd', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Dark Magician of Chaos', title: 'Of Chaos', color: '#fbbf24', face: [0.4, 0.2], pan: [0.15, 0.35] },
            { card: 'Dark Magician of Destruction', title: 'Destruction', color: '#f87171', face: [0.4, 0.2], pan: [0.15, 0.35] },
            { card: 'Dark Magician the Dragon Knight', title: 'Dragon Knight', color: '#86efac', face: [0.45, 0.2], pan: [0.15, 0.4] },
            { card: 'Dark Magician Girl the Dragon Knight', title: 'DMG Knight', color: '#bef264', face: [0.45, 0.3], pan: [0.4, 0.25] },
            { card: 'Dark Magician the Knight of Dragon Magic', title: 'Dragon Magic', color: '#fdba74', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'The Dark Magicians', title: 'Together', color: '#e9d5ff', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Toon Dark Magician', title: 'Toon', color: '#fde68a', face: [0.4, 0.3], pan: [0.2, 0.4] }
        ]
    };

    window.LoreReelData['blue-eyes'] = {
        kind: 'trail',
        label: 'The Blue-Eyes art trail',
        stops: [
            { card: 'Blue-Eyes White Dragon', title: 'Blue-Eyes', color: '#93c5fd', face: [0.35, 0.25], pan: [0.15, 0.4] },
            { card: 'Heart of the Blue-Eyes', title: 'Heart', color: '#bfdbfe', face: [0.4, 0.45], pan: [0.3, 0.5] },
            { card: 'Blue-Eyes Ultimate Dragon', title: 'Ultimate', color: '#60a5fa', face: [0.55, 0.25], pan: [0.15, 0.4] },
            { card: 'Blue-Eyes Toon Dragon', title: 'Toon', color: '#7dd3fc', face: [0.45, 0.35], pan: [0.25, 0.45] },
            { card: 'Blue-Eyes Shining Dragon', title: 'Shining', color: '#e0f2fe', face: [0.6, 0.2], pan: [0.15, 0.35] },
            { card: 'Blue-Eyes Jet Dragon', title: 'Jet', color: '#a5f3fc', face: [0.22, 0.65], pan: [0.5, 0.65] },
            { card: 'Blue-Eyes Tyrant Dragon', title: 'Tyrant', color: '#a78bfa', face: [0.3, 0.2], pan: [0.15, 0.35] },
            { card: 'Malefic Blue-Eyes White Dragon', title: 'Malefic', color: '#9ca3af', face: [0.65, 0.35], pan: [0.25, 0.45] },
            { card: 'Blue-Eyes Alternative White Dragon', title: 'Alternative', color: '#bae6fd', face: [0.25, 0.35], pan: [0.25, 0.45] },
            { card: 'Neo Blue-Eyes Ultimate Dragon', title: 'Neo Ultimate', color: '#38bdf8', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Blue-Eyes Chaos MAX Dragon', title: 'Chaos MAX', color: '#818cf8', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Blue-Eyes Solid Dragon', title: 'Solid', color: '#67e8f9', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Blue-Eyes Ultimate Spirit Dragon', title: 'Ultimate Spirit', color: '#e0e7ff', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Blue-Eyes White Dragon, the White Phantom Beast', title: 'Phantom Beast', color: '#f1f5f9', face: [0.6, 0.4], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['odd-eyes'] = {
        kind: 'trail',
        label: 'The Odd-Eyes art trail',
        stops: [
            { card: 'Odd-Eyes Dragon', title: 'Odd-Eyes Dragon', color: '#f87171', face: [0.55, 0.15], pan: [0.1, 0.3] },
            { card: 'Odd-Eyes Pendulum Dragon', title: 'Pendulum Dragon', color: '#ef4444', face: [0.8, 0.3], pan: [0.2, 0.4] },
            { card: 'Odd-Eyes Phantom Dragon', title: 'Phantom', color: '#60a5fa', face: [0.38, 0.33], pan: [0.2, 0.4] },
            { card: 'Odd-Eyes Persona Dragon', title: 'Persona', color: '#fca5a5', face: [0.45, 0.2], pan: [0.15, 0.35] },
            { card: 'Odd-Eyes Mirage Dragon', title: 'Mirage', color: '#86efac', face: [0.4, 0.2], pan: [0.15, 0.35] },
            { card: 'Odd-Eyes Arc Pendulum Dragon', title: 'Arc Pendulum', color: '#fde68a', face: [0.55, 0.15], pan: [0.1, 0.3] },
            { card: 'Odd-Eyes Rebellion Dragon', title: 'Rebellion', color: '#a78bfa', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Odd-Eyes Raging Dragon', title: 'Raging', color: '#dc2626', face: [0.45, 0.25], pan: [0.15, 0.4] },
            { card: 'Odd-Eyes Venom Dragon', title: 'Venom', color: '#c084fc', face: [0.55, 0.15], pan: [0.1, 0.35] },
            { card: 'Odd-Eyes Wing Dragon', title: 'Wing', color: '#e5e7eb', face: [0.45, 0.2], pan: [0.15, 0.35] },
            { card: 'Odd-Eyes Meteorburst Dragon', title: 'Meteorburst', color: '#fb923c', face: [0.45, 0.4], pan: [0.25, 0.45] },
            { card: 'Odd-Eyes Absolute Dragon', title: 'Absolute', color: '#7dd3fc', face: [0.5, 0.15], pan: [0.1, 0.35] },
            { card: 'Odd-Eyes Override Dragon', title: 'Override', color: '#cbd5e1', face: [0.75, 0.3], pan: [0.2, 0.4] },
            { card: 'Odd-Eyes Pendulumgraph Dragon', title: 'Pendulum\u00ADgraph', color: '#fcd34d', face: [0.45, 0.2], pan: [0.15, 0.35] },
            { card: 'Odd-Eyes Revolution Dragon', title: 'Revolution', color: '#fef08a', face: [0.5, 0.3], pan: [0.2, 0.4] }
        ]
    };

    window.LoreReelData['kuriboh'] = {
        kind: 'trail',
        label: 'The Kuriboh art trail',
        stops: [
            { card: 'Kuriboh', title: 'Kuriboh', color: '#fbbf24', face: [0.5, 0.45], pan: [0.35, 0.5] },
            { card: 'Kuriboh - Multiply!', title: 'Multiply!', color: '#fde68a', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Detonating Kuriboh', title: 'Detonating', color: '#f97316', face: [0.4, 0.4], pan: [0.3, 0.5] },
            { card: 'Relinkuriboh', title: 'Relinkuriboh', color: '#c084fc', face: [0.55, 0.4], pan: [0.3, 0.5] },
            { card: 'Sphere Kuriboh', title: 'Sphere', color: '#fef08a', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Magikuriboh', title: 'Magikuriboh', color: '#a78bfa', face: [0.45, 0.6], pan: [0.4, 0.6] },
            { card: 'Winged Kuriboh', title: 'Winged', color: '#fef9c3', face: [0.5, 0.45], pan: [0.35, 0.5] },
            { card: 'Winged Kuriboh LV6', title: 'LV6', color: '#fb923c', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Winged Kuriboh LV9', title: 'LV9', color: '#e5e7eb', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Winged Kuriboh Sabatiel LV10', title: 'Sabatiel', color: '#86efac', face: [0.55, 0.3], pan: [0.2, 0.45] },
            { card: 'Darkuriboh', title: 'Darkuriboh', color: '#c4b5fd', face: [0.5, 0.55], pan: [0.4, 0.6] },
            { card: 'Junkuriboh', title: 'Junkuriboh', color: '#a8a29e', face: [0.5, 0.45], pan: [0.35, 0.5] },
            { card: 'Galactikuriboh', title: 'Galactic', color: '#93c5fd', face: [0.45, 0.45], pan: [0.3, 0.5] },
            { card: 'Linkuriboh', title: 'Linkuriboh', color: '#7dd3fc', face: [0.5, 0.4], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['utopia'] = {
        kind: 'trail',
        label: 'The Utopia art trail',
        stops: [
            { card: 'Number 39: Utopia', title: 'Utopia', color: '#fde047', face: [0.6, 0.33], pan: [0.2, 0.4] },
            { card: 'Number 39: Utopia Roots', title: 'Roots', color: '#facc15', face: [0.55, 0.3], pan: [0.2, 0.4] },
            { card: 'Number C39: Utopia Ray', title: 'Utopia Ray', color: '#fbbf24', face: [0.4, 0.6], pan: [0.45, 0.6] },
            { card: 'Number C39: Utopia Ray V', title: 'Ray V', color: '#ef4444', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Number C39: Utopia Ray Victory', title: 'Ray Victory', color: '#fef08a', face: [0.42, 0.25], pan: [0.15, 0.35] },
            { card: 'Number S39: Utopia Prime', title: 'Utopia Prime', color: '#e0f2fe', face: [0.45, 0.3], pan: [0.2, 0.4] },
            { card: 'Number S39: Utopia the Lightning', title: 'Lightning', color: '#fde68a', face: [0.45, 0.25], pan: [0.15, 0.35] },
            { card: 'Number 39: Utopia Beyond', title: 'Beyond', color: '#a5f3fc', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Number 99: Utopia Dragonar', title: 'Dragonar', color: '#93c5fd', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Number 93: Utopia Kaiser', title: 'Kaiser', color: '#c4b5fd', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Number 39: Utopia Rising', title: 'Rising', color: '#fb923c', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Number 39: Utopia Double', title: 'Double', color: '#fcd34d', face: [0.5, 0.25], pan: [0.15, 0.35] },
            { card: 'Ultimate Dragonic Utopia Ray', title: 'Dragonic', color: '#f59e0b', face: [0.45, 0.35], pan: [0.25, 0.45] },
            { card: 'Number 39: Utopia, Emissary of Light', title: 'Emissary', color: '#fef9c3', face: [0.42, 0.3], pan: [0.2, 0.4] }
        ]
    };

    window.LoreReelData['d-d'] = {
        kind: 'trail',
        label: 'The D/D art trail',
        stops: [
            { card: 'D/D/D Flame King Genghis', title: 'Genghis', color: '#f87171', face: [0.4, 0.15], pan: [0.1, 0.3] },
            { card: 'D/D/D Gust King Alexander', title: 'Alexander', color: '#86efac', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'D/D/D Wave King Caesar', title: 'Caesar', color: '#93c5fd', face: [0.5, 0.25], pan: [0.15, 0.35] },
            { card: 'D/D/D/D Dimensional King Arc Crisis', title: 'Arc Crisis', color: '#a78bfa', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'D/D/D Oracle King d\'Arc', title: 'd\'Arc', color: '#fde68a', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'D/D/D Marksman King Tell', title: 'Tell', color: '#4ade80', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'D/D/D Rebel King Leonidas', title: 'Leonidas', color: '#fb923c', face: [0.4, 0.2], pan: [0.15, 0.35] },
            { card: 'D/D/D Dragon King Pendragon', title: 'Pendragon', color: '#ef4444', face: [0.45, 0.3], pan: [0.2, 0.4] },
            { card: 'D/D/D Cursed King Siegfried', title: 'Siegfried', color: '#c4b5fd', face: [0.6, 0.25], pan: [0.15, 0.35] },
            { card: 'D/D/D First King Clovis', title: 'Clovis', color: '#fcd34d', face: [0.55, 0.25], pan: [0.15, 0.35] },
            { card: 'D/D/D Alfred the Divine Sage King', title: 'Alfred', color: '#e5e7eb', face: [0.55, 0.15], pan: [0.1, 0.3] },
            { card: 'D/D/D Wise King Solomon', title: 'Solomon', color: '#fef08a', face: [0.45, 0.15], pan: [0.1, 0.3] },
            { card: 'D/D/D Destiny King Zero Laplace', title: 'Laplace', color: '#94a3b8', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'D/D Savant Nikola', title: 'Savant Nikola', color: '#7dd3fc', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'D/D/D Zero Doom Queen Machinex', title: 'Machinex', color: '#f0abfc', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Go! - D/D/D Divine Zero King Rage', title: 'Rage', color: '#a855f7', face: [0.5, 0.25], pan: [0.15, 0.35] }
        ]
    };

    window.LoreReelData['destiny-hero'] = {
        kind: 'trail',
        label: 'The Destiny HERO art trail',
        stops: [
            { card: 'Destiny HERO - Plasma', title: 'Plasma', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Destiny HERO - Double Dude', title: 'Double Dude', color: '#a5b4fc', face: [0.35, 0.15], pan: [0.1, 0.35] },
            { card: 'Destiny HERO - Dreadmaster', title: 'Dreadmaster', color: '#818cf8', face: [0.5, 0.12], pan: [0.1, 0.3] },
            { card: 'Clock Tower Prison', title: 'Clock Tower', color: '#e0e7ff', face: [0.5, 0.45], pan: [0.3, 0.5] },
            { card: 'Destiny HERO - Dreadnought Master', title: 'Dread\u00ADnought', color: '#6366f1', face: [0.55, 0.15], pan: [0.1, 0.3] },
            { card: 'Destiny HERO - Dread Servant', title: 'Dread Servant', color: '#94a3b8', face: [0.4, 0.12], pan: [0.1, 0.3] },
            { card: 'Destiny HERO - Dreadnought Servant', title: 'Dread\u00ADnought Servant', color: '#cbd5e1', face: [0.35, 0.25], pan: [0.2, 0.4] },
            { card: 'Destiny HERO - Doom Lord', title: 'Doom Lord', color: '#7c3aed', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Destiny HERO - Doom Overlord', title: 'Doom Overlord', color: '#a78bfa', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Destiny HERO - Captain Tenacious', title: 'Captain Tenacious', color: '#fbbf24', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Destiny HERO - Drawhand', title: 'Drawhand', color: '#fca5a5', face: [0.3, 0.15], pan: [0.1, 0.3] },
            { card: 'Destiny HERO - Dasher', title: 'Dasher', color: '#fdba74', face: [0.75, 0.4], pan: [0.3, 0.5] },
            { card: 'Destiny HERO - Departed', title: 'Departed', color: '#e5e7eb', face: [0.4, 0.2], pan: [0.15, 0.35] },
            { card: 'Destiny HERO - Destro-Dogma', title: 'Destro-Dogma', color: '#60a5fa', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Destiny HERO - Destroyer Phoenix Enforcer', title: 'Destroyer Phoenix', color: '#f87171', face: [0.5, 0.3], pan: [0.2, 0.4] }
        ]
    };

    window.LoreReelData['stardust'] = {
        kind: 'trail',
        label: 'The Stardust art trail',
        stops: [
            { card: 'Stardust Dragon', title: 'Stardust Dragon', color: '#7dd3fc', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Stardust Dragon - Victim Sanctuary', title: 'Victim Sanctuary', color: '#bae6fd', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Stardust Wish', title: 'Stardust Wish', color: '#e0f2fe', face: [0.5, 0.25], pan: [0.2, 0.4] },
            { card: 'Majestic Star Dragon', title: 'Majestic', color: '#fef3c7', face: [0.5, 0.25], pan: [0.15, 0.35] },
            { card: 'Shooting Star Dragon', title: 'Shooting Star', color: '#93c5fd', face: [0.45, 0.15], pan: [0.1, 0.3] },
            { card: 'Stardust Flash', title: 'Stardust Flash', color: '#cffafe', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Shooting Quasar Dragon', title: 'Quasar', color: '#f0f9ff', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Cosmic Blazar Dragon', title: 'Blazar', color: '#a5f3fc', face: [0.45, 0.4], pan: [0.3, 0.5] },
            { card: 'Accel Synchro Stardust Dragon', title: 'Accel Synchro', color: '#38bdf8', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Stardust Spark Dragon', title: 'Spark', color: '#fef9c3', face: [0.5, 0.25], pan: [0.15, 0.35] },
            { card: 'Stardust Chronicle Spark Dragon', title: 'Chronicle', color: '#fde68a', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Stardust Sifr Divine Dragon', title: 'Sifr', color: '#e9d5ff', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Malefic Stardust Dragon', title: 'Malefic', color: '#a78bfa', face: [0.45, 0.3], pan: [0.2, 0.4] },
            { card: 'Stardust Synchron', title: 'Synchron', color: '#7dd3fc', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Stardust Trail', title: 'Stardust Trail', color: '#c4b5fd', face: [0.48, 0.15], pan: [0.3, 0.12] }
        ]
    };

    window.LoreReelData['shark'] = {
        kind: 'trail',
        label: 'The Shark art trail',
        stops: [
            { card: 'Number 32: Shark Drake', title: 'Shark Drake', color: '#60a5fa', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Drake Shark', title: 'Drake Shark', color: '#93c5fd', face: [0.75, 0.55], pan: [0.4, 0.6] },
            { card: 'Number C32: Shark Drake Veiss', title: 'Veiss', color: '#e0f2fe', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Veiss Shark', title: 'Veiss Shark', color: '#bae6fd', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Number C32: Shark Drake LeVeiss', title: 'LeVeiss', color: '#a5f3fc', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Number 71: Rebarian Shark', title: 'Rebarian', color: '#f87171', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Bahamut Shark', title: 'Bahamut', color: '#3b82f6', face: [0.35, 0.25], pan: [0.2, 0.4] },
            { card: 'Number 37: Hope Woven Dragon Spider Shark', title: 'Spider Shark', color: '#c4b5fd', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Number S37: Spider Shark', title: 'S37', color: '#fef08a', face: [0.45, 0.3], pan: [0.2, 0.4] },
            { card: 'Submersible Carrier Aero Shark', title: 'Aero Shark', color: '#7dd3fc', face: [0.5, 0.45], pan: [0.3, 0.5] },
            { card: 'Eagle Shark', title: 'Eagle Shark', color: '#fde68a', face: [0.6, 0.35], pan: [0.25, 0.45] },
            { card: 'Cat Shark', title: 'Cat Shark', color: '#fdba74', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Buzzsaw Shark', title: 'Buzzsaw', color: '#cbd5e1', face: [0.4, 0.3], pan: [0.2, 0.4] },
            { card: 'Valiant Shark Lancer', title: 'Shark Lancer', color: '#a5b4fc', face: [0.5, 0.3], pan: [0.2, 0.4] }
        ]
    };

    window.LoreReelData['nordic'] = {
        kind: 'trail',
        label: 'The Nordic art trail',
        stops: [
            { card: 'Odin, Father of the Aesir', title: 'Odin', color: '#a5f3fc', face: [0.45, 0.2], pan: [0.15, 0.35] },
            { card: 'Nordic Relic Gungnir', title: 'Gungnir', color: '#fde68a', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Nordic Relic Draupnir', title: 'Draupnir', color: '#fcd34d', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Valkyrie of the Nordic Ascendant', title: 'Valkyrie', color: '#e0f2fe', face: [0.5, 0.25], pan: [0.3, 0.15] },
            { card: 'Thor, Lord of the Aesir', title: 'Thor', color: '#fef08a', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Tanngnjostr of the Nordic Beasts', title: 'Tanngnjostr', color: '#d6d3d1', face: [0.6, 0.2], pan: [0.15, 0.35] },
            { card: 'Guldfaxe of the Nordic Beasts', title: 'Guldfaxe', color: '#facc15', face: [0.6, 0.35], pan: [0.25, 0.45] },
            { card: 'Loki, Lord of the Aesir', title: 'Loki', color: '#86efac', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Dverg of the Nordic Alfar', title: 'Dverg', color: '#a8a29e', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Mara of the Nordic Alfar', title: 'Mara', color: '#c4b5fd', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Fenrir the Nordic Wolf', title: 'Fenrir', color: '#94a3b8', face: [0.4, 0.35], pan: [0.25, 0.45] },
            { card: 'Gleipnir, the Fetters of Fenrir', title: 'Gleipnir', color: '#e5e7eb', face: [0.5, 0.5], pan: [0.35, 0.55] },
            { card: 'Jormungardr the Nordic Serpent', title: 'Jormun\u00ADgardr', color: '#67e8f9', face: [0.45, 0.35], pan: [0.25, 0.45] },
            { card: 'Tyr of the Nordic Champions', title: 'Tyr', color: '#fca5a5', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'The Nordic Lights', title: 'Nordic Lights', color: '#5eead4', face: [0.5, 0.4], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['fire-fist'] = {
        kind: 'trail',
        label: 'The Fire Fist art trail',
        stops: [
            { card: 'Brotherhood of the Fire Fist - Horse Prince', title: 'Horse Prince', color: '#fdba74', face: [0.55, 0.25], pan: [0.15, 0.4] },
            { card: 'Brotherhood of the Fire Fist - Spirit', title: 'Spirit', color: '#fde68a', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Brotherhood of the Fire Fist - Tiger King', title: 'Tiger King', color: '#f5f5f4', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Brotherhood of the Fire Fist - Lion Emperor', title: 'Lion Emperor', color: '#fef9c3', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Brotherhood of the Fire Fist - Kirin', title: 'Kirin', color: '#fbbf24', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Brotherhood of the Fire Fist - Eland', title: 'Eland', color: '#f59e0b', face: [0.55, 0.15], pan: [0.1, 0.3] },
            { card: 'Fire Formation - Domei', title: 'Domei', color: '#fca5a5', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Brotherhood of the Fire Fist - Coyote', title: 'Coyote', color: '#fb923c', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Brotherhood of the Fire Fist - Wolf', title: 'Wolf', color: '#f87171', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Brotherhood of the Fire Fist - Bear', title: 'Bear', color: '#a8a29e', face: [0.5, 0.25], pan: [0.15, 0.4] },
            { card: 'Fire Formation - Tensu', title: 'Tensu', color: '#ef4444', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Five Brothers Explosion', title: 'Five Brothers', color: '#dc2626', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Brotherhood of the Fire Fist - Snake', title: 'Snake', color: '#86efac', face: [0.45, 0.2], pan: [0.15, 0.35] },
            { card: 'Brotherhood of the Fire Fist - Peacock', title: 'Peacock', color: '#f0abfc', face: [0.45, 0.25], pan: [0.35, 0.15] },
            { card: 'Ultimate Fire Formation - Seito', title: 'Seito', color: '#fef3c7', face: [0.5, 0.45], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['arcana-force'] = {
        kind: 'trail',
        label: 'The Arcana Force art trail',
        stops: [
            { card: 'Arcana Force 0 - The Fool', title: 'The Fool', color: '#fef9c3', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Arcana Force I - The Magician', title: 'The Magician', color: '#fca5a5', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Arcana Force V - The Hierophant', title: 'The Hierophant', color: '#fde68a', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Arcana Force VI - The Lovers', title: 'The Lovers', color: '#f9a8d4', face: [0.5, 0.2], pan: [0.15, 0.35] },
            { card: 'Arcana Force VII - The Chariot', title: 'The Chariot', color: '#93c5fd', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Arcana Force XIV - Temperance', title: 'Temperance', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.1, 0.35] },
            { card: 'Arcana Force XV - The Fiend', title: 'The Fiend', color: '#a78bfa', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Arcana Force XVIII - The Moon', title: 'The Moon', color: '#e0e7ff', face: [0.4, 0.3], pan: [0.2, 0.4] },
            { card: 'Arcana Force XIX - The Sun', title: 'The Sun', color: '#facc15', face: [0.5, 0.35], pan: [0.25, 0.45] },
            { card: 'Arcana Force XXI - The World', title: 'The World', color: '#fcd34d', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Arcana Force EX - The Light Ruler', title: 'Light Ruler', color: '#fef08a', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Arcana Force EX - The Dark Ruler', title: 'Dark Ruler', color: '#a5b4fc', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Arcana Force EX - The Chaos Ruler', title: 'Chaos Ruler', color: '#e9d5ff', face: [0.5, 0.35], pan: [0.25, 0.45] }
        ]
    };

    window.LoreReelData['flower-cardian'] = {
        kind: 'trail',
        label: 'The Flower Cardian art trail',
        stops: [
            { card: 'Flower Cardian Pine', title: 'Pine', color: '#86efac', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Pine with Crane', title: 'Pine with Crane', color: '#fca5a5', face: [0.45, 0.3], pan: [0.2, 0.4] },
            { card: 'Flower Cardian Cherry Blossom', title: 'Cherry Blossom', color: '#f9a8d4', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Cherry Blossom with Curtain', title: 'Cherry Curtain', color: '#fbcfe8', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Peony with Butterfly', title: 'Peony', color: '#f0abfc', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Clover with Boar', title: 'Clover', color: '#bef264', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Zebra Grass with Moon', title: 'Zebra Moon', color: '#fde68a', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Maple with Deer', title: 'Maple', color: '#fb923c', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Willow', title: 'Willow', color: '#a5f3fc', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Willow with Calligrapher', title: 'Calligrapher', color: '#c4b5fd', face: [0.6, 0.6], pan: [0.4, 0.6] },
            { card: 'Flower Cardian Paulownia with Phoenix', title: 'Paulownia', color: '#fef08a', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Flower Cardian Boardefly', title: 'Boardefly', color: '#fdba74', face: [0.45, 0.25], pan: [0.15, 0.4] },
            { card: 'Flower Cardian Lightshower', title: 'Lightshower', color: '#93c5fd', face: [0.3, 0.25], pan: [0.15, 0.35] },
            { card: 'Flower Cardian Lightflare', title: 'Lightflare', color: '#fef9c3', face: [0.5, 0.15], pan: [0.1, 0.3] },
            { card: 'Flower Cardian Moonflowerviewing', title: 'Moonflower', color: '#e9d5ff', face: [0.45, 0.2], pan: [0.35, 0.15] }
        ]
    };

    window.LoreReelData['timelord'] = {
        kind: 'trail',
        label: 'The Timelord art trail',
        stops: [
            { card: 'Metaion, the Timelord', title: 'Metaion', color: '#fde68a', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Lazion, the Timelord', title: 'Lazion', color: '#fca5a5', face: [0.5, 0.45], pan: [0.3, 0.5] },
            { card: 'Zaphion, the Timelord', title: 'Zaphion', color: '#f9a8d4', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Sadion, the Timelord', title: 'Sadion', color: '#86efac', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Kamion, the Timelord', title: 'Kamion', color: '#f87171', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Michion, the Timelord', title: 'Michion', color: '#fef08a', face: [0.5, 0.4], pan: [0.25, 0.45] },
            { card: 'Hailon, the Timelord', title: 'Hailon', color: '#c4b5fd', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Raphion, the Timelord', title: 'Raphion', color: '#93c5fd', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Gabrion, the Timelord', title: 'Gabrion', color: '#a5f3fc', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Sandaion, the Timelord', title: 'Sandaion', color: '#fef9c3', face: [0.5, 0.3], pan: [0.2, 0.4] },
            { card: 'Sephylon, the Ultimate Timelord', title: 'Sephylon', color: '#fbbf24', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Timelord Progenitor Vorpgate', title: 'Vorpgate', color: '#a78bfa', face: [0.5, 0.3], pan: [0.2, 0.4] }
        ]
    };

    window.LoreReelData['evil-hero'] = {
        kind: 'trail',
        label: 'The Evil HERO art trail',
        stops: [
            { card: 'Evil HERO Inferno Wing', title: 'Inferno Wing', color: '#f87171', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Evil HERO Inferno Wing - Backfire', title: 'Backfire', color: '#fb923c', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'Evil HERO Lightning Golem', title: 'Lightning Golem', color: '#fde047', face: [0.55, 0.12], pan: [0.05, 0.27] },
            { card: 'Evil HERO Malicious Edge', title: 'Malicious Edge', color: '#a8a29e', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Evil HERO Malicious Fiend', title: 'Malicious Fiend', color: '#c084fc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Evil HERO Infernal Gainer', title: 'Infernal Gainer', color: '#f43f5e', face: [0.6, 0.15], pan: [0.07, 0.3] },
            { card: 'Evil HERO Dark Gaia', title: 'Dark Gaia', color: '#a16207', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Evil HERO Dead-End Prison', title: 'Dead-End Prison', color: '#e9d5ff', face: [0.45, 0.35], pan: [0.27, 0.5] },
            { card: 'Evil HERO Infernal Rider', title: 'Infernal Rider', color: '#7c3aed', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Evil HERO Sinister Necrom', title: 'Sinister Necrom', color: '#6366f1', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Evil HERO Toxic Bubble', title: 'Toxic Bubble', color: '#86efac', face: [0.4, 0.25], pan: [0.17, 0.4] },
            { card: 'Evil HERO Adusted Gold', title: 'Adusted Gold', color: '#fcd34d', face: [0.28, 0.12], pan: [0.05, 0.27] },
            { card: 'Evil HERO Neos Lord', title: 'Neos Lord', color: '#a855f7', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Evil HERO Vicious Claws', title: 'Vicious Claws', color: '#d8b4fe', face: [0.5, 0.35], pan: [0.27, 0.5] }
        ]
    };

    window.LoreReelData['gaia'] = {
        kind: 'trail',
        label: 'The Gaia art trail',
        stops: [
            { card: 'Gaia The Fierce Knight', title: 'Gaia', color: '#f87171', face: [0.4, 0.12], pan: [0.05, 0.27] },
            { card: 'Heart of Gaia', title: 'Heart of Gaia', color: '#fca5a5', face: [0.35, 0.2], pan: [0.12, 0.35] },
            { card: 'Gaia the Dragon Champion', title: 'Dragon Champion', color: '#7dd3fc', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Swift Gaia the Fierce Knight', title: 'Swift Gaia', color: '#fdba74', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Charging Gaia the Fierce Knight', title: 'Charging Gaia', color: '#fef08a', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Gaia the Fierce Knight Origin', title: 'Origin', color: '#d6d3d1', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'Gaia the Magical Knight', title: 'Magical Knight', color: '#c4b5fd', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Gaia the Magical Knight of Dragons', title: 'Knight of Dragons', color: '#93c5fd', face: [0.55, 0.3], pan: [0.22, 0.45] },
            { card: 'Galloping Gaia', title: 'Galloping Gaia', color: '#a5b4fc', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Soldier Gaia the Fierce Knight', title: 'Soldier Gaia', color: '#a78bfa', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Gaia, the Mid-Knight Sun', title: 'Mid-Knight Sun', color: '#fef9c3', face: [0.3, 0.2], pan: [0.12, 0.35] },
            { card: 'Gaia Knight, the Force of Earth', title: 'Force of Earth', color: '#a8a29e', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Gaia Dragon, the Thunder Charger', title: 'Thunder Charger', color: '#60a5fa', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Gaia Saber, the Lightning Shadow', title: 'Gaia Saber', color: '#e5e7eb', face: [0.5, 0.2], pan: [0.12, 0.35] }
        ]
    };

    window.LoreReelData['chimera'] = {
        kind: 'trail',
        label: 'The Chimera art trail',
        stops: [
            { card: 'Gazelle the King of Mythical Beasts', title: 'Gazelle', color: '#fbbf24', face: [0.3, 0.25], pan: [0.17, 0.4] },
            { card: 'Berfomet', title: 'Berfomet', color: '#a78bfa', face: [0.4, 0.3], pan: [0.22, 0.45] },
            { card: 'Chimera Fusion', title: 'Chimera Fusion', color: '#fdba74', face: [0.5, 0.5], pan: [0.35, 0.5] },
            { card: 'Chimera the Flying Mythical Beast', title: 'Chimera', color: '#fb923c', face: [0.4, 0.4], pan: [0.32, 0.55] },
            { card: 'Big-Winged Berfomet', title: 'Big-Winged', color: '#c4b5fd', face: [0.35, 0.25], pan: [0.17, 0.4] },
            { card: 'Gazelle the King of Mythical Claws', title: 'Mythical Claws', color: '#fcd34d', face: [0.65, 0.4], pan: [0.32, 0.55] },
            { card: 'Chimera the King of Phantom Beasts', title: 'King of Phantoms', color: '#f97316', face: [0.45, 0.35], pan: [0.27, 0.5] },
            { card: 'Mirror Swordknight', title: 'Mirror Sword\u00ADknight', color: '#e5e7eb', face: [0.3, 0.3], pan: [0.22, 0.45] },
            { card: 'Berfomet the Mythical King of Phantom Beasts', title: 'Mythical King', color: '#d8b4fe', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Cornfield Coatl', title: 'Cornfield Coatl', color: '#86efac', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Chimera the Illusion Beast', title: 'Illusion Beast', color: '#fef08a', face: [0.45, 0.2], pan: [0.12, 0.35] }
        ]
    };

    window.LoreReelData['t-g'] = {
        kind: 'trail',
        label: 'The T.G. art trail',
        stops: [
            { card: 'T.G. Striker', title: 'Striker', color: '#86efac', face: [0.4, 0.2], pan: [0.12, 0.35] },
            { card: 'T.G. Warwolf', title: 'Warwolf', color: '#bef264', face: [0.6, 0.2], pan: [0.12, 0.35] },
            { card: 'T.G. Limiter Removal', title: 'Limiter Removal', color: '#fde68a', face: [0.3, 0.25], pan: [0.17, 0.4] },
            { card: 'T.G. Rush Rhino', title: 'Rush Rhino', color: '#a8a29e', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'T.G. Power Gladiator', title: 'Power Gladiator', color: '#fca5a5', face: [0.47, 0.35], pan: [0.27, 0.5] },
            { card: 'T.G. Hyper Librarian', title: 'Hyper Librarian', color: '#93c5fd', face: [0.4, 0.12], pan: [0.05, 0.27] },
            { card: 'T.G. Wonder Magician', title: 'Wonder Magician', color: '#f0abfc', face: [0.45, 0.25], pan: [0.17, 0.4] },
            { card: 'T.G. Recipro Dragonfly', title: 'Recipro Dragonfly', color: '#5eead4', face: [0.35, 0.45], pan: [0.37, 0.6] },
            { card: 'T.G. Blade Blaster', title: 'Blade Blaster', color: '#7dd3fc', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'T.G. Halberd Cannon', title: 'Halberd Cannon', color: '#e5e7eb', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'T.G. Close', title: 'T.G. Close', color: '#cbd5e1', face: [0.55, 0.35], pan: [0.27, 0.5] },
            { card: 'T.G. Glaive Blaster', title: 'Glaive Blaster', color: '#facc15', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'T.G. Star Guardian', title: 'Star Guardian', color: '#a5f3fc', face: [0.4, 0.3], pan: [0.22, 0.45] },
            { card: 'T.G. All Clear', title: 'All Clear', color: '#bbf7d0', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Shooting Star Dragon T.G. EX', title: 'T.G. EX', color: '#e0f2fe', face: [0.55, 0.35], pan: [0.27, 0.5] }
        ]
    };

    window.LoreReelData['gimmick-puppet'] = {
        kind: 'trail',
        label: 'The Gimmick Puppet art trail',
        stops: [
            { card: 'Number 15: Gimmick Puppet Giant Grinder', title: 'Giant Grinder', color: '#a78bfa', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Gimmick Puppet Little Soldiers', title: 'Little Soldiers', color: '#f87171', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Number C15: Gimmick Puppet Giant Hunter', title: 'Giant Hunter', color: '#c084fc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Gimmick Puppet Fantasix Machinix', title: 'Fantasix', color: '#fef3c7', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'CXyz Gimmick Puppet Fanatix Machinix', title: 'Fanatix', color: '#e9d5ff', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Number 40: Gimmick Puppet of Strings', title: 'Strings', color: '#94a3b8', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Number 88: Gimmick Puppet of Leo', title: 'Leo', color: '#fde68a', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Number C88: Gimmick Puppet Disaster Leo', title: 'Disaster Leo', color: '#fb923c', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Gimmick Puppet Cattle Scream', title: 'Cattle Scream', color: '#fca5a5', face: [0.4, 0.35], pan: [0.27, 0.5] },
            { card: 'Gimmick Puppet Des Troy', title: 'Des Troy', color: '#d6d3d1', face: [0.35, 0.3], pan: [0.22, 0.45] },
            { card: 'Gimmick Puppet Humpty Dumpty', title: 'Humpty Dumpty', color: '#fef9c3', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Gimmick Puppet Scissor Arms', title: 'Scissor Arms', color: '#cbd5e1', face: [0.5, 0.48], pan: [0.4, 0.63] },
            { card: 'Gimmick Puppet Rouge Doll', title: 'Rouge Doll', color: '#f43f5e', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Gimmick Puppet Gigantes Doll', title: 'Gigantes', color: '#a8a29e', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Gimmick Puppet Fiendish Knight', title: 'Fiendish Knight', color: '#c4b5fd', face: [0.5, 0.25], pan: [0.17, 0.4] }
        ]
    };

    window.LoreReelData['battlin-boxer'] = {
        kind: 'trail',
        label: 'The Battlin\' Boxer art trail',
        stops: [
            { card: 'Battlin\' Boxer Glassjaw', title: 'Glassjaw', color: '#bae6fd', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Battlin\' Boxer Headgeared', title: 'Headgeared', color: '#fca5a5', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Battlin\' Boxer Big Bandage', title: 'Big Bandage', color: '#f5f5f4', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Battlin\' Boxer Switchitter', title: 'Switchitter', color: '#fdba74', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Battlin\' Boxer Sparrer', title: 'Sparrer', color: '#fde68a', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlin\' Boxer Counterpunch', title: 'Counter\u00ADpunch', color: '#f87171', face: [0.6, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlin\' Boxer Uppercutter', title: 'Uppercutter', color: '#e5e7eb', face: [0.45, 0.25], pan: [0.17, 0.4] },
            { card: 'Battlin\' Boxer Rabbit Puncher', title: 'Rabbit Puncher', color: '#d6d3d1', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlin\' Boxer Cheat Commissioner', title: 'Cheat Commis\u00ADsioner', color: '#fcd34d', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlin\' Boxer Chief Second', title: 'Chief Second', color: '#93c5fd', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlin\' Boxer Promoter', title: 'Promoter', color: '#c4b5fd', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlin\' Boxer Lead Yoke', title: 'Lead Yoke', color: '#a8a29e', face: [0.55, 0.25], pan: [0.17, 0.4] },
            { card: 'Number 105: Battlin\' Boxer Star Cestus', title: 'Star Cestus', color: '#fde047', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Number C105: Battlin\' Boxer Comet Cestus', title: 'Comet Cestus', color: '#fef08a', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Battlin\' Boxer King Dempsey', title: 'King Dempsey', color: '#ef4444', face: [0.52, 0.35], pan: [0.27, 0.5] }
        ]
    };

    window.LoreReelData['phantom-knights'] = {
        kind: 'trail',
        label: 'The Phantom Knights art trail',
        stops: [
            { card: 'The Phantom Knights of Ancient Cloak', title: 'Ancient Cloak', color: '#c4b5fd', face: [0.45, 0.25], pan: [0.17, 0.4] },
            { card: 'The Phantom Knights of Silent Boots', title: 'Silent Boots', color: '#a5b4fc', face: [0.4, 0.25], pan: [0.17, 0.4] },
            { card: 'The Phantom Knights of Stained Greaves', title: 'Stained Greaves', color: '#94a3b8', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'The Phantom Knights of Doomed Soleret', title: 'Doomed Soleret', color: '#818cf8', face: [0.35, 0.25], pan: [0.17, 0.4] },
            { card: 'The Phantom Knights of Lost Vambrace', title: 'Lost Vambrace', color: '#a78bfa', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'The Phantom Knights of Dark Gauntlets', title: 'Dark Gauntlets', color: '#6366f1', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'The Phantom Knights of Shade Brigandine', title: 'Shade Brigandine', color: '#7c3aed', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'The Phantom Knights of Rusty Bardiche', title: 'Rusty Bardiche', color: '#d6d3d1', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'The Phantom Knights of Break Sword', title: 'Break Sword', color: '#e9d5ff', face: [0.4, 0.25], pan: [0.17, 0.4] },
            { card: 'Raider\'s Knight', title: 'Raider\'s Knight', color: '#f0abfc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'The Phantom Knights of Malevolent Scythe', title: 'Malevolent Scythe', color: '#c084fc', face: [0.6, 0.25], pan: [0.17, 0.4] },
            { card: 'Dark Rebellion Xyz Dragon', title: 'Dark Rebellion', color: '#8b5cf6', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Dark Requiem Xyz Dragon', title: 'Dark Requiem', color: '#a855f7', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Arc Rebellion Xyz Dragon', title: 'Arc Rebellion', color: '#ddd6fe', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Dark Rebellion Xyz Dragon, Four Heavenly Dragons', title: 'Four Heavenly', color: '#e0e7ff', face: [0.5, 0.4], pan: [0.32, 0.55] }
        ]
    };

    window.LoreReelData['red-dragon-archfiend'] = {
        kind: 'trail',
        label: 'The Red Dragon Archfiend art trail',
        stops: [
            { card: 'Red Dragon Archfiend', title: 'Red Dragon Archfiend', color: '#f87171', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Red Rising Dragon', title: 'Red Rising', color: '#fca5a5', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'Majestic Red Dragon', title: 'Majestic Red', color: '#fde68a', face: [0.55, 0.3], pan: [0.22, 0.45] },
            { card: 'Red Nova Dragon', title: 'Red Nova', color: '#ef4444', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Red Supernova Dragon', title: 'Red Supernova', color: '#fb923c', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Red Hypernova Dragon', title: 'Red Hypernova', color: '#fdba74', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Scarred Dragon Archfiend', title: 'Scarred', color: '#dc2626', face: [0.4, 0.3], pan: [0.22, 0.45] },
            { card: 'The Crimson King', title: 'Crimson King', color: '#f97316', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Hot Red Dragon Archfiend', title: 'Hot Red', color: '#b91c1c', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Hot Red Dragon Archfiend Abyss', title: 'Abyss', color: '#991b1b', face: [0.55, 0.3], pan: [0.22, 0.45] },
            { card: 'Hot Red Dragon Archfiend Bane', title: 'Bane', color: '#7f1d1d', face: [0.55, 0.3], pan: [0.22, 0.45] },
            { card: 'Hot Red Dragon Archfiend King Calamity', title: 'King Calamity', color: '#fecaca', face: [0.55, 0.3], pan: [0.22, 0.45] },
            { card: 'Scarlight Red Dragon Archfiend', title: 'Scarlight', color: '#fda4af', face: [0.45, 0.25], pan: [0.17, 0.4] },
            { card: 'Tyrant Red Dragon Archfiend', title: 'Tyrant', color: '#f43f5e', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Crimson Gaia', title: 'Crimson Gaia', color: '#fb7185', face: [0.5, 0.3], pan: [0.22, 0.45] }
        ]
    };

    window.LoreReelData['black-luster-soldier'] = {
        kind: 'trail',
        label: 'The Black Luster Soldier art trail',
        stops: [
            { card: 'Black Luster Ritual', title: 'The ritual', color: '#e9d5ff', face: [0.5, 0.4], pan: [0.3, 0.5] },
            { card: 'Black Luster Soldier', title: 'Black Luster Soldier', color: '#c4b5fd', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'Black Luster Soldier - Envoy of the Beginning', title: 'Envoy of the Beginning', color: '#fef3c7', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Black Luster Soldier - Envoy of the Evening Twilight', title: 'Evening Twilight', color: '#818cf8', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Black Luster Soldier - Sacred Soldier', title: 'Sacred Soldier', color: '#f5f5f4', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Beginning Knight', title: 'Beginning Knight', color: '#fde68a', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Evening Twilight Knight', title: 'Twilight Knight', color: '#a5b4fc', face: [0.4, 0.2], pan: [0.12, 0.35] },
            { card: 'Black Luster Soldier - Super Soldier', title: 'Super Soldier', color: '#93c5fd', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Black Luster Soldier - Soldier of Chaos', title: 'Soldier of Chaos', color: '#a78bfa', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Black Luster Soldier - Legendary Swordsman', title: 'Legendary Swordsman', color: '#fcd34d', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Black Luster Soldier - Soldier of Light and Darkness', title: 'Light and Darkness', color: '#ddd6fe', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'Toon Black Luster Soldier', title: 'Toon', color: '#f9a8d4', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Chaos Form', title: 'Chaos Form', color: '#d8b4fe', face: [0.5, 0.45], pan: [0.3, 0.5] }
        ]
    };

    window.LoreReelData['firewall'] = {
        kind: 'trail',
        label: 'The Firewall art trail',
        stops: [
            { card: 'Firewall Dragon', title: 'Firewall Dragon', color: '#93c5fd', face: [0.45, 0.38], pan: [0.3, 0.53] },
            { card: 'Firewall Dragon Darkfluid', title: 'Darkfluid', color: '#60a5fa', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Firewall Dragon Darkfluid - Neo Tempest Terahertz', title: 'Neo Tempest', color: '#f87171', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Firewall Dragon Singularity', title: 'Singularity', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Firewall eXceed Dragon', title: 'eXceed', color: '#a5b4fc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Firewall Saber Dragon', title: 'Saber', color: '#e5e7eb', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Firewall Guardian', title: 'Guardian', color: '#7dd3fc', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Firewall Defenser', title: 'Defenser', color: '#38bdf8', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Firewall Phantom', title: 'Phantom', color: '#a78bfa', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Firewall', title: 'Firewall', color: '#fdba74', face: [0.45, 0.45], pan: [0.37, 0.6] }
        ]
    };

    window.LoreReelData['speedroid'] = {
        kind: 'trail',
        label: 'The Speedroid art trail',
        stops: [
            { card: 'Speedroid Terrortop', title: 'Terrortop', color: '#86efac', face: [0.4, 0.6], pan: [0.52, 0.65] },
            { card: 'Speedroid Taketomborg', title: 'Taketomborg', color: '#bef264', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Speedroid Red-Eyed Dice', title: 'Red-Eyed Dice', color: '#f87171', face: [0.5, 0.4], pan: [0.32, 0.55] },
            { card: 'Speedroid Tri-Eyed Dice', title: 'Tri-Eyed Dice', color: '#fcd34d', face: [0.45, 0.35], pan: [0.27, 0.5] },
            { card: 'Speedroid Double Yoyo', title: 'Double Yoyo', color: '#93c5fd', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Speedroid Ohajikid', title: 'Ohajikid', color: '#fdba74', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Speedroid Menko', title: 'Menko', color: '#e5e7eb', face: [0.5, 0.45], pan: [0.37, 0.6] },
            { card: 'Speedroid Den-Den Daiko Duke', title: 'Den-Den Daiko', color: '#fde68a', face: [0.4, 0.2], pan: [0.12, 0.35] },
            { card: 'Speedroid Dominobutterfly', title: 'Domino\u00ADbutterfly', color: '#c4b5fd', face: [0.35, 0.3], pan: [0.22, 0.45] },
            { card: 'Speedroid Colonel Clackers', title: 'Colonel Clackers', color: '#60a5fa', face: [0.4, 0.15], pan: [0.07, 0.3] },
            { card: 'Speedroid Pachingo-Kart', title: 'Pachingo-Kart', color: '#fca5a5', face: [0.45, 0.4], pan: [0.32, 0.55] },
            { card: 'Speedroid Skull Marbles', title: 'Skull Marbles', color: '#a8a29e', face: [0.4, 0.45], pan: [0.37, 0.6] },
            { card: 'Hi-Speedroid Kendama', title: 'Kendama', color: '#a5f3fc', face: [0.5, 0.4], pan: [0.32, 0.55] },
            { card: 'Hi-Speedroid Hagoita', title: 'Hagoita', color: '#fef08a', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Hi-Speedroid Kitedrake', title: 'Kitedrake', color: '#7dd3fc', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Speedroid Clear Wing Wonder', title: 'Clear Wing Wonder', color: '#e0f2fe', face: [0.4, 0.45], pan: [0.37, 0.6] },
            { card: 'Hi-Speedroid Clear Wing Rider', title: 'Clear Wing Rider', color: '#bae6fd', face: [0.55, 0.45], pan: [0.37, 0.6] }
        ]
    };

    window.LoreReelData['sacred-beast'] = {
        kind: 'trail',
        label: 'The Sacred Beast art trail',
        stops: [
            { card: 'Uria, Lord of Searing Flames', title: 'Uria', color: '#f87171', face: [0.7, 0.15], pan: [0.07, 0.3] },
            { card: 'Hamon, Lord of Striking Thunder', title: 'Hamon', color: '#fde047', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Raviel, Lord of Phantasms', title: 'Raviel', color: '#a78bfa', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Awakening of the Sacred Beasts', title: 'Awakening', color: '#fdba74', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Sacred Beasts Combined Assault', title: 'Combined Assault', color: '#fb923c', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Sacred Beasts Thunderclap', title: 'Thunderclap', color: '#fef08a', face: [0.55, 0.3], pan: [0.22, 0.45] },
            { card: 'Abyss of the Sacred Beasts', title: 'Abyss', color: '#fca5a5', face: [0.3, 0.2], pan: [0.12, 0.35] },
            { card: 'Raviel, Lord of Phantasms - Shimmering Scraper', title: 'Shimmering Scraper', color: '#c4b5fd', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'Sacred Beasts Skyfall', title: 'Skyfall', color: '#e9d5ff', face: [0.55, 0.4], pan: [0.32, 0.55] },
            { card: 'Sacred Beasts Released', title: 'Released', color: '#e5e7eb', face: [0.4, 0.4], pan: [0.32, 0.55] },
            { card: 'Armityle the Chaos Phantasm', title: 'Armityle', color: '#818cf8', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Armityle the Chaos Phantasm - Phantom of Fury', title: 'Phantom of Fury', color: '#6366f1', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Summoner of the Sacred Beasts', title: 'Summoner', color: '#fbbf24', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'The Chaotic Phantasmal Sacred Beasts', title: 'Chaotic Phantasmal', color: '#f43f5e', face: [0.5, 0.25], pan: [0.17, 0.4] }
        ]
    };

    window.LoreReelData['superheavy-samurai'] = {
        kind: 'trail',
        label: 'The Superheavy Samurai art trail',
        stops: [
            { card: 'Superheavy Samurai Big Benkei', title: 'Big Benkei', color: '#d1d5db', face: [0.4, 0.15], pan: [0.07, 0.3] },
            { card: 'Superheavy Samurai Swordsman', title: 'Swordsman', color: '#e5e7eb', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Superheavy Samurai Blue Brawler', title: 'Blue Brawler', color: '#93c5fd', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Superheavy Samurai Prodigy Wakaushi', title: 'Wakaushi', color: '#86efac', face: [0.4, 0.3], pan: [0.22, 0.45] },
            { card: 'Superheavy Samurai Commander Shanawo', title: 'Shanawo', color: '#4ade80', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Superheavy Samurai Brave Masurawo', title: 'Masurawo', color: '#a8a29e', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Superheavy Samurai Flutist', title: 'Flutist', color: '#d6d3d1', face: [0.4, 0.15], pan: [0.07, 0.3] },
            { card: 'Superheavy Samurai Beast Kyubi', title: 'Kyubi', color: '#fdba74', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Superheavy Samurai Ninja Sarutobi', title: 'Sarutobi', color: '#bef264', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Superheavy Samurai Ogre Shutendoji', title: 'Shutendoji', color: '#f87171', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Superheavy Samurai Swordmaster Musashi', title: 'Musashi', color: '#fde68a', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Superheavy Samurai Wagon', title: 'Wagon', color: '#cbd5e1', face: [0.75, 0.2], pan: [0.12, 0.35] },
            { card: 'Superheavy Samurai Steam Train King', title: 'Steam Train King', color: '#ef4444', face: [0.25, 0.3], pan: [0.22, 0.45] },
            { card: 'Superheavy Samurai Warlord Susanowo', title: 'Susanowo', color: '#9ca3af', face: [0.5, 0.2], pan: [0.12, 0.35] }
        ]
    };

    window.LoreReelData['venom'] = {
        kind: 'trail',
        label: 'The Venom art trail',
        stops: [
            { card: 'Venom Cobra', title: 'Venom Cobra', color: '#86efac', face: [0.6, 0.15], pan: [0.07, 0.3] },
            { card: 'Venom Snake', title: 'Venom Snake', color: '#a3e635', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Venom Boa', title: 'Venom Boa', color: '#bef264', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Venom Serpent', title: 'Venom Serpent', color: '#5eead4', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Venom Swamp', title: 'Venom Swamp', color: '#4ade80', face: [0.5, 0.5], pan: [0.42, 0.65] },
            { card: 'Vennominon the King of Poisonous Snakes', title: 'Vennominon', color: '#16a34a', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Vennominaga the Deity of Poisonous Snakes', title: 'Vennominaga', color: '#22c55e', face: [0.4, 0.2], pan: [0.12, 0.35] },
            { card: 'Starving Venom Fusion Dragon', title: 'Starving Venom', color: '#a78bfa', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Greedy Venom Fusion Dragon', title: 'Greedy Venom', color: '#c084fc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Starving Venom Predapower Fusion Dragon', title: 'Predapower', color: '#d8b4fe', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Odd-Eyes Venom Dragon', title: 'Odd-Eyes Venom', color: '#f0abfc', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Supreme King Dragon Starving Venom', title: 'Supreme King', color: '#7c3aed', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Starving Venom Wing Dragon', title: 'Venom Wing', color: '#e9d5ff', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Starving Venom Fusion Dragon, Four Heavenly Dragons', title: 'Four Heavenly', color: '#ddd6fe', face: [0.5, 0.25], pan: [0.17, 0.4] }
        ]
    };

    window.LoreReelData['magnet-warrior'] = {
        kind: 'trail',
        label: 'The Magnet Warrior art trail',
        stops: [
            { card: 'Alpha The Magnet Warrior', title: 'Alpha', color: '#e5e7eb', face: [0.45, 0.45], pan: [0.37, 0.6] },
            { card: 'Beta The Magnet Warrior', title: 'Beta', color: '#fcd34d', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Gamma the Magnet Warrior', title: 'Gamma', color: '#d6d3d1', face: [0.4, 0.15], pan: [0.07, 0.3] },
            { card: 'Magnetic Field', title: 'Magnetic Field', color: '#a5b4fc', face: [0.5, 0.45], pan: [0.37, 0.6] },
            { card: 'Valkyrion the Magna Warrior', title: 'Valkyrion', color: '#cbd5e1', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Delta The Magnet Warrior', title: 'Delta', color: '#94a3b8', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Epsilon The Magnet Warrior', title: 'Epsilon', color: '#93c5fd', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Beta The Electromagnet Warrior', title: 'Electro\u00ADmagnet', color: '#fde68a', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Berserkion the Electromagna Warrior', title: 'Berserkion', color: '#f87171', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Magnet Warrior Sigma Plus', title: 'Sigma Plus', color: '#fca5a5', face: [0.45, 0.35], pan: [0.27, 0.5] },
            { card: 'Magnet Warrior Sigma Minus', title: 'Sigma Minus', color: '#7dd3fc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Magnet Bonding', title: 'Magnet Bonding', color: '#e9d5ff', face: [0.5, 0.4], pan: [0.32, 0.55] },
            { card: 'Tellusion the Magna Warrior', title: 'Tellusion', color: '#bef264', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Magnet Warrior Omega Plus', title: 'Omega Plus', color: '#fef08a', face: [0.55, 0.25], pan: [0.17, 0.4] }
        ]
    };

    window.LoreReelData['code-talker'] = {
        kind: 'trail',
        label: 'The Code Talker art trail',
        stops: [
            { card: 'Decode Talker', title: 'Decode Talker', color: '#4ade80', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Decode Talker Integration', title: 'Integration', color: '#86efac', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Encode Talker', title: 'Encode', color: '#fef08a', face: [0.6, 0.15], pan: [0.07, 0.3] },
            { card: 'Excode Talker', title: 'Excode', color: '#bae6fd', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Powercode Talker', title: 'Powercode', color: '#f87171', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'Shootingcode Talker', title: 'Shooting\u00ADcode', color: '#7dd3fc', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Transcode Talker', title: 'Transcode', color: '#d6d3d1', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Code Talker', title: 'Code Talker', color: '#a7f3d0', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'Code Talker Inverted', title: 'Inverted', color: '#e5e7eb', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Decode Talker Heatsoul', title: 'Heatsoul', color: '#fb923c', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Protectcode Talker', title: 'Protectcode', color: '#a5b4fc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Accesscode Talker', title: 'Accesscode', color: '#22c55e', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Allied Code Talker @Ignister', title: 'Allied', color: '#c4b5fd', face: [0.5, 0.15], pan: [0.07, 0.3] }
        ]
    };

    window.LoreReelData['masked-hero'] = {
        kind: 'trail',
        label: 'The Masked HERO art trail',
        stops: [
            { card: 'Mask Change', title: 'Mask Change', color: '#93c5fd', face: [0.3, 0.4], pan: [0.32, 0.55] },
            { card: 'Masked HERO Goka', title: 'Goka', color: '#f87171', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Masked HERO Vapor', title: 'Vapor', color: '#7dd3fc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Masked HERO Dusk Crow', title: 'Dusk Crow', color: '#6b7280', face: [0.78, 0.4], pan: [0.32, 0.55] },
            { card: 'Masked HERO Acid', title: 'Acid', color: '#60a5fa', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Masked HERO Dark Law', title: 'Dark Law', color: '#4b5563', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Masked HERO Dian', title: 'Dian', color: '#a16207', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Masked HERO Divine Wind', title: 'Divine Wind', color: '#86efac', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Masked HERO Koga', title: 'Koga', color: '#f5f5f4', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Masked HERO Anki', title: 'Anki', color: '#a78bfa', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Masked HERO Blast', title: 'Blast', color: '#bbf7d0', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Masked HERO Fountain', title: 'Fountain', color: '#bae6fd', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Masked HERO Furnace', title: 'Furnace', color: '#fb923c', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Masked HERO Atomic', title: 'Atomic', color: '#fdba74', face: [0.5, 0.15], pan: [0.07, 0.3] }
        ]
    };

    window.LoreReelData['horus'] = {
        kind: 'trail',
        label: 'The Horus art trail',
        stops: [
            { card: 'Horus the Black Flame Dragon LV4', title: 'LV4', color: '#93c5fd', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Horus\' Servant', title: 'Horus\' Servant', color: '#e5e7eb', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Horus the Black Flame Dragon LV6', title: 'LV6', color: '#60a5fa', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Level Up!', title: 'Level Up!', color: '#fde68a', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Horus the Black Flame Dragon LV8', title: 'LV8', color: '#3b82f6', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dark Horus', title: 'Dark Horus', color: '#4b5563', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Metaphys Horus', title: 'Metaphys', color: '#a5b4fc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Horus the Black Flame Deity', title: 'Deity', color: '#1d4ed8', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Imsety, Glory of Horus', title: 'Imsety', color: '#fef08a', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Hapi, Guidance of Horus', title: 'Hapi', color: '#bae6fd', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Duamutef, Blessing of Horus', title: 'Duamutef', color: '#7dd3fc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Qebehsenuef, Protection of Horus', title: 'Qebehsenuef', color: '#fca5a5', face: [0.5, 0.2], pan: [0.12, 0.35] }
        ]
    };

    window.LoreReelData['cubic'] = {
        kind: 'trail',
        label: 'The Cubic art trail',
        stops: [
            { card: 'Vijam the Cubic Seed', title: 'Vijam', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Cubic Ascension', title: 'Ascension', color: '#e9d5ff', face: [0.5, 0.45], pan: [0.37, 0.6] },
            { card: 'Blade Garoodia the Cubic Beast', title: 'Garoodia', color: '#fde68a', face: [0.58, 0.42], pan: [0.34, 0.57] },
            { card: 'Buster Gundil the Cubic Behemoth', title: 'Gundil', color: '#fdba74', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'Dark Garnex the Cubic Beast', title: 'Garnex', color: '#a8a29e', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Geira Guile the Cubic King', title: 'Geira Guile', color: '#bae6fd', face: [0.55, 0.3], pan: [0.22, 0.45] },
            { card: 'Vulcan Dragni the Cubic King', title: 'Vulcan Dragni', color: '#f87171', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Indiora Doom Volt the Cubic Emperor', title: 'Indiora', color: '#fef08a', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Duza the Meteor Cubic Vessel', title: 'Duza', color: '#fca5a5', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Crimson Nova the Dark Cubic Lord', title: 'Crimson Nova', color: '#dc2626', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Crimson Nova Trinity the Dark Cubic Lord', title: 'Trinity', color: '#ef4444', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Cubic Causality', title: 'Causality', color: '#d8b4fe', face: [0.5, 0.45], pan: [0.37, 0.6] },
            { card: 'Cubic Dharma', title: 'Dharma', color: '#fef9c3', face: [0.4, 0.4], pan: [0.32, 0.55] },
            { card: 'Cubic Mandala', title: 'Mandala', color: '#a78bfa', face: [0.5, 0.45], pan: [0.37, 0.6] }
        ]
    };

    window.LoreReelData['melodious'] = {
        kind: 'trail',
        label: 'The Melodious art trail',
        stops: [
            { card: 'Aria the Melodious Diva', title: 'Aria', color: '#f9a8d4', face: [0.4, 0.12], pan: [0.05, 0.27] },
            { card: 'Sonata the Melodious Diva', title: 'Sonata', color: '#fbcfe8', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Canon the Melodious Diva', title: 'Canon', color: '#f0abfc', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Elegy the Melodious Diva', title: 'Elegy', color: '#c4b5fd', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Melodious Concerto', title: 'Concerto', color: '#fda4af', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Soprano the Melodious Songstress', title: 'Soprano', color: '#fecdd3', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Bacha the Melodious Maestra', title: 'Bacha', color: '#fde68a', face: [0.35, 0.15], pan: [0.07, 0.3] },
            { card: 'Mozarta the Melodious Maestra', title: 'Mozarta', color: '#fcd34d', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Shopina the Melodious Maestra', title: 'Shopina', color: '#a5f3fc', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Schuberta the Melodious Maestra', title: 'Schuberta', color: '#bae6fd', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Bloom Diva the Melodious Choir', title: 'Bloom Diva', color: '#ec4899', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Bloom Prima the Melodious Choir', title: 'Bloom Prima', color: '#facc15', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'Couplet the Melodious Songstress', title: 'Couplet', color: '#f472b6', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Refrain the Melodious Songstress', title: 'Refrain', color: '#e879f9', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Flowering Etoile the Melodious Magnificat', title: 'Flowering Etoile', color: '#fef3c7', face: [0.55, 0.2], pan: [0.12, 0.35] }
        ]
    };

    window.LoreReelData['wind-up'] = {
        kind: 'trail',
        label: 'The Wind-Up art trail',
        stops: [
            { card: 'Legendary Wind-Up Key', title: 'The key', color: '#fde68a', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Wind-Up Soldier', title: 'Soldier', color: '#fca5a5', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Wind-Up Dog', title: 'Dog', color: '#d6d3d1', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'Wind-Up Snail', title: 'Snail', color: '#bef264', face: [0.55, 0.35], pan: [0.27, 0.5] },
            { card: 'Wind-Up Bat', title: 'Bat', color: '#a5b4fc', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Wind-Up Honeybee', title: 'Honeybee', color: '#facc15', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Wind-Up Knight', title: 'Knight', color: '#e5e7eb', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Wind-Up Shark', title: 'Shark', color: '#7dd3fc', face: [0.45, 0.4], pan: [0.32, 0.55] },
            { card: 'Wind-Up Zenmaister', title: 'Zenmaister', color: '#93c5fd', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Wind-Up Zenmaines', title: 'Zenmaines', color: '#a8a29e', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Wind-Up Carrier Zenmaity', title: 'Zenmaity', color: '#60a5fa', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Zenmailstrom', title: 'Zenmail\u00ADstrom', color: '#c4b5fd', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Wind-Up Arsenal Zenmaioh', title: 'Zenmaioh', color: '#fbbf24', face: [0.5, 0.3], pan: [0.22, 0.45] }
        ]
    };

    window.LoreReelData['penguin'] = {
        kind: 'trail',
        label: 'The Penguin art trail',
        stops: [
            { card: 'Penguin Soldier', title: 'Penguin Soldier', color: '#93c5fd', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Penguin Knight', title: 'Penguin Knight', color: '#bae6fd', face: [0.55, 0.2], pan: [0.12, 0.35] },
            { card: 'Nightmare Penguin', title: 'Nightmare', color: '#a5b4fc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Penguin Torpedo', title: 'Torpedo', color: '#f87171', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'The Great Emperor Penguin', title: 'Great Emperor', color: '#fde68a', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Flying Penguin', title: 'Flying', color: '#7dd3fc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Bolt Penguin', title: 'Bolt', color: '#fef08a', face: [0.4, 0.25], pan: [0.17, 0.4] },
            { card: 'Guard Penguin', title: 'Guard', color: '#e5e7eb', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Nopenguin', title: 'Nopenguin', color: '#cbd5e1', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Penguin Brave', title: 'Penguin Brave', color: '#38bdf8', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Penguin Squire', title: 'Squire', color: '#fdba74', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Penguin Ninja', title: 'Ninja', color: '#a8a29e', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Penguin Cleric', title: 'Cleric', color: '#fef9c3', face: [0.45, 0.3], pan: [0.22, 0.45] },
            { card: 'Royal Penguins Garden', title: 'Royal Garden', color: '#86efac', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'First Penguin', title: 'First Penguin', color: '#0ea5e9', face: [0.5, 0.4], pan: [0.32, 0.55] }
        ]
    };

    window.LoreReelData['gizmek'] = {
        kind: 'trail',
        label: 'The Gizmek art trail',
        stops: [
            { card: 'Sacred Scrolls of the Gizmek Legend', title: 'The scrolls', color: '#fde68a', face: [0.5, 0.45], pan: [0.37, 0.6] },
            { card: 'Gizmek Orochi, the Serpentron Sky Slasher', title: 'Orochi', color: '#a5f3fc', face: [0.4, 0.2], pan: [0.12, 0.35] },
            { card: 'Gizmek Kaku, the Supreme Shining Sky Stag', title: 'Kaku', color: '#f87171', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Gizmek Okami, the Dreaded Deluge Dragon', title: 'Okami', color: '#7dd3fc', face: [0.45, 0.25], pan: [0.17, 0.4] },
            { card: 'Gizmek Inaba, the Hopping Hare of Hakuto', title: 'Inaba', color: '#f5f5f4', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Gizmek Uka, the Festive Fox of Fecundity', title: 'Uka', color: '#fdba74', face: [0.4, 0.3], pan: [0.22, 0.45] },
            { card: 'Gizmek Makami, the Ferocious Fanged Fortress', title: 'Makami', color: '#c4b5fd', face: [0.7, 0.35], pan: [0.27, 0.5] },
            { card: 'Gizmek Yata, the Gleaming Vanguard', title: 'Yata', color: '#facc15', face: [0.45, 0.25], pan: [0.17, 0.4] },
            { card: 'Gizmek Naganaki, the Sunrise Signaler', title: 'Naganaki', color: '#fef9c3', face: [0.6, 0.3], pan: [0.22, 0.45] },
            { card: 'Gizmek Taniguku, the Immobile Intellect', title: 'Taniguku', color: '#86efac', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Gizmek Arakami, the Hailbringer Hog', title: 'Arakami', color: '#d6d3d1', face: [0.65, 0.4], pan: [0.32, 0.55] }
        ]
    };

    window.LoreReelData['dinowrestler'] = {
        kind: 'trail',
        label: 'The Dinowrestler art trail',
        stops: [
            { card: 'Dinowrestler Pankratops', title: 'Pankratops', color: '#f87171', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Capoeiraptor', title: 'Capoeiraptor', color: '#fdba74', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Coelasilat', title: 'Coelasilat', color: '#86efac', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Eskrimamenchi', title: 'Eskrima\u00ADmenchi', color: '#bef264', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Capaptera', title: 'Capaptera', color: '#a5f3fc', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Systegosaur', title: 'Systegosaur', color: '#fde68a', face: [0.55, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Iguanodraka', title: 'Iguanodraka', color: '#a3e635', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Rambrachio', title: 'Rambrachio', color: '#d6d3d1', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Martial Ankylo', title: 'Martial Ankylo', color: '#a8a29e', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Dinowrestler Valeonyx', title: 'Valeonyx', color: '#fca5a5', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler Giga Spinosavate', title: 'Spinosavate', color: '#fb923c', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Dinowrestler Terra Parkourio', title: 'Terra Parkourio', color: '#93c5fd', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Dinowrestler King T Wrextle', title: 'King T Wrextle', color: '#ef4444', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Dinowrestler Chimera T Wrextle', title: 'Chimera T Wrextle', color: '#dc2626', face: [0.5, 0.2], pan: [0.12, 0.35] }
        ]
    };

    window.LoreReelData['predaplant'] = {
        kind: 'trail',
        label: 'The Predaplant art trail',
        stops: [
            { card: 'Predaplant Flytrap', title: 'Flytrap', color: '#86efac', face: [0.4, 0.25], pan: [0.17, 0.4] },
            { card: 'Predaplant Darlingtonia Cobra', title: 'Darlingtonia Cobra', color: '#4ade80', face: [0.4, 0.3], pan: [0.22, 0.45] },
            { card: 'Predaplant Moray Nepenthes', title: 'Moray Nepenthes', color: '#5eead4', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Predaplant Squid Drosera', title: 'Squid Drosera', color: '#f9a8d4', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Predaplant Sarraceniant', title: 'Sarrace\u00ADniant', color: '#bef264', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Predaplant Ophrys Scorpio', title: 'Ophrys Scorpio', color: '#fdba74', face: [0.45, 0.25], pan: [0.17, 0.4] },
            { card: 'Predaplant Spinodionaea', title: 'Spinodionaea', color: '#a3e635', face: [0.4, 0.35], pan: [0.27, 0.5] },
            { card: 'Predaplant Pterapenthes', title: 'Ptera\u00ADpenthes', color: '#7dd3fc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Predaplant Spider Orchid', title: 'Spider Orchid', color: '#fde047', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Predaplant Cordyceps', title: 'Cordyceps', color: '#d6d3d1', face: [0.3, 0.2], pan: [0.12, 0.35] },
            { card: 'Predaplant Banksiogre', title: 'Banksiogre', color: '#fca5a5', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Predaplant Chimerafflesia', title: 'Chimeraf\u00ADflesia', color: '#a78bfa', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Predaplant Dragostapelia', title: 'Drago\u00ADstapelia', color: '#c084fc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Predaplant Triphyoverutum', title: 'Triphyo\u00ADverutum', color: '#e879f9', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Predaplant Verte Anaconda', title: 'Verte Anaconda', color: '#22c55e', face: [0.45, 0.45], pan: [0.37, 0.6] }
        ]
    };

    window.LoreReelData['resonator'] = {
        kind: 'trail',
        label: 'The Resonator art trail',
        stops: [
            { card: 'Dark Resonator', title: 'Dark Resonator', color: '#f87171', face: [0.5, 0.4], pan: [0.32, 0.55] },
            { card: 'Darkness Resonator', title: 'Darkness', color: '#b91c1c', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Resonator Command', title: 'Command', color: '#fca5a5', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Crimson Resonator', title: 'Crimson', color: '#ef4444', face: [0.5, 0.52], pan: [0.44, 0.65] },
            { card: 'Clock Resonator', title: 'Clock', color: '#fde68a', face: [0.5, 0.72], pan: [0.64, 0.65] },
            { card: 'Double Resonator', title: 'Double', color: '#fdba74', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Flare Resonator', title: 'Flare', color: '#fb923c', face: [0.5, 0.42], pan: [0.34, 0.57] },
            { card: 'Force Resonator', title: 'Force', color: '#a78bfa', face: [0.6, 0.55], pan: [0.47, 0.65] },
            { card: 'Synkron Resonator', title: 'Synkron', color: '#93c5fd', face: [0.5, 0.5], pan: [0.42, 0.65] },
            { card: 'Soul Resonator', title: 'Soul', color: '#fef08a', face: [0.5, 0.42], pan: [0.34, 0.57] },
            { card: 'Vision Resonator', title: 'Vision', color: '#c4b5fd', face: [0.5, 0.48], pan: [0.4, 0.63] }
        ]
    };

    window.LoreReelData['battlewasp'] = {
        kind: 'trail',
        label: 'The Battlewasp art trail',
        stops: [
            { card: 'Battlewasp - Sting the Poison', title: 'Sting', color: '#fde047', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Battlewasp - Dart the Hunter', title: 'Dart', color: '#fef08a', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Battlewasp - Pin the Bullseye', title: 'Pin', color: '#facc15', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Battlewasp - Twinbow the Attacker', title: 'Twinbow', color: '#fcd34d', face: [0.55, 0.45], pan: [0.37, 0.6] },
            { card: 'Battlewasp - Arbalest the Rapidfire', title: 'Arbalest', color: '#fbbf24', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Battlewasp - Nest', title: 'Nest', color: '#fdba74', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Battlewasp - Azusa the Ghost Bow', title: 'Azusa', color: '#e9d5ff', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlewasp - Hama the Conquering Bow', title: 'Hama', color: '#a5f3fc', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlewasp - Sachi the Ceremonial Bow', title: 'Sachi', color: '#f97316', face: [0.45, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlewasp - Halberd the Charge', title: 'Halberd', color: '#d6d3d1', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Battlewasp - Rapier the Onslaught', title: 'Rapier', color: '#e5e7eb', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Battlewasp - Ballista the Armageddon', title: 'Ballista', color: '#ef4444', face: [0.5, 0.35], pan: [0.27, 0.5] },
            { card: 'Battlewasp - Grand Partisan the Revolution', title: 'Grand Partisan', color: '#dc2626', face: [0.5, 0.35], pan: [0.27, 0.5] }
        ]
    };

    window.LoreReelData['altergeist'] = {
        kind: 'trail',
        label: 'The Altergeist art trail',
        stops: [
            { card: 'Altergeist Primebanshee', title: 'Primebanshee', color: '#c4b5fd', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Altergeist Marionetter', title: 'Marionetter', color: '#f0abfc', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Altergeist Meluseek', title: 'Meluseek', color: '#7dd3fc', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Altergeist Silquitous', title: 'Silquitous', color: '#e9d5ff', face: [0.5, 0.15], pan: [0.07, 0.3] },
            { card: 'Altergeist Multifaker', title: 'Multifaker', color: '#f9a8d4', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Altergeist Pixiel', title: 'Pixiel', color: '#bef264', face: [0.5, 0.3], pan: [0.22, 0.45] },
            { card: 'Altergeist Hexstia', title: 'Hexstia', color: '#fb923c', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Altergeist Kunquery', title: 'Kunquery', color: '#a5b4fc', face: [0.45, 0.15], pan: [0.07, 0.3] },
            { card: 'Altergeist Fifinellag', title: 'Fifinellag', color: '#86efac', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Altergeist Fijialert', title: 'Fijialert', color: '#5eead4', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Altergeist Kidolga', title: 'Kidolga', color: '#fca5a5', face: [0.5, 0.2], pan: [0.12, 0.35] },
            { card: 'Altergeist Memorygant', title: 'Memorygant', color: '#a78bfa', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Altergeist Dragvirion', title: 'Dragvirion', color: '#d8b4fe', face: [0.4, 0.2], pan: [0.12, 0.35] },
            { card: 'Altergeist Adminia', title: 'Adminia', color: '#fde68a', face: [0.5, 0.25], pan: [0.17, 0.4] },
            { card: 'Altergeist Malwisp', title: 'Malwisp', color: '#cbd5e1', face: [0.5, 0.2], pan: [0.12, 0.35] }
        ]
    };
})();
