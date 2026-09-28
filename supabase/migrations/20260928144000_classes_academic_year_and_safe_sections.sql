alter table public.classes add column if not exists academic_year integer;
alter table public.classes add column if not exists archived_at timestamptz;
-- Existing rows have no year. Keep them in the current 2083 school year.
update public.classes set academic_year = 2083 where academic_year is null;
alter table public.classes alter column academic_year set not null;
alter table public.schools add column if not exists highest_grade smallint;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'schools_highest_grade_check') then
    alter table public.schools add constraint schools_highest_grade_check check (highest_grade is null or highest_grade in (5,8,10,12));
  end if;
end $$;
create unique index if not exists classes_active_school_year_name_section_key
  on public.classes (school_id, academic_year,
    lower(btrim(coalesce(class_name, class, name, class_number, ''))),
    lower(btrim(coalesce(section_name, section, ''))))
  where archived_at is null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'classes_teacher_school_fkey') then
    alter table public.classes add constraint classes_teacher_school_fkey
      foreign key (teacher_id, school_id) references public.teachers (id, school_id);
  end if;
end $$;
