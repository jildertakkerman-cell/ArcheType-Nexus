// v4 checks: path folding, sticky band, lore teaser, glossary counts, flashcard size, contrast.
const path = require('path'), http = require('http'), fs = require('fs');
const ROOT = path.join(__dirname, '../../..');
const SHOTS = require('os').tmpdir();
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
const URL = 'http://localhost:8790/pages/Beginners-Guide.html';
const checks = [];
const C = (label, name, ok, info) => { checks.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} [${label}] ${name}${info !== undefined ? ' -> ' + info : ''}`); };

async function open(browser, label, viewport, { path: pathKey, fold, hash } = {}) {
    const ctx = await browser.newContext({ viewport, isMobile: label === 'mobile', hasTouch: label === 'mobile' });
    await ctx.addInitScript(([p, f]) => {
        try {
            if (p) localStorage.setItem('nb-guide-path', JSON.stringify(p));
            if (f !== undefined) localStorage.setItem('nb-guide-fold', JSON.stringify(f));
        } catch (e) { }
    }, [pathKey || null, fold]);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL + (hash || ''), { waitUntil: 'networkidle' });
    await page.waitForTimeout(hash ? 600 : 0);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.click('.cc-reject-nonessential').catch(() => { });
    await page.waitForTimeout(400);
    return { ctx, page, errors };
}

const screens = (page, h) => page.evaluate(h => +(document.documentElement.scrollHeight / h).toFixed(1), h);

async function run(browser, label, viewport) {
    // Baseline: no path chosen, nothing folds.
    let { ctx, page, errors } = await open(browser, label, viewport);
    const base = await screens(page, viewport.height);
    C(label, 'no path: nothing folded', (await page.locator('.nb-section.is-folded').count()) === 0);
    C(label, 'no path: fold note hidden', await page.$eval('.nb-fold-all', e => e.hidden));
    const readtimes = await page.$$eval('.nb-readtime', n => n.map(x => x.textContent).join(','));
    const pcsBase = await page.evaluate(() => ({ cms: document.querySelectorAll('.cms-section').length, tools: document.querySelectorAll('.pcs-tool-toolbar').length }));
    C(label, 'fold bars stay out of the suggestion system', await page.$$eval('.nb-fold', b => b.every(x => !x.querySelector('.pcs-toolbar') && !(x.previousElementSibling && x.previousElementSibling.classList.contains('pcs-tool-toolbar')))));

    // Sticky band
    await page.evaluate(() => scrollTo(0, 3000));
    await page.waitForTimeout(250);
    const stuck = await page.evaluate(() => {
        const toc = document.querySelector('.nb-toc');
        const before = getComputedStyle(toc, '::before');
        const list = document.querySelector('.nb-toc__list').getBoundingClientRect();
        const home = document.querySelector('.ygo-home-button').getBoundingClientRect();
        return { stuck: toc.classList.contains('is-stuck'), pos: before.position, h: parseFloat(before.height), listTop: Math.round(list.top), listBottom: Math.round(list.bottom), homeTop: Math.round(home.top), homeBottom: Math.round(home.bottom) };
    });
    C(label, 'bar marked stuck after scrolling', stuck.stuck);
    C(label, 'band is fixed and covers the bar', stuck.pos === 'fixed' && stuck.h >= stuck.listBottom, JSON.stringify(stuck));
    if (viewport.width < 1280) C(label, 'home button lines up with the bar', Math.abs((stuck.homeTop + stuck.homeBottom) / 2 - (stuck.listTop + stuck.listBottom) / 2) <= 4, `${stuck.homeTop}-${stuck.homeBottom} vs ${stuck.listTop}-${stuck.listBottom}`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(250);
    C(label, 'band gone at the top of the page', await page.$eval('.nb-toc', t => !t.classList.contains('is-stuck')));
    if (label === 'mobile') {
        await page.evaluate(() => scrollTo(0, 3000));
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(SHOTS, `v4-${label}-band.png`) });
    }

    // Lore teaser
    const lore = await page.evaluate(() => {
        const l = document.querySelector('.nb-lore'), b = l.querySelector('.nb-lore__more'), p = l.querySelector('p');
        return { clamped: l.classList.contains('is-clamped'), btn: !b.hidden, h: Math.round(p.getBoundingClientRect().height), sh: p.scrollHeight };
    });
    if (label === 'mobile') {
        C(label, 'lore clamped with Read more', lore.clamped && lore.btn && lore.h < lore.sh, JSON.stringify(lore));
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(200);
        const sixSteps = await page.$eval('#start .nb-h2', h => Math.round(h.getBoundingClientRect().top));
        C(label, '"Your first six steps" on the first screen', sixSteps < viewport.height, sixSteps);
        await page.screenshot({ path: path.join(SHOTS, `v4-${label}-top.png`) });
        await page.click('.nb-lore__more');
        const open1 = await page.evaluate(() => { const l = document.querySelector('.nb-lore'), p = l.querySelector('p'), b = l.querySelector('.nb-lore__more'); return { clamped: l.classList.contains('is-clamped'), full: p.scrollHeight <= p.clientHeight + 2, exp: b.getAttribute('aria-expanded'), txt: b.textContent.trim() }; });
        C(label, 'Read more shows the whole story', !open1.clamped && open1.full && open1.exp === 'true' && open1.txt === 'Show less', JSON.stringify(open1));
        await page.click('.nb-lore__more');
        C(label, 'Show less clamps again', await page.$eval('.nb-lore', l => l.classList.contains('is-clamped')));
    } else {
        C(label, 'desktop lore shows in full, no button', !lore.clamped && !lore.btn, JSON.stringify(lore));
    }

    // Glossary counts
    const counts = await page.$$eval('#glossary .gl-group:not([hidden]) .gl-group__count', n => n.map(x => x.textContent));
    C(label, 'starred filter shows "x of y" counts', counts.length > 0 && counts.every(c => / of \d+$/.test(c)), counts.join(', '));
    await page.locator('.gl-chip[data-filter="all"]').click();
    const countsAll = await page.$$eval('#glossary .gl-group__count', n => n.map(x => x.textContent));
    C(label, '"All" filter shows plain totals', countsAll.every(c => /^\d+$/.test(c)), countsAll.join(', '));
    await page.fill('#gl-search', 'brick');
    await page.waitForTimeout(200);
    const countsQ = await page.$$eval('#glossary .gl-group:not([hidden]) .gl-group__count', n => n.map(x => x.textContent));
    C(label, 'search shows "x of y" counts', countsQ.length > 0 && countsQ.every(c => / of \d+$/.test(c)), countsQ.join(', '));
    await page.fill('#gl-search', '');

    // Flashcard: every definition fits, nothing scrolls inside the button
    await page.locator('#practice').scrollIntoViewIfNeeded();
    await page.selectOption('#pr-deck', 'all').catch(() => { });
    const fc = await page.evaluate(async () => {
        const back = document.getElementById('fc-back'), card = document.getElementById('fc-card');
        let worst = 0, tallest = 0;
        for (let i = 0; i < 40; i++) {
            const over = back.scrollHeight - back.clientHeight;
            worst = Math.max(worst, over);
            tallest = Math.max(tallest, card.getBoundingClientRect().height);
            document.getElementById('fc-again').click();
            await new Promise(r => setTimeout(r, 10));
        }
        return { worst, tallest: Math.round(tallest), overflow: getComputedStyle(back).overflowY };
    });
    C(label, 'flashcard back never needs scrolling', fc.worst <= 1 && fc.overflow === 'visible', JSON.stringify(fc));
    await page.click('#fc-card');
    await page.waitForTimeout(600);
    const flipBox = await page.evaluate(() => { const c = document.getElementById('fc-card').getBoundingClientRect(), b = document.getElementById('fc-back').getBoundingClientRect(); return { cw: Math.round(c.width), bw: Math.round(b.width), ch: Math.round(c.height), bh: Math.round(b.height) }; });
    C(label, 'flipped back face fills the card', Math.abs(flipBox.cw - flipBox.bw) <= 2 && Math.abs(flipBox.ch - flipBox.bh) <= 2, JSON.stringify(flipBox));
    if (label === 'mobile') {
        await page.evaluate(() => document.getElementById('fc-card').scrollIntoView({ block: 'center' }));
        await page.screenshot({ path: path.join(SHOTS, `v4-${label}-flashcard.png`) });
    }

    // Accessibility re-run
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' });
    const axe = await page.evaluate(async () => (await axe.run({ exclude: [['.cc-banner'], ['.cc-overlay'], ['.cc-preferences']] }, { resultTypes: ['violations'] })).violations.map(v => `${v.id} x${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`));
    const contrast = axe.filter(v => v.startsWith('color-contrast'));
    C(label, 'no contrast failures', contrast.length === 0, contrast.join(' ; '));
    C(label, 'no scrollable-region failures', !axe.some(v => v.startsWith('scrollable-region')), axe.join(' ; '));
    C(label, 'no errors (baseline)', errors.length === 0, errors.join(' || '));
    await ctx.close();

    // Each path
    const PATHS = { new: ['nicknames', 'first-deck', 'where-to-play', 'banlist'], md: ['basics', 'field', 'cards', 'read-card', 'turn', 'decoder', 'nicknames', 'practice'], back: ['basics', 'read-card', 'turn', 'practice', 'first-deck', 'where-to-play'] };
    for (const [key, expectFolded] of Object.entries(PATHS)) {
        ({ ctx, page, errors } = await open(browser, label, viewport, { path: key }));
        const folded = await page.$$eval('.nb-section.is-folded', s => s.map(x => x.id));
        C(label, `${key}: folds the right sections`, JSON.stringify(folded) === JSON.stringify(expectFolded), folded.join(','));
        const len = await screens(page, viewport.height);
        C(label, `${key}: page length`, len < base, `${base} -> ${len} screens`);
        const visible = await page.evaluate(() => [...document.querySelectorAll('.nb-section.is-folded')].every(s => {
            const shown = [...s.querySelectorAll('*')].filter(e => e.getClientRects().length && !e.closest('.nb-fold') && !e.closest('.nb-kicker, .nb-h2, .nb-tldr'));
            return shown.every(e => e.closest('.cms-section') && e.closest('.cms-section').contains(s.querySelector('.nb-tldr')) && (e.matches('.pcs-toolbar, .pcs-toolbar *, .cms-section, .pcs-content, .pcs-run-stack') || e.querySelector('.nb-tldr')));
        }));
        C(label, `${key}: folded sections show only kicker, title, summary and bar`, visible);
        C(label, `${key}: summary visible in folded sections`, await page.$$eval('.nb-section.is-folded', s => s.every(x => { const t = x.querySelector('.nb-tldr'); return !t || t.getClientRects().length > 0; })));
        C(label, `${key}: reading times unchanged`, (await page.$$eval('.nb-readtime', n => n.map(x => x.textContent).join(','))) === readtimes);
        const pcs = await page.evaluate(() => ({ cms: document.querySelectorAll('.cms-section').length, tools: document.querySelectorAll('.pcs-tool-toolbar').length }));
        C(label, `${key}: suggestion wrapping same as without a path`, pcs.cms === pcsBase.cms && pcs.tools === pcsBase.tools, JSON.stringify(pcs) + ' vs ' + JSON.stringify(pcsBase));
        C(label, `${key}: fold note says folded`, (await page.textContent('.nb-fold-all__text')).includes('folded'));
        const cont = await page.getAttribute('#pg-continue', 'href');
        if (key === 'md') {
            // Progress card only shows once something is read; force a render via a learned word is overkill: check the href.
            C(label, 'md: continue points at an on-path section', !expectFolded.includes(cont.slice(1)), cont);
        }
        if (label === 'mobile' && key === 'new') {
            const y = await page.$eval('#first-deck', s => s.getBoundingClientRect().top + scrollY - 70);
            await page.evaluate(y => scrollTo(0, y), y);
            await page.waitForTimeout(300);
            await page.screenshot({ path: path.join(SHOTS, `v4-${label}-folded.png`) });
        }

        // Scrolling past a folded section doesn't mark it read.
        const target = expectFolded[0];
        await page.evaluate(id => document.getElementById(id).scrollIntoView(), target);
        await page.waitForTimeout(1600);
        C(label, `${key}: folded section not marked read`, !(await page.$eval(`.nb-toc a[href="#${target}"]`, a => a.classList.contains('is-read'))));

        // "Show the full section" opens just that one and focuses its title.
        await page.click(`#${target} .nb-fold__btn`);
        await page.waitForTimeout(100);
        const after = await page.evaluate(id => ({ open: !document.getElementById(id).classList.contains('is-folded'), focus: document.activeElement && document.activeElement.matches(`#${id} .nb-h2`), stillFolded: document.querySelectorAll('.nb-section.is-folded').length }), target);
        C(label, `${key}: Show the full section opens it`, after.open && after.focus && after.stillFolded === expectFolded.length - 1, JSON.stringify(after));

        // A nav link to a folded section opens it and lands on it.
        const second = expectFolded[1];
        await page.evaluate(() => scrollTo(0, 0));
        await page.click(`.nb-toc a[href="#${second}"]`);
        await page.waitForTimeout(900);
        const nav = await page.evaluate(id => { const s = document.getElementById(id); return { open: !s.classList.contains('is-folded'), top: Math.round(s.getBoundingClientRect().top) }; }, second);
        C(label, `${key}: nav link opens and lands on ${second}`, nav.open && nav.top >= 0 && nav.top < 140, JSON.stringify(nav));

        // Fold the others again / show every section
        await page.click('.nb-fold-all__btn');
        C(label, `${key}: Show every section`, (await page.locator('.nb-section.is-folded').count()) === 0 && (await page.textContent('.nb-fold-all__btn')) === 'Fold the others again');
        await page.click('.nb-fold-all__btn');
        C(label, `${key}: Fold the others again refolds all`, (await page.locator('.nb-section.is-folded').count()) === expectFolded.length);
        C(label, `${key}: no errors`, errors.length === 0, errors.join(' || '));
        await ctx.close();
    }

    // Script-driven jump: a glossary demo link plays on the field, which md folds.
    ({ ctx, page, errors } = await open(browser, label, viewport, { path: 'md' }));
    await page.locator('#glossary .gl-chip[data-filter="all"]').click();
    const demo = page.locator('#term-banish summary');
    await demo.scrollIntoViewIfNeeded();
    await demo.click();
    await page.locator('#term-banish .term__demo').click();
    await page.waitForTimeout(1200);
    const field = await page.evaluate(() => { const s = document.getElementById('field'); return { open: !s.classList.contains('is-folded'), top: Math.round(document.querySelector('#field .fd, #field .nb-field, #field [class*="field"]').getBoundingClientRect().top) }; });
    C(label, 'md: glossary demo opens the folded field and scrolls to it', field.open && field.top < viewport.height && field.top > -400, JSON.stringify(field));
    C(label, 'md: no errors after demo', errors.length === 0, errors.join(' || '));
    await ctx.close();

    // A shared link to a folded section opens it on load.
    ({ ctx, page, errors } = await open(browser, label, viewport, { path: 'md', hash: '#turn' }));
    const shared = await page.evaluate(() => { const s = document.getElementById('turn'); return { open: !s.classList.contains('is-folded'), top: Math.round(s.getBoundingClientRect().top), folded: document.querySelectorAll('.nb-section.is-folded').length }; });
    C(label, 'md: shared #turn link opens that section only', shared.open && shared.folded === 7 && Math.abs(shared.top) < 200, JSON.stringify(shared));
    // Hash typed later
    await page.evaluate(() => { location.hash = '#read-card'; });
    await page.waitForTimeout(600);
    const typed = await page.evaluate(() => { const s = document.getElementById('read-card'); return { open: !s.classList.contains('is-folded'), top: Math.round(s.getBoundingClientRect().top) }; });
    C(label, 'md: typed hash opens and scrolls', typed.open && Math.abs(typed.top) < 200, JSON.stringify(typed));
    await ctx.close();

    // Fold preference off persists
    ({ ctx, page, errors } = await open(browser, label, viewport, { path: 'new', fold: false }));
    C(label, 'fold switched off stays off', (await page.locator('.nb-section.is-folded').count()) === 0 && (await page.textContent('.nb-fold-all__text')) === 'Every section is open.');
    await ctx.close();
}

(async () => {
    await new Promise(r => server.listen(8790, r));
    const browser = await chromium.launch();
    await run(browser, 'desktop', { width: 1366, height: 900 });
    await run(browser, 'mobile', { width: 390, height: 844 });
    await browser.close();
    server.close();
    const passed = checks.filter(Boolean).length;
    console.log(`\n${passed}/${checks.length} passed`);
    process.exit(passed === checks.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
