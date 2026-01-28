/**
 * Updates Loader Module
 * Handles loading and rendering website updates for both index page and updates page
 * Includes support for CardLoader integration for displaying featured cards
 */

class UpdatesLoader {
    constructor(options = {}) {
        this.dataPath = options.dataPath || 'assets/data/updates.json';
        this.updates = [];
        this.filteredUpdates = [];
        this.currentFilter = 'all';
        this.basePath = options.basePath || ''; // For relative paths on subpages
    }

    /**
     * Fetch updates from JSON file
     */
    async loadUpdates() {
        try {
            const response = await fetch(this.dataPath);
            if (!response.ok) {
                throw new Error(`Failed to load updates: ${response.status}`);
            }
            const data = await response.json();
            this.updates = data.updates || [];
            this.filteredUpdates = [...this.updates];
            return this.updates;
        } catch (error) {
            console.error('Error loading updates:', error);
            return [];
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Get relative date string (e.g., "Today", "Yesterday", "3 days ago")
     */
    getRelativeDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        }
        return this.formatDate(dateStr);
    }

    /**
     * Get icon for update type
     */
    getTypeIcon(type) {
        const icons = {
            'new_content': 'fa-plus-circle',
            'update': 'fa-pen',
            'feature': 'fa-star',
            'bugfix': 'fa-wrench'
        };
        return icons[type] || 'fa-circle';
    }

    /**
     * Get label for update type
     */
    getTypeLabel(type) {
        const labels = {
            'new_content': 'New Content',
            'update': 'Update',
            'feature': 'Feature',
            'bugfix': 'Bug Fix'
        };
        return labels[type] || type;
    }

    /**
     * Create HTML for a single update card (compact version for index)
     */
    createUpdateCardHTML(update) {
        const icon = update.icon || this.getTypeIcon(update.type);
        const relativeDate = this.getRelativeDate(update.date);
        const linkPath = update.link ? this.basePath + update.link : '';
        const titleContent = linkPath
            ? `<a href="${linkPath}" class="update-link">${update.title}</a>`
            : update.title;

        return `
            <div class="update-card" data-type="${update.type}">
                <div class="update-type-badge ${update.type}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="update-content">
                    <h4 class="update-title">${titleContent}</h4>
                    <p class="update-description">${update.description}</p>
                </div>
                <span class="update-date">${relativeDate}</span>
            </div>
        `;
    }

    /**
     * Create HTML for a single update card (full version for updates page)
     * Includes featured card display if available
     */
    createUpdateCardFullHTML(update) {
        const icon = update.icon || this.getTypeIcon(update.type);
        const formattedDate = this.formatDate(update.date);
        const linkPath = update.link ? this.basePath + update.link : '';
        const titleContent = linkPath
            ? `<a href="${linkPath}" class="update-link">${update.title}</a>`
            : update.title;

        // Featured card HTML - using CardLoader's data-card-name attribute
        let featuredCardHTML = '';
        if (update.featuredCard) {
            const cardId = `card-${update.id}`;
            featuredCardHTML = `
                <div class="featured-card-container">
                    <div id="${cardId}" class="featured-card" data-card-name="${update.featuredCard}">
                        <div class="card-loading">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                    </div>
                </div>
            `;
        }

        // Read more link
        const readMoreHTML = linkPath
            ? `<a href="${linkPath}" class="read-more-link"><i class="fas fa-arrow-right"></i> Read Full Analysis</a>`
            : '';

        // Card names HTML
        let cardNamesHTML = '';

        if (update.newCards && update.newCards.length > 0) {
            const cardBadges = update.newCards.map(name =>
                `<span class="card-name-badge" data-card-name="${name}" onclick="if(CardLoader && CardLoader.showPopupByName) CardLoader.showPopupByName('${name.replace(/'/g, "\\'")}', event)">${name}</span>`
            ).join('');

            cardNamesHTML = `
                <div class="new-cards-box">
                    <div class="new-cards-header">
                        <i class="fas fa-layer-group"></i> New Cards
                    </div>
                    <div class="card-names-list">
                        ${cardBadges}
                    </div>
                </div>
            `;
        }

        return `
            <div class="update-card-full" data-type="${update.type}">
                <div class="update-type-badge ${update.type}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="update-content">
                    <div class="update-header-row">
                        <h4 class="update-title">${titleContent}</h4>
                        <span class="update-date">${formattedDate}</span>
                    </div>
                    <p class="update-description">${update.description}</p>
                    ${cardNamesHTML}
                    ${readMoreHTML}
                </div>
                ${featuredCardHTML}
            </div>
        `;
    }

    /**
     * Render updates on the index page (limited number)
     */
    renderIndexUpdates(containerId, limit = 5) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container #${containerId} not found`);
            return;
        }

        const updatesToShow = this.updates.slice(0, limit);

        if (updatesToShow.length === 0) {
            container.innerHTML = '<p class="no-updates">No updates yet.</p>';
            return;
        }

        container.innerHTML = updatesToShow.map(u => this.createUpdateCardHTML(u)).join('');
    }

    /**
     * Render all updates on the updates page
     */
    renderAllUpdates(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container #${containerId} not found`);
            return;
        }

        const updatesToShow = this.filteredUpdates;

        if (updatesToShow.length === 0) {
            container.innerHTML = `
                <div class="no-updates">
                    <i class="fas fa-inbox"></i>
                    <p>No updates match the selected filter.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = updatesToShow.map(u => this.createUpdateCardFullHTML(u)).join('');

        // Initialize CardLoader for featured cards if available
        this.initializeCardLoader();
    }

    /**
     * Initialize CardLoader for all featured cards
     */
    initializeCardLoader() {
        // Check if CardLoader is available
        if (typeof CardLoader === 'undefined') {
            console.warn('[UpdatesLoader] CardLoader not available, skipping card images');
            return;
        }

        // Find all featured card containers
        const cardContainers = document.querySelectorAll('.featured-card[data-card-name]');

        cardContainers.forEach(container => {
            const cardName = container.dataset.cardName;
            const containerId = container.id;

            if (cardName && containerId) {
                // Use CardLoader to load the card image
                CardLoader.loadCard(cardName, containerId);
            }
        });
    }

    /**
     * Filter updates by type
     */
    filterByType(type) {
        this.currentFilter = type;
        if (type === 'all') {
            this.filteredUpdates = [...this.updates];
        } else {
            this.filteredUpdates = this.updates.filter(u => u.type === type);
        }
    }

    /**
     * Setup filter buttons on updates page
     */
    setupFilters(filterContainerId, updatesContainerId) {
        const filterContainer = document.getElementById(filterContainerId);
        if (!filterContainer) return;

        // Get unique types from updates
        const types = ['all', ...new Set(this.updates.map(u => u.type))];

        const typeIcons = {
            'all': 'fa-list',
            'new_content': 'fa-plus-circle',
            'update': 'fa-pen',
            'feature': 'fa-star',
            'bugfix': 'fa-wrench'
        };

        filterContainer.innerHTML = types.map(type => `
            <button class="filter-btn ${type === 'all' ? 'active' : ''}" data-filter="${type}">
                <i class="fas ${typeIcons[type] || 'fa-circle'}"></i>
                ${type === 'all' ? 'All' : this.getTypeLabel(type)}
            </button>
        `).join('');

        // Add click handlers
        filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Filter and re-render
                this.filterByType(btn.dataset.filter);
                this.renderAllUpdates(updatesContainerId);
            });
        });
    }

    /**
     * Setup collapsible section on index page
     */
    setupCollapsible(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const header = section.querySelector('.updates-header');
        if (!header) return;

        header.addEventListener('click', () => {
            section.classList.toggle('open');
        });

        // Open by default if there are recent updates (within 7 days)
        const hasRecentUpdates = this.updates.some(u => {
            const date = new Date(u.date);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            return diffDays < 7;
        });

        if (hasRecentUpdates) {
            section.classList.add('open');
        }
    }
}

// Export for use in both index and updates page
window.UpdatesLoader = UpdatesLoader;
