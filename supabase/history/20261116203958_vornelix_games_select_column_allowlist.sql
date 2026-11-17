revoke select on table public.games from anon, authenticated;
revoke select (moderation_notes) on table public.games from anon, authenticated;
grant select (
  id, developer_id, title, slug, short_description, description, genre, price,
  cover_url, banner_url, platform, languages, release_date, status,
  created_at, updated_at, reviewed_at
) on table public.games to anon, authenticated;
