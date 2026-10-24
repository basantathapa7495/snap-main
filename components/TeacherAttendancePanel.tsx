"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, UserCheck, UserMinus, UserRound, Clock3 } from "lucide-react";
import TeacherAvatar from "@/components/TeacherAvatar";
import { supabase } from "@/lib/supabase";

type Status = "present" | "absent" | "leave" | "holiday";
type Teacher = {
  id: string;
  name: string;
  department?: string | null;
  subject: string | null;
  employment_status?: string | null;
  left_at?: string | null;
  avatar_path?: string | null;
};
type Attendance = { teacher_id: string; attendance_date: string; status: Status };
type Leave = { teacher_id: string; start_date: string; end_date: string };
const statuses = ["present", "absent", "leave"] as const;
// Use the school's local day, including around midnight in Nepal.
function todayInNepal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

export default function TeacherAttendancePanel({ schoolId, teachers, avatarScope, onSaved }: {
  schoolId: string; teachers: Teacher[]; avatarScope: string; onSaved: () => void;
}) {
  const [today, setToday] = useState(todayInNepal);
  const [date, setDate] = useState(todayInNepal);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyTeacher, setBusyTeacher] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [saveRevision, setSaveRevision] = useState(0);
  const [monthlyTeacher, setMonthlyTeacher] = useState("");
  const [month, setMonth] = useState(() => todayInNepal().slice(0, 7));
  const [monthRows, setMonthRows] = useState<Attendance[]>([]);
  const [monthLeaves, setMonthLeaves] = useState<Leave[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState("");

  const activeTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.employment_status !== "inactive" && !teacher.left_at)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [teachers],
  );
  const visibleTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activeTeachers;
    return activeTeachers.filter((teacher) =>
      [teacher.name, teacher.subject, teacher.department].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    );
  }, [activeTeachers, search]);
  const selectedTeacher = activeTeachers.find((teacher) => teacher.id === monthlyTeacher);
  const selectedMonthTeacherId = selectedTeacher?.id || activeTeachers[0]?.id || "";

  const loadDate = useCallback(async () => {
    setLoading(true);
    setError("");
    setLoadFailed(false);
    const [saved, approved] = await Promise.all([
      supabase.from("teacher_attendance").select("teacher_id,attendance_date,status")
        .eq("school_id", schoolId).eq("attendance_date", date),
      supabase.from("teacher_leave_requests").select("teacher_id,start_date,end_date")
        .eq("school_id", schoolId).eq("status", "approved")
        .lte("start_date", date).gte("end_date", date),
    ]);
    if (saved.error || approved.error) {
      setError(saved.error?.message || approved.error?.message || "Attendance could not be loaded.");
      setLoadFailed(true);
      setAttendance([]);
      setLeaves([]);
    } else {
      setAttendance((saved.data || []) as Attendance[]);
      setLeaves((approved.data || []) as Leave[]);
    }
    setLoading(false);
  }, [date, schoolId]);

  useEffect(() => {
    let cancelled = false;
    const id = window.setInterval(() => {
      const current = todayInNepal();
      if (!cancelled) setToday(current);
    }, 60_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);
  // The request begins when the selected date or school changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadDate(); }, [loadDate]);

  useEffect(() => {
    if (!selectedMonthTeacherId || !/^\d{4}-\d{2}$/.test(month)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMonthRows([]);
      setMonthLeaves([]);
      return;
    }
    let cancelled = false;
    setMonthLoading(true);
    setMonthError("");
    const start = `${month}-01`;
    const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1))
      .toISOString().slice(0, 10);
    Promise.all([
      supabase.from("teacher_attendance").select("teacher_id,attendance_date,status")
        .eq("school_id", schoolId).eq("teacher_id", selectedMonthTeacherId)
        .gte("attendance_date", start).lt("attendance_date", end),
      supabase.from("teacher_leave_requests").select("teacher_id,start_date,end_date")
        .eq("school_id", schoolId).eq("teacher_id", selectedMonthTeacherId).eq("status", "approved")
        .lt("start_date", end).gte("end_date", start),
    ]).then(([saved, approved]) => {
        if (cancelled) return;
        setMonthRows(saved.error || approved.error ? [] : (saved.data || []) as Attendance[]);
        setMonthLeaves(saved.error || approved.error ? [] : (approved.data || []) as Leave[]);
        setMonthError(saved.error?.message || approved.error?.message || "");
        setMonthLoading(false);
      });
    return () => { cancelled = true; };
  }, [month, schoolId, selectedMonthTeacherId, saveRevision]);

  const leaveIds = useMemo(() => new Set(leaves.map((leave) => leave.teacher_id)), [leaves]);
  const savedByTeacher = useMemo(
    () => new Map(attendance.map((row) => [row.teacher_id, row.status])),
    [attendance],
  );
  const statusFor = (teacherId: string): Status | null =>
    leaveIds.has(teacherId) ? "leave" : savedByTeacher.get(teacherId) || null;
  const summary = {
    present: activeTeachers.filter((teacher) => statusFor(teacher.id) === "present").length,
    absent: activeTeachers.filter((teacher) => statusFor(teacher.id) === "absent").length,
    leave: activeTeachers.filter((teacher) => statusFor(teacher.id) === "leave").length,
    holiday: activeTeachers.filter((teacher) => statusFor(teacher.id) === "holiday").length,
  };
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const monthStatuses = new Map(monthRows.map((row) => [row.attendance_date, row.status]));
  const statusOnDay = (day: number): Status | null => {
    const dayDate = `${month}-${String(day).padStart(2, "0")}`;
    if (monthLeaves.some((leave) => leave.start_date <= dayDate && leave.end_date >= dayDate)) return "leave";
    return monthStatuses.get(dayDate) || null;
  };
  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, status: statusOnDay(index + 1) }));
  const counts = {
    present: calendarDays.filter(({ status }) => status === "present").length,
    absent: calendarDays.filter(({ status }) => status === "absent").length,
    leave: calendarDays.filter(({ status }) => status === "leave").length,
  };
  const recordedWorkdays = counts.present + counts.absent + counts.leave;
  const percentage = recordedWorkdays ? Math.round(counts.present / recordedWorkdays * 100) : null;
  const editable = date === today;
  function moveMonth(offset: number) {
    const next = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
    setMonth(next.toISOString().slice(0, 7));
  }

  async function saveOne(teacherId: string, status: Status) {
    if (!editable || busy || busyTeacher || loading || loadFailed || leaveIds.has(teacherId)) return;
    setBusyTeacher(teacherId);
    setError("");
    setMessage("");
    const approved = await supabase.from("teacher_leave_requests").select("teacher_id,start_date,end_date")
      .eq("school_id", schoolId).eq("teacher_id", teacherId).eq("status", "approved")
      .lte("start_date", date).gte("end_date", date);
    if (approved.error || approved.data?.length) {
      if (approved.data?.length) {
        setLeaves((current) => [...current.filter((row) => row.teacher_id !== teacherId), ...(approved.data as Leave[])]);
        setError("This teacher has approved leave for the selected date.");
      } else setError(approved.error?.message || "Approved leave could not be checked.");
      setBusyTeacher(null);
      return;
    }
    const { error: saveError } = await supabase.from("teacher_attendance").upsert({
      school_id: schoolId, teacher_id: teacherId, attendance_date: date, status,
      check_in: null, check_out: null, updated_at: new Date().toISOString(),
    }, { onConflict: "teacher_id,attendance_date" });
    if (saveError) setError(saveError.message);
    else {
      setAttendance((current) => [
        ...current.filter((row) => row.teacher_id !== teacherId),
        { teacher_id: teacherId, attendance_date: date, status },
      ]);
      onSaved();
      setSaveRevision((revision) => revision + 1);
    }
    setBusyTeacher(null);
  }

  async function markAllPresent() {
    if (!editable || !activeTeachers.length || busy || busyTeacher || loading || loadFailed) return;
    setBusy(true);
    setError("");
    setMessage("");
    // Refresh approved leave at the point of saving, since approvals may have changed
    // while the principal had this page open.
    const approved = await supabase.from("teacher_leave_requests").select("teacher_id,start_date,end_date")
      .eq("school_id", schoolId).eq("status", "approved")
      .lte("start_date", date).gte("end_date", date);
    if (approved.error) {
      setError(approved.error.message);
      setBusy(false);
      return;
    }
    const currentLeaves = (approved.data || []) as Leave[];
    const approvedIds = new Set(currentLeaves.map((leave) => leave.teacher_id));
    setLeaves(currentLeaves);
    const eligible = activeTeachers.filter((teacher) => !approvedIds.has(teacher.id));
    if (!eligible.length) {
      setMessage("All teachers have approved leave for this date.");
      setBusy(false);
      return;
    }
    const { error: saveError } = await supabase.from("teacher_attendance").upsert(
      eligible.map((teacher) => ({
        school_id: schoolId, teacher_id: teacher.id, attendance_date: date,
        status: "present" as const, check_in: null, check_out: null,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "teacher_id,attendance_date" },
    );
    if (saveError) setError(saveError.message);
    else {
      setAttendance((current) => [
        ...current.filter((row) => approvedIds.has(row.teacher_id)),
        ...eligible.map((teacher) => ({
        teacher_id: teacher.id, attendance_date: date, status: "present",
        } as Attendance)),
      ]);
      setMessage(`${eligible.length} teachers marked present. Approved leave was kept. You can change individual statuses below.`);
      onSaved();
      setSaveRevision((revision) => revision + 1);
    }
    setBusy(false);
  }

  const displayDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

  return (
    <div className="space-y-4 pb-8 text-slate-900 dark:text-slate-100 sm:space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold tracking-tight sm:text-3xl">Daily attendance</h3>
          </div>
          <label className="relative flex h-9 w-[145px] shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white min-[380px]:w-[160px] min-[380px]:text-[11px] sm:h-10 sm:w-auto sm:gap-2 sm:px-3 sm:text-sm">
            <CalendarDays className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate">{date === today ? `Today · ${displayDate}` : displayDate}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            <input aria-label="Attendance date" type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(102px,1.55fr)_repeat(4,minmax(42px,.65fr))] gap-1.5 sm:grid-cols-[minmax(220px,1.45fr)_repeat(4,minmax(100px,.55fr))] sm:gap-3">
          {editable && <button type="button" onClick={markAllPresent} disabled={loading || loadFailed || busy || Boolean(busyTeacher) || !activeTeachers.length} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-1.5 text-[10px] font-extrabold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-500/15 dark:text-blue-200 min-[380px]:text-[11px] sm:gap-2 sm:px-3 sm:text-sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" /> : <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />} <span className="whitespace-nowrap">Mark All Present</span>
          </button>}
          {([ ["Total", activeTeachers.length, "text-slate-950 dark:text-white"], ["Present", summary.present, "text-emerald-700 dark:text-emerald-300"], ["Absent", summary.absent, "text-rose-700 dark:text-rose-300"], ["Leave", summary.leave, "text-amber-700 dark:text-amber-300"] ] as const).map(([label, count, tone]) => <div key={label} className="flex min-h-10 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-1 py-1 text-center dark:border-slate-700 dark:bg-slate-800"><p className="text-[9px] font-semibold leading-none text-slate-500 sm:text-[11px]">{label}</p><p className={`mt-0.5 text-base font-extrabold leading-none sm:text-lg ${tone}`}>{loading ? "–" : count}</p></div>)}
        </div>

        {!editable && <p className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><CalendarDays className="h-4 w-4" /> Viewing attendance history for {displayDate}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">{message}</p>}

        <label className="relative mt-3 block">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teacher..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-blue-900/40 sm:h-11 sm:text-base" />
        </label>

        <div className="mt-3 space-y-2">
          {loading ? <p className="p-5 text-sm text-slate-500">Loading attendance…</p> : activeTeachers.length === 0 ? <p className="p-5 text-sm text-slate-500">No active teachers added yet.</p> : visibleTeachers.length === 0 ? <p className="p-5 text-center text-sm text-slate-500">No matching teachers.</p> : visibleTeachers.map((teacher) => {
            const selected = statusFor(teacher.id);
            const locked = !editable || loadFailed || busy || Boolean(busyTeacher) || leaveIds.has(teacher.id);
            return <article key={teacher.id} className="grid grid-cols-[minmax(0,.9fr)_minmax(168px,1.1fr)] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-[minmax(220px,1fr)_minmax(360px,1.25fr)] sm:gap-3 sm:px-4 sm:py-2">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <TeacherAvatar name={teacher.name} path={teacher.avatar_path} scope={avatarScope} className="h-9 w-9 rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200 sm:h-10 sm:w-10 sm:text-xs" />
                <div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-950 dark:text-white sm:text-base">{teacher.name}</p><p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{teacher.subject || teacher.department || "Teacher"}{leaveIds.has(teacher.id) ? " · Approved leave" : ""}</p></div>
                {busyTeacher === teacher.id && <Loader2 className="ml-auto h-4 w-4 animate-spin text-blue-600" />}
              </div>
              <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2" aria-label={`Attendance options for ${teacher.name}`}>
                {statuses.map((value) => {
                  const active = selected === value;
                  const Icon = value === "present" ? (active ? Check : UserRound) : value === "absent" ? UserMinus : Clock3;
                  const activeClass = value === "present" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200" : value === "absent" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-500/20 dark:text-rose-200" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-500/20 dark:text-amber-200";
                  return <button key={value} type="button" onClick={() => void saveOne(teacher.id, value)} disabled={locked} aria-pressed={active} className={`flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-lg border px-1 text-[10px] font-bold capitalize transition disabled:cursor-default min-[380px]:text-[11px] sm:min-h-10 sm:gap-1.5 sm:px-1.5 sm:text-sm ${active ? activeClass : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}><Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />{value}</button>;
                })}
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="bg-white pt-3 dark:bg-slate-900 sm:pt-5">
        <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">Monthly attendance</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Select a teacher and month to see recorded days.</p>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <select aria-label="Teacher for monthly attendance" value={selectedMonthTeacherId}
            onChange={(event) => setMonthlyTeacher(event.target.value)}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:px-3 sm:text-sm">
            {!activeTeachers.length && <option value="">No teachers</option>}
            {activeTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
          <input aria-label="Month for attendance" type="month" value={month} max={today.slice(0, 7)}
            onChange={(event) => setMonth(event.target.value)}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:px-3 sm:text-sm" />
        </div>
        {monthError && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">Monthly attendance could not be loaded: {monthError}</p>}
        <div className="mt-4 grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)] gap-1.5 sm:gap-3" aria-label="Monthly attendance summary">
          {([
            ["Present", counts.present, "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"],
            ["Absent", counts.absent, "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"],
            ["Leave", counts.leave, "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"],
            ["Attendance Rate", percentage === null ? "—" : `${percentage}%`, "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"],
          ] as const).map(([label, value, tone]) => (
            <div key={label} className={`min-w-0 rounded-xl px-1.5 py-1.5 sm:px-4 sm:py-2 ${tone}`}>
              <div className="flex items-center gap-1">
                {label === "Attendance Rate" && <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true"><rect x="2" y="11" width="4" height="7" rx="1" /><rect x="8" y="7" width="4" height="11" rx="1" /><rect x="14" y="2" width="4" height="16" rx="1" /></svg>}
                <p className="text-base font-extrabold text-slate-950 dark:text-white sm:text-2xl">{monthLoading ? "–" : value}</p>
              </div>
              <p className="mt-0.5 whitespace-nowrap text-[8px] leading-tight sm:text-xs">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-2 sm:p-2">
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"><ChevronLeft className="h-5 w-5" /></button>
            <h4 className="text-center text-sm font-bold sm:text-lg">{monthLabel}</h4>
            <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} disabled={month >= today.slice(0, 7)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-35 dark:bg-slate-800 dark:text-slate-200"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[11px] text-slate-500 dark:text-slate-400 sm:text-sm">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-y-1.5 sm:gap-y-3" aria-label={`${monthLabel} attendance calendar`}>
            {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
            {calendarDays.map(({ day, status }) => (
              <div key={day} className="flex justify-center">
                <span title={`${monthLabel} ${day}: ${monthLoading || monthError ? "Loading" : status || "No record"}`} aria-label={`${monthLabel} ${day}: ${monthLoading || monthError ? "Unavailable" : status || "No record"}`} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold sm:h-10 sm:w-10 sm:text-sm ${!monthLoading && !monthError && status === "present" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200" : !monthLoading && !monthError && status === "absent" ? "bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200" : !monthLoading && !monthError && status === "leave" ? "bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-violet-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{day}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-1 overflow-x-auto whitespace-nowrap text-[9px] text-slate-600 dark:text-slate-300 sm:text-xs">
            {([["Present", "bg-emerald-500"], ["Absent", "bg-rose-500"], ["Leave", "bg-violet-500"], ["No record / holiday", "bg-slate-300 dark:bg-slate-600"]] as const).map(([label, color]) => <span key={label} className="inline-flex shrink-0 items-center gap-1"><span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />{label}</span>)}
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 p-3 text-xs dark:bg-blue-500/10 sm:p-4 sm:text-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true"><rect x="2" y="11" width="4" height="7" rx="1" /><rect x="8" y="7" width="4" height="11" rx="1" /><rect x="14" y="2" width="4" height="16" rx="1" /></svg>
            <div><p className="font-bold text-slate-950 dark:text-white">{monthLoading || monthError ? "—" : `${counts.present} of ${recordedWorkdays}`} recorded workdays present</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Rate = present ÷ recorded workdays (excluding holidays and unmarked days).</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}

