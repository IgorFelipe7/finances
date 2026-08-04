-- Open Finance (Pluggy) bank connections. One row per linked institution ("item" in Pluggy's
-- vocabulary). Accounts and transactions imported from a connection are tagged with
-- external_id so re-syncing never creates duplicates.
create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pluggy_item_id text not null unique,
  connector_name text not null,
  connector_image_url text,
  status text not null default 'UPDATING',
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.bank_connections enable row level security;

create policy "Users can view their own bank connections"
  on public.bank_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bank connections"
  on public.bank_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bank connections"
  on public.bank_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bank connections"
  on public.bank_connections for delete
  using (auth.uid() = user_id);

create index if not exists bank_connections_user_id_idx on public.bank_connections(user_id);

-- Link imported accounts/transactions back to the connection that produced them, and to the
-- provider's own id so a re-sync updates the same row instead of inserting a copy.
alter table public.accounts
  add column if not exists bank_connection_id uuid references public.bank_connections(id) on delete set null,
  add column if not exists external_id text;

alter table public.transactions
  add column if not exists bank_connection_id uuid references public.bank_connections(id) on delete set null,
  add column if not exists external_id text;

create unique index if not exists accounts_external_id_unique_idx
  on public.accounts(user_id, external_id) where external_id is not null;

create unique index if not exists transactions_external_id_unique_idx
  on public.transactions(user_id, external_id) where external_id is not null;
