"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
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
  Users,
  X,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import AccountRequestsPanel from "@/components/AccountRequestsPanel";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  school_id: string | null;
  name: string;
  class: string | null;
  section: string | null;
  roll_no: string | null;
  gender: string | null;
  date_of_birth: string | null;
  dob: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  address: string | null;
  email: string | null;
  created_at: string | null;
  user_id: string | null;
};

type StudentForm = {
  name: string;
  class: string;
  section: string;
  roll_no: string;
  gender: string;
  date_of_birth: string;
  parent_name: string;
  parent_phone: string;
  email: string;
  address: string;
};

const emptyForm: StudentForm = {
  name: "",
  class: "",
  section: "",
  roll_no: "",
  gender: "",
  date_of_birth: "",
  parent_name: "",
  parent_phone: "",
  email: "",
  address: "",
};

const pageSize = 10;

function titleCase(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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

function createPassword() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(
    values,
    (value) => characters[value % characters.length],
  ).join("");
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [studentClass, setStudentClass] = useState("All");
  const [section, setSection] = useState("All");
  const [account, setAccount] = useState<"All" | "Active" | "Not created">(
    "All",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loginStudent, setLoginStudent] = useState<Student | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [credentialsCreated, setCredentialsCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
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
        if (profileError || !profile?.school_id) {
          throw new Error("Your school profile could not be loaded.");
        }

        const { data, error: studentsError } = await supabase
          .from("students")
          .select(
            "id, school_id, name, class, section, roll_no, gender, date_of_birth, dob, parent_name, parent_phone, address, email, created_at, user_id",
          )
          .eq("school_id", profile.school_id)
          .order("created_at", { ascending: false });
        if (studentsError) throw studentsError;

        if (!cancelled) {
          setSchoolId(profile.school_id);
          setStudents((data || []) as Student[]);
        }
      } catch (loadError) {
        console.error("Students page load error", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Students could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadStudents();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const classes = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          students
            .map((student) => student.class)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    ],
    [students],
  );

  const sections = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          students
            .filter(
              (student) =>
                studentClass === "All" || student.class === studentClass,
            )
            .map((student) => student.section)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    ],
    [studentClass, students],
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [
          student.name,
          student.roll_no,
          student.parent_name,
          student.parent_phone,
          student.email,
        ].some((value) => value?.toLowerCase().includes(query));
      const matchesClass =
        studentClass === "All" || student.class === studentClass;
      const matchesSection = section === "All" || student.section === section;
      const matchesAccount =
        account === "All" ||
        (account === "Active" ? Boolean(student.user_id) : !student.user_id);
      return matchesSearch && matchesClass && matchesSection && matchesAccount;
    });
  }, [account, search, section, studentClass, students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleStudents = filteredStudents.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const activeAccounts = students.filter((student) => student.user_id).length;
  const incompleteRecords = students.filter(
    (student) => !student.class || !student.parent_phone || !student.roll_no,
  ).length;

  function resetFiltersPage() {
    setCurrentPage(1);
  }

  function openCreateForm() {
    setEditingStudent(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  }

  function openEditForm(student: Student) {
    setEditingStudent(student);
    setForm({
      name: student.name || "",
      class: student.class || "",
      section: student.section || "",
      roll_no: student.roll_no || "",
      gender: student.gender || "",
      date_of_birth: student.date_of_birth || student.dob || "",
      parent_name: student.parent_name || "",
      parent_phone: student.parent_phone || "",
      email: student.email || "",
      address: student.address || "",
    });
    setSelectedStudent(null);
    setError("");
    setFormOpen(true);
  }

  async function saveStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !form.name.trim() || !form.class.trim()) return;
    setSaving(true);
    setError("");

    const studentData = {
      school_id: schoolId,
      name: titleCase(form.name),
      class: form.class.trim(),
      section: form.section.trim().toUpperCase() || null,
      roll_no: form.roll_no.trim() || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      parent_name: form.parent_name ? titleCase(form.parent_name) : null,
      parent_phone: form.parent_phone.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      address: form.address.trim() || null,
    };

    try {
      const result = editingStudent
        ? await supabase
            .from("students")
            .update(studentData)
            .eq("id", editingStudent.id)
            .eq("school_id", schoolId)
        : await supabase.from("students").insert(studentData);
      if (result.error) throw result.error;
      setFormOpen(false);
      setNotice(
        editingStudent
          ? "Student details updated."
          : "Student added successfully.",
      );
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      console.error("Student save error", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Student could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student: Student) {
    if (!schoolId) return;
    if (student.user_id) {
      setError(
        "Remove or disable this student’s login account before deleting the student record.",
      );
      return;
    }
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("students")
      .delete()
      .eq("id", student.id)
      .eq("school_id", schoolId);
    if (deleteError) {
      console.error("Student delete error", deleteError);
      setError(deleteError.message);
      return;
    }
    setSelectedStudent(null);
    setNotice("Student deleted.");
    setRefreshKey((value) => value + 1);
  }

  function openLogin(student: Student) {
    setLoginStudent(student);
    setLoginEmail(student.email || "");
    setPassword(createPassword());
    setShowPassword(false);
    setCredentialsCreated(false);
    setCopied(false);
    setError("");
  }

  async function createLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginStudent || !loginEmail || password.length < 8) return;
    setCreatingLogin(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch("/api/create-student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password,
          studentId: loginStudent.id,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "The login could not be created.");
      }

      setCredentialsCreated(true);
      setStudents((current) =>
        current.map((student) =>
          student.id === loginStudent.id
            ? {
                ...student,
                user_id: result.userId,
                email: loginEmail.trim().toLowerCase(),
              }
            : student,
        ),
      );
      setNotice(`Login created for ${loginStudent.name}.`);
    } catch (loginError) {
      console.error("Student login creation error", loginError);
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
      `NEPSOM student login\nEmail: ${loginEmail}\nPassword: ${password}\nLogin: /auth/login?role=student`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <StudentsSkeleton />;
  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Please sign in</h1>
          <p className="mt-2 text-sm text-slate-500">
            Use a principal account to manage students.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-600">
                  School directory
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Students
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Keep student records, family contacts, and login access
                  organized.
                </p>
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
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add student
                </button>
              </div>
            </header>

            <AccountRequestsPanel role="student" onApproved={() => setRefreshKey((value) => value + 1)} />

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
                  aria-label="Dismiss message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                icon={Users}
                label="Total students"
                value={students.length}
                helper="Student records"
                color="blue"
              />
              <Stat
                icon={UserCheck}
                label="Login active"
                value={activeAccounts}
                helper={`${students.length - activeAccounts} still need access`}
                color="emerald"
              />
              <Stat
                icon={GraduationCap}
                label="Classes"
                value={Math.max(0, classes.length - 1)}
                helper="Classes represented"
                color="violet"
              />
              <Stat
                icon={AlertCircle}
                label="Incomplete records"
                value={incompleteRecords}
                helper="Missing class, roll or parent phone"
                color="amber"
              />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_160px_150px_170px]">
                <label className="relative">
                  <span className="sr-only">Search students</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      resetFiltersPage();
                    }}
                    placeholder="Search name, roll, parent, phone or email"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <Select
                  value={studentClass}
                  onChange={(value) => {
                    setStudentClass(value);
                    setSection("All");
                    resetFiltersPage();
                  }}
                  label="Class"
                  options={classes}
                  allLabel="All classes"
                />
                <Select
                  value={section}
                  onChange={(value) => {
                    setSection(value);
                    resetFiltersPage();
                  }}
                  label="Section"
                  options={sections}
                  allLabel="All sections"
                />
                <Select
                  value={account}
                  onChange={(value) => {
                    setAccount(value as typeof account);
                    resetFiltersPage();
                  }}
                  label="Account"
                  options={["All", "Active", "Not created"]}
                  allLabel="All accounts"
                />
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-950">Student records</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Showing {filteredStudents.length} of {students.length}
                  </p>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <EmptyState
                  filtered={Boolean(
                    search ||
                    studentClass !== "All" ||
                    section !== "All" ||
                    account !== "All",
                  )}
                  onAdd={openCreateForm}
                />
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="border-y border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Student</th>
                          <th className="px-5 py-3 font-semibold">Class</th>
                          <th className="px-5 py-3 font-semibold">Parent</th>
                          <th className="px-5 py-3 font-semibold">Login</th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleStudents.map((student) => (
                          <StudentRow
                            key={student.id}
                            student={student}
                            onView={setSelectedStudent}
                            onEdit={openEditForm}
                            onLogin={openLogin}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="divide-y divide-slate-100 md:hidden">
                    {visibleStudents.map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        onView={setSelectedStudent}
                        onLogin={openLogin}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <Pagination
                      page={safePage}
                      totalPages={totalPages}
                      total={filteredStudents.length}
                      onPage={setCurrentPage}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {selectedStudent && (
        <StudentDetails
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={openEditForm}
          onDelete={deleteStudent}
          onLogin={openLogin}
        />
      )}
      {formOpen && (
        <StudentFormModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingStudent)}
          saving={saving}
          error={error}
          onClose={() => setFormOpen(false)}
          onSubmit={saveStudent}
        />
      )}
      {loginStudent && (
        <LoginModal
          student={loginStudent}
          email={loginEmail}
          setEmail={setLoginEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          creating={creatingLogin}
          created={credentialsCreated}
          copied={copied}
          onCopy={copyCredentials}
          onSubmit={createLogin}
          onClose={() => setLoginStudent(null)}
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
  allLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
  allLabel: string;
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
          <option key={option} value={option}>
            {option === "All" ? allLabel : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  helper,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  helper: string;
  color: "blue" | "emerald" | "violet" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

type StudentActions = {
  student: Student;
  onView: (student: Student) => void;
  onLogin: (student: Student) => void;
};

function StudentRow({
  student,
  onView,
  onEdit,
  onLogin,
}: StudentActions & { onEdit: (student: Student) => void }) {
  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() => onView(student)}
          className="flex items-center gap-3 text-left"
        >
          <Avatar name={student.name} />
          <div>
            <p className="font-semibold text-slate-900 hover:text-blue-700">
              {student.name}
            </p>
            <p className="text-xs text-slate-400">
              Roll {student.roll_no || "not assigned"}
            </p>
          </div>
        </button>
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-slate-700">
          {student.class ? `Class ${student.class}` : "Not assigned"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {student.section ? `Section ${student.section}` : "No section"}
        </p>
      </td>
      <td className="px-5 py-4 text-xs text-slate-500">
        <p>{student.parent_name || "Parent not added"}</p>
        <p className="mt-1">{student.parent_phone || "No phone"}</p>
      </td>
      <td className="px-5 py-4">
        <AccountBadge active={Boolean(student.user_id)} />
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(student)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
            aria-label={`Edit ${student.name}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          {!student.user_id && (
            <button
              type="button"
              onClick={() => onLogin(student)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Create login
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StudentCard({ student, onView, onLogin }: StudentActions) {
  return (
    <div className="p-4">
      <button
        type="button"
        onClick={() => onView(student)}
        className="flex w-full items-start gap-3 text-left"
      >
        <Avatar name={student.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-slate-900">
              {student.name}
            </p>
            <AccountBadge active={Boolean(student.user_id)} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {student.class ? `Class ${student.class}` : "Class not assigned"}
            {student.section ? ` · Section ${student.section}` : ""}
          </p>
          <p className="mt-2 truncate text-xs text-slate-400">
            {student.parent_phone ||
              student.email ||
              "Contact details not added"}
          </p>
        </div>
      </button>
      {!student.user_id && (
        <button
          type="button"
          onClick={() => onLogin(student)}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Create login
        </button>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
      {initials(name || "Student")}
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

function StudentDetails({
  student,
  onClose,
  onEdit,
  onDelete,
  onLogin,
}: {
  student: Student;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onLogin: (student: Student) => void;
}) {
  return (
    <Modal onClose={onClose} width="max-w-xl">
      <div className="flex items-start justify-between border-b border-slate-100 p-6">
        <div className="flex gap-3">
          <Avatar name={student.name} />
          <div>
            <h2 className="text-lg font-bold text-slate-950">{student.name}</h2>
            <p className="text-sm text-slate-500">
              {student.class ? `Class ${student.class}` : "Class not assigned"}
              {student.section ? ` · Section ${student.section}` : ""}
            </p>
          </div>
        </div>
        <Close onClick={onClose} />
      </div>
      <div className="p-6">
        <AccountBadge active={Boolean(student.user_id)} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info icon={Hash} label="Roll number" value={student.roll_no} />
          <Info icon={UserRound} label="Gender" value={student.gender} />
          <Info
            icon={CalendarDays}
            label="Date of birth"
            value={student.date_of_birth || student.dob}
          />
          <Info icon={UserRound} label="Parent" value={student.parent_name} />
          <Info
            icon={Phone}
            label="Parent phone"
            value={student.parent_phone}
          />
          <Info icon={Mail} label="Login email" value={student.email} />
          <div className="sm:col-span-2">
            <Info icon={MapPin} label="Address" value={student.address} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(student)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Edit3 className="h-4 w-4" />
            Edit details
          </button>
          {!student.user_id && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogin(student);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700"
            >
              <KeyRound className="h-4 w-4" />
              Create login
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(student)}
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
    <div className="h-full rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "Not added"}
      </p>
    </div>
  );
}

function StudentFormModal({
  form,
  setForm,
  editing,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  form: StudentForm;
  setForm: React.Dispatch<React.SetStateAction<StudentForm>>;
  editing: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const field = (key: keyof StudentForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal onClose={onClose} width="max-w-3xl">
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {editing ? "Edit student" : "Add student"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the student’s school and family information.
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
            label="Roll number"
            value={form.roll_no}
            onChange={(value) => field("roll_no", value)}
          />
          <Field
            label="Class"
            value={form.class}
            onChange={(value) => field("class", value)}
            required
          />
          <Field
            label="Section"
            value={form.section}
            onChange={(value) => field("section", value)}
          />
          <SelectField
            label="Gender"
            value={form.gender}
            onChange={(value) => field("gender", value)}
            options={["", "Male", "Female", "Other"]}
          />
          <Field
            label="Date of birth"
            type="date"
            value={form.date_of_birth}
            onChange={(value) => field("date_of_birth", value)}
          />
          <Field
            label="Parent or guardian"
            value={form.parent_name}
            onChange={(value) => field("parent_name", value)}
          />
          <Field
            label="Parent phone"
            type="tel"
            value={form.parent_phone}
            onChange={(value) => field("parent_phone", value)}
          />
          <Field
            label="Student login email"
            type="email"
            value={form.email}
            onChange={(value) => field("email", value)}
          />
          <Field
            label="Address"
            value={form.address}
            onChange={(value) => field("address", value)}
          />
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
            disabled={saving || !form.name.trim() || !form.class.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add student"}
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "Select gender"}
          </option>
        ))}
      </select>
    </label>
  );
}

function LoginModal({
  student,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  creating,
  created,
  copied,
  onCopy,
  onSubmit,
  onClose,
}: {
  student: Student;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  creating: boolean;
  created: boolean;
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
              {created ? "Login created" : "Create student login"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{student.name}</p>
          </div>
          <Close onClick={onClose} />
        </div>
        <div className="space-y-4 p-6">
          {created && (
            <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              <Check className="h-4 w-4" />
              Share these credentials securely with the student or guardian.
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
                className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-12 font-mono text-sm outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>
          {!created && (
            <button
              type="button"
              onClick={() => setPassword(createPassword())}
              className="text-xs font-semibold text-blue-600"
            >
              Generate another password
            </button>
          )}
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
            <button
              disabled={creating || !email || password.length < 8}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create login"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
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
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${width}`}
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

function EmptyState({
  filtered,
  onAdd,
}: {
  filtered: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {filtered ? (
          <Search className="h-5 w-5" />
        ) : (
          <UserRound className="h-5 w-5" />
        )}
      </span>
      <h3 className="mt-4 font-bold text-slate-900">
        {filtered ? "No matching students" : "No students added yet"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {filtered
          ? "Try changing the search or filters."
          : "Add your first student to build the school directory."}
      </p>
      {!filtered && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add student
        </button>
      )}
    </div>
  );
}

function StudentsSkeleton() {
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
