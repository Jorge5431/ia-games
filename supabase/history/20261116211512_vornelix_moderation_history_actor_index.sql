-- Index the nullable profile reference used for moderation-history cleanup/lookups.
create index if not exists game_moderation_history_actor_id_idx
  on public.game_moderation_history (actor_id);
