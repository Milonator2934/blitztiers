do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'accuracy_scores'
      and column_name = 'player_id'
  ) then
    update public.accuracy_scores
    set profile_id = player_id
    where profile_id is null
      and player_id is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'power_scores'
      and column_name = 'player_id'
  ) then
    update public.power_scores
    set profile_id = player_id
    where profile_id is null
      and player_id is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'passing_scores'
      and column_name = 'player_id'
  ) then
    update public.passing_scores
    set profile_id = player_id
    where profile_id is null
      and player_id is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'goalkeeping_scores'
      and column_name = 'player_id'
  ) then
    update public.goalkeeping_scores
    set profile_id = player_id
    where profile_id is null
      and player_id is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
