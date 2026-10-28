-- Allow the period manager to persist drag-and-drop ordering atomically.
alter table public.school_periods
  drop constraint if exists school_periods_school_year_shift_position_key;

alter table public.school_periods
  add constraint school_periods_school_year_shift_position_key
  unique (school_id, academic_year, shift, position)
  deferrable initially immediate;

create or replace function public.reorder_school_periods(p_period_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_school_id uuid;
  v_academic_year integer;
  v_shift text;
  v_scope_count integer;
  v_unique_count integer;
begin
  if p_period_ids is null or cardinality(p_period_ids) = 0 then
    raise exception 'Choose at least one period.' using errcode = '22023';
  end if;

  select p.school_id, p.academic_year, p.shift
    into v_school_id, v_academic_year, v_shift
  from public.school_periods p
  where p.id = p_period_ids[1];

  if not found then
    raise exception 'Period schedule not found.' using errcode = 'P0002';
  end if;

  select count(*) into v_scope_count
  from public.school_periods p
  where p.school_id = v_school_id
    and p.academic_year = v_academic_year
    and p.shift = v_shift;

  select count(distinct item) into v_unique_count
  from unnest(p_period_ids) as item;

  if v_scope_count <> cardinality(p_period_ids)
     or v_unique_count <> cardinality(p_period_ids)
     or exists (
       select 1
       from unnest(p_period_ids) as requested(id)
       left join public.school_periods p on p.id = requested.id
       where p.id is null
          or p.school_id <> v_school_id
          or p.academic_year <> v_academic_year
          or p.shift <> v_shift
     ) then
    raise exception 'The reorder request must include every period in one school schedule exactly once.'
      using errcode = '23514';
  end if;

  set constraints school_periods_school_year_shift_position_key deferred;

  update public.school_periods p
  set position = requested.position::smallint
  from unnest(p_period_ids) with ordinality as requested(id, position)
  where p.id = requested.id;
end;
$$;

revoke all on function public.reorder_school_periods(uuid[]) from public, anon;
grant execute on function public.reorder_school_periods(uuid[]) to authenticated;
