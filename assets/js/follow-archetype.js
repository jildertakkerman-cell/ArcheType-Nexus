/**
 * follow-archetype.js — "Follow" button + tracking for archetype pages.
 *
 * On an archetype page it auto-detects which archetype the page is for
 * from <link rel="canonical"> (stripping the page-title suffix, e.g.
 * "Blue-Eyes Deck Analysis" -> "Blue-Eyes"), resolves that against the
 * archetypes table with the same tolerant match synergy-tags.js uses
 * (case-insensitive, retried without a leading "of the "), and renders a
 * floating Follow/Following toggle. No per-page wiring is required beyond
 * loading this script — unlike initSynergyTags(name), there's nothing to
 * call per page.
 *
 * On a page with no canonical link (e.g. My-Replays.html) the floating
 * button silently stays off; window.FollowArchetypes is still exposed for
 * the "Followed Archetypes" account panel.
 *
 * Data model: followedarchetypes (userid, archetypeid, createdat), one row
 * per follow, primary key (userid, archetypeid). See
 * scripts/sql/010_followed_archetypes.sql for schema/RLS.
 *
 * Requires: supabase-config.js, auth.js loaded first (any order relative to
 * this script — everything here runs from DOMContentLoaded or later, by
 * which point both have already executed).
 */

(function () {
    'use strict';

    function _client() {
        return window.Auth?._getClient?.() || null;
    }

    // Same tolerant lookup as synergy-tags.js: case-insensitive, and some
    // page names drop a leading "of the " that the DB row keeps.
    async function _lookupArchetype(name) {
        const client = _client();
        if (!client || !name) return null;

        async function lookup(n) {
            const { data } = await client
                .from('archetypes')
                .select('archetypeid, archetypename')
                .ilike('archetypename', n);
            if (!data || data.length === 0) return null;
            return data.find(r => r.archetypename === n) || data[0];
        }

        let row = await lookup(name);
        if (!row && /^of the /i.test(name)) {
            row = await lookup(name.replace(/^of the /i, ''));
        }
        return row;
    }

    function _deriveNameFromCanonical() {
        const link = document.querySelector('link[rel="canonical"]');
        if (!link || !link.href) return null;
        let pathname;
        try {
            pathname = new URL(link.href).pathname;
        } catch (_) {
            return null;
        }
        const file = decodeURIComponent(pathname.split('/').pop() || '');
        const base = file.replace(/\.html?$/i, '');
        const name = base
            .replace(/\s*(Deck Analy[sz]?is|Archetype Breakdown|Archetype Deep Dive)\s*$/i, '')
            .trim();
        return name || null;
    }

    // ------------------------------------------------------------------
    // Shared API — used by this page's own button and by the My Account
    // "Followed Archetypes" panel (my-replays.js).
    // ------------------------------------------------------------------
    window.FollowArchetypes = {
        async isFollowing(archetypeid) {
            const client = _client();
            const session = await window.Auth?.getSession?.();
            if (!client || !session) return false;
            const { data } = await client
                .from('followedarchetypes')
                .select('archetypeid')
                .eq('userid', session.user.id)
                .eq('archetypeid', archetypeid)
                .maybeSingle();
            return !!data;
        },

        async follow(archetypeid) {
            const client = _client();
            const session = await window.Auth?.getSession?.();
            if (!client || !session) throw new Error('Not signed in');
            const { error } = await client
                .from('followedarchetypes')
                .upsert({ userid: session.user.id, archetypeid });
            if (error) throw error;
        },

        async unfollow(archetypeid) {
            const client = _client();
            const session = await window.Auth?.getSession?.();
            if (!client || !session) throw new Error('Not signed in');
            const { error } = await client
                .from('followedarchetypes')
                .delete()
                .eq('userid', session.user.id)
                .eq('archetypeid', archetypeid);
            if (error) throw error;
        },

        /** Current user's follows, newest first: [{archetypeid, createdat, archetypename, iconsvg}]. */
        async listFollowed() {
            const client = _client();
            const session = await window.Auth?.getSession?.();
            if (!client || !session) return [];
            const { data } = await client
                .from('followedarchetypes')
                .select('archetypeid, createdat, archetypes(archetypename, iconsvg)')
                .eq('userid', session.user.id)
                .order('createdat', { ascending: false });
            return (data || []).map(row => ({
                archetypeid: row.archetypeid,
                createdat: row.createdat,
                archetypename: row.archetypes?.archetypename || null,
                iconsvg: row.archetypes?.iconsvg || null
            }));
        }
    };

    // ------------------------------------------------------------------
    // Floating Follow button — self-initializing on archetype pages only.
    // ------------------------------------------------------------------

    function _setState(btn, following) {
        btn.classList.toggle('is-following', following);
        btn.innerHTML = following
            ? '<i class="fas fa-star"></i><span>Following</span>'
            : '<i class="far fa-star"></i><span>Follow</span>';
        btn.title = following
            ? "Following — new support shows up in My Account"
            : 'Follow to get notified about new support';
    }

    async function _initFloatingButton() {
        const name = _deriveNameFromCanonical();
        if (!name) return;

        const row = await _lookupArchetype(name);
        if (!row) {
            console.warn(`[FollowArchetype] no archetypes row found for "${name}" — follow button disabled on this page.`);
            return;
        }
        const archetypeid = row.archetypeid;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'follow-archetype-btn';
        btn.className = 'follow-archetype-btn';
        btn.disabled = true;
        _setState(btn, false);
        document.body.appendChild(btn);

        let following = false;
        const session = await window.Auth?.getSession?.();
        if (session) {
            following = await window.FollowArchetypes.isFollowing(archetypeid);
            _setState(btn, following);
        }
        btn.disabled = false;

        btn.addEventListener('click', async () => {
            const s = await window.Auth?.getSession?.();
            if (!s) {
                // Not signed in — one click straight into sign-in, same as
                // the site's other Discord CTAs (Join Discord, etc.).
                window.Auth?.signInWithDiscord?.();
                return;
            }
            btn.disabled = true;
            try {
                if (following) {
                    await window.FollowArchetypes.unfollow(archetypeid);
                    following = false;
                } else {
                    await window.FollowArchetypes.follow(archetypeid);
                    following = true;
                }
                _setState(btn, following);
            } catch (e) {
                console.error('[FollowArchetype] toggle failed', e);
            } finally {
                btn.disabled = false;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', _initFloatingButton);
})();
