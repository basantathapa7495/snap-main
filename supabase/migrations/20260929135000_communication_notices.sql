-- Extend the existing school notices table for the principal Communication workflow.
alter table public.notices
  add column if not exists status text not null default 'published',
  add column if not exists target_class text,
  add column if not exists target_section text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id) on delete set null;

update public.notices set published_at = coalesce(created_at, now())
where status = 'published' and published_at is null;

alter table public.notices
  add constraint notices_status_valid check (status in ('published','scheduled','draft')),
  add constraint notices_audience_valid check (target_audience in ('all','teachers','students','class','section')),
  add constraint notices_target_valid check (
    (target_audience not in ('class','section') or nullif(btrim(target_class),'') is not null)
    and (target_audience <> 'section' or nullif(btrim(target_section),'') is not null)
  ),
  add constraint notices_schedule_valid check (status <> 'scheduled' or scheduled_at is not null);

create index if not exists notices_school_status_created_idx on public.notices (school_id, status, created_at desc);
create index if not exists notices_scheduled_due_idx on public.notices (scheduled_at) where status = 'scheduled';

-- Remove permissive legacy policies before drafts are saved in this table.
drop policy if exists "Public can view notices" on public.notices;
drop policy if exists "Users can view their school's notices" on public.notices;
drop policy if exists "Users can add notices to their school" on public.notices;
drop policy if exists "Users can update their school's notices" on public.notices;
drop policy if exists "Users can delete their school's notices" on public.notices;

create policy "Published school-wide notices are public" on public.notices
  for select to anon, authenticated
  using (status = 'published' and target_audience = 'all');

create policy "Principals manage their school notices" on public.notices
  for all to authenticated
  using (exists (
    select 1 from public.profiles p where p.user_id = (select auth.uid())
      and p.school_id = notices.school_id and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p where p.user_id = (select auth.uid())
      and p.school_id = notices.school_id and p.role = 'admin'
  ));

create policy "School members read targeted published notices" on public.notices
  for select to authenticated
  using (status = 'published' and (
    (target_audience = 'teachers' and exists (
      select 1 from public.teachers t where t.school_id = notices.school_id and t.user_id = (select auth.uid())
    ))
    or (target_audience in ('students','class','section') and exists (
      select 1 from public.students s where s.school_id = notices.school_id and s.user_id = (select auth.uid())
        and (target_audience = 'students' or (
          lower(regexp_replace(btrim(s.class), '^(class|grade)[[:space:]]+', '', 'i')) = lower(regexp_replace(btrim(notices.target_class), '^(class|grade)[[:space:]]+', '', 'i'))
          and (target_audience = 'class' or lower(btrim(s.section)) = lower(btrim(notices.target_section)))
        ))
    ))
  ));

-- Supabase Cron publishes notices even when no principal has the page open.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('publish-due-school-notices', '* * * * *',
  $$update public.notices set status = 'published', published_at = scheduled_at, updated_at = now()
    where status = 'scheduled' and scheduled_at <= now()$$
);
