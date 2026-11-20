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

-- Synchronize the isolated integration database with the hosted delivery workflow.
begin;
create table if not exists public.game_delivery_intake (
 game_id uuid primary key references public.games(id) on delete cascade,
 delivery_kind text not null check(delivery_kind in ('web','html_zip','windows_zip')),
 source_url text not null check(source_url ~ '^https://'),
 updated_at timestamptz not null default now(), package_path text, entry_hint text
);
alter table public.game_delivery_intake enable row level security;
grant select,insert,update on public.game_delivery_intake to authenticated;
grant all on public.game_delivery_intake to service_role;
create policy delivery_read on public.game_delivery_intake for select to authenticated using (exists(select 1 from public.games g where g.id=game_id and (g.developer_id=auth.uid() or public.is_admin())));
create policy delivery_insert on public.game_delivery_intake for insert to authenticated with check (exists(select 1 from public.games g where g.id=game_id and g.developer_id=auth.uid() and g.status in ('draft','rejected')));
create policy delivery_update on public.game_delivery_intake for update to authenticated using (exists(select 1 from public.games g where g.id=game_id and g.developer_id=auth.uid() and g.status in ('draft','rejected'))) with check (exists(select 1 from public.games g where g.id=game_id and g.developer_id=auth.uid() and g.status in ('draft','rejected')));
create policy delivery_free_play on public.game_delivery_intake for select to authenticated using (delivery_kind in ('web','html_zip') and exists(select 1 from public.games g where g.id=game_id and g.status='published' and g.price=0));
create table if not exists public.game_updates (
 id uuid primary key default gen_random_uuid(), game_id uuid not null references public.games(id) on delete cascade,
 title text not null check(char_length(title) between 2 and 100), description text not null check(char_length(description) between 1 and 15000),
 notes text not null check(char_length(notes) between 1 and 2000), status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), reviewed_at timestamptz, genre text, package_path text, delivery_kind text, entry_hint text,
 media_kind text check(media_kind in ('cover_url','banner_url','trailer','screenshot')), media_url text
);
alter table public.game_updates enable row level security;
grant select,insert on public.game_updates to authenticated;
grant all on public.game_updates to service_role;
create policy update_read on public.game_updates for select to authenticated using (exists(select 1 from public.games g where g.id=game_id and (g.developer_id=auth.uid() or public.is_admin())));
create policy update_insert on public.game_updates for insert to authenticated with check(status='pending' and reviewed_at is null and exists(select 1 from public.games g where g.id=game_id and g.developer_id=auth.uid() and g.status='published'));
create or replace function vornelix_private.unpublish_game(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
if auth.uid() is null then raise exception 'Acesso negado'; end if;
update public.games set status='draft',updated_at=now() where id=p_id and status='published' and (developer_id=auth.uid() or (auth.uid()='d85bf8a9-8e6c-469a-99cb-3ebbeec6b4cb'::uuid and public.is_admin()));
if not found then raise exception 'Jogo indisponível ou acesso negado'; end if;
end $$;
revoke all on function vornelix_private.unpublish_game(uuid) from public,anon;
grant execute on function vornelix_private.unpublish_game(uuid) to authenticated;
create or replace function public.unpublish_game(p_id uuid) returns void language sql security invoker set search_path='' as $$ select vornelix_private.unpublish_game(p_id) $$;
revoke all on function public.unpublish_game(uuid) from public,anon;
grant execute on function public.unpublish_game(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
