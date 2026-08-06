-- Flexible recurrence for fixed transactions, beyond "same day-of-month". Null keeps the
-- original day-of-month behavior (derived from the transaction's own `date`) — every existing
-- row stays fully compatible with no backfill needed. When set, it's one of:
--   {"type":"weekday_occurrence","weekday":0-6,"occurrence":1-4|-1}  -- e.g. "toda 1ª segunda" (-1 = última)
--   {"type":"business_day","n":1-23,"countSaturday":boolean}         -- e.g. "5º dia útil do mês"
alter table public.transactions
  add column if not exists recurrence_rule jsonb;
