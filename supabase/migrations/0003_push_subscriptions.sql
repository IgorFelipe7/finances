-- Web Push subscriptions, one row per browser/device the user opted in from.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can view their own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

-- Scheduling note: this table only stores WHO to notify. Sending is done by the
-- send-bill-reminders Edge Function, triggered on a schedule via pg_cron + pg_net —
-- see the "Push notifications" section in README.md for the exact one-time setup SQL,
-- since it needs your project's URL/service key baked into the cron job itself.
