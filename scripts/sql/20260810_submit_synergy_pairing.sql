-- Wraps the two-insert "suggest a synergy pairing" flow (archetypelinks +
-- archetypelinkreasons) in a single transaction so a pairing can never be
-- committed without its required reason attached, even if the reason insert
-- fails partway through. Run this in the Supabase SQL Editor.
create or replace function public.submit_synergy_pairing(
  p_archetypeid1 bigint,
  p_archetypeid2 bigint,
  p_reason_body text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_linkid bigint;
begin
  insert into archetypelinks (archetypeid1, archetypeid2, submittedby)
  values (least(p_archetypeid1, p_archetypeid2), greatest(p_archetypeid1, p_archetypeid2), auth.uid())
  returning linkid into v_linkid;

  insert into archetypelinkreasons (linkid, userid, body)
  values (v_linkid, auth.uid(), p_reason_body);

  return v_linkid;
end;
$$;

grant execute on function public.submit_synergy_pairing(bigint, bigint, text) to authenticated;
