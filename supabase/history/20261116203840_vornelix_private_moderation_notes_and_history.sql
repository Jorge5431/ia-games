-- Do not expose internal moderation feedback through public game reads.
revoke select (moderation_notes) on public.games from anon, authenticated;

-- Pass the public username entered during sign-up into the automatically-created player profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'username', '')) ~ '^[a-z0-9_]{3,24}$'
        then lower(new.raw_user_meta_data ->> 'username')
      else null
    end,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Jogador'),
    'player'
  );
  return new;
end;
$$;

-- Developers may read notes for their own games; administrators may read all notes.
create or replace function public.get_game_moderation_notes(p_game_id uuid)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select g.moderation_notes
  from public.games as g
  where g.id = p_game_id
    and (g.developer_id = (select auth.uid()) or (select public.is_admin()))
  limit 1;
$$;

revoke all on function public.get_game_moderation_notes(uuid) from public, anon;
grant execute on function public.get_game_moderation_notes(uuid) to authenticated;

-- Keep an append-only record of moderation and submission transitions.
create table public.game_moderation_history (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  status_from text not null,
  status_to text not null,
  notes text,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index game_moderation_history_game_idx
  on public.game_moderation_history (game_id, created_at desc);

alter table public.game_moderation_history enable row level security;
revoke all on public.game_moderation_history from public, anon, authenticated;
grant select on public.game_moderation_history to authenticated;

create policy "Developers and admins view moderation history"
  on public.game_moderation_history
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.games as g
      where g.id = game_moderation_history.game_id
        and g.developer_id = (select auth.uid())
    )
  );

create or replace function public.log_game_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.status is distinct from new.status then
    insert into public.game_moderation_history
      (game_id, status_from, status_to, notes, actor_id)
    values
      (new.id, old.status, new.status, new.moderation_notes, coalesce((select auth.uid()), new.reviewed_by));
  end if;
  return new;
end;
$$;

revoke all on function public.log_game_status_change() from public, anon, authenticated;

create trigger games_log_status_change
  after update of status on public.games
  for each row execute function public.log_game_status_change();
