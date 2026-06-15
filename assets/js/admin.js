/**
 * admin.js — Combo guide moderation panel
 * Requires: supabase-config.js, auth.js loaded first.
 */
(function () {
    'use strict';

    let _client = null;
    let _comboCache = { pending: [], approved: [], rejected: [] };

    function client() {
        if (!_client) _client = window.Auth._getClient();
        return _client;
    }

    const GCS_BASE = 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/';
    const ANALYZER_URL = '../pages/Replay-Analyzer.html';
    const BACKEND_URL = 'https://yrp-10714964039.europe-west1.run.app';

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

    function formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

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
            m.tags.forEach(t => items.push(`<span class="mbadge mbadge-tag">${t}</span>`));
        }
        return items.join('');
    }

    function renderCard(combo, tab) {
        const m = combo.replays?.metadata || {};
        const playerNames = Array.isArray(m.playerNames) ? m.playerNames.join(' vs ') : '—';
        const archName = combo.archetypes?.archetypename || `Archetype #${combo.archetypeid}`;
        const metaBadges = buildMetaBadges(m);
        const existingNotes = combo.modnotes || '';

        let actions = '';
        if (tab === 'pending') {
            actions = `
                <div class="action-row">
                    <input class="modnotes-input" type="text" placeholder="Mod notes (optional, shown to submitter on reject)"
                           id="notes-${combo.comboid}" value="${existingNotes.replace(/"/g, '&quot;')}">
                    <button class="btn-approve" onclick="approveCombo('${combo.comboid}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-reject" onclick="rejectCombo('${combo.comboid}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>`;
        } else if (tab === 'approved') {
            const hasSteps = !!combo.gcscombojsonpath;
            const rawpath = combo.replays?.gcsrawpath || '';
            actions = `
                <div class="action-row">
                    <button class="btn-unapprove" onclick="unapproveCombo('${combo.comboid}')">
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
        } else if (tab === 'rejected') {
            actions = `
                <div class="action-row">
                    <button class="btn-approve" onclick="approveCombo('${combo.comboid}')">
                        <i class="fas fa-check"></i> Approve anyway
                    </button>
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
            <div class="combo-admin-card" id="card-${combo.comboid}">
                <div class="combo-admin-card-header">
                    <div class="combo-admin-meta">
                        <div class="combo-admin-title">${combo.title}</div>
                        ${combo.description ? `<div class="combo-admin-sub" style="margin-top:0.3rem;font-style:italic;color:#a3a3a3;">"${combo.description}"</div>` : ''}
                        <div class="combo-admin-sub">
                            <span>${archName}</span> · Submitted by <span>${combo.profiles?.displayname || 'Unknown'}</span> · ${formatDate(combo.createdon)}
                        </div>
                        <div class="combo-admin-sub" style="margin-top:0.2rem;">
                            Players: <span>${playerNames}</span>
                        </div>
                        ${existingNotes && tab !== 'pending' ? `<div class="combo-admin-sub" style="margin-top:0.3rem;color:#f87171;">Mod notes: ${existingNotes}</div>` : ''}
                        ${metaBadges ? `<div class="meta-strip">${metaBadges}</div>` : ''}
                    </div>
                </div>
                ${analyzeBtn ? `<div>${analyzeBtn}</div>` : ''}
                ${actions}
            </div>`;
    }

    function renderTab(tab, combos) {
        const container = document.getElementById(`tab-${tab}`);
        if (!container) return;
        if (!combos.length) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i>No ${tab} submissions</div>`;
            return;
        }
        container.innerHTML = combos.map(c => renderCard(c, tab)).join('');
    }

    window.switchTab = function (tab, btn) {
        ['pending', 'approved', 'rejected'].forEach(t => {
            const el = document.getElementById(`tab-${t}`);
            if (el) el.style.display = t === tab ? '' : 'none';
        });
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    };

    async function setStatus(comboid, status, modnotes) {
        const update = { status };
        if (modnotes !== undefined) update.modnotes = modnotes || null;
        const { error } = await client().from('combos').update(update).eq('comboid', comboid);
        if (error) throw error;
    }

    function removeCard(comboid) {
        const card = document.getElementById(`card-${comboid}`);
        if (card) card.remove();
    }

    function _switchToTab(tab) {
        const btn = [...document.querySelectorAll('.tab-btn')]
            .find(b => (b.getAttribute('onclick') || '').includes("'" + tab + "'"));
        window.switchTab(tab, btn || null);
    }

    function _updatePendingCount() {
        const countEl = document.getElementById('pending-count');
        if (countEl) {
            countEl.textContent = _comboCache.pending.length
                ? `(${_comboCache.pending.length})` : '';
        }
    }

    window.approveCombo = async function (comboid) {
        try {
            await setStatus(comboid, 'approved');
            removeCard(comboid);
            for (const tab of ['pending', 'rejected']) {
                const idx = _comboCache[tab].findIndex(c => c.comboid === comboid);
                if (idx !== -1) {
                    const [combo] = _comboCache[tab].splice(idx, 1);
                    combo.status = 'approved';
                    _comboCache.approved.unshift(combo);
                    renderTab(tab, _comboCache[tab]);
                    renderTab('approved', _comboCache.approved);
                    _updatePendingCount();
                    _switchToTab('approved');
                    break;
                }
            }
        } catch (e) { alert('Error: ' + e.message); }
    };

    window.rejectCombo = async function (comboid) {
        const notes = document.getElementById(`notes-${comboid}`)?.value?.trim() || '';
        try {
            await setStatus(comboid, 'rejected', notes);
            removeCard(comboid);
            const idx = _comboCache.pending.findIndex(c => c.comboid === comboid);
            if (idx !== -1) {
                const [combo] = _comboCache.pending.splice(idx, 1);
                combo.status = 'rejected';
                combo.modnotes = notes;
                _comboCache.rejected.unshift(combo);
                renderTab('pending', _comboCache.pending);
                renderTab('rejected', _comboCache.rejected);
                _updatePendingCount();
                _switchToTab('rejected');
            }
        } catch (e) { alert('Error: ' + e.message); }
    };

    window.unapproveCombo = async function (comboid) {
        try {
            await setStatus(comboid, 'pending');
            removeCard(comboid);
            const idx = _comboCache.approved.findIndex(c => c.comboid === comboid);
            if (idx !== -1) {
                const [combo] = _comboCache.approved.splice(idx, 1);
                combo.status = 'pending';
                _comboCache.pending.unshift(combo);
                renderTab('approved', _comboCache.approved);
                renderTab('pending', _comboCache.pending);
                _updatePendingCount();
                _switchToTab('pending');
            }
        } catch (e) { alert('Error: ' + e.message); }
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
            // Update cache so the badge stays on re-render
            for (const combo of _comboCache.approved) {
                if (combo.comboid === comboid) {
                    combo.gcscombojsonpath = 'set';
                    break;
                }
            }
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cogs"></i> Generate Combo Steps';
            alert('Failed to generate combo steps: ' + e.message);
        }
    };

    async function init() {
        const session = await window.Auth.getSession();
        if (!session) {
            window.location.href = '../index.html';
            return;
        }

        // Check moderator role
        const { data: profile } = await client()
            .from('profiles')
            .select('role')
            .eq('userid', session.user.id)
            .single();

        if (!profile || !['moderator', 'admin'].includes(profile.role)) {
            document.getElementById('access-denied').style.display = '';
            return;
        }

        document.getElementById('admin-content').style.display = '';

        // Fetch all combos with related data
        const { data, error } = await client()
            .from('combos')
            .select(`
                comboid, title, description, status, modnotes, archetypeid, createdon, gcscombojsonpath,
                profiles!combos_userid_fkey ( displayname ),
                archetypes!combos_archetypeid_fkey ( archetypename ),
                replays!combos_replayid_fkey ( gcsjsonpath, gcsrawpath, metadata )
            `)
            .in('status', ['pending', 'approved', 'rejected'])
            .order('createdon', { ascending: false });

        if (error) {
            document.getElementById('admin-content').innerHTML =
                `<p style="color:#f87171;">Failed to load: ${error.message}</p>`;
            return;
        }

        _comboCache.pending  = (data || []).filter(c => c.status === 'pending');
        _comboCache.approved = (data || []).filter(c => c.status === 'approved');
        _comboCache.rejected = (data || []).filter(c => c.status === 'rejected');

        const countEl = document.getElementById('pending-count');
        if (countEl && _comboCache.pending.length) {
            countEl.textContent = `(${_comboCache.pending.length})`;
        }

        renderTab('pending',  _comboCache.pending);
        renderTab('approved', _comboCache.approved);
        renderTab('rejected', _comboCache.rejected);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
