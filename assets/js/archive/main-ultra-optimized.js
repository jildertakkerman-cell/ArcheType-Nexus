// Ultra-optimized main application with progressive loading
class ArchetypeLoader {
    constructor() {
        this.archetypes = [];
        this.fullDataLoaded = false;
        this.iconCache = new Map();
        this.displayedArchetypes = [];
        this.currentPage = 0;
        this.pageSize = 20; // Reduced for faster rendering
        this.isLoading = false;
        this.searchQuery = '';
        this.sortBy = 'az';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadLightweightData();
        this.hideLoading();
        this.displayArchetypes();
        
        // Load full data in background
        this.loadFullDataInBackground();
    }

    setupEventListeners() {
        document.getElementById('search-input').addEventListener('keyup', 
            this.debounce(() => this.handleSearch(), 300));
        document.getElementById('sort-by').addEventListener('change', () => this.handleSort());
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMore());
        
        // Intersection observer for infinite scroll
        this.setupInfiniteScroll();
    }

    async loadLightweightData() {
        try {
            this.showLoading();
            
            const script = document.createElement('script');
            script.src = 'assets/js/archetypes-light.js';
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    if (typeof archetypesLight !== 'undefined') {
                        this.archetypes = archetypesLight.map(arch => ({
                            ...arch,
                            icon: this.createPlaceholderIcon(arch.name)
                        }));
                        this.filterAndSort();
                        resolve();
                    } else {
                        reject(new Error('Light archetype data not loaded'));
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('Error loading light data:', error);
            this.showError('Failed to load archetype data');
        }
    }

    async loadFullDataInBackground() {
        try {
            // Load full data silently in background
            const script = document.createElement('script');
            script.src = 'assets/js/archetypes-data.js';
            
            script.onload = () => {
                if (typeof archetypes !== 'undefined') {
                    // Merge full data with lightweight data
                    this.mergeFullData(archetypes);
                    this.fullDataLoaded = true;
                    console.log('✅ Full archetype data loaded in background');
                }
            };
            
            document.head.appendChild(script);
        } catch (error) {
            console.warn('Background loading failed:', error);
        }
    }

    mergeFullData(fullArchetypes) {
        // Update existing archetypes with full SVG icons
        this.archetypes = this.archetypes.map(lightArch => {
            const fullArch = fullArchetypes.find(f => f.name === lightArch.name);
            if (fullArch) {
                return {
                    ...lightArch,
                    icon: fullArch.icon,
                    iconLoaded: true
                };
            }
            return lightArch;
        });

        // Update any currently displayed cards
        this.updateDisplayedIcons();
    }

    updateDisplayedIcons() {
        const cards = document.querySelectorAll('.card .card-image');
        cards.forEach((iconContainer, index) => {
            const archetype = this.archetypes[index];
            if (archetype && archetype.iconLoaded) {
                iconContainer.innerHTML = archetype.icon;
            }
        });
    }

    createPlaceholderIcon(name) {
        const colors = [
            ['#7b2cbf', '#3c096c'], ['#f72585', '#b5179e'], ['#4361ee', '#3f37c9'],
            ['#f77f00', '#fcbf49'], ['#06ffa5', '#029e47'], ['#ff006e', '#8338ec'],
            ['#fb8500', '#ffb703'], ['#219ebc', '#023047'], ['#8b5cf6', '#7c3aed']
        ];
        
        const colorIndex = name.charCodeAt(0) % colors.length;
        const [primary, secondary] = colors[colorIndex];
        
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="grad-${name.replace(/\s+/g, '')}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:${primary};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${secondary};stop-opacity:1" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-${name.replace(/\s+/g, '')})" stroke="${primary}" stroke-width="2"/>
            <text x="50" y="55" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">${name.charAt(0)}</text>
        </svg>`;
    }

    filterAndSort() {
        let filtered = this.archetypes.filter(archetype => 
            archetype.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );

        if (this.sortBy === 'az') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === 'za') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        }

        this.displayedArchetypes = filtered;
        this.updateCounter();
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

        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        pageArchetypes.forEach(archetype => {
            const cardElement = this.createArchetypeCard(archetype);
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
    }

    createArchetypeCard(archetype) {
        const card = document.createElement('a');
        card.href = archetype.filepath;
        card.className = 'card p-6 text-center block';
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'card-image';
        iconContainer.innerHTML = archetype.icon;

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

    setupInfiniteScroll() {
        const loadMoreContainer = document.getElementById('load-more-container');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadMore();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(loadMoreContainer);
    }

    loadMore() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        // Add slight delay to prevent rapid firing
        setTimeout(() => {
            this.displayArchetypes(false);
            this.isLoading = false;
        }, 100);
    }

    handleSearch() {
        this.searchQuery = document.getElementById('search-input').value;
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
        const totalDisplayed = Math.min((this.currentPage + 1) * this.pageSize, this.displayedArchetypes.length);
        const actualDisplayed = Math.min(this.currentPage * this.pageSize, this.displayedArchetypes.length);
        
        counter.textContent = `Showing ${actualDisplayed} of ${this.displayedArchetypes.length} archetypes (${this.archetypes.length} total)`;
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
        grid.innerHTML = `<p class="text-center text-xl col-span-full text-red-400">${message}</p>`;
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    new ArchetypeLoader();
});