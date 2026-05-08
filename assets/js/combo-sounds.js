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
    static _masterVolume = 0.45;
    static _compressor = null;
    static _reverb = null;

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

    // Synthetic convolution reverb — exponentially-decaying stereo noise impulse response
    static _getReverb(ctx) {
        if (this._reverb && this._reverb.context === ctx) return this._reverb;
        const sr = ctx.sampleRate;
        const len = Math.ceil(sr * 1.8);
        const ir = ctx.createBuffer(2, len, sr);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
        }
        const conv = ctx.createConvolver();
        conv.buffer = ir;
        conv.connect(this._getOut(ctx));
        this._reverb = conv;
        return conv;
    }

    // FM synthesis — returns carrier oscillator with modulator wired to its frequency param
    // Caller must connect carrier to a gain node and set its own amplitude envelope
    static _fm(ctx, carrierFreq, modRatio, modIndex, t, duration, waveType = 'sine') {
        const modFreq = carrierFreq * modRatio;
        const modDepth = carrierFreq * modIndex;
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.type = 'sine';
        mod.frequency.setValueAtTime(modFreq, t);
        modGain.gain.setValueAtTime(modDepth, t);
        const carrier = ctx.createOscillator();
        carrier.type = waveType;
        carrier.frequency.setValueAtTime(carrierFreq, t);
        mod.connect(modGain); modGain.connect(carrier.frequency);
        mod.start(t); mod.stop(t + duration + 0.05);
        return carrier;
    }

    // Stereo panner convenience wrapper
    static _pan(ctx, panValue) {
        const p = ctx.createStereoPanner();
        p.pan.setValueAtTime(panValue, ctx.currentTime);
        return p;
    }

    // Send a node to the reverb with a given wet gain amount
    static _reverbSend(ctx, sourceNode, wetGain) {
        const send = ctx.createGain();
        send.gain.setValueAtTime(wetGain, ctx.currentTime);
        sourceNode.connect(send);
        send.connect(this._getReverb(ctx));
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

    // FM electric piano arpeggio — C5 → E5 → G5, triangle carrier + sine mod for harp-like timbre
    static _draw(ctx, v, out) {
        const now = ctx.currentTime;
        [[523.25, 0], [659.25, 0.08], [783.99, 0.16]].forEach(([freq, delay]) => {
            const t = now + delay;
            const carrier = this._fm(ctx, freq, 2, 0.8, t, 0.5, 'triangle');
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.38, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.46);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.18);
            carrier.start(t); carrier.stop(t + 0.52);
        });
    }

    // Card-on-table impact — impact click + paper snap + hollow wood knock + sub-sine thud
    static _normalSummon(ctx, v, out) {
        const now = ctx.currentTime;
        // Impact click — card edge contact (ultra-short)
        this._noise(ctx, v * 0.52, 0.001, 0.022, 'highpass', 4800, 0, out);
        // Paper snap — card material flexing
        this._noise(ctx, v * 0.3, 0.002, 0.055, 'bandpass', 1800, 0, out);
        // Wood knock — high-Q resonant bandpass on noise, rings at ~460Hz like hollow wood
        const wlen = Math.ceil(ctx.sampleRate * 0.18);
        const wbuf = ctx.createBuffer(1, wlen, ctx.sampleRate);
        const wd = wbuf.getChannelData(0);
        for (let i = 0; i < wlen; i++) wd[i] = Math.random() * 2 - 1;
        const wsrc = ctx.createBufferSource();
        wsrc.buffer = wbuf;
        const wf = ctx.createBiquadFilter();
        wf.type = 'bandpass';
        wf.frequency.setValueAtTime(460, now);
        wf.Q.setValueAtTime(14, now);
        const wg = ctx.createGain();
        wg.gain.setValueAtTime(0, now);
        wg.gain.linearRampToValueAtTime(v * 0.46, now + 0.002);
        wg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        wsrc.connect(wf); wf.connect(wg); wg.connect(out);
        wsrc.start(now); wsrc.stop(now + 0.2);
        // Wood surface resonance — damped sine, table surface ring
        const wres = ctx.createOscillator();
        const wrg = ctx.createGain();
        wres.type = 'sine';
        wres.frequency.setValueAtTime(270, now);
        wres.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        wrg.gain.setValueAtTime(0, now);
        wrg.gain.linearRampToValueAtTime(v * 0.38, now + 0.003);
        wrg.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        wres.connect(wrg); wrg.connect(out);
        wres.start(now); wres.stop(now + 0.17);
        // Sub-sine thud — table mass vibrating
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(175, now);
        thud.frequency.exponentialRampToValueAtTime(52, now + 0.24);
        tg.gain.setValueAtTime(0, now);
        tg.gain.linearRampToValueAtTime(v * 0.72, now + 0.006);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        thud.connect(tg); tg.connect(out);
        thud.start(now); thud.stop(now + 0.36);
    }

    // Energetic noise crescendo + FM chord arrival + sparkle tail
    static _specialSummon(ctx, v, out) {
        const now = ctx.currentTime;
        // Rising bandpass noise sweep — materialization burst
        const dur = 0.5;
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(200, now);
        f.frequency.exponentialRampToValueAtTime(3200, now + dur);
        f.Q.setValueAtTime(2.0, now);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, now);
        ng.gain.linearRampToValueAtTime(v * 0.36, now + 0.04);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(f); f.connect(ng); ng.connect(out);
        this._reverbSend(ctx, ng, 0.2);
        src.start(now); src.stop(now + dur + 0.05);
        // High sparkle tail
        this._noise(ctx, v * 0.14, 0.01, 0.28, 'highpass', 6000, 0.32, out);
        // 3-voice FM chord with stereo spread
        [[523.25, -0.45], [659.25, 0], [783.99, 0.45]].forEach(([freq, pan], i) => {
            const t = now + 0.32 + i * 0.022;
            const carrier = this._fm(ctx, freq, 2, 0.5, t, 0.72, 'sine');
            const g = ctx.createGain();
            const panner = this._pan(ctx, pan);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * (0.34 - i * 0.05), t + 0.014);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.68);
            carrier.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.24);
            carrier.start(t); carrier.stop(t + 0.78);
        });
    }

    // Triangle sweep + noise burst + FM metallic bell — sci-fi tuner synchronization
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
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.72);
        filter.Q.setValueAtTime(1.2, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.38, now + 0.05);
        g.gain.linearRampToValueAtTime(v * 0.42, now + 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.88);
        osc.connect(filter); filter.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.92);
        // Noise burst at sweep peak
        this._noise(ctx, v * 0.18, 0.02, 0.22, 'bandpass', 2200, 0.62, out);
        // FM metallic bell — ratio 3.5 for inharmonic ring
        const t = now + 0.65;
        const bell = this._fm(ctx, 1318.5, 3.5, 0.6, t, 1.85, 'sine');
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0, t);
        bg.gain.linearRampToValueAtTime(v * 0.52, t + 0.012);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
        bell.connect(bg); bg.connect(out);
        this._reverbSend(ctx, bg, 0.28);
        bell.start(t); bell.stop(t + 1.95);
        // Fifth harmonic shimmer
        const shimmer = ctx.createOscillator();
        const sg = ctx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(1976.5, t + 0.01);
        sg.gain.setValueAtTime(0, t + 0.01);
        sg.gain.linearRampToValueAtTime(v * 0.14, t + 0.025);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        shimmer.connect(sg); sg.connect(out);
        shimmer.start(t + 0.01); shimmer.stop(t + 1.15);
    }

    // Converging tones + noise swirl + FM chord explosion — powerful magical synthesis
    static _fusion(ctx, v, out) {
        const now = ctx.currentTime;
        // High sine descending
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
        // Low sine ascending
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
        // Warm noise swirl — materials dissolving
        this._noise(ctx, v * 0.22, 0.1, 0.55, 'bandpass', 700, 0, out);
        // Sustained FM chord — 4 voices for rich harmonics
        [330, 415, 495, 660].forEach((freq, i) => {
            const t = now + 0.62 + i * 0.025;
            const carrier = this._fm(ctx, freq, 2, 0.4, t, 1.5, 'sine');
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.27, t + 0.06);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.22);
            carrier.start(t); carrier.stop(t + 1.45);
        });
        // FM sparkle cap
        const t2 = now + 0.65;
        const sparkle = this._fm(ctx, 1980, 3, 0.25, t2, 0.9, 'sine');
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0, t2);
        sg.gain.linearRampToValueAtTime(v * 0.22, t2 + 0.015);
        sg.gain.exponentialRampToValueAtTime(0.0001, t2 + 1.4);
        sparkle.connect(sg); sg.connect(out);
        this._reverbSend(ctx, sg, 0.3);
        sparkle.start(t2); sparkle.stop(t2 + 1.45);
    }

    // Stereo sawtooth approach + triple-layer collision + sub-bass + dual FM metallic ring
    static _contactFusion(ctx, v, out) {
        const now = ctx.currentTime;
        // High sawtooth rushing down from left → center
        const oscH = ctx.createOscillator();
        const panH = ctx.createStereoPanner();
        const gH = ctx.createGain();
        oscH.type = 'sawtooth';
        oscH.frequency.setValueAtTime(1600, now);
        oscH.frequency.exponentialRampToValueAtTime(380, now + 0.2);
        panH.pan.setValueAtTime(-0.55, now);
        panH.pan.linearRampToValueAtTime(0, now + 0.2);
        gH.gain.setValueAtTime(v * 0.32, now);
        gH.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        oscH.connect(panH); panH.connect(gH); gH.connect(out);
        oscH.start(now); oscH.stop(now + 0.3);
        // Low sawtooth rushing up from right → center
        const oscL = ctx.createOscillator();
        const panL = ctx.createStereoPanner();
        const gL = ctx.createGain();
        oscL.type = 'sawtooth';
        oscL.frequency.setValueAtTime(70, now);
        oscL.frequency.exponentialRampToValueAtTime(380, now + 0.2);
        panL.pan.setValueAtTime(0.55, now);
        panL.pan.linearRampToValueAtTime(0, now + 0.2);
        gL.gain.setValueAtTime(0, now);
        gL.gain.linearRampToValueAtTime(v * 0.38, now + 0.04);
        gL.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        oscL.connect(panL); panL.connect(gL); gL.connect(out);
        oscL.start(now); oscL.stop(now + 0.3);
        // Triple-layer collision impact
        this._noise(ctx, v * 0.5, 0.004, 0.22, 'bandpass', 650, 0.17, out);
        this._noise(ctx, v * 0.32, 0.003, 0.14, 'lowpass', 280, 0.17, out);
        this._noise(ctx, v * 0.22, 0.003, 0.07, 'highpass', 3200, 0.17, out);
        // Sub-bass collision thud
        const sub = ctx.createOscillator();
        const sg = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(80, now + 0.17);
        sub.frequency.exponentialRampToValueAtTime(24, now + 0.42);
        sg.gain.setValueAtTime(0, now + 0.17);
        sg.gain.linearRampToValueAtTime(v * 0.62, now + 0.176);
        sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
        sub.connect(sg); sg.connect(out);
        sub.start(now + 0.17); sub.stop(now + 0.5);
        // Two slightly detuned FM tones — stereo metallic resonance
        const t = now + 0.22;
        [[392, -0.22], [396, 0.22]].forEach(([freq, pan]) => {
            const merged = this._fm(ctx, freq, 2.8, 1.2, t, 0.78, 'sine');
            merged.frequency.setValueAtTime(freq, t);
            merged.frequency.linearRampToValueAtTime(freq * 0.84, t + 0.38);
            const mg = ctx.createGain();
            const panner = this._pan(ctx, pan);
            mg.gain.setValueAtTime(0, t);
            mg.gain.linearRampToValueAtTime(v * 0.38, t + 0.024);
            mg.gain.exponentialRampToValueAtTime(0.0001, t + 0.86);
            merged.connect(mg); mg.connect(panner); panner.connect(out);
            merged.start(t); merged.stop(t + 0.92);
        });
    }

    // Tight descending blips pulled into gravity + earth-shaking sub-bass slam
    static _xyz(ctx, v, out) {
        const now = ctx.currentTime;
        // Three tight descending blips — sucked into the gravity well
        [660, 440, 293].forEach((freq, i) => {
            const t = now + i * 0.13;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.15, t + 0.2);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.3, t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
            osc.connect(g); g.connect(out);
            osc.start(t); osc.stop(t + 0.3);
        });
        // Massive sub-bass slam — XYZ monster erupts from the abyss
        const slam = ctx.createOscillator();
        const sg = ctx.createGain();
        slam.type = 'sine';
        slam.frequency.setValueAtTime(60, now + 0.38);
        slam.frequency.exponentialRampToValueAtTime(22, now + 1.55);
        sg.gain.setValueAtTime(0, now + 0.38);
        sg.gain.linearRampToValueAtTime(v * 0.88, now + 0.42);
        sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.68);
        slam.connect(sg); sg.connect(out);
        slam.start(now + 0.38); slam.stop(now + 1.73);
        // Low harmonic rumble
        const rumble = ctx.createOscillator();
        const rg = ctx.createGain();
        rumble.type = 'triangle';
        rumble.frequency.setValueAtTime(110, now + 0.38);
        rg.gain.setValueAtTime(0, now + 0.38);
        rg.gain.linearRampToValueAtTime(v * 0.24, now + 0.5);
        rg.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        rumble.connect(rg); rg.connect(out);
        rumble.start(now + 0.38); rumble.stop(now + 1.15);
        // Low-pass noise impact thud
        this._noise(ctx, v * 0.36, 0.005, 0.26, 'lowpass', 200, 0.38, out);
    }

    // Circuit nodes activating + FM crystalline ping + highpass digital noise
    static _link(ctx, v, out) {
        const now = ctx.currentTime;
        // Six square wave circuit ticks — digital nodes coming online
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
        // FM crystalline ping — link established, ratio 3 for bright bell
        const t = now + 0.36;
        const ping = this._fm(ctx, 1568, 3, 0.4, t, 0.82, 'sine');
        const pg = ctx.createGain();
        pg.gain.setValueAtTime(0, t);
        pg.gain.linearRampToValueAtTime(v * 0.44, t + 0.012);
        pg.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
        ping.connect(pg); pg.connect(out);
        ping.start(t); ping.stop(t + 1.05);
        // High digital noise — data flowing
        this._noise(ctx, v * 0.15, 0.01, 0.28, 'highpass', 5500, 0.34, out);
    }

    // Ascending slide + FM metallic click — futuristic armor/weapon equip
    static _equip(ctx, v, out) {
        const now = ctx.currentTime;
        // Sharp ascending slide — equip locking on
        const slide = ctx.createOscillator();
        const sg = ctx.createGain();
        slide.type = 'sine';
        slide.frequency.setValueAtTime(200, now);
        slide.frequency.exponentialRampToValueAtTime(750, now + 0.12);
        sg.gain.setValueAtTime(0, now);
        sg.gain.linearRampToValueAtTime(v * 0.34, now + 0.012);
        sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        slide.connect(sg); sg.connect(out);
        slide.start(now); slide.stop(now + 0.22);
        // FM metallic click — ratio 4 for sharp inharmonic clank
        const t = now + 0.11;
        const bell = this._fm(ctx, 1046.5, 4, 0.5, t, 0.72, 'triangle');
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0, t);
        bg.gain.linearRampToValueAtTime(v * 0.48, t + 0.008);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
        bell.connect(bg); bg.connect(out);
        bell.start(t); bell.stop(t + 0.77);
        // High shimmer
        const shimmer = ctx.createOscillator();
        const shg = ctx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2093, t + 0.02);
        shg.gain.setValueAtTime(0, t + 0.02);
        shg.gain.linearRampToValueAtTime(v * 0.15, t + 0.035);
        shg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        shimmer.connect(shg); shg.connect(out);
        shimmer.start(t + 0.02); shimmer.stop(t + 0.55);
    }

    // FM crystal bell with vibrato — pristine magical activation
    static _effect(ctx, v, out) {
        const now = ctx.currentTime;
        // FM crystal bell — ratio 3.5 for bright inharmonic shimmer
        const carrier = this._fm(ctx, 1047, 3.5, 0.4, now, 0.75, 'sine');
        // LFO vibrato on carrier
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(10, now);
        lfoG.gain.setValueAtTime(22, now);
        lfo.connect(lfoG); lfoG.connect(carrier.frequency);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.32, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        carrier.connect(g); g.connect(out);
        this._reverbSend(ctx, g, 0.2);
        lfo.start(now); lfo.stop(now + 0.76);
        carrier.start(now); carrier.stop(now + 0.76);
        // Octave shadow — body under the sparkle
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

    // Dissonant descending buzz + hard noise burst — aggressive spell cancellation
    static _negate(ctx, v, out) {
        const now = ctx.currentTime;
        // Main sawtooth descending buzz
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.4, now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.42);
        // Tritone square layer — maximum dissonance
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(424, now); // tritone below 600Hz
        osc2.frequency.exponentialRampToValueAtTime(85, now + 0.25);
        g2.gain.setValueAtTime(0, now);
        g2.gain.linearRampToValueAtTime(v * 0.16, now + 0.008);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc2.connect(g2); g2.connect(out);
        osc2.start(now); osc2.stop(now + 0.35);
        // Hard noise burst — shattering the effect
        this._noise(ctx, v * 0.34, 0.004, 0.2, 'bandpass', 900, 0.02, out);
    }

    // Aggressive sawtooth whoosh + heavy sub-sine impact — combat strike
    static _attack(ctx, v, out) {
        const now = ctx.currentTime;
        // Aggressive sawtooth whoosh — object swinging
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.26, now + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.2);
        // Sub-sine impact thud
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(160, now + 0.1);
        thud.frequency.exponentialRampToValueAtTime(35, now + 0.38);
        tg.gain.setValueAtTime(0, now + 0.1);
        tg.gain.linearRampToValueAtTime(v * 0.65, now + 0.112);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
        thud.connect(tg); tg.connect(out);
        thud.start(now + 0.1); thud.stop(now + 0.5);
        // Low-pass noise punch
        this._noise(ctx, v * 0.26, 0.005, 0.13, 'lowpass', 400, 0.1, out);
    }

    // Heavy descending sine + sub-bass thud + lowpass noise — health loss penalty
    static _lpDamage(ctx, v, out) {
        const now = ctx.currentTime;
        // Descending tone — HP draining
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.32);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(v * 0.52, now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
        osc.connect(g); g.connect(out);
        this._reverbSend(ctx, g, 0.12);
        osc.start(now); osc.stop(now + 0.48);
        // Sub-bass thud — weight of the hit
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(80, now);
        thud.frequency.exponentialRampToValueAtTime(25, now + 0.2);
        tg.gain.setValueAtTime(0, now);
        tg.gain.linearRampToValueAtTime(v * 0.44, now + 0.005);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        thud.connect(tg); tg.connect(out);
        thud.start(now); thud.stop(now + 0.32);
        // Low-pass noise punch
        this._noise(ctx, v * 0.18, 0.003, 0.1, 'lowpass', 320, 0, out);
    }

    // FM chime arpeggio + sparkle — warm glowing health recovery
    static _lpRecover(ctx, v, out) {
        const now = ctx.currentTime;
        [[523.25, 0], [659.25, 0.065], [783.99, 0.13]].forEach(([freq, delay]) => {
            const t = now + delay;
            const carrier = this._fm(ctx, freq, 2, 0.5, t, 0.48, 'sine');
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.3, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.2);
            carrier.start(t); carrier.stop(t + 0.5);
        });
        // High sparkle tail
        this._noise(ctx, v * 0.1, 0.008, 0.2, 'highpass', 5000, 0.1, out);
    }

    // Muffled descending whomp + hollow swoosh — falling into the dark pit
    static _toGY(ctx, v, out) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.42);
        g.gain.setValueAtTime(v * 0.44, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.54);
        osc.connect(g); g.connect(out);
        this._reverbSend(ctx, g, 0.18);
        osc.start(now); osc.stop(now + 0.58);
        // Hollow descending bandpass swoosh
        this._noise(ctx, v * 0.18, 0.005, 0.4, 'bandpass', 380, 0, out);
    }

    // Sharp ascending tone instantly cut off + airy highpass noise — dimensional vanish
    static _toBanish(ctx, v, out) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(3200, now + 0.18);
        g.gain.setValueAtTime(v * 0.28, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.26);
        // Airy highpass burst — the void opening
        this._noise(ctx, v * 0.22, 0.005, 0.16, 'highpass', 3200, 0, out);
    }

    // Deep sub-bass sacrifice thud + dark filtered sawtooth rise — ominous power
    static _tribute(ctx, v, out) {
        const now = ctx.currentTime;
        // Sub-sine kick — deep sacrifice impact
        const kick = ctx.createOscillator();
        const kg = ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(90, now);
        kick.frequency.exponentialRampToValueAtTime(28, now + 0.18);
        kg.gain.setValueAtTime(0, now);
        kg.gain.linearRampToValueAtTime(v * 0.78, now + 0.006);
        kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        kick.connect(kg); kg.connect(out);
        kick.start(now); kick.stop(now + 0.32);
        // Bandpass impact noise burst
        this._noise(ctx, v * 0.32, 0.004, 0.12, 'bandpass', 700, 0, out);
        // Rising filtered sawtooth — tribute monster emerging from darkness
        const rise = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const rg = ctx.createGain();
        rise.type = 'sawtooth';
        rise.frequency.setValueAtTime(130, now + 0.16);
        rise.frequency.exponentialRampToValueAtTime(520, now + 0.75);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now + 0.16);
        filter.frequency.exponentialRampToValueAtTime(3500, now + 0.75);
        rg.gain.setValueAtTime(0, now + 0.16);
        rg.gain.linearRampToValueAtTime(v * 0.34, now + 0.24);
        rg.gain.exponentialRampToValueAtTime(0.0001, now + 0.92);
        rise.connect(filter); filter.connect(rg); rg.connect(out);
        this._reverbSend(ctx, rg, 0.15);
        rise.start(now + 0.16); rise.stop(now + 0.97);
    }

    // FM drone + inharmonic FM ceremonial bells + long reverb — dark ancient invocation
    static _ritual(ctx, v, out) {
        const now = ctx.currentTime;
        // FM drone — warm atmospheric undertone
        const drone = this._fm(ctx, 110, 0.5, 0.2, now, 1.1, 'sine');
        const dg = ctx.createGain();
        dg.gain.setValueAtTime(0, now);
        dg.gain.linearRampToValueAtTime(v * 0.3, now + 0.18);
        dg.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        drone.connect(dg); dg.connect(out);
        this._reverbSend(ctx, dg, 0.3);
        drone.start(now); drone.stop(now + 1.15);
        // Three FM bells — ratio 2.76 gives inharmonic brass-bell character
        [329.63, 493.88, 659.25].forEach((freq, i) => {
            const t = now + 0.1 + i * 0.22;
            const bell = this._fm(ctx, freq, 2.76, 0.45, t, 0.88, 'sine');
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.42, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.88);
            bell.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.32);
            bell.start(t); bell.stop(t + 0.93);
        });
        // Final sustained FM bell — ritual complete
        const t2 = now + 0.78;
        const finalBell = this._fm(ctx, 987.77, 2.76, 0.38, t2, 1.15, 'sine');
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0, t2);
        bg.gain.linearRampToValueAtTime(v * 0.54, t2 + 0.015);
        bg.gain.exponentialRampToValueAtTime(0.0001, t2 + 1.95);
        finalBell.connect(bg); bg.connect(out);
        this._reverbSend(ctx, bg, 0.42);
        finalBell.start(t2); finalBell.stop(t2 + 2.0);
    }

    // Stereo panning convergence — chimes sweep left/right to center + burst chord
    static _pendulum(ctx, v, out) {
        const now = ctx.currentTime;
        // High chime — pans left (-0.8) sweeping to center (0)
        const oscA = ctx.createOscillator();
        const panA = ctx.createStereoPanner();
        const gA = ctx.createGain();
        oscA.type = 'sine';
        oscA.frequency.setValueAtTime(880, now);
        oscA.frequency.exponentialRampToValueAtTime(440, now + 0.42);
        panA.pan.setValueAtTime(-0.8, now);
        panA.pan.linearRampToValueAtTime(0, now + 0.42);
        gA.gain.setValueAtTime(0, now);
        gA.gain.linearRampToValueAtTime(v * 0.28, now + 0.03);
        gA.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
        oscA.connect(panA); panA.connect(gA); gA.connect(out);
        oscA.start(now); oscA.stop(now + 0.57);
        // Low chime — pans right (0.8) sweeping to center (0)
        const oscB = ctx.createOscillator();
        const panB = ctx.createStereoPanner();
        const gB = ctx.createGain();
        oscB.type = 'sine';
        oscB.frequency.setValueAtTime(220, now);
        oscB.frequency.exponentialRampToValueAtTime(440, now + 0.42);
        panB.pan.setValueAtTime(0.8, now);
        panB.pan.linearRampToValueAtTime(0, now + 0.42);
        gB.gain.setValueAtTime(0, now);
        gB.gain.linearRampToValueAtTime(v * 0.28, now + 0.03);
        gB.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
        oscB.connect(panB); panB.connect(gB); gB.connect(out);
        oscB.start(now); oscB.stop(now + 0.57);
        // Burst chord at convergence — A major with stereo spread
        [[440, -0.3], [554.37, 0.3], [659.25, -0.15], [880, 0.15]].forEach(([freq, pan], i) => {
            const t = now + 0.38 + i * 0.045;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const panner = this._pan(ctx, pan);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.25, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
            osc.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.2);
            osc.start(t); osc.stop(t + 0.8);
        });
    }

    // Clean muted click — unobtrusive UI step indicator
    static _step(ctx, v, out) {
        this._noise(ctx, v * 0.1, 0.001, 0.028, 'highpass', 2200, 0, out);
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        g.gain.setValueAtTime(v * 0.05, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
        osc.connect(g); g.connect(out);
        osc.start(now); osc.stop(now + 0.026);
    }

    // FM arpeggio + sparkle pair + wide stereo sustained chord — ultimate fanfare
    static _comboComplete(ctx, v, out) {
        const now = ctx.currentTime;
        // 4-note FM arpeggio with subtle stereo spread
        [[523.25, 0, -0.25], [659.25, 0.12, 0.25], [783.99, 0.24, -0.15], [1046.5, 0.36, 0]].forEach(([freq, delay, pan]) => {
            const t = now + delay;
            const carrier = this._fm(ctx, freq, 2, 0.6, t, 0.65, 'sine');
            const g = ctx.createGain();
            const panner = this._pan(ctx, pan);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.42, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
            carrier.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.2);
            carrier.start(t); carrier.stop(t + 0.67);
        });
        // FM sparkle pair — E6 then G6
        [[1318.5, 0], [1567.98, 0.085]].forEach(([freq, offset]) => {
            const t = now + 0.5 + offset;
            const carrier = this._fm(ctx, freq, 3, 0.3, t, 1.0, 'sine');
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v * 0.22, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
            carrier.connect(g); g.connect(out);
            this._reverbSend(ctx, g, 0.35);
            carrier.start(t); carrier.stop(t + 1.0);
        });
        // Sustained wide stereo chord
        const cs = now + 0.58;
        [[523.25, -0.3], [659.25, 0.3], [783.99, 0]].forEach(([freq, pan]) => {
            const carrier = this._fm(ctx, freq, 2, 0.35, cs, 1.5, 'sine');
            const g = ctx.createGain();
            const panner = this._pan(ctx, pan);
            g.gain.setValueAtTime(0, cs);
            g.gain.linearRampToValueAtTime(v * 0.32, cs + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, cs + 1.45);
            carrier.connect(g); g.connect(panner); panner.connect(out);
            this._reverbSend(ctx, g, 0.42);
            carrier.start(cs); carrier.stop(cs + 1.5);
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
