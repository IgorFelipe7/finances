-- Named savings goals. A goal is thin metadata (name, target amount, target date, color) on
-- top of a dedicated `savings`-type account, which already has full balance tracking via the
-- existing transactions table — no separate contribution-tracking table needed.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  target_date date,
  color text not null default '#6366f1',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_account_id_idx on public.goals(account_id);
