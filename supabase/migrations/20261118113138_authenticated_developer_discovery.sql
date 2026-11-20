create policy "Authenticated members can discover developer profiles" on public.profiles for select to authenticated using (role = 'developer' and (select auth.uid()) is not null);
create view public.developer_leaderboard with (security_invoker=true) as select p.username, count(g.id) as game_count from public.profiles p join public.games g on g.developer_id=p.id and g.status='published' and g.slug is not null where p.role='developer' and (select auth.uid()) is not null group by p.id,p.username;
revoke all on public.developer_leaderboard from public,anon;
grant select on public.developer_leaderboard to authenticated;
