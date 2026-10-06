"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  Save,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import {
  classKey,
  classTitle,
  gradeFromScale,
  markStats,
  naturalRoll,
  parseMark,
  type GradeRule,
} from "@/lib/teacher-marks";

type Assignment = {
  class_id: string;
  class_name: string;
  subject: string;
  academic_year: string | null;
};
type ClassRow = {
  id: string;
  class_name: string | null;
  class: string | null;
  name: string | null;
  class_number: string | null;
  section_name: string | null;
  section: string | null;
  academic_year: number | null;
};
type Exam = {
  id: string;
  name: string;
  exam_type: string | null;
  start_date: string;
  end_date: string;
  academic_year: number | null;
  published_at: string | null;
};
type Subject = {
  id: string;
  exam_id: string;
  school_id: string;
  class_name: string;
  section: string;
  subject_name: string;
  full_marks: number;
  pass_marks: number;
};
type Student = {
  id: string;
  name: string;
  roll_no: string | null;
  class: string;
  section: string | null;
  gender: string | null;
  date_of_birth: string | null;
};
type Mark = {
  id: string;
  subject_id: string;
  student_id: string;
  marks: number;
  updated_at: string;
};
type Loaded = {
  schoolId: string;
  assignments: Assignment[];
  classes: ClassRow[];
  exams: Exam[];
  subjects: Subject[];
  students: Student[];
  marks: Mark[];
  school: {
    grading_system: string;
    grade_scale: GradeRule[];
    default_pass_mark: number;
  };
};
const panel =
    "rounded-[18px] border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,.04)] dark:border-slate-800 dark:bg-slate-900",
  muted = "text-slate-500 dark:text-slate-400";
const classNameOf = (r: ClassRow) =>
    r.class_name || r.class || r.name || r.class_number || "",
  sectionOf = (r: ClassRow) => r.section_name || r.section || "";
const dateLabel = (v: string) =>
  new Date(`${v}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
async function rows<T>(
  request: (
    a: number,
    b: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
) {
  const out: T[] = [];
  for (let a = 0; ; a += 500) {
    const p = await request(a, a + 499);
    if (p.error) throw new Error(p.error.message);
    out.push(...((p.data || []) as T[]));
    if ((p.data || []).length < 500) return out;
  }
}

export default function TeacherMarks({
  view,
  subjectId,
  studentId,
}: {
  view: "home" | "entry" | "student";
  subjectId?: string;
  studentId?: string;
}) {
  const [data, setData] = useState<Loaded | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const auth = await supabase.auth.getUser();
        if (auth.error || !auth.data.user)
          throw new Error("Please sign in with your teacher account.");
        const profile = await supabase
          .from("profiles")
          .select("school_id,role")
          .eq("user_id", auth.data.user.id)
          .single();
        if (
          profile.error ||
          profile.data?.role !== "teacher" ||
          !profile.data.school_id
        )
          throw new Error("Teacher access unavailable.");
        const teacher = await supabase
          .from("teachers")
          .select("id")
          .eq("user_id", auth.data.user.id)
          .eq("school_id", profile.data.school_id)
          .is("left_at", null)
          .single();
        if (teacher.error || !teacher.data)
          throw new Error("Active teacher record unavailable.");
        const schoolId = profile.data.school_id;
        const [assignments, classes, exams, subjects, students, marks, school] =
          await Promise.all([
            rows<Assignment>((a, b) =>
              supabase
                .from("teacher_assignments")
                .select("class_id,class_name,subject,academic_year")
                .eq("school_id", schoolId)
                .eq("teacher_id", teacher.data.id)
                .eq("active", true)
                .range(a, b),
            ),
            rows<ClassRow>((a, b) =>
              supabase
                .from("classes")
                .select(
                  "id,class_name,class,name,class_number,section_name,section,academic_year",
                )
                .eq("school_id", schoolId)
                .is("archived_at", null)
                .range(a, b),
            ),
            rows<Exam>((a, b) =>
              supabase
                .from("exams")
                .select(
                  "id,name,exam_type,start_date,end_date,academic_year,published_at",
                )
                .eq("school_id", schoolId)
                .order("start_date", { ascending: false })
                .range(a, b),
            ),
            rows<Subject>((a, b) =>
              supabase
                .from("exam_subjects")
                .select(
                  "id,exam_id,school_id,class_name,section,subject_name,full_marks,pass_marks",
                )
                .eq("school_id", schoolId)
                .range(a, b),
            ),
            rows<Student>((a, b) =>
              supabase
                .from("students")
                .select("id,name,roll_no,class,section,gender,date_of_birth")
                .eq("school_id", schoolId)
                .range(a, b),
            ),
            rows<Mark>((a, b) =>
              supabase
                .from("exam_marks")
                .select("id,subject_id,student_id,marks,updated_at")
                .eq("school_id", schoolId)
                .range(a, b),
            ),
            supabase
              .from("schools")
              .select("grading_system,grade_scale,default_pass_mark")
              .eq("id", schoolId)
              .single(),
          ]);
        if (school.error) throw new Error(school.error.message);
        if (active)
          setData({
            schoolId,
            assignments,
            classes,
            exams,
            subjects,
            students,
            marks,
            school: school.data as Loaded["school"],
          });
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Mark Entry could not be loaded.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [retry]);
  if (loading)
    return (
      <Shell>
        <Loading />
      </Shell>
    );
  if (!data)
    return (
      <Shell>
        <ErrorBox message={error} retry={() => setRetry((v) => v + 1)} />
      </Shell>
    );
  const flash = (error || success) && (
    <Flash error={Boolean(error)}>{error || success}</Flash>
  );
  if (view === "entry" && subjectId)
    return (
      <Entry
        data={data}
        subjectId={subjectId}
        flash={flash}
        setError={setError}
        setSuccess={setSuccess}
        reload={() => setRetry((v) => v + 1)}
      />
    );
  if (view === "student" && subjectId && studentId)
    return (
      <StudentResult
        data={data}
        subjectId={subjectId}
        studentId={studentId}
        flash={flash}
      />
    );
  return <Home data={data} flash={flash} />;
}
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-3.5 pb-28 pt-20 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
function Loading() {
  return (
    <div className="flex justify-center gap-2 py-24 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      Loading mark entry…
    </div>
  );
}
function ErrorBox({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className={`${panel} p-5`}>
      <p role="alert" className="text-sm text-rose-600">
        {message}
      </p>
      <button onClick={retry} className="mt-3 text-sm font-bold text-blue-600">
        Retry
      </button>
    </div>
  );
}
function Flash({ error, children }: { error: boolean; children: ReactNode }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl border p-3 text-xs ${error ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950"}`}
    >
      {children}
    </p>
  );
}
function Badge({ label }: { label: string }) {
  const color =
    label === "Published" || label === "Completed"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10"
      : label === "In Progress"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${color}`}>
      {label}
    </span>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className={`rounded-[15px] p-2.5 text-center sm:p-4 ${tone}`}>
      <Icon className="mx-auto mb-1 h-5 w-5" />
      <p className="text-xl font-extrabold sm:text-2xl">{value}</p>
      <p className="truncate text-[10px] font-medium text-slate-600 dark:text-slate-300 sm:text-xs">
        {label}
      </p>
    </div>
  );
}
function scopedClasses(d: Loaded) {
  return d.classes.filter((c) =>
    d.assignments.some((a) => a.class_id === c.id),
  );
}
function studentsFor(d: Loaded, g: string, s: string) {
  return d.students
    .filter((st) => classKey(st.class, st.section) === classKey(g, s))
    .sort(
      (a, b) =>
        naturalRoll(a.roll_no, b.roll_no) || a.name.localeCompare(b.name),
    );
}
function examFor(d: Loaded, s: Subject) {
  return d.exams.find((e) => e.id === s.exam_id);
}
function statusFor(e: Exam, n: number, total: number) {
  return e.published_at
    ? "Published"
    : !n
      ? "Not Started"
      : total > 0 && n >= total
        ? "Completed"
        : "In Progress";
}

function Home({ data, flash }: { data: Loaded; flash: ReactNode }) {
  const classes = scopedClasses(data),
    [classId, setClassId] = useState(classes[0]?.id || ""),
    selected = classes.find((c) => c.id === classId) || classes[0];
  const assigned = [
      ...new Set(
        data.assignments
          .filter((a) => a.class_id === selected?.id)
          .map((a) => a.subject),
      ),
    ],
    [subjectName, setSubjectName] = useState(assigned[0] || ""),
    effectiveSubject = assigned.some(
      (value) => value.toLowerCase() === subjectName.toLowerCase(),
    )
      ? subjectName
      : assigned[0] || "";
  const grade = selected ? classNameOf(selected) : "",
    section = selected ? sectionOf(selected) : "",
    subjects = data.subjects
      .filter(
        (s) =>
          classKey(s.class_name, s.section) === classKey(grade, section) &&
          s.subject_name.toLowerCase() === effectiveSubject.toLowerCase(),
      )
      .sort((a, b) =>
        (examFor(data, b)?.start_date || "").localeCompare(
          examFor(data, a)?.start_date || "",
        ),
      ),
    students = studentsFor(data, grade, section),
    entered = (s: Subject) =>
      data.marks.filter((m) => m.subject_id === s.id).length,
    complete = subjects.filter((s) => {
      const e = examFor(data, s);
      return (
        e &&
        (e.published_at ||
          (students.length > 0 && entered(s) >= students.length))
      );
    }).length;
  return (
    <Shell>
      {flash}
      <header>
        <h1 className="text-[28px] font-extrabold tracking-[-.035em]">
          Mark Entry
        </h1>
        <p className={`mt-1 text-sm ${muted}`}>
          Enter and manage marks for your classes and subjects.
        </p>
      </header>
      {classes.length ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setClassId(c.id)}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-bold ${c.id === selected?.id ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-400/10" : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900"}`}
              >
                {classTitle(classNameOf(c), sectionOf(c))}
              </button>
            ))}
          </div>
          <label className={`${panel} flex items-center gap-3 p-3`}>
            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <BookOpen size={20} />
            </span>
            <select
              aria-label="Subject"
              value={effectiveSubject}
              onChange={(e) => setSubjectName(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
            >
              {assigned.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-4 gap-2">
            <Metric
              icon={FileText}
              label="Exams"
              value={subjects.length}
              tone="bg-blue-50 text-blue-700 dark:bg-blue-400/10"
            />
            <Metric
              icon={Users}
              label="Students"
              value={students.length}
              tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10"
            />
            <Metric
              icon={BarChart3}
              label="Completed"
              value={complete}
              tone="bg-amber-50 text-amber-700 dark:bg-amber-400/10"
            />
            <Metric
              icon={Clock3}
              label="Pending"
              value={Math.max(0, subjects.length - complete)}
              tone="bg-rose-50 text-rose-700 dark:bg-rose-400/10"
            />
          </div>
          <section>
            <h2 className="mb-3 text-lg font-extrabold">Exams & Assessments</h2>
            <div className="space-y-2">
              {subjects.map((s) => {
                const e = examFor(data, s);
                if (!e) return null;
                const n = entered(s),
                  status = statusFor(e, n, students.length);
                return (
                  <Link
                    key={s.id}
                    href={`/teacher/marks/${s.id}`}
                    className={`${panel} flex items-center gap-3 p-3.5 hover:border-blue-300`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FileText size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <strong className="truncate text-sm">{e.name}</strong>
                        <Badge label={status} />
                      </span>
                      <span className={`mt-1 block text-xs ${muted}`}>
                        Max. Marks: {s.full_marks} · {dateLabel(e.start_date)}
                      </span>
                      <span className={`mt-1 block text-[11px] ${muted}`}>
                        {n} / {students.length} students entered
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-slate-400" />
                  </Link>
                );
              })}
              {!subjects.length && (
                <div className={`${panel} p-8 text-center text-sm ${muted}`}>
                  No school-configured exams match this assigned class and
                  subject.
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className={`${panel} p-8 text-center text-sm ${muted}`}>
          No active classes are assigned to this teacher account.
        </div>
      )}
    </Shell>
  );
}

function Entry({
  data,
  subjectId,
  flash,
  setError,
  setSuccess,
  reload,
}: {
  data: Loaded;
  subjectId: string;
  flash: ReactNode;
  setError: (v: string) => void;
  setSuccess: (v: string) => void;
  reload: () => void;
}) {
  const subject = data.subjects.find((s) => s.id === subjectId),
    exam = subject ? examFor(data, subject) : undefined,
    students = subject
      ? studentsFor(data, subject.class_name, subject.section)
      : [],
    saved = data.marks.filter((m) => m.subject_id === subjectId),
    savedMap = new Map(saved.map((m) => [m.student_id, m])),
    [tab, setTab] = useState<"Mark Entry" | "Statistics" | "Analysis">(
      "Mark Entry",
    ),
    [query, setQuery] = useState(""),
    [draft, setDraft] = useState<Record<string, string>>(() =>
      Object.fromEntries(saved.map((m) => [m.student_id, String(m.marks)])),
    ),
    [saving, setSaving] = useState(false),
    [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  if (!subject || !exam)
    return (
      <Shell>
        <Link href="/teacher/marks" className="text-sm font-bold text-blue-600">
          ← Mark Entry
        </Link>
        <ErrorBox
          message="This exam subject is unavailable or not assigned to you."
          retry={reload}
        />
      </Shell>
    );
  const currentSubject = subject,
    published = Boolean(exam.published_at),
    visible = students.filter((s) =>
      `${s.name} ${s.roll_no || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    values = students
      .map(
        (s) => parseMark(draft[s.id] ?? "", Number(subject.full_marks)).value,
      )
      .filter((v): v is number => v !== null),
    stats = markStats(
      values,
      Number(subject.full_marks),
      Number(subject.pass_marks),
    );
  async function save() {
    setError("");
    setSuccess("");
    if (published) {
      setError("Published results are locked.");
      return;
    }
    const invalid: Record<string, string> = {};
    students.forEach((s) => {
      const p = parseMark(draft[s.id] ?? "", Number(currentSubject.full_marks));
      if (p.error) invalid[s.id] = p.error;
    });
    setRowErrors(invalid);
    if (Object.keys(invalid).length) {
      setError("Correct the highlighted marks before saving.");
      return;
    }
    const changed = students.flatMap((s) => {
      const p = parseMark(draft[s.id] ?? "", Number(currentSubject.full_marks));
      return p.value === null || p.value === Number(savedMap.get(s.id)?.marks)
        ? []
        : [
            {
              school_id: data.schoolId,
              subject_id: currentSubject.id,
              student_id: s.id,
              marks: p.value,
            },
          ];
    });
    if (!changed.length) {
      setSuccess("All entered marks are already saved.");
      return;
    }
    setSaving(true);
    const results = await Promise.all(
        changed.map(async (row) => ({
          row,
          result: await supabase
            .from("exam_marks")
            .upsert(row, { onConflict: "subject_id,student_id" }),
        })),
      ),
      failed: Record<string, string> = {};
    results.forEach(({ row, result }) => {
      if (result.error) failed[row.student_id] = result.error.message;
    });
    setRowErrors(failed);
    setSaving(false);
    if (Object.keys(failed).length) {
      setError(
        `${changed.length - Object.keys(failed).length} rows saved. Retry the highlighted rows.`,
      );
    } else {
      setSuccess(
        `${changed.length} mark${changed.length === 1 ? "" : "s"} saved as draft.`,
      );
      reload();
    }
  }
  const status = statusFor(exam, saved.length, students.length);
  return (
    <Shell>
      <Link href="/teacher/marks" className={`text-sm font-bold ${muted}`}>
        ← Mark Entry
      </Link>
      {flash}
      <section className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-sky-50 to-blue-100 p-4 dark:border-blue-900/50 dark:from-blue-950/60 dark:to-slate-900">
        <div className="flex gap-3">
          <span className="rounded-xl bg-white/80 p-3 text-blue-600 dark:bg-slate-900">
            <FileText size={23} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold">{exam.name}</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              {classTitle(subject.class_name, subject.section)} ·{" "}
              {subject.subject_name}
            </p>
            <div className={`mt-3 flex flex-wrap gap-3 text-xs ${muted}`}>
              <span>Max. Marks: {subject.full_marks}</span>
              <span>
                <CalendarDays className="mr-1 inline h-4 w-4" />
                {dateLabel(exam.start_date)}
              </span>
              <Badge label={status} />
            </div>
          </div>
        </div>
      </section>
      <nav className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800">
        {(["Mark Entry", "Statistics", "Analysis"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`border-b-2 py-3 text-xs font-bold sm:text-sm ${tab === v ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
          >
            {v}
          </button>
        ))}
      </nav>
      {tab === "Mark Entry" ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <div className={`${panel} overflow-hidden`}>
            <div className="grid grid-cols-[30px_1fr_72px_48px] gap-2 border-b px-3 py-2 text-[10px] font-bold text-slate-500 dark:border-slate-800">
              <span>#</span>
              <span>Student</span>
              <span>Marks / {subject.full_marks}</span>
              <span>Grade</span>
            </div>
            <div className="divide-y dark:divide-slate-800">
              {visible.map((s) => {
                const p = parseMark(
                    draft[s.id] ?? "",
                    Number(subject.full_marks),
                  ),
                  grade = gradeFromScale(
                    p.value === null
                      ? null
                      : (p.value / Number(subject.full_marks)) * 100,
                    data.school.grade_scale || [],
                  );
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-[30px_1fr_72px_48px] items-center gap-2 px-3 py-2.5"
                  >
                    <span className="text-xs text-slate-500">
                      {s.roll_no || "—"}
                    </span>
                    <Link
                      href={`/teacher/marks/${subject.id}/${s.id}`}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <Avatar name={s.name} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold">
                          {s.name}
                        </span>
                        <span
                          className={`block text-[10px] ${rowErrors[s.id] ? "text-rose-600" : p.value === null ? muted : "text-emerald-600"}`}
                        >
                          {rowErrors[s.id] ||
                            (p.value === null
                              ? "Pending"
                              : savedMap.has(s.id)
                                ? "Saved"
                                : "Entered")}
                        </span>
                      </span>
                    </Link>
                    <input
                      aria-label={`Marks for ${s.name}`}
                      disabled={published || saving}
                      inputMode="decimal"
                      value={draft[s.id] ?? ""}
                      onChange={(e) =>
                        setDraft((c) => ({ ...c, [s.id]: e.target.value }))
                      }
                      className={`h-9 w-full rounded-lg border bg-white px-2 text-center text-xs font-bold dark:bg-slate-800 ${rowErrors[s.id] || p.error ? "border-rose-400" : "border-slate-200 dark:border-slate-700"}`}
                    />
                    <span className="text-center text-xs font-extrabold text-emerald-600">
                      {grade}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="sticky bottom-3 z-10 rounded-2xl border bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <button
              onClick={save}
              disabled={saving || published}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save size={17} />
              )}{" "}
              {published
                ? "Published results are locked"
                : saving
                  ? "Saving draft…"
                  : "Save as Draft"}
            </button>
          </div>
        </>
      ) : tab === "Statistics" ? (
        <Statistics
          entered={values.length}
          total={students.length}
          stats={stats}
          maximum={Number(subject.full_marks)}
        />
      ) : (
        <Analysis
          values={values}
          maximum={Number(subject.full_marks)}
          scale={data.school.grade_scale || []}
        />
      )}
    </Shell>
  );
}

function Statistics({
  entered,
  total,
  stats,
  maximum,
}: {
  entered: number;
  total: number;
  stats: ReturnType<typeof markStats>;
  maximum: number;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Metric
          icon={CheckCircle2}
          label="Entered"
          value={entered}
          tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10"
        />
        <Metric
          icon={Clock3}
          label="Pending"
          value={Math.max(0, total - entered)}
          tone="bg-amber-50 text-amber-700 dark:bg-amber-400/10"
        />
        <Metric
          icon={TrendingUp}
          label="Average"
          value={stats.average === null ? "—" : `${stats.average}%`}
          tone="bg-blue-50 text-blue-700 dark:bg-blue-400/10"
        />
      </div>
      <section className={`${panel} grid grid-cols-2 gap-2 p-4`}>
        <StatLine
          label="Highest mark"
          value={stats.highest === null ? "—" : `${stats.highest} / ${maximum}`}
        />
        <StatLine
          label="Lowest mark"
          value={stats.lowest === null ? "—" : `${stats.lowest} / ${maximum}`}
        />
        <StatLine label="Passed" value={stats.passed} />
        <StatLine label="Below pass mark" value={stats.failed} />
      </section>
    </>
  );
}
function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <p className={`text-[10px] ${muted}`}>{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}
function Analysis({
  values,
  maximum,
  scale,
}: {
  values: number[];
  maximum: number;
  scale: GradeRule[];
}) {
  const bands = [0, 20, 40, 60, 80].map((start) => ({
      label: `${start}–${start + 19}%`,
      count: values.filter((v) => {
        const p = (v / maximum) * 100;
        return p >= start && (start === 80 ? p <= 100 : p < start + 20);
      }).length,
    })),
    max = Math.max(1, ...bands.map((b) => b.count)),
    grades = [
      ...new Set(
        values
          .map((v) => gradeFromScale((v / maximum) * 100, scale))
          .filter((v) => v !== "—"),
      ),
    ].map((label) => ({
      label,
      count: values.filter(
        (v) => gradeFromScale((v / maximum) * 100, scale) === label,
      ).length,
    }));
  return (
    <>
      <section className={`${panel} p-4`}>
        <h2 className="font-extrabold">Score Distribution</h2>
        {values.length ? (
          <div className="mt-5 flex h-40 items-end gap-2">
            {bands.map((b) => (
              <div
                key={b.label}
                className="flex h-full flex-1 flex-col justify-end text-center"
              >
                <span className="mb-1 text-xs font-bold">{b.count}</span>
                <span
                  style={{ height: `${Math.max(4, (b.count / max) * 100)}%` }}
                  className="mx-auto w-3/5 rounded-t-lg bg-blue-500"
                />
                <span className={`mt-2 text-[9px] ${muted}`}>{b.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={`py-12 text-center text-sm ${muted}`}>
            Enter marks to see analysis.
          </p>
        )}
      </section>
      {grades.length > 0 && (
        <section className={`${panel} p-4`}>
          <h2 className="font-extrabold">Grade Distribution</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {grades.map((g) => (
              <span
                key={g.label}
                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
              >
                {g.label}: {g.count}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function StudentResult({
  data,
  subjectId,
  studentId,
  flash,
}: {
  data: Loaded;
  subjectId: string;
  studentId: string;
  flash: ReactNode;
}) {
  const [tab, setTab] = useState<"Overview" | "Marks Detail" | "Progress">(
      "Overview",
    ),
    current = data.subjects.find((s) => s.id === subjectId),
    student = data.students.find((s) => s.id === studentId);
  if (
    !current ||
    !student ||
    classKey(student.class, student.section) !==
      classKey(current.class_name, current.section)
  )
    return (
      <Shell>
        <Link href="/teacher/marks" className="text-sm font-bold text-blue-600">
          ← Mark Entry
        </Link>
        <ErrorBox
          message="This student result is unavailable or outside your assignment."
          retry={() => location.reload()}
        />
      </Shell>
    );
  const related = data.subjects.filter(
      (s) =>
        s.subject_name.toLowerCase() === current.subject_name.toLowerCase() &&
        classKey(s.class_name, s.section) ===
          classKey(current.class_name, current.section),
    ),
    results = related
      .flatMap((s) => {
        const m = data.marks.find(
            (x) => x.subject_id === s.id && x.student_id === student.id,
          ),
          e = examFor(data, s);
        return m && e
          ? [
              {
                subject: s,
                mark: m,
                exam: e,
                percent: (Number(m.marks) / Number(s.full_marks)) * 100,
              },
            ]
          : [];
      })
      .sort((a, b) => a.exam.start_date.localeCompare(b.exam.start_date)),
    average = results.length
      ? Math.round(
          (results.reduce((sum, r) => sum + r.percent, 0) / results.length) *
            10,
        ) / 10
      : null,
    grade = gradeFromScale(average, data.school.grade_scale || []);
  return (
    <Shell>
      <Link
        href={`/teacher/marks/${subjectId}`}
        className={`text-sm font-bold ${muted}`}
      >
        ← {examFor(data, current)?.name || "Mark Entry"}
      </Link>
      {flash}
      <section className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-sky-50 to-blue-100 p-5 dark:border-blue-900/50 dark:from-blue-950/60 dark:to-slate-900">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} large />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">{student.name}</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              {classTitle(student.class, student.section)} · Roll No.{" "}
              {student.roll_no || "—"}
            </p>
            <p className={`mt-2 text-xs capitalize ${muted}`}>
              {student.gender || "Gender not recorded"}
            </p>
          </div>
        </div>
      </section>
      <nav className="grid grid-cols-3 border-b dark:border-slate-800">
        {(["Overview", "Marks Detail", "Progress"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`border-b-2 py-3 text-xs font-bold ${tab === v ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
          >
            {v}
          </button>
        ))}
      </nav>
      {tab === "Overview" ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Metric
              icon={GraduationCap}
              label="Current Grade"
              value={grade}
              tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10"
            />
            <Metric
              icon={TrendingUp}
              label="Average"
              value={average === null ? "—" : `${average}%`}
              tone="bg-blue-50 text-blue-700 dark:bg-blue-400/10"
            />
            <Metric
              icon={FileText}
              label="Exams"
              value={results.length}
              tone="bg-violet-50 text-violet-700 dark:bg-violet-400/10"
            />
          </div>
          <ResultList results={results} scale={data.school.grade_scale || []} />
        </>
      ) : tab === "Marks Detail" ? (
        <ResultList results={results} scale={data.school.grade_scale || []} />
      ) : (
        <Trend results={results} />
      )}
    </Shell>
  );
}
function ResultList({
  results,
  scale,
}: {
  results: { subject: Subject; mark: Mark; exam: Exam; percent: number }[];
  scale: GradeRule[];
}) {
  return (
    <section className={`${panel} overflow-hidden`}>
      <h2 className="p-4 font-extrabold">Exam Results</h2>
      <div className="divide-y dark:divide-slate-800">
        {results.map((r) => (
          <div
            key={r.subject.id}
            className="grid grid-cols-[1fr_auto] gap-3 p-3.5"
          >
            <div>
              <p className="text-sm font-bold">{r.exam.name}</p>
              <p className={`mt-1 text-[11px] ${muted}`}>
                {dateLabel(r.exam.start_date)} · {r.subject.subject_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold">
                {r.mark.marks} / {r.subject.full_marks}
              </p>
              <p className="mt-1 text-[11px] text-blue-600">
                {Math.round(r.percent * 10) / 10}% ·{" "}
                {gradeFromScale(r.percent, scale)}
              </p>
            </div>
          </div>
        ))}
        {!results.length && (
          <p className={`p-8 text-center text-sm ${muted}`}>
            No marks are available for this assigned subject.
          </p>
        )}
      </div>
    </section>
  );
}
function Trend({ results }: { results: { exam: Exam; percent: number }[] }) {
  if (!results.length)
    return (
      <p className={`py-16 text-center text-sm ${muted}`}>
        No saved results to plot.
      </p>
    );
  const points = results
    .map(
      (r, i) =>
        `${results.length === 1 ? 50 : (i / (results.length - 1)) * 100},${100 - r.percent}`,
    )
    .join(" ");
  return (
    <section className={`${panel} p-4`}>
      <h2 className="font-extrabold">Performance Trend</h2>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
        <svg
          viewBox="0 0 100 105"
          role="img"
          aria-label="Student result percentage trend"
          className="h-52 w-full overflow-visible"
        >
          <path
            d="M0 0H100M0 25H100M0 50H100M0 75H100M0 100H100"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth=".5"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {results.map((r, i) => (
            <circle
              key={r.exam.id}
              cx={results.length === 1 ? 50 : (i / (results.length - 1)) * 100}
              cy={100 - r.percent}
              r="2"
              fill="#2563eb"
            />
          ))}
        </svg>
        <div className="flex justify-between gap-2">
          {results.map((r) => (
            <span
              key={r.exam.id}
              className="min-w-0 flex-1 truncate text-center text-[9px] text-slate-500"
            >
              {r.exam.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-200 font-extrabold text-blue-700 dark:from-blue-950 dark:to-indigo-900 ${large ? "h-24 w-24 text-2xl" : "h-9 w-9 text-xs"}`}
    >
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}
