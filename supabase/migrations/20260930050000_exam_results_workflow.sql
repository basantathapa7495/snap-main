alter table public.exams add column if not exists academic_year integer,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references auth.users(id);

create table if not exists public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  class_name text not null,
  section text not null default '',
  subject_name text not null,
  full_marks numeric(7,2) not null check (full_marks > 0),
  pass_marks numeric(7,2) not null check (pass_marks >= 0 and pass_marks <= full_marks),
  unique (exam_id, class_name, section, subject_name)
);
create index if not exists exam_subjects_school_exam_idx on public.exam_subjects(school_id, exam_id);

create table if not exists public.exam_marks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  subject_id uuid not null references public.exam_subjects(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  marks numeric(7,2) not null check (marks >= 0),
  updated_at timestamptz not null default now(),
  unique (subject_id, student_id)
);
create index if not exists exam_marks_school_subject_idx on public.exam_marks(school_id, subject_id);

create or replace function public.validate_exam_data() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_subject public.exam_subjects%rowtype; v_exam public.exams%rowtype; v_student public.students%rowtype;
begin
  if tg_table_name = 'exam_subjects' then
    select * into v_exam from public.exams where id = new.exam_id;
    if v_exam.school_id is distinct from new.school_id or v_exam.published_at is not null then
      raise exception 'Invalid or published exam';
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
create trigger validate_exam_subject before insert or update on public.exam_subjects
  for each row execute function public.validate_exam_data();
create trigger validate_exam_mark before insert or update on public.exam_marks
  for each row execute function public.validate_exam_data();

create or replace function public.guard_exam_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_exam public.exams%rowtype;
begin
  if tg_table_name = 'exams' then
    if (new.published_at is distinct from old.published_at or new.published_by is distinct from old.published_by)
      and current_setting('app.publishing_exam', true) is distinct from 'yes' then
      raise exception 'Publish through the exam review action';
    end if;
    if old.published_at is not null and (new.name, new.start_date, new.end_date, new.academic_year)
      is distinct from (old.name, old.start_date, old.end_date, old.academic_year) then
      raise exception 'Published exams cannot be edited';
    end if;
  else
    select * into v_exam from public.exams where id = case when tg_table_name = 'exam_subjects' then old.exam_id
      else (select exam_id from public.exam_subjects where id = old.subject_id) end;
    if v_exam.published_at is not null then raise exception 'Published exam data cannot be removed'; end if;
  end if;
  return old;
end; $$;
create trigger guard_exam_update before update on public.exams for each row execute function public.guard_exam_publication();
create trigger guard_subject_delete before delete on public.exam_subjects for each row execute function public.guard_exam_publication();
create trigger guard_mark_delete before delete on public.exam_marks for each row execute function public.guard_exam_publication();

alter table public.exam_subjects enable row level security;
alter table public.exam_marks enable row level security;
create policy "School exam subjects read" on public.exam_subjects for select to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid())));
create policy "Principal exam subjects insert" on public.exam_subjects for insert to authenticated
  with check (school_id in (select school_id from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Principal exam subjects update" on public.exam_subjects for update to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid()) and role = 'admin'))
  with check (school_id in (select school_id from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Principal exam subjects delete" on public.exam_subjects for delete to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "School exam marks read" on public.exam_marks for select to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid())));
create policy "Principal exam marks insert" on public.exam_marks for insert to authenticated
  with check (school_id in (select school_id from public.profiles where user_id = (select auth.uid()) and role = 'admin'));
create policy "Principal exam marks update" on public.exam_marks for update to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid()) and role = 'admin'))
  with check (school_id in (select school_id from public.profiles where user_id = (select auth.uid()) and role = 'admin'));

create or replace function public.publish_exam(p_exam_id uuid) returns public.exams
language plpgsql security definer set search_path = '' as $$
declare v_actor public.profiles%rowtype; v_exam public.exams%rowtype;
begin
  select * into v_actor from public.profiles where user_id = (select auth.uid()) and role = 'admin';
  select * into v_exam from public.exams where id = p_exam_id and school_id = v_actor.school_id for update;
  if v_exam.id is null then raise exception 'Exam not found for your school'; end if;
  if v_exam.published_at is not null then return v_exam; end if;
  if not exists (select 1 from public.exam_subjects where exam_id = v_exam.id) then
    raise exception 'Add subjects before publishing';
  end if;
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
revoke all on function public.publish_exam(uuid) from public, anon;
grant execute on function public.publish_exam(uuid) to authenticated;
