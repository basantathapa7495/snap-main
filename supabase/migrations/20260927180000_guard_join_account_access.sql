-- Pending or rejected school joiners must not create a profile or use an
-- existing profile to reach school-scoped RLS policies. Service role approvals
-- bypass RLS and still create memberships normally.
create policy "Unapproved joiners cannot read profiles"
on public.profiles as restrictive for select to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'approval_status', '') not in ('pending', 'rejected'));

create policy "Unapproved joiners cannot create profiles"
on public.profiles as restrictive for insert to authenticated
with check (coalesce(auth.jwt()->'app_metadata'->>'approval_status', '') not in ('pending', 'rejected'));

create policy "Unapproved joiners cannot change profiles"
on public.profiles as restrictive for update to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'approval_status', '') not in ('pending', 'rejected'))
with check (coalesce(auth.jwt()->'app_metadata'->>'approval_status', '') not in ('pending', 'rejected'));

create or replace function private.protect_profile_membership()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and
    (new.user_id is distinct from old.user_id or new.school_id is distinct from old.school_id or new.role is distinct from old.role) then
    raise exception 'School membership and role can only be changed by an administrator';
  end if;
  return new;
end;
$$;

create trigger protect_profile_membership_on_update
before update on public.profiles for each row
execute function private.protect_profile_membership();
