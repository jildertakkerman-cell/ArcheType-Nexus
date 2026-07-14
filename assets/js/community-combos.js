/**
 * community-combos.js
 * Fetches approved community replay guides from Supabase and injects them
 * into the existing combo-system.js selector/guide containers.
 *
 * Usage on an archetype page:
 *   <div id="community-combos-wrapper"></div>
 *   <script>
 *     document.addEventListener('DOMContentLoaded', () => {
 *       initCommunityCombos('community-combos-wrapper', 'Dark Magician');
 *     });
 *   </script>
 *
 * Requires: supabase-config.js, auth.js, combo-system.js, text-utils.js loaded first.
 */

// Fallback: most archetype pages load this file without text-utils.js —
// rendering user-submitted text must never depend on that load order.
if (typeof window.escapeHtml !== 'function') {
    window.escapeHtml = function (str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
}

const GCS_BASE_CC = 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/';
const ANALYZER_URL_CC = '../pages/Replay-Analyzer.html';

// Favorite-archetype badge next to a submitter's name. Self-contained CSS
// injection: most pages loading this file don't have synergy-tags.css, and an
// unconstrained inline SVG would render enormous.
function _ccFavBadge(profile) {
    if (profile?.hidefavbadge) return '';
    const fav = profile?.favorite;
    if (!fav?.iconsvg) return '';
    if (!document.getElementById('cc-fav-badge-style')) {
        const style = document.createElement('style');
        style.id = 'cc-fav-badge-style';
        style.textContent = '.fav-badge{display:inline-flex;width:14px;height:14px;border-radius:50%;overflow:hidden;vertical-align:middle;margin-left:0.3rem;background:#111827;}.fav-badge svg{width:100%;height:100%;}';
        document.head.appendChild(style);
    }
    return `<span class="fav-badge" title="${window.escapeHtml(fav.archetypename)} fan">${fav.iconsvg}</span>`;
}

async function initCommunityCombos(containerId, archetypeName) {
    // Fetch approved community combos from Supabase.
    // Static combos are handled separately by each page's own HTML/JS.
    const client = window.Auth?._getClient?.();
    if (!client) return;

    const { data: archetypeRow } = await client
        .from('archetypes')
        .select('archetypeid')
        .ilike('archetypename', archetypeName)
        .single();

    if (!archetypeRow) return;

    const { data: combos } = await client
        .from('combos')
        .select(`
            comboid, title, createdon, gcscombojsonpath,
            profiles!combos_userid_fkey ( displayname, hidefavbadge,
                favorite:archetypes!profiles_favoritearchetypeid_fkey ( archetypename, iconsvg )
            ),
            replays!combos_replayid_fkey ( gcsjsonpath, metadata, gcsrawpath ),
            combovotes ( userid, value )
        `)
        .eq('archetypeid', archetypeRow.archetypeid)
        .eq('status', 'approved');

    const session = await window.Auth.getSession();

    if (!combos || combos.length === 0) {
        _renderCTA(containerId, session);
        return;
    }

    _buildStandaloneSection(containerId, combos, session, archetypeName);
}

function _injectSelectorOption(container, key, combo, index) {
    if (!container) return;
    const selectEl = container.querySelector('select');
    if (!selectEl) return;
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `★ ${combo.title}`;
    selectEl.appendChild(option);
}

function _injectGuideEntry(container, key, combo, session) {
    if (!container) return;
    const score = _calcScore(combo.combovotes);
    const userVote = session ? (combo.combovotes?.find(v => v.userid === session.user.id)?.value ?? 0) : 0;
    const date = combo.createdon ? new Date(combo.createdon).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const m = combo.replays?.metadata || {};
    const hasJson = !!combo.replays?.gcsjsonpath;

    const metaItems = [];

    const playerNames = Array.isArray(m.playerNames) ? m.playerNames.join(' vs ') : '';

    const simId = `community-sim-${combo.comboid}`;
    const simToggleId = `community-sim-toggle-${combo.comboid}`;
    const hasComboJson = !!combo.gcscombojsonpath;

    const div = document.createElement('div');
    div.id = `combo-${key}-content`;
    div.className = 'combo-content hidden animate-fadeIn';
    div.innerHTML = `
        <div style="border:1px solid rgba(245,158,11,0.25);border-radius:1rem;overflow:hidden;
                    background:rgba(245,158,11,0.04);">
            <div style="padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.07);">
                <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">
                    <i class="fas fa-star" style="color:#f59e0b;font-size:0.75rem;"></i>
                    <span style="font-size:0.85rem;font-weight:700;color:#f5f5f5;">${window.escapeHtml(combo.title)}</span>
                </div>
                ${metaItems.length ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.5rem;">${metaItems.join('')}</div>` : ''}
                <div style="font-size:0.78rem;color:#737373;">
                    ${playerNames ? `${window.escapeHtml(playerNames)} · ` : ''}Submitted by <span style="color:#a3a3a3;font-weight:600;">${window.escapeHtml(combo.profiles?.displayname || 'Duelist')}</span>${_ccFavBadge(combo.profiles)} · ${date}
                </div>
                ${combo.description ? `
                <div style="margin-top:0.65rem;padding-top:0.65rem;border-top:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:0.82rem;color:#a3a3a3;font-style:italic;line-height:1.55;">
                        <i class="fas fa-quote-left" style="margin-right:0.35rem;opacity:0.4;font-size:0.65rem;vertical-align:middle;"></i>${window.escapeHtml(combo.description)}<i class="fas fa-quote-right" style="margin-left:0.35rem;opacity:0.4;font-size:0.65rem;vertical-align:middle;"></i>
                    </p>
                </div>` : ''}
            </div>
            <div style="padding:0.75rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.07);
                        display:flex;align-items:center;gap:0.85rem;flex-wrap:wrap;">
                <span style="font-size:0.78rem;color:#737373;flex-shrink:0;">Was this guide helpful?</span>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <button onclick="castVote('${combo.comboid}', 1, this)"
                            style="display:inline-flex;align-items:center;gap:0.4rem;
                                   padding:0.4rem 0.9rem;border-radius:0.5rem;
                                   background:${userVote === 1 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'};
                                   border:1px solid ${userVote === 1 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'};
                                   color:${userVote === 1 ? '#4ade80' : '#d4d4d4'};
                                   font-size:0.82rem;font-weight:600;
                                   cursor:${session ? 'pointer' : 'default'};font-family:inherit;transition:all 0.15s;"
                            ${!session ? 'disabled title="Log in to vote"' : ''}
                            data-vote="1">
                        <i class="fas fa-thumbs-up" style="font-size:0.8rem;"></i> Yes
                    </button>
                    <span id="vote-score-${combo.comboid}"
                          style="font-size:0.9rem;font-weight:700;min-width:1.5rem;text-align:center;
                                 color:${score > 0 ? '#4ade80' : score < 0 ? '#f87171' : '#a3a3a3'};">
                        ${score}
                    </span>
                    <button onclick="castVote('${combo.comboid}', -1, this)"
                            style="display:inline-flex;align-items:center;gap:0.4rem;
                                   padding:0.4rem 0.9rem;border-radius:0.5rem;
                                   background:${userVote === -1 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'};
                                   border:1px solid ${userVote === -1 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'};
                                   color:${userVote === -1 ? '#f87171' : '#d4d4d4'};
                                   font-size:0.82rem;font-weight:600;
                                   cursor:${session ? 'pointer' : 'default'};font-family:inherit;transition:all 0.15s;"
                            ${!session ? 'disabled title="Log in to vote"' : ''}
                            data-vote="-1">
                        <i class="fas fa-thumbs-down" style="font-size:0.8rem;"></i> No
                    </button>
                </div>
            </div>
            ${hasComboJson ? `
            <div style="border-bottom:1px solid rgba(255,255,255,0.07);">
                <button id="${simToggleId}"
                        onclick="toggleComboSim('${simId}', '${combo.gcscombojsonpath}', this)"
                        style="width:100%;display:flex;align-items:center;justify-content:space-between;
                               padding:0.85rem 1.5rem;background:none;border:none;cursor:pointer;
                               color:#f59e0b;font-size:0.82rem;font-weight:600;font-family:inherit;
                               text-align:left;">
                    <span><i class="fas fa-play-circle" style="margin-right:0.5rem;"></i>View Combo Steps</span>
                    <i class="fas fa-chevron-down" style="transition:transform 0.2s;"></i>
                </button>
                <div id="${simId}" style="display:none;padding:0 0.75rem 0.75rem;"
                     data-combo-title="${window.escapeHtml(combo.title)}"></div>
            </div>` : ''}
        </div>`;
    container.appendChild(div);
}

function _buildStandaloneSection(containerId, combos, session, archetypeName) {
    const wrapper = document.getElementById(containerId);
    if (!wrapper) return;

    // Sort by vote score descending so highest-rated appears first
    const ranked = combos
        .map(combo => ({ combo, score: _calcScore(combo.combovotes) }))
        .sort((a, b) => b.score - a.score);

    const topScore = ranked[0]?.score ?? 0;
    const showSelector = ranked.length > 1;

    wrapper.innerHTML = `
        <div style="margin-top:1.5rem;">
            <h2 style="font-size:1.1rem;font-weight:700;color:#f5f5f5;margin-bottom:1rem;">
                <i class="fas fa-users" style="color:#f59e0b;margin-right:0.5rem;"></i>Community Combo Guides
            </h2>
            ${showSelector ? `
            <div style="margin-bottom:1rem;max-width:32rem;">
                <label style="display:block;font-size:0.72rem;font-weight:600;color:#f59e0b;
                              text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;">
                    <i class="fas fa-layer-group" style="margin-right:0.35rem;"></i>Select Combo Guide
                </label>
                <div style="position:relative;">
                    <select id="cc-guide-selector" onchange="window.switchComboGuide(this.value)"
                            style="appearance:none;width:100%;
                                   padding:0.7rem 2.5rem 0.7rem 1rem;
                                   background:rgba(245,158,11,0.07);
                                   border:1.5px solid rgba(245,158,11,0.35);
                                   border-radius:0.5rem;color:#f5f5f5;
                                   font-weight:600;font-size:0.88rem;
                                   cursor:pointer;font-family:inherit;
                                   transition:border-color 0.2s;">
                        ${ranked.map(({ combo, score }, i) => {
                            const isTop = score === topScore && topScore > 0;
                            const scoreStr = score !== 0 ? ` (${score > 0 ? '+' : ''}${score})` : '';
                            return `<option value="${i}" style="background:#1a1a2e;color:#f5f5f5;">
                                ${isTop ? '★ ' : ''}${window.escapeHtml(combo.title)}${scoreStr}
                            </option>`;
                        }).join('')}
                    </select>
                    <div style="position:absolute;right:0.85rem;top:50%;transform:translateY(-50%);
                                pointer-events:none;color:#f59e0b;font-size:0.8rem;">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
            </div>` : ''}
            <div id="standalone-combo-list"></div>
        </div>`;

    // Render all combo cards (only first visible)
    const list = document.getElementById('standalone-combo-list');
    ranked.forEach(({ combo }, i) => {
        const key = `cc_${combo.comboid}`;
        const placeholder = document.createElement('div');
        list.appendChild(placeholder);
        _injectGuideEntry({ appendChild: el => placeholder.replaceWith(el) }, key, combo, session);

        const el = document.getElementById(`combo-${key}-content`);
        if (el) {
            el.classList.remove('hidden');
            if (i > 0) el.style.display = 'none';
        }
    });

    // Selector handler
    window.switchComboGuide = function (idx) {
        idx = parseInt(idx, 10);
        ranked.forEach(({ combo }, i) => {
            const el = document.getElementById(`combo-cc_${combo.comboid}-content`);
            if (el) el.style.display = i === idx ? '' : 'none';
        });
    };
}

function _renderCTA(containerId, session) {
    if (!session) return;
    const wrapper = document.getElementById(containerId);
    if (!wrapper) return;
    const cta = document.createElement('p');
    cta.style.cssText = 'font-size:0.82rem;color:#737373;margin-top:1rem;';
    cta.innerHTML = `Have a replay for this archetype? <a href="../pages/My-Replays.html" style="color:#f59e0b;text-decoration:none;">Submit a combo guide →</a>`;
    wrapper.appendChild(cta);
}

function _calcScore(votes) {
    if (!Array.isArray(votes)) return 0;
    return votes.reduce((s, v) => s + v.value, 0);
}

window.toggleComboSim = async function (simId, gcscombojsonpath, btn) {
    const panel = document.getElementById(simId);
    if (!panel) return;

    const chevron = btn.querySelector('.fa-chevron-down');
    const isOpen = panel.style.display !== 'none';

    if (isOpen) {
        panel.style.display = 'none';
        if (chevron) chevron.style.transform = '';
        return;
    }

    panel.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';

    if (panel.dataset.loaded === '1') return;
    panel.dataset.loaded = '1';

    if (typeof DuelSimulator === 'undefined') {
        panel.innerHTML = '<p style="color:#f59e0b;font-size:0.8rem;padding:0.5rem;">Combo simulator not available on this page.</p>';
        return;
    }

    panel.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#737373;font-size:0.82rem;"><i class="fas fa-spinner fa-spin" style="margin-right:0.4rem;"></i>Loading combo steps…</div>';

    try {
        const res = await fetch(GCS_BASE_CC + gcscombojsonpath);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const comboData = await res.json();

        const comboKeys = Object.keys(comboData.combos || {});
        if (!comboKeys.length) throw new Error('No combos found in JSON');

        // Use a fully namespaced board ID — avoids ID collisions when multiple
        // community combos are on the same page (ComboGuide.render uses fixed IDs like
        // "duel-simulator-combo1" which would clash across combos).
        const boardId = simId + '-board';
        panel.innerHTML = '<div id="' + boardId + '" style="margin-top:0.25rem;"></div>';

        const firstKey = comboKeys[0];
        const normalizedKey = firstKey.replace('combo', '');
        // Override the distilled JSON title ("Imported Combo") with the user's actual guide title
        const userTitle = panel.dataset.comboTitle || '';
        const comboEntry = userTitle
            ? Object.assign({}, comboData.combos[firstKey], { title: userTitle })
            : comboData.combos[firstKey];
        new DuelSimulator(boardId, { [normalizedKey]: comboEntry });

        _renderComboSteps(panel, simId, comboData.combos[firstKey]);

    } catch (e) {
        panel.innerHTML = '<p style="color:#f87171;font-size:0.8rem;padding:0.5rem;">Could not load combo steps: ' + e.message + '</p>';
        panel.dataset.loaded = '0';
    }
};

function _renderComboSteps(panel, simId, combo) {
    const cardNameMap = {};
    if (combo.cards) combo.cards.forEach(function (c) { cardNameMap[c.id] = c.name; });

    const guideId = simId + '-guide';
    const iconId  = simId + '-guide-icon';

    const stepEls = (combo.steps || []).map(function (step, i) {
        const primaryCardId = step.card || (step.actions && step.actions.length > 0 ? step.actions[0].card : null);
        const cardName = cardNameMap[primaryCardId] || '';
        const imgId = simId + '-step-' + i + '-img';

        let text = step.text || '';
        if (typeof ComboGuide !== 'undefined') {
            text = ComboGuide.formatForBeginners(text);
            text = ComboGuide.highlightKeywords(text, cardNameMap, '#f59e0b', true);
        }

        const cardHtml = cardName
            ? '<div id="' + imgId + '" style="flex-shrink:0;width:50px;height:72px;border-radius:4px;' +
              'border:1px solid rgba(255,255,255,0.12);background:#1e3a8a;' +
              'background-size:cover;background-position:center;cursor:pointer;" ' +
              'onclick="window.CardLoader && window.CardLoader.showPopup(event, \'' + cardName.replace(/'/g, "\\'") + '\')"></div>'
            : '';

        const arrow = i < (combo.steps || []).length - 1
            ? '<div style="text-align:center;color:rgba(245,158,11,0.3);line-height:1;padding:0.1rem 0;">▼</div>'
            : '';

        return '<div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.75rem;' +
               'background:rgba(255,255,255,0.03);border-radius:0.5rem;' +
               'border:1px solid rgba(255,255,255,0.07);">' +
               '<div style="flex-shrink:0;min-width:1.75rem;height:1.75rem;border-radius:0.3rem;' +
               'background:#f59e0b;display:flex;align-items:center;justify-content:center;' +
               'font-size:0.68rem;font-weight:800;color:#000;margin-top:0.1rem;">' + (i + 1) + '</div>' +
               cardHtml +
               '<p style="margin:0;font-size:0.83rem;color:#d4d4d4;line-height:1.5;flex:1;">' + text + '</p>' +
               '</div>' + arrow;
    }).join('');

    const guideDiv = document.createElement('div');
    guideDiv.style.marginTop = '1rem';
    guideDiv.innerHTML =
        '<div style="border:1px solid rgba(245,158,11,0.2);border-radius:0.75rem;overflow:hidden;background:rgba(0,0,0,0.15);">' +
            '<button id="' + iconId + '-btn" style="width:100%;display:flex;align-items:center;justify-content:space-between;' +
            'padding:0.75rem 1rem;background:none;border:none;cursor:pointer;' +
            'color:#f59e0b;font-size:0.82rem;font-weight:600;font-family:inherit;">' +
                '<span><i class="fas fa-book-open" style="margin-right:0.5rem;"></i>Step-by-Step Guide</span>' +
                '<i id="' + iconId + '" class="fas fa-chevron-down" style="transition:transform 0.2s;"></i>' +
            '</button>' +
            '<div id="' + guideId + '" style="display:none;">' +
                '<div style="padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.4rem;">' + stepEls + '</div>' +
            '</div>' +
        '</div>';

    const toggleBtn = guideDiv.querySelector('#' + iconId + '-btn');
    const stepsEl   = guideDiv.querySelector('#' + guideId);
    const iconEl    = guideDiv.querySelector('#' + iconId);
    toggleBtn.addEventListener('click', function () {
        const open = stepsEl.style.display !== 'none';
        stepsEl.style.display = open ? 'none' : '';
        if (iconEl) iconEl.style.transform = open ? '' : 'rotate(180deg)';
    });

    panel.appendChild(guideDiv);

    // Load card images
    if (window.CardLoader) {
        const imageMap = {};
        (combo.steps || []).forEach(function (step, i) {
            const pid = step.card || (step.actions && step.actions.length > 0 ? step.actions[0].card : null);
            const name = cardNameMap[pid];
            if (name) imageMap[simId + '-step-' + i + '-img'] = name;
        });
        if (Object.keys(imageMap).length) setTimeout(function () { window.CardLoader.loadCards(imageMap); }, 100);
    }
}

window.castVote = async function (comboid, value, btn) {
    const client = window.Auth?._getClient?.();
    const session = await window.Auth?.getSession?.();
    if (!client || !session) return;

    const userId = session.user.id;
    const scoreEl = document.getElementById(`vote-score-${comboid}`);
    const allBtns = btn.closest('div').querySelectorAll('button[data-vote]');
    const currentVote = parseInt(allBtns[0].style.background.includes('0.2)') ? allBtns[0].dataset.vote :
                        allBtns[1].style.background.includes('0.2)') ? allBtns[1].dataset.vote : '0', 10) || 0;

    // Determine new vote (toggle off if same direction)
    const newVote = currentVote === value ? 0 : value;

    try {
        if (newVote === 0) {
            await client.from('combovotes').delete().eq('comboid', comboid).eq('userid', userId);
        } else {
            await client.from('combovotes').upsert({ userid: userId, comboid, value: newVote });
        }

        // Optimistically update UI
        const upBtn = btn.closest('div').querySelector('[data-vote="1"]');
        const downBtn = btn.closest('div').querySelector('[data-vote="-1"]');
        [upBtn, downBtn].forEach(b => {
            const isActive = parseInt(b.dataset.vote, 10) === newVote;
            const isUp = parseInt(b.dataset.vote, 10) === 1;
            b.style.background = isActive ? (isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.06)';
            b.style.borderColor = isActive ? (isUp ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(255,255,255,0.12)';
            b.style.color = isActive ? (isUp ? '#4ade80' : '#f87171') : '#a3a3a3';
        });
        if (scoreEl) {
            const prev = parseInt(scoreEl.textContent, 10) || 0;
            const delta = newVote - currentVote;
            const next = prev + delta;
            scoreEl.textContent = next;
            scoreEl.style.color = next > 0 ? '#4ade80' : next < 0 ? '#f87171' : '#a3a3a3';
        }
    } catch (e) {
        console.error('Vote failed:', e.message);
    }
};

window.loadReplayGuide = async function (path, btn) {
    if (!path) return;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading…'; }
    try {
        const res = await fetch(GCS_BASE_CC + path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        sessionStorage.setItem('replayPreload', JSON.stringify(data));
        window.location.href = ANALYZER_URL_CC;
    } catch (e) {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-chart-line"></i> Analyze this replay'; }
        alert('Could not load replay: ' + e.message);
    }
};
