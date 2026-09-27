import { supabase } from '@/lib/supabase';

export type ActivityKind = 'fee' | 'notice' | 'admission' | 'document' | 'student' | 'teacher' | 'leave' | 'event';
export type SchoolActivity = {
  id: string; kind: ActivityKind; title: string; detail: string;
  actor: string | null; occurredAt: string; href: string;
};

const money = (value: number | string | null) => `NPR ${Number(value || 0).toLocaleString('en-US')}`;
const valid = (value: string | null): value is string => Boolean(value && !Number.isNaN(Date.parse(value)));

// Each query is scoped to the authenticated principal's school; Supabase RLS also applies.
export async function fetchSchoolActivity(schoolId: string, perSource = 12): Promise<SchoolActivity[]> {
  const [fees, news, documents, students, teachers, leaves, approvals] = await Promise.all([
    supabase.from('fee_records').select('id,student_id,student_name,amount,created_at').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(perSource),
    supabase.from('news_events').select('id,title,is_event,event_date,created_at').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(perSource),
    supabase.from('documents').select('id,title,original_file_name,uploader_name,created_at').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(perSource),
    supabase.from('students').select('id,name,class,created_at').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(perSource),
    supabase.from('teachers').select('id,name,created_at').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(perSource),
    supabase.from('teacher_leave_requests').select('id,teacher_id,reviewed_at').eq('school_id', schoolId).eq('status', 'approved').not('reviewed_at', 'is', null).order('reviewed_at', { ascending: false }).limit(perSource),
    supabase.from('activity_logs').select('id,action_type,description,actor_name,created_at').eq('school_id', schoolId).like('action_type', 'admission_approved:%').order('created_at', { ascending: false }).limit(perSource),
  ]);
  const results = [fees, news, documents, students, teachers, leaves, approvals];
  const failed = results.find((result) => result.error)?.error;
  if (failed) throw failed;
  const studentNames = new Map((students.data || []).map((student) => [student.id, student.name]));
  const teacherNames = new Map((teachers.data || []).map((teacher) => [teacher.id, teacher.name]));
  const missingStudentIds = [...new Set((fees.data || []).map((fee) => fee.student_id).filter((id): id is string => Boolean(id) && !studentNames.has(id)))];
  const missingTeacherIds = [...new Set((leaves.data || []).map((leave) => leave.teacher_id).filter((id): id is string => Boolean(id) && !teacherNames.has(id)))];
  const [moreStudents, moreTeachers] = await Promise.all([
    missingStudentIds.length ? supabase.from('students').select('id,name').eq('school_id', schoolId).in('id', missingStudentIds) : Promise.resolve({ data: [], error: null }),
    missingTeacherIds.length ? supabase.from('teachers').select('id,name').eq('school_id', schoolId).in('id', missingTeacherIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (moreStudents.error || moreTeachers.error) throw moreStudents.error || moreTeachers.error;
  (moreStudents.data || []).forEach((student) => studentNames.set(student.id, student.name));
  (moreTeachers.data || []).forEach((teacher) => teacherNames.set(teacher.id, teacher.name));
  const items: SchoolActivity[] = [];
  for (const fee of fees.data || []) if (valid(fee.created_at)) items.push({
    id: `fee-${fee.id}`, kind: 'fee', title: 'Fee payment recorded', detail: `${fee.student_name || studentNames.get(fee.student_id) || 'Student'} · ${money(fee.amount)}`,
    actor: null, occurredAt: fee.created_at, href: `/principal/fees?payment=${encodeURIComponent(fee.id)}`,
  });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  for (const item of news.data || []) if (valid(item.created_at)) {
    if (!item.is_event && item.event_date && item.event_date > today) continue;
    items.push({ id: `news-${item.id}`, kind: item.is_event ? 'event' : 'notice', title: item.is_event ? 'Event created' : 'Notice published', detail: item.title,
      actor: null, occurredAt: item.created_at, href: item.is_event ? `/principal/calendar?event=${encodeURIComponent(item.id)}` : `/principal/communication?notice=${encodeURIComponent(item.id)}` });
  }
  for (const doc of documents.data || []) if (valid(doc.created_at)) items.push({
    id: `document-${doc.id}`, kind: 'document', title: 'Document uploaded', detail: doc.original_file_name || doc.title,
    actor: doc.uploader_name ? `Uploaded by ${doc.uploader_name}` : null, occurredAt: doc.created_at,
    href: `/principal/documents?document=${encodeURIComponent(doc.id)}`,
  });
  for (const student of students.data || []) if (valid(student.created_at)) items.push({
    id: `student-${student.id}`, kind: 'student', title: 'Student added', detail: `${student.name}${student.class ? ` · Grade ${student.class}` : ''}`,
    actor: null, occurredAt: student.created_at, href: `/principal/students?student=${encodeURIComponent(student.id)}`,
  });
  for (const teacher of teachers.data || []) if (valid(teacher.created_at)) items.push({
    id: `teacher-${teacher.id}`, kind: 'teacher', title: 'Teacher added', detail: teacher.name,
    actor: null, occurredAt: teacher.created_at, href: `/principal/teachers?teacher=${encodeURIComponent(teacher.id)}`,
  });
  for (const leave of leaves.data || []) if (valid(leave.reviewed_at)) items.push({
    id: `leave-${leave.id}`, kind: 'leave', title: 'Leave approved', detail: teacherNames.get(leave.teacher_id) || 'Teacher leave',
    actor: null, occurredAt: leave.reviewed_at, href: '/principal/teachers?tab=leave',
  });
  for (const log of approvals.data || []) if (valid(log.created_at)) {
    const applicationId = log.action_type.slice('admission_approved:'.length);
    if (!/^[\da-f]{8}-[\da-f-]{27,}$/i.test(applicationId)) continue;
    items.push({ id: `admission-${log.id}`, kind: 'admission', title: 'Admission approved', detail: log.description || 'Application approved',
      actor: log.actor_name ? `Approved by ${log.actor_name}` : null, occurredAt: log.created_at,
      href: `/principal/admission?application=${encodeURIComponent(applicationId)}` });
  }
  return items.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || a.id.localeCompare(b.id));
}
