-- INSERT ... RETURNING also evaluates SELECT policies. Keep the audience-aware
-- reader policy, but allow school administrators to read their own school's row
-- directly so a newly inserted row can be returned in the same statement.
create policy "School admins read school documents"
on public.documents
for select
to authenticated
using (private.is_school_admin(school_id));

-- Recreate write checks with an unambiguous school comparison.
drop policy if exists "School admins create documents" on public.documents;
create policy "School admins create documents"
on public.documents
for insert
to authenticated
with check (
  private.is_school_admin(school_id)
  and uploaded_by = (select auth.uid())
  and split_part(storage_path, '/', 1) = school_id::text
  and (
    category_id is null
    or exists (
      select 1
      from public.document_categories category
      where category.id = documents.category_id
        and category.school_id = documents.school_id
    )
  )
);

drop policy if exists "School admins update documents" on public.documents;
create policy "School admins update documents"
on public.documents
for update
to authenticated
using (private.is_school_admin(school_id))
with check (
  private.is_school_admin(school_id)
  and split_part(storage_path, '/', 1) = school_id::text
  and (
    category_id is null
    or exists (
      select 1
      from public.document_categories category
      where category.id = documents.category_id
        and category.school_id = documents.school_id
    )
  )
);
