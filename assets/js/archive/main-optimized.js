// Optimized main application functionality with lazy loading
class ArchetypeLoader {
    constructor() {
        this.archetypes = [];
        this.displayedArchetypes = [];
        this.currentPage = 0;
        this.pageSize = 24; // Show 24 archetypes per page
        this.isLoading = false;
        this.searchQuery = '';
        this.sortBy = 'az';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadArchetypes();
        this.hideLoading();
        this.displayArchetypes();
    }

    setupEventListeners() {
        document.getElementById('search-input').addEventListener('keyup', 
            this.debounce(() => this.handleSearch(), 300));
        document.getElementById('sort-by').addEventListener('change', () => this.handleSort());
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMore());
        
        // Infinite scroll option
        window.addEventListener('scroll', this.debounce(() => this.handleScroll(), 100));
    }

    async loadArchetypes() {
        try {
            this.showLoading();
            
            // Create a script element to load the data asynchronously
            const script = document.createElement('script');
            script.src = 'assets/js/archetypes-data.js';
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    // Data is now available in the global 'archetypes' variable
                    if (typeof archetypes !== 'undefined') {
                        this.archetypes = archetypes;
                        this.filterAndSort();
                        resolve();
                    } else {
                        reject(new Error('Archetype data not loaded'));
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('Error loading archetypes:', error);
            this.showError('Failed to load archetype data');
        }
    }

    filterAndSort() {
        // Filter by search query
        let filtered = this.archetypes.filter(archetype => 
            archetype.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );

        // Sort
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

        // Render archetypes with optimized icons
        pageArchetypes.forEach(archetype => {
            const cardElement = this.createArchetypeCard(archetype);
            grid.appendChild(cardElement);
        });

        // Show/hide load more button
        if (endIndex < this.displayedArchetypes.length) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }

        // Show the grid if it was hidden
        grid.classList.remove('hidden');
        this.currentPage++;
    }

    createArchetypeCard(archetype) {
        const card = document.createElement('a');
        card.href = archetype.filepath;
        card.className = 'card p-6 text-center block';
        
        // Create a placeholder for lazy-loaded icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'card-image';
        iconContainer.innerHTML = `
            <div class="icon-placeholder bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span class="text-gray-400 text-sm">${archetype.name.charAt(0)}</span>
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

        // Lazy load the actual icon when card comes into view
        this.lazyLoadIcon(iconContainer, archetype.icon);

        return card;
    }

    lazyLoadIcon(container, iconSvg) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Replace placeholder with actual icon
                    container.innerHTML = iconSvg;
                    observer.unobserve(container);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(container);
    }

    loadMore() {
        this.displayArchetypes(false);
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

    handleScroll() {
        // Auto-load more when near bottom (optional infinite scroll)
        const threshold = 200;
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (!loadMoreBtn.classList.contains('hidden') && !this.isLoading) {
                this.loadMore();
            }
        }
    }

    updateCounter() {
        const counter = document.getElementById('archetype-counter');
        const totalDisplayed = Math.min(this.currentPage * this.pageSize, this.displayedArchetypes.length);
        counter.textContent = `Showing ${totalDisplayed} of ${this.displayedArchetypes.length} archetypes (${this.archetypes.length} total)`;
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

    // Utility function for debouncing
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
document.addEventListener('DOMContentLoaded', () => {
    new ArchetypeLoader();
});