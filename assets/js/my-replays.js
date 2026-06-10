/**
 * My Account page logic
 * Requires auth.js loaded first.
 */
(function () {
    'use strict';

    const GCS_BASE = 'https://storage.googleapis.com/yugioh-card-images-archetype-nexus/';
    const ANALYZER_URL = '../pages/Replay-Analyzer.html';
    const ANALYZER_API = 'https://yrp-10714964039.europe-west1.run.app/analyze';

    let replayCache = [];

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatDateShort(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }

    function archetype(replay) {
        const m = replay.metadata || {};
        return m.archetype || '';
    }

    function archetypeUrl(name) {
        if (!name || typeof archetypes === 'undefined') return null;
        const entry = archetypes.find(a => a.name.toLowerCase() === name.toLowerCase());
        if (!entry) return null;
        return entry.filepath.replace(/^pages\//, '');
    }

    function archetypeIcon(name) {
        if (!name || typeof archetypes === 'undefined') return null;
        const entry = archetypes.find(a => a.name.toLowerCase() === name.toLowerCase());
        return entry?.icon || null;
    }

    function playerNames(replay) {
        const m = replay.metadata || {};
        if (Array.isArray(m.playerNames) && m.playerNames.length) {
            return m.playerNames.join(' vs ');
        }
        return '—';
    }

    // ------------------------------------------------------------------
    // Profile section
    // ------------------------------------------------------------------

    function renderProfile(session) {
        const m = session.user.user_metadata || {};
        const name = m.full_name || m.name || m.user_name || 'Duelist';
        const discordTag = m.user_name || m.preferred_username || null;
        const avatar = m.avatar_url || null;
        const since = session.user.created_at ? 'Member since ' + formatDateShort(session.user.created_at) : 'Duelist';

        // Avatar
        const avatarWrap = document.getElementById('profile-avatar-wrap');
        if (avatarWrap) {
            if (avatar) {
                avatarWrap.outerHTML = `<img id="profile-avatar-wrap" class="profile-avatar" src="${avatar}" alt="${name}">`;
            }
        }

        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = name;

        const badge = document.getElementById('profile-discord-badge');
        const tagEl = document.getElementById('profile-discord-tag');
        if (badge && tagEl && discordTag) {
            tagEl.textContent = discordTag;
            badge.style.display = '';
        }

        const sinceEl = document.getElementById('profile-since');
        if (sinceEl) sinceEl.textContent = since;

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.style.display = '';
    }

    // ------------------------------------------------------------------
    // Stats section
    // ------------------------------------------------------------------

    function renderStats(replays) {
        const total = replays.length;
        const publicCount = replays.filter(r => r.visibility === 'public').length;
        const archetypes = new Set(replays.map(r => r.metadata?.archetype).filter(Boolean)).size;
        const latest = replays.length ? formatDate(replays[0].createdon) : '—';

        const statsBar = document.getElementById('stats-bar');
        if (statsBar) statsBar.style.display = '';

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        set('stat-total', total);
        set('stat-public', publicCount);
        set('stat-archetypes', archetypes || '—');
        set('stat-latest', latest);
        set('replay-count', total === 1 ? '1 replay' : `${total} replays`);
    }

    // ------------------------------------------------------------------
    // Render states
    // ------------------------------------------------------------------

    function renderLoginGate() {
        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = 'Sign in to view your profile';

        const since = document.getElementById('profile-since');
        if (since) since.textContent = 'Connect your account to get started';

        const list = document.getElementById('replay-list');
        if (!list) return;
        list.innerHTML = `
            <div class="login-gate">
                <i class="fas fa-user-circle"></i>
                <p>Login to view your saved replays</p>
                <div style="display:inline-flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;">
                    <button onclick="window.Auth.signInWithDiscord(window.location.href)"
                            style="display:inline-flex;align-items:center;gap:0.5rem;
                                   background:linear-gradient(to right,#5865F2,#4752C4);
                                   color:#fff;font-weight:700;font-size:0.9rem;
                                   padding:0.75rem 1.5rem;border-radius:0.75rem;
                                   border:1px solid rgba(255,255,255,0.2);cursor:pointer;
                                   box-shadow:0 0 16px rgba(88,101,242,0.5);font-family:inherit;">
                        <i class="fab fa-discord"></i> Discord
                    </button>
                    <button onclick="window.Auth.signInWithGoogle(window.location.href)"
                            style="display:inline-flex;align-items:center;gap:0.5rem;
                                   background:linear-gradient(to right,#4285F4,#2563EB);
                                   color:#fff;font-weight:700;font-size:0.9rem;
                                   padding:0.75rem 1.5rem;border-radius:0.75rem;
                                   border:1px solid rgba(255,255,255,0.2);cursor:pointer;
                                   box-shadow:0 0 16px rgba(66,133,244,0.5);font-family:inherit;">
                        <svg width="16" height="16" viewBox="0 0 48 48" style="flex-shrink:0"><path fill="#fff" d="M43.6 20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/></svg>
                        Google
                    </button>
                </div>
            </div>`;
    }

    function renderEmpty(container) {
        container.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted);">
                <i class="fas fa-inbox" style="font-size:3rem;margin-bottom:1rem;display:block;opacity:0.3;"></i>
                <p style="font-size:1.1rem;margin-bottom:0.5rem;color:var(--text-color);">No replays yet</p>
                <p style="font-size:0.875rem;margin-bottom:1.5rem;">Upload a <code style="font-size:0.82rem;background:rgba(255,255,255,0.07);padding:0.1rem 0.35rem;border-radius:0.3rem;">.yrpx</code> file to analyze and save it to your account.</p>
                <button class="btn-upload" style="font-size:0.85rem;padding:0.55rem 1.25rem;"
                        onclick="document.getElementById('replay-upload-input').click()">
                    <i class="fas fa-upload"></i> Upload your first replay
                </button>
            </div>`;
    }

    function renderError(container, msg) {
        container.innerHTML = `
            <div style="text-align:center;padding:2rem;color:#f87171;">
                <i class="fas fa-exclamation-circle" style="margin-right:0.5rem;"></i>${msg}
            </div>`;
    }

    function arcLink(name) {
        const u = archetypeUrl(name);
        const style = 'color:#a5b4fc;text-decoration:none;border-bottom:1px solid rgba(165,180,252,0.35);transition:color 0.15s,border-color 0.15s;';
        return u
            ? `<a href="${u}" style="${style}" onmouseover="this.style.color='#c7d2fe';this.style.borderBottomColor='rgba(199,210,254,0.7)'" onmouseout="this.style.color='#a5b4fc';this.style.borderBottomColor='rgba(165,180,252,0.35)'">${name}</a>`
            : name;
    }

    function buildMetaStrip(m) {
        const items = [];

        if (m.winner) {
            const isWin = m.winner.player === 0;
            const turns = m.winner.turnsToWin ? ` · ${m.winner.turnsToWin}T` : '';
            const icon = isWin ? 'fa-trophy' : 'fa-times-circle';
            const cls  = isWin ? 'badge-win' : 'badge-loss';
            const label = isWin ? 'WIN' : 'LOSS';
            items.push(`<span class="replay-badge ${cls}"><i class="fas ${icon}" style="font-size:0.65rem;"></i> ${label}${turns}</span>`);
            if (m.winner.isOTK) {
                items.push(`<span class="replay-badge badge-otk">OTK</span>`);
            }
        }

        if (m.interactions && (m.interactions.chains !== undefined || m.interactions.negates !== undefined)) {
            if (items.length) items.push('<span class="rbadge-sep"></span>');
            if (m.interactions.chains !== undefined) {
                items.push(`<span class="replay-badge badge-stat" title="Chains"><i class="fas fa-link" style="font-size:0.65rem;"></i> ${m.interactions.chains}</span>`);
            }
            if (m.interactions.negates !== undefined) {
                items.push(`<span class="replay-badge badge-stat" title="Negates"><i class="fas fa-ban" style="font-size:0.65rem;"></i> ${m.interactions.negates}</span>`);
            }
        }

        if (Array.isArray(m.tags) && m.tags.length) {
            if (items.length) items.push('<span class="rbadge-sep"></span>');
            m.tags.forEach(tag => items.push(`<span class="replay-badge badge-tag">${tag}</span>`));
        }

        return items.length ? `<div class="replay-meta-strip">${items.join('')}</div>` : '';
    }

    function replayCard(replay) {
        const m = replay.metadata || {};
        const names = playerNames(replay);
        const date = formatDate(replay.createdon);
        const hasJson = !!replay.gcsjsonpath;

        // Use per-player archetype array if available, otherwise fall back to combined field
        const p1Arcs = Array.isArray(m.archetypes?.player1) && m.archetypes.player1.length
            ? m.archetypes.player1
            : (archetype(replay) ? [archetype(replay)] : []);
        const arcDisplay = p1Arcs.length
            ? p1Arcs.map(arcLink).join('<span style="opacity:0.4;margin:0 0.3rem;">·</span>')
            : '<span style="opacity:0.4">Unknown archetype</span>';

        const iconSvg = archetypeIcon(p1Arcs[0]);
        const iconHtml = `<div class="replay-icon">${
            iconSvg
                ? iconSvg
                : '<i class="fas fa-layer-group replay-icon-fallback"></i>'
        }</div>`;

        const metaStrip = buildMetaStrip(m);
        const resultClass = m.winner
            ? (m.winner.player === 0 ? 'replay-card--win' : 'replay-card--loss')
            : '';
        const clickable = hasJson
            ? `replay-card--clickable" data-path="${replay.gcsjsonpath}" onclick="replayCardClick(event, this)`
            : '';

        return `
            <div class="replay-card ${resultClass} ${clickable}" data-id="${replay.replayid}">
                <div class="replay-card-header">
                    ${iconHtml}
                    <div class="replay-card-header-content">
                        <div class="replay-arc">${arcDisplay}</div>
                        <div class="replay-names">${names}</div>
                    </div>
                    <div class="replay-date">${date}</div>
                </div>
                ${metaStrip}
                <div class="replay-card-footer">
                    ${hasJson
                        ? `<button class="btn-reanalyze" data-path="${replay.gcsjsonpath}" onclick="reAnalyze(this)">
                               <i class="fas fa-chart-line"></i> Re-analyze
                           </button>`
                        : `<span style="color:var(--text-muted);font-size:0.8rem;">Analysis not stored</span>`}
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <select class="vis-select" data-id="${replay.replayid}"
                                onchange="updateVisibility(this)"
                                style="font-family:inherit;">
                            <option value="private" ${replay.visibility === 'private' ? 'selected' : ''}>🔒 Private</option>
                            <option value="public" ${replay.visibility === 'public' ? 'selected' : ''}>🌐 Public</option>
                        </select>
                        <button class="btn-delete" data-id="${replay.replayid}" onclick="deleteReplay(this)"
                                title="Delete replay">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function renderList(container, replays) {
        if (!replays || replays.length === 0) {
            renderEmpty(container);
            return;
        }
        const header = document.getElementById('list-header');
        const count = document.getElementById('replay-count');
        if (header) header.style.display = '';
        if (count) count.textContent = replays.length === 1 ? '1 replay' : `${replays.length} replays`;
        container.innerHTML = replays.map(replayCard).join('');
    }

    // ------------------------------------------------------------------
    // Actions (exposed globally so onclick can reach them)
    // ------------------------------------------------------------------

    async function uploadReplay(file) {
        const btns = document.querySelectorAll('.btn-upload');
        btns.forEach(b => { b.disabled = true; b.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading…'; });
        try {
            const token = await window.Auth.getToken();
            const headers = {
                'Content-Type': 'application/octet-stream',
                'x-save-replay': 'true',
                'x-filename': file.name
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(ANALYZER_API, { method: 'POST', headers, body: file });
            if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));
            const data = await res.json();
            sessionStorage.setItem('replayPreload', JSON.stringify(data));
            window.location.href = ANALYZER_URL;
        } catch (e) {
            btns.forEach(b => { b.disabled = false; b.innerHTML = '<i class="fas fa-upload"></i> Upload Replay'; });
            alert('Upload failed: ' + e.message);
        }
    }

    async function loadAndNavigate(path, btn) {
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading…'; }
        try {
            const res = await fetch(GCS_BASE + path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            sessionStorage.setItem('replayPreload', JSON.stringify(data));
            window.location.href = ANALYZER_URL;
        } catch (e) {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-chart-line"></i> Re-analyze'; }
            alert('Could not load replay data: ' + e.message);
        }
    }

    window.reAnalyze = async function (btn) {
        const path = btn.dataset.path;
        if (!path) return;
        await loadAndNavigate(path, btn);
    };

    window.replayCardClick = async function (e, card) {
        if (e.target.closest('button, select, a')) return;
        const path = card.dataset.path;
        if (!path) return;
        card.classList.add('loading');
        await loadAndNavigate(path, null);
        card.classList.remove('loading');
    };

    window.deleteReplay = async function (btn) {
        if (!confirm('Delete this replay? This cannot be undone.')) return;
        const id = btn.dataset.id;
        btn.disabled = true;
        try {
            const client = window.Auth._getClient();
            const { error } = await client.from('replays').delete().eq('replayid', id);
            if (error) throw error;
            replayCache = replayCache.filter(r => r.replayid !== id);
            renderStats(replayCache);
            const card = document.querySelector(`.replay-card[data-id="${id}"]`);
            if (card) card.remove();
            const list = document.getElementById('replay-list');
            if (list && !list.querySelector('.replay-card')) renderEmpty(list);
        } catch (e) {
            btn.disabled = false;
            alert('Delete failed: ' + e.message);
        }
    };

    window.updateVisibility = async function (sel) {
        const id = sel.dataset.id;
        const value = sel.value;
        try {
            const client = window.Auth._getClient();
            const { error } = await client
                .from('replays')
                .update({ visibility: value })
                .eq('replayid', id);
            if (error) throw error;
            const entry = replayCache.find(r => r.replayid === id);
            if (entry) { entry.visibility = value; renderStats(replayCache); }
        } catch (e) {
            alert('Could not update visibility: ' + e.message);
        }
    };

    // ------------------------------------------------------------------
    // Boot
    // ------------------------------------------------------------------

    async function init() {
        const list = document.getElementById('replay-list');
        if (!list) return;

        list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading…</div>';

        const session = await window.Auth.getSession();
        if (!session) {
            renderLoginGate();
            return;
        }

        renderProfile(session);

        // Show the section bar and wire up the file input
        const listHeader = document.getElementById('list-header');
        if (listHeader) listHeader.style.display = '';

        const fileInput = document.getElementById('replay-upload-input');
        if (fileInput) {
            fileInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) { uploadReplay(file); fileInput.value = ''; }
            });
        }

        try {
            const client = window.Auth._getClient();
            const { data, error } = await client
                .from('replays')
                .select('replayid, gcsjsonpath, metadata, visibility, createdon')
                .order('createdon', { ascending: false });

            if (error) throw error;
            replayCache = data;
            renderStats(replayCache);
            renderList(list, replayCache);
        } catch (e) {
            renderError(list, 'Failed to load replays: ' + e.message);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
