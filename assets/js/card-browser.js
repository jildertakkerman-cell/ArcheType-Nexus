/**
 * Card Browser Module
 * Standalone browser for viewing archetype cards with sorting and filtering
 * 
 * Dependencies: CardLoader (card-loader.js), Supabase
 */

window.CardBrowser = (function () {
    'use strict';

    console.log('[CardBrowser] Module initializing');

    /**
     * Initialize the standalone Card Browser page
     * @param {string} archetypeName - Name of the archetype to display
     */
    async function initCardBrowserPage(archetypeName) {
        document.title = `${archetypeName} - Card Browser`;
        const titleEl = document.getElementById('archetype-title');
        if (titleEl) titleEl.textContent = archetypeName;

        const container = document.getElementById('browser-content');
        if (!container) return;

        // Check if CardLoader is available
        if (!window.CardLoader) {
            container.innerHTML = `
                <div class="text-center text-red-500 py-10">
                    <i class="fas fa-exclamation-triangle mb-4 text-4xl"></i>
                    <p class="text-xl">CardLoader not available.</p>
                </div>
            `;
            return;
        }

        // Check Supabase configuration
        if (!CardLoader.isSupabaseConfigured || !CardLoader.isSupabaseConfigured()) {
            container.innerHTML = `
                <div class="text-center text-slate-500 py-10">
                    <i class="fas fa-database mb-4 text-4xl"></i>
                    <p class="text-xl">Database not configured.</p>
                </div>
            `;
            return;
        }

        try {
            // Fetch archetype cards via CardLoader's internal method
            const cards = await CardLoader.fetchArchetypeCards(archetypeName);
            if (!cards || cards.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-slate-500 py-10">
                        <p class="text-xl">No cards found for "${archetypeName}".</p>
                        <a href="../index.html" class="inline-block mt-4 text-indigo-400 hover:text-indigo-300">Return Home</a>
                    </div>
                `;
                return;
            }

            // Get CardLoader utilities
            const utils = CardLoader._getUtils ? CardLoader._getUtils() : {};
            const TAG_CATEGORY_COLORS = utils.TAG_CATEGORY_COLORS || {};
            const KNOWN_TAG_CATEGORIES = utils.KNOWN_TAG_CATEGORIES || {};
            const CATEGORY_PRIORITY = utils.CATEGORY_PRIORITY || {};
            const CONFIG = utils.CONFIG || { IMAGE_BASE_URL: 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/cards' };

            // Pre-populate cache with fetched data
            cards.forEach(card => {
                const name = card.cardname || card.card_name;
                const id = card.passcode || card.id;
                if (name && id) {
                    CardLoader.cardDataCache[name] = {
                        name: name,
                        id: id,
                        desc: card.desc || '',
                        type: card.cardtype || card.card_type,
                        race: card.race,
                        attribute: card.attribute,
                        atk: card.atk,
                        def: card.def,
                        level: card.level,
                        hosted_image_url: `${CONFIG.IMAGE_BASE_URL}/${id}.png`
                    };
                }
            });

            // Categorize cards
            const standardCards = [];
            const animeCards = [];

            cards.forEach(card => {
                const format = (card.format || '').toUpperCase();
                if (format === 'ANIME' || (format !== 'TCG' && format !== 'OCG' && !card.passcode)) {
                    animeCards.push(card);
                } else {
                    standardCards.push(card);
                }
            });

            // --- Tag Filtering Data ---
            const allPasscodes = standardCards.map(c => c.passcode || c.id).filter(id => id);
            const tagsByCardId = {};
            const uniqueTags = new Set();
            const tagCategories = {};
            const uniqueYears = new Set();
            const yearsByCardId = {};
            const cardsToLoad = {};

            // Fetch all tags if available
            if (allPasscodes.length > 0 && CardLoader.getTagsForCard) {
                try {
                    const tagPromises = allPasscodes.map(async (passcode) => {
                        const tags = await CardLoader.getTagsForCard(passcode);
                        return { passcode, tags };
                    });

                    const results = await Promise.all(tagPromises);

                    results.forEach(({ passcode, tags }) => {
                        if (tags && tags.length > 0) {
                            tagsByCardId[passcode] = tags;
                            tags.forEach(tag => {
                                uniqueTags.add(tag.tag_name);
                                const mappedCategory = KNOWN_TAG_CATEGORIES[tag.tag_name];
                                tagCategories[tag.tag_name] = mappedCategory || tag.tag_category;
                            });
                        }
                    });

                    console.log(`[CardBrowser] Loaded tags for ${Object.keys(tagsByCardId).length} cards, ${uniqueTags.size} unique tags found`);
                } catch (err) {
                    console.warn('[CardBrowser] Batch tag fetch failed:', err);
                }
            }

            // Dictionary to store years for fallback display
            console.log('[CardBrowser] Processing cards for year extraction:', standardCards.length);

            // HYDRATION: Check if we have date info. If not, batch fetch from YGOProDeck API.
            // This fixes the issue where Supabase RPC might return limited columns.
            const needsHydration = standardCards.some(c => !c.misc_info && !c.tcg_date && !c.ocg_date && !c.tcgreleasedate && !c.ocgreleasedate && !c.release_date);

            if (needsHydration && allPasscodes.length > 0) {
                console.log('[CardBrowser] Missing date info detected. Hydrating data from API...');
                try {
                    // Fetch in chunks of 20 to avoid URL length limits
                    const chunkSize = 20;
                    const chunks = [];
                    for (let i = 0; i < allPasscodes.length; i += chunkSize) {
                        chunks.push(allPasscodes.slice(i, i + chunkSize));
                    }

                    const hydrationPromises = chunks.map(async (chunkIds) => {
                        const ids = chunkIds.join(',');
                        const apiUrl = `${CONFIG.API_URL || 'https://db.ygoprodeck.com/api/v7/cardinfo.php'}?id=${ids}&misc=yes`;
                        const resp = await fetch(apiUrl);
                        if (!resp.ok) return [];
                        const data = await resp.json();
                        return data.data || [];
                    });

                    const hydratedChunks = await Promise.all(hydrationPromises);
                    const fullCardData = hydratedChunks.flat();

                    // Merge data back into standardCards
                    const fullDataMap = {};
                    fullCardData.forEach(c => fullDataMap[String(c.id)] = c);

                    standardCards.forEach(card => {
                        const id = String(card.passcode || card.id);
                        const fullData = fullDataMap[id];
                        if (fullData) {
                            if (!card.misc_info) card.misc_info = fullData.misc_info;
                            if (!card.tcg_date) card.tcg_date = fullData.tcg_date;
                            if (!card.ocg_date) card.ocg_date = fullData.ocg_date;
                        }
                    });
                    console.log('[CardBrowser] Hydration complete.');
                } catch (hErr) {
                    console.error('[CardBrowser] Hydration failed:', hErr);
                }
            } else {
                console.log('[CardBrowser] Date info appears present (or no cards), skipping hydration.');
            }

            if (standardCards.length > 0) {
                console.log('[CardBrowser] Sample card data after hydration:', JSON.stringify(standardCards[0], null, 2));
            }

            standardCards.forEach(card => {
                let releaseDate = null;

                // Priority 1: misc_info (YGOProDeck standard)
                if (card.misc_info && card.misc_info[0]) {
                    const dateStr = card.misc_info[0].tcg_date || card.misc_info[0].ocg_date;
                    if (dateStr) releaseDate = dateStr;
                }

                // Priority 2: Direct top-level properties (Supabase/Internal)
                if (!releaseDate) {
                    // Check Supabase specific fields first as requested
                    if (card.tcgreleasedate || card.ocgreleasedate) {
                        releaseDate = card.tcgreleasedate || card.ocgreleasedate;
                    }
                    // Fallback to other known properties
                    else if (card.tcg_date || card.ocg_date) {
                        releaseDate = card.tcg_date || card.ocg_date;
                    }
                }

                // Priority 3: release_date (Custom/Fallback)
                if (!releaseDate && card.release_date) {
                    releaseDate = card.release_date;
                }

                if (releaseDate) {
                    const year = releaseDate.substring(0, 4);
                    // Validate year is a number and reasonable length
                    if (year && year.length === 4 && !isNaN(year)) {
                        const passcode = String(card.passcode || card.id || '');
                        if (passcode) {
                            yearsByCardId[passcode] = year;
                            uniqueYears.add(year);
                        }
                    }
                }
            });

            // If no years found, populate default range
            if (uniqueYears.size === 0) {
                const currentYear = new Date().getFullYear();
                for (let year = 2002; year <= currentYear; year++) {
                    uniqueYears.add(year.toString());
                }
            }

            // Helper for responsive grid rendering
            const renderBrowserCardSection = (title, cards, bgColor, icon) => {
                if (cards.length === 0) return '';

                const cardItems = cards.map((card, index) => {
                    const name = card.cardname || card.card_name || 'Unknown';
                    const passcode = String(card.passcode || card.id || '');
                    const stableId = passcode || name.split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(36);
                    const containerId = `browser-card-${stableId}`;
                    const format = (card.format || '').toUpperCase();
                    const isOCG = format === 'OCG';
                    const tagContainerId = `tags-${containerId}`;
                    const dateContainerId = `date-${containerId}`;

                    if (name) {
                        cardsToLoad[containerId] = name;
                    }

                    const tags = tagsByCardId[passcode] || [];
                    const tagsAttribute = tags.map(t => t.tag_name).join(',');
                    const tagDisplayHtml = (() => {
                        if (tags.length > 0) {
                            // Group tags by category
                            const groups = {};
                            tags.forEach(tag => {
                                const catKey = (KNOWN_TAG_CATEGORIES[tag.tag_name] || tag.tag_category || 'default').toLowerCase();
                                if (!groups[catKey]) {
                                    groups[catKey] = {
                                        key: catKey,
                                        display: catKey.charAt(0).toUpperCase() + catKey.slice(1),
                                        tags: []
                                    };
                                }
                                groups[catKey].tags.push(tag.tag_name);
                            });

                            const sortedKeys = Object.keys(groups).sort((a, b) => {
                                const prioA = CATEGORY_PRIORITY[groups[a].key] || 99;
                                const prioB = CATEGORY_PRIORITY[groups[b].key] || 99;
                                return prioA - prioB;
                            });

                            // Generate unique IDs for this card instance
                            const instanceId = stableId;

                            const tagGroupsHtml = sortedKeys.map((key) => {
                                const group = groups[key];
                                const colors = TAG_CATEGORY_COLORS[group.key] || TAG_CATEGORY_COLORS.default || {};

                                // Encode tags for passing to function
                                const encodedTags = encodeURIComponent(JSON.stringify(group.tags));
                                const encodedColorKey = encodeURIComponent(group.key);

                                return `
                                    <div class="mb-1 last:mb-0">
                                        <button 
                                            type="button"
                                            class="w-full text-left uppercase font-bold ${colors.text || 'text-slate-400'} opacity-80 hover:opacity-100 flex items-center gap-1.5 cursor-pointer transition-all hover:bg-slate-800/50 rounded py-0.5"
                                            style="font-size: 9px; letter-spacing: 0.05em;"
                                            onclick="event.stopPropagation(); window.showCategoryPopup(event, '${group.display}', '${encodedTags}', '${encodedColorKey}', ${passcode})"
                                            title="Click to view ${group.tags.length} ${group.display} tags"
                                        >
                                            <i class="fas fa-tags text-[8px] opacity-60 ml-0.5"></i>
                                            ${group.display}
                                            <span class="text-slate-500 font-normal ml-auto mr-1 text-[8px] bg-slate-800 px-1 rounded-full border border-slate-700/50 min-w-[14px] text-center">${group.tags.length}</span>
                                        </button>
                                    </div>`;
                            }).join('');

                            return `<div class="flex flex-col w-full mt-2 px-1 text-left select-none">${tagGroupsHtml}</div>`;
                        }
                        return '';
                    })();

                    let dateDisplay = '';
                    let rawDate = null;

                    // Priority 1: misc_info (YGOProDeck standard)
                    if (card.misc_info && card.misc_info[0]) {
                        rawDate = card.misc_info[0].tcg_date || card.misc_info[0].ocg_date;
                    }

                    // Priority 2: Direct top-level properties (Supabase/Internal)
                    if (!rawDate) {
                        // Check Supabase specific fields first
                        if (card.tcgreleasedate || card.ocgreleasedate) {
                            rawDate = card.tcgreleasedate || card.ocgreleasedate;
                        }
                        // Fallback to other known properties
                        else if (card.tcg_date || card.ocg_date) {
                            rawDate = card.tcg_date || card.ocg_date;
                        }
                    }

                    // Priority 3: release_date (Custom/Fallback)
                    if (!rawDate && card.release_date) {
                        rawDate = card.release_date;
                    }

                    if (rawDate) {
                        dateDisplay = rawDate.substring(0, 4);
                    }
                    if (!dateDisplay && yearsByCardId[passcode]) {
                        dateDisplay = yearsByCardId[passcode];
                    }

                    let isNewRelease = false;
                    if (rawDate) {
                        try {
                            // OPTIMISTIC YEAR HANDLING: 
                            // If date is "YYYY" only, default to Dec 31st so it stays "New" longer
                            let parseString = rawDate;
                            if (/^\d{4}$/.test(String(rawDate).trim())) {
                                parseString = `${rawDate}-12-31`;
                            }

                            const releaseDate = new Date(parseString);
                            const sixMonthsAgo = new Date();
                            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                            // Basic validation: verify releaseDate is valid
                            if (!isNaN(releaseDate.getTime())) {
                                isNewRelease = releaseDate >= sixMonthsAgo;
                                if (isNewRelease) {
                                    // Console log for debugging just one new card to confirm logic works
                                    if (Math.random() < 0.05) console.log(`[CardBrowser] New card detected: ${name} (${rawDate})`);
                                }
                            }
                        } catch (e) {
                            console.warn('[CardBrowser] Date parsing error:', e);
                        }
                    }

                    return `
                        <div class="card-item-container" data-tags="${tagsAttribute}" data-year="${dateDisplay || ''}">
                        <div class="card-item group relative flex flex-col h-full bg-slate-800/40 rounded-xl p-2 border border-slate-700/50 hover:border-indigo-500/50 transition-all hover:bg-slate-800/80 hover:shadow-xl hover:-translate-y-1">
                            
                            <!-- Image Container Wrapper (Relative) -->
                            <div class="relative w-full aspect-[59/86]">
                                <!-- Inner Container for CardLoader (Will be wiped) -->
                                <div id="${containerId}" class="w-full h-full rounded-lg overflow-hidden border border-slate-700 shadow-md bg-slate-900 group-hover:shadow-indigo-500/20 transition-all">
                                    <div class="flex items-center justify-center h-full text-center text-slate-600 text-xs p-2">
                                        <div class="animate-pulse bg-slate-800 w-full h-full rounded"></div>
                                    </div>
                                </div>

                                <!-- Badges (Outside inner container, preserved) -->
                                ${isOCG ? `<div class="absolute top-0 left-0 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br shadow-sm z-10 tracking-wider pointer-events-none rounded-tl-lg">OCG</div>` : ''}
                                ${isNewRelease ? `<div style="position: absolute; top: 0; right: 0; background-color: #10b981; color: white; font-size: 9px; font-weight: bold; padding: 2px 6px; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); z-index: 10; letter-spacing: 0.05em; pointer-events-none; border-top-right-radius: 0.5rem;">NEW</div>` : ''}
                            </div>
                            
                            <div class="mt-2 flex-1 flex flex-col items-center w-full min-h-0">
                                <span class="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center leading-tight line-clamp-2 h-8 flex items-center justify-center w-full px-0.5" title="${name}">
                                    ${name}
                                </span>
                                
                                <div id="${dateContainerId}" class="text-[8px] text-slate-500 bg-slate-900/60 px-1.5 rounded mt-0.5 ${dateDisplay ? '' : 'hidden'}">${dateDisplay || ''}</div>
                                
                                <div id="${tagContainerId}" class="w-full flex-col mt-1 empty:hidden max-h-[14rem] overflow-y-auto pr-0.5" style="scrollbar-width: thin; scrollbar-color: #334155 transparent;">
                                    ${tagDisplayHtml}
                                </div>
                            </div>
                        </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="mb-16 animate-fadeIn">
                        <div class="flex items-center gap-4 mb-8 pb-4 border-b border-slate-700/50">
                            <span class="flex items-center justify-center w-12 h-12 rounded-2xl ${bgColor} text-white shadow-lg bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm border border-white/10">
                                ${icon}
                            </span>
                            <div>
                                <h2 class="text-2xl font-bold text-white tracking-wide">${title}</h2>
                                <p class="text-sm text-slate-400">${cards.length} Cards</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-4">
                            ${cardItems}
                        </div>
                    </div>
                `;
            };

            // Helper for Anime cards
            const renderAnimeSection = (cards) => {
                if (cards.length === 0) return '';

                cards.sort((a, b) => (a.cardname || a.card_name || '').localeCompare(b.cardname || b.card_name || ''));

                const listItems = cards.map(card => {
                    const name = card.cardname || card.card_name || 'Unknown';
                    const desc = card.desc || 'No description available.';
                    const type = card.cardtype || card.card_type || 'Unknown Type';

                    return `
                        <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                            <div class="flex flex-col md:flex-row md:items-baseline gap-2 mb-2">
                                <h3 class="text-lg font-bold text-pink-300">${name}</h3>
                                <span class="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">${type}</span>
                            </div>
                            <p class="text-sm text-slate-300 leading-relaxed italic">"${desc}"</p>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="mt-12 mb-16 animate-fadeIn">
                        <div class="flex items-center gap-4 mb-8 pb-4 border-b border-pink-900/50">
                            <span class="flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-600 text-white shadow-lg bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm border border-white/10">
                                <i class="fas fa-tv"></i>
                            </span>
                            <div>
                                <h2 class="text-2xl font-bold text-white tracking-wide">Anime / Unofficial Support</h2>
                                <p class="text-sm text-slate-400">${cards.length} Cards (No Official Prints)</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 gap-4">
                            ${listItems}
                        </div>
                    </div>
                `;
            };

            // Sort cards by type
            const sortCardsByType = (cards, autoSort = true) => {
                const extraDeckTypes = ['Fusion', 'Synchro', 'Xyz', 'Link'];
                const sorted = { monsters: [], spells: [], traps: [], extraDeck: [] };

                cards.forEach(card => {
                    const cardType = (card.cardtype || card.card_type || '').toLowerCase();
                    const isExtraDeck = extraDeckTypes.some(type => cardType.includes(type.toLowerCase()));

                    if (isExtraDeck) sorted.extraDeck.push(card);
                    else if (cardType.includes('monster')) sorted.monsters.push(card);
                    else if (cardType.includes('spell')) sorted.spells.push(card);
                    else if (cardType.includes('trap')) sorted.traps.push(card);
                    else sorted.monsters.push(card);
                });

                if (autoSort) {
                    Object.keys(sorted).forEach(key => {
                        sorted[key].sort((a, b) => (a.cardname || a.card_name || '').localeCompare(b.cardname || b.card_name || ''));
                    });
                }

                return sorted;
            };

            // Global sort state
            window.currentBrowserSort = 'name-asc';

            // Clear loading spinner and create grid container
            container.innerHTML = '';
            const gridContainer = document.createElement('div');
            gridContainer.id = 'browser-grid-container';
            gridContainer.className = 'animate-fadeIn';
            container.appendChild(gridContainer);

            // Build initial HTML
            const buildInitialHtml = () => {
                const sortedCards = sortCardsByType(standardCards, true);
                let html = '<div class="pb-12">';
                html += renderBrowserCardSection('Main Deck Monsters', sortedCards.monsters, 'bg-orange-600', '<i class="fas fa-dragon"></i>');
                html += renderBrowserCardSection('Spells', sortedCards.spells, 'bg-emerald-600', '<i class="fas fa-magic"></i>');
                html += renderBrowserCardSection('Traps', sortedCards.traps, 'bg-rose-600', '<i class="fas fa-scroll"></i>');
                html += sortedCards.extraDeck.length > 0 ? renderBrowserCardSection('Extra Deck', sortedCards.extraDeck, 'bg-purple-600', '<i class="fas fa-dna"></i>') : '';
                html += renderAnimeSection(animeCards);
                html += '</div>';
                return html;
            };

            gridContainer.innerHTML = buildInitialHtml();

            // Load images
            if (Object.keys(cardsToLoad).length > 0) {
                setTimeout(() => {
                    console.log(`[CardBrowser] Loading ${Object.keys(cardsToLoad).length} card images`);
                    CardLoader.loadCards(cardsToLoad).catch(err => console.error('[CardBrowser] Load error:', err));
                }, 100);
            }

            // CSS-based sorting (no DOM recreation)
            const getSortValue = (container, type) => {
                const nameEl = container.querySelector('.text-xs.font-bold');
                const name = nameEl ? nameEl.textContent.trim() : '';
                const year = container.dataset.year || '9999';
                if (type === 'name-asc' || type === 'name-desc') return name.toLowerCase();
                return year;
            };

            window.reRenderBrowserGrid = (sortType = window.currentBrowserSort) => {
                console.log(`[CardBrowser] Sorting with: ${sortType}`);
                window.currentBrowserSort = sortType;

                const grids = gridContainer.querySelectorAll('.grid');
                grids.forEach(grid => {
                    const cards = Array.from(grid.querySelectorAll('.card-item-container'));
                    if (cards.length === 0) return;

                    const sortedCards = cards.map(card => ({
                        el: card,
                        value: getSortValue(card, sortType)
                    }));

                    sortedCards.sort((a, b) => {
                        if (sortType === 'name-asc') return a.value.localeCompare(b.value);
                        if (sortType === 'name-desc') return b.value.localeCompare(a.value);
                        if (sortType === 'date-new') return b.value.localeCompare(a.value);
                        if (sortType === 'date-old') return a.value.localeCompare(b.value);
                        return 0;
                    });

                    sortedCards.forEach((item, index) => {
                        item.el.style.order = index;
                    });
                });

                if (window.applyFilters) window.applyFilters();
            };

            // Build filter UI
            const filterContainer = document.createElement('div');
            filterContainer.className = 'filter-section w-full mb-8 p-5 rounded-2xl shadow-xl animate-fadeIn';

            const sortedUniqueTags = Array.from(uniqueTags).sort();
            const hasTags = uniqueTags.size > 0;

            // Group tags by category
            const tagsByCategory = {};
            sortedUniqueTags.forEach(tagName => {
                const category = (tagCategories[tagName] || 'default').toLowerCase();
                if (!tagsByCategory[category]) {
                    tagsByCategory[category] = [];
                }
                tagsByCategory[category].push(tagName);
            });

            // Category display configuration
            const categoryDisplayConfig = {
                combat: { label: 'Combat', icon: 'fa-fist-raised', colorClass: 'text-red-400', borderClass: 'border-red-500/30' },
                consistency: { label: 'Consistency', icon: 'fa-search', colorClass: 'text-blue-400', borderClass: 'border-blue-500/30' },
                disruption: { label: 'Disruption', icon: 'fa-hand-paper', colorClass: 'text-rose-400', borderClass: 'border-rose-500/30' },
                mechanics: { label: 'Mechanics', icon: 'fa-cogs', colorClass: 'text-indigo-400', borderClass: 'border-indigo-500/30' },
                protection: { label: 'Protection', icon: 'fa-shield-alt', colorClass: 'text-teal-400', borderClass: 'border-teal-500/30' },
                removal: { label: 'Removal', icon: 'fa-trash-alt', colorClass: 'text-amber-400', borderClass: 'border-amber-500/30' },
                cost: { label: 'Costs', icon: 'fa-coins', colorClass: 'text-cyan-400', borderClass: 'border-cyan-500/30' },
                economy: { label: 'Economy', icon: 'fa-gem', colorClass: 'text-emerald-400', borderClass: 'border-emerald-500/30' },
                interaction: { label: 'Interaction', icon: 'fa-exchange-alt', colorClass: 'text-fuchsia-400', borderClass: 'border-fuchsia-500/30' },
                default: { label: 'Other', icon: 'fa-tag', colorClass: 'text-slate-400', borderClass: 'border-slate-500/30' }
            };

            // Category priority order for display
            const categoryOrder = ['consistency', 'combat', 'disruption', 'removal', 'protection', 'mechanics', 'cost', 'economy', 'interaction', 'default'];

            // Generate category sections
            const categorySections = categoryOrder
                .filter(cat => tagsByCategory[cat] && tagsByCategory[cat].length > 0)
                .map(category => {
                    const config = categoryDisplayConfig[category] || categoryDisplayConfig.default;
                    const tags = tagsByCategory[category];
                    const colors = TAG_CATEGORY_COLORS[category] || TAG_CATEGORY_COLORS.default || {};

                    // Tag descriptions for tooltips
                    const TAG_DESCRIPTIONS = {
                        // Combat
                        "ATK/DEF Modification": "Changes Attack or Defense values of monsters",
                        "Battle Phase Control": "Manipulates the Battle Phase or attacks",
                        "Burn": "Inflicts damage to your opponent's Life Points",
                        "Direct Attack": "Can attack your opponent directly",
                        "Multiple Attacks": "Allows a monster to attack more than once",
                        "Control Change": "Takes control of opponent's cards",
                        "Flip Control": "Changes battle positions of monsters",
                        "Self-Burn": "Costs your own Life Points as damage to yourself",

                        // Consistency
                        "Draw Power": "Lets you draw additional cards",
                        "Extender": "Helps extend your combos by Special Summoning",
                        "Miller": "Sends cards from the Deck to the Graveyard",
                        "Recur": "Retrieves cards from Graveyard or banish zone",
                        "Searcher": "Adds specific cards from Deck to hand",

                        // Disruption
                        "Discard": "Forces opponent to discard cards",
                        "Floodgate": "Prevents certain game actions while on field",
                        "Hand Activation": "Can be activated from hand (hand trap)",
                        "Negate": "Negates card effects or activations",

                        // Mechanics
                        "Pendulum Support": "Supports Pendulum Summoning strategies",
                        "Quick Effect": "Effect can be activated during either player's turn",
                        "Tribute Effects": "Has effects that involve tributing",
                        "Xyz Support": "Supports Xyz Summoning strategies",
                        "LP Gain": "Increases your Life Points",
                        "Activation Condition": "Has specific conditions to activate",
                        "Activation Requirement": "Requires meeting certain requirements",
                        "Battle Trigger": "Effect triggers during battle",
                        "Cost": "Has a cost to activate the effect",
                        "Counter": "Counter Trap or counter-style effect",
                        "Effect Trigger": "Effect triggers under certain conditions",
                        "Equip": "Can equip to or be equipped as an Equip Card",
                        "Graveyard Trigger": "Effect triggers in the Graveyard",
                        "Hand Trigger": "Effect triggers or activates from hand",
                        "Material Trigger": "Effect triggers when used as material",
                        "Position Change": "Changes battle position of monsters",
                        "Special Summon": "Involves Special Summoning",
                        "Stacking": "Manipulates the order of cards in deck",
                        "Summoning Trigger": "Effect triggers upon summoning",
                        "Trap interaction": "Interacts specifically with Trap cards",
                        "Tribute": "Involves tributing cards",

                        // Protection
                        "Battle Protection": "Protects from destruction by battle",
                        "Cannot Be Banished": "Cannot be banished by effects",
                        "Cannot Be Tributed": "Cannot be tributed by opponent",
                        "Destruction Protection": "Protects from destruction effects",
                        "Effect Protection": "Protects from or is unaffected by effects",
                        "Targeting Protection": "Cannot be targeted by effects",
                        "Damage Protection": "Prevents or reduces battle damage",

                        // Removal
                        "Banishment": "Banishes cards (removes from play)",
                        "Bounce": "Returns cards to the hand",
                        "Destruction": "Destroys cards on the field",
                        "Send to GY": "Sends cards to the Graveyard (not destroy)",
                        "Spin": "Returns cards to the Deck",
                        "Monster Destruction": "Specifically destroys monsters",
                        "Spell Destruction": "Specifically destroys Spells",
                        "Trap Destruction": "Specifically destroys Traps",

                        // Cost
                        "Discard Cost": "Requires discarding cards as cost",
                        "Discard for Cost": "Discards cards to pay activation cost",
                        "Banish for Cost": "Banishes cards to pay activation cost",
                        "LP for Cost": "Pays Life Points as a cost",

                        // Economy
                        "Foolish": "Sends specific cards from Deck to GY (like Foolish Burial)",

                        // Interaction
                        "Banish": "Interacts with banished cards",
                        "Removal": "Removes cards from the field"
                    };

                    const tagButtons = tags.map(tagName => {
                        const description = TAG_DESCRIPTIONS[tagName] || 'No description available';
                        const escapedDesc = description.replace(/'/g, "\\'").replace(/"/g, '&quot;');

                        return `
                        <button class="filter-tag-btn px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer
                                       bg-slate-700/50 border border-slate-600/40 text-slate-300
                                       hover:bg-slate-600/70 hover:border-slate-500/60 hover:text-white hover:shadow-md
                                       active:bg-indigo-600/40 active:border-indigo-500/50"
                                data-tag="${tagName}"
                                title="${description}"
                                onclick="this.classList.toggle('active'); window.toggleFilter('${tagName}')">
                            ${tagName}
                        </button>
                        `;
                    }).join('');

                    return `
                        <div class="mb-3">
                            <div class="flex items-center gap-2 mb-2 px-1">
                                <i class="fas ${config.icon} ${config.colorClass} text-xs"></i>
                                <span class="text-xs font-bold ${config.colorClass} uppercase tracking-wider">${config.label}</span>
                                <span class="text-[10px] text-slate-500">(${tags.length})</span>
                            </div>
                            <div class="flex flex-wrap gap-2 pl-5 pb-2 border-l-2 ${config.borderClass}">
                                ${tagButtons}
                            </div>
                        </div>
                    `;
                }).join('');

            const totalCardsCount = standardCards.length + animeCards.length;

            filterContainer.innerHTML = `
                <!-- Sort and Filter Header -->
                <div class="flex flex-col md:flex-row md:items-center gap-4 mb-6 pb-5 border-b border-slate-700/50">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                            <i class="fas fa-sort-amount-down text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white">Sort & Filter</h3>
                            <p class="text-xs text-slate-400">${totalCardsCount} Cards • ${sortedUniqueTags.length} Tags in ${Object.keys(tagsByCategory).length} Categories</p>
                        </div>
                    </div>
                    
                    <div class="md:ml-auto flex items-center gap-3 flex-wrap">
                        <div class="flex items-center gap-2 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
                            <span class="text-[10px] uppercase font-bold text-slate-500 px-2 tracking-wider">Sort:</span>
                            <select id="browser-sort-select" 
                                    onchange="window.reRenderBrowserGrid(this.value)"
                                    class="bg-slate-800 border-0 text-slate-200 text-xs py-1.5 px-3 rounded font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer">
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="date-new">Recent First</option>
                                <option value="date-old">Oldest First</option>
                            </select>
                        </div>
                        
                        <button class="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white border border-slate-600/50 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all uppercase tracking-tight" 
                                onclick="window.clearAllFilters()">
                            <i class="fas fa-sync-alt mr-1.5 text-[10px]"></i>Reset All
                        </button>
                    </div>
                </div>

                <!-- New Cards Filter Toggle -->
                <div class="flex items-center gap-3 mb-5">
                    <button id="new-cards-filter-btn" 
                            onclick="window.toggleNewCardsFilter()" 
                            class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border-2 transition-all"
                            style="background-color: #1e293b; color: #94a3b8; border-color: #475569;">
                        <span style="display: inline-block; width: 10px; height: 10px; background-color: #10b981; border-radius: 50%;"></span>
                        New Cards Only
                        <span class="text-xs opacity-60">(Last 6 months)</span>
                    </button>
                </div>
                
                ${hasTags ? `
                <!-- Collapsible Tag Filtering Section -->
                <div class="mb-4">
                    <button id="tag-filter-toggle" 
                            onclick="window.toggleTagSection && window.toggleTagSection()"
                            class="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 
                                   border border-indigo-500/30 rounded-lg hover:border-indigo-400/50 transition-all cursor-pointer group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <i class="fas fa-filter text-indigo-400"></i>
                            </div>
                            <div class="text-left">
                                <span class="text-sm font-bold text-white">Filter by Tags</span>
                                <span class="text-xs text-slate-400 ml-2">(${sortedUniqueTags.length} available)</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">Click tags to filter cards</span>
                            <i id="tag-section-chevron" class="fas fa-chevron-down text-indigo-400 transition-transform duration-300"></i>
                        </div>
                    </button>
                    
                    <div id="tag-section-content" class="hidden mt-3 overflow-hidden transition-all duration-300">
                        <div class="text-[11px] text-slate-400 mb-3 px-2 flex items-center gap-2">
                            <i class="fas fa-mouse-pointer text-indigo-400"></i>
                            <span>Click any tag below to filter cards • Hover for description</span>
                        </div>
                        <div class="max-h-72 overflow-y-auto p-4 bg-slate-900/40 rounded-xl" style="scrollbar-width: thin; scrollbar-color: #4f46e5 transparent;">
                            ${categorySections}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Year Range Filter -->
                <div class="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
                    <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                        <i class="fas fa-calendar-alt text-white"></i>
                    </div>
                    <div class="flex items-center gap-3 flex-1 flex-wrap">
                        <h4 class="text-sm font-bold text-white">Year Range</h4>
                        <div class="flex items-center gap-2 ml-auto">
                            <select id="year-filter-from" 
                                    onchange="window.applyYearRangeFilter()"
                                    class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all cursor-pointer">
                                <option value="">From</option>
                                ${Array.from(uniqueYears).sort().map(year => `
                                    <option value="${year}">${year}</option>
                                `).join('')}
                            </select>
                            <span class="text-slate-500 text-sm">to</span>
                            <select id="year-filter-to" 
                                    onchange="window.applyYearRangeFilter()"
                                    class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600/50 text-slate-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all cursor-pointer">
                                <option value="">To</option>
                                ${Array.from(uniqueYears).sort().reverse().map(year => `
                                    <option value="${year}">${year}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `;

            // Define filter functions globally
            window.activeTagFilters = new Set();
            window.yearRangeFrom = '';
            window.yearRangeTo = '';
            window.newCardsFilterActive = false;

            window.clearAllFilters = function () {
                document.querySelectorAll('.filter-tag-btn.active').forEach(b => b.classList.remove('active'));
                window.activeTagFilters.clear();
                if (window.newCardsFilterActive) window.toggleNewCardsFilter();
                const fromSelect = document.getElementById('year-filter-from');
                const toSelect = document.getElementById('year-filter-to');
                if (fromSelect) fromSelect.value = '';
                if (toSelect) toSelect.value = '';
                window.yearRangeFrom = '';
                window.yearRangeTo = '';
                const sortSelect = document.getElementById('browser-sort-select');
                if (sortSelect) sortSelect.value = 'name-asc';
                window.reRenderBrowserGrid('name-asc');
                window.applyFilters();
            };

            window.toggleNewCardsFilter = function () {
                window.newCardsFilterActive = !window.newCardsFilterActive;
                const btn = document.getElementById('new-cards-filter-btn');
                if (btn) {
                    if (window.newCardsFilterActive) {
                        btn.style.backgroundColor = '#10b981';
                        btn.style.color = 'white';
                        btn.style.borderColor = '#059669';
                        btn.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.5)';
                    } else {
                        btn.style.backgroundColor = '#1e293b';
                        btn.style.color = '#94a3b8';
                        btn.style.borderColor = '#475569';
                        btn.style.boxShadow = 'none';
                    }
                }
                window.applyFilters();
            };

            window.toggleFilter = function (tagName) {
                if (window.activeTagFilters.has(tagName)) {
                    window.activeTagFilters.delete(tagName);
                } else {
                    window.activeTagFilters.add(tagName);
                }
                window.applyFilters();
            };

            // Toggle tag section visibility
            window.tagSectionExpanded = false;
            window.toggleTagSection = function () {
                const content = document.getElementById('tag-section-content');
                const chevron = document.getElementById('tag-section-chevron');

                window.tagSectionExpanded = !window.tagSectionExpanded;

                if (content) {
                    if (window.tagSectionExpanded) {
                        content.classList.remove('hidden');
                        content.style.maxHeight = content.scrollHeight + 'px';
                    } else {
                        content.classList.add('hidden');
                        content.style.maxHeight = '0';
                    }
                }

                if (chevron) {
                    chevron.style.transform = window.tagSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            };

            // Show tag info popup
            window.showTagInfo = function (tagName, description, event) {
                // Remove any existing popup
                const existing = document.getElementById('tag-info-popup');
                if (existing) existing.remove();

                // Create popup
                const popup = document.createElement('div');
                popup.id = 'tag-info-popup';
                popup.className = 'fixed z-[9999] bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 max-w-xs animate-fadeIn';
                popup.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <i class="fas fa-info text-indigo-400 text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-sm font-bold text-white mb-1">${tagName}</h4>
                            <p class="text-xs text-slate-300 leading-relaxed">${description}</p>
                        </div>
                        <button onclick="this.closest('#tag-info-popup').remove()" class="text-slate-400 hover:text-white">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;

                document.body.appendChild(popup);

                // Position near click
                const rect = event.target.getBoundingClientRect();
                const popupWidth = 280;
                let left = rect.left + window.scrollX;
                let top = rect.bottom + window.scrollY + 8;

                // Keep within viewport
                if (left + popupWidth > window.innerWidth) {
                    left = window.innerWidth - popupWidth - 16;
                }
                if (top + 100 > window.innerHeight + window.scrollY) {
                    top = rect.top + window.scrollY - 100;
                }

                popup.style.left = `${left}px`;
                popup.style.top = `${top}px`;
                popup.style.width = `${popupWidth}px`;

                // Close on outside click
                setTimeout(() => {
                    document.addEventListener('click', function closePopup(e) {
                        if (!popup.contains(e.target)) {
                            popup.remove();
                            document.removeEventListener('click', closePopup);
                        }
                    });
                }, 100);
            };

            window.applyYearRangeFilter = function () {
                const fromSelect = document.getElementById('year-filter-from');
                const toSelect = document.getElementById('year-filter-to');
                window.yearRangeFrom = fromSelect ? fromSelect.value : '';
                window.yearRangeTo = toSelect ? toSelect.value : '';
                window.applyFilters();
            };

            window.applyFilters = function () {
                const cards = document.querySelectorAll('.card-item-container');
                const tagFilterCount = window.activeTagFilters.size;
                const hasYearFilter = window.yearRangeFrom !== '' || window.yearRangeTo !== '';
                const newCardsFilterActive = window.newCardsFilterActive || false;

                cards.forEach(card => {
                    if (tagFilterCount === 0 && !hasYearFilter && !newCardsFilterActive) {
                        card.style.display = '';
                        return;
                    }

                    let tagMatch = true;
                    if (tagFilterCount > 0) {
                        const cardTagsStr = card.dataset.tags || '';
                        const cardTags = cardTagsStr.split(',');
                        tagMatch = Array.from(window.activeTagFilters).every(filter => cardTags.includes(filter));
                    }

                    let yearMatch = true;
                    if (hasYearFilter) {
                        const cardYear = parseInt(card.dataset.year || '0', 10);
                        const fromYear = window.yearRangeFrom ? parseInt(window.yearRangeFrom, 10) : 0;
                        const toYear = window.yearRangeTo ? parseInt(window.yearRangeTo, 10) : 9999;
                        if (cardYear === 0) yearMatch = false;
                        else yearMatch = cardYear >= fromYear && cardYear <= toYear;
                    }

                    let newCardsMatch = true;
                    if (newCardsFilterActive) {
                        const hasNewBadge = card.querySelector('.new-badge') !== null ||
                            card.querySelector('[style*="background-color: #10b981"]') !== null;
                        newCardsMatch = hasNewBadge;
                    }

                    card.style.display = (tagMatch && yearMatch && newCardsMatch) ? '' : 'none';
                });
            };

            window.showCategoryPopup = function (event, categoryName, encodedTags, encodedColorKey, passcode) {
                // Remove existing popup
                const existing = document.getElementById('category-tags-popup');
                if (existing) existing.remove();

                const tags = JSON.parse(decodeURIComponent(encodedTags));
                const colorKey = decodeURIComponent(encodedColorKey);
                const colors = TAG_CATEGORY_COLORS[colorKey] || TAG_CATEGORY_COLORS.default || {};

                // Create popup
                const popup = document.createElement('div');
                popup.id = 'category-tags-popup';
                popup.className = 'fixed z-[9999] bg-slate-900 border border-slate-600 rounded-lg shadow-2xl p-3 min-w-[220px] max-w-[280px] animate-fadeIn';

                // Header
                const headerHtml = `
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/50">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider ${colors.text || 'text-slate-300'}">${categoryName}</span>
                            <span class="text-[10px] text-slate-500 bg-slate-800 px-1.5 rounded-full">${tags.length}</span>
                        </div>
                        <button onclick="this.closest('#category-tags-popup').remove()" class="text-slate-500 hover:text-white transition-colors">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                `;

                // Tags List with Accordion Logic
                const tagsListHtml = tags.map((tagName, index) => {
                    const safeTagName = tagName.replace(/'/g, "\\'");
                    const actionContainerId = `actions-${passcode}-${index}`;

                    return `
                        <div class="tag-item-container mb-0.5">
                            <div class="flex items-center w-full text-[11px] leading-tight text-slate-300 py-1 hover:bg-slate-800/50 rounded px-1 transition-colors cursor-pointer select-none"
                                 onclick="event.stopPropagation(); window.toggleTagActions(this, ${passcode}, '${safeTagName}', '${actionContainerId}')">
                                <span class="mr-2 opacity-60 ${colors.text || 'text-slate-400'} tag-bullet">•</span>
                                <span class="flex-1 opacity-90 group-hover/tag:text-white font-medium">${tagName}</span>
                                <i class="fas fa-chevron-right text-[9px] text-slate-600 transition-transform ml-1 chevron-icon"></i>
                            </div>
                            <div id="${actionContainerId}" class="hidden pl-3 pr-1 py-1 mt-0.5 border-l border-slate-700/50 ml-1.5">
                                <div class="text-[10px] text-slate-500 italic flex items-center gap-1">
                                    <i class="fas fa-spinner fa-spin text-[9px]"></i> Loading...
                                </div>
                            </div>
                        </div>`;
                }).join('');

                popup.innerHTML = `
                    ${headerHtml}
                    <div class="flex flex-col max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        ${tagsListHtml}
                    </div>
                `;

                document.body.appendChild(popup);

                // Position Logic
                const rect = event.currentTarget.getBoundingClientRect();
                const popupWidth = 260;

                let left = rect.right + 8; // Default: to the right
                let top = rect.top;

                // Check right edge
                if (left + popupWidth > window.innerWidth) {
                    left = rect.left - popupWidth - 8; // Flip to left
                }

                // Smart vertical positioning
                const popupHeight = Math.min(350, 60 + (tags.length * 28));
                if (top + popupHeight > window.innerHeight) {
                    // Try to align bottom with bottom of viewport if it overflows
                    top = Math.max(10, window.innerHeight - popupHeight - 10);
                }
                // Also check top edge
                if (top < 10) top = 10;

                popup.style.left = `${left}px`;
                popup.style.top = `${top}px`;

                // Close on outside click
                setTimeout(() => {
                    document.addEventListener('click', function closeCatPopup(e) {
                        if (popup && !popup.contains(e.target)) {
                            popup.remove();
                            document.removeEventListener('click', closeCatPopup);
                        }
                    });
                }, 50);
            };

            // Helper to toggle actions accordion
            window.toggleTagActions = async function (element, passcode, tagName, containerId) {
                const container = document.getElementById(containerId);
                const chevron = element.querySelector('.chevron-icon');
                const popup = element.closest('#category-tags-popup');

                // Toggle state
                if (!container.classList.contains('hidden')) {
                    container.classList.add('hidden');
                    if (chevron) {
                        chevron.classList.remove('fa-chevron-down');
                        chevron.classList.add('fa-chevron-right');
                    }
                    // Auto-reposition if popup grows off-screen
                    if (popup) {
                        // Small delay to let DOM update (especially if innerHTML changed)
                        requestAnimationFrame(() => {
                            const rect = popup.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            const overflow = rect.bottom - viewportHeight;

                            if (overflow > 0) {
                                const currentTop = parseFloat(popup.style.top) || rect.top;
                                const newTop = Math.max(10, currentTop - overflow - 20); // 20px buffer
                                popup.style.top = `${newTop}px`;
                            }
                        });
                    }
                    return;
                }

                // Open
                container.classList.remove('hidden');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-right');
                    chevron.classList.add('fa-chevron-down');
                }

                // Load content if not already loaded (check for spinner)
                if (container.querySelector('.fa-spinner')) {
                    try {
                        const actions = await CardLoader.getActionsForTag(passcode, tagName);

                        if (actions && actions.length > 0) {
                            container.innerHTML = `
                                <ul class="space-y-1 bg-slate-950/30 rounded px-2 py-1.5">
                                    ${actions.map(action => `
                                        <li class="flex items-start gap-2 text-[10px] text-slate-400 italic">
                                            <span class="text-slate-600 mt-[1px] select-none">-</span>
                                            <span class="leading-tight opacity-90">${action}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            `;
                        } else {
                            container.innerHTML = `<div class="text-[10px] text-slate-500 italic ml-1 bg-slate-950/30 rounded px-2 py-1">No specific actions recorded.</div>`;
                        }
                    } catch (err) {
                        console.error('Failed to load actions', err);
                        container.innerHTML = `<div class="text-[10px] text-red-400 italic ml-1">Error loading actions.</div>`;
                    }
                }

                // Auto-reposition if popup grows off-screen
                if (popup) {
                    // Small delay to let DOM update (especially if innerHTML changed)
                    requestAnimationFrame(() => {
                        const rect = popup.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const overflow = rect.bottom - viewportHeight;

                        if (overflow > 0) {
                            const currentTop = parseFloat(popup.style.top) || rect.top;
                            const newTop = Math.max(10, currentTop - overflow - 20); // 20px buffer
                            popup.style.top = `${newTop}px`;
                        }
                    });
                }
            };

            window.applyTagFilters = window.applyFilters;

            container.insertBefore(filterContainer, container.firstChild);

        } catch (error) {
            console.error('[CardBrowser] Error loading page cards:', error);
            container.innerHTML = `
                <div class="text-center text-red-400 py-10">
                    <p class="text-xl">Error loading cards.</p>
                    <p class="text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    }

    // Public API
    return {
        initCardBrowserPage
    };
})();

console.log('[CardBrowser] Module loaded');
