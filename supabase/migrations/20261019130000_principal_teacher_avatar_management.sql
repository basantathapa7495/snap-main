-- Let school administrators manage private teacher photos before or after a
-- portal login exists, while preserving teacher self-service avatar access.

alter table public.teachers
  add column if not exists avatar_path text;

create policy "School admins upload teacher avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'teacher-avatars'
  and (storage.foldername(name))[1] is not null
  and private.is_school_admin(((storage.foldername(name))[1])::uuid)
);

create policy "School admins read teacher avatars"
on storage.objects for select to authenticated
using (
  bucket_id = 'teacher-avatars'
  and (storage.foldername(name))[1] is not null
  and private.is_school_admin(((storage.foldername(name))[1])::uuid)
);

create policy "School admins delete teacher avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'teacher-avatars'
  and (storage.foldername(name))[1] is not null
  and private.is_school_admin(((storage.foldername(name))[1])::uuid)
);

create policy "Teachers read linked school avatar"
on storage.objects for select to authenticated
using (
  bucket_id = 'teacher-avatars'
  and exists (
    select 1
    from public.teachers t
    where t.user_id = (select auth.uid())
      and t.avatar_path = storage.objects.name
  )
);

create or replace function public.update_my_teacher_profile(
  p_name text, p_phone text, p_address text, p_date_of_birth date,
  p_gender text, p_avatar_path text
) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  v_school_id uuid;
  v_existing_avatar text;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if length(btrim(coalesce(p_name,''))) < 2 then raise exception 'Full name is required'; end if;

  select school_id, avatar_path into v_school_id, v_existing_avatar
  from public.teachers
  where user_id=(select auth.uid()) and left_at is null;

  if v_school_id is null then raise exception 'Active teacher profile not found'; end if;
  if nullif(p_avatar_path, '') is not null
    and nullif(p_avatar_path, '') is distinct from v_existing_avatar
    and (storage.foldername(p_avatar_path))[1] is distinct from (select auth.uid())::text then
    raise exception 'Invalid teacher avatar path';
  end if;

  update public.teachers set
    name=btrim(p_name), phone=nullif(btrim(p_phone),''), address=nullif(btrim(p_address),''),
    date_of_birth=p_date_of_birth, gender=nullif(p_gender,''), avatar_path=nullif(p_avatar_path,'')
  where user_id=(select auth.uid()) and school_id=v_school_id and left_at is null;

  update public.profiles set
    full_name=btrim(p_name), phone=nullif(btrim(p_phone),''), address=nullif(btrim(p_address),''),
    avatar_path=nullif(p_avatar_path,'')
  where user_id=(select auth.uid()) and school_id=v_school_id and role='teacher';

  if not found then raise exception 'Teacher account profile not found'; end if;
end;
$$;
revoke all on function public.update_my_teacher_profile(text,text,text,date,text,text) from public,anon;
grant execute on function public.update_my_teacher_profile(text,text,text,date,text,text) to authenticated;
