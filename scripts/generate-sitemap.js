#!/usr/bin/env node

/**
 * Generate sitemap.xml from archetypes-data.js
 * 
 * This script reads the archetypes data and creates a sitemap.xml file
 * in the root directory with all archetype pages and the main index page.
 * 
 * Usage:
 *   node scripts/generate-sitemap.js
 * 
 * The script will:
 * - Read all archetypes from assets/js/archetypes-data.js
 * - Generate a sitemap.xml with 489 URLs (1 index + 488 archetype pages)
 * - Use actual release dates when available (latestReleaseDate field)
 * - Place the sitemap.xml in the root directory
 * 
 * Note: Update the baseUrl variable with your actual domain before deploying
 */

const fs = require('fs');
const path = require('path');

// Load the archetypes data
const archetypesPath = path.join(__dirname, '../assets/js/archetypes-data.js');
const archetypesContent = fs.readFileSync(archetypesPath, 'utf8');

// Extract the archetypes array by evaluating the JS file
// We need to remove the module.exports part and extract just the array
const archetypesMatch = archetypesContent.match(/const archetypes = \[([\s\S]*?)\];/);
if (!archetypesMatch) {
    console.error('Could not find archetypes array in the file');
    process.exit(1);
}

// Create a safe evaluation context
const archetypes = eval(`[${archetypesMatch[1]}]`);

console.log(`Found ${archetypes.length} archetypes`);

// Base URL - using placeholder that can be updated
// IMPORTANT: Replace 'https://example.com' with your actual domain before deploying
// Example: const baseUrl = 'https://yourdomain.com';
const baseUrl = 'https://example.com'; // TODO: Update with actual domain

// Start building the sitemap XML
const currentDate = new Date().toISOString();

let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Auto-generated sitemap from archetypes-data.js -->
<!-- Generated on: ${currentDate} -->
<!-- To regenerate, run: node scripts/generate-sitemap.js -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Add the main index page
sitemapXml += `  <url>
    <loc>${baseUrl}/index.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

// Add all archetype pages
archetypes.forEach((archetype) => {
    if (archetype.filepath) {
        // Construct the URL from the filepath
        const url = `${baseUrl}/${archetype.filepath}`;
        
        // Use the latest release date if available, otherwise use a default
        const lastmod = archetype.latestReleaseDate || currentDate;
        
        sitemapXml += `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
});

// Close the urlset
sitemapXml += `</urlset>
`;

// Write the sitemap to the root directory
const sitemapPath = path.join(__dirname, '../sitemap.xml');
fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');

console.log(`✓ Sitemap generated successfully at: ${sitemapPath}`);
console.log(`✓ Total URLs: ${archetypes.length + 1} (1 index + ${archetypes.length} archetype pages)`);
