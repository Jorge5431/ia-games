alter table public.games
  drop constraint games_cover_url_storage_only,
  drop constraint games_banner_url_storage_only;
alter table public.games
  add constraint games_cover_url_storage_only
  check (cover_url is null or cover_url ~* '^https://kcamqntaofezflixmfoa\.supabase\.co/storage/v1/object/public/game-images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'),
  add constraint games_banner_url_storage_only
  check (banner_url is null or banner_url ~* '^https://kcamqntaofezflixmfoa\.supabase\.co/storage/v1/object/public/game-images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$');
alter table public.game_media drop constraint game_media_url_validated;
alter table public.game_media
  add constraint game_media_url_validated
  check (
    (media_type = 'screenshot' and media_url ~* '^https://kcamqntaofezflixmfoa\.supabase\.co/storage/v1/object/public/game-images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$')
    or (media_type = 'trailer' and (
      media_url ~* '^https://(www\.|m\.)?youtube\.com/(watch\?v=|embed/|shorts/)[a-z0-9_-]{6,}([?&][^[:space:]]*)?$'
      or media_url ~* '^https://youtu\.be/[a-z0-9_-]{6,}([?][^[:space:]]*)?$'
      or media_url ~* '^https://(www\.)?vimeo\.com/[0-9]+([?][^[:space:]]*)?$'
      or media_url ~* '^https://[^[:space:]/?#]+/[^[:space:]?#]+\.(mp4|webm)(\?[^[:space:]]*)?$'
    ))
  );
