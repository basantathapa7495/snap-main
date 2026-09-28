"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Edit3, KeyRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type ProfileTeacher = {
  id: string; school_id: string | null; name: string; subject: string | null;
  department: string | null; employee_id: string | null; left_at: string | null;
  phone: string | null; email: string | null; address: string | null;
  qualification: string | null; joining_date: string | null;
  employment_status: string | null; user_id: string | null;
  salary: number | string | null; created_at: string | null; date_of_birth: string | null;
};

type Attendance = { id: string; attendance_date: string; status: string; check_in: string | null; check_out: string | null };
type Leave = { id: string; leave_type: string; start_date: string; end_date: string; status: string; reason: string | null };
type Assignment = { id: string; class_name: string | null; subject: string | null; periods_per_week: number | null };
type Class = { id: string; class_name: string | null; name: string | null; class: string | null; section: string | null; section_name: string | null };
type Tab = "overview" | "attendance" | "classes" | "leave" | "account";

const displayDate = (date?: string | null) => date ? new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "Not added";
const nepalToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const label = (value?: string | null) => value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not added";

function Detail({ title, value }: { title: string; value?: string | null }) {
  return <div className="min-w-0 border-b border-slate-100 py-2.5 dark:border-slate-800"><dt className="text-xs text-slate-500 dark:text-slate-400">{title}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{value || "Not added"}</dd></div>;
}

export default function TeacherProfile({ teacher, onClose, onEdit, onToggleStatus, onMarkLeft, onLogin, onReassign }: {
  teacher: ProfileTeacher; onClose: () => void; onEdit: (teacher: ProfileTeacher) => void;
  onToggleStatus: (teacher: ProfileTeacher) => void; onMarkLeft: (teacher: ProfileTeacher) => void;
  onLogin: (teacher: ProfileTeacher) => void; onReassign: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [account, setAccount] = useState<{ email: string | null; lastLogin: string | null; suspended: boolean } | null>(null);
  const [loading, setLoading] = useState(Boolean(teacher.school_id));
  const [accountLoading, setAccountLoading] = useState(Boolean(teacher.user_id));
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (!teacher.school_id) return;
    let cancelled = false;
    async function load() {
      const schoolId = teacher.school_id!;
      const results = await Promise.all([
        supabase.from("teacher_attendance").select("id,attendance_date,status,check_in,check_out").eq("school_id", schoolId).eq("teacher_id", teacher.id).order("attendance_date", { ascending: false }).limit(365),
        supabase.from("teacher_leave_requests").select("id,leave_type,start_date,end_date,status,reason").eq("school_id", schoolId).eq("teacher_id", teacher.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("teacher_assignments").select("id,class_name,subject,periods_per_week").eq("school_id", schoolId).eq("teacher_id", teacher.id).eq("active", true),
        supabase.from("classes").select("id,class_name,name,class,section,section_name").eq("school_id", schoolId).eq("teacher_id", teacher.id),
      ]);
      if (cancelled) return;
      const failure = results.find((result) => result.error)?.error;
      if (failure) setError("Some profile sections could not be loaded. Please try again.");
      setAttendance((results[0].data || []) as Attendance[]);
      setLeaves((results[1].data || []) as Leave[]);
      setAssignments((results[2].data || []) as Assignment[]);
      setClasses((results[3].data || []) as Class[]);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [teacher.id, teacher.school_id]);

  useEffect(() => {
    if (!teacher.user_id) return;
    let cancelled = false;
    async function loadAccount() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (!cancelled) setAccountLoading(false); return; }
      const response = await fetch(`/api/teacher-profile-account?teacherId=${encodeURIComponent(teacher.id)}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!cancelled) {
        if (response.ok) setAccount(await response.json());
        setAccountLoading(false);
      }
    }
    void loadAccount();
    return () => { cancelled = true; };
  }, [teacher.id, teacher.user_id]);

  const today = nepalToday();
  const month = today.slice(0, 7);
  const monthly = attendance.filter((record) => record.attendance_date.startsWith(month));
  const marked = attendance.filter((record) => ["present", "late", "absent"].includes(record.status));
  const attended = marked.filter((record) => ["present", "late"].includes(record.status)).length;
  const attendanceRate = marked.length ? `${Math.round(attended / marked.length * 100)}%` : "—";
  const approvedLeaveDays = leaves.filter((leave) => leave.status === "approved").reduce((days, leave) => days + Math.max(0, Math.round((Date.parse(leave.end_date) - Date.parse(leave.start_date)) / 86400000) + 1), 0);
  const todayRecord = attendance.find((record) => record.attendance_date === today);
  const todayOnLeave = leaves.some((leave) => leave.status === "approved" && leave.start_date <= today && leave.end_date >= today);
  const todayStatus = todayRecord?.status || (todayOnLeave ? "leave" : "Not marked");
  const classRows = useMemo(() => {
    const rows = assignments.map((assignment) => ({ key: assignment.id, name: assignment.class_name || "Class not specified", subject: assignment.subject || teacher.subject || "Subject not specified", periods: assignment.periods_per_week }));
    for (const item of classes) {
      const name = [item.class_name || item.name || item.class || "Class", item.section || item.section_name].filter(Boolean).join(" ");
      if (!rows.some((row) => row.name === name && row.subject === (teacher.subject || "Subject not specified"))) rows.push({ key: item.id, name, subject: teacher.subject || "Subject not specified", periods: null });
    }
    return rows;
  }, [assignments, classes, teacher.subject]);

  async function updateAccess() {
    if (!teacher.user_id || !account) return;
    const action = account.suspended ? "restore" : "suspend";
    if (!window.confirm(action === "suspend" ? `Remove ${teacher.name}'s portal access? They will not be able to sign in until access is restored.` : `Restore portal access for ${teacher.name}?`)) return;
    setActionLoading(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in again to manage portal access.");
      const response = await fetch("/api/teacher-profile-account", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ teacherId: teacher.id, action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update portal access.");
      setAccount((current) => current ? { ...current, suspended: result.suspended } : current);
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Could not update portal access."); }
    finally { setActionLoading(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-0 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="teacher-profile-title" className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white text-slate-900 shadow-2xl dark:bg-slate-950 dark:text-white sm:h-auto sm:max-h-[92vh] sm:rounded-3xl">
      <div className="shrink-0 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-extrabold text-blue-700 dark:bg-blue-900 dark:text-blue-200" aria-label={`${teacher.name} avatar`}>{teacher.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
          <div className="min-w-0 flex-1"><h2 id="teacher-profile-title" className="truncate text-xl font-bold sm:text-2xl">{teacher.name}</h2><p className="text-sm text-slate-600 dark:text-slate-300">{teacher.subject ? `${teacher.subject} Teacher` : "Teacher"}{teacher.department ? ` · ${teacher.department}` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${teacher.left_at || teacher.employment_status === "inactive" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"}`}>{teacher.left_at ? "Left school" : label(teacher.employment_status || "active")}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-100">Today: {loading ? "Loading…" : label(todayStatus)}</span></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close teacher profile" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onEdit(teacher)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Edit3 className="h-4 w-4" /> Edit Profile</button>
          <details className="group relative"><summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700">Manage Teacher <ChevronDown className="h-4 w-4" /></summary>
            <div className="absolute left-0 top-full z-20 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button type="button" onClick={() => onEdit(teacher)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Change department</button>
              <button type="button" onClick={onReassign} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Transfer or reassign classes</button>
              <button type="button" onClick={() => { onClose(); onLogin(teacher); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{teacher.user_id ? "Reset teacher password" : "Create teacher login"}</button>
              {teacher.user_id && <button type="button" disabled={actionLoading || accountLoading || !account} onClick={updateAccess} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800">{account?.suspended ? "Restore portal access" : "Remove portal access"}</button>}
              {!teacher.left_at && <button type="button" onClick={() => { if (window.confirm(`${teacher.employment_status === "inactive" ? "Reactivate" : "Deactivate"} ${teacher.name}?`)) onToggleStatus(teacher); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{teacher.employment_status === "inactive" ? "Reactivate teacher" : "Deactivate teacher"}</button>}
              {teacher.left_at && <button type="button" onClick={() => { if (window.confirm(`Restore ${teacher.name} as an active teacher? Restore portal access separately in the Account tab if needed.`)) onToggleStatus(teacher); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Restore former teacher</button>}
              {!teacher.left_at && <button type="button" onClick={() => { if (window.confirm(`Mark ${teacher.name} as having left the school? Their record and history will be kept.`)) onMarkLeft(teacher); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-slate-800">Mark as left school</button>}
            </div>
          </details>
        </div>
      </div>
      <nav aria-label="Teacher profile sections" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 px-3 dark:border-slate-800 sm:px-6">{(["overview", "attendance", "classes", "leave", "account"] as const).map((item) => <button key={item} type="button" onClick={() => setTab(item)} aria-current={tab === item ? "page" : undefined} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold capitalize ${tab === item ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-slate-500 dark:text-slate-400"}`}>{item}</button>)}</nav>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pb-8 sm:p-6">
        {(error || !teacher.school_id) && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error || "School information is missing."}</p>}
        {tab === "overview" && <><div className="grid gap-5 md:grid-cols-2"><section><h3 className="text-base font-bold">Personal Information</h3><dl className="mt-2"><Detail title="Full name" value={teacher.name} /><Detail title="Phone" value={teacher.phone} /><Detail title="Email" value={teacher.email} /><Detail title="Address" value={teacher.address} /></dl></section><section><h3 className="text-base font-bold">Employment Details</h3><dl className="mt-2"><Detail title="Department" value={teacher.department} /><Detail title="Employee ID" value={teacher.employee_id} /><Detail title="Joining date" value={displayDate(teacher.joining_date)} /><Detail title="Qualification" value={teacher.qualification} />{teacher.left_at && <Detail title="Left school" value={displayDate(teacher.left_at)} />}</dl></section></div><section><h3 className="text-base font-bold">Quick Summary</h3><div className="mt-2 grid grid-cols-3 gap-2">{[["Attendance", loading ? "—" : attendanceRate],["Classes", loading ? "—" : String(classRows.length)],["Leave days", loading ? "—" : String(approvedLeaveDays)]].map(([title, value]) => <div key={title} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><p className="text-xs text-slate-500 dark:text-slate-400">{title}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Attendance uses recorded present, late and absent days; leave days count approved calendar dates.</p></section></>}
        {tab === "attendance" && <section><h3 className="text-base font-bold">Attendance</h3><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Today", loading ? "—" : label(todayStatus)],["This month", `${monthly.filter((r) => ["present", "late"].includes(r.status)).length} attended`],["Late arrivals", String(monthly.filter((r) => r.status === "late").length)],["Absences", String(monthly.filter((r) => r.status === "absent").length)]].map(([title, value]) => <div key={title} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">{title}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}</div><h4 className="mt-5 text-sm font-bold">Recent attendance</h4>{attendance.length ? <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">{attendance.slice(0, 30).map((row) => <div key={row.id} className="flex justify-between gap-3 py-2 text-sm"><span>{displayDate(row.attendance_date)}</span><span className="font-semibold">{label(row.status)}{row.check_in ? ` · ${row.check_in.slice(0, 5)}` : ""}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No attendance recorded for this teacher.</p>}</section>}
        {tab === "classes" && <section><h3 className="text-base font-bold">Assigned Classes</h3>{classRows.length ? <div className="mt-3 space-y-2">{classRows.map((row) => <div key={row.key} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><p className="text-sm font-semibold">{row.name} — {row.subject}</p>{row.periods != null && <p className="mt-1 text-xs text-slate-500">{row.periods} periods per week</p>}</div>)}</div> : <p className="mt-3 text-sm text-slate-500">No classes assigned yet.</p>}<button type="button" onClick={onReassign} className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-300">Manage class assignments</button></section>}
        {tab === "leave" && <section><h3 className="text-base font-bold">Leave History</h3><div className="mt-3 grid grid-cols-3 gap-2">{["pending", "approved", "rejected"].map((status) => <div key={status} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs capitalize text-slate-500">{status}</p><p className="mt-1 font-bold">{leaves.filter((leave) => leave.status === status).length}</p></div>)}</div>{leaves.length ? <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{leaves.map((leave) => <div key={leave.id} className="py-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{label(leave.leave_type)}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">{label(leave.status)}</span></div><p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{displayDate(leave.start_date)} – {displayDate(leave.end_date)}</p>{leave.reason && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{leave.reason}</p>}</div>)}</div> : <p className="mt-3 text-sm text-slate-500">No leave requests yet.</p>}</section>}
        {tab === "account" && <section><h3 className="text-base font-bold">Portal Account</h3><dl className="mt-2"><Detail title="Account status" value={!teacher.user_id ? "Not created" : accountLoading ? "Loading…" : !account ? "Unavailable" : account.suspended ? "Access removed" : "Active"} /><Detail title="Login email" value={account?.email || teacher.email} /><Detail title="Last login" value={!account && teacher.user_id ? "Unavailable" : account?.lastLogin ? new Date(account.lastLogin).toLocaleString() : "No login recorded"} /><Detail title="Access state" value={!teacher.user_id ? "No portal access" : !account ? "Unavailable" : account.suspended ? "Suspended" : "Allowed"} /></dl><button type="button" onClick={() => { onClose(); onLogin(teacher); }} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300"><KeyRound className="h-4 w-4" />{teacher.user_id ? "Reset password" : "Create login"}</button>{teacher.user_id && <button type="button" disabled={actionLoading || accountLoading || !account} onClick={updateAccess} className="ml-2 mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">{account?.suspended ? "Restore access" : "Remove access"}</button>}</section>}
      </div>
    </section>
  </div>;
}
