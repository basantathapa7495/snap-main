-- Teacher self-profile: editable personal details, protected employment fields,
-- and a private avatar bucket. Existing Principal access is unchanged.

alter table public.teachers add column if not exists gender text;
alter table public.teachers drop constraint if exists teachers_gender_check;
alter table public.teachers add constraint teachers_gender_check
  check (gender is null or gender in ('male','female','other','prefer_not_to_say'));

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path=public,pg_temp as $$
  select role from public.profiles where user_id=(select auth.uid()) limit 1
$$;
revoke all on function public.current_profile_role() from public,anon;
grant execute on function public.current_profile_role() to authenticated;

create policy "Teachers update only own teacher row"
on public.teachers as restrictive for update to authenticated
using (
  public.current_profile_role() is distinct from 'teacher'
  or user_id=(select auth.uid())
)
with check (
  public.current_profile_role() is distinct from 'teacher'
  or user_id=(select auth.uid())
);

create policy "Teachers preserve own profile membership"
on public.profiles as restrictive for update to authenticated
using (
  public.current_profile_role() is distinct from 'teacher'
  or user_id=(select auth.uid())
)
with check (
  public.current_profile_role() is distinct from 'teacher'
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
  if public.current_profile_role() = 'teacher' then
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
revoke all on function public.protect_teacher_employment_fields() from public, anon, authenticated;

drop trigger if exists protect_teacher_employment_fields_trigger on public.teachers;
create trigger protect_teacher_employment_fields_trigger before update on public.teachers
for each row execute function public.protect_teacher_employment_fields();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('teacher-avatars','teacher-avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Teachers upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id='teacher-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='teacher'));
create policy "Teachers read own avatar" on storage.objects for select to authenticated
using (bucket_id='teacher-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Teachers delete own avatar" on storage.objects for delete to authenticated
using (bucket_id='teacher-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.update_my_teacher_profile(
  p_name text, p_phone text, p_address text, p_date_of_birth date,
  p_gender text, p_avatar_path text
) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_school_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if length(btrim(coalesce(p_name,''))) < 2 then raise exception 'Full name is required'; end if;
  select school_id into v_school_id from public.teachers
    where user_id=(select auth.uid()) and left_at is null;
  if v_school_id is null then raise exception 'Active teacher profile not found'; end if;

  update public.teachers set
    name=btrim(p_name), phone=nullif(btrim(p_phone),''), address=nullif(btrim(p_address),''),
    date_of_birth=p_date_of_birth, gender=nullif(p_gender,'')
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
