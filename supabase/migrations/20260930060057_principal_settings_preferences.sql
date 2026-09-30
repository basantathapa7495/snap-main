alter table public.schools
  add column if not exists online_admissions_enabled boolean not null default true,
  add column if not exists public_website_enabled boolean not null default true,
  add column if not exists student_portal_enabled boolean not null default true,
  add column if not exists teacher_portal_enabled boolean not null default true,
  add column if not exists birthday_alerts_enabled boolean not null default true,
  add column if not exists grading_system text not null default 'percentage',
  add column if not exists grade_scale jsonb not null default '[]'::jsonb,
  add column if not exists default_pass_mark numeric(5,2) not null default 40,
  add column if not exists attendance_method text not null default 'daily',
  add column if not exists minimum_attendance_pct numeric(5,2) not null default 75,
  add column if not exists low_attendance_alert_pct numeric(5,2) not null default 75,
  add column if not exists settings_updated_at timestamptz,
  add column if not exists settings_updated_by uuid references auth.users(id) on delete set null;

alter table public.schools drop constraint if exists schools_grading_system_check;
alter table public.schools add constraint schools_grading_system_check check (grading_system in ('percentage','gpa','both'));
alter table public.schools drop constraint if exists schools_attendance_method_check;
alter table public.schools add constraint schools_attendance_method_check check (attendance_method = 'daily');
alter table public.schools drop constraint if exists schools_default_pass_mark_check;
alter table public.schools add constraint schools_default_pass_mark_check check (default_pass_mark between 0 and 100);
alter table public.schools drop constraint if exists schools_attendance_thresholds_check;
alter table public.schools add constraint schools_attendance_thresholds_check check (
  minimum_attendance_pct between 0 and 100 and low_attendance_alert_pct between 0 and minimum_attendance_pct
);
alter table public.schools drop constraint if exists schools_grade_scale_check;
alter table public.schools add constraint schools_grade_scale_check check (jsonb_typeof(grade_scale) = 'array');

drop policy if exists "Public can view approved schools" on public.schools;
create policy "Public can view visible approved schools or own school" on public.schools
  for select to anon, authenticated
  using (
    (is_approved = true and public_website_enabled = true)
    or id in (select p.school_id from public.profiles p where p.user_id = (select auth.uid()))
  );

drop policy if exists "Public can submit pending applications" on public.admission_applications;
create policy "Public can submit enabled pending applications" on public.admission_applications
  for insert to anon, authenticated
  with check (
    school_id is not null and status = 'pending' and student_id is null and reviewed_by is null and reviewed_at is null
    and exists (
      select 1 from public.schools s
      where s.id = school_id and s.is_approved = true and s.public_website_enabled = true and s.online_admissions_enabled = true
    )
  );
