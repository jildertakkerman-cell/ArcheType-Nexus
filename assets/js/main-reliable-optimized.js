// Reliable optimized main application with proper icon handling
class ArchetypeLoader {
    constructor() {
        this.archetypes = [];
        this.displayedArchetypes = [];
        this.currentPage = 0;
        this.pageSize = 24;
        this.isLoading = false;
        this.searchQuery = '';
        this.sortBy = 'az';
        this.alphabetFilter = 'all';
        this.categoryFilter = 'all';
        this.scrollPosition = 0;
        this.scrollRestoreKey = 'archetype-scroll-position';
        this.alphabetRestoreKey = 'archetype-alphabet-filter';
        this.searchRestoreKey = 'archetype-search-query';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupScrollMemory();
        await this.loadArchetypes();
        await this.fetchArchetypeDates();
        this.hideLoading();
        this.restoreSearchQuery();
        this.restoreAlphabetFilter();
        this.displayArchetypes();
        this.updateAlphabetButtons();
        this.restoreScrollPosition();
    }

    setupEventListeners() {
        document.getElementById('search-input').addEventListener('keyup', 
            this.debounce(() => this.handleSearch(), 300));
        document.getElementById('sort-by').addEventListener('change', () => this.handleSort());
        document.getElementById('category-filter').addEventListener('change', () => this.handleCategoryFilter());
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMore());
        
        document.querySelectorAll('.alphabet-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAlphabetFilter(btn.dataset.letter));
        });
        
        this.setupInfiniteScroll();
        
        document.addEventListener('click', (e) => {
            const archetypeCard = e.target.closest('a[href$=".html"]');
            if (archetypeCard) {
                this.saveScrollPosition();
                this.saveAlphabetFilter(this.alphabetFilter);
                this.saveSearchQuery(this.searchQuery);
            }
        });
    }

    async loadArchetypes() {
        try {
            this.showLoading();
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'assets/js/archetypes-data.js';
                script.defer = true;
                
                script.onload = () => {
                    if (typeof archetypes !== 'undefined' && Array.isArray(archetypes)) {
                        this.archetypes = archetypes;
                        this.filterAndSort();
                        resolve();
                    } else {
                        reject(new Error('Archetype data not loaded properly'));
                    }
                };
                
                script.onerror = () => reject(new Error('Failed to load archetype data'));
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('Error loading archetypes:', error);
            this.showError('Failed to load archetype data. Please refresh the page.');
        }
    }

    normalizeArchetypeName(name) {
        return name.replace(/-/g, '');
    }

    async fetchArchetypeDates() {
        try {
            console.log('Fetching archetype release dates...');

            const nameMapping = new Map();
            for (const archetype of this.archetypes) {
                const normalized = this.normalizeArchetypeName(archetype.name);
                nameMapping.set(normalized, archetype.name);
            }

            // Check cache first
            const cacheKey = 'archetype-dates-cache';
            const cacheExpiryKey = 'archetype-dates-cache-expiry';
            const now = Date.now();
            const cacheExpiry = localStorage.getItem(cacheExpiryKey);
            
            if (cacheExpiry && now < parseInt(cacheExpiry)) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const archetypeDates = new Map(JSON.parse(cached));
                    this.updateArchetypesWithDates(archetypeDates);
                    console.log('Using cached archetype dates');
                    return;
                }
            }

            // Fetch all card sets
            const setResponse = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php');
            if (!setResponse.ok) {
                throw new Error(`Failed to fetch card sets: ${setResponse.statusText}`);
            }
            const allSets = await setResponse.json();

            const setReleaseDates = new Map();
            for (const set of allSets) {
                if (set.set_name && set.tcg_date) {
                    setReleaseDates.set(set.set_name, set.tcg_date);
                }
            }

            // Fetch all card info
            const cardResponse = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
            if (!cardResponse.ok) {
                throw new Error(`Failed to fetch card info: ${cardResponse.statusText}`);
            }
            const allCardsData = await cardResponse.json();
            const allCards = allCardsData.data;

            // Process cards to find dates for each archetype
            const archetypeDates = new Map();
            const archetypeCardDates = {};

            for (const card of allCards) {
                if (!card.archetype || !card.card_sets) continue;

                const normalizedArchetype = this.normalizeArchetypeName(card.archetype);
                const actualName = nameMapping.get(normalizedArchetype);
                if (!actualName) continue;

                // Find the earliest set release date for this card (its original release)
                let cardEarliestDate = null;
                for (const cardSet of card.card_sets) {
                    const tcgDate = setReleaseDates.get(cardSet.set_name);
                    if (!tcgDate) continue;
                    
                    // Only consider dates up to today to avoid future reprints
                    const setDate = new Date(tcgDate);
                    const today = new Date();
                    if (setDate > today) continue;
                    
                    if (!cardEarliestDate || tcgDate < cardEarliestDate) {
                        cardEarliestDate = tcgDate;
                    }
                }
                if (!cardEarliestDate) continue;

                if (!archetypeCardDates[actualName]) archetypeCardDates[actualName] = [];
                archetypeCardDates[actualName].push(cardEarliestDate);
            }

            // For each archetype:
            // - First release = earliest card release (when archetype began)
            // - Latest support = latest card's original release (most recent new card)
            for (const [archetypeName, cardDates] of Object.entries(archetypeCardDates)) {
                if (cardDates.length === 0) continue;
                
                const earliest = cardDates.reduce((a, b) => a < b ? a : b);
                const latest = cardDates.reduce((a, b) => a > b ? a : b);
                
                archetypeDates.set(archetypeName, { earliest, latest });
                
                // Debug log for Bamboo Sword
                if (archetypeName.toLowerCase().includes('bamboo')) {
                    console.log(`${archetypeName} dates:`, cardDates);
                    console.log(`Earliest: ${earliest}, Latest: ${latest}`);
                }
            }

            // Cache the results for 24 hours
            localStorage.setItem(cacheKey, JSON.stringify([...archetypeDates]));
            localStorage.setItem(cacheExpiryKey, (now + 24 * 60 * 60 * 1000).toString());

            this.updateArchetypesWithDates(archetypeDates);

            console.log('Archetype dates fetched and cached');
        } catch (error) {
            console.error('Error fetching archetype dates:', error);
        }
    }

    updateArchetypesWithDates(archetypeDates) {
        for (const archetype of this.archetypes) {
            if (archetype.firstReleaseDate === null || archetype.firstReleaseDate === undefined) {
                const dates = archetypeDates.get(archetype.name);
                if (dates) {
                    archetype.firstReleaseDate = dates.earliest;
                    archetype.latestReleaseDate = dates.latest;
                    archetype.fromAPI = true;
                } else {
                    archetype.firstReleaseDate = null;
                    archetype.latestReleaseDate = null;
                    archetype.fromAPI = false;
                }
            } else {
                archetype.fromAPI = false;
            }
        }
    }

    filterAndSort() {
        let filtered = this.archetypes.filter(archetype => {
            const matchesSearch = archetype.name.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesAlphabet = this.alphabetFilter === 'all' || 
                                  archetype.name.toLowerCase().startsWith(this.alphabetFilter.toLowerCase());
            const matchesCategory = this.categoryFilter === 'all' ||
                                  (this.categoryFilter === 'archetypes' && archetype.fromAPI) ||
                                  (this.categoryFilter === 'series' && !archetype.fromAPI);
            return matchesSearch && matchesAlphabet && matchesCategory;
        });

        if (this.sortBy === 'az') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === 'za') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        } else if (this.sortBy === 'firstAsc') {
            filtered.sort((a, b) => this.compareDates(a.firstReleaseDate, b.firstReleaseDate, true));
        } else if (this.sortBy === 'firstDesc') {
            filtered.sort((a, b) => this.compareDates(a.firstReleaseDate, b.firstReleaseDate, false));
        } else if (this.sortBy === 'latestAsc') {
            filtered.sort((a, b) => this.compareDates(a.latestReleaseDate, b.latestReleaseDate, true));
        } else if (this.sortBy === 'latestDesc') {
            filtered.sort((a, b) => this.compareDates(a.latestReleaseDate, b.latestReleaseDate, false));
        }

        this.displayedArchetypes = filtered;
        this.updateCounter();
        this.updateAlphabetButtons();
    }

    compareDates(dateA, dateB, ascending) {
        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;

        const comparison = dateA.localeCompare(dateB);
        return ascending ? comparison : -comparison;
    }

    displayArchetypes(reset = true) {
        if (reset) {
            this.currentPage = 0;
        }
        
        const grid = document.getElementById('archetype-grid');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (reset) {
            grid.innerHTML = '';
        }

        const startIndex = this.currentPage * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.displayedArchetypes.length);
        const pageArchetypes = this.displayedArchetypes.slice(startIndex, endIndex);

        if (pageArchetypes.length === 0 && this.currentPage === 0) {
            grid.innerHTML = '<p class="text-center text-xl col-span-full text-gray-400">No archetypes found matching your search.</p>';
            loadMoreContainer.classList.add('hidden');
            return;
        }

        const fragment = document.createDocumentFragment();
        pageArchetypes.forEach((archetype, index) => {
            const cardElement = this.createArchetypeCard(archetype, startIndex + index);
            fragment.appendChild(cardElement);
        });
        grid.appendChild(fragment);

        if (endIndex < this.displayedArchetypes.length) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }

        grid.classList.remove('hidden');
        this.currentPage++;
        
        this.lazyLoadIcons();
    }

    createArchetypeCard(archetype, index) {
        const card = document.createElement('a');
        card.href = archetype.filepath;
        card.className = 'card p-6 text-center block';
        card.setAttribute('data-index', index);
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'card-image';
        iconContainer.setAttribute('data-archetype-name', archetype.name);
        
        iconContainer.innerHTML = `
            <div class="icon-loading bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        `;

        const title = document.createElement('h2');
        title.className = 'text-2xl font-bold text-gray-100 mb-1';
        title.textContent = archetype.name;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'text-xs text-gray-400 mb-2 uppercase tracking-wide';
        categoryDiv.textContent = archetype.fromAPI ? 'Archetype' : 'Series';

        const description = document.createElement('p');
        description.className = 'text-gray-400';
        description.textContent = archetype.description;

        card.appendChild(iconContainer);
        card.appendChild(title);
        card.appendChild(categoryDiv);

        if (archetype.firstReleaseDate || archetype.latestReleaseDate) {
            const datesDiv = document.createElement('div');
            datesDiv.className = 'text-sm text-gray-500 mb-2';
            let datesText = '';
            if (archetype.firstReleaseDate) {
                datesText += `Release: ${new Date(archetype.firstReleaseDate).getFullYear()}`;
            }
            if (archetype.latestReleaseDate) {
                if (datesText) datesText += ' | ';
                datesText += `Support: ${new Date(archetype.latestReleaseDate).getFullYear()}`;
            }
            datesDiv.textContent = datesText;
            card.appendChild(datesDiv);
        }

        card.appendChild(description);

        return card;
    }

    lazyLoadIcons() {
        const iconContainers = document.querySelectorAll('.card-image .icon-loading');
        
        iconContainers.forEach(container => {
            const iconContainer = container.parentElement;
            const archetypeName = iconContainer.getAttribute('data-archetype-name');
            const archetype = this.archetypes.find(a => a.name === archetypeName);
            
            if (archetype && archetype.icon) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                iconContainer.innerHTML = archetype.icon;
                            }, Math.random() * 200);
                            observer.unobserve(entry.target);
                        }
                    });
                }, { 
                    threshold: 0.1,
                    rootMargin: '50px'
                });
                
                observer.observe(iconContainer);
            }
        });
    }

    setupInfiniteScroll() {
        const loadMoreContainer = document.getElementById('load-more-container');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading && !loadMoreContainer.classList.contains('hidden')) {
                    this.loadMore();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(loadMoreContainer);
    }

    loadMore() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        const loadBtn = document.getElementById('load-more-btn');
        const originalText = loadBtn.textContent;
        loadBtn.textContent = 'Loading...';
        loadBtn.disabled = true;
        
        setTimeout(() => {
            this.displayArchetypes(false);
            loadBtn.textContent = originalText;
            loadBtn.disabled = false;
            this.isLoading = false;
        }, 200);
    }

    handleSearch() {
        this.searchQuery = document.getElementById('search-input').value;
        this.saveSearchQuery(this.searchQuery);
        
        if (this.searchQuery.trim() !== '' && this.alphabetFilter !== 'all') {
            this.alphabetFilter = 'all';
            this.saveAlphabetFilter('all');
            
            document.querySelectorAll('.alphabet-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('[data-letter="all"]').classList.add('active');
        }
        
        this.filterAndSort();
        this.displayArchetypes(true);
    }

    handleSort() {
        this.sortBy = document.getElementById('sort-by').value;
        this.filterAndSort();
        this.displayArchetypes(true);
    }

    handleCategoryFilter() {
        this.categoryFilter = document.getElementById('category-filter').value;
        this.filterAndSort();
        this.displayArchetypes(true);
    }

    updateCounter() {
        const counter = document.getElementById('archetype-counter');
        const totalDisplayed = Math.min(this.currentPage * this.pageSize, this.displayedArchetypes.length);
        
        if (this.currentPage === 0) {
            counter.textContent = `Found ${this.displayedArchetypes.length} of ${this.archetypes.length} archetypes`;
        } else {
            counter.textContent = `Showing ${totalDisplayed} of ${this.displayedArchetypes.length} archetypes (${this.archetypes.length} total)`;
        }
    }

    showLoading() {
        document.getElementById('loading-indicator').classList.remove('hidden');
        this.isLoading = true;
    }

    hideLoading() {
        document.getElementById('loading-indicator').classList.add('hidden');
        this.isLoading = false;
    }

    showError(message) {
        const grid = document.getElementById('archetype-grid');
        grid.innerHTML = `<p class="text-center text-xl col-span-full text-red-400">
            <i class="fas fa-exclamation-triangle mr-2"></i>${message}
        </p>`;
        this.hideLoading();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    setupScrollMemory() {
        window.addEventListener('beforeunload', () => {
            this.saveScrollPosition();
            this.saveAlphabetFilter(this.alphabetFilter);
        });

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.saveScrollPosition();
            }, 100);
        });

        window.addEventListener('popstate', () => {
            setTimeout(() => {
                this.restoreAlphabetFilter();
                this.restoreScrollPosition();
            }, 100);
        });
    }

    saveScrollPosition() {
        const scrollY = window.scrollY || window.pageYOffset;
        try {
            localStorage.setItem(this.scrollRestoreKey, scrollY.toString());
            this.scrollPosition = scrollY;
        } catch (e) {
            this.scrollPosition = scrollY;
        }
    }

    restoreScrollPosition() {
        try {
            const savedPosition = localStorage.getItem(this.scrollRestoreKey);
            if (savedPosition !== null) {
                const scrollY = parseInt(savedPosition, 10);
                if (!isNaN(scrollY)) {
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            window.scrollTo({
                                top: scrollY,
                                behavior: 'smooth'
                            });
                        }, 200);
                    });
                }
            }
        } catch (e) {
            if (this.scrollPosition > 0) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        window.scrollTo({
                            top: this.scrollPosition,
                            behavior: 'smooth'
                        });
                    }, 200);
                });
            }
        }
    }

    clearScrollPosition() {
        try {
            localStorage.removeItem(this.scrollRestoreKey);
        } catch (e) {}
        this.scrollPosition = 0;
    }

    handleAlphabetFilter(letter) {
        this.alphabetFilter = letter;
        this.saveAlphabetFilter(letter);
        this.filterAndSort();
        this.displayArchetypes(true);
        
        document.querySelectorAll('.alphabet-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-letter="${letter}"]`).classList.add('active');
        
        if (letter !== 'all') {
            document.getElementById('search-input').value = '';
            this.searchQuery = '';
        }
    }

    updateAlphabetButtons() {
        const availableLetters = new Set();
        this.archetypes.forEach(archetype => {
            const firstLetter = archetype.name.charAt(0).toLowerCase();
            availableLetters.add(firstLetter);
        });

        document.querySelectorAll('.alphabet-btn').forEach(btn => {
            const letter = btn.dataset.letter;
            if (letter === 'all') {
                btn.classList.remove('disabled');
                return;
            }
            
            if (availableLetters.has(letter)) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        });
    }

    saveAlphabetFilter(letter) {
        try {
            localStorage.setItem(this.alphabetRestoreKey, letter);
        } catch (e) {}
    }

    restoreAlphabetFilter() {
        try {
            const savedLetter = localStorage.getItem(this.alphabetRestoreKey);
            if (savedLetter !== null) {
                this.alphabetFilter = savedLetter;
                
                requestAnimationFrame(() => {
                    document.querySelectorAll('.alphabet-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    const targetBtn = document.querySelector(`[data-letter="${savedLetter}"]`);
                    if (targetBtn) {
                        targetBtn.classList.add('active');
                    }
                });
                
                this.filterAndSort();
            }
        } catch (e) {
            this.alphabetFilter = 'all';
        }
    }

    saveSearchQuery(query) {
        try {
            localStorage.setItem(this.searchRestoreKey, query);
        } catch (e) {}
    }

    restoreSearchQuery() {
        try {
            const savedQuery = localStorage.getItem(this.searchRestoreKey);
            if (savedQuery !== null) {
                this.searchQuery = savedQuery;
                
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = savedQuery;
                }
                
                this.filterAndSort();
            }
        } catch (e) {
            this.searchQuery = '';
        }
    }

    clearSearchQuery() {
        try {
            localStorage.removeItem(this.searchRestoreKey);
        } catch (e) {}
        this.searchQuery = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    clearAlphabetFilter() {
        try {
            localStorage.removeItem(this.alphabetRestoreKey);
        } catch (e) {}
        this.alphabetFilter = 'all';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ArchetypeLoader();
});