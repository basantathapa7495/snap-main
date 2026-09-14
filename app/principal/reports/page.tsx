'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CalendarDays, Check, ClipboardCheck, Download, FileSpreadsheet,
  GraduationCap, RefreshCw, Users, Wallet,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Student = { id: string; name: string; class: string | null; section: string | null; roll_no: string | null; parent_name: string | null; parent_phone: string | null; created_at: string | null };
type Attendance = { student_id: string | null; attendance_date: string; status: string };
type Payment = { student_id: string | null; amount: number | string | null; payment_date: string };
type FeeType = { name: string; amount: number | string | null };
type Admission = { id: string; student_name: string; class: string; parent_name: string; parent_phone: string; status: string | null; created_at: string | null };
type Exam = { id: string; name: string; start_date: string | null };
type ClassAttendance = { name: string; present: number; late: number; absent: number; marked: number; rate: number | null };

function nepalToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function monthStart() { return `${nepalToday().slice(0, 7)}-01`; }
function money(value: number) { return `NPR ${Math.round(value).toLocaleString()}`; }
function csvCell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}
function normalizedStatus(value: string | null) {
  const status = value?.toLowerCase();
  return status === 'approved' || status === 'rejected' ? status : 'pending';
}
function studentClass(student: Student) {
  return [student.class || 'Unassigned', student.section].filter(Boolean).join(' · ');
}

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [teacherCount, setTeacherCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(nepalToday());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!fromDate || !toDate || fromDate > toDate) {
        setError('Choose a valid date range.');
        setLoading(false);
        return;
      }
      setRefreshing(true); setError('');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (!cancelled) setAuthenticated(false);
          return;
        }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id) throw new Error('Your school profile could not be loaded.');
        const schoolId = profile.school_id;

        const results = await Promise.all([
          supabase.from('students').select('id, name, class, section, roll_no, parent_name, parent_phone, created_at').eq('school_id', schoolId).order('name'),
          supabase.from('attendance').select('student_id, attendance_date, status').eq('school_id', schoolId).gte('attendance_date', fromDate).lte('attendance_date', toDate),
          supabase.from('fee_records').select('student_id, amount, payment_date').eq('school_id', schoolId).gte('payment_date', fromDate).lte('payment_date', toDate),
          supabase.from('fee_types').select('name, amount').eq('school_id', schoolId),
          supabase.from('admission_applications').select('id, student_name, class, parent_name, parent_phone, status, created_at').eq('school_id', schoolId).gte('created_at', `${fromDate}T00:00:00`).lte('created_at', `${toDate}T23:59:59`).order('created_at', { ascending: false }),
          supabase.from('exams').select('id, name, start_date').eq('school_id', schoolId).gte('start_date', fromDate).lte('start_date', toDate).order('start_date'),
          supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        ]);
        const firstError = results.find((result) => result.error)?.error;
        if (firstError) throw firstError;

        if (!cancelled) {
          setStudents((results[0].data || []) as Student[]);
          setAttendance((results[1].data || []) as Attendance[]);
          setPayments((results[2].data || []) as Payment[]);
          setFeeTypes((results[3].data || []) as FeeType[]);
          setAdmissions((results[4].data || []) as Admission[]);
          setExams((results[5].data || []) as Exam[]);
          setTeacherCount(results[6].count || 0);
          setClassCount(results[7].count || 0);
        }
      } catch (loadError) {
        console.error('Reports load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Report data could not be loaded.');
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fromDate, toDate, refreshKey]);

  const attendanceSummary = useMemo(() => {
    const marked = attendance.filter((row) => row.status !== 'unmarked');
    const present = marked.filter((row) => row.status === 'present').length;
    const late = marked.filter((row) => row.status === 'late').length;
    const absent = marked.filter((row) => row.status === 'absent').length;
    return { present, late, absent, marked: marked.length, rate: marked.length ? Math.round(((present + late) / marked.length) * 100) : null };
  }, [attendance]);

  const feeTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const feePerStudent = feeTypes.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const paidByStudent = useMemo(() => {
    const result = new Map<string, number>();
    payments.forEach((payment) => {
      if (payment.student_id) result.set(payment.student_id, (result.get(payment.student_id) || 0) + Number(payment.amount || 0));
    });
    return result;
  }, [payments]);

  const classAttendance = useMemo<ClassAttendance[]>(() => {
    const names = Array.from(new Set(students.map((student) => student.class).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return names.map((name) => {
      const ids = new Set(students.filter((student) => student.class === name).map((student) => student.id));
      const marked = attendance.filter((row) => row.student_id && ids.has(row.student_id) && row.status !== 'unmarked');
      const present = marked.filter((row) => row.status === 'present').length;
      const late = marked.filter((row) => row.status === 'late').length;
      const absent = marked.filter((row) => row.status === 'absent').length;
      return { name, present, late, absent, marked: marked.length, rate: marked.length ? Math.round(((present + late) / marked.length) * 100) : null };
    });
  }, [attendance, students]);

  function exportStudents() {
    const rows: Array<Array<string | number>> = [['Student', 'Class', 'Section', 'Roll', 'Parent', 'Parent phone', 'Added']];
    students.forEach((item) => rows.push([item.name, item.class || '', item.section || '', item.roll_no || '', item.parent_name || '', item.parent_phone || '', item.created_at?.slice(0, 10) || '']));
    downloadCsv('student-directory.csv', rows);
    setNotice('Student directory exported.');
  }
  function exportAttendance() {
    const studentMap = new Map(students.map((student) => [student.id, student]));
    const rows: Array<Array<string | number>> = [['Date', 'Student', 'Class', 'Section', 'Roll', 'Status']];
    attendance.forEach((item) => {
      const student = item.student_id ? studentMap.get(item.student_id) : undefined;
      rows.push([item.attendance_date, student?.name || 'Unknown student', student?.class || '', student?.section || '', student?.roll_no || '', item.status]);
    });
    downloadCsv(`attendance-${fromDate}-to-${toDate}.csv`, rows);
    setNotice('Attendance report exported.');
  }
  function exportFees() {
    const rows: Array<Array<string | number>> = [['Student', 'Class', 'Period payments', 'Fee structure total', 'Difference', 'Parent phone']];
    students.forEach((student) => {
      const paid = paidByStudent.get(student.id) || 0;
      rows.push([student.name, studentClass(student), paid, feePerStudent, Math.max(0, feePerStudent - paid), student.parent_phone || '']);
    });
    downloadCsv(`fees-${fromDate}-to-${toDate}.csv`, rows);
    setNotice('Fee report exported.');
  }
  function exportAdmissions() {
    const rows: Array<Array<string | number>> = [['Applied', 'Student', 'Class', 'Parent', 'Phone', 'Status']];
    admissions.forEach((item) => rows.push([item.created_at?.slice(0, 10) || '', item.student_name, item.class, item.parent_name, item.parent_phone, normalizedStatus(item.status)]));
    downloadCsv(`admissions-${fromDate}-to-${toDate}.csv`, rows);
    setNotice('Admissions report exported.');
  }
  function exportExams() {
    const rows: Array<Array<string | number>> = [['Exam', 'Start date']];
    exams.forEach((item) => rows.push([item.name, item.start_date || '']));
    downloadCsv(`exams-${fromDate}-to-${toDate}.csv`, rows);
    setNotice('Exam report exported.');
  }
  function exportSummary() {
    const rows: Array<Array<string | number>> = [
      ['SNAP school summary', `${fromDate} to ${toDate}`],
      [], ['Metric', 'Value'],
      ['Students', students.length], ['Teachers', teacherCount], ['Classes', classCount],
      ['Attendance marked', attendanceSummary.marked], ['Attendance rate', attendanceSummary.rate === null ? 'No data' : `${attendanceSummary.rate}%`],
      ['Fees collected', feeTotal], ['Admission applications', admissions.length], ['Exams scheduled', exams.length],
      [], ['Class attendance', 'Rate'],
      ...classAttendance.map((item) => [item.name, item.rate === null ? 'No data' : `${item.rate}%`] as Array<string | number>),
    ];
    downloadCsv(`school-summary-${fromDate}-to-${toDate}.csv`, rows);
    setNotice('School summary exported.');
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-950">Please sign in</h1><p className="mt-2 text-sm text-slate-500">Sign in as principal to view school reports.</p><Link href="/auth/login?role=principal" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Go to login</Link></div></main>;

  const pendingAdmissions = admissions.filter((item) => normalizedStatus(item.status) === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div><p className="text-sm font-semibold text-blue-600">School intelligence</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Reports</h1><p className="mt-2 text-sm text-slate-500">Review real school data and download detailed CSV reports.</p></div>
              <div className="flex flex-wrap gap-2"><label><span className="sr-only">From date</span><input type="date" value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" /></label><label><span className="sr-only">To date</span><input type="date" value={toDate} min={fromDate} max={nepalToday()} onChange={(event) => setToDate(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" /></label><button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button><button type="button" onClick={exportSummary} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Download className="h-4 w-4" />Export summary</button></div>
            </header>

            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}</div>}

            <section className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Stat icon={Users} label="Students" value={students.length} detail={`${teacherCount} teachers · ${classCount} classes`} tone="blue" />
              <Stat icon={ClipboardCheck} label="Attendance rate" value={attendanceSummary.rate === null ? '—' : `${attendanceSummary.rate}%`} detail={`${attendanceSummary.marked} records marked`} tone="emerald" />
              <Stat icon={Wallet} label="Fees collected" value={money(feeTotal)} detail={`${payments.length} payments`} tone="amber" />
              <Stat icon={GraduationCap} label="Admissions & exams" value={admissions.length + exams.length} detail={`${pendingAdmissions} pending · ${exams.length} exams`} tone="violet" />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <ReportCard icon={Users} title="Student directory" description="Names, class, section, roll number and parent contact details." count={students.length} action="Export students" onExport={exportStudents} tone="blue" />
              <ReportCard icon={ClipboardCheck} title="Attendance report" description="Every marked attendance record in the selected date range." count={attendance.length} action="Export attendance" onExport={exportAttendance} tone="emerald" />
              <ReportCard icon={Wallet} title="Fee collection and dues" description="Period collections compared with the configured fee structure." count={payments.length} action="Export fees" onExport={exportFees} tone="amber" />
              <ReportCard icon={GraduationCap} title="Admission applications" description="Applicant, guardian, contact and review status information." count={admissions.length} action="Export admissions" onExport={exportAdmissions} tone="violet" />
              <ReportCard icon={CalendarDays} title="Exam schedule" description="Examinations scheduled inside the selected date range." count={exams.length} action="Export exams" onExport={exportExams} tone="red" />
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-950">Class attendance summary</h2><p className="mt-1 text-xs text-slate-500">{fromDate} to {toDate}</p></div>
              {!classAttendance.length ? <p className="px-5 py-12 text-center text-sm text-slate-500">No classes with students were found.</p> : <div className="divide-y divide-slate-100">{classAttendance.map((item) => <div key={item.name} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">Class {item.name}</p><p className="mt-1 text-xs text-slate-500">{item.present} present · {item.late} late · {item.absent} absent · {item.marked} marked</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.rate === null ? 'bg-slate-100 text-slate-500' : item.rate >= 90 ? 'bg-emerald-50 text-emerald-700' : item.rate >= 75 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{item.rate === null ? 'No data' : `${item.rate}%`}</span></div>)}</div>}
            </section>

            <p className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">Academic marks, GPA, pass-rate and report-card reports are excluded until a real results database is added. This prevents SNAP from presenting invented academic data.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, title, description, count, action, onExport, tone }: { icon: React.ElementType; title: string; description: string; count: number; action: string; onExport: () => void; tone: 'blue' | 'emerald' | 'amber' | 'violet' | 'red' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600', red: 'bg-red-50 text-red-600' };
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-950">{title}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{count}</span></div><p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p></div></div><button type="button" onClick={onExport} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><FileSpreadsheet className="h-4 w-4" />{action}</button></article>;
}
function Stat({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: number | string; detail: string; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 truncate text-xl font-bold text-slate-950">{value}</p></div></div><p className="mt-3 truncate text-xs text-slate-400">{detail}</p></div>;
}
function PageSkeleton() {
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-white" />)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-44 rounded-2xl bg-white" />)}</div></div></main></div></div>;
}
