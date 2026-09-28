"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Loader2, UserCheck, UsersRound, UserRound, UserX, Clock3 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Status = "present" | "absent" | "leave" | "holiday";
type Teacher = {
  id: string;
  name: string;
  department?: string | null;
  subject: string | null;
  employment_status?: string | null;
  left_at?: string | null;
};
type Attendance = { teacher_id: string; attendance_date: string; status: Status };
type Leave = { teacher_id: string; start_date: string; end_date: string };
const statuses = ["present", "absent", "leave"] as const;
const statusTone: Record<Status, string> = {
  present: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  absent: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  leave: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  holiday: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
};

// Use the school's local day, including around midnight in Nepal.
function todayInNepal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function initial(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

export default function TeacherAttendancePanel({ schoolId, teachers, onSaved }: {
  schoolId: string; teachers: Teacher[]; onSaved: () => void;
}) {
  const [today, setToday] = useState(todayInNepal);
  const [date, setDate] = useState(todayInNepal);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyTeacher, setBusyTeacher] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [saveRevision, setSaveRevision] = useState(0);
  const [monthlyTeacher, setMonthlyTeacher] = useState("");
  const [month, setMonth] = useState(() => todayInNepal().slice(0, 7));
  const [monthRows, setMonthRows] = useState<Attendance[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const activeTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.employment_status !== "inactive" && !teacher.left_at)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [teachers],
  );
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
      return;
    }
    let cancelled = false;
    setMonthLoading(true);
    const start = `${month}-01`;
    const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1))
      .toISOString().slice(0, 10);
    supabase.from("teacher_attendance").select("teacher_id,attendance_date,status")
      .eq("school_id", schoolId).eq("teacher_id", selectedMonthTeacherId)
      .gte("attendance_date", start).lt("attendance_date", end)
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        setMonthRows(queryError ? [] : (data || []) as Attendance[]);
        if (queryError) setError(queryError.message);
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
  const counts = {
    present: monthRows.filter((row) => row.status === "present").length,
    absent: monthRows.filter((row) => row.status === "absent").length,
    leave: monthRows.filter((row) => row.status === "leave").length,
    holiday: monthRows.filter((row) => row.status === "holiday").length,
  };
  const recordedWorkdays = counts.present + counts.absent + counts.leave;
  const percentage = recordedWorkdays ? Math.round(counts.present / recordedWorkdays * 100) : null;
  const editable = date === today;

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
        setEditingTeacher(null);
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
      setEditingTeacher(null);
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

  return (
    <div className="space-y-4 pb-8 text-slate-900 dark:text-slate-100 sm:space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">Daily attendance</h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">Tap a status to save it. Approved leave appears automatically.</p>
        </div>
        <label className="w-[136px] shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300 sm:w-[180px]">
          Date
          <input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)}
            className="mt-1 block h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-1 text-[11px] text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:px-3 sm:text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-[1.45fr_repeat(3,minmax(0,1fr))] gap-1.5 sm:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))] sm:gap-3" aria-label="Daily attendance summary">
        {([
          ["Total Teachers", activeTeachers.length, UsersRound, "border-blue-100 bg-blue-50/70 text-blue-600 dark:border-blue-900 dark:bg-blue-500/10"],
          ["Present", summary.present, UserRound, "border-emerald-100 bg-emerald-50/70 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-500/10"],
          ["Absent", summary.absent, UserX, "border-rose-100 bg-rose-50/70 text-rose-600 dark:border-rose-900 dark:bg-rose-500/10"],
          ["Leave", summary.leave, Clock3, "border-amber-100 bg-amber-50/70 text-amber-600 dark:border-amber-900 dark:bg-amber-500/10"],
        ] as const).map(([label, count, Icon, tone]) => (
          <div key={label} className={`min-w-0 rounded-xl border px-1.5 py-1.5 sm:px-4 sm:py-2 ${tone}`}>
            <div className="flex items-center justify-between gap-0.5"><p className="text-lg font-extrabold leading-none text-slate-950 dark:text-white sm:text-2xl">{loading ? "–" : count}</p><Icon className="h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" /></div>
            <p className="mt-1 whitespace-nowrap text-[9px] leading-tight font-medium text-slate-600 dark:text-slate-300 min-[380px]:text-[10px] sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      {editable && (
        <button type="button" onClick={markAllPresent}
          disabled={loading || loadFailed || busy || Boolean(busyTeacher) || !activeTeachers.length}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500 sm:min-h-12">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Mark All Present
        </button>
      )}
      {!editable && <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><CalendarDays className="h-4 w-4" /> Viewing attendance history for {date}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">{message}</p>}

      <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        {loading ? <p className="p-5 text-sm text-slate-500">Loading attendance…</p>
          : activeTeachers.length === 0 ? <p className="p-5 text-sm text-slate-500">No active teachers added yet.</p>
          : activeTeachers.map((teacher) => {
            const selected = statusFor(teacher.id);
            return (
              <div key={teacher.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60 sm:px-4">
                <button type="button" onClick={() => setEditingTeacher((current) => current === teacher.id ? null : teacher.id)} disabled={!editable || loadFailed || busy || Boolean(busyTeacher) || leaveIds.has(teacher.id)} aria-expanded={editingTeacher === teacher.id} aria-label={`Change attendance for ${teacher.name}`} className="flex w-full min-w-0 items-center gap-2.5 text-left disabled:cursor-default">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-500/20 dark:text-blue-200">{initial(teacher.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{teacher.name}</p>
                    <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><span className="truncate">{teacher.subject || teacher.department || "Teacher"}</span>{leaveIds.has(teacher.id) && <span className="shrink-0 text-[11px] font-medium text-amber-700 dark:text-amber-300">Approved leave</span>}</p>
                  </div>
                  {busyTeacher === teacher.id && <Loader2 className="ml-auto h-4 w-4 animate-spin text-teal-600" />}
                  <span className={`ml-auto inline-flex min-w-[68px] shrink-0 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-bold sm:min-w-[90px] sm:text-xs ${selected ? statusTone[selected] : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{selected ? selected[0].toUpperCase() + selected.slice(1) : "Unmarked"}</span>
                  {!leaveIds.has(teacher.id) && editable && <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition ${editingTeacher === teacher.id ? "rotate-90" : ""}`} aria-hidden="true" />}
                </button>
                {editingTeacher === teacher.id && editable && !leaveIds.has(teacher.id) && <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 dark:border-slate-700" aria-label={`Attendance options for ${teacher.name}`}>
                  {statuses.map((value) => <button key={value} type="button" onClick={() => void saveOne(teacher.id, value)} disabled={Boolean(busyTeacher) || busy} aria-pressed={selected === value} className={`min-h-10 rounded-lg px-2 text-xs font-semibold ${selected === value ? statusTone[value] : "bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>{value[0].toUpperCase() + value.slice(1)}</button>)}
                </div>}
              </div>
            );
          })}
      </div>

      <section className="border-t border-slate-200 pt-5 dark:border-slate-700">
        <h3 className="font-bold">Monthly attendance</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Select a teacher and month to see recorded days.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select aria-label="Teacher for monthly attendance" value={selectedMonthTeacherId}
            onChange={(event) => setMonthlyTeacher(event.target.value)}
            className="h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            {!activeTeachers.length && <option value="">No teachers</option>}
            {activeTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
          <input aria-label="Month for attendance" type="month" value={month} max={today.slice(0, 7)}
            onChange={(event) => setMonth(event.target.value)}
            className="h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5 text-center sm:gap-2">
          {([["Present", counts.present], ["Absent", counts.absent], ["Leave", counts.leave],
            ["Holiday", counts.holiday], ["Rate", percentage === null ? "—" : `${percentage}%`]] as const).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-1 py-2.5 dark:bg-slate-800">
              <p className="text-sm font-bold sm:text-lg">{monthLoading ? "–" : value}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Rate = present ÷ recorded workdays (present, absent, leave). Holidays and unmarked days are excluded.
        </p>
      </section>
    </div>
  );
}
