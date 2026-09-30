-- Cover Teacher Communication foreign keys used by RLS and message queries.
-- This is intentionally limited to the additive teacher communication tables.

create index if not exists teacher_student_conversations_class_idx
  on public.teacher_student_conversations (class_id);

create index if not exists teacher_student_messages_school_idx
  on public.teacher_student_messages (school_id);

create index if not exists teacher_student_messages_sender_idx
  on public.teacher_student_messages (sender_id);
