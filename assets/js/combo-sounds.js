/**
 * ComboSounds — Web Audio API synthesized sound effects for the DuelSimulator.
 * No external audio files required. Loaded optionally; combo-system.js degrades
 * gracefully when this file is absent.
 *
 * Usage:  ComboSounds.play('synchro')
 * Events: draw | to-hand | normal-summon | special-summon | tribute
 *         synchro | fusion | contact-fusion | xyz | link | ritual | pendulum
 *         equip | effect | negate | attack | lp-damage | lp-recover
 *         to-gy | to-banish | combo-complete | step
 *
 * Signal flow (per play):
 *   sound layers → voice dry bus ─┐
 *   reverb sends → voice wet bus → reverb (HP-filtered, damped IR) ─┤
 *                                           master gain (volume/mute) → subsonic HP → limiter → out
 */
class ComboSounds {
    static _ctx = null;
    static _muted = false;
    static _masterVolume = 0.45;
    static _master = null;
    static _reverbIn = null;
    static _noiseBuf = null;
    static _voices = [];
    static _lastPlay = {};
    static _t0 = 0;
    static _cents = 0;
    static _wet = null;

    // Internal mix reference — every layer gain below is written relative to this
    static BASE = 0.45;
    // Voices started while a 'major' sound plays are left alone; older tails get ducked
    static MAX_VOICES = 10;
    static RETRIGGER_S = 0.035;

    // [method, tier, trim dB, approx length incl. tail (s)]
    // Tiers: major = extra deck / finale (ducks older tails), mid, minor = frequent (randomised a little)
    static EVENTS = {
        'draw':           ['_draw',           'minor',  -2.0, 1.2],
        'to-hand':        ['_toHand',         'minor',   3.5, 0.9],
        'normal-summon':  ['_normalSummon',   'minor',   4.5, 0.4],
        'special-summon': ['_specialSummon',  'mid',     2.5, 1.5],
        'tribute':        ['_tribute',        'mid',     4.0, 1.4],
        'synchro':        ['_synchro',        'major',  -1.3, 2.2],
        'fusion':         ['_fusion',         'major',  -1.5, 2.2],
        'contact-fusion': ['_contactFusion',  'major',   0.0, 1.2],
        'xyz':            ['_xyz',            'major',  -5.0, 1.6],
        'link':           ['_link',           'major',   2.8, 1.4],
        'ritual':         ['_ritual',         'major',  -2.2, 2.9],
        'pendulum':       ['_pendulum',       'major',   5.3, 1.7],
        'equip':          ['_equip',          'mid',     1.3, 0.8],
        'effect':         ['_effect',         'minor',   4.0, 1.0],
        'negate':         ['_negate',         'mid',     6.0, 0.8],
        'attack':         ['_attack',         'mid',    -0.8, 0.6],
        'lp-damage':      ['_lpDamage',       'mid',     4.4, 0.9],
        'lp-recover':     ['_lpRecover',      'minor',   0.0, 1.2],
        'to-gy':          ['_toGY',           'minor',   3.0, 1.0],
        'to-banish':      ['_toBanish',       'minor',   6.0, 1.0],
        'combo-complete': ['_comboComplete',  'major',   1.7, 2.6],
        'step':           ['_step',           'minor',  12.0, 0.1],
    };

    static get ctx() {
        if (!this._ctx) {
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
        return this._ctx;
    }

    // ── Bus setup ──────────────────────────────────────────────────────────────

    // Master gain → subsonic high-pass → brick-wall-ish limiter → destination.
    // The limiter only catches stacked peaks; loudness balance comes from EVENTS trims.
    static _getMaster(ctx) {
        if (this._master && this._master.context === ctx) return this._master;
        const master = ctx.createGain();
        master.gain.value = this._muted ? 0 : this._masterVolume / this.BASE;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 28;
        hp.Q.value = 0.7;
        const lim = ctx.createDynamicsCompressor();
        lim.threshold.value = -6;
        lim.knee.value = 3;
        lim.ratio.value = 12;
        lim.attack.value = 0.001;
        lim.release.value = 0.12;
        master.connect(hp); hp.connect(lim); lim.connect(ctx.destination);
        this._master = master;
        this._reverbIn = null;
        this._voices = [];
        this._lastPlay = {};
        return master;
    }

    // Synthetic convolution reverb — 12ms pre-delay, exponential decay, high end damped over time
    // so tails darken instead of hissing. Input is high-passed to keep sub thumps out of the wash.
    static _getReverbIn(ctx) {
        if (this._reverbIn && this._reverbIn.context === ctx) return this._reverbIn;
        const sr = ctx.sampleRate;
        const len = Math.ceil(sr * 1.8);
        const pre = Math.floor(sr * 0.012);
        const ir = ctx.createBuffer(2, len, sr);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            let lp = 0;
            for (let i = pre; i < len; i++) {
                const x = (i - pre) / (len - pre);
                const a = Math.exp(-2 * Math.PI * (9000 - 7800 * x) / sr);
                lp = (1 - a) * (Math.random() * 2 - 1) + a * lp;
                d[i] = lp * Math.exp(-6.9 * x);
            }
        }
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 220;
        const conv = ctx.createConvolver();
        conv.buffer = ir;
        hp.connect(conv); conv.connect(this._getMaster(ctx));
        this._reverbIn = hp;
        return hp;
    }

    // One shared 2s noise buffer; each use starts at a random offset
    static _getNoise(ctx) {
        if (this._noiseBuf && this._noiseBuf.sampleRate === ctx.sampleRate) return this._noiseBuf;
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this._noiseBuf = buf;
        return buf;
    }

    // ── Playback ───────────────────────────────────────────────────────────────

    static play(event) {
        if (this._muted) return;
        const entry = this.EVENTS[event];
        if (!entry) return;
        const ctx = this.ctx;
        if (!ctx) return;
        const [method, tier, trimDb, length] = entry;
        const master = this._getMaster(ctx);
        const now = ctx.currentTime;

        // Multi-action steps can fire the same event several times in one tick
        if (now - (this._lastPlay[event] ?? -1) < this.RETRIGGER_S) return;
        this._lastPlay[event] = now;

        // Small lookahead so the first envelope segment is never clipped mid render-quantum
        const t0 = now + 0.006;
        this._voices = this._voices.filter(vc => vc.end > now);
        if (tier === 'major') {
            this._voices.forEach(vc => this._fadeVoice(vc, vc.level * 0.4, t0, 0.05));
        }
        while (this._voices.length >= this.MAX_VOICES) {
            this._fadeVoice(this._voices.shift(), 0, t0, 0.02);
        }

        // Frequent sounds get slight pitch/level variation to avoid the machine-gun effect
        const minor = tier === 'minor';
        this._cents = minor ? (Math.random() * 2 - 1) * 25 : 0;
        const level = Math.pow(10, (trimDb + (minor ? (Math.random() * 2 - 1) * 0.8 : 0)) / 20);

        const dry = ctx.createGain();
        const wet = ctx.createGain();
        dry.gain.value = level;
        wet.gain.value = level;
        dry.connect(master);
        wet.connect(this._getReverbIn(ctx));

        this._t0 = t0;
        this._wet = wet;
        this[method](ctx, this.BASE, dry);
        this._cents = 0;
        this._voices.push({ dry, wet, level, end: t0 + length + 0.2 });
    }

    static _fadeVoice(vc, target, t, tc) {
        [vc.dry.gain, vc.wet.gain].forEach(p => {
            p.cancelScheduledValues(t);
            p.setTargetAtTime(target, t, tc);
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    static _osc(ctx, type = 'sine') {
        const o = ctx.createOscillator();
        o.type = type;
        o.detune.value = this._cents;
        return o;
    }

    static _filter(ctx, type, freq, t, Q) {
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.setValueAtTime(freq, t);
        if (Q !== undefined) f.Q.setValueAtTime(Q, t);
        f.detune.value = this._cents;
        return f;
    }

    // Gain node with 0 → peak (linear) → silence (exponential) envelope.
    // gain.value = 0 matters: a GainNode defaults to 1 until the first event, and when float rounding
    // puts a source's first sample one sample before t, that sample passes at full level as a click.
    static _env(ctx, t, peak, attack, end) {
        const g = ctx.createGain();
        g.gain.value = 0;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + end);
        return g;
    }

    // FM synthesis — returns carrier oscillator with modulator wired to its frequency param
    // Caller must connect carrier to a gain node and set its own amplitude envelope
    static _fm(ctx, carrierFreq, modRatio, modIndex, t, duration, waveType = 'sine') {
        const mod = this._osc(ctx);
        const modGain = ctx.createGain();
        mod.frequency.setValueAtTime(carrierFreq * modRatio, t);
        modGain.gain.value = carrierFreq * modIndex;
        const carrier = this._osc(ctx, waveType);
        carrier.frequency.setValueAtTime(carrierFreq, t);
        mod.connect(modGain); modGain.connect(carrier.frequency);
        mod.start(t); mod.stop(t + duration + 0.05);
        return carrier;
    }

    // Stereo panner convenience wrapper
    static _pan(ctx, panValue) {
        const p = ctx.createStereoPanner();
        p.pan.value = panValue;
        return p;
    }

    // Send a node to the reverb (through the current voice's wet bus) with a given wet gain amount
    static _reverbSend(ctx, sourceNode, wetGain) {
        const send = ctx.createGain();
        send.gain.value = wetGain;
        sourceNode.connect(send);
        send.connect(this._wet);
    }

    static _noise(ctx, gainVal, attack, decay, filterType, filterFreq, delay = 0, out = null, Q) {
        const now = this._t0 + delay;
        const dur = attack + decay;
        const src = ctx.createBufferSource();
        src.buffer = this._getNoise(ctx);
        src.loop = true;
        const f = this._filter(ctx, filterType || 'bandpass', filterFreq || 1000, now, Q);
        const g = this._env(ctx, now, gainVal, attack, dur);
        src.connect(f); f.connect(g); g.connect(out || this._master);
        src.start(now, Math.random() * 1.9); src.stop(now + dur + 0.05);
        return g;
    }

    // Noise through a band-pass whose centre sweeps f0 → f1 — whooshes, swells, materialisation
    static _noiseSweep(ctx, out, t, dur, f0, f1, Q, gainVal, attack) {
        const src = ctx.createBufferSource();
        src.buffer = this._getNoise(ctx);
        src.loop = true;
        const f = this._filter(ctx, 'bandpass', f0, t, Q);
        f.frequency.exponentialRampToValueAtTime(f1, t + dur);
        const g = this._env(ctx, t, gainVal, attack, dur);
        src.connect(f); f.connect(g); g.connect(out);
        src.start(t, Math.random() * 1.9); src.stop(t + dur + 0.05);
        return g;
    }

    // Pitch-dropping sine thump. The 2nd/3rd harmonic layers let phone and laptop speakers
    // (which roll off below ~120Hz) still "hear" the fundamental.
    static _thump(ctx, out, t, f0, f1, dur, gainVal, harmonics = true) {
        const layers = harmonics ? [[1, 1], [2, 0.4], [3, 0.16]] : [[1, 1]];
        layers.forEach(([mult, lvl]) => {
            const o = this._osc(ctx);
            o.frequency.setValueAtTime(f0 * mult, t);
            o.frequency.exponentialRampToValueAtTime(f1 * mult, t + dur * 0.75);
            const g = this._env(ctx, t, gainVal * lvl, 0.005, dur);
            o.connect(g); g.connect(out);
            o.start(t); o.stop(t + dur + 0.05);
        });
    }

    // ── Sounds ─────────────────────────────────────────────────────────────────

    // FM electric piano arpeggio — C5 → E5 → G5, triangle carrier + sine mod for harp-like timbre
    static _draw(ctx, v, out) {
        const now = this._t0;
        [[523.25, 0], [659.25, 0.08], [783.99, 0.16]].forEach(([freq, delay]) => {
            const t = now + delay;
            const carrier = this._fm(ctx, freq, 2, 0.8, t, 0.5, 'triangle');
            const g = this._env(ctx, t, v * 0.38, 0.008, 0.46);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.18);
            carrier.start(t); carrier.stop(t + 0.52);
        });
    }

    // Card flicked back to the hand — airy flick + quick falling two-note FM pluck (G5 → C5)
    static _toHand(ctx, v, out) {
        const now = this._t0;
        this._noiseSweep(ctx, out, now, 0.12, 4000, 1800, 1.4, v * 0.2, 0.03);
        [[783.99, 0.03], [523.25, 0.1]].forEach(([freq, delay]) => {
            const t = now + delay;
            const carrier = this._fm(ctx, freq, 2, 0.6, t, 0.35, 'triangle');
            const g = this._env(ctx, t, v * 0.34, 0.006, 0.32);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.14);
            carrier.start(t); carrier.stop(t + 0.38);
        });
    }

    // Card-on-table impact — impact click + paper snap + hollow wood knock + sub-sine thud
    static _normalSummon(ctx, v, out) {
        const now = this._t0;
        // Impact click — card edge contact (ultra-short)
        this._noise(ctx, v * 0.52, 0.001, 0.022, 'highpass', 4800, 0, out);
        // Paper snap — card material flexing
        this._noise(ctx, v * 0.3, 0.002, 0.055, 'bandpass', 1800, 0, out);
        // Wood knock — high-Q resonant bandpass on noise, rings at ~460Hz like hollow wood
        this._noise(ctx, v * 0.46, 0.002, 0.158, 'bandpass', 460, 0, out, 14);
        // Wood surface resonance — damped sine, table surface ring
        const wres = this._osc(ctx);
        wres.frequency.setValueAtTime(270, now);
        wres.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        const wrg = this._env(ctx, now, v * 0.38, 0.003, 0.14);
        wres.connect(wrg); wrg.connect(out);
        wres.start(now); wres.stop(now + 0.17);
        // Thud — table mass vibrating
        this._thump(ctx, out, now, 175, 60, 0.32, v * 0.72, false);
    }

    // Energetic noise crescendo + FM chord arrival + sparkle tail
    static _specialSummon(ctx, v, out) {
        const now = this._t0;
        // Rising bandpass noise sweep — materialization burst
        const ng = this._noiseSweep(ctx, out, now, 0.5, 200, 3200, 2.0, v * 0.36, 0.04);
        this._reverbSend(ctx, ng, 0.2);
        // High sparkle tail
        this._noise(ctx, v * 0.14, 0.01, 0.28, 'highpass', 6000, 0.32, out);
        // 3-voice FM chord with stereo spread
        [[523.25, -0.45], [659.25, 0], [783.99, 0.45]].forEach(([freq, pan], i) => {
            const t = now + 0.32 + i * 0.022;
            const carrier = this._fm(ctx, freq, 2, 0.5, t, 0.72, 'sine');
            const g = this._env(ctx, t, v * (0.34 - i * 0.05), 0.014, 0.68);
            const panner = this._pan(ctx, pan);
            carrier.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.24);
            carrier.start(t); carrier.stop(t + 0.78);
        });
    }

    // Triangle sweep + noise burst + FM metallic bell — sci-fi tuner synchronization
    static _synchro(ctx, v, out) {
        const now = this._t0;
        const osc = this._osc(ctx, 'triangle');
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.6);
        const filter = this._filter(ctx, 'bandpass', 300, now, 1.2);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.6);
        const g = ctx.createGain();
        g.gain.value = 0;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.38, now + 0.05);
        g.gain.linearRampToValueAtTime(v * 0.42, now + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.76);
        osc.connect(filter); filter.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.8);
        // Noise burst at sweep peak
        this._noise(ctx, v * 0.18, 0.02, 0.22, 'bandpass', 2200, 0.5, out);
        // FM metallic bell — ratio 3.5 for inharmonic ring
        const t = now + 0.54;
        const bell = this._fm(ctx, 1318.5, 3.5, 0.6, t, 1.85, 'sine');
        const bg = this._env(ctx, t, v * 0.52, 0.012, 1.9);
        bell.connect(bg); bg.connect(out);
        this._reverbSend(ctx, bg, 0.28);
        bell.start(t); bell.stop(t + 1.95);
        // Fifth harmonic shimmer
        const shimmer = this._osc(ctx);
        shimmer.frequency.setValueAtTime(1976.5, t + 0.01);
        const sg = this._env(ctx, t + 0.01, v * 0.14, 0.015, 1.09);
        shimmer.connect(sg); sg.connect(out);
        shimmer.start(t + 0.01); shimmer.stop(t + 1.15);
    }

    // Converging tones + noise swirl + FM chord explosion — powerful magical synthesis
    static _fusion(ctx, v, out) {
        const now = this._t0;
        // High sine descending / low sine ascending — meeting on E4
        [[660, 0.3], [110, 0.38]].forEach(([freq, lvl]) => {
            const o = this._osc(ctx);
            o.frequency.setValueAtTime(freq, now);
            o.frequency.exponentialRampToValueAtTime(330, now + 0.68);
            const g = this._env(ctx, now, v * lvl, 0.1, 0.9);
            o.connect(g); g.connect(out);
            o.start(now); o.stop(now + 0.95);
        });
        // Warm noise swirl — materials dissolving
        this._noise(ctx, v * 0.22, 0.1, 0.55, 'bandpass', 700, 0, out);
        // Sustained FM chord — E major, 4 voices for rich harmonics
        [329.63, 415.3, 493.88, 659.25].forEach((freq, i) => {
            const t = now + 0.62 + i * 0.025;
            const carrier = this._fm(ctx, freq, 2, 0.4, t, 1.5, 'sine');
            const g = this._env(ctx, t, v * 0.27, 0.06, 1.4);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.22);
            carrier.start(t); carrier.stop(t + 1.45);
        });
        // FM sparkle cap
        const t2 = now + 0.65;
        const sparkle = this._fm(ctx, 1980, 3, 0.25, t2, 0.9, 'sine');
        const sg = this._env(ctx, t2, v * 0.22, 0.015, 1.4);
        sparkle.connect(sg); sg.connect(out);
        this._reverbSend(ctx, sg, 0.3);
        sparkle.start(t2); sparkle.stop(t2 + 1.45);
    }

    // Stereo sawtooth approach + triple-layer collision + sub-bass + dual FM metallic ring
    static _contactFusion(ctx, v, out) {
        const now = this._t0;
        // High sawtooth rushing down from the left, low one rushing up from the right → center
        [[1600, -0.55, 0.32, 0.004], [70, 0.55, 0.38, 0.04]].forEach(([freq, pan, lvl, attack]) => {
            const o = this._osc(ctx, 'sawtooth');
            o.frequency.setValueAtTime(freq, now);
            o.frequency.exponentialRampToValueAtTime(380, now + 0.2);
            const p = ctx.createStereoPanner();
            p.pan.setValueAtTime(pan, now);
            p.pan.linearRampToValueAtTime(0, now + 0.2);
            const g = this._env(ctx, now, v * lvl, attack, 0.25);
            o.connect(p); p.connect(g); g.connect(out);
            o.start(now); o.stop(now + 0.3);
        });
        // Triple-layer collision impact
        this._noise(ctx, v * 0.5, 0.004, 0.22, 'bandpass', 650, 0.17, out);
        this._noise(ctx, v * 0.32, 0.003, 0.14, 'lowpass', 280, 0.17, out);
        this._noise(ctx, v * 0.22, 0.003, 0.07, 'highpass', 3200, 0.17, out);
        // Collision thud
        this._thump(ctx, out, now + 0.17, 80, 36, 0.3, v * 0.62);
        // Two slightly detuned FM tones — stereo metallic resonance
        const t = now + 0.22;
        [[392, -0.22], [396, 0.22]].forEach(([freq, pan]) => {
            const merged = this._fm(ctx, freq, 2.8, 1.2, t, 0.78, 'sine');
            merged.frequency.linearRampToValueAtTime(freq * 0.84, t + 0.38);
            const mg = this._env(ctx, t, v * 0.38, 0.024, 0.86);
            const panner = this._pan(ctx, pan);
            merged.connect(mg); mg.connect(panner); panner.connect(out);
            this._reverbSend(ctx, mg, 0.12);
            merged.start(t); merged.stop(t + 0.92);
        });
    }

    // Tight descending blips pulled into gravity + earth-shaking slam
    static _xyz(ctx, v, out) {
        const now = this._t0;
        // Three tight descending blips — sucked into the gravity well
        [660, 440, 293].forEach((freq, i) => {
            const t = now + i * 0.13;
            const osc = this._osc(ctx);
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.15, t + 0.2);
            const g = this._env(ctx, t, v * 0.3, 0.015, 0.26);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.3);
        });
        const ts = now + 0.38;
        // Impact crack — gives the slam a front edge on small speakers
        this._noise(ctx, v * 0.3, 0.002, 0.05, 'bandpass', 1400, 0.38, out, 1.2);
        // Slam — XYZ monster erupts from the abyss
        this._thump(ctx, out, ts, 64, 34, 1.25, v * 0.8);
        // Low harmonic rumble
        const rumble = this._osc(ctx, 'triangle');
        rumble.frequency.setValueAtTime(110, ts);
        const rg = this._env(ctx, ts, v * 0.24, 0.12, 0.72);
        rumble.connect(rg); rg.connect(out);
        this._reverbSend(ctx, rg, 0.15);
        rumble.start(ts); rumble.stop(ts + 0.77);
        // Low-pass noise impact thud
        this._noise(ctx, v * 0.36, 0.005, 0.26, 'lowpass', 200, 0.38, out);
    }

    // Circuit nodes activating + FM crystalline ping + highpass digital noise
    static _link(ctx, v, out) {
        const now = this._t0;
        // Six square wave circuit ticks — digital nodes coming online (low-passed to take the edge off)
        const tickLp = this._filter(ctx, 'lowpass', 3200, now, 0.7);
        tickLp.connect(out);
        [220, 330, 440, 587, 784, 1047].forEach((freq, i) => {
            const t = now + i * 0.055;
            const osc = this._osc(ctx, 'square');
            osc.frequency.setValueAtTime(freq, t);
            const g = this._env(ctx, t, v * 0.12, 0.007, 0.12);
            osc.connect(g); g.connect(tickLp);
            osc.start(t); osc.stop(t + 0.15);
        });
        // FM crystalline ping — link established, ratio 3 for bright bell
        const t = now + 0.36;
        const ping = this._fm(ctx, 1568, 3, 0.4, t, 0.82, 'sine');
        const pg = this._env(ctx, t, v * 0.4, 0.012, 1.0);
        ping.connect(pg); pg.connect(out);
        this._reverbSend(ctx, pg, 0.16);
        ping.start(t); ping.stop(t + 1.05);
        // High digital noise — data flowing
        this._noise(ctx, v * 0.15, 0.01, 0.28, 'highpass', 5500, 0.34, out);
    }

    // Ascending slide + FM metallic click — futuristic armor/weapon equip
    static _equip(ctx, v, out) {
        const now = this._t0;
        // Sharp ascending slide — equip locking on
        const slide = this._osc(ctx);
        slide.frequency.setValueAtTime(200, now);
        slide.frequency.exponentialRampToValueAtTime(750, now + 0.12);
        const sg = this._env(ctx, now, v * 0.34, 0.012, 0.18);
        slide.connect(sg); sg.connect(out);
        slide.start(now); slide.stop(now + 0.22);
        // FM metallic click — ratio 4 for sharp inharmonic clank
        const t = now + 0.11;
        const bell = this._fm(ctx, 1046.5, 4, 0.5, t, 0.72, 'triangle');
        const bg = this._env(ctx, t, v * 0.48, 0.008, 0.72);
        bell.connect(bg); bg.connect(out);
        this._reverbSend(ctx, bg, 0.12);
        bell.start(t); bell.stop(t + 0.77);
        // High shimmer
        const shimmer = this._osc(ctx);
        shimmer.frequency.setValueAtTime(2093, t + 0.02);
        const shg = this._env(ctx, t + 0.02, v * 0.15, 0.015, 0.48);
        shimmer.connect(shg); shg.connect(out);
        shimmer.start(t + 0.02); shimmer.stop(t + 0.55);
    }

    // FM crystal bell with delayed vibrato — pristine magical activation
    static _effect(ctx, v, out) {
        const now = this._t0;
        // FM crystal bell — ratio 3.5 for bright inharmonic shimmer
        const carrier = this._fm(ctx, 1047, 3.5, 0.4, now, 0.62, 'sine');
        // Gentle vibrato that fades in after the strike (a wide, instant wobble sounds cheap)
        const lfo = this._osc(ctx);
        const lfoG = ctx.createGain();
        lfo.frequency.setValueAtTime(6, now);
        lfoG.gain.value = 0;
        lfoG.gain.setValueAtTime(0, now);
        lfoG.gain.linearRampToValueAtTime(7, now + 0.18);
        lfo.connect(lfoG); lfoG.connect(carrier.frequency);
        const g = this._env(ctx, now, v * 0.32, 0.008, 0.58);
        carrier.connect(g); g.connect(out);
        this._reverbSend(ctx, g, 0.2);
        lfo.start(now); lfo.stop(now + 0.64);
        carrier.start(now); carrier.stop(now + 0.64);
        // Octave shadow — body under the sparkle
        const shadow = this._osc(ctx);
        shadow.frequency.setValueAtTime(523.5, now);
        const shg = this._env(ctx, now, v * 0.16, 0.012, 0.42);
        shadow.connect(shg); shg.connect(out);
        shadow.start(now); shadow.stop(now + 0.47);
    }

    // Glass crack + resonant power-down buzz + weighty thump — aggressive spell cancellation
    static _negate(ctx, v, out) {
        const now = this._t0;
        // Crack — the effect shattering
        this._noise(ctx, v * 0.34, 0.001, 0.05, 'highpass', 3000, 0, out);
        // Sawtooth + tritone square through a closing resonant low-pass — power being cut
        const lp = this._filter(ctx, 'lowpass', 5000, now, 5);
        lp.frequency.exponentialRampToValueAtTime(420, now + 0.32);
        const bus = this._env(ctx, now, 1, 0.004, 0.4);
        lp.connect(bus); bus.connect(out);
        this._reverbSend(ctx, bus, 0.12);
        [['sawtooth', 600, 120, 0.42], ['square', 424, 85, 0.2]].forEach(([type, f0, f1, lvl]) => {
            const o = this._osc(ctx, type);
            o.frequency.setValueAtTime(f0, now);
            o.frequency.exponentialRampToValueAtTime(f1, now + 0.28);
            const g = ctx.createGain();
            g.gain.value = v * lvl;
            o.connect(g); g.connect(lp);
            o.start(now); o.stop(now + 0.45);
        });
        // Weight — the denial lands
        this._thump(ctx, out, now + 0.01, 150, 48, 0.26, v * 0.5);
        // Hard noise burst
        this._noise(ctx, v * 0.3, 0.004, 0.2, 'bandpass', 900, 0.02, out);
    }

    // Swept-noise swing + filtered edge + heavy impact — combat strike
    static _attack(ctx, v, out) {
        const now = this._t0;
        // Whoosh — air moving, band-pass sweeping up as the swing accelerates
        this._noiseSweep(ctx, out, now, 0.16, 350, 2600, 1.2, v * 0.42, 0.09);
        // Tonal edge under the whoosh
        const osc = this._osc(ctx, 'sawtooth');
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
        const lp = this._filter(ctx, 'lowpass', 1800, now, 0.8);
        const g = this._env(ctx, now, v * 0.12, 0.05, 0.16);
        osc.connect(lp); lp.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.2);
        // Impact
        const ti = now + 0.1;
        this._noise(ctx, v * 0.28, 0.001, 0.035, 'bandpass', 1600, 0.1, out, 1.0);
        this._thump(ctx, out, ti, 160, 42, 0.36, v * 0.65);
        this._noise(ctx, v * 0.26, 0.005, 0.13, 'lowpass', 400, 0.1, out);
    }

    // Heavy descending sine + thud + lowpass noise — health loss penalty
    static _lpDamage(ctx, v, out) {
        const now = this._t0;
        // Descending tone — HP draining
        const osc = this._osc(ctx);
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.32);
        const g = this._env(ctx, now, v * 0.52, 0.008, 0.44);
        osc.connect(g); g.connect(out);
        this._reverbSend(ctx, g, 0.12);
        osc.start(now); osc.stop(now + 0.48);
        // Thud — weight of the hit
        this._thump(ctx, out, now, 90, 38, 0.28, v * 0.44);
        // Crunch on the hit so it reads on small speakers
        this._noise(ctx, v * 0.16, 0.002, 0.06, 'bandpass', 1100, 0, out, 1.4);
        // Low-pass noise punch
        this._noise(ctx, v * 0.18, 0.003, 0.1, 'lowpass', 320, 0, out);
    }

    // FM chime arpeggio + sparkle — warm glowing health recovery
    static _lpRecover(ctx, v, out) {
        const now = this._t0;
        [[523.25, 0], [659.25, 0.065], [783.99, 0.13]].forEach(([freq, delay]) => {
            const t = now + delay;
            const carrier = this._fm(ctx, freq, 2, 0.5, t, 0.48, 'sine');
            const g = this._env(ctx, t, v * 0.3, 0.008, 0.44);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.2);
            carrier.start(t); carrier.stop(t + 0.5);
        });
        // High sparkle tail
        this._noise(ctx, v * 0.1, 0.008, 0.2, 'highpass', 5000, 0.1, out);
    }

    // Muffled descending whomp + falling hollow swoosh — dropping into the dark pit
    static _toGY(ctx, v, out) {
        const now = this._t0;
        const osc = this._osc(ctx);
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.42);
        const g = this._env(ctx, now, v * 0.44, 0.004, 0.54);
        osc.connect(g); g.connect(out);
        this._reverbSend(ctx, g, 0.18);
        osc.start(now); osc.stop(now + 0.58);
        // Hollow swoosh falling with the tone
        const sw = this._noiseSweep(ctx, out, now, 0.4, 900, 260, 2.2, v * 0.24, 0.03);
        this._reverbSend(ctx, sw, 0.12);
    }

    // Reverse air swell sucked upward + rising tone + vanishing glint — dimensional vanish
    static _toBanish(ctx, v, out) {
        const now = this._t0;
        // Reverse swell — slow attack, abrupt end, like air rushing into a rift
        const sw = this._noiseSweep(ctx, out, now, 0.2, 1400, 7000, 1.6, v * 0.34, 0.15);
        this._reverbSend(ctx, sw, 0.22);
        // Rising tone
        const osc = this._osc(ctx);
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(3200, now + 0.18);
        const g = this._env(ctx, now, v * 0.28, 0.02, 0.22);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.26);
        // Glint left behind in the void
        const t = now + 0.17;
        const glint = this._fm(ctx, 2637, 3, 0.3, t, 0.4, 'sine');
        const gg = this._env(ctx, t, v * 0.14, 0.004, 0.36);
        glint.connect(gg); gg.connect(out);
        this._reverbSend(ctx, gg, 0.4);
        glint.start(t); glint.stop(t + 0.42);
    }

    // Deep sacrifice thud + dark filtered sawtooth rise — ominous power
    static _tribute(ctx, v, out) {
        const now = this._t0;
        // Kick — deep sacrifice impact
        this._thump(ctx, out, now, 90, 36, 0.28, v * 0.78);
        // Bandpass impact noise burst
        this._noise(ctx, v * 0.32, 0.004, 0.12, 'bandpass', 700, 0, out);
        // Rising filtered sawtooth — tribute monster emerging from darkness
        const tr = now + 0.16;
        const rise = this._osc(ctx, 'sawtooth');
        rise.frequency.setValueAtTime(130, tr);
        rise.frequency.exponentialRampToValueAtTime(520, now + 0.75);
        const filter = this._filter(ctx, 'lowpass', 300, tr);
        filter.frequency.exponentialRampToValueAtTime(3500, now + 0.75);
        const rg = this._env(ctx, tr, v * 0.34, 0.08, 0.76);
        rise.connect(filter); filter.connect(rg); rg.connect(out);
        this._reverbSend(ctx, rg, 0.15);
        rise.start(tr); rise.stop(tr + 0.81);
    }

    // FM drone + inharmonic FM ceremonial bells + long reverb — dark ancient invocation
    static _ritual(ctx, v, out) {
        const now = this._t0;
        // FM drone — warm atmospheric undertone
        const drone = this._fm(ctx, 110, 0.5, 0.2, now, 1.1, 'sine');
        const dg = this._env(ctx, now, v * 0.3, 0.18, 1.1);
        drone.connect(dg); dg.connect(out);
        this._reverbSend(ctx, dg, 0.3);
        drone.start(now); drone.stop(now + 1.15);
        // Three FM bells — ratio 2.76 gives inharmonic brass-bell character
        [329.63, 493.88, 659.25].forEach((freq, i) => {
            const t = now + 0.1 + i * 0.22;
            const bell = this._fm(ctx, freq, 2.76, 0.45, t, 0.88, 'sine');
            const g = this._env(ctx, t, v * 0.42, 0.012, 0.88);
            bell.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.32);
            bell.start(t); bell.stop(t + 0.93);
        });
        // Final sustained FM bell — ritual complete
        const t2 = now + 0.78;
        const finalBell = this._fm(ctx, 987.77, 2.76, 0.38, t2, 1.15, 'sine');
        const bg = this._env(ctx, t2, v * 0.54, 0.015, 1.95);
        finalBell.connect(bg); bg.connect(out);
        this._reverbSend(ctx, bg, 0.42);
        finalBell.start(t2); finalBell.stop(t2 + 2.0);
    }

    // Stereo panning convergence — chimes sweep left/right to center + burst chord
    static _pendulum(ctx, v, out) {
        const now = this._t0;
        // High chime from the left, low chime from the right, both converging on A4
        [[880, -0.8], [220, 0.8]].forEach(([freq, pan]) => {
            const o = this._osc(ctx);
            o.frequency.setValueAtTime(freq, now);
            o.frequency.exponentialRampToValueAtTime(440, now + 0.42);
            const p = ctx.createStereoPanner();
            p.pan.setValueAtTime(pan, now);
            p.pan.linearRampToValueAtTime(0, now + 0.42);
            const g = this._env(ctx, now, v * 0.28, 0.03, 0.52);
            o.connect(p); p.connect(g); g.connect(out);
            o.start(now); o.stop(now + 0.57);
        });
        // Burst chord at convergence — A major with stereo spread
        [[440, -0.3], [554.37, 0.3], [659.25, -0.15], [880, 0.15]].forEach(([freq, pan], i) => {
            const t = now + 0.38 + i * 0.045;
            const osc = this._osc(ctx);
            osc.frequency.setValueAtTime(freq, t);
            const g = this._env(ctx, t, v * 0.25, 0.01, 0.75);
            const panner = this._pan(ctx, pan);
            osc.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.2);
            osc.start(t); osc.stop(t + 0.8);
        });
    }

    // Soft muted tick — unobtrusive UI step indicator
    static _step(ctx, v, out) {
        const now = this._t0;
        this._noise(ctx, v * 0.22, 0.001, 0.03, 'bandpass', 2600, 0, out, 1.5);
        const osc = this._osc(ctx);
        osc.frequency.setValueAtTime(1400, now);
        const g = this._env(ctx, now, v * 0.14, 0.002, 0.03);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.04);
    }

    // FM arpeggio + sparkle pair + wide stereo sustained chord — ultimate fanfare
    static _comboComplete(ctx, v, out) {
        const now = this._t0;
        // 4-note FM arpeggio with subtle stereo spread
        [[523.25, 0, -0.25], [659.25, 0.12, 0.25], [783.99, 0.24, -0.15], [1046.5, 0.36, 0]].forEach(([freq, delay, pan]) => {
            const t = now + delay;
            const carrier = this._fm(ctx, freq, 2, 0.6, t, 0.65, 'sine');
            const g = this._env(ctx, t, v * 0.42, 0.01, 0.62);
            const panner = this._pan(ctx, pan);
            carrier.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.2);
            carrier.start(t); carrier.stop(t + 0.67);
        });
        // FM sparkle pair — E6 then G6
        [[1318.5, 0], [1567.98, 0.085]].forEach(([freq, offset]) => {
            const t = now + 0.5 + offset;
            const carrier = this._fm(ctx, freq, 3, 0.3, t, 1.0, 'sine');
            const g = this._env(ctx, t, v * 0.22, 0.008, 0.95);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.35);
            carrier.start(t); carrier.stop(t + 1.0);
        });
        // Sustained wide stereo chord with a C3 root for weight
        const cs = now + 0.58;
        [[130.81, 0, 0.26], [523.25, -0.3, 0.32], [659.25, 0.3, 0.32], [783.99, 0, 0.32]].forEach(([freq, pan, lvl]) => {
            const carrier = this._fm(ctx, freq, 2, 0.35, cs, 1.5, 'sine');
            const g = this._env(ctx, cs, v * lvl, 0.04, 1.45);
            const panner = this._pan(ctx, pan);
            carrier.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.42);
            carrier.start(cs); carrier.stop(cs + 1.5);
        });
    }

    // ── Controls ───────────────────────────────────────────────────────────────

    // Ramps the master bus so muting also silences tails that are still ringing
    static _applyMaster() {
        if (!this._master) return;
        const p = this._master.gain;
        const t = this._master.context.currentTime;
        p.cancelScheduledValues(t);
        p.setTargetAtTime(this._muted ? 0 : this._masterVolume / this.BASE, t, 0.02);
    }

    static toggleMute() {
        this._muted = !this._muted;
        this._applyMaster();
        return this._muted;
    }

    static setVolume(v) {
        this._masterVolume = Math.max(0, Math.min(1, v));
        this._applyMaster();
    }

    static get isMuted() {
        return this._muted;
    }
}

window.ComboSounds = ComboSounds;
