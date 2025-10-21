// Reliable optimized main application with proper icon handling
class ArchetypeLoader {
    constructor() {
        this.archetypes = [];
        this.displayedArchetypes = [];
        this.currentPage = 0;
        this.pageSize = 24; // Show 24 archetypes per page for better performance
        this.isLoading = false;
        this.searchQuery = '';
        this.sortBy = 'az';
        this.alphabetFilter = 'all';
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
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMore());
        
        // Set up alphabet navigation
        document.querySelectorAll('.alphabet-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAlphabetFilter(btn.dataset.letter));
        });
        
        // Set up infinite scroll
        this.setupInfiniteScroll();
        
        // Add click listeners to archetype cards to save scroll position, alphabet filter, and search query
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
            
            // Load the full archetype data asynchronously but efficiently
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'assets/js/archetypes-data.js';
                script.defer = true; // Load asynchronously but maintain order
                
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

    filterAndSort() {
        // Filter by search query and alphabet
        let filtered = this.archetypes.filter(archetype => {
            const matchesSearch = archetype.name.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesAlphabet = this.alphabetFilter === 'all' || 
                                  archetype.name.toLowerCase().startsWith(this.alphabetFilter.toLowerCase());
            return matchesSearch && matchesAlphabet;
        });

        // Sort
        if (this.sortBy === 'az') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === 'za') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        }

        this.displayedArchetypes = filtered;
        this.updateCounter();
        this.updateAlphabetButtons();
    }

    displayArchetypes(reset = true) {
        const grid = document.getElementById('archetype-grid');
        const loadMoreContainer = document.getElementById('load-more-container');
        
        if (reset) {
            grid.innerHTML = '';
            this.currentPage = 0;
        }

        const startIndex = this.currentPage * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.displayedArchetypes.length);
        const pageArchetypes = this.displayedArchetypes.slice(startIndex, endIndex);

        if (pageArchetypes.length === 0 && this.currentPage === 0) {
            grid.innerHTML = '<p class="text-center text-xl col-span-full text-gray-400">No archetypes found matching your search.</p>';
            loadMoreContainer.classList.add('hidden');
            return;
        }

        // Use document fragment for efficient DOM updates
        const fragment = document.createDocumentFragment();
        
        pageArchetypes.forEach((archetype, index) => {
            const cardElement = this.createArchetypeCard(archetype, startIndex + index);
            fragment.appendChild(cardElement);
        });
        
        grid.appendChild(fragment);

        // Show/hide load more button
        if (endIndex < this.displayedArchetypes.length) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }

        grid.classList.remove('hidden');
        this.currentPage++;
        
        // Lazy load icons for better performance
        this.lazyLoadIcons();
    }

    createArchetypeCard(archetype, index) {
        const card = document.createElement('a');
        card.href = archetype.filepath;
        card.className = 'card p-6 text-center block';
        card.setAttribute('data-index', index);
        
        // Create icon container with placeholder initially
        const iconContainer = document.createElement('div');
        iconContainer.className = 'card-image';
        iconContainer.setAttribute('data-archetype-name', archetype.name);
        
        // Show a loading placeholder initially
        iconContainer.innerHTML = `
            <div class="icon-loading bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        `;

        const title = document.createElement('h2');
        title.className = 'text-2xl font-bold text-gray-100 mb-2';
        title.textContent = archetype.name;

        const description = document.createElement('p');
        description.className = 'text-gray-400';
        description.textContent = archetype.description;

        card.appendChild(iconContainer);
        card.appendChild(title);
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
                // Use Intersection Observer for efficient lazy loading
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // Replace loading placeholder with actual icon
                            setTimeout(() => {
                                iconContainer.innerHTML = archetype.icon;
                            }, Math.random() * 200); // Stagger loading for smoother experience
                            observer.unobserve(entry.target);
                        }
                    });
                }, { 
                    threshold: 0.1,
                    rootMargin: '50px' // Start loading slightly before coming into view
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
        
        // Add a small delay to prevent rapid firing and show loading state
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
        
        // If user is searching and not already on "All", switch to "All" filter
        if (this.searchQuery.trim() !== '' && this.alphabetFilter !== 'all') {
            this.alphabetFilter = 'all';
            this.saveAlphabetFilter('all');
            
            // Update active button visually
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

    // Utility function for debouncing search
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

    // Scroll position memory functionality
    setupScrollMemory() {
        // Save scroll position and alphabet filter before page unload
        window.addEventListener('beforeunload', () => {
            this.saveScrollPosition();
            this.saveAlphabetFilter(this.alphabetFilter);
        });

        // Save scroll position periodically while scrolling
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.saveScrollPosition();
            }, 100); // Debounced to avoid excessive saves
        });

        // Handle browser back/forward navigation
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
            // Fallback for private browsing or storage issues
            this.scrollPosition = scrollY;
        }
    }

    restoreScrollPosition() {
        try {
            const savedPosition = localStorage.getItem(this.scrollRestoreKey);
            if (savedPosition !== null) {
                const scrollY = parseInt(savedPosition, 10);
                if (!isNaN(scrollY)) {
                    // Use requestAnimationFrame to ensure the page is fully rendered
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            window.scrollTo({
                                top: scrollY,
                                behavior: 'smooth'
                            });
                        }, 200); // Small delay to ensure content is loaded
                    });
                }
            }
        } catch (e) {
            // Fallback for private browsing or storage issues
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
        } catch (e) {
            // Ignore errors
        }
        this.scrollPosition = 0;
    }

    // Alphabet filtering functionality
    handleAlphabetFilter(letter) {
        this.alphabetFilter = letter;
        this.saveAlphabetFilter(letter);
        this.filterAndSort();
        this.displayArchetypes(true);
        
        // Update active button
        document.querySelectorAll('.alphabet-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-letter="${letter}"]`).classList.add('active');
        
        // Clear search when using alphabet filter (optional)
        if (letter !== 'all') {
            document.getElementById('search-input').value = '';
            this.searchQuery = '';
        }
    }

    updateAlphabetButtons() {
        // Get available letters from current archetypes
        const availableLetters = new Set();
        this.archetypes.forEach(archetype => {
            const firstLetter = archetype.name.charAt(0).toLowerCase();
            availableLetters.add(firstLetter);
        });

        // Update button states
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

    // Alphabet filter memory functionality
    saveAlphabetFilter(letter) {
        try {
            localStorage.setItem(this.alphabetRestoreKey, letter);
        } catch (e) {
            // Fallback for private browsing or storage issues
            // Could use sessionStorage as fallback if needed
        }
    }

    restoreAlphabetFilter() {
        try {
            const savedLetter = localStorage.getItem(this.alphabetRestoreKey);
            if (savedLetter !== null) {
                this.alphabetFilter = savedLetter;
                
                // Update active button state
                requestAnimationFrame(() => {
                    document.querySelectorAll('.alphabet-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    const targetBtn = document.querySelector(`[data-letter="${savedLetter}"]`);
                    if (targetBtn) {
                        targetBtn.classList.add('active');
                    }
                });
                
                // Apply the filter
                this.filterAndSort();
            }
        } catch (e) {
            // Fallback to default if restoration fails
            this.alphabetFilter = 'all';
        }
    }

    // Search query memory functionality
    saveSearchQuery(query) {
        try {
            localStorage.setItem(this.searchRestoreKey, query);
        } catch (e) {
            // Fallback for private browsing or storage issues
        }
    }

    restoreSearchQuery() {
        try {
            const savedQuery = localStorage.getItem(this.searchRestoreKey);
            if (savedQuery !== null) {
                this.searchQuery = savedQuery;
                
                // Update search input field
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = savedQuery;
                }
                
                // Apply the search filter
                this.filterAndSort();
            }
        } catch (e) {
            // Fallback to default if restoration fails
            this.searchQuery = '';
        }
    }

    clearSearchQuery() {
        try {
            localStorage.removeItem(this.searchRestoreKey);
        } catch (e) {
            // Ignore errors
        }
        this.searchQuery = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    clearAlphabetFilter() {
        try {
            localStorage.removeItem(this.alphabetRestoreKey);
        } catch (e) {
            // Ignore errors
        }
        this.alphabetFilter = 'all';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    new ArchetypeLoader();
});