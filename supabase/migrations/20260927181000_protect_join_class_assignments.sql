-- A teacher's student-join approval scope is based on assigned classes.
-- Keep class assignment and identity under school administration control.
create or replace function private.protect_join_class_assignments()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'teacher'
  ) then
    if tg_op = 'INSERT' then
      raise exception 'Only school administrators can create classes';
    end if;
    if new.teacher_id is distinct from old.teacher_id
       or new.class_name is distinct from old.class_name
       or new.class is distinct from old.class
       or new.name is distinct from old.name
       or new.class_number is distinct from old.class_number
       or new.section is distinct from old.section
       or new.section_name is distinct from old.section_name
       or new.school_id is distinct from old.school_id then
      raise exception 'Only school administrators can change class assignments';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_join_class_assignments_on_write
before insert or update on public.classes for each row
execute function private.protect_join_class_assignments();
