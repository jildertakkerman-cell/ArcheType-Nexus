-- ============================================================================
-- Drops the pagecorrections feature (008_page_corrections.sql), superseded
-- by pagesections (009) — full section rewrites replace the AI draft
-- directly, making the report-only "flag it for a moderator to hand-fix"
-- flow redundant. The frontend widget (assets/js/page-corrections.js) and
-- its usage on the archetype pages have already been removed.
--
-- Run by hand in the Supabase SQL editor, once.
--
-- CAUTION: this permanently deletes any rows already in pagecorrections. If
-- real reports were submitted while this was live, check the table in the
-- Supabase table editor before running this.
-- ============================================================================

-- CASCADE drops the table's own triggers, policies, and constraints with it.
-- Does NOT drop is_moderator() or force_pending_on_insert() — both are
-- shared with pagesections and the synergy-tags tables, still in use.
drop table if exists pagecorrections cascade;

-- check_correction_rate_limit() belongs to no table (functions aren't
-- dropped by CASCADE on the table that used it), so it needs its own drop.
drop function if exists check_correction_rate_limit();
