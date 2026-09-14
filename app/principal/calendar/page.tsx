'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight,
  Clock, Edit3, Loader2, Plus, RefreshCw, Search, Trash2, X,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type SchoolEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  is_event: boolean | null;
};
type EventForm = { title: string; description: string; date: string; time: string };

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nepalToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function displayDate(value: string | null) {
  if (!value) return 'Date not set';
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
function displayTime(value: string | null) {
  if (!value) return 'All day';
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours)) return value;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

export default function CalendarPage() {
  const today = nepalToday();
  const initial = new Date(`${today}T12:00:00Z`);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(initial);
  const [selected, setSelected] = useState<SchoolEvent | null>(null);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<EventForm>({ title: '', description: '', date: today, time: '' });
  const [search, setSearch] = useState('');
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

        const { data, error: eventsError } = await supabase.from('news_events')
          .select('id, title, description, event_date, event_time, is_event')
          .eq('school_id', profile.school_id)
          .eq('is_event', true)
          .order('event_date')
          .order('event_time');
        if (eventsError) throw eventsError;
        if (!cancelled) {
          setSchoolId(profile.school_id);
          setEvents((data || []) as SchoolEvent[]);
        }
      } catch (loadError) {
        console.error('Calendar load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Calendar events could not be loaded.');
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  const calendarDays = useMemo(() => {
    const cells: Array<{ day: number | null; date: string | null; events: SchoolEvent[] }> = [];
    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (let index = 0; index < firstDay; index += 1) cells.push({ day: null, date: null, events: [] });
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = dateKey(year, month, day);
      cells.push({ day, date, events: events.filter((event) => event.event_date === date) });
    }
    while (cells.length % 7) cells.push({ day: null, date: null, events: [] });
    return cells;
  }, [events, month, year]);

  const upcoming = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events
      .filter((event) => Boolean(event.event_date) && event.event_date! >= today)
      .filter((event) => !query || event.title.toLowerCase().includes(query) || (event.description || '').toLowerCase().includes(query))
      .slice(0, 8);
  }, [events, search, today]);

  function moveMonth(amount: number) {
    setCurrentDate(new Date(Date.UTC(year, month + amount, 1, 12)));
  }
  function goToday() {
    setCurrentDate(new Date(`${today}T12:00:00Z`));
  }
  function openCreate(date = today) {
    setEditing(null);
    setForm({ title: '', description: '', date, time: '' });
    setSelected(null); setError(''); setNotice(''); setFormOpen(true);
  }
  function openEdit(item: SchoolEvent) {
    setEditing(item);
    setForm({ title: item.title, description: item.description || '', date: item.event_date || today, time: item.event_time?.slice(0, 5) || '' });
    setSelected(null); setError(''); setNotice(''); setFormOpen(true);
  }

  async function saveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !form.title.trim() || !form.date) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = {
        school_id: schoolId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.date,
        event_time: form.time || null,
        is_event: true,
      };
      const result = editing
        ? await supabase.from('news_events')
            .update({ title: payload.title, description: payload.description, event_date: payload.event_date, event_time: payload.event_time })
            .eq('id', editing.id).eq('school_id', schoolId).eq('is_event', true)
        : await supabase.from('news_events').insert(payload);
      if (result.error) throw result.error;
      setFormOpen(false);
      setNotice(editing ? 'Event updated successfully.' : 'Event added to the school calendar.');
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Event could not be saved.');
    } finally { setSaving(false); }
  }

  async function deleteEvent(item: SchoolEvent) {
    if (!schoolId || !window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setError(''); setNotice('');
    const { error: deleteError } = await supabase.from('news_events')
      .delete().eq('id', item.id).eq('school_id', schoolId).eq('is_event', true);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEvents((current) => current.filter((event) => event.id !== item.id));
    setSelected(null);
    setNotice('Event deleted.');
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-950">Please sign in</h1><p className="mt-2 text-sm text-slate-500">Sign in as principal to manage the school calendar.</p><Link href="/auth/login?role=principal" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Go to login</Link></div></main>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-sm font-semibold text-blue-600">School schedule</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Calendar</h1><p className="mt-2 text-sm text-slate-500">Plan meetings, holidays and important school dates.</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button><button type="button" onClick={() => openCreate()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Create event</button></div>
            </header>

            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}</div>}

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.45fr)]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <h2 className="text-lg font-bold text-slate-950">{monthNames[month]} {year}</h2>
                  <div className="flex items-center gap-1"><button type="button" onClick={goToday} className="mr-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Today</button><button type="button" onClick={() => moveMonth(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => moveMonth(1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button></div>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">{weekdays.map((day) => <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">{day}</div>)}</div>
                <div className="grid grid-cols-7 gap-px bg-slate-200">
                  {calendarDays.map((cell, index) => <div key={`${cell.date || 'empty'}-${index}`} className={`min-h-20 bg-white p-1.5 sm:min-h-28 sm:p-2 ${!cell.day ? 'bg-slate-50' : 'hover:bg-blue-50/30'}`}>
                    {cell.day && <><button type="button" onClick={() => openCreate(cell.date!)} className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${cell.date === today ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-100'}`} title="Add event">{cell.day}</button><div className="mt-1 space-y-1">{cell.events.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="block w-full truncate rounded-md bg-blue-50 px-1.5 py-1 text-left text-[9px] font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100 sm:text-[10px]" title={item.title}>{item.event_time ? `${item.event_time.slice(0, 5)} ` : ''}{item.title}</button>)}{cell.events.length > 3 && <p className="px-1 text-[9px] text-slate-400">+{cell.events.length - 3} more</p>}</div></>}
                  </div>)}
                </div>
              </section>

              <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5"><h2 className="flex items-center gap-2 font-bold text-slate-950"><Clock className="h-4 w-4 text-blue-600" />Upcoming agenda</h2><label className="relative mt-3 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label></div>
                <div className="divide-y divide-slate-100">{upcoming.length ? upcoming.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex w-full gap-3 p-4 text-left hover:bg-slate-50"><span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700"><span className="text-[9px] font-bold uppercase">{item.event_date ? monthNames[Number(item.event_date.slice(5, 7)) - 1].slice(0, 3) : '—'}</span><span className="text-base font-bold leading-none">{item.event_date?.slice(8, 10) || '—'}</span></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span><span className="mt-1 block text-xs text-slate-500">{displayTime(item.event_time)}</span></span></button>) : <p className="px-5 py-12 text-center text-sm text-slate-500">No upcoming events found.</p>}</div>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {formOpen && <EventModal editing={Boolean(editing)} form={form} setForm={setForm} saving={saving} onSubmit={saveEvent} onClose={() => setFormOpen(false)} />}
      {selected && <DetailModal event={selected} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} onDelete={() => deleteEvent(selected)} />}
    </div>
  );
}

function EventModal({ editing, form, setForm, saving, onSubmit, onClose }: { editing: boolean; form: EventForm; setForm: React.Dispatch<React.SetStateAction<EventForm>>; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-bold text-slate-950">{editing ? 'Edit event' : 'Create event'}</h2><p className="mt-1 text-sm text-slate-500">Add an important date to the school calendar.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></div><form onSubmit={onSubmit}><div className="space-y-4 p-6"><Field label="Event title" value={form.title} onChange={(title) => setForm((current) => ({ ...current, title }))} placeholder="For example: Parent-teacher meeting" required /><div className="grid gap-4 sm:grid-cols-2"><Field label="Date" type="date" value={form.date} onChange={(date) => setForm((current) => ({ ...current, date }))} required /><Field label="Time" type="time" value={form.time} onChange={(time) => setForm((current) => ({ ...current, time }))} /></div><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span><textarea rows={4} maxLength={3000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional event details..." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label></div><div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving || !form.title.trim() || !form.date} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : editing ? 'Save changes' : 'Create event'}</button></div></form></div></div>;
}
function DetailModal({ event, onClose, onEdit, onDelete }: { event: SchoolEvent; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(click) => { if (click.target === click.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start gap-4 bg-slate-950 p-6 text-white"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200"><CalendarIcon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="text-xl font-bold">{event.title}</h2><p className="mt-1 text-sm text-slate-300">{displayDate(event.event_date)} · {displayTime(event.event_time)}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button></div><div className="p-6"><p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{event.description || 'No additional details were added.'}</p></div><div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Delete</button><button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Edit3 className="h-4 w-4" />Edit event</button></div></div></div>;
}
function Field({ label, value, onChange, type = 'text', placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>;
}
function PageSkeleton() {
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_.45fr]"><div className="h-[620px] rounded-2xl bg-white" /><div className="h-[500px] rounded-2xl bg-white" /></div></div></main></div></div>;
}
