/**
 * Auth module — Supabase Discord OAuth
 * Requires: @supabase/supabase-js CDN + supabase-config.js loaded first.
 * Exposes window.Auth and auto-renders login/user UI into [data-auth-bar] elements.
 */
(function () {
    'use strict';

    let _client = null;

    function _getClient() {
        if (!_client && window.supabase && window.SUPABASE_CONFIG) {
            _client = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
        }
        return _client;
    }

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

        async signInWithDiscord(redirectTo) {
            const c = _getClient();
            if (!c) return;
            // Determine correct path for My-Replays depending on caller location
            const dest = redirectTo || window.location.href;
            return c.auth.signInWithOAuth({
                provider: 'discord',
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
                <i class="fab fa-discord"></i> Login with Discord
            </button>`;
    }

    function userChip(name, avatar, isIndex) {
        const myReplaysHref = isIndex ? 'pages/My-Replays.html' : '../pages/My-Replays.html';
        return `
            <div style="display:inline-flex;align-items:center;gap:0.625rem;
                        background:rgba(23,23,23,0.88);
                        border:1px solid rgba(255,255,255,0.12);border-radius:0.75rem;
                        padding:0.4rem 0.875rem;backdrop-filter:blur(10px);">
                ${avatar
                    ? `<img src="${avatar}" alt="" style="width:26px;height:26px;border-radius:50%;object-fit:cover;">`
                    : `<i class="fab fa-discord" style="color:#5865F2;"></i>`}
                <span style="color:#f5f5f5;font-size:0.82rem;font-weight:600;">${name}</span>
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

    async function renderBar(el) {
        // data-auth-index="true" signals we are on index.html (paths differ)
        const isIndex = el.dataset.authIndex === 'true';
        const session = await window.Auth.getSession();
        if (session) {
            const m = session.user.user_metadata || {};
            const name = m.full_name || m.name || m.user_name || 'Duelist';
            const avatar = m.avatar_url || null;
            el.innerHTML = userChip(name, avatar, isIndex);
        } else {
            el.innerHTML = loginBtn();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-auth-bar]').forEach(renderBar);
    });
})();
