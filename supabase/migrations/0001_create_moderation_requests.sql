create table if not exists public.moderation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('accuracy', 'goalkeeping', 'passing', 'power')),
  code_type text not null check (code_type in ('calibration', 'clubhouse', 'golf club', 'freerunners', 'girls who drift')),
  code_number integer not null check (code_number between 1 and 24),
  requested_admin_id uuid references public.profiles(id) on delete set null,
  responding_admin_id uuid references public.profiles(id) on delete set null,
  admin_response text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table public.moderation_requests enable row level security;

drop policy if exists "Players can create their own moderation requests" on public.moderation_requests;
create policy "Players can create their own moderation requests"
  on public.moderation_requests
  for insert
  to authenticated
  with check (requester_id = auth.uid());

drop policy if exists "Players can read their own moderation requests" on public.moderation_requests;
create policy "Players can read their own moderation requests"
  on public.moderation_requests
  for select
  to authenticated
  using (requester_id = auth.uid());

drop policy if exists "Admins can read moderation requests" on public.moderation_requests;
create policy "Admins can read moderation requests"
  on public.moderation_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (profiles.username = 'IGNORANCE' or profiles.is_admin = true)
    )
  );

drop policy if exists "Admins can respond to moderation requests" on public.moderation_requests;
create policy "Admins can respond to moderation requests"
  on public.moderation_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (profiles.username = 'IGNORANCE' or profiles.is_admin = true)
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (profiles.username = 'IGNORANCE' or profiles.is_admin = true)
    )
  );
