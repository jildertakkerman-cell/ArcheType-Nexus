// Drives every interactive part of pages/Beginners-Guide.html (v2) in Chromium.
const path = require('path'), http = require('http'), fs = require('fs');
const ROOT = path.join(__dirname, '../../..');
const SHOTS = require('os').tmpdir();
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
const URL = 'http://localhost:8770/pages/Beginners-Guide.html';
const checks = [];
function check(label, name, ok, detail) { checks.push({ label, name, ok: !!ok, detail }); }

async function run(browser, label, viewport) {
    const ctx = await browser.newContext({ viewport, isMobile: label === 'mobile', hasTouch: label === 'mobile' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/406/.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('response', r => { if (r.status() >= 400 && !r.url().includes('archetypes?select')) errors.push(r.status() + ' ' + r.url().slice(0, 120)); });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.click('.cc-reject-nonessential').catch(() => {});
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.waitForTimeout(300);
    const C = (n, ok, d) => check(label, n, ok, d);
    const vh = viewport.height;

    C('no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    const screens = await page.evaluate(h => +(document.documentElement.scrollHeight / h).toFixed(1), vh);
    C('page length (screens)', true, screens);
    C('reading-time chips', (await page.locator('.nb-readtime').count()) >= 8, await page.locator('.nb-readtime').count());

    // Progress bar
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(200);
    const w = await page.$eval('#nb-read-progress', e => e.style.width);
    C('reading progress bar moves', parseFloat(w) > 30 && parseFloat(w) < 70, w);

    // Picker
    await page.click('.nb-picker__opt[data-path="md"]');
    C('picker shows Master Duel path', await page.isVisible('.nb-path[data-path="md"]'));
    C('picker marks 4 nav links', (await page.locator('.nb-toc a.is-suggested').count()) === 4);
    C('path folds the basics', await page.$eval('#basics', s => s.classList.contains('is-folded')));
    await page.click('.nb-fold-all__btn');
    C('"Show every section" opens them', await page.$eval('#basics', s => !s.classList.contains('is-folded')));

    // Popover
    await page.locator('#basics a[href="#term-tribute"]').first().scrollIntoViewIfNeeded();
    await page.locator('#basics a[href="#term-tribute"]').first().click();
    await page.waitForTimeout(150);
    const popName = await page.$eval('.nb-pop', p => p.hidden ? null : p.querySelector('.nb-pop__name').textContent);
    C('popover opens on a word link', popName === 'Tribute', popName);
    C('page did not jump to glossary', await page.evaluate(() => !location.hash.includes('term-')));
    if (label === 'mobile') C('popover is a bottom sheet on phones', await page.$eval('.nb-pop', p => p.classList.contains('is-sheet')));
    await page.keyboard.press('Escape');
    C('Escape closes popover', await page.$eval('.nb-pop', p => p.hidden));
    // "Full entry" from the popover jumps and opens the entry
    await page.locator('#basics a[href="#term-tribute"]').first().click();
    await page.click('.nb-pop__more');
    await page.waitForTimeout(400);
    C('full-entry link opens the glossary entry', await page.$eval('#term-tribute', d => d.open && !d.hidden));

    // Glossary defaults and filters
    await page.click('.gl-chip[data-filter="core"]');
    C('glossary starts on 16 starred words', (await page.locator('#glossary .term:not([hidden])').count()) === 16, await page.textContent('#gl-count'));
    await page.fill('#gl-search', 'bounce');
    await page.waitForTimeout(300);
    const bounceNames = await page.$$eval('#glossary .term:not([hidden]) .term__name', e => e.map(x => x.textContent));
    C('search looks through all words', bounceNames.includes('Bounce'), bounceNames.join(', '));
    await page.fill('#gl-search', '');
    await page.waitForTimeout(300);
    await page.click('#gl-show-all');
    C('"Show all" shows 125', (await page.locator('#glossary .term:not([hidden])').count()) === 125);
    const before = await page.textContent('#gl-unlearned-n');
    await page.locator('#term-gy summary').click();
    await page.click('#term-gy .term__learn');
    C('"I know this one" marks the word', await page.isVisible('#term-gy .term__done'));
    C('unlearned count drops', +(await page.textContent('#gl-unlearned-n')) === +before - 1, before + ' -> ' + (await page.textContent('#gl-unlearned-n')));
    await page.click('#gl-toggle-all');
    C('"Open all" opens every visible entry', await page.$$eval('#glossary .term:not([hidden])', d => d.every(x => x.open)));
    await page.click('#gl-toggle-all');

    // Deep link to a term hidden by a filter
    await page.click('.gl-chip[data-filter="basics"]');
    await page.evaluate(() => { location.hash = '#term-floater'; });
    await page.waitForTimeout(600);
    C('deep link reveals + opens a filtered-out word', await page.$eval('#term-floater', d => !d.hidden && d.open));

    // Field actions
    await page.locator('#field').scrollIntoViewIfNeeded();
    await page.click('[data-verb="bounce"]');
    await page.waitForTimeout(200);
    C('action shows its title', (await page.textContent('#nb-zoneinfo-title')) === 'Bounce');
    C('action shows the route', /Monster Zone\s+to\s+Hand/.test(await page.textContent('#nb-zoneinfo-extra')), await page.textContent('#nb-zoneinfo-extra'));
    C('a card flies between zones', (await page.locator('.nb-flycard').count()) >= 1);
    C('from/to zones light up', (await page.locator('.nb-zone.is-from').count()) === 1 && (await page.locator('.nb-zone.is-to').count()) === 1);
    await page.click('[data-verb="mill"]');
    await page.waitForTimeout(500);
    C('mill sends three cards', (await page.locator('.nb-flycard').count()) >= 3, await page.locator('.nb-flycard').count());

    // Battle calculator
    await page.locator('#nb-calc').scrollIntoViewIfNeeded();
    C('calculator default', (await page.textContent('#calc-result')).includes('3000 ATK beats 2500 ATK'), (await page.textContent('#calc-result')).slice(0, 90));
    await page.selectOption('#calc-def', '7'); // Big Shield Gardna
    await page.click('[data-pos="def"]');
    C('attack into defense', (await page.textContent('#calc-result')).includes('3000 ATK beats 2600 DEF'), (await page.textContent('#calc-result')).slice(0, 90));
    await page.selectOption('#calc-att', '6'); // Kuriboh
    C('losing to defense deals damage to you', (await page.textContent('#calc-result')).includes('8000 → 5700'), (await page.textContent('#calc-result')).slice(0, 140));
    await page.selectOption('#calc-def', '4'); // Decode Talker
    C('Link defender cannot be in Defense', await page.$eval('[data-pos="def"]', b => b.disabled));
    await page.selectOption('#calc-def', 'none');
    await page.selectOption('#calc-att', '0');
    C('direct attack', (await page.textContent('#calc-result')).includes('8000 → 5000'));
    await page.selectOption('#calc-def', 'custom');
    await page.fill('#calc-att-atk', '0');
    await page.fill('#calc-def-val', '0');
    await page.click('[data-pos="atk"]');
    C('0 vs 0 ATK: neither destroyed', (await page.textContent('#calc-result')).includes('neither monster is destroyed'));

    // Chain stepper
    await page.locator('#basics-chain').scrollIntoViewIfNeeded();
    for (let i = 0; i < 5; i++) await page.click('#chain-step');
    C('chain stepper reaches the last step', (await page.textContent('#chain-caption')).startsWith('Step 5 of 5'));
    C('chain link 1 shown as negated', await page.$eval('#nb-chain-list li[data-link="1"]', li => li.classList.contains('is-negated')));
    await page.click('#chain-reset');
    C('chain reset', await page.$eval('#chain-caption', c => c.hidden));

    // Frame game
    await page.locator('#nb-frame-game').scrollIntoViewIfNeeded();
    await page.click('#nf-start');
    await page.waitForTimeout(2500);
    C('frame game loads a card image', (await page.locator('#nf-card img').count()) === 1);
    await page.click('.nf__opt >> nth=0');
    C('frame game gives feedback', (await page.textContent('#nf-feedback')).length > 10, await page.textContent('#nf-feedback'));
    C('frame game marks the right answer', (await page.locator('.nf__opt.is-right').count()) === 1);
    await page.click('#nf-next');
    C('frame game moves on', (await page.textContent('#nf-status')).startsWith('Card 2 of 10'));

    // Decoder
    await page.locator('#decoder').scrollIntoViewIfNeeded();
    C('decoder shows one sentence at a time', (await page.locator('.dc-sentence:visible').count()) === 1);
    await page.click('.dc-sentence.is-current .dc-term >> nth=2');
    C('guess mode asks with 3 choices', (await page.locator('.dc-sentence.is-current .dc-guess__opt').count()) === 3);
    await page.click('.dc-sentence.is-current .dc-guess__opt >> nth=0');
    C('guess reveals the answer', await page.isVisible('.dc-sentence.is-current .dc-result'));
    C('decoder score updates', (await page.textContent('#dc-score')).includes('of 1'), await page.textContent('#dc-score'));
    await page.click('#dc-next');
    C('next sentence', (await page.textContent('#dc-count')) === 'Sentence 2 of 15');
    await page.uncheck('#dc-guess');
    await page.click('.dc-sentence.is-current .dc-term >> nth=0');
    C('guess off reveals directly', await page.isVisible('.dc-sentence.is-current .dc-panel__word'));

    // Practice
    await page.locator('#practice').scrollIntoViewIfNeeded();
    const term = await page.textContent('#fc-term');
    C('flashcard shows a word', term.length > 1, term);
    await page.click('#fc-card');
    C('flashcard flips', await page.$eval('#fc-card', b => b.classList.contains('is-flipped')));
    await page.click('#fc-got');
    // The deck is shuffled: if the first card is GY (already marked learned above), the count stays at 1.
    const expectLearned = term.startsWith('GY') ? '1 /' : '2 /';
    C('ring counts learned words', (await page.textContent('#pr-ring-text')).startsWith(expectLearned), await page.textContent('#pr-ring-text'));
    await page.click('#pr-tab-quiz');
    C('quiz shows 4 answers', (await page.locator('.qz__opt').count()) === 4);
    await page.click('.qz__opt >> nth=0');
    C('quiz gives feedback', (await page.textContent('#qz-feedback')).length > 3, await page.textContent('#qz-feedback'));
    await page.click('[data-dir="word"]');
    const optText = await page.textContent('.qz__opt >> nth=0');
    C('quiz can ask word → meaning', (await page.textContent('#qz-prompt')).startsWith('What does') && optText.length > 20, optText);

    // Read a card
    await page.locator('#read-card').scrollIntoViewIfNeeded();
    await page.waitForSelector('#rc-spots:not([hidden])', { timeout: 10000 }).catch(() => {});
    C('card spots appear once the image loads', await page.isVisible('#rc-spots'));
    await page.click('.rc__spot[data-part="level"]');
    C('a spot lights up its explanation', await page.$eval('#rc-parts li[data-part="level"]', li => li.classList.contains('is-on')));
    if (label === 'mobile') C('phone caption shows the explanation', (await page.isVisible('#rc-caption')) && (await page.textContent('#rc-caption')).includes('Level 3'));
    await page.click('.rc-seg[data-seg="cost"]');
    C('card text part lights up its legend', await page.$eval('#rc-legend div[data-seg="cost"]', d => d.classList.contains('is-on')));

    // Watch a turn
    await page.locator('#nb-turn').scrollIntoViewIfNeeded();
    C('turn widget replaces the plain list', (await page.isVisible('#nb-turn')) && !(await page.isVisible('#wt-steps')));
    C('turn starts with 5 cards in hand', (await page.locator('.wt__hand .wt-card').count()) === 5);
    for (let i = 0; i < 11; i++) await page.click('#wt-next');
    await page.waitForTimeout(700);
    C('turn reaches step 12', (await page.textContent('#wt-phase')).startsWith('Step 12 of 12'), await page.textContent('#wt-phase'));
    C('your GY holds 2 cards at the end', (await page.textContent('[data-zone="gy"] .wt__count')) === '2');
    C("opponent's GY holds Alexandrite Dragon", await page.$eval('[data-zone="o-gy"] .wt-card', t => t.dataset.card === 'alex'));
    C('Celtic Guardian is still on the field', (await page.locator('[data-zone="m3"] .wt-card[data-card="celtic"]').count()) === 1);
    C('deck shows 34 after the search', (await page.textContent('[data-zone="deck"] .wt__count')) === '34');
    await page.click('#wt-prev');
    C('back goes one step', (await page.textContent('#wt-phase')).startsWith('Step 11 of 12'));
    await page.click('[data-zone="m3"] .wt-card');
    await page.waitForTimeout(2000);
    C('board cards open the card popup', await page.evaluate(() => { const p = document.getElementById('shared-card-popup'); if (!p) return false; const cs = getComputedStyle(p); return cs.display !== 'none' && +cs.opacity > 0 && p.innerText.includes('Celtic'); }));
    await page.keyboard.press('Escape');

    // Nicknames
    await page.locator('#nicknames').scrollIntoViewIfNeeded();
    await page.check('#nk-test');
    C('test mode hides the names', await page.$eval('.nk-list li', li => getComputedStyle(li.querySelector('.nk__name')).filter.includes('blur')));
    await page.click('.nk-list li >> nth=1');
    C('tapping a hidden row reveals it', await page.$eval('.nk-list li:nth-child(2)', li => li.classList.contains('is-revealed')));
    await page.uncheck('#nk-test');

    // Cross-links
    await page.click('.gl-chip[data-filter="all"]');
    await page.locator('#term-bounce summary').click();
    await page.click('#term-bounce [data-verb-demo]');
    await page.waitForTimeout(1200);
    C('"Watch it on the field" plays the action', (await page.textContent('#nb-zoneinfo-title')) === 'Bounce');
    C('…and brings the field into view', await page.evaluate(() => { const r = document.querySelector('.nb-field').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }));
    await page.click('#glossary .gl-group[data-cat="actions"] .gl-group__practise');
    await page.waitForTimeout(600);
    C('"Practise these" opens that set', (await page.$eval('#pr-deck', s => s.value)) === 'cat:actions' && (await page.textContent('#fc-cat')) === 'Actions', await page.textContent('#fc-cat'));

    // Chain wording matches Ash Blossom's current text
    C('chain stepper no longer says "negates the activation"', !(await page.evaluate(() => document.documentElement.innerHTML.includes('negates the activation of Chain Link'))));

    // Reading progress
    await page.evaluate(() => document.querySelector('#basics .nb-next').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1800);
    C('reaching the end of a section ticks it in the nav', await page.$eval('.nb-toc a[href="#basics"]', a => a.classList.contains('is-read')));
    C('progress card appears', await page.$eval('#nb-progress', e => !e.hidden));
    C('continue points at the next unread section', (await page.textContent('#pg-continue')).startsWith('Continue:'), await page.textContent('#pg-continue'));

    // Persistence across reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    C('learned words persist', parseInt(await page.textContent('#pr-ring-text'), 10) >= parseInt(expectLearned, 10), await page.textContent('#pr-ring-text'));
    C('read sections persist', await page.$eval('.nb-toc a[href="#basics"]', a => a.classList.contains('is-read')));
    C('picker choice persists', await page.isVisible('.nb-path[data-path="md"]'));

    // Suggest-an-improvement links
    const contexts = await page.$$eval('.pcs-tool-toolbar [data-suggest]', e => e.map(x => x.dataset.suggest));
    C('suggestion links on the widgets', contexts.length >= 6, contexts.join(' | '));

    C('no errors', errors.length === 0, errors.join(' || '));

    // Screenshots
    const shots = label === 'mobile'
        ? ['start', 'basics-chain', 'nb-calc', 'field', 'nb-frame-game', 'decoder', 'practice', 'glossary']
        : ['start', 'nb-calc', 'field', 'nb-frame-game', 'decoder', 'practice', 'glossary'];
    for (const id of shots) {
        await page.evaluate(i => { const e = document.getElementById(i); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 80); }, id);
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(SHOTS, `v2-${label}-${id}.png`) });
    }
    await ctx.close();
}

(async () => {
    await new Promise(r => server.listen(8770, r));
    const browser = await chromium.launch();
    await run(browser, 'desktop', { width: 1366, height: 900 });
    await run(browser, 'mobile', { width: 375, height: 800 });
    await browser.close();
    server.close();
    for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'} [${c.label}] ${c.name}${c.detail !== undefined ? '  -> ' + c.detail : ''}`);
    console.log(`\n${checks.filter(c => c.ok).length}/${checks.length} passed`);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
