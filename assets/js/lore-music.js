/**
 * lore-music.js — music for the Lore Archive slideshows (lore-reel.js).
 *
 * lore-reel.js gives every reel a speaker and loads this file, with lore-music-data.js, the
 * first time a reader presses one; nothing here runs or downloads before that. The choice is
 * remembered (localStorage 'loreMusic'): for a reader who left it on, the music starts when a
 * reel comes into view if the browser allows sound without a click (Chrome and Edge do after a
 * click on the previous page of the site), or else at their first click or key press, with the
 * instruments loaded in the meantime (prepare).
 *
 * Each archetype has a palette (lore-music-data.js names it; PALETTES below defines it): its
 * instruments, scale, chords, tempo and meter, drums, and the flourish that opens a chapter.
 * Each chapter has a mood, scored in the data or taken from the slide's colour, which picks an
 * arrangement and one of three written four-bar progressions. The music keeps one pulse and
 * never restarts: a new chapter comes in on the next beat as a new phrase, carrying the theme
 * of whoever the passage names, or the archetype's main theme, which also opens the story and
 * each act. Rosters and art trails get a chapter per pick. Pages that share a palette get their
 * own key, tempo and progressions, so no two sound alike.
 *
 * The instruments are samples from the FluidR3 GM soundfont (CC BY 3.0, credited under the reel
 * while it plays): every third semitone of each, re-pitched in between and levelled on load.
 * A palette is about 2 to 2.5 MB, cached by the browser. The electronic drums, gong and tabla
 * are synthesized.
 *
 * lore-reel.js reports what happens with events on the reel's root:
 *   lore-reel:change   { to }                       a change has started (the mosaic)
 *   lore-reel:chapter  { kind, index, from, count, color, actStart, paused,
 *                        people: [{ name, el, lit, changed }] }
 *   lore-reel:state    { paused }
 * and keeps the last chapter's detail as root.loreReelChapter, for a reel that started before
 * this file loaded. A click on the speaker creates window.LoreReelAudio (an AudioContext), inside
 * the click, so browsers that only allow sound from a click still play it.
 *
 * LoreMusic.setOn(on, root) · LoreMusic.prepare(root) · LoreMusic.isOn() · LoreMusic.measure(mood, palette): loudness of an
 * offline render, for balancing a new palette (each sits near -24 LUFS at the default level).
 */
(function () {
    'use strict';

    // FluidR3 GM, from its GitHub Pages mirror. jsDelivr refuses many of these files, so it's only a fallback.
    const SAMPLE_HOSTS = [
        'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
        'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/'
    ];
    const PREF = 'loreMusic';
    const CREDIT = 'instruments from the FluidR3 GM soundfont (CC BY 3.0)';
    const TICK_MS = 50;
    const LOOKAHEAD_S = 0.3;
    const MASTER = 0.686;   // the level every palette is balanced at

    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    const rand = (a, b) => a + Math.random() * (b - a);
    const dbGain = db => Math.pow(10, db / 20);

    // Scale step s (any integer, wrapping into the next octave) as a MIDI note above base.
    function degree(scale, base, s) {
        const n = scale.length;
        return base + scale[((s % n) + n) % n] + 12 * Math.floor(s / n);
    }

    // FNV-1a: themes built from names, and each page's choice of progressions
    function hashName(name) {
        let h = 2166136261;
        for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
        return h;
    }

    /* ==========================================================================
       Moods: what a chapter feels like. Without a scored mood, the slide's colour picks one.
       ========================================================================== */

    function moodFromColor(hex) {
        if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return 'calm';
        const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, light = (max + min) / 2;
        let hue = 0;
        if (d) hue = 60 * (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4);
        if (d < 0.08) return light < 0.45 ? 'dread' : 'sorrow';   // greys
        if (hue >= 40 && hue < 70) return light > 0.75 ? 'triumph' : 'ceremony';   // gold, and pale gold for a finale
        if (hue < 15 || hue >= 345) return 'battle';
        if (hue < 40) return 'dread';
        if (hue < 165) return 'mystic';
        if (hue < 195) return 'vision';
        if (hue < 250) return 'hope';
        if (hue < 290) return 'wonder';
        return 'calm';
    }

    const MODES = {
        major: [0, 2, 4, 5, 7, 9, 11], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
        minor: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], dorian: [0, 2, 3, 5, 7, 9, 10],
        phrygian: [0, 1, 3, 5, 7, 8, 10]
    };
    const BRIGHT = new Set(['major', 'lydian', 'mixolydian']);

    // Scale families: how a palette hears each mood's mode
    const SCALES = {
        pentatonic: mode => BRIGHT.has(mode) ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10],   // gong and yu modes
        japanese: mode => BRIGHT.has(mode) ? [0, 2, 5, 7, 9] : [0, 1, 5, 7, 8],     // yo and in (miyako-bushi)
        gothic: mode => ({ major: [0, 2, 4, 5, 7, 8, 11], mixolydian: [0, 2, 4, 5, 7, 8, 10], phrygian: [0, 1, 4, 5, 7, 8, 10] })[mode]
            || (BRIGHT.has(mode) ? MODES.major : MODES.harmonic),                        // harmonic major and minor
        raga: mode => (mode === 'harmonic' || mode === 'phrygian') ? [0, 1, 4, 5, 7, 8, 11] : MODES[mode],   // Bhairav for the dark moods
        modal: mode => BRIGHT.has(mode) ? MODES.mixolydian : MODES.dorian            // folk modes
    };

    const QUALITY = { maj: [0, 4, 7], min: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], sus4: [0, 5, 7], add9: [0, 4, 7, 14], dim: [0, 3, 6] };

    /* One arrangement per mood, the same in every palette.
       chords  one per bar: [root, quality, bass], in semitones from the key note (two more in MORE_PROGRESSIONS)
       mode    the mood's mode (the palette's scale family turns it into its own scale)
       lead    the theme's role: soft · heroic · dark · magic · voice · keys (the palette picks the instrument)
       pad     'strings' · 'low' · 'choir' (a choir over the strings) · 'full' (strings, choir, horns)
       arp     'waves' · 'eighths' · 'sixteenths' (pluck) · 'sparkle' (bell) · 'sparse' · 'ostinato' · 'cluster' (keys)
       bass    'whole' · 'half' · 'quarters' · 'eighths' · 'pulse' (a heartbeat)
       perc    'procession' · 'heartbeat' · 'battle' · 'march' · 'swell' · 'shimmer' · 'chaos'
       vel     how hard everything is played (level and brightness) */
    const ARRANGE = {
        calm:     { mode: 'major',      chords: [[0, 'add9'], [9, 'm7'], [5, 'maj7'], [7, 'sus4']],     lead: 'soft',   pad: 'strings', arp: 'waves',      bass: 'whole',    perc: null,         vel: 0.55 },
        wonder:   { mode: 'lydian',     chords: [[0, 'maj7'], [2, 'maj', 0], [4, 'min'], [2, 'maj']],   lead: 'soft',   pad: 'choir',   arp: 'sparkle',    bass: 'whole',    perc: 'shimmer',    vel: 0.6 },
        ceremony: { mode: 'mixolydian', chords: [[0, 'maj'], [10, 'maj'], [5, 'maj'], [0, 'sus4']],     lead: 'heroic', pad: 'strings', arp: null,         bass: 'half',     perc: 'procession', vel: 0.65 },
        vision:   { mode: 'lydian',     chords: [[0, 'maj7'], [3, 'maj7'], [0, 'maj7'], [8, 'maj7']],   lead: 'magic',  pad: 'choir',   arp: 'sparkle',    bass: null,       perc: 'shimmer',    vel: 0.55 },
        dread:    { mode: 'harmonic',   chords: [[0, 'min'], [0, 'min'], [8, 'maj'], [7, 'dom7']],      lead: 'dark',   pad: 'low',     arp: null,         bass: 'pulse',    perc: 'heartbeat',  vel: 0.6 },
        battle:   { mode: 'phrygian',   chords: [[0, 'min'], [1, 'maj'], [0, 'min'], [10, 'maj']],      lead: 'heroic', pad: 'strings', arp: 'ostinato',   bass: 'eighths',  perc: 'battle',     vel: 0.85 },
        sorrow:   { mode: 'minor',      chords: [[8, 'maj7'], [5, 'm7'], [0, 'min'], [7, 'sus4']],      lead: 'keys',   pad: 'strings', arp: 'sparse',     bass: 'whole',    perc: null,         vel: 0.5 },
        mystic:   { mode: 'dorian',     chords: [[0, 'm7'], [5, 'dom7'], [0, 'm7'], [10, 'maj']],       lead: 'soft',   pad: 'choir',   arp: 'waves',      bass: 'whole',    perc: null,         vel: 0.55 },
        chaos:    { mode: 'phrygian',   chords: [[0, 'min'], [6, 'maj'], [1, 'dim'], [6, 'maj']],       lead: 'voice',  pad: 'strings', arp: 'cluster',    bass: 'eighths',  perc: 'chaos',      vel: 0.75, unstable: true },
        hope:     { mode: 'major',      chords: [[5, 'maj'], [0, 'maj', 4], [7, 'maj'], [9, 'm7']],     lead: 'soft',   pad: 'strings', arp: 'eighths',    bass: 'half',     perc: 'swell',      vel: 0.65 },
        triumph:  { mode: 'major',      chords: [[0, 'maj'], [8, 'maj'], [10, 'maj'], [0, 'maj']],      lead: 'heroic', pad: 'full',    arp: 'sixteenths', bass: 'quarters', perc: 'march',      vel: 0.8 }
    };

    // Two more progressions for each mood; each page takes one of the three, picked by its name
    const MORE_PROGRESSIONS = {
        calm:     [[[0, 'add9'], [4, 'm7'], [5, 'maj7'], [0, 'maj', 7]],   [[5, 'maj7'], [0, 'add9'], [5, 'maj7'], [7, 'sus4']]],
        wonder:   [[[0, 'add9'], [2, 'maj', 0], [11, 'min'], [2, 'maj']],  [[0, 'maj7'], [7, 'maj'], [2, 'maj'], [4, 'min']]],
        ceremony: [[[0, 'maj'], [5, 'maj'], [10, 'maj'], [0, 'maj']],      [[5, 'maj'], [0, 'maj'], [10, 'maj'], [7, 'min']]],
        vision:   [[[0, 'maj7'], [4, 'maj7'], [8, 'maj7'], [4, 'maj7']],   [[0, 'add9'], [8, 'maj7'], [4, 'maj7'], [3, 'maj7']]],
        dread:    [[[0, 'min'], [1, 'maj'], [0, 'min'], [7, 'dom7']],      [[0, 'min'], [8, 'maj'], [5, 'min'], [7, 'dom7']]],
        battle:   [[[0, 'min'], [8, 'maj'], [10, 'maj'], [0, 'min']],      [[0, 'min'], [3, 'maj'], [10, 'maj'], [1, 'maj']]],
        sorrow:   [[[0, 'min'], [10, 'maj'], [8, 'maj'], [7, 'maj']],      [[5, 'm7'], [0, 'min'], [8, 'maj7'], [7, 'sus4']]],
        mystic:   [[[0, 'm7'], [2, 'm7'], [5, 'maj'], [0, 'm7']],          [[0, 'm7'], [10, 'maj'], [5, 'maj'], [3, 'maj7']]],
        chaos:    [[[0, 'min'], [1, 'min'], [6, 'maj'], [7, 'dom7']],      [[0, 'min'], [11, 'maj'], [5, 'dim'], [6, 'maj']]],
        hope:     [[[0, 'maj'], [7, 'maj', 11], [9, 'm7'], [5, 'maj']],    [[9, 'm7'], [5, 'maj'], [0, 'maj'], [7, 'maj']]],
        triumph:  [[[0, 'maj'], [5, 'maj'], [7, 'maj'], [0, 'maj']],       [[0, 'maj'], [4, 'min'], [5, 'maj'], [7, 'maj']]]
    };
    const progressionsOf = mood => [ARRANGE[mood].chords, ...MORE_PROGRESSIONS[mood]];
    const variantFor = (key, mood) => hashName(key + ':' + mood) % 3;

    // A theme from the letters of a name: every person and archetype has one, written or not
    function melodyFromName(name) {
        const h = hashName(name), shapes = [[1, 1, 2, 1, 3], [2, 1, 1, 2, 2], [1, 1, 1, 1, 4], [1.5, 0.5, 2, 2, 2]];
        let s = 0;
        return { notes: shapes[h % 4].map((beats, i) => { if (i) s += ((h >>> (i * 4)) % 7) - 3; return [s, beats]; }) };
    }

    /* ==========================================================================
       Instruments and palettes
       ========================================================================== */

    // held: a sustained sound (long notes are chained, see held()). oct: where it plays a theme, above
    // the key. trim: dB, for a sample that sounds louder than its level says (bright or dense).
    const INSTRUMENTS = {
        // orchestra
        strings:          { sf: 'string_ensemble_1', lo: 42, hi: 81, held: true },
        bass:             { sf: 'contrabass', lo: 27, hi: 51, held: true },
        pizzicato:        { sf: 'pizzicato_strings', lo: 30, hi: 60 },   // short bass notes: a bowed bass barely speaks in a quarter of a second
        harp:             { sf: 'orchestral_harp', lo: 57, hi: 90 },
        flute:            { lo: 60, hi: 93, held: true, oct: 24 },
        horn:             { sf: 'french_horn', lo: 42, hi: 75, held: true, oct: 12 },
        choir:            { sf: 'choir_aahs', lo: 54, hi: 81, held: true, oct: 12 },
        celesta:          { lo: 72, hi: 99, oct: 24 },
        keys:             { sf: 'acoustic_grand_piano', lo: 42, hi: 84, oct: 12 },
        oboe:             { lo: 57, hi: 90, held: true, oct: 12 },
        clarinet:         { lo: 50, hi: 87, held: true, oct: 12, trim: -1.5 },
        trumpet:          { lo: 52, hi: 82, held: true, oct: 12, trim: -4 },
        bassoon:          { lo: 34, hi: 70, held: true, oct: 0 },
        timpani:          { lo: 36, hi: 51 },
        taiko:            { sf: 'taiko_drum', only: [48] },
        cymbal:           { sf: 'reverse_cymbal', only: [60] },
        // electronic
        synth_strings_1:  { lo: 42, hi: 81, held: true },
        synth_choir:      { lo: 54, hi: 81, held: true, oct: 12 },
        synth_brass_1:    { lo: 42, hi: 72, held: true },
        synth_bass_1:     { lo: 27, hi: 51 },
        lead_2_sawtooth:  { lo: 48, hi: 87, held: true, oct: 12 },
        lead_1_square:    { lo: 48, hi: 87, held: true, oct: 12 },
        fx_3_crystal:     { lo: 60, hi: 96, oct: 24 },
        electric_piano_2: { lo: 42, hi: 84, oct: 12 },
        // east Asian
        koto:             { lo: 45, hi: 90, oct: 12 },
        shamisen:         { lo: 45, hi: 81, oct: 12 },
        shakuhachi:       { lo: 57, hi: 87, held: true, oct: 12 },
        shanai:           { lo: 57, hi: 87, held: true, oct: 12, trim: -2 },
        violin:           { lo: 54, hi: 90, held: true, oct: 12 },
        woodblock:        { only: [72] },
        // gothic and sacred
        harpsichord:      { lo: 42, hi: 87, trim: -4 },
        church_organ:     { lo: 36, hi: 78, held: true, trim: -4 },
        tubular_bells:    { lo: 48, hi: 78 },
        music_box:        { lo: 66, hi: 96, oct: 24 },
        cello:            { lo: 36, hi: 66, held: true, oct: 0 },
        // Indian
        sitar:            { lo: 36, hi: 81, oct: 12 },
        tinkle_bell:      { lo: 66, hi: 96, oct: 24 },
        voice_oohs:       { lo: 54, hi: 78, held: true, oct: 12 },
        // playful, tribal, medieval
        glockenspiel:     { lo: 72, hi: 99, oct: 24 },
        marimba:          { lo: 45, hi: 84, oct: 12 },
        kalimba:          { lo: 60, hi: 90, oct: 12 },
        pan_flute:        { lo: 60, hi: 90, held: true, oct: 12 },
        recorder:         { lo: 60, hi: 90, held: true, oct: 12 },
        fiddle:           { lo: 55, hi: 88, held: true, oct: 12 },
        bagpipe:          { lo: 50, hi: 72, held: true, trim: -3 }
    };

    /* Palettes: an archetype's sound.
       Roles: pad, choir, horns (the chords), pluck, bell, keys (the arpeggios), bass, bassShort (bass notes under
       half a second), drone, and a lead per theme role.
       chords  'tertian' · 'open' (root, fifth, ninth) · 'quartal' (stacked fourths) · 'drone' (no chord changes)
       scale   a scale family (SCALES); arpFrom 'scale' walks the scale instead of the chord
       glide   long theme notes slide in from below; waltz: oom-pah-pah in 3/4; pump: pads duck under the kick
       kit     the drums (KITS); groove: the kit's pattern under the quiet moods; padLevel: the chords' share
       flourish  what opens each chapter: 'gliss' (a run up the pluck), 'bell-gliss', 'toll' (a bell), 'strum' (sitar)
       trim    dB, so every palette sits near -24 LUFS at the default level */
    const PALETTES = {
        fantasy: {
            label: 'Fantasy orchestra', bpm: 80, meter: 4, chords: 'tertian', trim: -8,
            pad: 'strings', choir: 'choir', horns: 'horn', pluck: 'harp', bell: 'celesta', keys: 'keys', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'flute', heroic: 'horn', dark: 'horn', magic: 'celesta', voice: 'choir', keys: 'keys' },
            kit: 'orchestral', flourish: 'gliss'
        },
        medieval: {   // recorder, fiddle and harp, folk modes, bagpipes when the chords go full
            label: 'Medieval', bpm: 88, meter: 4, chords: 'tertian', scale: 'modal', trim: -8,
            pad: 'strings', choir: 'choir', horns: 'bagpipe', pluck: 'harp', bell: 'celesta', keys: 'harp', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'recorder', heroic: 'fiddle', dark: 'cello', magic: 'harp', voice: 'choir', keys: 'harp' },
            kit: 'celtic', flourish: 'gliss'
        },
        sacred: {   // organ, choir, heavenly trumpets and tolling bells
            label: 'Sacred', bpm: 66, meter: 4, chords: 'tertian', trim: -8,
            pad: 'church_organ', choir: 'choir', horns: 'trumpet', pluck: 'harp', bell: 'celesta', keys: 'harp', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'choir', heroic: 'trumpet', dark: 'cello', magic: 'celesta', voice: 'choir', keys: 'harp' },
            kit: 'sacred', flourish: 'toll'
        },
        playful: {   // pizzicato, glockenspiel, clarinet and bassoon, woodblocks
            label: 'Playful', bpm: 104, meter: 4, chords: 'tertian', trim: -6.8, padLevel: 0.7,
            pad: 'strings', choir: 'voice_oohs', horns: 'clarinet', pluck: 'pizzicato', bell: 'glockenspiel', keys: 'marimba', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'clarinet', heroic: 'trumpet', dark: 'bassoon', magic: 'glockenspiel', voice: 'voice_oohs', keys: 'marimba' },
            kit: 'toy', groove: true, flourish: 'bell-gliss'
        },
        horror: {
            label: 'Gothic horror', bpm: 132, meter: 3, chords: 'tertian', scale: 'gothic', waltz: true, trim: -7.5,
            pad: 'strings', choir: 'choir', horns: 'church_organ', pluck: 'harpsichord', bell: 'music_box', keys: 'keys', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'music_box', heroic: 'cello', dark: 'cello', magic: 'celesta', voice: 'choir', keys: 'keys' },
            kit: 'horror', groove: true, flourish: 'toll'
        },
        tribal: {   // kalimba, marimba and pan flute over hand drums, pentatonic
            label: 'Tribal', bpm: 96, meter: 4, chords: 'open', scale: 'pentatonic', arpFrom: 'scale', glide: true, trim: -7.2,
            pad: 'strings', choir: 'voice_oohs', pluck: 'kalimba', bell: 'kalimba', keys: 'marimba', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'pan_flute', heroic: 'horn', dark: 'pan_flute', magic: 'kalimba', voice: 'voice_oohs', keys: 'marimba' },
            kit: 'tribal', groove: true, flourish: 'gliss'
        },
        electronic: {
            label: 'Electronic', bpm: 112, meter: 4, chords: 'tertian', trim: -8, pump: true, bassDrive: true,
            pad: 'synth_strings_1', choir: 'synth_choir', horns: 'synth_brass_1', pluck: 'lead_2_sawtooth', bell: 'fx_3_crystal', keys: 'electric_piano_2', bass: 'synth_bass_1',
            lead: { soft: 'electric_piano_2', heroic: 'lead_2_sawtooth', dark: 'lead_1_square', magic: 'fx_3_crystal', voice: 'synth_choir', keys: 'electric_piano_2' },
            kit: 'electronic', groove: true, flourish: 'gliss'
        },
        wuxia: {   // guzheng, dizi, suona and erhu stand-ins: koto, flute, shanai, violin
            label: 'Wuxia', bpm: 76, meter: 4, chords: 'open', scale: 'pentatonic', arpFrom: 'scale', glide: true, trim: -8,
            pad: 'strings', choir: 'choir', pluck: 'koto', bell: 'koto', keys: 'shamisen', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'flute', heroic: 'shanai', dark: 'violin', magic: 'koto', voice: 'violin', keys: 'koto' },
            kit: 'eastern', flourish: 'gliss'
        },
        japanese: {
            label: 'Japanese', bpm: 72, meter: 4, chords: 'quartal', scale: 'japanese', arpFrom: 'scale', glide: true, trim: -7,
            pad: 'strings', choir: 'choir', pluck: 'koto', bell: 'koto', keys: 'shamisen', bass: 'bass', bassShort: 'pizzicato',
            lead: { soft: 'shakuhachi', heroic: 'shakuhachi', dark: 'shakuhachi', magic: 'koto', voice: 'choir', keys: 'koto' },
            kit: 'japanese', flourish: 'gliss'
        },
        indian: {   // bansuri and shehnai stand-ins: flute, shanai
            label: 'Indian', bpm: 84, meter: 4, chords: 'drone', scale: 'raga', arpFrom: 'scale', glide: true, trim: -8,
            pad: 'strings', choir: 'voice_oohs', drone: 'sitar', pluck: 'sitar', bell: 'tinkle_bell', keys: 'sitar', bass: null,
            lead: { soft: 'flute', heroic: 'shanai', dark: 'sitar', magic: 'tinkle_bell', voice: 'voice_oohs', keys: 'sitar' },
            kit: 'tabla', groove: true, flourish: 'strum'
        }
    };

    // Per page: a palette's pages are spread across these keys and tempos in the order lore-music-data.js
    // lists them, so siblings never share both (for up to 40), and adding a page never moves the others.
    const KEY_CHOICES = [46, 47, 48, 49, 50, 51, 52, 53];   // B♭ to F, in the pad register
    const TEMPO_CHOICES = [0.92, 0.96, 1, 1.04, 1.08];
    function signature(key) {
        const all = (window.LoreMusicData && window.LoreMusicData.reels) || {};
        const palette = all[key] ? all[key].palette : '', h = hashName(palette);
        const i = Math.max(0, Object.keys(all).filter(k => all[k].palette === palette).indexOf(key));
        // Steps of 3 keys and 2 tempos: coprime with the number of choices, so every sibling lands elsewhere
        return { home: KEY_CHOICES[(h + i * 3) % KEY_CHOICES.length], tempo: TEMPO_CHOICES[((h >>> 3) + i * 2) % TEMPO_CHOICES.length] };
    }

    /* ==========================================================================
       Audio graph and synthesized sounds
       everything → bus: fade (reel on screen) ─┬→ master → high-pass → limiter → out
       reverb sends ──→ the bus's wet side → hall ┘
       ========================================================================== */
    const gainNode = (ctx, value) => { const g = ctx.createGain(); g.gain.value = value; return g; };

    function hallIR(ctx, seconds) {
        const sr = ctx.sampleRate, len = Math.ceil(sr * seconds), pre = Math.floor(sr * 0.02);
        const ir = ctx.createBuffer(2, len, sr);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            let lp = 0;
            for (let i = pre; i < len; i++) {
                const x = (i - pre) / (len - pre);
                const a = Math.exp(-2 * Math.PI * (7000 - 6000 * x) / sr);   // darker as it dies away
                lp = (1 - a) * (Math.random() * 2 - 1) + a * lp;
                d[i] = lp * Math.exp(-5.5 * x);
            }
        }
        return ir;
    }

    function makeGraph(ctx) {
        const g = { ctx, noise: null };
        g.master = gainNode(ctx, MASTER);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 30;
        const lim = ctx.createDynamicsCompressor();
        lim.threshold.value = -10; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.25;
        g.master.connect(hp); hp.connect(lim); lim.connect(ctx.destination);
        g.hall = ctx.createConvolver();
        g.hall.buffer = hallIR(ctx, 3);
        g.hall.connect(g.master);
        const dry = gainNode(ctx, 0), wet = gainNode(ctx, 0);
        dry.connect(g.master);
        wet.connect(g.hall);
        g.bus = { dry, wet };
        g.fades = [dry.gain, wet.gain];
        return g;
    }

    function fadeTo(params, value, t, tau) {
        params.forEach(p => { p.cancelScheduledValues(t); p.setTargetAtTime(value, t, tau); });
    }

    function route(ctx, node, out, wet) {
        node.connect(out.dry);
        if (wet) { const send = gainNode(ctx, wet); node.connect(send); send.connect(out.wet); }
    }

    function panned(ctx, node, pan) {
        if (!pan) return node;
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        node.connect(p);
        return p;
    }

    // 0 → peak → silence. gain.value starts at 0 so nothing leaks through before t.
    function env(ctx, t, peak, attack, decay) {
        const e = gainNode(ctx, 0);
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(peak, t + attack);
        e.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        return e;
    }

    function noiseBuffer(g) {
        if (g.noise) return g.noise;
        const len = g.ctx.sampleRate * 2, buf = g.ctx.createBuffer(1, len, g.ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return (g.noise = buf);
    }

    // Struck tone: FM whose brightness fades faster than its level (the gong)
    function strike(g, t, freq, out, { level, decay, ratio = 1, index = 1, attack = 0.004, wet = 0.4 }) {
        const ctx = g.ctx, car = ctx.createOscillator(), mod = ctx.createOscillator(), depth = gainNode(ctx, 0);
        car.frequency.value = freq;
        mod.frequency.value = freq * ratio;
        depth.gain.setValueAtTime(freq * index, t);
        depth.gain.exponentialRampToValueAtTime(freq * index * 0.03 + 0.001, t + Math.min(decay, 0.25 + decay * 0.3));
        mod.connect(depth); depth.connect(car.frequency);
        const e = env(ctx, t, level, attack, decay);
        car.connect(e);
        route(ctx, e, out, wet);
        const end = t + attack + decay + 0.05;
        car.start(t); mod.start(t); car.stop(end); mod.stop(end);
    }

    function noiseHit(g, t, out, { level, decay, type = 'bandpass', freq = 1000, q = 1, attack = 0.002, wet = 0.2 }) {
        const ctx = g.ctx, src = ctx.createBufferSource(), f = ctx.createBiquadFilter();
        src.buffer = noiseBuffer(g);
        f.type = type; f.frequency.value = freq; f.Q.value = q;
        const e = env(ctx, t, level, attack, decay);
        src.connect(f); f.connect(e);
        route(ctx, e, out, wet);
        src.start(t, Math.random()); src.stop(t + attack + decay + 0.05);
    }

    // Noise through a band-pass sweeping f0 → f1, swelling in
    function noiseSweep(g, t, out, dur, f0, f1, level) {
        const ctx = g.ctx, src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), e = gainNode(ctx, 0);
        src.buffer = noiseBuffer(g);
        bp.type = 'bandpass'; bp.Q.value = 2;
        bp.frequency.setValueAtTime(f0, t);
        bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(level, t + dur * 0.8);
        e.gain.linearRampToValueAtTime(0, t + dur);
        src.connect(bp); bp.connect(e);
        route(ctx, e, out, 0.5);
        src.start(t, Math.random()); src.stop(t + dur + 0.05);
    }

    // Drum body: a sine dropping onto its pitch, plus its octave so laptop speakers still carry it
    function thump(g, t, freq, out, { level, decay, drop = 1.6, wet = 0.25 }) {
        [[1, 1], [2, 0.35]].forEach(([mult, part]) => {
            const o = g.ctx.createOscillator();
            o.frequency.setValueAtTime(freq * mult * drop, t);
            o.frequency.exponentialRampToValueAtTime(freq * mult, t + 0.08);
            const e = env(g.ctx, t, level * part, 0.004, decay * (mult === 1 ? 1 : 0.6));
            o.connect(e);
            route(g.ctx, e, out, wet);
            o.start(t); o.stop(t + decay + 0.1);
        });
    }

    /* ==========================================================================
       Samples
       ========================================================================== */
    const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const noteName = m => FLATS[m % 12] + (Math.floor(m / 12) - 1);

    // Each sample is levelled to the same loudest-50-ms RMS, so the mix is set by design rather than by how
    // loud the soundfont recorded each note. peakAt: where the reverse cymbal is loudest.
    function levelSample(buf) {
        const d = buf.getChannelData(0), win = Math.floor(buf.sampleRate * 0.05), end = Math.min(d.length, buf.sampleRate * 3.2);
        let loudest = 0, peak = 0, peakAt = 0;
        for (let i = 0; i + win <= end; i += win) {
            let sum = 0;
            for (let j = i; j < i + win; j++) sum += d[j] * d[j];
            loudest = Math.max(loudest, Math.sqrt(sum / win));
        }
        for (let i = 0; i < end; i++) { const x = Math.abs(d[i]); if (x > peak) { peak = x; peakAt = i; } }
        return { gain: Math.min(20, 0.25 / (loudest || 1)), peakAt: peakAt / buf.sampleRate };
    }

    const BANK = {};   // instrument → { keys, notes: Map(midi → { buffer, gain, peakAt }), ready }

    async function fetchSample(ctx, name, m) {
        for (const host of SAMPLE_HOSTS) {
            try {
                const res = await fetch(`${host}${INSTRUMENTS[name].sf || name}-mp3/${noteName(m)}.mp3`);
                if (!res.ok) continue;
                const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
                return { buffer, ...levelSample(buffer) };
            } catch (e) { /* try the next host */ }
        }
        return null;
    }

    // Decoded buffers aren't tied to a context, so one load serves the page and the offline renders
    function loadInstrument(ctx, name) {
        if (BANK[name]) return BANK[name].ready;
        const spec = INSTRUMENTS[name], bank = BANK[name] = { keys: [], notes: new Map() };
        const want = spec.only ? spec.only.slice() : [];
        if (!spec.only) for (let m = Math.ceil(spec.lo / 3) * 3; m <= spec.hi; m += 3) want.push(m);
        bank.ready = Promise.all(want.map(m => fetchSample(ctx, name, m).then(s => { if (s) bank.notes.set(m, s); })))
            .then(() => { bank.keys = [...bank.notes.keys()].sort((a, b) => a - b); return bank.keys.length > 0; });
        return bank.ready;
    }

    function paletteInstruments(pal) {
        const unique = list => [...new Set(list.filter(Boolean))];
        const core = unique([pal.pad, pal.bass, pal.pluck, pal.drone]);
        const rest = unique([...Object.values(pal.lead), pal.bassShort, pal.choir, pal.horns, pal.bell, pal.keys, ...(KITS[pal.kit] ? KITS[pal.kit].needs : [])])
            .filter(name => !core.includes(name));
        return { core, rest };
    }

    // Resolves true once the core instruments are in; the rest keep loading and join the music as they arrive
    async function loadPalette(ctx, pal, progress) {
        const { core, rest } = paletteInstruments(pal), total = core.length + rest.length;
        let done = 0;
        const one = name => loadInstrument(ctx, name).then(ok => { done++; progress(done, total); return ok; });
        progress(0, total);
        const ok = (await Promise.all(core.map(one))).every(Boolean);
        (async () => { for (let i = 0; i < rest.length; i += 3) await Promise.all(rest.slice(i, i + 3).map(one)); })();
        return ok;
    }

    function nearestKey(bank, midi) {
        let best = bank.keys[0];
        for (const k of bank.keys) if (Math.abs(k - midi) < Math.abs(best - midi)) best = k;
        return best;
    }

    // One note from a sampled instrument. vel sets both level and brightness, as playing harder would.
    // glide: the note slides up into its pitch from that many semitones below.
    function sample(p, name, midi, t, { vel = 0.7, dur = 1, attack = 0.005, release = 0.3, offset = 0, pan = 0, wet = 0.3, detune = 0, level = 1, glide = 0, out = null } = {}) {
        const bank = BANK[name];
        if (!bank || !bank.keys.length) return;   // still loading: that part is silent for now
        const key = nearestKey(bank, midi), s = bank.notes.get(key), ctx = p.ctx;
        const rate = Math.pow(2, (midi - key) / 12);
        const room = (s.buffer.duration - offset) / rate - release - 0.02;
        if (room <= attack) return;
        const hold = Math.min(Math.max(dur, attack), room);
        const peak = level * s.gain * (0.4 + 0.6 * vel) * dbGain(INSTRUMENTS[name].trim || 0);
        const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), e = gainNode(ctx, 0);
        src.buffer = s.buffer;
        if (glide) {
            src.playbackRate.setValueAtTime(rate * Math.pow(2, -glide / 12), t);
            src.playbackRate.linearRampToValueAtTime(rate, t + 0.12);
        } else {
            src.playbackRate.value = rate;
        }
        src.detune.value = detune;
        lp.type = 'lowpass';
        lp.frequency.value = 900 + vel * vel * 11000;
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(peak, t + attack);
        e.gain.setValueAtTime(peak, t + hold);
        e.gain.linearRampToValueAtTime(0, t + hold + release);
        src.connect(lp); lp.connect(e);
        route(ctx, panned(ctx, e, pan), out || p.out, wet);
        src.start(t, offset);
        src.stop(t + hold + release + 0.05);
    }

    // A held note on a sustained instrument. Its samples last about 3 s, so a longer note is a chain of
    // copies taken from past the attack and crossfaded, which lets strings and choir hold a whole bar.
    function held(p, name, midi, t, len, o = {}) {
        const release = o.release || 0.6;
        sample(p, name, midi, t, { ...o, dur: Math.min(len, 1.6), attack: o.attack || 0.12, release });
        for (let at = 1.2; at < len - 0.3; at += 1.2) {
            sample(p, name, midi, t + at, { ...o, glide: 0, offset: 0.6, dur: Math.min(1.6, len - at), attack: 0.5, release });
        }
    }

    /* ==========================================================================
       Harmony
       ========================================================================== */
    const scaleFor = (pal, arr) => pal.scale ? SCALES[pal.scale](arr.mode) : MODES[arr.mode];

    // The bar's chord in the palette's style, its bass note, and the palette's scale as pitch classes
    function chordOf(p, [root, quality, bass]) {
        const key = p.cur.key, style = p.pal.chords, drone = style === 'drone';
        const ints = style === 'open' ? [0, 7, 14] : style === 'quartal' ? [0, 5, 10] : drone ? [0, 7] : QUALITY[quality];
        const r = drone ? 0 : root;
        let b = key - 12 + (drone ? 0 : bass === undefined ? root : bass);
        while (b > 45) b -= 12;
        while (b < 33) b += 12;
        return {
            pcs: [...new Set(ints.map(i => (key + r + i) % 12))], bass: b, tertian: style === 'tertian',
            scale: scaleFor(p.pal, p.cur.arr).map(i => (key + i) % 12)
        };
    }

    function tonesIn(pcs, lo, hi) {
        const out = [];
        for (let m = lo; m <= hi; m++) if (pcs.includes(m % 12)) out.push(m);
        return out;
    }

    // Four voices (root doubled for a triad) inside [lo, hi], each moving as little as it can from the last
    // chord: the smooth voice leading that makes a progression sound written rather than stacked.
    function voiceLead(pcs, lo, hi, prev) {
        const want = pcs.length >= 4 ? pcs.slice(0, 4) : [...pcs, pcs[0], pcs[1] ?? pcs[0]].slice(0, 4);
        const options = want.map(pc => tonesIn([pc], lo, hi));
        let best = null, bestCost = Infinity;
        const pick = (i, chosen) => {
            if (i === want.length) {
                const v = [...chosen].sort((a, b) => a - b);
                if (new Set(v).size < v.length) return;
                let cost = prev && prev.length === v.length ? v.reduce((sum, m, j) => sum + Math.abs(m - prev[j]), 0)
                    : Math.abs(v[0] + v[3] - lo - hi) / 2;
                if (v[3] - v[0] > 19) cost += 6;   // keep it close
                for (let j = 1; j < v.length; j++) if (v[j] - v[j - 1] < 3 && v[j] < 60) cost += 4;   // no mud low down
                if (cost < bestCost) { bestCost = cost; best = v; }
                return;
            }
            options[i].forEach(m => { chosen.push(m); pick(i + 1, chosen); chosen.pop(); });
        };
        pick(0, []);
        return best || want.map(pc => tonesIn([pc], lo, lo + 11)[0]);
    }

    /* ==========================================================================
       Percussion and kits
       ========================================================================== */
    // Levels relative to the levelled samples; SYN for the synthesized drums
    const MIX = { pad: 0.2, choir: 0.13, horns: 0.13, bass: 0.25, pizz: 0.4, pluck: 0.42, bell: 0.24, keys: 0.3, lead: 0.5, drone: 0.28, stab: 0.16,
        timpani: 0.55, taiko: 0.5, cymbal: 0.3, woodblock: 0.3, bells: 0.35 };
    const SYN = { kick: 0.45, snare: 0.25, hat: 0.08, riser: 0.07, gong: 0.12, tabla: 0.22 };

    function timpaniNote(chord) {
        let m = chord.bass;
        while (m < 38) m += 12;
        while (m > 50) m -= 12;
        return m;
    }
    const humanize = () => rand(0, 0.012);
    const detuneFor = arr => arr.unstable ? rand(-25, 25) : 0;
    const timpani = (p, t, v, boost = 1) => sample(p, 'timpani', timpaniNote(p.chord), t, { vel: v, dur: 2, release: 0.4, level: MIX.timpani * boost, wet: 0.3 });
    const taiko = (p, t, v, midi) => sample(p, 'taiko', midi, t + humanize(), { vel: v, dur: 1.2, release: 0.2, level: MIX.taiko, wet: 0.3 });
    const woodblock = (p, t, v, midi) => sample(p, 'woodblock', midi, t, { vel: v, dur: 0.3, release: 0.1, level: MIX.woodblock, wet: 0.2 });
    const bell = (p, t, midi, v) => sample(p, 'tubular_bells', midi, t, { vel: v, dur: 3, release: 1, level: MIX.bells, wet: 0.5 });

    // The reverse cymbal swells into `target`: its loudest moment lands there
    function cymbalTo(p, target, vel = 0.6) {
        const bank = BANK.cymbal;
        if (!bank || !bank.keys.length) return;
        const s = bank.notes.get(bank.keys[0]), start = target - s.peakAt;
        const offset = Math.max(0, p.ctx.currentTime + 0.02 - start);
        if (s.peakAt - offset < 0.25) return;   // too late for a swell
        sample(p, 'cymbal', 60, start + offset, { vel, offset, dur: s.peakAt - offset, attack: 0.05, release: 0.2, level: MIX.cymbal, wet: 0.4 });
    }

    // A drum roll building into `target`
    function rollTo(p, target, v, hit) {
        for (let i = 0; i < 8; i++) {
            const at = target - (8 - i) * p.stepDur;
            if (at > p.ctx.currentTime + 0.02) hit(p, at, v * (0.3 + i * 0.09));
        }
    }

    // A run up the scale on one instrument, arriving at `target`
    function runTo(p, name, target, v) {
        const scale = scaleFor(p.pal, p.cur.arr);
        for (let i = 0; i < 8; i++) {
            const at = target - (8 - i) * 0.06;
            if (at > p.ctx.currentTime + 0.02) sample(p, name, degree(scale, p.cur.key + 24, i), at, { vel: v * (0.5 + i * 0.06), dur: 0.8, release: 0.4, level: MIX.bell, wet: 0.45 });
        }
    }

    // A drum machine
    function kick(p, t, v) {
        thump(p.g, t, 52, p.out, { level: SYN.kick * v, decay: 0.42, drop: 2.6, wet: 0.03 });
        pump(p, t);
    }
    function snare(p, t, v) {
        noiseHit(p.g, t, p.out, { level: SYN.snare * v, decay: 0.16, freq: 1900, q: 0.7, wet: 0.25 });
        thump(p.g, t, 190, p.out, { level: SYN.snare * 0.7 * v, decay: 0.09, drop: 1.4, wet: 0.1 });
    }
    function hat(p, t, v) {
        noiseHit(p.g, t, p.out, { level: SYN.hat * v, decay: 0.035, type: 'highpass', freq: 8000, q: 0.7, wet: 0.05 });
    }
    function riser(p, target, v) {   // filtered noise sweeping up into `target`
        const dur = Math.min(1.6, target - p.ctx.currentTime - 0.03);
        if (dur >= 0.3) noiseSweep(p.g, target - dur, p.out, dur, 300, 7000, SYN.riser * v);
    }
    function impact(p, t) {
        thump(p.g, t, 40, p.out, { level: SYN.kick * 1.3, decay: 1.6, drop: 2, wet: 0.4 });
        noiseHit(p.g, t, p.out, { level: SYN.snare, decay: 0.9, type: 'lowpass', freq: 900, wet: 0.5 });
    }
    // Sidechain pump: the pads dip under every kick and swell back, as in dance music
    function pump(p, t) {
        p.pumps.forEach(gain => { gain.setValueAtTime(0.35, t); gain.linearRampToValueAtTime(1, t + p.beatDur * 0.85); });
    }

    function gong(p, t, v) {
        const f = mtof(p.cur.key - 12);
        strike(p.g, t, f, p.out, { level: SYN.gong * v, decay: 5, ratio: 1.41, index: 3, wet: 0.6 });
        strike(p.g, t, f * 2.76, p.out, { level: SYN.gong * 0.35 * v, decay: 3, ratio: 1.41, index: 1.5, wet: 0.6 });
        noiseHit(p.g, t, p.out, { level: SYN.gong * 0.12 * v, decay: 1.2, freq: 3000, q: 0.7, wet: 0.5 });
    }

    // Tabla: the small drum (dayan) rings on the key note, the large one (bayan) swoops up under the wrist
    function tabla(p, t, stroke, v) {
        const ctx = p.ctx, sa = mtof(p.cur.key + 12);
        if (stroke === 'dha' || stroke === 'ge') {
            const o = ctx.createOscillator(), e = env(ctx, t, SYN.tabla * 1.4 * v, 0.004, 0.5);
            o.frequency.setValueAtTime(72, t);
            o.frequency.exponentialRampToValueAtTime(104, t + 0.22);
            o.connect(e);
            route(ctx, e, p.out, 0.15);
            o.start(t); o.stop(t + 0.6);
        }
        if (stroke === 'dha' || stroke === 'na' || stroke === 'ti') {
            const open = stroke !== 'ti';
            [[1, 1], [2, 0.5], [3.01, 0.28], [4.03, 0.14]].forEach(([mult, part]) => {
                const o = ctx.createOscillator(), e = env(ctx, t, SYN.tabla * part * v, 0.002, open ? 0.45 / Math.pow(mult, 0.3) : 0.05);
                o.frequency.value = sa * mult;
                o.connect(e);
                route(ctx, e, p.out, 0.2);
                o.start(t); o.stop(t + 0.6);
            });
            noiseHit(p.g, t, p.out, { level: SYN.tabla * 0.25 * v, decay: 0.012, freq: 2500, q: 2, wet: 0.1 });
        }
    }

    // Rhythms by mood, played with whichever kit the palette has: boom · hit · tick (low, middle, high),
    // swellTo (a build into a time). A kit can replace any of them, and adds a groove under the quiet moods.
    const PATTERNS = {
        procession(k, p, t, s, bar) {
            if (s === 0) k.boom(p, t, 0.7);
            if (bar === 3 && s >= p.spb - 4) k.boom(p, t, 0.25 + 0.5 * (s - p.spb + 4) / 3);
        },
        heartbeat(k, p, t, s) {
            if (s === 0 || s === 8) k.boom(p, t, 0.75);
            if (s === 2 || s === 10) k.boom(p, t, 0.45);
        },
        battle(k, p, t, s, bar) {
            const hits = { 0: 0.95, 3: 0.6, 6: 0.65, 8: 0.85, 11: 0.6, 14: 0.65 };
            if (hits[s]) k.hit(p, t, hits[s] * p.cur.arr.vel);
            if (s === 0 && bar % 2 === 0) k.boom(p, t, 0.8);
            if (k.tick && s % 4 === 2) k.tick(p, t, 0.4);
            if (bar === 3 && s >= p.spb - 4) k.hit(p, t, 0.5 + (s - p.spb + 4) * 0.12);
        },
        march(k, p, t, s, bar) {
            if (s === 0) k.boom(p, t, 0.85);
            if (s === 8) k.boom(p, t, 0.6);
            if (bar === 3 && s >= p.spb - 4) k.boom(p, t, 0.25 + 0.5 * (s - p.spb + 4) / 3);
        },
        swell(k, p, t, s, bar) {   // a roll and a build into the next phrase
            const half = p.spb / 2;
            if (bar === 3 && s >= half) k.boom(p, t, 0.2 + 0.5 * (s - half) / (half - 1));
            if (bar === 3 && s === 0) k.swellTo(p, t + p.barDur, 0.5);
        },
        shimmer(k, p, t, s, bar) {   // a build into every other bar
            if (bar % 2 === 1 && s === 0) k.swellTo(p, t + p.barDur, 0.4);
        },
        chaos(k, p, t) {
            if (Math.random() < 0.2) k.hit(p, t, rand(0.35, 0.8));
            if (k.tick && Math.random() < 0.12) k.tick(p, t, rand(0.3, 0.7));
        }
    };

    const KITS = {
        orchestral: {
            needs: ['timpani', 'taiko', 'cymbal'],
            boom: (p, t, v) => timpani(p, t, v),
            hit: (p, t, v) => taiko(p, t, v, 48),
            tick: null,
            swellTo: cymbalTo,
            accent: (p, t) => timpani(p, t, 1, 1.2)
        },
        celtic: {   // frame drums (taiko, played high and light)
            needs: ['taiko', 'timpani', 'cymbal'],
            boom: (p, t, v) => taiko(p, t, v * 0.8, 50),
            hit: (p, t, v) => taiko(p, t, v * 0.7, 57),
            tick: null,
            swellTo: cymbalTo,
            accent: (p, t) => timpani(p, t, 1, 1.1)
        },
        sacred: {   // timpani and tolling bells
            needs: ['timpani', 'tubular_bells', 'cymbal'],
            boom: (p, t, v) => timpani(p, t, v),
            hit: (p, t, v) => timpani(p, t, v * 0.5),
            tick: null,
            swellTo: cymbalTo,
            accent(p, t) { bell(p, t, p.cur.key + 12, 0.9); timpani(p, t, 0.8); }
        },
        toy: {   // woodblocks, a soft timpani and a glockenspiel
            needs: ['timpani', 'woodblock', 'glockenspiel'],
            boom: (p, t, v) => timpani(p, t, v * 0.6),
            hit: (p, t, v) => woodblock(p, t, v, 72),
            tick: (p, t, v) => woodblock(p, t, v * 0.8, 84),
            swellTo: (p, target, v) => runTo(p, 'glockenspiel', target, v),
            accent(p, t) { timpani(p, t, 0.7); [24, 28, 31].forEach(d => sample(p, 'glockenspiel', p.cur.key + d, t, { vel: 0.7, dur: 1.5, level: MIX.bell, wet: 0.45 })); },
            patterns: {
                groove(k, p, t, s) { if (s % 4 === 2) woodblock(p, t, 0.3, s % 8 === 2 ? 84 : 79); }   // tick, tock on the off-beats
            }
        },
        horror: {   // timpani, tolling bells, and a clock that never stops
            needs: ['timpani', 'tubular_bells', 'woodblock', 'cymbal'],
            boom: (p, t, v) => timpani(p, t, v),
            hit: (p, t, v) => timpani(p, t, v * 0.35),
            tick: (p, t, v) => woodblock(p, t, v * 0.6, 84),
            swellTo: cymbalTo,
            accent(p, t) { bell(p, t, p.cur.key + 12, 0.9); bell(p, t + 0.01, p.cur.key, 0.7); timpani(p, t, 0.9); },
            patterns: {
                groove(k, p, t, s) { if (s % 4 === 0) woodblock(p, t, (s / 4) % 2 ? 0.3 : 0.4, (s / 4) % 2 ? 79 : 84); }   // tick, tock
            }
        },
        tribal: {   // big and small hand drums, woodblock
            needs: ['taiko', 'woodblock'],
            boom: (p, t, v) => taiko(p, t, v, 41),
            hit: (p, t, v) => taiko(p, t, v * 0.85, 52),
            tick: (p, t, v) => woodblock(p, t, v, 72),
            swellTo: (p, target, v) => rollTo(p, target, v, (pp, at, vv) => taiko(pp, at, vv, 52)),
            accent(p, t) { taiko(p, t, 1, 38); taiko(p, t + 0.16, 0.8, 45); },
            patterns: {
                groove(k, p, t, s) {
                    if (s === 0) taiko(p, t, 0.55, 41);
                    if (s === 6 || s === 10) taiko(p, t, 0.4, 52);
                    if (s % 4 === 2) woodblock(p, t, 0.25, 72);
                }
            }
        },
        eastern: {   // taiko, woodblock and a gong
            needs: ['taiko', 'woodblock', 'cymbal'],
            boom: (p, t, v) => taiko(p, t, v, 43),
            hit: (p, t, v) => taiko(p, t, v * 0.9, 50),
            tick: (p, t, v) => woodblock(p, t, v, 72),
            swellTo: cymbalTo,
            accent: (p, t) => gong(p, t, 1)
        },
        japanese: {   // odaiko, shime-daiko and hyoshigi clappers; a taiko roll where others swell a cymbal
            needs: ['taiko', 'woodblock'],
            boom: (p, t, v) => taiko(p, t, v, 41),
            hit: (p, t, v) => taiko(p, t, v * 0.85, 55),
            tick: (p, t, v) => woodblock(p, t, v, 79),
            swellTo: (p, target, v) => rollTo(p, target, v, (pp, at, vv) => taiko(pp, at, vv, 55)),
            accent(p, t) { taiko(p, t, 1, 38); woodblock(p, t, 0.9, 79); woodblock(p, t + 0.12, 0.8, 79); }
        },
        electronic: {   // a synthesized drum machine
            needs: [],
            boom: kick, hit: snare, tick: hat, swellTo: riser, accent: impact,
            patterns: {
                battle(k, p, t, s, bar) {   // four on the floor
                    if (s % 4 === 0) kick(p, t, s ? 0.85 : 1);
                    if (s === 4 || s === 12) snare(p, t, 0.9);
                    hat(p, t, s % 2 ? 0.45 : 0.75);
                    if (bar === 3 && s >= 12) snare(p, t, 0.4 + (s - 12) * 0.15);
                },
                march(k, p, t, s) {
                    if (s === 0 || s === 8) kick(p, t, 0.9);
                    if (s === 4 || s === 12) snare(p, t, 0.8);
                    if (s % 2 === 0) hat(p, t, 0.5);
                },
                procession(k, p, t, s) {
                    if (s === 0) kick(p, t, 0.8);
                    if (s === 8) snare(p, t, 0.6);
                    if (s % 4 === 2) hat(p, t, 0.4);
                },
                chaos(k, p, t, s) {
                    if (s === 0) kick(p, t, 0.9);
                    if (Math.random() < 0.25) hat(p, t, rand(0.3, 0.9));
                    if (Math.random() < 0.12) snare(p, t, rand(0.3, 0.8));
                },
                groove(k, p, t, s) {   // a kick on the one and off-beat hats
                    if (s === 0) kick(p, t, 0.6);
                    if (s % 4 === 2) hat(p, t, 0.55);
                }
            }
        },
        tabla: {   // tabla tuned to the key, and a keherwa theka under the quiet moods
            needs: ['cymbal'],
            boom: (p, t, v) => tabla(p, t, 'ge', v),
            hit: (p, t, v) => tabla(p, t, 'dha', v),
            tick: (p, t, v) => tabla(p, t, 'ti', v),
            swellTo: cymbalTo,
            accent(p, t) { tabla(p, t, 'dha', 1); strum(p, t); },
            patterns: {
                groove(k, p, t, s) {
                    if (s % 2) return;
                    const [stroke, v] = [['dha', 1], ['ge', 0.55], ['na', 0.7], ['ti', 0.5], ['na', 0.7], ['ti', 0.45], ['dha', 0.9], ['na', 0.6]][(s / 2) % 8];
                    tabla(p, t, stroke, v * 0.8);
                }
            }
        }
    };

    /* ==========================================================================
       The player: a 16th-note grid that runs for as long as the music plays
       ========================================================================== */

    // cp: { pal, bpm } (paletteOf). reel: the reel it plays for (its pause state), or null offline.
    function makePlayer(g, cp, reel) {
        const ctx = g.ctx, pal = cp.pal, trim = dbGain(pal.trim), dry = gainNode(ctx, trim), wet = gainNode(ctx, trim);
        dry.connect(g.bus.dry);
        wet.connect(g.bus.wet);
        const p = { g, ctx, pal, reel, out: { dry, wet }, padOut: null, pumps: [],
            beatDur: 60 / cp.bpm, stepDur: 15 / cp.bpm, spb: pal.meter * 4, next: 0, step: 0, cur: null, pending: null,
            chord: null, voicing: null, choirVoicing: null, melody: null, cue: null, singer: null };
        p.barDur = p.beatDur * pal.meter;
        if (pal.pump) {   // pads go through their own gain, for the sidechain pump
            const pd = gainNode(ctx, 1), pw = gainNode(ctx, 1);
            pd.connect(dry); pw.connect(wet);
            p.padOut = { dry: pd, wet: pw };
            p.pumps = [pd.gain, pw.gain];
        }
        return p;
    }

    function stopPlayer(p, tau = 0.3) {
        unlight(p.singer);
        fadeTo([p.out.dry.gain, p.out.wet.gain], 0, p.ctx.currentTime, tau);
        setTimeout(() => { p.out.dry.disconnect(); p.out.wet.disconnect(); }, 6000);
    }

    // The first beat at or after `earliest`, on the player's grid
    function beatAfter(p, earliest) {
        let at = p.next + ((4 - p.step % 4) % 4) * p.stepDur;
        while (at < earliest - 1e-6) at += p.beatDur;
        return at;
    }

    // A chapter's music starts on a beat, as the first bar of a new phrase
    function queue(p, music, earliest) {
        p.pending = { ...music, at: beatAfter(p, earliest) };
    }

    function run(p, until) {
        while (p.next < until) {
            if (p.pending && p.next >= p.pending.at - 1e-6) {
                p.cur = p.pending;
                p.pending = null;
                p.step = 0;
                p.melody = null;
                p.cue = null;
                unlight(p.singer);   // a chapter change cuts the theme short
                p.singer = null;
            }
            if (p.cur) playStep(p, p.next, p.step);
            p.step++;
            p.next += p.stepDur;
        }
    }

    function playStep(p, t, step) {
        const c = p.cur, arr = c.arr, pal = p.pal, kit = KITS[pal.kit];
        const s = step % p.spb, bar = Math.floor(step / p.spb) % 4, phraseLen = p.spb * 4, phrase = Math.floor(step / phraseLen);
        // A paused slideshow: after the first phrase, only chords, bass and a thinner arpeggio carry on
        const paused = !!(p.reel && p.reel.paused), resting = paused && phrase > 0;
        if (s === 0) {
            p.chord = chordOf(p, c.chords[bar]);
            if (step % phraseLen === 0) {
                if (step === 0) {
                    if (c.newAct && kit) kit.accent(p, t);
                    flourish(p, t);
                }
                // The theme: at the chapter's start, then every other phrase while the slideshow plays
                if (c.person && (phrase === 0 || (!paused && phrase % 2 === 0))) startMelody(p, c.person, step, t);
            }
            // A portrait asked for its theme: it comes in on the first bar after the current theme ends
            if (p.cue && !(p.melody && step - p.melody.start < p.melody.length)) {
                startMelody(p, p.cue, step, t);
                p.cue = null;
            }
            playPad(p, t);
        }
        if (pal.drone && s % 4 === 0) tanpura(p, t, s / 4);
        if (pal.waltz && (s === 4 || s === 8)) waltzStab(p, t);
        playBass(p, t, s);
        if (arr.arp && !(resting && s % 4)) playArp(p, t, s, bar);
        if (kit && !resting) {
            const name = arr.perc || (pal.groove ? 'groove' : null);
            const pattern = name && ((kit.patterns && kit.patterns[name]) || PATTERNS[name]);
            if (pattern) pattern(kit, p, t, s, bar);
        }
        if (p.melody) {
            const rel = step - p.melody.start;
            p.melody.events.forEach(e => { if (e.step === rel) playLead(p, t, e); });
        }
    }

    function playPad(p, t) {
        const pal = p.pal, arr = p.cur.arr, pcs = p.chord.pcs, vel = arr.vel, len = p.barDur + 0.05, out = p.padOut || p.out;
        if (pal.drone) {   // strings hold Sa and Pa quietly under the tanpura
            [p.cur.key, p.cur.key + 7].forEach((m, i) => held(p, pal.pad, m, t, len, { vel: vel * 0.6, level: MIX.pad * 0.6, pan: i ? 0.3 : -0.3, wet: 0.4, out }));
            return;
        }
        const [lo, hi] = arr.pad === 'low' ? [42, 64] : [50, 74];
        // A full pad steps back so the theme stays on top; so does a waltz's, under its stabs
        const level = MIX.pad * (pal.padLevel || 1) * (arr.pad === 'full' ? 0.75 : 1) * (pal.waltz ? 0.7 : 1);
        p.voicing = voiceLead(pcs, lo, hi, p.voicing);
        p.voicing.forEach((m, i) => held(p, pal.pad, m, t, len, { vel: vel * 0.85, level, pan: i / 3 * 0.8 - 0.4, wet: 0.35, detune: detuneFor(arr), out }));
        if ((arr.pad === 'choir' || arr.pad === 'full') && pal.choir) {
            p.choirVoicing = voiceLead(pcs, 57, 79, p.choirVoicing);
            p.choirVoicing.forEach((m, i) => held(p, pal.choir, m, t, len, { vel: vel * 0.8, level: MIX.choir, pan: 0.3 - i / 3 * 0.6, wet: 0.5, attack: 0.3, out }));
        }
        if (arr.pad === 'full' && pal.horns) {   // horns (organ, bagpipes, brass…) on the root and fifth
            const root = p.chord.bass + 12;
            [root, root + 7].forEach(m => held(p, pal.horns, m, t, len, { vel: vel * 0.8, level: MIX.horns, wet: 0.4, attack: 0.15, out }));
        }
    }

    // Indian palettes: a tanpura cycle on the sitar (Pa, Sa, Sa, low Sa), one string per beat
    function tanpura(p, t, beat) {
        const key = p.cur.key, notes = [key - 5, key, key, key - 12];
        sample(p, p.pal.drone, notes[beat % 4], t, { vel: 0.45, dur: p.beatDur * 3, release: 0.8, level: MIX.drone, wet: 0.45, pan: [-0.3, 0.1, 0.2, -0.1][beat % 4] });
    }

    // Waltz palettes: the "pah pah" on beats two and three
    function waltzStab(p, t) {
        if (!p.voicing) return;
        p.voicing.slice(1).forEach((m, i) => sample(p, p.pal.pluck, m + 12, t + i * 0.008, { vel: p.cur.arr.vel * 0.6, dur: 0.18, release: 0.15, level: MIX.stab, wet: 0.3 }));
    }

    function playBass(p, t, s) {
        const pal = p.pal, arr = p.cur.arr, b = p.chord.bass, vel = arr.vel, name = pal.bass;
        let pattern = pal.waltz && arr.bass !== 'eighths' && arr.bass !== 'pulse' ? 'waltz' : arr.bass;
        if (pal.bassDrive && (pattern === 'whole' || pattern === 'half' || pattern === 'quarters')) pattern = 'drive';
        if (!name || !pattern) return;
        const hit = (dur, v) => {
            const short = dur < 0.5 && pal.bassShort && BANK[pal.bassShort] && BANK[pal.bassShort].keys.length ? pal.bassShort : name;
            if (INSTRUMENTS[short].held) held(p, short, b, t, dur, { vel: v, level: MIX.bass, wet: 0.15, attack: 0.03, release: 0.3 });
            else sample(p, short, b, t, { vel: v, dur, release: 0.3, level: short === name ? MIX.bass : MIX.pizz, wet: 0.2 });
        };
        switch (pattern) {
            case 'whole': if (s === 0) hit(p.barDur, vel); break;
            case 'half': if (s % 8 === 0) hit(p.beatDur * 2, vel * (s ? 0.85 : 1)); break;
            case 'quarters': if (s % 4 === 0) hit(p.beatDur * 0.9, vel * (s ? 0.8 : 1)); break;
            case 'eighths': if (s % 2 === 0) hit(p.stepDur * 1.5, vel * (s % 8 === 0 ? 1 : 0.7)); break;
            case 'drive': if (s % 2 === 0) hit(p.stepDur * 1.6, vel * (s % 4 ? 0.75 : 0.95)); break;   // an electronic bass's steady eighths
            case 'waltz': if (s === 0) hit(p.beatDur * 0.95, vel); break;
            case 'pulse':   // lub-dub
                if (s === 0 || s === 8) hit(0.35, vel);
                if (s === 2 || s === 10) hit(0.3, vel * 0.6);
                break;
        }
    }

    function playArp(p, t, s, bar) {
        const pal = p.pal, arr = p.cur.arr, vel = arr.vel;
        const pool = pal.arpFrom === 'scale' ? p.chord.scale : p.chord.pcs;
        const role = { sparkle: 'bell', sparse: 'keys', ostinato: 'keys', cluster: 'keys' }[arr.arp] || 'pluck';
        const name = pal[role];
        if (!name) return;
        const level = MIX[role], short = INSTRUMENTS[name].held;   // a sustained synth plays its arpeggios staccato
        const pluck = (midi, v, dur, wet) => sample(p, name, midi, t + humanize(),
            { vel: v, dur: short ? Math.min(dur, p.stepDur * 1.2) : dur, release: short ? 0.08 : 0.5, level, wet, detune: detuneFor(arr) });
        const at = (tones, i) => tones[Math.max(0, Math.min(tones.length - 1, i))];
        switch (arr.arp) {
            case 'waves':
                if (s % 2 === 0) pluck(at(tonesIn(pool, 62, 86), [0, 1, 2, 3, 4, 3, 2, 1][s / 2]), vel * (s % 8 ? 0.65 : 0.85), 2, 0.35);
                break;
            case 'eighths':
                if (s % 2 === 0) pluck(at(tonesIn(pool, 62, 86), [0, 2, 1, 3, 2, 4, 3, 5][s / 2]), vel * (s % 8 ? 0.65 : 0.85), 1.5, 0.35);
                break;
            case 'sixteenths': {
                const seq = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
                pluck(at(tonesIn(pool, 62, 88), seq[(bar * p.spb + s) % 12]), vel * (s % 4 ? 0.55 : 0.8), 1.2, 0.35);
                break;
            }
            case 'sparkle': {
                const i = [0, 3, 6, 10, 13].indexOf(s);
                if (i >= 0) pluck(at(tonesIn(pool, 74, 96), [0, 2, 4, 3, 5][i]), vel * 0.8, 1.5, 0.5);
                break;
            }
            case 'sparse': {
                const i = { 0: 1, 6: 2, 8: 3, 12: 2 }[s];
                if (i !== undefined) pluck(at(tonesIn(pool, 57, 81), i), vel * 0.8, 2, 0.35);
                break;
            }
            case 'ostinato': {   // a driving low figure, with the flat second for menace
                const root = p.chord.bass + 12, seq = [0, 0, 7, 0, 12, 0, 7, 0, 0, 0, 7, 0, 1, 12, 7, 0];
                pluck(root + seq[s], vel * (s % 4 ? 0.65 : 0.95), 0.2, 0.2);
                break;
            }
            case 'cluster':
                if (Math.random() < 0.28) {
                    const tones = tonesIn(pool, 55, 79);
                    pluck(tones[Math.floor(Math.random() * tones.length)] + Math.floor(rand(-1, 2)), vel * rand(0.5, 0.9), 0.5, 0.3);
                }
                break;
        }
    }

    // What opens each chapter: a glissando up the harp, koto or synth (or a bell), a tolling bell, or a sitar strum
    function flourish(p, t) {
        const pal = p.pal, key = p.cur.key, scale = scaleFor(pal, p.cur.arr);
        if (pal.flourish === 'gliss' || pal.flourish === 'bell-gliss') {
            const name = pal.flourish === 'gliss' ? pal.pluck : pal.bell, short = INSTRUMENTS[name].held;
            const base = key + (pal.flourish === 'gliss' ? 12 : 24);
            for (let i = 0; i < 10; i++) {
                sample(p, name, degree(scale, base, i), t + i * 0.045,
                    { vel: 0.35 + i * 0.04, dur: short ? 0.12 : 1.2, release: short ? 0.1 : 0.6, level: MIX.pluck * 0.8, wet: 0.45 });
            }
        }
        if (pal.flourish === 'toll') bell(p, t, key + 12, 0.7);
        if (pal.flourish === 'strum') strum(p, t);
    }

    function strum(p, t) {
        const scale = scaleFor(p.pal, p.cur.arr);
        [0, 4, 7, 9, 11].forEach((d, i) => sample(p, p.pal.pluck, degree(scale, p.cur.key, d), t + i * 0.035,
            { vel: 0.6, dur: 1.5, release: 0.6, level: MIX.pluck * 0.8, wet: 0.4 }));
    }

    // who: { name, el?, pan, melody: { notes: [[step, beats]…], oct? } }. Its notes, placed on the grid from `step`
    function startMelody(p, who, step, t) {
        const m = who.melody || melodyFromName(who.name), arr = p.cur.arr, scale = scaleFor(p.pal, arr);
        const lead = p.pal.lead[arr.lead], base = p.cur.key + (INSTRUMENTS[lead].oct || 0) + (m.oct || 0);
        let pos = 0;
        const events = m.notes.map(([sd, beats]) => {
            const e = { step: Math.round(pos * 4), midi: degree(scale, base, sd), beats };
            pos += beats;
            return e;
        });
        p.melody = { start: step, length: Math.round(pos * 4), events, lead, pan: who.pan || 0 };
        if (p.reel) {   // the portrait lights up while its theme plays
            if (p.singer !== who.el) unlight(p.singer);
            p.singer = who.el || null;
            light(who.el, t - p.ctx.currentTime, pos * p.beatDur);
        }
    }

    function playLead(p, t, e) {
        const arr = p.cur.arr, { lead, pan } = p.melody, pcs = p.chord.pcs;
        let midi = e.midi;
        // Against thirds-based chords, a long note a semitone off the chord moves onto it
        if (p.chord.tertian && e.beats >= 1 && !pcs.includes(midi % 12)) {
            const d = [-1, 1].find(d => pcs.includes((midi + d + 12) % 12));
            if (d !== undefined) midi += d;
        }
        const len = e.beats * p.beatDur * 0.95, vel = Math.min(1, arr.vel + 0.15), detune = detuneFor(arr);
        const glide = p.pal.glide && e.beats >= 1 && Math.random() < 0.6 ? (Math.random() < 0.5 ? 1 : 2) : 0;
        if (INSTRUMENTS[lead].held) {
            held(p, lead, midi, t, len, { vel, pan, level: MIX.lead, wet: 0.35, attack: lead === 'choir' ? 0.18 : 0.06, release: 0.35, detune, glide });
        } else {
            sample(p, lead, midi, t, { vel, dur: Math.max(len, 0.6), release: 0.8, pan, level: MIX.lead, wet: 0.35, detune, glide });
        }
    }

    function light(el, delay, dur) {
        if (!el) return;
        clearTimeout(el.loreSingOn); clearTimeout(el.loreSingOff);
        el.loreSingOn = setTimeout(() => el.classList.add('is-singing'), Math.max(0, delay) * 1000);
        el.loreSingOff = setTimeout(() => el.classList.remove('is-singing'), (Math.max(0, delay) + dur + 0.3) * 1000);
    }

    function unlight(el) {
        if (!el) return;
        clearTimeout(el.loreSingOn); clearTimeout(el.loreSingOff);
        el.classList.remove('is-singing');
    }

    /* ==========================================================================
       On the page: the reels whose speaker was pressed, and the one that plays
       ========================================================================== */
    const reels = new Map();   // root → reel
    // on: the reader's choice, saved or just made. A page still waiting for a click to allow sound has
    // on without an active reel, so its speakers keep showing the choice.
    const saved = () => { try { return localStorage.getItem(PREF) === 'on'; } catch (e) { return false; } };
    const A = { g: null, on: saved(), active: null, player: null, loading: null, timer: 0, sleep: 0, downbeat: 0, done: 0, total: 0 };

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        entries.forEach(entry => { const r = reels.get(entry.target); if (r) r.visible = entry.isIntersecting; });
        refresh();
    }) : null;

    function reelFor(root) {
        if (reels.has(root)) return reels.get(root);
        const key = root.dataset.loreReel, data = (window.LoreReelData && window.LoreReelData[key]) || {};
        const music = (window.LoreMusicData && window.LoreMusicData.reels && window.LoreMusicData.reels[key]) || {};
        if (!PALETTES[music.palette]) console.warn(`[LoreMusic] ${key}: no palette in lore-music-data.js, so the fantasy one`);
        const actStarts = new Set();
        if (!data.kind && data.slides) data.slides.forEach((item, j) => { if (item === '|') actStarts.add(j - actStarts.size); });
        const chapter = root.loreReelChapter || null;
        const r = { root, key, kind: data.kind || 'story', music, actStarts, chapter, paused: !!(chapter && chapter.paused), visible: !io, hooked: new WeakSet() };
        root.addEventListener('lore-reel:change', () => onChange(r));
        root.addEventListener('lore-reel:chapter', event => onChapter(r, event.detail));
        root.addEventListener('lore-reel:state', event => { r.paused = !!event.detail.paused; });
        reels.set(root, r);
        if (chapter) hookPortraits(r, chapter);
        if (io) io.observe(root);
        return r;
    }

    function paletteOf(r) {
        const base = PALETTES[r.music.palette] || PALETTES.fantasy, swaps = r.music.instruments;
        const pal = swaps ? { ...base, ...swaps, lead: { ...base.lead, ...(swaps.lead || {}) } } : base;
        return { pal, bpm: Math.round(base.bpm * signature(r.key).tempo) };
    }

    const toMelody = theme => !theme ? null : Array.isArray(theme) ? { notes: theme } : theme;   // [[step, beats]…] or { notes, oct }
    const mainTheme = r => toMelody(r.music.theme) || melodyFromName(r.key);
    const castTheme = (r, name) => toMelody(r.music.cast && r.music.cast[name]) || melodyFromName(name);

    // A chapter's music: its mood (scored, or from its colour), its key (each act moves one), its progression,
    // and its theme. The story's first chapter and each act's first carry the archetype's main theme; the others
    // whoever changed card, else the first person the passage names. A trail's first stop has the main theme.
    function chapterMusic(r, d) {
        const scored = r.music.moods && r.music.moods[d.index];
        const moodName = ARRANGE[scored] ? scored : moodFromColor(d.color);
        let act = 0;
        r.actStarts.forEach(start => { if (start <= d.index) act++; });
        const home = signature(r.key).home, people = d.people || [];
        const opening = r.kind === 'roster' ? false : d.index === 0 || !!d.actStart;
        const who = opening ? null : people.find(x => x.changed) || people.find(x => x.lit) || null;
        const i = who ? people.indexOf(who) : 0;
        return {
            arr: ARRANGE[moodName], key: [home, home - 2, home + 2][act % 3],
            chords: progressionsOf(moodName)[variantFor(r.key, moodName)],
            person: who
                ? { name: who.name, el: who.el, pan: people.length > 1 ? (i / (people.length - 1) - 0.5) * 0.6 : 0, melody: castTheme(r, who.name) }
                : { name: r.key, pan: 0, melody: mainTheme(r) },
            newAct: !!(d.actStart && d.from >= 0 && d.from !== d.index)
        };
    }

    // Hovering or focusing a portrait brings its theme in at the next bar
    function hookPortraits(r, d) {
        (d.people || []).forEach((person, i, all) => {
            if (!person.el || r.hooked.has(person.el)) return;
            r.hooked.add(person.el);
            const hear = () => {
                if (A.active !== r || !A.player || !audible() || person.el.classList.contains('is-singing')) return;
                A.player.cue = { name: person.name, el: person.el, pan: all.length > 1 ? (i / (all.length - 1) - 0.5) * 0.6 : 0, melody: castTheme(r, person.name) };
            };
            person.el.addEventListener('mouseenter', hear);
            person.el.addEventListener('focus', () => { if (person.el.matches(':focus-visible')) hear(); });
        });
    }

    const audible = () => A.on && !!A.active && A.active.visible && !document.hidden;

    function startScore() {
        const r = A.active;
        if (A.player || A.loading || !r) return;
        const cp = paletteOf(r);
        A.loading = r;
        sync();
        loadPalette(A.g.ctx, cp.pal, (done, total) => { A.done = done; A.total = total; sync(); }).then(ok => {
            A.loading = null;
            if (!ok) console.warn('[LoreMusic] The instruments did not load.');
            if (!ok || A.player || A.active !== r || !audible()) { sync(); if (ok && A.active !== r) refresh(); return; }
            const p = A.player = makePlayer(A.g, cp, r);
            p.next = A.g.ctx.currentTime + 0.1;
            if (r.chapter) queue(p, chapterMusic(r, r.chapter), p.next);
            sync();
        });
    }

    function stopScore() {
        if (!A.player) return;
        stopPlayer(A.player);
        A.player = null;
    }

    function refresh() {
        const g = A.g;
        if (!g) return sync();
        clearTimeout(A.sleep);
        const t = g.ctx.currentTime;
        if (audible()) {
            if (g.ctx.state !== 'running') g.ctx.resume().catch(() => {});
            fadeTo(g.fades, 1, t, 0.5);
            if (A.player && A.player.reel !== A.active) stopScore();
            startScore();
            if (!A.timer) A.timer = setInterval(tick, TICK_MS);
        } else {
            // Fade out, then stop scheduling and let the audio device sleep
            fadeTo(g.fades, 0, t, 0.3);
            A.sleep = setTimeout(() => {
                stopScore();
                clearInterval(A.timer);
                A.timer = 0;
                g.ctx.suspend().catch(() => {});
            }, 1500);
        }
        sync();
    }

    function tick() {
        const p = A.player;
        if (!p) return;
        const now = p.ctx.currentTime;
        if (p.next < now) {   // after a stall, skip the missed steps but stay on the grid
            const missed = Math.ceil((now - p.next) / p.stepDur);
            p.next += missed * p.stepDur;
            p.step += missed;
        }
        run(p, now + LOOKAHEAD_S);
    }

    // The mosaic has started: the next chapter comes in on the first beat after its midpoint, and the kit builds into it
    function onChange(r) {
        const p = A.player;
        if (A.active !== r || !p || !audible()) return;
        A.downbeat = beatAfter(p, p.ctx.currentTime + 0.6);
        const kit = KITS[p.pal.kit];
        if (kit) kit.swellTo(p, A.downbeat, 0.55);
    }

    function onChapter(r, d) {
        r.chapter = d;
        r.paused = !!d.paused;
        hookPortraits(r, d);
        const p = A.player;
        if (A.active !== r || !p || !audible()) return;
        const now = p.ctx.currentTime, earliest = A.downbeat > now + 0.05 ? A.downbeat : now + 0.25;
        A.downbeat = 0;
        queue(p, chapterMusic(r, d), earliest);
    }

    // Every speaker on the page shows the state; the playing reel shows the credit (or the loading count)
    function sync() {
        document.querySelectorAll('.lore-reel-sound').forEach(button => {
            const mine = !!A.active && A.active.root.contains(button);
            button.setAttribute('aria-pressed', String(A.on));
            button.setAttribute('aria-label', A.on ? 'Turn the music off' : 'Play music');
            button.classList.toggle('is-loading', A.on && mine && !!A.loading);
            button.classList.toggle('is-live', A.on && mine && !!A.player && audible());
        });
        reels.forEach(r => {
            let credit = r.root.querySelector(':scope > .lore-reel-credit');
            const show = A.on && A.active === r;
            if (!show) { if (credit) credit.hidden = true; return; }
            if (!credit) {
                credit = document.createElement('p');
                credit.className = 'lore-reel-credit';
                r.root.append(credit);
            }
            credit.hidden = false;
            credit.textContent = A.loading
                ? `Loading the music… ${A.done}/${A.total}`
                : `♪ ${paletteOf(r).pal.label} · ${CREDIT}`;
        });
    }

    // on: music on or off, for the reel `root` (whose speaker was pressed) or the one already playing
    function setOn(on, root) {
        A.on = !!on;
        try { localStorage.setItem(PREF, A.on ? 'on' : 'off'); } catch (e) { /* private mode: not remembered */ }
        if (root) {
            const r = reelFor(root);
            if (A.active !== r) { stopScore(); A.active = r; }
        }
        if (A.on && !A.g) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            const ctx = window.LoreReelAudio || (Ctx && new Ctx());
            if (!ctx) { A.on = false; sync(); return; }
            A.g = makeGraph(ctx);
        }
        refresh();
    }

    // Loads a reel's instruments ahead of time (lore-reel.js, for a reader who left the music on on a page
    // that must wait for their first click), so the music starts the moment it's allowed
    function prepare(root) {
        const ctx = window.LoreReelAudio || (A.g && A.g.ctx);
        if (ctx) loadPalette(ctx, paletteOf(reelFor(root)).pal, () => {});
    }

    document.addEventListener('visibilitychange', refresh);

    /* ---- Balancing: LoreMusic.measure(mood, palette) renders offline and reports the loudness ---- */

    // Peak and RMS in dBFS, and loudness as heard: K-weighting (ITU-R BS.1770 shelf + high-pass), ungated
    function loudness(buf) {
        const sr = buf.sampleRate, K = f0 => Math.tan(Math.PI * f0 / sr);
        let k = K(1681.974450955533), q = 0.7071752369554196, a0 = 1 + k / q + k * k;
        const vh = Math.pow(10, 3.999843853973347 / 20), vb = Math.pow(vh, 0.4996667741545416);
        const shelf = [(vh + vb * k / q + k * k) / a0, 2 * (k * k - vh) / a0, (vh - vb * k / q + k * k) / a0, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0];
        k = K(38.13547087602444); q = 0.5003270373238773; a0 = 1 + k / q + k * k;
        const hp = [1, -2, 1, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0];
        let peak = 0, weighted = 0;
        for (let c = 0; c < buf.numberOfChannels; c++) {
            const d = buf.getChannelData(c), states = [[0, 0, 0, 0], [0, 0, 0, 0]];
            for (let i = 0; i < d.length; i++) {
                peak = Math.max(peak, Math.abs(d[i]));
                let y = d[i];
                [shelf, hp].forEach(([b0, b1, b2, a1, a2], j) => {
                    const s = states[j], out = b0 * y + b1 * s[0] + b2 * s[1] - a1 * s[2] - a2 * s[3];
                    s[1] = s[0]; s[0] = y; s[3] = s[2]; s[2] = out; y = out;
                });
                weighted += y * y;
            }
        }
        return {
            peak: Math.round(200 * Math.log10(peak + 1e-9)) / 10,
            lufs: Math.round((-0.691 + 10 * Math.log10(weighted / buf.length + 1e-18)) * 10) / 10
        };
    }

    async function measure(moodName, palName = 'fantasy', { seconds = 14, variant = 0, theme = 'Measure' } = {}) {
        const pal = PALETTES[palName], { core, rest } = paletteInstruments(pal);
        const loaded = await Promise.all([...core, ...rest].map(name => loadInstrument(new OfflineAudioContext(2, 1, 44100), name)));
        const ctx = new OfflineAudioContext(2, 44100 * seconds, 44100), g = makeGraph(ctx);
        g.fades.forEach(param => param.setValueAtTime(1, 0));
        const p = makePlayer(g, { pal, bpm: pal.bpm }, null);
        p.next = 0.05;
        queue(p, { arr: ARRANGE[moodName], key: 50, chords: progressionsOf(moodName)[variant], person: { name: theme, pan: 0 }, newAct: false }, 0.05);
        run(p, seconds - 1.5);
        return { ...loudness(await ctx.startRendering()), loaded: loaded.every(Boolean) };
    }

    window.LoreMusic = {
        setOn,
        prepare,
        isOn: () => A.on,
        measure,
        palettes: Object.keys(PALETTES),
        moods: Object.keys(ARRANGE),
        state: () => ({ on: A.on, reel: A.active && A.active.key, loading: !!A.loading, playing: !!A.player,
            ctx: A.g && A.g.ctx.state, bpm: A.player && Math.round(60 / A.player.beatDur),
            key: A.player && A.player.cur && A.player.cur.key, singer: A.player && A.player.singer && A.player.singer.textContent })
    };
})();
