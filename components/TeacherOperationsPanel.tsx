"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Banknote, BookOpen,
  CalendarDays, Check, Clock3, Download, FileText, Gift, LayoutDashboard,
  Loader2, Plus, Search, ShieldCheck, Star, Upload, UserCheck, UserMinus,
  UsersRound, X,
} from "lucide-react";
import AccountRequestsPanel from "@/components/AccountRequestsPanel";
import { supabase } from "@/lib/supabase";

export type TeacherOperationsTeacher = {
  id: string;
  name: string;
  subject: string | null;
  department?: string | null;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  joining_date?: string | null;
  date_of_birth?: string | null;
  employment_status?: string | null;
  salary: number | string | null;
  user_id: string | null;
};

type Row = Record<string, any>;
type Tab = "overview" | "attendance" | "leave" | "assignments" | "timetable" | "performance" | "payroll" | "documents" | "activity";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "attendance", label: "Attendance", icon: UserCheck },
  { id: "leave", label: "Leave", icon: CalendarDays },
  { id: "assignments", label: "Classes", icon: BookOpen },
  { id: "timetable", label: "Timetable", icon: Clock3 },
  { id: "performance", label: "Performance", icon: Star },
  { id: "payroll", label: "Payroll", icon: Banknote },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
];

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 7)}-01`;
const teacherName = (teachers: TeacherOperationsTeacher[], id: string) => teachers.find((teacher) => teacher.id === id)?.name || "Unknown teacher";

export default function TeacherOperationsPanel({ schoolId, teachers, onTeacherChanged }: { schoolId: string; teachers: TeacherOperationsTeacher[]; onTeacherChanged: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [rows, setRows] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [accountRequestCount, setAccountRequestCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const tables = ["teacher_attendance", "teacher_leave_requests", "teacher_assignments", "teacher_timetable_entries", "teacher_performance", "teacher_payroll", "teacher_documents", "teacher_tasks", "activity_logs", "classes"];
      const results = await Promise.all(tables.map((name) => supabase.from(name).select("*").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(250)));
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch("/api/account-requests?role=teacher", { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.ok) {
          const payload = await response.json();
          setAccountRequestCount((payload.requests || []).filter((request: Row) => request.status === "pending").length);
        }
      }
      if (cancelled) return;
      const next: Record<string, Row[]> = {};
      results.forEach((result, index) => { next[tables[index]] = result.data || []; });
      const firstError = results.find((result) => result.error)?.error;
      if (firstError) setError(firstError.message);
      setRows(next);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [schoolId, refresh]);

  const attendance = rows.teacher_attendance || [];
  const leaves = rows.teacher_leave_requests || [];
  const assignments = rows.teacher_assignments || [];
  const timetable = rows.teacher_timetable_entries || [];
  const performance = rows.teacher_performance || [];
  const payroll = rows.teacher_payroll || [];
  const documents = rows.teacher_documents || [];
  const tasks = rows.teacher_tasks || [];
  const activities = rows.activity_logs || [];
  const todayAttendance = attendance.filter((row) => row.attendance_date === today());
  const birthdayCount = useMemo(() => {
    const now = new Date();
    const end = new Date(now); end.setDate(end.getDate() + 30);
    return teachers.filter((teacher) => {
      if (!teacher.date_of_birth) return false;
      const dob = new Date(teacher.date_of_birth); const candidate = new Date(now.getFullYear(), dob.getUTCMonth(), dob.getUTCDate());
      if (candidate < now) candidate.setFullYear(now.getFullYear() + 1);
      return candidate <= end;
    }).length;
  }, [teachers]);

  function flash(text: string) { setMessage(text); setError(""); window.setTimeout(() => setMessage(""), 3000); }
  async function run(action: () => Promise<{ error: any }>, success: string) {
    setWorking(true); setError("");
    const result = await action();
    setWorking(false);
    if (result.error) { setError(result.error.message); return false; }
    flash(success); setRefresh((value) => value + 1); return true;
  }

  const stats = [
    ["Total teachers", teachers.length, UsersRound, "blue"],
    ["Present today", todayAttendance.filter((r) => r.status === "present").length, UserCheck, "emerald"],
    ["Absent today", todayAttendance.filter((r) => r.status === "absent").length, UserMinus, "rose"],
    ["On leave", todayAttendance.filter((r) => r.status === "leave").length, CalendarDays, "amber"],
    ["Classes assigned", assignments.filter((r) => r.active).length, BookOpen, "violet"],
    ["Pending tasks", tasks.filter((r) => r.status === "pending").length, Check, "cyan"],
    ["Birthdays soon", birthdayCount, Gift, "pink"],
    ["New teacher requests", accountRequestCount, ShieldCheck, "orange"],
  ] as const;

  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/5">
      <div className="border-b border-slate-200 px-4 pt-4 sm:px-5">
        <div className="flex items-center justify-between gap-3 pb-4">
          <div><h2 className="text-lg font-extrabold text-slate-950">Teacher operations</h2><p className="mt-1 text-xs text-slate-500">Attendance, workload, approvals and staff records in one place.</p></div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide" role="tablist" aria-label="Teacher operations">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition sm:text-sm ${tab === id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>
      </div>

      {(error || message) && <div className={`m-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}<span>{error || message}</span><button className="ml-auto" onClick={() => { setError(""); setMessage(""); }}><X className="h-4 w-4" /></button></div>}

      <div className="p-4 sm:p-5">
        {tab === "overview" && <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([label, value, Icon, tone]) => <Metric key={label} label={label} value={value} icon={Icon} tone={tone} />)}</div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Upcoming birthdays" subtitle="Next 30 days"><BirthdayList teachers={teachers} /></Panel>
            <Panel title="Pending work" subtitle="Tasks and approvals that need attention"><div className="space-y-2"><SummaryLine label="Teacher account requests" value="Review below" /><SummaryLine label="Leave requests" value={String(leaves.filter((r) => r.status === "pending").length)} /><SummaryLine label="Timetable changes" value={String(timetable.filter((r) => r.status === "change_requested").length)} /><SummaryLine label="Payroll drafts" value={String(payroll.filter((r) => r.status === "draft").length)} /></div></Panel>
          </div>
          <AccountRequestsPanel role="teacher" onApproved={() => { onTeacherChanged(); setRefresh((value) => value + 1); }} />
        </div>}
        {tab === "attendance" && <AttendancePanel teachers={teachers} rows={attendance} date={attendanceDate} setDate={setAttendanceDate} working={working} run={run} schoolId={schoolId} />}
        {tab === "leave" && <LeavePanel teachers={teachers} rows={leaves} working={working} run={run} />}
        {tab === "assignments" && <AssignmentsPanel schoolId={schoolId} teachers={teachers} rows={assignments} classes={rows.classes || []} working={working} run={run} />}
        {tab === "timetable" && <TimetablePanel schoolId={schoolId} teachers={teachers} rows={timetable} working={working} run={run} />}
        {tab === "performance" && <PerformancePanel schoolId={schoolId} teachers={teachers} rows={performance} working={working} run={run} />}
        {tab === "payroll" && <PayrollPanel schoolId={schoolId} teachers={teachers} rows={payroll} working={working} run={run} />}
        {tab === "documents" && <DocumentsPanel schoolId={schoolId} teachers={teachers} rows={documents} working={working} setWorking={setWorking} flash={flash} setError={setError} refresh={() => setRefresh((v) => v + 1)} />}
        {tab === "activity" && <ActivityPanel teachers={teachers} rows={activities} />}
      </div>
    </section>
  );
}

const toneMap: Record<string, string> = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", rose: "bg-rose-50 text-rose-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700", cyan: "bg-cyan-50 text-cyan-700", pink: "bg-pink-50 text-pink-700", orange: "bg-orange-50 text-orange-700" };
function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ElementType; tone: string }) { return <article className="rounded-2xl border border-slate-200 p-3.5"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneMap[tone]}`}><Icon className="h-4 w-4" /></div><p className="mt-3 text-2xl font-black text-slate-950">{value}</p><p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p></article>; }
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-950">{title}</h3>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}<div className="mt-4">{children}</div></div>; }
function SummaryLine({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm"><span className="font-medium text-slate-600">{label}</span><span className="font-bold text-slate-950">{value}</span></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{text}</div>; }
const input = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const button = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50";

function BirthdayList({ teachers }: { teachers: TeacherOperationsTeacher[] }) {
  const list = teachers.filter((t) => t.date_of_birth).sort((a, b) => (a.date_of_birth || "").localeCompare(b.date_of_birth || "")).slice(0, 5);
  if (!list.length) return <Empty text="Add dates of birth to see upcoming birthdays." />;
  return <div className="space-y-2">{list.map((teacher) => <SummaryLine key={teacher.id} label={teacher.name} value={new Date(teacher.date_of_birth!).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />)}</div>;
}

function AttendancePanel({ teachers, rows, date, setDate, working, run, schoolId }: any) {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || ""); const [status, setStatus] = useState("present"); const [checkIn, setCheckIn] = useState("10:00"); const [checkOut, setCheckOut] = useState("16:00");
  const dayRows = rows.filter((r: Row) => r.attendance_date === date);
  async function save(e: React.FormEvent) { e.preventDefault(); await run(() => supabase.from("teacher_attendance").upsert({ school_id: schoolId, teacher_id: teacherId, attendance_date: date, status, check_in: status === "present" ? checkIn : null, check_out: status === "present" ? checkOut : null, updated_at: new Date().toISOString() }, { onConflict: "teacher_id,attendance_date" }), "Attendance saved."); }
  function exportCsv() { const content = ["Teacher,Date,Status,Check in,Check out", ...rows.map((r: Row) => [teacherName(teachers, r.teacher_id), r.attendance_date, r.status, r.check_in || "", r.check_out || ""].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: "text/csv" })); a.download = `teacher-attendance-${date}.csv`; a.click(); URL.revokeObjectURL(a.href); }
  return <div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><label className="text-xs font-bold text-slate-600">Attendance date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1 block`} /></label><button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" />Export report</button></div><form onSubmit={save} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-5"><select required value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={input}>{teachers.map((t: TeacherOperationsTeacher) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} className={input}><option value="present">Present</option><option value="absent">Absent</option><option value="leave">On leave</option></select><input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} disabled={status !== "present"} className={input} /><input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} disabled={status !== "present"} className={input} /><button disabled={working || !teacherId} className={button}>Save</button></form><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{dayRows.map((row: Row) => <div key={row.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="font-bold text-slate-900">{teacherName(teachers, row.teacher_id)}</p><Status value={row.status} /></div><p className="mt-2 text-xs text-slate-500">{row.check_in || "—"} to {row.check_out || "—"}{row.check_in > "10:15" ? " · Late arrival" : ""}{row.check_out && row.check_out < "16:00" ? " · Early departure" : ""}</p></div>)}{!dayRows.length && <Empty text="No attendance recorded for this date." />}</div></div>;
}

function LeavePanel({ teachers, rows, working, run }: any) {
  const [filter, setFilter] = useState("pending"); const shown = filter === "all" ? rows : rows.filter((r: Row) => r.status === filter);
  async function review(id: string, status: string) { const note = status === "approved" ? "Approved by principal" : window.prompt(status === "clarification" ? "What clarification is required?" : "Reason for rejection?") || ""; if (status !== "approved" && !note) return; await run(() => supabase.from("teacher_leave_requests").update({ status, principal_note: note, reviewed_at: new Date().toISOString() }).eq("id", id), status === "approved" ? "Leave approved and attendance updated." : "Leave request updated."); }
  return <div className="space-y-4"><div className="flex gap-2 overflow-x-auto">{["pending","approved","clarification","rejected","all"].map((v) => <button key={v} onClick={() => setFilter(v)} className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${filter === v ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{v}</button>)}</div>{shown.length ? <div className="space-y-3">{shown.map((row: Row) => <article key={row.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-950">{teacherName(teachers,row.teacher_id)}</p><p className="mt-1 text-xs text-slate-500">{row.leave_type} · {row.start_date} to {row.end_date}</p><p className="mt-3 text-sm text-slate-700">{row.reason}</p>{row.principal_note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Principal note: {row.principal_note}</p>}</div><Status value={row.status} /></div>{row.status === "pending" && <div className="mt-4 flex flex-wrap gap-2"><button disabled={working} onClick={() => review(row.id,"approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve</button><button disabled={working} onClick={() => review(row.id,"clarification")} className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">Request clarification</button><button disabled={working} onClick={() => review(row.id,"rejected")} className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700">Reject</button></div>}</article>)}</div> : <Empty text="No leave requests in this view." />}</div>;
}

function AssignmentsPanel({ schoolId, teachers, rows, classes, working, run }: any) {
  const [teacherId,setTeacherId]=useState(teachers[0]?.id||""); const [className,setClassName]=useState(""); const [subject,setSubject]=useState(""); const [periods,setPeriods]=useState("5");
  async function add(e:React.FormEvent){e.preventDefault();await run(()=>supabase.from("teacher_assignments").insert({school_id:schoolId,teacher_id:teacherId,class_name:className,subject,periods_per_week:Number(periods),active:true}),"Class and subject assigned.");setClassName("");setSubject("");}
  const workload = teachers.map((t:TeacherOperationsTeacher)=>({teacher:t,total:rows.filter((r:Row)=>r.teacher_id===t.id&&r.active).reduce((sum:number,r:Row)=>sum+Number(r.periods_per_week||0),0)})).filter((x:any)=>x.total);
  return <div className="space-y-5"><form onSubmit={add} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-5"><select required value={teacherId} onChange={(e)=>setTeacherId(e.target.value)} className={input}>{teachers.map((t:TeacherOperationsTeacher)=><option key={t.id} value={t.id}>{t.name}</option>)}</select><input required list="school-classes" value={className} onChange={(e)=>setClassName(e.target.value)} placeholder="Class" className={input}/><datalist id="school-classes">{classes.map((c:Row)=><option key={c.id} value={c.name||c.class_name||c.class||"Class"}/>)}</datalist><input required value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject" className={input}/><input required type="number" min="1" max="60" value={periods} onChange={(e)=>setPeriods(e.target.value)} placeholder="Periods/week" className={input}/><button disabled={working||!teacherId} className={button}><Plus className="h-4 w-4"/>Assign</button></form><div className="grid gap-4 lg:grid-cols-[1fr_280px]"><div className="space-y-2">{rows.map((r:Row)=><div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="text-sm font-bold text-slate-900">{teacherName(teachers,r.teacher_id)} · {r.subject}</p><p className="mt-1 text-xs text-slate-500">{r.class_name} · {r.periods_per_week} periods/week</p></div><button onClick={()=>run(()=>supabase.from("teacher_assignments").update({active:!r.active}).eq("id",r.id),r.active?"Assignment deactivated.":"Assignment activated.")} className="text-xs font-bold text-blue-700">{r.active?"Deactivate":"Activate"}</button></div>)}{!rows.length&&<Empty text="No class or subject assignments yet."/>}</div><Panel title="Teacher workload">{workload.length?<div className="space-y-2">{workload.map((x:any)=><SummaryLine key={x.teacher.id} label={x.teacher.name} value={`${x.total} periods`} />)}</div>:<p className="text-sm text-slate-500">No workload data yet.</p>}</Panel></div></div>;
}

function TimetablePanel({schoolId,teachers,rows,working,run}:any){const [teacherId,setTeacherId]=useState(teachers[0]?.id||"");const [day,setDay]=useState("1");const [start,setStart]=useState("10:00");const [end,setEnd]=useState("10:45");const [className,setClassName]=useState("");const [subject,setSubject]=useState("");const [room,setRoom]=useState("");const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 async function add(e:React.FormEvent){e.preventDefault();const conflict=rows.find((r:Row)=>r.teacher_id===teacherId&&Number(r.weekday)===Number(day)&&start<r.end_time&&end>r.start_time);if(conflict){alert(`Scheduling conflict with ${conflict.subject} (${conflict.start_time}–${conflict.end_time}).`);return;}await run(()=>supabase.from("teacher_timetable_entries").insert({school_id:schoolId,teacher_id:teacherId,weekday:Number(day),start_time:start,end_time:end,class_name:className,subject,room:room||null,status:"approved"}),"Timetable entry added.");}
 return <div className="space-y-4"><form onSubmit={add} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4"><select value={teacherId} onChange={(e)=>setTeacherId(e.target.value)} className={input}>{teachers.map((t:TeacherOperationsTeacher)=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={day} onChange={(e)=>setDay(e.target.value)} className={input}>{days.map((d,i)=><option key={d} value={i}>{d}</option>)}</select><input type="time" value={start} onChange={(e)=>setStart(e.target.value)} className={input}/><input type="time" value={end} onChange={(e)=>setEnd(e.target.value)} className={input}/><input required value={className} onChange={(e)=>setClassName(e.target.value)} placeholder="Class" className={input}/><input required value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject" className={input}/><input value={room} onChange={(e)=>setRoom(e.target.value)} placeholder="Room" className={input}/><button disabled={working||!teacherId} className={button}><Plus className="h-4 w-4"/>Add period</button></form><div className="space-y-2">{[...rows].sort((a:Row,b:Row)=>a.weekday-b.weekday||a.start_time.localeCompare(b.start_time)).map((r:Row)=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="text-sm font-bold text-slate-900">{days[r.weekday]} · {r.start_time.slice(0,5)}–{r.end_time.slice(0,5)}</p><p className="mt-1 text-xs text-slate-500">{teacherName(teachers,r.teacher_id)} · {r.subject} · {r.class_name}{r.room?` · ${r.room}`:""}</p></div><div className="flex items-center gap-2"><Status value={r.status}/>{r.status==="change_requested"&&<button onClick={()=>run(()=>supabase.from("teacher_timetable_entries").update({status:"approved"}).eq("id",r.id),"Timetable change approved.")} className="text-xs font-bold text-blue-700">Approve</button>}</div></div>)}{!rows.length&&<Empty text="No timetable entries yet."/>}</div></div>}

function PerformancePanel({schoolId,teachers,rows,working,run}:any){const [teacherId,setTeacherId]=useState(teachers[0]?.id||"");const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));const [attendance,setAttendance]=useState("95");const [results,setResults]=useState("Excellent");const [completion,setCompletion]=useState("90");const [feedback,setFeedback]=useState("4.5");async function save(e:React.FormEvent){e.preventDefault();await run(()=>supabase.from("teacher_performance").upsert({school_id:schoolId,teacher_id:teacherId,review_period:period,attendance_rate:Number(attendance),result_performance:results,assignment_completion:Number(completion),student_feedback:Number(feedback),updated_at:new Date().toISOString()},{onConflict:"teacher_id,review_period"}),"Performance review saved.")}
 return <div className="space-y-4"><form onSubmit={save} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-3 xl:grid-cols-6"><select value={teacherId} onChange={(e)=>setTeacherId(e.target.value)} className={input}>{teachers.map((t:TeacherOperationsTeacher)=><option key={t.id} value={t.id}>{t.name}</option>)}</select><input type="month" value={period} onChange={(e)=>setPeriod(e.target.value)} className={input}/><input type="number" min="0" max="100" value={attendance} onChange={(e)=>setAttendance(e.target.value)} placeholder="Attendance %" className={input}/><input value={results} onChange={(e)=>setResults(e.target.value)} placeholder="Result performance" className={input}/><input type="number" min="0" max="100" value={completion} onChange={(e)=>setCompletion(e.target.value)} placeholder="Completion %" className={input}/><div className="flex gap-2"><input type="number" min="0" max="5" step="0.1" value={feedback} onChange={(e)=>setFeedback(e.target.value)} placeholder="Feedback" className={input}/><button disabled={working||!teacherId} className={button}>Save</button></div></form><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((r:Row)=><article key={r.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="font-bold text-slate-950">{teacherName(teachers,r.teacher_id)}</p><span className="text-xs font-semibold text-slate-400">{r.review_period}</span></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><SummaryLine label="Attendance" value={`${r.attendance_rate??0}%`}/><SummaryLine label="Feedback" value={`${r.student_feedback??0}/5`}/><SummaryLine label="Completion" value={`${r.assignment_completion??0}%`}/><SummaryLine label="Results" value={r.result_performance||"—"}/></div></article>)}{!rows.length&&<Empty text="No performance reviews yet."/>}</div></div>}

function PayrollPanel({schoolId,teachers,rows,working,run}:any){const [teacherId,setTeacherId]=useState(teachers[0]?.id||"");const [month,setMonth]=useState(monthStart());const selected=teachers.find((t:TeacherOperationsTeacher)=>t.id===teacherId);const [base,setBase]=useState(String(selected?.salary||0));const [deductions,setDeductions]=useState("0");const [bonuses,setBonuses]=useState("0");async function save(e:React.FormEvent){e.preventDefault();await run(()=>supabase.from("teacher_payroll").upsert({school_id:schoolId,teacher_id:teacherId,payroll_month:month,base_salary:Number(base),deductions:Number(deductions),bonuses:Number(bonuses),status:"draft"},{onConflict:"teacher_id,payroll_month"}),"Payroll draft saved.")}
 return <div className="space-y-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">Payroll is visible only to authorised school administrators. Net salary is base salary + bonuses − deductions.</div><form onSubmit={save} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-5"><select value={teacherId} onChange={(e)=>{setTeacherId(e.target.value);setBase(String(teachers.find((t:TeacherOperationsTeacher)=>t.id===e.target.value)?.salary||0))}} className={input}>{teachers.map((t:TeacherOperationsTeacher)=><option key={t.id} value={t.id}>{t.name}</option>)}</select><input type="month" value={month.slice(0,7)} onChange={(e)=>setMonth(`${e.target.value}-01`)} className={input}/><input type="number" min="0" value={base} onChange={(e)=>setBase(e.target.value)} placeholder="Base salary" className={input}/><input type="number" min="0" value={deductions} onChange={(e)=>setDeductions(e.target.value)} placeholder="Deductions" className={input}/><div className="flex gap-2"><input type="number" min="0" value={bonuses} onChange={(e)=>setBonuses(e.target.value)} placeholder="Bonuses" className={input}/><button disabled={working||!teacherId} className={button}>Save</button></div></form><div className="space-y-2">{rows.map((r:Row)=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="text-sm font-bold text-slate-950">{teacherName(teachers,r.teacher_id)} · NPR {(Number(r.base_salary)+Number(r.bonuses)-Number(r.deductions)).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{r.payroll_month} · Base {r.base_salary} + Bonus {r.bonuses} − Deduction {r.deductions}</p></div><div className="flex items-center gap-2"><Status value={r.status}/>{r.status==="draft"&&<button onClick={()=>run(()=>supabase.from("teacher_payroll").update({status:"approved",approved_at:new Date().toISOString()}).eq("id",r.id),"Payroll approved.")} className="text-xs font-bold text-blue-700">Approve</button>}</div></div>)}{!rows.length&&<Empty text="No payroll records yet."/>}</div></div>}

function DocumentsPanel({schoolId,teachers,rows,working,setWorking,flash,setError,refresh}:any){const [teacherId,setTeacherId]=useState(teachers[0]?.id||"");const [type,setType]=useState("cv");const [file,setFile]=useState<File|null>(null);async function upload(e:React.FormEvent){e.preventDefault();if(!file||!teacherId)return;setWorking(true);setError("");const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");const path=`${schoolId}/${teacherId}/${crypto.randomUUID()}-${safe}`;const uploaded=await supabase.storage.from("teacher-documents").upload(path,file);if(uploaded.error){setError(uploaded.error.message);setWorking(false);return;}const {data:{user}}=await supabase.auth.getUser();const record=await supabase.from("teacher_documents").insert({school_id:schoolId,teacher_id:teacherId,document_type:type,file_name:file.name,storage_path:path,uploaded_by:user?.id});if(record.error){await supabase.storage.from("teacher-documents").remove([path]);setError(record.error.message);}else{flash("Document uploaded securely.");setFile(null);refresh();}setWorking(false)}async function open(row:Row){const result=await supabase.storage.from("teacher-documents").createSignedUrl(row.storage_path,60);if(result.error){setError(result.error.message);return;}window.open(result.data.signedUrl,"_blank","noopener,noreferrer")}
 return <div className="space-y-4"><form onSubmit={upload} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-4"><select value={teacherId} onChange={(e)=>setTeacherId(e.target.value)} className={input}>{teachers.map((t:TeacherOperationsTeacher)=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={type} onChange={(e)=>setType(e.target.value)} className={input}><option value="cv">CV</option><option value="certification">Certification</option><option value="contract">Contract</option><option value="citizenship">Citizenship copy</option><option value="training">Training certificate</option><option value="other">Other</option></select><input required type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="block h-10 w-full rounded-xl border border-slate-200 bg-white text-xs file:mr-3 file:h-full file:border-0 file:bg-slate-100 file:px-3 file:font-bold"/><button disabled={working||!file} className={button}>{working?<Loader2 className="h-4 w-4 animate-spin"/>:<Upload className="h-4 w-4"/>}Upload</button></form><p className="text-xs text-slate-500">Private storage · PDF, JPG, PNG, DOC or DOCX · maximum 10 MB.</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((r:Row)=><button key={r.id} onClick={()=>open(r)} className="rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50/40"><FileText className="h-5 w-5 text-blue-600"/><p className="mt-3 truncate text-sm font-bold text-slate-950">{r.file_name}</p><p className="mt-1 text-xs capitalize text-slate-500">{teacherName(teachers,r.teacher_id)} · {r.document_type}</p></button>)}{!rows.length&&<Empty text="No teacher documents uploaded."/>}</div></div>}

function ActivityPanel({teachers,rows}:any){const [query,setQuery]=useState("");const shown=rows.filter((r:Row)=>`${r.actor_name||""} ${r.description||""} ${r.action_type||""}`.toLowerCase().includes(query.toLowerCase()));return <div className="space-y-4"><label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search teacher activity" className={`${input} pl-10`}/></label><div className="space-y-2">{shown.map((r:Row)=><div key={r.id} className="flex gap-3 rounded-xl border border-slate-200 p-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Activity className="h-4 w-4"/></span><div><p className="text-sm font-semibold text-slate-900">{r.description}</p><p className="mt-1 text-xs text-slate-500">{r.actor_name||teacherName(teachers,r.teacher_id)} · {new Date(r.created_at).toLocaleString()}</p></div></div>)}{!shown.length&&<Empty text="No matching teacher activity yet. Attendance marking, marks, results and homework events will appear here."/>}</div></div>}

function Status({value}:{value:string}){const tones:Record<string,string>={present:"bg-emerald-50 text-emerald-700",approved:"bg-emerald-50 text-emerald-700",paid:"bg-emerald-50 text-emerald-700",absent:"bg-rose-50 text-rose-700",rejected:"bg-rose-50 text-rose-700",leave:"bg-amber-50 text-amber-700",pending:"bg-amber-50 text-amber-700",clarification:"bg-orange-50 text-orange-700",draft:"bg-slate-100 text-slate-700",change_requested:"bg-violet-50 text-violet-700"};return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${tones[value]||"bg-blue-50 text-blue-700"}`}>{value.replaceAll("_"," ")}</span>}
