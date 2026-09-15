/**
 * Fleet-wide smoke test for page-sections.js — the automated regression
 * coverage this feature never had. Every bug found in this whole build (the
 * CardLoader race condition, four different image-container naming
 * conventions, a blank preview, a broken layout, a heading-detection gap)
 * was caught by a human clicking around and sending a screenshot. This
 * loads every wired archetype page in a real headless browser, the same way
 * a visitor would, and flags what a human would otherwise have to notice by
 * eye:
 *   - Uncaught JS exceptions or console errors during/after page load
 *   - Combo-shaped content that produced zero discovered .cms-section blocks
 *     (a possible new markup shape auto-discovery doesn't handle yet)
 *   - .cms-section blocks that didn't get a [suggest edit]/[history] toolbar
 *   - Card-image slots (inside a combo-step-card) that never got a real
 *     <img> — the exact failure mode of the race condition this caught
 *
 * This does NOT replace manual spot-checking (it can't judge whether text
 * READS correctly, only whether the page functioned without erroring), but
 * it turns "did we break something on one of the other 500 pages" from a
 * question nobody can answer into one that takes a few minutes to check.
 *
 * Usage:
 *   node scripts/smoke-test-pages.js                  # all wired pages
 *   node scripts/smoke-test-pages.js --limit=20        # first 20, for a quick check
 *   node scripts/smoke-test-pages.js --only="Drytron Deck Analysis.html,Azamina Deck Analysis.html"
 *   node scripts/smoke-test-pages.js --concurrency=10  # default 6
 *
 * Requires: `npm install --save-dev playwright` + `npx playwright install chromium` (already done).
 * Starts its own static file server — doesn't depend on a manually-started dev server.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'pages');
const PORT = 5959;

const args = process.argv.slice(2);
const getArg = (name, def) => {
    const a = args.find(a => a.startsWith(`--${name}=`));
    return a ? a.slice(name.length + 3) : def;
};
const LIMIT = parseInt(getArg('limit', '0'), 10) || Infinity;
const CONCURRENCY = parseInt(getArg('concurrency', '6'), 10);
const ONLY = getArg('only', null)?.split(',').map(s => s.trim());
const NAV_TIMEOUT_MS = 20000;
const SETTLE_WAIT_MS = 1200; // extra time after networkidle for our own background fetches (alt-combo tabs, debounced image loads) to land

// ----------------------------------------------------------------------------
// Minimal static file server — no new dependency, just enough to serve the
// repo root over http:// so relative script/asset paths resolve exactly like
// they do in a real browser visit (file:// has enough quirks around fetch/
// module loading that it's not a faithful stand-in).
// ----------------------------------------------------------------------------
const MIME = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let urlPath = decodeURIComponent(req.url.split('?')[0]);
            const filePath = path.join(ROOT, urlPath);
            if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
            fs.readFile(filePath, (err, data) => {
                if (err) { res.writeHead(404); res.end('Not found'); return; }
                res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
                res.end(data);
            });
        });
        server.listen(PORT, () => resolve(server));
    });
}

// ----------------------------------------------------------------------------
// Per-page check
// ----------------------------------------------------------------------------
async function checkPage(browser, filename) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
    });
    page.on('pageerror', err => {
        pageErrors.push(String(err.message || err).slice(0, 300));
    });

    const url = `http://localhost:${PORT}/pages/${encodeURIComponent(filename)}`;
    const result = { filename, url, ok: true, issues: [], stats: {} };

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT_MS });
        await page.waitForTimeout(SETTLE_WAIT_MS);

        const stats = await page.evaluate(() => {
            const sections = [...document.querySelectorAll('.cms-section[data-section-key]')];
            const toolbars = document.querySelectorAll('.pcs-toolbar, .pcs-combo-tabbar').length;
            const comboStepCards = document.querySelectorAll('.combo-step-card').length;
            const imgContainers = [...document.querySelectorAll('[class*="card-image-container"], [class*="card-placeholder"], [id$="-img-container"]')];
            const imgContainersInsideSteps = imgContainers.filter(el => el.closest('.combo-step-card'));
            const imgContainersMissingImg = imgContainersInsideSteps.filter(el => !el.querySelector('img'));
            return {
                sectionCount: sections.length,
                sectionKeys: sections.map(s => s.dataset.sectionKey),
                toolbarCount: toolbars,
                comboStepCardCount: comboStepCards,
                imgContainersInStepsCount: imgContainersInsideSteps.length,
                imgContainersMissingImgCount: imgContainersMissingImg.length,
                imgContainersMissingImgIds: imgContainersMissingImg.map(el => el.id).filter(Boolean).slice(0, 10),
                hasPageSections: typeof window.initPageSections === 'function',
            };
        });
        result.stats = stats;

        if (!stats.hasPageSections) {
            result.ok = false;
            result.issues.push('initPageSections is not defined — page-sections.js failed to load or execute');
        }
        if (pageErrors.length) {
            result.ok = false;
            result.issues.push(...pageErrors.map(e => `Uncaught error: ${e}`));
        }
        if (consoleErrors.length) {
            // A warning, not a hard fail: a console.error on a page can come
            // from anything the page loads (confirmed on Buster Blader —
            // db.ygoprodeck.com returning 400 for its archetype tag, part of
            // the site's unrelated pre-existing card-browser feature, not
            // page-sections.js). Treating every console error as a smoke-test
            // failure would bury real page-sections.js regressions in noise
            // from pre-existing issues across the fleet. Still recorded, just
            // doesn't flip `ok` — the checks below that are actually specific
            // to this feature's own behavior are what set ok=false.
            result.issues.push(...consoleErrors.map(e => `Console error (may be pre-existing/unrelated — verify before treating as a page-sections.js bug): ${e}`));
        }
        if (stats.sectionCount > 0 && stats.toolbarCount < stats.sectionCount) {
            result.ok = false;
            result.issues.push(`${stats.sectionCount} section(s) discovered but only ${stats.toolbarCount} toolbar(s) rendered`);
        }
        if (stats.comboStepCardCount > 0 && stats.imgContainersInStepsCount > 0 && stats.imgContainersMissingImgCount === stats.imgContainersInStepsCount) {
            // ALL image slots in combo steps missing an <img> is a much stronger signal
            // than SOME missing (which can legitimately happen for an unresolvable card
            // name in the original AI content, not something our code caused).
            result.issues.push(`WARNING: all ${stats.imgContainersMissingImgCount} card image slot(s) in combo steps have no <img> — possible load failure, not just an unresolvable name`);
        } else if (stats.imgContainersMissingImgCount > 0) {
            result.issues.push(`Note: ${stats.imgContainersMissingImgCount}/${stats.imgContainersInStepsCount} card image slot(s) in combo steps have no <img> (ids: ${stats.imgContainersMissingImgIds.join(', ') || 'n/a'})`);
        }
    } catch (e) {
        result.ok = false;
        result.issues.push(`Navigation/evaluation failed: ${e.message}`);
    } finally {
        await context.close();
    }

    return result;
}

// ----------------------------------------------------------------------------
// Runner with bounded concurrency
// ----------------------------------------------------------------------------
async function runPool(items, worker, concurrency) {
    const results = [];
    let i = 0;
    async function next() {
        while (i < items.length) {
            const idx = i++;
            results[idx] = await worker(items[idx], idx);
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
    return results;
}

async function main() {
    let files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
    // Only pages that actually call initPageSections — matches what
    // rollout-page-sections.js wires up, skipping Admin/Banlist/etc.
    files = files.filter(f => fs.readFileSync(path.join(PAGES_DIR, f), 'utf8').includes('initPageSections('));
    if (ONLY) files = files.filter(f => ONLY.includes(f));
    if (LIMIT < files.length) files = files.slice(0, LIMIT);

    console.log(`Smoke-testing ${files.length} page(s) at concurrency ${CONCURRENCY}...\n`);

    const server = await startServer();
    const browser = await chromium.launch();

    const startedAt = Date.now();
    let done = 0;
    const results = await runPool(files, async (filename) => {
        const r = await checkPage(browser, filename);
        done++;
        if (!r.ok) console.log(`FAIL  [${done}/${files.length}] ${filename}`);
        else if (r.issues.length) console.log(`WARN  [${done}/${files.length}] ${filename}`);
        else if (done % 25 === 0) console.log(`ok    [${done}/${files.length}] ...`);
        return r;
    }, CONCURRENCY);
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

    await browser.close();
    server.close();

    const failed = results.filter(r => !r.ok);
    const warned = results.filter(r => r.ok && r.issues.length);
    const clean = results.filter(r => r.ok && !r.issues.length);

    console.log(`\n--- Summary (${elapsedSec}s) ---`);
    console.log(`Clean: ${clean.length}`);
    console.log(`Warnings only: ${warned.length}`);
    console.log(`Failed: ${failed.length}`);

    if (failed.length) {
        console.log(`\n--- Failures ---`);
        failed.forEach(r => {
            console.log(`\n${r.filename}`);
            r.issues.forEach(i => console.log(`  - ${i}`));
        });
    }

    const reportPath = path.join(ROOT, 'scripts', 'smoke-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), elapsedSec, totalPages: files.length, failed: failed.length, warned: warned.length, clean: clean.length, results }, null, 2));
    console.log(`\nFull report written to ${reportPath}`);

    process.exit(failed.length ? 1 : 0);
}

main().catch(e => {
    console.error('Smoke test crashed:', e);
    process.exit(1);
});
