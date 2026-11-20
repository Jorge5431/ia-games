begin;

CREATE OR REPLACE FUNCTION vornelix_private.review_update(p_id uuid, p_approve boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare u public.game_updates; g public.games; begin
if auth.uid() is null or not public.is_admin() then raise exception 'Acesso negado'; end if;
select * into u from public.game_updates where id=p_id and status='pending' for update; if not found then raise exception 'Atualização indisponível'; end if;
select * into g from public.games where id=u.game_id and status='published' for update; if not found then raise exception 'Jogo indisponível'; end if;
if p_approve then
if u.package_path is not null then
if u.delivery_kind not in ('html_zip','windows_zip') or u.delivery_kind is null or u.package_path not like g.developer_id::text||'/'||g.id::text||'/%' or not exists(select 1 from storage.objects where bucket_id='game-packages' and name=u.package_path) then raise exception 'Pacote inválido'; end if;
update public.game_delivery_intake set package_path=u.package_path,delivery_kind=u.delivery_kind,entry_hint=u.entry_hint,source_url='https://vornelix-games.vercel.app/private-package',updated_at=now() where game_id=g.id;
if not found then raise exception 'Entrega indisponível'; end if;
end if;
update public.games set title=u.title,description=u.description,short_description=left(u.description,240),genre=coalesce(u.genre,g.genre),updated_at=now() where id=g.id;
end if;
update public.game_updates set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now() where id=p_id;
insert into public.notifications(user_id,kind,title,body,href,event_key) values(g.developer_id,'game','Atualização analisada',case when p_approve then 'Nova versão aprovada.' else 'Atualização rejeitada; versão anterior mantida.' end,'/developer/games/'||g.id||'/edit','update-result:'||u.id) on conflict do nothing;
end $function$;

CREATE OR REPLACE FUNCTION public.review_update(p_id uuid, p_approve boolean)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select vornelix_private.review_update(p_id,p_approve) $function$;

revoke all on function public.review_update(uuid,boolean), vornelix_private.review_update(uuid,boolean) from public,anon;

grant execute on function public.review_update(uuid,boolean) to authenticated,service_role;

grant execute on function vornelix_private.review_update(uuid,boolean) to authenticated;

CREATE OR REPLACE FUNCTION vornelix_private.apply_reviewed_media()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
if new.status='approved' and old.status='pending' and new.media_kind is not null then
if auth.uid() is null or not public.is_admin() then raise exception 'Acesso negado'; end if;
if new.media_url is null or new.media_url !~ '^https://' then raise exception 'URL inválida'; end if;
if new.media_kind='cover_url' then update public.games set cover_url=new.media_url where id=new.game_id;
elsif new.media_kind='banner_url' then update public.games set banner_url=new.media_url where id=new.game_id;
elsif new.media_kind in ('trailer','screenshot') then insert into public.game_media(game_id,media_type,media_url) values(new.game_id,new.media_kind,new.media_url);
end if;
end if;
return new;
end $function$;

revoke all on function vornelix_private.apply_reviewed_media() from public, anon, authenticated;

CREATE OR REPLACE TRIGGER apply_reviewed_media AFTER UPDATE OF status ON public.game_updates FOR EACH ROW EXECUTE FUNCTION vornelix_private.apply_reviewed_media();

CREATE OR REPLACE FUNCTION vornelix_private.notify_game_update_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin insert into public.notifications(user_id,kind,title,body,href,event_key) select id,'moderation','Nova atualização para análise',new.title,'/admin/moderation#'||new.id,'update-request:'||new.id from public.profiles where role='admin' and id='d85bf8a9-8e6c-469a-99cb-3ebbeec6b4cb' on conflict do nothing; return new; end $function$;

revoke all on function vornelix_private.notify_game_update_request() from public, anon, authenticated;

CREATE OR REPLACE TRIGGER notify_game_update_request AFTER INSERT ON public.game_updates FOR EACH ROW EXECUTE FUNCTION vornelix_private.notify_game_update_request();

commit;
