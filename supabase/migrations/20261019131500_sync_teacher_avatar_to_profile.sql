-- Keep the teacher portal profile in sync when a school administrator changes
-- a linked teacher's avatar from the principal-side staff form.

create or replace function private.sync_teacher_avatar_to_profile()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
begin
  if new.user_id is not null and new.avatar_path is distinct from old.avatar_path then
    update public.profiles
    set avatar_path = new.avatar_path
    where user_id = new.user_id
      and school_id = new.school_id
      and role = 'teacher';
  end if;
  return new;
end;
$$;

revoke all on function private.sync_teacher_avatar_to_profile() from public, anon, authenticated;

drop trigger if exists sync_teacher_avatar_to_profile_trigger on public.teachers;
create trigger sync_teacher_avatar_to_profile_trigger
after update of avatar_path on public.teachers
for each row execute function private.sync_teacher_avatar_to_profile();
