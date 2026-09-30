revoke all on public.exam_subjects, public.exam_marks from anon, authenticated;
grant select, insert, update, delete on public.exam_subjects to authenticated;
grant select, insert, update on public.exam_marks to authenticated;

drop policy if exists "School exam subjects read" on public.exam_subjects;
create policy "Principal or own published subjects" on public.exam_subjects for select to authenticated using (
  exists (select 1 from public.profiles p where p.user_id = (select auth.uid())
    and p.school_id = exam_subjects.school_id and p.role = 'admin')
  or (exists (select 1 from public.exams e where e.id = exam_subjects.exam_id and e.published_at is not null)
    and exists (select 1 from public.students st where st.user_id = (select auth.uid())
      and st.school_id = exam_subjects.school_id and st.class = exam_subjects.class_name
      and coalesce(st.section, '') = exam_subjects.section))
);
drop policy if exists "School exam marks read" on public.exam_marks;
create policy "Principal or own published marks" on public.exam_marks for select to authenticated using (
  exists (select 1 from public.profiles p where p.user_id = (select auth.uid())
    and p.school_id = exam_marks.school_id and p.role = 'admin')
  or (student_id in (select id from public.students where user_id = (select auth.uid()))
    and exists (select 1 from public.exam_subjects s join public.exams e on e.id = s.exam_id
      where s.id = exam_marks.subject_id and e.published_at is not null))
);

-- Published data and exams with saved results remain durable.
create or replace function public.guard_exam_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
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
    select * into v_exam from public.exams where id = case when tg_table_name = 'exam_subjects' then old.exam_id
      else (select exam_id from public.exam_subjects where id = old.subject_id) end;
    if v_exam.published_at is not null then raise exception 'Published exam data cannot be removed'; end if;
  end if;
  return old;
end; $$;
create trigger guard_exam_delete before delete on public.exams for each row execute function public.guard_exam_publication();

create or replace function public.publish_exam(p_exam_id uuid) returns public.exams
language plpgsql security definer set search_path = '' as $$
declare v_actor public.profiles%rowtype; v_exam public.exams%rowtype;
begin
  select * into v_actor from public.profiles where user_id = (select auth.uid()) and role = 'admin';
  select * into v_exam from public.exams where id = p_exam_id and school_id = v_actor.school_id for update;
  if v_exam.id is null then raise exception 'Exam not found for your school'; end if;
  if v_exam.published_at is not null then return v_exam; end if;
  if not exists (select 1 from public.exam_subjects where exam_id = v_exam.id) then
    raise exception 'Add subjects before publishing'; end if;
  if exists (select 1 from public.exam_subjects s where s.exam_id = v_exam.id
    and not exists (select 1 from public.students st where st.school_id = s.school_id
      and st.class = s.class_name and coalesce(st.section, '') = s.section)) then
    raise exception 'A configured class has no students'; end if;
  if exists (
    select 1 from public.exam_subjects s join public.students st
      on st.school_id = s.school_id and st.class = s.class_name and coalesce(st.section, '') = s.section
    left join public.exam_marks m on m.subject_id = s.id and m.student_id = st.id
    where s.exam_id = v_exam.id and m.id is null
  ) then raise exception 'Enter every student mark before publishing'; end if;
  perform set_config('app.publishing_exam', 'yes', true);
  update public.exams set published_at = now(), published_by = (select auth.uid())
    where id = v_exam.id returning * into v_exam;
  return v_exam;
end; $$;
