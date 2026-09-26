"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Loader2, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Status = "present" | "absent" | "leave" | "holiday";
type Teacher = {
  id: string;
  name: string;
  department?: string | null;
  subject: string | null;
  employment_status?: string | null;
};
type Attendance = { teacher_id: string; attendance_date: string; status: Status };
type Leave = { teacher_id: string; start_date: string; end_date: string };
const statuses: { value: Status; label: string; tone: string }[] = [
  { value: "present", label: "Present", tone: "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200" },
  { value: "absent", label: "Absent", tone: "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200" },
  { value: "leave", label: "Leave", tone: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" },
  { value: "holiday", label: "Holiday", tone: "border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200" },
];

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
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [saveRevision, setSaveRevision] = useState(0);
  const [monthlyTeacher, setMonthlyTeacher] = useState("");
  const [month, setMonth] = useState(() => todayInNepal().slice(0, 7));
  const [monthRows, setMonthRows] = useState<Attendance[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const activeTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.employment_status !== "inactive")
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
    savedByTeacher.get(teacherId) || (leaveIds.has(teacherId) ? "leave" : null);
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
    if (!editable || busy || busyTeacher || loading || loadFailed) return;
    setBusyTeacher(teacherId);
    setError("");
    setMessage("");
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
    const { error: saveError } = await supabase.from("teacher_attendance").upsert(
      activeTeachers.map((teacher) => ({
        school_id: schoolId, teacher_id: teacher.id, attendance_date: date,
        status: "present" as const, check_in: null, check_out: null,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "teacher_id,attendance_date" },
    );
    if (saveError) setError(saveError.message);
    else {
      setAttendance(activeTeachers.map((teacher) => ({
        teacher_id: teacher.id, attendance_date: date, status: "present",
      })));
      setMessage("All active teachers marked present. You can change individual statuses below.");
      onSaved();
      setSaveRevision((revision) => revision + 1);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Daily attendance</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tap a status to save it. Approved leave appears automatically.</p>
        </div>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Date
          <input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)}
            className="mt-1 block h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </label>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {([["Teachers", activeTeachers.length], ["Present", summary.present], ["Absent", summary.absent],
          ["Leave", summary.leave], ["Holiday", summary.holiday]] as const).map(([label, count]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2.5 text-center dark:border-slate-700 dark:bg-slate-800 sm:p-3">
            <p className="text-lg font-bold sm:text-xl">{loading ? "–" : count}</p>
            <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      {editable && (
        <button type="button" onClick={markAllPresent}
          disabled={loading || loadFailed || busy || Boolean(busyTeacher) || !activeTeachers.length}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Mark All Present
        </button>
      )}
      {!editable && <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><CalendarDays className="h-4 w-4" /> Viewing attendance history for {date}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">{message}</p>}

      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        {loading ? <p className="p-5 text-sm text-slate-500">Loading attendance…</p>
          : activeTeachers.length === 0 ? <p className="p-5 text-sm text-slate-500">No active teachers added yet.</p>
          : activeTeachers.map((teacher) => {
            const selected = statusFor(teacher.id);
            return (
              <div key={teacher.id} className="px-3 py-2.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-500/20 dark:text-teal-200">{initial(teacher.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{teacher.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{teacher.department || teacher.subject || "Teacher"}{selected === "leave" && leaveIds.has(teacher.id) && !savedByTeacher.has(teacher.id) ? " · Approved leave" : ""}</p>
                  </div>
                  {busyTeacher === teacher.id && <Loader2 className="ml-auto h-4 w-4 animate-spin text-teal-600" />}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 sm:mt-0 sm:w-[300px]">
                  {statuses.map(({ value, label, tone }) => (
                    <button key={value} type="button" aria-label={`Mark ${teacher.name} ${label}`}
                      aria-pressed={selected === value} onClick={() => void saveOne(teacher.id, value)}
                      disabled={!editable || loadFailed || busy || Boolean(busyTeacher)}
                      className={`min-h-10 rounded-lg border px-0.5 text-[10px] font-semibold transition sm:text-xs ${
                        selected === value ? tone : "border-slate-200 bg-white text-slate-600 hover:border-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      } disabled:cursor-default`}>
                      {selected === value && <Check className="mr-0.5 inline h-3 w-3" />}{label}
                    </button>
                  ))}
                </div>
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
