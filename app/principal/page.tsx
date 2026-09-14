"use client";

import { useEffect, useState, type ElementType } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";

type DateRange = "today" | "week" | "month";
type Profile = { full_name: string | null; school_id: string };
type SchoolRecord = { name: string | null; slug: string | null };
type StudentRecord = {
  id: string;
  name: string;
  class: string | null;
  section: string | null;
  roll_no: string | null;
  created_at: string | null;
};
type AttendanceRecord = {
  student_id: string | null;
  attendance_date: string;
  status: string;
};
type FeeRecord = {
  student_id: string | null;
  amount: number | string | null;
  payment_date: string;
};
type FeeType = { name: string; amount: number | string | null };
type ExamRecord = { id: string; name: string; start_date: string | null };
type EventRecord = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
};
type AttendanceSummary = {
  rate: number | null;
  present: number;
  absent: number;
  late: number;
  total: number;
};
type AttendancePoint = AttendanceSummary & { day: string; date: string };
type ScheduleItem = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  type: "Exam" | "Event";
  href: string;
};
type AttentionData = {
  icon: ElementType;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: "amber" | "red" | "orange" | "blue";
  priority: number;
};
type DashboardData = {
  profile: Profile | null;
  school: SchoolRecord | null;
  students: number;
  activeStudents: number;
  teachers: number;
  activeTeachers: number;
  classes: number;
  attendance: AttendanceSummary;
  todayAttendance: AttendanceSummary;
  yesterdayAttendance: AttendanceSummary;
  feesCollected: number;
  paidStudents: number;
  expectedFees: number | null;
  pendingAdmissions: number;
  lowAttendance: number;
  upcomingExams: number;
  attendanceTrend: AttendancePoint[];
  recentStudents: StudentRecord[];
  schedule: ScheduleItem[];
  updatedAt: string | null;
};

const emptyAttendance: AttendanceSummary = {
  rate: null,
  present: 0,
  absent: 0,
  late: 0,
  total: 0,
};
const initialData: DashboardData = {
  profile: null,
  school: null,
  students: 0,
  activeStudents: 0,
  teachers: 0,
  activeTeachers: 0,
  classes: 0,
  attendance: emptyAttendance,
  todayAttendance: emptyAttendance,
  yesterdayAttendance: emptyAttendance,
  feesCollected: 0,
  paidStudents: 0,
  expectedFees: null,
  pendingAdmissions: 0,
  lowAttendance: 0,
  upcomingExams: 0,
  attendanceTrend: [],
  recentStudents: [],
  schedule: [],
  updatedAt: null,
};
const rangeLabels: Record<DateRange, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

function nepalDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}
function shiftDateKey(key: string, days: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function attendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
  const marked = records.filter((record) => record.status !== "unmarked");
  const present = marked.filter((record) => record.status === "present").length;
  const late = marked.filter((record) => record.status === "late").length;
  const absent = marked.filter((record) => record.status === "absent").length;
  const total = present + late + absent;
  return {
    rate: total ? Math.round(((present + late) / total) * 100) : null,
    present,
    late,
    absent,
    total,
  };
}
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function formatSchoolName(name?: string | null) {
  const clean = name?.replace(/\s+/g, " ").trim();
  return clean
    ? clean
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Your School";
}
function money(value: number) {
  return `NPR ${Math.round(value).toLocaleString()}`;
}
function dateLabel(key: string, today: string) {
  if (key === today) return "Today";
  if (key === shiftDateKey(today, 1)) return "Tomorrow";
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function PrincipalDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData>(initialData);
  const [range, setRange] = useState<DateRange>("week");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setRefreshing(true);
      setWarning("");
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (!cancelled) setAuthenticated(false);
          return;
        }
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, school_id")
          .eq("user_id", user.id)
          .single();
        if (profileError || !profileData?.school_id)
          throw new Error("Your school profile could not be loaded.");
        const profile = profileData as Profile;
        const schoolId = profile.school_id;
        const today = nepalDateKey();
        const yesterday = shiftDateKey(today, -1);
        const weekStart = shiftDateKey(today, -6);
        const monthStart = `${today.slice(0, 7)}-01`;
        const rangeStart =
          range === "today" ? today : range === "week" ? weekStart : monthStart;
        const attendanceStart = [
          rangeStart,
          weekStart,
          monthStart,
          yesterday,
        ].sort()[0];
        const nextWeek = shiftDateKey(today, 7);
        const results = await Promise.all([
          supabase
            .from("schools")
            .select("name, slug")
            .eq("id", schoolId)
            .single(),
          supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId),
          supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .not("user_id", "is", null),
          supabase
            .from("teachers")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId),
          supabase
            .from("teachers")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .not("user_id", "is", null),
          supabase
            .from("classes")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId),
          supabase
            .from("attendance")
            .select("student_id, attendance_date, status")
            .eq("school_id", schoolId)
            .gte("attendance_date", attendanceStart)
            .lte("attendance_date", today),
          supabase
            .from("fee_records")
            .select("student_id, amount, payment_date")
            .eq("school_id", schoolId)
            .gte("payment_date", rangeStart)
            .lte("payment_date", today),
          supabase
            .from("fee_types")
            .select("name, amount")
            .eq("school_id", schoolId),
          supabase
            .from("students")
            .select("id, name, class, section, roll_no, created_at")
            .eq("school_id", schoolId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("admission_applications")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .eq("status", "pending"),
          supabase
            .from("exams")
            .select("id, name, start_date")
            .eq("school_id", schoolId)
            .gte("start_date", today)
            .order("start_date")
            .limit(8),
          supabase
            .from("news_events")
            .select("id, title, event_date, event_time")
            .eq("school_id", schoolId)
            .eq("is_event", true)
            .gte("event_date", today)
            .order("event_date")
            .limit(8),
        ]);
        const [
          school,
          students,
          activeStudents,
          teachers,
          activeTeachers,
          classes,
          attendance,
          fees,
          feeTypes,
          recent,
          admissions,
          examsResult,
          eventsResult,
        ] = results;
        const failures = [
          ["school", school.error],
          ["students", students.error || activeStudents.error],
          ["teachers", teachers.error || activeTeachers.error],
          ["classes", classes.error],
          ["attendance", attendance.error],
          ["fees", fees.error || feeTypes.error],
          ["recent students", recent.error],
          ["admissions", admissions.error],
          ["schedule", examsResult.error || eventsResult.error],
        ]
          .filter((entry) => entry[1])
          .map((entry) => entry[0] as string);
        const queryErrors = results.flatMap((result) =>
          result.error ? [result.error] : [],
        );
        if (queryErrors.length)
          console.error("Dashboard query failures", queryErrors);

        const attendanceRows = (attendance.data || []) as AttendanceRecord[];
        const periodRows = attendanceRows.filter(
          (row) => row.attendance_date >= rangeStart,
        );
        const monthRows = attendanceRows.filter(
          (row) => row.attendance_date >= monthStart,
        );
        const feeRows = (fees.data || []) as FeeRecord[];
        const feeTypeRows = (feeTypes.data || []) as FeeType[];
        const exams = (examsResult.data || []) as ExamRecord[];
        const events = (eventsResult.data || []) as EventRecord[];
        const studentTotal = students.count || 0;
        const trend = Array.from({ length: 7 }, (_, index) => {
          const date = shiftDateKey(weekStart, index);
          return {
            ...attendanceSummary(
              attendanceRows.filter((row) => row.attendance_date === date),
            ),
            date,
            day: new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
              weekday: "short",
            }),
          };
        });
        const byStudent = new Map<string, { present: number; total: number }>();
        monthRows.forEach((row) => {
          if (!row.student_id || row.status === "unmarked") return;
          const value = byStudent.get(row.student_id) || {
            present: 0,
            total: 0,
          };
          value.total += 1;
          if (row.status === "present" || row.status === "late")
            value.present += 1;
          byStudent.set(row.student_id, value);
        });
        let lowAttendance = 0;
        byStudent.forEach(({ present, total }) => {
          if (total && present / total < 0.75) lowAttendance += 1;
        });
        const monthlyFee = feeTypeRows
          .filter((fee) => /monthly|tuition/i.test(fee.name))
          .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
        const schedule: ScheduleItem[] = [
          ...exams
            .filter((exam): exam is ExamRecord & { start_date: string } =>
              Boolean(exam.start_date),
            )
            .map((exam) => ({
              id: `exam-${exam.id}`,
              title: exam.name,
              date: exam.start_date,
              time: null,
              type: "Exam" as const,
              href: "/principal/results",
            })),
          ...events
            .filter((event): event is EventRecord & { event_date: string } =>
              Boolean(event.event_date),
            )
            .map((event) => ({
              id: `event-${event.id}`,
              title: event.title,
              date: event.event_date,
              time: event.event_time,
              type: "Event" as const,
              href: "/principal/calendar",
            })),
        ]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);

        if (!cancelled) {
          setDashboard((old) => ({
            ...old,
            profile,
            school: school.error ? old.school : (school.data as SchoolRecord),
            students: students.error ? old.students : studentTotal,
            activeStudents: activeStudents.error
              ? old.activeStudents
              : activeStudents.count || 0,
            teachers: teachers.error ? old.teachers : teachers.count || 0,
            activeTeachers: activeTeachers.error
              ? old.activeTeachers
              : activeTeachers.count || 0,
            classes: classes.error ? old.classes : classes.count || 0,
            attendance: attendance.error
              ? old.attendance
              : attendanceSummary(periodRows),
            todayAttendance: attendance.error
              ? old.todayAttendance
              : attendanceSummary(
                  attendanceRows.filter((row) => row.attendance_date === today),
                ),
            yesterdayAttendance: attendance.error
              ? old.yesterdayAttendance
              : attendanceSummary(
                  attendanceRows.filter(
                    (row) => row.attendance_date === yesterday,
                  ),
                ),
            attendanceTrend: attendance.error ? old.attendanceTrend : trend,
            lowAttendance: attendance.error ? old.lowAttendance : lowAttendance,
            feesCollected: fees.error
              ? old.feesCollected
              : feeRows.reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
            paidStudents: fees.error
              ? old.paidStudents
              : new Set(feeRows.map((fee) => fee.student_id).filter(Boolean))
                  .size,
            expectedFees: feeTypes.error
              ? old.expectedFees
              : monthlyFee
                ? monthlyFee * (students.error ? old.students : studentTotal)
                : null,
            pendingAdmissions: admissions.error
              ? old.pendingAdmissions
              : admissions.count || 0,
            upcomingExams: examsResult.error
              ? old.upcomingExams
              : exams.filter(
                  (exam) => exam.start_date && exam.start_date <= nextWeek,
                ).length,
            recentStudents: recent.error
              ? old.recentStudents
              : ((recent.data || []) as StudentRecord[]),
            schedule:
              examsResult.error && eventsResult.error ? old.schedule : schedule,
            updatedAt: new Date().toISOString(),
          }));
          setWarning(
            failures.length
              ? `Some sections could not be refreshed: ${failures.join(", ")}.`
              : "",
          );
        }
      } catch (error) {
        console.error("Principal dashboard error:", error);
        if (!cancelled)
          setWarning(
            error instanceof Error
              ? error.message
              : "The dashboard could not be loaded.",
          );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [range, refreshKey]);

  if (loading) return <DashboardSkeleton />;
  if (!authenticated)
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950 dark:text-slate-50">Please sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Sign in with your principal account to open this dashboard.
          </p>
          <Link
            href="/auth/login?role=principal"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );

  const today = nepalDateKey();
  const difference =
    dashboard.todayAttendance.rate !== null &&
    dashboard.yesterdayAttendance.rate !== null
      ? dashboard.todayAttendance.rate - dashboard.yesterdayAttendance.rate
      : null;
  const remaining =
    dashboard.expectedFees === null
      ? null
      : Math.max(0, dashboard.expectedFees - dashboard.feesCollected);
  const feeProgress = dashboard.expectedFees
    ? Math.min(
        100,
        Math.round((dashboard.feesCollected / dashboard.expectedFees) * 100),
      )
    : null;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const fullDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const firstName = dashboard.profile?.full_name?.split(" ")[0] || "Principal";
  const schoolName = formatSchoolName(dashboard.school?.name);
  const actions: AttentionData[] = [];
  if (dashboard.students && dashboard.todayAttendance.rate === null)
    actions.push({
      icon: ClipboardCheck,
      title: "Today’s attendance is not marked",
      description:
        "Complete today’s register so the school record stays current.",
      href: "/principal/attendance",
      action: "Take attendance",
      tone: "red",
      priority: 1,
    });
  if (dashboard.pendingAdmissions)
    actions.push({
      icon: UserPlus,
      title: `${dashboard.pendingAdmissions} admission${dashboard.pendingAdmissions === 1 ? "" : "s"} awaiting review`,
      description: "Review new applications and update their status.",
      href: "/principal/admission",
      action: "Review",
      tone: "amber",
      priority: 2,
    });
  if (dashboard.lowAttendance)
    actions.push({
      icon: TrendingDown,
      title: `${dashboard.lowAttendance} low-attendance student${dashboard.lowAttendance === 1 ? "" : "s"}`,
      description: "Monthly attendance is below 75%.",
      href: "/principal/attendance",
      action: "Check",
      tone: "orange",
      priority: 3,
    });
  if (dashboard.expectedFees === null)
    actions.push({
      icon: Wallet,
      title: "Monthly fee goal is not configured",
      description:
        "Add a Monthly or Tuition fee type to track expected collection.",
      href: "/principal/fees",
      action: "Set up",
      tone: "blue",
      priority: 4,
    });
  if (dashboard.upcomingExams)
    actions.push({
      icon: FileText,
      title: `${dashboard.upcomingExams} exam${dashboard.upcomingExams === 1 ? "" : "s"} within seven days`,
      description: "Check that the schedule and subjects are ready.",
      href: "/principal/results",
      action: "Review",
      tone: "blue",
      priority: 5,
    });
  const attentionItems = actions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
  const stats = [
    {
      label: "Students",
      value: dashboard.students.toLocaleString(),
      helper: `${dashboard.activeStudents} active login account${dashboard.activeStudents === 1 ? "" : "s"}`,
      icon: Users,
      color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600",
      href: "/principal/students",
    },
    {
      label: "Teachers",
      value: dashboard.teachers.toLocaleString(),
      helper: `${dashboard.activeTeachers} active login account${dashboard.activeTeachers === 1 ? "" : "s"}`,
      icon: GraduationCap,
      color: "bg-violet-50 dark:bg-violet-950/35 text-violet-600",
      href: "/principal/teachers",
    },
    {
      label: `Attendance · ${rangeLabels[range]}`,
      value:
        dashboard.attendance.rate === null
          ? "Not marked"
          : `${dashboard.attendance.rate}%`,
      helper: dashboard.attendance.total
        ? `${dashboard.attendance.present + dashboard.attendance.late} of ${dashboard.attendance.total} present`
        : "No attendance records",
      icon: ClipboardCheck,
      color: "bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600",
      href: "/principal/attendance",
      trend: range === "today" ? difference : null,
    },
    {
      label: `Fees · ${rangeLabels[range]}`,
      value: money(dashboard.feesCollected),
      helper: `${dashboard.paidStudents} student payment record${dashboard.paidStudents === 1 ? "" : "s"}`,
      icon: Wallet,
      color: "bg-amber-50 dark:bg-amber-950/35 text-amber-600",
      href: "/principal/fees",
    },
  ];
  const setupTasks = [
    {
      label: "Complete school website",
      href: "/principal/edit_website",
      complete: Boolean(dashboard.school?.name && dashboard.school?.slug),
    },
    {
      label: "Create classes",
      href: "/principal/classes",
      complete: dashboard.classes > 0,
    },
    {
      label: "Add teachers",
      href: "/principal/teachers",
      complete: dashboard.teachers > 0,
    },
    {
      label: "Add students",
      href: "/principal/students",
      complete: dashboard.students > 0,
    },
    {
      label: "Configure monthly fees",
      href: "/principal/fees",
      complete: dashboard.expectedFees !== null,
    },
  ];
  const completedSetup = setupTasks.filter((task) => task.complete).length;
  const setupProgress = Math.round((completedSetup / setupTasks.length) * 100);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900 dark:bg-[#080b12] dark:text-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:ml-64">
        <div className="hidden lg:block"><TopBar /></div>
        <main className="flex-1 px-3 pb-16 pt-20 sm:px-4 lg:px-5">
          <div className="w-full">
            <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-gradient-to-l from-blue-50 to-transparent dark:from-blue-950/30 lg:block" />
              <div className="relative grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {fullDate}
                    </span>
                    {dashboard.updatedAt && (
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        Updated {new Date(dashboard.updatedAt).toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu", hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    {greeting}, <span className="text-blue-600 dark:text-blue-400">{firstName}</span>
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                    Here is what is happening at <span className="font-bold text-slate-800 dark:text-slate-200">{schoolName}</span> today.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ActionButton href="/principal/attendance" icon={ClipboardCheck} label="Attendance" primary />
                  <ActionButton href="/principal/students" icon={UserPlus} label="Add student" />
                  <ActionButton href="/principal/fees" icon={ReceiptText} label="Record fee" />
                  <ActionButton href="/principal/results" icon={FileText} label="Create exam" />
                </div>
              </div>
            </section>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:w-auto">
                {(Object.keys(rangeLabels) as DateRange[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    className={"flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition sm:flex-none " + (range === option ? "bg-slate-950 text-white shadow-sm dark:bg-blue-600" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800")}
                  >
                    {rangeLabels[option]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />
                {refreshing ? "Refreshing" : "Refresh data"}
              </button>
            </div>

            {warning && (
              <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div><p className="font-bold">Some information is unavailable</p><p className="mt-0.5 text-xs opacity-80">{warning}</p></div>
              </div>
            )}

            {completedSetup < setupTasks.length && (
              <section className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/25">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="xl:max-w-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Launch checklist</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Prepare your school workspace</h2>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300">{setupProgress}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: setupProgress + "%" }} />
                    </div>
                  </div>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    {setupTasks.map((task) => (
                      <Link
                        key={task.label}
                        href={task.href}
                        className={"flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition " + (task.complete ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-white bg-white text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300")}
                      >
                        {task.complete ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                        <span>{task.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className={"absolute inset-x-0 top-0 h-1 " + (index === 0 ? "bg-blue-500" : index === 1 ? "bg-violet-500" : index === 2 ? "bg-emerald-500" : "bg-amber-500")} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{stat.label}</p>
                      <p className="mt-3 truncate text-2xl font-extrabold text-slate-950 dark:text-white sm:text-3xl">{stat.value}</p>
                    </div>
                    <span className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105 " + stat.color}>
                      <stat.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className={"mt-4 flex items-center gap-1.5 truncate text-xs font-medium " + (stat.trend == null ? "text-slate-500 dark:text-slate-400" : stat.trend >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {stat.trend != null && (stat.trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
                    {stat.helper}
                  </p>
                </Link>
              ))}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <SectionHeading
                  eyebrow="Priority inbox"
                  title="Needs your attention"
                  description="Important work that should be handled next."
                  badge={attentionItems.length ? attentionItems.length + " active" : undefined}
                />
                {attentionItems.length ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {attentionItems.map((item) => <AttentionCard key={item.title} {...item} />)}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm dark:bg-slate-900"><CheckCircle2 className="h-6 w-6" /></span>
                    <div><p className="font-bold text-emerald-950 dark:text-emerald-200">You are all caught up</p><p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">No urgent school tasks need your attention.</p></div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-blue-400">Today at a glance</p>
                <h2 className="mt-1 text-lg font-bold">School activity</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniMetric label="Present" value={dashboard.todayAttendance.present} tone="emerald" />
                  <MiniMetric label="Absent" value={dashboard.todayAttendance.absent} tone="red" />
                  <MiniMetric label="Pending admission" value={dashboard.pendingAdmissions} tone="amber" />
                  <MiniMetric label="Classes" value={dashboard.classes} tone="blue" />
                </div>
              </div>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.75fr)]">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <SectionHeading eyebrow="Attendance" title="Seven-day attendance" description="Daily attendance rate and selected-period totals." href="/principal/attendance" />
                {dashboard.attendanceTrend.some((point) => point.rate !== null) ? (
                  <>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboard.attendanceTrend} margin={{ top: 8, right: 5, left: -24 }}>
                          <defs>
                            <linearGradient id="dashboardAttendanceFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#cbd5e1" strokeOpacity={0.35} strokeDasharray="4 4" vertical={false} />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                          <Tooltip formatter={(value) => value == null ? ["Not marked", "Attendance"] : [String(value) + "%", "Attendance"]} />
                          <Area connectNulls={false} type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} fill="url(#dashboardAttendanceFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <StatusMetric label="Present" value={dashboard.attendance.present} tone="emerald" />
                      <StatusMetric label="Absent" value={dashboard.attendance.absent} tone="red" />
                      <StatusMetric label="Late" value={dashboard.attendance.late} tone="amber" />
                    </div>
                  </>
                ) : (
                  <EmptyState icon={ClipboardCheck} title="Attendance has not been marked" text="Take attendance to unlock daily trends and student insights." href="/principal/attendance" action="Take attendance" />
                )}
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <SectionHeading eyebrow="Finance" title="Fee collection" description={rangeLabels[range] + " payment progress."} href="/principal/fees" />
                <div className="mt-7">
                  <p className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{money(dashboard.feesCollected)}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Collected from {dashboard.paidStudents} students</p>
                </div>
                {dashboard.expectedFees == null ? (
                  <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <p className="text-sm font-bold text-blue-950 dark:text-blue-200">Set your monthly target</p>
                    <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">Create a Monthly or Tuition fee type to calculate expected collection.</p>
                    <Link href="/principal/fees" className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 dark:text-blue-300">Configure fees <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300"><span>Monthly target</span><span>{feeProgress}%</span></div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: (feeProgress || 0) + "%" }} /></div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <SmallFinance label="Expected" value={money(dashboard.expectedFees)} />
                      <SmallFinance label="Remaining" value={money(remaining || 0)} danger />
                    </div>
                  </div>
                )}
              </article>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <SectionHeading padded eyebrow="Students" title="Recently added" description="Your newest student records." href="/principal/students" />
                {dashboard.recentStudents.length ? (
                  <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
                    {dashboard.recentStudents.map((student) => (
                      <Link key={student.id} href={"/principal/students?student=" + student.id} className="group flex items-center gap-3 py-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xs font-extrabold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{initials(student.name)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-700 dark:text-slate-200">{student.name}</p>{student.created_at && student.created_at.slice(0, 10) >= shiftDateKey(today, -7) && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">New</span>}</div>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{student.class ? "Class " + student.class : "Class not assigned"}{student.section ? " · " + student.section : ""}{student.roll_no ? " · Roll " + student.roll_no : ""}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-slate-600" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Users} title="No students yet" text="Add your first student to begin managing the school." href="/principal/students" action="Add student" />
                )}
              </article>

              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <SectionHeading padded eyebrow="Schedule" title="Coming up" description="Upcoming exams and school events." href="/principal/calendar" />
                {dashboard.schedule.length ? (
                  <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
                    {dashboard.schedule.map((item) => (
                      <Link key={item.id} href={item.href} className="group flex items-center gap-3 py-4">
                        <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-2 text-center text-[10px] font-extrabold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">{dateLabel(item.date, today)}</span>
                        <div className="min-w-0 flex-1">
                          <span className={"text-[10px] font-extrabold uppercase tracking-wider " + (item.type === "Exam" ? "text-amber-600" : "text-blue-600")}>{item.type}</span>
                          <p className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-700 dark:text-slate-200">{item.title}</p>
                          {item.time && <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>}
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-slate-600" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={CalendarDays} title="Nothing scheduled" text="Your next exams and events will appear here." href="/principal/calendar" action="Open calendar" />
                )}
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: ElementType;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={"group flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-md " + (primary ? "border-blue-600 bg-blue-600 text-white shadow-blue-200 dark:shadow-none" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200")}
    >
      <span className={"flex h-8 w-8 items-center justify-center rounded-xl " + (primary ? "bg-white/15" : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-700 dark:text-slate-200")}>
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}

const attentionTones = {
  amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  red: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  orange: "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  blue: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
};

function AttentionCard({ icon: Icon, title, description, href, action, tone }: AttentionData) {
  return (
    <article className={"flex min-h-40 flex-col rounded-2xl border p-4 " + attentionTones[tone]}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-slate-900/70"><Icon className="h-5 w-5" /></span>
      <h3 className="mt-4 text-sm font-extrabold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1.5 flex-1 text-xs leading-5 opacity-80">{description}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold">{action}<ArrowRight className="h-3.5 w-3.5" /></Link>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  badge,
  padded = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  padded?: boolean;
}) {
  return (
    <div className={"flex items-start justify-between gap-4 " + (padded ? "border-b border-slate-100 px-5 py-5 dark:border-slate-800" : "")}>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {badge && <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-extrabold text-red-600 dark:bg-red-950/40 dark:text-red-300">{badge}</span>}
      {href && <Link href={href} className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-extrabold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300">View all</Link>}
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone: "emerald" | "red" | "amber" | "blue" }) {
  const colors = { emerald: "text-emerald-400", red: "text-red-400", amber: "text-amber-400", blue: "text-blue-400" };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className={"text-2xl font-extrabold " + colors[tone]}>{value}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}

function StatusMetric({ label, value, tone }: { label: string; value: number; tone: "emerald" | "red" | "amber" }) {
  const colors = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    red: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  };
  return <div className={"rounded-xl border p-3 " + colors[tone]}><p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</p><p className="mt-1 text-xl font-extrabold">{value}</p></div>;
}

function SmallFinance({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={"rounded-xl border p-3 " + (danger ? "border-red-100 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30" : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950")}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={"mt-1 truncate text-sm font-extrabold " + (danger ? "text-red-700 dark:text-red-300" : "text-slate-800 dark:text-slate-200")}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, href, action }: { icon: ElementType; title: string; text: string; href: string; action: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"><Icon className="h-7 w-7" /></span>
      <p className="mt-4 text-sm font-extrabold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700">{action}<ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-[#080b12]">
      <Sidebar />
      <div className="lg:ml-64">
        <div className="hidden lg:block"><TopBar /></div>
        <main className="px-3 pb-16 pt-20 sm:px-4 lg:px-5">
          <div className="w-full animate-pulse">
            <div className="h-36 rounded-2xl bg-white dark:bg-slate-900" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-2xl bg-white dark:bg-slate-900" />)}
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2"><div className="h-72 rounded-2xl bg-white dark:bg-slate-900" /><div className="h-72 rounded-2xl bg-white dark:bg-slate-900" /></div>
          </div>
        </main>
      </div>
    </div>
  );
}
