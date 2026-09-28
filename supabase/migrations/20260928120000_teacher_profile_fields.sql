-- Optional details on the existing teacher record; no separate profile table.
alter table public.teachers add column if not exists employee_id text;
alter table public.teachers add column if not exists left_at date;
