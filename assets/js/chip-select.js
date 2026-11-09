/* Long dropdowns in a page's pickers become rows of tappable option chips (radio buttons), which are
   easier to read and hit on a phone than a native list of 10+ entries. Mark a <select> with data-chips.

   The <select> stays in the page, hidden, and stays the source of truth: choosing a chip sets
   select.value and fires its change/input events, so each page's own checker script keeps working
   unchanged; a change the page makes to the select (or to its options) is mirrored back. Optgroups
   become small group labels inside the chip row. Without this script the plain dropdown shows. */
(function () {
    'use strict';

    var count = 0;

    // The text that names the select, and the element that holds it.
    function findLabel(select) {
        if (select.id) {
            var forLabel = document.querySelector('label[for="' + select.id + '"]');
            if (forLabel) return forLabel;
        }
        var wrap = select.closest('label');
        if (wrap) return wrap.querySelector('[class*="label"]') || wrap;
        return null;
    }

    // A <label> wrapped around the select would also wrap the chips, and a click on any chip would
    // then go to the label's first control. Turn that wrapper into a <div> with the same classes.
    function unwrapLabel(select) {
        var wrap = select.closest('label');
        if (!wrap) return;
        var div = document.createElement('div');
        div.className = wrap.className;
        while (wrap.firstChild) div.appendChild(wrap.firstChild);
        wrap.parentNode.replaceChild(div, wrap);
    }

    function build(select) {
        var label = findLabel(select);
        unwrapLabel(select);
        var name = 'chips-' + (++count);
        var group = document.createElement('div');
        group.className = 'chips';
        group.setAttribute('role', 'radiogroup');
        if (label) {
            if (!label.id) label.id = name + '-label';
            group.setAttribute('aria-labelledby', label.id);
            if (label.tagName === 'LABEL' && label.htmlFor) label.removeAttribute('for');
        }

        function chip(option) {
            var item = document.createElement('label');
            item.className = 'chip';
            var input = document.createElement('input');
            input.type = 'radio';
            input.name = name;
            input.value = option.value;
            input.checked = option.selected;
            input.disabled = option.disabled;
            var text = document.createElement('span');
            text.textContent = option.textContent.trim();
            item.append(input, text);
            input.addEventListener('change', function () {
                if (!input.checked || select.value === input.value) return;
                select.value = input.value;
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
            return item;
        }

        function fill() {
            group.textContent = '';
            Array.prototype.forEach.call(select.children, function (node) {
                if (node.tagName === 'OPTGROUP') {
                    var head = document.createElement('span');
                    head.className = 'chips-group';
                    head.textContent = node.label;
                    head.setAttribute('aria-hidden', 'true');
                    group.appendChild(head);
                    Array.prototype.forEach.call(node.children, function (o) { group.appendChild(chip(o)); });
                } else if (node.tagName === 'OPTION') {
                    group.appendChild(chip(node));
                }
            });
        }

        function sync() {
            Array.prototype.forEach.call(group.querySelectorAll('input'), function (input) {
                input.checked = input.value === select.value;
            });
        }

        fill();
        select.classList.add('chips-source');
        select.setAttribute('aria-hidden', 'true');
        select.tabIndex = -1;
        select.insertAdjacentElement('afterend', group);
        select.addEventListener('change', sync);
        // Pages that fill or swap the options later (Blue-Eyes builds its list in script).
        if (window.MutationObserver) {
            new MutationObserver(function () { fill(); sync(); }).observe(select, { childList: true, subtree: true });
        }
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('select[data-chips]'), function (select) {
            if (!select.classList.contains('chips-source')) build(select);
        });
    }

    // After the pages' own DOMContentLoaded handlers, which may fill the options first.
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
