-- Existing teacher photos have been copied to the private R2 bucket and
-- verified there. Retain the old Supabase objects for rollback, but stop
-- serving them to anonymous users. Existing Storage RLS policies are intact.
update storage.buckets
set public = false
where id = 'teacher-avatars';
