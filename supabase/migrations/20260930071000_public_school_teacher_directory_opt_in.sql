alter table public.schools add column if not exists show_teachers boolean not null default false;
create or replace view public.public_school_teachers with (security_barrier=true) as
select t.school_id, t.id, t.name, t.subject, t.qualification
from public.teachers t join public.schools s on s.id=t.school_id
where s.is_approved=true and s.show_teachers=true and t.left_at is null
  and coalesce(t.employment_status,'active') not in ('inactive','left');
grant select on public.public_school_teachers to anon, authenticated;
