#!/usr/bin/env node

/**
 * Generate sitemap.xml from archetypes-data.js
 * 
 * This script reads the archetypes data and creates a sitemap.xml file
 * in the root directory with all archetype pages and the main index page.
 * 
 * Usage:
 *   node scripts/generate-sitemap.js
 *   # Or with custom domain:
 *   SITE_URL=https://yourdomain.com node scripts/generate-sitemap.js
 * 
 * The script will:
 * - Read all archetypes from assets/js/archetypes-data.js
 * - Generate a sitemap.xml with 489 URLs (1 index + 488 archetype pages)
 * - Use actual release dates when available (latestReleaseDate field)
 * - Properly encode URLs (spaces and special characters)
 * - Place the sitemap.xml in the root directory
 * 
 * Configuration:
 * - SITE_URL environment variable: Set your actual domain (default: https://example.com)
 */

const fs = require('fs');
const path = require('path');

// Load the archetypes data directly
const archetypesPath = path.join(__dirname, '../assets/js/archetypes-data.js');

// Require the module directly instead of using eval
// This is safer and more reliable
delete require.cache[require.resolve(archetypesPath)]; // Clear cache to allow re-runs
const archetypes = require(archetypesPath);

console.log(`Found ${archetypes.length} archetypes`);

// Base URL - configurable via environment variable or defaults to placeholder
// Usage: SITE_URL=https://yourdomain.com node scripts/generate-sitemap.js
const baseUrl = process.env.SITE_URL || 'https://example.com';

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

// Add all archetype pages (with deduplication)
const processedPaths = new Set();
let duplicateCount = 0;

archetypes.forEach((archetype) => {
    if (archetype.filepath) {
        // Skip duplicates
        if (processedPaths.has(archetype.filepath)) {
            duplicateCount++;
            return;
        }
        processedPaths.add(archetype.filepath);
        
        // Construct the URL from the filepath and encode it properly
        // encodeURI preserves slashes and encodes spaces and special characters
        const encodedPath = archetype.filepath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const url = `${baseUrl}/${encodedPath}`;
        
        // Use the latest release date if available, otherwise use a default
        // Validate that it looks like a date (YYYY-MM-DD format)
        let lastmod = currentDate;
        if (archetype.latestReleaseDate && /^\d{4}-\d{2}-\d{2}$/.test(archetype.latestReleaseDate)) {
            lastmod = archetype.latestReleaseDate;
        }
        
        sitemapXml += `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
});

if (duplicateCount > 0) {
    console.log(`⚠ Skipped ${duplicateCount} duplicate archetype(s)`);
}

// Close the urlset
sitemapXml += `</urlset>
`;

// Write the sitemap to the root directory
const sitemapPath = path.join(__dirname, '../sitemap.xml');
fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');

console.log(`✓ Sitemap generated successfully at: ${sitemapPath}`);
console.log(`✓ Total URLs: ${processedPaths.size + 1} (1 index + ${processedPaths.size} unique archetype pages)`);
