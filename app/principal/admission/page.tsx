'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CalendarDays, CheckCircle, Clock, Eye, GraduationCap,
  Inbox, Loader2, Mail, MapPin, Phone, RefreshCw, Search, User, X, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';
type Application = {
  id: string;
  school_id: string;
  student_name: string;
  class: string;
  gender: string | null;
  dob: string | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  address: string | null;
  previous_school: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
};
type Filter = 'all' | ApplicationStatus;

function normalizedStatus(value: string | null): ApplicationStatus {
  const status = value?.toLowerCase();
  return status === 'approved' || status === 'rejected' ? status : 'pending';
}
function titleCase(value: string) {
  return value.trim().replace(/\s+/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
function initials(name: string) {
  return name ? name.split(' ').filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase() : '—';
}
function dateLabel(value: string | null) {
  if (!value) return 'Date unavailable';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Application | null>(null);
  const [processing, setProcessing] = useState(false);
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

        const { data, error: applicationError } = await supabase
          .from('admission_applications')
          .select('id, school_id, student_name, class, gender, dob, parent_name, parent_phone, parent_email, address, previous_school, message, status, created_at')
          .eq('school_id', profile.school_id)
          .order('created_at', { ascending: false });
        if (applicationError) throw applicationError;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setApplications((data || []) as Application[]);
        }
      } catch (loadError) {
        console.error('Admissions load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Applications could not be loaded.');
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((item) => normalizedStatus(item.status) === 'pending').length,
    approved: applications.filter((item) => normalizedStatus(item.status) === 'approved').length,
    rejected: applications.filter((item) => normalizedStatus(item.status) === 'rejected').length,
  }), [applications]);

  const filtered = useMemo(() => applications.filter((item) => {
    const itemStatus = normalizedStatus(item.status);
    const query = search.trim().toLowerCase();
    const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
    const matchesSearch = !query ||
      item.student_name.toLowerCase().includes(query) ||
      item.parent_name.toLowerCase().includes(query) ||
      item.parent_phone.includes(query) ||
      item.class.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  }), [applications, statusFilter, search]);

  async function rejectApplication(application: Application) {
    if (!schoolId) return;
    setProcessing(true); setError(''); setNotice('');
    try {
      const { error: updateError } = await supabase
        .from('admission_applications')
        .update({ status: 'rejected' })
        .eq('id', application.id)
        .eq('school_id', schoolId);
      if (updateError) throw updateError;
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status: 'rejected' } : item));
      setSelected(null);
      setNotice(`${application.student_name}'s application was rejected.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Application could not be rejected.');
    } finally { setProcessing(false); }
  }

  async function approveAndAddStudent(application: Application) {
    if (!schoolId) return;
    setProcessing(true); setError(''); setNotice('');
    try {
      const studentData = {
        school_id: schoolId,
        name: titleCase(application.student_name),
        class: application.class,
        section: null,
        roll_no: null,
        gender: application.gender || null,
        date_of_birth: application.dob || null,
        parent_name: application.parent_name ? titleCase(application.parent_name) : null,
        parent_phone: application.parent_phone || null,
        email: application.parent_email?.trim().toLowerCase() || null,
        address: application.address || null,
      };
      const { data: student, error: studentError } = await supabase
        .from('students').insert(studentData).select('id').single();
      if (studentError) throw new Error('Student could not be created: ' + studentError.message);

      const { error: updateError } = await supabase
        .from('admission_applications')
        .update({ status: 'approved' })
        .eq('id', application.id)
        .eq('school_id', schoolId);
      if (updateError) {
        await supabase.from('students').delete().eq('id', student.id).eq('school_id', schoolId);
        throw new Error('Application could not be approved: ' + updateError.message);
      }

      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status: 'approved' } : item));
      setSelected(null);
      setNotice(`${application.student_name} was approved and added to Students.`);
    } catch (actionError) {
      console.error('Admission approval error', actionError);
      setError(actionError instanceof Error ? actionError.message : 'Application could not be approved.');
    } finally { setProcessing(false); }
  }

  if (loading) return <AdmissionsSkeleton />;
  if (!authenticated) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in as principal to review admission applications.</p>
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
                <p className="text-sm font-semibold text-blue-600">Student intake</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Admission inbox</h1>
                <p className="mt-2 text-sm text-slate-500">Review online applications and convert approved applicants into students.</p>
              </div>
              <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </header>

            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}
            </div>}

            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={Inbox} label="Total applications" value={stats.total} color="blue" />
              <Stat icon={Clock} label="Waiting for review" value={stats.pending} color="amber" />
              <Stat icon={CheckCircle} label="Approved" value={stats.approved} color="emerald" />
              <Stat icon={XCircle} label="Rejected" value={stats.rejected} color="red" />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
                <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                  {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((value) => (
                    <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${statusFilter === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{value}</button>
                  ))}
                </div>
                <label className="relative lg:ml-auto">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, parent, phone or class" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-72" />
                </label>
              </div>

              {!filtered.length ? <EmptyState filtered={Boolean(search || statusFilter !== 'all')} /> : (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((application) => {
                    const applicationStatus = normalizedStatus(application.status);
                    return <article key={application.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{initials(application.student_name)}</span>
                        <div className="min-w-0 flex-1"><h2 className="truncate font-bold text-slate-950">{application.student_name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><GraduationCap className="h-3.5 w-3.5" />Applying for Class {application.class}</p></div>
                        <StatusBadge status={applicationStatus} />
                      </div>
                      <div className="mt-5 flex-1 space-y-2.5 text-xs text-slate-500">
                        <p className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{application.parent_name}</p>
                        <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{application.parent_phone}</p>
                        <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />Applied {dateLabel(application.created_at)}</p>
                      </div>
                      <button type="button" onClick={() => { setSelected(application); setError(''); setNotice(''); }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"><Eye className="h-4 w-4" />Review application</button>
                    </article>;
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {selected && <ApplicationModal application={selected} processing={processing} onClose={() => setSelected(null)} onApprove={() => approveAndAddStudent(selected)} onReject={() => rejectApplication(selected)} />}
    </div>
  );
}

function ApplicationModal({ application, processing, onClose, onApprove, onReject }: { application: Application; processing: boolean; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const status = normalizedStatus(application.status);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !processing) onClose(); }}>
    <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start gap-4 bg-slate-950 p-6 text-white">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-700">{initials(application.student_name)}</span>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{application.student_name}</h2><StatusBadge status={status} /></div><p className="mt-1 text-sm text-slate-300">Applying for Class {application.class} · {dateLabel(application.created_at)}</p></div>
        <button type="button" onClick={onClose} disabled={processing} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
      </div>
      <div className="overflow-y-auto p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <InfoSection title="Student information">
            <Info icon={User} label="Gender" value={application.gender} />
            <Info icon={CalendarDays} label="Date of birth" value={application.dob} />
            <Info icon={MapPin} label="Address" value={application.address} />
            <Info icon={GraduationCap} label="Previous school" value={application.previous_school} />
          </InfoSection>
          <InfoSection title="Parent or guardian">
            <Info icon={User} label="Name" value={application.parent_name} />
            <Info icon={Phone} label="Phone" value={application.parent_phone} />
            <Info icon={Mail} label="Email" value={application.parent_email} />
          </InfoSection>
        </div>
        {application.message && <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Applicant message</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{application.message}</p></div>}
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        {status === 'pending' ? <><button type="button" onClick={onReject} disabled={processing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button><button type="button" onClick={onApprove} disabled={processing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}{processing ? 'Processing…' : 'Approve and add student'}</button></> : <p className="py-2 text-sm text-slate-500">This application has already been {status}.</p>}
      </div>
    </div>
  </div>;
}
function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3><div className="mt-4 space-y-4">{children}</div></section>;
}
function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><div><p className="text-xs text-slate-400">{label}</p><p className="mt-0.5 text-sm font-medium text-slate-800">{value || 'Not provided'}</p></div></div>;
}
function StatusBadge({ status }: { status: ApplicationStatus }) {
  const style = status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-700 ring-amber-200';
  const Icon = status === 'approved' ? CheckCircle : status === 'rejected' ? XCircle : Clock;
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${style}`}><Icon className="h-3 w-3" />{status}</span>;
}
function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: 'blue' | 'amber' | 'emerald' | 'red' }) {
  const styles = { blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[color]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-bold text-slate-950">{value}</p></div></div></div>;
}
function EmptyState({ filtered }: { filtered: boolean }) {
  return <div className="px-6 py-16 text-center"><Inbox className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-4 font-bold text-slate-900">{filtered ? 'No matching applications' : 'No admission applications yet'}</h3><p className="mt-1 text-sm text-slate-500">{filtered ? 'Try changing your search or status filter.' : 'Applications submitted from your public school website will appear here.'}</p></div>;
}
function AdmissionsSkeleton() {
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-2xl bg-white" />)}</div><div className="mt-6 h-96 rounded-2xl bg-white" /></div></main></div></div>;
}
