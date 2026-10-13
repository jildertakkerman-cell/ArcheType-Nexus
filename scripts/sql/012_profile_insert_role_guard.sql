-- ============================================================================
-- 012: Profile insert role guard — block role self-escalation on INSERT.
--
-- 003 added a BEFORE UPDATE trigger (enforce_profile_update_rules) to ensure
-- non-moderators cannot change their role. However, on INSERT (when a new
-- profile row is created), non-moderators must also be prevented from setting
-- an elevated role ('moderator' or 'admin') directly via PostgREST payloads.
--
-- This trigger unconditionally enforces that any newly inserted profile
-- has role = 'user' unless inserted by an existing moderator or service role.
--
-- Safe to run in the Supabase SQL Editor.
-- ============================================================================

create or replace function enforce_profile_insert_rules()
returns trigger
language plpgsql
security definer
as $$
begin
    -- Non-moderators can never initialize an elevated role
    if not is_moderator() then
        new.role := 'user';
    end if;

    -- Ensure timestamps are set
    if new.createdon is null then
        new.createdon := now();
    end if;

    return new;
end;
$$;

drop trigger if exists profiles_insert_rules on profiles;
create trigger profiles_insert_rules
    before insert on profiles
    for each row execute function enforce_profile_insert_rules();
