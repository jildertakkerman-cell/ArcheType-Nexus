-- ============================================================================
-- 004: Profile privacy — opt out of the public favorite-archetype badge.
--
-- profiles.hidefavbadge: when true, the small favorite-archetype icon next to
-- the user's name on public combo cards and synergy explanations is not shown.
-- Read by community-combos.js and synergy-tags.js via their profiles joins.
--
-- Applied to the live DB via the direct Postgres connection.
-- ============================================================================

alter table profiles add column if not exists hidefavbadge boolean not null default false;
