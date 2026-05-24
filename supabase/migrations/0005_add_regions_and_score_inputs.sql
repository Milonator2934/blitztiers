alter table public.accuracy_scores add column if not exists region text not null default 'NA';
alter table public.power_scores add column if not exists region text not null default 'NA';
alter table public.passing_scores add column if not exists region text not null default 'NA';
alter table public.goalkeeping_scores add column if not exists region text not null default 'NA';

alter table public.accuracy_scores add column if not exists input_values jsonb not null default '{}'::jsonb;
alter table public.power_scores add column if not exists input_values jsonb not null default '{}'::jsonb;
alter table public.passing_scores add column if not exists input_values jsonb not null default '{}'::jsonb;
alter table public.goalkeeping_scores add column if not exists input_values jsonb not null default '{}'::jsonb;

alter table public.moderation_requests add column if not exists region text not null default 'NA';

alter table public.accuracy_scores drop constraint if exists accuracy_scores_region_check;
alter table public.power_scores drop constraint if exists power_scores_region_check;
alter table public.passing_scores drop constraint if exists passing_scores_region_check;
alter table public.goalkeeping_scores drop constraint if exists goalkeeping_scores_region_check;
alter table public.moderation_requests drop constraint if exists moderation_requests_region_check;

alter table public.accuracy_scores
  add constraint accuracy_scores_region_check check (region in ('NA', 'EU'));
alter table public.power_scores
  add constraint power_scores_region_check check (region in ('NA', 'EU'));
alter table public.passing_scores
  add constraint passing_scores_region_check check (region in ('NA', 'EU'));
alter table public.goalkeeping_scores
  add constraint goalkeeping_scores_region_check check (region in ('NA', 'EU'));
alter table public.moderation_requests
  add constraint moderation_requests_region_check check (region in ('NA', 'EU'));

drop index if exists public.accuracy_scores_profile_id_key;
drop index if exists public.power_scores_profile_id_key;
drop index if exists public.passing_scores_profile_id_key;
drop index if exists public.goalkeeping_scores_profile_id_key;

create unique index if not exists accuracy_scores_profile_id_region_key
  on public.accuracy_scores (profile_id, region);
create unique index if not exists power_scores_profile_id_region_key
  on public.power_scores (profile_id, region);
create unique index if not exists passing_scores_profile_id_region_key
  on public.passing_scores (profile_id, region);
create unique index if not exists goalkeeping_scores_profile_id_region_key
  on public.goalkeeping_scores (profile_id, region);

notify pgrst, 'reload schema';
