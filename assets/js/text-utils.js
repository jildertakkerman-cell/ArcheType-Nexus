/**
 * text-utils.js — shared helpers for safely rendering user-submitted text.
 * Load before any script that interpolates user text into innerHTML
 * (synergy-tags.js, community-combos.js).
 */
window.escapeHtml = function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
