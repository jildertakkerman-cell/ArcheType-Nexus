/**
 * admin.js — Moderation panel: Combo guides, Synergy Links, Synergy Reasons, Section Rewrites,
 * plus a read-only Test Decks view of the decklist checker's report.json.
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
    // Each tab renders this many cards, then a "Show more" button. Approved and
    // rejected only ever grow, and section previews render card art, so
    // rendering every row up front gets slower over time.
    const PAGE_SIZE = 20;

    function createModerationTabGroup({ group, table, pkColumn, countBadgeId, fetchRows, renderCard, approveFn, afterRenderTab }) {
        const cache = { pending: [], approved: [], rejected: [] };
        const shown = { pending: PAGE_SIZE, approved: PAGE_SIZE, rejected: PAGE_SIZE };

        function renderTab(tab) {
            const container = document.getElementById(`tab-${group}-${tab}`);
            if (!container) return;
            const rows = cache[tab];
            if (!rows.length) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i>No ${tab} submissions</div>`;
                return;
            }
            const visible = rows.slice(0, shown[tab]);
            const left = rows.length - visible.length;
            container.innerHTML = visible.map(r => renderCard(r, tab)).join('') + (left
                ? `<button class="btn-more" onclick="adminShowMore('${group}', '${tab}')">
                       Show ${Math.min(left, PAGE_SIZE)} more <span>(${left} left)</span>
                   </button>`
                : '');
            // Optional per-group post-insert step — sections uses this to load
            // combo-walkthrough card art, which needs the container elements to
            // already exist in the live DOM (see sectionsAfterRenderTab).
            if (afterRenderTab) afterRenderTab(tab, visible);
        }

        function showMore(tab) {
            shown[tab] += PAGE_SIZE;
            renderTab(tab);
        }

        function updateCount() {
            const n = cache.pending.length;
            const el = document.getElementById(countBadgeId);
            if (el) el.textContent = n ? `(${n})` : '';
            setModeCount(group, n);
        }

        // Moves a row between tabs after a successful status change. The
        // moderator stays on the tab they're working through; a toast says
        // where the item went.
        function move(id, from, to, patch) {
            const idx = cache[from].findIndex(r => String(r[pkColumn]) === String(id));
            if (idx === -1) return false;
            const [row] = cache[from].splice(idx, 1);
            Object.assign(row, { status: to }, patch);
            cache[to].unshift(row);
            renderTab(from);
            renderTab(to);
            updateCount();
            return true;
        }

        async function setStatus(id, status, modnotes) {
            const update = { status };
            if (modnotes !== undefined) update.modnotes = modnotes || null;
            const { error } = await client().from(table).update(update).eq(pkColumn, id);
            if (error) throw error;
        }

        async function approve(id) {
            await withBusyCard(`card-${group}-${id}`, async () => {
                // Most groups just flip status; `sections` needs the
                // supersede-then-approve RPC so the one-live-version-per-key
                // invariant can't be violated by a plain update.
                if (approveFn) await approveFn(id); else await setStatus(id, 'approved');
                if (move(id, 'pending', 'approved') || move(id, 'rejected', 'approved')) toast('Approved — moved to the Approved tab.');
            });
        }

        async function reject(id, notes) {
            await withBusyCard(`card-${group}-${id}`, async () => {
                await setStatus(id, 'rejected', notes);
                if (move(id, 'pending', 'rejected', { modnotes: notes })) toast('Rejected — moved to the Rejected tab.');
            });
        }

        async function unapprove(id) {
            await withBusyCard(`card-${group}-${id}`, async () => {
                await setStatus(id, 'pending');
                if (move(id, 'approved', 'pending')) toast('Moved back to Pending.');
            });
        }

        async function init() {
            let rows;
            try {
                rows = await fetchRows(client());
            } catch (e) {
                const el = document.getElementById(`tab-${group}-pending`);
                if (el) el.innerHTML = `<p style="color:#f87171;">Failed to load: ${window.escapeHtml(e.message)}</p>`;
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

        return { init, approve, reject, unapprove, showMore, cache };
    }

    const groups = {}; // populated in init(), keyed by group name

    window.adminApprove = (group, id) => groups[group]?.approve(id);
    window.adminReject = (group, id) => groups[group]?.reject(id, document.getElementById(`notes-${group}-${id}`)?.value?.trim() || '');
    window.adminUnapprove = (group, id) => groups[group]?.unapprove(id);
    window.adminShowMore = (group, tab) => groups[group]?.showMore(tab);

    // ------------------------------------------------------------------
    // Feedback helpers: a card stays locked while its request runs (so a
    // double click can't send it twice), errors show inside the card instead
    // of an alert(), and successes get a short toast.
    // ------------------------------------------------------------------
    async function withBusyCard(cardId, fn) {
        const card = document.getElementById(cardId);
        if (card) {
            if (card.classList.contains('is-busy')) return;
            card.classList.add('is-busy');
            card.querySelectorAll('button, input').forEach(el => { el.disabled = true; });
            card.querySelector('.card-error')?.remove();
        }
        try {
            await fn();
        } catch (e) {
            showCardError(card, e.message || String(e));
        } finally {
            // A successful move re-renders the tab, so this card is usually gone already.
            if (card && card.isConnected) {
                card.classList.remove('is-busy');
                card.querySelectorAll('button, input').forEach(el => { el.disabled = false; });
            }
        }
    }

    function showCardError(card, message) {
        if (!card) { toast(message, true); return; }
        card.querySelector('.card-error')?.remove();
        card.insertAdjacentHTML('beforeend',
            `<div class="card-error"><i class="fas fa-exclamation-triangle"></i> ${window.escapeHtml(message)}</div>`);
    }

    let toastTimer = null;
    function toast(message, isError) {
        let el = document.getElementById('admin-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'admin-toast';
            el.setAttribute('role', 'status');
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.classList.toggle('is-error', !!isError);
        el.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
    }

    // Sidebar badge: pending count per moderation group, or the number of
    // test decks needing attention ("!" when the report is out of date).
    function setModeCount(mode, value, title) {
        const el = document.getElementById(`mode-count-${mode}`);
        if (!el) return;
        el.textContent = value ? String(value) : '';
        el.hidden = !value;
        if (title) el.title = title; else el.removeAttribute('title');
    }

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

    const MODES = ['combos', 'links', 'reasons', 'sections', 'decks', 'audit'];

    // The open mode lives in the URL hash (Admin.html#decks), so a reload or a
    // shared link lands on the same section.
    window.switchMode = function (mode, btn) {
        if (!MODES.includes(mode)) return;
        MODES.forEach(m => {
            const el = document.getElementById(`mode-${m}`);
            if (el) el.style.display = m === mode ? '' : 'none';
        });
        const active = btn || document.querySelector(`.mode-btn[data-mode="${mode}"]`);
        document.querySelectorAll('.mode-btn').forEach(b => {
            b.classList.toggle('active', b === active);
            b.setAttribute('aria-pressed', String(b === active));
        });
        if (location.hash.slice(1) !== mode) history.replaceState(null, '', `#${mode}`);

        const bar = document.getElementById('admin-mode-bar');
        if (mode === 'audit') {
            if (bar && !bar.classList.contains('is-collapsed')) {
                bar.classList.add('is-collapsed');
            }
            if (!auditReport.requested) loadAuditReport();
            setTimeout(() => {
                auditReport.simulatorInstance?.repositionCards();
                window.dispatchEvent(new Event('resize'));
            }, 80);
            setTimeout(() => {
                auditReport.simulatorInstance?.repositionCards();
            }, 240);
        } else {
            try {
                if (localStorage.getItem('archetype_admin_sidebar_collapsed') !== '1') {
                    bar?.classList.remove('is-collapsed');
                }
            } catch {}
            if (mode === 'decks' && !deckReport.requested) loadDeckReport();
        }
    };

    window.addEventListener('hashchange', () => window.switchMode(location.hash.slice(1)));

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
            showCardError(btn.closest('.combo-admin-card'), 'Could not load replay: ' + e.message);
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
            showCardError(btn.closest('.combo-admin-card'), 'Failed to generate combo steps: ' + e.message);
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
                            data-comboid="${window.escapeHtml(String(combo.comboid))}" data-rawpath="${window.escapeHtml(rawpath)}"
                            onclick="generateComboSteps(this.dataset.comboid, this.dataset.rawpath, this)"
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
            ? `<button data-path="${window.escapeHtml(gcsjsonpath)}" onclick="openReplayInAnalyzer(this.dataset.path, this)"
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
    // Test Decks: a read-only view of assets/data/decklists/report.json,
    // which scripts/check-decklists.js writes (the weekly workflow runs it
    // after each banlist update). No Supabase involved; loaded the first
    // time the mode is opened.
    // ------------------------------------------------------------------
    const DECK_REPORT_URL = '../assets/data/decklists/report.json';
    const DECK_INDEX_URL = '../assets/data/decklists/index.json';
    const DECK_STATES = {
        fix:    { label: 'Needs fixing', badge: 'mbadge-loss',   order: 0 },
        review: { label: 'Needs review', badge: 'mbadge-review', order: 1 },
        ok:     { label: 'OK',           badge: 'mbadge-win',    order: 2 },
    };
    const deckReport = { requested: false, data: null, missing: [], updated: null, filter: 'all', query: '' };

    const deckState = d => ((d.errors || []).length ? 'fix' : (d.review || []).length ? 'review' : 'ok');

    async function loadDeckReport() {
        deckReport.requested = true;
        const body = document.getElementById('decks-body');
        body.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i>Loading report…</div>';
        try {
            const [res, indexRes] = await Promise.all([
                fetch(DECK_REPORT_URL, { cache: 'no-cache' }),
                fetch(DECK_INDEX_URL, { cache: 'no-cache' }),
            ]);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            deckReport.data = await res.json();
            deckReport.updated = res.headers.get('last-modified');
            // Lists in index.json that the report doesn't cover yet: the report
            // is older than those files, so the checker needs another run.
            if (indexRes.ok) {
                const index = await indexRes.json();
                const inReport = new Set(Object.values(deckReport.data.decks || {}).map(d => d.file));
                deckReport.missing = [...new Set(Object.values(index))].filter(f => !inReport.has(f)).sort();
            }
            renderDeckReport();
            const attention = Object.values(deckReport.data.decks || {}).filter(d => deckState(d) !== 'ok').length
                + (deckReport.data.packages || []).length;
            if (attention) setModeCount('decks', attention, `${attention} finding${attention === 1 ? '' : 's'} to look at`);
            else if (deckReport.missing.length) setModeCount('decks', '!', 'The report is older than some test decks');
            else setModeCount('decks', 0);
        } catch (error) {
            deckReport.requested = false;
            body.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i>Couldn't load report.json (${window.escapeHtml(error.message)}).</div>`;
        }
    }

    // Re-reads report.json, e.g. after running the checker locally.
    window.reloadDeckReport = () => loadDeckReport();

    window.filterDeckReport = function (filter, btn) {
        deckReport.filter = filter;
        document.querySelectorAll('.tab-btn[data-group="decks"]').forEach(b => b.classList.toggle('active', b === btn));
        renderDeckList();
    };

    window.searchDeckReport = function (value) {
        deckReport.query = value.trim().toLowerCase();
        renderDeckList();
    };

    function renderDeckReport() {
        const { data, missing, updated } = deckReport;
        const decks = Object.entries(data.decks || {});
        const counts = { all: decks.length, fix: 0, review: 0, ok: 0 };
        decks.forEach(([, d]) => { counts[deckState(d)]++; });
        const drafts = decks.filter(([, d]) => d.status === 'draft').length;

        const chip = (key, label) => `
            <button class="tab-btn${deckReport.filter === key ? ' active' : ''}" data-group="decks" onclick="filterDeckReport('${key}', this)">
                ${label}<span style="margin-left:0.35rem;opacity:0.6;">${counts[key]}</span>
            </button>`;

        const meta = [
            `Banlist of <span>${window.escapeHtml(data.banlist || 'unknown date')}</span>`,
            `<span>${decks.length}</span> lists, ${drafts} still draft`,
            updated ? `report file updated <span>${formatDate(updated)}</span>` : '',
        ].filter(Boolean).join(' · ')
            + ` <button class="deckrep-reload" onclick="reloadDeckReport()" title="Read report.json again"><i class="fas fa-sync-alt"></i> Reload</button>`;

        const missingNote = missing.length ? `
            <div class="deckrep-notice deckrep-notice-warn">
                <i class="fas fa-history"></i>
                <div><strong>${missing.length} test deck${missing.length === 1 ? ' isn\'t' : 's aren\'t'} in this report yet</strong>, so the report is older than they are.
                Run <code>node scripts/check-decklists.js --report assets/data/decklists/report.json</code>, or start the weekly workflow from the Actions tab.
                <details class="deckrep-missing"><summary>Show the files</summary>${missing.map(f => window.escapeHtml(f)).join(', ')}</details></div>
            </div>` : '';

        const packages = data.packages || [];
        const packageNote = packages.length ? `
            <div class="deckrep-notice deckrep-notice-error">
                <i class="fas fa-box-open"></i>
                <div><strong>packages.json</strong> (generic staples shared by every list)
                <ul class="deckrep-msgs">${packages.map(m => `<li class="deckrep-msg-error">${window.escapeHtml(m)}</li>`).join('')}</ul></div>
            </div>` : '';

        // What the weekly scripts/build-extra-packages.js run moved in or out of
        // the "auto" Extra Deck packages.
        const generated = data.generated || {};
        const changed = Object.entries(generated.changes || {});
        const generatedNote = changed.length ? `
            <div class="deckrep-notice">
                <i class="fas fa-layer-group"></i>
                <div><strong>Extra Deck packages changed</strong> in the run of ${window.escapeHtml(formatDate(generated.updated) || 'the last update')} (packages.generated.json, ordered by views this week)
                <details class="deckrep-missing"><summary>Show the ${changed.length} package${changed.length === 1 ? '' : 's'}</summary>
                <ul class="deckrep-msgs">${changed.map(([label, c]) => `<li><strong>${window.escapeHtml(label)}</strong>: ${[
                    ...(c.added || []).map(n => `+ ${window.escapeHtml(n)}`),
                    ...(c.removed || []).map(n => `− ${window.escapeHtml(n)}`)
                ].join(', ')}</li>`).join('')}</ul></details>
                Pin or exclude cards in the <code>generated</code> section of packages.json.</div>
            </div>` : '';

        document.getElementById('decks-body').innerHTML = `
            <div class="combo-admin-sub" style="margin-bottom:1rem;">${meta}</div>
            ${missingNote}${packageNote}${generatedNote}
            <div class="deckrep-toolbar">
                ${chip('all', 'All')}${chip('fix', 'Needs fixing')}${chip('review', 'Needs review')}${chip('ok', 'OK')}
                <input type="search" class="modnotes-input deckrep-search" placeholder="Search archetype or message…"
                       value="${window.escapeHtml(deckReport.query)}" oninput="searchDeckReport(this.value)">
            </div>
            <div id="decks-list"></div>`;
        renderDeckList();
    }

    function renderDeckList() {
        const list = document.getElementById('decks-list');
        if (!list) return;
        const { filter, query } = deckReport;
        const rows = Object.entries(deckReport.data.decks || {})
            .map(([name, d]) => ({ name, d, state: deckState(d) }))
            .filter(r => filter === 'all' || r.state === filter)
            .filter(r => !query || [r.name, r.d.file, ...(r.d.errors || []), ...(r.d.review || []), ...(r.d.warnings || [])]
                .some(s => String(s).toLowerCase().includes(query)))
            .sort((a, b) => DECK_STATES[a.state].order - DECK_STATES[b.state].order || a.name.localeCompare(b.name));

        if (!rows.length) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-check-double"></i>${query ? 'No list matches that search.' : 'Nothing here.'}</div>`;
            return;
        }
        list.innerHTML = rows.map(renderDeckCard).join('');
    }

    function renderDeckCard({ name, d, state }) {
        const page = findArchetypePageUrl(name);
        const link = page
            ? `<a class="pcs-admin-live-link" href="${window.escapeHtml(page)}#test-deck" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i>Open test deck</a>`
            : '';
        const msgs = [
            ...(d.errors || []).map(m => ['error', 'fa-times-circle', m]),
            ...(d.review || []).map(m => ['review', 'fa-exclamation-circle', m]),
            ...(d.warnings || []).map(m => ['warn', 'fa-info-circle', m]),
        ];
        const s = DECK_STATES[state];
        return `
            <div class="combo-admin-card deckrep-card">
                <div class="combo-admin-card-header">
                    <div class="combo-admin-meta">
                        <div class="combo-admin-title">${window.escapeHtml(name)}${link}</div>
                        <div class="combo-admin-sub">
                            <span>${window.escapeHtml(d.file)}</span> · ${d.status === 'reviewed' ? 'Reviewed' : 'Draft'}, review date <span>${window.escapeHtml(d.reviewed || '—')}</span>
                            · Main <span>${d.main ?? '?'}</span> + Extra <span>${d.extra ?? '?'}</span>
                        </div>
                    </div>
                    <span class="mbadge ${s.badge}">${s.label}</span>
                </div>
                ${msgs.length ? `<ul class="deckrep-msgs">${msgs.map(([level, icon, m]) =>
                    `<li class="deckrep-msg-${level}"><i class="fas ${icon}"></i>${window.escapeHtml(m)}</li>`).join('')}</ul>` : ''}
            </div>`;
    }

    // ------------------------------------------------------------------
    // Combo Audit: OCGCore Wasm Legality Verifier & DuelSimulator Inspector
    // Loads assets/data/combos/engine-audit-report.json and provides an
    // interactive board visualizer, failing step breakdown, engine diagnostics,
    // and triage tagging persisted in localStorage.
    // ------------------------------------------------------------------
    const AUDIT_REPORT_URL = '../assets/data/combos/engine-audit-report.json';
    const AUDIT_TRIAGE_STORAGE_KEY = 'archetype_nexus_combo_audit_triage';

    const auditReport = {
        requested: false,
        data: null,
        triage: {}, // itemId -> { status, notes, updatedAt }
        filterTriage: 'all', // 'all', 'untriaged', 'illegal', 'fp', 'resolved'
        filterSource: 'all', // 'all', 'curated', 'html'
        filterVerdict: 'all', // 'all', 'LIKELY_ILLEGAL', 'NEEDS_REVIEW', 'UNVERIFIABLE' (engine verdicts on HTML items)
        query: '',
        shownCount: 30,
        activeItemId: null,
        activeSimStep: 1,
        logMode: 'follow', // 'follow' or 'all'
        simulatorInstance: null,
        counts: { all: 0, untriaged: 0, illegal: 0, fp: 0, resolved: 0, curated: 0, html: 0, verdicts: {} },
    };

    function loadSavedTriage() {
        try {
            const raw = localStorage.getItem(AUDIT_TRIAGE_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    function saveTriageRecord(itemId, status, notes = '') {
        if (!auditReport.triage) auditReport.triage = {};
        if (status === 'untriaged' && !notes) {
            delete auditReport.triage[itemId];
        } else {
            auditReport.triage[itemId] = {
                status: status || 'untriaged',
                notes,
                updatedAt: new Date().toISOString()
            };
        }
        try {
            localStorage.setItem(AUDIT_TRIAGE_STORAGE_KEY, JSON.stringify(auditReport.triage));
        } catch (e) {
            console.error('Failed to save audit triage to localStorage', e);
        }
        updateAuditCounters();
        renderAuditList();
        renderAuditInspector();
    }

    function updateAuditCounters() {
        if (!auditReport.data) return;
        const items = auditReport.data.items || [];
        const triage = auditReport.triage || {};
        const counts = {
            all: items.length,
            untriaged: 0,
            illegal: 0,
            fp: 0,
            resolved: 0,
            curated: 0,
            html: 0,
            verdicts: {}
        };
        items.forEach(it => {
            const tr = triage[it.id]?.status;
            if (tr === 'illegal') counts.illegal++;
            else if (tr === 'false_positive') counts.fp++;
            else if (tr === 'resolved') counts.resolved++;
            else counts.untriaged++;

            if (it.source === 'curated') counts.curated++;
            else if (it.source === 'html') counts.html++;

            if (it.verdict) counts.verdicts[it.verdict] = (counts.verdicts[it.verdict] || 0) + 1;
        });
        auditReport.counts = counts;

        // Update sidebar badge
        setModeCount('audit', counts.untriaged || counts.all, `${counts.all} flagged combos (${counts.untriaged} untriaged)`);
    }

    async function loadAuditReport() {
        auditReport.requested = true;
        const body = document.getElementById('audit-body');
        if (body && !auditReport.data) {
            body.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i>Loading engine audit report...</div>';
        }
        try {
            auditReport.triage = loadSavedTriage();
            const res = await fetch(AUDIT_REPORT_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            auditReport.data = await res.json();
            updateAuditCounters();
            renderAuditShell();
            setupAuditKeyboardShortcuts();
        } catch (error) {
            console.error('Failed to load audit report', error);
            if (body) {
                body.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i>Couldn't load engine-audit-report.json (${window.escapeHtml(error.message)}). Run <code>node scripts/build-engine-audit-report.mjs</code> to regenerate it.</div>`;
            }
        }
    }

    function getFilteredAuditItems() {
        if (!auditReport.data || !auditReport.data.items) return [];
        const items = auditReport.data.items;
        const triage = auditReport.triage || {};
        const q = auditReport.query.toLowerCase();
        const fTriage = auditReport.filterTriage;
        const fSource = auditReport.filterSource;
        const fVerdict = auditReport.filterVerdict;

        return items.filter(it => {
            // Source filter
            if (fSource !== 'all' && it.source !== fSource) return false;

            // Engine verdict filter (applies to HTML items; curated JSON items have no verdict)
            if (fVerdict !== 'all' && (fSource === 'curated' ? false : it.verdict !== fVerdict)) return false;

            // Triage status filter
            const st = triage[it.id]?.status || 'untriaged';
            if (fTriage === 'untriaged' && st !== 'untriaged') return false;
            if (fTriage === 'illegal' && st !== 'illegal') return false;
            if (fTriage === 'fp' && st !== 'false_positive') return false;
            if (fTriage === 'resolved' && st !== 'resolved') return false;

            // Text search
            if (q) {
                const matchArch = (it.archetype || '').toLowerCase().includes(q);
                const matchTitle = (it.comboTitle || '').toLowerCase().includes(q);
                const matchErr = (it.engineError || '').toLowerCase().includes(q);
                const matchText = (it.writtenText || '').toLowerCase().includes(q);
                if (!matchArch && !matchTitle && !matchErr && !matchText) return false;
            }

            return true;
        });
    }

    function getActiveAuditItem() {
        if (!auditReport.data || !auditReport.data.items) return null;
        if (!auditReport.activeItemId) return null;
        return auditReport.data.items.find(it => it.id === auditReport.activeItemId) || null;
    }

    // Engine verdict for HTML walkthrough items (curated JSON items have none and keep the old wording)
    const AUDIT_VERDICTS = {
        LIKELY_ILLEGAL: { pill: 'Likely illegal', header: 'Likely Illegal Play', color: '#fca5a5', bg: 'rgba(239,68,68,0.18)', hint: 'The card was in place and the engine refused the action' },
        NEEDS_REVIEW: { pill: 'Needs review', header: 'Needs Review', color: '#fcd34d', bg: 'rgba(245,158,11,0.18)', hint: 'A card the step uses never reached the hand or field: a skipped step, or the harness picked differently' },
        UNVERIFIABLE: { pill: 'Not verifiable', header: 'Could Not Verify', color: '#a3a3a3', bg: 'rgba(163,163,163,0.16)', hint: 'Stopped after a step the engine could not simulate from the prose' }
    };

    function auditVerdictPill(item) {
        const v = AUDIT_VERDICTS[item.verdict];
        if (!v) return '';
        return `<span class="tag-pill" style="background:${v.bg}; color:${v.color};">${v.pill}</span>`;
    }

    function getOfferedCount(offered) {
        if (!offered) return 0;
        return (offered.summons?.length || 0) +
               (offered.specialSummons?.length || 0) +
               (offered.activates?.length || 0) +
               (offered.chains?.length || 0) +
               (offered.triggers?.length || 0) +
               (offered.spellSets?.length || 0) +
               (offered.monsterSets?.length || 0) +
               (offered.repos?.length || 0);
    }

    function renderOfferedActionChips(offered) {
        if (!offered) return [];
        const chips = [];

        const formatCard = (item) => {
            if (!item) return 'Card';
            if (typeof item === 'string') return item;
            const name = item.name || (item.code ? `Card ${item.code}` : 'Card');
            const codeStr = item.code ? ` (${item.code})` : '';
            return `${name}${codeStr}`;
        };

        (offered.summons || []).forEach(s => {
            chips.push(`<span class="audit-offered-chip" style="border-color:rgba(245,158,11,0.4);"><i class="fas fa-sun" style="color:#fbbf24;"></i> Normal: ${window.escapeHtml(formatCard(s))}</span>`);
        });
        (offered.specialSummons || []).forEach(s => {
            chips.push(`<span class="audit-offered-chip" style="border-color:rgba(168,85,247,0.4);"><i class="fas fa-meteor" style="color:#c084fc;"></i> Special: ${window.escapeHtml(formatCard(s))}</span>`);
        });
        (offered.activates || []).forEach(a => {
            const name = typeof a === 'string' ? a : (a.name || (a.code ? `Card ${a.code}` : 'Effect'));
            const desc = (typeof a === 'object' && a?.desc) ? `: ${a.desc}` : '';
            const codeStr = (typeof a === 'object' && a?.code) ? ` (${a.code})` : '';
            chips.push(`<span class="audit-offered-chip" style="border-color:rgba(59,130,246,0.4);" title="${window.escapeHtml(name + desc)}"><i class="fas fa-bolt" style="color:#60a5fa;"></i> ${window.escapeHtml(name + codeStr + desc)}</span>`);
        });
        (offered.triggers || []).forEach(t => {
            const name = typeof t === 'string' ? t : (t.name || (t.code ? `Card ${t.code}` : 'Trigger'));
            const desc = (typeof t === 'object' && t?.desc) ? `: ${t.desc}` : '';
            chips.push(`<span class="audit-offered-chip" style="border-color:rgba(236,72,153,0.4);" title="${window.escapeHtml(name + desc)}"><i class="fas fa-exclamation" style="color:#f472b6;"></i> Trigger: ${window.escapeHtml(name + desc)}</span>`);
        });
        (offered.chains || []).forEach(c => {
            const name = typeof c === 'string' ? c : (c.name || (c.code ? `Card ${c.code}` : 'Chain'));
            const desc = (typeof c === 'object' && c?.desc) ? `: ${c.desc}` : '';
            chips.push(`<span class="audit-offered-chip" style="border-color:rgba(59,130,246,0.4);" title="${window.escapeHtml(name + desc)}"><i class="fas fa-link" style="color:#60a5fa;"></i> Chain: ${window.escapeHtml(name + desc)}</span>`);
        });
        (offered.spellSets || []).forEach(s => {
            chips.push(`<span class="audit-offered-chip" style="border-color:rgba(34,197,94,0.4);"><i class="fas fa-scroll" style="color:#4ade80;"></i> Set: ${window.escapeHtml(formatCard(s))}</span>`);
        });
        (offered.monsterSets || []).forEach(m => {
            chips.push(`<span class="audit-offered-chip"><i class="fas fa-shield-alt"></i> Set: ${window.escapeHtml(formatCard(m))}</span>`);
        });
        (offered.repos || []).forEach(r => {
            chips.push(`<span class="audit-offered-chip"><i class="fas fa-sync-alt"></i> Change Pos: ${window.escapeHtml(formatCard(r))}</span>`);
        });

        return chips;
    }

    function parseEngineLogByStep(logArray, totalSteps, failedStepNum, engineError) {
        const stepMap = {};
        for (let s = 1; s <= totalSteps; s++) {
            stepMap[s] = [];
        }

        let currentStep = 1;
        (logArray || []).forEach(entry => {
            const match = entry.match(/^Step\s+(\d+):/i);
            if (match) {
                currentStep = parseInt(match[1], 10);
            }
            if (!stepMap[currentStep]) stepMap[currentStep] = [];

            let type = 'general';
            if (/Legal/i.test(entry)) type = 'action';
            else if (/Trigger|Chain/i.test(entry)) type = 'trigger';
            else if (/Selected/i.test(entry)) type = 'select';

            stepMap[currentStep].push({
                stepNum: currentStep,
                raw: entry,
                type
            });
        });

        // Add engine rejection entry to failed step if applicable
        if (failedStepNum && engineError && stepMap[failedStepNum]) {
            const hasRej = stepMap[failedStepNum].some(e => e.type === 'rejection');
            if (!hasRej) {
                stepMap[failedStepNum].push({
                    stepNum: failedStepNum,
                    raw: `Engine Rejection: ${engineError}`,
                    type: 'rejection'
                });
            }
        }

        return stepMap;
    }

    function getArchetypePageLink(item) {
        if (!item) return null;
        let url = findArchetypePageUrl(item.archetype);
        if (!url && typeof archetypes !== 'undefined' && Array.isArray(archetypes)) {
            const slug = (item.archetypeSlug || item.archetype || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const match = archetypes.find(a => (a.name || '').toLowerCase().replace(/[^a-z0-9]/g, '') === slug);
            if (match) url = `../${match.filepath}`;
        }
        return url;
    }

    function renderAuditShell() {
        const body = document.getElementById('audit-body');
        if (!body) return;
        const counts = auditReport.counts || { all: 0, untriaged: 0, illegal: 0, fp: 0, resolved: 0, curated: 0, html: 0 };

        body.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1rem;">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:0.75rem;">
                    <div class="tab-bar" style="margin-bottom:0; flex-wrap:wrap;">
                        <button class="tab-btn${auditReport.filterTriage === 'all' ? ' active' : ''}" onclick="filterAuditTriage('all', this)">
                            All Flagged <span style="margin-left:0.35rem;opacity:0.6;">${counts.all}</span>
                        </button>
                        <button class="tab-btn${auditReport.filterTriage === 'untriaged' ? ' active' : ''}" onclick="filterAuditTriage('untriaged', this)">
                            Untriaged <span style="margin-left:0.35rem;opacity:0.6;">${counts.untriaged}</span>
                        </button>
                        <button class="tab-btn${auditReport.filterTriage === 'illegal' ? ' active' : ''}" onclick="filterAuditTriage('illegal', this)">
                            <i class="fas fa-ban" style="color:#f87171;margin-right:0.25rem;"></i> Truly Illegal <span style="margin-left:0.35rem;opacity:0.6;">${counts.illegal}</span>
                        </button>
                        <button class="tab-btn${auditReport.filterTriage === 'fp' ? ' active' : ''}" onclick="filterAuditTriage('fp', this)">
                            <i class="fas fa-bug" style="color:#fbbf24;margin-right:0.25rem;"></i> False Positives <span style="margin-left:0.35rem;opacity:0.6;">${counts.fp}</span>
                        </button>
                        <button class="tab-btn${auditReport.filterTriage === 'resolved' ? ' active' : ''}" onclick="filterAuditTriage('resolved', this)">
                            <i class="fas fa-check-circle" style="color:#4ade80;margin-right:0.25rem;"></i> Resolved <span style="margin-left:0.35rem;opacity:0.6;">${counts.resolved}</span>
                        </button>
                    </div>

                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <button class="tab-btn" onclick="toggleAuditQueue()" id="btn-toggle-audit-queue" title="Collapse or expand the combo list to maximize combo display">
                            <i class="fas fa-expand-arrows-alt"></i> Maximize Display
                        </button>
                        <button class="tab-btn" onclick="exportAuditTriage()" title="Export triaged items and notes to JSON">
                            <i class="fas fa-file-export"></i> Export Triage JSON
                        </button>
                        <button class="tab-btn" onclick="document.getElementById('audit-triage-file-input').click()" title="Import saved triage JSON file">
                            <i class="fas fa-file-import"></i> Import Triage JSON
                        </button>
                        <input type="file" id="audit-triage-file-input" style="display:none;" accept=".json" onchange="importAuditTriage(event)">
                    </div>
                </div>

                <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center; justify-content:space-between;">
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        <span style="font-size:0.78rem; color:#a3a3a3; font-weight:600; text-transform:uppercase;">Source:</span>
                        <button class="tab-btn${auditReport.filterSource === 'all' ? ' active' : ''}" style="padding:0.3rem 0.7rem; font-size:0.78rem;" onclick="filterAuditSource('all', this)">All</button>
                        <button class="tab-btn${auditReport.filterSource === 'curated' ? ' active' : ''}" style="padding:0.3rem 0.7rem; font-size:0.78rem;" onclick="filterAuditSource('curated', this)">Curated JSON (${counts.curated})</button>
                        <button class="tab-btn${auditReport.filterSource === 'html' ? ' active' : ''}" style="padding:0.3rem 0.7rem; font-size:0.78rem;" onclick="filterAuditSource('html', this)">HTML Guides (${counts.html})</button>
                    </div>

                    ${Object.keys(counts.verdicts || {}).length > 0 ? `
                    <div id="audit-verdict-filter-group" style="display:${auditReport.filterSource === 'curated' ? 'none' : 'flex'}; gap:0.4rem; align-items:center; flex-wrap:wrap;">
                        <span style="font-size:0.78rem; color:#a3a3a3; font-weight:600; text-transform:uppercase;">Verdict:</span>
                        <button class="tab-btn${auditReport.filterVerdict === 'all' ? ' active' : ''}" style="padding:0.3rem 0.7rem; font-size:0.78rem;" onclick="filterAuditVerdict('all', this)">All</button>
                        ${Object.entries(AUDIT_VERDICTS).filter(([key]) => counts.verdicts[key]).map(([key, v]) => `
                        <button class="tab-btn${auditReport.filterVerdict === key ? ' active' : ''}" style="padding:0.3rem 0.7rem; font-size:0.78rem;" onclick="filterAuditVerdict('${key}', this)" title="${window.escapeHtml(v.hint)}">
                            <span style="color:${v.color};">${v.pill}</span> (${counts.verdicts[key]})
                        </button>`).join('')}
                    </div>` : ''}

                    <div style="flex:1; max-width:320px; position:relative;">
                        <input type="search" class="modnotes-input" style="width:100%; padding-left:2rem;" placeholder="Search archetype, combo, error..." value="${window.escapeHtml(auditReport.query)}" oninput="searchAuditReport(this.value)">
                        <i class="fas fa-search" style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:#737373; font-size:0.8rem; pointer-events:none;"></i>
                    </div>
                </div>
            </div>

            <div class="audit-layout">
                <div class="audit-sidebar-col" id="audit-list"></div>
                <div class="audit-board-col" id="audit-board-pane"></div>
                <div class="audit-details-col" id="audit-details-pane"></div>
            </div>
        `;

        renderAuditList();
        renderAuditInspector();
    }

    function renderAuditList() {
        const container = document.getElementById('audit-list');
        if (!container) return;

        const filtered = getFilteredAuditItems();
        if (!filtered.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i>No matching combos</div>';
            return;
        }

        if (!auditReport.activeItemId || !filtered.some(it => it.id === auditReport.activeItemId)) {
            auditReport.activeItemId = filtered[0].id;
        }

        const visible = filtered.slice(0, auditReport.shownCount || 30);
        const left = filtered.length - visible.length;

        container.innerHTML = visible.map(it => {
            const isActive = it.id === auditReport.activeItemId;
            const tr = auditReport.triage[it.id]?.status || 'untriaged';
            let trLabel = 'Untriaged';
            let trClass = 'tag-pill-untriaged';
            if (tr === 'illegal') { trLabel = 'Truly Illegal'; trClass = 'tag-pill-illegal'; }
            else if (tr === 'false_positive') { trLabel = 'False Positive'; trClass = 'tag-pill-fp'; }
            else if (tr === 'resolved') { trLabel = 'Resolved'; trClass = 'tag-pill-resolved'; }

            const srcClass = it.source === 'curated' ? 'tag-pill-curated' : 'tag-pill-html';
            const errPreview = it.engineError || it.writtenText || 'Engine rejection';

            return `
                <div class="audit-card${isActive ? ' is-active' : ''}" onclick="selectAuditCombo('${it.id}')" id="audit-card-${it.id}">
                    <div class="audit-card-title">
                        <span>${window.escapeHtml(it.archetype || 'Archetype')}</span>
                        <span class="tag-pill ${srcClass}">${window.escapeHtml(it.sourceLabel || it.source)}</span>
                    </div>
                    <div class="audit-card-sub">${window.escapeHtml(it.comboTitle)} · Step ${it.failedStepNumber ?? '?'}/${it.totalSteps}</div>
                    <div class="audit-card-err" title="${window.escapeHtml(errPreview)}">
                        <i class="fas fa-times-circle"></i> ${window.escapeHtml(errPreview)}
                    </div>
                    <div class="audit-badges">
                        ${auditVerdictPill(it)}
                        <span class="tag-pill ${trClass}">${trLabel}</span>
                        ${it.offeredActions ? `<span style="font-size:0.68rem;color:#a3a3a3;"><i class="fas fa-list-ul"></i> ${getOfferedCount(it.offeredActions)} actions</span>` : ''}
                    </div>
                </div>
            `;
        }).join('') + (left > 0 ? `
            <button class="btn-more" onclick="showMoreAudit()">
                Show ${Math.min(left, 30)} more <span>(${left} left)</span>
            </button>
        ` : '');
    }

    function renderAuditInspector() {
        const boardPane = document.getElementById('audit-board-pane');
        const detailsPane = document.getElementById('audit-details-pane');
        if (!boardPane || !detailsPane) return;

        const item = getActiveAuditItem();
        if (!item) {
            boardPane.innerHTML = '<div class="empty-state"><i class="fas fa-microscope"></i>Select a combo to inspect board</div>';
            detailsPane.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i>Select a combo to view diagnostics</div>';
            return;
        }

        const triageRecord = auditReport.triage[item.id] || {};
        const trStatus = triageRecord.status;
        const pageLink = getArchetypePageLink(item);

        const offeredCount = getOfferedCount(item.offeredActions);
        const initialStep = item.failedStepNumber || 1;
        auditReport.activeSimStep = initialStep;

        // Steps list
        const steps = item.comboData?.steps || [];
        const stepsHtml = steps.map((s, idx) => {
            const stepNum = idx + 1;
            const isFail = stepNum === item.failedStepNumber;
            const isInitialActive = stepNum === initialStep;
            const stepText = s.text || s.title || (s.actions ? s.actions.map(a => `${a.card} -> ${a.to}`).join(', ') : `Step ${stepNum}`);
            return `
                <div class="audit-step-item${isFail ? ' is-failed-step' : ''}${isInitialActive ? ' is-active-step' : ''}" id="audit-step-item-${stepNum}" onclick="jumpAuditSimulatorToStep(${stepNum - 1})" title="Click to view board and logs at Step ${stepNum}">
                    <div class="audit-step-item-header">
                        <span class="audit-step-badge${isFail ? ' is-fail' : ''}">${isFail ? '<i class="fas fa-exclamation-triangle"></i> ' : ''}Step ${stepNum}</span>
                        <span style="font-weight:600; color:${isFail ? '#fca5a5' : '#e5e5e5'}; flex:1;">${window.escapeHtml(stepText)}</span>
                    </div>
                    ${isFail ? `<div class="audit-step-err-detail"><i class="fas fa-microchip"></i> Engine rejection: ${window.escapeHtml(item.engineError || 'Action rejected')}</div>` : ''}
                </div>
            `;
        }).join('');

        // Pane 2: Failure Breakdown Box + Duel Simulator
        boardPane.innerHTML = `
            <div class="audit-fail-box">
                <div class="audit-fail-header">
                    <span><i class="fas fa-exclamation-triangle"></i> ${AUDIT_VERDICTS[item.verdict]?.header || 'Identified Illegal Play'} at Step ${item.failedStepNumber ?? '?'} of ${item.totalSteps}</span>
                    <button class="audit-jump-btn" onclick="jumpAuditSimulatorToFail()" title="Jump board state right before failure (Hotkey: J)">
                        <i class="fas fa-crosshairs"></i> Jump to Failure <span class="kbd-hint">J</span>
                    </button>
                </div>
                <div class="audit-fail-steptext">
                    "${window.escapeHtml(item.writtenText || item.comboTitle)}"
                </div>
                <div class="audit-fail-err">
                    <strong>Rejection Cause:</strong> ${window.escapeHtml(item.engineError || 'Step action not permitted under OCGCore game state.')}
                </div>
                ${item.fieldSnapshot ? `
                <div class="audit-fail-snapshot" style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.6rem; font-size:0.75rem;">
                    <span style="background:rgba(239,68,68,0.18); border:1px solid rgba(239,68,68,0.35); padding:0.2rem 0.55rem; border-radius:5px; color:#fca5a5; font-weight:600;">
                        <i class="fas fa-dragon" style="margin-right:0.25rem;"></i>Field Monsters: ${(item.fieldSnapshot.monsters || []).length}
                        ${(item.fieldSnapshot.monsters || []).length > 0 ? `(${(item.fieldSnapshot.monsters || []).map(m => m.zone.replace('zone-', '').toUpperCase()).join(', ')})` : ''}
                    </span>
                    <span style="background:rgba(59,130,246,0.18); border:1px solid rgba(59,130,246,0.35); padding:0.2rem 0.55rem; border-radius:5px; color:#93c5fd; font-weight:600;">
                        <i class="fas fa-magic" style="margin-right:0.25rem;"></i>Field Spells: ${(item.fieldSnapshot.spells || []).length}
                    </span>
                    <button type="button" class="tab-btn" style="padding:0.2rem 0.55rem; font-size:0.75rem; background:rgba(168,85,247,0.18); border:1px solid rgba(168,85,247,0.35); color:#d8b4fe; font-weight:600; cursor:pointer;" onclick="showAuditPile('hand')" title="Click to inspect cards in Hand">
                        <i class="fas fa-hand-holding" style="margin-right:0.25rem;"></i>In Hand: ${(item.fieldSnapshot.hand || []).length}
                    </button>
                    <button type="button" class="tab-btn" style="padding:0.2rem 0.55rem; font-size:0.75rem; background:rgba(100,116,139,0.25); border:1px solid rgba(148,163,184,0.35); color:#cbd5e1; font-weight:600; cursor:pointer;" onclick="showAuditPile('gy')" title="Click to inspect cards in Graveyard">
                        <i class="fas fa-skull" style="margin-right:0.25rem;"></i>In GY: ${(item.fieldSnapshot.gy || []).length}
                    </button>
                    <button type="button" class="tab-btn" style="padding:0.2rem 0.55rem; font-size:0.75rem; background:rgba(192,132,252,0.18); border:1px solid rgba(192,132,252,0.35); color:#e9d5ff; font-weight:600; cursor:pointer;" onclick="showAuditPile('extra')" title="Click to inspect cards in Extra Deck">
                        <i class="fas fa-layer-group" style="margin-right:0.25rem;"></i>Extra Deck: ${(item.fieldSnapshot.extra || []).length}
                    </button>
                    ${(item.fieldSnapshot.banish || []).length > 0 ? `
                    <button type="button" class="tab-btn" style="padding:0.2rem 0.55rem; font-size:0.75rem; background:rgba(249,115,22,0.18); border:1px solid rgba(249,115,22,0.35); color:#fdba74; font-weight:600; cursor:pointer;" onclick="showAuditPile('banish')" title="Click to inspect Banished cards">
                        <i class="fas fa-fire" style="margin-right:0.25rem;"></i>Banished: ${(item.fieldSnapshot.banish || []).length}
                    </button>` : ''}
                </div>` : ''}
            </div>

            <div class="audit-sim-wrap">
                <div id="audit-sim-mount"></div>
            </div>
            <div class="audit-sim-hint">
                <i class="fas fa-info-circle"></i> Board shows duel state before failed step. Click any step in the timeline on the right to jump.
            </div>
        `;

        // Pane 3: Diagnostics, Timeline, Triage Toolbar & Notes
        detailsPane.innerHTML = `
            <div class="audit-insp-header">
                <div>
                    <div class="audit-insp-title">
                        <span>${window.escapeHtml(item.archetype)}: ${window.escapeHtml(item.comboTitle)}</span>
                        ${pageLink ? `<a class="pcs-admin-live-link" href="${window.escapeHtml(pageLink)}#combos" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i>Live guide</a>` : ''}
                    </div>
                    <div style="font-size:0.78rem; color:#a3a3a3; margin-top:0.25rem;">
                        Source: <span style="color:#e5e5e5;">${window.escapeHtml(item.sourceLabel || item.source)}</span> (${window.escapeHtml(item.file)}) · Step ${item.failedStepNumber ?? '?'}/${item.totalSteps}
                    </div>
                </div>

                <div class="audit-insp-actions">
                    <button class="btn-triage btn-triage-illegal${trStatus === 'illegal' ? ' is-selected' : ''}" onclick="setAuditTriageStatus('${item.id}', 'illegal')" title="Mark Truly Illegal (Hotkey: 1)">
                        <i class="fas fa-ban"></i> Truly Illegal <span class="kbd-hint">1</span>
                    </button>
                    <button class="btn-triage btn-triage-fp${trStatus === 'false_positive' ? ' is-selected' : ''}" onclick="setAuditTriageStatus('${item.id}', 'false_positive')" title="Mark False Positive (Hotkey: 2)">
                        <i class="fas fa-bug"></i> False Positive <span class="kbd-hint">2</span>
                    </button>
                    <button class="btn-triage btn-triage-resolved${trStatus === 'resolved' ? ' is-selected' : ''}" onclick="setAuditTriageStatus('${item.id}', 'resolved')" title="Mark Resolved (Hotkey: 3)">
                        <i class="fas fa-check-circle"></i> Resolved <span class="kbd-hint">3</span>
                    </button>
                    ${trStatus ? `
                    <button class="btn-triage" style="background:rgba(255,255,255,0.06); color:#a3a3a3; border:1px solid rgba(255,255,255,0.12);" onclick="setAuditTriageStatus('${item.id}', 'untriaged')">
                        <i class="fas fa-undo"></i> Clear
                    </button>` : ''}
                </div>
            </div>

            <!-- Diagnostics: Engine Log & Offered Actions -->
            <div class="audit-diag-grid">
                <div class="audit-diag-card">
                    <div class="audit-diag-title">
                        <i class="fas fa-hand-paper" style="color:#f59e0b;"></i> Legal Actions OCGCore Allowed <span id="audit-diag-offered-count">(${offeredCount})</span>
                    </div>
                    <div id="audit-diag-offered-actions"></div>
                </div>

                <div class="audit-diag-card">
                    <div class="audit-diag-title" id="audit-diag-log-header">
                        <i class="fas fa-terminal" style="color:#22c55e;"></i> Engine Execution Log
                    </div>
                    <ul class="audit-diag-list" id="audit-diag-engine-log" style="max-height:190px;"></ul>
                </div>
            </div>

            <!-- Steps Breakdown Timeline -->
            ${stepsHtml ? `
            <div class="audit-steps-section">
                <div class="audit-steps-header">
                    <span>Full Combo Step Timeline (${steps.length} Steps)</span>
                    <span style="font-size:0.72rem; color:#737373;">Click any step to inspect board state</span>
                </div>
                <div class="audit-steps-list" style="max-height:220px;">
                    ${stepsHtml}
                </div>
            </div>` : ''}

            <!-- Moderator Notes -->
            <div style="background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.08); border-radius:0.65rem; padding:0.75rem 0.9rem;">
                <div style="font-size:0.78rem; font-weight:700; color:#a3a3a3; text-transform:uppercase; margin-bottom:0.35rem; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fas fa-sticky-note" style="margin-right:0.35rem;"></i>Moderator Notes & Resolution Details</span>
                    ${triageRecord.updatedAt ? `<span style="font-size:0.7rem; color:#737373;">Last updated ${formatDate(triageRecord.updatedAt)}</span>` : ''}
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <input type="text" id="audit-triage-notes-input" class="modnotes-input" style="flex:1;" placeholder="Add details (e.g. 'False positive: Cost missed by parser', 'Illegal: Once per turn violated')" value="${window.escapeHtml(triageRecord.notes || '')}">
                    <button class="tab-btn" onclick="saveAuditCurrentNotes()"><i class="fas fa-save"></i> Save</button>
                </div>
            </div>
        `;

        renderAuditOfferedActions(item, initialStep);
        renderAuditEngineLog(item, initialStep);
        mountAuditSimulator(item);
    }

    function renderAuditEngineLog(item, activeStep = 1) {
        const container = document.getElementById('audit-diag-engine-log');
        const headerEl = document.getElementById('audit-diag-log-header');
        if (!container || !item) return;

        const totalSteps = item.totalSteps || (item.comboData?.steps || []).length || 1;
        const failedStepNum = item.failedStepNumber || 1;
        const stepMap = parseEngineLogByStep(item.log, totalSteps, failedStepNum, item.engineError);
        const mode = auditReport.logMode || 'follow';

        const stepText = item.comboData?.steps?.[activeStep - 1]?.text || `Step ${activeStep}`;
        if (headerEl) {
            headerEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:0.5rem; flex-wrap:wrap;">
                    <span><i class="fas fa-terminal" style="color:#22c55e;"></i> Engine Log · Step ${activeStep}/${totalSteps}</span>
                    <div style="display:flex; gap:0.25rem;">
                        <button type="button" class="audit-diag-filter-btn${mode === 'follow' ? ' active' : ''}" onclick="setAuditLogMode('follow', ${activeStep})">Follow Step</button>
                        <button type="button" class="audit-diag-filter-btn${mode === 'all' ? ' active' : ''}" onclick="setAuditLogMode('all', ${activeStep})">All (${(item.log || []).length})</button>
                    </div>
                </div>
            `;
        }

        if (mode === 'follow') {
            const events = stepMap[activeStep] || [];
            if (events.length > 0) {
                container.innerHTML = events.map(e => {
                    let cls = 'is-current-step-log ';
                    if (e.type === 'action') cls += 'is-step-action';
                    else if (e.type === 'trigger') cls += 'is-trigger';
                    else if (e.type === 'select') cls += 'is-select';
                    else if (e.type === 'rejection') cls += 'is-rejection';
                    return `<li class="${cls}"><span class="audit-step-tag">Step ${e.stepNum}</span>${window.escapeHtml(e.raw)}</li>`;
                }).join('');
            } else if (activeStep === failedStepNum) {
                container.innerHTML = `<li class="is-rejection"><span class="audit-step-tag">Step ${activeStep}</span><i class="fas fa-times-circle" style="margin-right:0.3rem;"></i><strong>Engine Rejection:</strong> ${window.escapeHtml(item.engineError || 'Step rejected by OCGCore rules.')}</li>`;
            } else if (activeStep > failedStepNum) {
                container.innerHTML = `<li class="is-unreached"><span class="audit-step-tag">Step ${activeStep}</span><i class="fas fa-ban" style="margin-right:0.3rem;"></i>Step ${activeStep} was not reached by the engine (halted at Step ${failedStepNum}: "${window.escapeHtml(item.engineError || 'Action rejected')}").</li>`;
            } else {
                container.innerHTML = `<li class="is-step-action"><span class="audit-step-tag">Step ${activeStep}</span><i class="fas fa-check-circle" style="margin-right:0.3rem;"></i>Step action "${window.escapeHtml(stepText)}" legally verified / transit resolution.</li>`;
            }
        } else {
            // Mode: 'all'
            const allHtml = [];
            for (let s = 1; s <= totalSteps; s++) {
                const sEvents = stepMap[s] || [];
                const isCurrent = (s === activeStep);
                if (sEvents.length > 0) {
                    sEvents.forEach(e => {
                        let cls = isCurrent ? 'is-current-step-log ' : '';
                        if (e.type === 'action') cls += 'is-step-action';
                        else if (e.type === 'trigger') cls += 'is-trigger';
                        else if (e.type === 'select') cls += 'is-select';
                        else if (e.type === 'rejection') cls += 'is-rejection';
                        allHtml.push(`<li class="${cls}" data-step="${s}"><span class="audit-step-tag">Step ${s}</span>${window.escapeHtml(e.raw)}</li>`);
                    });
                } else if (s === failedStepNum) {
                    allHtml.push(`<li class="${isCurrent ? 'is-current-step-log ' : ''}is-rejection" data-step="${s}"><span class="audit-step-tag">Step ${s}</span><strong>Engine Rejection:</strong> ${window.escapeHtml(item.engineError || 'Step rejected')}</li>`);
                }
            }
            if (allHtml.length > 0) {
                container.innerHTML = allHtml.join('');
                setTimeout(() => {
                    const curEl = container.querySelector('.is-current-step-log');
                    if (curEl) curEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }, 50);
            } else {
                container.innerHTML = '<div style="font-size:0.78rem;color:#737373;padding:0.5rem 0;">No engine events logged prior to rejection.</div>';
            }
        }
    }

    function renderAuditOfferedActions(item, activeStep = 1) {
        const container = document.getElementById('audit-diag-offered-actions');
        const countEl = document.getElementById('audit-diag-offered-count');
        if (!container || !item) return;

        const offered = item.offeredActions;
        const offeredCount = getOfferedCount(offered);
        if (countEl) countEl.textContent = `(${offeredCount})`;

        const chips = renderOfferedActionChips(offered);

        if (chips.length > 0) {
            container.innerHTML = `
                ${activeStep !== item.failedStepNumber ? `<div style="font-size:0.72rem; color:#9ca3af; margin-bottom:0.35rem;"><i class="fas fa-info-circle"></i> Allowed actions at failure point (Step ${item.failedStepNumber ?? '?'}):</div>` : ''}
                <div class="audit-offered-grid" style="max-height:190px; overflow-y:auto;">
                    ${chips.join('')}
                </div>
            `;
        } else {
            const snap = item.fieldSnapshot;
            let note = '';
            if (snap) {
                const monCount = (snap.monsters || []).length;
                const handCount = (snap.hand || []).length;
                const gyCount = (snap.gy || []).length;
                note = ` (Field: ${monCount} monster${monCount !== 1 ? 's' : ''}, ${handCount} in hand, ${gyCount} in GY).`;
            }
            container.innerHTML = `<div style="font-size:0.78rem;color:#a3a3a3;padding:0.5rem 0;">No idle actions available${note} (engine awaiting trigger resolution, chain timing, or board locked).</div>`;
        }
    }

    function handleAuditSimStepChange(stepIdx, forceStepNum = null) {
        const item = getActiveAuditItem();
        if (!item) return;

        const totalSteps = item.totalSteps || (item.comboData?.steps || []).length || 1;
        const currentStepNum = forceStepNum !== null ? forceStepNum : (stepIdx === 0 ? 1 : Math.min(stepIdx, totalSteps));
        auditReport.activeSimStep = currentStepNum;

        // 1. Highlight Timeline
        const stepItems = document.querySelectorAll('.audit-step-item');
        stepItems.forEach((el, idx) => {
            const sNum = idx + 1;
            const isActive = (sNum === currentStepNum);
            el.classList.toggle('is-active-step', isActive);
        });
        const activeEl = document.querySelector('.audit-step-item.is-active-step');
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        // 2. Update Engine Execution Log
        renderAuditEngineLog(item, currentStepNum);

        // 3. Update Offered Actions
        renderAuditOfferedActions(item, currentStepNum);
    }

    window.setAuditLogMode = function (mode, stepNum) {
        auditReport.logMode = mode;
        const item = getActiveAuditItem();
        if (item) {
            const currentStep = stepNum || auditReport.activeSimStep || 1;
            renderAuditEngineLog(item, currentStep);
        }
    };

    function mountAuditSimulator(item) {
        const mount = document.getElementById('audit-sim-mount');
        if (!mount || !item.comboData) return;

        if (auditReport.simulatorInstance) {
            clearInterval(auditReport.simulatorInstance.interval);
            auditReport.simulatorInstance = null;
        }

        try {
            auditReport.simulatorInstance = new DuelSimulator('audit-sim-mount', {
                auditCombo: item.comboData
            }, {
                // Verifier step numbers count every step of a v2 replay combo,
                // so the board can't cut it to the first turn here.
                v2Range: 'all',
                onStepChange: (stepIdx) => {
                    handleAuditSimStepChange(stepIdx);
                }
            });

            // Automatically position the board right before the failure!
            const target = Math.max(0, (item.failedStepNumber || 1) - 1);
            const sim = auditReport.simulatorInstance;
            sim.ready.then(() => setTimeout(() => {
                if (auditReport.simulatorInstance === sim) {
                    sim.jumpToStep(target, item.fieldSnapshot);
                    handleAuditSimStepChange(target, item.failedStepNumber || 1);
                }
            }, 120));
        } catch (e) {
            console.error('Failed to initialize DuelSimulator for audit', e);
            mount.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i>Could not load DuelSimulator: ${window.escapeHtml(e.message)}</div>`;
        }
    }

    window.jumpAuditSimulatorToStep = function (stepIdx) {
        if (!auditReport.simulatorInstance) return;
        auditReport.simulatorInstance.jumpToStep(stepIdx);
        handleAuditSimStepChange(stepIdx, stepIdx + 1);
    };

    window.jumpAuditSimulatorToFail = function () {
        const item = getActiveAuditItem();
        if (!item || !auditReport.simulatorInstance) return;
        const target = Math.max(0, (item.failedStepNumber || 1) - 1);
        auditReport.simulatorInstance.jumpToStep(target, item.fieldSnapshot);
        handleAuditSimStepChange(target, item.failedStepNumber || 1);
        toast(`Board positioned at step ${target} (OCGCore state prior to failed step ${item.failedStepNumber})`);
    };

    window.showAuditPile = function (pileKey) {
        if (!auditReport.simulatorInstance) return;
        if (pileKey === 'gy') {
            auditReport.simulatorInstance.showGraveyardContents();
        } else if (pileKey === 'extra') {
            auditReport.simulatorInstance.showExtraDeckContents();
        } else if (pileKey === 'banish') {
            auditReport.simulatorInstance.showBanishedContents();
        } else if (pileKey === 'hand') {
            auditReport.simulatorInstance.showHandContents();
        }
    };

    window.saveAuditCurrentNotes = function () {
        const item = getActiveAuditItem();
        if (!item) return;
        const input = document.getElementById('audit-triage-notes-input');
        const notes = input ? input.value.trim() : '';
        const current = auditReport.triage[item.id] || { status: 'untriaged' };
        saveTriageRecord(item.id, current.status || 'untriaged', notes);
        toast('Notes saved.');
    };

    window.setAuditTriageStatus = function (itemId, status) {
        const input = document.getElementById('audit-triage-notes-input');
        const notes = input ? input.value.trim() : (auditReport.triage[itemId]?.notes || '');
        saveTriageRecord(itemId, status, notes);
        let msg = 'Triage cleared.';
        if (status === 'illegal') msg = 'Marked as Truly Illegal.';
        else if (status === 'false_positive') msg = 'Marked as False Positive / Parser issue.';
        else if (status === 'resolved') msg = 'Marked as Resolved.';
        toast(msg);
    };

    window.filterAuditTriage = function (filter, btn) {
        auditReport.filterTriage = filter;
        auditReport.shownCount = 30;
        document.querySelectorAll('.tab-btn[onclick*="filterAuditTriage"]').forEach(b => b.classList.toggle('active', b === btn));
        renderAuditList();
        renderAuditInspector();
    };

    window.filterAuditSource = function (source, btn) {
        auditReport.filterSource = source;
        if (source === 'curated' && auditReport.filterVerdict !== 'all') {
            auditReport.filterVerdict = 'all';
            document.querySelectorAll('.tab-btn[onclick*="filterAuditVerdict"]').forEach(b => {
                b.classList.toggle('active', b.getAttribute('onclick')?.includes("'all'"));
            });
        }
        const vg = document.getElementById('audit-verdict-filter-group');
        if (vg) vg.style.display = source === 'curated' ? 'none' : 'flex';
        auditReport.shownCount = 30;
        document.querySelectorAll('.tab-btn[onclick*="filterAuditSource"]').forEach(b => b.classList.toggle('active', b === btn));
        renderAuditList();
        renderAuditInspector();
    };

    window.filterAuditVerdict = function (verdict, btn) {
        auditReport.filterVerdict = verdict;
        if (verdict !== 'all' && auditReport.filterSource === 'curated') {
            auditReport.filterSource = 'all';
            document.querySelectorAll('.tab-btn[onclick*="filterAuditSource"]').forEach(b => {
                b.classList.toggle('active', b.getAttribute('onclick')?.includes("'all'"));
            });
            const vg = document.getElementById('audit-verdict-filter-group');
            if (vg) vg.style.display = 'flex';
        }
        auditReport.shownCount = 30;
        document.querySelectorAll('.tab-btn[onclick*="filterAuditVerdict"]').forEach(b => b.classList.toggle('active', b === btn));
        renderAuditList();
        renderAuditInspector();
    };

    window.searchAuditReport = function (query) {
        auditReport.query = query.trim();
        auditReport.shownCount = 30;
        renderAuditList();
        renderAuditInspector();
    };

    window.selectAuditCombo = function (id) {
        if (auditReport.activeItemId === id) return;
        auditReport.activeItemId = id;
        document.querySelectorAll('.audit-card').forEach(c => c.classList.toggle('is-active', c.id === `audit-card-${id}`));
        renderAuditInspector();
    };

    window.showMoreAudit = function () {
        auditReport.shownCount = (auditReport.shownCount || 30) + 30;
        renderAuditList();
    };

    let _shortcutsInitialized = false;
    function setupAuditKeyboardShortcuts() {
        if (_shortcutsInitialized) return;
        _shortcutsInitialized = true;
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
            if (location.hash.slice(1) !== 'audit') return;

            const item = getActiveAuditItem();
            if (!item) return;

            if (e.key === '1') {
                e.preventDefault();
                window.setAuditTriageStatus(item.id, 'illegal');
            } else if (e.key === '2') {
                e.preventDefault();
                window.setAuditTriageStatus(item.id, 'false_positive');
            } else if (e.key === '3') {
                e.preventDefault();
                window.setAuditTriageStatus(item.id, 'resolved');
            } else if (e.key === 'j' || e.key === 'J') {
                e.preventDefault();
                window.jumpAuditSimulatorToFail();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectNextAuditCombo(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectNextAuditCombo(-1);
            }
        });
    }

    function selectNextAuditCombo(delta) {
        const filtered = getFilteredAuditItems();
        if (!filtered.length) return;
        const curIdx = filtered.findIndex(it => it.id === auditReport.activeItemId);
        let nextIdx = curIdx + delta;
        if (nextIdx < 0) nextIdx = 0;
        if (nextIdx >= filtered.length) nextIdx = filtered.length - 1;
        const nextItem = filtered[nextIdx];
        if (nextItem && nextItem.id !== auditReport.activeItemId) {
            window.selectAuditCombo(nextItem.id);
            const card = document.getElementById(`audit-card-${nextItem.id}`);
            if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    window.toggleModeBar = function (forceState) {
        const bar = document.getElementById('admin-mode-bar');
        if (!bar) return;
        const collapsed = (typeof forceState === 'boolean')
            ? (forceState ? bar.classList.add('is-collapsed') : bar.classList.remove('is-collapsed'), forceState)
            : bar.classList.toggle('is-collapsed');
        try {
            localStorage.setItem('archetype_admin_sidebar_collapsed', collapsed ? '1' : '0');
        } catch {}
        setTimeout(() => {
            auditReport.simulatorInstance?.repositionCards();
            window.dispatchEvent(new Event('resize'));
        }, 60);
        setTimeout(() => {
            auditReport.simulatorInstance?.repositionCards();
        }, 240);
    };

    window.toggleAuditQueue = function () {
        const layout = document.querySelector('.audit-layout');
        const btn = document.getElementById('btn-toggle-audit-queue');
        if (!layout) return;
        const isCollapsed = layout.classList.toggle('queue-collapsed');
        if (btn) {
            btn.innerHTML = isCollapsed
                ? '<i class="fas fa-compress-arrows-alt"></i> Restore Queue'
                : '<i class="fas fa-expand-arrows-alt"></i> Maximize Display';
        }
        setTimeout(() => {
            auditReport.simulatorInstance?.repositionCards();
            window.dispatchEvent(new Event('resize'));
        }, 60);
        setTimeout(() => {
            auditReport.simulatorInstance?.repositionCards();
        }, 240);
    };

    window.exportAuditTriage = function () {
        const records = auditReport.triage || {};
        const keys = Object.keys(records);
        if (!keys.length) {
            toast('No triaged combos to export yet. Triage some combos first!');
            return;
        }
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalTriaged: keys.length,
            items: keys.map(id => {
                const item = (auditReport.data?.items || []).find(it => it.id === id);
                return {
                    id,
                    status: records[id].status,
                    notes: records[id].notes,
                    updatedAt: records[id].updatedAt,
                    archetype: item?.archetype,
                    comboTitle: item?.comboTitle,
                    source: item?.source,
                    failedStepNumber: item?.failedStepNumber,
                    engineError: item?.engineError
                };
            })
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `combo-audit-triage-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 200);
        toast(`Exported ${keys.length} triaged items!`);
    };

    window.importAuditTriage = function (e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                const items = data.items || (Array.isArray(data) ? data : []);
                if (!items.length) {
                    toast('No triage items found in JSON file.', true);
                    return;
                }
                if (!auditReport.triage) auditReport.triage = {};
                let imported = 0;
                items.forEach(it => {
                    if (it.id && (it.status || it.notes)) {
                        auditReport.triage[it.id] = {
                            status: it.status || 'untriaged',
                            notes: it.notes || '',
                            updatedAt: it.updatedAt || new Date().toISOString()
                        };
                        imported++;
                    }
                });
                localStorage.setItem(AUDIT_TRIAGE_STORAGE_KEY, JSON.stringify(auditReport.triage));
                updateAuditCounters();
                renderAuditList();
                renderAuditInspector();
                toast(`Successfully imported ${imported} triaged items!`);
            } catch (err) {
                toast(`Failed to parse triage JSON: ${err.message}`, true);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

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
        try {
            if (localStorage.getItem('archetype_admin_sidebar_collapsed') === '1' || location.hash.slice(1) === 'audit') {
                document.getElementById('admin-mode-bar')?.classList.add('is-collapsed');
            }
        } catch {}
        window.CardLoader && window.CardLoader.initAmbientBackdropForCards('admin');
        if (MODES.includes(location.hash.slice(1))) window.switchMode(location.hash.slice(1));
        // report.json is a small static file: load it now so the sidebar badge
        // shows decks needing attention before the mode is opened.
        if (!deckReport.requested) loadDeckReport();
        if (!auditReport.requested) loadAuditReport();

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
