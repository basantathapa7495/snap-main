drop policy if exists "Users can add exams to their school" on public.exams;
drop policy if exists "Users can update their school's exams" on public.exams;
drop policy if exists "Users can delete their school's exams" on public.exams;

create policy "Principals create school exams" on public.exams for insert to authenticated
  with check (school_id in (select school_id from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'));
create policy "Principals update school exams" on public.exams for update to authenticated
  using (school_id in (select school_id from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'))
  with check (school_id in (select school_id from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'));
create policy "Principals delete draft school exams" on public.exams for delete to authenticated
  using (published_at is null and school_id in (select school_id from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'));
