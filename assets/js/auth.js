/**
 * Auth module — Supabase Discord OAuth
 * Requires: @supabase/supabase-js CDN + supabase-config.js loaded first.
 * Exposes window.Auth and auto-renders login/user UI into [data-auth-bar] elements.
 */
(function () {
    'use strict';

    let _client = null;
    let _profileCache = null; // one profiles fetch per page load, cleared on auth change

    // auth.js runs on every page; text-utils.js doesn't — never depend on it.
    function _esc(str) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function _getClient() {
        if (!_client && window.supabase && window.SUPABASE_CONFIG) {
            _client = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
        }
        return _client;
    }

    // Init client eagerly so PKCE code exchange starts immediately on redirect
    _getClient();

    window.Auth = {
        _getClient,

        async getSession() {
            const c = _getClient();
            if (!c) return null;
            const { data: { session } } = await c.auth.getSession();
            return session;
        },

        async getToken() {
            const s = await this.getSession();
            return s?.access_token ?? null;
        },

        async getUser() {
            const s = await this.getSession();
            return s?.user ?? null;
        },

        /**
         * Cached profiles row for the signed-in user (displayname, role,
         * favorite archetype + its icon). One query per page load.
         */
        async getProfile() {
            const s = await this.getSession();
            if (!s) return null;
            if (_profileCache) return _profileCache;
            const c = _getClient();
            const { data } = await c
                .from('profiles')
                .select(`
                    displayname, role, favoritearchetypeid, usearchetypeavatar,
                    namechangedon, hidefavbadge,
                    favorite:archetypes!profiles_favoritearchetypeid_fkey ( archetypename, iconsvg )
                `)
                .eq('userid', s.user.id)
                .maybeSingle();
            _profileCache = data || null;
            return _profileCache;
        },

        /** Clear the cached profile and re-render auth bars (after settings save). */
        async refreshProfile() {
            _profileCache = null;
            const session = await this.getSession();
            document.querySelectorAll('[data-auth-bar]').forEach(el => renderBar(el, session));
            return this.getProfile();
        },

        async isModerator() {
            const p = await this.getProfile();
            return p?.role === 'moderator' || p?.role === 'admin';
        },

        async signInWithDiscord(redirectTo) {
            const c = _getClient();
            if (!c) return;
            const dest = redirectTo || (window.location.origin + window.location.pathname);
            return c.auth.signInWithOAuth({
                provider: 'discord',
                options: { redirectTo: dest }
            });
        },

        async signInWithGoogle(redirectTo) {
            const c = _getClient();
            if (!c) return;
            const dest = redirectTo || (window.location.origin + window.location.pathname);
            return c.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: dest }
            });
        },

        async signOut() {
            const c = _getClient();
            if (!c) return;
            await c.auth.signOut();
            location.reload();
        },

        onAuthStateChange(cb) {
            const c = _getClient();
            if (!c) return;
            return c.auth.onAuthStateChange(cb);
        }
    };

    // ------------------------------------------------------------------
    // UI rendering
    // ------------------------------------------------------------------

    function loginBtn() {
        return `
            <div style="display:inline-flex;gap:0.5rem;align-items:center;">
                <button
                    onclick="window.Auth.signInWithDiscord()"
                    style="display:inline-flex;align-items:center;gap:0.5rem;
                           background:linear-gradient(to right,#5865F2,#4752C4);
                           color:#fff;font-weight:700;font-size:0.82rem;
                           padding:0.5rem 1rem;border-radius:0.75rem;
                           border:1px solid rgba(255,255,255,0.2);cursor:pointer;
                           box-shadow:0 0 14px rgba(88,101,242,0.45);
                           font-family:inherit;transition:box-shadow 0.2s;"
                    onmouseover="this.style.boxShadow='0 0 22px rgba(88,101,242,0.75)'"
                    onmouseout="this.style.boxShadow='0 0 14px rgba(88,101,242,0.45)'">
                    <i class="fab fa-discord"></i> Discord
                </button>
                <button
                    onclick="window.Auth.signInWithGoogle()"
                    style="display:inline-flex;align-items:center;gap:0.5rem;
                           background:linear-gradient(to right,#4285F4,#2563EB);
                           color:#fff;font-weight:700;font-size:0.82rem;
                           padding:0.5rem 1rem;border-radius:0.75rem;
                           border:1px solid rgba(255,255,255,0.2);cursor:pointer;
                           box-shadow:0 0 14px rgba(66,133,244,0.45);
                           font-family:inherit;transition:box-shadow 0.2s;"
                    onmouseover="this.style.boxShadow='0 0 22px rgba(66,133,244,0.75)'"
                    onmouseout="this.style.boxShadow='0 0 14px rgba(66,133,244,0.45)'">
                    <svg width="14" height="14" viewBox="0 0 48 48" style="flex-shrink:0"><path fill="#fff" d="M43.6 20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/></svg>
                    Google
                </button>
            </div>`;
    }

    function userChip(name, avatar, avatarSvg, isIndex) {
        // #replays lands directly on the replay-list panel of the account page
        const myReplaysHref = (isIndex ? 'pages/My-Replays.html' : '../pages/My-Replays.html') + '#replays';
        let avatarHtml;
        if (avatarSvg) {
            // Favorite-archetype icon avatar (curated inline SVG from our own DB)
            avatarHtml = `<span class="auth-avatar-svg" style="display:inline-flex;width:26px;height:26px;border-radius:50%;
                                overflow:hidden;background:#111827;border:1px solid rgba(255,255,255,0.25);
                                align-items:center;justify-content:center;">${avatarSvg}</span>`;
        } else if (avatar) {
            avatarHtml = `<img src="${_esc(avatar)}" alt="" style="width:26px;height:26px;border-radius:50%;object-fit:cover;">`;
        } else {
            avatarHtml = `<i class="fas fa-user-circle" style="color:#a3a3a3;font-size:1.2rem;"></i>`;
        }
        return `
            <div style="display:inline-flex;align-items:center;gap:0.625rem;
                        background:rgba(23,23,23,0.88);
                        border:1px solid rgba(255,255,255,0.12);border-radius:0.75rem;
                        padding:0.4rem 0.875rem;backdrop-filter:blur(10px);">
                ${avatarHtml}
                <span style="color:#f5f5f5;font-size:0.82rem;font-weight:600;">${_esc(name)}</span>
                <a href="${myReplaysHref}"
                   style="color:#f59e0b;font-size:0.78rem;font-weight:600;text-decoration:none;"
                   onmouseover="this.style.opacity='0.75'"
                   onmouseout="this.style.opacity='1'">My Replays</a>
                <button onclick="window.Auth.signOut()"
                        style="color:#a3a3a3;font-size:0.75rem;background:none;border:none;
                               cursor:pointer;padding:0;font-family:inherit;"
                        onmouseover="this.style.color='#f5f5f5'"
                        onmouseout="this.style.color='#a3a3a3'">Logout</button>
            </div>`;
    }

    async function renderBar(el, session) {
        const isIndex = el.dataset.authIndex === 'true';
        const s = session !== undefined ? session : await window.Auth.getSession();
        if (s) {
            const m = s.user.user_metadata || {};
            // profiles.displayname is the canonical name everywhere on the
            // site (combo cards, comments, admin); OAuth metadata is only a
            // fallback for brand-new sessions whose profile row isn't loaded.
            const profile = await window.Auth.getProfile().catch(() => null);
            const name = profile?.displayname || m.full_name || m.name || m.user_name || 'Duelist';
            const avatar = m.avatar_url || m.picture || null;
            const avatarSvg = (profile?.usearchetypeavatar && profile?.favorite?.iconsvg) || null;
            el.innerHTML = userChip(name, avatar, avatarSvg, isIndex);
        } else {
            el.innerHTML = loginBtn();
        }
    }

    function renderAllBars(session) {
        document.querySelectorAll('[data-auth-bar]').forEach(el => renderBar(el, session));
    }

    // The archetype-icon SVGs carry their own width/height attributes —
    // force them to fill the avatar circle.
    const _avatarStyle = document.createElement('style');
    _avatarStyle.textContent = '.auth-avatar-svg svg{width:100%;height:100%;}';
    document.head.appendChild(_avatarStyle);

    // Register listener eagerly so PKCE SIGNED_IN fires before DOMContentLoaded
    const _earlyClient = _getClient();
    if (_earlyClient) {
        _earlyClient.auth.onAuthStateChange((_event, session) => {
            _profileCache = null; // session changed — cached profile is stale
            document.querySelectorAll('[data-auth-bar]').forEach(el => renderBar(el, session));
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderAllBars();
    });
})();
