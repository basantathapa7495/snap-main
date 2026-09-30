create or replace function public.validate_exam_data() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_subject public.exam_subjects%rowtype; v_exam public.exams%rowtype; v_student public.students%rowtype;
begin
  if tg_table_name = 'exam_subjects' then
    select * into v_exam from public.exams where id = new.exam_id;
    if v_exam.school_id is distinct from new.school_id or v_exam.published_at is not null then
      raise exception 'Invalid or published exam';
    end if;
    if tg_op = 'UPDATE' and exists (select 1 from public.exam_marks where subject_id = old.id)
      and ((new.school_id,new.exam_id,new.class_name,new.section) is distinct from
           (old.school_id,old.exam_id,old.class_name,old.section)
        or exists (select 1 from public.exam_marks where subject_id = old.id and marks > new.full_marks)) then
      raise exception 'Cannot move a subject or lower full marks below saved marks';
    end if;
  else
    select * into v_subject from public.exam_subjects where id = new.subject_id;
    select * into v_exam from public.exams where id = v_subject.exam_id;
    select * into v_student from public.students where id = new.student_id;
    if v_subject.school_id is distinct from new.school_id or v_student.school_id is distinct from new.school_id
      or v_student.class is distinct from v_subject.class_name
      or coalesce(v_student.section, '') <> v_subject.section
      or new.marks > v_subject.full_marks or v_exam.published_at is not null then
      raise exception 'Invalid marks, student, or published exam';
    end if;
    new.updated_at := now();
  end if;
  return new;
end; $$;
