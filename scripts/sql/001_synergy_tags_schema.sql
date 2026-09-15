-- ============================================================================
-- Synergy Tags feature: schema + RLS
--
-- No migration tooling exists in this repo (schema lives only in the Supabase
-- dashboard) — run this file by hand in the Supabase SQL editor, once.
-- Safe to run top-to-bottom; every statement is idempotent (IF NOT EXISTS /
-- CREATE OR REPLACE) except the table CREATEs themselves, which will error if
-- re-run — that's intentional, it means you've already applied this file.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Shared helper: mirrors the inline role check already used in admin.js
--    init() (profiles.role in ('moderator','admin')). Used by every RLS policy
--    below instead of repeating the subquery.
-- ----------------------------------------------------------------------------
create or replace function is_moderator()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where userid = auth.uid()
      and role in ('moderator', 'admin')
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. archetypelinks — one row per unordered pair of archetypes.
--    archetypeid1 < archetypeid2 is enforced so a pairing can never be stored
--    twice in reversed order, and a row can never link an archetype to itself.
-- ----------------------------------------------------------------------------
create table archetypelinks (
  linkid        bigint generated always as identity primary key,
  archetypeid1  bigint not null references archetypes(archetypeid),
  archetypeid2  bigint not null references archetypes(archetypeid),
  status        text not null default 'pending',
  modnotes      text,
  submittedby   uuid references profiles(userid),
  createdon     timestamptz not null default now(),
  constraint archetypelinks_status_check check (status in ('pending','approved','rejected')),
  constraint archetypelinks_ordered_check check (archetypeid1 < archetypeid2),
  constraint archetypelinks_unique unique (archetypeid1, archetypeid2)
);

-- ----------------------------------------------------------------------------
-- 3. archetypelinkvotes — Reddit-style up/down vote on a pairing.
--    One row per (link, user); toggling a vote off is a DELETE, matching the
--    existing combovotes vote-toggle pattern.
-- ----------------------------------------------------------------------------
create table archetypelinkvotes (
  linkid     bigint not null references archetypelinks(linkid) on delete cascade,
  userid     uuid not null references profiles(userid) on delete cascade,
  value      smallint not null,
  createdon  timestamptz not null default now(),
  constraint archetypelinkvotes_value_check check (value in (-1, 1)),
  primary key (linkid, userid)
);

-- ----------------------------------------------------------------------------
-- 4. archetypelinkreasons — "why it works" explanations under a pairing.
--    unique(linkid, userid) is the rate-limit: one explanation per user per
--    pairing, so competing explanations come from different people, not one
--    person spamming the same thread.
-- ----------------------------------------------------------------------------
create table archetypelinkreasons (
  reasonid   bigint generated always as identity primary key,
  linkid     bigint not null references archetypelinks(linkid) on delete cascade,
  userid     uuid not null references profiles(userid),
  body       text not null,
  status     text not null default 'pending',
  modnotes   text,
  createdon  timestamptz not null default now(),
  constraint archetypelinkreasons_status_check check (status in ('pending','approved','rejected')),
  constraint archetypelinkreasons_len_check check (char_length(body) between 10 and 220),
  constraint archetypelinkreasons_unique unique (linkid, userid)
);

-- ----------------------------------------------------------------------------
-- 5. archetypelinkreasonvotes — up/down vote on an individual explanation.
-- ----------------------------------------------------------------------------
create table archetypelinkreasonvotes (
  reasonid   bigint not null references archetypelinkreasons(reasonid) on delete cascade,
  userid     uuid not null references profiles(userid) on delete cascade,
  value      smallint not null,
  createdon  timestamptz not null default now(),
  constraint archetypelinkreasonvotes_value_check check (value in (-1, 1)),
  primary key (reasonid, userid)
);

-- ----------------------------------------------------------------------------
-- 6. archetypes.iconsvg — new column so the widget can fetch an archetype's
--    icon in the same query as the pairing data, instead of shipping the
--    whole 2.44MB archetypes-data.js to every page. Backfilled once by
--    scripts/backfill-archetype-icons.js (run after this file).
-- ----------------------------------------------------------------------------
alter table archetypes add column if not exists iconsvg text;

-- ----------------------------------------------------------------------------
-- 7. Rate-limit trigger: max 5 reason submissions per user per rolling hour.
-- ----------------------------------------------------------------------------
create or replace function check_reason_rate_limit()
returns trigger
language plpgsql
security definer
as $$
begin
  if (select count(*) from archetypelinkreasons
      where userid = new.userid and createdon > now() - interval '1 hour') >= 5 then
    raise exception 'Rate limit: too many explanations submitted recently. Try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists archetypelinkreasons_rate_limit on archetypelinkreasons;
create trigger archetypelinkreasons_rate_limit
  before insert on archetypelinkreasons
  for each row execute function check_reason_rate_limit();

-- ----------------------------------------------------------------------------
-- 8. force_pending_on_insert: RLS alone doesn't stop a client from sending
--    status: 'approved' directly in an insert payload via PostgREST — this
--    trigger unconditionally resets status to 'pending' on insert unless the
--    inserting user is a moderator.
-- ----------------------------------------------------------------------------
create or replace function force_pending_on_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  if not is_moderator() then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists archetypelinks_force_pending on archetypelinks;
create trigger archetypelinks_force_pending
  before insert on archetypelinks
  for each row execute function force_pending_on_insert();

drop trigger if exists archetypelinkreasons_force_pending on archetypelinkreasons;
create trigger archetypelinkreasons_force_pending
  before insert on archetypelinkreasons
  for each row execute function force_pending_on_insert();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table archetypelinks enable row level security;
alter table archetypelinkvotes enable row level security;
alter table archetypelinkreasons enable row level security;
alter table archetypelinkreasonvotes enable row level security;

-- --- archetypelinks -----------------------------------------------------
create policy archetypelinks_select on archetypelinks
  for select using (
    status = 'approved' or submittedby = auth.uid() or is_moderator()
  );

create policy archetypelinks_insert on archetypelinks
  for insert with check (submittedby = auth.uid());

create policy archetypelinks_update on archetypelinks
  for update using (is_moderator()) with check (is_moderator());
-- No delete policy: rejection is a status change, not a row delete
-- (matches how `combos` already behaves).

-- --- archetypelinkvotes ---------------------------------------------------
create policy archetypelinkvotes_select on archetypelinkvotes
  for select using (
    userid = auth.uid()
    or exists (
      select 1 from archetypelinks l
      where l.linkid = archetypelinkvotes.linkid
        and (l.status = 'approved' or l.submittedby = auth.uid() or is_moderator())
    )
  );

create policy archetypelinkvotes_insert on archetypelinkvotes
  for insert with check (
    userid = auth.uid()
    and exists (select 1 from archetypelinks l where l.linkid = archetypelinkvotes.linkid and l.status = 'approved')
  );

create policy archetypelinkvotes_update on archetypelinkvotes
  for update using (userid = auth.uid()) with check (userid = auth.uid());

create policy archetypelinkvotes_delete on archetypelinkvotes
  for delete using (userid = auth.uid());

-- --- archetypelinkreasons -------------------------------------------------
create policy archetypelinkreasons_select on archetypelinkreasons
  for select using (
    status = 'approved' or userid = auth.uid() or is_moderator()
  );

create policy archetypelinkreasons_insert on archetypelinkreasons
  for insert with check (
    userid = auth.uid()
    and exists (select 1 from archetypelinks l where l.linkid = archetypelinkreasons.linkid and l.status = 'approved')
  );

create policy archetypelinkreasons_update on archetypelinkreasons
  for update using (is_moderator()) with check (is_moderator());

-- --- archetypelinkreasonvotes ----------------------------------------------
create policy archetypelinkreasonvotes_select on archetypelinkreasonvotes
  for select using (
    userid = auth.uid()
    or exists (
      select 1 from archetypelinkreasons r
      where r.reasonid = archetypelinkreasonvotes.reasonid
        and (r.status = 'approved' or r.userid = auth.uid() or is_moderator())
    )
  );

create policy archetypelinkreasonvotes_insert on archetypelinkreasonvotes
  for insert with check (
    userid = auth.uid()
    and exists (select 1 from archetypelinkreasons r where r.reasonid = archetypelinkreasonvotes.reasonid and r.status = 'approved')
  );

create policy archetypelinkreasonvotes_update on archetypelinkreasonvotes
  for update using (userid = auth.uid()) with check (userid = auth.uid());

create policy archetypelinkreasonvotes_delete on archetypelinkreasonvotes
  for delete using (userid = auth.uid());

-- ============================================================================
-- Manual validation (run these as two different test sessions before
-- moving on to Phase B — one plain user, one profiles.role = 'moderator'):
--
-- 1. As user A, insert an archetypelinks row with status: 'approved' in the
--    payload directly -> confirm it lands as 'pending' anyway (force_pending
--    trigger).
-- 2. As user B (non-moderator), select from archetypelinks -> confirm user A's
--    pending row is NOT visible.
-- 3. As user A again, select from archetypelinks -> confirm their OWN pending
--    row IS visible to them.
-- 4. As user A, insert 6 archetypelinkreasons rows within a minute -> confirm
--    the 6th throws the rate-limit exception.
-- ============================================================================
