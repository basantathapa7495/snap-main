'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarDays, Check, ChevronRight, Clock3, Download, Filter, GraduationCap, Loader2, RefreshCw, Save, Search, TriangleAlert, UserPlus, UserX, Users, UsersRound } from 'lucide-react';
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';
import { attendanceCounts, dailyRates, daysBefore, nepalToday, sectionKey, type Mark } from '@/lib/principal-attendance';

type Status = 'present' | 'absent' | 'late' | 'unmarked';
type Student = { id: string; name: string; class: string | null; section: string | null; roll_no: string | null };
type Attendance = Mark & { student_id: string };
type EditableStudent = Student & { status: Status };
type Group = { key: string; className: string; section: string; label: string; students: Student[] };
const PAGE_SIZE = 1000;
const field = 'h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

function initialDate() {
  if (typeof window === 'undefined') return nepalToday();
  const requested = new URLSearchParams(window.location.search).get('date');
  return requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && !Number.isNaN(Date.parse(`${requested}T12:00:00Z`)) && requested <= nepalToday() ? requested : nepalToday();
}

async function allRows<T>(makeQuery: (offset: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await makeQuery(offset);
    if (result.error) throw new Error(result.error.message);
    rows.push(...(result.data || []));
    if ((result.data || []).length < PAGE_SIZE) return rows;
  }
}

function initials(name: string) { return name.split(' ').filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase(); }

export default function AttendancePage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [teacherHistory, setTeacherHistory] = useState<Mark[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [olderRecords, setOlderRecords] = useState<Attendance[]>([]);
  const [olderDate, setOlderDate] = useState('');
  const [olderLoading, setOlderLoading] = useState(false);
  const [olderError, setOlderError] = useState(false);
  const [search, setSearch] = useState('');
  const [editable, setEditable] = useState<EditableStudent[]>([]);
  const [studentDays, setStudentDays] = useState<7 | 14 | 30>(7);
  const [teacherDays, setTeacherDays] = useState<7 | 14 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [loadedSuccessfully, setLoadedSuccessfully] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const today = nepalToday();
  const historyStart = daysBefore(today, 89);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setRefreshing(true); setError('');
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) { if (!cancelled) setAuthenticated(false); return; }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('school_id,role').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id || profile.role !== 'admin') throw new Error('Principal school access could not be loaded.');
        const id = profile.school_id;
        const [studentRows, marks, teacherMarks] = await Promise.all([
          allRows<Student>((offset) => supabase.from('students').select('id,name,class,section,roll_no').eq('school_id', id).order('id').range(offset, offset + PAGE_SIZE - 1)),
          allRows<Attendance>((offset) => supabase.from('attendance').select('student_id,attendance_date,status').eq('school_id', id).gte('attendance_date', historyStart).lte('attendance_date', today).order('attendance_date').order('id').range(offset, offset + PAGE_SIZE - 1)),
          allRows<Mark>((offset) => supabase.from('teacher_attendance').select('teacher_id,attendance_date,status').eq('school_id', id).gte('attendance_date', daysBefore(today, 59)).lte('attendance_date', today).order('attendance_date').order('id').range(offset, offset + PAGE_SIZE - 1)),
        ]);
        if (cancelled) return;
        setSchoolId(id); setStudents(studentRows); setHistory(marks); setTeacherHistory(teacherMarks); setAuthenticated(true); setLoadedSuccessfully(true);
        const params = new URLSearchParams(window.location.search);
        const requestedClass = params.get('class')?.replace(/^(class|grade)\s+/i, '').trim().toLowerCase();
        if (requestedClass) {
          const match = studentRows.find((student) => student.class?.replace(/^(class|grade)\s+/i, '').trim().toLowerCase() === requestedClass && (!params.get('section') || student.section?.toLowerCase() === params.get('section')?.toLowerCase()));
          if (match) setSelectedGroup(sectionKey(match.class, match.section));
        }
      } catch (cause) {
        console.error('Attendance load error', cause);
        if (!cancelled) { setLoadedSuccessfully(false); setError(cause instanceof Error ? cause.message : 'Attendance could not be loaded.'); }
      } finally { if (!cancelled) { setLoading(false); setRefreshing(false); } }
    }
    void load();
    return () => { cancelled = true; };
  }, [refreshKey, historyStart, today]);

  useEffect(() => {
    if (!schoolId || selectedDate >= historyStart) return;
    let cancelled = false;
    allRows<Attendance>((offset) => supabase.from('attendance').select('student_id,attendance_date,status').eq('school_id', schoolId).eq('attendance_date', selectedDate).order('id').range(offset, offset + PAGE_SIZE - 1))
      .then((data) => { if (!cancelled) { setOlderRecords(data); setOlderDate(selectedDate); setOlderError(false); setOlderLoading(false); } })
      .catch(() => { if (!cancelled) { setOlderError(true); setError('Attendance for the selected date could not be loaded.'); setOlderLoading(false); } });
    return () => { cancelled = true; };
  }, [schoolId, selectedDate, historyStart, refreshKey]);

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    students.forEach((student) => {
      const key = sectionKey(student.class, student.section);
      if (!map.has(key)) map.set(key, { key, className: student.class || 'Unassigned', section: student.section || '', label: [student.class || 'Unassigned', student.section && `Section ${student.section}`].filter(Boolean).join(' · '), students: [] });
      map.get(key)!.students.push(student);
    });
    return [...map.values()].sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }) || a.section.localeCompare(b.section, undefined, { numeric: true }));
  }, [students]);
  const dateRecords = useMemo(() => (selectedDate < historyStart ? olderDate === selectedDate ? olderRecords : [] : history.filter((row) => row.attendance_date === selectedDate)), [history, selectedDate, historyStart, olderRecords, olderDate]);
  const rosterIds = useMemo(() => new Set(students.map((student) => student.id)), [students]);
  const dateReady = !olderLoading && !(selectedDate < historyStart && (olderError || olderDate !== selectedDate));
  const selectedMarks = useMemo(() => dateRecords.filter((row) => rosterIds.has(row.student_id)), [dateRecords, rosterIds]);
  const stats = useMemo(() => attendanceCounts(selectedMarks, 'student'), [selectedMarks]);
  const previousStats = useMemo(() => attendanceCounts(history.filter((row) => row.attendance_date === daysBefore(selectedDate, 1) && rosterIds.has(row.student_id)), 'student'), [history, selectedDate, rosterIds]);
  const comparable = dateReady && students.length > 0 && stats.marked === students.length && previousStats.marked === students.length;
  const classSummaries = useMemo(() => groups.map((group) => {
    const ids = new Set(group.students.map((student) => student.id));
    const counts = attendanceCounts(selectedMarks.filter((row) => ids.has(row.student_id)), 'student');
    return { ...group, ...counts, total: group.students.length };
  }), [groups, selectedMarks]);
  const selected = groups.find((group) => group.key === selectedGroup);

  useEffect(() => {
    // The marking form intentionally resets when the selected group or date changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selected) { setEditable([]); return; }
    const marks = new Map(dateRecords.map((row) => [row.student_id, row.status as Status]));
    setEditable(selected.students.map((student) => ({ ...student, status: marks.get(student.id) || 'unmarked' })));
  }, [selected, dateRecords]);

  const lowAttendance = useMemo(() => {
    const tally = new Map<string, { attended: number; marked: number }>();
    history.filter((row) => rosterIds.has(row.student_id) && ['present', 'late', 'absent'].includes(row.status)).forEach((row) => {
      const item = tally.get(row.student_id) || { attended: 0, marked: 0 };
      item.marked++; if (row.status === 'present' || row.status === 'late') item.attended++;
      tally.set(row.student_id, item);
    });
    return students.map((student) => ({ ...student, tally: tally.get(student.id) }))
      .filter((student) => student.tally && student.tally.attended / student.tally.marked < 0.75)
      .filter((student) => selectedGroup === 'All' || sectionKey(student.class, student.section) === selectedGroup)
      .filter((student) => student.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => a.tally!.attended / a.tally!.marked - b.tally!.attended / b.tally!.marked);
  }, [history, students, rosterIds, selectedGroup, search]);
  const editStats = useMemo(() => attendanceCounts(editable.filter((student) => student.status !== 'unmarked').map((student) => ({ attendance_date: selectedDate, status: student.status })), 'student'), [editable, selectedDate]);
  const unmarked = editable.length - editStats.marked;
  const studentTrend = useMemo(() => dailyRates(history.filter((row) => rosterIds.has(row.student_id)), today, studentDays, 'student'), [history, rosterIds, today, studentDays]);
  const teacherTrend = useMemo(() => dailyRates(teacherHistory, today, teacherDays, 'teacher'), [teacherHistory, today, teacherDays]);
  const studentPrevious = useMemo(() => dailyRates(history.filter((row) => rosterIds.has(row.student_id)), daysBefore(today, studentDays), studentDays, 'student').average, [history, rosterIds, today, studentDays]);
  const teacherPrevious = useMemo(() => dailyRates(teacherHistory, daysBefore(today, teacherDays), teacherDays, 'teacher').average, [teacherHistory, today, teacherDays]);

  function chooseGroup(key: string) { setSelectedGroup(key); setNotice(''); setError(''); }
  async function saveAttendance() {
    if (!schoolId || !selected || !editable.length || olderLoading || (selectedDate < historyStart && (olderError || olderDate !== selectedDate))) return;
    if (unmarked) { setError(`Mark all students first. ${unmarked} still unmarked.`); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const existing = new Set(dateRecords.map((record) => record.student_id));
      const updates = editable.filter((student) => existing.has(student.id));
      const inserts = editable.filter((student) => !existing.has(student.id));
      const updateResults = await Promise.all(updates.map((student) => supabase.from('attendance').update({ status: student.status }).eq('school_id', schoolId).eq('student_id', student.id).eq('attendance_date', selectedDate)));
      const failed = updateResults.find((result) => result.error)?.error;
      if (failed) throw failed;
      if (inserts.length) {
        const { error: insertError } = await supabase.from('attendance').insert(inserts.map((student) => ({ school_id: schoolId, student_id: student.id, attendance_date: selectedDate, section: student.section, status: student.status })));
        if (insertError) throw insertError;
      }
      setNotice(`Attendance saved for ${selected.label} on ${selectedDate}.`);
      setRefreshKey((value) => value + 1);
    } catch (cause) { console.error('Attendance save error', cause); setError(cause instanceof Error ? cause.message : 'Attendance could not be saved.'); }
    finally { setSaving(false); }
  }
  function exportCsv() {
    const studentMap = new Map(students.map((student) => [student.id, student]));
    const rows = [['Date', 'Student', 'Class', 'Section', 'Roll number', 'Status']];
    selectedMarks.forEach((record) => {
      const student = studentMap.get(record.student_id);
      if (!student || (selectedGroup !== 'All' && sectionKey(student.class, student.section) !== selectedGroup)) return;
      rows.push([record.attendance_date, student.name, student.class || '', student.section || '', student.roll_no || '', record.status]);
    });
    if (rows.length === 1) { setError('There is no saved attendance to export for this selection.'); return; }
    const csv = rows.map((row) => row.map((cell) => { const safe = /^[=+@-]/.test(String(cell)) ? `'${cell}` : String(cell); return `"${safe.replaceAll('\"', '\"\"')}"`; }).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `attendance-${selectedDate}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="rounded-xl bg-white p-6 text-center dark:bg-slate-900">
        <h1 className="text-lg font-bold dark:text-white">Please sign in</h1>
        <Link href="/auth/login?role=principal" className="mt-3 inline-block text-sm text-blue-600">Go to login</Link>
      </div>
    </main>
  );

  const statCards = [
    { label: 'Present', value: dateReady ? stats.present : '—', icon: UsersRound, tone: 'emerald' as const, delta: comparable ? stats.present - previousStats.present : null },
    { label: 'Absent', value: dateReady ? stats.absent : '—', icon: UserX, tone: 'rose' as const, delta: comparable ? stats.absent - previousStats.absent : null },
    { label: 'Late', value: dateReady ? stats.late : '—', icon: Clock3, tone: 'amber' as const, delta: comparable ? stats.late - previousStats.late : null },
    { label: 'Attendance Rate', value: dateReady && stats.percentage !== null ? `${stats.percentage}%` : '—', icon: GraduationCap, tone: 'blue' as const, delta: comparable ? stats.percentage! - previousStats.percentage! : null },
  ];

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950 dark:bg-slate-950 dark:text-white">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px] space-y-4">
            <header className="relative -mx-3.5 flex min-h-32 items-center gap-4 overflow-hidden rounded-b-2xl bg-gradient-to-br from-[#e7f2ff] via-[#f7fbff] to-[#cfe5ff] px-5 py-5 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:mx-0 sm:min-h-36 sm:rounded-2xl sm:border sm:border-blue-100 sm:px-8 sm:dark:border-blue-900/60">
              <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-blue-100/80 text-blue-600 dark:bg-blue-400/15 dark:text-blue-200"><CalendarDays className="h-8 w-8" /></span>
              <div className="relative z-10"><h1 className="text-[1.7rem] font-extrabold tracking-tight sm:text-4xl">Attendance</h1><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600 dark:text-blue-100 sm:max-w-md sm:text-base">Manage student and teacher attendance across your school.</p></div>
              <CalendarDays className="pointer-events-none absolute -right-3 -bottom-6 h-32 w-32 rotate-[-12deg] text-blue-400/10 dark:text-blue-300/10" aria-hidden="true" />
            </header>

            {(error || notice) && <p role={error ? 'alert' : 'status'} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'}`}>{error ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}{error || notice}</p>}
            {!loadedSuccessfully ? <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Retry loading attendance</button> : <>
              <section aria-label="Student attendance summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">{statCards.map((card) => <StatCard key={card.label} {...card} />)}</section>

              <section aria-label="Attendance controls" className="space-y-2">
                <div className="grid grid-cols-2 gap-2 sm:max-w-xl">
                  <label className="relative flex min-w-0 items-center rounded-xl border border-slate-200 bg-white pl-8 shadow-sm dark:border-slate-700 dark:bg-slate-900"><CalendarDays className="absolute left-2.5 h-4 w-4 text-slate-500" /><span className="sr-only">Date</span><input type="date" max={today} value={selectedDate} onChange={(event) => { const value = event.target.value; if (!value) return; setSelectedDate(value); setOlderLoading(value < historyStart); setOlderError(false); setNotice(''); }} className="h-11 min-w-0 w-full bg-transparent pr-2 text-[11px] font-medium outline-none dark:[color-scheme:dark] sm:text-xs" /></label>
                  <label className="relative flex min-w-0 items-center rounded-xl border border-slate-200 bg-white pl-8 shadow-sm dark:border-slate-700 dark:bg-slate-900"><Filter className="absolute left-2.5 h-4 w-4 text-slate-500" /><span className="sr-only">Class and section</span><select value={selectedGroup} onChange={(event) => chooseGroup(event.target.value)} className="h-11 min-w-0 w-full bg-transparent pr-1 text-[11px] font-medium outline-none sm:text-xs"><option value="All">All classes</option>{groups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}</select></label>
                </div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 sm:max-w-xl">
                  <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-semibold shadow-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 sm:px-3 sm:text-xs"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button>
                  <button type="button" onClick={() => chooseGroup(selectedGroup === 'All' ? groups[0]?.key || 'All' : selectedGroup)} disabled={!groups.length || !dateReady} className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 text-[10px] font-semibold text-white shadow-sm shadow-blue-200 disabled:opacity-50 dark:shadow-none sm:text-xs"><UserPlus className="h-3.5 w-3.5 shrink-0" />Mark attendance</button>
                  <button type="button" onClick={exportCsv} disabled={!dateReady} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-semibold shadow-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 sm:px-3 sm:text-xs"><Download className="h-3.5 w-3.5" />Export CSV</button>
                </div>
              </section>

              {!dateReady ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">{olderError ? 'Attendance for this date is unavailable. Refresh to retry.' : `Loading attendance for ${selectedDate}…`}</p> : !students.length ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs dark:border-slate-700 dark:bg-slate-900"><Users className="mx-auto mb-2 h-6 w-6 text-slate-400" /><strong>No students assigned yet</strong><p className="mt-1 text-slate-500">Add students before taking attendance.</p><Link href="/principal/students" className="mt-2 inline-block font-semibold text-blue-600">Open students</Link></section> : <>
                {selected ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-3 dark:border-slate-700"><div><h2 className="text-sm font-bold">Mark attendance · {selected.label}</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">{editable.length} students · {unmarked} unmarked</p></div><button type="button" onClick={() => setEditable((current) => current.map((student) => ({ ...student, status: 'present' })))} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-semibold dark:border-slate-700">Mark all present</button></div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">{editable.map((student) => <div key={student.id} className="flex items-center gap-2 px-3 py-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{initials(student.name)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{student.name}</strong><span className="block truncate text-[10px] text-slate-500">Roll {student.roll_no || '—'}</span></span><select aria-label={`Attendance for ${student.name}`} value={student.status} onChange={(event) => setEditable((current) => current.map((row) => row.id === student.id ? { ...row, status: event.target.value as Status } : row))} className={`${field} max-w-28`}><option value="unmarked">Unmarked</option><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option></select></div>)}</div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-3 dark:border-slate-700"><span className="text-[10px] text-slate-500">{editStats.present} present · {editStats.late} late · {editStats.absent} absent</span><button type="button" onClick={saveAttendance} disabled={saving || refreshing || olderLoading || olderError || (selectedDate < historyStart && olderDate !== selectedDate) || !editable.length || unmarked > 0} className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{saving ? 'Saving…' : 'Save attendance'}</button></div>
                </section> : <>
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <button type="button" disabled={!groups.length} onClick={() => chooseGroup(groups[0]?.key || 'All')} className="flex w-full items-center justify-between text-left"><h2 className="text-base font-bold">{selectedDate === today ? "Today's attendance" : `Attendance · ${selectedDate}`}</h2><ChevronRight className="h-4 w-4 text-slate-500" /></button>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats.marked ? `${stats.present + stats.late} of ${stats.marked} marked students attended` : 'Attendance has not been marked yet.'}</p>
                    <div className="mt-3 flex items-center gap-3"><strong className="shrink-0 text-2xl font-extrabold">{stats.percentage === null ? '—' : `${stats.percentage}%`}</strong><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${stats.percentage || 0}%` }} /></span></div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />{stats.present} Present</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />{stats.absent} Absent</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />{stats.late} Late</span><span className="ml-auto">{stats.marked}/{students.length} marked</span></div>
                  </section>
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700"><h2 className="text-base font-bold">Class attendance</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">View and manage {selectedDate === today ? "today's" : selectedDate} attendance by class.</p></div><div className="divide-y divide-slate-100 px-3 dark:divide-slate-800">{classSummaries.map((group, index) => <ClassRow key={group.key} group={group} index={index} onClick={() => chooseGroup(group.key)} />)}</div></section>
                </>}
              </>}

              <div className="grid gap-4 xl:grid-cols-2"><TrendCard title="Student attendance" tone="#1675ef" soft="blue" days={studentDays} setDays={setStudentDays} trend={studentTrend} previous={studentPrevious} /><TrendCard title="Teacher attendance" tone="#7839ee" soft="violet" days={teacherDays} setDays={setTeacherDays} trend={teacherTrend} previous={teacherPrevious} /></div>

              <section id="low-attendance" className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"><TriangleAlert className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Low attendance</h2><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Students below 75% during the last 90 days.</p></div><span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">{lowAttendance.length} students</span></div>
                <label className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student..." className="w-full bg-transparent text-xs outline-none" /></label>
                <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">{lowAttendance.map((student) => <Link href={`/principal/students?student=${encodeURIComponent(student.id)}`} key={student.id} className="flex items-center gap-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">{initials(student.name)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{student.name}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{[student.class || 'Unassigned', student.section && `Section ${student.section}`].filter(Boolean).join(' · ')}</span></span><strong className="rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">{Math.round(student.tally!.attended / student.tally!.marked * 100)}%</strong><ChevronRight className="h-4 w-4 text-slate-400" /></Link>)}</div>
                {!lowAttendance.length && <div className="mt-2 rounded-xl bg-slate-50 p-5 text-center dark:bg-slate-800"><UsersRound className="mx-auto h-6 w-6 text-slate-400" /><p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{search ? 'No matching students.' : 'No low-attendance students.'}</p><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{search ? 'Try another name.' : 'No recorded student is below 75% in the last 90 days.'}</p></div>}
              </section>
            </>}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone, delta }: { label: string; value: string | number; icon: React.ElementType; tone: 'emerald' | 'rose' | 'amber' | 'blue'; delta: number | null }) {
  const colors = { emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' };
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-1.5 py-2.5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-3"><span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-4 w-4" /></span><strong className="mt-1 block truncate text-base font-extrabold leading-none sm:text-xl">{value}</strong><span className="mt-1 block min-h-6 text-[9px] leading-3 text-slate-500 dark:text-slate-400 sm:min-h-0 sm:text-xs">{label}</span><span className="mt-0.5 block h-3 text-[9px] text-slate-500 dark:text-slate-400">{delta === null ? '' : `${delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : ''}${delta}${label === 'Attendance Rate' ? ' pts' : ''}`}</span></div>;
}

type ClassSummary = Group & ReturnType<typeof attendanceCounts> & { total: number };
function ClassRow({ group, index, onClick }: { group: ClassSummary; index: number; onClick: () => void }) {
  const badge = ['bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300', 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300', 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300'][index % 4];
  const number = group.className.match(/\d+/)?.[0] || group.className.slice(0, 1).toUpperCase();
  return <button type="button" onClick={onClick} className="grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${badge}`}>{number}</span><span className="min-w-0"><strong className="block truncate text-xs">{group.className}{group.section ? ` (${group.section})` : ''}</strong><span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">{group.total} students <span className="mx-1 text-emerald-600">●</span>{group.present} <span className="mx-1 text-rose-500">●</span>{group.absent} <span className="mx-1 text-amber-500">●</span>{group.late}</span><span title={`${group.marked} of ${group.total} marked`} className="mt-1.5 block h-1.5 max-w-52 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${group.total ? group.marked / group.total * 100 : 0}%` }} /></span></span><span className="flex items-center gap-1"><span className="text-right"><strong className="block rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{group.percentage === null ? '—' : `${group.percentage}%`}</strong><span className={`mt-1 block whitespace-nowrap text-[9px] ${group.marked === group.total ? 'text-slate-500' : 'text-amber-600 dark:text-amber-400'}`}>{group.marked === group.total ? `Marked ${group.marked}/${group.total}` : `Not marked ${group.marked}/${group.total}`}</span></span><ChevronRight className="h-4 w-4 text-slate-400" /></span></button>;
}

function TrendCard({ title, tone, soft, days, setDays, trend, previous }: { title: string; tone: string; soft: 'blue' | 'violet'; days: 7 | 14 | 30; setDays: (days: 7 | 14 | 30) => void; trend: ReturnType<typeof dailyRates>; previous: number | null }) {
  const difference = trend.average !== null && previous !== null ? Math.round((trend.average - previous) * 10) / 10 : null;
  const values = trend.points.flatMap((point) => point.rate === null ? [] : [point.rate]);
  const lowest = values.length ? Math.min(...values) : 0;
  const yMin = lowest >= 80 ? 70 : lowest >= 60 ? 50 : 0;
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${soft === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300'}`}><UsersRound className="h-4 w-4" /></span><h2 className="text-sm font-bold">{title}</h2></div><div role="group" aria-label={`${title} period`} className="flex shrink-0 gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">{([7, 14, 30] as const).map((value) => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)} className={`rounded-md px-2 py-1.5 text-[10px] font-semibold ${days === value ? soft === 'blue' ? 'bg-blue-600 text-white shadow-sm' : 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>{value} Days</button>)}</div></div><div className="mt-3 flex items-center gap-3"><strong className="text-3xl font-extrabold tracking-tight">{trend.average === null ? '—' : `${trend.average}%`}</strong><div className="min-w-0 text-[11px] text-slate-500 dark:text-slate-400"><p>Average attendance</p><p className={difference === null ? '' : difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{difference === null ? `${trend.recordedDays} recorded days` : `${difference > 0 ? '↑ +' : difference < 0 ? '↓ ' : ''}${difference} pts from previous ${days} days`}</p></div></div>{trend.recordedDays ? <div className="mt-3 h-44 w-full sm:h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend.points} margin={{ top: 8, right: 8, bottom: 2, left: -22 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.4} /><XAxis dataKey="date" tickFormatter={(date: string) => trend.points.find((point) => point.date === date)?.label || date} interval={days === 30 ? 6 : days === 14 ? 3 : 1} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} /><YAxis domain={[yMin, 100]} ticks={yMin === 70 ? [70, 80, 90, 100] : yMin === 50 ? [50, 60, 70, 80, 90, 100] : [0, 25, 50, 75, 100]} tickFormatter={(value: number) => `${value}%`} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={45} /><Tooltip labelFormatter={(date) => trend.points.find((point) => point.date === date)?.label || String(date)} formatter={(value) => [value === null ? 'No record' : `${value}%`, 'Attendance']} contentStyle={{ backgroundColor: '#0f172a', color: '#fff', border: 0, borderRadius: 8, fontSize: 11 }} /><Line type="monotone" dataKey="rate" stroke={tone} strokeWidth={2.5} dot={days === 30 ? false : { r: 3, fill: tone, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false}>{days === 7 && <LabelList dataKey="rate" position="top" formatter={(value) => value == null ? '' : `${value}%`} className="fill-slate-600 text-[9px] dark:fill-slate-300" />}</Line></LineChart></ResponsiveContainer></div> : <p className="mt-3 rounded-xl bg-slate-50 p-7 text-center text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">No attendance recorded in this period.</p>}<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Unrecorded dates are left blank.</p></section>;
}

function PageSkeleton() { return <div className="min-h-screen bg-white dark:bg-slate-950"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-3.5 pb-24 pt-7 sm:px-6 lg:pt-24"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-28 rounded-2xl bg-blue-50 dark:bg-slate-900" /><div className="mt-3 grid grid-cols-4 gap-1.5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900" />)}</div><div className="mt-3 h-48 rounded-2xl bg-slate-100 dark:bg-slate-900" /></div></main></div></div>; }
