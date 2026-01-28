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
        CARD_BACK_URL: 'https://images.ygoprodeck.com/images/cards/back_high.jpg',
        // TCGplayer affiliate tag for price links (leave empty if not using affiliate program)
        TCGPLAYER_AFFILIATE_TAG: '',
        // Supabase configuration for gameplay tags (optional)
        // Set these values to enable tag display in card popups
        // Get your credentials from: https://supabase.com/dashboard/project/_/settings/api
        SUPABASE_URL: window.SUPABASE_CONFIG?.url || '',
        SUPABASE_ANON_KEY: window.SUPABASE_CONFIG?.anonKey || ''
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
    const cardTagsCache = {}; // Cache for gameplay tags by passcode
    let supabaseClient = null; // Lazy-initialized Supabase client
    let banlistData = null;
    let currentBanlistFormat = 'tcg'; // Default format
    let popup = null;
    let activePopup = null;
    let hideTimeout = null;
    let lastShown = 0;
    let currentCard = null;
    // Debug toggle for development — when true, material extraction steps are logged
    let debugMaterials = false;
    let initialized = false;

    // Tag category color mapping for visual styling
    // Categories: Combat, Consistency, Disruption, Mechanics, Protection, Removal
    const TAG_CATEGORY_COLORS = {
        // Combat (Red/Orange)
        combat: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
        // Consistency (Blue)
        consistency: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        // Disruption (Rose/Pink)
        disruption: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
        // Mechanics (Indigo)
        mechanics: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
        // Protection (Teal)
        protection: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
        // Removal (Amber)
        removal: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        // Timing (Purple) - For Quick Effect, etc.
        timing: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
        // Cost (Cyan) - For discard/send costs
        cost: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
        // Economy (Emerald)
        economy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        // Interaction (Fuchsia)
        interaction: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
        // Default
        default: { bg: 'bg-slate-700/50', text: 'text-slate-400', border: 'border-slate-600/30' }
    };

    /**
     * Mapping of specific tags to broad categories
     */
    const KNOWN_TAG_CATEGORIES = {
        // Combat
        "ATK/DEF Modification": "combat",
        "Battle Phase Control": "combat",
        "Burn": "combat",
        "Direct Attack": "combat",
        "Multiple Attacks": "combat",
        "Control Change": "combat",
        "Flip Control": "combat",
        "Self-Burn": "combat", // Assigned from null, fits burn logic or mechanics

        // Consistency
        "Draw Power": "consistency",
        "Extender": "consistency",
        "Miller": "consistency",
        "Recur": "consistency",
        "Searcher": "consistency",

        // Disruption
        "Discard": "disruption",
        "Floodgate": "disruption",
        "Hand Activation": "disruption",
        "Negate": "disruption",

        // Mechanics
        "Pendulum Support": "mechanics",
        "Quick Effect": "mechanics", // User moved this from Timing
        "Tribute Effects": "mechanics",
        "Xyz Support": "mechanics",
        "LP Gain": "mechanics", // Assigned from null

        // Protection
        "Battle Protection": "protection",
        "Cannot Be Banished": "protection",
        "Cannot Be Tributed": "protection",
        "Destruction Protection": "protection",
        "Effect Protection": "protection",
        "Targeting Protection": "protection",
        "Damage Protection": "protection", // Assigned from null

        // Removal
        "Banishment": "removal",
        "Bounce": "removal",
        "Destruction": "removal",
        "Send to GY": "removal",
        "Spin": "removal",
        "Monster Destruction": "removal",
        "Spell Destruction": "removal",
        "Trap Destruction": "removal",

        // Cost
        "Discard Cost": "cost",
        "Discard for Cost": "cost",
        "Banish for Cost": "cost",
        "LP for Cost": "cost",

        // Economy
        "Foolish": "economy",

        // Interaction
        "Banish": "interaction",
        "Removal": "interaction",

        // Mechanics Updates
        "Activation Condition": "mechanics",
        "Activation Requirement": "mechanics",
        "Battle Trigger": "mechanics",
        "Cost": "mechanics",
        "Counter": "mechanics",
        "Effect Trigger": "mechanics",
        "Equip": "mechanics",
        "Graveyard Trigger": "mechanics",
        "Hand Trigger": "mechanics",
        "Material Trigger": "mechanics",
        "Position Change": "mechanics",
        "Special Summon": "mechanics",
        "Stacking": "mechanics",
        "Summoning Trigger": "mechanics",
        "Trap interaction": "mechanics",
        "Tribute": "mechanics"
    };

    /**
     * Priority order for sorting categories
     */
    const CATEGORY_PRIORITY = {
        combat: 1,
        disruption: 2,
        removal: 3,
        interaction: 4,
        protection: 5,
        consistency: 6,
        economy: 7,
        mechanics: 8,
        timing: 9,
        cost: 10,
        default: 99
    };

    /**
     * Helper to group tags by their category
     * @param {Array} tags - Array of tag objects
     * @returns {Object} Grouped tags { CategoryName: [TagName, ...], ... }
     */
    function groupTagsByCategory(tags) {
        const groups = {};

        tags.forEach(tag => {
            // First check KNOWN_TAG_CATEGORIES, then fallback to database category, then default
            const categoryKey = KNOWN_TAG_CATEGORIES[tag.tag_name] ||
                (tag.tag_category ? tag.tag_category.toLowerCase() : 'default');

            // Normalize category name for display (capitalize first letter)
            const displayCategory = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

            if (!groups[categoryKey]) {
                groups[categoryKey] = {
                    key: categoryKey,
                    display: displayCategory,
                    tags: []
                };
            }
            groups[categoryKey].tags.push(tag.tag_name);
        });

        return groups;
    }

    /**
     * Initialize Supabase client (lazy initialization)
     * @returns {Object|null} Supabase client or null if not configured
     */
    function getSupabaseClient() {
        if (supabaseClient) return supabaseClient;

        if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
            return null; // Supabase not configured, silently skip
        }

        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.warn('[CardLoader] Supabase CDN not loaded. Tags feature unavailable.');
            return null;
        }

        try {
            supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
            console.log('[CardLoader] Supabase client initialized');
            return supabaseClient;
        } catch (error) {
            console.error('[CardLoader] Failed to initialize Supabase:', error);
            return null;
        }
    }

    /**
     * Fetch gameplay tags for a card by passcode
     * @param {number} passcode - Card passcode (ID)
     * @returns {Promise<Array>} Array of {tag_name, tag_category} objects
     */
    async function fetchCardTags(passcode) {
        if (!passcode) return [];

        // Check cache first
        if (cardTagsCache[passcode]) {
            return cardTagsCache[passcode];
        }

        const client = getSupabaseClient();
        if (!client) return []; // Supabase not configured

        try {
            const { data, error } = await client.rpc('get_tags_by_passcode', {
                card_passcode: parseInt(passcode)
            });

            if (error) {
                console.error('[CardLoader] Error fetching tags:', error);
                return [];
            }

            // Cache the results
            cardTagsCache[passcode] = data || [];
            return cardTagsCache[passcode];
        } catch (error) {
            console.error('[CardLoader] Failed to fetch card tags:', error);
            return [];
        }
    }

    /**
     * Fetch actions for a specific card+tag combination
     * @param {number} passcode - Card passcode (ID)
     * @param {string} tagName - Tag name to get actions for
     * @returns {Promise<Array>} Array of action names
     */
    async function fetchActionsForTag(passcode, tagName) {
        const client = getSupabaseClient();
        if (!client) return [];

        try {
            const { data, error } = await client.rpc('get_actions_for_card_tag', {
                p_passcode: parseInt(passcode),
                p_tag_name: tagName
            });

            if (error) {
                console.error('[CardLoader] Error fetching tag actions:', error);
                return [];
            }

            return (data || []).map(row => row.action_name);
        } catch (error) {
            console.error('[CardLoader] Failed to fetch tag actions:', error);
            return [];
        }
    }

    // Tag action popup element and state
    let tagActionsPopup = null;

    /**
     * Show popup with actions for a clicked tag
     * @param {Event} event - Click event
     * @param {number} passcode - Card passcode
     * @param {string} tagName - Tag name
     */
    async function showTagActionsPopup(event, passcode, tagName) {
        event.stopPropagation();

        // Create popup if not exists
        if (!tagActionsPopup) {
            tagActionsPopup = document.createElement('div');
            tagActionsPopup.id = 'tag-actions-popup';
            tagActionsPopup.style.cssText = `
                position: fixed;
                z-index: 10001;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 10px 14px;
                max-width: 260px;
                min-width: 160px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.2);
                display: none;
                font-size: 11px;
                color: #e2e8f0;
                line-height: 1.4;
            `;
            document.body.appendChild(tagActionsPopup);
        }

        // Show loading state
        tagActionsPopup.innerHTML = `
            <div class="flex items-center gap-2 text-slate-400 text-[11px]">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading actions...</span>
            </div>
        `;
        tagActionsPopup.style.display = 'block';

        // Position near clicked element
        const rect = event.target.getBoundingClientRect();
        const popupX = Math.min(rect.left, window.innerWidth - 300);
        const popupY = rect.bottom + 8;
        tagActionsPopup.style.left = `${Math.max(10, popupX)}px`;
        tagActionsPopup.style.top = `${popupY}px`;

        // Fetch actions
        const actions = await fetchActionsForTag(passcode, tagName);

        // Get tag category color
        const category = (KNOWN_TAG_CATEGORIES[tagName] || 'default').toLowerCase();
        const colors = TAG_CATEGORY_COLORS[category] || TAG_CATEGORY_COLORS.default;

        if (actions.length === 0) {
            tagActionsPopup.innerHTML = `
                <div class="text-slate-400 italic text-[10px]">No actions found for this tag.</div>
            `;
        } else {
            tagActionsPopup.innerHTML = `
                <div class="mb-1.5 pb-1.5 border-b border-slate-600/30">
                    <span style="font-size: 9px;" class="uppercase font-bold ${colors.text} tracking-wider opacity-80">${tagName}</span>
                </div>
                <ul class="space-y-1.5">
                    ${actions.map(action => `
                        <li class="flex items-start gap-2.5">
                            <div class="w-1 h-1 rounded-full bg-blue-500/50 mt-[6px] shrink-0"></div>
                            <span class="text-slate-300 leading-tight">${action}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }

        // Reposition if goes off-screen
        const popupRect = tagActionsPopup.getBoundingClientRect();
        if (popupRect.bottom > window.innerHeight - 10) {
            tagActionsPopup.style.top = `${rect.top - popupRect.height - 8}px`;
        }
        if (popupRect.right > window.innerWidth - 10) {
            tagActionsPopup.style.left = `${window.innerWidth - popupRect.width - 10}px`;
        }
    }

    /**
     * Hide the tag actions popup
     */
    function hideTagActionsPopup() {
        if (tagActionsPopup) {
            tagActionsPopup.style.display = 'none';
        }
    }

    // Global click listener to close tag popup
    document.addEventListener('click', (e) => {
        if (tagActionsPopup && !tagActionsPopup.contains(e.target) && !e.target.classList.contains('tag-action-trigger')) {
            hideTagActionsPopup();
        }
    });

    // Expose function globally for onclick handlers
    window.showTagActionsPopup = showTagActionsPopup;

    /**
     * Format tags section HTML for card popup
     * @param {Array} tags - Array of {tag_name, tag_category} objects
     * @param {string} cardType - Optional card type string to check for Extra Deck exclusion
     * @param {number} passcode - Optional card passcode for action lookups
     * @returns {string} HTML string for tags section
     */
    function formatTagsSection(tags, cardType = '', passcode = null, cardName = '', hasDiscardAction = false) {
        if (!tags || tags.length === 0) return '';

        // Extract tag names for hand trap detection
        const tagNames = tags.map(t => t.tag_name);

        // Extra Deck monster types that should never be hand traps
        const extraDeckTypes = ['Fusion', 'Synchro', 'Xyz', 'Link', 'Pendulum'];
        const isExtraDeck = extraDeckTypes.some(type => cardType.includes(type));

        // Detect true hand traps: Hand Activation + Discard Cost (Action verification)
        // BUT exclude Extra Deck monsters
        // ALSO include Mulcharmy cards (draw-based hand traps with Hand Activation)
        const isMulcharmy = cardName.toLowerCase().startsWith('mulcharmy');
        const isHandTrap = !isExtraDeck && tagNames.includes('Hand Activation') &&
            (hasDiscardAction || isMulcharmy);

        // Group tags by category
        const groups = groupTagsByCategory(tags);
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const prioA = CATEGORY_PRIORITY[groups[a].key] || 99;
            const prioB = CATEGORY_PRIORITY[groups[b].key] || 99;
            return prioA - prioB;
        });

        // Generate unique IDs for this popup instance
        const instanceId = Date.now();

        const tagGroupsHtml = sortedKeys.map((key, index) => {
            const group = groups[key];
            const colors = TAG_CATEGORY_COLORS[group.key] || TAG_CATEGORY_COLORS.default;
            const groupId = `tag-group-${instanceId}-${index}`;

            // Join tags with a subtle bullet - make clickable if passcode provided
            const tagsList = group.tags.map(t => {
                // Escape single quotes for the onclick handler
                const escapedTag = t.replace(/'/g, "\\'");

                if (passcode) {
                    // Clickable pill style
                    return `
                        <button 
                            class="tag-action-trigger inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium bg-slate-800/80 border border-slate-700/60 transition-all cursor-pointer hover:bg-slate-700 hover:border-slate-500 hover:text-white group relative"
                            onclick="window.showTagActionsPopup(event, ${passcode}, '${escapedTag}')"
                            title="Click to view actions for ${t}"
                        >
                            <span class="${colors.text} opacity-90 group-hover:opacity-100 group-hover:text-white transition-opacity text-shadow-sm">${t}</span>
                            <span class="ml-1.5 text-slate-500 group-hover:text-slate-300 text-[8px]"><i class="fas fa-search"></i></span>
                        </button>`;
                }
                // Non-clickable pill style
                return `<span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-slate-800/40 border border-slate-700/20 text-slate-500 cursor-default">${t}</span>`;
            }).join('');

            return `
                <div class="mb-2 last:mb-0">
                    <button 
                        type="button"
                        class="w-full text-left uppercase font-bold ${colors.text} opacity-80 hover:opacity-100 flex items-center gap-1.5 ml-1 cursor-pointer transition-opacity"
                        style="font-size: 9px; letter-spacing: 0.05em;"
                        onclick="const content = document.getElementById('${groupId}'); const icon = this.querySelector('.toggle-icon'); if (content.classList.contains('hidden')) { content.classList.remove('hidden'); icon.classList.remove('fa-chevron-right'); icon.classList.add('fa-chevron-down'); } else { content.classList.add('hidden'); icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-right'); }"
                        title="Click to expand ${group.display}"
                    >
                        <i class="fas fa-chevron-right toggle-icon text-[8px] opacity-60" style="width: 8px;"></i>
                        ${group.display}
                        <span class="text-slate-500 font-normal ml-1">(${group.tags.length})</span>
                    </button>
                    <div id="${groupId}" class="flex flex-wrap gap-1.5 mt-1 hidden">
                        ${tagsList}
                    </div>
                </div>`;
        }).join('');

        // Add special Hand Trap indicator if detected
        const handTrapBadge = isHandTrap
            ? `<div class="mb-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/90 text-yellow-900 border border-yellow-400 shadow-sm shadow-yellow-500/30">
                ✋ Hand Trap
                </span>
               </div>`
            : '';

        if (!tagGroupsHtml && !handTrapBadge) return '';

        return `
            <div class="mt-3 pt-2 border-t border-gray-700">
                <div class="text-xs text-gray-400 mb-2">🏷️ Gameplay Tags</div>
                ${handTrapBadge}
                <div class="flex flex-col gap-1">${tagGroupsHtml}</div>
            </div>
        `;
    }

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
            // Mobile: 90vw width (almost full screen), Desktop: 420px max
            // Check if mobile (< 768px)
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                el.style.maxWidth = '90vw';
                el.style.width = '90vw';
            } else {
                el.style.maxWidth = '420px';
                el.style.width = '100%';
            }
            // Max height with some margin for viewport
            el.style.maxHeight = 'calc(100vh - 40px)';
            // Allow text to wrap and handle overflow
            el.style.wordWrap = 'break-word';
            el.style.overflowWrap = 'break-word';
        };

        if (popup) {
            applyConstraints(popup);
            return;
        }

        popup = document.createElement('div');
        popup.id = 'card-popup';
        popup.className = 'z-50 text-white p-4 rounded-lg shadow-2xl opacity-0 transition-opacity duration-200 pointer-events-none';
        popup.style.position = 'fixed';
        popup.style.backgroundColor = '#0f172a'; // Solid dark slate background
        popup.style.border = '2px solid #3b82f6'; // Blue border
        popup.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.5)'; // Strong shadow for depth
        popup.style.position = 'fixed';
        popup.style.display = 'none';
        applyConstraints(popup);

        // Re-apply constraints on resize
        window.addEventListener('resize', () => {
            if (popup) applyConstraints(popup);
        });

        // Keep popup open when hovering over it (Desktop)
        popup.addEventListener('mouseenter', () => {
            if (hideTimeout) clearTimeout(hideTimeout);
        });
        popup.addEventListener('mouseleave', () => {
            hidePopup();
        });

        document.body.appendChild(popup);
    }

    /**
     * Large Image Modal (Lightbox)
     */
    let largeImageModal = null;

    function createLargeImageModal() {
        if (largeImageModal) return;

        largeImageModal = document.createElement('div');
        largeImageModal.id = 'large-image-modal';
        largeImageModal.className = 'fixed inset-0 z-[10002] bg-black/85 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300 backdrop-blur-sm';

        // Close on ANY click
        largeImageModal.onclick = () => hideLargeImageModal();

        largeImageModal.innerHTML = `
            <div class="relative flex flex-col items-center justify-center w-full h-full">
                <!-- Reduced size: max-h-[80vh], max-w-[80vw] -->
                <img id="large-card-image" src="" alt="Card Art" class="max-h-[80vh] max-w-[80vw] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 transform scale-95 transition-transform duration-300 cursor-zoom-out" title="Click to close">
                <button class="mt-6 px-6 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full border border-slate-600 transition-all font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 group">
                    <i class="fas fa-times text-slate-400 group-hover:text-white transition-colors"></i> Close
                </button>
            </div>
        `;
        document.body.appendChild(largeImageModal);
    }

    async function showLargeImageModal(cardName, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!largeImageModal) createLargeImageModal();

        // Show loading state or placeholder if needed, but usually fast enough
        // Fetch image URL
        const imgUrl = await getCardImageUrl(cardName);
        if (!imgUrl) {
            console.error('Could not find image for', cardName);
            return;
        }

        const img = largeImageModal.querySelector('img');
        img.src = imgUrl;

        largeImageModal.style.display = 'flex';
        // Trigger reflow
        requestAnimationFrame(() => {
            largeImageModal.classList.remove('opacity-0', 'pointer-events-none');
            img.classList.remove('scale-95');
            img.classList.add('scale-100');
        });
    }

    function hideLargeImageModal() {
        if (!largeImageModal) return;

        largeImageModal.classList.add('opacity-0', 'pointer-events-none');
        const img = largeImageModal.querySelector('img');
        if (img) {
            img.classList.remove('scale-100');
            img.classList.add('scale-95');
        }

        setTimeout(() => {
            largeImageModal.style.display = 'none';
        }, 300);
    }

    // Export internal functions to global CardLoader object immediately if it exists (for inline HTML handlers)
    window.CardLoader = window.CardLoader || {};
    window.CardLoader.showLargeImageByName = showLargeImageModal;
    window.CardLoader.hideLargeImageModal = hideLargeImageModal;

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

            // Close Large Image Modal if clicking outside image (redundant check but safe)
            if (largeImageModal && largeImageModal.style.display !== 'none' && event.target === largeImageModal) {
                hideLargeImageModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hidePopup();
                hideLargeImageModal();
            }
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

                // Check if there's a scheduled next banlist and if its effective date has passed
                let activeBanlistData = localData[format];
                let banlistVersion = 'current';

                if (localData.nextBanlist && localData.nextBanlist.effectiveDate && localData.nextBanlist[format]) {
                    const effectiveDate = new Date(localData.nextBanlist.effectiveDate);
                    const now = new Date();

                    // Use next banlist if we've reached or passed the effective date
                    if (now >= effectiveDate) {
                        activeBanlistData = localData.nextBanlist[format];
                        banlistVersion = `scheduled (effective ${localData.nextBanlist.effectiveDate})`;
                        console.log(`[CardLoader] Using scheduled ${format.toUpperCase()} banlist effective from ${localData.nextBanlist.effectiveDate}`);
                    } else {
                        // Calculate days until the new banlist takes effect
                        const daysUntil = Math.ceil((effectiveDate - now) / (1000 * 60 * 60 * 24));
                        console.log(`[CardLoader] New ${format.toUpperCase()} banlist scheduled in ${daysUntil} day(s) (${localData.nextBanlist.effectiveDate})`);
                    }
                }

                if (activeBanlistData) {
                    const banlistMap = {};

                    // Process forbidden cards
                    if (activeBanlistData.forbidden && Array.isArray(activeBanlistData.forbidden)) {
                        activeBanlistData.forbidden.forEach(cardName => {
                            banlistMap[cardName] = 'Forbidden';
                        });
                    }

                    // Process limited cards
                    if (activeBanlistData.limited && Array.isArray(activeBanlistData.limited)) {
                        activeBanlistData.limited.forEach(cardName => {
                            banlistMap[cardName] = 'Limited';
                        });
                    }

                    // Process semi-limited cards
                    if (activeBanlistData.semiLimited && Array.isArray(activeBanlistData.semiLimited)) {
                        activeBanlistData.semiLimited.forEach(cardName => {
                            banlistMap[cardName] = 'Semi-Limited';
                        });
                    }

                    banlistCache[format] = banlistMap;
                    console.log(`[CardLoader] ${format.toUpperCase()} banlist loaded (${banlistVersion}). Total restricted cards:`, Object.keys(banlistMap).length);
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

        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

        if (isMobile) {
            // Mobile: Tap to show popup
            container.addEventListener('click', (event) => {
                event.stopPropagation();
                showPopup(event, cardName);
            });
        } else {
            // Desktop: Hover for popup, Click for Large Image
            container.addEventListener('mouseenter', (event) => {
                showPopup(event, cardName);
            });

            container.addEventListener('mouseleave', () => {
                hidePopup();
            });

            container.addEventListener('click', (event) => {
                // If the container is inside a link, we might want to let the link work?
                // User requirement: "When you click the card it shows a way larger image".
                // This implies blocking navigation if it refers to the same visual element.
                // Assuming card containers are primary interaction points.
                event.preventDefault(); // Stop link navigation if applicable
                event.stopPropagation();
                showLargeImageModal(cardName, event);
            });
        }

        try {
            if (cardDataCache[cardName]) {
                displayCardImage(cardDataCache[cardName], container);
                return;
            }

            const cardInfo = await fetchCardData(cardName);

            if (cardInfo) {
                cardInfo.hosted_image_url = `${CONFIG.IMAGE_BASE_URL}/${encodeURIComponent(cardInfo.id)}.png`;
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
            return `${CONFIG.IMAGE_BASE_URL}/${encodeURIComponent(cardInfo.id)}.png`;
        } catch (error) {
            console.error(`Failed to get image URL for "${cardName}":`, error);
            return null;
        }
    }

    /**
     * Load a single card by ID into a container
     */
    async function loadCardById(cardId, containerId) {
        console.log('[CardLoader] loadCardById called for:', cardId, 'container:', containerId);
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // Check cache first (by ID if possible, or we might need a separate id cache)
            // But cardDataCache is keyed by name.
            // Let's optimize: fetch data, then cache by Name AND ID?
            // For now, just fetch.

            const cardInfo = await fetchCardDataById(cardId);

            if (cardInfo) {
                cardInfo.hosted_image_url = `${CONFIG.IMAGE_BASE_URL}/${encodeURIComponent(cardInfo.id)}.png`;
                // Cache by name for future lookups
                cardDataCache[cardInfo.name] = cardInfo;

                // Add click listener for popup (uses name)
                container.addEventListener('click', (event) => {
                    event.stopPropagation();
                    showPopup(event, cardInfo.name);
                });

                displayCardImage(cardInfo, container);
            } else {
                throw new Error('Card data not found');
            }
        } catch (error) {
            console.error(`Failed to load card ID "${cardId}":`, error);
            container.innerHTML = `<div class="card-placeholder">ID: ${cardId}</div>`;
        }
    }

    /**
     * Map Supabase card row to YGOProDeck-compatible format
     * @param {Object} card - Raw card data from Supabase
     * @returns {Object} Card data in YGOProDeck API format
     */
    function mapSupabaseCardToApiFormat(card) {
        const mappedCard = {
            id: card.passcode,
            name: card.cardname,
            type: card.cardtype || 'Unknown',
            desc: card.description || '',
            atk: card.atk,
            def: card.def,
            level: card.level,
            race: card.types ? card.types.split(' / ')[0] : 'Unknown',
            attribute: card.attribute,
            linkval: card.link,
            scale: card.pendulumscale,
            _fromSupabase: true,
            format: card.format
        };

        // Handle Link monsters (no DEF, use link value)
        if (card.link) {
            delete mappedCard.def;
            mappedCard.linkval = card.link;
        }

        // For spell/trap property (Normal, Quick-Play, Continuous, etc.)
        if (card.property) {
            mappedCard.race = card.property;
        }

        return mappedCard;
    }

    /**
     * Fetch card data from Supabase using direct table query
     * @param {string} cardName - Card name to search for
     * @returns {Object|null} Card data in YGOProDeck-compatible format or null if not found
     */
    async function fetchCardDataFromSupabase(cardName) {
        const client = getSupabaseClient();
        if (!client) {
            console.log('[CardLoader] Supabase not configured, skipping database lookup');
            return null;
        }

        try {
            console.log('[CardLoader] Fetching card from Supabase:', cardName);
            const { data, error } = await client
                .from('cards')
                .select('cardid, cardname, passcode, cardtype, attribute, property, types, level, atk, def, link, pendulumscale, description, format')
                .ilike('cardname', cardName)
                .limit(1);

            if (error) {
                console.warn('[CardLoader] Supabase query error:', error);
                return null;
            }

            if (!data || data.length === 0) {
                console.log('[CardLoader] Card not found in Supabase:', cardName);
                return null;
            }

            const card = data[0];
            console.log('[CardLoader] Card found in Supabase:', card.cardname);

            return mapSupabaseCardToApiFormat(card);
        } catch (err) {
            console.warn('[CardLoader] Error fetching from Supabase:', err);
            return null;
        }
    }

    /**
     * Fetch card data from API
     * Tries Supabase first, falls back to YGOProDeck API
     */
    /**
     * Fetch card data from API
     * Tries Supabase first, falls back to YGOProDeck API
     */
    async function fetchCardData(cardName) {
        // First, try to fetch from Supabase database
        const supabaseData = await fetchCardDataFromSupabase(cardName);

        if (supabaseData) {
            // Enriched Supabase data with Sets/Prices from API if missing
            // This covers the case where Supabase has core data but not prices/sets yet
            if (!supabaseData.card_sets || !supabaseData.card_prices) {
                try {
                    const apiUrl = `${CONFIG.API_URL}?name=${encodeURIComponent(cardName)}&misc=yes`;
                    const response = await fetch(apiUrl);
                    if (response.ok) {
                        const apiJson = await response.json();
                        const apiData = apiJson?.data?.[0];
                        if (apiData) {
                            if (!supabaseData.card_sets) supabaseData.card_sets = apiData.card_sets;
                            if (!supabaseData.card_prices) supabaseData.card_prices = apiData.card_prices;
                        }
                    }
                } catch (e) {
                    console.warn('[CardLoader] Failed to fetch enrichment data from API:', e);
                }
            }
            return supabaseData;
        }

        // Fallback to YGOProDeck API
        const apiUrl = `${CONFIG.API_URL}?name=${encodeURIComponent(cardName)}&misc=yes`;
        console.log("[CardLoader] fetchCardData called for:", cardName, "URL:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data?.data?.[0];
    }

    /**
     * Fetch card data from Supabase by passcode using direct table query
     * @param {number} passcode - Card passcode (ID)
     * @returns {Object|null} Card data in YGOProDeck-compatible format or null
     */
    async function fetchCardDataByIdFromSupabase(passcode) {
        const client = getSupabaseClient();
        if (!client) {
            return null;
        }

        try {
            console.log('[CardLoader] Fetching card by ID from Supabase:', passcode);
            const { data, error } = await client
                .from('cards')
                .select('cardid, cardname, passcode, cardtype, attribute, property, types, level, atk, def, link, pendulumscale, description, format')
                .eq('passcode', passcode)
                .limit(1);

            if (error || !data || data.length === 0) {
                return null;
            }

            const card = data[0];
            console.log('[CardLoader] Card found in Supabase by ID:', card.cardname);

            return mapSupabaseCardToApiFormat(card);
        } catch (err) {
            console.warn('[CardLoader] Error fetching by ID from Supabase:', err);
            return null;
        }
    }

    /**
     * Fetch card data from API by ID
     * Tries Supabase first, falls back to YGOProDeck API
     */
    async function fetchCardDataById(cardId) {
        // Try Supabase first
        const supabaseData = await fetchCardDataByIdFromSupabase(cardId);

        if (supabaseData) {
            // Enriched Supabase data with Sets/Prices from API if missing
            if (!supabaseData.card_sets || !supabaseData.card_prices) {
                try {
                    const apiUrl = `${CONFIG.API_URL}?id=${cardId}&misc=yes`;
                    const response = await fetch(apiUrl);
                    if (response.ok) {
                        const apiJson = await response.json();
                        const apiData = apiJson?.data?.[0];
                        if (apiData) {
                            if (!supabaseData.card_sets) supabaseData.card_sets = apiData.card_sets;
                            if (!supabaseData.card_prices) supabaseData.card_prices = apiData.card_prices;
                        }
                    }
                } catch (e) {
                    console.warn('[CardLoader] Failed to fetch enrichment data by ID from API:', e);
                }
            }
            return supabaseData;
        }

        // Fallback to YGOProDeck API
        const apiUrl = `${CONFIG.API_URL}?id=${cardId}&misc=yes`;
        console.log("[CardLoader] fetchCardDataById called for:", cardId, "URL:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data?.data?.[0]; // API returns array even for single ID
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

        // Add Release Date Badge
        let dateDisplay = '';
        if (cardInfo.misc_info && cardInfo.misc_info[0]) {
            dateDisplay = cardInfo.misc_info[0].tcg_date || cardInfo.misc_info[0].ocg_date || '';
        } else if (cardInfo.tcg_date || cardInfo.ocg_date) {
            dateDisplay = cardInfo.tcg_date || cardInfo.ocg_date;
        }

        // Date badge is now handled in the card template (renderBrowserCardSection)
        // to allow for better positioning and styling control

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
            /^(?!If|When|You|Once|During|For|Unless|While|Then|In the)(?=(?:\d+|"[^"]+"))([^\r\n]*?"[^"]+"(?:\s*\+\s*"[^"]+")*(?:\s*\+\s*(?:(?!(?:If|When|You|Once|During|For|Unless|While|Then|In the|Gains)\b)[^.\r\n])*)?)/im,

            /^("[^"]*"(?:\s*\+\s*"[^"]*")+(?:\s*\+\s*"[^"]*")*)/,
            /^(\d+(?:\s*\+\s*\d+)?\s*[\w \t"]+monsters?)/i,
            // Specific catch-all for "Tuners" (e.g. 2+ Tuners)
            /^(\d+\+?\s+Tuners(?:\r?\n(?!\s*(?:Monsters|[A-Z])).*)*)/im,
            // Generic catch-all for materials ending with "monsters" - include the following clause until next capitalized sentence
            // Updated to avoid matching sentence starts like "Other Tuners you control..." by requiring digit or quote start, OR unlikely starting words
            /^((?:\d+|"[^"]+")[^\r\n]*?monsters?(?:\r?\n(?!\s*(?:Monsters|[A-Z])).*)*)/im
        ];

        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
                console.log(`[MaterialDebug] Pattern: ${pattern} matched: ${match[1]}`);
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

                    // Determine where the main match ended to look ahead
                    let currentEndIndex = match.index + match[0].length;
                    let lookahead = description.slice(currentEndIndex);

                    // 1. Check for Trailing Noun types (e.g. 1 "Name" Tuner)
                    // This must be done BEFORE + checks because the + might follow the tuner type
                    const trailingMonster = lookahead.match(/^[ \t]*((?:(?!Monster|Tuner)[ \t\w"'\-])+?(?:Monster|Tuner)(?:s)?)/i);
                    if (trailingMonster && trailingMonster[0]) {
                        // Validate it's not a false positive
                        const currentEnd = materials.trim().match(/monsters?$/i);
                        const nextStart = trailingMonster[1].trim().match(/^monsters?$/i);
                        let validTrailing = true;

                        // Don't duplicate "monster"
                        if (currentEnd && nextStart) validTrailing = false;
                        // Only accept short phrases, avoid sentences
                        if (trailingMonster[0].length >= 50 || /^(?:A|The)\s/i.test(trailingMonster[1])) validTrailing = false;

                        if (validTrailing) {
                            materials += trailingMonster[0];
                            // Advance the lookahead past this trailing noun
                            currentEndIndex += trailingMonster[0].length;
                            lookahead = description.slice(currentEndIndex);
                        }
                    }

                    // 2. Check for sentence starts - if the lookahead is effect text, stop here
                    if (/^\s*(?:You|If|When|Once|During|For|Unless|While|Then|In the|When your|If that|If this|If a|If an|If any|When a|When an|When you|While your|Any|Each|All|Must|This|Gains)\b/i.test(lookahead)) {
                        return materials;
                    }

                    // 3. Check for quoted continuations (e.g. + "Card Name")
                    const plusQuoted = lookahead.match(/^\s*\+\s*"[^"]+"(?:\s*\+\s*"[^"]+")*/m);
                    if (plusQuoted && plusQuoted[0]) {
                        return materials + plusQuoted[0];
                    }

                    // 4. Check for unquoted generic continuations (e.g., "+ 1+ Tuners")
                    // Matches: + (qty) (optional adjectives) (type)
                    const plusGeneric = lookahead.match(/^\s*\+\s*(?:1\+|1 or more|\d+)\s+(?:[\w\s"-]*?)(?:Monsters?|Tuners?)(?:\s+or\s+more)?(?:\s+(?!If|When|You|Once|During|For|In the|Gains)[^.\r\n]*)?/im);
                    if (plusGeneric && plusGeneric[0]) {
                        // Ensure we don't accidentally grab a sentence start
                        if (!/^\s*\+\s*(?:If|When|You|Once|During|For|In the|Gains)\b/i.test(plusGeneric[0])) {
                            const combined = materials + plusGeneric[0];
                            if (combined.length < 200) return combined;
                        }
                    }

                    // 5. Check for comma continuations (e.g., ", including...")
                    const commaCont = lookahead.match(/^\s*(?:,|\u2013|\u2014|\*|\u2022|•|-)?\s*(?:including|including a|such as|or|and|excluding|except|with|without|but|among|specifically)\b[^\r\n]*/im);
                    if (commaCont && commaCont[0]) {
                        const combined = materials + commaCont[0];
                        if (combined.length < 200) return combined;
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
     * Format sets section HTML for card popup
     * Uses card_sets from YGOProDeck API
     * @param {Object} cardInfo - Card data object from API
     * @returns {string} HTML string for sets section
     */
    function formatSetsSection(cardInfo) {
        if (!cardInfo || !cardInfo.card_sets || cardInfo.card_sets.length === 0) {
            return '<p class="text-gray-500 text-xs italic">No set data available.</p>';
        }

        const sets = cardInfo.card_sets;

        // Sort by set name alphabetically
        const sortedSets = [...sets].sort((a, b) => a.set_name.localeCompare(b.set_name));

        const setItems = sortedSets.map(set => {
            const rarity = set.set_rarity || 'Unknown';
            const rarityShort = set.set_rarity_code || '';
            const setCode = set.set_code || '';
            const priceVal = set.set_price ? parseFloat(set.set_price) : 0;
            const price = priceVal > 0 ? `$${priceVal.toFixed(2)}` : '';

            // Rarity color coding
            let rarityColor = 'text-gray-400';
            if (rarity.includes('Secret')) rarityColor = 'text-yellow-300';
            else if (rarity.includes('Ultra')) rarityColor = 'text-amber-400';
            else if (rarity.includes('Super')) rarityColor = 'text-blue-400';
            else if (rarity.includes('Rare')) rarityColor = 'text-cyan-400';
            else if (rarity.includes('Common')) rarityColor = 'text-slate-400';

            return `
                <div class="flex items-start gap-2 py-1.5 border-b border-slate-700/50 last:border-0">
                    <div class="flex-1 min-w-0">
                        <div class="text-xs text-slate-200 truncate" title="${set.set_name}">${set.set_name}</div>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] text-slate-500 font-mono">${setCode}</span>
                            <span class="text-[10px] ${rarityColor} font-medium">${rarityShort || rarity}</span>
                        </div>
                    </div>
                    ${price ? `<span class="text-[10px] text-green-400 font-medium whitespace-nowrap">${price}</span>` : ''}
                </div>`;
        }).join('');

        return `
            <div class="text-xs text-gray-400 mb-2">📦 ${sets.length} Set${sets.length > 1 ? 's' : ''}</div>
            <div class="space-y-0">${setItems}</div>
        `;
    }

    /**
     * Format price section HTML for card popup
     * Uses prices from YGOProDeck API (card_prices array)
     * @param {Object} cardInfo - Card data object from API
     * @returns {string} HTML string for price section
     */
    function formatPriceSection(cardInfo) {
        if (!cardInfo || !cardInfo.card_prices || !cardInfo.card_prices[0]) {
            return '';
        }

        const prices = cardInfo.card_prices[0];
        const tcgPrice = parseFloat(prices.tcgplayer_price);
        const cmPrice = parseFloat(prices.cardmarket_price);

        // If both prices are 0 or missing, don't show price section
        if ((!tcgPrice || tcgPrice === 0) && (!cmPrice || cmPrice === 0)) {
            return '';
        }

        const encodedName = encodeURIComponent(cardInfo.name);

        // Build TCGplayer URL with optional affiliate tag
        let tcgUrl = `https://www.tcgplayer.com/search/yugioh/product?q=${encodedName}`;
        if (CONFIG.TCGPLAYER_AFFILIATE_TAG) {
            tcgUrl += `&utm_campaign=affiliate&utm_medium=${CONFIG.TCGPLAYER_AFFILIATE_TAG}`;
        }

        // Cardmarket URL
        const cmUrl = `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodedName}`;

        let priceHtml = '<div class="mt-3 pt-2 border-t border-gray-700">';
        priceHtml += '<div class="text-xs text-gray-400 mb-2">💰 Market Prices</div>';

        // Main price comparison bar
        const maxPrice = Math.max(tcgPrice || 0, cmPrice || 0);
        if (maxPrice > 0) {
            priceHtml += '<div class="mb-3">';

            if (tcgPrice && tcgPrice > 0) {
                const tcgWidth = (tcgPrice / maxPrice) * 100;
                priceHtml += `
                    <a href="${tcgUrl}" target="_blank" rel="noopener noreferrer" class="block mb-2 group">
                        <div class="flex items-center justify-between text-[10px] mb-0.5">
                            <span class="text-gray-400 group-hover:text-gray-200">TCGplayer</span>
                            <span class="text-green-400 font-bold">$${tcgPrice.toFixed(2)}</span>
                        </div>
                        <div class="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style="width: ${tcgWidth}%"></div>
                        </div>
                    </a>`;
            }

            if (cmPrice && cmPrice > 0) {
                const cmWidth = (cmPrice / maxPrice) * 100;
                priceHtml += `
                    <a href="${cmUrl}" target="_blank" rel="noopener noreferrer" class="block group">
                        <div class="flex items-center justify-between text-[10px] mb-0.5">
                            <span class="text-gray-400 group-hover:text-gray-200">Cardmarket</span>
                            <span class="text-green-400 font-bold">€${cmPrice.toFixed(2)}</span>
                        </div>
                        <div class="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style="width: ${cmWidth}%"></div>
                        </div>
                    </a>`;
            }

            priceHtml += '</div>';
        }

        // Price by printing chart (if card_sets available)
        if (cardInfo.card_sets && cardInfo.card_sets.length > 0) {
            const setsWithPrices = cardInfo.card_sets
                .filter(s => s.set_price && parseFloat(s.set_price) > 0)
                .map(s => ({ ...s, price: parseFloat(s.set_price) }))
                .sort((a, b) => b.price - a.price)
                .slice(0, 6); // Top 6 most expensive

            if (setsWithPrices.length > 0) {
                const maxSetPrice = setsWithPrices[0].price;

                priceHtml += '<div class="mt-3 pt-2 border-t border-slate-700">';
                priceHtml += '<div style="font-size: 10px; color: #9ca3af; margin-bottom: 6px;">📊 Price by Printing (Top 6)</div>';

                setsWithPrices.forEach(set => {
                    const width = (set.price / maxSetPrice) * 100;
                    const rarity = set.set_rarity || '';

                    // Color by rarity (using inline styles)
                    let barBg = 'linear-gradient(to right, #64748b, #94a3b8)'; // default slate
                    if (rarity.includes('Secret')) barBg = 'linear-gradient(to right, #eab308, #fde047)';
                    else if (rarity.includes('Ultra')) barBg = 'linear-gradient(to right, #f59e0b, #fbbf24)';
                    else if (rarity.includes('Super')) barBg = 'linear-gradient(to right, #3b82f6, #60a5fa)';
                    else if (rarity.includes('Rare')) barBg = 'linear-gradient(to right, #06b6d4, #22d3ee)';

                    priceHtml += `
                        <div style="margin-bottom: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
                                <span style="color: #9ca3af; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${set.set_name}">${set.set_code || set.set_name}</span>
                                <span style="color: #4ade80; font-weight: bold;">$${set.price.toFixed(2)}</span>
                            </div>
                            <div style="height: 6px; background-color: #1e293b; border-radius: 9999px; overflow: hidden;">
                                <div style="height: 100%; width: ${width}%; background: ${barBg}; border-radius: 9999px;"></div>
                            </div>
                        </div>`;
                });

                priceHtml += '</div>';
            }
        }

        priceHtml += '</div>';
        return priceHtml;
    }

    /**
     * Show popup with card details
     */
    /**
     * Switch popup tab
     */
    window.switchPopupTab = function (tabName) {
        const popup = document.getElementById('card-popup');
        if (!popup) return;

        // Update tab buttons
        const tabs = popup.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('text-blue-400', 'border-blue-500');
                btn.classList.remove('text-slate-200', 'border-transparent');
                btn.style.backgroundColor = '#334155'; // Active tab background
            } else {
                btn.classList.remove('text-blue-400', 'border-blue-500');
                btn.classList.add('text-slate-200', 'border-transparent');
                btn.style.backgroundColor = ''; // Reset to default
            }
        });

        // Update tab content
        const contents = popup.querySelectorAll('.tab-content');
        contents.forEach(content => {
            if (content.id === `tab-${tabName}`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    };

    /**
     * Show popup by card name - can be called directly without requiring card to be pre-loaded
     * Fetches card data first if needed, then shows the popup
     * @param {string} cardName - Name of the card to show
     * @param {Event} event - Optional click event for positioning
     */
    async function showPopupByName(cardName, event) {
        if (!cardName) return;

        // Stop propagation immediately to prevent document click from closing existing popup
        // before the new one opens (during the await fetch)
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }

        // Create a synthetic event if none provided
        if (!event) {
            event = {
                stopPropagation: () => { },
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2
            };
        }

        // Check if card is already in cache
        if (!cardDataCache[cardName]) {
            // Fetch card data first
            const data = await fetchCardData(cardName);
            if (data) {
                cardDataCache[cardName] = data;
            } else {
                console.warn('[CardLoader] Could not fetch card:', cardName);
                return;
            }
        }

        // Now show the popup
        showPopup(event, cardName);
    }

    function showPopup(event, cardName) {
        // Cancel pending hide if any
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

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

        // Lazy load description/data if missing or if release date (misc_info) is missing
        const needsFetch = (!cardInfo.desc || cardInfo.desc === '' || !cardInfo.misc_info);

        if (needsFetch && !cardInfo.is_dummy && !cardInfo._fetching) {
            cardInfo._fetching = true;
            console.log('[CardLoader] Lazy loading details for:', cardName);
            fetchCardData(cardName).then(data => {
                cardInfo._fetching = false;
                if (data) {
                    Object.assign(cardInfo, data);
                    if (activePopup && currentCard === cardName) {
                        const descArea = document.getElementById('popup-desc-area');
                        if (descArea) descArea.innerHTML = formatCardDescription(cardInfo.desc, cardInfo.type, cardInfo.name);

                        // Update price
                        const priceArea = document.getElementById('popup-price-area');
                        if (priceArea) priceArea.innerHTML = formatPriceSection(cardInfo).replace('<div class="mt-3 pt-2 border-t border-gray-700">', '').replace('<div class="text-xs text-gray-400 mb-1">💰 Prices</div>', '');

                        // Update release date
                        const misc = cardInfo.misc_info ? cardInfo.misc_info[0] : null;
                        if (misc && (misc.tcg_date || misc.ocg_date)) {
                            const dateStr = misc.tcg_date || misc.ocg_date;
                            const dateHeader = document.getElementById('popup-release-date');
                            if (dateHeader) {
                                dateHeader.textContent = `Release: ${dateStr}`;
                                dateHeader.classList.remove('hidden');
                            }
                        }

                        // Re-position the popup after content update to prevent it from going off-screen
                        // We must wait for the DOM to update with the new content
                        requestAnimationFrame(() => {
                            if (activePopup && currentCard === cardName) {
                                movePopup(event);
                            }
                        });
                    }
                }
            }).catch(e => { console.warn(e); cardInfo._fetching = false; });
        }

        let stats = '';
        let atkDef = [];
        // Check for valid ATK/DEF values (not null/undefined) - handles both API and Supabase data
        if (cardInfo.atk !== undefined && cardInfo.atk !== null) atkDef.push(`ATK/${cardInfo.atk}`);
        if (cardInfo.def !== undefined && cardInfo.def !== null && !cardInfo.linkval) atkDef.push(`DEF/${cardInfo.def}`);
        if (cardInfo.linkval) atkDef.push(`LINK-${cardInfo.linkval}`);
        if (atkDef.length > 0) {
            stats = `<p class="mt-2 text-yellow-400 font-bold">${atkDef.join(' ')}</p>`;
        }

        let cardType;
        const race = cardInfo.race || 'Unknown';

        if (cardInfo.type.includes('Monster')) {
            cardType = `[${race} / ${cardInfo.type.replace(' Monster', '')}]`;
        } else if (cardInfo.type.includes('Spell')) {
            const icon = getCardTypeIcon(race, cardInfo.type);
            cardType = `${icon} [${race} Spell]`;
        } else if (cardInfo.type.includes('Trap')) {
            const icon = getCardTypeIcon(race, cardInfo.type);
            cardType = `${icon} [${race} Trap]`;
        } else {
            cardType = `[${race} Card]`;
        }

        // Use card ID as passcode for tag lookup
        const cardPasscode = cardInfo.id;

        // Release Date extraction
        let releaseDateHtml = '';
        const misc = cardInfo.misc_info ? cardInfo.misc_info[0] : null;
        if (misc && (misc.tcg_date || misc.ocg_date)) {
            releaseDateHtml = `Release: ${misc.tcg_date || misc.ocg_date}`;
        }

        // Prepare Price HTML separately to strip container divs if needed
        const priceHtml = formatPriceSection(cardInfo).replace('<div class="mt-3 pt-2 border-t border-gray-700">', '').replace('<div class="text-xs text-gray-400 mb-1">💰 Prices</div>', '');

        popup.innerHTML = `
            <div class="flex flex-col h-full" style="background-color: #0f172a;">
                <div class="flex-shrink-0" style="background-color: #0f172a;">
                    <div class="flex justify-between items-start">
                        <h3 class="text-blue-400 font-bold text-lg">${cardInfo.name}</h3>
                        <span id="popup-release-date" class="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 whitespace-nowrap ${releaseDateHtml ? '' : 'hidden'}">
                            ${releaseDateHtml}
                        </span>
                    </div>
                    
                    <!-- Tab Navigation -->
                    <div class="flex border-b border-slate-600 mt-1" style="background-color: #1e293b;">
                        <button onclick="window.switchPopupTab('details')" data-tab="details" class="tab-btn flex-1 py-1.5 text-xs font-medium text-blue-400 border-b-2 border-blue-500 transition-colors" style="background-color: #334155;">Details</button>
                        <button onclick="window.switchPopupTab('sets')" data-tab="sets" class="tab-btn flex-1 py-1.5 text-xs font-medium text-slate-200 border-b-2 border-transparent hover:text-white transition-colors">Sets</button>
                        <button onclick="window.switchPopupTab('prices')" data-tab="prices" class="tab-btn flex-1 py-1.5 text-xs font-medium text-slate-200 border-b-2 border-transparent hover:text-white transition-colors">Prices</button>
                    </div>
                    
                    <!-- Card Type (below tabs) -->
                    <p class="text-xs text-gray-300 mt-2">${cardType}</p>
                </div>

                <div class="flex-1 mt-2 pr-1" style="background-color: #0f172a;">
                    <!-- Details Tab -->
                    <div id="tab-details" class="tab-content" style="background-color: #0f172a;">
                        <div id="popup-desc-area">
                            ${cardInfo.desc ? formatCardDescription(cardInfo.desc, cardInfo.type, cardInfo.name) : '<p class="text-gray-400 italic text-xs p-2">Loading details...</p>'}
                        </div>
                        ${stats}
                        <!-- Tags Section (below details) -->
                        <div id="card-tags-container" class="mt-3 pt-2 border-t border-slate-700">
                            <p class="text-gray-500 italic text-xs">Loading tags...</p>
                        </div>
                    </div>

                    <!-- Prices Tab -->
                    <div id="tab-prices" class="tab-content hidden" style="background-color: #0f172a;">
                        <div id="popup-price-area" class="pt-2">
                            ${priceHtml || '<p class="text-gray-500 text-xs italic">No price data available.</p>'}
                        </div>
                    </div>

                    <!-- Sets Tab -->
                    <div id="tab-sets" class="tab-content hidden" style="background-color: #0f172a;">
                        <div id="popup-sets-area" style="padding-top: 4px;">
                            ${formatSetsSection(cardInfo)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        popup.style.display = 'block';
        popup.style.zIndex = '10000';
        // Ensure popup width is enforced
        if (window.innerWidth >= 768) {
            popup.style.maxWidth = '420px';
            popup.style.width = '420px';
        }
        movePopup(event);
        popup.style.pointerEvents = 'auto'; // Enable pointer events for clicks inside
        setTimeout(() => { popup.style.opacity = 1; }, 10);
        activePopup = popup;
        lastShown = Date.now();
        currentCard = cardName;

        // Fetch and display tags asynchronously
        if (cardPasscode && getSupabaseClient()) {
            fetchCardTags(cardPasscode).then(async tags => {
                const tagsContainer = popup.querySelector('#card-tags-container');
                if (tagsContainer) {
                    if (tags.length > 0) {
                        // Check for specific discard actions if Hand Activation is present
                        let hasDiscardAction = false;
                        if (tags.some(t => t.tag_name === 'Hand Activation')) {
                            // Using the internal fetchActionsForTag function
                            const actions = await fetchActionsForTag(cardPasscode, 'Hand Activation');
                            hasDiscardAction = actions.some(a =>
                                /discard this card|send this card from your hand to the gy/i.test(a)
                            );
                        }

                        // Use formatTagsSection but strip the outer container/header as we are in a tab
                        let content = formatTagsSection(tags, cardInfo.type || '', cardPasscode, cardInfo.name || '', hasDiscardAction);
                        // Simple clean up to remove the "Gameplay Tags" header from the helper output
                        content = content.replace(/<div class="text-xs text-gray-400 mb-2">🏷️ Gameplay Tags<\/div>/, '');
                        content = content.replace(/<div class="mt-3 pt-2 border-t border-gray-700">/, '<div>'); // Remove top border
                        tagsContainer.innerHTML = content;
                    } else {
                        tagsContainer.innerHTML = '<p class="text-gray-500 text-xs italic">No tags found for this card.</p>';
                    }
                }
            });
        }
    }

    function hidePopup() {
        if (Date.now() - lastShown < 100) return;
        if (activePopup) {
            activePopup.style.opacity = 0;
            activePopup.style.pointerEvents = 'none'; // Disable pointer events

            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                // Only hide if no active popup is set (meaning we haven't re-opened)
                if (!activePopup && popup) popup.style.display = 'none';
                hideTimeout = null;
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
            popup.style.maxHeight = 'calc(100vh - 40px)';
            popup.style.overflowY = 'auto';
        } else {
            // Desktop: position near cursor
            popup.style.transform = 'none';

            const cushion = 20;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Measure dimensions immediately (forces a reflow, which is consistent)
            const popupWidth = popup.offsetWidth || 400;
            const popupHeight = popup.offsetHeight || 500;

            // Calculate available space in each direction from cursor
            const spaceRight = viewportWidth - event.clientX - cushion;
            const spaceLeft = event.clientX - cushion;
            const spaceBelow = viewportHeight - event.clientY - cushion;
            const spaceAbove = event.clientY - cushion;

            let x, y;

            // Horizontal positioning: prefer right, fallback to left, then clamp
            if (spaceRight >= popupWidth) {
                x = event.clientX + cushion;
            } else if (spaceLeft >= popupWidth) {
                x = event.clientX - popupWidth - cushion;
            } else {
                // Not enough space on either side, center horizontally and clamp
                x = Math.max(cushion, Math.min(event.clientX - popupWidth / 2, viewportWidth - popupWidth - cushion));
            }

            // Vertical positioning: prefer below, fallback to above, then clamp
            if (spaceBelow >= popupHeight) {
                y = event.clientY + cushion;
            } else if (spaceAbove >= popupHeight) {
                y = event.clientY - popupHeight - cushion;
            } else {
                // Not enough space above or below, position to fit in viewport
                // Try to center it vertically if it fits, otherwise pin to top/bottom with scrolling
                if (viewportHeight > popupHeight) {
                    y = (viewportHeight - popupHeight) / 2;
                } else {
                    y = cushion;
                }
            }

            // Final bounds check to ensure popup is always fully visible
            if (x < cushion) x = cushion;
            if (x + popupWidth > viewportWidth - cushion) x = viewportWidth - popupWidth - cushion;

            // Vertical constraints
            if (y < cushion) y = cushion;
            if (y + popupHeight > viewportHeight - cushion) {
                // If it pushes off bottom, move it up
                y = Math.max(cushion, viewportHeight - popupHeight - cushion);
            }

            // Handle case where popup is taller than viewport
            if (popupHeight > viewportHeight - (cushion * 2)) {
                y = cushion;
                popup.style.maxHeight = `${viewportHeight - cushion * 2}px`;
                popup.style.overflowY = 'auto';
            } else {
                popup.style.maxHeight = '';
                popup.style.overflowY = '';
            }

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

                // Find the direct child of parentSection that contains (or is) the container
                let directChild = container;
                while (directChild.parentElement && directChild.parentElement !== parentSection) {
                    directChild = directChild.parentElement;
                }

                if (directChild.parentElement === parentSection) {
                    parentSection.insertBefore(header, directChild);
                } else {
                    // Fallback if structure is unexpected
                    parentSection.insertBefore(header, parentSection.firstChild);
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
     * Render compact deck resource buttons (for placement under header)
     * Creates sleek, inline pill-style buttons for YGOProDeck and Discord links
     * @param {string} containerId - ID of container element
     * @param {string} archetypeName - Name of the archetype
     * @param {Object} options - Configuration options
     * @param {boolean} [options.showAllDecks=true] - Whether to show the "All Decks" button
     */
    async function renderDeckResourcesCompact(containerId, archetypeName, options = {}) {
        console.log(`[CardLoader] renderDeckResourcesCompact called for: ${archetypeName}`);
        const container = document.getElementById(containerId);

        if (!container) {
            console.error(`[CardLoader] Deck Resources container with ID "${containerId}" not found`);
            return;
        }

        const showAllDecks = options.showAllDecks !== false;

        // Check if archetype exists by fetching cards
        const archetypeCards = await fetchArchetypeCards(archetypeName);
        const archetypeExists = archetypeCards.length > 0;

        // Fetch Discord links
        const discordLinks = await fetchDiscordLinks();
        const discordUrl = discordLinks[archetypeName.toLowerCase()] || null;

        let competitiveUrl, casualUrl;

        if (archetypeExists) {
            const encodedArchetypeName = encodeURIComponent(archetypeName);
            competitiveUrl = `https://ygoprodeck.com/deck-search/?tournament=tier-2&_sft_post_tag=${encodedArchetypeName}&offset=0`;
            casualUrl = `https://ygoprodeck.com/deck-search/?_sft_post_tag=${encodedArchetypeName}&offset=0`;
        } else {
            const loadedCardNames = Object.keys(cardDataCache);
            let encodedCardName;

            if (loadedCardNames.length > 0) {
                encodedCardName = encodeURIComponent(loadedCardNames[0]);
            } else {
                encodedCardName = encodeURIComponent(archetypeName);
            }

            competitiveUrl = `https://ygoprodeck.com/deck-search/?tournament=tier-2&cardcode=${encodedCardName}%7C&offset=0`;
            casualUrl = `https://ygoprodeck.com/deck-search/?cardcode=${encodedCardName}%7C&offset=0`;
        }

        // Generate compact button HTML
        const html = `
            <div class="deck-resources-compact flex flex-wrap justify-center gap-2 md:gap-3">
                <!-- Competitive Decks Button -->
                <a href="${competitiveUrl}" target="_blank" rel="noopener noreferrer" 
                   class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white 
                          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                          shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                   title="View tournament and tiered deck lists for ${archetypeName}">
                    <i class="fas fa-trophy text-xs"></i>
                    <span>Tournament Decks</span>
                </a>
                
                ${showAllDecks ? `
                <!-- All Decks Button -->
                <a href="${casualUrl}" target="_blank" rel="noopener noreferrer" 
                   class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white 
                          bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700
                          shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                   title="View all community-submitted deck lists for ${archetypeName}">
                    <i class="fas fa-users text-xs"></i>
                    <span>Community Decks</span>
                </a>
                ` : ''}
                
                ${discordUrl ? `
                <!-- Discord Button -->
                <a href="${discordUrl}" target="_blank" rel="noopener noreferrer" 
                   class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white 
                          bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
                          shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                   title="Join the ${archetypeName} Discord community">
                    <i class="fab fa-discord text-xs"></i>
                    <span>Discord</span>
                </a>
                ` : ''}
            </div>
        `;


        container.innerHTML = html;
    }

    // ========================================
    // ARCHETYPE CARDS BROWSER (Supabase)
    // ========================================

    let archetypeCardsModal = null;

    /**
     * Fetch all cards for an archetype from Supabase
     * @param {string} archetypeName - Name of the archetype
     * @returns {Promise<Array>} Array of card objects with type info
     */
    async function fetchArchetypeCardsFromSupabase(archetypeName) {
        const client = getSupabaseClient();
        if (!client) return null;

        try {
            const { data, error } = await client.rpc('get_archetype_cards', {
                archetype_name: archetypeName
            });

            if (error) {
                console.error('[CardLoader] Error fetching archetype cards:', error);
                return null;
            }

            return data || [];
        } catch (error) {
            console.error('[CardLoader] Failed to fetch archetype cards:', error);
            return null;
        }
    }

    /**
     * Sort cards into categories: Main Deck Monsters, Spells, Traps, Extra Deck
     * @param {Array} cards - Array of card objects
     * @returns {Object} Sorted cards by category
     */
    function sortCardsByType(cards, autoSort = true) {
        const extraDeckTypes = ['Fusion', 'Synchro', 'Xyz', 'Link'];

        const sorted = {
            monsters: [],
            spells: [],
            traps: [],
            extraDeck: []
        };

        cards.forEach(card => {
            const cardType = (card.cardtype || card.card_type || '').toLowerCase();

            // Check if it's an Extra Deck monster
            const isExtraDeck = extraDeckTypes.some(type => cardType.includes(type.toLowerCase()));

            if (isExtraDeck) {
                sorted.extraDeck.push(card);
            } else if (cardType.includes('monster')) {
                sorted.monsters.push(card);
            } else if (cardType.includes('spell')) {
                sorted.spells.push(card);
            } else if (cardType.includes('trap')) {
                sorted.traps.push(card);
            } else {
                // Default to monsters if type is unclear
                sorted.monsters.push(card);
            }
        });

        // Sort each category alphabetically by name if requested
        if (autoSort) {
            Object.keys(sorted).forEach(key => {
                sorted[key].sort((a, b) => (a.cardname || a.card_name || '').localeCompare(b.cardname || b.card_name || ''));
            });
        }

        return sorted;
    }

    /**
     * Create and show the archetype cards modal
     * @param {string} archetypeName - Name of the archetype
     * @param {Object} sortedCards - Cards sorted by type
     */
    function showArchetypeCardsModal(archetypeName, sortedCards) {
        // Remove existing modal if present
        if (archetypeCardsModal) {
            archetypeCardsModal.remove();
        }

        const totalCards = sortedCards.monsters.length + sortedCards.spells.length +
            sortedCards.traps.length + sortedCards.extraDeck.length;

        // Create modal HTML
        const modalHtml = `
            <div id="archetype-cards-modal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" style="background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);">
                <div class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                        <div>
                            <h2 class="text-xl font-bold text-white">${archetypeName} Cards</h2>
                            <p class="text-sm text-gray-400">${totalCards} cards in archetype</p>
                        </div>
                        <button id="close-archetype-modal" class="text-gray-400 hover:text-white text-2xl font-bold px-3 py-1 rounded hover:bg-gray-700 transition-colors">
                            ×
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-4 space-y-6">
                        ${renderCardSection('Main Deck Monsters', sortedCards.monsters, 'bg-yellow-600', '👹')}
                        ${renderCardSection('Spell Cards', sortedCards.spells, 'bg-green-600', '✨')}
                        ${renderCardSection('Trap Cards', sortedCards.traps, 'bg-purple-600', '🪤')}
                        ${renderCardSection('Extra Deck', sortedCards.extraDeck, 'bg-blue-600', '⭐')}
                    </div>
                </div>
            </div>
        `;

        // Create and append modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        archetypeCardsModal = modalContainer.firstElementChild;
        document.body.appendChild(archetypeCardsModal);

        // Close handlers
        document.getElementById('close-archetype-modal').addEventListener('click', closeArchetypeCardsModal);
        archetypeCardsModal.addEventListener('click', (e) => {
            if (e.target === archetypeCardsModal) closeArchetypeCardsModal();
        });

        // Escape key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeArchetypeCardsModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Render a section of cards
     */
    function renderCardSection(title, cards, bgColor, icon) {
        if (cards.length === 0) return '';

        const cardItems = cards.map(card => {
            const name = card.cardname || card.card_name || 'Unknown';
            const passcode = card.passcode || card.id || '';
            const imageUrl = passcode ? `${CONFIG.IMAGE_BASE_URL}/${passcode}.jpg` : '';

            // Extract date
            let dateDisplay = '';
            if (card.misc_info && card.misc_info[0]) {
                dateDisplay = card.misc_info[0].tcg_date || card.misc_info[0].ocg_date || '';
            } else if (card.tcg_date || card.ocg_date) {
                dateDisplay = card.tcg_date || card.ocg_date || '';
            }

            return `
                <div class="flex flex-col items-center group cursor-pointer card-item" 
                     data-card-name="${name}" data-passcode="${passcode}">
                    <div class="w-20 h-28 rounded overflow-hidden border border-gray-600 group-hover:border-blue-400 transition-all shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/20 relative">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${name}" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'h-full flex items-center justify-center bg-gray-800 text-xs text-gray-400 p-1 text-center\\'>${name}</div>'">`
                    : `<div class="h-full flex items-center justify-center bg-gray-800 text-xs text-gray-400 p-1 text-center">${name}</div>`}
                        ${dateDisplay ? `<div class="absolute top-0 right-0 bg-black/60 backdrop-blur-[2px] text-slate-200 text-[8px] px-1 py-0.5 rounded-bl font-mono z-10 pointer-events-none leading-none">${dateDisplay}</div>` : ''}
                    </div>
                    <span class="text-xs text-gray-300 mt-1 text-center line-clamp-2 max-w-20 group-hover:text-white transition-colors">${name}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="space-y-3">
                <div class="flex items-center gap-2">
                    <span class="${bgColor} text-white px-3 py-1 rounded-full text-sm font-semibold">${icon} ${title}</span>
                    <span class="text-gray-500 text-sm">(${cards.length})</span>
                </div>
                <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    ${cardItems}
                </div>
            </div>
        `;
    }

    /**
     * Close the archetype cards modal
     */
    function closeArchetypeCardsModal() {
        if (archetypeCardsModal) {
            archetypeCardsModal.remove();
            archetypeCardsModal = null;
            document.body.style.overflow = '';
        }
    }


    // ============================================================================
    // Card Browser Page Logic has been moved to card-browser.js
    // The initCardBrowserPage function is now in the CardBrowser module.
    // ============================================================================

    /**
     * Render archetype cards browser button (Link to standalone page)
     * @param {string} containerId - ID of container element
     * @param {string} archetypeName - Name of the archetype
     * @param {Object} options - Configuration options
     */
    async function renderArchetypeCardsBrowser(containerId, archetypeName, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[CardLoader] Container with ID "${containerId}" not found`);
            return;
        }

        // Check if Supabase is configured
        if (!getSupabaseClient()) {
            container.innerHTML = `
                <div class="text-center text-gray-500 p-4">
                    <i class="fas fa-database mr-2"></i>Database not configured
                </div>
                `;
            return;
        }

        // Create button
        const buttonColor = options.buttonColor || 'from-indigo-500 to-purple-600';
        const buttonHoverColor = options.buttonHoverColor || 'from-indigo-600 to-purple-700';
        const isCompact = options.compact === true;

        // Button classes
        const buttonClasses = isCompact
            ? `relative group px-6 py-2.5 rounded-full shadow-lg text-sm font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] bg-gradient-to-r ${buttonColor} hover:${buttonHoverColor} flex items-center justify-center gap-2 border border-white/20 no-underline overflow-hidden`
            : `relative group w-full p-4 rounded-xl shadow-lg text-center font-bold text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] bg-gradient-to-r ${buttonColor} hover:${buttonHoverColor} flex items-center justify-center gap-3 no-underline overflow-hidden`;

        const iconSize = isCompact ? 'text-base' : 'text-xl';
        const targetUrl = `../pages/Card-Browser.html?archetype=${encodeURIComponent(archetypeName)}`;

        container.innerHTML = `
            <a href="${targetUrl}" class="${buttonClasses}" target="_blank">
                <!-- Inner Glow Effect -->
                <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                <!-- Border Pulse for extra attention (only if it matches the vibe) -->
                ${isCompact ? '<div class="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>' : ''}
                
                <i class="fas fa-layer-group ${iconSize} relative z-10 group-hover:rotate-6 transition-transform"></i>
                <span class="relative z-10 tracking-wide">${options.buttonText || `Browse ${archetypeName} Cards`}</span>
                ${isCompact ? '' : '<i class="fas fa-external-link-alt text-sm opacity-70 relative z-10"></i>'}
            </a>
        `;
    }

    /**
     * Inject AI-generated content warnings into combo sections
     * Automatically detects combo sections and adds warning banners
     */
    function injectComboWarnings() {
        // Skip if combos are verified (meta tag opt-out)
        const verifiedMeta = document.querySelector('meta[name="combos-verified"]');
        if (verifiedMeta && verifiedMeta.content === 'true') {
            console.log('[CardLoader] Combos marked as verified, skipping AI warning injection');
            return;
        }

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

        // Detection: Only match headings where the word "combo" appears as a significant part
        // This avoids false positives like table cells with "Starter" or sections mentioning "Endboard"
        const isComboHeading = (text) => {
            // Must contain "combo" as a word (not just "combination" etc)
            // Patterns like "Combo Lines", "One-Card Combo", "Basic Combos" should match
            return /\bcombo(?:s|es)?\b/i.test(text);
        };

        let warningInjected = false;

        // Priority 1: Handle combo-selector-container first (dynamic combo system UI)
        const selectorContainers = document.querySelectorAll('#combo-selector-container, [id*="combo-selector"]');
        for (const container of selectorContainers) {
            if (warningInjected) break;
            const parent = container.parentElement;
            if (parent && !parent.querySelector('.ai-combo-warning')) {
                const warning = createWarningBanner();
                container.insertAdjacentElement('beforebegin', warning);
                warningInjected = true;
            }
        }

        // Priority 2: Handle data-combo-system attribute containers
        if (!warningInjected) {
            const comboContainers = document.querySelectorAll('[data-combo-system]');
            for (const container of comboContainers) {
                if (warningInjected) break;
                if (!container.querySelector('.ai-combo-warning')) {
                    const warning = createWarningBanner();
                    container.insertAdjacentElement('afterbegin', warning);
                    warningInjected = true;
                }
            }
        }

        // Priority 3: Find combo section headings (h2, h3) only if no dynamic combo system found
        // Only match headings that explicitly mention "combo" in the title
        if (!warningInjected) {
            const headings = document.querySelectorAll('h2, h3');
            for (const heading of headings) {
                if (warningInjected) break;
                const text = heading.textContent || '';

                if (isComboHeading(text)) {
                    const section = heading.closest('section') || heading.closest('.card') || heading.parentElement;
                    if (section) {
                        warningInjected = true;
                        const warning = createWarningBanner();
                        heading.insertAdjacentElement('afterend', warning);
                    }
                }
            }
        }

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
        loadCardById, // Added this
        fetchCardDataById, // Added this
        getCardImageUrl,
        preloadCards,
        getCachedCard,
        clearCache,
        configure,
        showPopup,
        showPopupByName,
        renderDeckSearchSection,
        renderDeckResourcesCompact,
        cardDataCache,
        // Banlist methods
        fetchBanlistData,
        checkBanlistStatus,
        renderBanlistSection,
        fetchArchetypeCards: fetchArchetypeCardsFromSupabase,
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
        // Gameplay tags (Supabase integration)
        getTagsForCard: fetchCardTags,
        getActionsForTag: fetchActionsForTag,
        isSupabaseConfigured: () => !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY),
        // Archetype cards browser button (still in CardLoader)
        renderArchetypeCardsBrowser,
        // Card Browser page init - delegate to CardBrowser module if available
        initCardBrowserPage: (archetypeName) => {
            if (window.CardBrowser && window.CardBrowser.initCardBrowserPage) {
                return window.CardBrowser.initCardBrowserPage(archetypeName);
            }
            console.error('[CardLoader] CardBrowser module not loaded. Include card-browser.js before calling initCardBrowserPage.');
        },
        // Expose internal utilities for CardBrowser module
        _getUtils: () => ({
            TAG_CATEGORY_COLORS,
            KNOWN_TAG_CATEGORIES,
            CATEGORY_PRIORITY,
            CONFIG
        }),
        showLargeImageByName: showLargeImageModal,
        hideLargeImageModal
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