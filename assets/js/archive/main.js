// Main application functionality
function renderArchetypes(archetypeList) {
    const grid = document.getElementById('archetype-grid');
    grid.innerHTML = ''; // Clear existing cards
    
    archetypeList.forEach(archetype => {
        const cardHtml = `
            <a href="${archetype.filepath}" class="card p-6 text-center block">
                <div class="card-image">
                    ${archetype.icon}
                </div>
                <h2 class="text-2xl font-bold text-gray-100 mb-2">${archetype.name}</h2>
                <p class="text-gray-400">${archetype.description}</p>
            </a>
        `;
        grid.innerHTML += cardHtml;
    });
}

function filterAndSortArchetypes() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-by').value;
    const counter = document.getElementById('archetype-counter');
    const grid = document.getElementById('archetype-grid');
    
    let filteredArchetypes = archetypes.filter(archetype => 
        archetype.name.toLowerCase().includes(searchQuery)
    );

    counter.textContent = `Displaying ${filteredArchetypes.length} of ${archetypes.length} total archetypes.`;

    if (filteredArchetypes.length === 0) {
        grid.innerHTML = '<p class="text-center text-xl col-span-full text-gray-400">No archetypes found matching your search.</p>';
        return;
    }

    if (sortBy === 'az') {
        filteredArchetypes.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'za') {
        filteredArchetypes.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    renderArchetypes(filteredArchetypes);
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners
    document.getElementById('search-input').addEventListener('keyup', filterAndSortArchetypes);
    document.getElementById('sort-by').addEventListener('change', filterAndSortArchetypes);

    // Initial render
    filterAndSortArchetypes();
});