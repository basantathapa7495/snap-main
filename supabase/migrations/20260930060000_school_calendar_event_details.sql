alter table public.news_events
  add column if not exists end_date date,
  add column if not exists end_time text,
  add column if not exists all_day boolean not null default false,
  add column if not exists audience text not null default 'public',
  add column if not exists class_targets text[] not null default '{}',
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.news_events
  add constraint news_events_calendar_dates_check check (end_date is null or event_date is null or end_date >= event_date),
  add constraint news_events_calendar_audience_check check (audience in ('public','school','classes'));
create index if not exists news_events_school_event_date_idx
  on public.news_events(school_id, event_date) where is_event = true;

drop policy if exists "Public reads news" on public.news_events;
drop policy if exists "School users manage news" on public.news_events;
create policy "Public reads public news and calendar" on public.news_events for select to anon, authenticated
  using (coalesce(is_event,false) = false or audience = 'public');
create policy "School users read their news and calendar" on public.news_events for select to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid())));
create policy "Principals create school news and calendar" on public.news_events for insert to authenticated
  with check (school_id in (select school_id from public.profiles where user_id = (select auth.uid())
    and role in ('admin','principal','school_admin')));
create policy "Principals update school news and calendar" on public.news_events for update to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid())
    and role in ('admin','principal','school_admin')))
  with check (school_id in (select school_id from public.profiles where user_id = (select auth.uid())
    and role in ('admin','principal','school_admin')));
create policy "Principals delete school news and calendar" on public.news_events for delete to authenticated
  using (school_id in (select school_id from public.profiles where user_id = (select auth.uid())
    and role in ('admin','principal','school_admin')));
