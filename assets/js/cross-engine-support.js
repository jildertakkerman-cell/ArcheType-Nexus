/**
 * cross-engine-support.js — renders "New Support / Cross-Engine" panels for
 * cards that support more than one archetype, from window.CrossEngineData
 * (see cross-engine-data.js).
 *
 * One dataset, two presentations, so archetype pages never drift apart:
 *   - variant "full"   — the complete analysis (a page section or a tab view)
 *   - variant "teaser" — a compact highlight that jumps to the full panel
 *
 * Usage: drop a mount point anywhere on a page; it renders on DOMContentLoaded.
 *
 *   <div data-cross-engine="beyond-the-brave" data-perspective="archfiend"></div>
 *   <div data-cross-engine="beyond-the-brave" data-perspective="red-eyes"
 *        data-variant="teaser" data-xe-target="cross-engine"></div>
 *
 * `data-xe-target` is the id the teaser jumps to. If the target sits in a tab,
 * that tab is opened first: a guide-tabs.js tab ([role="tab"][aria-controls])
 * or a legacy control (#btn-<target> or onclick="switchTab('<target>')").
 *
 * A release can spotlight one card or two: `partner` and `burst` are optional.
 * A perspective can hide the release's shared burst with `showBurst: false`, and
 * a Spell/Trap card entry leaves out `atk`/`def`.
 *
 * Card images and popups go through CardLoader when it is on the page;
 * without it the panel still renders, with named placeholders. A panel mounted
 * inside a [hidden] tab panel fetches its art the first time it is shown.
 */
(function () {
    'use strict';

    var mountCount = 0;

    // ---------------------------------------------------------------- helpers

    function esc(value) {
        return String(value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    // Escape first, then apply the data file's markup-lite ([[Card]], **b**, *i*).
    function inline(text) {
        return esc(text)
            .replace(/\[\[(.+?)\]\]/g, function (_, name) {
                return '<button type="button" class="xe-ref" data-xe-card="' + name + '">' + name + '</button>';
            })
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    function slug(text) {
        return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function formatNumber(n) {
        return Number(n).toLocaleString('en-US');
    }

    function formatDate(iso) {
        var parts = iso.split('-').map(Number);
        var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    }

    function isPast(iso) {
        var parts = iso.split('-').map(Number);
        return Date.now() >= Date.UTC(parts[0], parts[1] - 1, parts[2]);
    }

    /**
     * Collects image slots while a panel's HTML is built, so every slot can be
     * handed to CardLoader in one call once the markup is in the DOM.
     */
    function ArtRegistry(uid) {
        this.uid = uid;
        this.slots = {};
        this.count = 0;
    }

    ArtRegistry.prototype.slot = function (cardName, className) {
        var id = 'xe-' + this.uid + '-art-' + (this.count++) + '-' + slug(cardName);
        this.slots[id] = cardName;
        return '<div class="xe-art ' + (className || '') + '" id="' + id + '">' +
            '<span class="xe-art__name">' + esc(cardName) + '</span></div>';
    };

    ArtRegistry.prototype.load = function () {
        if (window.CardLoader && typeof window.CardLoader.loadCards === 'function') {
            window.CardLoader.loadCards(this.slots);
        }
    };

    // Runs fn once el is no longer inside a [hidden] ancestor (e.g. a closed tab).
    function whenShown(el, fn) {
        var hiddenAncestor = el.closest('[hidden]');
        if (!hiddenAncestor || typeof MutationObserver !== 'function') {
            fn();
            return;
        }
        var observer = new MutationObserver(function () {
            if (hiddenAncestor.hidden) return;
            observer.disconnect();
            whenShown(el, fn);
        });
        observer.observe(hiddenAncestor, { attributes: true, attributeFilter: ['hidden'] });
    }

    // Set name, plus the set code only for releases whose data still carries one.
    function setLabel(set) {
        return set.code ? set.name + ' · ' + set.code : set.name;
    }

    // --------------------------------------------------------------- sections

    function sectionOpen(uid, key, title, extraClass) {
        var id = 'xe-' + uid + '-' + key;
        return '<section class="xe-block ' + (extraClass || '') + '" aria-labelledby="' + id + '">' +
            '<h3 class="xe-h3" id="' + id + '">' + inline(title) + '</h3>';
    }

    function renderHero(uid, set, p) {
        var tcgStatus = isPast(set.tcgDate)
            ? 'TCG: legal since ' + formatDate(set.tcgDate)
            : 'TCG: releases ' + formatDate(set.tcgDate);

        return '<header class="xe-hero">' +
            '<p class="xe-kicker"><span class="xe-new-pill">New</span>' + esc(p.kicker) + '</p>' +
            '<h2 class="xe-title" id="xe-' + uid + '-title">' + esc(p.title) + '</h2>' +
            '<p class="xe-lede">' + inline(p.lede) + '</p>' +
            '<ul class="xe-chips" aria-label="Release">' +
                '<li class="xe-chip">' + esc(setLabel(set)) + '</li>' +
                '<li class="xe-chip">OCG: ' + formatDate(set.ocgDate) +
                    (set.ocgNote ? ' · ' + esc(set.ocgNote) : '') + '</li>' +
                '<li class="xe-chip xe-chip--status">' + tcgStatus + '</li>' +
            '</ul>' +
        '</header>';
    }

    function renderDossier(card, role, note, art) {
        var effects = card.effects.map(function (fx) {
            return '<li class="xe-effect">' +
                '<span class="xe-effect__tag">' + esc(fx.tag) + '</span>' +
                '<div class="xe-effect__body">' +
                    '<p class="xe-effect__label">' + esc(fx.label) + '</p>' +
                    '<p class="xe-effect__text">' + inline(fx.text) + '</p>' +
                '</div>' +
            '</li>';
        }).join('');

        var facts = card.facts.map(function (f) { return '<li>' + inline(f) + '</li>'; }).join('');
        var stats = card.statline.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
        // One archetype, or several for a card that counts as more than one.
        var archetypes = [].concat(card.archetype).map(function (a) { return '“' + esc(a) + '”'; }).join(' + ');

        return '<article class="xe-dossier xe-dossier--' + (role === 'primary' ? 'primary' : 'partner') + '">' +
            '<div class="xe-dossier__head">' +
                art.slot(card.name, 'xe-dossier__art') +
                '<div class="xe-dossier__id">' +
                    '<p class="xe-dossier__role">' + (role === 'primary' ? 'Spotlight' : 'Partner card') +
                        ' · <span class="xe-dossier__arch">' + archetypes + ' card</span></p>' +
                    '<h4 class="xe-dossier__name">' + esc(card.name) + '</h4>' +
                    '<ul class="xe-stats" aria-label="Card stats">' + stats + '</ul>' +
                    // Spells and Traps have no ATK/DEF line.
                    (card.atk != null
                        ? '<dl class="xe-atkdef">' +
                            '<div><dt>ATK</dt><dd>' + card.atk + '</dd></div>' +
                            '<div><dt>DEF</dt><dd>' + card.def + '</dd></div>' +
                          '</dl>'
                        : '') +
                    '<p class="xe-dossier__summon">' + inline(card.summon) + '</p>' +
                '</div>' +
            '</div>' +
            (note ? '<p class="xe-dossier__note">' + inline(note) + '</p>' : '') +
            '<ol class="xe-effects" aria-label="Effects">' + effects + '</ol>' +
            '<ul class="xe-facts" aria-label="Key rulings">' + facts + '</ul>' +
            '<details class="xe-official"><summary>Official card text</summary>' +
                '<p>' + esc(card.officialText).replace(/\n/g, '<br>') + '</p>' +
            '</details>' +
        '</article>';
    }

    function renderDossiers(uid, data, p, art) {
        if (!p.partner) {
            return sectionOpen(uid, 'cards', 'The card') +
                '<div class="xe-dossiers xe-dossiers--single">' +
                    renderDossier(data.cards[p.primary], 'primary', null, art) +
                '</div>' +
            '</section>';
        }
        return sectionOpen(uid, 'cards', 'The two cards') +
            '<div class="xe-dossiers">' +
                renderDossier(data.cards[p.primary], 'primary', null, art) +
                renderDossier(data.cards[p.partner], 'partner', p.partnerNote, art) +
            '</div>' +
        '</section>';
    }

    function renderEnabler(data, p, art) {
        if (!p.enabler) return '';
        var card = data.cards[p.enabler];
        var label = p.enablerLabel || 'Key enabler';
        return '<aside class="xe-enabler" aria-label="' + esc(label) + '">' +
            art.slot(card.name, 'xe-thumb') +
            '<div>' +
                '<p class="xe-enabler__eyebrow">' + esc(label) + ' · ' + esc(card.typeLine) + '</p>' +
                '<p class="xe-enabler__name">' + inline('[[' + card.name + ']]') + '</p>' +
                '<p class="xe-enabler__text">' + inline(card.summary) + '</p>' +
            '</div>' +
        '</aside>';
    }

    function renderBridgeEngine(side, engine) {
        var cards = engine.cards.map(function (name) {
            return '<li>' + inline('[[' + name + ']]') + '</li>';
        }).join('');
        return '<div class="xe-bridge__node xe-bridge__node--' + side + '">' +
            '<h4 class="xe-bridge__title">' + esc(engine.title) + '</h4>' +
            '<p class="xe-bridge__cap">' + inline(engine.caption) + '</p>' +
            '<ul class="xe-bridge__list">' + cards + '</ul>' +
        '</div>';
    }

    function renderBridge(uid, data, p, art) {
        var hub = data.cards[p.primary];
        return sectionOpen(uid, 'bridge', p.bridge.title) +
            '<div class="xe-bridge">' +
                renderBridgeEngine('left', p.bridge.left) +
                '<div class="xe-bridge__link xe-bridge__link--in" aria-hidden="true"></div>' +
                '<div class="xe-bridge__node xe-bridge__node--hub">' +
                    art.slot(hub.name, 'xe-thumb xe-thumb--hub') +
                    '<p class="xe-bridge__hub-name">' + esc(hub.name) + '</p>' +
                    '<p class="xe-bridge__hub-meta">' + esc(hub.statline.slice(0, 3).join(' · ')) + '</p>' +
                '</div>' +
                '<div class="xe-bridge__link xe-bridge__link--out" aria-hidden="true"></div>' +
                renderBridgeEngine('right', p.bridge.right) +
            '</div>' +
            '<p class="xe-bridge__footer">' + inline(p.bridge.footer) + '</p>' +
        '</section>';
    }

    function renderSynergy(uid, p) {
        var s = p.synergy;
        var head = s.columns.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('');
        var rows = s.rows.map(function (row) {
            return '<tr>' + row.map(function (cell, i) {
                var tag = i === 0 ? 'th scope="row"' : 'td';
                var close = i === 0 ? 'th' : 'td';
                return '<' + tag + ' data-label="' + esc(s.columns[i]) + '">' + inline(cell) + '</' + close + '>';
            }).join('') + '</tr>';
        }).join('');

        return sectionOpen(uid, 'synergy', s.title) +
            '<p class="xe-intro">' + inline(s.intro) + '</p>' +
            '<div class="xe-table-wrap"><table class="xe-table">' +
                '<thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody>' +
            '</table></div>' +
        '</section>';
    }

    function renderCombo(uid, p, art) {
        var c = p.combo;
        var branches = c.branches || null;
        var first = branches ? branches[0].key : null;

        var toggle = branches
            ? '<div class="xe-branch" role="group" aria-label="' + esc(c.branchLabel) + '">' +
                '<span class="xe-branch__label">' + esc(c.branchLabel) + '</span>' +
                branches.map(function (b) {
                    return '<button type="button" class="xe-branch__btn" data-xe-branch="' + esc(b.key) + '" ' +
                        'aria-pressed="' + (b.key === first) + '">' + esc(b.label) + '</button>';
                }).join('') +
              '</div>'
            : '';

        var steps = c.steps.map(function (step, i) {
            var body, thumb;
            // `card` is one name, or { branchKey: name } when the step's card depends on the branch.
            if (typeof step.card === 'string') {
                thumb = art.slot(step.card, 'xe-thumb');
            } else {
                thumb = branches.map(function (b) {
                    return '<div class="xe-step__art" data-xe-branch-panel="' + esc(b.key) + '"' +
                        (b.key === first ? '' : ' hidden') + '>' + art.slot(step.card[b.key], 'xe-thumb') + '</div>';
                }).join('');
            }
            if (step.branches) {
                body = branches.map(function (b) {
                    return '<p class="xe-step__text" data-xe-branch-panel="' + esc(b.key) + '"' +
                        (b.key === first ? '' : ' hidden') + '>' + inline(step.branches[b.key]) + '</p>';
                }).join('');
            } else {
                body = '<p class="xe-step__text">' + inline(step.text) + '</p>';
            }

            return '<li class="xe-step' + (step.branches ? ' xe-step--branching' : '') + '">' +
                thumb +
                '<div class="xe-step__body">' +
                    '<h4 class="xe-step__title"><span class="xe-step__num" aria-hidden="true">' + (i + 1) + '</span>' +
                        esc(step.title) + '</h4>' +
                    body +
                '</div>' +
            '</li>';
        }).join('');

        var result = c.result
            ? '<div class="xe-result">' +
                '<h4 class="xe-h4">Result</h4>' +
                '<ul class="xe-result__list">' +
                    c.result.map(function (r) { return '<li>' + inline(r) + '</li>'; }).join('') +
                '</ul>' +
              '</div>'
            : '';

        return sectionOpen(uid, 'combo', c.title) +
            (c.intro ? '<p class="xe-intro">' + inline(c.intro) + '</p>' : '') +
            toggle +
            '<ol class="xe-steps">' + steps + '</ol>' +
            result +
            (c.note ? '<p class="xe-note"><strong>Rules note:</strong> ' + inline(c.note) + '</p>' : '') +
        '</section>';
    }

    function renderDeck(uid, p) {
        var d = p.deck;
        var groups = d.groups.map(function (g) {
            var rows = g.rows.map(function (r) {
                return '<li class="xe-deck__row">' +
                    '<span class="xe-deck__count">' + esc(r.count) + '</span>' +
                    '<span class="xe-deck__card">' + inline('[[' + r.card + ']]') + '</span>' +
                    '<span class="xe-deck__role">' + inline(r.role) + '</span>' +
                '</li>';
            }).join('');
            return '<div class="xe-deck__group">' +
                '<h4 class="xe-deck__title">' + esc(g.title) + '</h4>' +
                '<ul class="xe-deck__rows">' + rows + '</ul>' +
            '</div>';
        }).join('');

        return sectionOpen(uid, 'deck', d.title) +
            '<div class="xe-deck">' + groups + '</div>' +
            (d.note ? '<p class="xe-note">' + inline(d.note) + '</p>' : '') +
        '</section>';
    }

    /**
     * Part-to-whole against a limit: one horizontal stacked bar, two series
     * (the two engines), 2px surface gaps, an 8,000 LP reference line, and the
     * ledger underneath as the table view. Values stay in text ink; the series
     * colour only fills the marks and legend swatches.
     */
    function renderBurst(uid, burst) {
        var total = burst.steps.reduce(function (sum, s) { return sum + s.value; }, 0);
        var scale = Math.max(total, burst.lp);
        var lpPct = (burst.lp / scale * 100).toFixed(2);
        var overkill = total - burst.lp;

        var segments = burst.steps.map(function (s, i) {
            var share = s.value / scale;
            var label = share >= 0.15 ? '<span class="xe-stack__val">' + formatNumber(s.value) + '</span>' : '';
            return '<div class="xe-stack__seg" style="flex-grow:' + s.value + ';--xe-seg:' + burst.series[s.series].color + '">' +
                label +
                '<span class="xe-stack__tip"><strong>' + esc(s.label) + '</strong> ' + formatNumber(s.value) +
                    '<br><span>' + esc(burst.series[s.series].label) + '</span></span>' +
            '</div>';
        }).join('');

        var bySeries = {};
        burst.steps.forEach(function (s) { bySeries[s.series] = (bySeries[s.series] || 0) + s.value; });
        var legend = Object.keys(burst.series).map(function (key) {
            var ser = burst.series[key];
            return '<li><span class="xe-swatch" style="--xe-seg:' + ser.color + '"></span>' +
                esc(ser.label) + ' <strong>' + formatNumber(bySeries[key] || 0) + '</strong></li>';
        }).join('');

        var ledger = burst.steps.map(function (s, i) {
            return '<tr>' +
                '<td class="xe-ledger__n">' + (i + 1) + '</td>' +
                '<th scope="row"><span class="xe-swatch" style="--xe-seg:' + burst.series[s.series].color + '"></span>' +
                    esc(s.label) + '<span class="xe-ledger__note">' + esc(s.note) + '</span></th>' +
                '<td class="xe-ledger__v">' + formatNumber(s.value) + '</td>' +
            '</tr>';
        }).join('');

        var assumptions = burst.assumptions.map(function (a) { return '<li>' + inline(a) + '</li>'; }).join('');

        return sectionOpen(uid, 'burst', burst.title, 'xe-burst') +
            '<p class="xe-intro">' + inline(burst.intro) + '</p>' +
            '<ul class="xe-assumptions">' + assumptions + '</ul>' +
            '<figure class="xe-chart">' +
                '<div class="xe-stack" aria-hidden="true">' +
                    '<div class="xe-stack__lp" style="left:' + lpPct + '%"><span>' + formatNumber(burst.lp) + ' LP</span></div>' +
                    '<div class="xe-stack__track">' + segments + '</div>' +
                '</div>' +
                '<figcaption class="xe-legend"><ul>' + legend + '</ul></figcaption>' +
            '</figure>' +
            '<table class="xe-ledger">' +
                '<caption class="xe-sr-only">Damage breakdown</caption>' +
                '<thead class="xe-sr-only"><tr><th scope="col">Step</th><th scope="col">Source</th><th scope="col">Damage</th></tr></thead>' +
                '<tbody>' + ledger + '</tbody>' +
                '<tfoot><tr><td></td><th scope="row">Total vs ' + formatNumber(burst.lp) + ' LP</th>' +
                    '<td class="xe-ledger__v">' + formatNumber(total) +
                    (overkill > 0 ? '<span class="xe-ledger__over">+' + formatNumber(overkill) + ' over</span>' : '') +
                '</td></tr></tfoot>' +
            '</table>' +
        '</section>';
    }

    function renderVerdict(uid, p) {
        var v = p.verdict;
        var ratings = v.ratings.map(function (r) {
            var pips = '';
            for (var i = 1; i <= 5; i++) pips += '<i' + (i <= r.value ? ' class="is-on"' : '') + '></i>';
            return '<li class="xe-rating">' +
                '<span class="xe-rating__label">' + esc(r.label) + '</span>' +
                '<span class="xe-pips" aria-hidden="true">' + pips + '</span>' +
                '<span class="xe-rating__value">' + r.value + '/5</span>' +
                '<span class="xe-rating__note">' + inline(r.note) + '</span>' +
            '</li>';
        }).join('');

        var watch = v.watchouts.map(function (w) { return '<li>' + inline(w) + '</li>'; }).join('');

        return sectionOpen(uid, 'verdict', v.title, 'xe-verdict') +
            '<p class="xe-verdict__headline">' + inline(v.headline) + '</p>' +
            '<ul class="xe-ratings">' + ratings + '</ul>' +
            '<p class="xe-verdict__text">' + inline(v.text) + '</p>' +
            '<h4 class="xe-h4">Watch-outs</h4>' +
            '<ul class="xe-watch">' + watch + '</ul>' +
        '</section>';
    }

    function renderFull(uid, data, p, art) {
        return '<article class="xe xe--' + esc(p.theme) + '" aria-labelledby="xe-' + uid + '-title">' +
            renderHero(uid, data.set, p) +
            renderDossiers(uid, data, p, art) +
            renderEnabler(data, p, art) +
            renderBridge(uid, data, p, art) +
            renderSynergy(uid, p) +
            renderCombo(uid, p, art) +
            renderDeck(uid, p) +
            // A perspective can opt out of the release's shared burst (showBurst: false).
            (data.burst && p.showBurst !== false ? renderBurst(uid, data.burst) : '') +
            renderVerdict(uid, p) +
        '</article>';
    }

    function renderTeaser(data, p, target, art) {
        var t = p.teaser;
        return '<aside class="xe xe--' + esc(p.theme) + ' xe-teaser">' +
            '<div class="xe-teaser__inner">' +
            '<div class="xe-teaser__art" aria-hidden="true">' +
                art.slot(data.cards[p.primary].name, 'xe-thumb') +
                (p.partner ? art.slot(data.cards[p.partner].name, 'xe-thumb') : '') +
            '</div>' +
            '<div class="xe-teaser__body">' +
                '<p class="xe-kicker"><span class="xe-new-pill">New</span>' +
                    esc(t.kicker || setLabel(data.set)) + '</p>' +
                '<p class="xe-teaser__title">' + esc(t.title) + '</p>' +
                '<p class="xe-teaser__text">' + inline(t.text) + '</p>' +
                '<a class="xe-btn" href="#' + esc(target) + '" data-xe-jump="' + esc(target) + '">' +
                    esc(t.cta) + ' <span aria-hidden="true">→</span></a>' +
            '</div>' +
            '</div>' +
        '</aside>';
    }

    // ------------------------------------------------------------ behaviour

    function bindBranches(root) {
        root.addEventListener('click', function (event) {
            var btn = event.target.closest('[data-xe-branch]');
            if (!btn || !root.contains(btn)) return;
            var section = btn.closest('.xe-block');
            var key = btn.getAttribute('data-xe-branch');

            section.querySelectorAll('[data-xe-branch]').forEach(function (b) {
                b.setAttribute('aria-pressed', String(b === btn));
            });
            section.querySelectorAll('[data-xe-branch-panel]').forEach(function (panel) {
                panel.hidden = panel.getAttribute('data-xe-branch-panel') !== key;
            });
        });
    }

    function bindCardRefs(root) {
        root.addEventListener('click', function (event) {
            var ref = event.target.closest('.xe-ref');
            if (!ref || !root.contains(ref)) return;
            if (window.CardLoader && typeof window.CardLoader.showPopupByName === 'function') {
                window.CardLoader.showPopupByName(ref.getAttribute('data-xe-card'), event);
            }
        });
    }

    // The guide-tabs.js tab whose panel contains el, if any.
    function guideTabFor(el) {
        var panel = el.closest('[role="tabpanel"]');
        if (!panel) return null;
        var tabs = document.querySelectorAll('[role="tab"]');
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].getAttribute('aria-controls') === panel.id) return tabs[i];
        }
        return null;
    }

    // Opens the tab that owns `target` (if the page uses tabs), then scrolls to it.
    function jumpTo(target) {
        var el = document.getElementById(target);
        if (!el) return false;

        var guideTab = guideTabFor(el);
        if (guideTab) {
            // guide-tabs.js opens the panel and writes the URL hash itself.
            guideTab.click();
        } else {
            var control = document.getElementById('btn-' + target) ||
                document.querySelector('[onclick*="\'' + target + '\'"]');
            if (control) control.click();
            if (history.pushState) history.pushState(null, '', '#' + target);
        }
        setTimeout(function () {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return true;
    }

    function bindJumps(root) {
        root.addEventListener('click', function (event) {
            var link = event.target.closest('[data-xe-jump]');
            if (!link || !root.contains(link)) return;
            if (jumpTo(link.getAttribute('data-xe-jump'))) event.preventDefault();
        });
    }

    // A [suggest an improvement] link under the hero title and each block's
    // heading. CardLoader handles the click (any [data-suggest]) and opens the
    // page's suggestion form under the link. The panel isn't editable in place
    // like the page's own prose: it's rendered from data shared by two pages,
    // so a suggestion goes to whoever updates cross-engine-data.js instead of
    // becoming a per-page edit that drifts from the other page.
    function addSuggestLinks(root, p) {
        root.querySelectorAll('.xe-hero, .xe-block').forEach(function (block) {
            var heading = block.querySelector('.xe-title, .xe-h3');
            if (!heading) return;
            var context = block.classList.contains('xe-hero')
                ? p.title
                : p.title + ': ' + heading.textContent;
            var bar = document.createElement('p');
            bar.className = 'xe-suggest';
            bar.innerHTML = '<button type="button" class="xe-suggest__btn" data-suggest="' + esc(context) + '">' +
                '[suggest an improvement]</button>';
            heading.after(bar);
        });
    }

    // ------------------------------------------------------------------ mount

    function mount(el, options) {
        if (!el || el.getAttribute('data-xe-mounted') === 'true') return;

        var opts = options || {};
        var releaseKey = opts.release || el.getAttribute('data-cross-engine');
        var perspectiveKey = opts.perspective || el.getAttribute('data-perspective');
        var variant = opts.variant || el.getAttribute('data-variant') || 'full';
        var target = opts.target || el.getAttribute('data-xe-target') || 'cross-engine';

        var data = window.CrossEngineData && window.CrossEngineData[releaseKey];
        var perspective = data && data.perspectives[perspectiveKey];
        if (!perspective) {
            console.warn('[CrossEngineSupport] Unknown release/perspective:', releaseKey, perspectiveKey);
            return;
        }

        var uid = ++mountCount;
        var art = new ArtRegistry(uid);
        el.innerHTML = variant === 'teaser'
            ? renderTeaser(data, perspective, target, art)
            : renderFull(uid, data, perspective, art);
        el.setAttribute('data-xe-mounted', 'true');

        if (variant !== 'teaser') addSuggestLinks(el, perspective);
        bindCardRefs(el);
        bindBranches(el);
        bindJumps(el);
        whenShown(el, function () { art.load(); });
    }

    function mountAll(root) {
        (root || document).querySelectorAll('[data-cross-engine]').forEach(function (el) {
            mount(el);
        });
    }

    window.CrossEngineSupport = { mount: mount, mountAll: mountAll };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { mountAll(); });
    } else {
        mountAll();
    }
})();
