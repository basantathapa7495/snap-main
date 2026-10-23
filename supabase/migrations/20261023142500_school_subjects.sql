create table if not exists public.school_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists school_subjects_school_name_unique
  on public.school_subjects (school_id, lower(btrim(name)));

create index if not exists school_subjects_school_sort_idx
  on public.school_subjects (school_id, sort_order, created_at);

alter table public.school_subjects enable row level security;

grant select, insert, update, delete on table public.school_subjects to authenticated;
grant all on table public.school_subjects to service_role;

create policy "School members read subjects"
on public.school_subjects
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.school_id = school_subjects.school_id
  )
);

create policy "School admins insert subjects"
on public.school_subjects
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.school_id = school_subjects.school_id
      and p.role = 'admin'
  )
);

create policy "School admins update subjects"
on public.school_subjects
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.school_id = school_subjects.school_id
      and p.role = 'admin'
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.school_id = school_subjects.school_id
      and p.role = 'admin'
  )
);

create policy "School admins delete subjects"
on public.school_subjects
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.school_id = school_subjects.school_id
      and p.role = 'admin'
  )
);
