'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, FileText, GraduationCap, Inbox, Mail, Phone, RefreshCw, Search, UserRoundPlus, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

type Status = 'pending' | 'approved' | 'rejected';
type Application = { id: string; school_id: string; student_name: string; class: string | null; gender: string | null; dob: string | null; parent_name: string | null; parent_phone: string | null; parent_email: string | null; address: string | null; previous_school: string | null; message: string | null; status: string | null; created_at: string | null; reviewed_at: string | null; student_id: string | null };
type DateFilter = 'all' | 'today' | 'week' | 'month';
const nepalDay = (value: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
const dateLabel = (value: string | null, time = false) => value ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: 'numeric', minute: '2-digit' } : {}) }).format(new Date(value)) : 'Date unavailable';
const statusOf = (value: string | null): Status => value === 'approved' || value === 'rejected' ? value : 'pending';
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'details' | 'documents' | 'notes'>('details');
  const [confirm, setConfirm] = useState<Status | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setRefreshing(true); setError('');
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) { if (!cancelled) setAuthenticated(false); return; }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('school_id, role').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id || profile.role !== 'admin') throw new Error('Your principal school profile could not be loaded.');
        const { data, error: applicationError } = await supabase.from('admission_applications')
          .select('id, school_id, student_name, class, gender, dob, parent_name, parent_phone, parent_email, address, previous_school, message, status, created_at, reviewed_at, student_id')
          .eq('school_id', profile.school_id).order('created_at', { ascending: false });
        if (applicationError) throw applicationError;
        if (!cancelled) {
          setApplications((data || []) as Application[]);
          const id = new URLSearchParams(window.location.search).get('application');
          if (id && data?.some(item => item.id === id)) {
            setSelectedId(id);
            window.history.replaceState(window.history.state, '', window.location.pathname);
          }
        }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Applications could not be loaded.'); }
      finally { if (!cancelled) { setLoading(false); setRefreshing(false); } }
    }
    load(); return () => { cancelled = true; };
  }, [refreshKey]);

  const selected = applications.find(item => item.id === selectedId) || null;
  const stats = useMemo(() => ({ total: applications.length, pending: applications.filter(item => statusOf(item.status) === 'pending').length, approved: applications.filter(item => statusOf(item.status) === 'approved').length, rejected: applications.filter(item => statusOf(item.status) === 'rejected').length }), [applications]);
  const classes = useMemo(() => [...new Set(applications.map(item => item.class).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [applications]);
  const filtered = useMemo(() => applications.filter(item => {
    const query = search.trim().toLowerCase();
    const days = dateFilter === 'today' ? 0 : dateFilter === 'week' ? 7 : dateFilter === 'month' ? 30 : null;
    const today = nepalDay(new Date().toISOString());
    const from = new Date(); from.setUTCDate(from.getUTCDate() - (days || 0));
    return (classFilter === 'all' || item.class === classFilter) && (statusFilter === 'all' || statusOf(item.status) === statusFilter)
      && (days === null || (item.created_at && (days === 0 ? nepalDay(item.created_at) === today : new Date(item.created_at) >= from)))
      && (!query || [item.student_name, item.parent_name, item.parent_phone, item.class].some(value => value?.toLowerCase().includes(query)));
  }).sort((a, b) => Number(statusOf(b.status) === 'pending') - Number(statusOf(a.status) === 'pending') || 0), [applications, classFilter, statusFilter, dateFilter, search]);
  // Pending first; the server's newest-first ordering remains stable within each group.

  async function review(decision: Status) {
    if (!selected || processing) return;
    setProcessing(true); setError(''); setNotice('');
    try {
      const { data, error: actionError } = await supabase.rpc('review_admission', { p_application_id: selected.id, p_decision: decision });
      if (actionError) throw actionError;
      setApplications(current => current.map(item => item.id === selected.id ? data as Application : item));
      setNotice(decision === 'approved' ? `${selected.student_name} was approved and added to Students.` : `${selected.student_name}'s application was rejected.`);
      setConfirm(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The application could not be reviewed.'); setConfirm(null); }
    finally { setProcessing(false); }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="mx-auto max-w-6xl animate-pulse px-4 pb-24 pt-24"><div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="mt-4 grid grid-cols-4 gap-2">{[0,1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />)}</div></main></div></div>;
  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950"><div className="rounded-2xl bg-white p-6 text-center dark:bg-slate-900"><h1 className="font-bold dark:text-white">Please sign in</h1><Link href="/auth/login?role=principal" className="mt-3 inline-block text-blue-600">Go to login</Link></div></main>;

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><Sidebar /><div className="flex min-h-screen flex-col pt-10 lg:ml-64"><TopBar /><main className="flex-1 px-3 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <header className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-100 px-4 py-5 dark:border-blue-900 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 sm:px-6"><GraduationCap className="pointer-events-none absolute -right-3 -bottom-8 h-36 w-36 rotate-[-18deg] text-blue-200/45 dark:text-blue-700/20" /><div className="relative flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"><UserRoundPlus className="h-6 w-6" /></span><div><h1 className="text-xl font-extrabold tracking-tight sm:text-3xl">Admissions</h1><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">Review and manage student admission applications.</p></div></div></header>
    {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}{error || notice}</div>}
    <section aria-label="Application overview" className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-3"><Stat icon={FileText} label="Total applications" value={stats.total} color="blue" /><Stat icon={Clock3} label="Pending" value={stats.pending} color="amber" /><Stat icon={CheckCircle2} label="Approved" value={stats.approved} color="emerald" /><Stat icon={XCircle} label="Rejected" value={stats.rejected} color="red" /></section>
    <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4"><div className="flex items-center gap-2"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search applicants" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applicants..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800" /></label><button type="button" onClick={() => setRefreshKey(value => value + 1)} disabled={refreshing} aria-label="Refresh applications" className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-700"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button></div>
      <div className="mt-2 grid grid-cols-3 gap-1.5"><select aria-label="Class applying for" value={classFilter} onChange={e => setClassFilter(e.target.value)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="all">All classes</option>{classes.map(value => <option key={value} value={value}>Class {value}</option>)}</select><select aria-label="Application status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="all">All status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><select aria-label="Application date" value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="all">All dates</option><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></div>
      {filtered.length ? <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">{filtered.map(item => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setTab('details'); setError(''); }} className="flex w-full items-center gap-2.5 px-1 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"><Avatar name={item.student_name} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-bold">{item.student_name}</span><Badge status={statusOf(item.status)} /></div><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">Class {item.class || '—'} · {item.parent_name || 'Guardian not provided'}</p><p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-500 dark:text-slate-400"><span>{item.parent_phone || 'No phone'}</span><span>{dateLabel(item.created_at)}</span></p></div><ChevronRight className="h-4 w-4 shrink-0 text-slate-400" /></button>)}</div> : <div className="py-10 text-center text-sm text-slate-500"><Inbox className="mx-auto mb-2 h-7 w-7 text-slate-400" />{applications.length ? 'No applications match these filters.' : 'Applications from your public school website will appear here.'}</div>}
    </section>
  </div></main></div>
  {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget && !processing) { setSelectedId(null); setConfirm(null); } }}><div role="dialog" aria-modal="true" aria-label="Application details" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl dark:bg-slate-950 sm:rounded-2xl"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"><button onClick={() => { setSelectedId(null); setConfirm(null); }} aria-label="Close details" className="p-1"><X className="h-5 w-5" /></button><h2 className="text-sm font-bold">Application Details</h2><span className="w-6" /></div><div className="overflow-y-auto p-3 sm:p-4"><div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><Avatar name={selected.student_name} large /><div className="min-w-0 flex-1"><h3 className="font-bold">{selected.student_name}</h3><p className="text-xs text-slate-600 dark:text-slate-300">Applying for Class {selected.class || '—'}</p><p className="mt-1 text-[11px] text-slate-500">Submitted {dateLabel(selected.created_at, true)}</p></div><Badge status={statusOf(selected.status)} /></div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <nav aria-label="Application sections" className="mt-3 grid grid-cols-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{(['details','documents','notes'] as const).map(value => <button key={value} type="button" onClick={() => setTab(value)} className={`border-b-2 py-2.5 text-xs font-semibold capitalize ${tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>{value}</button>)}</nav>
      {tab === 'details' ? <div className="mt-3 space-y-3"><InfoCard title="Student Information" entries={[["Full name",selected.student_name],["Date of birth",selected.dob],["Gender",selected.gender],["Applying for",selected.class ? `Class ${selected.class}` : null],["Previous school",selected.previous_school],["Address",selected.address]]} /><InfoCard title="Parent / Guardian Information" entries={[["Name",selected.parent_name],["Phone number",selected.parent_phone],["Email",selected.parent_email],["Address",selected.address]]} /><InfoCard title="Review" entries={[["Status",statusOf(selected.status)],["Reviewed at",selected.reviewed_at ? dateLabel(selected.reviewed_at,true) : null]]} />{selected.message && <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><h4 className="text-sm font-bold">Additional Information</h4><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{selected.message}</p></section>}</div> : tab === 'documents' ? <div className="mt-3 rounded-xl border border-slate-200 bg-white p-7 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><FileText className="mx-auto mb-2 h-6 w-6" />The school admission form does not accept document uploads.</div> : <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900"><h4 className="font-bold">Applicant message</h4><p className="mt-2 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{selected.message || 'No message was submitted.'}</p></div>}
    </div><div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">{statusOf(selected.status) === 'pending' && <><button onClick={() => setConfirm('approved')} disabled={processing} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white">✓ Approve</button><button onClick={() => setConfirm('rejected')} disabled={processing} className="flex-1 rounded-lg bg-red-600 px-3 py-2.5 text-xs font-bold text-white">× Reject</button></>}{selected.parent_phone && <a href={`tel:${selected.parent_phone}`} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold dark:border-slate-700"><Phone className="h-3.5 w-3.5" />Call</a>}{selected.parent_email && <a href={`mailto:${selected.parent_email}`} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold dark:border-slate-700"><Mail className="h-3.5 w-3.5" />Email</a>}</div></div></div>}
  {confirm && selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4"><div role="alertdialog" aria-modal="true" aria-label={`Confirm ${confirm}`} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"><h2 className="text-lg font-bold">{confirm === 'approved' ? 'Approve application?' : 'Reject application?'}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{confirm === 'approved' ? `${selected.student_name} will be added to Students. No login account will be created.` : `${selected.student_name}'s application will be kept as rejected without creating a student.`}</p><div className="mt-5 flex gap-2"><button onClick={() => setConfirm(null)} disabled={processing} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm dark:border-slate-700">Cancel</button><button onClick={() => review(confirm)} disabled={processing} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${confirm === 'approved' ? 'bg-emerald-600' : 'bg-red-600'}`}>{processing ? 'Saving…' : `Confirm ${confirm === 'approved' ? 'approval' : 'rejection'}`}</button></div></div></div>}
  </div>;
}
function Avatar({ name, large = false }: { name: string; large?: boolean }) { return <span className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-200 ${large ? 'h-14 w-14 text-lg' : 'h-11 w-11 text-xs'}`}>{initials(name)}</span>; }
function Badge({ status }: { status: Status }) { return <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : status === 'rejected' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{status}</span>; }
function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { const tone: Record<string,string> = { blue:'bg-blue-50 text-blue-600 dark:bg-blue-950', amber:'bg-amber-50 text-amber-600 dark:bg-amber-950', emerald:'bg-emerald-50 text-emerald-600 dark:bg-emerald-950', red:'bg-red-50 text-red-600 dark:bg-red-950' }; return <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-1 py-2 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3"><span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg ${tone[color]}`}><Icon className="h-4 w-4" /></span><p className="mt-1 text-base font-extrabold sm:text-xl">{value}</p><p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 sm:text-xs">{label}</p></div>; }
function InfoCard({ title, entries }: { title: string; entries: [string,string | null][] }) { return <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><h4 className="text-sm font-bold">{title}</h4><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">{entries.map(([label,value]) => <div key={label}><dt className="text-[11px] text-slate-500">{label}</dt><dd className="break-words text-xs font-medium">{value || 'Not provided'}</dd></div>)}</dl></section>; }
