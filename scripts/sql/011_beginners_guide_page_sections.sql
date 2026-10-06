-- ============================================================================
-- 011: Give the Beginner's Guide (pages/Beginners-Guide.html) a row in
-- `archetypes`, so page-sections.js can store and show approved community
-- edits for it. The page calls initPageSections('Beginners Guide'), which looks
-- the row up with ilike on archetypename; without it the lookup returns 406 and
-- in-place editing stays off.
--
-- iconsvg stays null on purpose: favorites, synergy links and the replay
-- archetype picker only offer rows with an icon (or a page in
-- archetypes-data.js), so this row never shows up as a pickable archetype.
--
-- Safe to run more than once. Run by hand in the Supabase SQL editor.
-- ============================================================================

do $$
declare
  id_is_generated boolean;
begin
  if exists (select 1 from archetypes where archetypename ilike 'Beginners Guide') then
    raise notice 'Beginners Guide already exists, nothing to do.';
    return;
  end if;

  select (column_default is not null or is_identity = 'YES')
    into id_is_generated
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'archetypes'
     and column_name = 'archetypeid';

  if id_is_generated then
    insert into archetypes (archetypename, createdon, modifiedon)
    values ('Beginners Guide', now(), now());
  else
    insert into archetypes (archetypeid, archetypename, createdon, modifiedon)
    select coalesce(max(archetypeid), 0) + 1, 'Beginners Guide', now(), now()
      from archetypes;
  end if;
end $$;

-- Check: one row, no icon.
select archetypeid, archetypename, iconsvg is null as has_no_icon
  from archetypes
 where archetypename ilike 'Beginners Guide';
