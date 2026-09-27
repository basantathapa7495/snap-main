-- Approval reads assigned classes and creates the existing teacher/student
-- record. Rollback deletes those records if profile or Auth setup fails.
grant select, insert, update, delete on table public.teachers to service_role;
grant select, insert, update, delete on table public.students to service_role;
