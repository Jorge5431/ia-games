create or replace function public.set_game_hero_media(p_id uuid,p_choice text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_choice not in ('banner','trailer') then raise exception 'Parâmetros inválidos'; end if;
 update public.games set hero_media=p_choice,updated_at=now() where id=p_id and developer_id=auth.uid() and status in ('draft','rejected','published');
 if not found then raise exception 'Jogo não encontrado ou sem permissão'; end if;
end $$;
revoke all on function public.set_game_hero_media(uuid,text) from public,anon;
grant execute on function public.set_game_hero_media(uuid,text) to authenticated;
