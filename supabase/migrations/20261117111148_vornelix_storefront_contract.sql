begin;

alter table public.games
  add column minimum_requirements text check (char_length(minimum_requirements) <= 4000),
  add column recommended_requirements text check (char_length(recommended_requirements) <= 4000),
  add column ai_disclosure text check (char_length(ai_disclosure) <= 4000);

grant select (minimum_requirements, recommended_requirements, ai_disclosure) on public.games to anon, authenticated;
grant insert (minimum_requirements, recommended_requirements, ai_disclosure),
  update (minimum_requirements, recommended_requirements, ai_disclosure) on public.games to authenticated;

create view public.published_game_ratings with (security_invoker = true) as
select r.game_id, r.rating, count(*) as quantity
from public.reviews r join public.games g on g.id=r.game_id and g.status='published'
group by r.game_id, r.rating;

create view public.published_games_catalog with (security_invoker = true) as
select g.id, g.developer_id, g.title, g.slug, g.short_description, g.description, g.genre,
       g.price, g.cover_url, g.banner_url, g.platform, g.languages, g.release_date,
       g.status, g.created_at, g.updated_at, g.reviewed_at,
       concat_ws(' ', g.title, g.short_description, g.description) as search_text,
       stats.rating_average, coalesce(stats.review_count, 0) as review_count
from public.games g
left join lateral (
  select avg(r.rating) as rating_average, count(*) as review_count
  from public.reviews r where r.game_id=g.id
) stats on true
where g.status='published' and g.slug is not null;

revoke all on public.published_game_ratings, public.published_games_catalog from public, anon, authenticated;
grant select on public.published_game_ratings, public.published_games_catalog to anon, authenticated;

create index if not exists vornelix_public_catalog_release
  on public.games (release_date desc nulls last, created_at desc, id) where status='published' and slug is not null;
create index if not exists vornelix_public_catalog_platform
  on public.games using gin (platform) where status='published' and slug is not null;

-- Store customers can only add published products and owners can only review published products.
create policy vornelix_wishlist_published on public.wishlists as restrictive
  for insert to authenticated with check (exists (
    select 1 from public.games g where g.id=game_id and g.status='published'
  ));
create policy vornelix_review_published on public.reviews as restrictive
  for insert to authenticated with check (exists (
    select 1 from public.games g where g.id=game_id and g.status='published'
  ));

revoke select on public.developer_applications from authenticated;
grant select (id,user_id,studio_name,description,portfolio_url,status,created_at,reviewed_at,reviewed_by)
  on public.developer_applications to authenticated;

create schema if not exists vornelix_private;
revoke all on schema vornelix_private from public, anon, authenticated;
grant usage on schema vornelix_private to anon, authenticated;

create function vornelix_private.current_role() returns text
language sql stable security definer set search_path='' as $$
  select role from public.profiles where id=(select auth.uid());
$$;
revoke all on function vornelix_private.current_role() from public, anon, authenticated;
grant execute on function vornelix_private.current_role() to anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security invoker set search_path='' as $$
  select coalesce(vornelix_private.current_role()='admin',false);
$$;
create or replace function public.is_developer() returns boolean
language sql stable security invoker set search_path='' as $$
  select coalesce(vornelix_private.current_role() in ('developer','admin'),false);
$$;

alter policy "Perfis públicos podem ser visualizados" on public.profiles
  to authenticated using (id=(select auth.uid()) or (select public.is_admin()));
revoke select on public.profiles from anon;

create function vornelix_private.published_game_developer(p_game_id uuid) returns text
language sql stable security definer set search_path='' as $$
  select p.display_name from public.games g join public.profiles p on p.id=g.developer_id
  where g.id=p_game_id and g.status='published';
$$;
revoke all on function vornelix_private.published_game_developer(uuid) from public, anon, authenticated;
grant execute on function vornelix_private.published_game_developer(uuid) to anon, authenticated;

create function public.published_game_developer(p_game_id uuid) returns text
language sql stable security invoker set search_path='' as $$
  select vornelix_private.published_game_developer(p_game_id);
$$;
revoke all on function public.published_game_developer(uuid) from public, anon, authenticated;
grant execute on function public.published_game_developer(uuid) to anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  candidate text := lower(coalesce(new.raw_user_meta_data->>'username',''));
  display text := left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Jogador'),60);
begin
  if candidate !~ '^[a-z0-9_]{3,24}$' then
    candidate := 'u'||substr(md5(new.id::text),1,23);
  end if;
  for attempt in 1..5 loop
    insert into public.profiles (id,username,display_name,role)
    values (new.id,candidate,display,'player') on conflict do nothing;
    if found or exists (select 1 from public.profiles where id=new.id) then
      return new;
    end if;
    candidate := 'u'||substr(replace(gen_random_uuid()::text,'-',''),1,23);
  end loop;
  raise exception 'Não foi possível gerar um nome de usuário único';
end;
$$;

create or replace function public.submit_game(p_game_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_developer() then raise exception 'Acesso negado'; end if;
  update public.games
  set status='pending', reviewed_at=null, reviewed_by=null, moderation_notes=null, updated_at=now()
  where id=p_game_id and developer_id=auth.uid() and status in ('draft','rejected')
    and length(trim(title))>1 and length(trim(coalesce(description,'')))>0
    and coalesce(slug,'') ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and length(trim(coalesce(ai_disclosure,'')))>0;
  if not found then raise exception 'Jogo não elegível ou incompleto'; end if;
end;
$$;

create table public.game_versions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  version text not null check (char_length(version) between 1 and 80),
  object_path text,
  sha256 text check (sha256 ~ '^[a-f0-9]{64}$'),
  security_status text not null default 'pending' check (security_status in ('pending','approved','revoked')),
  created_at timestamptz not null default now(),
  unique (game_id, version),
  check (security_status <> 'approved' or (sha256 is not null and object_path is not null))
);
alter table public.game_versions enable row level security;
revoke all on public.game_versions from public, anon, authenticated;
grant select (id,game_id,version,object_path,security_status,created_at) on public.game_versions to authenticated;
grant all on public.game_versions to service_role;
create index vornelix_game_version_lookup on public.game_versions (game_id,created_at desc,id desc);
create policy vornelix_version_owner on public.game_versions for select to authenticated
  using (exists (
    select 1 from public.user_library l join public.games g on g.id=l.game_id
    where l.user_id=(select auth.uid()) and l.game_id=game_versions.game_id and g.status='published'
  ));

insert into storage.buckets (id,name,public) values ('game-builds','game-builds',false);
-- No storage.objects policy for game-builds while distribution is disabled.

commit;
