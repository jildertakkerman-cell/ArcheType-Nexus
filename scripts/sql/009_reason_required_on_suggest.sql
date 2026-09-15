-- ============================================================================
-- 009: allow a synergy reason to be submitted together with a brand-new
-- (still-pending) pairing suggestion.
--
-- archetypelinkreasons_insert previously required the parent archetypelinks
-- row to already be 'approved'. The suggest-a-pairing flow now requires a
-- reason at submission time, before any moderator has looked at the link, so
-- the policy needs to also allow the link's own submitter to attach a reason
-- while it's still pending. Run by hand in the Supabase SQL editor.
-- ============================================================================

drop policy if exists archetypelinkreasons_insert on archetypelinkreasons;
create policy archetypelinkreasons_insert on archetypelinkreasons
  for insert with check (
    userid = auth.uid()
    and exists (
      select 1 from archetypelinks l
      where l.linkid = archetypelinkreasons.linkid
        and (l.status = 'approved' or l.submittedby = auth.uid())
    )
  );
