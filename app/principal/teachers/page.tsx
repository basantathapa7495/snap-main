"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  BookOpen,
  CircleCheck,
  Clock3,
  Camera,
  Check,
  ChevronRight,
  ChevronDown,
  Copy,
  ContactRound,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  UserRound,
  UsersRound,
  LayoutDashboard,
  MessageCircle,
  Phone,
  School,
  MoreHorizontal,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import TeacherOperationsPanel from "@/components/TeacherOperationsPanel";
import SchoolJoiningControls from "@/components/SchoolJoiningControls";
import TeacherProfile from "@/components/TeacherProfile";
import TeacherAvatar from "@/components/TeacherAvatar";
import { activateTeacherAvatarCache, removeTeacherAvatar, uploadTeacherAvatar } from "@/lib/teacher-avatars";
import { cleanupTeacherAvatar, resumeTeacherAvatarCleanup } from "@/lib/teacher-avatar-cleanup";
import { prepareTeacherPhoto } from "@/lib/teacher-photo";
import { uploadTeacherPhotoWithRetry } from "@/lib/teacher-photo-upload";
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
  employee_id: string | null;
  left_at: string | null;
  avatar_path?: string | null;
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
  employee_id: string;
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
  employee_id: "",
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
  const [grade, setGrade] = useState("All");
  const [subjectOptions, setSubjectOptions] = useState<string[]>(["All"]);
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
  const [overviewError, setOverviewError] = useState("");
  const [showAllMobileTeachers, setShowAllMobileTeachers] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [teacherPhoto, setTeacherPhoto] = useState<File | null>(null);
  const [teacherPhotoPreview, setTeacherPhotoPreview] = useState("");
  const [removeTeacherPhoto, setRemoveTeacherPhoto] = useState(false);
  const [avatarScope, setAvatarScope] = useState("");
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const photoSelection = useRef(0);

  useEffect(() => () => { if (teacherPhotoPreview.startsWith("blob:")) URL.revokeObjectURL(teacherPhotoPreview); }, [teacherPhotoPreview]);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "attendance" || requestedTab === "leave" || requestedTab === "assignments" || requestedTab === "joining" || requestedTab === "more") {
      // Read the deep link after hydration so the server and first client render match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPageTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    const dialogOpen = formOpen || Boolean(loginTeacher);
    document.body.classList.toggle("teacher-dialog-open", dialogOpen);
    return () => document.body.classList.remove("teacher-dialog-open");
  }, [formOpen, loginTeacher]);

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
        const [teachersResult, subjectsResult] = await Promise.all([
          supabase
            .from("teachers")
            .select(
              "id, school_id, name, subject, phone, email, qualification, address, salary, created_at, user_id, department, joining_date, date_of_birth, employment_status, employee_id, left_at, avatar_path",
            )
            .eq("school_id", profile.school_id)
            .order("created_at", { ascending: false }),
          supabase
            .from("school_subjects")
            .select("name")
            .eq("school_id", profile.school_id)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
        ]);
        if (teachersResult.error) throw teachersResult.error;
        if (subjectsResult.error) throw subjectsResult.error;
        const data = teachersResult.data;
        if (!cancelled) {
          setSchoolId(profile.school_id);
          const scope = activateTeacherAvatarCache(user.id, profile.school_id);
          setAvatarScope(scope);
          resumeTeacherAvatarCleanup(scope);
          setTeachers((data || []) as Teacher[]);
          setSubjectOptions([
            "All",
            ...(subjectsResult.data || []).map((item) => item.name),
          ]);
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
        const active = teachers.filter((teacher) => teacher.employment_status !== "inactive" && !teacher.left_at);
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
    }
    void loadOverview();
    return () => { cancelled = true; };
  }, [schoolId, pageTab, refreshKey, teachers]);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const matchesSearch =
        !query ||
        [teacher.name, teacher.subject, teacher.phone, teacher.email].some(
          (value) => value?.toLowerCase().includes(query),
        );
      const teacherSubject = (teacher.subject || teacher.department || "").trim().toLowerCase();
      const matchesSubject =
        subject === "All" || teacherSubject === subject.trim().toLowerCase();
      return matchesSearch && matchesSubject;
    });
  }, [search, subject, teachers]);

  function openCreateForm() {
    photoSelection.current++;
    setPreparingPhoto(false);
    setEditingTeacher(null);
    setForm(emptyForm);
    setError("");
    setTeacherPhoto(null);
    setTeacherPhotoPreview("");
    setRemoveTeacherPhoto(false);
    setFormOpen(true);
  }

  function openEditForm(teacher: Teacher) {
    photoSelection.current++;
    setPreparingPhoto(false);
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
      employee_id: teacher.employee_id || "",
    });
    setSelectedTeacher(null);
    setError("");
    setTeacherPhoto(null);
    setTeacherPhotoPreview("");
    setRemoveTeacherPhoto(false);
    setFormOpen(true);
  }

  async function chooseTeacherPhoto(file: File | null) {
    setError("");
    if (!file) return;
    const selection = ++photoSelection.current;
    setPreparingPhoto(true);
    try {
      const prepared = await prepareTeacherPhoto(file);
      if (selection !== photoSelection.current) return;
      setTeacherPhoto(prepared);
      setTeacherPhotoPreview(URL.createObjectURL(prepared));
      setRemoveTeacherPhoto(false);
    } catch (cause) {
      if (selection === photoSelection.current) setError(cause instanceof Error ? cause.message : "Could not prepare profile picture.");
    } finally { if (selection === photoSelection.current) setPreparingPhoto(false); }
  }

  async function saveTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !form.name.trim() || saving || preparingPhoto) return;
    setSaving(true);
    setError("");
    const teacherId = editingTeacher?.id || crypto.randomUUID();
    let uploadedPath = "";
    let createdTeacher = false;
    let avatarPath = removeTeacherPhoto ? null : editingTeacher?.avatar_path || null;
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
      employee_id: form.employee_id.trim() || null,
      avatar_path: avatarPath,
    };
    try {
      if (!editingTeacher) {
        const created = await supabase.from("teachers").insert({ id: teacherId, ...teacherData }).select("id").single();
        if (created.error) throw created.error;
        createdTeacher = true;
      }
      if (teacherPhoto) {
        uploadedPath = `${schoolId}/${teacherId}/${crypto.randomUUID()}.webp`;
        await uploadTeacherPhotoWithRetry(async () => {
          await uploadTeacherAvatar(uploadedPath, teacherPhoto);
          return { error: null };
        });
        avatarPath = uploadedPath;
        teacherData.avatar_path = uploadedPath;
      }
      const result = editingTeacher || teacherPhoto
        ? await supabase
            .from("teachers")
            .update(teacherData)
            .eq("id", teacherId)
            .eq("school_id", schoolId)
            .select("id").single()
        : { error: null };
      if (result.error) throw result.error;
      if (editingTeacher?.avatar_path && editingTeacher.avatar_path !== avatarPath) {
        void cleanupTeacherAvatar(avatarScope, { teacherId, path: editingTeacher.avatar_path });
      }
      photoSelection.current++;
      setFormOpen(false);
      setNotice(
        editingTeacher
          ? "Teacher details updated."
          : "Teacher added successfully.",
      );
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      // A network error may occur after the row committed. Read it back before
      // deleting an upload, so a saved photo never becomes a broken reference.
      if (uploadedPath) {
        const check = await supabase.from("teachers").select("avatar_path").eq("id", teacherId).eq("school_id", schoolId).maybeSingle();
        if (!check.error && check.data?.avatar_path !== uploadedPath) {
          if (check.data) void cleanupTeacherAvatar(avatarScope, { teacherId, path: uploadedPath });
          else {
            try { await removeTeacherAvatar(uploadedPath); }
            catch { console.warn("Uncommitted teacher photo cleanup failed."); }
          }
        }
      }
      if (createdTeacher) setRefreshKey((value) => value + 1);
      console.error("Teacher save error", saveError);
      setError(
        saveError instanceof Error
          ? `${createdTeacher ? "Teacher was added, but the photo or remaining changes could not be saved. Edit this teacher to retry. " : ""}${saveError.message}`
          : "Teacher could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTeacherStatus(teacher: Teacher) {
    if (!schoolId) return;
    const nextStatus = teacher.left_at || teacher.employment_status === "inactive" ? "active" : "inactive";
    const { error: statusError } = await supabase
      .from("teachers")
      .update({ employment_status: nextStatus, left_at: nextStatus === "active" ? null : teacher.left_at })
      .eq("id", teacher.id)
      .eq("school_id", schoolId);
    if (statusError) {
      setError(statusError.message);
      setSelectedTeacher(null);
      return;
    }
    setSelectedTeacher(null);
    setNotice(nextStatus === "inactive" ? "Teacher deactivated." : "Teacher reactivated.");
    setRefreshKey((value) => value + 1);
  }

  async function markTeacherLeft(teacher: Teacher) {
    if (!schoolId) return;
    if (teacher.user_id) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Sign in again before marking this teacher as left."); setSelectedTeacher(null); return; }
      const response = await fetch("/api/teacher-profile-account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ teacherId: teacher.id, action: "suspend" }),
      });
      if (!response.ok) { setError("Portal access could not be removed; the teacher record was not changed."); setSelectedTeacher(null); return; }
    }
    const { error: statusError } = await supabase.from("teachers")
      .update({ employment_status: "inactive", left_at: todayInNepal() })
      .eq("id", teacher.id).eq("school_id", schoolId);
    if (statusError) { setError(teacher.user_id ? `Portal access was suspended, but the teacher record could not be updated: ${statusError.message}` : statusError.message); setSelectedTeacher(null); return; }
    setSelectedTeacher(null);
    setNotice(`${teacher.name} marked as having left the school.`);
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
        <main className="flex-1 px-3.5 pb-28 pt-0 sm:px-6 sm:pt-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="relative -mx-3.5 aspect-[3/1] min-h-[112px] overflow-hidden bg-[#eef6ff] sm:mx-0 sm:rounded-2xl sm:border sm:border-blue-100 dark:sm:border-blue-900/60">
              <h1 className="sr-only">Teachers</h1>
              <Image src="/teacher.png" alt="Teachers — Manage teachers, attendance, leave and school access." fill priority sizes="(max-width: 639px) 100vw, (max-width: 1023px) calc(100vw - 3rem), calc(100vw - 20rem)" className="object-cover" />
            </header>

            <nav aria-label="Teachers sections" className="-mx-3.5 mt-0 flex gap-0.5 overflow-x-auto border-b border-slate-200 bg-white p-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:mx-0 sm:mt-1 sm:border sm:p-1">
              {([
                ["teachers", "Overview"],
                ["attendance", "Attendance"],
                ["leave", "Leave"],
                ["assignments", "Assignments"],
                ["joining", "Joining"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setPageTab(value)}
                  aria-current={pageTab === value ? "page" : undefined}
                  className={`relative min-h-8 flex-1 shrink-0 whitespace-nowrap px-2 text-[10px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 min-[420px]:px-3 min-[420px]:text-[11px] sm:min-h-10 sm:px-4 sm:text-sm ${
                    pageTab === value
                      ? "border border-emerald-200 bg-emerald-50 font-bold text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200"
                      : "border border-slate-200 bg-slate-50/70 font-semibold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/25 dark:hover:text-emerald-200"
                  }`}>
                  {label}
                </button>
              ))}
            </nav>

            {pageTab === "teachers" && <>
              {overviewError && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{overviewError}</p>}
            </>}

            {pageTab === "joining" && <>
              <SchoolJoiningControls role="teacher" />
              <section aria-label="Teacher joining approval" className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20 sm:p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0 border-l border-amber-200 pl-3 dark:border-amber-800"><h2 className="font-bold text-slate-900 dark:text-white">Approval required</h2><p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">All teacher joining requests must be approved by the principal before portal access is granted.</p></div>
              </section>
              <AccountRequestsPanel role="teacher" onApproved={() => setRefreshKey((value) => value + 1)} />
            </>}

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

            {pageTab === "teachers" && <section id="mobile-teacher-records" className="mt-2 scroll-mt-20 sm:hidden" aria-label="Teachers">
              <div className="flex gap-2 px-0.5">
                <label className="group relative min-w-0 flex-1">
                  <span className="sr-only">Search teachers</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or subject" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-500 hover:border-slate-300 focus:border-emerald-400 focus:bg-slate-50 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-600 dark:focus:bg-slate-800 dark:focus:ring-emerald-950" />
                </label>
                <button type="button" aria-label="Filter teachers" aria-expanded={showMobileFilters} aria-pressed={showMobileFilters} onClick={() => setShowMobileFilters((value) => !value)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 dark:focus-visible:ring-emerald-950 ${showMobileFilters ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "border-slate-200 bg-slate-100 text-slate-600 hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}><SlidersHorizontal className="h-5 w-5" /></button>
              </div>
              {showMobileFilters && <div className="mt-2 grid grid-cols-2 gap-2"><Select value={grade} onChange={setGrade} label="Class" options={["All"]} allLabel="Class" /><Select value={subject} onChange={setSubject} label="Subject" options={subjectOptions} allLabel="Subjects" /></div>}
              {filteredTeachers.length ? <>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(showAllMobileTeachers ? filteredTeachers : filteredTeachers.slice(0, 10)).map((teacher, index) => <MobileTeacherCard key={teacher.id} teacher={teacher} avatarScope={avatarScope} index={index} status={overview?.statuses[teacher.id] || ""} onClick={() => setSelectedTeacher(teacher)} />)}
                </div>
                {filteredTeachers.length > 10 && <button type="button" onClick={() => setShowAllMobileTeachers((value) => !value)} aria-expanded={showAllMobileTeachers} className="mx-auto mt-3 flex min-h-10 items-center gap-1 px-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{showAllMobileTeachers ? "Show less" : "View more"}<ChevronRight className={`h-4 w-4 transition-transform ${showAllMobileTeachers ? "-rotate-90" : "rotate-90"}`} /></button>}
              </> : <p className="py-5 text-sm text-slate-500">No teachers match your search.</p>}
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
                  value={grade}
                  onChange={setGrade}
                  label="Class"
                  options={["All"]}
                  allLabel="Class"
                />
                <Select
                  value={subject}
                  onChange={setSubject}
                  label="Subject"
                  options={subjectOptions}
                  allLabel="Subjects"
                />
              </div>
              {filteredTeachers.length === 0 ? (
                <EmptyState
                  search={Boolean(
                    search || subject !== "All" || grade !== "All",
                  )}
                  onAdd={openCreateForm}
                />
              ) : <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">{filteredTeachers.map((teacher, index) => <TeacherProfileCard key={teacher.id} teacher={teacher} avatarScope={avatarScope} index={index} onView={setSelectedTeacher} onEdit={openEditForm} onLogin={openLogin} />)}</div>}
            </section>}
          </div>
        </main>
      </div>

      {!selectedTeacher && !formOpen && !loginTeacher && <nav aria-label="Principal mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex h-[68px] items-center justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-950 lg:hidden">
        {([{ href: "/principal", label: "Dashboard", Icon: LayoutDashboard }, { href: "/principal/students", label: "Students", Icon: UsersRound }, { href: "/principal/teachers", label: "Teachers", Icon: UserRound }, { href: "/principal/classes", label: "Classes", Icon: School }] as const).map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={label === "Teachers" ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-0.5 text-[10px] ${label === "Teachers" ? "font-bold text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-300"}`}><Icon className="h-5 w-5" aria-hidden="true" />{label}</Link>)}
        <button type="button" onClick={() => document.querySelector<HTMLButtonElement>('button[aria-label="Open sidebar"]')?.click()} className="flex flex-col items-center gap-0.5 text-[10px] text-slate-600 dark:text-slate-300"><MoreHorizontal className="h-5 w-5" aria-hidden="true" />More</button>
      </nav>}

      {selectedTeacher && (
        <TeacherProfile
          teacher={selectedTeacher}
          avatarScope={avatarScope}
          onClose={() => setSelectedTeacher(null)}
          onEdit={openEditForm}
          onToggleStatus={toggleTeacherStatus}
          onMarkLeft={markTeacherLeft}
          onLogin={openLogin}
          onReassign={() => { setSelectedTeacher(null); setPageTab("assignments"); }}
        />
      )}
      {formOpen && (
        <TeacherFormModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingTeacher)}
          saving={saving}
          error={error}
          photoPreview={teacherPhotoPreview}
          existingPhotoPath={editingTeacher?.avatar_path}
          avatarScope={avatarScope}
          preparingPhoto={preparingPhoto}
          hasExistingPhoto={Boolean(editingTeacher?.avatar_path)}
          removePhoto={removeTeacherPhoto}
          onPhotoChange={chooseTeacherPhoto}
          onRemovePhoto={() => {
            photoSelection.current++;
            setPreparingPhoto(false);
            setTeacherPhoto(null);
            setTeacherPhotoPreview("");
            setRemoveTeacherPhoto(true);
          }}
          onClose={() => {
            if (saving) return;
            photoSelection.current++;
            setPreparingPhoto(false);
            setTeacherPhoto(null);
            setTeacherPhotoPreview("");
            setFormOpen(false);
          }}
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

function MobileTeacherCard({ teacher, avatarScope, index, status, onClick }: { teacher: Teacher; avatarScope: string; index: number; status: string; onClick: () => void }) {
  const displayStatus = teacher.employment_status === "inactive" ? "Inactive" : status === "present" ? "Present" : status === "late" ? "Late" : status === "absent" ? "Absent" : status === "leave" ? "On leave" : "Not marked";
  const statusTone = displayStatus === "Present" ? "bg-emerald-100 text-emerald-800" : displayStatus === "Late" ? "bg-amber-100 text-amber-800" : displayStatus === "Absent" || displayStatus === "Inactive" ? "bg-rose-100 text-rose-800" : displayStatus === "On leave" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-600";
  const StatusIcon = displayStatus === "Present" ? CircleCheck : displayStatus === "Late" ? Clock3 : displayStatus === "Absent" || displayStatus === "Inactive" || displayStatus === "On leave" ? UserMinus : Clock3;
  const subject = teacher.subject || teacher.department || "Subject not assigned";
  return <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex min-w-0 items-start gap-1.5">
      <button type="button" onClick={onClick} className="shrink-0 rounded-lg" aria-label={`View ${teacher.name}`}>
        <TeacherAvatar name={teacher.name} path={teacher.avatar_path} scope={avatarScope} className={`h-11 w-11 rounded-lg bg-gradient-to-br text-xs font-bold text-white ${teacherTones[index % teacherTones.length]}`} />
      </button>
      <button type="button" onClick={onClick} className="min-w-0 flex-1 overflow-hidden text-left">
        <span className="block truncate whitespace-nowrap text-sm font-extrabold leading-tight text-slate-950 dark:text-white">{teacher.name}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] text-slate-600 dark:text-slate-300"><BookOpen className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-400" /><span className="truncate whitespace-nowrap">{subject}</span></span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] text-slate-600 dark:text-slate-300"><Phone className="h-3 w-3 shrink-0 fill-slate-500 text-slate-600 dark:fill-slate-400 dark:text-slate-300" /><span className="truncate whitespace-nowrap">{teacher.phone || "Phone not added"}</span></span>
      </button>
    </div>
    <div className="mt-1.5 flex min-w-0 items-center justify-start gap-1">
      <span className={`inline-flex h-6 min-w-[4.25rem] items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap rounded-md px-2 text-[9px] font-bold ${statusTone}`}><StatusIcon className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{displayStatus}</span></span>
      {teacher.user_id ? <Link href={`/principal/communication?tab=messages&recipient=${encodeURIComponent(teacher.user_id)}`} className="inline-flex h-6 min-w-0 items-center gap-0.5 overflow-hidden whitespace-nowrap rounded-md bg-blue-50 px-1.5 text-[9px] font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"><MessageCircle className="h-2.5 w-2.5 shrink-0" /><span className="truncate">Message</span></Link> : <span className="inline-flex h-6 min-w-0 items-center gap-0.5 overflow-hidden whitespace-nowrap rounded-md bg-amber-50 px-1.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Clock3 className="h-2.5 w-2.5 shrink-0" /><span className="truncate">Login pending</span></span>}
    </div>
  </article>;
}

const teacherTones = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

function TeacherProfileCard({ teacher, avatarScope, index, onView, onEdit, onLogin }: TeacherActions & { avatarScope: string; index: number; onEdit: (teacher: Teacher) => void }) {
  return <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${teacherTones[index % teacherTones.length]}`} aria-hidden="true" /><div className="flex items-start gap-3"><button type="button" onClick={() => onView(teacher)} className="shrink-0 rounded-2xl" aria-label={`View ${teacher.name}`}><TeacherAvatar name={teacher.name} path={teacher.avatar_path} scope={avatarScope} className={`h-12 w-12 rounded-2xl bg-gradient-to-br text-sm font-extrabold text-white shadow-md ${teacherTones[index % teacherTones.length]}`} /></button><div className="min-w-0 flex-1"><button type="button" onClick={() => onView(teacher)} className="block max-w-full truncate text-left font-bold text-slate-950 transition hover:text-blue-700">{teacher.name}</button><p className="mt-1 truncate text-xs font-semibold text-slate-500">{teacher.subject || "Subject not assigned"}</p></div><AccountBadge active={Boolean(teacher.user_id)} /></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-slate-400">Qualification</p><p className="mt-1 truncate font-semibold text-slate-700">{teacher.qualification || "Not added"}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-slate-400">Contact</p><p className="mt-1 truncate font-semibold text-slate-700">{teacher.phone || teacher.email || "Not added"}</p></div></div><div className="mt-4 flex gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => onEdit(teacher)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Edit3 className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => onLogin(teacher)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"><KeyRound className="h-3.5 w-3.5" />{teacher.user_id ? "Reset" : "Access"}</button></div></article>;
}

function Select({
  value,
  onChange,
  label,
  options,
  allLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const displayValue = value === "All" && allLabel ? allLabel : value;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm font-medium text-slate-700 outline-none transition ${open ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-[65] mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
        >
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selected ? "bg-emerald-50 font-bold text-emerald-700" : "font-medium text-slate-700 hover:bg-slate-50"}`}
              >
                <span className="truncate">{option}</span>
                <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${selected ? "border-emerald-600 bg-emerald-600 shadow-[inset_0_0_0_3px_white]" : "border-slate-300"}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type TeacherActions = {
  teacher: Teacher;
  onView: (teacher: Teacher) => void;
  onLogin: (teacher: Teacher) => void;
};
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

function TeacherFormModal({
  form,
  setForm,
  editing,
  saving,
  error,
  photoPreview,
  existingPhotoPath,
  avatarScope,
  preparingPhoto,
  hasExistingPhoto,
  removePhoto,
  onPhotoChange,
  onRemovePhoto,
  onClose,
  onSubmit,
}: {
  form: TeacherForm;
  setForm: React.Dispatch<React.SetStateAction<TeacherForm>>;
  editing: boolean;
  saving: boolean;
  error: string;
  photoPreview: string;
  existingPhotoPath?: string | null;
  avatarScope: string;
  preparingPhoto: boolean;
  hasExistingPhoto: boolean;
  removePhoto: boolean;
  onPhotoChange: (file: File | null) => void;
  onRemovePhoto: () => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const field = (key: keyof TeacherForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal onClose={onClose} width="max-w-2xl" scroll={false}>
      <form onSubmit={onSubmit} className="flex h-dvh flex-col overflow-hidden sm:h-auto sm:max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-4 py-4 sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><UserPlus className="h-5 w-5" /></span>
            <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-950 sm:text-xl">
              {editing ? "Edit teacher" : "Add teacher"}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
              Keep staff information accurate and complete.
            </p>
            </div>
          </div>
          <Close onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f6f8fc] px-3.5 py-4 sm:p-6">
          <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">Only essential staff information is needed. Portal login access can be created separately after saving.</p>

          <TeacherFormSection icon={UserRound} title="Basic information" description="Identity details used in the staff directory.">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {existingPhotoPath && !photoPreview && !removePhoto ? <TeacherAvatar name={form.name || "Teacher"} path={existingPhotoPath} scope={avatarScope} className="h-16 w-16 rounded-2xl border border-slate-200 bg-white text-slate-500" /> : <span role={photoPreview && !removePhoto ? "img" : undefined} aria-label={photoPreview && !removePhoto ? "Teacher profile preview" : undefined} style={photoPreview && !removePhoto ? { backgroundImage: `url(${photoPreview})` } : undefined} className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white bg-cover bg-center text-slate-400 ${photoPreview && !removePhoto ? "" : "bg-none"}`}>
                  {(!photoPreview || removePhoto) && <UserRound className="h-7 w-7" aria-hidden="true" />}
                </span>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Profile picture <span className="font-medium text-slate-400">(optional)</span></p>
                  <p role="status" className="mt-0.5 text-[11px] leading-4 text-slate-500">{preparingPhoto ? "Optimizing picture…" : "JPG, PNG or WebP, up to 2 MB. Optimized automatically."}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                      {(photoPreview || hasExistingPhoto) && !removePhoto ? "Change photo" : "Upload photo"}
                      <input disabled={saving} aria-label="Upload teacher profile picture" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { onPhotoChange(event.target.files?.[0] || null); event.target.value = ""; }} />
                    </label>
                    {(photoPreview || hasExistingPhoto) && !removePhoto && <button type="button" onClick={onRemovePhoto} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Remove</button>}
                  </div>
                </div>
              </div>
            </div>
            <Field label="Full name" value={form.name} onChange={(value) => field("name", value)} placeholder="Enter teacher's full name" required />
          </TeacherFormSection>

          <TeacherFormSection icon={ContactRound} title="Contact details" description="How the school can reach this teacher.">
            <Field label="Phone number" type="tel" value={form.phone} onChange={(value) => field("phone", value)} placeholder="e.g. 98XXXXXXXX" />
            <Field label="Email address" type="email" value={form.email} onChange={(value) => field("email", value)} placeholder="teacher@example.com" />
            <div className="sm:col-span-2"><Field label="Address" value={form.address} onChange={(value) => field("address", value)} placeholder="Current address" /></div>
          </TeacherFormSection>

          <TeacherFormSection icon={BriefcaseBusiness} title="Employment" description="Current working status at the school.">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Employment status</span><select value={form.employment_status} onChange={(event) => field("employment_status", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On leave</option></select></label>
          </TeacherFormSection>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        </div>
        <div className="sticky bottom-0 z-20 grid shrink-0 grid-cols-2 gap-2.5 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:static sm:flex sm:justify-end sm:px-6 sm:py-4 sm:shadow-none">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={saving || preparingPhoto || !form.name.trim()}
            className="min-h-11 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        required={required}
        type={type}
        min={type === "number" ? "0" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [color-scheme:light]"
      />
    </label>
  );
}

function TeacherFormSection({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4"><div className="mb-3 flex items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-4.5 w-4.5" /></span><div className="min-w-0"><h3 className="text-sm font-extrabold text-slate-950">{title}</h3><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p></div></div><div className="grid gap-3.5 sm:grid-cols-2">{children}</div></section>;
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
  scroll = true,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width: string;
  scroll?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`${scroll ? "max-h-[94dvh] overflow-y-auto" : "h-dvh overflow-hidden sm:h-auto"} w-full bg-white text-slate-900 shadow-2xl [color-scheme:light] sm:max-h-[90vh] sm:rounded-2xl ${width}`}
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
