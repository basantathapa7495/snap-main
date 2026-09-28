"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronDown,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  ClipboardClock,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  UserRound,
  UsersRound,
  LayoutDashboard,
  School,
  MoreHorizontal,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import TeacherOperationsPanel from "@/components/TeacherOperationsPanel";
import SchoolJoiningControls from "@/components/SchoolJoiningControls";
import AccountRequestsPanel from "@/components/AccountRequestsPanel";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  school_id: string | null;
  name: string;
  subject: string | null;
  phone: string | null;
  email: string | null;
  qualification: string | null;
  address: string | null;
  salary: number | string | null;
  created_at: string | null;
  user_id: string | null;
  department: string | null;
  joining_date: string | null;
  date_of_birth: string | null;
  employment_status: string | null;
};

type TemporaryCredential = {
  teacherId: string;
  teacherName: string;
  email: string;
  password: string;
};

type TeacherForm = {
  name: string;
  subject: string;
  phone: string;
  email: string;
  qualification: string;
  address: string;
  salary: string;
  department: string;
  joining_date: string;
  date_of_birth: string;
  employment_status: string;
};

const emptyForm: TeacherForm = {
  name: "",
  subject: "",
  phone: "",
  email: "",
  qualification: "",
  address: "",
  salary: "",
  department: "",
  joining_date: "",
  date_of_birth: "",
  employment_status: "active",
};

type TeacherOverview = {
  present: number;
  absent: number;
  leave: number;
  unassigned: number;
  pendingLeave: number;
  statuses: Record<string, string>;
};

function todayInNepal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function titleCase(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createPassword() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(
    values,
    (value) => characters[value % characters.length],
  ).join("");
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [account, setAccount] = useState<"All" | "Active" | "Not created">(
    "All",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loginTeacher, setLoginTeacher] = useState<Teacher | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [credentialsCreated, setCredentialsCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [temporaryCredentials, setTemporaryCredentials] = useState<TemporaryCredential[]>([]);
  const [showCredentialTray, setShowCredentialTray] = useState(true);
  const [showSavedPasswords, setShowSavedPasswords] = useState(false);
  const [allCredentialsCopied, setAllCredentialsCopied] = useState(false);
  const [pageTab, setPageTab] = useState<"teachers" | "attendance" | "leave" | "assignments" | "joining" | "more">("teachers");
  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [showAllMobileTeachers, setShowAllMobileTeachers] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "attendance" || requestedTab === "leave" || requestedTab === "assignments" || requestedTab === "joining" || requestedTab === "more") {
      // Read the deep link after hydration so the server and first client render match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPageTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTeachers() {
      setRefreshing(true);
      setError("");
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
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("user_id", user.id)
          .single();
        if (profileError || !profile?.school_id)
          throw new Error("Your school profile could not be loaded.");
        const { data, error: teachersError } = await supabase
          .from("teachers")
          .select(
            "id, school_id, name, subject, phone, email, qualification, address, salary, created_at, user_id, department, joining_date, date_of_birth, employment_status",
          )
          .eq("school_id", profile.school_id)
          .order("created_at", { ascending: false });
        if (teachersError) throw teachersError;
        if (!cancelled) {
          setSchoolId(profile.school_id);
          setTeachers((data || []) as Teacher[]);
          const selectedId = new URLSearchParams(window.location.search).get('teacher');
          const match = (data || []).find((item) => item.id === selectedId);
          if (match) {
            setSelectedTeacher(match as Teacher);
            window.history.replaceState(window.history.state, '', window.location.pathname);
          }
        }
      } catch (loadError) {
        console.error("Teachers page load error", loadError);
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Teachers could not be loaded.",
          );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    loadTeachers();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!schoolId || pageTab !== "teachers") return;
    let cancelled = false;
    async function loadOverview() {
      setOverviewLoading(true);
      setOverviewError("");
      const today = todayInNepal();
      const [attendance, leaves, pending, classes, assignments] = await Promise.all([
        supabase.from("teacher_attendance").select("teacher_id,status").eq("school_id", schoolId).eq("attendance_date", today),
        supabase.from("teacher_leave_requests").select("teacher_id").eq("school_id", schoolId).eq("status", "approved").lte("start_date", today).gte("end_date", today),
        supabase.from("teacher_leave_requests").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "pending"),
        supabase.from("classes").select("teacher_id").eq("school_id", schoolId).not("teacher_id", "is", null),
        supabase.from("teacher_assignments").select("teacher_id").eq("school_id", schoolId).eq("active", true),
      ]);
      if (cancelled) return;
      const failure = [attendance.error, leaves.error, pending.error, classes.error, assignments.error].find(Boolean);
      if (failure) {
        console.error("Teacher overview load failed", failure);
        setOverviewError("Teacher overview could not be refreshed.");
        setOverview(null);
      } else {
        const active = teachers.filter((teacher) => teacher.employment_status !== "inactive");
        const statuses = new Map((attendance.data || []).map((row) => [row.teacher_id, row.status]));
        const approvedLeaveIds = new Set((leaves.data || []).map((row) => row.teacher_id));
        const assignedIds = new Set([
          ...(classes.data || []).map((row) => row.teacher_id),
          ...(assignments.data || []).map((row) => row.teacher_id),
        ]);
        setOverview({
          present: active.filter((teacher) => statuses.get(teacher.id) === "present").length,
          absent: active.filter((teacher) => statuses.get(teacher.id) === "absent").length,
          leave: active.filter((teacher) => statuses.get(teacher.id) === "leave" || (!statuses.has(teacher.id) && approvedLeaveIds.has(teacher.id))).length,
          unassigned: active.filter((teacher) => !assignedIds.has(teacher.id)).length,
          pendingLeave: pending.count || 0,
          statuses: Object.fromEntries(active.map((teacher) => [teacher.id, statuses.get(teacher.id) || (approvedLeaveIds.has(teacher.id) ? "leave" : "") ])),
        });
      }
      setOverviewLoading(false);
    }
    void loadOverview();
    return () => { cancelled = true; };
  }, [schoolId, pageTab, refreshKey, teachers]);

  const subjects = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          teachers
            .map((teacher) => teacher.department || teacher.subject)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    ],
    [teachers],
  );

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const matchesSearch =
        !query ||
        [teacher.name, teacher.subject, teacher.phone, teacher.email].some(
          (value) => value?.toLowerCase().includes(query),
        );
      const matchesSubject = subject === "All" || (teacher.department || teacher.subject) === subject;
      const matchesAccount =
        account === "All" ||
        (account === "Active" ? Boolean(teacher.user_id) : !teacher.user_id);
      return matchesSearch && matchesSubject && matchesAccount;
    });
  }, [account, search, subject, teachers]);

  function openCreateForm() {
    setEditingTeacher(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  }

  function openEditForm(teacher: Teacher) {
    setEditingTeacher(teacher);
    setForm({
      name: teacher.name || "",
      subject: teacher.subject || "",
      phone: teacher.phone || "",
      email: teacher.email || "",
      qualification: teacher.qualification || "",
      address: teacher.address || "",
      salary: teacher.salary == null ? "" : String(teacher.salary),
      department: teacher.department || "",
      joining_date: teacher.joining_date || "",
      date_of_birth: teacher.date_of_birth || "",
      employment_status: teacher.employment_status || "active",
    });
    setSelectedTeacher(null);
    setError("");
    setFormOpen(true);
  }

  async function saveTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !form.name.trim()) return;
    setSaving(true);
    setError("");
    const teacherData = {
      school_id: schoolId,
      name: titleCase(form.name),
      subject: form.subject.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      qualification: form.qualification.trim() || null,
      address: form.address.trim() || null,
      salary: form.salary ? Number(form.salary) : null,
      department: form.department.trim() || null,
      joining_date: form.joining_date || null,
      date_of_birth: form.date_of_birth || null,
      employment_status: form.employment_status,
    };
    try {
      const result = editingTeacher
        ? await supabase
            .from("teachers")
            .update(teacherData)
            .eq("id", editingTeacher.id)
            .eq("school_id", schoolId)
        : await supabase.from("teachers").insert(teacherData);
      if (result.error) throw result.error;
      setFormOpen(false);
      setNotice(
        editingTeacher
          ? "Teacher details updated."
          : "Teacher added successfully.",
      );
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      console.error("Teacher save error", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Teacher could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeacher(teacher: Teacher) {
    if (!schoolId) return;
    if (teacher.user_id) {
      setError(
        "Remove or disable this teacher’s login account before deleting the teacher record.",
      );
      return;
    }
    if (!window.confirm(`Delete ${teacher.name}? This cannot be undone.`))
      return;
    const { error: deleteError } = await supabase
      .from("teachers")
      .delete()
      .eq("id", teacher.id)
      .eq("school_id", schoolId);
    if (deleteError) {
      console.error("Teacher delete error", deleteError);
      setError(deleteError.message);
      return;
    }
    setSelectedTeacher(null);
    setNotice("Teacher deleted.");
    setRefreshKey((value) => value + 1);
  }

  async function toggleTeacherStatus(teacher: Teacher) {
    if (!schoolId) return;
    const nextStatus = teacher.employment_status === "inactive" ? "active" : "inactive";
    const { error: statusError } = await supabase
      .from("teachers")
      .update({ employment_status: nextStatus })
      .eq("id", teacher.id)
      .eq("school_id", schoolId);
    if (statusError) {
      setError(statusError.message);
      return;
    }
    setSelectedTeacher(null);
    setNotice(nextStatus === "inactive" ? "Teacher deactivated." : "Teacher reactivated.");
    setRefreshKey((value) => value + 1);
  }

  function openLogin(teacher: Teacher) {
    setLoginTeacher(teacher);
    setLoginEmail(teacher.email || "");
    setPassword(createPassword());
    setShowPassword(false);
    setCredentialsCreated(false);
    setCopied(false);
    setError("");
  }

  async function createLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginTeacher || !schoolId || !loginEmail || password.length < 8)
      return;
    setCreatingLogin(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token)
        throw new Error("Your session has expired. Please sign in again.");
      const resetting = Boolean(loginTeacher.user_id);
      const response = await fetch(
        resetting
          ? "/api/reset-teacher-password"
          : "/api/create-teacher-login",
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
          body: JSON.stringify({
            email: loginEmail.trim().toLowerCase(),
            password,
            teacherId: loginTeacher.id,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(
          result.error ||
            (resetting
              ? "Teacher access could not be reset."
              : "The login could not be created."),
        );
      setCredentialsCreated(true);
      setTemporaryCredentials((current) => [
        ...current.filter((item) => item.teacherId !== loginTeacher.id),
        {
          teacherId: loginTeacher.id,
          teacherName: loginTeacher.name,
          email: loginEmail.trim().toLowerCase(),
          password,
        },
      ]);
      setShowCredentialTray(true);
      setTeachers((current) =>
        current.map((teacher) =>
          teacher.id === loginTeacher.id
            ? { ...teacher, user_id: result.userId }
            : teacher,
        ),
      );
      setNotice(
        resetting
          ? `Temporary password reset for ${loginTeacher.name}.`
          : `Login created for ${loginTeacher.name}.`,
      );
    } catch (loginError) {
      console.error("Teacher login creation error", loginError);
      setError(
        loginError instanceof Error
          ? loginError.message
          : "The login could not be created.",
      );
    } finally {
      setCreatingLogin(false);
    }
  }

  async function copyCredentials() {
    await navigator.clipboard.writeText(
      `NEPSOM teacher login\nEmail: ${loginEmail}\nTemporary password: ${password}\nLogin: ${window.location.origin}/auth/login?role=teacher\n\nYou must create a private password after signing in.`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function copyAllCredentials() {
    const loginUrl = `${window.location.origin}/auth/login?role=teacher`;
    await navigator.clipboard.writeText(
      temporaryCredentials
        .map(
          (item) =>
            `${item.teacherName}\nEmail: ${item.email}\nTemporary password: ${item.password}\nLogin: ${loginUrl}`,
        )
        .join("\n\n"),
    );
    setAllCredentialsCopied(true);
    window.setTimeout(() => setAllCredentialsCopied(false), 2000);
  }

  if (loading) return <TeachersSkeleton />;
  if (!authenticated)
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
          <p className="mt-2 text-sm text-slate-500">
            Use a principal account to manage teachers.
          </p>
        </div>
      </main>
    );

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="relative z-10 flex min-h-screen flex-col pt-14 lg:ml-64 lg:pt-0">
        <div className="hidden lg:block"><TopBar /></div>
        <main className="flex-1 px-3.5 pb-28 pt-3 sm:px-6 sm:pt-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="relative flex min-h-[112px] items-center overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#e7f2ff] via-[#f5faff] to-[#9dbcf4] px-4 py-3 dark:border-blue-900/60 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:min-h-[160px] sm:px-8 sm:py-8">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[52%] overflow-hidden" aria-hidden="true">
                <div className="absolute -bottom-16 right-[-15%] h-40 w-[115%] rounded-[50%] bg-blue-300/20 dark:bg-blue-300/10" />
                <p className="absolute left-[2%] top-[35%] hidden -rotate-6 text-center font-serif text-xs italic leading-snug text-blue-900/80 dark:text-blue-200/60 min-[420px]:block lg:text-sm">Empowered<br />Teachers<br />Brighter Futures</p>
                <TeachersHeroArtwork />
              </div>
              <div className="relative max-w-[64%] sm:max-w-[55%]">
                <h1 className="text-[1.7rem] font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Teachers</h1>
                <p className="mt-1 max-w-md text-xs leading-4 text-slate-800 dark:text-blue-100 min-[420px]:text-sm min-[420px]:leading-5 sm:text-base sm:leading-6">Manage teachers, attendance, leave and school access.</p>
              </div>
            </header>

            <nav aria-label="Teachers sections" className="mt-1 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700 sm:mt-3 sm:gap-4">
              {([
                ["teachers", "Overview"],
                ["attendance", "Attendance"],
                ["leave", "Leave"],
                ["assignments", "Assignments"],
                ["joining", "Joining"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setPageTab(value)}
                  aria-current={pageTab === value ? "page" : undefined}
                  className={`relative min-h-10 shrink-0 whitespace-nowrap border-b-[3px] px-2 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-500 min-[420px]:px-3 min-[420px]:text-sm sm:min-h-12 sm:px-4 ${
                    pageTab === value
                      ? "border-blue-600 font-bold text-slate-950 dark:border-blue-400 dark:text-blue-200"
                      : "border-transparent text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}>
                  {label}
                </button>
              ))}
            </nav>

            {pageTab === "teachers" && <>
              {overviewError && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{overviewError}</p>}
              <section className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-3" aria-label="Teacher overview">
                <TeacherStat icon={UsersRound} label="Total Teachers" value={teachers.length} tone="blue" onClick={() => document.getElementById(window.innerWidth < 640 ? "mobile-teacher-records" : "teacher-records")?.scrollIntoView({ behavior: "smooth" })} />
                <TeacherStat icon={UserCheck} label="Present Today" value={overviewLoading || overviewError ? null : overview?.present ?? null} tone="emerald" onClick={() => setPageTab("attendance")} />
                <TeacherStat icon={UserMinus} label="Absent" value={overviewLoading || overviewError ? null : overview?.absent ?? null} tone="rose" onClick={() => setPageTab("attendance")} />
                <TeacherStat icon={CalendarDays} label="On Leave" value={overviewLoading || overviewError ? null : overview?.leave ?? null} tone="orange" onClick={() => setPageTab("leave")} />
                <TeacherStat icon={UserRound} label="Unassigned Teachers" value={overviewLoading || overviewError ? null : overview?.unassigned ?? null} tone="violet" onClick={() => setPageTab("assignments")} />
                <TeacherStat icon={ClipboardClock} label="Pending Leave Requests" value={overviewLoading || overviewError ? null : overview?.pendingLeave ?? null} tone="amber" onClick={() => setPageTab("leave")} />
              </section>
              <section className="mt-5 sm:mt-8" aria-labelledby="teacher-attention-title">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="teacher-attention-title" className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white sm:text-xl"><TriangleAlert className="h-5 w-5 fill-red-500 text-white" aria-hidden="true" /> Needs Attention</h2>
                  <button type="button" onClick={() => setPageTab("more")} className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">View all <ChevronRight className="h-4 w-4" /></button>
                </div>
                {overviewLoading ? <p className="py-4 text-sm text-slate-500">Loading teacher updates…</p> : overviewError ? <p className="py-4 text-sm text-slate-500">Teacher updates are unavailable.</p> : (
                  <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                    {(overview?.pendingLeave ?? 0) > 0 && <AttentionRow icon={ClipboardClock} tone="amber" title="Pending leave requests" detail={`${overview?.pendingLeave} require approval`} onClick={() => setPageTab("leave")} />}
                    {(overview?.unassigned ?? 0) > 0 && <AttentionRow icon={UserRound} tone="violet" title="Teachers unassigned" detail={`${overview?.unassigned} not assigned to a class`} onClick={() => setPageTab("assignments")} />}
                    {teachers.some((teacher) => teacher.employment_status === "inactive") && <AttentionRow icon={UserMinus} tone="rose" title="Inactive teachers" detail={`${teachers.filter((teacher) => teacher.employment_status === "inactive").length} teacher records marked inactive`} onClick={() => document.getElementById("mobile-teacher-records")?.scrollIntoView({ behavior: "smooth" })} />}
                    {!overview?.pendingLeave && !overview?.unassigned && !teachers.some((teacher) => teacher.employment_status === "inactive") && <p className="py-4 text-sm text-slate-500">No teacher items need attention right now.</p>}
                  </div>
                )}
              </section>
            </>}

            {pageTab === "joining" && <><SchoolJoiningControls role="teacher" /><AccountRequestsPanel role="teacher" onApproved={() => setRefreshKey((value) => value + 1)} /></>}
            {pageTab === "joining" && <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-blue-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20"><ShieldCheck className="h-5 w-5" /></span>
                <div><h2 className="font-bold text-slate-950">Self-registration with school approval</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">Teachers will request an account from the school website. You review their details before portal access is activated.</p></div>
              </div>
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700"><UserPlus className="h-3.5 w-3.5" /> Approval enabled</span>
            </section>}

            {pageTab === "more" && <button type="button" onClick={() => setPageTab("teachers")} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 px-4 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">Back to overview</button>}
            {schoolId && pageTab !== "teachers" && pageTab !== "joining" && <TeacherOperationsPanel key={pageTab} schoolId={schoolId} teachers={teachers} onTeacherChanged={() => setRefreshKey((value) => value + 1)} initialTab={pageTab === "assignments" ? "assignments" : pageTab === "more" ? "overview" : pageTab} showTabs={pageTab === "more"} />}

            {(error || notice) && (
              <div
                role="status"
                className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
              >
                {error ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{error || notice}</span>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                  }}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {temporaryCredentials.length > 0 && showCredentialTray && (
              <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-bold text-slate-950">
                      <KeyRound className="h-4 w-4 text-blue-600" />
                      Temporary credentials
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Kept only on this page until you refresh or close it. Copy them before leaving.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSavedPasswords((value) => !value)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700"
                    >
                      {showSavedPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showSavedPasswords ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={copyAllCredentials}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {allCredentialsCopied ? "Copied all" : "Copy all"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCredentialTray(false)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white"
                      aria-label="Close credentials tray"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {temporaryCredentials.map((item) => (
                    <div key={item.teacherId} className="rounded-xl border border-blue-100 bg-white p-3">
                      <p className="truncate text-sm font-bold text-slate-900">{item.teacherName}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{item.email}</p>
                      <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-800">
                        {showSavedPasswords ? item.password : "••••••••••••"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pageTab === "teachers" && <section id="mobile-teacher-records" className="mt-5 scroll-mt-20 sm:hidden" aria-labelledby="mobile-teachers-title">
              <div className="flex items-center justify-between">
                <h2 id="mobile-teachers-title" className="text-xl font-extrabold text-slate-950 dark:text-white">Teachers</h2>
                <button type="button" onClick={() => setShowAllMobileTeachers((value) => !value)} className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">{showAllMobileTeachers ? "Show less" : "View all"}<ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex gap-2">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search teachers</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teachers by name or subject…" className="h-11 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white" />
                </label>
                <button type="button" aria-label="Filter teachers" aria-expanded={showMobileFilters} onClick={() => setShowMobileFilters((value) => !value)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><SlidersHorizontal className="h-5 w-5" /></button>
              </div>
              {showMobileFilters && <div className="mt-2 grid grid-cols-2 gap-2"><Select value={subject} onChange={setSubject} label="Department" options={subjects} /><Select value={account} onChange={(value) => setAccount(value as typeof account)} label="Account" options={["All", "Active", "Not created"]} /></div>}
              {filteredTeachers.length ? <div className="mt-2 grid grid-cols-2 gap-2">
                {(showAllMobileTeachers || search || subject !== "All" || account !== "All" ? filteredTeachers : filteredTeachers.slice(0, 4)).map((teacher, index) => <MobileTeacherCard key={teacher.id} teacher={teacher} index={index} status={overview?.statuses[teacher.id] || ""} onClick={() => setSelectedTeacher(teacher)} />)}
              </div> : <p className="py-5 text-sm text-slate-500">No teachers match your search.</p>}
              <button type="button" onClick={openCreateForm} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300"><Plus className="h-4 w-4" /> Add teacher</button>
            </section>}

            {pageTab === "teachers" && <section id="teacher-records" className="mt-5 hidden scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-sm sm:block">
              <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="font-bold text-slate-950">Teacher records</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Search, update details, or create teacher login access.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <button type="button" onClick={() => setPageTab("more")} className="hidden min-h-10 items-center gap-1 text-xs font-semibold text-blue-700 focus-visible:ring-2 dark:text-blue-300 sm:inline-flex">More tools <ArrowRight className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} aria-label="Refresh teachers" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /></button>
                  <button type="button" onClick={openCreateForm} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-4 sm:text-sm"><Plus className="h-4 w-4" /><span className="hidden min-[390px]:inline">Add teacher</span><span className="min-[390px]:hidden">Add</span></button>
                </div>
              </div>

              <button type="button" onClick={() => setPageTab("more")} className="flex min-h-10 w-full items-center justify-end gap-1.5 px-4 text-xs font-semibold text-blue-700 dark:text-blue-300 sm:hidden">More teacher tools <ArrowRight className="h-4 w-4" /></button>
              <div className="grid gap-3 border-y border-slate-100 bg-slate-50/60 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_200px_180px]">
                <label className="relative">
                  <span className="sr-only">Search teachers</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, subject, phone or email"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 [color-scheme:light]"
                  />
                </label>
                <Select
                  value={subject}
                  onChange={setSubject}
                  label="Department"
                  options={subjects}
                />
                <Select
                  value={account}
                  onChange={(value) => setAccount(value as typeof account)}
                  label="Account"
                  options={["All", "Active", "Not created"]}
                />
              </div>
              {filteredTeachers.length === 0 ? (
                <EmptyState
                  search={Boolean(
                    search || subject !== "All" || account !== "All",
                  )}
                  onAdd={openCreateForm}
                />
              ) : <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">{filteredTeachers.map((teacher, index) => <TeacherProfileCard key={teacher.id} teacher={teacher} index={index} onView={setSelectedTeacher} onEdit={openEditForm} onLogin={openLogin} />)}</div>}
            </section>}
          </div>
        </main>
      </div>

      <nav aria-label="Principal mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex h-[68px] items-center justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-950 lg:hidden">
        {([{ href: "/principal", label: "Dashboard", Icon: LayoutDashboard }, { href: "/principal/students", label: "Students", Icon: UsersRound }, { href: "/principal/teachers", label: "Teachers", Icon: UserRound }, { href: "/principal/classes", label: "Classes", Icon: School }] as const).map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={label === "Teachers" ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-0.5 text-[10px] ${label === "Teachers" ? "font-bold text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-300"}`}><Icon className="h-5 w-5" aria-hidden="true" />{label}</Link>)}
        <button type="button" onClick={() => document.querySelector<HTMLButtonElement>('button[aria-label="Open sidebar"]')?.click()} className="flex flex-col items-center gap-0.5 text-[10px] text-slate-600 dark:text-slate-300"><MoreHorizontal className="h-5 w-5" aria-hidden="true" />More</button>
      </nav>

      {selectedTeacher && (
        <TeacherDetails
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          onEdit={openEditForm}
          onDelete={deleteTeacher}
          onToggleStatus={toggleTeacherStatus}
          onLogin={openLogin}
        />
      )}
      {formOpen && (
        <TeacherFormModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingTeacher)}
          saving={saving}
          error={error}
          onClose={() => setFormOpen(false)}
          onSubmit={saveTeacher}
        />
      )}
      {loginTeacher && (
        <LoginModal
          teacher={loginTeacher}
          email={loginEmail}
          setEmail={setLoginEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          creating={creatingLogin}
          created={credentialsCreated}
          error={error}
          copied={copied}
          onCopy={copyCredentials}
          onSubmit={createLogin}
          onClose={() => {
            setLoginTeacher(null);
            setError("");
          }}
        />
      )}
    </div>
  );
}

function TeachersHeroArtwork() {
  return <svg viewBox="0 0 360 210" preserveAspectRatio="xMaxYMax meet" className="absolute -bottom-2 -right-3 h-[115%] w-[95%] max-w-none opacity-75 dark:opacity-50 sm:right-0 sm:w-[72%] sm:opacity-100" aria-hidden="true">
    <defs>
      <linearGradient id="teacherBookBlue" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#b9d9ff" /><stop offset="1" stopColor="#2369d0" /></linearGradient>
      <linearGradient id="teacherBookWhite" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#d9e7fb" /></linearGradient>
      <linearGradient id="teacherPot" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#d1e3fa" /></linearGradient>
      <linearGradient id="teacherLeaf" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#64bf6a" /><stop offset="1" stopColor="#167240" /></linearGradient>
    </defs>
    <ellipse cx="231" cy="199" rx="126" ry="8" fill="#4780b6" opacity=".16" />
    <path d="M302 142c-4-29-6-47-1-73m0 73c6-19 20-40 39-55m-38 53c-11-18-25-30-43-40" fill="none" stroke="#29834b" strokeWidth="3" />
    <path d="M297 96c-21-34-15-61 7-83 11 36 6 62-7 83Z" fill="url(#teacherLeaf)" />
    <path d="M306 104c9-31 28-47 49-50-6 27-23 45-49 50Z" fill="#319655" />
    <path d="M297 121c-9-24-25-38-47-40 11 26 26 39 47 40Z" fill="#368d50" />
    <path d="M306 124c13-21 32-31 52-27-13 20-29 29-52 27Z" fill="#459f56" />
    <path d="M279 132h55l-6 49c-2 5-8 7-22 7s-21-2-22-7l-5-49Z" fill="url(#teacherPot)" stroke="#bdd4ed" strokeWidth="2" />
    <path d="M278 133h57" stroke="#f9fcff" strokeWidth="5" strokeLinecap="round" />
    <rect x="143" y="93" width="19" height="73" rx="3" fill="#3579d8" /><rect x="147" y="97" width="4" height="57" fill="#7bb3f3" opacity=".65" />
    <rect x="164" y="88" width="20" height="78" rx="3" fill="#84b7ec" /><rect x="167" y="92" width="3" height="56" fill="#dceeff" opacity=".8" />
    <rect x="187" y="100" width="15" height="66" rx="2" fill="#1c59a8" /><rect x="190" y="104" width="3" height="50" fill="#c8e3ff" opacity=".65" />
    <rect x="205" y="95" width="19" height="71" rx="2" fill="#4a83cc" /><rect x="209" y="98" width="4" height="59" fill="#d5ebff" opacity=".7" />
    <rect x="223" y="105" width="11" height="62" rx="2" fill="#dbad6e" />
    <path d="M88 108 81 52m18 55L101 45m11 63 10-57" stroke="#233f67" strokeWidth="5" strokeLinecap="round" />
    <path d="m79 50 1-11 3 11m16-6 2-12 3 12m16 5 4-10 1 11" fill="#20477b" />
    <path d="M62 112h68l-7 73c-1 4-7 6-27 6s-26-2-27-6l-7-73Z" fill="url(#teacherPot)" stroke="#bcd4ec" strokeWidth="2" />
    <path d="M62 113h68" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    <path d="M132 170h205l-5 27H130l2-27Z" fill="#3373c4" />
    <path d="M136 171h195l-4 21H134l2-21Z" fill="url(#teacherBookWhite)" />
    <path d="M132 170h205" stroke="#86ace0" strokeWidth="5" strokeLinecap="round" />
    <path d="M128 143h211l-3 27H125l3-27Z" fill="#2c68b6" />
    <path d="M130 146h204l-3 19H127l3-19Z" fill="url(#teacherBookWhite)" />
    <path d="M127 143h211" stroke="#87b7eb" strokeWidth="5" strokeLinecap="round" />
    <path d="M135 170h198" stroke="#4b8ce0" strokeWidth="2" />
    <path d="M139 194h191" stroke="#164a93" strokeWidth="3" />
  </svg>;
}

const statTones = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
};

function TeacherStat({ icon: Icon, label, value, tone, onClick }: { icon: React.ElementType; label: string; value: number | null; tone: keyof typeof statTones; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={`${label}: ${value === null ? "Loading" : value}. Open details`} className="group flex min-h-[64px] min-w-0 items-center gap-1 rounded-xl border border-slate-300 bg-white p-1.5 text-left transition hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:min-h-[90px] sm:gap-3 sm:rounded-2xl sm:p-4">
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg min-[420px]:h-9 min-[420px]:w-9 sm:h-12 sm:w-12 sm:rounded-[12px] ${statTones[tone]}`}><Icon className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2.4} aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><span className="block text-[9px] font-medium leading-tight break-words text-slate-700 dark:text-slate-300 min-[420px]:text-[10px] sm:text-sm">{label}</span><span className="mt-0.5 block text-lg font-extrabold leading-none tabular-nums text-slate-950 dark:text-white sm:text-[1.75rem]">{value ?? "—"}</span></span>
    <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600 dark:text-slate-500 sm:block" aria-hidden="true" />
  </button>;
}

function AttentionRow({ icon: Icon, tone, title, detail, onClick }: { icon: React.ElementType; tone: keyof typeof statTones; title: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statTones[tone]}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-950 dark:text-white">{title}</span><span className="block text-xs text-slate-600 dark:text-slate-300">{detail}</span></span>
    <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
  </button>;
}

function MobileTeacherCard({ teacher, index, status, onClick }: { teacher: Teacher; index: number; status: string; onClick: () => void }) {
  const displayStatus = teacher.employment_status === "inactive" ? "Inactive" : status === "present" ? "Present" : status === "late" ? "Late" : status === "absent" ? "Absent" : status === "leave" ? "On leave" : "Not marked";
  const badgeTone = displayStatus === "Present" ? "bg-emerald-100 text-emerald-800" : displayStatus === "Late" ? "bg-amber-100 text-amber-800" : displayStatus === "Absent" || displayStatus === "Inactive" ? "bg-rose-100 text-rose-800" : displayStatus === "On leave" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-600";
  return <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${teacherTones[index % teacherTones.length]}`}>{initials(teacher.name || "Teacher")}</span>
    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-950 dark:text-white">{teacher.name}</span><span className="block truncate text-[11px] text-slate-600 dark:text-slate-300">{teacher.subject || "Subject not assigned"}</span><span className={`mt-0.5 inline-block max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badgeTone}`}>{displayStatus}</span></span>
  </button>;
}

const teacherTones = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

function TeacherProfileCard({ teacher, index, onView, onEdit, onLogin }: TeacherActions & { index: number; onEdit: (teacher: Teacher) => void }) {
  return <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${teacherTones[index % teacherTones.length]}`} aria-hidden="true" /><div className="flex items-start gap-3"><button type="button" onClick={() => onView(teacher)} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-extrabold text-white shadow-md ${teacherTones[index % teacherTones.length]}`} aria-label={`View ${teacher.name}`}>{initials(teacher.name || "Teacher")}</button><div className="min-w-0 flex-1"><button type="button" onClick={() => onView(teacher)} className="block max-w-full truncate text-left font-bold text-slate-950 transition hover:text-blue-700">{teacher.name}</button><p className="mt-1 truncate text-xs font-semibold text-slate-500">{teacher.subject || "Subject not assigned"}</p></div><AccountBadge active={Boolean(teacher.user_id)} /></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-slate-400">Qualification</p><p className="mt-1 truncate font-semibold text-slate-700">{teacher.qualification || "Not added"}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-slate-400">Contact</p><p className="mt-1 truncate font-semibold text-slate-700">{teacher.phone || teacher.email || "Not added"}</p></div></div><div className="mt-4 flex gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => onEdit(teacher)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Edit3 className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => onLogin(teacher)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"><KeyRound className="h-3.5 w-3.5" />{teacher.user_id ? "Reset" : "Access"}</button></div></article>;
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

type TeacherActions = {
  teacher: Teacher;
  onView: (teacher: Teacher) => void;
  onLogin: (teacher: Teacher) => void;
};
function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
      {initials(name || "Teacher")}
    </span>
  );
}
function AccountBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
    >
      {active ? (
        <UserCheck className="h-3 w-3" />
      ) : (
        <KeyRound className="h-3 w-3" />
      )}
      {active ? "Active" : "Not created"}
    </span>
  );
}

function TeacherDetails({
  teacher,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
  onLogin,
}: {
  teacher: Teacher;
  onClose: () => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onToggleStatus: (teacher: Teacher) => void;
  onLogin: (teacher: Teacher) => void;
}) {
  return (
    <Modal onClose={onClose} width="max-w-lg">
      <div className="flex items-start justify-between border-b border-slate-100 p-6">
        <div className="flex gap-3">
          <Avatar name={teacher.name} />
          <div>
            <h2 className="text-lg font-bold text-slate-950">{teacher.name}</h2>
            <p className="text-sm text-slate-500">
              {teacher.subject || "Subject not assigned"}
            </p>
          </div>
        </div>
        <Close onClick={onClose} />
      </div>
      <div className="p-6">
        <AccountBadge active={Boolean(teacher.user_id)} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info icon={Phone} label="Phone" value={teacher.phone} />
          <Info icon={Mail} label="Email" value={teacher.email} />
          <Info
            icon={GraduationCap}
            label="Qualification"
            value={teacher.qualification}
          />
          <Info icon={MapPin} label="Address" value={teacher.address} />
          <Info icon={UsersRound} label="Department" value={teacher.department} />
          <Info icon={CalendarDays} label="Joining date" value={teacher.joining_date} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(teacher)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
          >
            {teacher.employment_status === "inactive" ? "Reactivate" : "Deactivate"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(teacher)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Edit3 className="h-4 w-4" />
            Edit details
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogin(teacher);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700"
          >
            <KeyRound className="h-4 w-4" />
            {teacher.user_id ? "Reset access" : "Create login"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(teacher)}
            className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {value || "Not added"}
      </p>
    </div>
  );
}

function TeacherFormModal({
  form,
  setForm,
  editing,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  form: TeacherForm;
  setForm: React.Dispatch<React.SetStateAction<TeacherForm>>;
  editing: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const field = (key: keyof TeacherForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal onClose={onClose} width="max-w-2xl">
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {editing ? "Edit teacher" : "Add teacher"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep staff information accurate and complete.
            </p>
          </div>
          <Close onClick={onClose} />
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <Field
            label="Full name"
            value={form.name}
            onChange={(value) => field("name", value)}
            required
          />
          <Field
            label="Subject"
            value={form.subject}
            onChange={(value) => field("subject", value)}
          />
          <Field
            label="Department"
            value={form.department}
            onChange={(value) => field("department", value)}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(value) => field("phone", value)}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => field("email", value)}
          />
          <Field
            label="Qualification"
            value={form.qualification}
            onChange={(value) => field("qualification", value)}
          />
          <Field
            label="Monthly salary"
            type="number"
            value={form.salary}
            onChange={(value) => field("salary", value)}
          />
          <Field
            label="Joining date"
            type="date"
            value={form.joining_date}
            onChange={(value) => field("joining_date", value)}
          />
          <Field
            label="Date of birth"
            type="date"
            value={form.date_of_birth}
            onChange={(value) => field("date_of_birth", value)}
          />
          <label className="text-sm font-semibold text-slate-700">
            Employment status
            <select value={form.employment_status} onChange={(event) => field("employment_status", event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On leave</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <Field
              label="Address"
              value={form.address}
              onChange={(value) => field("address", value)}
            />
          </div>
          {error && (
            <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            disabled={saving || !form.name.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add teacher"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        required={required}
        type={type}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 [color-scheme:light]"
      />
    </label>
  );
}

function LoginModal({
  teacher,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  creating,
  created,
  error,
  copied,
  onCopy,
  onSubmit,
  onClose,
}: {
  teacher: Teacher;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  creating: boolean;
  created: boolean;
  error: string;
  copied: boolean;
  onCopy: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} width="max-w-md">
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {created
                ? teacher.user_id
                  ? "Access reset"
                  : "Login created"
                : teacher.user_id
                  ? "Reset teacher access"
                  : "Create teacher login"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{teacher.name}</p>
          </div>
          <Close onClick={onClose} />
        </div>
        <div className="space-y-4 p-6">
          {created && (
            <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              <Check className="h-4 w-4" />
              Share this temporary password securely. The teacher must replace it after signing in.
            </div>
          )}
          {error && (
            <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Field
            label="Login email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Temporary password
            </span>
            <span className="relative block">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-20 font-mono text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 [color-scheme:light]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>
          <button
            type="button"
            onClick={() => setPassword(createPassword())}
            className="text-xs font-semibold text-blue-600"
          >
            Generate another password
          </button>
        </div>
        <div className="flex gap-2 border-t border-slate-100 p-4">
          {created ? (
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy credentials"}
            </button>
          ) : (
            <div className="flex-1">
              <button
                disabled={creating || !email.trim() || password.length < 8}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? teacher.user_id
                    ? "Resetting access…"
                    : "Creating login…"
                  : teacher.user_id
                    ? "Create new temporary password"
                    : "Create teacher login"}
              </button>
              {!creating && (!email.trim() || password.length < 8) && (
                <p className="mt-1.5 text-center text-[10px] text-slate-500">
                  {!email.trim() ? "Enter the teacher’s email." : "Password must contain at least 8 characters."}
                </p>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
function Modal({
  children,
  onClose,
  width,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white text-slate-900 shadow-2xl [color-scheme:light] ${width}`}
      >
        {children}
      </div>
    </div>
  );
}
function Close({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
      aria-label="Close"
    >
      <X className="h-5 w-5" />
    </button>
  );
}
function EmptyState({ search, onAdd }: { search: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {search ? (
          <Search className="h-5 w-5" />
        ) : (
          <UserRound className="h-5 w-5" />
        )}
      </span>
      <h3 className="mt-4 font-bold text-slate-900">
        {search ? "No matching teachers" : "No teachers added yet"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {search
          ? "Try changing the search or filters."
          : "Add your first teacher to build the staff directory."}
      </p>
      {!search && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add teacher
        </button>
      )}
    </div>
  );
}
function TeachersSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pt-10 lg:ml-64">
        <TopBar />
        <main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px] animate-pulse">
            <div className="h-24 border-b border-slate-200" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-32 rounded-2xl bg-white" />
              ))}
            </div>
            <div className="mt-6 h-96 rounded-2xl bg-white" />
          </div>
        </main>
      </div>
    </div>
  );
}
