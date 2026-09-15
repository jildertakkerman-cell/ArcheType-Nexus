-- ============================================================================
-- 003: Profile settings — editable display name, favorite archetype, avatar.
--
-- Adds user-editable profile options:
--   * displayname changes: 3-24 chars, max one change per 7 days (moderators
--     exempt). Enforced by trigger rather than a CHECK constraint so legacy
--     rows with long OAuth-seeded names stay valid until the user edits them.
--   * favoritearchetypeid: must point at a curated site archetype
--     (iconsvg is not null — same rule as 002 for synergy links).
--   * usearchetypeavatar: opt-in replacement of the OAuth avatar with the
--     favorite archetype's icon.
--   * role self-escalation guard, belt-and-braces alongside RLS.
--
-- Applied to the live DB via the direct Postgres connection.
-- ============================================================================

alter table profiles add column if not exists favoritearchetypeid bigint references archetypes(archetypeid);
alter table profiles add column if not exists usearchetypeavatar boolean not null default false;
alter table profiles add column if not exists namechangedon timestamptz;

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

drop trigger if exists profiles_update_rules on profiles;
create trigger profiles_update_rules
    before update on profiles
    for each row execute function enforce_profile_update_rules();
