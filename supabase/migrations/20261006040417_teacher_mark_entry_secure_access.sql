-- Assigned teachers may manage marks for their exact class/section/subject while
-- the school exam is a draft. Exam creation and publication remain Principal-only.

drop policy if exists "Assigned teachers read published exam subjects" on public.exam_subjects;
create policy "Assigned teachers read assigned exam subjects"
on public.exam_subjects for select to authenticated
using (exists (
  select 1
  from public.teacher_assignments a
  join public.classes c on c.id=a.class_id and c.school_id=a.school_id and c.archived_at is null
  join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id and t.left_at is null
  where a.school_id=exam_subjects.school_id and a.active
    and t.user_id=(select auth.uid())
    and lower(btrim(a.subject))=lower(btrim(exam_subjects.subject_name))
    and lower(regexp_replace(btrim(exam_subjects.class_name),'^(class|grade)[[:space:]]+','','i'))
      = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(exam_subjects.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and (a.academic_year is null or a.academic_year=c.academic_year::text)
));

drop policy if exists "Assigned teachers read published exam marks" on public.exam_marks;
create policy "Assigned teachers read assigned exam marks"
on public.exam_marks for select to authenticated
using (exists (
  select 1
  from public.exam_subjects s
  join public.teacher_assignments a on a.school_id=s.school_id and a.active
    and lower(btrim(a.subject))=lower(btrim(s.subject_name))
  join public.classes c on c.id=a.class_id and c.school_id=a.school_id and c.archived_at is null
  join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id and t.left_at is null
  join public.students st on st.id=exam_marks.student_id and st.school_id=exam_marks.school_id
  where s.id=exam_marks.subject_id and s.school_id=exam_marks.school_id
    and t.user_id=(select auth.uid())
    and lower(regexp_replace(btrim(s.class_name),'^(class|grade)[[:space:]]+','','i'))
      = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(s.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and lower(regexp_replace(btrim(st.class),'^(class|grade)[[:space:]]+','','i'))
      = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(st.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and (a.academic_year is null or a.academic_year=c.academic_year::text)
));

create policy "Assigned teachers insert draft exam marks"
on public.exam_marks for insert to authenticated
with check (exists (
  select 1
  from public.exam_subjects s
  join public.exams e on e.id=s.exam_id and e.school_id=s.school_id and e.published_at is null
  join public.teacher_assignments a on a.school_id=s.school_id and a.active
    and lower(btrim(a.subject))=lower(btrim(s.subject_name))
  join public.classes c on c.id=a.class_id and c.school_id=a.school_id and c.archived_at is null
  join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id and t.left_at is null
  join public.students st on st.id=exam_marks.student_id and st.school_id=exam_marks.school_id
  where s.id=exam_marks.subject_id and s.school_id=exam_marks.school_id
    and t.user_id=(select auth.uid())
    and lower(regexp_replace(btrim(s.class_name),'^(class|grade)[[:space:]]+','','i'))
      = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(s.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and lower(regexp_replace(btrim(st.class),'^(class|grade)[[:space:]]+','','i'))
      = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(st.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and (a.academic_year is null or a.academic_year=c.academic_year::text)
));

create policy "Assigned teachers update draft exam marks"
on public.exam_marks for update to authenticated
using (exists (
  select 1 from public.exam_subjects s
  join public.exams e on e.id=s.exam_id and e.school_id=s.school_id and e.published_at is null
  join public.teacher_assignments a on a.school_id=s.school_id and a.active and lower(btrim(a.subject))=lower(btrim(s.subject_name))
  join public.classes c on c.id=a.class_id and c.school_id=a.school_id and c.archived_at is null
  join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id and t.left_at is null
  join public.students st on st.id=exam_marks.student_id and st.school_id=exam_marks.school_id
  where s.id=exam_marks.subject_id and t.user_id=(select auth.uid())
    and lower(regexp_replace(btrim(s.class_name),'^(class|grade)[[:space:]]+','','i'))=lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(s.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and lower(regexp_replace(btrim(st.class),'^(class|grade)[[:space:]]+','','i'))=lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(st.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and (a.academic_year is null or a.academic_year=c.academic_year::text)
))
with check (exists (
  select 1 from public.exam_subjects s
  join public.exams e on e.id=s.exam_id and e.school_id=s.school_id and e.published_at is null
  join public.teacher_assignments a on a.school_id=s.school_id and a.active and lower(btrim(a.subject))=lower(btrim(s.subject_name))
  join public.classes c on c.id=a.class_id and c.school_id=a.school_id and c.archived_at is null
  join public.teachers t on t.id=a.teacher_id and t.school_id=a.school_id and t.left_at is null
  join public.students st on st.id=exam_marks.student_id and st.school_id=exam_marks.school_id
  where s.id=exam_marks.subject_id and t.user_id=(select auth.uid())
    and lower(regexp_replace(btrim(s.class_name),'^(class|grade)[[:space:]]+','','i'))=lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(s.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and lower(regexp_replace(btrim(st.class),'^(class|grade)[[:space:]]+','','i'))=lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
    and lower(btrim(coalesce(st.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
    and (a.academic_year is null or a.academic_year=c.academic_year::text)
));

create index if not exists teacher_assignments_marks_scope_idx
  on public.teacher_assignments(teacher_id,class_id,school_id,subject) where active;
