begin;

alter function public.claim_free_game(uuid) set schema vornelix_private;
alter function public.submit_game(uuid) set schema vornelix_private;
alter function public.review_game(uuid, boolean, text) set schema vornelix_private;
alter function public.review_developer_application(uuid, boolean) set schema vornelix_private;
alter function public.get_game_moderation_notes(uuid) set schema vornelix_private;
alter function vornelix_private.get_game_moderation_notes(uuid) set search_path = '';
alter function public.log_game_status_change() set search_path = '';

revoke all on function
  vornelix_private.claim_free_game(uuid),
  vornelix_private.submit_game(uuid),
  vornelix_private.review_game(uuid, boolean, text),
  vornelix_private.review_developer_application(uuid, boolean),
  vornelix_private.get_game_moderation_notes(uuid)
from public, anon;

grant execute on function
  vornelix_private.claim_free_game(uuid),
  vornelix_private.submit_game(uuid),
  vornelix_private.review_game(uuid, boolean, text),
  vornelix_private.review_developer_application(uuid, boolean),
  vornelix_private.get_game_moderation_notes(uuid)
to authenticated;

create function public.claim_free_game(p_game_id uuid) returns void
language sql security invoker set search_path = '' as $$
  select vornelix_private.claim_free_game(p_game_id);
$$;

create function public.submit_game(p_game_id uuid) returns void
language sql security invoker set search_path = '' as $$
  select vornelix_private.submit_game(p_game_id);
$$;

create function public.review_game(p_game_id uuid, p_approved boolean, p_notes text default null) returns void
language sql security invoker set search_path = '' as $$
  select vornelix_private.review_game(p_game_id, p_approved, p_notes);
$$;

create function public.review_developer_application(p_application_id uuid, p_approved boolean) returns void
language sql security invoker set search_path = '' as $$
  select vornelix_private.review_developer_application(p_application_id, p_approved);
$$;

create function public.get_game_moderation_notes(p_game_id uuid) returns text
language sql stable security invoker set search_path = '' as $$
  select vornelix_private.get_game_moderation_notes(p_game_id);
$$;

revoke all on function
  public.claim_free_game(uuid),
  public.submit_game(uuid),
  public.review_game(uuid, boolean, text),
  public.review_developer_application(uuid, boolean),
  public.get_game_moderation_notes(uuid)
from public, anon, authenticated;

grant execute on function
  public.claim_free_game(uuid),
  public.submit_game(uuid),
  public.review_game(uuid, boolean, text),
  public.review_developer_application(uuid, boolean),
  public.get_game_moderation_notes(uuid)
to authenticated;

notify pgrst, 'reload schema';
commit;
