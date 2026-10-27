insert into public.school_leave_types (school_id, code, name, allocation_days, active)
select schools.id, defaults.code, defaults.name, null, true
from public.schools
cross join (values
  ('sick', 'Sick'),
  ('casual', 'Casual'),
  ('emergency', 'Emergency'),
  ('medical', 'Medical'),
  ('other', 'Other')
) as defaults(code, name)
on conflict (school_id, code) do update
set name = excluded.name,
    active = true;
