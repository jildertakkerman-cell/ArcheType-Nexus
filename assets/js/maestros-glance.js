/* "The new cards at a glance" block on the Magnificent Maestros tabs (assets/css/maestros-glance.css).
   Markup contract, written into each page as static HTML so it reads and indexes without JS:

     <section class="mg-glance" data-mg-glance>
       <div class="mg-glance-head"><h2 class="mg-glance-title">…</h2><span class="mg-glance-count">…</span></div>
       <dl class="mg-glance-list">
         <div class="mg-item"><span class="mg-art" aria-hidden="true"></span>
           <dt>Card name</dt><dd class="mg-kind">Level 6 DARK Spellcaster</dd><dd class="mg-line">One line.</dd></div>
       </dl>
     </section>

   This script, once the page's own DOMContentLoaded handlers have run (page-sections.js has then
   grouped the page into suggest-edit sections, so nothing here changes those sections or their text):
   - loads each card's art into its .mg-art slot when the block scrolls into view;
   - turns each card name into a link to that card's profile in the same tab (the first heading or
     data-cardname element with that name), opening an inner card tab first if the profile is in one;
   - adds an "On this tab" row of links to the tab's section headings below the list. */
(function () {
    'use strict';

    // The longest tabs have 10 sections (Predaplant, Chaos); the cap only guards against a runaway list.
    var MAX_TOC = 12;

    function norm(s) {
        return (s || '').replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function panelOf(glance) {
        return glance.closest('[data-pcs-scope]') || glance.parentElement;
    }

    function after(a, b) {
        return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    }

    // The profile of a card: a heading, or an element marked with data-cardname, whose text is the
    // card's name. Headings win over inline mentions.
    function findProfile(panel, glance, name) {
        var want = norm(name);
        var heads = panel.querySelectorAll('h2, h3, h4, h5, [class*="name"], [data-cardname]');
        var fallback = null;
        for (var i = 0; i < heads.length; i++) {
            var el = heads[i];
            if (glance.contains(el) || el.closest('table, .cc-claims-bar, .combo-step-card')) continue;
            var text = norm(el.textContent);
            if (text !== want && norm(el.getAttribute('data-cardname')) !== want) continue;
            if (/^H[2-5]$/.test(el.tagName)) return el;
            if (!fallback && /name/i.test(typeof el.className === 'string' ? el.className : '')) fallback = el;
        }
        return fallback;
    }

    // If the target sits in a hidden inner panel (a card tablist, a <details>), open that first.
    function reveal(target) {
        for (var node = target.parentElement; node && node !== document.body; node = node.parentElement) {
            if (node.tagName === 'DETAILS' && !node.open) node.open = true;
            if (!node.hidden && getComputedStyle(node).display !== 'none') continue;
            if (!node.id) continue;
            var id = node.id;
            var control = document.querySelector('[aria-controls="' + id + '"], a[href="#' + id + '"]');
            if (control) control.click();
        }
    }

    function jumpTo(target) {
        reveal(target);
        target.setAttribute('data-mg-target', '');
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        var smooth = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        try { target.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
    }

    function linkTo(target, label, id) {
        if (!target.id) target.id = id;
        var a = document.createElement('a');
        a.href = '#' + target.id;
        a.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
            e.preventDefault();
            jumpTo(target);
        });
        if (label != null) a.textContent = label;
        return a;
    }

    function slug(s) {
        return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
    }

    function addProfileLinks(panel, glance) {
        Array.prototype.forEach.call(glance.querySelectorAll('.mg-item dt'), function (dt) {
            if (dt.querySelector('a')) return;
            var target = findProfile(panel, glance, dt.textContent);
            if (!target) return;
            // Move the name's own nodes into the link, so the text stays exactly as written.
            var a = linkTo(target, null, 'mg-card-' + slug(dt.textContent));
            a.setAttribute('aria-label', 'Go to the ' + dt.textContent.trim() + ' profile');
            while (dt.firstChild) a.appendChild(dt.firstChild);
            dt.appendChild(a);
        });
    }

    function sectionHeadings(panel, glance) {
        function pick(selector) {
            return Array.prototype.filter.call(panel.querySelectorAll(selector), function (h) {
                return after(glance, h) && !glance.contains(h) && !h.closest('[data-pcs-skip], table, .combo-step-card') &&
                    norm(h.textContent).length > 2;
            });
        }
        var list = pick('h2');
        if (list.length < 3) {
            // Tabs whose sections are titled with h3 inside cards (the h2 is the tab title).
            list = pick('h2, h3').filter(function (h) {
                var box = h.parentElement;
                return h.tagName === 'H2' || (box && box.firstElementChild === h);
            });
        }
        return list.slice(0, MAX_TOC);
    }

    function addToc(panel, glance) {
        if (glance.querySelector('.mg-toc')) return;
        // Some tabs already have their own jump row (Rokket's "In this tab").
        if (glance.hasAttribute('data-mg-no-toc')) return;
        var heads = sectionHeadings(panel, glance);
        if (heads.length < 2) return;
        var nav = document.createElement('nav');
        nav.className = 'mg-toc';
        nav.setAttribute('aria-label', 'On this tab');
        nav.setAttribute('data-pcs-skip', '');
        var label = document.createElement('span');
        label.className = 'mg-toc-label';
        label.textContent = 'On this tab';
        nav.appendChild(label);
        heads.forEach(function (h) {
            var text = h.textContent.replace(/\s+/g, ' ').trim();
            nav.appendChild(linkTo(h, text, 'mg-sec-' + slug(text)));
        });
        glance.appendChild(nav);
    }

    // CardLoader is a top-level const in card-loader.js, so it isn't always a window property.
    function cardLoader() {
        var loader = typeof CardLoader !== 'undefined' ? CardLoader : window.CardLoader;
        return loader && typeof loader.getCardImageUrl === 'function' ? loader : null;
    }

    // Art slots go in as the tile's last child, after its <dd>s: page-sections.js reads a <dl> as
    // "name: dd; dd" and stops at the first element that isn't a <dd>, so the slot stays out of the
    // suggest-edit draft. Made up front, so the column is there before the images arrive.
    function addArtSlots(glance) {
        if (!cardLoader()) return;
        Array.prototype.forEach.call(glance.querySelectorAll('.mg-item'), function (item) {
            if (item.querySelector('.mg-art')) return;
            var slot = document.createElement('span');
            slot.className = 'mg-art';
            slot.setAttribute('aria-hidden', 'true');
            item.appendChild(slot);
            item.classList.add('mg-with-art');
        });
    }

    function loadArt(glance) {
        var loader = cardLoader();
        if (!loader) return;
        Array.prototype.forEach.call(glance.querySelectorAll('.mg-item'), function (item) {
            var slot = item.querySelector('.mg-art');
            var dt = item.querySelector('dt');
            if (!slot || !dt || slot.querySelector('img')) return;
            loader.getCardImageUrl(dt.textContent.trim()).then(function (url) {
                if (!url) return;
                var img = document.createElement('img');
                img.src = url;
                img.alt = '';
                img.loading = 'lazy';
                img.decoding = 'async';
                slot.appendChild(img);
            }).catch(function () { /* the slot stays an empty frame */ });
        });
    }

    // <table data-mg-stack>: give each body cell its column header as data-label for the phone layout.
    function labelStackedTables() {
        Array.prototype.forEach.call(document.querySelectorAll('table[data-mg-stack]'), function (table) {
            var headRow = table.tHead && table.tHead.rows[0];
            if (!headRow) return;
            var labels = Array.prototype.map.call(headRow.cells, function (c) {
                return c.textContent.replace(/\s+/g, ' ').trim();
            });
            Array.prototype.forEach.call(table.tBodies, function (body) {
                Array.prototype.forEach.call(body.rows, function (row) {
                    Array.prototype.forEach.call(row.cells, function (cell, i) {
                        if (labels[i] && !cell.hasAttribute('data-label')) cell.setAttribute('data-label', labels[i]);
                    });
                });
            });
        });
    }

    function init() {
        labelStackedTables();
        Array.prototype.forEach.call(document.querySelectorAll('[data-mg-glance]'), function (glance) {
            var panel = panelOf(glance);
            if (glance.querySelectorAll('.mg-item').length === 1) glance.classList.add('mg-glance--single');
            addArtSlots(glance);
            addProfileLinks(panel, glance);
            addToc(panel, glance);
            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    if (entries.some(function (e) { return e.isIntersecting; })) {
                        io.disconnect();
                        loadArt(glance);
                    }
                }, { rootMargin: '200px' });
                io.observe(glance);
            } else {
                loadArt(glance);
            }
        });
    }

    // After the page's own DOMContentLoaded handlers (they call initPageSections()); see claims-check.js.
    var started = false;
    function start() {
        if (started) return;
        started = true;
        init();
    }
    if (document.readyState === 'complete') start();
    else {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
        window.addEventListener('load', start);
    }
})();
