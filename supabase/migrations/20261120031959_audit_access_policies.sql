begin;

-- Preserve the RPC signatures while keeping elevated implementations outside the Data API.
alter function public.delete_own_game(uuid) set schema vornelix_private;
alter function public.set_game_hero_media(uuid, text) set schema vornelix_private;

create function public.delete_own_game(p_id uuid) returns void
language sql security invoker set search_path = ''
as $$ select vornelix_private.delete_own_game(p_id) $$;

create function public.set_game_hero_media(p_id uuid, p_choice text) returns void
language sql security invoker set search_path = ''
as $$ select vornelix_private.set_game_hero_media(p_id, p_choice) $$;

revoke all on function public.delete_own_game(uuid), public.set_game_hero_media(uuid,text)
  from public, anon;
grant execute on function public.delete_own_game(uuid), public.set_game_hero_media(uuid,text)
  to authenticated, service_role;
grant usage on schema vornelix_private to service_role;
grant execute on function vornelix_private.delete_own_game(uuid),
  vornelix_private.set_game_hero_media(uuid,text) to authenticated, service_role;

-- Raw telemetry is internal. Client access goes through the scoped RPCs.
create policy sessions_internal_only on public.game_play_sessions
  as restrictive for all to anon, authenticated using (false) with check (false);

drop policy if exists delivery_free_play on public.game_delivery_intake;
drop policy if exists delivery_free_html on public.game_delivery_intake;
drop policy if exists delivery_published_web on public.game_delivery_intake;
alter policy delivery_read on public.game_delivery_intake using (
  exists (select 1 from public.games g where g.id = game_delivery_intake.game_id and (
    g.developer_id = (select auth.uid()) or (select public.is_admin()) or (
      g.status = 'published' and g.price = 0 and (
        delivery_kind = 'html_zip' or (delivery_kind = 'web' and package_path is null)
      )
    )
  ))
);

alter policy delivery_insert on public.game_delivery_intake with check (
  exists (select 1 from public.games g where g.id = game_delivery_intake.game_id
    and g.developer_id = (select auth.uid()) and g.status in ('draft','rejected'))
);
alter policy delivery_update on public.game_delivery_intake using (
  exists (select 1 from public.games g where g.id = game_delivery_intake.game_id
    and g.developer_id = (select auth.uid()) and g.status in ('draft','rejected'))
) with check (
  exists (select 1 from public.games g where g.id = game_delivery_intake.game_id
    and g.developer_id = (select auth.uid()) and g.status in ('draft','rejected'))
);

alter policy notifications_read on public.notifications using (user_id = (select auth.uid()));
alter policy notifications_mark on public.notifications using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy update_read on public.game_updates using (
  exists (select 1 from public.games g where g.id = game_updates.game_id
    and (g.developer_id = (select auth.uid()) or (select public.is_admin())))
);
alter policy update_insert on public.game_updates with check (
  status = 'pending' and reviewed_at is null and exists (
    select 1 from public.games g where g.id = game_updates.game_id
      and g.developer_id = (select auth.uid()) and g.status = 'published'
  )
);

drop policy "Authenticated members can discover developer profiles" on public.profiles;
alter policy "Perfis públicos podem ser visualizados" on public.profiles using (
  id = (select auth.uid()) or (select public.is_admin())
  or (role = 'developer' and (select auth.uid()) is not null)
);

notify pgrst, 'reload schema';
commit;
