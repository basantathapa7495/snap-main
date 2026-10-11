create table if not exists public.student_support_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('account_login','profile_information','timetable','assignments','exams_results','documents','notices','other')),
  subject text not null check (char_length(btrim(subject)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  screenshot_path text,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_support_reports_school_created_idx on public.student_support_reports (school_id, created_at desc);
create index if not exists student_support_reports_creator_idx on public.student_support_reports (created_by, created_at desc);

alter table public.student_support_reports enable row level security;

drop policy if exists "Students create own support reports" on public.student_support_reports;
create policy "Students create own support reports" on public.student_support_reports for insert to authenticated with check (
  created_by = auth.uid() and exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'student' and p.school_id = student_support_reports.school_id
  )
);

drop policy if exists "Students read own support reports" on public.student_support_reports;
create policy "Students read own support reports" on public.student_support_reports for select to authenticated using (created_by = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-support-screenshots','student-support-screenshots',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Students upload own support screenshots" on storage.objects;
create policy "Students upload own support screenshots" on storage.objects for insert to authenticated with check (
  bucket_id = 'student-support-screenshots' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Students read own support screenshots" on storage.objects;
create policy "Students read own support screenshots" on storage.objects for select to authenticated using (
  bucket_id = 'student-support-screenshots' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Students delete own support screenshots" on storage.objects;
create policy "Students delete own support screenshots" on storage.objects for delete to authenticated using (
  bucket_id = 'student-support-screenshots' and (storage.foldername(name))[1] = auth.uid()::text
);
