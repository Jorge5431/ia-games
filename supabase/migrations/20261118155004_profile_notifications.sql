create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,kind text not null,title text not null,body text not null,href text not null check(href like '/%' and href not like '//%'),event_key text not null,created_at timestamptz not null default now(),read_at timestamptz,unique(user_id,event_key));
alter table public.notifications enable row level security;
revoke all on public.notifications from public,anon,authenticated;
grant select,update(read_at) on public.notifications to authenticated;
create policy notifications_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy notifications_mark on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create index notifications_inbox on public.notifications(user_id,created_at desc);
create function vornelix_private.notify_events() returns trigger language plpgsql security definer set search_path='' as $$
declare g record;
begin
if TG_TABLE_NAME='developer_applications' then
 if new.status::text in ('approved','rejected') and old.status is distinct from new.status then
 insert into public.notifications(user_id,kind,title,body,href,event_key) values(new.user_id,'developer',case when new.status::text='approved' then 'Você agora é desenvolvedor!' else 'Solicitação analisada' end,'Confira o resultado da sua solicitação.',case when new.status::text='approved' then '/developer/dashboard' else '/developer/apply' end,'application:'||new.id||':'||new.status) on conflict do nothing; end if;
elsif TG_TABLE_NAME='games' then
 if old.status is distinct from new.status and new.status::text in ('published','rejected') then insert into public.notifications(user_id,kind,title,body,href,event_key) values(new.developer_id,'game','Atualização do seu jogo',new.title||case when new.status::text='published' then ' foi publicado!' else ' precisa de revisão.' end,'/developer/games/'||new.id||'/edit','game:'||new.id||':'||new.status||':'||new.updated_at) on conflict do nothing; end if;
 if old.price>new.price and new.status::text='published' then insert into public.notifications(user_id,kind,title,body,href,event_key) select user_id,'promotion','Oferta na sua lista de desejos',new.title||' está com preço reduzido.','/game/'||new.slug,'price:'||new.id||':'||new.updated_at from public.wishlists where game_id=new.id on conflict do nothing; end if;
else
 select id,title,developer_id into g from public.games where id=new.game_id;
 if g.developer_id is not null and g.developer_id<>new.player_id then insert into public.notifications(user_id,kind,title,body,href,event_key) values(g.developer_id,'play','Novo jogador', 'Uma sessão foi iniciada em '||g.title||'.','/developer/dashboard','play:'||g.id||':'||new.player_id||':'||to_char(new.started_at at time zone 'UTC','YYYY-MM-DD')) on conflict do nothing; end if;
end if;return new;end $$;
revoke all on function vornelix_private.notify_events() from public,anon,authenticated;
create trigger notify_application after update of status on public.developer_applications for each row execute function vornelix_private.notify_events();
create trigger notify_game after update of status,price on public.games for each row execute function vornelix_private.notify_events();
create trigger notify_play after insert on public.game_play_sessions for each row execute function vornelix_private.notify_events();
insert into public.notifications(user_id,kind,title,body,href,event_key) select user_id,'developer','Você agora é desenvolvedor!','Sua solicitação foi aprovada.','/developer/dashboard','application:'||id||':approved' from public.developer_applications where status='approved' on conflict do nothing;
