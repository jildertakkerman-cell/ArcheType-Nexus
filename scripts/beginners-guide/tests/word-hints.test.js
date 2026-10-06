// Word hints on deck pages (assets/js/glossary-hints.js): placement, definition card,
// keyboard, touch, the off switch and the guide's toggle.
// Run: node scripts/beginners-guide/tests/word-hints.test.js
const path = require('path'), http = require('http'), fs = require('fs');
const ROOT = path.join(__dirname, '../../..');
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const requests = [];
const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    requests.push(p);
    fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
const BASE = 'http://localhost:8799/pages/';
const PILOT = 'Floowandereeze%20Deck%20Analysis.html';
const OTHER = 'Ancient%20Gear%20Deck%20Analysis.html';
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/glossary-hints.json'), 'utf8'));
const checks = [];
const C = (label, name, ok, info) => { checks.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} [${label}] ${name}${info !== undefined ? ' -> ' + info : ''}`); };

async function open(ctx, file) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + file, { waitUntil: 'load' });
    await page.evaluate(() => { window.__events = []; const real = window.gtag; window.gtag = function () { if (arguments[0] === 'event') window.__events.push(arguments[1]); if (real) real.apply(this, arguments); }; });
    await page.click('.cc-reject-nonessential', { timeout: 3000 }).catch(() => { });
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-word-hints'), null, { timeout: 15000 }).catch(() => { });
    return { page, errors };
}

async function run(browser, label, viewport) {
    const mobile = label === 'mobile';
    const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
    await ctx.route(/\.supabase\.co|googletagmanager/, r => r.abort());

    // ---- Pilot page ----
    let { page, errors } = await open(ctx, PILOT);
    const n = await page.locator('a.nx-hint').count();
    C(label, 'pilot page gets hints', n >= 10 && n <= 24, n);
    const first = await page.evaluate(() => { const a = document.querySelector('a.nx-hint'); return { term: a.dataset.term, href: a.getAttribute('href'), color: getComputedStyle(a).color, parentColor: getComputedStyle(a.parentElement).color, deco: getComputedStyle(a).textDecorationStyle }; });
    C(label, 'hint keeps the text colour, dotted underline', first.color === first.parentColor && first.deco === 'dotted', JSON.stringify(first));
    C(label, 'hint links to the glossary entry', first.href === 'Beginners-Guide.html#term-' + first.term, first.href);
    const perSection = await page.evaluate(() => { const m = {}; document.querySelectorAll('a.nx-hint').forEach(a => { const s = a.closest('section') || document.body; m[s.__nxHintKey || 'body'] = (m[s.__nxHintKey || 'body'] || 0) + 1; }); return Math.max(...Object.values(m)); });
    C(label, 'no section has more than 4 hints', perSection <= 4, perSection);
    const draft = await page.evaluate(() => {
        if (typeof _pcsHtmlToDraft !== 'function') return 'no pcs';
        const a = document.querySelector('a.nx-hint');
        const block = a.closest('p, li, td, dd') || a.parentElement;
        return _pcsHtmlToDraft(block.parentElement.innerHTML);
    });
    C(label, 'suggested-edit drafts get plain text', draft !== 'no pcs' && !/nx-hint|<a/.test(draft), draft.slice(0, 80));

    // Open the definition card.
    const link = page.locator('a.nx-hint').first();
    await link.scrollIntoViewIfNeeded();
    if (mobile) await link.tap(); else await link.hover();
    await page.waitForTimeout(400);
    const card = await page.evaluate(() => { const p = document.querySelector('.nx-hint-pop'); return p && !p.hidden ? { name: p.querySelector('.nx-hint-pop__name').textContent, short: p.querySelector('.nx-hint-pop__short').textContent, more: p.querySelector('.nx-hint-pop__more').getAttribute('href'), sheet: p.classList.contains('is-sheet'), url: location.pathname } : null; });
    const term = DATA.terms.find(t => t.id === first.term);
    C(label, (mobile ? 'tap' : 'hover') + ' opens the definition card', !!card && card.name === term.name && card.short === term.short && card.more === first.href, JSON.stringify(card));
    if (mobile) C(label, 'tap stays on the page, card is a bottom sheet', card && card.sheet && /Floowandereeze/.test(decodeURIComponent(card.url)));
    const shot = path.join(require('os').tmpdir(), `word-hints-${label}.png`);
    await page.screenshot({ path: shot });
    if (mobile) await page.tap('body', { position: { x: 10, y: 200 } }); else await page.mouse.move(5, 5);
    await page.waitForTimeout(500);
    C(label, 'card closes when you move away', await page.evaluate(() => document.querySelector('.nx-hint-pop').hidden));

    // Keyboard.
    if (!mobile) {
        await page.focus('a.nx-hint');
        await page.waitForTimeout(100);
        const kb = await page.evaluate(() => ({ open: !document.querySelector('.nx-hint-pop').hidden, desc: document.activeElement.getAttribute('aria-describedby'), exp: document.activeElement.getAttribute('aria-expanded') }));
        C(label, 'focus opens the card and describes the link', kb.open && kb.desc === 'nx-hint-short' && kb.exp === 'true', JSON.stringify(kb));
        await page.keyboard.press('Escape');
        const esc = await page.evaluate(() => ({ open: !document.querySelector('.nx-hint-pop').hidden, focus: document.activeElement.classList.contains('nx-hint') }));
        C(label, 'Escape closes it and keeps focus on the word', !esc.open && esc.focus, JSON.stringify(esc));
    }
    const events = await page.evaluate(() => window.__events);
    C(label, 'analytics: word_hint_open', events.includes('word_hint_open'), events.join(','));

    // Accessibility of the card.
    if (mobile) await link.tap(); else await link.hover();
    await page.waitForTimeout(400);
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' });
    const axe = await page.evaluate(async () => (await axe.run({ include: [['.nx-hint-pop'], ['a.nx-hint']] }, { resultTypes: ['violations'] })).violations.map(v => v.id + ' x' + v.nodes.length));
    C(label, 'axe: no violations in hints or card', axe.length === 0, axe.join(', '));
    C(label, 'no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

    // Off switch.
    await page.click('.nx-hint-pop__off');
    await page.waitForTimeout(200);
    const off = await page.evaluate(() => ({ hints: document.querySelectorAll('a.nx-hint').length, toast: !!document.querySelector('.nx-hint-toast'), stored: localStorage.getItem('nexus-word-hints') }));
    C(label, '"Hide word hints" removes them and remembers', off.hints === 0 && off.toast && off.stored === 'off', JSON.stringify(off));
    C(label, 'no errors on the pilot page', errors.length === 0, errors.join(' || '));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    C(label, 'hints stay off after reload', (await page.locator('a.nx-hint').count()) === 0);
    await page.close();

    // ---- The guide's switch turns them back on ----
    ({ page } = await open(ctx, 'Beginners-Guide.html'));
    C(label, 'the guide itself has no word hints', (await page.locator('a.nx-hint').count()) === 0 && !requests.some(r => r.endsWith('glossary-hints.js') && false));
    C(label, 'guide switch shows "off"', (await page.textContent('#gl-word-hints')) === 'Word hints on deck pages: off');
    await page.click('#gl-word-hints');
    C(label, 'guide switch turns them on', (await page.textContent('#gl-word-hints')) === 'Word hints on deck pages: on' && (await page.evaluate(() => localStorage.getItem('nexus-word-hints'))) === null);
    await page.close();
    ({ page } = await open(ctx, PILOT));
    C(label, 'hints are back on the pilot page', (await page.locator('a.nx-hint').count()) > 0);
    await page.close();

    // ---- The Hints switch in the dock ----
    ({ page, errors } = await open(ctx, PILOT));
    const dock = await page.evaluate(() => {
        const b = document.querySelector('#word-hints-dock button');
        if (!b) return null;
        const r = b.getBoundingClientRect(), nav = b.closest('nav').getBoundingClientRect();
        const others = [...b.closest('nav').querySelectorAll('a.group, .synergy-sidebar-btn')].map(o => o.getBoundingClientRect());
        const overlaps = others.some(o => !(o.right <= r.left || o.left >= r.right || o.bottom <= r.top || o.top >= r.bottom));
        return { pressed: b.getAttribute('aria-pressed'), label: b.textContent.trim(), visible: r.width > 30 && r.height > 30, inNav: r.top >= nav.top - 1 && r.bottom <= nav.bottom + 1, inView: r.left >= 0 && r.right <= innerWidth, overlaps };
    });
    C(label, 'dock has a Hints switch, on', dock && dock.pressed === 'true' && /Hints on$/.test(dock.label), JSON.stringify(dock));
    C(label, 'switch sits inside the dock without overlapping', dock && dock.visible && dock.inNav && dock.inView && !dock.overlaps, JSON.stringify(dock));
    await page.screenshot({ path: path.join(require('os').tmpdir(), `word-hints-dock-${label}.png`) });
    await page.click('#word-hints-dock button');
    await page.waitForTimeout(200);
    const offState = await page.evaluate(() => ({ hints: document.querySelectorAll('a.nx-hint').length, pressed: document.querySelector('#word-hints-dock button').getAttribute('aria-pressed'), label: document.querySelector('#word-hints-dock button').textContent.trim(), stored: localStorage.getItem('nexus-word-hints'), toast: (document.querySelector('.nx-hint-toast') || {}).textContent || '' }));
    C(label, 'switch turns hints off', offState.hints === 0 && offState.pressed === 'false' && /Hints off$/.test(offState.label) && offState.stored === 'off' && /Hints button/.test(offState.toast), JSON.stringify(offState));
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-word-hints') === 'off', null, { timeout: 15000 }).catch(() => { });
    const afterReload = await page.evaluate(() => ({ hints: document.querySelectorAll('a.nx-hint').length, pressed: (document.querySelector('#word-hints-dock button') || {}).getAttribute && document.querySelector('#word-hints-dock button').getAttribute('aria-pressed') }));
    C(label, 'off survives a reload, switch still there', afterReload.hints === 0 && afterReload.pressed === 'false', JSON.stringify(afterReload));
    await page.click('#word-hints-dock button');
    await page.waitForFunction(() => document.querySelectorAll('a.nx-hint').length > 0, null, { timeout: 15000 }).catch(() => { });
    const onAgain = await page.evaluate(() => ({ hints: document.querySelectorAll('a.nx-hint').length, pressed: document.querySelector('#word-hints-dock button').getAttribute('aria-pressed'), stored: localStorage.getItem('nexus-word-hints') }));
    C(label, 'switch turns them back on, same hints', onAgain.hints === n && onAgain.pressed === 'true' && onAgain.stored === null, JSON.stringify(onAgain) + ' vs ' + n);
    // The card's "Hide word hints" keeps the switch in step.
    const l2 = page.locator('a.nx-hint').first();
    await l2.scrollIntoViewIfNeeded();
    if (mobile) await l2.tap(); else await l2.hover();
    await page.waitForTimeout(400);
    await page.click('.nx-hint-pop__off');
    C(label, 'hiding from the card flips the switch', (await page.getAttribute('#word-hints-dock button', 'aria-pressed')) === 'false');
    // A ?hints=on preview doesn't overwrite the reader's choice.
    await page.goto(BASE + PILOT + '?hints=on', { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('a.nx-hint').length > 0, null, { timeout: 15000 }).catch(() => { });
    C(label, '?hints=on previews without changing the setting', (await page.locator('a.nx-hint').count()) > 0 && (await page.evaluate(() => localStorage.getItem('nexus-word-hints'))) === 'off');
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' });
    const axeDock = await page.evaluate(async () => (await axe.run({ include: [['#word-hints-dock']] }, { resultTypes: ['violations'] })).violations.map(v => v.id));
    C(label, 'axe: switch has no violations', axeDock.length === 0, axeDock.join(', '));
    C(label, 'no errors around the switch', errors.length === 0, errors.join(' || '));
    await page.evaluate(() => localStorage.removeItem('nexus-word-hints'));
    await page.close();
    // The one deck page without a dock still gets hints.
    ({ page, errors } = await open(ctx, 'Imperial%20traps%20Deck%20Analysis.html'));
    C(label, 'page without a dock: hints, no switch, no errors', (await page.locator('a.nx-hint').count()) > 0 && (await page.locator('#word-hints-dock').count()) === 0 && errors.length === 0, errors.join(' || '));
    await page.close();

    // ---- Every deck page (ALL_PAGES), but not other pages ----
    ({ page } = await open(ctx, OTHER));
    C(label, 'a page outside the old pilot gets hints too', (await page.locator('a.nx-hint').count()) > 0);
    await page.close();
    const before = requests.filter(r => r.endsWith('glossary-hints.json')).length;
    ({ page } = await open(ctx, 'Banlist.html'));
    await page.waitForTimeout(2500);
    C(label, 'non-deck pages: no hints, word list not fetched', (await page.locator('a.nx-hint').count()) === 0 && requests.filter(r => r.endsWith('glossary-hints.json')).length === before);
    await page.close();
    await ctx.close();
}

(async () => {
    await new Promise(r => server.listen(8799, r));
    const browser = await chromium.launch();
    await run(browser, 'desktop', { width: 1366, height: 900 });
    await run(browser, 'mobile', { width: 390, height: 844 });
    await browser.close();
    server.close();
    const passed = checks.filter(Boolean).length;
    console.log(`\n${passed}/${checks.length} passed`);
    process.exit(passed === checks.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
