// Renders the 1200x630 share image for the Beginner's Guide (og:image / twitter:image).
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'assets/images/share');
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #0b0c11; }
  .og {
    position: relative; width: 1200px; height: 630px; box-sizing: border-box;
    display: grid; place-items: center; text-align: center; overflow: hidden;
    background:
      radial-gradient(ellipse 70% 60% at 50% 118%, rgba(242,181,68,0.32), transparent 70%),
      radial-gradient(ellipse 50% 50% at 8% 8%, rgba(125,211,252,0.12), transparent 70%),
      linear-gradient(160deg, #1c1733 0%, #0e1019 65%);
    font-family: 'Inter', sans-serif; color: #e9e7e2;
  }
  .card {
    position: absolute; width: 150px; aspect-ratio: 59 / 86; border-radius: 9px; border: 5px solid #6b4a24;
    background:
      radial-gradient(ellipse 34% 40% at 50% 50%, #2c1a0c 0 55%, #b8832e 57% 62%, transparent 64%),
      linear-gradient(145deg, #5a3a1a, #2b1a0b);
    box-shadow: 0 18px 36px rgba(0,0,0,0.6); opacity: 0.6;
  }
  .c1 { left: 70px; top: 120px; transform: rotate(-14deg); }
  .c2 { right: 80px; top: 70px; transform: rotate(11deg); }
  .c3 { right: 230px; bottom: -90px; transform: rotate(-6deg); opacity: 0.38; }
  .c4 { left: 210px; bottom: -110px; transform: rotate(9deg); opacity: 0.3; }
  .content { position: relative; z-index: 1; max-width: 900px; }
  .kicker { margin: 0 0 18px; font-size: 22px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: #f2b544; }
  h1 {
    margin: 0; font-family: 'Cinzel', serif; font-weight: 900; font-size: 92px; line-height: 1.04;
    background: linear-gradient(180deg, #fff6dc 0%, #f2b544 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 6px 18px rgba(0,0,0,0.55));
  }
  .tag { margin: 22px auto 0; max-width: 760px; font-size: 30px; font-weight: 500; line-height: 1.35; color: #e2dfd7; }
  .chips { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin-top: 34px; }
  .chips span { padding: 8px 18px; font-size: 22px; font-weight: 700; border-radius: 999px; color: #fff; background: rgba(18,20,27,0.85); border: 2px solid #343a4a; }
  .chips span.more { color: #1d1606; background: #f2b544; border-color: #f2b544; }
  .brand { position: absolute; left: 0; right: 0; bottom: 26px; font-size: 20px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(233,231,226,0.7); }
</style></head><body>
<div class="og">
  <div class="card c1"></div><div class="card c2"></div><div class="card c3"></div><div class="card c4"></div>
  <div class="content">
    <p class="kicker">New to the game? Start here</p>
    <h1>Yu-Gi-Oh!<br>Beginner's Guide</h1>
    <p class="tag">Every word duelists use, in plain English,<br>and exactly where to start.</p>
    <div class="chips"><span>Starter</span><span>Extender</span><span>Handtrap</span><span>Brick</span><span class="more">100+ more</span></div>
  </div>
  <div class="brand">Archetype Nexus</div>
</div></body></html>`;

(async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
    await page.screenshot({ path: path.join(OUT_DIR, 'beginners-guide.jpg'), type: 'jpeg', quality: 86 });
    await browser.close();
    console.log('fonts', fonts.join(', '), '| size', fs.statSync(path.join(OUT_DIR, 'beginners-guide.jpg')).size);
})().catch(e => { console.error(e); process.exit(1); });
