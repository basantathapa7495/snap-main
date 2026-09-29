"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import NepaliDate from "nepali-date-converter";
import { AlertCircle, BookOpen, ChevronDown, Clock3, Plus, Search, Settings2, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Teacher = { id: string; name: string; subject: string | null; department?: string | null };
type ClassRow = { id: string; class_name: string | null; class: string | null; name: string | null; class_number: string | null; section_name: string | null; section: string | null; academic_year: number; archived_at: string | null };
type Period = { id: string; name: string; position: number; kind: "lesson" | "break"; start_time: string | null; end_time: string | null };
type Assignment = { id: string; teacher_id: string | null; class_id: string | null; class_name: string; subject: string; period_id: string | null; weekday: number | null; academic_year: string | null; periods_per_week: number; active: boolean };
type ClassGroup = { name: string; choices: { id: string; section: string | null }[] };
type AssignmentForm = { teacherId: string; className: string; classId: string; subject: string; periodId: string; weekday: string };
type PeriodForm = { name: string; position: string; kind: "lesson" | "break"; start: string; end: string };

const year = Number(new NepaliDate(new Date()).format("YYYY"));
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const secondary = "rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300";
const primary = "inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50 sm:px-4 sm:text-sm";
const normalize = (value: string | null | undefined) => (value || "").trim().toLowerCase();
const classNameOf = (row: ClassRow) => row.class_name || row.class || row.name || (row.class_number ? `Class ${row.class_number}` : "Unnamed class");
const displayClass = (value: string) => value.replace(/^Class\s+(\d+)$/i, "Grade $1");
const initials = (value: string) => value.split(/\s+/).slice(0, 2).map((word) => word[0] || "").join("").toUpperCase();
const timeLabel = (period: Period) => period.start_time && period.end_time ? `${period.start_time.slice(0, 5)}–${period.end_time.slice(0, 5)}` : "";

function groupClasses(rows: ClassRow[]): ClassGroup[] {
  const groups = new Map<string, { name: string; parent: ClassRow | null; sections: ClassRow[] }>();
  for (const row of rows) {
    const name = classNameOf(row);
    const key = normalize(name);
    const group = groups.get(key) || { name, parent: null, sections: [] };
    if (row.section_name || row.section) group.sections.push(row);
    else group.parent = row;
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    name: group.name,
    choices: group.sections.length
      ? group.sections.map((row) => ({ id: row.id, section: row.section_name || row.section }))
      : group.parent ? [{ id: group.parent.id, section: null }] : [],
  })).filter((group) => group.choices.length).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export default function TeacherAssignmentsPanel({ schoolId, teachers, onTeacherChanged }: { schoolId: string; teachers: Teacher[]; onTeacherChanged: () => void }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [otherSubjects, setOtherSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "teacher" | "unassigned">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requireTeacher, setRequireTeacher] = useState(false);
  const [periodForm, setPeriodForm] = useState<PeriodForm | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [periodManagerOpen, setPeriodManagerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [assignmentResult, classResult, periodResult, timetableResult] = await Promise.all([
        supabase.from("teacher_assignments").select("id, teacher_id, class_id, class_name, subject, period_id, weekday, academic_year, periods_per_week, active").eq("school_id", schoolId).eq("active", true).order("created_at", { ascending: false }).limit(1000),
        supabase.from("classes").select("id, class_name, class, name, class_number, section_name, section, academic_year, archived_at").eq("school_id", schoolId).eq("academic_year", year).is("archived_at", null).order("created_at", { ascending: true }).limit(500),
        supabase.from("school_periods").select("id, name, position, kind, start_time, end_time").eq("school_id", schoolId).eq("academic_year", year).order("position", { ascending: true }),
        supabase.from("teacher_timetable_entries").select("subject").eq("school_id", schoolId).limit(500),
      ]);
      if (cancelled) return;
      const failure = assignmentResult.error || classResult.error || periodResult.error;
      setError(failure?.message || "");
      setAssignments(((assignmentResult.data || []) as Assignment[]).filter((item) => !item.academic_year || item.academic_year === String(year)));
      setClasses((classResult.data || []) as ClassRow[]);
      setPeriods((periodResult.data || []) as Period[]);
      setOtherSubjects((timetableResult.data || []).map((row) => row.subject).filter(Boolean));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [schoolId, refresh]);

  const groups = useMemo(() => groupClasses(classes), [classes]);
  const classById = useMemo(() => new Map(classes.map((row) => [row.id, row])), [classes]);
  const periodById = useMemo(() => new Map(periods.map((period) => [period.id, period])), [periods]);
  const subjects = useMemo(() => [...new Set([...teachers.map((teacher) => teacher.subject || ""), ...assignments.map((item) => item.subject), ...otherSubjects].map((item) => item.trim()).filter(Boolean))].sort(), [teachers, assignments, otherSubjects]);
  const lessons = periods.filter((period) => period.kind === "lesson");
  const assigned = assignments.filter((item) => item.teacher_id);
  const unassigned = assignments.filter((item) => !item.teacher_id);
  const query = normalize(search);

  function details(item: Assignment) {
    const row = item.class_id ? classById.get(item.class_id) : null;
    const group = row ? classNameOf(row) : item.class_name;
    const section = row?.section_name || row?.section || null;
    const period = item.period_id ? periodById.get(item.period_id) : null;
    return { className: displayClass(group), section, period };
  }

  function matches(item: Assignment) {
    const { className, section, period } = details(item);
    return [className, section, section && `Section ${section}`, item.subject, period?.name, period && timeLabel(period), item.weekday === null ? "Every school day" : weekdays[item.weekday], teachers.find((teacher) => teacher.id === item.teacher_id)?.name].some((value) => normalize(value).includes(query));
  }

  const shownTeachers = teachers.filter((teacher) => !query || normalize(teacher.name).includes(query) || normalize(teacher.department || teacher.subject).includes(query) || assigned.some((item) => item.teacher_id === teacher.id && matches(item)));
  const shownUnassigned = unassigned.filter((item) => !query || matches(item));

  function startAssignment(item?: Assignment, teacherId = "", mustAssign = false) {
    const row = item?.class_id ? classById.get(item.class_id) : null;
    const group = row ? groups.find((entry) => normalize(entry.name) === normalize(classNameOf(row))) : groups.find((entry) => normalize(entry.name) === normalize(item?.class_name));
    const selectedGroup = group || groups[0];
    setForm({ teacherId: item?.teacher_id || teacherId, className: selectedGroup?.name || "", classId: row?.id || selectedGroup?.choices[0]?.id || "", subject: item?.subject || "", periodId: item?.period_id || lessons[0]?.id || "", weekday: item?.weekday === null || item?.weekday === undefined ? "" : String(item.weekday) });
    setEditingId(item?.id || null);
    setRequireTeacher(mustAssign);
    setError("");
  }

  async function saveAssignment(event: React.FormEvent) {
    event.preventDefault();
    if (!form || working) return;
    const teacher = teachers.find((item) => item.id === form.teacherId);
    const selected = classes.find((item) => item.id === form.classId);
    const period = periodById.get(form.periodId);
    if (!selected || !period || period.kind !== "lesson" || !form.subject.trim() || (form.teacherId && !teacher) || (requireTeacher && !teacher)) {
      setError("Choose a valid teacher, class, subject and lesson period."); return;
    }
    const weekday = form.weekday === "" ? null : Number(form.weekday);
    const overlap = assignments.find((item) => item.id !== editingId && item.period_id === form.periodId && (item.weekday === null || weekday === null || item.weekday === weekday) && (item.class_id === form.classId || (form.teacherId && item.teacher_id === form.teacherId)));
    if (overlap) {
      setError(overlap.class_id === form.classId ? "This class or section already has a teaching slot in that period." : "This teacher is already assigned to another class in that period."); return;
    }
    setWorking(true); setError("");
    const payload = { school_id: schoolId, teacher_id: form.teacherId || null, class_id: form.classId, class_name: classNameOf(selected), subject: form.subject.trim(), period_id: form.periodId, weekday, academic_year: String(year), periods_per_week: 1, active: true };
    const result = editingId
      ? await supabase.from("teacher_assignments").update(payload).eq("id", editingId).eq("school_id", schoolId)
      : await supabase.from("teacher_assignments").insert(payload);
    setWorking(false);
    if (result.error) { setError(result.error.message); return; }
    setForm(null); setNotice(editingId ? "Teaching slot updated." : form.teacherId ? "Teacher assigned." : "Unassigned slot saved.");
    setRefresh((value) => value + 1); onTeacherChanged();
  }

  async function removeAssignment(item: Assignment) {
    if (!window.confirm("Remove this teaching slot?")) return;
    setWorking(true); setError("");
    const result = await supabase.from("teacher_assignments").update({ active: false }).eq("id", item.id).eq("school_id", schoolId);
    setWorking(false);
    if (result.error) { setError(result.error.message); return; }
    setNotice("Teaching slot removed."); setRefresh((value) => value + 1); onTeacherChanged();
  }

  function startPeriod(period?: Period) {
    setEditingPeriodId(period?.id || null);
    setPeriodForm({ name: period?.name || `Period ${periods.length + 1}`, position: String(period?.position || Math.min(50, (periods.at(-1)?.position || 0) + 1)), kind: period?.kind || "lesson", start: period?.start_time?.slice(0, 5) || "", end: period?.end_time?.slice(0, 5) || "" });
    setError("");
  }

  async function savePeriod(event: React.FormEvent) {
    event.preventDefault();
    if (!periodForm || working) return;
    if (Boolean(periodForm.start) !== Boolean(periodForm.end) || (periodForm.start && periodForm.end && periodForm.end <= periodForm.start)) {
      setError("Enter both times, with the end after the start, or leave both blank."); return;
    }
    if (periodForm.kind === "break" && editingPeriodId && assignments.some((item) => item.period_id === editingPeriodId)) {
      setError("Move teaching slots out of this period before changing it to a break."); return;
    }
    setWorking(true); setError("");
    const payload = { school_id: schoolId, academic_year: year, name: periodForm.name.trim(), position: Number(periodForm.position), kind: periodForm.kind, start_time: periodForm.start || null, end_time: periodForm.end || null };
    const result = editingPeriodId
      ? await supabase.from("school_periods").update(payload).eq("id", editingPeriodId).eq("school_id", schoolId)
      : await supabase.from("school_periods").insert(payload);
    setWorking(false);
    if (result.error) { setError(result.error.message); return; }
    setPeriodForm(null); setNotice("School period saved."); setRefresh((value) => value + 1);
  }

  async function removePeriod(period: Period) {
    if (!window.confirm(`Remove ${period.name}? Periods used by teaching slots cannot be removed.`)) return;
    setWorking(true); setError("");
    const result = await supabase.from("school_periods").delete().eq("id", period.id).eq("school_id", schoolId);
    setWorking(false);
    if (result.error) { setError(result.error.message); return; }
    setNotice("Period removed."); setRefresh((value) => value + 1);
  }

  function renderAssignmentCard(item: Assignment) {
    const { className, section, period } = details(item);
    return <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-bold text-slate-950 dark:text-white">{className}{section ? ` · Section ${section}` : " · No section"}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">{item.subject}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-200">Subject teacher</span></div>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><span className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{period?.name || "Period not set"}</span>{period && timeLabel(period)}{item.weekday !== null && <span>· {weekdays[item.weekday]}</span>}{!period && <span>· {item.periods_per_week} periods/week</span>}</p>
      <div className="mt-2 flex gap-2"><button type="button" disabled={working} onClick={() => startAssignment(item)} className={secondary}>Edit</button><button type="button" disabled={working} onClick={() => removeAssignment(item)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:border-slate-700 dark:text-red-400">Remove</button></div>
    </div>;
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading teaching assignments…</div>;
  return <section className="space-y-4 pb-8 text-slate-950 dark:text-white">
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{notice}</p>}
    <div className="grid grid-cols-4 gap-1.5 sm:gap-3">{([
      [Users, teachers.length, "Teachers", "blue"], [BookOpen, assigned.length, "Assignments", "emerald"], [Clock3, lessons.length, "Periods", "indigo"], [AlertCircle, unassigned.length, "Unassigned", "amber"],
    ] as const).map(([Icon, count, label, tone]) => <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 sm:p-3"><Icon className={`mb-1 h-4 w-4 ${tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-600" : tone === "indigo" ? "text-indigo-600" : "text-blue-600"}`} /><strong className="block text-lg leading-none sm:text-xl">{count}</strong><span className="mt-1 block truncate text-[9px] text-slate-500 dark:text-slate-300 sm:text-xs">{label}</span></div>)}</div>
    <div className="flex gap-2"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${field} pl-9 pr-8`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teacher, class, section, subject or period..." aria-label="Search teaching assignments" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"><X className="h-4 w-4" /></button>}</label><button type="button" onClick={() => startAssignment()} className={primary}><Plus className="h-4 w-4" /> Assign</button></div>
    <div className="flex items-center justify-between gap-2"><div className="flex gap-1.5 overflow-x-auto">{(["all", "teacher", "unassigned"] as const).map((choice) => <button key={choice} type="button" onClick={() => setFilter(choice)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === choice ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-500/20 dark:text-blue-300" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>{choice === "all" ? "All" : choice === "teacher" ? "By teacher" : "Unassigned"}</button>)}</div><button type="button" onClick={() => setPeriodManagerOpen(true)} aria-label="Manage school periods" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300"><Settings2 className="h-4 w-4" /><span className="hidden sm:inline">Periods</span></button></div>
    {!lessons.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Configure a lesson period before creating a teaching slot. <button type="button" onClick={() => setPeriodManagerOpen(true)} className="font-bold underline">Manage periods</button></div>}
    {filter !== "unassigned" && <div><div className="mb-2 flex items-end justify-between"><div><h2 className="text-lg font-bold">Teacher Assignments</h2><p className="text-xs text-slate-500 dark:text-slate-400">Classes, subjects and periods assigned to teachers.</p></div><span className="text-xs text-slate-500">{shownTeachers.length} teachers</span></div><div className="space-y-2">{shownTeachers.map((teacher, index) => {
      const teacherRows = assigned.filter((item) => item.teacher_id === teacher.id);
      const open = expanded === teacher.id || (expanded === null && index === 0) || (Boolean(query) && teacherRows.some(matches));
      return <article key={teacher.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><button type="button" onClick={() => setExpanded(open ? "" : teacher.id)} aria-expanded={open} className="flex w-full items-center gap-2.5 p-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{initials(teacher.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{teacher.name}</span><span className="block truncate text-xs text-slate-500 dark:text-slate-400">{teacher.department || teacher.subject || "Teacher"}</span></span><span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{teacherRows.length} assigned</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 ${open ? "rotate-180" : ""}`} /></button>{open && <div className="space-y-2 border-t border-slate-100 p-2 dark:border-slate-700 sm:p-3">{teacherRows.length ? teacherRows.map(renderAssignmentCard) : <p className="p-3 text-center text-xs text-slate-500">No teaching assignments yet.</p>}<button type="button" onClick={() => startAssignment(undefined, teacher.id)} className={secondary}>+ Add assignment</button></div>}</article>;
    })}{!shownTeachers.length && <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No teacher assignments found.</div>}</div></div>}
    {(filter === "all" || filter === "unassigned") && <div><h2 className="mb-1 text-lg font-bold">Needs Assignment</h2><p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Teaching slots that currently have no teacher.</p><div className="space-y-2">{shownUnassigned.map((item) => { const info = details(item); return <article key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-500/10"><div className="min-w-0"><p className="text-sm font-bold">{info.className} · {info.section ? `Section ${info.section}` : "No section"}</p><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.subject} · {info.period?.name || "Period not set"}{info.period && timeLabel(info.period) ? ` (${timeLabel(info.period)})` : ""}</p><p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">Teacher not assigned</p></div><button type="button" onClick={() => startAssignment(item, "", true)} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Assign</button></article>; })}{!shownUnassigned.length && <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">Everything is assigned.</div>}</div></div>}
    {form && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><form onSubmit={saveAssignment} className="max-h-[calc(100dvh-12px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white px-4 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] shadow-xl dark:bg-slate-900 sm:rounded-2xl sm:p-6"><div className="flex items-start justify-between"><div><h3 className="text-lg font-bold">{editingId ? "Edit teaching slot" : "Assign teacher"}</h3><p className="text-xs text-slate-500 dark:text-slate-400">Choose teacher, class, section, subject and period.</p></div><button type="button" onClick={() => setForm(null)} aria-label="Close" className="p-1"><X className="h-5 w-5" /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Teacher<select className={`mt-1 ${field}`} value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })}><option value="">Not assigned (create a slot)</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label><label className="text-xs font-semibold">Class<select required className={`mt-1 ${field}`} value={form.className} onChange={(event) => { const next = groups.find((group) => group.name === event.target.value); setForm({ ...form, className: next?.name || "", classId: next?.choices[0]?.id || "" }); }}><option value="">Choose class</option>{groups.map((group) => <option key={group.name} value={group.name}>{displayClass(group.name)}</option>)}</select></label><label className="text-xs font-semibold">Section<select required className={`mt-1 ${field}`} value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })}>{(groups.find((group) => group.name === form.className)?.choices || []).map((choice) => <option key={choice.id} value={choice.id}>{choice.section ? `Section ${choice.section}` : "No section"}</option>)}</select></label><label className="text-xs font-semibold">Subject<input required list="assignment-school-subjects" className={`mt-1 ${field}`} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="e.g. Mathematics" maxLength={100} /><datalist id="assignment-school-subjects">{subjects.map((subject) => <option key={subject} value={subject} />)}</datalist></label><label className="text-xs font-semibold">Class period<select required className={`mt-1 ${field}`} value={form.periodId} onChange={(event) => setForm({ ...form, periodId: event.target.value })}><option value="">Choose period</option>{lessons.map((period) => <option key={period.id} value={period.id}>{period.name}{timeLabel(period) ? ` — ${timeLabel(period)}` : ""}</option>)}</select></label><label className="text-xs font-semibold">Day<select className={`mt-1 ${field}`} value={form.weekday} onChange={(event) => setForm({ ...form, weekday: event.target.value })}><option value="">Every school day</option>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label></div>{error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}<div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setForm(null)} className="h-11 rounded-xl border border-slate-200 text-sm font-semibold dark:border-slate-700">Cancel</button><button disabled={working || !lessons.length || !groups.length} className={primary}>{working ? "Saving…" : "Save assignment"}</button></div></form></div>, document.body)}
    {periodManagerOpen && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) { setPeriodManagerOpen(false); setPeriodForm(null); } }}><div className="max-h-[calc(100dvh-12px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white px-4 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] shadow-xl dark:bg-slate-900 sm:rounded-2xl sm:p-6"><div className="flex justify-between"><div><h3 className="text-lg font-bold">School periods</h3><p className="text-xs text-slate-500 dark:text-slate-400">Configure lessons and breaks for {year}.</p></div><button type="button" onClick={() => { setPeriodManagerOpen(false); setPeriodForm(null); }} aria-label="Close"><X className="h-5 w-5" /></button></div>{error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}<div className="mt-4 space-y-2">{periods.map((period) => <div key={period.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="min-w-0"><p className="truncate text-sm font-semibold">{period.name} {period.kind === "break" ? "· Break" : ""}</p><p className="text-xs text-slate-500 dark:text-slate-400">Order {period.position}{timeLabel(period) ? ` · ${timeLabel(period)}` : ""}</p></div><div className="flex gap-2"><button type="button" onClick={() => startPeriod(period)} className={secondary}>Edit</button><button type="button" disabled={working} onClick={() => removePeriod(period)} className="text-xs font-semibold text-red-600 dark:text-red-400">Remove</button></div></div>)}{!periods.length && <p className="text-sm text-slate-500">No periods configured yet.</p>}</div>{!periodForm ? <button type="button" onClick={() => startPeriod()} className={`mt-4 ${primary}`}><Plus className="h-4 w-4" /> Add period</button> : <form onSubmit={savePeriod} className="mt-4 space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="grid grid-cols-2 gap-3"><label className="col-span-2 text-xs font-semibold">Name<input required maxLength={60} className={`mt-1 ${field}`} value={periodForm.name} onChange={(event) => setPeriodForm({ ...periodForm, name: event.target.value })} /></label><label className="text-xs font-semibold">Order<input required type="number" min="1" max="50" className={`mt-1 ${field}`} value={periodForm.position} onChange={(event) => setPeriodForm({ ...periodForm, position: event.target.value })} /></label><label className="text-xs font-semibold">Type<select className={`mt-1 ${field}`} value={periodForm.kind} onChange={(event) => setPeriodForm({ ...periodForm, kind: event.target.value as PeriodForm["kind"] })}><option value="lesson">Lesson</option><option value="break">Lunch / break</option></select></label><label className="text-xs font-semibold">Start time (optional)<input type="time" className={`mt-1 ${field}`} value={periodForm.start} onChange={(event) => setPeriodForm({ ...periodForm, start: event.target.value })} /></label><label className="text-xs font-semibold">End time (optional)<input type="time" className={`mt-1 ${field}`} value={periodForm.end} onChange={(event) => setPeriodForm({ ...periodForm, end: event.target.value })} /></label></div><div className="flex gap-2"><button type="button" onClick={() => setPeriodForm(null)} className={secondary}>Cancel</button><button disabled={working} className={primary}>Save period</button></div></form>}</div></div>, document.body)}
  </section>;
}
