begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('game-packages', 'game-packages', false, 2097152,
    array['application/zip','application/x-zip-compressed','application/octet-stream']),
  ('game-videos', 'game-videos', true, 52428800, array['video/mp4','video/webm'])
on conflict (id) do nothing;

drop policy if exists game_package_insert on storage.objects;
drop policy if exists game_package_update_insert on storage.objects;
create policy game_package_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'game-packages' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.games g where g.id::text = (storage.foldername(objects.name))[2]
    and g.developer_id = (select auth.uid()) and g.status in ('draft','rejected','published')
  )
);

drop policy if exists game_package_read on storage.objects;
drop policy if exists package_free_html_read on storage.objects;
create policy game_package_read on storage.objects for select to authenticated using (
  bucket_id = 'game-packages' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())
    or exists (
      select 1 from public.game_delivery_intake d join public.games g on g.id = d.game_id
      where d.package_path = objects.name and d.delivery_kind = 'html_zip'
        and g.status = 'published' and g.price = 0
    )
  )
);

drop policy if exists game_video_insert on storage.objects;
create policy game_video_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'game-videos' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.is_developer())
);

commit;
