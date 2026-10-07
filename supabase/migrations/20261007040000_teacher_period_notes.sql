-- Minimal teacher-owned notes for a scheduled class period.
create table public.teacher_period_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assignment_id uuid not null references public.teacher_assignments(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  note_date date not null,
  content text not null check (char_length(btrim(content)) between 1 and 500),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id,note_date)
);

create index teacher_period_notes_teacher_date_idx
  on public.teacher_period_notes(teacher_id,note_date desc);
alter table public.teacher_period_notes enable row level security;
grant select,insert,update,delete on public.teacher_period_notes to authenticated;

create policy "Teachers read own period notes"
on public.teacher_period_notes for select to authenticated
using (
  exists (
    select 1 from public.teacher_assignments a
    join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id
    where a.id=teacher_period_notes.assignment_id
      and a.school_id=teacher_period_notes.school_id
      and a.teacher_id=teacher_period_notes.teacher_id
      and a.active and t.user_id=(select auth.uid()) and t.left_at is null
  )
);
create policy "Teachers create own period notes"
on public.teacher_period_notes for insert to authenticated
with check (
  created_by=(select auth.uid()) and exists (
    select 1 from public.teacher_assignments a
    join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id
    where a.id=teacher_period_notes.assignment_id
      and a.school_id=teacher_period_notes.school_id
      and a.teacher_id=teacher_period_notes.teacher_id
      and a.active and t.user_id=(select auth.uid()) and t.left_at is null
  )
);
create policy "Teachers update own period notes"
on public.teacher_period_notes for update to authenticated
using (
  created_by=(select auth.uid()) and exists (
    select 1 from public.teacher_assignments a
    join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id
    where a.id=teacher_period_notes.assignment_id and a.teacher_id=teacher_period_notes.teacher_id
      and a.school_id=teacher_period_notes.school_id and a.active
      and t.user_id=(select auth.uid()) and t.left_at is null
  )
) with check (created_by=(select auth.uid()));
create policy "Teachers delete own period notes"
on public.teacher_period_notes for delete to authenticated
using (
  created_by=(select auth.uid()) and exists (
    select 1 from public.teachers t
    where t.id=teacher_period_notes.teacher_id and t.school_id=teacher_period_notes.school_id
      and t.user_id=(select auth.uid()) and t.left_at is null
  )
);
