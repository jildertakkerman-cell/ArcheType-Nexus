/**
 * ComboSounds — Web Audio API synthesized sound effects for the DuelSimulator.
 * No external audio files required. Loaded optionally; combo-system.js degrades
 * gracefully when this file is absent.
 *
 * Usage:  ComboSounds.play('synchro')
 * Events: draw | normal-summon | special-summon | tribute
 *         synchro | fusion | contact-fusion | xyz | link | ritual | pendulum
 *         equip | effect | to-gy | to-banish | combo-complete | step
 */
class ComboSounds {
    static _ctx = null;
    static _muted = false;
    static _masterVolume = 0.55;
    static _compressor = null;

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

    // Lazy master output node — compressor → destination for warmth and headroom control
    static _getOut(ctx) {
        if (!this._compressor || this._compressor.context !== ctx) {
            const c = ctx.createDynamicsCompressor();
            c.threshold.value = -18;
            c.knee.value = 6;
            c.ratio.value = 4;
            c.attack.value = 0.003;
            c.release.value = 0.25;
            c.connect(ctx.destination);
            this._compressor = c;
        }
        return this._compressor;
    }

    static play(event) {
        if (this._muted) return;
        const ctx = this.ctx;
        if (!ctx) return;
        const v = this._masterVolume;
        const out = this._getOut(ctx);
        const map = {
            'draw':           () => this._draw(ctx, v, out),
            'normal-summon':  () => this._normalSummon(ctx, v, out),
            'special-summon': () => this._specialSummon(ctx, v, out),
            'tribute':        () => this._tribute(ctx, v, out),
            'synchro':        () => this._synchro(ctx, v, out),
            'fusion':         () => this._fusion(ctx, v, out),
            'contact-fusion': () => this._contactFusion(ctx, v, out),
            'xyz':            () => this._xyz(ctx, v, out),
            'link':           () => this._link(ctx, v, out),
            'ritual':         () => this._ritual(ctx, v, out),
            'pendulum':       () => this._pendulum(ctx, v, out),
            'equip':          () => this._equip(ctx, v, out),
            'effect':         () => this._effect(ctx, v, out),
            'negate':          () => this._negate(ctx, v, out),
            'attack':          () => this._attack(ctx, v, out),
            'lp-damage':       () => this._lpDamage(ctx, v, out),
            'lp-recover':      () => this._lpRecover(ctx, v, out),
            'to-gy':          () => this._toGY(ctx, v, out),
            'to-banish':      () => this._toBanish(ctx, v, out),
            'combo-complete': () => this._comboComplete(ctx, v, out),
            'step':           () => this._step(ctx, v, out),
        };
        if (map[event]) map[event]();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    static _noise(ctx, gainVal, attack, decay, filterType, filterFreq, delay = 0, out = null) {
        const dest = out || ctx.destination;
        const now = ctx.currentTime + delay;
        const dur = attack + decay;
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur + 64), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = filterType || 'bandpass';
        f.frequency.setValueAtTime(filterFreq || 1000, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gainVal, now + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(f); f.connect(g); g.connect(dest);
        src.start(now); src.stop(now + dur + 0.05);
    }

    // ── Sounds ─────────────────────────────────────────────────────────────────

    // Ascending C major arpeggio — C5 → E5 → G5
    static _draw(ctx, v, out) {
        const now = ctx.currentTime;
        [[523.25, 0], [659.25, 0.075], [783.99, 0.15]].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(v * 0.32, now + delay + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.38);
            osc.connect(g); g.connect(out);
            osc.start(now + delay); osc.stop(now + delay + 0.42);
        });
    }

    // Solid midrange thud — placement impact transient + tone body
    static _normalSummon(ctx, v, out) {
        const now = ctx.currentTime;
        // Brief bandpass snap — physical card impact
        this._noise(ctx, v * 0.22, 0.003, 0.06, 'bandpass', 820, 0, out);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.18);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.55, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.32);
    }

    // Rising swept-noise materialization + bright chord arrival — card bypassing the rules
    static _specialSummon(ctx, v, out) {
        const now = ctx.currentTime;
        // Bandpass noise sweep — card bursting into existence out of nothing
        const dur = 0.38;
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(280, now);
        f.frequency.exponentialRampToValueAtTime(2200, now + dur);
        f.Q.setValueAtTime(2.5, now);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, now);
        ng.gain.linearRampToValueAtTime(v * 0.32, now + 0.04);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(f); f.connect(ng); ng.connect(out);
        src.start(now); src.stop(now + dur + 0.05);
        // Bright C major chord landing — the monster materializing
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const t = now + 0.24 + i * 0.018;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * (0.32 - i * 0.06), t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.57);
        });
    }

    // Triangle sweep through bandpass + soft noise burst + ringing bell — tuners synchronizing
    static _synchro(ctx, v, out) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.72);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(2200, now + 0.72);
        filter.Q.setValueAtTime(1.2, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.36, now + 0.05);
        g.gain.linearRampToValueAtTime(v * 0.4, now + 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.88);
        osc.connect(filter); filter.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.92);
        // Soft bandpass noise burst at peak
        this._noise(ctx, v * 0.18, 0.02, 0.22, 'bandpass', 2000, 0.62, out);
        // Primary bell — synchro monster ringing into existence
        const bell = ctx.createOscillator();
        const bg = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(1318.5, now + 0.65);
        bg.gain.setValueAtTime(0, now + 0.65);
        bg.gain.linearRampToValueAtTime(v * 0.46, now + 0.67);
        bg.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
        bell.connect(bg); bg.connect(out);
        bell.start(now + 0.65); bell.stop(now + 2.15);
        // Soft fifth harmonic — warmth without the piercing edge
        const bell2 = ctx.createOscillator();
        const bg2 = ctx.createGain();
        bell2.type = 'sine';
        bell2.frequency.setValueAtTime(1976.5, now + 0.66);
        bg2.gain.setValueAtTime(0, now + 0.66);
        bg2.gain.linearRampToValueAtTime(v * 0.12, now + 0.68);
        bg2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        bell2.connect(bg2); bg2.connect(out);
        bell2.start(now + 0.66); bell2.stop(now + 1.25);
    }

    // High tone descends + low tone ascends + noise swirl + sustained merged chord
    static _fusion(ctx, v, out) {
        const now = ctx.currentTime;
        // High material descending
        const oscH = ctx.createOscillator();
        const gH = ctx.createGain();
        oscH.type = 'sine';
        oscH.frequency.setValueAtTime(660, now);
        oscH.frequency.exponentialRampToValueAtTime(330, now + 0.68);
        gH.gain.setValueAtTime(0, now);
        gH.gain.linearRampToValueAtTime(v * 0.3, now + 0.1);
        gH.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
        oscH.connect(gH); gH.connect(out);
        oscH.start(now); oscH.stop(now + 0.95);
        // Low material ascending
        const oscL = ctx.createOscillator();
        const gL = ctx.createGain();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(110, now);
        oscL.frequency.exponentialRampToValueAtTime(330, now + 0.68);
        gL.gain.setValueAtTime(0, now);
        gL.gain.linearRampToValueAtTime(v * 0.38, now + 0.1);
        gL.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
        oscL.connect(gL); gL.connect(out);
        oscL.start(now); oscL.stop(now + 0.95);
        // Warm noise swirl — materials dissolving into each other
        this._noise(ctx, v * 0.22, 0.1, 0.55, 'bandpass', 700, 0, out);
        // Sustained merged chord — fusion monster materializing
        [330, 415, 495, 660].forEach((freq, i) => {
            const t = now + 0.62 + i * 0.025;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.28, t + 0.06);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 1.45);
        });
        // High sparkle
        const osc3 = ctx.createOscillator();
        const g3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1980, now + 0.65);
        g3.gain.setValueAtTime(0, now + 0.65);
        g3.gain.linearRampToValueAtTime(v * 0.22, now + 0.7);
        g3.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        osc3.connect(g3); g3.connect(out);
        osc3.start(now + 0.65); osc3.stop(now + 1.55);
    }

    // Two bodies collide — high zip + low rush crash together + impact noise + merged tone
    static _contactFusion(ctx, v, out) {
        const now = ctx.currentTime;
        // High body rushing down
        const oscH = ctx.createOscillator();
        const gH = ctx.createGain();
        oscH.type = 'sawtooth';
        oscH.frequency.setValueAtTime(1400, now);
        oscH.frequency.exponentialRampToValueAtTime(380, now + 0.2);
        gH.gain.setValueAtTime(v * 0.28, now);
        gH.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        oscH.connect(gH); gH.connect(out);
        oscH.start(now); oscH.stop(now + 0.28);
        // Low body rushing up
        const oscL = ctx.createOscillator();
        const gL = ctx.createGain();
        oscL.type = 'sawtooth';
        oscL.frequency.setValueAtTime(80, now);
        oscL.frequency.exponentialRampToValueAtTime(380, now + 0.2);
        gL.gain.setValueAtTime(0, now);
        gL.gain.linearRampToValueAtTime(v * 0.32, now + 0.04);
        gL.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        oscL.connect(gL); gL.connect(out);
        oscL.start(now); oscL.stop(now + 0.28);
        // Impact noise burst at collision
        this._noise(ctx, v * 0.38, 0.005, 0.18, 'bandpass', 650, 0.17, out);
        // Merged resonance — contact fused monster
        const merged = ctx.createOscillator();
        const mg = ctx.createGain();
        merged.type = 'sine';
        merged.frequency.setValueAtTime(392, now + 0.22);
        merged.frequency.linearRampToValueAtTime(330, now + 0.55);
        mg.gain.setValueAtTime(0, now + 0.22);
        mg.gain.linearRampToValueAtTime(v * 0.42, now + 0.28);
        mg.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        merged.connect(mg); mg.connect(out);
        merged.start(now + 0.22); merged.stop(now + 0.9);
    }

    // Materials fall into gravity well, then sub-bass overlay slam — oppressive and heavy
    static _xyz(ctx, v, out) {
        const now = ctx.currentTime;
        // Materials being pulled down — three descending tones sucked inward
        [660, 440, 293].forEach((freq, i) => {
            const t = now + i * 0.14;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.2, t + 0.26);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.28, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.34);
        });
        // Sub-bass overlay slam — XYZ monster emerges
        const slam = ctx.createOscillator();
        const sg = ctx.createGain();
        slam.type = 'sine';
        slam.frequency.setValueAtTime(52, now + 0.4);
        slam.frequency.linearRampToValueAtTime(33, now + 1.4);
        sg.gain.setValueAtTime(0, now + 0.4);
        sg.gain.linearRampToValueAtTime(v * 0.78, now + 0.44);
        sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
        slam.connect(sg); sg.connect(out);
        slam.start(now + 0.4); slam.stop(now + 1.6);
        // Low harmonic rumble
        const rumble = ctx.createOscillator();
        const rg = ctx.createGain();
        rumble.type = 'triangle';
        rumble.frequency.setValueAtTime(104, now + 0.4);
        rg.gain.setValueAtTime(0, now + 0.4);
        rg.gain.linearRampToValueAtTime(v * 0.22, now + 0.5);
        rg.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        rumble.connect(rg); rg.connect(out);
        rumble.start(now + 0.4); rumble.stop(now + 1.15);
        // Low-pass noise thud on impact
        this._noise(ctx, v * 0.32, 0.005, 0.22, 'lowpass', 200, 0.4, out);
    }

    // Link arrows lighting up + connection ping + digital noise — circuit activating
    static _link(ctx, v, out) {
        const now = ctx.currentTime;
        // Six circuit nodes activating in sequence
        [220, 330, 440, 587, 784, 1047].forEach((freq, i) => {
            const t = now + i * 0.055;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.1, t + 0.007);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.15);
        });
        // Connection established ping — link monster online
        const ping = ctx.createOscillator();
        const pg = ctx.createGain();
        ping.type = 'sine';
        ping.frequency.setValueAtTime(1568, now + 0.35);
        pg.gain.setValueAtTime(0, now + 0.35);
        pg.gain.linearRampToValueAtTime(v * 0.38, now + 0.365);
        pg.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
        ping.connect(pg); pg.connect(out);
        ping.start(now + 0.35); ping.stop(now + 1.1);
        // High digital noise — data flowing through the link
        this._noise(ctx, v * 0.14, 0.01, 0.28, 'highpass', 5500, 0.33, out);
    }

    // Upward slide snap + triangle bell click + shimmer — equip card locking onto a monster
    static _equip(ctx, v, out) {
        const now = ctx.currentTime;
        // Rising slide — equip card being attached
        const slide = ctx.createOscillator();
        const sg = ctx.createGain();
        slide.type = 'sine';
        slide.frequency.setValueAtTime(200, now);
        slide.frequency.exponentialRampToValueAtTime(660, now + 0.13);
        sg.gain.setValueAtTime(0, now);
        sg.gain.linearRampToValueAtTime(v * 0.3, now + 0.015);
        sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        slide.connect(sg); sg.connect(out);
        slide.start(now); slide.stop(now + 0.24);
        // Metallic triangle bell — equip locked in
        const bell = ctx.createOscillator();
        const bg = ctx.createGain();
        bell.type = 'triangle';
        bell.frequency.setValueAtTime(1046.5, now + 0.11);
        bg.gain.setValueAtTime(0, now + 0.11);
        bg.gain.linearRampToValueAtTime(v * 0.42, now + 0.122);
        bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
        bell.connect(bg); bg.connect(out);
        bell.start(now + 0.11); bell.stop(now + 0.77);
        // High shimmer — the buff taking effect
        const shimmer = ctx.createOscillator();
        const shg = ctx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2093, now + 0.13);
        shg.gain.setValueAtTime(0, now + 0.13);
        shg.gain.linearRampToValueAtTime(v * 0.14, now + 0.145);
        shg.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        shimmer.connect(shg); shg.connect(out);
        shimmer.start(now + 0.13); shimmer.stop(now + 0.6);
    }

    // Vibrato-ping at C6 + octave shadow — magical sparkle with body
    static _effect(ctx, v, out) {
        const now = ctx.currentTime;
        // Main vibrato tone at C6
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1047, now);
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(9, now);
        lfoG.gain.setValueAtTime(28, now);
        lfo.connect(lfoG); lfoG.connect(osc.frequency);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.28, now + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
        osc.connect(g); g.connect(out);
        lfo.start(now); osc.start(now);
        lfo.stop(now + 0.7); osc.stop(now + 0.7);
        // Octave shadow at C5 — adds body to the sparkle
        const shadow = ctx.createOscillator();
        const shg = ctx.createGain();
        shadow.type = 'sine';
        shadow.frequency.setValueAtTime(523.5, now);
        shg.gain.setValueAtTime(0, now);
        shg.gain.linearRampToValueAtTime(v * 0.12, now + 0.015);
        shg.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        shadow.connect(shg); shg.connect(out);
        shadow.start(now); shadow.stop(now + 0.5);
    }

    // Harsh descending buzz + noise burst — effect denied / negated
    static _negate(ctx, v, out) {
        const now = ctx.currentTime;
        // Descending dissonant buzz — the "NO" sound
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.35, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.4);
        // Second dissonant layer — tritone for tension
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(420, now);
        osc2.frequency.exponentialRampToValueAtTime(85, now + 0.25);
        g2.gain.setValueAtTime(0, now);
        g2.gain.linearRampToValueAtTime(v * 0.12, now + 0.01);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc2.connect(g2); g2.connect(out);
        osc2.start(now); osc2.stop(now + 0.35);
        // Noise burst — the shattering of the effect
        this._noise(ctx, v * 0.28, 0.005, 0.18, 'bandpass', 900, 0.02, out);
    }

    // Sharp whoosh + low impact — attack declaration
    static _attack(ctx, v, out) {
        const now = ctx.currentTime;
        // Rising whoosh — the swing
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.2, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.2);
        // Impact thud
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(150, now + 0.1);
        thud.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        tg.gain.setValueAtTime(0, now + 0.1);
        tg.gain.linearRampToValueAtTime(v * 0.5, now + 0.12);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        thud.connect(tg); tg.connect(out);
        thud.start(now + 0.1); thud.stop(now + 0.45);
        // Impact noise
        this._noise(ctx, v * 0.2, 0.005, 0.1, 'lowpass', 400, 0.1, out);
    }

    // Low thud + descending tone — life points draining
    static _lpDamage(ctx, v, out) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.45, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.45);
        this._noise(ctx, v * 0.15, 0.003, 0.08, 'lowpass', 300, 0, out);
    }

    // Bright ascending chime — life points restored
    static _lpRecover(ctx, v, out) {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const t = now + i * 0.06;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.25, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.4);
        });
    }

    // Descending whomp + soft noise swoosh — somber send-off to the graveyard
    static _toGY(ctx, v, out) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.38);
        g.gain.setValueAtTime(v * 0.38, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.52);
        // Soft descending noise swoosh — card being swept off the field
        this._noise(ctx, v * 0.15, 0.005, 0.35, 'bandpass', 420, 0, out);
    }

    // Sharp rising tone + highpass noise burst — vanishing
    static _toBanish(ctx, v, out) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(2800, now + 0.18);
        g.gain.setValueAtTime(v * 0.25, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.25);
        this._noise(ctx, v * 0.18, 0.005, 0.14, 'highpass', 3000, 0, out);
    }

    // Heavy impact thud + surging filtered rise — tribute given, power emerges
    static _tribute(ctx, v, out) {
        const now = ctx.currentTime;
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(120, now);
        thud.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        tg.gain.setValueAtTime(0, now);
        tg.gain.linearRampToValueAtTime(v * 0.65, now + 0.01);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        thud.connect(tg); tg.connect(out);
        thud.start(now); thud.stop(now + 0.28);
        // Rising filtered sawtooth — the tribute-summoned monster emerging
        const rise = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const rg = ctx.createGain();
        rise.type = 'sawtooth';
        rise.frequency.setValueAtTime(150, now + 0.14);
        rise.frequency.exponentialRampToValueAtTime(520, now + 0.7);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now + 0.14);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.7);
        rg.gain.setValueAtTime(0, now + 0.14);
        rg.gain.linearRampToValueAtTime(v * 0.3, now + 0.22);
        rg.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
        rise.connect(filter); filter.connect(rg); rg.connect(out);
        rise.start(now + 0.14); rise.stop(now + 0.88);
    }

    // Low resonant drone + three rising ceremonial bells + sustained peak — ancient invocation
    static _ritual(ctx, v, out) {
        const now = ctx.currentTime;
        const drone = ctx.createOscillator();
        const dg = ctx.createGain();
        drone.type = 'sine';
        drone.frequency.setValueAtTime(110, now);
        dg.gain.setValueAtTime(0, now);
        dg.gain.linearRampToValueAtTime(v * 0.3, now + 0.18);
        dg.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
        drone.connect(dg); dg.connect(out);
        drone.start(now); drone.stop(now + 1.05);
        // Three ascending ceremonial bell tones
        [329.63, 493.88, 659.25].forEach((freq, i) => {
            const t = now + 0.1 + i * 0.22;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.38, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.78);
        });
        // Final bright sustained bell — ritual complete
        const bell = ctx.createOscillator();
        const bg = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(987.77, now + 0.78);
        bg.gain.setValueAtTime(0, now + 0.78);
        bg.gain.linearRampToValueAtTime(v * 0.48, now + 0.8);
        bg.gain.exponentialRampToValueAtTime(0.0001, now + 1.75);
        bell.connect(bg); bg.connect(out);
        bell.start(now + 0.78); bell.stop(now + 1.8);
    }

    // Dual scales converge — high descends, low ascends, then burst chord
    static _pendulum(ctx, v, out) {
        const now = ctx.currentTime;
        // High scale descending
        const oscA = ctx.createOscillator();
        const gA = ctx.createGain();
        oscA.type = 'sine';
        oscA.frequency.setValueAtTime(880, now);
        oscA.frequency.exponentialRampToValueAtTime(440, now + 0.42);
        gA.gain.setValueAtTime(0, now);
        gA.gain.linearRampToValueAtTime(v * 0.26, now + 0.03);
        gA.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
        oscA.connect(gA); gA.connect(out);
        oscA.start(now); oscA.stop(now + 0.57);
        // Low scale ascending
        const oscB = ctx.createOscillator();
        const gB = ctx.createGain();
        oscB.type = 'sine';
        oscB.frequency.setValueAtTime(220, now);
        oscB.frequency.exponentialRampToValueAtTime(440, now + 0.42);
        gB.gain.setValueAtTime(0, now);
        gB.gain.linearRampToValueAtTime(v * 0.26, now + 0.03);
        gB.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
        oscB.connect(gB); gB.connect(out);
        oscB.start(now); oscB.stop(now + 0.57);
        // Burst chord when scales converge — A major spread upward
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
            const t = now + 0.38 + i * 0.045;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.23, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.75);
        });
    }

    // Barely-there soft click
    static _step(ctx, v, out) {
        this._noise(ctx, v * 0.1, 0.002, 0.04, 'bandpass', 1400, 0, out);
    }

    // Ascending C major arpeggio + sparkle cap + sustained final chord
    static _comboComplete(ctx, v, out) {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const t = now + i * 0.12;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.38, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.6);
        });
        // High sparkle pair — E6 then G6 cap the fanfare
        [1318.5, 1567.98].forEach((freq, i) => {
            const t = now + 0.50 + i * 0.085;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.2, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.95);
        });
        // Sustained chord
        const cs = now + 0.58;
        [523.25, 659.25, 783.99].forEach(freq => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, cs);
            g.gain.setValueAtTime(0, cs);
            g.gain.linearRampToValueAtTime(v * 0.3, cs + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, cs + 1.4);
            osc.connect(g); g.connect(out);
            osc.start(cs); osc.stop(cs + 1.5);
        });
    }

    // ── Controls ───────────────────────────────────────────────────────────────

    static toggleMute() {
        this._muted = !this._muted;
        return this._muted;
    }

    static setVolume(v) {
        this._masterVolume = Math.max(0, Math.min(1, v));
    }

    static get isMuted() {
        return this._muted;
    }
}

window.ComboSounds = ComboSounds;
