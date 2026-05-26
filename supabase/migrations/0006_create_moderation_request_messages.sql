create table if not exists public.moderation_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.moderation_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists moderation_request_messages_request_id_created_at_idx
  on public.moderation_request_messages (request_id, created_at);

alter table public.moderation_request_messages enable row level security;

drop policy if exists "Request owners and admins can read request messages" on public.moderation_request_messages;
create policy "Request owners and admins can read request messages"
  on public.moderation_request_messages
  for select
  to authenticated
  using (
    public.is_blitztiers_admin()
    or exists (
      select 1
      from public.moderation_requests
      where moderation_requests.id = moderation_request_messages.request_id
        and moderation_requests.requester_id = auth.uid()
    )
  );

drop policy if exists "Request owners and admins can create request messages" on public.moderation_request_messages;
create policy "Request owners and admins can create request messages"
  on public.moderation_request_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and (
      public.is_blitztiers_admin()
      or exists (
        select 1
        from public.moderation_requests
        where moderation_requests.id = moderation_request_messages.request_id
          and moderation_requests.requester_id = auth.uid()
      )
    )
  );
