drop policy if exists "School users read their news and calendar" on public.news_events;
create policy "School users read allowed calendar" on public.news_events for select to authenticated using (
  school_id in (select p.school_id from public.profiles p where p.user_id = (select auth.uid()))
  and (coalesce(is_event,false) = false or audience <> 'classes'
    or exists (select 1 from public.profiles p where p.user_id = (select auth.uid())
      and p.school_id = news_events.school_id and p.role in ('admin','principal','school_admin','teacher'))
    or exists (select 1 from public.students st where st.user_id = (select auth.uid())
      and st.school_id = news_events.school_id
      and (st.class || '::' || coalesce(st.section,'')) = any(news_events.class_targets)))
);
