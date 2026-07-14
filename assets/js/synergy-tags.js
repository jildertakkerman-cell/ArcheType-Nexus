/**
 * synergy-tags.js — "Pairs Well With" community synergy voting widget.
 *
 * Usage on an archetype page:
 *   <script src="../assets/js/text-utils.js"></script>
 *   <script src="../assets/js/synergy-tags.js"></script>
 *   <script>document.addEventListener('DOMContentLoaded', () => initSynergyTags('of the Swamp'));</script>
 *
 * Requires: supabase-config.js, auth.js, text-utils.js loaded first, and the
 * dock markup (#synergy-dock-wrap, #synergy-popover, #synergy-tier-list,
 * #synergy-mini-icons, #synergy-search-input, #synergy-search-results,
 * #synergy-search-hint) already present in the page.
 *
 * Data model: archetypelinks (one row per unordered archetype pair, gated
 * pending/approved/rejected) + archetypelinkvotes, archetypelinkreasons
 * ("why it works" explanations, independently votable) + archetypelinkreasonvotes.
 * See scripts/sql/001_synergy_tags_schema.sql for the schema/RLS this talks to.
 */

const UP_ARROW = `<svg viewBox="0 0 20 20"><path d="M10 3 L17 13 L13 13 L13 17 L7 17 L7 13 L3 13 Z"/></svg>`;
const DOWN_ARROW = `<svg viewBox="0 0 20 20"><path d="M10 17 L3 7 L7 7 L7 3 L13 3 L13 7 L17 7 Z"/></svg>`;
const COMMENT_ICON = `<svg viewBox="0 0 20 20"><path d="M2 3h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 4v-4H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/></svg>`;

let _myArchetypeId = null;
let _myArchetypeName = null;
let _links = [];       // approved (or own-pending) links involving this archetype, sorted by score desc
let _loaded = false;
let _loading = false;

function _client() {
    return window.Auth?._getClient?.() || null;
}

function _fmt(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
}

function _score(votes) {
    return Array.isArray(votes) ? votes.reduce((s, v) => s + v.value, 0) : 0;
}

function _myVote(votes, userId) {
    if (!userId || !Array.isArray(votes)) return 0;
    return votes.find(v => v.userid === userId)?.value ?? 0;
}

// ---------------------------------------------------------------------------
// Rendering — every user-authored string goes through window.escapeHtml.
// Icon SVGs come from our own `archetypes.iconsvg` column (curated, not user
// input), so those alone are safe to interpolate raw.
// ---------------------------------------------------------------------------

function _voteWidget(id, votes, userId, onVote) {
    const total = _score(votes);
    const mine = _myVote(votes, userId);
    return `
      <div class="vote-pill">
        <div class="vote-arrow up ${mine === 1 ? 'active' : ''}" onclick="event.stopPropagation(); ${onVote}(${id}, 1)">${UP_ARROW}</div>
        <div class="vote-total ${mine === 1 ? 'up-colored' : mine === -1 ? 'down-colored' : ''}">${_fmt(total)}</div>
        <div class="vote-arrow down ${mine === -1 ? 'active' : ''}" onclick="event.stopPropagation(); ${onVote}(${id}, -1)">${DOWN_ARROW}</div>
      </div>`;
}

function _reasonHtml(reason, userId) {
    const pending = reason.status !== 'approved' ? '<span class="pending-tag">pending review</span>' : '';
    return `
      <div class="comment-item">
        <div class="comment-vote">
          <div class="vote-arrow up ${_myVote(reason.archetypelinkreasonvotes, userId) === 1 ? 'active' : ''}" onclick="synVoteComment(${reason.reasonid}, 1)">${UP_ARROW}</div>
          <div class="vote-total">${_fmt(_score(reason.archetypelinkreasonvotes))}</div>
          <div class="vote-arrow down ${_myVote(reason.archetypelinkreasonvotes, userId) === -1 ? 'active' : ''}" onclick="synVoteComment(${reason.reasonid}, -1)">${DOWN_ARROW}</div>
        </div>
        <div>
          <div class="comment-body">${window.escapeHtml(reason.body)} ${pending}</div>
          <div class="comment-author">— <strong>${window.escapeHtml(reason.profiles?.displayname || 'Duelist')}</strong>${_favBadge(reason.profiles)}</div>
        </div>
      </div>`;
}

// Small favorite-archetype icon shown next to a submitter's name.
// The icon SVG comes from our own curated archetypes.iconsvg column.
function _favBadge(profile) {
    if (profile?.hidefavbadge) return '';
    const fav = profile?.favorite;
    if (!fav?.iconsvg) return '';
    return `<span class="fav-badge" title="${window.escapeHtml(fav.archetypename)} fan">${fav.iconsvg}</span>`;
}

function _detailHtml(link, userId) {
    const approvedReasons = (link.archetypelinkreasons || []).filter(r => r.status === 'approved' || r.userid === userId);
    const reasonsHtml = approvedReasons.length
        ? approvedReasons.map(r => _reasonHtml(r, userId)).join('')
        : '<div class="comment-item"><div class="comment-body" style="color:#6b8480;">No explanations yet — be the first.</div></div>';

    return `
      <div class="detail-heading">${approvedReasons.length} explanation${approvedReasons.length === 1 ? '' : 's'}</div>
      ${reasonsHtml}
      <span class="add-comment-link" onclick="synOpenReasonForm(${link.linkid})">✎ Add your own explanation</span>
      <div class="inline-form" id="syn-reason-form-${link.linkid}">
        <textarea id="syn-reason-text-${link.linkid}" rows="2" maxlength="220" oninput="synUpdateCounter(${link.linkid})" placeholder="Explain the specific interaction…"></textarea>
        <div class="char-counter" id="syn-counter-${link.linkid}">0 / 220</div>
        <div class="form-actions">
          <button class="btn-cancel" onclick="document.getElementById('syn-reason-form-${link.linkid}').classList.remove('show')">Cancel</button>
          <button class="btn-submit" id="syn-submit-${link.linkid}" disabled onclick="synSubmitReason(${link.linkid})">Submit</button>
        </div>
      </div>`;
}

function _rowHtml(link, rankClass, userId) {
    const other = link.other;
    const pendingClass = link.status !== 'approved' ? 'pending-row' : '';
    return `
      <div class="tier-row ${rankClass} ${pendingClass}" data-linkid="${link.linkid}">
        <div class="tier-bar">${rankClass === 'unranked' ? '' : '#' + rankClass.split('-')[1]}</div>
        <div class="tier-icon">${other.iconsvg || ''}</div>
        <div class="tier-content">
          <div class="tier-name-wrap">
            <div class="tier-name">${window.escapeHtml(other.archetypename)}</div>
            ${link.status !== 'approved' ? '<span class="pending-tag">pending review</span>' : ''}
          </div>
          <div class="reddit-controls">
            ${_voteWidget(link.linkid, link.archetypelinkvotes, userId, 'synVote')}
            <div class="comment-pill" onclick="synToggleExpand(${link.linkid})">
              ${COMMENT_ICON}<span class="count">${(link.archetypelinkreasons || []).filter(r => r.status === 'approved').length}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="tier-detail" id="syn-detail-${link.linkid}">${_detailHtml(link, userId)}</div>`;
}

async function _renderTop3() {
    const listEl = document.getElementById('synergy-tier-list');
    const iconsEl = document.getElementById('synergy-mini-icons');
    const badgeEl = document.querySelector('#synergy-dock-wrap .synergy-badge');
    if (!listEl) return;

    const session = await window.Auth?.getSession?.();
    const userId = session?.user?.id || null;

    const top3 = _links.slice(0, 3);

    if (top3.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No community pairings yet for ${window.escapeHtml(_myArchetypeName)} — search below to suggest the first one.</div>`;
    } else {
        listEl.innerHTML = top3.map((l, i) => _rowHtml(l, 'rank-' + (i + 1), userId)).join('');
    }

    if (iconsEl) iconsEl.innerHTML = top3.map(l => `<span class="mini-icon">${l.other.iconsvg || ''}</span>`).join('');
    if (badgeEl) {
        // Same number the page-load count query shows: approved pairings only
        const approvedCount = _links.filter(l => l.status === 'approved').length;
        if (approvedCount > 0) { badgeEl.textContent = String(approvedCount); badgeEl.style.display = ''; }
        else badgeEl.style.display = 'none';
    }
}

// ---------------------------------------------------------------------------
// Data fetch — fires once, on first popover open (not on page load), and only
// asks Supabase for the handful of archetypes actually linked to this one.
// ---------------------------------------------------------------------------

async function _loadLinks() {
    const client = _client();
    if (!client || _myArchetypeId == null) return;

    const { data: rows, error } = await client
        .from('archetypelinks')
        .select(`
            linkid, archetypeid1, archetypeid2, status, submittedby,
            a1:archetypes!archetypelinks_archetypeid1_fkey(archetypeid, archetypename, iconsvg),
            a2:archetypes!archetypelinks_archetypeid2_fkey(archetypeid, archetypename, iconsvg),
            archetypelinkvotes(userid, value),
            archetypelinkreasons(reasonid, userid, body, status, createdon,
                profiles!archetypelinkreasons_userid_fkey(displayname, hidefavbadge,
                    favorite:archetypes!profiles_favoritearchetypeid_fkey(archetypename, iconsvg)
                ),
                archetypelinkreasonvotes(userid, value)
            )
        `)
        .or(`archetypeid1.eq.${_myArchetypeId},archetypeid2.eq.${_myArchetypeId}`);

    if (error || !rows) {
        console.error('[SynergyTags] failed to load links', error);
        _links = [];
        return;
    }

    _links = rows
        .map(row => ({ ...row, other: row.archetypeid1 === _myArchetypeId ? row.a2 : row.a1 }))
        .sort((a, b) => _score(b.archetypelinkvotes) - _score(a.archetypelinkvotes));
}

async function _ensureLoaded() {
    if (_loaded || _loading) return;
    _loading = true;
    try {
        await _loadLinks();
        _loaded = true;
        await _renderTop3();
    } finally {
        _loading = false;
    }
}

// ---------------------------------------------------------------------------
// Login prompt — shown when a logged-out user tries to vote/submit.
// Steers users to the same Discord/Google OAuth flows auth.js already exposes;
// after OAuth they land back on this exact page (Auth's default redirect).
// ---------------------------------------------------------------------------

let _loginPromptDismissed = false;

function _showLoginPrompt(actionLabel, passive) {
    // A passive prompt (shown on popover open) respects an earlier "Not now";
    // an action-triggered one (user clicked vote/submit) always shows.
    if (passive && _loginPromptDismissed) return;
    const pop = document.getElementById('synergy-popover');
    if (!pop) return;

    let prompt = document.getElementById('synergy-login-prompt');
    if (!prompt) {
        prompt = document.createElement('div');
        prompt.id = 'synergy-login-prompt';
        prompt.className = 'synergy-login-prompt';
        const header = pop.querySelector('.synergy-popover-header');
        if (header && header.nextSibling) pop.insertBefore(prompt, header.nextSibling);
        else pop.prepend(prompt);
    }

    prompt.innerHTML = `
        <div class="login-prompt-msg">
            <i class="fas fa-lock" style="margin-right:0.35rem;color:#f59e0b;"></i>
            Sign in to ${window.escapeHtml(actionLabel)} — takes a few seconds, and your picks count.
        </div>
        <div class="login-prompt-btns">
            <button class="login-btn-discord" onclick="window.Auth.signInWithDiscord()">
                <i class="fab fa-discord"></i> Discord
            </button>
            <button class="login-btn-google" onclick="window.Auth.signInWithGoogle()">
                <svg width="13" height="13" viewBox="0 0 48 48" style="flex-shrink:0"><path fill="#fff" d="M43.6 20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/></svg>
                Google
            </button>
            <span class="login-prompt-dismiss" onclick="synDismissLoginPrompt()">Not now</span>
        </div>`;
    prompt.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

window.synDismissLoginPrompt = function () {
    _loginPromptDismissed = true;
    document.getElementById('synergy-login-prompt')?.remove();
};

// ---------------------------------------------------------------------------
// Popover open/close
// ---------------------------------------------------------------------------

window.synTogglePopover = function (evt, forceOpen) {
    evt.stopPropagation();
    const pop = document.getElementById('synergy-popover');
    if (!pop) return;
    const shouldOpen = forceOpen !== undefined ? forceOpen : !pop.classList.contains('open');
    pop.classList.toggle('open', shouldOpen);
    if (shouldOpen) {
        _ensureLoaded();
        // Steer logged-out visitors to sign in right away, not only after
        // their first blocked click.
        window.Auth?.getSession?.().then(session => {
            if (!session) _showLoginPrompt('vote and suggest pairings', true);
        });
    }
};

document.addEventListener('click', (e) => {
    const wrap = document.getElementById('synergy-dock-wrap');
    if (wrap && !wrap.contains(e.target)) {
        const pop = document.getElementById('synergy-popover');
        if (pop) pop.classList.remove('open');
    }
});

window.synToggleExpand = function (linkid) {
    const row = document.querySelector(`.tier-row[data-linkid="${linkid}"]`);
    const detail = document.getElementById('syn-detail-' + linkid);
    if (!row || !detail) return;
    const wasOpen = row.classList.contains('expanded');
    document.querySelectorAll('.tier-row.expanded').forEach(r => {
        r.classList.remove('expanded');
        const d = document.getElementById('syn-detail-' + r.dataset.linkid);
        if (d) d.classList.remove('show');
    });
    if (!wasOpen) { row.classList.add('expanded'); detail.classList.add('show'); }
};

// ---------------------------------------------------------------------------
// Voting — mirrors community-combos.js's castVote(): silently no-op if the
// user isn't signed in, same convention already used site-wide.
// ---------------------------------------------------------------------------

window.synVote = async function (linkid, dir) {
    const client = _client();
    if (!client) return;
    const session = await window.Auth?.getSession?.();
    if (!session) { _showLoginPrompt('vote on pairings'); return; }

    const link = _links.find(l => l.linkid === linkid);
    if (!link) return;
    const userId = session.user.id;
    const prev = _myVote(link.archetypelinkvotes, userId);
    const next = prev === dir ? 0 : dir;

    if (next === 0) {
        await client.from('archetypelinkvotes').delete().eq('linkid', linkid).eq('userid', userId);
    } else {
        await client.from('archetypelinkvotes').upsert({ linkid, userid: userId, value: next });
    }

    link.archetypelinkvotes = (link.archetypelinkvotes || []).filter(v => v.userid !== userId);
    if (next !== 0) link.archetypelinkvotes.push({ userid: userId, value: next });

    _links.sort((a, b) => _score(b.archetypelinkvotes) - _score(a.archetypelinkvotes));
    await _renderTop3();
    if (document.getElementById('synergy-search-input')?.value.trim()) window.onSynergySearch();
};

window.synVoteComment = async function (reasonid, dir) {
    const client = _client();
    if (!client) return;
    const session = await window.Auth?.getSession?.();
    if (!session) { _showLoginPrompt('vote on explanations'); return; }

    let reason = null, parentLink = null;
    for (const l of _links) {
        const r = (l.archetypelinkreasons || []).find(r => r.reasonid === reasonid);
        if (r) { reason = r; parentLink = l; break; }
    }
    if (!reason) return;

    const userId = session.user.id;
    const prev = _myVote(reason.archetypelinkreasonvotes, userId);
    const next = prev === dir ? 0 : dir;

    if (next === 0) {
        await client.from('archetypelinkreasonvotes').delete().eq('reasonid', reasonid).eq('userid', userId);
    } else {
        await client.from('archetypelinkreasonvotes').upsert({ reasonid, userid: userId, value: next });
    }

    reason.archetypelinkreasonvotes = (reason.archetypelinkreasonvotes || []).filter(v => v.userid !== userId);
    if (next !== 0) reason.archetypelinkreasonvotes.push({ userid: userId, value: next });

    const detailEl = document.getElementById('syn-detail-' + parentLink.linkid);
    if (detailEl) detailEl.innerHTML = _detailHtml(parentLink, userId);
};

// ---------------------------------------------------------------------------
// Submit a "why it works" explanation
// ---------------------------------------------------------------------------

window.synOpenReasonForm = function (linkid) {
    const form = document.getElementById('syn-reason-form-' + linkid);
    if (form) form.classList.add('show');
};

window.synUpdateCounter = function (linkid) {
    const textarea = document.getElementById('syn-reason-text-' + linkid);
    const counter = document.getElementById('syn-counter-' + linkid);
    const submitBtn = document.getElementById('syn-submit-' + linkid);
    if (!textarea) return;
    const val = textarea.value;
    if (counter) counter.textContent = `${val.length} / 220`;
    if (submitBtn) submitBtn.disabled = val.trim().length < 10 || val.length > 220;
};

window.synSubmitReason = async function (linkid) {
    const client = _client();
    if (!client) return;
    const session = await window.Auth?.getSession?.();
    if (!session) { _showLoginPrompt('share your explanation'); return; }

    const textarea = document.getElementById('syn-reason-text-' + linkid);
    const body = textarea.value.trim();
    if (body.length < 10 || body.length > 220) return;

    const { error } = await client
        .from('archetypelinkreasons')
        .insert({ linkid, userid: session.user.id, body });

    const link = _links.find(l => l.linkid === linkid);
    const detailEl = document.getElementById('syn-detail-' + linkid);

    if (error) {
        // unique_violation -> the user already has an explanation on this pairing
        const msg = error.code === '23505'
            ? 'You’ve already submitted an explanation for this pairing.'
            : 'Could not submit right now — try again shortly.';
        if (detailEl) detailEl.insertAdjacentHTML('beforeend', `<div class="form-error">${window.escapeHtml(msg)}</div>`);
        return;
    }

    if (link) {
        link.archetypelinkreasons = link.archetypelinkreasons || [];
        link.archetypelinkreasons.push({
            reasonid: -Date.now(), // temporary client-side id until reload
            userid: session.user.id,
            body,
            status: 'pending',
            profiles: { displayname: 'You' },
            archetypelinkreasonvotes: [],
        });
        if (detailEl) detailEl.innerHTML = _detailHtml(link, session.user.id);
    }
};

// ---------------------------------------------------------------------------
// Search + suggest a new pairing
// ---------------------------------------------------------------------------

window.onSynergySearch = async function () {
    const input = document.getElementById('synergy-search-input');
    const resultsEl = document.getElementById('synergy-search-results');
    const hintEl = document.getElementById('synergy-search-hint');
    if (!input || !resultsEl) return;

    const q = input.value.trim();
    if (!q) { resultsEl.innerHTML = ''; if (hintEl) hintEl.style.display = 'block'; return; }
    if (hintEl) hintEl.style.display = 'none';

    const linkedIds = new Set(_links.map(l => l.other.archetypeid));
    const localMatches = _links.filter(l =>
        l.other.archetypename.toLowerCase().includes(q.toLowerCase()) && !_links.slice(0, 3).includes(l)
    );

    const client = _client();
    let candidateMatches = [];
    if (client) {
        // iconsvg is backfilled from archetypes-data.js, so "has an icon"
        // doubles as "is a curated site archetype" — only those are linkable,
        // not every row in the archetypes table.
        const { data } = await client
            .from('archetypes')
            .select('archetypeid, archetypename, iconsvg')
            .ilike('archetypename', `%${q}%`)
            .neq('archetypeid', _myArchetypeId)
            .not('iconsvg', 'is', null)
            .limit(8);
        candidateMatches = (data || []).filter(a => !linkedIds.has(a.archetypeid));
    }

    const session = await window.Auth?.getSession?.();
    const userId = session?.user?.id || null;

    let html = localMatches.map(l => _rowHtml(l, 'unranked', userId)).join('');

    if (candidateMatches.length) {
        html += candidateMatches.map(a => `
            <div class="suggest-row">
                <div class="tier-icon">${a.iconsvg || ''}</div>
                <div class="tier-name">${window.escapeHtml(a.archetypename)}</div>
                <button class="suggest-btn" onclick="synSuggestLink(${a.archetypeid}, this)">＋ Suggest pairing</button>
            </div>`).join('');
    }

    if (!html) html = `<div class="search-hint">No archetype found matching "${window.escapeHtml(q)}".</div>`;
    resultsEl.innerHTML = html;
};

window.synSuggestLink = async function (otherArchetypeId, btnEl) {
    const client = _client();
    if (!client) return;
    const session = await window.Auth?.getSession?.();
    if (!session) { _showLoginPrompt('suggest a pairing'); return; }

    const a1 = Math.min(_myArchetypeId, otherArchetypeId);
    const a2 = Math.max(_myArchetypeId, otherArchetypeId);

    const { error } = await client
        .from('archetypelinks')
        .insert({ archetypeid1: a1, archetypeid2: a2, submittedby: session.user.id });

    if (btnEl) {
        if (error) {
            btnEl.textContent = error.code === '23505' ? 'Already suggested — pending review' : 'Could not submit';
        } else {
            btnEl.textContent = 'Submitted — pending review';
        }
        btnEl.disabled = true;
    }
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

window.initSynergyTags = async function (archetypeName) {
    _myArchetypeName = archetypeName;
    const client = _client();
    if (!client) return;

    async function lookup(name) {
        const { data } = await client
            .from('archetypes')
            .select('archetypeid')
            .ilike('archetypename', name)
            .maybeSingle();
        return data;
    }

    // Page names sometimes drift from DB archetypenames (e.g. the page
    // "of the Swamp" is the DB row "Swamp") — retry without a leading
    // "of the " before giving up.
    let data = await lookup(archetypeName);
    if (!data && /^of the /i.test(archetypeName)) {
        data = await lookup(archetypeName.replace(/^of the /i, ''));
    }

    if (!data) {
        console.warn(`[SynergyTags] no archetypes row found for "${archetypeName}" — widget disabled on this page.`);
        return;
    }
    _myArchetypeId = data.archetypeid;

    // Show the real approved-pairings count on the pill immediately —
    // head:true fetches only the count, so this stays cheap on page load.
    const { count } = await client
        .from('archetypelinks')
        .select('linkid', { count: 'exact', head: true })
        .or(`archetypeid1.eq.${_myArchetypeId},archetypeid2.eq.${_myArchetypeId}`)
        .eq('status', 'approved');

    const badgeEl = document.querySelector('#synergy-dock-wrap .synergy-badge');
    if (badgeEl) {
        if (count > 0) { badgeEl.textContent = String(count); badgeEl.style.display = ''; }
        else badgeEl.style.display = 'none';
    }
};
