alter table public.games add column if not exists reviewed_at timestamptz, add column if not exists reviewed_by uuid references public.profiles(id), add column if not exists moderation_notes text;
create index if not exists games_reviewed_by_idx on public.games(reviewed_by);
drop policy "Administrador gerencia jogos" on public.games;
drop policy "Desenvolvedor atualiza seus jogos" on public.games;
drop policy "Desenvolvedor cadastra jogos" on public.games;
create policy "Criar rascunho próprio" on public.games for insert to authenticated with check(developer_id=(select auth.uid()) and (select public.is_developer()) and status='draft');
create policy "Editar rascunho próprio" on public.games for update to authenticated using(developer_id=(select auth.uid()) and (select public.is_developer()) and status in ('draft','rejected')) with check(developer_id=(select auth.uid()) and status='draft');
revoke insert,update on public.games from authenticated;
grant insert(developer_id,title,slug,short_description,description,genre,price,cover_url,banner_url,platform,languages,release_date),update(title,slug,short_description,description,genre,price,cover_url,banner_url,platform,languages,release_date,status) on public.games to authenticated;
create or replace function public.submit_game(p_game_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
if not public.is_developer() then raise exception 'Acesso negado'; end if;
update public.games set status='pending',reviewed_at=null,reviewed_by=null,moderation_notes=null,updated_at=now() where id=p_game_id and developer_id=auth.uid() and status in ('draft','rejected') and length(trim(title))>0 and length(trim(coalesce(description,'')))>0 and length(trim(coalesce(slug,'')))>0;
if not found then raise exception 'Jogo não elegível ou incompleto'; end if;
end $$;
create or replace function public.review_game(p_game_id uuid,p_approved boolean,p_notes text default null) returns void language plpgsql security definer set search_path='' as $$ begin
if not public.is_admin() or p_approved is null then raise exception 'Acesso negado ou decisão inválida'; end if;
update public.games set status=case when p_approved then 'published' else 'rejected' end,reviewed_by=auth.uid(),reviewed_at=now(),moderation_notes=p_notes,updated_at=now() where id=p_game_id and status='pending';
if not found then raise exception 'Jogo pendente não encontrado'; end if;
end $$;
create or replace function public.claim_free_game(p_game_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
if auth.uid() is null then raise exception 'Login obrigatório'; end if;
perform 1 from public.games where id=p_game_id and status='published' and price=0 for share;
if not found then raise exception 'Jogo gratuito indisponível'; end if;
insert into public.user_library(user_id,game_id,acquisition_type) values(auth.uid(),p_game_id,'free') on conflict(user_id,game_id) do nothing;
end $$;
revoke all on function public.submit_game(uuid),public.review_game(uuid,boolean,text),public.claim_free_game(uuid) from public,anon;
grant execute on function public.submit_game(uuid),public.review_game(uuid,boolean,text),public.claim_free_game(uuid) to authenticated;
drop policy "Desenvolvedor adiciona mídia" on public.game_media;
create policy "Desenvolvedor adiciona mídia" on public.game_media for insert to authenticated with check(exists(select 1 from public.games g where g.id=game_id and g.developer_id=(select auth.uid()) and g.status in ('draft','rejected') and (select public.is_developer())));
create policy "Desenvolvedor edita mídia" on public.game_media for update to authenticated using(exists(select 1 from public.games g where g.id=game_id and g.developer_id=(select auth.uid()) and g.status in ('draft','rejected') and (select public.is_developer()))) with check(exists(select 1 from public.games g where g.id=game_id and g.developer_id=(select auth.uid()) and g.status in ('draft','rejected') and (select public.is_developer())));
create policy "Desenvolvedor remove mídia" on public.game_media for delete to authenticated using(exists(select 1 from public.games g where g.id=game_id and g.developer_id=(select auth.uid()) and g.status in ('draft','rejected') and (select public.is_developer())));
create policy "Usuário lista próprios avatares" on storage.objects for select to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Usuário atualiza próprio avatar" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Usuário exclui próprio avatar" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
