"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock3, UsersRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Student = { id: string; class: string | null; section: string | null };
type Mark = { student_id: string; status: string };
type ClassRow = { class_name: string | null; class: string | null; name: string | null; class_number: string | null; section: string | null; section_name: string | null; academic_year: number | null };

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const key = (value: string | null | undefined) => (value || "").trim().toLowerCase().replace(/^(class|grade)\s+/, "").replace(/\s+/g, " ");
const label = (name: string) => /^(class|grade)\s/i.test(name) ? name.replace(/^class\s/i, "Grade ") : `Grade ${name}`;

export default function PrincipalStudentAttendanceTab({ schoolId, students }: { schoolId: string; students: Student[] }) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [classFilter, setClassFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [classRows, setClassRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const [attendance, classes] = await Promise.all([
        supabase.from("attendance").select("student_id,status").eq("school_id", schoolId).eq("attendance_date", date),
        supabase.from("classes").select("class_name,class,name,class_number,section,section_name,academic_year").eq("school_id", schoolId).is("archived_at", null).limit(1000),
      ]);
      if (cancelled) return;
      if (attendance.error || classes.error) {
        setError(attendance.error?.message || classes.error?.message || "Attendance could not be loaded.");
        setMarks([]);
        setClassRows([]);
      } else {
        setMarks((attendance.data || []) as Mark[]);
        setClassRows((classes.data || []) as ClassRow[]);
      }
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [schoolId, date]);

  const groups = useMemo(() => {
    const year = Math.max(0, ...classRows.map((row) => row.academic_year || 0));
    const map = new Map<string, { name: string; sections: Set<string> }>();
    for (const row of classRows.filter((item) => (item.academic_year || 0) === year)) {
      const raw = row.class_name || row.class || row.name || row.class_number;
      if (!raw) continue;
      const group = map.get(key(raw)) || { name: label(raw), sections: new Set<string>() };
      const section = row.section_name || row.section;
      if (section?.trim()) group.sections.add(section.trim().toLowerCase());
      map.set(key(raw), group);
    }
    // Records can remain in a class even when its class row has been archived.
    for (const student of students) if (student.class && !map.has(key(student.class))) map.set(key(student.class), { name: label(student.class), sections: new Set<string>() });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [classRows, students]);

  const validIds = useMemo(() => new Set(students.map((student) => student.id)), [students]);
  const byStudent = useMemo(() => new Map(marks.filter((mark) => validIds.has(mark.student_id)).map((mark) => [mark.student_id, mark.status.toLowerCase()])), [marks, validIds]);
  const statuses = [...byStudent.values()];
  const present = statuses.filter((status) => status === "present" || status === "late").length;
  const absent = statuses.filter((status) => status === "absent").length;
  const leave = statuses.filter((status) => status === "leave").length;
  const marked = present + absent + leave;
  const rate = marked ? Math.round(present / marked * 100) : null;
  const summaries = groups.filter((group) => classFilter === "All" || key(group.name) === classFilter).map((group) => {
    const members = students.filter((student) => key(student.class) === key(group.name));
    const attended = members.filter((student) => ["present", "late"].includes(byStudent.get(student.id) || "")).length;
    const recorded = members.filter((student) => ["present", "late", "absent", "leave"].includes(byStudent.get(student.id) || "")).length;
    return { ...group, total: members.length, attended, recorded, percent: recorded ? Math.round(attended / recorded * 100) : null };
  });
  const shown = showAll ? summaries : summaries.slice(0, 5);
  function openAttendance(className?: string) {
    const params = new URLSearchParams({ date });
    if (className) params.set("class", className);
    router.push(`/principal/attendance?${params.toString()}`);
  }

  const cards = [
    { title: "Students", count: students.length, note: "Enrolled", icon: UsersRound, tone: "text-green-600 bg-green-50 dark:bg-green-900/30" },
    { title: "Present", count: present, note: "Recorded", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
    { title: "Absent", count: absent, note: "Recorded", icon: X, tone: "text-rose-600 bg-rose-50 dark:bg-rose-900/30" },
    { title: "Leave", count: leave, note: "Recorded", icon: Clock3, tone: "text-amber-600 bg-amber-50 dark:bg-amber-900/30" },
  ];

  return <div className="space-y-3 pb-6 text-slate-950 dark:text-white">
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    <section aria-label="Student attendance summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">
      {cards.map(({ title, count, note, icon: Icon, tone }) => <div key={title} className="min-w-0 rounded-xl border border-slate-200 bg-white px-1.5 py-2 dark:border-slate-700 dark:bg-slate-900 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-3.5 w-3.5" /></span><span className="truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-sm">{title}</span></div>
        <strong className="mt-1 block text-lg leading-none sm:text-2xl">{loading ? "—" : count}</strong><span className="mt-1 block truncate text-[9px] text-slate-400 sm:text-xs">{note}</span>
      </div>)}
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
      <div className="flex items-start justify-between gap-2"><div><h2 className="text-sm font-bold sm:text-base">{date === today() ? "Today's attendance" : "Attendance on selected date"}</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">School-wide attendance overview</p></div><div className="text-right"><strong className="text-xl text-emerald-600">{loading || rate === null ? "—" : `${rate}%`}</strong><p className="whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400">{present} of {marked} recorded present</p></div></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate || 0}%` }} /></div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] sm:text-xs"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Present <strong className="block pl-3">{present}</strong></span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Absent <strong className="block pl-3">{absent}</strong></span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Leave <strong className="block pl-3">{leave}</strong></span></div>
      <div className="mt-2 text-right"><button type="button" onClick={() => openAttendance()} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">View full attendance →</button></div>
    </section>

    <div className="grid grid-cols-2 gap-2">
      <label className="relative flex min-w-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"><CalendarDays className="h-4 w-4 shrink-0 text-slate-500" /><span className="sr-only">Attendance date</span><input type="date" max={today()} value={date} onChange={(event) => setDate(event.target.value)} className="h-10 min-w-0 w-full bg-transparent text-[11px] text-slate-700 outline-none dark:text-slate-200" /></label>
      <label className="relative flex min-w-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"><BookOpen className="h-4 w-4 shrink-0 text-slate-500" /><span className="sr-only">Filter classes</span><select value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setShowAll(false); }} className="h-10 min-w-0 w-full appearance-none bg-transparent pr-4 text-[11px] text-slate-700 outline-none dark:text-slate-200"><option value="All">All classes</option>{groups.map((group) => <option key={group.name} value={key(group.name)}>{group.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-slate-500" /></label>
    </div>

    <section><div className="mb-2 flex items-center justify-between"><div><h2 className="text-base font-bold">Class attendance</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">View and mark attendance for each class.</p></div>{summaries.length > 5 && <button type="button" onClick={() => setShowAll(!showAll)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">{showAll ? "Show less" : "View all"}</button>}</div>
      <div className="space-y-1.5">{shown.map((group, index) => <div key={group.name} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${["bg-blue-50 text-blue-600", "bg-emerald-50 text-emerald-600", "bg-violet-50 text-violet-600", "bg-amber-50 text-amber-600", "bg-rose-50 text-rose-600"][index % 5]}`}><BookOpen className="h-4 w-4" /></span><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{group.name}</strong><span className="block text-[10px] text-slate-500 dark:text-slate-400">{group.sections.size ? `${group.sections.size} sections` : "No sections"}</span></div><div className="w-20 shrink-0 sm:w-32"><div className="flex items-center justify-between gap-1 text-[10px]"><strong>{group.percent === null ? "—" : `${group.percent}%`}</strong><span className="text-slate-500 dark:text-slate-400">{group.attended}/{group.total}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${group.percent || 0}%` }} /></div></div><button type="button" onClick={() => openAttendance(group.name)} aria-label={`Mark attendance for ${group.name}`} className="rounded-lg bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">Mark</button><ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /></div>)}
        {!loading && !summaries.length && <p className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">No classes found for this school.</p>}
        {loading && <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-900">Loading attendance…</p>}
      </div>
    </section>
  </div>;
}
