-- Teaching slots use the existing teacher_assignments table. Class teacher roles
-- continue to live in classes.teacher_id.
create table public.school_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year integer not null,
  name text not null check (length(btrim(name)) between 1 and 60),
  position smallint not null check (position between 1 and 50),
  kind text not null default 'lesson' check (kind in ('lesson', 'break')),
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  constraint school_periods_times_check check (
    (start_time is null and end_time is null) or
    (start_time is not null and end_time is not null and end_time > start_time)
  ),
  unique (school_id, academic_year, position),
  unique (school_id, academic_year, name)
);

create index school_periods_school_year_idx on public.school_periods(school_id, academic_year, position);
alter table public.school_periods enable row level security;
create policy "School members view periods" on public.school_periods
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.school_id = school_periods.school_id)
  );
create policy "School admins manage periods" on public.school_periods
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.school_id = school_periods.school_id and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.school_id = school_periods.school_id and p.role = 'admin')
  );
grant select, insert, update, delete on public.school_periods to authenticated;

alter table public.teacher_assignments alter column teacher_id drop not null;
alter table public.teacher_assignments add column period_id uuid references public.school_periods(id) on delete restrict;
alter table public.teacher_assignments add column weekday smallint check (weekday between 0 and 6);
create index teacher_assignments_school_period_idx on public.teacher_assignments(school_id, period_id, weekday) where active and period_id is not null;

-- A null weekday means the slot applies every school day. Existing assignments
-- without a period remain intact and can be completed through the new editor.
create function public.validate_teaching_assignment_slot()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  class_row public.classes%rowtype;
  period_row public.school_periods%rowtype;
  conflict_row public.teacher_assignments%rowtype;
begin
  if new.period_id is null then return new; end if;

  select * into period_row from public.school_periods where id = new.period_id and school_id = new.school_id;
  if not found or period_row.kind <> 'lesson' then
    raise exception 'Choose a lesson period from this school.' using errcode = '23514';
  end if;
  if new.class_id is null then
    raise exception 'Choose a class or section for this teaching slot.' using errcode = '23514';
  end if;
  select * into class_row from public.classes where id = new.class_id and school_id = new.school_id and archived_at is null;
  if not found or class_row.academic_year <> period_row.academic_year then
    raise exception 'Choose an active class or section from the same school and year.' using errcode = '23514';
  end if;
  if new.academic_year is distinct from period_row.academic_year::text then
    raise exception 'The assignment year must match its period.' using errcode = '23514';
  end if;
  if new.teacher_id is not null and not exists (
    select 1 from public.teachers where id = new.teacher_id and school_id = new.school_id
  ) then
    raise exception 'Choose a teacher from this school.' using errcode = '23514';
  end if;
  new.class_name := coalesce(class_row.class_name, class_row.class, class_row.name, class_row.class_number);

  if not new.active then return new; end if;
  -- Serialize saves for the same school's period, including concurrent clients.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.school_id::text || ':' || new.period_id::text, 0));
  select * into conflict_row from public.teacher_assignments a
    where a.school_id = new.school_id and a.period_id = new.period_id
      and a.active and a.id is distinct from new.id
      and (a.weekday is null or new.weekday is null or a.weekday = new.weekday)
      and (a.class_id = new.class_id or (new.teacher_id is not null and a.teacher_id = new.teacher_id))
    limit 1;
  if found then
    if conflict_row.class_id = new.class_id then
      raise exception 'This class or section already has a teaching slot in that period.' using errcode = '23505';
    end if;
    raise exception 'This teacher is already assigned to another class in that period.' using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger validate_teaching_assignment_slot_before_write
before insert or update on public.teacher_assignments
for each row execute function public.validate_teaching_assignment_slot();
