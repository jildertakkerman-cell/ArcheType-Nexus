-- ============================================================================
-- 002: Only curated site archetypes are linkable.
--
-- archetypes.iconsvg is backfilled exclusively from assets/js/archetypes-data.js
-- (the ~500 archetypes that have site pages), so "iconsvg is not null" marks a
-- curated site archetype. The widget's search already filters on it client-side;
-- this tightens the INSERT policy so a hand-crafted PostgREST call can't link
-- any of the other DB-only archetype rows either.
--
-- Applied to the live DB on 2026-07-14 via the direct Postgres connection.
-- ============================================================================

drop policy if exists archetypelinks_insert on archetypelinks;
create policy archetypelinks_insert on archetypelinks
  for insert with check (
    submittedby = auth.uid()
    and exists (select 1 from archetypes a
                where a.archetypeid = archetypelinks.archetypeid1
                  and a.iconsvg is not null)
    and exists (select 1 from archetypes a
                where a.archetypeid = archetypelinks.archetypeid2
                  and a.iconsvg is not null)
  );
