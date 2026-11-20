alter table public.games add column if not exists hero_media text not null default 'trailer' check (hero_media in ('trailer','banner'));
