"use client";

import { useEffect, useState, type ElementType } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Globe2,
  GraduationCap,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import AttentionCenter, { type AttentionItemData } from "@/components/AttentionCenter";
import UpcomingPanel from "@/components/UpcomingPanel";
import AttendanceTrend from "@/components/AttendanceTrend";
import PrincipalQuickActions from "@/components/PrincipalQuickActions";
import RecentActivity from "@/components/RecentActivity";
import { fetchSchoolActivity, type SchoolActivity } from "@/lib/recent-activity";
import { attendanceTrendData, type TrendPoint, type TrendSummary, type StudentEnrollment, type StaffMark, type ApprovedLeave } from "@/lib/attendance-trend";
import { mergeUpcoming, type SchoolEvent, type UpcomingExam, type UpcomingItem } from "@/lib/upcoming";
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
type AttendanceSummary = {
  rate: number | null;
  present: number;
  absent: number;
  late: number;
  total: number;
};
type AttendancePoint = TrendPoint;
const emptyTrendSummary: TrendSummary = { percentage: null, present: 0, expected: 0, recorded: 0, total: 0, inProgress: false };
type DashboardData = {
  profile: Profile | null;
  school: SchoolRecord | null;
  students: number;
  activeStudents: number;
  teachers: number;
  activeTeachers: number;
  staffPresent: number | null;
  staffTotal: number | null;
  staffAttendanceMarked: boolean;
  staffMarkedCount: number;
  classes: number;
  attendance: AttendanceSummary;
  todayAttendance: AttendanceSummary;
  yesterdayAttendance: AttendanceSummary;
  feesCollected: number;
  monthlyFeesCollected: number;
  paidStudents: number;
  expectedFees: number | null;
  pendingAdmissions: number;
  pendingTeacherLeaves: number;
  unassignedTeachers: number;
  missingGuardianPhones: number;
  expiringDocuments: number;
  lowAttendance: number;
  upcomingExams: number;
  attendanceTrend: AttendancePoint[];
  studentTrendSummary: TrendSummary;
  staffTrendSummary: TrendSummary;
  schoolHolidayToday: boolean;
  recentStudents: StudentRecord[];
  recentActivity: SchoolActivity[];
  schedule: UpcomingItem[];
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
  staffPresent: null,
  staffTotal: null,
  staffAttendanceMarked: false,
  staffMarkedCount: 0,
  classes: 0,
  attendance: emptyAttendance,
  todayAttendance: emptyAttendance,
  yesterdayAttendance: emptyAttendance,
  feesCollected: 0,
  monthlyFeesCollected: 0,
  paidStudents: 0,
  expectedFees: null,
  pendingAdmissions: 0,
  pendingTeacherLeaves: 0,
  unassignedTeachers: 0,
  missingGuardianPhones: 0,
  expiringDocuments: 0,
  lowAttendance: 0,
  upcomingExams: 0,
  attendanceTrend: [],
  studentTrendSummary: emptyTrendSummary,
  staffTrendSummary: emptyTrendSummary,
  schoolHolidayToday: false,
  recentStudents: [],
  recentActivity: [],
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
async function loadAttendanceRows(table: "attendance" | "teacher_attendance", schoolId: string, start: string, end: string) {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await supabase.from(table)
      .select(table === "attendance" ? "student_id,attendance_date,status" : "teacher_id,attendance_date,status")
      .eq("school_id", schoolId).gte("attendance_date", start).lte("attendance_date", end)
      .order("attendance_date").order(table === "attendance" ? "student_id" : "teacher_id")
      .range(offset, offset + 999);
    if (result.error) return { data: null, error: result.error };
    rows.push(...(result.data || []));
    if ((result.data || []).length < 1000) break;
  }
  return { data: rows, error: null };
}

async function loadEnrolledStudents(schoolId: string) {
  const rows: StudentEnrollment[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await supabase.from("students").select("id,class")
      .eq("school_id", schoolId).order("id").range(offset, offset + 999);
    if (result.error) return { data: null, error: result.error };
    rows.push(...(result.data || []));
    if ((result.data || []).length < 1000) break;
  }
  return { data: rows, error: null };
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
        const activityPromise = fetchSchoolActivity(schoolId, 8)
          .then((items) => ({ items, error: null as unknown }))
          .catch((error: unknown) => ({ items: [] as SchoolActivity[], error }));
        const today = nepalDateKey();
        const yesterday = shiftDateKey(today, -1);
        const weekStart = shiftDateKey(today, -6);
        const trendStart = shiftDateKey(today, -119);
        const monthStart = `${today.slice(0, 7)}-01`;
        const rangeStart =
          range === "today" ? today : range === "week" ? weekStart : monthStart;
        const attendanceStart = [
          rangeStart,
          weekStart,
          monthStart,
          trendStart,
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
            .from("teachers")
            .select("id")
            .eq("school_id", schoolId)
            .neq("employment_status", "inactive"),
          supabase
            .from("teacher_attendance")
            .select("teacher_id, status")
            .eq("school_id", schoolId)
            .eq("attendance_date", today),
          supabase
            .from("classes")
            .select("id", { count: "exact", head: true })
            .eq("school_id", schoolId),
          loadAttendanceRows("attendance", schoolId, attendanceStart, today),
          supabase
            .from("fee_records")
            .select("student_id, amount, payment_date")
            .eq("school_id", schoolId)
            .gte("payment_date", monthStart)
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
            .select("id, name, start_date, exam_type")
            .eq("school_id", schoolId)
            .gte("start_date", today)
            .order("start_date")
            .limit(50),
          supabase
            .from("news_events")
            .select("id, title, event_date, event_time, location, content, category")
            .eq("school_id", schoolId)
            .eq("is_event", true)
            .gte("event_date", today)
            .order("event_date")
            .limit(50),
          loadEnrolledStudents(schoolId),
          loadAttendanceRows("teacher_attendance", schoolId, trendStart, today),
          supabase.from("teacher_leave_requests").select("teacher_id,start_date,end_date")
            .eq("school_id", schoolId).eq("status", "approved")
            .lte("start_date", today).gte("end_date", trendStart),
          supabase.from("news_events").select("event_date").eq("school_id", schoolId)
            .eq("is_event", true).eq("category", "holiday")
            .gte("event_date", trendStart).lte("event_date", today),
        ]);
        const [
          school,
          students,
          activeStudents,
          teachers,
          activeTeachers,
          activeStaff,
          staffAttendance,
          classes,
          attendance,
          fees,
          feeTypes,
          recent,
          admissions,
          examsResult,
          eventsResult,
          enrolledResult,
          staffHistoryResult,
          approvedLeavesResult,
          holidayResult,
        ] = results;
        const expiresBefore = new Date(Date.now() + 7 * 86400000).toISOString();
        const [leavesResult, assignmentsResult, missingPhonesResult, documentsResult] = await Promise.all([
          supabase.from("teacher_leave_requests").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "pending"),
          supabase.from("teacher_assignments").select("teacher_id").eq("school_id", schoolId).eq("active", true),
          supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).is("parent_phone", null),
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("is_archived", false).eq("principal_only", false).lte("publish_at", new Date().toISOString()).gt("expires_at", new Date().toISOString()).lte("expires_at", expiresBefore),
        ]);
        const activityResult = await activityPromise;
        const failures = [
          ["school", school.error],
          ["students", students.error || activeStudents.error],
          ["teachers", teachers.error || activeTeachers.error],
          ["staff attendance", activeStaff.error || staffAttendance.error],
          ["classes", classes.error],
          ["attendance", attendance.error],
          ["attendance trend", enrolledResult.error || staffHistoryResult.error || approvedLeavesResult.error || holidayResult.error],
          ["fees", fees.error || feeTypes.error],
          ["recent students", recent.error],
          ["admissions", admissions.error],
          ["schedule", examsResult.error || eventsResult.error],
          ["recent activity", activityResult.error],
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
        const periodFeeRows = feeRows.filter(
          (row) => row.payment_date >= rangeStart,
        );
        const feeTypeRows = (feeTypes.data || []) as FeeType[];
        const exams = (examsResult.data || []) as UpcomingExam[];
        const events = (eventsResult.data || []) as SchoolEvent[];
        const studentTotal = students.count || 0;
        const activeStaffIds = new Set(
          (activeStaff.data || []).map((teacher) => teacher.id),
        );
        const staffRows = (staffAttendance.data || []).filter((row) =>
          activeStaffIds.has(row.teacher_id),
        );
        const assignedTeacherIds = new Set((assignmentsResult.data || []).map((row) => row.teacher_id));
        const trend = attendanceTrendData({
          today,
          students: (enrolledResult.data || []) as StudentEnrollment[],
          studentMarks: attendanceRows,
          teacherIds: [...activeStaffIds],
          staffMarks: (staffHistoryResult.data || []) as StaffMark[],
          approvedLeaves: (approvedLeavesResult.data || []) as ApprovedLeave[],
          holidays: (holidayResult.data || []).map((event) => event.event_date).filter((date): date is string => Boolean(date)),
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
        const schedule = mergeUpcoming(events, exams, today);

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
            staffTotal: activeStaff.error ? null : activeStaffIds.size,
            staffPresent: activeStaff.error || staffAttendance.error
              ? null
              : staffRows.filter((row) => row.status === "present").length,
            staffAttendanceMarked: !activeStaff.error && !staffAttendance.error && staffRows.length > 0,
            staffMarkedCount: activeStaff.error || staffAttendance.error ? 0 : new Set(staffRows.map((row) => row.teacher_id)).size,
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
            attendanceTrend: attendance.error || enrolledResult.error || staffHistoryResult.error || approvedLeavesResult.error || holidayResult.error ? old.attendanceTrend : trend.points,
            studentTrendSummary: attendance.error || enrolledResult.error ? old.studentTrendSummary : trend.todayStudent,
            staffTrendSummary: staffHistoryResult.error || approvedLeavesResult.error ? old.staffTrendSummary : trend.todayStaff,
            schoolHolidayToday: holidayResult.error ? old.schoolHolidayToday : (holidayResult.data || []).some((event) => event.event_date === today),
            lowAttendance: attendance.error ? old.lowAttendance : lowAttendance,
            feesCollected: fees.error
              ? old.feesCollected
              : periodFeeRows.reduce(
                  (sum, fee) => sum + Number(fee.amount || 0),
                  0,
                ),
            monthlyFeesCollected: fees.error
              ? old.monthlyFeesCollected
              : feeRows.reduce(
                  (sum, fee) => sum + Number(fee.amount || 0),
                  0,
                ),
            paidStudents: fees.error
              ? old.paidStudents
              : new Set(
                  periodFeeRows.map((fee) => fee.student_id).filter(Boolean),
                ).size,
            expectedFees: feeTypes.error
              ? old.expectedFees
              : monthlyFee
                ? monthlyFee * (students.error ? old.students : studentTotal)
                : null,
            pendingAdmissions: admissions.error
              ? old.pendingAdmissions
              : admissions.count || 0,
            pendingTeacherLeaves: leavesResult.error ? 0 : leavesResult.count || 0,
            unassignedTeachers: activeStaff.error || assignmentsResult.error ? 0 :
              [...activeStaffIds].filter((id) => !assignedTeacherIds.has(id)).length,
            missingGuardianPhones: missingPhonesResult.error ? 0 : missingPhonesResult.count || 0,
            expiringDocuments: documentsResult.error ? 0 : documentsResult.count || 0,
            upcomingExams: examsResult.error
              ? old.upcomingExams
              : exams.filter(
                  (exam) => exam.start_date && exam.start_date <= nextWeek,
                ).length,
            recentStudents: recent.error
              ? old.recentStudents
              : ((recent.data || []) as StudentRecord[]),
            recentActivity: activityResult.error ? old.recentActivity : activityResult.items,
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
  const attention: AttentionItemData[] = [
    !dashboard.schoolHolidayToday && dashboard.studentTrendSummary.total > 0 && dashboard.studentTrendSummary.percentage === null && {
      id: "student-attendance", priority: "urgent", icon: "studentAttendance", title: "Student attendance incomplete",
      description: dashboard.studentTrendSummary.total > dashboard.studentTrendSummary.recorded
        ? `${dashboard.studentTrendSummary.total - dashboard.studentTrendSummary.recorded} class${dashboard.studentTrendSummary.total - dashboard.studentTrendSummary.recorded === 1 ? " still needs" : "es still need"} to record attendance.`
        : `${Math.max(0, dashboard.students - dashboard.todayAttendance.total)} students still need an attendance record.`, action: "Mark", href: "/principal/attendance",
    },
    !dashboard.schoolHolidayToday && dashboard.staffTrendSummary.expected > 0 && dashboard.staffTrendSummary.percentage === null && {
      id: "staff-attendance", priority: "urgent", icon: "staffAttendance", title: "Staff attendance not recorded",
      description: `${Math.max(0, dashboard.staffTrendSummary.expected - dashboard.staffTrendSummary.recorded)} teacher${dashboard.staffTrendSummary.expected - dashboard.staffTrendSummary.recorded === 1 ? " needs" : "s need"} an attendance record.`, action: "Mark", href: "/principal/teachers?tab=attendance",
    },
    dashboard.pendingTeacherLeaves > 0 && {
      id: "teacher-leave", priority: "action", icon: "leave", title: "Teacher leave requests",
      description: `${dashboard.pendingTeacherLeaves} request${dashboard.pendingTeacherLeaves === 1 ? " is" : "s are"} waiting for approval.`, action: "Review", href: "/principal/teachers?tab=leave",
    },
    dashboard.pendingAdmissions > 0 && {
      id: "admissions", priority: "action", icon: "admission", title: "Admission applications",
      description: `${dashboard.pendingAdmissions} application${dashboard.pendingAdmissions === 1 ? " is" : "s are"} waiting for review.`, action: "Review", href: "/principal/admission",
    },
    dashboard.unassignedTeachers > 0 && {
      id: "assignments", priority: "action", icon: "teacher", title: "Teachers without assignments",
      description: `${dashboard.unassignedTeachers} active teacher${dashboard.unassignedTeachers === 1 ? " has" : "s have"} no active class assignment.`, action: "Assign", href: "/principal/teachers?tab=assignments",
    },
    dashboard.missingGuardianPhones > 0 && {
      id: "guardian-phone", priority: "action", icon: "student", title: "Missing guardian phone numbers",
      description: `${dashboard.missingGuardianPhones} student profile${dashboard.missingGuardianPhones === 1 ? " needs" : "s need"} a guardian phone number.`, action: "Fix", href: "/principal/students",
    },
    dashboard.expiringDocuments > 0 && {
      id: "documents", priority: "watch", icon: "document", title: "Documents expiring soon",
      description: `${dashboard.expiringDocuments} published document${dashboard.expiringDocuments === 1 ? " expires" : "s expire"} within 7 days.`, action: "Review", href: "/principal/documents",
    },
    dashboard.lowAttendance > 0 && {
      id: "low-attendance", priority: "watch", icon: "attendance", title: "Low student attendance",
      description: `${dashboard.lowAttendance} student${dashboard.lowAttendance === 1 ? " is" : "s are"} below 75% this month.`, action: "View", href: "/principal/attendance",
    },
    dashboard.students > 0 && dashboard.expectedFees === null && {
      id: "fee-setup", priority: "watch", icon: "fees", title: "Monthly fee structure incomplete",
      description: "Add a Monthly or Tuition fee type to track the collection target.", action: "Set up", href: "/principal/fees",
    },
  ].filter((item): item is AttentionItemData => Boolean(item));
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
        <main className="flex-1 px-3.5 pb-24 pt-3 sm:px-6 sm:pt-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="pb-0 sm:border-b sm:border-slate-200 sm:pb-5 dark:sm:border-slate-800">
              <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-5">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-slate-600 dark:text-slate-400 sm:gap-2 sm:text-xs sm:tracking-[0.08em]">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    {fullDate}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2 sm:mt-2 sm:block">
                    <h1 className="min-w-0 text-[clamp(1.25rem,5.4vw,1.75rem)] font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                      {greeting},{" "}
                      <span className="text-blue-600">{firstName}</span>
                    </h1>
                    <Link
                      href={dashboard.school?.slug ? `/s/${encodeURIComponent(dashboard.school.slug)}` : "/principal/edit_website"}
                      target={dashboard.school?.slug ? "_blank" : undefined}
                      rel={dashboard.school?.slug ? "noopener noreferrer" : undefined}
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-emerald-700/50 bg-white px-3 text-[11px] font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-500/60 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800 sm:hidden"
                      aria-label={dashboard.school?.slug ? "Open school website" : "Set up school website"}
                    >
                      <Globe2 className="h-4 w-4" aria-hidden="true" />
                      Website
                    </Link>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-[18px] text-slate-600 dark:text-slate-300 sm:hidden">
                    Here&apos;s what&apos;s happening in your school today.
                  </p>
                  <p className="mt-2 hidden text-sm leading-5 text-slate-500 sm:mt-1.5 sm:line-clamp-2">
                    Manage today’s work for{" "}
                    <span className="font-semibold text-slate-700">
                      {schoolName}
                    </span>{" "}
                    and review what needs your attention.
                  </p>
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
              today={today}
              attention={attention}
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
            <AttentionCenter items={attention} />
            <UpcomingPanel items={dashboard.schedule} today={today} />
            <AttendanceTrend points={dashboard.attendanceTrend} student={dashboard.studentTrendSummary} staff={dashboard.staffTrendSummary} />
            <PrincipalQuickActions />
            <section className="mt-5 sm:mt-6">
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
            <section className="mt-5 sm:mt-6">
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
            </section>
            <RecentActivity items={dashboard.recentActivity} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


function MobilePrincipalDashboard({
  dashboard,
  today,
  attention,
}: {
  dashboard: DashboardData;
  today: string;
  attention: AttentionItemData[];
}) {
  const present = dashboard.todayAttendance.present + dashboard.todayAttendance.late;
  const studentTotal = dashboard.students;
  const monthlyProgress =
    dashboard.expectedFees && dashboard.monthlyFeesCollected
      ? Math.min(100, Math.round((dashboard.monthlyFeesCollected / dashboard.expectedFees) * 100))
      : 0;
  const studentRate = dashboard.studentTrendSummary.percentage;
  const staffRate = dashboard.staffTrendSummary.percentage;
  return (
    <div className="sm:hidden">
      <section aria-label="Today's school summary" className="mt-2.5 grid grid-cols-2 gap-2">
        <MobileKpi
          href="/principal/attendance"
          label="Students present"
          value={
            dashboard.studentTrendSummary.inProgress ? "In progress"
              : studentRate === null ? "Not marked" : `${present} / ${studentTotal}`
          }
          badge={studentRate === null ? null : `${studentRate}%`}
          progress={studentRate}
          meta={dashboard.studentTrendSummary.inProgress ? `${dashboard.studentTrendSummary.recorded} of ${dashboard.studentTrendSummary.total} classes recorded` : studentRate === null ? "Take attendance today" : `${Math.max(0, studentTotal - present)} not recorded present today`}
          icon={Users}
          tone="blue"
          action="View Attendance"
        />
        <MobileKpi
          href="/principal/teachers?tab=attendance"
          label="Staff present"
          value={dashboard.staffPresent === null || dashboard.staffTotal === null
            ? "Unavailable"
            : dashboard.staffTotal === 0
              ? "0 / 0"
              : dashboard.staffTrendSummary.inProgress ? "In progress"
                : staffRate !== null ? `${dashboard.staffTrendSummary.present} / ${dashboard.staffTrendSummary.expected}` : "Not marked"}
          badge={staffRate === null ? null : `${staffRate}%`}
          progress={staffRate}
          meta={dashboard.staffTotal === 0 ? "No active teachers" : staffRate !== null ? `${dashboard.staffTrendSummary.expected} expected staff today` : "Mark today's attendance"}
          icon={ClipboardCheck}
          tone="violet"
          action="Manage Staff"
        />
        <MobileKpi
          href="/principal/fees"
          label="Fees this month"
          value={money(dashboard.monthlyFeesCollected)}
          badge={dashboard.expectedFees === null ? null : `${monthlyProgress}%`}
          meta={
            dashboard.expectedFees === null
              ? "Monthly target not set"
              : `Target: ${money(dashboard.expectedFees)}`
          }
          progress={dashboard.expectedFees === null ? null : monthlyProgress}
          icon={Wallet}
          tone="emerald"
          action="Open fees"
        />
        <MobileKpi
          href="/principal/fees#dues"
          label="Overdue fees"
          value="Not tracked"
          meta="No due dates recorded yet"
          icon={AlertCircle}
          tone="amber"
          action="View dues"
        />
      </section>

      <AttentionCenter items={attention} compact />
      <UpcomingPanel items={dashboard.schedule} today={today} />
      <AttendanceTrend points={dashboard.attendanceTrend} student={dashboard.studentTrendSummary} staff={dashboard.staffTrendSummary} />
      <PrincipalQuickActions />
      <RecentActivity items={dashboard.recentActivity} />
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
  badge,
  progress,
  action,
}: {
  href: string;
  label: string;
  value: string;
  meta: string;
  icon: ElementType;
  tone: "blue" | "violet" | "emerald" | "amber";
  badge?: string | null;
  progress?: number | null;
  action: string;
}) {
  const tones = {
    blue: { icon: "bg-gradient-to-br from-sky-400 to-indigo-700 text-white", bar: "bg-blue-700", link: "text-blue-800 dark:text-blue-300" },
    violet: { icon: "bg-gradient-to-br from-purple-400 to-indigo-700 text-white", bar: "bg-purple-600", link: "text-purple-700 dark:text-purple-300" },
    emerald: { icon: "bg-gradient-to-br from-emerald-300 to-teal-600 text-white", bar: "bg-emerald-500", link: "text-emerald-700 dark:text-emerald-300" },
    amber: { icon: "bg-gradient-to-br from-orange-300 to-rose-500 text-white", bar: "bg-orange-500", link: "text-orange-700 dark:text-orange-300" },
  };
  return (
    <Link href={href} className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_3px_12px_rgba(15,23,42,0.08)] transition hover:border-teal-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.02em] text-slate-900 dark:text-slate-100">
          {label}
        </p>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ${tones[tone].icon}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-1">
        <span className="break-all text-[clamp(0.98rem,4vw,1.5rem)] font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white">{value}</span>
        {badge && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">{badge}</span>}
      </div>
      {progress != null && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full rounded-full ${tones[tone].bar}`} style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="mt-1 text-[10px] leading-4 text-slate-600 dark:text-slate-300">{meta}</p>
      <span className={`mt-auto flex items-center gap-1 pt-1 text-[11px] font-bold ${tones[tone].link}`}>
        {action}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
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
