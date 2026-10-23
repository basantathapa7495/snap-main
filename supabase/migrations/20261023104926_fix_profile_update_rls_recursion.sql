-- Prevent profiles -> teachers -> profiles RLS recursion while preserving
-- teacher ownership, school membership, and active-employment checks.
create or replace function private.is_current_active_teacher_for_school(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.teachers t
    where t.user_id = (select auth.uid())
      and t.school_id = target_school_id
      and t.left_at is null
  )
$$;

revoke all on function private.is_current_active_teacher_for_school(uuid) from public, anon;
grant execute on function private.is_current_active_teacher_for_school(uuid) to authenticated;

drop policy if exists "Teachers preserve own profile membership" on public.profiles;

create policy "Teachers preserve own profile membership"
on public.profiles
as restrictive
for update
to authenticated
using (
  private.current_profile_role() is distinct from 'teacher'
  or user_id = (select auth.uid())
)
with check (
  private.current_profile_role() is distinct from 'teacher'
  or (
    user_id = (select auth.uid())
    and role = 'teacher'
    and private.is_current_active_teacher_for_school(school_id)
  )
);
