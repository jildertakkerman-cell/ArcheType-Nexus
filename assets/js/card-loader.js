// card-loader.js - Shared module for all archetype pages
// Place this file in: /js/card-loader.js

/**
 * YuGiOh Card Loader Module
 * Handles fetching card data from API and displaying images from Google Cloud Storage
 */
const CardLoader = (function() {
    // Configuration
    const CONFIG = {
        IMAGE_BASE_URL: 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/cards',
        API_URL: 'https://db.ygoprodeck.com/api/v7/cardinfo.php',
        IMAGE_EXTENSIONS: ['.jpg', '.png'], // Try these in order
    };

    // Internal state
    const cardDataCache = {};
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
    }

    /**
     * Creates the popup element if it doesn't exist
     */
    function createPopup() {
        // Check if popup already exists
        popup = document.getElementById('card-popup');
        if (popup) return;

        // Create popup element
        popup = document.createElement('div');
        popup.id = 'card-popup';
        popup.className = 'fixed z-50 bg-red-900 border-2 border-red-500 text-white p-4 rounded-lg shadow-lg max-w-xs max-h-96 overflow-y-auto opacity-0 transition-opacity duration-200 pointer-events-none';
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
     * Load a single card into a container
     * @param {string} cardName - The name of the card
     * @param {string} containerId - The ID of the container element
     */
    async function loadCard(cardName, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container not found: ${containerId}`);
            return;
        }

        // Add click listener for popup
        container.addEventListener('click', (event) => {
            event.stopPropagation();
            showPopup(event, cardName);
        });

        try {
            // Check cache first
            if (cardDataCache[cardName]) {
                displayCardImage(cardDataCache[cardName], container);
                return;
            }

            // Fetch from API
            const cardInfo = await fetchCardData(cardName);
            
            if (cardInfo) {
                // Build image URL from YOUR storage
                cardInfo.hosted_image_url = `${CONFIG.IMAGE_BASE_URL}/${cardInfo.id}.jpg`;
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
     * @param {Object} cardMap - Object mapping container IDs to card names
     * Example: { 'container-1': 'Blue-Eyes White Dragon', 'container-2': 'Dark Magician' }
     */
    async function loadCards(cardMap) {
        const promises = Object.entries(cardMap).map(([containerId, cardName]) => 
            loadCard(cardName, containerId)
        );
        await Promise.all(promises);
    }

    /**
     * Fetch card data from API
     * @param {string} cardName - The name of the card
     * @returns {Promise<Object>} Card data object
     */
    async function fetchCardData(cardName) {
        const apiUrl = `${CONFIG.API_URL}?name=${encodeURIComponent(cardName)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data?.data?.[0];
    }

    /**
     * Display card image in container
     * @param {Object} cardInfo - Card data object
     * @param {HTMLElement} container - Container element
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
        
        // Handle image load errors with fallback to PNG
        img.onerror = function() {
            // Try PNG extension
            if (imageUrl.endsWith('.jpg')) {
                const pngUrl = imageUrl.replace('.jpg', '.png');
                console.warn(`JPG not found, trying PNG: ${pngUrl}`);
                img.src = pngUrl;
                img.onerror = function() {
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
     * @param {Event} event - Click event
     * @param {string} cardName - Card name
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

        // Build stats string
        let stats = '';
        let atkDef = [];
        if (cardInfo.atk !== undefined) atkDef.push(`ATK/${cardInfo.atk}`);
        if (cardInfo.def !== undefined) atkDef.push(`DEF/${cardInfo.def}`);
        if (cardInfo.linkval) atkDef.push(`LINK-${cardInfo.linkval}`);
        if (atkDef.length > 0) {
            stats = `<p class="mt-2 text-red-400 font-bold">${atkDef.join(' ')}</p>`;
        }
        
        const cardType = cardInfo.type.includes('Monster') 
            ? `[${cardInfo.race} / ${cardInfo.type.replace(' Monster', '')}]` 
            : `[${cardInfo.race} Card]`;

        popup.innerHTML = `
            <div>
                <h3 class="text-red-400 font-bold text-lg mb-2">${cardInfo.name}</h3>
                <p class="text-xs text-red-300">${cardType}</p>
                <div class="w-full h-px bg-red-700 my-2"></div>
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
     * @param {Event} event - Mouse event
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
     * @param {Array<string>} cardNames - Array of card names to preload
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

    /**
     * Get cached card data
     * @param {string} cardName - Card name
     * @returns {Object|null} Card data or null if not cached
     */
    function getCachedCard(cardName) {
        return cardDataCache[cardName] || null;
    }

    /**
     * Clear the cache
     */
    function clearCache() {
        Object.keys(cardDataCache).forEach(key => delete cardDataCache[key]);
        console.log('Card cache cleared');
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    function configure(newConfig) {
        Object.assign(CONFIG, newConfig);
        console.log('CardLoader configuration updated:', CONFIG);
    }

    // Public API
    return {
        init,
        loadCard,
        loadCards,
        preloadCards,
        getCachedCard,
        clearCache,
        configure,
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', CardLoader.init);
} else {
    CardLoader.init();
}