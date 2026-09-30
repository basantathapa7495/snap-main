alter table public.schools
  add column if not exists website_updated_at timestamptz,
  add column if not exists website_updated_by uuid references auth.users(id) on delete set null;
