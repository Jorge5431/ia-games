create or replace function public.delete_own_game(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Sessão necessária';
  end if;

  select developer_id, status::text
  into v_owner, v_status
  from public.games
  where id = p_id
  for update;

  if not found or v_owner is distinct from auth.uid() then
    raise exception 'Jogo não encontrado ou sem permissão';
  end if;

  if v_status not in ('draft', 'rejected') then
    raise exception 'Apenas rascunhos e jogos rejeitados podem ser excluídos definitivamente';
  end if;

  if exists (select 1 from public.user_library where game_id = p_id)
    or exists (select 1 from public.game_versions where game_id = p_id)
    or exists (select 1 from public.reviews where game_id = p_id)
    or exists (select 1 from public.game_play_sessions where game_id = p_id)
  then
    raise exception 'Este jogo possui histórico ou instalações e não pode ser apagado';
  end if;

  delete from public.game_delivery_intake where game_id = p_id;
  delete from public.game_updates where game_id = p_id;
  delete from public.game_media where game_id = p_id;
  delete from public.game_moderation_history where game_id = p_id;
  delete from public.wishlists where game_id = p_id;
  delete from public.games
  where id = p_id
    and developer_id = auth.uid()
    and status in ('draft', 'rejected');

  if not found then
    raise exception 'Não foi possível excluir o jogo';
  end if;
end;
$$;

revoke all on function public.delete_own_game(uuid) from public, anon;
grant execute on function public.delete_own_game(uuid) to authenticated;
