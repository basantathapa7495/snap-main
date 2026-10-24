-- Branch on the trigger table before accessing its row fields.
CREATE OR REPLACE FUNCTION public.guard_exam_publication()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_exam public.exams%rowtype;
begin
  if tg_table_name = 'exams' then
    if tg_op = 'DELETE' then
      if old.published_at is not null then raise exception 'Published exams cannot be deleted'; end if;
      return old;
    end if;
    if (new.published_at is distinct from old.published_at or new.published_by is distinct from old.published_by)
      and current_setting('app.publishing_exam', true) is distinct from 'yes' then
      raise exception 'Publish through the exam review action';
    end if;
    if old.published_at is not null and (new.name, new.start_date, new.end_date, new.academic_year, new.school_id)
      is distinct from (old.name, old.start_date, old.end_date, old.academic_year, old.school_id) then
      raise exception 'Published exams cannot be edited';
    end if;
  else
    if tg_table_name = 'exam_subjects' then
      select * into v_exam from public.exams where id = old.exam_id;
    elsif tg_table_name = 'exam_marks' then
      select e.* into v_exam from public.exams e
        join public.exam_subjects s on s.exam_id = e.id where s.id = old.subject_id;
    else
      raise exception 'Unsupported exam publication trigger table';
    end if;
    if v_exam.published_at is not null then raise exception 'Published exam data cannot be removed'; end if;
  end if;
  if tg_op = 'UPDATE' then return new; end if;
  return old;
end; $function$;
