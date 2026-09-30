-- Qualify the outer Storage object path so inner teacher aliases cannot shadow it.

drop policy if exists "Teachers upload teacher communication files" on storage.objects;
create policy "Teachers upload teacher communication files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'teacher-communication'
  and (storage.foldername(storage.objects.name))[4] = (select auth.uid())::text
  and (storage.foldername(storage.objects.name))[2] in ('notices','messages')
  and exists (
    select 1 from public.teachers t
    where t.user_id = (select auth.uid())
      and t.school_id::text = (storage.foldername(storage.objects.name))[1]
      and t.left_at is null
  )
  and (
    (storage.foldername(storage.objects.name))[2] = 'notices'
    or (
      (storage.foldername(storage.objects.name))[3] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and exists (
        select 1
        from public.teacher_student_conversations c
        join public.teachers t on t.id = c.teacher_id
        join public.teacher_assignments ta
          on ta.teacher_id = t.id
         and ta.school_id = c.school_id
         and ta.class_id = c.class_id
         and ta.active
        where c.id = ((storage.foldername(storage.objects.name))[3])::uuid
          and c.school_id::text = (storage.foldername(storage.objects.name))[1]
          and t.user_id = (select auth.uid())
          and t.left_at is null
      )
    )
  )
);

drop policy if exists "Teachers delete own teacher communication files" on storage.objects;
create policy "Teachers delete own teacher communication files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'teacher-communication'
  and (storage.foldername(storage.objects.name))[4] = (select auth.uid())::text
  and exists (
    select 1 from public.teachers t
    where t.user_id = (select auth.uid())
      and t.school_id::text = (storage.foldername(storage.objects.name))[1]
      and t.left_at is null
  )
);
