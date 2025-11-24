/**
 * ComboLoader - Utility for loading and initializing combo visualizer data
 * * This utility provides methods to:
 * - Load combo data from JSON files
 * - Initialize DuelSimulator instances with the loaded data
 * - Handle lazy-loading of combo simulators
 */
class ComboLoader {
    /**
     * Load combo data from a JSON file
     * @param {string} archetypeName - Name of the archetype (e.g., 'yummy', 'blue-eyes')
     * @returns {Promise<Object>} The loaded combo data
     */
    static async loadCombos(archetypeName) {
        try {
            const response = await fetch(`../assets/data/combos/${archetypeName.toLowerCase()}-combos.json`);
            if (!response.ok) {
                throw new Error(`Failed to load combos for ${archetypeName}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading combo data for ${archetypeName}:`, error);
            throw error;
        }
    }

    /**
     * Initialize a single DuelSimulator instance
     * @param {string} elementId - ID of the element to attach the simulator to
     * @param {Object} comboData - Combo configuration data
     * @returns {DuelSimulator} The initialized simulator instance
     */
    static initializeSimulator(elementId, comboData) {
        return new DuelSimulator(elementId, comboData);
    }

    /**
     * Load combo data and initialize all simulators
     * This is the main convenience method for initializing all combos at once
     * @param {string} archetypeName - Name of the archetype
     * @param {Object} comboMap - Map of combo IDs to element IDs { comboId: elementId }
     * @returns {Promise<Object>} Map of combo IDs to simulator instances
     */
    static async loadAndInitializeAll(archetypeName, comboMap) {
        const data = await this.loadCombos(archetypeName);
        const simulators = {};

        for (const [comboId, elementId] of Object.entries(comboMap)) {
            if (data.combos[comboId]) {
                simulators[comboId] = this.initializeSimulator(elementId, {
                    [comboId]: data.combos[comboId]
                });
            } else {
                console.warn(`Combo ${comboId} not found in loaded data`);
            }
        }

        return simulators;
    }

    /**
     * Create lazy-loading wrapper functions for combo simulators
     * @param {Object} comboData - The loaded combo data object
     * @param {number} comboNum - The combo number (1-6)
     * @param {string} elementId - ID of the element to attach simulator to
     * @returns {Function} A function that initializes the combo when called
     */
    static createLazyInitializer(comboData, comboNum, elementId) {
        return function () {
            const comboId = `combo${comboNum}`;
            if (comboData.combos[comboId]) {
                return ComboLoader.initializeSimulator(elementId, {
                    [comboId]: comboData.combos[comboId]
                });
            } else {
                console.error(`Combo ${comboId} not found in data`);
                return null;
            }
        };
    }
}

/**
 * ComboSelector - Modular Combo Dropdown Generator
 * Automatically creates a themed combo selector from combo data
 */
class ComboSelector {
    static render(containerId, comboData, onChangeCallback, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            labelText = 'Select a Combo',
            labelIcon = 'fas fa-layer-group',
            selectorId = 'combo-selector',
            defaultCombo = '1'
        } = options;

        const combos = comboData.combos || {};
        const comboNumbers = Object.keys(combos).map(key => key.replace('combo', ''));

        container.innerHTML = `
            <div class="combo-selector-container">
                <label for="${selectorId}" class="combo-selector-label">
                    <i class="${labelIcon}"></i>${labelText}
                </label>
                <select id="${selectorId}" class="combo-selector">
                    ${comboNumbers.map(num => {
            const combo = combos[`combo${num}`];
            return `<option value="${num}" ${num === defaultCombo ? 'selected' : ''}>${combo.title || `Combo #${num}`}</option>`;
        }).join('')}
                </select>
            </div>
        `;

        // Apply Theme
        const theme = ComboSelector.inferTheme();
        if (theme) ComboSelector.setTheme(theme);

        const selector = document.getElementById(selectorId);
        if (selector && onChangeCallback) {
            selector.addEventListener('change', (e) => onChangeCallback(e.target.value));
            onChangeCallback(defaultCombo);
        }
        return selector;
    }

    static setTheme(theme) {
        const root = document.documentElement;

        // Set accent/primary colors
        if (theme.accentColor) {
            root.style.setProperty('--combo-accent', theme.accentColor);
            root.style.setProperty('--combo-selector-focus-border', theme.accentColor);
            root.style.setProperty('--primary-color', theme.accentColor);
            root.style.setProperty('--combo-selector-border', theme.accentColor);
            root.style.setProperty('--combo-selector-label-color', theme.accentColor);

            // Create focus ring color with opacity
            const accentRgb = theme.accentColor.match(/\d+/g);
            if (accentRgb && accentRgb.length >= 3) {
                root.style.setProperty('--combo-selector-focus-ring', `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, 0.5)`);
            } else if (theme.accentColor.startsWith('#')) {
                // Convert hex to rgba
                const hex = theme.accentColor.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                root.style.setProperty('--combo-selector-focus-ring', `rgba(${r}, ${g}, ${b}, 0.5)`);
            }
        }

        // Set background colors
        if (theme.backgroundColor) {
            root.style.setProperty('--combo-selector-bg', theme.backgroundColor);
        }

        // Set text color
        if (theme.textColor) {
            root.style.setProperty('--combo-selector-text', theme.textColor);
            root.style.setProperty('--combo-selector-option-text', theme.textColor);
        }

        // Set hover background (slightly more opaque than base)
        if (theme.backgroundColor) {
            const bgMatch = theme.backgroundColor.match(/rgba?\(([^)]+)\)/);
            if (bgMatch) {
                const parts = bgMatch[1].split(',').map(p => p.trim());
                if (parts.length === 4) {
                    // Increase opacity for hover
                    const newOpacity = Math.min(parseFloat(parts[3]) + 0.2, 1);
                    root.style.setProperty('--combo-selector-hover-bg', `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${newOpacity})`);
                }
            }
        }

        // Set option background
        if (theme.cardBg) {
            root.style.setProperty('--combo-selector-option-bg', theme.cardBg);
        }

        // Set gradient colors for options
        if (theme.secondaryColor && theme.accentColor) {
            root.style.setProperty('--combo-selector-option-gradient-start', theme.secondaryColor);
            root.style.setProperty('--combo-selector-option-gradient-end', theme.accentColor);
        } else if (theme.accentColor) {
            root.style.setProperty('--combo-selector-option-gradient-start', theme.accentColor);
            root.style.setProperty('--combo-selector-option-gradient-end', theme.accentColor);
        }
    }

    static inferTheme() {
        const getStyle = (el, prop) => window.getComputedStyle(el).getPropertyValue(prop);
        const bodyBg = getStyle(document.body, 'background-color');
        const root = document.documentElement;

        // 1. Explicit Archetype Detection

        // Yummy Theme (Purple/Pink)
        if (bodyBg.includes('26, 17, 42') || bodyBg.includes('#1a112a') ||
            getStyle(document.body, 'border-color').includes('236, 72, 153') || // Pink-500
            document.querySelector('.text-pink-500') ||
            document.title.toLowerCase().includes('yummy')) {
            return {
                accentColor: '#ec4899', // Pink-500
                secondaryColor: '#a855f7', // Purple-500
                isDarkMode: true,
                backgroundColor: 'rgba(88, 28, 135, 0.5)', // Deep Purple
                cardBg: 'rgba(26, 17, 42, 0.8)',
                textColor: '#fdf2f8'
            };
        }

        // Blue-Eyes Theme (Cyan/Blue)
        if (document.title.toLowerCase().includes('blue-eyes') || bodyBg.includes('12, 21, 36')) {
            return {
                accentColor: '#38bdf8', // Sky-400
                isDarkMode: true,
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                cardBg: '#1e293b',
                textColor: '#f0f9ff'
            };
        }

        // 2. Generic Scanner (Fallback)
        let accentColor = getComputedStyle(root).getPropertyValue('--accent-color') ||
            getComputedStyle(root).getPropertyValue('--primary-color');

        if (!accentColor || !accentColor.trim()) {
            const headers = document.querySelectorAll('h1, h2, h3');
            for (const h of headers) {
                const color = getStyle(h, 'color');
                const rgb = color.match(/\d+/g);
                if (rgb && (Math.abs(rgb[0] - rgb[1]) > 20 || Math.abs(rgb[1] - rgb[2]) > 20)) {
                    accentColor = color;
                    break;
                }
            }
        }

        if (!accentColor) accentColor = '#60a5fa'; // Blue-400

        const rgb = bodyBg.match(/\d+/g);
        const isDarkMode = rgb ? (parseInt(rgb[0]) * 0.299 + parseInt(rgb[1]) * 0.587 + parseInt(rgb[2]) * 0.114) < 128 : true;

        return {
            accentColor: accentColor.trim(),
            isDarkMode: isDarkMode,
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            cardBg: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#ffffff',
            textColor: isDarkMode ? '#f3f4f6' : '#1f2937'
        };
    }
}

/**
 * ComboGuide Module
 * Dynamically renders combo guides using the inferred page theme.
 * Uses CardLoader to handle image fetching and popups.
 */
class ComboGuide {
    static render(containerId, comboData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. Get Smart Theme
        const theme = ComboSelector.inferTheme();
        const accent = theme.accentColor;
        const textMain = theme.textColor;

        // 2. Clear & Setup
        container.innerHTML = '';
        const combos = comboData.combos || {};
        const imageMap = {};

        Object.keys(combos).forEach((key, comboIndex) => {
            const combo = combos[key];
            const normalizedKey = key.replace('combo', '');

            const comboSection = document.createElement('div');
            comboSection.id = `combo-${normalizedKey}-content`;
            comboSection.className = 'combo-content hidden animate-fadeIn flex flex-col gap-6';
            if (comboIndex === 0) comboSection.classList.remove('hidden');

            const cardNameMap = {};
            if (combo.cards) combo.cards.forEach(c => cardNameMap[c.id] = c.name);

            // ---------------------------------------------
            // PART 1: SIMULATOR (First)
            // ---------------------------------------------
            const simDiv = document.createElement('div');
            simDiv.id = `duel-simulator-${key}`;
            simDiv.className = 'w-full mb-2';
            comboSection.appendChild(simDiv);

            // ---------------------------------------------
            // PART 2: COLLAPSIBLE TEXT GUIDE (Second)
            // ---------------------------------------------
            const guideContainer = document.createElement('div');
            guideContainer.className = 'rounded-2xl border shadow-lg overflow-hidden backdrop-blur-sm';
            guideContainer.style.backgroundColor = theme.backgroundColor;
            guideContainer.style.borderColor = `${accent}60`;

            // --- HEADER / TOGGLE BAR ---
            const header = document.createElement('div');
            header.className = 'p-4 md:p-5 border-b cursor-pointer transition-colors duration-200 flex items-center justify-between group hover:bg-white/5';
            header.style.borderColor = `${accent}30`;
            header.onclick = () => {
                const content = document.getElementById(`guide-steps-${key}`);
                const icon = document.getElementById(`guide-icon-${key}`);
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.add('hidden');
                    icon.style.transform = 'rotate(0deg)';
                }
            };

            header.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="p-2.5 rounded-lg shadow-inner flex-shrink-0" style="background: ${accent}26;">
                        <i class="fas fa-book-open text-xl" style="color: ${accent}"></i>
                    </div>
                    <div>
                        <h3 class="text-lg md:text-xl font-bold leading-none" style="color: ${textMain}">
                            ${combo.title}
                        </h3>
                        <p class="text-xs md:text-sm mt-1 font-bold tracking-wide uppercase opacity-90" style="color: ${accent}">
                            <i class="fas fa-info-circle mr-1"></i> Beginner Guide Available
                        </p>
                    </div>
                </div>
                <div class="text-2xl opacity-60 transition-transform duration-300" id="guide-icon-${key}" style="color: ${textMain}">
                    <i class="fas fa-chevron-down"></i>
                </div>
            `;
            guideContainer.appendChild(header);

            // --- DESCRIPTION (if exists) ---
            let descriptionHtml = '';
            if (combo.description) {
                descriptionHtml = `
                    <div class="px-6 pt-6 pb-2" style="background-color: ${theme.isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'};">
                        <p class="text-sm md:text-base leading-relaxed italic opacity-90" style="color: ${textMain}">
                            <i class="fas fa-quote-left mr-2 opacity-50"></i>${combo.description}<i class="fas fa-quote-right ml-2 opacity-50"></i>
                        </p>
                    </div>
                `;
            }

            // --- STEPS CONTAINER ---
            const stepsWrapper = document.createElement('div');
            stepsWrapper.id = `guide-steps-${key}`;
            stepsWrapper.className = `${combo.description ? 'pt-4' : 'pt-6'} px-6 pb-6 md:px-8 md:pb-8 flex flex-col gap-8 hidden`;
            stepsWrapper.style.backgroundColor = theme.isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)';

            // Add description HTML if it exists
            if (descriptionHtml) {
                const descDiv = document.createElement('div');
                descDiv.innerHTML = descriptionHtml;
                guideContainer.appendChild(descDiv.firstElementChild);
            }

            if (combo.steps) {
                combo.steps.forEach((step, stepIndex) => {
                    const stepNum = stepIndex + 1;
                    const cardName = cardNameMap[step.card] || step.card;
                    const imgId = `combo-${key}-step-${stepNum}-img`;

                    // Collect cards for batch loading via CardLoader
                    if (cardName) imageMap[imgId] = cardName;

                    // 1. Use customText if available, otherwise use auto-generated text
                    let displayText = step.customText || step.text;

                    // 2. Expand Jargon (SS -> Special Summon) only if using auto-generated text
                    if (!step.customText) {
                        displayText = this.formatForBeginners(displayText);
                    }

                    // 3. Highlight Cards
                    const highlightedText = this.highlightKeywords(displayText, cardNameMap, accent, theme.isDarkMode);

                    const stepCard = document.createElement('div');
                    stepCard.className = 'relative group';

                    stepCard.innerHTML = `
                        <div class="
                            flex flex-col md:flex-row items-center gap-6 
                            p-5 rounded-xl border shadow-sm
                            transition-all duration-300 hover:shadow-md
                            relative overflow-hidden
                        " style="
                            background-color: ${theme.cardBg}; 
                            border-color: ${accent}40;
                        ">
                            <div class="absolute top-0 left-0 px-3 py-1 rounded-br-lg text-[10px] font-bold tracking-widest z-10 shadow-sm"
                                 style="background: ${accent}; color: ${theme.isDarkMode ? '#000' : '#fff'};">
                                STEP ${stepNum}
                            </div>

                            <div id="${imgId}" 
                                 class="relative flex-shrink-0 w-24 h-36 md:w-28 md:h-40 rounded-lg overflow-hidden cursor-pointer shadow-md border mt-3 md:mt-0 transition-transform duration-300 group-hover:scale-105"
                                 style="border-color: ${accent};"
                                 onclick="if(window.CardLoader) window.CardLoader.showPopup(event, '${cardName.replace(/'/g, "\\'")}')">
                                <div class="w-full h-full flex items-center justify-center opacity-50 bg-black">
                                    <i class="fas fa-spinner fa-spin" style="color: ${accent}"></i>
                                </div>
                            </div>

                            <div class="flex-grow text-center md:text-left">
                                <p class="text-base md:text-lg leading-relaxed font-medium" style="color: ${textMain}">
                                    ${highlightedText}
                                </p>
                            </div>
                        </div>
                    `;
                    stepsWrapper.appendChild(stepCard);

                    // Arrow
                    if (stepIndex < combo.steps.length - 1) {
                        const arrow = document.createElement('div');
                        arrow.className = 'flex justify-center -my-3 opacity-30';
                        arrow.innerHTML = `<i class="fas fa-arrow-down text-xl" style="color: ${accent}"></i>`;
                        stepsWrapper.appendChild(arrow);
                    }
                });
            }

            guideContainer.appendChild(stepsWrapper);
            comboSection.appendChild(guideContainer);

            container.appendChild(comboSection);
        });

        // Defer card loading to existing CardLoader
        if (window.CardLoader) {
            setTimeout(() => window.CardLoader.loadCards(imageMap), 100);
        }
    }

    /**
     * Replaces competitive jargon with beginner-friendly terms
     */
    static formatForBeginners(text) {
        if (!text) return "";
        let t = text;

        const replacements = [
            { regex: /\bGY\b/gi, val: 'Graveyard' },
            { regex: /\bSS\b/gi, val: 'Special Summon' },
            { regex: /\bNS\b/gi, val: 'Normal Summon' },
            { regex: /\bSp\.?\s?Summon\b/gi, val: 'Special Summon' },
            { regex: /\bLP\b/gi, val: 'Life Points' },
            { regex: /\bATK\b/gi, val: 'Attack Points' },
            { regex: /\bDEF\b/gi, val: 'Defense Points' },
            { regex: /\bS\/T\b/gi, val: 'Spell/Trap' },
            { regex: /\bCL(\d+)/gi, val: 'Chain Link $1' },
            // Action Verbs
            { regex: /\bpop\b/gi, val: 'destroy' },
            { regex: /\bmill\b/gi, val: 'send from Deck to Graveyard' },
            { regex: /\bbounce\b/gi, val: 'return to hand' },
            { regex: /\bspin\b/gi, val: 'return to Deck' },
            { regex: /\bsearch\b/gi, val: 'add to your hand' },
            { regex: /\btribute\b/gi, val: 'Tribute' }
        ];

        replacements.forEach(r => {
            t = t.replace(r.regex, r.val);
        });

        // Sentence case fix for the very first letter if needed, 
        // though usually JSON is capitalized.
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    static highlightKeywords(text, nameMap, color, isDark) {
        let processed = text;
        const names = Object.values(nameMap).sort((a, b) => b.length - a.length);
        const hoverColor = isDark ? '#fff' : '#000';

        names.forEach(name => {
            if (processed.includes(name)) {
                // Escape special regex chars in card names (like parentheses)
                const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedName, 'g');

                processed = processed.replace(regex,
                    `<span class="font-bold border-b border-dotted cursor-help transition-colors" 
                           style="color: ${color}; border-color: ${color}80;"
                           onmouseover="this.style.color='${hoverColor}'" 
                           onmouseout="this.style.color='${color}'">${name}</span>`
                );
            }
        });
        return processed;
    }
}

class DuelSimulator {
    constructor(containerId, comboData) {
        this.containerId = containerId;
        this.combos = comboData;
        this.currentComboId = Object.keys(comboData)[0];
        this.currentStep = 0;
        this.isPlaying = false;
        this.interval = null;
        this.cards = {};
        this.speed = 1200;
        this.resizeObserver = null;

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. Render Board
        this.renderBoard(container);

        // 2. Cache Elements
        this.tokenLayer = container.querySelector('.token-layer');
        this.logEl = container.querySelector('.sim-log');
        this.boardEl = container.querySelector('.duel-board');
        this.playBtn = container.querySelector('.btn-play');

        // NOTE: Removed internal createPopup(). Using global CardLoader.showPopup instead.

        // 3. Resize Observer (Keeps cards aligned when tabs change)
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                if (this.boardEl.offsetParent !== null) this.repositionCards();
            });
            this.resizeObserver.observe(this.boardEl);
        }

        // 4. Start Loading
        this.loadCombo(this.currentComboId);

        // FIX: Ensure cards are positioned correctly after board is fully rendered.
        setTimeout(() => this.repositionCards(), 50);
        setTimeout(() => this.repositionCards(), 300); // Safety fallback

        // Trigger preload via CardLoader
        this.preloadAllImages();
    }

    async preloadAllImages() {
        if (typeof window.CardLoader === 'undefined') return;
        const names = new Set();
        Object.values(this.combos).forEach(c => c.cards.forEach(card => names.add(card.name)));
        // Use the robust CardLoader to handle API calls and caching
        window.CardLoader.preloadCards(Array.from(names));
    }

    renderBoard(container) {
        container.classList.add('duel-board-wrapper');
        container.innerHTML = `
            <div class="duel-board">
                <div class="field-grid">
                    <div class="empty-corner top-left"></div>
                    <div class="extra-monster-zones">
                        <div class="zone extra-monster-zone" id="zone-em-left"></div>
                        <div class="zone extra-monster-zone" id="zone-em-right"></div>
                    </div>
                    <div class="empty-corner top-right"></div>
                    
                    <div class="zone field-zone" id="zone-field"></div>
                    <div class="main-monster-zones">
                        <div class="zone main-monster-zone" id="zone-m1"></div>
                        <div class="zone main-monster-zone" id="zone-m2"></div>
                        <div class="zone main-monster-zone" id="zone-m3"></div>
                        <div class="zone main-monster-zone" id="zone-m4"></div>
                        <div class="zone main-monster-zone" id="zone-m5"></div>
                    </div>
                    <div class="zone gy-zone" id="zone-gy"></div>
                    
                    <div class="zone extra-deck-zone" id="zone-extra"></div>
                    <div class="spell-trap-zones">
                        <div class="zone spell-trap-zone" id="zone-s1"><div class="pendulum-icon blue">◆</div></div>
                        <div class="zone spell-trap-zone" id="zone-s2"></div>
                        <div class="zone spell-trap-zone" id="zone-s3"></div>
                        <div class="zone spell-trap-zone" id="zone-s4"></div>
                        <div class="zone spell-trap-zone" id="zone-s5"><div class="pendulum-icon red">◆</div></div>
                    </div>
                    <div class="zone deck-zone" id="zone-deck"></div>
                    <div class="zone banished-zone" id="zone-banish" style="display:none;"></div>
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

        const b = document.createElement('div');
        b.innerHTML = 'BETA';
        b.style.cssText = 'position:absolute; top:10px; right:10px; background:#ef4444; color:white; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.3); z-index:10; pointer-events:none;';
        container.appendChild(b);

        container.querySelector('.btn-reset').onclick = () => this.loadCombo(this.currentComboId);
        container.querySelector('.btn-prev').onclick = () => this.prevStep();
        container.querySelector('.btn-next').onclick = () => this.nextStep();
        container.querySelector('.btn-play').onclick = () => this.togglePlay();
    }

    loadCombo(id) {
        this.reset();
        this.currentComboId = id;
        const combo = this.combos[id];
        if (!combo) return;

        this.log(`Loaded: ${combo.title}`);

        // 1. Create Cards
        combo.cards.forEach(c => this.createCardToken(c));

        // 2. Fill Hand
        const hand = combo.cards.filter(c => c.zone === 'zone-hand');
        for (let i = 0; i < (5 - hand.length); i++) {
            this.createCardToken({
                id: `dummy-${i}`, name: "Random Card", type: "monster",
                zone: "zone-hand", isDummy: true
            });
        }

        requestAnimationFrame(() => this.repositionCards());
    }

    createCardToken(data) {
        const token = document.createElement('div');
        token.id = `token-${data.id}`;
        token.className = `card-token ctype-${data.type || 'monster'}`;

        // 1. Initialize with NO transition to prevent "flying in" on load
        token.style.transition = 'none';
        token.style.willChange = 'left, top, transform'; // Performance optimization

        // Helper to set background safely
        const setImg = (url) => {
            if (url) token.style.backgroundImage = `url('${url}')`;
        };

        // Case 1: Explicit Dummy / Placeholder
        if (data.isDummy || String(data.id).startsWith('dummy-') || String(data.name).toLowerCase().startsWith('any ')) {
            setImg("https://images.ygoprodeck.com/images/cards/back_high.jpg");
        }
        // Case 2: Use CardLoader to fetch URL (cached or API)
        else if (typeof window.CardLoader !== 'undefined') {
            // Set default back while loading
            setImg("https://images.ygoprodeck.com/images/cards/back_high.jpg");

            // Attempt to get the URL from CardLoader
            window.CardLoader.getCardImageUrl(data.name).then(url => {
                if (url) {
                    setImg(url);
                    // Only transition background if it changes later
                    // We check if transition is re-enabled first to avoid conflict
                    if (token.style.transition !== 'none') {
                        token.style.transition += ', background-image 0.3s ease';
                    }
                }
            });
        }

        this.tokenLayer.appendChild(token);
        this.cards[data.id] = { element: token, data: data };
        token.setAttribute('data-zone', data.zone || 'zone-deck');

        token.style.pointerEvents = 'auto';
        token.style.cursor = 'pointer';

        // 2. Snap to initial position immediately (Instant)
        this.setPosition(token, data.zone || 'zone-deck');

        // 3. Enable smooth transitions for future moves
        // We use a double requestAnimationFrame to ensure the initial 'none' has applied
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Apply smooth easing for movement
                token.style.transition = 'left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s, height 0.3s, opacity 0.3s, transform 0.3s';
            });
        });

        // Attach Click Event to Global CardLoader Popup
        token.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!data.isDummy && typeof window.CardLoader !== 'undefined') {
                window.CardLoader.showPopup(e, data.name);
            }
        });
    }

    setPosition(token, zoneId) {
        const wrapper = document.getElementById(this.containerId);
        const zone = wrapper.querySelector(`#${zoneId}`);
        const boardRect = this.boardEl.getBoundingClientRect();

        if (!zone || boardRect.width === 0) return;

        const zoneRect = zone.getBoundingClientRect();
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const w = isMobile ? 62 : 120;
        const h = isMobile ? 90 : 175;

        token.style.width = `${w}px`;
        token.style.height = `${h}px`;

        if (zoneId === 'zone-hand') {
            const handTokens = Array.from(this.tokenLayer.children).filter(t => t.getAttribute('data-zone') === 'zone-hand');
            const idx = handTokens.indexOf(token);
            const total = handTokens.length;
            const spacing = 5;
            const startX = (zoneRect.width - (total * w + (total - 1) * spacing)) / 2;

            token.style.left = (zoneRect.left - boardRect.left + startX + (idx * (w + spacing))) + 'px';
            token.style.top = (zoneRect.top - boardRect.top + (zoneRect.height - h) / 2) + 'px';
        } else {
            const jX = (zoneId.includes('gy') || zoneId.includes('deck')) ? (Math.random() * 4 - 2) : 0;
            const jY = (zoneId.includes('gy') || zoneId.includes('deck')) ? (Math.random() * 4 - 2) : 0;
            token.style.left = (zoneRect.left - boardRect.left + (zoneRect.width - w) / 2 + jX) + 'px';
            token.style.top = (zoneRect.top - boardRect.top + (zoneRect.height - h) / 2 + jY) + 'px';
        }
    }

    repositionCards() {
        Object.values(this.cards).forEach(c => {
            const z = c.element.getAttribute('data-zone') || c.data.zone;
            this.setPosition(c.element, z);
        });
    }

    moveCard(cardId, targetZoneId) {
        const c = this.cards[cardId];
        if (!c) return;

        const isToken = (c.data.type || '').toLowerCase().includes('token') || (c.data.name || '').toLowerCase().includes('token');
        const isLeaving = ['zone-gy', 'zone-deck', 'zone-hand', 'zone-banish'].includes(targetZoneId);

        if (c.vanishTimeout) {
            clearTimeout(c.vanishTimeout);
            c.vanishTimeout = null;
        }

        if (isToken && isLeaving) {
            this.log(`(Token removed)`);
            c.element.style.opacity = "0";
            c.element.style.transform = "scale(0.5)";
            c.vanishTimeout = setTimeout(() => c.element.style.display = 'none', 500);
            return;
        }

        c.element.style.display = 'block';
        c.element.style.opacity = '1';
        c.element.style.transform = 'scale(1)';

        // Ensure high Z-Index during movement so it flies OVER other cards
        c.element.style.zIndex = '100';

        if (!c.element.style.left) {
            const currentZone = c.element.getAttribute('data-zone') || c.data.zone;
            // Temporarily disable transition for initial placement if it was missing
            const originalTransition = c.element.style.transition;
            c.element.style.transition = 'none';
            this.setPosition(c.element, currentZone);
            void c.element.offsetWidth; // Force Browser Reflow
            c.element.style.transition = originalTransition;
        }

        c.element.setAttribute('data-zone', targetZoneId);

        this.setPosition(c.element, targetZoneId);
        if (targetZoneId === 'zone-hand' || c.data.zone === 'zone-hand') this.repositionCards();

        c.element.classList.add('active-card');

        // Remove Z-Index boost and active class after animation completes
        setTimeout(() => {
            c.element.classList.remove('active-card');
            c.element.style.zIndex = '';
        }, 600);
    }

    nextStep() {
        const steps = this.combos[this.currentComboId].steps;
        if (this.currentStep < steps.length) {
            const s = steps[this.currentStep];
            this.log(`> ${s.text}`);
            this.moveCard(s.card, s.to);
            this.currentStep++;
        } else {
            this.log("Combo Complete!");
            this.togglePlay(false);
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            const target = this.currentStep - 1;
            const oldLog = this.log;
            this.log = () => { };
            this.loadCombo(this.currentComboId);
            const steps = this.combos[this.currentComboId].steps;
            for (let i = 0; i < target; i++) this.moveCard(steps[i].card, steps[i].to);
            this.log = oldLog;
            this.currentStep = target;
            this.log(`< Rewound to Step ${target}`);
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

    togglePlay(force) {
        this.isPlaying = typeof force !== 'undefined' ? force : !this.isPlaying;
        this.updatePlayButton();
        if (this.isPlaying) this.interval = setInterval(() => this.nextStep(), this.speed);
        else clearInterval(this.interval);
    }

    updatePlayButton() {
        this.playBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Play';
        this.playBtn.classList.toggle('paused', this.isPlaying);
    }

    log(msg) {
        const d = document.createElement('div');
        d.className = 'log-entry';
        d.textContent = msg;
        this.logEl.appendChild(d);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }
}