-- ============================================================================
-- Generic searcher reviews: a moderator's decision on a Spell that fetches a
-- card by its Type, Attribute, Level or kind ("Add 1 Level 4 or lower Warrior
-- monster from your Deck").
--
-- scripts/find-generic-searchers.js (weekly GitHub Action) scans the card
-- table for such Spells and writes the unreviewed ones to
-- assets/data/generic-searcher-candidates.json. The admin page's "Generic
-- Searchers" mode shows them; Approve stores the (possibly corrected) target
-- rule here, Reject stores the card so it isn't suggested again. The next
-- weekly run copies approved rules into assets/data/generic-searchers.json and
-- removes rejected cards from it, before the Small World / generic searcher
-- scores are rebuilt.
--
-- Anyone can read the table: the GitHub Action reads it with the anon key, and
-- it only holds card names and target rules. Only moderators can write.
--
-- No migration tooling exists in this repo (schema lives only in the Supabase
-- dashboard) — run this file by hand in the Supabase SQL editor, once.
-- Depends on is_moderator(), defined in 001_synergy_tags_schema.sql.
-- ============================================================================

create table genericsearcherreviews (
  passcode    bigint primary key,
  cardname    text not null,
  status      text not null,
  -- { "verb": "add" | "summon", "target": { ... }, "cost": "monster" | null, "note": "..." }
  -- in the format of assets/data/generic-searchers.json; required when approved
  rule        jsonb,
  modnotes    text,
  reviewedby  uuid references profiles(userid) default auth.uid(),
  reviewedon  timestamptz not null default now(),
  constraint genericsearcherreviews_status_check check (status in ('approved', 'rejected')),
  constraint genericsearcherreviews_rule_check check (status = 'rejected' or rule is not null)
);

alter table genericsearcherreviews enable row level security;

create policy genericsearcherreviews_select on genericsearcherreviews
  for select using (true);

create policy genericsearcherreviews_insert on genericsearcherreviews
  for insert with check (is_moderator());

create policy genericsearcherreviews_update on genericsearcherreviews
  for update using (is_moderator()) with check (is_moderator());

create policy genericsearcherreviews_delete on genericsearcherreviews
  for delete using (is_moderator());
