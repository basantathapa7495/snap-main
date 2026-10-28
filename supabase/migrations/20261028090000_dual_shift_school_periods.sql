-- Support separate morning and day schedules without changing existing schools.
alter table public.classes
  add column if not exists shift text not null default 'day'
  check (shift in ('morning', 'day'));

alter table public.school_periods
  add column if not exists shift text not null default 'day'
  check (shift in ('morning', 'day'));

alter table public.school_periods
  drop constraint if exists school_periods_school_id_academic_year_position_key,
  drop constraint if exists school_periods_school_id_academic_year_name_key;

alter table public.school_periods
  add constraint school_periods_school_year_shift_position_key
    unique (school_id, academic_year, shift, position),
  add constraint school_periods_school_year_shift_name_key
    unique (school_id, academic_year, shift, name);

drop index if exists public.school_periods_school_year_idx;
create index school_periods_school_year_shift_idx
  on public.school_periods(school_id, academic_year, shift, position);
create index classes_school_year_shift_idx
  on public.classes(school_id, academic_year, shift)
  where archived_at is null;

create or replace function public.validate_school_period_time()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.start_time is null then
    return new;
  end if;

  if exists (
    select 1
    from public.school_periods p
    where p.school_id = new.school_id
      and p.academic_year = new.academic_year
      and p.shift = new.shift
      and p.id is distinct from new.id
      and p.start_time is not null
      and new.start_time < p.end_time
      and new.end_time > p.start_time
  ) then
    raise exception 'This time overlaps another period in the selected shift.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_school_period_time_before_write on public.school_periods;
create trigger validate_school_period_time_before_write
before insert or update on public.school_periods
for each row execute function public.validate_school_period_time();

create or replace function public.validate_assignment_period_shift()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  class_shift text;
  period_shift text;
begin
  if new.period_id is null or new.class_id is null then
    return new;
  end if;

  select c.shift into class_shift
  from public.classes c
  where c.id = new.class_id and c.school_id = new.school_id;

  select p.shift into period_shift
  from public.school_periods p
  where p.id = new.period_id and p.school_id = new.school_id;

  if class_shift is distinct from period_shift then
    raise exception 'Choose a period from the class shift.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_assignment_period_shift_before_write on public.teacher_assignments;
create trigger validate_assignment_period_shift_before_write
before insert or update on public.teacher_assignments
for each row execute function public.validate_assignment_period_shift();

comment on column public.classes.shift is
  'Operating shift for the class or section. Existing classes remain on the day shift.';
comment on column public.school_periods.shift is
  'Morning and day schedules have independent ordering, names, and times.';
