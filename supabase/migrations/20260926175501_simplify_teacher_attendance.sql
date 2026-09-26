-- Reuse the existing records and unique teacher/day key. Time columns remain
-- nullable for old data, but the daily attendance UI no longer writes times.
alter table public.teacher_attendance
  drop constraint teacher_attendance_status_check;
alter table public.teacher_attendance
  add constraint teacher_attendance_status_check
  check (status in ('present', 'absent', 'leave', 'holiday'));

-- Both the attendance and approved-leave trigger must refer to a teacher
-- in the same school as the record, even when an ID is supplied directly.
alter table public.teachers
  add constraint teachers_id_school_id_key unique (id, school_id);
alter table public.teacher_attendance
  add constraint teacher_attendance_teacher_school_fkey
  foreign key (teacher_id, school_id) references public.teachers (id, school_id)
  on delete cascade;
alter table public.teacher_leave_requests
  add constraint teacher_leave_requests_teacher_school_fkey
  foreign key (teacher_id, school_id) references public.teachers (id, school_id)
  on delete cascade;

-- Access checks use the existing private role helper so adding an approved
-- manager role later only requires an explicit change to that helper.
drop policy if exists "School admins manage records" on public.teacher_attendance;
create policy "School managers manage teacher attendance"
on public.teacher_attendance for all to authenticated
using (private.is_school_admin(school_id))
with check (private.is_school_admin(school_id));

drop policy if exists "School admins manage records" on public.teacher_leave_requests;
create policy "School managers manage teacher leave"
on public.teacher_leave_requests for all to authenticated
using (private.is_school_admin(school_id))
with check (private.is_school_admin(school_id));
