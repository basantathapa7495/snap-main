drop policy if exists "Message senders attach their own files" on public.teacher_student_messages;

revoke update (attachment_path, attachment_name, attachment_mime, attachment_size)
  on public.teacher_student_messages from authenticated;
