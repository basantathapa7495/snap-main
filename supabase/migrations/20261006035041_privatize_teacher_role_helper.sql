-- Keep the role lookup used by RLS outside the exposed public API schema.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.current_profile_role()
returns text language sql stable security definer set search_path=public,pg_temp as $$
  select role from public.profiles where user_id=(select auth.uid()) limit 1
$$;
revoke all on function private.current_profile_role() from public,anon;
grant execute on function private.current_profile_role() to authenticated;

drop policy "Teachers update only own teacher row" on public.teachers;
create policy "Teachers update only own teacher row"
on public.teachers as restrictive for update to authenticated
using (
  private.current_profile_role() is distinct from 'teacher'
  or user_id=(select auth.uid())
)
with check (
  private.current_profile_role() is distinct from 'teacher'
  or user_id=(select auth.uid())
);

drop policy "Teachers preserve own profile membership" on public.profiles;
create policy "Teachers preserve own profile membership"
on public.profiles as restrictive for update to authenticated
using (
  private.current_profile_role() is distinct from 'teacher'
  or user_id=(select auth.uid())
)
with check (
  private.current_profile_role() is distinct from 'teacher'
  or (
    user_id=(select auth.uid())
    and role='teacher'
    and exists (
      select 1 from public.teachers t
      where t.user_id=(select auth.uid()) and t.school_id=profiles.school_id and t.left_at is null
    )
  )
);

create or replace function public.protect_teacher_employment_fields()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if private.current_profile_role() = 'teacher' then
    if old.id is distinct from new.id
      or old.school_id is distinct from new.school_id
      or old.subject is distinct from new.subject
      or old.email is distinct from new.email
      or old.qualification is distinct from new.qualification
      or old.salary is distinct from new.salary
      or old.temp_password is distinct from new.temp_password
      or old.user_id is distinct from new.user_id
      or old.department is distinct from new.department
      or old.joining_date is distinct from new.joining_date
      or old.employment_status is distinct from new.employment_status
      or old.result_performance is distinct from new.result_performance
      or old.assignment_completion is distinct from new.assignment_completion
      or old.student_feedback is distinct from new.student_feedback
      or old.employee_id is distinct from new.employee_id
      or old.left_at is distinct from new.left_at then
      raise exception 'School-managed employment fields cannot be changed by teachers';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.protect_teacher_employment_fields() from public,anon,authenticated;

drop function public.current_profile_role();
