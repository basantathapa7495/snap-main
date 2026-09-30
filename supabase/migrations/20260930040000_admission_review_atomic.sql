-- Keep the public form as the sole source of applications; review creates a student atomically.
alter table public.admission_applications
  add column if not exists student_id uuid references public.students(id) on delete set null,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create unique index if not exists admission_applications_student_id_key
  on public.admission_applications(student_id) where student_id is not null;
create index if not exists admission_applications_school_pending_idx
  on public.admission_applications(school_id, created_at desc) where status = 'pending';

drop policy if exists "Public can submit applications" on public.admission_applications;
create policy "Public can submit pending applications" on public.admission_applications
  for insert to anon, authenticated
  with check (school_id is not null and status = 'pending'
    and student_id is null and reviewed_by is null and reviewed_at is null);

-- Review is only possible through the checked transaction below.
drop policy if exists "Admins update applications" on public.admission_applications;
drop policy if exists "Admins delete applications" on public.admission_applications;

create or replace function public.review_admission(p_application_id uuid, p_decision text)
returns public.admission_applications
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor public.profiles%rowtype;
  v_application public.admission_applications%rowtype;
  v_student_id uuid;
begin
  if p_decision not in ('approved', 'rejected') or p_decision is null then
    raise exception 'Invalid admission decision';
  end if;
  select * into v_actor from public.profiles where user_id = (select auth.uid()) and role = 'admin';
  if v_actor.school_id is null then
    raise exception 'Only a school principal can review admissions';
  end if;
  select * into v_application from public.admission_applications
    where id = p_application_id and school_id = v_actor.school_id for update;
  if not found then
    raise exception 'Application not found for your school';
  end if;
  if v_application.status = p_decision then
    return v_application;
  end if;
  if coalesce(v_application.status, 'pending') <> 'pending' then
    raise exception 'This application has already been reviewed';
  end if;
  if p_decision = 'approved' then
    insert into public.students (school_id, name, class, section, roll_no, gender, date_of_birth,
      parent_name, parent_phone, email, address)
    values (v_application.school_id, btrim(v_application.student_name), v_application.class,
      null, null, nullif(v_application.gender, ''),
      case when v_application.dob ~ '^\d{4}-\d{2}-\d{2}$' then v_application.dob::date else null end,
      nullif(btrim(v_application.parent_name), ''), nullif(btrim(v_application.parent_phone), ''),
      nullif(lower(btrim(v_application.parent_email)), ''), nullif(btrim(v_application.address), ''))
    returning id into v_student_id;
  end if;
  update public.admission_applications
    set status = p_decision, student_id = v_student_id,
        reviewed_by = (select auth.uid()), reviewed_at = now()
    where id = v_application.id returning * into v_application;
  if p_decision = 'approved' then
    insert into public.activity_logs (school_id, action_type, description, actor_name)
    values (v_application.school_id, 'admission_approved:' || v_application.id,
      v_application.student_name || ' · Grade ' || coalesce(v_application.class, ''),
      coalesce(v_actor.full_name, 'Principal'));
  end if;
  return v_application;
end;
$$;

revoke all on function public.review_admission(uuid, text) from public, anon;
grant execute on function public.review_admission(uuid, text) to authenticated;
