-- ============================================================================
-- Page corrections: lets any signed-in user flag a factual error in the
-- static, author/AI-drafted combo walkthrough or strengths/weaknesses text on
-- an archetype page. Distinct from `combos`/`archetypelinkreasons`, which are
-- community *additions* — this is a *correction* queue against existing
-- static HTML, reviewed here and then hand-applied to the page by a moderator
-- (there's no live-rendered content to flip a status flag on).
--
-- No migration tooling exists in this repo (schema lives only in the Supabase
-- dashboard) — run this file by hand in the Supabase SQL editor, once.
-- Depends on is_moderator() and force_pending_on_insert(), both defined in
-- 001_synergy_tags_schema.sql.
-- ============================================================================

create table pagecorrections (
  correctionid  bigint generated always as identity primary key,
  archetypeid   bigint not null references archetypes(archetypeid),
  quotedtext    text,
  body          text not null,
  userid        uuid not null references profiles(userid),
  status        text not null default 'pending',
  modnotes      text,
  createdon     timestamptz not null default now(),
  constraint pagecorrections_status_check check (status in ('pending','approved','rejected')),
  constraint pagecorrections_body_len_check check (char_length(body) between 10 and 1000),
  constraint pagecorrections_quoted_len_check check (quotedtext is null or char_length(quotedtext) <= 500)
);

-- ----------------------------------------------------------------------------
-- Rate-limit trigger: max 5 correction reports per user per rolling hour.
-- Mirrors check_reason_rate_limit() from 001_synergy_tags_schema.sql, kept as
-- a separate function since it targets a different table.
-- ----------------------------------------------------------------------------
create or replace function check_correction_rate_limit()
returns trigger
language plpgsql
security definer
as $$
begin
  if (select count(*) from pagecorrections
      where userid = new.userid and createdon > now() - interval '1 hour') >= 5 then
    raise exception 'Rate limit: too many corrections submitted recently. Try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists pagecorrections_rate_limit on pagecorrections;
create trigger pagecorrections_rate_limit
  before insert on pagecorrections
  for each row execute function check_correction_rate_limit();

-- force_pending_on_insert() is generic (only touches new.status), reused as-is.
drop trigger if exists pagecorrections_force_pending on pagecorrections;
create trigger pagecorrections_force_pending
  before insert on pagecorrections
  for each row execute function force_pending_on_insert();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table pagecorrections enable row level security;

-- No public "approved" visibility: unlike a pairing explanation, an approved
-- correction isn't rendered anywhere — a moderator reads it and hand-edits
-- the static page, then approves it here purely as an audit trail.
create policy pagecorrections_select on pagecorrections
  for select using (userid = auth.uid() or is_moderator());

create policy pagecorrections_insert on pagecorrections
  for insert with check (userid = auth.uid());

create policy pagecorrections_update on pagecorrections
  for update using (is_moderator()) with check (is_moderator());
-- No delete policy: matches archetypelinks/archetypelinkreasons convention.

-- ============================================================================
-- Manual validation:
-- 1. As user A, submit a correction with status: 'approved' in the payload
--    directly -> confirm it lands as 'pending' anyway.
-- 2. As user B (non-moderator), select from pagecorrections -> confirm user
--    A's row is NOT visible.
-- 3. As user A again, select -> confirm their OWN row IS visible.
-- 4. As a moderator, select -> confirm ALL rows are visible.
-- 5. As user A, submit 6 corrections within a minute -> confirm the 6th
--    throws the rate-limit exception.
-- ============================================================================
