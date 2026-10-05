-- Teacher Students: assigned-class result access and minimal private student notes.
-- Existing Principal policies and behavior are unchanged.

create policy "Assigned teachers read published exam subjects"
on public.exam_subjects for select to authenticated
using (
  exists (
    select 1
    from public.exams e
    join public.teacher_assignments a
      on a.school_id = exam_subjects.school_id
     and a.active
     and lower(btrim(a.subject)) = lower(btrim(exam_subjects.subject_name))
    join public.classes c
      on c.id = a.class_id and c.school_id = a.school_id and c.archived_at is null
    join public.teachers t
      on t.id = a.teacher_id and t.school_id = a.school_id
    where e.id = exam_subjects.exam_id
      and e.school_id = exam_subjects.school_id
      and e.published_at is not null
      and t.user_id = (select auth.uid()) and t.left_at is null
      and lower(regexp_replace(btrim(exam_subjects.class_name), '^(class|grade)[[:space:]]+', '', 'i'))
        = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
      and lower(btrim(coalesce(exam_subjects.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
      and (a.academic_year is null or a.academic_year = c.academic_year::text)
  )
);

create policy "Assigned teachers read published exam marks"
on public.exam_marks for select to authenticated
using (
  exists (
    select 1
    from public.exam_subjects s
    join public.exams e on e.id = s.exam_id and e.school_id = s.school_id and e.published_at is not null
    join public.teacher_assignments a on a.school_id = s.school_id and a.active and lower(btrim(a.subject)) = lower(btrim(s.subject_name))
    join public.classes c on c.id = a.class_id and c.school_id = a.school_id and c.archived_at is null
    join public.teachers t on t.id = a.teacher_id and t.school_id = a.school_id
    join public.students st on st.id = exam_marks.student_id and st.school_id = exam_marks.school_id
    where s.id = exam_marks.subject_id and s.school_id = exam_marks.school_id
      and t.user_id = (select auth.uid()) and t.left_at is null
      and lower(regexp_replace(btrim(s.class_name), '^(class|grade)[[:space:]]+', '', 'i'))
        = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
      and lower(btrim(coalesce(s.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
      and lower(regexp_replace(btrim(st.class), '^(class|grade)[[:space:]]+', '', 'i'))
        = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
      and lower(btrim(coalesce(st.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
      and (a.academic_year is null or a.academic_year = c.academic_year::text)
  )
);

create table public.student_teacher_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_teacher_notes_student_created_idx on public.student_teacher_notes(student_id, created_at desc);
create index student_teacher_notes_teacher_idx on public.student_teacher_notes(teacher_id);
alter table public.student_teacher_notes enable row level security;
grant select, insert on public.student_teacher_notes to authenticated;

create policy "Assigned teachers read student notes"
on public.student_teacher_notes for select to authenticated
using (
  exists (
    select 1 from public.students st
    join public.classes c on c.school_id = st.school_id and c.archived_at is null
      and lower(regexp_replace(btrim(st.class), '^(class|grade)[[:space:]]+', '', 'i')) = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
      and lower(btrim(coalesce(st.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
    join public.teacher_assignments a on a.class_id = c.id and a.school_id = c.school_id and a.active
    join public.teachers t on t.id = a.teacher_id and t.school_id = a.school_id
    where st.id = student_teacher_notes.student_id and st.school_id = student_teacher_notes.school_id
      and t.user_id = (select auth.uid()) and t.left_at is null
      and (a.academic_year is null or a.academic_year = c.academic_year::text)
  )
);

create policy "Assigned teachers create student notes"
on public.student_teacher_notes for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.students st
    join public.classes c on c.school_id = st.school_id and c.archived_at is null
      and lower(regexp_replace(btrim(st.class), '^(class|grade)[[:space:]]+', '', 'i')) = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
      and lower(btrim(coalesce(st.section,''))) = lower(btrim(coalesce(c.section_name,c.section,'')))
    join public.teacher_assignments a on a.class_id = c.id and a.school_id = c.school_id and a.active
    join public.teachers t on t.id = a.teacher_id and t.school_id = a.school_id
    where st.id = student_teacher_notes.student_id and st.school_id = student_teacher_notes.school_id
      and t.id = student_teacher_notes.teacher_id
      and t.user_id = (select auth.uid()) and t.left_at is null
      and (a.academic_year is null or a.academic_year = c.academic_year::text)
  )
);
