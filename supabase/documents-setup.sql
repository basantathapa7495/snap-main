-- Run this once in the Supabase SQL Editor.
-- It creates a private document bucket and restricts each school to its own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-documents',
  'school-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "School admins can view their documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'school-documents'
  and exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.school_id::text = (storage.foldername(name))[1]
      and profiles.role = 'admin'
  )
);

create policy "School admins can upload their documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'school-documents'
  and exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.school_id::text = (storage.foldername(name))[1]
      and profiles.role = 'admin'
  )
);

create policy "School admins can update their documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'school-documents'
  and exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.school_id::text = (storage.foldername(name))[1]
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'school-documents'
  and exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.school_id::text = (storage.foldername(name))[1]
      and profiles.role = 'admin'
  )
);

create policy "School admins can delete their documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'school-documents'
  and exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.school_id::text = (storage.foldername(name))[1]
      and profiles.role = 'admin'
  )
);
