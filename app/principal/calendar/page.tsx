"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, RefreshCw, X } from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import { UpcomingRow } from "@/components/UpcomingPanel";
import { supabase } from "@/lib/supabase";
import { formatEventTime, mergeUpcoming, nepalDay, type SchoolEvent, type UpcomingExam, type UpcomingItem } from "@/lib/upcoming";

type EventForm = { title: string; date: string; time: string; location: string; content: string; category: string };
const blankForm: EventForm = { title: "", date: "", time: "", location: "", content: "", category: "event" };
const inputStyle = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function monthOffset(key: string, offset: number) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}

export default function CalendarPage() {
  const today = nepalDay();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [exams, setExams] = useState<UpcomingExam[]>([]);
  const [selected, setSelected] = useState<SchoolEvent | null>(null);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [form, setForm] = useState<EventForm>(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("Sign in to view your school calendar.");
        const { data: profile, error: profileError } = await supabase.from("profiles").select("school_id, role").eq("user_id", user.id).single();
        if (profileError || !profile?.school_id) throw new Error("Your school profile could not be loaded.");
        if (!["principal", "admin", "school_admin"].includes(profile.role)) throw new Error("Only school principals can manage this calendar.");
        const [eventResult, examResult] = await Promise.all([
          supabase.from("news_events").select("id, title, event_date, event_time, location, content, category").eq("school_id", profile.school_id).eq("is_event", true).order("event_date", { ascending: true }).limit(1000),
          supabase.from("exams").select("id, name, start_date, exam_type").eq("school_id", profile.school_id).order("start_date", { ascending: true }).limit(1000),
        ]);
        if (eventResult.error) throw eventResult.error;
        if (examResult.error) throw examResult.error;
        if (cancelled) return;
        const schoolEvents = (eventResult.data || []) as SchoolEvent[];
        setSchoolId(profile.school_id);
        setEvents(schoolEvents);
        setExams((examResult.data || []) as UpcomingExam[]);
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("event");
        const match = schoolEvents.find((event) => event.id === eventId);
        if (match) {
          setSelected(match);
          if (match.event_date) setMonth(match.event_date.slice(0, 7));
        } else if (params.get("action") === "create") {
          setEditing(null);
          setForm({ ...blankForm, date: nepalDay() });
          setFormOpen(true);
          window.history.replaceState(window.history.state, "", window.location.pathname);
        }
        setError("");
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Calendar could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const allItems = useMemo(() => mergeUpcoming(events, exams, "0000-01-01"), [events, exams]);
  const upcoming = useMemo(() => mergeUpcoming(events, exams, today), [events, exams, today]);
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells = [...Array.from({ length: firstWeekday }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const byDate = new Map<string, UpcomingItem[]>();
  allItems.forEach((item) => byDate.set(item.date, [...(byDate.get(item.date) || []), item]));

  function openItem(item: UpcomingItem) {
    if (item.source === "exam") { window.location.assign(item.href); return; }
    setSelected(events.find((event) => event.id === item.sourceId) || null);
  }

  function openForm(event?: SchoolEvent) {
    setSelected(null);
    setEditing(event || null);
    setForm(event ? { title: event.title, date: event.event_date || today, time: event.event_time || "", location: event.location || "", content: event.content || "", category: event.category || "event" } : { ...blankForm, date: today });
    setFormOpen(true);
    setError("");
  }

  async function saveEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!schoolId || !form.title.trim() || !form.date) return;
    setSaving(true);
    const payload = { school_id: schoolId, title: form.title.trim(), event_date: form.date, event_time: form.time || null, location: form.location.trim() || null, content: form.content.trim() || null, category: form.category, is_event: true };
    const result = editing
      ? await supabase.from("news_events").update(payload).eq("id", editing.id).eq("school_id", schoolId)
      : await supabase.from("news_events").insert(payload);
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setFormOpen(false);
    setMonth(form.date.slice(0, 7));
    setRefreshKey((value) => value + 1);
  }

  async function removeEvent(event: SchoolEvent) {
    if (!schoolId || !window.confirm(`Delete ${event.title}?`)) return;
    const { error: deleteError } = await supabase.from("news_events").delete().eq("id", event.id).eq("school_id", schoolId);
    if (deleteError) { setError(deleteError.message); return; }
    setSelected(null);
    setRefreshKey((value) => value + 1);
  }

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Sidebar /><div className="flex min-h-screen flex-col pt-14 lg:ml-64 lg:pt-0"><div className="hidden lg:block"><TopBar /></div><main className="flex-1 px-3.5 pb-24 pt-5 sm:px-6 lg:px-8 lg:pt-24"><div className="mx-auto max-w-[1500px]">
    <header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">School Calendar</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Events, meetings, holidays and exams from your school.</p></div><button type="button" onClick={() => openForm()} disabled={!schoolId} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:text-sm"><Plus className="h-4 w-4" />Add event</button></header>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
    {loading ? <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Loading calendar…</div> : <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-label="Monthly calendar"><div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-700 sm:p-4"><h2 className="text-base font-bold text-slate-950 dark:text-white">{new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</h2><div className="flex items-center gap-1"><button type="button" onClick={() => setMonth(today.slice(0, 7))} className="min-h-9 rounded-lg px-2 text-xs font-bold text-blue-700 dark:text-blue-300">Today</button><button type="button" onClick={() => setMonth(monthOffset(month, -1))} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setMonth(monthOffset(month, 1))} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button></div></div>
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-[10px] font-bold uppercase text-slate-500 dark:border-slate-700">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">{cells.map((day, index) => {
          const key = day ? `${month}-${String(day).padStart(2, "0")}` : null;
          const entries = key ? byDate.get(key) || [] : [];
          return <div key={index} className="min-h-14 min-w-0 bg-white p-1.5 dark:bg-slate-900 sm:min-h-24 sm:p-2"><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${key === today ? "bg-blue-600 text-white" : "text-slate-700 dark:text-slate-300"}`}>{day}</span>{entries.length > 0 && <div className="mt-1 space-y-1">{entries.slice(0, 2).map((item) => <button type="button" key={item.id} onClick={() => openItem(item)} title={item.title} className="block w-full truncate rounded bg-blue-50 px-1 py-1 text-left text-[10px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"><span className="sm:hidden">●</span><span className="hidden sm:inline">{item.title}</span></button>)}{entries.length > 2 && <span className="block text-[9px] text-slate-500">+{entries.length - 2} more</span>}</div>}</div>;
        })}</div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h2 className="text-base font-bold text-slate-950 dark:text-white">Upcoming</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">School events and exam start dates</p>{upcoming.length ? <div className="mt-4 grid gap-2.5">{upcoming.slice(0, 12).map((item) => <UpcomingRow key={item.id} item={item} today={today} onEventClick={openItem} />)}</div> : <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-sm font-bold text-slate-900 dark:text-white">No upcoming school events</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Nothing important is scheduled in the next 14 days.</p></div>}</section>
    </div>}
  </div></main></div>
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><div role="dialog" aria-modal="true" aria-labelledby="event-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-blue-600">{selected.category || "School event"}</p><h2 id="event-title" className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{selected.title}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close event" className="rounded-lg p-2"><X className="h-5 w-5" /></button></div><p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CalendarDays className="h-4 w-4" />{selected.event_date}</p>{selected.event_time && <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Clock3 className="h-4 w-4" />{formatEventTime(selected.event_time)}</p>}{selected.location && <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><MapPin className="h-4 w-4" />{selected.location}</p>}{selected.content && <p className="mt-4 whitespace-pre-wrap border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">{selected.content}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => removeEvent(selected)} className="min-h-10 rounded-lg px-3 text-xs font-bold text-rose-600">Delete</button><button type="button" onClick={() => openForm(selected)} className="min-h-10 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white">Edit event</button></div></div></div>}
    {formOpen && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setFormOpen(false); }}><div role="dialog" aria-modal="true" aria-labelledby="form-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700"><h2 id="form-title" className="text-lg font-bold text-slate-950 dark:text-white">{editing ? "Edit event" : "Add school event"}</h2><button type="button" onClick={() => setFormOpen(false)} aria-label="Close form" className="rounded-lg p-2"><X className="h-5 w-5" /></button></div><form onSubmit={saveEvent} className="grid gap-3 p-4">{error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}<label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Title<input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputStyle} mt-1`} /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${inputStyle} mt-1`} /></label><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Time (optional)<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={`${inputStyle} mt-1`} /></label></div><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputStyle} mt-1`}>{["event", "meeting", "holiday", "sports"].map((type) => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}</select></label><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location (optional)<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={`${inputStyle} mt-1`} /></label><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description (optional)<textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={`${inputStyle} mt-1 py-2`} /></label><button type="submit" disabled={saving || !schoolId} className="mt-2 min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : editing ? "Save changes" : "Add event"}</button></form></div></div>}
  </div>;
}
