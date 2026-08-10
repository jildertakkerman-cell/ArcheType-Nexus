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
let _showAll = false;          // top-3 view vs full list
let _searchTimer = null;       // debounce handle for the archetype search
let _lastCandidates = [];      // last "suggest a pairing" search hits, for optimistic insert

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
    // Signed-in users who haven't voted yet get a brief highlight on the
    // pill — a salience nudge toward casting a vote, without nagging.
    const unvoted = userId && mine === 0 ? ' unvoted' : '';
    return `
      <div class="vote-pill${unvoted}">
        <button type="button" class="vote-arrow up ${mine === 1 ? 'active' : ''}" aria-label="Upvote" aria-pressed="${mine === 1}" onclick="${onVote}(${id}, 1)">${UP_ARROW}</button>
        <div class="vote-total ${mine === 1 ? 'up-colored' : mine === -1 ? 'down-colored' : ''}">${_fmt(total)}</div>
        <button type="button" class="vote-arrow down ${mine === -1 ? 'active' : ''}" aria-label="Downvote" aria-pressed="${mine === -1}" onclick="${onVote}(${id}, -1)">${DOWN_ARROW}</button>
      </div>`;
}

function _reasonHtml(reason, userId) {
    const pending = reason.status !== 'approved' ? '<span class="pending-tag">pending review</span>' : '';
    return `
      <div class="comment-item">
        <div class="comment-vote">
          <button type="button" class="vote-arrow up ${_myVote(reason.archetypelinkreasonvotes, userId) === 1 ? 'active' : ''}" aria-label="Upvote explanation" onclick="synVoteComment(${reason.reasonid}, 1)">${UP_ARROW}</button>
          <div class="vote-total">${_fmt(_score(reason.archetypelinkreasonvotes))}</div>
          <button type="button" class="vote-arrow down ${_myVote(reason.archetypelinkreasonvotes, userId) === -1 ? 'active' : ''}" aria-label="Downvote explanation" onclick="synVoteComment(${reason.reasonid}, -1)">${DOWN_ARROW}</button>
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
      <button type="button" class="add-comment-link" onclick="synOpenReasonForm(${link.linkid})">✎ Add your own explanation</button>
      <div class="inline-form" id="syn-reason-form-${link.linkid}">
        <textarea id="syn-reason-text-${link.linkid}" rows="2" maxlength="220" oninput="synUpdateCounter(${link.linkid})" placeholder="Explain the specific interaction…"></textarea>
        <div class="char-counter" id="syn-counter-${link.linkid}">0 / 220</div>
        <div class="form-actions">
          <button class="btn-cancel" onclick="document.getElementById('syn-reason-form-${link.linkid}').classList.remove('show')">Cancel</button>
          <button class="btn-submit" id="syn-submit-${link.linkid}" disabled onclick="synSubmitReason(${link.linkid})">Submit</button>
        </div>
      </div>`;
}

function _rowHtml(link, rankClass, userId, gapHint) {
    const other = link.other;
    const pendingClass = link.status !== 'approved' ? 'pending-row' : '';
    const pageUrl = (window._synergyUrlMap && window._synergyUrlMap[other.archetypename]) || null;

    const approvedReasons = (link.archetypelinkreasons || []).filter(r => r.status === 'approved');
    // Surface the top-voted "why it works" right on the row, so the popover is
    // informative at a glance rather than only after expanding.
    const topReason = approvedReasons
        .slice()
        .sort((a, b) => _score(b.archetypelinkreasonvotes) - _score(a.archetypelinkreasonvotes))[0];
    const teaser = topReason ? `<div class="tier-teaser">${window.escapeHtml(topReason.body)}</div>` : '';
    const gapChip = gapHint ? `<div class="gap-chip">${window.escapeHtml(gapHint)}</div>` : '';

    const nameHtml = `
        <div class="tier-icon">${other.iconsvg || ''}</div>
        <div class="tier-name-wrap">
          <div class="tier-name">${window.escapeHtml(other.archetypename)}${link.status !== 'approved' ? '<span class="pending-tag">pending review</span>' : ''}${pageUrl ? '<span class="goto" aria-hidden="true">↗</span>' : ''}</div>
          ${teaser}${gapChip}
        </div>`;

    // Only the icon + name navigate; vote/comment controls live outside the
    // anchor so a near-miss click can't yank the user to another page. Rows
    // without a known page render as plain text, not a dead link.
    const linkHtml = pageUrl
        ? `<a class="tier-link has-page" href="${window.escapeHtml(pageUrl)}" title="Open the ${window.escapeHtml(other.archetypename)} page">${nameHtml}</a>`
        : `<div class="tier-link">${nameHtml}</div>`;

    return `
      <div class="tier-row ${rankClass} ${pendingClass}" data-linkid="${link.linkid}">
        <div class="tier-bar">${rankClass === 'unranked' ? '' : '#' + rankClass.split('-')[1]}</div>
        ${linkHtml}
        <div class="reddit-controls">
          ${_voteWidget(link.linkid, link.archetypelinkvotes, userId, 'synVote')}
          <button type="button" class="comment-pill" aria-label="Toggle explanations" onclick="synToggleExpand(${link.linkid})">
            ${COMMENT_ICON}<span class="count">${approvedReasons.length}</span>
          </button>
        </div>
      </div>
      <div class="tier-detail" id="syn-detail-${link.linkid}">${_detailHtml(link, userId)}</div>`;
}

function _visibleLinks() {
    return _showAll ? _links : _links.slice(0, 3);
}

// Subtitle under the popover header: social proof (how many votes built this
// list) + agency (your vote moves it). Updated whenever the list re-renders.
function _subText() {
    const totalVotes = _links.reduce((s, l) => s + ((l.archetypelinkvotes || []).length), 0);
    if (_links.length === 0) return 'This list is built entirely by duelists — suggest a pairing to start it.';
    if (totalVotes === 0) return 'No votes yet — yours sets the first ranking.';
    return `Ranked by ${totalVotes} vote${totalVotes === 1 ? '' : 's'} from duelists like you — yours moves the list.`;
}

let _subFlashTimer = null;
function _flashSub(msg) {
    const sub = document.getElementById('synergy-popover-sub');
    if (!sub) return;
    clearTimeout(_subFlashTimer);
    sub.classList.add('flash');
    sub.textContent = msg;
    _subFlashTimer = setTimeout(() => {
        sub.classList.remove('flash');
        sub.textContent = _subText();
    }, 2600);
}

async function _renderList() {
    const listEl = document.getElementById('synergy-tier-list');
    const iconsEl = document.getElementById('synergy-mini-icons');
    const badgeEl = document.querySelector('#synergy-dock-wrap .synergy-badge');
    if (!listEl) return;

    const session = await window.Auth?.getSession?.();
    const userId = session?.user?.id || null;

    const visible = _visibleLinks();

    if (visible.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No community pairings yet for ${window.escapeHtml(_myArchetypeName)} — search below to suggest the first one.</div>`;
    } else {
        let html = visible.map((l, i) => {
            // Goal-gradient nudge: when a pairing trails the rank above by only
            // a few votes, say so — a single vote visibly changing the order is
            // the strongest reason to cast one.
            let gapHint = '';
            if (i > 0 && i < 3 && l.status === 'approved' && visible[i - 1].status === 'approved') {
                const gap = _score(visible[i - 1].archetypelinkvotes) - _score(l.archetypelinkvotes);
                if (gap === 0) gapHint = `Tied with #${i} — your vote breaks it`;
                else if (gap <= 3) gapHint = `${gap} vote${gap === 1 ? '' : 's'} behind #${i} — yours could flip it`;
            }
            return _rowHtml(l, i < 3 ? 'rank-' + (i + 1) : 'unranked', userId, gapHint);
        }).join('');
        if (_links.length > 3) {
            html += `<button type="button" class="show-all-link" onclick="event.stopPropagation(); synToggleShowAll()">${_showAll ? 'Show top 3 only' : `Show all ${_links.length} pairings`}</button>`;
        }
        listEl.innerHTML = html;
    }

    const sub = document.getElementById('synergy-popover-sub');
    if (sub && !sub.classList.contains('flash')) sub.textContent = _subText();

    if (iconsEl) iconsEl.innerHTML = _links.slice(0, 3).map(l => `<span class="mini-icon">${l.other.iconsvg || ''}</span>`).join('');
    if (badgeEl) {
        // Same number the page-load query shows: approved pairings only
        const approvedCount = _links.filter(l => l.status === 'approved').length;
        if (approvedCount > 0) { badgeEl.textContent = String(approvedCount); badgeEl.style.display = ''; }
        else badgeEl.style.display = 'none';
    }
}

window.synToggleShowAll = function () {
    _showAll = !_showAll;
    _renderList();
};

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
        .filter(row => row.status !== 'rejected')
        .map(row => ({ ...row, other: row.archetypeid1 === _myArchetypeId ? row.a2 : row.a1 }))
        .sort((a, b) => _score(b.archetypelinkvotes) - _score(a.archetypelinkvotes));
}

async function _ensureLoaded() {
    if (_loaded || _loading) return;
    _loading = true;
    // Skeleton rows so the first open doesn't sit on an empty box while
    // Supabase responds.
    const listEl = document.getElementById('synergy-tier-list');
    if (listEl && !listEl.innerHTML.trim()) {
        listEl.innerHTML = '<div class="syn-skeleton"></div><div class="syn-skeleton"></div><div class="syn-skeleton"></div>';
    }
    try {
        await _loadLinks();
        _loaded = true;
        await _renderList();
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
            These rankings are decided entirely by duelist votes. Sign in to ${window.escapeHtml(actionLabel)} — it takes a few seconds, and the list only gets better when you weigh in.
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

function _setOpen(shouldOpen, refocusButton) {
    const pop = document.getElementById('synergy-popover');
    if (!pop) return;
    pop.classList.toggle('open', shouldOpen);
    const btn = document.querySelector('#synergy-dock-wrap .synergy-sidebar-btn');
    btn?.setAttribute('aria-expanded', String(shouldOpen));
    if (!shouldOpen && refocusButton) btn?.focus();
    if (shouldOpen) {
        _ensureLoaded();
        // Steer logged-out visitors to sign in right away, not only after
        // their first blocked click.
        window.Auth?.getSession?.().then(session => {
            if (!session) _showLoginPrompt('vote and suggest pairings', true);
        });
    }
}

window.synTogglePopover = function (evt, forceOpen) {
    evt.stopPropagation();
    const pop = document.getElementById('synergy-popover');
    if (!pop) return;
    _setOpen(forceOpen !== undefined ? forceOpen : !pop.classList.contains('open'));
};

document.addEventListener('click', (e) => {
    // Clicks on elements the popover just re-rendered (vote arrows, the
    // show-all toggle) arrive here with a detached target, which would look
    // like an outside click — ignore anything no longer in the document.
    if (e.target instanceof Node && !e.target.isConnected) return;
    const wrap = document.getElementById('synergy-dock-wrap');
    if (wrap && !wrap.contains(e.target)) _setOpen(false);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const pop = document.getElementById('synergy-popover');
    if (pop?.classList.contains('open')) _setOpen(false, true);
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
    if (linkid < 0) return; // optimistic pending row — no server id yet
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
    await _renderList();
    // Immediate feedback: confirm the vote landed and the order reflects it.
    if (next !== 0) _flashSub('✔ Vote counted — the ranking updates with it.');
    else _flashSub('Vote withdrawn — the ranking updates with it.');
    const q = document.getElementById('synergy-search-input')?.value.trim();
    if (q) _doSearch(q);
};

window.synVoteComment = async function (reasonid, dir) {
    if (reasonid < 0) return; // own just-submitted reason — no server id yet
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

    if (linkid < 0) { // optimistic pending row — can't attach reasons until approved
        document.getElementById('syn-detail-' + linkid)?.insertAdjacentHTML('beforeend',
            '<div class="form-error">You can add explanations once this pairing is approved.</div>');
        return;
    }

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

window.onSynergySearch = function () {
    clearTimeout(_searchTimer);
    const input = document.getElementById('synergy-search-input');
    const resultsEl = document.getElementById('synergy-search-results');
    const hintEl = document.getElementById('synergy-search-hint');
    if (!input || !resultsEl) return;

    const q = input.value.trim();
    if (!q) { resultsEl.innerHTML = ''; if (hintEl) hintEl.style.display = 'block'; return; }
    if (hintEl) hintEl.style.display = 'none';

    // Debounce the Supabase ilike query — don't fire one per keystroke.
    _searchTimer = setTimeout(() => _doSearch(q), 250);
};

async function _doSearch(q) {
    const input = document.getElementById('synergy-search-input');
    const resultsEl = document.getElementById('synergy-search-results');
    if (!input || !resultsEl) return;

    const linkedIds = new Set(_links.map(l => l.other.archetypeid));
    const visibleIds = new Set(_visibleLinks().map(l => l.linkid));
    const localMatches = _links.filter(l =>
        l.other.archetypename.toLowerCase().includes(q.toLowerCase()) && !visibleIds.has(l.linkid)
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
    _lastCandidates = candidateMatches;

    // The query is async — bail if the user kept typing meanwhile.
    if (input.value.trim() !== q) return;

    const session = await window.Auth?.getSession?.();
    const userId = session?.user?.id || null;

    let html = localMatches.map(l => _rowHtml(l, 'unranked', userId)).join('');

    if (candidateMatches.length) {
        html += candidateMatches.map(a => `
            <div class="suggest-row">
                <div class="suggest-row-head">
                    <div class="tier-icon">${a.iconsvg || ''}</div>
                    <div class="tier-name">${window.escapeHtml(a.archetypename)}</div>
                </div>
                <textarea class="suggest-reason-input" id="syn-suggest-reason-${a.archetypeid}" rows="2" maxlength="220" oninput="synUpdateSuggestCounter(${a.archetypeid})" placeholder="Why do these work well together? (required)"></textarea>
                <div class="suggest-row-footer">
                    <div class="char-counter" id="syn-suggest-counter-${a.archetypeid}">0 / 220</div>
                    <button type="button" class="suggest-btn" id="syn-suggest-btn-${a.archetypeid}" disabled onclick="synSuggestLink(${a.archetypeid}, this)">＋ Suggest pairing</button>
                </div>
            </div>`).join('');
    }

    if (!html) html = `<div class="search-hint">No archetype found matching "${window.escapeHtml(q)}".</div>`;
    resultsEl.innerHTML = html;
}

// Mirrors synUpdateCounter, but for the required reason attached to a brand
// new pairing suggestion — the submit button stays disabled until it's valid.
window.synUpdateSuggestCounter = function (archetypeId) {
    const textarea = document.getElementById('syn-suggest-reason-' + archetypeId);
    const counter = document.getElementById('syn-suggest-counter-' + archetypeId);
    const btn = document.getElementById('syn-suggest-btn-' + archetypeId);
    if (!textarea) return;
    const val = textarea.value;
    if (counter) counter.textContent = `${val.length} / 220`;
    if (btn) btn.disabled = val.trim().length < 10 || val.length > 220;
};

window.synSuggestLink = async function (otherArchetypeId, btnEl) {
    const client = _client();
    if (!client) return;
    const session = await window.Auth?.getSession?.();
    if (!session) { _showLoginPrompt('suggest a pairing'); return; }

    // A new pairing can't be submitted without saying why it works — the
    // button is disabled until this holds, this is just the safety net.
    const textarea = document.getElementById('syn-suggest-reason-' + otherArchetypeId);
    const body = textarea ? textarea.value.trim() : '';
    if (body.length < 10 || body.length > 220) return;

    const a1 = Math.min(_myArchetypeId, otherArchetypeId);
    const a2 = Math.max(_myArchetypeId, otherArchetypeId);

    // Both inserts happen server-side in one transaction (see
    // supabase/migrations/20260810_submit_synergy_pairing.sql) so a pairing
    // can never be committed without its reason attached.
    const { data: linkid, error } = await client
        .rpc('submit_synergy_pairing', {
            p_archetypeid1: a1,
            p_archetypeid2: a2,
            p_reason_body: body,
        });

    if (error) {
        if (btnEl) {
            btnEl.textContent = error.code === '23505' ? 'Already suggested — pending review' : 'Could not submit';
            btnEl.disabled = true;
        }
        return;
    }

    // Optimistic insert: show the new pairing (with its reason) as a pending
    // row right away instead of a dead "Submitted" button.
    const cand = _lastCandidates.find(c => c.archetypeid === otherArchetypeId);
    if (cand) {
        const newLink = {
            linkid,
            archetypeid1: a1, archetypeid2: a2,
            status: 'pending', submittedby: session.user.id,
            archetypelinkvotes: [],
            archetypelinkreasons: [{
                reasonid: -Date.now(),
                userid: session.user.id,
                body,
                status: 'pending',
                profiles: { displayname: 'You' },
                archetypelinkreasonvotes: [],
            }],
            other: cand,
        };
        _links.push(newLink);
        const suggestRow = btnEl?.closest('.suggest-row');
        if (suggestRow) suggestRow.outerHTML = _rowHtml(newLink, 'unranked', session.user.id);
        await _renderList();
        _flashSub('✔ Suggestion submitted — once approved, the community votes it up or down.');
    } else if (btnEl) {
        btnEl.textContent = 'Submitted — pending review';
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

    // Some archetype names have duplicate rows in the DB that only differ by
    // case (e.g. "Roid" and "roid") — an ilike match against either hits both,
    // and .maybeSingle() throws on ambiguity instead of picking one. Fetch all
    // matches and prefer the exact-case row so a stray duplicate can't disable
    // the widget outright.
    async function lookup(name) {
        const { data } = await client
            .from('archetypes')
            .select('archetypeid, archetypename')
            .ilike('archetypename', name);
        if (!data || data.length === 0) return null;
        return data.find(r => r.archetypename === name) || data[0];
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

    // Accessibility wiring + mini-icons slot, injected here so the static
    // per-page markup doesn't need to change.
    const btn = document.querySelector('#synergy-dock-wrap .synergy-sidebar-btn');
    if (btn) {
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.setAttribute('aria-expanded', 'false');
        btn.title = 'Community-ranked synergies — your votes decide the order';
        if (!document.getElementById('synergy-mini-icons')) {
            const span = document.createElement('span');
            span.id = 'synergy-mini-icons';
            span.className = 'mini-icons';
            span.setAttribute('aria-hidden', 'true');
            btn.appendChild(span);
        }
    }
    const pop = document.getElementById('synergy-popover');
    if (pop) {
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', `Community synergy pairings for ${archetypeName}`);
        pop.querySelector('.synergy-popover-close')?.setAttribute('aria-label', 'Close');
        // Subtitle under the header: tells visitors up front that this list
        // is theirs to shape (updated with live vote counts on load).
        if (!document.getElementById('synergy-popover-sub')) {
            const sub = document.createElement('div');
            sub.id = 'synergy-popover-sub';
            sub.className = 'synergy-popover-sub';
            sub.textContent = 'Community-ranked — every vote reshapes this list.';
            const header = pop.querySelector('.synergy-popover-header');
            if (header) header.insertAdjacentElement('afterend', sub);
            else pop.prepend(sub);
        }
    }

    // Slim page-load query (no reasons/profiles): enough for the badge count
    // and the top-3 mini icons on the button, while the full dataset still
    // loads lazily on first popover open.
    const { data: slim } = await client
        .from('archetypelinks')
        .select(`
            linkid, status, archetypeid1, archetypeid2,
            a1:archetypes!archetypelinks_archetypeid1_fkey(archetypeid, archetypename, iconsvg),
            a2:archetypes!archetypelinks_archetypeid2_fkey(archetypeid, archetypename, iconsvg),
            archetypelinkvotes(userid, value)
        `)
        .or(`archetypeid1.eq.${_myArchetypeId},archetypeid2.eq.${_myArchetypeId}`)
        .eq('status', 'approved');

    const approved = (slim || [])
        .map(row => ({ ...row, other: row.archetypeid1 === _myArchetypeId ? row.a2 : row.a1 }))
        .sort((a, b) => _score(b.archetypelinkvotes) - _score(a.archetypelinkvotes));

    const badgeEl = document.querySelector('#synergy-dock-wrap .synergy-badge');
    if (badgeEl) {
        if (approved.length > 0) { badgeEl.textContent = String(approved.length); badgeEl.style.display = ''; }
        else badgeEl.style.display = 'none';
    }
    const iconsEl = document.getElementById('synergy-mini-icons');
    if (iconsEl) iconsEl.innerHTML = approved.slice(0, 3).map(l => `<span class="mini-icon">${l.other.iconsvg || ''}</span>`).join('');
};


// __SYNERGY_URL_MAP_START__ (generated by scripts/generate-synergy-url-map.js — do not edit by hand)
window._synergyUrlMap = {"@Ignister":"Ignister Archetype Breakdown.html","A-to-Z":"A-to-Z Deck Analysis.html","Abyss Actor":"Abyss Actor Deck Analysis.html","Adamancipator":"Adamancipator Archetype Breakdown.html","Adventure":"Adventure Deck Analysis.html","Adventurer Token":"Adventure Deck Analysis.html","Alien":"Alien Archetype Breakdown.html","Allure Queen":"Allure Queen Archetype Breakdown.html","Ally of Justice":"Ally of Justice Archetype Breakdown.html","Altergeist":"Altergeist Deck Analysis.html","Amazement":"Amazement Deck Analysis.html","Amazoness":"Amazoness Deck Analysis.html","Amorphage":"Amorphage Deck Analysis.html","Ancient Fairy Dragon":"Ancient Fairy Dragon Deck Analysis.html","Ancient Gear":"Ancient Gear Deck Analysis.html","Ancient Warriors":"Ancient Warriors Deck Analysis.html","Angelechy":"Angelechy Deck Analysis.html","Anotherverse":"Anotherverse Deck Analysis.html","Appliancer":"Appliancer Deck Analysis.html","Aquaactress":"Aquaactress Deck Analysis.html","Arcana Force":"Arcana Force Deck Analysis.html","Archfiend":"Archfiend Deck Analysis.html","Argostars":"Argostars Deck Analysis.html","Armed Dragon":"Armed Dragon Deck Analysis.html","Armored Xyz":"Armored xyz Deck Analysis.html","Aroma":"Aroma Deck Analysis.html","Artifact":"Artifact Deck Analysis.html","Artmage":"Artmage Deck Analysis.html","Ashened":"Ashened Deck Analysis.html","Assault Mode":"Assault Mode Archetype Breakdown.html","Atlantean":"Atlantean Deck Analysis.html","Azamina":"Azamina Deck Analysis.html","B.E.S.":"B.E.S. Deck Analysis.html","Backup":"Backup Deck Analysis.html","Bamboo Sword":"Bamboo Sword Deck Analysis.html","Barbaros":"Barbaros Deck Analysis.html","Barrier Statue":"Barrier statue deck analysis.html","Batteryman":"Batteryman Deck Analysis.html","Battleguard":"Battleguard Deck Analysis.html","Battlewasp":"Battlewasp Deck Analysis.html","Battlin' Boxer":"Battlin' Boxer Deck Analysis.html","Beetrooper":"Beetrooper Deck Analysis.html","Black Dinosaur":"Black Dinosaur Deck Analysis.html","Black Luster Soldier":"Black Luster Soldier Deck Analysis.html","Blackwing":"Blackwing Deck Analysis.html","Blitzclique":"Blitzclique Deck Analysis.html","Blue-Eyes":"Blue-Eyes Deck Analysis.html","Book":"Book Deck Analysis.html","Bounzer":"Bounzer Deck Analysis.html","Branded":"Branded Deck Analysis.html","Bujin":"Bujin Deck Analysis.html","Burning Abyss":"Burning Abyss Deck Analysis.html","Buster Blader":"Buster Blader Deck Analysis.html","Butterspy":"Butterspy Deck Analysis.html","Bystial":"Bystial Deck Analysis.html","C Series":"C Series Deck Analysis.html","Call of the Haunted":"Call of the Haunted deck Analysis.html","Cataclysmic":"Cataclysmic Deck Analysis.html","Celtic Guard":"Celtic Guard Deck Analysis.html","Centur-Ion":"Centur-Ion Deck Analysis.html","Chaos":"Chaos Deck Analysis.html","Charity":"Charity Deck Analysis.html","Charmer":"Charmer Deck Analysis.html","Chemicritter":"Chemicritter Deck Analysis.html","Chimera":"Chimera Deck Analysis.html","Chronomaly":"Chronomaly Deck Analysis.html","Chtonian Infernal":"Chtonian Infernal Deck Analysis.html","Cicada":"Cicada Deck Analysis.html","Clear World":"Clear World Deck Analysis.html","Cloudian":"Cloudian Deck Analysis.html","Clown Crew":"Clown Crew Deck Analysis.html","Coach":"Coach Deck Analysis.html","Cocoon of evolution":"Cocoon of evolution Deck Analysis.html","Cocoon of Evolution":"Cocoon of evolution Deck Analysis.html","Code Breaker":"Code Breaker Deck Analysis.html","Code Talker":"Code Talker Deck Analysis.html","Codebreaker":"Code Breaker Deck Analysis.html","Constellar":"Constellar Deck Analysis.html","Cosmic Dragon":"Cosmic Dragon Deck Analysis.html","Counter Fairy":"Counter Fairy Deck Analysis.html","Crashbug":"Crashbug Deck Analysis.html","Crusadia":"Crusadia Deck Analysis.html","Crystal Beast":"Crystal Beast Deck Analysis.html","Crystron":"Crystron Deck Analysis.html","Cubic":"Cubic Deck Analysis.html","Cupid":"Cupid Deck Analysis.html","Curse of Dragon":"Curse of Dragon Deck Analysis.html","Cyber Angel":"Cyber Angel Deck Analysis.html","Cyber Dragon":"Cyber Dragon Deck Analysis.html","Cyber Girl":"Cyber Girl Deck Analysis.html","Cyberdark":"Cyberdark Deck Analysis.html","Cyberse":"Cyberse Deck Analysis.html","Cyclone":"Cyclone deck Analysis.html","D.D.":"D.D. Deck Analysis.html","D/D":"D_D Deck Analysis.html","Danger!":"Danger Deck Analysis.html","Dark Blade":"Dark Blade Deck Analysis.html","Dark Grepher":"Grepher Deck Analysis.html","Dark Lucius":"Dark Lucius Deck Analysis.html","Dark Magician":"Dark Magician Deck Analysis.html","Dark Scorpion":"Dark Scorpion Deck Analysis.html","Dark World":"Dark World Deck Analysis.html","Darklord":"Darklord Deck Analysis.html","Deep Sea":"Deep Sea Deck Analysis.html","Designator":"Designator Deck Analysis.html","Deskbot":"Deskbot Deck Analysis.html","Despia":"Despia Deck Analysis.html","Destiny HERO":"Destiny Hero Deck Analysis.html","Diabellstar":"Diabellstar Deck Analysis.html","Diabolos":"Diabolos Deck Analysis.html","Die Roll":"Die Roll Deck Analysis.html","Digital Bug":"Digital Bug Deck Analysis.html","Dinomist":"Dinomist Deck Analysis.html","Dinomorphia":"Dinomorphia Deck Analysis.html","Dinowrestler":"Dinowrestler Deck Analysis.html","Djinn":"Djinn Deck Analysis.html","Djinn of the Rituals":"Djinn of the Rituals Deck Analysis.html","Dododo":"Dododo Deck Analysis.html","Dogmatika":"Dogmatika Deck Analysis.html","Doll monster":"Doll monster deck analysis.html","Doll Monster":"Doll monster deck analysis.html","Dominus":"Dominus Deck Analysis.html","Doodle Beast":"Doodle Beast Deck Analysis.html","DoomZ":"Doom-Z Archetype Deep Dive.html","Doriado":"Doriado Deck Analysis.html","Dracoslayer":"Dracoslayer Deck Analysis.html","Dracotail":"Dracotail Archetype Breakdown.html","Dragon Link":"Dragon Link Deck Analysis.html","Dragon Ruler":"Dragon Ruler Deck Analysis.html","Dragonmaid":"Dragonmaid Deck Analysis.html","Dragunity":"Dragunity Deck Analysis.html","Dream Mirror":"Dream Mirror Deck Analysis.html","Drytron":"Drytron Deck Analysis.html","Dual Avatar":"Dual Avatar Deck Analysis.html","Duel Dragon":"Duel Dragon Deck Analysis.html","Duston":"Duston Deck Analysis.html","Earthbound":"Earthbound Deck Analysis.html","Ecclesia":"Ecclesia Deck Analysis.html","Egyptian God":"Egyptian God Deck Analysis.html","Eldlich":"Eldlich Deck Analysis.html","Elemental HERO":"Elemental Hero Deck Analysis.html","Elfnote":"Elfnote Deck Analysis.html","Empowered Warrior":"Empowered Warrior Deck Analysis.html","End of the World":"End of the World Deck Analysis.html","Endymion":"Endymoin Deck Analysis.html","Engine Token":"Engine Token Deck Analysis.html","Enneacraft":"Enneacraft Deck Analysis.html","Entity":"Entity Deck Analysis.html","Evil Eye":"Evil Eye Deck Analysis.html","Evil Hero":"Evil Hero Deck Analysis.html","Evil HERO":"Evil Hero Deck Analysis.html","Evilswarm":"lswarm Deck Analysis.html","Evol":"Evol Deck Analysis.html","Exchange of the Spirit":"Exchange of the Spirit Deck Analysis.html","Exodia":"Exodia Deck Analysis.html","Exosister":"Exosister Deck Analysis.html","F.A.":"F.A. Deck Analysis.html","Fabled":"Fabled Deck Analysis.html","Fairy Tail":"Fairy Tale Deck Analysis.html","Fairy Tale":"Fairy Tale Deck Analysis.html","Fallen of Albaz":"Fallen of Albaz Deck Analysis.html","Favorite":"Favorite Deck Analysis.html","Felgrand":"Felgrand Deck Analysis.html","Feral Imp":"Feral Imp Deck Analysis.html","Fiendsmith":"Fiendsmith Deck Analysis.html","Fire Fist":"Fire Fist Deck Analysis.html","Fire King":"Fire King Deck Analysis.html","Firewall":"Firewall Deck Analysis.html","Fishborg":"Fishborg Deck Analysis.html","Flame Swordsman":"Flame Swordsman Deck Analysis.html","Flamvell":"Flamvell Deck Analysis.html","Fleur":"Fleur Deck Analysis.html","Floowandereeze":"Floowandereeze Deck Analysis.html","Flower Cardian":"Flower Cardian Deck Analysis.html","Fluffal":"Fluffal Deck Analysis.html","Fortune Lady":"Fortune Lady Deck Analysis.html","Fossil":"Fossil Deck Analysis.html","Frog":"Frog Deck Analysis.html","From the Underworld":"From the Underworld Deck Analysis.html","Fur Hire":"Fur Hire Deck Analysis.html","Fusion":"Fusion Deck Analysis.html","G Golem":"G Golem Deck Analysis.html","Gadget":"Gadget Deck Analysis.html","Gagaga":"Gagaga Deck Analysis.html","Gagagigo":"Gigo Deck Analysis.html","Gaia":"Gaia Deck Analysis.html","Gaia Knight":"Gaia Deck Analysis.html","Galaxy-photon":"Galaxy-photon Deck Analysis.html","Galaxy-Photon":"Galaxy-photon Deck Analysis.html","Gandora":"Gandora Deck Analysis.html","Gate Guardian":"Gate Guardian Deck Analysis.html","Gearfried":"Gearfried Deck Analysis.html","Geargia":"Geargia Deck Analysis.html","Gem-Knight":"Gem-Knight Deck Analysis.html","Generaider":"Generaider Deck Analysis.html","Genex":"Genex Deck Analysis.html","Ghostrick":"Ghostrick Deck Analysis.html","Ghoti":"Ghoti Deck Analysis.html","Gigo":"Gigo Deck Analysis.html","Gimmick Puppet":"Gimmick Puppet Deck Analysis.html","Gishki":"Gishki Deck Analysis.html","Gizmek":"Gizmek Deck Analysis.html","Glacial Beast":"Glacial Beast Deck Analysis.html","Gladiator Beast":"Gladiator Beast Deck Analysis.html","GMX":"GMX Deck Analysis.html","Goblin":"Goblin Deck Analysis.html","Gogogo":"Gogogo Deck Analysis.html","Gold Pride":"Gold Pride Deck Analysis.html","Golden Castle of Stromberg":"Golden Castle of Stromberg Deck Analysis.html","Gorgonic":"Gorgonic Deck Analysis.html","Gouki":"Gouki Deck Analysis.html","Goyo":"Goyo Deck Analysis.html","Gravekeeper's":"Gravekeepers Deck Analysis.html","Gravekeepers":"Gravekeepers Deck Analysis.html","Graydle":"Graydle Deck Analysis.html","Grepher":"Grepher Deck Analysis.html","Guardragon":"Guardragon Deck Analysis.html","Gunkan":"Gunkan Deck Analysis.html","Gusto":"Gusto Deck Analysis.html","Hand":"Hand Deck Analysis.html","Harpie":"Harpie Deck Analysis.html","Hazy flame":"Hazy flame Deck Analysis.html","Hazy Flame":"Hazy flame Deck Analysis.html","Hecahands":"Hecahands Deck Analysis.html","Helios":"Helios Deck analysis.html","Herald":"Herald Deck Analysis.html","Heraldic Beast":"Heraldic Beasts Deck Analysis.html","Heraldic Beasts":"Heraldic Beasts Deck Analysis.html","Heroic":"Heroic Deck Analysis.html","Hex Sealed Fusion":"Hex Sealed Fusion Deck Analysis.html","Hieratic":"Hieratic Deck Analysis.html","Horn of Heaven":"Horn of Heaven Deck Analysis.html","Horus":"Horus Deck Analysis.html","hunder":"hunder Deck analysis.html","Hunder":"hunder Deck analysis.html","Ice Barrier":"Ice Barrier Deck Analysis.html","Icejade":"Icejade Deck Analysis.html","Igknight":"Igknight Deck Analysis.html","Impcantation":"Impcantation Deck Analysis.html","Imperial traps":"Imperial traps Deck Analysis.html","Inca":"Inca Deck Analysis.html","Infernal":"Infernal Deck Analysis.html","Infernal Flame":"Infernal Deck Analysis.html","Infernity":"Infernity Deck Analysis.html","Infernoid":"Infernoid Deck Analysis.html","Infinitrack":"Infinittrack Deck Analysis.html","Inpachi":"Inpachi Deck Analysis.html","Invoked":"Invoked Deck Analysis.html","Inzektor":"Inzektor Deck Analysis.html","Iron Chain":"Iron Chain Deck Analysis.html","Jar":"Jar Deck Analysis.html","Jinzo":"Jinzo Deck Analysis.html","Junk":"Junk Deck Analyis.html","Jurrac":"Jurrac Deck Analysis.html","K9":"K9 Deck Analysis.html","Kaiju":"Kaiju Deck Analysis.html","Kaiser Glider":"Kaiser Glider Deck Analysis.html","Karakuri":"Karakuri Deck Analysis.html","Kashtira":"Kashtira Deck Analysis.html","Kewl Tune":"Kewl tune Deck Analysis.html","Knightmare":"Knightmare Deck Analysis.html","Koa'ki Meiru":"Koaki Meiru Deck Analysis.html","Koala":"Koala Deck Analysis.html","Kozmo":"Kozmo Deck Analysis.html","Krawler":"Krawler Deck Analysis.html","Kuriboh":"Kuriboh Deck Analysis.html","Labrynth":"Labrynth Deck Analysis.html","Lair of Darkness":"Lair of Darkness Deck Analysis.html","Laval":"Laval Deck Analysis.html","Legacy of Greed":"Legacy of Greed Deck Analysis.html","Legendary Dragon":"Legendary Dragon Deck Analysis.html","Legendary Planet":"Legendary Planet Deck Analysis.html","Libromancer":"Libromancer Deck Analysis.html","Light and Darkness Dragon":"Light and Darkness Dragon Deck Analysis.html","Light and Darkness Ritual":"Light and Darkness Ritual Deck Analysis.html","Lightray":"Lightray Deck Analysis.html","Lightsworn":"Lightsworn Deck Analysis.html","Live★Twin":"Live Twin Deck Analysis.html","Lost World":"Lost World Deck Analysis.html","lswarm":"lswarm Deck Analysis.html","Lunalight":"Lunalight Deck Analysis.html","Lyrilusc":"Lyrilusc Deck Analysis.html","Machina":"Machina Deck Analysis.html","Madolche":"Madolche Deck Analysis.html","Madoor":"Madoor Deck Analysis.html","Magical Musket":"Magical Muskets Deck Analysis.html","Magical Muskets":"Magical Muskets Deck Analysis.html","Magician Girl":"Magician Girl Deck Analysis.html","Magikey":"Magikey Deck Analysis.html","Magistus":"Magistus Deck Analysis.html","Magnet Warrior":"Magnet Warrior Deck Analysis.html","Majespecter":"Majespecter Deck Analysis.html","Majestic":"Majestic Deck Analysis.html","Majestic Mech":"Majestic Mech Deck Analysis.html","Maju":"Maju Deck Analysis.html","Malefic":"Malefic Deck Analysis.html","Malicevorous":"Malicevorous Deck Analysis.html","Maliss":"Maliss Deck Analysis.html","Mannadium":"Mannadium Deck Analysis.html","Marinces":"Marinces Deck Analysis.html","Marincess":"Marinces Deck Analysis.html","Masked hero":"Masked hero Deck Analysis.html","Masked HERO":"Masked hero Deck Analysis.html","Materiactor":"Materiactor Deck Analysis.html","Mathmech":"Mathmech Deck Analyis.html","Mayakashi":"Mayakashi Deck Analysis.html","Mega Phantom Beast":"Mega Phantom Beast Deck Analysis.html","Megalith":"Megalith Deck Analysis.html","Mekk-knight":"Mekk-knight Deck Analysis.html","Mekk-Knight":"Mekk-knight Deck Analysis.html","Meklord":"Meklord Deck Analysis.html","Melffy":"Melffy Deck Analysis.html","Melodious":"Melodious Deck Analysis.html","Memento":"Memento Deck Analysis.html","Mermail":"Mermail Deck Analysis.html","Metalfoes":"Metalfoes Deck Analysis.html","Metalmorph":"Metalmorph Deck Analysis.html","Metaphys":"Metaphys Deck Analysis.html","Mikanko":"Mikanko Deck Analysis.html","Millennium":"Millenium Deck Analysis.html","Mimighoul":"Mimighoul Deck Analysis.html","Mirror Force":"Mirror Force Deck Analysis.html","Mist Valley":"Mist Valley Deck Analysis.html","Mitsurugi":"Mitsurugi Deck Analysis.html","Mokey Mokey":"Mokey Mokey Deck Analysis.html","Monarch":"Monarch Deck Analysis.html","Morganite":"Morganite Deck Analysis.html","Morphtronic":"Morphtronic Deck Analysis.html","Mudragon":"Mudragon Deck Analysis.html","Mystic Swordsman":"Mystic Swordsman Deck Analysis.html","Mystical Beast of the Forest":"Mystical Beast of the Forest Deck Analysis.html","Mystical Elf":"Mystical Elf Deck Analysis.html","Mythical beast":"Mythical beast Deck analysis.html","Myutant":"Myutant Deck Analysis.html","Naturia":"Naturia Deck Analysis.html","Nekroz":"Nekroz Deck Analysis.html","Nemeses":"Nemesis Deck analysis.html","Nemesis":"Nemesis Deck analysis.html","Nemleria":"Nemleria Deck Analysis.html","Neo Spacian":"Neo Spacian Deck Analysis.html","Neo-Spacian":"Neo Spacian Deck Analysis.html","Nephthys":"Nepthys Deck Analysis.html","Nepthys":"Nepthys Deck Analysis.html","Nimble":"Nimble Deck Analysis.html","Ninja":"Ninja Deck Analysis.html","Nitro":"Nitro Deck Analysis.html","Noble Knight":"Noble Knight Deck Analysis.html","Nordic":"Nordic Deck Analysis.html","Nouvelles":"Nouvelles Deck Analysis.html","Number":"Number Deck Analysis.html","Numeron":"Numeron Deck Analysis.html","Obelisk the Tormentor":"Obelisk the Tormentor Deck Analysis.html","Odd-Eyes":"Odd-Eyes Deck Analysis.html","of the Swamp":"of the Swamp Deck Analysis.html","Of the Swamp":"of the Swamp Deck Analysis.html","Ogdoadic":"Ogdoadic Deck Analysis.html","Ojama":"Ojama Deck Analysis.html","Onomat":"Onomat Deck Analysis.html","Orcust":"Orcust Deck Analysis.html","P series":"P series Deck Analysis.html","P.U.N.K.":"P.U.N.K. Deck Analysis.html","Paladin of Dragon":"Paladin of Dragon Deck Analysis.html","Paladins of Dragons":"Paladin of Dragon Deck Analysis.html","Paleozoic":"Paleozoic Deck Analysis.html","Parshath":"Parshath Deck Analysis.html","Pendulum":"Pendulum Magician Deck Analysis.html","Pendulum Magician":"Pendulum Magician Deck Analysis.html","Pendulum Pile":"Pendulum Pile Deck Analysis.html","Penguin":"Penguin Deck Analysis.html","Performage":"Performage Deck Analysis.html","Performapal":"Performapal Deck Analysis.html","Phantasm Spiral":"Phantasm Spiral Deck Analysis.html","Phantom Knights":"Phantom knights Deck Analysis.html","Plunder Patrol":"Plunder patrol deck analysis.html","Plunder Patroll":"Plunder patrol deck analysis.html","Polymerisation":"Polymerisation Deck Analysis.html","Pot of":"Pot of Deck Analyis.html","Potan":"Potan Deck Analysis.html","Power Patron":"Power Patron Deck Analysis.html","Power Tool":"Power Tool Deck Analysis.html","Prank Kids":"Prank_kids Deck Analysis.html","Prank-Kids":"Prank_kids Deck Analysis.html","Predaplant":"Predaplant Deck Analysis.html","Prediction Princess":"Predicition Princess Deck Analysis.html","Primite":"Primite Deck Analysis.html","Prophecy":"Prophecy Deck Analysis.html","Pseudo Trap Monster":"Pseudo Trap Monster Deck Analysis.html","Psy-Frame":"Psy_Frame Deck Analysis.html","Psychic":"Psychic Deck Analysis.html","Purrely":"Purrely Deck Analysis.html","Qliphort":"Qliphort Deck Analysis.html","R.B.":"Rebel Bots Deck Analysis.html","Raccoon":"Raccoon Deck Analysis.html","Radiant Typhoon":"Radiant Typhoon Deck Analysis.html","Ragnaraika":"Ragnaraika Deck Analysis.html","Raidraptor":"Raidraptor Deck Analysis.html","Raigeki":"Raigeki Deck Analysis.html","Reactor":"Reactor Deck Analysis.html","Rebel Bots":"Rebel Bots Deck Analysis.html","Red Dragon Archfiend":"Red Dragon Archfiend Deck Analysis.html","Red-Eyes":"Red-Eyes Deck Analysis.html","Regenesis":"Regenesis Deck Analysis.html","Relinquished":"Relinquished Deck Analysis.html","Reptiliane":"Reptiliane Deck Analysis.html","Reptilianne":"Reptiliane Deck Analysis.html","Rescue":"Rescue Deck Analysis.html","Rescue ACE":"Rescue ACE Deck Analysis.html","Rescue-ACE":"Rescue ACE Deck Analysis.html","Resonator":"Resonator Deck Analysis.html","Rikka":"Rikka Deck Analysis.html","Risebell":"Risebell Deck Analysis.html","Ritual Art":"Ritual Art Deck Analysis.html","Ritual Beast":"Ritual Beast Deck Analysis.html","Roid":"Roid deck Analysis.html","Rokket":"Rokket Deck Analysis.html","Rose Dragon":"Rose Dragon Deck Analysis.html","Royal":"Royal Deck Analysis.html","Runick":"Runick Deck Analysis.html","Ryu-Ge":"Ryuge Deck Analysis.html","Ryzeal":"Ryzeal Deck Analysis.html","S-Force":"S-Force Deck Analysis.html","Sacred Beast":"Sacred Beast Deck Analysis.html","Salamangreat":"Salamangreat Deck Analysis.html","Sasuke":"Sasuke Deck Analysis.html","Scareclaw":"Scareclaw Deck Analysis.html","Scrap":"Scrap Deck Analysis.html","Scrap Iron":"Scrap Iron Deck Analysis.html","Shaddoll":"Shaddol Deck Analysis.html","Shark":"Shark Deck Analysis.html","Shining Sarcophagus":"Shining Sarcophagus Deck Analysis.html","Shinobird":"Shinobird Deck Analysis.html","Shiranui":"Shiranui Deck Analysis.html","Signer Dragon":"Signer Dragon Deck Analysis.html","Silent Magician":"Silent Magician Deck Analysis.html","Simorgh":"Simorgh Deck Analysis.html","Six Samurai":"Six Samurai Deck Analysis.html","Skilled Magician":"Skilled Magician Deck Analysis.html","Skull Servant":"Skull Servant Deck Analysis.html","Sky Scourge":"Sky Scourge Deck Analysis.html","Sky Striker":"Sky Striker Deck Analysis.html","Skyblaster":"Skyblaster Deck Analysis.html","Skyscraper":"Skyscraper Deck Analysis.html","Slifer the Sky Dragon":"Slifer the Sky Dragon Deck Analysis.html","Smile":"Smile Deck Analysis.html","Snake-Eyes":"Snake-Eyes Deck Analysis.html","Solemn":"Solemn Deck Analysis.html","Solfachord":"Solfachord Deck Analysis.html","Speedroid":"Speedroid Deck Analysis.html","Sphinx":"Sphinx Deck Analysis.html","Spider":"Spider Deck Analysis.html","Spirit message":"Spirit message Deck Analysis.html","Spirit monster":"Spirit monster Deck Analysis.html","Spright":"Spright Deck Analysis.html","Springans":"Springans Deck Analysis.html","SPYRAL":"SPYRAL Deck Analysis.html","Star Seraph":"Star Seraph Deck Analysis.html","Star Warrior":"Star Warrior Deck Analysis.html","Stardust":"Stardust Deck Analysis.html","Starry Knight":"Starry Knight Deck Analysis.html","Stealth Kragen":"Stealth Kragen Deck Analysis.html","Stygian":"Stygian Deck Analysis.html","Subterror":"Subterror Deck Analysis.html","Summoned Skull":"Summoned Skull Deck Analysis.html","Sunavalon":"Sunavalon Deck Analysis.html","Super Defence Robot":"Super Defence Robot Deck Analysis.html","Super Quant":"Super Quant Deck analysis.html","Superheavy Samurai":"Superheavy Samurai Deck Analysis.html","Supreme King":"Supreme King Deck Analysis.html","Swordsoul":"Swordsoul Deck Analysis.html","Sylvan":"Sylvan Deck Analyis.html","Symphonic Warrior":"Symphonic Warrior Deck Analysis.html","Synchron":"Synchron Deck Analysis.html","T.G.":"T.G. Deck Analysis.html","Tearlaments":"Tearlaments Deck Analysis.html","Temple of the Kings":"Temple of the Kings Deck Analysis.html","Tenpai Dragon":"Tenpai Dragon Deck Analysis.html","Tenyi":"Tenyi Deck Analysis.html","The Agents":"The Agents Deck Analysis.html","The Weather":"The Weather Deck Analysis.html","Therion":"Therion Deck Analysis.html","Three Musketeers":"Three Musketeers Deck Analysis.html","Thunder Dragon":"Thunder Dragon Deck Analysis.html","Time Thief":"Time Thief Deck Analysis.html","Timelord":"Timelord Deck Analysis.html","Tindangle":"Tindangle Deck Analyis.html","Tistina":"Tistina Deck Analysis.html","Toon":"Toon Deck Analysis.html","Topologic":"Topologic Deck Analysis.html","Toy":"Toy Deck Analysis.html","Trains":"Trains Deck Analysis.html","Transcendosaurus":"Transcendosaurus Deck Analysis.html","Traptrix":"Traptrix Deck Analysis.html","Tri-Brigade":"Tri-Brigade Deck Analysis.html","Triamid":"Triamid Deck Analysis.html","Trickstar":"Trickstar Deck Analysis.html","True Draco":"True King True Draco Deck Analysis.html","True King True Draco":"True King True Draco Deck Analysis.html","U.A.":"U.A. Deck Analysis.html","Ultimate Insect":"Ultimate Insect Deck Analysis.html","Umi":"Umi Deck Analysis.html","Unchained":"Unchained Deck Analysis.html","Ursarctic":"Ursarctic Deck Analysis.html","Utopia":"Utopia Deck Analysis.html","Vaalmonica":"Vaalmonica Deck Analysis.html","Valkyrie":"Valkyrie Deck Analysis.html","Vampire":"Vampire Deck Analysis.html","Vanquish Soul":"Vanquish Soul Deck Analysis.html","Vaylantz":"Vaylantz Deck Analysis.html","Veda":"Veda Deck Analysis.html","Vendread":"Vendread Deck Analysis.html","Venom":"Venom Deck Analysis.html","Vernussylpth":"Vernussylpth Deck Analysis.html","Virtual World":"Virtual World Deck Analysis.html","Visas":"Visas Deck Analysis.html","Vision hero":"Vision hero Deck Analysis.html","Vision HERO":"Vision hero Deck Analysis.html","Voiceless Voice":"Voiceless Voice Deck Analysis.html","Volcanic":"Volcanic Deck Analysis.html","Vylon":"Vylon Deck Analysis.html","WAKE CUP!":"Wake CUP Deck Analysis.html","War Rock":"War Rock Deck Analysis.html","Warrior":"Warrior Deck Analysis.html","Warrior Lady":"Warrior Lady Deck Analysis.html","Water Dragon":"Water Dragon Deck Analysis.html","Watt":"Watt Deck Analysis.html","White Aura":"White Aura Deck Analysis.html","White Forest":"White Forest Deck Analysis.html","Wicked Gods":"Wicked Gods Deck Analysis.html","Wind-up":"Wind-up Deck Analysis.html","Windwitch":"Windwitch Deck analysis.html","Winged Dragon of Ra":"Winged Dragon of Ra Deck Analysis.html","Witchcrafter":"Witchcrafter Deck Analysis.html","World Chalice":"World Chalice Deck Analysis.html","Worm":"Worm Deck Analysis.html","X-Saber":"X-saber Deck Analysis.html","Xtra Hero":"Xtra Hero Deck Analysis.html","Xtra HERO":"Xtra Hero Deck Analysis.html","Xyz":"Armored xyz Deck Analysis.html","Yang Zing":"Yang Zing Deck Analysis.html","Yokai Girl":"Yokai Girl Deck Analysis.html","Yosenju":"Yosenju Deck Analysis.html","Yubel":"Yubel Deck Analysis.html","Yummy":"Yummy Archetype Deep Dive.html","Zefra":"Zefra Deck Analysis.html","Zera":"Zera Deck Analysis.html","Zombie World":"Zombie World Deck Analysis.html","Zoodiac":"Zoodiac Deck analysis.html","Zubaba":"Zubaba Deck Analysis.html"};
// __SYNERGY_URL_MAP_END__
