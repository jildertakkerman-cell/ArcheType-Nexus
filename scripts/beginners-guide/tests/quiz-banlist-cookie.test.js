// v6 checks: stop the combo, live banlist, finder ban notes, analytics, cookie icon, Swordsoul lab.
const path = require('path'), http = require('http'), fs = require('fs');
const ROOT = path.join(__dirname, '../../..');
const SHOTS = require('os').tmpdir();
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
const BASE = 'http://localhost:8796/pages/';
const checks = [];
const C = (label, name, ok, info) => { checks.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} [${label}] ${name}${info !== undefined ? ' -> ' + info : ''}`); };

// Fake banlist: Ash Blossom becomes Limited in the TCG; everything else as it really is.
const FAKE = {
    'Ash Blossom & Joyous Spring': { ban_tcg: 'Limited', ban_ocg: 'Semi-Limited' },
    'Maxx "C"': { ban_tcg: 'Forbidden', ban_ocg: 'Limited' },
    'Heavy Storm': { ban_tcg: 'Forbidden', ban_ocg: 'Limited' },
    'Pot of Greed': { ban_tcg: 'Forbidden', ban_ocg: 'Forbidden' },
    "Harpie's Feather Duster": { ban_tcg: 'Limited', ban_ocg: 'Limited' },
    'Droll & Lock Bird': { ban_tcg: 'Semi-Limited', ban_ocg: 'Limited' }
};
async function mockApi(ctx, mode) {
    const calls = [];
    await ctx.route('https://db.ygoprodeck.com/api/v7/cardinfo.php*', route => {
        const url = new URL(route.request().url());
        calls.push(url.search);
        if (mode === 'down') return route.fulfill({ status: 503, body: 'down' });
        if (url.searchParams.get('name')) {
            const names = url.searchParams.get('name').split('|');
            return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: names.filter(n => FAKE[n]).map(n => ({ name: n, banlist_info: FAKE[n] })) }) });
        }
        if (url.searchParams.get('fname')) {
            const q = url.searchParams.get('fname');
            const data = q === 'Red-Eyes'
                ? [{ name: 'Red-Eyes Black Dragon' }, { name: 'Red-Eyes Fake Forbidden Card', banlist_info: { ban_tcg: 'Forbidden' } }]
                : [{ name: q + ' Example' }];
            return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data }) });
        }
        return route.continue();
    });
    return calls;
}

async function open(browser, label, viewport, file, mode) {
    const ctx = await browser.newContext({ viewport, isMobile: label === 'mobile', hasTouch: label === 'mobile' });
    const calls = await mockApi(ctx, mode);
    await ctx.addInitScript(() => { window.__events = []; window.gtagStub = true; });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + file, { waitUntil: 'networkidle' });
    // Capture analytics events (the real gtag queues into dataLayer).
    await page.evaluate(() => { const real = window.gtag; window.gtag = function () { if (arguments[0] === 'event') window.__events.push([arguments[1], arguments[2]]); if (real) real.apply(this, arguments); }; });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.click('.cc-reject-nonessential').catch(() => { });
    await page.waitForTimeout(300);
    return { ctx, page, errors, calls };
}

async function run(browser, label, viewport) {
    // ---------- Guide with a changed banlist ----------
    let { ctx, page, errors, calls } = await open(browser, label, viewport, 'Beginners-Guide.html', 'live');
    await page.waitForFunction(() => document.querySelector('[data-ban-asof]').textContent === 'right now', null, { timeout: 8000 }).catch(() => { });
    const ban = await page.evaluate(() => ({
        asof: document.querySelector('[data-ban-asof]').textContent,
        ashTcg: document.querySelector('tr[data-ban-card="Ash Blossom & Joyous Spring"] [data-ban-list="tcg"]').textContent,
        ashOcg: document.querySelector('tr[data-ban-card="Ash Blossom & Joyous Spring"] [data-ban-list="ocg"]').textContent,
        exampleNote: (document.querySelector('.nb-ban--unlimited .nb-ban__update') || {}).textContent || '',
        otherNotes: document.querySelectorAll('.nb-ban__update, .nb-ban-update').length,
        cached: (() => { try { return !!JSON.parse(localStorage.getItem('nb-guide-bans')).cards['Pot of Greed']; } catch (e) { return false; } })()
    }));
    C(label, 'table shows the live status', ban.ashTcg === 'Limited' && ban.ashOcg === 'Semi-Limited', JSON.stringify(ban));
    C(label, '"as of" date becomes "right now"', ban.asof === 'right now');
    C(label, 'changed example gets an update note', ban.exampleNote === 'Update: Ash Blossom & Joyous Spring is now Limited in the TCG.', ban.exampleNote);
    C(label, 'unchanged claims get no note', ban.otherNotes === 1, ban.otherNotes);
    C(label, 'statuses cached for the day', ban.cached);
    C(label, 'one banlist request', calls.filter(c => c.includes('name=')).length === 1, calls.join(' | '));

    // ---------- Stop the combo ----------
    const qs = await page.locator('.sc-q').count();
    C(label, 'three stop-the-combo questions', qs === 3, qs);
    await page.locator('.sc-q').nth(0).locator('.sc-q__opt').nth(0).click(); // Ash Blossom: wrong
    const wrong = await page.evaluate(() => { const q = document.querySelectorAll('.sc-q')[0]; return { cls: q.querySelectorAll('.sc-q__opt')[0].className, why: q.querySelector('.sc-q__why').textContent }; });
    C(label, 'wrong answer is marked and explained', /is-wrong/.test(wrong.cls) && wrong.why.startsWith('Not quite.'), JSON.stringify(wrong));
    await page.locator('.sc-q').nth(0).locator('.sc-q__opt').nth(1).click(); // Effect Veiler: right
    const right = await page.evaluate(() => document.querySelectorAll('.sc-q')[0].querySelector('.sc-q__why').textContent);
    C(label, 'right answer explains the choke point', right.startsWith('Right.') && right.includes('choke point'), right.slice(0, 80));
    await page.locator('.sc-q').nth(1).locator('.sc-q__opt').nth(3).click(); // None of them: right
    await page.locator('.sc-q').nth(2).locator('.sc-q__opt').nth(1).click(); // Banish + 1200: right
    const score = await page.textContent('#sc-score');
    C(label, 'score counts first tries', score.startsWith('You got 2 of 3 on your first try.'), score);
    // "Show me" loads the simulator and steps it.
    await page.locator('.sc-q').nth(1).locator('.sc-q__show').click();
    await page.waitForFunction(() => document.querySelector('#nb-modern-lab .btn-next'), null, { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(1500);
    const at10 = await page.evaluate(() => {
        const z = id => { const e = document.querySelector('#nb-modern-lab #token-' + id); return e ? e.getAttribute('data-zone') : null; };
        return { taia: z('c-taia'), longyuan: z('c-longyuan'), chixiao: z('c-chixiao'), top: Math.round(document.getElementById('nb-modern-lab').getBoundingClientRect().top) };
    });
    C(label, '"Show me step 10" puts the board at step 10', at10.taia === 'zone-gy' && at10.longyuan === 'zone-hand' && at10.chixiao === 'zone-m3', JSON.stringify(at10));
    await page.locator('.sc-q').nth(0).locator('.sc-q__show').click();
    await page.waitForTimeout(1200);
    const at2 = await page.evaluate(() => ['c-moye', 'c-token1', 'c-chixiao'].map(id => document.querySelector('#nb-modern-lab #token-' + id).getAttribute('data-zone')).join(','));
    C(label, '"Show me step 2" rewinds the board', at2 === 'zone-m3,zone-vanish,zone-extra', at2);
    if (label === 'mobile' || label === 'desktop') {
        await page.evaluate(() => document.getElementById('stop-combo').scrollIntoView());
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SHOTS, `v6-${label}-stop.png`) });
    }

    // ---------- Finder ban notes ----------
    await page.evaluate(() => document.getElementById('deck-finder').scrollIntoView());
    await page.click('.df__opt[data-q="style"][data-v="beatdown"]');
    await page.click('.df__opt[data-q="level"][data-v="1"]');
    await page.click('.df__opt[data-q="look"][data-v="dragons"]');
    await page.waitForTimeout(800);
    const notes = await page.$$eval('#df-results .df-card', cards => cards.map(c => c.querySelector('.df-card__name').textContent + ':' + ((c.querySelector('.df-card__ban') || {}).textContent || '')));
    C(label, 'finder notes a Forbidden card on Red-Eyes only', notes[0] === 'Red-Eyes:Heads-up: Red-Eyes Fake Forbidden Card is Forbidden in the TCG right now.' && notes.slice(1).every(n => n.endsWith(':')), notes.join(' | '));

    // ---------- Analytics ----------
    await page.click('.nb-picker__opt[data-path="new"]').catch(async () => { await page.evaluate(() => document.querySelector('.nb-picker__opt[data-path="new"]').click()); });
    await page.evaluate(() => document.querySelector('.gl-count [data-print-sheet]').click());
    const events = await page.evaluate(() => window.__events.map(e => e[0] + ' ' + JSON.stringify(e[1])));
    const has = n => events.some(e => e.startsWith(n + ' '));
    C(label, 'analytics: path, finder, sheet, quiz events', has('guide_path') && has('deck_finder') && has('cheat_sheet_print') && has('stop_combo_answer'), events.join(' | '));
    C(label, 'quiz event sent once per question', events.filter(e => e.startsWith('stop_combo_answer')).length === 3);
    C(label, 'no errors (live)', errors.length === 0, errors.join(' || '));
    await ctx.close();

    // ---------- Guide with the API down: written text stays ----------
    ({ ctx, page, errors } = await open(browser, label, viewport, 'Beginners-Guide.html', 'down'));
    await page.waitForTimeout(2500);
    const down = await page.evaluate(() => ({ asof: document.querySelector('[data-ban-asof]').textContent, ash: document.querySelector('tr[data-ban-card="Ash Blossom & Joyous Spring"] [data-ban-list="tcg"]').textContent, notes: document.querySelectorAll('.nb-ban__update, .nb-ban-update').length }));
    C(label, 'API down: written statuses stay', down.asof === 'as of 26 September 2026' && down.ash === 'Unlimited' && down.notes === 0, JSON.stringify(down));
    C(label, 'no errors (API down)', errors.length === 0, errors.join(' || '));

    // ---------- Cookie icon ----------
    const icon0 = await page.evaluate(() => { const b = document.querySelector('.cc-icon-btn'); const r = b.getBoundingClientRect(); return { w: Math.round(r.width), op: getComputedStyle(b).opacity }; });
    await page.mouse.wheel(0, 1200); await page.waitForTimeout(500);
    await page.mouse.wheel(0, 1200); await page.waitForTimeout(500);
    const tucked = await page.evaluate(() => ({ cls: document.querySelector('.cc-icon-btn').classList.contains('is-tucked'), op: getComputedStyle(document.querySelector('.cc-icon-btn')).opacity, pe: getComputedStyle(document.querySelector('.cc-icon-btn')).pointerEvents }));
    await page.mouse.wheel(0, -400); await page.waitForTimeout(500);
    const back = await page.evaluate(() => getComputedStyle(document.querySelector('.cc-icon-btn')).opacity);
    C(label, 'cookie icon size', icon0.w === (label === 'mobile' ? 42 : 50), JSON.stringify(icon0));
    C(label, 'cookie icon tucks while scrolling down', tucked.cls && tucked.pe === 'none', JSON.stringify(tucked));
    C(label, 'cookie icon returns on scroll up', back === '1', back);
    await page.focus('.cc-icon-btn');
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    await ctx.close();

    // Cookie banner contrast (fresh visitor, banner showing).
    const ctxB = await browser.newContext({ viewport });
    const pb = await ctxB.newPage();
    await pb.goto(BASE + 'Beginners-Guide.html', { waitUntil: 'networkidle' });
    await pb.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' });
    const axeBanner = await pb.evaluate(async () => (await axe.run({ include: [['.cc-banner']] }, { runOnly: ['color-contrast'] })).violations.map(v => v.nodes.map(n => n.target.join(' ') + JSON.stringify((n.any[0] || {}).data || {}).slice(0, 120)).join(' | ')));
    C(label, 'cookie banner passes contrast', axeBanner.length === 0, axeBanner.join(' ; '));
    await ctxB.close();

    // ---------- Swordsoul page lab ----------
    ({ ctx, page, errors } = await open(browser, label, viewport, 'Swordsoul%20Deck%20Analysis.html', 'live'));
    C(label, 'Swordsoul: simulator not loaded up front', !(await page.evaluate(() => !!document.querySelector('link[href*="Visualizer_Styles"]'))));
    await page.evaluate(() => document.getElementById('swordsoul-lab-section').scrollIntoView());
    await page.waitForFunction(() => document.querySelector('#swordsoul-combo-lab .btn-next'), null, { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(800);
    const ss = await page.evaluate(() => ({
        steps: document.querySelectorAll('#swordsoul-combo-lab [id^="combo-combo1-step-"][id$="-img"]').length,
        scope: !!document.querySelector('[data-pcs-scope="swordsoul-combo-lab"]'),
        editable: !!document.querySelector('#swordsoul-lab-section .cms-section'),
        intro: document.querySelector('#swordsoul-lab-section').textContent.includes('Swordsoul Strategist Longyuan')
    }));
    C(label, 'Swordsoul: lab loads with 17 steps', ss.steps === 17, JSON.stringify(ss));
    C(label, 'Swordsoul: lab section has its own suggestion scope', ss.scope);
    for (let i = 0; i < 17; i++) await page.click('#swordsoul-combo-lab .btn-next');
    await page.waitForTimeout(900);
    const end = await page.evaluate(() => ['c-chixiao', 'c-qixing'].map(id => document.querySelector('#swordsoul-combo-lab #token-' + id).getAttribute('data-zone')).join(','));
    C(label, 'Swordsoul: line ends on Chixiao + Qixing', end === 'zone-m3,zone-m4', end);
    C(label, 'Swordsoul: no errors', errors.length === 0, errors.join(' || '));
    if (label === 'desktop') {
        await page.evaluate(() => document.getElementById('swordsoul-lab-section').scrollIntoView());
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SHOTS, 'v6-swordsoul-lab.png') });
    }
    await ctx.close();
}

(async () => {
    await new Promise(r => server.listen(8796, r));
    const browser = await chromium.launch();
    await run(browser, 'desktop', { width: 1366, height: 900 });
    await run(browser, 'mobile', { width: 390, height: 844 });
    await browser.close();
    server.close();
    const passed = checks.filter(Boolean).length;
    console.log(`\n${passed}/${checks.length} passed`);
    process.exit(passed === checks.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
