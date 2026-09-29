"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Edit3, MoreVertical, Plus, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type SchoolNotice = {
  id: string; school_id: string; title: string; content: string; target_audience: string | null;
  target_class: string | null; target_section: string | null; status: "published" | "scheduled" | "draft";
  scheduled_at: string | null; published_at: string | null; created_at: string | null;
  updated_at: string | null; created_by: string | null;
};
type ClassRow = { class_name: string | null; class: string | null; name: string | null; class_number: string | null; section: string | null; section_name: string | null; academic_year: number | null };
type Audience = "all" | "teachers" | "students" | "class" | "section";
type Form = { title: string; content: string; audience: Audience; className: string; section: string; mode: "published" | "scheduled" | "draft"; scheduledAt: string };
const empty = (audience: Audience = "all"): Form => ({ title: "", content: "", audience, className: "", section: "", mode: "published", scheduledAt: "" });
const nameOf = (row: ClassRow) => row.class_name || row.class || row.name || row.class_number || "";
const key = (value: string) => value.trim().toLowerCase().replace(/^(class|grade)\s+/, "");
const shortDate = (value: string | null) => value ? new Date(value).toLocaleString("en-NP", { dateStyle: "medium", timeStyle: "short" }) : "Not scheduled";
const localInputDate = (value: string) => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const nepalDate = (value: Date) => value.toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" });
const audienceLabel = (item: SchoolNotice) => item.target_audience === "class" ? `Class ${item.target_class}` : item.target_audience === "section" ? `Class ${item.target_class} · Section ${item.target_section}` : item.target_audience === "teachers" ? "Teachers" : item.target_audience === "students" ? "Students" : "Everyone";

export default function PrincipalNoticesPanel({ schoolId, notices, onChanged, initialNoticeId, composerAudience, composerKey, initialFilter }: {
  schoolId: string; notices: SchoolNotice[]; onChanged: () => void; initialNoticeId: string | null; composerAudience: Audience | null; composerKey: number; initialFilter: string;
}) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classesError, setClassesError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [menu, setMenu] = useState<string | null>(null);
  const [view, setView] = useState<SchoolNotice | null>(() => notices.find((row) => row.id === initialNoticeId) || null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(() => empty(composerAudience || "all"));
  const [composerOpen, setComposerOpen] = useState(Boolean(composerKey && composerAudience));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadClasses() {
      const result = await supabase.from("classes").select("class_name,class,name,class_number,section,section_name,academic_year").eq("school_id", schoolId).is("archived_at", null).limit(1000);
      if (!cancelled) { setClasses((result.data || []) as ClassRow[]); setClassesError(Boolean(result.error)); }
    }
    void loadClasses();
    return () => { cancelled = true; };
  }, [schoolId]);

  const classNames = useMemo(() => {
    const year = Math.max(0, ...classes.map((row) => row.academic_year || 0));
    return [...new Map<string, string>(classes.filter((row) => (row.academic_year || 0) === year).map((row): [string, string] => [key(nameOf(row)), nameOf(row)]).filter(([id]) => Boolean(id))).values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classes]);
  const sections = useMemo(() => { const year = Math.max(0, ...classes.map((row) => row.academic_year || 0)); return [...new Set(classes.filter((row) => (row.academic_year || 0) === year && key(nameOf(row)) === key(form.className)).map((row) => row.section_name || row.section).filter((value): value is string => Boolean(value?.trim())))].sort(); }, [classes, form.className]);
  const filtered = notices.filter((item) => {
    const text = search.trim().toLowerCase();
    const match = !text || [item.title, item.content, audienceLabel(item)].some((value) => value.toLowerCase().includes(text));
    const category = filter === "All" || (filter === "Teachers" ? item.target_audience === "teachers" : filter === "Students" ? ["students", "class", "section"].includes(item.target_audience || "") : item.status === (filter === "Drafts" ? "draft" : filter.toLowerCase()));
    return match && category;
  });
  const counts = { Total: notices.length, Published: notices.filter((item) => item.status === "published").length, Scheduled: notices.filter((item) => item.status === "scheduled").length, Drafts: notices.filter((item) => item.status === "draft").length };

  function compose(item?: SchoolNotice, mode?: Form["mode"]) {
    setEditing(item?.id || null);
    setForm(item ? { title: item.title, content: item.content, audience: (item.target_audience || "all") as Audience, className: item.target_class || "", section: item.target_section || "", mode: mode || item.status, scheduledAt: item.scheduled_at ? localInputDate(item.scheduled_at) : "" } : empty());
    setMenu(null); setView(null); setError(""); setComposerOpen(true);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setError("Enter a title and message."); return; }
    if ((form.audience === "class" || form.audience === "section") && !form.className) { setError("Choose a class."); return; }
    if (form.audience === "section" && !form.section) { setError("Choose a section."); return; }
    const scheduledAt = form.mode === "scheduled" ? new Date(form.scheduledAt) : null;
    if (form.mode === "scheduled" && (!form.scheduledAt || !scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date())) { setError("Choose a future date and time."); return; }
    setSaving(true); setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please sign in again.");
      const payload = {
        title: form.title.trim(), content: form.content.trim(), target_audience: form.audience,
        target_class: ["class", "section"].includes(form.audience) ? form.className : null,
        target_section: form.audience === "section" ? form.section : null,
        status: form.mode, scheduled_at: scheduledAt?.toISOString() || null,
        published_at: form.mode === "published" ? (editing && notices.find((item) => item.id === editing)?.status === "published" ? notices.find((item) => item.id === editing)?.published_at || new Date().toISOString() : new Date().toISOString()) : null,
        publish_date: form.mode === "published" ? nepalDate(new Date()) : null,
        updated_at: new Date().toISOString(),
      };
      const result = editing
        ? await supabase.from("notices").update(payload).eq("id", editing).eq("school_id", schoolId).select("id").single()
        : await supabase.from("notices").insert({ ...payload, school_id: schoolId, created_by: user.id }).select("id").single();
      if (result.error) throw result.error;
      setComposerOpen(false); setNotice(form.mode === "draft" ? "Draft saved." : form.mode === "scheduled" ? "Notice scheduled." : "Notice published."); onChanged();
    } catch (cause) { console.error("Notice save failed", cause); setError("Notice could not be saved. Check your school access and try again."); }
    finally { setSaving(false); }
  }
  async function changeStatus(item: SchoolNotice, status: "published" | "draft") {
    if (status === "published" && !window.confirm(`Publish “${item.title}” now?`)) return;
    if (item.status === "published" && status === "draft" && !window.confirm(`Unpublish “${item.title}”? It will no longer be visible to recipients.`)) return;
    setMenu(null); setError("");
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from("notices").update({ status, scheduled_at: null, published_at: status === "published" ? now : null, publish_date: status === "published" ? nepalDate(new Date()) : null, updated_at: now }).eq("id", item.id).eq("school_id", schoolId).select("id").single();
    if (updateError) { setError("Notice could not be updated. Please try again."); return; }
    setView(null); onChanged();
  }
  async function duplicate(item: SchoolNotice) {
    setMenu(null); setError("");
    const { data, error: insertError } = await supabase.from("notices").insert({ school_id: schoolId, title: item.title, content: item.content, target_audience: item.target_audience || "all", target_class: item.target_class, target_section: item.target_section, status: "draft", publish_date: null }).select("id").single();
    if (insertError || !data) { setError("Notice could not be duplicated."); return; }
    onChanged(); setEditing(data.id); setForm({ title: item.title, content: item.content, audience: (item.target_audience || "all") as Audience, className: item.target_class || "", section: item.target_section || "", mode: "draft", scheduledAt: "" }); setComposerOpen(true);
  }
  async function remove(item: SchoolNotice) {
    if (!window.confirm(`Delete “${item.title}”? This notice will be permanently removed.`)) return;
    setMenu(null); setError("");
    const { error: deleteError } = await supabase.from("notices").delete().eq("id", item.id).eq("school_id", schoolId);
    if (deleteError) { setError("Notice could not be deleted."); return; }
    setView(null); onChanged();
  }

  return <div className="space-y-3 pb-6 text-slate-950 dark:text-white">
    <div className="flex items-center justify-between gap-2"><div><h2 className="text-base font-bold">Notices</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Create and manage school announcements.</p></div><button type="button" onClick={() => compose()} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="mr-1 inline h-3.5 w-3.5" />New notice</button></div>
    {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded-lg p-2 text-xs ${error ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>{error || notice}</p>}
    <section aria-label="Notice summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">{Object.entries(counts).map(([title, count]) => <div key={title} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{title}</span><strong className="mt-0.5 block text-base leading-none sm:text-xl">{count}</strong></div>)}</section>
    <label className="relative block"><span className="sr-only">Search notices</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notices..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs text-slate-950 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"><X className="h-4 w-4" /></button>}</label>
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">{["All","Published","Scheduled","Drafts","Teachers","Students"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${filter === item ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200" : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>{item}</button>)}</div>
    <section><div className="mb-2 flex items-end justify-between gap-2"><div><h3 className="text-sm font-bold">All notices</h3><p className="text-[10px] text-slate-500 dark:text-slate-400">School announcements and updates.</p></div><span className="text-[10px] text-slate-500 dark:text-slate-400">{filtered.length} notices</span></div><div className="space-y-1.5">{filtered.map((item) => <div key={item.id} className="relative rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start gap-2"><button type="button" onClick={() => setView(item)} className="flex min-w-0 flex-1 items-start gap-2 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.title}</strong><span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.content}</span><span className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400"><span>{audienceLabel(item)}</span><span className={`rounded-full px-1.5 py-0.5 font-semibold ${item.status === "published" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : item.status === "scheduled" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{item.status === "draft" ? "Draft" : item.status === "scheduled" ? "Scheduled" : "Published"}</span><span>{shortDate(item.status === "published" ? item.published_at || item.created_at : item.status === "scheduled" ? item.scheduled_at : item.created_at)}</span></span></span></button><button type="button" aria-label={`Actions for ${item.title}`} aria-expanded={menu === item.id} onClick={() => setMenu(menu === item.id ? null : item.id)} className="rounded p-1 text-slate-500 dark:text-slate-400"><MoreVertical className="h-4 w-4" /></button></div>{menu === item.id && <div className="absolute right-2 top-8 z-20 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">{[["View", () => { setView(item); setMenu(null); }], ["Edit", () => compose(item)], ["Duplicate", () => duplicate(item)], ...(item.status === "scheduled" ? [["Reschedule", () => compose(item, "scheduled")], ["Publish now", () => changeStatus(item, "published")], ["Move to draft", () => changeStatus(item, "draft")]] as const : item.status === "draft" ? [["Schedule", () => compose(item, "scheduled")], ["Publish now", () => changeStatus(item, "published")]] as const : [["Unpublish", () => changeStatus(item, "draft")]] as const), ["Delete", () => remove(item)]].map(([title, action]) => <button key={title as string} type="button" onClick={() => void (action as () => void)()} className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 ${title === "Delete" ? "text-rose-600" : "text-slate-700 dark:text-slate-200"}`}>{title as string}</button>)}</div>}</div>)}{!filtered.length && <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-semibold">{search ? "No notices found." : filter === "Drafts" ? "No drafts yet." : filter === "Scheduled" ? "No scheduled notices." : filter === "Published" ? "No published notices." : notices.length ? "No notices match this filter." : "No notices yet."}</p><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{search ? "Try another search or clear your filters." : "Your school notices will appear here."}</p></div>}</div></section>

    {composerOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setComposerOpen(false); }}><div role="dialog" aria-modal="true" aria-label={editing ? "Edit notice" : "New notice"} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 sm:rounded-2xl"><div className="flex items-center justify-between"><h3 className="text-base font-bold">{editing ? "Edit notice" : "New notice"}</h3><button type="button" onClick={() => setComposerOpen(false)} aria-label="Close" className="rounded p-1"><X className="h-5 w-5" /></button></div><form onSubmit={save} className="mt-3 space-y-3 text-xs"><label className="block font-semibold">Notice title<input required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label><label className="block font-semibold">Message<textarea required rows={4} maxLength={5000} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label><label className="block font-semibold">Send to<select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value as Audience, className: "", section: "" })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="all">Everyone</option><option value="teachers">Teachers</option><option value="students">Students</option><option value="class">Specific Class</option><option value="section">Specific Section</option></select></label>{classesError && ["class", "section"].includes(form.audience) && <p role="alert" className="text-rose-600">Classes could not be loaded. Try again later.</p>}{["class", "section"].includes(form.audience) && <label className="block font-semibold">Class<select required value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value, section: "" })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">Select class</option>{classNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}{form.audience === "section" && <label className="block font-semibold">Section<select required value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">{sections.length ? "Select section" : "No sections in this class"}</option>{sections.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}<fieldset><legend className="font-semibold">Publishing option</legend><div className="mt-1 flex gap-2">{[["published", "Publish now"], ["scheduled", "Schedule later"], ["draft", "Save draft"]].map(([value, title]) => <label key={value} className="flex items-center gap-1 text-[11px]"><input type="radio" name="publish-mode" checked={form.mode === value} onChange={() => setForm({ ...form, mode: value as Form["mode"] })} />{title}</label>)}</div></fieldset>{form.mode === "scheduled" && <label className="block font-semibold">Date and time<input type="datetime-local" required value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>}{error && <p role="alert" className="text-rose-600">{error}</p>}<div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700"><button type="button" onClick={() => setComposerOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : form.mode === "draft" ? "Save draft" : form.mode === "scheduled" ? "Schedule notice" : editing && notices.find((item) => item.id === editing)?.status === "published" ? "Save changes" : "Publish now"}</button></div></form></div></div>}
    {view && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setView(null); }}><div role="dialog" aria-modal="true" aria-label="Notice details" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 sm:rounded-2xl"><div className="flex items-start justify-between gap-2"><div><h3 className="text-base font-bold">{view.title}</h3><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{audienceLabel(view)} · {view.status === "draft" ? "Draft" : view.status === "scheduled" ? "Scheduled" : "Published"}</p></div><button type="button" onClick={() => setView(null)} aria-label="Close" className="rounded p-1"><X className="h-5 w-5" /></button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6">{view.content}</p><div className="mt-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400"><p>{view.status === "scheduled" ? "Scheduled: " : view.status === "published" ? "Published: " : "Created: "}{shortDate(view.status === "scheduled" ? view.scheduled_at : view.status === "published" ? view.published_at : view.created_at)}</p>{view.updated_at && <p>Updated: {shortDate(view.updated_at)}</p>}</div><button type="button" onClick={() => compose(view)} className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"><Edit3 className="mr-1 inline h-3.5 w-3.5" />Edit</button></div></div>}
  </div>;
}
