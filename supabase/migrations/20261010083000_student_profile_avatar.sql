-- Private student profile photos. Students can only manage files inside their
-- own user-id folder, and can only attach a photo to their own profile.

alter table public.profiles add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-avatars',
  'student-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Students upload own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.students s
    where s.user_id = (select auth.uid())
  )
);

create policy "Students read own avatar"
on storage.objects for select to authenticated
using (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Students delete own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.update_my_student_avatar(p_avatar_path text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_school_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select s.school_id into v_school_id
  from public.students s
  where s.user_id = (select auth.uid())
  limit 1;

  if v_school_id is null then
    raise exception 'Student profile not found';
  end if;

  if nullif(p_avatar_path, '') is not null
    and (storage.foldername(p_avatar_path))[1] is distinct from (select auth.uid())::text then
    raise exception 'Invalid avatar path';
  end if;

  update public.profiles
  set avatar_path = nullif(p_avatar_path, '')
  where user_id = (select auth.uid())
    and school_id = v_school_id
    and role = 'student';

  if not found then
    raise exception 'Student account profile not found';
  end if;
end;
$$;

revoke all on function public.update_my_student_avatar(text) from public, anon;
grant execute on function public.update_my_student_avatar(text) to authenticated;
