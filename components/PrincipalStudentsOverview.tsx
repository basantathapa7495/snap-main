"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRightLeft, CalendarCheck2, Check, ChevronRight, Clock3, Plus, UserPlus, UserX, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Student = { id: string; name: string; class: string | null; section: string | null; created_at: string | null };
type ClassRow = { class_name: string | null; class: string | null; name: string | null; class_number: string | null; section: string | null; section_name: string | null; academic_year: number | null };
type Mark = { student_id: string; attendance_date: string; status: string };
type Request = { id: string; full_name: string; class: string | null; section: string | null; created_at: string };
const normalize = (value: string | null | undefined) => (value || "").trim().toLowerCase().replace(/\s+/g, " ");
const className = (row: ClassRow) => row.class_name || row.class || row.name || row.class_number || "";
const sameClass = (student: string | null, value: string) => normalize(student).replace(/^(class|grade)\s+/, "") === normalize(value).replace(/^(class|grade)\s+/, "");
const displayClass = (name: string) => /^(class|grade)\s/i.test(name) ? name.replace(/^class\s/i, "Grade ") : `Grade ${name}`;
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const since = () => { const date = new Date(); date.setUTCDate(date.getUTCDate() - 89); return date.toISOString().slice(0, 10); };
const ago = (value: string | null) => { if (!value) return ""; const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000)); return days === 0 ? "Today" : days === 1 ? "Yesterday" : days < 30 ? `${days}d ago` : new Date(value).toLocaleDateString(); };

export default function PrincipalStudentsOverview({ schoolId, students, onAdd, onMove, onStudents, onClass, onUnassigned, onJoining }: {
  schoolId: string; students: Student[]; onAdd: () => void; onMove: () => void; onStudents: () => void; onClass: (name: string) => void; onUnassigned: (ids: string[]) => void; onJoining: () => void;
}) {
  const router = useRouter();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [classRows, setClassRows] = useState<ClassRow[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sign in again to load the overview.");
        const [attendance, classes, requestResponse] = await Promise.all([
          supabase.from("attendance").select("student_id, attendance_date, status").eq("school_id", schoolId).gte("attendance_date", since()).lte("attendance_date", today()),
          supabase.from("classes").select("class_name,class,name,class_number,section,section_name,academic_year").eq("school_id", schoolId).is("archived_at", null).limit(1000),
          fetch("/api/account-requests?role=student", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" }),
        ]);
        if (attendance.error) throw attendance.error;
        if (classes.error) throw classes.error;
        const pending = await requestResponse.json();
        if (!requestResponse.ok) throw new Error(pending.error || "Joining requests could not be loaded.");
        if (!cancelled) { setMarks((attendance.data || []) as Mark[]); setClassRows((classes.data || []) as ClassRow[]); setRequests(pending.requests || []); }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Overview could not be loaded."); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [schoolId]);

  const groups = useMemo(() => {
    const currentYear = Math.max(...classRows.map((row) => row.academic_year || 0), 0);
    const rows = classRows.filter((row) => (row.academic_year || 0) === currentYear);
    const map = new Map<string, { name: string; sections: Set<string> }>();
    for (const row of rows) {
      const name = className(row); if (!name) continue;
      const key = normalize(name).replace(/^(class|grade)\s+/, "");
      const group = map.get(key) || { name: displayClass(name), sections: new Set<string>() };
      const section = normalize(row.section_name || row.section);
      if (section) group.sections.add(section);
      map.set(key, group);
    }
    return [...map.values()].map((group) => ({ ...group, count: students.filter((student) => sameClass(student.class, group.name)).length })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [classRows, students]);
  const unassigned = useMemo(() => students.filter((student) => {
    if (!normalize(student.class)) return true;
    const group = groups.find((item) => sameClass(student.class, item.name));
    return !group || (group.sections.size > 0 && !group.sections.has(normalize(student.section)));
  }), [students, groups]);
  const studentIds = useMemo(() => new Set(students.map((student) => student.id)), [students]);
  const latest = useMemo(() => {
    const byId = new Map<string, Mark>();
    marks.filter((mark) => studentIds.has(mark.student_id) && mark.attendance_date === today()).forEach((mark) => byId.set(mark.student_id, mark));
    return [...byId.values()];
  }, [marks, studentIds]);
  const present = latest.filter((mark) => mark.status === "present").length;
  const late = latest.filter((mark) => mark.status === "late").length;
  const absent = latest.filter((mark) => mark.status === "absent").length;
  const leave = latest.filter((mark) => mark.status === "leave").length;
  const marked = present + late + absent + leave;
  const rate = marked ? Math.round((present + late) / marked * 100) : null;
  const lowAttendance = useMemo(() => {
    const totals = new Map<string, { present: number; marked: number }>();
    for (const mark of marks) {
      if (!studentIds.has(mark.student_id) || !["present", "late", "absent", "leave"].includes(mark.status)) continue;
      const current = totals.get(mark.student_id) || { present: 0, marked: 0 };
      current.marked += 1; if (["present", "late"].includes(mark.status)) current.present += 1;
      totals.set(mark.student_id, current);
    }
    return [...totals.values()].filter((item) => item.marked && item.present / item.marked < 0.75).length;
  }, [marks, studentIds]);

  const stats = [[UsersRound, "Students", students.length, "text-blue-600 bg-blue-50 dark:bg-blue-500/15"], [Check, "Present", loading ? "—" : present, "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15"], [UserX, "Absent", loading ? "—" : absent, "text-rose-600 bg-rose-50 dark:bg-rose-500/15"], [AlertTriangle, "Unassigned", loading ? "—" : unassigned.length, "text-amber-600 bg-amber-50 dark:bg-amber-500/15"]] as const;
  return <div className="space-y-4 pb-6 text-slate-950 dark:text-white">
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>}
    <section aria-label="Student summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">{stats.map(([Icon, label, value, tone]) => <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900 sm:px-3 sm:py-2"><div className="flex items-center gap-1"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon className="h-3 w-3" /></span><strong className="min-w-0 text-base leading-none sm:text-xl">{value}</strong></div><span className="mt-1 block truncate text-[9px] leading-none text-slate-500 dark:text-slate-400 sm:text-xs">{label}</span></div>)}</section>
    <section><h2 className="mb-2 text-base font-bold">Quick Actions</h2><div className="grid grid-cols-2 gap-2">{([[Plus, "Add Student", "New student record", onAdd], [ArrowRightLeft, "Move Student", "Change class or section", onMove], [CalendarCheck2, "Attendance", "View today's records", null], [UserPlus, "Joining", "School access", onJoining]] as const).map(([Icon, title, sub, handler]) => handler ? <button key={title} type="button" onClick={handler} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/15"><Icon className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-xs">{title}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{sub}</span></span></button> : <Link key={title} href="/principal/attendance" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"><span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/15"><Icon className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-xs">{title}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{sub}</span></span></Link>)}</div></section>
    <section><div className="mb-2 flex items-center justify-between"><h2 className="text-base font-bold">Attendance Today</h2><Link href="/principal/attendance" className="text-xs font-semibold text-blue-600 dark:text-blue-300">View attendance</Link></div><div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between"><strong className="text-xs">School-wide attendance</strong><strong className="text-lg text-emerald-600">{loading || rate === null ? "—" : `${rate}%`}</strong></div><div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">{[["Present", present, "text-emerald-600"], ["Absent", absent, "text-rose-600"], ["Leave", leave, "text-amber-600"]].map(([label, count, color]) => <div key={label} className="rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-800"><span className="block text-[10px] text-slate-500 dark:text-slate-400">{label}</span><strong className={color as string}>{loading ? "—" : count}</strong></div>)}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate || 0}%` }} /></div><p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">{loading ? "Loading attendance…" : marked ? `${present} of ${marked} marked students present` : "No attendance marked today"}</p></div></section>
    <section><h2 className="mb-2 text-base font-bold">Needs Attention</h2><div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">{([[AlertTriangle, `${loading ? "—" : unassigned.length} students unassigned`, "Assign a class or section.", () => onUnassigned(unassigned.map((student) => student.id)), "text-amber-600 bg-amber-50"], [UserPlus, `${loading ? "—" : requests.length} joining requests pending`, "Waiting for teacher review.", onJoining, "text-blue-600 bg-blue-50"], [Clock3, `${loading ? "—" : lowAttendance} students with low attendance`, "Below 75% in the last 90 days.", () => router.push("/principal/attendance#low-attendance"), "text-rose-600 bg-rose-50"]] as const).map(([Icon, title, detail, action, tone]) => <button key={title} type="button" onClick={action} className="flex w-full items-center gap-2 px-3 py-2 text-left"><span className={`rounded-lg p-1.5 ${tone}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-xs">{title}</strong><span className="block text-[10px] text-slate-500 dark:text-slate-400">{detail}</span></span><ChevronRight className="h-4 w-4 text-slate-400" /></button>)}</div></section>
    <section><div className="mb-2 flex items-center justify-between"><h2 className="text-base font-bold">Recently Added</h2><button type="button" onClick={onStudents} className="text-xs font-semibold text-blue-600 dark:text-blue-300">View all</button></div><div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">{students.slice(0, 4).map((student) => <button type="button" key={student.id} onClick={() => onClass(student.class || "All")} className="flex w-full items-center gap-2 px-3 py-2 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">{student.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{student.name}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{student.class || "Unassigned"}{student.section ? ` · Section ${student.section}` : ""}</span></span><span className="text-[10px] text-slate-400">{ago(student.created_at)}</span></button>)}{!students.length && <p className="p-4 text-center text-xs text-slate-500">No students added yet.</p>}</div></section>
  </div>;
}
