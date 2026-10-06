-- Teacher Attendance: prevent duplicate daily marks and restrict teacher writes
-- to classes where the teacher is the configured class teacher. Principal
-- policies and behavior remain unchanged.

create unique index if not exists attendance_school_student_date_uidx
  on public.attendance (school_id, student_id, attendance_date)
  where student_id is not null;

create index if not exists attendance_school_date_idx
  on public.attendance (school_id, attendance_date desc);

create policy "Class teachers insert assigned attendance"
on public.attendance as restrictive for insert to authenticated
with check (
  not exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role = 'teacher'
  )
  or exists (
    select 1
    from public.students s
    join public.classes c
      on c.school_id = s.school_id
     and c.archived_at is null
     and lower(regexp_replace(btrim(s.class), '^(class|grade)[[:space:]]+', '', 'i'))
       = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
     and lower(btrim(coalesce(s.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
    join public.teachers t
      on t.id = c.teacher_id and t.school_id = c.school_id
    where s.id = attendance.student_id
      and s.school_id = attendance.school_id
      and t.user_id = (select auth.uid())
      and t.left_at is null
  )
);

create policy "Class teachers update assigned attendance"
on public.attendance as restrictive for update to authenticated
using (
  not exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role = 'teacher'
  )
  or exists (
    select 1 from public.students s
    join public.classes c
      on c.school_id = s.school_id and c.archived_at is null
     and lower(regexp_replace(btrim(s.class), '^(class|grade)[[:space:]]+', '', 'i'))
       = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
     and lower(btrim(coalesce(s.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
    join public.teachers t on t.id = c.teacher_id and t.school_id = c.school_id
    where s.id = attendance.student_id and s.school_id = attendance.school_id
      and t.user_id = (select auth.uid()) and t.left_at is null
  )
)
with check (
  not exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role = 'teacher'
  )
  or exists (
    select 1 from public.students s
    join public.classes c
      on c.school_id = s.school_id and c.archived_at is null
     and lower(regexp_replace(btrim(s.class), '^(class|grade)[[:space:]]+', '', 'i'))
       = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
     and lower(btrim(coalesce(s.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
    join public.teachers t on t.id = c.teacher_id and t.school_id = c.school_id
    where s.id = attendance.student_id and s.school_id = attendance.school_id
      and t.user_id = (select auth.uid()) and t.left_at is null
  )
);

create policy "Class teachers delete assigned attendance"
on public.attendance as restrictive for delete to authenticated
using (
  not exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role = 'teacher'
  )
  or exists (
    select 1 from public.students s
    join public.classes c
      on c.school_id = s.school_id and c.archived_at is null
     and lower(regexp_replace(btrim(s.class), '^(class|grade)[[:space:]]+', '', 'i'))
       = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
     and lower(btrim(coalesce(s.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
    join public.teachers t on t.id = c.teacher_id and t.school_id = c.school_id
    where s.id = attendance.student_id and s.school_id = attendance.school_id
      and t.user_id = (select auth.uid()) and t.left_at is null
  )
);
