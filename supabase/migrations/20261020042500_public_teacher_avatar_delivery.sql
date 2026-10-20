-- Profile pictures are display assets shown throughout the teacher directory.
-- Public delivery uses Supabase's CDN and avoids a database-backed signed URL
-- request for every avatar. Existing RLS policies still control authenticated
-- upload, replacement, and deletion; object paths contain random UUIDs.
update storage.buckets
set public = true
where id = 'teacher-avatars';
