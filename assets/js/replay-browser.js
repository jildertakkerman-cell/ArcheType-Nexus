/* ==========================================================================
   ReplayBrowser — Interactive dual-player board viewer
   Consumes analysis.moveLog — each entry is one discrete game action.

   Expected moveLog entry shape:
   {
     type: string,     // maps to ComboSounds event (see SOUND_MAP below)
     turn: number,
     player: 1|2,
     phase: string,
     label: string,    // human-readable description shown in the log
     actions: [
       {
         id: string,   // stable unique instance ID assigned by backend
         code: number, // YGOPro passcode (used for card image lookup)
         name: string, // card name (used for CardLoader image + popup)
         player: 1|2,  // which player's board the card belongs to
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
    'phase-change':           'step',
    'turn-change':            'step',
    'game-over':              'combo-complete',
};

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
    'overlay':                   'gy',
};

class ReplayBrowser {
    constructor(containerId, moveLog, playerNames) {
        this.containerId = containerId;
        this.moveLog = moveLog;
        this.playerNames = playerNames || ['Player 1', 'Player 2'];
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
    }

    buildUI() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="replay-dashboard">
                <!-- Left Column: The Board -->
                <div class="replay-board-column">
                    <div class="replay-board-outer">
                        <div class="replay-player-strip p2-strip">
                            <span>${this.playerNames[1]}</span>
                            <span id="rb-p2-lp" style="margin-left:auto;opacity:0.7;">8000 LP</span>
                        </div>
                        <div class="replay-board-half p2-half" id="rb-p2-half">
                            ${this._boardHTML('p2')}
                        </div>
                        <div class="replay-board-divider"></div>
                        <div class="replay-board-half p1-half" id="rb-p1-half">
                            ${this._boardHTML('p1')}
                        </div>
                        <div class="replay-player-strip p1-strip">
                            <span>${this.playerNames[0]}</span>
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
                            <input type="range" id="rb-speed" min="400" max="2400" step="200" value="1200" style="flex:1;">
                        </div>
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
        this._setupResizeObserver();
        setTimeout(() => this._repositionAll(), 100);
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
            this.speed = parseInt(e.target.value);
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
    }

    _setupResizeObserver() {
        if (!window.ResizeObserver) return;
        let t;
        this.resizeObserver = new ResizeObserver(() => {
            clearTimeout(t);
            t = setTimeout(() => this._repositionAll(), 150);
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

    _ensureToken(action) {
        const { id, code, name, player, from } = action;

        // If token already exists, check if the card identity changed
        if (this.tokens.has(id)) {
            const t = this.tokens.get(id);
            // Card was face-down (set) and is now being revealed — load the real image
            if (t.faceDown && action._stepType !== 'set' && action._stepType !== 'set-monster') {
                t.faceDown = false;
                t.el._faceDown = false;
                if (name && typeof window.CardLoader !== 'undefined') {
                    window.CardLoader.getCardImageUrl(name).then(url => {
                        if (url) t.el.style.backgroundImage = `url('${url}')`;
                    });
                }
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
                // Update the card image
                if (name && typeof window.CardLoader !== 'undefined') {
                    window.CardLoader.getCardImageUrl(name).then(url => {
                        if (url) t.el.style.backgroundImage = `url('${url}')`;
                    });
                }
                // Update click handler
                t.el.onclick = (e) => {
                    e.stopPropagation();
                    if (name && typeof window.CardLoader !== 'undefined') {
                        window.CardLoader.showPopup(e, name);
                    }
                };
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
                        if (name && typeof window.CardLoader !== 'undefined') {
                            window.CardLoader.getCardImageUrl(name).then(url => {
                                if (url) t.el.style.backgroundImage = `url('${url}')`;
                            });
                        }
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
        el.className = 'card-token ctype-monster';
        el.setAttribute('data-zone', zoneElId);
        el.setAttribute('data-rb-id', id);
        el.style.transition = 'none';
        el.style.backgroundImage = "url('https://images.ygoprodeck.com/images/cards/back_high.jpg')";
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';

        const isFaceDown = action._stepType === 'set' || action._stepType === 'set-monster';
        el._faceDown = isFaceDown;

        layer.appendChild(el);
        this.tokens.set(id, { el, player, zone: zoneElId, code: code || 0, faceDown: isFaceDown });

        this._positionToken(el, player, zoneElId);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transition = 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), top 0.5s cubic-bezier(0.34,1.56,0.64,1), width 0.3s, height 0.3s, opacity 0.3s';
        }));

        if (!isFaceDown && name && typeof window.CardLoader !== 'undefined') {
            window.CardLoader.getCardImageUrl(name).then(url => {
                if (url) {
                    el.style.backgroundImage = `url('${url}')`;
                    if (el._hovered) {
                        window.CardLoader.showCardPreview(url);
                    }
                }
            });
        }

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (name && typeof window.CardLoader !== 'undefined') {
                window.CardLoader.showPopup(e, name);
            }
        });

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

        const toElId = this._zoneElId(player, to);
        if (!toElId) {
            // Unknown zone (e.g. overlay for XYZ materials) — hide token rather than leaving a ghost
            t.el.style.opacity = '0';
            t.el.style.pointerEvents = 'none';
            return;
        }

        t.zone = toElId;
        t.el.setAttribute('data-zone', toElId);
        // CSS handles the 180° rotation for p2 tokens via class, so leave transform to CSS
        t.el.style.transform = '';

        this._positionToken(t.el, player, toElId);
    }

    _positionToken(el, player, zoneElId) {
        const board = this._board(player);
        if (!board) return;
        const zone = document.getElementById(zoneElId);
        if (!zone) return;

        const boardRect = board.getBoundingClientRect();
        if (boardRect.width === 0) return;
        const zoneRect = zone.getBoundingClientRect();

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        let w = isMobile ? 48 : 90;
        let h = isMobile ? 70 : 100;

        if (this.isFullscreen && !isMobile) {
            // Scale cards to fit their actual rendered zone, maintaining YGO aspect ratio (59:86).
            // This lets the board adapt to any viewport size automatically.
            const ASPECT = 59 / 86; // card width ÷ height ≈ 0.686
            const isHand = zoneElId.endsWith('-hand');

            if (isHand) {
                h = Math.floor(zoneRect.height * 0.88);
                w = Math.floor(h * ASPECT);
            } else {
                const maxW = Math.floor(zoneRect.width * 0.88);
                const maxH = Math.floor(zoneRect.height * 0.88);
                if (Math.floor(maxW / ASPECT) <= maxH) {
                    w = maxW;
                    h = Math.floor(w / ASPECT);
                } else {
                    h = maxH;
                    w = Math.floor(h * ASPECT);
                }
            }

            // Fallback if zone hasn't laid out yet (dimensions near zero)
            if (w < 30 || h < 44) { w = 96; h = 140; }
        }

        el.style.width  = `${w}px`;
        el.style.height = `${h}px`;

        if (zoneElId.endsWith('-hand')) {
            const layer = this._tokenLayer(player);
            const handTokens = layer ? Array.from(layer.children).filter(c => c.getAttribute('data-zone') === zoneElId) : [];
            const idx = handTokens.indexOf(el);
            const total = handTokens.length;
            const gap = 5;
            const startX = (zoneRect.width - (total * w + (total - 1) * gap)) / 2;
            el.style.left = (zoneRect.left - boardRect.left + startX + idx * (w + gap)) + 'px';
            el.style.top  = (zoneRect.top  - boardRect.top  + (zoneRect.height - h) / 2) + 'px';
        } else {
            const isStack = zoneElId.includes('-gy') || zoneElId.includes('-deck') || zoneElId.includes('-banish');
            const jX = isStack ? (Math.random() * 4 - 2) : 0;
            const jY = isStack ? (Math.random() * 4 - 2) : 0;
            el.style.left = (zoneRect.left - boardRect.left + (zoneRect.width  - w) / 2 + jX) + 'px';
            el.style.top  = (zoneRect.top  - boardRect.top  + (zoneRect.height - h) / 2 + jY) + 'px';
        }
    }

    _repositionAll() {
        this.tokens.forEach(({ el, player, zone }) => this._positionToken(el, player, zone));
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
        }

        t.el.classList.add(animClass);
        if (chainLink) t.el.setAttribute('data-cl', chainLink);

        setTimeout(() => {
            t.el.classList.remove(animClass);
            t.el.removeAttribute('data-cl');
            if (isStack) t.el.style.zIndex = '';
        }, 1350);
    }

    _updateLifePoints() {
        let p1LP = 8000;
        let p2LP = 8000;
        
        for (let i = 0; i <= this.currentIndex; i++) {
            const step = this.moveLog[i];
            if (!step) continue;
            if (step.type && step.type.startsWith('lp-')) {
                const amountStr = step.label.replace(/\D/g, '');
                const amount = amountStr ? parseInt(amountStr) : 0;
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

    _applyAttackAnimation(actions) {
        if (!actions || actions.length === 0) return;
        const attacker = this.tokens.get(actions[0].id);
        if (!attacker) return;
        
        if (actions.length === 1) {
            // Direct attack - bump forward towards opponent side
            const bumpDir = actions[0].player === 0 ? -30 : 30; // p1 attacks up (-), p2 attacks down (+)
            attacker.el.style.transition = 'transform 0.15s ease-in';
            attacker.el.style.transform = `translateY(${bumpDir}px) scale(1.15)`;
            attacker.el.style.zIndex = '50';
            
            setTimeout(() => {
                attacker.el.style.transition = 'transform 0.3s ease-out';
                attacker.el.style.transform = '';
                attacker.el.style.zIndex = '';
            }, 300);
        } else if (actions.length === 2) {
            // Attack on monster
            const defender = this.tokens.get(actions[1].id);
            if (!defender) return;
            
            // Calculate vector between attacker and defender
            const aRect = attacker.el.getBoundingClientRect();
            const dRect = defender.el.getBoundingClientRect();
            
            const dX = (dRect.left - aRect.left) * 0.4;
            const dY = (dRect.top - aRect.top) * 0.4;
            
            attacker.el.style.transition = 'transform 0.15s ease-in';
            attacker.el.style.transform = `translate(${dX}px, ${dY}px) scale(1.15)`;
            attacker.el.style.zIndex = '50';
            
            setTimeout(() => {
                attacker.el.style.transition = 'transform 0.3s ease-out';
                attacker.el.style.transform = '';
                attacker.el.style.zIndex = '';
                
                // Shake defender
                defender.el.classList.add('impact-shake');
                setTimeout(() => defender.el.classList.remove('impact-shake'), 400);
            }, 150);
        }
    }

    _applyStep(step, silent = false) {
        const { type, turn, phase, label, actions } = step;

        if (turn !== undefined) {
            const turnEl = document.getElementById('rb-turn-label');
            if (turnEl) turnEl.textContent = `Turn ${turn} · ${phase || ''}`;
            
            if (typeof updateChartHighlight === 'function') {
                updateChartHighlight(turn, phase);
            }
        }

        if (!silent && label) this._log(label);

        // Update Life Points based on the timeline position
        this._updateLifePoints();
        
        if (!silent && type.startsWith('lp-')) {
            const amountStr = label.replace(/\D/g, '');
            const amount = amountStr ? parseInt(amountStr) : 0;
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
                actions.forEach(a => {
                    a._stepType = type;
                    this._applyAction(a);
                    if (!silent) {
                        if (['synchro-summon', 'xyz-summon', 'fusion-summon', 'link-summon', 'contact-fusion'].includes(type)) {
                            this._applySummonAnimation(a);
                        } else if (['effect-activate', 'effect-negate', 'effect-disabled'].includes(type)) {
                            // If this activation was negated, show the negation animation instead
                            const effectType = (type === 'effect-activate' && step._isNegated) ? 'effect-negate' : type;
                            this._applyEffectAnimation(a, effectType, step.chainLink);
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

    _log(text) {
        const el = document.getElementById('rb-log');
        if (el) el.textContent = text;
    }

    _updateCounter() {
        const el = document.getElementById('rb-step-counter');
        if (el) el.textContent = `${this.currentIndex + 1} / ${this.moveLog.length}`;
        
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
        this._applyStep(this.moveLog[this.currentIndex]);
        this._updateCounter();
        setTimeout(() => this._repositionAll(), 30);
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
        const turnEl = document.getElementById('rb-turn-label');
        if (turnEl) turnEl.textContent = 'Turn —';

        for (let i = 0; i <= targetIndex; i++) {
            this._applyStep(this.moveLog[i], true);
        }
        this._updateCounter();
        setTimeout(() => this._repositionAll(), 30);
        if (targetIndex >= 0) this._log(this.moveLog[targetIndex].label || '');
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
