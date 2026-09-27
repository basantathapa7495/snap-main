import { supabase } from '@/lib/supabase';

export type SearchGroup = 'Students' | 'Teachers' | 'Classes' | 'Admissions' | 'Fees & Receipts' | 'Documents' | 'Notices' | 'Exams' | 'Calendar';
export type SearchResult = { id: string; group: SearchGroup; title: string; detail: string; meta?: string; href: string };
export const searchGroups: SearchGroup[] = ['Students', 'Teachers', 'Classes', 'Admissions', 'Fees & Receipts', 'Documents', 'Notices', 'Exams', 'Calendar'];

// Restrict PostgREST's filter syntax to literal letters, numbers, spaces and hyphens.
export function cleanSearchQuery(input: string) {
  return input.trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, ' ').slice(0, 80);
}

export async function searchPrincipalSchool(schoolId: string, input: string): Promise<SearchResult[]> {
  const query = cleanSearchQuery(input);
  if (query.length < 2) return [];
  const pattern = `%${query}%`;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query);
  const classTerm = query.replace(/^(grade|class)\s+/i, '').match(/^\d+/)?.[0] || query.replace(/^(grade|class)\s+/i, '');
  const filters = (columns: string[]) => columns.map((column) => `${column}.ilike.${pattern}`).join(',');
  const [students, teachers, classes, admissions, fees, documents, notices, events, exams, categories] = await Promise.all([
    supabase.from('students').select('id,name,class,section,roll_no').eq('school_id', schoolId).or(`${filters(['name', 'roll_no'])}${uuid ? `,id.eq.${query}` : ''}`).order('name').limit(5),
    supabase.from('teachers').select('id,name,subject,department,email,phone').eq('school_id', schoolId).or(filters(['name', 'email', 'phone'])).order('name').limit(5),
    supabase.from('classes').select('id,class_name,class,name,class_number,section,section_name').eq('school_id', schoolId).or(['class_name', 'class', 'name', 'class_number', 'section', 'section_name'].map((column) => `${column}.ilike.%${classTerm}%`).join(',')).order('class_name').limit(5),
    supabase.from('admission_applications').select('id,student_name,class,status').eq('school_id', schoolId).or(`${filters(['student_name', 'class'])}${uuid ? `,id.eq.${query}` : ''}`).order('created_at', { ascending: false }).limit(5),
    supabase.from('fee_records').select('id,receipt_number,student_name,amount,payment_date').eq('school_id', schoolId).or(filters(['receipt_number', 'student_name'])).order('created_at', { ascending: false }).limit(5),
    supabase.from('documents').select('id,title,original_file_name,is_archived,document_categories(name)').eq('school_id', schoolId).or(filters(['title', 'original_file_name'])).order('created_at', { ascending: false }).limit(5),
    supabase.from('news_events').select('id,title,event_date').eq('school_id', schoolId).eq('is_event', false).ilike('title', pattern).order('created_at', { ascending: false }).limit(5),
    supabase.from('news_events').select('id,title,event_date,location').eq('school_id', schoolId).eq('is_event', true).ilike('title', pattern).order('event_date', { ascending: false }).limit(5),
    supabase.from('exams').select('id,name,start_date,exam_type').eq('school_id', schoolId).ilike('name', pattern).order('start_date', { ascending: false }).limit(5),
    supabase.from('document_categories').select('id').eq('school_id', schoolId).ilike('name', pattern).limit(5),
  ]);
  for (const [index, result] of [students, teachers, classes, admissions, fees, documents, notices, events, exams, categories].entries()) {
    if (result.error) {
      console.error(`Principal search ${searchGroups[index] || 'document categories'} query failed`, result.error);
      throw new Error('Search could not be completed');
    }
  }
  const categoryDocuments = categories.data?.length && (documents.data || []).length < 5
    ? await supabase.from('documents').select('id,title,original_file_name,is_archived,document_categories(name)')
      .eq('school_id', schoolId).in('category_id', categories.data.map((category) => category.id)).order('created_at', { ascending: false }).limit(5)
    : null;
  if (categoryDocuments?.error) { console.error('Principal search document category query failed', categoryDocuments.error); throw new Error('Search could not be completed'); }
  const matchingDocuments = [...(documents.data || [])];
  for (const document of categoryDocuments?.data || []) if (matchingDocuments.length < 5 && !matchingDocuments.some((match) => match.id === document.id)) matchingDocuments.push(document);
  const href = (base: string, key: string, id: string) => `${base}?${key}=${encodeURIComponent(id)}`;
  return [
    ...(students.data || []).map((row) => ({ id: row.id, group: 'Students' as const, title: row.name, detail: [row.class && `Grade ${row.class}${row.section || ''}`, row.roll_no && `Roll ${row.roll_no}`].filter(Boolean).join(' · ') || 'Student', href: href('/principal/students', 'student', row.id) })),
    ...(teachers.data || []).map((row) => ({ id: row.id, group: 'Teachers' as const, title: row.name, detail: [row.subject || row.department, row.email || row.phone].filter(Boolean).join(' · ') || 'Teacher', href: href('/principal/teachers', 'teacher', row.id) })),
    ...(classes.data || []).map((row) => ({ id: row.id, group: 'Classes' as const, title: [row.class_name || row.class || row.name || row.class_number || 'Class', row.section_name || row.section].filter(Boolean).join(' · '), detail: row.section_name || row.section ? 'Class section' : 'Class', href: href('/principal/classes', 'class', row.id) })),
    ...(admissions.data || []).map((row) => ({ id: row.id, group: 'Admissions' as const, title: row.student_name, detail: `Applied for Grade ${row.class || '—'}`, meta: row.status || undefined, href: href('/principal/admission', 'application', row.id) })),
    ...(fees.data || []).map((row) => ({ id: row.id, group: 'Fees & Receipts' as const, title: row.receipt_number ? `Receipt #${row.receipt_number}` : 'Fee payment', detail: `${row.student_name || 'Student'} · NPR ${Number(row.amount || 0).toLocaleString('en-US')}`, meta: row.payment_date || undefined, href: href('/principal/fees', 'payment', row.id) })),
    ...matchingDocuments.map((row) => ({ id: row.id, group: 'Documents' as const, title: row.title || row.original_file_name || 'Document', detail: row.document_categories?.[0]?.name || 'School document', meta: row.is_archived ? 'Archived' : undefined, href: href('/principal/documents', 'document', row.id) })),
    ...(notices.data || []).map((row) => ({ id: row.id, group: 'Notices' as const, title: row.title, detail: 'School notice', meta: row.event_date || undefined, href: href('/principal/communication', 'notice', row.id) })),
    ...(exams.data || []).map((row) => ({ id: row.id, group: 'Exams' as const, title: row.name, detail: row.exam_type || 'Examination', meta: row.start_date || undefined, href: href('/principal/results', 'exam', row.id) })),
    ...(events.data || []).map((row) => ({ id: row.id, group: 'Calendar' as const, title: row.title, detail: row.location || 'School event', meta: row.event_date || undefined, href: href('/principal/calendar', 'event', row.id) })),
  ];
}
