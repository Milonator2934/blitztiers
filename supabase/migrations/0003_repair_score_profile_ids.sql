alter table public.accuracy_scores add column if not exists profile_id uuid;
alter table public.power_scores add column if not exists profile_id uuid;
alter table public.passing_scores add column if not exists profile_id uuid;
alter table public.goalkeeping_scores add column if not exists profile_id uuid;

alter table public.accuracy_scores add column if not exists elo integer;
alter table public.power_scores add column if not exists elo integer;
alter table public.passing_scores add column if not exists elo integer;
alter table public.goalkeeping_scores add column if not exists elo integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'accuracy_scores_profile_id_fkey') then
    alter table public.accuracy_scores
      add constraint accuracy_scores_profile_id_fkey
      foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'power_scores_profile_id_fkey') then
    alter table public.power_scores
      add constraint power_scores_profile_id_fkey
      foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'passing_scores_profile_id_fkey') then
    alter table public.passing_scores
      add constraint passing_scores_profile_id_fkey
      foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goalkeeping_scores_profile_id_fkey') then
    alter table public.goalkeeping_scores
      add constraint goalkeeping_scores_profile_id_fkey
      foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

create unique index if not exists accuracy_scores_profile_id_key on public.accuracy_scores (profile_id);
create unique index if not exists power_scores_profile_id_key on public.power_scores (profile_id);
create unique index if not exists passing_scores_profile_id_key on public.passing_scores (profile_id);
create unique index if not exists goalkeeping_scores_profile_id_key on public.goalkeeping_scores (profile_id);

notify pgrst, 'reload schema';
