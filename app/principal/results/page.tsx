'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CalendarDays, Check, CheckCircle, Clock, Download,
  Edit3, FileText, GraduationCap, Loader2, Plus, RefreshCw,
  Search, Trash2, Users, X,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Exam = { id: string; name: string; start_date: string | null };
type ExamState = 'upcoming' | 'today' | 'completed';
type ExamForm = { name: string; startDate: string };

function todayNepal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function examState(exam: Exam): ExamState {
  if (!exam.start_date || exam.start_date > todayNepal()) return 'upcoming';
  if (exam.start_date === todayNepal()) return 'today';
  return 'completed';
}
function dateLabel(date: string | null) {
  if (!date) return 'Date not set';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function ExamsResultsPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [filter, setFilter] = useState<'all' | ExamState>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState<ExamForm>({ name: '', startDate: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setRefreshing(true); setError('');
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

        const [examResult, studentResult, classResult] = await Promise.all([
          supabase.from('exams').select('id, name, start_date')
            .eq('school_id', profile.school_id)
            .order('start_date', { ascending: false }),
          supabase.from('students').select('id', { count: 'exact', head: true })
            .eq('school_id', profile.school_id),
          supabase.from('classes').select('id', { count: 'exact', head: true })
            .eq('school_id', profile.school_id),
        ]);
        if (examResult.error) throw examResult.error;
        if (studentResult.error) throw studentResult.error;
        if (classResult.error) throw classResult.error;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setExams((examResult.data || []) as Exam[]);
          setStudentCount(studentResult.count || 0);
          setClassCount(classResult.count || 0);
        }
      } catch (loadError) {
        console.error('Exams load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Exams could not be loaded.');
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const stats = useMemo(() => ({
    total: exams.length,
    upcoming: exams.filter((exam) => examState(exam) === 'upcoming').length,
    today: exams.filter((exam) => examState(exam) === 'today').length,
    completed: exams.filter((exam) => examState(exam) === 'completed').length,
  }), [exams]);

  const filtered = useMemo(() => exams.filter((exam) => {
    const query = search.trim().toLowerCase();
    return (filter === 'all' || examState(exam) === filter) &&
      (!query || exam.name.toLowerCase().includes(query));
  }), [exams, filter, search]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', startDate: '' });
    setError(''); setNotice(''); setModalOpen(true);
  }
  function openEdit(exam: Exam) {
    setEditing(exam);
    setForm({ name: exam.name, startDate: exam.start_date || '' });
    setError(''); setNotice(''); setModalOpen(true);
  }

  async function saveExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !form.name.trim() || !form.startDate) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const examData = { school_id: schoolId, name: form.name.trim(), start_date: form.startDate };
      const result = editing
        ? await supabase.from('exams').update({ name: examData.name, start_date: examData.start_date })
            .eq('id', editing.id).eq('school_id', schoolId)
        : await supabase.from('exams').insert(examData);
      if (result.error) throw result.error;
      setModalOpen(false);
      setNotice(editing ? 'Exam updated successfully.' : 'Exam created successfully.');
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Exam could not be saved.');
    } finally { setSaving(false); }
  }

  async function deleteExam(exam: Exam) {
    if (!schoolId || !window.confirm(`Delete "${exam.name}"? This cannot be undone.`)) return;
    setError(''); setNotice('');
    const { error: deleteError } = await supabase.from('exams')
      .delete().eq('id', exam.id).eq('school_id', schoolId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setExams((current) => current.filter((item) => item.id !== exam.id));
    setNotice('Exam deleted.');
  }

  function exportExams() {
    if (!filtered.length) {
      setError('There are no exams to export for this selection.');
      return;
    }
    const rows = [['Exam', 'Start date', 'Status']];
    filtered.forEach((exam) => rows.push([exam.name, exam.start_date || '', examState(exam)]));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'exams.csv'; anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in as principal to manage exams and results.</p>
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
                <p className="text-sm font-semibold text-blue-600">Academic assessment</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Exams & results</h1>
                <p className="mt-2 text-sm text-slate-500">Schedule examinations and keep the result workflow organized.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh
                </button>
                <button type="button" onClick={exportExams} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Download className="h-4 w-4" />Export
                </button>
                <button type="button" onClick={openCreate} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4" />Create exam
                </button>
              </div>
            </header>

            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}
            </div>}

            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={FileText} label="Total exams" value={stats.total} tone="blue" />
              <Stat icon={Clock} label="Upcoming" value={stats.upcoming} tone="violet" />
              <Stat icon={CalendarDays} label="Scheduled today" value={stats.today} tone="amber" />
              <Stat icon={CheckCircle} label="Past exams" value={stats.completed} tone="emerald" />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.5fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
                  <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                    {(['all', 'upcoming', 'today', 'completed'] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${filter === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{value === 'completed' ? 'Past' : value}</button>)}
                  </div>
                  <label className="relative lg:ml-auto">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exams" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-60" />
                  </label>
                </div>

                {!filtered.length ? <Empty filtered={Boolean(search || filter !== 'all')} onCreate={openCreate} /> : <div className="divide-y divide-slate-100">
                  {filtered.map((exam) => {
                    const state = examState(exam);
                    return <article key={exam.id} className="p-5 transition hover:bg-slate-50/60">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><GraduationCap className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-950">{exam.name}</h2><StateBadge state={state} /></div>
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{dateLabel(exam.start_date)}</p>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openEdit(exam)} className="rounded-lg p-2.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label={`Edit ${exam.name}`}><Edit3 className="h-4 w-4" /></button>
                          <button type="button" onClick={() => deleteExam(exam)} className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${exam.name}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </article>;
                  })}
                </div>}
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-slate-950">Result readiness</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">NEPSOM currently has exam scheduling data, but no connected result records in this repository. Fake pass rates and topper lists have been removed.</p>
                  <div className="mt-5 space-y-3">
                    <Readiness icon={Users} label="Students available" value={studentCount} ready={studentCount > 0} />
                    <Readiness icon={GraduationCap} label="Classes available" value={classCount} ready={classCount > 0} />
                    <Readiness icon={FileText} label="Exams created" value={exams.length} ready={exams.length > 0} />
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <h2 className="font-bold text-slate-950">Results need one data structure</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Subjects, maximum marks, pass marks, student scores and publish status must be stored before trustworthy report cards can be generated.</p>
                </div>
              </aside>
            </section>
          </div>
        </main>
      </div>

      {modalOpen && <Modal title={editing ? 'Edit exam' : 'Create exam'} onClose={() => setModalOpen(false)}>
        <form onSubmit={saveExam}>
          <div className="space-y-4 p-6">
            <Field label="Exam name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} placeholder="For example: First Terminal Examination" required />
            <Field label="Start date" type="date" value={form.startDate} onChange={(startDate) => setForm((current) => ({ ...current, startDate }))} required />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving || !form.name.trim() || !form.startDate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : editing ? 'Save changes' : 'Create exam'}</button></div>
        </form>
      </Modal>}
    </div>
  );
}

function StateBadge({ state }: { state: ExamState }) {
  const style = state === 'completed' ? 'bg-emerald-50 text-emerald-700' : state === 'today' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${style}`}>{state === 'completed' ? 'Past' : state}</span>;
}
function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: 'blue' | 'violet' | 'amber' | 'emerald' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-bold text-slate-950">{value}</p></div></div></div>;
}
function Readiness({ icon: Icon, label, value, ready }: { icon: React.ElementType; label: string; value: number; ready: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ready ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-xs font-medium text-slate-600">{label}</span><span className="font-bold text-slate-950">{value}</span></div>;
}
function Empty({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) {
  return <div className="px-6 py-16 text-center"><FileText className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-4 font-bold text-slate-900">{filtered ? 'No matching exams' : 'No exams created yet'}</h2><p className="mt-1 text-sm text-slate-500">{filtered ? 'Try changing the search or filter.' : 'Create the first exam for your school.'}</p>{!filtered && <button type="button" onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Create exam</button>}</div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">Add the examination name and schedule.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}
function Field({ label, value, onChange, type = 'text', placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span><input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>;
}
function PageSkeleton() {
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-2xl bg-white" />)}</div><div className="mt-6 h-96 rounded-2xl bg-white" /></div></main></div></div>;
}
