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
function bikramSambatDate(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-US-u-ca-bikram-sambat", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "BS date unavailable";
  }
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
        const thirtyDayStart = shiftDateKey(today, -29);
        const monthStart = `${today.slice(0, 7)}-01`;
        const rangeStart =
          range === "today" ? today : range === "week" ? weekStart : monthStart;
        const attendanceStart = [
          rangeStart,
          weekStart,
          monthStart,
          thirtyDayStart,
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
        const trend = Array.from({ length: 30 }, (_, index) => {
          const date = shiftDateKey(thirtyDayStart, index);
          return {
            ...attendanceSummary(
              attendanceRows.filter((row) => row.attendance_date === date),
            ),
            date,
            day: new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with your principal account to open this dashboard.
          </p>
          <Link
            href="/auth/login?role=principal"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
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
      color: "bg-blue-50 text-blue-600",
      href: "/principal/students",
    },
    {
      label: "Teachers",
      value: dashboard.teachers.toLocaleString(),
      helper: `${dashboard.activeTeachers} active login account${dashboard.activeTeachers === 1 ? "" : "s"}`,
      icon: GraduationCap,
      color: "bg-violet-50 text-violet-600",
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
      color: "bg-emerald-50 text-emerald-600",
      href: "/principal/attendance",
      trend: range === "today" ? difference : null,
    },
    {
      label: `Fees · ${rangeLabels[range]}`,
      value: money(dashboard.feesCollected),
      helper: `${dashboard.paidStudents} student payment record${dashboard.paidStudents === 1 ? "" : "s"}`,
      icon: Wallet,
      color: "bg-amber-50 text-amber-600",
      href: "/principal/fees",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-14 lg:ml-64 lg:pt-0">
        <div className="hidden lg:block"><TopBar /></div>
        <main className="flex-1 px-3.5 pb-24 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="border-b border-slate-200 pb-4 sm:pb-5">
              <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-5">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 sm:gap-2 sm:text-xs sm:tracking-[0.08em]">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    {fullDate}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    {greeting},{" "}
                    <span className="text-blue-600">{firstName}</span>
                  </h1>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 sm:mt-1.5">
                    Manage today’s work for{" "}
                    <span className="font-semibold text-slate-700">
                      {schoolName}
                    </span>{" "}
                    and review what needs your attention.
                  </p>
                </div>
                <div className="hidden w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:flex sm:w-auto">
                  <QuickAction
                    href="/principal/attendance"
                    icon={ClipboardCheck}
                    label="Take attendance"
                    primary
                  />
                  <QuickAction
                    href="/principal/students"
                    icon={UserPlus}
                    label="Add student"
                  />
                  <QuickAction
                    href="/principal/fees"
                    icon={ReceiptText}
                    label="Record fee"
                  />
                  <QuickAction
                    href="/principal/results"
                    icon={FileText}
                    label="Create exam"
                  />
                </div>
              </div>
            </header>
            <div className="mt-5 hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-fit">
                {(Object.keys(rangeLabels) as DateRange[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:flex-none ${range === option ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    {rangeLabels[option]}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400 sm:justify-start">
                <span>
                  {dashboard.updatedAt
                    ? `Updated ${new Date(dashboard.updatedAt).toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu", hour: "numeric", minute: "2-digit" })}`
                    : "Not updated"}
                </span>
                <button
                  type="button"
                  onClick={() => setRefreshKey((value) => value + 1)}
                  disabled={refreshing}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 sm:min-h-0 sm:px-2.5"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
            {warning && (
              <div
                role="alert"
                className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {warning}
              </div>
            )}
            <MobilePrincipalDashboard
              dashboard={dashboard}
              difference={difference}
              fullDate={fullDate}
              today={today}
            />
            <div className="hidden sm:block">
            <section className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-4 xl:grid-cols-4">
              {stats.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:rounded-2xl sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 min-h-8 text-xs font-medium leading-4 text-slate-500 sm:min-h-0 sm:truncate sm:text-sm">
                        {stat.label}
                      </p>
                      <p className="mt-1.5 break-words text-xl font-bold leading-tight text-slate-950 sm:mt-3 sm:truncate sm:text-2xl">
                        {stat.value}
                      </p>
                    </div>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${stat.color}`}
                    >
                      <stat.icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                    </span>
                  </div>
                  <p
                    className={`mt-2 line-clamp-2 min-h-8 text-[10px] leading-4 sm:mt-3 sm:min-h-0 sm:text-xs ${stat.trend == null ? "text-slate-400" : stat.trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {stat.trend != null &&
                      (stat.trend >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      ))}
                    {stat.helper}
                  </p>
                </Link>
              ))}
            </section>
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Needs your attention
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The three most urgent items, ordered by priority.
                  </p>
                </div>
                {attentionItems.length > 0 && (
                  <span className="h-fit rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                    {attentionItems.length} active
                  </span>
                )}
              </div>
              {attentionItems.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  {attentionItems.map((item) => (
                    <AttentionItem key={item.title} {...item} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Everything looks good
                    </p>
                    <p className="text-xs text-emerald-700">
                      There are no urgent items.
                    </p>
                  </div>
                </div>
              )}
            </section>
            <section className="mt-5 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Attendance overview
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Seven-day trend; totals follow the selected date range.
                    </p>
                  </div>
                  <Link
                    href="/principal/attendance"
                    className="text-xs font-semibold text-blue-600"
                  >
                    View details
                  </Link>
                </div>
                {dashboard.attendanceTrend.some(
                  (point) => point.rate !== null,
                ) ? (
                  <>
                    <div className="mt-4 h-52 sm:mt-5 sm:h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dashboard.attendanceTrend}
                          margin={{ top: 8, right: 4, left: -24 }}
                        >
                          <defs>
                            <linearGradient
                              id="attendanceFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2563eb"
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="95%"
                                stopColor="#2563eb"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(value) =>
                              value == null
                                ? ["Not marked", "Attendance"]
                                : [`${value}%`, "Attendance"]
                            }
                          />
                          <Area
                            connectNulls={false}
                            type="monotone"
                            dataKey="rate"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            fill="url(#attendanceFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <Count
                        label="Present"
                        value={dashboard.attendance.present}
                        color="emerald"
                      />
                      <Count
                        label="Absent"
                        value={dashboard.attendance.absent}
                        color="red"
                      />
                      <Count
                        label="Late"
                        value={dashboard.attendance.late}
                        color="amber"
                      />
                    </div>
                  </>
                ) : (
                  <Empty
                    icon={ClipboardCheck}
                    title="Attendance has not been marked"
                    text="The chart will appear after attendance is added."
                    href="/principal/attendance"
                    action="Take attendance"
                  />
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Fee collection
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {rangeLabels[range]} payments vs monthly goal
                    </p>
                  </div>
                  <Wallet className="h-5 w-5 text-amber-600" />
                </div>
                <p className="mt-7 text-3xl font-bold text-slate-950">
                  {money(dashboard.feesCollected)}
                </p>
                <p className="text-sm text-slate-500">
                  Collected from {dashboard.paidStudents} students
                </p>
                {dashboard.expectedFees == null ? (
                  <div className="mt-6 rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Monthly goal not configured
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Create a Monthly or Tuition fee type to enable expected
                      totals.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm">
                      <span>Collection progress</span>
                      <strong>{feeProgress}%</strong>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${feeProgress}%` }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Metric
                        label="Monthly expected"
                        value={money(dashboard.expectedFees)}
                      />
                      <Metric
                        label="Remaining"
                        value={money(remaining || 0)}
                        red
                      />
                    </div>
                  </div>
                )}
                <Link
                  href="/principal/fees"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
                >
                  Open fee management <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
            <section className="mt-5 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Heading
                  title="Recently added students"
                  text="Open student management from any record."
                  href="/principal/students"
                />
                {dashboard.recentStudents.length ? (
                  <div className="divide-y divide-slate-100 px-5">
                    {dashboard.recentStudents.map((student) => (
                      <Link
                        key={student.id}
                        href={`/principal/students?student=${student.id}`}
                        className="group flex items-center gap-3 py-4"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          {initials(student.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex gap-2">
                            <p className="truncate text-sm font-semibold group-hover:text-blue-700">
                              {student.name}
                            </p>
                            {student.created_at &&
                              student.created_at.slice(0, 10) >=
                                shiftDateKey(today, -7) && (
                                <span className="rounded-full bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700">
                                  New
                                </span>
                              )}
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            {student.class
                              ? `Class ${student.class}`
                              : "Class not assigned"}
                            {student.section ? ` · ${student.section}` : ""}
                            {student.roll_no
                              ? ` · Roll ${student.roll_no}`
                              : ""}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={Users}
                    title="No students added yet"
                    text="Add your first student record."
                    href="/principal/students"
                    action="Add student"
                  />
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Heading
                  title="Coming up"
                  text="Upcoming exams and events."
                  href="/principal/calendar"
                />
                {dashboard.schedule.length ? (
                  <div className="divide-y divide-slate-100 px-5">
                    {dashboard.schedule.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group flex items-center gap-3 py-4"
                      >
                        <span className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                          {dateLabel(item.date, today)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-[10px] font-bold uppercase ${item.type === "Exam" ? "text-amber-600" : "text-blue-600"}`}
                          >
                            {item.type}
                          </span>
                          <p className="truncate text-sm font-semibold group-hover:text-blue-700">
                            {item.title}
                          </p>
                          {item.time && (
                            <p className="text-xs text-slate-400">
                              {item.time}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={CalendarDays}
                    title="Nothing scheduled"
                    text="Events and exams will appear here."
                    href="/principal/calendar"
                    action="Open calendar"
                  />
                )}
              </div>
            </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


function MobilePrincipalDashboard({
  dashboard,
  difference,
  fullDate,
  today,
}: {
  dashboard: DashboardData;
  difference: number | null;
  fullDate: string;
  today: string;
}) {
  const present = dashboard.todayAttendance.present + dashboard.todayAttendance.late;
  const studentTotal = dashboard.students;
  const monthlyProgress =
    dashboard.expectedFees && dashboard.feesCollected
      ? Math.min(100, Math.round((dashboard.feesCollected / dashboard.expectedFees) * 100))
      : 0;
  const attention = [
    dashboard.todayAttendance.rate === null
      ? {
          title: "Today’s student attendance is not marked",
          detail: "Complete the register before the school day ends.",
          href: "/principal/attendance",
          action: "Mark",
          tone: "border-red-200 bg-red-50 text-red-700",
        }
      : null,
    dashboard.pendingAdmissions
      ? {
          title: `${dashboard.pendingAdmissions} admission application${dashboard.pendingAdmissions === 1 ? "" : "s"} pending`,
          detail: "Review the applications waiting for a principal decision.",
          href: "/principal/admission",
          action: "Review",
          tone: "border-amber-200 bg-amber-50 text-amber-700",
        }
      : null,
    dashboard.lowAttendance
      ? {
          title: `${dashboard.lowAttendance} student${dashboard.lowAttendance === 1 ? "" : "s"} below 75% attendance`,
          detail: "Check students who may be at risk of NEB ineligibility.",
          href: "/principal/attendance",
          action: "View",
          tone: "border-orange-200 bg-orange-50 text-orange-700",
        }
      : null,
    dashboard.expectedFees === null
      ? {
          title: "Monthly fee target is not configured",
          detail: "Add a Monthly or Tuition fee type to calculate collection progress.",
          href: "/principal/fees",
          action: "Set up",
          tone: "border-blue-200 bg-blue-50 text-blue-700",
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    detail: string;
    href: string;
    action: string;
    tone: string;
  }>;

  return (
    <div className="sm:hidden">
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
            Morning brief
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {bikramSambatDate()} BS · {fullDate} AD
          </p>
        </div>
        <Link
          href="/principal/reports"
          className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white"
        >
          Full report
        </Link>
      </div>

      <section className="mt-3 grid grid-cols-2 gap-2.5">
        <MobileKpi
          href="/principal/attendance"
          label="Students present"
          value={
            dashboard.todayAttendance.rate === null
              ? "Not marked"
              : `${present} / ${studentTotal}`
          }
          meta={
            dashboard.todayAttendance.rate === null
              ? "Take attendance today"
              : `${dashboard.todayAttendance.rate}% today`
          }
          trend={difference}
          icon={Users}
          tone="blue"
        />
        <MobileKpi
          href="/principal/teachers"
          label="Staff present"
          value="Not available"
          meta="Staff attendance setup needed"
          icon={GraduationCap}
          tone="violet"
        />
        <MobileKpi
          href="/principal/fees"
          label="Fees this month"
          value={money(dashboard.feesCollected)}
          meta={
            dashboard.expectedFees === null
              ? "Monthly target not set"
              : `${monthlyProgress}% of ${money(dashboard.expectedFees)}`
          }
          progress={dashboard.expectedFees === null ? null : monthlyProgress}
          icon={Wallet}
          tone="emerald"
        />
        <MobileKpi
          href="/principal/fees"
          label="Overdue fees"
          value="Not available"
          meta="Student due schedules needed"
          icon={AlertCircle}
          tone="amber"
        />
      </section>

      <section className="mt-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Needs your attention</h2>
            <p className="text-xs text-slate-500">Items requiring a principal decision</p>
          </div>
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
            {attention.length} open
          </span>
        </div>
        <div className="mt-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {attention.length ? (
            <div className="divide-y divide-slate-100">
              {attention.map((item) => (
                <div key={item.title} className="flex items-center gap-3 p-3.5">
                  <span className={`h-9 w-1 shrink-0 rounded-full border ${item.tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-4 text-slate-900">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                      {item.detail}
                    </p>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-bold text-slate-700"
                  >
                    {item.action}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-slate-900">You’re all caught up</p>
                <p className="text-[10px] text-slate-500">No supported dashboard action is pending.</p>
              </div>
            </div>
          )}
          <Link
            href="/principal/admission"
            className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-600"
          >
            Open all approvals
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Quick notice</h2>
            <p className="text-xs text-slate-500">Publish an announcement to your school</p>
          </div>
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <Link
          href="/principal/communication"
          className="mt-3 block min-h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-400"
        >
          Write your notice here…
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-700">
            Publish to: All
          </span>
          <Link
            href="/principal/communication"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            Compose & publish
          </Link>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Attendance trend</h2>
            <p className="text-xs text-slate-500">Student attendance · last 30 days</p>
          </div>
          <Link href="/principal/attendance" className="text-[10px] font-bold text-blue-600">
            Details
          </Link>
        </div>
        {dashboard.attendanceTrend.some((point) => point.rate !== null) ? (
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.attendanceTrend} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="mobileAttendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} minTickGap={28} tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Students"]} />
                <Area connectNulls={false} type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2.5} fill="url(#mobileAttendanceFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-7 text-center">
            <p className="text-xs font-semibold text-slate-700">No attendance trend yet</p>
            <p className="mt-1 text-[10px] text-slate-500">The chart appears after attendance is marked.</p>
          </div>
        )}
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2.5">
        <Link href="/principal/results" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <FileText className="h-5 w-5 text-violet-600" />
          <h3 className="mt-3 text-xs font-bold text-slate-900">Class performance</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">Open the latest exam results by class.</p>
        </Link>
        <Link href="/principal/fees" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Wallet className="h-5 w-5 text-emerald-600" />
          <h3 className="mt-3 text-xs font-bold text-slate-900">Fee analytics</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">Review collection records and targets.</p>
        </Link>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">Upcoming</h2>
            <p className="text-xs text-slate-500">Exams and events ahead</p>
          </div>
          <CalendarDays className="h-5 w-5 text-blue-600" />
        </div>
        {dashboard.schedule.length ? (
          <div className="divide-y divide-slate-100 px-4">
            {dashboard.schedule.slice(0, 4).map((item) => (
              <Link key={item.id} href={item.href} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold uppercase text-slate-600">
                  {dateLabel(item.date, today)}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold uppercase text-blue-600">{item.type}</span>
                  <p className="truncate text-xs font-semibold text-slate-900">{item.title}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-5 text-center">
            <p className="text-xs font-semibold text-slate-700">Nothing scheduled</p>
            <Link href="/principal/calendar" className="mt-2 inline-block text-[10px] font-bold text-blue-600">
              Add an event
            </Link>
          </div>
        )}
        <div className="grid grid-cols-2 border-t border-slate-100">
          <Link href="/principal/calendar" className="p-3 text-center text-[10px] font-bold text-slate-600">
            Open calendar
          </Link>
          <Link href="/principal/communication" className="border-l border-slate-100 p-3 text-center text-[10px] font-bold text-slate-600">
            Recent circulars
          </Link>
        </div>
      </section>
    </div>
  );
}

function MobileKpi({
  href,
  label,
  value,
  meta,
  icon: Icon,
  tone,
  trend,
  progress,
}: {
  href: string;
  label: string;
  value: string;
  meta: string;
  icon: ElementType;
  tone: "blue" | "violet" | "emerald" | "amber";
  trend?: number | null;
  progress?: number | null;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <Link href={href} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="min-h-8 text-[10px] font-bold uppercase leading-4 tracking-[0.04em] text-slate-500">
          {label}
        </p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 break-words text-lg font-extrabold leading-tight text-slate-950">{value}</p>
      <div className="mt-1.5 flex min-h-8 items-start gap-1 text-[10px] leading-4 text-slate-500">
        {trend != null && (
          <span className={trend >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
        <span>{meta}</span>
      </div>
      {progress != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </Link>
  );
}

function QuickAction({
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition sm:min-h-10 sm:px-3 sm:text-sm ${primary ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" : "border border-slate-100 text-slate-600 hover:bg-slate-100"}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
const tones = {
  amber: "border-amber-100 bg-amber-50/70 text-amber-700",
  red: "border-red-100 bg-red-50/70 text-red-700",
  orange: "border-orange-100 bg-orange-50/70 text-orange-700",
  blue: "border-blue-100 bg-blue-50/70 text-blue-700",
};
function AttentionItem({
  icon: Icon,
  title,
  description,
  href,
  action,
  tone,
}: AttentionData) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3.5 ${tones[tone]}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
      >
        {action}
      </Link>
    </div>
  );
}
function Count({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "red" | "amber";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
function Metric({
  label,
  value,
  red = false,
}: {
  label: string;
  value: string;
  red?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${red ? "bg-red-50 text-red-800" : "bg-slate-50 text-slate-800"}`}
    >
      <p className="text-xs">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}
function Heading({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{text}</p>
      </div>
      <Link href={href} className="text-xs font-semibold text-blue-600">
        View all
      </Link>
    </div>
  );
}
function Empty({
  icon: Icon,
  title,
  text,
  href,
  action,
}: {
  icon: ElementType;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <Icon className="h-6 w-6 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
      <Link href={href} className="mt-4 text-xs font-semibold text-blue-600">
        {action}
      </Link>
    </div>
  );
}
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pt-10 lg:ml-64">
        <div className="hidden lg:block"><TopBar /></div>
        <main className="px-3.5 pb-24 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px] animate-pulse">
            <div className="h-24 border-b border-slate-200" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-36 rounded-2xl bg-white" />
              ))}
            </div>
            <div className="mt-6 h-48 rounded-2xl bg-white" />
            <div className="mt-6 h-80 rounded-2xl bg-white" />
          </div>
        </main>
      </div>
    </div>
  );
}
