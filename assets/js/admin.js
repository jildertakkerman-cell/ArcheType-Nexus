/**
 * admin.js — Moderation panel: Combo guides, Synergy Links, Synergy Reasons, Section Rewrites.
 * Requires: supabase-config.js, auth.js, text-utils.js loaded first.
 */
(function () {
    'use strict';

    let _client = null;

    function client() {
        if (!_client) _client = window.Auth._getClient();
        return _client;
    }

    const GCS_BASE = 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/';
    const ANALYZER_URL = '../pages/Replay-Analyzer.html';
    const BACKEND_URL = 'https://yrp-10714964039.europe-west1.run.app';

    function formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // ------------------------------------------------------------------
    // Shared moderation state-machine: one instance per content type
    // (combos / links / reasons). Handles the cache, tab rendering, and
    // approve/reject/unapprove transitions generically; card markup stays
    // a per-domain callback since combos/links/reasons render genuinely
    // different content.
    // ------------------------------------------------------------------
    function createModerationTabGroup({ group, table, pkColumn, countBadgeId, fetchRows, renderCard, approveFn, afterRenderTab }) {
        const cache = { pending: [], approved: [], rejected: [] };

        function renderTab(tab) {
            const container = document.getElementById(`tab-${group}-${tab}`);
            if (!container) return;
            const rows = cache[tab];
            if (!rows.length) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i>No ${tab} submissions</div>`;
                return;
            }
            container.innerHTML = rows.map(r => renderCard(r, tab)).join('');
            // Optional per-group post-insert step — sections uses this to load
            // combo-walkthrough card art, which needs the container elements to
            // already exist in the live DOM (see sectionsAfterRenderTab).
            if (afterRenderTab) afterRenderTab(tab, rows);
        }

        function updateCount() {
            const el = document.getElementById(countBadgeId);
            if (el) el.textContent = cache.pending.length ? `(${cache.pending.length})` : '';
        }

        function removeCard(id) {
            const card = document.getElementById(`card-${group}-${id}`);
            if (card) card.remove();
        }

        async function setStatus(id, status, modnotes) {
            const update = { status };
            if (modnotes !== undefined) update.modnotes = modnotes || null;
            const { error } = await client().from(table).update(update).eq(pkColumn, id);
            if (error) throw error;
        }

        async function approve(id) {
            try {
                // Most groups just flip status; `sections` needs the
                // supersede-then-approve RPC so the one-live-version-per-key
                // invariant can't be violated by a plain update.
                if (approveFn) await approveFn(id); else await setStatus(id, 'approved');
                removeCard(id);
                for (const tab of ['pending', 'rejected']) {
                    const idx = cache[tab].findIndex(r => String(r[pkColumn]) === String(id));
                    if (idx !== -1) {
                        const [row] = cache[tab].splice(idx, 1);
                        row.status = 'approved';
                        cache.approved.unshift(row);
                        renderTab(tab);
                        renderTab('approved');
                        updateCount();
                        window.switchTab(group, 'approved');
                        break;
                    }
                }
            } catch (e) { alert('Error: ' + e.message); }
        }

        async function reject(id, notes) {
            try {
                await setStatus(id, 'rejected', notes);
                removeCard(id);
                const idx = cache.pending.findIndex(r => String(r[pkColumn]) === String(id));
                if (idx !== -1) {
                    const [row] = cache.pending.splice(idx, 1);
                    row.status = 'rejected';
                    row.modnotes = notes;
                    cache.rejected.unshift(row);
                    renderTab('pending');
                    renderTab('rejected');
                    updateCount();
                    window.switchTab(group, 'rejected');
                }
            } catch (e) { alert('Error: ' + e.message); }
        }

        async function unapprove(id) {
            try {
                await setStatus(id, 'pending');
                removeCard(id);
                const idx = cache.approved.findIndex(r => String(r[pkColumn]) === String(id));
                if (idx !== -1) {
                    const [row] = cache.approved.splice(idx, 1);
                    row.status = 'pending';
                    cache.pending.unshift(row);
                    renderTab('approved');
                    renderTab('pending');
                    updateCount();
                    window.switchTab(group, 'pending');
                }
            } catch (e) { alert('Error: ' + e.message); }
        }

        async function init() {
            let rows;
            try {
                rows = await fetchRows(client());
            } catch (e) {
                const el = document.getElementById(`tab-${group}-pending`);
                if (el) el.innerHTML = `<p style="color:#f87171;">Failed to load: ${e.message}</p>`;
                return;
            }
            cache.pending = rows.filter(r => r.status === 'pending');
            cache.approved = rows.filter(r => r.status === 'approved');
            cache.rejected = rows.filter(r => r.status === 'rejected');
            updateCount();
            renderTab('pending');
            renderTab('approved');
            renderTab('rejected');
        }

        return { init, approve, reject, unapprove, cache };
    }

    const groups = {}; // populated in init(), keyed by group name

    window.adminApprove = (group, id) => groups[group]?.approve(id);
    window.adminReject = (group, id) => groups[group]?.reject(id, document.getElementById(`notes-${group}-${id}`)?.value?.trim() || '');
    window.adminUnapprove = (group, id) => groups[group]?.unapprove(id);

    window.switchTab = function (group, tab, btn) {
        ['pending', 'approved', 'rejected'].forEach(t => {
            const el = document.getElementById(`tab-${group}-${t}`);
            if (el) el.style.display = t === tab ? '' : 'none';
        });
        const groupBtns = document.querySelectorAll(`.tab-btn[data-group="${group}"]`);
        groupBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = btn || [...groupBtns].find(b => (b.getAttribute('onclick') || '').includes(`'${tab}'`));
        if (activeBtn) activeBtn.classList.add('active');
    };

    window.switchMode = function (mode, btn) {
        ['combos', 'links', 'reasons', 'sections'].forEach(m => {
            const el = document.getElementById(`mode-${m}`);
            if (el) el.style.display = m === mode ? '' : 'none';
        });
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    };

    function actionRow(group, id, tab, existingNotes) {
        if (tab === 'pending') {
            return `
                <div class="action-row">
                    <input class="modnotes-input" type="text" placeholder="Mod notes (optional, shown to submitter on reject)"
                           id="notes-${group}-${id}" value="${window.escapeHtml(existingNotes)}">
                    <button class="btn-approve" onclick="adminApprove('${group}', '${id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-reject" onclick="adminReject('${group}', '${id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>`;
        }
        if (tab === 'approved') {
            return `
                <div class="action-row">
                    <button class="btn-unapprove" onclick="adminUnapprove('${group}', '${id}')">
                        <i class="fas fa-undo"></i> Move back to pending
                    </button>
                </div>`;
        }
        // rejected
        return `
            <div class="action-row">
                <button class="btn-approve" onclick="adminApprove('${group}', '${id}')">
                    <i class="fas fa-check"></i> Approve anyway
                </button>
            </div>`;
    }

    // ------------------------------------------------------------------
    // Combos (unchanged behavior, now running through the shared factory)
    // ------------------------------------------------------------------
    window.openReplayInAnalyzer = async function (gcsjsonpath, btn) {
        if (!gcsjsonpath) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading…';
        try {
            const res = await fetch(GCS_BASE + gcsjsonpath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            sessionStorage.setItem('replayPreload', JSON.stringify(data));
            window.location.href = ANALYZER_URL;
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-chart-line"></i> Analyze replay';
            alert('Could not load replay: ' + e.message);
        }
    };

    window.generateComboSteps = async function (comboid, rawpath, btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…';
        try {
            const token = await window.Auth.getToken();
            if (!token) throw new Error('Not authenticated');
            const res = await fetch(`${BACKEND_URL}/generate-combo-json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ rawpath, comboid }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            btn.innerHTML = '<i class="fas fa-check"></i> Steps ready';
            btn.style.background = 'rgba(34,197,94,0.15)';
            btn.style.borderColor = 'rgba(34,197,94,0.35)';
            btn.style.color = '#4ade80';
            btn.disabled = true;
            // Keep the "Steps ready" badge on re-render
            const cached = groups.combos?.cache.approved.find(c => String(c.comboid) === String(comboid));
            if (cached) cached.gcscombojsonpath = 'set';
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cogs"></i> Generate Combo Steps';
            alert('Failed to generate combo steps: ' + e.message);
        }
    };

    function buildMetaBadges(m) {
        const items = [];
        if (m?.winner) {
            const isWin = m.winner.player === 0;
            items.push(`<span class="mbadge ${isWin ? 'mbadge-win' : 'mbadge-loss'}">
                            <i class="fas ${isWin ? 'fa-trophy' : 'fa-times-circle'}" style="font-size:0.6rem;margin-right:0.2rem;"></i>
                            ${isWin ? 'WIN' : 'LOSS'}${m.winner.turnsToWin ? ` · ${m.winner.turnsToWin}T` : ''}
                        </span>`);
            if (m.winner.isOTK) items.push(`<span class="mbadge mbadge-otk">OTK</span>`);
        }
        if (Array.isArray(m?.tags)) {
            m.tags.forEach(t => items.push(`<span class="mbadge mbadge-tag">${window.escapeHtml(t)}</span>`));
        }
        return items.join('');
    }

    function renderComboCard(combo, tab) {
        const m = combo.replays?.metadata || {};
        const playerNames = Array.isArray(m.playerNames) ? m.playerNames.join(' vs ') : '—';
        const archName = combo.archetypes?.archetypename || `Archetype #${combo.archetypeid}`;
        const metaBadges = buildMetaBadges(m);
        const existingNotes = combo.modnotes || '';

        let actions = actionRow('combos', combo.comboid, tab, existingNotes);
        if (tab === 'approved') {
            const hasSteps = !!combo.gcscombojsonpath;
            const rawpath = combo.replays?.gcsrawpath || '';
            actions = `
                <div class="action-row">
                    <button class="btn-unapprove" onclick="adminUnapprove('combos', '${combo.comboid}')">
                        <i class="fas fa-undo"></i> Move back to pending
                    </button>
                    ${!hasSteps && rawpath ? `
                    <button id="gen-btn-${combo.comboid}"
                            onclick="generateComboSteps('${combo.comboid}', '${rawpath}', this)"
                            style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);
                                   color:#f59e0b;font-size:0.8rem;font-weight:700;
                                   padding:0.4rem 0.9rem;border-radius:0.5rem;cursor:pointer;font-family:inherit;">
                        <i class="fas fa-cogs"></i> Generate Combo Steps
                    </button>` : hasSteps ? `
                    <span style="font-size:0.75rem;color:#4ade80;">
                        <i class="fas fa-check-circle"></i> Steps ready
                    </span>` : ''}
                </div>`;
        }

        const gcsjsonpath = combo.replays?.gcsjsonpath || '';
        const analyzeBtn = gcsjsonpath
            ? `<button onclick="openReplayInAnalyzer('${gcsjsonpath}', this)"
                       style="display:inline-flex;align-items:center;gap:0.4rem;
                              background:rgba(165,180,252,0.1);border:1px solid rgba(165,180,252,0.25);
                              color:#a5b4fc;font-size:0.78rem;font-weight:600;
                              padding:0.35rem 0.8rem;border-radius:0.5rem;cursor:pointer;font-family:inherit;">
                   <i class="fas fa-chart-line" style="font-size:0.65rem;"></i> Analyze replay
               </button>`
            : '';

        return `
            <div class="combo-admin-card" id="card-combos-${combo.comboid}">
                <div class="combo-admin-card-header">
                    <div class="combo-admin-meta">
                        <div class="combo-admin-title">${window.escapeHtml(combo.title)}</div>
                        ${combo.description ? `<div class="combo-admin-sub" style="margin-top:0.3rem;font-style:italic;color:#a3a3a3;">"${window.escapeHtml(combo.description)}"</div>` : ''}
                        <div class="combo-admin-sub">
                            <span>${window.escapeHtml(archName)}</span> · Submitted by <span>${window.escapeHtml(combo.profiles?.displayname || 'Unknown')}</span> · ${formatDate(combo.createdon)}
                        </div>
                        <div class="combo-admin-sub" style="margin-top:0.2rem;">
                            Players: <span>${window.escapeHtml(playerNames)}</span>
                        </div>
                        ${combo.modnotes && tab !== 'pending' ? `<div class="combo-admin-sub" style="margin-top:0.3rem;color:#f87171;">Mod notes: ${window.escapeHtml(combo.modnotes)}</div>` : ''}
                        ${metaBadges ? `<div class="meta-strip">${metaBadges}</div>` : ''}
                    </div>
                </div>
                ${analyzeBtn ? `<div>${analyzeBtn}</div>` : ''}
                ${actions}
            </div>`;
    }

    async function fetchCombos(c) {
        const { data, error } = await c
            .from('combos')
            .select(`
                comboid, title, description, status, modnotes, archetypeid, createdon, gcscombojsonpath,
                profiles!combos_userid_fkey ( displayname ),
                archetypes!combos_archetypeid_fkey ( archetypename ),
                replays!combos_replayid_fkey ( gcsjsonpath, gcsrawpath, metadata )
            `)
            .in('status', ['pending', 'approved', 'rejected'])
            .order('createdon', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    // ------------------------------------------------------------------
    // Synergy Links (archetypelinks)
    // ------------------------------------------------------------------
    function renderLinkCard(link, tab) {
        const pairLabel = `${window.escapeHtml(link.a1?.archetypename || '?')} ↔ ${window.escapeHtml(link.a2?.archetypename || '?')}`;
        const actions = actionRow('links', link.linkid, tab, link.modnotes || '');
        return `
            <div class="combo-admin-card" id="card-links-${link.linkid}">
                <div class="combo-admin-card-header">
                    <div class="combo-admin-meta">
                        <div class="combo-admin-title">${pairLabel}</div>
                        <div class="combo-admin-sub">
                            Submitted by <span>${window.escapeHtml(link.profiles?.displayname || 'Unknown')}</span> · ${formatDate(link.createdon)}
                        </div>
                        ${link.modnotes && tab !== 'pending' ? `<div class="combo-admin-sub" style="margin-top:0.3rem;color:#f87171;">Mod notes: ${window.escapeHtml(link.modnotes)}</div>` : ''}
                    </div>
                </div>
                ${actions}
            </div>`;
    }

    async function fetchLinks(c) {
        const { data, error } = await c
            .from('archetypelinks')
            .select(`
                linkid, archetypeid1, archetypeid2, status, modnotes, createdon,
                a1:archetypes!archetypelinks_archetypeid1_fkey ( archetypename ),
                a2:archetypes!archetypelinks_archetypeid2_fkey ( archetypename ),
                profiles!archetypelinks_submittedby_fkey ( displayname )
            `)
            .in('status', ['pending', 'approved', 'rejected'])
            .order('createdon', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    // ------------------------------------------------------------------
    // Synergy Reasons ("why it works" explanations, archetypelinkreasons)
    // ------------------------------------------------------------------
    function renderReasonCard(reason, tab) {
        const link = reason.archetypelinks;
        const pairLabel = link
            ? `${window.escapeHtml(link.a1?.archetypename || '?')} ↔ ${window.escapeHtml(link.a2?.archetypename || '?')}`
            : `Pairing #${reason.linkid}`;
        const actions = actionRow('reasons', reason.reasonid, tab, reason.modnotes || '');
        return `
            <div class="combo-admin-card" id="card-reasons-${reason.reasonid}">
                <div class="combo-admin-card-header">
                    <div class="combo-admin-meta">
                        <div class="combo-admin-title">${pairLabel}</div>
                        <div class="combo-admin-sub" style="margin-top:0.3rem;font-style:italic;color:#a3a3a3;">"${window.escapeHtml(reason.body)}"</div>
                        <div class="combo-admin-sub">
                            Submitted by <span>${window.escapeHtml(reason.profiles?.displayname || 'Unknown')}</span> · ${formatDate(reason.createdon)}
                        </div>
                        ${reason.modnotes && tab !== 'pending' ? `<div class="combo-admin-sub" style="margin-top:0.3rem;color:#f87171;">Mod notes: ${window.escapeHtml(reason.modnotes)}</div>` : ''}
                    </div>
                </div>
                ${actions}
            </div>`;
    }

    async function fetchReasons(c) {
        const { data, error } = await c
            .from('archetypelinkreasons')
            .select(`
                reasonid, linkid, body, status, modnotes, createdon,
                profiles!archetypelinkreasons_userid_fkey ( displayname ),
                archetypelinks!archetypelinkreasons_linkid_fkey (
                    a1:archetypes!archetypelinks_archetypeid1_fkey ( archetypename ),
                    a2:archetypes!archetypelinks_archetypeid2_fkey ( archetypename )
                )
            `)
            .in('status', ['pending', 'approved', 'rejected'])
            .order('createdon', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    // ------------------------------------------------------------------
    // Section Rewrites (pagesections — full replacements that go LIVE on
    // approval via the approve_pagesection() RPC, unlike every other group
    // here which just flips a status column).
    // ------------------------------------------------------------------
    // Renders a submission's body through the SAME functions the live page
    // uses (_pcsRenderBody/_pcsSectionStyle, from page-sections.js) instead of
    // showing raw markdown-lite source — a moderator should see what they're
    // approving, not have to mentally parse `[color=red]**bold**[/color]`.
    // Stashes any cardMap onto `s._cardMaps` as a side effect: combo-walkthrough
    // renders need window.CardLoader.loadCards(cardMap) called AFTER this HTML
    // is actually in the live DOM (it looks containers up by the ids THIS call
    // generated), so sectionsAfterRenderTab reads it back post-insert. Recomputing
    // the render there instead (simpler-looking) would generate fresh ids that
    // no longer match what's in the DOM — _pcsRenderStepsHtml's step-image ids
    // aren't deterministic between calls.
    function renderSectionBodyHtml(s, body) {
        if (typeof window._pcsRenderBody !== 'function') {
            return `<p style="white-space:pre-wrap;">${window.escapeHtml(body)}</p>`;
        }
        const style = window._pcsSectionStyle ? window._pcsSectionStyle(s.sectionkey) : {};
        const rendered = window._pcsRenderBody(body, style);
        if (rendered.cardMap && Object.keys(rendered.cardMap).length) {
            (s._cardMaps || (s._cardMaps = [])).push(rendered.cardMap);
        }
        return rendered.html;
    }

    function findArchetypePageUrl(archetypeName) {
        // archetypes comes from archetypes-data.js — a bare top-level `const`,
        // not window-scoped, but still an ordinary global visible here since
        // both scripts share the same page. Filenames aren't a fixed pattern
        // ("Deck Analysis" vs "Archetype Breakdown" vs others), so this lookup
        // is the only reliable way to get the real link — see Admin.html's
        // script-tag comment.
        if (typeof archetypes === 'undefined' || !Array.isArray(archetypes)) return null;
        const match = archetypes.find(a => a.name === archetypeName);
        return match ? `../${match.filepath}` : null;
    }

    function renderSectionCard(s, tab) {
        const archName = s.archetypes?.archetypename || `Archetype #${s.archetypeid}`;
        const actions = actionRow('sections', s.sectionid, tab, s.modnotes || '');
        // "-alt-" in the key is the "+ Add a combo" convention (see
        // _pcsSetupComboFamily/_pcsBuildNewComboForm in page-sections.js) —
        // approving one adds a new tab, it never replaces existing content,
        // so the messaging here needs to say something different from a
        // normal edit, and there's no "currently live" counterpart to compare
        // against (there's nothing at this key yet).
        const isNewCombo = s.sectionkey.includes('-alt-');
        const label = isNewCombo
            ? `New combo: "${window.escapeHtml(s.title || s.sectionkey)}"`
            : window.escapeHtml(s.sectionkey);
        const liveNote = tab === 'approved'
            ? (isNewCombo
                ? `<div class="combo-admin-sub" style="margin-top:0.3rem;color:#4ade80;">Live — showing as its own tab, existing content untouched.</div>`
                : `<div class="combo-admin-sub" style="margin-top:0.3rem;color:#4ade80;">Live — replacing the AI draft for this section.</div>`)
            : '';

        s._cardMaps = []; // reset each render pass — see renderSectionBodyHtml

        // Approved rows ARE the live version, nothing to compare against — one
        // rendered panel. Pending/rejected get "Currently live" next to
        // "Suggested change" side by side, since seeing the delta is the whole
        // point of reviewing.
        let previewHtml;
        if (tab === 'approved') {
            previewHtml = `<div class="pcs-admin-preview-single">${renderSectionBodyHtml(s, s.body)}</div>`;
        } else {
            const suggestedHtml = renderSectionBodyHtml(s, s.body);
            const liveHtml = isNewCombo
                ? `<p class="pcs-admin-empty">New combo tab — nothing live at this key yet.</p>`
                : s.liveVersion
                    ? renderSectionBodyHtml(s, s.liveVersion.body)
                    : `<p class="pcs-admin-empty">— AI-drafted, no community edit live yet —</p>`;
            previewHtml = `
                <div class="pcs-admin-compare">
                    <div>
                        <div class="pcs-admin-compare-label">Currently live</div>
                        <div class="pcs-admin-compare-body">${liveHtml}</div>
                    </div>
                    <div>
                        <div class="pcs-admin-compare-label pcs-admin-compare-label-new">Suggested change</div>
                        <div class="pcs-admin-compare-body">${suggestedHtml}</div>
                    </div>
                </div>`;
        }

        const pageUrl = findArchetypePageUrl(s.archetypes?.archetypename);
        const liveLink = pageUrl
            ? `<a class="pcs-admin-live-link" href="${pageUrl}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> View live page</a>`
            : '';

        return `
            <div class="combo-admin-card" id="card-sections-${s.sectionid}">
                <div class="combo-admin-card-header">
                    <div class="combo-admin-meta">
                        <div class="combo-admin-title">${window.escapeHtml(archName)} <span style="color:#737373;font-weight:400;">&middot; ${label}</span>${liveLink}</div>
                        ${previewHtml}
                        <div class="combo-admin-sub" style="margin-top:0.3rem;">
                            Submitted by <span>${window.escapeHtml(s.profiles?.displayname || 'Unknown')}</span> &middot; ${formatDate(s.createdon)}
                        </div>
                        ${liveNote}
                        ${s.modnotes && tab !== 'pending' ? `<div class="combo-admin-sub" style="margin-top:0.3rem;color:#f87171;">Mod notes: ${window.escapeHtml(s.modnotes)}</div>` : ''}
                    </div>
                </div>
                ${actions}
            </div>`;
    }

    // Loads real card art into whatever combo-step containers renderSectionCard
    // just inserted (must run AFTER container.innerHTML is set — see
    // createModerationTabGroup's renderTab). Reads back the cardMaps stashed
    // during that exact render pass rather than recomputing them, so the ids
    // match what's actually in the DOM.
    function sectionsAfterRenderTab(tab, rows) {
        if (typeof window._pcsLoadCardImages !== 'function') return;
        rows.forEach(r => (r._cardMaps || []).forEach(cardMap => window._pcsLoadCardImages(cardMap)));
    }

    async function fetchSections(c) {
        const { data, error } = await c
            .from('pagesections')
            .select(`
                sectionid, archetypeid, sectionkey, title, body, status, modnotes, createdon,
                profiles!pagesections_userid_fkey ( displayname ),
                archetypes!pagesections_archetypeid_fkey ( archetypename )
            `)
            .in('status', ['pending', 'approved', 'rejected'])
            .order('createdon', { ascending: false });
        if (error) throw error;
        const rows = data || [];

        // Batch-fetch the currently-live counterpart for every row that needs
        // a comparison (everything except already-approved rows — those ARE
        // live — and new-combo-tab additions, which have no counterpart by
        // definition). The unique index on (archetypeid, sectionkey, approved)
        // in scripts/sql/009_page_sections.sql guarantees at most one approved
        // row per pair, same invariant _pcsRenderHistory relies on
        // (page-sections.js). archetypeid/sectionkey are matched independently
        // here (Supabase has no simple "IN pairs" filter) and paired up
        // client-side — a small over-fetch, harmless at moderation-queue volume.
        const needsLive = rows.filter(r => r.status !== 'approved' && !r.sectionkey.includes('-alt-'));
        if (needsLive.length) {
            const archetypeIds = [...new Set(needsLive.map(r => r.archetypeid))];
            const sectionKeys = [...new Set(needsLive.map(r => r.sectionkey))];
            const { data: liveRows, error: liveError } = await c
                .from('pagesections')
                .select('archetypeid, sectionkey, body, createdon')
                .eq('status', 'approved')
                .in('archetypeid', archetypeIds)
                .in('sectionkey', sectionKeys);
            if (!liveError && liveRows) {
                const liveByKey = new Map(liveRows.map(r => [`${r.archetypeid}::${r.sectionkey}`, r]));
                needsLive.forEach(r => { r.liveVersion = liveByKey.get(`${r.archetypeid}::${r.sectionkey}`) || null; });
            }
        }
        return rows;
    }

    // ------------------------------------------------------------------
    // Bootstrap
    // ------------------------------------------------------------------
    async function init() {
        const session = await window.Auth.getSession();
        if (!session) {
            window.location.href = '../index.html';
            return;
        }

        const isMod = await window.Auth.isModerator();
        if (!isMod) {
            document.getElementById('access-denied').style.display = '';
            return;
        }

        document.getElementById('admin-content').style.display = '';
        window.CardLoader && window.CardLoader.initAmbientBackdropForCards('admin');

        groups.combos = createModerationTabGroup({
            group: 'combos', table: 'combos', pkColumn: 'comboid',
            countBadgeId: 'pending-count-combos', fetchRows: fetchCombos, renderCard: renderComboCard,
        });
        groups.links = createModerationTabGroup({
            group: 'links', table: 'archetypelinks', pkColumn: 'linkid',
            countBadgeId: 'pending-count-links', fetchRows: fetchLinks, renderCard: renderLinkCard,
        });
        groups.reasons = createModerationTabGroup({
            group: 'reasons', table: 'archetypelinkreasons', pkColumn: 'reasonid',
            countBadgeId: 'pending-count-reasons', fetchRows: fetchReasons, renderCard: renderReasonCard,
        });
        groups.sections = createModerationTabGroup({
            group: 'sections', table: 'pagesections', pkColumn: 'sectionid',
            countBadgeId: 'pending-count-sections', fetchRows: fetchSections, renderCard: renderSectionCard,
            afterRenderTab: sectionsAfterRenderTab,
            approveFn: async (id) => {
                const { error } = await client().rpc('approve_pagesection', { p_sectionid: id });
                if (error) throw error;
            },
        });

        await Promise.all([
            groups.combos.init(), groups.links.init(), groups.reasons.init(), groups.sections.init(),
        ]);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
