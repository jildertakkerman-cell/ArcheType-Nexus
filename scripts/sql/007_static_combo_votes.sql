-- ============================================================================
-- Static combo votes: lets users vote on the legacy combos authored directly
-- into assets/data/combos/*.json (rendered by combo-system.js), which have no
-- row in `combos` to hang a `combovotes` FK off of. A combo's id here is
-- derived client-side as `${archetypeSlug}-${comboKey}` (e.g. "gishki-combo1"),
-- not a generated key, so `comboid` is text with no FK — there's nothing in
-- Postgres for it to reference.
--
-- No migration tooling exists in this repo (schema lives only in the Supabase
-- dashboard) — run this file by hand in the Supabase SQL editor, once.
-- ============================================================================

create table staticcombovotes (
  userid     uuid not null references profiles(userid) on delete cascade,
  comboid    text not null,
  value      smallint not null,
  createdon  timestamptz not null default now(),
  constraint staticcombovotes_value_check check (value in (-1, 1)),
  primary key (userid, comboid)
);

alter table staticcombovotes enable row level security;

create policy staticcombovotes_select on staticcombovotes
  for select using (true);

create policy staticcombovotes_insert on staticcombovotes
  for insert with check (userid = auth.uid());

create policy staticcombovotes_update on staticcombovotes
  for update using (userid = auth.uid()) with check (userid = auth.uid());

create policy staticcombovotes_delete on staticcombovotes
  for delete using (userid = auth.uid());
