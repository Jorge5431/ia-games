-- Snapshot estrutural do projeto hospedado em 17/11/2026. Somente para o Supabase local. As restrições de mídia usam a origem local da API.
set search_path = public, pg_catalog;

create table public."developer_applications" (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  studio_name text not null,
  description text,
  portfolio_url text,
  status text default 'pending'::text not null,
  admin_notes text,
  created_at timestamp with time zone default now() not null,
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);
alter table public."developer_applications" enable row level security;

create table public."game_media" (
  id uuid default gen_random_uuid() not null,
  game_id uuid not null,
  media_url text not null,
  media_type text default 'screenshot'::text not null,
  "position" integer default 0 not null,
  created_at timestamp with time zone default now() not null
);
alter table public."game_media" enable row level security;

create table public."game_moderation_history" (
  id uuid default gen_random_uuid() not null,
  game_id uuid not null,
  status_from text not null,
  status_to text not null,
  notes text,
  actor_id uuid,
  created_at timestamp with time zone default now() not null
);
alter table public."game_moderation_history" enable row level security;

create table public."games" (
  id uuid default gen_random_uuid() not null,
  developer_id uuid not null,
  title text not null,
  slug text,
  short_description text,
  description text,
  genre text,
  price numeric(10,2) default 0 not null,
  cover_url text,
  banner_url text,
  platform text[] default '{}'::text[],
  languages text[] default '{}'::text[],
  release_date date,
  status text default 'draft'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  moderation_notes text
);
alter table public."games" enable row level security;

create table public."profiles" (
  id uuid not null,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  role text default 'player'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public."profiles" enable row level security;

create table public."reviews" (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  game_id uuid not null,
  rating integer not null,
  comment text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public."reviews" enable row level security;

create table public."user_library" (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  game_id uuid not null,
  acquired_at timestamp with time zone default now() not null,
  acquisition_type text default 'free'::text not null
);
alter table public."user_library" enable row level security;

create table public."wishlists" (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  game_id uuid not null,
  created_at timestamp with time zone default now() not null
);
alter table public."wishlists" enable row level security;

alter table public.developer_applications add constraint developer_applications_pkey PRIMARY KEY (id);
alter table public.developer_applications add constraint developer_applications_portfolio_https CHECK (portfolio_url IS NULL OR portfolio_url ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[^[:space:]]*)?$'::text);
alter table public.developer_applications add constraint developer_applications_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));
alter table public.developer_applications add constraint developer_applications_user_id_key UNIQUE (user_id);
alter table public.game_media add constraint game_media_media_type_check CHECK (media_type = ANY (ARRAY['screenshot'::text, 'trailer'::text]));
alter table public.game_media add constraint game_media_pkey PRIMARY KEY (id);
alter table public.game_media add constraint game_media_url_validated CHECK (media_type = 'screenshot'::text AND media_url ~* '^http://(127\.0\.0\.1|localhost):54321/storage/v1/object/public/game-images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'::text OR media_type = 'trailer'::text AND (media_url ~* '^https://(www\.|m\.)?youtube\.com/(watch\?v=|embed/|shorts/)[a-z0-9_-]{6,}([?&][^[:space:]]*)?$'::text OR media_url ~* '^https://youtu\.be/[a-z0-9_-]{6,}([?][^[:space:]]*)?$'::text OR media_url ~* '^https://(www\.)?vimeo\.com/[0-9]+([?][^[:space:]]*)?$'::text OR media_url ~* '^https://[^[:space:]/?#]+/[^[:space:]?#]+\.(mp4|webm)(\?[^[:space:]]*)?$'::text));
alter table public.game_moderation_history add constraint game_moderation_history_pkey PRIMARY KEY (id);
alter table public.games add constraint games_status_check CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'published'::text, 'rejected'::text]));
alter table public.games add constraint games_cover_url_storage_only CHECK (cover_url IS NULL OR cover_url ~* '^http://(127\.0\.0\.1|localhost):54321/storage/v1/object/public/game-images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'::text);
alter table public.games add constraint games_slug_key UNIQUE (slug);
alter table public.games add constraint games_banner_url_storage_only CHECK (banner_url IS NULL OR banner_url ~* '^http://(127\.0\.0\.1|localhost):54321/storage/v1/object/public/game-images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'::text);
alter table public.games add constraint games_pkey PRIMARY KEY (id);
alter table public.games add constraint games_price_check CHECK (price >= 0::numeric);
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_role_check CHECK (role = ANY (ARRAY['player'::text, 'developer'::text, 'admin'::text]));
alter table public.profiles add constraint profiles_username_key UNIQUE (username);
alter table public.reviews add constraint reviews_pkey PRIMARY KEY (id);
alter table public.reviews add constraint reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
alter table public.reviews add constraint reviews_user_id_game_id_key UNIQUE (user_id, game_id);
alter table public.user_library add constraint user_library_acquisition_type_check CHECK (acquisition_type = ANY (ARRAY['free'::text, 'purchase'::text, 'gift'::text, 'admin'::text]));
alter table public.user_library add constraint user_library_pkey PRIMARY KEY (id);
alter table public.user_library add constraint user_library_user_id_game_id_key UNIQUE (user_id, game_id);
alter table public.wishlists add constraint wishlists_pkey PRIMARY KEY (id);
alter table public.wishlists add constraint wishlists_user_id_game_id_key UNIQUE (user_id, game_id);

alter table public.developer_applications add constraint developer_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id);
alter table public.developer_applications add constraint developer_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.game_media add constraint game_media_game_id_fkey FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
alter table public.game_moderation_history add constraint game_moderation_history_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.game_moderation_history add constraint game_moderation_history_game_id_fkey FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
alter table public.games add constraint games_developer_id_fkey FOREIGN KEY (developer_id) REFERENCES profiles(id);
alter table public.games add constraint games_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id);
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.reviews add constraint reviews_game_id_fkey FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
alter table public.reviews add constraint reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.user_library add constraint user_library_game_id_fkey FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
alter table public.user_library add constraint user_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.wishlists add constraint wishlists_game_id_fkey FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
alter table public.wishlists add constraint wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX developer_applications_reviewed_by_idx ON public.developer_applications USING btree (reviewed_by);
CREATE INDEX game_media_game_id_idx ON public.game_media USING btree (game_id);
CREATE INDEX game_moderation_history_game_idx ON public.game_moderation_history USING btree (game_id, created_at DESC);
CREATE INDEX game_moderation_history_actor_id_idx ON public.game_moderation_history USING btree (actor_id);
CREATE INDEX games_reviewed_by_idx ON public.games USING btree (reviewed_by);
CREATE INDEX games_status_idx ON public.games USING btree (status);
CREATE INDEX games_genre_idx ON public.games USING btree (genre);
CREATE INDEX games_developer_idx ON public.games USING btree (developer_id);
CREATE INDEX reviews_game_idx ON public.reviews USING btree (game_id);
CREATE INDEX user_library_game_id_idx ON public.user_library USING btree (game_id);
CREATE INDEX wishlists_game_id_idx ON public.wishlists USING btree (game_id);

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
    select exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role = 'admin'
    );
$function$;

CREATE OR REPLACE FUNCTION public.review_game(p_game_id uuid, p_approved boolean, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
if not public.is_admin() or p_approved is null then raise exception 'Acesso negado ou decisão inválida'; end if;
update public.games set status=case when p_approved then 'published' else 'rejected' end,reviewed_by=auth.uid(),reviewed_at=now(),moderation_notes=p_notes,updated_at=now() where id=p_game_id and status='pending';
if not found then raise exception 'Jogo pendente não encontrado'; end if;
end $function$;

CREATE OR REPLACE FUNCTION public.submit_game(p_game_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
if not public.is_developer() then raise exception 'Acesso negado'; end if;
update public.games set status='pending',reviewed_at=null,reviewed_by=null,moderation_notes=null,updated_at=now() where id=p_game_id and developer_id=auth.uid() and status in ('draft','rejected') and length(trim(title))>0 and length(trim(coalesce(description,'')))>0 and length(trim(coalesce(slug,'')))>0;
if not found then raise exception 'Jogo não elegível ou incompleto'; end if;
end $function$;

CREATE OR REPLACE FUNCTION public.is_developer()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
    select exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role in ('developer', 'admin')
    );
$function$;

CREATE OR REPLACE FUNCTION public.claim_free_game(p_game_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
if auth.uid() is null then raise exception 'Login obrigatório'; end if;
perform 1 from public.games where id=p_game_id and status='published' and price=0 for share;
if not found then raise exception 'Jogo gratuito indisponível'; end if;
insert into public.user_library(user_id,game_id,acquisition_type) values(auth.uid(),p_game_id,'free') on conflict(user_id,game_id) do nothing;
end $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_game_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if old.status is distinct from new.status then
    insert into public.game_moderation_history
      (game_id, status_from, status_to, notes, actor_id)
    values
      (new.id, old.status, new.status, new.moderation_notes, coalesce((select auth.uid()), new.reviewed_by));
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_game_moderation_notes(p_game_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select g.moderation_notes
  from public.games as g
  where g.id = p_game_id
    and (g.developer_id = (select auth.uid()) or (select public.is_admin()))
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.review_developer_application(p_application_id uuid, p_approved boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare v_user uuid; begin
if not public.is_admin() or p_approved is null then raise exception 'Acesso negado ou decisão inválida'; end if;
select user_id into v_user from public.developer_applications where id=p_application_id and status='pending' for update;
if not found then raise exception 'Solicitação pendente não encontrada'; end if;
if p_approved then update public.profiles set role='developer',updated_at=now() where id=v_user and role='player'; if not found then raise exception 'Perfil não elegível'; end if; end if;
update public.developer_applications set status=case when p_approved then 'approved' else 'rejected' end,reviewed_by=auth.uid(),reviewed_at=now() where id=p_application_id;
end $function$;

CREATE TRIGGER games_log_status_change AFTER UPDATE OF status ON public.games FOR EACH ROW EXECUTE FUNCTION log_game_status_change();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

revoke all on public."developer_applications" from public, anon, authenticated;
revoke all on public."game_media" from public, anon, authenticated;
revoke all on public."game_moderation_history" from public, anon, authenticated;
revoke all on public."games" from public, anon, authenticated;
revoke all on public."profiles" from public, anon, authenticated;
revoke all on public."reviews" from public, anon, authenticated;
revoke all on public."user_library" from public, anon, authenticated;
revoke all on public."wishlists" from public, anon, authenticated;
grant SELECT on public."developer_applications" to "authenticated";
grant SELECT on public."game_media" to "anon";
grant DELETE on public."game_media" to "authenticated";
grant INSERT on public."game_media" to "authenticated";
grant SELECT on public."game_media" to "authenticated";
grant UPDATE on public."game_media" to "authenticated";
grant SELECT on public."game_moderation_history" to "authenticated";
grant SELECT on public."profiles" to "anon";
grant SELECT on public."profiles" to "authenticated";
grant SELECT on public."reviews" to "anon";
grant DELETE on public."reviews" to "authenticated";
grant INSERT on public."reviews" to "authenticated";
grant SELECT on public."reviews" to "authenticated";
grant SELECT on public."user_library" to "authenticated";
grant DELETE on public."wishlists" to "authenticated";
grant INSERT on public."wishlists" to "authenticated";
grant SELECT on public."wishlists" to "authenticated";
grant INSERT (description,portfolio_url,studio_name,user_id) on public."developer_applications" to "authenticated";
grant SELECT (banner_url,cover_url,created_at,description,developer_id,genre,id,languages,platform,price,release_date,reviewed_at,short_description,slug,status,title,updated_at) on public."games" to "anon";
grant INSERT (banner_url,cover_url,description,developer_id,genre,languages,platform,price,release_date,short_description,slug,title) on public."games" to "authenticated";
grant SELECT (banner_url,cover_url,created_at,description,developer_id,genre,id,languages,platform,price,release_date,reviewed_at,short_description,slug,status,title,updated_at) on public."games" to "authenticated";
grant UPDATE (banner_url,cover_url,description,genre,languages,platform,price,release_date,short_description,slug,status,title) on public."games" to "authenticated";
grant UPDATE (avatar_url,bio,display_name,username) on public."profiles" to "authenticated";
grant UPDATE (comment,rating) on public."reviews" to "authenticated";

grant all on all tables in schema public to service_role;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin(), public.is_developer() to anon, authenticated;
grant execute on function public.claim_free_game(uuid), public.submit_game(uuid), public.review_game(uuid, boolean, text), public.review_developer_application(uuid, boolean), public.get_game_moderation_notes(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('game-images', 'game-images', true, 10485760, array['image/jpeg','image/png','image/webp']);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']);

create policy "Perfis públicos podem ser visualizados" on "public"."profiles" for SELECT to "anon", "authenticated" using (true);

create policy "Usuário pode editar próprio perfil" on "public"."profiles" for UPDATE to "authenticated" using ((id = ( SELECT auth.uid() AS uid))) with check ((id = ( SELECT auth.uid() AS uid)));

create policy "Usuário consulta própria solicitação" on "public"."developer_applications" for SELECT to "authenticated" using (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin() AS is_admin)));

create policy "Visualizar jogos publicados" on "public"."games" for SELECT to "anon", "authenticated" using (((status = 'published'::text) OR (developer_id = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin() AS is_admin)));

create policy "Visualizar mídia de jogos" on "public"."game_media" for SELECT to "anon", "authenticated" using ((EXISTS ( SELECT 1
   FROM games g
  WHERE ((g.id = game_media.game_id) AND ((g.status = 'published'::text) OR (g.developer_id = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin() AS is_admin))))));

create policy "Usuário visualiza própria biblioteca" on "public"."user_library" for SELECT to "authenticated" using (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin() AS is_admin)));

create policy "Usuário gerencia própria lista" on "public"."wishlists" for ALL to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy "Visualizar avaliações" on "public"."reviews" for SELECT to "anon", "authenticated" using ((EXISTS ( SELECT 1
   FROM games g
  WHERE ((g.id = reviews.game_id) AND (g.status = 'published'::text)))));

create policy "Jogador avalia jogo da biblioteca" on "public"."reviews" for INSERT to "authenticated" with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_library ul
  WHERE ((ul.user_id = ( SELECT auth.uid() AS uid)) AND (ul.game_id = reviews.game_id))))));

create policy "Jogador exclui própria avaliação" on "public"."reviews" for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));

create policy "Usuário solicita acesso de desenvolvedor" on "public"."developer_applications" for INSERT to "authenticated" with check (((user_id = ( SELECT auth.uid() AS uid)) AND (status = 'pending'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'player'::text))))));

create policy "Desenvolvedor envia imagens" on "storage"."objects" for INSERT to "authenticated" with check (((bucket_id = 'game-images'::text) AND (is_developer() OR is_admin()) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Usuário envia avatar" on "storage"."objects" for INSERT to "authenticated" with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Jogador atualiza própria avaliação" on "public"."reviews" for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_library l
  WHERE ((l.user_id = ( SELECT auth.uid() AS uid)) AND (l.game_id = reviews.game_id))))));

create policy "Criar rascunho próprio" on "public"."games" for INSERT to "authenticated" with check (((developer_id = ( SELECT auth.uid() AS uid)) AND ( SELECT is_developer() AS is_developer) AND (status = 'draft'::text)));

create policy "Editar rascunho próprio" on "public"."games" for UPDATE to "authenticated" using (((developer_id = ( SELECT auth.uid() AS uid)) AND ( SELECT is_developer() AS is_developer) AND (status = ANY (ARRAY['draft'::text, 'rejected'::text])))) with check (((developer_id = ( SELECT auth.uid() AS uid)) AND (status = 'draft'::text)));

create policy "Desenvolvedor adiciona mídia" on "public"."game_media" for INSERT to "authenticated" with check ((EXISTS ( SELECT 1
   FROM games g
  WHERE ((g.id = game_media.game_id) AND (g.developer_id = ( SELECT auth.uid() AS uid)) AND (g.status = ANY (ARRAY['draft'::text, 'rejected'::text])) AND ( SELECT is_developer() AS is_developer)))));

create policy "Desenvolvedor edita mídia" on "public"."game_media" for UPDATE to "authenticated" using ((EXISTS ( SELECT 1
   FROM games g
  WHERE ((g.id = game_media.game_id) AND (g.developer_id = ( SELECT auth.uid() AS uid)) AND (g.status = ANY (ARRAY['draft'::text, 'rejected'::text])) AND ( SELECT is_developer() AS is_developer))))) with check ((EXISTS ( SELECT 1
   FROM games g
  WHERE ((g.id = game_media.game_id) AND (g.developer_id = ( SELECT auth.uid() AS uid)) AND (g.status = ANY (ARRAY['draft'::text, 'rejected'::text])) AND ( SELECT is_developer() AS is_developer)))));

create policy "Desenvolvedor remove mídia" on "public"."game_media" for DELETE to "authenticated" using ((EXISTS ( SELECT 1
   FROM games g
  WHERE ((g.id = game_media.game_id) AND (g.developer_id = ( SELECT auth.uid() AS uid)) AND (g.status = ANY (ARRAY['draft'::text, 'rejected'::text])) AND ( SELECT is_developer() AS is_developer)))));

create policy "Usuário lista próprios avatares" on "storage"."objects" for SELECT to "authenticated" using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

create policy "Usuário atualiza próprio avatar" on "storage"."objects" for UPDATE to "authenticated" using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))) with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

create policy "Usuário exclui próprio avatar" on "storage"."objects" for DELETE to "authenticated" using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

create policy "Developers and admins view moderation history" on "public"."game_moderation_history" for SELECT to "authenticated" using ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM games g
  WHERE ((g.id = game_moderation_history.game_id) AND (g.developer_id = ( SELECT auth.uid() AS uid)))))));
