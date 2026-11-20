create schema if not exists vornelix_private;
revoke all on schema vornelix_private from public, anon, authenticated;
grant usage on schema vornelix_private to anon, authenticated;

create table public.game_play_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds bigint not null default 0 check (active_seconds >= 0)
);

create index game_play_sessions_game_idx on public.game_play_sessions(game_id,last_seen_at);
create index game_play_sessions_player_idx on public.game_play_sessions(player_id,game_id,last_seen_at);
create unique index game_play_sessions_one_open on public.game_play_sessions(game_id,player_id) where ended_at is null;

alter table public.game_play_sessions enable row level security;
revoke all on table public.game_play_sessions from public, anon, authenticated;
grant all on table public.game_play_sessions to service_role;

create or replace function vornelix_private.telemetry_event(p_game uuid,p_event text,p_session uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid := auth.uid();
  t timestamptz := clock_timestamp();
  s uuid;
begin
  if u is null or p_event not in ('start','heartbeat','end') or p_event is null then
    raise exception 'Invalid event';
  end if;
  if not exists(select 1 from public.games where id=p_game and status='published') then
    raise exception 'Game unavailable';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text||p_game::text,0));
  if p_event='start' then
    update public.game_play_sessions set ended_at=last_seen_at
    where game_id=p_game and player_id=u and ended_at is null and last_seen_at<t-interval '120 seconds';
    select id into s from public.game_play_sessions where game_id=p_game and player_id=u and ended_at is null;
    if s is not null then return s; end if;
    if exists(select 1 from public.game_play_sessions where game_id=p_game and player_id=u and started_at>t-interval '30 seconds') then
      raise exception 'Try again later';
    end if;
    insert into public.game_play_sessions(game_id,player_id,started_at,last_seen_at) values(p_game,u,t,t) returning id into s;
  else
    update public.game_play_sessions
    set active_seconds=active_seconds+least(90,greatest(0,floor(extract(epoch from t-last_seen_at))::bigint)),
      last_seen_at=t,ended_at=case when p_event='end' then t else null end
    where id=p_session and game_id=p_game and player_id=u and ended_at is null
      and last_seen_at>=t-interval '120 seconds'
      and (p_event='end' or last_seen_at<=t-interval '15 seconds')
    returning id into s;
    if s is null and p_event='heartbeat' then
      select id into s from public.game_play_sessions
      where id=p_session and game_id=p_game and player_id=u and ended_at is null and last_seen_at>=t-interval '120 seconds';
    end if;
    if s is null then raise exception 'Session unavailable'; end if;
  end if;
  return s;
end;
$$;

create or replace function vornelix_private.telemetry_stats()
returns table(game_id uuid,title text,players bigint,playing bigint,sessions bigint,average_seconds numeric,players_7d bigint,players_30d bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id,g.title::text,
    count(distinct s.player_id),
    count(distinct s.player_id) filter(where s.ended_at is null and s.last_seen_at>=now()-interval '120 seconds'),
    count(s.id),
    coalesce(round(avg(s.active_seconds)),0),
    count(distinct s.player_id) filter(where s.last_seen_at>=now()-interval '7 days'),
    count(distinct s.player_id) filter(where s.last_seen_at>=now()-interval '30 days')
  from public.games g left join public.game_play_sessions s on s.game_id=g.id
  where auth.uid() is not null and (g.developer_id=auth.uid() or public.is_admin())
  group by g.id,g.title
$$;

revoke all on function vornelix_private.telemetry_event(uuid,text,uuid) from public, anon;
revoke all on function vornelix_private.telemetry_stats() from public, anon;
grant execute on function vornelix_private.telemetry_event(uuid,text,uuid) to authenticated, service_role;
grant execute on function vornelix_private.telemetry_stats() to authenticated, service_role;

create or replace function public.telemetry_event(p_game uuid,p_event text,p_session uuid default null)
returns uuid
language sql
security definer
set search_path = ''
as $$ select vornelix_private.telemetry_event(p_game,p_event,p_session) $$;

create or replace function public.telemetry_stats()
returns table(game_id uuid,title text,players bigint,playing bigint,sessions bigint,average_seconds numeric,players_7d bigint,players_30d bigint)
language sql
stable
security definer
set search_path = ''
as $$ select * from vornelix_private.telemetry_stats() $$;

revoke all on function public.telemetry_event(uuid,text,uuid) from public, anon;
revoke all on function public.telemetry_stats() from public, anon;
grant execute on function public.telemetry_event(uuid,text,uuid) to authenticated;
grant execute on function public.telemetry_stats() to authenticated;
