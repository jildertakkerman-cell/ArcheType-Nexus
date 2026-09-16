/* ==========================================================================
   ReplayBrowser — Interactive dual-player board viewer
   Consumes analysis.moveLog — each entry is one discrete game action.

   Expected moveLog entry shape:
   {
     type: string,     // maps to ComboSounds event (see SOUND_MAP below)
     turn: number,
     player: 0|1,      // on turn-change steps this is the turn player
     phase: string,    // draw | standby | main1 | battle | main2 | end
     label: string,    // human-readable description shown in the log
     actions: [
       {
         id: string,   // stable unique instance ID assigned by backend
         code: number, // YGOPro passcode (used for card image lookup)
         name: string, // card name (used for CardLoader image + popup)
         player: 0|1,  // which player's board the card belongs to
         from: string, // source zone (canonical name, see ZONE_MAP)
         to: string    // destination zone (canonical name, see ZONE_MAP)
       }
     ]
   }

   Canonical zone names:
     hand, deck, extra, graveyard, field-spell, banished, overlay
     monster-zone-1 … monster-zone-5
     spell-zone-1 … spell-zone-5
     extra-monster-zone-left, extra-monster-zone-right
   ========================================================================== */

const REPLAY_SOUND_MAP = {
    'draw':                   'draw',
    'normal-summon':          'normal-summon',
    'special-summon':         'special-summon',
    'synchro-summon':         'synchro',
    'xyz-summon':             'xyz',
    'fusion-summon':          'fusion',
    'contact-fusion':         'contact-fusion',
    'link-summon':            'link',
    'ritual-summon':          'ritual',
    'pendulum-summon':        'pendulum',
    'tribute':                'tribute',
    'effect-activate':        'effect',
    'effect-negate':          'negate',
    'effect-disabled':        'negate',
    'attack':                 'attack',
    'lp-damage':              'lp-damage',
    'lp-cost':                'lp-damage',
    'lp-recover':             'lp-recover',
    'send-to-gy':             'to-gy',
    'banish':                 'to-banish',
    'equip':                  'equip',
    'set':                    'normal-summon',
    'set-monster':            'normal-summon',
    'return-to-hand':         'to-hand',
    'position-change':        'step',
    'stat-change':            'effect',
    'phase-change':           'step',
    'turn-change':            'step',
    'game-over':              'combo-complete',
};

// Phase ids as emitted by the backend's move_log_builder (all battle steps collapse to 'battle').
const REPLAY_PHASES = [
    { id: 'draw',    short: 'DP', name: 'Draw Phase' },
    { id: 'standby', short: 'SP', name: 'Standby Phase' },
    { id: 'main1',   short: 'M1', name: 'Main Phase 1' },
    { id: 'battle',  short: 'BP', name: 'Battle Phase' },
    { id: 'main2',   short: 'M2', name: 'Main Phase 2' },
    { id: 'end',     short: 'EP', name: 'End Phase' },
];

// The transition a token sits at while it's just moving between zones. Any code
// that swaps this out for a transient effect has to put it back afterwards,
// otherwise the card stops animating its zone-to-zone travel for good.
const TOKEN_TRANSITION = 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), '
                       + 'top 0.5s cubic-bezier(0.34,1.56,0.64,1), '
                       + 'width 0.3s, height 0.3s, opacity 0.3s';

// passcode → ctype class suffix ('monster' | 'spell' | 'trap' | 'extra').
// Module-level so it survives rebuilds and re-scrubs of the same replay.
const RB_TYPE_CACHE = new Map();

// passcode → resolved art URL, for the fallback path only (the metadata cache
// covers the common case). Keeps repeat copies of a card off the network.
const RB_IMAGE_CACHE = new Map();

// CardLoader hands back YGOProDeck-style type strings ("Effect Monster",
// "Quick-Play Spell", "Link Monster", …); collapse them to the four buckets
// the .ctype-* styles are written against.
function rbCardTypeClass(typeString) {
    const t = String(typeString || '');
    if (/Spell/i.test(t)) return 'spell';
    if (/Trap/i.test(t)) return 'trap';
    if (/Fusion|Synchro|Xyz|Link/i.test(t)) return 'extra';
    return 'monster';
}

// Every zone short-name that exists on a board, in no particular order.
// Used to measure the whole board's geometry in one pass.
const RB_ZONE_SHORTS = [
    'em-left', 'em-right', 'field', 'banish', 'gy', 'extra', 'deck', 'hand',
    'm1', 'm2', 'm3', 'm4', 'm5',
    's1', 's2', 's3', 's4', 's5',
];

// Real Yu-Gi-Oh! card proportions (width ÷ height).
const CARD_ASPECT = 59 / 86;

const ZONE_MAP = {
    'hand':                      'hand',
    'deck':                      'deck',
    'extra':                     'extra',
    'graveyard':                 'gy',
    'banished':                  'banish',
    'field-spell':               'field',
    'monster-zone-1':            'm1',
    'monster-zone-2':            'm2',
    'monster-zone-3':            'm3',
    'monster-zone-4':            'm4',
    'monster-zone-5':            'm5',
    'spell-zone-1':              's1',
    'spell-zone-2':              's2',
    'spell-zone-3':              's3',
    'spell-zone-4':              's4',
    'spell-zone-5':              's5',
    'extra-monster-zone-left':   'em-left',
    'extra-monster-zone-right':  'em-right',
    // 'overlay' is deliberately absent — materials are handled separately by
    // _attachMaterial. Mapping it to a zone is what used to dump them in the GY.
};

class ReplayBrowser {
    /**
     * @param {object} [options]
     * @param {Array}  [options.decks]     analysis.decks — [{main:[code], extra:[code]}, …].
     *                                     Only used for the deck/extra remaining counts;
     *                                     those counts are hidden when it's absent.
     * @param {object} [options.cardMeta]  live passcode → {type, atk, def, linkval} map.
     * @param {Function} [options.fetchMeta] batch loader that fills cardMeta.
     *
     * cardMeta/fetchMeta are injected rather than reached for as globals so this
     * stays a standalone component — it degrades to per-card CardLoader lookups
     * when they aren't supplied.
     */
    constructor(containerId, moveLog, playerNames, options = {}) {
        this.containerId = containerId;
        this.moveLog = moveLog;
        this.playerNames = playerNames || ['Player 1', 'Player 2'];
        this.decks = options.decks || null;
        this.cardMeta = options.cardMeta || null;
        this.fetchMeta = options.fetchMeta || null;
        this.currentIndex = -1;
        this.tokens = new Map();    // id → { el, player, zone }
        this.isPlaying = false;
        this.playInterval = null;
        this.speed = 1200;
        this.p1Board = null;
        this.p2Board = null;
        this.p1TokenLayer = null;
        this.p2TokenLayer = null;
        this.resizeObserver = null;
        this._lastEffectName = null;
        this._lastEffectDesc = null;
        this._mobileActivePlayer = 0;
        this._showMobilePlayer = null;
        this._turnPlayer = null;    // 0|1, taken from the latest turn-change step
        this._lastSummonedId = null; // fallback host for late-attaching Xyz materials
        this._openZoneView = null;   // zone element id whose card list is open, if any
        this._geom = null;           // cached board geometry, see _measureGeometry
        // How much of a zone a card fills. Tunable in one place now that every
        // layout derives its card size from the measured zone.
        this.zoneFill = 0.92;
    }

    /* ------------------------------------------------------------------
       Board geometry — measured once per layout, not once per token
       ------------------------------------------------------------------ */

    // Positioning used to call getBoundingClientRect twice per token on every
    // step, interleaved with style writes — a forced reflow per card. The board
    // only actually changes shape on resize, fullscreen and the mobile board
    // toggle, so measure it there and let positioning read from this cache.
    _invalidateGeometry() {
        this._geom = null;
    }

    _measureGeometry() {
        const geom = [null, null];

        [0, 1].forEach(player => {
            const board = this._board(player);
            if (!board) return;
            const boardRect = board.getBoundingClientRect();
            // A hidden board (the mobile toggle hides one half) measures zero —
            // leave it unmeasured so we retry rather than caching garbage.
            if (!boardRect.width || !boardRect.height) return;

            const prefix = player === 0 ? 'p1' : 'p2';
            const zones = {};
            for (const short of RB_ZONE_SHORTS) {
                const id = `rb-${prefix}-${short}`;
                const el = document.getElementById(id);
                if (!el) continue;
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height) continue;
                // Banished cards are laid on their side, so they have to be fitted
                // against the zone's swapped dimensions or the rotated card sticks
                // out past the zone it is supposed to be sitting in.
                const card = this._fitCard(r, short === 'hand', short === 'banish');
                zones[id] = {
                    left: r.left - boardRect.left,
                    top: r.top - boardRect.top,
                    width: r.width,
                    height: r.height,
                    cw: card.w,
                    ch: card.h,
                };
            }
            geom[player] = zones;
        });

        this._geom = geom;
        return geom;
    }

    _zoneGeom(player, zoneElId) {
        const geom = this._geom || this._measureGeometry();
        const zones = geom[player];
        return zones ? (zones[zoneElId] || null) : null;
    }

    // One card-sizing rule for every layout, replacing the magic 90x100 /
    // 58x84 / fullscreen-only-aspect-fit split. Cards keep true 59:86
    // proportions at every breakpoint instead of being squashed.
    _fitCard(rect, isHand, rotated = false) {
        let w, h;
        if (isHand) {
            h = Math.floor(rect.height * 0.9);
            w = Math.round(h * CARD_ASPECT);
        } else {
            // A card rotated 90deg occupies the zone's height along x and vice versa.
            const boxW = rotated ? rect.height : rect.width;
            const boxH = rotated ? rect.width : rect.height;
            const maxW = Math.floor(boxW * this.zoneFill);
            const maxH = Math.floor(boxH * this.zoneFill);
            if (maxW / CARD_ASPECT <= maxH) {
                w = maxW;
                h = Math.round(w / CARD_ASPECT);
            } else {
                h = maxH;
                w = Math.round(h * CARD_ASPECT);
            }
        }
        // Zone hasn't laid out yet — fall back to something sane rather than 0.
        if (w < 20 || h < 30) { w = 64; h = 93; }
        return { w, h };
    }

    /* ------------------------------------------------------------------
       Card metadata — ATK/DEF/type, resolved once up front
       ------------------------------------------------------------------ */

    // Every passcode the replay will ever show is known before the first step,
    // so pull them all in one batched pass instead of firing a lookup per token
    // as it appears. Fire-and-forget: tokens render immediately and pick up
    // their stats via _refreshAllStats when this lands.
    _prefetchCardData() {
        if (!this.fetchMeta) return;
        const codes = new Set();
        this.moveLog.forEach(step => {
            (step.actions || []).forEach(a => { if (a.code > 0) codes.add(a.code); });
        });
        if (!codes.size) return;

        Promise.resolve(this.fetchMeta([...codes]))
            .then(() => this._refreshAllStats())
            .catch(() => {});
    }

    _meta(code) {
        if (!code || !this.cardMeta) return null;
        return this.cardMeta[code] || null;
    }

    buildUI() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="replay-dashboard">
                <!-- Left Column: The Board -->
                <div class="replay-board-column">
                    <div class="replay-mobile-toggle">
                        <button class="replay-mobile-toggle-btn p1 active" id="rb-toggle-p1">${this.playerNames[0]}</button>
                        <button class="replay-mobile-toggle-btn p2" id="rb-toggle-p2">${this.playerNames[1]}</button>
                    </div>
                    <!-- Contents of a clicked GY / Banished / Deck / Extra pile -->
                    <div class="rb-zoneview" id="rb-zoneview">
                        <div class="rb-zoneview-header">
                            <span id="rb-zoneview-title"></span>
                            <button class="rb-zoneview-close" id="rb-zoneview-close" title="Close">&times;</button>
                        </div>
                        <ul class="rb-zoneview-list" id="rb-zoneview-list"></ul>
                    </div>
                    <div class="replay-board-outer">
                        <div class="replay-player-strip p2-strip">
                            <span>${this.playerNames[1]}</span>
                            <span class="rb-turn-chip">Turn</span>
                            <span id="rb-p2-lp" style="margin-left:auto;opacity:0.7;">8000 LP</span>
                        </div>
                        <div class="replay-board-half p2-half" id="rb-p2-half">
                            ${this._boardHTML('p2')}
                        </div>
                        <div class="replay-phase-bar">
                            <div class="rb-turn-owner" id="rb-turn-owner">Pre-game</div>
                            <ol class="rb-phase-track" id="rb-phase-track">
                                ${REPLAY_PHASES.map(p => `<li class="rb-phase" title="${p.name}">${p.short}</li>`).join('')}
                            </ol>
                        </div>
                        <div class="replay-board-half p1-half" id="rb-p1-half">
                            ${this._boardHTML('p1')}
                        </div>
                        <div class="replay-player-strip p1-strip">
                            <span>${this.playerNames[0]}</span>
                            <span class="rb-turn-chip">Turn</span>
                            <span id="rb-p1-lp" style="margin-left:auto;opacity:0.7;">8000 LP</span>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column: Controls & Log -->
                <div class="replay-sidebar">
                    <!-- Dashboard Header -->
                    <div class="replay-sidebar-header">
                        <h3 style="margin:0; font-size: 1.1rem; color: #fff;">Match Timeline</h3>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <div class="replay-turn-badge" id="rb-turn-label">Turn —</div>
                            <div class="replay-step-counter" id="rb-step-counter">0 / ${this.moveLog.length}</div>
                        </div>
                    </div>

                    <!-- Action Log (Scrollable) -->
                    <div class="replay-log-container">
                        <ul id="rb-log-list" class="replay-action-list">
                            <!-- Javascript will populate this -->
                        </ul>
                    </div>

                    <!-- Sticky Last Effect Panel -->
                    <div class="rb-last-effect-panel" id="rb-last-effect" style="display:none;">
                        <div class="rb-last-effect-header">
                            <span><i class="fas fa-bolt" style="font-size:0.65rem;margin-right:0.35rem;color:#38bdf8;"></i>Last Effect</span>
                            <button class="rb-last-effect-close" onclick="document.getElementById('rb-last-effect').style.display='none'" title="Dismiss">×</button>
                        </div>
                        <div class="rb-last-effect-cardname" id="rb-last-effect-name"></div>
                        <div class="rb-last-effect-text" id="rb-last-effect-text"></div>
                    </div>

                    <!-- Active Action Details / Quick Info -->
                    <div class="replay-action-detail" id="rb-log">
                        Press Play to begin.
                    </div>

                    <!-- Controls -->
                    <div class="replay-controls-grid">
                        <button class="sim-btn sim-btn-nav" id="rb-prev-turn" title="Previous Turn">&#9198;</button>
                        <button class="sim-btn sim-btn-nav" id="rb-prev-step" title="Previous Step"><i class="fas fa-step-backward"></i></button>
                        <button class="sim-btn sim-btn-play" id="rb-play"><i class="fas fa-play"></i></button>
                        <button class="sim-btn sim-btn-nav" id="rb-next-step" title="Next Step"><i class="fas fa-step-forward"></i></button>
                        <button class="sim-btn sim-btn-nav" id="rb-next-turn" title="Next Turn">&#9197;</button>
                    </div>

                    <!-- Settings / Speed -->
                    <div class="replay-settings">
                        <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
                            <i class="fas fa-tachometer-alt" style="color:var(--text-muted); font-size: 0.8rem;"></i>
                            <input type="range" id="rb-speed" min="400" max="2400" step="200" value="1600" style="flex:1;">
                        </div>
                        <button class="sim-btn sim-btn-sound${this._musicEnabled() ? '' : ' sound-muted'}" id="rb-music" title="Background music"><i class="fas fa-music"></i></button>
                        <button class="sim-btn sim-btn-sound" id="rb-sound" title="Sound On"><i class="fas fa-volume-up"></i></button>
                    </div>
                </div>
            </div>
        `;

        this.p1Board = document.querySelector('#rb-p1-half .duel-board');
        this.p2Board = document.querySelector('#rb-p2-half .duel-board');
        this.p1TokenLayer = document.querySelector('#rb-p1-half .token-layer');
        this.p2TokenLayer = document.querySelector('#rb-p2-half .token-layer');

        this._populateLogList();
        this._wireControls();
        this._wireMobileToggle();
        this._wireZoneClicks();
        this._setupResizeObserver();
        this._syncMusic();
        this._prefetchCardData();
        this._updateZoneCounts();
        setTimeout(() => this._repositionAll(), 100);
    }

    _wireMobileToggle() {
        const outer = document.querySelector('.replay-board-outer');
        const btnP1 = document.getElementById('rb-toggle-p1');
        const btnP2 = document.getElementById('rb-toggle-p2');
        if (!outer || !btnP1 || !btnP2) return;
        const show = (showP2) => {
            outer.classList.toggle('showing-p2', showP2);
            btnP1.classList.toggle('active', !showP2);
            btnP2.classList.toggle('active', showP2);
            // The board that was hidden measured zero while it was display:none.
            this._repositionAll();
        };
        // Manual taps override the auto-follow until the active player changes again.
        btnP1.onclick = () => { this._mobileActivePlayer = 0; show(false); };
        btnP2.onclick = () => { this._mobileActivePlayer = 1; show(true); };
        this._showMobilePlayer = show;
    }

    _boardHTML(prefix) {
        return `
            <div class="duel-board">
                <div class="field-grid">
                    <div class="empty-corner"></div>
                    <div class="extra-monster-zones">
                        <div class="zone extra-monster-zone" id="rb-${prefix}-em-left" data-label="EM"></div>
                        <div class="zone extra-monster-zone" id="rb-${prefix}-em-right" data-label="EM"></div>
                    </div>
                    <div class="zone field-zone" id="rb-${prefix}-field" data-label="Field"></div>
                    <div class="main-monster-zones">
                        <div class="zone main-monster-zone" id="rb-${prefix}-m1" data-label="M1"></div>
                        <div class="zone main-monster-zone" id="rb-${prefix}-m2" data-label="M2"></div>
                        <div class="zone main-monster-zone" id="rb-${prefix}-m3" data-label="M3"></div>
                        <div class="zone main-monster-zone" id="rb-${prefix}-m4" data-label="M4"></div>
                        <div class="zone main-monster-zone" id="rb-${prefix}-m5" data-label="M5"></div>
                    </div>
                    <div class="zone banished-zone" id="rb-${prefix}-banish" data-label="Banished"></div>
                    <div class="zone gy-zone" id="rb-${prefix}-gy" data-label="GY"></div>
                    <div class="zone extra-deck-zone" id="rb-${prefix}-extra" data-label="Extra"></div>
                    <div class="spell-trap-zones">
                        <div class="zone spell-trap-zone" id="rb-${prefix}-s1" data-label="S1"><div class="pendulum-icon blue">&#9670;</div></div>
                        <div class="zone spell-trap-zone" id="rb-${prefix}-s2" data-label="S2"></div>
                        <div class="zone spell-trap-zone" id="rb-${prefix}-s3" data-label="S3"></div>
                        <div class="zone spell-trap-zone" id="rb-${prefix}-s4" data-label="S4"></div>
                        <div class="zone spell-trap-zone" id="rb-${prefix}-s5" data-label="S5"><div class="pendulum-icon red">&#9670;</div></div>
                    </div>
                    <div class="zone deck-zone" id="rb-${prefix}-deck" data-label="Deck"></div>
                </div>
                <div class="hand-area" id="rb-${prefix}-hand"></div>
                <div class="token-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div>
            </div>
        `;
    }

    _populateLogList() {
        const list = document.getElementById('rb-log-list');
        if (!list) return;

        // Pre-process moveLog to flag negated chain links
        this.moveLog.forEach((step, i) => {
            if (step.chainLink) {
                if (step.type === 'effect-negate' || step.type === 'effect-disabled') {
                    // Find the activation with the same chainLink going backwards
                    for (let j = i - 1; j >= 0; j--) {
                        if (this.moveLog[j].chainLink === step.chainLink && this.moveLog[j].type === 'effect-activate') {
                            this.moveLog[j]._isNegated = true;
                            break;
                        }
                    }
                }
            }
        });

        const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        let html = '';
        this.moveLog.forEach((step, i) => {
            const turnStr = step.turn ? `T${step.turn}` : '';
            
            // Determine icon
            let icon = '';
            if (step.type === 'effect-negate' || step.type === 'effect-disabled') {
                icon = '<i class="fas fa-ban" style="color: #ef4444;"></i>';
            } else if (step.type === 'lp-damage' || step.type === 'lp-cost') {
                icon = '<i class="fas fa-heart-broken" style="color: #ef4444;"></i>';
            } else if (step.type === 'lp-recover') {
                icon = '<i class="fas fa-heart" style="color: #22c55e;"></i>';
            } else if (step.type === 'lp-update') {
                icon = '<i class="fas fa-heartbeat" style="color: #38bdf8;"></i>';
            } else if (step.type === 'attack') {
                icon = '<i class="fas fa-khanda" style="color: #f97316;"></i>';
            } else if (step.type === 'set' || step.type === 'set-monster') {
                icon = '<i class="fas fa-moon" style="color: #7dd3fc;"></i>';
            } else if (step.type === 'return-to-hand') {
                icon = '<i class="fas fa-hand-paper" style="color: #67e8f9;"></i>';
            } else if (step.type === 'position-change') {
                icon = '<i class="fas fa-sync-alt" style="color: #a78bfa;"></i>';
            } else if (step.type === 'stat-change') {
                icon = '<i class="fas fa-chart-bar" style="color: #fbbf24;"></i>';
            } else if (step.type.includes('summon')) {
                icon = '<i class="fas fa-magic"></i>';
            } else if (step.type.includes('draw')) {
                icon = '<i class="fas fa-layer-group"></i>';
            } else if (step.type.includes('phase')) {
                icon = '<i class="fas fa-hourglass-half"></i>';
            } else if (step.type.includes('effect')) {
                icon = '<i class="fas fa-bolt"></i>';
            } else {
                icon = '<i class="fas fa-play"></i>';
            }

            // Styling for nested chain links
            let extraStyle = '';
            if (step.chainLink && step.chainLink > 1) {
                extraStyle = `margin-left: ${(step.chainLink - 1) * 1.5}rem; border-radius: 0.25rem;`;
            }

            // Styling for negated actions
            let textStyle = '';
            if (step._isNegated) {
                textStyle = 'text-decoration: line-through; opacity: 0.5;';
            } else if (step.type === 'effect-negate' || step.type === 'effect-disabled') {
                textStyle = 'color: #ef4444; font-weight: 600;';
            }

            html += `<li id="rb-log-item-${i}" class="log-item" style="display:none;${extraStyle}" onclick="if(currentReplayBrowser) { if(currentReplayBrowser.isPlaying) currentReplayBrowser.togglePlay(); currentReplayBrowser._rebuildTo(${i}); currentReplayBrowser.currentIndex=${i}; }">
                <span class="log-turn">${turnStr}</span>
                <span class="log-icon">${icon}</span>
                <span class="log-text" style="${textStyle}">${step.label || 'Action'}</span>
                ${step.effectText ? `<div class="log-effect-preview">${esc(step.effectText)}</div>` : ''}
            </li>`;
        });
        list.innerHTML = html;
    }

    _wireControls() {
        document.getElementById('rb-prev-turn').onclick = () => this._prevTurn();
        document.getElementById('rb-prev-step').onclick = () => this.prevStep();
        document.getElementById('rb-play').onclick    = () => this.togglePlay();
        document.getElementById('rb-next-step').onclick = () => this.nextStep();
        document.getElementById('rb-next-turn').onclick = () => this._nextTurn();
        document.getElementById('rb-speed').oninput = (e) => {
            this.speed = 2800 - parseInt(e.target.value); // fuller bar = faster (shorter delay)
            if (this.isPlaying) {
                clearInterval(this.playInterval);
                this.playInterval = setInterval(() => this.nextStep(), this.speed);
            }
        };
        document.getElementById('rb-sound').onclick = () => {
            if (typeof ComboSounds === 'undefined') return;
            const muted = ComboSounds.toggleMute();
            const btn = document.getElementById('rb-sound');
            btn.innerHTML = muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
            btn.classList.toggle('sound-muted', muted);
        };
        document.getElementById('rb-music').onclick = () => {
            const enabled = !this._musicEnabled();
            try { localStorage.setItem('rb-music', enabled ? 'on' : 'off'); } catch (e) {}
            document.getElementById('rb-music').classList.toggle('sound-muted', !enabled);
            this._syncMusic();
        };
    }

    // Background music preference — on by default, remembered per browser
    _musicEnabled() {
        try { return localStorage.getItem('rb-music') !== 'off'; } catch (e) { return true; }
    }

    // Music plays for as long as this browser is alive, unless the viewer switched it off
    _syncMusic() {
        if (typeof ComboMusic === 'undefined') return;
        if (!this._destroyed && this._musicEnabled()) ComboMusic.start();
        else ComboMusic.stop();
    }

    _setupResizeObserver() {
        if (!window.ResizeObserver) return;
        let t;
        this.resizeObserver = new ResizeObserver(() => {
            clearTimeout(t);
            t = setTimeout(() => this._repositionAll(), 150);   // re-measures
        });
        if (this.p1Board) this.resizeObserver.observe(this.p1Board);
        if (this.p2Board) this.resizeObserver.observe(this.p2Board);
    }

    _zoneElId(player, zoneName) {
        const p = player === 0 ? 'p1' : 'p2';
        const short = ZONE_MAP[zoneName];
        if (!short) return null;
        return `rb-${p}-${short}`;
    }

    _tokenLayer(player) {
        return player === 0 ? this.p1TokenLayer : this.p2TokenLayer;
    }

    _board(player) {
        return player === 0 ? this.p1Board : this.p2Board;
    }

    // Tokens are never in the public card database (their name is always the generic
    // "Token" string), so fetch their art directly by passcode instead of by name.
    _resolveImageUrl(name, isToken, code) {
        if (isToken && code) {
            return Promise.resolve(`https://images.ygoprodeck.com/images/cards/${code}.jpg`);
        }

        // The batched metadata already carries an art URL per passcode, including
        // one per alt art. Using it skips CardLoader.getCardImageUrl, which costs
        // a name lookup plus a throwaway <img> probe of the GCS mirror for every
        // single token — dozens of extra round trips over a full replay. It also
        // resolves the *right* art for an alt-art passcode, which a name-based
        // lookup cannot do.
        const meta = this._meta(code);
        if (meta && meta.ygoImageUrl) return Promise.resolve(meta.ygoImageUrl);

        if (RB_IMAGE_CACHE.has(code)) return Promise.resolve(RB_IMAGE_CACHE.get(code));

        if (name && typeof window.CardLoader !== 'undefined') {
            return window.CardLoader.getCardImageUrl(name).then(url => {
                if (url && code) RB_IMAGE_CACHE.set(code, url);
                return url;
            });
        }
        return Promise.resolve(null);
    }

    // Tag the token with its real card type. Every token used to be hardcoded as
    // ctype-monster, which made spells, traps and extra-deck cards impossible to
    // tell apart on the board. The lookup is async, so the token renders as a
    // monster first and corrects itself a moment later; results are cached by
    // passcode so a card only ever costs one lookup per session.
    _applyCardType(el, code) {
        if (!code) return;

        const apply = (ctype) => {
            el.classList.remove('ctype-monster', 'ctype-spell', 'ctype-trap', 'ctype-extra');
            el.classList.add(`ctype-${ctype}`);
        };

        if (RB_TYPE_CACHE.has(code)) {
            apply(RB_TYPE_CACHE.get(code));
            return;
        }
        // The batched prefetch usually has this already.
        const meta = this._meta(code);
        if (meta && meta.type) {
            const ctype = rbCardTypeClass(meta.type);
            RB_TYPE_CACHE.set(code, ctype);
            apply(ctype);
            return;
        }
        if (typeof window.CardLoader === 'undefined' || !window.CardLoader.fetchCardDataById) return;

        window.CardLoader.fetchCardDataById(code).then(data => {
            if (!data) return;
            const ctype = rbCardTypeClass(data.type);
            RB_TYPE_CACHE.set(code, ctype);
            // The token may have been torn down by a scrub while this was in flight.
            if (el.isConnected) apply(ctype);
        }).catch(() => {});
    }

    /* ------------------------------------------------------------------
       ATK/DEF readout — the current values, not the printed ones
       ------------------------------------------------------------------ */

    // Only face-up monsters actually on the field have meaningful stats.
    _showsStats(t) {
        if (!t.zone || t.faceDown) return false;
        // Xyz materials sit in the host's zone but are not monsters on the field —
        // showing their ATK/DEF next to the host's is just noise.
        if (t.overlayOf) return false;
        if (!/-(m[1-5]|em-(left|right))$/.test(t.zone)) return false;
        const meta = this._meta(t.code);
        return !!(meta && /Monster/i.test(meta.type || ''));
    }

    // stat-change labels carry the resulting value ("ATK 1800 → 2300 (+500)"),
    // so read the new number straight off rather than accumulating deltas —
    // accumulating drifts as soon as one step is missed or replayed twice.
    _trackStatChange(action, label) {
        const t = this.tokens.get(action.id);
        if (!t || !label) return;
        const re = /(ATK|DEF)\s+\d+\s*→\s*(\d+)/g;
        let m;
        while ((m = re.exec(label)) !== null) {
            if (m[1] === 'ATK') t.atk = parseInt(m[2], 10);
            else t.def = parseInt(m[2], 10);
        }
        this._updateStats(t);
    }

    // Every overlay a token can carry. Call sites only ever need this one.
    _updateStats(t) {
        this._renderStatBar(t);
        this._renderLinkArrows(t);
        this._renderPendulumScale(t);
    }

    // Link arrows belong to the card, so they live inside the token and rotate
    // with it — on P2's mirrored half they correctly point the other way.
    _renderLinkArrows(t) {
        const meta = this._meta(t.code);
        const markers = meta && meta.linkmarkers;
        const onField = t.zone && /-(m[1-5]|em-(left|right))$/.test(t.zone);

        if (!markers || !markers.length || !onField || t.faceDown) {
            if (t.linkEl) { t.linkEl.remove(); t.linkEl = null; }
            return;
        }
        if (t.linkEl) return;   // arrows never change once the card is on the field

        t.linkEl = document.createElement('span');
        t.linkEl.className = 'rb-links';
        t.linkEl.innerHTML = markers
            .map(d => `<i data-d="${String(d).replace(/"/g, '')}"></i>`)
            .join('');
        t.el.appendChild(t.linkEl);
    }

    // A pendulum card in a P zone is covering the zone's scale diamond, so the
    // scale has to be shown on the card itself to be visible at all.
    _renderPendulumScale(t) {
        const meta = this._meta(t.code);
        const inPendulumZone = t.zone && /-(s1|s5)$/.test(t.zone);
        const scale = meta && meta.scale;

        if (scale == null || !inPendulumZone || t.faceDown) {
            if (t.scaleEl) { t.scaleEl.remove(); t.scaleEl = null; }
            return;
        }
        if (!t.scaleEl) {
            t.scaleEl = document.createElement('span');
            t.scaleEl.className = 'rb-scale';
            t.el.appendChild(t.scaleEl);
        }
        t.scaleEl.textContent = scale;
    }

    _renderStatBar(t) {
        if (!this._showsStats(t)) {
            if (t.statEl) { t.statEl.remove(); t.statEl = null; }
            return;
        }

        const meta = this._meta(t.code) || {};
        const atk = t.atk != null ? t.atk : meta.atk;
        // Link monsters have no DEF at all; everything else falls back to printed.
        const isLink = /Link/i.test(meta.type || '');
        const def = isLink ? null : (t.def != null ? t.def : meta.def);

        if (atk == null && def == null) return;

        if (!t.statEl) {
            t.statEl = document.createElement('span');
            t.statEl.className = 'rb-stats';
            t.el.appendChild(t.statEl);
        }

        const buffed = (v, base) => base != null && v != null && v !== base;
        const cls = (v, base) => !buffed(v, base) ? '' : (v > base ? ' up' : ' down');

        t.statEl.innerHTML = isLink
            ? `<b class="${cls(atk, meta.atk).trim()}">${atk ?? '?'}</b><i>LINK-${meta.linkval ?? '?'}</i>`
            : `<b class="${cls(atk, meta.atk).trim()}">${atk ?? '?'}</b>`
              + `<b class="${cls(def, meta.def).trim()}">${def ?? '?'}</b>`;
    }

    // Called when the batched metadata lands — tokens created before it arrived
    // have no stats rendered yet.
    _refreshAllStats() {
        this.tokens.forEach(t => {
            this._applyCardType(t.el, t.code);
            this._updateStats(t);
        });
        // Card names in an open pile viewer resolve from the same metadata.
        this._updateZoneCounts();
    }

    /* ------------------------------------------------------------------
       Stack zone counts + contents viewer
       ------------------------------------------------------------------ */

    _deckList(player, which) {
        const d = this.decks && this.decks[player];
        return (d && d[which]) || null;
    }

    // Cards that started in the deck (or extra) and are currently somewhere else.
    // Tokens are only created once a card moves, so this is what we can actually
    // account for; the remainder is still in the pile.
    _departed(player, origin, zoneElId) {
        const out = [];
        this.tokens.forEach(t => {
            if (t.player === player && t.origin === origin && t.zone !== zoneElId) out.push(t.code);
        });
        return out;
    }

    _zoneContents(player, short) {
        const zoneElId = `rb-${player === 0 ? 'p1' : 'p2'}-${short}`;

        if (short === 'gy' || short === 'banish') {
            const out = [];
            this.tokens.forEach(t => {
                // Materials sit on top of their host, not in the pile.
                if (t.player === player && t.zone === zoneElId && !t.overlayOf) {
                    // A token drawn from the deck is created before its name is
                    // known, so fall back to the metadata rather than showing a
                    // bare passcode.
                    out.push({ code: t.code, name: t.name || this._nameForCode(t.code),
                               faceDown: t.faceDown });
                }
            });
            return out;
        }

        // Deck / extra deck: whatever the decklist had, minus what has left.
        const which = short === 'deck' ? 'main' : 'extra';
        const list = this._deckList(player, which);
        if (!list) return null;

        const remaining = [...list];
        for (const code of this._departed(player, which === 'main' ? 'deck' : 'extra', zoneElId)) {
            const at = remaining.indexOf(code);
            if (at !== -1) remaining.splice(at, 1);
        }
        return remaining.map(code => ({ code, name: this._nameForCode(code), faceDown: false }));
    }

    _nameForCode(code) {
        const meta = this._meta(code);
        if (meta && meta.name) return meta.name;
        for (const t of this.tokens.values()) {
            if (t.code === code && t.name) return t.name;
        }
        return '';
    }

    _updateZoneCounts() {
        [0, 1].forEach(player => {
            const p = player === 0 ? 'p1' : 'p2';
            ['gy', 'banish', 'deck', 'extra'].forEach(short => {
                const zone = document.getElementById(`rb-${p}-${short}`);
                if (!zone) return;

                const contents = this._zoneContents(player, short);
                if (contents === null) {
                    // No decklist supplied — better to show nothing than a wrong number.
                    zone.removeAttribute('data-count');
                    zone.classList.remove('rb-stacked', 'rb-browsable');
                    return;
                }

                const n = contents.length;
                if (n > 0) zone.setAttribute('data-count', n);
                else zone.removeAttribute('data-count');
                zone.classList.toggle('rb-stacked', n > 0);
                zone.classList.toggle('rb-browsable', n > 0);
            });
        });

        if (this._openZoneView) this._renderZoneView(this._openZoneView.player, this._openZoneView.short);
    }

    _wireZoneClicks() {
        [0, 1].forEach(player => {
            const p = player === 0 ? 'p1' : 'p2';
            ['gy', 'banish', 'deck', 'extra'].forEach(short => {
                const zone = document.getElementById(`rb-${p}-${short}`);
                if (!zone) return;
                zone.addEventListener('click', (e) => {
                    // Clicks that land on a card token are the token's business.
                    if (e.target.closest('.card-token')) return;
                    this._toggleZoneView(player, short);
                });
            });
        });

        const closeBtn = document.getElementById('rb-zoneview-close');
        if (closeBtn) closeBtn.onclick = () => this._closeZoneView();
    }

    _toggleZoneView(player, short) {
        const open = this._openZoneView;
        if (open && open.player === player && open.short === short) {
            this._closeZoneView();
            return;
        }
        this._openZoneView = { player, short };
        this._renderZoneView(player, short);
    }

    _closeZoneView() {
        this._openZoneView = null;
        const panel = document.getElementById('rb-zoneview');
        if (panel) panel.classList.remove('open');
    }

    _renderZoneView(player, short) {
        const panel = document.getElementById('rb-zoneview');
        const titleEl = document.getElementById('rb-zoneview-title');
        const listEl = document.getElementById('rb-zoneview-list');
        if (!panel || !titleEl || !listEl) return;

        const contents = this._zoneContents(player, short);
        if (contents === null) { this._closeZoneView(); return; }

        const LABELS = { gy: 'Graveyard', banish: 'Banished', deck: 'Deck', extra: 'Extra Deck' };
        titleEl.textContent = `${this.playerNames[player]} · ${LABELS[short]} (${contents.length})`;

        if (!contents.length) {
            listEl.innerHTML = '<li class="rb-zoneview-empty">Empty</li>';
        } else {
            // Deck order is hidden information — showing it sorted avoids implying
            // the viewer knows what the next draw is.
            const rows = short === 'deck' || short === 'extra'
                ? [...contents].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                : [...contents].reverse();   // GY/banish: most recent on top

            listEl.innerHTML = rows.map(c => `
                <li class="rb-zoneview-item" data-name="${(c.name || '').replace(/"/g, '&quot;')}">
                    <img src="https://images.ygoprodeck.com/images/cards_small/${c.code}.jpg" alt="" loading="lazy">
                    <span>${c.name || `#${c.code}`}</span>
                </li>`).join('');

            listEl.querySelectorAll('.rb-zoneview-item').forEach(li => {
                li.addEventListener('click', (e) => {
                    const n = li.getAttribute('data-name');
                    if (n && typeof window.CardLoader !== 'undefined') window.CardLoader.showPopup(e, n);
                });
            });
        }

        panel.classList.add('open');
    }

    // Face-down <-> face-up used to be a hard background-image swap. Turning the
    // card edge-on and changing the art at the halfway point reads as an actual
    // flip. Runs through --tk-fx so the card's orientation is preserved.
    // Art loads are async. A card can be turned face-DOWN between the request and
    // its resolution — most easily by scrubbing, where a draw and a later Set run
    // microseconds apart — and the late write would then reveal a face-down card.
    // Every async art application goes through here so that cannot happen.
    // Clicking a card that is sitting in a pile opens the pile rather than that
    // one card: the top card covers its zone almost all the time, so routing the
    // click to the card left the graveyard and banish piles impossible to browse.
    // The pile list is itself clickable, so the single card is still one click away.
    _onTokenClick(e, id, name) {
        e.stopPropagation();
        const t = this.tokens.get(id);
        const m = t && t.zone && t.zone.match(/^rb-p([12])-(gy|banish|deck|extra)$/);
        if (m) {
            this._toggleZoneView(Number(m[1]) - 1, m[2]);
            return;
        }
        if (name && typeof window.CardLoader !== 'undefined') {
            window.CardLoader.showPopup(e, name);
        }
    }

    _applyArt(id, url) {
        const t = this.tokens.get(id);
        if (!t || !url || t.faceDown) return false;
        t.el.style.backgroundImage = `url('${url}')`;
        return true;
    }

    _flip(t, applyArt, silent = this._silent) {
        if (silent || t._flipping) { applyArt(); return; }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { applyArt(); return; }

        const el = t.el;
        t._flipping = true;
        el.style.transition = '--tk-fx 0.13s ease-in';
        el.style.setProperty('--tk-fx', 'perspective(600px) rotateY(90deg)');

        setTimeout(() => {
            applyArt();                                   // swapped while edge-on
            el.style.transition = '--tk-fx 0.13s ease-out';
            el.style.removeProperty('--tk-fx');
            setTimeout(() => {
                el.style.transition = TOKEN_TRANSITION;   // hand back zone travel
                t._flipping = false;
            }, 140);
        }, 130);
    }

    _ensureToken(action) {
        const { id, code, name, player, from, isToken } = action;

        // If token already exists, check if the card identity changed
        if (this.tokens.has(id)) {
            const t = this.tokens.get(id);
            const isSetAction = action._stepType === 'set' || action._stepType === 'set-monster';
            if (t.faceDown && !isSetAction) {
                // Card was face-down and is now being revealed — load the real image
                t.faceDown = false;
                t.el._faceDown = false;
                t.el.classList.remove('card-facedown-defense');
                const wasSilent = this._silent;
                this._resolveImageUrl(name, t.isToken, t.code).then(url => {
                    if (url) this._flip(t, () => this._applyArt(id, url), wasSilent);
                });
                this._updateStats(t);   // face-down cards show no stats
            } else if (!t.faceDown && isSetAction) {
                // Card is being set face-down — revert to card back
                t.faceDown = true;
                t.el._faceDown = true;
                this._flip(t, () => {
                    t.el.style.backgroundImage = "url('https://images.ygoprodeck.com/images/cards/back_high.jpg')";
                });
                if (action._stepType === 'set-monster') t.el.classList.add('card-facedown-defense');
                this._updateStats(t);   // hides the readout while it's face-down
            }
            if (code && t.code !== code) {
                // Backend reused this ID for a different card.
                // Remove any hand ghost that was separately tracking the new card code —
                // it was drawn/created when the card first appeared but never moved out
                // because the backend used a different slot for the activation/summon.
                for (const [otherId, otherT] of this.tokens) {
                    if (otherId !== id && otherT.code === code && otherT.player === player
                            && otherT.zone && otherT.zone.endsWith('-hand')) {
                        otherT.el.remove();
                        this.tokens.delete(otherId);
                        break;
                    }
                }
                t.code = code;
                t.isToken = !!isToken;
                t.name = name;
                // Different card in this slot — any tracked buffs belonged to the old one.
                t.atk = null;
                t.def = null;
                this._applyCardType(t.el, code);
                this._updateStats(t);
                // Update the card image
                this._resolveImageUrl(name, t.isToken, t.code).then(url => this._applyArt(id, url));
                // Update click handler
                t.el.onclick = (e) => this._onTokenClick(e, id, name);
            }
            return;
        }

        // Fallback: the backend sometimes assigns a new ID to the same physical card
        // when it transitions zones (e.g. hand → spell zone on activation). Look for
        // an existing token with the same card code at the same from-zone and re-register
        // it under the new ID instead of creating a duplicate.
        if (code > 0) {
            const fromElId = this._zoneElId(player, from);
            if (fromElId) {
                for (const [existingId, t] of this.tokens) {
                    if (t.code === code && t.zone === fromElId && t.player === player) {
                        this.tokens.delete(existingId);
                        this.tokens.set(id, t);
                        t.el.setAttribute('data-rb-id', id);
                        t.isToken = !!isToken;
                        this._applyCardType(t.el, t.code);
                        this._resolveImageUrl(name, t.isToken, t.code).then(url => this._applyArt(id, url));
                        return;
                    }
                }
            }
        }

        const zoneElId = this._zoneElId(player, from);
        if (!zoneElId) return;

        const layer = this._tokenLayer(player);
        if (!layer) return;

        const el = document.createElement('div');
        el.className = 'card-token ctype-monster';   // corrected by _applyCardType below
        this._applyCardType(el, code);
        el.setAttribute('data-zone', zoneElId);
        el.setAttribute('data-rb-id', id);
        el.style.transition = 'none';
        el.style.backgroundImage = "url('https://images.ygoprodeck.com/images/cards/back_high.jpg')";
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';

        const isFaceDown = action._stepType === 'set' || action._stepType === 'set-monster';
        el._faceDown = isFaceDown;
        if (action._stepType === 'set-monster') el.classList.add('card-facedown-defense');

        layer.appendChild(el);
        this.tokens.set(id, {
            el, player, zone: zoneElId,
            code: code || 0,
            name: name || '',
            isToken: !!isToken,
            faceDown: isFaceDown,
            // The zone this card first appeared from. Used to work out how much
            // of the deck/extra deck is still unaccounted for — tokens only get
            // created once a card moves, so the deck itself is never populated.
            origin: from || null,
            atk: null,
            def: null,
        });

        this._positionToken(el, player, zoneElId);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transition = TOKEN_TRANSITION;
        }));

        if (!isFaceDown) {
            this._resolveImageUrl(name, isToken, code).then(url => {
                if (this._applyArt(id, url) && el._hovered && typeof window.CardLoader !== 'undefined') {
                    window.CardLoader.showCardPreview(url);
                }
            });
        }

        el.addEventListener('click', (e) => this._onTokenClick(e, id, name));

        el.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (name && typeof window.CardLoader !== 'undefined') {
                window.CardLoader.showLargeImageByName(name, e);
            }
        });

        el.addEventListener('mouseenter', () => {
            el._hovered = true;
            if (el._faceDown || typeof window.CardLoader === 'undefined') return;
            const bgUrl = el.style.backgroundImage;
            const m = bgUrl.match(/url\(['"]?([^'"]+)['"]?\)/);
            const url = m ? m[1] : null;
            if (url && !url.includes('back_high')) {
                window.CardLoader.showCardPreview(url);
            }
        });

        el.addEventListener('mouseleave', () => {
            el._hovered = false;
            if (typeof window.CardLoader !== 'undefined') {
                window.CardLoader.hideCardPreview();
            }
        });
    }

    _applyAction(action) {
        const { id, player, to } = action;
        this._ensureToken(action);

        const t = this.tokens.get(id);
        if (!t) return;

        // Xyz materials attach to their host monster — they are NOT in the
        // graveyard, which is where the old 'overlay' → 'gy' zone mapping put
        // them, making an Xyz summon look like it milled its own materials.
        if (to === 'overlay') {
            this._attachMaterial(t, action._overlayHost);
            return;
        }
        if (t.overlayOf) this._detachMaterial(t);

        const toElId = this._zoneElId(player, to);
        if (!toElId) {
            // Genuinely unknown zone — hide the token rather than leaving a ghost
            t.el.style.opacity = '0';
            t.el.style.pointerEvents = 'none';
            return;
        }

        t.zone = toElId;
        t.el.setAttribute('data-zone', toElId);
        // Orientation is entirely CSS's job (--tk-rot), so all this has to do is
        // drop any leftover transient motion from an interrupted attack lunge.
        t.el.style.removeProperty('--tk-fx');

        // Cards leaving the field return to vertical — strip any defense rotation classes.
        const isOffField = toElId.includes('-gy') || toElId.includes('-banish') ||
                           toElId.includes('-deck') || toElId.includes('-hand');
        if (isOffField) {
            t.el.classList.remove('card-defense-pos');
            t.el.classList.remove('card-facedown-defense');
        }

        // Apply defense position class if action carries position info.
        // 'def' = face-up defense, 'set' = face-down defense (already handled by card-facedown-defense).
        // Removing the class for 'atk' covers position-change DEF→ATK.
        if (action.position === 'def') {
            t.el.classList.add('card-defense-pos');
            t.el.classList.remove('card-facedown-defense');
        } else if (action.position === 'atk') {
            t.el.classList.remove('card-defense-pos');
            t.el.classList.remove('card-facedown-defense');
        }
        // 'set' and undefined leave rotation to the facedown/CSS rules already in place

        this._positionToken(t.el, player, toElId);
        this._updateStats(t);

        // Materials ride along with their host. If the host just left the field,
        // they go to the graveyard with it.
        if (this._materialsOf(id).length) {
            if (isOffField) this._sendMaterialsToGY(id);
            else this._reflowMaterials(id);
        }

        // Remembered so a later step that attaches materials without naming the
        // host in the same step still has something to attach them to.
        if (/-(m[1-5]|em-(left|right))$/.test(toElId)) this._lastSummonedId = id;
    }

    /* ------------------------------------------------------------------
       Xyz materials — tokens parked behind their host with a ×N badge
       ------------------------------------------------------------------ */

    _materialsOf(hostId) {
        const out = [];
        this.tokens.forEach(t => { if (t.overlayOf === hostId) out.push(t); });
        return out;
    }

    _attachMaterial(t, hostId) {
        const resolved = hostId ?? this._lastSummonedId;
        const host = resolved ? this.tokens.get(resolved) : null;
        if (!host) {
            // Nothing to attach to — hide it rather than dropping it in the GY.
            t.el.style.opacity = '0';
            t.el.style.pointerEvents = 'none';
            return;
        }
        t.overlayOf = resolved;
        t.el.classList.add('rb-material');
        this._reflowMaterials(resolved);
    }

    _detachMaterial(t) {
        const hostId = t.overlayOf;
        t.overlayOf = null;
        t.el.classList.remove('rb-material');
        delete t.el._overlayIndex;
        t.el._keepZIndex = false;
        if (hostId) this._reflowMaterials(hostId);
    }

    _reflowMaterials(hostId) {
        const host = this.tokens.get(hostId);
        if (!host) return;
        const mats = this._materialsOf(hostId);

        mats.forEach((t, i) => {
            t.el._overlayIndex = i;
            t.zone = host.zone;
            t.el.setAttribute('data-zone', host.zone);
            this._positionToken(t.el, t.player, host.zone);
            this._updateStats(t);   // drops the stat bar now that it's a material
        });

        if (mats.length) host.el.setAttribute('data-materials', mats.length);
        else host.el.removeAttribute('data-materials');
    }

    _sendMaterialsToGY(hostId) {
        this._materialsOf(hostId).forEach(t => {
            this._detachMaterial(t);
            const gy = `rb-${t.player === 0 ? 'p1' : 'p2'}-gy`;
            t.zone = gy;
            t.el.setAttribute('data-zone', gy);
            this._positionToken(t.el, t.player, gy);
            this._updateStats(t);
        });
    }

    _positionToken(el, player, zoneElId) {
        const g = this._zoneGeom(player, zoneElId);
        if (!g) return;

        const w = g.cw;
        const h = g.ch;
        el.style.width  = `${w}px`;
        el.style.height = `${h}px`;

        if (zoneElId.endsWith('-hand')) {
            const layer = this._tokenLayer(player);
            const handTokens = layer ? Array.from(layer.children).filter(c => c.getAttribute('data-zone') === zoneElId) : [];
            const idx = handTokens.indexOf(el);
            const total = handTokens.length;
            const gap = 5;

            // Lay the hand out side by side while it fits, then start overlapping
            // the cards instead of letting them run off the edge of the board —
            // a 10-card hand at mobile widths is far wider than the viewport.
            const available = Math.max(0, g.width - 16);
            let step = w + gap;
            if (total > 1 && (total - 1) * step + w > available) {
                // Leave room for the last card's full width, but never squeeze
                // the sliver of each card below the point where it's identifiable.
                step = Math.max((available - w) / (total - 1), Math.max(14, w * 0.22));
            }

            const spread = total > 0 ? (total - 1) * step + w : 0;
            const startX = (g.width - spread) / 2;
            el.style.left = (g.left + startX + idx * step) + 'px';
            el.style.top  = (g.top + (g.height - h) / 2) + 'px';
            // Overlapping cards need a defined stacking order or they interleave
            // unpredictably; later cards sit on top of earlier ones.
            el.style.zIndex = String(10 + idx);
        } else {
            const isStack = zoneElId.includes('-gy') || zoneElId.includes('-deck') || zoneElId.includes('-banish');
            // Roll the pile's scatter ONCE per zone and remember it. Rolling it on
            // every call made every card in the graveyard visibly twitch on each
            // step, since repositioning runs after every step and every resize.
            if (isStack && el._jitterZone !== zoneElId) {
                el._jitterZone = zoneElId;
                el._jitterX = Math.random() * 4 - 2;
                el._jitterY = Math.random() * 4 - 2;
            }
            let jX = isStack ? el._jitterX : 0;
            let jY = isStack ? el._jitterY : 0;

            // Xyz materials fan out from under their host so the count is visible
            // without hiding the monster that's actually on the field.
            const ov = el._overlayIndex;
            if (ov != null) {
                const peek = Math.min(ov + 1, 4) * 5;
                jX += peek;
                jY += peek;
                el.style.zIndex = String(Math.max(1, 9 - ov));
                el._keepZIndex = true;
            }

            el.style.left = (g.left + (g.width  - w) / 2 + jX) + 'px';
            el.style.top  = (g.top  + (g.height - h) / 2 + jY) + 'px';
            if (!el._keepZIndex) el.style.zIndex = '';
        }
    }

    _repositionAll() {
        this._invalidateGeometry();
        this._measureGeometry();
        this.tokens.forEach(({ el, player, zone }) => this._positionToken(el, player, zone));
    }

    // After a step only the zones it touched need re-laying out — the hand has to
    // re-fan when a card leaves it, and piles restack. Everything else is already
    // where it belongs, so don't walk the whole board.
    _repositionZones(zoneIds) {
        if (!zoneIds || !zoneIds.size) return;
        this.tokens.forEach(({ el, player, zone }) => {
            if (zoneIds.has(zone)) this._positionToken(el, player, zone);
        });
    }

    // The zones a step disturbed, as element ids.
    _zonesTouchedBy(step) {
        const out = new Set();
        (step?.actions || []).forEach(a => {
            const from = this._zoneElId(a.player, a.from);
            const to = this._zoneElId(a.player, a.to);
            if (from) out.add(from);
            if (to) out.add(to);
        });
        return out;
    }

    _applySummonAnimation(action) {
        const t = this.tokens.get(action.id);
        if (!t) return;
        const animClass = {
            'synchro-summon':   'synchro-summoning',
            'xyz-summon':       'xyz-summoning',
            'fusion-summon':    'fusion-summoning',
            'link-summon':      'link-summoning',
            'contact-fusion':   'contact-fusion-summoning',
        }[action._stepType];
        if (animClass) {
            t.el.classList.add(animClass);
            setTimeout(() => t.el.classList.remove(animClass), 1350);
        }
    }

    _applyEffectAnimation(action, type, chainLink) {
        const t = this.tokens.get(action.id);
        if (!t) return;
        const animClass = type === 'effect-activate' ? 'effect-activating' : 'effect-negating';

        // Bring card to top when activating from a stack zone (GY/banish/deck)
        const isStack = t.zone && (t.zone.includes('-gy') || t.zone.includes('-banish') || t.zone.includes('-deck'));
        if (isStack) {
            t.el.style.zIndex = '60';
            t.el._keepZIndex = true;   // survive a _repositionAll mid-animation
        }

        t.el.classList.add(animClass);
        if (chainLink) t.el.setAttribute('data-cl', chainLink);

        setTimeout(() => {
            t.el.classList.remove(animClass);
            t.el.removeAttribute('data-cl');
            if (isStack) {
                t.el._keepZIndex = false;
                t.el.style.zIndex = '';
            }
        }, 1350);
    }

    _applyStatChangeAnimation(action, label) {
        const t = this.tokens.get(action.id);
        if (!t) return;

        t.el.classList.add('stat-change-glow');
        setTimeout(() => t.el.classList.remove('stat-change-glow'), 1300);

        const parts = [];
        const re = /(ATK|DEF) \d+ → \d+ \(([+-]\d+)\)/g;
        let m;
        while ((m = re.exec(label)) !== null) {
            const delta = parseInt(m[2]);
            const sign = delta >= 0 ? '+' : '';
            const color = delta >= 0 ? '#22c55e' : '#ef4444';
            parts.push(`<span style="color:${color}">${m[1]} ${sign}${delta}</span>`);
        }
        if (parts.length === 0) return;

        const rect = t.el.getBoundingClientRect();
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-stat';
        floatEl.innerHTML = parts.join(' ');
        floatEl.style.left = `${rect.left + rect.width / 2}px`;
        floatEl.style.top = `${rect.top - 10}px`;
        document.body.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1500);
    }

    _updateLifePoints() {
        let p1LP = 8000;
        let p2LP = 8000;
        
        for (let i = 0; i <= this.currentIndex; i++) {
            const step = this.moveLog[i];
            if (!step) continue;
            if (step.type && step.type.startsWith('lp-')) {
                const amountMatch = step.label.match(/(\d+)\s*LP/i);
                const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;
                if (isNaN(amount)) continue; // Skip malformed labels
                if (step.type === 'lp-damage' || step.type === 'lp-cost') {
                    if (step.player === 0) p1LP = Math.max(0, p1LP - amount);
                    else p2LP = Math.max(0, p2LP - amount);
                } else if (step.type === 'lp-recover') {
                    if (step.player === 0) p1LP += amount;
                    else p2LP += amount;
                } else if (step.type === 'lp-update') {
                    if (amount > 0) { // Only apply if we got a real number
                        if (step.player === 0) p1LP = amount;
                        else p2LP = amount;
                    }
                }
            }
        }
        
        const p1El = document.getElementById('rb-p1-lp');
        const p2El = document.getElementById('rb-p2-lp');
        if (p1El) p1El.textContent = `${p1LP} LP`;
        if (p2El) p2El.textContent = `${p2LP} LP`;
    }

    _showFloatingText(player, text, type) {
        const stripId = player === 0 ? '.p1-strip' : '.p2-strip';
        const strip = document.querySelector(stripId);
        if (!strip) return;
        
        // Ensure strip is positioned relative for the floating text
        if (getComputedStyle(strip).position === 'static') {
            strip.style.position = 'relative';
        }

        const floatEl = document.createElement('div');
        floatEl.className = `floating-lp ${type}`;
        floatEl.textContent = text;
        
        strip.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1500);
    }

    // Lunge the attacker toward its target. The motion goes through --tk-fx so it
    // composes with the card's rotation instead of replacing it — writing
    // el.style.transform here would snap a P2 monster (or a defense-position one)
    // upright for the duration of the attack.
    _lunge(token, fx, holdMs) {
        token.el.style.transition = '--tk-fx 0.15s ease-in';
        token.el.style.setProperty('--tk-fx', fx);
        token.el.style.zIndex = '50';
        token.el._keepZIndex = true;   // survive a _repositionAll mid-lunge

        setTimeout(() => {
            token.el.style.transition = '--tk-fx 0.3s ease-out';
            token.el.style.removeProperty('--tk-fx');
            token.el._keepZIndex = false;
            token.el.style.zIndex = '';
            // Hand the token back its normal zone-travel transition once the
            // lunge has finished playing out, or it never animates a move again.
            setTimeout(() => { token.el.style.transition = TOKEN_TRANSITION; }, 300);
        }, holdMs);
    }

    _applyAttackAnimation(actions) {
        if (!actions || actions.length === 0) return;
        const attacker = this.tokens.get(actions[0].id);
        if (!attacker) return;

        if (actions.length === 1) {
            // Direct attack - bump forward towards opponent side
            const bumpDir = actions[0].player === 0 ? -30 : 30; // p1 attacks up (-), p2 attacks down (+)
            this._lunge(attacker, `translateY(${bumpDir}px) scale(1.15)`, 300);
        } else if (actions.length === 2) {
            // Attack on monster
            const defender = this.tokens.get(actions[1].id);
            if (!defender) return;

            // Calculate vector between attacker and defender
            const aRect = attacker.el.getBoundingClientRect();
            const dRect = defender.el.getBoundingClientRect();

            const dX = (dRect.left - aRect.left) * 0.4;
            const dY = (dRect.top - aRect.top) * 0.4;

            this._lunge(attacker, `translate(${dX}px, ${dY}px) scale(1.15)`, 150);

            setTimeout(() => {
                defender.el.classList.add('impact-shake');
                setTimeout(() => defender.el.classList.remove('impact-shake'), 400);
            }, 150);
        }
    }

    _applyStep(step, silent = false) {
        const { type, turn, phase, label, effectText, actions } = step;
        // _ensureToken sits several frames deep and needs to know not to play a
        // flip animation per card while the user is scrubbing the timeline.
        this._silent = silent;

        // Auto-follow the board of whichever player this step belongs to,
        // so the mobile single-board view doesn't need a manual tap to see
        // what's actually happening. Skipped once the user has manually
        // picked a side and this step doesn't say otherwise.
        const stepPlayer = step.player ?? actions?.[0]?.player;
        if ((stepPlayer === 0 || stepPlayer === 1) && stepPlayer !== this._mobileActivePlayer) {
            this._mobileActivePlayer = stepPlayer;
            if (this._showMobilePlayer) this._showMobilePlayer(stepPlayer === 1);
        }

        // Only turn-change steps say whose turn it is; other steps' player is
        // the card's controller, which can be the non-turn player.
        if (type === 'turn-change' && (step.player === 0 || step.player === 1)) {
            this._turnPlayer = step.player;
        }

        if (turn !== undefined) {
            this._updateTurnIndicator(turn, phase);

            if (typeof updateChartHighlight === 'function') {
                updateChartHighlight(turn, phase);
            }
        }

        if (!silent && label) this._log(label);
        if (!silent && type === 'effect-activate' && effectText) {
            const cardName = actions?.[0]?.name ?? '';
            this._showLastEffect(cardName, effectText);
        }

        // Update Life Points based on the timeline position
        this._updateLifePoints();
        
        if (!silent && type.startsWith('lp-')) {
            const amountMatch = label.match(/(\d+)\s*LP/i);
            const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;
            let floatText = '';
            if (type === 'lp-damage' || type === 'lp-cost') floatText = `-${amount}`;
            else if (type === 'lp-recover') floatText = `+${amount}`;
            else if (type === 'lp-update') floatText = `${amount}`;
            
            if (floatText) {
                this._showFloatingText(step.player, floatText, type);
            }
        }

        if (!silent && type === 'attack') {
            this._applyAttackAnimation(actions);
        }

        if (actions && actions.length) {
            if (type !== 'attack') {
                // Work out which card in this step the materials are attaching to
                // before applying anything, since the host may be listed after them.
                let ordered = actions;
                if (actions.some(a => a.to === 'overlay')) {
                    const host = actions.find(a => /^(monster-zone-|extra-monster-zone-)/.test(a.to || ''));
                    actions.forEach(a => {
                        if (a.to === 'overlay') a._overlayHost = host ? host.id : null;
                    });
                    // The host has to land on the board before anything attaches to it.
                    ordered = [...actions].sort((a, b) =>
                        (a.to === 'overlay' ? 1 : 0) - (b.to === 'overlay' ? 1 : 0));
                }

                ordered.forEach(a => {
                    a._stepType = type;
                    this._applyAction(a);
                    // Stat tracking has to happen on silent replays too, or a
                    // card's ATK reverts to printed whenever the user scrubs.
                    if (type === 'stat-change') this._trackStatChange(a, step.label);
                    if (!silent) {
                        if (['synchro-summon', 'xyz-summon', 'fusion-summon', 'link-summon', 'contact-fusion'].includes(type)) {
                            this._applySummonAnimation(a);
                        } else if (['effect-activate', 'effect-negate', 'effect-disabled'].includes(type)) {
                            // If this activation was negated, show the negation animation instead
                            const effectType = (type === 'effect-activate' && step._isNegated) ? 'effect-negate' : type;
                            this._applyEffectAnimation(a, effectType, step.chainLink);
                        } else if (type === 'stat-change') {
                            this._applyStatChangeAnimation(a, step.label);
                        }
                    }
                });
            }
        }

        if (!silent && typeof ComboSounds !== 'undefined') {
            // If this is an effect-activate that was negated, override the sound to the negate sound
            const soundType = (type === 'effect-activate' && step._isNegated) ? 'effect-negate' : type;
            const soundEvent = REPLAY_SOUND_MAP[soundType];
            if (soundEvent) ComboSounds.play(soundEvent);
        }
    }

    _updateTurnIndicator(turn, phase) {
        const started = turn > 0;
        const player = started ? this._turnPlayer : null;
        const current = started ? REPLAY_PHASES.findIndex(p => p.id === phase) : -1;

        // Player colors on the strips, toggle buttons and phase bar key off this attribute.
        const dashboard = document.querySelector('.replay-dashboard');
        if (dashboard) {
            if (player === 0 || player === 1) dashboard.dataset.turnPlayer = player;
            else delete dashboard.dataset.turnPlayer;
        }

        const owner = document.getElementById('rb-turn-owner');
        if (owner) {
            owner.textContent = !started ? 'Pre-game'
                : (player === 0 || player === 1) ? `Turn ${turn} · ${this.playerNames[player]}`
                : `Turn ${turn}`;
        }

        document.querySelectorAll('#rb-phase-track .rb-phase').forEach((el, i) => {
            el.classList.toggle('done', i < current);
            el.classList.toggle('current', i === current);
        });

        const turnEl = document.getElementById('rb-turn-label');
        if (turnEl) {
            turnEl.textContent = started
                ? `Turn ${turn} · ${REPLAY_PHASES[current]?.short ?? phase ?? ''}`
                : 'Turn —';
        }
    }

    _log(text) {
        const el = document.getElementById('rb-log');
        if (el) el.innerHTML = `<span class="rb-log-label">${text}</span>`;
    }

    _showLastEffect(cardName, effectText) {
        this._lastEffectName = cardName;
        this._lastEffectDesc = effectText;
        const panel = document.getElementById('rb-last-effect');
        const nameEl = document.getElementById('rb-last-effect-name');
        const textEl = document.getElementById('rb-last-effect-text');
        if (!panel || !nameEl || !textEl) return;
        const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        nameEl.textContent = cardName;
        textEl.innerHTML = esc(effectText);
        panel.style.display = '';
    }

    _clearLastEffect() {
        this._lastEffectName = null;
        this._lastEffectDesc = null;
        const panel = document.getElementById('rb-last-effect');
        if (panel) panel.style.display = 'none';
    }

    _updateCounter() {
        const el = document.getElementById('rb-step-counter');
        if (el) el.textContent = `${this.currentIndex + 1} / ${this.moveLog.length}`;

        this._updateZoneCounts();
        
        // Highlight active log item and hide future items
        const items = document.querySelectorAll('#rb-log-list .log-item');
        items.forEach((item, index) => {
            item.classList.remove('active');
            if (index > this.currentIndex) {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        });
        
        if (this.currentIndex >= 0 && this.currentIndex < this.moveLog.length) {
            const activeItem = document.getElementById(`rb-log-item-${this.currentIndex}`);
            if (activeItem) {
                activeItem.classList.add('active');
                // Scroll the sidebar list if needed without scrolling the entire page
                const container = activeItem.closest('.replay-log-container');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const activeRect = activeItem.getBoundingClientRect();
                    const relativeTop = activeRect.top - containerRect.top;
                    
                    if (relativeTop < 0) {
                        container.scrollBy({ top: relativeTop, behavior: 'smooth' });
                    } else if (relativeTop + activeRect.height > containerRect.height) {
                        container.scrollBy({ top: relativeTop + activeRect.height - containerRect.height, behavior: 'smooth' });
                    }
                }
            }
        }
    }

    nextStep() {
        if (this.currentIndex >= this.moveLog.length - 1) {
            this._stopPlay();
            return;
        }
        this.currentIndex++;
        const step = this.moveLog[this.currentIndex];
        this._applyStep(step);
        this._updateCounter();
        setTimeout(() => this._repositionZones(this._zonesTouchedBy(step)), 30);
    }

    prevStep() {
        if (this.currentIndex < 0) return;
        this.currentIndex--;
        this._rebuildTo(this.currentIndex);
    }

    _rebuildTo(targetIndex) {
        this.tokens.forEach(({ el }) => el.remove());
        this.tokens.clear();
        ['p1', 'p2'].forEach(p => {
            const lp = document.getElementById(`rb-${p}-lp`);
            if (lp) lp.textContent = '8000 LP';
        });
        this._turnPlayer = null;
        this._lastSummonedId = null;
        this._updateTurnIndicator(0);

        for (let i = 0; i <= targetIndex; i++) {
            this._applyStep(this.moveLog[i], true);
        }
        this._updateCounter();
        setTimeout(() => this._repositionAll(), 30);
        if (targetIndex >= 0) this._log(this.moveLog[targetIndex].label || '');

        // Restore last-effect panel to match state at targetIndex
        let foundEffect = false;
        for (let i = targetIndex; i >= 0; i--) {
            const s = this.moveLog[i];
            if (s.type === 'effect-activate' && s.effectText) {
                this._showLastEffect(s.actions?.[0]?.name ?? '', s.effectText);
                foundEffect = true;
                break;
            }
        }
        if (!foundEffect) this._clearLastEffect();
    }

    _nextTurn() {
        let i = this.currentIndex + 1;
        while (i < this.moveLog.length && this.moveLog[i].type !== 'turn-change') i++;
        if (i >= this.moveLog.length) i = this.moveLog.length - 1;
        this._rebuildTo(i);
        this.currentIndex = i;
    }

    _prevTurn() {
        let i = this.currentIndex - 1;
        while (i >= 0 && this.moveLog[i].type !== 'turn-change') i--;
        if (i < 0) i = -1;
        this._rebuildTo(i);
        this.currentIndex = i;
    }

    togglePlay() {
        if (this.isPlaying) {
            this._stopPlay();
        } else {
            this.isPlaying = true;
            const btn = document.getElementById('rb-play');
            if (btn) { btn.innerHTML = '<i class="fas fa-pause"></i> Pause'; btn.classList.add('paused'); }
            this.playInterval = setInterval(() => this.nextStep(), this.speed);
        }
    }

    _stopPlay() {
        clearInterval(this.playInterval);
        this.playInterval = null;
        this.isPlaying = false;
        const btn = document.getElementById('rb-play');
        if (btn) { btn.innerHTML = '<i class="fas fa-play"></i> Play'; btn.classList.remove('paused'); }
    }

    destroy() {
        this._destroyed = true;
        this._syncMusic();
        this._stopPlay();
        this.exitFullscreen();
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
        }
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.tokens.forEach(({ el }) => el.remove());
        this.tokens.clear();
        const container = document.getElementById(this.containerId);
        if (container) container.innerHTML = '';
    }

    /* ------------------------------------------------------------------
       Fullscreen Mode — reparent the dashboard DOM into the overlay
       ------------------------------------------------------------------ */
    enterFullscreen() {
        const overlay = document.getElementById('replayFullscreenOverlay');
        const fsContainer = document.getElementById('replayBrowserFullscreen');
        const dashboard = document.querySelector(`#${this.containerId} .replay-dashboard`);
        if (!overlay || !fsContainer || !dashboard) return;

        this._inlineParent = dashboard.parentNode;
        fsContainer.appendChild(dashboard);
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Move close button into sidebar header so it doesn't overlap the step counter
        const closeBtn = document.getElementById('rb-fullscreen-close');
        const sidebarHeader = dashboard.querySelector('.replay-sidebar-header');
        if (closeBtn && sidebarHeader) {
            this._closeBtnParent = closeBtn.parentNode;
            sidebarHeader.appendChild(closeBtn);
        }

        const toggleBtn = document.getElementById('rb-fullscreen-toggle');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-compress"></i> Exit';

        this.isFullscreen = true;
        setTimeout(() => this._repositionAll(), 100);
    }

    exitFullscreen() {
        const overlay = document.getElementById('replayFullscreenOverlay');
        const dashboard = document.querySelector('.replay-dashboard');
        if (!overlay || !dashboard) return;

        // Return close button to the overlay root
        const closeBtn = document.getElementById('rb-fullscreen-close');
        if (closeBtn && this._closeBtnParent) {
            this._closeBtnParent.appendChild(closeBtn);
        }

        if (this._inlineParent) {
            this._inlineParent.appendChild(dashboard);
        }
        overlay.classList.remove('active');
        document.body.style.overflow = '';

        const toggleBtn = document.getElementById('rb-fullscreen-toggle');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';

        this.isFullscreen = false;
        setTimeout(() => this._repositionAll(), 100);
    }

    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    wireFullscreenButtons() {
        const toggleBtn = document.getElementById('rb-fullscreen-toggle');
        const closeBtn = document.getElementById('rb-fullscreen-close');

        if (toggleBtn) toggleBtn.onclick = () => this.toggleFullscreen();
        if (closeBtn) closeBtn.onclick = () => this.exitFullscreen();

        // Escape key to exit fullscreen
        this._escHandler = (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreen();
            }
        };
        document.addEventListener('keydown', this._escHandler);
    }
}
