/**
 * convert-to-deck-dock.js — replace a page's pasted resource/synergy bar with
 * the <div id="deck-dock"></div> placeholder rendered by assets/js/deck-dock.js,
 * and add that script to <head>.
 *
 *   node scripts/convert-to-deck-dock.js [--write] <page.html>...
 *
 * Without --write it only reports what it would do.
 *
 * Handles two shapes:
 *   - The sidebar <nav> (parent of #deck-resources-compact). Converted only if
 *     it matches deck-dock.js's markup exactly (ignoring whitespace/comments),
 *     either the default bar or one of its themes — so page-specific tweaks
 *     are never silently dropped. Anything else is reported and skipped.
 *   - The old inline dock (a <div> wrapper with .synergy-dock-btn), as still
 *     found in older drafts: the wrapper directly inside .container is
 *     replaced, and the page gets the default bar.
 *
 * Edits are spliced into the original source by offset, so the rest of the
 * file keeps its exact formatting.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cheerio = require('cheerio');

const write = process.argv.includes('--write');
const files = process.argv.slice(2).filter(a => a !== '--write');
const DOCK_COMMENT = /dock|deck resources|sidebar|synergy/i;

// Load window.DeckDock from the real script so markup/themes can't drift.
function loadDeckDock() {
    const src = fs.readFileSync(path.join(__dirname, '../assets/js/deck-dock.js'), 'utf8');
    const sandbox = { window: {}, document: { readyState: 'loading', addEventListener() {} }, console };
    vm.runInNewContext(src, sandbox);
    return sandbox.window.DeckDock;
}

function normalize(html) {
    const $ = cheerio.load(html, null, false);
    $('*').contents().filter((_, n) => n.type === 'comment').remove();
    return $.html().replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

const DeckDock = loadDeckDock();
const known = [undefined, ...DeckDock.themes].map(theme => ({ theme, markup: normalize(DeckDock.markup(theme)) }));

for (const file of files) {
    let src = fs.readFileSync(file, 'utf8');
    const bom = src.startsWith('﻿') ? '﻿' : '';
    if (bom) src = src.slice(1);
    const $ = cheerio.load(src, { sourceCodeLocationInfo: true });

    const res = $('#deck-resources-compact');
    const wrap = $('#synergy-dock-wrap');
    if (res.length !== 1 || wrap.length !== 1) {
        console.log(`SKIP ${file}: expected one #deck-resources-compact and #synergy-dock-wrap, found ${res.length}/${wrap.length}`);
        continue;
    }

    let target, theme;
    const nav = res.parent('nav');
    if (nav.length) {
        const match = known.find(k => k.markup === normalize($.html(nav)));
        if (!match) {
            console.log(`SKIP ${file}: sidebar <nav> differs from deck-dock.js markup (add a theme or update the page by hand)`);
            continue;
        }
        target = nav[0];
        theme = match.theme;
    } else {
        const ancestors = new Set();
        for (let n = res[0]; n; n = n.parent) ancestors.add(n);
        let n = wrap[0];
        while (!ancestors.has(n)) n = n.parent;
        while (n.parent && !/\bcontainer\b/.test(n.parent.attribs?.class || '')) n = n.parent;
        if (!n.parent || n.name === 'body') {
            console.log(`SKIP ${file}: old dock is not inside a .container`);
            continue;
        }
        target = n;
    }

    let start = target.sourceCodeLocation.startOffset;
    const end = target.sourceCodeLocation.endOffset;
    // Swallow directly preceding dock-related comments.
    for (;;) {
        const before = src.slice(0, start).replace(/\s+$/, '');
        if (!before.endsWith('-->')) break;
        const open = before.lastIndexOf('<!--');
        if (open < 0 || !DOCK_COMMENT.test(before.slice(open))) break;
        start = open;
    }
    const lineStart = src.lastIndexOf('\n', start - 1) + 1;
    if (/^[ \t]*$/.test(src.slice(lineStart, start))) start = lineStart;

    const nl = src.includes('\r\n') ? '\r\n' : '\n';
    const placeholder = theme ? `<div id="deck-dock" data-dock-theme="${theme}"></div>` : '<div id="deck-dock"></div>';
    let out = src.slice(0, start) + '        ' + placeholder + src.slice(end);

    if (!out.includes('deck-dock.js')) {
        const anchor = out.match(/([ \t]*)<script src="\.\.\/assets\/js\/synergy-tags\.js"><\/script>/)
            || out.match(/([ \t]*)<script src="\.\.\/assets\/js\/page-sections\.js"><\/script>/);
        if (!anchor) {
            console.log(`SKIP ${file}: no synergy-tags.js or page-sections.js <script> to place deck-dock.js before`);
            continue;
        }
        out = out.replace(anchor[0], `${anchor[1]}<script src="../assets/js/deck-dock.js" defer></script>${nl}${anchor[0]}`);
    }

    const removed = src.slice(start, end).split('\n').length;
    console.log(`${write ? 'WROTE' : 'DRY  '} ${file}: -${removed} lines, ${placeholder}`);
    if (write) fs.writeFileSync(file, bom + out);
}
