-- ============================================================================
-- 006: Replays select policy — stop signed-in users seeing each other's list.
--
-- Observed on the live site (2026-07-15): two unrelated accounts (distinct
-- userids) saw the same replay list on My-Replays. The page did a bare
-- select relying on RLS to scope rows, and the live select policy returns
-- other users' replays to any authenticated user. (Anon gets zero rows, so
-- the leak is signed-in-only; whether it exposed private replays or only
-- public ones depends on the old policy text — this migration closes both.)
--
-- New select rules, replacing ALL existing select policies on replays:
--   * owners read their own rows (any visibility);
--   * everyone signed in reads public rows — community combo cards on
--     archetype pages join replays for metadata and the watch button;
--   * moderators read everything — Admin.html reviews combos whose replays
--     may still be private.
--
-- Write policies are left untouched: the Cloud Run backend performs the
-- insert, and update/delete are owner actions. After applying, verify they
-- are owner-scoped:   select * from pg_policies where tablename = 'replays';
--
-- The companion client fix (my-replays.js) adds .eq('userid', ...) so the
-- page lists only the owner's replays even though public rows stay readable.
--
-- Applied to the live DB via the direct Postgres connection.
-- ============================================================================

-- Drop every existing SELECT policy on replays, whatever it is named.
do $$
declare
    pol record;
begin
    for pol in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = 'replays'
          and cmd = 'SELECT'
    loop
        execute format('drop policy %I on replays', pol.policyname);
    end loop;
end $$;

create policy replays_select on replays
    for select
    to authenticated
    using (
        userid = auth.uid()
        or visibility = 'public'
        or is_moderator()
    );
