create schema if not exists private;
create function private.is_current_student_assignment_target(p_assignment_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.assignment_targets at join public.students st on st.id=at.student_id where at.assignment_id=p_assignment_id and st.user_id=(select auth.uid()) and st.school_id=at.school_id)
$$;
revoke all on function private.is_current_student_assignment_target(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.is_current_student_assignment_target(uuid) to authenticated;
drop policy "Students read assigned assignments" on public.assignments;
create policy "Students read assigned assignments" on public.assignments for select to authenticated using (
  exists(select 1 from public.students st join public.classes c on c.id=assignments.class_id and c.school_id=st.school_id
    where st.user_id=(select auth.uid()) and st.school_id=assignments.school_id
      and lower(regexp_replace(btrim(st.class),'^(class|grade)[[:space:]]+','','i'))=lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)),'^(class|grade)[[:space:]]+','','i'))
      and lower(btrim(coalesce(st.section,'')))=lower(btrim(coalesce(c.section_name,c.section,'')))
      and (assignments.target_mode='class' or private.is_current_student_assignment_target(assignments.id))
  )
);
