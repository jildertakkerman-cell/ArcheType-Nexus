/**
 * Fetches vote rows for a batch of static combo ids from `staticcombovotes`
 * in one query, reducing them into per-combo up/down/score/userVote. Shared
 * by ComboSelector (list badges + sort) and ComboGuide (vote bar) so a page
 * only pays for one Supabase round trip instead of two.
 */
async function fetchStaticComboVotes(comboIds) {
    const client = window.Auth?._getClient?.();
    if (!client || !comboIds.length) return { enabled: false, byId: {} };

    const [session, { data: votes }] = await Promise.all([
        window.Auth.getSession(),
        client.from('staticcombovotes').select('comboid, userid, value').in('comboid', comboIds)
    ]);

    const byId = {};
    comboIds.forEach(id => {
        const rows = (votes || []).filter(v => v.comboid === id);
        const up = rows.filter(v => v.value === 1).length;
        const down = rows.filter(v => v.value === -1).length;
        byId[id] = {
            up, down, score: up - down,
            userVote: session ? (rows.find(v => v.userid === session.user.id)?.value ?? 0) : 0
        };
    });
    return { enabled: !!session, byId };
}

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
                const error = new Error(`Failed to load combos for ${archetypeName}: ${response.statusText}`);
                error.notFound = response.status === 404;
                throw error;
            }
            return await response.json();
        } catch (error) {
            // A missing combo file just means no interactive combos have been authored yet for
            // this archetype - that's an expected, quiet case, not a real error to log loudly.
            if (!error.notFound) {
                console.error(`Error loading combo data for ${archetypeName}:`, error);
            }
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

    /**
     * Render the complete combo system with a single function call
     * This is the main entry point for loading combos onto a page
     * @param {string} containerId - ID of the container element (will create sub-containers inside)
     * @param {string} archetypeName - Name of the archetype (e.g., 'Blue-Eyes', 'Yummy')
     * @param {Object} options - Optional configuration
     * @param {string} options.selectorContainerId - Custom ID for selector container (default: 'combo-selector-container')
     * @param {string} options.guideContainerId - Custom ID for guide container (default: 'combo-guide-container')
     * @param {Object} options.selectorOptions - Options to pass to ComboSelector.render
     * @returns {Promise<Object>} Object containing loaded data and initialized simulators
     */
    static async renderComboSystem(containerId, archetypeName, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[ComboLoader] Container not found: ${containerId}`);
            return null;
        }

        const {
            selectorContainerId = 'combo-selector-container',
            guideContainerId = 'combo-guide-container',
            selectorOptions = {}
        } = options;

        // 1. Setup container structure
        container.innerHTML = `
            <div id="${selectorContainerId}"></div>
            <div id="${guideContainerId}"></div>
        `;

        try {
            // 2. Load combo data
            const comboData = await this.loadCombos(archetypeName);

            if (!comboData || !comboData.combos) {
                console.error(`[ComboLoader] No combo data found for ${archetypeName}`);
                return null;
            }

            // 3. Define the showCombo callback for switching between combos
            const showCombo = (comboKey) => {
                const combos = comboData.combos || {};
                Object.keys(combos).forEach(key => {
                    const normalizedKey = key.replace('combo', '');
                    const contentDiv = document.getElementById(`combo-${normalizedKey}-content`);
                    if (contentDiv) {
                        contentDiv.classList.add('hidden');
                    }
                });

                const selectedContent = document.getElementById(`combo-${comboKey}-content`);
                if (selectedContent) {
                    selectedContent.classList.remove('hidden');
                }
            };

            // 3.5. Kick off a single shared vote fetch for every combo on this page;
            // both the selector (badges + sort) and guide (vote bar) consume it.
            const archetypeSlug = archetypeName.toLowerCase();
            const comboIds = Object.keys(comboData.combos).map(key => `${archetypeSlug}-${key}`);
            const votesPromise = fetchStaticComboVotes(comboIds);

            // 4. Render combo selector
            ComboSelector.render(selectorContainerId, comboData, showCombo, { ...selectorOptions, archetypeSlug, votesPromise });

            // 5. Render combo guide (includes simulators)
            ComboGuide.render(guideContainerId, comboData, archetypeSlug, votesPromise);

            // 6. Initialize all DuelSimulator instances
            const simulators = {};
            Object.keys(comboData.combos).forEach(key => {
                const normalizedKey = key.replace('combo', '');
                const simElementId = `duel-simulator-${key}`;
                simulators[key] = new DuelSimulator(simElementId, { [normalizedKey]: comboData.combos[key] });
            });

            console.log(`[ComboLoader] Successfully loaded combo system for ${archetypeName}`);

            // 7. Inject AI-generated content warnings for combo sections
            if (window.CardLoader && typeof window.CardLoader.injectComboWarnings === 'function') {
                setTimeout(() => window.CardLoader.injectComboWarnings(), 100);
            }

            return {
                data: comboData,
                simulators: simulators,
                showCombo: showCombo
            };

        } catch (error) {
            if (error.notFound) {
                // No interactive combo data authored yet for this archetype - remove the
                // section quietly instead of showing a scary error box for a normal state.
                console.info(`[ComboLoader] No combo data for ${archetypeName}; hiding interactive combo section.`);
                const section = container.closest('section') || container;
                section.remove();
            } else {
                console.error(`[ComboLoader] Failed to render combo system for ${archetypeName}:`, error);
                container.innerHTML = `
                    <div class="p-6 text-center text-red-400">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p>Failed to load combo system for ${archetypeName}</p>
                        <p class="text-sm mt-2 opacity-75">${error.message}</p>
                    </div>
                `;
            }
            return null;
        }
    }
}

/**
 * ComboSelector - Modular Combo Dropdown Generator
 * Automatically creates a themed combo selector from combo data
 */
class ComboSelector {
    /**
     * Convert a '#rrggbb'/'#rgb' hex color or an 'rgb(...)'/'rgba(...)' string
     * into an 'rgba(r, g, b, alpha)' string. Theme accent colors can come from
     * either format depending on how inferTheme() resolved them.
     */
    static colorWithAlpha(color, alpha) {
        const fallback = `rgba(96, 165, 250, ${alpha})`;
        if (!color) return fallback;
        const trimmed = color.trim();
        if (trimmed.startsWith('#')) {
            let hex = trimmed.slice(1);
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            if (hex.length !== 6) return fallback;
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        const parts = trimmed.match(/\d+(\.\d+)?/g);
        if (parts && parts.length >= 3) {
            return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
        }
        return fallback;
    }

    /**
     * Inject the (page-agnostic) stylesheet for the custom dropdown once.
     * Per-instance colors are supplied via CSS custom properties on the
     * `.combo-selector-wrapper` element itself, so this is safe to share.
     */
    static injectStyles() {
        if (document.getElementById('combo-selector-dynamic-styles')) return;
        const style = document.createElement('style');
        style.id = 'combo-selector-dynamic-styles';
        style.textContent = `
            .combo-selector-wrapper { position: relative; }
            .combo-selector-trigger {
                appearance: none;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.85rem 1.25rem;
                background-color: var(--csel-card-bg);
                border: 2px solid var(--csel-accent);
                border-radius: 0.5rem;
                color: var(--csel-text);
                cursor: pointer;
                transition: background-color 0.25s ease, box-shadow 0.25s ease;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                text-align: left;
                font-family: inherit;
            }
            .combo-selector-trigger:hover {
                background-color: var(--csel-bg);
                box-shadow: 0 0 15px var(--csel-accent-40);
            }
            .combo-selector-trigger:focus-visible {
                outline: none;
                box-shadow: 0 0 0 3px var(--csel-accent-40);
            }
            .combo-selector-trigger-text { display: flex; flex-direction: column; min-width: 0; }
            .combo-selector-trigger-title {
                font-weight: 700;
                font-size: 1.1rem;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .combo-selector-trigger-meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.4rem;
                font-size: 0.75rem;
                font-weight: 500;
                opacity: 0.75;
                margin-top: 0.2rem;
            }
            .combo-selector-meta-credits,
            .combo-selector-meta-date,
            .combo-selector-option-credits {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .combo-selector-meta-sep { opacity: 0.6; }
            .combo-selector-chevron {
                flex-shrink: 0;
                color: var(--csel-accent);
                transition: transform 0.25s ease;
            }
            .combo-selector-wrapper[data-open="true"] .combo-selector-chevron { transform: rotate(180deg); }
            .combo-selector-panel {
                position: absolute;
                left: 0;
                right: 0;
                top: calc(100% + 0.5rem);
                z-index: 60;
                max-height: 24rem;
                display: none;
                flex-direction: column;
                overflow: hidden;
                background-color: var(--csel-card-bg);
                border: 2px solid var(--csel-accent);
                border-radius: 0.5rem;
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
            }
            .combo-selector-wrapper[data-open="true"] .combo-selector-panel { display: flex; }
            .combo-selector-search-row {
                flex-shrink: 0;
                padding: 0.6rem 0.65rem;
                border-bottom: 1px solid var(--csel-accent-30);
            }
            .combo-selector-search-input {
                width: 100%;
                appearance: none;
                background-color: var(--csel-bg);
                border: 1px solid var(--csel-accent-40);
                border-radius: 0.375rem;
                padding: 0.5rem 0.7rem;
                color: var(--csel-text);
                font-size: 0.85rem;
                font-family: inherit;
            }
            .combo-selector-search-input:focus {
                outline: none;
                border-color: var(--csel-accent);
                box-shadow: 0 0 0 3px var(--csel-accent-40);
            }
            .combo-selector-no-results {
                padding: 0.85rem 0.75rem;
                font-size: 0.85rem;
                opacity: 0.7;
                text-align: center;
                display: none;
            }
            .combo-selector-menu {
                flex: 1 1 auto;
                min-height: 0;
                overflow-y: auto;
                margin: 0;
                padding: 0.4rem;
                list-style: none;
            }
            .combo-selector-panel::after {
                content: '';
                position: absolute;
                left: 2px;
                right: 2px;
                bottom: 2px;
                height: 2rem;
                background: linear-gradient(to bottom, transparent, var(--csel-card-bg));
                border-radius: 0 0 0.5rem 0.5rem;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            .combo-selector-wrapper[data-has-more="true"] .combo-selector-panel::after { opacity: 1; }
            .combo-selector-option-top {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                font-size: 0.68rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.03em;
                color: #f59e0b;
            }
            .combo-selector-option-votes {
                display: inline-flex;
                align-items: center;
                gap: 0.55rem;
                font-size: 0.72rem;
                font-weight: 700;
                flex-shrink: 0;
            }
            .combo-selector-option-votes .csel-vote-up { color: #4ade80; }
            .combo-selector-option-votes .csel-vote-down { color: #f87171; }
            .combo-selector-option {
                display: flex;
                flex-direction: column;
                gap: 0.3rem;
                padding: 0.65rem 0.75rem;
                border-radius: 0.375rem;
                cursor: pointer;
                color: var(--csel-text);
                transition: background-color 0.15s ease;
            }
            .combo-selector-option:hover,
            .combo-selector-option.is-active { background-color: var(--csel-accent-20); }
            .combo-selector-option[aria-selected="true"] { background-color: var(--csel-accent-30); }
            .combo-selector-option-title { font-weight: 600; font-size: 0.95rem; }
            .combo-selector-option-meta {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.75rem;
            }
            .combo-selector-option-credits {
                min-width: 0;
                opacity: 0.75;
                font-weight: 500;
            }
            .combo-selector-option-date {
                flex-shrink: 0;
                margin-left: auto;
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                font-size: 0.7rem;
                font-weight: 600;
                white-space: nowrap;
                padding: 0.2rem 0.55rem;
                border-radius: 999px;
                background-color: var(--csel-accent-15);
                color: var(--csel-accent);
            }
            .combo-selector-option-date i { opacity: 0.8; }
        `;
        document.head.appendChild(style);
    }

    /**
     * Bind a single document-level click/Escape listener (shared across every
     * instance) that closes any open combo-selector menu when the user clicks
     * outside it or presses Escape.
     */
    static ensureGlobalListeners() {
        if (ComboSelector._globalListenersBound) return;
        ComboSelector._globalListenersBound = true;

        const closeWrapper = (wrapper) => {
            wrapper.setAttribute('data-open', 'false');
            const trigger = wrapper.querySelector('.combo-selector-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        };

        document.addEventListener('click', (e) => {
            document.querySelectorAll('.combo-selector-wrapper[data-open="true"]').forEach(wrapper => {
                if (!wrapper.contains(e.target)) closeWrapper(wrapper);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            document.querySelectorAll('.combo-selector-wrapper[data-open="true"]').forEach(closeWrapper);
        });
    }

    static render(containerId, comboData, onChangeCallback, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            labelText = 'Select a Combo',
            labelIcon = 'fas fa-layer-group',
            selectorId = 'combo-selector',
            defaultCombo = '1',
            votesPromise = null,
            searchThreshold = 8
        } = options;

        const combos = comboData.combos || {};
        const comboNumbers = Object.keys(combos).map(key => key.replace('combo', ''));
        const initialCombo = combos[`combo${defaultCombo}`] ? defaultCombo : (comboNumbers[0] || defaultCombo);
        const showSearch = comboNumbers.length > searchThreshold;

        // Infer theme to get colors
        const theme = ComboSelector.inferTheme();
        console.log('[ComboSelector] Using theme:', theme);

        ComboSelector.injectStyles();
        ComboSelector.ensureGlobalListeners();

        const dateIconHtml = '<i class="fas fa-calendar-alt"></i>';
        const creditsIconHtml = '<i class="fas fa-user-circle"></i>';
        const initialComboObj = combos[`combo${initialCombo}`] || {};
        const initialLabel = initialComboObj.title || `Combo #${initialCombo}`;

        // Populated once (if ever) votesPromise resolves; keyed by combo number.
        const voteMap = {};
        const voteBadgeHtml = (num) => {
            const v = voteMap[num];
            if (!v || (v.up + v.down) === 0) return '';
            return `<span class="combo-selector-option-votes">
                <span class="csel-vote-up"><i class="fas fa-thumbs-up"></i> ${v.up}</span>
                <span class="csel-vote-down"><i class="fas fa-thumbs-down"></i> ${v.down}</span>
            </span>`;
        };

        // Build the small "submitted by / on" meta line shared by the trigger
        // button and each menu row.
        const buildTriggerMeta = (combo, num) => {
            const parts = [];
            if (combo.credits) parts.push(`<span class="combo-selector-meta-credits">${creditsIconHtml}${combo.credits}</span>`);
            if (combo.date) parts.push(`<span class="combo-selector-meta-date">${dateIconHtml}${combo.date}</span>`);
            const votes = voteBadgeHtml(num);
            if (votes) parts.push(votes);
            return parts.join('<span class="combo-selector-meta-sep">•</span>');
        };

        const optionsHtml = comboNumbers.map(num => {
            const combo = combos[`combo${num}`];
            const label = combo.title || `Combo #${num}`;
            const isSelected = num === initialCombo;
            const hasMeta = combo.credits || combo.date;
            return `
                <li role="option" class="combo-selector-option" data-value="${num}" aria-selected="${isSelected}" id="${selectorId}-option-${num}">
                    <span class="combo-selector-option-title">${label}</span>
                    <span class="combo-selector-option-meta" id="${selectorId}-option-meta-${num}" style="${hasMeta ? '' : 'display: none;'}">
                        <span class="combo-selector-option-top" id="${selectorId}-option-top-${num}" style="display: none;"><i class="fas fa-crown"></i> Top voted</span>
                        ${combo.credits ? `<span class="combo-selector-option-credits">${creditsIconHtml}${combo.credits}</span>` : ''}
                        ${combo.date ? `<span class="combo-selector-option-date">${dateIconHtml}${combo.date}</span>` : ''}
                        <span class="combo-selector-option-votes" id="${selectorId}-option-votes-${num}" data-combo-id="${options.archetypeSlug || ''}-combo${num}"></span>
                    </span>
                </li>
            `;
        }).join('');

        // Create a cleaner, more integrated selector: a themed custom dropdown
        // (rather than a native <select>) so each combo's title and date can be
        // laid out separately instead of being squashed into one option string.
        container.innerHTML = `
            <div style="max-width: 32rem; margin: 0 auto 2rem auto;">
                <label id="${selectorId}-label" for="${selectorId}" style="display: block; text-align: center; color: ${theme.accentColor}; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
                    <i class="${labelIcon}" style="margin-right: 0.5rem;"></i>${labelText}
                </label>
                <div id="${selectorId}-wrapper" class="combo-selector-wrapper" data-open="false" style="
                    --csel-accent: ${theme.accentColor};
                    --csel-accent-15: ${ComboSelector.colorWithAlpha(theme.accentColor, 0.15)};
                    --csel-accent-20: ${ComboSelector.colorWithAlpha(theme.accentColor, 0.2)};
                    --csel-accent-30: ${ComboSelector.colorWithAlpha(theme.accentColor, 0.3)};
                    --csel-accent-40: ${ComboSelector.colorWithAlpha(theme.accentColor, 0.4)};
                    --csel-card-bg: ${theme.cardBg};
                    --csel-bg: ${theme.backgroundColor};
                    --csel-text: ${theme.textColor};
                ">
                    <button type="button" id="${selectorId}" class="combo-selector-trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="${selectorId}-label" aria-controls="${selectorId}-menu" data-value="${initialCombo}">
                        <span class="combo-selector-trigger-text">
                            <span class="combo-selector-trigger-title" id="${selectorId}-trigger-title">${initialLabel}</span>
                            <span class="combo-selector-trigger-meta" id="${selectorId}-trigger-meta" style="${(initialComboObj.credits || initialComboObj.date) ? '' : 'display: none;'}">${buildTriggerMeta(initialComboObj)}</span>
                        </span>
                        <svg class="combo-selector-chevron" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <div id="${selectorId}-panel" class="combo-selector-panel">
                        ${showSearch ? `
                        <div class="combo-selector-search-row">
                            <input type="text" id="${selectorId}-search" class="combo-selector-search-input"
                                   placeholder="Filter combos..." autocomplete="off" aria-label="Filter combos"
                                   aria-controls="${selectorId}-menu">
                        </div>
                        ` : ''}
                        <ul id="${selectorId}-menu" class="combo-selector-menu" role="listbox" aria-labelledby="${selectorId}-label" tabindex="-1">
                            ${optionsHtml}
                        </ul>
                        ${showSearch ? `<div id="${selectorId}-no-results" class="combo-selector-no-results">No combos match your search.</div>` : ''}
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.getElementById(`${selectorId}-wrapper`);
        const trigger = document.getElementById(selectorId);
        const menu = document.getElementById(`${selectorId}-menu`);
        const triggerTitle = document.getElementById(`${selectorId}-trigger-title`);
        const triggerMeta = document.getElementById(`${selectorId}-trigger-meta`);
        const searchInput = showSearch ? document.getElementById(`${selectorId}-search`) : null;
        const noResultsEl = showSearch ? document.getElementById(`${selectorId}-no-results`) : null;
        // "All options" (bind listeners, resync after vote-driven reorder) vs.
        // "visible options" (keyboard nav target - excludes filtered-out rows).
        const optionEls = Array.from(menu.querySelectorAll('.combo-selector-option'));
        const getVisibleOptions = () => optionEls.filter(opt => opt.style.display !== 'none');

        let activeIndex = Math.max(0, comboNumbers.indexOf(initialCombo));

        const focusOption = (index) => {
            const visible = getVisibleOptions();
            optionEls.forEach(opt => opt.classList.remove('is-active'));
            const opt = visible[index];
            if (opt) {
                opt.classList.add('is-active');
                opt.scrollIntoView({ block: 'nearest' });
            }
        };

        // Shows a fade hint at the bottom of the menu whenever it's scrolled
        // to reveal more options below the fold (the menu is display:none
        // while closed, so this must be recomputed each time it opens/resizes
        // or the filtered set changes).
        const updateHasMore = () => {
            const hasMore = (menu.scrollHeight - menu.scrollTop - menu.clientHeight) > 4;
            wrapper.dataset.hasMore = hasMore ? 'true' : 'false';
        };
        menu.addEventListener('scroll', updateHasMore, { passive: true });

        // Filters options by title/credits substring match. Only wired up
        // when the combo count exceeds searchThreshold (search row exists).
        const applyFilter = (query) => {
            const q = query.trim().toLowerCase();
            let anyVisible = false;
            optionEls.forEach(li => {
                const combo = combos[`combo${li.dataset.value}`];
                const match = !q || `${combo.title || ''} ${combo.credits || ''}`.toLowerCase().includes(q);
                li.style.display = match ? '' : 'none';
                if (match) anyVisible = true;
            });
            if (noResultsEl) noResultsEl.style.display = anyVisible ? 'none' : '';
            activeIndex = 0;
            focusOption(activeIndex);
            updateHasMore();
        };

        if (searchInput) {
            searchInput.addEventListener('input', () => applyFilter(searchInput.value));
            searchInput.addEventListener('keydown', (e) => {
                if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) return;
                if (e.key === 'Escape') {
                    closeMenu();
                    trigger.focus();
                    return;
                }
                e.preventDefault();
                const visible = getVisibleOptions();
                if (e.key === 'ArrowDown') {
                    activeIndex = Math.min(visible.length - 1, activeIndex + 1);
                    focusOption(activeIndex);
                } else if (e.key === 'ArrowUp') {
                    activeIndex = Math.max(0, activeIndex - 1);
                    focusOption(activeIndex);
                } else if (e.key === 'Enter') {
                    const opt = visible[activeIndex];
                    if (opt) {
                        selectCombo(opt.dataset.value);
                        closeMenu();
                        trigger.focus();
                    }
                }
            });
        }

        const openMenu = () => {
            wrapper.setAttribute('data-open', 'true');
            trigger.setAttribute('aria-expanded', 'true');
            // Always start from a clean, unfiltered list on open.
            if (searchInput) searchInput.value = '';
            applyFilter('');
            const visible = getVisibleOptions();
            activeIndex = Math.max(0, visible.findIndex(el => el.dataset.value === trigger.dataset.value));
            focusOption(activeIndex);
            updateHasMore();
            if (searchInput) searchInput.focus();
        };

        const closeMenu = () => {
            wrapper.setAttribute('data-open', 'false');
            trigger.setAttribute('aria-expanded', 'false');
        };

        const selectCombo = (num, { silent = false } = {}) => {
            const combo = combos[`combo${num}`];
            if (!combo) return;
            trigger.dataset.value = num;
            triggerTitle.textContent = combo.title || `Combo #${num}`;
            const votes = voteMap[num];
            if (combo.credits || combo.date || (votes && (votes.up + votes.down) > 0)) {
                triggerMeta.style.display = '';
                triggerMeta.innerHTML = buildTriggerMeta(combo, num);
            } else {
                triggerMeta.style.display = 'none';
                triggerMeta.innerHTML = '';
            }
            optionEls.forEach(opt => opt.setAttribute('aria-selected', opt.dataset.value === num ? 'true' : 'false'));
            if (!silent && onChangeCallback) onChangeCallback(num);
        };

        trigger.addEventListener('click', () => {
            if (wrapper.getAttribute('data-open') === 'true') {
                closeMenu();
            } else {
                openMenu();
            }
        });

        trigger.addEventListener('keydown', (e) => {
            if (!['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape'].includes(e.key)) return;
            e.preventDefault();
            const isOpen = wrapper.getAttribute('data-open') === 'true';
            if (e.key === 'Escape') {
                closeMenu();
            } else if (!isOpen) {
                openMenu();
            } else if (e.key === 'ArrowDown') {
                activeIndex = Math.min(getVisibleOptions().length - 1, activeIndex + 1);
                focusOption(activeIndex);
            } else if (e.key === 'ArrowUp') {
                activeIndex = Math.max(0, activeIndex - 1);
                focusOption(activeIndex);
            } else {
                const opt = getVisibleOptions()[activeIndex];
                if (opt) selectCombo(opt.dataset.value);
                closeMenu();
            }
        });

        optionEls.forEach((opt) => {
            opt.addEventListener('click', () => {
                selectCombo(opt.dataset.value);
                closeMenu();
                trigger.focus();
            });
            opt.addEventListener('mouseenter', () => {
                // Looked up at event time (rather than closed over) because
                // votesPromise may reorder optionEls, and filtering may hide
                // some, after these listeners bind.
                activeIndex = getVisibleOptions().indexOf(opt);
                focusOption(activeIndex);
            });
        });

        // Initialize display + notify the host page of the starting combo.
        selectCombo(initialCombo, { silent: true });
        if (onChangeCallback) onChangeCallback(initialCombo);

        // Votes patch in asynchronously once Supabase responds: badges get
        // filled in, the top-voted combo is marked, and the list is
        // re-sorted best-first. This never changes which combo is currently
        // displayed/selected - only the list's order and decoration.
        if (votesPromise) {
            votesPromise.then(({ byId }) => {
                if (!byId) return;
                Object.assign(voteMap, ...comboNumbers.map(num => {
                    const comboId = `${options.archetypeSlug}-combo${num}`;
                    return byId[comboId] ? { [num]: byId[comboId] } : {};
                }));

                const topScore = Math.max(0, ...comboNumbers.map(num => voteMap[num]?.score ?? 0));

                comboNumbers.forEach(num => {
                    const votesEl = document.getElementById(`${selectorId}-option-votes-${num}`);
                    const topEl = document.getElementById(`${selectorId}-option-top-${num}`);
                    const metaEl = document.getElementById(`${selectorId}-option-meta-${num}`);
                    const votes = voteMap[num];
                    if (votesEl) votesEl.innerHTML = voteBadgeHtml(num);
                    const isTop = topScore > 0 && votes && votes.score === topScore;
                    if (topEl) topEl.style.display = isTop ? '' : 'none';
                    if (metaEl && ((votes && (votes.up + votes.down) > 0) || isTop)) metaEl.style.display = '';
                });

                // Re-sort options best-first (stable: ties/no-votes keep JSON order).
                const sortedNums = [...comboNumbers].sort((a, b) => (voteMap[b]?.score ?? 0) - (voteMap[a]?.score ?? 0));
                sortedNums.forEach(num => {
                    const el = document.getElementById(`${selectorId}-option-${num}`);
                    if (el) menu.appendChild(el); // moves the existing node; listeners survive
                });

                // Resync closures that track option order/identity in place
                // (both are const bindings, so mutate contents rather than reassign).
                comboNumbers.splice(0, comboNumbers.length, ...sortedNums);
                optionEls.splice(0, optionEls.length, ...Array.from(menu.querySelectorAll('.combo-selector-option')));
                activeIndex = Math.max(0, getVisibleOptions().findIndex(el => el.dataset.value === trigger.dataset.value));

                // Refresh the trigger's meta line in case the selected combo now has a vote badge.
                selectCombo(trigger.dataset.value, { silent: true });

                if (wrapper.getAttribute('data-open') === 'true') updateHasMore();
            }).catch(err => console.error('[ComboSelector] Failed to load votes:', err));
        }

        return trigger;
    }

    static setTheme(theme) {
        const root = document.documentElement;

        console.log('[ComboSelector] Applying theme:', theme);

        // Set accent/primary colors
        if (theme.accentColor) {
            root.style.setProperty('--combo-accent', theme.accentColor);
            root.style.setProperty('--combo-selector-focus-border', theme.accentColor);
            root.style.setProperty('--primary-color', theme.accentColor);
            root.style.setProperty('--combo-selector-border', theme.accentColor);
            root.style.setProperty('--combo-selector-label-color', theme.accentColor);

            // Set arrow color (needs to be URL-encoded for SVG)
            const arrowColor = theme.accentColor.replace('#', '%23');
            root.style.setProperty('--combo-selector-arrow-color', arrowColor);

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

        console.log('[ComboSelector] Theme applied successfully');
    }

    static inferTheme() {
        const getStyle = (el, prop) => window.getComputedStyle(el).getPropertyValue(prop);
        const bodyBg = getStyle(document.body, 'background-color');
        const root = document.documentElement;

        console.log('[ComboSelector] Inferring theme... Page title:', document.title);
        console.log('[ComboSelector] Body background:', bodyBg);

        // 1. Explicit Archetype Detection

        // A-to-Z Theme (Golden Yellow)
        if (document.title.toLowerCase().includes('a-to-z') || bodyBg.includes('10, 14, 26')) {
            console.log('[ComboSelector] Detected A-to-Z theme');
            return {
                accentColor: '#facc15', // Golden Yellow
                secondaryColor: '#fbbf24', // Amber-400
                isDarkMode: true,
                backgroundColor: 'rgba(22, 30, 45, 0.95)', // Dark Blue-Gray
                cardBg: 'rgba(32, 42, 58, 0.8)',
                textColor: '#d1d5db'
            };
        }

        // Kewl Tune Theme (Neon Pink/Cyan)
        if (document.title.toLowerCase().includes('kewl tune') || bodyBg.includes('kewl')) {
            return {
                accentColor: '#ff00ff', // Neon Pink
                secondaryColor: '#00ffff', // Neon Cyan
                isDarkMode: true,
                backgroundColor: 'rgba(20, 20, 30, 0.8)', // Dark background
                cardBg: 'rgba(0, 0, 0, 0.5)',
                textColor: '#ffffff'
            };
        }

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

        // Mermail Theme (Cyan/Blue)
        if (document.title.toLowerCase().includes('mermail') || bodyBg.includes('3, 12, 20')) {
            return {
                accentColor: '#38bdf8', // Sky-400
                secondaryColor: '#0ea5e9', // Sky-500
                isDarkMode: true,
                backgroundColor: 'rgba(11, 26, 42, 0.95)',
                cardBg: 'rgba(11, 26, 42, 0.95)',
                textColor: '#e0f2fe'
            };
        }

        // 2. Enhanced Generic Scanner (Fallback)
        // First check CSS variables
        let accentColor = getComputedStyle(root).getPropertyValue('--accent-color') ||
            getComputedStyle(root).getPropertyValue('--primary-color');

        // Check for .text-accent class elements
        if (!accentColor || !accentColor.trim()) {
            const accentElements = document.querySelectorAll('.text-accent, strong.text-accent');
            for (const el of accentElements) {
                const color = getStyle(el, 'color');
                if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgb(255, 255, 255)') {
                    accentColor = color;
                    break;
                }
            }
        }

        // Check headers for colorful text
        if (!accentColor || !accentColor.trim()) {
            const headers = document.querySelectorAll('h1, h2, h3, h4');
            for (const h of headers) {
                const color = getStyle(h, 'color');
                const rgb = color.match(/\d+/g);
                // Look for non-grayscale colors (where RGB values differ significantly)
                if (rgb && (Math.abs(rgb[0] - rgb[1]) > 30 || Math.abs(rgb[1] - rgb[2]) > 30 || Math.abs(rgb[0] - rgb[2]) > 30)) {
                    accentColor = color;
                    break;
                }
            }
        }

        // Check .card elements for border colors
        if (!accentColor || !accentColor.trim()) {
            const cards = document.querySelectorAll('.card, .card-panel');
            for (const card of cards) {
                const borderColor = getStyle(card, 'border-left-color') || getStyle(card, 'border-color');
                const rgb = borderColor.match(/\d+/g);
                if (rgb && (Math.abs(rgb[0] - rgb[1]) > 30 || Math.abs(rgb[1] - rgb[2]) > 30)) {
                    accentColor = borderColor;
                    break;
                }
            }
        }

        if (!accentColor || !accentColor.trim()) accentColor = '#60a5fa'; // Blue-400 fallback

        const rgb = bodyBg.match(/\d+/g);
        const isDarkMode = rgb ? (parseInt(rgb[0]) * 0.299 + parseInt(rgb[1]) * 0.587 + parseInt(rgb[2]) * 0.114) < 128 : true;

        // Detect card background color from existing .card elements
        let cardBg = isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#ffffff';
        const existingCard = document.querySelector('.card, .card-panel');
        if (existingCard) {
            const cardBgColor = getStyle(existingCard, 'background-color');
            if (cardBgColor && cardBgColor !== 'rgba(0, 0, 0, 0)') {
                cardBg = cardBgColor;
            }
        }

        return {
            accentColor: accentColor.trim(),
            isDarkMode: isDarkMode,
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            cardBg: cardBg,
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
    static render(containerId, comboData, archetypeSlug, votesPromise = null) {
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
        const comboIds = [];

        Object.keys(combos).forEach((key, comboIndex) => {
            const combo = combos[key];
            const normalizedKey = key.replace('combo', '');
            const comboId = `${archetypeSlug}-${key}`;
            comboIds.push(comboId);

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
                // Parse markdown links in description
                const parsedDescription = this.parseMarkdownLinks(combo.description, accent);
                descriptionHtml = `
                    <div class="px-6 pt-6 pb-2" style="background-color: ${theme.isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'};">
                        <p class="text-sm md:text-base leading-relaxed italic opacity-90" style="color: ${textMain}">
                            <i class="fas fa-quote-left mr-2 opacity-50"></i>${parsedDescription}<i class="fas fa-quote-right ml-2 opacity-50"></i>
                        </p>
                        ${combo.credits || combo.date ? `
                        <p class="mt-3 text-xs font-medium opacity-70 flex flex-wrap gap-x-4 gap-y-1" style="color: ${accent};">
                            ${combo.credits ? `<span><i class="fas fa-user-circle mr-1"></i>${combo.credits}</span>` : ''}
                            ${combo.date ? `<span><i class="fas fa-calendar-alt mr-1"></i>${combo.date}</span>` : ''}
                        </p>
                        ` : ''}
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

            // --- VOTE BAR ---
            const voteBarDiv = document.createElement('div');
            voteBarDiv.innerHTML = this.voteBarHtml(comboId, accent, textMain, theme.isDarkMode);
            guideContainer.appendChild(voteBarDiv.firstElementChild);

            if (combo.steps) {
                combo.steps.forEach((step, stepIndex) => {
                    const stepNum = stepIndex + 1;

                    // Resolve primary card for this step (handle single card or multiple actions)
                    let primaryCardId = step.card;
                    if (!primaryCardId && step.actions && step.actions.length > 0) {
                        primaryCardId = step.actions[0].card;
                    }

                    const cardName = cardNameMap[primaryCardId] || primaryCardId || "Unknown Card";
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

            // Fixed collapse button — lives on document.body to escape overflow:hidden
            const fixedCollapseBtn = document.createElement('button');
            // Set each style individually to avoid any cssText parsing failures
            Object.assign(fixedCollapseBtn.style, {
                position: 'fixed',
                bottom: '28px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: '9999',
                display: 'none',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(8,6,20,0.94)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '700',
                padding: '0.6rem 1.4rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                whiteSpace: 'nowrap',
            });
            fixedCollapseBtn.innerHTML = '<i class="fas fa-chevron-up" style="font-size:0.7rem;"></i>&nbsp;Collapse combo';
            fixedCollapseBtn.onmouseenter = () => {
                fixedCollapseBtn.style.transform = 'translateX(-50%) translateY(-2px)';
                fixedCollapseBtn.style.boxShadow = '0 6px 28px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)';
            };
            fixedCollapseBtn.onmouseleave = () => {
                fixedCollapseBtn.style.transform = 'translateX(-50%)';
                fixedCollapseBtn.style.boxShadow = '0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)';
            };
            fixedCollapseBtn.onclick = () => {
                // Capture header position before the page shrinks
                const headerTop = header.getBoundingClientRect().top + window.pageYOffset;
                stepsWrapper.classList.add('hidden');
                fixedCollapseBtn.style.display = 'none';
                const icon = document.getElementById(`guide-icon-${key}`);
                if (icon) icon.style.transform = 'rotate(0deg)';
                window.scrollTo({ top: headerTop });
            };
            document.body.appendChild(fixedCollapseBtn);

            function syncCollapseBtn() {
                const stepsOpen = !stepsWrapper.classList.contains('hidden');
                const headerGone = header.getBoundingClientRect().bottom < 0;
                console.log('[CollapseBtn] stepsOpen:', stepsOpen, 'headerGone:', headerGone);
                fixedCollapseBtn.style.display = (stepsOpen && headerGone) ? 'inline-flex' : 'none';
            }

            window.addEventListener('scroll', syncCollapseBtn, { passive: true });
            document.addEventListener('scroll', syncCollapseBtn, { passive: true });
            // Re-check after header click (toggle open/close)
            header.addEventListener('click', () => setTimeout(syncCollapseBtn, 0));
            // Initial check in case the combo loads while page is already scrolled
            setTimeout(syncCollapseBtn, 500);

            guideContainer.appendChild(stepsWrapper);
            comboSection.appendChild(guideContainer);

            container.appendChild(comboSection);
        });

        // --- UPLOAD YOUR OWN REPLAY CTA ---
        // These combos are curated/hand-authored; make it obvious there's a
        // way to contribute your own rather than leaving that undiscoverable.
        const uploadCta = document.createElement('div');
        uploadCta.style.cssText = `padding:1rem 0.5rem 0; text-align:center; font-size:0.82rem; color:${textMain}; opacity:0.85;`;
        uploadCta.innerHTML = `<i class="fas fa-upload" style="margin-right:0.45rem;"></i>Got a replay of your own?
            <a href="../pages/My-Replays.html#replays" style="color:${accent}; font-weight:600; text-decoration:none;">Upload it and share your combo guide &rarr;</a>`;
        container.appendChild(uploadCta);

        // Defer card loading to existing CardLoader
        if (window.CardLoader) {
            setTimeout(() => window.CardLoader.loadCards(imageMap), 100);
        }

        // Patch the (initially disabled/loading) vote bars once the shared
        // vote fetch resolves. Falls back to fetching directly if this guide
        // is ever rendered standalone without a pre-started promise.
        if (comboIds.length) {
            (votesPromise || fetchStaticComboVotes(comboIds)).then(({ enabled, byId }) => {
                comboIds.forEach(comboId => {
                    const v = byId?.[comboId];
                    ComboGuide._applyVoteState(comboId, v?.score ?? 0, v?.up ?? 0, v?.down ?? 0, v?.userVote ?? 0, !!enabled);
                });
            }).catch(err => console.error('[ComboGuide] Failed to load votes:', err));
        }
    }

    /**
     * Vote bar HTML for a single combo, keyed by its derived comboId
     * (`${archetypeSlug}-${comboKey}`). Starts disabled/loading; the caller's
     * votesPromise patches in the real score/breakdown and enabled state
     * once Supabase responds (see ComboGuide.render and _applyVoteState).
     */
    static voteBarHtml(comboId, accent, textMain, isDark) {
        return `
            <div style="padding:0.75rem 1.5rem; display:flex; align-items:center; gap:0.85rem; flex-wrap:wrap;
                        border-bottom:1px solid ${accent}30; background-color: ${isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'};">
                <span style="font-size:0.78rem; color:${textMain}; opacity:0.75; flex-shrink:0;">Was this guide helpful?</span>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <button id="static-vote-up-${comboId}" data-active="0" disabled title="Log in to vote"
                            onclick="castStaticVote('${comboId}', 1)"
                            style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.9rem; border-radius:0.5rem;
                                   background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#d4d4d4;
                                   font-size:0.82rem; font-weight:600; cursor:default; font-family:inherit; transition:all 0.15s;">
                        <i class="fas fa-thumbs-up" style="font-size:0.8rem;"></i> Yes
                    </button>
                    <span id="static-vote-score-${comboId}"
                          style="font-size:0.9rem; font-weight:700; min-width:1.5rem; text-align:center; color:#a3a3a3;">&ndash;</span>
                    <span id="static-vote-breakdown-${comboId}"
                          style="font-size:0.72rem; font-weight:600; color:#a3a3a3; display:none;"></span>
                    <button id="static-vote-down-${comboId}" data-active="0" disabled title="Log in to vote"
                            onclick="castStaticVote('${comboId}', -1)"
                            style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.9rem; border-radius:0.5rem;
                                   background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#d4d4d4;
                                   font-size:0.82rem; font-weight:600; cursor:default; font-family:inherit; transition:all 0.15s;">
                        <i class="fas fa-thumbs-down" style="font-size:0.8rem;"></i> No
                    </button>
                </div>
                <span id="static-vote-login-${comboId}" style="display:inline-flex; align-items:center; gap:0.5rem;">
                    <span style="font-size:0.72rem; color:${textMain}; opacity:0.6;">Log in to vote:</span>
                    <button onclick="window.Auth && window.Auth.signInWithDiscord()" title="Log in with Discord"
                            style="display:inline-flex; align-items:center; justify-content:center; width:1.85rem; height:1.85rem;
                                   border-radius:50%; background:#5865F2; border:1px solid rgba(255,255,255,0.2);
                                   color:#fff; font-size:0.82rem; cursor:pointer; font-family:inherit; transition:box-shadow 0.15s;"
                            onmouseover="this.style.boxShadow='0 0 10px rgba(88,101,242,0.7)'"
                            onmouseout="this.style.boxShadow='none'">
                        <i class="fab fa-discord"></i>
                    </button>
                    <button onclick="window.Auth && window.Auth.signInWithGoogle()" title="Log in with Google"
                            style="display:inline-flex; align-items:center; justify-content:center; width:1.85rem; height:1.85rem;
                                   border-radius:50%; background:#4285F4; border:1px solid rgba(255,255,255,0.2);
                                   color:#fff; font-size:0.78rem; cursor:pointer; font-family:inherit; transition:box-shadow 0.15s;"
                            onmouseover="this.style.boxShadow='0 0 10px rgba(66,133,244,0.7)'"
                            onmouseout="this.style.boxShadow='none'">
                        <i class="fab fa-google"></i>
                    </button>
                </span>
            </div>`;
    }

    /**
     * Sync a vote bar's DOM to a given score/breakdown/userVote/enabled state.
     */
    static _applyVoteState(comboId, score, up, down, userVote, enabled) {
        const upBtn = document.getElementById(`static-vote-up-${comboId}`);
        const downBtn = document.getElementById(`static-vote-down-${comboId}`);
        const scoreEl = document.getElementById(`static-vote-score-${comboId}`);
        const breakdownEl = document.getElementById(`static-vote-breakdown-${comboId}`);
        const loginEl = document.getElementById(`static-vote-login-${comboId}`);
        if (!upBtn || !downBtn || !scoreEl) return;

        if (loginEl) loginEl.style.display = enabled ? 'none' : 'inline-flex';

        [[upBtn, 1], [downBtn, -1]].forEach(([btn, val]) => {
            const active = userVote === val;
            btn.dataset.active = active ? '1' : '0';
            btn.disabled = !enabled;
            btn.title = enabled ? '' : 'Log in to vote';
            btn.style.cursor = enabled ? 'pointer' : 'default';
            btn.style.background = active ? (val === 1 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.06)';
            btn.style.borderColor = active ? (val === 1 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)') : 'rgba(255,255,255,0.15)';
            btn.style.color = active ? (val === 1 ? '#4ade80' : '#f87171') : '#d4d4d4';
        });

        scoreEl.textContent = score;
        scoreEl.style.color = score > 0 ? '#4ade80' : score < 0 ? '#f87171' : '#a3a3a3';

        if (breakdownEl) {
            breakdownEl.dataset.up = up;
            breakdownEl.dataset.down = down;
            if (up + down > 0) {
                breakdownEl.style.display = '';
                breakdownEl.innerHTML = `(<span style="color:#4ade80;">${up}<i class="fas fa-thumbs-up" style="font-size:0.6rem; margin-left:0.15rem;"></i></span> <span style="color:#f87171;">${down}<i class="fas fa-thumbs-down" style="font-size:0.6rem; margin-left:0.15rem;"></i></span>)`;
            } else {
                breakdownEl.style.display = 'none';
            }
        }

        // Keep the selector's list badge for this combo in sync too, if present.
        const selectorVotesEl = document.querySelector(`.combo-selector-option-votes[data-combo-id="${comboId}"]`);
        if (selectorVotesEl) {
            selectorVotesEl.innerHTML = (up + down) > 0 ? `
                <span class="csel-vote-up"><i class="fas fa-thumbs-up"></i> ${up}</span>
                <span class="csel-vote-down"><i class="fas fa-thumbs-down"></i> ${down}</span>
            ` : '';
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

        // Sentence case fix for the very first letter if needed
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    /**
     * Parse markdown links and convert them to beautiful HTML anchors with icons
     * @param {string} text - Text containing markdown links
     * @param {string} accentColor - Accent color for styling links
     * @returns {string} Text with HTML links
     */
    static parseMarkdownLinks(text, accentColor) {
        if (!text) return '';

        // Match markdown links: [text](url)
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

        return text.replace(markdownLinkRegex, (match, linkText, url) => {
            // Detect if it's a YouTube link
            const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
            const icon = isYouTube ? 'fab fa-youtube' : 'fas fa-external-link-alt';

            // Create a beautiful pill-shaped button with icon
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline"
                       style="
                           background: linear-gradient(135deg, ${accentColor}20, ${accentColor}40);
                           border: 2px solid ${accentColor};
                           color: ${accentColor};
                           box-shadow: 0 2px 8px ${accentColor}30;
                       "
                       onmouseover="this.style.background='linear-gradient(135deg, ${accentColor}40, ${accentColor}60)'; this.style.boxShadow='0 4px 16px ${accentColor}50';"
                       onmouseout="this.style.background='linear-gradient(135deg, ${accentColor}20, ${accentColor}40)'; this.style.boxShadow='0 2px 8px ${accentColor}30';">
                        <i class="${icon}"></i>
                        <span>${linkText}</span>
                        <i class="fas fa-arrow-right text-xs"></i>
                    </a>`;
        });
    }

    static highlightKeywords(text, nameMap, color, isDark) {
        let processed = text;
        const names = [...new Set(Object.values(nameMap))].sort((a, b) => b.length - a.length);
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
        this.lastEffectCard = null;
        this.lastEffectDesc = null;

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
        this.lastEffectPanel = container.querySelector('.sim-last-effect');
        this.lastEffectNameEl = container.querySelector('.sim-last-effect-cardname');
        this.lastEffectTextEl = container.querySelector('.sim-last-effect-text');
        const lastEffectCloseBtn = container.querySelector('.sim-last-effect-close');
        if (lastEffectCloseBtn) {
            lastEffectCloseBtn.addEventListener('click', () => this.clearLastEffect());
        }

        // NOTE: Removed internal createPopup(). Using global CardLoader.showPopup instead.

        // 3. Resize Observer (Keeps cards aligned when tabs change)
        // Optimized to not trigger during scrolling for better performance
        if (window.ResizeObserver) {
            let resizeTimeout;
            let scrollTimeout;
            let isScrolling = false;

            // Detect scrolling to pause resize observer
            const handleScroll = () => {
                isScrolling = true;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                    // Reposition once after scrolling stops
                    this.repositionCards();
                }, 150);
            };

            window.addEventListener('scroll', handleScroll, { passive: true });

            this.resizeObserver = new ResizeObserver(() => {
                if (this.boardEl.offsetParent !== null && !isScrolling) {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => this.repositionCards(), 250);
                }
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
                    <!-- Banished Zone takes this spot -->
                    
                    <div class="zone field-zone" id="zone-field"></div>
                    <div class="main-monster-zones">
                        <div class="zone main-monster-zone" id="zone-m1"></div>
                        <div class="zone main-monster-zone" id="zone-m2"></div>
                        <div class="zone main-monster-zone" id="zone-m3"></div>
                        <div class="zone main-monster-zone" id="zone-m4"></div>
                        <div class="zone main-monster-zone" id="zone-m5"></div>
                    </div>
                    <div class="zone banished-zone" id="zone-banish" title="Banished Cards"></div>
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
                </div>
                <div class="hand-area" id="zone-hand"></div>
                <div class="token-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;"></div>
            </div>

            <div class="sim-controls">
                <button class="sim-btn sim-btn-nav btn-reset"><i class="fas fa-undo"></i> Reset</button>
                <button class="sim-btn sim-btn-nav btn-prev"><i class="fas fa-step-backward"></i></button>
                <button class="sim-btn sim-btn-play btn-play"><i class="fas fa-play"></i> Play</button>
                <button class="sim-btn sim-btn-nav btn-next"><i class="fas fa-step-forward"></i></button>
                <button class="sim-btn sim-btn-nav btn-gy" title="View Graveyard"><i class="fas fa-skull"></i> GY</button>
                <button class="sim-btn sim-btn-nav btn-banish" title="View Banished Cards"><i class="fas fa-fire"></i> Banish</button>
                <button class="sim-btn sim-btn-sound btn-sound" title="Sound On"><i class="fas fa-volume-up"></i></button>
            </div>
            <div class="sim-settings">
                <i class="fas fa-tachometer-alt" style="color:var(--text-muted); font-size: 0.8rem;"></i>
                <input type="range" class="sim-speed" min="400" max="2400" step="200" value="1600" style="flex:1;" title="Playback Speed">
            </div>
            <div class="sim-last-effect" style="display:none;">
                <div class="sim-last-effect-header">
                    <span><i class="fas fa-bolt" style="font-size:0.65rem;margin-right:0.35rem;"></i>Last Effect</span>
                    <button type="button" class="sim-last-effect-close" title="Dismiss">&times;</button>
                </div>
                <div class="sim-last-effect-cardname"></div>
                <div class="sim-last-effect-text"></div>
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
        container.querySelector('.btn-gy').onclick = () => this.showGraveyardContents();
        container.querySelector('.btn-banish').onclick = () => this.showBanishedContents();
        container.querySelector('.sim-speed').oninput = (e) => {
            this.speed = 2800 - parseInt(e.target.value); // fuller bar = faster (shorter delay)
            if (this.isPlaying) {
                clearInterval(this.interval);
                this.interval = setInterval(() => this.nextStep(), this.speed);
            }
        };
        const soundBtn = container.querySelector('.btn-sound');
        if (soundBtn) {
            soundBtn.onclick = () => {
                if (typeof ComboSounds === 'undefined') return;
                const muted = ComboSounds.toggleMute();
                soundBtn.innerHTML = muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
                soundBtn.title = muted ? 'Sound Off' : 'Sound On';
                soundBtn.classList.toggle('sound-muted', muted);
            };
        }
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
        // Note: will-change is set only during transitions to save GPU memory

        // Helper to set background safely
        const setImg = (url) => {
            if (url) token.style.backgroundImage = `url('${url}')`;
        };

        // Case 1: Explicit Dummy / Placeholder
        if (data.isDummy || String(data.id).startsWith('dummy-') || String(data.name).toLowerCase().startsWith('any ')) {
            setImg("https://images.ygoprodeck.com/images/cards/back_high.jpg");
        }
        // Case 2: Tokens are never in the public card database (name is just the generic
        // "Token" string), so fetch their art directly by passcode instead of by name.
        else if (data.isToken && data.code) {
            setImg(`https://images.ygoprodeck.com/images/cards/${data.code}.jpg`);
        }
        // Case 3: Use CardLoader to fetch URL (cached or API)
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
                    // Update preview panel if mouse is already over this token
                    if (token._hovered) {
                        window.CardLoader.showCardPreview(url);
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
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
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

        // Hover preview panel
        token.addEventListener('mouseenter', () => {
            token._hovered = true;
            if (data.isDummy || typeof window.CardLoader === 'undefined') return;
            const bgUrl = token.style.backgroundImage;
            const m = bgUrl.match(/url\(['"]?([^'"]+)['"]?\)/);
            const url = m ? m[1] : null;
            if (url && !url.includes('back_high')) {
                window.CardLoader.showCardPreview(url);
            }
        });

        token.addEventListener('mouseleave', () => {
            token._hovered = false;
            if (typeof window.CardLoader !== 'undefined') {
                window.CardLoader.hideCardPreview();
            }
        });
    }

    setPosition(token, zoneId, cachedRects = null) {
        // "zone-vanish" is not a real board location — cards that start here (mostly
        // Tokens not yet Special Summoned) or that have vanished must not be rendered
        // anywhere: no pile, no position, no count.
        if (zoneId === 'zone-vanish') {
            token.style.opacity = '0';
            token.style.display = 'none';
            token.style.pointerEvents = 'none';
            return;
        }

        const wrapper = document.getElementById(this.containerId);

        let boardRect, zoneRect;

        if (cachedRects) {
            boardRect = cachedRects.board;
            zoneRect = cachedRects.zones[zoneId];
        } else {
            const zone = wrapper.querySelector(`#${zoneId}`);
            if (!zone) return;
            boardRect = this.boardEl.getBoundingClientRect();
            zoneRect = zone.getBoundingClientRect();
        }

        if (!zoneRect || boardRect.width === 0) return;

        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const w = isMobile ? 62 : 120;
        const h = isMobile ? 90 : 175;

        token.style.width = `${w}px`;
        token.style.height = `${h}px`;

        if (zoneId === 'zone-hand') {
            const handTokens = Array.from(this.tokenLayer.children).filter(t => t.getAttribute('data-zone') === 'zone-hand');
            const idx = handTokens.indexOf(token);
            const total = handTokens.length;
            // Fan cards when hand is large: compress step so all cards stay within the zone
            const normalStep = w + 5;
            const step = total > 1 ? Math.min(normalStep, (zoneRect.width - w) / (total - 1)) : normalStep;
            const totalWidth = total > 1 ? (total - 1) * step + w : w;
            const startX = (zoneRect.width - totalWidth) / 2;

            token.style.left = (zoneRect.left - boardRect.left + startX + (idx * step)) + 'px';
            token.style.top = (zoneRect.top - boardRect.top + (zoneRect.height - h) / 2) + 'px';
            token.style.zIndex = String(10 + idx);
        } else {
            const jX = (zoneId.includes('gy') || zoneId.includes('deck') || zoneId.includes('banish')) ? (Math.random() * 4 - 2) : 0;
            const jY = (zoneId.includes('gy') || zoneId.includes('deck') || zoneId.includes('banish')) ? (Math.random() * 4 - 2) : 0;
            token.style.left = (zoneRect.left - boardRect.left + (zoneRect.width - w) / 2 + jX) + 'px';
            token.style.top = (zoneRect.top - boardRect.top + (zoneRect.height - h) / 2 + jY) + 'px';
            // Rotate banished cards sideways
            if (zoneId.includes('banish')) {
                token.style.transform = 'rotate(90deg)';
            } else {
                token.style.transform = 'none';
            }
        }
    }

    repositionCards() {
        if (!this.boardEl) return;

        const boardRect = this.boardEl.getBoundingClientRect();
        if (boardRect.width === 0) return;

        const wrapper = document.getElementById(this.containerId);
        const zoneIds = [
            'zone-em-left', 'zone-em-right',
            'zone-field', 'zone-banish', 'zone-gy', 'zone-deck', 'zone-extra', 'zone-hand',
            'zone-m1', 'zone-m2', 'zone-m3', 'zone-m4', 'zone-m5',
            'zone-s1', 'zone-s2', 'zone-s3', 'zone-s4', 'zone-s5'
        ];

        const cachedRects = {
            board: boardRect,
            zones: {}
        };

        zoneIds.forEach(id => {
            const el = wrapper.querySelector(`#${id}`);
            if (el) cachedRects.zones[id] = el.getBoundingClientRect();
        });

        Object.values(this.cards).forEach(c => {
            const z = c.element.getAttribute('data-zone') || c.data.zone;
            this.setPosition(c.element, z, cachedRects);
        });
    }

    moveCard(cardId, targetZoneId) {
        const c = this.cards[cardId];
        if (!c) return;

        // If the card is already in the target zone, do nothing
        if (c.element.getAttribute('data-zone') === targetZoneId) return;

        // Handle Material Attachment (Logical)
        if (targetZoneId.startsWith('material:')) {
            const parentId = targetZoneId.split(':')[1];
            this.attachMaterial(cardId, parentId);
            return;
        }

        // Auto-resolve Spell/Trap zone collisions to prevent stacking
        const stZones = ['zone-s1', 'zone-s2', 'zone-s3', 'zone-s4', 'zone-s5'];
        if (stZones.includes(targetZoneId)) {
            const isOccupied = Object.values(this.cards).some(other =>
                other.id !== cardId &&
                other.element.getAttribute('data-zone') === targetZoneId &&
                other.element.style.display !== 'none' &&
                other.element.style.opacity !== '0'
            );

            if (isOccupied) {
                // Find first empty ST zone
                const emptyZone = stZones.find(zId =>
                    !Object.values(this.cards).some(other =>
                        other.id !== cardId &&
                        other.element.getAttribute('data-zone') === zId &&
                        other.element.style.display !== 'none' &&
                        other.element.style.opacity !== '0'
                    )
                );

                if (emptyZone) {
                    this.log(`Zone ${targetZoneId} occupied, redirecting ${c.data.name} to ${emptyZone}`);
                    targetZoneId = emptyZone;
                }
            }
        }

        const isToken = c.data.isToken === true || (c.data.type || '').toLowerCase().includes('token') || (c.data.name || '').toLowerCase().includes('token');
        const isLeaving = ['zone-gy', 'zone-deck', 'zone-hand', 'zone-banish'].includes(targetZoneId);
        // "zone-vanish" is not a real board zone — it's a signal that a Token ceases to
        // exist (e.g. tributed/used as material) instead of physically going to the GY.
        const isVanishTarget = targetZoneId === 'zone-vanish';

        if (c.vanishTimeout) {
            clearTimeout(c.vanishTimeout);
            c.vanishTimeout = null;
        }

        if (isVanishTarget || (isToken && isLeaving)) {
            this.log(isVanishTarget ? `(${c.data.name} vanishes)` : `(Token removed)`);
            c.element.style.opacity = "0";
            c.element.style.transform = "scale(0.5)";
            // Note: data-zone is deliberately left untouched (rather than set to the vanish
            // target) so the GY/Banish viewer panels, which filter by data-zone, never list
            // a vanished Token — it never actually occupied that zone.
            c.vanishTimeout = setTimeout(() => c.element.style.display = 'none', 500);
            return;
        }

        // Check for attached materials and move them if parent is leaving field
        if (this.materials && this.materials[cardId] && this.materials[cardId].length > 0) {
            if (isLeaving) {
                // Move all materials to GY
                const mats = [...this.materials[cardId]];
                this.log(`Materials for ${c.data.name} sent to GY`);
                mats.forEach(matId => {
                    this.moveCard(matId, 'zone-gy');
                });
                this.materials[cardId] = []; // Clear attachments
            } else {
                // If parent moves to another field zone, materials should follow (visually)
                setTimeout(() => {
                    this.materials[cardId].forEach(matId => {
                        const mat = this.cards[matId];
                        if (mat) {
                            mat.element.setAttribute('data-zone', targetZoneId);
                            this.setPosition(mat.element, targetZoneId);
                        }
                    });
                }, 50);
            }
        }

        c.element.style.display = 'block';
        c.element.style.opacity = '1';
        c.element.style.transform = 'scale(1)';
        c.element.style.pointerEvents = 'auto';

        // Ensure high Z-Index during movement so it flies OVER other cards
        c.element.style.zIndex = '100';

        const currentZone = c.element.getAttribute('data-zone') || c.data.zone;
        // Cards materializing out of "zone-vanish" (e.g. a Token being Special Summoned)
        // were never actually positioned anywhere — skip the snap-to-current-position
        // step so we don't call setPosition('zone-vanish'), which would just re-hide them.
        if (!c.element.style.left && currentZone !== 'zone-vanish') {
            // Temporarily disable transition for initial placement if it was missing
            const originalTransition = c.element.style.transition;
            c.element.style.transition = 'none';
            this.setPosition(c.element, currentZone);
            void c.element.offsetWidth; // Force Browser Reflow
            c.element.style.transition = originalTransition;
        }

        // When a real card is drawn from deck to hand, consume one dummy placeholder
        if (!c.data.isDummy && targetZoneId === 'zone-hand' && c.element.getAttribute('data-zone') === 'zone-deck') {
            const dummy = Object.values(this.cards).find(d =>
                d.data.isDummy &&
                d.element.getAttribute('data-zone') === 'zone-hand' &&
                d.element.style.display !== 'none'
            );
            if (dummy) {
                dummy.element.setAttribute('data-zone', 'zone-removing');
                dummy.element.style.opacity = '0';
                dummy.element.style.transform = 'scale(0)';
                setTimeout(() => { dummy.element.style.display = 'none'; }, 350);
            }
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

    attachMaterial(cardId, parentId) {
        if (!this.materials) this.materials = {};
        if (!this.materials[parentId]) this.materials[parentId] = [];

        // Avoid duplicates
        if (!this.materials[parentId].includes(cardId)) {
            this.materials[parentId].push(cardId);
        }

        const parent = this.cards[parentId];
        const child = this.cards[cardId];

        if (parent && child) {
            const parentZone = parent.element.getAttribute('data-zone');

            // Move child to parent's zone visually
            child.element.setAttribute('data-zone', parentZone);
            this.setPosition(child.element, parentZone);
        }
    }

    nextStep() {
        const steps = this.combos[this.currentComboId].steps;
        if (this.currentStep < steps.length) {
            const s = steps[this.currentStep];
            this.log(`> ${s.text}`);

            // Check if this step is an effect activation
            const isEffectActivation = s.text && s.text.toLowerCase().includes('activate effect');

            // Check for Extra Deck summon types
            const summonType = this.detectSummonType(s.text);

            if (s.actions && Array.isArray(s.actions)) {
                // For summons, find the summoned card (usually the last action or the one going to a monster zone)
                let summonedCardId = null;
                if (summonType) {
                    // Find the card being summoned (typically goes to a monster zone, not to GY)
                    for (const action of s.actions) {
                        if (action.to && !action.to.includes('gy') && !action.isOverlay) {
                            summonedCardId = action.card;
                        }
                    }
                }

                if (isEffectActivation) {
                    this.showLastEffectForCard(s.actions[0].card, s.text);
                }

                s.actions.forEach(action => {
                    if (isEffectActivation) {
                        this.playEffectAnimation(action.card);
                    }
                    // Play summon animation on the summoned card
                    if (summonType && action.card === summonedCardId) {
                        this.playSummonAnimation(action.card, summonType);
                    }
                    this.moveCard(action.card, action.to);
                });
            } else {
                if (isEffectActivation) {
                    this.playEffectAnimation(s.card);
                    this.showLastEffectForCard(s.card, s.text);
                }
                if (summonType) {
                    this.playSummonAnimation(s.card, summonType);
                }
                this.moveCard(s.card, s.to);
            }

            this.currentStep++;

            // Sound effects — fires if combo-sounds.js is loaded on the page
            if (typeof ComboSounds !== 'undefined') {
                const lowerText = s.text ? s.text.toLowerCase() : '';
                let soundEvent;
                if (summonType) {
                    soundEvent = summonType;
                } else if (lowerText.includes('equip')) {
                    soundEvent = 'equip';
                } else if (isEffectActivation) {
                    soundEvent = 'effect';
                } else if (lowerText.includes('normal summon')) {
                    soundEvent = 'normal-summon';
                } else if (lowerText.includes('special summon')) {
                    soundEvent = 'special-summon';
                } else if (!s.actions && s.to === 'zone-gy') {
                    soundEvent = 'to-gy';
                } else if (!s.actions && s.to === 'zone-banish') {
                    soundEvent = 'to-banish';
                } else if (!s.actions && s.to === 'zone-vanish') {
                    soundEvent = 'to-banish';
                } else if (!s.actions && s.to === 'zone-hand') {
                    soundEvent = 'draw';
                } else {
                    soundEvent = 'step';
                }
                ComboSounds.play(soundEvent);
            }
        } else {
            this.log("Combo Complete!");
            this.togglePlay(false);
            if (typeof ComboSounds !== 'undefined') ComboSounds.play('combo-complete');
        }
    }

    /**
     * Detect the type of Extra Deck summon from step text
     * @param {string} text - The step text
     * @returns {string|null} The summon type or null if not a summon
     */
    detectSummonType(text) {
        if (!text) return null;
        const lowerText = text.toLowerCase();

        if (lowerText.includes('xyz summon')) return 'xyz';
        if (lowerText.includes('synchro summon')) return 'synchro';
        if (lowerText.includes('contact fusion')) return 'contact-fusion';
        if (lowerText.includes('fusion summon') || lowerText.includes('fusion')) return 'fusion';
        if (lowerText.includes('link summon')) return 'link';
        if (lowerText.includes('ritual summon')) return 'ritual';
        if (lowerText.includes('pendulum summon')) return 'pendulum';
        if (lowerText.includes('tribute summon') || lowerText.includes('advance summon')) return 'tribute';

        return null;
    }

    /**
     * Play a visual summon animation on a card
     * @param {string} cardId - The ID of the card being summoned
     * @param {string} summonType - The type of summon (xyz, synchro, fusion, link, contact-fusion)
     */
    playSummonAnimation(cardId, summonType) {
        const c = this.cards[cardId];
        if (!c || !c.element) return;

        const token = c.element;
        const animationClass = `${summonType}-summoning`;

        // Remove any existing summon animation classes
        token.classList.remove('xyz-summoning', 'synchro-summoning', 'fusion-summoning', 'link-summoning', 'contact-fusion-summoning');

        // Force a reflow to restart animation
        void token.offsetWidth;

        // Add the animation class
        token.classList.add(animationClass);

        // Determine animation duration based on type
        const durations = {
            'xyz': 1250,
            'synchro': 1150,
            'fusion': 1350,
            'link': 1050,
            'contact-fusion': 1250
        };

        // Remove the class after animation completes
        setTimeout(() => {
            token.classList.remove(animationClass);
        }, durations[summonType] || 1200);
    }

    /**
     * Play a visual effect animation on a card when it activates its effect
     * @param {string} cardId - The ID of the card activating its effect
     */
    playEffectAnimation(cardId) {
        const c = this.cards[cardId];
        if (!c || !c.element) return;

        const token = c.element;

        // Remove any existing animation class
        token.classList.remove('activating-effect');

        // Force a reflow to restart animation
        void token.offsetWidth;

        // Add the animation class
        token.classList.add('activating-effect');

        // Remove the class after animation completes
        setTimeout(() => {
            token.classList.remove('activating-effect');
        }, 850);
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

            // Restore the Last Effect panel to match the rewound-to step
            // (loadCombo() -> reset() already cleared it above)
            for (let i = target - 1; i >= 0; i--) {
                const s = steps[i];
                if (s.text && s.text.toLowerCase().includes('activate effect')) {
                    const cardId = s.card || (s.actions && s.actions[0] && s.actions[0].card);
                    if (cardId) this.showLastEffectForCard(cardId, s.text);
                    break;
                }
            }
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
        this.clearLastEffect();
        if (typeof window.CardLoader !== 'undefined') window.CardLoader.hideCardPreview();
    }

    /**
     * Resolve the card's display name from an in-play card ID and show it in
     * the Last Effect panel, preferring the full effect text from CardLoader's
     * cache (populated by preloadAllImages) over the short combo step text.
     */
    showLastEffectForCard(cardId, stepText) {
        const cardEntry = this.cards[cardId];
        const cardName = cardEntry && cardEntry.data ? cardEntry.data.name : null;
        if (!cardName) return;
        const effectText = this.getEffectTextForCard(cardName) || stepText;
        this.showLastEffect(cardName, effectText);
    }

    getEffectTextForCard(cardName) {
        if (typeof window.CardLoader === 'undefined' || typeof window.CardLoader.getCachedCard !== 'function') return null;
        const cached = window.CardLoader.getCachedCard(cardName);
        return cached && cached.desc ? cached.desc : null;
    }

    showLastEffect(cardName, effectText) {
        this.lastEffectCard = cardName;
        this.lastEffectDesc = effectText;
        if (!this.lastEffectPanel || !this.lastEffectNameEl || !this.lastEffectTextEl) return;
        this.lastEffectNameEl.textContent = cardName;
        this.lastEffectTextEl.textContent = effectText;
        this.lastEffectPanel.style.display = '';
    }

    clearLastEffect() {
        this.lastEffectCard = null;
        this.lastEffectDesc = null;
        if (this.lastEffectPanel) this.lastEffectPanel.style.display = 'none';
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
    showGraveyardContents() {
        const gyCards = Object.values(this.cards).filter(c => c.element.getAttribute('data-zone') === 'zone-gy');

        if (gyCards.length === 0) {
            this.log('Graveyard is empty');
            return;
        }

        // Close banish panel if open
        const banishPanel = document.getElementById('banish-side-panel');
        if (banishPanel) {
            document.body.removeChild(banishPanel);
        }

        const existingPanel = document.getElementById('gy-side-panel');
        if (existingPanel) {
            document.body.removeChild(existingPanel);
            return;
        }

        // Create side panel overlay
        const overlay = document.createElement('div');
        overlay.id = 'gy-side-panel';
        overlay.style.cssText = 'position:fixed; top:0; right:0; width:' + (window.innerWidth <= 768 ? '100%' : '400px') + '; height:100%; background:rgba(30,41,59,0.98); z-index:9999; box-shadow:-4px 0 20px rgba(0,0,0,0.5); border-left:2px solid #38bdf8; display:flex; flex-direction:column; animation:slideIn 0.3s ease-out;';

        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = '@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }';
        document.head.appendChild(style);

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:20px; border-bottom:2px solid #38bdf8; display:flex; justify-content:space-between; align-items:center; background:#0f172a;';

        const title = document.createElement('h3');
        title.textContent = `Graveyard (${gyCards.length} cards)`;
        title.style.cssText = 'color:#38bdf8; margin:0; font-size:20px; font-weight:bold;';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = 'background:transparent; border:none; color:#38bdf8; font-size:24px; cursor:pointer; padding:0; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:4px; transition:background 0.2s;';
        closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(56,189,248,0.1)';
        closeBtn.onmouseleave = () => closeBtn.style.background = 'transparent';
        closeBtn.onclick = () => document.body.removeChild(overlay);

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Scrollable card container
        const cardContainer = document.createElement('div');
        cardContainer.style.cssText = 'flex:1; overflow-y:auto; padding:20px;';

        const cardGrid = document.createElement('div');
        cardGrid.style.cssText = 'display:grid; grid-template-columns:repeat(2, 1fr); gap:16px;';

        gyCards.forEach(c => {
            const cardWrapper = document.createElement('div');
            cardWrapper.style.cssText = 'cursor:pointer; transition:transform 0.2s; position:relative; display:flex; align-items:center; justify-content:center;';
            cardWrapper.onmouseenter = () => cardWrapper.style.transform = 'scale(1.05)';
            cardWrapper.onmouseleave = () => cardWrapper.style.transform = 'scale(1)';

            const cardImg = document.createElement('div');
            cardImg.style.cssText = `width:100%; aspect-ratio:59/86; background-size:cover; background-position:center; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.4); border:2px solid #38bdf8; ${c.element.style.backgroundImage ? 'background-image:' + c.element.style.backgroundImage : ''}`;

            cardWrapper.onclick = (e) => {
                if (typeof window.CardLoader !== 'undefined' && !c.data.isDummy) {
                    window.CardLoader.showPopup(e, c.data.name);
                }
            };

            cardWrapper.appendChild(cardImg);
            cardGrid.appendChild(cardWrapper);
        });

        cardContainer.appendChild(cardGrid);

        // Footer with info
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:16px 20px; border-top:2px solid #38bdf8; background:#0f172a; color:#94a3b8; font-size:12px; text-align:center;';
        footer.textContent = 'Click any card to view details';

        overlay.appendChild(header);
        overlay.appendChild(cardContainer);
        overlay.appendChild(footer);

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        document.body.appendChild(overlay);
    }

    showBanishedContents() {
        const banishedCards = Object.values(this.cards).filter(c => c.element.getAttribute('data-zone') === 'zone-banish');

        if (banishedCards.length === 0) {
            this.log('Banished zone is empty');
            return;
        }

        // Close GY panel if open
        const gyPanel = document.getElementById('gy-side-panel');
        if (gyPanel) {
            document.body.removeChild(gyPanel);
        }

        // Check if banish panel already exists - toggle it
        const existingPanel = document.getElementById('banish-side-panel');
        if (existingPanel) {
            document.body.removeChild(existingPanel);
            return;
        }

        // Create side panel overlay
        const overlay = document.createElement('div');
        overlay.id = 'banish-side-panel';
        overlay.style.cssText = 'position:fixed; top:0; right:0; width:' + (window.innerWidth <= 768 ? '100%' : '400px') + '; height:100%; background:rgba(30,41,59,0.98); z-index:9999; box-shadow:-4px 0 20px rgba(0,0,0,0.5); border-left:2px solid #f97316; display:flex; flex-direction:column; animation:slideIn 0.3s ease-out;';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:20px; border-bottom:2px solid #f97316; display:flex; justify-content:space-between; align-items:center; background:#0f172a;';

        const title = document.createElement('h3');
        title.textContent = `Banished (${banishedCards.length} cards)`;
        title.style.cssText = 'color:#f97316; margin:0; font-size:20px; font-weight:bold;';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = 'background:transparent; border:none; color:#f97316; font-size:24px; cursor:pointer; padding:0; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:4px; transition:background 0.2s;';
        closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(249,115,22,0.1)';
        closeBtn.onmouseleave = () => closeBtn.style.background = 'transparent';
        closeBtn.onclick = () => document.body.removeChild(overlay);

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Scrollable card container
        const cardContainer = document.createElement('div');
        cardContainer.style.cssText = 'flex:1; overflow-y:auto; padding:20px;';

        const cardGrid = document.createElement('div');
        cardGrid.style.cssText = 'display:grid; grid-template-columns:repeat(2, 1fr); gap:16px;';

        banishedCards.forEach(c => {
            const cardWrapper = document.createElement('div');
            // Use a square-ish container to accommodate the rotated card
            cardWrapper.style.cssText = 'cursor:pointer; transition:transform 0.2s; position:relative; display:flex; align-items:center; justify-content:center;';
            cardWrapper.onmouseenter = () => cardWrapper.style.transform = 'scale(1.05)';
            cardWrapper.onmouseleave = () => cardWrapper.style.transform = 'scale(1)';

            const cardImg = document.createElement('div');
            // Rotate the card 90 degrees. Swap width/height aspect ratio considerations.
            // Original card is ~59x86. Rotated it's ~86x59.
            // We set width to be smaller to fit in grid, and rotate it.
            cardImg.style.cssText = `width:100%; aspect-ratio:59/86; background-size:cover; background-position:center; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.4); border:2px solid #f97316; ${c.element.style.backgroundImage ? 'background-image:' + c.element.style.backgroundImage : ''}`;

            cardWrapper.onclick = (e) => {
                if (typeof window.CardLoader !== 'undefined' && !c.data.isDummy) {
                    window.CardLoader.showPopup(e, c.data.name);
                }
            };

            cardWrapper.appendChild(cardImg);
            cardGrid.appendChild(cardWrapper);
        });

        cardContainer.appendChild(cardGrid);

        // Footer with info
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:16px 20px; border-top:2px solid #f97316; background:#0f172a; color:#94a3b8; font-size:12px; text-align:center;';
        footer.textContent = 'Click any card to view details';

        overlay.appendChild(header);
        overlay.appendChild(cardContainer);
        overlay.appendChild(footer);

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        document.body.appendChild(overlay);
    }

}

// ============================================================================
// STATIC COMBO VOTING
// ============================================================================
// Casts/toggles/switches a vote on a legacy (JSON-authored) combo, keyed by
// its derived comboId ("${archetypeSlug}-${comboKey}"). Mirrors the
// combovotes toggle pattern in community-combos.js's castVote, but against
// the staticcombovotes table since these combos have no row in `combos`.
window.castStaticVote = async function (comboId, value) {
    const client = window.Auth?._getClient?.();
    const session = await window.Auth?.getSession?.();
    if (!client || !session) return;

    const userId = session.user.id;
    const upBtn = document.getElementById(`static-vote-up-${comboId}`);
    const downBtn = document.getElementById(`static-vote-down-${comboId}`);
    const scoreEl = document.getElementById(`static-vote-score-${comboId}`);
    const breakdownEl = document.getElementById(`static-vote-breakdown-${comboId}`);
    if (!upBtn || !downBtn || !scoreEl) return;

    const currentVote = upBtn.dataset.active === '1' ? 1 : (downBtn.dataset.active === '1' ? -1 : 0);
    const newVote = currentVote === value ? 0 : value;

    try {
        if (newVote === 0) {
            await client.from('staticcombovotes').delete().eq('comboid', comboId).eq('userid', userId);
        } else {
            await client.from('staticcombovotes').upsert({ userid: userId, comboid: comboId, value: newVote });
        }
        const prevScore = parseInt(scoreEl.textContent, 10) || 0;
        let up = parseInt(breakdownEl?.dataset.up, 10) || 0;
        let down = parseInt(breakdownEl?.dataset.down, 10) || 0;
        if (currentVote === 1) up--;
        if (currentVote === -1) down--;
        if (newVote === 1) up++;
        if (newVote === -1) down++;
        ComboGuide._applyVoteState(comboId, prevScore + (newVote - currentVote), up, down, newVote, true);
    } catch (e) {
        console.error('Static combo vote failed:', e.message);
    }
};

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================
// Automatically initialize combo systems on page load for elements with data-combo-system attribute
// Usage: <div data-combo-system="Blue-Eyes"></div>

document.addEventListener('DOMContentLoaded', () => {
    const comboContainers = document.querySelectorAll('[data-combo-system]');

    if (comboContainers.length > 0) {
        console.log(`[ComboLoader] Found ${comboContainers.length} combo system(s) to auto-initialize`);
    }

    comboContainers.forEach(async (container) => {
        const archetypeName = container.dataset.comboSystem;

        if (!archetypeName) {
            console.warn('[ComboLoader] Found data-combo-system attribute with no value, skipping');
            return;
        }

        // Auto-generate ID if not provided
        if (!container.id) {
            const generatedId = `combo-system-${archetypeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            container.id = generatedId;
            console.log(`[ComboLoader] Auto-generated ID: ${generatedId}`);
        }

        try {
            await ComboLoader.renderComboSystem(container.id, archetypeName, {});
        } catch (error) {
            console.error(`[ComboLoader] Failed to auto-initialize combo system for ${archetypeName}:`, error);
        }
    });
});
