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
  Hash,
  KeyRound,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import SchoolJoiningControls from "@/components/SchoolJoiningControls";
import PrincipalStudentsOverview from "@/components/PrincipalStudentsOverview";
import StudentJoiningOversight from "@/components/StudentJoiningOversight";
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
  const [pageTab, setPageTab] = useState<"overview" | "students" | "attendance" | "joining">("overview");
  const [unassignedIds, setUnassignedIds] = useState<string[] | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
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
          const filters = new URLSearchParams(window.location.search);
          const requestedClass = filters.get('class');
          const requestedSection = filters.get('section');
          if (requestedClass) {
            const grade = requestedClass.replace(/^(class|grade)\s+/i, '').trim().toLowerCase();
            const match = (data || []).find((item) => item.class?.replace(/^(class|grade)\s+/i, '').trim().toLowerCase() === grade);
            setStudentClass(match?.class || requestedClass);
            setPageTab("students");
          }
          if (requestedSection) {
            const match = (data || []).find((item) => item.section?.toLowerCase() === requestedSection.toLowerCase());
            setSection(match?.section || requestedSection);
            setPageTab("students");
          }
          const selectedId = new URLSearchParams(window.location.search).get('student');
          const match = (data || []).find((item) => item.id === selectedId);
          if (match) {
            setSelectedStudent(match as Student);
            window.history.replaceState(window.history.state, '', window.location.pathname);
          }
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
      return matchesSearch && matchesClass && matchesSection && matchesAccount &&
        (!unassignedIds || unassignedIds.includes(student.id));
    });
  }, [account, search, section, studentClass, students, unassignedIds]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleStudents = filteredStudents.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1500px]">
            <header className="relative -mx-3.5 flex min-h-[138px] items-center overflow-hidden bg-gradient-to-br from-[#e7f2ff] via-[#f5faff] to-[#9dbcf4] px-4 py-4 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:mx-0 sm:min-h-[190px] sm:rounded-2xl sm:border sm:border-blue-100 sm:px-8 sm:py-8 sm:dark:border-blue-900/60">
              <div className="relative z-10 max-w-[62%]">
                <h1 className="text-[1.7rem] font-extrabold leading-[1.04] tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Students
                </h1>
                <p className="mt-2 max-w-sm text-xs leading-4 text-slate-700 dark:text-blue-100 sm:text-base sm:leading-6">
                  Manage students, attendance and school access.
                </p>
              </div>
              <StudentsHeroArtwork />
            </header>
            <nav aria-label="Student sections" className="mb-3 mt-2 flex gap-5 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
              {(["overview", "students", "attendance", "joining"] as const).map((tab) => <button key={tab} type="button" onClick={() => setPageTab(tab)} className={`shrink-0 border-b-2 px-0.5 py-2 text-xs font-semibold capitalize sm:text-sm ${pageTab === tab ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-slate-500 dark:text-slate-400"}`}>{tab}</button>)}
            </nav>

            {pageTab === "overview" && schoolId && <PrincipalStudentsOverview schoolId={schoolId} students={students}
              onAdd={openCreateForm}
              onMove={() => { setUnassignedIds(null); setStudentClass("All"); setPageTab("students"); setNotice("Choose a student and use Edit to change their class or section."); }}
              onStudents={() => { setUnassignedIds(null); setStudentClass("All"); setPageTab("students"); }}
              onClass={(name) => { const target = name.replace(/^(Grade|Class)\s+/i, "").toLowerCase(); setUnassignedIds(null); setStudentClass(name === "All" ? "All" : classes.find((value) => value.replace(/^(Grade|Class)\s+/i, "").toLowerCase() === target) || name); setSection("All"); setCurrentPage(1); setPageTab("students"); }}
              onUnassigned={(ids) => { setUnassignedIds(ids); setStudentClass("All"); setSection("All"); setCurrentPage(1); setPageTab("students"); }}
              onJoining={() => setPageTab("joining")} />}
            {pageTab === "attendance" && <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h2 className="font-bold text-slate-950 dark:text-white">Student attendance</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review school-wide attendance and mark each class.</p><a href="/principal/attendance" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Open attendance</a></section>}
            {pageTab === "joining" && <><SchoolJoiningControls role="student" /><StudentJoiningOversight /></>}

            {pageTab === "students" && <>
              {unassignedIds && <button type="button" onClick={() => setUnassignedIds(null)} className="mb-2 text-xs font-semibold text-blue-600">Showing unassigned students · Clear filter</button>}

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

            <section className="mt-2">
              <div className="space-y-2">
                <label className="relative block">
                  <span className="sr-only">Search students</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      resetFiltersPage();
                    }}
                    placeholder="Search student, roll, parent or phone..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  {search && <button type="button" onClick={() => { setSearch(""); resetFiltersPage(); }} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500"><X className="h-4 w-4" /></button>}
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                  <button type="button" onClick={() => { setStudentClass("All"); setSection("All"); setAccount("All"); setUnassignedIds(null); resetFiltersPage(); }} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${studentClass === "All" && section === "All" && account === "All" && !unassignedIds ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>All students</button>
                  {(["class", "section", "account"] as const).map((kind) => {
                    const selected = kind === "class" ? studentClass : kind === "section" ? section : account;
                    const options = kind === "class" ? classes : kind === "section" ? sections : ["All", "Active", "Not created"];
                    return <label key={kind} className={`relative inline-flex shrink-0 items-center rounded-full border text-[11px] font-semibold ${selected !== "All" ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}><span className="sr-only">{kind} filter</span><select value={selected} onChange={(event) => { const option = event.target.value; if (kind === "class") { setStudentClass(option); setSection("All"); } else if (kind === "section") setSection(option); else setAccount(option as typeof account); resetFiltersPage(); }} className="max-w-32 appearance-none bg-transparent py-1.5 pl-2.5 pr-5 outline-none"><option value="All">{kind[0].toUpperCase() + kind.slice(1)}</option>{options.filter((option) => option !== "All").map((option) => <option key={option} value={option}>{option === "Active" ? "Access active" : option === "Not created" ? "No access" : option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-1 h-3 w-3" /></label>;
                  })}
                  {(studentClass !== "All" || section !== "All" || account !== "All" || unassignedIds) && <button type="button" onClick={() => { setStudentClass("All"); setSection("All"); setAccount("All"); setUnassignedIds(null); resetFiltersPage(); }} className="shrink-0 text-[11px] font-semibold text-blue-600">Clear</button>}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white">Student records</h2>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Showing {filteredStudents.length} of {students.length}</p>
              </div>

              {filteredStudents.length === 0 ? (
                <EmptyState
                  filtered={Boolean(
                    search ||
                    studentClass !== "All" ||
                    section !== "All" ||
                    account !== "All" || unassignedIds,
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
                  <div className="space-y-1.5 md:hidden">
                    {visibleStudents.map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        onView={setSelectedStudent}
                        onEdit={openEditForm}
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
            </>}
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

function StudentCard({ student, onView, onEdit, onLogin }: StudentActions & { onEdit: (student: Student) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onView(student)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Avatar name={student.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
              {student.name}
            </p>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
            {student.class ? `Class ${student.class}` : "Class not assigned"}
            {student.section ? ` · Section ${student.section}` : ""}
            {student.roll_no ? ` · Roll ${student.roll_no}` : ""}
          </p>
          <p className="mt-1 truncate text-[10px] text-slate-400">{student.parent_name || student.parent_phone || student.email || "Contact not added"}</p>
        </div>
      </button>
      <AccountBadge active={Boolean(student.user_id)} />
      <button type="button" aria-label={`Actions for ${student.name}`} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="rounded p-1 text-slate-500 dark:text-slate-300"><MoreVertical className="h-4 w-4" /></button>
      </div>
      {menuOpen && <div className="absolute right-2 top-9 z-20 min-w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <button type="button" onClick={() => { setMenuOpen(false); onView(student); }} className="block w-full rounded px-2 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200">View profile</button>
        <button type="button" onClick={() => { setMenuOpen(false); onEdit(student); }} className="block w-full rounded px-2 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200">Edit details</button>
        {!student.user_id && <button type="button" onClick={() => { setMenuOpen(false); onLogin(student); }} className="block w-full rounded px-2 py-1.5 text-left text-xs text-blue-700 dark:text-blue-300">Create login</button>}
      </div>}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
      {initials(name || "Student")}
    </span>
  );
}

function AccountBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"}`}
    >
      {active ? (
        <UserCheck className="h-3 w-3" />
      ) : (
        <KeyRound className="h-3 w-3" />
      )}
      {active ? "Access active" : "No access"}
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

function StudentsHeroArtwork() {
  return <svg viewBox="0 0 360 210" preserveAspectRatio="xMaxYMax meet" className="pointer-events-none absolute -bottom-2 -right-5 h-[115%] w-[78%] max-w-none opacity-80 dark:opacity-50 sm:right-0 sm:w-[58%] sm:opacity-100" aria-hidden="true">
    <defs>
      <linearGradient id="studentHeroBooks" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#d9e7fb" /></linearGradient>
      <linearGradient id="studentHeroPlant" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#68c876" /><stop offset="1" stopColor="#238350" /></linearGradient>
    </defs>
    <ellipse cx="248" cy="199" rx="115" ry="8" fill="#4780b6" opacity=".15" />
    <path d="M283 133c-7-31-5-66 1-102m0 104c9-28 25-47 47-62m-47 62c-13-25-30-39-50-48" fill="none" stroke="#368d50" strokeWidth="3" />
    <path d="M279 80c-21-31-19-55 3-75 12 30 10 55-3 75Z" fill="url(#studentHeroPlant)" /><path d="M292 101c9-25 25-40 50-41-8 27-25 40-50 41Z" fill="#369f60" /><path d="M274 112c-12-21-28-32-48-30 11 20 26 30 48 30Z" fill="#4aaa65" />
    <path d="M258 131h55l-6 52c-2 6-7 8-21 8s-21-2-22-8l-6-52Z" fill="url(#studentHeroBooks)" stroke="#bed6ee" strokeWidth="2" />
    <path d="M258 132h55" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    <rect x="130" y="91" width="17" height="71" rx="3" fill="#2c6ed0" /><rect x="150" y="84" width="20" height="78" rx="3" fill="#8ab8ec" /><rect x="173" y="97" width="17" height="65" rx="3" fill="#23599f" /><rect x="193" y="87" width="21" height="75" rx="3" fill="#4c8ad0" /><rect x="217" y="101" width="14" height="61" rx="3" fill="#d6a567" />
    <path d="M67 119 61 65m18 54 5-61m8 61 16-54" stroke="#29466b" strokeWidth="5" strokeLinecap="round" />
    <path d="M54 122h65l-7 63c-2 5-8 6-26 6s-25-1-26-6l-6-63Z" fill="url(#studentHeroBooks)" stroke="#bcd4ec" strokeWidth="2" /><path d="M54 123h65" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    <path d="M118 163h219l-3 29H115l3-29Z" fill="#2c68b6" /><path d="M121 166h211l-3 20H118l3-20Z" fill="url(#studentHeroBooks)" /><path d="M118 163h219" stroke="#8bb9ef" strokeWidth="5" strokeLinecap="round" />
    <path d="M127 190h208l-4 16H123l4-16Z" fill="#3c7bcb" /><path d="M130 191h201l-3 10H127l3-10Z" fill="url(#studentHeroBooks)" /><path d="M127 190h208" stroke="#a8cdf5" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}
