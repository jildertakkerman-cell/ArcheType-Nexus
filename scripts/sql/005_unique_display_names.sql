-- ============================================================================
-- 005: Unique display names — block renaming to another user's name.
--
-- Anyone could previously set their displayname to an existing user's name
-- and impersonate them on combo cards, synergy explanations, and the auth
-- bar (replays were never at risk — they are RLS-scoped to auth.uid()).
--
-- Enforced case-insensitively in the update trigger rather than a unique
-- index, for the same reason as 003: legacy OAuth-seeded rows may already
-- collide and must stay valid until the user edits them. The check applies
-- to moderators too — their exemption exists to fix bad names, and a fix
-- should never introduce a duplicate. INSERTs (signup) are deliberately not
-- checked so an OAuth name collision can never block account creation.
--
-- The function is security definer (as before) so the exists() probe sees
-- all profiles rows regardless of the caller's RLS visibility.
--
-- Applied to the live DB via the direct Postgres connection.
-- ============================================================================

create or replace function enforce_profile_update_rules()
returns trigger
language plpgsql
security definer
as $$
begin
    -- Role can never be changed by non-moderators, regardless of RLS shape.
    if new.role is distinct from old.role and not is_moderator() then
        raise exception 'You cannot change your own role.';
    end if;

    -- No renaming onto an existing name, case-insensitively. Applies to
    -- everyone, moderators included. The advisory lock serializes concurrent
    -- renames to the same name, which a trigger-time exists() alone can't
    -- (both transactions would see no conflict and commit).
    if new.displayname is distinct from old.displayname then
        perform pg_advisory_xact_lock(hashtext(lower(trim(new.displayname))));
        if exists (
            select 1 from profiles p
            where p.userid <> new.userid
              and lower(trim(p.displayname)) = lower(trim(new.displayname))
        ) then
            raise exception 'That display name is already taken.';
        end if;
    end if;

    -- Display name rules (moderators exempt so they can fix bad names freely).
    if new.displayname is distinct from old.displayname and not is_moderator() then
        if new.displayname is null
           or char_length(trim(new.displayname)) < 3
           or char_length(new.displayname) > 24 then
            raise exception 'Display name must be between 3 and 24 characters.';
        end if;
        if old.namechangedon is not null
           and old.namechangedon > now() - interval '7 days' then
            raise exception 'You can change your display name once per week. Try again later.';
        end if;
        new.displayname := trim(new.displayname);
        new.namechangedon := now();
    end if;

    -- Favorite archetype must be a curated site archetype (has an icon).
    if new.favoritearchetypeid is not null
       and new.favoritearchetypeid is distinct from old.favoritearchetypeid then
        if not exists (
            select 1 from archetypes a
            where a.archetypeid = new.favoritearchetypeid
              and a.iconsvg is not null
        ) then
            raise exception 'That archetype cannot be selected as a favorite.';
        end if;
    end if;

    new.modifiedon := now();
    return new;
end;
$$;

-- Trigger from 003 already points at this function; recreate defensively in
-- case 005 is ever applied to a fresh database where 003's trigger is absent.
drop trigger if exists profiles_update_rules on profiles;
create trigger profiles_update_rules
    before update on profiles
    for each row execute function enforce_profile_update_rules();
