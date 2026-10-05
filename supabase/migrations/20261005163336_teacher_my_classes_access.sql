-- Teacher My Classes: additive read restrictions; existing Principal policies are untouched.
-- Non-teacher roles retain exactly their existing policy evaluation. No elevated functions.

create policy "Teacher My Classes scope teacher_assignments"
on public.teacher_assignments as restrictive for select to authenticated
using (not (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher')) or (exists (select 1 from public.teachers t where t.id = teacher_assignments.teacher_id and t.user_id = (select auth.uid()) and t.school_id = teacher_assignments.school_id and t.left_at is null) and active));

create policy "Teacher My Classes scope teacher_timetable_entries"
on public.teacher_timetable_entries as restrictive for select to authenticated
using (not (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher')) or (exists (select 1 from public.teachers t where t.id = teacher_timetable_entries.teacher_id and t.user_id = (select auth.uid()) and t.school_id = teacher_timetable_entries.school_id and t.left_at is null)));

create policy "Teacher My Classes scope classes"
on public.classes as restrictive for select to authenticated
using (not (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher')) or (archived_at is null and exists (
  select 1 from public.teacher_assignments a join public.teachers t on t.id = a.teacher_id and t.school_id = a.school_id
  where a.class_id = classes.id and a.school_id = classes.school_id and a.active
    and (a.academic_year is null or a.academic_year = classes.academic_year::text)
    and t.user_id = (select auth.uid()) and t.left_at is null
)));

create policy "Teacher My Classes scope students"
on public.students as restrictive for select to authenticated
using (not (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher')) or (exists (
  select 1 from public.classes c
  where c.school_id = students.school_id and c.archived_at is null
    and lower(regexp_replace(btrim(students.class), '^(class|grade)[[:space:]]+', '', 'i'))
      = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
    and lower(btrim(coalesce(students.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
    and exists (
      select 1 from public.teacher_assignments a join public.teachers t on t.id = a.teacher_id and t.school_id = a.school_id
      where a.class_id = c.id and a.school_id = c.school_id and a.active
        and (a.academic_year is null or a.academic_year = c.academic_year::text)
        and t.user_id = (select auth.uid()) and t.left_at is null
    )
)));

create policy "Teacher My Classes scope attendance"
on public.attendance as restrictive for select to authenticated
using (not (exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.role = 'teacher')) or (exists (select 1 from public.students s where s.id = attendance.student_id and s.school_id = attendance.school_id)));

-- Existing notices are reused by the class Notes tab. Share published class notices
-- with teachers who have an active assignment, including section-safe legacy targets.
create policy "Assigned teachers read published class notices"
on public.notices for select to authenticated
using (
  status = 'published' and target_audience in ('class','section')
  and exists (
    select 1 from public.teachers t
    join public.teacher_assignments a on a.teacher_id = t.id and a.school_id = t.school_id and a.active
    join public.classes c on c.id = a.class_id and c.school_id = a.school_id and c.archived_at is null
    where t.user_id = (select auth.uid()) and t.left_at is null and t.school_id = notices.school_id
      and (a.academic_year is null or a.academic_year = c.academic_year::text)
      and (
        notices.target_class_id = c.id
        or (notices.target_class_id is null
          and lower(regexp_replace(btrim(notices.target_class), '^(class|grade)[[:space:]]+', '', 'i'))
            = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
          and (nullif(btrim(notices.target_section),'') is null
            or lower(btrim(notices.target_section)) = lower(btrim(coalesce(c.section_name,c.section,''))))
        )
      )
  )
);
