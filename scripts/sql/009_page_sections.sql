-- ============================================================================
-- Page sections: community-authored rewrites that REPLACE the static
-- AI-drafted content by default once approved — distinct from
-- `pagecorrections` (008), which only reports an error for a moderator to
-- hand-fix in the HTML. Here, approval makes the submission the live content;
-- no code edit or deploy required.
--
-- Granularity is deliberately mixed per caller: a whole combo walkthrough is
-- one sectionkey (narrative continuity matters across steps), while each
-- strengths/weaknesses bullet is its own sectionkey (independently correct
-- claims). See assets/js/page-sections.js for the rendering/submission side.
--
-- No migration tooling exists in this repo (schema lives only in the Supabase
-- dashboard) — run this file by hand in the Supabase SQL editor, once.
-- Depends on is_moderator() and force_pending_on_insert(), both defined in
-- 001_synergy_tags_schema.sql.
-- ============================================================================

create table pagesections (
  sectionid    bigint generated always as identity primary key,
  archetypeid  bigint not null references archetypes(archetypeid),
  sectionkey   text not null,
  title        text,
  body         text not null,
  userid       uuid not null references profiles(userid),
  status       text not null default 'pending',
  modnotes     text,
  createdon    timestamptz not null default now(),
  constraint pagesections_status_check check (status in ('pending','approved','rejected','superseded')),
  constraint pagesections_body_len_check check (char_length(body) between 10 and 4000),
  constraint pagesections_sectionkey_check check (sectionkey ~ '^[a-z0-9-]+$')
);

-- Only one live (approved) version per (archetype, section) at a time. Not a
-- plain unique constraint — 'superseded' rows from past approved versions,
-- and any number of 'pending'/'rejected' rows, must coexist alongside it.
create unique index pagesections_one_approved_per_section
  on pagesections (archetypeid, sectionkey)
  where status = 'approved';

-- ----------------------------------------------------------------------------
-- Rate-limit trigger: max 50 section submissions per user per rolling hour.
-- Sections are the per-page edit unit (see page-sections.js header), so a
-- page with many combo walkthroughs/bullets needs headroom to be rewritten
-- in one sitting; 50 is loose enough for that while still stopping scripted
-- flooding of the moderation queue.
-- Mirrors check_reason_rate_limit() / check_correction_rate_limit().
-- ----------------------------------------------------------------------------
create or replace function check_section_rate_limit()
returns trigger
language plpgsql
security definer
as $$
begin
  if (select count(*) from pagesections
      where userid = new.userid and createdon > now() - interval '1 hour') >= 50 then
    raise exception 'Rate limit: too many section submissions recently. Try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists pagesections_rate_limit on pagesections;
create trigger pagesections_rate_limit
  before insert on pagesections
  for each row execute function check_section_rate_limit();

-- force_pending_on_insert() is generic (only touches new.status), reused as-is.
drop trigger if exists pagesections_force_pending on pagesections;
create trigger pagesections_force_pending
  before insert on pagesections
  for each row execute function force_pending_on_insert();

-- ----------------------------------------------------------------------------
-- approve_pagesection(): the only path that flips a row to 'approved'. Does
-- two updates atomically — supersede whatever was previously live for this
-- (archetype, sectionkey), then approve the new one — so the partial unique
-- index above is never violated by a moderator clicking "Approve" on a
-- section that already has a live version.
-- ----------------------------------------------------------------------------
create or replace function approve_pagesection(p_sectionid bigint)
returns void
language plpgsql
security definer
as $$
declare
  v_archetypeid bigint;
  v_sectionkey  text;
begin
  if not is_moderator() then
    raise exception 'Only moderators can approve section rewrites.';
  end if;

  select archetypeid, sectionkey into v_archetypeid, v_sectionkey
  from pagesections where sectionid = p_sectionid;

  if v_archetypeid is null then
    raise exception 'Section submission not found.';
  end if;

  update pagesections
    set status = 'superseded'
    where archetypeid = v_archetypeid
      and sectionkey = v_sectionkey
      and status = 'approved';

  update pagesections
    set status = 'approved'
    where sectionid = p_sectionid;
end;
$$;

grant execute on function approve_pagesection(bigint) to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table pagesections enable row level security;

-- Approved AND superseded rows are publicly visible (including anonymous
-- visitors) — a wiki-style "[history]" view of past versions is only
-- meaningful if the past versions are readable, and a superseded row was
-- already public content while it was live, so there's nothing new exposed
-- by keeping it visible after the fact. Pending/rejected stay private to the
-- submitter and moderators, unlike pagecorrections which is never public.
--
-- Uses drop-if-exists so this file stays safe to re-run after the
-- 'superseded' clause was added post-hoc (matches the trigger convention
-- used elsewhere in this schema).
drop policy if exists pagesections_select on pagesections;
create policy pagesections_select on pagesections
  for select using (
    status in ('approved', 'superseded') or userid = auth.uid() or is_moderator()
  );

create policy pagesections_insert on pagesections
  for insert with check (userid = auth.uid());

-- Reject/unapprove go through plain updates (RLS-gated to moderators);
-- approve goes through approve_pagesection() so the supersede step can't be
-- skipped by calling .update() directly with status: 'approved'. This policy
-- still allows a moderator to do that directly if needed for cleanup.
create policy pagesections_update on pagesections
  for update using (is_moderator()) with check (is_moderator());
-- No delete policy: matches every other moderation table in this schema.

-- ============================================================================
-- Manual validation:
-- 1. As user A, submit a rewrite for a section with no existing approved
--    version -> approve it as a moderator -> confirm it's the only approved
--    row and is publicly selectable as anon.
-- 2. As user B, submit a second rewrite for the SAME (archetypeid,
--    sectionkey) -> approve it -> confirm user A's row flipped to
--    'superseded' and user B's is now the sole 'approved' row.
-- 3. As a non-moderator, call approve_pagesection() directly via RPC ->
--    confirm it raises.
-- 4. As anon, select from pagesections -> confirm only 'approved' rows are
--    visible, never 'pending'/'rejected'/'superseded' ones.
-- ============================================================================
