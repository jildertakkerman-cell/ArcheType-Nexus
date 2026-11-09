/**
 * Chaos End Ruler - Master of the Beginning and End: lethal check.
 *
 * Wires up every <form data-cer-lethal> on the page. The controls are plain HTML in the page
 * (so page-sections.js finds them and adds its [suggest an improvement] link); this script only
 * reads them and writes the result into [data-cer-result].
 *
 * Fields: number inputs "field", "gy", "lp"; checkboxes name="atk" with the attacker's ATK as
 * value (the one marked data-cer-self is Chaos End Ruler); radios name="resp" = none | ogre | negate.
 *
 * Rules applied (printed text + Konami FAQ):
 * - the effect banishes the opponent's field and GY, then deals 500 per card banished (Tokens
 *   don't count, so the field box asks for non-Token cards);
 * - it can't be activated with nothing to banish;
 * - Ghost Ogre & Snow Rabbit destroys Chaos End Ruler but the wipe still resolves, and Ghost
 *   Ogre itself is in the opponent's GY by then (+1 card);
 * - Effect Veiler / Infinite Impermanence negate the wipe: no banish, no damage.
 */
(function () {
    'use strict';

    const fmt = n => n.toLocaleString('en-US');

    function readInt(form, name) {
        const el = form.elements[name];
        const v = el ? parseInt(el.value, 10) : 0;
        return Number.isFinite(v) && v > 0 ? v : 0;
    }

    function row(label, value) {
        return `<div class="cer-calc-row"><dt>${label}</dt><dd>${value}</dd></div>`;
    }

    function render(form) {
        const out = form.querySelector('[data-cer-result]');
        if (!out) return;

        const field = readInt(form, 'field');
        const gy = readInt(form, 'gy');
        const lp = readInt(form, 'lp');
        const resp = (form.querySelector('input[name="resp"]:checked') || {}).value || 'none';
        const self = form.querySelector('input[name="atk"][data-cer-self]');

        // Ghost Ogre destroys Chaos End Ruler before the wipe resolves, so it never attacks
        if (self) {
            self.disabled = resp === 'ogre';
            self.closest('label')?.classList.toggle('is-off', resp === 'ogre');
        }
        const battle = [...form.querySelectorAll('input[name="atk"]')]
            .filter(box => box.checked && !box.disabled)
            .reduce((sum, box) => sum + (parseInt(box.value, 10) || 0), 0);

        if (resp === 'negate') {
            out.innerHTML = `<dl class="cer-calc-rows">${row('Cards banished', '0')}${row('Burn', '0')}</dl>`
                + `<p class="cer-calc-verdict cer-calc-verdict--no">No wipe. The 1000 LP is spent and their ${fmt(field)} card${field === 1 ? '' : 's'} stay on the field, so your attackers have to get through their monsters.</p>`;
            return;
        }

        const banished = field + gy + (resp === 'ogre' ? 1 : 0);
        if (banished === 0) {
            out.innerHTML = `<dl class="cer-calc-rows">${row('Cards banished', '0')}${row('Burn', '0')}${row('Battle damage', fmt(battle))}</dl>`
                + '<p class="cer-calc-verdict cer-calc-verdict--no">Nothing to banish, so the effect can\'t be activated, just like on turn one going first.</p>';
            return;
        }

        const burn = banished * 500;
        const total = burn + battle;
        const lethal = total >= lp;
        const ogreNote = resp === 'ogre' ? ' (Ghost Ogre included)' : '';
        out.innerHTML = `<dl class="cer-calc-rows">`
            + row('Cards banished', `${fmt(banished)}${ogreNote}`)
            + row('Burn', `${fmt(banished)} &times; 500 = ${fmt(burn)}`)
            + row('Battle damage', `${fmt(battle)} (direct, their field is empty)`)
            + row('Total', `${fmt(total)} against ${fmt(lp)} LP`)
            + `</dl>`
            + (lethal
                ? `<p class="cer-calc-verdict cer-calc-verdict--ok">Lethal${total > lp ? `, with ${fmt(total - lp)} to spare` : ', exactly'}.</p>`
                : `<p class="cer-calc-verdict cer-calc-verdict--no">${fmt(lp - total)} short.${battle === 0 ? ' Pick your attackers above.' : ''}</p>`);
    }

    function init(form) {
        form.addEventListener('submit', e => e.preventDefault());
        form.addEventListener('input', () => render(form));
        form.addEventListener('change', () => render(form));
        render(form);
    }

    function start() {
        document.querySelectorAll('form[data-cer-lethal]').forEach(init);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
