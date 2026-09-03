/**
 * Tab deep-link helper.
 *
 * Deck pages keep their newer write-ups behind tab buttons, so a link that
 * points straight at "#tab-2026" or at a heading inside such a panel would
 * otherwise land on collapsed content. This opens the owning tab first, then
 * scrolls.
 *
 * The hash may name either the tab itself (the argument the page's own switch
 * function takes, e.g. #tab-2026, #kusanagi, #pp26) or a plain anchor. Each
 * page keeps its own switch logic; this only presses the right control.
 */
(function () {
    'use strict';

    var SAFE_HASH = /^[\w:.-]+$/;

    function controlsFor(hash) {
        var found = [];
        var push = function (nodes) {
            Array.prototype.forEach.call(nodes, function (node) {
                if (found.indexOf(node) === -1) found.push(node);
            });
        };

        // Buttons wired up inline, e.g. onclick="switchTab('tab-2026')".
        push(document.querySelectorAll('[onclick*="\'' + hash + '\'"]'));
        // Buttons wired up through a data attribute, e.g. data-target="overframe-era".
        push(document.querySelectorAll('[data-target="' + hash + '"]'));
        // Buttons wired up by id in a listener, e.g. #btn-arsenal-assault.
        var byId = document.getElementById('btn-' + hash);
        if (byId) push([byId]);

        return found;
    }

    function openForHash() {
        var raw = window.location.hash.slice(1);
        if (!raw) return;

        var hash;
        try {
            hash = decodeURIComponent(raw);
        } catch (e) {
            hash = raw;
        }
        if (!SAFE_HASH.test(hash)) return;

        var controls = controlsFor(hash);
        controls.forEach(function (control) {
            control.click();
        });

        var target = document.getElementById(hash) || controls[0];
        if (!target) return;

        // Let the tab finish painting before scrolling to it.
        setTimeout(function () {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }

    window.addEventListener('hashchange', openForHash);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', openForHash);
    } else {
        openForHash();
    }
})();
