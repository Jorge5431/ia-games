-- Keep sign-ups from failing when the requested public username is already taken.
-- A collision receives a unique, editable fallback based on the new auth user ID.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  fallback_username text := 'u' || substr(replace(new.id::text, '-', ''), 1, 23);
  safe_display_name text := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Jogador'), 60);
begin
  requested_username := case
    when lower(coalesce(new.raw_user_meta_data ->> 'username', '')) ~ '^[a-z0-9_]{3,24}$'
      then lower(new.raw_user_meta_data ->> 'username')
    else fallback_username
  end;

  begin
    insert into public.profiles (id, username, display_name, role)
    values (new.id, requested_username, safe_display_name, 'player')
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.profiles (id, username, display_name, role)
    values (new.id, fallback_username, safe_display_name, 'player')
    on conflict (id) do nothing;
  end;

  return new;
end;
$$;
