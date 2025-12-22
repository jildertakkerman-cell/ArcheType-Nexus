// card-loader.js - Enhanced with Banlist Functionality & Dummy Card Support
// Place this file in: /js/card-loader.js

/**
 * YuGiOh Card Loader Module with Banlist Integration
 * Handles fetching card data from API, displaying images, and checking banlist status
 */
window.CardLoader = (function () {
    console.log('[CardLoader] IIFE started');

    // Configuration
    const CONFIG = {
        IMAGE_BASE_URL: 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/cards',
        API_URL: 'https://db.ygoprodeck.com/api/v7/cardinfo.php',
        BANLIST_API_URLS: {
            tcg: 'https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=tcg',
            ocg: 'https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=ocg',
            masterduel: 'https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=masterduel'
        },
        BANLIST_API_URL: 'https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=tcg', // Legacy support
        IMAGE_EXTENSIONS: ['.png', '.jpg'],
        CARD_BACK_URL: 'https://images.ygoprodeck.com/images/cards/back_high.jpg'
    };

    // Banlist format display names and icons
    // NOTE: Full class names must be spelled out for Tailwind to detect them at build time
    const BANLIST_FORMATS = {
        tcg: {
            name: 'TCG',
            icon: 'fa-globe-americas',
            color: 'blue',
            activeClasses: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-2 border-blue-400',
            inactiveClasses: 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-500 hover:text-gray-200'
        },
        ocg: {
            name: 'OCG',
            icon: 'fa-globe-asia',
            color: 'red',
            activeClasses: 'bg-red-600 text-white shadow-lg shadow-red-500/30 border-2 border-red-400',
            inactiveClasses: 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-500 hover:text-gray-200'
        },
        masterduel: {
            name: 'Master Duel',
            icon: 'fa-gamepad',
            color: 'purple',
            activeClasses: 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-2 border-purple-400',
            inactiveClasses: 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-500 hover:text-gray-200'
        }
    };

    // Internal state
    const cardDataCache = {};
    const banlistCache = {
        tcg: {},
        ocg: {},
        masterduel: {}
    };
    const discordLinksCache = {};
    let banlistData = null;
    let currentBanlistFormat = 'tcg'; // Default format
    let popup = null;
    let activePopup = null;
    let lastShown = 0;
    let currentCard = null;
    // Debug toggle for development — when true, material extraction steps are logged
    let debugMaterials = false;
    let initialized = false;

    /**
     * Initialize the card loader system
     * Call this once when the page loads
     */
    function init() {
        if (initialized) {
            console.log('CardLoader already initialized, skipping');
            return;
        }
        initialized = true;
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

        // Helper to apply responsive constraints
        const applyConstraints = (el) => {
            // Use less margin on mobile to prevent unneeded scrolling
            // 16px total margin (8px each side) for mobile, 400px max width for desktop
            el.style.maxWidth = 'min(400px, calc(100vw - 16px))';
            el.style.maxHeight = 'min(600px, calc(100vh - 20px))';
        };

        if (popup) {
            applyConstraints(popup);
            return;
        }

        popup = document.createElement('div');
        popup.id = 'card-popup';
        popup.className = 'z-50 bg-gray-900 border-2 border-blue-500 text-white p-4 rounded-lg shadow-lg opacity-0 transition-opacity duration-200 pointer-events-none';
        popup.style.position = 'fixed';
        popup.style.display = 'none';
        // Use 100% width so it expands to fill the maxWidth constraint
        // This ensures it uses the full available space on mobile
        popup.style.width = '100%';
        applyConstraints(popup);
        document.body.appendChild(popup);
    }

    /**
     * Setup global click listener to close popup
     */
    function setupGlobalClickListener() {
        document.addEventListener('click', (event) => {
            // Don't hide popup if clicking inside it
            if (popup && popup.contains(event.target)) {
                return;
            }
            hidePopup();
        });
    }

    /**
     * Fetches and injects the suggestion form into the page.
     */
    async function loadSuggestionForm() {
        if (document.body.dataset.page === 'index') {
            console.log('Skipping suggestion form on index page');
            return;
        }

        // Check if form already exists to prevent duplicates
        if (document.getElementById('toggle-form-btn')) {
            console.log('Suggestion form already loaded, skipping injection.');
            return;
        }

        try {
            const injectionPoint = document.body;
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
     * @param {string} format - The format to fetch ('tcg', 'ocg', or 'masterduel')
     * @returns {Promise<Object>} Object mapping card names to their banlist status
     */
    async function fetchBanlistData(format = 'tcg') {
        // Validate format
        if (!CONFIG.BANLIST_API_URLS[format]) {
            console.warn(`[CardLoader] Invalid banlist format: ${format}, defaulting to tcg`);
            format = 'tcg';
        }

        // Return cached data if available
        if (Object.keys(banlistCache[format]).length > 0) {
            return banlistCache[format];
        }

        try {
            // First, try to load from local banlist.json (primary source - manually maintained)
            console.log(`[CardLoader] Fetching ${format.toUpperCase()} banlist from local JSON...`);
            const localResponse = await fetch('../assets/data/banlist.json');

            if (localResponse.ok) {
                const localData = await localResponse.json();

                if (localData[format]) {
                    const banlistMap = {};

                    // Process forbidden cards
                    if (localData[format].forbidden && Array.isArray(localData[format].forbidden)) {
                        localData[format].forbidden.forEach(cardName => {
                            banlistMap[cardName] = 'Forbidden';
                        });
                    }

                    // Process limited cards
                    if (localData[format].limited && Array.isArray(localData[format].limited)) {
                        localData[format].limited.forEach(cardName => {
                            banlistMap[cardName] = 'Limited';
                        });
                    }

                    // Process semi-limited cards
                    if (localData[format].semiLimited && Array.isArray(localData[format].semiLimited)) {
                        localData[format].semiLimited.forEach(cardName => {
                            banlistMap[cardName] = 'Semi-Limited';
                        });
                    }

                    banlistCache[format] = banlistMap;
                    console.log(`[CardLoader] ${format.toUpperCase()} banlist loaded from local JSON. Last updated: ${localData.lastUpdated || 'unknown'}. Total restricted cards:`, Object.keys(banlistMap).length);
                    return banlistMap;
                }
            }

            // Fallback to API if local file fails or is missing
            console.log(`[CardLoader] Local banlist not found, falling back to API for ${format.toUpperCase()}...`);
            const response = await fetch(CONFIG.BANLIST_API_URLS[format]);

            if (!response.ok) {
                throw new Error(`Banlist API returned status ${response.status}`);
            }

            const data = await response.json();

            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid banlist API response format');
            }

            // Determine which banlist_info key to use based on format
            const banlistKey = format === 'tcg' ? 'ban_tcg' :
                format === 'ocg' ? 'ban_ocg' :
                    'ban_masterduel';

            // Create a map of card name -> banlist status
            const banlistMap = {};
            data.data.forEach(card => {
                if (card.banlist_info && card.banlist_info[banlistKey]) {
                    const status = card.banlist_info[banlistKey];
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

            banlistCache[format] = banlistMap;
            console.log(`[CardLoader] ${format.toUpperCase()} banlist loaded from API. Total restricted cards:`, Object.keys(banlistMap).length);
            return banlistMap;
        } catch (error) {
            console.error(`Failed to fetch ${format} banlist data:`, error);
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

        // Handle dummy cards (e.g. "dummy-0", "Any Water Card", "Any Card")
        // Checks if name starts with 'dummy-' or 'any ' (case insensitive)
        const lowerName = cardName.toLowerCase();
        if (lowerName.startsWith('dummy-') || lowerName.startsWith('any ')) {
            const dummyInfo = {
                id: cardName,
                name: cardName, // Keeps the capitalization passed in (e.g., "Any Water Card")
                desc: 'A generic placeholder card used to represent non-specific requirements.',
                type: 'Normal Monster', // Default type to ensure popup works
                race: 'Normal', // Default race
                is_dummy: true,
                hosted_image_url: CONFIG.CARD_BACK_URL
            };

            cardDataCache[cardName] = dummyInfo;

            // Allow popup on dummy cards so users can see the name they clicked
            container.addEventListener('click', (event) => {
                event.stopPropagation();
                showPopup(event, cardName);
            });

            displayCardImage(dummyInfo, container);
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
     * Get card image URL by name
     */
    async function getCardImageUrl(cardName) {
        try {
            const cardInfo = await fetchCardData(cardName);
            if (!cardInfo) return null;
            // Construct and return the hosted image URL using the same format as loadCard()
            return `${CONFIG.IMAGE_BASE_URL}/${cardInfo.id}.png`;
        } catch (error) {
            console.error(`Failed to get image URL for "${cardName}":`, error);
            return null;
        }
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
    async function displayCardImage(cardInfo, container) {
        const imageUrl = cardInfo.hosted_image_url;
        if (!imageUrl) {
            container.innerHTML = `<div class="card-placeholder">${cardInfo.name}</div>`;
            return;
        }

        // Check banlist status using the currently selected format (TCG, OCG, or Master Duel)
        let banStatus = null;
        if (!cardInfo.is_dummy && typeof fetchBanlistData === 'function') {
            // Fetch banlist for the current format (uses cache if available)
            const currentBanlist = await fetchBanlistData(currentBanlistFormat);
            // Case-insensitive lookup
            banStatus = currentBanlist[cardInfo.name] || (() => {
                const lowerName = cardInfo.name.toLowerCase();
                for (const [key, status] of Object.entries(currentBanlist)) {
                    if (key.toLowerCase() === lowerName) {
                        return status;
                    }
                }
                return null;
            })();
        }

        // Clear container before rendering
        container.innerHTML = '';

        // Create wrapper for image and badge
        const cardWrapper = document.createElement('div');
        cardWrapper.style.position = 'relative';
        cardWrapper.style.display = 'flex';
        cardWrapper.style.flexDirection = 'column';
        cardWrapper.style.alignItems = 'center';
        cardWrapper.style.width = '100%';

        // Create image element
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = cardInfo.name;
        img.className = 'w-full h-auto rounded-lg shadow-md';

        // --- Anti-Aliasing & Image Quality Restoration ---
        // These properties ensure large images look smooth when squished down
        img.style.imageRendering = 'high-quality'; // Modern standard
        img.style.imageRendering = '-webkit-optimize-contrast'; // Legacy chrome fix
        img.style.transform = 'translateZ(0)'; // Force GPU compositing/smoothing
        img.style.backfaceVisibility = 'hidden'; // Prevents jagged edges during transforms
        // -------------------------------------------------

        img.onerror = function () {
            // If it's a dummy card (card back), we don't need to try alternative APIs
            if (cardInfo.is_dummy) return;

            const publicApiUrl = `https://images.ygoprodeck.com/images/cards/${cardInfo.id}.jpg`;

            // If we haven't tried the public API yet
            if (img.src !== publicApiUrl) {
                console.warn(`Custom bucket image failed for ${cardInfo.name}, trying public API: ${publicApiUrl}`);
                img.src = publicApiUrl;
            } else {
                // Both custom and public failed
                console.error(`Image not found in both custom bucket and public API: ${cardInfo.name} (ID: ${cardInfo.id})`);
                container.innerHTML = `<div class="card-placeholder">${cardInfo.name}<br><small>Missing: ${cardInfo.id}</small></div>`;
            }
        };

        cardWrapper.appendChild(img);

        // If banned, add visual indication
        if (banStatus === 'Forbidden') {
            container.classList.add('banned-card');
            const badge = document.createElement('div');
            badge.className = 'banned-badge';
            badge.innerHTML = '<i class="fas fa-ban" style="margin-right:4px;font-size:0.8em;vertical-align:-0.1em;"></i>FORBIDDEN';
            badge.style.position = 'absolute';
            badge.style.top = '6px';
            badge.style.right = '6px';
            badge.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
            badge.style.color = 'white';
            badge.style.fontWeight = '700';
            badge.style.padding = '3px 10px';
            badge.style.borderRadius = '20px';
            badge.style.fontSize = '0.65rem';
            badge.style.zIndex = '10';
            badge.style.pointerEvents = 'none';
            badge.style.textTransform = 'uppercase';
            badge.style.letterSpacing = '0.05em';
            badge.style.boxShadow = '0 4px 12px rgba(220,38,38,0.3), 0 2px 4px rgba(0,0,0,0.2)';
            badge.style.border = '1px solid rgba(255,255,255,0.2)';
            badge.style.backdropFilter = 'blur(4px)';
            cardWrapper.appendChild(badge);
            img.style.border = '2px solid #dc2626';
            img.style.opacity = '0.6'; // faded effect
            container.innerHTML = '';
            container.appendChild(cardWrapper);
        } else if (banStatus === 'Limited') {
            container.classList.remove('banned-card');
            img.style.border = '';
            img.style.opacity = '0.95'; // slightly faded
            // Position badge in bottom left corner of card image
            const badge = document.createElement('div');
            badge.className = 'limited-badge';
            badge.innerHTML = '<span style="font-weight:900;font-size:0.85em;color:#92400e;margin-right:5px;vertical-align:-0.1em;">1</span>LIMITED';
            badge.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
            badge.style.color = '#92400e';
            badge.style.fontWeight = '700';
            badge.style.padding = '3px 10px';
            badge.style.borderRadius = '16px';
            badge.style.fontSize = '0.55rem';
            badge.style.position = 'absolute';
            badge.style.bottom = '6px';
            badge.style.left = '6px';
            badge.style.textAlign = 'center';
            badge.style.textTransform = 'uppercase';
            badge.style.letterSpacing = '0.06em';
            badge.style.boxShadow = '0 2px 6px rgba(251,191,36,0.3), 0 1px 2px rgba(0,0,0,0.1)';
            badge.style.border = '1px solid rgba(251,191,36,0.5)';
            badge.style.pointerEvents = 'none';
            badge.style.transition = 'transform 0.2s ease';
            badge.style.transform = 'scale(0.95)';
            badge.style.zIndex = '10';
            badge.style.backdropFilter = 'blur(2px)';
            badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.10)';
            cardWrapper.appendChild(badge);
            container.innerHTML = '';
            container.appendChild(cardWrapper);
        } else if (banStatus === 'Semi-Limited') {
            container.classList.remove('banned-card');
            img.style.border = '';
            img.style.opacity = '0.98'; // barely faded
            // Position badge in bottom left corner of card image
            const badge = document.createElement('div');
            badge.className = 'semilimited-badge';
            badge.innerHTML = '<span style="font-weight:900;font-size:0.85em;color:#9a3412;margin-right:5px;vertical-align:-0.1em;">2</span>SEMI-LIMITED';
            badge.style.background = 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)';
            badge.style.color = '#9a3412';
            badge.style.fontWeight = '700';
            badge.style.padding = '3px 10px';
            badge.style.borderRadius = '16px';
            badge.style.fontSize = '0.55rem';
            badge.style.position = 'absolute';
            badge.style.bottom = '6px';
            badge.style.left = '6px';
            badge.style.textAlign = 'center';
            badge.style.textTransform = 'uppercase';
            badge.style.letterSpacing = '0.06em';
            badge.style.boxShadow = '0 2px 6px rgba(251,146,60,0.3), 0 1px 2px rgba(0,0,0,0.1)';
            badge.style.border = '1px solid rgba(251,146,60,0.5)';
            badge.style.pointerEvents = 'none';
            badge.style.transition = 'transform 0.2s ease';
            badge.style.transform = 'scale(0.95)';
            badge.style.zIndex = '10';
            badge.style.backdropFilter = 'blur(2px)';
            badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.10)';
            cardWrapper.appendChild(badge);
            container.innerHTML = '';
            container.appendChild(cardWrapper);
        } else {
            container.classList.remove('banned-card');
            img.style.border = '';
            img.style.opacity = '1';
            container.innerHTML = '';
            container.appendChild(cardWrapper);
        }
    }

    /**
     * Extract summoning materials from Extra Deck monster descriptions
     */
    function extractSummoningMaterials(description, cardType, cardName) {
        // Only process Extra Deck monsters (Fusion, Synchro, XYZ)
        if (!cardType || (!cardType.includes('Fusion') && !cardType.includes('Synchro') && !cardType.includes('XYZ') && !cardType.includes('Link'))) {
            return null;
        }

        // Common patterns for summoning materials
        const patterns = [
            // Special summoning condition pattern (e.g., "Must be Special Summoned by \"Mask Change\"")
            /^(Must (?:first )?be (?:Fusion |Synchro |Xyz |Link |Special )?Summoned (?:with|by|using) [^.]+\.?)/i,

            // Specific pattern for materials with "except" clause (Must be first to avoid partial matches)
            /^(\d+(?:\s*\+\s*\d+)?\s*[\w\s"]+monsters?,\s*except\s*[^\r\n]*)/i,

            // Pattern for materials with "or" between quoted card names (e.g., 1 LIGHT Machine monster + "Y-Yare Head" or "Z-Zillion Tank")
            // Must come early to avoid being shadowed by generic patterns that stop at "monster"
            /^(\d+\s+[\w\s]+monster\s*\+\s*"[^"]+"\s+or\s+"[^"]+")/i,

            // Specific Fusion patterns (Moved to top to avoid being shadowed by generic Link pattern)
            // Pattern for: "1 X Fusion Monster + 1 Y monster" or "1 X + 1 Y + 1 Z monsters"
            // Updated to include location qualifiers like "in your opponent's GY"
            /^(\d+\s*[\w\s"]+\s*\+\s*\d+\s*[\w\s"]+?monsters?(?:\s+in\s+your\s+(?:opponent's\s+)?GY)?(?:\s*\+\s*\d+\s*[\w\s"]+?monsters?(?:\s+in\s+your\s+(?:opponent's\s+)?GY)?)*)/i,
            // Pattern for: "2 monsters, including..." or "2+ Effect Monsters" or "2 \"Archetype\" monsters"
            // Updated to allow "1+ "Fluffal" and/or "Edge Imp" monsters" - allowing quoted names and conjunctions
            /^(\d+\+?\s*[\w\s",\/]+(?:monsters?|Fusion Monster)\s*(?:\+\s*(?:1\+|1 or more|\d+)\s*[\w\s",\/]+(?:monsters?|Fusion Monster))+(?:\s*\+\s*(?:1\+|1 or more|\d+)\s*[\w\s",\/]+(?:monsters?|Fusion Monster))*)/i,
            /^(\d+\+?\s*[\w\s",\/]+monsters?(?:\s*\+\s*(?:\d+\s*)?[\w\s"]+)*)/i,

            // Link patterns - more inclusive for complex specifications
            // Capture line breaks and subordinate clauses until the next sentence (capitalized) or end
            /^(\d+(?:\s*\+\s*)?\s*(?:[\w\s\-]+)?monsters?(?:\r?\n(?!\s*(?:Monsters|[A-Z])).*)*)/im,
            // Synchro patterns - more inclusive for attributes and 1+ notation
            /^(\d+\s+(?:[\w"]+\s+)?Tuner\s*\+\s*\d+(?:\s*\+\s*)?(?:\s+or\s+more|\+)?\s+non-Tuner(?:\s+(?!monsters).*?)?\s*monsters?)/i,
            /^(\d+\s+(?:[\w"]+\s+)?Tuner\s+Synchro\s+Monster\s*\+\s*\d+(?:\s*\+\s*)?(?:\s+or\s+more|\+)?\s+non-Tuner(?:\s+(?!monsters).*?)?\s*monsters?)/i,
            // XYZ patterns
            /^(\d+(?:\s*\+\s*)?\s*Level\s+\d+(?:\s+or\s+higher|\s+or\s+lower)?(?:.*?)monsters?(?:\r?\n(?!\s*(?:Monsters|[A-Z])).*)*)/im,
            /^(\d+(?:\s*\+\s*)?\s*[\w\s"]+monsters?\s*\([^)]*\))/i,

            // Fusion patterns - specific card names first
            // Capture situations like: 1 DARK monster + "Fallen of Albaz" (quoted card name after a +)
            /^(?!If|When|You|Once|During|For|Unless|While|Then|In the)([^\r\n]*?"[^"]+"(?:\s*\+\s*"[^"]+")*(?:\s*\+\s*[^A-Z][^.]*)?)/im,

            /^("[^"]*"(?:\s*\+\s*"[^"]*")+(?:\s*\+\s*"[^"]*")*)/,
            /^(\d+(?:\s*\+\s*\d+)?\s*[\w \t"]+monsters?)/i,
            // Generic catch-all for materials ending with "monsters" - include the following clause until next capitalized sentence
            /^([^\r\n]*?monsters?(?:\r?\n(?!\s*(?:Monsters|[A-Z])).*)*)/im
        ];

        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
                let materials = match[1].trim();
                // Skip obvious non-material lines such as name override lines
                // (eg. This card's name becomes "Summoned Skull")
                if (/this card's name\b|name becomes\b|this card is named\b/i.test(materials)) {
                    continue;
                }
                // Trim inline effect starts even if the material match is long (e.g. 'If a ...')
                // More robust: find the earliest effect-start marker and cut off everything after it.
                const effectMarker = materials.search(/\s+(?:You|If|When|Once|During|For|Unless|While|Then|In the|If a|If an|If any|When a|When an|When you|While your|Any|Each|All|Must|This|Gains)\b/i);
                if (effectMarker !== -1) {
                    materials = materials.substring(0, effectMarker).trim();
                }

                // Fallback cleanup: if materials ends with "Monsters" (case-insensitive) on a new line, trim it.
                // This handles cases where the regex accidentally captured the start of the effect text "Monsters..."
                if (/[\r\n]+\s*Monsters$/i.test(materials)) {
                    materials = materials.replace(/[\r\n]+\s*Monsters$/i, '').trim();
                }

                // Make sure it's not too long (probably not materials if > 100 chars)
                if (materials.length < 100) {
                    // If the materials accidentally included the start of effect text
                    // (e.g., "If a Battlin' Boxer monster ..."), drop that clause.
                    const inlineEffectStart = materials.match(/\s+(?:You|If|When|Once|During|For|Unless|While|Then|In the|If a|If an|If any|When a|When an|When you|While your|Any|Each|All|Must|This|Gains)\b/i);
                    if (inlineEffectStart && inlineEffectStart.index > 0) {
                        // Trim off the effect start and continue with the shortened materials
                        materials = materials.slice(0, inlineEffectStart.index).trim();
                    }
                    // If the materials only captured something like "1 DARK monster" but the next line
                    // contains a + "Quoted Card" (e.g., + "Fallen of Albaz"), include it too.
                    const lookaheadStart = description.indexOf(match[1]) + match[1].length;
                    const lookahead = description.slice(lookaheadStart);
                    // If what's after the materials looks like the start of a sentence
                    // (You/If/When/Once/During/etc), do not include it as part of the materials
                    // — these are generally effect text and not part of materials list.
                    if (/^\s*(?:You|If|When|Once|During|For|Unless|While|Then|In the|When your|If that|If this|If a|If an|If any|When a|When an|When you|While your|Any|Each|All|Must|This|Gains)\b/i.test(lookahead)) {
                        return materials;
                    }
                    const plusQuoted = lookahead.match(/^\s*\+\s*"[^"]+"(?:\s*\+\s*"[^"]+")*/m);
                    if (plusQuoted && plusQuoted[0]) {
                        // Return the exact substring from the original description so it can be
                        // removed exactly (including newline/plus sign) when formatting the description.
                        const combined = match[1] + plusQuoted[0];
                        if (combined.length < 200) return combined; // longer but still acceptable
                    }

                    // Also capture continuation lines that begin with a comma or common conjunctions
                    // For example: "2 monsters, including a Fiend monster"
                    const commaCont = lookahead.match(/^\s*(?:,|\u2013|\u2014|\*|\u2022|•|-)?\s*(?:including|including a|such as|or|and|excluding|except|with|without|but|among|specifically)\b[^\r\n]*/im);
                    if (commaCont && commaCont[0]) {
                        const combined = match[1] + commaCont[0];
                        if (combined.length < 200) return combined;
                    }

                    // Capture trailing noun types like "Pendulum Monster", "Tuner", or other descriptive
                    // words that directly follow a quoted name (e.g., 1 "Abyss Actor" Pendulum Monster)
                    // Ensure we don't cross a newline to find this.
                    // Also ensure we don't capture a full sentence like "A Fusion Summon of this card..."
                    const trailingMonster = lookahead.match(/^[ \t]*((?:(?!Monster)[ \t\w"'\-])+?Monster(?:s)?)/i);

                    if (trailingMonster && trailingMonster[0]) {
                        // Check if we are just duplicating the word "monster(s)"
                        const currentEnd = match[1].trim().match(/monsters?$/i);
                        const nextStart = trailingMonster[1].trim().match(/^monsters?$/i);
                        if (currentEnd && nextStart) {
                            // Don't append if it's just "monsters" again
                            return materials;
                        }
                        // Only accept if it's a short noun phrase, not a long sentence
                        if (trailingMonster[0].length < 50 && !/^(?:A|The)\s/i.test(trailingMonster[1])) {
                            const combined = match[1] + trailingMonster[0];
                            if (combined.length < 200) return combined;
                        }
                    }

                    return materials;
                }
            }
        }

        return null;
    }

    /**
     * Format card description with better readability for pendulum cards
     */
    function formatCardDescription(description, cardType, cardName) {
        // Check if this is a pendulum card (has both Pendulum Effect and Monster Effect sections)
        if (description.includes('[ Pendulum Effect ]') && description.includes('[ Monster Effect ]')) {
            // Split the description into sections
            const pendulumMatch = description.match(/\[ Pendulum Effect \](.*?)(?=\[ Monster Effect \]|\[ Link Monster Effect \]|\[ Ritual Monster Effect \]|\[ Fusion Monster Effect \]|\[ Synchro Monster Effect \]|\[ XYZ Monster Effect \]|$)/s);
            const monsterMatch = description.match(/\[ Monster Effect \](.*)/s);

            if (pendulumMatch && monsterMatch) {
                const pendulumText = pendulumMatch[1].trim();
                const monsterText = monsterMatch[1].trim();

                return `
                    <div class="mb-3">
                        <div class="text-blue-300 font-bold text-sm mb-1">⚖️ Pendulum Effect</div>
                        <div class="text-current text-xs leading-relaxed pl-3 border-l-2 border-blue-500">${pendulumText.replace(/\r\n/g, '<br>')}</div>
                    </div>
                    <div class="mb-3">
                        <div class="text-green-300 font-bold text-sm mb-1">⚔️ Monster Effect</div>
                        <div class="text-current text-xs leading-relaxed pl-3 border-l-2 border-green-500">${monsterText.replace(/\r\n/g, '<br>')}</div>
                    </div>
                `;
            }
        }

        // Check for summoning materials in Extra Deck monsters
        const summoningMaterials = extractSummoningMaterials(description, cardType, cardName);
        if (summoningMaterials && debugMaterials) {
            console.groupCollapsed('[CardLoader] materials debug:', summoningMaterials);
            console.log('Original description:', description);
            console.log('summoningMaterials:', summoningMaterials);
            console.groupEnd();
        }
        // For even deeper debugging, show the intermediate materialsText and remainingDescription
        if (debugMaterials) {
            const debugMaterials = linkifyMaterials(summoningMaterials || '');
            console.log('[CardLoader] debug materialsText (post-linkify):', debugMaterials);
        }
        if (summoningMaterials) {
            // Remove materials from description and format specially
            let materialsText = linkifyMaterials(summoningMaterials);
            // If effect text was accidentally included inline after materials (e.g., "... monsters If a ..."),
            // trim it here. This is an extra safety net for APIs that flatten newlines.
            materialsText = materialsText.replace(/\s+(?:You|If|When|Once|During|For|Unless|While|Then|In the|If a|If an|If any|When a|When an|When you|While your)\b[\s\S]*$/i, '').trim();
            // Preserve line break display in the materials block
            materialsText = materialsText.replace(/\r?\n/g, ' ');
            // Remove the materials substring from the description, but be conservative:
            // only remove if it appears at the start of the description or on its own line
            // (prevents accidental removal of the same word used later in effect text).
            const remainingDescription = removeMaterialsFromDescription(description, summoningMaterials);
            // Final fuzzy safety: if the removed fails but the first sentence begins with
            // the same words (ignoring curly quotes/whitespace), remove that leading
            // instance. This prevents duplication when the captured materials are
            // present verbatim but differ only in quotes or spacing.
            const fuzzyMaterials = normalizeForCompare(summoningMaterials);
            const fuzzyRemainingStart = normalizeForCompare(remainingDescription).slice(0, fuzzyMaterials.length + 5);
            if (fuzzyMaterials && fuzzyRemainingStart.startsWith(fuzzyMaterials)) {
                // Build tolerant pattern anchored at start to remove the leading materials
                const anchored = new RegExp('^\\s*' + escapeRegExp(summoningMaterials).replace(/\r?\n/g, '\\s*').replace(/"/g, '["“”]?').replace(/\s+/g, '\\s+'), 'mi');
                if (anchored.test(remainingDescription)) {
                    if (debugMaterials) console.log('[CardLoader] Fuzzy removal of materials from beginning of remaining description');
                    const newDesc = remainingDescription.replace(anchored, '').trim();
                    return newDesc;
                }
            }
            if (debugMaterials && remainingDescription && summoningMaterials && remainingDescription.includes(summoningMaterials)) {
                console.warn('[CardLoader] duplication: materials found in remainingDescription after removal');
                console.log('summoningMaterials:', summoningMaterials);
                console.log('remainingDescription (start):', remainingDescription.slice(0, 200));
            }

            // Determine icon based on card type
            let materialIcon = '🧬';
            if (cardType) {
                if (cardType.includes('Fusion')) materialIcon = '🌀';
                else if (cardType.includes('Synchro')) materialIcon = '🌟';
                else if (cardType.includes('XYZ')) materialIcon = '🌌';
                else if (cardType.includes('Link')) materialIcon = '🔗';
            }

            return `
                <div class="mb-3">
                            <div class="text-purple-300 font-bold text-sm mb-1">${materialIcon} Materials</div>
                            <div class="text-gray-300 text-xs leading-relaxed pl-3 border-l-2 border-purple-500">${materialsText}</div>
                </div>
                <div class="mb-3">
                    <div class="text-current text-xs leading-relaxed">${remainingDescription.replace(/\r\n/g, '<br>')}</div>
                </div>
            `;
        }

        // Check for other effect types (Link, Ritual, Fusion, Synchro, XYZ)
        const effectTypes = [
            { pattern: /\[ Link Monster Effect \]/, label: '🔗 Link Effect', color: 'purple' },
            { pattern: /\[ Ritual Monster Effect \]/, label: '📿 Ritual Effect', color: 'orange' },
            { pattern: /\[ Fusion Monster Effect \]/, label: '🔥 Fusion Effect', color: 'red' },
            { pattern: /\[ Synchro Monster Effect \]/, label: '⚡ Synchro Effect', color: 'yellow' },
            { pattern: /\[ XYZ Monster Effect \]/, label: '✨ XYZ Effect', color: 'pink' }
        ];

        for (const effectType of effectTypes) {
            if (effectType.pattern.test(description)) {
                const match = description.match(new RegExp(`${effectType.pattern.source}(.*)`, 's'));
                if (match) {
                    const effectText = match[1].trim();
                    return `
                        <div class="mb-3">
                            <div class="text-${effectType.color}-300 font-bold text-sm mb-1">${effectType.label}</div>
                            <div class="text-current text-xs leading-relaxed pl-3 border-l-2 border-${effectType.color}-500">${effectText.replace(/\r\n/g, '<br>')}</div>
                        </div>
                    `;
                }
            }
        }

        // For regular cards, just format with line breaks
        return `<div class="text-current text-xs leading-relaxed">${description.replace(/\r\n/g, '<br>')}</div>`;
    }

    // Small helper to highlight quoted card names in materials strings
    function linkifyMaterials(materials) {
        if (!materials) return materials;
        // Match straight double quotes "..." and curly quotes “...” or ”..."; avoid matching single quotes as those are common in card names
        // Keep materials in the same color as the Summoning Materials block by removing
        // the special accent color. Keep bold for emphasis.
        return materials.replace(/["“”]([^"“”]+)["“”]/g, (m, name) => {
            return `<strong class="font-bold">${name}</strong>`;
        });
    }

    // Escape string for use in a regular expression
    function escapeRegExp(string) {
        return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Remove the given materials string from the description, but only if it appears
    // at the start of the string or on its own line; this prevents accidental removal
    // of similarly-named phrases that occur later in effect text.
    function removeMaterialsFromDescription(description, materials) {
        if (!materials) return description.trim();
        // Build a conservative pattern that matches the materials when it's alone
        // at the start of the string or immediately after a line break.
        // Replace actual newlines inside the captured materials with a permissive pattern
        // so we can match them even if the description uses different newline styles.
        const escaped = escapeRegExp(materials).replace(/\r?\n/g, '[\\r\\n\\s]+');
        // Allow the materials to appear after a line-start OR after list bullets/markers
        // such as '-', '•', '*' (sometimes API or pages include bullets). This keeps
        // the removal conservative while catching common formatting.
        const safePattern = new RegExp('(^|\\r?\\n)\\s*(?:[-•\*•\\u2022]\\s*)?' + escaped + '(?=\\s|$|\\r?\\n)', 'm');
        // Only perform the replacement when we can find it in the described safe location
        if (safePattern.test(description)) {
            return description.replace(safePattern, '$1').trim();
        }

        // Fallback: if the conservative match failed, try a more tolerant regex that
        // accepts optional quotes and flexible whitespace. This should remove the
        // materials line at the start of the description even if the API uses
        // curly quotes or slightly different spacing.
        const tolerant = escapeRegExp(materials)
            .replace(/\\"/g, '"')
            .replace(/"/g, '["“”]?')
            .replace(/\s+/g, '\\s+');
        const tolerantPattern = new RegExp('^\\s*' + tolerant + '(?=\\s|$|\\r?\\n)', 'mi');
        if (tolerantPattern.test(description)) {
            if (window && window.__CARDLOADER_DEBUG_MATERIALS__) {
                console.groupCollapsed('[CardLoader] Materials tolerant fallback');
                console.log('materials:', materials);
                console.log('description:', description);
                console.log('tolerantPattern:', tolerantPattern);
                console.groupEnd();
            }
            return description.replace(tolerantPattern, '').trim();
        }
        // Fallback: don't remove anything if it might only match effect text
        return description.trim();
    }

    // Normalize string to simplify comparisons (convert curly quotes to straight,
    // remove NBSPs, collapse whitespace, lowercase) — used for fuzzy matching.
    function normalizeForCompare(str) {
        if (!str) return '';
        return String(str)
            .replace(/[“”]/g, '"')
            .replace(/[’‘]/g, "'")
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    /**
     * Get the appropriate icon for a card type
     */
    function getCardTypeIcon(race, type) {
        const iconMap = {
            // Spell Cards
            'Field': '🏞️',
            'Quick-Play': '⚡',
            'Continuous': type.includes('Spell') ? '🔄' : '🔄', // Same icon for both spell and trap
            'Equip': '⚔️',
            'Ritual': '📿',
            'Normal': '✨',
            // Trap Cards
            'Counter': '🛡️'
        };

        return iconMap[race] || '✨'; // Default to sparkle if no specific icon
    }

    /**
     * Show popup with card details
     */
    function showPopup(event, cardName) {
        // Stop event propagation to prevent immediate hide
        event.stopPropagation();

        // If clicking the same card, toggle popup off
        if (currentCard === cardName && activePopup) {
            hidePopup();
            return;
        }

        // Force hide previous popup immediately without delay
        if (activePopup) {
            activePopup.style.opacity = 0;
            activePopup.style.display = 'none';
            activePopup = null;
            currentCard = null;
        }

        if (!popup) return;

        const cardInfo = cardDataCache[cardName];
        if (!cardInfo) return;

        let stats = '';
        let atkDef = [];
        if (cardInfo.atk !== undefined) atkDef.push(`ATK/${cardInfo.atk}`);
        if (cardInfo.def !== undefined && !cardInfo.linkval) atkDef.push(`DEF/${cardInfo.def}`);
        if (cardInfo.linkval) atkDef.push(`LINK-${cardInfo.linkval}`);
        if (atkDef.length > 0) {
            stats = `<p class="mt-2 text-yellow-400 font-bold">${atkDef.join(' ')}</p>`;
        }

        let cardType;
        if (cardInfo.type.includes('Monster')) {
            cardType = `[${cardInfo.race} / ${cardInfo.type.replace(' Monster', '')}]`;
        } else if (cardInfo.type.includes('Spell')) {
            const icon = getCardTypeIcon(cardInfo.race, cardInfo.type);
            cardType = `${icon} [${cardInfo.race} Spell]`;
        } else if (cardInfo.type.includes('Trap')) {
            const icon = getCardTypeIcon(cardInfo.race, cardInfo.type);
            cardType = `${icon} [${cardInfo.race} Trap]`;
        } else {
            cardType = `[${cardInfo.race} Card]`;
        }

        popup.innerHTML = `
            <div class="flex flex-col" style="max-height: 450px;">
                <div class="flex-shrink-0">
                    <h3 class="text-blue-400 font-bold text-lg mb-2">${cardInfo.name}</h3>
                    <p class="text-xs text-gray-300">${cardType}</p>
                    <div class="w-full h-px bg-blue-500 my-2"></div>
                </div>
                <div class="flex-1 overflow-y-auto" style="min-height: 0;">
                    ${formatCardDescription(cardInfo.desc, cardInfo.type, cardInfo.name)}
                    ${stats}
                </div>
            </div>
        `;

        popup.style.display = 'block';
        popup.style.zIndex = '10000';
        movePopup(event);
        popup.style.pointerEvents = 'auto'; // Enable pointer events for scrolling
        setTimeout(() => { popup.style.opacity = 1; }, 10);
        activePopup = popup;
        lastShown = Date.now();
        currentCard = cardName;
    }

    function hidePopup() {
        if (Date.now() - lastShown < 100) return;
        if (activePopup) {
            activePopup.style.opacity = 0;
            activePopup.style.pointerEvents = 'none'; // Disable pointer events
            setTimeout(() => {
                if (activePopup) activePopup.style.display = 'none';
            }, 200);
            activePopup = null;
            currentCard = null;
        }
    }

    /**
     * Position popup near cursor (using fixed positioning relative to viewport)
     */
    function movePopup(event) {
        if (!popup) return;

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // On mobile, use CSS centering to handle dynamic content resizing
            popup.style.position = 'fixed';
            popup.style.left = '50%';
            popup.style.top = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            popup.style.margin = '0';
        } else {
            // Desktop: position near cursor
            popup.style.transform = 'none';

            const popupWidth = popup.offsetWidth || 400;
            const popupHeight = popup.offsetHeight || 500;
            const cushion = 20;

            let x = event.clientX + cushion;
            let y = event.clientY + cushion;

            // Keep popup within viewport bounds
            if (x + popupWidth > window.innerWidth) {
                x = event.clientX - popupWidth - cushion;
            }
            if (y + popupHeight > window.innerHeight) {
                y = event.clientY - popupHeight - cushion;
            }

            // Ensure popup doesn't go off-screen to the left or top
            if (x < cushion) x = cushion;
            if (y < cushion) y = cushion;

            // Use fixed positioning (stays in viewport, doesn't scroll with page)
            popup.style.position = 'fixed';
            popup.style.left = `${x}px`;
            popup.style.top = `${y}px`;
        }
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

    // Note: fetchBanlistData is defined earlier in the file with multi-format support


    /**
     * Fetch Discord links from JSON file
     * @returns {Promise<Array>} Array of Discord link objects
     */
    async function fetchDiscordLinks() {
        if (Object.keys(discordLinksCache).length > 0) {
            return discordLinksCache;
        }

        try {
            const response = await fetch('/assets/data/discord_links.json');
            if (!response.ok) {
                throw new Error(`Discord links fetch error: ${response.status}`);
            }

            const data = await response.json();

            // Convert array to object for faster lookup
            data.forEach(item => {
                discordLinksCache[item.archetype.toLowerCase()] = item.link;
            });

            console.log('[CardLoader] Discord links cached:', Object.keys(discordLinksCache).length, 'archetypes');
            return discordLinksCache;
        } catch (error) {
            console.error('[CardLoader] Failed to fetch Discord links:', error);
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

        if (!container) {
            console.error(`[CardLoader] Container with ID "${containerId}" not found`);
            return;
        }

        // Store render params for format switching
        container._banlistParams = { cards, options };

        // Detect page color scheme from existing headers or accent classes
        const detectPageColors = () => {
            // Look for existing h2/h3 elements to detect text color
            const headers = document.querySelectorAll('h2, h3');
            let headerColor = 'text-white'; // default

            for (const header of headers) {
                const classes = Array.from(header.classList);
                const textColorClass = classes.find(c => c.startsWith('text-') && !c.includes('gray'));
                if (textColorClass) {
                    headerColor = textColorClass;
                    break;
                }
            }

            // Look for body/paragraph text color
            const paragraphs = document.querySelectorAll('p, li, .card p');
            let bodyTextColor = 'text-white'; // default

            for (const p of paragraphs) {
                const classes = Array.from(p.classList);
                const textColorClass = classes.find(c => c.startsWith('text-') && !c.includes('gray'));
                if (textColorClass) {
                    bodyTextColor = textColorClass;
                    break;
                }
            }

            // Look for accent color (often in strong/bold elements or specific class)
            const accentElements = document.querySelectorAll('.text-accent, strong[class*="text-"]');
            let accentColor = 'text-yellow-400'; // default

            for (const element of accentElements) {
                const classes = Array.from(element.classList);
                const colorClass = classes.find(c => c.startsWith('text-') && !c.includes('gray'));
                if (colorClass) {
                    accentColor = colorClass;
                    break;
                }
            }

            return { headerColor, bodyTextColor, accentColor };
        };

        const pageColors = detectPageColors();
        console.log('[CardLoader] Detected page colors:', pageColors);

        // Check if container has a parent section and if it needs a header
        const parentSection = container.closest('section');
        if (parentSection) {
            // Add proper spacing classes to the section
            if (!parentSection.classList.contains('mt-10')) {
                parentSection.classList.add('mt-10', 'md:mt-16', 'mb-10', 'md:mb-16');
            }

            // Inject the header if it doesn't exist
            if (!parentSection.querySelector('h2.banlist-header')) {
                const header = document.createElement('h2');
                header.className = `banlist-header text-xl md:text-3xl font-bold ${pageColors.headerColor} mb-6 text-center`;
                header.innerHTML = `<i class="fas fa-gavel mr-2"></i><span class="banlist-title-text">Banlist Impact</span>`;
                if (parentSection === container) {
                    container.insertBefore(header, container.firstChild);
                } else {
                    parentSection.insertBefore(header, container);
                }
            }
        }

        // Create format toggle buttons HTML
        const formatToggleHtml = `
            <div class="banlist-format-toggle flex justify-center gap-2 mb-6 flex-wrap">
                ${Object.entries(BANLIST_FORMATS).map(([format, info]) => `
                    <button 
                        class="banlist-format-btn px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2
                            ${format === currentBanlistFormat ? info.activeClasses : info.inactiveClasses}"
                        data-format="${format}"
                        ${format === currentBanlistFormat ? 'disabled' : ''}
                    >
                        <i class="fas ${info.icon}"></i>
                        ${info.name}
                    </button>
                `).join('')}
            </div>
        `;

        // Show loading state with format toggle
        container.innerHTML = formatToggleHtml + '<div class="banlist-content"><div class="card p-6"><p class="text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading banlist data...</p></div></div>';

        // Add click handlers for format buttons
        container.querySelectorAll('.banlist-format-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const newFormat = e.currentTarget.dataset.format;
                if (newFormat !== currentBanlistFormat) {
                    currentBanlistFormat = newFormat;
                    // Update header title
                    const titleSpan = parentSection?.querySelector('.banlist-title-text');
                    if (titleSpan) {
                        titleSpan.textContent = `${BANLIST_FORMATS[newFormat].name} Banlist Impact`;
                    }
                    // Re-render with new format
                    await renderBanlistContent(container, cards, options, newFormat, pageColors);
                }
            });
        });

        // Render content for current format
        await renderBanlistContent(container, cards, options, currentBanlistFormat, pageColors);
    }

    /**
     * Render the banlist content for a specific format
     * @private
     */
    async function renderBanlistContent(container, cards, options, format, pageColors) {
        const contentContainer = container.querySelector('.banlist-content');
        if (!contentContainer) return;

        // Update button states
        container.querySelectorAll('.banlist-format-btn').forEach(btn => {
            const btnFormat = btn.dataset.format;
            const info = BANLIST_FORMATS[btnFormat];
            if (btnFormat === format) {
                btn.className = `banlist-format-btn px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${info.activeClasses}`;
                btn.disabled = true;
            } else {
                btn.className = `banlist-format-btn px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${info.inactiveClasses}`;
                btn.disabled = false;
            }
        });

        // Show loading
        contentContainer.innerHTML = '<div class="card p-6"><p class="text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading ' + BANLIST_FORMATS[format].name + ' banlist...</p></div>';

        // Auto-extract related cards from cache and merge with manual ones
        let relatedCards = options.relatedCards || [];

        // Wait a bit for loadCards to populate the cache
        await new Promise(resolve => setTimeout(resolve, 100));
        const autoExtracted = extractRelatedCardsFromCache(cards);

        // Merge manual and auto-extracted cards (avoid duplicates)
        const manualSet = new Set(relatedCards.map(c => c.toLowerCase()));
        const merged = [...relatedCards];

        for (const card of autoExtracted) {
            if (!manualSet.has(card.toLowerCase())) {
                merged.push(card);
            }
        }

        console.log(`[CardLoader] Final related cards: ${relatedCards.length} manual + ${merged.length - relatedCards.length} auto-extracted = ${merged.length} total`);

        // Fetch real banlist data from API for the selected format
        const banlist = await fetchBanlistData(format);

        // Helper function for case-insensitive banlist lookup
        function getBanlistStatus(cardName, banlistMap) {
            // First try exact match
            if (banlistMap[cardName]) {
                return banlistMap[cardName];
            }
            // Then try case-insensitive match
            const lowerName = cardName.toLowerCase();
            for (const [key, status] of Object.entries(banlistMap)) {
                if (key.toLowerCase() === lowerName) {
                    return status;
                }
            }
            return null;
        }

        // Check which cards are banned
        const forbidden = cards.filter(c => getBanlistStatus(c, banlist) === 'Forbidden');
        const limited = cards.filter(c => getBanlistStatus(c, banlist) === 'Limited');
        const semiLimited = cards.filter(c => getBanlistStatus(c, banlist) === 'Semi-Limited');
        const relatedForbidden = merged.filter(c => getBanlistStatus(c, banlist) === 'Forbidden');
        const relatedLimited = merged.filter(c => getBanlistStatus(c, banlist) === 'Limited');
        const relatedSemiLimited = merged.filter(c => getBanlistStatus(c, banlist) === 'Semi-Limited');

        const hasRestrictions = forbidden.length > 0 || limited.length > 0 || semiLimited.length > 0;
        const hasRelatedRestrictions = relatedForbidden.length > 0 || relatedLimited.length > 0 || relatedSemiLimited.length > 0;

        // Extract archetype traits for dynamic messaging
        const traits = options.archetypeTraits || {};
        const formatName = BANLIST_FORMATS[format].name;

        let html = '';

        if (!hasRestrictions && !hasRelatedRestrictions) {
            // Auto-generated unrestricted message with optional traits
            let unrestrictedMsg = '';
            if (traits.coreMechanic) {
                unrestrictedMsg = `The ${options.archetypeName} archetype, with its ${traits.coreMechanic}, operates at full power with no restrictions on the current ${formatName} banlist.`;
            } else {
                unrestrictedMsg = `As of the current ${formatName} format, the ${options.archetypeName} archetype is entirely unrestricted, allowing it to operate at full capacity.`;
            }

            html = `
                        <div class="card p-8 mb-10 md:mb-16">
                            <div class="flex justify-center mb-6">
                                <div class="inline-flex items-center px-6 py-3 bg-green-600 bg-opacity-10 border-2 border-green-500 rounded-full">
                                    <i class="fas fa-check-circle text-green-400 text-2xl mr-3"></i>
                                    <span class="text-green-700 font-bold text-lg uppercase tracking-wide">Fully Unrestricted</span>
                                </div>
                            </div>
                            
                            <p class="text-center text-lg mb-6 ${pageColors.bodyTextColor} leading-relaxed">
                                ${unrestrictedMsg}
                            </p>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div class="bg-gradient-to-br from-green-900 to-green-800 bg-opacity-30 p-4 rounded-lg border border-green-600 border-opacity-40">
                                    <div class="flex items-center mb-2">
                                        <i class="fas fa-layer-group text-green-400 text-xl mr-2"></i>
                                        <h4 class="text-green-300 font-bold text-sm">Maximum Consistency</h4>
                                    </div>
                                    <p class="text-gray-200 text-xs">Play any card at your preferred ratio without restrictions</p>
                                </div>
                                
                                <div class="bg-gradient-to-br from-blue-900 to-blue-800 bg-opacity-30 p-4 rounded-lg border border-blue-600 border-opacity-40">
                                    <div class="flex items-center mb-2">
                                        <i class="fas fa-bolt text-blue-400 text-xl mr-2"></i>
                                        <h4 class="text-blue-300 font-bold text-sm">Full Strength Plays</h4>
                                    </div>
                                    <p class="text-gray-200 text-xs">Access to all archetype synergies without limitations</p>
                                </div>
                                
                                <div class="bg-gradient-to-br from-purple-900 to-purple-800 bg-opacity-30 p-4 rounded-lg border border-purple-600 border-opacity-40">
                                    <div class="flex items-center mb-2">
                                        <i class="fas fa-chess text-purple-400 text-xl mr-2"></i>
                                        <h4 class="text-purple-300 font-bold text-sm">Strategic Freedom</h4>
                                    </div>
                                    <p class="text-gray-200 text-xs">No banlist constraints holding back your strategy</p>
                                </div>
                            </div>
                            
                            <div class="mt-8 bg-gray-900 bg-opacity-60 rounded border border-gray-700 p-3">
                                <div class="flex items-start">
                                    <i class="fas fa-info-circle text-gray-400 text-xs mr-2 mt-0.5"></i>
                                    <div class="flex-1">
                                        <p class="text-gray-300 font-semibold mb-1" style="font-size: 0.7rem;">Banlist Status Summary</p>
                                        <p class="text-gray-400" style="font-size: 0.65rem; line-height: 1.3;">
                                            <button class="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">
                                                ${cards.length} core cards
                                            </button>
                                            <span class="hidden mt-2 block bg-gray-800 bg-opacity-70 p-2 rounded border border-gray-600" style="font-size: 0.65rem;">
                                                <strong class="text-gray-200">Core cards checked:</strong><br>
                                                ${cards.sort().map(c => `• ${c}`).join('<br>')}
                                            </span>
                                            ${merged.length > 0 ? ` + <button class="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">${merged.length} related cards</button><span class="hidden mt-2 block bg-gray-800 bg-opacity-70 p-2 rounded border border-gray-600" style="font-size: 0.65rem;"><strong class="text-gray-200">Related cards checked:</strong><br>${merged.sort().map(c => `• ${c}`).join('<br>')}</span>` : ''} analyzed • 
                                            <strong class="text-gray-200">0 restrictions</strong> found • 
                                            All cards legal at <strong class="text-gray-200">3 copies</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
        } else if (!hasRestrictions && hasRelatedRestrictions) {
            // Archetype is fine, but related cards are hit
            let relatedImpactMsg = '';
            if (traits.supportReliance) {
                relatedImpactMsg = `While the ${options.archetypeName} core remains untouched, the archetype's ${traits.supportReliance} means restrictions on generic support cards do have an impact.`;
            } else {
                relatedImpactMsg = `The ${options.archetypeName} archetype itself is largely untouched by the ${formatName} banlist, but key synergistic cards it relies on are affected.`;
            }

            const totalRelatedRestricted = relatedForbidden.length + relatedLimited.length + relatedSemiLimited.length;

            html = `
                        <div class="card p-6 mb-10 md:mb-16">
                            <p class="${pageColors.bodyTextColor} mb-4 text-center">
                                ${relatedImpactMsg}
                            </p>
                    `;

            // Show only related cards section
            html += `<div><h3 class="text-lg font-semibold ${pageColors.headerColor} mb-3 text-center"><i class="fas fa-link mr-2"></i>Affected Synergistic Cards</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;

            if (relatedForbidden.length > 0) {
                html += `
                            <div class="combo-step-card p-4 border-l-4 border-red-500">
                                <h4 class="text-md font-bold text-red-400 mb-2">Forbidden</h4>
                                <ul class="list-disc list-inside space-y-1 text-xs ${pageColors.bodyTextColor}">
                                    ${relatedForbidden.map(c => `<li class="text-red-300">${c}</li>`).join('')}
                                </ul>
                            </div>
                        `;
            }

            if (relatedLimited.length > 0) {
                html += `
                            <div class="combo-step-card p-4 border-l-4 border-yellow-500">
                                <h4 class="text-md font-bold text-yellow-400 mb-2">Limited</h4>
                                <ul class="list-disc list-inside space-y-1 text-xs ${pageColors.bodyTextColor}">
                                    ${relatedLimited.map(c => `<li class="text-yellow-300">${c}</li>`).join('')}
                                </ul>
                            </div>
                        `;
            }

            if (relatedSemiLimited.length > 0) {
                html += `
                            <div class="combo-step-card p-4 border-l-4 border-orange-500">
                                <h4 class="text-md font-bold text-orange-400 mb-2">Semi-Limited</h4>
                                <ul class="list-disc list-inside space-y-1 text-xs ${pageColors.bodyTextColor}">
                                    ${relatedSemiLimited.map(c => `<li class="text-orange-300">${c}</li>`).join('')}
                                </ul>
                            </div>
                        `;
            }

            html += `</div></div>`;

            // Auto-generated meta implications for related cards
            if (options.customMessages?.metaImplications) {
                html += `
                            <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 rounded border-l-4 border-yellow-500">
                                <p class="text-sm ${pageColors.bodyTextColor}">
                                    <strong>Meta Implications:</strong> ${options.customMessages.metaImplications}
                                </p>
                            </div>
                        `;
            } else if (traits.adaptability) {
                html += `
                            <div class="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded border-l-4 border-blue-500">
                                <p class="text-sm ${pageColors.bodyTextColor}">
                                    <strong>Meta Implications:</strong> Despite restrictions on support cards, ${options.archetypeName}'s ${traits.adaptability} allows the deck to remain viable with alternative tech choices.
                                </p>
                            </div>
                        `;
            }

            // Stats Box
            html += `
                        <div class="mt-8 bg-gray-900 bg-opacity-60 rounded border border-gray-700 p-3">
                            <div class="flex items-start">
                                <i class="fas fa-info-circle text-gray-400 text-xs mr-2 mt-0.5"></i>
                                <div class="flex-1">
                                    <p class="text-gray-300 font-semibold mb-1" style="font-size: 0.7rem;">Banlist Status Summary</p>
                                    <p class="text-gray-400" style="font-size: 0.65rem; line-height: 1.3;">
                                        <button class="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">
                                            ${cards.length} core cards
                                        </button>
                                        <span class="hidden mt-2 block bg-gray-800 bg-opacity-70 p-2 rounded border border-gray-600" style="font-size: 0.65rem;">
                                            <strong class="text-gray-200">Core cards checked:</strong><br>
                                            ${cards.sort().map(c => `• ${c}`).join('<br>')}
                                        </span>
                                        ${merged.length > 0 ? ` + <button class="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">${merged.length} related cards</button><span class="hidden mt-2 block bg-gray-800 bg-opacity-70 p-2 rounded border border-gray-600" style="font-size: 0.65rem;"><strong class="text-gray-200">Related cards checked:</strong><br>${merged.sort().map(c => `• ${c}`).join('<br>')}</span>` : ''} analyzed • 
                                        <strong class="text-gray-200">0 archetype restrictions</strong> • 
                                        <strong class="text-gray-300">${totalRelatedRestricted} synergistic card${totalRelatedRestricted !== 1 ? 's' : ''} restricted</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;

            html += `</div>`;
        } else {
            // Auto-generated restricted message
            const impactLevel = forbidden.length > 1 ? 'HIGH IMPACT' :
                forbidden.length === 1 ? 'SIGNIFICANT IMPACT' :
                    limited.length > 1 ? 'MODERATE IMPACT' : 'LOW IMPACT';

            const impactColor = forbidden.length > 0 ? 'red' : 'yellow';

            // Enhanced intro with traits - generate natural flowing text
            let autoIntro = '';
            if (options.customMessages?.intro) {
                autoIntro = options.customMessages.intro;
            } else if (forbidden.length > 0) {
                // Build forbidden card list text
                const forbiddenText = forbidden.length === 1
                    ? `<strong class="text-red-300">${forbidden[0]}</strong>`
                    : forbidden.length === 2
                        ? `<strong class="text-red-300">${forbidden[0]}</strong> and <strong class="text-red-300">${forbidden[1]}</strong>`
                        : `<strong class="text-red-300">${forbidden[0]}</strong> and ${forbidden.length - 1} other card${forbidden.length > 2 ? 's' : ''}`;

                autoIntro = `The ${options.archetypeName} archetype faces significant restrictions on the ${formatName} banlist with ${forbiddenText} forbidden.`;

                // Add limited context if present
                if (limited.length > 0) {
                    autoIntro += ` Additionally, ${limited.length} card${limited.length > 1 ? 's are' : ' is'} limited.`;
                }
            } else if (limited.length > 0) {
                const limitedText = limited.length === 1
                    ? `<strong class="text-yellow-300">${limited[0]}</strong>`
                    : limited.length === 2
                        ? `<strong class="text-yellow-300">${limited[0]}</strong> and <strong class="text-yellow-300">${limited[1]}</strong>`
                        : `${limited.length} cards`;

                autoIntro = `The ${options.archetypeName} archetype has been moderately restricted by the ${formatName} banlist, with ${limitedText} limited.`;
            } else if (semiLimited.length > 0) {
                autoIntro = `The ${options.archetypeName} archetype has minor restrictions on the ${formatName} banlist, with ${semiLimited.length} card${semiLimited.length > 1 ? 's' : ''} semi-limited.`;
            }

            html = `
                        <div class="card p-6 mb-10 md:mb-16">
                            <p class="${pageColors.bodyTextColor} mb-4 text-center">
                                <strong class="text-${impactColor}-400 font-bold">${impactLevel}:</strong> ${autoIntro}
                            </p>
                    `;

            // Archetype restrictions
            if (forbidden.length > 0 || limited.length > 0 || semiLimited.length > 0) {
                html += `<div class="mb-4"><h3 class="text-lg font-semibold ${pageColors.headerColor} mb-3"><i class="fas fa-layer-group mr-2"></i>Archetype Cards</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;

                if (forbidden.length > 0) {
                    html += `
                                <div class="combo-step-card p-4 border-l-4 border-red-500">
                                    <h4 class="text-lg font-bold text-red-400 mb-2 text-left">
                                        <i class="fas fa-ban mr-2"></i>Forbidden
                                    </h4>
                                    <ul class="list-none space-y-1 text-sm ${pageColors.bodyTextColor} text-left">
                                        ${forbidden.map(c => `<li class="text-red-300">• ${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                }

                if (limited.length > 0) {
                    html += `
                                <div class="combo-step-card p-4 border-l-4 border-yellow-500">
                                    <h4 class="text-lg font-bold text-yellow-400 mb-2 text-left">
                                        <i class="fas fa-exclamation-triangle mr-2"></i>Limited
                                    </h4>
                                    <ul class="list-none space-y-1 text-sm ${pageColors.bodyTextColor} text-left">
                                        ${limited.map(c => `<li class="text-yellow-300">• ${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                }

                if (semiLimited.length > 0) {
                    html += `
                                <div class="combo-step-card p-4 border-l-4 border-orange-500">
                                    <h4 class="text-lg font-bold text-orange-400 mb-2 text-left">
                                        <i class="fas fa-exclamation-circle mr-2"></i>Semi-Limited
                                    </h4>
                                    <ul class="list-none space-y-1 text-sm ${pageColors.bodyTextColor} text-left">
                                        ${semiLimited.map(c => `<li class="text-orange-300">• ${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                }

                html += `</div></div>`;
            }

            // Related cards
            if (relatedForbidden.length > 0 || relatedLimited.length > 0 || relatedSemiLimited.length > 0) {
                html += `<div class="mt-4"><h3 class="text-lg font-semibold ${pageColors.headerColor} mb-3"><i class="fas fa-link mr-2"></i>Synergistic Cards</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;

                if (relatedForbidden.length > 0) {
                    html += `
                                <div class="combo-step-card p-4 border-l-4 border-red-500">
                                    <h4 class="text-md font-bold text-red-400 mb-2 text-left">Forbidden</h4>
                                    <ul class="list-none space-y-1 text-xs ${pageColors.bodyTextColor} text-left">
                                        ${relatedForbidden.map(c => `<li class="text-red-300">• ${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                }

                if (relatedLimited.length > 0) {
                    html += `
                                <div class="combo-step-card p-4 border-l-4 border-yellow-500">
                                    <h4 class="text-md font-bold text-yellow-400 mb-2 text-left">Limited</h4>
                                    <ul class="list-none space-y-1 text-xs ${pageColors.bodyTextColor} text-left">
                                        ${relatedLimited.map(c => `<li class="text-yellow-300">• ${c}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                }

                if (relatedSemiLimited.length > 0) {
                    html += `
                                <div class="combo-step-card p-4 border-l-4 border-orange-500">
                                    <h4 class="text-md font-bold text-orange-400 mb-2 text-left">Semi-Limited</h4>
                                    <ul class="list-none space-y-1 text-xs ${pageColors.bodyTextColor} text-left">
                                        ${relatedSemiLimited.map(c => `<li class="text-orange-300">• ${c}</li>`).join('')}
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
                                <p class="text-sm ${pageColors.bodyTextColor}">
                                    <strong>Meta Implications:</strong> ${options.customMessages.metaImplications}
                                </p>
                            </div>
                        `;
            } else if (traits.resilience && forbidden.length === 0) {
                // Limited cards only - can highlight resilience
                html += `
                            <div class="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded border-l-4 border-blue-500">
                                <p class="text-sm ${pageColors.bodyTextColor}">
                                    <strong>Meta Implications:</strong> Thanks to its ${traits.resilience}, ${options.archetypeName} remains playable despite the limitation${limited.length > 1 ? 's' : ''}.
                                </p>
                            </div>
                        `;
            } else if (traits.alternativeStrategy && forbidden.length > 0) {
                // Forbidden cards - can suggest alternatives
                html += `
                            <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 rounded border-l-4 border-yellow-500">
                                <p class="text-sm ${pageColors.bodyTextColor}">
                                    <strong>Meta Implications:</strong> While the loss of key cards is significant, ${options.archetypeName} players can adapt by ${traits.alternativeStrategy}.
                                </p>
                            </div>
                        `;
            } else if (forbidden.length > 0) {
                const cardList = forbidden.join(', ');
                html += `
                            <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 rounded border-l-4 border-yellow-500">
                                <p class="text-sm ${pageColors.bodyTextColor}">
                                    <strong>Meta Implications:</strong> The loss of ${cardList} significantly impacts the archetype's power level and consistency. Players will need to adapt their strategies accordingly.
                                </p>
                            </div>
                        `;
            }

            // Stats Box
            const totalArchetypeRestricted = forbidden.length + limited.length + semiLimited.length;
            const totalRelatedRestricted = relatedForbidden.length + relatedLimited.length + relatedSemiLimited.length;
            const totalRestricted = totalArchetypeRestricted + totalRelatedRestricted;

            html += `
                        <div class="mt-8 bg-gray-900 bg-opacity-60 rounded border border-gray-700 p-3">
                            <div class="flex items-start">
                                <i class="fas fa-info-circle text-gray-400 text-xs mr-2 mt-0.5"></i>
                                <div class="flex-1">
                                    <p class="text-gray-300 font-semibold mb-1" style="font-size: 0.7rem;">Banlist Status Summary</p>
                                    <p class="text-gray-400" style="font-size: 0.65rem; line-height: 1.3;">
                                        <button class="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">
                                            ${cards.length} core cards
                                        </button>
                                        <span class="hidden mt-2 block bg-gray-800 bg-opacity-70 p-2 rounded border border-gray-600 max-h-48 overflow-y-auto" style="font-size: 0.65rem;">
                                            <strong class="text-gray-200">Core cards checked:</strong><br>
                                            ${cards.sort().map(c => `• ${c}`).join('<br>')}
                                        </span>
                                        ${merged.length > 0 ? ` + <button class="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">${merged.length} related cards</button><span class="hidden mt-2 block bg-gray-800 bg-opacity-70 p-2 rounded border border-gray-600 max-h-48 overflow-y-auto" style="font-size: 0.65rem;"><strong class="text-gray-200">Related cards checked:</strong><br>${merged.sort().map(c => `• ${c}`).join('<br>')}</span>` : ''} analyzed • 
                                        <strong class="text-gray-200">${totalRestricted} total restriction${totalRestricted !== 1 ? 's' : ''} found
                                        ${totalArchetypeRestricted > 0 ? ` • <strong class="text-gray-300">${totalArchetypeRestricted} archetype card${totalArchetypeRestricted !== 1 ? 's' : ''}</strong>` : ''}
                                        ${totalRelatedRestricted > 0 ? ` • <strong class="text-gray-300">${totalRelatedRestricted} synergistic card${totalRelatedRestricted !== 1 ? 's' : ''}</strong>` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;

            html += `</div>`;
        }

        contentContainer.innerHTML = html;
    }

    /**
     * Fetch all cards from an archetype using the YGOProDeck API
     * @param {string} archetypeName - The archetype name (e.g., "Blue-Eyes", "Dark Magician")
     * @returns {Promise<Array<string>>} Array of card names in the archetype
     */
    async function fetchArchetypeCards(archetypeName) {
        try {
            const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}`;
            console.log(`[CardLoader] Fetching archetype cards for: ${archetypeName}`);

            const response = await fetch(apiUrl);

            if (response.status === 400) {
                // Archetype not found, return empty array
                console.log(`[CardLoader] Archetype "${archetypeName}" not found in API (400), returning empty array`);
                return [];
            }

            if (!response.ok) {
                throw new Error(`Archetype API returned status ${response.status}`);
            }

            const data = await response.json();

            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid archetype API response format');
            }

            // Extract card names
            const cardNames = data.data.map(card => card.name);
            console.log(`[CardLoader] Found ${cardNames.length} cards in ${archetypeName} archetype`);

            return cardNames;
        } catch (error) {
            console.error(`[CardLoader] Failed to fetch archetype cards for ${archetypeName}:`, error);
            return [];
        }
    }

    /**
     * Extract cards from the cache that are not part of the archetype
     * Useful for auto-populating relatedCards from loadCards() calls
     * @param {Array<string>} archetypeCards - Array of archetype card names
     * @returns {Array<string>} Array of card names that are loaded but not in archetype
     */
    function extractRelatedCardsFromCache(archetypeCards) {
        const loadedCards = Object.keys(cardDataCache);
        const archetypeSet = new Set(archetypeCards.map(c => c.toLowerCase()));

        // Filter out cards that are in the archetype
        const relatedCards = loadedCards.filter(cardName => {
            return !archetypeSet.has(cardName.toLowerCase());
        });

        console.log(`[CardLoader] Found ${relatedCards.length} related cards from cache:`, relatedCards);
        return relatedCards;
    }

    /**
     * Render banlist section using archetype name to auto-fetch cards
     * @param {string} containerId - ID of container element
     * @param {string} archetypeName - Name of the archetype to fetch cards for
     * @param {Object} options - Configuration options
     */
    async function renderBanlistSectionByArchetype(containerId, archetypeName, options = {}) {
        const container = document.getElementById(containerId);

        if (!container) {
            console.error(`[CardLoader] Container with ID "${containerId}" not found`);
            return;
        }

        // Show loading state
        container.innerHTML = '<div class="card p-6"><p class="text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading archetype and banlist data...</p></div>';

        // Fetch all cards in the archetype
        const archetypeCards = await fetchArchetypeCards(archetypeName);

        // Auto-extract related cards from cache and merge with manual ones
        let relatedCards = options.relatedCards || [];

        // Wait a bit for loadCards to populate the cache
        await new Promise(resolve => setTimeout(resolve, 100));

        if (archetypeCards.length === 0) {
            // Archetype not found - check if we have any related cards to analyze
            const autoExtracted = extractRelatedCardsFromCache([]);

            // Merge manual and auto-extracted cards (avoid duplicates)
            const manualSet = new Set(relatedCards.map(c => c.toLowerCase()));
            const merged = [...relatedCards];

            for (const card of autoExtracted) {
                if (!manualSet.has(card.toLowerCase())) {
                    merged.push(card);
                }
            }

            if (merged.length === 0) {
                container.innerHTML = '<div class="card p-6"><p class="text-center text-yellow-400"><i class="fas fa-exclamation-triangle mr-2"></i>Could not load archetype cards and no related cards found. Please check the archetype name.</p></div>';
                return;
            }

            // Use only related cards for analysis
            console.log(`[CardLoader] Archetype "${archetypeName}" not found. Analyzing ${merged.length} related cards only.`);
            const finalOptions = {
                ...options,
                relatedCards: [],
                archetypeName: archetypeName
            };

            await renderBanlistSection(containerId, merged, finalOptions);
            return;
        }

        const autoExtracted = extractRelatedCardsFromCache(archetypeCards);

        // Merge manual and auto-extracted cards (avoid duplicates)
        const manualSet = new Set(relatedCards.map(c => c.toLowerCase()));
        const merged = [...relatedCards];

        for (const card of autoExtracted) {
            if (!manualSet.has(card.toLowerCase())) {
                merged.push(card);
            }
        }

        console.log(`[CardLoader] Final related cards: ${relatedCards.length} manual + ${merged.length - relatedCards.length} auto-extracted = ${merged.length} total`);

        // Use the regular renderBanlistSection with fetched cards
        const finalOptions = {
            ...options,
            relatedCards: merged,
            archetypeName: archetypeName
        };

        await renderBanlistSection(containerId, archetypeCards, finalOptions);
    }

    /**
     * Get cached card data
     */
    function getCachedCard(cardName) {
        return cardDataCache[cardName] || null;
    }

    /**
     * Render a section with links to YGOProDeck deck searches
     * @param {string} containerId - ID of container element
     * @param {string} archetypeName - Display name of the archetype (e.g., "Gouki", "Blue-Eyes")
     * @param {Object} options - Configuration options
     * @param {string} [options.archetypeSlug] - The URL slug (e.g., "gouki"). If not provided, generated from archetypeName.
     * @param {string} [options.customHeader] - Optional custom header text.
     */
    async function renderDeckSearchSection(containerId, archetypeName, options = {}) {
        console.log(`[CardLoader] renderDeckSearchSection called for: ${archetypeName}`);
        const container = document.getElementById(containerId);

        if (!container) {
            console.error(`[CardLoader] Deck Search container with ID "${containerId}" not found`);
            return;
        }

        // Check if archetype exists by fetching cards
        const archetypeCards = await fetchArchetypeCards(archetypeName);
        const archetypeExists = archetypeCards.length > 0;

        // --- Begin Helper (Copied from renderBanlistSection for consistency) ---
        // Detect page color scheme from existing headers or accent classes
        const detectPageColors = () => {
            const headers = document.querySelectorAll('h2, h3');
            let headerColor = 'text-white'; // default
            for (const header of headers) {
                const classes = Array.from(header.classList);
                const textColorClass = classes.find(c => c.startsWith('text-') && !c.includes('gray'));
                if (textColorClass) {
                    headerColor = textColorClass;
                    break;
                }
            }

            // Look for body/paragraph text color
            const paragraphs = document.querySelectorAll('p, li, .card p');
            let bodyTextColor = 'text-blue-200'; // default to match banlist

            for (const p of paragraphs) {
                const classes = Array.from(p.classList);
                const textColorClass = classes.find(c => c.startsWith('text-') && !c.includes('gray'));
                if (textColorClass) {
                    bodyTextColor = textColorClass;
                    break;
                }
            }

            return { headerColor, bodyTextColor };
        };
        const pageColors = detectPageColors();
        // --- End Helper ---

        // Handle parent section and header
        const parentSection = container.closest('section');
        if (parentSection) {
            // Add spacing classes to the section if not present
            if (!parentSection.classList.contains('mt-10')) {
                parentSection.classList.add('mt-10', 'md:mt-16', 'mb-10', 'md:mb-16');
            }

            // Inject the header if it doesn't exist
            if (!parentSection.querySelector('h2')) {
                const header = document.createElement('h2');
                header.className = `text-xl md:text-3xl font-bold ${pageColors.headerColor} mb-6 text-center`;
                // Use custom header or generate one
                header.innerHTML = options.customHeader || `<i class="fas fa-search-plus mr-2"></i>Find ${archetypeName} Decks`;
                if (parentSection === container) {
                    container.insertBefore(header, container.firstChild);
                } else {
                    parentSection.insertBefore(header, container);
                }
            }
        }

        // Fetch Discord links
        const discordLinks = await fetchDiscordLinks();
        const discordUrl = discordLinks[archetypeName.toLowerCase()] || null;
        console.log(`[CardLoader] Discord link for ${archetypeName}:`, discordUrl);

        let competitiveUrl, casualUrl;

        if (archetypeExists) {
            // Use the archetype name with spaces encoded for URL
            const encodedArchetypeName = encodeURIComponent(archetypeName);
            console.log(`[CardLoader] Archetype found. Using encoded archetype name for URLs: ${encodedArchetypeName}`);

            // Define YGOProDeck URLs based on your examples
            competitiveUrl = `https://ygoprodeck.com/deck-search/?tournament=tier-2&_sft_post_tag=${encodedArchetypeName}&offset=0`;
            casualUrl = `https://ygoprodeck.com/deck-search/?_sft_post_tag=${encodedArchetypeName}&offset=0`;
        } else {
            // Fallback to card-based search using a loaded card name from cache
            const loadedCardNames = Object.keys(cardDataCache);
            let encodedCardName;

            if (loadedCardNames.length > 0) {
                // Use the first loaded card name for the search
                const firstCardName = loadedCardNames[0];
                encodedCardName = encodeURIComponent(firstCardName);
                console.log(`[CardLoader] Archetype not found. Using loaded card name for fallback search: ${firstCardName}`);
            } else {
                // Last resort: use archetype name (though this shouldn't happen if cards were loaded)
                encodedCardName = encodeURIComponent(archetypeName);
                console.log(`[CardLoader] Archetype not found and no cards in cache. Using archetype name for fallback search: ${archetypeName}`);
            }

            competitiveUrl = `https://ygoprodeck.com/deck-search/?tournament=tier-2&cardcode=${encodedCardName}%7C&offset=0`;
            casualUrl = `https://ygoprodeck.com/deck-search/?cardcode=${encodedCardName}%7C&offset=0`;
        }

        // Generate the HTML for the buttons
        const html = `
            <div class="card p-6">
                <p class="text-center mb-6 ${pageColors.bodyTextColor}">
                    <i class="fas fa-search-plus mr-2 text-accent"></i>
                    Explore deck lists from the YGOProDeck community featuring ${archetypeName}. Find inspiration for your next build!
                </p>
                <div class="grid grid-cols-1 md:grid-cols-${discordUrl ? '3' : '2'} gap-6">
                    
                    <a href="${competitiveUrl}" target="_blank" rel="noopener noreferrer" 
                       class="block p-6 rounded-lg shadow-lg text-center font-bold text-white transition-transform transform hover:scale-105 
                              bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                        <h3 class="text-lg">
                            <i class="fas fa-trophy mr-2"></i>
                            View Competitive Decks
                        </h3>
                        <span class="block text-xs font-normal text-blue-100 mt-1">
                            Tournament & Tiered Lists
                        </span>
                    </a>
                    
                    <a href="${casualUrl}" target="_blank" rel="noopener noreferrer" 
                       class="block p-6 rounded-lg shadow-lg text-center font-bold text-white transition-transform transform hover:scale-105 
                              bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800">
                        <h3 class="text-lg">
                            <i class="fas fa-users mr-2"></i>
                            View All Decks
                        </h3>
                        <span class="block text-xs font-normal text-gray-200 mt-1">
                            All User-Submitted Decks
                        </span>
                    </a>
                    
                    ${discordUrl ? `
                    <a href="${discordUrl}" target="_blank" rel="noopener noreferrer" 
                       class="block p-6 rounded-lg shadow-lg text-center font-bold text-white transition-transform transform hover:scale-105 
                              bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                        <h3 class="text-lg">
                            <i class="fab fa-discord mr-2"></i>
                            Join ${archetypeName} Discord
                        </h3>
                        <span class="block text-xs font-normal text-purple-100 mt-1">
                            Archetype Community Server
                        </span>
                    </a>
                    ` : ''}

                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Inject AI-generated content warnings into combo sections
     * Automatically detects combo sections and adds warning banners
     */
    function injectComboWarnings() {
        // Skip if already injected
        if (document.querySelector('.ai-combo-warning')) {
            return;
        }

        // Infer page theme for consistent styling
        const getTheme = () => {
            const bodyBg = window.getComputedStyle(document.body).backgroundColor;
            const rgb = bodyBg.match(/\d+/g);
            const isDark = rgb ? (parseInt(rgb[0]) * 0.299 + parseInt(rgb[1]) * 0.587 + parseInt(rgb[2]) * 0.114) < 128 : true;

            // Try to detect accent color from existing elements
            let accentColor = '#f59e0b'; // Default amber
            const accentEl = document.querySelector('.text-accent, [class*="text-accent"]');
            if (accentEl) {
                const color = window.getComputedStyle(accentEl).color;
                if (color && color !== 'rgb(0, 0, 0)') {
                    accentColor = color;
                }
            }

            return { isDark, accentColor };
        };

        const theme = getTheme();

        // Create warning banner HTML
        const createWarningBanner = () => {
            const warning = document.createElement('div');
            warning.className = 'ai-combo-warning';
            warning.style.cssText = `
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px 20px;
                margin: 16px 0;
                border-radius: 12px;
                background: ${theme.isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.15)'};
                border: 1px solid ${theme.isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.5)'};
                font-size: 0.875rem;
                line-height: 1.5;
            `;

            warning.innerHTML = `
                <div style="flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: rgba(251, 191, 36, 0.2); border-radius: 50%; margin-top: 2px;">
                    <i class="fas fa-robot" style="color: #fbbf24; font-size: 12px;"></i>
                </div>
                <div>
                    <div style="font-weight: 600; color: #fbbf24; margin-bottom: 4px;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 6px; font-size: 0.75rem;"></i>Unverified AI Content
                    </div>
                    <div style="color: ${theme.isDark ? '#d1d5db' : '#4b5563'}; font-size: 0.8rem; margin-bottom: 8px;">
                        This combo line is AI-generated and may contain errors or illegal plays (e.g., banned cards).
                    </div>
                    <a href="Replay-Converter.html" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #1f2937; font-weight: 600; font-size: 0.75rem; border-radius: 6px; text-decoration: none; box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);"><i class="fas fa-video"></i> Know the correct line? Submit a Replay to fix this guide <i class="fas fa-arrow-right" style="font-size: 0.65rem;"></i></a>
                    </div>
                </div>
            `;

            return warning;
        };

        // Detection patterns for combo sections
        const comboPatterns = [
            /combo/i,
            /one[- ]card/i,
            /starter/i,
            /endboard/i,
            /end[- ]?board/i
        ];

        // 1. Find combo section headings (h2, h3) and inject warning after them
        const headings = document.querySelectorAll('h2, h3');
        let warningInjected = false; // Only inject ONE per page

        for (const heading of headings) {
            if (warningInjected) break; // Only ONE warning per page
            const text = heading.textContent || '';
            const matchesCombo = comboPatterns.some(pattern => pattern.test(text));

            if (matchesCombo) {
                // Find the parent section or card container
                const section = heading.closest('section') || heading.closest('.card') || heading.parentElement;

                // Avoid duplicate warnings in the same section
                if (section) { // Only inject if we found a valid section
                    warningInjected = true;

                    // Insert warning after the heading
                    const warning = createWarningBanner();
                    heading.insertAdjacentElement('afterend', warning);
                }
            }
        }

        // 2. Handle dynamic combo system containers (data-combo-system attribute)
        const comboContainers = document.querySelectorAll('[data-combo-system]');
        comboContainers.forEach(container => {
            if (!warningInjected && !container.querySelector('.ai-combo-warning')) {
                const warning = createWarningBanner();
                container.insertAdjacentElement('afterbegin', warning);
                warningInjected = true;
            }
        });

        // 3. Handle combo-selector-container (dynamic combos)
        const selectorContainers = document.querySelectorAll('#combo-selector-container, [id*="combo-selector"]');
        selectorContainers.forEach(container => {
            const parent = container.parentElement;
            if (!warningInjected && parent && !parent.querySelector('.ai-combo-warning')) {
                const warning = createWarningBanner();
                container.insertAdjacentElement('beforebegin', warning);
            }
        });

        console.log('[CardLoader] AI combo warnings injected');
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
        getCardImageUrl,
        preloadCards,
        getCachedCard,
        clearCache,
        configure,
        showPopup,
        renderDeckSearchSection,
        cardDataCache,
        // Banlist methods
        fetchBanlistData,
        checkBanlistStatus,
        renderBanlistSection,
        fetchArchetypeCards,
        renderBanlistSectionByArchetype,
        extractRelatedCardsFromCache,
        // Expose a couple of helpers for testing
        extractSummoningMaterials,
        linkifyMaterials,
        removeMaterialsFromDescription,
        setMaterialsDebug: (val) => { debugMaterials = !!val; if (window) window.__CARDLOADER_DEBUG_MATERIALS__ = !!val; },
        // Helpers for testing / external usage
        linkifyMaterials,
        // AI content warning injection
        injectComboWarnings,
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CardLoader.init();
        // Inject AI warnings after a short delay to ensure DOM is fully rendered
        setTimeout(() => CardLoader.injectComboWarnings(), 500);
    });
} else {
    CardLoader.init();
    // Inject AI warnings after a short delay to ensure DOM is fully rendered
    setTimeout(() => CardLoader.injectComboWarnings(), 500);
}