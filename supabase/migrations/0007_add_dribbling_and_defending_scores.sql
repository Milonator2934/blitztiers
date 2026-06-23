create table if not exists public.dribbling_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  elo integer not null,
  region text not null default 'NA',
  input_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.defending_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  elo integer not null,
  region text not null default 'NA',
  input_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dribbling_scores add column if not exists profile_id uuid;
alter table public.dribbling_scores add column if not exists elo integer;
alter table public.dribbling_scores add column if not exists region text not null default 'NA';
alter table public.dribbling_scores add column if not exists input_values jsonb not null default '{}'::jsonb;
alter table public.dribbling_scores add column if not exists created_at timestamptz not null default now();
alter table public.dribbling_scores add column if not exists updated_at timestamptz not null default now();

alter table public.defending_scores add column if not exists profile_id uuid;
alter table public.defending_scores add column if not exists elo integer;
alter table public.defending_scores add column if not exists region text not null default 'NA';
alter table public.defending_scores add column if not exists input_values jsonb not null default '{}'::jsonb;
alter table public.defending_scores add column if not exists created_at timestamptz not null default now();
alter table public.defending_scores add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'dribbling_scores_profile_id_fkey') then
    alter table public.dribbling_scores
      add constraint dribbling_scores_profile_id_fkey
      foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'defending_scores_profile_id_fkey') then
    alter table public.defending_scores
      add constraint defending_scores_profile_id_fkey
      foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

alter table public.dribbling_scores drop constraint if exists dribbling_scores_region_check;
alter table public.defending_scores drop constraint if exists defending_scores_region_check;

alter table public.dribbling_scores
  add constraint dribbling_scores_region_check check (region in ('NA', 'EU'));
alter table public.defending_scores
  add constraint defending_scores_region_check check (region in ('NA', 'EU'));

create unique index if not exists dribbling_scores_profile_id_region_key
  on public.dribbling_scores (profile_id, region);
create unique index if not exists defending_scores_profile_id_region_key
  on public.defending_scores (profile_id, region);

alter table public.dribbling_scores enable row level security;
alter table public.defending_scores enable row level security;

drop policy if exists "Anyone can read dribbling scores" on public.dribbling_scores;
create policy "Anyone can read dribbling scores" on public.dribbling_scores
  for select to anon, authenticated using (true);

drop policy if exists "Admins can write dribbling scores" on public.dribbling_scores;
create policy "Admins can write dribbling scores" on public.dribbling_scores
  for all to authenticated using (public.is_blitztiers_admin()) with check (public.is_blitztiers_admin());

drop policy if exists "Anyone can read defending scores" on public.defending_scores;
create policy "Anyone can read defending scores" on public.defending_scores
  for select to anon, authenticated using (true);

drop policy if exists "Admins can write defending scores" on public.defending_scores;
create policy "Admins can write defending scores" on public.defending_scores
  for all to authenticated using (public.is_blitztiers_admin()) with check (public.is_blitztiers_admin());

alter table public.moderation_requests drop constraint if exists moderation_requests_category_check;
alter table public.moderation_requests
  add constraint moderation_requests_category_check
  check (category in ('accuracy', 'goalkeeping', 'passing', 'power', 'dribbling', 'defending'));

notify pgrst, 'reload schema';
