class DuelSimulator {
    constructor(containerId, comboData) {
        this.containerId = containerId;
        this.combos = comboData;
        this.currentComboId = Object.keys(comboData)[0]; // Default to first combo
        this.currentStep = 0;
        this.isPlaying = false;
        this.interval = null;
        this.cards = {};
        this.speed = 1200;

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`DuelSimulator: Container #${this.containerId} not found.`);
            return;
        }

        // 1. Generate HTML Structure
        this.renderBoard(container);

        // 2. Cache DOM elements
        this.tokenLayer = container.querySelector('.token-layer');
        this.logEl = container.querySelector('.sim-log');
        this.boardEl = container.querySelector('.duel-board');
        this.playBtn = container.querySelector('.btn-play');
        this.popup = this.createPopup();

        // 2.5. Load card image URLs
        this.loadCardImages().then(() => {
            // 3. Load Initial Combo
            this.loadCombo(this.currentComboId);
        });
    }

    async loadCardImages() {
        const cardNames = new Set();
        Object.values(this.combos).forEach(combo => {
            combo.cards.forEach(card => {
                cardNames.add(card.name);
            });
        });

        const nameArray = Array.from(cardNames);

        // 1. Preload raw data via CardLoader
        if (typeof CardLoader !== 'undefined' && CardLoader.preloadCards) {
            await CardLoader.preloadCards(nameArray);
        }

        const imageMap = {};

        // 2. Process images: Resize them to token size (120x175) in memory
        // This effectively creates "mipmaps" for the board
        const processingPromises = nameArray.map(async (name) => {
            const cachedCard = CardLoader.getCachedCard(name);
            if (cachedCard && cachedCard.hosted_image_url) {
                let imgUrl = cachedCard.hosted_image_url;
                if (imgUrl.endsWith('.jpg')) imgUrl = imgUrl.replace('.jpg', '.png');

                // Generate the optimized Data URL
                try {
                    const optimizedUrl = await this.optimizeCardImage(imgUrl, 120, 175);
                    imageMap[name] = optimizedUrl;
                } catch (e) {
                    console.warn(`Failed to optimize image for ${name}, falling back to original.`);
                    imageMap[name] = imgUrl;
                }
            }
        });

        await Promise.all(processingPromises);

        // 3. Update combos with the optimized textures
        Object.values(this.combos).forEach(combo => {
            combo.cards.forEach(card => {
                // Use optimized image if available, otherwise fallback
                card.img = imageMap[card.name] || card.img;
            });
        });
    }

    /**
     * Loads an image and resamples it to target dimensions using Canvas.
     * This acts like anti-aliasing/mipmapping in game engines.
     */
    optimizeCardImage(url, targetWidth, targetHeight) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Required to manipulate images from external URLs via Canvas

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');

                // High Quality Scaling Settings
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw the large image into the small canvas
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // Convert back to URL (lightweight PNG)
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = (e) => reject(e);
            img.src = url;
        });
    }

    renderBoard(container) {
        container.classList.add('duel-board-wrapper');
        container.innerHTML = `
            <div class="duel-board">
                <div class="field-grid">
                    <!-- Top Row: Empty corners + Extra Monster Zones -->
                    <div class="empty-corner top-left"></div>
                    <div class="extra-monster-zones">
                        <div class="zone extra-monster-zone" id="zone-em-left" data-label="Extra Monster Zone"></div>
                        <div class="zone extra-monster-zone" id="zone-em-right" data-label="Extra Monster Zone"></div>
                    </div>
                    <div class="empty-corner top-right"></div>
                    
                    <!-- Middle Row: Field, Main Monster Zones, GY -->
                    <div class="zone field-zone" id="zone-field" data-label="Field Zone"></div>
                    <div class="main-monster-zones">
                        <div class="zone main-monster-zone" id="zone-m1" data-label="Main Monster Zone"></div>
                        <div class="zone main-monster-zone" id="zone-m2" data-label="Main Monster Zone"></div>
                        <div class="zone main-monster-zone" id="zone-m3" data-label="Main Monster Zone"></div>
                        <div class="zone main-monster-zone" id="zone-m4" data-label="Main Monster Zone"></div>
                        <div class="zone main-monster-zone" id="zone-m5" data-label="Main Monster Zone"></div>
                    </div>
                    <div class="zone gy-zone" id="zone-gy" data-label="Graveyard (GY)"></div>
                    
                    <!-- Bottom Row: Extra Deck, Spell/Trap Zones (with Pendulum zones 1 & 5), Deck -->
                    <div class="zone extra-deck-zone" id="zone-extra" data-label="Extra Deck"></div>
                    <div class="spell-trap-zones">
                        <div class="zone spell-trap-zone pendulum-zone-left" id="zone-s1" data-label="Spell & Trap Zone">
                            <div class="pendulum-icon blue">◆</div>
                        </div>
                        <div class="zone spell-trap-zone" id="zone-s2" data-label="Spell & Trap Zone"></div>
                        <div class="zone spell-trap-zone" id="zone-s3" data-label="Spell & Trap Zone"></div>
                        <div class="zone spell-trap-zone" id="zone-s4" data-label="Spell & Trap Zone"></div>
                        <div class="zone spell-trap-zone pendulum-zone-right" id="zone-s5" data-label="Spell & Trap Zone">
                            <div class="pendulum-icon red">◆</div>
                        </div>
                    </div>
                    <div class="zone deck-zone" id="zone-deck" data-label="Deck"></div>
                    
                    <!-- Hidden Banished Zone (accessible but not prominently displayed) -->
                    <div class=" zone banished-zone" id="zone-banish" data-label="Banished" style="display:none;"></div>
                </div>
                <div class="hand-area" id="zone-hand"></div>
                <div class="token-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;"></div>
            </div>

            <div class="sim-controls">
                <button class="sim-btn sim-btn-nav btn-reset"><i class="fas fa-undo"></i> Reset</button>
                <button class="sim-btn sim-btn-nav btn-prev"><i class="fas fa-step-backward"></i></button>
                <button class="sim-btn sim-btn-play btn-play"><i class="fas fa-play"></i> Play</button>
                <button class="sim-btn sim-btn-nav btn-next"><i class="fas fa-step-forward"></i></button>
            </div>
            <div class="sim-log"><div class="log-entry" style="color:#94a3b8">Ready to duel.</div></div>
        `;

        // Add Beta Badge
        const betaBadge = document.createElement('div');
        betaBadge.textContent = 'BETA TESTING';
        betaBadge.style.position = 'absolute';
        betaBadge.style.top = '10px';
        betaBadge.style.right = '10px';
        betaBadge.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
        betaBadge.style.color = 'white';
        betaBadge.style.padding = '5px 10px';
        betaBadge.style.borderRadius = '5px';
        betaBadge.style.fontSize = '12px';
        betaBadge.style.fontWeight = 'bold';
        betaBadge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        betaBadge.style.zIndex = '1000';
        container.appendChild(betaBadge);

        // Bind Events
        // NEW (Fixed)
        container.querySelector('.btn-reset').onclick = () => this.loadCombo(this.currentComboId);
        container.querySelector('.btn-prev').onclick = () => this.prevStep();
        container.querySelector('.btn-next').onclick = () => this.nextStep();
        container.querySelector('.btn-play').onclick = () => this.togglePlay();
    }

    createPopup() {
        // Check if popup exists globally, if not create it
        let popup = document.getElementById('duel-sim-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'duel-sim-popup';
            popup.className = 'sim-popup';
            document.body.appendChild(popup);
        }
        return popup;
    }

    loadCombo(id) {
        this.reset();
        this.currentComboId = id;
        const combo = this.combos[id];

        if (!combo) {
            this.log(`Error: Combo ${id} not found`);
            return;
        }

        this.log(`Loaded: ${combo.title}`);

        // 1. Create specific combo cards
        combo.cards.forEach(cardData => this.createCardToken(cardData));

        // 2. NEW: Auto-fill Hand with Dummy Cards (Card Backs)
        // Count current cards in hand
        const handCards = combo.cards.filter(c => c.zone === 'zone-hand');
        const currentHandSize = handCards.length;
        const maxHandSize = 5;

        // Add dummy cards if hand is below 5
        if (currentHandSize < maxHandSize) {
            for (let i = 0; i < (maxHandSize - currentHandSize); i++) {
                const dummyId = `dummy-${i}`;
                const dummyData = {
                    id: dummyId,
                    name: "Random Card", // Tooltip text
                    type: "monster", // Generic type for CSS styling
                    zone: "zone-hand",
                    // Use a standard YGO card back image
                    img: "https://images.ygoprodeck.com/images/cards/back_high.jpg",
                    isDummy: true
                };
                this.createCardToken(dummyData);
            }
        }
    }

    createCardToken(data) {
        const token = document.createElement('div');
        token.id = `token-${data.id}`; // Unique DOM ID
        token.className = `card-token ctype-${data.type || 'monster'}`;
        if (data.img) token.style.backgroundImage = `url('${data.img}')`;

        // Position in Start Zone
        const zoneId = data.zone || 'zone-deck';
        this.tokenLayer.appendChild(token);

        this.setPosition(token, zoneId);

        // Store ref
        this.cards[data.id] = { element: token, data: data };

        // Events
        token.style.pointerEvents = 'auto';
        token.style.cursor = 'pointer'; // Add pointer cursor to indicate clickability

        // --- CHANGED: Integration with CardLoader ---

        // 1. Add Click Event for detailed CardLoader Popup
        token.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling
            if (typeof CardLoader !== 'undefined' && CardLoader.showPopup) {
                CardLoader.showPopup(e, data.name);
            }
        });

        // 2. Optional: Disable internal simulator hover popup to avoid conflict
        // If you still want the small image hover, uncomment the next 3 lines:
        // token.addEventListener('mouseenter', () => this.showPopup(data));
        // token.addEventListener('mousemove', (e) => this.movePopup(e));
        // token.addEventListener('mouseleave', () => this.hidePopup());
    }
    setPosition(token, zoneId) {
        // Scope selector to this board instance
        const wrapper = document.getElementById(this.containerId);
        const zone = wrapper.querySelector(`#${zoneId}`);
        const boardRect = this.boardEl.getBoundingClientRect();

        if (zone) {
            const zoneRect = zone.getBoundingClientRect();

            // DYNAMIC SIZING: Check if we are in mobile mode
            const isMobile = window.matchMedia("(max-width: 768px)").matches;

            // On mobile, the zones define the size (approx 62x90). 
            // On Desktop, we use the standard size (120x175).
            const targetWidth = isMobile ? 62 : 120;
            const targetHeight = isMobile ? 90 : 175;

            // Force the token to match the grid size immediately
            token.style.width = targetWidth + 'px';
            token.style.height = targetHeight + 'px';

            const cardWidth = targetWidth;
            const cardHeight = targetHeight;

            // Special handling for hand zone - spread cards horizontally
            if (zoneId === 'zone-hand') {
                // Count how many cards are in the hand
                const cardsInHand = Object.values(this.cards).filter(c => {
                    const cardZone = c.element.getAttribute('data-zone');
                    return cardZone === 'zone-hand';
                });

                // Mark this card as being in hand
                token.setAttribute('data-zone', 'zone-hand');

                const cardIndex = cardsInHand.findIndex(c => c.element === token);
                const totalCards = cardsInHand.length;
                const spacing = 5;
                // Calculate total width of the hand group
                const totalWidth = totalCards * cardWidth + (totalCards - 1) * spacing;

                // Center the group of cards in the hand zone
                const startX = (zoneRect.width - totalWidth) / 2;
                const xPos = startX + (cardIndex * (cardWidth + spacing));

                token.style.left = (zoneRect.left - boardRect.left + xPos) + 'px';
                token.style.top = (zoneRect.top - boardRect.top + (zoneRect.height - cardHeight) / 2) + 'px';
            } else {
                // Mark card as not in hand
                token.setAttribute('data-zone', zoneId);

                // Jitter for GY and Deck zones
                let jitterX = 0, jitterY = 0;
                if (zoneId.includes('gy') || zoneId.includes('deck')) {
                    jitterX = Math.random() * 6 - 3;
                    jitterY = Math.random() * 6 - 3;
                }

                // Center in zone
                const xPos = (zoneRect.width - cardWidth) / 2;
                const yPos = (zoneRect.height - cardHeight) / 2;

                token.style.left = (zoneRect.left - boardRect.left + xPos + jitterX) + 'px';
                token.style.top = (zoneRect.top - boardRect.top + yPos + jitterY) + 'px';
            }
        }
    }

    moveCard(cardId, targetZoneId) {
        const cardObj = this.cards[cardId];
        if (!cardObj) return;

        // 1. Identify if this card is a Token
        const isToken = (cardObj.data.type && cardObj.data.type.toLowerCase() === 'token') ||
            (cardObj.data.name && cardObj.data.name.toLowerCase().includes('token'));

        // 2. Identify if the card is leaving the field (to GY, Deck, Hand, Banish)
        const isLeavingField = ['zone-gy', 'zone-deck', 'zone-hand', 'zone-banish'].includes(targetZoneId);

        // 3. CLEAR previous timeouts 
        // (If the user clicks "Next" fast, we must cancel the 'hide' timer so the token can reappear)
        if (cardObj.vanishTimeout) {
            clearTimeout(cardObj.vanishTimeout);
            cardObj.vanishTimeout = null;
        }

        // 4. Handle Token Removal Logic
        if (isToken && isLeavingField) {
            this.log(`(Token ${cardObj.data.name} removed from play)`);

            // Animate out
            cardObj.element.style.transition = "all 0.5s ease";
            cardObj.element.style.opacity = "0";
            cardObj.element.style.transform = "scale(0.5)";

            // Hide element after animation instead of removing it
            cardObj.vanishTimeout = setTimeout(() => {
                cardObj.element.style.display = 'none';
            }, 500);

            return; // Stop processing (don't move it to the GY zone)
        }

        // 5. RESET VISIBILITY (Fix for Re-Summoning)
        // Ensure the card is visible, full size, and opaque before moving
        cardObj.element.style.display = 'block';
        cardObj.element.style.opacity = '1';
        cardObj.element.style.transform = 'scale(1)';

        // Restore standard transition for movement
        cardObj.element.style.transition = "left 0.4s ease-in-out, top 0.4s ease-in-out";

        // --- Standard Logic ---

        this.setPosition(cardObj.element, targetZoneId);

        // Re-position all hand cards if moving to/from hand
        if (targetZoneId === 'zone-hand') {
            Object.values(this.cards).forEach(c => {
                if (c.element.getAttribute('data-zone') === 'zone-hand') {
                    this.setPosition(c.element, 'zone-hand');
                }
            });
        }

        // Flash effect
        cardObj.element.classList.add('active-card');
        setTimeout(() => cardObj.element.classList.remove('active-card'), 600);
    }

    nextStep() {
        const steps = this.combos[this.currentComboId].steps;
        if (this.currentStep < steps.length) {
            const step = steps[this.currentStep];
            this.log(`> ${step.text}`);
            this.moveCard(step.card, step.to);
            this.currentStep++;
        } else {
            this.log("Combo Complete!");
            this.togglePlay(false);
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            // 1. Calculate the step we want to be at (one step back)
            const targetIndex = this.currentStep - 1;

            // 2. Temporarily pause logging to avoid spamming the log during replay
            const originalLog = this.log;
            this.log = () => { }; // No-op function

            // 3. Reset the board to the clean starting state
            this.loadCombo(this.currentComboId);

            // 4. Fast-forward: Execute all moves up to the target index
            const steps = this.combos[this.currentComboId].steps;
            for (let i = 0; i < targetIndex; i++) {
                const step = steps[i];
                this.moveCard(step.card, step.to);
            }

            // 5. Restore Logging and Update State
            this.log = originalLog; // Restore the log function
            this.currentStep = targetIndex; // Update the counter

            // Optional: Log that we stepped back
            this.log(`< Rewound to Step ${targetIndex}`);
        } else {
            this.log("Already at the start.");
        }
    }

    reset() {
        this.isPlaying = false;
        clearInterval(this.interval);
        this.updatePlayButton();
        this.currentStep = 0;
        this.tokenLayer.innerHTML = '';
        this.cards = {};
        this.logEl.innerHTML = '';
    }

    togglePlay(forceState) {
        this.isPlaying = typeof forceState !== 'undefined' ? forceState : !this.isPlaying;
        this.updatePlayButton();

        if (this.isPlaying) {
            this.interval = setInterval(() => this.nextStep(), this.speed);
        } else {
            clearInterval(this.interval);
        }
    }

    updatePlayButton() {
        if (this.isPlaying) {
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            this.playBtn.classList.add('paused');
        } else {
            this.playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            this.playBtn.classList.remove('paused');
        }
    }

    log(msg) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = msg;
        this.logEl.appendChild(entry);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    // Popup Logic
    showPopup(data) {
        const largeImg = data.img; // Assuming CardLoader provides appropriate size
        this.popup.innerHTML = `
            <div style="text-align:center">
                <img src="${largeImg}" style="width:100%; border-radius:0.5rem; margin-bottom:4px;">
                <div style="font-size:0.75rem; font-weight:bold; color:#7dd3fc">${data.name}</div>
            </div>
        `;
        this.popup.style.display = 'block';
        requestAnimationFrame(() => this.popup.style.opacity = '1');
    }

    movePopup(e) {
        const offset = 20;
        let left = e.clientX + offset;
        let top = e.clientY + offset;

        // Viewport check
        if (left + 260 > window.innerWidth) left = e.clientX - 270;
        if (top + 350 > window.innerHeight) top = e.clientY - 360;

        this.popup.style.left = `${left}px`;
        this.popup.style.top = `${top}px`;
    }

    hidePopup() {
        this.popup.style.opacity = '0';
        setTimeout(() => {
            if (this.popup.style.opacity === '0') this.popup.style.display = 'none';
        }, 150);
    }
}