create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  subject text not null check (char_length(btrim(subject)) between 1 and 120),
  assignment_type text not null default 'homework' check (assignment_type in ('homework','project','worksheet','practical','reading','other')),
  description text check (description is null or char_length(description)<=4000),
  due_at timestamptz not null,
  allow_late boolean not null default false,
  target_mode text not null default 'class' check (target_mode in ('class','students')),
  status text not null default 'active' check (status in ('active','completed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.assignment_targets (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  primary key (assignment_id,student_id)
);
create table public.assignment_files (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size between 1 and 10485760),
  created_at timestamptz not null default now()
);
create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_note text check (student_note is null or char_length(student_note)<=2000),
  submitted_at timestamptz not null default now(),
  feedback text check (feedback is null or char_length(feedback)<=3000),
  feedback_updated_at timestamptz,
  feedback_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id,student_id)
);
create table public.assignment_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.assignment_submissions(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size between 1 and 10485760),
  created_at timestamptz not null default now()
);
create index assignments_teacher_due_idx on public.assignments(teacher_id,due_at desc);
create index assignments_class_due_idx on public.assignments(class_id,due_at desc);
create index assignment_targets_student_idx on public.assignment_targets(student_id,assignment_id);
create index assignment_submissions_assignment_idx on public.assignment_submissions(assignment_id,submitted_at desc);
create index assignment_files_assignment_idx on public.assignment_files(assignment_id);
create index assignment_files_school_idx on public.assignment_files(school_id);
create index assignment_submission_files_submission_idx on public.assignment_submission_files(submission_id);
create index assignment_submission_files_school_idx on public.assignment_submission_files(school_id);
create index assignment_submissions_student_idx on public.assignment_submissions(student_id);
create index assignment_submissions_school_idx on public.assignment_submissions(school_id);
create index assignment_submissions_feedback_by_idx on public.assignment_submissions(feedback_by) where feedback_by is not null;
create index assignment_targets_school_idx on public.assignment_targets(school_id);
create index assignments_school_idx on public.assignments(school_id);
create index assignments_created_by_idx on public.assignments(created_by);
alter table public.assignments enable row level security;
alter table public.assignment_targets enable row level security;
alter table public.assignment_files enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.assignment_submission_files enable row level security;
grant select,insert,update,delete on public.assignments,public.assignment_targets,public.assignment_files,public.assignment_submissions,public.assignment_submission_files to authenticated;
create schema if not exists private;
create function private.is_current_student_assignment_target(p_assignment_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.assignment_targets at join public.students st on st.id=at.student_id where at.assignment_id=p_assignment_id and st.user_id=(select auth.uid()) and st.school_id=at.school_id)
$$;
revoke all on function private.is_current_student_assignment_target(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.is_current_student_assignment_target(uuid) to authenticated;

create policy "Teachers manage authorized assignments" on public.assignments for all to authenticated
using (exists(select 1 from public.teachers t where t.id=assignments.teacher_id and t.school_id=assignments.school_id and t.user_id=(select auth.uid()) and t.left_at is null))
with check (
  created_by=(select auth.uid()) and exists(
    select 1 from public.teachers t join public.teacher_assignments ta on ta.teacher_id=t.id and ta.school_id=t.school_id and ta.active
    where t.id=assignments.teacher_id and t.user_id=(select auth.uid()) and t.left_at is null
      and ta.class_id=assignments.class_id and lower(btrim(ta.subject))=lower(btrim(assignments.subject))
  )
);
create policy "Students read assigned assignments" on public.assignments for select to authenticated using (
  exists(select 1 from public.students st join public.classes c on c.id=assignments.class_id and c.school_id=st.school_id
    where st.user_id=(select auth.uid()) and st.school_id=assignments.school_id
      and lower(regexp_replace(btrim(st.class),'^(class|grade)[[:space:]]+','','i'))=lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
      and lower(btrim(coalesce(st.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
      and (assignments.target_mode='class' or private.is_current_student_assignment_target(assignments.id))
  )
);
create policy "Teachers manage assignment targets" on public.assignment_targets for all to authenticated
using (exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=assignment_targets.assignment_id and t.user_id=(select auth.uid()) and a.school_id=assignment_targets.school_id))
with check (exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id join public.students st on st.id=assignment_targets.student_id and st.school_id=a.school_id where a.id=assignment_targets.assignment_id and t.user_id=(select auth.uid()) and a.school_id=assignment_targets.school_id));
create policy "Students read own assignment targets" on public.assignment_targets for select to authenticated using (exists(select 1 from public.students st where st.id=assignment_targets.student_id and st.user_id=(select auth.uid()) and st.school_id=assignment_targets.school_id));
create policy "Authorized users read assignment files" on public.assignment_files for select to authenticated using (exists(select 1 from public.assignments a where a.id=assignment_files.assignment_id and a.school_id=assignment_files.school_id));
create policy "Teachers manage assignment files" on public.assignment_files for all to authenticated
using (exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=assignment_files.assignment_id and t.user_id=(select auth.uid())))
with check (exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=assignment_files.assignment_id and a.school_id=assignment_files.school_id and t.user_id=(select auth.uid())));
create policy "Teachers read class submissions" on public.assignment_submissions for select to authenticated using (exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=assignment_submissions.assignment_id and a.school_id=assignment_submissions.school_id and t.user_id=(select auth.uid())));
create policy "Students manage own submission" on public.assignment_submissions for all to authenticated
using (exists(select 1 from public.students st where st.id=assignment_submissions.student_id and st.user_id=(select auth.uid()) and st.school_id=assignment_submissions.school_id))
with check (exists(select 1 from public.students st join public.assignments a on a.id=assignment_submissions.assignment_id and a.school_id=st.school_id where st.id=assignment_submissions.student_id and st.user_id=(select auth.uid()) and st.school_id=assignment_submissions.school_id and (a.allow_late or now()<=a.due_at) and (a.target_mode='class' or exists(select 1 from public.assignment_targets at where at.assignment_id=a.id and at.student_id=st.id))));
create policy "Teachers update submission feedback" on public.assignment_submissions for update to authenticated
using (exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=assignment_submissions.assignment_id and t.user_id=(select auth.uid())))
with check (exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=assignment_submissions.assignment_id and a.school_id=assignment_submissions.school_id and t.user_id=(select auth.uid())));

create function public.protect_assignment_submission_fields() returns trigger language plpgsql set search_path='' as $$
begin
  if exists(select 1 from public.students st where st.id=old.student_id and st.user_id=(select auth.uid())) then
    if new.feedback is distinct from old.feedback or new.feedback_updated_at is distinct from old.feedback_updated_at or new.feedback_by is distinct from old.feedback_by then
      raise exception 'Students cannot change teacher feedback';
    end if;
  elsif exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=old.assignment_id and t.user_id=(select auth.uid())) then
    if new.assignment_id is distinct from old.assignment_id or new.student_id is distinct from old.student_id or new.school_id is distinct from old.school_id or new.student_note is distinct from old.student_note or new.submitted_at is distinct from old.submitted_at then
      raise exception 'Teachers can only update feedback';
    end if;
  else
    raise exception 'Submission access denied';
  end if;
  return new;
end $$;
revoke all on function public.protect_assignment_submission_fields() from public,anon,authenticated;
create trigger protect_assignment_submission_fields before update on public.assignment_submissions for each row execute function public.protect_assignment_submission_fields();
create policy "Submission owners read files" on public.assignment_submission_files for select to authenticated using (exists(select 1 from public.assignment_submissions s join public.students st on st.id=s.student_id where s.id=assignment_submission_files.submission_id and (st.user_id=(select auth.uid()) or exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=s.assignment_id and t.user_id=(select auth.uid())))));
create policy "Students manage submission files" on public.assignment_submission_files for all to authenticated
using (exists(select 1 from public.assignment_submissions s join public.students st on st.id=s.student_id where s.id=assignment_submission_files.submission_id and st.user_id=(select auth.uid())))
with check (exists(select 1 from public.assignment_submissions s join public.students st on st.id=s.student_id where s.id=assignment_submission_files.submission_id and s.school_id=assignment_submission_files.school_id and st.user_id=(select auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('assignment-files','assignment-files',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Assignment participants upload files" on storage.objects for insert to authenticated with check (
 bucket_id='assignment-files' and (storage.foldername(name))[4]=(select auth.uid())::text and (
  ((storage.foldername(name))[2]='assignments' and exists(select 1 from public.assignments a join public.teachers t on t.id=a.teacher_id where a.id=((storage.foldername(name))[3])::uuid and a.school_id::text=(storage.foldername(name))[1] and t.user_id=(select auth.uid())))
  or ((storage.foldername(name))[2]='submissions' and exists(select 1 from public.assignment_submissions s join public.students st on st.id=s.student_id where s.id=((storage.foldername(name))[3])::uuid and s.school_id::text=(storage.foldername(name))[1] and st.user_id=(select auth.uid())))
 )
);
create policy "Assignment participants read files" on storage.objects for select to authenticated using (
 bucket_id='assignment-files' and (
  ((storage.foldername(name))[2]='assignments' and exists(select 1 from public.assignments a where a.id=((storage.foldername(name))[3])::uuid and a.school_id::text=(storage.foldername(name))[1]))
  or ((storage.foldername(name))[2]='submissions' and exists(select 1 from public.assignment_submissions s where s.id=((storage.foldername(name))[3])::uuid and s.school_id::text=(storage.foldername(name))[1]))
 )
);
create policy "Assignment participants delete own files" on storage.objects for delete to authenticated using (
 bucket_id='assignment-files' and (storage.foldername(name))[4]=(select auth.uid())::text
);
