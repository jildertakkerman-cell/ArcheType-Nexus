/**
 * Card Browser — the standalone archetype card page (pages/Card-Browser.html).
 *
 * Every card of one archetype with search, deck-zone tabs, gameplay-tag
 * filters, banlist status for TCG / OCG / Master Duel, a details panel and a
 * list view. The filter state lives in the URL, so a filtered view can be
 * shared. Styles: assets/css/card-browser.css (one set of markup; at phone
 * width the filters and the card details become bottom sheets).
 *
 * Data:
 *   - cards: CardLoader.fetchArchetypeCards (Supabase get_archetype_cards).
 *     Rows call the monster type `types`, not `race`.
 *   - gameplay tags and the actions behind them: one embedded REST query per
 *     30 cards (cardactions -> actions -> actiontags -> tags), instead of one
 *     get_tags_by_passcode call per card. Falls back to that RPC if it fails.
 *   - banlists: CardLoader.fetchBanlistData for each format.
 *   - YGOProDeck, only for cards with no release date and for passcodes that
 *     appear twice under different names (it supplies the official name).
 *
 * Dependencies: CardLoader (card-loader.js), supabase-config.js. Optional:
 * auth.js + follow-archetype.js for the Follow button.
 */

window.CardBrowser = (function () {
    'use strict';

    // ---------- Constants ----------

    const ZONES = [
        { key: 'main', label: 'Main Deck', short: 'Main', heading: 'Main Deck monsters', dot: '#f59e0b' },
        { key: 'extra', label: 'Extra Deck', short: 'Extra', heading: 'Extra Deck monsters', dot: '#a78bfa' },
        { key: 'spell', label: 'Spells', short: 'Spells', heading: 'Spells', dot: '#34d399' },
        { key: 'trap', label: 'Traps', short: 'Traps', heading: 'Traps', dot: '#f472b6' }
    ];

    // `key` is what the URL uses; `loader` is CardLoader's banlist name.
    const FORMATS = [
        { key: 'tcg', loader: 'tcg', label: 'TCG', name: 'TCG' },
        { key: 'ocg', loader: 'ocg', label: 'OCG', name: 'OCG' },
        { key: 'md', loader: 'masterduel', label: 'MD', name: 'Master Duel' }
    ];

    const BAN_CLASS = { Forbidden: 'forbidden', Limited: 'limited', 'Semi-Limited': 'semi-limited' };
    const BAN_FG = { Forbidden: '#fca5a5', Limited: '#fcd34d', 'Semi-Limited': '#fde68a', Unlimited: '#86efac' };

    // What a card does for you, most telling first. Tiles show the first two.
    const TILE_ROLES = [
        'Searcher', 'Draw Power', 'Negate', 'Floodgate', 'Hand Activation', 'Discard', 'Recur', 'Foolish',
        'Miller', 'Control Change', 'Destruction', 'Monster Destruction', 'Spell Destruction', 'Trap Destruction',
        'Banishment', 'Bounce', 'Spin', 'Send to GY', 'Multiple Attacks', 'Burn', 'Direct Attack', 'Extender',
        'Fusion Support', 'Synchro Support', 'Xyz Support', 'Link Support', 'Pendulum Support',
        'Destruction Protection', 'Targeting Protection', 'Battle Protection', 'Effect Protection'
    ];

    // Quick filter chips in the toolbar; the rest live under "All tags".
    const QUICK_ROLES = [
        'Searcher', 'Extender', 'Negate', 'Hand Activation', 'Floodgate', 'Recur', 'Miller', 'Destruction',
        'Banishment', 'Fusion Support', 'Synchro Support', 'Xyz Support', 'Link Support', 'Pendulum Support',
        'Draw Power', 'Foolish', 'Bounce', 'Burn', 'Control Change', 'Spin'
    ];
    const QUICK_ROLE_LIMIT = 10;

    // Print regions, not gameplay; the Print status filter covers them.
    const NOT_GAMEPLAY = new Set(['OCG', 'TCG']);

    const CATEGORY_ORDER = ['consistency', 'disruption', 'removal', 'combat', 'protection', 'economy', 'cost', 'interaction', 'timing', 'mechanics', 'default'];
    const CATEGORY_LABEL = {
        consistency: 'Consistency', disruption: 'Disruption', removal: 'Removal', combat: 'Combat',
        protection: 'Protection', economy: 'Economy', cost: 'Costs', interaction: 'Interaction',
        timing: 'Timing', mechanics: 'Mechanics', default: 'Other'
    };
    // Text colours that keep 4.5:1 on the dark panels.
    const CATEGORY_FG = {
        consistency: '#7cb4fb', disruption: '#fb8a9a', removal: '#fbbf24', combat: '#f8908f',
        protection: '#4fd8c4', economy: '#4ade9b', cost: '#4dd8ef', interaction: '#eb94f9',
        timing: '#c4a5fb', mechanics: '#a5b4fc', default: '#a8b3c4'
    };

    const ERAS = [
        { key: '2024', label: '2024 – now', lo: 2024, hi: 9999 },
        { key: '2020', label: '2020 – 2023', lo: 2020, hi: 2023 },
        { key: '2016', label: '2016 – 2019', lo: 2016, hi: 2019 },
        { key: '2010', label: '2010 – 2015', lo: 2010, hi: 2015 },
        { key: 'old', label: 'Before 2010', lo: 1, hi: 2009 }
    ];

    const PRINT_LABEL = { tcg: 'In the TCG', ocg: 'OCG only', soon: 'Coming to the TCG' };

    const SORTS = [
        { key: 'name', label: 'Name A–Z' },
        { key: 'name-desc', label: 'Name Z–A' },
        { key: 'newest', label: 'Newest first' },
        { key: 'oldest', label: 'Oldest first' },
        { key: 'atk', label: 'Highest ATK' },
        { key: 'level', label: 'Highest Level / Link' }
    ];

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const NEW_MONTHS = 6;
    const PHONE_PREVIEW = 6;
    const NAMED_BY_LIMIT = 4;
    // A card name quoted in card text, with straight or curly quotes.
    const QUOTED_NAME = /["“]([^"”]+)["”]/g;
    // Card panel columns (px): column width, gap between columns, padding + border.
    const DETAIL_COLUMN = 352;
    const DETAIL_COLUMN_GAP = 28;
    const DETAIL_PADDING = 38;
    const TAG_CHUNK = 30;
    // Per-reader preferences kept in localStorage.
    const FORMAT_STORAGE_KEY = 'cb-banlist-format';
    const VIEW_STORAGE_KEY = 'cb-view';
    const DEFAULT_IMAGE_BASE = 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/cards';
    const FALLBACK_IMAGE_BASE = 'https://images.ygoprodeck.com/images/cards_small';
    const PHONE_QUERY = window.matchMedia('(max-width: 760px)');

    const TODAY = isoDate(new Date());
    const NEW_CUTOFF = isoDate(addMonths(new Date(), -NEW_MONTHS));

    const ICONS = {
        search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
        x: '<path d="M18 6 6 18M6 6l12 12"></path>',
        left: '<path d="m15 18-6-6 6-6"></path>',
        right: '<path d="m9 18 6-6-6-6"></path>',
        down: '<path d="m6 9 6 6 6-6"></path>',
        grid: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
        list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>',
        sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"></path><circle cx="15" cy="6" r="2"></circle><circle cx="9" cy="12" r="2"></circle><circle cx="17" cy="18" r="2"></circle>',
        tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle>',
        copy: '<rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
        info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path>',
        expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>',
        link: '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"></path><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"></path>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z"></path><path d="M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5"></path>'
    };

    // ---------- State ----------

    const state = {
        q: '', zone: 'all', tags: [], match: 'all', attr: '', race: '', print: '', era: '',
        fresh: false, names: '', sort: 'name', view: 'grid', fmt: 'tcg', card: '',
        allTags: false, more: false, anime: false, expanded: {}, sheet: ''
    };

    let archetype = '';
    let utils = {};
    let cards = [];
    let cardById = new Map();
    let cardByName = new Map(); // lower-case name (and alternative names) -> card
    let anime = [];
    let zoneTotals = {};
    let tagIndex = [];
    let quickRoles = [];
    let banMaps = null;
    let guideFile = '';
    let order = [];
    let detailSignature = '';
    let detailLayoutKey = '';
    let lastTrigger = null;
    let searchTimer = 0;
    let rendered = false;
    const tileCache = new Map();
    const rowCache = new Map();

    // ---------- Entry point ----------

    /**
     * Build the page for one archetype.
     * @param {string} archetypeName - The archetype's name as the database spells it
     */
    async function initCardBrowserPage(archetypeName) {
        archetype = String(archetypeName || '').trim();
        const container = $('browser-content');
        if (!archetype || !container) return;

        document.title = `${archetype} Cards – Card Browser | Archetype Nexus`;
        setText('archetype-title', archetype);
        setText('cb-topbar-title', archetype);
        setText('cb-crumb-archetype', archetype);
        readUrlState();
        resolveGuideLink();

        if (!window.CardLoader) {
            showMessage('The card loader did not load. Try refreshing the page.');
            return;
        }
        if (CardLoader.isSupabaseConfigured && !CardLoader.isSupabaseConfigured()) {
            showMessage('The card database is not configured.');
            return;
        }
        utils = CardLoader._getUtils ? CardLoader._getUtils() : {};
        renderSkeleton(container);

        let rows = null;
        try {
            rows = await CardLoader.fetchArchetypeCards(archetype);
        } catch (err) {
            console.error('[CardBrowser] Card fetch failed:', err);
        }
        if (!rows) {
            showMessage('The cards could not be loaded. Check your connection and refresh the page.');
            return;
        }

        const parsed = normalize(rows);
        cards = parsed.cards;
        anime = parsed.anime;
        cardById = new Map(cards.map(c => [c.id, c]));
        if (!cards.length && !anime.length) {
            showMessage(`No cards were found for “${archetype}”.`, true);
            return;
        }
        zoneTotals = {};
        ZONES.forEach(z => { zoneTotals[z.key] = cards.filter(c => c.zone === z.key).length; });

        primeCardLoaderCache();
        await Promise.all([loadTags(), loadBanlists()]);
        buildTagIndex();
        buildMentions();
        sanitizeState();

        renderPage(container);
        bindEvents(container);
        rendered = true;
        renderHero();
        // A shared link with ?card= scrolls to that card and opens it.
        update({ reveal: !!state.card });
        initFollow();
        hydrateFromApi(parsed.dupes);
    }

    // ---------- Data ----------

    function normalize(rows) {
        const list = [];
        const seen = new Map();
        const animeList = [];
        const dupes = new Set();

        rows.forEach(r => {
            const name = r.cardname || r.card_name;
            if (!name) return;
            const id = r.passcode || r.id;
            const format = String(r.format || '').toUpperCase();
            if (!id || format.startsWith('ANIME')) {
                animeList.push({ name, desc: r.desc || '' });
                return;
            }
            const key = String(id);
            const existing = seen.get(key);
            if (existing) {
                // The same passcode listed twice under different names.
                if (existing.name !== name && !existing.altNames.includes(name)) existing.altNames.push(name);
                dupes.add(key);
                return;
            }
            const card = toCard(r, name, key);
            seen.set(key, card);
            list.push(card);
        });

        animeList.sort((a, b) => a.name.localeCompare(b.name));
        return { cards: list, anime: animeList, dupes: [...dupes] };
    }

    function toCard(r, name, id) {
        const type = r.cardtype || r.card_type || '';
        const zone = /Fusion|Synchro|Xyz|Link/i.test(type) ? 'extra'
            : /Spell/i.test(type) ? 'spell'
                : /Trap/i.test(type) ? 'trap' : 'main';
        const isMonster = zone === 'main' || zone === 'extra';
        const isLink = /Link/i.test(type);
        const isXyz = /Xyz/i.test(type);
        const race = r.types || r.race || '';
        const attr = r.attribute || '';
        const scale = r.pendulumscale != null ? r.pendulumscale : (r.scale != null ? r.scale : null);

        let stat = '';
        let statLabel = '';
        let statValue = '';
        let atkdef = '';
        if (isMonster) {
            if (isLink) {
                stat = r.link != null ? `Link-${r.link}` : '';
                statLabel = 'Link rating';
                statValue = r.link != null ? String(r.link) : '?';
                atkdef = `ATK ${statNum(r.atk)}`;
            } else {
                stat = r.level != null ? `${isXyz ? 'Rank' : 'Lv'} ${r.level}` : '';
                statLabel = isXyz ? 'Rank' : 'Level';
                statValue = r.level != null ? String(r.level) : '?';
                atkdef = `${statNum(r.atk)} / ${statNum(r.def)}`;
            }
        }

        const typeLine = isMonster
            ? [race].concat(type.replace(/\s*Monster$/i, '').split(/\s+/)).filter(Boolean).join(' / ')
            : `${r.property || ''} ${zone === 'spell' ? 'Spell' : 'Trap'}`.trim();

        const card = {
            id, name, altNames: [], cardid: r.cardid || null, zone, isMonster, rawType: type,
            race: isMonster ? race : '', attr, scale, stat, statLabel, statValue, atkdef, typeLine,
            meta: isMonster ? [attr, stat, atkdef].filter(Boolean).join(' · ') : typeLine,
            atkNum: typeof r.atk === 'number' ? r.atk : -1,
            levelNum: (isLink ? r.link : r.level) || 0,
            atkRaw: r.atk, defRaw: r.def, levelRaw: r.level, linkRaw: r.link,
            desc: r.desc || '',
            tagMap: new Map(), tags: [], tagNames: new Set(), roles: [], actions: [],
            ban: { tcg: 'Unlimited', ocg: 'Unlimited', md: 'Unlimited' }
        };
        const misc = Array.isArray(r.misc_info) ? r.misc_info[0] || {} : {};
        applyDates(card,
            dateOnly(r.tcgreleasedate || r.tcg_date || misc.tcg_date),
            dateOnly(r.ocgreleasedate || r.ocg_date || misc.ocg_date));
        setHaystack(card);
        return card;
    }

    function applyDates(c, tcg, ocg) {
        c.tcg = tcg;
        c.ocg = ocg;
        const known = [tcg, ocg].filter(Boolean).sort();
        c.first = known[0] || '';
        c.latest = known[known.length - 1] || '';
        c.year = c.first ? Number(c.first.slice(0, 4)) : 0;
        c.region = !known.length ? '' : !tcg ? 'ocg' : tcg > TODAY ? 'soon' : 'tcg';
        const released = known.filter(d => d <= TODAY);
        c.isNew = released.length > 0 && released[0] >= NEW_CUTOFF;
        // Out in the OCG for a while, new to TCG players.
        c.debut = !c.isNew && !!tcg && tcg <= TODAY && tcg >= NEW_CUTOFF && !!ocg && ocg < tcg;
        c.fresh = c.isNew || c.debut || c.region === 'soon';
        // The newest-support row and the details panel flag TCG debuts from the past year.
        c.recentDebut = !!tcg && tcg <= TODAY && tcg >= isoDate(addMonths(new Date(), -12)) && !!ocg && ocg < tcg;

        const parts = [];
        if (ocg) parts.push({ d: ocg, text: `OCG ${longDate(ocg)}` });
        if (tcg) parts.push({ d: tcg, text: `TCG ${longDate(tcg)}${tcg > TODAY ? ' (upcoming)' : ''}` });
        parts.sort((a, b) => a.d.localeCompare(b.d));
        c.release = parts.map(p => p.text).join(' · ') || 'Release date unknown';
        c.firstLabel = c.first ? monthYear(c.first) : '—';
    }

    /** What search looks through: names, card text, gameplay tags and the effect lines shown. */
    function setHaystack(c) {
        const tags = c.tags ? c.tags.map(t => t.n) : [];
        const actions = c.actions ? c.actions.filter(a => a.tags.length).map(a => a.name) : [];
        c.hay = [c.name].concat(c.altNames, [c.desc], tags, actions).join(' ').toLowerCase();
    }

    /** CardLoader's popup and full-art modal read this cache. */
    function primeCardLoaderCache() {
        const cache = CardLoader.cardDataCache;
        if (!cache) return;
        cards.forEach(c => {
            const existing = cache[c.name];
            if (existing && existing.card_sets) return;
            cache[c.name] = Object.assign({}, existing, {
                name: c.name,
                id: Number(c.id),
                desc: c.desc,
                type: c.rawType,
                race: c.race || (c.zone === 'spell' || c.zone === 'trap' ? c.typeLine.split(' ')[0] : undefined),
                attribute: c.attr || undefined,
                atk: c.atkRaw != null ? c.atkRaw : undefined,
                def: c.defRaw != null ? c.defRaw : undefined,
                level: c.levelRaw != null ? c.levelRaw : undefined,
                linkval: c.linkRaw != null ? c.linkRaw : undefined,
                scale: c.scale != null ? c.scale : undefined,
                hosted_image_url: `${imageBase()}/${c.id}.png`
            });
        });
    }

    async function loadTags() {
        const cfg = window.SUPABASE_CONFIG || {};
        const withIds = cards.filter(c => c.cardid);
        let loaded = false;

        if (cfg.url && cfg.anonKey && withIds.length === cards.length) {
            try {
                const byCardId = new Map(withIds.map(c => [c.cardid, c]));
                const groups = chunk(withIds.map(c => c.cardid), TAG_CHUNK);
                const results = await Promise.all(groups.map(ids => fetchActionRows(cfg, ids)));
                results.forEach(rows => rows.forEach(row => {
                    const c = byCardId.get(row.cardid);
                    const action = row.actions;
                    if (!c || !action) return;
                    const tags = (action.actiontags || []).map(at => at && at.tags).filter(Boolean);
                    c.actions.push({ name: action.actionname, tags: tags.map(t => t.tagname).filter(n => !NOT_GAMEPLAY.has(n)) });
                    tags.forEach(t => addTag(c, t.tagname, t.tagcategory));
                }));
                loaded = true;
            } catch (err) {
                console.warn('[CardBrowser] Bulk tag query failed; asking card by card instead.', err);
                cards.forEach(c => { c.actions = []; c.tagMap = new Map(); });
            }
        }

        if (!loaded && CardLoader.getTagsForCard) {
            await Promise.all(cards.map(async c => {
                try {
                    const tags = await CardLoader.getTagsForCard(c.id);
                    (tags || []).forEach(t => addTag(c, t.tag_name, t.tag_category));
                } catch (_) { /* a card without tags still shows */ }
            }));
        }

        cards.forEach(finishTags);
    }

    async function fetchActionRows(cfg, cardIds) {
        const select = 'cardid,actions(actionname,actiontags(tags(tagname,tagcategory)))';
        const url = `${cfg.url}/rest/v1/cardactions?select=${encodeURIComponent(select)}&cardid=in.(${cardIds.join(',')})&limit=5000`;
        const headers = { apikey: cfg.anonKey };
        if (/^eyJ/.test(cfg.anonKey)) headers.Authorization = `Bearer ${cfg.anonKey}`;
        const resp = await fetch(url, { headers });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
    }

    function addTag(c, name, category) {
        if (!name || NOT_GAMEPLAY.has(name)) return;
        const known = utils.KNOWN_TAG_CATEGORIES || {};
        const cat = String(known[name] || category || 'default').toLowerCase();
        if (!c.tagMap.has(name)) c.tagMap.set(name, cat);
    }

    function finishTags(c) {
        c.tags = [...c.tagMap].map(([n, cat]) => ({ n, c: cat }))
            .sort((a, b) => categoryRank(a.c) - categoryRank(b.c) || a.n.localeCompare(b.n));
        c.tagNames = new Set(c.tags.map(t => t.n));
        c.roles = TILE_ROLES.filter(r => c.tagNames.has(r)).slice(0, 2);
        setHaystack(c);
    }

    async function loadBanlists() {
        banMaps = {};
        if (CardLoader.fetchBanlistData) {
            const maps = await Promise.all(FORMATS.map(f =>
                Promise.resolve(CardLoader.fetchBanlistData(f.loader)).catch(() => ({}))));
            FORMATS.forEach((f, i) => {
                const map = maps[i] || {};
                const lower = new Map();
                Object.keys(map).forEach(k => lower.set(k.toLowerCase(), map[k]));
                banMaps[f.key] = { map, lower, loaded: Object.keys(map).length > 0 };
            });
        }
        applyBans();
    }

    function applyBans() {
        cards.forEach(c => {
            FORMATS.forEach(f => {
                const m = banMaps && banMaps[f.key];
                let status = null;
                if (m) {
                    for (const n of [c.name].concat(c.altNames)) {
                        status = m.map[n] || m.lower.get(n.toLowerCase());
                        if (status) break;
                    }
                }
                c.ban[f.key] = BAN_CLASS[status] ? status : 'Unlimited';
            });
        });
    }

    function buildTagIndex() {
        const counts = new Map();
        const byCat = new Map();
        cards.forEach(c => c.tags.forEach(t => {
            counts.set(t.n, (counts.get(t.n) || 0) + 1);
            if (!byCat.has(t.c)) byCat.set(t.c, new Set());
            byCat.get(t.c).add(t.n);
        }));
        tagIndex = [...byCat.keys()]
            .sort((a, b) => categoryRank(a) - categoryRank(b))
            .map(key => ({
                key,
                label: CATEGORY_LABEL[key] || titleCase(key),
                fg: CATEGORY_FG[key] || CATEGORY_FG.default,
                tags: [...byCat.get(key)].sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b))
            }));
        quickRoles = QUICK_ROLES.filter(n => (counts.get(n) || 0) >= 2).slice(0, QUICK_ROLE_LIMIT);
        if (quickRoles.length < 4) quickRoles = QUICK_ROLES.filter(n => counts.get(n)).slice(0, QUICK_ROLE_LIMIT);
    }

    /** Drop URL values this archetype can't match. */
    function sanitizeState() {
        const allTags = new Set(tagIndex.flatMap(c => c.tags));
        state.tags = state.tags.filter(t => allTags.has(t));
        if (state.zone !== 'all' && !zoneTotals[state.zone]) state.zone = 'all';
        if (state.attr && !cards.some(c => c.attr === state.attr)) state.attr = '';
        if (state.race && !cards.some(c => c.race === state.race)) state.race = '';
        if (state.print && !cards.some(c => c.region === state.print)) state.print = '';
        if (state.fresh && !cards.some(c => c.fresh)) state.fresh = false;
        if (state.card && !cardById.has(state.card)) state.card = '';
        if (state.names && !cardById.has(state.names)) state.names = '';
    }

    /**
     * Cards with no release date, and the official name for passcodes the
     * database lists twice, come from YGOProDeck after the page is up.
     */
    async function hydrateFromApi(dupeIds) {
        const missing = cards.filter(c => !c.first).map(c => c.id);
        const ids = [...new Set(dupeIds.concat(missing))];
        if (!ids.length) return;

        const apiUrl = (utils.CONFIG && utils.CONFIG.API_URL) || 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
        const changed = new Set();
        try {
            const results = await Promise.all(chunk(ids, 20).map(async group => {
                const resp = await fetch(`${apiUrl}?id=${group.join(',')}&misc=yes`);
                if (!resp.ok) return [];
                const json = await resp.json();
                return json.data || [];
            }));
            results.flat().forEach(api => {
                const c = cardById.get(String(api.id));
                if (!c) return;
                if (dupeIds.includes(c.id) && api.name && api.name !== c.name) {
                    const names = new Set([c.name].concat(c.altNames));
                    names.delete(api.name);
                    c.altNames = [...names];
                    c.name = api.name;
                    setHaystack(c);
                    changed.add(c.id);
                }
                if (!c.first) {
                    const misc = (api.misc_info && api.misc_info[0]) || {};
                    if (misc.tcg_date || misc.ocg_date) {
                        applyDates(c, dateOnly(misc.tcg_date), dateOnly(misc.ocg_date));
                        changed.add(c.id);
                    }
                }
            });
        } catch (err) {
            console.warn('[CardBrowser] YGOProDeck lookup failed:', err);
        }
        if (!changed.size) return;

        applyBans();
        buildMentions();
        primeCardLoaderCache();
        changed.forEach(id => { tileCache.delete(id); rowCache.delete(id); });
        cards.sort((a, b) => a.name.localeCompare(b.name));
        const rail = $('cb-newest');
        if (rail) rail.outerHTML = newestHtml();
        detailSignature = '';
        renderHero();
        update();
    }

    // ---------- Filtering ----------

    function matchesBase(c, skip) {
        if (state.qLower && !c.hay.includes(state.qLower)) return false;
        if (state.names && !(c.nameIds && c.nameIds.has(state.names))) return false;
        if (skip !== 'print' && state.print && c.region !== state.print) return false;
        if (skip !== 'attr' && state.attr && c.attr !== state.attr) return false;
        if (skip !== 'race' && state.race && c.race !== state.race) return false;
        if (skip !== 'era' && state.era) {
            const era = ERAS.find(e => e.key === state.era);
            if (era && !inEra(c, era)) return false;
        }
        if (state.fresh && !c.fresh) return false;
        return true;
    }

    function matchesTags(c) {
        if (!state.tags.length) return true;
        return state.match === 'any'
            ? state.tags.some(t => c.tagNames.has(t))
            : state.tags.every(t => c.tagNames.has(t));
    }

    function inZone(c, zone) {
        return zone === 'all' || c.zone === zone;
    }

    function inEra(c, era) {
        return c.year >= era.lo && c.year <= era.hi;
    }

    function comparator() {
        const byName = (a, b) => a.name.localeCompare(b.name);
        switch (state.sort) {
            case 'name-desc': return (a, b) => b.name.localeCompare(a.name);
            case 'newest': return (a, b) => (b.first || '').localeCompare(a.first || '') || byName(a, b);
            case 'oldest': return (a, b) => (a.first || '9999').localeCompare(b.first || '9999') || byName(a, b);
            case 'atk': return (a, b) => b.atkNum - a.atkNum || byName(a, b);
            case 'level': return (a, b) => b.levelNum - a.levelNum || byName(a, b);
            default: return byName;
        }
    }

    /** Cards that pass every filter except `skip`, for a filter's own counts. */
    function facetCount(skip, predicate) {
        return cards.filter(c => matchesBase(c, skip) && matchesTags(c) && inZone(c, state.zone) && predicate(c)).length;
    }

    function activeFilterCount() {
        return state.tags.length + (state.attr ? 1 : 0) + (state.race ? 1 : 0) + (state.print ? 1 : 0)
            + (state.era ? 1 : 0) + (state.fresh ? 1 : 0) + (state.names ? 1 : 0);
    }

    function isFiltered() {
        return !!state.qLower || state.zone !== 'all' || activeFilterCount() > 0;
    }

    // ---------- Rendering ----------

    function renderSkeleton(container) {
        container.innerHTML = `
            <div class="cb-wrap cb-body" aria-busy="true">
                <div class="cb-results">
                    <p class="cb-visually-hidden" role="status">Loading cards…</p>
                    <div class="cb-grid">${'<div class="cb-skeleton"></div>'.repeat(16)}</div>
                </div>
            </div>`;
    }

    function showMessage(text, homeLink) {
        const container = $('browser-content');
        if (!container) return;
        container.innerHTML = `
            <div class="cb-wrap cb-message" role="status">
                <p>${esc(text)}</p>
                ${homeLink ? '<p><a href="../index.html">Browse all archetypes</a></p>' : ''}
            </div>`;
    }

    function renderPage(container) {
        container.innerHTML = newestHtml() + toolbarHtml() + bodyHtml();
    }

    function renderHero() {
        const years = cards.map(c => c.year).filter(Boolean);
        const parts = [];
        if (cards.length) {
            parts.push(`${cards.length} official card${cards.length === 1 ? '' : 's'}${years.length ? `, first printed in ${Math.min.apply(null, years)}` : ''}`);
        }
        if (anime.length) parts.push(`${anime.length} anime-only card${anime.length === 1 ? '' : 's'} listed at the end`);
        setText('cb-summary', parts.join(' · '));
        const barTitle = $('cb-topbar-title');
        if (barTitle) {
            barTitle.innerHTML = esc(archetype)
                + (cards.length ? ` <span>· ${cards.length} card${cards.length === 1 ? '' : 's'}</span>` : '');
        }

        const box = $('cb-legality');
        if (!box || !cards.length || !banMaps) return;
        const cells = FORMATS.map(f => {
            const loaded = banMaps[f.key] && banMaps[f.key].loaded;
            const restricted = cards.filter(c => c.ban[f.key] !== 'Unlimited');
            const text = !loaded ? 'Unavailable' : restricted.length ? `${restricted.length} restricted` : 'Nothing restricted';
            const title = restricted.map(c => `${c.name}: ${c.ban[f.key]}`).join('\n');
            return `
                <div class="cb-legality-cell"${title ? ` title="${esc(title)}"` : ''}>
                    <span class="cb-legality-fmt">${f.name}</span>
                    <span class="cb-legality-text${restricted.length || !loaded ? ' is-restricted' : ''}">${text}</span>
                </div>`;
        }).join('');
        box.innerHTML = `<p class="cb-label">Banlist status</p><div class="cb-legality-cells">${cells}</div>`;
        box.hidden = false;
    }

    function newestHtml() {
        const newest = cards.filter(c => c.latest)
            .sort((a, b) => b.latest.localeCompare(a.latest) || a.name.localeCompare(b.name))
            .slice(0, 5);
        if (cards.length < 6 || !newest.length) return '<section id="cb-newest" hidden></section>';
        const anyFresh = cards.some(c => c.fresh);
        return `
            <section class="cb-wrap cb-newest" id="cb-newest" aria-labelledby="cb-newest-h">
                <div class="cb-newest-head">
                    <h2 class="cb-h2" id="cb-newest-h">Newest support</h2>
                    <span class="cb-newest-note">Latest prints first, across TCG and OCG</span>
                    ${anyFresh ? '<button type="button" class="cb-chip" id="cb-fresh-btn" data-action="toggle-fresh" aria-pressed="false">Show only new &amp; upcoming</button>' : ''}
                </div>
                <div class="cb-rail">
                    ${newest.map(c => {
            const head = headline(c);
            return `
                        <button type="button" class="cb-rail-card" data-action="open-card" data-id="${c.id}">
                            <span class="cb-art cb-rail-art">${imgHtml(c)}${head ? `<span class="cb-art-foot" aria-hidden="true"><span class="cb-badge cb-badge--${head[0]}">${esc(head[2])}</span></span>` : ''}</span>
                            <span class="cb-rail-text">
                                ${head ? `<span class="cb-badge cb-badge--${head[0]}"><span class="cb-badge-long">${esc(head[1])}</span><span class="cb-badge-short" aria-hidden="true">${esc(head[2])}</span></span>` : ''}
                                <span class="cb-rail-name cb-clamp2">${esc(c.name)}</span>
                                <span class="cb-rail-type">${esc(c.typeLine)}</span>
                                <span class="cb-rail-release">${esc(c.release)}</span>
                            </span>
                        </button>`;
        }).join('')}
                </div>
            </section>`;
    }

    function toolbarHtml() {
        const fmtGroup = '<span class="cb-fmt-buttons" data-fmt-group style="display: contents"></span>';
        return `
            <div class="cb-toolbar" id="cb-toolbar">
                <div class="cb-wrap cb-toolbar-inner">
                    <div class="cb-row cb-row--main">
                        <div class="cb-search">
                            ${icon('search')}
                            <input id="cb-search" type="search" autocomplete="off" spellcheck="false"
                                placeholder="Search cards" aria-label="Search ${esc(archetype)} card names, text and tags"
                                title="Search card names, card text and gameplay tags (press / to jump here)"
                                aria-keyshortcuts="/" value="${esc(state.q)}">
                            <kbd class="cb-kbd" aria-hidden="true">/</kbd>
                        </div>
                        <div class="cb-seg cb-zones" id="cb-zones" role="group" aria-label="Deck zone"></div>
                        <div class="cb-tools-right">
                            <button type="button" class="cb-btn cb-filters-btn" id="cb-filters-btn" data-action="open-filters"
                                aria-haspopup="dialog" aria-controls="cb-filters">
                                ${icon('sliders')}Filters<span class="cb-filter-count" id="cb-filter-count" hidden></span>
                            </button>
                            <p class="cb-shown" id="cb-shown" aria-hidden="true"></p>
                            <div class="cb-seg cb-seg--small cb-fmt-desktop" role="group" aria-label="Banlist format">
                                <span class="cb-seg-label" aria-hidden="true">Banlist</span>${fmtGroup}
                            </div>
                            <label class="cb-sort"><span class="cb-sort-text">Sort</span>
                                <select id="cb-sort">${SORTS.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}</select>
                            </label>
                            <div class="cb-seg cb-view" role="group" aria-label="View">
                                <button type="button" data-action="view" data-value="grid" aria-pressed="true">${icon('grid')}Grid</button>
                                <button type="button" data-action="view" data-value="list" aria-pressed="false">${icon('list')}List</button>
                            </div>
                        </div>
                    </div>

                    <div class="cb-filters" id="cb-filters">
                        <div class="cb-sheet-head">
                            <span class="cb-grabber" aria-hidden="true"></span>
                            <div class="cb-sheet-head-row">
                                <h2 class="cb-sheet-title" id="cb-filters-title" tabindex="-1">Filters</h2>
                                <button type="button" class="cb-link-btn" data-action="reset-filters">Reset</button>
                            </div>
                        </div>
                        <div class="cb-sheet-body">
                            <div class="cb-filter-group cb-fmt-mobile">
                                <span class="cb-label" id="cb-fmt-mobile-label">Banlist format</span>
                                <div class="cb-seg cb-seg--small" role="group" aria-labelledby="cb-fmt-mobile-label">${fmtGroup}</div>
                                <p class="cb-fmt-note" id="cb-fmt-note"></p>
                            </div>
                            <div class="cb-row cb-roles-row">
                                <span class="cb-label" id="cb-roles-label">Roles</span>
                                <div class="cb-chip-list" id="cb-roles" role="group" aria-labelledby="cb-roles-label"></div>
                                <span class="cb-divider" aria-hidden="true"></span>
                                <button type="button" class="cb-chip cb-chip--ghost cb-panel-toggle" id="cb-alltags-toggle"
                                    data-action="toggle-alltags" aria-expanded="false" aria-controls="cb-alltags">
                                    ${icon('tag')}All tags<span class="cb-count">${tagIndex.reduce((n, c) => n + c.tags.length, 0)}</span>
                                </button>
                                <button type="button" class="cb-chip cb-chip--ghost cb-panel-toggle cb-panel-toggle--more" id="cb-more-toggle"
                                    data-action="toggle-more" aria-expanded="false" aria-controls="cb-more">
                                    ${icon('sliders')}More filters
                                </button>
                                <div class="cb-seg cb-seg--small cb-match" id="cb-match" role="group" aria-label="Tag matching" hidden></div>
                            </div>
                            <div class="cb-panel cb-panel--tags" id="cb-alltags"></div>
                            <div class="cb-panel cb-panel--more" id="cb-more"></div>
                        </div>
                        <div class="cb-sheet-foot">
                            <button type="button" class="cb-btn cb-btn--primary" id="cb-apply" data-action="close-filters">Show cards</button>
                        </div>
                    </div>
                    <button type="button" class="cb-scrim cb-scrim--filters" data-action="close-filters" aria-label="Close filters" tabindex="-1"></button>

                    <div class="cb-row cb-status-row">
                        <p class="cb-status" id="cb-status" role="status" aria-live="polite"></p>
                        <button type="button" class="cb-link-btn cb-copy-names" data-action="copy-names"
                            title="Copy the names of the cards shown, one per line"><span>Copy names</span></button>
                        <span id="cb-active" style="display: contents"></span>
                    </div>
                </div>
            </div>`;
    }

    function bodyHtml() {
        const headers = `
            <tr>
                <th scope="col" class="cb-col-card" data-sort-col="name"><button type="button" data-action="sort-col" data-col="name">Card <span data-mark></span></button></th>
                <th scope="col" class="cb-col-type">Type</th>
                <th scope="col" class="cb-col-attr">Attribute</th>
                <th scope="col" class="cb-col-lv">Lv / Link</th>
                <th scope="col" class="cb-col-stats" data-sort-col="atk"><button type="button" data-action="sort-col" data-col="atk">ATK / DEF <span data-mark></span></button></th>
                <th scope="col" class="cb-col-date" data-sort-col="date"><button type="button" data-action="sort-col" data-col="date">Released <span data-mark></span></button></th>
                <th scope="col" class="cb-col-print">Print</th>
                <th scope="col" class="cb-col-ban" data-fmt-head>Banlist</th>
                <th scope="col" class="cb-col-roles">Roles</th>
            </tr>`;
        const sections = ZONES.map(z => `
            <section class="cb-section" data-zone="${z.key}" aria-labelledby="cb-h-${z.key}" hidden>
                <div class="cb-section-head">
                    <span class="cb-dot" style="background: ${z.dot}" aria-hidden="true"></span>
                    <h2 class="cb-h2" id="cb-h-${z.key}">${z.heading}</h2>
                    <span class="cb-section-count" data-count></span>
                </div>
                <div class="cb-grid" data-grid></div>
                <div class="cb-table-wrap" data-table hidden>
                    <table class="cb-table">
                        <caption class="cb-visually-hidden">${z.heading}</caption>
                        <thead>${headers}</thead>
                        <tbody data-rows></tbody>
                    </table>
                </div>
                <button type="button" class="cb-more-btn" data-action="section-more" data-zone="${z.key}" hidden></button>
            </section>`).join('');

        return `
            <div class="cb-wrap cb-body">
                <div class="cb-results" id="cb-results" tabindex="-1">
                    <div class="cb-empty" id="cb-empty" hidden>
                        <p class="cb-empty-title">No cards match these filters</p>
                        <p class="cb-empty-note">Try removing a tag, or switch tag matching to “any tag”.</p>
                        <button type="button" class="cb-btn cb-btn--primary" data-action="clear-all">Clear all filters</button>
                    </div>
                    ${sections}
                    ${anime.length ? animeHtml() : ''}
                </div>
                <div class="cb-detail" id="cb-detail" tabindex="-1" hidden></div>
            </div>
            <button type="button" class="cb-scrim cb-scrim--detail" data-action="close-card" aria-label="Close card details" tabindex="-1"></button>`;
    }

    function animeHtml() {
        return `
            <section class="cb-anime" id="cb-anime">
                <h2 class="cb-anime-heading">
                    <button type="button" class="cb-anime-toggle" data-action="toggle-anime" aria-expanded="false" aria-controls="cb-anime-list">
                        <span>Anime-only cards</span>
                        <span class="cb-section-count">${anime.length} never printed in the TCG or OCG</span>
                        ${icon('down')}
                    </button>
                </h2>
                <div class="cb-anime-list" id="cb-anime-list" hidden>
                    ${anime.map(a => `
                        <div class="cb-anime-item">
                            <p class="cb-anime-name">${esc(a.name)}</p>
                            <p>${esc(a.desc || 'No card text recorded.')}</p>
                        </div>`).join('')}
                </div>
            </section>`;
    }

    /** Re-render after any state change. Card tiles are reused, never rebuilt. */
    function update(opts) {
        if (!rendered) return;
        state.qLower = state.q.trim().toLowerCase();
        const phone = PHONE_QUERY.matches;
        const base = cards.filter(c => matchesBase(c));
        const tagged = base.filter(matchesTags);
        const results = tagged.filter(c => inZone(c, state.zone)).sort(comparator());

        const byZone = {};
        order = [];
        ZONES.forEach(z => {
            byZone[z.key] = results.filter(c => c.zone === z.key);
            order.push.apply(order, byZone[z.key]);
        });

        renderZones(tagged);
        renderFormatButtons();
        renderViewButtons(phone);
        renderRoles(base);
        renderAllTags(base);
        renderMore();
        renderMatch();
        fitRoles();
        renderStatus(results.length);
        renderSections(byZone, phone);
        renderSideBits(results.length);
        renderDetail(opts || {});
        syncSheets(phone);
        writeUrlState();
    }

    function renderZones(tagged) {
        const buttons = [{ key: 'all', label: 'All', short: 'All', count: tagged.length }]
            .concat(ZONES.filter(z => zoneTotals[z.key]).map(z => ({
                key: z.key, label: z.label, short: z.short, count: tagged.filter(c => c.zone === z.key).length
            })));
        renderInto($('cb-zones'), buttons.map(b => `
            <button type="button" data-action="zone" data-value="${b.key}" data-focus="zone:${b.key}" aria-pressed="${state.zone === b.key}">
                <span class="cb-zone-long">${b.label}</span><span class="cb-zone-short">${b.short}</span><span class="cb-count">${b.count}</span>
            </button>`).join(''));
    }

    function renderFormatButtons() {
        document.querySelectorAll('[data-fmt-group]').forEach(group => {
            renderInto(group, FORMATS.map(f => `
                <button type="button" data-action="fmt" data-value="${f.key}" data-focus="fmt:${f.key}"
                    aria-pressed="${state.fmt === f.key}" title="${f.name} banlist">${f.label}</button>`).join(''));
        });
        const name = FORMATS.find(f => f.key === state.fmt).name;
        document.querySelectorAll('[data-fmt-head]').forEach(th => { th.textContent = `${name} list`; });

        // Phones hide the header's banlist summary, so the sheet repeats it.
        const note = $('cb-fmt-note');
        if (note) {
            const loaded = banMaps && banMaps[state.fmt] && banMaps[state.fmt].loaded;
            const restricted = cards.filter(c => c.ban[state.fmt] !== 'Unlimited');
            note.textContent = !loaded
                ? `The ${name} banlist could not be loaded.`
                : restricted.length
                    ? `Restricted in the ${name}: ${restricted.map(c => `${c.name} (${c.ban[state.fmt]})`).join(', ')}.`
                    : `No ${archetype} cards are restricted in the ${name}.`;
        }
    }

    function renderViewButtons(phone) {
        document.querySelectorAll('.cb-view [data-action="view"]').forEach(btn => {
            btn.setAttribute('aria-pressed', String(btn.dataset.value === state.view));
        });
        const sort = $('cb-sort');
        if (sort && sort.value !== state.sort) sort.value = state.sort;
        // List view needs a wide screen; phones always get the grid.
        state.listActive = state.view === 'list' && !phone;
    }

    function renderRoles(base) {
        const pool = base.filter(c => inZone(c, state.zone));
        renderInto($('cb-roles'), quickRoles.map(n => chipHtml({
            action: 'tag', value: n, label: n, focus: `role:${n}`,
            pressed: state.tags.includes(n), count: pool.filter(c => c.tagNames.has(n)).length
        })).join(''));
    }

    /**
     * On wider screens the role chips stay on one line, so the sticky toolbar
     * stays short: chips that don't fit are hidden from the end (never one
     * that is selected). They are all still under "All tags". Phones show the
     * chips in the filters sheet, where they wrap.
     */
    function fitRoles() {
        const list = $('cb-roles');
        if (!list) return;
        const chips = [...list.children];
        chips.forEach(chip => { chip.hidden = false; });
        if (PHONE_QUERY.matches) return;
        const fits = () => list.scrollWidth <= list.clientWidth + 1;
        for (let i = chips.length - 1; i >= 0 && !fits(); i--) {
            if (chips[i].getAttribute('aria-pressed') !== 'true') chips[i].hidden = true;
        }
    }

    function renderAllTags(base) {
        const panel = $('cb-alltags');
        const toggle = $('cb-alltags-toggle');
        panel.classList.toggle('is-open', state.allTags);
        toggle.setAttribute('aria-expanded', String(state.allTags));
        if (!state.allTags) {
            panel.innerHTML = '';
            return;
        }
        const pool = base.filter(c => inZone(c, state.zone));
        renderInto(panel, tagIndex.map(cat => `
            <div class="cb-filter-group" role="group" aria-label="${esc(cat.label)} tags">
                <p class="cb-cat-label" style="color: ${cat.fg}">${esc(cat.label)}</p>
                <div class="cb-chip-list">
                    ${cat.tags.map(n => chipHtml({
            action: 'tag', value: n, label: n, focus: `tag:${n}`, small: true,
            pressed: state.tags.includes(n), count: pool.filter(c => c.tagNames.has(n)).length
        })).join('')}
                </div>
            </div>`).join(''));
    }

    function renderMore() {
        const panel = $('cb-more');
        panel.classList.toggle('is-open', state.more);
        $('cb-more-toggle').setAttribute('aria-expanded', String(state.more));
        // Phones show this panel inside the filters sheet whether or not it is "open".
        if (!state.more && !PHONE_QUERY.matches) {
            panel.innerHTML = '';
            return;
        }

        const groups = [];
        const attrs = distinct(cards.map(c => c.attr)).sort();
        if (attrs.length > 1) {
            groups.push(optionGroup('Attribute', 'attr', attrs.map(a => ({
                value: a, label: a, count: facetCount('attr', c => c.attr === a)
            }))));
        }
        const races = distinct(cards.map(c => c.race)).sort();
        if (races.length > 1) {
            groups.push(optionGroup('Monster type', 'race', races.map(r => ({
                value: r, label: r, count: facetCount('race', c => c.race === r)
            }))));
        }
        const prints = ['tcg', 'ocg', 'soon'].filter(p => cards.some(c => c.region === p));
        if (prints.length > 1) {
            groups.push(optionGroup('Print status', 'print', prints.map(p => ({
                value: p, label: PRINT_LABEL[p], count: facetCount('print', c => c.region === p)
            }))));
        }
        const eras = ERAS.filter(e => cards.some(c => inEra(c, e)));
        if (eras.length > 1) {
            groups.push(optionGroup('First released', 'era', eras.map(e => ({
                value: e.key, label: e.label, count: facetCount('era', c => inEra(c, e))
            }))));
        }
        if (cards.some(c => c.fresh)) {
            groups.push(`
                <label class="cb-check">
                    <input type="checkbox" data-action="fresh" data-focus="fresh" ${state.fresh ? 'checked' : ''}>
                    Only new and upcoming cards
                </label>`);
        }
        renderInto(panel, groups.join('') || '<p class="cb-status">No other filters apply to this archetype.</p>');
    }

    function optionGroup(title, key, options) {
        const chips = [{ value: '', label: 'Any' }].concat(options).map(o => chipHtml({
            action: 'option', key, value: o.value, label: o.label, count: o.count,
            pressed: state[key] === o.value, focus: `${key}:${o.value}`, small: true
        }));
        return `
            <div class="cb-filter-group" role="group" aria-label="${esc(title)}">
                <span class="cb-label">${esc(title)}</span>
                <div class="cb-chip-list">${chips.join('')}</div>
            </div>`;
    }

    function renderMatch() {
        const el = $('cb-match');
        el.hidden = state.tags.length < 2;
        if (el.hidden) return;
        renderInto(el, `
            <span class="cb-seg-label">Match</span>
            <button type="button" data-action="match" data-value="all" data-focus="match:all" aria-pressed="${state.match === 'all'}">all tags</button>
            <button type="button" data-action="match" data-value="any" data-focus="match:any" aria-pressed="${state.match === 'any'}">any tag</button>`);
    }

    function renderStatus(shown) {
        $('cb-status').innerHTML = `<strong>${shown}</strong> of ${cards.length} card${cards.length === 1 ? '' : 's'}`;
        $('cb-shown').innerHTML = `<strong>${shown}</strong> shown`;

        const chips = [];
        if (state.qLower) chips.push({ kind: 'q', value: '', label: `Text: “${state.q.trim()}”` });
        if (state.zone !== 'all') chips.push({ kind: 'zone', value: '', label: ZONES.find(z => z.key === state.zone).label });
        state.tags.forEach(t => chips.push({ kind: 'tag', value: t, label: t }));
        if (state.attr) chips.push({ kind: 'attr', value: '', label: state.attr });
        if (state.race) chips.push({ kind: 'race', value: '', label: state.race });
        if (state.print) chips.push({ kind: 'print', value: '', label: PRINT_LABEL[state.print] });
        if (state.era) chips.push({ kind: 'era', value: '', label: `Released ${ERAS.find(e => e.key === state.era).label}` });
        if (state.fresh) chips.push({ kind: 'fresh', value: '', label: 'New & upcoming' });
        if (state.names) chips.push({ kind: 'names', value: '', label: `Names: ${cardById.get(state.names).name}` });

        renderInto($('cb-active'), chips.map(ch => `
            <button type="button" class="cb-active" data-action="remove" data-kind="${ch.kind}" data-value="${esc(ch.value)}"
                data-focus="remove:${ch.kind}:${esc(ch.value)}" aria-label="Remove filter: ${esc(ch.label)}">
                ${esc(ch.label)}${icon('x')}
            </button>`).join('')
            + (chips.length ? '<button type="button" class="cb-link-btn" data-action="clear-all" data-focus="clear-all">Clear all</button>' : ''));

        const count = activeFilterCount();
        const badge = $('cb-filter-count');
        badge.hidden = count === 0;
        badge.textContent = String(count);
        $('cb-filters-btn').setAttribute('aria-label', count ? `Filters, ${count} active` : 'Filters');
        $('cb-apply').textContent = `Show ${shown} card${shown === 1 ? '' : 's'}`;
    }

    function renderSections(byZone, phone) {
        const isList = state.listActive;
        ZONES.forEach(z => {
            const section = document.querySelector(`.cb-section[data-zone="${z.key}"]`);
            if (!section) return;
            const items = byZone[z.key];
            section.hidden = items.length === 0;
            if (!items.length) return;

            section.querySelector('[data-count]').textContent = items.length === 1 ? '1 card' : `${items.length} cards`;
            const grid = section.querySelector('[data-grid]');
            const table = section.querySelector('[data-table]');
            grid.hidden = isList;
            table.hidden = !isList;
            if (isList) {
                section.querySelector('[data-rows]').replaceChildren.apply(section.querySelector('[data-rows]'), items.map(rowNode));
                syncSortHeaders(section);
            } else {
                grid.replaceChildren.apply(grid, items.map(tileNode));
            }

            const expandable = !isList && state.zone === 'all' && items.length > PHONE_PREVIEW;
            const expanded = !!state.expanded[z.key];
            section.classList.toggle('is-collapsed', expandable && !expanded);
            const more = section.querySelector('.cb-more-btn');
            more.hidden = !expandable || !phone;
            more.textContent = expanded ? 'Show fewer' : `Show all ${items.length}`;
            more.setAttribute('aria-expanded', String(expanded));
        });
    }

    function syncSortHeaders(section) {
        const sorts = {
            name: state.sort === 'name' ? 'ascending' : state.sort === 'name-desc' ? 'descending' : 'none',
            atk: state.sort === 'atk' ? 'descending' : 'none',
            date: state.sort === 'oldest' ? 'ascending' : state.sort === 'newest' ? 'descending' : 'none'
        };
        section.querySelectorAll('th[data-sort-col]').forEach(th => {
            const dir = sorts[th.dataset.sortCol];
            th.setAttribute('aria-sort', dir);
            th.querySelector('[data-mark]').textContent = dir === 'ascending' ? '↑' : dir === 'descending' ? '↓' : '';
        });
    }

    function renderSideBits(shown) {
        $('cb-empty').hidden = shown > 0 || !cards.length;

        const fresh = $('cb-fresh-btn');
        if (fresh) {
            fresh.setAttribute('aria-pressed', String(state.fresh));
            fresh.textContent = state.fresh ? 'Showing new & upcoming only' : 'Show only new & upcoming';
        }
        const rail = $('cb-newest');
        if (rail) rail.classList.toggle('is-hidden-phone', isFiltered());
        document.querySelectorAll('.cb-rail-card').forEach(btn => {
            btn.classList.toggle('is-selected', btn.dataset.id === state.card);
        });

        const animeSection = $('cb-anime');
        if (animeSection) animeSection.hidden = isFiltered();
    }

    function tileNode(c) {
        let el = tileCache.get(c.id);
        if (!el) {
            el = fromHtml(`
                <button type="button" class="cb-tile" data-action="open-card" data-id="${c.id}">
                    <span class="cb-art">
                        ${imgHtml(c)}
                        <span class="cb-art-badges" aria-hidden="true">${tileBadges(c).map(b => `<span class="cb-badge cb-badge--${b[0]}">${esc(b[1])}</span>`).join('')}</span>
                        <span class="cb-art-ban" aria-hidden="true" data-ban></span>
                    </span>
                    <span class="cb-tile-name cb-clamp2">${esc(c.name)}</span>
                    <span class="cb-visually-hidden" data-speech></span>
                    <span class="cb-tile-meta">${esc(c.meta)}</span>
                    <span class="cb-roles">${rolesHtml(c)}</span>
                </button>`);
            tileCache.set(c.id, el);
        }
        const selected = c.id === state.card;
        el.classList.toggle('is-selected', selected);
        if (selected) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
        if (el.dataset.fmt !== state.fmt) {
            const ban = c.ban[state.fmt];
            el.querySelector('[data-ban]').innerHTML = BAN_CLASS[ban] ? `<span class="cb-badge cb-badge--${BAN_CLASS[ban]}">${ban}</span>` : '';
            el.querySelector('[data-speech]').textContent = tileSpeech(c);
            el.dataset.fmt = state.fmt;
        }
        return el;
    }

    function rowNode(c) {
        let el = rowCache.get(c.id);
        if (!el) {
            const printClass = c.region === 'soon' ? ' cb-badge--soon' : c.region === 'ocg' ? ' cb-badge--ocg' : '';
            const print = c.region === 'soon' ? `OCG · TCG ${shortDate(c.tcg)}` : c.region === 'ocg' ? 'OCG only' : c.region === 'tcg' ? 'TCG & OCG' : '—';
            // When the table is narrow (the card panel is open) the Attribute and
            // Print columns hide and these inline copies take over.
            const inlinePrint = c.region === 'soon' || c.region === 'ocg'
                ? `<span class="cb-inline-print cb-badge cb-badge--${c.region}">${c.region === 'soon' ? `TCG ${shortDate(c.tcg)}` : 'OCG'}</span>` : '';
            el = fromHtml(`
                <table><tbody><tr data-id="${c.id}">
                    <td class="cb-col-card">
                        <button type="button" class="cb-row-card" data-action="open-card" data-id="${c.id}">
                            ${imgHtml(c)}<span>${esc(c.name)}${inlinePrint}</span>
                        </button>
                    </td>
                    <td class="cb-col-type">${esc(c.typeLine)}</td>
                    <td class="cb-col-attr">${esc(c.attr || '—')}</td>
                    <td class="cb-col-lv">${c.attr ? `<span class="cb-inline-attr">${esc(c.attr)} · </span>` : ''}${esc(c.stat || '—')}</td>
                    <td class="cb-col-stats cb-num">${esc(c.atkdef || '—')}</td>
                    <td class="cb-col-date cb-num">${esc(c.firstLabel)}</td>
                    <td class="cb-col-print"><span class="cb-print${printClass}">${esc(print)}</span></td>
                    <td class="cb-col-ban cb-ban-text" data-ban-text></td>
                    <td class="cb-col-roles"><span class="cb-roles">${rolesHtml(c)}</span></td>
                </tr></tbody></table>`).querySelector('tr');
            rowCache.set(c.id, el);
        }
        el.classList.toggle('is-selected', c.id === state.card);
        if (el.dataset.fmt !== state.fmt) {
            const ban = c.ban[state.fmt];
            const cell = el.querySelector('[data-ban-text]');
            cell.textContent = ban;
            cell.style.color = BAN_FG[ban];
            el.dataset.fmt = state.fmt;
        }
        return el;
    }

    function renderDetail(opts) {
        const panel = $('cb-detail');
        if (!panel) return;
        const c = state.card ? cardById.get(state.card) : null;
        document.body.classList.toggle('cb-detail-open', !!c);
        if (!c) {
            panel.hidden = true;
            panel.innerHTML = '';
            detailSignature = '';
            detailLayoutKey = '';
            return;
        }

        // A popover at the right on wider screens; a modal bottom sheet on phones.
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', String(PHONE_QUERY.matches));
        panel.setAttribute('aria-labelledby', 'cb-detail-title');

        const idx = order.findIndex(x => x.id === c.id);
        const signature = [c.id, c.name, state.fmt, state.tags.join('|'), idx, order.length, guideFile, state.qLower].join('#');
        const cardChanged = detailSignature.split('#')[0] !== c.id;
        panel.hidden = false;
        if (signature !== detailSignature) {
            renderInto(panel, detailHtml(c, idx));
            detailSignature = signature;
            if (cardChanged) $('cb-detail-inner').scrollTop = 0;
        }
        // Every update: opening a filter panel changes the toolbar's height.
        placeDetail(opts.reveal);
        if (opts.focusDetail) {
            const title = $('cb-detail-title');
            if (title) title.focus({ preventScroll: true });
        }
    }

    /**
     * On wider screens the panel floats over the cards at the right-hand side,
     * lined up with the right edge of the results and riding just under the
     * toolbar as the page scrolls. Phones get a bottom sheet (CSS).
     * @param {boolean} reveal - Scroll the card into view first (Previous/Next, links)
     */
    function placeDetail(reveal) {
        const panel = $('cb-detail');
        const inner = $('cb-detail-inner');
        if (!panel || panel.hidden || !inner) return;
        if (PHONE_QUERY.matches) {
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            inner.style.maxHeight = '';
            panel.style.removeProperty('--cb-main-w');
            inner.querySelectorAll('.cb-detail-main, .cb-detail-side').forEach(el => { el.style.columnCount = ''; });
            detailLayoutKey = '';
            return;
        }

        if (reveal) {
            const anchor = detailAnchor();
            if (anchor) revealAnchor(anchor);
        }
        const margin = 16;
        const vh = window.innerHeight;
        const toolbar = $('cb-toolbar');
        const results = $('cb-results');
        // Choosing the columns measures the panel up to three times, so only redo
        // it when the card, the window or the toolbar changes, not on every scroll.
        const key = [detailSignature, window.innerWidth, vh, toolbar ? toolbar.offsetHeight : 0].join('|');
        if (key !== detailLayoutKey) {
            layoutDetail(panel, inner);
            detailLayoutKey = key;
        }
        // Just under the toolbar when it fits there; otherwise as high as needed
        // to keep the whole panel on screen (it then covers the toolbar's edge).
        const barBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 0;
        const top = Math.max(margin, Math.min(barBottom + 12, vh - margin - panel.offsetHeight));
        const right = results ? results.getBoundingClientRect().right : document.documentElement.clientWidth - margin;
        panel.style.top = `${Math.round(top)}px`;
        panel.style.left = `${Math.round(Math.max(margin, right - panel.offsetWidth))}px`;
    }

    /**
     * The same layout for every card, so readers know where to look: card
     * details on the left, gameplay tags and what the effect does on the right.
     * Instead of scrolling, a side that is too tall for the screen splits into
     * two columns (on the left, the card text moves next to the art and
     * stats). The narrowest layout that fits wins; scrolling is a last resort.
     */
    function layoutDetail(panel, inner) {
        const margin = 16;
        const vh = window.innerHeight;
        const results = $('cb-results');
        const main = inner.querySelector('.cb-detail-main');
        const side = $('cb-detail-side');
        const room = results ? results.getBoundingClientRect().width : document.documentElement.clientWidth - 2 * margin;
        const onScreen = vh - 2 * margin;
        const span = n => n * DETAIL_COLUMN + (n - 1) * DETAIL_COLUMN_GAP;
        const apply = o => {
            panel.style.width = `${Math.min(o.width, room)}px`;
            panel.style.setProperty('--cb-main-w', `${span(o.main)}px`);
            if (main) main.style.columnCount = String(o.main);
            if (side) side.style.columnCount = String(o.side);
        };

        inner.style.maxHeight = 'none';
        const options = [[1, 1], [2, 1], [1, 2], [2, 2]]
            .map(([m, s]) => ({ main: m, side: s, width: span(m) + DETAIL_COLUMN_GAP + span(s) + DETAIL_PADDING }))
            .filter((o, i) => i === 0 || o.width <= room)
            .map(o => {
                apply(o);
                return Object.assign(o, { height: panel.offsetHeight });
            });
        const pick = options.find(o => o.height <= onScreen)
            || options.reduce((best, o) => (o.height < best.height ? o : best));
        apply(pick);
        if (pick.height > onScreen) inner.style.maxHeight = `${onScreen}px`;
    }

    /** The visible tile, list row or newest-support card for the open card. */
    function detailAnchor() {
        const id = state.card;
        const usable = el => el && el.isConnected && el.offsetParent !== null && el.dataset.id === id;
        if (usable(lastTrigger)) return lastTrigger;
        const inView = document.querySelector(state.listActive ? `.cb-row-card[data-id="${id}"]` : `.cb-tile[data-id="${id}"]`);
        if (usable(inView)) return inView;
        const rail = document.querySelector(`.cb-rail-card[data-id="${id}"]`);
        return usable(rail) ? rail : null;
    }

    function revealAnchor(anchor) {
        const r = anchor.getBoundingClientRect();
        const toolbar = $('cb-toolbar');
        // Cards in the results must clear the sticky toolbar; the newest row sits above it.
        const clear = anchor.closest('.cb-newest') || !toolbar ? 8 : toolbar.offsetHeight + 8;
        if (r.top < clear || r.bottom > window.innerHeight - 8) window.scrollBy(0, r.top - clear - 16);
    }

    /** Pointing at a tag lights up the actions it comes from, and the other way round. */
    function linkTags(e) {
        const panel = $('cb-detail');
        if (!panel || !e.target.closest) return;
        const chip = e.target.closest('[data-tag-link]');
        const action = e.target.closest('.cb-action');
        const tags = chip ? [chip.dataset.tagLink] : action ? action.dataset.tags.split('|') : null;
        panel.classList.toggle('is-linking', !!tags);
        panel.querySelectorAll('.cb-action').forEach(li => {
            li.classList.toggle('is-linked', !!tags && li.dataset.tags.split('|').some(t => tags.includes(t)));
        });
        panel.querySelectorAll('.cb-tag-group [data-tag-link]').forEach(btn => {
            btn.classList.toggle('is-linked', !!tags && tags.includes(btn.dataset.tagLink));
        });
    }

    function clearTagLinks() {
        const panel = $('cb-detail');
        if (!panel) return;
        panel.classList.remove('is-linking');
        panel.querySelectorAll('.is-linked').forEach(el => el.classList.remove('is-linked'));
    }

    function detailHtml(c, idx) {
        const head = headline(c);
        // Two compact lines rather than boxes: the left side is what decides
        // whether the panel fits on a small screen.
        const [atk, def] = c.atkdef.replace(/^ATK /, '').split(' / ');
        const stats = c.isMonster ? `
            <p class="cb-detail-stats">${[c.attr, `${c.statLabel} ${c.statValue}`, c.scale != null ? `Pendulum Scale ${c.scale}` : '']
                .filter(Boolean).map(esc).join(' · ')}</p>
            <p class="cb-detail-atk">ATK ${esc(atk)}${def != null ? ` <span aria-hidden="true">/</span> DEF ${esc(def)}` : ''}</p>` : '';

        const bans = FORMATS.map(f => {
            const status = c.ban[f.key];
            return `
                <div class="cb-ban-cell${f.key === state.fmt ? ' is-current' : ''}">
                    <span class="cb-ban-fmt">${f.name}</span>
                    <span class="cb-ban-status" style="color: ${BAN_FG[status]}">${status}</span>
                </div>`;
        }).join('');

        // Only actions that carry a gameplay tag; the same action listed twice is merged.
        const actionList = [];
        const actionByName = new Map();
        c.actions.forEach(a => {
            if (!a.tags.length) return;
            const known = actionByName.get(a.name);
            if (known) {
                a.tags.forEach(t => { if (!known.tags.includes(t)) known.tags.push(t); });
                return;
            }
            const copy = { name: a.name, tags: a.tags.slice() };
            actionByName.set(a.name, copy);
            actionList.push(copy);
        });
        const actionCount = {};
        actionList.forEach(a => a.tags.forEach(t => { actionCount[t] = (actionCount[t] || 0) + 1; }));
        const tagFg = n => CATEGORY_FG[c.tagMap.get(n)] || CATEGORY_FG.default;

        const groups = [];
        const byCat = new Map();
        c.tags.forEach(t => {
            if (!byCat.has(t.c)) {
                byCat.set(t.c, []);
                groups.push(t.c);
            }
            byCat.get(t.c).push(t.n);
        });
        const tagBlock = c.tags.length ? `
            <div class="cb-detail-block cb-detail-block--flow">
                <p class="cb-label">Gameplay tags <span class="cb-label-note">· select one to filter${actionList.length ? '<span class="cb-hover-note">, point at one to see where it comes from</span>' : ''}</span></p>
                ${groups.map(cat => `
                    <div class="cb-tag-group">
                        <span class="cb-tag-group-label" style="color: ${CATEGORY_FG[cat] || CATEGORY_FG.default}">${esc(CATEGORY_LABEL[cat] || titleCase(cat))}</span>
                        <div class="cb-chip-list">
                            ${byCat.get(cat).map(n => `<button type="button" class="cb-chip" data-action="tag" data-value="${esc(n)}" data-focus="dtag:${esc(n)}" data-tag-link="${esc(n)}" aria-pressed="${state.tags.includes(n)}">${esc(n)}${actionCount[n] ? `<span class="cb-count" aria-hidden="true">${actionCount[n]}</span><span class="cb-visually-hidden">, from ${actionCount[n]} action${actionCount[n] === 1 ? '' : 's'}</span>` : ''}</button>`).join('')}
                        </div>
                    </div>`).join('')}
            </div>` : '';

        const actions = actionList.length ? `
            <div class="cb-detail-block cb-detail-block--flow">
                <p class="cb-label">What the effect does <span class="cb-label-note">· each line with the tags it adds</span></p>
                <ul class="cb-actions">
                    ${actionList.map((a, i) => `
                        <li class="cb-action" data-tags="${esc(a.tags.join('|'))}">
                            <span class="cb-action-text">${highlight(a.name)}</span>
                            <span class="cb-action-tags">
                                ${a.tags.map(t => `<button type="button" class="cb-chip cb-chip--tiny" style="--cb-chip-fg: ${tagFg(t)}" data-action="tag" data-value="${esc(t)}" data-focus="atag:${i}:${esc(t)}" data-tag-link="${esc(t)}" aria-pressed="${state.tags.includes(t)}">${esc(t)}</button>`).join('')}
                            </span>
                        </li>`).join('')}
                </ul>
            </div>` : '';

        const guide = guideFile ? `
            <a class="cb-btn cb-btn--primary" href="${guideHref()}#:~:text=${textFragment(c.name)}">${icon('book')}<span>Find in deck guide</span></a>` : '';

        return `
            <div class="cb-detail-inner" id="cb-detail-inner">
            <span class="cb-grabber" aria-hidden="true"></span>
            <div class="cb-detail-nav">
                <span class="cb-detail-pos">${idx >= 0 ? `Card ${idx + 1} of ${order.length}` : 'Not in the current results'}</span>
                <button type="button" class="cb-btn cb-btn--icon" data-action="prev-card" data-focus="prev" aria-label="Previous card"${idx <= 0 ? ' disabled' : ''}>${icon('left')}</button>
                <button type="button" class="cb-btn cb-btn--icon" data-action="next-card" data-focus="next" aria-label="Next card"${idx < 0 || idx >= order.length - 1 ? ' disabled' : ''}>${icon('right')}</button>
                <button type="button" class="cb-btn cb-btn--icon" data-action="close-card" data-focus="close" aria-label="Close card details">${icon('x')}</button>
            </div>
            <div class="cb-detail-cols">
                <div class="cb-detail-main">
                    <div class="cb-detail-top">
                        <button type="button" class="cb-detail-art" data-action="full-art" data-focus="art" aria-label="Show the full art of ${esc(c.name)}">${imgHtml(c)}</button>
                        <div class="cb-detail-head">
                            ${head ? `<span class="cb-badge cb-badge--${head[0]}">${esc(head[1])}</span>` : ''}
                            <h2 class="cb-detail-name" id="cb-detail-title" tabindex="-1">${esc(c.name)}</h2>
                            <p class="cb-detail-type">${esc(c.typeLine)}</p>
                            ${stats}
                        </div>
                    </div>
                    <div class="cb-detail-block">
                        <p class="cb-label">Banlist</p>
                        <div class="cb-bans">${bans}</div>
                    </div>
                    <div class="cb-detail-block">
                        <p class="cb-label">Released</p>
                        <p class="cb-detail-release">${esc(c.release)}</p>
                    </div>
                    <div class="cb-detail-block">
                        <p class="cb-label">Card text</p>
                        <p class="cb-desc">${c.desc ? linkedText(c) : 'No card text recorded.'}</p>
                    </div>
                </div>
                <div class="cb-detail-side" id="cb-detail-side">
                    ${tagBlock || `
                    <div class="cb-detail-block">
                        <p class="cb-label">Gameplay tags</p>
                        <p class="cb-detail-none">No gameplay tags have been recorded for this card yet.</p>
                    </div>`}
                    ${actions}
                    ${namedByHtml(c)}
                </div>
            </div>
            <div class="cb-detail-actions">
                ${guide}
                <button type="button" class="cb-btn" data-action="copy-name" data-focus="copy">${icon('copy')}<span>Copy name</span></button>
                <button type="button" class="cb-btn" data-action="copy-link" data-focus="copy-link" title="A link to this card with the current filters">${icon('link')}<span>Copy link</span></button>
                <button type="button" class="cb-btn" data-action="full-art" data-focus="full-art">${icon('expand')}<span>Full art</span></button>
                <button type="button" class="cb-btn" data-action="more-info" data-focus="more-info">${icon('info')}<span>Printings and more</span></button>
            </div>
            <div class="cb-detail-steps">
                <button type="button" class="cb-btn" data-action="prev-card" data-focus="prev-bottom"${idx <= 0 ? ' disabled' : ''}>${icon('left')}Previous</button>
                <button type="button" class="cb-btn" data-action="next-card" data-focus="next-bottom"${idx < 0 || idx >= order.length - 1 ? ' disabled' : ''}>Next${icon('right')}</button>
            </div>
            </div>`;
    }

    /** Phone bottom sheets: dialog semantics, scroll lock, scrims. */
    function syncSheets(phone) {
        const toolbar = $('cb-toolbar');
        if (toolbar) toolbar.classList.toggle('has-open-panel', !phone && (state.allTags || state.more));

        const filtersOpen = phone && state.sheet === 'filters';
        if (!phone && state.sheet) state.sheet = '';
        document.body.classList.toggle('cb-filters-open', filtersOpen);
        const filters = $('cb-filters');
        if (filters) {
            if (phone) {
                filters.setAttribute('role', 'dialog');
                filters.setAttribute('aria-modal', 'true');
                filters.setAttribute('aria-labelledby', 'cb-filters-title');
                if (filtersOpen) filters.removeAttribute('aria-hidden'); else filters.setAttribute('aria-hidden', 'true');
            } else {
                ['role', 'aria-modal', 'aria-labelledby', 'aria-hidden'].forEach(a => filters.removeAttribute(a));
            }
        }
        const btn = $('cb-filters-btn');
        if (btn) btn.setAttribute('aria-expanded', String(filtersOpen));
        document.documentElement.classList.toggle('cb-sheet-lock', filtersOpen || (phone && !!state.card));
    }

    function renderAnime() {
        const toggle = document.querySelector('[data-action="toggle-anime"]');
        const list = $('cb-anime-list');
        if (!toggle || !list) return;
        toggle.setAttribute('aria-expanded', String(state.anime));
        list.hidden = !state.anime;
    }

    // ---------- Events ----------

    function bindEvents(container) {
        container.addEventListener('click', onClick);
        container.addEventListener('change', onChange);
        container.addEventListener('input', onInput);
        container.addEventListener('error', onImageError, true);
        // Capture phase, so this sees CardLoader's popup still open before its
        // own Escape handler hides it.
        window.addEventListener('keydown', onKeydown, true);
        if (PHONE_QUERY.addEventListener) PHONE_QUERY.addEventListener('change', () => update());
        else if (PHONE_QUERY.addListener) PHONE_QUERY.addListener(() => update());

        // The card popover closes on a click anywhere else, like a tooltip.
        document.addEventListener('click', onOutsideClick);
        let resizeFrame = 0;
        const replace = () => {
            if (!state.card) return;
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(() => placeDetail(false));
        };
        // The toolbar moves until it sticks, and the panel follows it.
        window.addEventListener('resize', replace);
        window.addEventListener('scroll', replace, { passive: true });
        let rolesFrame = 0;
        window.addEventListener('resize', () => {
            cancelAnimationFrame(rolesFrame);
            rolesFrame = requestAnimationFrame(fitRoles);
        });

        const panel = $('cb-detail');
        if (panel) {
            panel.addEventListener('mouseover', linkTags);
            panel.addEventListener('focusin', linkTags);
            panel.addEventListener('mouseleave', clearTagLinks);
            panel.addEventListener('focusout', e => {
                if (!panel.contains(e.relatedTarget)) clearTagLinks();
            });
            // Phones: swipe the card sheet sideways for the previous or next card.
            let touch = null;
            panel.addEventListener('touchstart', e => {
                touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
            }, { passive: true });
            panel.addEventListener('touchend', e => {
                if (!touch || !PHONE_QUERY.matches || !state.card) return;
                const dx = e.changedTouches[0].clientX - touch.x;
                const dy = e.changedTouches[0].clientY - touch.y;
                touch = null;
                if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
            }, { passive: true });
        }
    }

    function onOutsideClick(e) {
        if (!state.card || PHONE_QUERY.matches) return; // phones close the sheet with its backdrop
        // The path as it was when the click happened: re-renders may have detached the target since.
        const path = e.composedPath ? e.composedPath() : [];
        const panel = $('cb-detail');
        if (path.includes(panel)) return;
        if (path.some(n => n.dataset && n.dataset.action === 'open-card')) return;
        if (path.some(n => n.id === 'shared-card-popup' || n.id === 'large-image-modal')) return;
        closeCard(false);
    }

    function onClick(e) {
        const el = e.target.closest('[data-action]');
        if (!el || !e.currentTarget.contains(el) || el.disabled) return;
        const value = el.dataset.value;
        switch (el.dataset.action) {
            case 'zone': state.zone = value; break;
            case 'fmt': state.fmt = value; savePref(FORMAT_STORAGE_KEY, value); break;
            case 'view': state.view = value; savePref(VIEW_STORAGE_KEY, value); break;
            case 'tag': toggleTag(value); break;
            case 'option': state[el.dataset.key] = value; break;
            case 'match': state.match = value; break;
            case 'toggle-fresh': state.fresh = !state.fresh; break;
            case 'toggle-alltags': state.allTags = !state.allTags; if (state.allTags) state.more = false; break;
            case 'toggle-more': state.more = !state.more; if (state.more) state.allTags = false; break;
            case 'remove': removeFilter(el.dataset.kind, value); break;
            case 'clear-all': clearAll(); break;
            case 'reset-filters': resetFilters(); break;
            case 'section-more': state.expanded[el.dataset.zone] = !state.expanded[el.dataset.zone]; break;
            case 'sort-col': sortByColumn(el.dataset.col); break;
            case 'open-filters':
                lastTrigger = el;
                state.sheet = 'filters';
                update();
                focusLater($('cb-filters-title'));
                return;
            case 'close-filters': closeFilters(); return;
            case 'open-card': openCard(el.dataset.id, el); return;
            case 'close-card': closeCard(); return;
            case 'prev-card': step(-1); return;
            case 'next-card': step(1); return;
            case 'toggle-anime': state.anime = !state.anime; renderAnime(); return;
            case 'copy-name': withCard(c => copyText(el, c.name)); return;
            case 'copy-link': copyText(el, location.href); return;
            case 'copy-names': copyText(el, order.map(c => c.name).join('\n')); return;
            case 'filter-names': state.names = value; state.zone = 'all'; break;
            case 'full-art': withCard(c => CardLoader.showLargeImageByName && CardLoader.showLargeImageByName(c.name, e)); return;
            case 'more-info': withCard(c => CardLoader.showPopupByName && CardLoader.showPopupByName(c.name, e)); return;
            default: return;
        }
        update();
    }

    function onChange(e) {
        const el = e.target;
        if (el.id === 'cb-sort') {
            state.sort = el.value;
            update();
        } else if (el.dataset.action === 'fresh') {
            state.fresh = el.checked;
            update();
        }
    }

    function onInput(e) {
        if (e.target.id !== 'cb-search') return;
        const value = e.target.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.q = value;
            update();
        }, 150);
    }

    function onImageError(e) {
        const img = e.target;
        if (!img || img.tagName !== 'IMG' || !img.dataset.fallback || img.dataset.failed) return;
        img.dataset.failed = '1';
        img.src = img.dataset.fallback;
    }

    function onKeydown(e) {
        if (!rendered) return;
        const phone = PHONE_QUERY.matches;
        const active = document.activeElement;
        const typing = !!active && (/^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName) || active.isContentEditable);

        // "/" jumps to the search box, as on many sites; Escape in it clears the search first.
        if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !(phone && state.sheet)) {
            const input = $('cb-search');
            if (input) {
                e.preventDefault();
                input.focus();
                input.select();
            }
            return;
        }
        if (e.key === 'Escape' && active && active.id === 'cb-search' && active.value) {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(searchTimer);
            setSearch('');
            update();
            return;
        }

        if (e.key === 'Escape') {
            // CardLoader's own popup and full-art modal close on Escape first.
            const popup = $('shared-card-popup');
            const modal = $('large-image-modal');
            if ((popup && popup.style.display === 'block' && popup.style.opacity !== '0')
                || (modal && !modal.classList.contains('opacity-0'))) return;
            if (phone && state.sheet === 'filters') {
                e.preventDefault();
                closeFilters();
            } else if (state.card) {
                e.preventDefault();
                closeCard();
            }
            return;
        }
        if (e.key === 'Tab' && phone) {
            trapFocus(e, phone);
            return;
        }
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && state.card) {
            const panel = $('cb-detail');
            const active = document.activeElement;
            if (panel && panel.contains(active) && !/^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)) {
                e.preventDefault();
                step(e.key === 'ArrowLeft' ? -1 : 1);
            }
        }
    }

    function trapFocus(e, phone) {
        const sheet = phone && state.sheet === 'filters' ? $('cb-filters') : state.card ? $('cb-detail') : null;
        if (!sheet) return;
        const items = [...sheet.querySelectorAll('button:not([disabled]), a[href], input, select, summary')]
            .filter(el => el.offsetParent !== null && el.getAttribute('tabindex') !== '-1');
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!sheet.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function toggleTag(name) {
        state.tags = state.tags.includes(name) ? state.tags.filter(t => t !== name) : state.tags.concat([name]);
    }

    function removeFilter(kind, value) {
        if (kind === 'tag') toggleTag(value);
        else if (kind === 'q') setSearch('');
        else if (kind === 'zone') state.zone = 'all';
        else if (kind === 'fresh') state.fresh = false;
        else if (kind in state) state[kind] = '';
    }

    function clearAll() {
        setSearch('');
        state.zone = 'all';
        state.match = 'all';
        resetFilters();
    }

    function resetFilters() {
        state.tags = [];
        state.attr = '';
        state.race = '';
        state.print = '';
        state.era = '';
        state.fresh = false;
        state.names = '';
    }

    function setSearch(value) {
        state.q = value;
        const input = $('cb-search');
        if (input) input.value = value;
    }

    function sortByColumn(col) {
        if (col === 'name') state.sort = state.sort === 'name' ? 'name-desc' : 'name';
        else if (col === 'date') state.sort = state.sort === 'newest' ? 'oldest' : 'newest';
        else if (col === 'atk') state.sort = 'atk';
    }

    function closeFilters() {
        state.sheet = '';
        update();
        focusLater(lastTrigger && document.body.contains(lastTrigger) ? lastTrigger : $('cb-filters-btn'));
    }

    function openCard(id, trigger) {
        if (!cardById.has(id)) return;
        if (trigger) lastTrigger = trigger;
        state.card = id;
        update({ focusDetail: true, reveal: true });
    }

    /** @param {boolean} [restoreFocus=true] - false when a click elsewhere closed it */
    function closeCard(restoreFocus) {
        const id = state.card;
        state.card = '';
        update();
        if (restoreFocus === false) return;
        const target = (lastTrigger && document.body.contains(lastTrigger) && lastTrigger.dataset.id === id)
            ? lastTrigger
            : document.querySelector(`.cb-tile[data-id="${id}"], .cb-row-card[data-id="${id}"]`);
        focusLater(target);
    }

    function step(dir) {
        const idx = order.findIndex(c => c.id === state.card);
        const next = order[idx + dir];
        if (idx < 0 || !next) return;
        state.card = next.id;
        lastTrigger = null;
        update({ reveal: true });
        if (!$('cb-detail').contains(document.activeElement)) focusLater($('cb-detail-title'));
    }

    function withCard(fn) {
        const c = cardById.get(state.card);
        if (c) fn(c);
    }

    /** Copy to the clipboard and say so on the button for a moment. */
    function copyText(btn, text) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) return;
        const label = btn.querySelector('span');
        const original = label ? label.textContent : '';
        navigator.clipboard.writeText(text).then(() => {
            if (!label) return;
            label.textContent = 'Copied';
            setTimeout(() => { label.textContent = original; }, 1500);
        }).catch(() => { });
    }

    /**
     * Which archetype cards each card names in its text ("…add 1 "Blue-Eyes
     * White Dragon" from your Deck…") and, the other way round, which cards
     * name it. A card naming itself (its once-per-turn line) doesn't count.
     */
    function buildMentions() {
        cardByName = new Map();
        cards.forEach(c => [c.name].concat(c.altNames).forEach(n => cardByName.set(n.toLowerCase(), c)));
        cards.forEach(c => { c.namedBy = []; });
        cards.forEach(c => {
            const named = new Set();
            for (const m of (c.desc || '').matchAll(QUOTED_NAME)) {
                const target = cardByName.get(m[1].toLowerCase());
                if (target && target !== c) named.add(target);
            }
            c.nameIds = new Set([...named].map(t => t.id));
            named.forEach(target => target.namedBy.push(c));
        });
        // Newest support first.
        cards.forEach(c => c.namedBy.sort((a, b) => (b.latest || '').localeCompare(a.latest || '') || a.name.localeCompare(b.name)));
    }

    /** Card text with the archetype cards it names turned into links that open them. */
    function linkedText(c) {
        const text = c.desc;
        let out = '';
        let from = 0;
        for (const m of text.matchAll(QUOTED_NAME)) {
            const target = cardByName.get(m[1].toLowerCase());
            if (!target || target === c) continue;
            const start = m.index + 1;
            out += highlight(text.slice(from, start));
            out += `<button type="button" class="cb-text-link" data-action="open-card" data-id="${target.id}" data-focus="name:${start}" title="Open ${esc(target.name)}">${highlight(m[1])}</button>`;
            from = start + m[1].length;
        }
        return out + highlight(text.slice(from));
    }

    /**
     * "Named by": the archetype cards whose text names this one, newest first,
     * each with the part of its text that names it, so readers can see how it
     * is used (searched, summoned, a Fusion Material, treated as...).
     */
    function namedByHtml(c) {
        const list = c.namedBy || [];
        if (!list.length) return '';
        const shown = list.slice(0, NAMED_BY_LIMIT);
        const words = { main: ['Main Deck', 'Main Deck'], extra: ['Extra Deck', 'Extra Deck'], spell: ['Spell', 'Spells'], trap: ['Trap', 'Traps'] };
        const breakdown = ZONES.map(z => {
            const n = list.filter(t => t.zone === z.key).length;
            return n ? `${n} ${words[z.key][n === 1 ? 0 : 1]}` : '';
        }).filter(Boolean).join(' · ');
        const more = list.length > shown.length ? `Show all ${list.length} in the grid` : `Show ${list.length === 1 ? 'it' : 'them'} in the grid`;
        return `
            <div class="cb-detail-block cb-detail-block--flow">
                <p class="cb-label">Named by ${list.length} card${list.length === 1 ? '' : 's'} <span class="cb-label-note">· newest first</span></p>
                <p class="cb-namedby-breakdown">${breakdown}</p>
                <ul class="cb-namers">
                    ${shown.map(t => `
                        <li>
                            <button type="button" class="cb-namer" data-action="open-card" data-id="${t.id}" data-focus="namedby:${t.id}">
                                ${imgHtml(t)}
                                <span class="cb-namer-text">
                                    <span class="cb-namer-name">${esc(t.name)}</span>
                                    <span class="cb-namer-how">${mentionSnippet(t.desc || '', c)}</span>
                                </span>
                            </button>
                        </li>`).join('')}
                </ul>
                ${state.names === c.id
            ? '<p class="cb-namedby-breakdown">They are the cards shown in the grid now.</p>'
            : `<button type="button" class="cb-link-btn cb-namedby-all" data-action="filter-names" data-value="${c.id}" data-focus="namedby-all">${more}</button>`}
            </div>`;
    }

    /**
     * The part of a card's text where it names another card, cut to its clause
     * and cropped around the name, with the name in bold:
     * '...add 1 "Blue-Eyes White Dragon" from your Deck to your hand.'
     */
    function mentionSnippet(text, target) {
        const names = [target.name].concat(target.altNames).map(n => n.toLowerCase());
        let at = -1;
        let len = 0;
        for (const m of text.matchAll(QUOTED_NAME)) {
            if (names.includes(m[1].toLowerCase())) {
                at = m.index;
                len = m[0].length;
                break;
            }
        }
        if (at < 0) return '';
        const stop = ch => '.;:\n'.includes(ch);
        let start = at;
        while (start > 0 && !stop(text[start - 1])) start--;
        let end = at + len;
        while (end < text.length && !stop(text[end])) end++;
        if (end < text.length && text[end] === '.') end++;
        // Crop a long clause around the name, at word boundaries.
        let pre = '';
        let post = '';
        const before = text.lastIndexOf(' ', at - 36);
        if (at - start > 40 && before > start && before < at) {
            start = before + 1;
            pre = '…';
        }
        const after = text.lastIndexOf(' ', at + len + 50);
        if (end - (at + len) > 56 && after > at + len) {
            end = after;
            post = '…';
        }
        return `${pre}${esc(text.slice(start, at).trimStart())}<strong>${esc(text.slice(at, at + len))}</strong>${esc(text.slice(at + len, end).trimEnd())}${post}`;
    }

    /** Escape text for HTML and mark where the current search matches it. */
    function highlight(text) {
        const q = state.qLower;
        if (!q || q.length < 2) return esc(text);
        const lower = text.toLowerCase();
        let out = '';
        let from = 0;
        let at = lower.indexOf(q);
        while (at !== -1) {
            out += `${esc(text.slice(from, at))}<mark class="cb-mark">${esc(text.slice(at, at + q.length))}</mark>`;
            from = at + q.length;
            at = lower.indexOf(q, from);
        }
        return out + esc(text.slice(from));
    }

    // ---------- Deck guide link, Follow ----------

    /**
     * The archetype's own page: the `from` parameter the deck pages add to
     * their Cards link, else the referrer, else a guess at the usual names.
     */
    async function resolveGuideLink() {
        const params = new URLSearchParams(location.search);
        let file = cleanPageFile(params.get('from'));

        if (!file && document.referrer) {
            try {
                const ref = new URL(document.referrer);
                const name = cleanPageFile(decodeURIComponent(ref.pathname.split('/').pop() || ''));
                if (ref.origin === location.origin && /\/pages\//.test(ref.pathname) && name
                    && slug(name).startsWith(slug(archetype))) {
                    file = name;
                }
            } catch (_) { /* unusable referrer */ }
        }

        if (!file) {
            for (const guess of [`${archetype} Deck Analysis.html`, `${archetype} Archetype Breakdown.html`, `${archetype} Archetype Deep Dive.html`]) {
                try {
                    const resp = await fetch(encodeURIComponent(guess), { method: 'HEAD' });
                    if (resp.ok) {
                        file = guess;
                        break;
                    }
                } catch (_) { /* try the next name */ }
            }
        }
        if (!file) return;

        guideFile = file;
        // Phones swap the home button for a "Deck guide" back link.
        document.body.classList.add('cb-has-guide');
        const link = $('cb-guide-link');
        if (link) {
            link.href = guideHref();
            const text = link.querySelector('.cb-btn-text');
            if (text) text.textContent = `${archetype} deck guide`;
            link.hidden = false;
        }
        const crumb = $('cb-crumb-archetype');
        if (crumb && crumb.tagName !== 'A') {
            const a = document.createElement('a');
            a.id = 'cb-crumb-archetype';
            a.href = guideHref();
            a.textContent = archetype;
            crumb.replaceWith(a);
        }
        if (rendered && state.card) {
            detailSignature = '';
            renderDetail({});
        }
    }

    /**
     * A page in pages/, as a file name ("Blue-Eyes Deck Analysis.html") or as
     * the clean URL Netlify serves it under ("blue-eyes-deck-analysis").
     */
    function cleanPageFile(name) {
        if (!name) return '';
        const file = String(name).trim();
        if (!/^[^/\\?#]+$/.test(file) || !(/\.html$/i.test(file) || !file.includes('.'))) return '';
        if (/^card-browser(\.html)?$/i.test(file)) return '';
        return file;
    }

    /** "Elemental HERO", "Elemental%20HERO" and "elemental-hero" all compare equal. */
    function slug(text) {
        return String(text).toLowerCase().replace(/[\s_-]+/g, '-');
    }

    function guideHref() {
        return encodeURIComponent(guideFile);
    }

    async function initFollow() {
        const btn = $('cb-follow');
        const api = window.FollowArchetypes;
        if (!btn || !api || typeof api.findArchetype !== 'function' || !window.Auth) return;

        let row = null;
        try {
            row = await api.findArchetype(archetype);
        } catch (_) { /* no follow button */ }
        if (!row) return;

        let following = false;
        const label = btn.querySelector('.cb-btn-text');
        const paint = () => {
            btn.classList.toggle('is-following', following);
            if (label) label.textContent = following ? 'Following' : 'Follow';
            btn.setAttribute('aria-label', `${following ? 'Following' : 'Follow'} ${archetype}`);
            btn.title = following
                ? 'Following: new support shows up in My Account'
                : 'Follow to get notified about new support';
        };
        paint();
        btn.hidden = false;

        try {
            const session = await window.Auth.getSession();
            if (session) {
                following = await api.isFollowing(row.archetypeid);
                paint();
            }
        } catch (_) { /* stays "Follow" */ }

        btn.addEventListener('click', async () => {
            const session = await window.Auth.getSession();
            if (!session) {
                window.Auth.signInWithDiscord(location.href);
                return;
            }
            btn.disabled = true;
            try {
                if (following) await api.unfollow(row.archetypeid);
                else await api.follow(row.archetypeid);
                following = !following;
                paint();
            } catch (err) {
                console.error('[CardBrowser] Follow toggle failed:', err);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // ---------- URL state ----------

    function readUrlState() {
        const p = new URLSearchParams(location.search);
        state.q = (p.get('q') || '').slice(0, 100);
        state.zone = oneOf(p.get('zone'), ['all'].concat(ZONES.map(z => z.key)), 'all');
        state.tags = (p.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 12);
        state.match = oneOf(p.get('match'), ['all', 'any'], 'all');
        state.attr = (p.get('attr') || '').toUpperCase();
        state.race = p.get('type') || '';
        state.print = oneOf(p.get('print'), Object.keys(PRINT_LABEL), '');
        state.era = oneOf(p.get('era'), ERAS.map(e => e.key), '');
        state.fresh = p.get('new') === '1';
        state.sort = oneOf(p.get('sort'), SORTS.map(s => s.key), 'name');
        state.view = oneOf(p.get('view'), ['grid', 'list'], readPref(VIEW_STORAGE_KEY) || 'grid');
        state.fmt = oneOf(p.get('fmt'), FORMATS.map(f => f.key), readPref(FORMAT_STORAGE_KEY) || 'tcg');
        state.card = /^\d+$/.test(p.get('card') || '') ? p.get('card') : '';
        state.names = /^\d+$/.test(p.get('names') || '') ? p.get('names') : '';
    }

    function writeUrlState() {
        const p = new URLSearchParams(location.search);
        const put = (key, value, fallback) => {
            if (value && value !== fallback) p.set(key, value);
            else p.delete(key);
        };
        put('q', state.q.trim());
        put('zone', state.zone, 'all');
        put('tags', state.tags.join(','));
        put('match', state.tags.length > 1 ? state.match : '', 'all');
        put('attr', state.attr);
        put('type', state.race);
        put('print', state.print);
        put('era', state.era);
        put('new', state.fresh ? '1' : '');
        put('sort', state.sort, 'name');
        put('view', state.view, 'grid');
        put('fmt', state.fmt, 'tcg');
        put('card', state.card);
        put('names', state.names);
        const qs = p.toString();
        const next = `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`;
        if (next !== `${location.pathname}${location.search}${location.hash}`) {
            history.replaceState(history.state, '', next);
        }
    }

    function readPref(key) {
        try {
            return localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function savePref(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (_) { /* private mode */ }
    }

    // ---------- Small helpers ----------

    function $(id) {
        return document.getElementById(id);
    }

    function setText(id, text) {
        const el = $(id);
        if (el) el.textContent = text;
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function icon(name) {
        return `<svg class="cb-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
    }

    function fromHtml(html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html.trim();
        return tpl.content.firstElementChild;
    }

    /** Replace a container's HTML and keep keyboard focus on the same control. */
    function renderInto(el, html) {
        if (!el) return;
        const active = document.activeElement;
        const key = active && el.contains(active) ? active.getAttribute('data-focus') : null;
        el.innerHTML = html;
        if (key) {
            const next = [...el.querySelectorAll('[data-focus]')].find(n => n.getAttribute('data-focus') === key);
            if (next && !next.disabled) next.focus({ preventScroll: true });
        }
    }

    function focusLater(el) {
        if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }));
    }

    function chipHtml(o) {
        const attrs = o.action === 'option' ? ` data-key="${o.key}"` : '';
        return `<button type="button" class="cb-chip${o.small ? ' cb-chip--small' : ''}${!o.pressed && o.count === 0 ? ' is-zero' : ''}"
            data-action="${o.action}"${attrs} data-value="${esc(o.value)}" data-focus="${esc(o.focus)}" aria-pressed="${!!o.pressed}">${esc(o.label)}${o.count != null ? `<span class="cb-count">${o.count}</span>` : ''}</button>`;
    }

    function rolesHtml(c) {
        return c.roles.map(r => {
            const cat = c.tagMap.get(r);
            return `<span class="cb-role" style="color: ${CATEGORY_FG[cat] || CATEGORY_FG.default}">${esc(r)}</span>`;
        }).join('');
    }

    function imgHtml(c) {
        return `<img src="${imageBase()}/${c.id}.png" alt="" loading="lazy" decoding="async" data-fallback="${FALLBACK_IMAGE_BASE}/${c.id}.jpg">`;
    }

    function imageBase() {
        return (utils.CONFIG && utils.CONFIG.IMAGE_BASE_URL) || DEFAULT_IMAGE_BASE;
    }

    function tileBadges(c) {
        const badges = [];
        if (c.region === 'soon') badges.push(['soon', `TCG ${shortDate(c.tcg)}`]);
        if (c.isNew || c.debut) badges.push(['new', 'NEW']);
        if (c.region === 'ocg') badges.push(['ocg', 'OCG']);
        return badges;
    }

    function tileSpeech(c) {
        const parts = [];
        if (c.region === 'soon') parts.push(`coming to the TCG on ${longDate(c.tcg)}`);
        if (c.isNew) parts.push('new card');
        if (c.debut) parts.push('new to the TCG');
        if (c.region === 'ocg') parts.push('OCG only');
        const ban = c.ban[state.fmt];
        if (BAN_CLASS[ban]) parts.push(`${ban} in ${FORMATS.find(f => f.key === state.fmt).name}`);
        return parts.length ? `, ${parts.join(', ')}` : '';
    }

    /** [style, long label, short label] for the newest rail and the details panel. */
    function headline(c) {
        if (c.region === 'soon') return ['soon', `Coming to TCG ${shortDate(c.tcg)}`, `TCG ${shortDate(c.tcg)}`];
        if (c.isNew && c.region === 'ocg') return ['new', 'New · OCG only', 'NEW · OCG'];
        if (c.isNew) return ['new', 'New', 'NEW'];
        if (c.debut || c.recentDebut) return ['debut', 'TCG debut', 'TCG debut'];
        if (c.region === 'ocg') return ['ocg', 'OCG only', 'OCG'];
        return null;
    }

    /** Text-fragment links need -, & and , escaped on top of URI encoding. */
    function textFragment(text) {
        return encodeURIComponent(text).replace(/-/g, '%2D');
    }

    function categoryRank(cat) {
        const i = CATEGORY_ORDER.indexOf(cat);
        return i < 0 ? CATEGORY_ORDER.length - 1 : i;
    }

    function titleCase(s) {
        return String(s).charAt(0).toUpperCase() + String(s).slice(1);
    }

    function distinct(list) {
        return [...new Set(list.filter(Boolean))];
    }

    function chunk(list, size) {
        const out = [];
        for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
        return out;
    }

    function oneOf(value, allowed, fallback) {
        return allowed.includes(value) ? value : fallback;
    }

    function statNum(v) {
        return v == null || v < 0 ? '?' : String(v);
    }

    function dateOnly(value) {
        if (!value) return '';
        const s = String(value).slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        if (/^\d{4}$/.test(String(value).trim())) return `${String(value).trim()}-12-31`;
        return '';
    }

    function isoDate(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function addMonths(d, months) {
        const copy = new Date(d.getTime());
        copy.setMonth(copy.getMonth() + months);
        return copy;
    }

    function longDate(iso) {
        return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
    }

    function shortDate(iso) {
        return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
    }

    function monthYear(iso) {
        return `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
    }

    return {
        initCardBrowserPage
    };
})();
