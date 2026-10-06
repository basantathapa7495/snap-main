-- Supporting indexes for the Teacher Attendance RLS predicates.
create index if not exists attendance_student_id_idx
  on public.attendance (student_id)
  where student_id is not null;

create index if not exists classes_teacher_school_active_idx
  on public.classes (teacher_id, school_id)
  where archived_at is null and teacher_id is not null;
