// card-loader.js - Enhanced with Banlist Functionality
// Place this file in: /js/card-loader.js

/**
 * YuGiOh Card Loader Module with Banlist Integration
 * Handles fetching card data from API, displaying images, and checking banlist status
 */
const CardLoader = (function () {
    console.log('[CardLoader] IIFE started');
    
    // Configuration
    const CONFIG = {
        IMAGE_BASE_URL: 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/cards',
        API_URL: 'https://db.ygoprodeck.com/api/v7/cardinfo.php',
        BANLIST_API_URL: 'https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=tcg',
        IMAGE_EXTENSIONS: ['.png', '.jpg'],
    };

    // Internal state
    const cardDataCache = {};
    const banlistCache = {};
    let banlistData = null;
    let popup = null;
    let activePopup = null;
    let lastShown = 0;
    let currentCard = null;

    /**
     * Initialize the card loader system
     * Call this once when the page loads
     */
    function init() {
        createPopup();
        setupGlobalClickListener();
        console.log('CardLoader initialized');
        loadSuggestionForm();
    }

    /**
     * Creates the popup element if it doesn't exist
     */
    function createPopup() {
        popup = document.getElementById('card-popup');
        if (popup) return;

        popup = document.createElement('div');
        popup.id = 'card-popup';
        popup.className = 'fixed z-50 bg-gray-900 border-2 border-blue-500 text-white p-4 rounded-lg shadow-lg max-w-xs max-h-96 overflow-y-auto opacity-0 transition-opacity duration-200 pointer-events-none';
        popup.style.display = 'none';
        document.body.appendChild(popup);
    }

    /**
     * Setup global click listener to close popup
     */
    function setupGlobalClickListener() {
        document.addEventListener('click', hidePopup);
    }

    /**
     * Fetches and injects the suggestion form into the page.
     */
    async function loadSuggestionForm() {
        if (document.body.dataset.page === 'index') {
            console.log('Skipping suggestion form on index page');
            return;
        }

        try {
            const injectionPoint = document.querySelector('.container');
            if (!injectionPoint) {
                console.log('Form injection point not found.');
                return;
            }

            const response = await fetch('suggestion-form.html');
            if (!response.ok) {
                throw new Error('suggestion-form.html not found. Status: ' + response.status);
            }

            const formHTML = await response.text();
            const formSection = document.createElement('section');
            formSection.innerHTML = formHTML;
            injectionPoint.appendChild(formSection);

            const toggleBtn = document.getElementById('toggle-form-btn');
            const formContainer = document.getElementById('suggestion-form-container');
            const contextField = document.getElementById("form-page-context");

            if (!toggleBtn || !formContainer || !contextField) {
                console.error('Form toggle elements not found after injection.');
                return;
            }

            toggleBtn.addEventListener('click', () => {
                const isHidden = formContainer.style.display === 'none';
                if (isHidden) {
                    formContainer.style.display = 'block';
                    toggleBtn.innerHTML = '<i class="fas fa-times mr-2"></i> Hide Suggestion Form';
                } else {
                    formContainer.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="fas fa-edit mr-2"></i> Suggest an Improvement';
                }
            });

            let pageTitle = document.title;
            const h1 = document.querySelector('h1');
            if (h1) {
                pageTitle = h1.innerText;
            }
            contextField.value = pageTitle;

        } catch (error) {
            console.error('Failed to load suggestion form:', error);
        }
    }

    /**
     * Fetch banlist data from YGOProDeck API
     * Returns a map of card names to their banlist status
     */
    async function fetchBanlistData() {
        if (banlistData) {
            return banlistData;
        }

        try {
            console.log('[CardLoader] Fetching banlist from API...');
            const response = await fetch(CONFIG.BANLIST_API_URL);
            
            if (!response.ok) {
                throw new Error(`Banlist API returned status ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid banlist API response format');
            }

            // Create a map of card name -> banlist status
            const banlistMap = {};
            data.data.forEach(card => {
                if (card.banlist_info && card.banlist_info.ban_tcg) {
                    const status = card.banlist_info.ban_tcg;
                    // Map API status to our format
                    if (status === 'Banned') {
                        banlistMap[card.name] = 'Forbidden';
                    } else if (status === 'Limited') {
                        banlistMap[card.name] = 'Limited';
                    } else if (status === 'Semi-Limited') {
                        banlistMap[card.name] = 'Semi-Limited';
                    }
                }
            });

            banlistData = banlistMap;
            console.log('[CardLoader] Banlist loaded successfully. Total restricted cards:', Object.keys(banlistMap).length);
            return banlistMap;
        } catch (error) {
            console.error('Failed to fetch banlist data:', error);
            // Return empty object on error
            return {};
        }
    }

    /**
     * Load a single card into a container
     */
    async function loadCard(cardName, containerId) {
        console.log('[CardLoader] loadCard called for:', cardName, 'container:', containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container not found: ${containerId}`);
            return;
        }

        container.addEventListener('click', (event) => {
            event.stopPropagation();
            showPopup(event, cardName);
        });

        try {
            if (cardDataCache[cardName]) {
                displayCardImage(cardDataCache[cardName], container);
                return;
            }

            const cardInfo = await fetchCardData(cardName);

            if (cardInfo) {
                cardInfo.hosted_image_url = `${CONFIG.IMAGE_BASE_URL}/${cardInfo.id}.png`;
                cardDataCache[cardName] = cardInfo;
                displayCardImage(cardInfo, container);
            } else {
                throw new Error('Card data not found');
            }
        } catch (error) {
            console.error(`Failed to load card "${cardName}":`, error);
            container.innerHTML = `<div class="card-placeholder">${cardName}</div>`;
        }
    }

    /**
     * Load multiple cards at once
     */
    async function loadCards(cardMap) {
        console.log('[CardLoader] loadCards called with:', cardMap);
        const promises = Object.entries(cardMap).map(([containerId, cardName]) =>
            loadCard(cardName, containerId)
        );
        await Promise.all(promises);
    }

    /**
     * Fetch card data from API
     */
    async function fetchCardData(cardName) {
        const apiUrl = `${CONFIG.API_URL}?name=${encodeURIComponent(cardName)}`;
        console.log("[CardLoader] fetchCardData called for:", cardName, "URL:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data?.data?.[0];
    }

    /**
     * Display card image in container
     */
    function displayCardImage(cardInfo, container) {
        const imageUrl = cardInfo.hosted_image_url;

        if (!imageUrl) {
            container.innerHTML = `<div class="card-placeholder">${cardInfo.name}</div>`;
            return;
        }

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = cardInfo.name;
        img.className = 'w-full h-auto rounded-lg shadow-md';

        img.onerror = function () {
            if (imageUrl.endsWith('.png')) {
                const jpgUrl = imageUrl.replace('.png', '.jpg');
                console.warn(`PNG not found, trying JPG: ${jpgUrl}`);
                img.src = jpgUrl;
                img.onerror = function () {
                    console.error(`Image not found: ${cardInfo.name} (ID: ${cardInfo.id})`);
                    container.innerHTML = `<div class="card-placeholder">${cardInfo.name}<br><small>Missing: ${cardInfo.id}</small></div>`;
                };
            } else {
                console.error(`Image not found: ${cardInfo.name} (ID: ${cardInfo.id})`);
                container.innerHTML = `<div class="card-placeholder">${cardInfo.name}<br><small>Missing: ${cardInfo.id}</small></div>`;
            }
        };

        container.innerHTML = '';
        container.appendChild(img);
    }

    /**
     * Show popup with card details
     */
    function showPopup(event, cardName) {
        if (currentCard === cardName) {
            hidePopup();
            return;
        }

        hidePopup();
        if (!popup) return;

        const cardInfo = cardDataCache[cardName];
        if (!cardInfo) return;

        let stats = '';
        let atkDef = [];
        if (cardInfo.atk !== undefined) atkDef.push(`ATK/${cardInfo.atk}`);
        if (cardInfo.def !== undefined) atkDef.push(`DEF/${cardInfo.def}`);
        if (cardInfo.linkval) atkDef.push(`LINK-${cardInfo.linkval}`);
        if (atkDef.length > 0) {
            stats = `<p class="mt-2 text-yellow-400 font-bold">${atkDef.join(' ')}</p>`;
        }

        const cardType = cardInfo.type.includes('Monster')
            ? `[${cardInfo.race} / ${cardInfo.type.replace(' Monster', '')}]`
            : `[${cardInfo.race} Card]`;

        popup.innerHTML = `
            <div>
                <h3 class="text-blue-400 font-bold text-lg mb-2">${cardInfo.name}</h3>
                <p class="text-xs text-gray-300">${cardType}</p>
                <div class="w-full h-px bg-blue-500 my-2"></div>
                <p class="text-xs text-white">${cardInfo.desc.replace(/\r\n/g, '<br>')}</p>
                ${stats}
            </div>
        `;

        movePopup(event);
        popup.style.display = 'block';
        setTimeout(() => { popup.style.opacity = 1; }, 10);
        activePopup = popup;
        lastShown = Date.now();
        currentCard = cardName;
    }

    /**
     * Hide the popup
     */
    function hidePopup() {
        if (Date.now() - lastShown < 100) return;
        if (activePopup) {
            activePopup.style.opacity = 0;
            setTimeout(() => {
                if (activePopup) activePopup.style.display = 'none';
            }, 200);
            activePopup = null;
            currentCard = null;
        }
    }

    /**
     * Position popup near cursor
     */
    function movePopup(event) {
        if (!popup) return;

        const popupWidth = popup.offsetWidth;
        const popupHeight = popup.offsetHeight;
        const cushion = 20;

        let x = event.clientX + cushion;
        let y = event.clientY + cushion;

        if (x + popupWidth > window.innerWidth) {
            x = event.clientX - popupWidth - cushion;
        }
        if (y + popupHeight > window.innerHeight) {
            y = event.clientY - popupHeight - cushion;
        }

        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
    }

    /**
     * Preload card data for faster display
     */
    async function preloadCards(cardNames) {
        const promises = cardNames.map(async (cardName) => {
            if (cardDataCache[cardName]) return;

            try {
                const cardInfo = await fetchCardData(cardName);
                if (cardInfo) {
                    cardInfo.hosted_image_url = `${CONFIG.IMAGE_BASE_URL}/${cardInfo.id}.jpg`;
                    cardDataCache[cardName] = cardInfo;
                }
            } catch (error) {
                console.warn(`Failed to preload card: ${cardName}`, error);
            }
        });

        await Promise.all(promises);
        console.log(`Preloaded ${cardNames.length} cards`);
    }

    // ========================================
    // BANLIST FUNCTIONALITY
    // ========================================

    /**
     * Fetch all banned cards from the API
     * @returns {Promise<Object>} Object mapping card names to their banlist status
     */
    async function fetchBanlistData() {
        if (Object.keys(banlistCache).length > 0) {
            return banlistCache;
        }

        try {
            const response = await fetch(CONFIG.BANLIST_API_URL);
            if (!response.ok) {
                throw new Error(`Banlist API error: ${response.status}`);
            }

            const data = await response.json();
            const bannedCards = data.data;

            bannedCards.forEach(card => {
                if (card.banlist_info && card.banlist_info.ban_tcg) {
                    banlistCache[card.name] = card.banlist_info.ban_tcg;
                }
            });

            console.log('[CardLoader] Banlist data cached:', Object.keys(banlistCache).length, 'cards');
            return banlistCache;
        } catch (error) {
            console.error('[CardLoader] Failed to fetch banlist data:', error);
            return {};
        }
    }

    /**
     * Check banlist status for specific cards
     * @param {Array<string>} cardNames - Array of card names to check
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} Object with categorized banned cards
     */
    async function checkBanlistStatus(cardNames, options = {}) {
        const defaults = {
            includeRelated: true, // Include synergistic cards
            relatedCards: [], // Additional cards to check (e.g., generic staples)
        };

        const config = { ...defaults, ...options };
        const allCardsToCheck = [...cardNames];
        
        if (config.includeRelated && config.relatedCards.length > 0) {
            allCardsToCheck.push(...config.relatedCards);
        }

        const banlist = await fetchBanlistData();

        const result = {
            forbidden: [],
            limited: [],
            semiLimited: [],
            unrestricted: [],
            hasRestrictions: false,
        };

        allCardsToCheck.forEach(cardName => {
            const status = banlist[cardName];
            
            if (status === 'Forbidden') {
                result.forbidden.push(cardName);
                result.hasRestrictions = true;
            } else if (status === 'Limited') {
                result.limited.push(cardName);
                result.hasRestrictions = true;
            } else if (status === 'Semi-Limited') {
                result.semiLimited.push(cardName);
                result.hasRestrictions = true;
            } else {
                result.unrestricted.push(cardName);
            }
        });

        return result;
    }

    /**
     * Render banlist section in a container
     * @param {string} containerId - ID of container element
     * @param {Array<string>} archetypeCards - Array of archetype card names
     * @param {Object} options - Configuration options
     */
    async function renderBanlistSection(containerId, cards, options) {
                const container = document.getElementById(containerId);
                
                // Show loading state
                container.innerHTML = '<div class="card p-6 bg-gray-800"><p class="text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading banlist data...</p></div>';
                
                // Fetch real banlist data from API
                const banlist = await fetchBanlistData();
                
                // Check which cards are banned
                const forbidden = cards.filter(c => banlist[c] === 'Forbidden');
                const limited = cards.filter(c => banlist[c] === 'Limited');
                const semiLimited = cards.filter(c => banlist[c] === 'Semi-Limited');
                const relatedForbidden = (options.relatedCards || []).filter(c => banlist[c] === 'Forbidden');
                const relatedLimited = (options.relatedCards || []).filter(c => banlist[c] === 'Limited');
                const relatedSemiLimited = (options.relatedCards || []).filter(c => banlist[c] === 'Semi-Limited');
                
                const hasRestrictions = forbidden.length > 0 || limited.length > 0 || semiLimited.length > 0;
                const hasRelatedRestrictions = relatedForbidden.length > 0 || relatedLimited.length > 0 || relatedSemiLimited.length > 0;
                
                // Extract archetype traits for dynamic messaging
                const traits = options.archetypeTraits || {};
                
                let html = '';
                
                if (!hasRestrictions && !hasRelatedRestrictions) {
                    // Auto-generated unrestricted message with optional traits
                    let unrestrictedMsg = '';
                    if (traits.coreMechanic) {
                        unrestrictedMsg = `The ${options.archetypeName} archetype, with its ${traits.coreMechanic}, operates at full power with no restrictions on the current TCG banlist.`;
                    } else {
                        unrestrictedMsg = `As of the current TCG format, the ${options.archetypeName} archetype is entirely unrestricted, allowing it to operate at full capacity.`;
                    }
                    
                    html = `
                        <div class="card p-6 bg-gray-800">
                            <p class="text-center text-lg mb-4 text-gray-300">
                                ${unrestrictedMsg}
                            </p>
                            <div class="mt-4 p-3 bg-green-900 bg-opacity-50 rounded border-l-4 border-green-500">
                                <p class="text-sm text-green-200">
                                    <strong class="font-bold">Fully Unrestricted:</strong> 
                                    All core "${options.archetypeName}" cards are currently at 3 copies per deck, allowing for maximum consistency and power.
                                </p>
                            </div>
                        </div>
                    `;
                } else if (!hasRestrictions && hasRelatedRestrictions) {
                    // Archetype is fine, but related cards are hit
                    let relatedImpactMsg = '';
                    if (traits.supportReliance) {
                        relatedImpactMsg = `While the ${options.archetypeName} core remains untouched, the archetype's ${traits.supportReliance} means restrictions on generic support cards do have an impact.`;
                    } else {
                        relatedImpactMsg = `The ${options.archetypeName} archetype itself is largely untouched by the TCG banlist, but key synergistic cards it relies on are affected.`;
                    }
                    
                    html = `
                        <div class="card p-6 bg-gray-800">
                            <p class="text-gray-300 mb-4 text-center">
                                ${relatedImpactMsg}
                            </p>
                    `;
                    
                    // Show only related cards section
                    html += `<div><h3 class="text-lg font-semibold text-white mb-3 text-center"><i class="fas fa-link mr-2"></i>Affected Synergistic Cards</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
                    
                    if (relatedForbidden.length > 0) {
                        html += `
                            <div class="card combo-step-card p-4 border-l-4 border-red-500 bg-gray-900">
                                <h4 class="text-md font-bold text-red-500 mb-2">Forbidden</h4>
                                <ul class="list-disc list-inside space-y-1 text-xs text-gray-300">
                                    ${relatedForbidden.map(c => `<li class="text-red-400">${c}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    
                    if (relatedLimited.length > 0) {
                        html += `
                            <div class="card combo-step-card p-4 border-l-4 border-yellow-500 bg-gray-900">
                                <h4 class="text-md font-bold text-yellow-500 mb-2">Limited</h4>
                                <ul class="list-disc list-inside space-y-1 text-xs text-gray-300">
                                    ${relatedLimited.map(c => `<li class="text-yellow-400">${c}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    
                    if (relatedSemiLimited.length > 0) {
                        html += `
                            <div class="card combo-step-card p-4 border-l-4 border-orange-500 bg-gray-900">
                                <h4 class="text-md font-bold text-orange-500 mb-2">Semi-Limited</h4>
                                <ul class="list-disc list-inside space-y-1 text-xs text-gray-300">
                                    ${relatedSemiLimited.map(c => `<li class="text-orange-400">${c}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    
                    html += `</div></div>`;
                    
                    // Auto-generated meta implications for related cards
                    if (options.customMessages?.metaImplications) {
                        html += `
                            <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 rounded border-l-4 border-yellow-500">
                                <p class="text-sm text-gray-300">
                                    <strong>Meta Implications:</strong> ${options.customMessages.metaImplications}
                                </p>
                            </div>
                        `;
                    } else if (traits.adaptability) {
                        html += `
                            <div class="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded border-l-4 border-blue-500">
                                <p class="text-sm text-gray-300">
                                    <strong>Meta Implications:</strong> Despite restrictions on support cards, ${options.archetypeName}'s ${traits.adaptability} allows it to remain competitive with adjusted builds.
                                </p>
                            </div>
                        `;
                    }
                    
                    html += `</div>`;
                } else {
                    // Auto-generated restricted message
                    const impactLevel = forbidden.length > 1 ? 'HIGH IMPACT' : 
                                       forbidden.length === 1 ? 'SIGNIFICANT IMPACT' :
                                       limited.length > 1 ? 'MODERATE IMPACT' : 'LOW IMPACT';
                    
                    const impactColor = forbidden.length > 0 ? 'red' : 'yellow';
                    
                    // Enhanced intro with traits
                    let autoIntro = '';
                    if (options.customMessages?.intro) {
                        autoIntro = options.customMessages.intro;
                    } else if (traits.keyLoss && forbidden.length > 0) {
                        autoIntro = `The loss of ${forbidden[0]}${forbidden.length > 1 ? ` and ${forbidden.length - 1} other card${forbidden.length > 2 ? 's' : ''}` : ''} directly impacts the archetype's ${traits.keyLoss}.`;
                    } else if (forbidden.length > 1) {
                        autoIntro = `The ${options.archetypeName} archetype has been significantly impacted by the TCG banlist, with ${forbidden.length} cards forbidden.`;
                    } else if (forbidden.length === 1) {
                        autoIntro = `The ${options.archetypeName} archetype has been impacted by the TCG banlist, with one card forbidden.`;
                    } else {
                        autoIntro = `The ${options.archetypeName} archetype has been moderately restricted by the TCG banlist, with ${limited.length} card${limited.length > 1 ? 's' : ''} limited.`;
                    }
                    
                    html = `
                        <div class="card p-6 bg-gray-800">
                            <p class="text-gray-300 mb-4 text-center">
                                <strong class="text-${impactColor}-500 font-bold">${impactLevel}:</strong> ${autoIntro}
                            </p>
                    `;
                    
                    // Archetype restrictions
                    if (forbidden.length > 0 || limited.length > 0 || semiLimited.length > 0) {
                        html += `<div class="mb-4"><h3 class="text-lg font-semibold text-white mb-3"><i class="fas fa-layer-group mr-2"></i>Archetype Cards</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
                        
                        if (forbidden.length > 0) {
                            html += `
                                <div class="card combo-step-card p-4 bg-gray-900">
                                    <h4 class="text-lg font-bold text-red-500 mb-2">
                                        <i class="fas fa-ban mr-2"></i>Forbidden (0 copies)
                                    </h4>
                                    <ul class="list-disc list-inside space-y-1 text-sm text-gray-300">
                                        ${forbidden.map(c => `<li><strong class="text-red-400">${c}</strong></li>`).join('')}
                                    </ul>
                                </div>
                            `;
                        }
                        
                        if (limited.length > 0) {
                            html += `
                                <div class="card combo-step-card p-4 bg-gray-900">
                                    <h4 class="text-lg font-bold text-yellow-500 mb-2">
                                        <i class="fas fa-exclamation-triangle mr-2"></i>Limited (1 copy)
                                    </h4>
                                    <ul class="list-disc list-inside space-y-1 text-sm text-gray-300">
                                        ${limited.map(c => `<li><strong class="text-yellow-400">${c}</strong></li>`).join('')}
                                    </ul>
                                </div>
                            `;
                        }
                        
                        if (semiLimited.length > 0) {
                            html += `
                                <div class="card combo-step-card p-4 bg-gray-900">
                                    <h4 class="text-lg font-bold text-orange-500 mb-2">
                                        <i class="fas fa-exclamation-circle mr-2"></i>Semi-Limited (2 copies)
                                    </h4>
                                    <ul class="list-disc list-inside space-y-1 text-sm text-gray-300">
                                        ${semiLimited.map(c => `<li><strong class="text-orange-400">${c}</strong></li>`).join('')}
                                    </ul>
                                </div>
                            `;
                        }
                        
                        html += `</div></div>`;
                    }
                    
                    // Related cards
                    if (relatedForbidden.length > 0 || relatedLimited.length > 0 || relatedSemiLimited.length > 0) {
                        html += `<div class="mt-4"><h3 class="text-lg font-semibold text-white mb-3"><i class="fas fa-link mr-2"></i>Synergistic Cards</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
                        
                        if (relatedForbidden.length > 0) {
                            html += `
                                <div class="card combo-step-card p-4 border-l-4 border-red-500 bg-gray-900">
                                    <h4 class="text-md font-bold text-red-500 mb-2">Forbidden</h4>
                                    <ul class="list-disc list-inside space-y-1 text-xs text-gray-300">
                                        ${relatedForbidden.map(c => `<li class="text-red-400">${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                        }
                        
                        if (relatedLimited.length > 0) {
                            html += `
                                <div class="card combo-step-card p-4 border-l-4 border-yellow-500 bg-gray-900">
                                    <h4 class="text-md font-bold text-yellow-500 mb-2">Limited</h4>
                                    <ul class="list-disc list-inside space-y-1 text-xs text-gray-300">
                                        ${relatedLimited.map(c => `<li class="text-yellow-400">${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                        }
                        
                        if (relatedSemiLimited.length > 0) {
                            html += `
                                <div class="card combo-step-card p-4 border-l-4 border-orange-500 bg-gray-900">
                                    <h4 class="text-md font-bold text-orange-500 mb-2">Semi-Limited</h4>
                                    <ul class="list-disc list-inside space-y-1 text-xs text-gray-300">
                                        ${relatedSemiLimited.map(c => `<li class="text-orange-400">${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                        }
                        
                        html += `</div></div>`;
                    }
                    
                    // Auto-generated meta implications with traits
                    if (options.customMessages?.metaImplications) {
                        html += `
                            <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 rounded border-l-4 border-yellow-500">
                                <p class="text-sm text-gray-300">
                                    <strong>Meta Implications:</strong> ${options.customMessages.metaImplications}
                                </p>
                            </div>
                        `;
                    } else if (traits.resilience && forbidden.length === 0) {
                        // Limited cards only - can highlight resilience
                        html += `
                            <div class="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded border-l-4 border-blue-500">
                                <p class="text-sm text-gray-300">
                                    <strong>Meta Implications:</strong> Thanks to its ${traits.resilience}, ${options.archetypeName} remains competitive despite the limitation${limited.length > 1 ? 's' : ''}.
                                </p>
                            </div>
                        `;
                    } else if (traits.alternativeStrategy && forbidden.length > 0) {
                        // Forbidden cards - can suggest alternatives
                        html += `
                            <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 rounded border-l-4 border-yellow-500">
                                <p class="text-sm text-gray-300">
                                    <strong>Meta Implications:</strong> While the loss of key cards is significant, ${options.archetypeName} players can adapt by ${traits.alternativeStrategy}.
                                </p>
                            </div>
                        `;
                    } else if (forbidden.length > 0) {
                        const cardList = forbidden.join(', ');
                        html += `
                            <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 rounded border-l-4 border-yellow-500">
                                <p class="text-sm text-gray-300">
                                    <strong>Meta Implications:</strong> The loss of ${cardList} significantly impacts the archetype's power level and consistency. Players will need to adapt their strategies accordingly.
                                </p>
                            </div>
                        `;
                    }
                    
                    html += `</div>`;
                }
                
                container.innerHTML = html;
            }    

    /**
     * Get cached card data
     */
    function getCachedCard(cardName) {
        return cardDataCache[cardName] || null;
    }

    /**
     * Clear the cache
     */
    function clearCache() {
        Object.keys(cardDataCache).forEach(key => delete cardDataCache[key]);
        Object.keys(banlistCache).forEach(key => delete banlistCache[key]);
        console.log('Card cache and banlist cache cleared');
    }

    /**
     * Update configuration
     */
    function configure(newConfig) {
        Object.assign(CONFIG, newConfig);
        console.log('CardLoader configuration updated:', CONFIG);
    }

    // Public API
    console.log('[CardLoader] IIFE about to return public API');
    return {
        init,
        loadCard,
        loadCards,
        preloadCards,
        getCachedCard,
        clearCache,
        configure,
        showPopup,
        cardDataCache,
        // Banlist methods
        fetchBanlistData,
        checkBanlistStatus,
        renderBanlistSection,
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', CardLoader.init);
} else {
    CardLoader.init();
}