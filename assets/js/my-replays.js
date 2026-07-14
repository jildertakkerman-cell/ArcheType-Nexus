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
    let combosByReplayId = {};

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

    async function renderProfile(session) {
        const m = session.user.user_metadata || {};
        // profiles.displayname is canonical site-wide; OAuth metadata is fallback
        const profile = await window.Auth.getProfile().catch(() => null);
        const name = profile?.displayname || m.full_name || m.name || m.user_name || 'Duelist';
        const discordTag = m.user_name || m.preferred_username || null;
        const avatar = m.avatar_url || null;
        const avatarSvg = (profile?.usearchetypeavatar && profile?.favorite?.iconsvg) || null;
        const since = session.user.created_at ? 'Member since ' + formatDateShort(session.user.created_at) : 'Duelist';

        // Avatar — favorite-archetype icon takes precedence when opted in
        const avatarWrap = document.getElementById('profile-avatar-wrap');
        if (avatarWrap) {
            if (avatarSvg) {
                avatarWrap.outerHTML = `<div id="profile-avatar-wrap" class="profile-avatar profile-avatar-svg"
                    style="overflow:hidden;background:#111827;display:flex;align-items:center;justify-content:center;">${avatarSvg}</div>
                    <style>.profile-avatar-svg svg{width:100%;height:100%;}</style>`;
            } else if (avatar) {
                avatarWrap.outerHTML = `<img id="profile-avatar-wrap" class="profile-avatar" src="${avatar}" alt="">`;
            } else {
                avatarWrap.outerHTML = `<div class="profile-avatar-fallback" id="profile-avatar-wrap"><i class="fab fa-discord"></i></div>`;
            }
        }

        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = name;

        // Favorite archetype line (icon + name) under the profile name
        const favEl = document.getElementById('profile-favorite');
        if (favEl) {
            if (profile?.favorite) {
                favEl.innerHTML = `<span class="profile-fav-icon" style="display:inline-flex;width:16px;height:16px;border-radius:50%;overflow:hidden;vertical-align:middle;margin-right:0.3rem;">${profile.favorite.iconsvg || ''}</span>
                    <style>.profile-fav-icon svg{width:100%;height:100%;}</style>`;
                const favName = document.createElement('span');
                favName.textContent = profile.favorite.archetypename;
                favEl.appendChild(favName);
                favEl.style.display = '';
            } else {
                favEl.innerHTML = '';
                favEl.style.display = 'none';
            }
        }

        const badge = document.getElementById('profile-discord-badge');
        const tagEl = document.getElementById('profile-discord-tag');
        if (badge && tagEl && discordTag) {
            tagEl.textContent = discordTag;
            badge.style.display = '';
        }

        const sinceEl = document.getElementById('profile-since');
        if (sinceEl) sinceEl.textContent = since;
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

    // ------------------------------------------------------------------
    // Duelist summary (Home panel): win rate + most played archetypes,
    // computed client-side from the already-loaded replay metadata.
    // ------------------------------------------------------------------

    function renderDuelistSummary(replays) {
        const card = document.getElementById('duelist-summary');
        if (!card) return;
        if (!replays || replays.length === 0) { card.style.display = 'none'; return; }

        let wins = 0, decided = 0, otks = 0, turnsSum = 0, turnsCount = 0;
        const tally = {}; // name -> { plays, wins }

        replays.forEach(r => {
            const m = r.metadata || {};
            const won = m.winner ? m.winner.player === 0 : null;
            if (m.winner) {
                decided++;
                if (won) wins++;
                if (m.winner.isOTK) otks++;
                if (m.winner.turnsToWin) { turnsSum += m.winner.turnsToWin; turnsCount++; }
            }
            const arcs = Array.isArray(m.archetypes?.player1) && m.archetypes.player1.length
                ? m.archetypes.player1
                : (m.archetype ? [m.archetype] : []);
            arcs.forEach(name => {
                if (!name) return;
                if (!tally[name]) tally[name] = { plays: 0, wins: 0 };
                tally[name].plays++;
                if (won) tally[name].wins++;
            });
        });

        // Win rate block
        const rateEl = document.getElementById('summary-winrate');
        const recordEl = document.getElementById('summary-record');
        if (rateEl) rateEl.textContent = decided ? Math.round((wins / decided) * 100) + '%' : '—';
        if (recordEl) {
            const parts = [];
            if (decided) parts.push(`${wins}W – ${decided - wins}L`);
            if (turnsCount) parts.push(`avg ${Math.round(turnsSum / turnsCount)} turns`);
            if (otks) parts.push(`${otks} OTK${otks === 1 ? '' : 's'}`);
            recordEl.textContent = parts.join(' · ');
        }

        // Most played block (top 3)
        const listEl = document.getElementById('summary-archetypes');
        if (listEl) {
            const top = Object.entries(tally)
                .sort((a, b) => b[1].plays - a[1].plays)
                .slice(0, 3);
            listEl.innerHTML = top.length
                ? top.map(([name, t]) => {
                    const icon = archetypeIcon(name);
                    const rate = t.plays ? Math.round((t.wins / t.plays) * 100) : 0;
                    return `
                        <div class="summary-arch-row">
                            <span class="summary-arch-icon">${icon || '<i class="fas fa-layer-group" style="font-size:0.7rem;color:#6b7280;"></i>'}</span>
                            ${arcLink(name)}
                            <span class="summary-arch-meta">${t.plays} replay${t.plays === 1 ? '' : 's'} · ${rate}% wins</span>
                        </div>`;
                }).join('')
                : '<div class="summary-sub">No archetype data in your replays yet.</div>';
        }

        card.style.display = '';
    }

    function renderLoginGate() {
        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = 'Sign in to view your profile';

        const since = document.getElementById('profile-since');
        if (since) since.textContent = 'Connect your account to get started';

        // Logged out: no sidebar nav, just banner + gate stacked
        const nav = document.getElementById('account-nav');
        if (nav) nav.style.display = 'none';
        const replaysPanel = document.getElementById('panel-replays');
        if (replaysPanel) replaysPanel.style.display = '';

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

    // Win/loss chip lives in the card header line, next to the date
    function buildResultChip(m) {
        if (!m.winner) return '';
        const isWin = m.winner.player === 0;
        const turns = m.winner.turnsToWin ? ` · ${m.winner.turnsToWin}T` : '';
        const otk = m.winner.isOTK ? ' · OTK' : '';
        const cls = isWin ? 'badge-win' : 'badge-loss';
        return `<span class="replay-badge ${cls}">${isWin ? 'WIN' : 'LOSS'}${turns}${otk}</span>`;
    }

    // Meta strip is tags-only now — cards without tags stay two rows tall
    function buildMetaStrip(m) {
        if (!Array.isArray(m.tags) || !m.tags.length) return '';
        const unique = [...new Set(m.tags)];
        const items = unique.slice(0, 2).map(tag => `<span class="replay-badge badge-tag">${tag}</span>`);
        if (unique.length > 2) {
            const rest = unique.slice(2).join(', ').replace(/"/g, '&quot;');
            items.push(`<span class="replay-badge badge-more" title="${rest}">+${unique.length - 2}</span>`);
        }
        return `<div class="replay-meta-strip">${items.join('')}</div>`;
    }

    function buildComboSection(replay, combo, hasJson) {
        if (!hasJson) return '';
        if (!combo) {
            const arc = (replay.metadata?.archetype || '').replace(/"/g, '&quot;');
            return `<button class="btn-combo-submit"
                        data-id="${replay.replayid}"
                        data-archetype="${arc}"
                        onclick="openComboModal(this)"
                        title="Share this replay as a community combo guide on the archetype page"
                        style="display:inline-flex;align-items:center;gap:0.4rem;
                               background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);
                               color:#f59e0b;font-size:0.78rem;font-weight:600;
                               padding:0.35rem 0.75rem;border-radius:0.5rem;cursor:pointer;font-family:inherit;">
                        <i class="fas fa-star" style="font-size:0.65rem;"></i> Submit as Combo Guide
                    </button>`;
        }
        const score = Array.isArray(combo.combovotes)
            ? combo.combovotes.reduce((s, v) => s + v.value, 0) : 0;
        const scoreStr = score > 0 ? `▲ ${score}` : score < 0 ? `▼ ${Math.abs(score)}` : '· 0';
        if (combo.status === 'pending') {
            return `<span style="display:inline-flex;align-items:center;gap:0.35rem;
                                 background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);
                                 color:#f59e0b;font-size:0.75rem;font-weight:600;
                                 padding:0.3rem 0.65rem;border-radius:0.5rem;"
                         title="Awaiting moderator approval">
                        <i class="fas fa-clock" style="font-size:0.65rem;"></i> Pending review
                    </span>`;
        }
        if (combo.status === 'approved') {
            const arc = replay.metadata?.archetype;
            const arcText = arc ? ` on the ${arc} archetype page` : '';
            const voteLabel = score === 0 ? 'No votes yet' : score > 0 ? `+${score} votes` : `${score} votes`;
            return `<span style="display:inline-flex;align-items:center;gap:0.35rem;
                                 background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);
                                 color:#4ade80;font-size:0.75rem;font-weight:600;
                                 padding:0.3rem 0.65rem;border-radius:0.5rem;cursor:help;"
                         title="Published as a combo guide${arcText}. ${voteLabel}.">
                        <i class="fas fa-check-circle" style="font-size:0.65rem;"></i> Combo guide ${scoreStr}
                    </span>`;
        }
        if (combo.status === 'rejected') {
            const rejectNote = (combo.modnotes || 'No reason was provided by the moderator.').replace(/"/g, '&quot;');
            return `<span style="display:inline-flex;align-items:center;gap:0.35rem;
                                 background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
                                 color:#f87171;font-size:0.75rem;font-weight:600;
                                 padding:0.3rem 0.65rem;border-radius:0.5rem;cursor:help;"
                         title="Rejected: ${rejectNote}">
                        <i class="fas fa-times-circle" style="font-size:0.65rem;"></i> Rejected
                        <i class="fas fa-info-circle" style="font-size:0.6rem;opacity:0.7;"></i>
                    </span>`;
        }
        return '';
    }

    function replayCard(replay, combo) {
        const m = replay.metadata || {};
        const names = playerNames(replay);
        const date = formatDate(replay.createdon);
        const hasJson = !!replay.gcsjsonpath;
        const hasRaw  = !!replay.gcsrawpath;

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
                    <div class="replay-side">
                        ${buildResultChip(m)}
                        <span class="replay-date">${date}</span>
                    </div>
                </div>
                ${metaStrip}
                <div class="replay-card-footer">
                    <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                    ${hasJson
                        ? `<button class="btn-reanalyze" data-path="${replay.gcsjsonpath}" onclick="reAnalyze(this)">
                               <i class="fas fa-chart-line"></i> Re-analyze
                           </button>`
                        : `<span style="color:var(--text-muted);font-size:0.8rem;">Analysis not stored</span>`}
                    ${hasRaw
                        ? `<button class="btn-pdf" data-path="${replay.gcsrawpath}" onclick="createPdf(this)">
                               <i class="fas fa-file-pdf"></i> Create PDF
                           </button>`
                        : ''}
                    ${buildComboSection(replay, combo, hasJson)}
                    </div>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <select class="vis-select" data-id="${replay.replayid}"
                                onchange="updateVisibility(this)"
                                title="Who can see this replay"
                                style="font-family:inherit;">
                            <option value="private" ${replay.visibility === 'private' ? 'selected' : ''}>Private</option>
                            <option value="public" ${replay.visibility === 'public' ? 'selected' : ''}>Public</option>
                        </select>
                        <button class="btn-delete" data-id="${replay.replayid}" onclick="deleteReplay(this)"
                                title="Delete replay">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function renderList(container, replays, comboMap) {
        if (!replays || replays.length === 0) {
            renderEmpty(container);
            return;
        }
        const header = document.getElementById('list-header');
        const count = document.getElementById('replay-count');
        if (header) header.style.display = '';
        if (count) count.textContent = replays.length === 1 ? '1 replay' : `${replays.length} replays`;

        const hasEligible = replays.some(r => r.gcsjsonpath && !comboMap?.[r.replayid]);
        const tip = hasEligible ? `
            <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.18);
                        border-radius:0.75rem;padding:0.7rem 1rem;margin-bottom:1rem;
                        font-size:0.8rem;color:#a3a3a3;display:flex;align-items:flex-start;gap:0.6rem;">
                <i class="fas fa-lightbulb" style="color:#f59e0b;margin-top:0.1rem;flex-shrink:0;font-size:0.8rem;"></i>
                <span>Replays with a full analysis can be shared as <strong style="color:#f5f5f5;">combo guides</strong> on the archetype page — look for the <strong style="color:#f59e0b;">Submit as Combo Guide</strong> button on each card. The community can then vote on and learn from your line.</span>
            </div>` : '';

        container.innerHTML = tip + replays.map(r => replayCard(r, comboMap?.[r.replayid])).join('');
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

    const PDF_API = 'https://yrp-10714964039.europe-west1.run.app/yrpx-to-pdf';

    window.createPdf = async function (btn) {
        const path = btn.dataset.path;
        if (!path) return;
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…';
        try {
            const rawRes = await fetch(GCS_BASE + path);
            if (!rawRes.ok) throw new Error(`Could not load replay (HTTP ${rawRes.status})`);
            const rawBlob = await rawRes.blob();

            const pdfRes = await fetch(PDF_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: rawBlob
            });
            if (!pdfRes.ok) {
                const msg = await pdfRes.text().catch(() => 'Conversion failed');
                throw new Error(msg);
            }
            const pdfBlob = await pdfRes.blob();
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = path.split('/').pop().replace(/\.[^/.]+$/, '') + '.pdf';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('PDF generation failed: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
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
    // Combo guide modal
    // ------------------------------------------------------------------

    let archetypeList = null;

    function injectModal() {
        if (document.getElementById('combo-modal')) return;
        const el = document.createElement('div');
        el.id = 'combo-modal';
        el.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);align-items:center;justify-content:center;';
        el.innerHTML = `
            <div style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.12);border-radius:1rem;
                        padding:1.75rem;width:min(440px,90vw);box-shadow:0 20px 60px rgba(0,0,0,0.6);">
                <h3 style="margin:0 0 0.5rem;font-size:1.05rem;font-weight:700;color:#f5f5f5;">
                    <i class="fas fa-star" style="color:#f59e0b;margin-right:0.5rem;"></i>Submit Combo Guide
                </h3>
                <p style="margin:0 0 1.1rem;font-size:0.82rem;color:#a3a3a3;line-height:1.55;">
                    Combo guides appear on the archetype page where other players can study the line, vote on it, and use it as a learning reference. A moderator reviews each submission before it goes live.
                </p>
                <label style="display:block;font-size:0.8rem;color:#a3a3a3;margin-bottom:0.3rem;">Title</label>
                <input id="combo-modal-title" type="text" maxlength="100"
                       style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.06);
                              border:1px solid rgba(255,255,255,0.15);border-radius:0.5rem;
                              color:#f5f5f5;font-size:0.88rem;padding:0.55rem 0.75rem;
                              font-family:inherit;margin-bottom:0.9rem;"
                       placeholder="e.g. Dark Magician Full Combo – 4 cards">
                <label style="display:block;font-size:0.8rem;color:#a3a3a3;margin-bottom:0.3rem;">
                    Description <span style="opacity:0.45;font-size:0.75rem;">(optional)</span>
                </label>
                <textarea id="combo-modal-description" maxlength="500" rows="4"
                          placeholder="e.g. Requires 2 starters in hand. Goes first only. End board: [list end board here]. Key combo pieces: …"
                          style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.06);
                                 border:1px solid rgba(255,255,255,0.15);border-radius:0.5rem;
                                 color:#f5f5f5;font-size:0.88rem;padding:0.55rem 0.75rem;
                                 font-family:inherit;resize:vertical;margin-bottom:0.9rem;"></textarea>
                <label style="display:block;font-size:0.8rem;color:#a3a3a3;margin-bottom:0.3rem;">Archetype</label>
                <div style="position:relative;margin-bottom:1.25rem;">
                    <input id="combo-modal-archetype-search" type="text" autocomplete="off"
                           placeholder="Search archetypes…"
                           style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.06);
                                  border:1px solid rgba(255,255,255,0.15);border-radius:0.5rem;
                                  color:#f5f5f5;font-size:0.88rem;padding:0.55rem 0.75rem;
                                  font-family:inherit;">
                    <input id="combo-modal-archetype" type="hidden" value="">
                    <div id="combo-modal-suggestions"
                         style="display:none;position:absolute;top:100%;left:0;right:0;z-index:100;
                                background:#1e1e1e;border:1px solid rgba(255,255,255,0.15);
                                border-top:none;border-radius:0 0 0.5rem 0.5rem;
                                max-height:200px;overflow-y:auto;"></div>
                </div>
                <p style="font-size:0.75rem;color:#737373;margin:0 0 1.25rem;">
                    <i class="fas fa-info-circle" style="margin-right:0.3rem;"></i>
                    Once approved, this replay will be visible on the archetype page as a community combo guide. You can track the review status from this page.
                </p>
                <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                    <button onclick="closeComboModal()"
                            style="background:none;border:1px solid rgba(255,255,255,0.15);color:#a3a3a3;
                                   padding:0.5rem 1rem;border-radius:0.6rem;cursor:pointer;font-family:inherit;font-size:0.85rem;">
                        Cancel
                    </button>
                    <button id="combo-modal-submit" onclick="submitComboGuide()"
                            style="background:linear-gradient(to right,#f59e0b,#d97706);color:#000;
                                   font-weight:700;padding:0.5rem 1.25rem;border-radius:0.6rem;
                                   border:none;cursor:pointer;font-family:inherit;font-size:0.85rem;">
                        Submit for review
                    </button>
                </div>
            </div>`;
        document.body.appendChild(el);
        el.addEventListener('click', e => { if (e.target === el) closeComboModal(); });
    }

    window.openComboModal = async function (btn) {
        const modal = document.getElementById('combo-modal');
        if (!modal) return;
        modal._replayId = btn.dataset.id;
        const titleInput = document.getElementById('combo-modal-title');
        if (titleInput) titleInput.value = btn.dataset.archetype
            ? `${btn.dataset.archetype} Combo Guide`
            : 'Combo Guide';
        modal.style.display = 'flex';

        if (!archetypeList) {
            const client = window.Auth._getClient();
            const { data } = await client.from('archetypes').select('archetypeid, archetypename').order('archetypename');
            const all = data || [];
            // Only offer archetypes that have a page on the site
            const withPages = typeof archetypes !== 'undefined'
                ? new Set(archetypes.map(a => a.name.toLowerCase()))
                : null;
            archetypeList = withPages
                ? all.filter(a => withPages.has(a.archetypename.toLowerCase()))
                : all;
        }

        // Pre-fill search if archetype is known
        const preselect = (btn.dataset.archetype || '').toLowerCase();
        const searchInput = document.getElementById('combo-modal-archetype-search');
        const hiddenInput = document.getElementById('combo-modal-archetype');
        const suggestions = document.getElementById('combo-modal-suggestions');
        if (searchInput && hiddenInput) {
            const match = archetypeList.find(a => a.archetypename.toLowerCase() === preselect);
            searchInput.value = match ? match.archetypename : '';
            hiddenInput.value = match ? match.archetypeid : '';

            // Wire up autocomplete (only once)
            if (!searchInput._wired) {
                searchInput._wired = true;
                searchInput.addEventListener('input', () => {
                    const q = searchInput.value.toLowerCase();
                    hiddenInput.value = '';
                    if (!q) { suggestions.style.display = 'none'; return; }
                    const hits = archetypeList.filter(a => a.archetypename.toLowerCase().includes(q)).slice(0, 20);
                    if (!hits.length) { suggestions.style.display = 'none'; return; }
                    suggestions.innerHTML = hits.map(a =>
                        `<div data-id="${a.archetypeid}" data-name="${a.archetypename.replace(/"/g, '&quot;')}"
                              style="padding:0.5rem 0.75rem;font-size:0.85rem;color:#f5f5f5;cursor:pointer;"
                              onmouseover="this.style.background='rgba(255,255,255,0.08)'"
                              onmouseout="this.style.background=''"
                              onclick="document.getElementById('combo-modal-archetype').value=this.dataset.id;
                                       document.getElementById('combo-modal-archetype-search').value=this.dataset.name;
                                       document.getElementById('combo-modal-suggestions').style.display='none';">
                             ${a.archetypename}
                         </div>`
                    ).join('');
                    suggestions.style.display = '';
                });
                searchInput.addEventListener('blur', () => {
                    setTimeout(() => { suggestions.style.display = 'none'; }, 150);
                });
            }
        }
    };

    window.closeComboModal = function () {
        const modal = document.getElementById('combo-modal');
        if (modal) modal.style.display = 'none';
    };

    window.submitComboGuide = async function () {
        const modal = document.getElementById('combo-modal');
        const replayId = modal?._replayId;
        const title = document.getElementById('combo-modal-title')?.value?.trim();
        const archetypeId = document.getElementById('combo-modal-archetype')?.value;
        const description = document.getElementById('combo-modal-description')?.value?.trim() || null;
        if (!replayId || !title || !archetypeId) {
            alert('Please fill in all fields.');
            return;
        }
        const submitBtn = document.getElementById('combo-modal-submit');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }
        try {
            const client = window.Auth._getClient();
            const session = await window.Auth.getSession();
            const { error } = await client.from('combos').insert({
                userid: session.user.id,
                replayid: replayId,
                archetypeid: parseInt(archetypeId, 10),
                title,
                description,
                status: 'pending',
                steps: [],
                startinghand: [],
                endboard: {}
            });
            if (error) throw error;

            // Fetch the newly created combo to get its comboid
            const { data: combo } = await client
                .from('combos')
                .select('replayid, comboid, status, modnotes, combovotes(value)')
                .eq('replayid', replayId)
                .single();

            closeComboModal();

            if (combo) {
                combosByReplayId[replayId] = combo;
                const card = document.querySelector(`.replay-card[data-id="${replayId}"]`);
                if (card) {
                    const replay = replayCache.find(r => r.replayid === replayId);
                    if (replay) card.outerHTML = replayCard(replay, combo);
                }

                // Fire-and-forget: generate DuelSimulator combo JSON in the background
                const replay = replayCache.find(r => r.replayid === replayId);
                if (replay?.gcsrawpath && combo.comboid) {
                    const token = await window.Auth.getToken?.();
                    if (token) {
                        fetch('https://yrp-10714964039.europe-west1.run.app/generate-combo-json', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ rawpath: replay.gcsrawpath, comboid: combo.comboid }),
                        }).catch(err => console.warn('[submitComboGuide] combo JSON generation failed:', err));
                    }
                }
            }
        } catch (e) {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit for review'; }
            alert('Could not submit: ' + e.message);
        }
    };

    // ------------------------------------------------------------------
    // Boot
    // ------------------------------------------------------------------

    // ------------------------------------------------------------------
    // Profile Settings (display name, favorite archetype, avatar toggle)
    // ------------------------------------------------------------------

    let _settingsFavorite = null; // { archetypeid, archetypename, iconsvg } or null

    let _oauthAvatar = null; // OAuth avatar URL, for the chip preview fallback

    function _setFavoriteSelection(fav) {
        _settingsFavorite = fav;
        const row = document.getElementById('setting-fav-selected');
        const iconEl = document.getElementById('setting-fav-icon');
        const nameEl = document.getElementById('setting-fav-name');
        const avatarToggle = document.getElementById('setting-archetype-avatar');
        if (!row) return;
        if (fav) {
            iconEl.innerHTML = fav.iconsvg || '';
            nameEl.textContent = fav.archetypename;
            row.style.display = '';
            if (avatarToggle) avatarToggle.disabled = false;
        } else {
            row.style.display = 'none';
            if (avatarToggle) { avatarToggle.checked = false; avatarToggle.disabled = true; }
        }
        updateChipPreview();
    }

    // Live preview of the header chip, driven by the current form state
    function updateChipPreview() {
        const preview = document.getElementById('chip-preview');
        if (!preview) return;
        const name = document.getElementById('setting-displayname')?.value.trim() || 'Duelist';
        const useArchAvatar = document.getElementById('setting-archetype-avatar')?.checked;
        let avatarHtml;
        if (useArchAvatar && _settingsFavorite?.iconsvg) {
            avatarHtml = `<span class="chip-avatar">${_settingsFavorite.iconsvg}</span>`;
        } else if (_oauthAvatar) {
            avatarHtml = `<span class="chip-avatar"><img src="${window.escapeHtml(_oauthAvatar)}" alt=""></span>`;
        } else {
            avatarHtml = `<span class="chip-avatar"><i class="fas fa-user-circle" style="color:#a3a3a3;"></i></span>`;
        }
        preview.innerHTML = `${avatarHtml}<span>${window.escapeHtml(name)}</span>`;
    }

    function renderAccountInfo(session, profile) {
        const card = document.getElementById('account-info-card');
        if (!card) return;
        card.style.display = '';

        const provider = session.user.app_metadata?.provider
            || session.user.identities?.[0]?.provider || null;
        const providerEl = document.getElementById('account-provider');
        if (providerEl && provider) {
            const isDiscord = provider === 'discord';
            providerEl.innerHTML = `<span class="provider-chip ${isDiscord ? 'provider-discord' : 'provider-google'}">
                <i class="${isDiscord ? 'fab fa-discord' : 'fab fa-google'}"></i>${isDiscord ? 'Discord' : 'Google'}</span>`;
        }

        const emailEl = document.getElementById('account-email');
        if (emailEl) emailEl.textContent = session.user.email || '—';

        const sinceEl = document.getElementById('account-since');
        if (sinceEl) sinceEl.textContent = session.user.created_at ? formatDateShort(session.user.created_at) : '—';

        if (profile?.role === 'moderator' || profile?.role === 'admin') {
            const row = document.getElementById('account-role-row');
            const roleEl = document.getElementById('account-role');
            if (row && roleEl) {
                roleEl.innerHTML = `<span class="role-chip">${window.escapeHtml(profile.role)}</span>`;
                row.style.display = '';
            }
        }

        const ncEl = document.getElementById('account-namechange');
        if (ncEl) {
            if (profile?.namechangedon) {
                const nextAllowed = new Date(new Date(profile.namechangedon).getTime() + 7 * 24 * 3600 * 1000);
                ncEl.textContent = nextAllowed > new Date()
                    ? `Available ${nextAllowed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                    : 'Available now';
            } else {
                ncEl.textContent = 'Available now';
            }
        }
    }

    function _setSettingsStatus(msg, ok) {
        const el = document.getElementById('setting-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'settings-status ' + (ok ? 'ok' : 'err');
        if (ok) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
    }

    async function initProfileSettings() {
        const card = document.getElementById('settings-card');
        if (!card) return;
        card.style.display = '';

        const session = await window.Auth.getSession();
        _oauthAvatar = session?.user?.user_metadata?.avatar_url
            || session?.user?.user_metadata?.picture || null;

        // Populate current values
        const profile = await window.Auth.getProfile().catch(() => null);
        if (session) renderAccountInfo(session, profile);
        const nameInput = document.getElementById('setting-displayname');
        const counter = document.getElementById('setting-name-counter');
        if (profile) {
            nameInput.value = profile.displayname || '';
            if (profile.favorite) {
                _setFavoriteSelection({
                    archetypeid: profile.favoritearchetypeid,
                    archetypename: profile.favorite.archetypename,
                    iconsvg: profile.favorite.iconsvg,
                });
            } else {
                _setFavoriteSelection(null);
            }
            const avatarToggle = document.getElementById('setting-archetype-avatar');
            avatarToggle.checked = !!profile.usearchetypeavatar;
            avatarToggle.disabled = !profile.favorite;
            const hideBadge = document.getElementById('setting-hide-badge');
            if (hideBadge) hideBadge.checked = !!profile.hidefavbadge;
        }

        const updateCounter = () => { counter.textContent = `${nameInput.value.length} / 24`; };
        nameInput.addEventListener('input', () => { updateCounter(); updateChipPreview(); });
        document.getElementById('setting-archetype-avatar')?.addEventListener('change', updateChipPreview);
        updateCounter();
        updateChipPreview();

        // Favorite archetype search (curated archetypes only — same rule as
        // synergy links: iconsvg is not null)
        const searchInput = document.getElementById('setting-favorite-search');
        const resultsEl = document.getElementById('setting-fav-results');
        let searchTimer = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(async () => {
                const q = searchInput.value.trim();
                if (q.length < 2) { resultsEl.innerHTML = ''; return; }
                const client = window.Auth._getClient();
                const { data } = await client
                    .from('archetypes')
                    .select('archetypeid, archetypename, iconsvg')
                    .ilike('archetypename', `%${q}%`)
                    .not('iconsvg', 'is', null)
                    .limit(6);
                resultsEl.innerHTML = (data || []).map((a, i) => `
                    <div class="settings-fav-result" data-idx="${i}">
                        <span class="settings-fav-result-icon">${a.iconsvg || ''}</span>
                        <span>${window.escapeHtml(a.archetypename)}</span>
                    </div>`).join('');
                resultsEl.querySelectorAll('.settings-fav-result').forEach(el => {
                    el.addEventListener('click', () => {
                        _setFavoriteSelection(data[parseInt(el.dataset.idx, 10)]);
                        resultsEl.innerHTML = '';
                        searchInput.value = '';
                    });
                });
            }, 250);
        });

        document.getElementById('setting-fav-clear').addEventListener('click', () => _setFavoriteSelection(null));

        // Save
        const saveBtn = document.getElementById('btn-save-settings');
        saveBtn.addEventListener('click', async () => {
            const session = await window.Auth.getSession();
            if (!session) return;
            const newName = nameInput.value.trim();
            if (newName.length < 3 || newName.length > 24) {
                _setSettingsStatus('Display name must be between 3 and 24 characters.', false);
                return;
            }
            saveBtn.disabled = true;
            const client = window.Auth._getClient();
            const { error } = await client
                .from('profiles')
                .update({
                    displayname: newName,
                    favoritearchetypeid: _settingsFavorite?.archetypeid ?? null,
                    usearchetypeavatar: document.getElementById('setting-archetype-avatar').checked,
                    hidefavbadge: document.getElementById('setting-hide-badge')?.checked ?? false,
                })
                .eq('userid', session.user.id);
            saveBtn.disabled = false;

            if (error) {
                // DB trigger messages (rate limit, length) are user-friendly — show verbatim
                _setSettingsStatus(error.message || 'Could not save right now.', false);
                return;
            }
            _setSettingsStatus('Saved!', true);
            // Refresh the cached profile, the header chip, and the banner
            await window.Auth.refreshProfile();
            renderProfile(session);
        });
    }

    // ------------------------------------------------------------------
    // Settings extras: bulk replay privacy + danger zone.
    // Wired after replayCache is loaded (needs the counts / ids).
    // ------------------------------------------------------------------

    function _refreshPrivacySummary() {
        const summaryEl = document.getElementById('privacy-summary');
        const countEl = document.getElementById('danger-count');
        const pub = replayCache.filter(r => r.visibility === 'public').length;
        if (summaryEl) summaryEl.textContent = `Your replays: ${pub} public · ${replayCache.length - pub} private`;
        if (countEl) countEl.textContent = `all ${replayCache.length}`;
    }

    async function _bulkSetVisibility(value, statusEl) {
        const ids = replayCache.map(r => r.replayid);
        if (!ids.length) { statusEl.textContent = 'No replays to update.'; statusEl.className = 'settings-status err'; return; }
        if (!confirm(`Make all ${ids.length} replays ${value}?`)) return;
        try {
            const client = window.Auth._getClient();
            const { error } = await client.from('replays').update({ visibility: value }).in('replayid', ids);
            if (error) throw error;
            replayCache.forEach(r => { r.visibility = value; });
            renderStats(replayCache);
            _refreshPrivacySummary();
            const list = document.getElementById('replay-list');
            if (list) renderList(list, replayCache, combosByReplayId);
            statusEl.textContent = `All replays are now ${value}.`;
            statusEl.className = 'settings-status ok';
        } catch (e) {
            statusEl.textContent = 'Failed: ' + e.message;
            statusEl.className = 'settings-status err';
        }
    }

    function initSettingsExtras() {
        const privacyCard = document.getElementById('replay-privacy-card');
        const dangerCard = document.getElementById('danger-zone-card');
        if (privacyCard) privacyCard.style.display = '';
        if (dangerCard) dangerCard.style.display = '';
        _refreshPrivacySummary();

        const privacyStatus = document.getElementById('privacy-status');
        document.getElementById('btn-all-public')?.addEventListener('click', () => _bulkSetVisibility('public', privacyStatus));
        document.getElementById('btn-all-private')?.addEventListener('click', () => _bulkSetVisibility('private', privacyStatus));

        // Danger zone: type-to-confirm bulk delete
        const confirmInput = document.getElementById('danger-confirm');
        const deleteBtn = document.getElementById('btn-delete-all');
        const dangerStatus = document.getElementById('danger-status');
        if (confirmInput && deleteBtn) {
            confirmInput.addEventListener('input', () => {
                deleteBtn.disabled = confirmInput.value.trim() !== 'DELETE';
            });
            deleteBtn.addEventListener('click', async () => {
                const ids = replayCache.map(r => r.replayid);
                if (!ids.length) { dangerStatus.textContent = 'No replays to delete.'; dangerStatus.className = 'settings-status err'; return; }
                if (!confirm(`Permanently delete all ${ids.length} replays? This cannot be undone.`)) return;
                deleteBtn.disabled = true;
                try {
                    const client = window.Auth._getClient();
                    const { error } = await client.from('replays').delete().in('replayid', ids);
                    if (error) throw error;
                    replayCache = [];
                    combosByReplayId = {};
                    renderStats(replayCache);
                    renderDuelistSummary(replayCache);
                    _refreshPrivacySummary();
                    const list = document.getElementById('replay-list');
                    if (list) renderEmpty(list);
                    confirmInput.value = '';
                    dangerStatus.textContent = 'All replays deleted.';
                    dangerStatus.className = 'settings-status ok';
                } catch (e) {
                    deleteBtn.disabled = false;
                    dangerStatus.textContent = 'Failed: ' + e.message;
                    dangerStatus.className = 'settings-status err';
                }
            });
        }
    }

    // ------------------------------------------------------------------
    // Synergy Activity panel — the user's own pairings, explanations, votes.
    // Loaded lazily on first open; RLS scopes everything to the signed-in
    // user (own rows visible regardless of moderation status).
    // ------------------------------------------------------------------

    let _synergyActivityLoaded = false;

    async function loadSynergyActivity() {
        if (_synergyActivityLoaded) return;
        _synergyActivityLoaded = true;

        const session = await window.Auth.getSession();
        if (!session) return;
        const uid = session.user.id;
        const client = window.Auth._getClient();
        const esc = window.escapeHtml;

        const A1 = 'a1:archetypes!archetypelinks_archetypeid1_fkey(archetypename, iconsvg)';
        const A2 = 'a2:archetypes!archetypelinks_archetypeid2_fkey(archetypename, iconsvg)';

        // archetypes-data.js is already loaded on this page — map archetype
        // names to their analysis-page paths for clickable links.
        // DB names drift from page names ("Swamp" vs "of the Swamp",
        // "Snake-Eye" vs "Snake-Eyes"), so match in tiers: exact → normalized
        // (letters/digits only) → unique prefix/suffix containment. A link is
        // only produced when the match is unambiguous.
        const pageEntries = [];
        if (typeof archetypes !== 'undefined' && Array.isArray(archetypes)) {
            archetypes.forEach(a => {
                if (a.name && a.filepath) {
                    const lower = a.name.toLowerCase();
                    pageEntries.push({ lower, norm: lower.replace(/[^a-z0-9]/g, ''), filepath: a.filepath });
                }
            });
        }

        function findPage(name) {
            const lower = name.toLowerCase();
            let hit = pageEntries.find(p => p.lower === lower);
            if (hit) return hit.filepath;
            const norm = lower.replace(/[^a-z0-9]/g, '');
            if (norm.length < 3) return null;
            hit = pageEntries.find(p => p.norm === norm);
            if (hit) return hit.filepath;
            // Containment tier: guard against tiny norms producing false
            // positives (e.g. "Fairy Tail" must not match page "F.A." via "fa")
            const candidates = pageEntries.filter(p =>
                p.norm.startsWith(norm) || p.norm.endsWith(norm) ||
                (p.norm.length >= 5 && norm.startsWith(p.norm)));
            return candidates.length === 1 ? candidates[0].filepath : null;
        }

        function archHtml(side) {
            if (!side) return '<span>?</span>';
            const name = side.archetypename || '?';
            const icon = side.iconsvg ? `<span class="activity-arch-icon">${side.iconsvg}</span>` : '';
            const filepath = findPage(name);
            if (filepath) {
                return `<a class="activity-arch" href="../${esc(filepath)}" title="Open the ${esc(name)} page">${icon}${esc(name)}</a>`;
            }
            return `<span class="activity-arch">${icon}${esc(name)}</span>`;
        }

        const pairName = l => l ? `${archHtml(l.a1)} <span class="activity-pair-sep">↔</span> ${archHtml(l.a2)}` : 'Unknown pairing';
        const chip = s => `<span class="status-chip ${esc(s)}">${esc(s)}</span>`;
        const container = document.getElementById('activity-groups');
        if (!container) return;

        // ---- Fetch everything, then regroup by pairing (linkid) ----------
        let links = [], reasons = [], linkVotes = [], reasonVotes = [];
        try {
            [links, reasons, linkVotes, reasonVotes] = (await Promise.all([
                client.from('archetypelinks')
                    .select(`linkid, status, modnotes, createdon, ${A1}, ${A2}`)
                    .eq('submittedby', uid),
                client.from('archetypelinkreasons')
                    .select(`reasonid, linkid, body, status, modnotes, createdon,
                        archetypelinkreasonvotes(value),
                        archetypelinks!archetypelinkreasons_linkid_fkey(linkid, ${A1}, ${A2})`)
                    .eq('userid', uid),
                client.from('archetypelinkvotes')
                    .select(`linkid, value, createdon, archetypelinks!archetypelinkvotes_linkid_fkey(linkid, ${A1}, ${A2})`)
                    .eq('userid', uid),
                client.from('archetypelinkreasonvotes')
                    .select(`value, createdon,
                        archetypelinkreasons!archetypelinkreasonvotes_reasonid_fkey(body, linkid,
                            archetypelinks!archetypelinkreasons_linkid_fkey(linkid, ${A1}, ${A2}))`)
                    .eq('userid', uid),
            ])).map(r => r.data || []);
        } catch (e) {
            container.innerHTML = '<div class="activity-empty">Could not load your synergy activity.</div>';
            return;
        }

        // groups: linkid -> { pair, suggested, items[] }
        const groups = new Map();
        function group(linkid, pair) {
            if (!groups.has(linkid)) groups.set(linkid, { pair, suggested: null, items: [] });
            const g = groups.get(linkid);
            if (!g.pair && pair) g.pair = pair;
            return g;
        }

        links.forEach(l => { group(l.linkid, l).suggested = l; });
        reasons.forEach(r => {
            group(r.linkid, r.archetypelinks).items.push({
                type: 'reason', createdon: r.createdon,
                body: r.body, status: r.status, modnotes: r.modnotes,
                score: (r.archetypelinkreasonvotes || []).reduce((s, v) => s + v.value, 0),
            });
        });
        linkVotes.forEach(v => {
            group(v.linkid, v.archetypelinks).items.push({ type: 'linkvote', createdon: v.createdon, value: v.value });
        });
        reasonVotes.forEach(v => {
            const reason = v.archetypelinkreasons;
            if (!reason) return;
            group(reason.linkid, reason.archetypelinks).items.push({
                type: 'reasonvote', createdon: v.createdon, value: v.value, body: reason.body,
            });
        });

        if (groups.size === 0) {
            container.innerHTML = `<div class="activity-empty">
                No synergy activity yet — open any archetype page and hit the
                <strong>🔗 Pairs Well With</strong> button to vote or suggest a pairing.</div>`;
            return;
        }

        // ---- Render: newest activity first, pairing shown once per group ----
        const newest = g => Math.max(
            g.suggested ? Date.parse(g.suggested.createdon) : 0,
            ...g.items.map(i => Date.parse(i.createdon) || 0)
        );

        const voteGlyph = v => `<span class="subrow-glyph vote-dir ${v === 1 ? 'up' : 'down'}">${v === 1 ? '▲' : '▼'}</span>`;
        const clip = (s, n) => esc((s || '').slice(0, n)) + ((s || '').length > n ? '…' : '');

        container.innerHTML = [...groups.values()]
            .sort((a, b) => newest(b) - newest(a))
            .map(g => {
                const header = `
                    <div class="activity-group-header">
                        ${pairName(g.pair)}
                        ${g.suggested ? chip(g.suggested.status) : ''}
                        ${g.suggested ? `<span class="activity-group-meta">Suggested by you · ${formatDateShort(g.suggested.createdon)}</span>` : ''}
                    </div>
                    ${g.suggested?.status === 'rejected' && g.suggested.modnotes
                        ? `<div class="activity-group-notes">Mod notes: ${esc(g.suggested.modnotes)}</div>` : ''}`;

                const rows = g.items
                    .sort((a, b) => Date.parse(b.createdon) - Date.parse(a.createdon))
                    .map(item => {
                        if (item.type === 'reason') {
                            return `
                                <div class="activity-subrow">
                                    <span class="subrow-glyph glyph-reason">✎</span>
                                    <div class="subrow-content">"${esc(item.body)}"
                                        ${item.status === 'rejected' && item.modnotes ? `<div class="activity-group-notes">Mod notes: ${esc(item.modnotes)}</div>` : ''}
                                    </div>
                                    <div class="subrow-meta">${item.score >= 0 ? '+' : ''}${item.score} ${chip(item.status)}</div>
                                </div>`;
                        }
                        if (item.type === 'linkvote') {
                            return `
                                <div class="activity-subrow">
                                    ${voteGlyph(item.value)}
                                    <div class="subrow-content">You ${item.value === 1 ? 'upvoted' : 'downvoted'} this pairing</div>
                                    <div class="subrow-meta">${formatDateShort(item.createdon)}</div>
                                </div>`;
                        }
                        return `
                            <div class="activity-subrow">
                                ${voteGlyph(item.value)}
                                <div class="subrow-content">You ${item.value === 1 ? 'upvoted' : 'downvoted'} an explanation: "${clip(item.body, 60)}"</div>
                                <div class="subrow-meta">${formatDateShort(item.createdon)}</div>
                            </div>`;
                    }).join('');

                return `<div class="activity-group">${header}${rows}</div>`;
            }).join('');
    }

    // ------------------------------------------------------------------
    // Account sidebar navigation (Google-Account style panels)
    // ------------------------------------------------------------------

    function initAccountNav() {
        const nav = document.getElementById('account-nav');
        if (!nav) return;

        const panels = { home: 'panel-home', settings: 'panel-settings', replays: 'panel-replays', synergies: 'panel-synergies' };

        function show(name) {
            if (!panels[name]) name = 'home';
            Object.entries(panels).forEach(([key, id]) => {
                const el = document.getElementById(id);
                if (el) el.style.display = key === name ? '' : 'none';
            });
            nav.querySelectorAll('.account-nav-item[data-panel]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.panel === name);
            });
            if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
            if (name === 'synergies') loadSynergyActivity();
        }

        nav.querySelectorAll('.account-nav-item[data-panel]').forEach(btn => {
            btn.addEventListener('click', () => show(btn.dataset.panel));
        });
        window.addEventListener('hashchange', () => show(location.hash.slice(1) || 'home'));
        show(location.hash.slice(1) || 'home');

        // Admin item for moderators only
        window.Auth.isModerator().then(isMod => {
            if (isMod) {
                const adminItem = document.getElementById('account-nav-admin');
                if (adminItem) adminItem.style.display = '';
            }
        });

        const logoutItem = document.getElementById('account-nav-logout');
        if (logoutItem) logoutItem.addEventListener('click', () => window.Auth.signOut());
    }

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
        initProfileSettings();
        initAccountNav();

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

        injectModal();

        try {
            const client = window.Auth._getClient();
            // Explicit owner filter: RLS lets non-owners read public replays
            // (community combo cards need that), so a bare select would list
            // other users' replays here too.
            const { data, error } = await client
                .from('replays')
                .select('replayid, gcsjsonpath, gcsrawpath, metadata, visibility, createdon')
                .eq('userid', session.user.id)
                .order('createdon', { ascending: false });

            if (error) throw error;
            replayCache = data;

            // Fetch combo status for all loaded replays in one query
            if (replayCache.length) {
                const ids = replayCache.map(r => r.replayid);
                const { data: combos } = await client
                    .from('combos')
                    .select('replayid, comboid, status, modnotes, combovotes(value)')
                    .in('replayid', ids);
                combosByReplayId = {};
                if (combos) combos.forEach(c => { combosByReplayId[c.replayid] = c; });
            }

            renderStats(replayCache);
            renderDuelistSummary(replayCache);
            renderList(list, replayCache, combosByReplayId);
            initSettingsExtras();
        } catch (e) {
            renderError(list, 'Failed to load replays: ' + e.message);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
