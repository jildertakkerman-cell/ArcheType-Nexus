// v5 checks: modern turn simulator, deck finder, printable cheat sheet, share/structured data.
const path = require('path'), http = require('http'), fs = require('fs');
const ROOT = path.join(__dirname, '../../..');
const SHOTS = require('os').tmpdir();
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const served = new Set();
const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    served.add(p);
    fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
const URL = 'http://localhost:8792/pages/Beginners-Guide.html';
const checks = [];
const C = (label, name, ok, info) => { checks.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} [${label}] ${name}${info !== undefined ? ' -> ' + info : ''}`); };

// Static checks on the source of truth.
function staticChecks() {
    const html = fs.readFileSync(path.join(ROOT, 'pages/Beginners-Guide.html'), 'utf8');
    const decks = [...html.matchAll(/\{ n: '((?:[^'\\]|\\.)*)'(?:, page: '([^']+)')?(?:, q: '[^']+')?, card: '((?:[^'\\]|\\.)*)'/g)]
        .map(m => ({ n: m[1].replace(/\\'/g, "'"), page: m[2] || m[1].replace(/\\'/g, "'") + ' Deck Analysis.html', card: m[3].replace(/\\'/g, "'") }));
    C('static', 'deck finder has 34 decks', decks.length === 34, decks.length);
    const missing = decks.filter(d => !fs.existsSync(path.join(ROOT, 'pages', d.page)));
    C('static', 'every deck page exists', missing.length === 0, missing.map(d => d.page).join(', '));
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const g = ld['@graph'];
    C('static', 'JSON-LD: WebPage, FAQPage, DefinedTermSet', g.map(x => x['@type']).join(',') === 'WebPage,FAQPage,DefinedTermSet');
    C('static', 'JSON-LD: 7 questions, 125 terms', g[1].mainEntity.length === 7 && g[2].hasDefinedTerm.length === 125);
    const ids = new Set([...html.matchAll(/id="(term-[^"]+)"/g)].map(m => m[1]));
    C('static', 'JSON-LD term urls point at real entries', g[2].hasDefinedTerm.every(t => ids.has(t.url.split('#')[1])));
    C('static', 'og:image is the share image', /og:image" content="https:\/\/archetypesnexus\.com\/assets\/images\/share\/beginners-guide\.jpg"/.test(html) && fs.existsSync(path.join(ROOT, 'assets/images/share/beginners-guide.jpg')));
    C('static', 'twitter large card', html.includes('name="twitter:card" content="summary_large_image"'));
    const combo = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/combos/beginners-guide-combos.json'), 'utf8'));
    C('static', 'combo has 17 steps, one move each', combo.combos.combo1.steps.length === 17 && combo.combos.combo1.steps.every(s => !s.actions && s.card && s.to));
    return decks;
}

async function run(browser, label, viewport, decks) {
    const ctx = await browser.newContext({ viewport, isMobile: label === 'mobile', hasTouch: label === 'mobile' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|supabase|406|ERR_|net::/i.test(m.text())) errors.push('console: ' + m.text()); });
    await page.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.click('.cc-reject-nonessential').catch(() => { });
    await page.waitForTimeout(300);

    // ---- Modern turn ----
    C(label, 'simulator not loaded up front', !(await page.evaluate(() => typeof ComboLoader !== 'undefined' || !!document.querySelector('link[href*="Visualizer_Styles"]'))));
    await page.evaluate(() => document.getElementById('nb-modern').scrollIntoView());
    await page.waitForFunction(() => document.querySelectorAll('#nb-modern-lab .btn-next').length > 0, null, { timeout: 15000 }).catch(() => { });
    const lab = await page.evaluate(() => ({
        css: !!document.querySelector('link[href*="Visualizer_Styles"]'),
        steps: document.querySelectorAll('#nb-modern-lab [id^="combo-combo1-step-"][id$="-img"]').length,
        title: (document.querySelector('#nb-modern-lab') || {}).textContent.includes('A Modern First Turn'),
        warning: !!document.querySelector('.ai-combo-warning'),
        pcsInside: document.querySelectorAll('#nb-modern-lab .pcs-toolbar').length
    }));
    C(label, 'simulator loads when scrolled near', lab.css && lab.title, JSON.stringify(lab));
    C(label, 'guide lists all 17 steps', lab.steps === 17, lab.steps);
    C(label, 'no "may contain errors" banner', !lab.warning);
    C(label, 'no suggestion toolbars inside the lab', lab.pcsInside === 0);
    for (let i = 0; i < 17; i++) { await page.click('#nb-modern-lab .btn-next'); await page.waitForTimeout(120); }
    await page.waitForTimeout(900);
    const board = await page.evaluate(() => {
        const z = id => [...document.querySelectorAll('#nb-modern-lab [data-zone="' + id + '"]')].filter(e => e.style.display !== 'none').map(e => e.getAttribute('title') || e.dataset.name || e.textContent.trim()).filter(Boolean);
        const cards = [...document.querySelectorAll('#nb-modern-lab [data-zone]')].filter(e => e.style.display !== 'none' && !e.classList.contains('zone'));
        return { m3: cards.filter(c => c.dataset.zone === 'zone-m3').length, m4: cards.filter(c => c.dataset.zone === 'zone-m4').length, m2: cards.filter(c => c.dataset.zone === 'zone-m2').length, onField: cards.filter(c => /^zone-m/.test(c.dataset.zone)).length, hand: cards.filter(c => c.dataset.zone === 'zone-hand').length };
    });
    C(label, 'line ends with 2 Synchros on the field and 4 cards in hand', board.m3 === 1 && board.m4 === 1 && board.m2 === 0 && board.onField === 2 && board.hand === 4, JSON.stringify(board));
    if (label === 'mobile' || label === 'desktop') {
        await page.evaluate(() => document.getElementById('nb-modern-lab').scrollIntoView());
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SHOTS, `v5-${label}-modern.png`) });
    }

    // ---- Deck finder ----
    await page.evaluate(() => document.getElementById('deck-finder').scrollIntoView());
    C(label, 'finder hides results until answered', await page.$eval('#df-results', r => r.hidden));
    await page.click('.df__opt[data-q="style"][data-v="beatdown"]');
    await page.click('.df__opt[data-q="level"][data-v="1"]');
    C(label, 'finder hint counts down', (await page.textContent('#df-hint')).startsWith('One more'));
    await page.click('.df__opt[data-q="look"][data-v="dragons"]');
    await page.waitForTimeout(1200);
    const res = await page.evaluate(() => [...document.querySelectorAll('#df-results .df-card')].map(c => ({ name: c.querySelector('.df-card__name a').textContent, href: c.querySelector('.df-card__name a').getAttribute('href'), img: !!c.querySelector('.df-card__art img'), match: c.querySelectorAll('.is-match').length })));
    C(label, 'beatdown + simple + dragons -> Red-Eyes first', res.length === 3 && res[0].name === 'Red-Eyes', res.map(r => r.name).join(', '));
    C(label, 'results link to deck pages', res.every(r => /Deck%20Analysis\.html$/.test(r.href)));
    C(label, 'results show card art', res.every(r => r.img), res.map(r => r.img).join(','));
    C(label, 'top result matches all three answers', res[0] && res[0].match === 3, res[0] && res[0].match);
    await page.click('.df__opt[data-q="look"][data-v="cute"]');
    await page.waitForTimeout(200);
    const cute = await page.$$eval('#df-results .df-card__name a', a => a.map(x => x.textContent));
    C(label, 'changing an answer updates results', cute[0] !== 'Red-Eyes' && cute.length === 3, cute.join(', '));
    // Every deck can come out on top for some set of answers.
    const tops = new Set();
    for (const st of ['combo', 'control', 'beatdown', 'grind']) for (const lv of ['1', '2', '3']) for (const lk of ['dragons', 'magic', 'warriors', 'machines', 'cute', 'nature', 'dark']) {
        await page.evaluate(([st, lv, lk]) => {
            document.querySelector(`.df__opt[data-q="style"][data-v="${st}"]`).click();
            document.querySelector(`.df__opt[data-q="level"][data-v="${lv}"]`).click();
            document.querySelector(`.df__opt[data-q="look"][data-v="${lk}"]`).click();
        }, [st, lv, lk]);
        (await page.$$eval('#df-results .df-card__name a', a => a.map(x => x.textContent))).forEach(n => tops.add(n));
    }
    C(label, 'every deck shows up for some answers', tops.size === decks.length, `${tops.size}/${decks.length}: missing ${decks.map(d => d.n).filter(n => !tops.has(n)).join(', ')}`);
    await page.click('.df__opt[data-q="look"][data-v="any"]');
    C(label, '"Surprise me" gives 3 decks', (await page.locator('#df-results .df-card').count()) === 3);
    const pcsFinder = await page.evaluate(() => { const t = document.getElementById('deck-finder').previousElementSibling; return !!(t && t.classList.contains('pcs-tool-toolbar')); });
    C(label, 'finder has a suggest-an-improvement link', pcsFinder);
    if (label === 'mobile' || label === 'desktop') {
        await page.click('.df__opt[data-q="style"][data-v="combo"]');
        await page.click('.df__opt[data-q="level"][data-v="2"]');
        await page.click('.df__opt[data-q="look"][data-v="dragons"]');
        await page.waitForTimeout(1500);
        await page.evaluate(() => document.getElementById('df-results').scrollIntoView({ block: 'start' }));
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SHOTS, `v5-${label}-finder.png`) });
    }

    // ---- Cheat sheet ----
    const links = await page.locator('[data-print-sheet]').count();
    C(label, 'three cheat sheet links', links === 3, links);
    await page.evaluate(() => document.querySelector('.gl-count [data-print-sheet]').click());
    const sheet = await page.evaluate(() => ({
        printed: window.__printed, cls: document.documentElement.classList.contains('nb-printing-sheet'),
        words: document.querySelectorAll('#cheat-sheet dt').length, phases: document.querySelectorAll('#cheat-sheet ol li').length,
        hash: location.hash
    }));
    C(label, 'print link builds the sheet and prints', sheet.printed === 1 && sheet.cls && sheet.words === 16 && sheet.phases === 6 && sheet.hash === '', JSON.stringify(sheet));
    await page.emulateMedia({ media: 'print' });
    const printView = await page.evaluate(() => ({ main: document.querySelector('main').getClientRects().length, sheet: getComputedStyle(document.getElementById('cheat-sheet')).display, home: document.querySelector('.ygo-home-button').getClientRects().length }));
    C(label, 'print view shows only the sheet', printView.main === 0 && printView.sheet === 'block' && printView.home === 0, JSON.stringify(printView));
    if (label === 'desktop') {
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        fs.writeFileSync(path.join(SHOTS, 'v5-cheat-sheet.pdf'), pdf);
        const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        C(label, 'cheat sheet fits on one A4 page', pages === 1, pages + ' page(s)');
        // Making a PDF fires afterprint, which (correctly) leaves sheet mode, so go back in.
        await page.evaluate(() => document.documentElement.classList.add('nb-printing-sheet'));
        const pdfLetter = await page.pdf({ format: 'Letter', printBackground: true });
        const lp = (pdfLetter.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        C(label, 'cheat sheet fits on one Letter page', lp === 1, lp + ' page(s)');
        await page.screenshot({ path: path.join(SHOTS, 'v5-sheet-print.png'), fullPage: true });
    }
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.emulateMedia({ media: 'screen' });
    const after = await page.evaluate(() => ({ cls: document.documentElement.classList.contains('nb-printing-sheet'), sheet: getComputedStyle(document.getElementById('cheat-sheet')).display }));
    C(label, 'after printing the page is back to normal', !after.cls && after.sheet === 'none', JSON.stringify(after));
    await page.emulateMedia({ media: 'print' });
    C(label, 'a normal print shows the guide, not the sheet', (await page.evaluate(() => getComputedStyle(document.getElementById('cheat-sheet')).display)) === 'none');
    await page.emulateMedia({ media: 'screen' });

    // ---- Accessibility of the new parts ----
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' });
    const axe = await page.evaluate(async () => (await axe.run({ include: [['#deck-finder'], ['#nb-modern']] }, { resultTypes: ['violations'] })).violations.map(v => `${v.id} x${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ') + ' ' + JSON.stringify(((n.any[0] || {}).data) || '').slice(0, 160)).join(' | ')}`));
    C(label, 'axe: no violations in finder and modern turn', axe.length === 0, axe.join(' ; '));
    C(label, 'no errors', errors.length === 0, errors.join(' || '));
    await ctx.close();

    // The modern turn waits while its section is folded.
    const ctx2 = await browser.newContext({ viewport });
    await ctx2.addInitScript(() => { try { localStorage.setItem('nb-guide-path', '"md"'); } catch (e) { } });
    const p2 = await ctx2.newPage();
    await p2.goto(URL, { waitUntil: 'networkidle' });
    await p2.click('.cc-reject-nonessential').catch(() => { });
    await p2.evaluate(() => document.getElementById('turn').scrollIntoView());
    await p2.waitForTimeout(800);
    C(label, 'folded turn section does not load the simulator', !(await p2.evaluate(() => !!document.querySelector('link[href*="Visualizer_Styles"]'))));
    await p2.click('#turn .nb-fold__btn');
    await p2.evaluate(() => document.getElementById('nb-modern').scrollIntoView());
    await p2.waitForFunction(() => document.querySelectorAll('#nb-modern-lab .btn-next').length > 0, null, { timeout: 15000 }).catch(() => { });
    C(label, 'opening it loads the simulator', (await p2.locator('#nb-modern-lab .btn-next').count()) > 0);
    await ctx2.close();
}

(async () => {
    const decks = staticChecks();
    await new Promise(r => server.listen(8792, r));
    const browser = await chromium.launch();
    await run(browser, 'desktop', { width: 1366, height: 900 }, decks);
    await run(browser, 'mobile', { width: 390, height: 844 }, decks);
    await browser.close();
    server.close();
    const passed = checks.filter(Boolean).length;
    console.log(`\n${passed}/${checks.length} passed`);
    process.exit(passed === checks.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
