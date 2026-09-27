-- School join codes are kept outside public.schools, which is readable by visitors.
-- public.account_requests already supplies join request ID, school_id,
-- auth_user_id (user_id), requested_role (role), status, created_at,
-- reviewed_by (approved_by), and reviewed_at (approved_at).

create table if not exists public.school_join_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  school_code text not null unique check (school_code ~ '^[0-9]{6}$'),
  teacher_join_code text not null check (teacher_join_code ~ '^[0-9]{6}$'),
  student_join_code text not null check (student_join_code ~ '^[0-9]{6}$'),
  teacher_join_enabled boolean not null default false,
  student_join_enabled boolean not null default false,
  constraint distinct_school_join_codes check (
    school_code <> teacher_join_code and school_code <> student_join_code
    and teacher_join_code <> student_join_code
  )
);

alter table public.school_join_settings enable row level security;
revoke all on public.school_join_settings from public, anon, authenticated;
grant select on public.school_join_settings to authenticated;
grant update (teacher_join_code, student_join_code, teacher_join_enabled, student_join_enabled)
  on public.school_join_settings to authenticated;
grant select, insert, update, delete on public.school_join_settings to service_role;

create policy "School principals view join settings"
on public.school_join_settings for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.user_id = (select auth.uid())
    and p.school_id = school_join_settings.school_id
    and p.role in ('principal', 'admin', 'school_admin')
));

create policy "School principals edit join settings"
on public.school_join_settings for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.user_id = (select auth.uid())
    and p.school_id = school_join_settings.school_id
    and p.role in ('principal', 'admin', 'school_admin')
))
with check (exists (
  select 1 from public.profiles p
  where p.user_id = (select auth.uid())
    and p.school_id = school_join_settings.school_id
    and p.role in ('principal', 'admin', 'school_admin')
));

-- Generate six digits from cryptographically random bytes. Keep the helper
-- inside the existing non-API private schema.
create or replace function private.random_school_join_code()
returns text language plpgsql set search_path = '' as $$
declare
  bytes bytea := extensions.gen_random_bytes(4);
  number bigint;
begin
  number := (
    get_byte(bytes, 0)::bigint * 16777216
    + get_byte(bytes, 1)::bigint * 65536
    + get_byte(bytes, 2)::bigint * 256
    + get_byte(bytes, 3)::bigint
  ) % 900000 + 100000;
  return number::text;
end;
$$;

create or replace function private.create_school_join_settings()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  school_code_value text;
  teacher_code_value text;
  student_code_value text;
begin
  loop
    school_code_value := private.random_school_join_code();
    teacher_code_value := private.random_school_join_code();
    student_code_value := private.random_school_join_code();
    if school_code_value = teacher_code_value
      or school_code_value = student_code_value
      or teacher_code_value = student_code_value then continue; end if;

    insert into public.school_join_settings
      (school_id, school_code, teacher_join_code, student_join_code)
    values (new.id, school_code_value, teacher_code_value, student_code_value)
    on conflict (school_code) do nothing;

    exit when exists (
      select 1 from public.school_join_settings where school_id = new.id
    );
  end loop;
  return new;
end;
$$;

revoke all on function private.random_school_join_code() from public, anon, authenticated;
revoke all on function private.create_school_join_settings() from public, anon, authenticated;

create trigger school_join_settings_on_school_insert
after insert on public.schools
for each row execute function private.create_school_join_settings();

-- Backfill existing schools without changing their public records.
do $$
declare existing_school record;
declare school_code_value text;
declare teacher_code_value text;
declare student_code_value text;
begin
  for existing_school in select id from public.schools loop
    if exists (select 1 from public.school_join_settings where school_id = existing_school.id) then continue; end if;
    loop
      school_code_value := private.random_school_join_code();
      teacher_code_value := private.random_school_join_code();
      student_code_value := private.random_school_join_code();
      if school_code_value = teacher_code_value
        or school_code_value = student_code_value
        or teacher_code_value = student_code_value then continue; end if;
      insert into public.school_join_settings
        (school_id, school_code, teacher_join_code, student_join_code)
      values (existing_school.id, school_code_value, teacher_code_value, student_code_value)
      on conflict (school_code) do nothing;
      exit when exists (
        select 1 from public.school_join_settings where school_id = existing_school.id
      );
    end loop;
  end loop;
end;
$$;
