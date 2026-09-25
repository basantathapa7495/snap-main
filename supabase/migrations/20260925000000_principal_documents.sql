create schema if not exists private;

create table public.document_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index document_categories_school_name_key
  on public.document_categories (school_id, lower(btrim(name)));
create index document_categories_created_by_idx on public.document_categories (created_by);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  category_id uuid references public.document_categories(id) on delete set null,
  storage_path text not null unique,
  original_file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  visible_public boolean not null default false,
  visible_teachers boolean not null default false,
  visible_students boolean not null default false,
  principal_only boolean not null default true,
  teacher_target_mode text check (teacher_target_mode in ('all', 'specific')),
  student_target_mode text check (student_target_mode in ('all', 'specific')),
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  is_pinned boolean not null default false,
  access_mode text not null default 'preview_download' check (access_mode in ('preview_download', 'preview_only')),
  is_archived boolean not null default false,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploader_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_audience_check check (
    (principal_only and not visible_public and not visible_teachers and not visible_students)
    or
    (not principal_only and (visible_public or visible_teachers or visible_students))
  ),
  constraint documents_teacher_mode_check check (
    (visible_teachers and teacher_target_mode is not null)
    or (not visible_teachers and teacher_target_mode is null)
  ),
  constraint documents_student_mode_check check (
    (visible_students and student_target_mode is not null)
    or (not visible_students and student_target_mode is null)
  ),
  constraint documents_expiry_check check (expires_at is null or expires_at > publish_at)
);

create index documents_school_created_idx on public.documents (school_id, is_archived, is_pinned desc, created_at desc);
create index documents_category_idx on public.documents (category_id);
create index documents_uploaded_by_idx on public.documents (uploaded_by);
create index documents_public_active_idx on public.documents (school_id, publish_at, expires_at) where visible_public and not is_archived;
create index documents_teacher_active_idx on public.documents (school_id, publish_at, expires_at) where visible_teachers and not is_archived;
create index documents_student_active_idx on public.documents (school_id, publish_at, expires_at) where visible_students and not is_archived;

create table public.document_target_classes (
  document_id uuid not null references public.documents(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  primary key (document_id, class_id)
);

create index document_target_classes_class_idx on public.document_target_classes (class_id, document_id);

create table public.document_target_teachers (
  document_id uuid not null references public.documents(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  primary key (document_id, teacher_id)
);

create index document_target_teachers_teacher_idx on public.document_target_teachers (teacher_id, document_id);

create or replace function private.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id
  from public.profiles p
  where p.user_id = (select auth.uid())
  limit 1
$$;

create or replace function private.is_school_admin(requested_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.school_id = requested_school_id
      and p.role in ('admin', 'principal')
  )
$$;

create or replace function private.student_matches_class(student_row public.students, class_row public.classes)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    lower(btrim(coalesce(student_row.class, ''))) in (
      lower(btrim(coalesce(class_row.class_name, ''))),
      lower(btrim(coalesce(class_row.class, ''))),
      lower(btrim(coalesce(class_row.name, ''))),
      lower(btrim(coalesce(class_row.class_number, ''))),
      lower(btrim('Class ' || coalesce(class_row.class_number, '')))
    )
    and (
      nullif(btrim(coalesce(class_row.section_name, class_row.section, '')), '') is null
      or lower(btrim(coalesce(student_row.section, ''))) = lower(btrim(coalesce(class_row.section_name, class_row.section, '')))
    )
$$;

create or replace function private.can_read_document(requested_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = requested_document_id
      and (
        private.is_school_admin(d.school_id)
        or (
          not d.is_archived
          and d.publish_at <= now()
          and (d.expires_at is null or d.expires_at > now())
          and not d.principal_only
          and (
            d.visible_public
            or (
              d.visible_teachers
              and exists (
                select 1
                from public.teachers t
                where t.user_id = (select auth.uid())
                  and t.school_id = d.school_id
                  and (
                    d.teacher_target_mode = 'all'
                    or exists (
                      select 1 from public.document_target_teachers dt
                      where dt.document_id = d.id and dt.teacher_id = t.id
                    )
                  )
              )
            )
            or (
              d.visible_students
              and exists (
                select 1
                from public.students s
                where s.user_id = (select auth.uid())
                  and s.school_id = d.school_id
                  and (
                    d.student_target_mode = 'all'
                    or exists (
                      select 1
                      from public.document_target_classes dc
                      join public.classes c on c.id = dc.class_id and c.school_id = d.school_id
                      where dc.document_id = d.id
                        and private.student_matches_class(s, c)
                    )
                  )
              )
            )
          )
        )
      )
  )
$$;

create or replace function private.can_read_document_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.documents d
    where d.storage_path = object_name
      and private.can_read_document(d.id)
  )
$$;

create or replace function public.set_documents_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_document_categories_updated_at
before update on public.document_categories
for each row execute function public.set_documents_updated_at();

create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_documents_updated_at();

alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_target_classes enable row level security;
alter table public.document_target_teachers enable row level security;

create policy "Document categories visible with readable documents"
on public.document_categories for select to anon, authenticated
using (
  private.is_school_admin(school_id)
  or exists (
    select 1 from public.documents d
    where d.category_id = document_categories.id
      and private.can_read_document(d.id)
  )
);

create policy "School admins create document categories"
on public.document_categories for insert to authenticated
with check (private.is_school_admin(school_id) and created_by = (select auth.uid()));

create policy "School admins update document categories"
on public.document_categories for update to authenticated
using (private.is_school_admin(school_id))
with check (private.is_school_admin(school_id));

create policy "School admins delete document categories"
on public.document_categories for delete to authenticated
using (private.is_school_admin(school_id));

create policy "Readers access permitted documents"
on public.documents for select to anon, authenticated
using (private.can_read_document(id));

create policy "School admins create documents"
on public.documents for insert to authenticated
with check (
  private.is_school_admin(school_id)
  and uploaded_by = (select auth.uid())
  and split_part(storage_path, '/', 1) = school_id::text
  and (category_id is null or exists (
    select 1 from public.document_categories c where c.id = category_id and c.school_id = school_id
  ))
);

create policy "School admins update documents"
on public.documents for update to authenticated
using (private.is_school_admin(school_id))
with check (
  private.is_school_admin(school_id)
  and split_part(storage_path, '/', 1) = school_id::text
  and (category_id is null or exists (
    select 1 from public.document_categories c where c.id = category_id and c.school_id = school_id
  ))
);

create policy "School admins delete documents"
on public.documents for delete to authenticated
using (private.is_school_admin(school_id));

create policy "Readers see permitted class targets"
on public.document_target_classes for select to authenticated
using (private.can_read_document(document_id));

create policy "School admins create class targets"
on public.document_target_classes for insert to authenticated
with check (
  exists (
    select 1 from public.documents d join public.classes c on c.id = class_id
    where d.id = document_id and d.school_id = c.school_id and private.is_school_admin(d.school_id)
  )
);

create policy "School admins delete class targets"
on public.document_target_classes for delete to authenticated
using (exists (select 1 from public.documents d where d.id = document_id and private.is_school_admin(d.school_id)));

create policy "Readers see permitted teacher targets"
on public.document_target_teachers for select to authenticated
using (private.can_read_document(document_id));

create policy "School admins create teacher targets"
on public.document_target_teachers for insert to authenticated
with check (
  exists (
    select 1 from public.documents d join public.teachers t on t.id = teacher_id
    where d.id = document_id and d.school_id = t.school_id and private.is_school_admin(d.school_id)
  )
);

create policy "School admins delete teacher targets"
on public.document_target_teachers for delete to authenticated
using (exists (select 1 from public.documents d where d.id = document_id and private.is_school_admin(d.school_id)));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-documents',
  'school-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "School admins upload document objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'school-documents'
  and (storage.foldername(name))[1] = private.current_school_id()::text
  and private.is_school_admin(private.current_school_id())
);

create policy "Readers access permitted document objects"
on storage.objects for select to anon, authenticated
using (bucket_id = 'school-documents' and private.can_read_document_object(name));

create policy "School admins update document objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'school-documents'
  and (storage.foldername(name))[1] = private.current_school_id()::text
  and private.is_school_admin(private.current_school_id())
)
with check (
  bucket_id = 'school-documents'
  and (storage.foldername(name))[1] = private.current_school_id()::text
  and private.is_school_admin(private.current_school_id())
);

create policy "School admins delete document objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'school-documents'
  and (storage.foldername(name))[1] = private.current_school_id()::text
  and private.is_school_admin(private.current_school_id())
);

revoke all on function private.current_school_id() from public;
revoke all on function private.is_school_admin(uuid) from public;
revoke all on function private.can_read_document(uuid) from public;
revoke all on function private.can_read_document_object(text) from public;
revoke all on function private.student_matches_class(public.students, public.classes) from public;

grant usage on schema private to anon, authenticated;
grant execute on function private.current_school_id() to authenticated;
grant execute on function private.is_school_admin(uuid) to anon, authenticated;
grant execute on function private.can_read_document(uuid) to anon, authenticated;
grant execute on function private.can_read_document_object(text) to anon, authenticated;
grant execute on function private.student_matches_class(public.students, public.classes) to anon, authenticated;

grant select on public.document_categories to anon, authenticated;
grant insert, update, delete on public.document_categories to authenticated;
grant select on public.documents to anon, authenticated;
grant insert, update, delete on public.documents to authenticated;
grant select, insert, delete on public.document_target_classes to authenticated;
grant select, insert, delete on public.document_target_teachers to authenticated;
