create or replace function public.is_blitztiers_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        username = 'IGNORANCE'
        or coalesce(to_jsonb(profiles)->>'is_admin', 'false') = 'true'
      )
  );
$$;

grant execute on function public.is_blitztiers_admin() to authenticated;

create table if not exists public.accuracy_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  elo integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.power_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  elo integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passing_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  elo integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goalkeeping_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  elo integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accuracy_scores add column if not exists profile_id uuid;
alter table public.accuracy_scores add column if not exists elo integer;
alter table public.accuracy_scores add column if not exists created_at timestamptz not null default now();
alter table public.accuracy_scores add column if not exists updated_at timestamptz not null default now();

alter table public.power_scores add column if not exists profile_id uuid;
alter table public.power_scores add column if not exists elo integer;
alter table public.power_scores add column if not exists created_at timestamptz not null default now();
alter table public.power_scores add column if not exists updated_at timestamptz not null default now();

alter table public.passing_scores add column if not exists profile_id uuid;
alter table public.passing_scores add column if not exists elo integer;
alter table public.passing_scores add column if not exists created_at timestamptz not null default now();
alter table public.passing_scores add column if not exists updated_at timestamptz not null default now();

alter table public.goalkeeping_scores add column if not exists profile_id uuid;
alter table public.goalkeeping_scores add column if not exists elo integer;
alter table public.goalkeeping_scores add column if not exists created_at timestamptz not null default now();
alter table public.goalkeeping_scores add column if not exists updated_at timestamptz not null default now();

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

alter table public.accuracy_scores enable row level security;
alter table public.power_scores enable row level security;
alter table public.passing_scores enable row level security;
alter table public.goalkeeping_scores enable row level security;

drop policy if exists "Anyone can read accuracy scores" on public.accuracy_scores;
create policy "Anyone can read accuracy scores" on public.accuracy_scores
  for select to anon, authenticated using (true);

drop policy if exists "Admins can write accuracy scores" on public.accuracy_scores;
create policy "Admins can write accuracy scores" on public.accuracy_scores
  for all to authenticated using (public.is_blitztiers_admin()) with check (public.is_blitztiers_admin());

drop policy if exists "Anyone can read power scores" on public.power_scores;
create policy "Anyone can read power scores" on public.power_scores
  for select to anon, authenticated using (true);

drop policy if exists "Admins can write power scores" on public.power_scores;
create policy "Admins can write power scores" on public.power_scores
  for all to authenticated using (public.is_blitztiers_admin()) with check (public.is_blitztiers_admin());

drop policy if exists "Anyone can read passing scores" on public.passing_scores;
create policy "Anyone can read passing scores" on public.passing_scores
  for select to anon, authenticated using (true);

drop policy if exists "Admins can write passing scores" on public.passing_scores;
create policy "Admins can write passing scores" on public.passing_scores
  for all to authenticated using (public.is_blitztiers_admin()) with check (public.is_blitztiers_admin());

drop policy if exists "Anyone can read goalkeeping scores" on public.goalkeeping_scores;
create policy "Anyone can read goalkeeping scores" on public.goalkeeping_scores
  for select to anon, authenticated using (true);

drop policy if exists "Admins can write goalkeeping scores" on public.goalkeeping_scores;
create policy "Admins can write goalkeeping scores" on public.goalkeeping_scores
  for all to authenticated using (public.is_blitztiers_admin()) with check (public.is_blitztiers_admin());
