"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NepaliDate from "nepali-date-converter";
import { AlertCircle, BookOpen, CalendarDays, ChevronDown, Clock3, Coffee, GraduationCap, Pencil, Plus, Search, Settings2, Trash2, UsersRound, X } from "lucide-react";
import TeacherAvatar from "@/components/TeacherAvatar";
import { supabase } from "@/lib/supabase";

type Teacher = { id: string; name: string; subject: string | null; department?: string | null; avatar_path?: string | null };
type Shift = "morning" | "day";
type ClassRow = { id: string; class_name: string | null; class: string | null; name: string | null; class_number: string | null; section_name: string | null; section: string | null; academic_year: number; archived_at: string | null; shift: Shift };
type Period = { id: string; name: string; position: number; kind: "lesson" | "break"; start_time: string | null; end_time: string | null; shift: Shift };
type Assignment = { id: string; teacher_id: string | null; class_id: string | null; class_name: string; subject: string; period_id: string | null; weekday: number | null; academic_year: string | null; periods_per_week: number; active: boolean };
type ClassGroup = { name: string; choices: { id: string; section: string | null }[] };
type AssignmentForm = { teacherId: string; className: string; classId: string; subject: string; periodId: string; weekday: string };
type PeriodForm = { name: string; position: string; kind: "lesson" | "break"; start: string; end: string };

const year = Number(new NepaliDate(new Date()).format("YYYY"));
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const defaultPeriods: Omit<Period, "id">[] = [
  { name: "Period 1", position: 1, kind: "lesson", start_time: "10:20", end_time: "10:50", shift: "day" },
  { name: "Period 2", position: 2, kind: "lesson", start_time: "10:50", end_time: "11:30", shift: "day" },
  { name: "Period 3", position: 3, kind: "lesson", start_time: "11:30", end_time: "12:10", shift: "day" },
  { name: "Period 4", position: 4, kind: "lesson", start_time: "12:10", end_time: "12:50", shift: "day" },
  { name: "Period 5", position: 5, kind: "lesson", start_time: "12:50", end_time: "13:30", shift: "day" },
  { name: "Lunch", position: 6, kind: "break", start_time: "13:30", end_time: "14:00", shift: "day" },
  { name: "Period 6", position: 7, kind: "lesson", start_time: "14:00", end_time: "14:40", shift: "day" },
  { name: "Period 7", position: 8, kind: "lesson", start_time: "14:40", end_time: "15:20", shift: "day" },
  { name: "Period 8", position: 9, kind: "lesson", start_time: "15:20", end_time: "16:00", shift: "day" },
];

const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const primary = "inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50 sm:px-4 sm:text-sm";
const normalize = (value: string | null | undefined) => (value || "").trim().toLowerCase();
const classNameOf = (row: ClassRow) => row.class_name || row.class || row.name || (row.class_number ? `Class ${row.class_number}` : "Unnamed class");
const displayClass = (value: string) => value.replace(/^Class\s+(\d+)$/i, "Grade $1");
function formatClockTime(value: string | null | undefined) {
  if (!value) return "";
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

function parseClockTime(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return "";
  const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveHour) {
    let hours = Number(twelveHour[1]);
    const minutes = Number(twelveHour[2]);
    if (hours < 1 || hours > 12 || minutes > 59) return null;
    if (twelveHour[3] === "AM") hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFourHour) return null;
  const hours = Number(twentyFourHour[1]);
  const minutes = Number(twentyFourHour[2]);
  return hours <= 23 && minutes <= 59 ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` : null;
}

const timeLabel = (period: Period) => period.start_time && period.end_time ? `${formatClockTime(period.start_time)}–${formatClockTime(period.end_time)}` : "";

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

export default function TeacherAssignmentsPanel({ schoolId, teachers, avatarScope, onTeacherChanged }: { schoolId: string; teachers: Teacher[]; avatarScope: string; onTeacherChanged: () => void }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter] = useState<"all" | "teacher" | "unassigned">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [timetableClassName, setTimetableClassName] = useState("");
  const [form, setForm] = useState<AssignmentForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requireTeacher, setRequireTeacher] = useState(false);
  const [periodForm, setPeriodForm] = useState<PeriodForm | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [periodManagerOpen, setPeriodManagerOpen] = useState(false);
  const periodFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!periodForm) return;
    const frame = window.requestAnimationFrame(() => periodFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [periodForm]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [assignmentResult, classResult, periodResult, subjectResult] = await Promise.all([
        supabase.from("teacher_assignments").select("id, teacher_id, class_id, class_name, subject, period_id, weekday, academic_year, periods_per_week, active").eq("school_id", schoolId).eq("active", true).order("created_at", { ascending: false }).limit(1000),
        supabase.from("classes").select("id, class_name, class, name, class_number, section_name, section, academic_year, archived_at, shift").eq("school_id", schoolId).eq("academic_year", year).is("archived_at", null).order("created_at", { ascending: true }).limit(500),
        supabase.from("school_periods").select("id, name, position, kind, start_time, end_time, shift").eq("school_id", schoolId).eq("academic_year", year).order("position", { ascending: true }),
        supabase.from("school_subjects").select("name").eq("school_id", schoolId).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      let loadedPeriods = ((periodResult.data || []) as Period[]).filter((period) => period.shift === "day");
      let periodFailure = periodResult.error;
      if (!periodFailure && loadedPeriods.length === 0) {
        const defaultsResult = await supabase.from("school_periods").insert(defaultPeriods.map((period) => ({ ...period, school_id: schoolId, academic_year: year }))).select("id, name, position, kind, start_time, end_time, shift").order("position", { ascending: true });
        if (defaultsResult.error) {
          const retryResult = await supabase.from("school_periods").select("id, name, position, kind, start_time, end_time, shift").eq("school_id", schoolId).eq("academic_year", year).eq("shift", "day").order("position", { ascending: true });
          periodFailure = retryResult.error;
          loadedPeriods = (retryResult.data || []) as Period[];
        } else {
          loadedPeriods = (defaultsResult.data || []) as Period[];
        }
      }
      const failure = assignmentResult.error || classResult.error || periodFailure || subjectResult.error;
      setError(failure?.message || "");
      setAssignments(((assignmentResult.data || []) as Assignment[]).filter((item) => !item.academic_year || item.academic_year === String(year)));
      setClasses((classResult.data || []) as ClassRow[]);
      setPeriods(loadedPeriods);
      setSchoolSubjects((subjectResult.data || []).map((row) => row.name).filter(Boolean));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [schoolId, refresh]);

  const groups = useMemo(() => groupClasses(classes), [classes]);
  const classById = useMemo(() => new Map(classes.map((row) => [row.id, row])), [classes]);
  const periodById = useMemo(() => new Map(periods.map((period) => [period.id, period])), [periods]);
  const subjects = useMemo(() => [...new Set(schoolSubjects.map((item) => item.trim()).filter(Boolean))], [schoolSubjects]);
  const activePeriods = periods.filter((period) => period.shift === "day");
  const lessons = activePeriods.filter((period) => period.kind === "lesson");
  const assigned = assignments.filter((item) => item.teacher_id);
  const query = normalize(search);
  const classNumber = (name: string) => Number(name.match(/\d+/)?.[0] || 0);
  const juniorTimetableGroups = groups.filter((group) => classNumber(group.name) > 0 && classNumber(group.name) <= 10);
  const seniorTimetableGroups = groups.filter((group) => classNumber(group.name) >= 11);
  const otherTimetableGroups = groups.filter((group) => classNumber(group.name) === 0);
  const selectedTimetableGroup = groups.find((group) => group.name === timetableClassName) || groups[0];
  const selectedTimetableClassIds = new Set(selectedTimetableGroup?.choices.map((choice) => choice.id) || []);

  useEffect(() => {
    if (!groups.length) return;
    if (!groups.some((group) => group.name === timetableClassName)) setTimetableClassName(groups[0].name);
  }, [groups, timetableClassName]);

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

  function startAssignment(item?: Assignment, teacherId = "", mustAssign = false) {
    const row = item?.class_id ? classById.get(item.class_id) : null;
    const group = row ? groups.find((entry) => normalize(entry.name) === normalize(classNameOf(row))) : groups.find((entry) => normalize(entry.name) === normalize(item?.class_name));
    const selectedGroup = group || groups[0];
    const selectedClassId = row?.id || selectedGroup?.choices[0]?.id || "";
    const firstPeriod = lessons[0];
    setForm({ teacherId: item?.teacher_id || teacherId, className: selectedGroup?.name || "", classId: selectedClassId, subject: item?.subject || "", periodId: item?.period_id || firstPeriod?.id || "", weekday: item?.weekday === null || item?.weekday === undefined ? "" : String(item.weekday) });
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
    if (!selected || !period || period.kind !== "lesson" || period.shift !== "day" || !form.subject.trim() || (form.teacherId && !teacher) || (requireTeacher && !teacher)) {
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
    setPeriodForm({ name: period?.name || `Period ${activePeriods.filter((item) => item.kind === "lesson").length + 1}`, position: String(period?.position || Math.min(50, (activePeriods.at(-1)?.position || 0) + 1)), kind: period?.kind || "lesson", start: formatClockTime(period?.start_time), end: formatClockTime(period?.end_time) });
    setError("");
  }

  async function savePeriod(event: React.FormEvent) {
    event.preventDefault();
    if (!periodForm || working) return;
    const startTime = parseClockTime(periodForm.start);
    const endTime = parseClockTime(periodForm.end);
    if (startTime === null || endTime === null) {
      setError("Use a time like 10:20 AM or 2:00 PM."); return;
    }
    if (Boolean(startTime) !== Boolean(endTime) || (startTime && endTime && endTime <= startTime)) {
      setError("Enter both times, with the end after the start, or leave both blank."); return;
    }
    const overlaps = periods.some((period) => period.id !== editingPeriodId && period.shift === "day" && period.start_time && period.end_time && startTime && endTime && startTime < period.end_time.slice(0, 5) && endTime > period.start_time.slice(0, 5));
    if (overlaps) { setError("This time overlaps another period."); return; }
    if (periodForm.kind === "break" && editingPeriodId && assignments.some((item) => item.period_id === editingPeriodId)) {
      setError("Move teaching slots out of this period before changing it to a break."); return;
    }
    setWorking(true); setError("");
    const payload = { school_id: schoolId, academic_year: year, shift: "day", name: periodForm.name.trim(), position: Number(periodForm.position), kind: periodForm.kind, start_time: startTime || null, end_time: endTime || null };
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

  function timetableTeacherName(teacherId: string | null) {
    const teacher = teachers.find((item) => item.id === teacherId);
    if (!teacher) return "Unassigned";
    const parts = teacher.name.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || teacher.name;
    const sameFirstName = teachers.filter((item) => item.name.trim().split(/\s+/)[0]?.toLowerCase() === firstName.toLowerCase()).length > 1;
    return sameFirstName && parts.length > 1 ? `${firstName} ${parts.at(-1)?.[0]?.toUpperCase()}.` : firstName;
  }

  function renderAssignmentRow(item: Assignment) {
    const { period } = details(item);
    return <div key={item.id} className="grid min-w-0 grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1.15fr)_auto_auto] items-center gap-1 border-t border-slate-100 px-2 py-2.5 first:border-t-0 dark:border-slate-700 sm:grid-cols-[minmax(90px,1fr)_auto_auto_auto_auto] sm:gap-2 sm:px-4">
      <p className="min-w-0 truncate text-[10px] font-extrabold text-slate-950 dark:text-white sm:text-sm">{item.subject}</p>
      <span className="whitespace-nowrap rounded-full bg-indigo-50 px-1.5 py-1 text-[8px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 sm:px-2 sm:text-[10px]">{period?.name || "No period"}</span>
      <span className="min-w-0 truncate whitespace-nowrap text-[8px] text-slate-500 dark:text-slate-400 sm:text-xs">{period && timeLabel(period) ? timeLabel(period) : item.weekday !== null ? weekdays[item.weekday] : ""}</span>
      <button type="button" disabled={working} onClick={() => startAssignment(item)} className="inline-flex h-8 items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-0.5 text-[8px] font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 sm:gap-1 sm:px-2 sm:text-[10px]"><Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Edit</button>
      <button type="button" disabled={working} onClick={() => removeAssignment(item)} className="inline-flex h-8 items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-0.5 text-[8px] font-bold text-red-600 hover:bg-red-50 dark:text-red-300 sm:gap-1 sm:px-2 sm:text-[10px]"><Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Remove</button>
    </div>;
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading teaching assignments…</div>;
  return <section className="space-y-4 pb-8 text-slate-950 dark:text-white">
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{notice}</p>}
    <div className="flex gap-2"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${field} !h-9 pl-9 pr-8`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teacher, class, section, subject or period..." aria-label="Search teaching assignments" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"><X className="h-4 w-4" /></button>}</label><button type="button" onClick={() => startAssignment()} className={`${primary} !h-9`}><Plus className="h-4 w-4" /> Assign</button></div>
    {!lessons.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Configure a lesson period before creating a teaching slot. <button type="button" onClick={() => setPeriodManagerOpen(true)} className="font-bold underline">Manage periods</button></div>}
    {filter !== "unassigned" && <div><div className="mb-2"><div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold">Teacher Assignments</h2><button type="button" onClick={() => setPeriodManagerOpen(true)} aria-label="Manage school periods" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300"><Settings2 className="h-4 w-4" /><span>Manage periods</span></button></div><div className="mt-0.5 flex items-center justify-between gap-2"><p className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">Classes, subjects and periods assigned to teachers.</p><span className="shrink-0 text-xs text-slate-500">{shownTeachers.length} teachers</span></div></div><div className="space-y-2">{shownTeachers.map((teacher, index) => {
      const teacherRows = assigned.filter((item) => item.teacher_id === teacher.id);
      const open = expanded === teacher.id || (expanded === null && index === 0) || (Boolean(query) && teacherRows.some(matches));
      const subjectNames = [...new Set(teacherRows.map((item) => item.subject).filter(Boolean))];
      const subjectSummary = subjectNames.length === 0 ? "No subjects assigned" : subjectNames.length <= 3 ? subjectNames.join(", ") : `${subjectNames.slice(0, 2).join(", ")} +${subjectNames.length - 2} more`;
      const classGroups = new Map<string, Assignment[]>();
      teacherRows.forEach((item) => {
        const info = details(item);
        const label = `${info.className}${info.section ? ` · Section ${info.section}` : ""}`;
        classGroups.set(label, [...(classGroups.get(label) || []), item]);
      });
      return <article key={teacher.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <button type="button" onClick={() => setExpanded(open ? "" : teacher.id)} aria-expanded={open} className="flex w-full items-center gap-2.5 p-3 text-left sm:p-4">
          <TeacherAvatar name={teacher.name} path={teacher.avatar_path} scope={avatarScope} className="h-12 w-12 shrink-0 rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 sm:h-14 sm:w-14" />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold sm:text-base">{teacher.name}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">{subjectSummary}</span></span>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{teacherRows.length} assigned</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <div className="border-t border-slate-100 p-2 dark:border-slate-700 sm:p-3">
          {classGroups.size ? <div className="space-y-2">{[...classGroups].map(([classLabel, rows], groupIndex) => <section key={classLabel} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"><div className={`flex items-center gap-2 px-3 py-2.5 ${groupIndex % 2 ? "bg-emerald-50/70 dark:bg-emerald-500/10" : "bg-blue-50/70 dark:bg-blue-500/10"}`}><GraduationCap className={`h-4 w-4 shrink-0 ${groupIndex % 2 ? "text-emerald-600" : "text-blue-600"}`} /><h4 className="min-w-0 flex-1 truncate text-xs font-extrabold sm:text-sm">{classLabel}</h4><span className="shrink-0 text-[10px] text-slate-500">{rows.length} {rows.length === 1 ? "assignment" : "assignments"}</span></div>{rows.map(renderAssignmentRow)}</section>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-800">No teaching assignments yet.</p>}
          <button type="button" onClick={() => startAssignment(undefined, teacher.id)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-blue-500 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300"><Plus className="h-4 w-4" />Add assignment</button>
        </div>}
      </article>;
    })}{!shownTeachers.length && <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No teacher assignments found.</div>}</div></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold sm:text-lg">Class Timetable</h2><p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">View assigned and empty periods for each class.</p></div><span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{selectedTimetableGroup ? displayClass(selectedTimetableGroup.name) : "No classes"}</span></div>
      {groups.length ? <>
        <div className="mt-3 space-y-2">
          {(juniorTimetableGroups.length || otherTimetableGroups.length) > 0 && <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{[...juniorTimetableGroups, ...otherTimetableGroups].map((group) => <button key={group.name} type="button" onClick={() => setTimetableClassName(group.name)} className={`h-8 shrink-0 rounded-lg px-2.5 text-[10px] font-bold transition ${selectedTimetableGroup?.name === group.name ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{displayClass(group.name)}</button>)}</div>}
          {seniorTimetableGroups.length > 0 && <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{seniorTimetableGroups.map((group) => <button key={group.name} type="button" onClick={() => setTimetableClassName(group.name)} className={`h-8 shrink-0 rounded-lg px-2.5 text-[10px] font-bold transition ${selectedTimetableGroup?.name === group.name ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{displayClass(group.name)}</button>)}</div>}
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 sm:hidden dark:border-slate-700">
          <div className="grid h-9 grid-cols-[54px_repeat(6,minmax(0,1fr))] bg-slate-100 dark:bg-slate-800"><div className="border-r border-slate-200 px-1 py-1 text-center text-[11px] font-extrabold text-slate-500 dark:border-slate-700">Period</div>{weekdays.slice(0, 6).map((day) => <div key={day} className="border-r border-slate-200 px-0.5 py-1 text-center text-[11px] font-extrabold text-slate-600 last:border-r-0 dark:border-slate-700 dark:text-slate-300">{day.slice(0, 3)}</div>)}</div>
          <div>{activePeriods.map((period) => {
            if (period.kind === "break") return <div key={period.id} className="grid h-9 grid-cols-[54px_repeat(6,minmax(0,1fr))] overflow-hidden border-t border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10"><div className="flex items-center justify-center border-r border-emerald-100 px-1 text-center text-[10px] font-extrabold text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">{period.name}</div><div className="col-span-6 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-300">Break</div></div>;
            return <div key={period.id} className="grid h-9 grid-cols-[54px_repeat(6,minmax(0,1fr))] overflow-hidden border-t border-slate-200 dark:border-slate-700"><div className="flex items-center justify-center border-r border-slate-200 bg-white px-1 text-center text-[10px] font-extrabold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{period.name}</div>{weekdays.slice(0, 6).map((_, dayIndex) => {
              const slots = assignments.filter((item) => item.period_id === period.id && item.class_id && selectedTimetableClassIds.has(item.class_id) && (item.weekday === null || item.weekday === dayIndex));
              const slot = slots[0];
              return <div key={dayIndex} className={`flex min-w-0 flex-col items-center justify-center overflow-hidden border-r px-0.5 py-0.5 text-center last:border-r-0 ${slot ? "border-blue-100 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-500/10" : "border-red-100 bg-red-50/70 dark:border-red-900 dark:bg-red-500/10"}`}>{slot ? <><p className="w-full truncate text-[10px] font-extrabold leading-none text-blue-800 dark:text-blue-200">{slot.subject}</p><p className="mt-0.5 w-full truncate text-[8px] leading-none text-blue-500 dark:text-blue-300">{timetableTeacherName(slot.teacher_id)}</p>{slots.length > 1 && <span className="text-[8px] font-bold text-blue-500">+{slots.length - 1}</span>}</> : <span className="text-[10px] font-bold text-red-400 dark:text-red-300">Empty</span>}</div>;
            })}</div>;
          })}</div>
        </div>
        <div className="mt-3 hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 sm:block">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead><tr className="bg-slate-50 dark:bg-slate-800"><th className="sticky left-0 z-10 w-24 bg-slate-50 px-2 py-2 text-[10px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Period</th>{weekdays.slice(0, 6).map((day) => <th key={day} className="px-2 py-2 text-[10px] font-extrabold text-slate-600 dark:text-slate-300">{day.slice(0, 3)}</th>)}</tr></thead>
            <tbody>{activePeriods.map((period) => <tr key={period.id} className="border-t border-slate-100 dark:border-slate-700"><th className="sticky left-0 z-10 bg-white px-2 py-2 align-top dark:bg-slate-900"><span className="block text-[10px] font-extrabold">{period.name}</span><span className="mt-0.5 block whitespace-nowrap text-[8px] font-normal text-slate-400">{timeLabel(period)}</span></th>{weekdays.slice(0, 6).map((_, dayIndex) => {
              if (period.kind === "break") return <td key={dayIndex} className="bg-emerald-50/50 px-2 py-2 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">Break</td>;
              const slots = assignments.filter((item) => item.period_id === period.id && item.class_id && selectedTimetableClassIds.has(item.class_id) && (item.weekday === null || item.weekday === dayIndex));
              return <td key={dayIndex} className="px-2 py-2 align-top">{slots.length ? slots.map((slot) => <div key={slot.id} className="mb-1 last:mb-0"><p className="max-w-[92px] truncate text-[9px] font-bold text-slate-800 dark:text-slate-100">{slot.subject}</p><p className="mt-0.5 max-w-[92px] truncate text-[8px] text-slate-400">{timetableTeacherName(slot.teacher_id)}</p></div>) : <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>}</td>;
            })}</tr>)}</tbody>
          </table>
        </div>
      </> : <div className="mt-3 rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500 dark:bg-slate-800">Add classes to view the timetable.</div>}
    </section>
    {form && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}>
      <form onSubmit={saveAssignment} className="max-h-[calc(100dvh-8px)] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-white px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-2 shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:rounded-3xl sm:p-6">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 sm:hidden" />
        <div className="flex items-start justify-between gap-3"><div><h3 className="text-2xl font-black tracking-tight sm:text-3xl">{editingId ? "Edit assignment" : "Assign teacher"}</h3><p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Choose teacher, class, subject and period.</p></div><button type="button" onClick={() => setForm(null)} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"><X className="h-7 w-7" /></button></div>
        <label className="relative mt-4 flex min-h-[74px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
          {(() => { const selectedTeacher = teachers.find((teacher) => teacher.id === form.teacherId); return <><TeacherAvatar name={selectedTeacher?.name || "Teacher"} path={selectedTeacher?.avatar_path} scope={avatarScope} className="h-14 w-14 shrink-0 rounded-full border border-slate-200 bg-blue-50 text-sm font-bold text-blue-700" /><span className="min-w-0 flex-1"><span className="block truncate text-base font-extrabold">{selectedTeacher?.name || "Choose teacher"}</span><span className="mt-0.5 block text-xs text-slate-500">Teacher</span></span></>; })()}
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-900 dark:text-white" />
          <select aria-label="Teacher" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })}><option value="">Not assigned</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
        </label>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-[62px_repeat(10,minmax(0,1fr))] items-center gap-1"><span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"><GraduationCap className="h-5 w-5" />Class</span>{groups.filter((group) => { const number = classNumber(group.name); return number >= 1 && number <= 10; }).map((group) => <button key={group.name} type="button" onClick={() => setForm({ ...form, className: group.name, classId: group.choices[0]?.id || "" })} className={`h-10 min-w-0 rounded-lg text-xs font-bold transition ${form.className === group.name ? "border-2 border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/15" : "bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white"}`}>{classNumber(group.name)}</button>)}</div>
          {groups.some((group) => classNumber(group.name) >= 11) && <div className="mt-1 grid grid-cols-[62px_repeat(2,36px)] items-center gap-1"><span />{groups.filter((group) => classNumber(group.name) >= 11).map((group) => <button key={group.name} type="button" onClick={() => setForm({ ...form, className: group.name, classId: group.choices[0]?.id || "" })} className={`h-9 rounded-lg text-xs font-bold ${form.className === group.name ? "border-2 border-blue-500 bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white"}`}>{classNumber(group.name)}</button>)}}</div>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="mb-1.5 flex items-center gap-1.5"><UsersRound className="h-4 w-4" />Section</span><select required className={`${field} !h-12 !text-sm`} value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })}>{(groups.find((group) => group.name === form.className)?.choices || []).map((choice) => <option key={choice.id} value={choice.id}>{choice.section ? `Section ${choice.section}` : "No section"}</option>)}</select></label>
          <label className="min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="mb-1.5 flex items-center gap-1.5"><BookOpen className="h-4 w-4" />Subject</span><select required className={`${field} !h-12 !text-sm`} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}><option value="">{subjects.length ? "Choose subject" : "No subjects available"}</option>{subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="mb-1.5 flex items-center gap-1.5"><Clock3 className="h-4 w-4" />Class period</span><select required className={`${field} !h-12 !text-xs !font-bold`} value={form.periodId} onChange={(event) => setForm({ ...form, periodId: event.target.value })}><option value="">Choose period</option>{lessons.map((period) => <option key={period.id} value={period.id}>{period.name}{timeLabel(period) ? ` (${timeLabel(period)})` : ""}</option>)}</select></label>
          <label className="min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="mb-1.5 flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Day</span><select className={`${field} !h-12 !text-sm`} value={form.weekday} onChange={(event) => setForm({ ...form, weekday: event.target.value })}><option value="">Every day</option>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
        </div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-300">{error}</p>}
        <div className="mt-5 grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] gap-3"><button type="button" onClick={() => setForm(null)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">Cancel</button><button disabled={working || !lessons.length || !groups.length} className="h-12 rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">{working ? "Saving…" : "Save assignment"}</button></div>
      </form>
    </div>, document.body)}
    {periodManagerOpen && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setPeriodManagerOpen(false); setPeriodForm(null); } }}><div className="max-h-[calc(100dvh-12px)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-3xl bg-white px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:bg-slate-900 sm:max-h-[calc(100dvh-32px)] sm:rounded-3xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">School periods</h3><button type="button" onClick={() => { setPeriodManagerOpen(false); setPeriodForm(null); }} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-800 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"><X className="h-6 w-6" /></button></div>
      <div className="mt-4"><button type="button" onClick={() => startPeriod()} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"><Plus className="h-4 w-4" /> Add period</button></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-300">{error}</p>}
      <div className="mt-3 space-y-1">{activePeriods.map((period, index) => {
        const isBreak = period.kind === "break";
        return <div key={period.id} className="flex min-h-[48px] items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 transition dark:border-slate-700 dark:bg-slate-900 sm:min-h-[62px] sm:gap-2 sm:rounded-xl sm:p-2">
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm font-black sm:h-9 sm:w-9 sm:rounded-lg sm:text-base ${isBreak ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15" : "bg-blue-50 text-blue-600 dark:bg-blue-500/15"}`}>{index + 1}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold leading-none text-slate-950 dark:text-white sm:text-[13px]">{period.name}</p><p className="mt-0.5 flex items-center gap-0.5 text-[10px] leading-none text-slate-500 dark:text-slate-400"><Clock3 className="h-3 w-3 shrink-0" />{timeLabel(period) || "Time not set"}</p></div>
          <span className={`hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold sm:inline-flex ${isBreak ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15" : "bg-blue-50 text-blue-600 dark:bg-blue-500/15"}`}>{isBreak ? <Coffee className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}{isBreak ? "Break" : "Lesson"}</span>
          <button type="button" onClick={() => startPeriod(period)} aria-label={`Edit ${period.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-50 text-slate-900 sm:h-9 sm:w-9 sm:rounded-lg transition hover:bg-slate-100 dark:bg-slate-800 dark:text-white"><Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
          <button type="button" disabled={working} onClick={() => removePeriod(period)} aria-label={`Delete ${period.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-red-50 text-red-600 sm:h-9 sm:w-9 sm:rounded-lg transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/15 dark:text-red-300"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
        </div>;
      })}</div>
      {periodForm && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPeriodForm(null); }}>
        <form ref={periodFormRef} onSubmit={savePeriod} className="max-h-[calc(100dvh-12px)] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-blue-100 bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl sm:p-8">
          <div className="flex items-center justify-between gap-4"><h4 className="text-lg font-black text-slate-950 dark:text-white sm:text-3xl">Add / Edit period</h4><button type="button" onClick={() => setPeriodForm(null)} aria-label="Close period form" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"><X className="h-6 w-6" /></button></div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-6"><label className="text-xs font-semibold text-slate-900 dark:text-white sm:text-base">Name <span className="text-red-500">*</span><input required maxLength={60} className={`mt-1.5 ${field} !h-10 !px-2 !text-xs sm:mt-2 sm:!h-14 sm:!px-3 sm:!text-base`} value={periodForm.name} onChange={(event) => setPeriodForm({ ...periodForm, name: event.target.value })} /></label><label className="text-xs font-semibold text-slate-900 dark:text-white sm:text-base">Type <span className="text-red-500">*</span><span className="relative mt-2 block"><BookOpen className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 sm:left-3 sm:h-5 sm:w-5" /><select className={`${field} !h-10 !pl-8 !pr-1 !text-xs sm:!h-14 sm:!pl-10 sm:!pr-3 sm:!text-base`} value={periodForm.kind} onChange={(event) => setPeriodForm({ ...periodForm, kind: event.target.value as PeriodForm["kind"] })}><option value="lesson">Lesson</option><option value="break">Break</option></select></span></label></div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-6"><label className="text-[11px] font-semibold leading-tight text-slate-900 dark:text-white sm:text-base">Order <span className="text-red-500">*</span><input required type="number" min="1" max="50" className={`mt-1.5 ${field} !h-10 !px-2 !text-xs sm:mt-2 sm:!h-14 sm:!px-3 sm:!text-base`} value={periodForm.position} onChange={(event) => setPeriodForm({ ...periodForm, position: event.target.value })} /></label><label className="text-[11px] font-semibold leading-tight text-slate-900 dark:text-white sm:text-base">Start time <span className="block font-normal text-slate-500 sm:inline">(optional)</span><input type="text" inputMode="text" placeholder="10:20 AM" className={`mt-1.5 ${field} !h-10 !px-2 !text-xs sm:mt-2 sm:!h-14 sm:!px-3 sm:!text-base`} value={periodForm.start} onChange={(event) => setPeriodForm({ ...periodForm, start: event.target.value })} /></label><label className="text-[11px] font-semibold leading-tight text-slate-900 dark:text-white sm:text-base">End time <span className="block font-normal text-slate-500 sm:inline">(optional)</span><input type="text" inputMode="text" placeholder="4:00 PM" className={`mt-1.5 ${field} !h-10 !px-2 !text-xs sm:mt-2 sm:!h-14 sm:!px-3 sm:!text-base`} value={periodForm.end} onChange={(event) => setPeriodForm({ ...periodForm, end: event.target.value })} /></label></div>
          <div className="mt-5 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2.5 sm:mt-6 sm:max-w-2xl sm:gap-3"><button type="button" onClick={() => setPeriodForm(null)} className="h-10 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:h-14 sm:text-base">Cancel</button><button disabled={working} className="h-10 rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50 sm:h-14 sm:text-base">{working ? "Saving…" : "Save period"}</button></div>
        </form>
      </div>}
    </div></div>, document.body)}
  </section>;
}
