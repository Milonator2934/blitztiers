create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_blitztiers_super_admin()
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
      and username = 'IGNORANCE'
  );
$$;

grant execute on function public.is_blitztiers_super_admin() to authenticated;

drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Anyone can read profiles"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Super admin can update profiles" on public.profiles;
create policy "Super admin can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_blitztiers_super_admin())
  with check (public.is_blitztiers_super_admin());
