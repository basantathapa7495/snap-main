'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Calendar, Check, Download, Filter, GraduationCap,
  Loader2, RefreshCw, Save, Search, UserCheck, UserX, Users,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Status = 'present' | 'absent' | 'late' | 'unmarked';
type Student = {
  id: string;
  name: string;
  class: string | null;
  section: string | null;
  roll_no: string | null;
};
type Attendance = {
  student_id: string;
  attendance_date: string;
  status: Status;
};
type EditableStudent = Student & { status: Status };

function nepalDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function classLabel(student: Pick<Student, 'class' | 'section'>) {
  return [student.class || 'Unassigned', student.section].filter(Boolean).join(' · ');
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}

export default function AttendancePage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(nepalDateKey());
  const [selectedClass, setSelectedClass] = useState('All');
  const [search, setSearch] = useState('');
  const [editable, setEditable] = useState<EditableStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setRefreshing(true);
      setError('');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (!cancelled) setAuthenticated(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles').select('school_id').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id) throw new Error('Your school profile could not be loaded.');

        const [studentResult, attendanceResult] = await Promise.all([
          supabase.from('students')
            .select('id, name, class, section, roll_no')
            .eq('school_id', profile.school_id)
            .order('class', { ascending: true })
            .order('roll_no', { ascending: true }),
          supabase.from('attendance')
            .select('student_id, attendance_date, status')
            .eq('school_id', profile.school_id)
            .gte('attendance_date', dateDaysAgo(89))
            .lte('attendance_date', nepalDateKey()),
        ]);
        if (studentResult.error) throw studentResult.error;
        if (attendanceResult.error) throw attendanceResult.error;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setStudents((studentResult.data || []) as Student[]);
          setHistory((attendanceResult.data || []) as Attendance[]);
        }
      } catch (loadError) {
        console.error('Attendance load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Attendance could not be loaded.');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const classes = useMemo(() => Array.from(new Set(
    students.map((student) => student.class).filter((value): value is string => Boolean(value))
  )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [students]);

  const dateRecords = useMemo(
    () => history.filter((record) => record.attendance_date === selectedDate),
    [history, selectedDate],
  );

  useEffect(() => {
    if (selectedClass === 'All') {
      setEditable([]);
      return;
    }
    const records = new Map(dateRecords.map((record) => [record.student_id, record.status]));
    setEditable(
      students
        .filter((student) => student.class === selectedClass)
        .map((student) => ({ ...student, status: records.get(student.id) || 'unmarked' })),
    );
  }, [students, dateRecords, selectedClass]);

  const stats = useMemo(() => {
    const present = dateRecords.filter((record) => record.status === 'present').length;
    const late = dateRecords.filter((record) => record.status === 'late').length;
    const absent = dateRecords.filter((record) => record.status === 'absent').length;
    const marked = present + late + absent;
    return {
      present, late, absent, marked,
      unmarked: Math.max(0, students.length - marked),
      percentage: marked ? Math.round(((present + late) / marked) * 100) : 0,
    };
  }, [dateRecords, students.length]);

  const classSummaries = useMemo(() => classes.map((name) => {
    const ids = new Set(students.filter((student) => student.class === name).map((student) => student.id));
    const records = dateRecords.filter((record) => ids.has(record.student_id) && record.status !== 'unmarked');
    const present = records.filter((record) => record.status === 'present').length;
    const late = records.filter((record) => record.status === 'late').length;
    const absent = records.filter((record) => record.status === 'absent').length;
    const total = students.filter((student) => student.class === name).length;
    const percentage = records.length ? Math.round(((present + late) / records.length) * 100) : null;
    return { name, present, late, absent, total, marked: records.length, percentage };
  }), [classes, students, dateRecords]);

  const lowAttendance = useMemo(() => {
    const totals = new Map<string, { attended: number; marked: number }>();
    history.forEach((record) => {
      if (record.status === 'unmarked') return;
      const value = totals.get(record.student_id) || { attended: 0, marked: 0 };
      value.marked += 1;
      if (record.status === 'present' || record.status === 'late') value.attended += 1;
      totals.set(record.student_id, value);
    });
    return students
      .map((student) => {
        const value = totals.get(student.id);
        return { ...student, percentage: value?.marked ? Math.round((value.attended / value.marked) * 100) : null, days: value?.marked || 0 };
      })
      .filter((student) => student.percentage !== null && student.percentage < 75)
      .filter((student) => selectedClass === 'All' || student.class === selectedClass)
      .filter((student) => student.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => (a.percentage || 0) - (b.percentage || 0));
  }, [history, students, selectedClass, search]);

  const editStats = useMemo(() => ({
    present: editable.filter((student) => student.status === 'present').length,
    late: editable.filter((student) => student.status === 'late').length,
    absent: editable.filter((student) => student.status === 'absent').length,
    unmarked: editable.filter((student) => student.status === 'unmarked').length,
  }), [editable]);

  function chooseClass(value: string) {
    setSelectedClass(value);
    setNotice('');
    setError('');
  }

  function setStatus(studentId: string, status: Status) {
    setEditable((current) => current.map((student) => student.id === studentId ? { ...student, status } : student));
    setNotice('');
  }

  async function saveAttendance() {
    if (!schoolId || selectedClass === 'All' || !editable.length) return;
    if (editStats.unmarked) {
      setError(`Mark all students first. ${editStats.unmarked} still unmarked.`);
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const existingIds = new Set(dateRecords.map((record) => record.student_id));
      const updates = editable.filter((student) => existingIds.has(student.id));
      const inserts = editable.filter((student) => !existingIds.has(student.id));

      const updateResults = await Promise.all(updates.map((student) =>
        supabase.from('attendance')
          .update({ status: student.status })
          .eq('school_id', schoolId)
          .eq('student_id', student.id)
          .eq('attendance_date', selectedDate)
      ));
      const updateError = updateResults.find((result) => result.error)?.error;
      if (updateError) throw updateError;

      if (inserts.length) {
        const { error: insertError } = await supabase.from('attendance').insert(
          inserts.map((student) => ({
            school_id: schoolId,
            student_id: student.id,
            attendance_date: selectedDate,
            status: student.status,
          }))
        );
        if (insertError) throw insertError;
      }

      setNotice(`Attendance saved for ${selectedClass} on ${selectedDate}.`);
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      console.error('Attendance save error', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Attendance could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const rows = [['Date', 'Student', 'Class', 'Section', 'Roll number', 'Status']];
    const studentMap = new Map(students.map((student) => [student.id, student]));
    dateRecords.forEach((record) => {
      const student = studentMap.get(record.student_id);
      if (!student || (selectedClass !== 'All' && student.class !== selectedClass)) return;
      rows.push([record.attendance_date, student.name, student.class || '', student.section || '', student.roll_no || '', record.status]);
    });
    if (rows.length === 1) {
      setError('There is no saved attendance to export for this selection.');
      return;
    }
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `attendance-${selectedDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in as principal to manage attendance.</p>
        <Link href="/auth/login?role=principal" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Go to login</Link>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Daily records</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Attendance</h1>
                <p className="mt-2 text-sm text-slate-500">Mark students and review real attendance records for your school.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button type="button" onClick={() => chooseClass(classes[0] || 'All')} disabled={!classes.length} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  <UserCheck className="h-4 w-4" /> Mark attendance
                </button>
              </div>
            </header>

            {(error || notice) && (
              <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                {error || notice}
              </div>
            )}

            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={UserCheck} label="Present" value={stats.present} tone="emerald" />
              <Stat icon={UserX} label="Absent" value={stats.absent} tone="red" />
              <Stat icon={Users} label="Late" value={stats.late} tone="amber" />
              <Stat icon={GraduationCap} label="Attendance rate" value={stats.marked ? `${stats.percentage}%` : '—'} tone="blue" />
            </section>

            <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              <label className="relative sm:w-48">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="date" max={nepalDateKey()} value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setNotice(''); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500" />
              </label>
              <label className="relative sm:w-56">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select value={selectedClass} onChange={(event) => chooseClass(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500">
                  <option value="All">All classes</option>
                  {classes.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <button type="button" onClick={exportCsv} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:ml-auto">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </section>

            {students.length === 0 ? (
              <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-400" />
                <h2 className="mt-4 font-bold text-slate-900">Add students before taking attendance</h2>
                <p className="mt-2 text-sm text-slate-500">Attendance classes are built from the class assigned to each student.</p>
                <Link href="/principal/students" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Open students</Link>
              </section>
            ) : selectedClass === 'All' ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-bold text-slate-950">Class attendance</h2>
                    <p className="mt-1 text-xs text-slate-500">Select a class to mark or edit its attendance.</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {classSummaries.map((item) => (
                      <button key={item.name} type="button" onClick={() => chooseClass(item.name)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><GraduationCap className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-900">{item.name}</span>
                          <span className="mt-1 block text-xs text-slate-500">{item.marked}/{item.total} marked · {item.present} present · {item.late} late · {item.absent} absent</span>
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.percentage === null ? 'bg-slate-100 text-slate-500' : item.percentage >= 90 ? 'bg-emerald-50 text-emerald-700' : item.percentage >= 75 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {item.percentage === null ? 'Not marked' : `${item.percentage}%`}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <LowAttendance students={lowAttendance} search={search} setSearch={setSearch} />
              </div>
            ) : (
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-bold text-slate-950">Mark attendance · {selectedClass}</h2>
                      <p className="mt-1 text-xs text-slate-500">{editable.length} students · {editStats.unmarked} unmarked</p>
                    </div>
                    <button type="button" onClick={() => setEditable((current) => current.map((student) => ({ ...student, status: 'present' })))} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <Check className="h-4 w-4" /> Mark all present
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {editable.map((student) => (
                      <div key={student.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{initials(student.name)}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{student.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{classLabel(student)} · Roll {student.roll_no || '—'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['present', 'late', 'absent'] as Status[]).map((status) => (
                            <button key={status} type="button" onClick={() => setStatus(student.id, status)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${student.status === status ? status === 'present' ? 'bg-emerald-600 text-white' : status === 'late' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {!editable.length && <p className="px-5 py-12 text-center text-sm text-slate-500">No students are assigned to this class.</p>}
                  </div>
                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">{editStats.present} present · {editStats.late} late · {editStats.absent} absent</p>
                    <button type="button" onClick={saveAttendance} disabled={saving || !editable.length || editStats.unmarked > 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? 'Saving…' : 'Save attendance'}
                    </button>
                  </div>
                </section>
                <LowAttendance students={lowAttendance} search={search} setSearch={setSearch} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number | string; tone: 'emerald' | 'red' | 'amber' | 'blue' }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600',
  };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-950">{value}</p></div></div></div>;
}

function LowAttendance({ students, search, setSearch }: { students: Array<Student & { percentage: number | null; days: number }>; search: string; setSearch: (value: string) => void }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-950">Low attendance</h2><p className="mt-1 text-xs text-slate-500">Below 75% during the last 90 days.</p><label className="relative mt-3 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label></div><div className="divide-y divide-slate-100">{students.length ? students.map((student) => <div key={student.id} className="flex items-center gap-3 px-5 py-3.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-700">{initials(student.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{student.name}</p><p className="text-xs text-slate-500">{classLabel(student)} · {student.days} marked days</p></div><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{student.percentage}%</span></div>) : <p className="px-5 py-10 text-center text-sm text-slate-500">No low-attendance students found.</p>}</div></section>;
}

function PageSkeleton() {
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-2xl bg-white" />)}</div><div className="mt-6 h-96 rounded-2xl bg-white" /></div></main></div></div>;
}
