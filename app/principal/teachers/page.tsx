"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
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
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
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
};

const emptyForm: TeacherForm = {
  name: "",
  subject: "",
  phone: "",
  email: "",
  qualification: "",
  address: "",
  salary: "",
};

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
            "id, school_id, name, subject, phone, email, qualification, address, salary, created_at, user_id",
          )
          .eq("school_id", profile.school_id)
          .order("created_at", { ascending: false });
        if (teachersError) throw teachersError;
        if (!cancelled) {
          setSchoolId(profile.school_id);
          setTeachers((data || []) as Teacher[]);
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

  const subjects = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          teachers
            .map((teacher) => teacher.subject)
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
      const matchesSubject = subject === "All" || teacher.subject === subject;
      const matchesAccount =
        account === "All" ||
        (account === "Active" ? Boolean(teacher.user_id) : !teacher.user_id);
      return matchesSearch && matchesSubject && matchesAccount;
    });
  }, [account, search, subject, teachers]);

  const activeAccounts = teachers.filter((teacher) => teacher.user_id).length;
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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-600">
                  Staff management
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Manage teachers
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Add staff, maintain their records, and control login access.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <GraduationCap className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {teachers.length} teacher{teachers.length === 1 ? "" : "s"}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-medium text-slate-500">
                      <span className="text-emerald-700">{activeAccounts} login active</span>
                      <span aria-hidden="true">·</span>
                      <span className={teachers.length - activeAccounts ? "text-amber-700" : "text-slate-500"}>
                        {teachers.length - activeAccounts} need login
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{Math.max(0, subjects.length - 1)} subjects</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRefreshKey((value) => value + 1)}
                    disabled={refreshing}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:flex-none"
                  >
                    <Plus className="h-4 w-4" />
                    Add teacher
                  </button>
                </div>
              </div>
            </header>

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

            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="font-bold text-slate-950">Teacher records</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Search, update details, or create teacher login access.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {filteredTeachers.length} of {teachers.length}
                </span>
              </div>

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
                  label="Subject"
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
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="border-y border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Teacher</th>
                          <th className="px-5 py-3 font-semibold">Subject</th>
                          <th className="px-5 py-3 font-semibold">Contact</th>
                          <th className="px-5 py-3 font-semibold">Login</th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTeachers.map((teacher) => (
                          <TeacherRow
                            key={teacher.id}
                            teacher={teacher}
                            onView={setSelectedTeacher}
                            onEdit={openEditForm}
                            onLogin={openLogin}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="divide-y divide-slate-100 md:hidden">
                    {filteredTeachers.map((teacher) => (
                      <TeacherCard
                        key={teacher.id}
                        teacher={teacher}
                        onView={setSelectedTeacher}
                        onLogin={openLogin}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {selectedTeacher && (
        <TeacherDetails
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          onEdit={openEditForm}
          onDelete={deleteTeacher}
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
function TeacherRow({
  teacher,
  onView,
  onEdit,
  onLogin,
}: TeacherActions & { onEdit: (teacher: Teacher) => void }) {
  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() => onView(teacher)}
          className="flex items-center gap-3 text-left"
        >
          <Avatar name={teacher.name} />
          <div>
            <p className="font-semibold text-slate-900 hover:text-blue-700">
              {teacher.name}
            </p>
            <p className="text-xs text-slate-400">
              {teacher.qualification || "Qualification not added"}
            </p>
          </div>
        </button>
      </td>
      <td className="px-5 py-4">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {teacher.subject || "Not assigned"}
        </span>
      </td>
      <td className="px-5 py-4 text-xs text-slate-500">
        <p>{teacher.phone || "No phone"}</p>
        <p className="mt-1 max-w-48 truncate">{teacher.email || "No email"}</p>
      </td>
      <td className="px-5 py-4">
        <AccountBadge active={Boolean(teacher.user_id)} />
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(teacher)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
            aria-label={`Edit ${teacher.name}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onLogin(teacher)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {teacher.user_id ? "Reset access" : "Create login"}
          </button>
        </div>
      </td>
    </tr>
  );
}
function TeacherCard({ teacher, onView, onLogin }: TeacherActions) {
  return (
    <div className="p-4">
      <button
        type="button"
        onClick={() => onView(teacher)}
        className="flex w-full items-start gap-3 text-left"
      >
        <Avatar name={teacher.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-slate-900">
              {teacher.name}
            </p>
            <AccountBadge active={Boolean(teacher.user_id)} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {teacher.subject || "Subject not assigned"}
          </p>
          <p className="mt-2 truncate text-xs text-slate-400">
            {teacher.phone || teacher.email || "Contact details not added"}
          </p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onLogin(teacher)}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700"
      >
        <KeyRound className="h-3.5 w-3.5" />
        {teacher.user_id ? "Reset access" : "Create login"}
      </button>
    </div>
  );
}
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
  onLogin,
}: {
  teacher: Teacher;
  onClose: () => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
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
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
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
