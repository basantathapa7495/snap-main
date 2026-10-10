'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Contact,
  Droplets,
  GraduationCap,
  Hash,
  Home,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Student = {
  id: string;
  school_id: string;
  name: string;
  class: string | null;
  section: string | null;
  roll_no: string | null;
  gender: string | null;
  date_of_birth: string | null;
  dob: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  address: string | null;
  email: string | null;
  created_at: string | null;
};

type Profile = {
  full_name: string | null;
  phone: string | null;
  address: string | null;
};

type ProfileData = {
  student: Student;
  profile: Profile | null;
  attendance: number | null;
  subjects: string[];
  academicYear: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  avatarUrl: string | null;
};

function normalizeClass(value?: string | null) {
  return (value || '').trim().replace(/^(class|grade)\s+/i, '').toLowerCase();
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || 'ST').toUpperCase();
}

function valueOrFallback(value?: string | number | null) {
  return value === null || value === undefined || value === '' ? 'Not added' : String(value);
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[20px_104px_1fr] items-start gap-2 border-t border-slate-100 py-2 first:border-t-0">
      <Icon className="mt-0.5 h-4 w-4 text-slate-500" aria-hidden="true" />
      <span className="text-xs text-slate-500">{label}</span>
      <span className="break-words text-xs font-semibold text-slate-900">{valueOrFallback(value)}</span>
    </div>
  );
}

function Section({ icon: Icon, title, editable = false, children }: { icon: typeof UserRound; title: string; editable?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-3.5 pb-1 shadow-sm">
      <div className="flex min-h-12 items-center gap-2">
        <Icon className="h-5 w-5 text-blue-900" aria-hidden="true" />
        <h3 className="flex-1 text-sm font-extrabold text-slate-950">{title}</h3>
        {editable && (
          <button type="button" disabled className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600 disabled:opacity-70" title="Profile editing will be available from Account Settings">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function StudentProfileView({ open, onClose, userId, avatarUrl }: Props) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [studentResult, profileResult] = await Promise.all([
          supabase.from('students').select('id,school_id,name,class,section,roll_no,gender,date_of_birth,dob,parent_name,parent_phone,address,email,created_at').eq('user_id', userId).single(),
          supabase.from('profiles').select('full_name,phone,address').eq('user_id', userId).single(),
        ]);
        if (studentResult.error || !studentResult.data) throw studentResult.error || new Error('Student record not found.');

        const student = studentResult.data as Student;
        const [attendanceResult, classesResult] = await Promise.all([
          supabase.from('attendance').select('status').eq('student_id', student.id),
          supabase.from('classes').select('id,class_name,class,name,class_number,section,section_name,academic_year,archived_at').eq('school_id', student.school_id).is('archived_at', null),
        ]);
        if (attendanceResult.error) throw attendanceResult.error;
        if (classesResult.error) throw classesResult.error;

        const classRecord = (classesResult.data || []).find((item) =>
          normalizeClass(item.class_number || item.class || item.class_name || item.name) === normalizeClass(student.class)
          && (item.section_name || item.section || '').trim().toLowerCase() === (student.section || '').trim().toLowerCase()
        );

        let subjects: string[] = [];
        if (classRecord?.id) {
          const assignments = await supabase
            .from('teacher_assignments')
            .select('subject')
            .eq('class_id', classRecord.id)
            .eq('active', true);
          if (!assignments.error) {
            subjects = [...new Set((assignments.data || []).map((item) => item.subject?.trim()).filter(Boolean) as string[])].sort();
          }
        }

        const rows = attendanceResult.data || [];
        const present = rows.filter((row) => row.status?.toLowerCase() === 'present').length;
        const attendance = rows.length ? Math.round((present / rows.length) * 100) : null;

        if (active) {
          setData({
            student,
            profile: profileResult.data as Profile | null,
            attendance,
            subjects,
            academicYear: classRecord?.academic_year || null,
          });
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Profile could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [open, userId]);

  if (!open) return null;

  const student = data?.student;
  const name = student?.name || data?.profile?.full_name || 'Student';
  const grade = student?.class ? `Grade ${student.class}` : 'Grade not added';
  const section = student?.section ? `Section ${student.section}` : 'Section not added';
  const birthday = student?.date_of_birth || student?.dob;
  const studentId = student?.id || null;

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/25 px-3 py-3 lg:hidden" role="dialog" aria-modal="true" aria-label="View student profile">
      <article className="mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden rounded-[26px] bg-slate-50 shadow-[0_24px_70px_rgba(15,23,42,0.30)]">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-3">
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-800" aria-label="Back to profile menu">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="ml-2 flex-1 text-lg font-extrabold text-slate-950">View Profile</h2>
          <button type="button" disabled className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-50 px-3 text-sm font-bold text-blue-600 disabled:opacity-70" title="Profile editing will be available from Account Settings">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
          {loading ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="h-7 w-7 animate-spin text-blue-600" />Loading profile…</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : student && data ? (
            <div className="space-y-3">
              <section className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-extrabold text-blue-700 ring-4 ring-white shadow-md">
                  {avatarUrl ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${avatarUrl.replace(/"/g, '%22')}")` }} /> : initials(name)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-extrabold text-slate-950">{name}</h3>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600"><UserRound className="h-3.5 w-3.5" />Active Student</span>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600"><GraduationCap className="h-4 w-4 text-blue-900" />{grade} <span>•</span> {section}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-600"><Contact className="h-4 w-4" />Roll Number: {student.roll_no || '—'}</p>
                </div>
              </section>

              <section className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Attendance', value: data.attendance === null ? '—' : `${data.attendance}%`, icon: CalendarDays, tone: 'bg-sky-50 text-sky-600' },
                  { label: 'Total Subjects', value: data.subjects.length || '—', icon: BookOpen, tone: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Current GPA', value: '—', icon: GraduationCap, tone: 'bg-violet-50 text-violet-600' },
                  { label: 'Position', value: '—', icon: Trophy, tone: 'bg-amber-50 text-amber-500' },
                ].map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className={`rounded-xl px-1.5 py-3 text-center ${tone}`}>
                    <Icon className="mx-auto h-5 w-5" />
                    <p className="mt-1.5 text-[10px] font-medium leading-3 text-slate-500">{label}</p>
                    <strong className="mt-1 block text-base text-slate-950">{value}</strong>
                  </div>
                ))}
              </section>

              <Section icon={UserRound} title="Personal Information" editable>
                <InfoRow icon={UserRound} label="Full Name" value={name} />
                <InfoRow icon={CalendarDays} label="Date of Birth" value={birthday} />
                <InfoRow icon={UserRound} label="Gender" value={student.gender} />
                <InfoRow icon={Droplets} label="Blood Group" value={null} />
                <InfoRow icon={Contact} label="Student ID" value={studentId} />
              </Section>

              <Section icon={GraduationCap} title="Academic Information">
                <InfoRow icon={Home} label="Class" value={grade} />
                <InfoRow icon={UsersRound} label="Section" value={student.section} />
                <InfoRow icon={Hash} label="Roll Number" value={student.roll_no} />
                <InfoRow icon={CalendarDays} label="Academic Year" value={data.academicYear} />
                <InfoRow icon={BookOpen} label="Subjects" value={data.subjects.length ? data.subjects.join(', ') : null} />
              </Section>

              <Section icon={UsersRound} title="Parent/Guardian Information" editable>
                <InfoRow icon={UserRound} label="Guardian Name" value={student.parent_name} />
                <InfoRow icon={Phone} label="Contact Number" value={student.parent_phone} />
                <InfoRow icon={Mail} label="Student Email" value={student.email} />
              </Section>

              <Section icon={MapPin} title="Address Information" editable>
                <InfoRow icon={Home} label="Permanent Address" value={student.address || data.profile?.address} />
                <InfoRow icon={MapPin} label="Temporary Address" value={null} />
              </Section>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}
