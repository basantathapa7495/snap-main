'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Bell, CalendarDays, Check, Edit3, Eye, FileText,
  Loader2, Plus, RefreshCw, Search, Send, Trash2, X,
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

export default function CommunicationPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
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

        const { data, error: noticesError } = await supabase
          .from('news_events')
          .select('id, title, description, event_date, is_event, created_at')
          .eq('school_id', profile.school_id)
          .eq('is_event', false)
          .order('event_date', { ascending: false });
        if (noticesError) throw noticesError;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setNotices((data || []) as Notice[]);
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
    setEditing(null);
    setForm({ title: '', description: '', publishDate: todayNepal() });
    setError(''); setNotice(''); setFormOpen(true);
  }
  function openEdit(item: Notice) {
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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">School notice board</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Communication</h1>
                <p className="mt-2 text-sm text-slate-500">Publish and manage announcements for your school community.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh
                </button>
                <button type="button" onClick={openCreate} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4" />Create notice
                </button>
              </div>
            </header>

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
          </div>
        </main>
      </div>

      {formOpen && <NoticeModal editing={Boolean(editing)} form={form} setForm={setForm} saving={saving} onClose={() => setFormOpen(false)} onSubmit={saveNotice} />}
      {selected && <ViewModal item={selected} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} onDelete={() => deleteNotice(selected)} />}
    </div>
  );
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
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-24 rounded-2xl bg-white" />)}</div><div className="mt-6 h-96 rounded-2xl bg-white" /></div></main></div></div>;
}
