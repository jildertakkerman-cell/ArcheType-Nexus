"""Build the pre-sized art for the Lore Archive reels, rosters and trails.

For every card named in assets/js/lore-reel-data.js this:
  1. resolves the card ID the way CardLoader does at runtime (Supabase passcode first,
     then the YGOProDeck API), so the crops tuned in the data still line up;
  2. takes the cropped art (our bucket's cards_cropped/<id>.png, else ygoprodeck's);
  3. writes art/<id>.webp (full 624px, for the slideshow canvas) and
     face/<id>.webp (256px, for the 54px portraits: 2.4x zoom on a 2x screen needs 259px);
  4. uploads both to gs://yugioh-card-images-archetype-nexus/lore/<VERSION>/ with a
     one-year immutable Cache-Control (the path is versioned, so a re-encode means a new VERSION);
  5. rewrites assets/js/lore-reel-art.js, the name -> ID manifest lore-reel.js reads.

Every card gets both files, so the data can use any card as a portrait. Cards without
cropped art are left out of the manifest; lore-reel.js then falls back to CardLoader.

Usage (from the repo root):  python scripts/build_lore_art.py [--stage DIR] [--no-upload]
Needs Pillow, node, and gsutil logged in with write access to the bucket. Reruns only
encode and upload what's new.
"""
import argparse, concurrent.futures as cf, io, json, os, re, subprocess, tempfile, urllib.error, urllib.parse, urllib.request

VERSION = 'v1'
BUCKET = 'yugioh-card-images-archetype-nexus'
PUBLIC = f'https://storage.googleapis.com/{BUCKET}/'
ART_QUALITY, FACE_QUALITY, FACE_SIZE = 82, 70, 256
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        if e.code in (400, 404):
            return None
        raise


def lore_cards():
    """Every card the lore data names."""
    js = r"""
const fs = require('fs'), w = {};
new Function('window', fs.readFileSync(process.argv[1], 'utf8'))(w);
const cards = new Set();
for (const r of Object.values(w.LoreReelData)) {
  (r.slides || []).forEach(s => { if (s && s.card) cards.add(s.card); });   // '|' entries divide acts
  (r.stops || []).forEach(s => cards.add(s.card));
  (r.people || []).forEach(p => p.forms.forEach(f => cards.add(f.card)));
  (r.cast || []).forEach(p => (p.forms || []).forEach(f => cards.add(f.card)));
}
console.log(JSON.stringify([...cards].sort()));
"""
    out = subprocess.run(['node', '-e', js, os.path.join(ROOT, 'assets/js/lore-reel-data.js')],
                         capture_output=True, text=True, encoding='utf-8', check=True).stdout
    return json.loads(out)


def supabase_config():
    s = open(os.path.join(ROOT, 'assets/js/supabase-config.js'), encoding='utf-8').read()
    return re.search(r"url:\s*'([^']+)'", s).group(1), re.search(r"anonKey:\s*'([^']+)'", s).group(1)


def resolve_id(name, sb_url, sb_key):
    """Same order as CardLoader.fetchCardData: Supabase row (if complete), else the API."""
    q = f"{sb_url}/rest/v1/cards?select=cardname,passcode,cardtype&cardname=ilike.{urllib.parse.quote(name, safe='')}&limit=1"
    body = get(q, {'apikey': sb_key, 'Authorization': f'Bearer {sb_key}'})
    rows = json.loads(body) if body else []
    if rows and rows[0].get('passcode') and rows[0].get('cardtype'):
        return int(rows[0]['passcode']), 'supabase'
    body = get(f"https://db.ygoprodeck.com/api/v7/cardinfo.php?name={urllib.parse.quote(name)}")
    data = json.loads(body).get('data') if body else None
    return (int(data[0]['id']), 'api') if data else (None, 'missing')


def source_art(card_id):
    for url in (f'{PUBLIC}cards_cropped/{card_id}.png', f'https://images.ygoprodeck.com/images/cards_cropped/{card_id}.jpg'):
        data = get(url)
        if data:
            return data
    # No fallback to the full card image: for unreleased cards YGOProDeck's is often a photo of a
    # physical card (skewed, with text), so those stay out until a real crop exists.
    return None


def encode(card_id, stage):
    from PIL import Image
    art_path = os.path.join(stage, 'art', f'{card_id}.webp')
    face_path = os.path.join(stage, 'face', f'{card_id}.webp')
    if os.path.exists(art_path) and os.path.exists(face_path):
        return card_id, 0, 'cached'
    raw = source_art(card_id)
    if not raw:
        return card_id, 0, 'no cropped art'
    img = Image.open(io.BytesIO(raw)).convert('RGB')
    if not os.path.exists(art_path):
        img.save(art_path, 'WEBP', quality=ART_QUALITY, method=6)
    img.resize((FACE_SIZE, round(FACE_SIZE * img.height / img.width)), Image.LANCZOS).save(face_path, 'WEBP', quality=FACE_QUALITY, method=6)
    return card_id, len(raw), 'encoded'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stage', default=os.path.join(tempfile.gettempdir(), 'lore-art-stage'))
    ap.add_argument('--no-upload', action='store_true')
    args = ap.parse_args()
    for sub in ('art', 'face'):
        os.makedirs(os.path.join(args.stage, sub), exist_ok=True)

    cards = lore_cards()
    sb_url, sb_key = supabase_config()
    print(f'{len(cards)} cards')

    ids, sources = {}, {}
    with cf.ThreadPoolExecutor(12) as pool:
        for name, (cid, src) in zip(cards, pool.map(lambda n: resolve_id(n, sb_url, sb_key), cards)):
            if cid:
                ids[name] = cid
            sources[src] = sources.get(src, 0) + 1
    print('IDs from:', sources, '| unresolved:', [n for n in cards if n not in ids])

    failed, source_bytes, encoded = set(), 0, 0
    with cf.ThreadPoolExecutor(12) as pool:
        for cid, size, note in pool.map(lambda cid: encode(cid, args.stage), sorted(set(ids.values()))):
            if note == 'no cropped art':
                failed.add(cid)
            elif note == 'encoded':
                encoded += 1
                source_bytes += size
    total = lambda sub: sum(os.path.getsize(os.path.join(args.stage, sub, f)) for f in os.listdir(os.path.join(args.stage, sub)))
    print(f'encoded {encoded} new ({source_bytes // 1024 // 1024} MB of source); stage now holds '
          f'{total("art") // 1024 // 1024} MB art + {total("face") // 1024 // 1024} MB faces')
    print('no cropped art (left to the runtime fallback):', sorted(failed))

    if not args.no_upload:
        gsutil = 'gsutil.cmd' if os.name == 'nt' else 'gsutil'
        for sub in ('art', 'face'):
            subprocess.run([gsutil, '-m', '-q', '-h', 'Cache-Control:public, max-age=31536000, immutable', '-h', 'Content-Type:image/webp',
                            'cp', '-n', os.path.join(args.stage, sub, '*.webp'), f'gs://{BUCKET}/lore/{VERSION}/{sub}/'], check=True)
        print('uploaded to', f'gs://{BUCKET}/lore/{VERSION}/')

    manifest = {n: c for n, c in sorted(ids.items()) if c not in failed}
    body = ',\n'.join(f'        {json.dumps(n, ensure_ascii=False)}: {c}' for n, c in manifest.items())
    out = ("/* Generated by scripts/build_lore_art.py - do not edit by hand; rerun it after adding cards to lore-reel-data.js.\n"
           " * Card name -> ID for the pre-sized Lore Archive art: <base>art/<id>.webp (slides, 624px) and\n"
           " * <base>face/<id>.webp (portraits, 256px). A card missing here falls back to CardLoader. */\n"
           f"window.LoreReelArt = {{\n    base: '{PUBLIC}lore/{VERSION}/',\n    ids: {{\n{body}\n    }}\n}};\n")
    with open(os.path.join(ROOT, 'assets/js/lore-reel-art.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(out)
    print(f'manifest: {len(manifest)} cards, {len(out) // 1024} KB')


if __name__ == '__main__':
    main()
