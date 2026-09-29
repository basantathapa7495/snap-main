'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Bell, CalendarDays, Check, ChevronRight, Clock3, Edit3, Eye, FileText,
  GraduationCap, Loader2, Mail, Plus, RefreshCw, Search, Send, Trash2, UsersRound, X,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Notice = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  is_event: boolean | null;
  created_at: string | null;
};
type FormState = { title: string; description: string; publishDate: string };

function todayNepal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function dateLabel(value: string | null) {
  if (!value) return 'Date unavailable';
  return new Date(value.length === 10 ? `${value}T12:00:00Z` : value).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function relativeTime(value: string | null) {
  if (!value) return 'Date unavailable';
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : dateLabel(value);
}

export default function CommunicationPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tab, setTab] = useState<'overview' | 'notices' | 'messages' | 'scheduled'>('overview');
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [countsError, setCountsError] = useState('');
  const [audienceInfo, setAudienceInfo] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Notice | null>(null);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ title: '', description: '', publishDate: todayNepal() });
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

        const [noticeResult, teacherResult, studentResult] = await Promise.all([
          supabase.from('news_events')
            .select('id, title, description, event_date, is_event, created_at')
            .eq('school_id', profile.school_id)
            .eq('is_event', false)
            .order('created_at', { ascending: false }),
          supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', profile.school_id),
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', profile.school_id),
        ]);
        const { data, error: noticesError } = noticeResult;
        if (noticesError) throw noticesError;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setNotices((data || []) as Notice[]);
          setTeacherCount(teacherResult.error ? null : teacherResult.count || 0);
          setStudentCount(studentResult.error ? null : studentResult.count || 0);
          setCountsError(teacherResult.error || studentResult.error ? 'Audience counts could not be loaded.' : '');
          const params = new URLSearchParams(window.location.search);
          const requestedTab = params.get('tab');
          if (requestedTab === 'notices' || requestedTab === 'messages' || requestedTab === 'scheduled') setTab(requestedTab);
          const selectedNotice = (data || []).find((item) => item.id === params.get('notice'));
          if (selectedNotice) {
            setTab('notices');
            setSelected(selectedNotice as Notice);
            window.history.replaceState(window.history.state, '', window.location.pathname);
          } else if (params.get('action') === 'create') {
            setTab('notices');
            setEditing(null);
            setForm({ title: '', description: '', publishDate: todayNepal() });
            setFormOpen(true);
            window.history.replaceState(window.history.state, '', window.location.pathname);
          }
        }
      } catch (loadError) {
        console.error('Communication load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Notices could not be loaded.');
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notices.filter((item) => !query ||
      item.title.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query));
  }, [notices, search]);

  function openCreate() {
    setTab('notices');
    setEditing(null);
    setForm({ title: '', description: '', publishDate: todayNepal() });
    setError(''); setNotice(''); setFormOpen(true);
  }
  function openEdit(item: Notice) {
    setTab('notices');
    setEditing(item);
    setForm({ title: item.title, description: item.description || '', publishDate: item.event_date || todayNepal() });
    setSelected(null); setError(''); setNotice(''); setFormOpen(true);
  }

  async function saveNotice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !form.title.trim() || !form.description.trim() || !form.publishDate) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = {
        school_id: schoolId,
        title: form.title.trim(),
        description: form.description.trim(),
        event_date: form.publishDate,
        is_event: false,
      };
      const result = editing
        ? await supabase.from('news_events')
            .update({ title: payload.title, description: payload.description, event_date: payload.event_date })
            .eq('id', editing.id).eq('school_id', schoolId).eq('is_event', false)
        : await supabase.from('news_events').insert(payload);
      if (result.error) throw result.error;
      setFormOpen(false);
      setNotice(editing ? 'Notice updated successfully.' : 'Notice published successfully.');
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Notice could not be saved.');
    } finally { setSaving(false); }
  }

  async function deleteNotice(item: Notice) {
    if (!schoolId || !window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setError(''); setNotice('');
    const { error: deleteError } = await supabase.from('news_events')
      .delete().eq('id', item.id).eq('school_id', schoolId).eq('is_event', false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setNotices((current) => current.filter((existing) => existing.id !== item.id));
    setSelected(null);
    setNotice('Notice deleted.');
  }

  function chooseTab(value: typeof tab) {
    setTab(value);
    setAudienceInfo('');
    window.history.replaceState(window.history.state, '', value === 'overview' ? window.location.pathname : `${window.location.pathname}?tab=${value}`);
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in as principal to publish school notices.</p>
        <Link href="/auth/login?role=principal" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Go to login</Link>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="-mx-3.5 bg-gradient-to-br from-[#e7f2ff] via-[#f5faff] to-[#9dbcf4] px-4 py-5 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:mx-0 sm:rounded-2xl sm:border sm:border-blue-100 sm:px-8 sm:py-7 sm:dark:border-blue-900/60">
              <h1 className="text-[1.7rem] font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">Communication</h1>
              <p className="mt-1 text-xs text-slate-700 dark:text-blue-100 sm:text-base">Notices, messages and school announcements in one place.</p>
            </header>
            <nav aria-label="Communication sections" className="mb-3 mt-2 flex gap-5 overflow-x-auto border-b border-slate-200 dark:border-slate-700 [scrollbar-width:none]">
              {(['overview', 'notices', 'messages', 'scheduled'] as const).map((item) => <button key={item} type="button" onClick={() => chooseTab(item)} className={`shrink-0 border-b-2 px-0.5 py-2 text-xs font-semibold capitalize sm:text-sm ${tab === item ? 'border-blue-600 text-blue-700 dark:text-blue-300' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>{item}</button>)}
            </nav>

            {tab === 'overview' && <CommunicationOverview
              notices={notices}
              error={error}
              teacherCount={teacherCount}
              studentCount={studentCount}
              countsError={countsError}
              audienceInfo={audienceInfo}
              onAudience={(audience) => {
                if (audience === 'Everyone') openCreate();
                else setAudienceInfo(`${audience} targeting is not yet supported by the current school notice board. No notice has been sent.`);
              }}
              onNotice={(item) => setSelected(item)}
              onTab={chooseTab}
              onCreate={openCreate}
              onDrafts={() => { chooseTab('notices'); setAudienceInfo('Draft saving is not available in the current notice board. Existing notices are published immediately.'); }}
            />}

            {(tab === 'messages' || tab === 'scheduled') && <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-950 dark:text-white">{tab === 'messages' ? 'Messages' : 'Scheduled communications'}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tab === 'messages' ? 'Direct messaging is not available in the current school communication system.' : 'Scheduled delivery is not available in the current school communication system.'}</p></section>}

            {tab === 'notices' && <>
              {audienceInfo && <p role="status" className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{audienceInfo}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh
                </button>
                <button type="button" onClick={openCreate} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4" />Create notice
                </button>
              </div>

            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}
            </div>}

            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat icon={Bell} label="Published notices" value={notices.length} tone="blue" />
              <Stat icon={CalendarDays} label="Published this month" value={notices.filter((item) => item.event_date?.startsWith(todayNepal().slice(0, 7))).length} tone="emerald" />
              <Stat icon={FileText} label="Notice-board channel" value="Active" tone="violet" />
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                <div className="mr-auto"><h2 className="font-bold text-slate-950">Published notices</h2><p className="mt-1 text-xs text-slate-500">These records are stored in your school notice board.</p></div>
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notices" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64" />
                </label>
              </div>

              {!filtered.length ? <Empty filtered={Boolean(search)} onCreate={openCreate} /> : (
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((item) => <article key={item.id} className="flex min-h-60 flex-col rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Bell className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1"><h3 className="line-clamp-2 font-bold text-slate-950">{item.title}</h3><p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{dateLabel(item.event_date || item.created_at)}</p></div>
                    </div>
                    <p className="mt-4 line-clamp-4 flex-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description || 'No message added.'}</p>
                    <div className="mt-5 flex gap-1 border-t border-slate-100 pt-4">
                      <button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><Eye className="h-3.5 w-3.5" />View</button>
                      <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"><Edit3 className="h-3.5 w-3.5" />Edit</button>
                      <button type="button" onClick={() => deleteNotice(item)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                    </div>
                  </article>)}
                </div>
              )}
            </section>

            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-bold text-amber-950">Delivery channels</h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">Notice-board publishing is connected. SMS and email are not shown because no SMS or email provider is configured in this repository; showing those options would not actually deliver a message.</p>
            </section>
            </>}
          </div>
        </main>
      </div>

      {formOpen && <NoticeModal editing={Boolean(editing)} form={form} setForm={setForm} saving={saving} onClose={() => setFormOpen(false)} onSubmit={saveNotice} />}
      {selected && <ViewModal item={selected} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} onDelete={() => deleteNotice(selected)} />}
    </div>
  );
}

function CommunicationOverview({ notices, error, teacherCount, studentCount, countsError, audienceInfo, onAudience, onNotice, onTab, onCreate, onDrafts }: {
  notices: Notice[];
  error: string;
  teacherCount: number | null;
  studentCount: number | null;
  countsError: string;
  audienceInfo: string;
  onAudience: (audience: 'Teachers' | 'Students' | 'Everyone') => void;
  onNotice: (item: Notice) => void;
  onTab: (tab: 'overview' | 'notices' | 'messages' | 'scheduled') => void;
  onCreate: () => void;
  onDrafts: () => void;
}) {
  const summary = [
    { label: 'Published', count: String(notices.length), icon: Bell, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
    { label: 'Scheduled', count: '—', icon: Clock3, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300' },
    { label: 'Drafts', count: '—', icon: Edit3, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
    { label: 'Unread', count: '—', icon: Mail, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
  ];
  const actions = [
    { title: 'Send Notice', detail: 'School announcement', icon: Bell, action: onCreate, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
    { title: 'New Message', detail: 'Message someone', icon: Mail, action: () => onTab('messages'), tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' },
    { title: 'Schedule', detail: 'Send later', icon: CalendarDays, action: () => onTab('scheduled'), tone: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30' },
    { title: 'Drafts', detail: 'Continue writing', icon: FileText, action: onDrafts, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' },
  ];
  const audiences = [
    { title: 'Teachers' as const, members: teacherCount === null ? 'Unavailable' : `${teacherCount} members`, icon: GraduationCap },
    { title: 'Students' as const, members: studentCount === null ? 'Unavailable' : `${studentCount} members`, icon: UsersRound },
    { title: 'Everyone' as const, members: 'Whole school', icon: Send },
  ];
  return <div className="space-y-4 pb-6 text-slate-950 dark:text-white">
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p>}
    <section aria-label="Communication summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">{summary.map(({ label, count, icon: Icon, tone }) => <div key={label} title={count === '—' ? `${label} data is not available in the current communication system` : undefined} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900 sm:px-3 sm:py-2"><span className={`flex h-5 w-5 items-center justify-center rounded-md ${tone}`}><Icon className="h-3 w-3" /></span><strong className="mt-1 block text-base leading-none sm:text-xl">{count}</strong><span className="mt-1 block truncate text-[9px] leading-none text-slate-500 dark:text-slate-400 sm:text-xs">{label}</span></div>)}</section>
    <p className="-mt-2 text-[10px] text-slate-500 dark:text-slate-400">— means this feature is not available yet.</p>

    <section><div className="mb-2"><h2 className="text-base font-bold">Quick Actions</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Reach the right people quickly.</p></div><div className="grid grid-cols-2 gap-2">{actions.map(({ title, detail, icon: Icon, action, tone }) => <button key={title} type="button" onClick={action} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-xs">{title}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{detail}</span></span></button>)}</div></section>

    <section><div className="mb-2"><h2 className="text-base font-bold">Send To</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Start communication by audience.</p></div>{countsError && <p role="alert" className="mb-2 text-xs text-rose-600">{countsError}</p>}{audienceInfo && <p role="status" className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{audienceInfo}</p>}<div className="grid grid-cols-3 gap-1.5">{audiences.map(({ title, members, icon: Icon }) => <button key={title} type="button" onClick={() => onAudience(title)} className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><Icon className="mb-1 h-4 w-4 text-blue-600 dark:text-blue-300" /><strong className="block truncate text-[11px]">{title}</strong><span className="block truncate text-[9px] text-slate-500 dark:text-slate-400">{members}</span></button>)}</div></section>

    <section><div className="mb-2 flex items-end justify-between gap-2"><div><h2 className="text-base font-bold">Recent Notices</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Latest school announcements.</p></div><button type="button" onClick={() => onTab('notices')} className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-300">View all</button></div><div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">{notices.slice(0, 4).map((item) => <button key={item.id} type="button" onClick={() => onNotice(item)} className="flex w-full items-center gap-2 px-3 py-2 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.title}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">School-wide • {relativeTime(item.created_at)}</span></span><span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Published</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /></button>)}{!notices.length && <p className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">No notices published yet.</p>}</div></section>

    <section><div className="mb-2 flex items-end justify-between gap-2"><div><h2 className="text-base font-bold">Scheduled</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Communications waiting to be published.</p></div><button type="button" onClick={() => onTab('scheduled')} className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-300">View all</button></div><p className="rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Scheduled delivery is not available yet.</p></section>
  </div>;
}

function NoticeModal({ editing, form, setForm, saving, onClose, onSubmit }: { editing: boolean; form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; saving: boolean; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><div role="dialog" aria-modal="true" className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-bold text-slate-950">{editing ? 'Edit notice' : 'Create notice'}</h2><p className="mt-1 text-sm text-slate-500">Publish an announcement to the school notice board.</p></div><button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></div><form onSubmit={onSubmit}><div className="space-y-4 p-6"><Field label="Notice title" value={form.title} onChange={(title) => setForm((current) => ({ ...current, title }))} placeholder="For example: Parent-teacher meeting" required /><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Message <span className="text-red-500">*</span></span><textarea required rows={6} maxLength={3000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Write the complete announcement..." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /><p className="mt-1 text-right text-xs text-slate-400">{form.description.length}/3000</p></label><Field label="Publish date" type="date" value={form.publishDate} onChange={(publishDate) => setForm((current) => ({ ...current, publishDate }))} required /></div><div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving || !form.title.trim() || !form.description.trim() || !form.publishDate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{saving ? 'Publishing…' : editing ? 'Save changes' : 'Publish notice'}</button></div></form></div></div>;
}
function ViewModal({ item, onClose, onEdit, onDelete }: { item: Notice; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start gap-4 bg-slate-950 p-6 text-white"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200"><Bell className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="text-xl font-bold">{item.title}</h2><p className="mt-1 text-xs text-slate-400">{dateLabel(item.event_date || item.created_at)}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button></div><div className="max-h-[55vh] overflow-y-auto p-6"><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.description || 'No message added.'}</p></div><div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Delete</button><button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Edit3 className="h-4 w-4" />Edit notice</button></div></div></div>;
}
function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number | string; tone: 'blue' | 'emerald' | 'violet' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', violet: 'bg-violet-50 text-violet-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-xl font-bold text-slate-950">{value}</p></div></div></div>;
}
function Empty({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) {
  return <div className="px-6 py-16 text-center"><Bell className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-4 font-bold text-slate-900">{filtered ? 'No matching notices' : 'No notices published yet'}</h2><p className="mt-1 text-sm text-slate-500">{filtered ? 'Try a different search.' : 'Publish your first school announcement.'}</p>{!filtered && <button type="button" onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Create notice</button>}</div>;
}
function Field({ label, value, onChange, type = 'text', placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>;
}
function PageSkeleton() {
  return <div className="min-h-screen bg-white dark:bg-slate-950"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-3.5 pb-28 pt-7 sm:px-6 lg:pt-24"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 rounded-xl bg-blue-50 dark:bg-slate-900" /><div className="mt-2 h-8 border-b border-slate-200 dark:border-slate-700" /><div className="mt-3 grid grid-cols-4 gap-1.5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div><div className="mt-4 grid grid-cols-2 gap-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div></div></main></div></div>;
}
