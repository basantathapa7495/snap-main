-- A due day is optional; existing fee types retain no scheduled due date.
alter table public.fee_types
  add column if not exists due_day smallint
  check (due_day between 1 and 31);
